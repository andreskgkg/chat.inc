import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";

const systemPrompt =
  "You are chat.inc. Answer only the user's request. Be blunt, useful, and extremely terse. Default to one word or a short fragment. Use lowercase. For direct facts, counts, math, dates, times, yes or no, names, and labels, return only the bare answer. Do not explain, hedge, moralize, add caveats, or add filler unless asked. Finish cleanly.";

export const maxDuration = 30;

const chatModel = process.env.OPENAI_CHAT_MODEL || "gpt-5-mini";
const maxChatHistoryMessages = 8;
const maxChatOutputTokens = 96;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    const messages = Array.isArray(body.messages)
      ? body.messages
          .slice(-maxChatHistoryMessages)
          .filter((message) => getMessageText(message).length > 0)
      : [];

    if (messages.length === 0) {
      return Response.json({ error: "Send a message to start chatting." }, { status: 400 });
    }

    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
    const latestUserText = latestUserMessage ? getMessageText(latestUserMessage) : "";

    const directAnswer = getDirectAnswer(latestUserText);
    if (directAnswer) {
      return createDirectTextResponse(directAnswer);
    }

    const result = streamText({
      model: openai(chatModel),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: maxChatOutputTokens,
      onError: ({ error }) => {
        console.error("OpenAI stream failed", error);
      },
    });

    return result.toUIMessageStreamResponse({
      onError: () => "sorry, the model had trouble replying; please try again.",
    });
  } catch (error) {
    console.error("Chat request failed", error);

    return Response.json(
      { error: "Something went wrong while generating a reply." },
      { status: 500 },
    );
  }
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text.trim())
    .join("");
}

function getDirectAnswer(text: string) {
  const daysUntil = getDaysUntil(text);

  if (typeof daysUntil === "number") {
    return String(daysUntil);
  }

  return getArithmeticAnswer(text);
}

function getArithmeticAnswer(text: string) {
  const expression = extractArithmeticExpression(text);

  if (!expression) {
    return null;
  }

  const normalized = expression.replace(/\s+/g, "");

  if (!/^[\d+\-*/().%]+$/.test(normalized) || !/[+\-*/%]/.test(normalized)) {
    return null;
  }

  try {
    const value = Function(`"use strict"; return (${normalized});`)();

    if (!Number.isFinite(value)) {
      return null;
    }

    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(8)));
  } catch {
    return null;
  }
}

function extractArithmeticExpression(text: string) {
  const trimmedText = text.trim().replace(/[?=]+$/g, "").trim();
  const directExpression = trimmedText.match(/^[\d\s+\-*/().%]+$/);

  if (directExpression) {
    return directExpression[0];
  }

  return trimmedText.match(/(?:what(?:'s| is)|calculate|compute)\s+([\d\s+\-*/().%]+)/i)?.[1] || null;
}

function getDaysUntil(text: string) {
  const normalized = text.toLowerCase().replace(/[?!.]/g, " ").replace(/\s+/g, " ").trim();
  const match = normalized.match(
    /(?:how many )?days? until (jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|sept|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?/,
  );

  if (!match) {
    return null;
  }

  const monthIndex = monthNameToIndex(match[1]);
  const day = Number(match[2]);

  if (monthIndex === null || !Number.isInteger(day) || day < 1 || day > 31) {
    return null;
  }

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let target = new Date(Date.UTC(today.getUTCFullYear(), monthIndex, day));

  if (target < today) {
    target = new Date(Date.UTC(today.getUTCFullYear() + 1, monthIndex, day));
  }

  if (target.getUTCMonth() !== monthIndex || target.getUTCDate() !== day) {
    return null;
  }

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function monthNameToIndex(monthName: string) {
  const shortMonth = monthName.slice(0, 3);
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthIndex = months.indexOf(shortMonth);

  return monthIndex === -1 ? null : monthIndex;
}

function createDirectTextResponse(text: string) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        const id = "direct-answer";

        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: text });
        writer.write({ type: "text-end", id });
      },
    }),
  });
}
