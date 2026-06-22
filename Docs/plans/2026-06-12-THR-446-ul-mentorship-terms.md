# THR-446 — UL canonicalization: mentorship terms

**Date:** 2026-06-12
**Type:** Documentation (Ubiquitous Language hygiene)
**Origin:** THR-446 (closeout from THR-75 — Mentor/Apprentice Relationship Chains Phase 1, shipped 2026-05-15)
**Status:** Ready for Dev (handoff)

## Summary

Add seven net-new mentorship-domain terms to `Docs/ubiquitous-language/Agents.md`, with cross-shard `See also` updates where they touch Cosmology (Reach), Encounters (branching templates), and Process (initiative wrapper). Refresh `?view=ul` via the dashboard generator.

Pure documentation. No code, no schema changes, no test impact. Terms are already canonical in the codebase (`src/types/graph.ts` `MentorsEdgeProperties`, `src/data/mentorship-constants.ts`, `src/engine/mentorshipOutcomes.ts`); this issue just makes them canonical in the UL so subsequent content authoring matches what the engine produces.

## Three-pillar coverage

| Pillar | Status | Notes |
| --- | --- | --- |
| Engine | **N/A** | No engine code touched. Terms reference existing engine surface; no new interfaces, no schema diffs. |
| Content | **In scope** | Adds 7 (preferably 9 — see §3 expansion note) UL entries to `Docs/ubiquitous-language/Agents.md`. Cross-shard "See also" hooks updated in `Cosmology.md` (`Reach` ↔ `mentor domain`) and `Encounters.md` (`branching template` ↔ `mentorship.graduation`, `mentorship.the-falling-out`). |
| UI | **In scope** | After UL shard edits, run `npm run generate-ul-dashboard` to refresh `src/data/ul-dashboard.generated.json`. Verify `?view=ul` renders the new entries with the correct cross-shard See-Also chips. No new components, no layout changes. |

## Pillar 1 — Engine

N/A. The code references already exist and are stable as of 2026-05-15 (THR-75 ship date). If any reference drifts during execution (e.g., a constant renamed), prefer matching the UL entry to the current source rather than fixing source — UL is the terminology authority but lags code by design and this issue is the catch-up.

## Pillar 2 — Content (UL entries)

### Target shard

`Docs/ubiquitous-language/Agents.md`. Rationale: existing shard already holds `Agent`, `Actor`, `ActorType`, `Faction`, `Member Of`. Mentorship is a per-agent relationship; it belongs with the other agent-relational terms, not a new "Social" subshard. (Issue THR-446 left the placement question open; the maintainer convention has been "co-locate with the natural domain peer" — Agents wins on that basis.)

### Entries to add (7 from issue + 2 expansions for arc completeness)

Each entry follows the established shard schema (term heading, Aliases line, Also-see line, Status line, single-paragraph definition, optional second paragraph with code anchor).

1. **mentor** — agent at Domain Capability tier ≥ `MENTOR_MIN_TIER` (currently 6) in any Reach, on the source end of an active `mentors` graph edge. Cite: `src/data/mentorship-constants.ts:17`.
2. **apprentice** — agent at Domain Capability tier ∈ [`APPRENTICE_MIN_TIER`, `APPRENTICE_MAX_TIER`] (currently 2–4) in the taught Reach, on the target end of a `mentors` edge in `offered` or `training` phase. Cite: `src/data/mentorship-constants.ts:21,25`.
3. **mentors (edge)** — directed graph edge `mentor → apprentice`. Required properties per `edgeSchema.ts:156`: `domain` (ReachDomain), `progress` (0–1), `phase` (`offered` | `training` | `graduated` | `estranged`), `startedTick`, `lessonsCompleted` (0–4), `bondQuality` (−1..+1), optional `initiativeId`, optional `severedByDivineWill`. Canonical type at `src/types/graph.ts:156` `MentorsEdgeProperties`.
4. **bondQuality** — narrative-derived health of a mentor↔apprentice bond, clamped to `[-1, +1]`. Initial value `BOND_QUALITY_INITIAL = 0.0`. Drifts on backing-initiative checkpoints: `BOND_DRIFT_ON_SUCCESS = +0.15`, `BOND_DRIFT_ON_FAILURE = −0.20`. Decides the terminal arc at completion (see `Train Apprentice`, the arc terms below). Force-floored to `SEVER_BOND_QUALITY_FLOOR = −1.0` by the Sever the Bond divine action. Cite: `src/data/mentorship-constants.ts:47–55,94`.
5. **Train Apprentice** — initiative type `initiative.train-apprentice`, a multi-tick `social`-category initiative wrapping the mentorship. The `mentors` edge is the persistent relationship; the initiative is the occupation wrapper that drives `progress` toward 1.0 over `MENTORSHIP_BASE_DURATION ± MENTORSHIP_DURATION_VARIANCE` (currently 8 ± 3) ticks, with `MENTORSHIP_CHECK_INTERVAL`-tick checkpoints. Apprentice straying beyond `MENTORSHIP_MAX_SEPARATION_HEXES` hexes fails it. Cite: `src/data/mentorship-constants.ts:29–41`.
6. **The Surpassing** — terminal mentorship arc when, at `progress ≥ 1.0` AND `bondQuality ≥ GRADUATION_BOND_THRESHOLD`, the apprentice's tier in the trained domain meets or exceeds the mentor's by `SURPASSING_TIER_DELTA` (currently 0 — equal-or-greater triggers). Bittersweet: pride + loss in the same breath. Resolved via `mentorship.graduation` encounter seed with the `mentorship_surpassing` flavor in Phase 1; gets its own template `mentorship.the-surpassing` in Phase 2. Cite: `src/engine/mentorshipOutcomes.ts:82–88`.
7. **Falling Out** — terminal mentorship arc when `bondQuality < FALLING_OUT_BOND_THRESHOLD` (currently −0.3) at resolution time. Cool failure: seeds `mentorship.the-falling-out` encounter and creates a `hostile_to` edge if sentiment is below `HOSTILE_THRESHOLD` (−0.6), or a negative `relates_to` otherwise. Apprentice retains `FALLING_OUT_TRANSFER_FRACTION` (currently 0.5) of the partial Mastery gain. Cite: `src/engine/mentorshipOutcomes.ts:89–90, 182–204`.

**Expansion (worth adding — code already has them, and the issue description names them):**

8. **Quiet Parting** — terminal mentorship arc when `progress < 1.0` AND `bondQuality` is between `FALLING_OUT_BOND_THRESHOLD` and `GRADUATION_BOND_THRESHOLD`. The default "neither great nor terrible" outcome. Cite: `src/engine/mentorshipOutcomes.ts:92, 218`.
9. **Dissolution** — terminal mentorship arc when the backing `train-apprentice` initiative status is `failed`. Bond dissolved by external cause (death, exile, separation beyond tolerance). Cite: `src/engine/mentorshipOutcomes.ts:79–80, 241`.

The executor SHOULD add all nine. Rationale: 6 and 7 only make sense relative to 8 and 9 (the four-arc decision table). Adding just 6 and 7 produces a UL gap that the next content author will discover.

### Cross-shard See-Also updates

- `Docs/ubiquitous-language/Cosmology.md` — under `Reach` (or the canonical reach term entry), append `[[mentor]] (domain-specific teaching)` to See-also.
- `Docs/ubiquitous-language/Encounters.md` — under `branching template` (or the canonical branching-encounter entry), append `[[mentorship.graduation]]`, `[[mentorship.the-falling-out]]` to See-also.
- `Docs/ubiquitous-language/Process.md` — only if a `// TODO(THR-76)` orphan hook reference is present and accurate; check before adding. Issue description names this but it is not load-bearing — skip if the hook has since been resolved.

## Pillar 3 — UI (dashboard refresh)

After UL shard writes:

1. `npm run generate-ul-dashboard` — regenerates `src/data/ul-dashboard.generated.json`.
2. Browser-verify `?view=ul` at 1920×1080 (per CLAUDE.md viewport contract):
   - All 9 new entries appear in the Agents shard view.
   - Each See-Also chip is clickable and routes to the linked entry.
   - Cross-shard search for `mentor`, `apprentice`, `bondQuality`, `Surpassing`, `Falling Out` returns the new entries.
3. Capture screenshot + console (errors+warnings filter) per Definition of Done.

Note: `npm run build` auto-runs `generate-ul-dashboard`. Manual invocation is only strictly required when the executor wants to verify before the build step.

## Constants table

Pure cite-and-anchor. The executor does not introduce new constants; they reference the existing values to ground definitions.

| Constant | Value | Used in UL entry | Source |
| --- | --- | --- | --- |
| `MENTOR_MIN_TIER` | 6 | mentor | `src/data/mentorship-constants.ts:17` |
| `APPRENTICE_MIN_TIER` | 2 | apprentice | `src/data/mentorship-constants.ts:21` |
| `APPRENTICE_MAX_TIER` | 4 | apprentice | `src/data/mentorship-constants.ts:25` |
| `BOND_QUALITY_INITIAL` | 0.0 | bondQuality | `src/data/mentorship-constants.ts:47` |
| `BOND_DRIFT_ON_SUCCESS` | +0.15 | bondQuality | `src/data/mentorship-constants.ts:51` |
| `BOND_DRIFT_ON_FAILURE` | 0.20 | bondQuality | `src/data/mentorship-constants.ts:55` |
| `GRADUATION_BOND_THRESHOLD` | 0.2 | Surpassing, Quiet Parting | `src/data/mentorship-constants.ts:59` |
| `FALLING_OUT_BOND_THRESHOLD` | −0.3 | Falling Out, Quiet Parting | `src/data/mentorship-constants.ts:63` |
| `HOSTILE_THRESHOLD` | −0.6 | Falling Out | `src/data/mentorship-constants.ts:67` |
| `SURPASSING_TIER_DELTA` | 0 | The Surpassing | `src/data/mentorship-constants.ts:80` |
| `FALLING_OUT_TRANSFER_FRACTION` | 0.5 | Falling Out | `src/data/mentorship-constants.ts:75` |
| `SEVER_BOND_QUALITY_FLOOR` | −1.0 | bondQuality | `src/data/mentorship-constants.ts:94` |
| `MENTORSHIP_BASE_DURATION` | 8 | Train Apprentice | `src/data/mentorship-constants.ts:29` |
| `MENTORSHIP_DURATION_VARIANCE` | 3 | Train Apprentice | `src/data/mentorship-constants.ts:33` |
| `MENTORSHIP_CHECK_INTERVAL` | 2 | Train Apprentice | `src/data/mentorship-constants.ts:37` |
| `MENTORSHIP_MAX_SEPARATION_HEXES` | 3 | Train Apprentice | `src/data/mentorship-constants.ts:41` |

Quote the *names*, not the values, in the UL entries — values drift; the named constant is the stable anchor. (Some named numbers above are mentioned with values for context; if you cite a number in an entry, prefix it with "currently" so a future tuning pass doesn't make the UL stale.)

## Tracing

N/A. No runtime emission added.

## Fail-soft

| Failure case | Behavior |
| --- | --- |
| `generate-ul-dashboard` script errors | Skip the regen, commit the shard edits, log impediment, file a follow-up to fix the script. The shard edits stand on their own; `npm run build` will regenerate next run. |
| Cross-shard target term (`Reach`, `branching template`) doesn't exist | Skip that See-Also link, note in commit body, do not invent a new shard entry to host the link. |
| Code-cited constant has moved or been renamed since 2026-05-15 | Update the cite to the current path/line; if the constant was deleted entirely, drop the cite and add a `// stale-cite-removed YYYY-MM-DD` annotation in the entry body. |

## Wiring

`Docs/plans/wiring-checklist.md` — N/A. No new orchestrator phase, no new GameState field, no new trace category, no new player control. Single UI touchpoint (`?view=ul`) already wired; verification is screenshot + dashboard regen, not new wiring.

## Done when

- [ ] 9 new entries added to `Docs/ubiquitous-language/Agents.md` matching shard schema (term heading, Aliases, Also-see, Status, definition).
- [ ] Cross-shard See-Also hooks added to `Cosmology.md` (Reach → mentor) and `Encounters.md` (branching template → mentorship.* templates). `Process.md` hook conditional on `// TODO(THR-76)` still existing.
- [ ] `npm run generate-ul-dashboard` runs clean; `src/data/ul-dashboard.generated.json` regenerated.
- [ ] `?view=ul` at 1920×1080 shows all 9 new entries with working See-Also navigation. Screenshot + console output captured.
- [ ] `npm test` clean (no entry should change test surface, but run for safety).
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` clean (auto-runs `generate-ul-dashboard`; second pass is the validation).
- [ ] `Docs/changelog.md` row appended; `Docs/project-history.md` one-line `✅` entry added.
- [ ] Closing commit body includes `Fixes THR-446` and verification evidence.

## Coordination block

- **Suggested model:** model:haiku — Mechanical doc work, low blast radius, no code, no judgment calls beyond shard placement (which this plan resolves). Apply `model:haiku` label.
- **Parallel-safe with:** all current work. Touches only UL shards + generated dashboard JSON; no contention with engine, content, or UI changes.
- **Mutex with:** none. (If another in-flight issue is editing `Docs/ubiquitous-language/Agents.md` simultaneously, coordinate before claiming — but the board is currently empty.)
- **Codex review:** no — doc-only, no executable surface to review.
- **Files to touch (informational):**
  - `Docs/ubiquitous-language/Agents.md` (9 entries appended)
  - `Docs/ubiquitous-language/Cosmology.md` (1 See-Also line edit)
  - `Docs/ubiquitous-language/Encounters.md` (1 See-Also line edit)
  - `Docs/ubiquitous-language/Process.md` (conditional, 1 See-Also line edit)
  - `src/data/ul-dashboard.generated.json` (regenerated by script)
  - `Docs/changelog.md` + `Docs/project-history.md` (closeout rows)

## NFP compliance

| NFP | Status | Notes |
| --- | --- | --- |
| 1. Tunability | PASS | Entry definitions cite constants by name, not by hard-coded value. Values drift; named constants don't. |
| 2. Inspectability | PASS | Every entry carries a source-file anchor so future readers can trace the term to running code. |
| 3. Determinism | N/A | Doc-only. |
| 4. Fail-soft | PASS with note | Fail-soft table covers script failure, missing cross-shard targets, and stale cites. |
| 5. Narrative over mechanical perfection | PASS | Mentorship terms (Surpassing, Falling Out, Quiet Parting) preserve the narrative names from THR-75 design over mechanical names. |
| 6. Additive over destructive | PASS | All edits are appends. No existing UL entries modified except for See-Also lines. |
| 7. Performance budget | N/A | Dashboard regen is sub-second. |
