# pull-work WIP=1 enforcement gap — Plan

**Date:** 2026-05-09
**Status:** Implementation Planning → Ready for Dev (CC, sonnet)
**Pillars touched:** Tooling / process (Engine N/A, Content N/A, UI N/A)
**Related:** THR-391 (Cowork session staleness gate), THR-392 (auto-generated ledgers). All three are part of the "keep main clean" campaign.
**Author:** Cowork

## Problem

The hourly CC and Codex automations sometimes pull a new ticket while a previous ticket from the same lane is still in flight (PR open, CI running, awaiting merge). This produces same-lane parallel In Dev work, which collides at merge time even when individual issues are well-formed.

User-stated cause (2026-05-09): "the code automation runs every hour, but the test suite itself is around 15 minutes. this means a new ticket is sometimes being pulled before the last one was merged to main."

User-stated constraint: "i can only choose between hourly or daily on automated routines. i can't set it to e.g. every 2 hours" — so cron-cadence tuning is not available as a fix; the gate has to be at the application layer.

## Root cause

The WIP=1 rule is **specified in the coordination protocol but not enforced in the pull-work skill**. Today:

- `Docs/plans/2026-04-13-linear-coordination-protocol.md` Rule 6 states: "WIP=1 across all sessions — confirm no other issue is In Dev under your assignee across all projects."
- The same protocol's CC Pickup Protocol (Step 4) and Codex Pickup Protocol (Step 4) both list "WIP check" as a required step.
- `.claude/skills/pull-work/SKILL.md` Step 1 computes the "In Dev assigned to me" slice with the annotation `— for WIP check`. But no subsequent step references that slice. No Refuses-To-Proceed-When entry mentions it.

Result: CC can correctly *compute* its own in-flight WIP and still pull new work, because the operational skill doesn't gate on the computed signal. The protocol says "do this," the skill says "here's the data," nothing says "and exit if non-empty."

The 15-minute test suite is not the cause — it's the time window that exposes the gap. With a sub-minute test suite, previous work would merge before the next hourly cron fires and the bug would never surface. With a 15-minute suite, the window is wide enough to expose it on every run.

## Goals

- Add explicit WIP=1 enforcement to `pull-work` skill so the cron correctly no-ops when the lane is busy.
- Apply the same gate to Codex pickup (the protocol says identical Hard Rules apply; the skill must too).
- Make the gate cron-cadence-independent. With Fix in place, hourly cron behaves as "run hourly, do work only when the slot is free" — exactly the "every 2 hours-ish" behavior the scheduled-task UI can't directly express.
- Don't reduce throughput unnecessarily. When the lane is genuinely idle, pickup runs as today.

## Non-goals

- Not Fix B (test-suite speed-up) — separate ticket; addresses root cause but is a multi-week project.
- Not Fix C (event-driven pickup) — separate ticket; reduces idle latency, only valuable layered on top of this fix.
- Not changing cross-lane parallelism. Sonnet + Opus + Codex can still each have one In Dev simultaneously; that's by design and bounded by the existing Mutex enforcement (Step 2 cross-executor parallel check).
- Not changing the cron cadence itself.

---

## Design

### Skill edit: add Step 1.5 to `.claude/skills/pull-work/SKILL.md`

Insert immediately after Step 1, before Step 2:

```
### Step 1.5 — WIP=1 gate (Rule 6 enforcement)

If the Step 1 board scan's "In Dev" slice filtered to `assignee:"me"` is non-empty, refuse pickup and exit cleanly. Output one of:

  [pull-work] Step 1.5: WIP=1 gate — already holding {issueId} (claimed at {claimedAt}, branch {gitBranchName}). Skipping pickup.

  [pull-work] Step 1.5: WIP=1 gate — multiple In Dev assigned to me ({issueIds}). Cross-session leak. Surface and stop.

If the slice has exactly one entry: this is a normal in-flight ticket; either CI is still running or the merge auto-close hasn't fired yet. Exit 0 — the next cron tick will check again.

If the slice has more than one entry: this indicates a Rule 6 violation (cross-session leak — Rule 6 says WIP=1 across all sessions). Output the surface message and exit 1 so the failure is visible in cron logs. Do not attempt to claim more.
```

Also update the **Refuses To Proceed When** section to include:

```
- The "In Dev" slice for the executor's own assignee (computed in Step 1) is non-empty (Rule 6: WIP=1 across all sessions).
```

### Coordination protocol edit: tighten Codex pickup

Update `Docs/plans/2026-04-13-linear-coordination-protocol.md` Codex Pickup Protocol Step 4 from:

> 4. **WIP check (Rule 6):** confirm no other issue is In Dev under your assignee across all projects. If you find one, finish or hand it off before claiming the next.

to:

> 4. **WIP check (Rule 6) — hard gate:** Query `list_issues(state:"In Dev", assignee:"me")`. If the result is non-empty, **exit cleanly without claiming.** Do not attempt to "finish" or hand off — the previous work is in flight (CI running or merge pending) and will resolve on its own. Surface a one-line cron log: `codex-pickup: WIP=1 gate — already holding {issueId}. Skipping pickup.` Same gate applies whether you have one or multiple In Dev issues; multiple indicates a leak and should also surface a Rule 6 violation note.

The CC Pickup Protocol (same doc, Step 4) gets the analogous edit.

### What the gate does NOT do

- Does not "abandon" or "release" the in-flight ticket. The previous work is in flight and will resolve normally — CI will pass or fail, the merge auto-close will or won't fire, the next hourly cron will check again.
- Does not reach into GitHub to inspect PR state. Linear "In Dev" is the source of truth: it transitions to Done on merge auto-close, and it stays In Dev for the entire push-to-CI-to-merge window. If a PR sits open for hours, the lane stays gated for hours. That's correct.
- Does not change Mutex enforcement. Mutex blocks operate at claim time on Ready-for-Dev candidates; this gate operates earlier and prevents claim entirely.

### Edge cases

| Case | Behavior |
|---|---|
| In Dev slice has 1 entry, branch was pushed days ago, CI is failing repeatedly | Gate fires, cron exits 0. The failing CI is a separate problem to surface — not this gate's responsibility. |
| In Dev slice has 1 entry, but the issue was abandoned (assignee left it stuck) | Gate fires. Manual intervention needed (hand off or release the issue). The gate does not force-release. |
| In Dev slice has 2+ entries | Gate fires with "Cross-session leak" error message. Exits 1 so the cron log shows red. Manual intervention needed. |
| In Dev slice empty, Ready-for-Dev empty | Step 1 returns nothing to claim; pickup naturally exits without engaging the gate. |
| In Dev slice empty, Ready-for-Dev has candidates | Gate passes; proceed to Step 2 normally. |
| Linear API returns error during the In Dev query | Treat as gate-fired (fail-safe — refuse to pull when state is unknown). Log impediment. |

### Constants

In the skill (descriptive, not code):

| Constant | Default | Purpose |
|---|---|---|
| `WIP_GATE_EXIT_CODE_SINGLE` | 0 | Single in-flight ticket is normal; exit clean |
| `WIP_GATE_EXIT_CODE_MULTI` | 1 | Multiple in-flight is a leak; exit red |

Constants live in the skill prose since the skill is markdown, not code. The Codex protocol gets the same numbers in its protocol section.

### Fail-soft

Gate failure modes:
- Linear API error during In Dev query → treat as gate-fired, exit 0, retry next cron
- Linear returns ambiguous state → treat as gate-fired
- Skill cannot read its own assignee identity → exit 0, log impediment

The gate is fail-safe in the "refuse rather than collide" direction — if uncertain about WIP state, do not claim.

---

## Three-pillar check

| Pillar | Status | Rationale |
|---|---|---|
| Engine | N/A | No engine code |
| Content | N/A | No content |
| UI | N/A | No game-UI surface — agent runtime tooling |

Same legitimate three-pillars-N/A pattern as THR-391 and THR-392.

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Two named exit-code constants; gate behavior described declaratively |
| 2. Inspectability | PASS | Gate fires with named log line; exit code distinguishes normal-skip vs leak-detected |
| 3. Determinism | PASS | Pure function of Linear state at query time |
| 4. Fail-soft | PASS | Linear API errors treated as gate-fired; never collide on uncertainty |
| 5. Narrative over mechanical | N/A | Tooling |
| 6. Additive | PASS | New step in skill, new bullet in Refuses-To-Proceed, edit to protocol Step 4 wording. No removed steps. |
| 7. Performance | PASS | Step 1 already computes the slice; gate adds one boolean check, sub-millisecond |

## Implementation phases

Single CC ticket, suggested as one or two commits:

1. **Skill edit** — add Step 1.5 to `.claude/skills/pull-work/SKILL.md`. Update Refuses-To-Proceed-When section. Bump `last_validated_against` frontmatter to today's date.
2. **Coordination protocol edit** — tighten CC Pickup Step 4 and Codex Pickup Step 4 in `Docs/plans/2026-04-13-linear-coordination-protocol.md` to "hard gate" wording. Both edits are surgical; do not rewrite surrounding steps.
3. **Doc closeout** — `project-status.md` update; `project-history.md` and `changelog.md` per current policy (will be auto-generated once THR-392 ships).
4. **Impediment log** — add a new entry to `Docs/impediments.md` capturing the cron-interval UI constraint that motivated this fix: "Scheduled-task UI exposes hourly and daily presets only — no intermediate intervals (e.g. every 2 hours). Workaround: enforce gating at the skill / protocol layer instead of the cron layer." Use the impediment-reporter skill format.

### Verification

- `npm test` clean
- `npx tsc --noEmit` clean
- `npx vite build` clean
- Manual smoke 1: simulate a busy lane — temporarily set a Linear issue to In Dev assigned to "me", invoke `/pull-work`, verify it exits with the WIP=1 gate message and does not claim
- Manual smoke 2: clear the simulated state, invoke `/pull-work`, verify pickup proceeds normally
- Manual smoke 3: re-read `Docs/plans/2026-04-13-linear-coordination-protocol.md` after edit and confirm Steps 4 of CC and Codex pickup are both hard-gate wording

Verification evidence required at closeout per Definition of Done.

---

## Coordination block

```
Suggested model: sonnet
Parallel-safe with:
  - Any work that does NOT touch .claude/skills/pull-work/SKILL.md
  - Any work that does NOT touch Docs/plans/2026-04-13-linear-coordination-protocol.md (Steps 4 of CC and Codex pickup)
  - All Engine / Content / UI tickets — process-only change
Mutex with:
  - Other changes to .claude/skills/pull-work/SKILL.md
  - Other changes to Docs/plans/2026-04-13-linear-coordination-protocol.md
  - THR-391 and THR-392 do NOT modify these files; this issue is parallel-safe with both
```

Required matching label: `model:sonnet`.

## Future work (separate tickets)

- **Fix B — test suite speed-up project** — profile the suite, two-tier fast/slow split, parallel sharding. Multi-week project. Addresses the underlying cause but is not blocking this fix.
- **Fix C — event-driven pickup** — replace hourly cron with on-merge trigger via GitHub Action. Best layered on top of this fix; reduces idle latency. Open if hourly cadence + WIP gate produces unacceptable wait times.
- **Codex queue equivalent** — once CC's pull-work skill enforces the gate, verify Codex's automation entrypoint also runs through the same skill or has its own enforcement. If Codex has a separate skill file, it needs the same edit.
- **WIP gate observability** — count gate-fires per day in a rolling log; surface as a metric so we can tell whether the gate is firing 0 times (no problem) or 50 times (chronic backpressure).
