# Encounter Reward Wiring Design

> **Date:** 2026-03-26
> **Status:** Design (Cowork)
> **Backlog:** TB-052
> **Depends on:** Attachment system (complete), Encounter system (complete), Reward pool engine (complete)

---

## Problem

The reward pool engine (`rewardPool.ts`) and attachment type system (`attachments.ts`) are fully implemented and tested, but nothing connects them to the live game:

1. **No content** — Zero encounter templates define a `rewardPool` on any outcome (0 of 78 encounters).
2. **No orchestrator wiring** — `phaseEncounterProgressionV2` reads `result.outcome` but never calls `assembleRewardPool` / `drawFromPool`. The only reference is a narrative stub: `"earned a reward"`.
3. **No artifact instantiation** — `drawFromPool` returns the `nodeId` of an existing graph node. The 12 starter artifacts are pre-owned. Drawing one of them would create a second `possesses` edge to an already-owned item. There is no mechanism to instantiate a new artifact from a template.
4. **No UI** — No toast, panel, or event message tells the player what was earned.

This design wires all four gaps.

---

## Architecture Decision: Template Instantiation

The current graph treats artifacts as unique nodes. A `possesses` edge connects one agent to one artifact. The reward system needs to produce *new* items — you can't hand out the same Iron Blade to three different agents.

**Approach: Clone-from-template.** When a reward is drawn:
1. `drawFromPool` selects a template artifact node ID (as it does today).
2. A new function `instantiateReward` clones the template node with a unique ID (`reward_{agentId}_{tick}_{templateId}`), adds it to the graph, and creates a `possesses` edge from the agent.
3. The template node stays in the graph, unowned. It can be drawn again.

This keeps the existing pool assembly/draw logic unchanged — only the post-draw step is new.

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `REWARD_INSTANTIATE_PREFIX` | `'reward'` | ID prefix for instantiated reward nodes |
| `REWARD_EDGE_SOURCE` | `'encounter_reward'` | Source tag on possesses edge properties |

### Fail-soft

| Failure | Fallback |
|---------|----------|
| Template node not found in graph | Skip reward, emit warning trace, continue encounter |
| Empty pool (no matching candidates) | No reward drawn, no error — encounter completes normally |
| Pool draw returns null | Same as empty pool |
| Agent node not found | Skip reward, emit warning trace |

### PRNG

`drawFromPool` already takes a `roll: number`. The orchestrator must pass a seeded PRNG roll derived from `state.seed + state.tick + agentId hash`, consistent with the existing pattern in encounter resolution.

### Tracing

```typescript
interface RewardDrawTrace extends TraceEntry {
  category: 'encounter';
  event: 'reward_drawn';
  agentId: string;
  agentName: string;
  templateId: string;
  instanceId: string;
  templateName: string;
  tier: number;
  attachmentCategory: AttachmentCategory;
  poolSize: number;
  roll: number;
}
```

Also emit when pool is empty (event: `'reward_pool_empty'`) so designers can spot encounters that promise rewards but have no valid candidates.

---

## Module 1: `instantiateReward` (new function in `rewardPool.ts`)

```
instantiateReward(
  graph: WorldGraph,
  templateNodeId: string,
  recipientAgentId: string,
  tick: number,
): { instanceId: string; edgeId: string } | null
```

Behavior:
1. Look up template node. If missing → return null.
2. Clone node with ID `reward_{recipientAgentId}_{tick}_{templateNodeId}`.
3. Copy all properties from template. Add `source: 'encounter_reward'` and `acquiredTick: tick`.
4. `graph.addNode(clone)`.
5. Create edge from agent to clone — edge type depends on template node type:
   - **`artifact` node** → `possesses` edge. Properties: `modifiers` (from template `reachBonus`), `grants`, `tags`.
   - **`trait` node, `subcategory: 'condition'`** → `has_trait` edge. Properties: `level: 1`, `acquiredTick: tick`, `ticksRemaining` (from template or default 15), `totalTicks`, `source: 'encounter_reward'`, `modifiers` (from template `domainContributions`).
   - **`trait` node, `subcategory: 'bestowed'`** → `has_trait` edge. Properties: `level: 1`, `acquiredTick: tick`, `ticksRemaining: null` (permanent), `source: 'encounter_reward'`, `modifiers`.
6. Return `{ instanceId, edgeId, category }`.

---

## Module 2: Orchestrator Wiring (modify `phaseEncounterProgressionV2`)

After `resolveEncounter` returns and before the event is emitted, insert a reward block. This runs on **both success and failure** — the resolution outcome quality determines the tier curve and bad outcome chance, not whether the reward fires at all.

```
if (outcome.rewardPool) {
  // Determine tier curve based on resolution outcome quality
  const tierCurve = getTierCurveForOutcome(resolution.outcome); // see table below
  const effectiveRecipe = {
    ...outcome.rewardPool,
    tierCurve,  // override the template's tier curve with outcome-adjusted curve
  };
  const pool = assembleRewardPool(state.graph, effectiveRecipe);
  const roll = seededRandom(state.seed, state.tick, progress.actorId);

  // Bad outcome check: roll against badOutcomeChance
  const badRoll = seededRandom(state.seed, state.tick, progress.actorId, 'bad');
  const isBadOutcome = badRoll < effectiveRecipe.badOutcomeChance;

  if (isBadOutcome) {
    // Draw from harmful pool: wounds, curses, diseases
    const harmPool = assembleRewardPool(state.graph, {
      categoryWeights: { condition: 0.5, curse: 0.4, blessing: 0.1 },
      tierCurve,
      badOutcomeChance: 0,
    });
    // ... draw and instantiate harmful attachment
  } else {
    // Draw from beneficial pool as normal
    // ... draw and instantiate
  }
}
```

### Tier Curves by Resolution Outcome

From the original attachment system design — tier distributions shift dramatically based on outcome quality:

| Outcome | Mundane | Storied | Mythic | Legendary | Bad Chance |
|---------|---------|---------|--------|-----------|------------|
| Critical Success | 10% | 40% | 40% | 10% | 0% |
| Success | 40% | 40% | 15% | 0% | 5% |
| Failure | 20% | 10% | 5% | 0% | 65% |
| Critical Failure | 5% | 5% | 5% | 0% | 85% |

Key insight: even on failure, the *tier* of the consequence can be high. A Mythic-tier curse is more narratively interesting than a Mundane bruise. The bad outcome chance doesn't suppress tier — it redirects the category toward harmful attachments.

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `TIER_CURVE_CRITICAL_SUCCESS` | `{ 1: 0.10, 2: 0.40, 3: 0.40, 4: 0.10 }` | Best possible rewards |
| `TIER_CURVE_SUCCESS` | `{ 1: 0.40, 2: 0.40, 3: 0.15, 4: 0.05 }` | Standard rewards |
| `TIER_CURVE_FAILURE` | `{ 1: 0.20, 2: 0.10, 3: 0.05, 4: 0.0 }` | Mostly mundane |
| `TIER_CURVE_CRITICAL_FAILURE` | `{ 1: 0.05, 2: 0.05, 3: 0.05, 4: 0.0 }` | Low tier, high bad chance |
| `BAD_OUTCOME_CHANCE_CRIT_SUCCESS` | `0.0` | No bad outcomes on crit success |
| `BAD_OUTCOME_CHANCE_SUCCESS` | `0.05` | 5% chance of minor bad outcome |
| `BAD_OUTCOME_CHANCE_FAILURE` | `0.65` | Mostly bad outcomes |
| `BAD_OUTCOME_CHANCE_CRIT_FAILURE` | `0.85` | Almost certainly bad |

### Bad outcome category weights

When `isBadOutcome` is true, the category weights shift toward harmful attachments:

| Category | Weight | Examples |
|----------|--------|---------|
| `condition` (wounds) | 0.40 | Broken ribs, festering wound, concussion |
| `curse` | 0.30 | The Whispering Hunger, cursed mark, paranoia |
| `condition` (disease) | 0.20 | Plague-touched, blood fever, void sickness |
| `possession` (cursed item) | 0.10 | Cursed amulet that can't be discarded |

Tag filter `#wound OR #curse OR #disease` on bad outcome draws ensures only harmful templates are selected.

### Phase position

No new phase needed. This runs inside `phaseEncounterProgressionV2` immediately after `resolveEncounter`, before event emission. The reward is part of the encounter resolution, not a separate tick phase.

---

## Module 3: Content Authoring — Which Encounters Get Rewards

Not every encounter should drop loot. The encounter type is the primary signal:

| Encounter Type | Item Reward? | Rationale |
|----------------|-------------|-----------|
| `acquire` | **Yes** — primary loot encounters | Merchants Gambit, Relic Hunt, Rare Material, etc. |
| `steal` | **Yes** — taking things is the point | Pickpocket, Vault Heist, Grave Robbery, etc. |
| `trade` | **Yes** — exchange encounters | Caravan Deal, Guild Negotiation, Barter Survival |
| `explore` | **Sometimes** — discovery can find things | Deep Descent, Spirit Walk (final step only) |
| `create` | **Yes** — you made something | Brew Potion, Inscribe Ward, Craft Talisman |
| `duel` | **Rarely** — war trophy on final step | Trial by Combat, Arena Combat |
| `assist` | **Yes** — gratitude and consequences | Aid Refugees, Healer Aid, Militia Aid |
| `hire` / `lead` / `build` | **No** — social/structural, not loot-oriented | Recruit Militia, Rally Faithful, etc. |

### Recommended content pass

Add `rewardPool` to **both `onSuccess` and `onFailure`** of the final step for ~30 encounters. The recipe is the *same* on both outcomes — the tier curve and bad outcome chance shift based on the resolution result (see Module 2 tier curve table). This means:

- Success on a Relic Hunt → high chance of a Storied/Mythic possession, 5% bad chance
- Failure on a Relic Hunt → 65% chance of a wound/curse, small chance of salvaging a Mundane item
- Critical failure on a Vault Heist → 85% chance of a curse or wound, the vault's defenses punish you

Don't put reward pools on early steps — the final step is the payoff. Early steps build tension; the final step resolves it with consequences either way.

### Example recipes (templates only specify category weights + tag filters)

**Moderate acquire encounter:**
```typescript
rewardPool: {
  categoryWeights: { possession: 1.0 },
  tagFilters: [],
}
```

**Hard steal encounter (tomb setting):**
```typescript
rewardPool: {
  categoryWeights: { possession: 0.7, condition: 0.3 },
  tagFilters: ['#ancient', '#cursed', '#relic'],
}
```

**Explore / spirit walk:**
```typescript
rewardPool: {
  categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
  tagFilters: [],
}
```

Note: `tierCurve` and `badOutcomeChance` are **not** on the template — they're resolved at runtime from the outcome quality (see Module 2 tier curve table). This is a type change from the current `RewardPoolRecipe` interface, where both fields are required. See "Type change" note below.

### Tunable constants for content presets

Encounter templates only need to specify `categoryWeights` and `tagFilters` — the tier curve and bad outcome chance are determined at resolution time by the outcome quality (see Module 2 tier curve table). This keeps content authoring simple: the template says *what kind* of reward, the engine decides *how good* based on how well the agent did.

| Constant | Default | Purpose |
|----------|---------|---------|
| `REWARD_POOL_DEFAULT_TAG_FILTERS` | `[]` | No tag restriction (most encounters) |
| `REWARD_POOL_MOUNTAIN_TAGS` | `['#beast', '#survival', '#stone']` | Mountain encounter flavor |
| `REWARD_POOL_TOMB_TAGS` | `['#ancient', '#cursed', '#relic']` | Tomb/ruin encounter flavor |
| `REWARD_POOL_TRADE_TAGS` | `['#tool', '#provision', '#commercial']` | Trade encounter flavor |

### Type change: `RewardPoolRecipe`

The current interface requires `tierCurve` and `badOutcomeChance`. Under this design, those are resolved at runtime. The type should change:

- `tierCurve` → removed from `RewardPoolRecipe`, moved to a new `ResolvedRewardRecipe` (internal to the engine)
- `badOutcomeChance` → removed from `RewardPoolRecipe`, determined by `getTierCurveForOutcome`
- `RewardPoolRecipe` keeps only: `categoryWeights`, `tagFilters?`, `sphereTint?`
- New `ResolvedRewardRecipe` = `RewardPoolRecipe & { tierCurve, badOutcomeChance }` — constructed at resolution time

Existing tests that construct `RewardPoolRecipe` with `tierCurve` and `badOutcomeChance` will need updating. The `assembleRewardPool` function still takes a recipe with `tierCurve` — it receives a `ResolvedRewardRecipe`, not the template's `RewardPoolRecipe`.

---

## Module 4: Attachment Catalog Expansion

The reward pool draws from **three** drawable attachment categories — not just possessions. The `categoryWeights` field on `RewardPoolRecipe` already supports weighting across all of them, and `getCandidateNodes` maps each to graph node types:

| Attachment Category | Graph Node Type | Subcategory Filter | Existing Templates |
|--------------------|-----------------|--------------------|-------------------|
| `possession` | `artifact` | — | 12 (starter pack) |
| `condition` / `blessing` / `curse` | `trait` | `'condition'` | 4 (starter pack) |
| `bestowed_power` | `trait` | `'bestowed'` | 0 |
| `agreement` | — (edges) | — | Not drawable (returns empty) |

The starter pack (16 total) is nowhere near enough. After a few encounters the pool would draw the same templates repeatedly. The catalog needs expansion across all three drawable categories.

### Natural category mapping by encounter type

Different encounters should weight categories differently:

| Encounter Type | Primary Category | Secondary | Rationale |
|----------------|-----------------|-----------|-----------|
| `acquire` | possession (0.8) | condition (0.2) | You got a thing, maybe got hurt getting it |
| `steal` | possession (0.7) | condition (0.3) | Took something, risk of curse/wound |
| `trade` | possession (0.9) | condition (0.1) | Exchange — mostly items |
| `create` | possession (1.0) | — | You made a thing |
| `explore` | condition (0.4), bestowed_power (0.4) | possession (0.2) | Discovery changes you more than it equips you |
| `duel` | condition (0.6) | possession (0.4) | Wounds, emboldened, war trophy |
| `assist` | blessing (0.6) | condition (0.4) | Gratitude, divine favor |

### Distribution target for a healthy pool

**Possessions** (`artifact` nodes):

| Subcategory | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Total |
|-------------|--------|--------|--------|--------|-------|
| arms | 4 | 3 | 2 | 1 | 10 |
| vestments | 3 | 2 | 1 | 1 | 7 |
| tomes_scrolls | 3 | 2 | 1 | 1 | 7 |
| tools_instruments | 3 | 2 | 1 | 0 | 6 |
| relics_talismans | 2 | 2 | 2 | 1 | 7 |
| mounts_beasts | 3 | 2 | 1 | 0 | 6 |
| provisions | 4 | 2 | 1 | 0 | 7 |
| **Subtotal** | **22** | **15** | **9** | **4** | **50** |

**Conditions** (`trait` nodes, `subcategory: 'condition'`):

| Category | Tier 1 | Tier 2 | Tier 3 | Total |
|----------|--------|--------|--------|-------|
| wounds | 4 | 3 | 1 | 8 |
| blessings | 3 | 2 | 1 | 6 |
| curses | 2 | 2 | 1 | 5 |
| diseases | 2 | 1 | 1 | 4 |
| supernatural | 1 | 1 | 1 | 3 |
| **Subtotal** | **12** | **9** | **5** | **26** |

**Bestowed Powers** (`trait` nodes, `subcategory: 'bestowed'`):

| Tier 1 | Tier 2 | Tier 3 | Tier 4 | Total |
|--------|--------|--------|--------|-------|
| 4 | 3 | 2 | 1 | 10 |

**Grand total: ~86 attachment templates** (50 possessions + 26 conditions + 10 bestowed powers).

### Content file structure

New file `reward-attachment-catalog.ts` following the same `GraphNode[]` pattern as `starter-attachments.ts`, with three exported arrays: `REWARD_POSSESSIONS`, `REWARD_CONDITIONS`, `REWARD_BESTOWED_POWERS`. Loaded into the graph at world init alongside starter attachments.

### Instantiation note for conditions vs possessions

Conditions and bestowed powers work differently from possessions at the edge level:
- Possessions → `possesses` edge with `modifiers`, `grants`, `tags`
- Conditions → `has_trait` edge with `level`, `acquiredTick`, `ticksRemaining`, `totalTicks`, `source`, `modifiers`
- Bestowed powers → `has_trait` edge with `level`, `acquiredTick`, `source`, `modifiers` (no expiry — permanent)

The `instantiateReward` function must handle all three edge shapes. The template node's type (`artifact` vs `trait`) and subcategory determine which edge pattern to use.

---

## Module 5: God Nudge Window (Future — v2)

The original attachment design specifies a player interaction point between pool assembly and draw. After encounter resolution, the player sees 3–5 pool slots showing only tier color and category icon (not full details — veiled knowledge). The player can spend Influence Essence to nudge one candidate's weight up or another's down.

This reinforces the god fantasy — you're tipping scales, not choosing from a menu. It uses the existing intervention cost and detection risk systems.

**v1 skips this** — rewards draw automatically with no player interaction. The God Nudge is a natural v2 enhancement once the base reward pipeline is working and we can see how it feels. Flagging it here so the orchestrator wiring doesn't preclude it — the draw step should be structured so a "nudge weights" step can be inserted between pool assembly and draw without refactoring.

### Design sketch for v2

1. Pool assembles (3–5 candidates)
2. UI shows veiled slots: tier-colored border + subcategory glyph per slot
3. Player taps a slot to "nudge toward" (weight ×2.0) or taps "leave to fate"
4. Nudge costs Influence Essence (scaled by tier of the nudged slot)
5. Draw proceeds with adjusted weights
6. Detection risk applies — nudging is a divine intervention, other agents may notice

### Constants (v2)

| Constant | Default | Purpose |
|----------|---------|---------|
| `NUDGE_WEIGHT_MULTIPLIER` | `2.0` | How much a nudge increases a slot's weight |
| `NUDGE_ESSENCE_COST_PER_TIER` | `[0, 5, 10, 20, 40]` | Essence cost to nudge a T1/T2/T3/T4 slot |
| `NUDGE_DETECTION_RISK` | `0.15` | Base detection risk for nudging |
| `NUDGE_POOL_SIZE` | `[3, 5]` | Min/max candidates shown |

---

## Module 6: UI — Reward Event Display

### Event message enrichment

The existing `summarizeOutcome` function already checks `outcome.rewardPool`. Extend it to include the item name:

```
"earned Iron Blade (Tier 1 arms)" → "earned a reward" becomes specific
```

This requires passing the instantiated node's name back from the reward block to the event builder.

### Toast notification

For retinue agents (player's threaded agents), reward events should trigger a toast with the item name, tier color badge, and subcategory icon. The existing toast system (`notification: { channel: 'toast' }`) handles this — just enrich the event message.

### Agent detail panel

The agent detail panel should show possessions. This is a separate feature (attachment visibility) but reward wiring makes it urgent. Without it, the player earns items but can't see them anywhere. Minimal v1: a "Possessions" section in the agent info panel listing `possesses` edges with item name, tier badge, and subcategory.

---

## Expected Distribution on an Average Map

With ~30 reward-eligible encounters across the map and ~8 agents making decisions:

| Metric | Estimate | Notes |
|--------|----------|-------|
| Encounters attempted per agent per 50 ticks | ~6–10 | Based on current encounter frequency |
| Reward-eligible encounters (of those) | ~50% | acquire/steal/trade/create/explore/duel/assist types |
| Success rate on final steps | ~50% | Moderate difficulty, capability-dependent |
| **Attachment rewards per agent per 50 ticks** | **~2–3** | Not every agent reaches final step |
| **Total attachments entering economy per 50 ticks** | **~12–24** | Across all agents |

### Reward breakdown by category (estimated)

| Category | Share | Per 50 ticks (all agents) | Notes |
|----------|-------|--------------------------|-------|
| Possessions | ~40% | ~5–10 | acquire/steal/trade/create encounters |
| Conditions (wounds/curses) | ~25% | ~3–6 | duel failures, explore hazards, steal gone wrong |
| Conditions (blessings) | ~15% | ~2–4 | assist outcomes, explore discoveries |
| Bestowed powers | ~15% | ~2–4 | explore/spirit walk successes |
| Agreements | ~5% | ~1 | Future — not in v1 (edges, not nodes) |

### Tier distribution (weighted average across encounter difficulties)

| Tier | Share |
|------|-------|
| T1 (Mundane) | ~55% |
| T2 (Storied) | ~28% |
| T3 (Mythic) | ~13% |
| T4 (Legendary) | ~4% |

Compare to capability growth, which happens on *every* resolved encounter step (not just final, not just success). An agent might gain ~15–25 capability growth events in the same 50-tick window. Attachment rewards are rarer — they're the special moments, not the baseline progression. But unlike capability growth (which is invisible), items and conditions are *narratively visible* — they show up in event messages and (eventually) agent detail panels.

---

## Wiring

| Surface | Connection |
|---------|-----------|
| **Orchestrator** | Inserted into `phaseEncounterProgressionV2`, after `resolveEncounter`, before event emission. No new phase. |
| **UI rendering** | Event message enrichment in existing `summarizeOutcome`. Toast via existing notification channel. Agent detail panel needs possessions section (separate backlog item). |
| **GameState flow** | Reward adds nodes + edges to `state.graph`. No new GameState fields. |
| **Traces** | `reward_drawn` and `reward_pool_empty` under `encounter` category. |
| **Debug visibility** | Traces visible in trace panel. Graph inspector shows new artifact nodes + possesses edges. |
| **Prose pipeline** | Item name in event message. Future: `enrichProse()` integration for narrative flavor. |
| **Player controls** | None in v1 — rewards draw automatically. v2: God Nudge window between pool assembly and draw (see Module 5). |

---

## Implementation Order

1. **`instantiateReward` function** + unit tests — handles all three edge shapes (possesses, has_trait condition, has_trait bestowed). Pure function, no content dependencies.
2. **`getTierCurveForOutcome` + bad outcome routing** + unit tests — maps resolution outcome (success/failure/critical) to tier curve and bad outcome chance. Pure function.
3. **Orchestrator wiring** in `phaseEncounterProgressionV2` — insert reward block after `resolveEncounter`, covering both success and failure paths. Contract test: reward drawn → correct edge type exists on agent.
4. **Attachment catalog** (`reward-attachment-catalog.ts`) — ~86 templates (50 possessions + 26 conditions + 10 bestowed powers) + data tests + graph loader integration.
5. **Content pass** — add `rewardPool` recipes to both `onSuccess` and `onFailure` on ~30 encounter final steps. Category weights vary by encounter type (see Module 3 table).
6. **Event message enrichment** — specific attachment name + category in `summarizeOutcome`. Distinguish "earned Iron Blade" from "suffered Festering Wound".
7. **Agent possessions UI** — panel section showing owned attachments (can be separate backlog item).
8. **(v2) God Nudge window** — player interaction between pool assembly and draw.

Steps 1–3 are engine work. Step 4 is content authoring. Step 5 is a content editing pass. Steps 6–7 are UI. Step 8 is a future enhancement.

---

## NFP Compliance Summary

| Priority | NFP | Verdict |
|----------|-----|---------|
| 1 | Tunability | **PASS** — Tier curves, category weights, bad outcome chance all named constants. Recipe presets per difficulty tier. |
| 2 | Inspectability | **PASS** — `reward_drawn` trace with full draw context. `reward_pool_empty` for content debugging. |
| 3 | Determinism | **PASS** — `drawFromPool` takes seeded roll. Instance IDs derived from seed+tick+agent. |
| 4 | Fail-soft | **PASS** — Every failure case (missing template, empty pool, missing agent) has graceful fallback with warning trace. |
| 5 | Narrative > mechanical | **PASS** — Item names in event messages. Prose enrichment path identified for future. |
| 6 | Additive | **PASS** — `rewardPool` is an optional field on existing `EncounterOutcome`. No existing encounters broken. New catalog file, not modifications to existing content. |
| 7 | Performance | **PASS** — Pool assembly is O(artifacts in graph), expected <100. Runs only on encounter step completion, not every tick. |
