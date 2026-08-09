import { SAMPLE_QUESTION } from "@/lib/claw";

const FALLBACK_FOLLOW_UPS = [
  "What tools or products did you use most in your last role, and what did you like or dislike about them? (up to $20 reward)",
  "At a previous company, what process or system was most broken — and how did your team work around it? (up to $20 reward)",
  "Which vendor or software have you evaluated or switched away from recently, and why? (up to $20 reward)",
];

export async function generateFollowUpQuestions(linkedin: string) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return FALLBACK_FOLLOW_UPS;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You write short paid expert-network text questions. Return ONLY a JSON array of exactly 3 strings. Each question should be about prior jobs, products/tools used, vendors, or concrete work experience. Keep each under 220 characters. End each with (up to $20 reward). Do not mention LinkedIn scraping limits.",
          },
          {
            role: "user",
            content: `LinkedIn profile: ${linkedin}\n\nThey already got this first question, so avoid repeating it:\n${SAMPLE_QUESTION}\n\nWrite 3 different follow-up questions tailored to someone with this profile URL/name.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn("question gen failed", response.status, await response.text());
      return FALLBACK_FOLLOW_UPS;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    const start = content.indexOf("[");
    const end = content.lastIndexOf("]");
    if (start === -1 || end === -1) return FALLBACK_FOLLOW_UPS;

    const parsed = JSON.parse(content.slice(start, end + 1)) as unknown;
    if (!Array.isArray(parsed)) return FALLBACK_FOLLOW_UPS;

    const questions = parsed
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 3);

    while (questions.length < 3) {
      questions.push(FALLBACK_FOLLOW_UPS[questions.length]);
    }

    return questions;
  } catch (error) {
    console.warn("question gen error", error);
    return FALLBACK_FOLLOW_UPS;
  }
}
