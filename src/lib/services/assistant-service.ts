/**
 * AI Assistant service (D5 §11, D19 §16–18, Phase 8). Builds a grounded context
 * from the user's OWN data (services + recommendations, via RLS), persists
 * conversations/messages, and enforces the free-tier monthly limit. The route
 * streams the Claude reply.
 */
import "server-only";
import { createUserClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError, ErrorCode } from "@/lib/api/errors";
import type { UserContext } from "@/lib/auth/user-context";
import type { Enums } from "@/shared/types/database.types";

const FREE_MONTHLY_LIMIT = 20;

export interface ChatMessage {
  role: Enums<"message_role">;
  content: string;
}

/** Compact, human-readable summary of the user's data for grounding (own data only). */
export async function buildDataContext(): Promise<string> {
  const supabase = await createUserClient();
  const [servicesRes, recsRes, catsRes, provsRes] = await Promise.all([
    supabase
      .from("user_services")
      .select("category_id, provider_id, monthly_cost, status, renewal_date")
      .is("deleted_at", null),
    supabase
      .from("recommendations")
      .select("category_id, recommended_provider_id, estimated_saving, summary, status")
      .is("deleted_at", null),
    supabase.from("provider_categories").select("id, name"),
    supabase.from("providers").select("id, name"),
  ]);

  const catName = (id: string | null) =>
    (id && catsRes.data?.find((c) => c.id === id)?.name) || "service";
  const provName = (id: string | null) =>
    (id && provsRes.data?.find((p) => p.id === id)?.name) || "an unknown provider";

  const services = servicesRes.data ?? [];
  const recs = recsRes.data ?? [];

  const lines: string[] = ["HOUSEHOLD SERVICES:"];
  if (services.length === 0) lines.push("- (none added yet)");
  for (const s of services) {
    lines.push(
      `- ${catName(s.category_id)} with ${provName(s.provider_id)}: €${s.monthly_cost ?? "?"}/month` +
        `${s.renewal_date ? `, renews ${s.renewal_date}` : ""} (${s.status})`
    );
  }

  lines.push("", "RECOMMENDATIONS:");
  if (recs.length === 0) lines.push("- (none yet — run 'Find savings')");
  for (const r of recs) {
    lines.push(
      `- ${catName(r.category_id)}: switch to ${provName(r.recommended_provider_id)}, ` +
        `est. €${r.estimated_saving ?? 0}/yr saving (${r.status})`
    );
  }

  const openSaving = recs
    .filter((r) => r.status === "new" || r.status === "viewed")
    .reduce((total, r) => total + Number(r.estimated_saving ?? 0), 0);
  lines.push("", `TOTAL POTENTIAL SAVINGS (open recommendations): €${openSaving.toFixed(0)}/yr`);

  return lines.join("\n");
}

export async function checkAssistantQuota(ctx: UserContext): Promise<void> {
  if (ctx.subscriptionPlan !== "free") return;
  const admin = createAdminClient();

  const { data: convs } = await admin.from("conversations").select("id").eq("user_id", ctx.userId);
  const ids = (convs ?? []).map((c) => c.id);
  if (ids.length === 0) return;

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", ids)
    .eq("role", "user")
    .gte("created_at", since.toISOString());

  if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
    throw new AppError(
      ErrorCode.RATE_LIMITED,
      "You've used your 20 free assistant questions this month. Upgrade to Premium for unlimited."
    );
  }
}

export async function ensureConversation(ctx: UserContext, conversationId?: string): Promise<string> {
  const admin = createAdminClient();
  if (conversationId) {
    const { data } = await admin
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", ctx.userId)
      .is("deleted_at", null)
      .maybeSingle();
    if (data) return data.id;
  }
  const { data, error } = await admin
    .from("conversations")
    .insert({ user_id: ctx.userId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function addMessage(
  conversationId: string,
  role: Enums<"message_role">,
  content: string
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("messages").insert({ conversation_id: conversationId, role, content });
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((m) => m.content)
    .map((m) => ({ role: m.role, content: m.content as string }));
}
