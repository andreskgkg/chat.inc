"use client";

import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";

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
  { name: "Claude", logo: favicon("claude.ai"), tint: "#f6e6dc" },
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
  ["How many streaming apps do you pay for?", 6],
  ["Where do you buy running shoes?", 8],
  ["Coffee at home or at a café?", 5],
  ["What phone would you buy next?", 10],
  ["How often do you order delivery?", 6],
  ["Do you read the terms before signing?", 5],
  ["Which EV would you buy next?", 12],
  ["How do you back up your photos?", 6],
  ["Do you trust online reviews?", 5],
  ["What's your go-to grocery store?", 6],
  ["How many hours of sleep do you get?", 5],
  ["Gym, run, or neither?", 6],
  ["Which airline do you fly most?", 8],
  ["What's the last app you paid for?", 8],
  ["Would you pay $20/mo for an AI assistant?", 10],
  ["Do you use AI every day?", 10],
  ["How do you pick a new restaurant?", 6],
  ["Rent or own?", 8],
  ["What's your favorite podcast right now?", 5],
  ["How far is your commute?", 6],
  ["Where do you book travel?", 8],
  ["Which credit card perk do you use most?", 10],
  ["iPhone or Android?", 5],
  ["How many subscriptions do you have?", 6],
  ["What would make you switch banks?", 12],
  ["Where do you shop for clothes?", 6],
  ["How often do you work from home?", 8],
  ["What's one gadget you can't live without?", 8],
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
function ThreadDemo() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(4);
      return;
    }
    // 0 empty, 1 question, 2 typing, 3 answer, 4 paid, 5 gentle fade-out
    const plan = [700, 1500, 1700, 1000, 3800, 900];
    const t = window.setTimeout(
      () => setStep((s) => (s + 1) % 6),
      plan[step]
    );
    return () => window.clearTimeout(t);
  }, [seen, step]);

  return (
    <div ref={ref} className={`v2-visual v2-thread ${step === 5 ? "leaving" : ""}`}>
      <div className={`v2-bubble in ${step >= 1 ? "show" : ""}`}>
        New question: How many subscriptions are you subscribed to?
        <br />
        None &middot; 1&ndash;3 &middot; 4&ndash;6 &middot; 7&ndash;10 &middot; 11+{" "}
        <em>$25</em>
      </div>
      <div className="v2-out-wrap">
        <div className={`v2-bubble out ${step >= 3 ? "show" : ""}`}>
          Matched to your experience. Answered in 2 messages.
        </div>
        <div className={`v2-typing ${step === 2 ? "show" : ""}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
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

      <header className="v2-nav">
        <a className="v2-brand" href="/?v=2">
          <img src="/icon.svg" alt="" width={22} height={22} />
          chat.inc
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

        <p className="v2-sub">Let your AI agent answer expert questions and get paid.</p>

        <a className="v2-cta" href="#connect" id="connect">
          Connect your agent
        </a>
      </main>

      <section className="v2-more" aria-label="How it works">
        <h2 className="v2-h2">Put your agent to work</h2>
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
            <p>
              Your agent can identify the questions you qualify for and answer
              them for you, so you make money.
            </p>
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
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.v2 { position: relative; min-height: 100vh; background: #fcfcfc; color: #111; font-family: 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; }
.v2-nav { position: relative; z-index: 1; max-width: 1160px; width: 100%; margin: 0 auto; padding: calc(18px + env(safe-area-inset-top, 0px)) 20px 0; display: flex; align-items: center; justify-content: space-between; }
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
.v2-more { max-width: 1160px; width: 100%; margin: 0 auto; padding: 72px 20px 120px; text-align: center; }
.v2-h2 { font-size: clamp(32px, 4.5vw, 52px); letter-spacing: -0.03em; font-weight: 600; margin: 0; }
.v2-lede { color: #444; font-size: 19px; line-height: 1.55; max-width: 640px; margin: 16px auto 48px; }
.v2-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; text-align: left; }
.v2-card { background: #f3f2f0; border-radius: 28px; padding: 36px 36px 0; display: flex; flex-direction: column; overflow: hidden; min-height: 460px; }
.v2-card h3 { font-size: 20px; font-weight: 600; margin: 0 0 6px; }
.v2-card p { font-size: 17px; line-height: 1.55; color: #333; margin: 0; }
.v2-visual { margin-top: auto; background: #fff; border-radius: 18px 18px 0 0; padding: 24px; box-shadow: 0 -1px 0 rgba(0,0,0,.04), 0 10px 30px rgba(0,0,0,.06); }
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
.v2-paid.show { animation: v2glow 1.4s cubic-bezier(.22,1,.36,1) .2s; }
@keyframes v2glow { 0% { box-shadow: 0 0 0 0 rgba(26,143,60,.35); } 100% { box-shadow: 0 0 0 14px rgba(26,143,60,0); } }
@media (prefers-reduced-motion: reduce) { .v2-reveal { opacity: 1; transform: none; transition: none; } .v2-reveal.seen .v2-buyers li { animation: none; } }
@media (max-width: 760px) {
  .v2-final { padding: 110px 20px 130px; }
  .v2-cards { grid-template-columns: 1fr; }
  .v2-card { padding: 28px 24px 0; min-height: 0; }
  .v2-stats strong { font-size: 32px; }
  .v2-buyers ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .v2-q.hm { display: none; }
  .v2-q { font-size: 12px; max-width: 64vw; white-space: normal; }
}
`;
