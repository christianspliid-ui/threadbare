> **title:** `One new thing per chapter, and readouts that say what they show — THR-2058`
> **linear_issue:** THR-2058
> **author:** `Claude Code` (design lane, run 2026-10-26c, unattended)
> **created:** 2026-10-26
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# One new thing per chapter, and readouts that say what they show — THR-2058

*Round 5 found a second wall at about minute ten: Doom, the Mandate, Investiture and the Rivals arrive together, and the story tester quit there. It also found readouts that say something the screen does not do: an arrow that points down while the pool fills, a spend mark on a pool nobody spent, an Attention gauge that never moves. This plan sends new panels one per closed chapter, and makes each of those readouts show only what happened.*

## Why this is load-bearing

PC-1 has recurred five rounds running ([THR-1607](https://linear.app/threadbare/issue/THR-1607) → [THR-1713](https://linear.app/threadbare/issue/THR-1713) → [THR-1807](https://linear.app/threadbare/issue/THR-1807) → [THR-1980](https://linear.app/threadbare/issue/THR-1980) → THR-2058, 3/3 testers). Round 4's fixes ([THR-1985](https://linear.app/threadbare/issue/THR-1985), [THR-1986](https://linear.app/threadbare/issue/THR-1986)) landed where a visible thing changed (the veteran: the pour screen is *"clear and honest"*), and missed where a word is only described. That is the [THR-1980 plan](2026-10-18-thr-1980-words-teach-themselves.md)'s principle, kept here. Round 5 shows it failing in two new ways, both measured on `origin/main` @ `9685f6b8`:

1. **Gifts bring panels in bundles, and the ceiling dumps the rest.** `OPENING_REVEAL_TABLE` (`src/data/opening-reveal-table.ts:71-73`) puts Doom, Mandates and Investiture on one gift (`beat.spine.the_seat`), and four rows on `a_path_opens` (`:75-78`). At `OPENING_REVEAL_CEILING_TICKS = 200` (`:82`), `rowState` reveals every waiting row at once (`src/engine/openingReveal.ts`, `if (ctx.ceilingPassed) return { revealed: true, reason: 'ceiling' }`). Rivals are not in the table. They show with the first rival act (`hasRivalActed`, `firstScreenReveal.ts:38-44`), which can land on the same minute. The story tester played 10 minutes, and Doom, Mandate, Investiture and Rivals *"all arrived at once"* at the end ([round-5 report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-5.md), row *story*).
2. **Readouts claim motion that did not happen.**
   - The trend arrow is the net movement over two 100-tick windows (`essenceMovement.ts:48`, `readEssenceMovement`). One spend of 5 keeps it at ↓ while the pool visibly refills (*"Mind showed a red ↓ even while it was going up"*).
   - The spend flash (`useSpendFlash`, `EssenceBlock.tsx:77-91`) treats any drop of 1 or more between renders as a spend. Its timer is cleared by the effect cleanup on the *next* level change. That next change is a refill tick, which returns early with no new timer, so the ▼ can stick until the next big drop. This is the "possible stuck flash" in the ticket, now proven by reading.
   - **Attention is never spent.** `spendAttention` (`attentionPool.ts:61`) has no production caller (`grep -rn "spendAttention(" src` outside tests returns only the definition). `phaseAttention` only regenerates it (`phaseAttention.ts:99-111`). The gauge always sits full, so the caption's *"Attending a moment draws on it"* is false. 3/3 testers: *"I never saw it go down."*

**Decided by the design lane under delegation (process.md rule 4), invited for veto in the run report:**

1. **One new thing per closed chapter.** After the bond, a panel whose trigger has fired waits in a queue. Each time The First closes a chapter, one panel arrives (Reaches and Dominion still arrive as a pair, per THR-1986). An idle player gets the next one after `SPINE_IDLE_FALLBACK_TICKS` (36) running ticks instead. The 200-tick ceiling makes every row *ready*; it no longer shows them all at once. *Veto:* "the Seat should bring Doom, Mandate and Investiture together".
2. **The arrival toast says what the panel is for**: *"New beside the map: Doom. A slow clock toward the world's end. It cannot end the world early."* The second sentence is the panel's first-use caption (one home, Law 58).
3. **Rivals and the map's lenses join the queue.** Rivals arrive after their first act, through the queue. On the lens bar, Dominion shows with Dominion, Trouble with Doom, Threads with the Seat, and Trade last (at the ceiling).
4. **The Attention gauge leaves the screen until something spends Attention.** A gauge that never moves is a readout with no referent (the principle behind Law 56). Giving Attention a cost is a mechanic change, filed separately (§ Done when).
5. **The essence arrow shows which way the pool is moving now**: ↑ while it refills below the cap, ↓ only when it drains, — when full. It reads the same refill band as the row's word, so the two can never disagree (PC-6). The two-window history stays in the hover's "fed by / drawn by".
6. **The ▼ spend mark shows only the player's own spends** (`spend_nudge`, `spend_cast` in the movement ledger), and a refill tick can no longer cancel its timer.
7. **The card legend shows only the shapes on this hand, and names the hollow pip**: *"●○ odds: more filled is stronger"*.
8. **The aftermath legend says what each word means**: *"Scar · what it cost"*, *"Bond · who stands with them"*, *"Boon · what they gained"*, *"Path · a way held open"*, *"▲ slight · ▲▲ clear · ▲▲▲ great"*.
9. **The Needs-you number counts only what waits on you** (waiting and held rows). News stays in the list, but is not counted.

**Not in this plan:** path words used as God's Will labels (2/3 testers). That is [THR-2057](https://linear.app/threadbare/issue/THR-2057) item 1 and [THR-2059](https://linear.app/threadbare/issue/THR-2059). The Fated colour stays reserved under THR-1980 § Needs Christian.

## Substrate inventory

Measured on `origin/main` @ `9685f6b8`. No new system, node type, edge type or tick phase.

| Existing subsystem | Status | This plan |
|---|---|---|
| Opening reveal (`OPENING_REVEAL_TABLE`, 18 rows; `selectOpeningReveal` + `rowState`, `engine/openingReveal.ts`; hook `useOpeningReveal`, `GameView/openingReveal.ts`) | 🟢 ACTIVE | **extends**: a queue after the triggers, three rows, one field |
| First-screen gates (`firstScreenReveal.ts`: rivals on `hasRivalActed`) | 🟢 ACTIVE | **reused**: the predicate moves into the engine selector |
| Lens bar (`MAP_LENSES`, `map-lenses.ts:51`; `MapLensSwitch.tsx`) | 🟢 ACTIVE | **extends**: each lens names its reveal surface |
| Essence rows (`selectEssenceRows`, `godSheet.ts`; refill band THR-1985; `EssenceBlock.tsx` arrow `:60-68`, flash `:77-91`) | 🟢 ACTIVE | **extends**: direction from the band; flash from the spend causes |
| Movement ledger (`essenceMovement.ts`; causes `spend_nudge`, `spend_cast`, `types/influence.ts:39-49`) | 🟢 ACTIVE | **read only** |
| Attention pool (`phaseAttention.ts:99-111` regen; `spendAttention`, `attentionPool.ts:61`, no production caller) | 🟡 HALF-WIRED | **gauge hidden**; deferral filed |
| Card legend (`NUDGE_GLYPH_LEGEND`, `nudge-card-display.ts:128-132`; tiers `nudge-pip-vocabulary.ts:54+`) | 🟢 ACTIVE | **extends**: built per hand |
| Aftermath legend (`CONSEQUENCE_LEGEND_ENTRIES`, `EncounterVeil.tsx:330-355`; glyphs `buildAftermathConsequences.ts:140-145`) | 🟢 ACTIVE | **extends**: a meaning per word |
| Needs you (`buildNeedsYou`, `views/needsYou.ts:297-309`) | 🟢 ACTIVE | **changes** the count's members |

## Engine pillar

**E1. The arrival queue (pure).** In `src/engine/openingReveal.ts`:

```ts
export interface OpeningArrivalLedger {
  /** Surface → tick it arrived. */
  readonly arrived: Readonly<Partial<Record<OpeningRevealSurfaceId, number>>>;
  readonly lastArrivalTick: number | null;
}
/** Release at most one waiting row (plus any row that arrivesWith it). Pure; same inputs, same ledger. */
export function releaseOpeningArrivals(
  ledger: OpeningArrivalLedger,
  ready: readonly OpeningRevealSurfaceId[],   // ready rows, table order
  ctx: { tick: number; chaptersClosedSince: (tick: number) => number },
): OpeningArrivalLedger;
```

A ready row arrives when nothing has arrived yet, or when `chaptersClosedSince(lastArrivalTick) ≥ OPENING_REVEAL_CHAPTERS_PER_ARRIVAL`, or when `tick − lastArrivalTick ≥ OPENING_REVEAL_ARRIVAL_IDLE_TICKS`. "Chapters closed" counts The First's non-routine `chapterArchive` records with `resolvedTick` after that tick. It is the same predicate `hasResolvedFirstChapter` already uses (`openingReveal.ts`), generalised to a since-tick. `selectOpeningReveal` gains `opts.ledger`. With a ledger, a staged row is revealed when it is ready **and** listed in `ledger.arrived` (new reason `queued`). Without one, it behaves exactly as today (CLI, fixtures, `not_staged`).

**E2. Table and triggers.** `OpeningRevealRow` gains `arrivesWith?: OpeningRevealSurfaceId`. `dominion` arrives with `reaches`. New surface ids: `rivals` (trigger `{ kind: 'rival_acted' }`, using `hasRivalActed`, which moves to `src/engine/openingReveal.ts`, and `firstScreenReveal.ts` re-exports it), `lens_threads` (gift `the_seat`), `lens_trade` (trigger `{ kind: 'ceiling' }`). Staged rows are re-ordered so that table order is queue priority: `chapter_ledger`, `notables`, `reaches`, `dominion`, `doom`, `rivals`, `mandate`, `investiture`, `lens_threads`, `world_soul`, `omen`, `lens_trade`. The ceiling marks every row ready (reason `ceiling` → `queued` once it arrives). `revealTriggerKey` returns the row's own surface for a queued row, so each arrival gets its own toast.

**E3. Essence direction (pure).** `essenceDirection(refill: EssenceRowRefill | undefined, level: number, cap: number): 'rising' | 'steady' | 'ebbing'` in `src/engine/views/essenceRefill.ts`: `drains` → ebbing; any other band with `level < cap` → rising; otherwise steady. `selectEssenceRows` (`godSheet.ts`) sets `row.trend` from it. `readEssenceMovement` keeps feeding the hover's causes only.

**E4. Spend reading (pure).** `playerSpendSince(prev, next: EssenceMovementRecord | undefined): number` returns the growth of `spend_nudge + spend_cast` in the current window between two records (0 across a window roll it cannot see). It feeds the flash. No other cause can light ▼.

**E5. Needs-you count.** `buildNeedsYou` (`views/needsYou.ts:308`) counts `waiting + held`. Adding `news` sits behind `NEEDS_YOU_COUNT_INCLUDES_NEWS` (false). The list itself is unchanged: news rows still show under "News".

Graph nodes / edges: none. Tick phases: none new. All five are render-time reads. Resolution and PRNG: untouched.

## Content pillar

**Captions (`src/data/first-use-captions.ts`)**, new entries ≤ 15 words (Law 42 register; also used as the toast's second sentence):

| Id | Caption |
|---|---|
| `mandate` | "What you are working toward. Win it before the doom runs out." |
| `investiture` | "Your divine court: the mortals you raise to act in your name." |
| `rivals` | "Other gods at work in this world. They watch for your hand." |
| `notables` | "The people this world talks about. Some may be worth a thread." |
| `lens_threads` | "Lights where your threads run." |
| `lens_trade` | "Lights the trade roads and what moves along them." |

**Copy edits.**
- `OPENING_REVEAL_TOAST` (`ui-content.ts:39`, today `'New beside the map: {labels}.'`) becomes `'New beside the map: {labels}. {caption}'`. A pair reads `"your Reaches and Dominion. {reaches caption}"`; with no caption the sentence ends after the labels (today's line).
- `attention` caption: kept in the table but never shown while the gauge is hidden (E/U4). The false *"draws on it"* is not shown anywhere.
- `NUDGE_GLYPH_LEGEND` odds entry becomes built per hand: glyphs are the filled and hollow shapes of the tiers present, weakest first; label `'odds: more filled is stronger'`.
- `CONSEQUENCE_LEGEND_MEANINGS` (new, `src/data/aftermath-legend-words.ts`): `scar: 'what it cost'`, `bond: 'who stands with them'`, `boon: 'what they gained'`, `path: 'a way held open'`. The delta words become lower-case after the glyphs: `slight · clear · great`.

Encounter templates, prose tables, attachment content: N/A. No template, scene prose or item changes. This plan changes how existing state is shown.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces; the lens bar is DOM chrome over the WebGL canvas).*

**UI Laws engaged:** 1 (tooltips stay on every surface), 12 (legends at first contact), 13 (no numerals, so pip shapes stay words-and-glyphs), 17/18 (registry tooltips), 31 (colour never alone: arrows keep their shapes), 40 (opening Needs-you never clears the count), 49 (arrivals coalesce, never storm), 51 (caption and legend dismissals stay remembered), 53 (the HUD is a budget: this is that law applied over time), 56's principle (a readout must have a referent: Attention), 58 (one home per caption).

- **U1. Queued arrivals.** `useOpeningReveal` (`src/components/Game/GameView/openingReveal.ts`) holds the ledger in a ref and calls `releaseOpeningArrivals` each render. Rows already ready at the hook's first render arrive together with no toast, so a reload shows today's screen. Each later arrival gets the gold ring (`OPENING_REVEAL_HIGHLIGHT_MS`) and its own toast.
- **U2. Rivals on the queue.** The top bar's `rivals` item (`frame-registry.ts:192`) gets `revealSurface: 'rivals'`, and its `firstScreenGate` stays.
- **U3. Lens bar.** `MapLensDef` gains `revealSurface`: dominion → `dominion`, threads → `lens_threads`, trouble → `doom`, trade → `lens_trade`. `MapLensSwitch` renders only revealed buttons. The key of a hidden lens does nothing. With no lens revealed, the bar is absent.
- **U4. Attention gauge.** `godRailComponents.tsx:99` renders the gauge only when `ATTENTION_GAUGE_SHOWN` is true (default false). The rail closes the gap (Law 57).
- **U5. Essence row.** The arrow reads `row.trend` (E3). The ▼ cluster reads E4's player spend, and its timer lives in a ref, so a later level change cannot clear it.
- **U6. Card legend** (`NudgePhaseShell.tsx:741`): built from the hand's own tiers.
- **U7. Aftermath legend** (`EncounterVeil.tsx`, consequence legend): `Scar · what it cost` per entry, and the delta line `▲ slight · ▲▲ clear · ▲▲▲ great`. The dismissal key is unchanged.
- **U8. Needs-you pill** shows `count` (waiting + held). With only news, the pill shows its label without a number.

### Player-facing text

| Surface | Exact text the player reads | Class | How the player understands it |
|---|---|---|---|
| Toast after a chapter closes | "New beside the map: Doom. A slow clock toward the world's end. It cannot end the world early." | PC-1, PC-5 | One new thing, said once. PC-5: at most one toast per closed chapter (or per 36 idle ticks); the ledger de-duplicates (a surface arrives once); when many rows are ready (the ceiling), they still come one at a time |
| Toast, Rivals | "New beside the map: Rivals. Other gods at work in this world. They watch for your hand." | PC-1, PC-5 | Arrives only after a rival has acted, so the news line about it has a panel to open |
| Toast, Mandate | "New beside the map: Mandates. What you are working toward. Win it before the doom runs out." | PC-1, PC-7 | The one arrival that names a goal; PC-7's next step is the Mandate panel the toast just added |
| Toast, Investiture | "New beside the map: Investiture. Your divine court: the mortals you raise to act in your name." | PC-1 | Informative, not a next step: the other arrivals are things to read, not orders, so they carry no PC-7 claim |
| Toast, Reaches + Dominion | "New beside the map: your Reaches and Dominion. What you can do, and how well. Each Reach grows as you use it." | PC-1 | The pair THR-1986 put together, one toast |
| Toast, a lens | "New beside the map: the Threads lens. Lights where your threads run." (Trade: "…the Trade lens. Lights the trade roads and what moves along them.") | PC-1 | The bar grows one button at a time |
| Needs-you list header | "News" (unchanged, `frame-content.ts:161`); `newsCount` is not printed | PC-1 | The number on the pill is only what waits |
| Essence row, after a spend, refilling | "Mind 45 ↑ · Refills fast ●●●" | PC-1, PC-6 | The arrow agrees with the pool climbing and with the word |
| Essence row, a pool nobody spent | no ▼ | PC-1 | ▼ only ever follows the player's own card or cast |
| Card legend, a hand of faint cards | "✦ price · ●○ odds: more filled is stronger · ▼ setback" | PC-1 | The shapes on the legend are the shapes on the cards |
| Aftermath legend | "✕ Scar · what it cost   ◈ Bond · who stands with them   ✦ Boon · what they gained   ◆ Path · a way held open   ▲ slight · ▲▲ clear · ▲▲▲ great" | PC-1 | The four words mean something before any hover |
| Needs-you pill with only news | "Needs you" (no number) | PC-1 | The number means things that wait on the player |

### Playtest signal

A round-6 tester names Doom, the Mandate or the Rivals as arriving after a chapter, not as a pile; no tester reports the arrow pointing down on a refilling pool; nobody lists Attention.

### Debug inspection

`window.__DEBUG.getOpeningReveal()` (exists) adds `ledger: OpeningArrivalLedger` and `queued: OpeningRevealSurfaceId[]`. `getEssenceRefill()` (exists) adds each sphere's `direction`.

**Visual presence (HexMapV2):** N/A for layers. Only the lens bar's DOM buttons change; no WebGL layer is touched.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `releaseOpeningArrivals` + table rows | render (reads `chapterArchive`, `rivalStates`, beats) | `useOpeningReveal`, `GameViewTopBar`, `MapLensSwitch`, god rail | none (ledger is UI-held) | none (pure) | `getOpeningReveal().ledger` |
| `essenceDirection`, `playerSpendSince` | render | `EssenceBlock.tsx` | none (reads pools, `essenceMovement`) | none | `getEssenceRefill()` |
| Needs-you count | render | `NeedsYou.tsx` | none | none | DOM `data-testid` on the pill |
| Legends | render | `NudgePhaseShell.tsx`, `EncounterVeil.tsx` | none | none | DOM |

## Interface impact

| Contract | Kind | Change |
|---|---|---|
| Rivals → opening reveal (`hasRivalActed` read) | extend | The predicate moves from the UI file into the engine selector. Same read, new home; `firstScreenReveal.ts` re-exports it. |
| Chapter archive → opening reveal | extend | Chapters closed since a tick (the existing First-chapter read, generalised). |
| Essence movement → essence row | extend | The flash reads the spend causes, not a level diff. |

No new cross-system write.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `OPENING_REVEAL_CHAPTERS_PER_ARRIVAL` | 1 | Closed First chapters between two arrivals |
| `OPENING_REVEAL_ARRIVAL_IDLE_TICKS` | `SPINE_IDLE_FALLBACK_TICKS` (36) | Running ticks after which the next arrival comes without a chapter |
| `OPENING_REVEAL_CEILING_TICKS` | 200 (unchanged value) | Now: every row is *ready* after this; arrivals stay one at a time |
| `ATTENTION_GAUGE_SHOWN` | `false` | Hides the Attention gauge until something spends Attention |
| `NEEDS_YOU_COUNT_INCLUDES_NEWS` | `false` | Whether news rows count toward the pill's number |

## Tracing

None new. The arrival ledger is UI-held and inspectable through `getOpeningReveal()`. E3–E5 are pure reads of state that is already traced (`essenceMovement`, `chapterArchive`).

```ts
// Shape exposed on the debug accessor (not a trace):
interface OpeningRevealDebug extends OpeningReveal { ledger: OpeningArrivalLedger; queued: OpeningRevealSurfaceId[] }
```

## Fail-soft table

| Failure | Fallback |
|---|---|
| `releaseOpeningArrivals` throws | Every ready row arrives (today's behaviour); no toast storm, because rows that flip on one render share one toast |
| `chapterArchive` absent | Only the idle fallback paces arrivals |
| Unknown `arrivesWith` id | The row arrives on its own |
| `refill` absent on a row | Arrow reads steady (—); no throw |
| Movement record missing or window rolled | Spend reading 0: no ▼, never a false ▼ |
| Hand has no odds pips | Legend shows price and setback only |

## Three-pillar check

- [x] Engine pillar present: E1–E5, one pure queue, three pure reads, one count change
- [x] Content pillar present: six captions, toast shape, the per-hand pip legend, four aftermath meanings
- [x] UI pillar present: U1–U8, Playwright DOM evidence
- [x] Wiring section connects them: wiring table, interface rows, two debug accessors extended

## Vision audit

- [x] No Vision premise contradicted. This serves the north star (*the player must be able to weigh the cost of a nudge*) and non-negotiable #3 (mechanics through prose, never numbers). It extends the reveal order THR-1808/1837/1986 already chose. Hiding Attention changes no rule: nothing spends it today.
- [x] No Vision edit needed.

## Rulebook impact

- [x] No rule of play changes. Doom, Mandates, rivals, income and Attention behave exactly as before. Only *when they are shown* and *what their readouts claim* change.
- [x] No `Docs/canon/rulebook.md` edit needed.

> Brainstorm companion: `Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Pace, idle fallback, ceiling, gauge switch and count rule are named constants; order is table order |
| 2. Inspectability | PASS | Ledger and queue on `getOpeningReveal()`; direction on `getEssenceRefill()` |
| 3. Determinism | PASS | No randomness; the queue is a pure function of its inputs |
| 4. Fail-soft | PASS | Every new read degrades to today's screen (table above) |
| 5. Narrative over mechanical perfection | PASS | Arrivals come at story beats (a chapter closing), each with a sentence |
| 6. Additive over destructive | PASS with note | New fields and ids are additive. The ceiling's meaning changes (ready, not shown); the gauge and the news count are switches that restore today's behaviour |
| 7. Performance budget | PASS | One pass over ≤ 21 table rows per render; the archive scan is the one `hasResolvedFirstChapter` already does |

## Done when

Two build tickets and one deferral, filed in *Cold playtest · round 5*:

**S1: New things arrive one at a time** (E1, E2; U1–U4; captions, toast):
- [ ] Unit tests on `releaseOpeningArrivals`: three rows ready at once arrive on three successive chapter closes; with no chapter, the next arrives after `OPENING_REVEAL_ARRIVAL_IDLE_TICKS`; `dominion` arrives in the same step as `reaches`; past the ceiling, rows still arrive one per step.
- [ ] Unit test: after `the_seat` resolves, `doom`, `mandate` and `investiture` are `queued` and arrive on separate chapter closes.
- [ ] On a fresh staged run (`?view=game&firstunmet&size=medium`, bond, then `window.__DEBUG.tick(n)`), `await window.__DEBUG.getOpeningReveal()` never shows two non-paired rows with the same arrival tick, and each arrival raised one toast whose text ends with that row's caption.
- [ ] The Rivals button and the four lens buttons are absent until their rows arrive. The Attention gauge is absent on the rail.
- [ ] Four-part browser evidence at 1920×1080 and 2560×1440 (rail and top bar layout change); `npm run gate` green.

**S2: Readouts say what they show** (E3–E5; U5–U8; legends):
- [ ] Unit tests: `essenceDirection` per band and at the cap; `playerSpendSince` lights only on `spend_*` growth; a refill render after a spend does not cancel the flash timer (fake timers on `EssenceBlock`).
- [ ] On `?view=game&seeded&size=medium`, after a played card, the spent row shows ▼ and ↑ while it refills; an unspent row shows no ▼ (DOM read).
- [ ] On `?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge`, the card legend lists only the hand's shapes; the aftermath legend reads the four meanings and `slight · clear · great`.
- [ ] `buildNeedsYou` count excludes news (unit test); the pill shows no number with only news.
- [ ] One 1920×1080 screenshot per surface (essence row, card legend, aftermath legend, pill); `npm run gate` green.

**Deferral:** *Attention is never spent*. Wire a spend to the attention-tier design (`Docs/plans/2026-04-05-attention-tier-model-design.md`) or retire the pool, then set `ATTENTION_GAUGE_SHOWN` back on.

## Coordination block

**Suggested model:** S1 opus (a new queue across the reveal selector, hook, top bar and lens bar); S2 sonnet (small reads and legend copy in known files).

**Parallel-safe with:** S1 and S2 with each other (disjoint files except `debug-bridge.ts`, a one-line merge); [THR-2059](https://linear.app/threadbare/issue/THR-2059) (God's Will and chapter scoring).

**Mutex with:**
- S1 with any build editing `opening-reveal-table.ts`, `openingReveal.ts`, `GameViewTopBar.tsx` or `map-lenses.ts`; with [THR-2053](https://linear.app/threadbare/issue/THR-2053) (arrival holds share the top bar and the gift-arrival path).
- S2 with [THR-2052](https://linear.app/threadbare/issue/THR-2052) (In Dev, edits `EncounterVeil.tsx`) and [THR-2057](https://linear.app/threadbare/issue/THR-2057) (legend and tooltip copy); with any build editing `EssenceBlock.tsx` or `needsYou.ts`.

**Files to touch:**
- S1: `src/data/opening-reveal-table.ts`, `src/engine/openingReveal.ts`, `src/components/Game/GameView/openingReveal.ts`, `src/components/Game/GameView/firstScreenReveal.ts`, `src/data/frame-registry.ts`, `src/data/map-lenses.ts`, `src/components/HexMapV2/chrome/MapLensSwitch.tsx`, `src/components/Game/frame/godRailComponents.tsx`, `src/data/first-use-captions.ts`, the reveal toast copy in `src/data/ui-content.ts`, `src/debug-bridge.ts` + `.d.ts`, tests beside each.
- S2: `src/engine/views/essenceRefill.ts`, `src/engine/views/subjects/godSheet.ts`, `src/engine/essenceMovement.ts`, `src/components/Game/ascendant-bar/EssenceBlock.tsx`, `src/data/nudge-card-display.ts`, `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx`, `src/data/aftermath-legend-words.ts` (new), `src/components/Game/EncounterVeil.tsx`, `src/engine/views/needsYou.ts`, the Needs-you pill component, `src/debug-bridge.ts` + `.d.ts`.

## Notes for the executor

- **Do not wire an Attention spend.** That is the deferral's design question; S1 only hides the gauge.
- **Do not move a gift's timing.** Spine pacing (`SPINE_PLAYER_ACTS_BETWEEN_GIFTS`, `BEAT_MIN_GAP`) is unchanged; the queue sits after the gifts.
- **A reload is not an arrival.** Rows ready at the hook's first render all show with no toast and no ring.
- **Grey zone:** if a toast and the panel's caption show the same sentence at once, keep both; the toast leaves and the caption stays until used (THR-1986's rule).
- **Grey zone:** the hollow glyph for a mixed hand is the lowest present tier's hollow shape.

## Intent-judge verdict

**Allow** (Reversible) on pass 2. Pass 1 was Revise with five findings, all on player legibility: the surface table and signal lacked their own headings, the Rivals, Mandate, Investiture, Reaches+Dominion and lens toasts were not quoted, the Needs-you header text was not quoted, PC-7 was claimed where nothing tells the player what to do next, and PC-5 was not named. Each was fixed in place.

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-10-26.*

### NFP audit

**PASS-with-notes.** Tunability, fail-soft, narrative and performance: PASS. Inspectability note: the ledger is UI-held and shown through `getOpeningReveal()`, not traced. Determinism note: a reload re-arrives every ready row at once, as the plan intends. Additive note: the ceiling's meaning changes, and the gauge and news-count switches restore today's behaviour.

### Three-pillar audit

**PASS-with-notes.** Engine, Content and UI are all present-and-substantive. The substrate inventory matches `systems-inventory.md` (opening reveal, attention, essence modules extended, none rebuilt). Notes: the Engine subsections for nodes, phases, resolution and PRNG are folded into one line, and event notifications live in U1 and the text table. No touched file has 100 or more importers (measured: `ui-content.ts` 36), so no Blast Radius section is needed.

### Vision audit

**PASS-with-notes.** No contradictions. The plan confirms the north star and non-negotiables #2, #3 and #6, and leans toward legibility on tension #4, which its evidence supports. Notes: (1) the essence row keeps its balance numeral (existing, and Law 13 allows numerals for pool balances only; no numeral is added); (2) captions sit near the taste profile's "manual-style copy" line, but stay one sentence and vanish on use.
