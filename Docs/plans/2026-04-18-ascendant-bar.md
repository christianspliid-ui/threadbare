# THR-184 — Ascendant Bar: Implementation Plan

**Status:** Ready for Dev
**Owner (design):** Cowork / 2026-04-18
**Linear:** [THR-184](https://linear.app/threadbare/issue/THR-184)
**Handoff bundle:** `Design/Claudedesignhandooffs/ascendant-bar/`
**Authoritative spec:** `Design/Claudedesignhandooffs/ascendant-bar-prompt.md` — read the **"Post-v2 review decisions"** section; it supersedes earlier guidance in the same file.
**Prototype:** `Design/Claudedesignhandooffs/ascendant-bar/project/Ascendant Bar.html` (+ `lib/AscendantBar.jsx`)

## Scope

Build the Ascendant Bar — a 360 px fixed-width left rail that becomes the player's primary self-view while a run is live. It merges and supersedes three existing chrome surfaces:

1. `IdentityChip` (top bar) → subsumed by the Identity+Quintessence strip inside the bar.
2. `AvatarHUD` (floating bottom-left overlay) → subsumed by the bar's Action tray and portrait controls.
3. `EssencePanel` / `MandateTracker` (currently right-rail widgets rendered inside `GameView` right-rail area) → relocated into the bar as foldable rows.

The bar ships with five foldable sections in this vertical order: **Identity+Quintessence**, **Essence**, **Actions**, **Mandate**, **Hooks** (the prototype's `BarSection` primitive drives all five). `AscendantSheet` remains the deeper detail drawer; the bar is the always-on surface.

This is **UI + thin selector work**. The engine already exposes every piece of state the bar needs (verified below). The only engine-adjacent work is a single pure helper for tray classification.

## Three-pillar check

- **Engine:** Thin. One new pure helper in `src/engine/ascendantTray.ts`, zero new GameState fields, zero new graph edges, zero tick-phase work. Quintessence, essence, mandate, unified-action template infrastructure are all in place.
- **Content:** Prose tables for the quintessence ladder's **generic per-sphere poetic placeholder** (extension point: `perSpherePoetics`), tooltip copy for each band, and the action tray's per-tier "empty" prose. No new encounter templates.
- **UI:** The bar itself (five sections), the sigil-based portrait with band-responsive halo, the 12-sphere expandable essence rows, the Core/Self/Rare action tray, the Mandate row pulling from the existing `MandateState`, and removal of the three superseded surfaces.

## Open questions closed before Ready for Dev

| # | Question | Resolution |
|---|----------|------------|
| 1 | Plan doc exists? | Yes — this document. |
| 2 | Mount point confirmed? | Yes — `GameView.tsx` line ~2709, first child of the main flex row. Details in **Mount & layout**. |
| 3 | Action-template pool + tier tag filter exists engine-side, or needs to be added? | **Does not exist; addition is minimal and pure.** `UnifiedActionTemplate` carries `rarityTier` (1–4), `intrinsicTier` (AttentionTier), `scale`, and `targetCategories`, but no Core/Self/Rare axis. We add one pure function (no new template field) that derives the tray tier from existing fields + target context. Details in **Engine pillar → Tray tier derivation**. |

## Mount & layout (1920 × 1080 viewport contract)

The Ascendant Bar mounts inside the main content flex row at `src/components/Game/GameView.tsx` ~line 2709:

```jsx
<div className="flex flex-1 overflow-hidden">
  {/* NEW: Ascendant Bar rail — 360 px fixed width */}
  <AscendantBar />
  {/* Existing map column — unchanged structurally, now center column */}
  <div className="flex-1 flex flex-col overflow-hidden relative">
    ...HexMapV2...
  </div>
  {/* Existing right rail (events, codex, etc.) — unchanged */}
</div>
```

Width contract: `width: 360px; flex-shrink: 0; overflow-y: auto; height: 100%;`. Internal scroll only; never pushes the map narrower than the right rail requires at 1920 × 1080. If the existing right rail is wide enough that 360 px + map + right rail exceeds 1920, collapse the right rail's secondary column first — do not shrink the bar. The spec width is non-negotiable.

**Superseded surfaces to remove in the same PR:**

- `IdentityChip` in `GameView.tsx` top bar (line ~2541 and the `ascendantSheetOpen` handler wired to it) — replaced by the bar's Identity strip; the sheet open handler moves to the portrait/"View full sheet" affordance inside the bar.
- `AvatarHUD` overlay (line ~2761) and its four callbacks (`onCenterOnAvatar`, `onMoveClick`, `onWheelClick`, `onScryClick`) — centering-on-avatar becomes the portrait click, and Move / Wheel / Scry become entries in the Actions tray's Self tier (already systemically defined as actor-targeting templates). The `AgendaPicker` / `AscendantSheet` callbacks that the HUD fed into remain — they are now triggered from the bar's equivalent controls. Keep the callbacks; move their call sites.
- `EssencePanel` right-rail widget and `MandateTracker` right-rail widget — replaced by the bar's Essence and Mandate sections. Remove their JSX usage; the underlying components can stay in the repo for `?view=styleguide` preview but should no longer be mounted in `GameView`.

Keep `AscendantSheet` intact — the bar is the at-a-glance layer; the sheet is the deeper drill-down, opened from the Identity strip's "Open sheet" affordance.

## Engine pillar

### New file: `src/engine/ascendantTray.ts`

A single pure module. No state, no traces, no tick phase, no graph mutation.

```ts
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { TargetContext } from '../types/targetContext';

export type AscendantTrayTier = 'core' | 'self' | 'rare';

/**
 * Classify a template for the ascendant bar's action tray.
 *
 * Pure derivation from existing template fields + target context.
 * No new template field is introduced; tuning is done by adjusting this function.
 *
 * Rules (authored; tunable — NFP #1):
 *   - Self tier  : the template targets the ascendant themselves
 *                  (target node id === ascendantId, OR targetCategories === ['actor']
 *                  and the template's actorAffinities include 'ascendant' only).
 *   - Rare tier  : template.rarityTier >= 3  (Mythic or Legendary)
 *                  OR template.intrinsicTier === 'story_beat'.
 *   - Core tier  : everything else that survives context filtering.
 *
 * The function is pure; callers memoize on (ascendantId, targetContext.nodeId, template pool version).
 */
export function classifyTrayTier(
  template: UnifiedActionTemplate,
  ctx: { ascendantId: string; target: TargetContext | null }
): AscendantTrayTier { /* ... */ }
```

**Tunable constants** (NFP #1) in the same file:

```ts
export const TRAY_RARE_RARITY_TIER_MIN = 3;               // Mythic
export const TRAY_SELF_TARGET_CATEGORIES = ['actor'] as const;
```

### Selectors (UI-side, not engine GameState fields)

Live in `src/components/Game/ascendant-bar/selectors.ts`. All are pure, take `GameState` (+ any UI-local inputs like the filtered template pool), and feed React memos keyed on `gameState.worldVersion`.

| Selector | Returns | Source |
|----------|---------|--------|
| `selectAscendantIdentityView(state)` | `{ divineName, mortalName, court, sphereAlignment, epithet, portraitAsset, sphereGlyph }` | `state.ascendantIdentity`, `state.ascendantId` (graph node) |
| `selectQuintessenceView(state)` | `{ ratio, band: 'transcendent' \| 'healthy' \| 'strained' \| 'weakened' \| 'critical' \| 'dissolving', halo }` | `getQuintessenceRatio(ascendantNode)` + `getQuintessenceThresholdState(ascendantNode)` + new transcendence check (see below) |
| `selectEssenceRows(state)` | `SphereName[]` rows each `{ sphere, current, max, generation, primary, secondary }` | `state.essencePool`, `state.ascendantIdentity.sphereAlignment`, existing `EssenceGeneration` if surfaced |
| `selectActionTray(state, templatePool, target)` | `{ core: Template[]; self: Template[]; rare: Template[]; empty: boolean }` | `templatePool` + `classifyTrayTier(...)` + existing `getTargetActionSlots` filtering |
| `selectMandateRow(state)` | `{ direction, stage, primary, secondary, tickBudget, courtType, stageProgressText }` | `state.mandateDefinition`, `state.mandateState` |

**Quintessence band → design-spec band mapping:**

The engine's `QuintessenceThresholdState` is `'healthy' \| 'strained' \| 'weakened' \| 'critical' \| 'broken'`. The design spec uses `'transcendent' \| 'healthy' \| 'strained' \| 'weakened' \| 'critical' \| 'dissolving'`.

Mapping:

| Engine state | UI band | Extra condition |
|--------------|---------|-----------------|
| `healthy` | `transcendent` | `ratio === 1.0` **and** `quintessenceMax` has been elevated above its archetype default (add small helper `isAtTranscendence(node)`) |
| `healthy` | `healthy` | otherwise |
| `strained` | `strained` | — |
| `weakened` | `weakened` | — |
| `critical` | `critical` | — |
| `broken` | `dissolving` | — |

`isAtTranscendence(node)` is a 3-line helper in `src/types/quintessence.ts`; purely derived from existing node properties.

### Tracing

No new trace categories. The bar consumes existing state — it does not write.

### Fail-soft table (NFP #4)

| Failure | Fallback |
|---------|----------|
| `ascendantIdentity` is `null` (legacy archetype-only game) | Render the bar with archetype name + archetype copy from `ARCHETYPE_COPY`; hide the divine-name line. |
| `mandateDefinition` is `null` (first-run pre-mandate state) | Render Mandate section with "Awaiting mandate" placeholder prose; hide progress bars. |
| Ascendant graph node missing | Bar renders with defaults: quintessence ratio = 1.0, essence = all zeroes, identity = `"Ascendant"`. Log once to the trace buffer via `logDebug` (not a new trace category). |
| `classifyTrayTier` throws (should not — pure) | Caller catches per-template and drops the template from the tray with a console warning. |
| Portrait asset missing | Fallback to the primary-sphere glyph-only SVG (no raster). Spec already requires `uploads/avatar-mind.png` default — see **Content pillar**. |

## Content pillar

### Prose tables (new)

All additions live in `src/data/ascendant-bar-content.ts` (new file). Shape:

```ts
export const BAND_TOOLTIP: Record<QuintessenceBand, string> = { ... };
export const ARCHETYPE_COPY: Record<ArchetypeId, { epithet: string; identityLine: string }> = { ... };
export const SPHERE_COPY: Record<SphereName, { label: string; role: string }> = { ... };

/**
 * Extension point for per-sphere quintessence poetics.
 * Placeholder ladder reused for all 12 spheres at v1 — content authors fill
 * sphere-specific entries as they diverge. Never hardcode prose into components.
 */
export const perSpherePoetics: Partial<Record<
  SphereName,
  Record<QuintessenceBand, string>
>> = {};
export const GENERIC_QUINTESSENCE_LADDER: Record<QuintessenceBand, string> = { ... };
export function quintessenceLine(sphere: SphereName, band: QuintessenceBand): string {
  return perSpherePoetics[sphere]?.[band] ?? GENERIC_QUINTESSENCE_LADDER[band];
}
```

Content is lifted verbatim from the prototype's constants (`ARCHETYPE_COPY`, `SPHERE_COPY`, `BAND_TOOLTIP`) and from the handoff prompt's "per-sphere poetics placeholder" section. Do not invent new copy — the design doc is authoritative.

### Portrait asset — `uploads/avatar-mind.png` default

The prototype references `assets/portraits/vara.jpg` (a placeholder that does not exist in our `public/` tree). Per the spec's Post-v2 review decisions, default portrait resolution is:

1. Use `ascendantIdentity.portraitAsset` if present.
2. Otherwise use `/uploads/avatar-<primarySphere>.png` (e.g., `/uploads/avatar-mind.png` for a Mind-aligned ascendant).
3. Otherwise render the primary-sphere glyph (SVG, no raster) inside the sigil-halo frame.

Ship one default raster per sphere (12 files) under `public/uploads/` as part of this PR. Art team can iterate in-place without code changes.

### Action tray prose — empty states

Per the spec, the empty-tier treatment defaults to **collapsed rows** (just the tier label), not placeholder cards. Add one-line prose for each:

- Core: "No core actions available at this target."
- Self: "No self-actions available."
- Rare: "No rare actions in reach."

Content authors can expand these over time; they live in `ascendant-bar-content.ts` under `TRAY_EMPTY_COPY`.

## UI pillar

### Component tree

```
src/components/Game/ascendant-bar/
  AscendantBar.tsx              # top-level rail; owns section open/closed state
  BarSection.tsx                # foldable primitive (lifted from prototype)
  IdentityStrip.tsx             # merged identity + quintessence (portrait, name, band, epithet)
  SigilHalo.tsx                 # band-responsive halo + primary-sphere glyph portrait frame
  QuintessenceLine.tsx          # sphere-specific or generic poetic line (via quintessenceLine())
  EssenceBlock.tsx              # expandable per-sphere rows (replaces 12-chip grid)
  EssenceRow.tsx                # one sphere row (glyph, label, fill bar, gen rate)
  ActionsBlock.tsx              # Core / Self / Rare groups
  ActionTierGroup.tsx           # labelled group with cards
  ActionCard.tsx                # single template card (spellName, cost, target label)
  MandateBlock.tsx              # reads MandateState, shows direction + stage + progress
  HooksBlock.tsx                # conditions / clues / vows summaries
  selectors.ts                  # selectors listed above
  styles.module.css             # scoped (no Tailwind dependencies for spec compliance)
```

### Interaction contracts

- **Portrait click** → `setAscendantSheetOpen(true)` (same handler the retired `IdentityChip` used).
- **Section header click** → toggle fold state (local React state, not persisted).
- **Essence row click** → expand/collapse sphere detail inline (not a modal).
- **Action card click** → existing unified-action fire path via `useAgentInteraction` (same path `AvatarHUD` used for Move / Wheel / Scry).
- **Mandate row "Open"** → opens `MandateDetail` modal (already exists).

### Animations

All decay animations are **CSS keyframes** driven by a band class on the sigil root:
`.sigil-healthy \| .sigil-strained \| .sigil-weakened \| .sigil-critical \| .sigil-dissolving \| .sigil-transcendent`.

The prototype's keyframes (`sigil-breathe-slow`, `sigil-weak-drift`, `sigil-critical-drift`, `sigil-dissolve-drift`, `sigil-transcend`) port 1:1 into `styles.module.css`.

**Low-quintessence escalation (4-channel, breathe default)** — per the spec's Post-v2 decisions, the keyword-level visual treatment is `breathe` by default (legible), with `flicker` kept as a tweak/ablation. Treatment is controlled by `window.TWEAK_DEFAULTS.flickerTreatment` in the prototype; in the real build, expose via a single `treatment` prop on `IdentityStrip` with a `'breathe' \| 'flicker'` type, defaulting to `'breathe'`. No other escalation knobs.

### Viewport / accessibility

- Bar is 360 px wide, full height, scroll-internal at `overflow-y: auto`. No horizontal overflow.
- All sections keyboard-navigable (headers are `<button>`, not `<div>`).
- Halo + keyword animations respect `prefers-reduced-motion: reduce` — gate the CSS animation-name behind `@media (prefers-reduced-motion: no-preference)`.
- Color contrast: rely on `colors_and_type.css` tokens already imported by the app; do not hardcode hex values in component CSS.

### Debug panel

Expose in `window.__DEBUG`:

- `window.__DEBUG.setQuintessence(ratio: number)` — sets the ascendant node's quintessence (clamped 0–1) and touches `worldVersion` so the bar re-renders. Useful for band visualisation.
- `window.__DEBUG.setBand(band: QuintessenceBand)` — sets ratio to the midpoint of that band.

Both are dev-only, tree-shaken in production per the existing debug-bridge pattern.

## Wiring section (per `Docs/plans/wiring-checklist.md`)

| Surface | Wired via |
|---------|-----------|
| Orchestrator phase | N/A — bar is pure UI, no tick-phase participation |
| GameView JSX | `AscendantBar` mounted at `GameView.tsx` line ~2709 as first flex child (details above) |
| GameState fields consumed | `ascendantId`, `ascendantIdentity`, `essencePool`, `mandateDefinition`, `mandateState`, `graph` (ascendant node's `quintessence` / `quintessenceMax`) |
| Traces emitted | None |
| Debug visibility | `__DEBUG.setQuintessence`, `__DEBUG.setBand`; band class visible in DOM for screenshot QA |
| Prose pipeline | `enrichProse()` not required at v1 — prose is static content tables. `perSpherePoetics` is a string record; if a future pass needs enrichment placeholders, wrap the return of `quintessenceLine()` in `enrichProse()` |
| Player controls | Portrait click → sheet; action cards → unified-action fire path; mandate "Open" → MandateDetail modal |

`Docs/plans/wiring-checklist.md` does not need an update for this issue — no new orchestrator phases, modals, GameState fields, trace categories, or player-control surface areas were added.

## Constants table (NFP #1)

| Constant | Default | File | Purpose |
|----------|---------|------|---------|
| `ASCENDANT_BAR_WIDTH_PX` | `360` | `styles.module.css` (via CSS custom prop) | Rail width |
| `TRAY_RARE_RARITY_TIER_MIN` | `3` | `src/engine/ascendantTray.ts` | Rarity floor for Rare tier |
| `TRAY_SELF_TARGET_CATEGORIES` | `['actor']` | `src/engine/ascendantTray.ts` | Which target categories classify as Self |
| `ASCENDANT_BAR_SECTION_DEFAULT_OPEN` | `{ identity: true, essence: true, actions: true, mandate: true, hooks: false }` | `AscendantBar.tsx` | Initial open/closed state per section |
| `QUINTESSENCE_TRANSCENDENCE_THRESHOLD` | `1.0` | `src/types/quintessence.ts` | Ratio at/above which transcendent state is eligible |

## NFP compliance

| Priority | Status | Note |
|----------|--------|------|
| 1. Tunability | **PASS** | Every visual threshold (width, tier floor, band mapping) is a named constant |
| 2. Inspectability | **PASS** | Pure selectors + pure tier classifier; no hidden state |
| 3. Determinism | **PASS** | No PRNG usage; bar is a pure read-projection of GameState |
| 4. Fail-soft | **PASS** | Fallback table above covers every null-GameState branch |
| 5. Narrative over mechanical | **PASS** | `perSpherePoetics` extension point keeps prose authorable; generic ladder is a floor, not a ceiling |
| 6. Additive over destructive | **PASS** | Additive file set; the three superseded components are *unmounted* not deleted (available for styleguide and future removal) |
| 7. Performance budget | **PASS with note** | Selectors memoize on `worldVersion`. The bar re-renders on every tick during active sim — acceptable at 360 × 1080. Profile if the action tray exceeds ~40 cards. |

## Action items for Claude Code (three-pillar)

**Engine**

1. Create `src/engine/ascendantTray.ts` with `classifyTrayTier` + tunable constants.
2. Add `isAtTranscendence(node)` to `src/types/quintessence.ts` (3-line helper).
3. Add `__DEBUG.setQuintessence` and `__DEBUG.setBand` to `src/debug-bridge.ts`.

**Content**

4. Create `src/data/ascendant-bar-content.ts` with `BAND_TOOLTIP`, `ARCHETYPE_COPY`, `SPHERE_COPY`, `perSpherePoetics` extension point, `GENERIC_QUINTESSENCE_LADDER`, `TRAY_EMPTY_COPY`. Content lifted verbatim from prototype `AscendantBar.jsx` + spec Post-v2 decisions.
5. Ship 12 default portrait PNGs at `public/uploads/avatar-<sphere>.png` (one per sphere). Placeholder art is acceptable; the art team will iterate in place.

**UI**

6. Build the component tree under `src/components/Game/ascendant-bar/` as laid out above. Port keyframes from the prototype's `<style>` block into `styles.module.css`.
7. Mount `AscendantBar` at `GameView.tsx` line ~2709 as the first child of the main flex row.
8. Remove `IdentityChip` from the top bar, `AvatarHUD` overlay, `EssencePanel` right-rail widget, and `MandateTracker` right-rail widget from `GameView.tsx`. Move the sheet-open, center-on-avatar, and action-fire handlers to the bar's equivalent controls. Keep `AscendantSheet`, `MandateDetail`, and `AgendaPicker` mounted.

**Wiring / verification**

9. Verify at 1920 × 1080 with `preview_resize` → no overflow, no content below the fold, right rail still fits. Per `CLAUDE.md` viewport contract.
10. Verify WebGL hex map visuals via **Claude in Chrome** (Playwright cannot see WebGL content). Take one screenshot of the bar in each quintessence band.
11. Run `npm test`, `npx tsc --noEmit`, `npx vite build` — all three must pass.
12. Smoke-test with `?view=game&seeded` and `?view=styleguide` — both should render the bar without errors.
13. Commit with `Fixes THR-184` in the body so the merge-to-main keyword fires Linear auto-close.

## What NOT to do

- Do not add a new `trayTier` field to `UnifiedActionTemplate`. Derive from existing fields.
- Do not inline any prose in component files. Content lives in `ascendant-bar-content.ts`.
- Do not introduce a new trace category for UI render events — the bar is a read projection.
- Do not delete `EssencePanel` / `MandateTracker` / `AvatarHUD` / `IdentityChip` source files. Unmount them in `GameView`; leave the files for styleguide and future cleanup.
- Do not touch `AscendantSheet` beyond wiring its opener to the portrait click.
- Do not shrink the bar below 360 px to fit the right rail — shrink the right rail's internal layout first if needed (should not be needed at 1920 × 1080).
