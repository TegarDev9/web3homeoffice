"use client";

import { useEffect } from "react";

import { detectPlatformContext } from "@/lib/platforms/detect";
import { MiniKitProvider } from "@/lib/platforms/minikit";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function PlatformBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const platform = detectPlatformContext(searchParams);
    const shouldUseSafeArea = platform.isTelegram || platform.isFarcaster || platform.isBaseMiniApp;

    if (shouldUseSafeArea) {
      document.documentElement.classList.add("embedded-platform");
    }

    if (!platform.isTelegram) {
      return () => {
        document.documentElement.classList.remove("embedded-platform");
      };
    }

    const initData = searchParams.get("tgWebAppData");
    if (!initData) {
      return () => {
        document.documentElement.classList.remove("embedded-platform");
      };
    }

    const initDataParams = new URLSearchParams(initData);
    const hash = initDataParams.get("hash") ?? initData.slice(0, 24);
    const storageKey = `tg-link:${hash}`;
    const supabase = createSupabaseBrowserClient();

    const tryAutoLink = async () => {
      if (window.sessionStorage.getItem(storageKey)) return;

      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const response = await fetch("/api/platform/telegram/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ initData })
      });

      if (response.ok) {
        window.sessionStorage.setItem(storageKey, new Date().toISOString());
      }
    };

    void tryAutoLink();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void tryAutoLink();
    });

    return () => {
      authListener.subscription.unsubscribe();
      document.documentElement.classList.remove("embedded-platform");
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MiniKitProvider>
      <PlatformBootstrap />
      {children}
    </MiniKitProvider>
  );
}


