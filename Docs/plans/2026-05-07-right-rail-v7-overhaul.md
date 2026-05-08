# RightRail — v7 Visual Overhaul

**Date:** 2026-05-07
**Author:** Cowork
**Linear:** THR-178
**Project:** UI Visual Overhaul — Design System v1
**Status:** ready-for-dev
**Visual reference:** `Docs/plans/v7-design-pass/parts/encounter-shell.jsx` (Right rail block, lines 217–286), `Docs/plans/v7-screenshots/05-right-rail.png`
**Related plans:** THR-176 TopBar, THR-177 AgentDetail, THR-179 InterventionModal (sibling overhauls)

---

## 1. Problem

The persistent right sidebar hosts the always-on portfolio surfaces — `ThreadsPanel` (the protagonist portfolio with thread categories: agent / location / faction / army / artifact) and `WorldPulse` (omens + season + world rhythm) — plus selection-triggered detail panels (`AgentDetailPanel`, `HexDetailView`, etc.). Together they're how the player scans the state of the world without leaving the map.

The information architecture is correct and load-bearing. The visual presentation is not v7-aligned:

- ThreadsPanel section headings, compact rows, and category labels use ad-hoc styling rather than the v7 panel + section-heading pattern.
- WorldPulse omen lines are functional but lack the v7 thread-tag treatment (colored mini-rule + small label).
- The sidebar's outer chrome (`1px solid var(--border-gold)` left border per `layout-zones.md:76`) is right in spirit but the inner panels don't carry the v7 austerity (single thin border, surface background, internal section labels).
- No section count badges (the v7 pattern: `"CAST IN THE SCENE   3 OF 3"`).

**Pure visual + composition refactor.** No IA changes. Per the issue body: do not collapse alerts and chronicle, and do not reduce chronicle depth.

## 2. Visual targets (extracted from v7)

From `encounter-shell.jsx:217–286` — the encounter shell's right rail:

### Panel pattern
```
.panel  →  bg: var(--bg-surface)
            border: 1px solid var(--border-subtle)
            border-radius: 8px
            padding: 12px
            display: flex; flex-direction: column; gap: 8px
```

### Section heading row
- ALLCAPS Cinzel 10–11px tertiary-text label
- Optional count badge: small ALLCAPS Cinzel "3 OF 3" right-aligned, `--text-muted`

### Compact thread/cast row
- 42×42 portrait/icon (or sphere-tinted dot if no portrait)
- Body: name (display Cinzel 13px) + role line in sphere-bright ALLCAPS (9px) + small italic prose disposition
- Trailing: tag chip in ALLCAPS, `--text-muted`

### Action / divine intervention card
- A `panel`-class container per row
- Leading: 14×14 circle (border-only at rest, sphere-bright filled when "rare" / featured)
- Body: title (body-sm primary) + small descriptor (`--text-tertiary`)
- Trailing: cost label in ALLCAPS, gold for rare actions

### Thread state tags (mini-rules)
For each tag in "THE STATE OF THE SCENE":
- 18×1 px colored rule (sphere color)
- 6px gap
- Small body-secondary text label

## 3. Layout — preserve every surface

The persistent right rail today renders (top to bottom):
1. **ThreadsPanel** — the portfolio scan, with thread categories and compact thread rows. Stays.
2. **WorldPulse** — omens + season. Stays.
3. **Selection-triggered panels** (`AgentDetailPanel` is THR-177; `HexDetailView` and others are out of scope here but inherit the panel chrome from this overhaul.)

Neither panel changes its IA. The data shown today renders identically tomorrow; only the visual shell changes.

```
┌────────────────────────────────────────┐
│ ThreadsPanel                           │
│ ┌──────────────────────────────────┐  │
│ │ AGENT THREADS         5 OF 12    │  │  ← Section heading w/ count
│ │ [compact thread row]             │  │
│ │ [compact thread row]             │  │
│ │ ...                              │  │
│ └──────────────────────────────────┘  │
│ ┌──────────────────────────────────┐  │
│ │ LOCATION THREADS      3 OF 9     │  │
│ │ [compact thread row]             │  │
│ └──────────────────────────────────┘  │
│ ... (faction / army / artifact)       │
│                                        │
│ WorldPulse                             │
│ ┌──────────────────────────────────┐  │
│ │ THE WORLD'S PULSE                │  │
│ │ ❉  IX · Stillsun  · day 47       │  │  ← Season + tick
│ │ ─── crimson tides on the eastern │  │  ← Omen as colored rule + line
│ │ ─── a hidden bargain rises       │  │
│ └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

## 4. Component changes

| Component | Change |
|-----------|--------|
| `ThreadsPanel.tsx` (root) | Wrap each category section in a `panel`-class container. Each section gets a `<SectionHeading count={visibleCount}>{categoryLabel}</SectionHeading>` header — the count comes from the existing `SECTION_LABELS` + items length. Replace any inline `bg-stone-*` / `text-amber-*` with tokens. |
| `CompactThreadRow` (lines ~506+) | Adopt the v7 row pattern: 42×42 leading portrait/sphere-dot, name in display Cinzel 13px, role in sphere-bright ALLCAPS, italic disposition prose in tertiary text. Trailing tag chip in muted ALLCAPS. Replace inline styles with tokens. The existing `ThreadPortrait` (line 116) keeps its render but its outer styling adopts tokens. |
| `ThreadActionChip` (line 163) | Re-render as a small ALLCAPS Cinzel 9–10px chip in `--text-muted`, no background — the chip stops being a "filled pill" and becomes a v7 trailing label. |
| `AutoToggle` (line 182) | Adopt the `<Button variant="ghost" size="sm">` primitive for its toggle visual; preserve onClick. |
| `EncounterPoolModal` (line 215) | Out of scope for the rail itself, but its outer modal chrome is THR-179's responsibility. Verify the modal still opens correctly after the rail refactor; do not edit it here. |
| `WorldPulse.tsx` | Wrap in `panel`-class container. Replace OMEN glyph + colored text rendering with the v7 thread-tag pattern: a 24×1 colored mini-rule (sphere color matching omen category) + body-sm text on the same row. Season header becomes a `<SectionHeading>` with the season + tick as the value tier underneath (similar to TopBar TIME but vertically stacked). |
| `OmenLine` (line 17) | Refactor render: replace `OMEN_CATEGORY_GLYPHS` glyph-prefix with the colored-rule prefix. Keep the `omen.summary` prose as the line content. Sphere-color resolution via existing category→sphere mapping (or per-omen color if already on the omen object). |
| GameView right-sidebar `<div>` (around line 2827) | Verify its `border-left: 1px solid var(--border-gold)` is correct; the v7 canvas uses `--border-subtle` for the rail's left edge. Switch to `--border-subtle` to match — gold remains the active-state accent only. |

No new data props. No GameState reads added. The existing memoization (`React.memo` on `ThreadsPanel` and `WorldPulse`) is preserved.

## 5. Constants (NFP #1)

| Token | Used for |
|-------|----------|
| `--bg-surface` | Panel backgrounds |
| `--bg-deep` | (sidebar root, if needed) |
| `--border-subtle` | Panel borders, sidebar left edge (replacing `--border-gold`) |
| `--border-accent` | Active panel borders only |
| `--accent-gold`, `--accent-gold-glow` | Active states |
| `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted` | Text hierarchy per panel position |
| `--type-section-label`, `--type-display-md`, `--type-body`, `--type-body-small` | Section headings, names, body, captions |
| `--sphere-{name}`, `--sphere-{name}-bright` | Role labels, omen rules, thread tags |
| `--space-2`, `--space-3` | Internal panel gaps |
| `--anim-fast` | Hover transitions |

No new magic numbers introduced.

## 6. Wiring (per `Docs/plans/wiring-checklist.md`)

| Surface | Wired? | Notes |
|---------|--------|-------|
| Orchestrator phase | N/A | Pure UI |
| GameState fields read | Same as today | `gameState.threads`, `gameState.omenState`, `gameState.season`, `gameState.tick`. No new reads. |
| Traces emitted | None | UI refactor |
| Player controls connected | All preserved | `onThreadClick`, `onAutoToggle`, omen click handlers — every callback retained |
| Visible in DebugPanel | N/A | This rail IS the inspection surface |
| Tests | Update `__tests__/ThreadsPanel.test.tsx` for new render structure |

## 7. Three-pillar coverage

- **Engine** — N/A.
- **Content** — N/A. (Omen / season / thread prose is read from existing fields.)
- **UI** — full coverage above.

## 8. NFP audit

| Priority | Status | Note |
|----------|--------|------|
| 1. Tunability | PASS | All values via tokens |
| 2. Inspectability | PASS | No engine changes |
| 3. Determinism | PASS | No PRNG, no engine state |
| 4. Fail-soft | PASS | Existing conditional renders preserved (omen guards, empty-state messaging in ThreadsPanel) |
| 5. Narrative over mechanical | PASS | Replaces glyph prefixes with colored-rule + prose; reads as flavor text rather than icon noise |
| 6. Additive over destructive | PASS | Wraps existing renders; chronicle depth and information density preserved |
| 7. Performance budget | PASS | No new computations; existing `React.memo` boundaries preserved |

## 9. Fail-soft table

| Failure | Fallback |
|---------|----------|
| `gameState.omenState?.primary` undefined | Block hidden (existing guard) |
| Sphere category → color resolution fails | Falls through to `--accent-gold-dim` for the rule |
| Thread category has zero items | Section renders with `count={0}` and an empty-state phrase already present in `ThreadsPanel` |
| Season name unmapped in `SEASON_ICONS` | Existing fallback (no icon) |

## 10. Open questions / executor judgment

- **Sidebar left-edge color** — current `var(--border-gold)` reads as "panel boundary"; v7 uses `var(--border-subtle)`. If the executor finds removing the gold makes the sidebar visually disappear into the map background, pivot to `1px solid var(--border-medium)` (slightly stronger than subtle, still not gold).
- **Omen color mapping** — if no per-omen sphere field exists, derive from `OMEN_CATEGORY_GLYPHS`'s implicit category → sphere mapping. Document the choice in the closing commit.
- **Auto-toggle position** — current `AutoToggle` lives somewhere inside the rail. Keep its position; only the visual shell changes.

## 11. Definition of done

- [ ] Both `ThreadsPanel` and `WorldPulse` rendered as v7 `panel`-class containers
- [ ] All section headings use `<SectionHeading>` primitive with optional count badge
- [ ] Compact thread rows match v7 pattern (portrait + display name + sphere role + italic disposition + trailing tag)
- [ ] Omen lines use colored-rule prefix instead of glyph
- [ ] No `bg-stone-*` / `text-amber-*` / `border-amber-*` Tailwind classes in `ThreadsPanel.tsx` or `WorldPulse.tsx`
- [ ] Sidebar left border switched from `--border-gold` to `--border-subtle` (or `--border-medium` per §10)
- [ ] All existing data and click handlers preserved
- [ ] Tests pass: `npm test -- --run ThreadsPanel`, `npx tsc --noEmit`, `npx vite build`
- [ ] Visual verified at 1920×1080 via `?view=game&seeded` (Chrome MCP screenshot)
- [ ] Chronicle depth preserved — visually verify the same number of thread rows / omen lines render

## 12. Coordination block

**Suggested model:** sonnet (token migration + composition refactor; mechanical at the row level, larger surface area than TopBar)
**Parallel-safe with:** THR-176 (TopBar), THR-177 (AgentDetail), THR-179 (InterventionModal). All four siblings touch different files.
**Mutex with:** any in-flight changes to `ThreadsPanel.tsx` or `WorldPulse.tsx` body. Note: `EncounterPoolModal` lives in `ThreadsPanel.tsx` but is touched only minimally here — its modal chrome is THR-179's domain.
**Files to touch:**
- `src/components/Game/ThreadsPanel.tsx`
- `src/components/Game/WorldPulse.tsx`
- `src/components/Game/GameView.tsx` (right-sidebar `<div>` border tweak only — single line change)
- `src/components/Game/__tests__/ThreadsPanel.test.tsx` (update render assertions)

**Done when:**
- [ ] Refactor shipped and merged
- [ ] Visual matches v7 right-rail pattern (Chrome MCP screenshot in PR or Linear comment)
- [ ] No data surfaces lost
- [ ] All tests green; `npx tsc --noEmit` clean; `npx vite build` succeeds
- [ ] `Fixes THR-178` in the merge commit body
