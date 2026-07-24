/**
 * Recommendation engine (D5 §8–9, D9 §19–20, Phase 7). Deterministic scoring from
 * verified data: compare each household service against the cheapest provider offer
 * in the same category and, where there's a real saving, create a recommendation +
 * explanation. AI explanation is a later enhancement — scoring is never AI-alone.
 */
import "server-only";
import { z } from "zod";
import { createUserClient } from "@/lib/supabase/server";
import { AppError, ErrorCode } from "@/lib/api/errors";
import { generateRecommendationsFor } from "@/lib/services/recommendation-engine";
import { createNotification } from "@/lib/services/notification-create";
import type { UserContext } from "@/lib/auth/user-context";
import type { Tables } from "@/shared/types/database.types";

/** API entry point: generate for the caller's active household + notify on success. */
export async function generateRecommendations(
  ctx: UserContext
): Promise<{ created: number; totalSaving: number }> {
  if (!ctx.activeHouseholdId) {
    throw new AppError(ErrorCode.VALIDATION_FAILED, "Create a household first.");
  }
  const supabase = await createUserClient();
  const result = await generateRecommendationsFor(supabase, ctx.activeHouseholdId);
  if (result.created > 0) {
    await createNotification(
      ctx.userId,
      "saving_found",
      "New savings found",
      `We found ${result.created} way${result.created === 1 ? "" : "s"} to save about €${result.totalSaving.toFixed(0)}/yr.`
    );
  }
  return result;
}

export async function listRecommendations(): Promise<Tables<"recommendations">[]> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("recommendations")
    .select("*")
    .is("deleted_at", null)
    .order("estimated_saving", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function acceptRecommendation(id: string): Promise<Tables<"recommendations">> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("recommendations")
    .update({ status: "accepted" })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "Recommendation not found.");
  // TODO(Phase 10): record an affiliate click on accept (D4 §22, D11 §10).
  return data;
}

export const rejectSchema = z
  .object({
    reason: z.enum(["too_hard", "not_interested", "wrong_time", "incorrect"]).optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

export type RejectInput = z.infer<typeof rejectSchema>;

export async function rejectRecommendation(
  ctx: UserContext,
  id: string,
  input: RejectInput
): Promise<Tables<"recommendations">> {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("recommendations")
    .update({ status: "rejected" })
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError(ErrorCode.NOT_FOUND, "Recommendation not found.");

  await supabase.from("recommendation_feedback").insert({
    recommendation_id: id,
    user_id: ctx.userId,
    reason: input.reason ?? "not_interested",
    feedback: input.note ?? null,
  });
  return data;
}
