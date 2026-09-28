> **title:** Seeded things that stay alive — trade lanes that carry while their towns stand, and a clue climb a mortal can finish — THR-1636
> **linear_issue:** THR-1636
> **author:** Claude Code (design lane, run 2026-09-28c)
> **created:** 2026-09-28
> **three_pillars:** Engine `done` · Content `done — two seed-only ruin encounters (the visit and the cold lead), authored on the factory line; no new prose tables` · UI `done — the map's lane line already reads volume; the hex tooltip gains "blockaded" and "fading"; the sheet's existing lead line reads the sharper precision`

# Seeded things that stay alive — THR-1636

*Every trade lane in the world dies on the same tick (36), because nothing in the simulation trades on it. And no ruin can ever be delved, because no mortal can finish the climb from rumour to "I know where it lies". This plan makes a lane live while both of its towns stand and nothing blocks it, and turns a lead into a reason to go and look, ending on the ruin's own hex where the delve begins.*

## Why this is load-bearing

The living-world map ([A world that starts alive](https://linear.app/threadbare/issue/THR-1589)) seeds lanes, ruins and a past so that the world has something going on at minute one. Two of those seeded things are dead on arrival:

- **Lanes.** Worldgen lays two lanes from each culture's capital. The map draws them as gold lines, the tooltip names their cargo, prosperity pays for them, and route events (ambush, toll, embargo) fire on them. All of it stops on tick 36, because the lanes have no traffic. A lane minted at volume 1 gets a 36-tick founder's grace (THR-1320) and then decays at 1 per tick. Nothing but a god's verb or an owner's work ever marks it as traded, and nobody owns a seeded lane.
- **The clue climb.** About 100 elder ruins per world, the delve system, places of power and ruin transformation all hang off one edge: a `located` clue held by a mortal standing on the ruin's hex. In 300 ticks, on either seed, no such clue ever exists.

This is carve-up plan 7 of 7 from that map. Its sibling plans seed people, ties, a past and faith. This one keeps what is already seeded from dying on schedule.

**Settled input, not reopened here.**

- [Seeded things that die](https://linear.app/threadbare/issue/THR-1595) (orchestrator research, 2026-09-25). Lane upkeep and the clue climb are open design calls. The `sacred_route` and culture calls went to the [faith and politics plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md), not here. The five writer and reader defects it filed have all shipped (THR-1615 to THR-1619).
- [What liveness costs](https://linear.app/threadbare/issue/THR-1592) sets the budget line: +10% steady-state tick cost against a same-session baseline, and deciders at t200 within +10%. It also named `phaseDelveAdmission` as the single biggest per-mortal scanner.
- The map's standing rulings: counts are named constants, the same seed makes the same world, and the tick budget binds.

**Decided in this plan by the design lane under delegation** (process.md rule 4: the *how* of an agreed outcome). Each is marked *Lane decision* where it appears, and each can be vetoed in chat:

1. **A lane lives while its towns stand, not while it has cargo** (§ S1). Cargo is too thin to carry the rule. At tick 12, all six seeded lanes on seed 99 have an empty manifest, and seed 42 has two lanes with one good each (measured below). Cargo decides how *busy* a lane is. It does not decide whether the lane lives.
2. **Traffic is route state, not caravans** (§ S1). This follows the route-events rule already in the code (*"Caravans are route STATE, not agents (NFP #7)"*, `phases/routeEvents.ts:6`). Nothing new walks the map.
3. **A blockade suspends a lane, and neglect is what kills it** (§ S1). A blockaded lane does not decay while the blockade holds, as the blockade verb's own comment already promises (*"suspended, not deleted"*, `undertaking-objects.ts:1384`). A lane dies when one of its towns stops being a standing settlement, or when its roads are cursed.
4. **The clue climb follows the hunt's shape** (§ S2, S3). A survey of a ruin you hold a lead on arranges a visit, an appointment at the ruin, exactly as a hunt arranges the confront at the den ([THR-1560](https://linear.app/threadbare/issue/THR-1560)). The visit's own dice decide whether the lead becomes `located`.
5. **Leads lean toward the mortals who can act on them** (§ S2). Rumours still reach anyone in the settlement, but a deciding mortal who is present is weighted up.

## Re-measured on current `main` (2026-09-28, `50cc9bc2`)

Readers: `readers/dying.ts` (the THR-1595 reader, unchanged) and a new `readers/upkeep.ts` committed with this plan. Seeds 42 and 99, medium map, 300 unattended ticks. Outputs: `output/dying-2026-09-28.json` and `output/upkeep-2026-09-28.json`.

| | seed 42 | seed 99 |
|---|---|---|
| Worldgen lanes at t0 | 6, none owned | 6, none owned |
| Tick each worldgen lane vanished | **36, 36, 36, 36, 36, 36** | **36, 36, 36, 36, 36, 36** |
| Lanes founded by mortals, and their lifetimes | 1, dissolved at +36 | 1, dissolved at +36 |
| Lanes standing at t50 / t100 / t150 / t200 / t300 | 0 / 0 / 0 / 1 / 0 | 0 / 1 / 0 / 0 / 0 |
| Route objects at t300 (THR-1615 now removes them with the lane) | 0 | 0 |
| Seeded lanes with an empty manifest, at t0 / t12 | 3 of 6 / **4 of 6** | 2 of 6 / **6 of 6** |
| Pair balance at t12 (0–1) | 0 on every lane | 0 on every lane |
| Clues minted, by source | 34: tavern rumour 20, spy debrief 7, library 6, encounter 1 | 38: tavern rumour 26, spy debrief 12 |
| Clue precision | **all `vague`** | **all `vague`** |
| Holders: ambient / deciding | **29 / 5** | **36 / 2** |
| Clues that decayed unused | 27 | 35 |
| Survey undertakings on a Location (`cell.observe.location`), and how many hit a ruin | 3, **0** | 2, **0** |
| `located` clues, delves admitted, places of power held | 0, 0, 0 | 0, 0, 0 |

**Why the climb cannot finish today.** Three facts, each measured or read in code:

| Fact | Where | Consequence |
|---|---|---|
| A survey is an *instant* undertaking, and instant work always resolves as plain `success` (`INSTANT_COMPLETION_BAND`). A `located` lead is written only on `critical_success`. | `strategic-action-constants.ts:1434` (`INSTANT_COMPLETION_BAND`), `:1442-1446` (`OBSERVE_CLUE_PRECISION_BY_BAND`) | No survey can ever write `located`. The top rung is unreachable by construction. |
| A survey of a site you already hold a lead on is **refused** (`clue_already_held`). | `strategicGraphOps.ts:517-522` (`spawnClue`) | A rumour blocks its holder's own survey, so a lead cannot be improved. |
| Nothing makes a lead a reason to act. Survey targets are the nearest Locations, capped (`orderTargetsByProximity`). Undertakings do not bring a mortal to the site (`UNDERTAKING_DEFAULT_REQUIRES_LOCATION = false`, waiting on THR-1294). Elder ruins have no encounters of their own (audit C5). | `strategicActionCandidates.ts:619-676`; `strategic-action-constants.ts:456` | A mortal who does hold a lead never goes to its ruin, and the delve scan needs them *on the ruin's hex*. |

## Substrate inventory

Greps on `Docs/canon/systems-inventory.md` and `src/engine/` for *lane, trade route, caravan, clue, lead, delve, survey, appointment*: every mechanism this plan needs already exists. Nothing here is green-field.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Mortal Economy & Prosperity: Trade Route Decay (`phaseTradeRouteDecay`, phase 6.62) | 🟢 ACTIVE | **extends**: carrying lanes are marked traded before the staleness check, a blockaded lane is suspended, and volume settles toward a lane's traffic level |
| Mortal Economy: trade routes (`tradeRoute.ts`: `buildRouteManifest`, `scoreRoutePairBalance`, `isRouteStale`) | 🟢 ACTIVE | **extends**: read to set a lane's traffic level; `isRouteStale` unchanged |
| Route events (`phases/routeEvents.ts`: ambush, toll, embargo) | 🟢 ACTIVE | **activates**: a lane that lives past t36 is scanned every 12 ticks for the whole run instead of 3 times |
| HexMapV2 trade-route layer (`TradeRouteMesh`, `HexTooltip` route lines, `tradeRouteMarkers`) | 🟢 ACTIVE | **extends**: one state word per lane in the tooltip |
| Ruins, Clues & Delves: clue lifecycle (`clueLifecycle.ts`), rumour sweep (`clueRumors.ts`), delve admission (`delveVariant.ts`) | 🟢 ACTIVE | **extends**: a decider weight in lead recipient scoring; a pending visit pauses lead decay; admission is driven from lead holders |
| Undertakings, cell model: `observe × Location` (`maybeSpawnSiteClue`), `spawnClue` | 🟢 ACTIVE | **extends**: a survey sharpens a held lead instead of refusing; a held lead joins the holder's survey candidates |
| Appointments (THR-1479 / THR-1519 `UNDERTAKING_CELL_APPOINTMENTS`, the hunt payoff THR-1560) | 🟢 ACTIVE | **extends**: one new row (`cell.observe.location`), gated to ruin and wonder sites by a new optional `siteClasses` field |
| Encounter aftermath effects (`spawn_clue` in `encounterAftermath.ts`) | 🟢 ACTIVE | **extends**: a sibling effect `sharpen_clue` that acts on the actor's own lead instead of minting one by Narrative Gravity |
| Seed-only encounters (THR-1526) | 🟢 ACTIVE | **uses**: both new templates are seed-only, never drawn from the board |

## Interface impact

Subsystems in `Docs/canon/interface-map.md`: Economy & Prosperity and Ruins & Delves. Contracts this plan touches:

| Contract | Disposition | Producer → reader |
|---|---|---|
| `trades_with.lastTraded` / `volume` → decay, prosperity, route events, map | **extend**: new producer | `phaseTradeRouteDecay` (traffic step) → existing readers unchanged |
| `trades_with.blockadedBy` + `threatened` → decay | **extend**: new reader | `blockadeRoute` → `phaseTradeRouteDecay` (suspend) |
| `knows_clue_of.precision` → delve admission, quest hooks, sheet line | **extend**: new producers | survey sharpen, `sharpen_clue` effect → existing readers unchanged |
| `knows_clue_of.pendingVisitDueTick` (new, optional) → clue decay | **add**: register in `scripts/interface-contracts.ts` | appointment payoff (S3) → `phaseClueDecay` |
| held lead → board survey candidates | **add**: register | `knows_clue_of` edge → `strategicActionCandidates` (`object` rule for `observe × location`) |
| located-lead holders → delve admission | **extend**: reader re-scoped | `knows_clue_of` → `phaseDelveAdmission` (scan from holders, not every actor × every location) |

## Engine pillar

### S1 — Lanes that carry

**Systems design.** Inside `phaseTradeRouteDecay`, before the staleness check, each lane is classed once per tick by a pure function `laneTraffic(graph, edge, tick): 'carrying' | 'suspended' | 'idle'`. The phase already walks every `trades_with` edge (12 at most on these seeds), so the extra work is a few property reads per lane.

| Class | When | Effect this tick |
|---|---|---|
| `carrying` | Both ends resolve (via `resolveToParentLocation`) to standing settlements: not razed, and still subtype hamlet or larger. Not blockaded. Neither end's routes cursed (`isLocationRoutesCursed`, today private to `phaseProsperity.ts:250`; export it rather than copy it). | `lastTraded = tick`, so the lane is never stale. On a settle tick, volume steps one toward its **traffic level** (below). |
| `suspended` | `blockadedBy` is set and `threatened` is still true. | `lastTraded = tick`, so it does not decay. On a settle tick, volume steps one toward 1. It is never dissolved while suspended. |
| `idle` | Anything else: an end razed, gone or demoted below a settlement; roads cursed. | Nothing. The existing rule decays and dissolves it, and sends the lost-lane shock (THR-1615). |

*Lane decision 1:* cargo never makes a lane `idle`. *Lane decision 3:* a blockade suspends and never kills. When `routeEvents` clears `threatened` after `ROUTE_THREATENED_CLEAR_TICKS` (24), the lane carries again, so a blockader who wants a lane gone must keep blockading or raze a town.

**Traffic level.** A lane's settle volume is `clamp(LANE_TRAFFIC_BASE_VOLUME + round(balance × LANE_TRAFFIC_CARGO_VOLUME) − (threatened ? LANE_TRAFFIC_THREATENED_PENALTY : 0), 1, LANE_TRAFFIC_MAX_VOLUME)`, where `balance` is the live `scoreRoutePairBalance` of its two ends. On today's seeds balance is 0, so lanes settle at 2. As stock tiers diverge, complementary pairs reach 4.

Traffic only ever steps volume toward the level, one per `LANE_TRAFFIC_SETTLE_INTERVAL_TICKS` (12, a day). Work by keepers and merchants (`change:raise`, `use`, the `action.gold.trade` and `loc.guide_caravan` verbs) still adds on top, up to `TRADE_ROUTE_MAX_VOLUME` (10), and a worked lane sinks back one step a day unless someone keeps working it. That keeps an owner's upkeep meaningful above the ambient floor.

**Founded lanes** go through the same rule. The founder's grace window (THR-1320) stays as written: it is now redundant for a carrying lane and harmless.

**Graph nodes / edges.** No new node or edge type. `trades_with` gains no required field. Its `volume`, `lastTraded`, `threatened` and `blockadedBy` are read and written as today.

**Tick phases.** No new phase. The traffic step runs inside `phaseTradeRouteDecay` (orchestrator 6.62).

**Resolution logic.** Deterministic, with no randomness. A settle tick is `tick % LANE_TRAFFIC_SETTLE_INTERVAL_TICKS === 0`.

**PRNG callouts.** None.

**Kill switch.** `LANE_TRAFFIC_ENABLED` (default `true`). `false` restores today's behaviour exactly, which is how the A/B census in the Done-when runs.

### S2 — A lead is a reason to look

1. **Leads lean toward deciders** (*Lane decision 5*). `scoreCandidate` in `clueLifecycle.ts` gains one factor, `(1 + (isAutonomousDecisionActor(node) ? CLUE_BIAS_DECIDER : 0))`, beside the bonded and faction-leader factors it already multiplies. Rumour pools are unchanged: whoever is in the settlement can still hear. The target is at least 30% of new leads held by deciders on each seed (today 15% · 5%). `CLUE_BIAS_DECIDER` is the lever if a seed falls short.
2. **A held lead joins the holder's survey candidates.** In the `object` target walk (`strategicActionCandidates.ts:619`), when the cell is `cell.observe.location`, the ruins of the actor's unconsumed leads are put **ahead of** the proximity cap, at most `CLUE_LEAD_SURVEY_CANDIDATES_MAX` of them (freshest first). This follows the THR-1560 note that a far, reasoned object needs the headroom. The survey candidate for a lead's ruin scores its desire term × `CLUE_LEAD_SURVEY_PULL_MULT`. A lead is also a reason **outside** any ambition's cell list: for a decider holding a lead, `cell.observe.location` is walked even when no active ambition lists it, and only for the lead's ruins. That is one extra candidate per lead, not the whole Location sweep.
3. **A survey sharpens instead of refusing.** When `maybeSpawnSiteClue` finds that the surveyor already holds an unconsumed lead on the site, it raises that edge's precision to the better of the current value and the band's row, and resets `discoveredTick` (the lead is fresh). It no longer returns `clue_already_held`. `spawnClue`'s own refusal stays for its other callers. Through the survey, a rumour (`vague`) becomes `narrowed`. `located` is left to the visit (S3), because a survey from afar is instant and always `success`.
4. **Delve admission scans from lead holders.** `phaseDelveAdmission` §2 walks `knows_clue_of` edges with `precision === 'located' && !consumed` instead of every actor × every location. For each holder it keeps the existing checks: on the ruin's hex, the ruin is delvable (elder, or a mature mortal ruin), no active or queued delve. The mature-mortal-ruin branch requires a located clue too, so the scan misses nothing. This is the per-tick saving [What liveness costs](https://linear.app/threadbare/issue/THR-1592) asked for, and it pays for S1 and S2 inside the budget line.

### S3 — The visit: the dice decide the lead

1. **The survey arranges a visit.** A new `UNDERTAKING_CELL_APPOINTMENTS` row for `cell.observe.location`, modelled on the hunt's row (`undertaking-cells.ts:253-263`):
   - `meeting: { kind: 'encounter_template', tags: ['#ruin_lead'] }`, `missed: { query: { kind: 'encounter_template', tags: ['#lead_gone_cold'] } }`
   - `delayTicks: CLUE_LEAD_VISIT_DELAY_TICKS`, `pullMult: CLUE_LEAD_VISIT_PULL_MULT`, `requirePlace: true`
   - **new optional field** `siteClasses: ['ruin', 'wonder']` on `UndertakingAppointmentPayoff`, so the visit is arranged only when the surveyed site is surveyable (`isSurveyableSite`). A survey of a town arranges nothing, exactly as today.
   - The visit is arranged whenever the survey left the surveyor holding a `narrowed` lead on the site. The planter, `maybePlantAppointmentPayoff` (`strategicActionLifecycle.ts:2272`), is unconditional on outcome today. The condition reads the survey's op results through its existing `ops` parameter, plus `siteClasses` against the site.
2. **A pending visit pauses lead decay.** The payoff stamps `pendingVisitDueTick` on the holder's lead edge. `phaseClueDecay` skips a lead while `tick <= pendingVisitDueTick + CLUE_LEAD_VISIT_GRACE_TICKS`, so a 48-tick journey does not outlive a 40-tick lead. The visit's resolution clears the stamp either way.
3. **The visit's band sets the lead.** The kept template carries a new aftermath effect, `sharpen_clue`, sibling to `spawn_clue`. It acts on the actor's own unconsumed lead on the encounter's site (the appointment's `resolutionLocationId`), never by Narrative Gravity. The band maps through `CLUE_VISIT_PRECISION_BY_BAND`:

   | Band | Lead becomes |
   |---|---|
   | `critical_success`, `success` | `located` |
   | `success_at_cost`, `near_miss` | `narrowed`, refreshed (they can try again later) |
   | `failure`, `critical_failure` | **cold**: the edge is consumed |

   The missed template marks the lead cold the same way. The mortal who kept the visit is standing on the ruin's hex, so a `located` lead is admitted by the next tick's delve scan. The chain runs **hear → survey → visit → delve**, and every step is state the player can see.

**PRNG callouts (S2, S3).** None new. The recipient draw already runs on the rumour sweep's seeded `rng`. Bands come from the encounter resolution's own seeded dice.

## Content pillar

Two **seed-only** encounter templates (THR-1526: never on the board, reached only through the appointment), in `src/data/encounters/ruin-lead-visit.ts` and `ruin-lead-cold.ts`:

- **`ruins.lead.visit`**, tag `#ruin_lead`, `locationSubtypes` covering the ruin and wonder subtypes the elder-ruin and mortal-ruin census uses. The executor reads the list from `locationClassOf` rather than typing it. Two steps: *read the ground* (`eye`) and *find the way in* (`stone` or `shadow`). Outcome ladder authored across all six bands, with at-cost prose. Each band ending carries the `sharpen_clue` effect and a chip anchored on **the ruin** (Law 56: a Location anchor that exists, named by name). The ruin's past (THR-1631's `worldPast` lines: empire, kind, founding) is available to the opening through the existing enrichment placeholders. No new placeholder.
- **`ruins.lead.cold`**, tag `#lead_gone_cold`, placeless-tolerant like the hunt's cold-trail template (`hunt-trail-cold.ts`): the mortal never went, and the lead goes cold. One step, a short ladder, one chip anchored on the ruin.

**Authoring route.** They run on the Encounter Factory line (`encounter-pipeline`: brief → draft → critic → machine gates → live proof), and each has a `?spawn=` review link. They join the next factory batch report for Christian's sample, the map's rule for new templates. The build does not wait for that sample: rule 5 means no review ask is made until the chain is level (S1–S3 shipped).

**No other content.** Lane traffic is state and writes no prose. The existing dissolution chronicle line (`resolveEconomicChronicle`) and the three route-event encounters already carry lanes into the story, and more lane life gives them more to fire on. Whether route-event templates need at-cost prose is for [finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634) to rank, not this plan.

## UI pillar

*Screenshot tool: Playwright for the hex tooltip (DOM) and the agent sheet; Playwright's WebGL capture for the lane line (it renders WebGL, `reference_browser_mcp_from_cc_debug`).*

- **The map.** No change. `TradeRouteMesh` already widens a line with volume, so a lane that settles at 2–4 reads busier than a founding trickle and stays drawn past t36.
- **The hex tooltip.** `RouteTooltipEntry` gains `traffic: 'carrying' | 'suspended' | 'idle'`, and `HexTooltip` appends ` ·blockaded` for `suspended` and ` ·fading` for `idle`, beside the existing ` ·threatened`. They are words, not numbers (Laws 13, 14, 42). The existing route line has no concept tooltips, so the new words add none. That gap belongs to Law 17's sweep and is not widened here.
- **The agent sheet.** No change. `agentDetail.ts:1006` already prints a lead by precision (*"knows where it lies"*), so sharpening shows up there for free.
- **The visit.** An ordinary encounter at the attended tier through `?forceencounters`, or directly via `?spawn=ruins.lead.visit`. Its chips anchor on the ruin (Law 56 clause two).
- **Debug.** `window.__DEBUG` needs no new method. The traces below are readable through `getTraces`. The executor adds the `laneTraffic` class to the existing trade-route block of the debug tab (`DebugTabContent.tsx`), next to volume.

UI Laws engaged: 13, 14, 17 (noted gap), 42, 56. The encounter screens' laws (1, 21, 33, 37) apply to the two templates as to any encounter.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `laneTraffic` + traffic step (`phaseTradeRouteDecay`) | 6.62 Trade Route Decay | `HexTooltip` via `tradeRouteMarkers` | none (edge props) | `trade_route_upkeep` (aggregate), `trade_route_volume_change` cause `traffic` | debug tab trade block; `getTraces` |
| Decider weight (`clueLifecycle.scoreCandidate`) | `clue_rumors` (registry) | sheet lead line | none | `ruins.clue_receiver_selected` gains `deciderBonus` in its breakdown | `getTraces` |
| Lead survey candidates (`strategicActionCandidates`) | strategic decision (existing) | none | none | `strategic_action_started` (existing) | `getTraces` |
| Survey sharpen (`maybeSpawnSiteClue`) | undertaking completion (existing) | sheet lead line | none | `undertaking_reader` (existing, new `productId` on sharpen), `ruins.clue_sharpened` | `getTraces` |
| Visit appointment (`UNDERTAKING_CELL_APPOINTMENTS` row) | encounter seeding (existing) | encounter veil | `pendingEncounterSeeds` (existing) | appointment traces (existing) | `getTraces` |
| `sharpen_clue` aftermath effect | aftermath (existing) | ending chips | none | `encounter_aftermath_effect` (existing), `ruins.clue_sharpened` | `getTraces` |
| Admission from holders (`phaseDelveAdmission`) | `delve_admission` (registry) | delve beats (existing) | `activeDelves` (existing) | `ruins.delve_admitted` (existing) | `getTraces` |

> See checklist: Docs/plans/wiring-checklist.md

Wiring checklist rows: none new. Every module above is already called from its phase, and the two templates are reached through the appointment. `Docs/plans/2026-04-16-systemic-wiring-guide.md` gains the `sharpen_clue` effect and the `siteClasses` appointment field (content-facing capabilities). The interface-map rows above are updated in the slice that ships each one.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `LANE_TRAFFIC_ENABLED` | `true` | Kill switch; `false` is today's behaviour exactly |
| `LANE_TRAFFIC_BASE_VOLUME` | `2` | Volume a standing lane settles at with nothing complementary to carry |
| `LANE_TRAFFIC_CARGO_VOLUME` | `2` | Extra settle volume at full pair balance (1.0) |
| `LANE_TRAFFIC_MAX_VOLUME` | `4` | Ceiling of ambient traffic. Anything above is someone's work |
| `LANE_TRAFFIC_THREATENED_PENALTY` | `1` | Settle volume lost while a lane is threatened (ambush) |
| `LANE_TRAFFIC_SETTLE_INTERVAL_TICKS` | `12` | One day: how often volume steps one toward its level |
| `CLUE_BIAS_DECIDER` | `4.0` | Recipient weight for a deciding mortal: a `(1 + bias)` factor, so ×5 (`CLUE_BIAS_BONDED_AGENT` 5.0 is ×6) |
| `CLUE_LEAD_SURVEY_CANDIDATES_MAX` | `2` | Lead ruins a holder may walk as survey candidates, freshest first |
| `CLUE_LEAD_SURVEY_PULL_MULT` | `1.5` | Desire multiplier on a survey of one's own lead's ruin (mirrors `ARRIVAL_GOAL_COMMITMENT_MULTIPLIER`) |
| `CLUE_LEAD_VISIT_DELAY_TICKS` | `48` | When the visit falls due (mirrors `HUNT_APPOINTMENT_DELAY_TICKS`: ruins, like dens, can be far) |
| `CLUE_LEAD_VISIT_PULL_MULT` | `1.0` | The visit's travel pull (mirrors `HUNT_APPOINTMENT_PULL_MULT`) |
| `CLUE_LEAD_VISIT_GRACE_TICKS` | `12` | How long past its due tick a lead with a pending visit is spared decay |
| `CLUE_VISIT_PRECISION_BY_BAND` | table above | What the visit's band makes of the lead |

A test asserts `CLUE_LEAD_VISIT_DELAY_TICKS + CLUE_LEAD_VISIT_GRACE_TICKS` is at least the narrowed lead's life, so the constants cannot be tuned into a lead that always dies on the road.

## Tracing

```ts
// One per settle tick: the whole trade web at a glance (never one per lane per tick).
interface TradeRouteUpkeepTrace {
  category: 'trade_route_upkeep';
  tick: number;
  carrying: number;
  suspended: number;
  idle: number;
  /** Lanes whose volume stepped this settle tick, by direction. */
  steppedUp: number;
  steppedDown: number;
  summary: string;
}

// `trade_route_volume_change` gains the cause value 'traffic' (additive to the union).

// A lead changed precision: by survey, by visit, or went cold.
interface ClueSharpenedTrace {
  category: 'ruins.clue_sharpened';
  tick: number;
  knowerId: string;
  targetRuinId: string;
  from: CluePrecision;
  to: CluePrecision | 'cold';
  via: 'survey' | 'visit' | 'missed_visit';
  band?: StepOutcome;
  summary: string;
}
```

`ruins.clue_receiver_selected`'s score breakdown gains `deciderBonus: number` (additive).

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A lane end is missing or does not resolve to a Location | `idle`: the existing decay path handles it (it already skips missing endpoints) |
| `scoreRoutePairBalance` throws on odd resource data | Balance reads 0, and the lane settles at the base volume |
| `blockadedBy` set but `threatened` already cleared | Not suspended: the lane carries (the blockade is over) |
| A lead's ruin is gone when the survey candidate is built | The candidate is skipped. The lead is left for decay |
| Survey completes but the lead was consumed meanwhile | Normal survey path: a fresh clue at the band's row |
| Visit seed resolves with no `#ruin_lead` member at the site | The seed withers (existing seed fail-soft), `pendingVisitDueTick` lapses, and the lead decays normally |
| `sharpen_clue` finds no lead on the site | No-op with `success: false, failReason: 'no_lead'` on the aftermath trace |
| The holder is not on the ruin's hex after a `located` visit | No admission. The lead stands for its 80-tick life, and the holder's next arrival admits |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/trace.ts` | 146 (codesight, 2026-09-28) | Additive only: one new category and one new cause value. No existing shape changes |
| `src/types/strategicAction.ts` | 112 (codesight) | Additive only: optional `siteClasses` on `UndertakingAppointmentPayoff` |
| `src/data/strategic-action-constants.ts` | ~109 (grep) | New constants only. `OBSERVE_CLUE_PRECISION_BY_BAND` and `INSTANT_COMPLETION_BAND` are untouched |

## Slices

| Slice | Delivers | Measured by |
|---|---|---|
| **S1: Lanes that carry** | Traffic step, suspend, settle volume, tooltip word, `trade_route_upkeep` | `readers/upkeep.ts` A/B with `LANE_TRAFFIC_ENABLED` off/on |
| **S2: A lead is a reason to look** | Decider weight, lead survey candidates, survey sharpen, admission from holders | Same reader: decider share of leads, surveys hitting a ruin, `narrowed` leads |
| **S3: The visit** | Appointment row + `siteClasses`, decay pause, `sharpen_clue`, the two templates | Same reader: `located` leads, delves admitted; `?spawn=` review links |

S1 is independent of S2 and S3. S3 needs S2 (a survey must reach a ruin before it can arrange a visit).

## Kill criteria

- **S1:** if the A/B census shows lanes standing at t300 beyond seeded + founded, or a prosperity runaway on lane-dense capitals, lower `LANE_TRAFFIC_MAX_VOLUME` first. If that fails, ship with `LANE_TRAFFIC_ENABLED = false` and reopen the design on the ticket.
- **S2:** if the decider share of leads stays under 30% after tuning `CLUE_BIAS_DECIDER`, or the budget line breaks, stop before S3 and re-plan (the next lever is lead hand-off).
- **S3:** if no seed produces a `located` lead and a delve in 300 ticks after tuning `CLUE_LEAD_VISIT_PULL_MULT`, report the starving rung and re-plan. Never widen the dice to force it.

## Three-pillar check

- [x] Engine pillar present (S1–S3)
- [x] Content pillar present (two seed-only templates; lane prose N/A with reason)
- [x] UI pillar present (tooltip words; existing map, sheet and encounter surfaces)
- [x] Wiring section connects them

## Vision audit

- [x] The plan does not contradict any Vision premise. It serves *systemic over scripted*: lanes live and die by the state of their towns, not a timer, and a ruin's secret is earned by a mortal's own dice, which the god can nudge like any other roll.
- [x] No Vision edit needed.

## Rulebook impact

- [ ] This plan does not change a rule of play: **not ticked.** It changes two: trade lanes no longer expire on a timer, and a delve gains a reachable entry (hear → survey → visit).
- [x] The rulebook update is in scope. §10 *The World at Work* of `Docs/canon/rulebook.md` is updated in S1 (lanes) and S3 (the climb), each in its own slice’s PR, because it must describe shipped behaviour. S3 also corrects the **Watching earns something** paragraph, which says today that an exceptional survey can lead to a delve. That has been unreachable in practice, because a survey is instant and never rolls `critical_success`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Thirteen named constants plus a kill switch. The visit ladder is a data table |
| 2. Inspectability | PASS | One aggregate lane trace per day. Every precision change traced with its cause and band. The recipient breakdown shows the decider weight |
| 3. Determinism | PASS | Traffic is deterministic. Clue draws and bands keep their existing seeded streams. The lead candidate order is freshest-first, ties broken by edge id |
| 4. Fail-soft | PASS | See the fail-soft table. Every new branch degrades to today's behaviour |
| 5. Narrative over mechanical perfection | PASS with note | A lane dies for a reason the player can see (a town razed, roads cursed), never on a timer. The climb is one mortal's story with a visible ending at the ruin. Note: ambient traffic is an abstraction (no caravans walk), chosen for NFP #7, as route events already do |
| 6. Additive over destructive | PASS | New fields optional. `spawnClue`'s refusal stays for its other callers. The founder's grace stays. The kill switch restores today exactly |
| 7. Performance budget | PASS with note | The traffic step is O(lanes) (≤ 12 here). The admission rewrite removes the biggest per-mortal scanner THR-1592 found, so the net is expected to be negative. Verified by the THR-1592 harness in the Done-when, not assumed |

## Done when

- [ ] **S1:** `readers/upkeep.ts` 42,99 300 with `LANE_TRAFFIC_ENABLED` on shows every worldgen lane standing at t300 unless a traced cause (razed end, cursed roads) killed it, and a same-run arm with it off reproduces today's t36 deaths. Lanes standing at t300 ≤ lanes seeded + lanes founded. The seed 42 settlement prosperity delta (on vs off) at t300 is reported in the PR.
- [ ] **S1:** a route-event trace (`route_event_scan` with `seedsPlanted > 0`) appears after t36 on at least one seed.
- [ ] **S2:** the decider share of newly minted leads is ≥ 30% on each seed (today 15% · 5%). At least one `cell.observe.location` survey targets a ruin on each seed. `narrowed` leads appear.
- [ ] **S3:** at least one `located` lead and one `ruins.delve_admitted` on each seed in 300 ticks. If a seed shows none, the PR reports which rung starved (survey, visit kept or missed, band) from the traces. Both templates open from `?view=game&seeded&size=medium&spawn=ruins.lead.visit` and `…spawn=ruins.lead.cold`, and `?outcome=` shows every band.
- [ ] **Budget (S1 and S2 PRs):** the THR-1592 harness (`readers/liveness-cost.ts`), baseline vs change, medium, seeds 42 and 99, median of ≥ 3 interleaved runs: steady-state (t21–200) within +10%, and deciders at t200 within +10%.
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy` (engine files touched), and a 30-tick CLI smoke pass. Browser-verify four-part evidence for the tooltip (S1) and the visit encounter (S3).
- [ ] The rulebook `[IMPL]` lines, systemic wiring guide, interface-map rows and the Design Reference Wiki pages whose `sources` globs match are updated in the slice that changes them.

## Coordination block

**Suggested model:** opus. Three engine seams (economy, ruins, undertakings) plus encounter authoring on the factory line.

**Parallel-safe with:** [one notable in every settlement](https://linear.app/threadbare/issue/THR-1654) (worldgen and agendas; no shared files). [The player meets the past](https://linear.app/threadbare/issue/THR-1656) (chronicle and sheet lines; S3's templates only *read* the past through existing placeholders). [The opening](https://linear.app/threadbare/issue/THR-1648) slices (UI shell).

**Mutex with:** [guild joining (THR-1640)](https://linear.app/threadbare/issue/THR-1640) because both edit `strategicActionCandidates.ts` (S2's lead candidates, THR-1640's hall candidates), so land sequentially. [Faith and politics (THR-1632)](https://linear.app/threadbare/issue/THR-1632) because both may edit `phaseTradeRouteDecay.ts`/route seeding if its pilgrim-route slice touches `trades_with` readers; verify at claim and reverse if its diff does not touch them.

**Files to touch:**
- Edit: `src/engine/phaseTradeRouteDecay.ts` (traffic step, suspend), `src/engine/tradeRoute.ts` (constants, `laneTraffic`), `src/engine/phaseProsperity.ts` (export `isLocationRoutesCursed`), `src/engine/tradeRouteMarkers.ts`, `src/components/HexMapV2/interaction/HexTooltip.tsx`, `src/components/Game/debug/DebugTabContent.tsx` (S1)
- Edit: `src/engine/ruins/clueLifecycle.ts`, `src/engine/ruins/constants.ts`, `src/engine/strategicActionCandidates.ts`, `src/data/undertaking-objects.ts` (`maybeSpawnSiteClue`), `src/engine/ruins/delveVariant.ts` (S2)
- Edit: `src/data/undertaking-cells.ts`, `src/types/strategicAction.ts`, `src/engine/strategicActionLifecycle.ts` (the planter's condition), `src/engine/encounterSeeding.ts` (`siteClasses`), `src/engine/encounterAftermath.ts` (`sharpen_clue`), `src/types/trace.ts`; create `src/data/encounters/ruin-lead-visit.ts`, `src/data/encounters/ruin-lead-cold.ts` (S3)
- Commit: `Docs/audits/2026-09-25-living-world-data/readers/upkeep.ts` already lands with this plan

## Notes for the executor

- **Do not make cargo the life rule.** Measured: seeded manifests are mostly empty at t12. A cargo-gated lane dies on day one, which is today's defect with a different timer.
- **Do not change `INSTANT_COMPLETION_BAND` or `OBSERVE_CLUE_PRECISION_BY_BAND`** to reach `located` from a survey. THR-1450 pinned that convention across five readers. The visit is where the dice live.
- **Do not turn on `requiresLocation` for survey cells.** THR-1294 owns that switch. The appointment brings the mortal to the ruin without it.
- **The admission rewrite must admit exactly what the old scan admitted** on a fixture world with a located holder at an elder ruin and at a mature mortal ruin. Pin that with a test before deleting the old loop.
- `spawn_clue`'s Narrative Gravity path stays as it is. `sharpen_clue` acts only on the actor's own lead.
- The reader's `founded_with_cargo` count (3 · 4) is the worldgen lanes that had cargo at t0, not mortal foundings. `createTradeRoute` emits `route_cargo_assigned` for every lane with goods. Count mortal foundings from `establishedBy !== 'worldgen'`.
- **Terminology:** "lead", its three rungs and "delve" have no UL entry yet. That gap predates this plan and is filed as [THR-1662](https://linear.app/threadbare/issue/THR-1662). Use "lead" on player surfaces and "clue" in code and traces.

## Intent-judge verdict

**Allow** (fable, cold context, 2026-09-28). No gap on intent fidelity, no violation. Every cited file:line was re-verified against the source, and every measured figure reproduced from the two output JSONs. The one GAP (dimension 6): "lead", "clue" and "delve" have no UL entry. That is filed as [THR-1662](https://linear.app/threadbare/issue/THR-1662). Its recommended inline corrections were applied before the audit: the bonded-weight ratio (×6, not ×5), importer counts, the planter's condition hook in S3.1, and a Kill criteria section. The judge found none of the five lane decisions to be an un-agreed fork: THR-1595 handed all five calls to the design lane, and the map reserves nothing for Christian.

## Forked-audit verdicts

### NFP audit

**PASS-with-notes.** Tunability, inspectability, determinism, fail-soft and additive all PASS: 13 named constants plus a kill switch, one aggregate lane trace per day, no new PRNG, an 8-row fail-soft table, optional fields only. Notes: NFP 5, ambient traffic is an abstraction (the route-events precedent, stated in the plan). NFP 7, the net-negative cost is expected rather than proven, and is verified by the THR-1592 harness in the Done-when.

### Three-pillar audit

**PASS-with-notes.** Engine present and substantive (three slices, substrate inventory with eight 🟢 ACTIVE subsystems, all extends/activates/uses, no green-field duplication). Content present and substantive (two seed-only templates; lane prose N/A with a reason). UI **present but thin**, justified: the map and sheet already render the new state, and the net-new UI is the tooltip words and the debug label. No missing required sections. Wiring maps every module.

### Vision audit

**PASS.** No contradictions. The north star is confirmed (the visit's dice decide, the god acts upstream). The core loop is extended (the visit arrives through the ordinary appointment → encounter → aftermath path). Non-negotiables confirmed: god, not protagonist; graph-only extensions. The systemic-versus-authored tension is balanced, with a systemic lane rule and two authored ruin encounters. The taste profile holds: words, not numbers, on the tooltip.
