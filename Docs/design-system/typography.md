# Typography

**Read this when:** choosing font sizes, font families, heading levels, or text treatment for any UI element.

---

## Font Families

| Token | Family | Use |
|-------|--------|-----|
| `--font-display` | `'Cinzel', serif` | Headings, panel titles, names of significance, top bar identity |
| `--font-body` | `'Alegreya Sans', 'Segoe UI', system-ui, sans-serif` | All body text, labels, values, metadata |

**Rule:** Use `--font-display` only for titles and headings that carry narrative weight. UI labels, numbers, and status text always use `--font-body`. Never use a third font family.

---

## Type Scale

Six steps, rem-based (THR-1819). No two adjacent steps are closer than 2px at 1080p. There is **one root step and no fluid type**: at 2560×1440 (≥2560 wide and ≥1200 tall) `html { font-size: 112.5% }` makes the root 18px, so every rem size scales ×1.125. The TS mirror is `TYPE_SCALE_REM` in `src/components/shared/layoutContract.ts`; `layoutContract.test.ts` locks parity and the step rules.

| Token | Value | 1920×1080 | 2560×1440 | Use (sizes only) |
|-------|-------|--------|--------|-----|
| `--text-xs` | `1rem` | 16px | 18px | **The floor.** Labels, metadata, chips, tooltips, captions |
| `--text-sm` | `1.125rem` | 18px | 20.25px | **UI text.** Values, rows, buttons, choices, card rules, the top bar. The body default |
| `--text-base` | `1.25rem` | 20px | 22.5px | **Story prose**: steps, afterimages, chronicle, land-page prose. One step above UI text |
| `--text-lg` | `1.375rem` | 22px | 24.75px | Section headings; **the smallest size Cinzel may take** (THR-1833) |
| `--text-xl` | `1.625rem` | 26px | 29.25px | Panel and dialog titles |
| `--text-2xl` | `2rem` | 32px | 36px | Screen titles, the Inspector page title |

- **The body default is `--text-sm` (18px).** Text with no explicit size reads as UI text.
- **Story prose** runs at `--text-base` with line-height **1.6** (`--type-body-prose`, `--type-flavor`), capped at `--measure-prose` (34em: 680px at 1080p).
- **Not on the scale:** `em`/`%` sizes (relative to text already on it), named px constants (HexMapV2 map labels by zoom band, THR-1831), SVG `fontSize=` attributes. Tailwind sizes above `text-2xl` fall through to Tailwind's defaults and are off-scale. `--text-2xs` is **not** defined — the nine references to it are counted as literal-size debt, not aliased.
- **Faces and roles** (which face, which case) are the type-and-icons plan doc's (THR-1879; THR-1833 feeds). This section sets sizes only.

**Rule:** `--text-xs` (16px) is the absolute minimum for any text in the game UI. The historical `0.65rem` (~10px) sizes in badges must be replaced — see `components.md §Badges`.

---

## Text Usage by Context

### Top Bar
- Identity chip name: `--text-sm`, `--font-display`, `--text-primary`
- Identity chip subtitle: `--text-xs`, `--font-body`, `--text-muted`
- Resource values: `--text-sm`, `--font-body`, monospace preferred, `--text-primary`
- Income/delta: `--text-xs`, `--font-body`, `--positive` or `--negative`
- Season/year: `--text-sm`, `--font-body`, `--text-secondary`
- Button icons: inherits, no explicit font size needed

### Sidebar Panels
- Panel title (e.g. "RETINUE (3)"): `--text-xs`, `--font-display`, uppercase, `--text-tertiary`, letter-spacing 0.12em
- Agent name: `--text-sm`, `--font-body`, `--text-primary`
- Agent location/status: `--text-xs`, `--font-body`, `--text-tertiary`
- Section heading: `.section-heading` utility class

### Agent Info Card (Tier 2)
- Agent name: `--text-xl`, `--font-display`, `--text-primary`
- Domain labels: `--text-xs`, uppercase, `--text-tertiary`
- Domain values: `--text-sm`, `--font-body`, `--text-secondary`

### HexChronicle
- Region name / breadcrumb: `--text-lg`, `--font-display`
- Chronicle section header: `--text-xs`, uppercase, `--text-tertiary`
- Prose body: `--text-base`, `--font-body`, `line-height: 1.6`, max-width `--measure-prose`
- Location/agent name inline: `--text-sm`, `--font-display`, `--text-primary`

### Overlays (ScryOverlay, StrandView, AgentProfileModal)
- Overlay title: `--text-xl` or `--text-2xl`, `--font-display`
- Body: `--text-base`, `--font-body`

---

## Letter Spacing

| Use | Value |
|-----|-------|
| Display headings (Cinzel) | `0.04em` (set on `h1–h6` globally) |
| Section labels (uppercase small) | `0.12em` |
| Normal body text | `0` (default) |
| Monospace numbers | `0` (default) |

---

## Line Height

| Use | Value |
|-----|-------|
| Body prose | `1.7` |
| UI labels and chips | `1.2` |
| List items | `1.4` |
| Headings | `1.1` |

---

## Do Not

- ❌ Use font sizes below `--text-xs` (16px) anywhere
- ❌ Use Cinzel for body text or labels — reserved for titles only
- ❌ Use bold Alegreya Sans at `--text-xs` — too heavy at small sizes; use normal weight
- ❌ ALL CAPS on body text — only on `.section-heading` labels
- ❌ Italics for status/system text — italics reserved for narrative/flavor text
