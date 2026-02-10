import { createHmac, timingSafeEqual } from "node:crypto";

import { AppError } from "@/lib/api/errors";
import { getServerEnv } from "@/lib/env";

function parseSignatureValue(raw: string) {
  if (!raw) return "";
  const normalized = raw.trim();
  if (!normalized.includes("=")) return normalized;

  const pairs = normalized.split(",").map((part) => part.trim());
  const direct = pairs.find((pair) => pair.startsWith("v1="));
  if (direct) return direct.replace("v1=", "");

  const fallback = pairs[0]?.split("=")[1];
  return fallback ?? "";
}

export function verifyCreemWebhookSignature(rawBody: string, headerValue: string | null) {
  const env = getServerEnv();
  if (!headerValue) return false;

  const algorithm = env.CREEM_WEBHOOK_SIGNATURE_ALGORITHM.toLowerCase();
  const signature = parseSignatureValue(headerValue);

  if (!signature) return false;

  const expected = createHmac(algorithm, env.CREEM_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(sigBuffer, expectedBuffer);
}

export function assertCreemWebhookSignature(rawBody: string, headerValue: string | null) {
  if (!verifyCreemWebhookSignature(rawBody, headerValue)) {
    throw new AppError("Invalid webhook signature", 401, "INVALID_WEBHOOK_SIGNATURE");
  }
}


