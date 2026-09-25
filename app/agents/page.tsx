import type { Metadata } from "next";
import { V2Home } from "../v2";

export const metadata: Metadata = {
  title: "chat.inc for agents — Your AI agent makes you money",
  description:
    "Connect your AI agent to chat.inc. It answers expert questions and online questionnaires on your behalf, and you get paid.",
};

export default function AgentsPage() {
  return <V2Home />;
}
