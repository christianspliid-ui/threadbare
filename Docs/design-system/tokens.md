# Design Tokens

**Read this when:** choosing colors, borders, shadows, spacing, or any visual property. Always use tokens — never hardcode hex values or pixel sizes in components.

Ground truth: `src/index.css` `:root` block. This file documents intent and usage; the CSS is authoritative.

---

## Background Layers

Dark surfaces from deepest to most raised. Use in order — never skip layers.

| Token | Value | Use |
|-------|-------|-----|
| `--bg-abyss` | `#0a0a0e` | Page background, fullscreen overlays |
| `--bg-deep` | `#111114` | Top bar, sidebar backgrounds |
| `--bg-surface` | `#1a1a1f` | Cards, panels |
| `--bg-raised` | `#222228` | Rows, chips, interactive elements at rest |
| `--bg-hover` | `#2a2a32` | Hover state for interactive elements |

**Rule:** Never use a layer above `--bg-surface` for static non-interactive chrome. Never use a value darker than `--bg-abyss`.

---

## Text Hierarchy

| Token | Value | Use |
|-------|-------|-----|
| `--text-primary` | `#e8dcc8` | Main content, names, values |
| `--text-secondary` | `#c8b89a` | Supporting info, subtitles |
| `--text-tertiary` | `#a89880` | Labels, metadata, section headers |
| `--text-muted` | `#9a8e7e` | Hints, placeholders, disabled — dim but readable, WCAG AA on `--bg-abyss` |

**Rule:** Never use a custom color for text outside these four. For emphasis use `--text-primary` + display font, not a brighter color.

---

## Accent — Gold

The single accent color. Used sparingly — gold means "important" or "active."

| Token | Value | Use |
|-------|-------|-----|
| `--accent-gold` | `#d4a040` | Active states, selected items, headings |
| `--accent-gold-dim` | `#d4a04060` | Subtle gold — borders, icons at rest |
| `--accent-gold-glow` | `#d4a04030` | Background tint for active elements |

**Rule:** Do not use gold for every heading — only for the primary identity element per panel. Overusing gold kills the emphasis.

---

## Sphere Colors

Each sphere has a base color and a bright variant. Used for sphere-specific UI elements (chips, dots, borders on agent cards).

| Sphere | Base | Bright | Use |
|--------|------|--------|-----|
| Force | `#ff4444` | `#ff6b6b` | Agent dots, sphere chips |
| Matter | `#8b6b4a` | `#a8886a` | |
| Energy | `#ffd700` | `#ffe44d` | |
| Life | `#00cc55` | `#33ff77` | |
| Mind | `#2288ff` | `#44aaff` | |
| Spirit | `#aa44dd` | `#cc66ff` | |
| Time | `#ff9933` | `#ffb355` | |
| Entropy | `#5a8a7a` | `#7aaa9a` | |
| Order | `#d4af37` | `#e8c860` | |
| Chaos | `#8a8a8e` | `#aaaaae` | |
| Light | `#ffeb99` | `#fff5cc` | |
| Darkness | `#4a3a8a` | `#6a5aaa` | |

**Rule:** Pass sphere color as a CSS custom property (`--sphere-color: <hex>`) on the element, then reference it. Never hardcode sphere hex values in components — look them up from `src/data/sphereColors.ts` or the `archetype.sphereAlignment`.

---

## Borders

| Token | Value | Use |
|-------|-------|-----|
| `--border-subtle` | `#2a2520` | Default panel/card borders |
| `--border-medium` | `#3a3530` | Stronger separation, hover borders |
| `--border-accent` | `#d4a04040` | Gold-tinted borders for special panels |

---

## Semantic Colors

| Token | Value | Use |
|-------|-------|-----|
| `--positive` | `#4ade80` | Gains, success, upward trends |
| `--negative` | `#f87171` | Losses, danger, downward trends |
| `--warning` | `#fbbf24` | Caution, approaching limits |

---

## Persistence / Badge Colors

| Token | Use |
|-------|-----|
| `--badge-permanent` / `--badge-permanent-bg` | Permanent attachments |
| `--badge-temporal` / `--badge-temporal-bg` | Temporary conditions |
| `--badge-divine` / `--badge-divine-bg` | Divine/magical elements |

---

## Spacing Grid

4px base. Always use these — never use arbitrary pixel values.

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px | Micro gaps, icon margins |
| `--space-2` | 8px | Tight spacing within elements |
| `--space-3` | 12px | Gap between related items |
| `--space-4` | 16px | Standard gap / panel padding |
| `--space-5` | 20px | Comfortable spacing |
| `--space-6` | 24px | Section separation |
| `--space-8` | 32px | Large separation, between panels |
| `--space-ceremonial` | 20px | Vertical rhythm between `RevealCard` zones (THR-799) |

`--space-ceremonial` shares 20px with `--space-5` today but is deliberately its own
token: ceremonial surfaces get retuned as a group, independently of the general
spacing grid. Use it only inside ceremonial surfaces; use `--space-5` everywhere else.

---

## Layout tokens (THR-1819)

The 1440p layout contract. **Frame** tokens are px and restated per tier in `index.css`'s `@media (min-width: 1920px | 2560px | 3440px)` blocks; **text-container** tokens are rem, declared once, and follow the root step-up (`html { font-size: 112.5% }` at ≥2560×1200). Mirrored in `src/components/shared/layoutContract.ts` and locked by `layoutContract.test.ts`. Full table with sources: `layout.md`.

| Token | 1920×1080 | 2560×1440 | Use |
|-------|-----------|-----------|-----|
| `--topbar-height` | 48px | 56px | Top bar |
| `--rail-left-w` | 320px | 400px | God rail (`AscendantBar`) |
| `--rail-right-w` | 340px | 420px | Ledger rail (`GameView` right column) |
| `--rail-strip-w` | 56px | 56px | A folded rail |
| `--inspector-w` / `--inspector-wide-w` | 560 / 960px | 717 / 1280px | Inspector docked / wide (THR-1827) |
| `--stage-window-w` / `--stage-left-col-w` | 280 / 340px | 520 / 560px | The Stage (THR-1829); 3440 window 1400px |
| `--tooltip-max-w` | 17.5rem = 280px | 315px | `Tooltip` |
| `--hovercard-w` | 26.25rem = 420px | 472.5px | `HoverCard` |
| `--toast-w` | 20rem = 320px | 360px | `ToastStack` |
| `--measure-prose` | 34em = 680px | 765px | Story-column measure |
| `--modal-max-h` | 85vh | 85vh | Every dialog (Law 33) |

### Dialog sizes (THR-1820)

Every dialog picks one of four tiers — never a free width (Law 57). S and M are text containers (rem, declared once, step with the root); L and XL are frame-scale (px, restated per tier). A panel's width is `min(var(--dialog-<t>-w), calc(100vw - 2 * var(--dialog-gutter)))`; its max height is `--modal-max-h` (85vh), and XL is fixed at that height. Mirrored in `dialogSize.ts` (fallbacks) and `layoutContract.ts` (parity test).

| Token | 1920×1080 | 2560×1440 | 3440×1440 | Holds |
|-------|-----------|-----------|-----------|-------|
| `--dialog-s-w` | 37.5rem = 600px | 675px | 675px | **S** — one message or one decision: notices, receipts, reveals, short forms |
| `--dialog-m-w` | 60rem = 960px | 1080px | 1080px | **M** — one column of structured content: a ladder, a clock, a row of up to four cards |
| `--dialog-l-w` | 1280px | 1600px | 1600px | **L** — a subject beside its record, in `SheetColumns` |
| `--dialog-xl-w` | 1760px | 2240px | 2880px | **XL** — a work surface with its own panes |
| `--dialog-gutter` | 24px | 32px | 32px | Least space between a panel and the viewport edge |
| `--sheet-aside-w` / `--sheet-gap` | 400 / 24px | 480 / 28px | 480 / 28px | `SheetColumns` left column and gap |

- **API:** `<Modal size="s|m|l|xl">` (default S); `<RevealCard size>` forwards it; an owner-drawn panel on an `Overlay` uses `dialogSizeStyle(tier)`. `maxWidth` is deprecated and counted by the UI-debt ratchet row `modal-maxwidth` (floor 0 once THR-1827 / THR-1829 retire the last free-width surfaces).
- **Choosing:** by what the content is. Step up a tier before you fold a list; fold only at the largest tier the surface's job allows.
- **Machine check:** `await window.__DEBUG.getDialogSizes()` — `scrollingBelowCap` empty on every open dialog. Registry: `DIALOG_SIZE_SURFACES` in `src/components/shared/dialogSize.ts`.

---

## Ceremonial Utilities (THR-799)

Two classes carrying the ceremonial presentation tier. Both are additive — no
existing rule was modified and `.quote-block` is untouched.

| Class | Declaration | Use |
|-------|-------------|-----|
| `.inset-well` | `background: rgba(10,10,14,0.55)`; `1px solid var(--border-subtle)`; `var(--panel-radius)`; `box-shadow: inset 0 1px 3px rgba(0,0,0,0.4)` | The third depth level (frame > card body > well). Banner bands and quote wells. |
| `.frame-ceremonial` | `border: 1px solid var(--border-gold)` + `outline: 1px solid var(--border-subtle); outline-offset: -4px` | The double frame on a ceremonial panel. The inner hairline is drawn with a negative outline offset, so it needs no extra element. |

**Gold budget.** `.frame-ceremonial`'s border is dim-gold *structure*, not emphasis.
On any ceremonial surface exactly one element carries bright `--accent-gold`: the
hero `Medallion` ring. Titles stay `--text-primary`.

---

## Dialogue Contexts (THR-1586)

Each kind of moment gets its own colour family, so the colour of a dialog tells
the player what kind of moment it is before they read a word. Reference surfaces
stay neutral so that signal keeps its meaning (Law 30, amended 2026-10-02).

| Context | The player is… | Surfaces | Tokens |
|---|---|---|---|
| Divine will | steering a mortal | `PremonitionModal` | `--premonition-whisper-*` / `--premonition-compulsion-*` (own palette) |
| Encounter | watching fate resolve a step | `EncounterVeil` | `--veil-*` (own palette) |
| Story | reading a story beat | `StoryBeatModal`, `AscendantBeatModal`, `JourneyVignetteModal` | `--dialog-story-*` — hearth umber, terracotta-amber accent |
| Elder | forced to choose by an elder power | `EmergenceDilemmaModal` | `--dialog-elder-*` — verdigris |
| Gain | receiving the god's act | `DivineReceiptModal`, `MomentCard` | `--dialog-gain-*` — dark gilt; accent is `--veil-gold-rgb` |
| Information | consulting a reference | sheets, `EventPopup`, Omen/Mandate/Doom, settings | neutral `--bg-*` ramp |

**Mechanism.** `<Modal context="story">` applies `.dialog-ctx-story`, which sets
local `--dlg-bg`, `--dlg-text`, `--dlg-text-dim`, `--dlg-accent`, `--dlg-accent-text`,
`--dlg-rule`, `--dlg-border` and `--dlg-inset`. The panel and anything inside it
read them with the neutral value as fallback (`var(--dlg-accent-text, var(--accent-gold))`),
so a modal with no context is unchanged. The registry is
`src/components/shared/dialogContext.ts`; `__DEBUG.getDialogContexts()` reads it.

**Shared alphas.** `--dialog-text-dim-alpha` 0.75, `--dialog-accent-text-alpha` 0.8,
`--dialog-accent-rule-alpha` 0.35, `--dialog-accent-border-alpha` 0.4; inset boxes use
`--dialog-inset` (black at 0.22 — they darken the ground, never lighten it).

**Contrast.** Every tone clears AA on both stops of every ground, including the
neutral `--text-*` and `--accent-gold` tokens children keep using; the ratios sit
beside each token in `index.css` and are locked by `dialogContextTokens.test.ts`.

**State keeps its colour.** Step dots, selected options and outcome-band accents stay
on `--accent-gold` / polarity tokens on any ground — only decoration (eyebrow, rule,
edge, ground) takes the context hue. On a gain ground the gold accent appears only at
rule / edge / accent-text alphas; the single full-gold element stays what it was.

**Sphere tint.** The Premonition's per-option recipe lives in
`src/components/shared/sphereTint.ts` (border 25% · ground 3% · text 87% via
`color-mix`). `CardFace` takes `sphereTint` when a card draws essence from a named
sphere and tints its *resting* edge and ground from `--sphere-<name>-bright`;
selected, resolved and disabled cards keep their own border, and the price is never
tinted. Tinted cards carry `data-sphere-tint`.

---

## Radius by hierarchy (THR-1821)

Four levels, named for what the thing **is** in the hierarchy, not for its size. Declared in a Tailwind v4 `@theme static` block right after `@import "tailwindcss"` in `src/index.css`, so both `var(--radius-panel)` and the utility `rounded-panel` are sanctioned forms. `static` emits every variable whether or not a utility uses it (most primitives read the tokens through inline `var()` styles); Tailwind still generates a utility only when a class uses it.

| Level | What it is | Token | Value (1080p) |
|---|---|---|---|
| page | a dialog panel, the Stage panel, the Inspector in Full | `--radius-page` | `0.75rem` (12 px) |
| panel | rails, the Inspector docked/wide, cards, popovers, the lens legend | `--radius-panel` | `0.5rem` (8 px) |
| control | buttons, tabs, rows, inputs, insets inside a panel | `--radius-control` | `0.25rem` (4 px) |
| chip | chips and pills | `--radius-chip` | `999px` |

- **rem, not px,** for the three radii, so they step up with the root at ≥ 2560 like everything else.
- **Circles and squares are shapes, not radii:** `50%` and `0` (and `rounded-full` / `rounded-none`) stay free.
- `--panel-radius` stays as an alias of `--radius-panel`, so existing readers keep working.
- The `radius-literal` row of `npm run check:ui-debt` counts every other radius; it may only go down.

---

## Shadows & Glows

Shadows follow the same four levels (THR-1821), in the same `@theme static` block — `var(--shadow-panel)` or `shadow-panel`:

| Level | Token | Value |
|---|---|---|
| page | `--shadow-page` | `0 8px 32px rgb(0 0 0 / 0.6)` |
| panel | `--shadow-panel` | `0 4px 16px rgb(0 0 0 / 0.4)` |
| control | `--shadow-control` | `0 2px 8px rgb(0 0 0 / 0.5)` — only for controls floating on the map canvas |
| chip | `--shadow-chip` | `none` — chips are flat |

**Tinted glows** (sphere and gold halos) go through one helper, `glowShadow(color, strength)` in `src/components/shared/sphereTint.ts`: `0 0 <blur>px color-mix(in srgb, <color> <pct>%, transparent)`. Strengths are named constants: `soft` = `GLOW_SOFT_BLUR_PX` 8 / `GLOW_SOFT_PCT` 38, `strong` = `GLOW_STRONG_BLUR_PX` 20 / `GLOW_STRONG_PCT` 60. The `shadow-literal` row of `npm run check:ui-debt` counts every shadow that is not a token, `none` or a `glowShadow()` call.

| Use case | Value |
|----------|-------|
| Gold focus ring | `outline: 2px solid var(--accent-gold-dim); outline-offset: -2px` |

## Scrims and glass (THR-1821)

| Token | Value | Use |
|---|---|---|
| `--scrim-dim` | `rgb(0 0 0 / 0.6)` | the backdrop behind a dialog (Modal's) |
| `--scrim-heavy` | `rgb(0 0 0 / 0.8)` | the backdrop behind a full-screen ceremony (HarvestScreen, WarmStart) |
| `--bg-glass` | `rgb(17 17 20 / 0.72)` | a glass panel over the map (Card's glass material), with a 10 px backdrop blur |

---

## Forbidden Patterns

- ❌ Hardcoded hex colors in components (e.g. `color: '#d4a040'`) — use tokens
- ❌ Hardcoded pixel sizes for layout (e.g. `width: '280px'`) — use the layout tokens (`var(--rail-right-w)`, `var(--rail-left-w)`, `var(--tooltip-max-w)` …; § Layout tokens)
- ❌ Sub-`--text-xs` font sizes in UI (e.g. `font-size: 0.65rem`) — badges/labels minimum `--text-xs`
- ❌ `background: white` or any light background
- ❌ Using `--accent-gold` for every heading — gold means important, use sparingly
