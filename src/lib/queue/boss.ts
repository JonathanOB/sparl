/**
 * pg-boss job queue (§2.8). Durable queue on the Supabase Postgres — transactional
 * enqueue, retries/backoff, DLQ, no extra infra. Server-only. The web app enqueues;
 * the worker process (src/worker) consumes. Both share this queue via the DB.
 */
import "server-only";
import { PgBoss } from "pg-boss";
import { serverEnv } from "@/lib/env";

export const QUEUES = {
  documentProcess: "document.process",
  renewalScan: "renewal.scan",
} as const;

export interface DocumentProcessJob {
  documentId: string;
  householdId: string;
  storagePath: string;
}

let bossPromise: Promise<PgBoss> | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (!bossPromise) {
    bossPromise = (async () => {
      const boss = new PgBoss({ connectionString: serverEnv().SUPABASE_DB_URL, schema: "pgboss" });
      boss.on("error", (err: unknown) =>
        console.error(JSON.stringify({ level: "error", msg: "pgboss.error", err: String(err) }))
      );
      await boss.start();
      await boss.createQueue(QUEUES.documentProcess);
      await boss.createQueue(QUEUES.renewalScan);
      return boss;
    })();
  }
  return bossPromise;
}

export async function enqueueDocumentProcess(job: DocumentProcessJob): Promise<void> {
  const boss = await getBoss();
  await boss.send(QUEUES.documentProcess, job, {
    retryLimit: 3,
    retryBackoff: true,
    // idempotency: one active job per document (§2.8 singleton key)
    singletonKey: job.documentId,
  });
}
