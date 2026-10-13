> **Decision audit for THR-1833** (wayfinder map THR-1823, *The Map Is the Table*; project UI Visual Overhaul — Design System v1). Design lane run 2026-10-13d, unattended; decided by delegation (process.md rule 4) with a veto invited. Christian chose direction B with **direction C's type system folded in** (chat, 2026-10-11, recorded in the map body), so the faces were agreed; this ticket fixes their roles and proves them on a specimen. Every substrate claim below was measured in this run against `origin/main` at `41497a0d`.

# THR-1833 — The type system

## The decision in one paragraph

The game uses **three faces, each with one job**. **Cinzel names things**: a person, place, power or encounter title, and only at 22 px and up. **Alegreya tells the story**: encounter steps, afterimages, chronicle entries, the land page's prose and card flavour, with its italic for afterimages and flavour. Alegreya replaces Georgia. **Alegreya Sans runs the game**: every label, value, button, choice, card rule, tooltip and map place name. Labels are sentence case and bold at the 16 px floor, never spaced small capitals. Numbers that line up in a column use tabular lining figures. Monospace leaves every player surface. All three faces are SIL Open Font Licence, so a Unity port can bake them into TextMeshPro SDF fonts.

Specimen, real game strings, rendered in this run: [`specimen-1080p.png`](2026-10-13-thr-1833-type-system/specimen-1080p.png) (1920×1080) · [`specimen-1440p.png`](2026-10-13-thr-1833-type-system/specimen-1440p.png) (2560×1440) · source [`specimen.html`](2026-10-13-thr-1833-type-system/specimen.html). The sheet shows Vara's god rail, four chronicle entries, step 1 of *The Beast in the Granary* (`src/data/encounters/the-beast-in-the-granary.ts:126-130, 178, 272`), the *Inspire* card (`src/data/unified-action-templates.ts:562-566`), map labels on Golden Hour colours, and a *Today →* strip comparing each old treatment with the new one. Both renders fit one viewport with no panel overflow (`document.querySelector('.sheet').scrollHeight > innerHeight` → `false` at both sizes).

## What the game has today (measured)

| Fact | Evidence |
|---|---|
| Two faces are declared, and a third (Georgia) is the prose face | `src/index.css:39-47` `--font-display: 'Cinzel'`, `--font-body: 'Alegreya Sans'…`, `--font-prose: Georgia, 'Times New Roman', serif` |
| The written rule says "Never use a third font family", and Georgia already is one | `Docs/design-system/typography.md` § Font Families |
| Georgia / `--font-prose` appears on 85 lines in `src` | `grep -rn "font-prose\|Georgia" src` → 85 |
| Shipped font files: Cinzel variable + Alegreya Sans 400, 400 italic, 500, 700; 124 KB in all. No Alegreya (serif) yet | `ls public/fonts`; `du -ch public/fonts/*.woff2` → `124K` |
| `uppercase` appears 373 times across 117 component files; tracking runs 0.03–0.14em in at least ten different values | `grep -rhoE "uppercase" src/components src/index.css \| wc -l` → 373; tracking census, top values `0.06em ×60`, `0.04em ×56`, `tracking-wider ×47`, `0.08em ×44`, `0.14em ×37` |
| Monospace is used on player surfaces, not only in debug tools | `font-mono`/`monospace` in `DoomBar.tsx`, `DoomClockDetail.tsx`, `EssencePanel.tsx`, `EventLog.tsx`, `MandateTracker.tsx`, `NarrativeFeed.tsx`, `SimulationControls.tsx`, `WorldPulse.tsx`, `HexTooltip.tsx`, `CardFace.tsx`, `IconButton.tsx`, `InfoPanel.tsx`, `NudgePhaseShell.tsx`, `NudgeStageHeader.tsx` and others |
| Only 6 uses of `tabular-nums` exist in `src` | `grep -rhoE "tabular-nums\|font-variant-numeric" src` → `6 tabular-nums` |
| Alegreya Sans' default figures are proportional; `tabular-nums` makes them equal-width, and the game's own woff2 keeps that feature | Measured in the browser at 40 px with `/fonts/alegreya-sans-400-regular.woff2`: default `"1111"` 55 px vs `"0000"` 84 px; with `lining-nums tabular-nums` both 76 px |
| Alegreya Sans has no 600 weight. THR-1831 set city labels to 600, which the browser would fake or round | Google Fonts serves Alegreya Sans at 100, 300, 400, 500, 700, 800, 900; the specimen loaded 400/500/700/800 |
| Two earlier decisions already fixed parts of this: the frame bans uppercase-tracked labels and keeps a 16 px floor; the map labels' sizes and weights are fixed and their face is left to this ticket | `Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md:62`; `Docs/audits/2026-10-11-thr-1831-map-chrome-decision.md:155-170` |

## The calls

### 1. Faces and roles

| Face | Role | Where |
|---|---|---|
| **Cinzel** 600 (variable, shipped) | Names and titles at **22 px and up only** | Inspector page title, the god's name, encounter / Stage title, card name on a full card face, realm names on the map while they are 22 px or larger, screen and dialog titles |
| **Alegreya** 400 / 400 italic / 500 (new) | **Story** | Encounter step prose, afterimages (italic), aftermath prose, chronicle entries, HexChronicle and the land page lede, Codex body, card flavour (italic), premonitions and beat prose |
| **Alegreya Sans** 400 / 500 / 700 / 800 | **Everything the player operates** | Labels, values, buttons, choices and their effect lines, card rules text, hand rows, tooltips, chips, lists, top bar, map place names, realm names below 22 px |

- **A name below 22 px is Alegreya Sans 700**, not small Cinzel. Inside story prose a name stays in Alegreya and takes weight 500 or 700 (the specimen uses 700) so it reads as a link (Law 21).
- **Italic belongs to the story face.** Alegreya Sans italic stays shipped for existing uses but no new UI text takes it (typography.md already reserves italics for narrative text).
- **Three faces replace "never use a third family".** The written rule becomes "one face per role; never a fourth".

### 2. Labels: sentence case, bold, no tracking

What replaces the tiny spaced capitals ("primary", "quintessence") is the frame's rule, extended to the whole game: **Alegreya Sans 700, sentence case, tertiary text colour, 16 px floor, letter-spacing 0**. The specimen's *Essence*, *Attention* and *Quintessence* labels show it. The only tracked text left is Cinzel titles at `0.02em`. Cinzel's own capitals do the work that tracking was doing.

### 3. Numbers

- **Tabular lining figures** (`font-variant-numeric: lining-nums tabular-nums`) wherever numbers line up or tick: essence and Attention counts, costs on cards and hand rows, doom clocks, odds, dates in the chronicle, any table or column.
- **Proportional figures** everywhere else, including inside prose.
- **No monospace on any player surface.** Debug, CMS, the style guide and the UL viewer keep it.

### 4. Prose sits one step above UI text

At the same pixel size Alegreya reads smaller than Georgia (lower x-height; see the *Today →* strip, Georgia 18 px vs Alegreya 19 px still reads a touch smaller). So **story prose sits one step above UI body text**: about 19 px at 1080p and the stepped-up equivalent at 1440p, line-height 1.6, measure about 34em. THR-1819 sets the exact steps.

### 5. Map labels

- **Place names: Alegreya Sans with a dark halo.** THR-1831's sizes stand. Its weights move onto the cuts the face has: **capital 800, city 700, town 500, small 400** (THR-1831 said 700/600/500/400; Alegreya Sans has no 600).
- **Realm names: Cinzel 600, title case, `0.02em`** while they render at 22 px or larger; below 22 px they switch to Alegreya Sans 700, title case.
- The specimen shows all four place sizes at 12–22 px on Golden Hour colours; the 12–14 px small labels stay legible with the halo.

### 6. Files to ship

- Add **Alegreya** 400, 400 italic and 500 as woff2 (the serif's variable file is an alternative if it is smaller), and **Alegreya Sans 800** for capital labels.
- Point `--font-prose` at `'Alegreya', Georgia, serif` so Georgia stays only as the fallback; the 85 existing `--font-prose` uses switch with no per-component edit.
- The type-and-icons plan doc measures the added bytes; the specimen loaded every needed cut from Google Fonts, so availability is proven.

### 7. Port note

Cinzel, Alegreya and Alegreya Sans are published under the **SIL Open Font Licence 1.1**. It allows bundling the fonts in a game and generating TextMeshPro SDF atlases from them. The port ships the licence text in its credits, and the type-and-icons plan doc checks each font's Reserved Font Name clause before it renames any converted file.

## Options weighed

- **Keep Georgia for prose.** Rejected: it is a system font with no matching sans, it renders differently per platform, and it cannot be bundled into a Unity build. Alegreya is the serif sibling of the UI face, so story and interface share proportions.
- **Cinzel for every name at any size.** Rejected: Cinzel has only capitals and small capitals, which at 13–17 px read as a row of spaced caps, the exact problem direction C names.
- **Alegreya SC (true small capitals) for labels.** Rejected: sentence-case bold is already the frame's ruling (THR-1828) and keeps labels readable at the floor.
- **A different label face for the map** (for example a condensed sans). Rejected: a fourth face for one surface; Alegreya Sans at 800/700/500/400 with a halo reads at 12 px in the specimen.
- **Tabular figures everywhere.** Rejected: tabular figures in prose and sentences open visible gaps around 1s.

## Would change the call

- Christian says the story should stay in Georgia, or that names should stay in Cinzel at every size.
- A playtest finds the prose harder to read than today at 1080p. The fix then is THR-1819's prose step, not the face.
- The Unity port finds a licence or SDF-rendering problem with one face. That face is then swapped for the closest OFL alternative.

## Feeds

- **THR-1819** (1440p layout contract): sizes per breakpoint, including the prose step in § 4.
- **THR-1821** (component library and debt ratchet): add a ratchet that lets `uppercase` with tracking, `monospace` on player surfaces, and `Georgia` in components only go down.
- **THR-1831** (map chrome): label weights corrected to 800/700/500/400; label face Alegreya Sans.
- **THR-1828** (screen frame): the faces its rails use.
- **THR-1834** (icon family): icons sit beside Alegreya Sans labels at 16 px.
- `Docs/design-system/typography.md` is rewritten from this record by the type-and-icons plan doc this map hands off at its close, not by this decision.
