# Encounter Pipeline: Road Ambush
> Scale: short | Slug: road-ambush | Pass: systems
> Date: 2026-04-05 | Pipeline version: 2.0

---

## 1. Support Bundle Honesty

The revised design declares six support objects. Assessment against `EncounterSupportSpec` types and `EncounterSupportBundle`:

| Support Object | Declared Delivery | Declared Persistence | Runtime Verdict |
|---|---|---|---|
| Soraya Kelk | `lazy-materialize-on-trigger` | `must-persist` | SUPPORTED. `EncounterSupportActorSpec` pattern matches. `reuseNpcRoles` would be `['merchant', 'trader']`. |
| Dragan Halfmast | `lazy-materialize-on-trigger` | `must-persist` | SUPPORTED. `reuseNpcRoles` would be `['mercenary', 'captain', 'soldier', 'bandit']`. |
| Lead driver | `lazy-materialize-on-trigger` | `scene-only` / `must-persist` conditional | SUPPORTED with caveats. `EncounterSupportActorSpec` supports a fixed persistence contract per spec entry — the design's conditional logic ("scene-only if unnamed; must-persist if survival becomes a thread") cannot be expressed in the spec itself. Implementation must commit to one at author time. Recommend `must-persist`; scene-only cleanup can be handled at aftermath. |
| Trade road (location) | `pre-seeded` | `must-persist` | SUPPORTED. `EncounterSupportLocationSpec` with `pre-seeded` delivery. The trade road is a location node — `sublocationTypeId` should target an existing road sublocation type (e.g. `sublocation-type.road` or `sublocation-type.waypoint`). Confirm the sublocation type ID exists before authoring. |
| Waymarker stones (flavor) | `scene-only` | `scene-only` | NOT NEEDED in the bundle. Waymarker stones are prose atmosphere, not graph nodes. No support spec required. The bundle should omit this row. |
| Trade road safety (reputation channel) | `pre-seeded` | `must-persist` | SUPPORTED via existing reputation system. Reputation channels do not require a support spec entry — they are addressed by `GraphOp` entries on outcome steps. No spec row needed. |
| Extracted goods (Branch B only) | `lazy-materialize-on-trigger` | conditional | PARTIALLY SUPPORTED. A generic attachment node can be materialized via support bundle. However, the design's three-way conditional content (sealed letters → intelligence record, medicine → consumed attachment, generic goods → reputation delta) cannot all be expressed as a single support spec. The implementation should pick one canonical content type for the bundle spec and handle variants via `aftermathConfig` reactions using `intelligence` and `recent_event` effects rather than materializing different object types at resolve time. |

**Net support bundle shape:** 3 actor specs (Soraya, Dragan, driver) + 1 location spec (trade road sublocation). Waymarker stones and reputation channel are prose/GraphOp concerns, not bundle entries. Extracted goods: author a single `attachment` sublocation spec; content variance goes in aftermath reactions.

---

## 2. Missing Primitives

The following primitives are confirmed LIVE in the current runtime and must NOT be flagged as gaps:

- `ActionStepBranch` — live in `src/types/unifiedAction.ts`, used by flawed-steel and soul-ferryman
- `BranchAwareAftermathConfig` — live in `src/types/unifiedAction.ts`, used by flawed-steel and soul-ferryman
- `encounter_seed` reaction effect — live in `EncounterAftermathReactionEffect` union
- `hidden_mark` reaction effect — live in `EncounterAftermathReactionEffect` union
- `intelligence` reaction effect — live in `EncounterAftermathReactionEffect` union
- `AuthoredChoiceCard` — live in `src/types/unifiedAction.ts`, used by flawed-steel

No encounter-specific primitives are missing. All structural patterns used in this encounter exist in the type system and have working implementations in flawed-steel.ts.

---

## 3. Runtime Feasibility

### Step 0 (Branch Selection)

**Pattern:** Plain `ActionStep` with `difficulty: 0` and `failBehavior: 'continue_weakened'`. Two authored choices (`shield_the_road`, `turn_the_chaos`) in `authoredChoices[0]`. Choice IDs must exactly match the `ActionStepBranch.variants` keys at Step 1.

**Assessment:** FULLY SUPPORTED. This is the exact pattern in flawed-steel Step 0.

### Step 1 (Branch Resolution)

**Pattern:** `ActionStepBranch` with `branchOnStep: 0`, variants keyed to Step 0 choice IDs. Two variants: Branch A (Iron reach, moderate difficulty) and Branch B (Iron reach, slightly lower difficulty with different risk profile).

**Assessment:** FULLY SUPPORTED. `resolveStepDefinition()` in `unifiedActionLifecycle.ts` handles exactly this lookup. The lifecycle reads `choiceHistory` to find the choice at `branchOnStep: 0` and returns the matching variant.

**Iron reach on both variants:** Valid. The type `ReachDomain` includes `'iron'`. Both variants using the same reach with different difficulties and GraphOps is a supported configuration.

### Difficulty Range

The design describes Branch A as "moderate" and Branch B as "slightly lower." In `UnifiedActionTemplate` difficulty is expressed as a `0-1` float (see flawed-steel: 0.45 = moderate, 0.40 = slightly lower). Implementation should target approximately:
- Branch A (`shield_the_road`): `difficulty: 0.45`
- Branch B (`turn_the_chaos`, both sub-cards): `difficulty: 0.38`

### Outcome Ladder (5-tier)

The runtime supports five outcome tiers via `StepOutcome`: `critical_success`, `success`, `success_at_cost`, `failure`, `critical_failure`. The design's five-tier ladder per branch maps cleanly to this. `BranchAwareAftermathConfig` handles the per-branch summary.

### GraphOps on Outcomes

The design specifies reputation changes for Soraya, Dragan, and the trade road. These are expressed as `GraphOp` entries on `onSuccess`/`onFailure` arrays — specifically `update_node` with `reputationDelta`. This is the established pattern (flawed-steel uses it throughout). No new op types are needed.

---

## 4. Aftermath Supportability

### BranchAwareAftermathConfig

The encounter requires different aftermath summaries per branch. `BranchAwareAftermathConfig` with `branchOnStep: 0` handles this exactly. Two `AftermathVariant` entries (one per branch choice ID) plus a `fallback`.

### EncounterAftermathChange entries required

Both branches need `EncounterAftermathChange` entries of these kinds:
- `reputation` — Soraya disposition, Dragan disposition, driver survival
- `future_hook` — trade road safety, bandit captain as future thread
- `item` (Branch B) — extracted goods

All three `kind` values are in the `EncounterAftermathChangeKind` union. SUPPORTED.

### Reaction Effects

Branch A reactions use: `reputation_tally`, `recent_event`, `encounter_seed` — all live.
Branch B reactions use: `reputation_tally`, `recent_event`, `hidden_mark`, `encounter_seed` — all live.

The `hidden_mark` effect requires a `HiddenMarkCategory`. For Dragan (Branch B "Keep the line taut"), the appropriate category is `'debt'` or `'mystical_contract'` — both exist in the `HiddenMarkCategory` union.

### intelligence reaction effect (Branch B)

Branch B's "Seize the Spoils" outcome can yield sealed correspondence as intelligence. The `intelligence` reaction effect in `EncounterAftermathReactionEffect` supports this directly with `category: 'trade_route'` or `category: 'political_secret'`. SUPPORTED.

---

## 5. New Hooks Needed

No new primitives or runtime hooks are required. All structural patterns exist. The following implementation notes are scoping reminders, not missing capabilities:

| Item | Notes | Scope |
|---|---|---|
| Confirm road sublocation type ID | The trade road support spec needs a valid `sublocationTypeId`. Check world-model.json for an existing road or waypoint sublocation type before authoring. If none exists, use `sublocation-type.gatehouse` (as soul-ferryman does for the crossing) or propose a new one. | ~1 hour, research only |
| Resolve driver persistence contract | The spec must commit to `must-persist` at author time. Conditional persistence is not expressible in `EncounterSupportActorSpec`. Recommend `must-persist`; driver death is handled via aftermath changes, not node deletion. | Design decision, no code |
| Branch B extracted goods spec | Pick one canonical object type (recommend a `sealed_correspondence` attachment). Content variance expressed via aftermath reactions. The template does not need to materialize three different object types. | ~30 min authoring |
| `deception` HiddenMarkCategory | The flawed-steel file uses `category: 'deception' as const` in a reaction — but `'deception'` is NOT in the `HiddenMarkCategory` union in `src/types/unifiedAction.ts`. The union contains: `'betrayal' | 'debt' | 'secret_knowledge' | 'concealed_action' | 'forbidden_contact' | 'soul_diminishment' | 'mystical_contract'`. Flawed-steel's use of `'deception'` is a latent type error (masked by `as const`). For this encounter, use `'debt'` (Dragan's obligation) or `'mystical_contract'` (the divine thread). Do NOT add a new category without a type change. | ~10 min, type-check flawed-steel too |

---

## 6. Implementation File Map

| File | Action |
|---|---|
| `src/data/encounters/road-ambush.ts` | CREATE — new encounter file following flawed-steel.ts pattern |
| `src/data/unified-action-templates.ts` | EDIT — add `import { ROAD_AMBUSH_TEMPLATE } from './encounters/road-ambush'` and append to `UNIFIED_ACTION_TEMPLATES` array (after `SOUL_FERRYMAN_TEMPLATE`) |
| `public/concept-art/encounters/road-ambush.jpg` | CREATE (art pipeline) — 16:9 concept art per Section 19 direction |
| `src/data/encounters/flawed-steel.ts` | OPTIONAL EDIT — fix latent `'deception'` HiddenMarkCategory type error (out of scope for this encounter but should be logged) |

No changes required to: `src/types/unifiedAction.ts`, `src/types/encounter.ts`, `src/types/gameState.ts`, `src/engine/unifiedActionLifecycle.ts`.

---

## 7. Verdict

**READY FOR IMPLEMENTATION**

All structural patterns required by this encounter exist in the current runtime. The two-step branching structure (Step 0 choice → Step 1 `ActionStepBranch` → `BranchAwareAftermathConfig`) is the established pattern, implemented and working in flawed-steel. No new primitives are needed. No engine changes are required.

The three caveats are authoring decisions, not runtime blockers:
1. Driver persistence contract must be fixed at `must-persist` before filing the support spec.
2. Branch B extracted goods must be collapsed to a single canonical object type; content variance goes in reactions.
3. Trade road sublocation type ID must be confirmed against world-model.json before the support spec is filed.

---

## 8. Primitive Disposition

| Primitive | Status | Notes |
|---|---|---|
| `ActionStepBranch` | LIVE | Used by flawed-steel and soul-ferryman |
| `BranchAwareAftermathConfig` | LIVE | Used by flawed-steel and soul-ferryman |
| `AftermathVariant` | LIVE | Component of `BranchAwareAftermathConfig` |
| `AuthoredChoiceCard` | LIVE | Used by flawed-steel (both step 0 and step 1 choices) |
| `encounter_seed` reaction effect | LIVE | Used by flawed-steel aftermath reactions |
| `hidden_mark` reaction effect | LIVE | Used by flawed-steel aftermath reactions |
| `intelligence` reaction effect | LIVE | Defined in `EncounterAftermathReactionEffect` union |
| `EncounterSupportBundle` (actor + location specs) | LIVE | Used by flawed-steel and soul-ferryman |
| 5-tier `StepOutcome` | LIVE | `critical_success`, `success`, `success_at_cost`, `failure`, `critical_failure` |
| Iron reach on `ActionStep` | LIVE | `ReachDomain` includes `'iron'` |
| `deception` HiddenMarkCategory | NOT IN UNION | Latent bug in flawed-steel.ts. Use `'debt'` or `'mystical_contract'` for this encounter. |
