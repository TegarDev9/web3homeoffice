import { NextResponse } from "next/server";

import { asAppError } from "@/lib/api/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(error: unknown) {
  const normalized = asAppError(error);
  return NextResponse.json(
    {
      error: {
        code: normalized.code,
        message: normalized.message
      }
    },
    { status: normalized.status }
  );
}


