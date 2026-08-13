// Business logic for the chat.inc flow, shared by API routes + the dashboard.
import { appUrl } from "@/lib/config";
import {
  createPayout,
  createPerson,
  createQuestion,
  getDefaultAmountCents,
  getOpenQuestion,
  getPersonById,
  getPersonByPhone,
  updatePayout,
  updatePerson,
  updateQuestion,
} from "@/lib/db";
import {
  HOLD_TIGHT_MESSAGE,
  THANKS_MESSAGE,
  WELCOME_MESSAGES,
  formatAmount,
  paidThankYou,
  payoutSetupMessage,
} from "@/lib/messages";
import { displayPhone, extractLinkedIn, normalizePhone } from "@/lib/phone";
import { notifyAdmin, sendMany, sendText } from "@/lib/sendblue";
import { slackPost } from "@/lib/slack";
import {
  createAccountLink,
  createExpressAccount,
  getAccount,
  pay,
} from "@/lib/stripe";

/** Landing form: create the person and send the welcome sequence. */
export async function startLead(rawPhone: string) {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new Error("Enter a valid phone number.");
  const person = await createPerson(phone);
  await sendMany(phone, WELCOME_MESSAGES, { personId: person.id });
  await slackPost(`📱 New number — ${displayPhone(phone)}`);
  return person;
}

/** Inbound reply from a person (called by the Sendblue webhook). */
export async function handleInbound(rawPhone: string, text: string) {
  const phone = normalizePhone(rawPhone);
  const person = await getPersonByPhone(phone);
  if (!person) return { ignored: true as const };

  if (person.status === "awaiting_identity") {
    const linkedin = extractLinkedIn(text);
    await updatePerson(person.id, {
      identity: text,
      linkedin: linkedin || person.linkedin,
      status: "pending_approval",
    });
    await sendText(phone, HOLD_TIGHT_MESSAGE, { personId: person.id });
    await notifyAdmin(
      `New chat.inc applicant\n${linkedin || text}\n${phone}\nApprove in the dashboard.`,
    );
    await slackPost(
      `🆕 *New applicant to approve*\n${linkedin || text}\n${displayPhone(phone)}\n${appUrl()}/admin/${person.id}`,
    );
    return { pending: true as const };
  }

  const open = await getOpenQuestion(person.id);
  if (open) {
    await updateQuestion(open.id, {
      status: "answered",
      answer: text,
      answered_at: new Date().toISOString(),
    });
    await notifyAdmin(
      `Answer from ${person.linkedin || phone}:\n\n${text}\n\nPay in the dashboard.`,
    );
    await slackPost(
      `💬 *Answer* from ${person.linkedin || displayPhone(phone)}\n"${text}"\n${appUrl()}/admin/${person.id}`,
    );
    return { answered: true as const };
  }

  return { stored: true as const };
}

export async function approvePerson(
  personId: string,
  opts: { firstQuestion?: string; amountCents?: number } = {},
) {
  const person = await getPersonById(personId);
  if (!person) throw new Error("Person not found");
  await updatePerson(personId, { status: "active" });
  if (opts.firstQuestion?.trim()) {
    await sendQuestionTo(personId, opts.firstQuestion.trim(), opts.amountCents);
  }
  return getPersonById(personId);
}

export function rejectPerson(personId: string) {
  return updatePerson(personId, { status: "rejected" });
}

export async function sendQuestionTo(
  personId: string,
  text: string,
  amountCents?: number,
) {
  const person = await getPersonById(personId);
  if (!person) throw new Error("Person not found");
  const amount = amountCents ?? (await getDefaultAmountCents());
  const question = await createQuestion({
    person_id: personId,
    text,
    amount_cents: amount,
  });
  await sendText(person.phone, THANKS_MESSAGE, { personId });
  await sendText(person.phone, `${text} (up to ${formatAmount(amount)})`, {
    personId,
  });
  return question;
}

/** Create the Stripe account (if needed) and a one-time onboarding link. */
export async function ensureOnboardingLink(personId: string) {
  const person = await getPersonById(personId);
  if (!person) throw new Error("Person not found");

  let accountId = person.stripe_account_id;
  if (!accountId) {
    accountId = await createExpressAccount();
    await updatePerson(personId, { stripe_account_id: accountId });
  }

  return createAccountLink(
    accountId,
    `${appUrl()}/api/stripe/refresh?person=${personId}`,
    `${appUrl()}/api/stripe/return?person=${personId}`,
  );
}

/** Re-check Stripe onboarding status and flip payout_ready when complete. */
export async function refreshPayoutStatus(personId: string) {
  const person = await getPersonById(personId);
  if (!person?.stripe_account_id) return false;
  const account = await getAccount(person.stripe_account_id);
  if (account.payouts_enabled && !person.payout_ready) {
    await updatePerson(personId, { payout_ready: true });
  }
  return account.payouts_enabled;
}

/**
 * Pay for an answered question. If the person hasn't set up payouts yet,
 * text them the one-time onboarding link instead of paying.
 */
export async function payForQuestion(
  personId: string,
  questionId: string | null,
  amountCents: number,
) {
  const person = await getPersonById(personId);
  if (!person) throw new Error("Person not found");

  if (!person.payout_ready || !person.stripe_account_id) {
    const url = await ensureOnboardingLink(personId);
    await sendText(person.phone, payoutSetupMessage(url), { personId });
    return { onboarding: true as const, url };
  }

  const payout = await createPayout({
    person_id: personId,
    question_id: questionId,
    amount_cents: amountCents,
  });

  try {
    const { transferId, payoutId } = await pay(
      person.stripe_account_id,
      amountCents,
    );
    await updatePayout(payout.id, {
      status: "paid",
      stripe_transfer_id: transferId,
      stripe_payout_id: payoutId,
    });
    if (questionId) {
      await updateQuestion(questionId, {
        status: "paid",
        paid_at: new Date().toISOString(),
      });
    }
    await sendText(person.phone, paidThankYou(amountCents), { personId });
    return { paid: true as const, amount: amountCents };
  } catch (error) {
    await updatePayout(payout.id, {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
