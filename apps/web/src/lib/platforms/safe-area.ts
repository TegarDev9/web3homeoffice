export const SAFE_AREA_STYLE_VARS = {
  "--safe-top": "env(safe-area-inset-top)",
  "--safe-right": "env(safe-area-inset-right)",
  "--safe-bottom": "env(safe-area-inset-bottom)",
  "--safe-left": "env(safe-area-inset-left)"
} as const;

export function safeAreaPaddingClass() {
  return "pt-[max(1rem,var(--safe-top))] pr-[max(1rem,var(--safe-right))] pb-[max(1rem,var(--safe-bottom))] pl-[max(1rem,var(--safe-left))]";
}


