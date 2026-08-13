import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  getDefaultAmountCents,
  getPersonById,
  listMessages,
  listPayouts,
  listQuestions,
} from "@/lib/db";
import { formatAmount } from "@/lib/messages";
import { displayPhone } from "@/lib/phone";
import {
  approveAction,
  onboardingAction,
  payAction,
  rejectAction,
  sendQuestionAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function PersonDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const person = await getPersonById(id);
  if (!person) notFound();

  const [messages, questions, payouts, defaultCents] = await Promise.all([
    listMessages(id),
    listQuestions(id),
    listPayouts(id),
    getDefaultAmountCents(),
  ]);
  const defaultDollars = (defaultCents / 100).toFixed(2);
  const canSend = person.status === "active" || person.status === "approved";

  return (
    <main className="admin">
      <header className="admin-top">
        <div>
          <Link href="/admin" className="admin-back">
            ← People
          </Link>
          <h1>{displayPhone(person.phone)}</h1>
          <p className="admin-sub">
            <span className={`admin-badge s-${person.status}`}>
              {person.status.replace(/_/g, " ")}
            </span>{" "}
            · {person.payout_ready ? "payout ready" : "payout not set up"}
          </p>
          {person.linkedin ? (
            <p className="admin-sub">
              <a href={person.linkedin} target="_blank" rel="noreferrer">
                {person.linkedin}
              </a>
            </p>
          ) : person.identity ? (
            <p className="admin-sub">{person.identity}</p>
          ) : null}
        </div>
      </header>

      <div className="admin-cols">
        <section className="admin-panel">
          <h2>Conversation</h2>
          <div className="admin-thread">
            {messages.length === 0 ? (
              <p className="admin-empty">No messages yet.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`admin-msg ${m.direction}`}>
                  <div className="admin-bubble">{m.body}</div>
                  <div className="admin-msg-meta">
                    {m.direction === "out" ? "you" : "them"}
                    {m.status ? ` · ${m.status}` : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="admin-panel">
          {person.status === "pending_approval" ? (
            <div className="admin-block">
              <h2>Approve</h2>
              <form action={approveAction} className="admin-form">
                <input type="hidden" name="id" value={person.id} />
                <label>First question (optional)</label>
                <textarea
                  name="question"
                  rows={3}
                  placeholder="Leave blank to approve without sending a question yet"
                />
                <label>Amount ($)</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  defaultValue={defaultDollars}
                />
                <div className="admin-actions">
                  <button type="submit" className="admin-primary">
                    Approve
                  </button>
                </div>
              </form>
              <form action={rejectAction}>
                <input type="hidden" name="id" value={person.id} />
                <button type="submit" className="admin-danger">
                  Reject
                </button>
              </form>
            </div>
          ) : null}

          {canSend ? (
            <div className="admin-block">
              <h2>Send a question</h2>
              <form action={sendQuestionAction} className="admin-form">
                <input type="hidden" name="id" value={person.id} />
                <textarea
                  name="question"
                  rows={3}
                  placeholder="Type a question…"
                  required
                />
                <label>Amount ($)</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  defaultValue={defaultDollars}
                />
                <div className="admin-actions">
                  <button type="submit" className="admin-primary">
                    Send question
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          <div className="admin-block">
            <h2>Questions &amp; payouts</h2>
            {questions.length === 0 ? (
              <p className="admin-empty">No questions sent.</p>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="admin-q">
                  <div className="admin-q-top">
                    <span className={`admin-badge s-${q.status}`}>
                      {q.status}
                    </span>
                    <span className="admin-q-amount">
                      {formatAmount(q.amount_cents)}
                    </span>
                  </div>
                  <p className="admin-q-text">{q.text}</p>
                  {q.answer ? (
                    <p className="admin-q-answer">“{q.answer}”</p>
                  ) : null}
                  {q.status === "answered" ? (
                    <form action={payAction} className="admin-pay">
                      <input type="hidden" name="id" value={person.id} />
                      <input type="hidden" name="questionId" value={q.id} />
                      <input
                        type="number"
                        name="amount"
                        step="0.01"
                        min="0"
                        defaultValue={(q.amount_cents / 100).toFixed(2)}
                      />
                      <button type="submit" className="admin-primary">
                        {person.payout_ready ? "Pay" : "Send payout setup"}
                      </button>
                    </form>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {!person.payout_ready ? (
            <div className="admin-block">
              <h2>Payout setup</h2>
              <p className="admin-sub">
                They haven&apos;t connected a payout method yet.
              </p>
              <form action={onboardingAction}>
                <input type="hidden" name="id" value={person.id} />
                <button type="submit" className="admin-ghost">
                  Text them the setup link
                </button>
              </form>
            </div>
          ) : null}

          {payouts.length ? (
            <div className="admin-block">
              <h2>Payout history</h2>
              {payouts.map((p) => (
                <div key={p.id} className="admin-payout">
                  <span className={`admin-badge s-${p.status}`}>
                    {p.status}
                  </span>
                  <span>{formatAmount(p.amount_cents)}</span>
                  {p.error ? <span className="admin-err">{p.error}</span> : null}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
