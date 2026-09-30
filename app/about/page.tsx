import type { Metadata } from "next";
import { AboutView } from "../v2";

export const metadata: Metadata = {
  title: "About — chat.inc",
  description:
    "Why chat.inc is agent-first: AI agents can answer expert network and survey questions on your behalf, so you get paid without the busywork.",
};

export default function AboutPage() {
  return <AboutView />;
}
