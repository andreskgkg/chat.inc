"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { FormEvent, useEffect, useRef, useState } from "react";

const hello: UIMessage = {
  id: "hello",
  role: "assistant",
  parts: [{ type: "text", text: "get the shortest useful answer, fast." }],
};

export default function Home() {
  const { messages, sendMessage, status } = useChat({ messages: [hello] });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();

    if (!text || busy) return;

    setInput("");
    void sendMessage({ text });
  }

  return (
    <main>
      <section className="chat" aria-label="chat">
        {messages.map((message) => {
          const content = text(message);

          return (
            <article className={`message ${message.role}`} key={message.id}>
              <p className="label">{message.role === "user" ? "You" : "chat.inc"}</p>
              <div>
                {content.trim() ? (
                  content
                    .split(/\n+/)
                    .filter(Boolean)
                    .map((line, index) => (
                      <p key={index}>{message.role === "assistant" ? line.toLowerCase() : line}</p>
                    ))
                ) : message.role === "assistant" && busy ? (
                  <p>...</p>
                ) : null}
              </div>
            </article>
          );
        })}

        {busy && !messages.some((message) => message.role === "assistant" && !text(message).trim()) ? (
          <article className="message">
            <p className="label">chat.inc</p>
            <div>
              <p>...</p>
            </div>
          </article>
        ) : null}

        <div ref={endRef} />
      </section>

      <form className="composer" onSubmit={submit}>
        <input
          aria-label="Message"
          autoComplete="off"
          autoFocus
          placeholder="Ask anything"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button aria-label="Send message" disabled={!input.trim() || busy}>
          ↑
        </button>
      </form>
    </main>
  );
}

function text(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}
