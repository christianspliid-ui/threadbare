# Typography

**Read this when:** choosing font sizes, font families, heading levels, or text treatment for any UI element.

---

## Font Families

| Token | Family | Use |
|-------|--------|-----|
| `--font-display` | `'Cinzel', serif` | Headings, panel titles, names of significance, top bar identity |
| `--font-body` | `'Alegreya Sans', 'Segoe UI', system-ui, sans-serif` | All body text, labels, values, metadata |

**Rule:** Use `--font-display` only for titles and headings that carry narrative weight. UI labels, numbers, and status text always use `--font-body`. Never use a third font family.

**Note:** `Design/style-tile.html` currently loads Inter — this is wrong. The style tile should use Cinzel + Alegreya Sans. Fix in next style tile update.

---

## Type Scale

All sizes are absolute (rem-based). At 1920×1080 viewing distance these are comfortably readable. Do not scale with viewport — legibility is the goal, not proportional scaling.

| Token | Value | Pixels | Use |
|-------|-------|--------|-----|
| `--text-xs` | `1rem` | 16px | **Minimum size.** Labels, metadata, secondary values, badges |
| `--text-sm` | `1.0625rem` | 17px | Secondary body text, top bar chips, agent names in lists |
| `--text-base` | `1.125rem` | 18px | Primary body text, descriptions, chronicle prose |
| `--text-lg` | `1.3125rem` | 21px | Section headings, panel sub-titles |
| `--text-xl` | `1.625rem` | 26px | Panel titles, major headings |
| `--text-2xl` | `1.9375rem` | 31px | Page-level titles (setup screens, overlays) |

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
- Prose body: `--text-base`, `--font-body`, `line-height: 1.7`
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
