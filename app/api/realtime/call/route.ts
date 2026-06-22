const realtimePrompt =
  "You are chat.inc in live voice mode. Be useful, hyper opinionated, and brutally terse. Answer only the user's actual question, then stop. Default to one short phrase. Fragments beat sentences. Fewer words beat grammar. Speak naturally but very fast and concise. Assume the user is speaking English unless they explicitly ask for another language. Do not translate or reinterpret their speech. Do not use semicolons, colons, hyphens, dashes, or double dashes in replies. Unless the user explicitly asks for an explanation, never explain, justify, add context, list caveats, show work, or add friendly filler. Reply in lowercase. Stay lawful, safe, and do not target protected groups with hateful claims.";

export const maxDuration = 30;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const sdp = await request.text();

  if (!sdp.trim()) {
    return Response.json({ error: "Missing SDP offer" }, { status: 400 });
  }

  const formData = new FormData();
  formData.set("sdp", sdp);
  formData.set(
    "session",
    JSON.stringify({
      type: "realtime",
      model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2",
      instructions: realtimePrompt,
      max_output_tokens: 120,
      output_modalities: ["audio"],
      audio: {
        input: {
          noise_reduction: {
            type: "near_field",
          },
          transcription: {
            language: "en",
            model: "gpt-4o-transcribe",
            prompt:
              "Transcribe the user's English speech word for word. Use the Latin alphabet only. Do not translate. Do not output Korean, Chinese, Japanese, emoji, symbols, or decorative text. If audio is unclear, write the closest English words.",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 450,
          },
        },
        output: {
          voice: "echo",
          speed: 1.08,
        },
      },
    }),
  );

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "OpenAI-Safety-Identifier": "chat-inc-anonymous",
    },
    body: formData,
  });

  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": response.ok ? "application/sdp" : "text/plain",
    },
  });
}
