"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

type MiniKitState = {
  enabled: boolean;
};

const MiniKitContext = createContext<MiniKitState>({ enabled: false });

export function MiniKitProvider({ children }: { children: ReactNode }) {
  const value = useMemo<MiniKitState>(() => {
    if (typeof window === "undefined") return { enabled: false };
    const hasProvider = Boolean((window as Window & { BaseMiniKit?: unknown }).BaseMiniKit);
    return { enabled: hasProvider };
  }, []);

  return <MiniKitContext.Provider value={value}>{children}</MiniKitContext.Provider>;
}

export function useMiniKit() {
  return useContext(MiniKitContext);
}


