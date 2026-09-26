"use client";

import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { AudienceToggle } from "./audience-toggle";

// Agents rotate through the headline. `logo` is a URL (null → monogram chip).
// To use a custom logo, drop a file in /public/agents/ and point `logo` at it.
const favicon = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const MUSE =
  "data:image/webp;base64,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";

const AGENTS: { name: string; logo: string | null; tint: string }[] = [
  { name: "Muse", logo: MUSE, tint: "#f3efe8" },
  { name: "Instinct", logo: "data:image/webp;base64,UklGRv4AAABXRUJQVlA4IPIAAABwCQCdASqAAIAAPlEmkEWjoiGTRAA4BQS0t26BUAF2RHiNsPbLvxM2QO42bOkqLeTbkLcn8vGUO1qZWMxJHAcniumAVIc5NhsOMRhwQFX9+bOqRUAA/vyoACE4RGAE397//W3tdbGP7vouVwWM7jHQGSa52W2I7/177XOPH0kdcd8MyS37LUsCR9oUWYKKA+WGcbdryoKfbyLuHREVc2XjX+R4yQhWJFgOKwfF7uM2/6jSThaviYDUDpl696jvRYjlNYAlk72tvYkTyAEkjQ37+MV6vgVqbnANC+volkka12lKmqyTMtegLX4G+kDbKAAAAA==", tint: "#ffffff" },
  { name: "Poke", logo: favicon("poke.com"), tint: "#eef0f3" },
  { name: "Codex", logo: favicon("chatgpt.com"), tint: "#eef0f3" },
  { name: "Claude", logo: "data:image/webp;base64,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", tint: "#ffffff" },
  { name: "Grokbot", logo: "data:image/webp;base64,UklGRowEAABXRUJQVlA4IIAEAABQGwCdASqAAIAAPmEulEckIqIhI5Sa8IAMCWkAE575XOjLRJv47TW7TwA0gUyT9e/OV9M+wX+tfWL/bf2Vf2QKKryV1eLUWv3orBUoYSy4TCsWEdrpvO8ffypbXwe901rEKskJ3Q6SB3nnGc4XsMa5mfd/xKPu+uss5/m7Dy31cdGst9wXmLmpJFeie3DODnECbI3H+zYOu9DpjZl/DhIZ4YQygbTrucGrpW/F3pt1aQLQv+XiZGcY+IZ107trs61/bu1GTHcdccV86dUIbStTkQO3NCc2D1YlXuykw6kqvDBf8AD++t3G5rl0ndB3N6b5pVu9dgO6/emKeuFU/+ZmSshuhZYv3H80isAnm5HCQ2Djpb9lufIP+0tWZoy9UuMZIaVGKVcdNMjpR+gGC3Ppu8Ce3/g6m1P+nS5ZBl4D1m9sdn1QmEId048f0u71Bxv6nh3/LLAibHe5OHv28pN/PgkQ+9MDktnbHW7TVLRKJWnYi6pSixmC3cjv0lXR2wM+OdK1An05SzSWVmQRXYxjNDuMEgx8ZAwOWyVl/sqpPXPB+IDxxhloTp2E+C6SZowXSF7Sy+iDltfBpOqGJ8ReUbL18VAUJzfOfRXC2ef6qJRrVW0Udk6zYp5/n/n71CrYtqUAP/lCm7a5M8qxDRUSr64ekXenN9aLXgwucxcYBsWENv/KOeBxoOfKlI+U8qy4446gAhMhpQ6UW1zt2y2n+VnqoQb+tpas8CoAFBhDfjb9+KDB34Erim04c+USNx7VYy9qPwbbRXwy1+Y9vUmB41RYmYgnVDKPSMLpJO3E3i9UBdszp/Ip6HWlOd6k52kPWzReqWbLmYHoOQ1Hal+CKKt0lJEWf2LgD5vD9R9gwc4LmuB/dsbPd+BzYlNPcVQ2uNOMWYe5Ik7O9f0TD2UPEQHSsnsZRRrNZCKLkXwOsl/P+faBzaADbpCN8N0W8RzkUdGCK5OpnF7T/PyyCIwUtPq4fX5tGLwhZDiwjIrvQizTUe95XQQty62PJvrIZM+kJ0qQZ5ZDCYKQAQUgDEtE0jUPMz/qXc223oNHiL3XpkjBwrY7n3rrWAE4vcBq6HnG/7twzqmiwP3oqZf2uOUxdjndp9ad2CQ3tS7uXORHGqP5NHahLVdTwSq6Jn5RE77QhQZeHIFNJ2cSy8TiJ7gozxqKhiAIhZ/BAQE3OnSM8qe6pGQQS78/1rgpNQ5VSBiQDqA4KCcF2eT+gGDP9WZPSGUpZ4dFRug6fEOmIdb7nl9gNjAPwSFdEj3X7UWQO8OWCOZ1RXnJrtTiR4I7oJ33T658GDsg57i/mArE+UxCHOfN2bAUGDVDh03toiv/+9pUzyBj4E9HNwlCxsfLs0mRbGV+cko7/pmmTJg0rtrq/Dfk66iKTaLwHoyaYcPRDQztwGaE3004IXwrVB9SA03jvGFRgGDVpFFLke9Q7KQ3ypN5ttJgWruaj92W8HS+YCVr+XypgcLxxJ7WCd82RydnvFGA/n3nPXpHa2C7fpZxLcd7q5r3x2G0tqP9/UAAAAA=", tint: "#111111" },
];

const BUYERS = [
  { name: "McKinsey", domain: "mckinsey.com", logo: "https://www.mckinsey.com/favicon.ico" },
  { name: "BCG", domain: "bcg.com" },
  { name: "Bain", domain: "bain.com" },
  { name: "Goldman Sachs", domain: "goldmansachs.com" },
  { name: "Morgan Stanley", domain: "morganstanley.com" },
  { name: "Blackstone", domain: "blackstone.com" },
];

const QUESTIONS: [string, number][] = [
  ["How many Amazon purchases do you make a month?", 6],
  ["Which AI agents do you use?", 10],
  ["Which airline do you fly the most?", 8],
  ["Do you use AI every day?", 5],
  ["iPhone or Android?", 5],
  ["Do you grocery shop online or in person?", 6],
  ["Subscribed to over or under 8 services a month?", 6],
  ["Which streaming app do you use?", 5],
  ["Do you pay for an AI assistant?", 8],
  ["Where do you book travel?", 8],
  ["Where do you book restaurant reservations?", 6],
  ["Which newsletters are you subscribed to?", 6],
  ["Do you have a gym membership?", 5],
];

// Slots sit around the edges so the headline stays clear.
type Slot = { left?: string; right?: string; top: string; tone: string; hideMobile?: boolean };
const SLOTS: Slot[] = [
  { left: "6%", top: "16%", tone: "b" },
  { left: "34%", top: "9%", tone: "p", hideMobile: true },
  { right: "6%", top: "14%", tone: "o", hideMobile: true },
  { left: "3%", top: "44%", tone: "p", hideMobile: true },
  { right: "3%", top: "40%", tone: "b", hideMobile: true },
  { left: "5%", top: "70%", tone: "o", hideMobile: true },
  { right: "6%", top: "68%", tone: "p", hideMobile: true },
  { left: "14%", top: "86%", tone: "p", hideMobile: true },
  { right: "12%", top: "86%", tone: "b" },
];

function QuestionField() {
  const [cells, setCells] = useState(() =>
    SLOTS.map((_, n) => ({ q: n, on: false }))
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCells((c) => c.map((x) => ({ ...x, on: true })));
      return;
    }
    let next = SLOTS.length;
    let tick = 0;
    const timers: number[] = [];
    // Stagger the first appearance.
    SLOTS.forEach((_, n) => {
      timers.push(
        window.setTimeout(() => {
          setCells((c) => c.map((x, k) => (k === n ? { ...x, on: true } : x)));
        }, 300 + n * 450)
      );
    });
    const id = window.setInterval(() => {
      const slot = tick % SLOTS.length;
      tick += 1;
      setCells((c) => c.map((x, k) => (k === slot ? { ...x, on: false } : x)));
      timers.push(
        window.setTimeout(() => {
          const q = next % QUESTIONS.length;
          next += 1;
          setCells((c) => c.map((x, k) => (k === slot ? { q, on: true } : x)));
        }, 1100)
      );
    }, 1500);
    return () => {
      window.clearInterval(id);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div className="v2-field" aria-hidden="true">
      <div className="v2-glow g1" />
      <div className="v2-glow g2" />
      <div className="v2-glow g3" />
      {cells.map((c, n) => {
        const s = SLOTS[n];
        const [text, price] = QUESTIONS[c.q];
        return (
          <div
            key={n}
            className={`v2-q t-${s.tone} ${c.on ? "on" : ""} ${s.hideMobile ? "hm" : ""}`}
            style={{ left: s.left, right: s.right, top: s.top }}
          >
            {text} <b>${price}</b>
          </div>
        );
      })}
    </div>
  );
}

function useInView<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

// Plays the question -> typing -> answer -> paid sequence on a slow loop.
const OPTIONS = ["None", "1\u20133", "4\u20136", "7\u201310", "11+"];
const PICK = 2;

// An assistant-style chat: the agent gets a paid question, taps an answer, gets paid.
function ThreadDemo() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [step, setStep] = useState(0);
  const claude = AGENTS.find((a) => a.name === "Claude");
  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(4);
      return;
    }
    // 0 empty, 1 question + options, 2 choosing, 3 answered, 4 paid, 5 fade-out
    const plan = [700, 1700, 900, 1300, 3600, 900];
    const t = window.setTimeout(
      () => setStep((s) => (s + 1) % 6),
      plan[step]
    );
    return () => window.clearTimeout(t);
  }, [seen, step]);

  return (
    <div ref={ref} className={`v2-visual v2-chat ${step === 5 ? "leaving" : ""}`}>
      <div className="v2-chat-bar">
        <span className="v2-chat-avatar" style={{ background: claude?.tint }}>
          {claude?.logo && <img src={claude.logo} alt="" width={20} height={20} />}
        </span>
        <span>Claude</span>
        <span className="v2-chat-sub">connected to chat.inc</span>
      </div>

      <div className={`v2-chat-msg ${step >= 1 ? "show" : ""}`}>
        <p className="v2-chat-lead">
          chat.inc found a paid question for you <b>$25</b>
        </p>
        <p className="v2-chat-q">How many subscriptions are you subscribed to?</p>
        <div className="v2-chat-opts" role="group" aria-label="Answer options">
          {OPTIONS.map((o, n) => (
            <span
              key={o}
              className={`v2-opt ${n === PICK && step === 2 ? "picking" : ""} ${
                n === PICK && step >= 3 ? "picked" : ""
              }`}
            >
              {o}
            </span>
          ))}
        </div>
      </div>

      <p className={`v2-chat-note ${step >= 3 ? "show" : ""}`}>
        Answered on your behalf based on your profile.
      </p>
      <div className={`v2-paid ${step >= 4 ? "show" : ""}`}>+$25.00 paid to you</div>
    </div>
  );
}

function Reveal({
  as: Tag = "div",
  className = "",
  delay = 0,
  children,
}: {
  as?: "div" | "article";
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref as Ref<never>}
      className={`${className} v2-reveal ${seen ? "seen" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

export function V2Home() {
  const [i, setI] = useState(0);
  const finalRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [widths, setWidths] = useState<number[]>([]);
  const heroRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [heroWidths, setHeroWidths] = useState<number[]>([]);

  useEffect(() => {
    const measure = () =>
      setWidths(finalRefs.current.map((el) => el?.offsetWidth ?? 0));
    const measureHero = () =>
      setHeroWidths(heroRefs.current.map((el) => el?.offsetWidth ?? 0));
    measureHero();
    document.fonts?.ready.then(measureHero);
    window.addEventListener("resize", measureHero);
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("resize", measureHero);
    };
  }, []);

  useEffect(() => {
    AGENTS.forEach((a) => {
      if (a.logo) new Image().src = a.logo;
    });
    const id = setInterval(() => {
      setI((n) => (n + 1) % AGENTS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);


  return (
    <div className="v2">
      <style>{css}</style>
      <QuestionField />

      <header className="v2-nav site-nav">
        <a className="nav-brand" href="/agents">
          <span className="nav-logo" aria-hidden="true" />
          chat.inc
        </a>
        <AudienceToggle active="agents" />
        <a className="site-signin" href="#connect">
          Sign in
        </a>
      </header>

      <main className="v2-main">
        <h1 className="v2-h1">
          <span className="v2-line1">
            <span
              className="v2-slot"
              aria-live="polite"
              style={heroWidths[i] ? { width: heroWidths[i] } : undefined}
            >
              {AGENTS.map((a, n) => (
                <span
                  key={a.name}
                  ref={(el) => {
                    heroRefs.current[n] = el;
                  }}
                  className={`v2-agent ${n === i ? "in" : "out"}`}
                  aria-hidden={n !== i}
                >
                  <span className="v2-name">{a.name}</span>
                  <span className="v2-chip" style={{ background: a.tint }}>
                    <img src={a.logo ?? ""} alt="" width={56} height={56} />
                  </span>
                </span>
              ))}
            </span>
            <span>makes</span>
          </span>
          you money
        </h1>

        <p className="v2-sub">Let your AI agent answer expert questions and online questionnaires and get paid.</p>

        <a className="v2-cta" href="#connect" id="connect">
          Connect your agent
        </a>
      </main>

      <section className="v2-more" aria-label="How it works">
        <h2 className="v2-h2">Let your agent work for you</h2>
        <p className="v2-lede">
          Connect your agent once. It finds questions you&apos;re qualified to
          answer, replies for you, and you get paid.
        </p>

        <div className="v2-cards">
          <Reveal as="article" className="v2-card c1">
            <h3>
              Companies pay $20B+ per year on market research
            </h3>
            <div className="v2-visual v2-buyers">
              <span className="v2-buyers-label">Who pays for answers today</span>
              <ul>
                {BUYERS.map((b) => (
                  <li key={b.name}>
                    <img src={b.logo ?? favicon(b.domain)} alt="" width={28} height={28} />
                    <span>{b.name}</span>
                  </li>
                ))}
              </ul>
              <small>
                ~$3B on expert networks (Inex One, 2025) &middot; $56B on market
                research incl. surveys (ESOMAR, 2024). Logos show the kinds of
                firms that buy expert research; they are not chat.inc customers.
              </small>
            </div>
          </Reveal>

          <Reveal as="article" className="v2-card c2" delay={120}>
            <h3>Let your agent answer questions on your behalf</h3>
            <ThreadDemo />
          </Reveal>
        </div>
      </section>

      <section className="v2-final" aria-label="Get started">
        <h2 className="v2-final-h">
          Try it on{" "}
          <span
            className="v2-slot"
            style={widths[i] ? { width: widths[i] } : undefined}
          >
            {AGENTS.map((a, n) => (
              <span
                key={a.name}
                ref={(el) => {
                  finalRefs.current[n] = el;
                }}
                className={`v2-agent ${n === i ? "in" : "out"}`}
                aria-hidden={n !== i}
              >
                <span className="v2-chip" style={{ background: a.tint }}>
                  <img src={a.logo ?? ""} alt="" width={56} height={56} />
                </span>
                <span>{a.name}</span>
              </span>
            ))}
          </span>{" "}
          today
        </h2>
        <p className="v2-final-sub">
          Works with Muse, Instinct, Poke, Codex, Claude and Grokbot.
        </p>
        <a className="v2-final-cta" href="#connect">
          Connect your agent
        </a>
      </section>

      <footer className="v2-footer">
        <a className="v2-brand" href="/agents">
          <img src="/icon.svg" alt="" width={20} height={20} />
          chat.inc
        </a>
        <nav aria-label="Footer">
          <a href="mailto:a@chat.inc?subject=Support">Support</a>
          <a href="#connect">Login</a>
          <a href="mailto:a@chat.inc?subject=Inquiry">Inquiries</a>
        </nav>
      </footer>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.v2 { position: relative; min-height: 100vh; background: #fcfcfc; color: #111; font-family: 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; }
.v2-nav { position: relative; z-index: 1; width: min(1120px, calc(100% - 56px)); margin: 0 auto; padding: calc(22px + env(safe-area-inset-top, 0px)) 0 14px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.v2-signin { white-space: nowrap; display: inline-flex; align-items: center; height: 38px; padding: 0 18px; border-radius: 999px; background: rgba(255,255,255,.8); box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); color: #111; font-size: 15px; font-weight: 500; text-decoration: none; backdrop-filter: blur(6px); transition: background .2s ease, box-shadow .2s ease; }
.v2-signin:hover { background: #fff; box-shadow: inset 0 0 0 1px rgba(0,0,0,.14), 0 4px 14px rgba(40,60,120,.08); }
.v2-brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 17px; color: #111; text-decoration: none; }
.v2-brand img { border-radius: 5px; }
.v2-main { position: relative; z-index: 1; flex: 1; min-height: calc(100vh - 60px); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px 96px; }
.v2-mark { border-radius: 20px; margin-bottom: 36px; }
.v2-h1 { font-size: clamp(40px, 7vw, 76px); line-height: 1.12; letter-spacing: -0.035em; font-weight: 500; margin: 0; }
.v2-slot { display: inline-grid; vertical-align: bottom; }
.v2-slot-end { justify-items: end; }
.v2-slot > .v2-agent { grid-area: 1 / 1; }
.v2-agent { display: inline-flex; align-items: center; gap: 0.18em; transition: opacity .42s cubic-bezier(.4,0,.2,1), transform .42s cubic-bezier(.4,0,.2,1), filter .42s cubic-bezier(.4,0,.2,1); will-change: opacity, transform, filter; }
.v2-agent.out { opacity: 0; transform: translateY(-0.12em) scale(.98); filter: blur(6px); }
.v2-agent.in { opacity: 1; transform: none; filter: blur(0); }
.v2-chip { width: 1.1em; height: 1.1em; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; }
.v2-chip img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.04); }
.v2-mono { font-size: .5em; font-weight: 700; color: #333; letter-spacing: 0; }
.v2-sub { margin: 36px 0 20px; color: #555; font-size: 18px; }
.v2-cta { display: inline-flex; align-items: center; justify-content: center; height: 46px; padding: 0 24px; border-radius: 999px; background: #2a63cd; color: #fff; font-size: 16px; font-weight: 500; text-decoration: none; transition: transform .15s ease, background .15s ease; }
.v2-cta:hover { background: #2356b5; transform: translateY(-1px); }
.v2-agents { list-style: none; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; padding: 0; margin: 28px 0 0; }
.v2-agents li { font-size: 13px; color: #777; padding: 5px 11px; border-radius: 999px; background: #efefef; transition: background .2s, color .2s; }
.v2-agents li.on { background: #111; color: #fff; }
.v2-more { max-width: 1260px; width: 100%; margin: 0 auto; padding: 72px 20px 120px; text-align: center; }
.v2-h2 { font-size: clamp(32px, 4.5vw, 52px); letter-spacing: -0.03em; font-weight: 600; margin: 0; }
.v2-lede { color: #444; font-size: 19px; line-height: 1.55; max-width: 640px; margin: 16px auto 48px; }
.v2-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: auto 1fr; column-gap: 20px; row-gap: 0; text-align: left; }
.v2-card { background: #f3f2f0; border-radius: 28px; padding: 36px 36px 0; display: grid; grid-row: span 2; grid-template-rows: subgrid; row-gap: 0; overflow: hidden; }
.v2-card h3 { font-size: 20px; font-weight: 600; margin: 0; align-self: start; }
.v2-card p { font-size: 17px; line-height: 1.55; color: #333; margin: 0; }
.v2-visual { margin-top: 24px; align-self: stretch; background: #fff; border-radius: 18px 18px 0 0; padding: 24px; box-shadow: 0 -1px 0 rgba(0,0,0,.04), 0 10px 30px rgba(0,0,0,.06); }
.v2-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.v2-stats div { background: #f7f7f7; border-radius: 14px; padding: 18px; }
.v2-stats strong { display: block; font-size: 40px; letter-spacing: -0.03em; font-weight: 600; }
.v2-stats span { display: block; font-size: 14px; color: #666; margin-top: 4px; line-height: 1.4; }
.v2-stats small { grid-column: 1 / -1; font-size: 11px; color: #999; }
.v2-buyers-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #888; margin-bottom: 14px; }
.v2-buyers ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.v2-buyers li { background: #f7f7f7; border-radius: 12px; padding: 14px 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; font-size: 14px; font-weight: 600; color: #333; letter-spacing: -0.01em; }
.v2-buyers li img { width: 28px; height: 28px; border-radius: 6px; object-fit: contain; }
.v2-buyers small { display: block; margin-top: 14px; font-size: 11px; color: #999; line-height: 1.5; }
.v2-thread { display: flex; flex-direction: column; gap: 10px; }
.v2-bubble { max-width: 86%; padding: 11px 15px; border-radius: 20px; font-size: 15px; line-height: 1.4; }
.v2-bubble.in { background: #e9e9eb; color: #111; align-self: flex-start; border-bottom-left-radius: 6px; }
.v2-bubble.in em { font-style: normal; font-weight: 700; color: #1a8f3c; margin-left: 4px; }
.v2-bubble.out { background: #0a84ff; color: #fff; align-self: flex-end; border-bottom-right-radius: 6px; }
.v2-paid { align-self: center; margin-top: 6px; font-size: 13px; font-weight: 600; color: #1a8f3c; background: #e7f6ec; padding: 6px 12px; border-radius: 999px; }
.v2-final { position: relative; overflow: hidden; text-align: center; padding: 160px 20px 180px; background:
  radial-gradient(60% 80% at 0% 100%, #3b5bdb 0%, rgba(59,91,219,0) 55%),
  radial-gradient(70% 90% at 100% 100%, #7c6cf2 0%, rgba(124,108,242,0) 60%),
  radial-gradient(90% 70% at 50% 110%, #b9b6f7 0%, rgba(185,182,247,0) 70%),
  linear-gradient(180deg, #fafafa 0%, #f1f0fd 45%, #d9d6fb 100%); }
.v2-final-h { font-size: clamp(34px, 5.2vw, 64px); letter-spacing: -0.03em; font-weight: 500; margin: 0; }
.v2-final-h { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; column-gap: .26em; }
.v2-line1 { display: flex; justify-content: center; align-items: center; column-gap: .22em; }
.v2-line1 .v2-slot { justify-items: start; transition: width .42s cubic-bezier(.4,0,.2,1); }
.v2-line1 .v2-agent { white-space: nowrap; }
.v2-final-h .v2-slot { justify-items: start; transition: width .42s cubic-bezier(.4,0,.2,1); }
.v2-final-h .v2-agent { white-space: nowrap; }
.v2-final-h .v2-chip { width: 1em; height: 1em; }
.v2-final-sub { margin: 18px 0 30px; font-size: 18px; color: #222; }
.v2-final-cta { display: inline-flex; align-items: center; height: 50px; padding: 0 26px; border-radius: 999px; background: #2a63cd; color: #fff; font-size: 16px; font-weight: 500; text-decoration: none; transition: transform .15s ease; }
.v2-final-cta:hover { transform: translateY(-1px); }
.v2-field { position: absolute; top: 0; left: 0; right: 0; height: 100vh; min-height: 640px; overflow: hidden; z-index: 0; pointer-events: none; }
.v2-glow { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .55; animation: v2drift 28s ease-in-out infinite alternate; }
.v2-glow.g1 { width: 46vw; height: 46vw; left: -10vw; top: -8vw; background: #b9ccff; }
.v2-glow.g2 { width: 40vw; height: 40vw; right: -8vw; top: 10%; background: #d9c8ff; animation-duration: 34s; animation-direction: alternate-reverse; }
.v2-glow.g3 { width: 44vw; height: 34vw; left: 26%; bottom: -16vw; background: #ffd9c4; animation-duration: 40s; }
@keyframes v2drift { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(4vw,3vw,0) scale(1.08); } }
.v2-q { position: absolute; padding: 9px 14px; border-radius: 18px; border-bottom-left-radius: 6px; font-size: 14px; line-height: 1.3; color: #2a2a2a; background: rgba(255,255,255,.72); box-shadow: 0 6px 24px rgba(40,60,120,.08); backdrop-filter: blur(6px); white-space: nowrap; opacity: 0; transform: translateY(10px) scale(.97); transition: opacity 1s ease, transform 1.2s cubic-bezier(.2,.7,.2,1); }
.v2-q.on { opacity: .9; transform: none; }
.v2-q b { font-weight: 600; margin-left: 4px; }
.v2-q.t-b b { color: #2a63cd; }
.v2-q.t-p b { color: #7b5ce0; }
.v2-q.t-o b { color: #d0703f; }
@media (prefers-reduced-motion: reduce) { .v2-glow { animation: none; } .v2-q { transition: none; } }
.v2-card.c1 { background: linear-gradient(160deg, #eaf0ff 0%, #f4f2ff 55%, #f7f5f2 100%); }
.v2-card.c2 { background: linear-gradient(200deg, #fff0e6 0%, #f6f0ff 55%, #f7f5f2 100%); }
.v2-reveal { opacity: 0; transform: translateY(24px); transition: opacity .8s ease, transform .9s cubic-bezier(.2,.7,.2,1); }
.v2-reveal.seen { opacity: 1; transform: none; }
.v2-buyers li { transition: transform .25s ease, box-shadow .25s ease, background .25s ease; }
.v2-buyers li:hover { transform: translateY(-3px); background: #fff; box-shadow: 0 8px 20px rgba(40,60,120,.10); }
.v2-reveal.seen .v2-buyers li { animation: v2pop .6s cubic-bezier(.2,.7,.2,1) both; }
.v2-reveal.seen .v2-buyers li:nth-child(2) { animation-delay: .08s; }
.v2-reveal.seen .v2-buyers li:nth-child(3) { animation-delay: .16s; }
.v2-reveal.seen .v2-buyers li:nth-child(4) { animation-delay: .24s; }
.v2-reveal.seen .v2-buyers li:nth-child(5) { animation-delay: .32s; }
.v2-reveal.seen .v2-buyers li:nth-child(6) { animation-delay: .40s; }
@keyframes v2pop { from { opacity: 0; transform: translateY(10px) scale(.96); } to { opacity: 1; transform: none; } }
.v2-thread { min-height: 250px; }
.v2-thread .v2-bubble, .v2-thread .v2-paid, .v2-thread .v2-typing { opacity: 0; transform: translateY(12px) scale(.97); transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); will-change: opacity, transform; }
.v2-thread .v2-bubble.in { transform-origin: bottom left; }
.v2-thread .v2-bubble.out, .v2-thread .v2-typing { transform-origin: bottom right; }
.v2-thread .show { opacity: 1; transform: none; }
.v2-thread.leaving .v2-bubble, .v2-thread.leaving .v2-paid { opacity: 0; transform: translateY(-6px); transition-duration: .8s; }
.v2-out-wrap { position: relative; align-self: flex-end; max-width: 86%; display: flex; justify-content: flex-end; }
.v2-out-wrap .v2-bubble.out { max-width: 100%; }
.v2-typing { position: absolute; right: 0; top: 0; display: inline-flex; gap: 4px; padding: 13px 15px; border-radius: 18px; border-bottom-right-radius: 6px; background: #0a84ff; pointer-events: none; }
.v2-typing.show { transition-duration: .45s; }
.v2-typing i { width: 6px; height: 6px; border-radius: 50%; background: #fff; opacity: .5; animation: v2dot 1s infinite ease-in-out; }
.v2-typing i:nth-child(2) { animation-delay: .15s; }
.v2-typing i:nth-child(3) { animation-delay: .3s; }
@keyframes v2dot { 0%, 80%, 100% { opacity: .35; transform: none; } 40% { opacity: 1; transform: translateY(-3px); } }
.v2-chat { background: #faf9f5; display: flex; flex-direction: column; gap: 14px; min-height: 250px; color: #2b2a26; }
.v2-chat-bar { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; padding-bottom: 12px; border-bottom: 1px solid #ebe7de; }
.v2-chat-avatar { width: 24px; height: 24px; border-radius: 7px; overflow: hidden; display: inline-flex; }
.v2-chat-avatar img { width: 100%; height: 100%; object-fit: cover; }
.v2-chat-sub { font-weight: 400; color: #8a8578; font-size: 13px; }
.v2-chat p { margin: 0; }
.v2-chat .v2-chat-lead { font-size: 14px; color: #6b665b; }
.v2-chat-lead b { color: #1a8f3c; font-weight: 700; margin-left: 2px; }
.v2-chat .v2-chat-q { font-size: 17px; font-weight: 600; margin-top: 6px; line-height: 1.35; color: #2b2a26; }
.v2-chat-opts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.v2-opt { padding: 8px 14px; border-radius: 10px; background: #fff; border: 1px solid #e3ded3; font-size: 14px; font-weight: 500; color: #3d3a33; transition: background .5s cubic-bezier(.22,1,.36,1), border-color .5s ease, color .5s ease, transform .5s cubic-bezier(.22,1,.36,1), box-shadow .5s ease; }
.v2-opt.picking { border-color: #d97757; box-shadow: 0 0 0 4px rgba(217,119,87,.14); transform: translateY(-1px); }
.v2-opt.picked { background: #d97757; border-color: #d97757; color: #fff; box-shadow: 0 6px 16px rgba(217,119,87,.28); }
.v2-chat .v2-chat-note { font-size: 14px; color: #6b665b; }
.v2-chat .v2-chat-msg, .v2-chat .v2-chat-note, .v2-chat .v2-paid { opacity: 0; transform: translateY(10px); transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); }
.v2-chat .show { opacity: 1; transform: none; }
.v2-chat.leaving .v2-chat-msg, .v2-chat.leaving .v2-chat-note, .v2-chat.leaving .v2-paid { opacity: 0; transform: translateY(-6px); transition-duration: .8s; }
.v2-chat .v2-paid { align-self: flex-start; margin-top: 0; }
.v2-paid.show { animation: v2glow 1.4s cubic-bezier(.22,1,.36,1) .2s; }
@keyframes v2glow { 0% { box-shadow: 0 0 0 0 rgba(26,143,60,.35); } 100% { box-shadow: 0 0 0 14px rgba(26,143,60,0); } }
@media (prefers-reduced-motion: reduce) { .v2-reveal { opacity: 1; transform: none; transition: none; } .v2-reveal.seen .v2-buyers li { animation: none; } }
.v2-footer { max-width: 1260px; width: 100%; margin: 0 auto; padding: 28px 20px calc(28px + env(safe-area-inset-bottom, 0px)); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; border-top: 1px solid rgba(0,0,0,.06); }
.v2-footer nav { display: flex; gap: 28px; }
.v2-footer nav a { color: #555; font-size: 15px; text-decoration: none; transition: color .2s ease; }
.v2-footer nav a:hover { color: #2a63cd; }
@media (max-width: 640px) { .v2-nav { width: calc(100% - 28px); padding-top: calc(20px + env(safe-area-inset-top, 0px)); } }
@media (max-width: 760px) {
  .v2-final { padding: 110px 20px 130px; }
  .v2-cards { grid-template-columns: 1fr; grid-template-rows: none; row-gap: 20px; }
  .v2-card { padding: 28px 24px 0; min-height: 0; }
  .v2-stats strong { font-size: 32px; }
  .v2-buyers ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .v2-q.hm { display: none; }
  .v2-q { font-size: 12px; max-width: 64vw; white-space: normal; }
}
`;
