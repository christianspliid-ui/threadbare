> **title:** Force, matter and time get a cheap place card — THR-2089, slice 1
> **linear_issue:** THR-2089
> **author:** Claude Code (design lane, run 2026-10-30a, unattended)
> **created:** 2026-10-30
> **three_pillars:** Engine done (three card templates on existing ops, one progression-check warning, the census honours legal targets) · Content done (three cards' words, effect prose, technical lines, art) · UI done (no new surface; the cards render in the existing drawer and market)

# Force, matter and time get a cheap place card — THR-2089, slice 1

*A Reshape, Bind or Preserve god can finally spend its first sphere on the world: steel a town's walls, lay the footings of its next building, or keep its grain from spoiling.*

## Why this is load-bearing

Under the [god-caused Mandate](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md), only what the god's own cards raise counts. A god pays for its cards in its own spheres' essence (Laws 30, 38). So a sphere with no card a god can cast on a place cannot be raised, whatever the target is. THR-2081's Hunger sweep found 10 of 12 Hungers under half their first sphere at doom 0.75. Its kill criterion said to file the card gap "instead of refitting".

**Measured on `main` @ 9c6fc808** (`scripts/_scratch-2089-*.ts`, run with esbuild + node, not committed):

| Fact | Command and output |
|---|---|
| Tier-1 cards priced in each sphere | mind 8 cards (three at 1 essence); spirit 7, place card `sub.sanctify` 4; force `divine.intimidate` 2 (mortal), `loc.fortify` 4; life `loc.bless_harvest` 4, **gift only**; entropy `loc.blight` 4, **gift only**; **matter: no card carrying matter**; **time: no card carrying time** |
| Fortify has no legal target on the seeded world | `loc.fortify.targetSubtypes` = keep / fortress / stronghold / watchtower / garrison. Seeded medium 42 location subtypes include `fort` 1, `tower` 3 and none of those five. Census with legal targets only: **force casts 0** by t150 |
| The THR-2081 census over-credits | it picks place targets from `getPlaceNodes` (844 sublocation-tier Places) and ignores `targetSubtypes` (`scripts/mandate-census.ts:77-83`). The ticket's Reshape row (36.2 force) is casts a player cannot make |
| A 2-essence place card per sphere | a synthetic arm: a Vision clone tagged with each Mandate sphere at 2 essence, pushed into the catalogue in-process, against a legal-target arm with today's cards. Five Hungers, seeded medium 42, first bonded. Results below |

**At doom 0.75** (same runs, ledger P / S, targets 87 / 23, half = 43.5):

| Hunger (P / S) | today's cards, legal targets | 2-essence card per sphere |
|---|---|---|
| reshape (force / matter) | 0.2 / 34.2 | **68.2** / 65.6 |
| preserve (time / spirit) | 6.8 / 18.2 | **42.2** / 112.2 |
| haunt (spirit / entropy) | 13.2 / 39.0 | **57.2** / 107.2 |
| gather (life / spirit) | 4.2 / 18.2 | **1.2** / 118.2 |
| witness (mind / spirit), control | 93.2 / 20.2 (Vision at 1) | 45.2 / 117.2 |

The scripted god keeps casting on a half it has already filled (Preserve's spirit at 112 against 23). That spend is wasted, which is why Preserve's time half falls just short of 43.5. A player would move the essence, so the promoted census stops casting on a met half (§ Engine). **Gather is the exception:** even a cheap life card leaves life at 1.2. Life rises to 25 by t150, then doom's stage push (entropy on every location, `phaseDoom.ts:417-423`) takes it back under THR-2081 Decision 3. That is slice 2's problem, not a card gap.

## Decisions (design lane, 2026-10-30, by delegation; veto in chat)

1. **Cards, not a per-Hunger Mandate price.** Every sphere a Hunger can name gets a tier-1 market card that targets a settlement and costs 2 essence. A per-Hunger target would encode today's catalogue in the win condition, and it would still leave a Reshape god nothing to cast. *Veto:* "price the Mandate per Hunger instead".
2. **2 essence, not 1.** Mind's 1-essence Vision only looks (`crudType: 'read'`). A card that changes the world sits with Dream, Inspire and Kindle a Spark at 2 (Law 36). *Veto:* "make them 1, like Vision".
3. **Two slices.** This slice covers force, matter and time, the spheres with no castable place card. [Slice 2](https://linear.app/threadbare/issue/THR-2090) covers spirit, life and entropy, whose place cards exist but cost 4 and are gift-only or temple-gated.
4. **Steel the Walls and Fortify do the same thing to different places.** Both run `fortify_location` (same bonus, same cap). Fortify is the strongholds card (keeps, forts, towers) at 4 essence. Steel the Walls is the towns card at 2. The difference is the target, and each card's words say so. Fortify's `targetSubtypes` gains `fort` and `tower`, the subtypes this world generates, because today it has no legal target. *Veto:* "leave Fortify as it is", or "make Steel weaker than Fortify" (a new op parameter, not taken: it would add a second fortification strength for the player to learn, Law 43).
5. **The census casts only where a player could.** The legal-target filter is promoted into `scripts/mandate-census.ts`, so every later Hunger sweep measures real supply.

Rejected, one line each ([brainstorm](2026-10-30-thr-2089-cheap-place-cards-brainstorm.md)): re-pricing the existing 4-essence cards (three are gifts, so price does not put them in a hand); slowing doom as a time card (that is the clock itself); a muster card for force (no recruit substrate).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Card catalog `UNIFIED_ACTION_TEMPLATES` + `CardProgression` (THR-1811) | 🟢 ACTIVE | **extends**: three rows; Fortify's subtype list |
| `fortify_location` op (`graphOpExecutor.ts:1171`) → `fortificationMultiplier` → siege (`siegeResolution.ts:103`) | 🟢 ACTIVE | **reads** |
| Settlement economy `buildProgress` → next building (`phases/settlementEconomy.ts:488-520`) | 🟢 ACTIVE | **reads** |
| Settlement food store `foodStore`, capped at `STORE_DAYS` of need (`settlementEconomy/growth.ts:46-79`) | 🟢 ACTIVE | **reads** |
| Sphere pressure push on resolution (`unifiedActionResolution.ts:4413`) → Mandate ledger (THR-2081) | 🟢 ACTIVE | **reads** |
| Progression check holes (`godCardProgressionCheck.ts:118`) | 🟢 ACTIVE | **extends**: one warning |

## Pre-flight (action-catalog-design skill)

| Verb | Substrate | Exists? | Mortal-loop bridge |
|---|---|---|---|
| Steel the Walls | `fortify_location` | yes, `loc.fortify` | a raided or besieged town holds longer (`siegeResolution.ts`); the place page's defences row reads `fortificationMultiplier` (`placeRows.ts:247`) |
| Lay the Footings | `update_node` `buildProgress` | yes, the op; the property is the economy's own | the town raises its next building sooner. A new building is a new Place (`raiseBuilding`), which seeds its own scenes (`onSublocationCreated`) and work for mortals |
| Keep the Stores | `update_node` `foodStore` | yes, the op; the property is the economy's own | a town on the edge of hunger stays fed (`describe.ts:48`), so its unrest does not climb on hunger ([unrest ladder](https://linear.app/threadbare/issue/THR-1934)) |

No new substrate. **Surface:** all three are global `UnifiedActionTemplate`s in the drawer and market, fired at a focused town. None is a nudge card.

## Engine pillar

No new code path. Three rows in `src/data/unified-action-templates.ts`, beside `loc.open_markets` and `loc.stoke_forges`, copying their shape. Each row has `progression: { tier: 1, offer: 'market', generic: false }`, `crudType: 'update'`, `scale: 'local'`, `essenceCost: 2`, `actorAffinities: ['ascendant']`, `targetCategories: ['location']`, `targetSubtypes: ['settlement', 'hamlet', 'town', 'city', 'capital']`, and one step with `duration { min: 1, max: 2 }` and `failBehavior: 'fail_action'`. `pricedIn` stays unset, so `sphereAffinity` sets the price.

| id | `sphereAffinity` | `reach` | difficulty | `onSuccess` | `motivations` |
|---|---|---|---|---|---|
| `loc.steel_walls` | force | `iron` | 0.25 | `{ op: 'fortify_location', nodeId: '$target' }` | `courage_prudence`, `loyalty_ambition` |
| `loc.lay_footings` | matter | `stone` | 0.20 | `update_node $target { buildProgress: +LOC_LAY_FOOTINGS_BUILD_DELTA }` | `preservation_transformation`, `tradition_novelty` |
| `loc.keep_stores` | time | `gold` | 0.20 | `update_node $target { foodStore: +LOC_KEEP_STORES_FOOD_DELTA }` | `preservation_transformation`, `courage_prudence` |

All three reach ids are in use in the catalogue today (`iron` 16 rows, `stone` 12, `gold` 20; gold is Open the Markets' reach). Keep the Stores matters most in lean seasons: on the seeded world many towns' stores already sit at their three-day cap (a town of 9 holds 41 of 40.5), so in peacetime the card mostly pushes time pressure.

- `loc.fortify.targetSubtypes` gains `'fort'` and `'tower'` (additive; no existing subtype removed).
- `godCardProgressionCheck.ts`: one more warning per sphere in `HUNGER_SPHERES` (the union of `hunger-catalog.ts` sphere alignments): `hole: no cheap ${sphere} place card`, unless a market card at tier 1 exists with `sphereAffinity` = that sphere, `essenceCost ≤ CHEAP_PLACE_CARD_MAX_COST`, `targetCategories` containing `location` or `sublocation`, and `targetSubtypes` empty or containing `town`. After this slice it prints for spirit, life and entropy, slice 2's list.
- `scripts/mandate-census.ts`: a card with `targetSubtypes` draws its targets from `getLocationNodes`, keeping nodes whose `locationSubtype ?? locationType` is listed. A card without them keeps today's pool. The census god also stops casting on a sphere once its ledger meets that sphere's target. Report-only change; no Done-when of THR-2081 moves.

Graph nodes, edges, tick phases: none new. PRNG: none beyond the step roll. All three cast through the floor at success-at-cost (Law 26).

## Content pillar

| File | Row |
|---|---|
| `unified-action-templates.ts` | names, spell names, descriptions, narrative templates (below) |
| `action-technical-effects.ts` | Steel: "Raises the location's `fortificationMultiplier` by FORTIFY_MULTIPLIER_BONUS (capped at FORTIFY_MULTIPLIER_MAX); read by siege resolution. Pushes force pressure on the town." · Footings: "Adds LOC_LAY_FOOTINGS_BUILD_DELTA to the settlement's `buildProgress`; the next building rises when progress meets its cost. Pushes matter pressure." · Stores: "Adds LOC_KEEP_STORES_FOOD_DELTA to `foodStore`, clamped to STORE_DAYS of need on the next economy tick. Pushes time pressure." |
| `actionEffectsProse.ts` | one line each (§ Player-facing text) |
| `ascendant-beat-content.ts` | a `{ bucket: 'unlockable-generic' }` row each, if `ascendantPoolBeatTemplates.test.ts` requires it |
| `src/components/Game/actionArt.ts` + `public/assets/actions/` | three images by the action-card art recipe, fantasy-period: a smith's hammer on a gate's iron bands; masons setting a cornerstone; sealed grain jars in a cool cellar |

**Words** (game register; [prose canon](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/prose.md)):

- **Steel the Walls** · *Iron in the Mortar*: "Puts strength into a town's walls and gates. Timbers that were rotting hold, and the watch stands straighter. The next army to come against it pays more for every yard." Initiation: "lays a hand on the town's gate and leans". Success: "the walls stand a hand's breadth taller, though no mason touched them". Failure: "the gate creaks and settles; the walls stay as they were".
- **Lay the Footings** · *The Cornerstone Set*: "Sets stone for a town's next building before anyone has dug for it. Whatever the town was going to raise next, it raises sooner." Initiation: "presses the earth flat where the town means to build". Success: "the footings are dug and set by morning, square and level". Failure: "the ground shifts under the lines and the stakes fall".
- **Keep the Stores** · *Grain That Does Not Spoil*: "Holds back time in a town's granaries and cellars. What was stored keeps, and the town has a little more to eat when the lean days come." Initiation: "breathes cold into the town's granaries". Success: "the grain in the jars is as sound as the day it was cut". Failure: "the cellar air stays warm; the mould keeps its own time".

## UI pillar

No new component or screen. The three cards render in the existing ActionDrawer, market offers and card faces, with sphere tint and price read from the template.

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Card face, drawer and market | "Steel the Walls", *Iron in the Mortar*, force tint, 2 essence. Beside it, unchanged: "Fortify", *Iron Bulwark*, 4 essence | PC-6 (two cards that read alike) | Same effect, different ground. Fortify's effect line today: "Hardens a fortification's walls and the will of its garrison, so it holds longer under siege." Steel's (below) says "a town's walls". The drawer offers only the card that fits the focused place (subtype gate, `targetActions.ts:391`), so a player never weighs one against the other for the same target |
| Card face | "Lay the Footings", *The Cornerstone Set*, matter tint, 2 | PC-1 (what a card does) | It speeds the town's next building |
| Card face | "Keep the Stores", *Grain That Does Not Spoil*, time tint, 2 | PC-1 | It stretches the town's food |
| Effect line (`actionEffectsProse.ts`) | Steel: "Strengthens a town's walls: a siege against it goes harder for the attacker." · Footings: "Sets the footings of a town's next building: it rises sooner." · Stores: "Keeps a town's stores from spoiling: it has more put by for lean days, up to what its granaries hold." | PC-1 | Same shape as Open the Markets' and Stoke the Forges' lines |
| Cast receipt (rendered, Hollowmere) | the template's success line through the existing overview path, e.g. "the grain in the jars is as sound as the day it was cut". The executor confirms the toast with `receiptToastReading` | PC-8 (the act answers) | The receipt says the working took; the town's page shows the result (defences row, next building, fortunes line) |
| Keep the Stores on a town whose stores are full | the success line, and the store does not grow past its cap | PC-8 | Known limit, accepted: the effect line says "up to what its granaries hold" |

**Event notifications:** none new. **Debug inspection:** the trace viewer (`sphere_pressure`, `mandate_ledger_credit`); the location's properties in the CLI. **Visual presence:** the three card faces only.

UI Laws engaged: 13 / 14 (each card names its effect), 17 (stakes before the spend: the existing forecast word), 21 (Steel and Fortify name their ground: a town, a fortification), 33 (tint from the template), 37 (no new chrome), 45 (Keep the Stores says its cap). **Browser-verify:** a small visible change. One 1920×1080 Playwright screenshot of the drawer on `?view=game&seeded&size=medium` with a Reshape identity, showing Steel the Walls and Lay the Footings, using the debug lever that seats a card in the hand if the market has not offered one (`src/debug-bridge.d.ts`).

### Playtest signal

In a warm or cold round played as Reshape, Bind or Preserve, the trace export shows the god casting one of the three without being steered, and the tester's log says in their own words what it did to the town.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| three templates | resolution (existing) | ActionDrawer, market | none new | `sphere_pressure`, `mandate_ledger_credit` (existing) | trace viewer; `check:god-card-progression` |
| progression warning | none (script) | none | none | none | `npm run check:god-card-progression` |
| census filter | none (script) | none | none | none | `npm run census:mandate` |

Wiki: the Design Reference Wiki page whose `sources` include `unified-action-templates.ts` gains the three cards (`check:wiki-freshness:blocking` names it). Systemic wiring guide: no new capability.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Card resolution → sphere pressure → Mandate ledger | preserve | three more producers on the existing push |
| Card op → `fortificationMultiplier` / `buildProgress` / `foodStore` → siege, building, hunger | preserve | the economy and siege already read these; a card is one more writer of the same fields |
| Card catalog → market offers / pricing | preserve | unchanged rule |

No `scripts/interface-contracts.ts` or `interface-map.md` edit: no contract is added, extended or retired.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `LOC_LAY_FOOTINGS_BUILD_DELTA` | 5 | build progress a Footings cast adds; a third of the cheapest building's cost (15, `settlement-buildings.ts`) |
| `LOC_KEEP_STORES_FOOD_DELTA` | 12 | food a Stores cast adds before the cap clamps it; about one day's need for a town of 8 (`FOOD_PER_PERSON` 1.5) |
| `CHEAP_PLACE_CARD_MAX_COST` | 2 | the price at or under which a tier-1 market place card counts as a sphere's cheap card in the progression check |

The two `LOC_` constants live in `src/data/location-action-constants.ts`, beside `LOC_STOKE_FORGES_*`; the check's constant in `godCardProgressionCheck.ts`. Steel the Walls reuses `FORTIFY_MULTIPLIER_BONUS` / `_MAX` unchanged.

## Tracing

N/A — no new trace type. `sphere_pressure` names `divine_action` and the target; `mandate_ledger_credit` names the god's credit.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `buildProgress` or `foodStore` absent on the node | `update_node`'s relative change counts a non-number as 0 (`graphOpExecutor.ts:549`) |
| building slots full | progress banks until a slot opens (`settlementEconomy.ts:493`) |
| food store at cap | the next economy tick clamps it (`growth.ts:79`); the pressure push still lands |
| `getActionArt` has no image | the existing no-art frame |
| a pre-build save | no state; the cards appear in later market offers |

## Blast Radius

`src/data/unified-action-templates.ts` has 283 importers. The change adds three rows and two subtype strings; no type or export changes. Every test that iterates the catalogue must accept the new rows (art, effect prose, technical effect, beat bucket, progression, counts). Run `npm test` in full, and fix a count by updating it, never by excluding the cards.

## Done when

- [ ] `npm run check:god-card-progression` prints no `hole: no cheap force|matter|time place card` and does print it for spirit, life and entropy.
- [ ] `npm run census:mandate -- sweep seeded reshape` and `… preserve`, with the legal-target filter and the met-half stop, show the scripted god's **first** sphere at or above half its target (43.5) at doom 0.75, or, between a quarter and half, a filed tuning follow-up (§ Kill criteria). `… bind` shows matter the same. Numbers go in the status fragment. (Lane measurement with a synthetic card: force 68.2, time 42.2 without the stop.)
- [ ] A test (`src/data/__tests__/cheapPlaceCards.test.ts`): resolving each card as the ascendant on a town fixture changes `fortificationMultiplier` / `buildProgress` / `foodStore` as specified, and pushes `{ sphere, magnitude: 3, source: 'divine_action' }` on the town.
- [ ] A test that a Reshape-identity god's tier-1 market offer pool includes Steel the Walls and Lay the Footings, priced in force and matter.
- [ ] `loc.fortify` is offered against the seeded world's `fort`.
- [ ] `actionEffectsProse.test.ts` and `ascendantPoolBeatTemplates.test.ts` pass. One 1920×1080 screenshot as above. `npm run gate` green.

## Kill criteria

- The census still shows a slice-1 first sphere under a quarter of its target (21.75) at doom 0.75. Then cards are not the binding limit; file against the Mandate's targets.
- Between a quarter and half (21.75 to 43.5): the cards ship. The executor records the number in the status fragment and files a tuning follow-up (card price or delta, in the same project). That Done-when line is then met by the filed follow-up, not by the number. This is the THR-2086 pattern.
- A playtest shows Keep the Stores cast every tick on one town as a dominant loop. Lower its delta; the design stands.

## Not in this plan

- **Slice 2: spirit, life and entropy cheap place cards.** Filed as [Spirit, life and entropy get a cheap place card](https://linear.app/threadbare/issue/THR-2090), blocked by this ticket (same tables). It also carries the doom-wears-life finding: doom's stage push puts entropy on every location (`phaseDoom.ts:417-423`), so the clock takes back a life god's work. Gather's life ledger with a cheap life card: 25 at t150, 4 at t300, 1.2 at doom 0.75. Whether doom should wear down the god's own ground in life is a question about what the Mandate means, so slice 2 may reserve it for Christian.
- Hex-targeted cards ([THR-2087](https://linear.app/threadbare/issue/THR-2087)).

## Three-pillar check

- [x] Engine: three templates on existing ops; one check; census filter; constants named
- [x] Content: words, technical lines, effect prose, art
- [x] UI: no new surface (rationale above); browser-verify named
- [x] Wiring: table above

## Vision audit

- [x] Law 38 newly true for force, matter and time: a god's verbs come from the market, priced in their own sphere. Law 36: each costs 2. Law 41: no new effect. Law 45: Keep the Stores names its cap. Law 37 unchanged.
- [x] No Vision edit needed.

## Rulebook impact

- [x] `Docs/canon/rulebook.md`: none. The card catalog is data (Law 38).
- [x] `Docs/canon/rulebook-quick-reference.md`: none.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | three named constants |
| 2. Inspectability | PASS | existing pressure and ledger traces |
| 3. Determinism | PASS | no new draw |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | each sphere's own fiction: strength, stone, keeping |
| 6. Additive | PASS | three rows; two subtype strings added |
| 7. Performance | PASS | no per-tick work |

## Coordination block

**Suggested model:** sonnet. Data rows on existing ops, one script check, tests.
**Parallel-safe with:** [hex cards' sphere pressure](https://linear.app/threadbare/issue/THR-2087) (it edits `phaseSpherePressure.ts` / hex bridge, not card rows).
**Mutex with:** anything adding rows near `loc.open_markets` / `loc.stoke_forges` in `unified-action-templates.ts`, `location-action-constants.ts`, `action-technical-effects.ts`, `actionEffectsProse.ts`, `ascendant-beat-content.ts`, `actionArt.ts` (shared tables), and [slice 2](https://linear.app/threadbare/issue/THR-2090) (same tables).

**Files to touch:** `src/data/unified-action-templates.ts`, `src/data/location-action-constants.ts`, `src/data/action-technical-effects.ts`, `src/data/actionEffectsProse.ts`, `src/data/ascendant-beat-content.ts` (if required), `src/engine/godCardProgressionCheck.ts`, `scripts/mandate-census.ts`, `src/components/Game/actionArt.ts`, `public/assets/actions/` (three images), one new test, the wiki page the freshness gate names.

## Notes for the executor

- Copy `loc.stoke_forges` as the starting shape. Do not set `pricedIn`.
- Promote the census filter from the lane's scratch (`proto/thr-2089-cheap-place-cards`, `scripts/_scratch-2089-census.ts`, the `SUBF` branch). Leave the `SYNTH` arm out of `main`.
- Leave slice 2's spheres alone, even though the new check warns for them.

## Intent-judge verdicts

**Run 1 (2026-10-30, opus, cold): Revise** (Reversible confirmed). There were three findings. The PC-6 claim that Fortify is "stronger" had no mechanical basis, since both cards run the same op. Slice 2 was self-linked rather than filed. A first sphere between a quarter and half of target at doom 0.75 failed the Done-when without triggering a kill criterion. All three were fixed: Decision 4 now says same effect, different ground, and quotes Fortify's line; slice 2 is filed as [THR-2090](https://linear.app/threadbare/issue/THR-2090); and that band now ships with a filed tuning follow-up.

**Run 2: Allow** (Reversible confirmed). All twelve dimensions pass and there are no findings. The judge noted one housekeeping item: confirm THR-2090's blocked-by relation. It was set with `save_issue(blockedBy: ["THR-2089"])`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-30*

### NFP audit

**NFP AUDIT: PASS-with-notes.** NFPs 1–6 pass. The constants are named, Steel reuses `FORTIFY_MULTIPLIER_*`, the traces exist, there is no new draw, the fail-soft table covers absent properties, full slots, a store at cap, missing art and old saves, and the change only adds. **7 (note):** there is no per-tick work, and the census filter calls `getLocationNodes` only in an offline script. With 283 importers, the full test run is the only guard. The auditor judged wiring from the plan's table, because `wiring-checklist.md` exceeds its read limit.

### Three-pillar audit

**PILLAR AUDIT: PASS.** Engine, Content and UI are each present and substantive (UI: no new surface, with rationale, PC classes, browser-verify, a playtest predicate and the Laws cited). No required section is missing. The wiring table covers all three modules. The substrate inventory checks against `systems-inventory.md`: the Mandate and `godCardProgressionCheck.ts` are extended or read, not rebuilt, and nothing is green-field.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions. It extends the north star (two clocks; more Mandate producers) and confirms non-negotiables 1 (the cards act on towns, never command mortals), 3 (numberless prose effect lines), 6 and 7, plus the taste profile's prose-first register. **Note, tension 4 (legibility vs mystery):** the rationale is Mandate-sphere supply, and Steel and Fortify differ only by target. The drawer's subtype gate and distinct words offset this. *Lane response:* accepted. The kill criterion's playtest line watches for a dominant loop, and Decision 4 names the shared effect openly.
