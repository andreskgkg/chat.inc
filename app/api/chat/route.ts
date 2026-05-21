import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const systemPrompt =
  "You are chat.inc: concise, useful, and calm. Reply in exactly one short, complete sentence unless you must refuse for safety or need one sentence to clarify. Use lowercase text only. Never end mid-sentence or mid-thought; if space is limited, make the answer shorter so it still ends cleanly.";

export const maxDuration = 30;

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
      ? body.messages.slice(-12).filter((message) => getMessageText(message).length > 0)
      : [];

    if (messages.length === 0) {
      return Response.json({ error: "Send a message to start chatting." }, { status: 400 });
    }

    const result = streamText({
      model: openai("gpt-5.5"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 512,
      providerOptions: {
        openai: {
          reasoningEffort: "none",
          textVerbosity: "low",
        },
      },
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
