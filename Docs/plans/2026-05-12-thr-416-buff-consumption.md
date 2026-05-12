# THR-416 — Consume `nextActionDiscount` / `nextActionTierBoost` Buffs After Use

**Date:** 2026-05-12
**Linear:** [THR-416](https://linear.app/threadbare/issue/THR-416) — *Consume nextActionDiscount / nextActionTierBoost buffs after use (THR-399 deferral)*
**Project:** Rarity Model (parent project of THR-399 in the deferral chain — see §0 note)
**Parent / source:** [THR-399](https://linear.app/threadbare/issue/THR-399) (Done 2026-05-12) — self-actions Stillness, Recede, Focus, Reveal
**Brainstorm companion:** Inline §2 (the design is narrow enough that a separate brainstorm doc would be ceremony — open questions are listed and answered with proposed defaults in the same place).

## 0. Reading the issue forward

THR-399 shipped four self-actions. Two of them — **Recede** and **Focus** — set one-shot buffs on the ascendant node:

- `nextActionDiscount: number` — fraction of the next action's essence cost to refund (set by Recede, default `RECEDE_DISCOUNT_FRACTION = 0.5`).
- `nextActionTierBoost: number` — additive boost to the next action's effective rarity tier (set by Focus, default `FOCUS_TIER_BOOST = 1`).

**The storage is wired. Consumption is not.** Today the player fires Recede → next action still costs full essence; fires Focus → next action still resolves at the template's base rarity tier. The fields linger on the ascendant node and never clear. This issue wires the read / apply / clear cycle so the buffs actually do what their prose promises.

**Project note:** THR-416 is currently filed under "Rarity Model" (the project THR-399 was carved out of when self-actions were folded into the rarity recurve). That project is in `Done` status. The deferral is project-orphan-adjacent in spirit — finish-what-was-started work attached to a completed project. **Recommendation:** keep the project assignment as-is for traceability (it preserves the lineage from THR-399 → THR-416 in Linear), but flag for the user at handoff that this is a small one-off and not the start of new Rarity Model work. The "every issue belongs to a project" rule is satisfied; the project just happens to be in a terminal state.

## 1. Codesight pre-flight (Blast Radius)

**Files to touch:**

| File | Importer count | Risk note |
|------|---------------:|-----------|
| `src/types/unifiedAction.ts` | **30+ (high-impact)** | additive — one new optional field on `UnifiedAction`: `effectiveRarityTier?: RarityTier`. No removed/renamed fields. Existing consumers that read `template.rarityTier` directly continue to work unchanged. |
| `src/components/Game/GameView.tsx` | n/a (root) | additive — wrap the two existing essence-deduction blocks (around lines ~2560 and ~2576) in a buff-application helper. Same essence sphere, same setGameState shape — just the cost is post-discount and the new action carries `effectiveRarityTier`. |
| `src/components/Game/hooks/useAgentInteraction.ts` | ~12 | additive — same wrapping at the agent-targeted action-fire site (around line ~302 and ~347). |
| `src/data/agent-behavior-constants.ts` (or wherever THR-399 landed its constants — verify at execution time) | ~50 | additive — one new constant `MAX_EFFECTIVE_RARITY_TIER = 4` (clamps boosted tier so Focus on a tier-3 action becomes tier-4, not tier-5). |
| `src/types/trace.ts` | **156 (high-impact)** | additive — new trace category `'buff_consumed'` appended to existing trace type union. No rename/remove. Chronicle renderer falls back to neutral colour if no palette entry exists. |
| `src/engine/__tests__/buffConsumption.test.ts` (new) | n/a | new test file — unit-tests the buff-application helper, exhaustive matrix: {no buff, discount only, tier boost only, both} × {action with cost, free action}. |
| `src/components/Game/__tests__/buffConsumption-integration.test.tsx` (new) | n/a | new — integration test asserts that firing Focus then a tier-2 action produces a `UnifiedAction` with `effectiveRarityTier === 3` and the ascendant node has both buff fields cleared. |

**Two files with ≥100 importers** (`src/types/unifiedAction.ts` at 30+ — under threshold; `src/types/trace.ts` at 156). The `trace.ts` change is **additive only** — appending one variant to the trace category union. No removed/renamed fields. Per CLAUDE.md §Blast Radius the additive-only path means no escalation section is required, but the cascade-risk note: any exhaustive switch over trace categories needs the new arm. A grep at execution time confirms which renderers must update — likely just `uiColorPalette.ts` and the chronicle filter UI.

**Substrate rideability check** (verify each at execution time — the THR-399 PR landed hours before this plan was drafted; the working tree may not have pulled main yet):

| Claim | Where it should live | Verified-at-plan-time |
|------|----------------------|:--:|
| `nextActionDiscount?: number` field on `AscendantProperties` | `src/types/influence.ts` (THR-399 PR #254) | ⚠ via THR-399 PR — re-verify post-pull |
| `nextActionTierBoost?: number` field on `AscendantProperties` | `src/types/influence.ts` (THR-399 PR #254) | ⚠ via THR-399 PR — re-verify post-pull |
| `RECEDE_DISCOUNT_FRACTION` and `FOCUS_TIER_BOOST` constants exist | added by THR-399 (location TBD — `src/data/agent-behavior-constants.ts` or new self-action constants file) | ⚠ via THR-399 PR — re-verify post-pull |
| `UnifiedAction.essencePaid` is the snapshot field for "what was actually paid" | `src/types/unifiedAction.ts:869` | ✅ |
| `template.rarityTier` is read by `narrative.ts:455`, `phaseAttention.ts:47` (`rarityToThreat`), `encounter-contract-builder.ts:238` | grep'd 2026-05-12 | ✅ |
| `targetActions.ts:265` already copies `template.rarityTier` onto a per-action context — that's the natural site to substitute `effectiveRarityTier` | `src/engine/targetActions.ts:265` | ✅ |
| The two action-fire sites are `GameView.tsx:handleTargetAction` and `useAgentInteraction.ts:handleWheelSlotClick` | grep'd 2026-05-12 — two `essencePool` mutations in those two callbacks | ✅ |
| `mulberry32(seed + tick * 43)` PRNG pattern is the standard at action-fire sites | `useAgentInteraction.ts:292`, `GameView.tsx:2563` | ✅ |

**Substrate that does NOT exist and is NOT built in this issue:**

- A general buff queue or status-effect pipeline. The two one-shot fields are the only buff substrate. If a third buff-shaped self-action is added later, we revisit.
- An "effective rarity tier" field on the `UnifiedAction` (this issue introduces it as additive).
- A buff-stacking policy. Per THR-399's open question 3 ("Concentrate stacking — does it stack with Withdraw?"), the answer is: **both can be set simultaneously** because they are independent fields, but **neither stacks with itself** — firing Recede twice in a row simply overwrites the discount with the same value. See §2.2 for the stacking proposal.

## 2. Brainstorm companion — open questions resolved

### 2.1 Stacking policy (carries forward from THR-399 §"Concentrate stacking")

**Proposal:** Discount and boost are independent fields on independent buff slots, so a player who fires Recede and then Focus before firing a verb gets both effects on that verb (50% discount + 1 tier higher). Firing the same self-action twice overwrites the existing value with itself (idempotent at the same value, last-write-wins if values change). Both fields clear on the next action that consumes them — even if that action only consumes one (e.g. a 0-essence action triggers both clears, not just the boost). **Rationale:** the simpler invariant is "any divine action fired after the buff window consumes the window." Holding partial buffs across multiple actions opens edge-case bugs and is not promised by the prose.

**Override path:** if Christian prefers "each buff clears independently when its dimension is consumed", swap `clearAll` for `clearWhereApplicable` in the helper (see §3 step 4). Implementation cost is identical.

### 2.2 Discount on free actions

**Edge case:** Recede sets `nextActionDiscount = 0.5`. The player fires a free action (`essenceCost = 0`). Does the discount get consumed?

**Proposal:** **Yes** — the buff window is one-shot per *action initiated*, not per *essence spent*. A free action consumes both fields. Otherwise the player can "stack a discount forever" by always firing a free action first. This matches the prose ("the next verb costs less") rather than ("the next verb that costs essence").

### 2.3 Tier-boost cap

**Proposal:** New constant `MAX_EFFECTIVE_RARITY_TIER = 4`. Rarity tiers in the codebase today are 1 (Mundane) – 3 (Mythic). A Focus on a tier-3 action yields tier-4 effective. We leave headroom at 4 to allow future Focus-on-Manifest chains (Reveal is rarity 3, so Focus → Reveal would land at tier 4). Anything above 4 clamps. **Rationale:** narrative coherence — "the world bends a degree further" caps at "the world bends two degrees further" before the metaphor breaks down.

### 2.4 What about Stillness's regen?

**Out of scope.** THR-399's Stillness sets a pending-essence-regen flag consumed by `essenceIncome.ts` next tick. That consumption path is wired in THR-399 itself (verify in the merged PR; if missed, file as a sibling deferral). THR-416 covers only the two ascendant-buff fields, which are *per-action* not *per-tick*.

### 2.5 Open verdict for user

The four design proposals above (stacking, free-action behaviour, cap, Stillness scope) are defaults — implemented as written unless Christian overrides. Implementation cost to swap any one is small. None of them are gating.

## 3. Engine pillar

### 3.1 Schema additions

**`UnifiedAction`** (`src/types/unifiedAction.ts`):

```ts
export interface UnifiedAction {
  // ... existing fields ...
  /**
   * Rarity tier used for resolution flavour, narrative significance, and curator
   * threat rating — may differ from template.rarityTier when a one-shot tier-boost
   * buff (Focus / nextActionTierBoost) was consumed at action creation.
   * Falls back to template.rarityTier when unset.
   */
  readonly effectiveRarityTier?: RarityTier;
}
```

No new fields on `AscendantProperties` — `nextActionDiscount` and `nextActionTierBoost` already exist from THR-399.

### 3.2 Buff-application helper (new module)

Place at `src/engine/ascendantBuffs.ts` for testability (the helper has no React dependency and is called from two sites).

```ts
import type { WorldGraph } from './graph';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { RarityTier } from '../types/rarity';
import { MAX_EFFECTIVE_RARITY_TIER } from '../data/agent-behavior-constants';
import { emitTrace } from './traceBuffer';

export interface AppliedBuffResult {
  readonly effectiveCost: number;
  readonly effectiveRarityTier?: RarityTier;
  readonly consumedDiscount: boolean;
  readonly consumedTierBoost: boolean;
}

/**
 * Apply one-shot ascendant buffs (`nextActionDiscount`, `nextActionTierBoost`)
 * to a pending action. Returns the discounted cost and the boosted rarity tier,
 * and CLEARS both fields on the ascendant node regardless of whether the action
 * had a cost or could benefit from the boost. See §2.1, §2.2 for the
 * "any-action-consumes-all-buffs" invariant.
 *
 * Emits a trace per consumed buff for chronicle visibility (see §5).
 */
export function applyAscendantBuffs(
  graph: WorldGraph,
  ascendantId: string,
  template: UnifiedActionTemplate,
  tick: number,
): AppliedBuffResult {
  const ascendant = graph.getNode(ascendantId);
  const props = ascendant?.properties ?? {};
  const discount = (props.nextActionDiscount as number | undefined) ?? 0;
  const boost = (props.nextActionTierBoost as number | undefined) ?? 0;

  const baseCost = template.essenceCost ?? 0;
  const effectiveCost = Math.max(0, Math.floor(baseCost * (1 - discount)));
  const effectiveRarityTier = boost > 0
    ? Math.min(MAX_EFFECTIVE_RARITY_TIER, template.rarityTier + boost) as RarityTier
    : undefined;

  const consumedDiscount = discount > 0;
  const consumedTierBoost = boost > 0;

  if (consumedDiscount || consumedTierBoost) {
    // Mutate in place — touchWorld() is called by the caller after setGameState.
    if (ascendant) {
      delete ascendant.properties.nextActionDiscount;
      delete ascendant.properties.nextActionTierBoost;
    }
    // Traces for chronicle / debug visibility (§5).
    if (consumedDiscount) {
      emitTrace({
        category: 'buff_consumed',
        tick,
        actorId: ascendantId,
        subtype: 'recede_discount',
        templateId: template.id,
        baseCost,
        effectiveCost,
        discountFraction: discount,
      });
    }
    if (consumedTierBoost) {
      emitTrace({
        category: 'buff_consumed',
        tick,
        actorId: ascendantId,
        subtype: 'focus_tier_boost',
        templateId: template.id,
        baseTier: template.rarityTier,
        effectiveTier: effectiveRarityTier!,
        boost,
      });
    }
  }

  return { effectiveCost, effectiveRarityTier, consumedDiscount, consumedTierBoost };
}
```

### 3.3 Call sites — wire `applyAscendantBuffs` at both action-fire paths

**Site 1 — `GameView.tsx:handleTargetAction` (~line 2560):**

Replace:
```ts
const essenceCost = template.essenceCost ?? 0;
const sphere = template.sphereAffinity ?? archetype.sphereAlignment.primary;
// ... createUnifiedAction({ ..., essencePaid: essenceCost })
// ... newPool[sphere] = Math.max(0, (newPool[sphere] ?? 0) - essenceCost);
```

With:
```ts
const buffResult = applyAscendantBuffs(gameState.graph, gameState.ascendantId, template, gameState.tick);
const essenceCost = buffResult.effectiveCost;
const sphere = template.sphereAffinity ?? archetype.sphereAlignment.primary;
// ... createUnifiedAction({ ..., essencePaid: essenceCost, effectiveRarityTier: buffResult.effectiveRarityTier })
// ... newPool[sphere] = Math.max(0, (newPool[sphere] ?? 0) - essenceCost);
// (After setGameState completes, the caller must touchWorld(runtime) since we mutated the ascendant node's properties.)
```

**Site 2 — `useAgentInteraction.ts:handleWheelSlotClick` (~line 290–370):**

Same shape — wrap the `template.essenceCost ?? 0` reads in a single `applyAscendantBuffs` call, pass `effectiveRarityTier` into `createUnifiedAction`, deduct the post-discount cost from the essence pool, and `touchWorld(runtime)` after setGameState.

### 3.4 Wire `effectiveRarityTier` into the four read sites

Only the *resolved effect*'s rarity should be boosted. Reads of `template.rarityTier` at action-creation-context-building time are the targets:

| File | Line(s) | Change |
|------|---------|--------|
| `src/engine/narrative.ts` | 455 | `rarityTier: action.effectiveRarityTier ?? template.rarityTier` |
| `src/engine/phaseAttention.ts` | 47 (`rarityToThreat`) | accept `effectiveRarityTier ?? rarityTier` (the call sites need the action, not the template, so plumb) |
| `src/engine/encounter-contract-adapter.ts` | 151 | `rarityTier: action.effectiveRarityTier ?? payload.rarity_tier` |
| `src/engine/targetActions.ts` | 265 | `rarityTier: action.effectiveRarityTier ?? template.rarityTier` |

Reads that should **NOT** use `effectiveRarityTier`:

- `src/engine/ascendantTray.ts:45` (`classifyTrayTier`) — tray classification is about the template's intrinsic significance, not per-action.
- `src/testing/contentInvariants.ts:127–128` — content validation invariants test template shape, not action runtime.
- `src/components/Codex/codexRegistry.ts:246, 273, 304` — Codex documents the template, not the action.

### 3.5 Tick phases

**No new tick phase.** The buff lifecycle is entirely synchronous — set by Recede/Focus resolution (action initiation), consumed at the next action-fire site. The orchestrator does not need to know about these fields.

### 3.6 PRNG callouts

The buff-application helper is **deterministic** — it reads, computes, mutates. No PRNG consumption. The PRNG is still consumed at the existing `mulberry32(gameState.seed + gameState.tick * 43)` line for the next action's resolution; that pattern is preserved unchanged.

### 3.7 Constants table (§NFP 1)

| Constant | Default | Where used | Purpose |
|----------|---------|------------|---------|
| `RECEDE_DISCOUNT_FRACTION` | 0.5 | set by Recede resolution (THR-399 — verify present) | fraction refunded from next action's essence cost |
| `FOCUS_TIER_BOOST` | 1 | set by Focus resolution (THR-399 — verify present) | additive boost to next action's rarity tier |
| `MAX_EFFECTIVE_RARITY_TIER` | 4 | `applyAscendantBuffs` clamp | upper bound on boosted rarity tier |

Tuning: changing the floor of any of these is a one-line edit, no logic change. NFP #1 PASS.

### 3.8 Tracing (§NFP 2)

New trace category `buff_consumed` appended to `src/types/trace.ts` union:

```ts
export type TraceCategory =
  | 'strategic_action_started'
  | /* ... existing variants ... */
  | 'buff_consumed';

export interface BuffConsumedTrace {
  category: 'buff_consumed';
  tick: number;
  actorId: string;          // the ascendant
  subtype: 'recede_discount' | 'focus_tier_boost';
  templateId: string;       // the action that consumed the buff
  // recede_discount payload:
  baseCost?: number;
  effectiveCost?: number;
  discountFraction?: number;
  // focus_tier_boost payload:
  baseTier?: RarityTier;
  effectiveTier?: RarityTier;
  boost?: number;
}
```

Visible in:

- `__DEBUG.getTraces()` — programmatic introspection
- ChroniclePanel (with renderer entry in §6 UI)
- DebugPanel trace tab — filterable by `buff_consumed`

### 3.9 Fail-soft table (§NFP 4)

| Failure case | Fallback |
|--------------|----------|
| `ascendant` node missing from graph | Helper returns `{ effectiveCost: baseCost, effectiveRarityTier: undefined, consumed*: false }` — action fires at base cost / base tier. Log `console.warn` once per session. |
| `nextActionDiscount` is `NaN` / negative / > 1 | Clamp to `[0, 1]` before applying. Negative becomes 0 (no discount), > 1 becomes 1 (full refund). |
| `nextActionTierBoost` is `NaN` / negative | Treat as 0 (no boost). |
| Trace emit throws | Caught by `emitTrace`'s existing try/catch; action proceeds. |
| The ascendant has the buff field set to `0` (not `undefined`) | `consumedDiscount = false` (no discount applied), but the field is still cleared (cleanup is idempotent — `delete` on a 0-valued key is fine). Trace not emitted (no effect to log). |

NFP #4 PASS.

### 3.10 Determinism (§NFP 3)

The helper is pure (modulo the graph mutation). Same ascendant state + same template → same `AppliedBuffResult`. The graph mutation is local to the ascendant node and bracketed by `touchWorld` at the call site. NFP #3 PASS.

## 4. Content pillar — **N/A**

This issue introduces no new prose, no new encounter templates, no new attachment content, no new data tables. The four self-actions' template content was authored in THR-399 and is already in main.

**One-line opportunistic add:** the chronicle event message for a *buffed* action could include "(with Focus)" or "(after Recede)" as a parenthetical when `effectiveRarityTier` or `consumedDiscount` are set. This is a five-line change at the existing `recentEvents` push site in both call sites. **Recommended scope:** include the parenthetical in Phase 1; if it reads awkwardly in playtest, drop it as a one-line revert. See UI pillar §5.2.

## 5. UI pillar

### 5.1 Existing surfaces (no new modal needed)

The four player-visible surfaces for buff consumption all exist:

| Surface | Pre-existing? | Wiring needed for THR-416 |
|---------|:--:|----------------------------|
| Essence pool number in the top bar | ✅ | None — automatic; deduction is post-discount. Player sees the smaller deduction. |
| ChroniclePanel narrative entries | ✅ | Optional parenthetical (§5.2). |
| Toast notification on action fire (`useAgentInteraction.ts` line ~329 already builds one) | ✅ | Optional badge (§5.3). |
| DebugPanel Traces tab — filterable | ✅ | Automatic once `buff_consumed` is added to the trace category union; filter UI picks up the new value from `Object.values(TraceCategory)` or similar. |
| InterventionConfirm cost preview | ✅ | **Cost preview should reflect discount.** See §5.4 — the player should know before confirming that this action will cost half. |

### 5.2 ChroniclePanel parenthetical

Append `' (with Focus)'` / `' (after Recede)'` to the action's narrative event message when `buffResult.consumedTierBoost` / `buffResult.consumedDiscount` is true.

Acceptance: the chronicle entry reads, e.g., *"The Ascendant inspires Kael Thornweaver to defy his vow — with Focus, the inspiration takes deeper root."* — the parenthetical is short, in-voice, and doesn't bury the action.

If both buffs were consumed: *"... — with Focus, after Recede."* (two-clause join).

### 5.3 Toast badge (optional, Phase 2 candidate)

If playtest shows the parenthetical is missed, add a small Focus / Recede badge to the toast in `useAgentInteraction.ts:331`. **Phase 1 ships without this** — the parenthetical and the InterventionConfirm preview together should be enough.

### 5.4 InterventionConfirm cost preview

`src/components/Game/InterventionConfirm.tsx` shows the essence cost (line ~208) before the player confirms. If a discount buff is live, the preview should show:

- The discounted cost as the primary number
- The base cost struck through, smaller, beside it: `~~10~~ 5 essence (-50% Recede)`

This requires reading `ascendant.properties.nextActionDiscount` in the confirm panel's render path. Already has access to `gameState.graph` via props. One-screen change.

Similarly, when a tier-boost buff is live, the rarity tier indicator on the action card / confirm panel should show the boosted tier — `Tier 2 → 3 (Focus)`.

### 5.5 HexMap signifiers — **N/A**

No hex-map visual treatment needed. The buff is on the ascendant, not on the world.

### 5.6 Browser-verify artifact (Definition of Done)

Closing commit must include:

1. **Screenshot at 1920×1080** of the InterventionConfirm panel showing the discounted-cost preview after Recede has been fired. Captured via `mcp__playwright__preview_resize(1920, 1080)` then `preview_screenshot`. The modal is DOM, not WebGL, so Playwright is correct.
2. **Console output** via `mcp__playwright__browser_console_messages` (errors + warnings) — pasted as fenced block. `(no errors or warnings)` is a valid result.
3. **State assertion via `__DEBUG`**:
   ```js
   await window.__DEBUG.fireAction(ascendantId, 'divine.self.recede');
   const before = gameState.graph.getNode(ascendantId).properties.nextActionDiscount;
   // before === 0.5
   await window.__DEBUG.fireAction(<some_target_agent>, 'divine.charm.heart');
   const after = gameState.graph.getNode(ascendantId).properties.nextActionDiscount;
   // after === undefined
   const traces = await window.__DEBUG.getTraces();
   const buffTraces = traces.filter(t => t.category === 'buff_consumed');
   // buffTraces.length === 1; buffTraces[0].subtype === 'recede_discount'
   ```

### 5.7 Wiring section (`Docs/plans/wiring-checklist.md`)

| Module | Orchestrator phase? | UI component? | GameState? | Traces? | Debug visible? | Prose enrichProse()? | Player controls? |
|--------|---|---|---|---|---|---|---|
| `applyAscendantBuffs` helper | n/a (call-site invocation, not a phase) | InterventionConfirm preview, Chronicle parenthetical | reads / mutates `graph.nodes[ascendantId].properties.{nextActionDiscount,nextActionTierBoost}`; writes `unifiedActions[].effectiveRarityTier` | `buff_consumed` | DebugPanel Traces tab | not needed — chronicle event message is the prose surface | the buff is consumed automatically on next action — no new control |

No update to `wiring-checklist.md` needed (no new orchestrator phase, no new modal, no new GameState top-level field). The helper is a leaf function called from two existing sites.

## 6. NFP Compliance

| Priority | Status | Notes |
|----------|--------|-------|
| 1. Tunability | PASS | All three buff numbers are named constants (`RECEDE_DISCOUNT_FRACTION`, `FOCUS_TIER_BOOST`, `MAX_EFFECTIVE_RARITY_TIER`). |
| 2. Inspectability | PASS | `buff_consumed` trace per consumption; visible in DebugPanel, queryable via `__DEBUG.getTraces()`. |
| 3. Determinism | PASS | Helper is pure. No PRNG. Same graph state + same template = same result. |
| 4. Fail-soft | PASS | See §3.9. Missing ascendant, NaN values, negative values, trace failure — all handled with graceful fallback. |
| 5. Narrative over mechanical perfection | PASS | The ChroniclePanel parenthetical foregrounds the *story* of the buff ("with Focus..."), not the numbers. |
| 6. Additive over destructive | PASS | One new optional field on `UnifiedAction` (`effectiveRarityTier`). No removals. No renames. Existing consumers that read `template.rarityTier` continue to work — only the four targeted call sites switch to `action.effectiveRarityTier ?? template.rarityTier`. |
| 7. Performance budget | PASS | Buff application is two property reads + arithmetic + two `delete` calls + at most two trace emits, executed once per player-initiated action (i.e., ≤ 5 times per minute in heavy play). Zero performance risk. |

## 7. Definition of Done

- [ ] `applyAscendantBuffs` helper in `src/engine/ascendantBuffs.ts` with unit tests.
- [ ] Both action-fire sites (`GameView.tsx:handleTargetAction`, `useAgentInteraction.ts:handleWheelSlotClick`) consume the helper, deduct discounted essence, pass `effectiveRarityTier` to `createUnifiedAction`, and call `touchWorld(runtime)` post-setGameState.
- [ ] `MAX_EFFECTIVE_RARITY_TIER = 4` constant added next to RECEDE/FOCUS constants.
- [ ] `buff_consumed` trace category appended to `src/types/trace.ts` union (and `TraceCategory` array if one exists).
- [ ] `UnifiedAction.effectiveRarityTier?: RarityTier` field added.
- [ ] Four read sites (`narrative.ts:455`, `phaseAttention.ts:47`, `encounter-contract-adapter.ts:151`, `targetActions.ts:265`) updated to prefer `action.effectiveRarityTier`.
- [ ] InterventionConfirm shows discounted-cost preview when buff is live (struck-through base, primary discounted, parenthetical reason).
- [ ] ChroniclePanel narrative entry includes parenthetical when buff was consumed.
- [ ] Unit test covers each of the four matrix cells: {no buff, discount only, tier boost only, both} × {action with cost, free action}.
- [ ] Integration test covers Focus → next action: assert `effectiveRarityTier === template.rarityTier + 1`, assert both ascendant fields cleared post-fire.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm test` green.
- [ ] CLI 30-tick smoke (CLAUDE.md §Testing pre-commit step 6 — engine change) — paste last ~10 status lines.
- [ ] Browser-verify artifact (§5.6) in closing commit body or Linear completion comment.
- [ ] Linear completion comment with `Fixes THR-416` in the commit body for auto-close.

## 8. Coordination block (for the Linear handoff comment)

- **Suggested model:** **`model:sonnet`** (mechanical wiring with two judgment calls — the parenthetical voice and the cost-preview UI layout). No new content authoring required; no novel system design. Sonnet's depth-of-judgment is sufficient.
- **Parallel-safe with:** any work outside `src/engine/`, `src/components/Game/GameView.tsx`, `src/components/Game/hooks/useAgentInteraction.ts`, `src/components/Game/InterventionConfirm.tsx`, `src/types/trace.ts`, `src/types/unifiedAction.ts`. In particular, parallel-safe with all encounter content authoring (THR-401, THR-400, THR-405, THR-409), all infrastructure / docs / vault work.
- **Mutex with:** anything touching the two action-fire sites listed above, or `unifiedAction.ts` schema changes. If THR-412 (intent-judge calibration) or THR-405 (rulebook cadence) try to touch trace categories simultaneously, serialise.
- **Codex review:** **yes** — small, mechanical, well-bounded. Codex's structural review will catch any missed read site for `effectiveRarityTier` and verify the test matrix is complete.
- **Files to touch:**
  - `src/engine/ascendantBuffs.ts` (new)
  - `src/types/unifiedAction.ts` (additive field)
  - `src/types/trace.ts` (additive variant)
  - `src/data/agent-behavior-constants.ts` (new constant)
  - `src/components/Game/GameView.tsx` (call site wrap)
  - `src/components/Game/hooks/useAgentInteraction.ts` (call site wrap)
  - `src/components/Game/InterventionConfirm.tsx` (cost preview)
  - `src/engine/narrative.ts`, `src/engine/phaseAttention.ts`, `src/engine/encounter-contract-adapter.ts`, `src/engine/targetActions.ts` (read-site updates)
  - `src/engine/__tests__/ascendantBuffs.test.ts` (new)
  - `src/components/Game/__tests__/buffConsumption-integration.test.tsx` (new)
- **Done when:** all DoD boxes in §7 are ticked and the closing commit body contains `Fixes THR-416`.

## 9. Vision audit

No conflict with `Vision/02-non-negotiables.md` or the taste profile — this issue *implements the prose already promised* by Recede and Focus. It does not introduce new player-facing mechanics, only completes a half-wired one. No Vision premise contradicts; no Vision edit is needed.

## 10. Why this is small but worth doing well

It would be tempting to ship this as a one-line patch in each call site. The reason for the helper + the four read sites is:

1. **The current shape of `nextActionTierBoost` is dead code.** It's set but never read. A patch that "consumes" it without wiring the four reads is just clearing the field — the player still feels no difference. The downstream-read updates are the *point*.
2. **Two call sites diverging.** Without a shared helper, GameView and useAgentInteraction will drift in subtle ways (already happens — see `essence_gain` event id format differences between them).
3. **The trace + chronicle parenthetical is what makes the buff *felt* by the player.** Without it, the player invests two turns in Recede + Focus and sees no acknowledgement when their main action fires.

Shipping all three together — helper, read-site wiring, narrative surfacing — turns a dead-code field into a felt feature in a single PR.

---

*Filed by Cowork 2026-05-12 — autonomous scheduled-task pickup. Open questions (§2.5) are defaulted; user can override at execution time or via comment before CC pulls.*
