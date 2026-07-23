#!/usr/bin/env node
// Sparl PreToolUse hook for `git commit`. Enforces §9 of project/22.McpSkills.md:
//  - secret scan over the staged diff (BLOCKS on a hit — D10 §18)
//  - tsc --noEmit typecheck (BLOCKS on failure)
//  - unit tests, if a test script exists (advisory)
import { execSync } from "node:child_process";

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  // 1. Secret scan over staged changes
  let diff = "";
  try {
    diff = execSync("git diff --cached --unified=0", {
      cwd: process.cwd(),
      stdio: "pipe",
      timeout: 30000,
    }).toString();
  } catch {
    /* no staged diff / not a repo — skip scan */
  }
  const secretPatterns = [
    [/sk_live_[A-Za-z0-9]+/, "Stripe live secret key"],
    [/sk_test_[A-Za-z0-9]{10,}/, "Stripe secret key"],
    [/service_role/i, "Supabase service_role reference"],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
    [/AKIA[0-9A-Z]{16}/, "AWS access key id"],
    [/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./, "JWT / bearer token"],
    [/(api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]{8,}['"]/i, "hard-coded credential"],
  ];
  const findings = [];
  for (const line of diff.split(/\r?\n/)) {
    if (!line.startsWith("+")) continue; // only added lines
    for (const [re, label] of secretPatterns) {
      if (re.test(line)) findings.push(`  ${label}: ${line.slice(1).trim().slice(0, 120)}`);
    }
  }
  if (findings.length) {
    return deny(
      "Possible secret(s) in the staged diff — commit blocked (D10 §18). Move to env/secret manager:\n" +
        findings.slice(0, 8).join("\n")
    );
  }

  // 2. tsc --noEmit (blocking)
  try {
    execSync("npx --no-install tsc --noEmit", {
      cwd: process.cwd(),
      stdio: "pipe",
      timeout: 180000,
    });
  } catch (e) {
    const out = ((e.stdout || "") + (e.stderr || "")).toString().trim();
    return deny("Type check failed (tsc --noEmit) — fix before committing:\n" + out.slice(0, 2000));
  }

  // 3. Unit tests, only if a test script is defined (advisory)
  try {
    const pkg = JSON.parse(execSync("cat package.json", { cwd: process.cwd() }).toString());
    if (pkg?.scripts?.test && !/no test specified/i.test(pkg.scripts.test)) {
      execSync("npm test --silent", { cwd: process.cwd(), stdio: "pipe", timeout: 300000 });
    }
  } catch (e) {
    const out = ((e.stdout || "") + (e.stderr || "")).toString().trim();
    context("Tests reported issues (not blocking commit):\n" + out.slice(0, 1500));
  }
  process.exit(0);
});

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}
function context(additionalContext) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext },
    })
  );
}
