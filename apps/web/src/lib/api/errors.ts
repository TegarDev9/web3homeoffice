export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function asAppError(error: unknown) {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message, 500, "INTERNAL_ERROR");
  }
  return new AppError("Unexpected error", 500, "INTERNAL_ERROR");
}


