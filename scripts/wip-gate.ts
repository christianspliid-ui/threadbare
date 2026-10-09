/**
 * WIP-until-merged gate — no new claim while a ticket PR is still unmerged (2026-10-09).
 *
 * ## The problem this closes
 *
 * `pull-work` Step 1.5 enforces WIP = 1 on *In Dev claims*. A claim whose PR is open and
 * armed counts as **discharged**: the building is done and auto-merge fires with no
 * session present. Under the hourly cron that was harmless, because a run took ~31 min
 * and the lane then sat idle for ~30. The PR's ~13 min CI finished inside that gap, so
 * the next run branched from a main that already held it.
 *
 * THR-1717 moved `tb-opus-pickup` to `*\/20` (2026-10-03). Now the next run starts before
 * the previous PR merges and cuts its branch from a main without it. Every ticket PR
 * appends to the same ledgers (changelog, project-history) and regenerates the same
 * artifacts (systems inventory, interface map, public reference pages). So two PRs open
 * at once conflict by construction. On top of that, **GitHub's mergeability ignores
 * `.gitattributes merge=union`**, so even the ledgers a local merge settles cleanly read
 * `DIRTY` on GitHub. Measured over 3–9 Oct: code PRs needing a main catch-up rose from
 * 10 % to 33 %, PRs taking over an hour to merge from 5 % to 25 %, and merges per day did
 * not rise at all. On 2026-10-09 four green PRs sat `DIRTY` at once, each unstick
 * re-breaking the rest (#2271 was fixed at 04:53 and dirty again at 04:58).
 *
 * The skill text already said "a DIRTY PR does not discharge". That rule could not help,
 * because at claim time the previous PR is not dirty *yet*: it becomes dirty only after
 * the new branch exists. The invariant has to be "one ticket in flight **until it
 * merges**", and the only point where it can be enforced deterministically is the claim
 * itself.
 *
 * ## The gate
 *
 * PreToolUse hook on the Linear MCP `save_issue` tool (matcher `mcp__.*__save_issue`).
 * When the call is a **claim** (moves an issue to In Dev *and* sets an assignee — a move with
 * `assignee: null` is the THR-1283 park-restore and is never gated), list the open PRs. If any **blocking** PR
 * exists, deny (exit 2, reason on stderr). A blocking PR is open, not a draft, carries a
 * line-anchored close line (`Fixes|Closes|Resolves THR-N`, the same predicate as
 * `linear-autoclose.yml`, THR-738) for a ticket other than the one being claimed, has no
 * `Hold:` line, and was updated within {@link STALE_PR_IGNORE_HOURS}.
 *
 * - **Resume stays open.** Claiming the ticket an open PR closes is allowed: that is the
 *   Step 1.6/1.7 resume path, and the unstick duty re-asserts `In Dev` on it.
 * - **Drafts and held PRs don't block.** An attended session's early draft, or a PR
 *   parked with a `Hold:` line, would otherwise freeze the lane for hours.
 * - **A stale PR stops blocking** after {@link STALE_PR_IGNORE_HOURS}. A forgotten PR must
 *   not deadlock the lane. `check:armed-prs` already flags it `abandoned`, and the
 *   Step 0.8 unstick duty owns it.
 * - **Fail-soft.** If `gh` errors or the payload can't be parsed, allow with a stderr
 *   warning. A gate that bricks the lane on a GitHub blip costs more than one race.
 *
 * Every decision is appended to `.claude/logs/wip-gate.log` in the **home** tree (resolved
 * through `git rev-parse --git-common-dir`, so worktree runs log to one place). The
 * weekly `tb-cicd-review` lane counts denials from that log.
 *
 *   node --no-warnings --experimental-strip-types scripts/wip-gate.ts hook   # stdin: hook JSON
 *
 * Env: `WIP_GATE_PRS_JSON=<path>` substitutes a fixture for the `gh pr list` call (tests).
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
// The canonical hold predicate, shared with Step 0.8's probe. A PR that probe calls
// `held` must never block claims here, or the lane waits on a PR nobody will touch.
import { parseHoldMarker } from "./check-armed-prs.ts";

/** Linear's `In Dev` workflow state on the Threadbare team. */
export const IN_DEV_STATE_ID = "8d662f3d-8c8f-4e3b-b7d9-8c3de7f42f19";
/** An open PR untouched this long stops blocking claims (see the module doc). */
export const STALE_PR_IGNORE_HOURS = 24;
/** `gh pr list --limit`. The board rarely holds more than ten open PRs. */
export const OPEN_PR_LIST_LIMIT = 100;
export const LOG_RELATIVE_PATH = ".claude/logs/wip-gate.log";

export type OpenPr = {
  number: number;
  title: string;
  body: string;
  isDraft: boolean;
  updatedAt: string;
  mergeStateStatus?: string;
  autoMergeRequest?: unknown;
};

export type WipDecision = {
  verdict: "allow" | "deny";
  reason: string;
  claimedId: string | null;
  blocking: number[];
};

const CLOSE_LINE = /^(?:Fixes|Closes|Resolves) (THR-\d+)\s*$/gim;

/** Ticket ids a PR body closes, by the line-anchored autoclose predicate (THR-738). */
export function closedIds(body: string): string[] {
  const ids: string[] = [];
  for (const m of (body ?? "").matchAll(CLOSE_LINE)) ids.push(m[1].toUpperCase());
  return ids;
}

/** True when a `save_issue` input moves the issue to In Dev (by state name or id). */
export function movesToInDev(toolInput: Record<string, unknown> | null | undefined): boolean {
  const state = toolInput?.state;
  if (typeof state !== "string") return false;
  const s = state.trim();
  return s.toLowerCase() === "in dev" || s === IN_DEV_STATE_ID;
}

/**
 * True when a `save_issue` input is a **claim**: a move to In Dev that also assigns the
 * issue. A move to In Dev with `assignee: null` is pull-work's park-restore (THR-1283,
 * SKILL.md § verified-shipped park), which must never be gated: refusing it leaves a parked
 * issue in Ready for Dev to be re-offered every run.
 */
export function isClaim(toolInput: Record<string, unknown> | null | undefined): boolean {
  if (!movesToInDev(toolInput)) return false;
  const assignee = toolInput?.assignee;
  return typeof assignee === "string" && assignee.trim() !== "";
}

/** The PRs that make a claim of `claimedId` unsafe right now. */
export function blockingPrs(prs: readonly OpenPr[], claimedId: string | null, now: Date): OpenPr[] {
  const claimed = claimedId?.toUpperCase() ?? null;
  const staleMs = STALE_PR_IGNORE_HOURS * 3_600_000;
  return prs.filter((pr) => {
    if (pr.isDraft) return false;
    const ids = closedIds(pr.body);
    if (ids.length === 0) return false;
    if (claimed && ids.includes(claimed)) return false;
    if (parseHoldMarker(pr.body)) return false;
    const updated = Date.parse(pr.updatedAt);
    if (Number.isFinite(updated) && now.getTime() - updated > staleMs) return false;
    return true;
  });
}

export function renderDenial(claimedId: string | null, blocking: readonly OpenPr[]): string {
  const list = blocking
    .map((pr) => {
      const state = pr.mergeStateStatus ? ` ${pr.mergeStateStatus}` : "";
      const armed = pr.autoMergeRequest ? " armed" : " unarmed";
      return `  - PR #${pr.number} (${closedIds(pr.body).join(", ")};${armed}${state}): ${pr.title}`;
    })
    .join("\n");
  return [
    `wip-gate: claim of ${claimedId ?? "this issue"} refused. A ticket PR is still open and unmerged:`,
    list,
    "",
    "One ticket is in flight until its PR MERGES (not merely armed). A branch cut now would",
    "conflict with it: every ticket PR appends the same ledgers and regenerates the same",
    "artifacts, and GitHub ignores the union merge driver. Do this instead:",
    "  - DIRTY, red, or an unarmed review-gate park: unstick it now (pull-work Step 0.8), then stop.",
    "  - Armed and waiting on checks: end the run cleanly. The next run claims after it merges.",
    "  - Resuming the ticket that PR closes is allowed; claim that id instead.",
    `Drafts, PRs with a \`Hold:\` line, and PRs idle > ${STALE_PR_IGNORE_HOURS} h never block.`,
  ].join("\n");
}

export function decideWipGate(
  toolInput: Record<string, unknown> | null | undefined,
  prs: readonly OpenPr[],
  now: Date,
): WipDecision {
  const claimedId = typeof toolInput?.id === "string" ? toolInput.id.trim() : null;
  if (!claimedId) return { verdict: "allow", reason: "not an update of an existing issue", claimedId, blocking: [] };
  if (!isClaim(toolInput)) return { verdict: "allow", reason: "not a claim (no move to In Dev with an assignee)", claimedId, blocking: [] };
  // A claim of a ticket that already has its own open PR cuts no new branch: it is a
  // resume, or Step 0.8 handing an unsettleable conflict to the resume path. Other open
  // PRs must not block it. That hand-off happens precisely when several PRs are stuck.
  const ownPr = prs.find((pr) => closedIds(pr.body).includes(claimedId.toUpperCase()));
  if (ownPr) return { verdict: "allow", reason: `resume of ${claimedId} (its PR #${ownPr.number} is open)`, claimedId, blocking: [] };
  const blocking = blockingPrs(prs, claimedId, now);
  if (blocking.length === 0) return { verdict: "allow", reason: "no unmerged ticket PR", claimedId, blocking: [] };
  return { verdict: "deny", reason: renderDenial(claimedId, blocking), claimedId, blocking: blocking.map((p) => p.number) };
}

// ---------------------------------------------------------------- hook runtime

function homeTree(cwd: string): string | null {
  try {
    const common = execFileSync("git", ["-C", cwd, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    }).trim();
    return path.dirname(common);
  } catch {
    return null;
  }
}

function log(cwd: string, entry: Record<string, unknown>): void {
  try {
    const root = homeTree(cwd) ?? cwd;
    const file = path.join(root, LOG_RELATIVE_PATH);
    mkdirSync(path.dirname(file), { recursive: true });
    appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
  } catch {
    // Logging is best-effort; never let it change the verdict.
  }
}

function listOpenPrs(cwd: string): OpenPr[] {
  const fixture = process.env.WIP_GATE_PRS_JSON;
  if (fixture) return JSON.parse(readFileSync(fixture, "utf8")) as OpenPr[];
  const out = execFileSync(
    "gh",
    [
      "pr", "list", "--state", "open", "--limit", String(OPEN_PR_LIST_LIMIT),
      "--json", "number,title,body,isDraft,updatedAt,mergeStateStatus,autoMergeRequest",
    ],
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true, timeout: 20_000 },
  );
  return JSON.parse(out) as OpenPr[];
}

function runHook(): number {
  let payload: { tool_name?: string; tool_input?: Record<string, unknown>; cwd?: string };
  try {
    payload = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return 0;
  }
  const cwd = payload.cwd || process.cwd();
  const input = payload.tool_input ?? {};
  // Hot path: most save_issue calls are not claims. Skip the gh call entirely.
  if (!isClaim(input)) return 0;

  let prs: OpenPr[];
  try {
    prs = listOpenPrs(cwd);
  } catch (err) {
    const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
    process.stderr.write(`wip-gate: WARNING, could not list open PRs (${msg}); ALLOWING fail-soft.\n`);
    log(cwd, { verdict: "allow-failsoft", tool: payload.tool_name, id: input.id ?? null, error: msg });
    return 0;
  }

  const decision = decideWipGate(input, prs, new Date());
  log(cwd, { verdict: decision.verdict, tool: payload.tool_name, id: decision.claimedId, blocking: decision.blocking, open: prs.length });
  if (decision.verdict === "deny") {
    process.stderr.write(decision.reason + "\n");
    return 2;
  }
  return 0;
}

if (process.argv[2] === "hook") {
  let code = 0;
  try {
    code = runHook();
  } catch (err) {
    process.stderr.write(`wip-gate: WARNING, gate error (${err instanceof Error ? err.message : String(err)}); ALLOWING fail-soft.\n`);
    code = 0;
  }
  process.exit(code);
}
