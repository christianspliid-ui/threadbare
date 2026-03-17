# Agent Portrait System — Implementation Plan

**Date:** 2026-03-16
**Status:** Ready for Claude Code
**Scope:** Add portrait images to agent character sheets (profile modal + detail panel)

---

## Context

The game generates 8-12 individual agents per session, each with a narrative archetype (19 possible) and primary sphere alignment. The `AgentProfileModal` already has a **portrait placeholder** (`data-testid="portrait-silhouette"`, 80×96px gradient div at line 94-103 of `AgentProfileModal.tsx`). The `AgentDetailPanel` header bar (line 68-92) has no portrait but has room for one.

The portrait system should:
- Map archetypes to pre-generated portrait images
- Show the correct portrait based on the agent's archetype
- Fall back gracefully to the existing gradient silhouette when no image is available
- Gate portrait visibility behind the knowledge system (strangers see silhouette only)

---

## Step 1: Generate Portrait Assets

**Owner:** Manual (Nano Banana MCP via Cowork or CLI)
**Output:** `public/portraits/` directory

Generate 3 initial portraits at 3:4 aspect ratio following STYLE.md Actor (game asset) art direction. Once the Gemini API key is refreshed, use these exact prompts:

### Portrait 1 — Tragic Hero (Force sphere, crimson thread)

```
A weathered commander in scarred plate armor stands at rest, one gauntlet resting on the pommel of a heavy bastard sword. Deep lines cross a face that has seen decades of campaign — cropped iron-grey hair, a jaw set in permanent resolve. The armor is functional, dented, repaired — dark steel with leather straps and iron rivets. A single thin crimson thread of Force magic pulses faintly along the sword's fuller, barely visible against the dark steel.

Waist-up portrait, 85mm lens equivalent, f/2.8. Subject fills the frame against a dark neutral background. Slight low angle conveys authority.

Cool rim light from behind silhouettes the figure. Warm fill from below-left catches the armor's texture and the face. Deep shadows under the brow and jaw.

Dark fantasy oil painting in the style of Adrian Smith and Brom — visible brushstrokes, textural impasto on the armor surfaces. The background is near-black with subtle smoky atmosphere. Environmental colors sit at 10-40% brightness. Only the single crimson thread breaks above 70% brightness.

No text, no UI, no modern elements.
```

**File:** `public/portraits/tragic-hero.png`
**MCP params:** `aspectRatio: "3:4"`, `quality: "quality"`

### Portrait 2 — Trickster (Spirit sphere, violet thread)

```
A lean, sharp-featured woman wrapped in layered dark cloth and soft leather, a half-smile playing at the corner of her mouth. Her eyes are bright and calculating beneath a hood pulled low. She holds a thin curved dagger loosely in one hand, the blade dark and matte. Quick and sardonic — everything about her posture suggests coiled energy and mischief. A single thin violet thread of Spirit magic wisps upward from her shoulder like a ghostly ribbon, barely visible, partially fading into nothing.

Waist-up portrait, 85mm lens equivalent, f/2.8. Subject fills the frame against a dark neutral background. Slight eye-level angle, intimate and conspiratorial.

Cool rim light from behind catches the edges of the hood. Warm amber fill from below-left illuminates the face and the sardonic half-smile. Deep shadows pool in the cloth folds.

Dark fantasy oil painting in the style of Brom and Frank Frazetta — visible brushstrokes, textural impasto on the leather and cloth. The background is near-black with subtle smoky atmosphere. Environmental colors sit at 10-40% brightness. Only the single violet thread breaks above 70% brightness.

No text, no UI, no modern elements.
```

**File:** `public/portraits/trickster.png`
**MCP params:** `aspectRatio: "3:4"`, `quality: "quality"`

### Portrait 3 — Old Power (Mind sphere, blue thread)

```
An ancient figure of immense stillness — tall, gaunt, draped in robes of deep grey-black fabric so old it seems to be turning to stone. The face is weathered beyond age, deep-set eyes that hold millennia of patience, skin like cracked parchment over sharp bones. Long silver-white hair falls in heavy curtains. One gnarled hand rests on a staff of petrified wood wound with tarnished copper. A single thin electric blue thread of Mind magic branches like a neural dendrite from the staff's tip, forming a brief mandala pattern before fading.

Waist-up portrait, 85mm lens equivalent, f/2.8. Subject fills the frame against a dark neutral background. Slight low angle conveys ancient authority.

Cool blue rim light from behind outlines the figure. Dim warm fill from below-left catches the craggy face and the robe's texture. Deep shadows everywhere — this figure is more shadow than substance.

Dark fantasy oil painting in the style of Marc Simonetti and Adrian Smith — visible brushstrokes, textural impasto on the robes and weathered skin. The background is near-black with subtle atmospheric haze. Environmental colors sit at 10-40% brightness. Only the single blue thread breaks above 70% brightness.

No text, no UI, no modern elements.
```

**File:** `public/portraits/old-power.png`
**MCP params:** `aspectRatio: "3:4"`, `quality: "quality"`

---

## Step 2: Create Portrait Asset Registry

**File:** `src/data/portrait-assets.ts`

```typescript
/**
 * Portrait Asset Registry — maps archetype IDs to portrait image paths.
 *
 * Portraits are pre-generated images stored in public/portraits/.
 * Each archetype maps to one portrait file. Archetypes without a portrait
 * fall back to null (components render the gradient silhouette).
 */

/** All 19 archetype IDs for reference */
export type ArchetypeId =
  | 'tragic_hero' | 'trickster' | 'coming_of_age'
  | 'brooding_warrior' | 'fallen_noble' | 'true_believer'
  | 'schemer' | 'wanderer' | 'monster'
  | 'folk_hero' | 'reluctant_king' | 'oathkeeper'
  | 'poisoned_court' | 'doomed_innocent' | 'old_power'
  | 'kingmaker' | 'seeker' | 'maker' | 'noble_savage';

/**
 * Map archetype ID → portrait image path (relative to public/).
 * null = no portrait yet, use gradient silhouette fallback.
 */
export const ARCHETYPE_PORTRAITS: Record<ArchetypeId, string | null> = {
  tragic_hero: '/portraits/tragic-hero.png',
  trickster: '/portraits/trickster.png',
  old_power: '/portraits/old-power.png',

  // Not yet generated — fallback to silhouette
  coming_of_age: null,
  brooding_warrior: null,
  fallen_noble: null,
  true_believer: null,
  schemer: null,
  wanderer: null,
  monster: null,
  folk_hero: null,
  reluctant_king: null,
  oathkeeper: null,
  poisoned_court: null,
  doomed_innocent: null,
  kingmaker: null,
  seeker: null,
  maker: null,
  noble_savage: null,
};

/**
 * Get the portrait URL for an agent, or null if none available.
 * Knowledge-gating is NOT done here — components should check knowledge level
 * before calling this.
 */
export function getPortraitUrl(archetypeId: string | undefined): string | null {
  if (!archetypeId) return null;
  return ARCHETYPE_PORTRAITS[archetypeId as ArchetypeId] ?? null;
}
```

---

## Step 3: Add `portraitUrl` to Data Interfaces

**File:** `src/engine/agentDetail.ts`

### 3a. Add to `AgentDetail` interface (line ~65)

```typescript
export interface AgentDetail {
  id: string;
  name: string;
  // ... existing fields ...
  portraitUrl: string | null;  // NEW — archetype-based portrait path
}
```

### 3b. Add to `AgentInfoCardData` interface (line ~89)

```typescript
export interface AgentInfoCardData {
  id: string;
  name: string;
  // ... existing fields ...
  portraitUrl?: string;  // NEW — only present if knowledge >= recognised
}
```

### 3c. Add to `AgentFullProfileData` interface (line ~112)

```typescript
export interface AgentFullProfileData {
  // ... existing fields ...
  portraitUrl?: string;  // NEW — always present at intimate+ knowledge
}
```

### 3d. Populate in `getAgentDetail()` (line ~127)

Import `getPortraitUrl` from `../data/portrait-assets` and set the field:

```typescript
const archetypeId = (agentNode.properties as Record<string, unknown>).narrativeArchetype as string | undefined;
// ... existing archetype lookup ...
const portraitUrl = getPortraitUrl(archetypeId);
```

Include `portraitUrl` in the returned `AgentDetail` object.

### 3e. Populate in `getAgentInfoCard()`

Only include `portraitUrl` when knowledge level is `recognised` or higher:

```typescript
if (knowledgeLevel !== 'stranger') {
  cardData.portraitUrl = getPortraitUrl(archetypeId) ?? undefined;
}
```

---

## Step 4: Update AgentProfileModal

**File:** `src/components/Game/AgentProfileModal.tsx`
**Lines:** 94-103 (portrait placeholder)

Replace the gradient-only div with a conditional image:

```tsx
{/* Portrait */}
<div
  data-testid="portrait-silhouette"
  className="w-20 h-24 rounded overflow-hidden flex-shrink-0"
  style={{
    background:
      card.knowledgeLevel === 'stranger'
        ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(51,51,51,0.6) 100%)'
        : !card.portraitUrl
          ? 'linear-gradient(135deg, rgba(120,53,15,0.4) 0%, rgba(30,27,46,0.8) 100%)'
          : undefined,
  }}
>
  {card.knowledgeLevel !== 'stranger' && card.portraitUrl && (
    <img
      src={card.portraitUrl}
      alt={`Portrait of ${card.name}`}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  )}
</div>
```

**Behavior:**
- **Stranger:** Dark gradient silhouette (unchanged)
- **Recognised+ with portrait:** Shows the archetype portrait image
- **Recognised+ without portrait:** Brown/purple gradient fallback (unchanged)

---

## Step 5: Update AgentDetailPanel

**File:** `src/components/Game/AgentDetailPanel.tsx`
**Lines:** 68-92 (header bar)

Add a small portrait thumbnail to the left of the agent name:

```tsx
{/* Header Bar */}
<div className="flex items-center gap-3 px-4 py-3 bg-stone-800/90 border-b border-amber-900/30 flex-shrink-0">
  <button onClick={onBack} aria-label="back" className="text-amber-400 hover:text-amber-200 transition-colors text-lg px-1">
    ←
  </button>

  {/* Portrait thumbnail */}
  {detail.portraitUrl && (
    <div className="w-8 h-10 rounded overflow-hidden flex-shrink-0">
      <img
        src={detail.portraitUrl}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  )}

  {/* Agent name and tier */}
  <div className="flex-1">
    {/* ... unchanged ... */}
  </div>
</div>
```

**Behavior:** Small 32×40px thumbnail appears between the back arrow and agent name. No thumbnail if no portrait exists — layout unchanged.

---

## Step 6: Tests

### 6a. Unit test for portrait registry

**File:** `src/data/__tests__/portrait-assets.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getPortraitUrl, ARCHETYPE_PORTRAITS } from '../portrait-assets';

describe('portrait-assets', () => {
  it('returns URL for archetypes with portraits', () => {
    expect(getPortraitUrl('tragic_hero')).toBe('/portraits/tragic-hero.png');
    expect(getPortraitUrl('trickster')).toBe('/portraits/trickster.png');
    expect(getPortraitUrl('old_power')).toBe('/portraits/old-power.png');
  });

  it('returns null for archetypes without portraits', () => {
    expect(getPortraitUrl('wanderer')).toBeNull();
    expect(getPortraitUrl('schemer')).toBeNull();
  });

  it('returns null for undefined/unknown archetype', () => {
    expect(getPortraitUrl(undefined)).toBeNull();
    expect(getPortraitUrl('nonexistent')).toBeNull();
  });

  it('covers all 19 archetypes in the registry', () => {
    expect(Object.keys(ARCHETYPE_PORTRAITS)).toHaveLength(19);
  });
});
```

### 6b. Update existing AgentProfileModal tests

Add cases verifying:
- Stranger agents render gradient, no `<img>` element
- Recognised+ agents with `portraitUrl` render an `<img>` with correct `src`
- Recognised+ agents without `portraitUrl` render gradient fallback

### 6c. Update existing AgentDetailPanel tests

Add cases verifying:
- Detail with `portraitUrl` renders thumbnail in header
- Detail without `portraitUrl` renders no thumbnail (no layout shift)

---

## Step 7: Future — Scaling to All 19 Archetypes

Once the initial 3 portraits validate the system, generate portraits for remaining archetypes. Each prompt follows the same Actor (game asset) template from STYLE.md, varying:
- Physical description (match archetype personality)
- Sphere thread color (match archetype's primary reach → sphere mapping)
- Mood/posture (match archetype's tone keywords)

Priority order for next batch:
1. `brooding_warrior` — high gameplay frequency, strong visual identity
2. `schemer` — contrasts well with warrior types
3. `wanderer` — evocative archetype
4. `folk_hero` — warm contrast to darker archetypes
5. `monster` — most visually distinct

---

## File Checklist

| File | Action |
|------|--------|
| `public/portraits/tragic-hero.png` | New — generated image asset |
| `public/portraits/trickster.png` | New — generated image asset |
| `public/portraits/old-power.png` | New — generated image asset |
| `src/data/portrait-assets.ts` | New — archetype → portrait registry |
| `src/data/__tests__/portrait-assets.test.ts` | New — registry unit tests |
| `src/engine/agentDetail.ts` | Edit — add `portraitUrl` to interfaces + getters |
| `src/components/Game/AgentProfileModal.tsx` | Edit — conditional image in portrait placeholder |
| `src/components/Game/AgentDetailPanel.tsx` | Edit — add thumbnail to header bar |
| Existing test files for modal/panel | Edit — add portrait rendering test cases |

---

## Dependencies

- Gemini API key must be refreshed (current key flagged as leaked)
- No new npm packages required
- Images are static assets served from `public/` — no runtime generation
