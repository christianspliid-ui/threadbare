---
lane: tb-orchestrator
run: 2026-08-08f
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-08-08 (run f, ~16:30Z)

## Needs Christian

Nothing new — the demo-readiness update from run e still stands (waiting on four small fixes before the verdict sessions).

## T1 — unblock sweep

Scanned Todo (28 items) and Ready for Dev (31 items pre-sweep, 5 non-`Deferral`).

**Promoted THR-1038** (15 mercenary-company templates carry a mistyped `aftermathConfig`, throwing silently on every resolve) → `Ready for Dev`. No named blocker — its own description already carried a full coordination block ending `Blocked by: nothing`, the same shape as THR-989/THR-1012 which reached `Ready for Dev` directly at filing. This one had been left one hop short in `Todo`; T1 closed the gap and posted the coordination-block comment `pull-work` requires. Verified via re-query — state stuck, no `assignee` key present.

Re-confirmed the standing declines, unchanged since run e:
- **THR-883 still `In Design`** (`updatedAt` now 10:59Z, no state change) — continues to gate the whole WS5/content family: THR-838, 848, 855, 856, 858, 859, 861, 863, 864, 866, 778, 875.
- **THR-790, THR-791** — both explicitly state "Needs its own design finalization before Ready for Dev" / "Needs a full design pass" in their own text. THR-790's named blocker THR-786 is `Done`, but a met blocker doesn't waive the ticket's own design-first declaration (T1 rule: route to T2, don't promote).
- **THR-1002** — read in full this run: explicit "This is a design ticket — it needs a plan doc before code," with THR-998 folded into its open question. Declined, T2's input.
- **THR-998** — checked its latest comment directly: filed in `Todo` *deliberately*, with a comment stating "wants the orchestrator's T2 scoping pass before it is claimable." Declined on its own instruction, not promoted.
- **THR-1024** — still blocked: THR-966 checked directly, still `Idea`.
- **THR-961, THR-962, THR-870, THR-175** — standing Christian-gated/parked, unchanged.
- **THR-772, THR-778, THR-789** — epic/container issues, no direct Done-when.
- **THR-902, THR-907, THR-974, THR-986** — wayfinder-labeled, T1.5's remit, not T1's.

Ready for Dev held 31 items pre-sweep (>15 threshold) — ceiling would cap at 1 regardless; moot, since only one candidate qualified.

## T1.5 — wayfinder sweep

One open map: [Encounter experience redesign — vertical slice](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map). Recomputed the frontier: unchanged from run e. THR-986 (`wayfinder:task`) is still assigned (claimed by a prior run) and still blocked — its native `blockedBy` list now carries 13 items (THR-1033–1037 from run e's failed resolution attempt, plus THR-1003/1004/1005/923/973/978/979/1008, none `Done` yet) — so it is not a frontier candidate this run, claimed or otherwise. THR-974 and THR-907 (`wayfinder:prototype`, HITL-only) remain the only other open children; both already surfaced to Christian in run e's report, no new information this run.

## T2 — design authoring

Not triggered. Ready for Dev holds 5 non-`Deferral` program items (THR-1031, THR-951, THR-952, THR-950, THR-867) — above the floor of 2. (Note: THR-1030, counted as non-`Deferral` in run e, no longer appears in Ready for Dev — it shipped/moved between runs, not this lane's doing.)

## T3 — architecture health

Already run today (run a, ~07:10Z — all four detectors). Not re-run; daily, not per-run. Weekly test-suite health pass not due (today is Saturday, not Monday).

## Escalations

None this run.
