# TopBar — v7 Visual Overhaul

**Date:** 2026-05-07
**Author:** Cowork
**Linear:** THR-176
**Project:** UI Visual Overhaul — Design System v1
**Status:** ready-for-dev
**Visual reference:** `Docs/plans/v7-design-pass/` (encounter shell + tokens.css), `Docs/plans/v7-screenshots/01-full-page.png`
**Related plans:** THR-177 AgentDetail, THR-178 RightRail, THR-179 InterventionModal (sibling overhauls)

---

## 1. Problem

The current TopBar in `GameView.tsx:2810–2940` works structurally (data surfaces are wired and visible) but its visual language predates the v7 design pass. It reads as a generic dark-mode app bar rather than as part of the Threadbearer aesthetic. Specifically:

- Mixed visual idioms — some elements use Cinzel headings, others use Tailwind defaults; spacing is ad-hoc rather than rhythmic.
- Dividers are flat 1px lines without the gold-tinted hairline treatment from v7.
- Section labels (e.g. "Doom") aren't presented as the v7 ALLCAPS Cinzel small-caps treatment that anchors every other panel in the design pass.
- The `linear-gradient(180deg, rgba(17,17,20,0.98), rgba(10,10,14,0.95))` background and its `rgba(var(--accent-gold-rgb, 212,175,55), 0.3)` border-bottom are a fair approximation but slightly off from the v7 canvas's `--bg-deep` solid + `--border-subtle` discipline.
- The gold-toned right-group container (`background: rgba(10, 10, 14, 0.4)`) reads as a "tab" rather than as content separation.

**This is a visual overhaul only.** Data surfaces, click handlers, keyboard shortcuts, accessibility attributes, and tooltip behavior are preserved verbatim.

## 2. Visual targets (extracted from v7)

From `Docs/plans/v7-design-pass/tokens.css` and `parts/encounter-shell.jsx`:

### Typography
- Display headings (game title, session/world name): `--type-display-md` (Cinzel 600 21px/1.15)
- Section labels (e.g. "DOOM", "MANDATE", "TIME", "RIVALS"): `--type-section-label` — Cinzel 700 16px/1.2 ALLCAPS, `letter-spacing: 0.12em`, color `--text-tertiary`
- Numeric ticker text (tick count, year): `--font-body` 500 (Alegreya Sans medium), `--text-base` (18px) for the value; section label above sets the context
- Inline status/flavor (e.g. "running" / "paused" / "speed ×2"): `--type-body-small` italic, color `--text-tertiary`

### Color
- Bar background: solid `--bg-deep` (`#111114`). Drop the gradient.
- Bar bottom border: `1px solid var(--border-subtle)` (`#2a2520`). Replace the 30%-alpha gold with a hairline + a 1px `--accent-gold-dim` ornamental rule under the title group only (centered, 56px wide — same `.gold-bar` primitive used in v7 hero panels).
- Group divider (between left and right groups): `1px` vertical hairline using `--border-subtle`, **not** `rgba(212,175,55,0.4)`. Reserve gold for active/important states only (per STYLE.md: "single accent; sparingly").
- Right-group container background: remove. Spacing alone separates it.

### Spacing & geometry
- Bar height stays at `--topbar-height` (48px at 1920px+) — already tokenized.
- Horizontal padding stays `--topbar-padding-x` — already tokenized.
- Inter-element gap: `--topbar-gap` already in use; keep.
- Internal vertical alignment: items center on the bar's vertical axis, but the section label sits 2px above the value with `gap: 2px` (so the bar reads as two tiers of typography rather than a single horizontal stripe). This matches v7's "tier of small-cap labels above tier of values" pattern (see `EncounterShell` top strip and the bottom Quintessence strip).

### Active / hover states
- Hovered icon button: `--bg-hover` background + `--text-primary` color, `--anim-fast` ease (already standard via `IconButton`; verify).
- Active icon button (e.g. RivalsButton when dropdown is open): `--accent-gold-glow` background + `--accent-gold` foreground + `--accent-gold-dim` border (already standard).
- Keyboard focus ring: `--accent-gold-dim` outline at 2px, `outline-offset: -2px` (global rule, already in `index.css`).

### Motion
- No new motion. Existing `--anim-fast` transitions on hover suffice.
- A subtle `pulse-gold` on Doom advancement (when `gameState.doomClock` ticks up) may be considered as a v2 polish, but is **out of scope** for this overhaul.

## 3. Layout — preserve every surface

The persistent TopBar is the player's at-a-glance status of the game-as-system, distinct from the encounter-shell top strip (which is per-encounter). Both use the v7 visual language; they are not the same component.

```
+------------------------------------------------------------------------+
| [LEFT GROUP — game state]                  | [RIGHT GROUP — alerts]    |
|                                            |                            |
| ⏵ TIME           WORLD-SOUL    ATTENTION   | DOOM      OMEN   RIVALS   |
|   day 47 · ix    twin tides    9 / 12      | 4 / 12    rising  3        |
|   running ×2     of force      regen 0.4   | of unmaking                |
|                                            |                            |
+------------------------------------------------------------------------+
```

Every block follows the same pattern: ALLCAPS Cinzel section label (10–11px), value below in body type. No icons in the labels themselves. SimulationControls keeps its play/pause/step/speed controls but the textual context shifts to the two-tier pattern.

### Left group (existing surfaces, preserved)
1. **TIME** — `SimulationControls` shows: tick/season/year as the value tier (e.g. `day 47 · ix`), and `running ×2` / `paused` as the small italic status line below.
2. **WORLD-SOUL** — `WorldSoulIndicator` (existing) renders dominant sphere as the value tier (e.g. `twin tides of force`), small label `"WORLD-SOUL"` above.
3. **ATTENTION** — `AttentionPoolIndicator` (existing) shows pool/capacity ratio as value, regen rate as the italic status below. Section label `"ATTENTION"`.

### Right group (existing surfaces, preserved)
4. **DOOM** — `DoomBar` (existing). Wrapping `role="button"` keeps its current click-to-open-detail handler. Section label is the doom definition's display name in ALLCAPS Cinzel; the value tier is the bar fill or `"X of Y"` text the component currently renders.
5. **OMEN** — `OmenIndicator` (existing). Section label `"OMEN"`, value tier reads the omen primary's name. Conditional render preserved.
6. **RIVALS** — `RivalsButton` (existing). Stays an `IconButton` with the badge — but the badge is repositioned per `IconButton` primitive spec and the icon is paired with a text label `"RIVALS"` to its right when the topbar has horizontal headroom (≥1600px). At 1280–1599px, label hides via the existing `.topbar-compact-hide` class.
7. **READ THE THREADS** — existing `IconButton`, no label needed (the icon plus tooltip carries it).
8. **SETTINGS** — existing `IconButton`, same treatment.

### Group divider
Between LEFT and RIGHT groups, a single `1px` vertical hairline (`background: var(--border-subtle)`, `align-self: stretch`, `margin: 0 var(--space-3)`). No gold, no extra panel chrome.

## 4. Component changes

| Component | Change |
|-----------|--------|
| `GameView.tsx` (TopBar JSX block, lines ~2812–2940) | Replace inline `style={{ background: 'linear-gradient(...)' }}` with `style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)' }}`. Remove the `rgba(10,10,14,0.4)` right-group container. Replace the gold-tinted divider with the hairline divider above. |
| `SimulationControls.tsx` | Add a section-label tier above the existing ticker. Use `<SectionHeading as="div">TIME</SectionHeading>` from the primitives. Existing controls move beneath as the value tier. No prop changes. |
| `DoomBar.tsx` | Wrap existing render in a two-tier flex (`SectionHeading` label above, current bar/text below). The `journeyLabel` prop becomes the section label content (uppercased via `SectionHeading`). Existing accessibility attributes preserved. |
| `WorldSoulIndicator.tsx` | Same two-tier wrap. Section label `"WORLD-SOUL"` static; existing prose moves to value tier. |
| `AttentionPoolIndicator.tsx` | Same two-tier wrap. Section label `"ATTENTION"`. |
| `OmenIndicator.tsx` | Same two-tier wrap. Section label `"OMEN"`. |
| `RivalsButton.tsx` | Add an optional inline label that renders to the right of the icon at ≥1600px. Use the existing `topbar-compact-hide` class for the auto-hide behavior. |

No new components. No data-prop additions. No state changes. No GameState reads added. This is a pure styling + composition refactor.

## 5. Constants (NFP #1)

All values come from existing tokens in `src/index.css` and `Docs/plans/v7-design-pass/tokens.css`. **No new magic numbers introduced.** The full list of tokens this overhaul depends on:

| Token | Default | Purpose |
|-------|---------|---------|
| `--topbar-height` | 48px @ 1920px+ | Bar height |
| `--topbar-padding-x` | 16px @ 1920px+ | Horizontal padding |
| `--topbar-gap` | 16px @ 1920px+ | Inter-group gap |
| `--bg-deep` | `#111114` | Bar background |
| `--border-subtle` | `#2a2520` | Hairline borders + dividers |
| `--accent-gold` | `#d4a040` | Active state foreground only |
| `--accent-gold-glow` | `#d4a04030` | Active state background only |
| `--text-tertiary` | `#a89880` | Section labels |
| `--text-primary` | `#e8dcc8` | Value tier text |
| `--anim-fast` | 150ms | Hover transitions |
| `--type-section-label` | (composite) | Section label typography |
| `--type-body` | (composite) | Value tier typography |

If any token needs to change to support this overhaul, that change happens in `src/index.css` and is documented in the `Docs/changelog.md` row — never inline.

## 6. Wiring (per `Docs/plans/wiring-checklist.md`)

| Surface | Wired? | Notes |
|---------|--------|-------|
| Orchestrator phase | N/A | TopBar reads GameState; no tick-phase work |
| GameState fields read | Same as today | `tick`, `season`, `running`, `speed`, `worldSoul`, `attentionPool`, `attentionCapacity`, `doomClock`, `doomDefinition`, `omenState`, `rivalDefinitions`, `rivalStates`. No new reads. |
| Traces emitted | None | Pure UI refactor |
| Player controls connected | All preserved | SimulationControls, DoomBar click-through, RivalsButton dropdown, ReadThreads button, Settings — every handler retained verbatim |
| Visible in DebugPanel | N/A | TopBar is itself the runtime display; no additional debug surface |
| Tests | Update existing snapshot/render tests for `SimulationControls`, `DoomBar`, `MandateTracker` (already in `__tests__/`); add a TopBar visual regression test if missing |

## 7. Three-pillar coverage

- **Engine** — N/A. No engine changes. (Explicitly N/A, with rationale: this is a presentational overhaul of an already-wired surface; no new data is read or written.)
- **Content** — N/A. No new prose, no new content tables, no template additions.
- **UI** — full coverage above (§3, §4, §5).

This is a single-pillar plan **by design**, justified because the issue (THR-176) is explicitly scoped to a visual overhaul of an existing surface. The three-pillar rule guards against incomplete *features*; this is a *re-skinning* of a complete feature.

## 8. NFP audit

| Priority | Status | Note |
|----------|--------|------|
| 1. Tunability | PASS | All values via existing tokens; no magic numbers |
| 2. Inspectability | PASS | No engine changes; existing trace surfaces unaffected |
| 3. Determinism | PASS | No PRNG use, no engine state changes |
| 4. Fail-soft | PASS | No new conditional renders; existing `&&` guards preserved (e.g. `gameState.worldSoul?.aggregate &&`) |
| 5. Narrative over mechanical | PASS | Section labels reinforce the dark parchment voice; no new numeric exposure |
| 6. Additive over destructive | PASS | Wraps existing components; no removals. SimulationControls etc. add a section-label slot, don't replace internals. |
| 7. Performance budget | PASS | No new renders, no new effects, no new computations |

## 9. Fail-soft table

| Failure | Fallback |
|---------|----------|
| `gameState.worldSoul?.aggregate` is undefined | Block hidden (already-existing guard) — section label not rendered |
| `gameState.omenState?.primary` is undefined | Block hidden (already-existing guard) |
| `attentionPool` / `attentionCapacity` reads return undefined | `AttentionPoolIndicator`'s existing fallback (zero values) — no change |
| Token missing (e.g. `--type-section-label`) | Browser falls through to `--font-display` + `--text-xs`; no crash |

## 10. Open questions / executor judgment

- **Inline label visibility breakpoint for RivalsButton** — current `topbar-compact-hide` class hides at <1600px. If the executor finds that label causes wrapping at exactly 1600px, the breakpoint may shift to 1700px. This is a CSS-only judgment call.
- **OmenIndicator label text** — "OMEN" works; if the omen subsystem uses a more specific label in copy, defer to the copy in `OmenIndicator.tsx` itself.

## 11. Definition of done

- [ ] All TopBar elements use the two-tier (section label / value) pattern at 1920×1080
- [ ] Bar background is solid `--bg-deep`; no gradient
- [ ] Group divider is a hairline `--border-subtle`, not gold-tinted
- [ ] Right-group "tab" container background removed
- [ ] All existing data surfaces and click handlers preserved verbatim
- [ ] No new magic numbers — every value resolves through a CSS custom property
- [ ] Tests pass: `npm test`, `npx tsc --noEmit`, `npx vite build`
- [ ] Visual verified at 1920×1080 via `?view=game&seeded` and via `mcp__Claude_in_Chrome__*` screenshot — TopBar matches the v7 pattern (display Cinzel headings, ALLCAPS section labels, hairline dividers)
- [ ] No regressions at 3440×1440 (ultrawide)
- [ ] No regressions at 1280×720 (graceful compact)

## 12. Coordination block

**Suggested model:** sonnet (execution-only refactor, no judgment-heavy authoring)
**Parallel-safe with:** THR-177 (AgentDetail), THR-178 (RightRail), THR-179 (InterventionModal). All four siblings touch different files; no overlap in component scope.
**Mutex with:** any in-flight changes to `GameView.tsx` TopBar JSX block specifically; if another agent is editing lines ~2810–2940, defer until merged.
**Files to touch:**
- `src/components/Game/GameView.tsx` (TopBar JSX block only)
- `src/components/Game/SimulationControls.tsx`
- `src/components/Game/DoomBar.tsx`
- `src/components/Game/WorldSoulIndicator.tsx`
- `src/components/Game/AttentionPoolIndicator.tsx`
- `src/components/Game/OmenIndicator.tsx`
- `src/components/Game/RivalsButton.tsx`
- (test files for the above as needed)

**Done when:**
- [ ] All component changes shipped and merged
- [ ] Visual matches v7 pattern at 1920×1080 (verified via Chrome MCP screenshot)
- [ ] No data surfaces lost
- [ ] All tests green; `npx tsc --noEmit` clean; `npx vite build` succeeds
- [ ] Linear comment posted with closing commit SHA (or `Fixes THR-176` in the merge commit body — auto-close fires)
