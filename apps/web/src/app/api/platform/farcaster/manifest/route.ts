import { ok } from "@/lib/api/responses";
import { getFarcasterManifest } from "@/lib/platforms/farcaster";

export function GET() {
  return ok(getFarcasterManifest());
}


