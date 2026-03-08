# Tooltip System Design

**Date:** 2026-03-08
**Status:** Approved
**Goal:** Onboarding and discoverability — help new players understand what UI elements do

## Decision 1: Custom Component, No External Library

Build a custom `<Tooltip>` React component rather than using Radix UI or CSS-only tooltips.

**Why:** The project builds all popovers/overlays as custom absolute-positioned divs (InterventionConfirm, AgentWheel, ScryOverlay). A custom tooltip keeps consistency, avoids a dependency that may fight with SVG-heavy components, and gives full control over Threadbare styling. Accessibility attributes (`role="tooltip"`, `aria-describedby`) are added directly.

**Rejected:** Radix UI Tooltip (adds dependency, may conflict with SVG), CSS-only `::after` tooltips (no rich content, poor accessibility, limited positioning).

## Decision 2: Content Resolver with Zero Duplication

Tooltip content is resolved at runtime from existing content packages — never duplicated.

A `resolveTooltip(id: string)` function routes by ID prefix to the canonical content source:

| Prefix | Source |
|--------|--------|
| `sphere.*` | world-model.json taxonomy nodes |
| `archetype.*` | archetype-content.ts |
| `doom.*` | doom-content.ts |
| `mandate.*` | mandate-content.ts |
| `reach.*` | world-model.json reach nodes |
| `terrain.*` | world-model.json terrain nodes |
| `ui.*` | ui-content.ts (UI-system tooltips) |
| `agent.*` | Dynamic resolution from game state graph |
| `location.*` | Dynamic resolution from game state graph |

Returns `{ label: string; desc?: string }`.

**Why:** The 11 content packages already contain names, descriptions, and structured data at the right granularity. Importing from them means tooltip text auto-updates when content changes. No synchronization bugs during iteration.

**`ui-content.ts`** holds ~20-30 entries for UI-system tooltips (button labels, panel descriptions) that have no content package home.

## Decision 3: Linked Tooltip Chains

Tooltip descriptions can contain concept references using `{{sphere.force}}` syntax. These render as underlined, hoverable spans. Hovering a link spawns a child tooltip adjacent to the parent.

**Rules:**
- Maximum chain depth: 2 (tooltip → child tooltip → plain text, no further links)
- Child tooltip appears to the side of parent (left/right based on space)
- Parent stays visible while child is open
- "Hover bridge" keeps parent alive during mouse transit to underlined link
- At depth 2, `{{...}}` markers render as plain text (no underline, no hover)
- Same `resolveTooltip()` function handles child lookups recursively

**Why:** The game is fundamentally about relationships between concepts that influence each other. Linked tooltips let players chase concept connections — hovering "Doom Clock" leads to "Unmaking" leads to "Entropy." This mirrors the graph-based world model and teaches relationships through exploration.

## Decision 4: Minimal Dark Chip Visual Style

**Appearance:**
- Background: `#1a1a1e` (near-black)
- Border: 1px `#57534e` (stone-600)
- Border radius: `rounded` (Tailwind)
- Label: `amber-200` (#fcd34d), Cinzel font, `text-xs`
- Description: `stone-400` (#a8a29e), Inter font, `text-xs`
- Linked concepts: underlined in `amber-400` (#fbbf24)
- Max width: 220px
- Shadow: `shadow-lg`
- Arrow: 6px CSS triangle pointing to trigger

**Timing:**
- Show delay: 200ms (prevents flash on quick mouse sweeps)
- Fade-in: 150ms opacity + translateY(-4px → 0)
- Fade-out: 100ms
- Re-trigger grace: 300ms (moving to another tooltip target skips delay)

**Positioning:**
- Default: above trigger, centered horizontally
- Flip: below if within 80px of top viewport edge
- Shift: horizontal adjustment if within 100px of left/right edge

**Keyboard:** Shows on focus, hides on blur or Escape.

**SVG elements:** Uses `onPointerEnter`/`onPointerLeave` (works uniformly across DOM and SVG). Tooltip component handles SVG bounding box for positioning.

**Why:** Fits Threadbare's "dark world, hidden magic" aesthetic — the tooltip is a whisper from the UI, not a bright billboard. Minimal chrome, concentrated information.

## Decision 5: Core HUD + Agents + Locations First Pass

~30-40 tooltip targets in the first implementation:

### Core HUD (~15-20 targets)

| Element | Label | Content Source | Notable Links |
|---------|-------|---------------|---------------|
| DoomBar | Doom Clock | doom-content.ts + ui-content.ts | `{{doom.unmaking}}`, `{{sphere.entropy}}` |
| DoomBar stages | Stage name | doom-content.ts | Per-stage description |
| EssencePanel | Divine Essence | influence-content.ts + ui-content.ts | `{{ui.interventions}}`, `{{sphere.spirit}}` |
| MandateTracker bar | Mandate name | mandate-content.ts | `{{sphere.<affinity>}}` |
| MandateTracker compact | Active Mandates | ui-content.ts | `{{doom.clock}}` |
| AvatarHUD: Move | Move Avatar | ui-content.ts | — |
| AvatarHUD: Wheel | Agent Wheel | ui-content.ts | `{{ui.agent_wheel}}` |
| AvatarHUD: Scry | Ascendant Scry | ui-content.ts | `{{ui.ascendant_scry}}` |
| SimulationControls | Play/Pause, Speed | ui-content.ts | — |
| RivalPanel header | Rival Gods | ui-content.ts | — |
| RivalPanel entries | Rival name | Dynamic from game state | Archetype + sphere links |

### Agents (~10 targets)

| Element | Label | Content Source | Notable Links |
|---------|-------|---------------|---------------|
| RetinuePanel agent entry | Agent name | Dynamic from game state | `{{archetype.<id>}}` |
| HexZoomView agent dot | Agent name | Dynamic from game state | Archetype + cooperation strategy |

Agent tooltips show: name, archetype name + story shape (from archetype-content.ts), cooperation strategy (from disposition data).

### Locations & Map (~10 targets)

| Element | Label | Content Source | Notable Links |
|---------|-------|---------------|---------------|
| HexZoomView location | Location name | Dynamic from game state | `{{terrain.<id>}}`, `{{sphere.<id>}}` |
| HexTile (visible) | Terrain name | world-model.json terrain nodes | `{{sphere.<id>}}` if sphere influence |
| HexTile (remembered) | Terrain name | world-model.json + "Last seen" note | — |
| HexTile (unexplored) | — | No tooltip | — |

## Decision 6: Content Validation Tests

A dedicated test scans all `{{concept.id}}` references across all tooltip descriptions (both ui-content.ts entries and content package descriptions used by the resolver) and verifies each one resolves to a valid tooltip via `resolveTooltip()`. This catches broken cross-references when content packages change.

## Architecture Summary

```
src/
  components/
    shared/
      Tooltip.tsx          — Tooltip component (render, position, chain)
  data/
    ui-content.ts          — UI-system tooltip strings (~20-30 entries)
  engine/
    tooltipResolver.ts     — resolveTooltip(id) → { label, desc }
```

**Component API:**
```tsx
// Static ID (resolved from content packages)
<Tooltip id="sphere.force">
  <SphereIcon sphere="force" />
</Tooltip>

// Dynamic (for agents/locations resolved from game state)
<Tooltip label={agent.name} desc={`${archetype.storyShape}`}>
  <AgentEntry ... />
</Tooltip>
```

**Data flow:**
1. `<Tooltip id="sphere.force">` → calls `resolveTooltip("sphere.force")`
2. Resolver matches `sphere.*` prefix → looks up world-model.json node → returns `{ label: "Sphere of Force", desc: "Sharp, directional power..." }`
3. Renderer parses `{{sphere.entropy}}` in desc → renders as underlined link
4. Hovering link → calls `resolveTooltip("sphere.entropy")` at depth+1 → shows child tooltip
5. At depth 2, `{{...}}` rendered as plain text

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Resolver unit tests | Given ID, returns correct label/desc | Pure function tests, no React |
| Component render tests | Hover → tooltip appears after delay, aria attributes correct | React Testing Library |
| Chain integration tests | Hover → child tooltip → dismiss both | Simulated pointer events |
| Content validation | All `{{concept.id}}` references resolve | Scan + resolveTooltip per reference |
| SVG integration | Tooltip works on HexTile, AgentWheel elements | Pointer event simulation on SVG |
