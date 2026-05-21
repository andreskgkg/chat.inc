"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { SharedChatMessage } from "@/lib/shared-chat";

const starterMessages: UIMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "ask and get the shortest useful answer.",
      },
    ],
  },
];

export default function Home() {
  const { clearError, error, messages, sendMessage, setMessages, status } = useChat({
    messages: starterMessages,
  });
  const [input, setInput] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const [stats, setStats] = useState<ChatStatsResponse>({
    daysRunning: 0,
    messagesSent: 0,
    peopleConnected: 1,
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isSending = status === "submitted" || status === "streaming";

  const visibleMessages = useMemo(() => messages, [messages]);

  useEffect(() => {
    inputRef.current?.focus();

    function handlePageKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.length !== 1 ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      setInput((currentInput) => `${currentInput}${event.key}`);
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", handlePageKeyDown);

    return () => window.removeEventListener("keydown", handlePageKeyDown);
  }, []);

  useEffect(() => {
    if (visibleMessages.length === 0) {
      return;
    }

    bottomRef.current?.scrollIntoView({
      behavior: status === "streaming" ? "auto" : "smooth",
      block: "end",
    });
  }, [status, visibleMessages]);

  useEffect(() => {
    let isCancelled = false;

    async function loadSharedMessages() {
      if (isSending) {
        return;
      }

      try {
        const response = await fetch("/api/messages", {
          cache: "no-store",
        });
        const data = (await response.json()) as SharedMessagesResponse;

        if (!response.ok || !Array.isArray(data.messages) || isCancelled) {
          throw new Error(data.error || "could not load shared chat.");
        }

        setHistoryError("");

        if (data.messages.length === 0) {
          return;
        }

        const sharedMessages = data.messages.map(sharedMessageToUiMessage);

        setMessages((currentMessages) =>
          haveSameMessages(currentMessages, sharedMessages) ? currentMessages : sharedMessages,
        );
      } catch {
        if (!isCancelled) {
          setHistoryError("could not load shared chat.");
        }
      }
    }

    void loadSharedMessages();
    const intervalId = window.setInterval(loadSharedMessages, 5000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isSending, setMessages]);

  useEffect(() => {
    let isCancelled = false;

    async function loadTypingStatus() {
      try {
        const clientId = getClientId();
        const response = await fetch(`/api/typing?clientId=${encodeURIComponent(clientId)}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as TypingStatusResponse;

        if (!isCancelled) {
          setSomeoneTyping(Boolean(data.someoneTyping));
        }
      } catch {
        if (!isCancelled) {
          setSomeoneTyping(false);
        }
      }
    }

    void loadTypingStatus();
    const intervalId = window.setInterval(loadTypingStatus, 2000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function updateStats() {
      const nextStats = await updateConnectionStatus(true);

      if (!isCancelled) {
        setStats(nextStats);
      }
    }

    void updateStats();
    const intervalId = window.setInterval(updateStats, 15_000);

    function handleBeforeUnload() {
      void updateConnectionStatus(false);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void updateConnectionStatus(false);
    };
  }, []);

  useEffect(() => {
    const active = input.trim().length > 0 && isComposerFocused && !isSending;

    void updateTypingStatus(active);

    if (!active) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void updateTypingStatus(true);
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [input, isComposerFocused, isSending]);

  useEffect(() => {
    function handleBeforeUnload() {
      void updateTypingStatus(false);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || isSending) {
      return;
    }

    setInput("");
    clearError();
    void updateTypingStatus(false);
    focusComposer();

    void sendMessage({ text: trimmedInput })
      .catch(() => {
        // useChat exposes request failures through its error state.
      })
      .finally(focusComposer);
  }

  function focusComposer() {
    const composer = inputRef.current;

    if (!composer) {
      return;
    }

    composer.focus({ preventScroll: true });
    requestAnimationFrame(() => composer.focus({ preventScroll: true }));
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <a href="/" aria-label="chat.inc home">
          chat.inc
        </a>
        <span className="app-stats">{formatStats(stats)}</span>
      </header>

      <section className="conversation" aria-label="chat.inc conversation">
        <div className="message-list" aria-live="polite">
          {visibleMessages.map((message) => {
            const text = getMessageText(message);

            return (
              <article
                className={`message ${message.role === "user" ? "message-user" : ""}`}
                key={message.id}
              >
                <p className="message-label">
                  {message.role === "user" ? "someone" : "chat.inc"}
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

          {someoneTyping ? (
            <article className="message">
              <p className="message-label">someone is typing</p>
              <TypingIndicator />
            </article>
          ) : null}

          <div className="scroll-anchor" ref={bottomRef} />
        </div>
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
            onFocus={() => setIsComposerFocused(true)}
            onBlur={() => {
              setIsComposerFocused(false);
              void updateTypingStatus(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />

          <button
            type="submit"
            disabled={isSending || input.trim().length === 0}
            onMouseDown={(event) => event.preventDefault()}
            onTouchStart={(event) => {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }}
          >
            {isSending ? "Sending" : "Send"}
          </button>
        </form>

        {error ? <p className="error-message">{error.message}</p> : null}
        {historyError ? <p className="error-message">{historyError}</p> : null}
      </div>
    </main>
  );
}

type SharedMessagesResponse = {
  messages?: SharedChatMessage[];
  error?: string;
};

type TypingStatusResponse = {
  someoneTyping?: boolean;
};

type ChatStatsResponse = {
  daysRunning: number;
  messagesSent: number;
  peopleConnected: number;
};

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function formatMessageText(message: UIMessage, text: string) {
  return message.role === "assistant" ? text.toLocaleLowerCase() : text;
}

function sharedMessageToUiMessage(message: SharedChatMessage): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [
      {
        type: "text",
        text: message.text,
      },
    ],
  };
}

function haveSameMessages(firstMessages: UIMessage[], secondMessages: UIMessage[]) {
  if (firstMessages.length !== secondMessages.length) {
    return false;
  }

  return firstMessages.every((message, index) => {
    const otherMessage = secondMessages[index];

    return (
      message.id === otherMessage.id &&
      message.role === otherMessage.role &&
      getMessageText(message) === getMessageText(otherMessage)
    );
  });
}

function getClientId() {
  const storageKey = "chat.inc.clientId";
  const existingClientId = window.localStorage.getItem(storageKey);

  if (existingClientId) {
    return existingClientId;
  }

  const clientId = crypto.randomUUID();
  window.localStorage.setItem(storageKey, clientId);

  return clientId;
}

async function updateTypingStatus(active: boolean) {
  await fetch("/api/typing", {
    body: JSON.stringify({
      active,
      clientId: getClientId(),
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  }).catch(() => undefined);
}

async function updateConnectionStatus(active: boolean) {
  const fallbackStats = {
    daysRunning: 0,
    messagesSent: 0,
    peopleConnected: 1,
  };

  try {
    const response = await fetch("/api/stats", {
      body: JSON.stringify({
        active,
        clientId: getClientId(),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      method: "POST",
    });

    if (!response.ok) {
      return fallbackStats;
    }

    return (await response.json()) as ChatStatsResponse;
  } catch {
    return fallbackStats;
  }
}

function formatStats(stats: ChatStatsResponse) {
  return `${formatNumber(stats.peopleConnected)} connected · ${formatNumber(
    stats.messagesSent,
  )} messages · ${formatNumber(stats.daysRunning)} days running`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)
  );
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
