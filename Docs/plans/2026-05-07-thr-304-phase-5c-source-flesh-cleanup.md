---
status: current
project: Continuous Improvement
parent: THR-304
date: 2026-05-07
authored-by: Cowork
---

# THR-304 Phase 5c — Source code Flesh literal cleanup

Mechanical pass to eliminate the **safe-to-remove** `'flesh'` reach literals still present in source. Documents the **creative-decision** subset that is *parked* until a Cowork-with-human brainstorm session resolves the cosmology mapping question. Companion to THR-355 (Phase 1 — Canon bootstrap), THR-356 (Phase 5a — vault propagation), THR-358 (Phase 2a — encounter-pipeline wiring), THR-359 (Phase 5b — repo doc propagation).

## Context

`src/types/traits.ts` declares `ReachDomain` as the canonical Eight Reaches (iron, gold, shadow, veil, heart, eye, stone, star) with the deprecated `flesh` lexicon explicitly commented out (line 112) and migration noted (TB-075 Phase 1, 2026-03-28). User verdict 2026-05-05: **"Quintessence is integrity-of-self / centrality-to-the-story / threadbare-ness. NOT about flesh, biology, or dying. The deprecated Flesh Reach was an old-school D&D-flavored framing replaced by this more abstract, narrative-driven meta-axis."**

A Cowork pre-flight on 2026-05-07 (10:14 UTC, parent THR-304) flagged that 11 src files still carry literal `'flesh'` references — that count was conservative. A fresh grep finds **21 src files with literal `'flesh'`/`"flesh"` strings** and 25 occurrences inside `src/data/world-model.json`. The drift falls into three buckets, only one of which is unambiguous mechanical work.

## NFP audit

| NFP | Status | Notes |
|---|---|---|
| 1 — Tunability | PASS | No new constants introduced; only deletions of dead-key zero-fills. |
| 2 — Inspectability | PASS | Cleanup improves the type system's expressiveness — `Record<ReachDomain, X>` becomes strict. |
| 3 — Determinism | PASS with note | Bucket 1 is fixture-only (no PRNG paths). Bucket 2/3 are explicitly out of scope here precisely *because* they affect runtime determinism (e.g. orchestrator `SPHERE_TO_DOMAIN` mapping changes which dilemma stakes resolve to which reach). |
| 4 — Fail-soft | PASS | Cleanup removes a silent type-coercion path (`'flesh' as ReachDomain`) — fail-soft moves from "tolerate dead key" to "type system rejects it." |
| 5 — Narrative over mechanical | N/A | No content prose changes in Bucket 1. The Bucket 3 prose edits in `proseEnrichment.MEETING_CALLBACKS.flesh` are deferred. |
| 6 — Additive over destructive | PASS with note | This *is* a destructive change (dropping keys), but it removes provably dead state (the Eight-Reach type narrowing has already shipped); the dead keys are residue, not load-bearing. |
| 7 — Performance budget | N/A | No hot-path edits. |

## Three-pillar coverage

| Pillar | Touched? | Notes |
|---|---|---|
| Engine | Yes (Bucket 1 only — fixture & invariant cleanup) | Type strictness improves; no runtime behavior changes. |
| Content | N/A in Bucket 1 | `reward-attachment-catalog.ts`, `tavern-encounter-content.ts`, `world-model.json` are explicitly *Bucket 2* (parked). |
| UI | N/A | No UI surface references the deprecated literal. |

## Buckets

### Bucket 1 — Mechanical cleanup (THIS ISSUE — Codex-safe, ship immediately)

**Goal:** Make `Record<ReachDomain, T>` shapes strict throughout test fixtures. Drop dead-key zero-fills. Verify the existing assertion tests (`archetypeEpithet.test.ts:100`, `dilemmaLibrary.test.ts:19`) still pass.

| File | Line(s) | Change |
|---|---|---|
| `src/engine/__tests__/ambitionTick.test.ts` | 194 | Drop `flesh: 0.3` (zero-fill in reach preferences fixture). |
| `src/engine/__tests__/ambitionTick-actorId.test.ts` | 138 | Drop trailing `flesh: 0` in actor-reach fixture. |
| `src/engine/__tests__/ambitionSelection.test.ts` | 14 | Drop `flesh: 0` from baseline fixture. |
| `src/engine/__tests__/cultureGenerator.test.ts` | 55, 166 | Drop `flesh: 0` from `reachPreferences` fixtures. |
| `src/engine/__tests__/culturePhonetics.test.ts` | 25 | Drop `flesh: 0` from culture-fixture. |
| `src/engine/__tests__/culturalGravity.test.ts` | 99, 108, 113, 150 | Drop `flesh: 1` / `flesh: -1` / `flesh: 0.1` from reach-baseline fixtures. |
| `src/engine/__tests__/factionAwareness.test.ts` | 125, 146, 166 | Drop `flesh: 0.1` from faction-reach fixtures (3 sites). |
| `src/engine/__tests__/encounter.test.ts` | 132 | Replace the line `flesh: reachDomain === 'gold' ? contribution : 0` (this is dead — it tests for `'gold'` and assigns to `flesh`; remove the entire row). |
| `src/engine/__tests__/debugWorldSpawnTools.test.ts` | 284 | Drop `domainContributions: { flesh: -0.1 }` (replace with a Quintessence-neutral fixture or just drop the field). |
| `src/types/traits.ts` | 111–112 | Delete the commented-out `flesh:` lexicon stub (the comment is itself archaeological residue at this point — Phase 1 shipped 2026-03-28). Replace with a single `// Flesh removed: see Docs/canon/cosmology.md` reference once Phase 1 (THR-355) lands. |

**Done when:**
- [ ] Zero matches for `flesh` in `src/engine/__tests__/*.test.ts` and `src/engine/__tests__/*.test.tsx`.
- [ ] Zero matches for `flesh` in `src/types/traits.ts` (lexicon comment removed; Eight-Reach type definition is enough).
- [ ] `npm test` green for the 9 modified test files.
- [ ] `npx tsc --noEmit` green (this is the gate that proves the strict-typing claim — if `Record<ReachDomain, T>` was being silently widened to allow `'flesh'`, this catch-up is what catches it).
- [ ] `npx vite build` green.
- [ ] Existing assertion tests still pass: `archetypeEpithet.test.ts` (`ARCHETYPE_DOMAIN_WORDS.flesh` absence), `dilemmaLibrary.test.ts` (`targetReach !== 'flesh'`), `attachment-lifecycle-integration.test.ts` (line 251 keeps `'#flesh'` tag *as-is* — that is a content tag in a test fixture, *not* a reach literal, and is part of Bucket 2).

**Out of scope (DO NOT TOUCH):**
- `src/data/reward-attachment-catalog.ts` (8 occurrences — `'#flesh'` content tags + an effect with `reach: 'flesh' as const`). These are content-shape decisions.
- `src/data/tavern-encounter-content.ts`, `src/data/siege-encounter-content.ts`, `src/data/scry-content.ts` — content data.
- `src/data/world-model.json` (25 occurrences — graph nodes like `reach.flesh`, `action.flesh.heal`).
- `src/components/HexMap/AgentDots.tsx`, `src/components/Game/AgentInfoCard.tsx`, `src/components/Game/ThreadDetailView.tsx`, `src/components/Codex/codexRegistry.ts`, `src/components/Ascendant/ArchetypeCard.tsx` — UI references that may be reading content keys; needs Bucket 2 / 3 review.
- `src/engine/orchestrator.ts:1224`, `src/engine/proseEnrichment.ts:426`, `src/engine/revelationEmitter.ts:61`, `src/engine/scry.ts:74`, `src/engine/seedAttachments.ts:192`, `src/engine/ruins/questHooks.ts:61`, `src/engine/tierPromotion.ts:56` — production engine modules; **all Bucket 3** (creative-decision territory).

If `npx tsc --noEmit` fails on a file *not* in the table above, **stop and surface in PR comments** — that's evidence the typing was already strict and the fixture's zero-fill was intentionally widening the type via `as` cast or similar; report rather than chase the failure into Bucket 2/3.

### Bucket 2 — Mechanical migrate-or-drop with rules (parked, follow-up issue when Bucket 1 lands)

These are pattern-following but require a single canonical rule the executor can follow. Cowork to file as a separate Codex issue (THR-360 candidate) once Bucket 1 has merged and the test surface is clean.

- **Content tags `'#flesh'`** in `reward-attachment-catalog.ts`, `tavern-encounter-content.ts`, `attachment-lifecycle-integration.test.ts` — drop the tag, OR replace with `'#endurance'` / `'#injury'` / `'#wound'` based on per-tag context. Need a 1-page tag-policy decision (drop vs. rename) before authoring.
- **`reach: 'flesh' as const` effect entry** in `reward-attachment-catalog.ts:1613` — single occurrence. Drop the consumable-charge effect entirely (the `Healing Salve` item becomes a flat `applyAttachment(condition.healing)` aftermath instead) OR remap `reach: 'flesh'` to `reach: 'gold'` (the closest "vital prosperity" reach) per the cosmology mapping decision. Belongs with Bucket 3 unless we settle the policy.
- **`world-model.json` regen** — 25 occurrences (`reach.flesh`, `action.flesh.heal`, `action.flesh.diagnose`, modifier rows). The healing/diagnose actions are still *gameplay-meaningful*; they need a reach to live under. Most natural fit: `reach: 'gold'` (life-sustaining-prosperity) or split between `reach.heart` (compassion-driven healing) and `reach.eye` (diagnosis-as-perception). **This is Bucket 3** — listed here only to mark the dependency.

### Bucket 3 — Creative-decision items (parked for Cowork-with-human brainstorm)

Cosmology mapping calls. Cowork cannot decide these unilaterally per CLAUDE.md design governance ("no inventing… without verification… stop and ask the human"). All listed in the THR-304 follow-up comment posted alongside this plan.

| File:line | Question for human |
|---|---|
| `src/engine/orchestrator.ts:1224` | `SPHERE_TO_DOMAIN.life: 'flesh'` — what reach does the **life** Creation Sphere now map to for dilemma stakes? Candidates: `gold` (life-sustaining prosperity, opposite-of-shadow-decay), `stone` (currently unmapped, "enduring substance"), or a new mapping that splits life-energy between two reaches. |
| `src/engine/tierPromotion.ts:56` | `PROMOTION_TRAITS.flesh: { Hardy / Ironflesh / Unbreakable / Deathless / Avatar of Flesh }` — does the entire row drop (so flesh-mastery just doesn't exist as a tier-promotion path), or do these epithets redistribute (e.g. `Hardy` → `iron` tier 2 alternative, `Unbreakable` → `stone` tier 6)? Or are they absorbed into a Quintessence meta-property promotion ladder that doesn't share schema with reach promotions? |
| `src/engine/proseEnrichment.ts:426–430` | `MEETING_CALLBACKS.flesh` — three prose lines. Drop entirely, rewrite to fit a different reach (e.g. `stone` or `iron`), or rewrite as a Quintessence-meta-property callback that any agent gets when their thread-importance crosses a threshold? |
| `src/engine/scry.ts:74` | `SPHERE_FROM_REACH.flesh: 'life'` — reverse of the orchestrator mapping. Cascades from the orchestrator decision. |
| `src/engine/revelationEmitter.ts:61` | `REACH_VALUE_PAIR.flesh: 'mercy_ruthlessness'` — duplicate value-pair (already mapped from `iron`). If the row is just dropped, no semantic loss. Cascades from the cosmology decision. |
| `src/engine/seedAttachments.ts:192` | `modifiers: { flesh: 0.05 }` on a seeded attachment template. Drop the modifier row OR remap to the new "life" reach. Cascades from the orchestrator decision. |
| `src/engine/ruins/questHooks.ts:61` | `MARTIAL_SPHERES = new Set(['iron', 'stone', 'flesh'])` — terminology bug (these are reaches, not spheres). Likely just remove `'flesh'` from the set; iron+stone is a coherent martial pair without it. **The least-controversial item — could potentially fold into Bucket 1 if the human signs off in PR review.** |
| `src/data/world-model.json` (25) | Graph-node references. Auto-generated? Hand-curated? Need to identify the regen path before deciding strategy. |

## Coordination

**Suggested model (Codex):** N/A — Codex's model is configured at automation level. Cowork preference: this is mechanical pattern-following (`Record<ReachDomain, T>` strictness across test fixtures), no judgment required.

**Parallel-safe with:** All current Encounter Experience phases (THR-340, 333, 334, 335, 339, 343, 344, 345, 353) — they touch `src/components/Encounter*` and `src/engine/encounter*`, not the test fixtures or `traits.ts`. Also parallel-safe with THR-355 (Phase 1 — bootstrap `Docs/canon/`) and THR-358 (Phase 2a — `.claude/skills/encounter-pipeline/`); those are docs and skill files, no overlap.

**Mutex with:** None at the moment. If Bucket 2 issue gets filed before Bucket 1 merges, Bucket 1 has merge priority because Bucket 2 will need to read the post-cleanup type surface.

**Files to touch (binding):**
- `src/engine/__tests__/ambitionTick.test.ts`
- `src/engine/__tests__/ambitionTick-actorId.test.ts`
- `src/engine/__tests__/ambitionSelection.test.ts`
- `src/engine/__tests__/cultureGenerator.test.ts`
- `src/engine/__tests__/culturePhonetics.test.ts`
- `src/engine/__tests__/culturalGravity.test.ts`
- `src/engine/__tests__/factionAwareness.test.ts`
- `src/engine/__tests__/encounter.test.ts`
- `src/engine/__tests__/debugWorldSpawnTools.test.ts`
- `src/types/traits.ts` (lexicon comment cleanup only)

**Files NOT to touch (binding):** Anything under `src/data/`, `src/components/`, or `src/engine/` non-test code. Any deviation surfaces in PR comments and stops there.

**Codex review:** No (mechanical fixture cleanup; tests are the gate; `tsc --noEmit` is the second gate).

**Done when:**
- [ ] All 10 files in "Files to touch" reflect the table above.
- [ ] `npm test` green.
- [ ] `npx tsc --noEmit` green (proves the type system is now strict over `ReachDomain`).
- [ ] `npx vite build` green.
- [ ] Verification evidence pasted in the closing commit body OR linked to a green CI run.
- [ ] Closing commit body includes `Fixes THR-XXX`.

## Rejected alternatives

- **Do all three buckets in one ticket.** Rejected: violates Cowork design governance — Bucket 3 has unresolved creative-vision questions that Cowork cannot answer without the human, and pushing Codex to make those calls in-flight would drift the cosmology silently.
- **Skip Bucket 1, wait for human brainstorm and do everything together.** Rejected: Bucket 1 is provably independent (test fixtures only, no production paths) and unblocks the strict-typing benefit of `Record<ReachDomain, T>` *now*. The other buckets remain unblocked from their own parking until the human session.
- **Treat the deprecated `flesh` keys as harmless residue and leave them.** Rejected: `archetypeEpithet.test.ts:100` and `dilemmaLibrary.test.ts:19` already enforce flesh-absence at runtime. The remaining residue is silent — it widens the type system's permissiveness, which is the same drift mode that produced the original 2026-05-04 audit miss.

## Wiring

No new orchestrator phases, no new modals, no new GameState fields, no new traces. `Docs/plans/wiring-checklist.md` does not need updating for Bucket 1.

## Vision audit

N/A — process plan, no game-feel claims.

## Constants table

No new constants. Removes dead-key zero-fills.

## Tracing

No new traces.

## Fail-soft table

| Failure | Behavior |
|---|---|
| `tsc --noEmit` fails on a file not in "Files to touch" | Codex stops, surfaces failure in PR comments. Do NOT chase the failure into Bucket 2/3 territory. |
| A test in "Files to touch" fails after the fixture cleanup | Codex stops, surfaces in PR comments. Most likely cause: the test was depending on the `flesh: 0` key actually being present (e.g. iterating `Object.keys(reachPreferences)` and counting). Fix is fixture-shape adjustment, not adding the key back. |
| `archetypeEpithet.test.ts:100` or `dilemmaLibrary.test.ts:19` regression | Codex stops, surfaces. These tests are the canonical anti-regression gate; they should keep passing. |

## Done check (Cowork → handoff)

- [x] Plan covers Engine pillar (Bucket 1 fixture cleanup; type strictness gate)
- [x] Content pillar marked N/A with rationale (Bucket 2 explicit, parked)
- [x] UI pillar marked N/A with rationale (no UI references in Bucket 1 scope)
- [x] Wiring section: no orchestrator/modal/state changes
- [x] Constants table: no new constants
- [x] Tracing: none
- [x] Fail-soft table: present
- [x] Vision audit: N/A justified
- [x] Rejected alternatives: present
- [x] Three-pillar coverage explicit
