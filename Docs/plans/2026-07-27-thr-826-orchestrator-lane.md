> **title:** `Orchestrator lane — THR-826`
> **linear_issue:** THR-826
> **author:** Claude Code
> **created:** 2026-07-27
> **three_pillars:** Engine `N/A — process/automation lane; touches no tick phase, graph node or GameState field` · Content `N/A — authors no game content; it schedules the sessions that do` · UI `N/A — no player-facing or debug surface; its output is a markdown report consumed by the hourly briefing`

# Orchestrator lane — THR-826

The lane that decides what happens next, so that agreed work reaches the executor without Christian starting a session by hand — and that owns technical health continuously, because he has said he cannot.

## Why this is load-bearing

Threadbare has a routine **executor** (`tb-opus-pickup`, hourly at :01, WIP=1) which shipped ~15 tickets in the 19 unattended hours before this plan was written. It has **no orchestrator**. Every other scheduled lane is downstream of a decision someone else already made: `keep-work-flowing-cc` observes and reports but is read-mostly by design; `daily-backlog-grooming` tidies but may not promote or claim; the weeklies retro. **Nothing decides what happens next.** That role is Christian, in hand-started sessions.

This produces a closed loop. The executor drains `Ready for Dev` and refills it *itself* — each ticket it closes tends to file a deferral underneath, which enters directly at `Ready for Dev`. `daily-backlog-grooming`'s only starvation rule fires when `Ready for Dev` **and** `In Dev` are both empty, which is unreachable while the executor keeps stocking its own shelf. So depth reads healthy (19–23 all week), the one check that could object never fires, and **authored program work waits in `Todo` indefinitely**. Measured while drafting: 0 High, 4 Medium, 15 Low, every arrival that day a self-found housekeeping deferral.

The cost is not hypothetical. On 2026-07-27 Christian authorised releasing four Nudge Model workstreams on Discord at 14:38Z. `keep-work-flowing-cc` recorded the authorisation correctly within a minute, wrote *"routed to an executor"*, and **nothing happened for four hours** — no lane reads that sentence. THR-778's own description had read `Blocked by: WS0, WS1, WS3` for two days with all three Done. They were promoted by hand at 17:21Z only because he asked in chat whether it had been done.

**Root cause, and why the fix starts with a docs edit.** `Docs/ways-of-working.md` documents the *decision* split thoroughly but contains no clause granting an agent authority to **begin work unprompted**; the nearest, *"propose automations proactively"*, stops at *propose*. The orchestrator was never forgotten — it was never authorised. Slice 1 is that mandate, and it is load-bearing on its own: without it the lane runs on authority that exists only in one chat transcript.

**What unblocks it is already built.** Every handoff since THR-688 carries `Blocked by` / `Parallel-safe with` / `Mutex with`. The executor consumes the **mutex** half at claim time and does it well — it deferred THR-800 four times in one day on a single authored line, taking other work instead. **Nothing consumes the dependency half**, because nothing promotes. The core loop is largely reading a field we have maintained for four months.

## Engine pillar

Engine: N/A — this is a scheduled-automation lane. It runs no tick phase, adds no graph node or edge, reads and writes no `GameState` field, and executes outside the simulation entirely. Its only contact with the engine is *invoking* existing detector scripts (§ Slice 4) as child processes and reading their output.

## Content pillar

Content: N/A — the lane authors no encounters, prose, attachments or data tables. It schedules and hands off the design sessions that do, and those sessions carry their own Content-pillar obligations under the existing governance checklist.

## UI pillar

UI: N/A — no player-facing surface, no DebugPanel entry, no HexMapV2 change. The lane's entire output is a markdown report; Christian-facing lines reach him through the existing hourly briefing, in plain language, per THR-608. Deliberately **not** given a dashboard: a surface only Christian could read would violate the chat-only review interface.

## Slices

Ordered. Slice 1 lands alone and is valuable alone.

### Slice 1 — The mandate (docs-only)

Add `## Agent initiative — what may begin without being asked` to `Docs/ways-of-working.md`, carrying D1–D7 from the grill synthesis. **Already drafted in this PR.** That file states it is meant to evolve when a working agreement is settled in chat, so this is recording, not proposing.

### Slice 2 — The lane skeleton + unblock sweep (T1)

New scheduled task `tb-orchestrator`, hourly at `:25` — clear of the executor's `:01` and the briefing's `:45`, so the three never contend for the board.

**T1 runs every pass and is the cheap tier:** query issues in `Todo` / `Idea` belonging to projects with active work; parse `Blocked by:` out of the description; if every named blocker is `Done`, promote to `Ready for Dev`. Set priority from the parent program's standing rather than inventing a lane-jump rule — the existing priority field already sequences the executor correctly, and a second ordering mechanism would drift from it.

**Verify after every write** (impediment #48 — `save_issue` returns 200 without always persisting). Cap promotions per run at `ORCH_PROMOTE_BATCH_MAX` so a parsing bug cannot flood the shelf in one pass.

### Slice 3 — Design authoring (T2)

When program work on the shelf is thin — fewer than `ORCH_PROGRAM_WORK_FLOOR` non-`Deferral` items in `Ready for Dev` — take the top agreed-but-undesigned item, run the existing `design-session` flow, and hand off with a coordination block. Bounded by `ORCH_MAX_IN_DESIGN` concurrent `In Design` issues.

**When no agreed work remains, stop and ask** (Discord, non-blocking). Never fall through to un-agreed roadmap items: that is choosing direction, which is Christian's.

### Slice 4 — Architecture-health duty (T3)

Once per day, on the first run after `ORCH_HEALTH_SWEEP_HOUR`: run the detectors that already exist, diff findings against the previous sweep, and report **new** ones.

Reuse, do not rebuild — `npm run generate-interface-map` (`LEAKED` badges), `validateTraitRefs`, `sweep:rank-reach`, `npm run check:process`. Several are advisory today; the gap this closes is that **nothing is obliged to read them and say so in plain language**.

Two things this tier must do that no existing detector does:

1. **Redundancy, not just reachability.** D7 covers *redundant* systems — two implementations doing one job. Both are reachable, so no reachability sweep will ever flag them. This needs a genuine judgement pass over the interface map and the systems inventory, not a script. Accept that it is the weaker half and say so in the report rather than implying coverage.
2. **Stalled-work detection.** An issue claimed `ORCH_STALLED_PICKUP_THRESHOLD` times without a merge is failing repeatedly and nothing currently notices.

### Slice 5 — Close the reporting loop

The lane writes `Docs/ops/orchestrator-YYYY-MM-DD.md` with a `## Needs Christian` section, per the CLAUDE.md rule that no task other than `keep-work-flowing-cc` writes `Design/briefing.md` or `Design/user-actions.md`.

**Verify — do not assume — that `keep-work-flowing-cc` actually reads sibling reports' `## Needs Christian` sections.** If it does not, this plan reproduces its own root cause: a report nobody reads is the same defect as "routed to an executor" with no consumer. If the link is missing, adding it is in scope for this slice.

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md` — the engine-module rows are N/A here (no orchestrator phase, no GameState field, no UI mount); the rows that *do* bind are "is it invoked?" and "is its output consumed?", which Slice 5 exists to prove.

| Module | Trigger | Reads | Writes | Consumed by |
|--------|---------|-------|--------|-------------|
| `tb-orchestrator` (scheduled task) | cron `ORCH_CRON` | Linear board; `Blocked by` fields | Linear state (`Todo`→`Ready for Dev`), priority | `tb-opus-pickup` (hourly executor) |
| T1 unblock sweep | every run | issue descriptions, blocker states | promotions | executor |
| T2 design authoring | shelf below floor | plan docs, canon, grill synthesis | plan doc + `Ready for Dev` handoff | executor |
| T3 health sweep | daily after `ORCH_HEALTH_SWEEP_HOUR` | interface map, `validateTraitRefs`, `sweep:rank-reach` | `Docs/ops/orchestrator-*.md` | `keep-work-flowing-cc` → briefing → Christian |
| Escalation | on genuine uncertainty | — | Discord DM | Christian |

Registry obligations (CLAUDE.md § Scheduled Tasks): add the row to `Docs/ops/scheduled-tasks-registry.md` with **both** cron and observed fire time, and mirror the live prompt to `Docs/ops/scheduled-task-prompts/tb-orchestrator.md` in the same PR.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ORCH_CRON` | `25 * * * *` | Hourly, clear of `:01` executor and `:45` briefing |
| `ORCH_PROGRAM_WORK_FLOOR` | `2` | Non-deferral items in Ready for Dev below which T2 authors more |
| `ORCH_MAX_IN_DESIGN` | `1` | Concurrent In Design issues the lane may hold |
| `ORCH_PROMOTE_BATCH_MAX` | `5` | Promotions per run; caps blast radius of a parsing bug |
| `ORCH_HEALTH_SWEEP_HOUR` | `6` | Local hour after which the daily T3 sweep runs once |
| `ORCH_STALLED_PICKUP_THRESHOLD` | `3` | Claims without a merge before an issue is surfaced as stalled |
| `ORCH_ESCALATION_CHANNEL` | Discord `1530183488333152287` | Non-blocking question channel |

## Tracing

Tracing: N/A — the lane runs outside the tick loop and emits no engine trace; `emitTrace` is not reachable from a scheduled-task context. Its audit trail is the dated report plus Linear history, specified below.

No engine traces — the lane runs outside the tick loop. Its audit trail is the dated report plus Linear's own history, and every promotion records its reasoning:

```
[orchestrator] T1 promote THR-XXX: blockers THR-AAA(Done), THR-BBB(Done) → Ready for Dev, priority 2 (program: <name>)
[orchestrator] T1 skip THR-YYY: blocker THR-CCC still In Dev
[orchestrator] T3 new finding: <detector> — <summary>
[orchestrator] escalate THR-ZZZ: <question> → Discord; item parked, continuing
```

Every line names the issue and the evidence, so a wrong promotion is diagnosable after the fact rather than mysterious.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Linear unreachable | Skip promotion entirely; note in report; next run reconciles |
| `save_issue` returns 200 but state unchanged (impediment #48) | Re-query after every write; on mismatch, log and leave for next run — never assume |
| `Blocked by` unparseable or names a non-existent issue | Skip that issue, log the line verbatim; never promote on an unread dependency |
| A detector script fails or times out | Record "detector unavailable this sweep" in the report; never report a failed detector as a clean result |
| Discord unreachable | Note in report; item stays parked; next run retries |
| `keep-work-flowing-cc` report link missing | Report still written to `Docs/ops/`; loud line so the gap is visible rather than silent |
| Agreed work exhausted | Stop, ask, do nothing else — explicitly not a fall-through to un-agreed work |

## Three-pillar check

- [x] Engine pillar — N/A with rationale (automation lane, no tick-loop contact)
- [x] Content pillar — N/A with rationale (schedules authoring, authors nothing)
- [x] UI pillar — N/A with rationale (report-only; a dashboard would violate the chat-only interface)
- [x] Wiring section connects them

## Interface impact

Interface impact: N/A — no cross-system read or write named in `Docs/canon/interface-map.md` is added, retired or rerouted. The lint's conditional warning matched lexically on the words *Mandate*, *Attachments* and *Hidden Marks* appearing in this doc's prose; none refers to those subsystems (here "mandate" means the ways-of-working authority clause). No contract row and no entry in `scripts/interface-contracts.ts` changes.

## Vision audit

- [x] This plan does not contradict any Vision premise — it touches process, not the game
- [x] No Vision edit is required, so none is in scope for this ticket

## Rulebook impact

- [x] This plan changes no rule of play — no turn structure, action verb, prerequisite, resource, encounter, clock, or win/loss condition
- [x] `Docs/canon/rulebook.md` therefore needs no update in this PR

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every threshold named in the constants table; changing cadence or aggressiveness is changing a number |
| 2. Inspectability | PASS | Every promotion logs its issue, its blockers and their states; the dated report is the durable trail |
| 3. Determinism | N/A | No random selection — ordering is by existing priority, deterministic given board state |
| 4. Fail-soft | PASS | See fail-soft table; every failure degrades to "skip and report", never to a wrong promotion |
| 5. Narrative over mechanical perfection | N/A | No narrative surface |
| 6. Additive over destructive | PASS | New lane; no existing task modified except the verified `keep-work-flowing-cc` report link (Slice 5) |
| 7. Performance budget | PASS | T1 is a handful of Linear queries; the expensive tiers are rate-limited by `ORCH_PROGRAM_WORK_FLOOR` and the daily T3 gate |

## Done when

- [ ] Slice 1 merged: `Docs/ways-of-working.md` carries the initiative mandate
- [ ] `tb-orchestrator` registered, with its registry row (cron **and** observed fire time) and its prompt mirror under `Docs/ops/scheduled-task-prompts/`
- [ ] T1 demonstrably promotes: a `Todo` issue whose `Blocked by` are all Done reaches `Ready for Dev` in a live run, verified by re-query, with the reasoning line in the report
- [ ] T1 demonstrably *declines*: an issue with an unmet blocker is skipped, and the report says which blocker
- [ ] T3 writes a dated report with a `## Needs Christian` section, and that section is **proven** to reach `Design/briefing.md` (Slice 5)
- [ ] Escalation proven non-blocking: a parked item does not stop the run
- [ ] `npm test` and `npx vite build` pass; `npm run check:typecheck` shows no increase
- [ ] Closing commit body includes `Fixes THR-826`
- [ ] `Browser-verify exempt: automation lane, no UI surface` stated in the commit body

## Coordination block

**Suggested model:** `opus` — the lane exercises judgement about what work means; advisory only, CC runs Opus regardless.

**Parallel-safe with:** any game-content or engine ticket — this touches only `Docs/`, `.claude/skills/`, and the out-of-repo scheduled-task tree.

**Mutex with:** any ticket editing `.claude/skills/keep-work-flowing-cc/SKILL.md` (Slice 5 may edit its report-reading step) or `Docs/ops/scheduled-tasks-registry.md` (both add rows).

**Files to touch:**
- Create: `.claude/skills/orchestrator/SKILL.md`
- Create: `C:\Users\chris\.claude\scheduled-tasks\tb-orchestrator\SKILL.md` (live prompt, out of repo)
- Create: `Docs/ops/scheduled-task-prompts/tb-orchestrator.md` (mirror)
- Edit: `Docs/ways-of-working.md` (mandate — already in this PR)
- Edit: `Docs/ops/scheduled-tasks-registry.md` (registry row)
- Edit: `.claude/skills/keep-work-flowing-cc/SKILL.md` (only if Slice 5 finds the report link missing)

## Notes for the executor

- **Slice 1 is shippable alone.** If the lane itself stalls, land the mandate anyway — it is the authorising act and has standalone value.
- **Do not give this lane the WIP slot.** It never claims an issue and never sets `In Dev`. The executor owns the single slot; an orchestrator that claims work starves the thing it exists to feed.
- **Do not write `Design/briefing.md` or `Design/user-actions.md`.** Hard rule — a second writer produces merge conflicts. Own report + `## Needs Christian`, surfaced via the briefing.
- **Do not nominate features as unfun.** Christian initiates those dialogues from a gameplay point of view (D6 case 3). Redundant/unused/unreachable *is* yours to raise, unprompted and continuously.
- **Slice 5 is the one most likely to be quietly skipped, and it is the one that decides whether any of this reaches him.** Verify the briefing actually consumes sibling reports. If it does not, this plan has reproduced the exact defect it was written to fix, one layer over.
- **The redundancy half of T3 is genuine judgement, not a script.** Do not ship a reachability sweep and label it a redundancy detector — that would be a green check on an uncovered condition, the pathology this repo has logged eleven times in four days.
- Scope traps already decided, do not re-litigate: no `agreed` label (deliberately overruled), no blocking escalation, no promotion of un-agreed roadmap items, no second priority mechanism.

## Forked-audit verdicts

<!-- populated by design-audit-pipeline — /design-audit Docs/plans/2026-07-27-thr-826-orchestrator-lane.md -->
<!-- Not yet run: this plan was authored in an interactive session at Christian's direction. -->

### NFP audit

<!-- NFP-auditor verdict (≤300 words) inserted here by orchestrator -->

### Three-pillar audit

<!-- Pillar-auditor verdict (≤300 words) inserted here by orchestrator -->

### Vision audit

<!-- Vision-auditor verdict (≤300 words) inserted here by orchestrator -->
