// Apply pending SQL migrations from supabase/migrations in order.
// Idempotent: records applied versions in supabase_migrations.schema_migrations
// (Supabase-CLI-compatible table) and skips ones already applied.
// Usage: npm run db:migrate
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connect } from "./_db-connect.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, "..", "supabase", "migrations");

const client = await connect();
try {
  await client.query(`create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key, name text, inserted_at timestamptz default now());`);

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const version = file.split("_")[0];
    const name = file.replace(/^\d+_/, "").replace(/\.sql$/, "");
    const applied = await client.query(
      "select 1 from supabase_migrations.schema_migrations where version=$1",
      [version]
    );
    if (applied.rowCount) {
      console.log(`SKIP    ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await client.query(sql);
    await client.query(
      "insert into supabase_migrations.schema_migrations(version,name) values($1,$2)",
      [version, name]
    );
    console.log(`APPLIED ${file}`);
  }
  console.log("migrations up to date");
} finally {
  await client.end();
}
