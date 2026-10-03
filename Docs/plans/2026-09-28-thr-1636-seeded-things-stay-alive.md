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
6. **After S2: the decider share is reported, not gated** (§ Re-plan after S2, added 2026-09-29). The 30% target was a stand-in for "a decider surveys the ruin they hold a lead on", which S2 achieved. Lead hand-off waits for evidence that S3 starves.
7. **After S3: a survey of a ruin you hold a lead on is not a dice challenge, so the forecast window does not judge it; and a mortal waiting at an appointment does not wander off on a trip it cannot return from** (§ Re-plan after S3, added 2026-10-01). Lead hand-off is still not needed: every seed arranges at least 3 visits once the survey can win.

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
   - **One pending visit per holder per ruin** (added 2026-09-29, § Re-plan after S2). If the surveyor's lead on the site already carries `pendingVisitDueTick`, the planter plants nothing. The survey still refreshes the lead. Without this, the tick-keyed seed id would plant a duplicate visit on every repeat survey. A test pins it.
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
| `CLUE_LEAD_SURVEY_PULL_MULT` | `2.5` (drafted 1.5; raised by THR-1663's executor, `ruins/constants.ts:63-66`) | Desire multiplier on a survey of one's own lead's ruin (mirrors `ARRIVAL_GOAL_COMMITMENT_MULTIPLIER`) |
| `CLUE_LEAD_VISIT_DELAY_TICKS` | `48` | When the visit falls due (mirrors `HUNT_APPOINTMENT_DELAY_TICKS`: ruins, like dens, can be far) |
| `CLUE_LEAD_VISIT_PULL_MULT` | `1.0` | The visit's travel pull (mirrors `HUNT_APPOINTMENT_PULL_MULT`) |
| `CLUE_LEAD_VISIT_GRACE_TICKS` | `12` | How long past its due tick a lead with a pending visit is spared decay |
| `CLUE_VISIT_PRECISION_BY_BAND` | table above | What the visit's band makes of the lead |
| `CLUE_LEAD_SURVEY_SKIPS_WINDOW` | `true` | Re-plan after S3, part 1: an instant survey of a held lead takes forecast 1 and fit 1 on the board (zone `'certain'`). `false` restores the window |
| `APPOINTMENT_WAITING_HOLD_ENABLED` | `true` | Re-plan after S3, part 2: in `waiting`, non-local candidates that overrun the time to the due tick are dropped. `false` restores today |
| `APPOINTMENT_DISCOUNT_ON_BOARD` | `true` | Re-plan after S3, part 3: the `leaning` discount reaches the live board. `false` restores today |
| `APPOINTMENT_OVERRUN_DISCOUNT` | `0.25` (existing) | Re-plan after S3, part 3: now also reaches the live board through `appointmentDiscount`. Its value is unchanged |

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
- **S2:** ~~if the decider share of leads stays under 30% after tuning `CLUE_BIAS_DECIDER`, or the budget line breaks, stop before S3 and re-plan (the next lever is lead hand-off).~~ **Fired and re-planned 2026-09-29, see § Re-plan after S2.** The criterion now reads: if a seed has no survey that leaves a lead holder with a `narrowed` lead on a ruin in 300 ticks, or the budget line breaks, stop before S3 and re-plan.
- **S3:** ~~if no seed produces a `located` lead and a delve in 300 ticks after tuning `CLUE_LEAD_VISIT_PULL_MULT`, report the starving rung and re-plan.~~ **Fired and re-planned 2026-10-01, see § Re-plan after S3.** Never widen the dice to force it. If the rung that starves is the supply of visits (fewer than 2 visits arranged on a seed), the next lever is lead hand-off (§ Re-plan after S2), not a bigger decider weight.
- **S3 follow-up ([the lead survey and the kept visit](#re-plan-after-s3-2026-10-01-thr-1684)):** if, after it ships, fewer than a third of the visits that resolve in the four-seed census are kept, the next rung to re-plan is the walk to the place (the `far → leaning → departing → lost` path), not the dice and not the window. If any seed arranges fewer than 2 visits, lead hand-off comes forward.

## Re-plan after S2 (2026-09-29, THR-1675)

*Lane decision 6, design lane run 2026-09-29c, under delegation (process.md rule 4). Veto in chat.*

**What fired.** S2 shipped (PR #2140). Two of its three measurements passed. The third, the decider share of new leads, reached 13% and 14% against a 30% target. The executor then set `CLUE_BIAS_DECIDER` to 50 as a diagnostic. At that weight a decider wins every rumour draw they take part in, and the share still topped out at 27% (8/30) and 23% (9/39). About 20 deciders live among 550–750 individuals, so only about a quarter of rumour pools contain one. The weight is saturated. The pool is the limit.

**Decision: re-baseline (option c), and unblock S3 now.** The 30% share was a stand-in for the thing S3 actually needs: a mortal who can act, holding a lead, surveying the ruin. That now happens. Measured from `output/upkeep-2026-09-29-thr1663.json` (seeds 42 · 99, 300 ticks):

| | seed 42 | seed 99 |
|---|---|---|
| Ruin surveys, by band | 6, all `success` | 3, all `success` |
| Survey writes at `narrowed` (`undertaking_survey:narrowed`; the sharpen path emits the same trace) | 6 = 1 fresh + 2 `vague→narrowed` + 3 `narrowed→narrowed` | 3 = 1 + 1 + 1 |
| Distinct surveyor–ruin pairs that first reached `narrowed` | **3** | **2** |
| Rumour-sourced leads held by deciders (`clueHolderTier`, rumour/library/spy only; survey leads are decider-held by construction) | 4 of 32 (13%) | 5 of 36 (14%) |

Survey `success` writes `narrowed` (`OBSERVE_CLUE_PRECISION_BY_BAND`, `strategic-action-constants.ts:1442-1446`). Only deciders survey (`phaseAgentDecision.ts` gates undertakings on `isAutonomousDecisionActor`). S3's visit is arranged whenever a survey leaves its surveyor holding a `narrowed` lead on a ruin (§ S3.1). So on these seeds S3 would arrange **3 and 2 distinct visits** in 300 ticks before S3 adds any pull of its own. The repeat surveys (`narrowed→narrowed`, 3 · 1) are deciders going back to a ruin they already hold a lead on. That is the climb stalling at the rung S3 exists to lift. Seed 99's supply is thin: it sits exactly at the S3 kill line below. That is why lead hand-off is named and specified here rather than dropped.

**One S3 refinement this makes necessary.** The planter's seed id is keyed by tick (`strategicActionLifecycle.ts:2283`). As S3.1 is written, a repeat survey would plant a second visit for the same holder and ruin. The hunt avoids this with a hunt-specific refusal (`monsters/hunts.ts`), which the survey row does not inherit. **S3.1 therefore adds: a survey whose surveyor already has a pending visit to that ruin (`pendingVisitDueTick` set on the lead) plants nothing new.** It only refreshes the lead, as the sharpen already does. One pending visit per holder per ruin.

**Why not the other two options now.**

- **(a) Lead hand-off**, where an ambient holder passes a lead to a decider they share a settlement or a tie with. It is a new mechanism with its own budget cost, and it feeds a rung that is not starving. It stays the named next lever. It is built only if S3's census shows the visit supply starving (fewer than 2 visits arranged on a seed; see § Kill criteria, S3).
- **(b) A wider rumour pool for deciders**, where a decider within N hexes can overhear. It breaks the settlement-scoped rumour model the rest of the ruins system reads. It also adds a hex scan to every rumour sweep (`CLUE_RUMOR_INTERVAL_TICKS`, every 10 ticks), in the ruins system whose cost THR-1592 is trying to slim down. Rejected.

**What this does not change.** `CLUE_BIAS_DECIDER` stays at 4.0 as shipped. Most rumours still land on ordinary folk and fade. That is the world working as written: gossip is common, and a mortal who acts on it is rare. No constant or template changes. The only S3 change is the one-pending-visit rule above, which is also written into § S3.1.

**Would change the call.** An S3 census showing fewer than 2 visits arranged on a seed, or Christian saying leads should mostly reach the people who can use them. Either brings lead hand-off forward.

## Re-plan after S3 (2026-10-01, THR-1684)

*Lane decision 7, design lane run 2026-10-01a, under delegation (process.md rule 4). Veto in chat.*

**What fired.** S3 shipped the visit (THR-1664, PR #2151). Its census then showed two starving rungs. Re-measured on main `218cdfa7` with `readers/upkeep.ts`, seeds 42 · 99 · 4, 300 ticks: **0 · 0 · 1 ruin surveys**, while deciders held **7 · 3 · 7** leads. On seed 4 the one visit was arranged and missed. Across seeds 1–8, 42 and 99, the ruin visit was kept 2 times and missed 5, and 9 of all 19 missed appointments of every kind had stood at the place and then left.

### Rung 2: the survey loses to the forecast window, not to a gate

A replay of `generateStrategicCandidates` on every decision a lead-holding decider made (seeds 42 · 99) found the following. *Provenance: a throwaway reader (`leadsurvey.ts`) run on main `218cdfa7`; its raw output is uncommitted scratch, and the board ranks and scores come from the real `decision_board_comparison` traces of that run.*

| | seed 42 | seed 99 |
|---|---|---|
| Decisions while holding a lead | 63 | 30 |
| The lead survey was a candidate | 61 (2 hit `active_cap`) | 30 |
| It reached the board's top five | 12 (rank 3–4) | 6 |
| It won | **0** | **0** |

So nothing gates it out: leads live about 40 ticks, and holders decide 8–11 times in that span. It loses on the board's score. That score is `evt × desire × temperament × variety × engagement.fit` (`decisionBoard.ts:630`), and `engagement.fit` comes from the forecast window (`computeEngagementFit`, `:579`). The window treats the survey's checkpoint advance probability (difficulty 0.35, so about the holder's proficiency in the Reach) as the odds of a challenge:

```
42: ind_4 adv=0.89 zone=above fit=0.10 | born_lc_2 adv=0.42 below fit=0.75 | ind_11 adv=0.23 zone=refused fit=0.00
99: ind_1 adv=0.75 zone=above fit=0.10 | ind_3 adv=0.22 refused fit=0.00
```

On main no lead holder lands between 0.43 and 0.67, so the survey scores 0.05–0.11 against a median winner of 0.44. At `4eb75754`, before PR #2143, all five survey wins went to two holders whose forecast happened to sit inside the window (0.52–0.65). PR #2143 did not touch the survey: it set the local scale offset to 0, which pulled more encounters into the window (in-window encounter winners on seed 42 went from 11 of 62 to 31 of 63) and moved the leads to other holders. The survey only ever won by lottery.

**But a survey has no dice.** `observe` is an instant cell (`UNDERTAKING_VERB_DURATION` `[0,0,0]`). It has no checkpoint and always completes at `INSTANT_COMPLETION_BAND` (`strategic-action-constants.ts:1434`; the instant arm at `strategicActionLifecycle.ts:531`). The board forecasts a roll that never happens. The visit is where the climb's dice live (§ S3), and the visit's dice stay exactly as they are.

**Decision, part 1: a survey of a ruin you hold a lead on skips the forecast window.** On the board, a strategic candidate that is `executionMode: 'instant'` **and** carries `leadPull` (only the lead survey does today) takes `advanceProbability = 1` for its EVT and `fit = 1`, with a new zone value `'certain'` on its entry so the trace says why. Every other term (desire with the 2.5 lead pull, temperament, variety, the active cap) still decides whether it wins. This follows two existing exemptions: quests skip the too-easy side of the window (`exemptTooEasy`, `encounterScoring.ts:1494`), and forced arrivals bypass it entirely (`engagement.bypass`). Kill switch: `CLUE_LEAD_SURVEY_SKIPS_WINDOW` (default `true`).

**Why only the lead survey, not every instant cell.** Measured, the same exemption for every instant cell turns the window off as the only brake on instant work: `observe` undertakings went from 17 · 73 · 44 · 75 on main to **378 · 481 · 602 · 662** per 300 ticks (seeds 42 · 99 · 4 · 8), which is +560% to +2120%. That would be a world of surveyors. Whether instant work should be forecast at all belongs with the forecast-window design ([the forecast window](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md)). It is recorded here as an observation, not decided. A held lead is different. It is the "reason to look" that § S2 names, the same standing as an arrival goal.

**What this does not do.** It does not touch the dice, scale any difficulty to the actor, or restore any floor (the THR-1575 ruling). It does not raise `CLUE_LEAD_SURVEY_PULL_MULT`. At 5, 10 and 25 that would win 3, 10 and 22 of seed 42's 42 non-zero rows, and nothing for holders the window refuses (fit 0, 21 of 63 decisions on seed 42 and 22 of 30 on seed 99).

### Rung 3: a waiting mortal takes a far trip off the board

Seed 8's ruin visit (Nael, Temple Ruin, due 243, window 12), traced. *Provenance: a throwaway reader (`appt-hold.ts`) run on main `218cdfa7` over seeds 1–8, 42 and 99; its raw output is uncommitted scratch. The committed artifact for this re-plan is the four-arm census JSON below.*

```
238 movement | Nael arrives at Temple Ruin
239 appointment_regime | Nael is waiting on the meeting at Temple Ruin — slack 4.0, margin 14.3
239 engagement_decision | ind_4 took encounter.confront_the_unknown at forecast 0.58 (in, fit 1.00)
239 movement | Nael departs for Greyborough (5 hops, encounter: encounter.confront_the_unknown)
256 appointment_missed (absent)
```

The regime block in `phaseAgentDecision.ts:1059` runs only for `leaning` and `departing`. In `waiting` nothing filters the candidates, and the live board picks a five-hop trip with four ticks of slack. The same shape missed a hunt on seed 1 (`forage_provisions`, 5 hops) and an agreement on seed 99 (`offer_small_prayer`, 3 hops). Nothing else moved a waiting mortal: no idle drift, flight, summons or undertaking. It also explains the uncommitted experiment the ticket describes. The board scores `valuePerTick × desire × forecastFit × arrivalCommitment` (`decisionBoard.ts:559`) and never reads `finalScore`, so a pull added to `finalScore` cannot change the winner. That also makes **`leaning`'s overrun discount (`APPOINTMENT_OVERRUN_DISCOUNT`, 0.25) dead under the live board**: it scales `finalScore` only.

**Decision, part 2: hold the waiting mortal.** In `waiting`, drop every candidate that is not on the mortal's own hex (`hexDistanceToEntry > 0`) and would overrun the time left (`dueTick − tick`), using the same `overruns` predicate `departing` uses. Local work stays open, and so does a far trip the mortal can be back from, so a mortal planted 130 ticks early (the full-moon collection) is not pinned. Hunts' confront uses the same regime and gets the same hold, which is intended: the seed-1 hunt would have been kept. Kill switch: `APPOINTMENT_WAITING_HOLD_ENABLED` (default `true`).

**Decision, part 3: make `leaning`'s discount reach the board.** `ScoredCandidate` gains an optional `appointmentDiscount`, which the regime block sets instead of (as well as) scaling `finalScore`, and `scoreUnifiedBoard` multiplies it into the encounter entry's score beside `arrivalCommitment`. This is a defect in the shipped appointment design (THR-1479): a named constant that does nothing. It is not a new rule. It was not measured in this re-plan, so the build reports its effect separately (Done-when). Kill switch: `APPOINTMENT_DISCOUNT_ON_BOARD` (default `true`); `false` restores today's board exactly.

### Measured with an uncommitted patch (reverted)

Parts 1 and 2 were prototyped as a local patch, run, and reverted; nothing reached `main`. Medium, 300 ticks, `readers/upkeep.ts` plus engagement, undertaking and appointment counters. Output: `output/upkeep-2026-10-01-thr1684-arms.json`. Seeds 42 · 99 · 4 · 8:

| Arm | Ruin surveys | Visits arranged | Visits kept / missed | `located` · delve admitted | Encounter engagements | `observe` undertakings |
|---|---|---|---|---|---|---|
| main | 0 · 0 · 1 · 0 | 0 · 0 · 1 · 0 | 0 / 0 (1 open) | 0 · 0 | 1618 · 1811 · 2250 · 1855 | 17 · 73 · 44 · 75 |
| part 1 only | 13 · 6 · 17 · 6 | 6 · 4 · 7 · 3 | 2 / 8 | 0 · 0 | 1763 · 1758 · 1805 · 1970 | 26 · 94 · 65 · 66 |
| **parts 1 + 2** | **10 · 16 · 10 · 5** | **4 · 6 · 4 · 3** | **4 / 6** | **1 · 1** (seed 42) | 1765 · 1719 · 1875 · 1907 | 32 · 78 · 72 · 73 |
| every instant cell + part 2 (rejected) | 20 · 54 · 33 · 29 | 9 · 22 · 11 · 13 | 5 / 11 | 1 · 1 (seed 99) | 1681 · 2170 · 2379 · 2395 | 378 · 481 · 602 · 662 |

With parts 1 and 2, every seed arranges at least 3 visits, so lead hand-off stays parked (the S3 kill line is 2). The whole chain, hear → survey → visit → `located` → delve, ran to its end once, on seed 42. The remaining loss is the walk: of 10 resolved visits, 4 were kept and 6 missed on the walk (`far → leaning`, then `departing` or straight to `lost`). Part 3 is the cheapest lever on that path. Encounter engagements moved +9 · −5 · −17 · +3%. Seed 4's drop is larger than its 9 extra surveys could cause directly (about 20 deciders among 550+ mortals), so it reads as a butterfly effect of the shifted world, not a cost of the change. The budget harness checks it either way.

### The S3 Done-when, re-baselined

"At least one `located` lead and one delve on **each** seed in 300 ticks" asked the visit's fair dice for a result on every seed. With 3–6 visits arranged per seed and the dice untouched, that is not guaranteed, and the plan forbids widening the dice. The gate becomes the rungs the design controls, and the dice's result is reported:

- each of seeds 42 · 99 · 4 · 8 surveys a ruin and arranges **at least 2 visits** in 300 ticks;
- **at least one `located` lead and one `ruins.delve_admitted`** across the four-seed census;
- kept and missed visits are reported, with the `waiting → lost` count expected to be 0 with part 2 on;
- `observe` undertakings **other than ruin surveys** stay within +50% of the same-run baseline on each seed. That is the guard that the exemption stays narrow. A lead survey is itself an `observe` undertaking, so the raw count rises by design: the chosen arm is +88% · +7% · +64% · −3% raw, but +29% · −15% · +44% · −9% with ruin surveys netted out of both sides. The rejected arm fails it on every seed (seed 42: 358 against 17).

**Would change the call.** Christian saying that a survey of a lead should face the forecast window like any other work (it would then need a lead hand-off to a holder who forecasts in the window, or a fairer survey, both slower). Or the census after the build showing a seed under 2 visits, which brings lead hand-off forward.

### Interface, tracing and fail-soft for the re-plan

| Contract | Disposition | Producer → reader |
|---|---|---|
| strategic candidate `leadPull` → board forecast and fit | **extend**: new reader | `strategicActionCandidates` → `scoreUnifiedBoard` (part 1) |
| appointment regime → encounter candidates | **extend**: one more regime (`waiting`) | `appointmentCtx` → the regime block (part 2) |
| `ScoredCandidate.appointmentDiscount` → board score | **add**: register in `scripts/interface-contracts.ts` | the `leaning` rerank → `scoreUnifiedBoard` (part 3), behind `APPOINTMENT_DISCOUNT_ON_BOARD` |

Tracing is additive: the board entry's `forecastZone` gains `'certain'`, and an encounter entry carries `appointmentDiscount` when one applied, both read through the existing `decision_board_comparison` trace. No new trace category.

| Failure case | Fallback |
|---|---|
| The candidate's template is missing or its mode unknown | Not exempt: the window applies as today |
| `appointmentCtx` has no resolvable place hex | `overruns` already returns `true` for an unknown onward distance; in `waiting` only non-local candidates are dropped, so local work always survives |
| Every candidate is dropped in `waiting` | `selected = null`. The mortal idles at the place, which is what waiting means |
| `appointmentDiscount` absent | Treated as 1 |

**Pillars.** Engine: the three parts above. **Content: N/A**, because no template or prose changes; the two seed-only templates shipped in THR-1664 and are what a kept or missed visit now reaches more often. **UI: N/A**, because no component changes. The player sees the effect on surfaces that already exist: the visit encounter (`?spawn=ruins.lead.visit`), the lead line on the sheet (*"knows where it lies"*), and the delve beats. The new zone and discount are trace fields for `getTraces` and the debug board readout. **Wiring:** no new module, phase or GameState field. The wiring checklist is unchanged. The systemic wiring guide gains one line saying a held lead's instant survey is not judged by the forecast window.

No PRNG is added: all three parts are deterministic filters and multipliers. No file over 100 importers is touched. The two shape changes are one additive union value (`EngagementZone`, `engagementWindow.ts`, 4 importers by grep) and one optional field (`ScoredCandidate`, `encounterScoring.ts`, 25 importers by grep).

**Implementing ticket:** [The lead survey and the kept visit](https://linear.app/threadbare/issue/THR-1686) (filed with this re-plan).

## Three-pillar check

- [x] Engine pillar present (S1–S3, and the three parts of § Re-plan after S3)
- [x] Content pillar present (two seed-only templates; lane prose N/A with reason)
- [x] UI pillar present (tooltip words; existing map, sheet and encounter surfaces)
- [x] Wiring section connects them (the re-plan adds no module; its pillar and wiring lines are in its own section)

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
- [x] **S2** (re-baselined 2026-09-29, § Re-plan after S2): at least one `cell.observe.location` survey targets a ruin on each seed, and it leaves its surveyor holding a `narrowed` lead. Shipped in PR #2140: 6 · 3 successful ruin surveys, 3 · 2 distinct surveyor–ruin pairs at `narrowed`. The decider share of leads (13% · 14%) is reported, not gated. ~~The decider share of newly minted leads is ≥ 30% on each seed.~~
- [x] **S3:** ~~at least one `located` lead and one `ruins.delve_admitted` on each seed in 300 ticks.~~ **Re-baselined 2026-10-01 (§ Re-plan after S3): each of seeds 42 · 99 · 4 · 8 surveys a ruin and arranges ≥ 2 visits; ≥ 1 `located` lead and ≥ 1 delve admitted across the four; `observe` undertakings other than ruin surveys within +50% of baseline; built by [THR-1686](https://linear.app/threadbare/issue/THR-1686).** If a seed shows none, the PR reports which rung starved (survey, visit kept or missed, band) from the traces. Both templates open from `?view=game&seeded&size=medium&spawn=ruins.lead.visit` and `…spawn=ruins.lead.cold`, and `?outcome=` shows every band. **Shipped 2026-09-29 (THR-1664): the mechanism, both templates and their review links. The census kill criterion fired:** on current main, seeds 42 and 99 survey no ruin (the S2 supply dropped to 0 at PR #2143, a global odds retune), and seed 4's one visit was arranged, then missed because a `waiting` mortal is not held at the place. The re-plan is [THR-1684](https://linear.app/threadbare/issue/THR-1684). **Built 2026-10-03 (THR-1686), census `readers/lead-survey-arms.ts` → `output/lead-survey-arms-2026-10-03-thr1686.json`:** seeds 42 · 99 · 4 · 8 survey a ruin 16 · 28 · 16 · 25 times and arrange 7 · 8 · 8 · 11 visits (main: 1 · 9 · 3 · 10 and 1 · 3 · 2 · 4); kept / missed 2/1 · 4/3 · 1/3 · 2/0; `located` 2 and `ruins.delve_admitted` 1, both on seed 99; `waiting → lost` 0 on every seed (main: 1, on seed 99). `observe` net of ruin surveys +15% · +29% · −7% · +22% against the same-run baseline. Part 3 off vs on is identical on all four seeds (the discount reached the board 1 · 3 · 0 · 0 times), so it stays. On eight more seeds (1, 2, 3, 5, 6, 7, 11, 13) the twelve-seed totals go, main → this change: visits arranged 15 → 62, kept 3 → 20, `located` 2 → 6, delves 2 → 5, `waiting → lost` 1 → 0. Two executor findings, both under part 2's agreed outcome: company travel (`groups/groupMovement.ts`) walked a waiting surveyor off the ruin on seed 99, so the hold is asked there too (`holdsWaitingMemberAtPlace`); and `overruns`' one-tick-a-hex proxy let a waiting mortal take a one-hex encounter that ran seven ticks on seed 2, so `waiting` prices its trips with `waitingTripOverruns` (`APPOINTMENT_HEX_TICKS_PER_HEX` there and back). `departing` keeps its own test.
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

### Re-plan after S2 (2026-09-29): gates

**Intent-judge: Revise → Allow** (fable, cold context, 2026-09-29). Run 1 found that the visit estimate was an upper bound, since the sharpen path emits the same trace (distinct pairs are 3 · 2, not 6 · 3). It also found the holder-share denominator mislabelled, the option-(b) cost wording wrong, and a duplicate-visit hole in S3.1 (tick-keyed seed id). All four were fixed. Run 2 re-verified every changed claim, including that only deciders survey (`phaseAgentDecision.ts:523`), and found no Christian-reserved fork.

**Forked audit: skipped, with rationale.** The re-plan changes one measurement target and adds one refusal rule to S3.1. No engine system, content item or UI surface is added or removed, so the NFP, three-pillar and Vision verdicts above stand unchanged. The new refusal is additive and fail-soft: with no pending visit, the planter behaves as written.

### Re-plan after S3 (2026-10-01): gates

**Intent-judge: Revise → Allow** (fable, cold context, 2026-10-01). Run 1 found that the first narrowness guard (raw `observe` within +50%) failed the chosen arm on seeds 42 and 4, because a lead survey is itself an `observe` undertaking. It also found the rejected-arm range mislabelled, the `CLUE_LEAD_SURVEY_PULL_MULT` row stale (1.5, live 2.5), and the replay and trace lacking provenance. All were fixed, and the guard now nets ruin surveys out of both sides. Run 2 re-verified every table cell against the committed JSON and the cited source lines. It ruled, as run 1 did, that letting an instant lead survey skip the forecast window is the *how* of an agreed design, not a fork reserved for Christian. The veto line stays in the section.

**Forked audit** (three independent sonnet auditors, scoped to the re-plan):

- **NFP: PASS-with-notes.** Part 3 had no kill switch, so `APPOINTMENT_DISCOUNT_ON_BOARD` was added. The exemption's `fit = 1` and forecast `1` are definitional literals, not tunables.
- **Three-pillar: PASS-with-notes.** The Content/UI N/A rationale and the wiring line were not in the section, and the S3 Done-when and Three-pillar check were not reconciled with it. All three are now fixed. Substrate: it extends the decision board, the forecast window and the appointment regime. No duplication.
- **Vision: PASS-with-notes.** No contradictions. God/protagonist separation holds, and the dice stay the mortal's. Note: a survey of a held lead has no player-facing line of its own. The player meets it as the visit encounter and the sheet's lead line, which already exist.
