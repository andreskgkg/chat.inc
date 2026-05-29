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
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<UIMessage[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("idle");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const processedToolCallIdsRef = useRef<Set<string>>(new Set());
  const realtimeResponseActiveRef = useRef(false);
  const realtimeSessionRef = useRef<RealtimeSession | null>(null);
  const voiceActiveRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const isSendingQueuedMessageRef = useRef(false);
  const isSending = status === "submitted" || status === "streaming";
  const isVoiceActive = realtimeStatus !== "idle";

  const visibleMessages = useMemo(
    () => [
      ...messages,
      ...realtimeMessages,
      ...queuedMessages.map(queuedMessageToUiMessage),
    ],
    [messages, queuedMessages, realtimeMessages],
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
        voiceActiveRef.current ||
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
    voiceActiveRef.current = isVoiceActive;
  }, [isVoiceActive]);

  useEffect(() => {
    setVoiceSupported(
      Boolean(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia),
    );

    return () => {
      const session = realtimeSessionRef.current;
      realtimeSessionRef.current = null;
      closeRealtimeSession(session);
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

  function toggleVoiceConversation() {
    if (isVoiceActive) {
      stopRealtimeVoice();
      return;
    }

    void startRealtimeVoice();
  }

  async function startRealtimeVoice() {
    if (!voiceSupported || realtimeSessionRef.current) {
      return;
    }

    setRealtimeError(null);
    voiceActiveRef.current = true;
    processedToolCallIdsRef.current.clear();
    realtimeResponseActiveRef.current = false;
    setRealtimeStatus("connecting");
    setInput("");
    inputRef.current?.blur();

    try {
      const peerConnection = new RTCPeerConnection();
      const dataChannel = peerConnection.createDataChannel("oai-events");
      const audioElement = document.createElement("audio");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      audioElement.autoplay = true;
      audioElement.setAttribute("playsinline", "true");
      peerConnection.ontrack = (event) => {
        audioElement.srcObject = event.streams[0];
        void audioElement.play().catch(() => {
          setRealtimeError("tap voice again to enable audio");
        });
      };

      for (const track of mediaStream.getAudioTracks()) {
        peerConnection.addTrack(track, mediaStream);
      }

      const session: RealtimeSession = {
        activeAssistantItemId: null,
        activeAssistantMessageId: null,
        audioElement,
        dataChannel,
        mediaStream,
        peerConnection,
      };

      realtimeSessionRef.current = session;

      dataChannel.addEventListener("open", () => {
        setRealtimeStatus("listening");
      });
      dataChannel.addEventListener("message", (event) => {
        handleRealtimeEvent(JSON.parse(event.data) as RealtimeServerEvent);
      });
      dataChannel.addEventListener("close", () => {
        if (realtimeSessionRef.current === session) {
          setRealtimeStatus("idle");
        }
      });
      peerConnection.addEventListener("connectionstatechange", () => {
        if (
          realtimeSessionRef.current === session &&
          ["disconnected", "failed"].includes(peerConnection.connectionState)
        ) {
          stopRealtimeVoice();
        }
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const response = await fetch("/api/realtime/call", {
        method: "POST",
        body: offer.sdp,
        headers: {
          "Content-Type": "application/sdp",
        },
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "voice connection failed");
      }

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });
    } catch (error) {
      const session = realtimeSessionRef.current;
      realtimeSessionRef.current = null;
      closeRealtimeSession(session);
      voiceActiveRef.current = false;
      realtimeResponseActiveRef.current = false;
      setRealtimeStatus("idle");
      setRealtimeError(error instanceof Error ? error.message : "voice connection failed");
      focusComposer();
    }
  }

  function stopRealtimeVoice() {
    const session = realtimeSessionRef.current;
    realtimeSessionRef.current = null;
    closeRealtimeSession(session);
    voiceActiveRef.current = false;
    realtimeResponseActiveRef.current = false;
    setRealtimeStatus("idle");
    setRealtimeError(null);
    focusComposer();
  }

  function handleRealtimeEvent(event: RealtimeServerEvent) {
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        setRealtimeStatus("listening");
        if (
          realtimeResponseActiveRef.current &&
          realtimeSessionRef.current?.dataChannel.readyState === "open"
        ) {
          realtimeSessionRef.current.dataChannel.send(JSON.stringify({ type: "response.cancel" }));
          realtimeResponseActiveRef.current = false;
        }
        break;
      case "input_audio_buffer.speech_stopped":
        setRealtimeStatus("thinking");
        break;
      case "conversation.item.input_audio_transcription.completed":
        appendRealtimeMessage("user", event.transcript, event.item_id);
        break;
      case "response.created":
        realtimeResponseActiveRef.current = true;
        break;
      case "response.output_audio.delta":
      case "response.audio.delta":
        realtimeResponseActiveRef.current = true;
        setRealtimeStatus("speaking");
        break;
      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta":
        appendAssistantTranscriptDelta(event);
        break;
      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done":
        if (event.transcript) {
          replaceAssistantTranscript(event);
        }
        break;
      case "response.function_call_arguments.done":
        void handleRealtimeToolCall(event);
        break;
      case "response.done":
        void handleRealtimeResponseDone(event);
        realtimeResponseActiveRef.current = false;
        setRealtimeStatus("listening");
        if (realtimeSessionRef.current) {
          realtimeSessionRef.current.activeAssistantItemId = null;
          realtimeSessionRef.current.activeAssistantMessageId = null;
        }
        break;
      case "error":
        if (isNoActiveResponseCancellationError(event.error?.message)) {
          break;
        }
        setRealtimeError(event.error?.message || "voice error");
        break;
      default:
        break;
    }
  }

  async function handleRealtimeResponseDone(event: RealtimeServerEvent) {
    const toolCalls =
      event.response?.output?.filter((item) => item.type === "function_call") || [];

    for (const toolCall of toolCalls) {
      await handleRealtimeToolCall(toolCall);
    }
  }

  async function handleRealtimeToolCall(toolCall: RealtimeToolCall) {
    const dataChannel = realtimeSessionRef.current?.dataChannel;
    const callId = toolCall.call_id;

    if (!dataChannel || dataChannel.readyState !== "open" || !callId) {
      return;
    }

    if (processedToolCallIdsRef.current.has(callId)) {
      return;
    }

    processedToolCallIdsRef.current.add(callId);
    setRealtimeStatus("thinking");

    let output: unknown;

    try {
      const response = await fetch("/api/realtime/tool", {
        method: "POST",
        body: JSON.stringify({
          arguments: parseToolArguments(toolCall.arguments),
          name: toolCall.name,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      output = await response.json();
    } catch (error) {
      output = {
        error: error instanceof Error ? error.message : "tool failed",
      };
    }

    dataChannel.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(output),
        },
      }),
    );
    dataChannel.send(
      JSON.stringify({
        type: "response.create",
      }),
    );
    realtimeResponseActiveRef.current = true;
  }

  function appendRealtimeMessage(role: "assistant" | "user", text: string | undefined, itemId?: string) {
    const trimmedText = text?.trim();

    if (!trimmedText) {
      return;
    }

    const messageId = `realtime-${role}-${itemId || crypto.randomUUID()}`;

    setRealtimeMessages((currentMessages) => [
      ...currentMessages.filter((message) => message.id !== messageId),
      textToUiMessage(messageId, role, trimmedText),
    ]);
    shouldStickToBottomRef.current = true;
  }

  function appendAssistantTranscriptDelta(event: RealtimeServerEvent) {
    const delta = event.delta || "";

    if (!delta) {
      return;
    }

    const session = realtimeSessionRef.current;

    if (!session) {
      return;
    }

    const itemId = event.item_id || event.response_id || "assistant";

    if (session.activeAssistantItemId !== itemId) {
      session.activeAssistantItemId = itemId;
      session.activeAssistantMessageId = `realtime-assistant-${itemId}`;
      setRealtimeMessages((currentMessages) => [
        ...currentMessages,
        textToUiMessage(session.activeAssistantMessageId as string, "assistant", delta),
      ]);
      shouldStickToBottomRef.current = true;
      return;
    }

    const messageId = session.activeAssistantMessageId;

    if (!messageId) {
      return;
    }

    setRealtimeMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId
          ? textToUiMessage(message.id, "assistant", `${getMessageText(message)}${delta}`)
          : message,
      ),
    );
    shouldStickToBottomRef.current = true;
  }

  function replaceAssistantTranscript(event: RealtimeServerEvent) {
    const session = realtimeSessionRef.current;
    const messageId = session?.activeAssistantMessageId;

    if (!messageId || !event.transcript?.trim()) {
      return;
    }

    setRealtimeMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId
          ? textToUiMessage(message.id, "assistant", event.transcript as string)
          : message,
      ),
    );
    shouldStickToBottomRef.current = true;
  }

  function focusComposer() {
    if (voiceActiveRef.current) {
      return;
    }

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

  const voiceStatusText = getRealtimeStatusText(realtimeStatus);

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
            placeholder={isVoiceActive ? voiceStatusText : "Message"}
            rows={1}
            spellCheck={false}
            value={input}
            onBlur={() => {
              if (!isVoiceActive && isMobileViewport()) {
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
              className={`voice-button${isVoiceActive ? " voice-button-active" : ""}`}
              type="button"
              aria-label={isVoiceActive ? "Stop voice conversation" : "Start voice conversation"}
              aria-pressed={isVoiceActive}
              onMouseDown={(event) => event.preventDefault()}
              onTouchStart={(event) => {
                event.preventDefault();
                toggleVoiceConversation();
              }}
              onClick={toggleVoiceConversation}
            >
              {isVoiceActive ? "Stop" : "Voice"}
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
        {realtimeError ? <p className="error-message">{realtimeError}</p> : null}
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
  return textToUiMessage(message.id, "user", message.text);
}

function textToUiMessage(id: string, role: "assistant" | "user", text: string): UIMessage {
  return {
    id,
    role,
    parts: [
      {
        type: "text",
        text,
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

function getRealtimeStatusText(status: RealtimeStatus) {
  switch (status) {
    case "connecting":
      return "connecting";
    case "thinking":
      return "thinking";
    case "speaking":
      return "speaking";
    case "listening":
      return "listening";
    case "idle":
    default:
      return "Message";
  }
}

function closeRealtimeSession(session: RealtimeSession | null) {
  if (!session) {
    return;
  }

  if (session.dataChannel.readyState !== "closed") {
    session.dataChannel.close();
  }

  if (session.peerConnection.connectionState !== "closed") {
    session.peerConnection.close();
  }

  session.mediaStream.getTracks().forEach((track) => track.stop());
  session.audioElement.pause();
  session.audioElement.srcObject = null;
}

function parseToolArguments(argumentsText: string | undefined) {
  if (!argumentsText) {
    return {};
  }

  try {
    const parsedArguments = JSON.parse(argumentsText);

    return parsedArguments && typeof parsedArguments === "object" ? parsedArguments : {};
  } catch {
    return {};
  }
}

function isNoActiveResponseCancellationError(message: string | undefined) {
  return Boolean(
    message?.toLowerCase().includes("cancellation failed") &&
      message.toLowerCase().includes("no active response"),
  );
}

type RealtimeSession = {
  activeAssistantItemId: string | null;
  activeAssistantMessageId: string | null;
  audioElement: HTMLAudioElement;
  dataChannel: RTCDataChannel;
  mediaStream: MediaStream;
  peerConnection: RTCPeerConnection;
};

type RealtimeStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking";

type RealtimeServerEvent = {
  type: string;
  delta?: string;
  error?: {
    message?: string;
  };
  item_id?: string;
  name?: string;
  arguments?: string;
  call_id?: string;
  response?: {
    output?: RealtimeToolCall[];
  };
  response_id?: string;
  transcript?: string;
};

type RealtimeToolCall = {
  arguments?: string;
  call_id?: string;
  name?: string;
  type?: string;
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
