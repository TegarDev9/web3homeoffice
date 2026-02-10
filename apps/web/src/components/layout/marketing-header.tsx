import React from "react";
import Link from "next/link";
import { BookOpen, Compass, CreditCard, Home, LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/#how", label: "How", icon: Compass },
  { href: "/#plans", label: "Plans", icon: CreditCard },
  { href: "/#faq", label: "FAQ", icon: LifeBuoy },
  { href: "/academy", label: "Academy", icon: BookOpen },
  { href: "/billing", label: "Billing", icon: CreditCard }
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold text-text">
          Web3 Home Office
        </Link>
        <nav className="hidden items-center gap-2 lg:flex">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Button key={link.href} variant="ghost" size="sm" asChild>
                <Link href={link.href} className="gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/billing">View plans</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/#auth">Start free</Link>
          </Button>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/billing">Plans</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/#auth">Start</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}


