import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Providers } from "@/components/layout/providers";

import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display"
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Web3 Home Office",
  description: "Cyberpunk SaaS hub for billing, provisioning, and web3 infra management."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${rajdhani.variable} bg-bg font-body text-text antialiased`}>
        <Providers>
          <MarketingHeader />
          <main className="safe-area-embedded mx-auto w-full max-w-7xl px-4 pb-8 pt-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}


