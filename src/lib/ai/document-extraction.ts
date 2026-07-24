/**
 * Document extraction agent (§2.6, D5 §6, D19 §10–13, ai-agent skill).
 * Claude multimodal reads a bill/contract → STRICT JSON → Zod-validated →
 * confidence-scored. AI is not the source of truth: the caller applies business
 * rules and redaction before anything is persisted or used.
 */
import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { anthropic } from "@/lib/ai/client";

export const extractionSchema = z.object({
  provider_name: z.string().nullable(),
  category: z.string().nullable(), // energy | broadband | mobile | insurance | subscriptions | other
  monthly_cost: z.number().nullable(),
  annual_cost: z.number().nullable(),
  renewal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  account_number: z.string().nullable(), // PII — redacted before storage
  confidence: z.number().min(0).max(1),
});

export type DocumentExtraction = z.infer<typeof extractionSchema>;

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const PROMPT = `You are extracting structured data from a household bill, contract, or renewal letter.
Return ONLY a JSON object (no prose, no code fences) with exactly these keys:
- provider_name: the company name, or null
- category: one of "energy","broadband","mobile","insurance","subscriptions","other", or null
- monthly_cost: the recurring monthly cost as a number in the document's currency, or null
- annual_cost: the annual cost as a number, or null
- renewal_date: the contract renewal/end date as "YYYY-MM-DD", or null
- account_number: the account/policy number if present, or null
- confidence: your overall confidence from 0 to 1 that these values are correct
Only include values that actually appear in the document. Use null when unsure. Do not guess.`;

function fileBlock(bytes: Uint8Array, mediaType: string): Anthropic.ContentBlockParam {
  const data = Buffer.from(bytes).toString("base64");
  if (mediaType === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data } };
  }
  const media = IMAGE_TYPES.has(mediaType)
    ? (mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif")
    : "image/png";
  return { type: "image", source: { type: "base64", media_type: media, data } };
}

function parseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in model response");
  return JSON.parse(raw.slice(start, end + 1));
}

/** Run extraction. Throws if the model output can't be parsed/validated (anti-hallucination gate). */
export async function extractDocument(
  bytes: Uint8Array,
  mediaType: string
): Promise<DocumentExtraction> {
  const response = await anthropic().messages.create({
    model: serverEnv().CLAUDE_MODEL_STRONG,
    max_tokens: 1024,
    messages: [{ role: "user", content: [fileBlock(bytes, mediaType), { type: "text", text: PROMPT }] }],
  });
  const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return extractionSchema.parse(parseJson(text));
}

/** Business-rule sanity checks (D5 §13). Implausible extractions are flagged, not trusted. */
export function isPlausible(x: DocumentExtraction): boolean {
  if (x.confidence < 0.5) return false;
  if (x.monthly_cost != null && (x.monthly_cost < 0 || x.monthly_cost > 5000)) return false;
  if (x.annual_cost != null && (x.annual_cost < 0 || x.annual_cost > 60000)) return false;
  return true;
}

/** Strip PII (account number) before persistence (§2.7 / D10 §13). */
export function redactExtraction(x: DocumentExtraction): {
  provider_name: string | null;
  category: string | null;
  monthly_cost: number | null;
  annual_cost: number | null;
  renewal_date: string | null;
  account_number: string | null;
  confidence: number;
} {
  return {
    provider_name: x.provider_name,
    category: x.category,
    monthly_cost: x.monthly_cost,
    annual_cost: x.annual_cost,
    renewal_date: x.renewal_date,
    account_number: x.account_number ? "[REDACTED]" : null,
    confidence: x.confidence,
  };
}
