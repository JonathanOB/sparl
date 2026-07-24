// Create Sparl's Stripe products + prices (test mode). Idempotent — safe to re-run.
// Mirrors the offered tiers (§2.5): Premium €4.99/mo + €49/yr, Family €7.99/mo.
// Free (€0) has no Stripe product. Run: node scripts/setup-stripe.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const here = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const line of fs.readFileSync(path.resolve(here, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = line.indexOf("=");
  env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

async function ensureProduct(plan, name, description) {
  const found = (await stripe.products.list({ active: true, limit: 100 })).data.find(
    (p) => p.metadata?.sparl_plan === plan
  );
  if (found) return found;
  return stripe.products.create({ name, description, metadata: { sparl_plan: plan } });
}

async function ensurePrice(product, lookupKey, plan, unitAmount, interval) {
  const found = (await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })).data[0];
  if (found) return found;
  return stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: unitAmount,
    recurring: { interval },
    lookup_key: lookupKey,
    metadata: { sparl_plan: plan, interval },
  });
}

const premium = await ensureProduct("premium", "Sparl Premium", "Unlimited AI assistant, document AI, priority monitoring.");
const family = await ensureProduct("family", "Sparl Family", "Everything in Premium, for the whole household.");

const prices = [
  await ensurePrice(premium, "premium_monthly", "premium", 499, "month"),
  await ensurePrice(premium, "premium_yearly", "premium", 4900, "year"),
  await ensurePrice(family, "family_monthly", "family", 799, "month"),
];

console.log("products:", [premium, family].map((p) => `${p.metadata.sparl_plan} (${p.id})`).join(", "));
for (const pr of prices) {
  console.log(`price ${pr.lookup_key}: €${(pr.unit_amount / 100).toFixed(2)}/${pr.recurring.interval} (${pr.id})`);
}
console.log("done");
