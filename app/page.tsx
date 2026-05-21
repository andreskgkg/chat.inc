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
    daysRunning: 1,
    messagesSent: 0,
    peopleConnected: 1,
  });
  const [votes, setVotes] = useState<VotesResponse>({
    top: [],
    userVotes: [],
    votes: {},
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasLoadedSharedHistoryRef = useRef(false);
  const shouldPlayInitialScrollRef = useRef(false);
  const isSending = status === "submitted" || status === "streaming";
  const isTypingActive = input.trim().length > 0 && isComposerFocused && !isSending;

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

    if (shouldPlayInitialScrollRef.current) {
      window.scrollTo({ top: 0, behavior: "auto" });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom("smooth");
          shouldPlayInitialScrollRef.current = false;
        });
      });

      return;
    }

    scrollToBottom(status === "streaming" ? "auto" : "smooth");
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
          hasLoadedSharedHistoryRef.current = true;
          return;
        }

        const sharedMessages = data.messages.map(sharedMessageToUiMessage);

        shouldPlayInitialScrollRef.current = !hasLoadedSharedHistoryRef.current;
        hasLoadedSharedHistoryRef.current = true;

        setMessages((currentMessages) => {
          if (haveSameMessages(currentMessages, sharedMessages)) {
            shouldPlayInitialScrollRef.current = false;
            return currentMessages;
          }

          return sharedMessages;
        });
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

    async function loadVotes() {
      const nextVotes = await fetchVotes();

      if (!isCancelled) {
        setVotes(nextVotes);
      }
    }

    void loadVotes();
    const intervalId = window.setInterval(loadVotes, 10_000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

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
    const intervalId = window.setInterval(updateStats, 5000);

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
    const visibleMessageCount = visibleMessages.filter(
      (message) => message.id !== "welcome" && getMessageText(message).trim().length > 0,
    ).length;

    setStats((currentStats) => ({
      ...currentStats,
      messagesSent: Math.max(currentStats.messagesSent, visibleMessageCount),
    }));
  }, [visibleMessages]);

  useEffect(() => {
    void updateTypingStatus(isTypingActive);

    if (!isTypingActive) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void updateTypingStatus(true);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [isTypingActive]);

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

  async function handleVote(messageId: string) {
    const nextVotes = await toggleVote(messageId);

    setVotes(nextVotes);
  }

  function scrollToMessage(messageId: string) {
    document.getElementById(messageElementId(messageId))?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function scrollToBottom(behavior: ScrollBehavior) {
    bottomRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <a href="/" aria-label="chat.inc home">
          chat.inc
        </a>
      </header>

      <aside className="vote-rail" aria-label="top upvoted responses">
        {votes.top.length > 0 ? (
          <div className="vote-bars">
            {votes.top.map((message) => (
              <button
                aria-label={`jump to response with ${message.votes} upvotes`}
                className="vote-bar"
                key={message.messageId}
                onClick={() => scrollToMessage(message.messageId)}
                type="button"
              >
                <span
                  style={{
                    inlineSize: `${Math.max(10, (message.votes / votes.top[0].votes) * 100)}%`,
                  }}
                />
              </button>
            ))}
          </div>
        ) : null}
      </aside>

      <section className="conversation" aria-label="chat.inc conversation">
        <div className="message-list" aria-live="polite">
          {visibleMessages.map((message) => {
            const text = getMessageText(message);
            const canVote = isVotableMessage(message);
            const hasVoted = votes.userVotes.includes(message.id);
            const voteCount = votes.votes[message.id] || 0;

            return (
              <article
                className={`message ${message.role === "user" ? "message-user" : ""}`}
                id={messageElementId(message.id)}
                key={message.id}
              >
                <div className="message-content">
                  <p className="message-label">
                    {message.role === "user" ? "someone" : "chat.inc"}
                  </p>
                  <div className="message-text-row">
                    {canVote ? (
                      <button
                        aria-pressed={hasVoted}
                        className={`upvote-button ${hasVoted ? "upvote-button-active" : ""}`}
                        onClick={() => void handleVote(message.id)}
                        type="button"
                      >
                        ↑{voteCount > 0 ? ` ${voteCount}` : ""}
                      </button>
                    ) : null}
                    <div className="message-text">
                      {text ? <p>{formatMessageText(message, text)}</p> : <TypingIndicator />}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {status === "submitted" ? (
            <article className="message">
              <div className="message-content">
                <p className="message-label">chat.inc</p>
                <TypingIndicator />
              </div>
            </article>
          ) : null}

          {someoneTyping ? (
            <article className="message">
              <div className="message-content">
                <p className="message-label">someone is typing</p>
                <TypingIndicator />
              </div>
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

type VoteSummary = {
  messageId: string;
  text: string;
  votes: number;
};

type VotesResponse = {
  top: VoteSummary[];
  userVotes: string[];
  votes: Record<string, number>;
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

function isVotableMessage(message: UIMessage) {
  return (
    message.role === "assistant" &&
    message.id !== "welcome" &&
    !message.id.startsWith("msg_") &&
    getMessageText(message).trim().length > 0
  );
}

function messageElementId(messageId: string) {
  return `message-${messageId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
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
    daysRunning: 1,
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

async function fetchVotes() {
  const fallbackVotes = {
    top: [],
    userVotes: [],
    votes: {},
  };

  try {
    const response = await fetch(`/api/votes?clientId=${encodeURIComponent(getClientId())}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return fallbackVotes;
    }

    return (await response.json()) as VotesResponse;
  } catch {
    return fallbackVotes;
  }
}

async function toggleVote(messageId: string) {
  const fallbackVotes = await fetchVotes();

  try {
    const response = await fetch("/api/votes", {
      body: JSON.stringify({
        clientId: getClientId(),
        messageId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      return fallbackVotes;
    }

    return (await response.json()) as VotesResponse;
  } catch {
    return fallbackVotes;
  }
}

function formatStats(stats: ChatStatsResponse) {
  return `${formatNumber(stats.peopleConnected)} connected · ${formatNumber(
    stats.messagesSent,
  )} messages · ${formatNumber(stats.daysRunning)} ${stats.daysRunning === 1 ? "day" : "days"} running`;
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
