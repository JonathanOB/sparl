/**
 * Recommendation engine core (D5 §8–9, Phase 7) — client-agnostic and Clerk-free
 * so it runs from the API (RLS user client) or the worker (admin client). Compares
 * each household service against the cheapest offer in its category; deterministic
 * scoring. No AI in the scoring path.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database.types";

const SAVINGS_THRESHOLD = 3; // €/mo — below this we don't bother recommending

interface CategoryBest {
  providerId: string;
  providerName: string;
  price: number;
}

export async function generateRecommendationsFor(
  supabase: SupabaseClient<Database>,
  householdId: string
): Promise<{ created: number; totalSaving: number }> {
  const { data: services, error: servicesError } = await supabase
    .from("user_services")
    .select("id, category_id, provider_id, monthly_cost")
    .eq("household_id", householdId)
    .is("deleted_at", null);
  if (servicesError) throw new Error(servicesError.message);

  const [providersRes, productsRes, offersRes] = await Promise.all([
    supabase.from("providers").select("id, name, category_id").is("deleted_at", null),
    supabase.from("provider_products").select("id, provider_id").is("deleted_at", null),
    supabase
      .from("provider_offers")
      .select("product_id, price")
      .eq("billing_period", "monthly")
      .is("deleted_at", null),
  ]);
  if (providersRes.error) throw new Error(providersRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);
  if (offersRes.error) throw new Error(offersRes.error.message);

  const providerByProduct = new Map((productsRes.data ?? []).map((p) => [p.id, p.provider_id]));
  const providerById = new Map((providersRes.data ?? []).map((p) => [p.id, p]));

  const bestByCategory = new Map<string, CategoryBest>();
  for (const offer of offersRes.data ?? []) {
    if (offer.price == null) continue;
    const providerId = providerByProduct.get(offer.product_id);
    const provider = providerId ? providerById.get(providerId) : undefined;
    if (!provider?.category_id) continue;
    const current = bestByCategory.get(provider.category_id);
    if (!current || offer.price < current.price) {
      bestByCategory.set(provider.category_id, {
        providerId: provider.id,
        providerName: provider.name,
        price: offer.price,
      });
    }
  }

  // Fresh run: retire prior un-actioned recommendations for this household.
  await supabase
    .from("recommendations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("household_id", householdId)
    .eq("status", "new")
    .is("deleted_at", null);

  let created = 0;
  let totalSaving = 0;
  for (const svc of services ?? []) {
    if (!svc.category_id || svc.monthly_cost == null) continue;
    const best = bestByCategory.get(svc.category_id);
    if (!best || best.providerId === svc.provider_id) continue;

    const monthlySaving = svc.monthly_cost - best.price;
    if (monthlySaving < SAVINGS_THRESHOLD) continue;

    const annualSaving = Math.round(monthlySaving * 12 * 100) / 100;
    const confidence = Math.round(Math.min(0.95, 0.6 + monthlySaving / svc.monthly_cost) * 100) / 100;
    const summary = `Switch to ${best.providerName} and save about €${annualSaving.toFixed(0)}/yr`;

    const { data: rec, error: recError } = await supabase
      .from("recommendations")
      .insert({
        household_id: householdId,
        category_id: svc.category_id,
        current_service_id: svc.id,
        recommended_provider_id: best.providerId,
        estimated_saving: annualSaving,
        confidence_score: confidence,
        summary,
        status: "new",
      })
      .select("id")
      .single();
    if (recError) throw new Error(recError.message);

    await supabase.from("recommendation_explanations").insert({
      recommendation_id: rec.id,
      summary,
      reasoning: `Your current plan costs €${svc.monthly_cost}/month. ${best.providerName} offers a comparable plan at €${best.price}/month — about €${monthlySaving.toFixed(2)}/month (€${annualSaving.toFixed(0)}/year) less. Based on current listed prices; confirm the details before switching.`,
    });
    created++;
    totalSaving += annualSaving;
  }

  return { created, totalSaving };
}
