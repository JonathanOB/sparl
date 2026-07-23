#!/usr/bin/env node
// Sparl PostToolUse hook (Write|Edit). Enforces §9 of project/22.McpSkills.md:
//  - blocks the `any` type (D6 no-any rule)
//  - reminds to add RLS policy + regenerate types when a migration is touched
//  - runs eslint on the edited file (advisory)
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let file = "";
  try {
    const j = JSON.parse(raw || "{}");
    file = j?.tool_input?.file_path || j?.tool_response?.filePath || "";
  } catch {
    process.exit(0);
  }
  if (!file) process.exit(0);
  const p = file.replace(/\\/g, "/");

  // 1. Migration touched -> remind (migrations are .sql, so check before the ts/tsx gate)
  if (/migrations\/.*\.sql$/i.test(p)) {
    emitContext(
      "Migration touched (" +
        file +
        "). Before finishing: add/verify a household-scoped RLS policy (rls-policy skill) and regenerate shared Supabase types (db-migration skill)."
    );
    process.exit(0);
  }

  if (!/\.(ts|tsx)$/i.test(p)) process.exit(0);
  if (!existsSync(file)) process.exit(0);

  // 2. Block on `any`
  const src = readFileSync(file, "utf8");
  const hits = [];
  src.split(/\r?\n/).forEach((line, i) => {
    if (/(:\s*any\b)|(\bas\s+any\b)|(<any>)|(\bany\[\])|(Array<any>)/.test(line)) {
      hits.push(`  ${i + 1}: ${line.trim()}`);
    }
  });
  if (hits.length) {
    block(
      "Sparl forbids the `any` type (sparl-conventions / D6 §2.1). Replace it with a precise type, a generic, or `unknown` + narrowing in " +
        file +
        ":\n" +
        hits.slice(0, 8).join("\n")
    );
    process.exit(0);
  }

  // 3. Advisory eslint on the single edited file
  try {
    execSync(`npx --no-install eslint "${file}"`, {
      cwd: process.cwd(),
      stdio: "pipe",
      timeout: 60000,
    });
  } catch (e) {
    const out = ((e.stdout || "") + (e.stderr || "")).toString().trim();
    if (out) emitContext("ESLint findings in " + file + ":\n" + out.slice(0, 1500));
  }
  process.exit(0);
});

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}
function emitContext(additionalContext) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext },
    })
  );
}
