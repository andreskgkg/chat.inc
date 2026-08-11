"use client";

import { useState } from "react";

type Bubble =
  | { kind: "them" | "me"; text: string }
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
      { kind: "them", text: "Welcome to chat.inc 👋" },
      { kind: "them", text: "Reply with your LinkedIn so we know who you are." },
      { kind: "me", text: "linkedin.com/in/andres" },
    ],
  },
  {
    title: "Get questions",
    desc: "We text you short, paid questions in your area of expertise — whenever we have a good one.",
    bubbles: [
      { kind: "them", text: "You're verified. Here's your first paid question:" },
      { kind: "them", text: "How was your experience using Profound (AI SEO)? ($25)" },
    ],
  },
  {
    title: "Answer",
    desc: "Have an opinion? Reply in a sentence or two. If not, just ignore it — no pressure.",
    bubbles: [
      {
        kind: "me",
        text: "It was okay — seems to do the same as competitors but is pricier, so we switched.",
      },
    ],
  },
  {
    title: "Get paid",
    desc: "Get paid instantly over Apple Cash for every answer. Stay anonymous the whole time.",
    bubbles: [{ kind: "cash", amount: "$25", note: "Sent" }],
  },
];

function StatusIcons() {
  return (
    <span className="hiw-status-icons">
      <svg viewBox="0 0 18 12" fill="#000" aria-hidden="true">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg viewBox="0 0 16 12" fill="#000" aria-hidden="true">
        <path d="M8 2.3c2.5 0 4.7 1 6.4 2.6l-1.5 1.5A6.9 6.9 0 0 0 8 4.4a6.9 6.9 0 0 0-4.9 2L1.6 4.9A9 9 0 0 1 8 2.3z" />
        <path d="M8 6.2c1.4 0 2.6.5 3.6 1.5l-1.6 1.6A2.9 2.9 0 0 0 8 8.3c-.8 0-1.5.3-2 .9L4.4 7.6A5 5 0 0 1 8 6.2z" />
        <circle cx="8" cy="10.6" r="1.4" />
      </svg>
      <svg viewBox="0 0 27 13" aria-hidden="true">
        <rect x="0.5" y="0.5" width="22" height="12" rx="3.6" fill="none" stroke="#000" strokeOpacity="0.35" />
        <rect x="2" y="2" width="18.5" height="9" rx="2.2" fill="#000" />
        <rect x="24" y="4" width="1.8" height="5" rx="0.9" fill="#000" opacity="0.4" />
      </svg>
    </span>
  );
}

function PhoneFrame() {
  return (
    <svg
      className="hiw-frame-svg"
      viewBox="0 0 372 762"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hiwTitanium" x1="0" y1="0" x2="1" y2="0.05">
          <stop offset="0" stopColor="#edeff2" />
          <stop offset="0.1" stopColor="#a5a9b0" />
          <stop offset="0.28" stopColor="#f4f5f7" />
          <stop offset="0.5" stopColor="#bfc3c9" />
          <stop offset="0.72" stopColor="#eef0f2" />
          <stop offset="0.9" stopColor="#a8acb3" />
          <stop offset="1" stopColor="#e6e8eb" />
        </linearGradient>
        <linearGradient id="hiwBtn" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8b8f96" />
          <stop offset="0.5" stopColor="#cbced3" />
          <stop offset="1" stopColor="#8b8f96" />
        </linearGradient>
        <radialGradient id="hiwLens" cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#3a4a6a" />
          <stop offset="0.7" stopColor="#05070d" />
          <stop offset="1" stopColor="#05070d" />
        </radialGradient>
        <mask id="hiwHole">
          <rect x="8" y="8" width="356" height="746" rx="68" fill="#fff" />
          <rect x="17" y="17" width="338" height="728" rx="60" fill="#000" />
        </mask>
      </defs>

      {/* side buttons */}
      <rect x="4.5" y="152" width="4.5" height="34" rx="2.2" fill="url(#hiwBtn)" />
      <rect x="4.5" y="208" width="4.5" height="52" rx="2.2" fill="url(#hiwBtn)" />
      <rect x="4.5" y="270" width="4.5" height="52" rx="2.2" fill="url(#hiwBtn)" />
      <rect x="363" y="232" width="4.5" height="98" rx="2.2" fill="url(#hiwBtn)" />

      {/* titanium body with the screen punched out */}
      <rect
        x="8"
        y="8"
        width="356"
        height="746"
        rx="68"
        fill="url(#hiwTitanium)"
        mask="url(#hiwHole)"
      />

      {/* crisp outer edge + inner screen rim */}
      <rect x="8" y="8" width="356" height="746" rx="68" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      <rect x="16.5" y="16.5" width="339" height="729" rx="60.5" fill="none" stroke="#0b0b0c" strokeWidth="2.5" />

      {/* metallic sheen */}
      <rect x="10.5" y="74" width="1.4" height="556" rx="0.7" fill="rgba(255,255,255,0.55)" />
      <rect x="360" y="96" width="1.4" height="512" rx="0.7" fill="rgba(255,255,255,0.32)" />

      {/* dynamic island + camera lens */}
      <rect x="131" y="34" width="110" height="31" rx="15.5" fill="#000" />
      <circle cx="228" cy="49.5" r="5.2" fill="url(#hiwLens)" />
    </svg>
  );
}

export function HowItWorks() {
  const [active, setActive] = useState(0);

  const revealed = STEPS.slice(0, active + 1).flatMap((step, s) =>
    step.bubbles.map((bubble, i) => ({ bubble, i, key: `${s}-${i}` })),
  );
  const visible = revealed.slice(-3);

  return (
    <div className="hiw">
      <div className="hiw-phone" aria-hidden="true">
        <div className="hiw-screen-live">
          <div className="hiw-statusbar">
            <span className="hiw-time">9:41</span>
            <StatusIcons />
          </div>

          <div className="hiw-header">
            <svg className="hiw-back" viewBox="0 0 12 20">
              <path
                d="M10 1 2 10l8 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="hiw-peer">
              <span className="hiw-avatar" />
              <span className="hiw-peer-name">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r="8" fill="#9aa0a6" />
                  <path d="M6.9 10.6 4.6 8.3l.95-.95 1.35 1.35 3.2-3.2.95.95z" fill="#fff" />
                </svg>
                chat.inc
                <span className="hiw-chev">›</span>
              </span>
            </div>
            <svg className="hiw-cam" viewBox="0 0 24 24">
              <rect x="2.5" y="6.5" width="13" height="11" rx="3" fill="currentColor" />
              <path d="M17 10.5 21.5 8v8L17 13.5z" fill="currentColor" />
            </svg>
          </div>

          <div className="hiw-thread">
            {visible.map(({ bubble, i, key }) => {
              const delay = `${i * 90}ms`;
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
              return (
                <div
                  key={key}
                  className={`hiw-msg hiw-msg-${bubble.kind}`}
                  style={{ animationDelay: delay }}
                >
                  {bubble.text}
                </div>
              );
            })}
          </div>
        </div>

        <PhoneFrame />
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
                onClick={() => setActive(index)}
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
