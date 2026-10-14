> **title:** Finish the component library — Overlay, Panel, Tabs, Chip, Icon, the radius and shadow tokens, and one UI-debt ratchet (THR-1821)
> **linear_issue:** THR-1821
> **author:** Claude Code (design session, 2026-10-14, spawned from the attended groundwork session)
> **created:** 2026-10-14
> **three_pillars:** Engine N/A — a UI library and a repo gate; no engine module, graph change or tick work (the view-model seam is THR-1822) · Content done — the icon registry's data format and seed (the concept table and carved shapes are THR-1879's) · UI done

# Finish the component library — Overlay, Panel, Tabs, Chip, Icon, the radius and shadow tokens, and one UI-debt ratchet (THR-1821)

*The map-first screen (wayfinder THR-1823) is about to be built from scratch; if its rails, Inspector, Stage and lenses are built the way the last ninety surfaces were, the overhaul ships a second generation of one-offs, so the primitives and the counter that stops new debt land first.*

## Why this is load-bearing

Christian asked on 2026-10-11: *"do we have an easy to expand UI component library still or have we started to do one-off implementations"*. The answer, measured, is a partial library. `Tooltip` (71 importers) and `Modal` (24) are healthy. Everything else has drifted: one hard-coded tab bar, about twenty chip and badge components, seventeen hand-built full-screen layers, a `Card` primitive no game screen uses, 203 raw `<button>` elements, 680 colour literals, 325 icon glyph characters, 305 literal radii and no shadow tokens.

The wayfinder map THR-1823 (*The Map Is the Table*) has now decided the new screen: the screen frame (THR-1828), the Inspector (THR-1827), the encounter Stage (THR-1829), map lenses (THR-1830), Find anything (THR-1832), the type system (THR-1833) and, today, the icon family (THR-1834). The shared groundwork brief (attended session 2026-10-14, decisions settled) fixes the build order: **the new surfaces are built on the new primitives, tokens, tiers and view models from day one; legacy surfaces migrate when touched or retire with the Inspector.** That order only works if two things exist before the first new surface is written:

1. **The primitives the new surfaces need** — Overlay (the Stage, dialogs, full-screen ceremony), Panel (rails, the Inspector, legend cards), Tabs (the Ledger rail's *Now · Years · Ledger*, the lens bar), Chip (the needs-you pill, strip counts, Connections card counts, identity references), Icon (THR-1834's carved family), and the radius and shadow tokens they are drawn with.
2. **A counter that makes new debt fail the build.** Without it, every new surface can re-add a raw button or a hex literal and nothing notices. The brief assigns this plan **the single UI-debt ratchet** that all four foundation tickets (THR-1819, THR-1820, THR-1821, THR-1822) feed.

The ratchet is the most urgent part: THR-1822 (and THR-1819 / THR-1820) cannot register their rows until it exists. So it ships first, as this ticket's own slice; the primitives follow as two slice tickets that share this plan doc.

**Where this plan stops.** Two tickets filed from the same map carve this work at its edges, and this plan keeps to its side of both:

- [THR-1879](https://linear.app/threadbare/issue/THR-1879) (type and icons rollout) owns **what the icons are**: the vendored game-icons.net subset, the concept → shape table, the credits line and the sweep order for legacy glyphs. This plan owns **how an icon is drawn**: the `Icon` primitive, the registry's data format and resolver, the uniqueness tests, and the two ratchet rows that count glyphs and lucide imports.
- [THR-1880](https://linear.app/threadbare/issue/THR-1880) (THR-1820's slice 2) moves six hand-built dialogs — Settings, the effect choice set, the Divine Court (`ScryOverlay`), the Codex layer, the harvest and the warm-start card — onto their final primitive and size tier **once**, after this plan's Overlay exists. This plan does not move them.

## Settled input (cited, not re-opened)

| Source | What this plan takes from it |
|---|---|
| Groundwork brief, attended session 2026-10-14 (decisions 1–10) | 1440p primary / 1080p floor; root step-up 16 → 18 px at ≥ 2560 (so rem scales ×1.125); one 85vh modal rule; **one ratchet, owned here**; containers are not modal tiers; the Icon primitive is family-agnostic; build order |
| `Docs/audits/2026-10-11-thr-1827-inspector-decision.md` | Feeds THR-1821 "Tabs, Chip, Panel". Escape order *armed card → top dialog → full → wide → docked → closed* at `ESCAPE_LAYER_Z_PANEL`; Connections rows carry a card count; the retirement list (§ Retires) |
| `Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md` | Ledger rail Chronicle tabs *Now · Years · Ledger* with an unread count; needs-you "a gold pill with a count"; the 56 px strip of icons with counts; top-bar buttons carry icon **and** word label; World Pulse retires |
| `Docs/audits/2026-10-14-thr-1829-encounter-stage-decision.md` | The Stage is its own container (not a modal tier); it starts below the top bar (Law 52); Escape minimises, never disregards |
| `Docs/audits/2026-10-14-thr-1830-map-lenses-decision.md` | The lens bar: four buttons, label plus key cap, one at a time, press again to turn off, pressed state an underline, **never gold** |
| `Docs/audits/2026-10-13-thr-1833-type-system-decision.md` § Feeds | "THR-1821: add a ratchet that lets `uppercase` with tracking, `monospace` on player surfaces, and `Georgia` in components only go down"; 16 px floor; sentence-case labels; tabular figures where numbers line up |
| `Docs/audits/2026-10-14-thr-1834-icon-family-decision.md` (Christian, chat 2026-10-14, human gate satisfied via chat review; merged in PR #2372) | **One carved family for every player surface:** a curated game-icons.net subset (~200, CC BY 3.0, recoloured) for all content concepts **and** all UI chrome; **places are carved too** (amended by Christian in chat the same day — he found the map's place drawings "very alike at a glance and a bit too abstract" — recorded on [THR-1834](https://linear.app/threadbare/issue/THR-1834) 2026-10-14 08:50 UTC and as decision-record call 2b in PR #2379: each of the 11 place types gets one carved shape, on the map and in every panel, and the map's `LOCATION_ICON_REGISTRY` drawings retire for places; the map keeps its size classes and lair tints); our own drawings win only spheres, reaches and heraldry; **lucide-react retired from player surfaces**; filled silhouettes in `currentColor`; named sizes 14 / 18 / 24 / 34 px; path data, not React components (Unity port) |
| THR-1826 research comment (icon inventory) | ~163 codepoints, 5 classes breaking Law 9, ~12 glyphs breaking Law 10; the `attachmentGlyphs.ts` broken-escape defect is already filed as [THR-1874](https://linear.app/threadbare/issue/THR-1874) |
| [THR-1879](https://linear.app/threadbare/issue/THR-1879) (Todo, plan doc pending) | Owns the icon registry's **content**: vendored subset, concept → shape table, credits line, legacy sweep order. Builds on this plan's `Icon` primitive and ratchet rows |
| [THR-1880](https://linear.app/threadbare/issue/THR-1880) (Todo) | Moves Settings, `ChoiceSetModal`, `ScryOverlay` (the Divine Court — a dialog, tier L), the Codex layer (a dialog, tier XL), `HarvestScreen` and `WarmStartOverlay` onto `Modal` tiers or `Overlay` + `dialogSizeStyle(<tier>)`, once each. Blocked by this plan's Overlay slice |
| [THR-1881](https://linear.app/threadbare/issue/THR-1881) (Todo) | Splits `GameView.tsx` into hosts and names THR-1821 parallel-safe — so no slice of this plan edits `GameView.tsx` |
| [THR-1816](https://linear.app/threadbare/issue/THR-1816) (Done) | Shipped `src/components/shared/useEscapeLayer.ts`, the one escape registry. Overlay builds on it; this plan closes the rest of the bug class |

## Substrate inventory

No engine subsystem is touched, so `Docs/canon/systems-inventory.md` has no row here. The UI and tooling substrate this plan extends, measured on `main` @ `3cf81086`:

| Existing piece | Status | This plan |
|---|---|---|
| `shared/useEscapeLayer.ts` (THR-1816) | 🟢 live; used by `Modal` | **extends** — layers get a `label`; bands come from one named module; every other Escape listener moves onto it |
| `shared/useDialogFocus.ts` (Law 50) | 🟢 live; `Modal`, `DetailModal` | **reused** by Overlay unchanged |
| `shared/Modal.tsx` (24 importers) | 🟢 live | **re-based** on Overlay + Panel; public props unchanged (THR-1820 adds `size`) |
| `shared/Card.tsx` | 🟠 no game screen uses it | **re-based** on Panel; kept as the titled panel |
| `shared/Button.tsx`, `shared/IconButton.tsx` | 🟢 live (57 + 24 uses) | **preserved**; IconButton's numeric badge renders a `Chip role="count"` |
| `shared/Tooltip.tsx`, `shared/Dropdown.tsx` | 🟢 live | **extended** — their own `document` Escape listeners move onto the registry |
| `shared/EntityVisual.tsx` + `entityVisualResolver.ts` (Law 3) | 🟢 live | **reused** by `Chip role="identity"` for its leading image |
| `contexts/RefRouterContext.tsx` (`useRefRouterContext`, Law 21) | 🟢 live | **reused** by identity chips for their click |
| `icons/SphereIcon`, `icons/ReachIcon`, `icons/CoatOfArms` | 🟢 live drawn sets | **kept** — THR-1834's three own-drawing families |
| `HexMapV2/locations/locationIconRegistry.ts` + `locationIconTextures.ts` | 🟢 live (map place icons) | **retires for places** (THR-1834 as amended): places take carved shapes from the Icon registry. The registry's `paths: { d, opacity? }[]` shape is what `locationIconTextures.ts` already rasterises, so the map's texture builder reads a carved shape as one path at opacity 1. That switch belongs to the rollout THR-1834's amendment feeds ([THR-1879](https://linear.app/threadbare/issue/THR-1879) for the shapes, [THR-1878](https://linear.app/threadbare/issue/THR-1878) for the map chrome and markers — they settle which ticket edits the texture builder); this plan only fixes the shape so it fits |
| `shared/sphereTint.ts` | 🟢 live | **extended** with `glowShadow()` — the one sanctioned tinted glow |
| `scripts/check-typecheck-ratchet.ts`, `scripts/chip-referent-ratchet.ts` | 🟢 live ratchets | **pattern source** for the new script (blocking verdicts, suspect drop, advisory per-file map) |
| `scripts/gate.ts` (THR-1717) | 🟢 live | **extended** — one more gate in the code track |
| `StyleGuide/StyleGuide.tsx` + `styleguideSync.test.ts` (Law 29) | 🟢 live gate | **extended** — one section per new primitive, rows in `component-selection.md` |

## Engine pillar

Engine: N/A — nothing here runs in the tick loop, adds a graph node or edge, or reads the world graph. Screens reading prepared view data instead of the graph is THR-1822's seam; this plan only reserves its ratchet row.

## Content pillar

No prose content and no encounter work. What this plan owns is the **format** of the icon data; the data itself (which shapes, for which concepts, with which credits) is [THR-1879](https://linear.app/threadbare/issue/THR-1879)'s.

### Data tables

- **`src/data/icons/iconRegistry.ts`** (this plan, S3) — the registry object and the `IconName` type derived from its keys. One entry per name: its **meaning** (one idea, Law 10), its **shape** as `{ viewBox, paths: { d, opacity? }[] }`, and its **source** — `{ family: 'game-icons', author, slug }` (one SVG path on the set's 512 × 512 grid, vendored; nothing fetched at runtime, no icon font, no npm icon package) or `{ family: 'own' }` (a shape we draw). Names are by idea in kebab-case (`close`, `pause`, `scales`); place types are prefixed `place-` (`place-castle`), and since THR-1834's amendment they are carved like everything else. S3 seeds the registry with **one entry, `fallback`**, a shape we draw ourselves; **it vendors no game-icons path**, so S3 carries no licence obligation. The registry tests run on fixture entries.
- **`ICON_CREDITS`** (this plan, S3) — a function of the registry: the distinct `author`s of every `game-icons` entry, sorted. It returns an empty list until THR-1879 vendors the first shape. Generated, never hand-maintained, so the credits cannot drift from the shipped set.
- **The vendored subset, the concept → shape table and the concept-class maps** (`ICON_FOR_CODEX_KIND`, `ICON_FOR_ATTACHMENT_CATEGORY`, `ICON_FOR_EFFECT_TYPE`, `ICON_FOR_SEASON`, `ICON_FOR_LENS`, …) — **THR-1879**. The format this plan fixes for them: each map is a total `Record` keyed on the live union, so a new member without an icon is a type error (Law 9, the THR-890 build-failure pattern), and each lives beside the data it labels and replaces that table's glyph column. THR-1834's sheet already names the first 44 shapes.

Which family draws which class (THR-1834; THR-1879 fills the table, this plan's resolver serves both families):

| Concept class | Family |
|---|---|
| Spheres | `SphereIcon` (ours) — unchanged, Law 9 |
| Reaches | `ReachIcon` (ours) — unchanged |
| Faction heraldry | `CoatOfArms` (ours) — unchanged |
| Places and place types (map, sidebar, Inspector, Find anything) | game-icons.net subset through `place-*` names (THR-1834 as amended: capital `tower-flag`, city `medieval-gate`, town `village`, hamlet `wood-cabin`, castle `white-tower`, temple `greek-temple`, shrine `fire-shrine`, ruins `ancient-ruins`, mine `mine-wagon`, camp `camping-tent`, lair `cave-entrance`) — one shape, on the map and in the panel |
| Every other content concept (codex kinds, undertakings, chartered kinds, attachments and effects, nudge card types, callings, ambitions, seasons, activity, alerts, omens, doom, consequence categories, lens icons, result kinds, faction kind marks) | game-icons.net subset |
| All UI chrome (close, pause, play, faster, slower, find, settings, needs-you, back, forward, widen, pin, show-on-map eye, disclosure) | game-icons.net subset |
| Magnitude languages (`OddsPips`, `CostPips`, `DeltaCluster`, `ForecastDie`, `DifficultyScales`) | Unchanged — Law 15's sanctioned glyph languages, not icons |

## UI pillar

*Screenshot tool: Playwright (DOM) for every slice — the primitives and the styleguide are DOM. Claude-in-Chrome only if a slice's evidence includes the lens bar over the WebGL map.*

### Tokens: radius and shadow by hierarchy

Measured today: 33 distinct `borderRadius` values (`50%` ×37, `4px` ×29, `6px` ×26, `3px` ×18, `8`/`8px` ×30, `999`/`999px` ×15 …), 172 Tailwind `rounded*` classes (120 of them not `rounded-full`), one radius token (`--panel-radius`, used 5 times), two uses of `var(--radius-md)` that only resolve through Tailwind's default theme, 23 distinct literal shadows and no shadow token.

Four levels, named for what the thing **is** in the hierarchy, not for its size:

| Level | What it is | Radius token | Value (1080p) | Shadow token | Value |
|---|---|---|---|---|---|
| page | a dialog panel, the Stage panel, the Inspector in Full | `--radius-page` | `0.75rem` (12 px) | `--shadow-page` | `0 8px 32px rgb(0 0 0 / 0.6)` |
| panel | rails, the Inspector docked/wide, cards, popovers, the lens legend | `--radius-panel` | `0.5rem` (8 px) | `--shadow-panel` | `0 4px 16px rgb(0 0 0 / 0.4)` |
| control | buttons, tabs, rows, inputs, insets inside a panel | `--radius-control` | `0.25rem` (4 px) | `--shadow-control` | `0 2px 8px rgb(0 0 0 / 0.5)` (only for controls floating on the map canvas) |
| chip | chips and pills | `--radius-chip` | `999px` | `--shadow-chip` | `none` — chips are flat |

- **Where they live:** a Tailwind v4 `@theme static` block in `src/index.css` right after `@import "tailwindcss"`. Tailwind v4 turns the `--radius-*` and `--shadow-*` namespaces into utilities, so `var(--radius-panel)` and `rounded-panel` / `shadow-panel` are both sanctioned forms. `static` makes Tailwind emit every variable in the block whether or not a utility uses it — needed because most primitives read the tokens through inline `var()` styles, which Tailwind's usage scan may not see. Utilities are generated only when a class is used, as always. `--panel-radius` stays as an alias (`var(--radius-panel)`) — additive, nothing breaks.
- **rem, not px,** for the three radii, so they step up with the root at ≥ 2560 like everything else (brief decision 3).
- **Circles and squares are shapes, not radii:** `50%` and `0` (and Tailwind `rounded-full` / `rounded-none`) stay free.
- **Tinted glows** (sphere and gold halos, today 9 hand-written template literals) go through one helper, `glowShadow(color, strength)` in `shared/sphereTint.ts`: `0 0 <blur>px color-mix(in srgb, <color> <pct>%, transparent)`, strengths `soft` / `strong` as named constants.
- **Two more token pairs** the primitives need: scrims `--scrim-dim` (`rgb(0 0 0 / 0.6)`, Modal's today) and `--scrim-heavy` (`rgb(0 0 0 / 0.8)`, HarvestScreen / WarmStart today); glass `--bg-glass` (`rgb(17 17 20 / 0.72)`, Card's glass today).

### Overlay — backdrop, z-band and the Escape stack

**The bug class.** THR-1816 fixed the reported instance (Escape closing the encounter under an open sheet) by adding the escape registry and putting `Modal` and the veil on it. Eleven other places still hang their own `keydown` listener on `document` or `window` and test for Escape (`AgendaPicker`, `InterventionConfirm`, `MandateTracker`, `ScryOverlay`, `SettingsPanel`, `ThreadingRite`, `remembranceChoice`, `Dropdown`, `Tooltip`, `useViewNavigation`, `DetailModalStackContext`). Each of them still closes at the same time as whatever is above or below it. Seventeen full-screen layers are built by hand, at z-index values typed into the file.

**One primitive owns all of it:**

```tsx
<Overlay
  open={open}
  onClose={close}                 // Escape and backdrop click route here
  label="Path codex"              // required: the accessible name and the escape-layer debug label
  band="modal"                    // 'focused' | 'stage' | 'modal' | 'modalAboveInterrupt' — named, never a number
  backdrop="dim"                  // 'dim' | 'heavy' | 'void' | 'none'   (default 'dim')
  placement="top"                 // 'top' (5vh, Modal's today) | 'center' | 'fill'   (default 'top')
  inset="viewport"                // 'viewport' | 'belowTopBar' (the Stage: the top bar stays in view, Law 52)
  modal                           // default true: focus trap + aria-modal; false = focus moves in, no trap
  closeOnEscape                   // default true; false registers no layer, so Escape reaches the surface below
  closeOnBackdrop                 // default true for 'dim'/'heavy', false for 'void' and 'none'
  animation="fade-up"             // 'fade' | 'fade-up' | 'none'; reduced motion collapses to a plain fade (Law 44)
>
  {children}
</Overlay>
```

- **Portal** to `document.body`; mount/unmount animation moves here from `Modal` unchanged (the reason `Modal` avoids `AnimateMount` — a transform on a wrapper breaks `position: fixed` — carries over).
- **Z-band** from one module, `src/components/shared/zBands.ts`, which states the `layout-zones.md` stacking table as named constants: `mapOverlay 10 · hud 20 · topBar 30 · drawer 40 · debug 45 · focused 50 · stage 50 · modal 60 · modalAboveInterrupt 65 · tooltip 70 (+ depth) · menu 9999`. `MODAL_Z_DEFAULT`, `MODAL_Z_ABOVE_INTERRUPT`, `ESCAPE_LAYER_Z_PANEL` and `ENCOUNTER_VEIL_Z` become re-exports of it (additive; nothing that imports them changes). A z-index anywhere else is Law 35 debt.
- **Escape stack:** Overlay registers `useEscapeLayer(open && closeOnEscape, onClose, Z_BAND[band], label)`. The registry already picks the topmost layer by band, then by registration order. This plan adds the `label` argument and a debug read (below). **Anything that is not an Overlay but must answer Escape** — the armed card, the Inspector's Full → wide → docked steps, map move mode, `Tooltip`, `Dropdown` — registers through `useEscapeLayer` with a named band. A `document`/`window` Escape listener anywhere else is the ratchet row `escape-listener`.
- **Focus** through the existing `useDialogFocus` (Law 50): in on open, trapped while `modal`, back to the invoker on close.
- **Backdrops:** `dim` = `--scrim-dim`, `heavy` = `--scrim-heavy`, `void` = `--bg-abyss` (full-screen ceremony, THR-1829's third home: Meet the First, the Threading Rite, the Remembrance; a dialog over an opaque cover such as the warm-start card is THR-1880's `Overlay` + `dialogSizeStyle`), `none` = pointer-transparent (a surface that dims the map itself, like the Stage).
- **What Overlay is not:** it does not size anything. Sizes belong to `Modal`'s tiers (THR-1820), the Inspector's and Stage's own geometry (brief decision 7), and the owner. It does not position anchored menus — `Dropdown` and `Tooltip` keep their positioning and only join the escape registry.
- **`Modal` is re-based on Overlay + Panel** (`band="modal"`, `backdrop="dim"`, `placement="top"`, panel at level `page`). Its props are unchanged; THR-1820's `size` tiers sit on `Modal`, never on Overlay. After this, `Modal.tsx` is the only dialog look and `Overlay.tsx` the only backdrop, band and escape implementation.

### Panel — the surface shell by hierarchy level

About 66 hand-written `--bg-surface` / `--bg-raised` shells exist, each choosing its own border, radius and shadow. Panel is the one shell:

```tsx
<Panel level="panel" floating material="solid" as="section" padding="standard">…</Panel>
```

| Level | Background | Border | Radius | Shadow |
|---|---|---|---|---|
| `page` | `--dlg-bg`, falling back to the deep→abyss gradient `Modal` draws today | `--dlg-border` → `--border-gold` | `--radius-page` | `--shadow-page` when `floating` |
| `panel` | `--bg-surface` (`material="glass"`: `--bg-glass` + 10 px blur, for panels over the map canvas) | `--border-subtle` | `--radius-panel` | `--shadow-panel` when `floating` |
| `inset` | `--bg-raised` | none | `--radius-control` | never |

- `floating` (default false) is what separates a popover or a dialog from an in-layout rail.
- `context` passes a `DialogContext` to a `page` Panel so the Law 30 dialogue palettes keep working through `Modal`.
- **Hierarchy rule** (today's "don't nest Card in Card", made checkable): page ⊃ panel ⊃ inset. A Panel inside a Panel of the same or a lower level logs one dev-only warning (`import.meta.env.DEV`); production pays nothing.
- **Panel does not cap height or scroll.** The new [E] law THR-1820 drafts ("a panel grows to its size limit before it scrolls or truncates") belongs to the owner and the tier; a primitive that clipped by default would break it.

**Card adoption.** `Card` keeps its name and API as **the titled panel**: `Panel level="panel"` plus `Card.Header` (title, count, trailing, close), `Card.Body`, `Card.Footer`. Its three variants map onto Panel: `surface` → `panel`; `raised` → `panel` + `floating`; `glass` → `panel` + `material="glass"`. The `raised` variant's background moves from `--bg-raised` to `--bg-surface` with the panel shadow; no game screen uses `Card` today, so nothing visible changes. The decision tree after this: **a bounded surface is a `Panel`; a bounded surface with a title row is a `Card`; a playing card is `CardFace`** — `component-selection.md` says so in one line, because "card" means the god's cards everywhere else in this game.

### Tabs — one tab bar, and the same bar as a toggle row

Today the only tab bar is `Game/tabs/TabBar.tsx`: hard-coded to the agent profile's seven tabs, Tailwind `stone`/`amber` colours, `role="tab"` without a tablist, no keyboard support. It retires with `AgentProfileModal` (THR-1827). Two new surfaces need the shape: the Ledger rail's *Now · Years · Ledger* (THR-1828) and the lens bar (THR-1830).

```tsx
<Tabs kind="tabs" value={tab} onChange={setTab} label="Chronicle">
  <Tabs.Tab value="now" label="Now" />
  <Tabs.Tab value="years" label="Years" />
  <Tabs.Tab value="ledger" label="Ledger" count={{ value: 2, label: '2 new chapters' }} />
</Tabs>
<Tabs.Panel value="now">…</Tabs.Panel>

<Tabs kind="toggle" value={lens} onChange={setLens} allowNone label="Map lenses">
  <Tabs.Tab value="dominion" label="Dominion" icon="lens-dominion" keyCap="1" />
  …
</Tabs>
```

- **`kind="tabs"`** — WAI-ARIA tabs: `role="tablist"`, `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"`; roving tabindex; ←/→, Home/End; selection follows focus. Exactly one tab is selected.
- **`kind="toggle"`** — a row of pressed buttons (`role="toolbar"`, `aria-pressed`), at most one pressed; with `allowNone`, pressing the pressed one turns it off (the lens rule). Owners bind their own hotkeys (the lens bar's `1`–`4`); the primitive renders the key cap.
- **One look for both:** label in Alegreya Sans at the 16 px floor, sentence case; selected/pressed = `--text-primary` with a 2 px underline in `--text-primary`; rest = `--text-secondary`; hover = `--bg-hover`. **Never gold** — the lens ruling, applied to every tab row so the two never diverge; gold stays the god's attention (Law 31). Minimum height `2.5rem` (40 px at 1080p, 45 px at 1440p), so the hit area clears 24 px at every size (Law 46).
- **Pressing answers at once** (Law 47, PC-8): the underline moves within `--anim-fast` of the click, before any panel content loads.
- `count` renders a `Chip role="count"` after the label ("Ledger · 2"), and the count's `label` is its aria text.
- Tabs never scroll sideways. A tab row that does not fit its container at 1920 is a defect the styleguide entry shows.
- Controlled (`value`/`onChange`) or uncontrolled (`defaultValue`). An unknown `value` selects the first tab and warns once.

### Chip — one component, four roles

There are about twenty chip, pill and badge components (table below), each with its own padding, radius, tint logic and click behaviour. One `Chip` replaces them, with the role deciding what it must carry:

```tsx
<Chip role="identity" target={worldRef} label="Shutash" />                       // image + name + link (`target`, not `ref` — React reserves `ref`)
<Chip role="state" label="Dreaming" icon="dream" tint={{ sphere: 'dream' }} magnitude={<DeltaCluster … />} />
<Chip role="count" count={3} icon="needs-you" label="3 things need you" tint="gold" onOpen={openQueue} />
<Chip role="keyword" keyword="Boost" icon="card-boost" pressed={on} onToggle={toggle} />
```

| Role | It answers | Must carry | Click | Tint |
|---|---|---|---|---|
| **identity** | "which thing?" | leading `EntityVisual` at `chip` size (Laws 1, 3) where the kind has an entity-visual family — a kind without one (attachments, by the THR-1120 ruling) takes the link tier and no tile, the documented fail-open path; the name; the tooltip from the registry (Law 17); a HoverCard after a dwell | `useRefRouterContext()?.open(target)` — routes by kind (Law 21). A target that no longer resolves renders plain text, never a dead link | neutral |
| **state** | "how is it?" | the **word** always (Laws 13, 31 — polarity never by hue alone), optional icon, optional magnitude slot (`DeltaCluster` / `OddsPips` — Law 15) | optional (`onOpen`) | neutral · positive · negative · sphere (`sphereTint`) |
| **count** | "how many are waiting?" | whole number (a count of things is not a magnitude; Law 49's "one affordance with a count") and an icon, except where the chip sits on a control that is already the icon (`IconButton`'s badge); in the full form `label` is the spoken sentence and the tooltip, while the badge form (below) leaves both to its control | `onOpen` opens the list and **never clears the count** (Law 40) | neutral · gold (the god's attention only: the needs-you pill) |
| **keyword** | "what kind?" | the vocabulary word, from a fixed union, always; its icon once the vocabulary has an `IconName` map (Law 9 — one vocabulary per class). A text-only vocabulary (rarity tiers today) carries the word in its accent colour | optional toggle (`pressed`/`onToggle`, `aria-pressed`) for filter rows | the vocabulary's own accent (rarity tiers), else neutral |

- **The badge form of a count** (`<Chip role="count" form="badge" count={n} of="notables" />`): for a count sitting on a control that already carries the name — `IconButton`'s badge today. About `1rem` tall (16 px at 1080p, as today's badge), pinned to the control's corner, not interactive, `aria-hidden`, no tooltip of its own: the control keeps its `aria-label` and tooltip exactly as today (e.g. `NotablesButton`'s "3 notables"). The full chip form is for a count that stands alone (the needs-you pill, the strip, Connections rows).
- **A count of zero renders nothing** (Laws 25, 53). A count always shows its number, even at 1 — THR-1834's label rule gives every icon in a chip or strip either a word or a count, and a count chip's word lives in its tooltip, as the Ledger strip's does.
- **Sizes, in rem so they step up with the root** (brief decision 3): `sm` `1.5rem` tall (24 px at 1080p, 27 px at 1440p; inline in rows and prose; still a 24 px hit area, Law 46) and `md` `2rem` (32 / 36 px; standalone). Icon at the `chip` size (`1.125rem`). Label `var(--text-xs)` (16 px at 1080p, 18 px at 1440p), Alegreya Sans, sentence case, no tracking (THR-1833). At 1440p the `sm` chip holds an 18 px label and a 20 px icon inside 27 px. Radius `--radius-chip`, no shadow.
- **Pressing answers at once** (Law 47, PC-8): a keyword toggle shows its pressed state within `--anim-fast`; an interactive chip has hover, active and `:focus-visible` states (Law 23).
- Interactive chips render a real button inside the component (Chip is a home of the `raw-button` row).
- `data-chip-role` on the root, for tests and browser checks; a count chip also carries `data-count` and `data-count-of` (the owner's short key, e.g. `notables`).
- **Name clash, noted once.** In the ubiquitous language and Law 56, "chip" alone means a **Consequence Chip** (`Docs/ubiquitous-language/Encounters.md` § Consequence Chip, aliases "Chip, aftermath chip"). The `Chip` component is the generic pill; a Consequence Chip is one use of it (`role="state"` with a kind tag). The UL entry needs no change — it governs game terms, and the component name never reaches a player — but `component-selection.md`'s `Chip` row says it in one line so an agent reading "chip" in an encounter ticket knows which is meant.

**Today's chip components onto the roles** (player surfaces only; the UL viewer's and CMS's chips are dev tools and stay):

| Component (file) | Role | When it moves |
|---|---|---|
| `IdentityChip` (`Game/IdentityChip.tsx`) | — | not migrated: **dead code**. It is the god's old avatar chip (no `WorldRef`), superseded by `AscendantBar` in THR-184 and rendered nowhere (`GameViewTopBar.tsx` keeps only a comment; `GameView.tsx` only an import). Its deletion goes with the next edit of `GameView.tsx` — noted on [THR-1881](https://linear.app/threadbare/issue/THR-1881) |
| `ChipPill` (`shared/Section.tsx`, still reached through `HoverCard`) | identity with a ref, keyword without; draws an axis glyph today | THR-1879's sweep — its axis glyphs need carved icons first, so it moves once |
| `Chip` (`Game/ascendant-bar/HooksBlock.tsx`; the god's conditions, clues and vows, valence-tinted, no tile by THR-1120) | identity (attachment refs) | the frame build — THR-1828 rebuilds the god rail on the primitives from day one |
| `ChipRow` (`Game/MomentCard.tsx`) | identity | when touched |
| `ForecastPill` (`encounter-stage/shells/NudgeStageHeader.tsx`) | state | Stage build (THR-1829) |
| consequence chips SCAR / BOND / BOON / PATH (`Game/EncounterVeil.tsx`) | state, with a keyword kind tag and the delta cluster (Laws 15, 16, 56) | Stage build |
| `ActiveEffectChips` (`Game/ActiveEffectChips.tsx`) | state (sphere tint) | when touched |
| `PhaseBadge` (`Game/JourneyVignetteModal.tsx`) | state | when touched |
| `MovementBadge` (`HexMapV2/interaction/HexTooltip.tsx`) | state | when touched |
| `SummaryPill` (`Game/MandateTracker.tsx`) | state | when touched |
| `BondWordChip` (`Game/tabs/BondsTab.tsx`) | state | retired by THR-1827 — not migrated |
| `EncounterBadge`, `ThreadTugBadge`, `MomentBadge`, `EntityNoticeBadge` (`Game/`) | count (the tug keeps its price in tooltip and label) | THR-1879's sweep — they draw `!` / `✦` glyphs today and need their carved icons first, so they move once |
| `QueueBadge` (`Game/EventPopup.tsx`) | count | when touched |
| `IconButton`'s `badge` slot (`shared/IconButton.tsx`) | count, badge form, no icon (the button is the icon and carries the name) | S3 for a numeric `badge`; a string `badge` keeps today's rendering until its caller moves |
| `CardKeywordChip` (`shared/CardKeywordChip.tsx`) | keyword | THR-1879's sweep — its type glyph becomes an `IconName`; then a thin wrapper, same export |
| `RarityBadge` (`shared/RarityBadge.tsx`; used by `CardFace`) | keyword (text-only vocabulary, rarity accent) | when touched — today it is coloured text, not a pill, so moving it changes every card face; that belongs to a card-face ticket, not to the primitive's proof |
| `contentTagChips` descriptors (`Game/contentTagChips.ts`) | keyword | not migrated — its only builders, `ArtifactSheet` and `AttachmentDetailView`, retire with THR-1827 |
| Codex tag filter (`Codex/CodexTagFilter.tsx`) | keyword (toggle) | when the Codex is touched |
| `ReachBadge` (`Game/StoryBeatModal.tsx`) | keyword, with `ReachIcon` in the leading slot | when touched |
| `GroupLabel`, `SectionLabel` | not chips — section labels; they become `SectionHeading` | when touched |

Thin wrappers keep their export names so nothing that imports them changes; the wrapper's body becomes one `<Chip>`. `Chip` accepts a `leading` node only for our own drawn sets (`SphereIcon`, `ReachIcon`, `CoatOfArms`), which are not `IconName`s.

### Icon — THR-1834's carved family behind one primitive

```tsx
<Icon name="close" size="list" decorative />                       // a word label sits beside it
<Icon name="crossed-swords" size="alone" label="Fight" tooltipId="ui.fight" />   // carries meaning alone
```

- **Registry name → shape.** `name: IconName` is typed, so an unknown literal is a compile error. One resolver, `src/components/shared/iconShape.ts` (Law 3), returns `{ viewBox, paths: { d, opacity? }[] }` for any name, read from the registry entry — one path at opacity 1 for a carved shape, layered paths for a drawing of our own. It is the **only** source of icon shapes, for places as much as for concepts: the map's texture builder (`locationIconTextures.ts`) rasterises the same `{ d, opacity }[]` shape, so when THR-1879 moves places onto carved shapes the map and the panel read one entry (THR-1834: "a castle looks the same on the map and in the panel"). The registry stores **path data, never React components**, so a Unity port can turn the same data into a sprite atlas or vector imports.
- **Named sizes** (Law 11), as rem so they step up with the root: `floor` 14 px (0.875rem), `chip` 18 px (1.125rem), `list` 24 px (1.5rem), `alone` 34 px (2.125rem) — the last for an icon that carries meaning with no word beside it.
- **`currentColor` tint.** Every path fills `currentColor`. Sphere colour, gold, polarity reach the icon through the parent's `color` (or `tint`) — never a recolour of the art and never per-path colours.
- **Meaning-bearing needs words.** The props are a union: `{ decorative: true }` (renders `aria-hidden`) **or** `{ label: string }` (renders `role="img"` + `aria-label`). An icon cannot be meaning-bearing and unlabelled by accident. `tooltipId` wraps it in `Tooltip` — the Law 12 first-contact explanation; legends (the hand's glyph legend pattern) compose `Icon` + words.
- **One idea, one icon** (Laws 9, 10): a registry test fails if two names share a shape, or if a name's `meaning` is empty.
- **Top-bar buttons always carry their word label** (THR-1828, THR-1834); elsewhere a new icon brings its tooltip and, on first contact, a legend.
- **Fallback** (Law 4): a name that reaches the component at runtime without an entry (data from content) renders the designed neutral `fallback` shape and warns once — never a blank, never a throw.
- **Credits** (CC BY 3.0) are THR-1879's: its words, its home (THR-1834 says "the credits screen"), built from `ICON_CREDITS` so every shipped author is named. The one constraint this plan sets: **the credits line ships in the same PR as the first `game-icons` entry**, because the deployed build is public. S3 vendors none, so S3 owes none.
- **lucide-react leaves player surfaces.** Five player files import it today (`StartPage`, `chronicle/SoulCard`, `Encounter/ProseTtsButton`, `HexChronicle`, `LocationView`); debug, CMS, StyleGuide and lab may keep it. The ratchet row `lucide-import` holds the five; THR-1879's sweep replaces the three on kept surfaces; the other two sit in what the Inspector retires or reshapes (`LocationView`; `HexChronicle` as a view, whose prose the land page keeps — its lucide import goes with whichever ticket rebuilds it).
- **What S3 seeds:** `fallback` only, plus test fixtures. That proves the primitive (sizes, tint, labels, fallback, the resolver, the uniqueness tests) without a licence obligation. The vendored subset — THR-1834's sheet picks first, including the eleven place shapes, ~200 in all — arrives with THR-1879 and its credits line.
- **Input for THR-1879's sweep order** (it decides; these are the measured hot spots): glyphs inside `src/components/shared/` first (`Modal.Header`'s `×`, `Card.Header`'s `✕`, `Medallion`'s `✦`, `FlavorQuote`, `Section`, `RivalIcon` — every surface using a primitive benefits), with the other `×` close marks on kept surfaces (`ToastStack`; `SettingsPanel`'s goes with THR-1880); then the four thread-row badges and `CardKeywordChip` onto `Chip` with carved icons; then the Law 9 duplicates on kept surfaces (Unicode sphere symbols in `ArchetypeCard`, `SphereSlider` and the avatar sigil → `SphereIcon`; `REACH_GLYPHS` → `ReachIcon`; place emoji and the map's place drawings → the carved `place-*` shapes); then the data tables by size (`attachmentGlyphs.ts` 40 after [THR-1874](https://linear.app/threadbare/issue/THR-1874), `codexRegistry.ts` 31, `sublocation-concept-art.ts` 31, `nudge-card-display.ts` 23, `calling-content.ts` 19). Skip what THR-1827 / THR-1828 retire (`HexPoiPanel` alone holds 21 glyphs, World Pulse 6).

### Styleguide sections (Law 29)

Each primitive lands with its `?view=styleguide` section **and** its `component-selection.md` row in the same PR (`styleguideSync.test.ts` fails otherwise):

| Section | Shows |
|---|---|
| **Tokens · Radius and shadow** | the four levels side by side as swatches, with token names; `glowShadow` soft/strong on two sphere colours |
| **Overlay** | a launcher per backdrop (`dim` / `heavy` / `void` / `none`) and per band; a **stacking demo**: open an Overlay, open a Modal on it, press Escape → only the Modal closes, the readout shows `getEscapeLayers()` before and after (the THR-1816 class, live) |
| **Panel and Card** | page ⊃ panel ⊃ inset nested once; `floating`; `glass` over a map-coloured ground; a Card with header, count, close and footer |
| **Tabs** | `kind="tabs"` with *Now · Years · Ledger · 2*; `kind="toggle"` lens bar with key caps and `allowNone`; a keyboard caption |
| **Chip** | a grid of the four roles × both sizes × tints, plus the count's badge form on an `IconButton`; identity with a live ref and with a dead ref (plain text) — the section mounts a `RefRouterProvider` with a stub router that prints the opened ref in a readout, since the styleguide has no router today; count at 0 (captioned "renders nothing"), at 1 (the number shows) and at 12; keyword pressed/unpressed |
| **Icon** | every `IconName` at all four sizes with its meaning and source (the Law 10 audit sheet; it iterates the registry, so THR-1879's shapes appear without a styleguide edit), tinted by two sphere colours; the fallback; a meaning-bearing icon beside its decorative twin, with the accessible name shown |

### UI Laws engaged

1 (identity chips carry image, tooltip, link) · 3 (one resolver: `iconShape`, `EntityVisual`) · 4 (designed fallbacks) · 9, 10, 11, 12 (icons) · 13 (counts are counts; words for state) · 15 (magnitude slot takes only the sanctioned languages) · 17 (tooltips from the registry) · 21 (identity chips route through the router) · 23 (Escape closes the topmost surface; `:focus-visible`) · 25, 53 (zero counts render nothing) · 26, 27 (choose from the tree; presentation lives in primitives) · 29 (styleguide + catalog row) · 30 (tokens only) · 31 (polarity with a word; gold = the god's attention) · 33 (one viewport; Overlay never scrolls the page) · 35 (z from the named bands) · 40 (opening a count never clears it) · 44 (reduced motion) · 45 (contrast) · 46 (24 px hit areas) · 47 (acknowledged within `--anim-fast`) · 49 (coalesce into a count) · 50 (focus follows the surface) · THR-1820's new [E] grow-before-scroll law (Panel and Overlay never clip by default).

### Player-facing text

The primitives carry their owners' words; **this plan adds no new player-facing sentence.** The credits line is THR-1879's (it ships with the first carved shape). What changes on screen, slice by slice:

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| `IconButton` numeric badges (S3 → count): the top bar's Notables and Rivals buttons | Unchanged: the same whole number on the same button (e.g. the number of notables, `NotablesButton`'s `notableCount`); the button's tooltip and `aria-label` as today | PC-5 | One count instead of a stack; at zero the badge is not drawn, as today |
| Tabs (S3; first used by the Ledger rail, THR-1828) | The owner's labels — THR-1828 fixes "Now", "Years", "Ledger" with its unread count ("Ledger · 2"); the styleguide sample uses those words | PC-8 | Pressing a tab moves the underline at once (Law 47); the panel below changes with it |
| Keyword toggles and the lens bar (S3 toggle kind; THR-1830's "Dominion", "Threads", "Trouble", "Trade" with key caps "1"–"4") | The owner's words | PC-8 | A pressed toggle shows its pressed state at once; pressing it again turns it off, and the state says so |
| Any meaning-bearing icon (S3) | The owner's label as `aria-label`, plus a registry tooltip where new (Law 12) | PC-1 | `Icon` will not render a meaning-bearing shape without a label |
| Any surface over another (S2) | (no words) Escape closes the one on top | PC-8 | The surface they are looking at always answers the key |

### Playtest signal

- A tester who presses Escape with two surfaces open sees the top one close and the one beneath stay open.
- No tester reports an icon they could not find the meaning of: every icon they hover either has a word beside it or a tooltip.

### Event notifications

N/A — the primitives raise no game events. Count chips render counts their owners already keep.

### Debug inspection (DebugPanel and bridge)

- **`window.__DEBUG.getEscapeLayers(): Promise<{ label: string; band: number }[]>`**, topmost first — the read behind every Escape-order assertion (the Inspector's *armed card → top dialog → full → wide → docked*, the Stage's minimise). Declared in `src/debug-bridge.d.ts`.
- **`window.__DEBUG.getCountChips(): Promise<{ of: string; count: number }[]>`** (S3) — every mounted count chip, read from its `data-count-of` / `data-count` attributes. The read behind "the count did not clear on open" (Law 40) for the top-bar badges now and the needs-you pill and strip later. Declared in `src/debug-bridge.d.ts`.
- Root data attributes: `data-overlay-band`, `data-panel-level`, `data-chip-role` (+ `data-count`, `data-count-of`), `data-icon` — for Playwright and unit tests.
- No DebugPanel tab: nothing here has simulation state.

### Visual presence (HexMapV2)

N/A for the WebGL renderer. The lens bar and the map chrome buttons are HTML over the canvas; they use Tabs, Chip and Icon like any other surface. The renderer's own colour data (`HexMapV2/**/*.ts`: palettes, meshes, shaders) is excluded from the colour rows because Three.js materials take numbers, not CSS custom properties.

## The UI-debt ratchet — `npm run check:ui-debt`

### What it is

One script, `scripts/check-ui-debt.ts`, run with `node --experimental-strip-types` like `check-typecheck-ratchet.ts`. It counts each **row** (a pattern of UI debt) across a scope, compares every row's total with a committed baseline, `ui-debt-baseline.json` at the repo root, and fails if **any row went up**. Rows only go down. It runs in about a second.

Rows are data: `scripts/ui-debt-rows.ts` exports `UI_DEBT_ROWS: readonly UiDebtRow[]`, pure and importable by tests without running the gate. Registering a row is one entry plus `npm run check:ui-debt -- --update`.

```ts
export interface UiDebtRow {
  id: string;                    // 'raw-button' — stable; the baseline key
  owner: string;                 // the ticket that owns the burn-down, e.g. 'THR-1821'
  law: string;                   // why it is debt, e.g. 'Laws 26, 27'
  sanctioned: string;            // what to write instead, printed on failure
  roots: readonly string[];      // scan roots, repo-relative
  extensions: RegExp;            // which files in the roots
  homes: readonly RegExp[];      // files that legitimately implement the pattern (the primitive itself)
  count(source: CleanSource): number;   // comments already removed
}
```

### Scope

- **Player UI tree:** `src/components/**`, `src/hooks/**`, `src/contexts/**` — `.ts`, `.tsx`, `.css` (CSS modules included). 372 files today.
- **Excluded everywhere** (`UI_DEBT_EXCLUDED`, non-player surfaces): tests (`__tests__/`, `*.test.*`), `components/CMS/`, `components/StyleGuide/`, `components/UL/`, `components/TaxonomyViewer/`, `components/Game/debug/`, `components/HexMapV2/lab/`, and any file whose name contains `debug`/`Debug` (`DebugPanel.tsx`, `useDebugOpenModal.ts`, `meetingDebugState.ts`). Each entry carries its reason in a comment, as `styleguideSync.test.ts` does for its exemptions.
- **Comments never count.** `.ts`/`.tsx` files are parsed with the TypeScript compiler API and re-printed with `removeComments: true` before counting; `.css` files lose `/* … */` blocks. (A hand-rolled stripper mis-reads apostrophes in JSX text as string openers.) The compiler is proven present first, as the typecheck ratchet's property 4 does.

### The rows, how each is detected, and today's baselines

Measured on `main` @ `3cf81086` (2026-10-14) with a scratch scan that implements exactly the detectors below. The executor re-measures at landing; each committed baseline should be within ±10 % of these numbers, or the commit body says why (a detector difference is the usual reason, and it should be fixed rather than explained).

**Rows this ticket lands (S1):**

| Row id | Owner | Law | Counts | Detector | Homes (exempt) | Baseline (total / files) | Write instead |
|---|---|---|---|---|---|---|---|
| `raw-button` | THR-1821 | 26, 27 | raw `<button>` elements | `/<button\b/` in `.tsx` | `shared/Button.tsx`, `shared/IconButton.tsx` (Chip and Tabs add theirs when they land) | **203 / 85** | `Button`, `IconButton`, `Tabs.Tab`, `Chip` |
| `colour-hex` | THR-1821 | 30 | hex colour literals | `/(?<![&\w#])#(?:[0-9a-f]{8}\|[0-9a-f]{6}\|[0-9a-f]{3,4})\b(?![-\w])/i` (the look-behind skips `&#9670;` entities) | `HexMapV2/**/*.ts` (WebGL colour data — not `.tsx`) | **371 / 75** | `var(--token)` |
| `colour-fn` | THR-1821 | 30 | `rgb()`/`rgba()`/`hsl()`/`hsla()` with a numeric first argument | `/\b(?:rgba?\|hsla?)\(\s*\d/` — `rgb(var(--x-rgb) / 0.4)` stays legal | as above | **309 / 66** | a token, or `rgb(var(--x-rgb) / a)` |
| `glyph-icon` | THR-1821 / THR-1834 | 9–12 | emoji and symbol characters drawn as icons | every code point in `GLYPH_ICON_RANGES` (U+2300–23FF, 25A0–25FF, 2600–26FF, 2700–27BF, 2B00–2BFF, 1F000–1FAFF), whether literal, `\uXXXX`, `\u{XXXXX}`, `&#xHHHH;` or `&#DDDD;`; VS16 and ZWJ are not counted; arrows (U+2190–21FF), punctuation (`·` `—` `…`) and `×` (U+00D7, also the speed multiplier "2×") are typography and not counted — the five `×` close marks are on THR-1879's sweep list instead | `shared/DeltaCluster.tsx`, `shared/OddsPips.tsx` (Law 15's sanctioned magnitude languages) | **325 / 74** | `Icon` |
| `glyph-icon-data` | THR-1821 / THR-1834 | 9–12 | the same, in data tables | same detector over `src/data/**` (tests excluded) | none | **171 / 30** | an `IconName` in the table |
| `lucide-import` | THR-1834 | 9 | lucide on player surfaces | `/from\s+['"]lucide-react['"]/` | none | **5 / 5** | `Icon` |
| `hand-overlay` | THR-1821 | 23, 35 | full-cover layers built by hand | (a) a class string with `fixed` and `inset-0`; (b) a class string with `absolute`, `inset-0` and a `z-40`+ class; (c) a style object or CSS rule with `position: fixed` and full-cover offsets (`inset: 0`, all four sides 0, or a spread named `*INSET*`) in the **same** block. A layer with `pointer-events-none` / `pointerEvents: 'none'` is decoration and does not count | `shared/Modal.tsx`, `shared/Overlay.tsx` | **17 / 13** | `Overlay` / `Modal` |
| `escape-listener` | THR-1821 (the THR-1816 class) | 23, 50 | Escape handled outside the registry | `(window\|document).addEventListener('keydown'` in a file whose text contains `'Escape'` | `shared/useEscapeLayer.ts` | **11 / 11** | `Overlay`, or `useEscapeLayer` with a named band |
| `radius-literal` | THR-1821 | 27, 30 | radii not on the token set | `borderRadius:`/`border-radius:` whose value is not `var(--radius-*)`, `var(--panel-radius)`, `0` or `50%`; plus Tailwind default-scale `rounded`, `rounded-{xs,sm,md,lg,xl,2xl,3xl,4xl}` and `rounded-[…]` (with side prefixes), but not `rounded-full`/`rounded-none` | none | **305 / 108** | `var(--radius-page\|panel\|control\|chip)` or `rounded-panel` etc. |
| `shadow-literal` | THR-1821 | 27, 30 | shadows not on the token set | `boxShadow:`/`box-shadow:` whose value does not start with `var(--shadow-*)`, `none` or `glowShadow(`; plus Tailwind `shadow`, `shadow-{2xs,xs,sm,md,lg,xl,2xl,inner}`, `shadow-[…]` | none | **48 / 44** | `var(--shadow-*)`, `shadow-panel` etc., `glowShadow()` |
| `uppercase` | THR-1833 (assigned here) | type system | text set in capitals by transform | `/\buppercase\b/` (Tailwind class, `textTransform`, CSS) | none | **205 / 82** | sentence case (Alegreya Sans 700 labels) |
| `monospace` | THR-1833 (assigned here) | type system | monospace on player surfaces | `/\bfont-mono\b\|\bmonospace\b\|var\(--font-mono\)/` | none | **26 / 16** | Alegreya Sans with `tabular-nums` |
| `font-face-literal` | THR-1833 (assigned here) | type system | a face named outside the tokens (Georgia, Palatino, Book Antiqua, Times New Roman, Cinzel, Alegreya, Arial, Helvetica, Inter, Segoe UI) | one count per string literal or CSS `font-family` declaration naming one; tokens in `src/index.css` are out of scope by root | none | **17 / 11** (Georgia itself: 0 — it arrives only through `--font-prose`, which THR-1833 repoints) | `var(--font-display\|body\|prose)` |

**Rows the sister tickets register** (per the brief, after this script lands; their plan docs own the row definition and baseline — these are reference measurements with the same scope and comment removal, so the numbers can be cross-checked):

| Row id | Owner | Reference detector | Reference count |
|---|---|---|---|
| `literal-font-size` | THR-1819 | its plan doc § 11 (merged): a `fontSize:` value that still holds a bare number or a quoted `px`/`rem`/`pt`/`vw`/`vh` length after removing type-scale `var(--text-*)` references; a CSS `font-size:` with such a length; Tailwind `text-[<n>px\|rem]`; Tailwind sizes above the scale (`text-3xl`…); an undefined size token (`var(--text-2xs…)`). Named constants, `em`/`%`, computed templates and SVG `fontSize=` are not counted | 198 / 55 (THR-1819's count; this scan's narrower regex found 189 / 51) |
| `modal-maxwidth` | THR-1820 | every `<Modal` or `<RevealCard` opening tag, **across lines**, that carries `maxWidth=`, in `src/components/**/*.tsx` (THR-1820's definition, from its cross-plan comment on THR-1821). A one-line or `[^>]`-bounded regex undercounts: arrow functions inside props contain `>` | 17 (THR-1820's count; this scan's naive regex found 13) |
| `graph-query-in-ui` | THR-1822 | its plan doc § D14: every `WorldGraph` read method (`.getNode(`, `.getNodesByType(`, `.getAllNodes(`, `.getEdge(`, `.getOutgoingEdges(`, `.getIncomingEdges(`, `.getAllEdgesForNode(`, `.getEdgesByType(`, `.getAllEdges(`, `.getNeighborIds(`, `.getByTag(`) in the UI tree, debug tooling excluded (reported beside it, unratcheted) | 197 / 42 (both scans agree) |
| `graph-write-in-ui` | THR-1822 | its plan doc § D14: every `WorldGraph` write method (`.addNode(`, `.removeNode(`, `.updateNode(`, `.addEdge(`, `.removeEdge(`, `.updateEdge(`, `.applyMutations(`, `.retargetEdgeSource(`) | 3 / 3 |

**Deliberately not a row:** hand-built panel shells (`var(--bg-surface)` with a border and radius). Measured, the detector cannot tell a shell from a row background or a chip ground, so the number would be noise; Panel adoption is tracked through § Migration order and the `radius-literal`/`shadow-literal` rows, which every hand-built shell trips anyway.

**How much is about to retire anyway.** Of today's counts, the surfaces THR-1827 and THR-1828 retire hold: 32 raw buttons (16 %), 104 colour literals (15 %), 61 icon glyphs (19 %), 73 literal radii (24 %), 40 `uppercase` (20 %), 5 monospace (all of World Pulse), 1 of 17 hand-built overlays (`DetailModal`), 1 of 11 Escape listeners (`DetailModalStackContext`). Those counts drop when the Inspector build deletes them; nobody migrates them first.

### Verdicts

`classifyUiDebt(measured, baseline, flags)` is pure and returns one verdict per row plus a run verdict. `main()` does the I/O.

| Verdict | When | Exit |
|---|---|---|
| `unverifiable` | the TypeScript compiler does not resolve; a root has zero files; any file fails to read or parse | 1 — "a ratchet that cannot run must never report a floor" (THR-1128) |
| `no-baseline` | `ui-debt-baseline.json` missing or malformed | 1, says to run `--update` |
| `unregistered-row` | a row in `UI_DEBT_ROWS` with no baseline entry | 1, says to run `--update` |
| `orphan-row` | a baseline entry with no row | 1 unless `--update` (which drops it; say why in the commit body) |
| `increase` | any row total above its baseline | 1; names the row, its `sanctioned` form, and the files that grew (advisory, up to `UI_DEBT_GROWTH_REPORT_LIMIT`) |
| `suspect-drop` | a row with a baseline of at least `UI_DEBT_SUSPECT_DROP_MIN_BASELINE` fell by more than `UI_DEBT_SUSPECT_DROP_RATIO` in one run | 1 unless `--allow-drop` — a detector or scope that silently matches nothing looks exactly like this (property 5 of the typecheck ratchet) |
| `decrease` | below baseline | 0; asks for `--update` and a committed baseline so the floor holds |
| `unchanged` | equal | 0 |

`--update` writes the measured totals and per-file maps (keys sorted, so the file diffs cleanly). It **refuses to raise an existing row** unless that row is named with `--allow-increase=<row-id>` — raising a ceiling is a deliberate, named act with a reason in the commit body, never a side effect of refreshing. It refuses on `unverifiable` and `suspect-drop` like the typecheck ratchet.

The gate is each row's **total**. The per-file map only makes a failure actionable; debt moving between files never fails the build.

Output, one line per row:

```
check-ui-debt: OK — 13 rows
  raw-button          203 → 201  (−2, run --update)
  colour-hex          371 → 371
  …
```

### Wiring into the gates

- `package.json`: `"check:ui-debt": "node --experimental-strip-types scripts/check-ui-debt.ts"`.
- `scripts/gate.ts`: one more gate in the code track's first stage, `{ name: "ui-debt", command: "npm run check:ui-debt" }` (about a second, no vitest, so it does not break the one-vitest-per-stage rule); `scripts/__tests__/gate.test.ts` updated for the new plan shape. Not on the docs track — a docs-only diff cannot move a count.
- `.github/workflows/ci.yml`, `Test · Typecheck · Build` job: a step `UI debt ratchet` running `npm run check:ui-debt`, placed after `Chip referent ratchet`, with a comment in that file's style. CI stays authoritative.
- **Not** registered with `check:generated-freshness`, for the reason the chip ratchet gives: freshness would force the baseline to equal the current count on every commit and delete the only thing a ratchet does.
- Docs: `Docs/canon/verification-gates.md` code-track list gains `check:ui-debt`; `Docs/design-system/laws.md` § Enforcement ("machine gates where a machine can check") gains one line naming the rows by law. That line is enforcement text, not a law change.

## Migration order (brief decision 10)

1. **Primitives and the ratchet land first** (§ Build slices), before any surface of the new screen is written.
2. **New surfaces are built on them from day one**, and their tickets say so: the screen frame (top bar, god rail, Ledger rail and strip), the Inspector (docked / wide / Full, Connections, land page), the Stage, the lens bar and legend, Find anything, the needs-you queue. In these, a raw button, a hex literal, a glyph icon or a hand-built overlay is a review failure even though the ratchet would only catch the net count.
3. **Inside the primitive slices, only what proves the primitive or closes a live bug class migrates, and every surface moves once, onto its final primitive** (the THR-1880 rule):
   - **S2 (Overlay and Panel):**
     - *The Escape bug class* — eight listeners join the registry: `Tooltip` and `Dropdown` (shared, every surface), `useViewNavigation`'s move mode, the two full-screen ceremonies' (`ThreadingRite`, `remembranceChoice`), and `AgendaPicker`, `InterventionConfirm` and `MandateTracker`, which swap their `document` listener for `useEscapeLayer` and are not otherwise moved. Of the other three, `ScryOverlay` and `SettingsPanel` lose theirs when THR-1880 moves them, and `DetailModalStackContext` retires.
     - *Full-screen ceremony* (THR-1829's third home) onto `Overlay backdrop="void"`: `MeetTheFirstFlow` and `ThreadingRite`. `MandateTracker`'s click-catcher onto `Overlay backdrop="none"`.
     - *Not moved by S2:* the six dialogs THR-1880 owns (Settings, `ChoiceSetModal`, `ScryOverlay` — a dialog, tier L — the Codex layer — a dialog, tier XL — `HarvestScreen`, `WarmStartOverlay`), the Stage's roots in `EncounterVeil` (the Stage build), and `StrandView`, `AgendaPicker`, `InterventionConfirm` as surfaces (when touched — `InterventionConfirm` follows its copy `ChoiceSetModal` onto `Modal` at tier S, or retires if the Inspector's armed-card cast replaces it, THR-1827 call 14).
   - **S3 (Icon, Chip and Tabs):** one live migration — `IconButton`'s numeric badge renders `Chip role="count"` (the top bar's Notables and Rivals buttons today). The identity, state and keyword roles and both Tabs kinds are proven in the styleguide (live and dead refs, the lens-bar toggle); their first live uses are the new surfaces — the Inspector's Connections rows and "where" line, the Ledger rail's tabs, the lens bar, the needs-you pill — which are built on them from day one. Everything that draws a glyph today (the thread-row badges, `CardKeywordChip`, `Section`'s `ChipPill`) waits for THR-1879's sweep, so it moves once. The god rail's hook chips are rebuilt by the frame build on the primitives.
   - **Icons on legacy surfaces** follow THR-1879's sweep order (input in § Icon).
4. **Kept legacy surfaces migrate when a ticket touches them**, in this order of traffic when a dedicated migration ticket is ever filed: the encounter Stage's shells (moved by the Stage build anyway) → kept dialogs (Doom, Mandate, Omen, gifts and receipts, `RevealCard` / `EventPopup`, Chapter Ledger, court, Settings, the Threading Rite's bond-only reveal, the Codex) — THR-1820's tier migration touches every one of these `Modal` calls, which is the natural moment → the opening flows (Meet-the-First, Remembrance) → everything else.
5. **Retired by THR-1827 or THR-1828 — not migrated:** `AgentProfileModal` and its tabs (`TabBar`, `OverviewTab`, `BondsTab`, …), `LocationProfileModal`, the `FactionSheet` / `ArmySheet` / `ArtifactSheet` / `AscendantSheet` modals, `AttachmentDetailView`, `DetailModal` for world refs and `DetailModalStackContext`, `LocationView`, `HexBreadcrumb`, `HexSidebar`, `ThreadDetailView`, `HexDetailView`, the ActionDrawer subject hand, `LiveLocationBar`, the unmounted `HexZoomView` / `HexFlavorPanel` / `HexPoiPanel`, and World Pulse. Their debt leaves the counts when they are deleted.

## Build slices

Three tickets share this plan doc. The ratchet ships first because THR-1822 (and THR-1819 / THR-1820) register their rows into it.

| Slice | Ticket | Contents | Blocked by |
|---|---|---|---|
| **S1 — ratchet and tokens** | [THR-1821](https://linear.app/threadbare/issue/THR-1821) (this ticket) | `check:ui-debt` with its 13 rows, baseline, tests, gate + CI wiring, docs; radius / shadow / scrim / glass tokens in `@theme static`; `--panel-radius` alias; `glowShadow()`; `tokens.md` | — |
| **S2 — Overlay and Panel** | filed at handoff | `zBands.ts`, `Overlay`, `Panel`, `Modal` and `Card` re-based, `useEscapeLayer` label + `getEscapeLayers()`, the S2 migrations in § Migration order 3, styleguide sections, catalog rows | S1 |
| **S3 — Icon, Chip and Tabs** | filed at handoff | `src/data/icons/iconRegistry.ts` (format, `fallback`, `ICON_CREDITS`), `iconShape.ts`, `Icon`, `Chip`, `Tabs`, the S3 migrations in § Migration order 3, styleguide sections, catalog rows | S1 |

Downstream, outside this plan: [THR-1880](https://linear.app/threadbare/issue/THR-1880) is blocked by S2 (it needs `Overlay`); [THR-1879](https://linear.app/threadbare/issue/THR-1879)'s execution builds on S3 (it fills the registry the primitive draws from).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — the engine rows (orchestrator phase, GameState field, traces) are N/A for every module here; the UI, debug and player-control rows apply.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `scripts/check-ui-debt.ts` + `scripts/ui-debt-rows.ts` | none (repo gate) | — | — | — | console verdict; `.cache/gate/ui-debt.log` under `npm run gate` |
| `shared/zBands.ts` | none | Overlay, Modal, Tooltip, Dropdown, EncounterVeil (re-export) | — | — | `data-overlay-band` |
| `shared/Overlay.tsx` | none | Modal; the Stage; full-screen ceremonies | — | — | `__DEBUG.getEscapeLayers()` |
| `shared/useEscapeLayer.ts` (extended) | none | Overlay, Tooltip, Dropdown, the Inspector, move mode | — | — | `__DEBUG.getEscapeLayers()` |
| `shared/Panel.tsx` | none | Card, Modal, rails, Inspector, legend cards | — | — | `data-panel-level`; dev-only nesting warning |
| `shared/Tabs.tsx` | none | Ledger rail, lens bar | — | — | ARIA roles |
| `shared/Chip.tsx` | none | `IconButton` badges now; the needs-you pill, strip, Connections rows, thread rows and god rail as they are built or swept | — | — | `data-chip-role`; `__DEBUG.getCountChips()` |
| `shared/Icon.tsx` + `shared/iconShape.ts` + `src/data/icons/iconRegistry.ts` | none | everything that draws an icon; THR-1879's credits line reads `ICON_CREDITS` | — | — | `data-icon`; the styleguide Icon sheet; one console warning per unknown name |

Player controls: Escape (through the registry), Tab / arrows inside `Tabs`, the owners' hotkeys (lens `1`–`4`). No prose pipeline involvement.

## Interface impact

| Contract | Disposition |
|---|---|
| `useEscapeLayer(active, onEscape, zIndex)` | **extend** — optional fourth argument `label`; existing callers unchanged |
| `MODAL_Z_DEFAULT`, `MODAL_Z_ABOVE_INTERRUPT`, `ESCAPE_LAYER_Z_PANEL`, `ENCOUNTER_VEIL_Z` | **preserve** — become re-exports of `zBands.ts` |
| `Modal` props (`open`, `onClose`, `maxWidth`, `zIndex`, `closeOnEscape`, `context`, …) | **preserve** in S2 (THR-1820 replaces `maxWidth` with `size` on its own schedule) |
| `Card` props and compounds | **preserve** |
| `IconButton` props (`icon`, `badge`) | **preserve**; `badge` renders through `Chip role="count"` |
| `CardKeywordChip`, `RarityBadge` exports | **preserve** — each becomes a thin wrapper over `Chip` when it moves (THR-1879's sweep; a card-face ticket) |
| `window.__DEBUG` (`src/debug-bridge.d.ts`) | **add** `getEscapeLayers()` (S2) and `getCountChips()` (S3) |
| `scripts/gate.ts` `planGates` | **extend** — one gate in the code track |
| CI `Test · Typecheck · Build` | **extend** — one step |
| Any engine read or write | none (`Docs/canon/interface-map.md` has no UI-library row to change) |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `--radius-page` / `--radius-panel` / `--radius-control` / `--radius-chip` | `0.75rem` / `0.5rem` / `0.25rem` / `999px` | Radius by hierarchy level |
| `--shadow-page` / `--shadow-panel` / `--shadow-control` / `--shadow-chip` | see § Tokens / `none` | Shadow by hierarchy level |
| `--scrim-dim` / `--scrim-heavy` | `rgb(0 0 0 / 0.6)` / `rgb(0 0 0 / 0.8)` | Overlay backdrops |
| `--bg-glass` | `rgb(17 17 20 / 0.72)` | Glass panel over the map |
| `GLASS_BLUR_PX` | `10` | Glass panel backdrop blur |
| `GLOW_SOFT_BLUR_PX` / `GLOW_SOFT_PCT` | `8` / `38` | `glowShadow(c, 'soft')` |
| `GLOW_STRONG_BLUR_PX` / `GLOW_STRONG_PCT` | `20` / `60` | `glowShadow(c, 'strong')` |
| `Z_BAND` | `mapOverlay 10 · hud 20 · topBar 30 · drawer 40 · debug 45 · focused 50 · stage 50 · modal 60 · modalAboveInterrupt 65 · tooltip 70 · menu 9999` | The stacking table as data (Law 35) |
| `OVERLAY_TOP_OFFSET_VH` | `5` | `placement="top"` offset (Modal's today) |
| `OVERLAY_EXIT_MS` | `200` | Unmount delay after the exit animation (Modal's today) |
| `ICON_SIZE_REM` | `floor 0.875 · chip 1.125 · list 1.5 · alone 2.125` | Named icon sizes = 14 / 18 / 24 / 34 px at 1080p (Law 11) |
| `GAME_ICON_VIEWBOX` | `'0 0 512 512'` | The game-icons grid |
| `CHIP_HEIGHT_REM` | `sm 1.5 · md 2` | Chip heights = 24 / 32 px at 1080p, 27 / 36 px at 1440p (sm keeps the Law 46 hit area) |
| `CHIP_PAD_X_REM` | `sm 0.5 · md 0.75` | Chip horizontal padding |
| `CHIP_BADGE_HEIGHT_REM` | `1` | The count's badge form on a control (16 px at 1080p, today's badge size) |
| `TAB_UNDERLINE_PX` | `2` | Selected / pressed underline |
| `TAB_MIN_HEIGHT_REM` | `2.5` | Tab hit area (40 px at 1080p, 45 px at 1440p) |
| `UI_DEBT_BASELINE_PATH` | `'ui-debt-baseline.json'` | Committed baseline |
| `UI_DEBT_SUSPECT_DROP_RATIO` | `0.5` | A one-run drop above this share is suspect |
| `UI_DEBT_SUSPECT_DROP_MIN_BASELINE` | `10` | Below this baseline a row may drop freely (a 4 → 1 drop is real work, not a broken detector) |
| `UI_DEBT_GROWTH_REPORT_LIMIT` | `20` | Files listed on an increase |
| `GLYPH_ICON_RANGES` | the six ranges in § rows | Which code points count as icon glyphs |
| `UI_DEBT_EXCLUDED` | the list in § Scope | Non-player surfaces |

## Tracing

N/A for engine traces — nothing runs in the tick or writes `GameState`. Inspectability instead: `getEscapeLayers()` names every open escape layer in order; the data attributes name each primitive's role, band and level; the ratchet prints per-row totals and, on failure, the files that grew; the styleguide renders every icon with its meaning and author.

```ts
// Debug bridge addition (src/debug-bridge.d.ts)
interface EscapeLayerReading {
  label: string;   // the Overlay's label, or the useEscapeLayer caller's label ('unlabelled' if none)
  band: number;    // its Z_BAND value
}
getEscapeLayers(): Promise<EscapeLayerReading[]>;  // topmost first (S2)

interface CountChipReading {
  of: string;      // the owner's short key, e.g. 'notables'
  count: number;   // the number the chip shows
}
getCountChips(): Promise<CountChipReading[]>;      // every mounted count chip (S3)
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `Icon` gets a name with no registry entry at runtime | Renders the `fallback` shape at the requested size; warns once per name; never throws, never blank (Law 4) |
| An `iconShape` path is malformed | The browser draws nothing for that path; the registry test (every `d` parses as a path) catches it before merge |
| `Chip role="identity"` ref no longer resolves | Plain styled text, no link, no hover (Law 21 fail-open) |
| `Chip role="identity"` without a router context | Plain text with its image and tooltip; no click |
| `Chip role="count"` with `count <= 0` or a non-finite count | Renders nothing |
| `Tabs` with an unknown `value` | First tab selected, one warning |
| `Tabs` with no children | Renders nothing |
| An Overlay's `onClose` throws on Escape | The registry already catches and logs (`useEscapeLayer`), and Escape keeps working for the layers below |
| Two Overlays in one band | Later registration is on top (the registry's existing rule) |
| A Panel nested at the same or a lower level | Renders; logs one dev-only warning |
| `check:ui-debt`: compiler missing, empty root, unreadable or unparsable file | `unverifiable`, exit 1, nothing written |
| `check:ui-debt`: baseline missing or malformed | exit 1 with the `--update` instruction |
| `check:ui-debt`: a row halves in one run | `suspect-drop`, exit 1 unless `--allow-drop` |

## Blast Radius

Not required: no file with ≥ 100 importers is edited. The widest are `Tooltip.tsx` (71 importers; only its Escape listener changes) and `Modal.tsx` (24; re-based with unchanged props). `index.css` gains one `@theme static` block, four more tokens and one alias.

## Kill criteria

- **The ratchet is red for reasons nobody can act on.** If, in its first two weeks, more than one PR is blocked by a row whose detector counted something that is not debt, that detector is narrowed (a fixture test first) — not the baseline raised.
- **The Overlay re-base changes how a live dialog behaves.** If `Modal`'s snapshot or any THR-1816 regression test changes behaviour (not markup), S2 stops and `Modal` keeps its own backdrop until the difference is understood.
- **Tailwind's `@theme static` does not emit the variables, or a fixture class `rounded-panel` produces no rule.** Then the tokens move to plain `:root` variables and the rows accept `var(--…)` alone; the decision is recorded in `tokens.md`. An unused utility producing no rule is normal Tailwind behaviour and is **not** this criterion.
- **Chip's four roles do not cover a real surface.** If the frame or Inspector build needs a fifth shape, it is raised as a Chip API question before a local chip is written.

## Three-pillar check

- [x] Engine pillar present (N/A with rationale: no engine module; the view-model seam is THR-1822)
- [x] Content pillar present (the icon registry's data format, its `fallback` entry and the `ICON_CREDITS` function; the carved shapes — places included — the concept-class maps and the credits line are THR-1879's)
- [x] UI pillar present (six primitives, tokens, styleguide, laws, text, debug reads)
- [x] Wiring section connects them (module table, interface impact, gate wiring)

## Vision audit

- [x] This plan does not contradict any Vision premise. It changes how surfaces are built, not what the game shows or means; the carved family and the type faces were chosen by Christian (THR-1834, THR-1833). *Always dark* and *gold means important* are kept (tabs never gold; gold count only for the god's attention) — the design-system statements of those premises are `Docs/design-system/INDEX.md` § Core Constraints and Laws 31–32.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No rulebook edit.

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1821-component-library-and-ui-debt-ratchet-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every size, radius, shadow, band, glow strength and ratchet threshold is a named constant or token (§ Constants); rows are data |
| 2. Inspectability | PASS | `getEscapeLayers()`, root data attributes, per-row ratchet output with per-file growth, the styleguide icon sheet |
| 3. Determinism | PASS | No randomness anywhere; the ratchet sorts its output and baseline keys |
| 4. Fail-soft | PASS | § Fail-soft: primitives degrade to designed states; the gate fails closed, never open |
| 5. Narrative over mechanical perfection | PASS | Icons and chips keep the game's words (state chips always carry the word; icons need a label or tooltip) |
| 6. Additive over destructive | PASS | New primitives and tokens; `Modal`, `Card`, `IconButton`, the z constants and three chip exports keep their APIs; `--panel-radius` kept as an alias; nothing retiring is migrated |
| 7. Performance budget | PASS with note | The ratchet parses ~400 files in about a second (the executor reports the measured time in the S1 PR); the primitives add no render work beyond the markup they replace; `Icon` is inline SVG with no fetch. The one new cost is `material="glass"`'s backdrop blur over the WebGL canvas: it is reserved for small panels on the map (the lens legend, capped at 180 px tall by THR-1830), and a larger glass surface is profiled before it ships |

## Done when

**S1 — [THR-1821](https://linear.app/threadbare/issue/THR-1821) (ratchet and tokens):**

- [ ] `npm run check:ui-debt` exists and passes on `main`; `ui-debt-baseline.json` holds the 13 rows of § rows, each within ±10 % of this doc's measurement or explained in the commit body
- [ ] Unit tests (`scripts/__tests__/check-ui-debt.test.ts`, node, no DOM) give every detector a positive and a negative fixture, including: comments not counted; `&#9670;` not a hex colour; `rgb(var(--x) / 0.4)` legal; `\u{1F441}` and `&#x2715;` counted as glyphs; `→` and `·` not counted; a `pointer-events-none` full-cover layer not counted; a home file exempt; `rounded-full` and `50%` legal. Verdict tests cover `increase`, `decrease`, `suspect-drop`, `unregistered-row`, `orphan-row`, `unverifiable` (empty root) and `--update` refusing to raise a row without `--allow-increase`
- [ ] Adding one `<button>` to a scoped fixture file fails the check and names `raw-button`, `Button / IconButton` and the file (a negative control in the test, not a commit)
- [ ] `npm run gate` runs `ui-debt` on the code track; `gate.test.ts` updated; CI `Test · Typecheck · Build` has the `UI debt ratchet` step
- [ ] `src/index.css` has the `@theme static` block (radius, shadow), the scrim and glass tokens and the `--panel-radius` alias; the built CSS from `npx vite build` declares `--radius-panel` and `--shadow-panel` (assert the variables, not utilities — no surface uses a utility yet). Optionally prove the utility path with a test-only fixture that renders `rounded-panel`; an absent utility with no use is expected, not a failure
- [ ] `glowShadow()` exported from `shared/sphereTint.ts` with a unit test
- [ ] `Docs/design-system/tokens.md` (radius, shadow, scrim, glass sections), `Docs/canon/verification-gates.md` (code track list) and `Docs/design-system/laws.md` § Enforcement (one line) updated
- [ ] Code gates: `npm run gate` then `npm run gate -- --final`. Browser-verify exempt: tokens are added but no surface uses them yet, and the script is tooling
- [ ] Closing commit body has `Fixes THR-1821` alone on its line

**S2 — Overlay and Panel:**

- [ ] `Overlay`, `Panel` and `zBands.ts` exist with the § UI pillar APIs; `Modal` and `Card` are re-based with unchanged props; `Modal.test.tsx`, `useEscapeLayer.test.ts` and the THR-1816 regression tests pass unchanged
- [ ] `escape-listener` is at most 3 (`ScryOverlay` and `SettingsPanel`, which THR-1880 moves, and `DetailModalStackContext`, which retires) and `hand-overlay` is at most 14 (`MeetTheFirstFlow`, `ThreadingRite` and `MandateTracker`'s click-catcher moved), with the baseline updated downward
- [ ] No file THR-1880 owns is edited (Settings, `ChoiceSetModal`, `ScryOverlay`, `HarvestScreen`, `WarmStartOverlay`), and `GameView.tsx` is not edited (THR-1881)
- [ ] `getEscapeLayers()` in the debug bridge and its `.d.ts`
- [ ] Styleguide sections *Tokens · Radius and shadow*, *Overlay* (with the stacking demo) and *Panel and Card*; `component-selection.md` rows for `Overlay`, `Panel` and the updated `Card` row (with the "a playing card is `CardFace`" line); `primitives.md` specs; `layout-zones.md` points at `zBands.ts`
- [ ] Browser evidence at 1920×1080 (Playwright): `?view=styleguide` stacking demo — Overlay, then Modal, Escape → `await __DEBUG.getEscapeLayers()` lists only the Overlay; `?view=game&seeded&size=medium&forceencounters` → THR-1816's repro still closes only the sheet; a tooltip open over a modal closes alone on Escape. Console clean. UI-Laws line for 23, 33, 35, 44, 50

**S3 — Icon, Chip and Tabs:**

- [ ] `Icon`, `iconShape.ts`, `src/data/icons/iconRegistry.ts` (format, `fallback`, `ICON_CREDITS`) with the § UI pillar API; registry tests (run on fixture entries as well as the real registry): unique shapes, non-empty meanings, every `d` parses, a carved entry is one path, `ICON_CREDITS` lists exactly the distinct `game-icons` authors (empty today); **no `game-icons` entry is vendored** (THR-1879 does that with its credits line)
- [ ] `Chip` and `Tabs` with the § UI pillar APIs; the S3 rows of the chip mapping table migrated; thin wrappers keep their exports
- [ ] Tests: identity chip routes through the router and falls back to text on a dead ref; count chip renders nothing at 0, shows its number at 1 and does not clear on open; tabs keyboard (arrows, Home/End), `allowNone` toggle, unknown value falls back to the first tab; a meaning-bearing `Icon` without `label` does not type-check (a `@ts-expect-error` fixture)
- [ ] Styleguide *Icon*, *Chip* and *Tabs* sections; `component-selection.md` rows (the `Chip` row carries the Consequence Chip note); `primitives.md` specs; `Chip.tsx` and `Tabs.tsx` added to the `raw-button` homes; any row that fell is re-baselined
- [ ] Browser evidence at 1920×1080 (Playwright): `?view=game&seeded&size=medium` — the top bar's Notables and Rivals buttons with their count badges after migration (same number, same tooltip; opening Notables leaves its count unchanged, Law 40), plus the three styleguide sections, including an identity chip opening a live ref from the styleguide; `await window.__DEBUG.getCountChips()` before and after opening the Notables list, showing the same `{ of: 'notables', count }`; console clean; UI-Laws line for 1, 9, 10, 11, 12, 13, 21, 25, 31, 40, 46

## Coordination block

**S1 — THR-1821 (this handoff):**

**Suggested model:** sonnet — two ratchets in the repo give the exact shape (verdicts, baseline I/O, entry guard); the detectors are specified here with fixtures. Advisory only.

**Blocks:** [THR-1820](https://linear.app/threadbare/issue/THR-1820) — it registers its `modal-maxwidth` row after S1 lands, and records itself as blocked by THR-1821 for that reason (its cross-plan comment, 2026-10-14). [THR-1822](https://linear.app/threadbare/issue/THR-1822) likewise adds `graph-query-in-ui` and `graph-write-in-ui` after S1 (see Mutex).

**Parallel-safe with:** [THR-1819](https://linear.app/threadbare/issue/THR-1819) — it adds its `literal-font-size` row only after S1 lands (brief), or posts it on THR-1821 for S1's executor if it runs first (its § 11). It and THR-1820 also edit `src/index.css`; S1 adds one new `@theme` block after the Tailwind import and one alias line, a region neither of them changes, so a merge is mechanical. Parallel-safe with [THR-1881](https://linear.app/threadbare/issue/THR-1881) (GameView split — S1 touches no component). (The S2 and S3 slice tickets are blocked by S1, so they never run beside it.)

**Mutex with:** [THR-1822](https://linear.app/threadbare/issue/THR-1822) — both edit the ratchet script and the `npm run gate` wiring (brief); S1 lands the script first, then THR-1822 adds its two rows. Also any ticket editing `scripts/gate.ts` or the CI `Test · Typecheck · Build` job.

**Files to touch:** (S1)
- Create: `scripts/check-ui-debt.ts`, `scripts/ui-debt-rows.ts`, `scripts/__tests__/check-ui-debt.test.ts`, `ui-debt-baseline.json`
- Edit: `package.json` (`check:ui-debt`), `scripts/gate.ts` + `scripts/__tests__/gate.test.ts` (one gate), `.github/workflows/ci.yml` (one step), `src/index.css` (`@theme` block, scrims, glass, alias), `src/components/shared/sphereTint.ts` (`glowShadow`) + its test, `Docs/design-system/tokens.md`, `Docs/canon/verification-gates.md`, `Docs/design-system/laws.md` § Enforcement

The S2 and S3 coordination blocks are on their own tickets (filed at handoff, each citing this doc). In short:

- **S2** is mutex with THR-1819 and THR-1820 on `src/components/shared/Modal.tsx` (all three edit it; one at a time, whichever lands second rebases). It **blocks THR-1880**, which needs `Overlay` — THR-1880's blocker moves from THR-1821 to the S2 ticket at handoff, because THR-1821 closes on S1. Parallel-safe with THR-1881: S2 edits no part of `GameView.tsx`.
- **S3** is parallel-safe with S2: it does not edit `Modal.tsx` or `Card.tsx` (their close glyphs move to `Icon` in THR-1879's sweep). It is mutex with THR-1879's execution on `src/data/icons/iconRegistry.ts`, which S3 creates and THR-1879 fills — S3 first. Parallel-safe with THR-1881 (no `GameView.tsx` edit).

## Notes for the executor

- **The ratchet is a floor, not a cleanup.** S1 changes no surface to lower a number. Lowering counts is the slices' and the touching tickets' work.
- **Re-measure before committing the baseline**, and compare with § rows. A big difference means a detector differs from the spec; fix the detector (with a fixture) rather than accepting the number.
- **Keep the row list as data** in `ui-debt-rows.ts`, importable without side effects. The entry guard idiom (`import.meta.url === argv[1]`) works here because the script is not esbuild-bundled; if it ever is bundled, move the pure half out first (the chip ratchet's lesson).
- **Do not add the sister rows on your own initiative.** `literal-font-size`, `modal-maxwidth`, `graph-query-in-ui` and `graph-write-in-ui` are registered by THR-1819, THR-1820 and THR-1822 with their own plan docs' definitions; the reference counts here are for cross-checking only. **One exception:** THR-1819's plan (§ 11) says that if it executes before S1 lands it posts its row's spec as a comment on THR-1821 for S1's executor to register. Read THR-1821's comments at claim; register any sister row posted there, with a re-measured baseline, and say so in the PR.
- **`HexMapV2/**/*.ts` is excluded from the colour rows only** — its `.tsx` HTML overlays still count, and it is in scope for every other row.
- **Tailwind v4 `@theme static`:** check the built CSS for the variables. Do not fire the kill criterion because `rounded-panel` has no rule while nothing uses it — Tailwind only generates used utilities.
- **Do not touch `.claude/skills/`** for the gate list; `npm run gate` picks the gate up from `scripts/gate.ts`, and the canon doc is the place that names it.
- Close keyword only in the S1 closing commit and PR body (`Fixes THR-1821`), never in a slice ticket's PR for another slice.

## Decisions taken in this session

Technical *how* of an agreed outcome (process.md rule 4), each open to Christian's veto:

1. **The ratchet counts 13 rows now** (THR-1821's four from the brief, split where the number reads better — two colour rows, two glyph rows — plus lucide from THR-1834, the three type rows THR-1833 assigned here, Escape listeners for the THR-1816 class, and radius and shadow rows so the new tokens are enforced). Sister rows join with their tickets.
2. **The ratchet fails on any row going up, by total;** raising a ceiling needs `--allow-increase=<row>`; a halving is suspect.
3. **Radius and shadow come in four levels — page, panel, control, chip — in rem,** defined once in Tailwind's `@theme static` so both CSS variables and utilities exist.
4. **`Card` stays, as the titled `Panel`;** a bounded surface is a Panel, a playing card is `CardFace`.
5. **Tabs are never gold** — the lens ruling, applied to every tab row.
6. **Chip is one component whose role decides what it must carry;** zero counts render nothing; opening a count never clears it.
7. **Icon is registry data plus one resolver;** a meaning-bearing icon cannot be unlabelled; the credit list is generated from the vendored set. **Split with THR-1879:** this plan ships the primitive, the registry format, `fallback` and `ICON_CREDITS`; THR-1879 vendors the carved shapes (places included, per THR-1834's amendment; the map's place textures move onto them in THR-1879 or THR-1878, whichever owns the map markers), writes the credits line (in the same PR as the first shape), fills the concept → shape table and sets the legacy sweep order.
8. **Each surface moves once (with THR-1880):** S2 leaves the six dialogs THR-1880 owns alone and only swaps the Escape listeners it must; the Divine Court and the Codex are dialogs, not ceremonies.
9. **Count chips always show their number,** even at 1 — THR-1834's rule that an icon in a chip carries a word or a count.
10. **Three tickets:** S1 is this ticket; S2 Overlay + Panel and S3 Icon + Chip + Tabs follow, all on this plan doc.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14. The auditors read revision 2; the two notes they raised (glass blur budget, Vision citations) are answered in the NFP table row 7 and § Vision audit. Revisions 3–5 narrowed S3's live migrations, added the count chip's badge form and a debug reader, and folded in THR-1834's amendment (places carved); none adds an engine pillar, a tunable without a constant, or a player-facing premise, so the verdicts below were not re-run.*

*Intent-judge (opus, cold context): Revise (rev 1, 2, 3) → Allow (rev 4) → Escalate (rev 5: the places amendment was not yet recorded where the judge could read it) → Allow (rev 5, once THR-1834's "Places carved" comment and PR #2379 were cited). Impact class External.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | The Constants table names radii, shadows, scrims, `GLASS_BLUR_PX`, `Z_BAND`, `ICON_SIZE_REM`, `TAB_UNDERLINE_PX` and the ratchet thresholds. "Rows are data." |
| 2. Inspectability | PASS | `getEscapeLayers()` returns labelled layers, topmost first. Roots carry `data-overlay-band`, `data-panel-level`, `data-chip-role` and `data-icon`. The ratchet prints per-row totals and the files that grew. The Wiring table marks the engine columns N/A with a reason. |
| 3. Determinism | PASS | "No randomness anywhere; the ratchet sorts its output and baseline keys." |
| 4. Fail-soft | PASS | The Fail-soft table covers an unknown icon (`fallback` plus one warning), a dead identity ref (plain text), a count of 0 or less (renders nothing) and a throwing `onClose` (caught). The gate returns `unverifiable` and exits 1. |
| 5. Narrative over mechanical | PASS | "this plan adds no new player-facing sentence." State chips carry "the word always". Tabs are "Never gold". |
| 6. Additive over destructive | PASS-with-note | Props, z constants and the `--panel-radius` alias are preserved. `Modal` is re-based, the `Tooltip` and `Dropdown` Escape listeners are replaced, and the `Card` `raised` background changes. These are refactors of shared files, guarded by a kill criterion. |
| 7. Performance budget | PASS-with-note | "parses ~400 files in about a second" and "no render work beyond the markup they replace" are asserted, not profiled. The 10px backdrop blur on `material="glass"` over the WebGL map is not budgeted. Registry cost across `Tooltip`'s 71 importers is not budgeted either. |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | N/A-with-rationale | Header and § Engine pillar both say no tick work, graph change or engine read. The view-model seam is deferred to THR-1822. |
| Content | present-and-substantive | The plan owns the icon registry format, the `ICON_CREDITS` generator, the concept-class `Record` rule and the family-per-class table. The shipped data is seed-only (`place-*` names and `fallback`). The vendored subset is explicitly THR-1879's. |
| UI | present-and-substantive | Covers tokens, Overlay, Panel, Tabs, Chip, Icon, styleguide sections, UI Laws engaged, a player-facing text table with PC-n classes, a playtest predicate, debug reads and a ratchet spec. Event notifications and Visual presence are N/A with reasons. |

**Missing required sections:** No missing required sections. Two notes: the template's literal `### Player-facing display` subsection has no heading (its substance sits in the per-primitive subsections); `## Forked-audit verdicts` was an empty placeholder, which the template marks optional.

**Wiring check:** A module-level Wiring table, an Interface impact table and gate/CI wiring are present, and the engine columns are marked N/A with a stated reason.

**Substrate check:** N/A (no Engine pillar).

PILLAR AUDIT: PASS-with-notes

### Vision audit

1. **Vision premises touched** — `02-non-negotiables.md` → "Narrative over mechanical perfection" — silent (matched only in the NFP table). The plan's Vision section invokes "always dark" and "gold means important" and says both are kept, without a Vision file citation; they are kept in practice (tabs never gold; the gold count chip only for the god's attention) — extended, since the plan applies them to new primitives. `00-north-star.md`, `01-core-loop.md`, `03-design-tensions.md`, `taste-profile.md` → not referenced.
2. **Vision contradictions** — No contradictions found.
3. **Qualitative checks** — North star: not engaged (changes how surfaces are built, not what the game shows or means). Core loop: untouched. Non-negotiables: no breach. Design tensions: not engaged. Taste profile: no entries cited or updated; icon and type direction come from Christian's THR-1834 and THR-1833 rulings.

VISION AUDIT: PASS-with-notes — a process and library plan with no player-facing mechanics; its Vision claims were asserted without a file citation.
