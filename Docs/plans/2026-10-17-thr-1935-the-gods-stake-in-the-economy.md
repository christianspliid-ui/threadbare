> **title:** The god's stake in the economy — hungry towns on your ground pray, answered towns keep your faith, and every economic card says what it changed — THR-1935
> **linear_issue:** THR-1935
> **author:** Claude Code (design lane, unattended, run 2026-10-17b)
> **created:** 2026-10-17
> **three_pillars:** Engine done · Content done · UI done

# The god's stake in the economy — THR-1935

*A hungry town on the god's own ground prays. A god that answers, and whose help works, gains that town's faith: a small essence source that thrives while the town is fed and fails when it starves. A god that ignores a prayer finds a rival answering for it. Every economic card now says, in words, what it changed.*

## Why this is load-bearing

The [Mortal economy map](https://linear.app/threadbare/issue/THR-1863) builds a kingdom economy that mortals and factions fight over. This plan answers the god's half of the question: why should the player care whether a town eats? Measured on this worktree at `origin/main` (§ Substrate inventory has the citations):

- **Canon promises worshippers and the code has none.** *"Essence regenerates from worshippers, places of power, and your portfolio's investment depth"* (`Docs/canon/rulebook.md:198`). The `faithfulCommunity` source kind is declared with base income 0.3 (`src/data/essence-sources.ts:135`; `src/types/essenceSource.ts:29`), and nothing ever writes one. In practice only `placeOfPower` and `shrine` sources are ever created.
- **Nothing in the engine prays.** The word appears only in an activity label (`deriveLocationActivities.ts:75`), prose, and one encounter (`encounter.offer_small_prayer`).
- **Economic cards answer with silence.** The cast receipt's snapshot reads only influences and traits (`castTargetChanges.ts:88-111`). Bless the Harvest moves prosperity, health and every staple (`unified-action-templates.ts:1911`; `graphOpExecutor.ts:1806-1811`) and produces no change row.
- **Three promises are unwired.** Claim Resource pays flat matter whatever it claims (`unified-action-templates.ts:4581-4582`). Open the Markets' card text promises a thieves' guild through three constants nothing reads (`location-action-constants.ts:51-58`). The rival's *starve the faithful* step has no faith to starve (`rival-schemes/economic.ts:65-66`; its crack writes one sphere-pressure event, `orchestrator.ts:2376-2396`).

**Settled input** (cited inline where used; not re-opened):

- **[The god's stake in the mortal economy](https://linear.app/threadbare/issue/THR-1871)** covers the whole model: prayer, answer, faithful community, unbidden aid, the rival's answer, the market cards and the two promises. Decided by the design lane under delegation, 2026-10-14T19:26Z. **Christian kept it in chat, 2026-10-15:** *"Keep all three calls as decided. The plan docs can go ahead."* (human gate recorded on THR-1863 and THR-1935).
- **[What the player sees of the economy](https://linear.app/threadbare/issue/THR-1870)** ([decision record](../audits/2026-10-15-thr-1870-economy-visibility-decision.md)) covers the `economy` receipt kind (§ 5: a crossed band says the new word and opens the dialog; a change inside a band says the direction on the toast) and *no new Needs-you entry* (§ 7: the prayer names On the edge when both hold). Decided by the design lane under delegation, 2026-10-14T22:29Z; its veto day closed 2026-10-15T22:29Z with no veto.
- **Upstream plans this reads:** [hunger and unrest](2026-10-16-thr-1934-hunger-and-unrest.md) (the `restless` trait, `unrestInputs`, `hungerDays`, On the edge; Ready for Dev, not built); [mortal wealth](2026-10-15-thr-1936-mortal-wealth.md) (Means for every decider, `economy_shift`, and the `economy` change kind's shape, which that plan owns; not built); [undertakings in the economy](2026-10-17-thr-1937-undertakings-in-the-economy.md) (a founded guild's calling from its founder's leading Reach, so a Shadow founder makes thieves; not built); [the screen frame](2026-10-14-thr-1875-screen-frame.md) (`NEEDS_YOU_PRODUCERS`; not built); [map lenses and chrome](2026-10-14-thr-1878-map-lenses-and-chrome.md) (the Trouble lens; not built); [the faction purse](2026-10-15-thr-1931-faction-purse.md) (built: `townTaxOf`).
- **The Dominion map ([THR-1758](https://linear.app/threadbare/issue/THR-1758))** is closed and is read here, never redesigned. That covers the bands, the Claim pace (THR-1762), the raid throttle (THR-1763), one channel for income (THR-1761) and the card tiers (THR-1794).

**How-level choices this plan made** (the decisions left them open; reasons and alternatives are in the [brainstorm companion](2026-10-17-thr-1935-the-gods-stake-in-the-economy-brainstorm.md); each is invited for veto):

1. **Three slices:** prayers and the faithful; receipts; the cards and the promises.
2. **A prayer is an event node in the graph** (`occurred_at` the town, and the god's answer is a `participated_in` edge). It is not a god id stored on the town.
3. **"Recovered" means the town has lost its Restless chip.** The chip releases at 15, so recovery agrees with what the player sees.
4. **A town's faith starts at the land's nurture ceiling and lapses at zero.** In the code a source's sanctity changes its income only at flowering, so without a lapse "faith rides the bread" would change nothing (measured, § Engine 3).
5. **Sanctify cannot touch a town's faith.** Only bread moves it.
6. **A god keeps at most four faithful towns** (`FAITHFUL_COMMUNITY_MAX`). The full-window model puts six over the income ceiling for the richest god (§ Measurement).
7. **The decided 30-day durations are kept and worded "a year".** The game's calendar runs 7.5-day seasons and 30-day years (`TICKS_PER_SEASON` 90, `types/temporal.ts:30`). The decision wrote "once a season (30 days)" and "for a season … 30 days". The numbers carry the intent (a six-day window with a 7.5-day cooldown would let a town pray almost without pause, which the decision rejected as flooding), so the player reads "a year".
8. **"Faithful", not "congregation", on screen.** In the UL, *Congregation* is a Temple of the Spheres faction (`Docs/ubiquitous-language/Agents.md` § Congregation), so the decision's "answered towns become congregations" would give one word two meanings (PC-6). The code kind stays `faithfulCommunity`.
9. **Answering is marked on the card**, as a flag in `progression.flags`, with a completeness test, not inferred at run time.
10. **Bless the Holding uses the declared `blessed` edge** (`graph.ts`, no writer today).

## Measurement — what the faithful add to the god's income

The decision owed this measurement (*"The plan doc measures them in the full-window model (`npm run model:power`)"*; *"would change the call: congregations past about 10% of day-90 income"*).

**Method.** This used `scripts/power-progression-model.mjs --model dominion` at `94840db5`, copied to the run's scratchpad with a faith overlay. Each faithful town is a `faithfulCommunity` source at base 0.3. It is never flowering, starts at Touched, ranks in the same-sphere diminishing-returns queue as every other source, and pays `SOURCE_CONTROL_SUSTAIN` 0.15. The days a town is gained are model assumptions spread across the window. The overlay is the five lines described in § Notes for the executor. S1 adds it to the real script as `--model faith`, with `--check`.

| God (THR-1760..1765 census) | Faithful towns | Day-90 income a tick (unrounded) | Change from none | Trip-wire: 10.5 ≤ income ≤ 13.5 (the model's own check, `income <= high`) |
|---|---|---|---|---|
| shepherd (seed 42) | 0 · 1 · 2 · 3 · 4 · 6 | 12.67 · 12.85 · 13.00 · 13.12 · 13.21 · 13.35 | +0.18 … +0.68 | in band |
| thin (seed 99) | 0 · 1 · 2 · 3 · 4 · 6 | 12.67 · 12.85 · 13.00 · 13.12 · 13.21 · 13.35 | +0.18 … +0.68 | in band |
| rich (seed 7) | 0 · 1 · 2 · 3 · 4 · **6** | 12.84 · 13.02 · 13.17 · 13.29 · 13.38 · **13.52** | +0.18 … +0.68 | in band to 4 (13.38); **OUT at 6 (13.52 > 13.5)** |

**Reading.** One to four faithful towns add 1.4–4.3% to day-90 income (+0.18 to +0.54), well under the decision's 10% line. So the base stays at 0.3, and the faithful are a stake, not the engine of the god's power. The richest god leaves the band at six (13.52), and at four it keeps 0.12 of headroom, so `FAITHFUL_COMMUNITY_MAX` is 4. The decision's scale estimate expects a handful of prayers a season, so the cap rarely binds. Its purpose is to stop a farm.

## Substrate inventory

Measured at `94840db5` (2026-10-17). Citations are `src/`-relative `path:line`.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Essence sources — the bag on the host (`types/essenceSource.ts:41-73`); kinds (`:29`); base income (`data/essence-sources.ts:132-138`); writers `essenceSourceSeeding.ts:81`, `essenceSources.ts:150`, the `consecrate_source` op (`graphOpExecutor.ts:1008-1010`, any `sourceKind`, default shrine) | 🟢 ACTIVE; `faithfulCommunity` 🔴 no writer | **S1 writes** `faithfulCommunity` through the consecrate path's helper |
| Source income (`computeSourceIncome` `essenceSources.ts:85-124`): base × `sourceTierMultiplier(tier)` × `sourceIncomeMultiplier` (Dominion band), diminishing returns per sphere. Sanctity matters only through the tier (dormant ×1, flowering ×2 at 0.6, `essence-sources.ts:17-20`) | 🟢 ACTIVE | **reads**, unchanged |
| Land nurture (`computeSanctitySustenance` `essenceEconomyBridge.ts:159-200`; sphere match `:136`; stock tier score −1/0/+1 `essence-sources.ts:92-96`; ceiling 0.5 `:89`, cap `:191`; drift 0.01 a tick `:80`; applied `essenceSources.ts:255-259`) | 🟢 ACTIVE | **S1 extends** with one rule: a faithful community scores the host's **staples** whatever its sphere |
| Source upkeep (`SOURCE_CONTROL_SUSTAIN` 0.15 `essence-sources.ts:34`; `chargeSourceUpkeep` `essenceSources.ts:355-358`; `essenceIncome.ts:92`) | 🟢 ACTIVE | **reads**; a faithful town pays it like any source |
| Staple goods (grain, grazing, fish, water, `primarySphere: 'life'`, `resource-classes.ts:81-84`); stock tiers (`resource.ts:17`; cuts `resource-classes.ts:48-49`) | 🟢 ACTIVE | **reads** |
| Dominion read (`dominionOf` `dominion.ts:276`; `bandAtLeast` `:96`; bands `dominion-content.ts:16`) | 🟢 ACTIVE | **reads** for the prayer gate |
| Sphere pressure (`SpherePressureEvent` `types/sphereAffinity.ts:47-54`; `PressureSource` union `:27-41`; queue `GameState.pendingSpherePressures` `types/gameState.ts:413`; consumed by `phaseSpherePressure` `orchestrator.ts:3945-3949`); Claim split by bought points (`splitByPoints` `phaseDominion.ts:133`, pushed `:283`; `DOMINION_CLAIM_PRESSURE_PER_TICK` 0.03 `dominion-content.ts:109`) | 🟢 ACTIVE | **S1 adds** two `PressureSource` members and one-shot pushes split the Claim's way |
| One-shot Dominion writers on a cast (Shift Dominion `unifiedActionResolution.ts:4163-4171`; card `sphereAffinity` `:4177-4181`) | 🟢 ACTIVE | **S1 hooks** the answer check beside them |
| Rival raids (`landRivalProbe` `orchestrator.ts:2081-2117`; `godTurf` `:2042`; `pickFromTurf` `:2058`; throttle `raidAllowanceLeft` / `recordRaidLanding` `phaseDominion.ts:116-128`; `RIVAL_PRESSURE_MAGNITUDE` 4 `types/sphereAffinity.ts:76`); scheme target `selectSchemeTarget` `orchestrator.ts:1789-1819` | 🟢 ACTIVE; no way to put a town first | **S1 adds** a slighted town first, inside the throttle |
| Economic scheme (`rival-schemes/economic.ts`: sour-mines → corner-grain → break-guild → **starve-faithful** crack `:65-66`); crack runner `orchestrator.ts:2376-2396` (one 0.1 pressure event + toast) | 🟢 ACTIVE; the crack has no faith write | **S1 adds** the sanctity drain |
| Unrest bands (hunger and unrest S1: `restless` trait enter 30 / release 15, `unrestInputs`, `hungerDays`; S2: `on_the_edge`) | 🔴 not on main | **S1 is blocked by** [hunger and unrest](https://linear.app/threadbare/issue/THR-1934) |
| Bless the Harvest `loc.bless_harvest` (`unified-action-templates.ts:1911`; Life; prosperity +12, health +15, `bless_harvest` op +25 every staple; `migrationPullUntilTick` `unifiedActionResolution.ts:1723`) · Open the Markets `loc.open_markets` (`:2101`; Order; prosperity +6, unrest −10) | 🟢 ACTIVE | **S1 flags** both as answering cards |
| Cast receipt (`snapshotCastTarget` `castTargetChanges.ts:88-111`, influences + traits only; `snapshotTargetChanges` `:124`; called `unifiedActionResolution.ts:2985`; `decidePresentation` `playerReceipts.ts:150-163`, target-side changes ride the toast); change kinds (`types/unifiedAction.ts:180-188`, no `economy`) | 🟢 ACTIVE | **S2 extends** the snapshot, adds the `economy` kind if mortal wealth has not, and adds a crossed-band rule to `decidePresentation` |
| Omen market (`progression: { tier, offer, generic, flags }`, `CardProgression` `types/unifiedAction.ts:2419-2434`; `PRICE_BY_TIER` 2 → 40, `OFF_SPHERE_PRICE_MULT` 2, `god-progression-content.ts:30-34`; example `loc.sanctify_square` `unified-action-templates.ts:2140`) | 🟢 ACTIVE | **S3 adds** three tier-2 market rows |
| Claim Resource `hex.claim_resource` (`unified-action-templates.ts:4556`; `controlSpec.perTickIncome: { matter: 0.5 }` `:4581-4582`) | 🟢 ACTIVE, pays the wrong sphere | **S3 fixes** pay: the good's sphere × stock tier |
| Thieves' guild promise (`LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD` 75, `…_DELAY_TICKS` 8, `…_TRADE_RANGE_HEXES` 4, `location-action-constants.ts:51-58`, **no reader**); the card text (`unified-action-templates.ts:2107`); a criminal faction type (`thieves-guild-definition.ts:16,21`); the founded-guild path (`create × faction`, `undertaking-objects.ts:1708-1719`; undertakings plan S1 gives a Shadow founder `guildType: 'thieves'`) | 🟠 DORMANT | **S3 wires** it through the founded-guild path |
| `loc.guide_caravan` card `reach: 'eye'` (`unified-action-templates.ts:2038`) vs step `reach: 'gold'` (`:2042`) | ⚠️ HAZARD | **S2 fixes** (card to `gold`, the step's Reach) |
| Needs you (`views/needsYou.ts`, `NEEDS_YOU_PRODUCERS`; the screen frame plan § F5) | 🔴 not on main | **S1 adds** a `prayer` producer if the frame is on main; whichever lands second adds it |
| Trouble lens (`MapLensId` is `'dominion'` only, `data/map-lenses.ts:18`; Trouble is planned in THR-1878) | 🔴 not on main | **S1 adds** a Prayer mark if lenses II is on main; whichever lands second adds it |
| Chronicle (a `TickEvent { type: 'narrative', significance }` in `tickEvents`, e.g. `phaseDominion.ts:489-497`) | 🟢 ACTIVE | **S1 writes** four lines |
| Covenants list (sources the god controls, `essenceSources.ts:283-285`) | 🟢 ACTIVE | **S1 reads**: a faithful town appears there with its own line |
| Season and year (`TICKS_PER_DAY` 12 `attention-constants.ts:14`; `TICKS_PER_SEASON` 90 `types/temporal.ts:30`; four seasons a year = 360 ticks = 30 days) | 🟢 ACTIVE | **reads** for the words (choice 7) |
| God's primary sphere (`getAscendantPrimarySphere` `ascendantExpression.ts:81-88` reads alignment; upkeep and Dominion read bought points, `dominionViewModels.ts:41-50`) | 🟢 ACTIVE, two readers | **reads the points**, as upkeep does, so a faithful town pays into the pool its upkeep comes from |

**Grep census:** no `economy` change kind and no `economy_shift` anywhere in `src`; no `mortalMeans` file; no writer of the `blessed` edge (only content strings); no reader of `migrationPullUntilTick` beyond its expiry sweep (`phaseProsperity.ts:784-797`). That reader belongs to [hunger and unrest](https://linear.app/threadbare/issue/THR-1934)'s Restless leaving, as the decision's note says, and not to this plan.

## Engine pillar

### Systems design

Three slices, one plan. **This ticket builds S1.** S2 and S3 are filed as their own tickets at handoff (§ Slices).

**1. A hungry town on your ground prays (S1).** New module `src/engine/prayers.ts`, with constants in `src/data/prayer-constants.ts`. A new daily orchestrator phase, `prayer`, runs right after `location_trait` (`orchestrator.ts:3939`), so it reads the day's `restless` trait. For each place-tier settlement (`getLocationNodes`, settlement subtypes) with no open prayer:

- **Gate.** All four must hold:
  1. it bears `restless` (hunger and unrest S1);
  2. its largest positive `unrestInputs` term is `hunger` (ties go to hunger);
  3. `dominionOf(graph, playerGodId, settlementId)` is at least `PRAYER_MIN_BAND` (`'touched'`);
  4. `tick − lastPrayerTick ≥ PRAYER_COOLDOWN_DAYS × TICKS_PER_DAY`.
- **The god hears one prayer at a time** (calibration ruling, design lane 2026-10-17, after the S1 census flooded seed 99 with 19 prayers; [the ruling](https://linear.app/threadbare/issue/THR-1935)). The day's pass runs in two parts. First every town's open or answered prayer is settled (closed, answered, recovered, unrecovered). Then a new prayer opens only when the god has fewer than `PRAYER_MAX_OPEN` (1) prayers `open` **and** at least `PRAYER_GOD_GAP_DAYS × TICKS_PER_DAY` (7.5 days, one season) have passed since the god's last opening (`lastPrayerOpenedTick` on the god node, its own clock). Of the towns that pass the four-part gate that day, **the hungriest prays**: the largest `unrestInputs.hunger`, with ties going to the lower id. No seeded draw is used. The others do not open and do not start their cooldown, so a town still hungry when the gap clears is heard then. This caps a 90-day run at 12 prayers, the flood line, at one a season.
- **Write.** A new `event` node (`type: 'event'`, `properties.eventKind: 'prayer'`, `openedTick`, `closesTick = tick + PRAYER_ANSWER_WINDOW_DAYS × TICKS_PER_DAY`, `status: 'open'`, `sphere` the god's primary). An `occurred_at` edge goes from the prayer to the town. The town gets `lastPrayerTick = tick` (its own clock, not a relationship). The god is not written on the prayer: only the player's god hears prayers in v1, and the answer is the god's edge (§ 2).
- **Surfaces.** A chronicle line (§ Content), the place page's prayer line, a Needs-you row and a Trouble-lens mark (§ UI). There is never an interrupt (the decision).

**2. Answering (S1).** In `unifiedActionResolution.ts`, beside the one-shot Dominion writers (`:4163-4181`), when a **player** cast **succeeds**, the template carries `progression.flags` `'answers_prayer'`, and the target is a settlement (or resolves to one through `parentLocationId`):

- **An open prayer at that town** → an **answer**. A `participated_in` edge goes from the god to the prayer event (`role: 'answered'`, `tick`, `actionId`), and the prayer's `status` becomes `'answered'` with `answeredTick`. One `SpherePressureEvent` goes on `pendingSpherePressures` with magnitude `ANSWERED_PRAYER_DOMINION_PRESSURE` (2), split across the god's bought spheres by `splitByPoints` the way the Claim splits (`phaseDominion.ts:133`), with the new `PressureSource` `'prayer_answered'`. Two is about five and a half days of steady Claim at 0.03 a tick ([THR-1762](https://linear.app/threadbare/issue/THR-1762)). A second answering cast on an answered prayer does nothing more.
- **No prayer, but the town is hungry and off your ground** (bears `restless`, hunger is the largest input, band below `PRAYER_MIN_BAND`, cooldown clear) → **unbidden aid**. One pressure push of `UNBIDDEN_AID_DOMINION_PRESSURE` (1), source `'unbidden_aid'`, and `lastPrayerTick = tick`, so the same town cannot be farmed for Dominion by casting again and again. No faithful town forms. *Kindness abroad widens your ground slowly, but faith grows only where you already hold it* (the decision).
- **A failed cast** answers nothing. The window stays open.
- **Answering cards today:** `loc.bless_harvest` and `loc.open_markets` (the decision). A content test (§ Content, Data tables) holds the flag and the effects together.

**3. A town keeps your faith (S1).** In the daily `prayer` phase, for each `'answered'` prayer:

- **Recovered:** the town no longer bears `restless` (it releases at 15, so this agrees with the chip; choice 3), within `PRAYER_RECOVERY_WINDOW_DAYS` (30) of the answer. Then:
  - If the god controls fewer than `FAITHFUL_COMMUNITY_MAX` (4) faithful towns and the town hosts no essence source of its own, the town becomes a **faithful community**. The consecrate path's source-writing helper (the body of the `consecrate_source` op, `graphOpExecutor.ts:1008-1010`, extracted so it can be called without a cast) writes the `essenceSource` bag on the town: `kind: 'faithfulCommunity'`, `sphereAffinity` the god's primary by bought points, `sanctity: FAITHFUL_INITIAL_SANCTITY` (0.5, the land's nurture ceiling), `discoveredBy` the god, and `originTick`. It also writes the `controls` edge from the god to the town that every controlled source carries. Prayer `status: 'recovered'`.
  - At the cap, or when the town already hosts a source: no source. Prayer `status: 'recovered'`, and the thanks line has no faith clause (§ Content).
- **Not recovered in time:** prayer `status: 'unrecovered'`. *Help that fails earns the push but no faithful town* (the decision).

**How faith rides the bread.** `computeSanctitySustenance` (`essenceEconomyBridge.ts:159-200`) gets one rule: for a source of kind `faithfulCommunity`, `scoreSphereAffinity` scores the host's **staple** goods (`category: 'staple'`, `resource-classes.ts:81-84`) instead of goods matching the source's own sphere. Everything else is unchanged: the ceiling at 0.5, the stall when upkeep is unpaid, and withering with no floor. A fed town holds its faith at the ceiling. A starving one drains it at up to 0.01 a tick, so from the ceiling it lasts about four days of full famine.

**Why a lapse is needed (choice 4, measured).** Source income reads sanctity only through the tier (`computeSourceIncome` `essenceSources.ts:102-105`; dormant ×1 below 0.6). Nurture stops at 0.5, below flowering, so a faithful town's income would never change with its bread unless something reads its sanctity. The rule: **when a faithful community's sanctity reaches `FAITHFUL_LAPSE_SANCTITY` (0), the faithful turn away.** The `essenceSource` bag and the god's `controls` edge for it are removed, a chronicle line fires, and the town may pray again once its cooldown has passed. Below `FAITHFUL_WAVERING_SANCTITY` (0.2), the Covenants line and the place-page line say its faith is wavering, so the loss is warned before it lands.

**Sanctify cannot touch a faithful town (choice 5).** The sanctify cards' target filter excludes a host whose source is `faithfulCommunity`. Only bread moves this faith, which keeps it below flowering and inside the measured envelope.

**4. The rival answers an ignored prayer (S1).** When an `'open'` prayer's window closes unanswered, its `status` becomes `'unanswered'` and the town gets `prayerSlightedUntilTick = tick + PRAYER_SLIGHT_DAYS × TICKS_PER_DAY`. In `landRivalProbe` (`orchestrator.ts:2081-2117`) and `selectSchemeTarget` (`:1789-1819`), the target pick is a slighted town that is in the god's turf (from `godTurf`) when one exists, ties to the lower id. Only then does the weighted `pickFromTurf` run. The landing still goes through `raidAllowanceLeft` / `recordRaidLanding` (`phaseDominion.ts:116-128`), so the throttle is untouched. The slight clears on its first landing or when it expires. A chronicle line names the rival as the god who answered (§ Content). There is no essence penalty (Law: failure teaches, it does not fine).

**5. The rival starves your faithful (S1).** The economic scheme's crack step (`starve-faithful`, `rival-schemes/economic.ts:65-66`; crack runner `orchestrator.ts:2376-2396`) gains one write. If its target town hosts a faithful community of the player's god, the source's sanctity drops by `STARVE_FAITHFUL_SANCTITY_DRAIN` (0.25), with the source `'rival_scheme'` in the trace. A lapse then follows the § 3 rule. The existing sphere-pressure event and toast stay. If the target has no faithful town, nothing new happens.

**6. Every economic card says what it changed (S2).** Built to [THR-1870](https://linear.app/threadbare/issue/THR-1870) § 5:

- **The snapshot.** `snapshotCastTarget` (`castTargetChanges.ts:88-111`) gains an `economy` part when the target is a location or an actor:
  - for a settlement: `prosperityTier` (`getProsperityTier` `phaseProsperity.ts:210`), the unrest band (`'restless' | 'lawless' | 'on_the_edge' | null`, read from the location traits; a band whose trait is not on main reads `null`), the staple stock tiers, and for each `trades_with` lane touching it: `threatened`, `embargoed` and a volume word;
  - for a mortal: the Means band (`getWealthTier`, `wealth.ts:60-88`).
  - Every part is optional, and a field it cannot read is left out.
- **The diff.** `snapshotTargetChanges` (`:124`) compares the two `economy` parts. For each quantity, a **crossed band** gives one `EncounterAftermathChange` of kind `economy` with `crossed: true` and the new word. A **move inside a band** gives one with `crossed: false` and only the direction. Unchanged quantities give nothing.
- **The kind.** `economy` and its sentence shape are owned by [mortal wealth](2026-10-15-thr-1936-mortal-wealth.md) (§ Content 2: *"The god's-stake plan reuses this change kind for cast receipts; this plan owns its shape"*). If mortal wealth S1 is on main, S2 reuses its kind and `meansChangeSentence`. If not, S2 adds the kind with that plan's exact shape, and mortal wealth adopts it (the coordination comment on THR-1935, 2026-10-15). Either way there is one kind.
- **Presentation.** `decidePresentation` (`playerReceipts.ts:150-163`) gains one rule before the toast fallback: a target-side `economy` change with `crossed: true` (or a lane freed of threat) returns `'modal'`. *A crossed band opens the receipt dialog; a change inside a band rides the toast* (§ 5).
- **The land line.** The lines sit under the [settlement economy](2026-10-14-thr-1923-settlement-economy.md)'s land line in the same receipt. Both read the same diff, so they cannot disagree.
- **Card fix.** `loc.guide_caravan`'s card `reach` becomes `'gold'`, the Reach its step rolls (`unified-action-templates.ts:2038` vs `:2042`).

**7. New market cards and the two promises (S3).**

- ***Fortune's Favour*** (`mortal.fortunes_favour`; target a mortal; Gold reach; Matter) and ***Ruin*** (`mortal.ruin`; Shadow; Entropy). Each moves the target's Means one band through mortal wealth's `economy_shift` (`quantity: 'means'`). The amount is computed in the effect: Favour moves to the next band's floor, and Ruin moves to one below the current band's floor, as the mortal-wealth coordination note on THR-1935 says, so the card always moves exactly one word. Clamp at 0 and 100; a 0 move writes no change (Law 56). The poorer or richer mortal then wants differently through mortal wealth S2's want. This is how a god funds a founder.
- ***Bless the Holding*** (`loc.bless_holding`; target a place someone holds, meaning a faction `controls` it or a mortal `owns` it; Gold; Order). It writes a `blessed` edge from the god to the place with `kind: 'holding_yield'`, `untilTick = tick + BLESS_HOLDING_DAYS × TICKS_PER_DAY` and `mult: BLESS_HOLDING_YIELD_MULT` (1.5). The faction purse's town tax (`townTaxOf`, `factionPurse/income.ts:203-208`) and holding income's freehold and tithe (`holdingIncome.ts:123-160`) multiply that place's term by `mult` while the edge is live. The edge is removed at `untilTick` by the same daily sweep. Recasting extends `untilTick` and does not stack. This is how a god funds an anointed faction's war.
- **Card rows.** All three are `progression: { tier: 2, offer: 'market', generic: false }`, priced through `PRICE_BY_TIER` (40 in their sphere, double off it). They are data rows (the decision; [THR-1811](https://linear.app/threadbare/issue/THR-1811)). [The card tiers](https://linear.app/threadbare/issue/THR-1794) stand: the six Wellspring economic gifts do not move.
- **Claim Resource pays what it claims.** `hex.claim_resource`'s income is resolved each tick by the control-effects phase from the claimed good: its resource class's `primarySphere` × `CLAIM_RESOURCE_BASE_INCOME` (0.5, today's number) × `CLAIM_RESOURCE_TIER_MULT[stockTier]` (scarce 0.5, adequate 1, surplus 1.5). A `controlSpec` field `incomeFrom: 'claimed_good'` marks it, and other control cards keep their static `perTickIncome`. A good with no class falls back to today's `{ matter: 0.5 }`.
- **Open the Markets' thieves' guild.** A town where Open the Markets succeeds records `marketsOpenedTick`. While its prosperity has stayed at or above `LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD` (75) for `LOC_OPEN_MARKETS_THIEVES_DELAY_TICKS` (8; the existing constant is in ticks, and the decision's "8 days" misread it), and for `THIEVES_GUILD_OFFER_DAYS` (10) after that, the existing `create × faction` cell is boosted on the board of a resident whose leading Reach is Shadow, by `THIEVES_GUILD_OFFER_WANT` (1.5). The cell's existing eligibility applies, and nothing is added to a board that would not carry it. The undertakings plan S1 makes a Shadow founder's guild `guildType: 'thieves'`, so the promise is kept by the world's own founding. `LOC_OPEN_MARKETS_TRADE_RANGE_HEXES` gets no reader and is deleted with a note.

**Rollback.**
- `PRAYER_ENABLED = false` skips §§ 1–5. No prayers, no faithful towns, no slights; the crack behaves as today.
- `ECONOMY_RECEIPTS_ENABLED = false` skips § 6's snapshot part, so receipts are as today.
- S3's cards are data rows. Claim Resource's resolver falls back to static income when `CLAIM_RESOURCE_PAYS_GOOD = false`.

### Graph nodes / edges

**No new node or edge types.** Checked against `src/types/graph.ts`: `event` (node type, `:27`), `occurred_at`, `participated_in`, `controls` and `blessed` all exist. `blessed` is declared with no writer; S3 activates it.

| Where | Property | Type | Writer |
|---|---|---|---|
| prayer `event` node | `eventKind: 'prayer'`, `openedTick`, `closesTick`, `status: 'open' \| 'answered' \| 'unanswered' \| 'recovered' \| 'unrecovered'`, `answeredTick?`, `sphere` | new event kind | `prayer` phase, answer hook |
| `occurred_at` (prayer → town) | existing | — | `prayer` phase |
| `participated_in` (god → prayer) | `role: 'answered'`, `tick`, `actionId` | existing edge | answer hook |
| settlement | **`lastPrayerTick`**, **`prayerSlightedUntilTick`** (new); `marketsOpenedTick` (S3, new) | ticks | `prayer` phase, answer hook, Open the Markets |
| settlement `essenceSource` | `kind: 'faithfulCommunity'` (existing kind, first writer) | existing bag | `prayer` phase |
| `controls` (god → faithful town) | the existing source-control shape | — | `prayer` phase |
| `blessed` (god → held place, S3) | `kind: 'holding_yield'`, `untilTick`, `mult` | existing edge, first writer | Bless the Holding |
| `PressureSource` union | `'prayer_answered'`, `'unbidden_aid'` | union members | answer hook |
| `CardProgression.flags` | `'answers_prayer'` | flag value | templates |
| `ControlSpec` (S3) | `incomeFrom?: 'claimed_good'` | optional field | `hex.claim_resource` |
| `EncounterAftermathChange` (S2) | `kind: 'economy'`, `crossed: boolean`, `quantity` | owned by mortal wealth | snapshot diff |

**Prayer events are kept for the run.** The god hears at most one a season (§ Engine 1), so no garbage collection is needed. They are the inspectable record of every prayer.

### Tick phases

| Phase | Slot | Cadence | Reads | Writes |
|---|---|---|---|---|
| `prayer` (new, `prayers.ts`) | after `location_trait` (`orchestrator.ts:3939`), before `sphere_pressure` | daily; open-prayer closing checked daily | `restless`, `unrestInputs`, `dominionOf`, prayers, source count | prayer events, `lastPrayerTick`, `prayerSlightedUntilTick`, `faithfulCommunity` sources, lapses, chronicle |
| player cast resolution (existing) | unchanged | per cast | template flags, open prayers, hunger gate | `participated_in`, prayer status, `pendingSpherePressures` |
| `sphere_pressure` (existing) | unchanged | every tick | the queued pushes | place `sphereAffinity` (unchanged writer) |
| essence sources (existing) | unchanged | every tick | the host's staples for faithful towns | sanctity (new scoring rule), lapse (new) |
| rival actions (existing) | unchanged | per rival action | `prayerSlightedUntilTick` | slighted town first; crack drains faith |
| control effects (existing, S3) | unchanged | every tick | the claimed good's tier | Claim Resource's income |
| faction purse / holding income (existing, S3) | unchanged | daily | `blessed` edges | the ×1.5 on a blessed place's term |

### Resolution logic

1. **One prayer at a time per town.** A town with an `open` or `answered` prayer cannot open another. Its cooldown starts at the prayer's opening, so a town prays at most once every 30 days whatever happens.
2. **The answer is the cast's success, not its outcome.** A successful answering cast answers. Whether the town recovers is the world's business: hunger and unrest's drift, the settlement economy's food, the next harvest. *Help that fails earns the push but no faithful town.*
3. **The cap counts sources the god controls now.** A lapsed faithful town frees a slot.
4. **On the edge with a prayer.** When the praying town also bears `on_the_edge` (hunger and unrest S2), the prayer's line names it (the visibility decision § 7). Nothing else changes.
5. **Unbidden aid needs no prayer.** It uses the same hunger gate below the band, so a god cannot buy Dominion off a fed town.
6. **Bless the Holding on a place held twice** (a faction `controls` it and a mortal `owns` it) multiplies both terms. They are different incomes.

### PRNG callouts

None new. Every rule is deterministic, and ties break by id. The slighted-town pick runs before `pickFromTurf`'s seeded draw and consumes no draw, so a world with no slight draws exactly as today.

## Content pillar

### Encounter templates

N/A. No encounter changes. The prayer is a world event, and its surfaces are chronicle, place page, Needs you and the lens.

### Prose tables

**S1, prayer lines** (`src/data/prayer-content.ts`, game register, present tense, no numerals; `{town}` and `{god}` route through the ref router; `{holder}` is the town's tax holder):

| Trigger | Line (one of three variants shown) | Where |
|---|---|---|
| A town prays | "Millbrook prays to {god} for bread." | chronicle; Needs you; place page |
| Prays, and is on the edge (S2 of hunger and unrest) | "Millbrook prays for bread, and is on the edge of turning from {holder}." | every prayer surface: chronicle, Needs you, place page, lens hover (the visibility decision § 7, verbatim) |
| Answered | "{god} hears Millbrook." | receipt line under the card's own (S1 writes it as an `info` aftermath change) |
| Unbidden aid (no prayer, off your ground) | "Ferris did not pray to {god}, but it will remember who fed it." | receipt line under the card's own (an `info` aftermath change); it names no faith, because none forms |
| Answered, but no recovery in 30 days (`'unrecovered'`) | "{god}'s help reached Millbrook, but its hunger did not break. It gives no thanks." | chronicle |
| Trouble-lens hover on the Prayer mark | "Prayer: Millbrook prays to {god} for bread." | lens hover (the THR-1870 lens grammar: the mark's word, then the line) |
| A faithful town, no prayer open | "Millbrook keeps faith with you." | place page and Covenants (one line, both surfaces) |
| Recovers, faith forms | "Millbrook gives thanks to {god}, and keeps faith with you." | chronicle (the decision's thanksgiving line) |
| Recovers at the cap, or the town hosts a source | "Millbrook gives thanks to {god}." | chronicle |
| Unanswered, the rival answers | "No answer came to Millbrook. {rival} has heard its prayer instead." | chronicle |
| Faith wavers (sanctity below 0.2) | "Millbrook's faith wavers: its bread is short." | Covenants line; place page |
| Faith lapses | "Millbrook's faithful have turned away from {god}." | chronicle |
| Starve the faithful (the crack) | "{rival}'s agents empty Millbrook's granaries, and its faith in you thins." | chronicle; the existing crack toast keeps its line |

A line with an unresolved slot is dropped, never printed with a hole (Law 14). `{rival}` falls back to "another power". `{holder}` falls back to the line without the On-the-edge clause.

**S2, receipt lines.** These are the visibility decision's § 5 table, verbatim as the content rows (`src/data/economy-receipt-content.ts`, one entry per quantity × direction × crossed):

| Quantity | Crossed (opens the dialog) | Inside a band (the toast) |
|---|---|---|
| Prosperity | "Millbrook is no longer struggling: it is modest again." / "Ferris has fallen to struggling." | "Millbrook's fortunes lift." / "…sink." |
| Unrest band | "Ferris has gone lawless." / "Ferris is no longer lawless." | "Its people's anger cools." / "…rises." |
| Staple | "Millbrook is no longer short of grain." / "Millbrook is short of grain." | — (stock moves are carried by the land line) |
| Lane | "The road from Millbrook is no longer threatened." | "Trade on the roads from Millbrook picks up." / "…falters." |
| Means (a mortal) | mortal wealth's "Better off" / "Worse off" + "{name} is now Comfortable." | "Fortunes turn up." / "…down." |
| A lasting effect | the fade clause: "The plenty will ease over the coming season." / "Left alone, its anger will cool." | — |

(The decision's fade clause "over the coming season" belongs to Bless the Harvest's land shock, whose length is the settlement economy's and not this plan's. It is kept as written.)

**S3, card text** (effect lines read before the cast, Law 16):

| Card | Effect line | Receipt (S2 kind) |
|---|---|---|
| Fortune's Favour | "Fortune smiles on {target}: they rise one step in the world's eyes." | the Means band crossed |
| Ruin | "Ruin finds {target}: they fall one step." | the Means band crossed |
| Bless the Holding | "For a year, {holder} draws half again from {target}." | "{holder}'s yield from {target} swells this year." + "The blessing fades at the year's end." |
| Claim Resource (rewritten) | "Claim {good}: it feeds your {sphere} while you hold it, more when the land has plenty." | unchanged receipt |
| Open the Markets (promise line kept) | the card text stays (`unified-action-templates.ts:2107`), because S3 makes it true | unchanged |

### Attachment content

N/A. No items or attachments.

### Data tables

- `src/data/prayer-constants.ts` (§ Constants table).
- `src/data/prayer-content.ts` (S1 lines, three variants each).
- `src/data/economy-receipt-content.ts` (S2, one entry per quantity × direction × crossed; Law 58).
- Three template rows in `unified-action-templates.ts` (S3), and the `'answers_prayer'` flag on two existing rows (S1).

**Completeness tests.**
- **S1, `answersPrayer.test.ts`:** every template flagged `'answers_prayer'` targets a location and writes at least one of prosperity +, staple stock +, unrest −. Every location-target **player** template that writes staple stock + or unrest − carries the flag, or is listed in `PRAYER_NON_ANSWERING` with a one-line reason.
- **S2:** every quantity in the snapshot has a row for both directions and both crossed states, or a declared `—`.
- **S3:** every market row has `progression.tier` 2 and resolves a price.

## UI pillar

*Screenshot tool: Playwright for the place page, Covenants list, Needs-you list, receipt toast and dialog, and chronicle (all DOM). Claude-in-Chrome for the Trouble lens's Prayer mark (WebGL), only when lenses II is on main.*

### Player-facing display

1. **Place page, prayer line (S1).** One sentence under the Fortunes row of [hunger and unrest](2026-10-16-thr-1934-hunger-and-unrest.md) while a prayer is open. A faithful town shows "Millbrook keeps faith with you." (or the wavering line) in the same slot when no prayer is open. It is the same line the Covenants list shows, from the same resolver. The god's name routes through `useRefRouter`.
2. **Covenants list (S1).** A faithful town appears as a covenant like any source the god controls. Its line is the faith line, not the source-tier word, so "dormant" never names a town's faith.
3. **Needs you (S1, when the frame is on main).** A `prayer` producer in `NEEDS_YOU_PRODUCERS` (the screen frame plan § F5) gives one row per open prayer, in the asks group: the prayer line, a link to the town, and the days left in words ("two days left"). It never pauses time. **Before the frame lands**, the prayer's chronicle event carries `notification: { channel: 'alert' }`, which the frame's News group reads first (the screen frame plan § F5). The chronicle line and the place page carry it in the meantime. Whichever of S1 and the frame's slice 3 lands second adds the producer.
4. **Trouble lens (S1, when lenses II is on main).** A **Prayer** mark, gold and one badge, on the hex of a town with an open prayer to the player. Whichever of S1 and [lenses II](https://linear.app/threadbare/issue/THR-1898) lands second adds it.
5. **Receipts (S2).** The `economy` rows under the land line; the dialog on a crossed band; the toast otherwise.
6. **Cards (S3).** Three market cards in the omen market's tier-2 rung, with their effect lines.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Place page, open prayer | "Millbrook prays to the Shepherd for bread. Answer it with a card that feeds it or calms it. Two days left." · tooltip `ui.prayer`: "A hungry town on your ground is asking for help. Answer it and, if it recovers, it keeps faith with you: a small, steady gift of essence. Ignore it and a rival may answer instead." | PC-1, PC-2 | It says what the town wants, what answers it, and the deadline in words. The tooltip names both outcomes before the choice (Law 16). |
| Needs-you row | "Millbrook prays to the Shepherd for bread." + "two days left" | PC-5, PC-6 | The one Needs-you entry for a hungry town (the visibility decision § 7); there is no second On-the-edge entry. Word for word the same as the place page, the chronicle and the lens hover. **The one deliberate exception:** when the town also bears On the edge, every prayer surface shows the visibility decision's verbatim line, "Millbrook prays for bread, and is on the edge of turning from House Ashfold.", which drops the god's name to fit the holder's. |
| Receipt line on answering | "The Shepherd hears Millbrook." | PC-8 | The cast says it was heard, in the same receipt as the card's own lines. |
| Receipt line, unbidden aid | "Ferris did not pray to the Shepherd, but it will remember who fed it." | PC-8 | Within the same receipt; it promises memory (the Dominion push), not faith, so nothing appears in Covenants that it did not claim. |
| Chronicle, help that did not take | "The Shepherd's help reached Millbrook, but its hunger did not break. It gives no thanks." | PC-2 | The result of an answered prayer that never recovered: the player learns why no faith formed. |
| Trouble-lens hover, Prayer mark | "Prayer: Millbrook prays to the Shepherd for bread." | PC-5, PC-6 | The same words as the place-page line and the Needs-you row, from one resolver. |
| Chronicle, faith forms | "Millbrook gives thanks to the Shepherd, and keeps faith with you." | PC-3 | Fires once, when the source is written; the Covenants list shows the town in the same tick (Law 56). |
| Covenants line | "Millbrook keeps faith with you." · wavering: "Millbrook's faith wavers: its bread is short." · tooltip `ui.faithful`: "The people of a town you helped. Their faith feeds you while they eat, and fails if they starve." | PC-1, PC-6 | Reads the source bag and its sanctity. The wavering threshold is the same constant on both surfaces, so they cannot disagree. |
| Chronicle, ignored | "No answer came to Millbrook. The Ember King has heard its prayer instead." | PC-2 | The cost of silence is a rival's raid, named in words; the next raid on the town confirms it. |
| Chronicle, lapse | "Millbrook's faithful have turned away from the Shepherd." | PC-3 | The town leaves the Covenants list in the same tick. |
| Receipt, crossed band (S2) | "Ferris has gone lawless." (dialog) | PC-8 | The visibility decision's words. |
| Receipt, inside a band (S2) | "Its people's anger cools." (toast) | PC-8 | Direction only, no number (Law 15's delta glyph). |
| Card, Bless the Holding (S3) | "For a year, House Ashfold draws half again from Ferris." | PC-2 | The length is named in the game's own calendar (choice 7). |
| Empty slots | No god name → "your god". No rival → "another power". No days-left word (a broken window) → the clause is dropped. No town name → the line is dropped. | PC-3 | Each slot has a declared fallback or drops its line (Law 14). |

### Playtest signal

A warm tester whose god holds ground with a hungry town nearby can say, unprompted, that the town asked for help and what answering it did. **Watch item:** the tester must never read a prayer as an interrupt or a demand they were punished for missing. The loss is a rival's raid, told in words.

### Event notifications

Five chronicle lines in S1 (prays, thanks, help that did not take, ignored, lapse) and the starve line. All are `narrative` TickEvents at significance `PRAYER_CHRONICLE_SIGNIFICANCE`. The prayer line also carries `notification: { channel: 'alert' }`. There is no popup and no interrupt.

### Debug inspection (DebugPanel)

- **`window.__DEBUG.getPrayers(): Promise<Array<{ eventId: string; townId: string; status: PrayerStatus; openedTick: number; closesTick: number; answeredTick: number | null }>>`** (S1).
- **`window.__DEBUG.getFaithful(): Promise<Array<{ townId: string; sanctity: number; wavering: boolean; sphere: SphereName }>>`** (S1).
- **`window.__DEBUG.forcePrayer(townId): Promise<boolean>`** (S1). It opens a prayer at a town, ignoring the hunger gate, for review. This is a review lever like `?spawn=` and is listed in `src/debug-bridge.d.ts`.
- The Economy debug tab gains a **Prayers** table (town, status, days left, slighted until) (S1).

### Visual presence (HexMapV2)

The Prayer mark only, in the Trouble lens (§ Player-facing display 4). The plain map stays quiet (THR-1830's lens grammar).

### UI Laws engaged

| Law | Verdict |
|---|---|
| 1 / 17 | `ui.prayer` and `ui.faithful` are registry tooltips. Build obligation. |
| 13 / 14 | Words only; every slot has a fallback or drops its line. |
| 15 | Receipts use the delta glyph; no number. |
| 16 | The prayer and Bless the Holding name their outcome and length before the choice. |
| 21 | Town, god, rival and holder names route through `useRefRouter`. Build obligation. |
| 25 / 53 | Needs you shows a prayer row only while a prayer is open. |
| 33 | One line on the place page and one Covenants row; nothing new competes for space at 1920×1080. |
| 37 | N/A. No multi-beat flow. |
| 56 | Every line reads written state: the prayer event, the source bag, the `blessed` edge, the snapshot diff. |
| 58 | Receipt rows and prayer lines are one entry per kind with completeness tests. |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/engine/prayers.ts` (new: `openPrayers`, `closePrayers`, `answerPrayer`, `formFaithful`, `isHungryForPrayer`) | `prayer` (new, daily) | place page, Covenants, Needs you, chronicle | prayer events, settlement props | `prayer.*` | `__DEBUG.getPrayers`, `getFaithful`, `forcePrayer`; Economy tab |
| `src/data/prayer-constants.ts`, `prayer-content.ts` (new) | — | — | — | — | — |
| `unifiedActionResolution.ts` (answer hook) | player cast | receipt | `pendingSpherePressures` | `prayer.answered`, `prayer.unbidden` | trace viewer |
| `essenceEconomyBridge.ts` (staple rule) and `essenceSources.ts` (lapse) | essence sources | Covenants | source bag | `prayer.faith_lapsed` | `getFaithful` |
| `orchestrator.ts` (`landRivalProbe`, `selectSchemeTarget`, crack) | rival actions | chronicle | `prayerSlightedUntilTick` | `prayer.slight_landed`, `prayer.faith_starved` | trace viewer |
| `graphOpExecutor.ts` (extract the consecrate helper) | — | — | — | — | — |
| `castTargetChanges.ts`, `playerReceipts.ts` (S2) | player receipts | receipt toast and dialog | aftermath changes | `receipt.economy` | trace viewer |
| templates, control effects, purse, holding income (S3) | control effects, purse, holding income | cards | `blessed` edges, `marketsOpenedTick` | `prayer.blessed_holding`, `prayer.claim_income` | Economy tab |
| `views/needsYou.ts` (`prayer` producer, when present) | — | Needs you | — | — | `__DEBUG.getView('needsYou')` |
| `LocationView.tsx` / the Inspector's place section; Covenants list | — | place page, Covenants | reads | — | browser evidence |

**Prose pipeline:** prayer lines through a pure resolver in `prayers.ts` that fills slots from live nodes; receipt rows through the S2 resolver; never `enrichProse`. **Player controls:** the existing cards; a prayer is answered by casting, not by a new button.

**Order.**
- **S1 is blocked by [hunger and unrest](https://linear.app/threadbare/issue/THR-1934)** (S1 of that plan: the `restless` trait and `unrestInputs` are the prayer's gate).
- **S2** has no hard blocker. It reads band words that exist when it lands, and a missing one reads `null`. It is mutex with mortal wealth S1 on the `economy` kind, and whichever lands second adopts.
- **S3 is blocked by [mortal wealth](https://linear.app/threadbare/issue/THR-1936)** (`economy_shift` and Means for every mortal) **and [undertakings in the economy](https://linear.app/threadbare/issue/THR-1937)** (a Shadow founder's thieves' guild). It follows S2 for the new cards' receipt lines.

## Interface impact

`Docs/canon/interface-map.md` lists Essence & Divine Economy, Mortal Economy & Prosperity and Rivals as audit-on-touch. Contracts:

| Contract | Kind | Production read site |
|---|---|---|
| `hungry-town-prays-on-gods-ground` (prayer event + `occurred_at`; reads `restless`, `unrestInputs`, Dominion) | **add** (S1) | `prayer` phase; place page; Needs you |
| `answered-prayer-pushes-dominion` (`pendingSpherePressures`, `'prayer_answered'` / `'unbidden_aid'`) | **add** (S1) | `phaseSpherePressure` |
| `recovered-town-keeps-faith` (`faithfulCommunity` source + `controls`) | **add** (S1) | `computeSourceIncome`; `chargeSourceUpkeep`; Covenants |
| `faithful-sanctity-reads-staples` | **add** (S1) | `computeSanctitySustenance` |
| `slighted-town-heads-rival-raids` (`prayerSlightedUntilTick`) | **add** (S1) | `landRivalProbe`, `selectSchemeTarget` |
| `starve-faithful-drains-faith` | **add** (S1) | the crack runner |
| `economy-receipt-from-cast-snapshot` | **add** (S2) | `decidePresentation`; receipt toast and dialog |
| `blessed-holding-multiplies-yield` (`blessed` edge) | **add** (S3) | `townTaxOf`; `collectHoldingPayments` |
| `claim-resource-pays-good-sphere` | **add** (S3) | control effects |
| `raid-throttle` (`raidAllowanceLeft`) | **preserve** | unchanged |

`scripts/interface-contracts.ts` gets the same rows. `Docs/canon/systems-inventory.md`'s Essence Sources row gains "faithful towns from answered prayers", and its Rivals row gains "a slighted town first". The Design Reference Wiki pages whose `sources` match `essenceSources.ts`, `essenceEconomyBridge.ts` and `playerReceipts.ts` are updated in the slice that edits them.

**UL:** *Prayer* (a hungry town's appeal to the god whose ground it stands on) and *Faithful* (a town that keeps faith with a god; code `faithfulCommunity`) are new player words. S1 files one `UL-proposal`, which also records that *Congregation* stays the Temple faction (choice 8).

## Constants table

All in `src/data/prayer-constants.ts` unless noted.

| Constant | Default | Purpose |
|----------|---------|---------|
| `PRAYER_ENABLED` | `true` | Master switch for S1 and the rollback lever |
| `PRAYER_MIN_BAND` | `'touched'` | The god's band a town must read to pray (the decision) |
| `PRAYER_ANSWER_WINDOW_DAYS` | `6` | Days a prayer stays open (the decision) |
| `PRAYER_COOLDOWN_DAYS` | `30` | Days between a town's prayers; one game year (the decision; choice 7) |
| `PRAYER_MAX_OPEN` | `1` | Prayers the god can have open at once (calibration ruling 2026-10-17) |
| `PRAYER_GOD_GAP_DAYS` | `7.5` | Days between any two prayers the god hears; one season, so at most 12 in 90 days (calibration ruling 2026-10-17) |
| `ANSWERED_PRAYER_DOMINION_PRESSURE` | `2` | One-shot push on answering, split by bought points (the decision) |
| `UNBIDDEN_AID_DOMINION_PRESSURE` | `1` | One-shot push for aid off your ground (the decision) |
| `PRAYER_RECOVERY_WINDOW_DAYS` | `30` | Days after an answer in which recovery forms a faithful town (the decision) |
| `FAITHFUL_COMMUNITY_MAX` | `4` | Faithful towns a god can hold (§ Measurement) |
| `FAITHFUL_INITIAL_SANCTITY` | `0.5` | A new faithful town's faith: the land's nurture ceiling (`ECON_SANCTITY_NURTURE_CEILING`, imported) |
| `FAITHFUL_WAVERING_SANCTITY` | `0.2` | Below this the faith reads "wavers" |
| `FAITHFUL_LAPSE_SANCTITY` | `0` | At or below this the faithful turn away |
| `PRAYER_SLIGHT_DAYS` | `10` | How long an ignored town stays first on the rival's list |
| `STARVE_FAITHFUL_SANCTITY_DRAIN` | `0.25` | The crack's faith drain |
| `PRAYER_CHRONICLE_SIGNIFICANCE` | `3` | Chronicle significance of the prayer lines (the Dominion daily lines' value) |
| `PRAYER_FLOOD_LINE` | `12` | Kill line: prayers per seed in 90 days above this flood the player |
| `PRAYER_NON_ANSWERING` | `[]` | Templates that write staples or calm unrest but do not answer, each with a reason (completeness test) |
| `ECONOMY_RECEIPTS_ENABLED` | `true` | S2 switch |
| `BLESS_HOLDING_YIELD_MULT` | `1.5` | S3: the blessed holding's multiplier (the decision) |
| `BLESS_HOLDING_DAYS` | `30` | S3: length of the blessing; one game year (the decision; choice 7) |
| `CLAIM_RESOURCE_PAYS_GOOD` | `true` | S3: Claim Resource pays in the good's sphere |
| `CLAIM_RESOURCE_BASE_INCOME` | `0.5` | S3: today's number, kept |
| `CLAIM_RESOURCE_TIER_MULT` | scarce `0.5` · adequate `1` · surplus `1.5` | S3: income by the good's stock tier (the decision) |
| `THIEVES_GUILD_OFFER_DAYS` | `10` | S3: days the boost lasts after the delay |
| `THIEVES_GUILD_OFFER_WANT` | `1.5` | S3: board multiplier on `create × faction` for a Shadow-led resident |
| `LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD` / `…_DELAY_TICKS` (`location-action-constants.ts`) | `75` / `8` | Existing; S3 gives them their reader |

## Tracing

```ts
// prayer.opened — S1, once per prayer
interface PrayerOpenedTrace {
  type: 'prayer.opened';
  tick: number;
  townId: string;
  eventId: string;
  band: DominionBand;
  unrest: number;
  hunger: number;                 // unrestInputs.hunger
  largestInput: 'hunger';
  closesTick: number;
}

// prayer.answered / prayer.unbidden — S1, the answer hook
interface PrayerAnsweredTrace {
  type: 'prayer.answered' | 'prayer.unbidden';
  tick: number;
  townId: string;
  eventId: string | null;         // null for unbidden aid
  templateId: string;
  actionId: string;
  pressure: number;               // 2 or 1
  split: Partial<Record<SphereName, number>>;
}

// prayer.closed — S1, daily close
interface PrayerClosedTrace {
  type: 'prayer.closed';
  tick: number;
  townId: string;
  eventId: string;
  status: 'unanswered' | 'recovered' | 'unrecovered';
  faithFormed: boolean;
  skipped: 'cap' | 'hosts_source' | 'helper_failed' | null;
}

// prayer.faith_lapsed / prayer.faith_starved — S1
interface FaithChangeTrace {
  type: 'prayer.faith_lapsed' | 'prayer.faith_starved';
  tick: number;
  townId: string;
  sanctityBefore: number;
  sanctityAfter: number;
  cause: 'hunger' | 'rival_scheme';
  rivalId: string | null;
}

// prayer.slight_landed — S1, a rival lands on a slighted town
interface SlightLandedTrace {
  type: 'prayer.slight_landed';
  tick: number;
  townId: string;
  rivalId: string;
  via: 'raid' | 'scheme';
}

// receipt.economy — S2
interface EconomyReceiptTrace {
  type: 'receipt.economy';
  tick: number;
  actionId: string;
  targetId: string;
  changes: Array<{ quantity: string; from: string | null; to: string | null; crossed: boolean }>;
  presentation: 'modal' | 'toast';
}

// prayer.blessed_holding / prayer.claim_income — S3
interface DivineYieldTrace {
  type: 'prayer.blessed_holding' | 'prayer.claim_income';
  tick: number;
  targetId: string;
  holderId: string | null;
  sphere: SphereName | null;
  mult: number;
}
```

All are registered in `src/types/trace.ts`.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `restless` trait or `unrestInputs` absent (hunger and unrest not on main) | No town prays. Not reachable in practice, because S1 is blocked by it |
| The player god cannot be resolved | The `prayer` phase is a no-op that tick, traced |
| `dominionOf` throws | That town is skipped |
| A prayer event's town is gone | The prayer closes as `'unrecovered'`; no write |
| The consecrate helper fails | No source; the prayer is `'recovered'` with `skipped: 'helper_failed'`; one `console.warn` |
| The town already hosts a source | No second source (one bag per host); thanks line without faith |
| `splitByPoints` returns no spheres | The push goes to the god's primary |
| A faithful town's host has no staples | The score is 0, so no drift; the faith holds |
| Slighted town no longer in turf | Ignored; the weighted pick runs |
| Snapshot field unreadable (S2) | That quantity is left out; the receipt proceeds |
| `economy` kind present twice (S2 and mortal wealth landing together) | The typecheck fails the second PR; it adopts the first's |
| Means absent on a target (S3, old save) | `readWealth` reads 0; Favour moves to the first band's floor |
| `blessed` edge on a place no one holds | Inert; swept at `untilTick` |
| Claimed good has no resource class | Today's `{ matter: 0.5 }` |
| `create × faction` not on a resident's board | The boost is a no-op; nothing is added |
| Needs you or the Trouble lens not on main | The chronicle and place page carry the prayer; the producer and mark wait |

## Blast Radius

`src/engine/orchestrator.ts`, `src/engine/unifiedActionResolution.ts` and `src/types/unifiedAction.ts` are wide.

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | wide | One flag value; the `economy` kind (owned by mortal wealth); `incomeFrom?` on `ControlSpec`. All additive |
| `src/engine/unifiedActionResolution.ts` | wide | One hook beside the existing Dominion writers |
| `src/engine/orchestrator.ts` | wide | One phase registration; a pre-pick in two target functions; one crack write |
| `src/types/sphereAffinity.ts` | moderate | Two `PressureSource` members; exhaustive switches over the union need two cases, and the typecheck ratchet finds them |

## Game Design Laws check

- **Law 12** (the thread runs both ways): a hungry town asks; the god answers; the town gives back. This is what the decision was for.
- **Law 16** (show the stakes before the choice): the prayer line and tooltip name both outcomes; Bless the Holding names its length.
- **Law 22** (no outcome is dead air): every close has a line. Unanswered → the rival line; recovered → thanks; answered but not recovered → "its hunger did not break", plus the Dominion push it already earned; unbidden aid → its receipt line.
- **Law 24** (failure never loops): ignoring a prayer costs no essence. A lapsed faith can be won again after the cooldown.
- **Law 41** (one vocabulary): pressure through `pendingSpherePressures`, sources through the consecrate helper, Means through `economy_shift`, purses through `townTaxOf`. No new funnels.
- **Law 42** (simple frameworks): the faithful town is an ordinary essence source with one scoring rule; the cards are data rows.
- **Law 43** (one concept per thing): "Faithful", not "Congregation" (choice 8).
- **Law 45** (never promise what the world will not do): Open the Markets' thieves' guild and *starve the faithful* finally do what they say.
- **Law 56** (chips are state): every line reads a written record.
- No random draw added.

## Three-pillar check

- [x] Engine pillar present (prayer, answer, faithful source and its bread rule, lapse, rival answer, the crack's drain, receipts' snapshot and presentation, three cards, Claim Resource pay, the thieves' guild boost)
- [x] Content pillar present (prayer lines, receipt rows, card text, three data tables with completeness tests; encounters and attachments N/A with rationale)
- [x] UI pillar present (place page line, Covenants line, Needs-you producer, Trouble-lens mark, receipt dialog and toast, market cards, debug)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves *the god works through the world, not on it*: the god cannot make a town worship. It can only answer when the world asks. It also serves *mechanics surface through prose, never numbers*.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes a rule of play: hungry towns on the god's ground pray; answering pushes Dominion; a recovered town becomes a faithful essence source that rides its bread; an ignored prayer draws a rival; three new market cards; Claim Resource pays in the good's sphere.
- [x] `Docs/canon/rulebook.md` is updated in the build PRs. S1 adds a paragraph after the Influence Essence paragraph (`:198`, "worshippers" now has its mechanism) and a sentence in the rival schemes paragraph (`:393`). S3 adds one sentence each for the cards and Claim Resource. The quick reference's Influence Essence line gains "faithful towns" in S1.

> Brainstorm companion: `Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 22 named constants in one file plus two existing ones given readers; the cap and lapse are numbers |
| 2. Inspectability | PASS | Prayers are graph events with a status; seven trace interfaces covering eleven trace types; three debug accessors; a Prayers table |
| 3. Determinism | PASS | No new PRNG; the slighted-town pick consumes no draw |
| 4. Fail-soft | PASS | Every missing input skips its write; the hunger gate's absence means no prayers |
| 5. Narrative over mechanical perfection | PASS | The faith rides the bread in words; the rival's answer is told |
| 6. Additive over destructive | PASS | New props, flags and union members; three master switches; one source kind gets its first writer |
| 7. Performance budget | PASS with note | The `prayer` phase is daily over place-tier settlements (dozens); the snapshot extension runs once per player cast. S1's `test:heavy` run confirms tick time within noise |

## Kill criteria

- **S1:** if a 1,080-tick run on seeds 42, 99 and 7 (medium) with hunger and unrest on opens **no** prayer on a seed where some day had a town passing the four-part gate (Restless, hunger largest, Touched+ on the god's ground, cooldown clear), the gate is too narrow. Post the census of Restless towns by band on the issue and stop. A seed with no such town ever opens none correctly: the census god never casts or claims, so its ground does not grow (calibration ruling 2026-10-17; seed 7's first census had Restless towns only in Foreign and Hostile bands).
- **S1:** if any seed opens more than `PRAYER_FLOOD_LINE` (12) prayers in 90 days, prayers flood the player. `PRAYER_GOD_GAP_DAYS` makes 12 a hard ceiling, so a count above it is a defect in the god-wide gate, not a tuning question. *(Superseded remedy: the first census showed that raising `PRAYER_MIN_BAND` to `'held'` would not cut seed 99, whose praying towns were already Held or Sovereign, and would take seed 42 to zero.)*
- **S1:** if the real model run (`npm run model:power -- --model faith --check`) puts any god outside [10.5, 13.5] at day 90 with four faithful towns, lower `FAITHFUL_COMMUNITY_MAX` to 3.
- **S2:** if more than half of all player casts in a 300-tick review open the receipt dialog, the crossed-band rule is too eager; report the quantity that crosses most.

## Done when

Predicates on medium maps over the stated ticks.

**S1 (this ticket)**

- [ ] **Prays:** on a fixture town that is Restless with hunger as its largest input and Touched on the god's Dominion, one prayer event opens with `occurred_at` → the town. A second does not open inside `PRAYER_COOLDOWN_DAYS`. A Foreign town in the same state opens none (unit tests).
- [ ] **Answers:** a successful `loc.bless_harvest` on a praying town writes `participated_in` god → prayer and queues pushes summing to 2, split by bought points. A failed cast does neither (tests).
- [ ] **Unbidden aid:** the same cast on a hungry Foreign town pushes 1, forms nothing, and a second cast within the cooldown pushes nothing (test).
- [ ] **Faith forms:** an answered town that loses `restless` within 30 days hosts a `faithfulCommunity` source of the god's primary at sanctity 0.5, and the Covenants list shows it. A fifth such town forms no source (tests).
- [ ] **Faith rides the bread:** a faithful town with all staples scarce loses sanctity each tick, and with adequate staples holds it. At 0 the source and its `controls` edge are gone and the lapse line fires (test).
- [ ] **The rival answers:** an unanswered prayer's town is the next landing of `landRivalProbe` when it is in turf, inside the throttle (test with a fixed seed: the landing count is unchanged and the target is the town).
- [ ] **Starve the faithful:** the economic crack on a faithful town drops its sanctity by 0.25 (test).
- [ ] **Census:** a 1,080-tick run on seeds 42, 99 and 7 opens at most 12 prayers per seed and at least one on every seed where some day had a town passing the four-part gate; at least one seed opens a prayer. The PR body quotes the counts, the gate-passing towns per seed, and the faithful towns formed.
- [ ] **One at a time:** on a fixture with two towns passing the gate the same day, only the hungrier opens a prayer, and the other's `lastPrayerTick` is unchanged. Neither opens again until `PRAYER_GOD_GAP_DAYS` have passed since that opening, and then the other town, if still hungry, opens (unit test).
- [ ] **Model:** `npm run model:power -- --model faith --check` passes with four faithful towns.
- [ ] **Rollback:** with `PRAYER_ENABLED = false`, a 300-tick run on seed 42 matches main in every essence source and every sphere-pressure event.
- [ ] In the browser, `?view=game&seeded&size=medium`, with `await window.__DEBUG.forcePrayer(<a Touched town>)`, shows the prayer line on the town's place page. Casting Bless the Harvest there shows "The Shepherd hears …" in the receipt, and `await window.__DEBUG.getPrayers()` shows that prayer `'answered'`. Four-part browser evidence: 1920×1080 screenshot of the place page, console clean, the debug assertion, and a UI-Laws line for Laws 1, 13/14, 17, 21, 33, 37, 56.

**S2 (filed)**

- [ ] Bless the Harvest on a struggling town that it lifts to modest opens the dialog with "… is no longer struggling: it is modest again."; Open the Markets on a calm town rides the toast with "Its people's anger cools." (tests + browser).
- [ ] One `economy` kind exists in `src` (grep), and the receipt row and the Fortunes row agree after a cast (test).
- [ ] `loc.guide_caravan`'s card and step carry the same Reach (test).

**S3 (filed)**

- [ ] Fortune's Favour on a mortal at Means 45 leaves them at 60 ("Wealthy"); Ruin at 45 leaves them at 39 ("Getting by") (tests).
- [ ] Bless the Holding on a faction-held town raises that town's tax term by half in the next `economy.purse.day` trace and ends at `untilTick` (test).
- [ ] Claim Resource on a surplus grain hex pays 0.75 Life a tick, and on a scarce one 0.25 (test).
- [ ] In a 600-tick run where Open the Markets lifts a town to 75, a Shadow-led resident's board carries the boosted `create × faction` (trace), and any guild founded is `guildType: 'thieves'`.

**Every slice**

- [ ] Interface contracts, systems inventory, the wiki pages and the rulebook lines updated in the slice that changes them.
- [ ] `npm run gate` green (code track: tests, typecheck ratchet, build, 30-tick CLI smoke, `test:heavy`); `npm run gate -- --final` last before push.
- [ ] Closing commit body and PR body carry the line-anchored closer for that slice's issue.

## Slices

| Slice | Ticket | Builds | Blocked by |
|---|---|---|---|
| S1 | this ticket | prayer, answer, unbidden aid, faithful towns and their bread rule, lapse, the rival's answer, the crack's drain, place page and Covenants lines, chronicle, debug, the `faith` model, the UL proposal; the Needs-you producer and Trouble mark if their hosts are on main | [hunger and unrest](https://linear.app/threadbare/issue/THR-1934) |
| S2 | filed at handoff | the `economy` receipt snapshot, diff and presentation; the receipt rows; Guide the Caravan's Reach | — (mutex with mortal wealth S1 on the kind) |
| S3 | filed at handoff | Fortune's Favour, Ruin, Bless the Holding; Claim Resource pay; the thieves' guild boost | [mortal wealth](https://linear.app/threadbare/issue/THR-1936); [undertakings in the economy](https://linear.app/threadbare/issue/THR-1937); S2 |

## Coordination block

**Suggested model:** opus — a new daily phase and three cross-system hooks (cast resolution, essence nurture, rival targeting) in wide files; each is small, but the order with three unbuilt upstream plans needs care.

**Blocked by:** [hunger and unrest](https://linear.app/threadbare/issue/THR-1934). The prayer's gate is that plan's `restless` trait and `unrestInputs`.

**Parallel-safe with:** [the type and icons rollout](https://linear.app/threadbare/issue/THR-1879) and the icon sweeps (UI-only files); [undertakings in the economy](https://linear.app/threadbare/issue/THR-1937) S1 (no shared files).

**Mutex with:** any build editing `essenceEconomyBridge.ts` or `essenceSources.ts`; the rival-targeting functions in `orchestrator.ts` (`landRivalProbe`, `selectSchemeTarget`); [the screen frame](https://linear.app/threadbare/issue/THR-1875) slice 3 (`views/needsYou.ts`: whichever lands second adds the producer); [lenses II](https://linear.app/threadbare/issue/THR-1898) (the Prayer mark); [the Inspector](https://linear.app/threadbare/issue/THR-1876) place section (the prayer line moves with the place page). S2 with mortal wealth S1 (`types/unifiedAction.ts` change kinds).

**Files to touch:** (slice S1; S2 adds `castTargetChanges.ts`, `playerReceipts.ts`, `economy-receipt-content.ts` and the Guide the Caravan row; S3 adds three template rows, the control-effects resolver, `factionPurse/income.ts`, `holdingIncome.ts` and the board boost):
- Create: `src/engine/prayers.ts`, `src/data/prayer-constants.ts`, `src/data/prayer-content.ts`, `src/engine/__tests__/prayers.test.ts`, `src/data/__tests__/answersPrayer.test.ts`
- Edit:
  - `src/engine/orchestrator.ts` (phase; rival pre-pick; crack)
  - `src/engine/unifiedActionResolution.ts` (answer hook)
  - `src/engine/essenceEconomyBridge.ts` (staple rule)
  - `src/engine/essenceSources.ts` (lapse)
  - `src/engine/graphOpExecutor.ts` (extract the consecrate helper)
  - `src/types/sphereAffinity.ts` (two sources)
  - `src/types/unifiedAction.ts` (flag)
  - `src/data/unified-action-templates.ts` (two flags; the sanctify target filter)
  - `src/components/Game/LocationView.tsx` (prayer and faith line)
  - the Covenants list component
  - tooltip registry (`ui.prayer`, `ui.faithful`)
  - `src/types/trace.ts`
  - `src/debug-bridge.ts` + `src/debug-bridge.d.ts`
  - `src/components/Game/debug/EconomyDebugTab.tsx`
  - `scripts/power-progression-model.mjs` (`--model faith`)
  - `scripts/interface-contracts.ts`
  - `Docs/canon/systems-inventory.md`
  - `Docs/canon/rulebook.md` + quick reference
  - `Docs/plans/wiring-checklist.md` (a *God's stake* section)
  - `public/wiki-manifest.json` + the matching wiki pages

## Notes for the executor

- **The model overlay** (S1 adds it as `--model faith` in `scripts/power-progression-model.mjs`): in `simulateDominion`, take a `faithTicks` list. At each listed tick, push a source `{ sanctity: 0.5, flowering: false, claimed: false, faith: true, m: match0.Touched, m0: match0.Touched }`. Value it at base 0.3 instead of `placeOfPower`. Exclude faith sources from the sanctify step's `dormant` pick and from the flowering count. Sweep 0, 1, 2, 3, 4 and 6 towns. `--check` asserts four towns stay inside [10.5, 13.5] for every god. The design-lane run's numbers are in § Measurement.
- **Never write a god id onto the town.** The prayer is an event node; the answer is the god's `participated_in` edge; the faith is the god's `controls` edge to the source host (Vision non-negotiable #4).
- **Read the god's primary by bought points** (as upkeep does), not `getAscendantPrimarySphere`, so the faithful town pays into the pool its upkeep comes from.
- **One bag per host.** A town that already hosts a source (a seeded place of power or a shrine) does not become a faithful community; it gives thanks only.
- **Do not reopen [the card tiers](https://linear.app/threadbare/issue/THR-1794).** The six Wellspring gifts stay where they are.
- `migrationPullUntilTick`'s reader belongs to [hunger and unrest](https://linear.app/threadbare/issue/THR-1934)'s Restless leaving, not to this plan.
- The decision's monopoly and lane notes (Reveal the Vein and Sour Mine name a broken monopoly; no lane verb) are carried by S2's receipt rows and [war aims](https://linear.app/threadbare/issue/THR-1933)' monopoly record. There is no new verb.

## Intent-judge verdicts

| Pass | Verdict | Findings | Disposition |
|---|---|---|---|
| 1 | **Revise** (Reversible) | dim 4 GAP: the measurement row rounded 13.52 to 13.5 against an inclusive band; dim 12 GAP: no quoted words for the Trouble-lens Prayer hover, the unbidden-aid receipt or the `'unrecovered'` close; the faith line differed between the place page and Covenants | All fixed: unrounded incomes and the band stated as the model checks it; three lines added to the prose and player-text tables; one faith line from one resolver; the Law 22 line now lists a line for every close |
| 2 | **Revise** (Reversible) | dim 12 GAP: the Needs-you row dropped the god's name that the other surfaces carry | Fixed: the row matches word for word, and the On-the-edge line is declared the one exception |
| 3 | **Allow** (Reversible) | advisory: the On-the-edge row's Where column named two surfaces, not all four | Taken: the column now names every prayer surface |

## Forked-audit verdicts

Run 2026-10-17 (design lane, sonnet auditors) on the draft that the intent judge allowed.

### NFP audit

**PASS-with-notes.** Tunability, Determinism and Narrative PASS. Inspectability PASS-with-note: the NFP row counted "eight trace types" against seven interfaces covering eleven trace type strings. *Fixed: the row now says so, and three debug accessors.* Fail-soft PASS-with-note: a consecrate-helper failure was labelled `hosts_source`. *Fixed: a separate `skipped: 'helper_failed'`.* The duplicate-kind row is a build-time fallback by design: the typecheck stops a second `economy` kind. Additive PASS-with-note: the helper extraction, Claim Resource's pay change (behind `CLAIM_RESOURCE_PAYS_GOOD`), the Sanctify exclusion and one deleted unread constant are all intended. Performance PASS-with-note: confirmed in S1's `test:heavy` run.

### Three-pillar audit

**PASS.** Engine, Content and UI are present and substantive, and no required section is missing. Wiring ties each module to a phase, UI, state, trace and debug surface. The one loose cell ("the Covenants list component") is left for the executor, who must locate it. The Substrate inventory extends Essence & Divine Economy and activates the declared `faithfulCommunity` kind, the dormant thieves' guild constants and the declared `blessed` edge. There is no green-field duplication.

### Vision audit

**PASS-with-notes.** No contradictions. It confirms non-negotiables #1, #2, #3 and #7, and extends #4 (prayer as an event node; answer and faith as edges) and the north star's return channel (a town asks, the god answers, the town gives back). Soft note on design tension #3: a deadline ("two days left") plus a rival's raid could read as a demand rather than an invitation. The plan already carries it as the playtest Watch item, and ignoring a prayer costs no essence. Soft note: the Measurement numbers are design-side only and never reach the screen.
