> **title:** Give both clocks a verb — a threaded mortal's deeds fill the Mandate, Stay the Unmaking slows Doom, and Rebuke answers a rival where it pressed (THR-2202)
> **linear_issue:** THR-2202
> **author:** Claude Code (design lane, run dl-20261113T0820Z)
> **created:** 2026-11-13
> **three_pillars:** Engine done (three slices) · Content done (two god cards, line tables) · UI done (card-face line, Doom notice button, Mandate rows, rival toast)

Plan-size-exempt: multi-slice programme doc. Three build slices, one per clock answer, each filed as its own ticket; the slices share one Law-30 argument and one constants table, so splitting the doc would restate both three times.

# Give both clocks a verb (THR-2202)

*The player watches Doom and the Mandate and never plays them. The Mandate bar promises that a bound mortal's deeds fill it, and they add nothing. Doom has no card that slows it, although the rulebook says essence can. A rival's toast says "tend it" and offers no way to. This plan gives each threat one answer the player can play, priced from the same essence pools as the nudge cards, so that every spend is a choice between the two clocks (Law 30).*

## Why this is load-bearing

Christian approved this direction on 2026-11-12 ("Yes, file them"): ticket 2 of 5, "make the middle a game". Three sources agree (ticket body): the long expert session found Doom at the same stage at tick 600 whether or not anyone played; cold round 7 found the Mandate frozen at "Holding —" ([THR-2199](https://linear.app/threadbare/issue/THR-2199), 3 of 3 testers, one quit point); warm round 3 found rivals visible and unanswerable ([THR-2172](https://linear.app/threadbare/issue/THR-2172), 3 of 3). [Law 30](../game-design/laws.md) says one purse pays for both clocks, and today nothing in the purse reaches either.

## Substrate inventory

Measured on main @ 4740df5f.

| Subsystem | Status | Finding | This plan |
|---|---|---|---|
| Mandate ledger: `mandateLedger.ts` `isGodCausedPush` / `mandateCreditsFor`, folded by `phaseMandate.ts` `evaluateSphereGrowthMandate` (THR-2081) | 🟢 ACTIVE | A threaded mortal's push counts, but only as sphere pressure that **levels a score up** on that tick. The encounter-step push is `ENCOUNTER_PRESSURE_PER_STEP = 1`, only when the encounter carries `sphereAffinity`. THR-2081 measured the First's share at "0.000 on every arm". Undertakings push no sphere pressure at all. | **extends**: a direct deed credit on chapter close |
| Mandate trend word: `godSheet.ts:481-484` | 🟢 ACTIVE | `primaryDelta > 0.02` → "rising". `primaryDelta = ledger.primary / max(1, primaryBaseline)`, so the word reads "Holding" until the god has raised 2% of the world's whole primary total. It is a cumulative threshold, not a trend; the secondary sphere never moves it. | **fixes**: the word reads recent credit |
| Mandate fill line: `ascendant-bar-content.ts:150-157` `MANDATE_FILL_LINE` / `MANDATE_RAISED_BY_LINE` | 🟢 ACTIVE | Promises "the deeds of the mortals bound to you". Law 45 breach today. | **keeps**: becomes true |
| Doom clock: `doomClock.ts` `advanceDoomClock`, `accelerateDoomClock` / `decelerateDoomClock` (floor 0.1); `phaseDoom.ts:368-378` multiplies `tickModifier` by the product of `doom_rate_multiplier` overrides on individuals and ascendants | 🟢 ACTIVE | No card slows Doom. The slowing path exists: a negative `costs.doomDelta` reaches `decelerateDoomClock` (`nudgeDispatch.ts:348-354`), and no card authors one. | **extends**: a sustained god card using the existing `doom_rate_multiplier` override |
| Doom rate compounding | 🔴 BUG | `phaseDoom.ts:376-378` builds `clockForAdvance` with `tickModifier * doomRateMultiplier`, and `newDoom` (from it) is written back at `:447` / `:463`. An active multiplier therefore compounds every tick (0.5 halves the rate every tick). Today only the World-Tree artifact (0.5) and Voidgate (3.0) set one. | **fixes** in slice 2: the multiplier is applied to the advance, never stored |
| Doom stage notice: `phaseDoom.ts:400-415` popup → `EventPopup.tsx` compact tier, one `Acknowledge` that only dismisses | 🟢 ACTIVE | Offers nothing to do. | **extends**: a second button |
| Rival probe: `orchestrator.ts` `landRivalProbe` (magnitude `RIVAL_PRESSURE_MAGNITUDE = 4`), aimed at the god's turf (`godTurf` / `pickFromTurf`, untended 3:1) | 🟢 ACTIVE (THR-2185) | A tended place absorbs 4 (`DOMINION_TENDED_RAID_ABSORB`), which cancels a probe. Tending is a state (`TendedBy = claim · seat · carry · anointed`, `dominion.ts:81`), not a card; Claim Dominion is a milestone gift. | **extends**: a fifth tending kind, `rebuke`, made by a card |
| Rival toast: `rival-content.ts:112-115` `landed: '… Tend it and the next blow breaks.'` | 🟢 ACTIVE | Click opens the place (`notificationRouter.ts:61-63`). "The next blow breaks" is prose only: no pressure accumulates between landings. Law 45 breach. | **rewrites** the line |
| God card ladder: `CardProgression` (`unifiedAction.ts:2614`), `offer: 'gift'`, `giftBy: 'milestone'`, `generic: true` | 🟢 ACTIVE | 20 milestone gifts exist; held-ground is `beat.milestone.the_held_ground`. | **reads**: both new cards are generic milestone gifts |

## Decisions (made by the design lane under delegation, 2026-11-13 — veto in chat)

These are the *how* of an agreed direction. None changes what the game means: the rulebook already says essence slows Doom (`rulebook.md:415`), already says a tended place shrugs off a rival (`rulebook.md:210`), and THR-2081 already ruled that a threaded mortal's scene counts as the god's own hand (its decision 2, window closed with no veto).

1. **The Mandate's answer is a deed credit.** When a threaded mortal's chapter closes, the Mandate is credited directly. The credit has a small base, paid when the chapter's sphere is one of the Mandate's two spheres. It also has a spend part: the essence the god paid **in the Mandate's spheres** on that chapter's cards, times a per-band factor. Playing a Mind card for the First is now both a nudge on the scene *and* Mandate progress. A Doom card is not. That is the Law 30 choice made concrete. *Would change the call:* "a mortal acting on their own should never count", which drops the base and keeps the spend.
2. **The Mandate word reads the last day, not the run.** "Rising" when the ledger gained anything in the last `MANDATE_TREND_WINDOW_TICKS`, "Slipping" when it lost, else "Holding". A cumulative 2% gate cannot be read as a trend.
3. **Doom's answer is Stay the Unmaking, a sustained god card.** It is cast on the god itself and held like Claim Dominion: an up-front price, then upkeep each tick from the primary pool, which is the same purse the nudge cards draw on. While held, Doom runs at `DOOM_STAY_RATE` through the existing `doom_rate_multiplier` override on the ascendant. That is the generic seam `phaseDoom` already reads (Law 42). It never stops Doom, and Law 31's floor and the age's end stay as they are. It is a generic milestone gift at the first Doom stage the player sees. The Doom notice gains a second button that opens the god's card for it.
4. **A rival's answer is Rebuke, a god card played on the place it pressed.** It tends that place for `RIVAL_REBUKE_HOLD_DAYS` (a fifth `TendedBy`, `rebuke`), so the next landing is absorbed exactly as tending already absorbs it. It also pushes the god's primary sphere back on the place (`RIVAL_REBUKE_PUSH`) to undo the erosion just suffered. It can target a place only while that place is a rival's `lastPressed` within `RIVAL_REBUKE_WINDOW_DAYS`. Rebuking raises that rival's temper by the same +0.08 as breaking a scheme: the rival notices. It is a generic milestone gift at the first rival landing on the god's ground. This is the "counter-card slice" the [rival plan's](2026-11-06-thr-2172-a-rival-move-has-a-place-and-an-answer.md) kill criterion named. The 2026-11-12 session met that criterion: the toast names a verb and never says how to do it.
5. **The "next blow breaks" line becomes true or goes.** The new line says what the player can actually do, and every word of it is backed by a system (Law 45).
6. **Slice 2 fixes the compounding bug before adding a multiplier.** Stay the Unmaking would otherwise slow Doom to the 0.1 floor within a few ticks.

Rejected, one line each ([brainstorm](2026-11-13-thr-2202-give-both-clocks-a-verb-brainstorm.md)): **Doom as a negative-`doomDelta` nudge card** works only inside a chapter, so Doom stays unanswerable between chapters, and a permanent rate cut is unbounded. **A Doom card that rolls back progress** would let the purse buy the age back, which breaks Law 31's shape and has no cap. **A rival node with a "strike the rival" card** needs a new node type (Christian's call). **Undertaking milestones as Mandate deeds** pushes no sphere today; a later slice once chapter credit is measured. **Raising `ENCOUNTER_PRESSURE_PER_STEP`** would move every mortal's scene in the world, not the god's choice.

## Engine pillar

### Slice 1 — Mandate deed credit
- `src/types/mandate.ts`: `MandateCredit` gains optional `source?: 'pressure' | 'deed'` (additive; absent = pressure).
- `src/engine/mandateLedger.ts`: new pure `mandateDeedCredit(input): MandateCredit[]`. The input is `{ actorId, chapterSphere?, band, mandateSphereSpend: Partial<Record<SphereName, number>>, primary, secondary }`. The function returns a credit per Mandate sphere: `(chapterSphere === s ? MANDATE_DEED_BASE_POINTS : 0) + spend[s] × MANDATE_DEED_POINTS_PER_ESSENCE`, times `MANDATE_DEED_BAND_FACTOR[band]`. `entityId` = the actor.
- `src/components/Game/encounter-stage/nudgeCommit.ts` `spendNudgeEssence` already splits a commit by sphere. The commit path records the per-sphere charge on the encounter progress as `mandateSphereSpend` (new optional field on the progress record, summed across commits). The UI file only hands the split to the engine dispatch; no rule lives in the component.
- `orchestrator.ts` encounter completion (`:1320-1345`, the `isRetinue` branch, which is threaded to the ascendant): push `mandateDeedCredit(...)` onto `pendingMandateCredits`. The mandate phase folds it the same tick (`post-narrative`, after completion). Abandoned chapters credit nothing.
- `phaseMandate.ts`: keep a `recentLedgerDelta` (gain and loss in the window), so the trend reads it. `godSheet.ts:481-484` reads `recentLedgerDelta` instead of `primaryDelta`.

### Slice 2 — Stay the Unmaking
- **Fix:** `phaseDoom.ts` passes the multiplied modifier only into `advanceDoomClock`, and writes back `tickModifier` from `doomClockIn`. `advanceDoomClock` gains an optional `rateMultiplier` argument (default 1), clamped at `DOOM_RATE_FLOOR`, so the stored state never carries it. Regression test: World-Tree's 0.5 held for 100 ticks advances `currentTick` by 50 ± 1.
- New template `divine.self.stay_the_unmaking` in `unified-action-templates.ts`, shaped like `divine.self.stillness` (`targetCategories: ['actor']` on the ascendant, `trayTier: 'self'`), `durationMode: 'sustained'`, `essenceCost: DOOM_STAY_COST` (primary pool, as every generic card), `controlSpec.perTickCostFromPrimary: DOOM_STAY_UPKEEP_PER_TICK`, `progression: { tier: 1, offer: 'gift', giftBy: 'milestone', generic: true }`. Its one step is star-reach, difficulty `DOOM_STAY_DIFFICULTY`, and goes through the god's ladder (Law 16, Law 26: a losing roll lands crooked, the price stands).
- While the control is active, the ascendant carries a `modify_rules` effect `doom_rate_multiplier = DOOM_STAY_RATE`. It is the same effect shape the World-Tree uses, read by `phaseDoom` with no new path. A crooked landing applies `DOOM_STAY_RATE_CROOKED`. Lapse (upkeep unpaid) ends it through the existing control lapse.
- New milestone beat `beat.milestone.the_first_stage` in `ascendant-milestone-beats.ts`, fired by the first `doom_escalation` after the bond. It grants the card.

### Slice 3 — Rebuke
- `dominion.ts`: `TendedBy` gains `'rebuke'`. `buildTendingIndex` marks a place tended while `state.rebukedPlaces[placeId] > tick` (new optional `rebukedPlaces?: Record<string, number>` on GameState, additive).
- New template `loc.rebuke_rival`: `targetCategories: ['location']`, `essenceCost: RIVAL_REBUKE_COST` (primary pool, as every generic card), one step at `RIVAL_REBUKE_DIFFICULTY`, `progression: { tier: 1, offer: 'gift', giftBy: 'milestone', generic: true }`. Its target filter is "some rival's `lastPressed.placeId` is this place, within `RIVAL_REBUKE_WINDOW_DAYS`". On a landed band: set `rebukedPlaces[place] = tick + RIVAL_REBUKE_HOLD_DAYS × TICKS_PER_DAY` (12, `attention-constants.ts`), push `RIVAL_REBUKE_PUSH` in the god's primary sphere at the place (`source: 'divine_action'`, `causedBy` the ascendant, so the Mandate ledger credits it as the god's), and `raiseRivalHostility(rival, rivalState, RIVAL_REBUKE_TEMPER_RISE)` with cause `'rebuked'`. A crooked landing tends without the push.
- New milestone beat `beat.milestone.the_first_rebuke_due`, fired by the first `rival_action` landing (not absorbed) on the god's turf after the bond. It grants the card.
- `rivalLandingLine` (orchestrator `:2104`) picks the new `landed` line when the god holds Rebuke, and `landedNoCard` when it does not (see Content).

### Graph nodes / edges · PRNG
None new. `thread` is read. Every new number is arithmetic, and each roll is the card's existing ladder roll on the god's stream. No new stream, and no change to how many values any stream consumes (NFP 3).

## Content pillar

### Data tables
- Homes: `MANDATE_*` in `src/data/game-config.ts` beside the Mandate targets; `DOOM_*` in `src/data/game-config.ts` beside `DEFAULT_DOOM_TICKS`; `RIVAL_REBUKE_*` in `src/data/rival-scheme-config.ts` beside the temper constants; none in `dominion-content.ts`.
- `MANDATE_DEED_BAND_FACTOR`: a `Record<StepOutcome, number>` beside the other Mandate constants.

### Card text (`unified-action-templates.ts`, name / spellName / description)
- **Stay the Unmaking** / *Hold the Hour* — "Set your will against the ending. While you hold it, the Unmaking comes slower. It never stops."
- **Rebuke** / *The Turned Hand* — "Answer a rival god where it pressed. The place holds against them for a few days, and some of what was taken comes back. The rival will remember."

### Prose tables (`rival-content.ts`, `ascendant-bar-content.ts`, `frame-content.ts`)
- `RIVAL_LANDING_LINES.landed`: "{rival} pressed {Sphere} on {place}. Rebuke it there, or tend the place, and its next blow is turned."
- `RIVAL_LANDING_LINES.landedNoCard`: "{rival} pressed {Sphere} on {place}. A place you tend turns its next blow."
- `RIVAL_TENDER_WORDS.rebuke = 'rebuke'`, so the existing `absorbed` line reads "{rival} pressed on {place}, but your rebuke held it."
- `MANDATE_TREND_WORD` (`ascendant-bar-content.ts:121-125`, read by the god rail and `MandateBlock.tsx`) today says rising "Kindling", steady "Holding", ebbing "Cooling", failing "Drifting". The inspector's `INSPECTOR_WORDS.mandateTrend` (`view-content.ts:165`) says "Rising" / "Holding" / "Slipping" for the same fact (PC-6). Slice 1 sets `MANDATE_TREND_WORD` to rising "Rising", ebbing "Slipping" (failing keeps "Drifting"), so both tables say the same thing. The plainer words were chosen because cold testers read the rail first. No new key: the selector's existing `'ebbing'` maps to "Slipping".
- `MANDATE_DEED_LINE`: "{mortal}'s deed raised your Mandate in {Sphere}." `MANDATE_DEED_LINE_STRONG` (credit ≥ `MANDATE_DEED_STRONG_POINTS`): "{mortal}'s deed raised your Mandate far in {Sphere}." No number reaches the player (Vision non-negotiable #3). It feeds the chapter's aftermath and the Mandate block's recent list.
- `MANDATE_CARD_HINT`: "Counts toward your Mandate." It shows on a nudge card's face when the card's sphere is a Mandate sphere and the chapter's mortal is threaded.
- `DOOM_STAY_BUTTON`: "Stay it". `DOOM_STAY_HINT` (popup body, second line, when the card is held): "Stay the Unmaking slows it. Holding it draws on your {Sphere} essence every day." The card itself shows its price on the usual cost chip, which is the one place a cost is a number (Law 17). When the card is held and already active: "You are holding it back."
- `action-card-display.ts` `upkeepChannelLabel(word, sphere?)`: with a sphere, "steady upkeep from Mind". Slice 2 passes the paying pool for every sustained god card, so Claim Dominion gains it too. That is one shared change, not a special case for this card.

### Vocabulary (UL)
"Rebuke" (a card, and a way of tending a place), "Stay the Unmaking" (a card) are new player terms ("Slipping" already exists on the inspector page and is new only on the rail). A `UL-proposal` issue is filed at handoff, alongside the slice tickets, so the glossary entries land with slice 1. "Ward" was avoided because the UL already uses it for condition protection.

### Encounter templates · Attachment content
N/A. No encounter is authored or changed. The deed credit reads each encounter's existing `sphereAffinity`.

## UI pillar

### Player-facing display
- **Card face** (nudge hand, encounter stage): one small line `MANDATE_CARD_HINT` under the cost when it applies. Before the spend (Law 17).
- **Chapter aftermath**: `MANDATE_DEED_LINE` as one row when a deed credited. After.
- **Mandate block** (`MandateBlock.tsx`, `MandateDetail.tsx`): the trend word now moves. The opened block lists the last three deed lines.
- **Doom notice** (`EventPopup.tsx`): when the god holds Stay the Unmaking and it is not active, a second button `DOOM_STAY_BUTTON` opens the ActionDrawer on the god's own cards with that card focused. `Acknowledge` stays the default. When the card is not held, there is no button and no hint line.
- **Rival toast**: the new line. The click still opens the place, whose page lists Rebuke among the god's cards while the window is open.

### Player-facing text

Rendered samples use the seeded world's First (Kael Thornweaver) and the Witness Hunger's Mind/Spirit Mandate.

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Nudge card face (encounter stage) | "Counts toward your Mandate." | PC-1 | The line names the Mandate, the goal shown in the god rail, whose tooltip already says what it is. It appears only when true (Law 56). |
| Chapter aftermath row | "Kael Thornweaver's deed raised your Mandate in Mind." | PC-8 | The paid card gets a visible reply after the chapter: the answer to "I acted and nothing answered". |
| Mandate row (god rail) | "Goal · Rising ↑" / "Goal · Holding —" / "Goal · Slipping ↓" | PC-6, PC-8 | The row moves within a day of a credited deed, so the fill line ("Raised by your hand and the deeds of the mortals bound to you") and the word agree. |
| Mandate block, opened | "Kael Thornweaver's deed raised your Mandate far in Mind." (last three) | PC-1 | Shows what filled it, in words. |
| Doom notice | Title "Reality Cracks"; body "Hairline Rifts • Borrowed Voices" (the breach archetype's stage-2 cards, joined by " • " as today), then the new second line "Stay the Unmaking slows it. Holding it draws on your Mind essence every day."; buttons "Acknowledge", "Stay it" | PC-9, PC-1 | The notice now offers a move. The card's cost chip shows the price before the cast. |
| Doom notice, already held | "You are holding it back." | PC-6 | It tells the player the spend is working, not that Doom stopped. |
| Rival toast, card held | "The Blighted Weaver pressed Force on Battlefield Ruin. Rebuke it there, or tend the place, and its next blow is turned." | PC-9 | It names the place (click opens it) and two moves, both real. |
| Rival toast, card not held | "The Blighted Weaver pressed Force on Battlefield Ruin. A place you tend turns its next blow." | PC-9 | It names the one move the player has. Nothing is promised that the world does not do (Law 45). |
| Rival toast, absorbed | "The Blighted Weaver pressed on Battlefield Ruin, but your rebuke held it." | PC-8 | The rebuke visibly worked. |
| Rebuke card | "Answer a rival god where it pressed. The place holds against them for a few days, and some of what was taken comes back. The rival will remember." | PC-1 | Says what it does, for how long in words, and its price in temper. |
| Stay the Unmaking card | "Set your will against the ending. While you hold it, the Unmaking comes slower. It never stops." | PC-1 | Says it slows and does not stop. |
| Stay card face, before the cast (existing god-card face: forecast word + upkeep band, `actionCardModel.ts`) | Cost chip "4 Mind" (the up-front price, numeric as every cost chip, Law 17), then "Stay the Unmaking · favorable · steady upkeep from Mind". Hovering the upkeep chip shows the existing tooltip `ui.card.upkeep.steady`: "Holding this open costs a real share of your essence each turn. Worth it while it is doing something; a slow bleed once it is not." | PC-2, PC-1 | The forecast word is the roll's true odds (Law 18), read before the spend. PC-1 (THR-2143, "upkeep has no numbers"): the chip now names the pool that pays ("from Mind"), and the band word plus tooltip say how heavy it is. A numeral stays off the upkeep line: `CardFace.tsx:176` keeps cost channels "never a numeral" (THR-1002), and the Vision audit flagged numbers in prose on this plan. The essence readout in the god rail shows the drain as it happens. A result below a clean success lands "crookedly", and the reply says so in words. |
| Rebuke card face, before the cast | Cost chip "3 Mind", then "Rebuke · favorable" | PC-2, PC-1 | Same forecast word as every god card. The crooked reply names what it did not restore. |
| Stay cast reply (the control's `narrativeTemplates`, shown where Claim Dominion's are) | established: "You set your will against the ending. The Unmaking slows." · crooked: "Your will holds, but crookedly. The Unmaking slows only a little." · active: "You hold the hour. The Unmaking comes slower." · lapsed: "Your purse ran dry and your hold slipped. The Unmaking runs at its own pace again." | PC-8 | A visible reply the moment the cast resolves, and again if it ends. |
| Rebuke cast reply (the action's result line) | landed: "You turned the Blighted Weaver's hand from Battlefield Ruin. The place holds against it for a few days." · crooked: "The place holds against the Blighted Weaver for a few days, but what it took stays taken." | PC-8 | The reply names the rival and the place, and says what was and was not restored. |
| Rival panel cause (`rivalEntry.ts`, new `cause.kind: 'rebuked'`) | "You rebuked it at Battlefield Ruin." · no place: "You rebuked it." | PC-1, PC-9 | Explains why its temper rose, in the panel's existing cause sentence. |
| Mandate tooltip (`ui.mandate_tracker`, extended) | adds: "Rising, Holding or Slipping says how it moved in the last day. Cards in its spheres count toward it when you play them for a mortal bound to you." | PC-1, PC-7 | Explains "Slipping" and the card-face hint where the Mandate is already explained. |
| Fill line, unchanged, beside the deed line | "Raised by your hand and the deeds of the mortals bound to you" · "Kael Thornweaver's deed raised your Mandate in Mind." | PC-6 | Both say "deeds" and "raised": the same fact, told the same way. |

Empty slots (PC-3): a missing `{mortal}` renders "A mortal bound to you"; a missing `{rival}` "A rival god"; a missing `{place}` keeps today's fallback "on a place of yours" (`rivalMoveHasAPlace.test.ts:140`), so the toast still says where it landed. Each line has a unit test with an empty slot.

### UI Laws engaged
Laws 1 (one reading order: the hint sits under the cost, where the eye already is), 13/14 (a word, not a number, for the trend), 17 (the cost is stated before the button), 21 (the default action stays "Acknowledge"), 33 and 37 (no new panel; rows join existing blocks), and 56 (the card-face line is state-backed: it is shown only when the credit will happen: the card is in a Mandate sphere and played for a threaded mortal, and every band credits something, the lowest factor being 0.1). Browser-verify tool: Playwright DOM (`mcp__playwright__*`). Nothing here is WebGL.

### Playtest signal
Warm tester: uses Stay the Unmaking or Rebuke without being told how. Cold tester: sees the Mandate word change after the First's chapter.

### Event notifications · Debug · Map
No new toast type. The DebugPanel Mandate readout adds `recentLedgerDelta` and the last deed credits. HexMapV2: a rebuked place shows on the existing Dominion lens as tended (the `TendedBy` value flows through). No new mesh.

## Interface impact

| Contract | Kind | Note |
|---|---|---|
| encounter completion → `pendingMandateCredits` → mandate phase | **add** | New writer into the existing queue; the read site is `evaluateSphereGrowthMandate` (production). |
| nudge commit → encounter progress `mandateSphereSpend` | **add** | Read by the completion writer above. |
| ascendant effects → `phaseDoom` `doom_rate_multiplier` | **preserve** | New producer of an existing key; consumer fixed so it does not compound. |
| `rebukedPlaces` → `buildTendingIndex` → `absorbTendedRaid` | **extend** | Fifth `TendedBy`. |
| card cast → `raiseRivalHostility` | **extend** | New cause `'rebuked'`. |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` are updated by each slice's executor.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — no new module (`mandateDeedCredit` joins `mandateLedger.ts`); the new writers and readers are the rows below.

| Slice | Orchestrator phase | Component | GameState | Trace | Player control |
|---|---|---|---|---|---|
| 1 | encounter completion → `mandate` (post-narrative) | card face, aftermath, MandateBlock | `pendingMandateCredits`, progress `mandateSphereSpend`, `mandateState.recentLedgerDelta` | `mandate.deed_credit` | playing Mandate-sphere cards in a threaded chapter |
| 2 | control upkeep; `doom` | EventPopup, ActionDrawer | effect overlay on the ascendant | `doom.stay_applied` | Stay the Unmaking |
| 3 | action resolution; `rival_actions` | toast, place page | `rebukedPlaces`, `RivalState.hostilityCause` | `rival.rebuked` | Rebuke |

## Constants table

| Name | Default | Purpose |
|---|---|---|
| `MANDATE_DEED_BASE_POINTS` | 1.5 | Credit for a threaded chapter in a Mandate sphere, before spend |
| `MANDATE_DEED_POINTS_PER_ESSENCE` | 1.0 | Credit per essence paid in a Mandate sphere on that chapter's cards |
| `MANDATE_DEED_BAND_FACTOR` | critical_success 1.5 · success 1.0 · success_at_cost 0.75 · near_miss 0.5 · failure 0.25 · critical_failure 0.1 | The deed's band scales its credit (Law 23: the hand shows at every band) |
| `MANDATE_TREND_WINDOW_TICKS` | 12 | One day (`TICKS_PER_DAY`) of ledger change decides the word |
| `MANDATE_DEED_STRONG_POINTS` | 4 | A deed at or above this reads "raised … far" |
| `DOOM_STAY_COST` | 4 | Up-front essence, charged to the primary pool (a `generic: true` card is priced in the god's primary, `CardProgression`) |
| `DOOM_STAY_UPKEEP_PER_TICK` | 0.15 | Primary-pool upkeep while held |
| `DOOM_STAY_RATE` | 0.75 | Doom's rate while held |
| `DOOM_STAY_RATE_CROOKED` | 0.9 | Rate after a crooked landing |
| `DOOM_STAY_DIFFICULTY` | 0.35 | Step difficulty |
| `RIVAL_REBUKE_COST` | 3 | Up-front essence, charged to the primary pool (generic card) |
| `DOOM_RATE_FLOOR` | 0.1 | The lowest effective Doom rate any multiplier can produce |
| `RIVAL_REBUKE_DIFFICULTY` | 0.35 | Step difficulty |
| `RIVAL_REBUKE_WINDOW_DAYS` | 3 | How long after a landing the place can be rebuked |
| `RIVAL_REBUKE_HOLD_DAYS` | 4 | How long a rebuke tends the place |
| `RIVAL_REBUKE_PUSH` | 4 | God's primary-sphere push back (one probe's magnitude) |
| `RIVAL_REBUKE_TEMPER_RISE` | 0.08 | Same as breaking a scheme |

The defaults are starting points. The purse ticket ([THR-2201](https://linear.app/threadbare/issue/THR-2201)) re-tunes prices, so each slice's Done-when sets a measured **predicate**, not these numbers (Law 1).

## Tracing

```ts
interface MandateDeedCreditTrace { category: 'mandate.deed_credit'; tick: number; actorId: string; encounterId: string; band: StepOutcome; chapterSphere?: SphereName; spend: Partial<Record<SphereName, number>>; credits: { sphere: SphereName; points: number }[] }
interface DoomStayTrace { category: 'doom.stay_applied'; tick: number; rate: number; crooked: boolean; upkeepPaid: number }
interface RivalRebukedTrace { category: 'rival.rebuked'; tick: number; rivalId: string; placeId: string; band: StepOutcome; heldUntil: number; pushed: number; temperBefore: number; temperAfter: number }
```

## Fail-soft table

| Failure | Fallback |
|---|---|
| Chapter has no `sphereAffinity` | Base part is 0; the spend part still credits |
| `mandateSphereSpend` missing (old save) | Treated as `{}`; base only |
| No `mandateDefinition` | No deed credit; trace skipped |
| Stay control lapses mid-tick | Rate returns to 1 next tick; no refund |
| Rate product ≤ 0 or tiny | `advanceDoomClock(state, rateMultiplier)` clamps the effective rate at `DOOM_RATE_FLOOR` (0.1, the same value `decelerateDoomClock` uses), in that path |
| Rebuke target no longer `lastPressed` at resolve | Tending still applies; push and temper skipped |
| `rebukedPlaces` absent (old save) | Treated as `{}` |
| Rival removed before resolve | Tending applies; temper write skipped |

## Blast Radius

`src/types/gameState.ts` (≥100 importers) and `src/engine/orchestrator.ts` (wide-blast in `.codesight/graph.md`) are touched. Both edits are additive. `gameState.ts` gains one optional field (`rebukedPlaces?`), so no importer changes shape. `orchestrator.ts` gains one push in the existing `isRetinue` completion branch and one line choice in `rivalLandingLine`, and no signature changes. The one behavioural change outside a new path is the `phaseDoom` compounding fix. Today it bites only while a World-Tree or Voidgate effect is active, and the regression test pins the corrected rate.

## Files touched

Slice 1: `src/types/mandate.ts`, `src/engine/mandateLedger.ts`, `src/engine/phaseMandate.ts`, `src/engine/orchestrator.ts`, `src/engine/views/subjects/godSheet.ts`, `src/components/Game/encounter-stage/nudgeCommit.ts` + the card-face component, `MandateBlock.tsx`, `MandateDetail.tsx`, `src/data/ascendant-bar-content.ts`, `src/data/game-config.ts`.
Slice 2: `src/engine/phaseDoom.ts`, `src/data/action-card-display.ts`, `src/components/Game/actionCardModel.ts`, `src/engine/doomClock.ts`, `src/data/unified-action-templates.ts`, `src/data/ascendant-milestone-beats.ts`, `src/components/Game/EventPopup.tsx`, `src/data/game-config.ts`.
Slice 3: `src/engine/dominion.ts`, `src/engine/orchestrator.ts` (rival section), `src/data/unified-action-templates.ts`, `src/data/ascendant-milestone-beats.ts`, `src/data/rival-content.ts`, `src/data/dominion-content.ts`, `src/types/gameState.ts`.

## Done when

**Slice 1** (Mandate):
- [ ] A seeded run (`?seeded`, the First bonded), with a scripted policy that plays one Mandate-sphere card in each of the First's chapters, shows `mandate.deed_credit` traces with points > 0 on at least 3 chapters by tick 300. The Mandate word reads "Rising" on both the god rail and the inspector page within one day of each.
- [ ] The same run with no cards played still credits the base on chapters in a Mandate sphere. The trace proves it, or the run reports that none of the First's chapters carried one (then the base is untested, stated).
- [ ] A Doom-sphere-only spend credits 0 (unit test).
- [ ] Browser: 1920×1080 screenshot of the card-face hint and of the aftermath deed line; `await window.__DEBUG` assertion of `recentLedgerDelta > 0` after a credited chapter.

**Slice 2** (Doom):
- [ ] Regression test: a 0.5 multiplier for 100 ticks advances `currentTick` by 50 ± 1 (today it collapses).
- [ ] Holding Stay the Unmaking for 240 ticks advances Doom's `currentTick` by 180 ± 2 (0.75 × 240; the test forces a clean landing, since a crooked one runs at `DOOM_STAY_RATE_CROOKED`), where an unheld control run advances 240, and drains `DOOM_STAY_UPKEEP_PER_TICK × 240` from the primary pool.
- [ ] The first Doom notice after the bond grants the card. The next notice shows "Stay it", which opens the drawer on it (Playwright DOM, 1920×1080 screenshot).

**Slice 3** (rivals):
- [ ] A landing on untended turf, followed by Rebuke on that place, absorbs the next landing there (`absorbed` toast, trace `rival.rebuked`), and raises the rival's temper by 0.08 with cause shown in the panel.
- [ ] Rebuke is not offered on a place no rival pressed in the window (unit test on the target filter).
- [ ] Toast line matches the god's holdings (`landed` / `landedNoCard`). Screenshot at 1920×1080.

**Every slice**: `npm run gate` passes (test, typecheck ratchet, build, freshness); a 30-tick CLI smoke runs clean; the PR body carries the line-anchored closer for its own slice ticket; browser evidence per the UI-pillar scope (`Docs/canon/verification-gates.md` § Browser-verify).

**Programme**: [THR-2199](https://linear.app/threadbare/issue/THR-2199) and [THR-2172](https://linear.app/threadbare/issue/THR-2172) close when their slice ships. Fixed when a later warm tester uses Stay or Rebuke unprompted, and a cold tester sees the Mandate word move.

## Kill criteria

- Slice 1: if credited deeds carry the scripted god past 80 points before doom 0.4, the spend factor halves (in THR-2201's tuning, not here).
- Slice 2: if a warm tester holds Stay all run without feeling the cost, its upkeep is wrong, not its shape.
- Slice 3: if rivals land so rarely (`DOMINION_RAID_PLACES_PER_DAILY_BURST`) that the milestone never fires in a warm run, lower the throttle in that slice with a measured run.

## Coordination block

**Suggested model:** opus, for the engine slices (orchestrator, mandate phase, doom phase).
**Parallel-safe with:** the slices are file-disjoint except `unified-action-templates.ts` / `ascendant-milestone-beats.ts` (2 and 3) and `orchestrator.ts` (1 and 3). Build 2 first, then 1 and 3 in either order.
**Mutex with:** [THR-2201](https://linear.app/threadbare/issue/THR-2201) (purse) re-tunes card prices and pool income. Prices here are named constants it may move; no blocker.

**Files to touch:** per slice, as listed in § Files touched. Each slice also edits its tests, `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts` (the contracts in § Interface impact), the rulebook lines in § Rulebook impact, and the Design Reference Wiki page whose `sources` match.

## Notes for the executor

- `phaseDoom.ts` compounding: confirm with a unit test before the fix; record the before/after in the status file.
- The card-face component is for the executor to find: grep the `essenceCost` rendering in `encounter-stage/`.
- Keep `MandateCredit.source` optional; the pressure path writes nothing new.

## Three-pillar check

- [x] Engine pillar present: three slices with types, phases and traces
- [x] Content pillar present: two cards, the line entries, the constants
- [x] UI pillar present: card-face line, aftermath row, Mandate rows, Doom button, toast line
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict a Vision premise. Law 9 holds: no card commands a mortal or a rival, and Rebuke tends a place and pushes a sphere. Laws 30 and 36: every answer is paid from the same pools as the nudges, and upkeep makes Doom an ongoing drain. Law 31: Stay slows Doom and never stops it; the floor is untouched. Law 32: neither clock becomes a loss screen. Laws 42 and 43: one tending concept gains a kind, and the Doom card rides the existing rule override. Law 45: two promises the world did not keep become true.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan changes rules of play: the god gains two cards, and bound mortals' deeds fill the Mandate.
- [x] `Docs/canon/rulebook.md` § Dominion (`:210`) adds "Rebuke tends a place a rival just pressed". § The two clocks (`:415`) adds Stay the Unmaking and "a bound mortal's deeds count, more when you pay in the Mandate's spheres". The quick reference (`:53`, `:136`) mirrors both. Each slice edits its own lines, in that slice's PR.

> Brainstorm companion: `Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every number is in the constants table. |
| 2. Inspectability | PASS | Three traces and DebugPanel readouts. |
| 3. Determinism | PASS | No new PRNG draws; existing card rolls only. |
| 4. Fail-soft | PASS | Fail-soft table; optional fields default to empty. |
| 5. Narrative over mechanical perfection | PASS | Deed lines name the mortal; Rebuke has a rival who remembers. |
| 6. Additive over destructive | PASS | Optional fields, new templates, a new `TendedBy` value; one bug fix. |
| 7. Performance budget | PASS | One credit per chapter close; one lookup per tending build. The Rebuke target filter scans the rivals' `lastPressed` (a handful of rivals) per candidate place: O(rivals). |

## Intent-judge verdict

**Allow** (run 5, opus, cold, 2026-11-13). Runs 1 to 4 returned Revise, each fixed inline:
1. No `### Player-facing text` table.
2. Two existing Mandate trend tables disagreed; the Doom floor sat on the wrong code path; the paying pools were unnamed.
3. No before-roll stakes for the two casts; the Doom notice had no rendered sample; the card-face hint could promise a zero credit.
4. Stay's upkeep named no pool.

Run 5 had one GAP, on constants' home files, and two notes: the empty-`{place}` fallback and per-slice coordination blocks. All three are applied.

## Forked-audit verdicts

### NFP audit
**PASS-with-notes.** All seven pass. Note on NFP 6: the `phaseDoom` compounding fix changes stored-state behaviour, justified as a defect blocking the new card. Note on NFP 7: the Rebuke target filter scans rivals' `lastPressed`. Fixed: the NFP table now states it is O(rivals), a handful.

### Three-pillar audit
**PASS-with-notes.** Engine and Content are substantive, and the substrate inventory is clean, with no green-field duplication. Notes: the UI pillar lacked `### Player-facing text` with the complaint-class check, and the Done-when lacked the standard gate, closer and browser-verify items. Both are fixed.

### Vision audit
First run: **REVISE**. "+{points}" in the deed line and "{upkeep} a day" in the Doom hint put raw numbers in prose (non-negotiable #3, taste "Numbers in UI"). Both lines were rewritten in words; the card's own cost chip stays the one numeric price (Law 17). Re-run: **PASS-with-notes**. The notes are on design tension #4 (the plan leans legible) and tension #3 (clock management could pull attention from mortals). The plan answers #3 with its spend split: Mandate-sphere cards played for mortals count, and Doom spend does not.
