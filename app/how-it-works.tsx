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
    bubbles: [{ kind: "cash", amount: "$25", note: "Apple Cash · Sent" }],
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);

  const visible = STEPS.slice(0, active + 1).flatMap((step, stepIndex) =>
    step.bubbles.map((bubble, i) => ({ bubble, stepIndex, i })),
  );

  return (
    <div className="hiw">
      <div className="hiw-phone" aria-hidden="true">
        <div className="hiw-screen">
          <div className="hiw-topbar">
            <svg className="hiw-back" viewBox="0 0 12 20" width="9" height="15">
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
              <span className="hiw-peer-name">chat.inc ›</span>
            </div>
            <svg className="hiw-cam" viewBox="0 0 24 24" width="19" height="19">
              <rect x="2.5" y="6.5" width="13" height="11" rx="3" fill="currentColor" />
              <path d="M17 10.5 21.5 8v8L17 13.5z" fill="currentColor" />
            </svg>
          </div>

          <div className="hiw-thread">
            {visible.map(({ bubble, i }, index) => {
              const delay = `${i * 90}ms`;
              if (bubble.kind === "cash") {
                return (
                  <div
                    key={index}
                    className="hiw-msg hiw-cash"
                    style={{ animationDelay: delay }}
                  >
                    <span className="hiw-cash-amt">{bubble.amount}</span>
                    <span className="hiw-cash-note">{bubble.note}</span>
                  </div>
                );
              }
              return (
                <div
                  key={index}
                  className={`hiw-msg hiw-msg-${bubble.kind}`}
                  style={{ animationDelay: delay }}
                >
                  {bubble.text}
                </div>
              );
            })}
          </div>

          <div className="hiw-inputbar">
            <span className="hiw-input">iMessage</span>
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
