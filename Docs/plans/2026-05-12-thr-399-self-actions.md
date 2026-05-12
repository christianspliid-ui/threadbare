# THR-399 — Self-Actions: Meditate / Withdraw / Concentrate / Manifest

**Date:** 2026-05-12
**Linear:** [THR-399](https://linear.app/threadbare/issue/THR-399) — *Add self-actions: Meditate, Withdraw, Concentrate, Manifest*
**Project:** Content Architecture (Now / High)
**Parent:** [THR-390](https://linear.app/threadbare/issue/THR-390) — Action System Curation & Unlock Roadmap
**Replaces:** The original issue body (which contained the design intent at the brainstorm level). This doc adds engine wiring spec, three-pillar coverage, NFP table, and the proposed answers to the three open verdict items.
**Brainstorm companion:** §2 inline (Christian's verdict + the three open verdict items resolved with proposals).

## 0. Reading the issue forward

THR-390 §3 (Gaps) surfaced that of the ~99 ascendant actions today, **zero target the ascendant themselves**. Christian's verdict (2026-05-11): *"yes, file."* The four self-actions cover the four shapes of turn-economy choice — **regen** (Meditate), **discount** (Withdraw), **amplify** (Concentrate), **manifest** (Manifest). Three baseline (rarity 1/1/2) so the player learns the self-targeting move; one capstone (rarity 3) for a once-per-arc dramatic option.

Substrate readiness is now confirmed:

- THR-407 (Done 2026-05-11) — added `trayTier?: AscendantTrayTier` to `UnifiedActionTemplate` and rewrote `classifyTrayTier` so target-based self-rule works.
- THR-396 (Done 2026-05-11) — reassigned rune/time/void drift reaches; the rune-verbs landed `trayTier: 'core'`, demonstrating the field is wired and tested.
- THR-397 (Done 2026-05-12) — rarity recurve across 99 ascendant actions; the rarity field now carries signal so a tier-3 Manifest is meaningfully rare.

Nothing else blocks. This issue is the **first templates to use `trayTier: 'self'` for real** (THR-407 added a synthetic test fixture; THR-399 ships the live content).

## 1. Codesight pre-flight (Blast Radius)

**Files to touch:**

| File | Importer count | Risk note |
|------|---------------:|-----------|
| `src/data/unified-action-templates.ts` | ~30 | additive — four new template entries appended to the ascendant section; one new constants import block |
| `src/data/influence-constants.ts` (or new `src/data/self-action-constants.ts`) | new file or extends existing | new — four tunable constants per NFP #1 (see §6) |
| `src/types/gameState.ts` | **176 (high-impact)** | additive — two optional one-shot buff fields on the ascendant node's properties (`nextActionDiscount`, `nextActionTierBoost`). No removed/renamed fields. |
| `src/engine/unifiedActionResolution.ts` | ~10 | additive — resolution handlers for the four new actions; consumes/clears the one-shot buffs on next action resolve |
| `src/engine/essenceIncome.ts` (or a new `phaseSelfActionBuffs.ts`) | ~4 | additive — Meditate's regen path emits an `essence_gain` event already in the type union |
| `src/types/trace.ts` | **156 (high-impact)** | additive — new `self_action` trace subtypes appended to the existing union; no rename/remove |
| `src/data/__tests__/unified-action-templates.test.ts` | n/a | additive — fixture assertions on the four templates' `trayTier`, `rarityTier`, `actorAffinities` |
| `src/engine/__tests__/unifiedActionResolution.test.ts` | n/a | additive — one effect-path test per action |

**Two files with ≥100 importers** (`src/types/gameState.ts` at 176, `src/types/trace.ts` at 156). Both changes are **additive only** — new optional properties / new variant strings appended to existing unions. No removal, no rename of existing fields. Per CLAUDE.md §Blast Radius the additive-only path means no escalation section is required, but the cascade-risk notes are:

- `gameState.ts` — adding optional ascendant-node `properties` keys is invisible to consumers that don't read those keys; the resolver in `unifiedActionResolution.ts` is the sole consumer.
- `trace.ts` — adding to the trace `type` union means any switch statement with an `exhaustive` check downstream needs an entry (none currently exist; verified via grep at execution time). The chronicle renderer (`uiColorPalette.ts:147` for `essence_gain` example) needs a color entry for each new subtype but falls back gracefully if missing.

**Substrate rideability check** (every claim below was verified before authoring; see §0 for issue-level blocker verification):

| Claim | Where it lives | Verified |
|------|----------------|----------|
| `UnifiedActionTemplate.trayTier` field exists | `src/types/unifiedAction.ts:626–794` (post-THR-407 — verify field at execution time in case main hasn't been pulled) | ✅ via THR-407 PR #246 |
| `classifyTrayTier` returns `template.trayTier` when present | `src/engine/ascendantTray.ts` (post-THR-407) | ✅ via THR-407 PR #246 |
| `EssencePool = Record<SphereName, number>` (essence is per-sphere) | `src/types/influence.ts:18` | ✅ |
| `AscendantProperties` is stored on the ascendant actor node in `node.properties` | `src/types/influence.ts:106–120` | ✅ |
| `essence_gain` is already in the GameEvent `type` union | `src/types/gameState.ts:65` | ✅ |
| `apply_influence` GraphOp exists, target = actor node, payload is `InfluencePayload` with sphere, interventionType, decay | `src/types/graphOp.ts:75, 86–100` | ✅ |
| `essenceIncome.ts` already runs once per tick and can absorb a "pending regen bonus" without a new phase | `src/engine/essenceIncome.ts:13, 58` | ✅ |
| `phaseEssence` is the orchestrator's essence phase that emits `essence_gain` events | `src/engine/orchestrator.ts:1741` | ✅ |
| `divine.inspire` is the canonical `apply_influence` template shape (good reference for `divine.self.manifest`'s per-mortal influence application) | `src/data/unified-action-templates.ts:419–435` | ✅ |

**Substrate that does NOT exist and is NOT built in this issue:**

- A general "buff next action" pipeline. Withdraw and Concentrate each ship as a one-shot pending field on the ascendant node, consumed by `unifiedActionResolution.ts` at the start of the next divine-action resolve. We do **not** introduce an `ActionBuff[]` queue or a status-effect pipeline. If a third buff-shaped self-action is added (e.g. a future "Surge" that doubles a verb's radius), revisit the pattern then.
- A "currently-focused hex" engine concept distinct from the ascendant's avatar position. Manifest uses **the ascendant avatar's current hex** as its origin (see §3.4). If the player later gets a free-camera/focus distinction from avatar position, Manifest's origin can be re-routed.
- A new attention-tier classification. The four templates use existing tiers (`intrinsicTier: 'background'` for Meditate/Withdraw/Concentrate, `intrinsicTier: 'story_beat'` for Manifest — story_beat is the existing capstone tier that THR-407's classifier already treats as `rare`).

## 2. Brainstorm companion — Christian's verdict + three open verdict items

### 2.1 Christian's verdict (2026-05-11)

*"yes, file."* — captured in the issue body. The four-action shape is approved. This plan inherits that approval and resolves the three remaining tunables surfaced in the issue.

### 2.2 Open verdict item resolutions (proposed; user can override)

**Q1 — Names: keep Meditate/Withdraw/Concentrate/Manifest, or rename for Threadbearer voice?**

Threadbearer voice prefers short, charged, mythic words (Coincidence, Omen, Anoint). Proposed final names follow the issue's alternates list:

- `Meditate` → **Stillness** (charged noun; "spend a turn in stillness, essence flows back")
- `Withdraw` → **Recede** (single charged verb; "recede; the world breathes without you for a turn")
- `Concentrate` → **Focus** (already in Threadbearer register; "focus the divine will, the next verb bends a degree further")
- `Manifest` → **Reveal** (the most charged option; "reveal a fragment of your true face; mortals feel it across the hex")

Engine IDs use the descriptive names for grep-friendliness: `divine.self.stillness`, `divine.self.recede`, `divine.self.focus`, `divine.self.reveal`. The `spellName` field gets the high-register variant (e.g. `'The Long Stillness'`). **Override path:** if Christian prefers the working titles, swap `name` to Meditate/Withdraw/Concentrate/Manifest at template-edit time; engine IDs stay descriptive.

**Q2 — Manifest's effect radius: focused hex / N hexes / all threaded mortals?**

Proposed: **all mortals on the ascendant avatar's current hex**, with the avatar's hex-encounter-awareness range (`encounterAwareness.ts`) NOT applied — this is a *physical revelation*, not a sensory one. The number of mortals on one hex is bounded by populace constants (~10–60 mortals max on a settled hex) — well within the per-action GraphOp budget.

**Rejected alternatives:**

- *Every threaded mortal* — would be ~hundreds in late game; load-bearing performance risk and dilutes the "dramatic single-place" framing.
- *Within N hexes of the avatar* — adds a tunable that has no clear "right" value and makes the action read as a smite/aura rather than a single revelation.

**Override path:** if Christian prefers a smaller scope, change `MANIFEST_HEX_DISTANCE` from `0` (current hex only) to `1` (current + adjacent six hexes). Not recommended unless playtesting shows the current-hex scope feels too local.

**Q3 — Concentrate stacking: stacks with Withdraw, or first-applied wins?**

Proposed: **first-applied wins; the second buff is wasted essence + an info toast**. Reasons:

1. The two buffs target different dimensions (cost vs tier-up). Stacking them would let the player save 50% essence AND get a tier-up on the same verb — a free dual-buff that breaks the "every self-action is a trade-off" frame.
2. The wasted-essence toast teaches the rule on first misuse without a hard-blocked UI affordance.
3. Implementation is one `if (state.nextActionBuffPending !== null)` guard — minimal code, no new state.

**Override path:** if Christian wants them to stack, drop the guard. Concentrate-then-Withdraw becomes a viable "burn 5 essence to amplify the next verb AND get it 50% off" combo. Worth a playtest cycle either way; default is no-stack.

### 2.3 Vision audit

`Vision/02-non-negotiables.md` and `Vision/00-north-star.md` were unreachable via Obsidian MCP at the time of THR-402's design pass (per THR-402's Vision audit caveat). For THR-399, the directly-relevant Vision premise is from `Vision/taste-profile.md`: **player agency through trade-offs, not numerical optimization**. The four self-actions each have a clean trade-off the player can reason about without numbers:

- Stillness — *act now or save up for later* (regen)
- Recede — *act now or pay less later* (discount)
- Focus — *small essence now for a bigger effect next* (amplify)
- Reveal — *a story-beat moment now at the cost of visibility to rivals* (manifest)

No new Vision premise is needed; this is in-frame with the existing taste profile. Re-run the full Vision audit at execution time if MCP access is restored.

## 3. The four templates — engine spec

All four entries are appended to the ascendant section of `src/data/unified-action-templates.ts`. Common fields:

- `actorAffinities: ['ascendant']`
- `targetCategories: ['actor']`
- `crudType: 'update'` (all four mutate ascendant or world state)
- `scale: 'cosmic'`
- `motivations: []` (self-actions are not motivation-driven)
- `apCost: 1`

### 3.1 Stillness — `divine.self.stillness`

| Field | Value |
|------|-------|
| `name` | `'Stillness'` |
| `spellName` | `'The Long Stillness'` |
| `description` | `"Sit in stillness. You spend the turn doing nothing outward; the world breathes; essence flows back into the pool."` |
| `reach` | `'heart'` (inward turn) |
| `rarityTier` | `1` (Mundane — always available) |
| `intrinsicTier` | `'background'` |
| `essenceCost` | `0` |
| `trayTier` | `'self'` |
| `steps[0].onSuccess` | new GraphOp variant (see §4.1) targeting the ascendant node, payload = `{ essenceDelta: MEDITATE_ESSENCE_REGEN, sphere: ascendant.primarySphere }` |
| `narrativeTemplates.initiation` | `"sits in stillness; the divine attention recedes"` |
| `narrativeTemplates.success` | `"essence flows back into the pool, unhurried"` |
| `narrativeTemplates.failure` | (n/a — pure regen, can't fail; resolver guarantees success at `difficulty: 0.0`) |

**Effect resolution:** on `onSuccess`, mutate `ascendantNode.properties.essencePool[primarySphere] += MEDITATE_ESSENCE_REGEN`, clamped at `ascendantNode.properties.maxEssence`. Emit `essence_gain` event with `message: 'Stillness — essence flows back.'`. Emit `self_action.stillness` trace.

**Why primary sphere:** Christian's framing in the issue body was open. Routing to primary sphere keeps Stillness ascendant-identity-flavored (a Hunger.Witness regenerates Mind/Spirit when meditating, a Wrath god regenerates Force) without adding a sphere-picker UI. **Override path:** if playtest shows essence pool starvation in the secondary sphere, change `MEDITATE_ESSENCE_REGEN_SPHERE` from `'primary'` to `'split'` (regen equally across primary and secondary).

### 3.2 Recede — `divine.self.recede`

| Field | Value |
|------|-------|
| `name` | `'Recede'` |
| `spellName` | `'The Tide Pulls Back'` |
| `description` | `"Pull divine attention back from the world. This turn passes; the next verb costs less."` |
| `reach` | `'veil'` (esoteric withdrawal) |
| `rarityTier` | `1` (Mundane) |
| `intrinsicTier` | `'background'` |
| `essenceCost` | `0` |
| `trayTier` | `'self'` |
| `steps[0].onSuccess` | new GraphOp variant (see §4.2) targeting the ascendant node, payload = `{ nextActionDiscount: WITHDRAW_DISCOUNT }` |
| `narrativeTemplates.initiation` | `"recedes from the world; the tide pulls back"` |
| `narrativeTemplates.success` | `"the next reach will cost less"` |

**Effect resolution:** on `onSuccess`, set `ascendantNode.properties.nextActionDiscount = { discount: WITHDRAW_DISCOUNT, appliedTick: currentTick }`. The next `unifiedActionResolution.resolveAction` call that fires an ascendant action checks this field — if set, multiplies the essence cost by `(1 - discount)`, clears the field, emits `self_action.recede.consumed` trace.

**Stacking rule (per §2.2-Q3):** if `nextActionTierBoost` is already set when Recede fires, log `self_action.recede.wasted` trace, emit info toast `"The will is already focused; receding now changes nothing."`, do NOT overwrite the existing buff, do NOT refund essence (cost is 0 anyway).

### 3.3 Focus — `divine.self.focus`

| Field | Value |
|------|-------|
| `name` | `'Focus'` |
| `spellName` | `'The Single Eye'` |
| `description` | `"Focus the divine will on a single coming intervention. The next verb's effect is amplified — the world bends a degree further."` |
| `reach` | `'star'` (cosmic focus) |
| `rarityTier` | `2` (Storied — meaningful boost worth a cost) |
| `intrinsicTier` | `'background'` |
| `essenceCost` | `5` |
| `trayTier` | `'self'` |
| `steps[0].onSuccess` | new GraphOp variant (see §4.3) targeting the ascendant node, payload = `{ nextActionTierBoost: CONCENTRATE_TIER_BOOST }` |
| `narrativeTemplates.initiation` | `"the divine attention narrows to a single point"` |
| `narrativeTemplates.success` | `"the will is focused; the next verb will bend the world a degree further"` |
| `narrativeTemplates.failure` | `"the focus slips; the moment passes"` (only fires on `difficulty > 0` paths — default difficulty is 0.0; fail-soft case is for future contestation extensions) |

**Effect resolution:** on `onSuccess`, set `ascendantNode.properties.nextActionTierBoost = { boost: CONCENTRATE_TIER_BOOST, appliedTick: currentTick }`. The next ascendant action's resolution looks for this field — if set, increments the effective `rarityTier` (or applies tier-equivalent boost to influence `initialStrength` / `maxDuration`) for resolution only, then clears the field, emits `self_action.focus.consumed` trace.

**What "tier boost" means concretely:** the existing resolution path scales influence intensity by `rarityTier`. Focus adds `CONCENTRATE_TIER_BOOST` (default `1`) to the effective tier for the resolution pass. A tier-2 Persuade with Focus active resolves as tier-3 (decay slower, initial strength higher), but the template's printed `rarityTier` does not change — only the resolution-time `effectiveTier`.

**Stacking rule (per §2.2-Q3):** symmetric to Recede — if `nextActionDiscount` is already set, Focus's `onSuccess` logs `self_action.focus.wasted`, emits info toast `"The will is already withheld; focusing now changes nothing."`. Essence is **still consumed** (5) because Focus has a non-zero cost; this is the trade-off — chose to spend essence on a buff that overlaps with an existing buff.

### 3.4 Reveal — `divine.self.reveal`

| Field | Value |
|------|-------|
| `name` | `'Reveal'` |
| `spellName` | `'The True Face'` |
| `description` | `"Reveal a fragment of your true face to the world. Mortals on the hex feel it. Reputation, fear, devotion — everything spikes. The cost is significant. Use sparingly."` |
| `reach` | `'star'` (cosmic exposure) |
| `rarityTier` | `3` (Mythic — once-per-run or near-it) |
| `intrinsicTier` | `'story_beat'` — also triggers `classifyTrayTier`'s `rare` override; **trayTier still set explicitly to `'self'`** because THR-407's rare override runs before `trayTier`; we want this in the self tray, not the rare tray. **Verification step:** confirm at execution time that the rare-override-then-trayTier ordering returns `'self'`; if the rare override wins, swap to `'rare'` and document the discovery (the issue body explicitly flagged this as TBD). |
| `essenceCost` | `15` |
| `trayTier` | `'self'` (with verification caveat above) |
| `steps[0].onSuccess` | multiple GraphOps: (1) per-mortal `apply_influence` on every mortal-actor on the ascendant avatar's hex (see §4.4); (2) emit a divine wake mark at the avatar's hex (already-existing rival-detection substrate) |
| `narrativeTemplates.initiation` | `"the true face becomes visible; mortals on the hex feel divinity at hand"` |
| `narrativeTemplates.success` | `"awe and fear ripple across the hex; the wake will be felt for ticks to come"` |

**Effect resolution:** on `onSuccess`:

1. Query all `actor` nodes on the avatar's current hex with `actorType` in `{'mortal', 'npc'}` (exclude ascendant, ally divine entities).
2. For each, apply `apply_influence` with payload tied to ascendant's primary sphere alignment:
   - `interventionType: 'reveal'`
   - `sphere: ascendant.primarySphere`
   - `initialStrength: MANIFEST_INITIAL_STRENGTH` (default `1.5` — higher than `divine.inspire`'s default to make the effect feel weighty)
   - `decayRate`, `minimumStrength`, `maxDuration` — pull from a new `DECAY_CONSTANTS.reveal` entry (decays over ~10 ticks; lasts long enough to feel like an aftermath)
   - `valueDrifts`: per-mortal-alignment shifts toward the ascendant's archetype (devotion up if the mortal's profile aligns, fear up if it opposes — exact map deferred to `resolveRevealValueDrift(mortal, ascendant)` helper)
3. Drop a divine wake mark at the avatar's hex via the existing `divine.perceive.taste_the_wake` substrate. Rivals will detect this on their next perception phase. **No new mechanism is built** — Reveal piggybacks on the rival-wake detection system that already exists for high-rarity interventions.
4. Emit `self_action.reveal` trace with target hex, affected mortal IDs, and the rival-wake mark ID.

**Failure path:** Reveal has `difficulty: 0.0` — the action cannot fail at the resolution level. The only failure case is **no mortals on the hex** (avatar is in a depopulated wilderness). Fail-soft: emit `self_action.reveal.empty_hex` trace, emit a chronicle entry `"The True Face shines on empty ground. No mortal eyes are present to witness."`, refund essence cost (per fail-soft NFP #4 — don't punish the player for a resolution-path edge case the UI didn't gate).

**Performance note:** the per-mortal `apply_influence` loop is bounded by populace density. Worst case is a saturated settlement hex (~60 mortals); each `apply_influence` is O(1) graph-mutation. Net: well within per-action budget.

## 4. New GraphOp variants and state shape

THR-399 introduces three new GraphOp payload variants and two new ascendant-node property keys. All are additive.

### 4.1 GraphOp variant — Stillness

Add a payload-only variant to `GraphOp`. We do NOT add a new `GraphOpType`; we reuse `update_node` with a structured `changes` payload. The resolver in `unifiedActionResolution.ts` interprets:

```ts
{
  op: 'update_node',
  nodeId: '$ascendant',
  changes: {
    essencePoolDelta: { [sphere]: MEDITATE_ESSENCE_REGEN }
  }
}
```

A new helper `applyEssenceDelta(node, sphere, delta, max)` clamps to `maxEssence`. Helper lives in `src/engine/influence.ts` next to `createStartingEssencePool`.

**Why not a new GraphOpType?** Cascade risk — adding `essence_regen` to `GraphOpType` means every exhaustive switch on the union has to handle it. Reusing `update_node` with a typed `changes.essencePoolDelta` key keeps the surface flat. If THR-390 §1 (re-curve rarity to give us more essence-shaped actions) lands more verbs in this shape, revisit.

### 4.2 / 4.3 GraphOp variants — Recede and Focus

Same shape — `update_node` on `$ascendant` with `changes.nextActionDiscount` or `changes.nextActionTierBoost`. The resolver assigns to `node.properties[fieldName]` directly. No new GraphOpType.

### 4.4 GraphOp variant — Reveal

Reuses the existing `apply_influence` GraphOp, invoked once per mortal on the hex. The Reveal template's `onSuccess` is a `(state, ctx) => GraphOp[]` function that expands at resolution time. This pattern is already used by `divine.perceive.taste_the_wake` (search the codebase for `onSuccess` returning a function vs an array literal — verify at execution time).

If the existing template format doesn't support a function-returning `onSuccess`, add support as part of THR-399's wiring (mention this as an open execution-time discovery — implementer can fall back to a single-target template and resolve the per-mortal expansion inside the unified resolver).

### 4.5 New ascendant-node property keys

Add to `AscendantProperties` interface in `src/types/influence.ts`:

```ts
/** One-shot discount for the next ascendant action's essence cost (Recede). Cleared on use. */
nextActionDiscount?: { discount: number; appliedTick: number };
/** One-shot tier boost for the next ascendant action's resolution (Focus). Cleared on use. */
nextActionTierBoost?: { boost: number; appliedTick: number };
```

Both optional, default undefined. Cleared after consumption. **Persistence:** these survive a save/load via the existing graph-snapshot serialization (node properties are JSON-serialized as-is).

## 5. Content — prose tables

The four templates each carry three Threadbearer-voice strings: `narrativeTemplates.initiation` / `.success` / `.failure`. See §3 for per-template prose. The constraints:

- **No numbers in player-facing prose.** The chronicle entry for Stillness reads `"essence flows back into the pool, unhurried"` — never `"+3 Mind essence"`. Numbers appear only in the debug panel and the essence pool widget.
- **IPK-keyword posture.** The four spell names (`The Long Stillness`, `The Tide Pulls Back`, `The Single Eye`, `The True Face`) are the IPK-grade nouns that should appear in chronicle prose. Use them as the high-register variant; the engine name (`Stillness` / `Recede` / `Focus` / `Reveal`) is the everyday verb.
- **Failure prose is sparse.** Three of the four cannot fail at `difficulty: 0.0`. Focus has a failure string for completeness — only fires if a future contestation path adds difficulty.

**Prose enrichment placeholders:** `divine.self.reveal`'s chronicle entry should use `enrichProse()` to substitute mortal names: `"awe and fear ripple across {names_on_hex}; {topMortal} drops to one knee."`. The `{names_on_hex}` placeholder needs a new resolver in `prose-layer-content.ts`; the `{topMortal}` placeholder reuses the existing `{mortal_name}` resolver. **Open execution-time question:** is `{names_on_hex}` already covered by an existing multi-mortal placeholder? If yes, reuse. If no, add a small resolver that joins the first three mortal names with comma-and ("Kael, Maren, and the smith's son").

## 6. Constants — every tunable named (NFP #1)

| Constant | Default | Purpose | File |
|----------|--------:|---------|------|
| `MEDITATE_ESSENCE_REGEN` | `3` | Essence added to the ascendant's primary sphere on Stillness success. Tunable between 2 and 6 in playtest. | `src/data/self-action-constants.ts` (new) |
| `MEDITATE_ESSENCE_REGEN_SPHERE` | `'primary'` | Which sphere receives the regen. Alternatives: `'primary'` / `'split'` (split equally with secondary). | same |
| `WITHDRAW_DISCOUNT` | `0.5` | Fractional discount applied to the next ascendant action's essence cost. `0.5` = half-cost. Tunable. | same |
| `CONCENTRATE_TIER_BOOST` | `1` | Effective `rarityTier` increment applied to the next ascendant action's resolution. | same |
| `MANIFEST_HEX_DISTANCE` | `0` | Hex-distance radius for Reveal's per-mortal influence. `0` = current hex only. `1` = current + adjacent six hexes. | same |
| `MANIFEST_INITIAL_STRENGTH` | `1.5` | Initial influence strength applied to each mortal on Reveal. Higher than `divine.inspire` default (1.0) to make Reveal feel weighty. | same |
| `DECAY_CONSTANTS.reveal` | `{ decayRate: 0.1, minimumStrength: 0.2, maxDuration: 10 }` | Decay profile for Reveal's per-mortal influence. ~10-tick aftermath. | `src/engine/influence.ts` (extends existing `DECAY_CONSTANTS` table) |
| `REVEAL_WAKE_MARK_STRENGTH` | `2.0` | Magnitude of the rival-wake mark dropped on the avatar's hex. Higher than typical interventions (rivals should *want* to investigate). | `src/data/self-action-constants.ts` |

Every numeric value above lives in a named constant. The template body never inlines a number.

## 7. Traces (NFP #2)

Six new trace subtypes. All additive to the existing `Trace` union in `src/types/trace.ts`.

```ts
// Stillness — emitted on success
interface SelfActionStillnessTrace {
  category: 'self_action';
  subtype: 'stillness';
  ascendantId: string;
  sphere: SphereName;
  essenceGained: number;
  tick: number;
}

// Recede — emitted on success
interface SelfActionRecedeTrace {
  category: 'self_action';
  subtype: 'recede';
  ascendantId: string;
  discount: number;
  tick: number;
}

// Recede consumed — emitted on next action's resolution
interface SelfActionRecedeConsumedTrace {
  category: 'self_action';
  subtype: 'recede.consumed';
  ascendantId: string;
  consumedByActionId: string;
  originalCost: number;
  discountedCost: number;
  tick: number;
}

// Recede / Focus wasted — emitted when buff overlap occurs
interface SelfActionBuffWastedTrace {
  category: 'self_action';
  subtype: 'recede.wasted' | 'focus.wasted';
  ascendantId: string;
  existingBuff: 'discount' | 'tierBoost';
  tick: number;
}

// Focus — emitted on success
interface SelfActionFocusTrace {
  category: 'self_action';
  subtype: 'focus';
  ascendantId: string;
  boost: number;
  tick: number;
}

// Focus consumed — emitted on next action's resolution
interface SelfActionFocusConsumedTrace {
  category: 'self_action';
  subtype: 'focus.consumed';
  ascendantId: string;
  consumedByActionId: string;
  baseTier: RarityTier;
  effectiveTier: number;
  tick: number;
}

// Reveal — emitted on success
interface SelfActionRevealTrace {
  category: 'self_action';
  subtype: 'reveal';
  ascendantId: string;
  hexId: string;
  affectedMortalIds: readonly string[];
  rivalWakeMarkId: string;
  tick: number;
}

// Reveal on empty hex — fail-soft trace
interface SelfActionRevealEmptyHexTrace {
  category: 'self_action';
  subtype: 'reveal.empty_hex';
  ascendantId: string;
  hexId: string;
  refundedEssence: number;
  tick: number;
}
```

All traces are inspectable via `window.__DEBUG.getTraces()`. The debug panel's Trace tab should filter on `category: 'self_action'` to make these legible during playtest.

## 8. Fail-soft cases (NFP #4)

| Failure case | Fallback | Trace |
|--------------|----------|-------|
| Stillness — essence pool already at max for primary sphere | Cap at `maxEssence`; emit `essence_gain` with `actualGain` = clamped value (may be 0) | `self_action.stillness` with `essenceGained: 0` |
| Recede — `nextActionDiscount` already set (Recede twice in a row, no action fired between) | Overwrite (more recent buff wins for the same buff type — distinct from cross-type stacking) | `self_action.recede` (no waste trace; same-type re-application is intentional) |
| Recede — used but no next action fired before the buff "expires" | No expiry mechanism in v1. Buff persists until consumed or overwritten. If this becomes a balance issue, add `buffMaxAge: 5 ticks` constant. | n/a |
| Focus — overlapping buff with Recede | Essence consumed (5), `nextActionTierBoost` not set, info toast + waste trace per §2.2-Q3 | `self_action.focus.wasted` |
| Reveal — no mortals on hex | Refund 15 essence, emit empty-hex trace + chronicle | `self_action.reveal.empty_hex` |
| Reveal — `apply_influence` fails for one specific mortal (e.g. mortal node deleted mid-resolve) | Skip that mortal, continue with the rest; log per-mortal failure as warn-level trace | `self_action.reveal` (succeeds with shorter `affectedMortalIds`) |
| Reveal — `trayTier` precedence ambiguity (rare override vs explicit `'self'`) | If post-THR-407 classifier returns `'rare'` for `trayTier: 'self', intrinsicTier: 'story_beat'`, accept and document. Reveal in the rare tray is a defensible outcome — it's both a self-action and a once-per-run capstone. | Document the discovery in the closing comment; update this plan retroactively |

All seven cases are non-crashing. The tick loop continues. NFP #4 holds.

## 9. UI pillar — three surfaces

### 9.1 Action drawer (`ActionDrawer` / ascendant bar)

After THR-407 the drawer renders three tray tiers (`core` / `self` / `rare`). Today the `self` tier is **empty in real play** (THR-407's only `self`-tagged template is a test fixture). After THR-399, the self tier shows four cards: Stillness, Recede, Focus, Reveal — in that visual order.

Card-level requirements (verified via `?view=styleguide` for the ActionCard primitive at execution time):

- **Card header:** spell name (`'The Long Stillness'`) in serif IPK style; engine name (`'Stillness'`) below in normal-weight.
- **Cost line:** Stillness/Recede `"—"` (no cost); Focus `"5 essence"`; Reveal `"15 essence"` in larger weight.
- **Description body:** the `description` field text (§3.x), no numbers.
- **Footer:** trade-off tag — `"Spend a turn, gain essence"` / `"Spend a turn, next verb costs less"` / `"Pay essence, next verb hits harder"` / `"Story beat — rivals will see"`.

Reveal's card gets a slight visual lift (the existing `intrinsicTier: 'story_beat'` styling — `?view=styleguide` shows what this looks like; story_beat tier cards have a different border treatment).

### 9.2 Chronicle / event feed

Each successful self-action emits a chronicle entry via the existing `essence_gain` / new `intervention_effect` event types:

- Stillness — `{ type: 'essence_gain', message: 'The Long Stillness — essence flows back, unhurried.', significance: 0.3 }`
- Recede — `{ type: 'intervention_effect', message: 'The Tide Pulls Back. The next reach will cost less.', significance: 0.3 }` (no toast; chronicle-only)
- Focus — `{ type: 'intervention_effect', message: 'The Single Eye. The will is narrowed to a single point.', significance: 0.4 }`
- Reveal — `{ type: 'intervention_effect', message: 'The True Face. Awe and fear ripple across <hex name>; <topMortal> drops to one knee.', significance: 0.9 }` — significance ≥ 0.8 means it surfaces as a between-turn toast/notification per the existing significance threshold.

Recede/Focus's **consumption events** also emit chronicle:

- `'The reach that cost less was <action name>.'` (Recede consumed)
- `'The focus broke open: <action name> bent the world a degree further.'` (Focus consumed)

These run via the existing `intervention_effect` event type — no new event type needed.

### 9.3 Debug panel

The DebugPanel's CLI tab (per `__DEBUG` bridge — see CLAUDE.md §Debug Bridge) gains four list entries via `window.__DEBUG.listActions('@hero')`:

- `divine.self.stillness`
- `divine.self.recede`
- `divine.self.focus`
- `divine.self.reveal`

The existing `window.__DEBUG.fireAction('@hero', 'divine.self.stillness')` should fire each cleanly. No new debug API.

The Trace tab gains a `category: 'self_action'` filter chip (extends the existing category filter). Each fired self-action appears in the trace log with its full payload (§7).

The Ascendant state inspector should surface `nextActionDiscount` and `nextActionTierBoost` when non-null. **Implementation:** add two rows to the ascendant inspector under the essence pool — `"Pending: discount X% on next action"` or `"Pending: tier boost +N on next action"`. Hidden when both are null.

### 9.4 Hex map signifiers

**N/A — explicit.** None of the four self-actions produce a persistent visible map signifier. Reveal's wake mark uses the existing rival-detection substrate (invisible to the player by default; visible if the player has `divine.perceive.taste_the_wake` active for self-inspection). If a future "show divine wake on map" feature ships, Reveal's marks will participate automatically.

## 10. Wiring section (per `Docs/plans/wiring-checklist.md`)

| Surface | Touch point |
|---------|-------------|
| Orchestrator phase | None new. Effect resolution runs inside `unifiedActionResolution.ts` (already wired). Recede/Focus consumption runs at the start of the next ascendant action's resolve. |
| UI component | `ActionDrawer` (no code change — it picks up new self-tier templates from the existing template pool). Chronicle / NarrativeFeed (already wired for `essence_gain` and `intervention_effect`). |
| GameState flow | Two new optional fields on `AscendantProperties` (§4.5). `gameState.events` pushes `essence_gain` / `intervention_effect` entries as today. |
| Traces | Eight new trace shapes (§7). All under `category: 'self_action'`. |
| Debug visibility | `__DEBUG.fireAction` + `__DEBUG.listActions` work for the new IDs without code change. Inspector rows for the two pending buffs need ~6 lines added to the AscendantInspector component. |
| Player controls | Action drawer cards (no new control surface). Existing card-click → action-fire pipeline. |
| Prose pipeline (`enrichProse`) | Reveal's chronicle prose uses `{names_on_hex}` and `{topMortal}` enrichment placeholders. `{topMortal}` exists; verify `{names_on_hex}` at execution time and add if missing. |

## 11. NFP Compliance

| NFP | Status | Notes |
|-----|--------|-------|
| #1 Tunability | **PASS** | Eight named constants (§6); zero magic numbers in template bodies. |
| #2 Inspectability | **PASS** | Eight trace shapes (§7); all `category: 'self_action'` for easy filter. |
| #3 Determinism | **PASS** | No new PRNG calls — all four are pure-function applications of buffs/essence. Reveal's per-mortal loop iterates `mortalIds` in stable graph order. |
| #4 Fail-soft | **PASS** | Seven fail-soft cases handled (§8). Tick loop never crashes. |
| #5 Narrative over mechanical | **PASS** | No numbers in player-facing prose. Spell names + Threadbearer voice on chronicle entries. |
| #6 Additive over destructive | **PASS** | All field additions (§4.5) optional. No `GraphOpType` added (§4.1 reuse). No existing trace/template renamed. |
| #7 Performance budget | **PASS** | Stillness/Recede/Focus are O(1) per fire. Reveal's per-mortal loop is bounded by hex populace (~60 worst case); per-mortal `apply_influence` is O(1). Net well within per-action budget. |

## 12. Definition of done (inherits from issue body + this plan)

- [ ] Four templates exist in `src/data/unified-action-templates.ts` with the spec in §3.1–§3.4
- [ ] All four tagged `trayTier: 'self'` (Reveal: verify ordering vs rare override at execution time per §3.4 caveat)
- [ ] Eight named constants exist in `src/data/self-action-constants.ts` (or extension of existing constants file) per §6
- [ ] `nextActionDiscount` and `nextActionTierBoost` fields added to `AscendantProperties` (`src/types/influence.ts`) per §4.5
- [ ] Recede/Focus consumption logic wired in `unifiedActionResolution.ts` — checks the pending field at the start of every ascendant action resolve, clears on use, emits the `*.consumed` trace
- [ ] Reveal's per-mortal `apply_influence` loop wired in the resolver per §3.4
- [ ] Reveal's rival wake mark uses the existing `taste_the_wake` substrate (no new mechanism)
- [ ] Eight trace types added to `src/types/trace.ts` per §7
- [ ] Cross-type stacking guard (§2.2-Q3) emits the correct waste trace and info toast for both Recede-while-Focus-pending and Focus-while-Recede-pending
- [ ] Per-action unit tests in `src/engine/__tests__/unifiedActionResolution.test.ts` cover the happy path + the fail-soft case for each (Stillness at max essence; Recede consumed by next action; Focus tier-boost applied to next action; Reveal on empty hex)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` green
- [ ] `npx vite build` clean
- [ ] Engine smoke: `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium` reaches tick 30 cleanly (paste last ~10 lines)
- [ ] Browser screenshot at 1920×1080 showing the four cards in the action drawer's self tray tier
- [ ] Browser screenshot at 1920×1080 showing one action firing (Stillness or Reveal — Reveal is the more impressive demo)
- [ ] Console messages (errors+warnings) captured per the Definition of Done's browser-verify requirement
- [ ] `window.__DEBUG.listActions('@hero')` returns at least the four new IDs (paste into closing comment)
- [ ] If the Reveal `trayTier` ordering caveat (§3.4) requires a swap to `'rare'`, document the discovery in the closing comment + update this plan retroactively
- [ ] Update `Docs/plans/2026-04-16-systemic-wiring-guide.md` if the buff-consumption pattern introduces a new content-author-facing concept (likely yes — "one-shot pending buffs on the ascendant node")

## 13. Coordination block (for the handoff comment)

- **Suggested model:** `model:sonnet` — new content + engine wiring with judgment calls on effect shape, buff-stacking semantics, and prose voice. Not haiku-grade mechanical work; not opus-grade architectural redesign.
- **Parallel-safe with:** any work not editing `src/data/unified-action-templates.ts`, `src/types/influence.ts` (AscendantProperties), `src/engine/unifiedActionResolution.ts`, or `src/types/trace.ts`.
- **Mutex with:**
  - Any concurrent edit to `src/data/unified-action-templates.ts` (the four new entries append cleanly, but conflicts with concurrent template edits are easy to introduce)
  - Any concurrent edit to `src/types/influence.ts` AscendantProperties shape
- **Files to touch (planned):**
  - `src/data/unified-action-templates.ts` (additive — four entries)
  - `src/data/self-action-constants.ts` (new file)
  - `src/types/influence.ts` (additive — two optional fields on AscendantProperties)
  - `src/types/trace.ts` (additive — eight trace shapes)
  - `src/engine/unifiedActionResolution.ts` (additive — buff-consumption + Reveal per-mortal loop)
  - `src/engine/influence.ts` (extends `DECAY_CONSTANTS` with `.reveal`; adds `applyEssenceDelta` helper)
  - `src/data/__tests__/unified-action-templates.test.ts` (additive — fixture assertions)
  - `src/engine/__tests__/unifiedActionResolution.test.ts` (additive — four effect-path tests)
  - (Optional) `src/components/Game/AscendantInspector*.tsx` for the pending-buff rows
  - (Optional) `prose-layer-content.ts` if `{names_on_hex}` placeholder needs adding
- **Done when:** the §12 checklist passes and the closing commit body / Linear comment includes the verification evidence per `CLAUDE.md` §Definition of Done.
- **Codex review:** **no** — this is judgment-heavy content + engine wiring with several at-execution-time decisions (trayTier ordering caveat, prose enrichment placeholder discovery, function-returning-onSuccess pattern). CC's queue is the right home.

## 14. Open follow-ups (file separately if confirmed by execution-time playtest)

- **Buff expiry mechanism.** If players hoard Recede/Focus across many turns, add `buffMaxAge` constant + tick-decrement. File as a separate issue under Content Architecture if needed.
- **A fifth self-action.** Once the four ship and the `self` tray is populated, the audit's framing of "four shapes" may want a fifth — e.g. `Surge` (sphere-conversion: spend one sphere's essence, gain another's). Not in scope for THR-399; file under THR-390's parent roadmap if a fifth shape becomes desired.
- **Persona-archetype unlock paths for self-actions.** Per THR-390 §3 recommendation #11. THR-399 ships all four self-actions universally available. Future unlock-gating work (different ascendants start with different self-actions in their drawer) is tracked separately.

## 15. Brainstorm provenance

- Source: THR-390 §3 (Gaps) audit, 2026-05-09 (Cowork).
- Verdict: Christian, 2026-05-11, "yes, file."
- Coordination dependencies: THR-407 (Done), THR-396 (Done), THR-397 (Done).
- This plan: Cowork, 2026-05-12.

The three open verdict items from the issue body (names / Manifest radius / Concentrate stacking) are resolved here with proposals; Christian retains override authority at execution time. If any of the three need different choices, the executor can update before merge — the constants/IDs/strings are isolated.
