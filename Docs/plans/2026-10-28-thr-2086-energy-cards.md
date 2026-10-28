> **title:** Energy gets cards a god can cast — THR-2086
> **linear_issue:** THR-2086
> **author:** Claude Code (design lane, run 2026-10-28c, unattended)
> **created:** 2026-10-28
> **three_pillars:** Engine done (no new code path: two card templates on existing ops, four constants, one widened receipt key) · Content done (two cards' words, effect prose, technical lines, art) · UI done (no new surface; the cards render in the existing drawer and market)

# Energy gets cards a god can cast — THR-2086

*A god whose Hunger burns with energy can finally spend essence on energy: one card that stokes a town's forges, one that strikes a spark in a mortal.*

## Why this is load-bearing

Three of the twelve Hungers carry energy (Kindle energy / life, Wander energy / time, Illuminate mind / energy, `src/data/hunger-catalog.ts`). No card a god can cast carries it. A god pays for its cards in its own spheres' essence and works its Mandate through them (Laws 30 and 38). So these three gods earn energy essence and can spend it on nothing that grows energy. The [god-caused Mandate plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md) (Decision 5) ships knowing this and says it is waiting on this ticket.

**Measured on `main` @ 60cbf560** (`scripts/_scratch-2086.ts`, run with `npx tsx`, not committed):

| Fact | Command and output |
|---|---|
| No ascendant-castable card carries energy | 141 cards with `essenceCost > 0` and `actorAffinities ∋ 'ascendant'`: spirit 25, mind 19, force 12, entropy 12, life 7, chaos 5, order 4, matter 3, darkness 2, time 2, **energy 0**, none-tagged 50 |
| The market has no energy card at tier 1 | `npm run check:god-card-progression` → `warn: hole: no energy market card at tier 1, 4` |
| Four cards are *priced* in energy but push no energy | `hex.attune_leyline` (5), `hex.amplify_flow` (3), `hex.anchor_sphere` (6), `hex.channel_current` (5): `progression.pricedIn: 'energy'`, `sphereAffinity` unset, tiers 2–3, all `targetCategories: ['hex']` |
| Tagging those four would not help | A hex target id is `hex_COL_ROW` (`hexActionBridge.ts:803-815`), not a graph node. `phaseSpherePressure.ts:472-473` drops a push whose `getNode(entityId)` is undefined ("fail-soft: unknown entity"). Every hex-targeted sphere push is dropped today, so `hex.seed_life` and `hex.bestow_vision` move nothing either. That defect is out of scope here and filed separately (§ Not in this plan) |
| A card's sphere pushes pressure on its target | `unifiedActionResolution.ts:4411-4423`: a resolved action whose template has `sphereAffinity` pushes `ACTION_PRESSURE_SUCCESS` (3) or `ACTION_PRESSURE_FAILURE` (1) onto `targetId`, `source: 'divine_action'` |
| Cheapest place card per sphere (the price band) | mind `sub.vision` 1 · chaos `loc.incite_unrest` 2 · order `loc.ward` 3 · life `loc.bless_harvest` 4 · force `loc.fortify` 4 · entropy `loc.blight` 4 · spirit `action.consecrate` 4 · matter `loc.reveal_vein` 5 |
| A prosperity swing of 5 or more plants scenes for the mortals there | `phaseProsperity.ts:582-585` `classifyEconShock` (`ECON_SHOCK_DELTA` = 5, `economic-scene-affinity.ts`); `plantShockSeeds` plants `ECON_SHOCK_SEED_COUNT` (2) seeds on mortals present, cause `direct_write` for a card's `update_node` |

## Decisions (design lane, 2026-10-28, by delegation; veto in chat)

1. **Two new tier-1 market cards, not a re-tag.** Tagging the four energy-priced hex cards would push pressure that the hex-target bug drops, so the Mandate would not move. *Veto:* "use the flows cards and fix hex pressure first".
2. **Stoke the Forges** (`loc.stoke_forges`, a town, 3 essence). The town's fires burn hotter: prosperity +6, unrest +5. Energy drives and frays. Open the Markets (order) raises prosperity and *calms* the square; this card raises it and *heats* it. +6 crosses the shock line, so two of the town's mortals get a boom scene. *Veto:* "an energy card shouldn't stir unrest".
3. **Kindle a Spark** (`divine.kindle_spark`, a mortal, 2 essence). It fans the lean the mortal already has, hot and short. It uses an `inspire_intervention` influence in energy, on Inspire's decay curve, with `valueDriftRule: { direction: 'own_lean', magnitude: KINDLE_SPARK_VALUE_DRIFT }`. That is the THR-1651 cast drift Dream uses (`dream-content.ts:217`, 0.08), set hotter at 0.12. Kindle's fantasy is "the spark in the broken … set them on fire" (`hunger-catalog.ts:161`). Copying Inspire as it stands would ship a dud. Measured: Inspire's card writes an influence with no drift, and `buildValueOverlay` (`interventionEffects.ts:106-134`) moves a value only where an entry carries one, so Inspire changes no choice today. That is filed as [Inspire changes nothing a mortal decides](https://linear.app/threadbare/issue/THR-2088). *Veto:* "an energy god should push mortals somewhere new, not deeper into what they are" (then `first_pole`, Persuade's rule).
4. **Both at tier 1, offered by the market, not gifted.** Law 38: most cards come from the world's offers, priced in their own sphere. Tier 1 fills the measured hole. No gift path changes.
5. **This plan does not wait on the Mandate change.** The gap exists under today's Mandate as well: a Kindle god earns energy essence and has nothing to spend it on. The Done-when is measured on today's `main`. The THR-2081 census, if it has shipped first, adds a report-only line.

Rejected, one line each ([brainstorm](2026-10-28-thr-2086-energy-cards-brainstorm.md)): re-tag the flows hex cards (dropped pressure, above); re-tag `divine.inspire` or `divine.rekindle_thread` to energy (moves a spine gift and a spirit gift away from every other god); a magical-saturation place card (it duplicates `loc.ward`'s op, and saturation reaches mortals only through a place trait); new substrate such as faster roads (its own ticket).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Card catalog `UNIFIED_ACTION_TEMPLATES` + `CardProgression` (THR-1811) | 🟢 ACTIVE | **extends**: two rows |
| Sphere pressure push on resolution (`unifiedActionResolution.ts:4411`) | 🟢 ACTIVE | **reads**: fires for the new rows' `sphereAffinity` |
| Econ shock seeding (`phaseProsperity.ts`, THR-725) | 🟢 ACTIVE | **reads**: Stoke's +6 trips it |
| Cast value drift (`castInfluenceDrift.ts`, THR-1651) | 🟢 ACTIVE | **reads**: Kindle a Spark's `own_lean` rule |
| Hex-target sphere push | 🔴 drops every push | not touched; [THR-2087](https://linear.app/threadbare/issue/THR-2087) |

## Pre-flight (action-catalog-design skill)

### Substrate Honesty table

| Verb | Substrate | Exists? | Verdict |
|---|---|---|---|
| Stoke the Forges | `update_node` on `prosperity` / `unrest` | Yes, `loc.open_markets` and `loc.incite_unrest` use it (`unified-action-templates.ts`) | rides existing |
| Stoke the Forges → mortal scenes | econ shock seeding | Yes, `phaseProsperity.ts:582` | rides existing |
| Kindle a Spark | `apply_influence` with a `valueDriftRule` (THR-1651) | Yes, `divine.dream` (`unified-action-templates.ts:440-449`); resolved in `graphOpExecutor.ts:788-823`; read by `agentSelection.ts:188-190` → `buildValueOverlay` | rides existing |
| Both → energy pressure | template `sphereAffinity` | Yes, `unifiedActionResolution.ts:4413` | rides existing |

No new substrate.

### Mortal-Loop Bridges

**Stoke the Forges.** The town's prosperity jumps 6, which `classifyEconShock` reads as a boom shock (`direct_write`). `plantShockSeeds` plants two encounter seeds on mortals standing in the town, drawn from the boom families. A threaded mortal living there is among the candidates. The +5 unrest feeds the [hunger and unrest](https://linear.app/threadbare/issue/THR-1934) ladder. Stoked again and again, a town climbs toward Restless, and those are the scenes its people are given.

**Kindle a Spark.** The target *is* a mortal. The cast deepens the mortal's existing lean on the value pair bound to the god's primary reach (`castInfluenceDrift.ts`), so their next choices tilt further the way they already lean, until the influence decays. The mortal's page shows "Inspired" (`agentDetail.ts:398`). A mortal sitting at exactly 0 on the pair has nothing to fan: the cast lands, writes no entry and traces `influence.no_lean`, as Dream does (`graphOpExecutor.ts:795-809`).

### Surface-Shape Verdict

Both are global `UnifiedActionTemplate`s in the drawer and the market, fired against a focused town or mortal. Neither is a nudge card: they are standing workings on the world, which the drawer hosts. The in-encounter energy hand comes from the nudge library's sphere-generic repertoire, so it does not change here.

## Engine pillar

No new code path. Two templates in `src/data/unified-action-templates.ts`, next to their kin:

- `loc.stoke_forges` after `loc.open_markets`: `progression: { tier: 1, offer: 'market', generic: false }`; `reach: 'gold'`, `crudType: 'update'`, `scale: 'local'`; one step, `reach: 'gold'`, `duration { min: 2, max: 3 }`, `difficulty: 0.25`. On success: `update_node $target { prosperity: +LOC_STOKE_FORGES_PROSPERITY_DELTA, unrest: +LOC_STOKE_FORGES_UNREST_DELTA }`. `essenceCost: 3`, `actorAffinities: ['ascendant']`, `sphereAffinity: 'energy'`, `targetCategories: ['location']`, `targetSubtypes` = Bless the Harvest's list plus `'tradehub'`; `motivations: ['preservation_transformation', 'courage_prudence']`.
- `divine.kindle_spark` after `divine.inspire`: `progression: { tier: 1, offer: 'market', generic: false }`; Inspire's shape (`reach: 'heart'`, `scale: 'cosmic'`, one step, `difficulty: 0.0`). On success: `apply_influence $target { interventionType: 'inspire_intervention', sphere: 'energy', ...DECAY_CONSTANTS.inspire_intervention, valueDriftRule: { direction: 'own_lean', magnitude: KINDLE_SPARK_VALUE_DRIFT } }`. `essenceCost: KINDLE_SPARK_ESSENCE_COST`, `sphereAffinity: 'energy'`, no `targetCategories` (Inspire's default, an actor).

`pricedIn` is left unset, so both are priced in energy (`godProgression.ts:203-208`). Graph nodes and edges: none. Tick phases: none new. The resolution phase already applies the ops and the pressure push. PRNG: none beyond the existing step roll. Both cards cast through the floor at success-at-cost (Law 26), as every working does.

## Content pillar

| File | Row |
|---|---|
| `unified-action-templates.ts` | names, spell names, descriptions, narrative templates (below) |
| `action-technical-effects.ts` | `loc.stoke_forges`: "On success, raises the location's `prosperity` by LOC_STOKE_FORGES_PROSPERITY_DELTA and its `unrest` by LOC_STOKE_FORGES_UNREST_DELTA. A rise of ECON_SHOCK_DELTA or more plants boom seeds on mortals present. Pushes energy pressure on the town." · `divine.kindle_spark`: "Applies an Energy influence on Inspire's decay curve that deepens the mortal's own lean on the value pair bound to the god's primary reach by KINDLE_SPARK_VALUE_DRIFT (THR-1651 `own_lean`). A mortal with no lean on that pair holds nothing." |
| `actionEffectsProse.ts` | one line each, quoted in § Player-facing text |
| `receipt-content.ts` | `CAST_INFLUENCE_RECEIPT_LINES` gains an `inspire_intervention` entry (three lines, quoted in § Player-facing text). Its key type widens from `'dream' \| 'persuade'` to include it, and so does the cast at `playerReceipts.ts:238`. Inspire carries no drift rule today, so `castInfluenceReceiptLine` still returns `undefined` for it, and [THR-2088](https://linear.app/threadbare/issue/THR-2088) inherits these lines when it gives Inspire one |
| `ascendant-beat-content.ts` | a bucket row each, `{ bucket: 'unlockable-generic' }`, as `loc.open_markets` has, if `ascendantPoolBeatTemplates.test.ts` requires one |
| `src/components/Game/actionArt.ts` + `public/assets/actions/` | two images by the action-card art recipe (fantasy-period: a smithy's coal bed flaring; a struck match / ember in cupped hands) |

**Words** (game register, not novel; [prose register](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/prose.md)):

- **Stoke the Forges** · *The Banked Coal Wakes* — "Breathes fire into a town's hearths and forges. Smiths work past dark, mills turn faster, and coin moves. The heat does not stay in the forge: tempers run short and the streets grow loud." Initiation: "breathes on the banked coals of the town's forges". Success: "every hearth in the town flares at once, and the hammers start before dawn". Failure: "the coals glow and settle; the town sleeps as it always has".
- **Kindle a Spark** · *The Struck Match* — "Strikes a spark in a mortal and fans whatever already burns there. What they half-wanted, they now want hotly, for a while." Initiation: "strikes a spark against a mortal's spirit". Success: "the mortal is on their feet before they know why". Failure: "the spark falls on wet ground and gutters out".

## UI pillar

No new component or screen. Both cards render in the existing ActionDrawer, market offers and card faces, with the sphere tint and price read from the template. One player-visible side effect: once THR-2081's Mandate line ships, `sphereHasAscendantCard('energy')` becomes true and an energy god's Mandate track reads "Raised by your own hand".

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Card face, drawer and market | "Stoke the Forges", spell name *The Banked Coal Wakes*, energy tint, 3 essence | PC-1 (what a card does) | A fire card for a town; the description says it brings coin *and* loud streets |
| Card face | "Kindle a Spark", *The Struck Match*, energy tint, 2 essence | PC-6 (two cards that read alike) | It says it fans what the mortal already wants; Dream reshapes desire in sleep, Inspire gives a calling |
| Card effect line (`actionEffectsProse.ts`) | Stoke: "Stokes a town's forges and hearths: its prosperity rises, and so does its unrest." · Spark: "Strikes a spark in a mortal: whichever way they already lean on the question your reach asks, they lean harder, hotly and briefly." | PC-1 | Same shape as Open the Markets' and Dream's lines, so the player compares like with like |
| Cast receipt after a Stoke (rendered, Hollowmere) | the template's success line through the existing overview path: "every hearth in the town flares at once, and the hammers start before dawn". The executor confirms the toast with `receiptToastReading` | PC-8 (the act answers) | The receipt says the fires took. No boom-shock chronicle line exists today (`LIVELIHOOD_SHOCK_LINES` covers blight, bless, sour mine, vein and siege only), so the boom shows up as the planted scenes (Market Day Festival, Merchant's Gambit, Foreign Trader: `economic-scene-affinity.ts:109-114` boom rows) and, if unrest crosses a tier, the town's unrest word |
| Cast receipt, Kindle a Spark landed (rendered, Mara, pole "courage") | new `CAST_INFLUENCE_RECEIPT_LINES.inspire_intervention.clean`: "Mara burns hotter for what they already wanted: courage pulls harder at every choice. The fire will die down; for now it drives them." · `at_cost`: "Mara catches the spark and runs too hot: courage pulls at every choice, and they are short with everyone. It will burn out." | PC-8 | Who changed and which way, in the same shape as Dream's and Persuade's receipts (THR-1651) |
| Cast receipt, Kindle a Spark on a mortal with no lean | new `found_nothing`: "The spark falls on Mara and finds nothing dry to catch. They go on as they were." | PC-8 | The player paid, and the game says plainly that nothing took, as Dream does ("the dream finds nothing in them to take hold of") |
| Mortal's page after a Spark | "Inspired" (`agentDetail.ts:398`, keyed by `inspire_intervention`) | PC-6 | Deliberately the same word as Inspire. The mortal's *state* is "inspired" whichever card caused it, and a second state word ("Kindled") would teach a new concept for the same thing (Law 43). The receipt names the card. "Kindle a Spark" echoing the Kindle Hunger is intended: it is that Hunger's signature act, though any god may buy it |

**Event notifications:** none new. Stoke's boom reaches the player through the existing shock receipts and chronicle lines, and Kindle a Spark through the existing cast receipt. **Debug inspection:** the trace viewer (`sphere_pressure`, `influence.applied` / `influence.no_lean`, the shock trace); a mortal's `divineInfluences` show in the agent detail. **Visual presence:** the two card faces only, with energy tint and art; no map signifier.

### Playtest signal

**Predicate:** in a warm or cold round played as a Kindle, Wander or Illuminate identity, the run's traces show a resolved `loc.stoke_forges` or `divine.kindle_spark` cast by the god without the tester being steered to it, and the tester's log says in their own words what it did to the town or the mortal. The playtest config has no card-coverage marker today (its markers are ambition, faction, undertaking), so the round report reads the cast from the trace export.

UI Laws engaged: 13 / 14 (the card names its own effect), 17 (stakes before the spend: the existing forecast word on cast), 21 (one reading per concept: Kindle a Spark names its difference from Inspire), 33 (sphere colour comes from the template), 37 (no new chrome). **Browser-verify:** a small visible change (two card faces). One 1920×1080 Playwright screenshot of the drawer on `?view=game&seeded&size=medium` with a Kindle identity, showing both cards. Use the existing debug lever that seats a card in the hand if the market has not offered it. The executor confirms which lever in `src/debug-bridge.d.ts`.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| two templates | resolution (existing) | ActionDrawer, market (existing) | none new | `sphere_pressure`, `econ_shock` (existing) | trace viewer; `check:god-card-progression` |
| two constants | n/a | n/a | n/a | n/a | CMS tunables, if the location-action block is listed there |

Wiki: the Design Reference Wiki page whose `sources` include `unified-action-templates.ts` gains the two cards in its card list (`check:wiki-freshness:blocking` names it). Systemic wiring guide: no new capability, no line.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Card resolution → sphere pressure → (Mandate) | preserve | two more producers on the existing push; no new consumer |
| Card `update_node` → settlement prosperity / unrest → econ shock, unrest ladder | preserve | same write `loc.open_markets` / `loc.incite_unrest` make |
| `apply_influence` + `valueDriftRule` → decision overlay | preserve | same write Dream makes |
| Card catalog → market offers / essence pricing | preserve | `pricedIn ?? sphereAffinity`, unchanged |

No `scripts/interface-contracts.ts` or `interface-map.md` edit: no contract is added, extended or retired.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `LOC_STOKE_FORGES_PROSPERITY_DELTA` | 6 | prosperity a successful Stoke adds. At ≥ `ECON_SHOCK_DELTA` (5) it plants boom scenes; matches Open the Markets |
| `LOC_STOKE_FORGES_UNREST_DELTA` | 5 | unrest a successful Stoke adds; a quarter of Incite Unrest's +20 |
| `KINDLE_SPARK_ESSENCE_COST` | 2 | Kindle a Spark's price, equal to Inspire's and Dream's `baseCost` |
| `KINDLE_SPARK_VALUE_DRIFT` | 0.12 | how far a Spark deepens the mortal's own lean; between Dream (0.08) and Compulsion (0.15) |

The two `LOC_` constants live in `src/data/location-action-constants.ts` beside `LOC_OPEN_MARKETS_*`. The two `KINDLE_SPARK_` constants live in `src/data/dream-content.ts` beside `DREAM_VALUE_DRIFT`. Stoke's 3 essence is the template's `essenceCost`, as every location card's is.

## Tracing

N/A — no new trace type. `sphere_pressure` (THR-1768) already names `divine_action` and the target. The prosperity phase's existing shock trace names the boom. `trait.inspired.*` shows on the mortal's page as "Inspired" (`agentDetail.ts:398`).

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Stoke cast on a town with no mortals present | prosperity and unrest still move; no seeds (as `collectPresentMortals` returns none) |
| `getActionArt` has no image | the card face's existing no-art frame (as every artless card today) |
| a pre-build save | no state; the cards appear in later market offers |
| the market never offers either card to an energy god | the sphere weighting already favours a god's own spheres; the Done-when tests the offer |

## Blast Radius

`src/data/unified-action-templates.ts` has 283 importers (`grep -rl "/unified-action-templates'" src scripts`). The change adds two array rows; no type or export changes. What can break is any test that iterates every template, where each new row must satisfy the same contracts as its neighbours (art, effect prose, technical effect, beat bucket, progression check, catalog counts or snapshots). Run `npm test` in full, not a filtered subset. Fix a count assertion by updating the count, never by excluding the new cards.

## Done when

- [ ] `npm run check:god-card-progression` no longer prints `hole: no energy market card at tier 1`.
- [ ] Re-running the census in § Why (or a test asserting it) counts at least 2 ascendant-castable `sphereAffinity: 'energy'` cards, one with `targetCategories: ['location']` at `essenceCost` ≤ 4.
- [ ] A test (`src/data/__tests__/energyCards.test.ts` or beside `answersPrayer.test.ts`): resolving `loc.stoke_forges` as the ascendant on a settlement fixture raises `prosperity` by 6 and `unrest` by 5 and pushes `{ sphere: 'energy', magnitude: 3, source: 'divine_action' }` onto the town; `divine.kindle_spark` on a mortal with a non-zero lean on the caster's reach pair writes a `divineInfluences` entry with `sphere: 'energy'` and a `valueDrifts` of ±0.12 on that pair (sign follows the lean), `buildValueOverlay` moves that pair, and energy pressure is pushed on the mortal. On a mortal at 0, no entry is written and `influence.no_lean` is traced.
- [ ] A test that a Kindle-identity god's tier-1 market offer pool includes both cards, priced in energy (`godProgression.ts` pricing).
- [ ] `actionEffectsProse.test.ts` and `ascendantPoolBeatTemplates.test.ts` pass with the new rows.
- [ ] One 1920×1080 screenshot of the drawer showing both cards. `npm run gate` green.
- [ ] *Report only, if [THR-2081](https://linear.app/threadbare/issue/THR-2081) has shipped:* `npm run census:mandate` on a Kindle identity, the scripted god's energy progress at doom 0.75, written in the status fragment. The ticket's original target is half. If it falls short, the executor files a tuning follow-up and does not block on it.

## Kill criteria

- A playtest shows Stoke cast on one town until it riots, as a dominant loop. Lower `LOC_STOKE_FORGES_PROSPERITY_DELTA` below the shock line, or raise the unrest delta. The design stands.
- The THR-2081 census still shows a Kindle god's energy half under a quarter of target at doom 0.75. Then cards alone are not enough; file the gap on the Mandate's targets instead of adding more cards here. Between a quarter and the ticket's half, the energy half is short but moving, which is a tuning follow-up (Done-when's report line), not a design failure.

## Not in this plan

- **Hex-targeted sphere pushes are dropped** (any `hex_C_R` target). Filed as its own bug: [hex cards' sphere pressure goes nowhere](https://linear.app/threadbare/issue/THR-2087). Once it is fixed, tagging the four energy-priced flows cards `sphereAffinity: 'energy'` is a one-line follow-up.
- **Inspire moves no choice** (its card writes no drift). Filed as [Inspire changes nothing a mortal decides](https://linear.app/threadbare/issue/THR-2088). Kindle a Spark does not inherit the defect: it carries its own drift rule.
- Energy at tier 4, and light. No Hunger carries light.

## Three-pillar check

- [x] Engine: two templates on existing ops, constants named
- [x] Content: words, technical lines, effect prose, art
- [x] UI: no new surface (rationale above); browser-verify named
- [x] Wiring: table above

## Vision audit

- [x] Law 38 (cards from the world's offers, priced in their own sphere) is newly true for energy. Law 36 (the purse is small): both cards cost. Law 9: Kindle a Spark leans a mortal and commands nothing. Law 41 (one vocabulary): no new effect. Law 45 (no false promise): Stoke's text names the unrest it causes.
- [x] No Vision edit needed.

## Rulebook impact

- [x] `Docs/canon/rulebook.md`: none. No rule of play changes; the card catalog is data (Law 38).
- [x] `Docs/canon/rulebook-quick-reference.md`: none.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | four named constants |
| 2. Inspectability | PASS | existing `sphere_pressure`, shock and influence traces |
| 3. Determinism | PASS | no new draw |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | energy gods get energy's fiction: fire and drive |
| 6. Additive | PASS | two new rows; nothing removed or re-tagged |
| 7. Performance | PASS | no new per-tick work |

## Coordination block

**Suggested model:** sonnet. Data rows on existing ops plus tests; no engine path.
**Parallel-safe with:** [the god-caused Mandate](https://linear.app/threadbare/issue/THR-2081), [famine and glut draws](https://linear.app/threadbare/issue/THR-2040), [the loan's collection](https://linear.app/threadbare/issue/THR-2044). None of them edits the card catalog's location or divine blocks.
**Mutex with:** anything adding or editing rows in `unified-action-templates.ts` near `loc.open_markets` / `divine.inspire`, `action-technical-effects.ts`, `actionEffectsProse.ts`, `ascendant-beat-content.ts`, `actionArt.ts` (shared tables; union-merge conflicts).

**Files to touch:** `src/data/unified-action-templates.ts`, `src/data/location-action-constants.ts`, `src/data/dream-content.ts` (the two `KINDLE_SPARK_` constants), `src/data/receipt-content.ts`, `src/engine/playerReceipts.ts` (the one key cast), `src/data/action-technical-effects.ts`, `src/data/actionEffectsProse.ts`, `src/data/ascendant-beat-content.ts` (if required), `src/components/Game/actionArt.ts`, `public/assets/actions/` (two images), one new test file, the wiki page the freshness gate names.

## Notes for the executor

- Copy `loc.open_markets` and `divine.inspire` as the starting shapes. Do not set `pricedIn` (it defaults to `sphereAffinity`).
- Do not tag the flows hex cards here; their pressure is dropped until [THR-2087](https://linear.app/threadbare/issue/THR-2087) lands.
- Before writing the screenshot step, check whether `targetSubtypes` on a seeded medium world matches at least one settlement the First can see. Bless the Harvest's list does.

## Intent-judge verdicts

**Run 1 (2026-10-28, opus, cold): Revise** (Reversible confirmed). The only GAP was player legibility (dim 12). The effect-prose lines and receipt lines were not quoted. The "Inspired" label after a Spark was not reconciled (PC-6). Nothing answered a no-lean cast (PC-8). There was no Playtest signal subsection. All were fixed: every line is now quoted, a new `inspire_intervention` receipt entry covers both landed and found-nothing casts, the label is kept on purpose (Law 43), and the predicate is written. Housekeeping was also done: `dream-content.ts` added to the files, and the quarter versus half kill threshold explained.

**Run 2: Allow** (Reversible confirmed). Every dimension passes. Non-blocking notes: record the real Stoke toast if it differs from the quoted line, and consider a boom-shock chronicle line only if playtests show testers cannot tie the scenes to Stoke.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-28*

### NFP audit

**NFP AUDIT: PASS-with-notes.** All seven pass. Note: `dream-content.ts` was missing from the files list. *Fixed.* Stoke's 3 essence is the template literal, as on every location card.

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.** All three pillars are present. The UI pillar lacked a Playtest signal predicate and its Event notifications, Debug inspection and Visual presence lines. *Fixed:* all four are added, and the predicate names only markers and traces that exist.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No premise contradicted. Kindle a Spark fans the mortal's own lean and commands nothing (non-negotiable §1). Stoke's repeat-cast risk is covered by the kill criteria. Note: the plan cites the Laws rather than Vision files by path, so Vision coverage is implicit.
