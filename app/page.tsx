"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { FormEvent, useEffect, useRef, useState } from "react";

const welcome: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [{ type: "text", text: "short answers" }],
};

export default function Home() {
  const { messages, sendMessage, status } = useChat({ messages: [welcome] });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const pending = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();

    if (!text || pending) return;

    setInput("");
    void sendMessage({ text });
  }

  return (
    <main>
      <section className="chat" aria-label="chat">
        {messages.map((message) => {
          const content = getText(message);

          return (
            <article className="message" key={message.id}>
              <span>{message.role === "user" ? "you" : "chatgpt"}</span>
              <div>{content || (message.role === "assistant" && pending ? "..." : "")}</div>
            </article>
          );
        })}

        {pending && !messages.some((message) => message.role === "assistant" && !getText(message)) ? (
          <article className="message">
            <span>chatgpt</span>
            <div>...</div>
          </article>
        ) : null}

        <div ref={endRef} />
      </section>

      <form className="composer" onSubmit={submit}>
        <input
          aria-label="message"
          autoComplete="off"
          autoFocus
          placeholder="ask anything"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button aria-label="send" disabled={!input.trim() || pending}>
          ↑
        </button>
      </form>
    </main>
  );
}

function getText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}
