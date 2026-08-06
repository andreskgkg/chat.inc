#!/usr/bin/env node
/**
 * Option C bridge: send chat.inc outbox messages from your Mac iMessage
 * (your current number, +17816929689) and forward replies to the inbound API.
 *
 * Required env:
 *   OUTBOX_SECRET   - shared secret with Vercel
 *   CHAT_INC_URL    - https://chat.inc (default)
 *
 * Optional:
 *   IMSG_BIN        - path to imsg (default: imsg on PATH)
 *   POLL_MS         - outbox poll interval (default: 4000)
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const SECRET = process.env.OUTBOX_SECRET?.trim();
const BASE = (process.env.CHAT_INC_URL || "https://chat.inc").replace(/\/$/, "");
const IMSG = process.env.IMSG_BIN || "imsg";
const POLL_MS = Number(process.env.POLL_MS || 4000);

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

async function forwardInbound(phone, text) {
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
    }),
  });
  const body = await response.text();
  console.log(`← inbound ${phone} → ${response.status} ${body}`);
}

function startWatch() {
  const child = spawn(IMSG, ["watch", "--json"], {
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
        if (event.is_group || event.is_from_me || event.fromMe) continue;
        const phone = String(
          event.sender ||
            event.from ||
            event.handle ||
            event.phone_number ||
            "",
        ).trim();
        const text = String(event.text || event.body || event.message || "")
          .replace(/\uFFFC/g, "")
          .trim();
        // Only 1:1 phone replies (not groups / business urns / short codes).
        if (!/^\+?\d{10,15}$/.test(phone.replace(/[\s()-]/g, "")) || !text) {
          continue;
        }
        forwardInbound(phone, text).catch((error) => {
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
startWatch();

for (;;) {
  try {
    await drainOnce();
  } catch (error) {
    console.error("drain error", error);
  }
  await sleep(POLL_MS);
}
