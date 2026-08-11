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

export function HowItWorks() {
  const [active, setActive] = useState(0);

  const visible = STEPS.slice(0, active + 1).flatMap((step) =>
    step.bubbles.map((bubble, i) => ({ bubble, i })),
  );

  return (
    <div className="hiw">
      <div className="hiw-phone" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hiw-frame-img"
          src="/phone-frame.png"
          alt=""
          width={808}
          height={1024}
        />
        <div className="hiw-overlay">
          {visible.map(({ bubble, i }, index) => {
            const delay = `${i * 90}ms`;
            if (bubble.kind === "cash") {
              return (
                <div
                  key={index}
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
                key={index}
                className={`hiw-msg hiw-msg-${bubble.kind}`}
                style={{ animationDelay: delay }}
              >
                {bubble.text}
              </div>
            );
          })}
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
