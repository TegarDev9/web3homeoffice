export type PlatformContext = {
  isTelegram: boolean;
  isFarcaster: boolean;
  isBaseMiniApp: boolean;
  shouldDefaultLowGraphics: boolean;
};

export function detectPlatformContext(searchParams?: URLSearchParams): PlatformContext {
  const source = searchParams ?? new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const tgData = source.get("tgWebAppData");
  const farcaster = source.get("farcaster") ?? source.get("fc") ?? "";
  const base = source.get("baseMiniApp") ?? source.get("base") ?? "";

  const isTelegram = Boolean(tgData);
  const isFarcaster = farcaster === "1";
  const isBaseMiniApp = base === "1";

  return {
    isTelegram,
    isFarcaster,
    isBaseMiniApp,
    shouldDefaultLowGraphics: isTelegram || isFarcaster || isBaseMiniApp
  };
}


