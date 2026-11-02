> **title:** `The pool says how full it can get, and the sheet says what grew — THR-2143`
> **linear_issue:** THR-2143
> **author:** `Claude Code` (design lane, run 2026-11-02e, unattended)
> **created:** 2026-11-02
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# The pool says how full it can get, and the sheet says what grew — THR-2143

*Round 6: all three testers still could not say what their essence upkeep, refill or limit was, and the systems player stopped trusting the Aftermath because the sheet never moved when it said something grew. This plan gives each pool a visible limit and a stated upkeep, and makes the sheet show the gain and the lean the Aftermath and the meeting just announced.*

## Why this is load-bearing

PC-1 has now recurred six rounds ([THR-1607](https://linear.app/threadbare/issue/THR-1607) → … → [THR-2058](https://linear.app/threadbare/issue/THR-2058) → THR-2143, 3/3 on pools and upkeep). The [THR-2058 plan](2026-10-26-thr-2058-one-thing-at-a-time.md) fixed readouts that claimed motion that did not happen; round 6 confirms those landed. What is left is readouts that **never name the thing the player is trying to check**. Measured on `origin/main` @ `12e6c116`:

1. **The bar ends at the starting amount, not at the limit.** `ESSENCE_BAR_CEILING = INITIAL_ESSENCE_PER_SPHERE` (50, `essenceDisplay.ts:28`, `influence.ts:31`). The limit is `computeMaxEssence` = `BASE_MAX_ESSENCE` 50 + `MAX_ESSENCE_PER_THREAD` 5 per thread (`influence-content.ts:44-45`, `influence.ts:180-183`). Every pool starts at 50, which is full before the bond. After it, a pool at 53 of 55 draws a full bar, and nothing says 55 anywhere (`EssencePanel.tsx`, the one view with `/max`, is never rendered). Veteran: *"every pool grew past 50 … Life dipped 50→49 for no reason I could see."*
2. **Upkeep is a tag with no story.** The paying row says *"pays your upkeep"* (`ESSENCE_UPKEEP_TAG`, `essence-refill-content.ts`). Its hover's sentence, *"your threads' upkeep is paid from this pool"*, does not say when, how often, or why a full pool sits one under its limit. That is because upkeep is taken after the clamp (`essenceIncome.ts:137`, `drawnPerTick`). Skimmer: *"maybe a per-turn cost? I never saw it happen."*
3. **A gain never shows on the sheet.** ▲▲ is 0.05–0.20 on the raw reach (`GROWTH_MAGNITUDE_BANDS`, `aftermathWords.ts:154-160`). The sheet word is one of five 0.2-wide capability tiers (`getCapabilityTier`, `domain-words.ts:82-90`). So a clear gain usually leaves "Subtle" as "Subtle", and the reach tile (`personRows.ts:674-684`, `Section.tsx:688`) has nothing else to show.
4. **A lean never shows on the sheet, and it has two names.** The meeting fate line says *"{name} came out {leaned}"* (`meeting-narrative-prose.ts:138-153`) with the axis word ("Scheming", `axisRegistry.ts:107`). The shift is ±0.30 (`meetingEncounter.ts:903-905`). Nature shows the sign of the top three values (`agentDetail.ts:808-820`) through a separate word table (`VALUE_LABELS`, `agentDetail.ts:128`: honesty_cunning = Honest / Cunning). So a strongly Honest mortal "came out Scheming" and still reads Honest. The Fair · Scheming row needs `intimate`, but a real First bonds at familiarity 0.5, which is `known` (`GameView.tsx:3238`, `types/familiarity.ts:18-21`).

**Decided by the design lane under delegation (process.md rule 4), invited for veto in the run report:**

1. **The essence bar ends at the pool's limit.** A full bar means a full pool. The starting 50 is no longer the bar's end. *Veto:* "keep the bar ending at the starting amount".
2. **The pool's hover opens with its limit in words**: *"Full when the bar is full. Each mortal you thread lets every pool hold a little more."* The bar (decision 1) is where the limit is read. No new numeral: the Vision audit found that non-negotiable #3 and the taste profile ("Numbers in UI … forbidden") record no exception for a limit, so a number for the limit is Christian's call (§ Needs Christian). *Veto:* "say how the pool grows differently".
3. **Upkeep is a sentence about when and why, not a rate.** The paying row's hover says: *"Your {threads} draw their upkeep from this pool, a little all day. So when it is full, it sits just under its limit."* The per-day amount the ticket proposed is **not** shown, because the 2026-09-10 per-tick-rates ruling (THR-1426) keeps rates off player surfaces. The causes are counted in words ("two threads and one place of power"). *Veto:* "show the upkeep amount".
4. **A recent gain marks its reach tile.** For `SHEET_GAIN_MARK_WINDOW_TICKS` (three days) after a chapter grew a reach, its tile shows the Aftermath's own ▲ cluster beside the word. The hover says when, where, and why the word may not have changed: *"Grew clearly two days ago, in The Pilgrim Way. The word changes only at the next step."* A time window replaces the ticket's "until seen". It needs no stored "seen" state, it is the same on reload, and it explains the unchanged word rather than hiding it. *Veto:* "keep the mark until I have looked".
5. **A meeting lean shows on Nature.** After the threading meeting, Nature adds one chip per lean: *"leaning Scheming"*. The chip is left out when that word is already one of the chips. *Veto:* "only the personality row should show leans".
6. **One word per pole: the axis registry's.** Nature reads `axisRegistry` words (THR-524's approved vocabulary, which THR-525 is migrating to), so Honest / Cunning becomes Fair / Scheming. That is the word the fate line and the personality row already use. `VALUE_LABELS` in `agentDetail.ts` is retired for display. *Veto:* "keep the Nature words".
7. **The fate line says "leans", not "came out".** For example, *"Fate went with you: Elara leans Scheming now."* A ±0.30 shift is a lean, and the old verb promised a change of nature the sheet will not show. *Veto:* "keep 'came out'".
8. **Fated stays grey (Christian's ruling, [THR-1724](https://linear.app/threadbare/issue/THR-1724)).** Its hover's first sentence quotes his ruling: *"The best word on the ladder: a sure thing needs no god."* The colour question stays his ([THR-1980 plan § Needs Christian](2026-10-18-thr-1980-words-teach-themselves.md)).

## Needs Christian (reserved, not decided)

**Should the pool's limit show as a number?** Testers want *"a number the player can check"*. Today the balance shows as a number ("53") and nothing else does. Options: **(a) the bar's end and words only** (this plan's default); **(b) the hover names it**: *"Holds up to 55: 50, and 5 more for each mortal you have threaded."*; **(c) the row shows "53 / 55"**. (b) and (c) add a number your Vision files forbid without an exception (non-negotiable #3, taste profile), though Law 13's pool-balance exception arguably covers it. Picking (b) is one copy entry and a Vision note; the rest of this plan stands either way.

**Not in this plan:** card tags and pip colours (Create, Find, Cosmic, Cache, Balm, Kindle; 2/3). The ticket gives no direction for them, so they are filed as their own design request in *Cold playtest · round 6*. The essence economy itself is also out: pools still start at 50 and upkeep is still taken after the clamp. No rule changes.

## Substrate inventory

Measured on `origin/main` @ `12e6c116`. No new system, node type, edge type or tick phase.

| Existing subsystem | Status | This plan |
|---|---|---|
| Essence cap (`computeMaxEssence`, `influence.ts:180`) | 🟢 ACTIVE | **read** by the bar and the hover (already read by `selectEssenceRows`, `godSheet.ts:237`) |
| Essence rows (`selectEssenceRows`, `essenceRowHover`, `godSheet.ts:192-266`; `EssenceBlock.tsx`; `essenceFillPct`) | 🟢 ACTIVE | **extends**: `row.cap`, cap and upkeep sentences |
| Upkeep (`TIER_MAINTENANCE`, `upkeepChargedSources`, `essenceIncome.ts:96-106`) | 🟢 ACTIVE | **read only**: counts of paying threads and sources |
| Chapter archive (`ChapterRecord.aftermathSummary`, growth changes `kind:'growth'`, `types/chapterRecord.ts:62-112`, `unifiedAction.ts:331-390`) | 🟢 ACTIVE | **new read** by the person sheet |
| Meeting record (`meetingChoiceRecord.formativeOutcomes` on the thread edge, `meetingEncounter.ts:927-929, 1059`) | 🟢 ACTIVE | **new read** by Nature |
| Person sheet (`personRows.ts` `nature` :582, `domains` :674; `agentDetail.ts` `topValues`) | 🟢 ACTIVE | **extends** |
| Axis registry (`CANONICAL_AXES`, `types/axisRegistry.ts`) | 🟢 ACTIVE | **read** for Nature words |

## Engine pillar

**E1. Cap on the row.** `EssenceRowView` gains `cap: number` (the value `selectEssenceRows` already computes; `Infinity` → omitted). `essenceRowHover(sphere, reading, refill, cap, upkeep)` puts the cap sentence first, then the upkeep sentence on the paying row, then today's parts.

**E2. Upkeep causes (pure).** `upkeepPayers(graph, ascendantId): { threads: number; sources: number }`, in `essenceIncome.ts` beside the existing walk in `computeEssenceIncomeBreakdown` (`:96-106`). Threads are counted where `TIER_MAINTENANCE[tier] > 0`, and sources by `upkeepChargedSources`. It is the same walk the ledger uses, so the words and the charge cannot disagree (the THR-1652 lesson).

**E3. Recent growth (pure).** New `src/engine/views/reachGrowthMarks.ts`:

```ts
export interface ReachGrowthMark { readonly reach: ReachDomain; readonly band: string; readonly steps: 1 | 2 | 3; readonly chapterTitle: string; readonly resolvedTick: number }
/** Newest growth per reach for this actor within the window. Pure; archive order breaks ties. */
export function recentReachGrowth(archive: readonly ChapterRecord[] | undefined, actorId: string, nowTick: number, windowTicks: number): ReadonlyMap<ReachDomain, ReachGrowthMark>;
```

It reads `aftermathSummary` changes with `kind === 'growth'` and `actorId` matching. `stateNoun` maps to the reach, and the band maps to the cluster's step count through the existing `sphereDeltaReading` / Law 15 mapping. Nothing is written.

**E4. Nature words and leans.** `agentDetail.ts` builds `topValues[].word` from `CANONICAL_AXES` by `valuePair` (with the intensity prefix kept). `VALUE_LABELS` stays only as a fallback for a pair with no axis. A new pure `meetingLeans(graph, agentId): { pair: ValuePair; word: string }[]` reads the thread edge's `meetingChoiceRecord.formativeOutcomes` and returns the written pole's axis word.

Graph nodes / edges: none new. Tick phases: none. Resolution and PRNG: untouched. Every change is a render-time read.

## Content pillar

| Key | Text |
|---|---|
| `ESSENCE_CAP_HOVER` (new, `essence-refill-content.ts`) | `'Full when the bar is full. Each mortal you thread lets every pool hold a little more.'` (one sentence for every state; no numeral) |
| `ESSENCE_REFILL_UPKEEP_HOVER` (replaced, two forms) | One payer: `'{word}. Your {payer} draws its upkeep from this pool, a little all day. So when it is full, it sits just under its limit.'` More than one: `'{word}. Your {payers} draw their upkeep from this pool, a little all day. So when it is full, it sits just under its limit.'` |
| `{payer}` / `{payers}` | `"thread"` or `"place of power"` (one payer); `"two threads"` / `"two threads and one place of power"` (more): counts as words (`countWord`, `aftermathWords.ts`, used by `durationLabel`) |
| `SHEET_GAIN_MARK_HOVER` (new, `person-sheet-words.ts`) | `'Grew {band} {elapsed} ago, in {chapter}. The word changes only at the next step.'` (`{band}` = `slightly` / `clearly` / `greatly`, matching the THR-2058 legend's `slight · clear · great`; `{elapsed}` from `elapsedLabel`) |
| `NATURE_LEAN_CHIP` (new) | `'leaning {word}'` |
| `MEETING_FATE_LINE_FORMATIVE_CLAUSES` | Each `came out {x}` becomes `leans {x} now`. `edged toward` and `at a cost` are kept. Eight strings. |
| `ui.forecast.fated` desc | First sentence becomes `'The best word on the ladder: a sure thing needs no god.'`; the rest is unchanged (≤ 200 characters, Law 18) |

Encounter templates, prose tables, attachment content: N/A. No scene prose or item changes; this plan changes how existing state is named on the sheet and the rail.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces only: the god rail, the person sheet and the meeting beat).*

**UI Laws engaged:** 1 and 17/18 (every new reading lives in a registry hover), 12 (legends at first contact: the ▲ is the Aftermath legend's glyph), 13 (no new numeral and no rate), 15 (the delta cluster is the magnitude language for a gain), 31 (the ▲ is a shape, never colour alone), 56 (the mark is backed by the archive record, never a UI flag), 58 (one home per sentence), and the visibility-parity clause of Law 13 (a gain the Aftermath reports is now visible on the sheet).

- **U1. Bar.** `EssenceRow` calls `essenceFillPct(row.level, row.cap ?? ESSENCE_BAR_CEILING)`.
- **U2. Hover.** The row hover shows `row.hoverDesc` (E1). The rung's aria label is unchanged.
- **U3. Reach tile mark.** The `cards` body in `Section.tsx` takes an optional `mark: { steps; label }` per tile and draws `DeltaCluster` (size 10, up) after the word, inside a `Tooltip` with the hover text. `personRows.ts` `domains` fills it from E3.
- **U4. Nature chips.** Axis words, plus one `leaning {word}` chip per meeting lean. A lean chip is never the lead chip.
- **U5. Fate line.** Copy only (`FormativeTestBeat.tsx` is unchanged).

### Player-facing text

| Surface | Exact text the player reads | Class | How the player understands it |
|---|---|---|---|
| Essence row, refill (unchanged words, THR-1985) | "Refills steadily" as the hover's second sentence, and the ●●○ rung under the balance, keyed "how fast each pool refills" | PC-1 | The rung and the word say how fast the pool climbs. With the bar now ending at the limit (U1), the climb is visible for the first time after the bond, because pools no longer sit at a full bar from the start |
| Essence row hover | "Full when the bar is full. Each mortal you thread lets every pool hold a little more. Refills steadily. …" | PC-1 | The bar's end is the limit, and the sentence says why it moves |
| Paying row hover, one thread | "Refills slowly. Your thread draws its upkeep from this pool, a little all day. So when it is full, it sits just under its limit." | PC-1 | 50→49 has a stated cause |
| Paying row hover, threads and a place | "Refills slowly. Your two threads and one place of power draw their upkeep from this pool, a little all day. So when it is full, it sits just under its limit." | PC-1 | Every payer is named, counted in words |
| Essence bar at 53 of 55 | bar about 96% full | PC-1 | Room left to grow is visible |
| Reach tile after a ▲▲ | "Subtle ▲▲" | PC-6 | The sheet agrees that something grew |
| Its hover | "Grew clearly two days ago, in The Pilgrim Way. The word changes only at the next step." | PC-6 | Why the word did not move |
| Nature after a Scheming lean | "Fair above all · Brave · leaning Scheming" | PC-6 | The lean the meeting announced is on the sheet |
| Meeting fate line | "Fate went with you: Elara leans Scheming now." | PC-6 | Promises a lean, which is what the sheet shows |
| Fated pill hover | "The best word on the ladder: a sure thing needs no god. As things stand, …" | PC-1 | Grey means sure, not off |

### Playtest signal

No round-7 tester lists upkeep, refill or the limit under "never understood". No tester says the Aftermath and the sheet disagree about a gain or a lean.

## Kill criteria

- A round-7 tester again lists upkeep or the limit under "never understood". Next: Christian's limit-number option (b), and ask him whether an upkeep amount may show despite the rates ruling.
- Refill alone is still "never understood" while upkeep and the limit are not. Next: a refill sentence of its own in the hover ("Refills fast: about a fifth of all you gather lands here"), designed against the THR-1985 bands.
- A tester says the sheet and the Aftermath disagree about a gain. Next: lengthen `SHEET_GAIN_MARK_WINDOW_TICKS`, or add per-viewer "seen" state.
- The Nature word switch draws a "new words I don't know" complaint. Next: revert to `VALUE_LABELS` behind its fallback.

### Debug inspection

`getEssenceRefill()` (exists) adds each sphere's `cap` and the `upkeepPayers` counts. The person sheet has no debug accessor (measured: no `getPersonSheet` in `src/`), so its evidence is DOM: `data-growth-steps` on the reach tile, `data-lean` on lean chips.

**Visual presence (HexMapV2):** N/A. No map layer is touched.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| E1/E2 cap + upkeep | render | `EssenceBlock.tsx` | reads `essencePool`, graph | none (pure) | `getEssenceRefill()` |
| E3 `recentReachGrowth` | render | person sheet `domains` → `Section.tsx` | reads `chapterArchive` | none | `data-growth-steps` |
| E4 Nature words + leans | render | person sheet `nature` | reads graph (thread edge) | none | `data-lean` |

Prose enrichment: N/A (copy only, no enrichment layer). Player controls: N/A (no new control; the hovers use the existing `Tooltip`).

## Interface impact

| Contract | Kind | Change |
|---|---|---|
| Chapter archive → person sheet | add (read) | Growth changes are read by the sheet; production read site `personRows.ts` `domains` |
| Meeting record (thread edge) → person sheet | add (read) | `formativeOutcomes` read by `nature` |
| Upkeep walk → essence row | extend | Counts of payers alongside the charge |

No new cross-system write. `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the two read rows.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `SHEET_GAIN_MARK_WINDOW_TICKS` | 36 (three days at `TICKS_PER_DAY` 12) | How long a reach tile shows a gain |
| `ESSENCE_BAR_CEILING` | 50 (unchanged; now the fallback only) | Bar end when the cap cannot be read |

## Tracing

N/A — no new trace. Every read is pure over state that is already traced (`chapterArchive`, `meeting.test_resolved`, `essenceMovement`).

## Fail-soft table

| Failure | Fallback |
|---|---|
| Cap unreadable | Bar ends at `ESSENCE_BAR_CEILING`; the hover omits the cap sentence |
| Upkeep walk throws | Today's upkeep sentence with no counts |
| Archive absent or evicted | No mark (never a false one) |
| Growth change with an unknown `stateNoun` | Skipped |
| No thread edge or no `meetingChoiceRecord` | No lean chips |
| Pair with no axis | Nature falls back to `VALUE_LABELS` |

## Three-pillar check

- [x] Engine: E1–E4, four pure reads, no write
- [x] Content: six copy entries, eight fate-line strings
- [x] UI: U1–U5, Playwright DOM evidence
- [x] Wiring: table, interface rows, debug fields

## Vision audit

- [x] No premise contradicted. This serves the north star (*the player must be able to weigh the cost of a nudge*) and non-negotiable #3 (mechanics through prose). No numeral is added (the limit's number is reserved, § Needs Christian). It continues the [THR-1980](2026-10-18-thr-1980-words-teach-themselves.md) / [THR-2058](2026-10-26-thr-2058-one-thing-at-a-time.md) principle: fix the reading where the player checks it.
- [x] No Vision edit needed.

## Rulebook impact

- [x] No rule of play changes. Pools, caps, upkeep, growth and leans behave exactly as before.
- [x] No `Docs/canon/rulebook.md` edit needed.

> Brainstorm companion: `Docs/plans/2026-11-02-thr-2143-the-sheet-says-what-grew-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Window and bar fallback are named; copy lives in data files |
| 2. Inspectability | PASS | Cap, payers, growth steps and leans on debug fields / DOM attributes |
| 3. Determinism | PASS | Time window, not a per-viewer "seen" flag; same state, same screen |
| 4. Fail-soft | PASS | Every new read degrades to today's screen |
| 5. Narrative over mechanical perfection | PASS | The gain hover names the chapter it came from |
| 6. Additive over destructive | PASS with note | The Nature vocabulary changes to the axis registry's (finishes THR-525's migration); `VALUE_LABELS` kept as fallback |
| 7. Performance budget | PASS | One archive pass per open sheet; the archive is capped at `CHAPTER_ARCHIVE_CAP` 2000 records (`chapterArchive.ts:57`) |

## Done when

Two build tickets in *Cold playtest · round 6*, plus one design request:

**S1: The pool says how full it can get** (E1, E2; U1, U2; cap, upkeep and Fated copy):
- [ ] No numeral is added to the essence row or its hover (a test asserts the hover has no digit beyond today's).
- [ ] Unit tests: `essenceFillPct` against the cap; `essenceRowHover` opens with the cap sentence and, on the paying row, the upkeep sentence with counted payers; `upkeepPayers` matches the threads and sources `computeEssenceIncomeBreakdown` charges.
- [ ] On `?view=game&seeded&size=medium`, `await window.__DEBUG.getEssenceRefill()` shows each sphere's `cap` equal to 50 + 5 × threads, and a pool below its cap draws a bar under 100%.
- [ ] One 1920×1080 screenshot of the rail with the paying row's hover open; `npm run gate` green.

**S2: The sheet says what grew** (E3, E4; U3–U5; sheet and fate-line copy):
- [ ] Unit tests: `recentReachGrowth` returns the newest growth per reach in the window and nothing outside it; `meetingLeans` reads the written pole; Nature uses axis words and adds a lean chip only when the word is not already shown.
- [ ] On `?view=game&firstunmet&size=medium`, after a formative test the fate line reads "leans … now", and The First's Nature shows the lean chip.
- [ ] After a chapter with a ▲▲ growth (`?spawn=` a growth encounter, `window.__DEBUG.tick(n)`), the reach tile has `data-growth-steps="2"` and its hover names the chapter.
- [ ] Four-part browser evidence at 1920×1080 (sheet, the Nature row and the fate line); `npm run gate` green; review gate (touches `src/engine/`).

**Design request:** *Card tags and pip colours still unread* (Create, Find, Cosmic, Cache, Balm, Kindle; the coloured circles beside prices).

## Coordination block

**Suggested model:** S1 sonnet (copy and two reads in known files); S2 opus (a new archive read, a vocabulary switch across the sheet, and a primitive change in `Section.tsx`).

**Parallel-safe with:** S1 and S2 with each other (disjoint except `debug-bridge.ts`).

**Mutex with:**
- S2 with [Legibility 1](https://linear.app/threadbare/issue/THR-2122) (rewrites `Section.tsx` and the person rows); S2 is **blocked by** it, because the tile mark goes into the block set Legibility 1 lands. Also with [Legibility 2](https://linear.app/threadbare/issue/THR-2123) (Inspector pages).
- S1 with any build editing `EssenceBlock.tsx`, `essenceDisplay.ts` or `godSheet.ts`.

**Files to touch:**
- S1: `src/components/Game/ascendant-bar/essenceDisplay.ts`, `EssenceBlock.tsx`, `src/engine/views/subjects/godSheet.ts`, `src/engine/essenceIncome.ts`, `src/data/essence-refill-content.ts`, `src/data/ui-content.ts` (`ui.forecast.fated`), `src/debug-bridge.ts` + `.d.ts`, tests beside each.
- S2: `src/engine/views/reachGrowthMarks.ts` (new), `src/engine/views/subjects/personRows.ts`, `src/engine/agentDetail.ts`, `src/data/person-sheet-words.ts`, `src/data/meeting-narrative-prose.ts`, `src/components/shared/Section.tsx`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, tests beside each.

## Notes for the executor

- **Do not change the economy.** Starting pools, the cap formula and the upkeep order stay as they are; only how they read changes.
- **Do not show an upkeep amount.** The per-tick-rates ruling (Law 13, THR-1426) binds; counts of payers in words are allowed.
- **Grey zone:** if a growth change's band word is missing, use one ▲ and "grew".
- **Grey zone:** an axis with an intensity prefix ("Deeply Fair") keeps the prefix; the lean chip never takes one.

## Intent-judge verdict

**Escalate** (Reversible) on pass 3. Pass 1 was Revise: the upkeep template needed one- and many-payer forms, two hover rows were missing, the Fated line had to quote the ruling, and a Kill criteria section was missing. All were fixed. Pass 2 was Allow, on the draft that still showed the limit as a number. Pass 3 judged the draft after the Vision fix (no number). It escalated: the ticket asks where the player reads the limit *as a number*, and words-only is a contested answer that only Christian can settle (§ Needs Christian). Its refill-row gap is fixed above. **This plan is not handed off until he answers.**

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-11-02.*

### NFP audit

**PASS-with-notes.** Tunability, determinism, fail-soft and narrative: PASS. Inspectability note: the person sheet has no debug accessor, so only its DOM attributes show it. Additive note: the Nature vocabulary switch and the eight fate-line strings are replacements, and a fallback is kept. Performance note: the archive cap is now quoted (2000).

### Three-pillar audit

**PASS.** Engine, Content and UI are all present and substantive. Wiring and interface rows connect them. No subsystem duplicates `recentReachGrowth`. No touched file has 100 or more importers.

### Vision audit

**PASS-with-notes** on run 2. Run 1 was REVISE: the limit numeral rested on a UI-law exception that non-negotiable #3 and the taste profile do not record. Fixed by moving the numeral to § Needs Christian. Run 2 found no contradiction, with two notes. "No Vision edit needed" holds only while option (a) stays the default. The bar ending at the limit edges toward the taste profile's "bars" line, and a Vision note would settle that.
