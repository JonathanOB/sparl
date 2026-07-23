/**
 * User context resolution (§2.2 middleware). The identity bootstrap primitive
 * every authenticated endpoint uses: resolves the Clerk session into Sparl's
 * `{ userId, household(s), role, subscriptionPlan, permissions }`.
 *
 * Uses the admin client and is self-scoped by clerk_user_id, so it works
 * regardless of RLS/Third-Party-Auth state. It also self-heals: if the Clerk
 * user hasn't been synced yet (webhook delayed/unconfigured), it provisions the
 * `users` row on the fly. Business-data services use the RLS-scoped user client
 * instead (see createUserClient).
 */
import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { upsertUser } from "@/lib/auth/users";
import type { Enums, Tables } from "@/shared/types/database.types";

export interface HouseholdMembership {
  householdId: string;
  role: Enums<"household_role">;
}

export interface UserPermissions {
  manageHousehold: boolean;
  manageServices: boolean;
  manageBilling: boolean;
}

export interface UserContext {
  userId: string; // internal users.id (NOT the Clerk id)
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  memberships: HouseholdMembership[];
  activeHouseholdId: string | null;
  activeRole: Enums<"household_role"> | null;
  subscriptionPlan: Enums<"subscription_plan">;
  permissions: UserPermissions;
}

const ROLE_RANK: Record<Enums<"household_role">, number> = {
  owner: 0,
  admin: 1,
  member: 2,
  viewer: 3,
};

function permissionsFor(role: Enums<"household_role"> | null): UserPermissions {
  const isManager = role === "owner" || role === "admin";
  return {
    manageHousehold: isManager,
    manageServices: isManager || role === "member",
    manageBilling: role === "owner",
  };
}

/**
 * Resolve the current request's user context, or null if unauthenticated.
 * Belt-and-braces: endpoints should still treat null as 401 (see `authed`).
 */
export async function getUserContext(): Promise<UserContext | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const admin = createAdminClient();

  let user = await findUser(admin, clerkUserId);
  if (!user) {
    const cu = await currentUser();
    if (!cu) return null;
    const email =
      cu.primaryEmailAddress?.emailAddress ?? cu.emailAddresses[0]?.emailAddress ?? "";
    user = await upsertUser(admin, {
      clerkUserId,
      email,
      firstName: cu.firstName ?? null,
      lastName: cu.lastName ?? null,
    });
  }

  const { data: memberRows, error: memberErr } = await admin
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .is("deleted_at", null);
  if (memberErr) throw new Error(memberErr.message);

  const memberships: HouseholdMembership[] = (memberRows ?? [])
    .map((m) => ({ householdId: m.household_id, role: m.role }))
    .sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role]);
  const active = memberships[0] ?? null;

  const { data: sub, error: subErr } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subErr) throw new Error(subErr.message);

  return {
    userId: user.id,
    clerkUserId,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    memberships,
    activeHouseholdId: active?.householdId ?? null,
    activeRole: active?.role ?? null,
    subscriptionPlan: sub?.plan ?? "free",
    permissions: permissionsFor(active?.role ?? null),
  };
}

async function findUser(
  admin: ReturnType<typeof createAdminClient>,
  clerkUserId: string
): Promise<Tables<"users"> | null> {
  const { data, error } = await admin
    .from("users")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
