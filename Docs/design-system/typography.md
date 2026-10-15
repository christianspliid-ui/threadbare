# Typography

**Read this when:** choosing font sizes, font families, heading levels, or text treatment for any UI element.

Source of the rules: [THR-1833](https://linear.app/threadbare/issue/THR-1833) (decision record `Docs/audits/2026-10-13-thr-1833-type-system-decision.md`), shipped by [THR-1879](https://linear.app/threadbare/issue/THR-1879) S1 (`Docs/plans/2026-10-14-thr-1879-type-and-icons-rollout.md` § 1–3). The steps are THR-1819's (§ Type Scale below).

---

## Faces and roles

Three faces, one job each. **One face per role; never a fourth.**

| Token | Face | Role | Where |
|-------|------|------|-------|
| `--font-display` | Cinzel 600 (variable) | **Names and titles at 22 px and up only** | Screen and dialog titles, the god's name, the encounter / Stage title, a card name on a full card face, the Inspector page title, realm names on the map while they render at 22 px or larger |
| `--font-prose` | Alegreya 400 / 400 italic / 500–900 | **Story** | Encounter step prose, afterimages (italic), aftermath prose, chronicle entries, the land page lede, Codex body, card flavour (italic), premonitions, ceremony narration |
| `--font-body` | Alegreya Sans 400 / 500 / 700 / 800 | **Everything the player operates** | Labels, values, buttons, choices and their effect lines, card rules text, hand rows, tooltips, chips, lists, the top bar, map place names |

- **A name below 22 px is Alegreya Sans 700**, not small Cinzel (`CINZEL_MIN_PX` = 22). Inside story prose a name stays in Alegreya and takes weight 500 or 700, so it reads as a link (Law 21).
- **Italics belong to the story face.** Alegreya Sans italic stays shipped for existing uses; no new UI text takes it.
- `--font-prose` is `'Alegreya', Georgia, 'Times New Roman', serif` — Georgia is only the fallback.
- The font files ship in `public/fonts/` (latin subsets from Google Fonts' css2 API; no CDN link, no runtime fetch). All three families are SIL OFL 1.1 with no Reserved Font Name (`public/fonts/OFL.txt`); the start page's Credits carries the Fonts line.
- **The ratchet** (`npm run check:ui-debt`): `font-face-literal` counts a face named outside the tokens; `display-face-small` counts a style block that sets the display face below `--text-lg` (THR-1879).

### The shorthands (`src/index.css`)

| Token | Value | Use |
|-------|-------|-----|
| `--type-body-prose` | `400 var(--text-base)/1.6 var(--font-prose)` | Story prose |
| `--type-flavor` | `italic 400 var(--text-base)/1.6 var(--font-prose)` | Afterimages, card flavour, italic story lines |
| `--type-section-label` | `700 var(--text-xs)/1.2 var(--font-body)` | Small labels (the label rule) |
| `--type-body` / `--type-body-small` | `400 var(--text-sm)/1.4` · `400 var(--text-xs)/1.4`, on `--font-body` | UI body text |
| `--type-display-*` | Cinzel at `--text-lg` and up | Titles |

**Story vs. not story.** A site set in the serif is either story (it uses `font: var(--type-body-prose)` or `var(--type-flavor)`, taking the face, `--text-base` and line-height 1.6 together) or not story (a caption, a label, a counter, a button word: it uses `--font-body`, and the label rule if it is a label). Ceremony display lines (the large prompts of Meet the First and the Remembrance) keep their own larger sizes in the story face.

---

## The label rule

Small labels are **Alegreya Sans 700, sentence case, tertiary text colour, at the 16 px floor, letter-spacing 0** (THR-1833 call 2, confirmed by Christian 2026-10-14). Big titles keep Cinzel's carved capitals, and only at 22 px and up.

- **Sentence case is written in the string, never produced by a transform.** `text-transform: uppercase` and `capitalize` are not substitutes, and a helper that lower-cases strings would break proper nouns. Strings from data keys go through the display vocabularies (Law 14).
- The shared label homes follow it: `.section-heading` (tertiary), `.section-heading-gold` (the gold ornamental variant), `.topbar-section-label`, `.quote-block .quote-attr`, `.subloc-badge`, `.avail-label`, and `--type-section-label`.
- The remaining capital labels on kept surfaces are THR-1905's sweep; the `uppercase` ratchet row only goes down.

---

## Numbers

- **Tabular lining figures** (`--figures-tabular`: `lining-nums tabular-nums`) wherever numbers line up or tick: counts, costs, dates, clocks, any column. Use the `.figures-tabular` class, or `fontVariantNumeric: 'var(--figures-tabular)'` inline.
- **Proportional figures** everywhere else, including inside prose.
- **No monospace on any player surface.** Debug, CMS, the style guide and the UL viewer keep it. The `monospace` ratchet row only goes down.

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


## Letter spacing

| Use | Value |
|-----|-------|
| Cinzel titles | `0.02em` (set on `h1–h6` globally) — the only tracked text |
| Labels | `0` (the label rule) |
| Body and prose | `0` (default) |

---

## Line height

| Use | Value |
|-----|-------|
| Story prose (`--type-body-prose`, `--type-flavor`) | `1.6` |
| UI labels and chips | `1.2` |
| List items and UI body | `1.4` |
| Headings | `1.1` |

---

## Do not

- ❌ Font sizes below `--text-xs` (16 px) anywhere
- ❌ Cinzel below 22 px, for body text, or for labels
- ❌ ALL CAPS or letter-spaced labels — write the label in sentence case
- ❌ Monospace on a player surface
- ❌ Italics for status or system text — italics belong to the story face
- ❌ A fourth face, or a face named outside the tokens
