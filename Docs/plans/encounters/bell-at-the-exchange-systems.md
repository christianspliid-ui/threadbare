# Encounter Pipeline: The Last Lot at the Exchange
> Scale: local (short) | Slug: bell-at-the-exchange | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0

## 1. Support bundle honesty

| Object | Delivery | Verdict |
|---|---|---|
| `buyer`: actor, `lazy-materialize-on-trigger`, `must-persist`, reuse `merchant`/`trader`/`noble`, spawn `merchant` "Wenna Castrell" | honest: all three roles are live `NpcRole`s (`src/types/npc.ts`) and `trader` is seeded at 0.8 in settlements; a spawn fallback exists | OK. `reputation_with` needs a person, and this spec materializes one, so it is not bind-only |
| The lot | drawn at resolution | OK: see § 2 |

## 2. Missing primitives / the query prize

- **The `reward_draw` effect type has no `query` field.** Verified in `src/types/unifiedAction.ts`: the type carries `pool: RewardPoolRecipe` and nothing else. No field was invented.
- **`reward_draw` is not in `PERSISTENT_EFFECT_KINDS`** (`src/data/content-eval/compositionContract.ts`). The draft's effect route therefore failed `check:encounter` twice: `[rewards] nothing persists` and `[systems] 2 < quota 3`.
- **Fix applied:** the same recipe `{ categoryWeights: { possession: 1 }, tagFilters: ['#trade'] }` moved to step 1 `successMetadata.rewardPool`. This is the step route the spec documents (§ Rewards route 1), and its content-query site is `step_reward_pool`. The recipe projects onto `{ kind: 'item_template', tags: ['#trade'] }` via rewardPool `toContentQuery`, so the prize is tag-drawn, not id-named. The package doc block records this.
- `#trade` is live in the tag catalog (item 5 · condition 1 · trait 1). The recipe resolves against the catalogs at `check:encounter`, and the result was clean.
- `plant_compulsion` `encounterBias` keys `trade` and `acquire` are live `EncounterType`s. The same shape ships in `the-garrisons-price` and `tithe-demanded`.
- No missing primitives identified.

## 3. Runtime feasibility

Two plain steps: gold 0.40 `continue_weakened` → gold **0.45** `fail_action`. The step-1 difficulty was corrected from 0.48 per the amended brief (the background cap is `NUDGE_OFF_REACH_MAX_DIFFICULTY` 0.45). `intrinsicTier: 'background'`, `rarityTier 2`, `scale local`, `settings ['urban']`, and the hand `possession` + `drive` are unchanged, and the dry-run test recomputes the hand from the id. Both composed hands are 6 cards (1 special + deal 5; 2 specials + deal 4).

## 4. Aftermath supportability / later-tense promises (rule 7b)

| Promise | Enacting effect |
|---|---|
| P3 "a house outbid on its own floor remembers who did it" | `reputation_with $cast:buyer` ±, step 1 success/failure metadata |
| "{cast:buyer} will not forget them" / "holds the cost against them" | same edge (loss) |
| "For a while they will chase trade and buying…" | `plant_compulsion` 96 ticks, step 1 failure |
| critical_failure "The floor now knows the stranger" | **no effect: cut** |

No place-and-time promise. No appointment. `successMetadata` fires on `isStepSuccess`, which includes `near_miss`/`success_at_cost`, so the prize lands on all three success bands, as the ladder claims.

Caveat: the success_at_cost *cost* is not chipped. On that band it is the step-0 compulsion when step 0 failed, and otherwise prose only ("bought well past its worth"). This is not a rule breach: no chip claims it and no state is asserted.

## 5. Chip referents

The bond chips point at `entityId: '$cast:buyer'` (agent, linked), a materialized persistent actor. The scar chips point at `compulsion` (tooltip `ui.compulsion`) with the concept on `$actor`, backed by `plant_compulsion` (Law 56 green). The authored `trade goods` item chips anchored nothing and have been removed. The engine's PRIZE chip for the drawn item replaces them.

## 6. New hooks needed

None.

## 7. Implementation file map

Only the compiled set (`compile:encounter`). No engine, type or art changes.

## 8. Verdict

**READY WITH CAVEATS**. The caveats:
- (a) The composition census counts `content_query` only off an `encounter_seed` query. This slot's tag-drawn prize will therefore likely not register as "query prize" in the batch report's query census, even though it is a query at the `step_reward_pool` site. The batch report should note this.
- (b) Live proof should confirm that a non-empty `#trade` draw lands on `$actor` (trace `step_reward_pool`, not `aftermath_reward_draw`).

## 9. Primitive disposition

No missing primitives identified.

Gate: `node .cache/compile-encounter.mjs … --dry-run` clean; scratch `check:encounter` → `✓ [systems: cast, rewards, reputation]`, 0 warnings.
