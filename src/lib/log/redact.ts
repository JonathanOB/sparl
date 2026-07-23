/**
 * PII redaction (D10 §18–20, D13 §20, §2.7).
 * Sparl must never log PII/tokens/financial detail. Everything that reaches the
 * logger is passed through `redact` first: sensitive keys are masked by name, and
 * free-text values are scrubbed for common PII patterns (emails, cards, IBANs...).
 *
 * This is defence-in-depth, not an excuse to log sensitive data — prefer not
 * putting it in the log payload at all.
 */

const REDACTED = "[REDACTED]";

/** Object keys whose values are always masked, regardless of content. */
const SENSITIVE_KEYS = new Set(
  [
    "password",
    "pass",
    "token",
    "accesstoken",
    "refreshtoken",
    "idtoken",
    "secret",
    "apikey",
    "authorization",
    "auth",
    "cookie",
    "setcookie",
    "sessionid",
    "clientsecret",
    "servicerole",
    "accountnumber",
    "iban",
    "bic",
    "sortcode",
    "cardnumber",
    "card",
    "cvv",
    "cvc",
    "ssn",
    "pps",
    "ppsn",
    "eircode",
    "postalcode",
    "postcode",
    "dob",
    "dateofbirth",
    "phone",
    "phonenumber",
    "email",
  ].map((k) => k.toLowerCase())
);

const normaliseKey = (key: string): string => key.replace(/[_\-\s]/g, "").toLowerCase();

const PATTERNS: ReadonlyArray<RegExp> = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // email
  /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, // IBAN
  /\b(?:\d[ -]?){13,19}\b/g, // card / long account numbers
  /\b\+?\d[\d ().-]{7,}\d\b/g, // phone numbers
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\b/g, // JWT
];

function redactString(value: string): string {
  let out = value;
  for (const re of PATTERNS) out = out.replace(re, REDACTED);
  return out;
}

/**
 * Return a deep, structurally-cloned copy of `value` with PII removed.
 * Sensitive-named keys are masked wholesale; strings are pattern-scrubbed.
 * Handles nested objects/arrays and guards against circular references.
 */
export function redact(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (typeof value === "string") return redactString(value);
  if (value === null || typeof value !== "object") return value;

  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => redact(item, seen));

  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEYS.has(normaliseKey(key)) ? REDACTED : redact(val, seen);
  }
  return result;
}

/** Convenience: redact a single string value. */
export const redactText = redactString;
