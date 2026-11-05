> **title:** The rail rows say what they are — plain summaries on the folded god-rail rows, a definition line when one opens, "Dominion" named in its own caption, and empty Doom counters hidden (THR-2175, slice 1)
> **linear_issue:** THR-2175
> **author:** Claude Code (design lane, unattended, 2026-11-05 — run dl-20261105-2019)
> **created:** 2026-11-05
> **three_pillars:** Engine done (one view-model summary string, no rule) · Content done (player-facing words, listed exactly) · UI done

# The rail rows say what they are (THR-2175, slice 1)

*Warm testers read the god rail's folded rows as "Reaches: Eye · Blinkered, Mandate: Holding, Signatures 3, Hooks 11. No idea." Almost every one of those words already has a hover. Nobody hovered. The fix is the standard settings-panel pattern: the collapsed row's summary says in plain words what the number counts, and an opened row starts with one muted sentence saying what it is for. The caption that explains Dominion now says "Dominion", so it stops reading as the meaning of Reach. Doom counters that are zero leave the Doom panel, the way its Speed modifier row already does.*

## Why this is load-bearing

[Warm playtest round 3](https://linear.app/threadbare/issue/THR-2175), 3 of 3 testers: each "Things I never understood" list is mostly these words. This class has now recurred six times ([THR-2143](https://linear.app/threadbare/issue/THR-2143) and the five before it). Each earlier fix added a hover or a first-use caption, and this round shows why that did not hold for the mid-game. A warm player arrives with every panel already open, so the captions do not come one at a time, and players do not hover a label they have not been told is a question. Christian's period focus (chat, 2026-11-01): *"legibility and usability of the different UI modules: are we using tried and true ux patterns for how humans read UI panels"*.

## Substrate inventory

Measured on `main` @ `90221547`, 2026-11-05.

| Surface | What the player reads today | Hover today |
|---|---|---|
| Reaches row | "Reaches" + `{reach} · {tier}`, e.g. "Eye · Blinkered" (`GOD_RAIL_ROW_SUMMARIES.reaches`, `data/frame-content.ts:130`) | `ui.reaches` (`ui-content.ts:1335`) |
| Mandate row | "Mandate" + the trend word "Holding" / "Kindling" / "Cooling" / "Drifting" (`MANDATE_TREND_WORD`, `data/ascendant-bar-content.ts:121`) | **none** (`tooltipId: null`, `data/frame-registry.ts:146`) |
| Covenants row | "Covenants" + "{n} held" (`frame-content.ts:131`) | `ui.covenant` |
| Signatures row | "Signatures" + "{n} yours" (`frame-content.ts:132`) | `ui.signatures` (`ui-content.ts:315`) |
| Hooks row | "Hooks" + "{n} on you" (`frame-content.ts:133`) | `ui.hooks` (`ui-content.ts:319`) |
| Reaches body, opened | the Reaches list, then two first-use captions: `reaches` *"What you can do, and how well…"* and, once Dominion is revealed, `dominion` *"How much a place or person is already yours. Your own ground costs less."* (`godRailComponents.tsx:143-150`, `first-use-captions.ts:62`) | — |
| Doom panel | "Counter-omens 0" and "Doom debt 0" always drawn (`DoomClockDetail.tsx:202-213`); "Speed modifier" drawn only when it is not ×1.00 (`:215`) | `ui.counter_omens`, `ui.doom_debt` (`ui-content.ts:1361-1368`) |

Three things follow from the measurement:

- **The hovers exist; the rows do not explain themselves.** Five of six rows have a hover. The label is the only hover target (`AscendantBar.tsx:133`, `focusable={false}`), and the summary beside it is a bare number or an unlabelled word.
- **"Hooks · 11 on you" is wrong as well as unclear.** The hover says hooks are *"Marks, clues and vows that tie you to something unfinished"*. "On you" reads as a threat, and the ticket's own suggested wording ("ways rivals can reach you") made the same mistake. The summary has to follow the hover.
- **"Reach" has one meaning in the UL, and the screen gives it two.** UL `Cosmology.md` § Reach and canon keep Reach (what you do) apart from Dominion (how much a place is yours). The tester's second meaning is the `dominion` caption, which shows inside the Reaches body with no word naming it. That is a placement and naming fault, not a terminology one.

## Decisions (made by the design lane under delegation, 2026-11-05 — veto in chat)

1. **Each folded row's summary says what it counts, in words.** It stays one line, at most `GOD_RAIL_SUMMARY_MAX_CH` (24) characters, and every value comes from state (Law 56). See the text table below. This is the collapsed-section summary used in settings panels and inventory screens: a label, then what is inside it.
2. **An opened folded row starts with one muted sentence saying what the row is for.** It is the row's hover sentence, from the same registry entry, so the two never drift apart (one source). This is the helper-text line under a panel heading. It shows every time the row is open, not only on first use, because a warm player has no "first use". While the row's own first-use caption is showing, the line is not drawn, so the same idea never appears twice.
3. **The Mandate row gets the hover it lacks** (`ui.mandate`), worded from its first-use caption and the tracker's hover.
4. **The Dominion caption names its word:** *"Dominion: how much a place or person is already yours. Your own ground costs less."* That is 15 words, inside the caption rule. It stays where it is. A caption that names its subject cannot be read as the definition of the row it sits in.
5. **The Doom panel hides Counter-omens and Doom debt while they are 0**, as it already hides Speed modifier at ×1.00. A zero modifier is not news. Each row comes back, with its hover, the moment it is not zero.
6. **A UL rule, filed as a `UL-proposal`:** player-facing text never uses "Reach" for the god's hold on a place or person; that is "Dominion". The same proposal seats the player-facing **Hook** (a mark, clue or vow tying the god to something unfinished) apart from the authoring alias Trait Hook (`Traits.md` § Trait Hook). This puts into the glossary the rule this slice applies, so later text keeps to it.

Rejected, one line each: **renaming Hooks or Signatures.** The words are canon, and once they carry a summary and a definition they can be learned. **Opening every row by default.** That takes the hand's room, which [the god-rail hand room plan](https://linear.app/threadbare/issue/THR-2177) just won back. **Re-running every first-use caption on a warm arrival.** That needs the arrival card from [no recap when you come back](https://linear.app/threadbare/issue/THR-2173), which does not exist yet, so it belongs to that ticket's plan. **A "?" glyph on each row.** An icon that carries meaning alone breaks Law 11, and it is a second hover target.

**Not in this slice:** rank words with no scale (Formidable, Handy, Destined) and the small numbers beside people and halls on the mortal sheet. The ticket gives no direction for them, and they are a different surface (the Inspector), so they are filed as their own design request in this milestone. Card pips are already designed in [every card says what it buys](https://linear.app/threadbare/issue/THR-2146). Omen and Doom stage names ("Fissure Winds", "Borrowed Voices") are story titles. The chip's hover (`ui.omen`, `ui.doom_bar`) already says what an Omen and the Doom are.

## Content pillar

The exact words:

| Surface | Today | After | Complaint class |
|---|---|---|---|
| Reaches summary | "Eye · Blinkered" | "Main: Eye · Blinkered" (template `Main: {reach} · {tier}`, the archetype's primary Reach as `godRail.ts:330` picks it; not "Best", because a grown secondary Reach can outrank it. Over 24 characters it steps down `GOD_RAIL_REACH_SUMMARY_STEPS`: `Main: {reach} · {tier}`, then today's `{reach} · {tier}`, then `{tier}`. Measured: 8 of the 40 Reach×tier pairs (e.g. "Eye · Before It Happens", "Shadow · Unremembered") need the second step, and none needs the third) | PC-1 (unexplained terms) |
| Mandate summary | "Holding" | "Goal · Holding" (template `Goal · {trend}`, the same `MANDATE_TREND_WORD` table) | PC-1 |
| Covenants summary | "2 held" | "2 held · upkeep" (one: "1 held · upkeep") | PC-1 (unexplained resources) |
| Signatures summary | "3 yours" | "3 settled" (one: "1 settled"), the hover's own verb ("the powers your Reaches have settled into"). Not "powers": UL `Traits.md` § Power holds that word | PC-1 |
| Hooks hover, second sentence (`ui.hooks`) | "Each one points at a thread you can still pull." | "Each one points at something you can still finish." ("thread" is the god's bond to a mortal) | PC-1 |
| Hooks summary | "11 on you" | "11 unfinished" (one: "1 unfinished") | PC-1, and the wrong-threat reading |
| Opened-row line | — | the row's `desc` from its registry entry, first sentence only, e.g. Hooks: *"Marks, clues and vows that tie you to something unfinished."* | PC-1 |
| Mandate hover (new `ui.mandate`) | — | label "Mandate"; desc *"What you are working toward, racing the doom. Keep a checkpoint well and you blunt the doom's next blow."* (≤200 characters, Law 18) | PC-1 |
| `dominion` caption | "How much a place or person is already yours. Your own ground costs less." | "Dominion: how much a place or person is already yours. Your own ground costs less." | PC-1, and the two-meanings reading |
| Doom panel | "Counter-omens 0", "Doom debt 0" | not drawn while 0; unchanged words when not 0 | — (noise cut; no complaint class) |

"Unfinished" over "threads to pull": "Threads" is the god's bond to a mortal (UL), so it cannot name a hook.

## Engine pillar

One view-model change, no rule. `engine/views/godRail.ts:257` `mandateSummary` fills the new `GOD_RAIL_ROW_SUMMARIES.mandate` template instead of returning the bare trend word. `reachSummary` (`:251`) now walks `GOD_RAIL_REACH_SUMMARY_STEPS` (U1.2). The count summaries already go through `countWords`. No tick, phase, graph or PRNG change. This is a file under `src/engine/`, so the review gate applies.

## UI pillar

Browser-verify tool: the in-app browser / Playwright DOM reads (the rail and the Doom panel are DOM, no WebGL).

### U1 — summaries (`data/frame-content.ts`, `engine/views/godRail.ts`)

1. `GOD_RAIL_ROW_SUMMARIES` gains `mandate: 'Goal · {trend}'`. `reaches` becomes `'Main: {reach} · {tier}'`. `covenants`, `signatures` and `hooks` take the pairs in the table.
2. `reachSummary` walks `GOD_RAIL_REACH_SUMMARY_STEPS` (a named list in `frame-content.ts`) and returns the first result within `GOD_RAIL_SUMMARY_MAX_CH`. So a long pair keeps its reach name and only loses "Main: ". `mandateSummary` does the same with `GOD_RAIL_MANDATE_SUMMARY_STEPS` (`Goal · {trend}`, then `{trend}`). Every Mandate word fits today, so for Mandate this only guards later words.

### U2 — the definition line (`ascendant-bar/AscendantBar.tsx` `FoldedRow`)

1. When `open && children`, the body's first child is `<p data-testid="god-rail-row-definition-{id}">`, styled from `GOD_RAIL_DEFINITION_LINE` (size, colour, margin and padding all in that constant). Its text is `firstSentence(resolveTooltip(def.tooltipId)?.desc)` (`engine/tooltipResolver.ts:99`).
2. No line when `def.tooltipId` is null or does not resolve, or while the row's own first-use caption is showing (`useFirstUseCaptionVisible(id)`, `components/shared/FirstUseCaption.tsx:47`). Only the Reaches body renders captions inside the row (`reaches`, `dominion`, `godRailComponents.tsx:143-150`), so only that row checks, against `reaches`. The `mandate` caption is an arrival-toast caption (`first-use-captions.ts:70`, THR-2060) and never shows inside the row, so Mandate always draws its line.
3. `firstSentence` is a pure helper in `frame/godRailDefinitions.ts`. It cuts at the first `. ` and keeps the full stop. A desc with no `. ` comes back whole, and an empty or undefined desc returns `null`, so no line is drawn. `{{ui.*}}` references are resolved after the cut, the way the tooltip resolves them, and a test checks that a reference before the cut survives.

### U3 — Mandate's hover (`data/frame-registry.ts:146`, `data/ui-content.ts`)

`tooltipId: null` → `'ui.mandate'`, with the new entry in the content table.

### U4 — Dominion caption (`data/first-use-captions.ts:62`)

The text in the content table. The 15-word test on captions must still pass.

### U5 — Doom panel zero rows (`components/Game/DoomClockDetail.tsx:202-213`)

Wrap each of the two `StatRow`s in the same kind of condition as Speed modifier: `state.counterOmens > 0`, `state.nextEscalationSeverityModifier > 0`.

### Player-facing text

The exact words are the table under § Content pillar; every row there is player-facing. A long Reaches pair keeps today's form, e.g. "Eye · Before It Happens" (23 characters), because "Main: " would push it past 24.

### Player-facing display

The collapsed rail reads, top to bottom under the hand: *"Reaches · Main: Eye · Blinkered"*, *"Mandate · Goal · Holding"*, *"Signatures · 3 settled"*, *"Hooks · 11 unfinished"*. Opening Hooks shows, above the list: *"Marks, clues and vows that tie you to something unfinished."* The Doom panel lists only counters that have something in them.

### UI Laws engaged

Law 1 (every term has a hover; Mandate's gap closes), Law 11 (no meaning carried by an icon alone; no "?" glyph added), Law 13 (no new number: the counts were already on the rail as persistent chrome counts, and now carry their noun), Law 14 (no raw keys), Law 17/18 (hover text ≤200 characters; the definition line and the hover come from one registry entry), Law 33 (the definition line lives inside the opened row's own scroll box, so nothing goes below the fold). One meaning per word is the UL's rule, not a UI Law: UL `Cosmology.md` § Reach keeps Reach and Dominion apart, and decision 4 applies it. Every summary fills from a count or a state word, in the spirit of Law 56.

### Playtest signal

- No warm tester lists more than two of Reaches / Mandate / Signatures / Hooks / Doom / Omen under "never understood" (the ticket's Fixed-when).
- No tester describes Hooks as something attacking them.

### Event notifications · Debug inspection · Visual presence (HexMapV2)

No events; nothing on the map. Debug: `getView('godRail').rows[id].summary` already exposes each summary; the definition line is a DOM test id.

## Canon pillar (lands in the same PR)

`Docs/design-system/layout-zones.md` § God rail (left): "A folded row's summary names what it counts in words, and an opened row starts with its definition line from the row's hover entry (THR-2175)."

## Interface impact

| Contract | Change |
|---|---|
| `GodRailVM.rows[*].summary` → `FoldedRow` | preserve (same field; new words) |
| `GOD_RAIL_SECTIONS[*].tooltipId` → `FoldedRow` | extend (Mandate gains an id; the body reads it too) |

No cross-system read or write is added, so `interface-map.md` is untouched.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `godRail.ts` view, `frame-content.ts`, `frame-registry.ts`, `ui-content.ts`, `first-use-captions.ts`, new `godRailDefinitions.ts` | none | `FoldedRow`, `DoomClockDetail` | none | none | `getView('godRail')`, `god-rail-row-definition-*` |

Wiki: grep `public/*.html` for `frame-content.ts` / `godRail.ts` as `sources` and update the matching page; run `check:wiki-freshness:blocking` either way.

## Constants table

| Constant | Default | Purpose | Home |
|---|---|---|---|
| `GOD_RAIL_ROW_SUMMARIES` | the five templates above | Each folded row's summary words | `data/frame-content.ts` |
| `GOD_RAIL_SUMMARY_MAX_CH` | 24 (unchanged) | Longest summary before the fallback | `data/frame-content.ts` |
| `GOD_RAIL_REACH_SUMMARY_STEPS` | `['Main: {reach} · {tier}', '{reach} · {tier}', '{tier}']` | The Reaches summary, longest form first | `data/frame-content.ts` |
| `GOD_RAIL_MANDATE_SUMMARY_STEPS` | `['Goal · {trend}', '{trend}']` | The Mandate summary, longest form first | `data/frame-content.ts` |
| `GOD_RAIL_DEFINITION_LINE` | `{ size: '--text-xs', color: '--text-muted', margin: '0 0 4px', padding: '0 8px' }` | The opened row's definition line style | `frame/godRailDefinitions.ts` |

## Tracing

N/A — words and layout only; nothing new happens in the simulation.

## Fail-soft table

| Failure | Fallback |
|---|---|
| A row's tooltip id does not resolve | No definition line; the row opens as today |
| A summary template is longer than 24 characters after filling | The next step in its `*_SUMMARY_STEPS` list; the reach name survives every real pair |
| A summary ellipsizes at 1920×1080 anyway (a long reach name) | The ellipsis is today's behaviour; see kill criteria |
| `state.counterOmens` is undefined | `> 0` is false, so the row hides (as Speed modifier does) |

## Kill criteria

- At 1920×1080 on the warm-150 view, any summary is cut by an ellipsis in pixels (the 24-character steps cannot see width): drop the "Main: " / "Goal · " prefix on that row only, and say so in the PR.
- The Reaches row on the warm-150 world drops to its second step (no "Main: ") for the primary Reach the player actually holds: the prefix is not earning its place there. Note it on the ticket; warm round 4 decides whether "Main" stays.
- A Doom-panel test or tester shows a player waiting for counter-omens they cannot see: bring the two rows back, written as *"No counter-omens yet"* rather than "0".

## Three-pillar check

- [x] Engine pillar present (one view summary; no rule)
- [x] Content pillar present (every word in the table)
- [x] UI pillar present (U1–U5 plus one canon line)
- [x] Wiring connects them

## Vision audit

- [x] No Vision premise is contradicted. Prose-first UI holds: no number is added, and the counts that were there now carry their noun. The rail gets no wider and no row opens by default, so the map stays the table.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-05-thr-2175-rail-rows-say-what-they-are-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Words live in content tables; the cap is a named constant |
| 2. Inspectability | PASS | `getView('godRail')` summaries; definition test ids |
| 3. Determinism | PASS | No simulation input |
| 4. Fail-soft | PASS | Table above; missing ids draw nothing |
| 5. Narrative over mechanical perfection | PASS | Plain game words, no numbers added |
| 6. Additive over destructive | PASS | New entries and one pure helper; old strings replaced in their own tables |
| 7. Performance budget | PASS | One registry lookup per open row |

## Done when

- [ ] At 1920×1080 on `?view=game&seeded&size=medium&warm=150`, `await window.__DEBUG.getView('godRail')` gives `rows.mandate.summary` starting "Goal · " and `rows.reaches.summary` starting "Main: " (or, for a long pair, today's `{reach} · {tier}`); when `rows.hooks.renders`, its summary ends " unfinished".
- [ ] A unit test walks every pair in `ASCENDANT_REACH_REGISTER` and asserts the Reaches summary contains the reach name.
- [ ] No `god-rail-row-summary-*` shows an ellipsis at 1920×1080 (`scrollWidth <= clientWidth`), or the kill criterion's per-row fallback is applied and stated.
- [ ] Opening each rendered folded row shows `god-rail-row-definition-{id}` with its hover's first sentence, except while that row's own first-use caption is showing.
- [ ] `god-rail-row-mandate`'s label has a hover (`ui.mandate` resolves).
- [ ] The `dominion` caption begins "Dominion:"; the caption word-count test passes.
- [ ] The Doom panel on a fresh `?view=game&seeded&size=medium` (counters 0) draws no "Counter-omens" or "Doom debt" row; a unit test with `counterOmens: 2` draws it with its hover.
- [ ] Unit tests: `godRail` summaries (each template, the fallbacks, singular/plural), `firstSentence`, and `FoldedRow` drawing the line. Existing tests that pinned "on you", "yours", "held" or the bare trend word are updated, and no others change.
- [ ] Browser evidence, one 1920×1080 screenshot of the collapsed rail and one with Hooks open (a small visible change, ≤400 UI lines).
- [ ] `layout-zones.md` carries the Canon pillar line.
- [ ] `npm run gate` is green; the review gate has passed (engine file).

## Coordination block

**Suggested model:** sonnet. Content-table words, one pure helper, and four small component edits with measured anchors.
**Parallel-safe with:** ["Waits for you" / "Theirs alone"](https://linear.app/threadbare/issue/THR-2178) and [a good-odds step that misses says so](https://linear.app/threadbare/issue/THR-2180) (Ledger, Stage and outcome lines; not the rail or the Doom panel).
**Mutex with:** [the god-rail hand room](https://linear.app/threadbare/issue/THR-2177), because both edit `ascendant-bar/AscendantBar.tsx` (it changes the fill wrapper and the folded block's shrink; this plan changes `FoldedRow`'s body). Build after it.

**Files to touch:**
- Edit: `src/data/{frame-content.ts,frame-registry.ts,ui-content.ts,first-use-captions.ts}`, `src/engine/views/godRail.ts`, `src/components/Game/ascendant-bar/AscendantBar.tsx`, `src/components/Game/DoomClockDetail.tsx`, their tests, `Docs/design-system/layout-zones.md`.
- New: `src/components/Game/frame/godRailDefinitions.ts` and its test.

## Notes for the executor

- Line numbers are from `main` @ `90221547`. Anchor on the test ids.
- `ui.mandate_tracker` (`ui-content.ts:343`) stays as it is. It is the Mandate panel's own heading.
- The UL rule (decision 6) is a separate `UL-proposal` ticket. This build does not edit `Docs/ubiquitous-language/`.

## Forked-audit verdicts

| Axis | Verdict | Note |
|---|---|---|
| NFP | REVISE → fixed | "Best: {reach} · {tier}" fell back to the bare tier word for 8 of 40 real pairs, which loses the reach name. Fixed with the three-step `GOD_RAIL_REACH_SUMMARY_STEPS` and an all-pairs test. The definition-line spacing moved into its constant, and `firstSentence`'s edge cases are now stated |
| Three-pillar | PASS-with-notes → fixed | The Law 21 / 37 / 56 citations were wrong and are corrected. "Best" was untrue (the primary Reach is the archetype's, not the highest), so it now reads "Main". U2 now names where each row's caption really renders |
| Vision | PASS-with-notes → fixed | The `ui.hooks` second sentence no longer says "thread". Signatures reads "N settled" ("power" is a UL term). The UL-proposal also seats the player-facing Hook. Nothing goes to Christian |

### Intent-judge verdict

**Allow** (Reversible), on the second run. The first run said **Revise**: the "Best:" fallback dropped the reach name on 8 of 40 pairs, the kill criterion could not fire, the complaint classes were mislabelled, and there was no Player-facing text heading. All four were fixed. The re-run had one minor consistency note on the Engine pillar wording, also fixed.
