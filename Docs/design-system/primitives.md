# UI Primitives — Component Library Specification

**Read this when:** building new UI, adopting primitives in existing components, or deciding which primitive to use for a given UI need.

This file is the **spec** for the shared component library in `src/components/shared/`. Each primitive has a fixed API. Agents must use these primitives instead of writing one-off button/card/modal/list implementations.

---

## Inventory

**Every** `.tsx` in `src/components/shared/` is a shared primitive and appears below — one row each,
no exceptions. `src/components/StyleGuide/__tests__/styleguideSync.test.ts` fails when a primitive
is missing a row here, a row in `component-selection.md`, or a `?view=styleguide` entry, so this
table cannot drift from the library (UI Law 29, THR-1011).

Read a row as: what it is, the props that decide its shape, and where to *look* at it. The detailed
specs further down cover the ten primitives with fixed contracts worth stating at length; the rest
are specified by this table plus their styleguide entry.

| Primitive | Props surface | Sizes / variants / states | Styleguide |
|-----------|---------------|---------------------------|-----------|
| `ActivityIcon` | `kind`, `size?`, `color?` | 6 kinds: `boot`, `swords`, `coin`, `hammer`, `bandage`, `hourglass`. One vocabulary per element class (Law 9). | [#section-activityicon](../../src/components/StyleGuide/StyleGuide.tsx) |
| `AnimateMount` | `show`, `animation`, `duration?`, `children` | Mount/unmount wrapper. Collapses to a plain fade under `prefers-reduced-motion` (Law 44). | #section-animatemount |
| `Button` | `variant`, `size?`, `icon?`, `loading?`, `fullWidth?` | 4 variants (primary, secondary, ghost, danger) × 3 sizes. `loading` implies disabled. All six interaction states. | #section-buttons |
| `Card` | `variant?`, `padding?`, `title`, `count?`, `onBack?`, `trailing?`, `scroll?` | **The titled panel** (THR-1884): `Panel level="panel"` plus `.Header`, `.Body`, `.Footer`. Variants surface → panel, raised → panel + floating, glass → panel + glass. Never nest `Card` in `Card`. | #section-panel-card |
| `CardKeywordChip` | `keyword`, `icon?`, `muted?` | Glyph keyed on the live card-type union — a new type without an icon is a **build failure** (Law 9). | #section-card-keyword-chip |
| `CardFace` | `model: CardFaceModel`, `designerView`, `onToggle` | **The** card face — every card in the game renders through it (Law 28). Ten zones in one reading order: picture band, kind chips, name, alternate costs, provenance, effect line + odds, spacer, rarity, resolved band, blocked reason. Numerals live only in `designerLine` (Law 13); the price is framed and the odds are not (Law 10) — `odds.kind: 'delta'` draws pips for a card that *moves* the odds, `'forecast'` draws the tier word for one that *rolls* them. | #section-card-face |
| `Divider` | `gold?` | Plain rule; gold variant for primary separations. | #section-divider |
| `DomainCard` | `reach`, `tier`, `agentName`, `gender?`, `revealed` | Reach art + tier prose. `revealed: false` renders the unknown state, not a blank. | #section-domaincard |
| `ReachStanding` | `reach`, `tier`, `revealed?`, `layout?` (`stacked`/`inline`), `nameColor?`, `wordColor?`, `nameTooltip?` | Reach name · rank word · five magnitude dots — the sheet's readout (THR-1724). Tier clamps to 0–4; unrevealed shows `???` and no dots. | #section-reachstanding |
| `Dropdown` | `trigger`, `open`, `onOpenChange`, `align?` | Portal-based (`Z_BAND.menu`). Compound: `.Item`. Outside-click close; Escape closes the menu alone through the escape registry (THR-1884). | #section-dropdown |
| `EntityLink` | `id`, `name`, `entityRef?`, `onOpenEntity?` (deprecated) | A named entity inside prose. With an `entityRef` it routes itself by kind through `useRefRouter` — hover opens a `HoverCard` after a dwell, click opens the card (THR-1490) — and reads as plain text where no router is in scope (Laws 21, 25). Lifted out of `ChapterView` by THR-1298. | #section-entity-link |
| `HeldByLine` | `holder`, `graph?`, `onOpenFaction?` | Whose writ runs over a place — the holder's sigil, the one `ui.held_by` tooltip and a door to its sheet; renders *Unclaimed* in words for ground no faction holds (Law 4). One line for the location profile and the hex chronicle, on the `controls` edges the political border is projected from (THR-1155). | #section-held-by-line |
| `EntityVisual` | `size`, `descriptor?`, `entity?`, `graph?`, `shape?`, `onClick?` | **The one art path** (Law 3). `hero` 16:9 · `portrait` 3:4 · `chip` 40px. Missing art → authored glyph on id-hashed gradient (Law 4). Person art knowledge-gated, fail-open (Law 8). | #section-entity-visual |
| `FlavorQuote` | `children?`, `attribution?`, `divider?` | Inset quote well. Renders **nothing** when empty — safe to leave unconditional. | #section-flavorquote |
| `GameErrorBoundary` | `children` | Error fallback. Wrap any subtree that might crash (NFP #4). Used around every styleguide sample. | used throughout |
| `IconButton` | `icon`, `badge?`, `active?`, `size?`, `variant?` | 32×32 icon-only. Badge slot for counts: a numeric `badge` (with `badgeOf`) renders `Chip role="count" form="badge"`, nothing at zero (THR-1885). ≥24px hit area regardless of visual size (Law 46). | #section-iconbutton |
| `Icon` | `name`, `size?` (`floor`/`chip`/`list`/`alone`), `decorative` **or** `label`, `tooltipId?` | **THR-1834's carved family behind one primitive** (THR-1885). Shape from the one resolver `iconShape.ts` (Law 3) reading `src/data/icons/iconRegistry.ts` — path data, never components. 14 / 18 / 24 / 34 px at 1080p, rem. Fills `currentColor`. An unknown name draws the `fallback` mark and warns once (Law 4). | #section-icon |
| `Chip` | `role` (`identity`/`state`/`count`/`keyword`) + that role's props, `size?` (`sm` 1.5rem / `md` 2rem) | **One chip, four roles** (THR-1885). identity: `target`, `label`, `visual?` — routes through `useRefRouterContext` (Law 21). state: `label` always, `icon?`, `tint?`, `magnitude?`. count: `count`, `of`, and `icon` + `label` in the full form, or `form="badge"` / `"inline"` on a control that already speaks; zero renders nothing; opening never clears it (Law 40). keyword: `keyword`, `pressed?`/`onToggle?`. `data-chip-role` (+ `data-count`, `data-count-of`) on the root. | #section-chip |
| `Tabs` | `kind?` (`tabs`/`toggle`), `value`/`defaultValue`, `onChange`, `label`, `allowNone?` (toggle); children `Tabs.Tab` (`value`, `label`, `icon?`, `keyCap?`, `count?`) and `Tabs.Panel` | **One tab bar, and the same bar as a toggle row** (THR-1885). tabs = WAI-ARIA tablist with roving tabindex, arrows/Home/End; toggle = toolbar, `aria-pressed`, at most one. Underline in `--text-primary`, never gold; min height 2.5rem (Law 46). Unknown value → first tab, one warning. | #section-tabs |
| `ListRow` | `accentColor?`, `selected?`, `onClick?`, `trailing?` | Compound: `.Title`, `.Subtitle`, `.Leading`. The universal selectable row. | #section-listrow |
| `Medallion` | `size?`, `accentColor?`, `title?`, `children?` | Ringed clipping disc, sm 40 / md 64 / lg 96. **Frames** an already-resolved visual — never a second art path. | #section-medallion |
| `Modal` | `open`, `onClose`, `size?`, `maxWidth?` (deprecated), `animation?`, `zIndex?`, `closeOnEscape?`, `context?` | **An `Overlay` whose surface is a floating `page` panel** (THR-1884). Compound: `.Header`, `.Body`, `.Footer`. Width = its size tier `s · m · l · xl` (THR-1820, default S; `tokens.md` § Dialog sizes), max-height `var(--modal-max-h)` = 85vh (Law 33). Escape closes topmost; focus moves in and returns (Law 50). | #section-modal |
| `Overlay` | `open`, `onClose`, `label`, `band?`, `backdrop?`, `placement?`, `inset?`, `modal?`, `closeOnEscape?`, `closeOnBackdrop?`, `animation?` | **The one backdrop, z-band and Escape implementation** (THR-1884). Portal; band by name from `zBands.ts` (Law 35); backdrops dim / heavy / void / none; Escape through `useEscapeLayer` with its `label` (Law 23); focus through `useDialogFocus` (Law 50). Sizes nothing. | #section-overlay |
| `Panel` | `level?` (`page`/`panel`/`inset`), `floating?`, `material?` (`solid`/`glass`), `as?`, `padding?`, `context?` | **The one surface shell, by hierarchy level** (THR-1884). Radius and shadow from the level tokens; page ⊃ panel ⊃ inset, a wrong nesting warns once in dev. Never caps height or scrolls. | #section-panel-card |
| `OddsPips` / `CostPips` | `value` / `cost`, `size?`, `muted?`, `emphasised?`, `framed?` | The only sanctioned magnitude glyph language (Law 15). Odds = effect on odds; cost = framed badge, deliberately distinct (Law 10). `aria-label` states the reading in words. | #section-odds-pips |
| `DeltaCluster` | `direction`, `count`, `label`, `color?`, `size?` | THR-1082 — how much a *state* changed, on the aftermath's consequence chips. Triangles (`▲`/`▼`, the encounter hand's own family), 1–3, or a gold `◆` for a way opening, which has no scale. Distinct from `OddsPips` by Law 10: pips mean effect on the odds, these mean realised change. `label` is the whole reading in words and becomes the `aria-label` (Law 11). | #section-delta-cluster |
| `ProgressBand` | `label`, `value`, `prose?`, `color?` | Banded readout — use when the reading is a **word**, not a fraction. | #section-progressband |
| `ProgressBar` | `progress`, `color`, `glow?` | Continuous 0–1 only. Discrete steps use `StepDots`. | #section-progressbar |
| `RarityBadge` | `tier`, `opacity?` | Inline rarity tag. | #section-rarity |
| `RarityBorderBox` | `tier`, `children` | Left-border rarity accent. Wraps anything. | #section-rarity |
| `RevealCard` | `open`, `onClose`, `size?` (default S) | Ceremonial reveal, composed on `Modal`. Inside an existing modal use `RevealCard.Frame` — `<RevealCard>` portals its own backdrop. | #section-revealcard |
| `RivalIcon` | `spheres`, `size?`, `title?` | Overlapping sphere circles for rival affinity. | #section-rivalicon |
| `HoverCard` | `page`, `anchorEl` | Law 20 Tier 1½ (THR-1490): header + `HOVER_CARD_MAX_SECTIONS` sections, anchored beside an `EntityLink` after `HOVER_CARD_DELAY_MS`. Never stacks, never interactive. | #section-detail-page |
| `Section` | `section` (`ProseSection \| ChipsSection \| EventCardSection \| PanelSection \| PortraitSection \| TriggersSection`) | **The one section model** — `EntityCard`, the rival one, retired into it (THR-1492). Dispatches on `kind`. Gold label = primary; `notable`/`chronicle` tiers add a gold underline. Chips take an optional `glyph` and `dataKey`; `triggers` renders firing chance as pips (Law 15). Exports `SectionLabel` for sheets that label their own JSX. Mounted (THR-1490). | #section-detail-page |
| `SectionHeading` | `children`, `count?`, `as?`, `ornamental?` | Heading with optional count and ornamental rules. | #section-sectionheading |
| `SphereIcon` | `sphere?`, `sphereName?`, `size?`, `monochrome?`, `useImage?`, `variant?` | SVG primary, PNG fallback. The sphere vocabulary (Law 9). | #section-spheres |
| `StepDots` | `totalSteps`, `currentStepIndex`, `size?`, `variant?` | Discrete steps. No-op replay dots render **disabled, not clickable** (Law 25, THR-1003). | #section-stepdots |
| `Tooltip` | `id?`, `label?`, `desc?`, `depth?`, `as?`, `focusable?` | Tier 1 of the disclosure ladder. Copy resolves through `resolveTooltip`, ≤200 chars, chains to `TOOLTIP_MAX_CHAIN_DEPTH` (Laws 17–19). Components pass **ids**, never inline copy. The trigger is keyboard-reachable by default — see `interactions.md` § Tooltip Pattern for the predicate and the one caller override. | #section-tooltip |

> **The detail-page cluster is the Inspector (THR-1876; THR-1912 deleted `DetailModal` and
> `DetailBreadcrumb`).** `Section` renders every page's sections inside `InspectorPage`,
> and `HoverCard` is the glance before it. Reach them through `useRefRouter().open(ref)` —
> the router is the only thing permitted to open a subject, because Law 21's "the link routes
> by kind" is a property of having one dispatcher, not of each caller getting it right.
>
> The general warning that outlived the specific one: a styleguide entry is **not** evidence
> a surface is reachable. Check importers before building on one.

Build order among the original seven still matters — later primitives depend on earlier ones:
```
SectionHeading → Button → IconButton → ListRow → Card → Modal → Dropdown
```

---

## 1. SectionHeading

**Replaces:** `.section-heading` CSS class used with raw `<div>` or `<h3>` elements across all panels.

### API

```tsx
interface SectionHeadingProps {
  children: React.ReactNode;       // Label text (e.g. "Retinue")
  count?: number;                  // Optional count badge (e.g. 3) → renders as "(3)"
  as?: 'h2' | 'h3' | 'h4' | 'div'; // HTML element, default 'h3'
}
```

### Render

```html
<h3 class="section-heading">RETINUE (3)</h3>
```

### Styling
- Font: `--font-display`
- Size: `--text-xs`
- Weight: 700
- Color: `--text-tertiary`
- Transform: uppercase
- Letter-spacing: 0.12em

### Rules
- Always renders uppercase — never pass pre-uppercased text
- Count renders in parentheses, same style as label
- No margin — parent controls spacing

---

## 2. Button

**Replaces:** 50+ one-off `<button>` implementations with inline styles and manual hover handlers.

### API

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';      // default 'md'
  icon?: React.ReactNode;           // Leading icon (SphereIcon, emoji span, etc.)
  loading?: boolean;                 // Shows breathe animation, disables click
  fullWidth?: boolean;               // width: 100%
}
```

### Variants

| Variant | Background | Border | Text | Use |
|---------|-----------|--------|------|-----|
| `primary` | `--accent-gold` | none | `--bg-abyss` | Confirm, primary actions |
| `secondary` | `--bg-raised` | `--border-subtle` | `--text-primary` | Cancel, navigation, default |
| `ghost` | transparent | transparent | `--text-muted` | Tertiary actions, close buttons |
| `danger` | `--negative` at 15% | `--negative` at 25% | `--negative` | Destructive actions |

### Sizes

| Size | Height | Padding (x) | Font size |
|------|--------|-------------|-----------|
| `sm` | 28px | 8px | `--text-xs` |
| `md` | 36px | 12px | `--text-sm` |
| `lg` | 44px | 16px | `--text-base` |

### States
- **Hover:** Brightness shift (primary: darken 10%, secondary: `--bg-hover`, ghost: `--bg-hover`)
- **Active:** `scale(0.98)` transform
- **Disabled:** `opacity: 0.4`, `cursor: not-allowed`, no hover
- **Focus-visible:** `outline: 2px solid var(--accent-gold-dim)`, `outline-offset: -2px`
- **Loading:** Content replaced with `.animate-breathe` opacity pulse, pointer-events disabled

### Render

```tsx
<Button variant="primary" size="lg" icon={<SphereIcon sphereName="force" />}>
  Confirm Intervention
</Button>

<Button variant="secondary" onClick={onCancel}>Cancel</Button>

<Button variant="ghost" size="sm" icon={<span>×</span>} aria-label="Close" />
```

### Rules
- Icon-only buttons (no children) **must** have `aria-label`
- `primary` variant used maximum once per visible panel (it's the main CTA)
- Never set `style={{}}` on a Button — use variants. If a new variant is needed, add it to the component, don't inline styles.
- Transitions: `background-color`, `border-color`, `color`, `transform` — all at `--anim-fast`

---

## 3. IconButton

**Replaces:** Top bar icon buttons (⚔, ⚙), close buttons, eye icons, and any 32×32 tap target.

### API

```tsx
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;             // Emoji, SphereIcon, or SVG
  badge?: number | string;           // Superscript badge (e.g. rival count)
  active?: boolean;                  // Gold active state
  size?: 'sm' | 'md';               // 'sm' = 28px, 'md' = 32px (default)
  variant?: 'default' | 'close';    // 'close' = circular, muted
}
```

### Styling

**Default:**
- Size: 32×32 (md) or 28×28 (sm)
- Background: transparent
- Border: `1px solid var(--border-subtle)`
- Color: `--text-muted`
- Radius: 4px
- Hover: `--bg-hover`, `--text-primary`
- Active prop: `--accent-gold` color, `--accent-gold-glow` background, `--accent-gold-dim` border

**Close variant:**
- Circular (border-radius: 50%)
- Background: `rgba(10, 10, 14, 0.6)`
- No border
- Color: `--text-tertiary`
- Hover: `--text-primary`

**Badge:**
- Position: absolute top-right
- Font: monospace, `var(--text-xs)` (`IconButton.tsx` — no sub-floor exception; the typography floor holds for badges too)
- Color: inherits from icon state or `--negative` if icon has hostile context

### Rules
- Always provide `aria-label` or `title`
- Badge is decorative (aria-hidden), the `aria-label` should include the count (e.g. "3 Rival Gods")

---

## 4. ListRow

**Replaces:** RetinuePanel rows, AttachmentRows, LocationCard rows, RivalPanel rows, EncounterLog rows.

### API

```tsx
interface ListRowProps {
  accentColor?: string;              // 3px left border color (sphere/tier)
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  trailing?: React.ReactNode;        // Right-side element (IconButton, badge, etc.)
  children: React.ReactNode;         // Row content
  className?: string;
}

// Compound components
ListRow.Title    // Primary text (--text-sm, --text-primary, truncate)
ListRow.Subtitle // Secondary text (--text-xs, --text-tertiary, truncate)
ListRow.Leading  // Left element (avatar pip, icon, sphere dot)
```

### Render

```tsx
<ListRow
  accentColor="#ff4444"
  selected={selectedId === agent.id}
  onClick={() => onSelect(agent.id)}
  trailing={<IconButton icon="👁" size="sm" onClick={() => onZoom(agent.locationId)} />}
>
  <ListRow.Leading>
    <div className="pip" style={{ background: '#ff4444' }}>Fe</div>
  </ListRow.Leading>
  <ListRow.Title>Fen</ListRow.Title>
  <ListRow.Subtitle>The Shattered Sanctum</ListRow.Subtitle>
</ListRow>
```

### Styling
- Base: `.interactive-row` CSS class (already exists in index.css)
- Padding: `0.625rem 0.75rem`
- Border-radius: `0.375rem`
- Left accent: `borderLeft: 3px solid ${accentColor}` when provided
- Selected: `--accent-gold-glow` background, `--border-accent` border
- Hover: `--bg-hover` via `onMouseEnter`/`onMouseLeave` (style mutation pattern, per `interactions.md`)
- Trailing element: opacity 0 at rest, opacity 1 on row hover
- Keyboard: `role="button"`, `tabIndex={0}`, Enter/Space fires onClick
- Click propagation: trailing element uses `e.stopPropagation()`

### Rules
- Title always truncates (never wraps)
- Subtitle always truncates
- Max one trailing element per row
- If row has `onClick`, it must have `role="button"` and keyboard handler

---

## 5. Card

**Replaces:** Scattered inline panel/card styling across sidebar panels, info cards, and floating panels.

**Since THR-1884 Card is the titled `Panel`:** `<Panel level="panel">` plus the header, body and
footer below. A bounded surface is a `Panel`; a bounded surface with a title row is a `Card`; a
playing card is `CardFace`.

### API

```tsx
interface CardProps {
  variant?: 'surface' | 'raised' | 'glass';  // default 'surface'
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Compound components
Card.Header   // { title: string; count?: number; onBack?: () => void; trailing?: ReactNode }
Card.Body     // { children: ReactNode; scroll?: boolean }  — scroll adds overflow-y-auto
Card.Footer   // { children: ReactNode }  — right-aligned button row
```

### Variants

| Variant | Panel | Background | Shadow | Use |
|---------|-------|-----------|--------|-----|
| `surface` | `panel` | `--bg-surface` | none | Default cards, info panels |
| `raised` | `panel` + `floating` | `--bg-surface` | `--shadow-panel` | Popovers, elevated cards |
| `glass` | `panel` + `material="glass"` | `--bg-glass` + 10 px blur | none | Small panels over the map canvas |

### Card.Header Render

```tsx
<Card.Header title="Agent Detail" onBack={handleBack} trailing={<IconButton icon="⚙" />} />
```

Renders:
```html
<div class="card-header">
  <button class="back-btn">← Back</button>
  <SectionHeading>Agent Detail</SectionHeading>
  <div class="trailing">⚙</div>
</div>
```

### Styling
- Padding: `--panel-padding`
- Radius: `--radius-panel` (through `Panel`)
- Card.Header: flex row, `border-bottom: 1px solid var(--border-subtle)`
- Card.Body: padding `--panel-padding`, optional `overflow-y: auto`
- Card.Footer: padding `--panel-padding`, flex row, `gap: var(--space-2)`, `justify-content: flex-end`

### Rules
- Card.Header is optional — not every card needs a header
- Card.Body scroll should only be true for sidebar-height panels
- Never nest Card inside Card

---

## 6. Modal

**Replaces:** Duplicate backdrop+panel+escape logic in AgendaPicker, InterventionConfirm, EventPopup, AgentProfileModal.

### API

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: 's' | 'm' | 'l' | 'xl';      // THR-1820 size tier, default 's' (tokens.md § Dialog sizes)
  /** @deprecated THR-1820 — free width, counted by the UI-debt ratchet row `modal-maxwidth`; drawn only when `size` is absent. */
  maxWidth?: number;
  animation?: 'anim-fade' | 'anim-fade-up';  // default 'anim-fade-up'
  children: React.ReactNode;
}

// Compound components
Modal.Header  // { children: ReactNode }  — title bar with auto close button
Modal.Body    // { children: ReactNode }  — scrollable content area
Modal.Footer  // { children: ReactNode }  — button row
```

### Behavior
- **Re-based on `Overlay` + `Panel` (THR-1884):** `<Overlay band="modal" backdrop="dim" placement="top">`
  whose surface is drawn with `panelStyle('page', { floating: true })`. Props unchanged.
- Portals to `document.body`; backdrop `--scrim-dim` at `Z_BAND.modal` (60), or
  `modalAboveInterrupt` (65) through the `zIndex` prop
- Panel: width from the `size` tier — `min(var(--dialog-<t>-w), 100vw − 2 × --dialog-gutter)` — and `max-height: var(--modal-max-h)` (85vh — Law 33, one rule); XL also fixes its height at the cap. `data-dialog-size` on the panel (`free` on the deprecated `maxWidth` path). `overflow-y: auto` on Body, which scrolls only once the panel is at its cap (Law 57)
- Provides `SheetLayoutContext`: `'two'` at L and XL, `'one'` at S and M — `SheetColumns` reads it
- Both `size` and `maxWidth` passed → `size` wins, one dev warning; an unknown `size` draws as S
- Escape closes the topmost surface only, through the escape registry (THR-1816)
- Backdrop click closes (with `e.stopPropagation()` on panel)
- `aria-modal="true"`, `role="dialog"`
- Focus moves in on open, Tab is trapped, focus returns to the invoker on close (Law 50, `useDialogFocus`)

### Render

```tsx
<Modal open={showConfirm} onClose={handleCancel} size="s">
  <Modal.Header>Confirm Intervention</Modal.Header>
  <Modal.Body>
    <p>Spend 4.2 Force essence to inspire Fen?</p>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
    <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
  </Modal.Footer>
</Modal>
```

### Styling
- The `page` level of `Panel`: background `var(--dlg-bg, linear-gradient(180deg, var(--bg-deep), var(--bg-abyss)))`,
  border `var(--dlg-border, var(--border-gold))`, radius `var(--radius-page)`, shadow `var(--shadow-page)`
- Modal.Header: `--font-display`, `--text-lg`, border-bottom, close IconButton auto-appended
- Modal.Footer: flex row, `gap: var(--space-2)`, children right-aligned

### Rules
- Only one modal open at a time — opening a new one should close the previous
- Every dialog picks a size tier by what its content is (S one message, M one structured column, L a subject beside its record in `SheetColumns`, XL a work surface) — never a free width. Step up a tier before you fold a list (Law 57). The machine check is `await window.__DEBUG.getDialogSizes()`: `scrollingBelowCap` empty on every open dialog
- Modal.Header always includes a close button (auto-rendered by Modal.Header)
- Buttons in footer: cancel on left, primary action on right

---

## 7. Dropdown

**Replaces:** Manual portal+positioning+outside-click logic in RivalsButton, MandateTracker popover.

### API

```tsx
interface DropdownProps {
  trigger: React.ReactElement;        // Usually an IconButton
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'left' | 'right';         // default 'right' (aligned to right edge of trigger)
  children: React.ReactNode;
}

// Compound component
Dropdown.Item  // { children: ReactNode; onClick?: () => void }
```

### Behavior
- Portals to `document.body`
- Position: `fixed`, calculated from trigger `getBoundingClientRect()`
- Appears below trigger with 4px gap
- Align: right edge of dropdown aligns with right edge of trigger (default)
- Outside-click closes (event listener on `document`)
- Escape closes
- z-index: 9999 (portal, above everything)
- Entry animation: `anim-fade-down`

### Render

```tsx
<Dropdown
  trigger={<IconButton icon="⚔" badge={3} />}
  open={rivalsOpen}
  onOpenChange={setRivalsOpen}
>
  <SectionHeading>Rival Gods</SectionHeading>
  <Dropdown.Item onClick={() => selectRival('veiled')}>
    <ListRow accentColor="#aa44dd">
      <ListRow.Title>The Veiled Prophet</ListRow.Title>
      <ListRow.Subtitle>expansionist</ListRow.Subtitle>
    </ListRow>
  </Dropdown.Item>
</Dropdown>
```

### Styling
- Panel: `width: 260px` (or auto based on content, min 200px, max 320px)
- Background: `linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))`
- Border: `1px solid var(--border-subtle)`
- Radius: `var(--panel-radius)`
- Shadow: `0 8px 32px rgba(0,0,0,0.6)`
- Padding: `var(--panel-padding)`

### Dropdown.Item
- Extends `.interactive-row` styling
- Hover: `--bg-hover`
- Padding: `0.5rem 0.75rem`
- Can contain any content (text, ListRow, custom layout)

### Rules
- Trigger must be a single element (usually IconButton)
- Dropdown never exceeds viewport — clamp position if near edges
- Close on item click by default (Dropdown.Item calls `onOpenChange(false)` after onClick)
- Outside-click listener attached only while open, cleaned up on close

---

## 8. Medallion (THR-799)

**Replaces:** Ad-hoc circular icon treatments in sidebars and reveal surfaces.

### API

```tsx
interface MedallionProps {
  size?: 'sm' | 'md' | 'lg';   // 40 / 64 / 96 px — MEDALLION_SIZE_SM/_MD/_LG
  accentColor?: string;        // ring color; default dim gold, `lg` defaults to --accent-gold
  title?: string;              // accessible label + hover title
  children?: React.ReactNode;  // the already-resolved visual
}
```

### Render
Three layers: outer ring (`MEDALLION_RING_WIDTH` 2px) → `MEDALLION_RING_GAP` (3px) of `--bg-abyss` → content disc (`--bg-deep`) that clips its child with `overflow: hidden; border-radius: 50%`.

### Rules
- **Medallion frames, it does not resolve.** The child is whatever the existing path already produced — `SphereIcon`, a THR-637 `EntityVisual`, a codex glyph, an `<img>`. Never add a second art-resolution path inside it.
- No child → `MEDALLION_FALLBACK_GLYPH` (`✦`), never an empty disc.
- `lg` is the hero size and carries the surface's **single** bright-gold element (gold budget). Use `sm`/`md` for chips and headers.

---

## 9. FlavorQuote (THR-799)

**Replaces:** Ad-hoc uses of the `.quote-block` class. The class stays for its existing callers — adoption is additive.

### API

```tsx
interface FlavorQuoteProps {
  children?: React.ReactNode;
  attribution?: string;   // right-aligned source line
  divider?: boolean;      // ornamental ✦ divider, default true
}
```

### Render
`.inset-well` panel → optional centered `✦` divider flanked by gold hairlines → quote in `--type-flavor` → right-aligned attribution in `--text-xs` / `--text-tertiary`.

### Rules
- **Renders `null` when it has no children.** A missing prose field removes the zone; it never leaves an empty well.
- Narrative before mechanics — place the quote above effect/mechanical text, not below it.

---

## 10. RevealCard (THR-799)

The ceremonial presentation tier — between a toast and a full modal — for the moment a minor element enters a life (a trait revealed, a bond formed, a working learned).

**Composed on `Modal`.** It does not fork it: z-60, Escape/backdrop close, and the mount animation are all inherited. `.frame-ceremonial` rides on the panel via Modal's `panelClassName`.

### API

```tsx
<RevealCard open onClose size="s" aria-label>   // standalone modal (size forwards to Modal, default S)
<RevealCard.Frame>                                                      // zone stack, NO modal wrapper

RevealCard.Title         // { children }            — category line, letterspaced display caps
RevealCard.Medallion     // { accentColor, title, children } — hero slot, Medallion size="lg"
RevealCard.Banner        // { children }            — item name in a full-width .inset-well band
RevealCard.Body          // { children }            — free prose
RevealCard.Consequences  // { label, items: ConsequenceItem[] } — Medallion sm chips + Tooltip
RevealCard.Quote         // { children, attribution } — thin wrapper over FlavorQuote
RevealCard.Dismiss       // { label?, onClick }     — full-width Button variant="secondary"
```

### Rules
- **No nested modals.** A surface that is already a `Modal` embeds `RevealCard.Frame`, never `<RevealCard>` — two portals means two backdrops. `AscendantBeatModal` is the worked example.
- **Zone omission, not empty zones.** Every zone returns `null` on absent data. The reference card's quality comes from every *visible* zone being full; an empty `(0)` row reads worse than no row.
- **Gold budget — one bright gold per surface.** The hero medallion ring is it. `Title` is `--text-primary`; `.frame-ceremonial` and the rules are dim-gold *structure*.
- **`Dismiss` is `secondary`, deliberately.** A reveal has no competing action, so the quiet button reads calm. If a surface needs the player to *choose*, it is not a reveal — use `Modal`.
- Every consequence chip renders, wrapping onto further rows — no `+N` cut while the card can grow (Law 57, THR-1820). The label shows the same total the row shows.
- Chip labels are words, never numeric stats.

---

## 11. Overlay (THR-1884)

**Replaces:** seventeen hand-built full-screen layers at typed-in z-indexes, and eleven `document`
Escape listeners that each closed at the same time as whatever was above or below them (the
THR-1816 bug class).

```tsx
<Overlay
  open={open}
  onClose={close}                 // Escape and backdrop click route here
  label="Path codex"              // required: accessible name and escape-layer debug label
  band="modal"                    // 'focused' | 'stage' | 'modal' | 'modalAboveInterrupt'
  backdrop="dim"                  // 'dim' | 'heavy' | 'void' | 'none'
  placement="top"                 // 'top' (5vh) | 'center' | 'fill'
  inset="viewport"                // 'viewport' | 'belowTopBar' (the Stage, Law 52)
  modal                           // default true: focus trap + aria-modal
  closeOnEscape                   // default true; false registers no layer
  closeOnBackdrop                 // default true for dim/heavy, false for void/none
  animation="fade-up"             // 'fade' | 'fade-up' | 'none'; reduced motion → fade
>
  {children}
</Overlay>
```

- **Band** from `src/components/shared/zBands.ts` (`Z_BAND`), never a number (Law 35).
- **Escape** through `useEscapeLayer(open && closeOnEscape, onClose, Z_BAND[band], label)`: the topmost
  layer by band, then by registration, answers the key. `await window.__DEBUG.getEscapeLayers()` lists
  the open layers topmost first.
- **Backdrops:** `dim` = `--scrim-dim`; `heavy` = `--scrim-heavy`; `void` = `--bg-abyss` (the full-screen
  ceremony); `none` = transparent and pointer-transparent, unless `closeOnBackdrop` makes it an
  invisible click-catcher.
- **Homes:** a homed surface mounts `<Overlay {...surfaceHomeProps(kind)}>` (`shared/surfaceHomes.ts`),
  read from the one home list `HOMED_SURFACES`; `CEREMONY_SURFACES` is its ceremony half.
- **Not an Overlay but answers Escape** (tooltips, menus, map move mode, the armed card): register
  through `useEscapeLayer` with a named band and a label. A `document`/`window` Escape listener
  anywhere else is the `escape-listener` row of `npm run check:ui-debt`.
- Overlay sizes nothing: dialog sizes are `Modal`'s, and the Inspector and the Stage have their own geometry.

## 12. Panel (THR-1884)

```tsx
<Panel level="panel" floating material="solid" as="section" padding="standard">…</Panel>
```

| Level | Background | Border | Radius | Shadow |
|---|---|---|---|---|
| `page` | `--dlg-bg` → deep→abyss gradient | `--dlg-border` → `--border-gold` | `--radius-page` | `--shadow-page` when `floating` |
| `panel` | `--bg-surface` (glass: `--bg-glass` + 10 px blur) | `--border-subtle` | `--radius-panel` | `--shadow-panel` when `floating` |
| `inset` | `--bg-raised` | none | `--radius-control` | never |

- `floating` separates a popover or a dialog from an in-layout rail.
- Hierarchy page ⊃ panel ⊃ inset; a Panel at the same or a lower level than its parent warns once in dev.
- Panel never caps its height or scrolls: a panel grows to its size limit before it scrolls (THR-1820).
- `panelStyle(level, opts)` is the one copy of the look; `Modal` draws its surface with it.

## Usage Decision Tree

```
Need a clickable element?
├── Is it a primary/secondary/cancel action? → Button
├── Is it a small icon in a toolbar or header? → IconButton
├── Is it a row in a list? → ListRow (with onClick)
└── Is it a menu trigger? → IconButton + Dropdown

Need to display content?
├── Is it a titled panel with header? → Card
├── Is it a row in a list? → ListRow
├── Is it a section label? → SectionHeading
└── Is it a floating overlay? → Modal or Dropdown

Need to show/hide content?
├── Is it a dialog requiring a decision? → Modal
├── Is it presenting a minor element the player just gained? → RevealCard
│   └── ...inside a surface that is already a Modal? → RevealCard.Frame
├── Is it a menu appearing below a trigger? → Dropdown
└── Is it a slide-in panel? → AnimateMount (existing)

Need to frame an icon or a quote?
├── Circular icon with ring treatment? → Medallion
└── Flavor prose in a recessed well? → FlavorQuote
```

---

## Adoption Protocol

When replacing a one-off implementation with a primitive:

1. Read the existing component's props and behavior
2. Map to the primitive's API — if something doesn't fit, consider whether the primitive needs extending or the component has unnecessary complexity
3. Swap the implementation
4. Verify: visually identical before and after (use preview tool or manual check)
5. Run relevant tests — `npm test -- --run ComponentName`
6. If no tests exist for the component, add a basic render test

**Do not** change behavior during adoption. Adoption is a pure refactor — visual and functional parity.
