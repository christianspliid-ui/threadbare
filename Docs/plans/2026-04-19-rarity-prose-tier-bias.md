# Rarity-Driven Prose Tier Bias (THR-24)

**Status:** Implementation Planning → Ready for Codex
**Owner:** Codex executor
**Parent:** Rarity Model project
**Date:** 2026-04-19

## Problem

`classifyEvent(eventType, tags)` in `src/engine/narrative.ts` maps an event to a narrative tier (`'routine' | 'notable' | 'chronicle'`) purely from event type and tag presence. It does not consider the rarity of the subject involved. A legendary artifact being lost should not classify as `'routine'` even if its event type normally does; a mythic location's founding should at minimum be `'notable'`.

The PHASE-D-DEFERRED comment next to `classifyEvent` calls this out: rarity tier should raise the *floor* of the chosen prose tier without lowering it for common subjects.

## Goal

Add an optional `rarityTier` parameter to `classifyEvent` that elevates the returned tier when the subject is rare, while leaving existing routine/notable/chronicle semantics intact for common subjects.

## Scope

- Modify `classifyEvent` signature and logic in `src/engine/narrative.ts`.
- Update all call sites that have access to the subject node's `rarityTier` property to pass it through. Call sites without ready access pass nothing — fail-soft default preserves today's behaviour.
- Emit a trace when rarity bias actually changes the classification, so we can measure how often the bias fires and on which event types.

Out of scope: inventing new tiers, changing `EVENT_TIER_MAP`, modifying prose tables or renderers, altering rarity tier computation.

## Three-Pillar Coverage

### Engine pillar

**Signature change.** The anchor is the current `classifyEvent` function in `src/engine/narrative.ts` (search for `export function classifyEvent` — line numbers drift). Change from:

```ts
export function classifyEvent(
  eventType: NarrativeEventType,
  tags: string[],
): NarrativeTier
```

to:

```ts
export function classifyEvent(
  eventType: NarrativeEventType,
  tags: string[],
  rarityTier?: number,
): NarrativeTier
```

**Floor logic.** After the existing early return for `'legendary'` / `'world_shaking'` tags (which short-circuits to `'chronicle'`), resolve the base tier from `EVENT_TIER_MAP`, then apply the rarity floor:

| `rarityTier` input | Floor applied |
|---|---|
| `undefined` / `0` / `1` (Mundane, Uncommon) | No change — return base tier |
| `2` (Storied) | Floor at `'notable'` — promote `'routine'` to `'notable'` |
| `3` (Mythic) | Floor at `'notable'` — promote `'routine'` to `'notable'` |
| `4` (Legendary) | Floor at `'chronicle'` — promote anything below to `'chronicle'` |

Use named constants (see Constants table) rather than inline literals. The floor only raises the tier; it never lowers it. If `EVENT_TIER_MAP` already returns `'chronicle'` for the event type, the base classification wins and no bias fires.

**Call sites.** Grep for `classifyEvent(` and audit each caller:

- If the caller already resolves the subject node (agent, location, artifact) before classifying, extract `node.properties.rarityTier` and pass it. Treat a missing property as `undefined` — do not synthesize a default tier.
- If the caller has no subject handle (e.g. tests or synthetic events), leave the call unchanged. The optional parameter keeps the old behaviour.

No call site is required to adopt the new parameter. Fail-soft is the point.

### Content pillar

N/A. No new prose, no new templates, no changes to `EVENT_TIER_MAP`. Existing tier-keyed prose tables consume the elevated tier with zero additional content work.

### UI pillar

N/A. Prose-tier classification is internal to the narrative pipeline. The UI consumes the rendered prose from whichever tier is selected, so the bias is observable to the player only through tier-appropriate prose showing up for rare subjects. No debug panel, HexMap, or modal changes required for v1.

Future follow-up (not in this issue): surface the tier decision in DebugPanel's narrative trace view when `rarity_bias_applied` fires. Log as a `// TODO(THR-xx)` if you add the trace category and want inspectability later.

## Wiring

- **Orchestrator phase:** no new phase. `classifyEvent` is called inside the existing narrative resolution path.
- **GameState flow:** unchanged. `rarityTier` comes from node properties already written by the rarity system; the classifier just reads it.
- **Traces:** emit a new category when bias actually elevates the tier (see Tracing).
- **DebugPanel:** no new surface for v1.
- **Player controls:** none.
- **Prose pipeline:** no `enrichProse()` change — this is upstream of enrichment.

Update `Docs/plans/wiring-checklist.md` only if a new trace category is added.

## Constants table

Add to `src/data/rarity-constants.ts` alongside the existing `IMPORTANCE_DIVINE_PROXIMITY`:

| Constant | Default | Purpose |
|---|---|---|
| `PROSE_TIER_FLOOR_BY_RARITY` | `{ 0: null, 1: null, 2: 'notable', 3: 'notable', 4: 'chronicle' }` | Maps rarity tier → minimum prose tier. `null` = no floor applied. Tunable to adjust how aggressively rare subjects elevate prose. |

The map literal uses the `NarrativeTier` string union type for its values. Keep the type annotation explicit so a typo doesn't silently compile.

## Tracing

Add one trace category. Register it in `TRACE_CATEGORIES` (the source is `src/engine/traceBuffer.ts` or wherever the category registry lives — grep for the existing entries).

```ts
interface ProseRarityBiasTrace {
  category: 'prose_rarity_bias';
  eventType: NarrativeEventType;
  subjectId?: string;          // when caller passed one
  rarityTier: number;
  baseTier: NarrativeTier;     // what EVENT_TIER_MAP returned
  biasedTier: NarrativeTier;   // what classifyEvent actually returned
  tags: string[];
}
```

Emit only when `biasedTier !== baseTier`. Silent-path noise is not useful.

## Fail-soft table

| Failure case | Fallback behaviour |
|---|---|
| `rarityTier` is `undefined` | Return base tier — unchanged from current behaviour |
| `rarityTier` is an unexpected value (negative, > 4, NaN) | Treat as `undefined` — log once via `console.warn` and return base tier |
| Subject node exists but `rarityTier` property is missing | Treat as `undefined` — no warn (normal case for unclassified nodes) |
| `PROSE_TIER_FLOOR_BY_RARITY` lookup returns `null` | Return base tier |

The classifier must never throw. Any path that can throw is a bug.

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | `PROSE_TIER_FLOOR_BY_RARITY` is the single knob; adjust the map to change game feel |
| 2. Inspectability | PASS | `prose_rarity_bias` trace fires whenever the bias actually affects output |
| 3. Determinism | PASS | Pure function of inputs; no PRNG usage |
| 4. Fail-soft | PASS | All unknown/invalid rarity values fall back to base tier without throwing |
| 5. Narrative over mechanical perfection | PASS | The whole point is to let narrative weight (rarity) override mechanical classification |
| 6. Additive over destructive | PASS | New optional parameter, new constant, new trace — no existing signatures or tables rewritten |
| 7. Performance budget | PASS | One map lookup per classification; negligible |

## Done when

- [ ] `classifyEvent` accepts optional `rarityTier` and applies the floor table
- [ ] `PROSE_TIER_FLOOR_BY_RARITY` exported from `src/data/rarity-constants.ts` with an explicit `NarrativeTier` typing
- [ ] `prose_rarity_bias` trace category registered and emitted only when bias changes the tier
- [ ] Unit test in `src/engine/__tests__/` covers: undefined rarity (no change), Storied with routine event (→ notable), Legendary with routine event (→ chronicle), Mythic with already-chronicle event (stays chronicle), negative rarity (no change + warn)
- [ ] Existing call sites either pass `node.properties.rarityTier` or are explicitly annotated `// rarity: n/a — synthetic event` so future grepping catches them
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all clean
- [ ] PHASE-D-DEFERRED comment in `narrative.ts` removed once wired
- [ ] Commit message body contains `Fixes THR-24`
