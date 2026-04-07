# Fill T4 Legendaries — Systems Audit

**Source:** `Docs/plans/attachments/fill-t4-legendaries-revised.md`
**Date:** 2026-04-07
**Auditor:** Claude Code (systems pass)

---

## Audit Methodology

Each item was checked against:
- `src/types/effects.ts` — exact interface shapes for every effect type used
- `src/data/effect-constants.ts` — all balance constants
- `src/data/reward-attachment-catalog.ts` — duplicate ID scan
- `src/types/attachments.ts` — `PossessionNodeProperties` shape

---

## Constants Reference (from `effect-constants.ts`)

| Constant | Value |
|----------|-------|
| `MAX_EFFECTS_PER_ATTACHMENT` | **6** |
| `EFFECT_PER_ITEM_CAP` | **0.15** |
| `AURA_MAX_RADIUS` | **2** |
| `CASCADE_MAX_DEPTH` | **3** |
| `CASCADE_MAX_EFFECTS` | **8** |

---

## Item-by-Item Findings

---

### Tool 1: The Trembling Needle (`reward_tools_instruments_the_trembling_needle`)

**Effect count:** 5 — PASS (cap: 6)

**ID duplicate check:** Not present in `reward-attachment-catalog.ts` — PASS

#### Effect-by-effect analysis

| # | Draft effect | Verdict | Notes |
|---|-------------|---------|-------|
| 1 | `{ type: 'passive', reach: 'eye', value: 0.08 }` | PASS | Valid `PassiveEffect`. Within EFFECT_PER_ITEM_CAP (0.08 ≤ 0.15). |
| 2 | `{ type: 'passive', reach: 'veil', value: 0.05 }` | PASS | Valid. Within cap. |
| 3 | `{ type: 'reveal', target: 'encounters', range: 3 }` | PASS | Valid `RevealEffect` — `target: 'encounters'` is in the union, `range: number` is valid. |
| 4 | `{ type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.03 }` | PASS | `'in_exploration'` is a valid `EffectCondition`. |
| 5 | `{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'awareness_range_bonus', value: 2, ticks: 'permanent' }` | **FAIL** | See finding below. |

**Finding — Effect 5 (`modify_rules`):**

The interface is:
```typescript
export interface ModifyRulesEffect {
  readonly type: 'modify_rules';
  readonly scope: EffectScope;
  readonly rule: RuleOverrideKey;
  readonly value: number | boolean | string | { from: ReachDomain; to: ReachDomain };
  readonly ticks: number | 'permanent';
}
```

The `EffectScope` union is:
```typescript
| { scope: 'self' }
| { scope: 'target' }
| { scope: 'hex'; target: 'self' | 'target' }
| { scope: 'radius'; hexes: number }
| { scope: 'region'; regionId: string | 'self_region' }
| { scope: 'faction'; faction: string | 'self' | 'enemy' }
| { scope: 'biome'; biome: string }
| { scope: 'global' }
```

The draft writes `{ scope: 'self' }` — this is **correct**. `scope: { scope: 'self' }` matches the `EffectScope` member `{ scope: 'self' }`.

The `rule: 'awareness_range_bonus'` is a valid `RuleOverrideKey`. The `value: 2` is a valid number. The `ticks: 'permanent'` is valid.

**Re-verdict: PASS.** The scope object shape is correct. Initial FAIL was a misread — the field name `scope` as a key on `ModifyRulesEffect` wraps an `EffectScope` value (which itself has a `scope` property). The result `{ scope: { scope: 'self' } }` is structurally correct.

**Balance check:**
- Passive total: Eye 0.08 + Eye 0.03 (conditional) + Veil 0.05 = max 0.11 Eye, 0.05 Veil
- All individual values within EFFECT_PER_ITEM_CAP (0.15)
- Note: `modify_rules` with `awareness_range_bonus: 2` and `RangeModifierEffect` with `awarenessRangeBonus` both exist as mechanisms. The item correctly uses `modify_rules` (rule override registered on GameState), not `range_modifier` (query-layer only). These are different integration points. Using `modify_rules` for a permanent global rule override is appropriate for a T4 legendary.

**Verdict: PASS**

---

### Tool 2: The Anvilbone (`reward_tools_instruments_the_anvilbone`)

**Effect count:** 5 — PASS (cap: 6)

**ID duplicate check:** Not present in `reward-attachment-catalog.ts` — PASS

#### Effect-by-effect analysis

| # | Draft effect | Verdict | Notes |
|---|-------------|---------|-------|
| 1 | `{ type: 'passive', reach: 'stone', value: 0.10 }` | PASS | At EFFECT_PER_ITEM_CAP. |
| 2 | `{ type: 'passive', reach: 'star', value: 0.04 }` | PASS | Within cap. |
| 3 | `{ type: 'conditional', condition: 'at_home_territory', reach: 'stone', value: 0.03 }` | PASS | `'at_home_territory'` is a valid `EffectCondition`. |
| 4 | `{ type: 'create_structure', what: 'landmark', onHex: 'self', permanent: true, properties: { name: 'Anvilbone Foundation', subtype: 'shrine' } }` | **FAIL** | See finding below. |
| 5 | `{ type: 'axiological_drift', axis: 'loyalty_ambition', ratePerTick: 0.005, limitValue: 0.40 }` | PASS | Valid `AxiologicalDriftEffect`. |

**Finding — Effect 4 (`create_structure`):**

The actual `CreateStructureEffect` interface is:
```typescript
export interface CreateStructureEffect {
  readonly type: 'create_structure';
  readonly what: 'location' | 'sublocation' | 'landmark' | 'trade_route' | 'barrier';
  readonly subtype?: string;
  readonly onHex: 'self' | 'target';
  readonly permanent: boolean;
  readonly ticks?: number;
  readonly properties?: Record<string, unknown>;
  readonly connectTo?: string;
}
```

The draft uses `what: 'landmark'` — valid. `onHex: 'self'` — valid. `permanent: true` — valid. The `properties` field accepts `Record<string, unknown>` so `{ name: 'Anvilbone Foundation', subtype: 'shrine' }` is valid.

**However:** The `subtype` field is a top-level property on `CreateStructureEffect`, not only inside `properties`. The draft puts `subtype: 'shrine'` inside `properties` rather than at the top level. This is not a TypeScript error (since `properties` is `Record<string, unknown>`), but it is inconsistent with the intended schema — the top-level `subtype` is the canonical field for the engine to read the structure type.

**Fix required:** Move `subtype` to the top level and keep `properties` for additional metadata:
```typescript
{
  type: 'create_structure',
  what: 'landmark',
  subtype: 'shrine',
  onHex: 'self',
  permanent: true,
  properties: { name: 'Anvilbone Foundation' }
}
```

**Verdict: PASS WITH CAVEAT** — shape is valid TypeScript but `subtype` placement is semantically wrong.

**Balance check:**
- Passive: Stone 0.10 + Stone 0.03 (conditional) + Star 0.04 = max 0.13 Stone, 0.04 Star
- EFFECT_PER_ITEM_CAP: Stone 0.10 is at the cap. Conditional 0.03 is well within.
- `create_structure` is a structural effect (no modifier value), no cap concern.

---

### Provision 1: The Quiet Cup (`reward_provisions_the_quiet_cup`)

**Effect count:** 5 — PASS (cap: 6)

**ID duplicate check:** Not present in `reward-attachment-catalog.ts` — PASS

#### Effect-by-effect analysis

| # | Draft effect | Verdict | Notes |
|---|-------------|---------|-------|
| 1 | `{ type: 'passive', reach: 'star', value: 0.08 }` | PASS | Within cap. |
| 2 | `{ type: 'passive', reach: 'heart', value: 0.06 }` | PASS | Within cap. |
| 3 | `{ type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'per_tick', condition: 'reach_above:star:0.10' }` | PASS | See notes. |
| 4 | `{ type: 'aura', radius: 1, target: 'allies', reach: 'heart', value: 0.02 }` | PASS | radius 1 ≤ AURA_MAX_RADIUS (2). |
| 5 | `{ type: 'action_gate', mode: 'block', reach: 'iron' }` | PASS | Valid `ActionGateEffect`. |

**Effect 3 notes (`resource_manipulate`):**

The interface is:
```typescript
export interface ResourceManipulateEffect {
  readonly type: 'resource_manipulate';
  readonly resource: 'essence' | 'quintessence';
  readonly target: 'self' | 'other_agent';
  readonly amount: number;
  readonly mode: 'per_tick' | 'one_shot';
  readonly condition?: EffectPredicate;
}
```

`condition: 'reach_above:star:0.10'` matches the `ParameterizedCondition` pattern `` `reach_above:${string}:${string}` `` — PASS.

**Balance concern:** `amount: 1` per tick is essence restoration. At 12 ticks/day this is 12 essence/day while the condition is met. This is a strong T4 legendary power. No hard constant prohibits it, but it should be noted as high-value. The condition gate (`star > 0.10`) provides meaningful gating.

**Aura note:** `AuraEffect` does not have a `scope` field (unlike most other effects). The interface only has `radius`, `target`, `reach`, `value`. The draft correctly omits scope — PASS.

**Verdict: PASS**

---

### Provision 2: The Last Harvest (`reward_provisions_the_last_harvest`)

**Effect count:** 5 — PASS (cap: 6)

**ID duplicate check:** Not present in `reward-attachment-catalog.ts` — PASS

#### Effect-by-effect analysis

| # | Draft effect | Verdict | Notes |
|---|-------------|---------|-------|
| 1 | `{ type: 'passive', reach: 'iron', value: 0.07 }` | PASS | Within cap. |
| 2 | `{ type: 'passive', reach: 'stone', value: 0.06 }` | PASS | Within cap. |
| 3 | `{ type: 'tag_immunity', tags: ['poison', 'disease', 'blight'] }` | PASS | Valid `TagImmunityEffect`. `tags` is `readonly string[]`, draft is string[]. |
| 4 | `{ type: 'passive', reach: 'heart', value: -0.04 }` | PASS | Negative passive is valid — penalty. |
| 5 | `{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'death_prevented', value: true, ticks: 'permanent' }` | **FAIL** | See finding below. |

**Finding — Effect 5 (`modify_rules`, `value: true`):**

The `ModifyRulesEffect.value` is typed as:
```typescript
readonly value: number | boolean | string | { from: ReachDomain; to: ReachDomain };
```

`value: true` is a boolean — this is valid TypeScript. `rule: 'death_prevented'` is a valid `RuleOverrideKey`. `ticks: 'permanent'` is valid. `scope: { scope: 'self' }` is valid.

**Re-verdict: PASS.** The boolean value is explicitly supported in the type union.

**Balance note:** `death_prevented: true` permanently is an extremely powerful T4 effect — appropriate for Legendary tier and `lossCondition: 'cursed'`.

**Passive total:**
- Iron 0.07 + Stone 0.06 - Heart 0.04 = 0.09 net
- No individual value exceeds EFFECT_PER_ITEM_CAP (0.15)

**Verdict: PASS**

---

### Provision 3: The Black Mead (`reward_provisions_the_black_mead`)

**Effect count:** 5 — PASS (cap: 6)

**ID duplicate check:** Not present in `reward-attachment-catalog.ts` — PASS

#### Effect-by-effect analysis

| # | Draft effect | Verdict | Notes |
|---|-------------|---------|-------|
| 1 | `{ type: 'passive', reach: 'veil', value: 0.09 }` | PASS | Within cap. |
| 2 | `{ type: 'passive', reach: 'shadow', value: 0.05 }` | PASS | Within cap. |
| 3 | `{ type: 'reveal', target: 'encounters', range: 'all' }` | PASS | `range: 'all'` is valid — `RevealEffect.range: number | 'all'`. |
| 4 | `{ type: 'tradeoff', bonus: { reach: 'veil', value: 0.04 }, penalty: { reach: 'star', value: 0.02 } }` | PASS | Valid `TradeoffEffect`. |
| 5 | `{ type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.006, limitValue: 0.45 }` | PASS | Valid `AxiologicalDriftEffect`. |

**Balance check:**
- Veil: 0.09 passive + 0.04 tradeoff bonus = 0.13 effective Veil modifier
- Shadow: 0.05 passive
- Star: -0.02 tradeoff penalty
- Combined effective Veil 0.13 is within EFFECT_PER_ITEM_CAP (0.15) when considered as separate effects

**Note on tradeoff counting:** The `TradeoffEffect` contributes both a bonus and penalty, each below 0.15. The bonus (0.04) and penalty (0.02) are both within cap individually. No violation.

**Axiological drift:** `ratePerTick: 0.006` toward ruthlessness, `limitValue: 0.45`. At 12 ticks/day, this is 0.072/day drift. The system clamps at 0.45. No hard constant prohibits specific drift values — designer discretion governs here.

**Verdict: PASS**

---

## Cross-Item Checks

### Duplicate ID scan

Searched `reward-attachment-catalog.ts` for all five IDs:
- `reward_tools_instruments_the_trembling_needle` — not found
- `reward_tools_instruments_the_anvilbone` — not found
- `reward_provisions_the_quiet_cup` — not found
- `reward_provisions_the_last_harvest` — not found
- `reward_provisions_the_black_mead` — not found

**All IDs are unique. PASS.**

### Effect count summary

| Item | Effects | Cap | Status |
|------|---------|-----|--------|
| The Trembling Needle | 5 | 6 | PASS |
| The Anvilbone | 5 | 6 | PASS |
| The Quiet Cup | 5 | 6 | PASS |
| The Last Harvest | 5 | 6 | PASS |
| The Black Mead | 5 | 6 | PASS |

### EFFECT_PER_ITEM_CAP (0.15) violations

| Item | Reach | Value | Status |
|------|-------|-------|--------|
| The Trembling Needle | Eye passive | 0.08 | PASS |
| The Anvilbone | Stone passive | 0.10 | PASS (at cap) |
| The Quiet Cup | Star passive | 0.08 | PASS |
| The Last Harvest | Iron passive | 0.07 | PASS |
| The Black Mead | Veil passive | 0.09 | PASS |

No violations found.

### AURA_MAX_RADIUS (2) check

| Item | Aura radius | Status |
|------|-------------|--------|
| The Quiet Cup | 1 | PASS |

---

## Issues Requiring Fix Before Implementation

### Issue 1 — The Anvilbone: `create_structure` subtype field placement (MINOR)

**File:** `fill-t4-legendaries-revised.md`
**Effect:** `create_structure`
**Problem:** `subtype: 'shrine'` is nested inside `properties` dict rather than at the top level of the effect.

**Current:**
```typescript
{ type: 'create_structure', what: 'landmark', onHex: 'self', permanent: true,
  properties: { name: 'Anvilbone Foundation', subtype: 'shrine' } }
```

**Required:**
```typescript
{ type: 'create_structure', what: 'landmark', subtype: 'shrine', onHex: 'self', permanent: true,
  properties: { name: 'Anvilbone Foundation' } }
```

**Impact:** Both forms compile. But the engine reads `CreateStructureEffect.subtype` at the top level, not from `properties`. Any structure-creation logic that inspects `effect.subtype` will see `undefined` if left uncorrected.

---

## Issues Not Requiring Fix (Notes for Implementer)

### Note A — `modify_rules` vs `range_modifier` for awareness

The Trembling Needle uses `modify_rules` with `rule: 'awareness_range_bonus'` for permanent awareness expansion. The catalog also has `RangeModifierEffect` with `awarenessRangeBonus`. These are **different integration points**:
- `range_modifier` is a query-layer effect read by the movement/awareness query system
- `modify_rules` creates an `ActiveRuleOverride` on `GameState` read by rule-checking systems

Either works mechanically, but they integrate differently. Verify that the awareness system the game actually uses reads `RuleOverrideKey` entries. If the awareness calculation reads `RangeModifierEffect` exclusively (query-layer approach), then `modify_rules` will be silently ignored and `range_modifier` should be used instead.

**Action:** Implementer should confirm which integration point drives awareness range before wiring. No change needed in the content file if the engine handles both; add a note to the wiring checklist if not.

### Note B — `tag_immunity` readonly constraint

The `TagImmunityEffect` interface declares `tags: readonly string[]`. The draft uses a plain `string[]` array literal. TypeScript infers array literals as `string[]` by default, not `readonly string[]`, but the type is assignable in either direction at the interface boundary — no runtime issue. No change needed.

### Note C — Essence restoration rate (The Quiet Cup)

`resource_manipulate` with `amount: 1, mode: 'per_tick'` is 1 essence every tick (every 2 game hours). This is strong even with the `star > 0.10` gate. If T4 balance is ever tuned, this is the first value to reduce. Flagged for designer awareness, not a blocking issue.

---

## Verdict

**READY WITH CAVEATS**

One fix required before implementation: Issue 1 (The Anvilbone `create_structure` subtype placement). All other effects are type-correct and within balance constants. Five new IDs are unique in the catalog.
