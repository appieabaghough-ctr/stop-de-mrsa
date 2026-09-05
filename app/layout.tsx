import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stop de MRSA | Educatieve game",
  description: "Een educatieve browsergame over het voorkomen van MRSA-verspreiding.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
