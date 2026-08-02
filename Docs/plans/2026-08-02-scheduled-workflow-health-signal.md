> **title:** `Scheduled-workflow health signal — making a silently red lane loud — THR-834`
> **linear_issue:** THR-834
> **author:** `Claude Code`
> **created:** 2026-08-02
> **three_pillars:** Engine `N/A — reads Actions metadata and the workflow directory; touches no tick-loop or src/ runtime path` · Content `N/A — no encounters, prose, templates or data` · UI `N/A — a CLI probe and an hourly markdown brief; renders nothing`

# Scheduled-workflow health signal — making a silently red lane loud — THR-834

*A scheduled workflow can fail every run for six weeks and no surface anywhere says a word.*

## Why this is load-bearing

`Stale Claim Sweep` failed **88 out of 88 runs** between 2026-06-13 and 2026-07-26 — six weeks, twice daily, deterministically red. It was found only because an agent went looking with `gh run list`. `Weekly Drift Scan` was the same shape for four consecutive weeks (2026-06-26 → 07-17, THR-683), also found by accident, and its silence starved a downstream loop: the weekly retro consumes drift-scan-labeled issues as its first input.

Nothing read either failure, because **no lane reads scheduled-workflow conclusions at all**:

* GitHub emails the *actor* on a failed scheduled run. A scheduled run has no interactive actor, so the mail goes nowhere.
* `Test · Typecheck · Build` is the only workflow anyone watches, and only because it gates merges.
* `keep-work-flowing-cc` reads Linear, home-tree freshness, `check:deploy` and `check:task-heartbeat` — not Actions run history.

This is the mirror image of the THR-755 vacuous-green class. A gate whose **red** goes unread for 88 runs is exactly as decorative as a gate whose **green** means nothing, and the closing question for both is the same: *does anyone read this output?*

## Membership predicate (THR-688 rule A)

Every workflow in `.github/workflows/` carrying a `schedule:` trigger. As of 2026-08-02 that is `drift-scan.yml` and `stale-claim-sweep.yml` — but the predicate binds, not the pair. Membership is **derived from the tree on every run** by `findScheduledWorkflowFiles()`, so a lane added later is covered the day it lands. A hardcoded list would rot the first time someone adds a workflow, and rot silently, which is the exact failure this probe exists to end.

## Engine pillar

N/A. No simulation surface, no tick phase, no graph node.

## Content pillar

N/A. No encounters, prose, templates or data tables.

## UI pillar

N/A for the game viewport. The reader surface is `Design/briefing.md` — chat/markdown, not a rendered component — so no browser evidence is owed and none is claimed.

## Wiring

| Surface | Change |
|---|---|
| `scripts/check-workflow-health.ts` | New probe. Pure `classifyWorkflowHealth()` + fail-soft IO layer, mirroring `check-deploy-health.ts`. |
| `package.json` | New `check:workflows` script, alongside `check:deploy`. |
| `keep-work-flowing-cc` step 2.6 | Consumer. Reads `--json`, puts `summary` verbatim into `## Needs Christian` when `needsChristian`. Edited in both the live prompt and its `Docs/ops/scheduled-task-prompts/` mirror. |
| `scripts/__tests__/check-workflow-health.test.ts` | 21 tests over the pure surface and the membership predicate. |

Checked against `Docs/plans/wiring-checklist.md`: no entry is owed. The checklist governs engine modules called from the orchestrator, modals rendered in `GameView` JSX, `GameState` fields consumed by UI, and emitted traces — this change adds none of those. The precedent is explicit rather than assumed: neither `check-deploy-health.ts` (THR-785) nor `check-actions-health.ts` appears in the checklist or in `Docs/canon/interface-map.md`, because an ops probe is not a cross-system read inside the simulation.

## Constants table

| Constant | Value | Why this value |
|---|---|---|
| `WORKFLOW_RUN_LOOKBACK` | 5 | Five spans five weeks for a weekly lane, two and a half days for a twice-daily one. A **run count, not a duration** — a duration window cannot serve both cadences, since 48 hours is six slots for one and zero for the other. |
| `MIN_RUNS_FOR_ALL_RED` | 2 | At 1, every isolated flake pages a human. At 2, both motivating cases still fire inside the first day (twice-daily) or the first fortnight (weekly), against the six and four weeks they actually took. |
| `RED_CONCLUSIONS` | `failure`, `timed_out`, `startup_failure` | Conclusions that mean the lane did not do its job. |
| `GREEN_CONCLUSIONS` | `success` | One green clears the alarm. |
| `DISABLED_STATES` | `disabled_manually`, `disabled_inactivity` | GitHub is not running the schedule at all. |
| `GH_REPO` | `christianspliid-ui/threadbare` | Matches `check-deploy-health.ts`. |

## Why only `event=schedule` runs are judged

A `workflow_dispatch` run is a human poking the workflow by hand. It proves the *code* works; it does not prove the *schedule* fires — and the schedule is what died in both motivating cases. Counting a manual green would let one debugging dispatch mask an unbroken run of scheduled reds, which is the precise shape of the bug being fixed.

## The three-way split, and why it is the whole subtlety

The ticket calls this out explicitly, and it is what separates a useful alarm from one the reader learns to ignore:

| verdict | meaning | needs a human |
|---|---|---|
| `healthy` | at least one scheduled run in the window concluded green | no |
| `all-red` | every conclusive scheduled run failed (≥ `MIN_RUNS_FOR_ALL_RED`) | **yes** |
| `never-run` | no conclusive scheduled run in the window | no — a fresh weekly lane is not a defect |
| `disabled` | GitHub is not running the schedule | **yes** when disabled for inactivity; no when disabled by hand |
| `unknown` | probe could not determine state | no (fail-soft) |

Two traps the split avoids. A workflow with zero runs is **not** a failure. And GitHub auto-disables schedules on repos idle for 60 days — collapsed into a green/red split that would read as a silent all-red, producing exactly the false alarm that teaches a reader to skip the section.

A third: `disabled` outranks run history. A workflow GitHub has stopped running may still carry five green runs on record, and reading those as health would hide a dead lane behind its own good past.

## Tracing

No `traceBuffer` category. This probe runs outside the tick loop and emits nothing into the simulation's causal trail; adding a trace category for a CLI script would put ops telemetry into the player-facing inspection surface.

Its inspectability obligation (NFP #2) is met in its own output instead, and deliberately: the non-JSON mode prints the per-workflow verdict **and the raw conclusion list** that produced it, so a reader can check the judgment by eye rather than trusting the label. A verdict that cannot be audited from its own output is how an alarm loses its reader, which is the failure mode this whole ticket is about.

```
[workflow-health] verdict=<v> needs-christian=<yes|no> [before=<iso>]
[workflow-health]   <file>: <verdict> [<conclusion>,...]
[workflow-health] <plain-language summary>
```

An unparseable `--before` adds one `[workflow-health] warn:` line, so silently judging the wrong window is impossible.

N/A — no `emitTrace` call: the probe runs outside the tick loop and has no `GameState`, so there is no trace buffer to write to. The stdout lines above are the equivalent inspectability surface.

## Fail-soft table

| Failure | Behaviour |
|---|---|
| `gh` missing, network down, auth failure | `unknown`, exit 0 |
| `.github/workflows/` unreadable | `unknown`, exit 0 |
| One workflow's run history unfetchable | that workflow `unknown`; the others still judged |
| Unparseable `--before` value | warn once, ignore the flag, continue |
| Unreadable individual workflow file | skipped, rest of the directory still scanned |

The probe never exits non-zero without `--strict`. It must never be the reason an hourly brief fails.

## Verification — pointing it at a known-red history

`--before <ISO>` judges only runs created before a cutoff, so the probe can be aimed at real history rather than a fixture. The Done-when asks for exactly this. Measured 2026-08-02:

```
# Today — both lanes recovered
[workflow-health] verdict=healthy needs-christian=no
[workflow-health]   drift-scan.yml: healthy [success,success,failure,failure,failure]
[workflow-health]   stale-claim-sweep.yml: healthy [success,success,success,success,success]

# Before THR-804's fix — the 88-of-88 reference case
$ npm run check:workflows -- --before 2026-07-28T00:00:00Z
[workflow-health] verdict=all-red needs-christian=yes
[workflow-health]   stale-claim-sweep.yml: all-red [failure,failure,failure,failure,failure]

# Before THR-683's fix — the drift-scan streak
$ npm run check:workflows -- --before 2026-07-17T00:00:00Z
[workflow-health] verdict=all-red needs-christian=yes
[workflow-health]   drift-scan.yml: all-red [failure,failure,failure,failure,failure]
[workflow-health]   stale-claim-sweep.yml: all-red [failure,failure,failure,failure,failure]
```

Both historical failures fire; today reads healthy. `--strict` exits 1 on the red windows and 0 today.

## NFP-compliance table

| NFP | How |
|---|---|
| 1. Tunability | Every threshold is a named exported constant with a stated rationale — window, alarm floor, and all three conclusion sets. |
| 2. Inspectability | Non-JSON output prints the per-workflow verdict *and* the raw conclusion list, so the judgment can be checked by eye rather than trusted. |
| 3. Determinism | `classifyWorkflowHealth()` is pure — no clock, no IO, no network. All 21 tests drive it directly; `--before` makes a historical window reproducible. |
| 4. Fail-soft | Table above. Advisory by default; `--strict` is opt-in; no failure path exits non-zero without it. |
| 5. Narrative over mechanical perfection | N/A — an ops probe tells no story. The nearest obligation is THR-608 plain language, met: `summary` is written for Christian ("has failed every one of its last 5 scheduled runs"), not in Actions vocabulary. |
| 6. Additive over destructive | New file, new test file, one npm line, one inserted prompt step. No existing behaviour changed, nothing removed. |
| 7. Performance budget | Three `gh` calls per run (one workflow list, one run list per scheduled workflow) on an hourly lane. No profiling warranted; the cost is bounded by the membership predicate, which is 2 today. |

## Interface impact

N/A — no cross-system read or write named in `Docs/canon/interface-map.md` is added, retired or rerouted, and `scripts/interface-contracts.ts` is unchanged. The probe consumes the GitHub Actions HTTP API and the workflow directory; it participates in no in-simulation contract. The lint's subsystem match is a keyword false positive from prose in this document.

## Three-pillar check

Infrastructure-only by nature. The three-pillar rule exists to stop half-built *features* shipping; an observability probe has no player-facing half to omit.

- [x] **Engine** — N/A: no tick phase, orchestrator, graph node or edge type, and nothing under `src/`
- [x] **Content** — N/A: no encounters, prose, templates, attachments or content tables. The only authored strings are the probe's plain-language summaries, written for THR-608
- [x] **UI** — N/A: a CLI command and a markdown line; no component, view, HexMapV2 surface or `index.css`, so no browser evidence is owed (THR-688 rule C)
- [x] **Infrastructure** — the whole of the change: one script, one test file, one npm script, one skill step in two copies
- [x] Each N/A carries a one-line reason in its own section above, per the Three-Pillar Rule's exit criteria

## Vision audit

- [x] No conflict with `game-design-direction` — the probe is operator tooling and never appears in the player's world
- [x] Touches no Reach, Sphere, Quintessence, ascendant capability, or narrative surface
- [x] Introduces no rejected approach from `reference/deprecated.md`
- [x] Serves the gate-credibility principle (THR-755) rather than merely adding a check: the probe stays **silent when healthy**, because an hourly "all fine" line would satisfy the letter of "surface the verdict" while producing exactly the habituation that let 88 red runs pass unread

## Rulebook impact

- [x] No rule of play changes — no turn structure, action verb, prerequisite, resource, encounter, clock, or win/loss condition
- [x] `Docs/canon/rulebook.md` and `rulebook-quick-reference.md` need no edit

## Done when

- [x] A probe reports, per scheduled workflow, a verdict distinguishing `healthy` / `all-red` / `never-run` / `disabled` over a named window, with the window as a tunable constant.
- [x] `keep-work-flowing-cc` surfaces a non-healthy verdict into `Design/briefing.md` in the hour it appears (step 2.6, live prompt + repo mirror).
- [x] Verified against a workflow with a known-red history — both `Stale Claim Sweep` (88/88) and `Weekly Drift Scan` (THR-683) fire.
- [x] Accepted via CLI output; no browser evidence, no UI-pillar surface touched.

## Coordination block

**Suggested model:** sonnet — self-contained probe following an established sibling.
**Files to touch:** `scripts/check-workflow-health.ts` (new), `scripts/__tests__/check-workflow-health.test.ts` (new), `package.json` (one script line), `Docs/ops/scheduled-task-prompts/keep-work-flowing-cc.md` **and** the live prompt at `~/.claude/scheduled-tasks/keep-work-flowing-cc/SKILL.md` (both, same PR — the live prompt is outside version control and the mirror is the tracked copy, so editing either alone is a no-op or gets reverted by the next mirror audit).
**Parallel-safe with:** everything. Two new files, one npm line, one inserted prompt step.
**Mutex with:** none — `scripts/check-workflow-health.ts` and its test are new files that no other ticket can be editing; `package.json` gains one line in a block with no other In-Dev claimant; and neither In-Dev issue at claim time (THR-946 merge queue, THR-860 civic-seat content) touches `keep-work-flowing-cc`'s prompt.

## Notes for the executor

The alarm is deliberately *quiet by default*. `keep-work-flowing-cc` says nothing at all when the verdict is healthy — a probe that reports "all fine" every hour is how a reader stops reading. It speaks only when a lane is dead.

If a third scheduled workflow lands, nothing needs doing: membership is derived from the tree. If a lane is retired by commenting out its `schedule:` block, `hasScheduleTrigger()` will correctly stop counting it — comments are stripped before the scan precisely because that is the shape a hand-disabled lane leaves behind.

## Forked-audit verdicts

Not run. `design-audit-pipeline` forks its three auditors at a design session's plan-doc finalization, before a Ready-for-Dev handoff; this doc was written by the executing session alongside the implementation it describes, so there was no pre-implementation artifact to audit. The three dimensions are discharged in-document instead, and the NFP table, three-pillar check and Vision audit above are those sections.

One residual is recorded rather than resolved, since it is the judgment most likely to need revisiting: **`WORKFLOW_RUN_LOOKBACK = 5` and `MIN_RUNS_FOR_ALL_RED = 2` are reasoned, not measured.** No production data exists on this probe's false-positive rate because nothing has ever read this signal — that absence is the ticket. If a healthy lane starts tripping `all-red` on a transient infrastructure wobble, raising the floor is a one-number change (NFP #1), which is why both are exported constants rather than literals.
