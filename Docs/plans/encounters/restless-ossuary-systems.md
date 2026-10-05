# Encounter Pipeline: The Restless Charnel House
> Scale: medium | Slug: restless-ossuary | Pass: systems
> Date: 2026-10-05 | Pipeline version: 2.0

Audited: `restless-ossuary-revised.md` (primary), `restless-ossuary-editorial.md` (handed-over items), brief slot 8. Fixed mechanics (veil 0.74 / 0.80 / 0.84, `continue_weakened` · `continue_weakened` · `fail_action`, standing + omen, `#relic` query prize, `urban`, rarity 2, every `forecastDelta`) were not touched.

## 0. Verified against source

| Claim | Source | Result |
|---|---|---|
| `trait.mastery.spell-weaver` exists | `src/data/mastery-trait-content.ts:141` (name "Spell-Weaver"; also the veil mastery map at :211) | ✓ |
| `trait.reputation.veil.negative` exists | `src/data/reputation-trait-content.ts:241` (name "Dangerous Sorcerer", matching the factor line) | ✓ |
| `merchant` seeded at every `urban` subtype | `LOCATION_ROLE_ROSTERS` in `src/types/npc.ts`: town :227, city :245, capital — all `chance: 1.0`; `urban` expands to `town`/`city`/`capital` (`src/data/settingClasses.ts:59`) | ✓ — the reuse path always hits, so the warden is always an existing merchant and the spawnName "Orrin Vasse" is a fallback only. Prose never genders the warden. |
| `#relic` worn by items | `content-tag-catalog.generated.md:97` — item 14 · agreement 4 · power 1 | ✓ |
| `emit_omen` shape | `src/types/unifiedAction.ts:833` — `category: OmenCategory`, `intensity`, `narrativeHook`, `scope: EmittedOmenScope`, optional `durationTicks`, optional `sphereAlignment: SphereName`. `cultural` ∈ `OmenCategory` (`src/types/omen.ts:19`); `{ kind: 'global' }` ∈ `EmittedOmenScope` (:149); `spirit` and `entropy` are Creation Spheres (`src/types/index.ts:8`) | ✓ |
| `reputation_with` shape | `unifiedAction.ts:1199` — `targetLocationId` + signed `delta`, capped at ±0.15 per outcome (`REPUTATION_WITH_MAX_DELTA_PER_OUTCOME`, `src/engine/reputation.ts:66`). Largest authored value is 0.06 | ✓ |
| `bond_change` shape | `unifiedAction.ts:1359` — `withAgentId` (`$cast:warden` legal), `sentimentDelta`, reciprocal by default | ✓ |
| Card spheres | `StepNudge.sphere?: SphereName` (12 spheres incl. `order`, `chaos`) — mind, spirit, order, time, order, chaos all legal | ✓ |
| Image tags | `generic.memory` / `.blessing` / `.ward` / `.time-slow` / `.oath` / `.rumor` all present in `src/data/encounter-image-library.ts` | ✓ |
| Deal tags | `lore`, `insight`, `peril`, `social` ∈ `DealContextTag` (`unifiedAction.ts:1921`) | ✓ |
| `purposeLine` ≤ 4 words | 4 / 3 / 4 | ✓ |
| Template id tail matches slug | `encounter.town.restless_ossuary` ↔ `restless-ossuary` | ✓ |
| `stateNoun` `reputation with {location}` renders resolved | `nounTextFor` (`buildAftermathConsequences.ts:554`) ends in `enrich(text)` — the noun **is** enriched since THR-1685; the "not enriched" note in `vertical-slice.ts:4062` is stale. 3 words, inside `CHIP_STATE_NOUN_MAX_WORDS`; same spelling ships in `feud-mediation`, `drowned-mans-testimony`, `cunning-fair`, `flood-dyke-mending` | ✓ — editorial's third "consider" item is closed |

## 1. Support Bundle Honesty

| Object | Verdict |
|---|---|
| `warden` (lazy-materialize, reuse/spawn `merchant`, must-persist) | Honest. Same shape as the shipped `ganger` in flood-dyke-mending. Reuse is near-certain in every urban subtype. |
| the relic (`rewardPool` `{ possession: 1 }` `#relic`) | Honest. `drawSeededReward` (`unifiedActionResolution.ts:1585`) draws it on any step-2 success outcome, **including `near_miss`** (`isStepSuccess`, `unifiedAction.ts:2996`), so every route to the three success bands carries the prize. Soft edge: an empty filtered pool returns no reward and no PRIZE chip while the overview still names "the relic" — 14 item bearers makes this unlikely; identical exposure to flood-dyke (`#ancient`). |
| standing (`reputation_with $here`) | Honest — see § 4 route table. |
| omen (`emit_omen` global cultural) | Honest. Step-metadata effects are dispatched through `applyEncounterAftermathReaction` (THR-783, `unifiedActionResolution.ts:1256`), the same path shipped `emit_omen` reactions use (`keepers-petition`, `crowns-reckoning`). Default duration applies. |

## 2. Missing Primitives

No missing primitives. The design uses only live surfaces: linear steps, step `successMetadata` / `failureMetadata` effects, a step `rewardPool` with `tagFilters`, `carryoverFactorLines`, `traitVariants`, cast binding, `byOutcome` aftermath with reactions. No `authoredChoices`, no seed, no appointment, no branch.

## 3. Runtime Feasibility

- **Beats:** 3 linear steps — supported.
- **Branching:** none (count 0) — supported.
- **Outcome ladder** (`advanceStep` / `computeFinalActionOutcome`, `unifiedActionLifecycle.ts:194, 344`):
  - `critical_failure` — a critical failure at **any** step ends the action.
  - `failure` — only a plain failure at step 2 (`fail_action`); step 0/1 plain failures continue.
  - `success_at_cost` — step 2 success-side, with any earlier failure, any `success_at_cost`, or any `near_miss` in the history.
  - `critical_success` — any crit on an otherwise clean run; `success` — clean run, no crit.
  - `contested_won` / `contested_lost` — external contestation only; render the fallback.
- **Carryover lines:** `critical_failure` keys on steps 1 and 2 are unreachable (a step critical failure resolves the action before the next step exists). `carryoverFactorLines` is `Partial<Record<StepOutcome, …>>` (`unifiedAction.ts:2074`) and no gate (`nudgeHandChecklist.ts:353–380`, `compositionContract.ts:1932`) requires all six, so "kept for schema completeness" is false. **Wiring fix applied in the final packet: both dead lines removed.**

## 4. Aftermath Supportability

### Chip backing, per route

| Band | Routes | Writes on the route | Net standing | Chip | Backed? |
|---|---|---|---|---|---|
| critical_success | s0/s1/s2 all success-side, ≥1 crit, no cost | s2 success +0.06; prize | +0.06 | Well Regarded (gain) + PRIZE | ✓ |
| success | same, no crit | s2 +0.06; prize | +0.06 | Well Regarded + PRIZE | ✓ |
| success_at_cost | s2 success-side (incl. near_miss) after any s0/s1 failure/cost | s0 −0.02?, s1 −0.02?, s2 +0.06; prize | +0.02 … +0.06 (always positive) | Well Regarded + PRIZE | ✓ |
| failure | s2 plain failure | s0/s1 −0.02 each if failed, s2 −0.06 | −0.06 … −0.10 | Found Wanting (loss) | ✓ |
| critical_failure | s0 crit-fail | s0 −0.02 | −0.02 | Out of Favour (loss) | ✓ |
| critical_failure | s1 crit-fail | s0 −0.02?, s1 −0.02 | −0.02 … −0.04 | Out of Favour | ✓ |
| critical_failure | s2 crit-fail | earlier −0.02s?, s2 −0.06 | −0.06 … −0.10 | Out of Favour | ✓ |

Every chip is backed by a write on every route to its band. The −0.02 on steps 0 and 1 does exactly what § 0 says it does.

### Omen

Fires on both sides of step 1 (`successMetadata` covers critical_success / success / success_at_cost / near_miss → `spirit`; `failureMetadata` covers failure / critical_failure → `entropy`). Every step-1 afterimage on the success side says "a good sign", every failure-side one "a bad sign" — the prose matches the write on every step-1 outcome. Unchipped by design (no omen anchor in `anchor-catalog.generated.md`); correct.

### Chip referents (THR-1490/1491)

All chips anchor `stateNoun.entityId: "$here"`, `visualKind: "location"` — a real place-tier node, `linked` in the anchor catalog (location row → `place` card). PRIZE is engine-minted. No chip points at fiction.

### Later-tense promises (prose rule 7b)

| Sentence | Effect that enacts it |
|---|---|
| Opening: "The dean asks {actor} to find the cause, lay the dead, and rule which bones go." | The three steps themselves. |
| Step 0 failure: "They will have to lay the dead without knowing." | Step 1 follows (`continue_weakened`) + carryover `failure` line (−0.05). |
| Step 2 spine: "Every bone {actor} names will be carried to new ground…" / "They will stay quiet only if the right bones are moved." | Resolved inside the step by its own bands (afterimages state the carrying-out). |
| Overviews (cs/s/sac): "The dean gives / lets {actor} keep the relic…" | Step 2 `rewardPool` (fires on every route to these bands). |
| Reaction "Their warden will remember it kindly." | `bond_change $cast:warden +0.12`. |
| Reaction "…the weavers' warden will not forget it." | `bond_change $cast:warden −0.12`. |
| Reaction "The town agrees" / "the town notices" | `reputation_with $here +0.03`. |
| Reaction "…and the warden hears of it." | `bond_change $cast:warden −0.12`. |
| Fallback overview: "{location} waits to see if its dead stay quiet." | No effect — but it promises nothing will happen; it states a present posture. Reachable only on `contested_*`. Not a 7b breach. |

No place-and-time promise; no seed; no appointment needed. **7b: PASS.**

### Editorial handover — dispositions

1. **success_at_cost has no band-specific cost write.** Confirmed and **not wirable**: step-metadata effects key on the *step* outcome, and `EffectPredicate` (`src/types/effects.ts:32–65`) has no action-outcome predicate, so no effect can fire "only when the action lands success_at_cost". A `bond_change` on step 2 `successMetadata` would hit critical_success and success too, contradicting their overviews. The cost ("the weavers have not forgiven the ruling") stays a told, present-tense, unchipped claim about a collective with no node — not a sheet claim and not a later-tense promise. Same accepted limit as flood-dyke-mending ("No band-keyed step write"). The player can still make it real through *Name the weavers' refusal* (−0.12 bond). **Caveat, not a blocker.**
2. **Dead critical_failure carryover lines.** Removed in the final packet (see § 3).
3. **`{location}` in stateNoun.** Renders resolved (see § 0). Closed.

### Minor observations (no change)

- Success-side fallback reactions also serve `contested_won` / `contested_lost`, where "giving up their first dead" may not hold. Same exposure as every shipped package with fallback reactions; contestation of an individual local encounter is rare.
- `spawnName` "Orrin Vasse" will almost never surface (merchant reuse always hits in urban). Harmless.

## 5. New Hooks Needed

None.

## 6. Implementation File Map

Beyond the compiled set (`Docs/plans/encounters/restless-ossuary.package.json` → `compile:encounter` emits the module, structural test and both registrations):

- **No engine, type, primitive or art files.** All image tags are existing `generic.*` entries.
- **Note for the package author:** an untracked `Docs/plans/encounters/restless-ossuary.package.json` already exists in this worktree and still carries both dead `critical_failure` carryover lines (≈ lines 182 and 304). Drop them to match the final packet before compiling.

## 7. Verdict

**READY WITH CAVEATS**

Caveats (no pre-task blocks implementation):
1. success_at_cost's cost is told, not written — no band-keyed write exists (accepted limit, flood-dyke precedent).
2. An empty `#relic` draw would leave the overview naming a relic with no PRIZE chip (low probability; same as every query-prize package).

## 8. Primitive Disposition

No missing primitives identified. (The band-keyed step write — an action-outcome predicate on step effects — would close caveat 1 corpus-wide, but it is not required here, and the shipped flood-dyke package already accepts the same limit.)
