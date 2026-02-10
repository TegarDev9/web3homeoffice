import Link from "next/link";
import { Bell, BookOpen, Box, CreditCard, Home, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/app", label: "Hub", icon: Box },
  { href: "/academy", label: "Academy", icon: BookOpen },
  { href: "/dashboard", label: "Dashboard", icon: Bell },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold text-text">
          Web3 Home Office
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
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
      </div>
    </header>
  );
}


