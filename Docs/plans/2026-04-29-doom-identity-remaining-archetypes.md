# THR-79 — Doom Identity Matrix: Remaining 4 Archetypes

**Date:** 2026-04-29
**Linear:** [THR-79](https://linear.app/threadbare/issue/THR-79/doom-identity-matrix-remaining-4-archetypes-changing-sundering-failing) (Content follow-up from [THR-21](https://linear.app/threadbare/issue/THR-21/tb-107-doom-archetype-identity-pass), Done)
**Project:** Thematic Pressure & Living World
**Type:** Content authoring — pattern-following with creative judgment

## Context

THR-21 shipped the `DoomIdentityMatrix` system and authored full content for three archetypes: **breach**, **convergence**, **reckoning**. All seven archetypes are wired into the registry and the engine; the four remaining archetypes (**changing**, **sundering**, **failing**, **ascension**) currently exist as *stubs* — neutral biases, 5/5/3-entry placeholder vocab, terse milestone descriptions. The engine functions, but these dooms do not yet feel distinct in play.

This issue replaces the four stub matrices in place with content that meets the BREACH/CONVERGENCE/RECKONING quality bar. **No engine changes.** No new types, no new wiring — the registry, milestone checks, prose enrichment, encounter bias, rival bias, location pressure, and complication scoring all already consume `getDoomIdentityMatrix(archetype)` and will pick up the upgraded content automatically.

## Scope correction (issue description vs reality)

The issue description says "Identity matrix JSON in `src/data/doom/<archetype>-identity.json`". That is wrong in two ways:

1. **File format is TypeScript, not JSON.** All seven matrices live as `const X: DoomIdentityMatrix = { ... }` blocks in a single file: `src/data/doom-identity-matrices.ts`. The JSON files at `src/data/doom/*.json` are a separate, smaller concern (stage names + thresholds only — fully authored already, not part of this issue).
2. **`chronicleChapterTitles` is fixed at exactly 5 entries** (one per doom stage 0–4), not ~12. The "~12" line in the issue is from an earlier draft and should be ignored — `DoomIdentityMatrix.chronicleChapterTitles: string[]` matches the 5 doom stages defined in `DOOM_STAGE_NAMES`.

The other quantities in the issue match the type. Final per-archetype counts:

| Field | Issue draft | Actual quality bar (from BREACH) |
|---|---|---|
| Verbs | "~30 words total" | **8** verbs |
| Adjectives | included in 30 | **8** adjectives |
| Atmospheres | included in 30 | **5** atmospheric phrases |
| Chronicle titles | "~12" | **5** (one per stage) |
| Milestones | 3 testable | **4** (BREACH/CONVERGENCE/RECKONING all use 4) — keep at 4 for parity |
| Encounter pool bias | unspecified | 5–6 entries, mix of positive/negative, all `\|x\| ≤ 0.30` cap |
| Rival behavior bias | "5–8 verbs" | 4–5 entries, scaled by `IDENTITY_RIVAL_BIAS_WEIGHT = 0.4` at apply time |
| Complication bias | unspecified | 8–9 entries spanning all `ComplicationCategory` values, mix of positive/negative, all `\|x\| ≤ 0.30` cap |

## Files to touch

- `src/data/doom-identity-matrices.ts` — replace the four stub blocks (`CHANGING`, `SUNDERING`, `FAILING`, `ASCENSION`) with full-quality content. Header comment also needs updating (currently says "3 fully authored, 4 stub-authored" — flip to "all 7 fully authored").
- `Docs/changelog.md` — append one row.
- `Docs/project-history.md` — append one ✅ line.
- Add an inline `// THR-79` dated comment near each upgraded matrix.

That's it. No type changes, no orchestrator changes, no UI changes.

## Quality bar — read these three matrices first

Before writing any new content, read the existing three in `src/data/doom-identity-matrices.ts`:

- **BREACH** (lines ~23–114) — outside force, frontier suffers, aggressive rivals, scar-leaving complications.
- **CONVERGENCE** (lines ~120–208) — gravitational pull, centre thrives, manipulative rivals, witness/debt complications.
- **RECKONING** (lines ~214–302) — past comes due, death sites unsettle, intervene-heavy rivals, broken-trust/debt complications.

These embody Threadbare aesthetic per the doom-content README: "lead with observed detail, not explanation; each atmosphere sentence is a camera observation, not narration; words should feel physical; no superlatives, no exclamation marks." Match that voice. Reckoning's `'old wounds reopen without warning'` and Breach's `'the boundary thins'` are exemplars.

## Per-archetype creative direction

Each archetype maps to a cosmological pressure (per the issue title's parenthetical pairing — Foundation sphere flavour, distinct from any Creation sphere already used by other matrices). Use these as prose anchors, not as engine constraints.

### The Changing (Chaos pressure)
A new cosmic order replacing the old. Not destruction — *substitution*. Old powers stop working; new ones don't yet have names. The terror is forgetting what things used to be while they change shape under your hands.

- **Encounter bias:** boost `investigation` (people trying to identify what is happening), `social` (factions realigning), and `political` (succession crises). Mild penalty to `combat` — fighting is the wrong tool for transformation. Keep within ±0.30.
- **Rival behavior:** rivals `recruit` and `intervene` heavily — they are jockeying for position in the new order. Mild penalty to `wait` and `attack`.
- **Location pressure:** zero on both axes. The Changing affects categories of things, not geography. (Optional: small `frontierDelta: +1` if you want the edges to flourish strangely.)
- **Familiarity gain:** above 1.0 (e.g. 1.2) — people cling to each other when their world is unrecognisable.
- **Complication bias:** `collateral_success` and `partial_progress` lead (success looks like something you didn't aim at; progress is half-shaped). `broken_trust` matters because old loyalties are being rewritten.
- **Prose tone:** verbs of metamorphosis without violence (*shifts, transmutes, translates, reshapes*). Adjectives of liminality (*half-formed, transitional, unfamiliar*). Atmospheres should evoke a world losing its names.
- **Chronicle titles:** the arc moves from *first wrongness* → *the old powers refuse to answer* → *new shapes nobody recognises* → *the old order is gone* → *naming the new world*.
- **Milestones:** at 0.10 something reliable stops working; 0.35 a faction collapses because its founding logic no longer holds; 0.65 the calendar/seasons/something foundational has visibly changed; 0.90 the world is unrecognisable.

### The Sundering (Force pressure)
The world itself breaking apart at fundamental seams. Distinct from Breach (something *coming through*) — Sundering is *coming apart*. Geography and bonds both fracture; nothing intrudes, but nothing holds.

- **Encounter bias:** boost `combat` and `threat` (collapse begets violence) and `recovery` (people trying to hold things together). Penalty to `social` — the bonds that make social encounters possible are breaking.
- **Rival behavior:** rivals `attack` and `expand` aggressively (claiming pieces of the breaking world). Penalty to `wait` and `recruit` — there is no time to build.
- **Location pressure:** **both** `frontierDelta` and `centerDelta` negative. Everywhere suffers; this is the only archetype with no safe geography.
- **Familiarity gain:** below 1.0 (e.g. 0.6) — bonds shatter alongside the land.
- **Complication bias:** `broken_trust` and `location_fallout` lead (relationships and places both breaking). `scar` because everyone takes a wound. `witness` because the breaking is visible to all.
- **Prose tone:** verbs of fracture (*fractures, severs, peels apart, comes undone*). Adjectives of broken integrity (*severed, fissured, halved, unjoined*). Atmospheres of seams visibly failing.
- **Chronicle titles:** *the first crack*, *the splitting season*, *all bonds undone*, *the world in pieces*, *the final severance*.
- **Milestones:** 0.10 first visible geographic crack; 0.35 communication between regions starts breaking down; 0.65 physical geography has changed (a road is gone, a river runs the wrong way); 0.90 reunification is impossible — the pieces drift apart.

### The Failing (Time pressure)
The slow erosion of whatever sustains life. Springs run dry, crops thin, magic flickers. There is no enemy. Time itself, or the world's reservoirs, or the sun — something foundational just runs out. The dread is patient and total.

- **Encounter bias:** boost `recovery` (everyone is trying to hoard or resurrect) and `investigation` (where did the power go?). Mild penalty to `combat` — there is no enemy to fight, just emptiness. Slight penalty to `social` — fewer resources to share, fewer reasons to gather.
- **Rival behavior:** rivals mostly `wait` and `intervene` — they conserve. `attack` and `expand` are heavily penalised — there is no surplus to fund aggression.
- **Location pressure:** `centerDelta` negative (capital cities cannot sustain their populations). `frontierDelta` zero or slightly negative.
- **Familiarity gain:** at or just above 1.0 — nothing pulls people apart, but nothing pulls them together either.
- **Complication bias:** `partial_progress` leads strongly — every success is incomplete because the resources weren't there. `worsening_convergence` because the failing accelerates. `scar` because exhaustion leaves marks.
- **Prose tone:** verbs of depletion (*ebbs, dims, exhausts, quietens, runs thin*). Adjectives of attenuation (*hollow, attenuated, guttering, thin, dwindled*). Atmospheres of things being slightly less than they were.
- **Chronicle titles:** *the first dimming*, *when the springs ran dry*, *the long exhaustion*, *the last light*, *the silence after*.
- **Milestones:** 0.10 a power that was reliable begins to fail (a well, a spell, a season); 0.40 multiple systems break down at once; 0.70 the core force is nearly spent — rationing is universal; 0.90 the last reserves are burning.

### The Ascension (Spirit pressure)
Something approaching godhood. Not abstract — a *specific being* (NPC, faction leader, rival, or ascendant figure) is becoming more than mortal. The dread is not catastrophe but *replacement* — the world will continue, but with a new god in it, and the people who knew the ascendant before will be small forever.

- **Encounter bias:** boost `social` and `political` (everyone is positioning relative to the rising power) and `investigation` (mortals trying to understand what is happening). Penalty to `threat` and `combat` — direct opposition no longer works.
- **Rival behavior:** rivals `recruit` heavily (building factions of devotees) and `intervene` (manipulating the ascendant or those near them). `attack` is penalised — too late to fight. `wait` is penalised — there is no time.
- **Location pressure:** `centerDelta` positive — the seat of the ascending being prospers, briefly. `frontierDelta` zero.
- **Familiarity gain:** above 1.0 (e.g. 1.3) — people gather around the ascending light, willingly or not.
- **Complication bias:** `rival_attention` leads strongly (everyone is watching the ascension). `witness` (the moment is being recorded). `debt` and `broken_trust` because alliances bend toward the rising power.
- **Prose tone:** verbs of elevation that imply *separation* from the merely mortal (*rises, surpasses, outgrows, leaves behind, transcends*). Adjectives of singularity (*singular, unprecedented, beyond, set apart*). Atmospheres of reverence-and-fear-as-one-feeling.
- **Chronicle titles:** *the first signs of elevation*, *above the common reach*, *the ones who knew them before*, *the apotheosis approaches*, *the new god's first breath*.
- **Milestones:** 0.10 the ascending being first crosses a mortal threshold (does something no mortal has done); 0.35 organised opposition has failed; 0.65 godhood is visible in the flesh — physical signs; 0.90 apotheosis completes — the world has a new god.

## Acceptance criteria

The issue specifies "CLI audit — 30-tick runs per archetype, identity milestones hit by tick 20." Refining that into runnable checks:

1. **Type & build pass.** `npx tsc --noEmit` and `npx vite build` clean.
2. **Existing tests pass.** `npm test` green. The doom suites at `src/data/__tests__/doom-content.test.ts`, `src/data/__tests__/doom-loader.test.ts`, `src/engine/__tests__/doomClock.test.ts`, and `src/engine/__tests__/rival-doom-integration.test.ts` should all stay green — none of them are stub-aware, so upgrading content should not break them.
3. **Quality-bar parity.** For each of the four upgraded matrices: ≥8 verbs, ≥8 adjectives, ≥5 atmospheres, exactly 5 chronicle titles, exactly 4 milestones, no milestone with `description.length < 40` (rules out terse stub text), no duplicated atmosphere phrase across the four upgraded archetypes (vocabulary should feel distinct per doom).
4. **Bias caps respected.** Every value in `encounterPoolBias`, `complicationBias` is within `[-0.30, +0.30]` (`IDENTITY_ENCOUNTER_BIAS_CAP` / `IDENTITY_COMPLICATION_BIAS_CAP`). Every value in `locationPressure.frontierDelta` / `centerDelta` is within `[-2, +2]` (`IDENTITY_PROSPERITY_MODIFIER_CAP`).
5. **Headless milestone smoke test.** `npm run cli -- --seed 42 --map medium`, then for each upgraded archetype: load a fresh game with that doom archetype (CLI may need a one-off `eval` to swap doom — see "executor note" below), `run 30`, then `eval state.doomClock.identityMilestoneState` (or whatever holds triggered milestones — verify by reading `phaseDoomIdentity` or the milestone checker). Confirm at least the 0.10 and 0.35 milestones have triggered by tick 20. If the milestone state is not introspectable, add a one-line `console.log` behind a `--debug-doom` CLI flag rather than skipping the check.
6. **Header comment updated.** Top of `src/data/doom-identity-matrices.ts` no longer claims "4 are stub-authored."

**Executor note on milestone smoke:** the CLI does not currently expose a `--doom <archetype>` flag. Quickest path is `eval` at the prompt: inspect `state.doomClock.definitionArchetype`, then construct a fresh `initializeGameState` call with a config that pins the archetype if such a config path exists. If pinning the archetype headlessly is non-trivial, this falls under "scope creep" — write a one-paragraph note in the closing comment, run the smoke for whichever archetype the seed naturally selected, and log a follow-up Linear ticket labelled `Deferral` for archetype-pinned smokes (assigned to the same project).

## Three-pillar check

- **Engine** — N/A. No engine changes. Registry, milestone evaluator, prose enrichment, encounter scoring, rival weighting, prosperity pressure, and complication scoring all already consume the matrices via `getDoomIdentityMatrix()`. Verified by reading `src/data/doom-identity-matrices.ts` (registry includes all 7) and the THR-21 commit ([b8b0c16](https://github.com/christianspliid-ui/threadbare/commit/b8b0c166ced92367ba031850f3bcf2bd97b88f20)).
- **Content** — Primary pillar. Replace four stub matrices with quality-bar content per the per-archetype creative direction above.
- **UI** — N/A. The DebugPanel Omens tab already renders identity milestones (per the THR-21 description: "Identity milestones — debug-visible narrative thresholds"). Upgraded milestone descriptions will appear automatically. Prose enrichment placeholders `{doom_verb}`, `{doom_adj}`, `{doom_atmosphere}` will pick up the new vocabulary in the next narrative event after the matrix loads.

## NFP compliance

| NFP | Status |
|---|---|
| #1 Tunability | PASS — all caps and modifiers remain named constants in `src/types/doomIdentity.ts`. New content respects the existing constants; no new tunables introduced. |
| #2 Inspectability | PASS — milestones remain debug-panel visible; prose enrichment continues to log via existing `enrichProse()` traces. No new traces needed. |
| #3 Determinism | PASS — vocabulary banks consumed via seeded PRNG inside `enrichProse()`. No new randomness. |
| #4 Fail-soft | PASS — `getDoomIdentityMatrix()` is total over the archetype enum; upgrading values cannot introduce new failure modes. The chronicle title `getVolumeTitle()` fallback is preserved. |
| #5 Narrative over mechanical | PASS — primary deliverable is prose vocabulary + atmospheric phrases + milestone descriptions. The whole point. |
| #6 Additive over destructive | PASS — modifies values inside existing const blocks; no schema or shape changes. |
| #7 Performance | PASS — content size grows by ~3KB total; matrix is loaded once at game-init. No hot-path impact. |

## Out of scope (do not do)

- Do **not** touch `src/data/doom/<archetype>.json` — those are the stage-name files, fully authored already, separate concern.
- Do **not** touch `src/data/doom/vocabulary.json` — that is the per-stage darkening word bank consumed by `DOOM_VOCABULARY`, also separate, also already authored.
- Do **not** add new fields to `DoomIdentityMatrix`. If a creative idea needs a new field (e.g. "ambient sound bank"), open a follow-up Linear issue rather than changing the type in this ticket.
- Do **not** change milestone progress thresholds across all four archetypes to match each other — slight asymmetry between the existing three (e.g. Breach uses 0.10/0.35/0.65/0.85, Reckoning uses 0.10/0.35/0.60/0.85) is fine. Match thematic pacing, not numerical uniformity.
- Do **not** rewrite the BREACH/CONVERGENCE/RECKONING matrices, even if you spot something you would phrase differently — they are the established reference. If you want to revise one of them, open a separate ticket.

## References

- THR-21 commit: [`b8b0c16`](https://github.com/christianspliid-ui/threadbare/commit/b8b0c166ced92367ba031850f3bcf2bd97b88f20)
- Type definition: `src/types/doomIdentity.ts`
- Existing matrices (read these first): `src/data/doom-identity-matrices.ts` lines 23–302
- Threadbare prose voice: `src/data/doom/README.md` § "Prose Style"
- Systemic wiring guide: `Docs/plans/2026-04-16-systemic-wiring-guide.md` (enrichment placeholders section)
