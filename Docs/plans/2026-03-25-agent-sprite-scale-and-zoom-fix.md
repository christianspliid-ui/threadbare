# Agent Sprite Scale & Zoom Threshold Fix

> **Date:** 2026-03-25
> **Status:** 📐▶ Ready for Claude Code
> **Severity:** Bug — agents visually shrink to ~1 world unit after first movement
> **Backlog:** "Agent Sprite Scale Bug + Zoom Threshold Unification"

---

## Problem Summary

After any agent completes a hop animation + settle bounce, all three sprite tiers (portrait, dot, continental) have their scale reset to absolute `1.0` instead of their intended sizes (9.0, 3.0, 5.0). This makes agents appear as tiny ~1-pixel dots on the map. Additionally, the agent zoom thresholds are out of sync with the global zoom tier system, causing the wrong sprite tier to display at each zoom level.

---

## Root Cause 1: Settle Animation Destroys Sprite Scales

### Where

`src/components/HexMapV2/agents/agentAnimationState.ts`, lines 267–288 (`tickAgentAnimations`, settling phase).

### What happens

```typescript
// Current code — absolute scale, not relative
const scale = SETTLE_BOUNCE_SCALE + (1.0 - SETTLE_BOUNCE_SCALE) * t;
sprites.portrait.scale.set(scale, scale, 1);  // 1.05 → 1.0
sprites.dot.scale.set(scale, scale, 1);        // 1.05 → 1.0
```

Sprites are created with intended scales:
- `portraitSprite.scale = 9.0` (from `AGENT_PORTRAIT_RADIUS` 4.5 × 2)
- `dotSprite.scale = 3.0` (from `AGENT_TOKEN_RADIUS` 1.5 × 2)
- `continentalSprite.scale = 5.0` (from `AGENT_DOT_RADIUS` 2.5 × 2)

The settle bounce treats `SETTLE_BOUNCE_SCALE` (1.05) as an absolute value and lerps to absolute 1.0. On completion (line 282): `sprites.portrait.scale.set(1, 1, 1)` — the 9.0 scale is gone forever.

### Fix

Store each sprite's base scale and apply the bounce as a **multiplier**:

```typescript
// Option A: Store base scales in the sprite's userData at creation time
// In createAgentSpriteMesh:
portraitSprite.userData.baseScale = portraitScale;  // 9.0
dotSprite.userData.baseScale = dotScale;            // 3.0

// In tickAgentAnimations settling phase:
const bounceMultiplier = SETTLE_BOUNCE_SCALE + (1.0 - SETTLE_BOUNCE_SCALE) * t;
const basePortrait = sprites.portrait.userData.baseScale ?? 1;
const baseDot = sprites.dot.userData.baseScale ?? 1;
sprites.portrait.scale.set(basePortrait * bounceMultiplier, basePortrait * bounceMultiplier, 1);
sprites.dot.scale.set(baseDot * bounceMultiplier, baseDot * bounceMultiplier, 1);
// Same for continental

// On settle complete:
sprites.portrait.scale.set(basePortrait, basePortrait, 1);
sprites.dot.scale.set(baseDot, baseDot, 1);
```

### Constants table (NFP #1)

| Constant | Value | Source | Purpose |
|----------|-------|--------|---------|
| `SETTLE_BOUNCE_SCALE` | 1.05 | `agentAnimationState.ts` | Bounce multiplier peak |
| `AGENT_PORTRAIT_RADIUS` | 4.5 | `agent-visual-content.ts` | Portrait sprite base radius |
| `AGENT_TOKEN_RADIUS` | 1.5 | `agent-visual-content.ts` | Dot sprite base radius |
| `AGENT_DOT_RADIUS` | 2.5 | `agent-visual-content.ts` | Continental sprite base radius |

### Tracing (NFP #2)

No new trace types needed — existing animation phase logging covers this.

### Fail-soft (NFP #4)

| Failure | Fallback |
|---------|----------|
| `userData.baseScale` missing | Default to 1.0 (current broken behavior — no worse) |
| Sprite missing from spriteMap | Already skipped silently |

### PRNG (NFP #3)

No randomness involved in scale calculation.

---

## Root Cause 2: Zoom Threshold Mismatch

### Where

Two competing threshold definitions:

| System | File | HERO_LOCAL | REGIONAL | CONTINENTAL |
|--------|------|-----------|----------|-------------|
| `ZOOM_TIER_THRESHOLDS` | `ZoomVisibilityMatrix.ts:36-45` | **15** | 5 | 1.5 |
| `AGENT_ZOOM_THRESHOLDS` | `agentSpriteTypes.ts:86-93` | **5** | 5 | 1.5 |

### What happens

- `getZoomTier(k=7)` returns `'regional'` (because 7 < 15)
- `ZOOM_VISIBILITY_MATRIX.agents_portrait['regional']` = false (correct — portraits at hero-local only)
- But `updateZoomVisibility(group, 7)` checks `7 >= AGENT_ZOOM_THRESHOLDS.HERO_LOCAL (5)` → shows dotGroup
- The dotGroup has tiny 3.0-unit sprites — wrong tier for this zoom level

### Fix

1. **Delete `AGENT_ZOOM_THRESHOLDS`** from `agentSpriteTypes.ts`
2. **Rewrite `updateZoomVisibility`** to accept a `ZoomTier` string (from `getZoomTier`) instead of a raw k value, and use `ZOOM_VISIBILITY_MATRIX` entries directly:

```typescript
export function updateZoomVisibility(group: AgentSpriteGroup, tier: ZoomTier): void {
  group.portraitGroup.visible = ZOOM_VISIBILITY_MATRIX.agents_portrait[tier];
  group.dotGroup.visible = ZOOM_VISIBILITY_MATRIX.agents_dot[tier];
  group.continentalGroup.visible = ZOOM_VISIBILITY_MATRIX.agents_retinue[tier];
}
```

3. **Update the call site** in `HexMapV2.tsx` line 610 to pass the tier:
```typescript
if (agentGroup) updateZoomVisibility(agentGroup, tier);  // tier already computed on line 596
```

4. **Update imports** — remove `AGENT_ZOOM_THRESHOLDS` from all consumers, replace with `ZOOM_TIER_THRESHOLDS` or `getZoomTier`.

### Affected files

- `src/components/HexMapV2/agents/agentSpriteTypes.ts` — delete `AGENT_ZOOM_THRESHOLDS`
- `src/components/HexMapV2/scene/AgentSpriteMesh.ts` — rewrite `updateZoomVisibility` signature
- `src/components/HexMapV2/HexMapV2.tsx` — update call site
- `src/components/HexMapV2/scene/__tests__/AgentSpriteMesh.test.ts` — update tests
- Any other importers of `AGENT_ZOOM_THRESHOLDS` (check with grep)

---

## Root Cause 3: Continental Group Never Shown

### Where

`updateZoomVisibility` in `AgentSpriteMesh.ts` lines 244–261 — the `continentalGroup.visible` is always set to `false` in every branch.

### Fix

Handled by the rewrite in Root Cause 2 — `ZOOM_VISIBILITY_MATRIX.agents_retinue[tier]` returns `true` for `'continental'` tier, which will correctly show the retinue dots.

---

## Testing Checklist

1. **Unit test: settle bounce preserves base scale** — Create sprites, run a full hop + settle animation cycle, verify final scale matches base scale (not 1.0)
2. **Unit test: updateZoomVisibility tier mapping** — Verify each zoom tier shows the correct sprite group per the visibility matrix
3. **Contract test: AgentSpriteMesh → agentAnimationState** — Verify that sprites created by `createAgentSpriteMesh` have `userData.baseScale` set, and that `tickAgentAnimations` reads and respects it
4. **Visual verification** at `?view=game`:
   - Advance several ticks so agents move
   - Verify agents are correct size after movement at all three zoom tiers
   - Verify continental group shows retinue agents when zoomed out

---

## NFP Compliance Summary

| Priority | Status |
|----------|--------|
| 1. Tunability | PASS — all scale values from named constants |
| 2. Inspectability | PASS — no new trace types needed |
| 3. Determinism | PASS — no randomness in fix |
| 4. Fail-soft | PASS — missing baseScale defaults to 1.0 |
| 5. Narrative over mechanical | N/A |
| 6. Additive over destructive | PASS — adds userData.baseScale, removes dead threshold constant |
| 7. Performance | PASS — one extra property read per sprite per frame during settle only |
