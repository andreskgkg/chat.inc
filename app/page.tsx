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
        {messages.map((message) => (
          <article className={`message ${message.role}`} key={message.id}>
            <p className="label">{message.role === "user" ? "You" : "chat.inc"}</p>
            <div>
              {text(message)
                .split(/\n+/)
                .filter(Boolean)
                .map((line, index) => (
                  <p key={index}>{message.role === "assistant" ? line.toLowerCase() : line}</p>
                ))}
            </div>
          </article>
        ))}

        {busy ? (
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
          placeholder="Reply"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button disabled={!input.trim() || busy}>Send</button>
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
