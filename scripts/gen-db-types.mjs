// Generate src/shared/types/database.types.ts by introspecting the live schema.
// Docker-free alternative to `supabase gen types` (which needs a container runtime).
// Output shape is Supabase-compatible: Database["public"]["Tables"|"Enums"].
// Regenerate after every migration: npm run db:types
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connect } from "./_db-connect.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(here, "..", "src", "shared", "types", "database.types.ts");

const client = await connect();
try {
  const enumsRes = await client.query(`select t.typname, e.enumlabel from pg_type t
    join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' order by t.typname, e.enumsortorder`);
  const enums = {};
  for (const r of enumsRes.rows) (enums[r.typname] ??= []).push(r.enumlabel);

  const colsRes = await client.query(`select c.table_name, c.column_name, c.udt_name, c.is_nullable, c.column_default
    from information_schema.columns c
    join information_schema.tables t on t.table_name=c.table_name and t.table_schema=c.table_schema
    where c.table_schema='public' and t.table_type='BASE TABLE'
    order by c.table_name, c.ordinal_position`);
  const tables = {};
  for (const r of colsRes.rows) (tables[r.table_name] ??= []).push(r);

  // Callable functions (RPC). Exclude trigger functions.
  const typeMapRes = await client.query(`select oid::text as oid, typname from pg_type`);
  const typeByOid = {};
  for (const r of typeMapRes.rows) typeByOid[r.oid] = r.typname;

  const fnRes = await client.query(`select p.proname, p.proargnames,
      p.proargtypes::text as argtypes, p.pronargdefaults as ndefaults,
      rt.typname as ret_udt, p.proretset as retset
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_type rt on rt.oid = p.prorettype
    where n.nspname = 'public' and p.prokind = 'f' and rt.typname <> 'trigger'
    order by p.proname`);
  const functions = {};
  for (const r of fnRes.rows) {
    const argOids = (r.argtypes || "").trim() ? r.argtypes.trim().split(/\s+/) : [];
    const argNames = r.proargnames || [];
    const nRequired = argOids.length - (r.ndefaults || 0);
    functions[r.proname] = {
      args: argOids.map((oid, i) => ({
        name: argNames[i] || `arg${i + 1}`,
        udt: typeByOid[oid] || "unknown",
        optional: i >= nRequired,
      })),
      retUdt: r.ret_udt,
      retset: r.retset,
    };
  }

  const tsType = (udt) => {
    if (enums[udt]) return `Database["public"]["Enums"]["${udt}"]`;
    if (["uuid","varchar","bpchar","text","char","date","timestamp","timestamptz","time","timetz"].includes(udt)) return "string";
    if (udt === "bool") return "boolean";
    if (["int2","int4","int8","numeric","float4","float8"].includes(udt)) return "number";
    if (["json","jsonb"].includes(udt)) return "Json";
    return "unknown";
  };

  let out = `// AUTO-GENERATED from the live Supabase schema (introspection). Do not edit by hand.
// Regenerate after a migration: npm run db:types
// Shape is Supabase-compatible (Database["public"]["Tables"|"Enums"]).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
`;
  for (const [tbl, cols] of Object.entries(tables).sort()) {
    out += `      ${tbl}: {\n        Row: {\n`;
    for (const col of cols) {
      const nn = col.is_nullable === "YES" ? " | null" : "";
      out += `          ${col.column_name}: ${tsType(col.udt_name)}${nn};\n`;
    }
    out += `        };\n        Insert: {\n`;
    for (const col of cols) {
      const nullable = col.is_nullable === "YES";
      const optional = nullable || col.column_default !== null;
      out += `          ${col.column_name}${optional ? "?" : ""}: ${tsType(col.udt_name)}${nullable ? " | null" : ""};\n`;
    }
    out += `        };\n        Update: {\n`;
    for (const col of cols) {
      const nn = col.is_nullable === "YES" ? " | null" : "";
      out += `          ${col.column_name}?: ${tsType(col.udt_name)}${nn};\n`;
    }
    out += `        };\n        Relationships: [];\n      };\n`;
  }
  let fnsOut = "";
  for (const [name, f] of Object.entries(functions).sort()) {
    const argsType = f.args.length
      ? `{ ${f.args
          .map((a) => `${a.name}${a.optional ? "?" : ""}: ${tsType(a.udt)}${a.optional ? " | null" : ""}`)
          .join("; ")} }`
      : "Record<never, never>";
    const ret = f.retUdt === "void" ? "undefined" : `${tsType(f.retUdt)}${f.retset ? "[]" : ""}`;
    fnsOut += `      ${name}: { Args: ${argsType}; Returns: ${ret} };\n`;
  }
  out += `    };\n    Views: Record<never, never>;\n    Functions: {\n${fnsOut}    };\n    Enums: {\n`;
  for (const [name, labels] of Object.entries(enums).sort()) {
    out += `      ${name}: ${labels.map((l) => `"${l}"`).join(" | ")};\n`;
  }
  out += `    };\n    CompositeTypes: Record<never, never>;\n  };\n};\n\n`;
  out += `// Convenience helpers
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
`;
  fs.writeFileSync(outPath, out);
  console.log(`wrote ${Object.keys(tables).length} tables, ${Object.keys(enums).length} enums -> ${path.relative(process.cwd(), outPath)}`);
} finally {
  await client.end();
}
