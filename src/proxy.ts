import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk 7 guidance: do NOT gate routes here with createRouteMatcher/auth.protect()
 * (deprecated — middleware path-matching can diverge from Next.js routing and leave
 * resources reachable). This middleware only enables Clerk auth context. Protection
 * is resource-based:
 *   - API routes: the `authed()` wrapper (@/lib/api/authed) → 401 envelope if no user.
 *   - Pages/layouts: check auth() where protected data is read (dashboard, Phase 3).
 * Public routes (sign-in/up, /api/webhooks, /api/v1/health) simply aren't wrapped.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
