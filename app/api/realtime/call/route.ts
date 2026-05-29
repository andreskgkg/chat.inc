const realtimePrompt =
  "You are chat.inc in live voice mode. Be useful, hyper opinionated, and brutally terse. Answer only the user's actual question, then stop. Default to one short phrase. Fragments beat sentences. Fewer words beat grammar. Speak naturally but very fast and concise. Assume the user is speaking English unless they explicitly ask for another language. Do not translate or reinterpret their speech. Use tools whenever live, factual, local, web, or computed information would improve the answer. Do not use semicolons, colons, hyphens, dashes, or double dashes in replies. Unless the user explicitly asks for an explanation, never explain, justify, add context, list caveats, show work, or add friendly filler. Reply in lowercase. Stay lawful, safe, and do not target protected groups with hateful claims.";

const realtimeTools = [
  {
    type: "function",
    name: "getCurrentDateTime",
    description: "Get the current date and time for a timezone.",
    parameters: {
      type: "object",
      properties: {
        timeZone: {
          type: "string",
          description: "IANA timezone, such as America/Los_Angeles.",
        },
      },
    },
  },
  {
    type: "function",
    name: "calculate",
    description: "Safely calculate a basic arithmetic expression.",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Arithmetic using numbers, parentheses, +, -, *, /, %, and **.",
        },
      },
      required: ["expression"],
    },
  },
  {
    type: "function",
    name: "geocodeLocation",
    description: "Find coordinates and timezone for a city or place name.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City, place, or address to geocode.",
        },
      },
      required: ["location"],
    },
  },
  {
    type: "function",
    name: "getWeather",
    description: "Get current weather and a 7-day forecast for a location.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City or place, such as San Francisco.",
        },
        day: {
          type: "string",
          description: "Optional day hint, such as today, tomorrow, friday, or 2026-05-21.",
        },
      },
      required: ["location"],
    },
  },
  {
    type: "function",
    name: "fetchUrl",
    description: "Fetch a public webpage and extract a short readable text preview.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The public URL to read.",
        },
      },
      required: ["url"],
    },
  },
  {
    type: "function",
    name: "searchWikipedia",
    description: "Search Wikipedia for background information.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query.",
        },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "getWikipediaSummary",
    description: "Get a short summary for a Wikipedia page title.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Wikipedia page title.",
        },
      },
      required: ["title"],
    },
  },
  {
    type: "function",
    name: "getHackerNewsTopStories",
    description: "Get current top Hacker News stories.",
    parameters: {
      type: "object",
      properties: {
        count: {
          type: "number",
          minimum: 1,
          maximum: 10,
          default: 5,
        },
      },
    },
  },
  {
    type: "function",
    name: "getCryptoPrice",
    description: "Get the latest public crypto price from CoinGecko.",
    parameters: {
      type: "object",
      properties: {
        coinId: {
          type: "string",
          description: "CoinGecko coin id, such as bitcoin, ethereum, or solana.",
        },
        currency: {
          type: "string",
          default: "usd",
          description: "Fiat currency, such as usd or eur.",
        },
      },
      required: ["coinId"],
    },
  },
  {
    type: "function",
    name: "getExchangeRate",
    description: "Get current foreign exchange rates.",
    parameters: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Base currency code, such as USD.",
        },
        to: {
          type: "string",
          description: "Target currency code, such as EUR.",
        },
      },
      required: ["from", "to"],
    },
  },
];

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
      tool_choice: "auto",
      tools: realtimeTools,
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
          voice: "onyx",
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
