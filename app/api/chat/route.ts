import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const systemPrompt =
  "You are chat.inc. Answer only the user's request. Be blunt, useful, and extremely terse. Default to one word or a short fragment. Use lowercase. For direct facts, counts, math, dates, times, yes or no, names, and labels, return only the bare answer. Do not explain, hedge, moralize, add caveats, or add filler unless asked. Finish cleanly.";

export const maxDuration = 30;

const chatModel = process.env.OPENAI_CHAT_MODEL || "gpt-5-mini";

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
          .slice(-8)
          .filter((message) => getMessageText(message).length > 0)
      : [];

    if (messages.length === 0) {
      return Response.json({ error: "Send a message to start chatting." }, { status: 400 });
    }

    const result = streamText({
      model: openai(chatModel),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 96,
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
