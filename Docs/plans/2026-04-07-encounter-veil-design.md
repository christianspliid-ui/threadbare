# Encounter Veil — Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Prototype:** `Docs/prototypes/encounter-veil.html`

## Summary

Replace the two existing encounter modals (TieredEncounterModal 973 lines, EncounterStage 925 lines) with a single full-screen overlay component — **EncounterVeil** — that uses the Remembrance OriginBeat aesthetic: dissolved concept art, void background, whisper chrome, italic prose, and choice blocks that feel like narrative outcomes rather than UI buttons.

The Remembrance OriginBeat is the archetypical story page. Every encounter, story beat, or dilemma that can show art should aspire to this dissolved-into-void aesthetic.

## Design Goals

1. **Art dissolves into void** — CSS `mask-image` feathers all edges. No borders, no corners, no framed `<img>` tags.
2. **Prose whispers** — Georgia serif, italic, low-opacity warm colors. Text never shouts.
3. **Choices are narrative blocks** — Not button-in-card UI. Semi-transparent text blocks that reveal type/cost/god-voice on hover/select, styled like OriginBeat outcome panels.
4. **Chrome is minimal** — Thread tier, threat, step dots, essence are near-invisible until needed.
5. **All thread tiers supported** — Strongly threaded (full), lightly threaded (timer + 2 choices), watched (peek gate + boost).
6. **Graceful no-art fallback** — Encounters without illustrations use centered prose on void. Still atmospheric.
7. **One data contract** — EncounterStageModel (extended) for all encounter types.

## Architecture

### Current State (two paths)

```
GameView.tsx
  ├─ shouldUseEncounterStage = true
  │   → adapters build EncounterStageModel
  │   → EncounterStage.tsx (Modal maxWidth=980)
  │
  └─ shouldUseEncounterStage = false
      → raw props (notification + template + graph)
      → TieredEncounterModal.tsx (Modal maxWidth=560)
        → builds prose inline (lines 699-722)
```

### Proposed State (one path)

```
GameView.tsx
  └─ always
      → adapters build EncounterStageModel (extended)
      → EncounterVeil.tsx (full-screen portal overlay)
```

### Files

| File | Action | Lines | Purpose |
|------|--------|-------|---------|
| `EncounterVeil.tsx` | **Create** | ~400-500 | Full-screen overlay component |
| `buildSimpleEncounterStageModel.ts` | **Create** | ~200 | Adapter for encounters that currently bypass EncounterStageModel |
| `GameView.tsx` | **Modify** | ~50 lines changed | Replace modal rendering block (lines 2809-2853), remove shouldUseEncounterStage routing |
| `encounter-stage/types.ts` | **Modify** | ~10 lines added | Extend EncounterStageChoiceModel with interventionType, godVoice, probabilityBoost |
| `encounter.ts` (types) | **Modify** | ~5 lines | Add optional illustrationUrl/illustrationAlt to EncounterTemplate |
| `unified-action-templates.ts` | **Modify** | ~20 lines | Add illustrationUrl to templates with existing concept art |
| `buildUnifiedEncounterStageModel.ts` | **Modify** | ~10 lines | Populate new choice fields from source data |
| `buildGateDutyEncounterStageModel.ts` | **Modify** | ~10 lines | Populate new choice fields |
| `TieredEncounterModal.tsx` | **Retire** | -973 | Replaced by EncounterVeil |
| `EncounterStage.tsx` | **Retire** | -925 | Replaced by EncounterVeil |

**Net effect:** ~700 new lines, ~1900 retired. Fewer lines, one rendering path.

## EncounterVeil Component

### Rendering

Full-screen `position: fixed; inset: 0` portal overlay on `document.body`. Not a Modal — no panel, no border, no maxWidth. Background is `#0a0a0f` (void).

**Layout (with art):**
- Art fills entire background via `background-image` on a div with `mask-image: radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)`
- Art title whispers in lower-left (faint uppercase, ~18% opacity). Source: `model.illustration.caption` if present, otherwise omitted
- Content occupies right ~52% with a dark gradient overlay (`transparent → rgba(10,10,15,0.55) → 0.93 → 0.97`) for readability
- Thread tier + threat in top-right as whisper text
- Step dots (minimal circles, not a nav bar) at top of content zone
- Encounter title + agent line as faint text
- Gold gradient divider (1px, `linear-gradient(to right, transparent, gold 20%, transparent)`)
- Prose paragraphs (Georgia italic, ~0.95rem, warm low-opacity, drop cap on first paragraph)
- Choice blocks stacked below prose
- Footer bar with essence display + action buttons, dark gradient from bottom

**Layout (no art):**
- Same void background, no art layer
- Content zone centered at ~65% width instead of right-aligned
- Everything else identical

### Thread Tier Variations

**Strongly threaded:**
- Full art opacity (0.85)
- Full prose depth
- 3 choice blocks
- Simulation paused — "Strongly Threaded · Paused" whisper
- Footer: "Resume" + "Intervene" (enabled when choice selected)

**Lightly threaded:**
- Reduced art opacity (0.6)
- Medium prose depth
- 2 choice blocks
- Auto-resolve timer: thin 2px bar at top edge, faint label "auto-resolves in N ticks"
- Footer: "Close" + "Intervene"

**Watched:**
- Desaturated art (0.35 opacity, `filter: grayscale(40%)`)
- Peek gate shown first: centered icon + whisper prompt + "◆ 1 — Peer Through the Thread" button
- After peek: short prose + boost slider (0-5 pip buttons)
- Footer: "Close" + "Commit" (enabled when boost > 0)

### Choice Blocks

Each choice is a full-width `<button>` with no visible chrome at rest:

```
┌─────────────────────────────────────────────────┐
│  [choice-type-glow — 1px colored line at top]   │
│                                                  │
│  Italic prose describing the intervention        │
│  intent. Multiple lines, serif font, low         │
│  opacity that brightens on hover/select.         │
│                                                  │
│  supportive · ◆ 2 essence · +20% success        │  ← meta, visible on hover
│                                                  │
│  "God voice quote appears here"                  │  ← revealed on select
│                                                  │
│  [left border glow — appears on hover/select]    │
└─────────────────────────────────────────────────┘
```

**States:**
- **Rest:** Intent text at `rgba(180,170,150,0.4)`. Meta hidden. No background.
- **Hover:** Intent brightens to `rgba(212,196,158,0.75)`. Meta fades in. Faint background `rgba(212,175,55,0.03)`. Left border glow. Type-colored top line.
- **Selected:** Intent at full warmth. God-voice expands below (animated max-height). Background `rgba(212,175,55,0.06)`.

**Type colors (top glow line only):**
- Supportive: `rgba(134, 239, 172, 0.3)` — green
- Coercive: `rgba(249, 115, 22, 0.3)` — amber
- Withdrawn: `rgba(160, 160, 170, 0.2)` — grey

### Aftermath Mode

When `model.aftermath` is present:

- Art stays but at reduced opacity (0.5) + `saturate(0.7)`
- Step dots all show as "resolved"
- Resolved encounter title + "chose [approach]" agent line
- Prose describes the outcome (drop cap, same style)
- Below prose: aftermath section with:
  - Actor moments: portrait circle (initial letter fallback) + name + summary lines + marks
  - Changes: title + detail + tone-colored label (gain/loss/mixed)
  - Highlights: title + detail
  - Reactions: clickable prose blocks (same style as choice blocks)
- Footer: "Return to the world" button

### Entrance Animations

Staggered, matching OriginBeat timing:
1. Art fades in + slight zoom-out (`scale(1.02) → 1`) — 1.2s ease, 0.2s delay
2. Thread tier whisper — 0.8s, 0.6s delay
3. Step dots — 0.8s, 0.8s delay
4. Title + agent line — 0.8s, 0.9-1.0s delay
5. Gold divider — 1s, 1.1s delay
6. Prose — 1s, 1.2s delay
7. Choices — 1s, 1.5s delay
8. Footer + close button — 0.8s, 1.8-2.0s delay

Each uses `opacity: 0 → 1` + `translateY(8-16px) → 0`.

### Keyboard

- `Escape` — closes/disregards (same as clicking Resume/Close/Disregard)
- No other keyboard shortcuts needed (choices are click-only, matching OriginBeat)

### Narration Integration

Uses the EncounterStage pattern (per-paragraph + per-choice buttons):
- Each prose paragraph gets a small (22px) circular play/stop button positioned at its top-right
- Each choice block gets a narration button in its meta row
- State tracked via `activeNarrationId` (string matching `paragraph:{id}` or `choice:{id}`)
- Uses `useNarration()` hook: `speak(text)` for individual items, `stop()` to halt

No `.chronicle-prose` CSS selector needed — narration text is extracted from model data, not from DOM.

## Data Contract Extensions

### EncounterStageChoiceModel (types.ts)

Add three optional fields:

```typescript
export interface EncounterStageChoiceModel {
  // ... existing fields ...
  interventionType?: 'supportive' | 'coercive' | 'withdrawn';
  godVoice?: string;
  probabilityBoost?: number;
}
```

These are optional so existing adapters don't break. The Veil renders type glow and god-voice only when present.

### EncounterTemplate (encounter.ts)

Add optional illustration fields (matching UnifiedActionTemplate):

```typescript
// In EncounterTemplate interface:
readonly illustrationUrl?: string;
readonly illustrationAlt?: string;
```

### buildSimpleEncounterStageModel Adapter

New adapter that converts raw encounter data into EncounterStageModel:

**Input:** Same data TieredEncounterModal currently receives:
```typescript
interface BuildSimpleEncounterStageModelArgs {
  notification: EncounterNotification;
  encounter: ActiveEncounterDisplay;
  template: EncounterTemplate;
  agentName: string;
  agentId: string;
  graph: WorldGraph;
  threadTier: ThreadTier;
  essence: number;
  tick: number;
}
```

**Responsibilities:**
- Prose enrichment (currently inline in TieredEncounterModal lines 699-722): call `resolveEncounterNarrative()` + `enrichProse()`, split into paragraphs
- Map `EncounterInterventionChoice[]` → `EncounterStageChoiceModel[]` (including interventionType, godVoice, probabilityBoost)
- Build header from template name, agent name, thread tier, threat rating
- Build history from template steps + encounter progress
- Populate illustration from template.illustrationUrl (if present)
- Build scene from step narrative
- Return complete EncounterStageModel

## GameView Wiring Changes

### Current rendering block (lines 2809-2853)

```tsx
// Two conditional branches:
{tieredEncounterState && shouldUseEncounterStage && encounterStageModel && (
  <EncounterStage ... />
)}
{tieredEncounterState && (!shouldUseEncounterStage || !encounterStageModel) && (
  <TieredEncounterModal ... />
)}
```

### Proposed rendering block

```tsx
{tieredEncounterState && encounterVeilModel && (
  <EncounterVeil
    open={true}
    model={encounterVeilModel}
    threadTier={tieredEncounterState.threadTier}
    essence={totalEssence}
    tick={gameState.tick}
    autoResolveTick={tieredEncounterState.notification.autoResolveTick}
    onIntervene={handleEncounterIntervene}
    onBoost={handleEncounterBoost}
    onPeek={handleEncounterPeek}
    onDisregard={handleEncounterDisregard}
    onAcknowledgeAftermath={handleEncounterAcknowledgeAftermath}
    onAftermathReaction={handleEncounterAftermathReaction}
  />
)}
```

The `encounterVeilModel` is built via a unified memo:
```tsx
const encounterVeilModel = useMemo(() => {
  if (!tieredEncounterState) return null;
  // Try existing adapters first (gate-duty, unified)
  if (isGateDutyEncounterStage) return buildGateDutyModel(...);
  if (unifiedTemplateForStage) return buildUnifiedModel(...);
  // Fallback: simple adapter for legacy encounters
  return buildSimpleEncounterStageModel(...);
}, [tieredEncounterState, ...deps]);
```

### Handler callbacks

All existing handlers remain unchanged. The Veil calls them with the same signatures:
- `onIntervene(choiceId, essenceCost)` — strongly/lightly threaded
- `onBoost(essenceCost)` — watched tier
- `onPeek()` — watched tier peek gate
- `onDisregard()` — close without acting
- `onAcknowledgeAftermath()` — close aftermath
- `onAftermathReaction(reactionId)` — aftermath follow-up

## Illustration Catalog

Current encounter concept art (4 images):
- `/concept-art/encounters/gate-duty.jpg` — checkpoint scene
- `/concept-art/encounters/flawed-steel.jpg` — weapon/forge scene
- `/concept-art/encounters/soul-ferryman.jpg` — river crossing
- `/concept-art/encounters/road-ambush.jpg` — ambush scene

Location concept art available for fallback (22 images in `/concept-art/locations/`).
Biome concept art available (12 images in `/concept-art/`).

Strategy: Build the system now with the 4 encounter images. Add more art over time. The no-art fallback (void + prose) is the default for most encounters initially.

## Rollout Strategy

**Phase 1 (Foundation):** Create EncounterVeil + strongly threaded support. Wire alongside existing modals — Veil activates when encounterStageModel has an illustration, old modals otherwise.

**Phase 2 (Adapter bridge):** Create buildSimpleEncounterStageModel. Extend EncounterStageChoiceModel. All encounters can now produce a model.

**Phase 3 (All tiers):** Lightly threaded timer, watched peek/boost, no-art fallback. The Veil now handles every encounter type.

**Phase 4 (Aftermath + narration):** Aftermath view with actor moments. Per-paragraph narration buttons.

**Phase 5 (Migration):** Remove shouldUseEncounterStage routing. All encounters flow through EncounterVeil.

**Phase 6 (Cleanup):** Delete TieredEncounterModal.tsx and EncounterStage.tsx. Update tests. Net code reduction.

## NFP Compliance

| Priority | NFP | Status |
|----------|-----|--------|
| 1 | **Tunability** | PASS — Art opacity per tier, animation delays, color values, gradient stops are all named in component constants |
| 2 | **Inspectability** | PASS — Model-driven rendering. All display data traceable from EncounterStageModel fields |
| 3 | **Determinism** | PASS — No randomness in rendering. Same model = same output |
| 4 | **Fail-soft** | PASS — Missing illustration → no-art fallback. Missing interventionType → no type glow. Missing godVoice → no reveal. Every new field is optional |
| 5 | **Narrative over mechanical** | PASS — The entire design prioritizes narrative presentation over UI efficiency |
| 6 | **Additive** | PASS — New component alongside existing. Old modals stay as fallback until validated |
| 7 | **Performance** | PASS — CSS-only animations (no JS animation loops). Single background-image, no heavy compositing. Simpler than current two-modal system |

## Wiring Checklist

- [x] **Orchestrator phase:** N/A — UI-only change
- [ ] **UI component:** EncounterVeil.tsx rendered in GameView JSX
- [ ] **GameState flow:** Consumes tieredEncounterState (existing), encounterVeilModel (new memo)
- [ ] **Traces:** No new traces needed (display-only component)
- [ ] **Debug visibility:** Encounters already visible in DebugPanel
- [ ] **Prose pipeline:** Moved to adapter (buildSimpleEncounterStageModel calls enrichProse)
- [ ] **Player controls:** Same callbacks as current modals — onIntervene, onBoost, onPeek, onDisregard
