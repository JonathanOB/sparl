/**
 * Audit trail for sensitive actions (D10 §20–21, D13 §6).
 * Sensitive actions (auth changes, data export/delete, subscription changes,
 * document access, admin actions) must write an immutable audit entry.
 *
 * NOTE: durable persistence to the `audit_logs` table is wired once the canonical
 * schema (migration 001) exists. Until then this records via the structured logger
 * so the call sites can be built and the payload shape is fixed now.
 */
import { Logger } from "./logger";
import { redact } from "./redact";

export interface AuditEvent {
  /** Machine action code, e.g. "subscription.cancelled", "document.deleted". */
  action: string;
  /** Clerk user id of the actor. */
  actorUserId: string;
  householdId?: string;
  /** Entity acted upon, e.g. "document" / uuid. */
  targetType?: string;
  targetId?: string;
  /** Non-PII context only. */
  metadata?: Record<string, unknown>;
}

/**
 * Record a sensitive action. Best-effort: an audit failure must never break the
 * user-facing request, but is logged at error level.
 */
export async function writeAuditLog(logger: Logger, event: AuditEvent): Promise<void> {
  const entry = {
    action: event.action,
    actorUserId: event.actorUserId,
    householdId: event.householdId,
    targetType: event.targetType,
    targetId: event.targetId,
    metadata: event.metadata ? redact(event.metadata) : undefined,
    at: new Date().toISOString(),
  };

  try {
    // TODO(schema): INSERT into audit_logs via a trusted server-side Supabase client
    // once migration 001 lands. Table is append-only; never expose via public API.
    logger.info("audit", { audit: entry });
  } catch (err) {
    logger.error("audit.write_failed", { err, action: event.action });
  }
}
