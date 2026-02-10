import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Web3 Home Office",
  description: "Static landing on Cloudflare Pages with Worker-backed app routes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
