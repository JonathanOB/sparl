// Shared DB connection for repo scripts (migrations, type gen).
// Reads credentials from web/.env.local — never hardcode secrets here.
// Uses the Supabase session pooler (supports full DDL + SET ROLE, unlike the
// transaction pooler on 6543). Docker-free path for when the Supabase CLI's
// container-based tooling isn't available.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(here, "..", ".env.local");

export function loadEnv() {
  const text = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line.slice(i + 1).split("#")[0].trim();
  }
  return env;
}

export async function connect() {
  const env = loadEnv();
  const ref = env.SUPABASE_PROJECT_REF;
  const pw = env.SUPABASE_DB_PASSWORD;
  if (!ref || !pw) throw new Error("SUPABASE_PROJECT_REF / SUPABASE_DB_PASSWORD missing from .env.local");
  const host = process.env.SUPABASE_DB_POOLER_HOST || "aws-0-eu-west-1.pooler.supabase.com";
  const client = new Client({
    host,
    port: 5432,
    user: `postgres.${ref}`,
    password: pw,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}
