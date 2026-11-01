> **title:** UI legibility census — what the player sees in each core module, measured on the deployed build — THR-2115
> **linear_issue:** THR-2115
> **author:** Claude Code (wayfinder research ticket on the THR-2114 legibility map, 2026-11-01, unattended)
> **created:** 2026-11-01
> Plan-size-exempt: a measurement audit — per-module tables of computed type, colour, position and frames; no build plan.

# UI legibility census — THR-2115

*Every number below was read from the computed style and bounding box of a rendered DOM element on the deployed build (`https://threadbearer.co/`, `main` at `4dd364cf` on 2026-11-01), at 1920×1080 and 2560×1440. Nothing is inferred from source. Where a module could not be reached, it is listed under **Not reached** with the reason.*

The sibling research ([`2026-11-01-ui-reading-patterns-research.md`](2026-11-01-ui-reading-patterns-research.md), THR-2116) gives the 18-rule checklist. Each module below ends with **Rules this bears on**, using that doc's rule numbers.

## How it was measured

**Capture.** A throwaway script (scratch area, not in the repo) reuses the loader of `scripts/ux-review/capture.mjs`: the machine-local `playwright-core@1.58.2` from `%USERPROFILE%\.threadbare\ux-review\runtime`, driving the installed Chrome headless with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`, `deviceScaleFactor: 1`. The commands run were:

```
node census.mjs base      1920x1080 out    # top bar, god rail, Ledger rail, tooltips, Read the Threads, Chapter Ledger
node census.mjs inspector 1920x1080 out    # person, god, place, faction, relic pages, docked then Widen
LAND_ONLY=1 node census.mjs inspector 1920x1080 out   # land page (person page → "The plateau at Sacred Grove")
node census.mjs stage     1920x1080 out    # ?spawn=encounter.slice.unsafe_bridge
node census.mjs warm      1920x1080 out2   # ?warm=300, then Space until a dialog opens
# …and the same four with 2560x1440 (warm only at 1920; see Not reached)
```

**Routes.** All on `?view=game&seeded&size=medium` (tick 0, clock paused). Stage: `&spawn=encounter.slice.unsafe_bridge`. Choice dialog: `&warm=300` (the warm start took 415 s headless; the dialog that arrived was the ascendant beat **A Path Opens**, a pick-one-of-three-cards choice).

**What is recorded per element.** Every visible element with its own text node, inside the module's root element: text, computed `font-size` (px), the matching `--text-*` token (px ÷ root font size × 16; anything else is marked *off-scale*), `font-weight`, first font family, colour mapped back to the `:root` custom property that resolves to the same `rgb()` (first match wins, `--text-*` first), WCAG contrast against the first opaque ancestor background, and the bounding box. **Frames** are elements ≥40×24 px with a border on three or more sides, or a background colour with alpha >0.04; **depth** counts framed ancestors from the module root inward (root = 1). **Row gaps** are the vertical gaps between consecutive text rows (items within 6 px of each other in *y* merge into one row).

**Role assignment** is a stated rule, not a judgement: inside a button/tab/link → *action*; Cinzel ≥ `--text-lg` → *title*, smaller Cinzel → *heading*; Alegreya (story face) over 60 characters → *prose*; weight ≥600 in tertiary/muted colour → *label*; other tertiary/muted → *caption*; everything else → *value*. Where this rule mislabels something (for example a gold 700 section heading falls under *value*), the table says so.

**Type scale reference.** At 1920×1080 the root is 16 px: `xs` 16, `sm` 18, `base` 20, `lg` 22, `xl` 26, `2xl` 32. At 2560×1440 the root steps to 18 px (`html { font-size: 112.5% }`): `xs` 18, `sm` 20.25, `base` 22.5, `lg` 24.75, `xl` 29.25, `2xl` 36. Off-scale sizes seen: 0.9rem (14.4 / 16.2 px), 0.75rem (12 / 13.5 px), 0.8rem (12.8 / 14.4 px), 2.5rem (40 / 45 px), 1.05rem (16.8 / 18.9 px), and fixed px that do **not** scale with the root: 17 px, 14 px, 12 px, 11 px, 54.4 px.

**Caveat.** The debug bridge `window.__DEBUG` is **not present on the deployed build** (`src/debug-bridge.ts` is gated on `import.meta.env.DEV`). Every surface below was reached by clicking real controls; no `openRef`, `openHomedSurface` or `dismissBeats` was available.

## Summary across modules (1920×1080)

| Module | Distinct sizes | Weights | Faces | Max frame depth | Largest element (first eye) | Is it the thing that matters? |
|---|---|---|---|---|---|---|
| Top bar | 2 (16, 18) | 2 (400, 700) | Alegreya Sans + monospace | 2 | none dominant; highest contrast is the date "spring · year 1" (16 px, primary, 13.9:1) | Partly: the date leads, the paused-clock caption is a 16 px italic second line |
| God rail | 2 (16, 22) | 3 (400, 600, 700) | Cinzel ×1, Alegreya Sans | 2 | god name "Vara" 22 px Cinzel; portrait 62×62 | Yes for identity; the essence pools (the spendable state) are all 16 px |
| Ledger rail (Threads + Chronicle) | 5 (16, 17*, 18, 20, 22) | 3 | Cinzel, Alegreya Sans, Alegreya | **4** | "Threads" 22 px Cinzel 700 | No: the 20 px Chronicle prose block is larger than every Thread row; the mortal's name is 17 px and truncated ("KAEL T…") |
| Inspector, person (docked 560) | 5 (14.4*, 16, 18, 26, 32) | 2 (400, 700) | Cinzel, Alegreya Sans | **4** | name 32 px Cinzel | Yes; but body copy is 14.4 px, below the 16 px floor |
| Inspector, person (wide 960) | **7** (12*, 12.8*, 14.4*, 16, 18, 26, 40*) | 2 | Cinzel, Alegreya Sans | 4 | portrait 240×320 and name 40 px | Name yes; the portrait is the largest object |
| Inspector, god (opens wide, 960) | 6 (12*, 14.4*, 16, 18, 26, 40*) | 2 | Cinzel, Alegreya Sans | 3 | portrait 240×320, then "Vara" 40 px | Identity yes; 30 of 58 text elements are 12 px |
| Inspector, place (docked) | 4 (14.4*, 16, 18, 32) | 2 | Cinzel, Alegreya Sans | 3 | name 32 px | Yes |
| Inspector, land (docked) | 5 (14.4*, 16, 18, 20, 32) | 2 | Cinzel, Alegreya Sans | 3 | name 32 px | Yes; one 20 px lead paragraph |
| Inspector, faction (opens wide) | 6 (12*, 14.4*, 16, 18, 26, 40*) | 2 | Cinzel, Alegreya Sans | 3 | name 40 px | Yes; 26 of 51 text elements are 12 px chips |
| Inspector, relic (docked) | 5 (12*, 14.4*, 16, 18, 32) | 2 | Cinzel, Alegreya Sans | 3 | name 32 px | Yes |
| Encounter Stage | 6 (12*, 14*, 16, 18, 20, 54.4*) | 2 (400, 600) | **4**: Palatino Linotype, Alegreya, Alegreya Sans, Cinzel | 4 | drop cap "V" 54.4 px (4.9:1), then 4 card illustrations 208×118 | **No**: the encounter title is 16 px, letter-spaced, ghost colour 5:1 |
| Choice (ascendant beat "A Path Opens") | 6 (11*, 14*, 16, 18, 20, 22) | 2 | **4**: Cinzel, Alegreya Sans, Alegreya, Palatino | 4 | three card illustrations 208×118; title 22 px | Title is centred and largest text; art outweighs it |
| Chapter Ledger (empty state) | 3 (16, 18, 22) | 1 (400) | Cinzel, Alegreya Sans | 3 | "Chapter Ledger" 22 px | Yes |
| Read the Threads (dialog) | 3 (16, 18, 22) | 3 | Cinzel, Alegreya Sans | 3 | "Read the Threads" 22 px | Yes |
| Tooltip (essence, doom) | 1 (16) | 2 (400, 600) | Cinzel heading, Alegreya Sans body | 1 | gold Cinzel heading 16 px | Yes |
| Hover card (place name) | 2 (16, 16.8*) | 1 (700) | Alegreya Sans | 1 | name 16.8 px 700 | Yes, by weight and colour only (sizes differ by 0.8 px) |

`*` = off the six-step scale. At 2560×1440 every module keeps the same count of sizes and weights; rem sizes step up by 1.125, fixed-px sizes (17, 14, 12, 11 px, the Stage drop cap at 61.2) do not.

## Top bar

Screens: [1920](2026-11-01-ui-legibility-census/1920-topbar.jpg) · [2560](2026-11-01-ui-legibility-census/2560-topbar.jpg). Root `[data-testid=game-topbar]`: 1920×48 at 1920; 2560×56 at 2560.

Left to right (1920, x is from the left edge):

| x | Element | Role | Size / token | Weight | Colour | Contrast |
|---|---|---|---|---|---|---|
| 16 | Play, step back, speed "1×", step forward | action / value | 16 `xs` | 400 | primary | 13.9 |
| 156 | "spring · year 1" (line 1) | value | 16 `xs` | 400 | primary | 13.9 |
| 156 | "Time is still. Press Play or Space…" (line 2, truncated at 280 px) | caption | 16 `xs` italic | 400 | secondary | 9.7 |
| 630 | Find field placeholder | value | 18 `sm` | 400 | secondary | 7.3 |
| 1093 | "Ctrl K" | caption | 16, **monospace** | 400 | muted | 4.4 |
| 1304 | "Doom" | label (in a button) | 16 `xs` | 700 | tertiary | 6.7 |
| 1349 | "◈" glyph | value | 18 `sm` | 700 | red `rgb(220,38,38)` (no token match) | 3.9 |
| 1370 | "Strange Whispers" | value | 18 `sm` | 400 | secondary | 9.7 |
| 1550 | "Notables" | label | 16 `xs` | 700 | tertiary | 6.7 |
| 1655 | "Read the Threads" | action | 18 `sm` | 700 | secondary | 9.7 |
| 1836 | "Settings" | action | 18 `sm` | 700 | secondary | 9.7 |

- **Sizes / weights:** 2 sizes (16, 18), 2 weights (400, 700), plus one monospace face.
- **Label vs value:** label-left ("Doom" → glyph → stage name, on one line). The clock block is value-above-caption. One panel, two conventions.
- **First eye:** nothing dominates; the strongest blob is the gold-framed Play button. The thing that decides play next (the clock is paused) is the 16 px italic second line.
- **Frames:** depth 2 (bar → find field). Height 48 px (56 at 2560); the time block stacks two 22 px lines inside it.
- **Rules this bears on:** 1 (the paused state is in the second line), 11 (passes), 12 (16/18 pairs differ by weight — passes), 14 (Play button wins the blur).

## God rail

Screens: [1920](2026-11-01-ui-legibility-census/1920-god-rail.jpg) · [2560](2026-11-01-ui-legibility-census/2560-god-rail.jpg). Root `[data-testid=god-rail]`: 320×1032 at 1920; 400×1384 at 2560.

Top to bottom (1920, *y* from the rail top):

| y | Element | Role | Size | Weight | Colour |
|---|---|---|---|---|---|
| 14–80 | Portrait 62×62 (framed 68×68) | image | — | — | — |
| 19 | "Vara" (god name) | title | 22 `lg` Cinzel | 600 | primary 13.9:1 |
| 56 | "Vara · Quintessence Rooted" | caption + label + value on one line | 16 | 400 / 700 / 700 | tertiary / muted / secondary |
| 81 | "holding, but the seams show" | caption | 16 italic | 400 | muted 5.9:1 |
| 117 | "Your First:" + chip "Kael Thornweaver" | label-left + action | 16 | 400 | secondary / primary |
| 153 | "Essence" … "Primary: Mind" | label + value, 134 px apart | 16 | 700 / 400+700 | tertiary / secondary+primary |
| 189–312 | 8 essence rows, 2 columns: name, number, trend arrow | action | 16 (number 600) | 400 / 600 | primary or muted by pool; arrows `--positive` |
| 345 | "how fast each pool refills" | caption | 16 italic | 400 | muted |
| 386 | first-use caption + "got it" | caption + action | 16 italic | 400 | tertiary |
| 443 | "Your cards" … "0" | label, count right-aligned at x 297 | 16 | 700 | tertiary |
| 479 | "Move", "Investiture" chips | action | 16 | 400 | primary |
| 517 | "No cards yet…" | caption | 16 italic | 400 | muted |
| 892–991 | 4 folded rows: "Reaches Eye · Blinkered", "Mandate Holding", "Signatures 3 yours", "Hooks 11 on you" | label-left + value | 16 | 700 / 400 | tertiary / secondary |

- **Sizes / weights:** 2 sizes (16 ×50 elements, 22 ×1), 3 weights (400, 600, 700). Everything below the name is one size; hierarchy is weight and colour only.
- **Label vs value:** label-left everywhere (Your First, Essence/Primary, folded rows), but the label-to-value gap varies from 8 px (folded rows) to 134 px ("Essence" to "Primary:"). Rule 7 fails on that pair.
- **Spacing:** row gaps 4–14 px through the top half; a **351 px** empty gap between "No cards yet" and the folded rows at tick 0 (the hand region reserves 352 px of free height).
- **First eye:** portrait + name. The spendable state (essence numbers) is 16 px 600, same size as everything else.
- **Frames:** depth 2 (rail → portrait frame / chips).
- **Rules this bears on:** 7 (inconsistent label gaps), 8 (within-group 4–14 px vs between-group 12–14 px: less than 2× in the top half), 11 (passes), 13 (passes: weight/colour carry hierarchy).

## Ledger rail: Threads list and Chronicle

Screens: [1920](2026-11-01-ui-legibility-census/1920-ledger-rail.jpg) · [2560](2026-11-01-ui-legibility-census/2560-ledger-rail.jpg) · Ledger tab: [1920](2026-11-01-ui-legibility-census/1920-chronicle-ledger-tab.jpg) · [2560](2026-11-01-ui-legibility-census/2560-chronicle-ledger-tab.jpg). Root `[data-testid=right-sidebar]`: 340×1032 at 1920; 420×1384 at 2560.

| y | Element | Role | Size | Weight | Colour | Depth |
|---|---|---|---|---|---|---|
| 20 | "Fold" | action | 16 | 700 | secondary | 1 |
| 85 | "Threads" | title | 22 `lg` Cinzel | 700 | primary 14.6:1 | 2 |
| 133 | first-use caption | caption | 16 italic | 400 | tertiary | 2 |
| 178 | "▼ Agents (1)" | label | 16 | 700 | tertiary | 2 |
| 231 | "Kael Thornweaver" (rendered "KAEL T…", truncated) | heading | **17 px Cinzel (fixed px)** | 600 | primary | 3 |
| 242 | monogram "KT" in a 52×52 disc | heading | 17 Cinzel | 600 | primary | 3 |
| 263 | "Asks you" toggle | action | 16 | 400 | secondary | **4** |
| 367 | "Chronicle" | label | 16 | 700 | tertiary | 2 |
| 401 | "World-Soul" → prose | label above value | 16 → 18 Alegreya | 700 → 400 | tertiary → secondary | 2 |
| 519 | tabs "Now", "Ledger" | action | 16 | 700 / 400 | primary / secondary | 2 |
| 565 | "Before you woke" | value (gold heading) | 16 | 700 | `--accent-gold` | 2 |
| 598 | "The elder age (3)" | action | 16 | 700 | tertiary | 2 |
| 625–793 | Chronicle entries | value / prose | **20 `base` Alegreya** | 400 | secondary | 2 |
| 721 | quoted epitaph | caption | 20 italic | 400 | tertiary | 2 |
| 894 | voice toggle "Both / Poet / Witness" | action | 16 | 700 / 400 | — | 2 |

- **Sizes / weights:** 5 sizes (16, 17, 18, 20, 22) and 3 weights at 1920; at 2560 the 17 px name stays 17 px while its neighbours grow to 18–24.75 px, so the mortal's name becomes **smaller than its own labels** (18 px).
- **Two headings conventions in one rail:** "Threads" is a 22 px Cinzel title; "Chronicle" is a 16 px tertiary label; "Before you woke" is a 16 px gold 700 line. Three treatments for three section heads.
- **First eye:** "Threads" title, then the 20 px Chronicle prose block, which is the largest text mass in the rail. The thread entry (the thing the player acts on) is 17 px and truncated.
- **Frames:** depth **4**: rail → Threads panel → thread entry card → "Asks you" toggle frame. The Chronicle panel is depth 2 and its "Open the Chapter Ledger" button depth 3.
- **Spacing:** within the Chronicle 5–10 px; between Threads panel and Chronicle 74 px; between "Threads" title and its first caption 33 px (more than between sections inside the panel, 22 px).
- **Rules this bears on:** 2 (three heading treatments), 8 (title gap > section gap), 9 (depth 4), 11 (5 sizes: fail), 12 (17/18 px adjacent with the same weight at 2560: fail), 14 (prose out-weighs the Thread row).

## Inspector

Root: `aside[aria-label=<subject>]`. Docked is 560 px wide at 1920 (717 at 2560); wide is 960 (1280). Measured screens:

| Page | 1920 docked | 1920 wide | 2560 docked | 2560 wide |
|---|---|---|---|---|
| Person (Kael Thornweaver) | [shot](2026-11-01-ui-legibility-census/1920-inspector-person-docked.jpg) | [shot](2026-11-01-ui-legibility-census/1920-inspector-person-wide.jpg) | [shot](2026-11-01-ui-legibility-census/2560-inspector-person-docked.jpg) | [shot](2026-11-01-ui-legibility-census/2560-inspector-person-wide.jpg) |
| God (Vara) | opens wide | [shot](2026-11-01-ui-legibility-census/1920-inspector-god-docked.jpg) | opens wide | [shot](2026-11-01-ui-legibility-census/2560-inspector-god-docked.jpg) |
| Place (Silverborough) | [shot](2026-11-01-ui-legibility-census/1920-inspector-place-docked.jpg) | [shot](2026-11-01-ui-legibility-census/1920-inspector-place-wide.jpg) | [shot](2026-11-01-ui-legibility-census/2560-inspector-place-docked.jpg) | [shot](2026-11-01-ui-legibility-census/2560-inspector-place-wide.jpg) |
| Land (The plateau at Sacred Grove) | [shot](2026-11-01-ui-legibility-census/1920-inspector-area-docked.jpg) | [shot](2026-11-01-ui-legibility-census/1920-inspector-area-wide.jpg) | [shot](2026-11-01-ui-legibility-census/2560-inspector-area-docked.jpg) | [shot](2026-11-01-ui-legibility-census/2560-inspector-area-wide.jpg) |
| Faction (hold of Witness Skyfield) | opens wide | [shot](2026-11-01-ui-legibility-census/1920-inspector-faction-docked.jpg) | opens wide | [shot](2026-11-01-ui-legibility-census/2560-inspector-faction-docked.jpg) |
| Relic (Mantle of the Unremembered) | [shot](2026-11-01-ui-legibility-census/1920-inspector-relic-docked.jpg) | [shot](2026-11-01-ui-legibility-census/1920-inspector-relic-wide.jpg) | [shot](2026-11-01-ui-legibility-census/2560-inspector-relic-docked.jpg) | [shot](2026-11-01-ui-legibility-census/2560-inspector-relic-wide.jpg) |

**God and faction pages open at the wide size** (960 / 1280 px) and show no Widen control (the measuring script found none; buttons are Back, Forward, Pin, Show on map, Full view, Close). Person, place, land and relic open docked with a Widen control.

### Shared shape (docked, 1920)

| y | Element | Role | Size | Weight | Colour |
|---|---|---|---|---|---|
| 25 | trail: Back / Forward + breadcrumb ("Kael Thornweaver › Mantle…") | action / value | 16 | 400 | secondary; gold when it is a link |
| 70 | kind label ("Shrine-keeper", "City", "Land", "Artifact") — **above** the title | label | 16 | 700 | tertiary 6.2:1 |
| 94 | subject name | title | **32 `2xl` Cinzel** (40 px wide, off-scale 2.5rem) | 400 | primary 12.8:1 |
| 118–200 | thumbnail (person 80×107; place/land/relic 144×81) to the left of the title | image | — | — | — |
| 135–171 | "At [Sacred Grove] in [Dust Hollows] in [The plateau…]" | value + chip actions | 18 words, 16 chips | 400 | secondary / primary |
| 203 | status chips ("Your First", "Intimate", "Foreign") | value | 16 | 400 | secondary |
| 242 | "None of your cards works on …" in a bordered box | caption | 18 italic | 400 | tertiary |
| 310–353 | tabs (person: Overview, Prowess, Attachments, Bonds, **Journey wraps to a second row**) | action | 16 | 700 active / 400 | primary / secondary |
| 396+ | sections: heading + body | see below | | | |

### Section heading and body conventions

| Page | Section heading treatments seen | Body size |
|---|---|---|
| Person | gold 700 16 px with rule ("Disposition toward her"); tertiary 700 16 px with icon ("What she is to him", "On their mind", "Who they are", "Dominion"); a framed card with a 26 px Cinzel title ("Spread the Faith") | **14.4 px** (0.9rem) ×12 |
| God | gold 700 ("Divine nature"); tertiary 700 ("Essence", "Mandate", "Signatures", "Connections"); 26 px Cinzel card title ("Witness Ascendancy") | 14.4 px; **essence and signature chips 12 px 700** (30 elements) |
| Place / Land | tertiary 700 ("Notable", "Before you woke", "Size", "Fortunes", "Its soul"); gold 700 ("In this land", "The land"); secondary 700 sub-heads ("People", "Holder") | 14.4 px; land adds one 20 px lead paragraph |
| Faction | gold 700 ("How they hold her", "Who they are"); tertiary 700 ("Dominion", "Current agenda", "Means", "Purse", "Strongest reaches", "Reputations they hold", "Customs") | 14.4 px; reach and reputation chips **12 px** (26 elements) |
| Relic | gold 700 ("What it means here"); tertiary 700 ("Tags", "Dominion", "Connections"); secondary 700 ("Who") | 14.4 px; tag chips 12 px |

Every Inspector page uses **two or three section-heading treatments** (gold, tertiary, secondary, all 16 px 700) in one panel.

### Per-page counts

| Page | Size | Sizes (px) | Weights | Max frame depth | Labels vs values |
|---|---|---|---|---|---|
| Person docked 1920 | 560 | 14.4, 16, 18, 26, 32 (5) | 400, 700 | 4 (aside → article → "wants most" card / medallions) | kind label **above** the title; section labels above their body; "Who they are" chips inline in prose |
| Person wide 1920 | 960 | 12, 12.8, 14.4, 16, 18, 26, 40 (**7**) | 400, 700 | 4 (aside → article → item card → art) | above, but "Weapons · Mythic" sits **left of** its value with a 239 px gap and "Vestment · Mythic" with 35 px: label-left in the carried-items block |
| Person docked 2560 | 717 | 13.5, 14.4, 16.2, 18, 20.25, 29.25, 36 (7) | 400, 700 | 4 | as 1920 |
| God (wide) 1920 | 960 | 12, 14.4, 16, 18, 26, 40 (6) | 400, 700 (700 ×39 of 58) | 3 | kind label above title ("God" → "Vara"); "Where"/"Who" above chip rows |
| Place docked 1920 | 560 | 14.4, 16, 18, 32 (4) | 400, 700 | 3 | above; in wide, "City" moves **left of** the description (24 px gap) |
| Land docked 1920 | 560 | 14.4, 16, 18, 20, 32 (5) | 400, 700 | 3 | above ("Land" → title; "Its soul" → body) |
| Faction (wide) 1920 | 960 | 12, 14.4, 16, 18, 26, 40 (6) | 400, 700 | 3 | above; reputation chips pair name 12 px 700 + standing 12 px 700 italic inside one chip |
| Relic docked 1920 | 560 | 12, 14.4, 16, 18, 32 (5) | 400, 700 | 3 | above |

- **First eye:** at docked, the 32 px name beside the thumbnail; at wide, the portrait/thumbnail column (240×320 for person and god, 240×135 for the others) with the 40 px name **below** it at *y* 446–458 (God) — the name drops from the top line to the middle of the panel when the page widens.
- **Body below the floor:** every page's main body copy is 14.4 px at 1920 (0.9rem), below the 16 px `--text-xs` floor; chips on god, faction and relic pages are 12 px.
- **Line length (rule 15, characters ÷ rendered lines, approximate):** body paragraphs run 50–91 characters per line at 1920 docked (517 px column at 14.4 px) and up to 90–99 at 2560 wide (679 px column, god and faction pages).
- **Spacing:** inside a section 6 px between heading and body; between sections 19–23 px (about 3–4×: rule 8 passes). The person docked page puts 78 px between the thread-medallion row and the next heading.
- **Rules this bears on:** 1 (wide pages move the name below the portrait), 2 (several heading treatments per panel), 7 (label-left blocks appear only at wide size), 9 (depth 4 on person), 11 (5–7 sizes: fail on every page), 12 (14.4/16 and 12/14.4 pairs are adjacent; many share weight 400), 14 (portrait wins the blur at wide), 15 (over 80 cpl at 2560).

## Encounter Stage

Screens: [1920](2026-11-01-ui-legibility-census/1920-stage.jpg) · [2560](2026-11-01-ui-legibility-census/2560-stage.jpg). Route `?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge`. Root `[role=dialog] section`: 1272×984 at (344, 72) at 1920; 1592×1336 at 2560. Left column 339 px (cast), step column 930 px.

Top to bottom (1920, *y* from the Stage top, *x* from its left):

| y | x | Element | Role | Size | Weight | Face | Colour | Contrast |
|---|---|---|---|---|---|---|---|---|
| 1 | 74 | cast chip "Halda Brenn" / "Bridge Toll Keeper" | action / caption | 16 / 16 italic | 400 | Palatino / Alegreya | `--veil-text-warm` / whisper | 11.5 / 5.7 |
| 25 | 393 | "1 of 1" | value | 16 italic | 400 | Alegreya | `--veil-text-ghost` | 5.0 |
| 78 | 361 | **"THE UNSAFE BRIDGE"** (title, uppercase, letter-spacing 2.24 px) | title | **16 `xs`** | 400 | Palatino | `--veil-text-ghost` | **5.0** |
| 74 | 795 | "UNCERTAIN" forecast pill | value | 16 | 400 | Palatino | gold `rgb(236,208,72)` | 12.9 |
| 80 | 625 | "Star · Charted" skill chip | value | 16 | 600 / 400 | Alegreya Sans | veil gold / warm | 8.4 / 11.5 |
| 113 | 445 | "Stop interruptions" | action | 16 | 400 | Alegreya Sans | primary | 11.7 |
| 159 | 361 | forecast legend, letter-spacing 1.8 px | value | 18 `sm` | 400 | Alegreya Sans | whisper | 5.7 |
| 246 | 361 | stakes line with gold name links | prose | 16 italic | 400 | Alegreya | whisper / gold | 5.7 / 8.4 |
| 316 | 361 | drop cap "V" | value | **54.4 px (fixed)** | 400 | Palatino | warm-dim | 4.9 |
| 312–462 | 361 | scene prose (544 px column, ~67 cpl) | prose | **16 `xs` italic** | 400 | Alegreya | warm | 11.5 |
| 631–955 | 361 | 4 nudge cards 210×324 (5th below the fold of the row) with 208×118 art | action | name 18 Palatino; text 16; sphere 16 Cinzel; cost/odds **14 px fixed** | 400 | mixed | sphere colours | 5–15.6 |
| 825 | 361 | "1 more card below" | action | 16 italic | 400 | Alegreya | whisper | 5.7 |
| 863 | 716 | "Stay silent, let fate answer" (commit) | action | 20 `base` | 400 | Palatino | gold | 8.4 |
| 881 | 361 | remaining essence line | value | 16 | 400 | Alegreya Sans | whisper | 5.7 |
| 923 | 361 | legend "✦ price · ●○ odds · ▼ setback" | value | 16, glyphs **12 px fixed** | 400 | Alegreya Sans | whisper | 5.7 |

- **Sizes / weights:** 6 sizes (12, 14, 16, 18, 20, 54.4), 2 weights; **4 faces** — Palatino Linotype is not one of the three game faces (the veil's own stack resolves to it on this machine).
- **Colour roles:** 15 distinct colours, most of them veil tokens (`--veil-text-warm`, `-whisper`, `-ghost`, `-bright`, `-warm-dim`, `--veil-gold-text`) plus four sphere colours and two untokenised (`rgba(212,196,158,.8)`, `rgba(134,239,172,.9)`).
- **First eye:** the four card illustrations (4 × 208×118, the largest high-contrast blocks), then the 54.4 px drop cap at 4.9:1. **The encounter title is 16 px in ghost colour at 5.0:1**, the lowest-contrast text in the Stage header; the forecast pill (12.9:1) out-shouts it.
- **Prose:** the story text is 16 px italic, smaller than the 18 px letter-spaced UI legend above it. Line length about 67 characters at 1920 (inside 50–75).
- **Frames:** depth 4 (Stage → step column → card → card art). The commit button and forecast pill are depth 3.
- **Spacing:** 196 px empty band between the last prose line and the card row (1920); header rows 6–16 px apart.
- **Rules this bears on:** 1 (title and state are not first), 5 (the stakes line, the one sentence that says what is at risk, is 16 px italic whisper at 5.7:1), 11 (6 sizes: fail), 13 (letter-spacing and Palatino carry hierarchy, not the neutral ramp), 14 (art wins the blur), 15 (passes at 1920).

## Main dialogs

### Choice — ascendant beat "A Path Opens" (1920 only)

Screen: [1920](2026-11-01-ui-legibility-census/1920-choice-a-path-opens.jpg). Reached after `&warm=300` (415 s headless). Root `[role=dialog]` full screen; panel 960×698 at *y* 54.

| y | Element | Role | Size | Weight | Face | Colour |
|---|---|---|---|---|---|---|
| 75 | "A Path Opens" (centred) | title | 22 `lg` | 400 | Cinzel | primary 15.5:1 |
| 128 | "A Path Opens" again, in a banner frame | value | 20 `base` | 700 | Alegreya Sans | primary 14.6:1 |
| 234 | flavour quote in a frame (876 px wide) | prose | 20 italic | 400 | Alegreya | secondary 10.1:1 |
| 368–600 | 3 cards: art 208×118, keyword chips "Change", "Cosmic" (16/700), cost ✦ (14 fixed), name (18 Palatino), text (16, whisper 5:1), rarity "Storied" (**11 px fixed**) | action | 11–18 | 400/700 | mixed | veil tokens |

- 6 sizes (11, 14, 16, 18, 20, 22), 2 weights, 4 faces, depth 4 (dialog → panel → card → keyword chip). The title appears twice (22 px Cinzel, then 20 px 700 banner). The flavour line is 20 px, larger than the card names (18 px) the player chooses between.
- **Rules:** 1, 3 (cards lead with the same chips "Change · Cosmic"), 11, 14.

### Chapter Ledger (empty state, both sizes)

Screens: [1920](2026-11-01-ui-legibility-census/1920-chapter-ledger-empty.jpg) · [2560](2026-11-01-ui-legibility-census/2560-chapter-ledger-empty.jpg). Opened from Chronicle → Ledger tab → "Open the Chapter Ledger". At tick 0 there are no chapters, so only the frame was measured: panel 1280×197 (1600×218 at 2560); title "Chapter Ledger" 22 Cinzel 400 primary; "Threaded chapters · 0" 16 tertiary caption left of the filter chips "Show all" / "Daily life" (16, secondary, framed, depth 3); empty line 18 italic tertiary. 3 sizes, 1 weight. A populated ledger was **not** measured (see Not reached).

### Read the Threads (top-bar dialog)

Screens: [1920](2026-11-01-ui-legibility-census/1920-threads-reader.jpg) · [2560](2026-11-01-ui-legibility-census/2560-threads-reader.jpg). Panel 960×427 (1080×463). Title 22 Cinzel 400; intro 18 italic secondary; "Lookback window" 16 700 tertiary label **above** a 2×2 grid of option buttons (option 18 px, cost "2 essence" 16 muted under it); "Available: 128 essence" label-left (gap 0, inline); commit "Cooldown (one day)" 18 600 on gold. 3 sizes, 3 weights, depth 3 (dialog → panel → option button). Label-above and label-left both used.

## List surfaces

- **Threads list** — measured as part of the Ledger rail (above): one thread entry at tick 0; 17 px Cinzel name, truncated; entry frame depth 3, toggle depth 4.
- **Chronicle** — measured in the Ledger rail at tick 0 (the "Before you woke" prologue). Entries are 20 px Alegreya, secondary colour; group heads 16 px 700 tertiary; the prologue heading gold 700.
- **Notables** — **not reached** (see below).

## Tooltips and hover cards

Screens: essence [1920](2026-11-01-ui-legibility-census/1920-tooltip-essence.jpg) · [2560](2026-11-01-ui-legibility-census/2560-tooltip-essence.jpg); doom [1920](2026-11-01-ui-legibility-census/1920-tooltip-doom.jpg) · [2560](2026-11-01-ui-legibility-census/2560-tooltip-doom.jpg); hover card on a place name [1920](2026-11-01-ui-legibility-census/1920-tooltip-name-hovercard.jpg) · [2560](2026-11-01-ui-legibility-census/2560-tooltip-name-hovercard.jpg).

| Surface | Box (1920 / 2560) | Heading | Body | Sizes | Depth |
|---|---|---|---|---|---|
| Essence row tooltip (`role=tooltip`) | 280×140 / 315×157 | "Mind" 16 Cinzel 600 gold | 16 Alegreya Sans 400 secondary, ~42 cpl | 1 | 1 |
| Doom tooltip | 280×208 / 315×234 | "Breach — Stage 1: Strange Whispers — The First: Call" 16 Cinzel 600 gold, wraps to 2 lines | 16 secondary, ~37 cpl | 1 | 1 |
| Hover card (`data-testid=hover-card`) | 420×167 / 473×179 | kind "Place" 16 700 in `--sphere-darkness-bright` (5.5:1), then name "Silverborough" **16.8 px** 700 primary, then "city" 16 700 tertiary | — | 2 (16, 16.8) | 1 |

- Tooltips use one size; hierarchy comes from face (Cinzel) and colour (gold). The hover card stacks three 700-weight lines whose sizes differ by 0.8 px: kind (sphere colour), name, sub-kind. Kind sits **above** the name (the same order as the Inspector's kind label).
- Hovering a thread-entry button, a folded god-rail row and a nudge card produced no `[role=tooltip]` or hover card within 1.4 s.
- **Rules:** 12 (16 / 16.8 at the same weight: fail by size, passes by colour), 13.

## Not reached

| Module | Why |
|---|---|
| Notables list | The top-bar chip reads "0 notables" at tick 0. On the `&warm=300` world the chip showed 14, but the measuring script's click on `getByRole('button', { name: /notables?$/i })` timed out twice (6 s, behind the warm-start overlay and then the "A Path Opens" dialog, which `Escape` did not close). No URL lever opens it. |
| Chapter Ledger with chapters | The tick-0 ledger is empty. On the warm world the Ledger tab (23 chapters) sat behind the open "A Path Opens" dialog; the tab click timed out. Empty state measured instead. |
| Story beat dialog | No URL lever on the deployed build; `openHomedSurface('story-beat')` needs `window.__DEBUG`, which is dev-only. Three `Space` presses on the warm world all landed on the same ascendant beat. |
| `ChoiceSetModal` (choice_set effect) | Fires only when a choice_set effect resolves in player mode; no lever on prod. The ascendant-beat card choice was measured as the "choices" dialog instead. |
| Choice dialog at 2560 | The warm start takes ~7 min per viewport headless; the 2560 warm run hit its 5-minute wait limit before the world settled (it measured only the "The world moves on" overlay, discarded). |
| Inspector god / faction at docked size | They open wide (960 / 1280 px) and offer no Widen/narrow control; there is no docked rendering to measure. |
| Map-hex tooltip | Lives on the WebGL canvas hover path; not attempted. |

## Headline findings (facts)

1. **Only the top bar, god rail, tooltips, hover card, Read the Threads and the empty Chapter Ledger stay within three sizes (rule 11).** Inspector pages use 4–7 distinct sizes; the Stage and the choice dialog 6; the Ledger rail 5.
2. **Inspector body copy is 14.4 px (0.9rem) at 1920 on every page**, below the 16 px floor; god, faction and relic chips are 12 px (0.75rem); the person wide page adds 12.8 px. None of these is a `--text-*` token.
3. **The Stage title is the faintest text in its header**: 16 px, uppercase, letter-spaced, ghost colour at 5.0:1, while the forecast pill beside it is 12.9:1 and the drop cap 54.4 px. Story prose is 16 px italic — smaller than the 18 px UI legend above it.
4. **The Stage and the ascendant-beat choice use four faces**, including Palatino Linotype, which is outside the three-face system; and fixed-px sizes (14, 12, 11 px) that do not step up at 2560.
5. **Every Inspector page mixes two or three section-heading treatments** (gold 700, tertiary 700, secondary 700, all 16 px). Labels sit above values at docked size; the wide layout introduces label-left blocks (place "City", person carried-items with 35–239 px gaps).
6. **God and faction pages open at the wide size with no Widen control**; at wide size the subject name drops below a 240×320 portrait, so the first line of the panel is the tab row, not the subject.
7. **The Ledger rail nests frames four deep** (rail → Threads panel → thread entry → toggle), names the mortal at a fixed 17 px that is truncated ("KAEL T…") at 1920 and smaller than its 18 px labels at 2560, and gives three different treatments to its three section heads.
8. **Prose line length runs over 80 characters** on the god and faction pages at 2560 wide (90–99 cpl in a 679 px column), and up to ~91 on place/land pages at 1920 docked.

## Constraints and confidence

- One world (`?seeded&size=medium`, Breach doom) at tick 0, plus one warm-start frame. Text content varies by world; sizes, faces, colours and frames come from the components and should not.
- Characters-per-line is total characters ÷ (box height ÷ line-height), so it is ±10 %.
- Colour tokens are matched by exact computed `rgb()`; two veil colours and the doom glyph red have no `:root` token with that value.
- Frame depth counts borders and tinted backgrounds as the browser computes them; a gradient-only background without a border is not counted.
