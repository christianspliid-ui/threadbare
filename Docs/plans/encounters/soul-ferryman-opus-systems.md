# Encounter Pipeline: Soul Ferryman
> Scale: short | Slug: soul-ferryman-opus | Pass: systems
> Date: 2026-04-05 | Pipeline version: 1.0

---

## 1. Support Bundle Honesty

The revised file declares seven support objects. Assessment of each delivery mode and persistence contract follows.

| Support Object | Declared Delivery | Declared Persistence | Realistic? | Notes |
|---|---|---|---|---|
| Vesik (ferryman NPC) | `lazy-materialize-on-trigger` | `must-persist` | YES, with caveat | `EncounterSupportActorSpec` with `reuseNpcRoles` and `spawnNpcRole` is fully supported — same pattern as Maren in Flawed Steel. The caveat: `spawnNpcRole: 'ferryman'` does not appear in any current NPC role taxonomy or existing encounter content. The role needs to be authored. Nearest reuse candidates would be `boatman` or `river_guide` — neither of which exists either. The `reuseNpcRoles` list should use roles that may plausibly already exist in transit areas (`traveler`, `guide`, `laborer`). If no suitable NPC exists, Vesik spawns fresh via `spawnNpcRole`. That spawn requires a valid role in the taxonomy. |
| Diehl (courier NPC) | `lazy-materialize-on-trigger` | `must-persist` | YES | The role `courier` is confirmed live — `civic-guard-encounter-content.ts` uses `spawnNpcRole: 'courier'` successfully. `reuseNpcRoles` should include `['courier', 'messenger', 'traveler']`. Diehl binding to an existing courier NPC in transit near the crossing is mechanically sound. |
| The Silt crossing (sublocation) | `pre-seeded` | `must-persist` | PARTIAL | The revised file declares `sublocationTypeId: 'river_crossing'` or similar. No river-crossing sublocation type appears in the `SUBLOCATION_CONCEPT_ART` registry or in any existing `EncounterSupportLocationSpec`. The concept art registry covers: market-district, temple-quarter, barracks, throne-room, garden, dungeon, prison, library, archive, crypt, forge. None match a river crossing, ford, or ferry dock. A `river_crossing` sublocation type does not exist as a named sublocation type in the world model. This is `author-now`, not `live`. The sublocation type needs to be defined before the encounter can pre-seed it. |
| Fog atmosphere (environmental condition) | `pre-seeded` | `scene-only` | YES | This is narrative color, not a tracked game object. The revised file correctly marks it `scene-only`. No persistence contract required. No primitive needed. |
| "Diminished" mark (soul-quality loss) | `lazy-materialize-on-trigger` | `must-persist` | PARTIAL | The `hidden_mark` effect kind on `EncounterAftermathReactionEffect` is live (confirmed in `unifiedAction.ts`). `HiddenMarkCategory` supports: `'betrayal' | 'debt' | 'secret_knowledge' | 'concealed_action' | 'forbidden_contact'`. None of these map cleanly to "soul-quality loss" or "diminishment." The nearest viable category is `'secret_knowledge'` (stretching the semantics) or `'debt'` (not accurate). The encounter's concept — that Diehl has lost a named quality of selfhood permanently — does not fit any live hidden mark category. This is a semantic mismatch, not a missing primitive, but it requires either (a) the author accepts `'debt'` or `'secret_knowledge'` as the carrier category with a clear label, or (b) a new `HiddenMarkCategory` value is added (small addition, not a new primitive system). The persistence contract (`must-persist`) is achievable once the category mapping is resolved. |
| "Unbound" mark (contract-severed condition) | `lazy-materialize-on-trigger` | `must-persist` | PARTIAL | Same category mismatch as "Diminished." Vesik's freed-from-contract state doesn't fit `'betrayal' | 'debt' | 'secret_knowledge' | 'concealed_action' | 'forbidden_contact'`. The encounter author should use `'secret_knowledge'` with label "Freed from a river-contract that bound thirty-one years of service" and treat the category as a container rather than an exact descriptor. This is workable but semantically imprecise. Document the mismatch in implementation notes. |
| Local traveler reputation channel | `pre-seeded` | `must-persist` | YES | `reputation_tally` effect kind is live. A keyed tally (e.g., `river_crossing_regard`) on the player's reputation tracks the regional consequence. The revised file correctly identifies this as pre-seeded. Standard mechanism. |

### Summary

Five of seven support objects are realistic with minor adjustments. Two require explicit authoring before implementation can proceed:

1. **Vesik's NPC role (`ferryman`):** No existing role in the taxonomy. Either add a `ferryman` NPC role, or use a more generic role (`laborer`, `traveler`) as the spawn target with Vesik's traits applied as a named overlay. Without a valid `spawnNpcRole`, the support bundle resolver cannot materialize a new actor.

2. **River crossing sublocation type:** `pre-seeded` delivery requires the sublocation type to exist in world generation. No `river_crossing` (or equivalent) sublocation type is registered. This blocks `pre-seeded` delivery. Downgrade to `lazy-materialize-on-trigger` OR author the sublocation type in this pass.

The two hidden mark category mismatches are workable within the existing `HiddenMarkCategory` union using approximate categories with precise labels.

---

## 2. Missing Primitives

Checking every primitive family from the encounter building checklist:

### Test Shaping
**Not needed.** The encounter's resolution is purely a single-branch, single-step architecture. No test modifier or probability shaper is required — the branches carry different `reach` and `difficulty` per the `ActionStepBranch` pattern. Branch A (Break the Bargain) logically uses a divine-force reach (e.g. `rune` or `spirit`) at meaningful difficulty. Branch B (Steady the Courier) uses a social/empathy reach (e.g. `heart`) at lower difficulty, as the action is more intimate. The five outcome tiers (critical success through critical failure) are natively supported by `StepOutcome`.

### Flip / Reveal State
**Not needed.** The encounter's "the river resists" state and "ferryman deepens in thrall" states are narrative consequences, not mechanically tracked flip states. The critical failure outcome on Branch A (ferryman goes flat-eyed, river wakes) is an aftermath consequence, not a live game state that other systems need to query. If future encounters want to query whether the river has been "tested," a `hidden_mark` with `revealFamilies: ['river', 'liminal_bargain']` on the player's agent is the correct mechanism — and it is live.

### Task / Progress Carriers
**Not needed.** The encounter is one beat, two branches. No multi-tick progress bar, no tracked task. The bridge-building future hook (Branch A critical success) seeds a follow-on encounter rather than tracking construction progress in this encounter.

### Prevention / Interception / Recovery
**Not needed.** No NPC or system needs to prevent or intercept the player's intervention. The river's resistance is modeled through outcome tier (failure and critical failure), not through an interception primitive.

### Authored Choice Bundles
**LIVE PRIMITIVE — not a gap.** `ActionStepBranch` with `branchOnStep` + `variants` keyed by `choiceId`, `AuthoredChoiceCard` with `label`/`intent`/`essenceCost`/`likelyBurden`, and `BranchAwareAftermathConfig` are all live. The encounter's two-branch structure (Break the Bargain / Steady the Courier) maps directly: Step 0 is a choice-only `ActionStep` at difficulty 0, Step 1 is an `ActionStepBranch` with `branchOnStep: 0` and two `ActionStep` variants. `authoredChoices` on the template carries the prose card data. This is the same implementation pattern as Flawed Steel.

### ActionStepBranch, BranchAwareAftermathConfig, encounter_seed, hidden_mark, intelligence
**All confirmed LIVE.** None of these are flagged as primitive gaps.

### Branch-Aware Scene History / Afterimages
**Noted, not blocking.** The prose pipeline does not yet interpolate choice-history into afterimage text dynamically. The revised file authors explicit branch paragraphs (Sections 11 and 12), which is the correct workaround per the encounter building checklist.

### River Contract as a Game Object
**Potential gap — flag for author decision.** The encounter treats the "river contract" as something the god can interact with mechanically — find it, cut it. This implies the contract has some mechanical representation. In the current runtime, there is no "contract" node type or binding object. The god's action in Branch A is resolved entirely through the outcome ladder (did the divine force check succeed?) with the graph ops writing aftermath consequences to Vesik and world state. This is a **narrative interpretation gap, not a system primitive gap** — the runtime carries it cleanly through standard outcome resolution. No new primitive is needed. The author must accept that "cutting the contract" is purely an outcome-ladder artifact, not a queryable game object.

**Verdict: No missing primitives block this encounter.**

---

## 3. Runtime Feasibility

### Encounter System Capacity

**Yes — the encounter fits the runtime.** The soul ferryman is a 1-beat short encounter with 2 branches. It maps to a `UnifiedActionTemplate` with 2 steps:

- **Step 0 (The Crossing):** `ActionStep` at difficulty 0, duration `{ min: 2, max: 3 }`. This is the perception and choice beat. The player sees the situation, reads authored choice cards, and commits. Reach: `heart` (or any reach at difficulty 0 — the step is not a test, it is a gateway to player choice).
- **Step 1 (The Intervention):** `ActionStepBranch` with `branchOnStep: 0`. Two variants:
  - `break_the_bargain` variant: divine-force reach (suggest `rune` or `spirit`), difficulty 0.50–0.60, duration `{ min: 2, max: 3 }`. Resolution produces Branch A outcome ladder.
  - `steady_the_courier` variant: `heart` reach, difficulty 0.30–0.40, duration `{ min: 1, max: 2 }`. Resolution produces Branch B outcome ladder.

This is a simpler structure than Flawed Steel (2 steps vs. 3 steps, 2 branches vs. 3 branches). The runtime carries it without additional complexity.

### Five-Tier Outcome Ladder

**Supported.** `StepOutcome` exposes `critical_success | success | success_at_cost | failure | critical_failure`. All five tiers on both branches of the soul ferryman map to live outcome values. The editorial concern (Section 4 of the editorial pass) about whether five tiers are mechanically distinguishable is valid — at `difficulty 0.35` on Branch B, the gap between `success` and `success_at_cost` is narrow. However, the five-tier system uses `quintessence` push and resist mechanics to modulate outcomes, so all five tiers can be reached in practice. The editorial note is a design concern, not a runtime feasibility issue.

### Branching Memory

**Supported.** `EncounterChoiceMemory` records the player's branch choice at Step 0. `resolveStepDefinition()` in `unifiedActionLifecycle.ts` reads `choiceHistory` to dispatch to the correct Step 1 variant. `BranchAwareAftermathConfig` reads `choiceHistory` to dispatch the correct aftermath overview and changes. The encounter's divergent aftermath (crossing open vs. crossing closed; Vesik freed vs. unchanged; Diehl whole vs. diminished) is fully carried by the `BranchAwareAftermathConfig.variants` map.

---

## 4. Aftermath Supportability

### Consequence Channels

| Aftermath Consequence | Channel | Live? | Notes |
|---|---|---|---|
| Silt crossing closed (Branch A) | World state change — Vesik's actor node properties; sublocation dissolved or deactivated | PARTIAL | The support bundle system can deactivate a sublocation by changing its properties. However, there is no live `dissolve_sublocation` graph op — the closest is a property update on the crossing node marking it inactive. Check `GraphOp` registry for `dissolve` or `deactivate` ops. If absent, crossing closure is a narrative-only consequence unless a custom graph op is authored. |
| Vesik freed — "Unbound" condition | `hidden_mark` on Vesik's actor node via aftermath reaction | YES (with category caveat — see Section 1) | |
| Vesik "deeper in thrall" (Branch A critical failure) | `hidden_mark` on Vesik with higher severity | YES | Same mechanism, different `severity` and `label`. |
| Diehl "Diminished" — soul quality lost (Branch B) | `hidden_mark` on Diehl's actor node via aftermath reaction | YES (with category caveat — see Section 1) | |
| Diehl identity destroyed (Branch B critical failure) | `hidden_mark` on Diehl with maximum severity; potential `reputation_tally` marking him as compromised | YES | Severity 1.0 mark with `revealFamilies: ['identity', 'courier', 'garrison']` is supported. |
| Local traveler reputation (positive/negative) | `reputation_tally` or `reputationScore` delta via aftermath reactions | YES | Live. |
| Vesik's personal disposition toward player | `reputation_score` delta on Vesik's actor node | YES | Live. |
| Diehl's personal disposition toward player | `reputation_score` delta on Diehl's actor node | YES | Live. |
| Bridge-building future hook (Branch A critical success) | `encounter_seed` effect kind, `delayTicks: 20–30`, `encounterFamily: 'construction.quest'` | YES | Live. Seeds accumulate in `pendingEncounterSeeds`, evaluated per tick. |
| River "remembers being tested" (failure / critical failure) | `hidden_mark` on the player's agent with `revealFamilies: ['liminal_bargain', 'river']` | YES | Semantically a stretch (the mark is on the god's agent, not the river), but this is the correct v1 mechanism for "this interaction has a memory that future encounters can query." |
| Garrison correspondence delayed (Branch B failure) | `reputation_tally` on a garrison-facing key | YES | Live, though the garrison itself is offscreen and its exact actor node ID is unknown at encounter time. Standard `reputation_tally` with a named key resolves this without needing the exact node. |

### Conditions vs. Attachments

The revised file uses "marks" and "conditions" interchangeably. The runtime uses `hiddenMarks` on `GameState` (for queryable concealed consequences) and `attachments` as graph nodes for visible items and persistent effects. The soul ferryman's marks (Diminished, Unbound) should be `hidden_mark` effect kinds on aftermath reactions — they are the correct primitive for persistent, queryable consequences. They are NOT attachment nodes (which are items, blessings, curses as graph objects). The author should confirm this distinction in implementation.

---

## 5. New Hooks Needed

### NPC Roles Required

| Role | Currently Live? | Action Required |
|---|---|---|
| `ferryman` | NO — not found in any NPC role taxonomy or existing content | Add `ferryman` to the NPC role taxonomy, OR use `laborer` / `traveler` as spawn role with Vesik's traits applied as a named character overlay |
| `courier` | YES — confirmed in `civic-guard-encounter-content.ts` | No action required |

Scope for `ferryman` role: **small**. Adding a role to the NPC role taxonomy is a one-file content addition. No engine changes needed.

### Sublocation Types Required

| Sublocation Type ID | Currently Live? | Action Required |
|---|---|---|
| `river_crossing` (or `ford` / `ferry_dock`) | NO — not in `SUBLOCATION_CONCEPT_ART` registry or any existing `EncounterSupportLocationSpec` | Author the sublocation type: add an entry to the concept art registry, confirm it can be generated at river-adjacent hexes, and register it in the support bundle |

Scope: **small to medium**. The concept art entry is 5 lines. The world generation path (does the world generate river-crossing sublocations at river-hex locations?) is the larger question — if river hexes do not generate crossing sublocations by default, the support spec must use `lazy-materialize-on-trigger` with the sublocation type as a new materialized node, not `pre-seeded`.

### HiddenMarkCategory Extension

The `HiddenMarkCategory` union (`'betrayal' | 'debt' | 'secret_knowledge' | 'concealed_action' | 'forbidden_contact'`) does not contain a category for "soul-quality loss" or "mystical binding / release." Two options:

**Option A — Extend the union:** Add `'mystical_contract'` and `'soul_diminishment'` to `HiddenMarkCategory`. Scope: **trivial** — one-line union extension in `src/types/unifiedAction.ts` plus `hiddenMarks.ts` query logic update.

**Option B — Use nearest existing category:** Map `'Unbound'` to `'secret_knowledge'` (Vesik knows something about his own nature that others do not). Map `'Diminished'` to `'debt'` (Diehl owes something that can never be repaid). This is semantically imprecise but requires no type system changes. Document the imprecision in implementation notes.

Recommendation: **Option A** — extend the union. The cost is trivial and the semantic accuracy matters for future investigation encounters querying mark categories.

### Shell Types / Content Entries

No new encounter shell types are required. The encounter maps cleanly to the existing `UnifiedActionTemplate` + `ActionStepBranch` + `BranchAwareAftermathConfig` structure.

No new content entries in `unified-action-templates.ts` beyond importing and registering the new encounter file.

---

## 6. Implementation File Map

### Content (New Files)

| File | Action | Notes |
|---|---|---|
| `src/data/encounters/soul-ferryman.ts` | CREATE | Main encounter template file. Contains `EncounterSupportBundle`, step definitions, `ActionStepBranch`, `BranchAwareAftermathConfig`, and exported `SOUL_FERRYMAN_TEMPLATE`. Follow the pattern of `flawed-steel.ts`. |

### Content (Modified Files)

| File | Action | Notes |
|---|---|---|
| `src/data/unified-action-templates.ts` | MODIFY | Import `SOUL_FERRYMAN_TEMPLATE` and add to the unified templates registry. One import line, one array entry. |
| `src/data/sublocation-concept-art.ts` | MODIFY | Add `'river_crossing'` (or `'ford'` / `'ferry_dock'`) entry to `SUBLOCATION_CONCEPT_ART`. |

### Types (Modified Files)

| File | Action | Notes |
|---|---|---|
| `src/types/unifiedAction.ts` | MODIFY (optional) | Add `'mystical_contract'` and `'soul_diminishment'` to `HiddenMarkCategory` union if Option A is chosen. Otherwise no change. |

### Engine (No Changes Required)

The existing lifecycle, resolution, and aftermath pipeline carries this encounter without modification. `resolveStepDefinition()`, `BranchAwareAftermathConfig`, `hidden_mark` effects, `encounter_seed` effects, and `reputation_tally` effects are all live.

### Tests (New Files)

| File | Action | Notes |
|---|---|---|
| `src/data/encounters/__tests__/soul-ferryman.test.ts` | CREATE | Unit tests: support bundle spec shape, step branch structure, aftermath config shape, authored choice card presence at step 0, `HiddenMarkCategory` usage on marks. Follow the pattern of `wandering-healer-shrine-access.test.ts` and `rival-shrine-betrayal.test.ts`. |

---

## 7. Verdict

**READY WITH CAVEATS**

The encounter's design maps cleanly to the live runtime. The `UnifiedActionTemplate` architecture, `ActionStepBranch` branching, `BranchAwareAftermathConfig` aftermath, and `hidden_mark` + `reputation_tally` + `encounter_seed` effect kinds are all live and proven by prior encounters (Flawed Steel, Rival Shrine Betrayal, Wandering Healer Shrine Access).

The following caveats must be resolved before implementation is complete:

**Caveat 1 — Ferryman NPC role:** `spawnNpcRole: 'ferryman'` requires a valid role in the NPC role taxonomy. Add `ferryman` as a role, or select a nearest-fit existing role and document the mapping. **Scope: trivial.**

**Caveat 2 — River crossing sublocation type:** The `pre-seeded` claim for the Silt crossing requires a `river_crossing` (or equivalent) sublocation type to exist in world generation. This type does not currently exist. Either add the sublocation type to the concept art registry and verify its generation path, or change the support spec to `lazy-materialize-on-trigger`. **Scope: small.** If the world does not generate river-crossing sublocations at river hexes by default, this needs a generation path change or the delivery mode must be `lazy-materialize-on-trigger`.

**Caveat 3 — HiddenMarkCategory mismatch:** The "Diminished" and "Unbound" marks require categories that do not exist in the live union. Extend with `'soul_diminishment'` and `'mystical_contract'`, or accept the imprecision of nearest-fit categories and document it. **Scope: trivial if extending union; zero scope if accepting imprecision.**

None of these caveats require new primitive systems. All three are content-authoring or type-extension tasks.

---

## 8. Primitive Disposition

**No missing primitives identified.**

All branching, aftermath, and consequence primitives required by this encounter are live as of 2026-04-04:

- `ActionStepBranch` / `BranchAwareAftermathConfig` — live
- `AuthoredChoiceCard` — live
- `hidden_mark` effect kind — live
- `encounter_seed` effect kind — live
- `reputation_tally` effect kind — live
- `reputation_score` effect kind — live
- `recent_event` effect kind — live

The three caveats in Section 7 are content-authoring or type-union tasks, not primitive system gaps. No backlog escalation to TB-104 is required.

If the decision is made to extend `HiddenMarkCategory` with semantically accurate values, that is a type-level enhancement, not a new system primitive. It can be done in the same implementation pass as the encounter template.
