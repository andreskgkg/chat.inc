// Outbound message copy + defaults for the chat.inc flow.

export const WELCOME_MESSAGES = [
  "Hey welcome to chat.inc!",
  "Reply with your LinkedIn so we know who you are.",
  "After that you'll get your first (paid) question!",
] as const;

export const HOLD_TIGHT_MESSAGE =
  "Great, we're approving new folks every day — hold tight for your first question.";

export const THANKS_MESSAGE = "Got it — here's your paid question:";

export const WANT_ANOTHER_MESSAGE =
  "Want another paid question? Reply yes or no.";

export const ALL_DONE_MESSAGE =
  "Awesome — that's all for now. We'll text you when there's another good one.";

export const SAMPLE_QUESTION =
  "What payroll provider does your company use (ADP, Rippling, Gusto, Deel) and what's your experience with it?";

export function formatAmount(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function paidThankYou(amountCents: number) {
  return `Great, thank you! Sending you ${formatAmount(amountCents)} now 💸`;
}

export function payoutSetupMessage(url: string) {
  return `You're approved! Set up how you'll get paid (takes 30 seconds), then we'll send your reward: ${url}`;
}
