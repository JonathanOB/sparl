/**
 * Standard API response envelope (D4 §6, §2.4).
 * Success: { success: true, data }
 * Error:   { success: false, error: { code, message, details? } }
 *
 * Every /api/v1 route returns one of these — clients can rely on the shape.
 */
import { AppError, ErrorCode, httpStatusForCode } from "./errors";

export type ApiSuccess<T> = { success: true; data: T };

export type ApiFailure = {
  success: false;
  error: { code: ErrorCode; message: string; details?: unknown };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Build a 2xx success envelope. */
export function ok<T>(data: T, init?: ResponseInit): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return Response.json(body, { status: 200, ...init });
}

/** Build an error envelope from an AppError. */
export function fail(error: AppError, init?: ResponseInit): Response {
  const body: ApiFailure = {
    success: false,
    error: { code: error.code, message: error.message, details: error.details },
  };
  return Response.json(body, { status: error.status, ...init });
}

/** Build an error envelope from a raw code/message (when you don't have an AppError). */
export function failWith(
  code: ErrorCode,
  message: string,
  details?: unknown,
  init?: ResponseInit
): Response {
  const body: ApiFailure = { success: false, error: { code, message, details } };
  return Response.json(body, { status: httpStatusForCode(code), ...init });
}

/**
 * Route wrapper: runs the handler, converts a thrown AppError into its envelope,
 * and turns any unexpected error into a generic 500 (never leaking internals/PII).
 * Enforces the "routes just orchestrate" convention — services throw AppError.
 */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError) return fail(err);
    // TODO(logging): once the structured logger lands, log err here (no PII) with the request id.
    return failWith(ErrorCode.INTERNAL, "Something went wrong. Please try again.");
  }
}
