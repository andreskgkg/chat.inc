type ToolRequest = {
  arguments?: Record<string, unknown>;
  name?: string;
};

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ToolRequest;

    if (!body.name) {
      return Response.json({ error: "Missing tool name" }, { status: 400 });
    }

    const result = await runRealtimeTool(body.name, body.arguments || {});

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "tool failed" },
      { status: 500 },
    );
  }
}

async function runRealtimeTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "getCurrentDateTime": {
      const now = new Date();
      const timeZone = getOptionalString(args.timeZone) || "America/Los_Angeles";

      return {
        iso: now.toISOString(),
        timeZone,
        local: new Intl.DateTimeFormat("en-US", {
          dateStyle: "full",
          timeStyle: "long",
          timeZone,
        }).format(now),
      };
    }
    case "calculate": {
      const expression = getRequiredString(args.expression);
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
    }
    case "geocodeLocation":
      return geocodeLocation(getRequiredString(args.location));
    case "getWeather": {
      const place = await geocodeLocation(getRequiredString(args.location));

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

      return {
        location: place.name,
        country: place.country,
        timezone: forecast.timezone,
        requestedDay: getOptionalString(args.day) || "today",
        current: forecast.current
          ? {
              temperatureF: celsiusToFahrenheit(forecast.current.temperature_2m),
              feelsLikeF: celsiusToFahrenheit(forecast.current.apparent_temperature),
              windMph: kmhToMph(forecast.current.wind_speed_10m),
              summary: weatherCodeToText(forecast.current.weather_code),
            }
          : null,
        forecast: dailyForecast?.time?.map((date, index) => ({
          date,
          summary: weatherCodeToText(dailyForecast.weather_code?.[index]),
          highF: celsiusToFahrenheit(dailyForecast.temperature_2m_max?.[index]),
          lowF: celsiusToFahrenheit(dailyForecast.temperature_2m_min?.[index]),
          precipitationChance: dailyForecast.precipitation_probability_max?.[index],
        })),
      };
    }
    case "fetchUrl": {
      const url = getRequiredString(args.url);
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
    }
    case "searchWikipedia": {
      const url = new URL("https://en.wikipedia.org/w/api.php");
      url.searchParams.set("action", "query");
      url.searchParams.set("list", "search");
      url.searchParams.set("srsearch", getRequiredString(args.query));
      url.searchParams.set("format", "json");
      url.searchParams.set("origin", "*");

      const data = await fetchJson<WikipediaSearchResponse>(url);

      return {
        query: getRequiredString(args.query),
        results: data.query.search.slice(0, 5).map((result) => ({
          title: result.title,
          snippet: cleanText(result.snippet),
        })),
      };
    }
    case "getWikipediaSummary": {
      const encodedTitle = encodeURIComponent(getRequiredString(args.title).replace(/\s+/g, "_"));
      const data = await fetchJson<WikipediaSummary>(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
      );

      return {
        title: data.title,
        description: data.description,
        extract: data.extract,
        url: data.content_urls?.desktop?.page,
      };
    }
    case "getHackerNewsTopStories": {
      const count = Math.max(1, Math.min(10, Number(args.count) || 5));
      const ids = await fetchJson<number[]>("https://hacker-news.firebaseio.com/v0/topstories.json");
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
    }
    case "getCryptoPrice": {
      const url = new URL("https://api.coingecko.com/api/v3/simple/price");
      url.searchParams.set("ids", getRequiredString(args.coinId).toLowerCase());
      url.searchParams.set("vs_currencies", (getOptionalString(args.currency) || "usd").toLowerCase());
      url.searchParams.set("include_24hr_change", "true");

      return fetchJson<Record<string, Record<string, number>>>(url);
    }
    case "getExchangeRate": {
      const from = getRequiredString(args.from).toUpperCase();
      const to = getRequiredString(args.to).toUpperCase();
      const url = new URL("https://api.frankfurter.app/latest");
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);

      return fetchJson<ExchangeRateResponse>(url);
    }
    default:
      return { error: `unknown tool: ${name}` };
  }
}

function getRequiredString(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("missing required string argument");
  }

  return value;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

type GeocodeResult =
  | {
      country: string;
      latitude: number;
      longitude: number;
      name: string;
      timezone?: string;
    }
  | { error: string };

type OpenMeteoGeocode = {
  results?: Array<{
    admin1?: string;
    country: string;
    latitude: number;
    longitude: number;
    name: string;
    timezone?: string;
  }>;
};

type OpenMeteoForecast = {
  current?: {
    apparent_temperature?: number;
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    precipitation_probability_max?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    time?: string[];
    weather_code?: number[];
  };
  timezone?: string;
};

type WikipediaSearchResponse = {
  query: {
    search: Array<{
      snippet: string;
      title: string;
    }>;
  };
};

type WikipediaSummary = {
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
  description?: string;
  extract?: string;
  title: string;
};

type HackerNewsItem = {
  id: number;
  score?: number;
  title?: string;
  url?: string;
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
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    name: [place.name, place.admin1].filter(Boolean).join(", "),
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
