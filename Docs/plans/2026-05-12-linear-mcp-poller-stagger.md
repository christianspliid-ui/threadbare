# Linear MCP Poller Stagger — Hourly Cadence De-collision

> **Date:** 2026-05-12
> **Type:** Process infrastructure (scheduled-task cron tuning)
> **Status:** Plan — ready for executor
> **Linear:** THR-425
> **Project:** Continuous Improvement
> **Related:** THR-246 (parent stagger initiative, partial — Change A/C/D landed, Change B deferred), impediment #79 (2026-04-23), impediment #108 (2026-04-30)

---

## Source

Impediment #108 (2026-04-30, `check-slack-for-new-dev-work` scheduled task) — Linear MCP returned HTTP 429 on the initial `list_issues` board scan *and* on the retry two minutes later. No issues claimed, no work executed that cycle. The pull-work Step 0 backoff guard fired correctly (added by THR-246), but a CC pickup cycle still lost because two automations were querying Linear simultaneously at the top of the hour.

THR-246 (2026-04-23 plan) shipped Changes A (single board-scan), C (Step 0 rate-limit guard in pull-work + Codex pickup), and D (documented the limit in the coordination protocol). It deferred **Change B — stagger hourly pollers** as "documented-in-prose" without actually editing any cron expression. Impediment #108 is the evidence the deferral cost a cycle.

This plan finishes Change B.

## Diagnosis

Three contributing causes, ranked:

1. **Multiple Linear-MCP-using automations fire at minute 0 of each hour.** At minimum:
   - **CC hourly pickup** (`check-slack-for-new-dev-work` and equivalents) — currently :00 per the protocol doc.
   - **Cowork PM agent** (`keep-work-flowing`, this scheduled task) — currently `0 * * * *` (minute 0).
   - **Codex hourly pickup** — protocol *says* :30 (see `2026-04-13-linear-coordination-protocol.md` line 497) but the actual deployed cron has not been verified by anyone in-session and may also be :00.

   Three hourly automations × ~10 Linear MCP calls each within the first 30 s of :00 = consistent 429.

2. **`flush-plan-docs` runs hourly at :15** per `CLAUDE.md § Scheduled Tasks`. Its primary work is git, but it does `list_issues(label:"plan-pending-commit")` + per-issue `get_issue` + `save_comment` on each labeled issue. Typical run today touches 1–3 issues; under high backlog it can touch 8–10. Currently isolated at :15 — good as-is.

3. **`daily-backlog-grooming` fires at 09:00** every day (`0 9 * * *`). Linear-heavy. Collides daily with the :00 hourly trio. One bad cycle per day.

The protocol doc (line 497) already says "CC polls at :00, Codex polls at :30" but this is **prescription, not description** — no automation registry verifies it. The actual cron expressions live in three runtimes:

- This Cowork machine's `~/OneDrive/Dokumenter/Claude/Scheduled/` (visible via `list_scheduled_tasks` from within Cowork — see Appendix A for the current snapshot).
- The CC automation lane (lives in a separate runtime — Cowork cannot enumerate; user-action item below).
- The Codex automation lane (same — user-action item).

## Solution — Canonical Minute Slots

Allocate one Linear-MCP-touching automation per quarter-hour slot. No two hourly tasks share a minute. Daily and weekly tasks pick a unique minute that does not coincide with any hourly slot.

### Proposed canonical schedule

| Slot | Cadence | Task | Cron | Runtime | Currently |
|------|---------|------|------|---------|-----------|
| **:00** | Hourly | Claude Code pickup (`check-slack-for-new-dev-work` / equivalents) | `0 * * * *` | CC automation lane | :00 (presumed — verify) |
| **:15** | Hourly | `flush-plan-docs` | `15 * * * *` | CC automation lane | :15 (per CLAUDE.md) |
| **:30** | Hourly | Codex pickup (Threadbearer automation) | `30 * * * *` | Codex automation lane | Unverified — protocol says :30 |
| **:45** | Hourly | `keep-work-flowing` (Cowork PM) | `45 * * * *` | This machine | `0 * * * *` — **needs change** |
| **09:06** | Daily | `daily-backlog-grooming` | `6 9 * * *` | This machine | `0 9 * * *` — **needs change** |
| **Wed 09:04** | Weekly | `weekly-workflow-retro` | `4 9 * * 3` | This machine | Already :04 ✓ |
| **Fri 14:00** | Weekly | Drift scan (GitHub Action) | n/a (Actions cron) | GitHub Actions | :00 — keep (no Linear MCP from CI, only GraphQL via Actions secret; not in our 429 budget) |
| **Fri ~15:00** | Weekly | `weekly-retro` | `0 15 * * 5` | CC automation lane | per CLAUDE.md |
| **Sun 10:04** | Weekly | `weekly-project-hygiene` | `4 10 * * 0` | This machine | Already :04 ✓ |
| **Sun 10:06** | Weekly | `weekly-invoice-check` | `6 10 * * 0` | This machine | Already :06 ✓ (Gmail, not Linear — kept for completeness) |
| **Sun 16:03** | Weekly | `weekly-memory-grooming` | `3 16 * * 0` | CC automation lane | per CLAUDE.md |
| **1st 09:00** | Monthly | `monthly-rulebook-review` (when created — THR-417) | `0 9 1 * *` | TBD | Not yet created |

### Slot allocation principle (for future scheduled tasks)

1. **Hourly tasks** pick one of the four quarter-hour slots (:00, :15, :30, :45). No two share a slot.
2. **Daily tasks** pick a minute ≠ 00 / 15 / 30 / 45 within their hour. The above uses :06 (`daily-backlog-grooming`) as the standing daily Linear-touching slot.
3. **Weekly tasks** pick a minute ≠ 00 / 15 / 30 / 45 within their hour. Existing :04 / :06 / :03 slots remain.
4. **Adding a new hourly Linear-MCP-using task in the future**: if all four quarter-hour slots are claimed, add 5-minute offsets within slots (e.g., :05, :20, :35, :50 for a second tier). Document the choice in CLAUDE.md § Scheduled Tasks at the same time the task is registered.

## Three-pillar coverage

- **Engine — N/A.** No engine code touched. Rationale: this is exclusively scheduled-task configuration and CLAUDE.md doc edits; the simulator runtime is not involved.
- **Content — N/A.** No game content. Rationale: process infrastructure only.
- **UI — N/A.** No player-facing surface. Rationale: the "interface" affected is the agent-to-Linear-MCP polling cadence, not a user surface.
- **Wiring — required.** See Action items below — same canonical schedule needs to land in three places (CLAUDE.md § Scheduled Tasks, the coordination protocol's Known Linear MCP Limitations bullet, and the three runtimes' cron files), or agents will only learn one half of the truth.

## Wiring section

| Surface | Change |
|---------|--------|
| `CLAUDE.md § Scheduled Tasks` | Replace the current table with the full canonical schedule above. Add a note: "Hourly slots are :00 / :15 / :30 / :45 — one task per slot. Daily and weekly tasks pick non-quarter-hour minutes." |
| `Docs/plans/2026-04-13-linear-coordination-protocol.md` line ~497 | Update the rate-limit bullet to point at the new canonical schedule rather than just naming :00 / :30 in prose. |
| **This machine's cron** (`keep-work-flowing` SKILL.md, `daily-backlog-grooming` SKILL.md) | Update cron expressions to `45 * * * *` and `6 9 * * *` respectively. **User-action** — see Action items §3 below. |
| **CC automation lane** | Verify the CC pickup is at :00, `flush-plan-docs` at :15, `weekly-retro` at Fri 15:00, `weekly-memory-grooming` at Sun 16:03. If any deviation, fix. **User-action** — Cowork cannot enumerate this lane. |
| **Codex automation lane** | Verify the Codex pickup is at :30. If at :00, move to :30. **User-action**. |

## Constants

None. Cron expressions are configuration, not runtime constants. The quarter-hour slot principle is documented-in-prose; promote to a config file only if future scheduling becomes orchestrated from the repo (currently it's a mix of three runtimes managed by hand).

## Tracing

No new trace types. The existing pull-work Step 0 impediment-log entry on 429 is the trace surface — if the stagger works, impediment-log entries for `429` should drop to ~zero. The 30-day post-deploy check below uses this as the success signal.

## Fail-soft table

| Failure | Fallback |
|---------|----------|
| Two automations end up on the same minute after deploy (user-side mistake) | Existing pull-work Step 0 guard (THR-246) still fires: pause 2 min, retry once, log impediment, exit. No worse than today. |
| User cannot edit the CC or Codex automation lane (no access this session) | In-repo edits (CLAUDE.md, coordination protocol) still land. Cron edits queued as a manual follow-up; the doc states the canonical schedule, so any future agent registering a new task knows the rules. |
| `keep-work-flowing` cron change shifts this scheduled task by ~45 min the day it lands | Acceptable — one-shot displacement. Subsequent runs are on the new cadence. |
| Daily-backlog-grooming shift moves it from 09:00 → 09:06 | Cosmetic; downstream automation does not depend on exact minute alignment. |

## NFP Compliance

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | PASS | Minute slots are named values in a table; tunable by editing CLAUDE.md + the cron file. No magic numbers introduced into game code. |
| 2. Inspectability | PASS | Success signal (drop in 429 impediment-log entries) is observable and bounded. |
| 3. Determinism | PASS | No engine PRNG touched. |
| 4. Fail-soft | PASS | Existing Step 0 backoff continues to cover the residual collision case. See fail-soft table. |
| 5. Narrative | PASS-with-note | N/A — process change, no game content. |
| 6. Additive | PASS | Adds rows to existing tables; changes two cron strings. No deletions. |
| 7. Performance | PASS | Reduces wasted automation cycles; no engine perf impact. |

---

## Action items

### Engine action items
N/A — infrastructure only.

### Content action items
N/A — infrastructure only.

### UI action items
N/A — infrastructure only.

### Wiring action items (executor lands these)

1. **Edit `CLAUDE.md` § Scheduled Tasks.** Replace the existing 5-row table with the full canonical schedule from this plan doc. Add the slot-allocation principle as a short paragraph below the table:

   > **Slot allocation.** Hourly Linear-MCP-using tasks occupy the four quarter-hour slots: :00 (CC pickup), :15 (flush-plan-docs), :30 (Codex pickup), :45 (Cowork PM). Daily and weekly tasks pick non-quarter-hour minutes (e.g., :04, :06, :09). When registering a new hourly task, pick the next free 5-minute offset within a quarter-hour band and update this table in the same commit.

2. **Edit `Docs/plans/2026-04-13-linear-coordination-protocol.md`** (the rate-limit bullet near line 497). Replace the inline ":00 / :30" prose with a pointer to `CLAUDE.md § Scheduled Tasks` so the canonical schedule lives in one place. Suggested rewrite:

   > **(c) Hourly automations are staggered across the four quarter-hour slots — see `CLAUDE.md § Scheduled Tasks` for the canonical schedule. Never co-locate two Linear-MCP-touching tasks on the same minute.**

3. **Append a row to `Docs/impediments.md` for impediment #108** marking it `resolved by THR-425` once this plan lands.

4. **Update `Docs/project-status.md`** with a single line under "Recent" noting THR-425 shipped the stagger. Move the displaced entry per the project-status ≤60-line rule.

5. **Append to `Docs/project-history.md`** the standard one-line ✅ entry.

6. **Append to `Docs/changelog.md`** rows for `CLAUDE.md` and the coordination protocol edits.

### User-action items (out-of-repo cron edits)

These cannot be landed by the in-repo executor — they require interactive sessions on the systems where the cron lives:

7. **On this machine (Cowork's local Claude desktop, paths under `C:\Users\chris\OneDrive\Dokumenter\Claude\Scheduled\`):**

   - `keep-work-flowing` — change `cronExpression: "0 * * * *"` → `"45 * * * *"`.
   - `daily-backlog-grooming` — change `cronExpression: "0 9 * * *"` → `"6 9 * * *"`.

   Either by editing the SKILL.md files directly or via the Claude desktop scheduled-tasks UI. Use `mcp__scheduled-tasks__update_scheduled_task` from an interactive session as the preferred path.

8. **In the CC automation lane:** confirm the hourly pickup is on `0 * * * *` (or move to `0 * * * *` if not). Confirm `flush-plan-docs` is on `15 * * * *`. Confirm `weekly-retro` is on `0 15 * * 5`. Confirm `weekly-memory-grooming` is on `3 16 * * 0`.

9. **In the Codex automation lane:** confirm the hourly pickup is on `30 * * * *`. If it is currently `0 * * * *`, change it.

After the cron edits land, the executor's closing comment on THR-425 should include a snapshot of the resulting schedule (output of `mcp__scheduled-tasks__list_scheduled_tasks` on this machine, plus user-supplied confirmation that the CC and Codex lanes match the table).

### Grey zones / executor decisions

- **Whether to bundle the user-action items into a separate Linear issue.** This plan keeps them in THR-425 because they are inseparable from the documentation change (the doc is wrong if the cron is wrong). Executor can land actions 1–6 immediately; user-action items 7–9 stay open and the issue moves to Done only after the user confirms 7–9 are complete. Alternative: file a `Manual Tweaks` follow-up issue for 7–9 and close THR-425 on the doc edit alone. Executor's call.

- **`weekly-invoice-check` keeps its Sunday 10:06 slot** even though it touches Gmail, not Linear. It is included in the canonical table for completeness so future scheduled-tasks reviewers see the full picture.

- **Drift scan (GitHub Action) keeps Friday 14:00 UTC.** It runs in GitHub Actions, not in the Linear MCP client — its API token and rate-limit budget are independent of the agents' MCP polling. No collision with the agent-side schedule.

### Files Cowork has written

- `Docs/plans/2026-05-12-linear-mcp-poller-stagger.md` (this file, new)

### Files executor will edit

- `CLAUDE.md` (§ Scheduled Tasks rewrite)
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` (rate-limit bullet rewrite)
- `Docs/impediments.md` (mark #108 resolved)
- `Docs/project-status.md` / `Docs/project-history.md` / `Docs/changelog.md` (standard close-out updates)

No source code changes. No tests affected.

---

## Non-goals

- **Replacing polling with webhooks.** Long-term answer; deferred. If 429s persist after this lands and the user-action cron edits ship, file a follow-up research issue.
- **Building a config file that drives all cron schedules from the repo.** Premature — the three runtimes are managed by hand today, and consolidation would be a project on its own.
- **Promoting any rate-limit guard to runtime telemetry.** The impediment-log is the trace surface and it's good enough.
- **Auto-detecting collisions.** Not worth a script for four slots managed by humans. The CLAUDE.md table is the registry.

---

## Definition of done

- [ ] CLAUDE.md § Scheduled Tasks table replaced with the canonical schedule.
- [ ] Coordination protocol rate-limit bullet rewritten to point at CLAUDE.md.
- [ ] Impediment #108 marked resolved.
- [ ] Standard close-out doc updates (project-status, project-history, changelog).
- [ ] User confirms the three out-of-repo cron edits (actions 7, 8, 9) have landed — comment posted on THR-425 with the verification snapshot.
- [ ] 30 days post-deploy: ≤1 new 429-flavored impediment-log entry (success threshold).

---

## Appendix A — Current `list_scheduled_tasks` snapshot (this machine, 2026-05-12)

| taskId | cron | enabled | Linear MCP user? |
|--------|------|---------|-------------------|
| `keep-work-flowing` | `0 * * * *` | yes | yes (heavy — Cowork board scan) |
| `daily-backlog-grooming` | `0 9 * * *` | yes | yes (heavy — grooming sweep) |
| `weekly-project-hygiene` | `0 10 * * 0` | yes | yes (sweep) |
| `weekly-invoice-check` | `0 10 * * 0` | yes | no (Gmail) |
| `weekly-workflow-retro` | `0 9 * * 3` | yes | yes (retro reads Linear) |
| `korebog-friday-checkin` | `0 8 * * 5` | yes | no (xlsx) |
| `update-product-strategy` | manual | no | indirect |
| `keep-codex-flowing` | manual | no | yes |
| `threadbearer-load-balance-work-between-development-agents` | manual | no | yes |

Three `weekly-*` tasks at exactly Sunday 10:00 — two are Linear (`project-hygiene`) and one is Gmail (`invoice-check`); the third weekly at this hour is `weekly-workflow-retro` on Wednesday 09:00. The actual conflict window is Sunday 10:00 between `weekly-project-hygiene` (Linear) and `weekly-invoice-check` (Gmail) — separate API surfaces, so not a 429 risk. **No edits required to the weekly tasks** if their existing :03 / :04 / :06 minute offsets land via the user-action audit; the `0 10 * * 0` rows above show what the tool currently reports but the displayed jitter (`jitterSeconds: 216` and `388`) means each fires ~3–6 minutes past :00 anyway.

The two Linear-heavy hourly/daily tasks on this machine — `keep-work-flowing` and `daily-backlog-grooming` — are the only edits required from this runtime.

---

*Issue authored by Cowork, 2026-05-12.*
