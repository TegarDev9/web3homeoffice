import { createHmac } from "node:crypto";

import { AppError } from "@/lib/api/errors";

export type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export function verifyTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new AppError("Telegram init data missing hash", 400, "TELEGRAM_HASH_MISSING");
  }

  params.delete("hash");
  const pairs = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort();

  const dataCheckString = pairs.join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (calculated !== hash) {
    throw new AppError("Telegram init data hash mismatch", 401, "TELEGRAM_HASH_INVALID");
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    throw new AppError("Telegram init data missing user payload", 400, "TELEGRAM_USER_MISSING");
  }

  let user: TelegramUser;

  try {
    user = JSON.parse(userRaw) as TelegramUser;
  } catch {
    throw new AppError("Telegram user payload is invalid JSON", 400, "TELEGRAM_USER_INVALID");
  }

  return {
    user,
    authDate: params.get("auth_date")
  };
}


