-- chat.inc backend schema (Postgres / Supabase)
-- Run this once in the Supabase SQL editor.
-- The app talks to these tables server-side with the service_role key, so we
-- enable RLS with no public policies (service_role bypasses RLS).

create extension if not exists "pgcrypto";

-- Keeps updated_at fresh on any row change.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- people: everyone who submits a phone number (leads -> approved experts)
-- ---------------------------------------------------------------------------
create table if not exists people (
  id                uuid primary key default gen_random_uuid(),
  phone             text unique not null,
  name              text,
  linkedin          text,
  identity          text,                       -- raw first reply (LinkedIn, etc.)
  status            text not null default 'awaiting_identity',
                    -- awaiting_identity | pending_approval | approved
                    -- | rejected | active | done
  stripe_account_id text,                       -- Stripe Connect Express account
  payout_ready      boolean not null default false, -- finished Stripe onboarding
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists people_status_idx on people (status);
create index if not exists people_created_idx on people (created_at desc);

drop trigger if exists people_set_updated_at on people;
create trigger people_set_updated_at
  before update on people
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- messages: every text in or out (this is "see all the texts")
-- ---------------------------------------------------------------------------
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid references people (id) on delete cascade,
  phone        text not null,
  direction    text not null check (direction in ('in', 'out')),
  body         text not null,
  provider     text default 'sendblue',
  provider_id  text,                            -- Sendblue message handle
  status       text,                            -- queued|sent|delivered|failed
  is_admin     boolean not null default false,  -- outbound sent to your own #
  created_at   timestamptz not null default now()
);

create index if not exists messages_person_idx on messages (person_id, created_at);
create index if not exists messages_created_idx on messages (created_at desc);

-- ---------------------------------------------------------------------------
-- questions: paid questions sent to approved people
-- ---------------------------------------------------------------------------
create table if not exists questions (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid references people (id) on delete cascade,
  text         text not null,
  amount_cents integer not null,                -- how much this question pays
  status       text not null default 'sent',    -- sent | answered | paid | skipped
  answer       text,
  sent_at      timestamptz not null default now(),
  answered_at  timestamptz,
  paid_at      timestamptz
);

create index if not exists questions_person_idx on questions (person_id, sent_at desc);
create index if not exists questions_status_idx on questions (status);

-- ---------------------------------------------------------------------------
-- payouts: Stripe transfers for answered questions
-- ---------------------------------------------------------------------------
create table if not exists payouts (
  id                 uuid primary key default gen_random_uuid(),
  person_id          uuid references people (id) on delete cascade,
  question_id        uuid references questions (id) on delete set null,
  amount_cents       integer not null,
  status             text not null default 'pending', -- pending | paid | failed
  stripe_transfer_id text,
  stripe_payout_id   text,
  error              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists payouts_person_idx on payouts (person_id, created_at desc);

drop trigger if exists payouts_set_updated_at on payouts;
create trigger payouts_set_updated_at
  before update on payouts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- settings: tweakable config (default reward amount, etc.)
-- ---------------------------------------------------------------------------
create table if not exists settings (
  key   text primary key,
  value text not null
);

insert into settings (key, value)
values ('default_amount_cents', '2500')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Lock everything down: only the service_role (server) can read/write.
-- ---------------------------------------------------------------------------
alter table people    enable row level security;
alter table messages  enable row level security;
alter table questions enable row level security;
alter table payouts   enable row level security;
alter table settings  enable row level security;
