# Orchestrator — 2026-07-31 (run j, ~17:38Z)

## Needs Christian

Nothing needs you right now. The encounter-slice map (Encounter experience redesign) is still waiting on its own machinery: 4 of the 5 chosen encounters are stuck behind PR #1132 (the Fable golden-exemplar branch) merging, which is a CI/merge-mechanics thing, not a decision for you. The verdict session ([Slice verdict session](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-the-five-verdicts)) is still blocked behind the readiness check, so there's nothing to play yet.

## T1 — unblock sweep

**Promoted THR-921** ([Promotion-time plan-doc liveness gate](https://linear.app/threadbare/issue/THR-921/promotion-time-plan-doc-liveness-gate-ready-for-dev-requires-the-named)) — no blocker named, fully-specified process fix (predicate + touch points already named in the description), no design pass needed. Coordination block already present as a comment; reaffirmed with promotion evidence in a new comment.

**Shelf was 53 items deep** at scan time (well over the 15-item backed-up threshold), so this run's promotion batch was capped at **1** per the ceiling rule. Declined/held, one line each:

- **THR-916** (impediment-dashboard.html generated-artifact conflict) — needs a design pass (three candidate approaches listed, none chosen) → route to T2, not promotable as-is.
- **THR-735** (armed-PR staleness sweep race) — needs a design pass (four candidate remedies, "do not pick one from this ticket alone") → route to T2.
- **THR-866** (`encounter.apotheosis.ascension` REWRITE) — description states explicitly "appropriate for a design-session pass" → route to T2.
- **THR-790 / THR-791** (Traits waves 2 & 3) — blocker THR-786 is Done, but both explicitly state "needs its own design finalization before Ready for Dev" / "needs a full design pass" → wrong destination, not a blocker gap.
- **THR-838, THR-778, THR-772, THR-789** — container/tracker issues that explicitly stay in Todo ("do not implement from it directly") or are program epics with no directly-actionable body.
- **THR-848, THR-855, THR-856, THR-858, THR-859, THR-861, THR-863, THR-864, THR-875** (all WS5 Batch 1 sub-batches + Meeting Batch A) — **hard-blocked by THR-883** (Fable encounter-writing prototype, still `In Design`). Christian's directive (chat, 2026-07-30): all content migration paused until the format is re-locked. Confirmed via THR-848's own PAUSED comment and THR-883's current status.
- **THR-870** (Sphere-governance pivot) — explicitly parked: "activate only when Christian moves the project out of Idea."
- **THR-175** (UI overhaul 08, agent.sphere field) — DEFERRED, unblock trigger (creation-sphere content shipping, or a template needing `sphere` as an axis) not met.
- **THR-906, THR-902, THR-907** — `wayfinder:*` labels, out of scope for T1 by definition; handled under T1.5 below.

## T1.5 — wayfinder sweep

One open map: [Encounter experience redesign — vertical slice](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map). Frontier: THR-906 (`wayfinder:task`, unblocked — THR-905 and THR-904 both Done) and THR-907 (`wayfinder:prototype`, HITL, but still blocked by THR-906 so not yet on the frontier).

**Claimed and worked THR-906** ([Slice-readiness gap check](https://linear.app/threadbare/issue/THR-906/slice-readiness-gap-check-for-the-chosen-roster)) — partial progress, left open/unassigned rather than closed:

- Checked PR #1132 (carries picks 2–5 of the roster): still `OPEN`, `mergeStateStatus: BLOCKED`, CI pending. Picks 2–5 (The Unsafe Bridge, Snow on the Pass, A Bargain at the Crossroads, The Swindled Family) are not spawnable on `main` this run.
- Started the dev server, spawned pick 1 (**Shrine Offering**, live on `main`) via `window.__DEBUG.spawnEncounter`. It fired and rendered correctly — **and surfaced a real, confirmed defect**: the card shipped literal unsubstituted `{actor}`/`{they}`/`{They}` placeholder tokens in player-facing prose (step narrative, factor line, two nudge-card fiction fields).
- Traced the root cause in source: `buildNudgePhaseModel.ts` never calls `enrichProse` on any nudge-card field (zero occurrences, confirmed by grep), and separately `{actor}` isn't a token `enrichProse` recognizes at all (it only knows `{name}`). Measured 28+ affected fields in `encounter-content.ts` alone.
- Filed **[THR-923](https://linear.app/threadbare/issue/THR-923/nudge-card-prose-never-passes-through-enrichprose-theyactor)** (Ready for Dev, Encounter Experience project, full coordination block) per THR-906's own instruction — this is a systemic Nudge Model rendering gap, not a one-off content typo, and worth fixing regardless of how THR-883 resolves.
- Left THR-906 open and unassigned — its Done-when ("all 5 roster encounters spawn and play clean") can't be honestly claimed with 4/5 unreachable this run. Posted the interim findings as a comment so the next AFK pass (once PR #1132 merges) can pick up cleanly: confirm the merge, spawn picks 2–5, go back and confirm Shrine Offering's world-graph consequence (not checked this run), and re-verify against THR-923's fix once it lands.

No HITL frontier to surface this run — THR-907 stays blocked behind THR-906's remaining work.

## T2 — design authoring

Not triggered. Non-`Deferral` items in Ready for Dev: ~23 (well above the floor of 2), even after this run's promotion. The candidates that surfaced a genuine "needs design" flag this run (THR-916, THR-735, THR-866, THR-790, THR-791) are noted above for a future T2 pass, but the shelf is nowhere near thin enough to trigger one now.

## T3 — architecture health

Already ran today (run c, ~06:29 local / 04:29Z). Not repeated per the once-daily cadence.

## Escalations

None this run — no Discord questions needed. The PR #1132 merge is a mechanical CI-wait, not a decision, so it isn't escalated.
