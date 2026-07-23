/**
 * Zod-based request parsing (D13 §14, §1 Global Conventions).
 * Client input is never trusted — every boundary parses through a schema here,
 * and a failure throws AppError(VALIDATION_FAILED) which `handle` serialises.
 */
import { z } from "zod";
import { AppError, ErrorCode } from "./errors";

type ZodIssueSummary = { path: string; message: string };

function summariseIssues(error: z.ZodError): ZodIssueSummary[] {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

/** Parse and validate a JSON request body. Throws AppError on malformed/invalid input. */
export async function parseJson<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError(ErrorCode.VALIDATION_FAILED, "Request body must be valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new AppError(
      ErrorCode.VALIDATION_FAILED,
      "Request body failed validation.",
      summariseIssues(result.error)
    );
  }
  return result.data;
}

/** Validate a route param is a UUID. Throws AppError(VALIDATION_FAILED) otherwise. */
export function requireUuidParam(value: string, name = "id"): string {
  const result = z.string().uuid().safeParse(value);
  if (!result.success) {
    throw new AppError(ErrorCode.VALIDATION_FAILED, `Invalid ${name}.`);
  }
  return result.data;
}

/** Parse and validate URL search params. Throws AppError on invalid input. */
export function parseQuery<T>(req: Request, schema: z.ZodType<T>): T {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new AppError(
      ErrorCode.VALIDATION_FAILED,
      "Query parameters failed validation.",
      summariseIssues(result.error)
    );
  }
  return result.data;
}
