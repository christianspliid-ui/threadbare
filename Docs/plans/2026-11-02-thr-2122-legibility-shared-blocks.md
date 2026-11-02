> **title:** Legibility 1 — the shared blocks, the type ladder and the spacing rhythm, in canon and in `Section` (THR-2122)
> **linear_issue:** THR-2122
> **author:** Claude Code (design lane, unattended, 2026-11-02 — run dl-20261102T1118)
> **created:** 2026-11-02
> **three_pillars:** Engine N/A — no file under `src/engine/` or `src/types/` changes; the `gold` field stays and Detail sections stop drawing it · Content N/A — no sentence changes; one count format changes ("Retinue (3)" → "Retinue · 3") · UI done

# Legibility 1 — the shared blocks, the type ladder and the spacing rhythm (THR-2122)

*Every Inspector section, and the three section-heading spellings, are drawn by two files. Fix them once, write the rules into canon, and the other three legibility plans build on one block set instead of four.*

## Why this is load-bearing

Christian set this period's focus in chat on 2026-11-01: *"legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels"*. The closed map [UI legibility and usability](https://linear.app/threadbare/issue/THR-2114) decided the rules. This is the first of its four plan docs, and it blocks the other three: [Inspector pages](https://linear.app/threadbare/issue/THR-2123), [the Stage and dialogs](https://linear.app/threadbare/issue/THR-2124), and [the rails, lists and hover tier](https://linear.app/threadbare/issue/THR-2125).

Measured on `main` @ `fd15490d`:

- **`src/components/shared/Section.tsx` (702 lines) has 48 px literals and 0 `var(--space-*)` uses.** That is `grep -o -E "'[0-9]+px'|[0-9]+px [0-9]+px" … | wc -l` → 48 and `grep -c "var(--space"` → 0. The census counted 39 spacing literals; the other 9 are sizes such as the pole marker. Sections sit 20 px apart (`marginBottom: '20px'`, 9 renderers), and a heading sits 6 px over its body.
- **Seven off-scale sizes below the 16 px floor:** `'0.9rem'` (`:142` prose body, `:621` portrait body), `'0.75rem'` (`:209` chip), `'0.85rem'` (`:319` event prose), `'0.8rem'` (`:351` facts row, `:376` pole row, `:643` triggers).
- **The facts row pushes its value to the far edge** (`:345` `justifyContent: 'space-between'`). The census measured 35 px and 239 px label-to-value gaps in one block.
- **Three section-heading spellings.** `SectionLabel` (`Section.tsx:34`) heads every Inspector section. `SectionHeading` (`shared/SectionHeading.tsx`, the `.section-heading` class, count as `(3)`) has 6 non-test importers. `HandSection.tsx:72` keeps a local `labelStyle` and pushes its count to the far edge (`:236` `marginLeft: 'auto'`).
- **Gold section headings come from three engine view sites,** all `gold: true` (`factionRows.ts:107`, `placeRows.ts:121`, `subjectPage.ts:478`). The links-group sub-head is a third rank in secondary colour (`Section.tsx:436`).
- **No test pins these styles.** A grep of `*.test.tsx` for `space-between|marginBottom|'20px'|0.8rem|0.75rem|data-section-label|section-heading-gold` hits only three unrelated files. `SectionHeading.test.tsx:14` asserts the `Retinue (3)` text and is updated below.
- **Canon describes a heading nobody draws.** `primitives.md` § 1 says `--font-display`, uppercase, 0.12em tracking. `index.css:649` `.section-heading` already follows the label rule.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Detail-page section model (`shared/Section`, `types/detailPage.ts`) | 🟢 ACTIVE | extends: tokens, ladder, facts grid; no new kind |
| Shared primitives (`SectionHeading`, `SectionLabel`) | 🟢 ACTIVE | extends: `SectionLabel` gains `count` and `as`; `SectionHeading` delegates |
| Type and spacing tokens (`index.css`, `layoutContract.ts`) | 🟢 ACTIVE | extends: one token, `--measure-ui` |

## Decisions this plan builds on

All three were decided by the design lane under delegation (process.md rule 4) on 2026-11-01. They passed their 12 h veto windows with no veto; the youngest closed at 2026-11-02T11:25:29Z.

- [Type hierarchy](https://linear.app/threadbare/issue/THR-2118/type-hierarchy-can-a-player-tell-title-heading-value-and-label-apart) ([audit](../audits/2026-11-01-ui-type-hierarchy.md)): § 3.1 the ladder, § 3.2 one heading treatment, § 3.4 `--measure-ui: 26em`.
- [Text positions](https://linear.app/threadbare/issue/THR-2119/text-positions-where-labels-values-numbers-and-captions-sit) ([audit](../audits/2026-11-01-ui-text-positions.md)): rule 1 the facts block, rule 3 counts after their heading, rule 6 chips after the row name. Its rule 5 token is superseded by THR-2118 § 3.4.
- [Modules and composition](https://linear.app/threadbare/issue/THR-2120/modules-and-composition-the-small-set-of-blocks-every-panel-is-built) ([audit](../audits/2026-11-01-ui-modules-and-composition.md)): § 1 the seven blocks, § 2 the three distances, § 3 frames, § 4 the same block everywhere.

**Decided in this plan** (lane, under the same delegation, as consequences of the above):

1. **A pole bar's first pole word sits in the facts block's label column**, right-aligned on the seam. The track, the second pole word and the leaning word sit in the value column. Today's pole row already right-aligns that word (`:378`), so the row keeps its look and the block keeps one seam (THR-2119 rule 2).
2. **Facts rows lose their per-row gold rule** (`:350`). Rows are grouped by space (THR-2120 § 3). On a two-column grid the line would also cross the seam.
3. **An `event-card` section is framed only while it opens something** (`clickable`). Unclickable, it is a section like any other (THR-2120 § 3: "a box only for a thing you press").
4. **A count reads "Retinue · 3": words, a middle dot, tabular figures, no brackets.** It sits beside its words (THR-2119 rule 3, THR-2120 § 1), never at the far edge. The dot is the form the links-group sub-head already draws ("Allies · 3", `Section.tsx:437`), so the game ends up with one count form instead of three. A bare "Rival gods 2" could read as part of a name. This applies to `SectionHeading`, `SectionLabel` and the hand. **When a count shows stays as it is today.** A heading shows any count its caller passes, 0 and 1 included. That is today's `SectionHeading` behaviour (`SectionHeading.test.tsx:32` pins a count of 0), and the hand shows "0" today. The links-group sub-head keeps its `total > 1` rule (`:437`). It is a Text row over a group whose single row sits right under it, not a heading, so "Allies" over one ally needs no "· 1". The form is one; whether to show it stays the caller's choice, as it is now.

## UI pillar

Screenshot tool: Playwright (DOM surfaces only; nothing here is WebGL).

### U1 — `Section.tsx`: one shell, tokens, the ladder

1. **One local shell.** Add an unexported `SectionShell({ section, shape, children })` that draws `<LabelOf>`, then the body, with `marginBottom: 'var(--space-6)'` and `data-section-shape`. All nine renderers use it, so the between-block distance lives in one line. This is not a new primitive (THR-2120 rejected a `Block` family). `PortraitSectionRenderer` keeps its side-by-side layout inside the shell.
2. **The three distances.** Between sections: `--space-6`. Heading to body, and rows inside a block (`gap` on chip rows, link rows, event lists, triggers, tile grids): `--space-2`. Label to value, and picture to words (`HighlightBlock` gap, portrait gap): `--space-3`. Framed blocks pad `var(--space-2) var(--space-3)`. The tile-art bleed is recomputed from those tokens (`calc(100% + 2 * var(--space-3))`, negative margins to match).
3. **The ladder** (THR-2118 § 3.1). Prose body `0.9rem` → `--text-sm`. Portrait body → `--text-sm`. Event prose `0.85rem` → `--text-sm`. Chip `0.75rem` → `--text-xs`. Facts label → `--text-xs` (the label rule: 700, tertiary). Facts value → `--text-sm`. Pole words → `--text-xs`, leaning word → `--text-sm`. Triggers `0.8rem` → `--text-sm`. `HighlightBlock` headline `--text-xl` → `--text-lg`. `lede` stays `--text-base`.
4. **The measure** (THR-2118 § 3.4). `body` prose, portrait body and event prose take `maxWidth: 'var(--measure-ui)'`. `lede` and `quote` take `--measure-prose`.

### U2 — the facts block (`panel` kind)

`PanelSectionRenderer` becomes a CSS grid: `gridTemplateColumns: 'max-content minmax(0, 1fr)'`, `columnGap: var(--space-3)`, `rowGap: var(--space-2)`, `alignItems: 'baseline'`. Labels: `justifySelf: 'end'`, `textAlign: 'right'`. There is no `space-between` and no row border. A pole row puts `poles[0]` in the label cell and the rest in the value cell (decision 1). `PanelValue` is unchanged. Its identity chip and meter sit in the value cell.

### U3 — one section heading

1. **`SectionLabel` is the implementation.** It gains `count?: number` (rendered as `{label} · {count}` whenever `count` is a number, 0 and 1 included; figures tabular, same style as the label; decision 4) and `as?: 'div' | 'h2' | 'h3' | 'h4'` (default `div`). Its bottom margin moves to the shell (`--space-2`); a caller outside `Section` passes no margin and the parent spaces it, as `SectionHeading` already says. The R2 icon gap becomes `var(--space-2)`.
2. **Detail sections draw no gold.** `LabelOf` passes `gold={false}` and drops the `tier` underline, with a one-line comment citing THR-2118 § 3.2. `Section['gold']` stays in `src/types/detailPage.ts`, untouched (NFP 6), and keeps feeding the styleguide. The `gold` prop on `SectionLabel` stays for callers outside Detail sections (see Grey zones).
3. **`SectionHeading` delegates.** It renders `<SectionLabel as={as} count={count} icon={icon} label={children}>` and keeps the `.section-heading` class name for the CSS hook. `ornamental` keeps its `.ornamental-rule` wrapper (ornamental use is out of scope, THR-2118 § 3.2). Its `children` type narrows to `string`. If a caller passes JSX, keep `ReactNode` and widen `SectionLabel`'s `label` to match. There are 64 call sites (`grep -rn "<SectionHeading" src --include=*.tsx`, tests excluded): 11 in game code, the rest in the style guide.
4. **The hand delegates.** `HandSection.tsx`'s "Your cards" heading becomes `SectionLabel` with `count={cards.length}` inline. `labelStyle` stays only for the per-sphere group toggles (`:306`), which are buttons, not headings.
5. **The links-group sub-head** (`Section.tsx:436`) becomes a Text 700 row (`--text-sm`, primary, `marginBottom: var(--space-1)`), not a second label rank (THR-2118 § 3.2). Its "Allies · 3" text is unchanged.

### U4 — the token

Add `--measure-ui: 26em;` beside `--measure-prose` in `src/index.css`. Add `MEASURE_UI_EM = 26` beside `MEASURE_PROSE_EM` in `src/components/shared/layoutContract.ts`, with parity asserted in `layoutContract.test.ts` the same way `MEASURE_PROSE_EM` is.

### Player-facing display

Every Inspector page changes. Gaps grow (24 px between sections, 8 px under a heading). Body and chips grow to 18 / 16 px. Facts sit in a two-column block with labels flush against values. Gold headings and their rules are gone from the faction description, place prose and "Who they are". Body lines stop at about 70 characters. Panels, the Codex, Chronicle, Notables, Rivals and Threads headings read "Name · 3". The hand reads "Your cards · 2" with the count beside the words.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| `SectionHeading` with a count (Notables "Rulers", Rival gods, Chronicle groups, Threads) | "Rival gods · 2", "Rulers · 3" (today "Rival gods (2)", "Rulers (3)") | PC-1 (an unexplained Notables count, [THR-1860](https://linear.app/threadbare/issue/THR-1860)) | The dot form already means "how many" under the links groups ("Allies · 3"), and the count equals the rows directly below. "Rival gods" also carries its existing heading tooltip (`ui.rival_panel`). No other count heading has a tooltip today, and this plan adds none. Explaining what a Notables group *is* belongs to PC-1 work, not this slice |
| Count edge cases | A Notables group with one ruler: "Rulers · 1" (today "Rulers (1)"). The hand with no cards: "Your cards · 0" (today "Your cards" … "0"). A links group with one ally: "Allies" (unchanged) | PC-6 (the same fact shown the same way) | Every heading count reads "words · n", as it already shows today. Only the links group hides a lone 1, as it does today |
| The hand heading | "Your cards · 2", count beside the words (today "Your cards" … "2" at the rail's right edge) | PC-1 | The count is read with its words and equals the cards listed below. The heading keeps its existing tooltip |

No other words change.

### UI Laws engaged

Law 1 (identity chips stay in facts values), Law 13 (no numeral added; counts already exist), Law 16 (the facts block is the sanctioned shape, not a label strip), Law 17 (section tooltips untouched), Law 21 (link rows untouched), Law 27 (one rule in one place: one heading implementation), Law 31 (the page's one gold is the R5 highlight), Law 33 (the larger gaps must not push the docked Inspector off-screen at 1920×1080), Law 37 (chrome unchanged), Law 57 (the facts gap no longer grows with panel width), Law 58 (sections built from the shared shape only).

### Playtest signal

A tester reading a person page can say which value belongs to which label without tracing across the panel. No tester's log mentions text "too small to read" on the Inspector.

### Event notifications · Debug inspection · Visual presence (HexMapV2)

None. No event, no `window.__DEBUG` accessor, nothing on the map.

## Canon pillar (docs that land in the same PR)

1. **`Docs/design-system/typography.md`**: new § *The ladder* after § Type Scale. It holds the THR-2118 § 3.1 table (Title / Headline / Text / Label / Story by panel kind), the three-sizes-per-panel rule, `--text-xl` reserved for dialog and Stage titles, and § 3.2 (one heading treatment, gold and secondary sub-heads retired from Detail sections). Add `--measure-ui` to § Type Scale's prose bullet. In § The label rule, `.section-heading-gold` is noted as ornamental only.
2. **`Docs/design-system/layout.md`**: add `--measure-ui` to the § Panel Padding table (26em, UI text of 3+ lines). Add § *Spacing rhythm* (the three distances table, THR-2120 § 2) and § *Frames* (THR-2120 § 3: a box only for a whole pressable object plus the one Now highlight, depth ≤ 2, controls do not count). Add § *Facts block* (THR-2119 rule 1 and the decision 1 pole row).
3. **`Docs/design-system/primitives.md`**: rewrite § 1 SectionHeading. It becomes a wrapper over `SectionLabel` with the label rule (Alegreya Sans 700, sentence case, tertiary, `--text-xs`, no transform, no tracking) and the "Retinue · 3" count. Add § *Blocks* (the THR-2120 § 1 seven-block table and the five body shapes) above the Usage Decision Tree.
4. **`Docs/design-system/component-selection.md`**: in "Show entity details", point to the seven blocks. Add an anti-pattern: **a box around a section**. Sections group by space and their heading, and a frame is only for a thing you press.

## Engine pillar

N/A. No file under `src/engine/` or `src/types/` changes. The three `gold: true` view sites stay as they are, and the renderer stops drawing the field. That keeps this a UI-only PR under 400 non-test lines, outside the review gate's scope (THR-1949).

## Content pillar

N/A. No sentence, label or tooltip string changes. The only text change is the count format (Player-facing text above), which is a rendering rule, not content.

## Interface impact

| Contract | Disposition |
|---|---|
| Detail page view model → `Section` (`src/types/detailPage.ts`) | preserve: same fields; `gold` read nowhere in Detail rendering |
| `SectionLabel` export (FactionSheet, InspectorParts) | extend: optional `count`, `as`; existing props unchanged |

No cross-system read or write is added. `Docs/canon/interface-map.md` is unchanged.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `Section.tsx`, `SectionHeading.tsx`, `HandSection.tsx`, `index.css`, `layoutContract.ts` | none | every Inspector page, 6 `SectionHeading` importers, the god rail hand | none | none | `?view=inspector-lab` shows every section kind |

The executor checks the Design Reference Wiki page whose `sources` include `src/components/shared/Section.tsx` and updates it, since this is not behaviour-neutral.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `--measure-ui` / `MEASURE_UI_EM` | `26em` / `26` | UI text that wraps to 3+ lines: about 70 characters of Alegreya Sans at any root |
| Between-block distance | `--space-6` (24 px) | existing token; the fallback is `--space-5` (see Kill criteria) |
| Heading-to-body / in-block row gap | `--space-2` (8 px) | existing token |
| Label-to-value / picture-to-words gap | `--space-3` (12 px) | existing token |

## Tracing

N/A — a presentation change; nothing new happens in the simulation to trace.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A facts row with an empty `left` | The label cell renders empty; the value keeps its column |
| A pole row with a non-finite `meter` | Existing guard: it renders as a plain facts row |
| `--measure-ui` undefined (an old stylesheet) | `maxWidth` resolves to `none`; text runs full width as today |
| A `SectionHeading` caller passing JSX children | Keep `ReactNode` (U3.3); never cast |

## Kill criteria

If the docked person Inspector page at 1920×1080 scrolls where it did not before because of the 24 px gaps (Law 33), the between-block distance drops to `--space-5` in the shell's one line (THR-2120 "Would change the call"). Record the measurement in the PR.

If a playtest shows players miss sections whose 16 px headings sit over 18 px body, THR-2118 § 5's fallback applies: the same label rule at `--text-sm`, a one-line change in `SectionLabel`.

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar N/A with rationale
- [x] UI pillar present (U1–U4, plus the canon edits)
- [x] Wiring section connects them (one row, the wiki page)

## Vision audit

- [x] No Vision premise is contradicted. Non-negotiable #3 (mechanics through prose) holds: no word changes and no number is added. Story prose keeps its face and measure.
- [x] No Vision edit is needed. This serves the period focus: a panel a player reads at a glance. The taste profile's "Prose-first UI, no numbers visible" (vault `Vision/taste-profile.md`) holds: the only figures are counts that already exist.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-02-thr-2122-legibility-shared-blocks-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | 48 literals become tokens; the one new number is a named token with a TS mirror |
| 2. Inspectability | PASS with note | No trace; `?view=inspector-lab` shows every kind |
| 3. Determinism | PASS | No random code |
| 4. Fail-soft | PASS | Fail-soft table above |
| 5. Narrative over mechanical perfection | PASS | Story prose keeps its face and measure |
| 6. Additive over destructive | PASS | `gold` field kept; `SectionLabel` gains optional props; no export removed |
| 7. Performance budget | N/A | Style values only |

## Done when

- [ ] `grep -n -E "'0\.(9|85|8|75)rem'" src/components/shared/Section.tsx` prints nothing, and `grep -c "space-between" src/components/shared/Section.tsx` prints `0`.
- [ ] Every spacing value in `Section.tsx` is a `var(--space-*)` token. The remaining px literals are sizes (pole marker, track height, portrait box), each named in a comment.
- [ ] A new test, `src/components/shared/__tests__/sectionLegibility.thr2122.test.tsx`, renders one section of every kind. It asserts: no element's inline `fontSize` is a rem literal below `1rem`; the `panel` body is `display: grid`; a `gold: true` section's label is not `var(--accent-gold)`; a `SectionHeading` with `count={3}` reads "Retinue · 3", with `count={0}` reads "Empty · 0", and with no `count` reads "Retinue" alone. `SectionHeading.test.tsx` is updated to match.
- [ ] `HandSection.tsx` imports `SectionLabel`, and its count is no longer pushed by `marginLeft: 'auto'`.
- [ ] `--measure-ui` is in `index.css`, `MEASURE_UI_EM` is in `layoutContract.ts`, and parity is asserted.
- [ ] The four canon files carry the sections listed under Canon pillar.
- [ ] Browser evidence (UI pillar, visible change): 1920×1080 screenshots of `?view=inspector-lab` on a person page and a place page, and one at 2560×1440 (a type token changed). Plus console output with no new errors, a DOM assertion (`getComputedStyle` on a facts label shows `text-align: right`), and a UI-Laws judgment line for Laws 1, 13, 16, 17, 21, 27, 31, 33, 37, 57, 58.
- [ ] `npm run gate` green.
- [ ] Closing commit body includes the close keyword for this ticket on its own line.

## Coordination block

**Suggested model:** opus. One file carries most of the change, and the grid and the tile-art bleed need care.
**Parallel-safe with:** [the aftermath and the mortal's sheet disagree](https://linear.app/threadbare/issue/THR-2139), [chapter-screen faults](https://linear.app/threadbare/issue/THR-2140), [the live map moves under the player's hand](https://linear.app/threadbare/issue/THR-2141), and the story-text tickets THR-2108 / 2109 / 2110 (data files only). None touches `Section.tsx`, `SectionHeading.tsx` or `HandSection.tsx`.
**Mutex with:** [six small faults from round 6](https://linear.app/threadbare/issue/THR-2142) if its "Needs-you pill" or right-rail fixes touch `HandSection.tsx`. Anything editing `shared/Section.tsx` or `shared/SectionHeading.tsx`.

**Files to touch:**
- Create: `src/components/shared/__tests__/sectionLegibility.thr2122.test.tsx`.
- Edit: `src/components/shared/{Section,SectionHeading,layoutContract}.tsx|ts`, `src/components/shared/__tests__/{SectionHeading,layoutContract}.test.*`, `src/components/Game/frame/HandSection.tsx`, `src/index.css`, `Docs/design-system/{typography,layout,primitives,component-selection}.md`, the matching Design Reference Wiki page.

## Notes for the executor

- **Grey zones:** `InspectorParts.tsx` draws the Act row heading (`:72`) and the index title (`:158`) with `gold={true}`. They are not Detail sections, so this plan leaves them. Legibility 2 (Inspector pages) decides them. Do not change them here.
- The tile caption rule (THR-2119 § 4, label under the tile) is not in this slice. Tiles are cards, and card faces keep their layout.
- The three depth-4 frame removals (Ledger rail, Stage step column, choice dialog) are Legibility 3 and 4.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Tunability PASS: the literals become tokens, and the new token has a TS mirror and parity test. Inspectability PASS-with-note: no trace; `?view=inspector-lab` shows every kind. Determinism PASS. Fail-soft PASS (four-row table). Narrative PASS. Additive PASS-with-note: no export removed, but visible behaviour goes: the gold Detail headings, the facts-row rules and the "(3)" brackets. Performance N/A. The auditor could not read `wiring-checklist.md` whole (532 KB), so it relied on the wiring table.

**Answer:** the visible removals are the decided rules themselves (THR-2118 § 3.2, THR-2120 § 3). The `gold` field and every prop stay, so reverting is one renderer change.

### Three-pillar audit

PASS. Engine N/A with rationale; Content N/A with rationale; UI present and substantive (U1–U4, an exact-text table, playtest signal, laws, screenshot tool). The wiring is adequate for a UI-only change. No required section is missing.

### Vision audit

PASS-with-notes. No contradiction. The plan confirms the non-negotiables (narrative over mechanical perfection) and the taste profile (prose-first UI; no new numeral). Soft note: cite the Vision file the plan relies on.

**Answer:** the Vision audit now cites `Vision/taste-profile.md` "Prose-first UI, no numbers visible".

### Intent-judge verdict

**Allow** on the third run (impact class Reversible, judge-confirmed; 0 GAPs, 0 VIOLATIONs).

- Run 1, Revise. Dimension 12: the count format touched PC-1 but was marked "none", and a bare "Rival gods 2" reads weakly as a count. Dimension 10: the second kill criterion was in the proposal only. Fixed: decision 4 now takes the "· n" form already used by the links groups, PC-1 is answered in the text table, and the kill criterion was added.
- Run 2, Revise. Dimension 12 (PC-6): the 0 and 1 cases were unstated. Fixed: a heading shows any count its caller passes (today's behaviour), the links group keeps hiding a lone 1, the edge-case samples are in the table and the Done-when asserts the 0 case.
- Run 3, Allow. Optional note taken: Laws 27 and 58 were added to the Done-when judgment line.
