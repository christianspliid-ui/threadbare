---
name: frontend-ui
description: >
  Use when building UI components, styling, accessibility work, debug panel features,
  or any code that lives in src/components/ or index.css. Triggers on "component",
  "UI", "frontend", "panel", "layout", "accessibility", "styleguide", "CSS",
  "responsive", "interaction", or when the task involves visual presentation.
  Also load when designing the **UI pillar** of any feature.
last_validated_against: 2026-10-27
validated_doctrine: ui-laws@1
---

# Frontend & UI — Domain Context

This skill is the **single-load context** for designing and building UI in Threadbare. It inlines the critical decision-making content so you can design the UI pillar of any feature without reading additional files. Deep-dive references are linked for specialized work.

---

## 1. Dark Tapestry Design Language

The design system is called **Dark Tapestry**; the game it serves is **Threadbearer** — dark world, hidden magic, threads that break through. ("Threadbare" is the repo codename only, never a player-facing or aesthetic name.)

**Core principles:**
- Always dark. No light mode. Background never brighter than `--bg-surface`.
- Gold means "important" or "active" — use sparingly.
- Mechanics communicated through narrative prose, never numbers. Use verbal word scales from `domain-words.ts`.
- Progressive disclosure: hover → click → deep-dive. Don't frontload information.

**Source of truth:** `STYLE.md` (repo root) for colors, sphere form language, art direction. `src/data/hex-tile-assets.ts` for the hex asset registry; `?view=styleguide` for the living component reference (Law 29). *(The rendered style tile was retired 2026-08-29 — THR-1354.)*

---

## 2. Token Quick Reference

Ground truth: `src/index.css` `:root` block. Deep dive: `Docs/design-system/tokens.md`.

### Backgrounds (dark → light, never skip layers)

| Token | Hex | Use |
|-------|-----|-----|
| `--bg-abyss` | `#0a0a0e` | Page background, fullscreen overlays |
| `--bg-deep` | `#111114` | Top bar, sidebar backgrounds |
| `--bg-surface` | `#1a1a1f` | Cards, panels |
| `--bg-raised` | `#222228` | Rows, chips, interactive elements at rest |
| `--bg-hover` | `#2a2a32` | Hover state |

### Text (bright → dim)

| Token | Use |
|-------|-----|
| `--text-primary` | Main content, names, values |
| `--text-secondary` | Supporting info, subtitles |
| `--text-tertiary` | Labels, metadata, section headers |
| `--text-muted` | Hints, placeholders, disabled |

### Accent — Gold (use sparingly)

| Token | Use |
|-------|-----|
| `--accent-gold` | Active states, selected items |
| `--accent-gold-dim` | Subtle gold — borders, icons at rest |
| `--accent-gold-glow` | Background tint for active elements |

### Layout scaling (the 1440p layout contract, THR-1819)

2560×1440 is the primary screen, 1920×1080 the supported floor. Frame tokens are px, restated per tier in `index.css`; text containers are rem and follow the root step-up (`html { font-size: 112.5% }` at ≥2560×1200). JS reads the same numbers from `src/components/shared/layoutContract.ts`. Full table: `Docs/design-system/layout.md`.

| Token | Default (<1920) | 1920px+ | 2560px+ | 3440px+ |
|----------|---------|---------|---------|---------|
| `--topbar-height` | 44px | 48px | 56px | 56px |
| `--topbar-padding-x` / `--topbar-gap` | 12px | 16px | 20px | 20px |
| `--rail-left-w` (god rail) | 320px | 320px | 400px | 400px |
| `--rail-right-w` (Ledger rail) | 280px | 340px | 420px | 420px |
| `--rail-strip-w` | 56px | 56px | 56px | 56px |
| `--inspector-w` | 560px | 560px | 717px | 717px |
| `--stage-window-w` | 280px | 280px | 520px | 1400px |
| `--panel-padding` | 1rem | 1.25rem | (rem steps) | — |
| `--modal-max-h` | 85vh | — | — | — |

---

## 3. Component Selection — "Which component do I use?"

Full decision tree: `Docs/design-system/component-selection.md`. Here are the most common decisions:

### Show a subject (any person, place, faction, item, card…)

There is **one detail surface, the Inspector** (`Game/inspector/InspectorHost.tsx` + `InspectorPage`, THR-1876). Never build a per-kind sheet, panel or profile modal — the old ones (`AgentProfileModal`, `AgentDetailPanel`, `HexDetailView`, `FactionSheet`, `ArmySheet`, `ArtifactSheet`, the Action Drawer) were deleted in THR-1492 and THR-1912.

| Need | How |
|------|-----|
| Open any world object or content reference | `useRefRouterContext()?.open(ref)` — `src/data/surface-registry.ts` decides the surface by kind (Law 21) |
| A subject's page | a row in the page-layout table (`DETAIL_PAGE_REGISTRY`), never a new panel |
| Name a subject inline | `EntityLink` (hovers into a `HoverCard`), or `Chip role="identity"` |
| A live encounter | plays on the **Stage** (`Game/stage/Stage.tsx`, `StageHost`) |

### Show a list

| Need | Component |
|------|-----------|
| Interactive row with title/subtitle | `ListRow` (shared primitive) — compound: Title, Subtitle, Leading |
| Grouped, collapsible list with counts | `Section` + `ListRow` (Law 36) |
| Narrative threads | `ThreadsPanel` (Ledger rail) |

### Show a card or panel

| Need | Component |
|------|-----------|
| Generic content wrapper | `Card` (shared primitive) — Header, Body, Footer. Variants: surface, raised, glass |
| A titled region of a rail or page | `Panel` |
| A small pill: names a thing, says how it is, counts what waits, tags a kind | `Chip` (roles `identity` / `state` / `count` / `keyword`, THR-1885) — never a local pill |
| An action card face | `CardFace` |
| Rarity-accented wrapper | `RarityBorderBox` — wraps any content with left-border accent by tier |

### Show a modal

**Default:** Use `Modal` (shared primitive) with custom body content. Max-height `var(--modal-max-h)` = 85vh (Law 33). Width is a size tier — `size="s|m|l|xl"` (default S; THR-1820, `Docs/design-system/tokens.md` § Dialog sizes), never a free `maxWidth`; a subject beside its record goes in `SheetColumns` at L. Law 57: grow to the tier before scrolling or cutting a list. Escape to close.

**Only create custom modals** for fundamentally different interaction patterns (encounter branching, full-screen vignettes).

### Show a notification

| Need | Component |
|------|-----------|
| A notification the player can follow | `ToastStack` — every toast opens a page in the Inspector (THR-1911); bursts coalesce (Law 49) |
| A decision waiting for the player | the top bar's **Needs you** (`Game/frame/NeedsYou.tsx`) |
| Event result popup | `EventPopup` — decides its own tier (ceremonial `RevealCard` vs compact) |
| Progress toward goal | `ProgressBar` / `ProgressBand` / `StepDots` (see component-selection.md for which) |
| Rarity tier label | `RarityBadge` |

---

## 4. Layout Zones — "Where does new UI go?"

Full reference: `Docs/design-system/layout-zones.md` (its diagram is current; a few of its table rows still name retired components — trust the code over a row). The game fills one viewport at 2560×1440 (primary) and 1920×1080 (floor) — nothing scrolls, nothing renders below the fold. The "map is the table" frame (THR-1823, carve-up THR-1875..1881):

```
+------------------------------------------------------------------------------+
|        Top bar (--topbar-height): clock · find (Ctrl K) · doom · Needs you · Read the Threads · Settings |
+------+-----------------------------------+---------------------+-------------+
| God  |                                   |  Inspector          |   Ledger    |
| rail:|        Hex map (Three.js)         |  (--inspector-w,    |   rail      |
| god, |        lenses: Dominion / Threads |   only while a      |  Threads +  |
| hand |        / Trouble / Trade          |   subject is open)  |  Chronicle  |
+------+-----------------------------------+---------------------+-------------+
  The Stage (encounters) and the ceremonies open over the map region.
```

Frame components live in `src/components/Game/frame/` (`GodRail`, `HandSection`, `LedgerRail`, `LedgerStrip`, `NeedsYou`); what opens over the map is mounted by the hosts in `src/components/Game/hosts/` (`StageHost`, `DialogHost`, `CeremonyHost`). `GameView` lays them out; do not add new surfaces to it directly.

### Z-index stacking

Never write a z-index number. Name a band from `src/components/shared/zBands.ts` (`Z_BAND`, Law 35): `mapOverlay` 10 · `hud` 20 · `topBar` 30 · `drawer` 40 (the Inspector at full size) · `debug` 45 · `focused` / `stage` 50 (ceremonies, the encounter Stage) · `modal` 60 · `modalAboveInterrupt` 65 · `tooltip` 70+ · `menu` 9999. Full-screen layers use the `Overlay` primitive with an `OverlayBand`.

### Insertion point quick reference

| "I need to add..." | Place it |
|--------------------|----------|
| A fact about a subject | a row on its Inspector page (`DETAIL_PAGE_REGISTRY`), not a new panel |
| Something always visible | justify it against Law 53 (the HUD is a budget) first; then the god rail, Ledger rail or top bar |
| Map overlay (HTML) | a sibling of `HexTooltip` at `Z_BAND.mapOverlay` |
| A dialog | `Modal` at a size tier, mounted through `DialogHost` |
| A notification | a toast through `ToastStack`, or a Needs-you entry if the player must decide |
| A full-screen moment | `Overlay` at `focused`, mounted through `CeremonyHost` |

---

## 5. Shared Primitives — "Use these, don't reinvent"

All live in `src/components/shared/`; every one renders at `?view=styleguide` (Law 29, enforced by `styleguideSync.test.ts`). Full spec: `Docs/design-system/primitives.md`. The ones reached for most:

| Primitive | Purpose |
|-----------|---------|
| `Button` / `IconButton` | every clickable control (raw `<button>` is UI debt) |
| `Card` / `CardFace` / `Panel` / `Section` | content wrappers; `Section` groups and collapses lists |
| `Modal` / `Overlay` | dialogs at a size tier / full-screen layers in a z-band |
| `Tooltip` / `HoverCard` / `EntityLink` | hover summary, hover preview of a subject, inline subject link |
| `Chip` / `DeltaCluster` / `OddsPips` | pills, signed changes, odds and price pips (Law 15) |
| `EntityVisual` / `Medallion` / `Icon` / `SphereIcon` | the subject's image, framed emblems, the icon vocabularies (Law 9) |
| `ListRow` / `Tabs` / `Dropdown` | list rows, tab strips, portal menus |
| `ProgressBar` / `ProgressBand` / `StepDots` | progress forms |
| `SheetColumns` | a subject beside its record in an L dialog |
| `RevealCard` / `FirstUseCaption` | ceremonial reveal; the one first-contact hint (the "got it" line — at most `FIRST_USE_CAPTIONS_MAX_VISIBLE` at once) |
| `AnimateMount` / `GameErrorBoundary` | mount animation; crash containment around any subtree |

**Rule:** Do not write one-off button, card, modal, or list implementations. Use the primitives. If a primitive doesn't fit, extend it — don't bypass it.

---

## 6. Interaction Patterns

Full reference: `Docs/design-system/interactions.md` and `Docs/ui-patterns.md`.

### State definitions (all must be implemented for interactive elements)

| State | Visual treatment |
|-------|-----------------|
| Rest | `--bg-raised` or transparent |
| Hover | `--bg-hover` + `--border-subtle` |
| Active | `--bg-hover` + `scale(0.98)` |
| Selected | `--accent-gold-glow` bg + `--border-accent` + gold text |
| Focus-visible | `outline: 2px solid var(--accent-gold-dim)`, offset -2px |
| Disabled | `opacity: 0.4`, `cursor: not-allowed`, no hover |

**Never suppress `:focus-visible`.** Use `focus-visible` not `focus`.

### Established patterns

- **Show on map:** Listed map-located entities carry the zoom-to-map affordance (Law 22) → `onZoomToLocation(locationId)`. Always `e.stopPropagation()`.
- **Progressive disclosure (Law 20):** `Tooltip` / `HoverCard` (Tier 1 hover) → the subject's Inspector page (Tier 2 click) → its wide sheet or Codex entry (Tier 3, `open(ref, 'sheet')`).
- **Overlay mutual exclusion:** Only one panel-level overlay open at a time. Backdrop click closes. Escape key closes topmost.
- **Hover via JS:** Dynamic base colors (sphere, tier) → use `onMouseEnter`/`onMouseLeave` style mutation, not CSS classes. Simple buttons with static colors may use Tailwind hover.

### Keyboard shortcuts (global, registered in `useTopBarHotkeys`)

| Key | Action |
|-----|--------|
| `Space` | Toggle pause/run |
| `+`/`=` | Speed up |
| `-` | Slow down |
| `.` | Step one tick (paused) |
| `` ` `` | Toggle debug panel |
| `F1` | Open debug panel → CLI tab |

---

## 7. UI Design Checklist

**Use this when designing the UI pillar of any feature.** Answer each question or mark N/A with rationale.

- [ ] **The UI Law — does every game concept carry its presentation?** *(THR-1004)* Every game concept rendered to the player carries **its image** (`EntityVisual`), **its tooltip**, and **its link** where a page exists; **magnitudes render as words**, never numerals. This is not one surface's rule — it is what makes a concept feel like part of the world rather than a field in a database, and it holds on chips, rows, toasts, and prose alike. **A UI ticket's Done-when includes it by default**; it does not have to be restated per ticket, and it is not satisfied by "the sentence already says the name". See §8 for the two ways it usually fails.
- [ ] **What does the player see?** — Which viewport zone(s)? Sidebar panel, modal, map overlay, top-bar indicator, toast?
- [ ] **Which existing component(s)?** — Check the component selection tree (§3). Never create a new component when a primitive or existing component works.
- [ ] **Where in the z-stack?** — Which z-index layer? Does it conflict with existing overlays?
- [ ] **What triggers visibility?** — Always visible, user-toggled, selection-triggered, or event-triggered?
- [ ] **How does the player dismiss it?** — Escape key? Backdrop click? Close button? Auto-timeout?
- [ ] **What data does it display?** — Which GameState fields? Which aggregator functions? Graph-derived data comes from a view-model selector in `src/engine/views/` read with `useView` (THR-1822) — never a new graph traversal in the component
- [ ] **How does it handle missing data?** — Placeholder states, loading indicators, graceful fallbacks (NFP #4).
- [ ] **What interaction states?** — Rest, hover, active, selected, disabled, focus-visible (see §6).
- [ ] **Does it emit events?** — Does clicking/interacting dispatch to other systems (map navigation, encounter trigger, action fire)?
- [ ] **Responsive behavior?** — How does it adapt at 1920 / 2560 / 3440 (the three tier blocks)? Below 1920 must not break.
- [ ] **Debug visibility?** — Can the debug panel inspect the relevant state/traces?
- [ ] **HexMap presence?** — If spatial, does it need a map signifier, overlay, or label?
- [ ] **Notification surface?** — Does the system produce events the player should see? A toast (`ToastStack`)? A Needs-you entry? `EventPopup`? A Chronicle entry?
- [ ] **What does it cost the whole screen?** — Name the moment of the UX-review journey (`scripts/ux-review/journey.json`) where this appears and what it adds there. Something new on an always-visible surface must say what it displaces or why it earns the space (Law 53).

---

## 8. Anti-Patterns

- **Don't add a panel to show a fact about a subject** — add a row to its Inspector page (Law 58).
- **Don't create a new modal component** when `Modal` with custom body works.
- **Don't put HTML directly in the Three.js canvas** — use the HTML overlay layer.
- **Don't nest `Card` inside `Card`** — use `SectionHeading` to divide.
- **Don't use `ProgressBar` for discrete steps** — use `StepDots`.
- **Don't hardcode pixel widths** that duplicate CSS custom properties — use `var(--rail-right-w)`, `var(--rail-left-w)`, `var(--tooltip-max-w)` etc.
- **Don't show numeric stats to the player** — use verbal word scales from `domain-words.ts`.
- **Don't assume a magnitude is safe because the engine produced it** *(THR-1004)*. The words-never-numerals rule is broken most often not by a component but by an engine template literal whose output the component renders faithfully — `${delta.toFixed(2)}`, or a raw internal key like `star.positive`, arriving as a `detail` string. **Band it at the source**, the way `engine/aftermathWords.ts` does for the aftermath and `difficultyWord` does for the nudge stage; the number stays on the trace. When you find one, ask what *else* that producer emits — the two Christian quoted in THR-1004 were instances, not the membership predicate.
- **Don't render a bare entity name and call the UI Law satisfied.** A name in a sentence is text; the concept is only present when it carries its image, its tooltip, and its link. If the surface cannot guess which words are concepts, have the **producer declare them** (see `EncounterAftermathChange.concepts`) rather than parsing English at the surface.
- **Don't suppress `:focus-visible`** — keyboard players need it.
- **Don't skip the UI pillar** in design plans — an engine system without player-facing display is invisible.

---

## 9. Deep-Dive References

Load these only when doing specialized work in that domain:

| Domain | File |
|--------|------|
| **The UI Laws (binding — load for any UI pillar work)** | `Docs/design-system/laws.md` |
| Design system index | `Docs/design-system/INDEX.md` |
| Full component selection tree | `Docs/design-system/component-selection.md` |
| Full layout zone architecture | `Docs/design-system/layout-zones.md` |
| All CSS tokens | `Docs/design-system/tokens.md` |
| Typography scale | `Docs/design-system/typography.md` |
| Animation/motion | `Docs/design-system/motion.md` |
| The weekly whole-screen review (journey, contact sheets) | `.claude/skills/ux-review/SKILL.md` |
| Full interaction patterns | `Docs/design-system/interactions.md` |
| React UI patterns | `Docs/ui-patterns.md` |
| Primitives spec | `Docs/design-system/primitives.md` |
| Art direction | `STYLE.md` |
| Styleguide (visual, in-app) | `?view=styleguide` |
| Hex asset registry | `src/data/hex-tile-assets.ts` |
| CSS source of truth | `src/index.css` |
| Component source | `src/components/` |
| Codesight component catalog | `.codesight/components.md` |

---

## 10. Verification

**Scope first (THR-1949):** read the ticket's purpose. Nothing a player sees changed (content-only, a no-visible-change refactor) → no browser evidence; record `Browser-verify exempt: <reason>`. A small visible fix (≤ 400 non-test UI lines added) → one 1920×1080 screenshot. A larger visible change → the full four-part evidence (`Docs/canon/verification-gates.md` § Browser-verify). A Done-when that asks what a surface shows binds as written either way.

After implementing, verify at 1920×1080 with the Playwright MCP. A change to the layout or type tokens (`src/index.css` `:root` and its breakpoint blocks) also captures 2560×1440, the primary screen — read `innerWidth`/`innerHeight` back in the same pass (THR-1819):
```
browser_navigate('http://localhost:5173/?view=game&seeded&size=medium')
browser_resize(1920, 1080)
browser_take_screenshot({ filename: '<absolute path inside the session worktree>' })
browser_console_messages()
```

Pass `filename` as an **absolute** path inside the session worktree — a bare filename writes
outside the repo and is unrecoverable (impediment #199c).

The hex map is WebGL. Headless Chrome renders it with software WebGL: `scripts/ux-review/capture.mjs`
does exactly that at a true 1920×1080 (flags `--use-angle=swiftshader --enable-unsafe-swiftshader`),
so use the same launch when a script needs a real-render capture of the map. Claude-in-Chrome's
`resize_window` is **inert** (THR-796) — if you capture there, measure `innerWidth`/`innerHeight`
in the same pass and report those numbers; never present such a capture as 1920×1080.

Check: nothing scrolls, nothing renders below the fold, all interaction states work, keyboard navigation functional, debug panel shows relevant traces.
