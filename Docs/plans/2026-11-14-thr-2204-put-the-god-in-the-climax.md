> **title:** Put the god in the climax — the Ordeal is rolled and reads the scene, the Apotheosis is the run's biggest hand, the last days have moves, and the ending tells this run's First (THR-2204)
> **linear_issue:** THR-2204
> **author:** Claude Code (design lane, run dl-20261114-1118)
> **created:** 2026-11-14
> **three_pillars:** Engine done (four slices) · Content done (vision scene tags and openers, Ordeal band lines, Apotheosis and ending lines) · UI done (vision price and weight lines, Apotheosis arrival line, Return button, ending beat)

Plan-size-exempt: multi-slice programme doc. Four build slices, one per design question in the ticket, each filed as its own ticket. They share one predicate (played vs unplayed ending), one constants table and one helper (fit a step's difficulty to a target forecast), so splitting the doc would restate all three four times.

# Put the god in the climax (THR-2204)

*Today the run's biggest moments happen without the god. The Ordeal vision lets the player buy the outcome outright ("guarantee their triumph", 5 essence), which breaks Law 10. The Apotheosis lands already Fated, so the cards cannot matter. After the Return nothing asks the player anything. The ending names a fate but never what this god did. This plan makes each of those moments one the player's hand shapes and the ending remembers, without the player ever picking an ending.*

## Why this is load-bearing

Christian agreed the direction "make the middle a game" in chat on 2026-11-12 ("Yes, file them"). This is ticket 4 of 5. The [agency census](2026-11-13-thr-2205-measure-whether-the-player-matters.md) measured the gap: **the player mattered on 0 of 3 seeds**. A run where every affordable card was played and a run where none was ended with the same clock, the same First's fate and the same Apotheosis. Tickets 1–3 gave the middle its levers: the purse, the clocks' verbs and stops only for real decisions. This one gives the ending something to remember them by. Laws touched ([law book](../game-design/laws.md)): 4, 10, 11, 17, 18, 22, 23, 27, 28, 31, 32, 45.

## What was measured (main @ ef70aac2, 2026-11-14)

Three hands-off runs built exactly as the census's `none` arm (seeded medium route, warm 300, every held step released with no card), run on past tick 800 to the age's end. Probe: `endgame-probe.ts` on the lane's scratch space, not committed (it reads the same `buildNudgePhaseModel` call the census uses).

| Seed | Apotheosis offered | Step 0 (the threshold): forecast · hand | Step 1 (the deciding step): forecast · hand · held? | Doom stage 5 | Age end |
|---|---|---|---|---|---|
| 42 | t361, again t451 | Fated 0.91 · 7 of 7 playable (both times) | Fated 0.95, then Favorable 0.72 · **0 cards** · not held | t667 | Doom, t861; the First an Aspect |
| 7 | t361 | Fated 0.84 · 7 of 7 | Favorable 0.65 · **0 cards** · not held | t639 | (stopped after t639) |
| 1234 | t361, again t451 | Fated 0.83 · 7 of 7 | Fated 0.95, then Favorable 0.76 · **0 cards** · not held | t621 | (stopped after t621) |

Plus the census baseline already on `main`: in both arms of all three seeds the Apotheosis happened by about tick 400 and the age ended by Doom between ticks 820 and 876.

**What this changes in the ticket's premise.** The ticket saw the Apotheosis arrive "at Fated with an empty hand". Both halves hold, at different steps. At the threshold (step 0) the hand is full, because an unspent purse sits at its cap, but the forecast is already Fated. The step that decides the outcome and grants Aspect (step 1, either pole) **deals no cards at all**, so under [THR-2203](https://linear.app/threadbare/issue/THR-2203)'s rule it never even stops the world. So **the climax is decided before the god acts, and its deciding step has nothing to act with.** A spent god can also lose step 0's hand: `buildNudgePhaseModel.ts:677` passes only spheres with essence above zero, `nudges.ts:329-332` marks other cards `sphere_locked`, and the Stage hides those (`buildNudgePhaseModel.ts:132-137`). Slice 2 addresses all three.

**Not re-measured: the stretch after the Return.** The probe logs journey visions but does not answer them, and an unanswered vision holds the First's journey in its phase, so no hands-off run reached the Ordeal or the Return (all three stayed in Call or Road of Trials). The ticket's evidence for question 3 (about 150 ticks with no decision after the Return) therefore stands on the expert session's auto-answered run alone. The same blind spot sits in the census's hands-off arm, so slice 4 makes the census answer visions (step back), or its H2/H3 readings never see an Ordeal.

## Substrate inventory

| Subsystem | Status | Finding | This plan |
|---|---|---|---|
| Journey visions: `journeyEngine.ts` picks a variant by a four-axis snapshot (power, influence, relationship, ambition), seeded top-3 pick (`:227`, `:250-263`); `buildVignetteData` (`:325-351`) | 🟢 ACTIVE | **No scene in the data.** The place line ("Kael at Millbrook") is added at render only (`JourneyVignetteModal.tsx:12-14, 215`). 19 templates, 26 variants. State, the agent node and the thread edge are in scope at generation (`:548-581`). | **extends**: a scene read at generation, a scene term in scoring |
| Vision price: `JourneyVignetteModal.tsx:141-149` "Cost: {n} essence"; charged from the primary pool in `GameView.handleJourneyChoice` (`:4319-4350`) | 🟢 ACTIVE | The price is shown. The ticket said it was not; it is, but it **names no pool** (PC-1). | **extends**: names the pool |
| Ordeal: `ORDEAL_PEAK` and siblings (`journey-content.ts:455-530`, 9 `ordealOutcome` choices); `applyBeatChoice` writes the choice's outcome to the thread edge (`journeyEngine.ts:387-389`); default `scraped_through` (`returnEngine.ts:824`) | 🔴 LAW 10 | "Intervene directly — guarantee their triumph" sets `ordealOutcome: 'triumph'` for 5 essence. The player buys a band, and the band opens and closes the six endings (`returnEngine.ts` / `types/returnEngine.ts:123-134`). | **replaces** a chosen outcome with a lean on a roll |
| Apotheosis: `encounter.apotheosis.ascension`, seeded on any threaded tier-4 mortal held 60 ticks (`aspects.ts:151-226`); difficulties 0.35 / 0.50 / 0.25 (`nudge-constants.ts:382-400`); seven authored cards, no `deal` (`apotheosis-ascension.ts:135-244`) | 🔴 EMPTY AT THE DECIDING STEP | Fated (0.83–0.91) at step 0 with 7 playable. Step 1 (both poles) carries no `nudges`, so it deals 0 cards and does not stop. Re-offered after the 90-tick cooldown on 2 of 3 seeds. The comment "always available" (`:130-133`) is false for a spent god. | **extends**: a hand on step 1, fitted difficulty, dealt + earned cards, a warning before it |
| Return: `executeReturn` queues a choice-less vignette (`journeyEngine.ts:588-626`) | 🔴 BUG | `JourneyVignetteModal.tsx:293-310` renders no button when `choices` is empty; the Stage has no close (`Stage.tsx:364-381`). Only Escape closes it. After it, no beat fires: only `the_first` threads are scanned (`journeyEngine.ts:559-562`). | **fixes** + adds the last days' line |
| Age end: `phaseDoomExpiry` (`orchestrator.ts:3014-3075`), `DOOM_MIN_RUN_TICKS_AFTER_BOND = 720` | 🟢 ACTIVE | Mandate first, else Doom. | **reads** |
| Twilight beats: `twilight.ts` `ageEnding` / `firstFate` (`:95-170`), `twilight-content.ts:45-50` | 🟢 ACTIVE (THR-1381) | Beat 2 says aspect / lived / died, nothing about the god's part. | **extends**: two lines |
| Harvest summary: `cycleEnd.ts:106-182` | 🟢 ACTIVE | "A somber age. {topName} faded into memory." `topName` is the most significant actor, place or thing, which is why it named Nesrin, not the First. | **extends**: leads with the First |
| Threads row after the Return: `TIER_NAMES[4] = 'Aspect'` (`influence-content.ts:57`) via `retinue.ts:419`; the Return clears `courtPosition` only (`returnEngine.ts:611-612`) | 🔴 PC-6 | A vanished First still reads "Aspect". | **fixes** |
| Agency census: `scripts/agency-census.ts`, `scripts/agency-verdict.ts` H1–H5 at tick 800 | 🟢 ACTIVE (THR-2213) | H3 is "an apotheosis template is in the First's chapter archive" (`agency-census.ts:222`). | **extends**: H6, H7 and the ending text |
| Clock answers: Stay the Unmaking (THR-2207), Rebuke (THR-2209), Mandate deed credit (THR-2208) | 🟢 ACTIVE | Shipped. The last days lean on them. | **reads** |

## Decisions (made by the design lane under delegation, 2026-11-14 — veto in chat)

These are the *how* of an agreed direction. The ticket itself framed the fix ("the fix is a bigger hand, never a chosen ending"). One question is reserved for Christian (below).

1. **The Ordeal is rolled, and the god leans on it.** Each Ordeal choice becomes a lean of a different size with a price: pour in, steady the thread, or step back. The band comes from a roll on the First's marble bag (Law 4), through the same resolution call the forecast uses (Laws 16, 18). Success or better is *triumph*, success at cost or near miss is *scraped through*, failure or worse is *broken*. Each choice shows the forecast word it leaves before the player pays (Law 17). Stepping back is the bare roll. *Would change the call:* "the Ordeal is a story beat, not a roll", which would keep fixed outcomes but must then drop the prices (a paid fixed outcome is the Law 10 breach).
2. **The Ordeal's and the Apotheosis's bare odds are fitted, not fixed.** A shared helper solves each step's difficulty so that the bare forecast (no cards) is `CLIMAX_BARE_FORECAST` (0.45, "Uncertain") for this mortal. The climax is then always in doubt, and the hand always matters. Law 20 does not bind: these are forced arrivals, and the law leaves long odds to fate and the god. *Would change the call:* "a great mortal should walk through it", which would raise the target for higher tiers.
3. **A vision reads the scene.** At generation the engine reads where the First is and what they are doing (a `VisionScene`: place name, place kind, one of six activities). Variants declare the activities they fit; the scorer adds a bonus for a fit and a penalty for a tagged mismatch; the setup prose opens with an authored clause for the activity. "The trial ends in devastation" can no longer fire over a shrine: the scene picks a different variant, and an Ordeal's ending prose now follows the rolled band.
4. **The Apotheosis is the biggest hand of the run, at the step that decides it.** Step 1 (both poles: the vessel and the withdrawal) gets the hand, so the moment that grants or refuses Aspect stops the world and can be leaned on. Step 0 keeps its hand: it leans the mortal's fork (Law 11). The hand is the seven authored cards plus one card dealt from the god's own repertoire (8, the most any other chapter can hold), plus one earned card per `APOTHEOSIS_PAID_CHAPTERS_PER_SLOT` of the First's chapters the god paid into, up to two more. The step carries a named exception to the hand cap, so this is the only hand in the game that can exceed 8. A god who never played arrives with the authored cards and the deal only. Its arrival line says, in words, when part of the hand was earned.
5. **The player is warned before it.** When a mortal's Apotheosis clock starts (the existing 60-tick hold), a premonition says the threshold is coming, so a god can save essence for it. A god who arrives with nothing to pay still sees a line, not an empty tray (Law 22).
6. **The Return has a button, and says what is left.** "Go on" closes it. A line names the time the age has left in words and, when the god has an open thread, that another mortal can carry it (state-backed, Law 45). After the Return the stops are the ones the game already has: Doom stage notices with "Stay it", rival landings with Rebuke, and the chapters of any other threaded mortal.
7. **The ending tells this run's First.** Twilight beat 2 gains up to two lines from state, never a roll: the Apotheosis (the god's hand on it or not, and how it went), and the Ordeal (same). The harvest summary leads with the First's story and keeps the most significant name as its second clause. A First who vanished or transcended reads the ending's word in Threads, not "Aspect".

Rejected, one line each ([brainstorm](2026-11-14-thr-2204-put-the-god-in-the-climax-brainstorm.md)): **keep the Ordeal's fixed outcomes and only show them** (still a bought band, Law 10); **a choice between two endings at the Return** (Law 10, plainly); **make the Apotheosis free** (Law 36: every card costs); **raise the Apotheosis difficulty to a fixed 0.7** (a tier-4 sage and a tier-4 brawler would face different doubt; fitting is fairer); **a new climax encounter after the Return** (more content in the empty stretch without a decision behind it; the reserved fork below is the real question).

## Reserved for Christian — does a run hold a second full journey?

The ticket names this as a question about what the game means, and nothing agreed decides it. After the Return, the last stretch (measured above) has only the clocks and any other threaded mortal's chapters. The options, built:

- **A. No (the default if you say nothing).** The last days are for the clocks and the threads you hold. Slice 3 ships as written.
- **B. A second First.** After the Return, the god may raise a new First whose journey runs compressed to the Doom that is left (fewer beats, same phases). It is a real second story, but it makes the run about two mortals and asks the journey engine to scale its beats to time left.
- **C. An heir's coda.** The Return's ending seeds an heir (a child, an apprentice, a sworn companion) who carries one short coda: one vision and one chapter, then the age ends. Smaller than B, and it keeps the run about one family's story.

A one-line answer is enough: "A", "B" or "C". B or C becomes its own ticket; nothing in slices 1–4 waits on it.

## Engine pillar

### Slice 1 — The Ordeal is rolled, and visions read the scene
- `src/types/journeyEngine.ts`: `ChoiceEffects` gains optional `ordealLean?: number` (an odds bonus added to the roll, like a nudge's modifier). On Ordeal templates `ordealOutcome` is removed from choices (additive elsewhere: non-Ordeal templates never carried it). New `VisionScene { placeId?: string; placeName?: string; placeKind?: string; activity: SceneActivity }`, `SceneActivity = 'travel' | 'labour' | 'worship' | 'conflict' | 'court' | 'rest'`. `BeatVariant` gains optional `scenes?: SceneActivity[]`. `JourneyVignetteData` gains optional `scene?: VisionScene` and, on an Ordeal, `forecastByChoice?: Record<string, ForecastTier>`.
- `src/engine/journeyEngine.ts`: new pure `readVisionScene(state, agentNode): VisionScene` — place from the `located_at` target (`resolveToParentLocation` for the name); activity from the mortal's active undertaking verb, else the template of a chapter in progress, else the place kind, by the `VISION_ACTIVITY_BY_*` tables (Content); `rest` when nothing matches. Variant scoring adds `VISION_SCENE_FIT_BONUS` when `scenes` includes the activity and subtracts `VISION_SCENE_MISMATCH_PENALTY` when `scenes` is set and does not. `buildVignetteData` takes the scene and fills `{place}`.
- Ordeal resolution: `applyBeatChoice` on an Ordeal calls the shared resolution path with reach `star`, difficulty from `fitDifficultyToForecast(state, actorId, 'star', CLIMAX_BARE_FORECAST)`, modifier `ordealLean`, on the First's marble bag (`luck.ts`). The band maps to `ordealOutcome` by `ORDEAL_BAND_TO_OUTCOME`, written to the thread edge as today, plus `ordealBand` and `ordealGodPaid: boolean` (additive optional fields on `ThreadEdgeProperties`). The forecast per choice is computed by the same call (Law 18) when the vignette is built.
- **Where the dice come from (NFP 3, Law 8).** The Ordeal resolves in `recordJourneyChoice` (`journeyEngine.ts:517`), at click time, while the game is paused. It must not draw from the tick's shared stream, or the shared draw count would depend on when the player clicked. The d100 is `drawLuckRoll(graph, seed, ascendantId, firstId, tick)` on the First's bag. `resolveStepCore` always spends one draw of its own (`stepResolutionCore.ts:256-262`). That draw, and the plain dice used when the bag is off, come from a keyed unit stream `journey.ordeal:${seed}:${firstId}:${beatIndex}`. `quintessencePolicy: 'none'` and no resist, so there is no further draw. `seed` is threaded into `recordJourneyChoice`. A `?outcome=` pin (`bandOverride`) is honoured as in every step.
- **Fit once, store, roll on the stored value (Law 18, NFP 7).** `fittedDifficulty` is computed once, when the vignette is built. It is stored on the vignette and read by both the shown forecast and the roll. The same applies to the Apotheosis: once per step, when the step is entered, stored on the action instance. Forecast probes never call `drawLuckRoll`.
- **Order of roll and result.** Today the modal shows a choice's result before it commits (`JourneyVignetteModal.tsx:169-183`: `handleChoice` → `setAnswered`, then `onChoice` on Continue). On an Ordeal that order cannot hold, because there is no band until the roll. On an Ordeal the click commits at once (`onChoice`). The roll runs in `applyBeatChoice`, and the result line renders from the band written to the thread edge. Non-Ordeal visions keep today's two-stage flow.
- New `fitDifficultyToForecast(state, actorId, reach, target): number` in the resolution module: a bisection over difficulty in [0,1] against the existing forecast function, `FIT_ITERATIONS` steps, fail-soft to the step's authored difficulty.

### Slice 2 — The Apotheosis is the biggest hand of the run
- `apotheosis-ascension.ts`: both step-1 poles gain `nudges: APOTHEOSIS_HAND` (today only step 0 has them). With a hand, THR-2203's stop rule holds step 1 like any authored hand. Each step gains `fitBareForecast: CLIMAX_BARE_FORECAST` (new optional `ActionStep` field). Where a step carries it, the step's difficulty is replaced by `fitDifficultyToForecast` for the acting mortal. It is computed once on step entry and stored on the action instance (`fittedDifficulty`), so the hand-build and the roll read one value. The authored difficulties stay as the fallback.
- Hand: the dealer fills a step's hand only up to `DEAL_HAND_MAX - authored.length` cards (`dealHand.ts:325`) and `DEAL_HAND_MAX_TOTAL_DELTA` (`:409`), which are 8 and 0.70 (`nudge-constants.ts:656-657`, pinned equal to the authoring caps `NUDGE_HAND_MAX` / `NUDGE_HAND_MAX_TOTAL_DELTA` by `dealHand.test.ts:149-150`). Authored cards are never cut (`nudge-constants.ts:650-651`), so with seven authored cards the dealer adds at most one, and the authored seven already sum to 0.49. "The biggest hand of the run" therefore needs a **named, tunable exception**, not more cards under the same limit. The step type gains optional `handMax?: number` and `handMaxTotalDelta?: number`. `dealHand`'s `step` parameter (`Pick<ActionStep,'nudges'|'deal'>`, `:309`) widens to carry them, and the fill limit at `:325` / `:409` reads them before the constants. The authoring checks need no change (see Blast Radius): the static data still declares 7 + 1. Only the Apotheosis's step-1 poles set them (`APOTHEOSIS_HAND_MAX = 10`, `APOTHEOSIS_HAND_MAX_TOTAL_DELTA = 0.90`).
- Composition on step 1: the authored seven, plus a step-level `deal: { count: APOTHEOSIS_DEAL_COUNT }` (the existing `StepDealDeclaration`, `unifiedAction.ts:2126-2133`) from the god's own repertoire. The template data is static, so the earned part is added at deal time. The caller that hands the step to `dealHand` (`buildNudgePhaseModel` in `src/engine/views/stage/`) adds `apotheosisEarnedSlots(state, actorId)` to the declared count when the step carries a new optional marker `dealEarned: 'apotheosis'`. Any god gets 7 + 1 = 8, the most any other chapter can deal. A god that paid into the First's chapters gets up to 10. `earnedSlots = min(APOTHEOSIS_EARNED_SLOTS_MAX, floor(paidChapters / APOTHEOSIS_PAID_CHAPTERS_PER_SLOT))`, where `paidChapters` counts the First's `chapterArchive` entries with a card committed (`cardPlayTally` holds the per-chapter counts). Pure helper `apotheosisEarnedSlots(state, actorId)`.
- `aspects.ts`: when the eligibility hold starts for a threaded mortal, push one premonition (existing premonition kind) naming the mortal. Once per mortal per offer.
- Thread edge gains optional `apotheosisBand` and `apotheosisGodPaid` (written on encounter completion), read by slice 4.

### Slice 3 — The Return has a button and the last days are named
- `journeyEngine.ts` `executeReturn`: the Return vignette carries `closeLabel` (new optional field) and a `remainingLine` built from Doom progress and whether the god has an open thread slot (`getThreadsFrom` count against the existing thread cap). No engine behaviour beyond the line.
- Nothing new stops the world. The doom-stage notices already hold the clock (Law 27) and offer "Stay it" (THR-2207).

### Slice 4 — The ending tells this run's First
- `twilight.ts` `firstFate` returns, alongside the fate, `apotheosis?: { band; godPaid }` and `ordeal?: { outcome; godPaid }` read from the thread edge. `buildTwilightBeats` adds the lines (Content).
- `cycleEnd.ts:178-182`: when the First exists, the summary leads with the First's story word and keeps `topName` as the second clause.
- `retinue.ts:419` and `ThreadsPanel.tsx`: a thread whose Return ending is `vanishing` or `transcendence` reads the ending's word, not the tier name.
- `scripts/agency-census.ts` snapshots `ordealBand`, `apotheosisBand` and the Twilight beat-2 text. `scripts/agency-verdict.ts` adds **H6** (Ordeal outcome class differs) and **H7** (Apotheosis band differs), and prints whether the beat-2 text differs. For an H6 difference it also says what moved the band: the lean (the same roll would have landed differently at the bare chance) or the bag position (`luckDrawIndex` differs between arms). The two arms reach the Ordeal at different bag counts, so this keeps noise from passing as agency. Both census arms must answer journey visions, or the journey never leaves its phase (measured above). The played arm takes the costliest affordable choice; the hands-off arm plays each vision's "withdrawn" choice, as dismissing does in the game (`StageHost.tsx:359-371`).

### Graph nodes / edges · PRNG
No new node or edge type. `ThreadEdgeProperties` gains four optional fields. The Ordeal roll is one draw on the First's existing marble bag plus one from a keyed unit stream (see slice 1), where today the Ordeal draws nothing: the bag's counts advance by one per Ordeal, which is the bag's purpose (Law 8: the bag is re-derived from seed, holder and counts). The fit helper and scene read consume no randomness. The vision pick keeps its existing seeded top-3 draw.

## Content pillar

### Data tables (`src/data/journey-content.ts`, new `src/data/vision-scene-content.ts`)
- `VISION_ACTIVITY_BY_UNDERTAKING_VERB`, `VISION_ACTIVITY_BY_PLACE_KIND`: every undertaking verb and every place kind maps to one activity. A test fails on an unmapped verb or kind.
- `scenes` on each of the 26 variants. A variant may stay untagged (fits anywhere, no penalty).
- `ORDEAL_BAND_TO_OUTCOME`: critical_success, success → triumph; success_at_cost, near_miss → scraped_through; failure, critical_failure → broken.

### Prose tables
- `VISION_SCENE_OPENERS[activity]`, one short clause each, prepended to the setup: travel "On the road near {place},"; labour "At their work in {place},"; worship "At prayer in {place},"; conflict "In the thick of the fighting at {place},"; court "Among the powerful at {place},"; rest "In a quiet hour at {place},". Missing place: the clause drops "at/in {place}".
- Ordeal choices: `text` rewritten so no line promises a result ("Pour everything into the thread", "Steady the thread", "Step back: this must be {theirs}", with the mortal's stored possessive). Each choice gains `consequenceByOutcome: { triumph, scraped_through, broken }`, and `consequenceProse` stays as the fallback (additive): 9 choices × 3 lines. The god's hand shows at every band (Law 23): "pour in" + broken is "You poured yourself into the thread, and still {he} broke."
- `VISION_PRICE_LINE`: "Costs {n} {Sphere}". `ORDEAL_WEIGHT_LINE`: "This decides how {first}'s story ends." `ORDEAL_STAKES_LINE`: "It tests {his} Star reach. A {difficultyWord} trial." (`difficultyWord` from `DIFFICULTY_WORD_BANDS` for the fitted difficulty). `ORDEAL_FORECAST_LINE`: "{Forecast}" in the existing forecast colour.
- `APOTHEOSIS_ARRIVAL_LINE`, state-backed (Law 45, UI Law 56): when earned slots were dealt (so the hand is above 8, which no other chapter can reach), "A larger hand than any other chapter can give you. Some of it was earned in {first}'s earlier chapters." With no earned slots: no arrival line, since the hand only ties the largest ordinary hand. No counts in the sentence (UI Law 13); the tray shows the cards. With nothing payable: "Your purse is empty. {first} stands in this doorway on {his} own."
- `APOTHEOSIS_PREMONITION_LINE`: "{first} is nearing a threshold. What you hold when {he} reaches it is what you can give."
- `RETURN_CLOSE_LABEL`: "Go on". `RETURN_REMAINING_LINE`: "{first}'s story is told. The age has {timeWord} left." plus, when a thread is open, " Another mortal can carry your thread."
- Twilight beat 2 additions (`twilight-content.ts`), plain facts: `apotheosisWithHand` "At the threshold you spent on {him}, and {he} {apotheosisResult}." / `apotheosisAlone` "At the threshold {first} stood alone, and {he} {apotheosisResult}." with `apotheosisResult`: became your Aspect (success or better) / crossed it, at a cost (success at cost, near miss) / fell back (failure or worse; on the withdrawal pole, "turned away"). `ordealWithHand` "At the Ordeal you poured yourself into the thread, and {first} {outcomeVerb}." / `ordealSteady` "…you steadied the thread…" / `ordealAlone` "At the Ordeal you stepped back, and {first} {outcomeVerb}." with `outcomeVerb`: triumphed / scraped through / broke.
- Harvest summary: "A somber age. {first}'s story ended {endingFact}; {topName} faded into memory." `endingFact` is one plain clause per Return ending, e.g. vanishing "when {he} was simply gone", loyal ascension "at your side", sacrifice "in {his} sacrifice"; no Return yet: "in the age's last days". (`topName` equal to the First: the second clause drops.)

### Encounter templates · Attachment content
The Apotheosis template gains `deal` and `fitBareForecast` on its steps (slice 2). No new encounter.

## UI pillar

### Player-facing display
- **Vision** (`JourneyVignetteModal.tsx`): the existing Ordeal warning "Your choice determines their fate." (`:257`) is removed. It is false once the Ordeal is rolled (Law 10), and `ORDEAL_WEIGHT_LINE` replaces it. The scene opener leads the setup; each choice shows its price line under the text; on an Ordeal, a weight line above the choices and the forecast word on each choice. All before the click (Law 17).
- **Apotheosis** (Stage): the arrival line above the hand on step 1, the only step that deals earned cards. Sphere-locked cards stay hidden as today; when nothing is payable, the empty line shows instead of an empty tray.
- **Return**: the remaining line and a "Go on" button (closes; Escape still works).
- **Twilight**: beat 2 shows the fate line, then the Apotheosis line, then the Ordeal line, each only when its fact exists.
- **Threads**: a vanished First reads "Gone"; a transcended one reads "Transcended".

### Player-facing text

Samples use the seeded First (Kael Thornweaver, a shrine-keeper) and the Mind primary.

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Vision setup | "At prayer in Millbrook Shrine, Kael Thornweaver looks up from the altar. The road ahead has narrowed to one way." | PC-6 | The vision happens where the map shows him. |
| Vision choice price | "Costs 2 Mind" | PC-1 | Names the pool the god-rail already shows. |
| Ordeal header | "This decides how Kael Thornweaver's story ends." | PC-2 | Says the weight before the spend. |
| Ordeal choices | "Pour everything into the thread · Costs 5 Mind · Favorable" / "Steady the thread · Costs 2 Mind · Uncertain" / "Step back: this must be his · Uncertain" | PC-1, PC-2 | Forecast words are the existing ladder (Doomed … Fated), legend unchanged. |
| Ordeal result | "You poured yourself into the thread, and still he broke." | PC-2, PC-8 | The result follows the choice and the roll, at every band. |
| Premonition | "Kael Thornweaver is nearing a threshold. What you hold when he reaches it is what you can give." | PC-7 | Says what to do next: hold essence. |
| Apotheosis arrival (earned cards dealt) | "A larger hand than any other chapter can give you. Some of it was earned in Kael Thornweaver's earlier chapters." | PC-1, PC-8 | True by construction: only this step can hold more than 8. Says why, in words; the tray shows the cards. |
| Ordeal banner, today (`JourneyVignetteModal.tsx:257`) | "This is the peak moment of Kael Thornweaver's journey. Your choice determines their fate." → **removed**, replaced by the Ordeal header and stakes line below | PC-2, PC-6 | The old line promised the choice decides; after the change, the roll does. |
| Ordeal stakes line (above the choices) | "It tests his Star reach. A steep trial." | PC-2, PC-1 | What the step tests and its difficulty word (`DIFFICULTY_WORD_BANDS`, `nudge-constants.ts:233`: gentle / fair / steep / severe), as the encounter stage already says them (Law 17). The line for each choice is its lean, shown as the forecast word it leaves. |
| Threads row, transcended | "Kael Thornweaver · Transcended" | PC-6 | Matches the Return's transcendence ending. |
| Apotheosis, empty purse | "Your purse is empty. Kael Thornweaver stands in this doorway on his own." | PC-4 | Says the chapter plays without the god, and why. |
| Return | "Kael Thornweaver's story is told. The age has a season left. Another mortal can carry your thread." · button "Go on" | PC-7, PC-8 | A button that closes, and what is left to do. |
| Twilight beat 2 | "Kael Thornweaver, your First, stands at the end of the age as your Aspect. At the threshold you spent on him, and he became your Aspect. At the Ordeal you stepped back, and he scraped through." | PC-6 | The ending tells what this god did and did not do. |
| Harvest summary | "A somber age. Kael Thornweaver's story ended when he was simply gone; Nesrin faded into memory." | PC-6 | The First leads; the most remembered name follows. |
| Threads row | "Kael Thornweaver · Gone" | PC-6 | Matches the Return's "simply gone". |

Empty slots (PC-3): a missing `{place}` drops the place clause; a missing `{first}` renders "your First"; `{he}` / `{him}` / `{his}` / `{theirs}` come from the mortal's stored pronoun, never a default "they" over a gendered mortal. Also in scope for slice 1's content pass: the existing setup prose speaks the mortal's feelings ("feels the road ahead narrow"); the executor restates any such line as observable fact when it rewrites the variant (taste profile, "state facts"). Each line has a unit test with an empty slot. `{timeWord}` uses the existing Doom time words from the Breach panel ([THR-2219](https://linear.app/threadbare/issue/THR-2219) fixes their "four weeks of many weeks" reading; this line consumes the fixed words).

### UI Laws engaged
Laws 1 (reading order: price under the choice, weight above the choices), 13/14 (forecast and time in words), 17 (stakes before the spend), 21 (the default button on the Return is "Go on"), 33 (no new panel, nothing below the fold at 1920×1080), 37 (rows join existing blocks), 56 (every line is state-backed: the earned-slots clause only when slots were earned, "another mortal can carry your thread" only when a slot is open). Browser-verify: Playwright DOM (`mcp__playwright__*`); nothing is WebGL.

### Playtest signal · Notifications · Debug · Map
Warm tester: holds essence after the premonition, and retells the Ordeal or the threshold as something they did (the programme's success signal, judged by the next warm round, not a Done-when). No new toast type (the premonition uses the existing kind). DebugPanel: the thread edge's four new fields and the fitted difficulty of the current climax step. HexMapV2: none.

## Interface impact

| Contract | Kind | Note |
|---|---|---|
| journey choice → thread edge `ordealOutcome` | **extend** | Now written from a roll; adds `ordealBand`, `ordealGodPaid`. Reader: `returnEngine.ts` (unchanged), `twilight.ts` (slice 4). |
| world state → `readVisionScene` → vision pick | **add** | Reader of `located_at`, undertakings, chapter in progress. |
| Apotheosis completion → thread edge `apotheosisBand`, `apotheosisGodPaid` | **add** | Reader: `twilight.ts` (slice 4), census. |
| `chapterArchive` + `cardPlayTally` → `apotheosisEarnedSlots` → `buildNudgePhaseModel` → `dealHand` count | **add** | Reader of existing state; written into the deal count at deal time only, never into template data. |
| step `handMax` / `handMaxTotalDelta` → `dealHand` fill limit | **extend** | Absent on every step but the Apotheosis's step 1, so every other hand is unchanged. |
| thread edge → Twilight beat 2, harvest summary | **extend** | |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` are updated by each slice's executor.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — no new module except `vision-scene-content.ts` (data); every reader and writer is in the rows below.

| Slice | Orchestrator phase | Component | GameState | Trace | Debug visibility | Player control |
|---|---|---|---|---|---|---|
| 1 | journey beat (existing) | JourneyVignetteModal | thread edge `ordealBand`, `ordealGodPaid` | `journey.vision_scene`, `journey.ordeal_roll` | DebugPanel thread-edge fields; last vision's scene | the Ordeal choices |
| 2 | aspects 2a.78; encounter completion | Stage (`NudgePhaseShell.tsx`) | thread edge `apotheosisBand`, `apotheosisGodPaid` | `apotheosis.hand_built` | DebugPanel fitted difficulty of the current climax step; earned slots | the hand |
| 3 | journey Return | JourneyVignetteModal | none | none | none (text only) | "Go on" |
| 4 | twilight; harvest | Twilight ceremony, HarvestScreen, ThreadsPanel | reads | `twilight.first_lines` | trace only | none |

## Constants table

| Name | Default | Purpose |
|---|---|---|
| `CLIMAX_BARE_FORECAST` | 0.45 | Bare (no-card) chance the Ordeal and each Apotheosis step are fitted to: "Uncertain" |
| `FIT_ITERATIONS` | 12 | Bisection steps in `fitDifficultyToForecast` |
| `ORDEAL_LEAN_POUR` / `_STEADY` / `_WITHDRAW` | 0.30 / 0.12 / 0 | Odds bonus per Ordeal choice |
| `ORDEAL_COST_POUR` / `_STEADY` | 5 / 2 | Today's prices, named (primary pool) |
| `VISION_SCENE_FIT_BONUS` | 0.3 | Score added to a variant that fits the activity |
| `VISION_SCENE_MISMATCH_PENALTY` | 0.6 | Score removed from a tagged variant that does not |
| `APOTHEOSIS_DEAL_COUNT` | 1 | Repertoire cards dealt on top of the authored seven (7 + 1 = `NUDGE_HAND_MAX`) |
| `APOTHEOSIS_PAID_CHAPTERS_PER_SLOT` | 3 | The First's paid chapters per earned card |
| `APOTHEOSIS_EARNED_SLOTS_MAX` | 2 | Cap on earned cards |
| `APOTHEOSIS_HAND_MAX` | 10 | Step-1 exception to `NUDGE_HAND_MAX` (8) |
| `APOTHEOSIS_HAND_MAX_TOTAL_DELTA` | 0.90 | Step-1 exception to `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70) |

Prices are the purse ticket's to tune ([THR-2216](https://linear.app/threadbare/issue/THR-2216)); this plan sizes the climax in cards and forecast, not in prices. Each Done-when is a predicate, not these numbers (Law 1).

## Tracing

```ts
interface VisionSceneTrace { category: 'journey.vision_scene'; tick: number; actorId: string; activity: SceneActivity; placeId?: string; variantKey: string; fit: 'fit' | 'mismatch' | 'untagged' }
interface OrdealRollTrace { category: 'journey.ordeal_roll'; tick: number; actorId: string; choiceId: string; difficulty: number; lean: number; bareChance: number; chance: number; roll: number; luckDrawIndex?: number; band: StepOutcome; outcome: 'triumph' | 'scraped_through' | 'broken'; godPaid: boolean }
interface ApotheosisHandTrace { category: 'apotheosis.hand_built'; tick: number; actorId: string; authored: number; dealt: number; earned: number; payable: number; fittedDifficulty: number }
interface TwilightFirstLinesTrace { category: 'twilight.first_lines'; tick: number; firstId?: string; fate: string; apotheosis?: string; ordeal?: string }
```

## Fail-soft table

| Failure | Fallback |
|---|---|
| First has no `located_at` | Scene `rest`, no place clause |
| Unmapped undertaking verb or place kind | `rest` (and the content test fails the build first) |
| Fit helper cannot bracket the target | Authored difficulty |
| Ordeal fired with no First thread edge | Today's default `scraped_through`; no trace band |
| Old save: Ordeal choice still carries `ordealOutcome` | Ignored on Ordeal templates; the roll decides |
| Rolled band not in `ORDEAL_BAND_TO_OUTCOME` | `scraped_through` |
| No `consequenceByOutcome` line for the band | `consequenceProse` |
| `dealHand` returns nothing | The authored seven only |
| Thread edge lacks the new fields | Beat 2 shows the fate line only, as today |
| No First at Twilight | Beat 2 not shown (today's rule); summary keeps today's line |

## Blast Radius

`src/engine/orchestrator.ts` is not edited. `src/types/influence.ts` (147 importers, measured by grepping `from '…types/influence'` across `src/`) gains four optional fields on `ThreadEdgeProperties` (`:101`), additive, so no importer changes shape. `ActionStep` in `src/types/unifiedAction.ts` (`:2145`, wide-blast) gains four optional fields (`fitBareForecast`, `handMax`, `handMaxTotalDelta`, `dealEarned`), and the action instance gains optional `fittedDifficulty`, all additive. The authoring checks need no change: on a step that declares `deal`, `nudgeHandChecklist.ts:246/253` and `encounterPackage.ts:242` are skipped (their `composed` guards), and `:141` sees 7 authored + 1 declared = 8. Earned cards are added at deal time, so only the runtime fill limit needs the exception. The dealer's fill limit (`DEAL_HAND_MAX` / `DEAL_HAND_MAX_TOTAL_DELTA`, `dealHand.ts:325,409`) changes from a constant to "the step's value, else the constant", which leaves every existing step's hand unchanged. The resolution module gains one exported helper; no existing call changes. `GameView.tsx` (large) changes only the journey-choice handler's price line.

## Files touched

Slice 1: `src/types/journeyEngine.ts`, `src/engine/journeyEngine.ts`, the resolution module (helper), `src/data/journey-content.ts`, new `src/data/vision-scene-content.ts`, `src/components/Game/JourneyVignetteModal.tsx`, `src/components/Game/GameView.tsx` (price line), `src/types/influence.ts`.
Slice 2: `src/data/encounters/apotheosis-ascension.ts`, `src/data/nudge-constants.ts`, `src/engine/aspects.ts`, `src/engine/encounters/dealHand.ts` (the fill limit reads `handMax`; the `step` parameter widens), `src/types/unifiedAction.ts` (four optional step fields and `fittedDifficulty` on the instance), `src/types/influence.ts`, `src/engine/views/stage/buildNudgePhaseModel.ts`, `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx` (arrival and empty-purse lines), `src/data/aspect-content.ts`.
Slice 3: `src/engine/journeyEngine.ts` (`executeReturn`), `src/types/journeyEngine.ts`, `src/data/return-content.ts`, `src/components/Game/JourneyVignetteModal.tsx`.
Slice 4: `src/engine/twilight.ts`, `src/data/twilight-content.ts`, `src/engine/cycleEnd.ts`, `src/engine/retinue.ts`, `src/components/Game/ThreadsPanel.tsx`, `scripts/agency-census.ts`, `scripts/agency-verdict.ts`.

## Done when

**Slice 1:**
- [ ] On seeds 42, 99, 7 (census route), every Ordeal emits `journey.ordeal_roll` with a chance within 0.03 of `CLIMAX_BARE_FORECAST` for "step back", and the pre-roll forecast tier shown on each choice equals the tier of the chance the roll uses (a unit test drives the same call).
- [ ] No Ordeal choice text contains "guarantee" (content test).
- [ ] Over those seeds, `journey.vision_scene` reports `mismatch` on fewer than 1 in 5 visions, and a test pins that a `worship` scene never picks a `conflict`-only variant when a fitting one exists.
- [ ] Browser: 1920×1080 screenshot of an Ordeal vision showing the weight line, price lines and forecast words.

**Slice 2:**
- [ ] On seeds 42, 7, 1234 (the probe's route), every Apotheosis step 1 deals at least the authored seven to an unspent god and holds the clock (today: 0 cards, not held).
- [ ] On the three seeds, the bare forecast of Apotheosis steps 0 and 1 reads "Uncertain" (`apotheosis.hand_built` fitted difficulty, chance 0.40–0.50; today Fated 0.83–0.95).
- [ ] Step 1 holds 8 cards for a god that never paid into the First's chapters, and 9–10 for one that paid into at least `APOTHEOSIS_PAID_CHAPTERS_PER_SLOT` of them (unit test on `apotheosisEarnedSlots` and the `handMax` fill limit). In the census, the played arm's step-1 hand is larger than the hands-off arm's on at least 2 of 3 seeds.
- [ ] No other step's composed hand changes: a test over every library template asserts the dealer's fill limit is still `DEAL_HAND_MAX` / `DEAL_HAND_MAX_TOTAL_DELTA` where `handMax` is absent.
- [ ] The arrival line appears only when the hand holds more than 8 cards (unit test both ways).
- [ ] The premonition fires exactly once before every Apotheosis offer on the three seeds. A test (`apotheosisPremonition.test.ts`) counts premonitions per offer, and the `apotheosis.hand_built` trace's tick is later than the premonition's.
- [ ] Browser: screenshot of the arrival line.

**Slice 3:**
- [ ] The Return shows "Go on", and clicking it closes the Stage (Playwright DOM).
- [ ] "Another mortal can carry your thread" appears only when a thread slot is open (unit test both ways).

**Slice 4 — the played-vs-unplayed predicate:**
- [ ] `npm run census:agency` on seeds 42, 99, 7: on **at least 2 of 3 seeds** the played arm's Twilight beat 2 text differs from the hands-off arm's, **and** on **at least 1 seed** H6 (Ordeal outcome class) or H7 (Apotheosis band) differs. The census report quotes both beats per seed.
- [ ] A vanished First reads "Gone" in Threads (unit test).

**Every slice:** `npm run gate` passes; a 30-tick CLI smoke runs clean; the PR body carries the line-anchored closer for its own slice ticket; browser evidence per `Docs/canon/verification-gates.md` § Browser-verify.
## Kill criteria

- If fitted climaxes fail so often that most runs end with a broken First, raise `CLIMAX_BARE_FORECAST` (the shape stays). The next warm round also checks that a hands-off run still reads as a story, not a punishment (Law 32).
- If the scene term makes one variant fire in most visions, halve `VISION_SCENE_FIT_BONUS`.
- If H6/H7 never differ while beat 2 text does, the ending is reporting play that does not change outcomes; revisit the leans' size before shipping slice 4's wording.

## Coordination block

**Suggested model:** opus for slices 1 and 2 (resolution path, marble bag, hand assembly); sonnet for 3 and 4.
**Parallel-safe with:** slices 1 and 2 are file-disjoint except `src/types/influence.ts` (two optional fields each on `ThreadEdgeProperties`). Slice 3 touches `journeyEngine.ts` and `JourneyVignetteModal.tsx` like slice 1: build after it. Slice 4 is blocked by slices 1 and 2 (it reads their fields).
**Mutex with:** [THR-2216](https://linear.app/threadbare/issue/THR-2216) (purse) tunes card prices; these slices name prices as constants and size the climax in cards. [THR-2219](https://linear.app/threadbare/issue/THR-2219) owns the Doom time words slice 3 reads.

**Files to touch:** per slice, as listed in § Files touched. Each slice also edits its tests, `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts` (the contracts in § Interface impact), its rulebook lines (§ Rulebook impact), and the Design Reference Wiki page whose `sources` match.

## Notes for the executor

- `fitDifficultyToForecast` must call the forecast function the dice use, with floors and named lines (Law 18); never a copy of the sigmoid. Forecast probes never call `drawLuckRoll`.
- The Ordeal choices' ids stay, so saves that recorded a choice still resolve.
- Read `apotheosis-ascension.ts:246-300` before touching step 0: its `continue_weakened` and fork-on-step-0 comments are load-bearing.

## Three-pillar check

- [x] Engine: four slices with types, helper, traces
- [x] Content: scene tables and openers, Ordeal band lines, arrival, Return and ending lines
- [x] UI: vision lines, arrival line, Return button, Twilight lines, Threads word
- [x] Wiring connects them

## Vision audit

- [x] No Vision premise contradicted. Law 10: the Ordeal stops selling a band; the god leans on a roll. Law 11: the Apotheosis fork stays the mortal's. Law 32: the ending tells a story, never a score. Law 36: the climax costs; the bigger hand is bigger, not free.
- [x] No Vision edit needed.

## Rulebook impact

- [x] Changes rules of play: the Ordeal is rolled; the Apotheosis hand grows with play and is warned.
- [x] `Docs/canon/rulebook.md` § the First's journey adds "the Ordeal is rolled; the god's choice leans on it"; § Twilight adds the two beat-2 lines. The quick reference mirrors the Ordeal sentence. Each slice edits its own lines in its PR.

> Brainstorm companion: `Docs/plans/2026-11-14-thr-2204-put-the-god-in-the-climax-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every number in the constants table |
| 2. Inspectability | PASS | Four traces; DebugPanel fields |
| 3. Determinism | PASS | One marble-bag draw per Ordeal, plus one keyed unit stream per Ordeal for the core's own draw; no shared stream's count changes |
| 4. Fail-soft | PASS | Fail-soft table; optional fields |
| 5. Narrative | PASS | The ending names what the god did |
| 6. Additive | PASS | Optional fields, one helper; Ordeal choices lose a field only on Ordeal templates |
| 7. Performance | PASS | Twelve forecast calls per climax step, a handful per run |

## Intent-judge verdict

**Allow** (run 3, opus, cold, 2026-11-14). Runs 1 and 2 returned Revise, each fixed inline:
1. `ThreadEdgeProperties` lives in `influence.ts`, not `graph.ts`. Slice 2's hand could never exceed the dealer's 8-card / 0.70 limit, so it now carries a named exception. The arrival line was not state-backed. The old Ordeal banner was left in place. The Ordeal lacked Law 17's "what it tests" and difficulty word. There was no Transcended row.
2. The runtime limit was mis-cited (`DEAL_HAND_MAX`, not `NUDGE_HAND_MAX`). The earned-slot count needed a deal-time call site. The arrival line sat on step 0, which never deals earned cards.

Run 3's three non-blocking notes (the step-field count, authoring checks that need no change, and the "clamp" wording) are applied.

## Forked-audit verdicts

### NFP audit
**REVISE → fixed.** (1) The Ordeal roll had no named dice source: it now draws the d100 from the First's bag and the core's own draw from a keyed unit stream, never the tick's shared stream, with `seed` threaded into `recordJourneyChoice`. (2) The fitted difficulty is computed once and stored, so the shown forecast and the roll read one value (Law 18). (3) `OrdealRollTrace` gains `roll`, `luckDrawIndex` and `bareChance`, and the census says whether lean or bag position moved an H6 difference. (4) `consequenceProse` stays as a fallback, and two fail-soft rows were added. (5) NFP row 3 was corrected.

### Three-pillar audit
**PASS-with-notes → applied.** All three pillars are substantive, and the substrate is honest (three citations checked). Applied: the roll-versus-result order on an Ordeal (commit on click, result from the stored band); the old Ordeal banner is removed; non-predicate Done-whens moved to Playtest signal; the premonition gets a test name; the Stage shell is in Files touched; a debug column was added to Wiring.

### Vision audit
**REVISE (prose only) → fixed.** The premises hold and are strengthened (Laws 9–11, 32); the reserved question is correctly reserved, and nothing else decides meaning. Fixed: Twilight beat 2 now states plain facts instead of door metaphors; "Everything you had" became "You poured yourself" (true at any purse); pronoun slots replaced "theirs/them"; the arrival line has no counts and is state-backed; the harvest uses a plain ending fact. Noted for Law 32: the next warm round checks that hands-off runs still read as stories.
