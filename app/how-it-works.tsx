"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Bubble =
  | { kind: "them"; text: string }
  | { kind: "me"; text: string }
  | { kind: "cash"; amount: string; note: string };

type Step = {
  title: string;
  desc: string;
  bubbles: Bubble[];
};

const STEPS: Step[] = [
  {
    title: "Create your profile",
    desc: "Text us your number and confirm who you are with your LinkedIn. That's the whole signup.",
    bubbles: [
      { kind: "them", text: "Welcome to chat.inc" },
      { kind: "them", text: "Reply with your LinkedIn so we know who you are." },
      { kind: "me", text: "linkedin.com/in/eo18dn-3i233" },
    ],
  },
  {
    title: "Get questions",
    desc: "We text you short, paid questions in your area of expertise — whenever we have a good one.",
    bubbles: [
      { kind: "them", text: "You're verified. Here's your first paid question:" },
      { kind: "them", text: "How was your experience using Profound AI (AI SEO)? (Up to $25)" },
    ],
  },
  {
    title: "Answer",
    desc: "Have an opinion? Reply in a sentence or two. If not, just ignore it — no pressure.",
    bubbles: [
      {
        kind: "me",
        text: "It was okay, it seems to do the same as its competitors but is more expensive so we switched",
      },
    ],
  },
  {
    title: "Get paid",
    desc: "Get paid instantly over Apple Cash for every answer. Stay anonymous the whole time.",
    bubbles: [
      { kind: "cash", amount: "$25", note: "Sent" },
      { kind: "me", text: "yayyy" },
    ],
  },
];

const AUTOPLAY_MS = 3500;

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Cycle through the steps on a timer until the user clicks one.
  useEffect(() => {
    if (!autoplay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % STEPS.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplay]);

  // All messages revealed so far. The thread auto-scrolls to the newest
  // message so older ones slide up and fade off the top.
  const visible = STEPS.slice(0, active + 1).flatMap((step, s) =>
    step.bubbles.map((bubble, i) => ({ bubble, i, key: `${s}-${i}` })),
  );

  const threadRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    const target = Math.max(0, el.scrollHeight - el.clientHeight);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduce || Math.abs(target - el.scrollTop) < 1) {
      el.scrollTop = target;
      return;
    }

    const start = el.scrollTop;
    const change = target - start;
    const t0 = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 650);
      el.scrollTop = start + change * ease(t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div className="hiw">
      <div className="hiw-phone" aria-hidden="true">
        <div className="hiw-screen">
          <span className="hiw-island" />
          <div className="hiw-statusbar">
            <span className="hiw-time">9:41</span>
            <span className="hiw-status-icons">
              <svg className="hiw-si" viewBox="0 0 18 12" aria-hidden="true">
                <rect x="0" y="8" width="3" height="4" rx="1" />
                <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                <rect x="10" y="3" width="3" height="9" rx="1" />
                <rect x="15" y="0.5" width="3" height="11.5" rx="1" />
              </svg>
              <svg className="hiw-si" viewBox="0 0 16 13" aria-hidden="true">
                <path d="M8 3c2.5 0 4.8 1 6.5 2.6a.6.6 0 0 0 .9 0l.4-.5a.7.7 0 0 0 0-1A11.4 11.4 0 0 0 8 .8 11.4 11.4 0 0 0 .2 4.1a.7.7 0 0 0 0 1l.4.5a.6.6 0 0 0 .9 0A9.2 9.2 0 0 1 8 3z" />
                <path d="M8 6.9c1.4 0 2.7.6 3.6 1.5a.6.6 0 0 0 .9 0l.5-.6a.7.7 0 0 0 0-.9A7.2 7.2 0 0 0 8 4.6a7.2 7.2 0 0 0-5 2.3.7.7 0 0 0 0 .9l.5.6a.6.6 0 0 0 .9 0A5 5 0 0 1 8 6.9z" />
                <circle cx="8" cy="10.8" r="1.6" />
              </svg>
              <svg className="hiw-bat" viewBox="0 0 28 13" aria-hidden="true">
                <rect x="0.5" y="0.5" width="24" height="12" rx="3.6" fill="none" stroke="currentColor" strokeOpacity="0.35" />
                <rect x="2" y="2" width="19" height="9" rx="2.2" />
                <path d="M26 4.3c1 .4 1 4 0 4.4z" />
              </svg>
            </span>
          </div>
          <span className="hiw-back" aria-hidden="true">
            <svg viewBox="0 0 12 20">
              <path
                d="M10 1 2 10l8 9"
                fill="none"
                stroke="#111"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="hiw-chat-head">
            <span className="hiw-avatar" />
            <span className="hiw-peer-name">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="8" fill="#9aa0a6" />
                <path d="M6.9 10.6 4.6 8.3l.95-.95 1.35 1.35 3.2-3.2.95.95z" fill="#fff" />
              </svg>
              chat.inc
              <svg className="hiw-fwd" viewBox="0 0 8 14" aria-hidden="true">
                <path
                  d="M1 1l6 6-6 6"
                  fill="none"
                  stroke="#b8b8bd"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          <div className="hiw-thread" ref={threadRef}>
            {visible.map(({ bubble, i, key }) => {
              const delay = `${i * 120}ms`;
            if (bubble.kind === "cash") {
              return (
                  <div
                    key={key}
                    className="hiw-msg hiw-cash"
                    style={{ animationDelay: delay }}
                  >
                  <span className="hiw-cash-top">
                    <svg viewBox="0 0 14 17" width="10" height="12" fill="currentColor" aria-hidden="true">
                      <path d="M11.7 9c0-1.5.8-2.5 1.9-3.1-.7-1-1.7-1.5-3-1.6-1.3-.1-2.6.7-3 .7-.5 0-1.6-.7-2.6-.7C3.2 4.4 1.5 5.6 1.5 8c0 1.2.2 2.4.7 3.7.6 1.7 1.9 3.7 3 3.7.5 0 .9-.4 1.9-.4s1.3.4 1.9.4c1.1 0 2.3-1.9 2.9-3.6-1.4-.5-2.1-1.6-2.1-2.8zM9.4 3.1c.6-.7.9-1.6.8-2.5-.8.1-1.6.5-2.1 1.1-.5.6-.9 1.4-.8 2.3.9.1 1.6-.3 2.1-.9z" />
                    </svg>
                    Cash
                  </span>
                  <span className="hiw-cash-amt">{bubble.amount}</span>
                  <span className="hiw-cash-note">{bubble.note}</span>
                </div>
              );
            }
            if (bubble.kind === "me") {
              return (
                <div
                  key={key}
                  className="hiw-msg hiw-msg-me"
                  style={{ animationDelay: delay }}
                >
                  {bubble.text}
                </div>
              );
            }
            return (
              <div
                key={key}
                className="hiw-msg hiw-msg-them"
                style={{ animationDelay: delay }}
              >
                {bubble.text}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      <ol className="hiw-steps">
        {STEPS.map((step, index) => {
          const open = index === active;
          return (
            <li key={step.title} className={`hiw-step ${open ? "is-open" : ""}`}>
              <button
                type="button"
                className="hiw-step-head"
                aria-expanded={open}
                onClick={() => {
                  setAutoplay(false);
                  setActive(index);
                }}
              >
                <span className="hiw-step-num">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="hiw-step-title">{step.title}</span>
                <span className="hiw-step-mark" aria-hidden="true" />
              </button>
              {open && (
                <div className="hiw-step-body">
                  <p>{step.desc}</p>
                </div>
              )}
              {open && autoplay && (
                <span
                  key={active}
                  className="hiw-progress"
                  style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
