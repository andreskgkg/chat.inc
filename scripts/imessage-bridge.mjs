#!/usr/bin/env node
// Sends chat.inc outbox messages from this Mac's iMessage and forwards replies to the inbound API.
// Env: OUTBOX_SECRET (required), CHAT_INC_URL, IMSG_BIN, POLL_MS.

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const SECRET = process.env.OUTBOX_SECRET?.trim();
const BASE = (process.env.CHAT_INC_URL || "https://chat.inc").replace(/\/$/, "");
const IMSG = process.env.IMSG_BIN || "imsg";
const POLL_MS = Number(process.env.POLL_MS || 4000);
const ADMIN_FALLBACK = "+17816929689";

if (!SECRET) {
  console.error("Missing OUTBOX_SECRET");
  process.exit(1);
}

async function claim() {
  const response = await fetch(`${BASE}/api/outbox/claim`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit: 10 }),
  });
  if (!response.ok) {
    throw new Error(`claim failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.messages || [];
}

async function complete(id, ok, error) {
  await fetch(`${BASE}/api/outbox/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, ok, error }),
  });
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `exit ${code}`));
    });
  });
}

async function sendImessage(phone, text) {
  await run(IMSG, ["send", "--to", phone, "--text", text]);
}

async function drainOnce() {
  const messages = await claim();
  for (const message of messages) {
    try {
      console.log(`→ send ${message.phone}: ${message.text.slice(0, 80)}…`);
      await sendImessage(message.phone, message.text);
      await complete(message.id, true);
      console.log(`✓ sent ${message.id}`);
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      console.error(`✗ failed ${message.id}`, err);
      await complete(message.id, false, err);
    }
  }
}

function looksLikePhone(value) {
  return /^\+?\d{10,15}$/.test(String(value || "").replace(/[\s()-]/g, ""));
}

function normalizeHandle(value) {
  return String(value || "").trim();
}

function isAdminCommand(text) {
  const trimmed = text.trim();
  if (/^(approve|reject|paid|like|love|dislike)\b/i.test(trimmed)) return true;
  if (/^[👍👎]/u.test(trimmed)) return true;
  if (/^(\+1|-1)(?:\s|$)/.test(trimmed)) return true;
  return false;
}

function extractApprovalTarget(text) {
  const blob = String(text || "");
  const phoneLine = blob.match(/Phone:\s*([+\d()\s-]+)/i);
  if (phoneLine) {
    const digits = phoneLine[1].replace(/[^\d+]/g, "");
    if (looksLikePhone(digits)) {
      return digits.startsWith("+") ? digits : `+${digits}`;
    }
  }

  const linkedinLine = blob.match(/LinkedIn:\s*(\S+)/i);
  if (linkedinLine?.[1]) return linkedinLine[1].trim();

  const linkedin = blob.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?/i,
  );
  if (linkedin?.[0]) {
    return linkedin[0].startsWith("http")
      ? linkedin[0].replace(/\/$/, "")
      : `https://${linkedin[0].replace(/\/$/, "")}`;
  }

  return "";
}

function reactionDecision(event) {
  if (event.is_reaction_add === false) return null;

  const type = String(event.reaction_type || event.reaction || "").toLowerCase();
  const emoji = String(event.reaction_emoji || "");
  const text = String(event.text || event.body || "").trim();

  if (type === "like" || type === "love" || /^👍/u.test(emoji)) {
    return "approve";
  }
  if (type === "dislike" || /^👎/u.test(emoji)) {
    return "reject";
  }

  // openclaw-style synthetic text: like "original body"
  const quoted = text.match(/^(like|love|dislike)\s+[\u0022\u0027\u201c\u201d]([\s\S]*)[\u0022\u0027\u201c\u201d]$/i);
  if (quoted) {
    if (/^(like|love)$/i.test(quoted[1])) return "approve";
    if (/^dislike$/i.test(quoted[1])) return "reject";
  }

  if (/^👍/u.test(text) || text === "+1") return "approve";
  if (/^👎/u.test(text) || text === "-1") return "reject";

  return null;
}

function associatedBody(event) {
  const text = String(event.text || event.body || "");
  const quoted = text.match(/^(?:like|love|dislike)\s+[\u0022\u0027\u201c\u201d]([\s\S]*)[\u0022\u0027\u201c\u201d]$/i);
  return [
    event.reply_to_text,
    event.associated_text,
    event.reacted_to_text,
    quoted?.[1],
    text,
  ]
    .filter(Boolean)
    .join("\n");
}

async function forwardInbound(phone, text, extra = {}) {
  const response = await fetch(`${BASE}/api/claw/inbound`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "message",
      phone_number: phone,
      text,
      ...extra,
    }),
  });
  const body = await response.text();
  console.log(`← inbound ${phone} → ${response.status} ${body}`);
}

function startWatch() {
  const child = spawn(IMSG, ["watch", "--json", "--reactions"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let buffer = "";
  child.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.is_group) continue;

        const isReaction = Boolean(
          event.is_reaction || event.is_tapback || event.reaction_type,
        );
        const fromMe = Boolean(event.is_from_me || event.fromMe);
        const sender = normalizeHandle(
          event.sender || event.from || event.handle || event.phone_number || "",
        );
        const chatId = normalizeHandle(
          event.chat_identifier || event.reply_to_sender || "",
        );

        // Tapbacks: 👍 approve / 👎 reject on the approval prompt.
        if (isReaction) {
          const decision = reactionDecision(event);
          if (!decision) continue;
          if (!fromMe && !looksLikePhone(sender)) continue;

          const target = extractApprovalTarget(associatedBody(event));
          const command = `${decision === "approve" ? "Approve" : "Reject"}${
            target ? ` ${target}` : ""
          }`;
          const phone =
            (looksLikePhone(chatId) && chatId) ||
            (looksLikePhone(sender) && sender) ||
            ADMIN_FALLBACK;

          console.log(`↺ reaction ${decision} → ${command}`);
          forwardInbound(phone, command, {
            type: "reaction",
            is_from_me: true,
            is_reaction: true,
            is_tapback: true,
            reaction_type: event.reaction_type || decision,
            reaction_emoji: event.reaction_emoji || "",
            reply_to_text: associatedBody(event),
          }).catch((error) => console.error("forward failed", error));
          continue;
        }

        const text = String(event.text || event.body || event.message || "")
          .replace(/\uFFFC/g, "")
          .trim();
        if (!text) continue;

        // Your Approve / Paid / Reject / 👍👎 commands (sent from this Mac).
        if (fromMe) {
          if (!isAdminCommand(text)) continue;
          const target = looksLikePhone(chatId) ? chatId : sender;
          if (!looksLikePhone(target) && !/linkedin\.com\/in\//i.test(text)) {
            // Still forward — API can resolve LinkedIn / latest pending.
            forwardInbound(chatId || sender || ADMIN_FALLBACK, text, {
              is_from_me: true,
            }).catch((error) => console.error("forward failed", error));
            continue;
          }
          forwardInbound(target || ADMIN_FALLBACK, text, {
            is_from_me: true,
          }).catch((error) => console.error("forward failed", error));
          continue;
        }

        // Expert replies into your iMessage.
        if (!looksLikePhone(sender)) continue;
        forwardInbound(sender, text).catch((error) => {
          console.error("forward failed", error);
        });
      } catch (error) {
        console.warn("watch parse skip", line.slice(0, 120), error.message);
      }
    }
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  child.on("exit", (code) => {
    console.error(`imsg watch exited (${code}); restarting in 2s`);
    setTimeout(startWatch, 2000);
  });
}

console.log(`chat.inc iMessage bridge → ${BASE}`);
console.log("Sending from your Mac Messages identity (current number).");
console.log("Watching messages + tapbacks (👍 approve / 👎 reject).");
startWatch();

for (;;) {
  try {
    await drainOnce();
  } catch (error) {
    console.error("drain error", error);
  }
  await sleep(POLL_MS);
}
