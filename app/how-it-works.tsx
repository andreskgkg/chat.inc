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
      { kind: "me", text: "www.linkedin.com/in/andreskg" },
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
  const innerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);

  // Spring the thread up when new messages arrive (Apple-style overshoot
  // and settle), clipping older messages at the top.
  useIsoLayoutEffect(() => {
    const view = threadRef.current;
    const inner = innerRef.current;
    if (!view || !inner) return;
    const targetY = -Math.max(0, inner.scrollHeight - view.clientHeight);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduce) {
      posRef.current = targetY;
      inner.style.transform = `translateY(${targetY}px)`;
      return;
    }

    let pos = posRef.current;
    let vel = 0;
    const stiffness = 220;
    const damping = 19;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.032) dt = 0.032;
      vel += (-stiffness * (pos - targetY) - damping * vel) * dt;
      pos += vel * dt;
      posRef.current = pos;
      inner.style.transform = `translateY(${pos}px)`;
      if (Math.abs(targetY - pos) > 0.3 || Math.abs(vel) > 2) {
        raf = requestAnimationFrame(tick);
      } else {
        posRef.current = targetY;
        inner.style.transform = `translateY(${targetY}px)`;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  // Continuous progress rail: the fill flows down to the active step's
  // bottom over the autoplay interval (reset to the top when it loops).
  const stepsRef = useRef<HTMLOListElement>(null);
  const prevActiveRef = useRef(0);
  const loopTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useIsoLayoutEffect(() => {
    const list = stepsRef.current;
    if (!list) return;
    const activeLi = list.children[active] as HTMLElement | undefined;
    if (!activeLi) return;
    const target = activeLi.offsetTop + activeLi.offsetHeight;
    const looped = active < prevActiveRef.current;
    prevActiveRef.current = active;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const set = (k: string, v: string) => list.style.setProperty(k, v);

    clearTimeout(loopTimer.current);

    if (!autoplay || reduce) {
      set("--fill-dur", "0ms");
      set("--fill-op", "1");
      set("--fill", `${target}px`);
      return;
    }

    const advance = () => {
      set("--fill-op", "1");
      set("--fill-dur", `${AUTOPLAY_MS}ms`);
      set("--fill", `${target}px`);
    };

    if (looped) {
      // Fade the full rail out, reset to the top, then advance again —
      // so it never visibly slides backward on loop.
      set("--fill-op", "0");
      loopTimer.current = setTimeout(() => {
        set("--fill-dur", "0ms");
        set("--fill", "0px");
        void list.offsetHeight;
        advance();
      }, 260);
    } else {
      advance();
    }

    return () => clearTimeout(loopTimer.current);
  }, [active, autoplay]);

  return (
    <div className="hiw">
      <div className="hiw-chat" aria-hidden="true">
        <div className="hiw-chat-head">
          <span className="hiw-avatar" />
          <span className="hiw-peer-name">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="8" fill="#9aa0a6" />
              <path d="M6.9 10.6 4.6 8.3l.95-.95 1.35 1.35 3.2-3.2.95.95z" fill="#fff" />
            </svg>
            chat.inc
          </span>
        </div>

        <div className="hiw-thread" ref={threadRef}>
          <div className="hiw-thread-inner" ref={innerRef}>
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

      <ol className="hiw-steps" ref={stepsRef}>
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
            </li>
          );
        })}
      </ol>
    </div>
  );
}
