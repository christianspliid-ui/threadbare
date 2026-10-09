/**
 * Weekly CI/CD flow metrics (2026-10-09). The measurement half of the `tb-cicd-review` lane.
 *
 * ## Why this exists
 *
 * THR-1717 moved the pickup lane from hourly to every 20 minutes (2026-10-03). Nobody
 * measured the effect until six days later, when an attended session found the change
 * had bought no throughput and tripled merge conflicts (code PRs needing a main
 * catch-up 10 % → 33 %, PRs over an hour to merge 5 % → 25 %). Every harness tweak is a
 * hypothesis about these numbers. This script computes them the same way every week,
 * so the weekly lane can judge each tweak against a baseline and not an impression.
 *
 * ## What it measures (one TSV row per window, columns in {@link TSV_COLUMNS})
 *
 * - **Throughput:** ticket PRs opened / merged, merges per day, docs-only PRs merged.
 * - **Flow time:** open → merge minutes for ticket PRs (median, p90), and the share
 *   that took longer than {@link SLOW_MERGE_MINUTES}.
 * - **Conflict pressure:** the share of ticket PRs whose branch carries a merge of
 *   `main` (a catch-up, almost always a conflict fix); the peak number of ticket PRs
 *   open at once; open and `DIRTY` PRs at measurement time.
 * - **CI:** PR-triggered `CI` run wall time (median, p90) and failure rate; `Heavy
 *   simulation tests` failure rate on `main` pushes (not a required check, so red there
 *   is silent unless counted).
 * - **Gates:** WIP-gate denials and fail-soft allows from `.claude/logs/wip-gate.log`.
 * - **Lane runs** (passed in by the lane, which reads them through the scheduled-tasks
 *   MCP; this script can't reach it): pickup runs, idle runs, median run minutes, failed runs.
 *
 * A "ticket PR" carries a line-anchored close line (`Fixes|Closes|Resolves THR-N`), the
 * autoclose predicate. Plan, retro and ops PRs are not ticket PRs: they merge in minutes
 * and are counted apart, so they don't dilute the flow numbers.
 *
 *   npm run cicd:metrics -- [--days 7] [--until 2026-10-09] [--tsv] [--header]
 *                            [--lane-runs N --lane-idle N --lane-median-min N --lane-failed N]
 *
 * Fail-soft: a `gh` call that errors leaves its columns empty and names itself in
 * `errors`. It never throws away the rest of the row.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const SLOW_MERGE_MINUTES = 60;
export const DEFAULT_WINDOW_DAYS = 7;
export const GH_LIST_LIMIT = 500;
const CLOSE_LINE = /^(?:Fixes|Closes|Resolves) THR-\d+\s*$/im;
const MAIN_MERGE = /^Merge (?:remote-tracking )?branch '?(?:origin\/)?main'?/;

export type PrRecord = {
  number: number;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  state: string;
  isDraft?: boolean;
  body: string;
  mergeStateStatus?: string;
};
export type RunRecord = { createdAt: string; updatedAt: string; conclusion: string | null; event: string; headBranch: string };
export type GateLogEntry = { at: string; verdict: string };
export type LaneRuns = { runs?: number; idle?: number; medianMin?: number; failed?: number };

export const TSV_COLUMNS = [
  "window_start", "window_end",
  "ticket_prs_opened", "ticket_prs_merged", "merges_per_day", "docs_prs_merged",
  "open_to_merge_median_min", "open_to_merge_p90_min", "pct_slow_gt60m",
  "pct_main_catchup", "peak_concurrent_ticket_prs", "open_prs_now", "dirty_prs_now",
  "ci_pr_runs", "ci_pr_median_min", "ci_pr_p90_min", "ci_pr_fail_pct", "heavy_main_fail_pct",
  "wip_gate_denials", "wip_gate_failsoft",
  "lane_runs", "lane_idle_runs", "lane_median_run_min", "lane_failed_runs",
  "errors",
] as const;
export type Metrics = Record<(typeof TSV_COLUMNS)[number], string | number | null>;

export const isTicketPr = (pr: Pick<PrRecord, "body">): boolean => CLOSE_LINE.test(pr.body ?? "");
export const isMainCatchup = (headline: string): boolean => MAIN_MERGE.test(headline);

const minutesBetween = (a: string, b: string): number => (Date.parse(b) - Date.parse(a)) / 60_000;
const round1 = (n: number): number => Math.round(n * 10) / 10;

export function quantile(values: readonly number[], q: number): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((x, y) => x - y);
  // Nearest-rank: the ceil(q·n)-th value, 1-based.
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))];
}

const pct = (part: number, whole: number): number | null => (whole === 0 ? null : round1((100 * part) / whole));

/** Peak number of intervals open at once. An open PR's interval runs to `end`. */
export function peakConcurrent(prs: readonly PrRecord[], end: Date): number {
  const events: Array<[number, number]> = [];
  for (const pr of prs) {
    const stop = pr.mergedAt ?? pr.closedAt ?? end.toISOString();
    events.push([Date.parse(pr.createdAt), 1], [Date.parse(stop), -1]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let open = 0;
  let peak = 0;
  for (const [, d] of events) {
    open += d;
    peak = Math.max(peak, open);
  }
  return peak;
}

export type MetricInputs = {
  start: Date;
  end: Date;
  prs: PrRecord[] | null; // PRs created in [start, end)
  catchupByPr: Map<number, boolean> | null;
  openNow: PrRecord[] | null;
  ciPrRuns: RunRecord[] | null;
  heavyMainRuns: RunRecord[] | null;
  gateLog: GateLogEntry[];
  lane: LaneRuns;
  errors: string[];
};

export function computeMetrics(i: MetricInputs): Metrics {
  const inWindow = (iso: string | null) => !!iso && Date.parse(iso) >= i.start.getTime() && Date.parse(iso) < i.end.getTime();
  const days = (i.end.getTime() - i.start.getTime()) / 86_400_000;
  const ticket = (i.prs ?? []).filter(isTicketPr);
  const merged = ticket.filter((p) => p.mergedAt);
  const flow = merged.map((p) => minutesBetween(p.createdAt, p.mergedAt as string));
  const docsMerged = (i.prs ?? []).filter((p) => !isTicketPr(p) && p.mergedAt).length;
  const catchups = i.catchupByPr ? ticket.filter((p) => i.catchupByPr!.get(p.number)).length : null;
  const ciDur = (i.ciPrRuns ?? []).filter((r) => r.conclusion && r.conclusion !== "cancelled" && r.conclusion !== "skipped")
    .map((r) => minutesBetween(r.createdAt, r.updatedAt));
  const ciDone = (i.ciPrRuns ?? []).filter((r) => r.conclusion === "success" || r.conclusion === "failure");
  const heavyDone = (i.heavyMainRuns ?? []).filter((r) => r.conclusion === "success" || r.conclusion === "failure");
  const gate = i.gateLog.filter((e) => inWindow(e.at));
  const q = (v: number | null) => (v === null ? null : round1(v));
  const openTicket = (i.openNow ?? []).filter(isTicketPr);

  return {
    window_start: i.start.toISOString().slice(0, 10),
    window_end: i.end.toISOString().slice(0, 10),
    ticket_prs_opened: i.prs ? ticket.length : null,
    ticket_prs_merged: i.prs ? merged.length : null,
    merges_per_day: i.prs ? round1(merged.length / days) : null,
    docs_prs_merged: i.prs ? docsMerged : null,
    open_to_merge_median_min: q(quantile(flow, 0.5)),
    open_to_merge_p90_min: q(quantile(flow, 0.9)),
    pct_slow_gt60m: i.prs ? pct(flow.filter((m) => m > SLOW_MERGE_MINUTES).length, merged.length) : null,
    pct_main_catchup: catchups === null ? null : pct(catchups, ticket.length),
    peak_concurrent_ticket_prs: i.prs ? peakConcurrent(ticket, i.end) : null,
    open_prs_now: i.openNow ? openTicket.length : null,
    dirty_prs_now: i.openNow ? openTicket.filter((p) => p.mergeStateStatus === "DIRTY").length : null,
    ci_pr_runs: i.ciPrRuns ? ciDone.length : null,
    ci_pr_median_min: q(quantile(ciDur, 0.5)),
    ci_pr_p90_min: q(quantile(ciDur, 0.9)),
    ci_pr_fail_pct: i.ciPrRuns ? pct(ciDone.filter((r) => r.conclusion === "failure").length, ciDone.length) : null,
    heavy_main_fail_pct: i.heavyMainRuns ? pct(heavyDone.filter((r) => r.conclusion === "failure").length, heavyDone.length) : null,
    wip_gate_denials: gate.filter((e) => e.verdict === "deny").length,
    wip_gate_failsoft: gate.filter((e) => e.verdict === "allow-failsoft").length,
    lane_runs: i.lane.runs ?? null,
    lane_idle_runs: i.lane.idle ?? null,
    lane_median_run_min: i.lane.medianMin ?? null,
    lane_failed_runs: i.lane.failed ?? null,
    errors: i.errors.join("; "),
  };
}

export function toTsvRow(m: Metrics): string {
  return TSV_COLUMNS.map((c) => (m[c] === null || m[c] === undefined ? "" : String(m[c]).replace(/[\t\n]/g, " "))).join("\t");
}

// ---------------------------------------------------------------- data collection

function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
}

function attempt<T>(label: string, errors: string[], fn: () => T): T | null {
  try {
    return fn();
  } catch (err) {
    errors.push(`${label}: ${(err instanceof Error ? err.message : String(err)).split("\n")[0]}`);
    return null;
  }
}

function homeTree(): string {
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return path.dirname(common);
  } catch {
    return process.cwd();
  }
}

function readGateLog(): GateLogEntry[] {
  const file = path.join(homeTree(), ".claude/logs/wip-gate.log");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).flatMap((l) => {
    try {
      return [JSON.parse(l) as GateLogEntry];
    } catch {
      return [];
    }
  });
}

function arg(name: string): string | undefined {
  const k = process.argv.indexOf(`--${name}`);
  return k >= 0 ? process.argv[k + 1] : undefined;
}
const num = (name: string): number | undefined => (arg(name) === undefined ? undefined : Number(arg(name)));

function main(): void {
  const days = num("days") ?? DEFAULT_WINDOW_DAYS;
  const end = arg("until") ? new Date(`${arg("until")}T00:00:00Z`) : new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const since = start.toISOString().slice(0, 10);
  const until = end.toISOString().slice(0, 10);
  const errors: string[] = [];

  const prs = attempt("prs", errors, () =>
    (JSON.parse(gh(["pr", "list", "--state", "all", "--limit", String(GH_LIST_LIMIT), "--search", `created:${since}..${until}`,
      "--json", "number,createdAt,mergedAt,closedAt,state,isDraft,body"])) as PrRecord[])
      .filter((p) => Date.parse(p.createdAt) >= start.getTime() && Date.parse(p.createdAt) < end.getTime()));

  const catchupByPr = prs && attempt("commits", errors, () => {
    const map = new Map<number, boolean>();
    for (const pr of prs.filter(isTicketPr)) {
      const headlines = JSON.parse(gh(["api", `repos/{owner}/{repo}/pulls/${pr.number}/commits?per_page=100`, "--jq", "[.[].commit.message | split(\"\\n\")[0]]"])) as string[];
      map.set(pr.number, headlines.some(isMainCatchup));
    }
    return map;
  });

  const openNow = attempt("open", errors, () =>
    JSON.parse(gh(["pr", "list", "--state", "open", "--json", "number,createdAt,mergedAt,closedAt,state,isDraft,body,mergeStateStatus"])) as PrRecord[]);

  const runs = (workflow: string, extra: string[]) =>
    (JSON.parse(gh(["run", "list", "--workflow", workflow, "--limit", String(GH_LIST_LIMIT), "--created", `${since}..${until}`,
      ...extra, "--json", "createdAt,updatedAt,conclusion,event,headBranch"])) as RunRecord[])
      .filter((r) => Date.parse(r.createdAt) >= start.getTime() && Date.parse(r.createdAt) < end.getTime());
  const ciPrRuns = attempt("ci", errors, () => runs("ci.yml", ["--event", "pull_request"]));
  const heavyMainRuns = attempt("heavy", errors, () => runs("heavy-tests.yml", ["--branch", "main"]));

  const metrics = computeMetrics({
    start, end, prs, catchupByPr, openNow, ciPrRuns, heavyMainRuns,
    gateLog: readGateLog(),
    lane: { runs: num("lane-runs"), idle: num("lane-idle"), medianMin: num("lane-median-min"), failed: num("lane-failed") },
    errors,
  });

  if (process.argv.includes("--tsv")) {
    if (process.argv.includes("--header")) console.log(TSV_COLUMNS.join("\t"));
    console.log(toTsvRow(metrics));
  } else {
    console.log(JSON.stringify(metrics, null, 2));
  }
}

if (process.argv[1] && path.basename(process.argv[1]).startsWith("cicd-metrics")) main();
