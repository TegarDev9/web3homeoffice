import { createHash, createHmac } from "node:crypto";

import { getEnv } from "../env";

type TencentRequestInput = {
  service: string;
  endpoint: string;
  action: string;
  version: string;
  region?: string;
  payload: Record<string, unknown>;
};

function sha256Hex(input: string | Buffer) {
  return createHash("sha256").update(input).digest("hex");
}

function hmacSha256(key: Buffer | string, input: string, encoding?: "hex") {
  const digest = createHmac("sha256", key).update(input).digest();
  return encoding === "hex" ? digest.toString("hex") : digest;
}

export async function tencentJsonRequest<T>(input: TencentRequestInput): Promise<T> {
  const env = getEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const payload = JSON.stringify(input.payload);

  const canonicalHeaders =
    `content-type:application/json; charset=utf-8\n` +
    `host:${input.endpoint}\n` +
    `x-tc-action:${input.action.toLowerCase()}\n`;

  const signedHeaders = "content-type;host;x-tc-action";
  const canonicalRequest =
    `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256Hex(payload)}`;

  const credentialScope = `${date}/${input.service}/tc3_request`;
  const stringToSign =
    `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;

  const secretDate = hmacSha256(`TC3${env.TENCENT_SECRET_KEY}`, date) as Buffer;
  const secretService = hmacSha256(secretDate, input.service) as Buffer;
  const secretSigning = hmacSha256(secretService, "tc3_request") as Buffer;
  const signature = hmacSha256(secretSigning, stringToSign, "hex") as string;

  const authorization =
    `TC3-HMAC-SHA256 ` +
    `Credential=${env.TENCENT_SECRET_ID}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  const response = await fetch(`https://${input.endpoint}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      Host: input.endpoint,
      "X-TC-Action": input.action,
      "X-TC-Version": input.version,
      "X-TC-Region": input.region ?? env.TENCENT_REGION,
      "X-TC-Timestamp": String(timestamp)
    },
    body: payload
  });

  const body = (await response.json()) as Record<string, any>;
  const maybeError = body?.Response?.Error;

  if (!response.ok || maybeError) {
    const errorPayload = JSON.stringify(body);
    throw new Error(`Tencent API ${input.action} failed: ${response.status} ${errorPayload}`);
  }

  return body as T;
}


