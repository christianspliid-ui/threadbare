# InterventionModal — v7 Visual Overhaul

**Date:** 2026-05-07
**Author:** Cowork
**Linear:** THR-179
**Project:** UI Visual Overhaul — Design System v1
**Status:** ready-for-dev
**Visual reference:** `Docs/plans/v7-design-pass/parts/encounter-shell.jsx` (ChoiceCards lines 63–98 + ring effects in `index.html` lines 60–64), `Docs/plans/v7-screenshots/04-active-card.png`, `Docs/plans/v7-screenshots/06-encounter-choice-cards.png`
**Related plans:** THR-176 TopBar, THR-177 AgentDetail, THR-178 RightRail (sibling overhauls)

---

## 1. Problem

`InterventionConfirm.tsx` is the modal-style overlay that appears after the player picks a divine action card and the engine asks them to confirm. The component already uses tokens (`--bg-raised`, `--border-medium`) and shows a sphere-colored gradient art banner — it's structurally fine. What's missing is the v7 visual *language*:

- The modal panel is a generic dark card; the v7 ChoiceCards pattern uses a sphere-bright **ring** (inset border + outer glow) to communicate "this action is empowered by this sphere" at a glance.
- Title is set in body type; v7 uses italic display Cinzel for action titles ("Stir her resolve").
- Sphere label + delivery descriptor read as separate widgets; v7 combines them as `IRON · small breath` in a single ALLCAPS Cinzel line above the title.
- Cost, range, and risk are presented as discrete pill-y rows; v7 keeps them as small tertiary-text utility lines under a `gold-bar` separator.
- "Tilts toward" / consequence flavor is missing — v7 puts a brief italic "tilts toward: a wound, a debt, or his favour earned" line at the bottom of the choice card. The intervention modal already has prose hooks (description, agendaNarrativeHook); they should adopt this idiom.
- Modal chrome should derive from the `Modal` primitive (`primitives.md §6`) rather than a hand-rolled absolute-positioned overlay. This also fixes any latent viewport-fit regressions that THR-174 was tracking.

**Pure visual + composition refactor.** The intervention flow is the player's primary verb — per the issue body, do not redesign the flow speculatively, do not reintroduce AgentWheel patterns, and preserve all delivery modes / cost / detection-risk surfaces.

## 2. Visual targets (extracted from v7)

### Sphere ring (selected state)
From `index.html` lines 60–64:
```css
.ring-{sphere} {
  box-shadow: 0 0 0 1px var(--sphere-{name}-bright) inset,
              0 0 18px -2px var(--sphere-{name}-bright);
}
```
The active confirm modal IS in selected state by definition (the player has just chosen this intervention). Apply the sphere-bright ring to the panel.

### Choice card composition
From `encounter-shell.jsx:63–98`:
```
[ ALLCAPS sphere · breath descriptor   ]   ← sphere-bright label
[ italic display title                 ]   ← Cinzel 18px italic, weight 400
[ ───── gold-bar 36×1px ─────          ]
[ prose body, body-sm primary          ]
[ italic flavor — "tilts toward..."    ]   ← tertiary text
```

### Tertiary utility lines
For cost / range / risk:
- Small ALLCAPS Cinzel label (10–11px, `--text-tertiary`) + value tier in body type (`--text-secondary`).
- Stacked vertically with `gap: 6px`.
- No chip backgrounds — these are utility metadata, not interactive elements.

### Action buttons
- Cancel: `<Button variant="secondary">Let her face this on her own</Button>` (or similar — match the existing copy)
- Confirm: `<Button variant="primary">Confirm intervention</Button>` — primary uses `--accent-gold` background; the sphere ring around the panel keeps the sphere identity legible.
- Disabled state: existing `canAfford === false` / `isOutOfRange` logic preserved; Button `disabled` prop handles the visual.

## 3. Layout — preserve every surface

```
┌────────────────────────────────────────────┐
│        [ sphere art banner — 8rem ]        │
│  ╔══════════════════════════════════════╗ │
│  ║ IRON · small breath                  ║ │  ← sphere label + delivery
│  ║                                      ║ │
│  ║ Stir her resolve.                    ║ │  ← italic display title (label prop)
│  ║ ─────                                ║ │  ← gold-bar
│  ║                                      ║ │
│  ║ [description prose — body-sm]        ║ │
│  ║                                      ║ │
│  ║ tilts toward: a wound, a debt…       ║ │  ← agendaNarrativeHook (italic)
│  ║                                      ║ │
│  ║ COST       2 essence                 ║ │  ← utility lines
│  ║ RANGE      same hex                  ║ │
│  ║ DETECTION  10 % chance               ║ │
│  ║                                      ║ │
│  ║ [Cancel]            [Confirm]        ║ │
│  ╚══════════════════════════════════════╝ │
│       ↑ sphere-bright ring + glow          │
└────────────────────────────────────────────┘
```

Every existing data surface stays:
- `interventionType`, `label`, `deliveryMode`, `essenceCost`, `sphere`, `detectionRisk`, `rangeStatus`, `hexDistance`, `description`, `availableEssence`, `agendaName`, `agendaNarrativeHook` — all rendered.
- `onConfirm(encounterMode?)`, `onCancel()` callbacks — preserved verbatim.

The art banner stays — it's the player's first read on which sphere is empowering this. With the sphere ring around the entire panel, the banner becomes redundant *visually* but stays for the future-art slot. Reduce its height from 8rem to 6rem to give the new ring more breathing room.

## 4. Component changes

| Component | Change |
|-----------|--------|
| `InterventionConfirm.tsx` (root) | Replace hand-rolled `<div className="absolute inset-0 …">` overlay with the `<Modal>` primitive. `Modal` provides backdrop, escape-to-close, click-outside-to-close, focus management, and z:60 layering for free. Pass `maxWidth={448}` to match current `min(28rem, 90vw)`. |
| Panel (the inner relative div) | Wrap content in `<Modal.Body>`. Apply sphere-bright ring via inline `style={{ boxShadow: ... }}` derived from the existing `getSphereColor(sphere)`. Use the `--sphere-{name}-bright` token where possible (a small lookup in `sphereIcons.ts` or inline mapping is acceptable — there are 12 spheres, finite enumerable). |
| Art banner (lines ~80–95) | Reduce height from `8rem` to `6rem`. Keep the sphere-colored gradient strip; it's still useful as a future-art slot. Border-bottom thickens to match the v7 separator (`1px solid {sphereColor}40` → keep). |
| Title block | Add an ALLCAPS Cinzel sphere + delivery line above the title: e.g. `IRON · whisper`. Pull sphere from `sphere` prop and a delivery word from `deliveryMode` (mapping: `local` → "whisper", `regional` → "vision", `global` → "decree" — or whatever the existing UL terminology dictates; verify in `Docs/ubiquitous-language/`). Title becomes italic display Cinzel 18px. Add a `gold-bar` (36×1px `--accent-gold` background) separator beneath. |
| Description block | Render `description` as `--type-body-small`, `--text-secondary`. |
| Agenda narrative hook (`agendaNarrativeHook`) | Render as an italic body-small line in `--text-tertiary`, prefixed with "tilts toward: " (or similar phrasing — match the v7 idiom). If the prop is undefined, omit the block (existing guard preserved). |
| Cost / range / detection rows | Replace existing styled rows with three vertically stacked utility lines: ALLCAPS Cinzel 10px label in `--text-tertiary` + value in `--type-body-small` `--text-secondary`. No chip backgrounds. |
| Action buttons | Replace existing inline-styled buttons with `<Button variant="secondary">` for cancel and `<Button variant="primary">` for confirm. Disabled logic (`!canAfford || isOutOfRange`) bound to Button's `disabled` prop. |
| `<Modal.Footer>` | Wrap the button row in `<Modal.Footer>` for consistent right-aligned button layout. |

No changes to InterventionConfirm's prop interface. No new data flow. No GameState reads added.

## 5. Constants (NFP #1)

| Token | Used for |
|-------|----------|
| `--bg-raised` | Modal panel background |
| `--bg-deep` | Modal backdrop overlay (handled by Modal primitive) |
| `--border-medium` | Panel border at rest |
| `--accent-gold` | gold-bar separator + primary button |
| `--text-primary`, `--text-secondary`, `--text-tertiary` | Text hierarchy |
| `--type-section-label`, `--type-display-md`, `--type-body-small` | Typography |
| `--sphere-{name}`, `--sphere-{name}-bright` | Ring + art banner gradient |
| `--anim-fast`, `--anim-normal` | Hover + open transitions (Modal handles open) |

No new magic numbers. The two pixel literals (`6rem` banner height, `36px` gold-bar width) are already part of the v7 vocabulary and match the design tokens' `--space-*` rhythm.

## 6. Wiring (per `Docs/plans/wiring-checklist.md`)

| Surface | Wired? | Notes |
|---------|--------|-------|
| Orchestrator phase | N/A | Pure UI overlay |
| GameState fields read | None directly | All data via props from caller |
| Traces emitted | None new | Existing intervention-confirmed trace fires from the caller's `onConfirm` |
| Player controls connected | Cancel + Confirm preserved | Modal primitive's escape-to-close and click-outside-to-close map to `onCancel` |
| Visible in DebugPanel | N/A | The modal IS the player's confirmation surface |
| Tests | Update `__tests__/InterventionConfirm.test.tsx` for new render structure (assert sphere ring class/style applied; assert Modal primitive used) |

## 7. Three-pillar coverage

- **Engine** — N/A.
- **Content** — N/A. (`description` and `agendaNarrativeHook` come from existing prose pipelines.)
- **UI** — full coverage above.

## 8. NFP audit

| Priority | Status | Note |
|----------|--------|------|
| 1. Tunability | PASS | All values via tokens |
| 2. Inspectability | PASS | No engine changes |
| 3. Determinism | PASS | No PRNG, no state changes |
| 4. Fail-soft | PASS | All optional props (agendaName, agendaNarrativeHook, availableEssence) keep their existing guards |
| 5. Narrative over mechanical | PASS | Cost/range/detection presented as utility metadata, not pill-style game-stat tags. Title is verb-prose ("Stir her resolve") not "Inspire (tier 2)". |
| 6. Additive over destructive | PASS | Wraps existing component logic; preserves prop interface verbatim |
| 7. Performance budget | PASS | Modal primitive already uses `AnimateMount`; no new effects |

## 9. Fail-soft table

| Failure | Fallback |
|---------|----------|
| `getSphereColor(sphere)` returns undefined | Falls through to `--accent-gold-dim` for the ring (still visible, still on-brand) |
| `--sphere-{name}-bright` token missing | Browser falls through to `currentColor`; ring shows but not in the right hue. Acceptable graceful degradation. |
| `agendaNarrativeHook` undefined | Block hidden (existing guard) |
| `availableEssence` undefined | Confirm button NOT disabled (existing behavior — the engine validates separately) |
| `rangeStatus === 'out_of_range'` | Confirm disabled (existing) |

## 10. Open questions / executor judgment

- **Delivery word vocabulary** — current `deliveryMode` is `'local' | 'regional' | ...`. The v7 idiom uses prose ("small breath", "fuller breath", "deep draught"). The mapping should match the UL or existing copy in the codebase. Search `Docs/ubiquitous-language/` and `src/data/` for the canonical vocabulary; if none exists, use literal delivery mode names ("local", "regional") as ALLCAPS labels and track a Linear follow-up for prose-ification.
- **`encounterMode` parameter on `onConfirm`** — the existing API supports passing a `LocalEncounterMode`. If the modal needs to expose a sub-choice (e.g. "in person" vs "in dream"), that's existing behavior to preserve verbatim. The v7 pattern doesn't directly cover this; preserve current implementation and refactor only the styling.
- **Modal primitive readiness** — `primitives.md §6` documents `Modal` as built. Verify `src/components/shared/Modal.tsx` exists and has the expected API before swapping in. If gaps exist, file them as Linear issues — do not block this overhaul; fall back to the existing hand-rolled overlay with v7 styling applied to it.

## 11. Definition of done

- [ ] Modal uses `<Modal>` primitive (or equivalent if primitive incomplete — see §10)
- [ ] Sphere-bright ring + glow visible around the panel
- [ ] Title set in italic display Cinzel; `gold-bar` separator beneath
- [ ] Sphere · delivery line above title in ALLCAPS Cinzel
- [ ] Cost / range / detection rendered as utility lines, no pill chips
- [ ] Buttons use `<Button>` primitive (variant primary / secondary)
- [ ] All existing data surfaces and callbacks preserved
- [ ] Tests pass: `npm test -- --run InterventionConfirm`, `npx tsc --noEmit`, `npx vite build`
- [ ] Visual verified at 1920×1080 by triggering an intervention via Chrome MCP — matches v7 ChoiceCards idiom
- [ ] Modal fits within viewport contract (height ≤85vh, no overflow at 1280×720)
- [ ] No regressions to disabled state when out-of-range or insufficient essence

## 12. Coordination block

**Suggested model:** sonnet (composition refactor with primitive adoption; mechanical)
**Parallel-safe with:** THR-176 (TopBar), THR-177 (AgentDetail), THR-178 (RightRail). All four siblings touch different files.
**Mutex with:** any in-flight changes to `InterventionConfirm.tsx` or `Modal.tsx` (the primitive itself).
**Files to touch:**
- `src/components/Game/InterventionConfirm.tsx` (primary)
- `src/components/Game/__tests__/InterventionConfirm.test.tsx` (update render assertions)
- `src/components/shared/Modal.tsx` (only if gaps surface during adoption; otherwise read-only)
- `src/data/sphereIcons.ts` (only if a `getSphereColorBright(sphere)` helper needs adding for the ring — single-line addition)

**Done when:**
- [ ] Refactor shipped and merged
- [ ] Visual matches v7 ChoiceCards idiom (Chrome MCP screenshot in PR or Linear comment)
- [ ] All callbacks preserved verbatim
- [ ] All tests green; `npx tsc --noEmit` clean; `npx vite build` succeeds
- [ ] `Fixes THR-179` in the merge commit body
