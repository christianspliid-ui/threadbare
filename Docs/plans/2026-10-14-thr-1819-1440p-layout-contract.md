> **title:** `The 1440p layout contract — scaling width tokens, a type scale with real steps, one 85vh rule — THR-1819`
> **linear_issue:** THR-1819
> **author:** `Claude Code (design session, Opus — spawned from the 2026-10-14 attended groundwork session)`
> **created:** 2026-10-14
> **three_pillars:** Engine `N/A — presentation only; no state, graph, tick or trace changes` · Content `N/A — no words change; sizes and widths only` · UI `done`

# The 1440p layout contract — THR-1819

*Every width, padding and type size the new frame, Inspector and Stage are built on gets one named value per screen tier, so 2560×1440 stops rendering a 1080p game in its top-left corner.*

## Why this is load-bearing

Christian, 2026-10-11 UI review: *"design primarily for minimum 1440p landscape"*. The wayfinder map [THR-1823](https://linear.app/threadbare/issue/THR-1823) records it as a standing preference: 2560×1440 landscape is the primary screen, 1920×1080 is the supported floor. Today only two things react to the screen: the top bar height and the right sidebar width (`src/index.css:349-370`). Everything else keeps its 1080p size. At 2560×1440 the map gets a wide area and the chrome reads small.

The four map decisions already fixed the numbers the new surfaces need: the god rail and Ledger rail ([THR-1828](https://linear.app/threadbare/issue/THR-1828)), the Inspector ([THR-1827](https://linear.app/threadbare/issue/THR-1827)), the Stage ([THR-1829](https://linear.app/threadbare/issue/THR-1829)) and the type roles ([THR-1833](https://linear.app/threadbare/issue/THR-1833)). Each one says "THR-1819 owns the token". This plan turns those numbers into tokens, sets the type scale and the root step-up, picks one modal height rule, and names a ratchet for literal font sizes. The frame, Inspector and Stage builds then start on these tokens from day one (groundwork brief, decision 10). [THR-1820](https://linear.app/threadbare/issue/THR-1820) (dialog tiers) is blocked on this plan and adds its tier tokens to the same pattern.

**Without it** every build invents its own widths again, the docs keep promising tokens that do not exist (`--bp-*` in `layout.md`; `--panel-padding` and `--topbar-padding-x` steps at 2560/3440 in `layout-zones.md`), and the 75vh/85vh split stays in four places.

## Settled input (not re-opened)

| Source | What it fixes here |
|---|---|
| Groundwork brief, attended session 2026-10-14 (Christian present; decisions under process.md rule 4, veto invited) | Screens: 2560×1440 primary, 1920×1080 floor, 3440 wide gets extra width only, below 1920 keeps today's behaviour. Three `min-width` blocks at 1920 / 2560 / 3440; `--bp-*` tokens retired for a TS module. Root 16 → 18 px at ≥ 2560. One modal height rule, 85vh. One ratchet script owned by THR-1821. Containers (Inspector, Stage) are not modal tiers. |
| [`Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md`](../audits/2026-10-12-thr-1828-screen-frame-decision.md) | Top bar 48 / 56 px; god rail 320 / 400; Ledger rail 340 / 420; fold strip 56; `FRAME_MAP_SHARE_MIN = 0.60`, `FRAME_MAP_SHARE_MIN_INSPECTOR = 0.45` at 1920×1080 and 2560×1440; the 16 px floor in the frame. |
| [`Docs/audits/2026-10-11-thr-1827-inspector-decision.md`](../audits/2026-10-11-thr-1827-inspector-decision.md) | Inspector docked ≈ 28vw = 560 / 717 px; wide ≈ 50vw = 960 / 1280 px; full at 2560 = 300 px trail + page + 440 px Connections column. |
| [`Docs/audits/2026-10-14-thr-1829-encounter-stage-decision.md`](../audits/2026-10-14-thr-1829-encounter-stage-decision.md) | `STAGE_WINDOW_PX` 280 / 520, `STAGE_LEFT_COL_PX` 340 / 560, compact tier ≈ 860 px, 24 px gutter. |
| [`Docs/audits/2026-10-13-thr-1833-type-system-decision.md`](../audits/2026-10-13-thr-1833-type-system-decision.md) | Cinzel at 22 px and up only; Alegreya prose; Alegreya Sans UI; 16 px floor; prose one step above UI text, about 19 px at 1080p, line-height 1.6, measure about 34em ("THR-1819 sets the exact steps"). |
| [`Docs/audits/2026-10-11-thr-1831-map-chrome-decision.md`](../audits/2026-10-11-thr-1831-map-chrome-decision.md) | Map labels are screen px stepped by zoom band (unaffected by the root step); the minimap opens at 1080p only if the canvas grows past ~1400 px. |

## Substrate inventory

No engine subsystem in `Docs/canon/systems-inventory.md` is touched. Every row below is a design-system substrate this plan extends. Nothing is built green-field beside it.

| Existing substrate | Status | This plan |
|---|---|---|
| `:root` token block + three `min-width` blocks (`src/index.css:37-370`) | 🟢 ACTIVE | **extends**: the type scale gets new values; layout tokens for the rails, strip, Inspector, Stage and text containers; the root step-up; `--modal-max-h` |
| `--sidebar-width` (one consumer, `GameView.tsx:6151`) | 🟢 ACTIVE | **replaces** with `--rail-right-w`; the old token is deleted in the same PR |
| `--topbar-height` / `--topbar-padding-x` / `--topbar-gap` / `--panel-padding` | 🟢 ACTIVE | **extends**: new 2560 values; doc-only promises retired |
| `Modal` primitive (`maxHeight: '75vh'`, `Modal.tsx:70`) | 🟢 ACTIVE, 29 importers | **extends**: reads `--modal-max-h` |
| `Tooltip` (`TOOLTIP_MAX_WIDTH = 280`, JS positioning) | 🟢 ACTIVE, 84 importers | **extends**: rem width through the layout module |
| `HoverCard` (`HOVER_CARD_W = 420`, JS positioning) | 🟢 ACTIVE | **extends**: rem width through the layout module |
| `ToastStack` (`maxWidth: '320px'`) | 🟢 ACTIVE | **extends**: reads `--toast-w` |
| `AscendantBar` (`.bar { width: 360px }`) | 🟢 ACTIVE (rebuilt later by the frame build, THR-1875) | **extends**: reads `--rail-left-w` |
| `SphereIcon.toPxNumber` (assumes 16 px per rem) | 🟢 ACTIVE | **extends**: reads the live root size |
| `index.css` parity-test pattern (`dialogContextTokens.test.ts`, `encounterVeilLaws.test.ts`) | 🟢 ACTIVE | **reuses** for the CSS ↔ TS parity test |
| `usePrefersReducedMotion` (`matchMedia` + fail-soft) | 🟢 ACTIVE | **pattern only**: the first build that needs the tier in JS copies it (not shipped here, so no dead hook) |

## Engine pillar

Engine: N/A — presentation only. No `GameState` field, graph node, edge, tick phase, trace or PRNG call is added, read differently or written.

## Content pillar

Content: N/A — no words change. Sizes and widths only; no prose, template or data table is touched.

## Interface impact

N/A — no subsystem in `Docs/canon/interface-map.md` is touched. Every change is inside `src/index.css`, `src/components/`, `src/types/tooltip.ts`, `src/types/detailPage.ts`, the debug bridge's read-only UI accessor, and docs. No cross-system read or write is added, extended or retired.

## UI pillar

*Screenshot tool: Playwright (DOM; every changed surface is DOM). The map canvas is only measured for width, never judged for paint, so Claude-in-Chrome is not needed.*

### 1. Screens and tiers

| Tier (`LayoutTier`) | Applies at | Designed? | What changes there |
|---|---|---|---|
| `base` | width < 1920 | No (brief: today's behaviour, no new work) | Pre-existing tokens keep today's defaults; new tokens take their 1920 value |
| `fhd` | width ≥ 1920 | **Yes, the supported floor (1920×1080)** | Frame widths at their 1080p values; root 16 px |
| `qhd` | width ≥ 2560 | **Yes, the primary screen (2560×1440)** | Frame widths at their 1440p values; root 18 px (see the height guard below) |
| `uwqhd` | width ≥ 3440 | Width only | Same type and panels as `qhd`; the extra width goes to the map and the Stage window |

**The root step-up.** `@media (min-width: 2560px) and (min-height: 1200px) { html { font-size: 112.5%; } }`. With the browser default of 16 px that gives 18 px. Everything in rem scales ×1.125: the type scale, Tailwind spacing, rem paddings, and the text-container widths below. Two implementation choices sit inside the brief's decision 3:

- **112.5%, not `18px`.** A player who raised the browser's default font size keeps that preference on top of the step.
- **The height guard (`min-height: 1200px`).** Every supported screen behaves exactly as the brief says: 2560×1440 and 3440×1440 step up; 1920×1080 does not. The guard catches one unsupported screen, the 2560×1080 ultrawide. Its pixels are as large as a 1080p screen's, and an 18 px root there would cost about 12% of 1080 px of height for type that is already large. The threshold sits below a windowed 1440p browser (inner height ≈ 1290–1330 px) and above any 1080p screen. The width tokens still follow width alone.

**OS scaling and browser zoom.** Tiers read CSS pixels. A 1440p monitor at 125% Windows scaling reports 2048×1152 and lands in `fhd`; browser zoom at 150% on 2560 reports 1707 and lands in `base`. That is the player's own enlargement, and the game honours it.

### 2. What today has (measured on `main` @ `3cf81086`)

| Fact | Evidence |
|---|---|
| Type scale 16 / 17 / 18 / 21 / 26 / 31 px; xs, sm and base are 1 px apart; no root step | `src/index.css:50-55` |
| Usage: `--text-xs` 1,000 `var()` + 246 Tailwind `text-xs`; `--text-sm` 200 + 114; `--text-base` 56 + 2; `--text-lg` 26 + 10; `--text-xl` 7 + 5; `--text-2xl` 3 + 8 | grep over `src` |
| The project's `:root --text-*` override Tailwind v4's theme variables (no `@theme` block), so `text-sm` etc. already follow the scale | `src/index.css:30,50-55`; Tailwind 4.2 |
| `--text-2xs` is referenced 9 times on player surfaces and defined nowhere (`CardFace` falls back to 11 px; the rest inherit) | `CardFace.tsx:669,708,766`; `NudgeStageHeader.tsx:191,257,394,439`; `EncounterVeil.tsx:1253`; `DeltaCluster.tsx:149` |
| Only the top bar (44/48/52) and `--sidebar-width` (280/360/400/420) step; `--panel-padding` steps at 1920 only | `src/index.css:309-370` |
| Fixed widths: AscendantBar 360, detail column `clamp(240px, 280px, 30vw)`, HexSidebar 220/60, SettingsPanel 280, CodexSidebar 240, Tooltip 280, HoverCard 420, Toast 320, DebugPanel 480 | `ascendant-bar/styles.module.css:7`; `GameView.tsx:6093`; `HexSidebar.tsx:145`; `SettingsPanel.tsx:144`; `CodexSidebar.tsx:23`; `types/tooltip.ts:39`; `types/detailPage.ts:72`; `ToastStack.tsx:95`; `debugPanelStyles.ts:11` |
| Modal height: `Modal.tsx:70` and `SCRY_PANEL_MAX_HEIGHT` say 75vh; `ChoiceSetModal`, `SettingsPanel`, `DetailModal` say 85vh; Law 33 says 85vh | `Modal.tsx:70`; `ScryOverlay.tsx:527`; `ChoiceSetModal.tsx:81`; `SettingsPanel.tsx:145`; `DetailModal.tsx:283`; `laws.md:84` |
| Docs that say 75vh | `CLAUDE.md:45`; `component-selection.md:66,251`; `layout-zones.md:100`; `primitives.md:42,354`; `Docs/ops/dev-quickstart.md:95`; `.claude/skills/frontend-ui/SKILL.md:108,179`; `StyleGuide.tsx:725` |
| JS that assumes 16 px per rem | `SphereIcon.tsx:52` (`px * 16`) |
| Map share today at 1920×1080 (rails 360 + 360): 1200 × 1032 = **59.7%**, already under the frame's 0.60 floor | arithmetic below |

### 3. The type scale

Six steps. No two adjacent steps are closer than 2 px at 1080p (2.25 px at 1440p). The names stay, so the ~1,700 existing references need no edit. Three values move.

| Token | rem | 1920×1080 (root 16) | 2560×1440 (root 18) | Today | Role (sizes only; faces are THR-1833 / THR-1879) |
|---|---|---|---|---|---|
| `--text-xs` | 1 | **16** | 18 | 16 | **The floor.** Labels, metadata, chips, tooltips, captions (their face and case are THR-1833's, rolled out by THR-1879) |
| `--text-sm` | 1.125 | **18** | 20.25 | 17 | **UI text.** Values, rows, buttons, choices, card rules, the top bar. The body default |
| `--text-base` | 1.25 | **20** | 22.5 | 18 | **Story prose**: steps, afterimages, chronicle, land-page prose. One step above UI text |
| `--text-lg` | 1.375 | **22** | 24.75 | 21 | Section headings; **the smallest size Cinzel may take** (THR-1833: 22 px and up) |
| `--text-xl` | 1.625 | **26** | 29.25 | 26 | Panel and dialog titles |
| `--text-2xl` | 2 | **32** | 36 | 31 | Screen titles, the Inspector page title |

- **Prose one step above UI text.** THR-1833 asked for "about 19 px". 19 is 1 px from 18, which breaks the no-1-px rule, so prose is 20 px: one full step (2 px) above UI text. A smaller UI step (17) would put it 1 px from the floor.
- **The body default stays 18 px.** `body { font-size }` moves from `var(--text-base)` to `var(--text-sm)`, so text with no explicit size does not change at 1080p.
- **What moves at 1080p.** The `--text-sm` users go from 17 to 18 px (+1 px). The `--text-base` users go from 18 to 20 px (+2 px; 58 sites: panel names, sheet sub-titles, `Button` size `lg`, prose shorthands). `--text-lg` goes 21 → 22 and `--text-2xl` 31 → 32. The floor and `--text-xl` do not move.
- **Prose rhythm.** `--type-body-prose` and `--type-flavor` keep `var(--text-base)` and change line-height from 1.7 to **1.6**. A new `--measure-prose: 34em` (680 px at 20 px, 765 px at 22.5 px) is the reading measure for story columns. Faces are not changed here; the map's type-and-icons plan doc ([THR-1879](https://linear.app/threadbare/issue/THR-1879)) moves `--font-prose` to Alegreya. **Feed to that doc:** when it switches the face it also moves every `--font-prose` site to `--text-base`, so the face never ships without its step.
- **Not in the scale.** `em` and `%` sizes (relative to text already on the scale), named constants such as THR-1831's map-label sizes (px by zoom band), and SVG `fontSize=` attributes (viewBox units). Tailwind sizes above `text-2xl` (`text-3xl` and up) fall through to Tailwind's defaults and are off-scale; there is one on a player surface (`ScryOverlay.tsx:726`), counted by the ratchet below.

### 4. The layout tokens

Two families, because they answer to different things:

- **Frame geometry** (top bar, rails, strip, Inspector, Stage) is **px, restated in every tier block**. It is budgeted against the screen (the map-share floor), so it must be an exact number at each tier. Stepped px also make the share rise as a window widens within a tier, so checking each tier at its breakpoint covers every width in it.
- **Text containers** (tooltip, hover card, toast, compact Stage column, prose measure, panel padding) are **rem, declared once**. Their job is a reading measure, so they follow the type size. At 1080p they keep today's pixel width exactly, and at 1440p they grow with the root step.

`:root` holds the `base` value; the three `@media (min-width: …)` blocks restate every frame token. All values in px unless marked.

| Token | Family | `base` (<1920) | `fhd` ≥1920 | `qhd` ≥2560 | `uwqhd` ≥3440 | Source | Consumed in this ticket by |
|---|---|---|---|---|---|---|---|
| `--topbar-height` | frame | 44 | 48 | **56** | 56 | THR-1828 call 1 (today 52 at 2560) | `GameViewTopBar` (already reads it) |
| `--topbar-padding-x` | frame | 12 | 16 | 20 | 20 | today; the promised 24 at 3440 is retired | `GameViewTopBar` (already) |
| `--topbar-gap` | frame | 12 | 16 | 20 | 20 | today | `GameViewTopBar` (already) |
| `--rail-left-w` | frame | 320 | **320** | **400** | 400 | THR-1828 call 2 (today fixed 360) | `AscendantBar` |
| `--rail-right-w` | frame | 280 | **340** | **420** | 420 | THR-1828 call 3 (replaces `--sidebar-width`; today 360 / 400 / 420) | `GameView` right rail |
| `--rail-strip-w` | frame | 56 | 56 | 56 | 56 | THR-1828 call 3 | the frame build ([THR-1875](https://linear.app/threadbare/issue/THR-1875)) |
| `--inspector-w` | frame | 560 | **560** | **717** | 717 | THR-1827 call 2 (docked) | the Inspector build ([THR-1876](https://linear.app/threadbare/issue/THR-1876)) |
| `--inspector-wide-w` | frame | 960 | **960** | **1280** | 1280 | THR-1827 call 2 (wide) | the Inspector build ([THR-1876](https://linear.app/threadbare/issue/THR-1876)) |
| `--inspector-full-trail-w` | frame | 240 | 240 | **300** | 300 | THR-1827 full layout (2560); 1920 = 300 × 0.8 | the Inspector build ([THR-1876](https://linear.app/threadbare/issue/THR-1876)) |
| `--inspector-full-aside-w` | frame | 360 | 360 | **440** | 440 | THR-1827 full layout (2560); 1920 ≈ 440 × 0.8 | the Inspector build ([THR-1876](https://linear.app/threadbare/issue/THR-1876)) |
| `--stage-gutter` | frame | 24 | 24 | 24 | 24 | THR-1829 | the Stage build ([THR-1877](https://linear.app/threadbare/issue/THR-1877)) |
| `--stage-window-w` | frame | 280 | **280** | **520** | **1400** | THR-1829 `STAGE_WINDOW_PX`; 3440 derived (below) | the Stage build ([THR-1877](https://linear.app/threadbare/issue/THR-1877)) |
| `--stage-left-col-w` | frame | 340 | **340** | **560** | 560 | THR-1829 `STAGE_LEFT_COL_PX` | the Stage build ([THR-1877](https://linear.app/threadbare/issue/THR-1877)) |
| `--panel-padding` | text | 1rem (16) | 1.25rem (20) | 1.25rem (22.5) | 1.25rem (22.5) | today; the promised 1.5 / 1.75rem steps are retired because rem already steps | `Modal`, `Card`, rails (already) |
| `--tooltip-max-w` | text | 17.5rem (280) | 280 | 315 | 315 | today's 280 at 1080p | `Tooltip` |
| `--hovercard-w` | text | 26.25rem (420) | 420 | 472.5 | 472.5 | today's 420 at 1080p | `HoverCard` |
| `--toast-w` | text | 20rem (320) | 320 | 360 | 360 | today's 320 at 1080p | `ToastStack` |
| `--stage-compact-w` | text | 53.75rem (860) | 860 | 967.5 | 967.5 | THR-1829 compact tier | the Stage build ([THR-1877](https://linear.app/threadbare/issue/THR-1877)) |
| `--measure-prose` | text | 34em | 680 at 20 px | 765 at 22.5 px | 765 | THR-1833 § 4 | THR-1877 (Stage), THR-1876 (Inspector), THR-1879 (type and icons) |
| `--modal-max-h` | height | 85vh | 918 at 1080 | 1224 at 1440 | 1224 | Law 33; brief decision 4 | `Modal`, `ScryOverlay`, `ChoiceSetModal`, `SettingsPanel` |

- **`--sidebar-width` is deleted**, not aliased. It has one consumer (`GameView.tsx:6151`), which moves to `--rail-right-w` in the same PR; no test pins it. The frame decision's working name `--sidebar-w` is superseded by the rail family (`--rail-left-w` / `--rail-right-w` / `--rail-strip-w`).
- **Inspector full** has no width token. It fills the map region right of the god rail (THR-1827 call 11 keeps the top bar and god rail visible). Its trail and aside are tokens; the page between them is `flex: 1`, and each prose block in it caps at `--measure-prose`.
- **The Stage panel width is derived, not a token.** `calc(100vw - var(--rail-left-w) - var(--stage-window-w) - 2 * var(--stage-gutter))` gives 1920 − 320 − 280 − 48 = **1272** (THR-1829: "about 1270"); 2560 − 400 − 520 − 48 = **1592** ("about 1590"); and 3440 − 400 − 1400 − 48 = **1592**. At 3440 the panel holds the 2560 size because the type does not step again, and the window takes the extra 880 px. That is where "extra width only" goes.
- **Retired doc promises.** `--bp-*` (CSS custom properties cannot drive media queries; breakpoints live in `layoutContract.ts`); `--panel-padding` 1.5 / 1.75rem; `--topbar-padding-x` and `--topbar-gap` 24 at 3440; `layout.md`'s ultrawide "left panel unlocks at 3440" (the god rail is always on the left now).
- **Dropdown caps are not modals.** `NotablesPanel` (70vh, a drop-down, THR-1655), the Needs-you list and Find (60vh, THR-1828 / THR-1832) are outside the modal rule. They are listed here so the rule's membership stays settled.

### 5. The map-share budget, checked

The map's share is the map rectangle's area over the screen's area: (W − columns) × (H − top bar) / (W × H). Here *columns* is the sum of the vertical chrome (rails, strip, Inspector). This formula reproduces all eight rows of the frame decision's § 5 table.

| Screen | Layout | Columns (px) | Map rect | Share | Floor | Column headroom |
|---|---|---|---|---|---|---|
| 1920×1080 | both rails open | 320 + 340 = 660 | 1260 × 1032 | 1,300,320 / 2,073,600 = **0.627** | 0.60 ✓ | 54 px |
| 1920×1080 | Inspector docked + strip | 320 + 56 + 560 = 936 | 984 × 1032 | 1,015,488 / 2,073,600 = **0.490** | 0.45 ✓ | 79 px |
| 2560×1440 | both rails open | 400 + 420 = 820 | 1740 × 1384 | 2,408,160 / 3,686,400 = **0.653** | 0.60 ✓ | 141 px |
| 2560×1440 | Inspector docked + strip | 400 + 56 + 717 = 1173 | 1387 × 1384 | 1,919,608 / 3,686,400 = **0.521** | 0.45 ✓ | 188 px |
| 3440×1440 | both rails open | 820 | 2620 × 1384 | 3,626,080 / 4,953,600 = **0.732** | 0.60 ✓ | 472 px |
| 3440×1440 | Inspector docked + strip | 1173 | 2267 × 1384 | 3,137,528 / 4,953,600 = **0.633** | 0.45 ✓ | 656 px |
| *today, 1920×1080* | *360 + 360* | *720* | *1200 × 1032* | *0.597* | *0.60 ✗* | — |

- **Headroom** is how many more px of column the layout can take before it breaks its floor: W × (1 − floor × H / (H − top)) − columns. The tightest is 54 px at 1080p with both rails open. A later frame addition is measured against these two constants (THR-1828), and the budget test below does the measuring.
- **A windowed browser** (1920 × ~969 px inner) still passes: rails 1260 × 921 / (1920 × 969) = **0.624**; Inspector 984 × 921 / (1920 × 969) = **0.487**.
- **Ledger folded to the strip:** 1544 × 1032 → 0.768 at 1080p; 2104 × 1384 → 0.790 at 1440p.
- **Map chrome feed.** At 1080p the canvas is 1260 px with both rails open, below THR-1831's ~1400 px trigger, so the minimap stays folded at 1080p (THR-1831 unchanged; its plan doc is [THR-1878](https://linear.app/threadbare/issue/THR-1878)).

### 6. One modal height rule: 85vh

`--modal-max-h: 85vh` in `:root`, one value at every tier. The places it lands:

| Place | Today | After |
|---|---|---|
| `src/components/shared/Modal.tsx:70` (`modalPanelStyle`) | `maxHeight: '75vh'` | `maxHeight: 'var(--modal-max-h)'` |
| `src/components/Game/ScryOverlay.tsx:527` `SCRY_PANEL_MAX_HEIGHT` (+ comment at :695) | `'75vh'` | `'var(--modal-max-h)'` (the court is a dialog home, THR-1829) |
| `ChoiceSetModal.tsx:81`, `SettingsPanel.tsx:145` | `'85vh'` literal | `'var(--modal-max-h)'` |
| `DetailModal.tsx:283` | `'85vh'` | unchanged: retired by THR-1827, not migrated (brief decision 7) |
| `StyleGuide.tsx:725` copy | "Max-height: 75vh" | "Max-height: 85vh (`--modal-max-h`)" |
| `CLAUDE.md:45` viewport line | "modals `max-height: 75vh`" | rewritten (text below) |
| `Docs/design-system/INDEX.md` core constraints | no height rule; 1920 primary | screens rewritten; "modals cap at 85vh (`--modal-max-h`)" added |
| `Docs/design-system/laws.md` Law 33 | 85vh (correct) | screen pair amended (§ Law 33 amendment) |
| `component-selection.md:66,251`, `layout-zones.md:100`, `primitives.md:42,354`, `Docs/ops/dev-quickstart.md:95` | 75vh / "stricter than Law 33" | 85vh via `--modal-max-h`; the "stricter" wording goes |
| `.claude/skills/frontend-ui/SKILL.md:108,179` | 75vh | 85vh. **If the edit is refused** (agent sessions are sometimes refused on `.claude/skills/`), file a small follow-up issue in this project with the exact two-line diff and link it from the PR. Do not skip it silently. |

`Modal`'s `paddingTop: '5vh'` stays, so a full-height panel ends at 90vh (972 px at 1080p): below the 48 px top bar and 108 px clear of the bottom.

### 7. The breakpoint module and its locks

**New: `src/components/shared/layoutContract.ts`** (beside `Modal`, `Tooltip` and `dialogContext.ts`). It is the one TS home for JS consumers (brief decision 2):

```ts
export type LayoutTier = 'base' | 'fhd' | 'qhd' | 'uwqhd';
export const LAYOUT_BREAKPOINTS_PX = { fhd: 1920, qhd: 2560, uwqhd: 3440 } as const;
export const ROOT_FONT_STEP = { scale: 1.125, minWidthPx: 2560, minHeightPx: 1200 } as const;
export const TYPE_SCALE_REM = { xs: 1, sm: 1.125, base: 1.25, lg: 1.375, xl: 1.625, '2xl': 2 } as const;
export const TYPE_FLOOR_PX = 16;          // --text-xs at a 16 px root
export const CINZEL_MIN_PX = 22;          // THR-1833; equals --text-lg at a 16 px root
export const TYPE_MIN_STEP_PX = 2;        // no two adjacent steps closer than this at a 16 px root
export const FRAME_TOKENS_PX: Record<LayoutTier, FrameTokens>;  // the frame rows of § 4, keyed by CSS name
export const TEXT_TOKENS_REM: { tooltipMaxW: 17.5; hovercardW: 26.25; toastW: 20; stageCompactW: 53.75; panelPaddingFhd: 1.25 };
export const MEASURE_PROSE_EM = 34;
export const MODAL_MAX_HEIGHT_VH = 85;
export const FRAME_MAP_SHARE_MIN = 0.60;
export const FRAME_MAP_SHARE_MIN_INSPECTOR = 0.45;
export function layoutTierFor(widthPx: number): LayoutTier;
export function mapShare(screen: { w: number; h: number }, columnsPx: number, topBarPx: number): number;
export function rootFontPx(): number;      // live root size; 16 when the DOM cannot say (jsdom, SSR, NaN)
export function remToPx(rem: number): number;
```

The CSS stays hand-authored and authoritative for CSS consumers. The TS table must equal it, and a test enforces that.

**New: `src/components/shared/__tests__/layoutContract.test.ts`** (node; reads `src/index.css` like `dialogContextTokens.test.ts`):

1. **Parity.** For each tier, every frame token in `FRAME_TOKENS_PX` equals the value in the matching `:root` (or `@media (min-width: N) { :root }`) block. Each `TEXT_TOKENS_REM` entry, `--measure-prose`, `--modal-max-h` and the six `--text-*` values equal their TS constants. `--sidebar-width` is absent.
2. **Scale.** Adjacent steps differ by ≥ `TYPE_MIN_STEP_PX` at a 16 px root; `xs × 16 = TYPE_FLOOR_PX`; `base` is the step right after `sm`; `lg × 16 = CINZEL_MIN_PX`.
3. **Root step.** The stylesheet contains `@media (min-width: 2560px) and (min-height: 1200px)` with `html { font-size: 112.5% }` (from `ROOT_FONT_STEP`).
4. **Budget.** At 1920×1080, 2560×1440 and 3440×1440, `mapShare` with both rails ≥ `FRAME_MAP_SHARE_MIN`, and with rail + strip + docked Inspector ≥ `FRAME_MAP_SHARE_MIN_INSPECTOR`.
5. **Tier.** `layoutTierFor` returns `base` / `fhd` / `qhd` / `uwqhd` at 1919 / 1920 / 2560 / 3440.

**Not shipped: a `useLayoutTier()` hook.** Nothing in this ticket needs the tier in React. The first build that does (the Stage camera centring the lit hex in `--stage-window-w`) adds it on the `usePrefersReducedMotion` pattern, reading `LAYOUT_BREAKPOINTS_PX`.

### 8. Today's fixed widths — every one gets a disposition

| Width today | Disposition |
|---|---|
| AscendantBar 360 | `var(--rail-left-w)` here (320 / 400). The frame build later rebuilds its content |
| Right sidebar `var(--sidebar-width)` | `var(--rail-right-w)` here (340 / 420) |
| Detail column `clamp(240px, 280px, 30vw)` | **Retired by THR-1827** (`ThreadDetailView` / `HexDetailView` → Inspector). Not tokenised |
| HexSidebar 220 / 60 | **Retired by THR-1827** (the `hex-zoom` view). Not tokenised |
| SettingsPanel 280 | **THR-1820** gives it a tier (Settings keeps a dialog home). Its height adopts `--modal-max-h` here |
| CodexSidebar 240 | Migrates with the Codex placement decision (THR-1823 fog). Its text already scales with the root step |
| Tooltip 280 | `--tooltip-max-w` (17.5rem) here |
| HoverCard 420 | `--hovercard-w` (26.25rem) here |
| Toast 320 | `--toast-w` (20rem) here |
| DebugPanel 480 | Dev surface, outside the contract (Law 13's designer view) |
| `DETAIL_CONTENT_W` 720 / `DetailModal` | **Retired by THR-1827** |

### 9. Every file that adopts the tokens (this ticket)

| File | Edit |
|---|---|
| `src/index.css` | The type scale (§ 3); `body` → `var(--text-sm)`; prose shorthands line-height 1.6; the § 4 tokens in `:root` + three blocks; delete `--sidebar-width`; the root step-up block; `--modal-max-h`; comments name THR-1819 and the decision records |
| `src/components/shared/layoutContract.ts` | **New** (§ 7) |
| `src/components/shared/__tests__/layoutContract.test.ts` | **New** (§ 7) |
| `src/components/Game/ascendant-bar/styles.module.css` | `.bar { width: var(--rail-left-w) }` |
| `src/components/Game/GameView.tsx` | right rail `width: 'var(--rail-right-w)'` (the one `--sidebar-width` consumer, ~L6151) |
| `src/components/shared/Modal.tsx` | `maxHeight: 'var(--modal-max-h)'` |
| `src/components/Game/ScryOverlay.tsx` | `SCRY_PANEL_MAX_HEIGHT = 'var(--modal-max-h)'`; comment |
| `src/components/Game/ChoiceSetModal.tsx`, `src/components/Game/SettingsPanel.tsx` | `maxHeight: 'var(--modal-max-h)'` |
| `src/components/shared/Tooltip.tsx`, `src/types/tooltip.ts`, `src/types/__tests__/tooltip.test.ts` | `TOOLTIP_MAX_WIDTH` (px) is replaced: positioning uses `remToPx(TEXT_TOKENS_REM.tooltipMaxW)` once per positioning pass; style `maxWidth: 'var(--tooltip-max-w)'`; the test asserts the rem constant |
| `src/components/shared/HoverCard.tsx`, `src/types/detailPage.ts` | `HOVER_CARD_W` (px) → `remToPx(TEXT_TOKENS_REM.hovercardW)` in placement; style `width: 'var(--hovercard-w)'` |
| `src/components/Game/ToastStack.tsx` | `maxWidth: 'var(--toast-w)'` |
| `src/components/shared/SphereIcon.tsx` | `toPxNumber` uses `remToPx` instead of `* 16` |
| `src/components/StyleGuide/StyleGuide.tsx` | § tokens gains a **Type scale** column (one line per step, at its size, with its role and live px) and a **Layout** column (each § 4 token with its live value); the Modal copy reads 85vh |
| `src/debug-bridge.ts`, `src/debug-bridge.d.ts` | `getLayoutContract()` (§ Tracing) |

### 10. Docs this ticket updates (same PR as the code)

The docs change **with** the code, never before it. Docs that promise tokens the CSS lacks are the defect this ticket exists to fix.

- `CLAUDE.md:45`: the viewport line, replaced by:
  > **Viewport contract (2560×1440 primary, 1920×1080 floor):** the game fills one viewport at both — nothing scrolls, nothing renders below the fold (`html, body, #root` keep `100dvh; overflow: hidden`; full-screen layouts `h-screen flex flex-col overflow-hidden`; modals `max-height: var(--modal-max-h)` = 85vh). Widths and the type step come from `src/index.css` tokens at 1920 / 2560 / 3440 (JS: `src/components/shared/layoutContract.ts`). Resize to 1920×1080 before contract screenshots; a layout- or type-token change also captures 2560×1440. Playwright snapshots cannot see WebGL. Off-screen rendering is a bug.
- `Docs/design-system/INDEX.md` § Core Constraints: primary 2560×1440; supported floor 1920×1080; 3440 wide = extra width only; below 1920 = earlier behaviour, 1280×720 must not break; modals 85vh; tokens in `index.css`, breakpoints for JS in `layoutContract.ts`.
- `Docs/design-system/layout.md`: § Breakpoints (four tiers; the `--bp-*` block replaced by a pointer to `layoutContract.ts`, saying why: custom properties cannot drive media queries); zones rewritten as top bar / god rail / map / Ledger rail with § 4's widths; § Zone B tables; the 3440 left-panel section removed (pointer to THR-1828); panel padding; top-bar text `--text-sm` = 18 px.
- `Docs/design-system/layout-zones.md`: left zone = god rail (`--rail-left-w`) replacing HexSidebar; right = Ledger rail (`--rail-right-w`) + strip; the § Responsive Scaling table becomes § 4's table; the modal max height is `--modal-max-h` 85vh; "Last updated" line.
- `Docs/design-system/typography.md`: § Type Scale replaced by § 3's table (sizes and roles; no face or case rule) and its rules. "Do not scale with viewport" becomes "one root step at 2560 (×1.125), no fluid type". Body prose line-height 1.6. A note that the faces/roles rewrite is the type-and-icons plan doc's (THR-1879; THR-1833 feeds).
- `Docs/design-system/tokens.md`: a § Layout tokens section (§ 4's table, short form); the anti-pattern line names `var(--rail-right-w)` etc. instead of `--sidebar-width`.
- `Docs/design-system/laws.md`: the Law 33 amendment below.
- `Docs/design-system/component-selection.md`, `primitives.md`, `Docs/ops/dev-quickstart.md` § Viewport Contract: 85vh, both screens.
- `Docs/canon/verification-gates.md` § Browser-verify item 1: one sentence: *"A change to the layout or type tokens (`src/index.css` `:root` and its breakpoint blocks) also captures 2560×1440, the primary screen (THR-1819)."* The 1920×1080 capture stays the contract evidence everywhere else (it is the tightest fit).
- `.claude/skills/frontend-ui/SKILL.md`: § 2 layout-scaling table → § 4's frame rows; § 3 / § 5 Modal 85vh; § 4 diagram widths; § 7 "Responsive behavior? — 1920 / 2560 / 3440"; § 10 add the 2560×1440 capture; bump `last_validated_against`. Refusal fallback as in § 6.
- `Docs/changelog.md`: rows for the type scale, the layout tokens, and "Law 33 amended (screen pair)".

### 11. The literal-font-size ratchet pattern (for THR-1821's script)

THR-1821's plan doc owns `scripts/check-ui-debt.ts` (brief decision 5). This ticket contributes one pattern, **`literal-font-size`**: a font size not expressed through the type scale.

- **Scope:** `src/components/**`, `src/hooks/**`, `src/contexts/**` (`.ts`, `.tsx`, `.css`), excluding `__tests__/`, `*.test.*`, `*.spec.*`, `*.stories.*` and the dev surfaces `CMS/`, `StyleGuide/`, `TaxonomyViewer/`, `UL/`, `Game/debug/`, `Game/DebugPanel.tsx`, `HexMapV2/lab/`.
- **Counted, once per declaration:**
  - a JS `fontSize:` value expression (up to its top-level `,` `}` or line end) that, after removing `var(--text-(xs|sm|base|lg|xl|2xl)…)` references, still contains a bare number literal used as a size, or a quoted length in `px` / `rem` / `pt` / `vw` / `vh` (ternaries included);
  - a CSS `font-size:` (in `.css` or a template string) with such a length;
  - a Tailwind arbitrary size `text-[<n>px|rem]`;
  - a Tailwind size above the scale (`text-3xl` … `text-9xl`);
  - a reference to an undefined size token (`var(--text-2xs…)`).
- **Not counted:** `em` / `%`; named constants (`fontSize: GLYPH_FONT_PX`, NFP #1; THR-1831's label sizes live there by design); computed template values; SVG `fontSize=` attributes.
- **Baseline today (`main` @ `3cf81086`): 198 declarations in 55 files.** That is 55 bare numbers, 130 quoted lengths, 9 undefined `--text-2xs`, 3 Tailwind arbitrary sizes and 1 `text-3xl`. 34 distinct values; 112 of them below the 16 px floor; 10 px is the most common. The dev surfaces hold 44 more, uncounted. (The issue's "219 / 49" was an earlier, looser count.) Top files: `ascendant-bar/ActionsBlock.tsx` 13, `Remembrance/TransformationBeat.tsx` 11, `Remembrance/RevealBeat.tsx` 10, `shared/Section.tsx` 9.
- **Registration:** if `scripts/check-ui-debt.ts` is on `main` when this ticket executes, the executor adds the pattern with the baseline **re-measured at that moment**. If it is not, the executor posts the pattern spec and the baseline as a comment on [THR-1821](https://linear.app/threadbare/issue/THR-1821) for its executor to register (brief: "1819/1820 add their patterns after 1821 lands it").
- **This ticket migrates no literal sizes.** The god rail's 53 (`ascendant-bar/*`) go when the frame build (THR-1875) rebuilds it. The encounter surfaces' sizes go with the Stage build (THR-1877). The rest go when touched (brief decision 10). `--text-2xs` is **not** defined as an alias: `CardFace` renders those three sites at its 11 px fallback today, and a 16 px alias would silently re-flow the 210 px card faces on the hot encounter surfaces.

### Player-facing text

No words change. Every surface below shows its existing text at the new sizes.

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Every surface using `--text-sm` / `--text-base` / `--text-lg` / `--text-2xl` | unchanged (+1 or +2 px at 1080p, ×1.125 at 1440p) | none — no word, number or label changes | Same text, larger |
| Tooltip, hover card, toast | unchanged; boxes keep their 1080p widths and grow ×1.125 at 1440p | none | Same line breaks at both sizes |
| God rail, Ledger rail | unchanged content; 320 / 340 px at 1080p, 400 / 420 at 1440p | none (off-screen surfaces are Law 33's, enforced by browser-verify; see Done when) | Same rows, more map at 1080p |

### Playtest signal

No tester playing at 2560×1440 calls the god rail's or the Chronicle's text small or hard to read, and no tester at 1920×1080 reports a panel, button or hand row cut off at the screen edge. The 1440p half needs a round run at 2560×1440. Today's cold-playtest briefs run at 1920×1080 (the floor), so that clause is only exercised if the playtest lane runs a round at the primary screen. The lane decides; this plan does not change the briefs.

### Event notifications

None. No alert, toast or chronicle entry is emitted.

### Debug inspection (DebugPanel)

`window.__DEBUG.getLayoutContract()` (shape under § Tracing). It reports the live tier, root size, every § 4 token as `:root` resolves it, and the measured top bar and rail widths. It is the state assertion for this ticket's browser-verify, and the frame / Inspector / Stage builds reuse it to prove they consume the tokens.

### Visual presence (HexMapV2)

No signifier or layer changes. The canvas gets wider at 1080p (1200 → 1260 px with both rails) and narrower at 1440p (1800 → 1740 px). Map labels are screen-px constants by zoom band (THR-1831) and do not take the root step. The minimap rule stands (§ 5).

### UI Laws engaged

- **33** (one viewport): amended, see below; the contract is verified at both screens.
- **35** (named zones and z-bands): the zones are renamed in `layout-zones.md`; no z-band changes.
- **53** (persistent HUD is a budget): the two map-share floors become a test.
- **45** (contrast) and **46** (24 px hit areas): unchanged and not weakened. Sizes only grow at 1440p.
- **1, 13/14, 17, 21, 37**: no rendering path changes. The browser-verify judgment line confirms them on the main view as composed.

## Law 33 amendment

Law 33 already says 85vh. The amendment writes in the screen pair Christian ruled on 2026-10-11 ("design primarily for minimum 1440p landscape"; recorded as a standing preference on THR-1823 with *human gate satisfied via chat review 2026-10-11*), and the 3440 and below-1920 cases the groundwork brief settled. It is not a new decision, so it lands with the implementing PR. **Replacement text:**

> 33. **[E] The game fills exactly one viewport — at 2560×1440, the primary screen, and at 1920×1080, the supported floor: nothing scrolls at page level, nothing renders below the fold.** Panels scroll internally (`flex-1 overflow-y-auto`); every dialog caps at 85vh (`--modal-max-h`), one rule; never the page. The card hand wraps into rows of at most four cards (`CARDS_PER_ROW`) instead of scrolling sideways (amended 2026-10-04, Christian chat — THR-1724). Screens 3440 px wide and more add width only — the map and the Stage window take it — with no further type step. Below 1920 px wide the game keeps its earlier behaviour: at the 1280×720 minimum the contract holds at panel level and page scroll is tolerated, and a capture below 1920 is not evidence of a violation (amended 2026-08-06). Screen pair amended 2026-10-14 (THR-1819), from Christian's 2026-10-11 ruling on THR-1823. (CLAUDE.md § Viewport contract; THR-890.)

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `index.css` type scale + root step-up | none (presentation) | every surface through `--text-*`, Tailwind `text-*`, rem | none | none | StyleGuide § tokens › Type scale; `getLayoutContract().rootFontPx` |
| `index.css` layout tokens | none | `AscendantBar`, `GameView` right rail, `GameViewTopBar`, `Modal`, `Card`, `ToastStack`, `Tooltip`, `HoverCard` (later: frame, Inspector, Stage builds) | none | none | `getLayoutContract().tokens`, `.measured` |
| `--modal-max-h` | none | `Modal`, `ScryOverlay`, `ChoiceSetModal`, `SettingsPanel` | none | none | `getLayoutContract().tokens['--modal-max-h']` |
| `layoutContract.ts` | none | `Tooltip`, `HoverCard`, `SphereIcon`, `debug-bridge`, the parity and budget test | none | none | `getLayoutContract()` |
| `getLayoutContract()` | none | `src/debug-bridge.ts` / `.d.ts` | none | none | itself |

Player controls: none added. Prose pipeline: not involved.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `LAYOUT_BREAKPOINTS_PX` | `{ fhd: 1920, qhd: 2560, uwqhd: 3440 }` | The three tier edges; must equal the `@media (min-width)` blocks |
| `ROOT_FONT_STEP.scale` | 1.125 (`html { font-size: 112.5% }`) | The 1440p type step-up |
| `ROOT_FONT_STEP.minWidthPx` / `.minHeightPx` | 2560 / 1200 | Where the step applies (height guard keeps 2560×1080 at the 1080p size) |
| `TYPE_SCALE_REM` | xs 1 · sm 1.125 · base 1.25 · lg 1.375 · xl 1.625 · 2xl 2 | The six type steps |
| `TYPE_FLOOR_PX` | 16 | The smallest readable size at 1080p (`--text-xs`) |
| `TYPE_MIN_STEP_PX` | 2 | Minimum gap between adjacent steps at a 16 px root |
| `CINZEL_MIN_PX` | 22 | The smallest size Cinzel may take (THR-1833) = `--text-lg` at 1080p |
| `MEASURE_PROSE_EM` | 34 | Story-column reading measure (`--measure-prose`) |
| Prose line-height | 1.6 | `--type-body-prose`, `--type-flavor` (THR-1833 § 4) |
| `FRAME_TOKENS_PX` | § 4 frame rows × four tiers | Top bar, rails, strip, Inspector, Stage geometry |
| `TEXT_TOKENS_REM` | tooltip 17.5 · hover card 26.25 · toast 20 · Stage compact 53.75 · panel padding (≥1920) 1.25 | Text-container widths that follow the type size |
| `MODAL_MAX_HEIGHT_VH` | 85 | The one dialog height cap (`--modal-max-h`) |
| `FRAME_MAP_SHARE_MIN` | 0.60 | Map share floor with both rails open (THR-1828) |
| `FRAME_MAP_SHARE_MIN_INSPECTOR` | 0.45 | Map share floor with the Inspector docked (THR-1828) |

## Tracing

N/A — presentation only; no game event is emitted, so no trace type is added. Inspectability is the debug accessor below, the StyleGuide's live token columns, and the parity test.

```ts
// Not a trace — the debug accessor's return shape (src/debug-bridge.d.ts).
interface DebugLayoutContract {
  tier: 'base' | 'fhd' | 'qhd' | 'uwqhd';      // layoutTierFor(innerWidth)
  viewport: { width: number; height: number };  // innerWidth / innerHeight
  rootFontPx: number;                           // 16, or 18 when the root step applies
  /** Every § 4 token and the six --text-* steps as :root declares them, e.g. '--rail-left-w': '400px', '--tooltip-max-w': '17.5rem'. */
  tokens: Record<string, string>;
  /** Rendered widths, or null when that element is not mounted. */
  measured: {
    topBarPx: number | null;        // [data-testid="game-topbar"] height
    godRailPx: number | null;       // aside[aria-label="Ascendant status"] width
    ledgerRailPx: number | null;    // [data-testid="right-sidebar"] width
  };
  /** mapShare() at this viewport from the token table: both rails, and rail + strip + docked Inspector. */
  mapShare: { railsOpen: number; inspectorDocked: number };
}
// getLayoutContract(): Promise<DebugLayoutContract> — async like getDialogContexts (lazy import of layoutContract).
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `rootFontPx()` cannot read the root size (jsdom, SSR, `NaN`, empty string) | Returns 16, so tests and positioning behave exactly as today |
| A token is missing from `index.css` (typo, bad merge) | The parity test fails the build first. At runtime an undefined `var()` makes the declaration invalid (width falls back to auto), visible at once; consumers carry no px fallback, because a fallback is a second copy that drifts |
| Screen narrower than 1920 | `base` tier: pre-existing tokens keep today's defaults, new ones their 1920 value. Unsupported for new work, as the brief says |
| 2560×1080 ultrawide | Width tokens of `qhd`; root stays 16 px (height guard) |
| OS scaling or browser zoom moves the CSS width across a tier edge | The tier follows CSS px. The player's own enlargement is honoured, and it is consistent per window size |
| Player raised the browser's default font size | Root = their size (× 1.125 at `qhd`); rem tokens follow; frame px tokens do not. The rails may feel tighter, and the preference still wins |
| `getLayoutContract()` called with no game view mounted | `measured.*` are `null`; tier, tokens and shares still report |
| `.claude/skills/frontend-ui/SKILL.md` edit refused | Follow-up issue filed with the diff and linked from the PR; every other doc still lands |

## Three-pillar check

- [x] Engine pillar present (or N/A with rationale) — N/A: presentation only
- [x] Content pillar present (or N/A with rationale) — N/A: no words change
- [x] UI pillar present (or N/A with rationale) — the whole ticket
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves "the map is the table" (direction B, THR-1823): the map's share is a tested floor at both screens and grows at 1080p. It also serves "the god reads the world": the chrome is legible on the primary screen.
- [x] No Vision edit needed for this plan. The Law 33 amendment encodes Christian's 2026-10-11 ruling (§ Law 33 amendment).
- **Found by the Vision auditor, not owned here:** the vault's `Vision/taste-profile.md` still lists "ALL CAPS letter-spaced section labels" (a strong opinion) and "Body and prose in Alegreya Sans". THR-1828 and THR-1833 replaced both (sentence-case bold labels; Alegreya for prose). This plan sets sizes only and writes no face or case rule into the docs; the face and case rollout is THR-1879's. The divergence is reported to the spawning session so Christian can confirm the THR-1833 label rule against his own taste entry, and THR-1879 should update the taste profile with its rollout.

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss)
- [x] N/A — `Docs/canon/rulebook.md` is not edited

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1819-1440p-layout-contract-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every width, step, guard and floor is a named token or constant (§ Constants table); retuning the 1440p step is one percentage, and a rail is one value per tier |
| 2. Inspectability | PASS with note | No game traces (presentation only); `getLayoutContract()`, the StyleGuide's live token columns and the parity test make every value visible |
| 3. Determinism | PASS | No randomness; the tier is a pure function of viewport width (and height, for the root step) |
| 4. Fail-soft | PASS | `rootFontPx()` falls back to 16; missing tokens fail the build before runtime; see the fail-soft table |
| 5. Narrative over mechanical perfection | PASS | Story prose gets its own step above UI text, so the story reads larger than the controls (THR-1833) |
| 6. Additive over destructive | PASS with note | Tokens and a module are added. One token (`--sidebar-width`, a single consumer) and two px constants (`TOOLTIP_MAX_WIDTH`, `HOVER_CARD_W`) are replaced in the same PR, because keeping both would leave two sources of one width |
| 7. Performance budget | PASS | CSS custom properties; `remToPx` reads one computed style per tooltip or hover-card positioning pass; no per-tick cost |

## Kill criteria

- **The 1080p main view gains a cut-off panel, row or button after the scale change.** Fix that surface (wrap, or let it scroll inside its panel). Never shrink the scale back to 1 px steps.
- **At 2560×1440 Christian still finds the chrome small.** Raise `ROOT_FONT_STEP.scale` (for example to 1.1875, 19 px). One number; widths that are rem follow.
- **A later frame addition fails the budget test.** The addition shrinks or folds. The two floors are THR-1828's and change only with a new decision.
- **A 2560×1080 player reports small type.** Drop the height guard (one media condition).

## Done when

- [ ] `src/index.css` carries § 3's six steps, `body` at `var(--text-sm)`, prose shorthands at line-height 1.6, `--measure-prose`, every § 4 token in `:root` + the 1920 / 2560 / 3440 blocks, the root step-up block, and `--modal-max-h: 85vh`; `--sidebar-width` appears nowhere in `src/`, `Docs/design-system/` or `CLAUDE.md` (nor in `.claude/skills/frontend-ui/`, unless that edit was refused; see the docs item below).
- [ ] `src/components/shared/layoutContract.ts` exists as § 7 specifies, and `layoutContract.test.ts` passes all five checks (parity, scale, root step, budget, tier).
- [ ] Every § 9 consumer reads its token. `grep -rn "75vh" src` returns nothing, and `Modal`, `ScryOverlay`, `ChoiceSetModal` and `SettingsPanel` read `var(--modal-max-h)`.
- [ ] The § 10 docs are updated in the same PR, and no doc names a token the CSS lacks (`--bp-*`, `--sidebar-width`, the 1.5 / 1.75rem panel padding, the 24 px top-bar padding). Exception: `.claude/skills/frontend-ui/SKILL.md`, when its edit is refused, which instead has a linked follow-up issue. In that case the completion comment lists the follow-up as an **open item**: one of the issue's "four places" still says 75vh until it lands, so the closeout does not call the conflict fully resolved.
- [ ] Law 33 carries the amendment text, and `Docs/changelog.md` names it.
- [ ] The `literal-font-size` pattern is registered in the UI-debt ratchet with a re-measured baseline, **or** (script not yet on `main`) THR-1821 carries a comment with § 11's spec and baseline.
- [ ] `await window.__DEBUG.getLayoutContract()` exists and reports the shape in § Tracing.
- [ ] **Browser-verify, Playwright, both screens** (four-part evidence, `Docs/canon/verification-gates.md` § Browser-verify), on `?view=game&seeded&size=medium`:
  - (1) screenshots at 1920×1080 and at 2560×1440, each with `innerWidth`/`innerHeight` read back in the same pass (the root step needs `innerHeight ≥ 1200`), plus `?view=styleguide#section-tokens` at both;
  - (2) console output;
  - (3) `getLayoutContract()` returns `{ tier: 'fhd', rootFontPx: 16, measured.godRailPx: 320, measured.ledgerRailPx: 340 }` at 1920×1080 and `{ tier: 'qhd', rootFontPx: 18, 400, 420 }` at 2560×1440; `document.documentElement.scrollWidth <= innerWidth` and `scrollHeight <= innerHeight` at both; no child of the god rail has `scrollWidth > clientWidth` at 320 px; one open `Modal` (for example `__DEBUG.openRef('faction', <id>, 'sheet')`) has panel height ≤ 0.85 × `innerHeight`; a hovered tooltip at 2560×1440 is ≤ 315 px wide;
  - (4) a UI-Laws judgment line citing Laws 1, 13/14, 17, 21, 33, 35, 37, 53.
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `check:generated-freshness`, `check:wiki-freshness:blocking` green; the closing commit body carries the close keyword for this ticket on its own line.

## Coordination block

**Suggested model:** opus. The global type scale moves every 1080p surface by 1–2 px, and an executor must judge which legacy surface needs a wrap when it overflows. The doc surface is wide, and the skill-edit fallback needs judgment. The token and module work itself is mechanical.

**Parallel-safe with:** THR-1821 and THR-1822 (no shared file; this ticket only *adds a pattern* to THR-1821's ratchet after it lands, or comments on THR-1821). THR-1848 (`HexTooltip.tsx` only). THR-1856 (`EncounterVeil` / `NudgePhaseShell` layout; no shared file, and both verify the encounter at 1920×1080). THR-1874 (effect icons). THR-1862, THR-1849, THR-1857, THR-1852, THR-1854, THR-1723, THR-1813, THR-1757 (engine / content; no UI file in common).

**Mutex with:** **THR-1820**: both edit the `:root` token block and media blocks of `src/index.css` and `src/components/shared/Modal.tsx`. THR-1820 executes **after** this ticket (it is blocked by it) and adds its tier tokens to the same blocks, the `layoutContract.ts` table and the parity test. Also mutex with any ticket in flight that edits `src/debug-bridge.ts` / `.d.ts`, `Tooltip.tsx`, `HoverCard.tsx`, `ToastStack.tsx`, `ScryOverlay.tsx`, `SettingsPanel.tsx`, `ChoiceSetModal.tsx`, `ascendant-bar/styles.module.css`, `CLAUDE.md` or `.claude/skills/frontend-ui/SKILL.md`; check at claim time. `GameView.tsx` takes a one-line edit (the right rail width): rebase over any concurrent GameView change rather than waiting.

**Files to touch:**
- Create: `src/components/shared/layoutContract.ts`, `src/components/shared/__tests__/layoutContract.test.ts`
- Edit: `src/index.css`; `src/components/Game/ascendant-bar/styles.module.css`; `src/components/Game/GameView.tsx`; `src/components/shared/Modal.tsx`; `src/components/Game/ScryOverlay.tsx`; `src/components/Game/ChoiceSetModal.tsx`; `src/components/Game/SettingsPanel.tsx`; `src/components/shared/Tooltip.tsx`; `src/types/tooltip.ts`; `src/types/__tests__/tooltip.test.ts`; `src/components/shared/HoverCard.tsx`; `src/types/detailPage.ts`; `src/components/Game/ToastStack.tsx`; `src/components/shared/SphereIcon.tsx`; `src/components/StyleGuide/StyleGuide.tsx`; `src/debug-bridge.ts`; `src/debug-bridge.d.ts`
- Edit (docs): `CLAUDE.md`; `Docs/design-system/{INDEX,layout,layout-zones,typography,tokens,laws,component-selection,primitives}.md`; `Docs/ops/dev-quickstart.md`; `Docs/canon/verification-gates.md`; `.claude/skills/frontend-ui/SKILL.md`; `Docs/changelog.md` (+ the DoD status fragment and project-history line)
- Ratchet: `scripts/check-ui-debt.ts` + its baseline JSON **only if** on `main` at execution (§ 11)

## Notes for the executor

- **Do not define `--text-2xs`.** Count it (§ 11). An alias would push `CardFace`'s 11 px provenance and rarity lines to 16 px on 210 px cards in the hot encounter surfaces.
- **Do not migrate literal font sizes** in the god rail blocks, the Remembrance beats or the encounter shells. The frame and Stage builds rebuild them; this ticket sets the scale and the ratchet only.
- **Do not touch HexMapV2 label sizes** (THR-1831 px constants by zoom band) or add a `@theme` block. The project's `:root --text-*` already override Tailwind v4's theme variables, which is how `text-sm` follows the scale.
- **Inspector and Stage tokens have no consumer yet.** That is intended: they are the contract the next builds start on, and the parity and budget tests consume them now. Do not invent a consumer.
- **The AscendantBar narrows 360 → 320 at 1080p** before the frame build rebuilds it. If a row clips (`overflow-x: hidden` hides it silently, so check `scrollWidth > clientWidth` on its children), wrap that row; never widen the token. The 0.60 floor is the contract.
- **Playwright at 2560×1440:** `browser_resize(2560, 1440)` then read `innerWidth`/`innerHeight` in the same `browser_evaluate` as the assertions. If the window cannot reach 1200 px of inner height on this machine, the root step will not apply. Record the actual numbers and a `Browser-verify substitution:` line rather than presenting the capture as 1440p.
- **jsdom:** `rootFontPx()` returns 16 there, so `Tooltip` / `HoverCard` placement tests keep today's numbers. If jsdom drops a `var(--modal-max-h)` inline value, `ScryOverlay.test.tsx:123` still compares against the constant; keep it importing `SCRY_PANEL_MAX_HEIGHT`.
- **No `useLayoutTier()` hook** in this ticket (§ 7): an unused hook is dead code.
- **`DetailModal`, the detail column, `HexSidebar`** are retired by THR-1827. Leave them as they are.

## Intent-judge verdict

**Allow** (2026-10-14, opus, cold context). All eleven applicable dimensions passed; dimension 11 (substrate existence) is N/A because there is no Engine pillar. The judge corrected the impact class upward, **Reversible → High-risk**: the plan rewrites the CLAUDE.md viewport line and edits a skill and a gate canon page. It accepted Christian's 2026-10-11 ruling recorded on THR-1823 ("2560×1440 landscape is the primary screen; 1920×1080 is the supported floor", human gate satisfied via chat review 2026-10-11) as the sign-off for those edits. It accepted the 85vh value as existing Law 33 canon and the 2560×1440 capture duty as agent-owned gate calibration. The judge independently checked the ratchet ownership claim against THR-1821's description.

Five advisories, all folded in before commit:
- the action proposal's impact class now reads High-risk, with the ruling cited as sign-off;
- the playtest signal is reworded as a refutable log predicate and notes that the 1440p half needs a round at 2560×1440;
- the § 4 consumer column names the queued plan-doc tickets (THR-1875 frame, THR-1876 Inspector, THR-1877 Stage, THR-1879 type and icons; THR-1878 for the minimap feed);
- a refused skill edit is listed as an open item at closeout;
- the height guard is surfaced to Christian as a veto point by the spawning session.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | The Constants table names every width, step, guard and floor. Retuning is one value: "Raise `ROOT_FONT_STEP.scale`". A parity test pins the CSS and TS copies together. |
| 2. Inspectability | PASS-with-note | The plan emits no traces ("N/A — presentation only"), so visibility rests on `getLayoutContract()`, the StyleGuide's live token columns and the parity test. The Wiring table fills every column of the checklist format. The `measured.*` values depend on specific DOM selectors, for example `aside[aria-label="Ascendant status"]`. |
| 3. Determinism | PASS | The tier is a pure function of viewport width (and height for the root step). No PRNG or sim state is touched. |
| 4. Fail-soft | PASS | `rootFontPx()` returns 16 on NaN, jsdom or SSR. The fail-soft table lists eight cases. A missing token fails the parity test before runtime. |
| 5. Narrative over mechanical | PASS | Story prose gets its own step above UI text: "`--text-base` Story prose… One step above UI text". |
| 6. Additive over destructive | PASS-with-note | The plan's own note lists three removals: `--sidebar-width`, `TOOLTIP_MAX_WIDTH` and `HOVER_CARD_W`. It omits two other destructive changes. Three existing type values change (+1 to +2 px at 1080p on 1,000+ sites). The `Modal` primitive's height cap moves from 75vh to 85vh for its 29 importers. The kill criteria acknowledge the type-scale risk. |
| 7. Performance budget | PASS | These are CSS custom properties. "`remToPx` reads one computed style per tooltip or hover-card positioning pass; no per-tick cost." |

NFP AUDIT: PASS-with-notes (see rows above)

*Author note: both NFP 6 caveats are intended and recorded. The +1/+2 px moves are § 3's stated cost of real steps. The 75vh → 85vh move brings `Modal` into line with Law 33, which already said 85vh.*

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | N/A-with-rationale | Header and § Engine pillar: "presentation only; no GameState field, graph node, edge, tick phase, trace or PRNG call". |
| Content | N/A-with-rationale | Header and § Content pillar: "no words change. Sizes and widths only". |
| UI | present-and-substantive | Covers the screenshot tool, tiers, measured baseline, type scale, layout tokens, map-share budget, modal rule, breakpoint module and tests, file list, docs list, ratchet, Player-facing text, Playtest signal, Event notifications, Debug inspection, Visual presence, and UI Laws engaged. |

**Missing required sections:** none. Every template section is present and non-empty, from the header block and Why this is load-bearing through the Coordination block (all three fields and a file list), Notes for the executor, and these verdicts. Blast Radius is conditional and correctly absent: the plan names no file with 100 or more importers (`Tooltip` has 84, `Modal` 29).

**Wiring check:** The Wiring section links the checklist and maps each module to its UI consumers and debug visibility. Orchestrator phase, GameState field and trace are all "none" on purpose, because the plan is presentation-only, and the debug route is `getLayoutContract()` plus the StyleGuide token columns.

**Substrate check:** N/A (no Engine pillar). The plan's own substrate inventory covers design-system substrate and is thorough.

PILLAR AUDIT: PASS

### Vision audit

**Vision premises touched**
- `02-non-negotiables.md` → "Narrative over mechanical perfection" (NFP #5) — confirmed. Story prose gets its own step above UI text.
- `02-non-negotiables.md` → "Three pillars always present" — confirmed. Engine and Content are N/A with explicit rationale.
- `02-non-negotiables.md` → "All mechanics surface through prose, never numbers" — silent. No player-facing words or numbers change; pixel values appear only in the StyleGuide and debug accessor, which are dev surfaces.
- `01-core-loop.md` → "one story at a time / dashboard guard" — extended, uncited. A tested map-share floor caps persistent chrome.
- `taste-profile.md` → soft "Cinzel + Alegreya Sans, 16px minimum" — extended. The 16px floor holds; the plan adds a six-step scale and a Cinzel minimum of 22px.
- `00-north-star.md`, `03-design-tensions.md` → not referenced.

**Vision contradictions**
- `taste-profile.md` lines 107-108 (strong) say "ALL CAPS letter-spaced section labels". The plan's xs row named THR-1833's label rule ("sentence case, no tracking"), which it takes as settled.
- `taste-profile.md` lines 228-229 say "Body and prose in Alegreya Sans". The plan names THR-1833's "Alegreya prose" and defers the face change to THR-1879.
- The plan's "No Vision edit needed" is unexamined against these two entries.

**Five qualitative checks**
- North star: aligned. Larger story type and a protected map support witnessing.
- Core loop: aligned. Rails are budgeted and the Stage window grows. Scan, encounter and aftermath order is untouched.
- Non-negotiables: aligned. No god-versus-protagonist, graph or number-surfacing impact.
- Design tensions: no strong pull. The map-share floors act as a counter-pull to dashboard drift.
- Taste profile: two label and face entries conflict with roles the plan encodes. The plan does not own them (THR-1833).

VISION AUDIT: PASS-with-notes — taste-profile label-case and prose-face entries diverge from the THR-1833 roles this plan writes into docs. [design-brief-stale]

*Author response: the xs row no longer restates the label face or case; it points to THR-1833 / THR-1879. The divergence is recorded under § Vision audit and reported to the spawning session.*
