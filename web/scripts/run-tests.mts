// Runs content/test-set.csv against the running app and writes a report.
//
//   node scripts/run-tests.mts                 all rows, 3 runs each
//   node scripts/run-tests.mts --runs 1        one run each (cheaper)
//   node scripts/run-tests.mts --only T01,T19  just these rows
//
// The dev server must be running (npm run dev) in another terminal.

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { partsFor } from "../lib/component-fields.ts";
import type { RewriteResponse, Usage } from "../lib/rewrite-schema.ts";

const API = "http://localhost:3000/api/rewrite";
const ROOT = path.join(import.meta.dirname, "..", "..");
const CONCURRENCY = 4;

// Claude Opus 5.5 prices in dollars per million tokens, for the cost estimate.
const PRICE = { input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20 };

type Row = {
  id: string;
  component: string;
  messageType: string;
  original: string[];
  ideal: string[];
  expectedRules: string[];
  expectedFlags: string;
  notes: string;
};

type Check = { name: string; pass: boolean; detail: string };
type RunResult = { checks: Check[]; response?: RewriteResponse; error?: string };

// --- Reading the test set ---------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

const splitParts = (cell: string) => (cell.trim() ? cell.split("|").map((p) => p.trim()) : []);
const splitList = (cell: string) =>
  cell
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function readTestSet(): Row[] {
  const [header, ...lines] = parseCsv(
    readFileSync(path.join(ROOT, "content", "test-set.csv"), "utf8"),
  );
  return lines.map((cells) => {
    const get = (column: string) => cells[header.indexOf(column)] ?? "";
    return {
      id: get("id"),
      component: get("component"),
      messageType: get("messageType"),
      original: splitParts(get("original")),
      ideal: splitParts(get("ideal_rewrite")),
      expectedRules: splitList(get("expected_rules")),
      expectedFlags: get("expected_flags").trim(),
      notes: get("notes").trim(),
    };
  });
}

// --- Checking one result ----------------------------------------------------

const normalize = (text: string) => text.trim().replace(/\s+/g, " ");
const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((item) => b.includes(item));

// Capitalization and punctuation often disappear as a side effect when another
// rule rewrites the text, and whether to cite them is genuinely unclear. So when
// another rule also changed the text, these may be cited or not. When they're
// the only expected rules, they must match exactly.
const FORMATTING_RULES = ["CAPS-01", "PUNCTUATION-01"];
const withoutFormatting = (rules: string[]) =>
  rules.filter((rule) => !FORMATTING_RULES.includes(rule));

// A rule ending in "?" in the test set (like "TONE-02?") is optional: the row
// passes whether or not Claude cites it. Use it where either answer is defensible.
function rulesMatch(cited: string[], expected: string[]) {
  const optional = expected.filter((rule) => rule.endsWith("?")).map((rule) => rule.slice(0, -1));
  const required = expected.filter((rule) => !rule.endsWith("?"));
  const citedRequiredOrExtra = cited.filter((rule) => !optional.includes(rule));
  if (withoutFormatting(required).length === 0) return sameList(citedRequiredOrExtra, required);
  return sameList(withoutFormatting(citedRequiredOrExtra), withoutFormatting(required));
}

function check(row: Row, response: RewriteResponse): Check[] {
  const checks: Check[] = [];
  const rewrites = response.rewrites;
  const firstText = rewrites[0]?.parts.map((p) => normalize(p.text)) ?? [];
  const unchanged =
    rewrites.length === 1 &&
    firstText.length === row.original.length &&
    firstText.every((text, i) => text === normalize(row.original[i]));
  const expectNoChange =
    row.ideal.length === 0 ||
    (row.expectedRules.length === 0 &&
      row.ideal.map(normalize).join("|") === row.original.map(normalize).join("|"));

  if (expectNoChange) {
    checks.push({
      name: "Unchanged",
      pass: unchanged,
      detail: unchanged ? "left as is" : "rewrote text that should stay the same",
    });
  } else {
    const cited = rewrites.map((r) => r.rulesApplied);
    const match = cited.some((rules) => rulesMatch(rules, row.expectedRules));
    checks.push({
      name: "Rules",
      pass: match,
      detail: match
        ? row.expectedRules.join(", ")
        : `expected ${row.expectedRules.join(", ") || "none"}; got ${cited.map((r) => r.join(", ") || "none").join(" / ")}`,
    });
  }

  if (row.expectedFlags) {
    const flagged = response.flags.length > 0;
    checks.push({
      name: "Flags",
      pass: flagged,
      detail: flagged ? `${response.flags.length} flag(s)` : `expected a flag: ${row.expectedFlags}`,
    });
  }

  const expectedComponent = row.expectedRules.includes("TOASTS-02") ? "Alert" : null;
  const suggested = response.suggestedComponent;
  checks.push({
    name: "Component",
    pass: suggested === expectedComponent,
    detail: `expected ${expectedComponent ?? "no change"}; got ${suggested ?? "no change"}`,
  });

  return checks;
}

// --- Running ----------------------------------------------------------------

async function runOne(row: Row): Promise<RunResult> {
  const definitions = partsFor(row.component);
  const parts = row.original.map((text, i) => ({
    name: definitions[i]?.name ?? `Part ${i + 1}`,
    component: definitions[i]?.ruleName ?? row.component,
    text,
  }));
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ component: row.component, messageType: row.messageType || undefined, parts }),
    });
    const body = await res.json();
    if (!res.ok || "error" in body) return { checks: [], error: body.error ?? `HTTP ${res.status}` };
    return { checks: check(row, body), response: body };
  } catch (error) {
    return { checks: [], error: `Couldn't reach ${API}. Is the dev server running? (${error})` };
  }
}

async function pool<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

// --- Report -----------------------------------------------------------------

const cost = (u: Usage) =>
  (u.input * PRICE.input +
    u.cacheWrite * PRICE.cacheWrite +
    u.cacheRead * PRICE.cacheRead +
    u.output * PRICE.output) /
  1_000_000;

const passed = (run: RunResult) => !run.error && run.checks.every((c) => c.pass);
const shown = (parts: string[]) => (parts.length ? parts.join(" | ") : "(no rewrite)");

function report(rows: Row[], results: RunResult[][], runs: number): string {
  const allRuns = results.flat();
  const total = allRuns.reduce(
    (sum, run) => sum + (run.response?.usage ? cost(run.response.usage) : 0),
    0,
  );
  const stable = results.filter((runsForRow) => runsForRow.every(passed)).length;
  const failing = results.filter((runsForRow) => !runsForRow.some(passed)).length;
  const flaky = rows.length - stable - failing;

  const lines = [
    `# Test run ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
    "",
    `${rows.length} rows × ${runs} run(s) = ${allRuns.length} requests · estimated cost $${total.toFixed(2)}`,
    "",
    `- **Pass every run:** ${stable}`,
    `- **Pass some runs (inconsistent):** ${flaky}`,
    `- **Fail every run:** ${failing}`,
    "",
    "| Row | Component | Result | Failed checks |",
    "|---|---|---|---|",
  ];
  rows.forEach((row, i) => {
    const count = results[i].filter(passed).length;
    const failed = [
      ...new Set(results[i].flatMap((run) => (run.error ? ["Error"] : run.checks.filter((c) => !c.pass).map((c) => c.name)))),
    ];
    const mark = count === runs ? "✓" : count === 0 ? "✗" : "~";
    lines.push(`| ${row.id} | ${row.component} | ${mark} ${count}/${runs} | ${failed.join(", ")} |`);
  });

  lines.push("", "## Details");
  rows.forEach((row, i) => {
    lines.push(
      "",
      `### ${row.id} · ${row.component}${row.messageType ? ` · ${row.messageType}` : ""}`,
      "",
      `- **Original:** ${shown(row.original)}`,
      `- **Your ideal:** ${shown(row.ideal)}`,
    );
    if (row.notes) lines.push(`- **Notes:** ${row.notes}`);
    results[i].forEach((run, n) => {
      lines.push("", `**Run ${n + 1}:** ${passed(run) ? "✓ pass" : "✗ fail"}`);
      if (run.error) {
        lines.push(`- Error: ${run.error}`);
        return;
      }
      run.response!.rewrites.forEach((rewrite, r) => {
        lines.push(
          `- Claude${run.response!.rewrites.length > 1 ? ` (option ${r + 1})` : ""}: ${shown(rewrite.parts.map((p) => p.text))} — ${rewrite.rulesApplied.join(", ") || "no rules"}`,
        );
      });
      run.response!.flags.forEach((flag) => lines.push(`- Flag: ${flag}`));
      run.checks.filter((c) => !c.pass).forEach((c) => lines.push(`- ✗ ${c.name}: ${c.detail}`));
    });
  });
  return lines.join("\n") + "\n";
}

// --- Main -------------------------------------------------------------------

const args = process.argv.slice(2);
const option = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const runs = Number(option("--runs") ?? 3);
const only = option("--only")?.split(",").map((id) => id.trim());

const rows = readTestSet().filter((row) => !only || only.includes(row.id));
const jobs = rows.flatMap((row, rowIndex) =>
  Array.from({ length: runs }, () => ({ row, rowIndex })),
);
console.log(`Running ${rows.length} rows × ${runs} = ${jobs.length} requests…`);

// One request first, so the prompt is cached before the parallel requests start.
let done = 0;
const execute = async ({ row }: (typeof jobs)[number]) => {
  const result = await runOne(row);
  done++;
  process.stdout.write(`\r${done}/${jobs.length}`);
  return result;
};
const first = jobs.length ? [await execute(jobs[0])] : [];
const rest = await pool(jobs.slice(1), CONCURRENCY, execute);
const flat = [...first, ...rest];

const results: RunResult[][] = rows.map(() => []);
jobs.forEach((job, i) => results[job.rowIndex].push(flat[i]));

const outDir = path.join(ROOT, "notes", "results");
mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `test-run-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-")}.md`);
const text = report(rows, results, runs);
writeFileSync(file, text);

console.log(`\n\n${text.split("## Details")[0].trim()}\n\nFull report: ${path.relative(process.cwd(), file)}`);
