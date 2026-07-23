/**
 * Canonical authenticated-route wrapper (§2.4, api-endpoint skill).
 * Every user-facing endpoint is: authed(({ ctx, req, params }) => ...).
 * It resolves user context, 401s if absent, runs the handler inside `handle`
 * (so thrown AppErrors become the standard error envelope), and forwards route
 * params — so dynamic routes need no special-casing later.
 */
import type { NextRequest } from "next/server";
import { handle } from "@/lib/api/envelope";
import { AppError, ErrorCode } from "@/lib/api/errors";
import { getUserContext, type UserContext } from "@/lib/auth/user-context";

type RouteSegment = { params: Promise<Record<string, string>> };

type AuthedHandler = (args: {
  ctx: UserContext;
  req: NextRequest;
  params: Record<string, string>;
}) => Promise<Response>;

export function authed(handler: AuthedHandler) {
  return (req: NextRequest, segment?: RouteSegment): Promise<Response> =>
    handle(async () => {
      const ctx = await getUserContext();
      if (!ctx) throw new AppError(ErrorCode.UNAUTHENTICATED, "Authentication required.");
      const params = segment ? await segment.params : {};
      return handler({ ctx, req, params });
    });
}
