---
status: current
project: Continuous Improvement
parent: THR-304
date: 2026-05-08
authored-by: Cowork
---

# THR-360 — Source code `flesh`/`Nine Reaches` cleanup (Buckets 0/2/3 triage + Bucket 0 ship)

Follow-on from THR-359 (Phase 5b — repo doc propagation, shipped) and THR-361 (Phase 5c Bucket 1 — test fixture cleanup, currently In Dev). Closes the residue from `Docs/audits/2026-05-05-cosmological-canon-drift-audit.md` Category B.

## What this plan does

**Splits THR-360's remaining scope into three buckets and ships Bucket 0 now.**

THR-361 already addressed Bucket 1 (test fixture pollution: the dead-key zero-fills like `flesh: 0` in `Record<ReachDomain, T>` shapes). What's still in `src/**/*.ts` falls into three further buckets, only one of which is Cowork-decidable without a human session.

- **Bucket 0** — *truly mechanical*, post-THR-361 residue that has zero runtime interaction with cosmology mapping. **Ships now via Codex.**
- **Bucket 2** — *mechanical-with-rules*: content tags, `reach: 'flesh'` literals, action templates, `world-model.json` graph nodes. Each item has a clean drop-or-remap shape but the choice of remap target requires a cosmology decision. **Parked behind a Cowork-with-human session.**
- **Bucket 3** — *creative cosmology decisions*: orchestrator/scry mappings, tier-promotion epithets, prose callbacks. Cowork cannot decide unilaterally per CLAUDE.md design governance ("no inventing… without verification… stop and ask the human"). **Parked behind a Cowork-with-human session.**

After the Cowork-with-human session resolves the cosmology mapping questions, Buckets 2 and 3 split into two further implementation tickets (mechanical migration + creative rewrites).

## Context — current state of the audit

### THR-361 covered (Bucket 1, mechanical fixture cleanup, ~10 files, In Dev)

Test fixture `flesh: 0` zero-fills + the commented-out `flesh:` lexicon stub in `src/types/traits.ts:111–112`. Strict `Record<ReachDomain, T>` typing across 9 test files in `src/engine/__tests__/`.

### Verification grep (2026-05-08, post-THR-361 scope subtraction)

Running `grep -rn flesh src/` after subtracting THR-361's "files to touch" surfaces the following remaining sites:

| Layer | File | Lines | Bucket |
|---|---|---|---|
| Engine — production | `src/engine/orchestrator.ts` | 1224 (`SPHERE_TO_DOMAIN.life: 'flesh'`) | **3** |
| Engine — production | `src/engine/scry.ts` | 74 (`SPHERE_FROM_REACH.flesh: 'life'`) | **3** |
| Engine — production | `src/engine/proseEnrichment.ts` | 426–430 (`MEETING_CALLBACKS.flesh` × 3 prose lines) | **3** |
| Engine — production | `src/engine/revelationEmitter.ts` | 61 (`REACH_VALUE_PAIR.flesh: 'mercy_ruthlessness'`) | **3** |
| Engine — production | `src/engine/seedAttachments.ts` | 192 (`modifiers: { flesh: 0.05 }`) | **3** |
| Engine — production | `src/engine/tierPromotion.ts` | 56 (`PROMOTION_TRAITS.flesh: { Hardy / Ironflesh / … / Avatar of Flesh }`) | **3** |
| Engine — production | `src/engine/ruins/questHooks.ts` | 61 (`MARTIAL_SPHERES = new Set(['iron', 'stone', 'flesh'])`) | **0** (terminology bug, called least-controversial in THR-361) |
| Engine — invariants | `src/testing/contentInvariants.ts` | 13 (`LEGACY_ENCOUNTER_REACHES = new Set(['flesh', 'spirit', 'dominance'])`) | KEEP (anti-regression gate; correctly names flesh as legacy) |
| Engine — tests | `src/engine/__tests__/factionSeeding.test.ts` | 405–407 (`expect(weights['flesh']).toBeUndefined()`) | KEEP (anti-regression gate) |
| Engine — tests | `src/engine/__tests__/npcGraduation.test.ts` | 182, 187 (`expect(caps['flesh']).toBeUndefined()`) | KEEP |
| Engine — tests | `src/engine/__tests__/archetypeEpithet.test.ts` | 100–101 (`not.toHaveProperty('flesh')`) | KEEP |
| Engine — tests | `src/engine/__tests__/dilemmaLibrary.test.ts` | 19 (`expect(t.targetReach).not.toBe('flesh')`) | KEEP |
| Data — content | `src/data/__tests__/domain-words.test.ts` | 89 (comment: "flesh reach removed in TB-075 Phase 1") | KEEP |
| Data — content | `src/data/domain-words.ts` | 45 (commented-out flesh lexicon row + TB-075 reference comment) | **0** (parallels traits.ts:112 cleanup pattern from THR-361) |
| Data — content | `src/data/action-template-content.ts` | 1138, 1161, 1184, 1207 (`id: 'action.flesh.heal/diagnose/cultivate/plague'` × 4 templates) | **2** |
| Data — content | `src/data/reward-attachment-catalog.ts` | 1608 (`tags: ['#flesh', …]`), 1613 (`reach: 'flesh' as const`), 2351, 2633, 2653, 2674, 2697 (`#flesh` tags × 5 more) | **2** |
| Data — content | `src/data/tavern-encounter-content.ts` | 85, 320, 329, 347 (`reach: 'flesh'` × 4), 96, 358, 365 (`tagFilters: ['#flesh', …]` × 3), 420 (`reputation_tally key: 'flesh.positive'`) | **2** |
| Data — content | `src/data/faction-definitions.ts` | 67 (`flesh: 0.4` reach weight) | **2** |
| Data — content | `src/data/monster-faction-definitions.ts` | 144, 296 (`reachWeights: { flesh: … }` × 2) | **2** |
| Data — content | `src/data/archetype-tone-content.ts` | 78 (`flesh: { … }` archetype tone entry) | **2** |
| Data — content | `src/data/ambition-templates.ts` | 604, 628 (`id: 'healer_flesh'` + linked prose) | **2** |
| Data — content | `src/data/agent-visual-content.ts` | 36 (`flesh: '#D4826A'` color map) | **2** |
| Data — content | `src/data/scry-content.ts` | 422 (`flesh: 'Flesh'` display label) | **2** (cascades from `scry.ts:74`) |
| Data — graph | `src/data/world-model.json` | 23 occurrences across `reach.flesh` (1868), `reach.flesh: 0.15` weight (2154), `action.flesh.heal/diagnose/cultivate/plague` × 4 nodes (3029, 3039, 3049, 3059), and 11 `relation` edges referencing the same | **2** |
| UI — display maps | `src/components/Codex/codexRegistry.ts` | 151 (`DOMAIN_GLYPHS`), 159 (`DOMAIN_LABELS`) | **0b** (post-Bucket-3, see scoping note) |
| UI — display maps | `src/components/Game/AgentInfoCard.tsx` | 42 (`flesh: 'Flesh'`) | **0b** |
| UI — display maps | `src/components/Game/ThreadDetailView.tsx` | 26 (comment), 36 (`flesh: 'Flesh'`) | **0b** |
| UI — display maps | `src/components/HexMap/AgentDots.tsx` | 62 (`flesh: 'Flesh'`) | **0b** |
| UI — display maps | `src/components/Ascendant/ArchetypeCard.tsx` | 12 (`flesh: 'Flesh'`) | **0b** |
| UI — comments | `src/components/Game/AgentDetailPanel.tsx` | 74, 95 (TB-075 reference comments — code is correct, comments accurate) | KEEP (correct documentation) |
| UI — fixtures | `src/components/StyleGuide/StyleGuide.tsx` | 52 (`flesh: 0` in sample reachPreferences fixture) | **0** |
| UI — tests | `src/components/HexMap/__tests__/AgentDots.test.tsx` | 21 (`reaches = [..., 'flesh']` array — 9 entries) | **0** (stale fixture, parallel to THR-361 pattern) |
| UI — tests | `src/components/Game/__tests__/ThreadsPanel.test.tsx` | 440, 450 (`makeFaction({ dominantSphere: 'flesh' })`, asserts label `'flesh sphere'`) | **2** (intentional malformed-input test? Or stale fixture? Needs read in policy decision) |
| Data — prose only | `src/data/{archetype-content,agenda-content,ascendant-bar-content,ascendant-lens-content,candidate-vignettes,chronicler-content,condition-trait-content,culture-content,encounter-content,holy-order-dawn-encounter-content,mastery-trait-content,npc-action-templates,prose-layer-content,spark-vision-catalog,unified-action-templates}.ts` | various | KEEP (narrative use of "flesh" as the English word for human body — not a Reach literal; e.g. "wore flesh like an old coat", "stumble back into flesh and breath") |

**Bucket 0b = display-name maps** are listed separately because they look mechanical but are *not safe to drop until Bucket 3 ships*: if `orchestrator.ts:1224` or `scry.ts:74` still resolves anything to `'flesh'` at runtime, a typed `Record<ReachDomain, string>` lookup on these maps would `undefined`-out the label. The maps are defensive fallbacks for the legacy reach key. Drop them after Bucket 3 makes `'flesh'` provably unreachable in the production code paths.

## Bucket 0 — files to touch (Codex-ready, ship now)

Four files, all provably independent of cosmology mapping decisions:

| File | Line(s) | Change | Justification |
|---|---|---|---|
| `src/engine/ruins/questHooks.ts` | 61 | `const MARTIAL_SPHERES = new Set(['iron', 'stone', 'flesh'])` → `const MARTIAL_SPHERES = new Set(['iron', 'stone'])` | Terminology bug: these are reaches, not spheres. Per THR-361 plan: "least-controversial item — could potentially fold into Bucket 1 if the human signs off in PR review." Iron+stone is a coherent martial pair without flesh. No callers depend on `'flesh'` membership in this set (verify via grep before edit). |
| `src/components/StyleGuide/StyleGuide.tsx` | 52 | Drop `flesh: 0` from the `reachPreferences` sample fixture. | Sample fixture for the styleguide preview surface; same shape as THR-361's test-fixture zero-fill drops. No production data flows through it. |
| `src/data/domain-words.ts` | 45 | Delete the commented-out `// flesh: ['Frail', 'Hardy', ...]` row + the TB-075 reference comment lines (currently 4 lines preceding it). Replace with a single `// Flesh removed (TB-075 Phase 1, 2026-03-28). See Docs/canon/cosmology.md for Quintessence canon.` | Archaeological residue, parallels THR-361's `traits.ts:111–112` cleanup. The active `DOMAIN_WORDS` object is already 8-reach correct. |
| `src/components/HexMap/__tests__/AgentDots.test.tsx` | 21 | `const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];` → drop `'flesh'` (test now iterates 8 reaches). | Stale 9-reach fixture; same pattern as THR-361's `__tests__/*.test.ts` cleanups. The test asserts every reach gets a dot color; flesh has no dot color in the active palette, so the assertion currently passes only because the underlying map is permissive. |

**Done when:**
- [ ] All four files reflect the table above.
- [ ] `npm test` green for `AgentDots.test.tsx` and any test that imports `MARTIAL_SPHERES`, `StyleGuide`, or `DOMAIN_WORDS`.
- [ ] `npx tsc --noEmit` green.
- [ ] `npx vite build` green.
- [ ] Verification evidence pasted in the closing commit body OR linked to a green CI run.
- [ ] Closing commit body includes `Fixes THR-360`.

**Anti-regression gates (must keep passing — no edits to these files):**
- `src/testing/contentInvariants.ts` line 13 (LEGACY_ENCOUNTER_REACHES set including `'flesh'`)
- `src/engine/__tests__/factionSeeding.test.ts` line 405–407
- `src/engine/__tests__/npcGraduation.test.ts` line 182, 187
- `src/engine/__tests__/archetypeEpithet.test.ts` line 100–101
- `src/engine/__tests__/dilemmaLibrary.test.ts` line 19
- `src/data/__tests__/domain-words.test.ts` line 89
- `src/components/Game/AgentDetailPanel.tsx` lines 74, 95 (the comments are accurate documentation of TB-075; do not edit the code in this file at all)

**Out of scope (DO NOT TOUCH):**
- Anything listed as Bucket 2, Bucket 3, or Bucket 0b in the verification grep table.
- The narrative-prose `flesh` mentions in `src/data/*-content.ts` (the English word for human body, not a Reach literal).

## Bucket 2 — parked, mechanical-with-rules

Cannot ship until a Cowork-with-human session resolves the policy questions in §Bucket 3. Each Bucket 2 item is shape-mechanical (drop-or-remap), but the choice of remap target cascades from Bucket 3's cosmology decisions.

| File | Sites | Decision needed |
|---|---|---|
| `src/data/reward-attachment-catalog.ts` | 6 (5 `#flesh` content tags + 1 `reach: 'flesh' as const`) | Tag policy: drop `#flesh` or rename to `#endurance` / `#injury` / `#wound` per per-tag context? Effect entry: drop the consumable charge or remap reach? |
| `src/data/tavern-encounter-content.ts` | 8 (4 `reach: 'flesh'` + 3 `tagFilters: ['#flesh']` + 1 `reputation_tally key: 'flesh.positive'`) | Same tag policy. Reach migration target. Reputation key lifecycle. |
| `src/data/faction-definitions.ts`, `src/data/monster-faction-definitions.ts` | 3 (`flesh: 0.4` and `reachWeights: { flesh: ... }` × 2) | Drop the row or remap to a different reach? Faction reach-weight semantics. |
| `src/data/archetype-tone-content.ts` | 1 (`flesh: { ... }` archetype tone entry) | Drop or remap to a Quintessence meta-property tone? |
| `src/data/ambition-templates.ts` | 2 (`id: 'healer_flesh'` + prose line) | Rename the ambition (e.g. `healer_gold`?) or drop and replace with a new reach-coherent ambition? |
| `src/data/agent-visual-content.ts` | 1 (`flesh: '#D4826A'` color) | The color map already serves 8 reaches — is the `flesh` entry a defensive fallback (drop) or a Quintessence-meta visualization (rename)? |
| `src/data/action-template-content.ts` | 4 (`id: 'action.flesh.heal/diagnose/cultivate/plague'`) | Where do healing / diagnose / cultivate / plague actions live? `gold` (life-sustaining prosperity)? `heart` (compassion-driven healing) + `eye` (diagnosis-as-perception) split? Drop entirely as no-longer-canonical action set? |
| `src/data/scry-content.ts` | 1 (`flesh: 'Flesh'` display label) | Cascades from `scry.ts:74` (Bucket 3). |
| `src/data/world-model.json` | 23 (`reach.flesh` node, `reach.flesh: 0.15` weight, 4 `action.flesh.*` nodes, 11 graph edges referencing the same) | The graph is hand-curated (no auto-regen script — verified via `ls scripts/`). Edits must be hand-applied to keep `validate-world-model.ts` green. |
| `src/components/Game/__tests__/ThreadsPanel.test.tsx` | 2 (440, 450 — `dominantSphere: 'flesh'` + `'flesh sphere'` label assertion) | Is this a stale 9-sphere fixture (drop) or an intentional unknown-sphere fallback test (rename to a clearly-fake sphere id)? |

**Bucket 2 implementation issue (file after Cowork session):** "THR-XXX — Source code Phase 5d Bucket 2: mechanical-with-rules `flesh` migration" → Codex. Plan doc will codify the per-site policy in a single migration table.

## Bucket 3 — parked, creative cosmology decisions (Cowork-with-human session input)

Cowork cannot decide these unilaterally. Each is a creative call about how the Quintessence-meta-property model maps to former Flesh-reach functionality. The decisions cascade across multiple files.

### The 6 cosmology-mapping questions

| # | Site | Question |
|---|---|---|
| 1 | `src/engine/orchestrator.ts:1224` | `SPHERE_TO_DOMAIN.life: 'flesh'` — what reach does the **life** Creation Sphere now map to for dilemma stakes? Candidates: `gold` (life-sustaining prosperity, opposite-of-shadow-decay); `stone` ("enduring substance"); `heart`+`eye` split (compassion-as-healing + diagnosis-as-perception); a new mapping that splits life-energy across two reaches; or "no reach — life sphere now drives a Quintessence-meta-property delta on the actor instead of a reach delta." |
| 2 | `src/engine/tierPromotion.ts:56` | `PROMOTION_TRAITS.flesh: { 2: 'Hardy', 4: 'Ironflesh', 6: 'Unbreakable', 8: 'Deathless', 10: 'Avatar of Flesh' }` — does the entire row drop (so flesh-mastery just doesn't exist as a tier-promotion path)? Or do these epithets redistribute (e.g. `Hardy` → `iron` tier 2 alternative; `Unbreakable` → `stone` tier 6)? Or are they absorbed into a Quintessence meta-property promotion ladder that doesn't share schema with reach promotions? |
| 3 | `src/engine/proseEnrichment.ts:426–430` | `MEETING_CALLBACKS.flesh` — three prose lines. Drop entirely? Rewrite to fit a different reach (e.g. `stone` or `iron`)? Or rewrite as a Quintessence-meta-property callback that any agent gets when their thread-importance crosses a threshold? |
| 4 | `src/data/action-template-content.ts:1138–1207` | The four canonical `action.flesh.*` templates (`heal`, `diagnose`, `cultivate`, `plague`). These are gameplay-meaningful — divine players still want to fire healing actions. Where do they live? Most natural fit per the audit: `reach: 'gold'` (life-sustaining-prosperity) or split between `reach.heart` (compassion-driven healing) and `reach.eye` (diagnosis-as-perception). |
| 5 | `src/data/reward-attachment-catalog.ts` + `tavern-encounter-content.ts` (content tags `#flesh`) | Tag taxonomy decision: drop `#flesh` entirely, or rename to `#endurance` / `#injury` / `#wound` per tag context? This decision propagates to tagFilter semantics in tavern encounters. |
| 6 | `src/engine/seedAttachments.ts:192`, `revelationEmitter.ts:61`, `scry.ts:74` | Cascades from #1. Once `SPHERE_TO_DOMAIN.life` resolves, these inverse maps follow mechanically. |

### Suggested session shape

A single 60–90 minute Cowork-with-human session, structured:

1. Read the audit + this plan doc + the brainstorm-cosmological-symmetry note (`vault/Brainstorms/brainstorm-cosmological-symmetry.md`) to refresh decision context.
2. Resolve question #1 (life sphere mapping) — this is the load-bearing decision; #4 and #6 cascade.
3. Resolve #5 (content tag policy) — affects tag taxonomy across all content files.
4. Resolve #2 (tier-promotion epithets) and #3 (prose callbacks) — both pure-content decisions.
5. Capture in `Docs/canon/cosmology.md` (the Canon page is now the canonical destination for these mappings) and a brainstorm companion doc.
6. File implementation tickets:
   - **Bucket 2** → Codex (mechanical migration per the resolved policies)
   - **Bucket 3** → CC (orchestrator/scry edits with prose rewrites; non-trivial judgment)
   - **Bucket 0b** → Codex follow-up after Bucket 3 lands (display-map cleanup; provably dead once flesh is unreachable in production paths)

**Bucket 3 brainstorm-input issue (file alongside this plan doc):** "THR-XXX — Cowork-with-human cosmology-mapping session for residual flesh literals" — captures the 6 questions and points at this plan + the audit.

## NFP audit

| NFP | Status | Notes |
|---|---|---|
| 1 — Tunability | PASS | Bucket 0 introduces no new constants; only deletions of dead-key zero-fills + a stale set membership. |
| 2 — Inspectability | PASS | Bucket 0 tightens type strictness over `ReachDomain`; the `MARTIAL_SPHERES` rename clarifies a terminology bug that was creating the wrong mental model in any downstream reader. |
| 3 — Determinism | PASS | Bucket 0 is fixture-only + a test array + a comment cleanup + a set-member drop. The set drop affects `questHooks.ts` runtime; verify no caller depends on `'flesh'` membership before merging (grep `MARTIAL_SPHERES` in all `src/**`). PRNG-touching paths are explicitly out of scope here. |
| 4 — Fail-soft | PASS | Cleanup removes a silent type-coercion path. Fail-soft moves from "tolerate dead key" to "type system rejects it." |
| 5 — Narrative over mechanical | N/A | No content prose changes in Bucket 0. Bucket 2 and 3 prose decisions are explicitly parked. |
| 6 — Additive over destructive | PASS with note | This is destructive (dropping keys), but it removes provably dead state. The Eight-Reach type narrowing has already shipped (TB-075 Phase 1); the dead keys are residue, not load-bearing. |
| 7 — Performance budget | N/A | No hot-path edits. |

## Three-pillar coverage

| Pillar | Touched? | Notes |
|---|---|---|
| Engine | Yes — Bucket 0 (one production set + one comment-cleanup data file) | Type strictness improves; no runtime behavior changes; `MARTIAL_SPHERES` no longer falsely names reaches as spheres. |
| Content | Partial — Bucket 0 only touches `domain-words.ts` (commented-out lexicon row). Bucket 2 (full content cleanup) is explicitly parked. | The narrative-prose mentions of "flesh" stay — those are the English word, not a Reach literal. |
| UI | Yes — Bucket 0 touches one StyleGuide sample fixture + one HexMap test fixture. Bucket 0b (display-name maps) is explicitly parked. | StyleGuide is the canonical preview surface for primitive components; fixture stays Eight-Reach-strict to match production typing. |

## Coordination block

**Suggested model (Codex):** N/A — Codex's model is configured at automation level. Cowork preference: this is mechanical pattern-following (`Record<ReachDomain, T>` strictness + dead-set-member drop), no judgment required.

**Parallel-safe with:** All current Encounter Experience phases (THR-334, THR-335, plus shipped THR-340/333/339/343/344/345). They touch `src/components/Encounter*` and `src/engine/encounter*`, not `ruins/questHooks.ts`, `domain-words.ts`, `StyleGuide.tsx`, or `__tests__/AgentDots.test.tsx`. Also parallel-safe with THR-292 (vault encounter format backfill — Obsidian only), THR-289 (UL dashboard — new file), THR-215 (memory grooming — automation infra), THR-178/179 (deferral docs only), THR-363 (Codex skill wiring — different files). Parallel-safe with THR-361 (Phase 5c Bucket 1 — different files; Bucket 1 was scoped to `src/engine/__tests__/*.test.ts` + `src/types/traits.ts`, no overlap with Bucket 0's four files).

**Mutex with:** None at the moment. **Hard ordering:** must merge AFTER THR-361 lands (THR-361 establishes the strict `Record<ReachDomain, T>` type baseline that this ticket inherits). If THR-361 is still In Dev when Codex picks this up, hold pickup until THR-361 closes (the verification grep + done-when checks assume a clean THR-361 baseline).

**Files to touch (binding):**
- `src/engine/ruins/questHooks.ts`
- `src/components/StyleGuide/StyleGuide.tsx`
- `src/data/domain-words.ts`
- `src/components/HexMap/__tests__/AgentDots.test.tsx`

**Files NOT to touch (binding):** Anything listed in Bucket 2, Bucket 3, or Bucket 0b in the verification grep table. Any deviation surfaces in PR comments and stops there.

**Codex review:** No (mechanical cleanup; tests + tsc are the gates).

**Done when:** see Bucket 0 §Done-when checklist above.

## Rejected alternatives

- **Ship all three buckets in one ticket.** Rejected: Bucket 3 has unresolved creative-vision questions Cowork cannot answer without the human; pushing Codex to make those calls in-flight would silently drift the cosmology. THR-361 already established the precedent for splitting buckets by decidability.
- **Skip Bucket 0, wait for the human session and do everything together.** Rejected: Bucket 0 is provably independent (one terminology-bug fix + one stale set + two pollution-fixture cleanups). The strict-typing benefit of dropping these residues is available now without prejudicing the cosmology decision. Same reasoning as why THR-361 shipped Bucket 1 ahead of the human session.
- **Roll the display-name maps into Bucket 0.** Rejected: the display maps look mechanical but are runtime-coupled to whatever `orchestrator.ts:1224` and `scry.ts:74` resolve to. Until Bucket 3 makes `'flesh'` provably unreachable in production paths, dropping these maps risks `undefined`-out display labels. Tracked as Bucket 0b, file as a follow-up after Bucket 3 ships.
- **Treat all the deprecated `'flesh'` keys as harmless residue and leave them.** Rejected: they widen the type system's permissiveness, which is the same drift mode that produced the original 2026-05-04 audit miss. The whole point of TB-075's strict `ReachDomain` typing is broken until residues are gone.

## Wiring

No new orchestrator phases, no new modals, no new GameState fields, no new traces. `Docs/plans/wiring-checklist.md` does not need updating for Bucket 0.

## Vision audit

N/A — process plan, no game-feel claims. The Vision-relevant decisions are explicitly parked in Bucket 3 for human decision. Per CLAUDE.md NFP #5 ("narrative over mechanical perfection") and the design-governance rule ("no inventing… without verification… stop and ask the human"), this is exactly the right moment to defer.

## Constants table

No new constants. Removes one stale set member and one comment block.

## Tracing

No new traces.

## Fail-soft table

| Failure | Behavior |
|---|---|
| `tsc --noEmit` fails on a file not in "Files to touch" | Codex stops, surfaces failure in PR comments. Most likely cause: a Bucket 0b display-map type-narrowed `Record<ReachDomain, string>` somewhere that was tolerating the loose-typed sibling map's `'flesh'` key. Surface, do NOT fix in this ticket. |
| A test in "Files to touch" fails after the cleanup | Codex stops, surfaces in PR comments. Most likely cause: `AgentDots.test.tsx` has a downstream loop iterating the `reaches` array and asserting a count of 9. Fix is fixture-shape adjustment, not adding the key back. |
| Anti-regression gate (factionSeeding / npcGraduation / archetypeEpithet / dilemmaLibrary / domain-words.test) regression | Codex stops, surfaces. These are the canonical anti-regression gates; they should keep passing. |
| `MARTIAL_SPHERES` has an unexpected caller that depends on `'flesh'` membership | Codex stops, surfaces in PR comments. The pre-edit grep should rule this out, but if a runtime test fails, a one-line patch in `questHooks.ts` is preferred over restoring the literal. |

## Done check (Cowork → handoff)

- [x] Plan covers Engine pillar (Bucket 0 production drop + comment cleanup)
- [x] Content pillar partially covered (`domain-words.ts` lexicon comment); Bucket 2 explicit + parked
- [x] UI pillar partially covered (StyleGuide sample fixture + HexMap test fixture); Bucket 0b explicit + parked
- [x] Wiring section: no orchestrator/modal/state changes
- [x] Constants table: no new constants
- [x] Tracing: none
- [x] Fail-soft table: present
- [x] Vision audit: N/A justified (creative cosmology calls explicitly parked behind human session)
- [x] Rejected alternatives: present
- [x] Three-pillar coverage explicit
- [x] Bucket 2 + Bucket 3 + Bucket 0b parked with binding deferral conditions
- [x] Cowork-with-human cosmology session input doc structure specified

## Sibling tickets to file (Cowork follow-up)

After this plan moves to Ready for Codex:

1. **Cowork-with-human cosmology brainstorm session ticket** — captures the 6 Bucket 3 questions, references this plan + the audit + `vault/Brainstorms/brainstorm-cosmological-symmetry.md`. Status: Idea (not actively claimable until session is scheduled).
2. **Bucket 2 implementation ticket** (filed AFTER session) — Codex-targeted mechanical migration once the cosmology mapping policies are decided.
3. **Bucket 3 implementation ticket** (filed AFTER session) — CC-targeted; non-trivial because it involves prose rewrites + orchestrator-mapping edits + cascading code paths.
4. **Bucket 0b implementation ticket** (filed AFTER Bucket 3 ships) — Codex follow-up; display-name map cleanup, provably dead once Bucket 3 makes flesh unreachable.
