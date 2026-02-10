import { AppError } from "@/lib/api/errors";
import { getServerEnv } from "@/lib/env";

const DEFAULT_TEST_BASE_URL = "https://test-api.creem.io";
const DEFAULT_LIVE_BASE_URL = "https://api.creem.io";

type HttpMethod = "GET" | "POST";

type CreemRequestOptions = {
  method?: HttpMethod;
  body?: Record<string, unknown>;
};

export type CreemCheckoutRequest = {
  priceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type CreemCheckoutResponse = {
  id: string;
  url: string;
};

export async function creemRequest<T>(path: string, options: CreemRequestOptions = {}) {
  const env = getServerEnv();
  const baseUrl = env.CREEM_MODE === "test"
    ? env.CREEM_API_BASE_TEST ?? DEFAULT_TEST_BASE_URL
    : env.CREEM_API_BASE_LIVE ?? DEFAULT_LIVE_BASE_URL;

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${env.CREEM_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(`Creem request failed: ${response.status} ${text}`, 502, "CREEM_API_ERROR");
  }

  return (await response.json()) as T;
}

export async function createCreemCheckoutSession(payload: CreemCheckoutRequest) {
  const response = await creemRequest<CreemCheckoutResponse>("/v1/checkouts", {
    method: "POST",
    body: {
      price_id: payload.priceId,
      customer_email: payload.customerEmail,
      success_url: payload.successUrl,
      cancel_url: payload.cancelUrl,
      metadata: payload.metadata ?? {}
    }
  });

  if (!response.url) {
    throw new AppError("Creem did not return a checkout URL", 502, "CREEM_NO_CHECKOUT_URL");
  }

  return response;
}

export async function getCreemPortalUrl(creemCustomerId: string) {
  try {
    const data = await creemRequest<{ url?: string }>(`/v1/customers/${creemCustomerId}/portal`, {
      method: "POST"
    });
    return data.url ?? null;
  } catch {
    return null;
  }
}


