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
| `--text-muted` | `#7a6e60` | Hints, placeholders, disabled |

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
| `--border-accent` | `#d4a04025` | Gold-tinted borders for special panels |

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

---

## Shadows & Glows

| Use case | Value |
|----------|-------|
| Floating panel (e.g. portal dropdown) | `box-shadow: 0 8px 32px rgba(0,0,0,0.6)` |
| Elevated card | `box-shadow: 0 4px 16px rgba(0,0,0,0.4)` |
| Sphere pulse glow | `box-shadow: 0 0 12px 4px var(--sphere-color)` |
| Gold focus ring | `outline: 2px solid var(--accent-gold-dim); outline-offset: -2px` |

---

## Forbidden Patterns

- ❌ Hardcoded hex colors in components (e.g. `color: '#d4a040'`) — use tokens
- ❌ Hardcoded pixel sizes for layout (e.g. `width: '280px'`) — use `var(--sidebar-width)`
- ❌ Sub-`--text-xs` font sizes in UI (e.g. `font-size: 0.65rem`) — badges/labels minimum `--text-xs`
- ❌ `background: white` or any light background
- ❌ Using `--accent-gold` for every heading — gold means important, use sparingly
