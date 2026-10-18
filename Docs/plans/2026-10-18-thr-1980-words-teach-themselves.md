> **title:** `Words teach themselves by something changing — THR-1980`
> **linear_issue:** THR-1980
> **author:** `Claude Code` (design lane, run 2026-10-18d, unattended)
> **created:** 2026-10-18
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Words teach themselves by something changing — THR-1980

*Four rounds in a row, every cold tester lists the same words under "never understood". Round 3's fix gave each word a sentence; round 4 shows a sentence is not enough when nothing on screen moves. This plan makes each early word teach itself by a visible change, and keeps the later words out of sight until they first matter.*

## Why this is load-bearing

Complaint class PC-1 (unexplained resources, terms and odds) is the oldest open class in [`Docs/ops/player-complaint-classes.md`](../ops/player-complaint-classes.md). It recurred in every round: [THR-1607](https://linear.app/threadbare/issue/THR-1607) (r1), [THR-1713](https://linear.app/threadbare/issue/THR-1713) (r2), [THR-1807](https://linear.app/threadbare/issue/THR-1807) (r3), and now THR-1980 (r4, 3/3 testers; never-understood counts 14 / 14 / 11). Round 4 confirms that one of round 3's fixes worked: the skimmer learned the opposite-trait miss *because a visible thing changed* — *"I worked out that a lean decides which way the mortal's character shifts on a hit or miss. That one clicked eventually."* The failures are the words whose sentence claims something the screen never shows:

- **The sphere pour.** *"Every essence still showed 50 afterwards, so I couldn't see any effect"* (story); *"all my spheres showed 50 afterwards"* (skimmer). Measured below: every pool starts at 50 **and** the pool cap starts at 50, so no pool can refill until something is spent. The pour's effect is literally invisible until the first spend, and even then no row says how fast it refills.
- **The odds legend** (*"I couldn't parse it at all"*), **grey Fated** read as bad, **Doomed that didn't move** after a 5-essence card, and **card ★ vs ✦**.
- **Attention, Dominion, Threads, Elder powers, "Asks you", "Stop interruptions", "Let it stand"** (3/3): each has a tooltip or a fold, and none was hovered. The story tester was *"scared to press either ['Stop interruptions' / 'Asks you'], in case Elara's chapters stopped completely."*
- **The Chronicle's engine terms** (3/3): *"shadow tier 6"*, *"stone tier 10 Avatar of Stone"*, *"+0.02Q"* — every stranger's tier-up lands in the Now tab verbatim.

**The ticket's design question:** *which ten words must a new player learn in the first fifteen minutes, where does each one teach itself (by something visibly changing, not by a tooltip), and which of the rest stay hidden until they first matter?* § The ten words answers it; every action item below is one row of that table.

**This plan takes the step round 3 held back.** THR-1807's decision ([comment, 2026-10-11](https://linear.app/threadbare/issue/THR-1807)) listed *"'Seen once' visible captions: held back as the next step if round 4 shows testers never hover"*, and named the trigger: *"Round-4 logs showing no top-bar hovers → seen-once captions."* Round 4 shows exactly that. It also rejected *"changing the pour so it moves starting pools"* because it changes what the pour means; this plan keeps that rejection and makes the pour's real effect (refill speed) visible instead.

**Decided by the design lane under delegation (process.md rule 4), invited for veto in the run report:**

1. **Every essence row says how fast it refills, as a word with a rung** (`Refills fast ●●●`, `steadily ●●○`, `slowly ●○○`, `Drains`), and the pour screen shows that word live under each sphere as the player pours. A rate is never a number (Law 13 allows numerals only for pool *balances*).
2. **The odds legend becomes one sentence that names the ladder**: *"The word is how it looks now, worst to best: Doomed, Perilous, Uncertain, Favorable, Fated. Green lines help, red lines hinder."* The Fated pill **stays grey** (Christian's 2026-10-04 ruling, see § Needs Christian); the ladder sentence and the pill's hover say it is the best rung.
3. **A move inside one tier says the word held**: *"▲ your hand lifts the odds — still Doomed"*, and *"— close to Perilous"* when the new odds sit within a margin of the next rung.
4. **The card legend shows the whole pip ladder** (`● ■ ◆ ★ odds, weakest to strongest`), so ★ reads as strong odds, not as the price.
5. **First-use captions.** A word that matters from the bond carries a one-line visible caption under its panel until the player hovers or uses it once, or presses "got it". At most two captions show at once. Dismissal is remembered (Law 51).
6. **Two panels arrive later.** Attention moves from the bond to The First's first chapter (when the first moment draws on it). Dominion (the card chip and the sheet box) arrives with the *A path opens* gift, beside the Reaches it is read with.
7. **The Chronicle speaks in words, about people you follow.** A tier-up or a critical success enters the Chronicle only for a mortal the god has a thread to. Its line reads *"Vara is now Subtle in Shadow and is called Shadow Master."* — no tier number, no `Q`.
8. **"Let it stand" becomes "Go on".** It is the only button on the fate-reveal screen; the old words read as a choice with a hidden alternative.

## Needs Christian (reserved, not decided)

**Should Fated be gold instead of grey?** Your 2026-10-04 layout pass ([THR-1724](https://linear.app/threadbare/issue/THR-1724)) set the forecast pill to quest-difficulty colours with *fated grey* ("a sure thing needs no god", `index.css:210-213`). The card's own Fated pip is gold (`nudge-pip-vocabulary.ts:90`), and the skimmer read grey Fated as the worst. This plan keeps your grey and fixes the reading with words (decision 2). Options: **(a) keep grey** (this plan's default); **(b) gold, matching the pip** (one token, `--forecast-fated-rgb`); **(c) keep grey and turn the Fated pip grey too**, so both say the same colour. The lane does not override your ruling.

## The ten words

What a new player must learn in the first fifteen minutes, and where each one teaches itself. "Visible change" is the teaching; the tooltip is the backup.

| # | Word | Teaches itself by | Action |
|---|---|---|---|
| 1 | **Essence** (and its spheres) | The row's balance drops when a card is played and climbs back at the row's refill speed | Refill word on each row (A1); caption (B1) |
| 2 | **The pour** | The refill word under each sphere changes as points are poured | Live refill word on the pour screen (A2) |
| 3 | **Forecast words** (Doomed … Fated) | The pill changes word as cards are staged | Ladder sentence (A3) |
| 4 | **helps / hinders** | Factor lines appear in green or red as the hand changes | Same sentence (A3) |
| 5 | **A move inside a tier** | The move line says "still Doomed", "close to Perilous" | A4 |
| 6 | **Price ✦ vs odds pips** | Playing a card drops essence by its ✦; the pips match the move | Pip-ladder legend (A5) |
| 7 | **The First / Threads** | Her row in the Threads panel lights when her chapter fires | Caption (B1) |
| 8 | **"Asks you" / "Lives on"** | Switching it changes whether her next chapter pauses the world | Caption that says chapters keep happening (B1) |
| 9 | **Chapter / Chapter Ledger** | The ledger fills as her chapters close | Caption on first chapter (B1) |
| 10 | **Attention** | The gauge drops the first time a moment is attended | Arrives at the first chapter (B2) + caption |

**Hidden until they first matter:** Doom, Mandates, Investiture (the *Seat* gift, unchanged); Notables (*First word* gift, unchanged); Reaches, World-Soul, Omens (*A path opens*, unchanged) **plus Dominion** (B2); Elder powers (the rows are folded today, but the fold's *header* shows from the bond whenever elder rows exist, `EssenceBlock.tsx:254-276` — B2 hides the header until the first elder charge or the first hover of a card that draws an elder sphere, both signals that exist today at `:230-233` and `:246`); strangers' growth (dropped from the Chronicle, B3). Each arrives with its caption.

**Not in this plan:** the six overlapping taxonomies (Reach / Sphere / Domain / Scale / rarity / verb) one tester named (1/3). The ten-word rule above keeps four of them out of the first fifteen minutes; a re-naming pass is a canon change, not a legibility fix, and needs its own evidence.

## Substrate inventory

Measured on `origin/main` @ `37809540` (2026-10-18). Every claim quotes file:line.

| Existing subsystem | Status | This plan |
|---|---|---|
| Essence income ledger (`computeEssenceGeneration`, `influence.ts:93-171`; split `distributeBySpherePoints`, `spherePoints.ts:135-146`; applied in `phaseEssence`, `orchestrator.ts:2738-2745`) | 🟢 ACTIVE | **read only.** Base `BASE_ESSENCE_PER_TICK = 1.0` (`influence-content.ts:15`); every sphere gets `UNBOUGHT_SPHERE_INCOME_SHARE = 0.04` of the total (`sphere-points-content.ts:30`), the rest is shared by bought points (budget 5, cap 3, `:13,16`). |
| Net income per sphere (`computeEssenceIncome`, `essenceIncome.ts:34-95`) | 🟢 ACTIVE | **reused.** Pure; net of thread and source upkeep from the primary sphere (`:94-95`). Already computed in `GameView.tsx:1650-1653` and **never read** (grep: only `:200, :1650, :1651`). This plan gives it its reader. |
| Starting pools and cap (`INITIAL_ESSENCE_PER_SPHERE = 50`, `influence.ts:31`; `BASE_MAX_ESSENCE = 50`, `influence-content.ts:44`) | 🟢 ACTIVE | **unchanged.** The two are equal, so no pool refills before the first spend — the measured reason the pour reads as doing nothing. |
| Essence rows (`EssenceBlock.tsx:98-175`; hover `essenceRowHover`, `godSheet.ts:159-169`; rows `selectEssenceRows`, `:210`) | 🟢 ACTIVE | **extends**: a refill word + 3-dot rung per row; the hover's first sentence names the speed. The row shows balance, fill bar, spend delta and trend arrow today; no rate (`:115-164`). |
| Pour screen (`SpheresStep.tsx:95-101`; copy `REMEMBRANCE_SPHERE_COPY`, `sphere-points-content.ts:76-83`) | 🟢 ACTIVE | **extends**: the live refill word under each sphere pole. The THR-1815 sentence stays. |
| Odds legend (`NUDGE_READING_LEGEND_ENTRIES`, `nudge-stage-content.ts:189-193`; render `NudgeStageHeader.tsx:443-490`; dismissal key `threadbare.ui.nudgeReadingLegendSeen`, `:167`) | 🟢 ACTIVE | **replaces** the two fragments with one sentence; keeps the "got it" and the seen key. |
| Forecast tiers (`FORECAST_TIER_WORDS`, `nudge-stage-content.ts:27-33`; thresholds `FORECAST_TIER_*_MAX` 0.2/0.4/0.6/0.8, `encounter-experience-constants.ts:62-68`; `classifyForecastTier`, `outcomeForecast.ts:44-51`) | 🟢 ACTIVE | **read only.** The ladder sentence lists the words in this order. |
| Forecast colours (`FORECAST_TIER_COLORS`, `CardFace.tsx:104-110`; tokens `index.css:217-221`, fated `150 150 150`) | 🟢 ACTIVE | **unchanged** (reserved, § Needs Christian). |
| Within-tier move line (THR-1858: `forecastHasMoved`, `useNudgeHand.ts:37-42`; `forecastMoveDirection`, `NudgeStageHeader.tsx:229-235`; lines `NUDGE_FORECAST_SHIFT_LINES`, `nudge-stage-content.ts:360-363`) | 🟢 ACTIVE | **extends**: when the tier did not change, the line adds "still {Tier}", and "close to {Next}" within a margin. |
| Card glyph legend (`NUDGE_GLYPH_LEGEND`, `nudge-card-display.ts:127-131`; render `NudgePhaseShell.tsx:578-607`; pips ● ■ ◆ ★ ▼, `nudge-pip-vocabulary.ts:54-110`; price ✦, `nudge-card-display.ts:27`) | 🟢 ACTIVE | **extends**: the odds entry shows all four pip shapes. |
| Opening reveal (`OPENING_REVEAL_TABLE`, `opening-reveal-table.ts:57-75`; triggers bond / first chapter / gift; ceiling 200 ticks `:78`) | 🟢 ACTIVE | **extends**: `attention` moves to `first_chapter`; a new `dominion` row on the *A path opens* gift. Dominion is in no row today, so it shows everywhere from the bond (card chip `CardFace.tsx:559`, `DominionBox.tsx`). |
| Elder powers fold (`EssenceBlock.tsx:225-276`: rows folded by `ESSENCE_FOUNDATION_FOLDED_DEFAULT = true`, `essenceDisplay.ts:37`; header `ESSENCE_ELDER_FOLD_LABEL` renders whenever `elderRows.length > 0`, `:254`; opens on `useElderCharge`, `:230-233`, or an elder-card hover, `:246`) | 🟢 ACTIVE | **extends**: the header renders only once either signal has fired (latched, Law 51 store), and carries the `elder_powers` caption when it first appears. |
| Attention gauge (`godRailComponents.tsx:94-106`, `shown('attention')`; copy `ui.attention`, `ui-content.ts:146-149`) | 🟢 ACTIVE | **re-timed** by the table row; no component change. |
| "Asks you" switch (`ThreadsPanel.tsx:317-396`, tooltip `ui.attention.asks` / `lives_on`, `ui-content.ts:836-848`); "Stop interruptions" (`FollowToggle.tsx:67`, tooltip `:116`) | 🟢 ACTIVE | **extends** with a first-use caption; tooltips unchanged. |
| "Let it stand" (`MEETING_FATE_REVEAL_CONTINUE`, `meeting-narrative-prose.ts:53`; the only button at `BondBeat.tsx:237-254` and `FormativeTestBeat.tsx:305-322`) | 🟢 ACTIVE | **rewords** the constant. |
| Chronicle intake (`phaseNarrative`, `orchestrator.ts:2674-2717`: every event with significance ≥ 0.8 is copied verbatim as `prose: event.message`) | 🟢 ACTIVE | **extends**: a threaded-actor gate for two event types, and `event.playerProse ?? event.message`. |
| Tier-up events (`orchestrator.ts:1080-1088` and `unifiedActionResolution.ts:2408`; message `"{name} reached {domain} tier {n}: \"{trait}\""`, significance 0.8; plus two rarity-graduation `tier_promotion` emitters, `orchestrator.ts:1143, :1218`, message `"{name} has achieved {Storied} status."`, significance 0.9, **each of which also pushes its own Chronicle entry directly** (`graduationChronicles.push`, `:1152`, `:1227`, merged into `chronicleEntries` at `:1344-1345`, bypassing `phaseNarrative`); crit-success Q delta (`unifiedActionResolution.ts:3027, :3048`); Chronicle card Q (`ChronicleEntryCard.tsx:57`) | 🟢 ACTIVE | **extends**: an additive `playerProse` field on the event; the card stops printing `Q`. `message` is unchanged for traces and logs. |
| Threaded predicate (`isThreadedByPlayer`, `notableAgendas.ts:141-147`) | 🟢 ACTIVE | **reused** by the Chronicle gate. |
| First-time-seen flags (localStorage only: `nudgeReadingLegendSeen`, `consequenceLegendSeen` `buildAftermathConsequences.ts:193`) | 🟢 ACTIVE | **pattern reused** for one caption store with one key per caption. |

No new system, node type, edge type or tick phase.

**Runtime population.** One god per run; 12 essence rows (the elder ones folded); the forecast pill, legend and move line on every attended step; 17 reveal rows today (18 after B2); every tier-up in the world passes `phaseNarrative`.

## Engine pillar

### Systems design

**E1. Refill band (pure view).** `src/engine/views/essenceRefill.ts`:

```ts
export type EssenceRefillBand = 'fast' | 'steady' | 'slow' | 'drains';
/** One sphere's net income as a share of the god's total gross income → its band.
 *  A share, not an absolute rate: the Seat (+1.0/tick) and thread yield raise the
 *  total, and an absolute band would re-word every row when they arrive. */
export function essenceRefillBand(netPerTick: number, grossTotalPerTick: number): EssenceRefillBand;
```

`share = netPerTick / grossTotalPerTick` (gross total = the sum of `computeEssenceGeneration`'s per-sphere gross, `influence.ts:93-171`; `grossTotalPerTick ≤ 0` → no band). `share ≥ ESSENCE_REFILL_FAST_SHARE` → fast; `≥ ESSENCE_REFILL_STEADY_SHARE` → steady; `> 0` → slow; otherwise drains. `selectEssenceRows` (`godSheet.ts:210`) takes the income pool the screen already computes (`GameView.tsx:1650-1653`) plus the gross total, and sets `row.refill` on each row. Because the split is proportional (`distributeBySpherePoints`, `spherePoints.ts:135-146`: a 0.04 floor per sphere, the remaining 0.52 by points), a sphere's share depends only on the pour, never on how big the total is: unbought `0.04` → slow, 1 point `0.04 + 0.52 × 1/5 ≈ 0.14` → steady, 2 points `≈ 0.25` → fast, 3 points `≈ 0.35` → fast. The Seat and thread yield change no word for any sphere except the deepest. Two things can move a row off its pour-screen word, and both are said on screen: upkeep drawn from the deepest sphere, an absolute amount, so its share can rise when the Seat arrives and fall as threads add upkeep, always with the "pays your upkeep" tag beside it (below); and a typed source or control effect feeding one sphere directly (`influence.ts:154-171`), which raises that sphere's share and slightly dilutes every other (the row hover already names what fed it, `essenceRowHover`, `godSheet.ts:159-169`).

**E2. Pour preview (pure).** The pour screen calls `distributeBySpherePoints(BASE_ESSENCE_PER_TICK, points)` (`spherePoints.ts:135`) on every change and bands each sphere with `essenceRefillBand(sphereIncome, BASE_ESSENCE_PER_TICK)`. Because bands are shares, this preview gives the same word the row gives after the bond for every sphere but the deepest (upkeep) and any sphere a source feeds directly. After the bond The First's thread adds yield and upkeep to the primary sphere, so its row may read one band different; the S1 Done-when pins the bought-faster-than-unbought ordering, not word-for-word equality.

**E3. Move-line detail (pure).** `forecastMoveDetail(base, now)` beside `forecastMoveDirection` returns `{ direction, heldTier?: ForecastTier, nearNext?: ForecastTier }`: `heldTier` when the tier is unchanged; `nearNext` when `now.probability` is within `FORECAST_NEAR_NEXT_TIER_MARGIN` of the next boundary in the move's direction (read from the `FORECAST_TIER_*_MAX` constants, never re-typed).

**E4. Chronicle gate and player prose.** `TickEvent` (`types/gameState.ts:80`) gains two optional fields (additive, NFP 6): `playerProse?: string` and `chronicleGate?: 'threaded_only'`. The producer declares the gate (Law 2's rule applied to the engine: the consumer never guesses from the message):
- Both `tier_promotion` sites (`orchestrator.ts:1080-1088`, `unifiedActionResolution.ts:2400-2410`) set `chronicleGate: 'threaded_only'` and `playerProse` from `CHRONICLE_TIER_UP_LINE`, filling the reach word from `getCapabilityWord(domain, capability)` (`domain-words.ts:88`) read after growth, and the granted trait (`PROMOTION_TRAITS`, `tierPromotion.ts:48-57`, e.g. shadow 6 → "Shadow Master").
- The two rarity-graduation `tier_promotion` sites (`orchestrator.ts:1136-1146` and `:1214-1222`, significance 0.9, "{name} has achieved {Storied} status.") set `chronicleGate: 'threaded_only'` too, with no prose change (renaming the rarity words is the taxonomy pass this plan leaves out). Those blocks **also** push a Chronicle entry directly (`graduationChronicles.push`, `orchestrator.ts:1152`, `:1227`; merged at `:1344-1345`). Both pushes get the same check: when `CHRONICLE_THREADED_GROWTH_ONLY` is on and `isThreadedByPlayer(state, actorNodeForRarity.id)` is false, the entry is not pushed and `chronicle.intake.skipped` is traced (`eventType: 'rarity_graduation'`).
- The `agent_action_resolved` site (`unifiedActionResolution.ts:3029-3036`) sets `chronicleGate: 'threaded_only'` when `finalAction.outcome === 'critical_success'` (the only path that reaches 0.8 there, `:3016-3018`), and on every resolved event sets `playerProse` to its message without the `qSuffix` (`:3025-3028`).

In `phaseNarrative` (`orchestrator.ts:2674`), an event with `chronicleGate === 'threaded_only'` enters the Chronicle only when `isThreadedByPlayer(state, event.actorId)`; otherwise it is skipped with a `chronicle.intake.skipped` trace (`reason: 'not_threaded'`). Master switch `CHRONICLE_THREADED_GROWTH_ONLY`. Every entry's `prose`, `title` and `witnessFacts` read `event.playerProse ?? event.message`; `description` on the narrative event keeps `message`.

**E5. Reveal rows.** `OPENING_REVEAL_TABLE`: `attention` → `{ kind: 'first_chapter' }`, `newLabel: 'Attention'`; new surface id `dominion` → `gift('beat.spine.a_path_opens')`, `newLabel: 'Dominion'`. The `a_path_opens` toast copy (`ui-content.ts`, `OPENING_REVEAL_TOAST`) gains the word. The 200-tick ceiling still reveals both.

### Graph nodes / edges

None. Captions are a player preference, not world state.

### Tick phases

None new. E4 runs inside the existing narrative phase; E1–E3 are render-time reads.

### Resolution logic

Untouched. Income, upkeep, odds, tier thresholds and growth are unchanged; this plan only reads them.

### PRNG callouts

None. No draw is added or moved.

## Content pillar

### Data tables

**`src/data/essence-refill-content.ts` (new).**

| Band | Word on the row | Rung | Pour-screen word |
|---|---|---|---|
| fast | "Refills fast" | ●●● | "refills fast" |
| steady | "Refills steadily" | ●●○ | "refills steadily" |
| slow | "Refills slowly" | ●○○ | "refills slowly" |
| drains | "Drains" | ○○○ | — (cannot occur before the bond) |

A full pool reads "Full · refills fast" — the band word still shows, so the player learns the speed before the first spend.

**The upkeep tag.** The deepest sphere (the primary, `deriveAlignmentFromPoints`, `spherePoints.ts:123-127`) pays thread and source upkeep, so its net income can fall a band once threads exist. Its word carries a tag on both screens so the difference is said, never silent: the pour screen shows "refills fast · pays your upkeep" under the deepest sphere (the THR-1815 sentence already says "your deepest sphere pays your upkeep"), and its essence row shows the band of its **net** income with the same tag, e.g. "Refills steadily ●●○ · pays your upkeep". The row hover then opens: "Refills steadily: your threads' upkeep is paid from this pool." Constant `ESSENCE_UPKEEP_TAG = 'pays your upkeep'`.

**`src/data/first-use-captions.ts` (new) — `FIRST_USE_CAPTIONS`, one entry per surface (Law 58).** ≤ 15 words each, game prose, no second person outside the god's own acts except where the god is the subject (Law 42):

| Surface id | Caption |
|---|---|
| `essence` | "Your essence. Cards spend it; each pool refills at the speed beside it." |
| `threads` | "The mortals you hold a thread to. Their chapters arrive here." |
| `asks_you` | "Her chapters keep happening either way. This only decides if they pause the world." |
| `chapter_ledger` | "Every chapter The First has closed, kept to read again." |
| `attention` | "Your free notice. Attending a moment draws on it; it refills with time." |
| `dominion` | "How much a place or person is already yours. Your own ground is cheaper to touch." |
| `doom` | "A slow clock toward the world's end. It cannot end the world early." |
| `reaches` | "What you can do, and how well. Each Reach grows as you use it." |
| `world_soul` | "The world's mood right now. You read it; you do not spend it." |
| `omen` | "A passing sign of what presses on the world. It fades in days." |
| `elder_powers` | "Old spheres you were not made of. Some cards still draw on them." |
| `stop_interruptions` | "{name}'s chapters still happen. This only stops them pausing the world." |

The `asks_you` and `stop_interruptions` captions name the mortal at render (`{name}` resolves through enrichment, Law 43); the table holds "{name}'s chapters keep happening either way. This only decides if they pause the world." — the "Her" above is the rendered sample's register only, and the shipped copy never guesses a pronoun.

**Copy edits.**
- `NUDGE_READING_LEGEND_ENTRIES` → one entry, `{ id: 'reading', tooltipId: 'ui.nudge_forecast', label: 'The word is how it looks now, worst to best: Doomed, Perilous, Uncertain, Favorable, Fated. Green lines help, red lines hinder.' }`. The ladder is built from `FORECAST_TIER_LADDER` + `FORECAST_TIER_WORDS`, never typed twice. The interface type widens to allow `'reading'`.
- `NUDGE_FORECAST_SHIFT_LINES` gains `held: ' — still {tier}'` and `near: ' — close to {tier}'`.
- `NUDGE_GLYPH_LEGEND` odds entry: `glyph: '● ■ ◆ ★'`, `label: 'odds, weakest to strongest'`.
- `ui.forecast.fated` desc gains a first clause: "The best word on the ladder." (≤ 200 characters after the edit, Law 18).
- `MEETING_FATE_REVEAL_CONTINUE`: "Let it stand" → "Go on".
- `CHRONICLE_TIER_UP_LINE = '{name} is now {word} in {Reach} and is called {trait}.'` in the Chronicle content file.
- `ui.essence.row` (`ui-content.ts:1197-1200`, unused today) is deleted or wired; the row's hover keeps coming from `essenceRowHover`, whose first sentence becomes the band word.

### Encounter templates

N/A — no template is added or edited; the change is in how odds and growth are shown.

### Prose tables

`CHRONICLE_TIER_UP_LINE` above. N/A otherwise.

### Attachment content

N/A — no item or attachment changes.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces; nothing here is WebGL).*

**UI Laws engaged:** 1 (tooltip on every new word), 11 (glyph rows carry `aria-label`s), 12 (the pip ladder at first contact), 13 (rates as words, never numbers; the Chronicle's `Q` removed), 17/18 (registry tooltips, ≤ 200 chars), 25 (captions never cover an inert control), 31 (colour never alone: the ladder sentence), 33 (captions never push a rail past the viewport), 42 (plain register), 51 (caption dismissal remembered), 53 (captions are temporary, not HUD budget), 57 (a rail grows before captions fold).

### Player-facing display

- **U1. Essence rows.** After the balance: the band word in the row's text colour plus a 3-dot `StepDots variant="magnitude"` rung, `aria-label` "Refills fast, 3 of 3". At 1080p the word may shorten to the rung alone if the 2-column grid (`EssenceBlock.tsx:250`) has no room; the hover always carries the word.
- **U2. Pour screen.** Under each sphere pole, the pour-screen word in small type, updating as points move; the deepest sphere adds the upkeep tag.
- **U3. Odds legend.** One line, same position and same "got it" as today.
- **U4. Move line.** "▲ your hand lifts the odds — still Doomed".
- **U5. Card legend.** "● ■ ◆ ★ odds, weakest to strongest".
- **U6. First-use caption primitive** `FirstUseCaption` (shared, styleguide entry and `component-selection.md` row in the same PR, Law 29): one muted line under its panel with a small "got it". It hides for good on the first hover of its panel's tooltip, the first click in the panel, or "got it". `FIRST_USE_CAPTIONS_MAX_VISIBLE = 2`: further captions wait in table order. A caption for a surface not yet revealed never shows. Store: `threadbare.ui.firstUseCaption.<surfaceId>` (Law 51), with the same try/catch fail-soft as the legend.
- **U7. Chronicle card** (`ChronicleEntryCard.tsx:57`) stops rendering `quintessenceDelta`.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Pour screen, under Life (3 points poured) | "refills fast" — and under an unpoured sphere, "refills slowly" | PC-1, PC-6 | The word changes as they pour; the THR-1815 sentence above ("What you pour decides which pools refill fastest…") is now visibly true. |
| Essence row (a bought, non-deepest sphere, full) | "Order 50 · Full · refills fast ●●●" | PC-1, PC-6 | Same word as the pour screen. Hover: "Refills fast. {Order's role}. Steady." |
| Essence row (the deepest sphere, after the bond) | "Life 50 · Full · refills steadily ●●○ · pays your upkeep" | PC-1, PC-6 | The pour screen said "refills fast · pays your upkeep"; the tag on both screens says why the row can read slower. Hover: "Refills steadily: your threads' upkeep is paid from this pool. {Life's role}. Steady." |
| Essence caption | "Your essence. Cards spend it; each pool refills at the speed beside it." | PC-1 | Visible until hovered, used or dismissed. |
| Odds legend | "The word is how it looks now, worst to best: Doomed, Perilous, Uncertain, Favorable, Fated. Green lines help, red lines hinder." | PC-1 | The ladder order says Fated is best, whatever its colour. |
| Forecast pill hover (Fated) | "The best word on the ladder. As things stand, this attempt all but cannot fail. Even so, fate rolls and the ending is its own. See How it looks." | PC-1 | Registry tooltip. |
| Move line | "▲ your hand lifts the odds — still Doomed" / "▲ your hand lifts the odds — close to Perilous" | PC-1 | The essence did something even though the word held. |
| Card legend | "✦ price · ● ■ ◆ ★ odds, weakest to strongest · ▼ setback" | PC-1 | ★ reads as the strongest odds, ✦ as the price. |
| "Asks you" caption (rendered) | "Elara's chapters keep happening either way. This only decides if they pause the world." | PC-1 | Answers the story tester's fear directly. |
| Attention caption (first chapter) | "Your free notice. Attending a moment draws on it; it refills with time." | PC-1 | Arrives with the first moment that draws on it. |
| Dominion caption (*A path opens*) | "How much a place or person is already yours. Your own ground is cheaper to touch." | PC-1 | Arrives with the Reaches; the toast names it ("New beside the map: your Reaches, Dominion, the World-Soul and Omens."). |
| Elder powers fold header (first elder charge or elder-card hover) | "Elder powers" with the caption "Old spheres you were not made of. Some cards still draw on them." | PC-1 | The word appears only when something drew on, or is about to draw on, an elder pool, so the caption meets a visible change. |
| "Stop interruptions" caption (rendered, on a chapter's follow control) | "Elara's chapters still happen. This only stops them pausing the world." | PC-1 | Answers the story tester's fear; the existing tooltip (`FollowToggle.tsx:68`) stays. |
| Fate-reveal button | "Go on" | PC-1 | One button, one onward step; no hidden alternative implied. |
| Chronicle, a threaded mortal's tier-up | "Vara is now Subtle in Shadow and is called Shadow Master." | PC-1, PC-6 | The reach word matches the mortal's card (`getCapabilityWord`). Strangers' tier-ups and rarity graduations no longer appear. |

PC-6 check: the refill word comes from one function (`essenceRefillBand`, a share of total income) on both screens, so the Seat and new threads never re-word a row except the deepest, which carries "pays your upkeep". For every sphere but the deepest the two words match unless a source feeds that sphere directly, which the row hover names ("Fed by …"); the deepest can read one band slower on the row once threads charge upkeep, and both screens carry "pays your upkeep" beside it, with the row hover naming the reason; the Chronicle's reach word comes from the same scale the mortal's card prints; the ladder sentence is built from the tier constants the pill uses.

### Playtest signal

A round-5 tester who poured spheres can say which of their pools refill fastest; a tester who staged a card that did not change the forecast word can say whether it helped; and no tester names Fated, the odds legend, Attention, Dominion or Chronicle tier jargon as unclear while also saying they saw its caption.

### Event notifications

The `a_path_opens` toast names Dominion. No new toast.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getEssenceRefill()` → `Promise<{ grossTotalPerTick: number; spheres: Record<SphereName, { netPerTick: number; share: number; band: EssenceRefillBand }> }>`.
- `window.__DEBUG.getFirstUseCaptions()` → `Promise<{ visible: string[]; dismissed: string[]; queued: string[] }>`; `window.__DEBUG.resetFirstUseCaptions()` for repeat captures.
- `chronicle.intake.skipped` traces through `await window.__DEBUG.getTraces()` with tracing enabled.

### Visual presence (HexMapV2)

N/A — no map layer changes. The Dominion *lens* button belongs to the lens bar ([THR-1898](https://linear.app/threadbare/issue/THR-1898), shipped), which has its own label and tooltip; it is not gated by B2.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `views/essenceRefill.ts` | render (reads `computeEssenceIncome`) | `EssenceBlock.tsx`, `SpheresStep.tsx` | none (reads pools) | none (pure) | `getEssenceRefill()` |
| `forecastMoveDetail` | render | `NudgeStageHeader.tsx` | none | none | DOM `data-testid="nudge-forecast-moved"` |
| `FirstUseCaption` + `first-use-captions.ts` | render | god rail, Threads panel, ledger rail | localStorage only | none | `getFirstUseCaptions()` |
| `opening-reveal-table.ts` rows | render (reveal latch) | god rail (attention), `CardFace.tsx`, `DominionBox.tsx` | none | existing reveal traces | existing reveal accessors |
| `phaseNarrative` gate + `playerProse`; rarity-graduation direct pushes (`orchestrator.ts:1152`, `:1227`, merged `:1344-1345`) | narrative phase (`orchestrator.ts:2674`) and the rarity block of the resolution pass | `ChroniclePanel.tsx`, `ChronicleEntryCard.tsx` | `chronicleEntries` | `chronicle.intake.skipped` | traces |

## Interface impact

| Contract | Kind | Change |
|---|---|---|
| Essence economy → god rail (`computeEssenceIncome` read) | extend | The rail now reads net income per sphere (already computed, unread). Read site: `selectEssenceRows`. |
| Threads → Chronicle (`isThreadedByPlayer` read in `phaseNarrative`) | add | New cross-system read: the Chronicle intake asks whether the god holds a thread to the actor. Row added to `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` (`threaded-growth-reaches-chronicle`). |
| Growth → Chronicle (`tier_promotion` events) | extend | Adds `playerProse`; `message` preserved for every existing reader. |
| Opening reveal → card face (Dominion chip) | add | The card face reads the reveal state for one chip. |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `ESSENCE_REFILL_FAST_SHARE` | 0.2 | Net share of total gross income at or above this reads "Refills fast" |
| `ESSENCE_REFILL_STEADY_SHARE` | 0.08 | At or above this share (below fast) reads "Refills steadily"; above 0 reads "slowly" |
| `ESSENCE_UPKEEP_TAG` | `'pays your upkeep'` | Tag beside the deepest sphere's refill word on the pour screen and its row |
| `FORECAST_NEAR_NEXT_TIER_MARGIN` | 0.05 | Odds within this of the next boundary add "close to {Next}" |
| `FIRST_USE_CAPTIONS_MAX_VISIBLE` | 2 | Captions on screen at once; the rest queue in table order |
| `FIRST_USE_CAPTION_STORE_PREFIX` | `'threadbare.ui.firstUseCaption.'` | Law 51 key prefix, one key per caption |
| `CHRONICLE_THREADED_GROWTH_ONLY` | `true` | Master switch for the Chronicle growth gate |

## Tracing

```ts
interface ChronicleIntakeSkippedTrace {
  type: 'chronicle.intake.skipped';
  tick: number;
  eventId: string;
  eventType: 'tier_promotion' | 'agent_action_resolved' | 'rarity_graduation';
  actorId: string;
  reason: 'not_threaded';
}
```

E1–E3 are pure render reads and emit nothing; their inputs are inspectable through the two debug accessors.

## Fail-soft table

| Failure | Fallback |
|---|---|
| `computeEssenceIncome` throws or returns no entry for a sphere | The row shows no refill word (today's row); no throw |
| localStorage unavailable | Captions show for this session and dismiss in memory; the legend already behaves this way |
| A caption's surface id has no table entry | No caption; a dev warning once |
| `event.actorId` missing on a tier-up | Treated as not threaded; skipped with the trace |
| `getCapabilityWord` cannot read the capability | `playerProse` absent; the entry falls back to `message` (today's line) — never a raw `{token}` |
| Ladder constants out of order | The sentence uses `FORECAST_TIER_LADDER` order; a content test pins it |
| Rail out of room at 1080p | The refill word collapses to the rung; captions queue (max visible) before any rail scrolls |

## Blast Radius

`src/engine/orchestrator.ts` and `src/types` event types are wide-blast (codesight hot files). The edit is additive: one optional field on the event type, one gate inside `phaseNarrative`. Tests that assert Chronicle entry counts for unthreaded actors will change; the executor updates them to the gated count with the switch on, and keeps one test with the switch off proving today's behaviour.

## Three-pillar check

- [x] Engine pillar present — E1–E5: one pure refill-band view, one pure move-detail helper, one narrative-phase gate, two additive event fields, two reveal-table rows
- [x] Content pillar present — refill words, twelve first-use captions, the ladder sentence, move-line words, the pip legend, the Fated hover clause, "Go on", the tier-up line
- [x] UI pillar present — U1–U7, Playwright DOM evidence at 1920×1080 (S2 adds 2560×1440)
- [x] Wiring section connects them — wiring table, interface rows, two debug accessors, one trace

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves "the player must be able to weigh the cost of a nudge" (north star) and non-negotiable #3 (mechanics surface through prose, never numbers): rates become words, and tier numbers and `Q` leave the Chronicle. It follows the reveal order THR-1808/1837 already chose. The pour keeps its meaning (refill speed and upkeep payer), as THR-1807 required. The captions sit near the taste profile's "IPK, not tutorials" line: they are one line each, vanish on first use, and never block play.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play. Income, upkeep, odds, tiers, growth and chapter draws are unchanged; the Chronicle gate changes what is *reported*, not what happens.
- [x] No `Docs/canon/rulebook.md` edit needed. The quick reference already says the pour splits income.

> Brainstorm companion: `Docs/plans/2026-10-18-thr-1980-words-teach-themselves-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Refill thresholds, the near-tier margin, the caption cap and the Chronicle switch are named constants; words and captions are data tables. |
| 2. Inspectability | PASS | `getEssenceRefill`, `getFirstUseCaptions`, and `chronicle.intake.skipped` on every skipped entry. |
| 3. Determinism | PASS | No randomness; pure reads and one predicate. |
| 4. Fail-soft | PASS | See the fail-soft table; every new read degrades to the surface shipped today. |
| 5. Narrative over mechanical perfection | PASS | The Chronicle reads as story about people the player follows; no tier numbers or `Q`. |
| 6. Additive over destructive | PASS with note | `playerProse`, `chronicleGate` and `row.refill` are optional; `message` is untouched. Strangers' growth leaves the Chronicle by default; `CHRONICLE_THREADED_GROWTH_ONLY = false` restores it. |
| 7. Performance budget | PASS | One read of an already-computed memo; one predicate per ≥ 0.8 event in the narrative phase. |

## Done when

Two build tickets, filed in *Cold playtest · round 4*:

**S1 — Show what the pour and the odds do** (E1–E3, A1–A5; U1–U5):
- [ ] On `?view=game&seeded&size=medium`, `await window.__DEBUG.getEssenceRefill()` returns, for each bought sphere other than the deepest, a faster band than for every unbought sphere, and the deepest sphere's row carries "pays your upkeep" (a relative predicate: it holds before and after the Seat beat); a unit test pins that adding the Seat's income changes no band for any sphere except the deepest; each essence row renders its word and rung (Playwright DOM).
- [ ] On the pour screen, moving a point changes the word under that sphere (DOM read before and after).
- [ ] The legend renders the one-sentence ladder; a staged card that keeps the tier renders "— still {Tier}" (spawn route `?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge`).
- [ ] The card legend renders "● ■ ◆ ★ odds, weakest to strongest".
- [ ] Unit tests: `essenceRefillBand` at each threshold; `forecastMoveDetail` held / near / changed; the ladder sentence order.
- [ ] Four-part browser evidence at 1920×1080 (screenshot, console, the `__DEBUG` assertion, UI-Laws line for Laws 1, 11, 12, 13, 17, 31, 33).
- [ ] `npm run gate` green.

**S2 — Words that wait for their moment** (E4–E5; U6–U7, captions, "Go on"):
- [ ] After the bond, `await window.__DEBUG.getFirstUseCaptions()` lists `essence` and `threads` visible; after hovering the essence tooltip, `essence` is dismissed and survives a reload.
- [ ] The Attention gauge is absent after the bond and present after the first chapter; the Dominion chip is absent on cards until the *A path opens* gift (reveal test in `opening-reveal-table` tests).
- [ ] With tracing on, a 30-tick CLI smoke shows `chronicle.intake.skipped` for an unthreaded tier-up and no Chronicle entry for it; a threaded mortal's tier-up entry reads the `CHRONICLE_TIER_UP_LINE` shape with no digit and no `Q`; a unit test shows a rarity graduation for an unthreaded actor writes no Chronicle entry by either path (event or direct push).
- [ ] The fate-reveal button reads "Go on".
- [ ] The Elder powers fold header is absent after the bond on a fresh profile and present after the first elder charge (unit test on `EssenceBlock` with a fake charge).
- [ ] `FirstUseCaption` is on the styleguide with its `component-selection.md` row.
- [ ] Interface row `threaded-growth-reaches-chronicle`; wiki page whose `sources` match `orchestrator.ts` / Chronicle updated.
- [ ] Four-part browser evidence at 1920×1080 and 2560×1440 (a caption is a layout change); engine files touched → 30-tick CLI smoke and `npm run test:heavy`; `npm run gate` green.

## Coordination block

**Suggested model:** S1 sonnet (data and small view reads in known files); S2 opus (a phase gate on the wide-blast orchestrator, a new primitive and reveal-table timing).

**Parallel-safe with:** [THR-1984](https://linear.app/threadbare/issue/THR-1984) (The First's trade — meeting data and the person sheet, no shared file); [THR-1981](https://linear.app/threadbare/issue/THR-1981) (the opening picks — `SensingBeat`/`SparkBeat`, not `SpheresStep`; if its design pass merges setup screens, the pour preview moves with the pour step).

**Mutex with:**
- S1 with any build editing `nudge-stage-content.ts`, `NudgeStageHeader.tsx` or `EssenceBlock.tsx` (legend, move line, rows).
- S2 with any build editing `opening-reveal-table.ts` or `phaseNarrative` in `orchestrator.ts`; with [THR-1875](https://linear.app/threadbare/issue/THR-1875) (screen frame slice 3 — shares the god rail and the reveal surfaces; land whichever is first, then rebase the captions onto the frame's rows); with [THR-1965](https://linear.app/threadbare/issue/THR-1965) (Notables and Doom say why — edits Chronicle-adjacent doom prose).
- S2 is blocked by S1 (both edit the essence row; the essence caption names the refill speed S1 adds).

**Files to touch:**
- Create: `src/engine/views/essenceRefill.ts`, `src/data/essence-refill-content.ts`, `src/data/first-use-captions.ts`, `src/components/shared/FirstUseCaption.tsx`, tests beside each.
- Edit (S1): `src/engine/views/subjects/godSheet.ts`, `src/components/Game/ascendant-bar/EssenceBlock.tsx`, `src/components/Game/GameView.tsx` (pass the existing `essenceIncome` memo), `src/components/Remembrance/SpheresStep.tsx`, `src/data/nudge-stage-content.ts`, `src/components/Game/encounter-stage/shells/NudgeStageHeader.tsx`, `src/data/nudge-card-display.ts`, `src/data/ui-content.ts`, `src/debug-bridge.ts` + `.d.ts`.
- Edit (S2): `src/components/Game/ascendant-bar/EssenceBlock.tsx` (elder header latch), `src/components/Game/FollowToggle.tsx` (caption mount), `src/data/opening-reveal-table.ts`, `src/components/shared/CardFace.tsx`, `src/components/Game/DominionBox.tsx`, `src/engine/orchestrator.ts`, `src/engine/unifiedActionResolution.ts`, `src/types/gameState.ts` (`TickEvent.playerProse`, `chronicleGate`), `src/components/Game/ChronicleEntryCard.tsx`, `src/data/meeting-narrative-prose.ts`, `src/components/Game/ThreadsPanel.tsx`, god rail / ledger rail mounts, `src/debug-bridge.ts` + `.d.ts`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`.

## Notes for the executor

- **Never show the rate as a number.** Law 13's numeral exception covers pool *balances* only. If a number seems clearer, that is a law amendment for Christian, not an implementation choice.
- **Do not change starting pools or the cap.** THR-1807 rejected moving starting pools; the refill word is the whole fix.
- **Do not recolour Fated.** It is reserved (§ Needs Christian).
- **Bands are shares, not rates.** Divide net by the total gross; do not band absolute per-tick income, and do not convert through `TICKS_PER_DAY` (12) or `TICKS_PER_SEASON` (90) — `game-config.ts:31-32` warns those clocks are separate.
- **Keep `event.message` byte-identical.** The agent analyser and traces read it; only `playerProse` is new.
- **Grey zone:** if the 1080p essence grid has no room for the word, drop to the rung alone at that breakpoint (hover carries the word); verify at both screens.
- **Grey zone:** the Dominion chip lives on `CardFace`, which may not see reveal state today. Pass a `showDominion` flag through the hand model rather than reading a global.

## Intent-judge verdict

**Allow** (Reversible) on pass 4. Passes 1–3 were Revise, and each finding was fixed in place: (1) the Elder powers fold header is visible from the bond, so B2 hides it and adds a caption; the rarity-graduation emitters are gated; "Stop interruptions" gets a caption and a text row. (2) The rarity blocks' direct Chronicle pushes are gated too; the deepest sphere carries "pays your upkeep" on both screens. (3) Bands became shares of total income, so the Seat re-words no row. Pass-4 advisory (the deepest sphere's share moves with the total; a fed sphere dilutes the others) folded into E1, the PC-6 check and the S1 Done-when.

## Forked-audit verdicts

### NFP audit

**PASS-with-notes.** Tunability, determinism, fail-soft, narrative and performance PASS. Inspectability note: the Chronicle gate traces only skips, so an admitted entry leaves no intake trace (accepted: the admitted entry is itself the record). Additive note: strangers' growth leaves the Chronicle by default; `CHRONICLE_THREADED_GROWTH_ONLY` reverts it. Both notes are reflected in the NFP table.

### Three-pillar audit

**PASS-with-notes.** Engine, Content and UI all present-and-substantive; every template section present; wiring table connects each module to a phase, component, field, trace and accessor; substrate builds on Essence & Divine Economy and Attention, Chronicle & Narrative (both ACTIVE in `systems-inventory.md`) with no green-field twin. Cosmetic note: the substrate table names subsystems by code symbol rather than inventory name.

### Vision audit

**PASS-with-notes.** No contradictions. Extends the north star ("the player must be able to weigh the cost of a nudge"), confirms non-negotiable #3 (mechanics through prose, never numbers), and leans toward legibility on design tension #4, which already says the essence economy "probably needs to be more legible". Note: visible captions with a "got it" sit near the taste profile's "IPK, not tutorials" line, and the 3-dot rung is bar-like; neither is forbidden, since there are no numerals. Answered in § Vision audit: captions are one line, vanish on first use, never block play.
