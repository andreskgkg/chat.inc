import type { Metadata } from "next";
import { OnboardView } from "../v2";

export const metadata: Metadata = {
  title: "Onboarding — chat.inc",
  description:
    "Step-by-step onboarding for chat.inc: copy the prompt into your AI agent, let it answer questions for you, and get paid through Stripe. Includes instructions for agents.",
};

export default function OnboardPage() {
  return <OnboardView />;
}
