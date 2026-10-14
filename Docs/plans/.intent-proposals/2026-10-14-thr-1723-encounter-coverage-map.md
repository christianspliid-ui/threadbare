# Action proposal — 2026-10-14-thr-1723-encounter-coverage-map

## intent_quote

> "use the TypeSafe skill for content categorization runs and audits as the content corpus grows" — Christian, 2026-10-04 (quoted in the THR-1723 description, filed from an attended session)

> Ticket Done-when (Christian-filed): "A plan doc in `Docs/plans/` covering the five decisions above [taxonomy source; question design; relation to the existing tag census; output shape, location and rollup surface; calibration method], passed through intent-judge and the design-audit pipeline, with this ticket handed to Ready for Dev with a coordination block. The implementation Done-when the plan doc should carry is CLI/headless evidence (THR-688 rule C): one full run over the Encounter kind producing the persisted artifact, the measured cost line, and a hand-checked sample agreeing with the judgments at the plan's stated rate."

> Agreed outcome (ticket): "An **offline** categorization run over authored content whose judgments are persisted as a reviewable artifact. **The first run is an encounter coverage map**: every Encounter-kind entry … judged for theme, Reach and Sphere fit, rolled up so the crowded and the missing cells are visible and can feed what gets authored next."

## scope (what this plan does)

Designs the first shared Jev runner: an offline `scripts/` tool that judges every Encounter-kind entry (567 today) for Reach, Sphere, Activity and Walk of life, plus tag fit on worn family tags, from a blind prose-only state. It persists answers with probabilities to an `ops`-branch JSON artifact, cached by content hash, and renders a rollup report (grids, declared-vs-judged Reach, four finding classes, review worklist) on `ops`. It specifies a 64-entry blind-reader calibration that sets thresholds. It splits the build into slice A (runner, verifiable without a key — this ticket) and slice B (the first paid run + calibration + finding tickets — a new ticket blocked on Christian's key).

## scope (what this plan does NOT do — explicit non-goals)

- No engine, tick-loop, shipped-build or runtime use of TypeSafe.
- No edits to any content catalog, tag, or encounter; findings are never auto-applied.
- No new tags or taxonomy; a missing term goes via `UL-proposal`.
- No scheduled lane; runs are by hand until the cost line is measured.
- Does not design the mislabel audit or the voice audit (sequenced after, not scoped).
- No served wiki page / player UI.
- Does not fix the three `encounter.shell_proof.*` templates with non-Reach `reach` values (reported only).

## impact_class

Reversible — offline scripts, two skill-pointer edits, an `ops` artifact. Paid external calls happen only in slice B, are ~$0.10 per run and gated by a token ceiling.

## evidence cited

- **Linear issue:** THR-1723 (Content Architecture); orchestrator staging comment 2026-10-14 ~02:30Z
- **Vision premises invoked:** rejected approach "pure LLM-generated content" (CLAUDE.md § Rejected approaches) — the model never writes content
- **UL terms touched:** Encounter, Reach, Sphere, content tag / family axis — no new terms
- **Canon pages consulted:** `Docs/canon/content-objects.md` (+ `.generated.md`), `Docs/canon/cosmology.md`, `.claude/skills/encounter-pipeline/reference/content-tag-catalog.generated.md`, `.claude/skills/content-judgments/SKILL.md`, TypeSafe live docs (api, models, jev-1.13 jaggedness)
- **Prior plan docs this builds on:** `Docs/plans/2026-09-12-thr-1481-content-model.md` (content kinds and tag vocabulary)
- **Rejected approaches considered and dismissed:** free theme taxonomy; auto-applying backfills; artifact on `main`; served page; multi-entry requests (see brainstorm companion)

Measured on `main` @ 667869d2 with a scratch script over `entriesOfKind('encounter_template')`: 567 entries; 37 with `sphereAffinity`; 186 with `encounterType`; 107 wearing a family tag; 3 with reach outside the Eight; string text median 2,950 chars, max 36,996.

## load-bearing decisions touched

None. No graph, node type, edge, cache or engine module is involved. Offline-only respects NFP 3/4.

## high-impact files touched (from Codesight)

None edited. `src/data/contentCatalogs.ts` and `src/engine/content-eval/collectAuthoredProse.ts` are imported read-only by a script.

## kill criteria

- Calibration cannot reach 85% Reach agreement over at least half the 64-entry sample → the axis is reported uncalibrated, and the mislabel-audit follow-on waits on a better question or model.
- The first run's `walk_of_life = none` share is above 15% → the vocabulary question goes to a `UL-proposal` rather than into the runner.
- The measured cost line is far above the ~$0.10 estimate → the token ceiling refuses re-runs until the question set is trimmed.

## explicit user sign-off

N/A (Reversible).

## author notes for the judge

- Authored unattended by the design lane (tb-design-lane), which decides the five open questions under delegation and invites Christian's veto. Christian is chat-only (THR-608); hence the calibration "hand-check" is a blind reader subagent with persisted labels, not a human. That is the call most worth scrutinising.
- The build is split into two slices because `TYPESAFE_API_KEY` is unset on the home machine today (checked: process env and Windows User env both empty). The ticket's implementation Done-when (one full run) therefore lands on slice B, a new ticket blocked on the key.
- The walk-of-life subset of 17 family words is a judgement; the filter rule is stated and the list is a constant.
