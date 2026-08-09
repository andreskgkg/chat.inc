import { NextResponse } from "next/server";
import {
  SAMPLE_QUESTION,
  THANKS_MESSAGE,
  normalizePhone,
  sendText,
} from "@/lib/claw";
import {
  ADMIN_PHONE,
  ALL_DONE_MESSAGE,
  HOLD_TIGHT_MESSAGE,
  REWARD_AMOUNT,
  WANT_ANOTHER_MESSAGE,
  extractApprovalTarget,
  isNo,
  isYes,
  parseAdminCommand,
} from "@/lib/flow";
import {
  extractLinkedIn,
  findLeadByLinkedIn,
  findLatestPendingApproval,
  getLead,
  normalizeLinkedIn,
  upsertLead,
  type Lead,
} from "@/lib/leads";
import { generateFollowUpQuestions } from "@/lib/questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InboundBody = {
  type?: string;
  phone_number?: string;
  phone?: string;
  from?: string;
  text?: string;
  body?: string;
  message?: string | { text?: string; body?: string };
  is_from_me?: boolean;
  is_reaction?: boolean;
  is_tapback?: boolean;
  is_reaction_add?: boolean;
  reaction_type?: string;
  reaction_emoji?: string;
  reply_to_text?: string;
  associated_text?: string;
  reacted_to_text?: string;
  chat_identifier?: string;
  data?: {
    phone_number?: string;
    phone?: string;
    text?: string;
    body?: string;
  };
};

function reactionCommandFromPayload(payload: InboundBody) {
  if (payload.is_reaction_add === false) return null;

  const type = String(payload.reaction_type || "").toLowerCase();
  const emoji = String(payload.reaction_emoji || "");
  let decision: "approve" | "reject" | null = null;

  if (type === "like" || type === "love" || /^👍/u.test(emoji)) {
    decision = "approve";
  } else if (type === "dislike" || /^👎/u.test(emoji)) {
    decision = "reject";
  }

  if (!decision) return null;

  const associated = [
    payload.reply_to_text,
    payload.associated_text,
    payload.reacted_to_text,
    typeof payload.text === "string" ? payload.text : "",
  ]
    .filter(Boolean)
    .join("\n");

  const target = extractApprovalTarget(associated);
  return `${decision === "approve" ? "Approve" : "Reject"}${
    target ? ` ${target}` : ""
  }`;
}

function extractPhone(payload: InboundBody) {
  return normalizePhone(
    payload.phone_number ||
      payload.phone ||
      payload.from ||
      payload.data?.phone_number ||
      payload.data?.phone ||
      "",
  );
}

function extractText(payload: InboundBody) {
  if (typeof payload.text === "string") return payload.text.trim();
  if (typeof payload.body === "string") return payload.body.trim();
  if (typeof payload.message === "string") return payload.message.trim();
  if (payload.message && typeof payload.message === "object") {
    return (payload.message.text || payload.message.body || "").trim();
  }
  return (payload.data?.text || payload.data?.body || "").trim();
}

function looksLikePhoneTarget(target: string) {
  return /^\+?[\d\s().-]{10,18}$/.test(target.trim());
}

async function resolveLeadFromTarget(target: string) {
  const trimmed = target.trim();
  if (!trimmed) return null;

  if (looksLikePhoneTarget(trimmed)) {
    const asPhone = normalizePhone(trimmed);
    if (asPhone) return getLead(asPhone);
  }

  if (normalizeLinkedIn(trimmed) || /linkedin\.com\/in\//i.test(trimmed)) {
    return findLeadByLinkedIn(trimmed);
  }

  return null;
}

async function notifyAdmin(text: string) {
  await sendText(ADMIN_PHONE, text);
}

async function resolveAdminLead(target: string, chatPhone: string) {
  if (target) {
    // Explicit target from the approval message — never fall back to another lead.
    return resolveLeadFromTarget(target);
  }

  // Don't treat the admin's own chat handle as an applicant.
  if (chatPhone && chatPhone !== ADMIN_PHONE) {
    const byChat = await getLead(chatPhone);
    if (byChat) return byChat;
  }

  // Thumbs with no parseable Phone/LinkedIn: newest pending applicant only.
  return findLatestPendingApproval();
}

function approvalStatusMessage(lead: { phone: string; status: string }) {
  if (lead.status === "awaiting_identity") {
    return `Lead ${lead.phone} hasn't sent LinkedIn yet (${lead.status}).`;
  }
  if (lead.status === "pending_approval" || lead.status === "rejected") {
    return null;
  }
  return `Lead ${lead.phone} isn't waiting for approval (${lead.status}).`;
}

async function handleAdminCommand(text: string, chatPhone: string) {
  const command = parseAdminCommand(text);
  if (!command) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (command.type === "approve") {
    const lead = await resolveAdminLead(command.target, chatPhone);

    if (!lead) {
      await notifyAdmin(
        command.target
          ? `Couldn't find a lead for: ${command.target}`
          : "Couldn't find a pending applicant to approve.",
      );
      return NextResponse.json({ ok: true, missing: true });
    }

    const blocked = approvalStatusMessage(lead);
    if (blocked) {
      await notifyAdmin(blocked);
      return NextResponse.json({ ok: true, already: true });
    }

    const followUps =
      lead.followUps?.length === 3
        ? lead.followUps
        : await generateFollowUpQuestions(lead.linkedin || lead.identity || "");

    await upsertLead({
      ...lead,
      followUps,
      status: "q1_sent",
      updatedAt: new Date().toISOString(),
    });

    await sendText(lead.phone, THANKS_MESSAGE);
    await sendText(lead.phone, SAMPLE_QUESTION);
    await notifyAdmin(`Approved ${lead.phone}. Payroll question sent.`);
    return NextResponse.json({ ok: true, approved: lead.phone });
  }

  if (command.type === "reject") {
    const lead = await resolveAdminLead(command.target, chatPhone);
    if (!lead) {
      await notifyAdmin(
        command.target
          ? `Couldn't find a lead for: ${command.target}`
          : "Couldn't find a pending applicant to reject.",
      );
      return NextResponse.json({ ok: true, missing: true });
    }

    const blocked = approvalStatusMessage(lead);
    if (blocked && lead.status !== "rejected") {
      await notifyAdmin(blocked);
      return NextResponse.json({ ok: true, already: true });
    }

    await upsertLead({
      ...lead,
      status: "rejected",
      updatedAt: new Date().toISOString(),
    });
    await notifyAdmin(`Rejected ${lead.phone}.`);
    return NextResponse.json({ ok: true, rejected: lead.phone });
  }

  // paid
  const lead =
    (command.target
      ? await resolveLeadFromTarget(command.target)
      : null) || (await getLead(chatPhone));

  if (!lead?.pendingPay) {
    await notifyAdmin(
      `No pending payout found${command.target ? ` for ${command.target}` : ""}.`,
    );
    return NextResponse.json({ ok: true, missing: true });
  }

  const justPaid = lead.pendingPay.question;
  const nextStatus =
    justPaid === "q1"
      ? "awaiting_more"
      : justPaid === "q2"
        ? "awaiting_more"
        : "done";

  await upsertLead({
    ...lead,
    pendingPay: undefined,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  });

  if (justPaid === "q3" || nextStatus === "done") {
    await sendText(lead.phone, ALL_DONE_MESSAGE);
    await notifyAdmin(`Marked ${lead.phone} paid for ${justPaid}. Done.`);
    return NextResponse.json({ ok: true, paid: lead.phone, done: true });
  }

  await sendText(lead.phone, WANT_ANOTHER_MESSAGE);
  await notifyAdmin(
    `Marked ${lead.phone} paid for ${justPaid}. Asked if they want another.`,
  );
  return NextResponse.json({ ok: true, paid: lead.phone });
}

async function handleLeadMessage(lead: Lead, text: string) {
  const now = new Date().toISOString();

  if (lead.status === "awaiting_identity") {
    const linkedin = extractLinkedIn(text) || text;
    const followUps = await generateFollowUpQuestions(linkedin);

    await upsertLead({
      ...lead,
      identity: text,
      linkedin,
      followUps,
      status: "pending_approval",
      updatedAt: now,
    });

    await sendText(lead.phone, HOLD_TIGHT_MESSAGE);
    await notifyAdmin(
      [
        "New chat.inc applicant",
        `Phone: ${lead.phone}`,
        `LinkedIn: ${linkedin}`,
        "",
        "👍 on this message to approve",
        "👎 on this message to reject",
        "",
        `Or text: Approve ${linkedin}`,
        `Or: Reject ${linkedin}`,
      ].join("\n"),
    );

    return NextResponse.json({ ok: true, pending_approval: true });
  }

  if (lead.status === "pending_approval" || lead.status === "rejected") {
    return NextResponse.json({ ok: true, waiting: true });
  }

  if (lead.status === "q1_sent") {
    await upsertLead({
      ...lead,
      answers: { ...lead.answers, q1: text },
      pendingPay: {
        question: "q1",
        amount: REWARD_AMOUNT,
        answer: text,
      },
      status: "q1_answered",
      updatedAt: now,
    });

    await notifyAdmin(
      [
        `Answer from ${lead.phone} (Q1 / payroll)`,
        `LinkedIn: ${lead.linkedin || lead.identity || "n/a"}`,
        "",
        text,
        "",
        `Send Apple Cash $${REWARD_AMOUNT}, then reply: Paid ${lead.phone}`,
      ].join("\n"),
    );

    return NextResponse.json({ ok: true, answered: "q1" });
  }

  if (lead.status === "q1_answered" || lead.status === "q2_answered" || lead.status === "q3_answered") {
    return NextResponse.json({ ok: true, waiting_for_paid: true });
  }

  if (lead.status === "awaiting_more") {
    if (isNo(text)) {
      await upsertLead({ ...lead, status: "done", updatedAt: now });
      await sendText(lead.phone, ALL_DONE_MESSAGE);
      return NextResponse.json({ ok: true, done: true });
    }

    if (!isYes(text)) {
      await sendText(lead.phone, WANT_ANOTHER_MESSAGE);
      return NextResponse.json({ ok: true, clarify: true });
    }

    const answeredQ2 = Boolean(lead.answers?.q2);
    const nextQuestion = answeredQ2
      ? lead.followUps?.[1]
      : lead.followUps?.[0];
    const nextStatus = answeredQ2 ? "q3_sent" : "q2_sent";

    if (!nextQuestion) {
      await upsertLead({ ...lead, status: "done", updatedAt: now });
      await sendText(lead.phone, ALL_DONE_MESSAGE);
      return NextResponse.json({ ok: true, done: true });
    }

    await upsertLead({ ...lead, status: nextStatus, updatedAt: now });
    await sendText(lead.phone, THANKS_MESSAGE);
    await sendText(lead.phone, nextQuestion);
    return NextResponse.json({ ok: true, sent: nextStatus });
  }

  if (lead.status === "q2_sent") {
    await upsertLead({
      ...lead,
      answers: { ...lead.answers, q2: text },
      pendingPay: {
        question: "q2",
        amount: REWARD_AMOUNT,
        answer: text,
      },
      status: "q2_answered",
      updatedAt: now,
    });

    await notifyAdmin(
      [
        `Answer from ${lead.phone} (Q2)`,
        `LinkedIn: ${lead.linkedin || lead.identity || "n/a"}`,
        "",
        text,
        "",
        `Send Apple Cash $${REWARD_AMOUNT}, then reply: Paid ${lead.phone}`,
      ].join("\n"),
    );

    return NextResponse.json({ ok: true, answered: "q2" });
  }

  if (lead.status === "q3_sent") {
    await upsertLead({
      ...lead,
      answers: { ...lead.answers, q3: text },
      pendingPay: {
        question: "q3",
        amount: REWARD_AMOUNT,
        answer: text,
      },
      status: "q3_answered",
      updatedAt: now,
    });

    await notifyAdmin(
      [
        `Answer from ${lead.phone} (Q3)`,
        `LinkedIn: ${lead.linkedin || lead.identity || "n/a"}`,
        "",
        text,
        "",
        `Send Apple Cash $${REWARD_AMOUNT}, then reply: Paid ${lead.phone}`,
      ].join("\n"),
    );

    return NextResponse.json({ ok: true, answered: "q3" });
  }

  return NextResponse.json({ ok: true, skipped: true });
}

export async function POST(request: Request) {
  try {
    const clawSecret = process.env.CLAW_WEBHOOK_SECRET?.trim();
    const outboxSecret = process.env.OUTBOX_SECRET?.trim();
    if (clawSecret || outboxSecret) {
      const header =
        request.headers.get("x-claw-signature") ||
        request.headers.get("authorization") ||
        "";
      const ok =
        (clawSecret && header.includes(clawSecret)) ||
        (outboxSecret && header === `Bearer ${outboxSecret}`);
      if (!ok) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = (await request.json()) as InboundBody;
    const isReaction =
      payload.type === "reaction" ||
      Boolean(payload.is_reaction) ||
      Boolean(payload.is_tapback);

    if (payload.type && payload.type !== "message" && !isReaction) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const phone = extractPhone(payload) || ADMIN_PHONE;
    const reactionText = isReaction
      ? reactionCommandFromPayload(payload)
      : null;
    const text = reactionText || extractText(payload);

    if (!phone || !text) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const command = parseAdminCommand(text);
    const fromAdmin =
      phone === ADMIN_PHONE ||
      Boolean(payload.is_from_me) ||
      Boolean(isReaction && reactionText);

    if (command && fromAdmin) {
      return handleAdminCommand(text, phone);
    }

    const lead = await getLead(phone);
    if (!lead) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    return handleLeadMessage(lead, text);
  } catch (error) {
    console.error("claw inbound failed", error);
    return NextResponse.json({ error: "Inbound handling failed" }, { status: 500 });
  }
}
