// Post activity to a Slack channel via an Incoming Webhook (best-effort).
const WEBHOOK = (process.env.SLACK_WEBHOOK_URL || "").trim();

export function slackReady() {
  return WEBHOOK.startsWith("https://hooks.slack.com/");
}

export async function slackPost(text: string) {
  if (!slackReady()) return;
  try {
    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    console.error("slack post failed", error);
  }
}
