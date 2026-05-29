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
        text: "get the shortest useful answer, fast.",
      },
    ],
  },
];

export default function Home() {
  const [chatSessionId] = useState(() => `chat-${crypto.randomUUID()}`);
  const { clearError, error, messages, sendMessage, status } = useChat({
    id: chatSessionId,
    messages: starterMessages,
  });
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalVoiceTranscriptRef = useRef("");
  const submitTextRef = useRef<(text: string) => void>(() => {});
  const shouldStickToBottomRef = useRef(true);
  const isSendingQueuedMessageRef = useRef(false);
  const isSending = status === "submitted" || status === "streaming";

  const visibleMessages = useMemo(
    () => [...messages, ...queuedMessages.map(queuedMessageToUiMessage)],
    [messages, queuedMessages],
  );

  useEffect(() => {
    const focusTimers: number[] = [];

    function focusComposerSoon() {
      focusComposer();
      requestAnimationFrame(focusComposer);

      for (const delay of [120, 350, 700]) {
        focusTimers.push(window.setTimeout(focusComposer, delay));
      }
    }

    function updateMobileComposerPosition() {
      const viewport = window.visualViewport;

      if (!viewport || !isMobileViewport()) {
        document.documentElement.style.setProperty("--keyboard-offset", "0px");
        document.body.classList.remove("mobile-keyboard-open");
        return;
      }

      const keyboardOffset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      document.documentElement.style.setProperty("--keyboard-offset", `${keyboardOffset}px`);

      if (document.activeElement === inputRef.current && keyboardOffset > 0) {
        document.body.classList.add("mobile-keyboard-open");
      } else {
        document.body.classList.remove("mobile-keyboard-open");
      }
    }

    function handlePageShow() {
      focusComposerSoon();
      updateMobileComposerPosition();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        focusComposerSoon();
        updateMobileComposerPosition();
      }
    }

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

    focusComposerSoon();
    updateMobileComposerPosition();
    window.addEventListener("keydown", handlePageKeyDown);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("orientationchange", updateMobileComposerPosition);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.visualViewport?.addEventListener("resize", updateMobileComposerPosition);
    window.visualViewport?.addEventListener("scroll", updateMobileComposerPosition);

    return () => {
      for (const timer of focusTimers) {
        window.clearTimeout(timer);
      }

      window.removeEventListener("keydown", handlePageKeyDown);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("orientationchange", updateMobileComposerPosition);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.visualViewport?.removeEventListener("resize", updateMobileComposerPosition);
      window.visualViewport?.removeEventListener("scroll", updateMobileComposerPosition);
      document.documentElement.style.removeProperty("--keyboard-offset");
      document.body.classList.remove("mobile-keyboard-open");
    };
  }, []);

  useEffect(() => {
    submitTextRef.current = submitText;
  });

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    setVoiceSupported(true);

    recognition.onstart = () => {
      finalVoiceTranscriptRef.current = "";
      setIsListening(true);
    };

    recognition.onend = () => {
      const voiceText = finalVoiceTranscriptRef.current.trim();

      setIsListening(false);
      finalVoiceTranscriptRef.current = "";

      if (voiceText) {
        submitTextRef.current(voiceText);
      } else {
        focusComposer();
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      finalVoiceTranscriptRef.current = "";
      focusComposer();
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? "";

        if (event.results[index].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      finalVoiceTranscriptRef.current = [
        finalVoiceTranscriptRef.current,
        finalTranscript.trim(),
      ]
        .filter(Boolean)
        .join(" ");
      setInput([finalVoiceTranscriptRef.current, interimTranscript.trim()].filter(Boolean).join(" "));
    };

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    function updateStickToBottom() {
      shouldStickToBottomRef.current = isNearPageBottom();
    }

    updateStickToBottom();
    window.addEventListener("resize", updateStickToBottom);
    window.addEventListener("scroll", updateStickToBottom, { passive: true });

    return () => {
      window.removeEventListener("resize", updateStickToBottom);
      window.removeEventListener("scroll", updateStickToBottom);
    };
  }, []);

  useEffect(() => {
    if (visibleMessages.length === 0) {
      return;
    }

    if (!shouldStickToBottomRef.current) {
      return;
    }

    scrollToBottom(status === "streaming" ? "auto" : "smooth");
  }, [status, visibleMessages]);

  useEffect(() => {
    if (isSending) {
      isSendingQueuedMessageRef.current = false;
      return;
    }

    if (isSendingQueuedMessageRef.current || queuedMessages.length === 0) {
      return;
    }

    const [nextMessage, ...remainingMessages] = queuedMessages;

    isSendingQueuedMessageRef.current = true;
    setQueuedMessages(remainingMessages);
    clearError();
    shouldStickToBottomRef.current = true;

    void sendMessage({ text: nextMessage.text })
      .catch(() => {
        // useChat exposes request failures through its error state.
      })
      .finally(focusComposer);
  }, [clearError, isSending, queuedMessages, sendMessage]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitText(input);
  }

  function submitText(text: string) {
    const trimmedInput = text.trim();

    if (!trimmedInput) {
      return;
    }

    setInput("");
    clearError();
    shouldStickToBottomRef.current = true;
    focusComposer();

    if (isSending) {
      setQueuedMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `queued-${crypto.randomUUID()}`,
          text: trimmedInput,
        },
      ]);
      return;
    }

    void sendMessage({ text: trimmedInput })
      .catch(() => {
        // useChat exposes request failures through its error state.
      })
      .finally(focusComposer);
  }

  function toggleVoiceInput() {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

    if (isListening) {
      recognition.stop();
      return;
    }

    try {
      finalVoiceTranscriptRef.current = "";
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  function focusComposer() {
    const composer = inputRef.current;

    if (!composer) {
      return;
    }

    composer.focus({ preventScroll: true });
    requestAnimationFrame(() => composer.focus({ preventScroll: true }));
  }

  function scrollToBottom(behavior: ScrollBehavior) {
    bottomRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  }

  function isNearPageBottom() {
    const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const distanceFromBottom = pageHeight - window.scrollY - window.innerHeight;

    return distanceFromBottom < 220;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <a href="/" aria-label="chat.inc home">
          chat.inc
        </a>
      </header>

      <section className="conversation" aria-label="chat.inc conversation">
        <div className="message-list" aria-live="polite">
          {visibleMessages.map((message) => {
            const text = getMessageText(message);

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

          <div className="scroll-anchor" ref={bottomRef} />
        </div>
      </section>

      <div className="composer-dock">
        <form className="composer" autoComplete="off" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            aria-label="Message"
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect="off"
            enterKeyHint="send"
            inputMode="text"
            placeholder="Message"
            rows={1}
            spellCheck={false}
            value={input}
            onBlur={() => {
              if (isMobileViewport()) {
                window.setTimeout(focusComposer, 0);
              }
            }}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />

          {voiceSupported ? (
            <button
              className={`voice-button${isListening ? " voice-button-active" : ""}`}
              type="button"
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              aria-pressed={isListening}
              onMouseDown={(event) => event.preventDefault()}
              onTouchStart={(event) => {
                event.preventDefault();
                toggleVoiceInput();
              }}
              onClick={toggleVoiceInput}
            >
              {isListening ? "Stop" : "Mic"}
            </button>
          ) : null}

          <button
            className="send-button"
            type="submit"
            disabled={input.trim().length === 0}
            onMouseDown={(event) => event.preventDefault()}
            onTouchStart={(event) => {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }}
          >
            Send
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

type QueuedMessage = {
  id: string;
  text: string;
};

function queuedMessageToUiMessage(message: QueuedMessage): UIMessage {
  return {
    id: message.id,
    role: "user",
    parts: [
      {
        type: "text",
        text: message.text,
      },
    ],
  };
}

function messageElementId(messageId: string) {
  return `message-${messageId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
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

function isMobileViewport() {
  return window.matchMedia("(pointer: coarse), (max-width: 640px)").matches;
}

function getSpeechRecognition() {
  const speechWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  abort: () => void;
  start: () => void;
  stop: () => void;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
};

type BrowserSpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
};

function TypingIndicator() {
  return (
    <p className="typing-indicator">
      <span />
      <span />
      <span />
    </p>
  );
}
