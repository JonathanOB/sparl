/**
 * Sparl worker process (§2.8). Consumes pg-boss jobs. Run alongside the web app:
 *   npm run worker
 * Uses the react-server condition (see package.json) so server-only modules load.
 */
import "./load-env";
import { getBoss, QUEUES, type DocumentProcessJob } from "@/lib/queue/boss";
import { processDocument } from "./document-worker";
import { processRenewalScan } from "./renewal-worker";

async function main() {
  const boss = await getBoss();

  await boss.work<DocumentProcessJob>(QUEUES.documentProcess, async (jobs) => {
    for (const job of jobs) {
      await processDocument(job.data);
    }
  });

  await boss.work(QUEUES.renewalScan, async () => {
    await processRenewalScan();
  });
  // Daily at 02:00 — renewal → recommendation → notification cycle (D5 §19).
  await boss.schedule(QUEUES.renewalScan, "0 2 * * *");

  console.log(
    JSON.stringify({ level: "info", msg: "worker.started", queues: Object.values(QUEUES) })
  );
}

main().catch((err) => {
  console.error(JSON.stringify({ level: "error", msg: "worker.crashed", err: String(err) }));
  process.exit(1);
});
