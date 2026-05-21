import type { Metadata } from "next";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://chat.inc"),
  title: "chat.inc",
  description: "A tiny chat interface for concise answers.",
  icons: {
    icon: [
      {
        url: "/favicon-light-v3.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark-v3.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  openGraph: {
    title: "chat.inc",
    description: "A tiny chat interface for concise answers.",
    url: "https://chat.inc",
    siteName: "chat.inc",
    images: [
      {
        url: "/social-preview.png",
        width: 420,
        height: 232,
        alt: "chat.inc preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "chat.inc",
    description: "A tiny chat interface for concise answers.",
    images: ["/social-preview.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
