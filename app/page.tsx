"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const starterMessages: UIMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "ask me anything and i will answer in one concise sentence.",
      },
    ],
  },
];

export default function Home() {
  const { clearError, error, messages, sendMessage, status } = useChat({
    messages: starterMessages,
  });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isSending = status === "submitted" || status === "streaming";

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.id !== "welcome"),
    [messages],
  );

  useEffect(() => {
    if (visibleMessages.length === 0) {
      return;
    }

    bottomRef.current?.scrollIntoView({
      behavior: status === "streaming" ? "auto" : "smooth",
      block: "end",
    });
  }, [status, visibleMessages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || isSending) {
      return;
    }

    setInput("");
    clearError();

    try {
      await sendMessage({ text: trimmedInput });
    } catch {
      // useChat exposes request failures through its error state.
    } finally {
      inputRef.current?.focus();
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <a href="/" aria-label="chat.inc home">
          chat.inc
        </a>
        <span>one-sentence AI</span>
      </header>

      <section className="conversation" aria-label="chat.inc conversation">
        {visibleMessages.length === 0 ? (
          <div className="empty-state">
            <h1>What can I help with?</h1>
            <p>Ask anything and get the shortest useful answer.</p>
          </div>
        ) : (
          <div className="message-list" aria-live="polite">
            {visibleMessages.map((message) => {
              const text = getMessageText(message);

              return (
                <article
                  className={`message ${message.role === "user" ? "message-user" : ""}`}
                  key={message.id}
                >
                  <p className="message-label">
                    {message.role === "user" ? "you" : "chat.inc"}
                  </p>
                  {text ? <p>{formatMessageText(message, text)}</p> : <TypingIndicator />}
                </article>
              );
            })}

            {status === "submitted" ? (
              <article className="message">
                <p className="message-label">chat.inc</p>
                <TypingIndicator />
              </article>
            ) : null}

            <div className="scroll-anchor" ref={bottomRef} />
          </div>
        )}
      </section>

      <div className="composer-dock">
        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            aria-label="Message chat.inc"
            placeholder="Message chat.inc"
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />

          <button type="submit" disabled={isSending || input.trim().length === 0}>
            {isSending ? "Sending" : "Send"}
          </button>
        </form>

        {error ? <p className="error-message">{error.message}</p> : null}
      </div>
    </main>
  );
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function formatMessageText(message: UIMessage, text: string) {
  return message.role === "assistant" ? text.toLocaleLowerCase() : text;
}

function TypingIndicator() {
  return (
    <p className="typing-indicator">
      <span />
      <span />
      <span />
    </p>
  );
}
