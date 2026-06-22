> **title:** Create `monthly-rulebook-review` scheduled task — THR-417
> **linear_issue:** THR-417
> **author:** Cowork
> **created:** 2026-06-12
> **three_pillars:** Engine `N/A — meta-process scheduled task, no engine code` · Content `N/A — no game content authored` · UI `N/A — no player-facing surface (writes a Linear issue, no in-game render)`

# Create `monthly-rulebook-review` scheduled task — THR-417

*One sentence: ships Phase 3 of the rulebook canon design by registering the monthly review automation that was deferred because Cowork's sandbox blocks `mcp__scheduled-tasks__create_scheduled_task`.*

## Why this is load-bearing

The rulebook canon page (`Docs/canon/rulebook.md`, shipped under THR-403) is only a living document if something forces a periodic re-read. Phase 3 of the rulebook design (THR-405, shipped) wrote the maintenance cadence into CLAUDE.md but left one task uncreated: the monthly review automation. Without it, `[OPEN]` questions accumulate, `last_reviewed` dates go stale, and the architecture-assessment cadence has no monthly companion. The Phase 2 drift scan catches mechanical drift between rulebook and code; this task catches the slower drift between rulebook and time (questions deferred, dates not refreshed, sections gone unread). The deferral existed because the MCP tool that creates scheduled tasks (`mcp__scheduled-tasks__create_scheduled_task`) is blocked when invoked from within a scheduled-task session (impediments #130, #133), so Cowork can't create it from its `keep-work-flowing` automation; it requires an interactive CC session.

The CLAUDE.md § Scheduled Tasks table already lists the task with `(needs creation — THR-417)` next to it, so the row is visible to every agent that reads the file but the underlying scheduled task does not exist yet — a discoverable gap.

## Engine pillar

Engine: N/A — meta-process scheduled task, no tick-loop or engine code touched.

## Content pillar

Content: N/A — no game content authored.

## UI pillar

UI: N/A — the only "output" is a Linear issue posted by the monthly run; no player-facing surface, no DebugPanel addition, no HexMapV2 signifier. Screenshot tool: none (no UI change to verify).

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `monthly-rulebook-review` scheduled task | n/a (runs outside the game tick loop) | n/a | n/a | n/a (scheduled-task logs only) | `list_scheduled_tasks` output |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| Cron expression | `0 9 1 * *` | 09:00 local on the 1st of each month — matches CLAUDE.md row |
| `[OPEN]` question staleness threshold | 60 days | Surfaced in the review issue if older — sourced from `Docs/plans/2026-05-11-rulebook-canon-page.md` §8 |

## Tracing

N/A — scheduled-task runtime logs are captured by the Cowork task harness; no in-engine trace types emitted.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `Docs/canon/rulebook.md` missing | Post a Linear issue noting the rulebook canon page is missing; do not throw |
| Drift-scan lint signals fail to run | Skip the on-demand lint step, log the failure, continue with date + open-question checks |
| Linear API unreachable when posting findings | Write findings to the session log; the next monthly run will re-surface unresolved items |
| Vault MCP unreachable during a vault check | Filesystem fallback (per CLAUDE.md sandbox-limitations note on `OBSIDIAN_VAULT_PATH`) |

## Blast Radius

N/A — no `src/` files touched; no high-impact file has ≥100 importers in scope.

## Three-pillar check

- [x] Engine pillar present (N/A with rationale)
- [x] Content pillar present (N/A with rationale)
- [x] UI pillar present (N/A with rationale)
- [x] Wiring section connects them (the only "wiring" is the scheduled-task registry row + CLAUDE.md table row)

## Vision audit

- [x] This plan does not contradict any Vision premise
- [x] No Vision edit required — this is process infrastructure

## Rulebook impact

- [x] This plan does not change a rule of play
- [x] No `Docs/canon/rulebook.md` edit required — this is the scheduled task that *reads* the rulebook, not one that changes it

> Brainstorm companion: N/A — pure infrastructure follow-up from THR-405 with spec already in `Docs/plans/2026-05-11-rulebook-canon-page.md` §8. No alternatives to weigh; the deferral was mechanical, not conceptual.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Cron expression and 60-day staleness threshold are named in the task prompt; changing cadence = edit the cron string |
| 2. Inspectability | PASS | The task emits a Linear issue per run — fully traceable history |
| 3. Determinism | PASS | No PRNG; the task runs deterministically against the rulebook + date arithmetic |
| 4. Fail-soft | PASS | See fail-soft table above |
| 5. Narrative over mechanical perfection | PASS | The task is process scaffolding; no narrative trade-off |
| 6. Additive over destructive | PASS | Adds a new scheduled task and updates one CLAUDE.md row from "needs creation" to "Active"; nothing removed |
| 7. Performance budget | N/A | Runs once per month, off the tick loop |

## Done when

- [ ] `mcp__scheduled-tasks__create_scheduled_task` invoked from an **interactive CC session** (not from a scheduled-task session — impediments #130/#133) with the spec below
- [ ] `monthly-rulebook-review` appears in `list_scheduled_tasks` output with `enabled: true` and cron `0 9 1 * *`
- [ ] `CLAUDE.md` § Scheduled Tasks row updated: replace `(needs creation — THR-417)` with `Active` and set the Runtime column from `TBD` to whichever lane runs it (CC automation lane is the default)
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass — only CLAUDE.md is edited so these will pass trivially; paste raw output in the closing commit body anyway
- [ ] Closing commit body includes `Fixes THR-417`
- [ ] Browser-verify exempt: scheduled-task registration + one-line CLAUDE.md table edit, no UI surface modified

## Scheduled-task spec (copy verbatim into the MCP call)

```
mcp__scheduled-tasks__create_scheduled_task(
  taskId: "monthly-rulebook-review",
  description: "Monthly review of Docs/canon/rulebook.md — drift check, open questions >60 days, post Linear issue with findings",
  cronExpression: "0 9 1 * *",
  notifyOnCompletion: false,
  prompt: <full prompt text below>
)
```

**Full prompt text (paste as the `prompt` parameter):**

```
You are running the monthly rulebook review. This is an automated run of a scheduled task — execute autonomously, do not ask clarifying questions.

# Task

Read `Docs/canon/rulebook.md` and perform a four-part review:

## Part 1 — Last-reviewed dates

- Check the `last_reviewed:` field in the rulebook's frontmatter.
- Check the per-section `<!-- last_reviewed: YYYY-MM-DD -->` footer comments at the bottom of each of the 8 sections (turn structure, action verbs, prerequisites, resources, encounters, clocks, win/loss, open questions).
- Flag any date >90 days old.

## Part 2 — Open questions

- Scan the rulebook for `[OPEN]` status flags and the dedicated "Open Questions" section.
- For each open question, parse the `(opened: YYYY-MM-DD)` annotation if present (Phase 1 spec).
- Flag every question that has been open >60 days. If no opened-date is annotated, treat the rulebook's `created:` date as the lower bound and flag if that exceeds 60 days.

## Part 3 — On-demand drift scan

- Run the four Phase 2 rulebook lint signals on-demand (from `.github/workflows/drift-scan.yml` and `scripts/drift-scan/`):
  1. Rule status flag drift (any `[IMPL]` rules whose cited code constant changed)
  2. UL-vs-rulebook terminology drift
  3. Manual-vs-card structural drift (rulebook synthesis vs board-game card)
  4. Rejected-approach reintroduction lint
- Collect any drift findings.

## Part 4 — Post findings to Linear

- If parts 1–3 found anything: create a Linear issue in the Threadbare team:
  - Title: "Monthly rulebook review — YYYY-MM (X findings)"
  - Project: Content Architecture
  - Labels: `rulebook-review`, `Infrastructure`
  - State: Todo
  - Body: structured findings under "## Last-reviewed stale", "## Open questions >60 days", "## Drift findings" headers. Each finding cites the rulebook section, the file/line, and a one-line description.
- If parts 1–3 found nothing: post a one-line comment to the project's most recent rulebook-review issue (or skip if none exists) confirming the rulebook passed this month's review. Do NOT create an empty issue.

# Fail-soft

- If `Docs/canon/rulebook.md` is missing, post a Linear issue noting the canon page is missing. Do not throw.
- If the drift-scan scripts are unavailable, skip Part 3, log the skip in the issue body, and continue with Parts 1, 2, 4.
- If the Linear API is unreachable, write the findings to the session output. The next monthly run will re-surface unresolved items.

# Output

Print a one-paragraph summary at the top of the session output naming the Linear issue created (or noting the no-findings outcome) so the daily backlog grooming task can pick it up.
```

## Coordination block

**Suggested model:** `sonnet` — single MCP tool call followed by a one-line CLAUDE.md table edit. No prose authoring, no novel logic, no design judgment. Haiku could handle the mechanics but Sonnet is safer for the verification step (confirming the task appears in `list_scheduled_tasks` and the CLAUDE.md edit reads correctly).

**Parallel-safe with:** any issue that does not edit `CLAUDE.md` § Scheduled Tasks table.

**Mutex with:** any concurrent edit to `CLAUDE.md` § Scheduled Tasks (THR-417's only file edit lands there). No active issues currently touch this row.

**Codex review:** `no` — pattern-following infrastructure work, single MCP call with a documented spec. No novel logic, no engine wiring, nothing to review beyond "did the task appear in `list_scheduled_tasks` and does the CLAUDE.md row read 'Active' now."

**Files to touch:**
- Edit: `CLAUDE.md` (one line: § Scheduled Tasks table row for `monthly-rulebook-review` — replace `(needs creation — THR-417)` with the task taskId in normal table style, and replace `TBD` runtime with `CC automation lane`)
- No new files. The scheduled task registers via MCP, not a file.

## Notes for the executor

- **Run this from an interactive CC session, not a scheduled-task session.** Impediments #130 and #133 documented that `mcp__scheduled-tasks__create_scheduled_task` is blocked from within a scheduled-task session — that's the reason this issue exists. If you're running this as part of a scheduled CC pickup, exit and pick it up in the next interactive session instead. Surface this back to the user via a Linear comment if the WIP-limit means you cannot grab another issue.
- **Do not author the prompt text from scratch.** The full prompt is provided verbatim in this plan doc under "Scheduled-task spec (copy verbatim into the MCP call)". Paste it as the `prompt` parameter. Do not paraphrase, do not "improve," do not add reflection or planning — the prompt is calibrated to fail-soft and produce a single deterministic output.
- **Verify the task is enabled.** After `create_scheduled_task` returns, immediately call `list_scheduled_tasks` and confirm `monthly-rulebook-review` appears with `enabled: true` and `cronExpression: "0 9 1 * *"`. The Linear MCP `save_issue` write-verify pattern (impediment #48) does not apply to scheduled tasks, but read-back-after-write is still cheap insurance.
- **The CLAUDE.md edit is one line.** Do not rewrite the table; just change `(needs creation — THR-417)` to nothing (drop the parenthetical) and change the Runtime column value from `TBD` to `CC automation lane`. Do not add additional rows or restructure the table.
- **`plan-pending-commit` label applied at handoff.** The hourly `flush-plan-docs` task will commit this plan doc to `origin/main`. Do not commit it manually.
