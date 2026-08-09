import { normalizePhone } from "@/lib/claw";
import { extractLinkedIn } from "@/lib/leads";

export const ADMIN_PHONE = normalizePhone(
  process.env.ADMIN_PHONE || "+17816929689",
);

export const HOLD_TIGHT_MESSAGE =
  "Great, we're approving new ppl everyday, hold tight for your first question";

export const WANT_ANOTHER_MESSAGE =
  "Want another paid question? Reply yes or no.";

export const ALL_DONE_MESSAGE =
  "Awesome — that's all for now. We'll text you when there's another good one.";

export const REWARD_AMOUNT = 20;

export function isYes(text: string) {
  return /^(y|yes|yeah|yep|yea|sure|ok|okay|down|i'?m down|bet|please)\b/i.test(
    text.trim(),
  );
}

export function isNo(text: string) {
  return /^(n|no|nah|nope|not now|stop)\b/i.test(text.trim());
}

/** Pull phone or LinkedIn from an approval prompt / associated message body. */
export function extractApprovalTarget(text: string) {
  const phoneLine = text.match(/Phone:\s*([+\d()\s-]+)/i);
  if (phoneLine) {
    const phone = normalizePhone(phoneLine[1]);
    if (phone) return phone;
  }

  const linkedinLine = text.match(/LinkedIn:\s*(\S+)/i);
  if (linkedinLine) {
    const linkedin = extractLinkedIn(linkedinLine[1]) || linkedinLine[1].trim();
    if (linkedin) return linkedin;
  }

  const linkedin = extractLinkedIn(text);
  if (linkedin) return linkedin;

  // Only treat short phone-like strings as phones — never digit-scrape a whole prompt.
  const trimmed = text.trim();
  if (/^\+?[\d\s().-]{10,18}$/.test(trimmed)) {
    return normalizePhone(trimmed);
  }

  return "";
}

function thumbsDecision(token: string): "approve" | "reject" | null {
  const value = token.trim();
  if (!value) return null;

  if (value === "+1") return "approve";
  if (value === "-1") return "reject";
  if (value.includes("👍")) return "approve";
  if (value.includes("👎")) return "reject";

  const lower = value.toLowerCase();
  if (lower === "like" || lower === "love") return "approve";
  if (lower === "dislike") return "reject";
  return null;
}

export function parseAdminCommand(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const approve = trimmed.match(/^approve(?:\s+(.+))?$/i);
  if (approve) {
    return {
      type: "approve" as const,
      target: (approve[1] || "").trim(),
    };
  }

  const reject = trimmed.match(/^reject(?:\s+(.+))?$/i);
  if (reject) {
    return {
      type: "reject" as const,
      target: (reject[1] || "").trim(),
    };
  }

  const paid = trimmed.match(/^paid(?:\s+(.+))?$/i);
  if (paid) {
    return { type: "paid" as const, target: (paid[1] || "").trim() };
  }

  // Tapback/emoji replies (👍👎/like/dislike), incl. openclaw-style: like "body".
  const quoted = trimmed.match(/^(like|love|dislike)\s+[\u0022\u0027\u201c\u201d]([\s\S]*)[\u0022\u0027\u201c\u201d]$/i);
  if (quoted) {
    const decision = thumbsDecision(quoted[1]);
    if (decision) {
      return {
        type: decision,
        target: extractApprovalTarget(quoted[2]),
      };
    }
  }

  const tokenMatch = trimmed.match(/^(\S+)(?:\s+([\s\S]+))?$/);
  if (tokenMatch) {
    const decision = thumbsDecision(tokenMatch[1]);
    if (decision) {
      const rest = (tokenMatch[2] || "").trim();
      return {
        type: decision,
        target: rest ? extractApprovalTarget(rest) || rest : "",
      };
    }
  }

  return null;
}
