# Phase 17: Add Action Description Fields and Player Feedback on Activation — Research

**Researched:** 2026-03-30
**Domain:** React UI redesign, Three.js WebGL particles, data model extension
**Confidence:** HIGH — all findings based on direct codebase inspection

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Replace current action names with evocative spell-like names (Ars Magica style, e.g. "Call to Arms", "Bellum Fortis")
- Add new `description` field to templates — qualitative game-mechanical text, 2-3 sentences, no numbers/percentages
- Description focuses purely on what the action does and its effects (no prerequisites, cost, sphere, or reach)
- The existing `narrativeTemplates.initiation` text becomes flavor text (italic, dimmer) on the focused card — NOT replaced
- **Focused card (280px):** Top: spell name + cost badge → art frame (landscape rectangle, placeholder for now) → type line (reach + CRUD type) → technical description text box → italic flavor text (existing narrative initiation) → stats row (risk/range)
- **Hand cards (100px) in fan:** Art-only + name overlay. All detail only visible in focused view.
- Card ratio stays 5:7 (current CARD_ASPECT = 7/5)
- Art frame is placeholder rectangle (sphere-tinted gradient or generic sigil) until card art generation phase
- Target actions get the same feedback treatment as divine interventions
- **Card animation:** Sphere-colored glow burst expanding outward from card, then card fades to spent opacity
- **Audio:** Same sphere-tuned tones from existing SPHERE_AUDIO_CONFIG
- **Hex map particle burst:** Sphere-colored sparks/particle effect at target hex. New WebGL particle system in HexMapV2. Reusable for future effects.
- **Timing:** Animation-first — glow burst plays (~600ms), then action resolves and consequence message appears. Matches existing DRAWER_CLOSE_DELAY_MS pattern.
- **Toast notification:** Action outcome as sphere-colored toast (same system as divine interventions)
- **Visual distinction:** Sphere color + outcome icon — success checkmark/glow, failure dimmed/cracked icon
- **Message source:** Hybrid — new optional `consequenceMessage` field on templates. If present, use for toast. If absent, fall back to `narrativeTemplates.success/failure`.
- Consequence messages also continue to appear in narrative feed (dual output: toast + feed)

### Claude's Discretion

- Exact particle system implementation (Points vs Sprites, particle count, lifetime)
- Art placeholder design for cards (gradient, sigil, or simple sphere-color fill)
- Focused card height adjustment if needed to fit all content
- Spell name choices for all 108+ action templates (Ars Magica style, evocative, thematic per reach)
- Technical description text for all 108+ templates (qualitative, 2-3 sentences each)
- Exact toast duration and dismissal timing

### Deferred Ideas (OUT OF SCOPE)

- **Card art generation** — Generate 108+ unique concept art images. Separate phase.
- **Custom consequence messages** — Content phase can add hand-written `consequenceMessage` strings.

</user_constraints>

---

## Summary

Phase 17 is a pure UI enrichment phase with three interlocking concerns: (1) data model extension to add `spellName` and `description` fields to all 108+ action templates, (2) a focused ActionCard redesign to an MTG-classic frame layout, and (3) activation feedback parity between target_action slots and existing divine intervention slots.

All the infrastructure already exists and just needs to be extended. The `WheelSlot.description` field is already rendered by ActionCard. The `SPHERE_AUDIO_CONFIG` and `DIVINE_INFLUENCE_CONSTANTS` are already used for divine interventions — they need to be reused for target_action type slots via `useAgentInteraction`. The `ToastStack` already handles sphere-colored toasts. The only genuinely new work is: (a) adding `spellName` + `description` + optional `consequenceMessage` to `UnifiedActionTemplate`, (b) migrating all 108+ templates with spell names and descriptions, (c) redesigning the focused/hand card layouts, and (d) implementing the WebGL particle system in HexMapV2.

**Primary recommendation:** Implement in four waves — type model first, then content, then card UI, then particle system. The particle system is the highest-risk item and should be self-contained in its own HexMapV2 module.

---

## Standard Stack

### Core (already in use — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | Component system | Project standard |
| Three.js | 0.183.2 | WebGL renderer (particle system) | Project standard — raw Three.js, no R3F |
| Tailwind CSS v4 | v4 | Utility classes | Project standard |
| vitest + @testing-library/react | current | Component tests | Project standard |

### No new npm packages required

All functionality is achievable with existing dependencies. Three.js `Points` or `Sprite` system covers the particle burst.

---

## Architecture Patterns

### Data Model Extension: `UnifiedActionTemplate`

**File:** `src/types/unifiedAction.ts`

Two new optional fields plus one mandatory field:

```typescript
// In UnifiedActionTemplate (src/types/unifiedAction.ts):

/** Evocative spell-like display name (Ars Magica style, max 3 words).
 * Replaces current `name` in focused card spell-name zone.
 * Current `name` is kept for engine/debug identification.
 */
readonly spellName?: string;

/** Qualitative game-mechanical description — 2-3 sentences, no numbers.
 * Shown in the focused card description text box.
 * If absent, ActionCard falls back to slot.description (narrativeTemplates.initiation).
 */
readonly description?: string;

/** Optional custom consequence message for toast/feed output.
 * If absent, falls back to narrativeTemplates.success/failure.
 * Hybrid field: allows selective customization without rewriting all templates.
 */
readonly consequenceMessage?: {
  readonly success: string;
  readonly failure: string;
};
```

**CRITICAL:** `spellName` is optional to preserve backward compatibility. The `migrateActionTemplate()` function in `unified-action-templates.ts` passes through new fields; no migration logic change is needed as long as the type accepts them as optional.

### WheelSlot Extension

**File:** `src/engine/wheel.ts`

`WheelSlot` needs two new fields to carry the new data to the card:

```typescript
// In WheelSlot interface (src/engine/wheel.ts):

/** Evocative spell name — displayed in card name zone (focused).
 * Falls back to label if absent.
 */
spellName?: string;

/** Technical description from template.description.
 * Replaces current description (which was narrativeTemplates.initiation).
 * Current description value becomes flavor text.
 */
flavorText?: string;
```

**Key insight:** The current `WheelSlot.description` field is populated from `narrativeTemplates.initiation` in `getTargetActionSlots()` (line 227 of `targetActions.ts`). For Phase 17, this field continues as `description` for the flavor text role. A new `flavorText` on WheelSlot would duplicate it — simpler to leave description as-is and add `spellName` only. The ActionCard redesign then sources:
- Spell name zone: `slot.spellName ?? slot.label`
- Description text box: a new `slot.technicalDescription` field (populated from `template.description`)
- Flavor text: `slot.description` (existing, was `narrativeTemplates.initiation`)

So `WheelSlot` needs one new field: `technicalDescription?: string`.

### ActionCard Focused Layout (MTG Frame)

**File:** `src/components/Game/ActionCard.tsx`

The existing `SIZE_CONFIG.focused` layout is replaced entirely. The component's render logic for `size === 'focused'` changes to the MTG frame structure. `SIZE_CONFIG` structure is preserved — only `focused` values change.

Current focused card content (from reading the file):
1. Cost badge (absolute, top-right)
2. Glyph (large, centered)
3. Name (h3, semibold)
4. Description (p, clamped)
5. Sustained badge (conditional)
6. Risk + Range row (mt-auto)

New focused card content (MTG frame):
1. Cost badge (absolute, top-right) — unchanged
2. **Spell name bar** (36px zone): `slot.spellName ?? slot.label`, Cinzel 18px/600
3. **Art frame placeholder** (112px zone): sphere gradient + sphere glyph at 32px
4. **Type line** (20px zone): gold rule above + `[GLYPH] REACH · CRUD TYPE`
5. **Description text box** (~80px flex): `slot.technicalDescription`, Alegreya Sans 16px/400
6. **Flavor text** (~48px flex): `slot.description` (existing field), italic, dimmer
7. **Stats row** (28px, mt-auto): existing risk + range — unchanged

**Art frame placeholder implementation (from UI-SPEC):**
```typescript
// Art frame zone
<div
  aria-hidden="true"
  style={{
    height: '112px',
    background: `linear-gradient(145deg, ${sphereColor}20 0%, #111114 100%)`,
    border: `1px solid ${sphereColor}30`,
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  }}
>
  <span style={{ fontSize: '32px', color: `${sphereColor}60` }}>
    {glyph}  {/* sphere Unicode glyph */}
  </span>
</div>
```

### ActionCard Hand Layout (Art-Only)

Current hand cards show: glyph + name + description. New hand cards show: art frame background + name overlay only. The `SIZE_CONFIG.hand` widthPx stays 100px.

**Key change:** The entire card background becomes the art frame (sphere gradient). Name overlays from absolute position at bottom. No description, type line, or stats row visible in hand.

```typescript
// Hand layout: full-card art frame background
// Applied via containerStyle (already sphere-tinted) + no glyph/description rendered at hand size
// Name overlay: absolute bottom, bg-abyss 70% opacity backdrop

if (size === 'hand') {
  // Render: cost badge + name overlay only
  // Art frame = card background itself (sphere gradient fills card)
}
```

### Glow Burst Animation

From the UI-SPEC, the `cardPulse` animation in ActionCard gets an alternative `cardGlowBurst` keyframe:

```css
@keyframes cardGlowBurst {
  0%   { box-shadow: 0 0 0 0px ${sphereColor}40; transform: scale(1); }
  40%  { box-shadow: 0 0 24px 12px ${sphereColor}60; transform: scale(1.02); }
  100% { box-shadow: 0 0 0 0px ${sphereColor}00; transform: scale(1); opacity: 0.7; }
}
```

Duration: 600ms (matches `DRAWER_CLOSE_DELAY_MS`). This replaces the existing `cardPulse` keyframe for target_action activation (divine interventions keep their existing animation for now — or both can use the enhanced burst).

### Target Action Activation (useAgentInteraction)

**File:** `src/components/Game/hooks/useAgentInteraction.ts`

Currently `handleInterventionConfirm` handles divine interventions and fires audio + toast. Target actions (`target_action` slot type) have no equivalent handler for audio or toast.

Looking at the hook, the key missing piece is a `handleTargetActionClick` or extending `handleWheelSlotClick` to handle `type === 'target_action'` slots via the `createUnifiedAction` path with audio + particle + toast feedback.

The existing `handleWheelSlotClick` already guards for `pendingIntervention || playingCardId` and routes `scry` separately. The target_action flow needs to be added here — it's simpler than interventions (no agenda picker, no confirmation modal) and can fire directly.

**Sequence for target actions:**
1. `handleWheelSlotClick` identifies `slot.type === 'target_action'`
2. Sets `playingCardId` immediately (triggers glow burst)
3. Calls `playCastSound(slot.sphere)` (reusing existing audio hook)
4. Dispatches callback to HexMapV2 for particle burst at target hex
5. Calls `createUnifiedAction(...)` and updates `gameState.unifiedActions`
6. After `DRAWER_CLOSE_DELAY_MS` (600ms): pushes toast, clears `playingCardId`, closes drawer

**Toast content:**
- Message: `${sphere} — Action Resolved` / `${sphere} — Action Failed`
- Body: `template.consequenceMessage?.success` → fallback `narrativeTemplates.success`
- Sphere: `slot.sphere` for color
- Navigation: target agent/hex as `navigationTarget`

### Particle Burst WebGL System (HexMapV2)

**File:** New `src/components/HexMapV2/scene/ParticleBurstMesh.ts`

The `BattleIndicatorMesh.ts` pattern is the closest precedent — it uses a `Sprite` per battle, with a factory + per-frame tick. The particle system needs a different approach: a `THREE.Points` object with particle positions that animate over time.

**Implementation pattern (Three.js Points approach):**

```typescript
// src/components/HexMapV2/scene/ParticleBurstMesh.ts

import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { LAYER_Z } from './RenderLayers';  // Use new LAYER_Z.PARTICLE_BURST constant

// NFP #1: All tunable constants named
export const PARTICLE_CONSTANTS = {
  COUNT: 16,                    // Particles per burst
  LIFETIME_MS: 800,             // Total animation duration
  EXPAND_RADIUS: 32,            // Max spread in world units
  SIZE: 4.0,                    // Points sizeAttenuation size
  SPAWN_OPACITY: 0.8,           // Initial opacity
} as const;

interface ActiveBurst {
  points: THREE.Points;
  startMs: number;
  hexCol: number;
  hexRow: number;
  color: string;
}

// Factory: create a burst group (call on action activation)
export function spawnParticleBurst(
  scene: THREE.Scene,
  hexCol: number,
  hexRow: number,
  hexSize: number,
  color: string,
): ActiveBurst { ... }

// Per-frame: animate all active bursts, remove completed
export function tickParticleBursts(
  bursts: ActiveBurst[],
  elapsedMs: number,
): ActiveBurst[] { ... }
```

**RenderLayers.ts extension:**
```typescript
// Add to LAYER_Z in RenderLayers.ts:
PARTICLE_BURST: 6.060,  // Above BATTLE_INDICATOR (6.050), below EVENTS (6.100)
```

**HexMapV2 integration:** The `HexMapV2Handle` interface (currently exposes `centerOn`) needs a `spawnParticleBurst(hexCol, hexRow, sphere)` method or equivalent callback prop. The `useAgentInteraction` hook calls this after action dispatch.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Sphere-colored audio tones | Custom audio synthesis | Existing `useInterventionAudio.playCastSound(sphere, false)` |
| Toast notifications | Custom toast component | Existing `ToastStack` + `ToastItem` type |
| Sphere color lookup | Hardcoded color map | Existing `getSphereColor(sphere)` from `src/data/sphereIcons.ts` |
| Card animation timing | Custom timer | Existing `DIVINE_INFLUENCE_CONSTANTS.DRAWER_CLOSE_DELAY_MS` (600ms) |
| Template ID lookup | Custom lookup | Existing `getUnifiedTemplateById()` from `unified-action-templates.ts` |
| UnifiedAction creation | Manual action construction | Existing `createUnifiedAction()` from `unifiedActionLifecycle.ts` |
| Hex-to-world coordinates | Custom math | Existing `hexToWorld()` from `src/lib/worldPosition.ts` |

---

## Common Pitfalls

### Pitfall 1: Focused Card Height Overflow

**What goes wrong:** The MTG frame adds significant content (art frame 112px + type line 20px + description ~80px + flavor ~48px). Total content: 36 + 112 + 20 + 80 + 48 + 28 = 324px plus padding. Focused card total height = 280 × 1.4 = 392px. Available interior height after padding (py-4 = 16px top + 16px bottom) = 392 − 32 = 360px. This is tight — description and flavor text zones must use `flex-grow` not fixed heights to allow natural wrapping without overflow.

**How to avoid:** Use `flex-1 min-h-0 overflow-hidden` on the description + flavor text container. The art frame is the one fixed-height zone (112px). All other zones are min-height with flex growth.

**Warning signs:** Card content pushing below card border at 280px width in browser.

### Pitfall 2: WheelSlot `description` Field Semantic Change

**What goes wrong:** Currently `WheelSlot.description` is populated from `narrativeTemplates.initiation` in both `getAgentWheelSlots()` (wheel.ts) and `getTargetActionSlots()` (targetActions.ts line 227). Phase 17 repurposes this as flavor text. If `description` is renamed or repopulated differently, it breaks the existing tests that assert `slot.description` value.

**How to avoid:** Keep `WheelSlot.description` as-is (flavor text role). Add new `WheelSlot.technicalDescription?: string` for the new mechanical text. In `getTargetActionSlots()`, populate `technicalDescription` from `template.description` when present.

**Warning signs:** `ActionCard.test.tsx` failing after slot shape change.

### Pitfall 3: Hand Card Test Breakage from Layout Change

**What goes wrong:** `ActionCard.test.tsx` asserts `screen.getByText('Manipulate selection probabilities during sleep')` — the description text. After changing hand cards to art-only, this text is no longer rendered at `size='hand'` (default). The test will fail.

**How to avoid:** Update `ActionCard.test.tsx` tests that check description visibility to use `size="focused"` prop when verifying description text. Add new tests for hand card art-only layout.

**Warning signs:** CI failure on `ActionCard.test.tsx` after layout change.

### Pitfall 4: HexMapV2 Particle System Z-Fighting

**What goes wrong:** Particle burst at `LAYER_Z.PARTICLE_BURST = 6.060` sits in the agents/events zone (6.000–6.100). Agent sprites at 6.000 could cause z-fighting with particles if the Points geometry is too close in Z.

**How to avoid:** Assign `LAYER_Z.PARTICLE_BURST = 6.060` (between BATTLE_INDICATOR at 6.050 and EVENTS at 6.100). Use `renderOrder` property on the Points object to reinforce ordering. Particles are transparent so z-fighting is less visually damaging — fail-soft acceptable.

### Pitfall 5: `playCastSound` Called Without User Gesture

**What goes wrong:** Web Audio API requires a user gesture before `AudioContext` can be created or resumed. If `playCastSound` is called outside a direct event handler chain, it may silently fail on browsers requiring user gesture.

**How to avoid:** The existing `useInterventionAudio` already handles `AudioContext.resume()` and has fail-soft (try/catch around `new AudioContext()`). The new target_action call path must ensure it originates from the click handler chain. Do not call it inside a `setTimeout` callback — call it before the timeout.

### Pitfall 6: 108+ Template Content Migration Scale

**What goes wrong:** Writing `spellName` and `description` for 108+ templates in a single plan risks missing templates or inconsistent quality. Template content lives in three files: `action-template-content.ts` (36 templates), `encounter-content.ts` (10+ templates), and `UNIFIED_ACTION_TEMPLATES` in `unified-action-templates.ts` (remaining divine templates).

**How to avoid:** Separate content migration into its own plan. The type extension (Plan 1) and card UI changes (Plan 2) are independent of content completeness — ActionCard must gracefully fall back to `slot.label` when `spellName` is absent and to `slot.description` when `technicalDescription` is absent.

---

## Code Examples

### How Target Action Slots Are Built (current state)

```typescript
// src/engine/targetActions.ts lines 214–230 (condensed)
slots.push({
  id: slotId,
  label: template.name,           // ← becomes slot.label
  type: 'target_action',
  // ... other fields ...
  description: template.narrativeTemplates.initiation,  // ← currently sets description
  // Phase 17: add technicalDescription: template.description
});
```

After Phase 17:
```typescript
slots.push({
  // ... unchanged fields ...
  description: template.narrativeTemplates.initiation,  // flavor text (kept)
  technicalDescription: template.description,           // new mechanical text
  spellName: template.spellName,                        // new spell name
});
```

### How Divine Intervention Audio Works (reuse pattern)

```typescript
// src/components/Game/hooks/useAgentInteraction.ts lines 263-264
// Currently: playCastSound(slot.sphere, result.detected);
// For target actions (no detection): playCastSound(slot.sphere, false);
```

The `playCastSound` signature already accepts `detected: boolean` which controls the secondary discordant tone. Target actions pass `false` — clean tone, no dissonance.

### Toast Creation Pattern (from existing events in useAgentInteraction)

```typescript
// Adapt existing event push pattern (lines 277-288):
const toastMessage = template.consequenceMessage?.success
  ?? template.narrativeTemplates.success
  ?? 'The outcome ripples outward.';

// Push to toasts via notificationRouter or direct state
recentEvents: [...prev.recentEvents, {
  id: `evt_action_${prev.tick}_${Date.now()}`,
  tick: prev.tick,
  type: 'narrative' as const,
  message: `${slot.sphere ? capitalize(slot.sphere) : 'Action'} — Action Resolved. ${toastMessage}`,
  significance: 0.5,
  sphere: slot.sphere ?? undefined,
}]
```

Note: The project routes toasts via `NotificationState.toasts` (see `src/types/notification.ts`). Phase 17 should push to the toast stack directly via `setGameState` updating `notifications.toasts`, matching how other toasts are created.

### HexMapV2Handle Callback Pattern

```typescript
// src/components/HexMapV2/HexMapV2.tsx (existing handle shape)
export interface HexMapV2Handle {
  centerOn: (coord: HexCoord) => void;
  // Phase 17: add:
  spawnParticleBurst: (hexCol: number, hexRow: number, sphereColor: string) => void;
}
```

The ref callback pattern: `hexMapRef.current?.spawnParticleBurst(hexCol, hexRow, color)` called from `useAgentInteraction` after action dispatch.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| WheelSlot.description = narrativeTemplates.initiation (mechanical text) | WheelSlot.description = narrativeTemplates.initiation (flavor text) | Field repurposed — tests need updating |
| ActionCard hand = glyph + name + description | ActionCard hand = art-only + name overlay | Visual upgrade — more card-game-like |
| Divine interventions have audio/glow/toast; target actions have nothing | Both have full feedback parity | Feature addition |
| No particle system in HexMapV2 | New reusable particle burst mesh | New module — no refactoring needed |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest + @testing-library/react |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --reporter=verbose ActionCard` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| ActionCard focused renders spell name zone | unit | `npm test -- src/components/Game/__tests__/ActionCard.test.tsx` | Needs update |
| ActionCard focused renders art frame placeholder | unit | `npm test -- src/components/Game/__tests__/ActionCard.test.tsx` | Needs new test |
| ActionCard focused renders type line | unit | `npm test -- src/components/Game/__tests__/ActionCard.test.tsx` | Needs new test |
| ActionCard focused renders description + flavor separately | unit | `npm test -- src/components/Game/__tests__/ActionCard.test.tsx` | Needs new test |
| ActionCard hand renders art-only (no description text) | unit | `npm test -- src/components/Game/__tests__/ActionCard.test.tsx` | Needs new test |
| ActionCard playing triggers glow burst class | unit | `npm test -- src/components/Game/__tests__/ActionCard-feedback.test.tsx` | Needs update |
| getTargetActionSlots populates technicalDescription from template.description | unit | `npm test -- src/engine/__tests__/targetActions.test.ts` | Needs new test |
| WheelSlot.spellName populated when template.spellName present | unit | `npm test -- src/engine/__tests__/targetActions.test.ts` | Needs new test |
| ActionDrawer.test.tsx remains green | regression | `npm test -- src/components/Game/__tests__/ActionDrawer.test.tsx` | Needs check |

### Sampling Rate

- **Per task commit:** `npm test -- src/components/Game/__tests__/ActionCard`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Update `src/components/Game/__tests__/ActionCard.test.tsx` — new focused layout assertions need `size="focused"` prop; existing description-at-hand tests will break
- [ ] Update `src/components/Game/__tests__/ActionCard-feedback.test.tsx` — glow burst animation class name change
- [ ] Existing `ActionDrawer.test.tsx` — verify no breakage from slot shape change

---

## Open Questions

1. **HexMapV2Handle extension approach**
   - What we know: `HexMapV2Handle` currently exposes only `centerOn`. Extending it requires changes to both the interface definition and the `useImperativeHandle` call inside `HexMapV2.tsx`.
   - What's unclear: Whether `HexV2View.tsx` or `GameView.tsx` holds the ref — the particle callback needs to travel from `useAgentInteraction` (inside GameView) to the ref. Needs a quick trace of how `hexMapRef` is passed down.
   - Recommendation: Alternatively, use a React callback prop `onParticleBurst` passed directly to HexMapV2 component, which is simpler than extending the imperative handle.

2. **Notification routing for action outcome toast**
   - What we know: `ToastStack` is rendered in `GameView.tsx` and receives `toasts` from `NotificationState`. The existing pattern for divine interventions pushes to `recentEvents` (which the notification router converts to toasts) not directly to `notifications.toasts`.
   - What's unclear: Whether Phase 17 should push to `recentEvents` (existing path through notification router) or directly to `notifications.toasts` (more direct, matches the UI-SPEC's "sphere-colored toast with outcome icon" which needs `sphere` on `ToastItem`).
   - Recommendation: Push directly to `notifications.toasts` with explicit `sphere` field set. The existing divine intervention flow pushes to `recentEvents` — that path loses the sphere color in the toast since the router may not propagate it. Direct push gives full control over toast appearance.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection of all canonical reference files listed in CONTEXT.md
- `src/types/unifiedAction.ts` — UnifiedActionTemplate interface
- `src/components/Game/ActionCard.tsx` — SIZE_CONFIG, current layout
- `src/components/Game/ActionDrawer.tsx` — fan layout, focused card flow
- `src/components/Game/hooks/useAgentInteraction.ts` — action dispatch pipeline
- `src/components/Game/hooks/useInterventionAudio.ts` — audio synthesis pattern
- `src/data/intervention-feedback-content.ts` — DIVINE_INFLUENCE_CONSTANTS, SPHERE_AUDIO_CONFIG
- `src/engine/targetActions.ts` — slot building, description population
- `src/engine/wheel.ts` — WheelSlot interface
- `src/components/Game/ToastStack.tsx` — toast system
- `src/types/notification.ts` — ToastItem interface
- `src/components/HexMapV2/scene/RenderLayers.ts` — LAYER_Z constants
- `src/components/HexMapV2/scene/BattleIndicatorMesh.ts` — Sprite pattern for reference
- `.planning/phases/17-.../17-UI-SPEC.md` — UI design contract (approved)

---

## Metadata

**Confidence breakdown:**
- Type model changes: HIGH — direct inspection of all type files, no guesswork
- Card layout redesign: HIGH — UI-SPEC is approved and fully specced
- Audio/toast feedback: HIGH — existing infrastructure well-understood
- Particle system: MEDIUM — Three.js Points is standard but exact HexMapV2 integration needs care around ref/callback approach
- Content migration (108+ spell names + descriptions): MEDIUM — scope is understood, quality is Claude's discretion

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable codebase, no external dependencies)
