import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { appendSharedMessages, createSharedMessage } from "@/lib/shared-chat";

const systemPrompt =
  "You are chat.inc: useful, hyper-opinionated, and brutally terse. Answer only the user's actual question, then stop. Default to one token or one short phrase. For counts, math, dates, times, yes/no, names, labels, or other direct facts, output only the bare answer with no units, punctuation, sentence wrapper, or explanation when the unit is obvious; for example, 'days until june 5' -> '9'. Unless the user explicitly asks for an explanation, never explain, justify, add context, list caveats, show work, or add friendly filler. If asked for length, compress it to the shortest useful answer. Reply in lowercase text only, using the fewest words possible. Let the glass drop. Do not over-soften, moralize, or avoid a clear answer just because it may sound blunt, mean, unfair, or biased; stay lawful, safe, and do not target protected groups with hateful claims. Give the strongest useful answer, choose a side, and avoid hedging words like maybe, might, could, generally, probably, and it depends. Use tools when live, factual, or computed information would improve the answer. Never end mid-sentence or mid-thought; if space is limited, make the answer shorter so it still ends cleanly.";

export const maxDuration = 30;

const tools = {
  getCurrentDateTime: tool({
    description: "Get the current date and time for a timezone.",
    inputSchema: z.object({
      timeZone: z
        .string()
        .optional()
        .describe("IANA timezone, such as America/Los_Angeles."),
    }),
    execute: ({ timeZone }) => {
      const now = new Date();
      const resolvedTimeZone = timeZone || "America/Los_Angeles";

      return {
        iso: now.toISOString(),
        timeZone: resolvedTimeZone,
        local: new Intl.DateTimeFormat("en-US", {
          dateStyle: "full",
          timeStyle: "long",
          timeZone: resolvedTimeZone,
        }).format(now),
      };
    },
  }),

  calculate: tool({
    description: "Safely calculate a basic arithmetic expression.",
    inputSchema: z.object({
      expression: z
        .string()
        .describe("Arithmetic using numbers, parentheses, +, -, *, /, %, and **."),
    }),
    execute: ({ expression }) => {
      const normalized = expression.replace(/\s+/g, "");

      if (!/^[\d+\-*/().%]+$/.test(normalized)) {
        return { error: "only basic arithmetic characters are supported" };
      }

      try {
        const value = Function(`"use strict"; return (${normalized});`)();

        return Number.isFinite(value)
          ? { expression, value }
          : { error: "the expression did not produce a finite number" };
      } catch {
        return { error: "the expression could not be calculated" };
      }
    },
  }),

  geocodeLocation: tool({
    description: "Find coordinates and timezone for a city or place name.",
    inputSchema: z.object({
      location: z.string().describe("City, place, or address to geocode."),
    }),
    execute: async ({ location }) => geocodeLocation(location),
  }),

  getWeather: tool({
    description: "Get current weather and a 7-day forecast for a location.",
    inputSchema: z.object({
      location: z.string().describe("City or place, such as San Francisco."),
      day: z
        .string()
        .optional()
        .describe("Optional day hint, such as today, tomorrow, friday, or 2026-05-21."),
    }),
    execute: async ({ location, day }) => {
      const place = await geocodeLocation(location);

      if ("error" in place) {
        return place;
      }

      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(place.latitude));
      url.searchParams.set("longitude", String(place.longitude));
      url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
      url.searchParams.set(
        "daily",
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      );
      url.searchParams.set("timezone", "auto");
      url.searchParams.set("forecast_days", "7");

      const forecast = await fetchJson<OpenMeteoForecast>(url);
      const dailyForecast = forecast.daily;
      const daily = dailyForecast?.time?.map((date, index) => ({
        date,
        summary: weatherCodeToText(dailyForecast.weather_code?.[index]),
        highF: celsiusToFahrenheit(dailyForecast.temperature_2m_max?.[index]),
        lowF: celsiusToFahrenheit(dailyForecast.temperature_2m_min?.[index]),
        precipitationChance: dailyForecast.precipitation_probability_max?.[index],
      }));

      return {
        location: place.name,
        country: place.country,
        timezone: forecast.timezone,
        requestedDay: day || "today",
        current: forecast.current
          ? {
              temperatureF: celsiusToFahrenheit(forecast.current.temperature_2m),
              feelsLikeF: celsiusToFahrenheit(forecast.current.apparent_temperature),
              windMph: kmhToMph(forecast.current.wind_speed_10m),
              summary: weatherCodeToText(forecast.current.weather_code),
            }
          : null,
        forecast: daily,
      };
    },
  }),

  fetchUrl: tool({
    description: "Fetch a public webpage and extract a short readable text preview.",
    inputSchema: z.object({
      url: z.string().url().describe("The public URL to read."),
    }),
    execute: async ({ url }) => {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "chat.inc/1.0",
        },
      });
      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();

      return {
        url,
        status: response.status,
        contentType,
        title: extractTitle(text),
        excerpt: cleanText(text).slice(0, 2_000),
      };
    },
  }),

  searchWikipedia: tool({
    description: "Search Wikipedia for background information.",
    inputSchema: z.object({
      query: z.string().describe("Search query."),
    }),
    execute: async ({ query }) => {
      const url = new URL("https://en.wikipedia.org/w/api.php");
      url.searchParams.set("action", "query");
      url.searchParams.set("list", "search");
      url.searchParams.set("srsearch", query);
      url.searchParams.set("format", "json");
      url.searchParams.set("origin", "*");

      const data = await fetchJson<WikipediaSearchResponse>(url);

      return {
        query,
        results: data.query.search.slice(0, 5).map((result) => ({
          title: result.title,
          snippet: cleanText(result.snippet),
        })),
      };
    },
  }),

  getWikipediaSummary: tool({
    description: "Get a short summary for a Wikipedia page title.",
    inputSchema: z.object({
      title: z.string().describe("Wikipedia page title."),
    }),
    execute: async ({ title }) => {
      const encodedTitle = encodeURIComponent(title.replace(/\s+/g, "_"));
      const data = await fetchJson<WikipediaSummary>(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
      );

      return {
        title: data.title,
        description: data.description,
        extract: data.extract,
        url: data.content_urls?.desktop?.page,
      };
    },
  }),

  getHackerNewsTopStories: tool({
    description: "Get current top Hacker News stories.",
    inputSchema: z.object({
      count: z.number().int().min(1).max(10).default(5),
    }),
    execute: async ({ count }) => {
      const ids = await fetchJson<number[]>(
        "https://hacker-news.firebaseio.com/v0/topstories.json",
      );
      const stories = await Promise.all(
        ids.slice(0, count).map((id) =>
          fetchJson<HackerNewsItem>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`),
        ),
      );

      return stories.map((story) => ({
        id: story.id,
        title: story.title,
        url: story.url,
        score: story.score,
      }));
    },
  }),

  getCryptoPrice: tool({
    description: "Get the latest public crypto price from CoinGecko.",
    inputSchema: z.object({
      coinId: z
        .string()
        .describe("CoinGecko coin id, such as bitcoin, ethereum, or solana."),
      currency: z.string().default("usd").describe("Fiat currency, such as usd or eur."),
    }),
    execute: async ({ coinId, currency }) => {
      const url = new URL("https://api.coingecko.com/api/v3/simple/price");
      url.searchParams.set("ids", coinId.toLowerCase());
      url.searchParams.set("vs_currencies", currency.toLowerCase());
      url.searchParams.set("include_24hr_change", "true");

      return fetchJson<Record<string, Record<string, number>>>(url);
    },
  }),

  getExchangeRate: tool({
    description: "Get current foreign exchange rates.",
    inputSchema: z.object({
      from: z.string().length(3).describe("Base currency code, such as USD."),
      to: z.string().length(3).describe("Target currency code, such as EUR."),
    }),
    execute: async ({ from, to }) => {
      const url = new URL(`https://api.frankfurter.app/latest`);
      url.searchParams.set("from", from.toUpperCase());
      url.searchParams.set("to", to.toUpperCase());

      return fetchJson<ExchangeRateResponse>(url);
    },
  }),
};

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

    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
    const latestUserText = latestUserMessage ? getMessageText(latestUserMessage) : "";

    if (latestUserMessage && latestUserText) {
      await appendSharedMessagesSafely([
        createSharedMessage("user", latestUserText, latestUserMessage.id),
      ]);
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(5),
      maxOutputTokens: 512,
      onError: ({ error }) => {
        console.error("OpenAI stream failed", error);
      },
      onFinish: async ({ text }) => {
        if (!text.trim()) {
          return;
        }

        await appendSharedMessagesSafely([createSharedMessage("assistant", text)]);
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

async function appendSharedMessagesSafely(messages: ReturnType<typeof createSharedMessage>[]) {
  try {
    await appendSharedMessages(messages);
  } catch (error) {
    console.warn("Shared chat persistence unavailable", error);
  }
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text.trim())
    .join("");
}

type GeocodeResult =
  | {
      name: string;
      country: string;
      latitude: number;
      longitude: number;
      timezone?: string;
    }
  | { error: string };

type OpenMeteoGeocode = {
  results?: Array<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    admin1?: string;
  }>;
};

type OpenMeteoForecast = {
  timezone?: string;
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

type WikipediaSearchResponse = {
  query: {
    search: Array<{
      title: string;
      snippet: string;
    }>;
  };
};

type WikipediaSummary = {
  title: string;
  description?: string;
  extract?: string;
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
};

type HackerNewsItem = {
  id: number;
  title?: string;
  url?: string;
  score?: number;
};

type ExchangeRateResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

async function geocodeLocation(location: string): Promise<GeocodeResult> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", location);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const data = await fetchJson<OpenMeteoGeocode>(url);
  const place = data.results?.[0];

  if (!place) {
    return { error: `could not find location: ${location}` };
  }

  return {
    name: [place.name, place.admin1].filter(Boolean).join(", "),
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  };
}

async function fetchJson<T>(url: URL | string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "chat.inc/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function celsiusToFahrenheit(value?: number) {
  return typeof value === "number" ? Math.round((value * 9) / 5 + 32) : null;
}

function kmhToMph(value?: number) {
  return typeof value === "number" ? Math.round(value * 0.621371) : null;
}

function weatherCodeToText(code?: number) {
  if (typeof code !== "number") {
    return "unknown";
  }

  if (code === 0) return "clear";
  if ([1, 2, 3].includes(code)) return "partly cloudy";
  if ([45, 48].includes(code)) return "foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunderstorms";

  return "unknown";
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
}

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
