"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken, checkPassword, isAdmin } from "@/lib/auth";
import { getPersonById } from "@/lib/db";
import { payoutSetupMessage } from "@/lib/messages";
import { sendText } from "@/lib/sendblue";
import {
  approvePerson,
  ensureOnboardingLink,
  payForQuestion,
  rejectPerson,
  sendQuestionTo,
} from "@/lib/service";

function dollarsToCents(value: FormDataEntryValue | null): number | undefined {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
}

async function guard() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!checkPassword(password)) redirect("/admin/login?error=1");
  const store = await cookies();
  store.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function approveAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const question = String(formData.get("question") || "").trim();
  await approvePerson(id, {
    firstQuestion: question || undefined,
    amountCents: dollarsToCents(formData.get("amount")),
  });
  redirect(`/admin/${id}`);
}

export async function rejectAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  await rejectPerson(id);
  redirect(`/admin/${id}`);
}

export async function sendQuestionAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const text = String(formData.get("question") || "").trim();
  if (text) await sendQuestionTo(id, text, dollarsToCents(formData.get("amount")));
  redirect(`/admin/${id}`);
}

export async function payAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const questionId = String(formData.get("questionId") || "") || null;
  const amount = dollarsToCents(formData.get("amount"));
  if (amount) await payForQuestion(id, questionId, amount);
  redirect(`/admin/${id}`);
}

export async function onboardingAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const url = await ensureOnboardingLink(id);
  const person = await getPersonById(id);
  if (person) {
    await sendText(person.phone, payoutSetupMessage(url), { personId: id });
  }
  redirect(`/admin/${id}`);
}
