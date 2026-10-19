> **title:** Hiring a free company — a realm buys a company's oath, then pays, feeds and commands the host it fields — THR-1974
> **linear_issue:** THR-1974
> **author:** Claude Code (design lane, unattended, run 2026-10-19)
> **created:** 2026-10-19
> **three_pillars:** Engine done · Content done · UI done

# Hiring a free company — THR-1974

*A realm buys a free company with silver. From then on it pays the company's soldiers when the company cannot, lets them eat from its towns, and sends them against its own enemies. When the coin stops, the company leaves.*

## Why this is load-bearing

The world has two free companies per map. Their own definition promises that their "loyalty lasts as long as the contract" (`src/data/mercenary-company-definition.ts:37`), but no faction can hire one. Measured on main today (§ Measurements), each company starts with a host and earns well under the host's upkeep. It goes broke by about day 20, its host deserts, and it never raises another. From day 30 on, both companies on every seed measured are armies of nobody and swords for nobody.

[Mercenary hire](https://linear.app/threadbare/issue/THR-1939) decided what a hire is: **the crown's bought oath, with no new edge and no contract system**, and four general rules that make an oath carry an army. That decision was made by the design lane under delegation on 2026-10-18T01:32Z. Its veto day closed 2026-10-19T01:35Z with no veto (the briefing's *From Christian* section was empty when this run started). It is settled input here and is cited inline where used. This plan writes those four rules into the built [crown](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-15-thr-1932-crown.md) and [war aims](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-15-thr-1933-war-aims.md).

**The four rules** ([THR-1939](https://linear.app/threadbare/issue/THR-1939)):

1. **The price is what a faction costs to keep.** A gift is worth 30 days of the larger of the faction's income and the upkeep of what it fields, or would raise if it fields nothing.
2. **The liege pays the soldiers.** On pay day, after a vassal pays its own armies, its liege covers whatever upkeep the vassal could not, before the fealty tax is taken.
3. **The liege feeds them.** An army whose upkeep the liege paid today may eat from the liege's held towns.
4. **The liege commands them.** An army the liege paid today takes the liege's enemies as its own. A vassal that pays its own armies keeps its own wars.

Leaving is already built. The crown's loyalty falls (liege broke, rival offer) end an oath when the coin stops or a richer lord outbids.

**Upstream state.** The decision's precondition, [Every army bleeds out within a week](https://linear.app/threadbare/issue/THR-1973), is **Done** (garrisoned armies heal; realms and free companies keep a standing army). The ticket's "blocked by" for the build is therefore cleared. The census below runs on that fix.

**How-level choices this plan made** (reasons in the [brainstorm companion](2026-10-19-thr-1974-hiring-a-free-company-brainstorm.md); each is invited for veto in the lane report):

1. Any faction that fields an army is priced on that army's upkeep if it exceeds its income. Only the *would raise if it fields nothing* fallback is limited to factions that keep a standing army (realms and free companies), so an armyless guild is still priced on its income.
2. Wages are paid inside the existing `crown` phase, after loyalty and before the tax.
3. The vassal's own purse record keeps its own verdict; the wage is written beside it.
4. A liege keeps two days of its own soldiers' pay back before it pays anyone's wages.
5. The liege's Means word counts the wages it paid yesterday.
6. Command **replaces** the army's banner for war (its commander's enemies, not a union of both).
7. Command includes defence: a hired host rides to hold its liege's and fellow vassals' towns.
8. Supply **adds** the liege's towns to the army's own.
9. No liege-funded raise in v1; it is the first lever if companies stay armyless (§ Kill criteria).
10. Two hired companies keep counting toward a Crown, as decided; the plan states the measured effect.

## Measurements

Census script and output: [`proto/thr-1974-hire-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1974-hire-census) (`scripts/proto/thr-1974-hire-census.ts` and `.output.txt`), never merged. Main @ 04ed4c85, medium map, 90 days, purse + crown + war aims + THR-1973 live, `initializeGameState` + `runTick`.

| Seed | Company | Day 1 | Day 30 | Day 90 | Reached by a courting realm | Sworn at day 90 |
|---|---|---|---|---|---|---|
| 42 | company 0 | host, purse 77, earns 0.40/day | host still fielded, purse 0.6 (about to desert) | no army, purse 7.7 | 45 of 90 days (from about day 45) | bought by faction_0 |
| 42 | company 1 | host, purse 77, earns 0.68/day | no army, purse 29 | no army, purse 2.6 | 90 of 90 | bought by faction_0 |
| 99 | company 0 | host, purse 77, earns 0.79/day | no army, purse 0.6 | no army, purse 8.2 | 90 of 90 | bought by faction_2 |
| 99 | company 1 | host, purse 77, earns 0.26/day | no army, purse 1.9 | no army, purse 2.8 | 84 of 90 | bought by faction_2 |
| 7 | company 0 | host, purse 77, earns 0.73/day | host, purse 0.1, persuaded by faction_2 | no army, purse 9.3 | 90 of 90 | persuaded by faction_2 |
| 7 | company 1 | host, purse 77, earns 0.40/day | no army, purse 5.4 | no army, purse 3.0 | 90 of 90 | bought by faction_2 |

Courting realms' full income ranged from 4.4 to 18.2 coin a day across the three seeds.

**What the four "must measure" items found:**

1. **Price base when the company fields nothing.** Today the full gift is 30 days of *income*: 3 to 37 coin for a company. A company with no army earns 0.1–1.2 a day, so it is nearly free. Pricing on the upkeep of the army it would raise gives a floor of 45 coin for a warband and 105 for a host (the census used a warband as its fallback; the plan uses the size `spawnArmy` would pick). Every company fields a host at day 1. A full host-priced gift (105) is more than the 53.5 a host costs to raise (`ARMY_CREATION_GOLD_COST` 50 + one day's upkeep). So a company bought for a full gift can raise again from the gift alone. Today's gift shares are mostly 0.00, because only a realm holding more than `OATH_GIFT_RESERVE` (150) can offer one. The two that could (seed 99 faction_2 at 464, seed 7 faction_2 at 168) offered full shares by day 90.
2. **The liege's wage bill.** A host's shortfall is its upkeep (3.5) minus the company's own income (0.1–1.2): **2.3–3.4 coin a day per company**. Against a courting realm's full income (4.4–18.2), one company costs **13% to 77%** of that income. The richest realm on each seed pays 13–30%. A poor realm pays half or more: the shadow ledger peaked at 52% on seed 99's faction_1, and its shadow purse went below zero (−10.0). Seed 7's faction_1 hiring both companies drove its shadow purse to −7.7. Uncapped wages would therefore bankrupt a Getting-by realm within days. This is why the plan keeps a reserve (how-level 4) and keeps the kill criterion. The ledger only ran 2–4 days per company, because today every company's host deserts before or soon after day 10. The 13–77% band is the steady-state figure.
3. **Two hired companies and the Crown.** On the 10-day samples, 19 of 66 realm-samples (29%) held exactly one oath and reached a free company (seed 42: 4/22; seed 99: 12/26; seed 7: 3/18). In roughly three realm-samples in ten, then, one hire is enough to make a realm a Crown. The plan keeps the decision as made (companies count) and states this effect; the brainstorm (§ 10) names the one-row exclusion if Christian wants it.
4. **Courtable on all three seeds.** Yes. Every company is reached by at least one courting realm on 45–90 of 90 days, and every company ends up sworn on every seed (five bought, one persuaded). Presence excludes army members (`eligibility.ts:200`), but halls and non-army members are enough. The one late case is seed 42's company 0, reached from about day 45. The plan changes nothing in courting.

**The finding the ticket did not ask for:** from day 30 on, **no free company on any seed fields an army**, even with THR-1973 live. Each starts with a host, earns about a fifth of its upkeep, goes broke by about day 20 to 30, deserts, and cannot afford to raise again (purses of 2–30 coin against 53.5). Rule 2 stops this at the source for a company sworn before its money runs out (seed 7's company 0 was persuaded at day 30 with its host still in the field and its purse at 0.1). A company sworn after it has lost its host gets an army back only through a bought gift (finding 1). A persuaded or forced company with no army stays empty. That is brainstorm § 9 and the second kill criterion.

## Substrate inventory

Measured on this worktree at `origin/main` 04ed4c85, 2026-10-19. Citations are `path:line`.

| Existing subsystem | Status | This plan |
|---|---|---|
| Crown offer (`crown/offer.ts`: `affordableGift` :75-81, `giftCost` :84-86, both `OATH_GIFT_DAYS × income(C)`; `if (full <= 0) return 0` :77) | 🟢 ACTIVE | **extends** the base: `oathValueOf(C)` = max(income, the upkeep it fields — or, for a standing-army faction fielding nothing, the upkeep it would raise) replaces `income(C)` in both helpers. Pride keeps reading income. |
| Crown world (`crown/eligibility.ts`: `buildCrownWorld` :141; presence skips army members :200) | 🟢 ACTIVE | **reads; extends** with `oathValue` on the world snapshot. Presence is unchanged (§ Measurements: both companies are reached). |
| Crown phase (`crown.ts`: `runCrownPhase` :616; loyalty pass :630-660; tax loop :662-683; purse-day write-back :685-695) | 🟢 ACTIVE | **extends** with a wage step between the loyalty pass and the tax loop. |
| Purse upkeep (`factionPurse/upkeep.ts`: `upkeepOf` :21, `armiesOf` :26, `settleUpkeep` :51 whole armies in id order, no debt) | 🟢 ACTIVE | **reads** (`upkeepOf`, `armiesOf`); the wage step reuses `settleUpkeep`'s whole-army rule. |
| Purse pay day (`factionPurse.ts`: `runFactionPurse` :183; `paidThroughTick` stamp :205-210; `meansBand(wealthAfter, upkeepPerDay, anyUnpaid)` :212-214; `PurseDay` :227-239) | 🟢 ACTIVE | **extends**: `upkeepPerDay` for the band adds yesterday's `wagesToVassals`; `PurseDay` gains three additive fields. |
| Underfunded check (`armyAttrition.ts`: `checkUnderfunded` :249-262, purse arm reads `paidThroughTick`) | 🟢 ACTIVE | **reads only.** A liege-paid army carries a fresh `paidThroughTick`, so it is not underfunded. No change. |
| Army supply (`armySupply.ts`: `isSupplyHost` :106-119 reads only `controls` from the army's own faction; `resolveSupplyLine` :136; caller `phases/armySupply.ts:115-117`, faction from `member_of`) | 🟢 ACTIVE | **extends**: the host test accepts a list of feeding factions; the phase passes `[own, liege]` for a liege-paid army. |
| War aims enemy rule (`warAims/enemy.ts`: `isEnemyFaction` :28, `enemyArm` :46, `hallBarsAttack` :95, `mayBesiege` :119) | 🟢 ACTIVE | **reads; adds** `commanderFactionOf(graph, armyId, tick)` beside it. |
| Enemy-rule call sites that take the army's faction from `member_of`: `armySpawning.ts:228-233` (objective), `battleResolution.ts:629-634` (siege start) and `:653-661` (`areHostile`), `warAims.ts:47-49` (`factionOf`, re-aim), `warAims/defence.ts:28-30, 48, 59` (defence), `warAims/score.ts:84-93` | 🟢 ACTIVE | **switches** the faction they act for to `commanderFactionOf`. `warAims.ts:65-74` (`grievanceFactionOf`) is faction-level, not army-level, and is untouched. |
| Army raising (`armySpawning.ts`: `keepsStandingArmy` :82-89 over `STANDING_ARMY_FACTION_CLASSES ['realm']` / `STANDING_ARMY_FACTION_DEF_IDS ['mercenary_company']` `types/army.ts:131-132`; `canAffordArmy` :140-145 = `ARMY_CREATION_GOLD_COST` 50 + one day's upkeep; size from Gold tier `determineSizeCategory` `types/army.ts:171`) | 🟢 ACTIVE | **reads** `keepsStandingArmy` and the size rule for the price base. No change to raising (how-level 9). |
| Army sheet line (`warAims/sheetView.ts`: `armyAimView` :39; templates in `data/army-words.ts`) | 🟢 ACTIVE | **extends** with a paymaster clause. |
| Fealty sheet and purse sentences (`crown/fealtySentences.ts`: `fealtyView` :109, `fealtyPurseSentence` :148; readers `components/Game/FactionFealty.tsx`, `FactionPursePanel.tsx`) | 🟢 ACTIVE | **extends** with one wage sentence each side. |

## Engine pillar

### Systems design

All new behaviour sits behind one switch, `CROWN_WAGES_ENABLED` (in `src/data/crown-constants.ts`), which is forced off when `CROWN_ENABLED` is off.

**1. The price** (`crown/offer.ts`, rule 1).

```
oathValueOf(C) = max(income(C), standingUpkeep(C))
standingUpkeep(C) = upkeepPerDayOf(C) > 0
                    ? upkeepPerDayOf(C)                                          // what it fields, any faction
                    : (keepsStandingArmy(C) ? upkeepOf(wouldRaiseSize(C)) : 0)   // what it would raise
wouldRaiseSize(C) = determineSizeCategory(armyReachTier(graph, C, 'gold'))   // the size spawnArmy would pick
affordableGift = min(1, spare / full, room / full)   with full = OATH_GIFT_DAYS × oathValueOf(C)
giftCost(C, share) = share × OATH_GIFT_DAYS × oathValueOf(C)
```

`oathValueOf` is computed once per faction in `buildCrownWorld` (new map `oathValue`). `wouldRaiseSize` is exported from `armySpawning.ts` as a pure helper so the spawn and the price read one rule. The `pride` term keeps reading `income(C)`: pride is about what a faction earns, not what it costs.

With rule 1 a company that fields nothing is still priced on the host it would raise. The bought gift lands in its purse (`executeSeekFealty` already moves `giftCost` vassal-ward through `applyTreasuryDelta`), so a company bought for a full gift can afford to raise again (§ Measurements).

**2. Wages** (`crown.ts`, rule 2). A new step in `runCrownPhase`, between the loyalty pass and the fealty tax, over the surviving oaths in edge-id order:

1. Read the vassal's `purseLastDay` (written by `faction_purse` earlier this tick). The armies to cover are `armiesUnpaid`, in id order.
2. The liege's spare purse is `wealth(R) − LIEGE_WAGE_RESERVE_DAYS × upkeepPerDayOf(R)`.
3. Pay whole armies in id order while the spare covers `upkeepOf(size)` (the purse's whole-army rule, `settleUpkeep`). The first army it cannot cover, and every one after it, stays unpaid.
4. For each covered army: move the coin R → vassal → nowhere (a direct debit of R through `applyTreasuryDelta`; the vassal's purse is not touched), and stamp `armyState.paidThroughTick = tick` and `armyState.liegePaidTick = tick`.
5. Write on the vassal's purse day `armiesPaidByLiege: string[]` and `wagesFromLiege: number`; on the liege's, `wagesToVassals: number` (summed over its vassals).

The vassal's own `armiesUnpaid` and Means word are **not** rewritten (how-level 3): the purse's broke/recovery chronicle compares today's unpaid list with yesterday's, and a rewritten yesterday would fire the broke line every day.

An army the vassal paid itself gets no `liegePaidTick` stamp, and an old stamp ages out (§ 4's window). That is the decision's "a vassal that pays its own armies keeps its own wars".

**3. The liege's Means counts its wages** (`factionPurse.ts:212`, how-level 5). The upkeep that bands a faction becomes `upkeepPerDay + (prevDay?.wagesToVassals ?? 0)`. A realm paying two hosts reads Getting by sooner, which is the word its vassals' loyalty already reads (crown § 5). This is one additive term. It reads 0 for every faction that pays no wages, so the purse's behaviour is unchanged for them.

**4. Command** (`warAims/enemy.ts`, rule 4).

```ts
/** The faction an army fights for: its paying liege while the wage is fresh, else its own. */
export function commanderFactionOf(graph: WorldGraph, armyId: string, tick: number): string | undefined
```

- Own faction = the army's `member_of` target.
- If `CROWN_WAGES_ENABLED`, and `armyState.liegePaidTick` exists with `tick − liegePaidTick ≤ LIEGE_COMMAND_WINDOW_TICKS`, and the own faction has a live `sworn_to` edge: return that edge's target. The liege is always read from the live oath, never stored.
- Otherwise return the own faction.

Every **army-level** enemy question asks for the commander instead of `member_of`:

- objective selection (`armySpawning.ts:228-233`);
- the re-aim pass and war-aim pick (`warAims.ts` `factionOf` → `commanderFactionOf`; `score.ts` callers pass it);
- defence (`warAims/defence.ts:48, 59`), so a hired host defends `protectedHoldingsOf(liege)` (how-level 7);
- siege start (`battleResolution.ts:629-634`);
- battle start (`areHostile`, `battleResolution.ts:653-661`), on both sides.

The **hall bar** (`hallBarsAttack`) is checked for both the commander and the own faction: a hired company never besieges a town it keeps its own hall in.

This is **replacement, not union** (how-level 6). While the wage is fresh, the company's own grudges wait. Because the liege is never its own enemy and fellow vassals are not enemies unless the liege has quarrelled with them, a paid company never marches on its paymaster. Faction-level reads (`grievanceFactionOf`, the crown's own `isEnemy` in `crown/offer.ts`) are untouched.

**5. Feeding** (`armySupply.ts`, rule 3). `isSupplyHost(state, locationId, factionIds: string | readonly string[])` is true when **any** listed faction controls the location (and the balance test holds as today). `resolveSupplyLine` passes the list through. `phases/armySupply.ts:115-117` passes `supplyFactionsOf(graph, armyId, tick)` = `[own]`, plus the liege when the same freshness test as § 4 holds. The liege's towns are **added**, not substituted (how-level 8). The besieged-city supply read (`armySupply.ts:190-215`) keeps the single holder, because a besieged town feeds its own holder only.

**6. Rollback.** `CROWN_WAGES_ENABLED = false`:

- skips the wage step;
- `oathValueOf` returns `income(C)`;
- `commanderFactionOf` and `supplyFactionsOf` return the own faction only;
- the Means term reads 0.

Stamps already on armies are ignored by every reader.

### Graph nodes / edges

**No new node type and no new edge.** This is the decision's core ruling: a hire is the existing `sworn_to` oath (crown plan § Graph).

New properties, all additive:

| Where | Property | Writer | Readers |
|---|---|---|---|
| `armyState` (army actor) | `liegePaidTick: number \| undefined` | `crown` phase wage step only | `commanderFactionOf`, `supplyFactionsOf`, army sheet, debug |
| `PurseDay` (vassal) | `armiesPaidByLiege: string[]`, `wagesFromLiege: number` | `crown` phase | Fealty and Purse sentences, Oaths debug table |
| `PurseDay` (liege) | `wagesToVassals: number` | `crown` phase | `faction_purse` Means band (next day), Purse sentence, debug |

`liegePaidTick` is a tick, the same kind of stamp as `paidThroughTick`. It holds no entity id: who the liege is comes from the live `sworn_to` edge on every read (CLAUDE.md: relationships are edges, not property fields). If an oath breaks and the vassal swears to another realm inside the window, the new liege commands the army for at most the rest of that pay day; the next pay day re-stamps or lets the stamp lapse.

### Tick phases

| Phase | Slot | Cadence | Change |
|---|---|---|---|
| `faction_purse` (existing) | inline, `orchestrator.ts:3791` | daily | Means band adds yesterday's `wagesToVassals` |
| `crown` (existing) | inline, right after the purse, `orchestrator.ts:3806` | daily | new wage step between loyalty and tax |
| `army_attrition` (existing) | `orchestrator.ts:3496`, earlier in the tick | per tick | none. On pay day T, attrition runs before the purse with `paidThroughTick = T − 12`, which is not yet underfunded (`> PURSE_CYCLE_TICKS`); the wage stamps T before tick T+1 checks it. No gap. |
| army supply scan, re-aim, siege and battle start (existing) | unchanged | unchanged | read `commanderFactionOf` / `supplyFactionsOf` |

### Resolution logic

1. **Order on pay day:** own upkeep (purse) → loyalty (crown) → wages (crown) → fealty tax (crown). An oath that breaks today pays no wage today.
2. **Whole armies in id order**, the first uncovered army and all after it unpaid (the purse's rule).
3. **One liege, several vassals:** vassals are paid in `sworn_to` edge-id order from one spare purse, so a liege short of coin pays the oldest oaths first.
4. **Freshness:** a stamp is fresh for `LIEGE_COMMAND_WINDOW_TICKS` (12, one pay day). A wage missed today means the army fights for its own faction again from the next tick past the window, and goes underfunded through the existing path.

### PRNG callouts

None. Every step is deterministic, in id order.

## Content pillar

### Encounter templates

N/A in v1. The two contract encounters on the company's membership track (`mc.elite.siege_contract`, `mc.social.contract_negotiation`) keep their current effects. Giving a mortal's encounter an oath effect is already filed as [encounters that broker an oath](https://linear.app/threadbare/issue/THR-1944). This plan adds no new deferral.

### Prose tables

Two new triggers in `EconomicChronicleTrigger` (`src/data/economic-chronicle-content.ts`), three variants each, game register (GM narration), inside attention only (the purse plan's filter):

| Trigger | When | Significance | Variants (rendered samples) |
|---|---|---|---|
| `wages_taken_up` | the first pay day a liege covers a vassal army it did not cover the day before | 0.6 | "The Hold of Witness Skyfield now pays the Scarlet Company's host, and the company marches where the Hold commands." · "Silver from the March of Shadow-Kept Dawn keeps the Iron Banner's soldiers in the field." · "The Sovereignty of Stone-Set Hollow has taken the Scarlet Company's host into its pay." |
| `wages_stopped` | the first pay day a liege fails to cover a vassal army it covered the day before (oath still standing) | 0.6 | "The Hold of Witness Skyfield could not pay the Scarlet Company's soldiers today, and they grumble in camp." · "No silver came from the March of Shadow-Kept Dawn; the Iron Banner's host goes unpaid." · "The Sovereignty of Stone-Set Hollow has stopped paying the Scarlet Company's host." |

**De-duplication (PC-5):** a pair (vassal, liege) writes at most one wage line per `WAGES_CHRONICLE_MIN_GAP_DAYS` (5) days. A liege hovering at its reserve, covering one day and not the next, therefore writes one line, not a flip every day. A liege writes at most one wage line per pay day, naming the vassal with the oldest oath; the others show on its Purse sentence, not in the chronicle. With ten oaths changing pay on one day, the chronicle gains at most one line per liege (at most three on a medium map).

A desertion that follows is told by the purse's existing `army_unpaid_desertion` line. A break that follows is told by the crown's existing `oath_broken` line ("Outbid by a richer liege, the Scarlet Company broke its oath …"). The `oath_sworn` *bought* variant already reads as a hire. No line is duplicated.

### Attachment content

N/A — no attachments.

### Data tables

`src/data/crown-constants.ts` gains the § Constants rows. `src/data/army-words.ts` gains the paymaster clause. `src/data/economic-chronicle-content.ts` gains the two triggers.

## UI pillar

*Screenshot tool: Playwright (DOM) for the faction sheet, army sheet and debug tab. No map change.*

### Player-facing display

1. **Army sheet** (`armyAimView`, `warAims/sheetView.ts`, rendered through `detailPageResolvers.ts` and `views/subjects/linkedProse.ts`): when `commanderFactionOf ≠ own faction`, the war-aim line gains a `{liege}` slot, routed through `useRefRouter`: "*Marching to take Silverborough for the Hold of Witness Skyfield, which pays its soldiers.*" A holding army: "*Holding Thornhaven for the Hold of Witness Skyfield, which pays its soldiers.*" Defence: "*Riding to hold Ashford against the Iron Banner, for the Hold of Witness Skyfield, which pays its soldiers.*"
2. **Faction sheet, Fealty section** (`fealtyView`), on a vassal with `wagesFromLiege > 0`: one clause after the standing line: "*Its liege pays its soldiers.*" With `armiesUnpaid` minus `armiesPaidByLiege` non-empty (some still unpaid): "*Its liege pays some of its soldiers; the rest go unpaid.*"
3. **Purse panel** (`fealtyPurseSentence`), on a liege with `wagesToVassals > 0` only: "*It pays the soldiers of the Scarlet Company.*" With several vassals: "*It pays the soldiers of the Scarlet Company and one other.*" (counts spelled out). The vassal's Purse panel adds nothing: its Fealty section on the same page already says it, and one fact gets one sentence per page.

   No amount anywhere.

**One phrasing (PC-6).** Every surface that states "the liege pays this army" uses the same verb phrase, *pays its soldiers*: the Fealty clause ("Its liege pays its soldiers."), the army sheet ("…for the Hold of Witness Skyfield, which pays its soldiers."), and, from the liege's side, the Purse sentence ("It pays the soldiers of the Scarlet Company."). The partial case ("Its liege pays some of its soldiers; the rest go unpaid.") appears only in the Fealty clause, the one vassal surface.

**Empty slots (PC-3).** If the liege's or the company's name does not resolve, the clause is omitted entirely. A clause never renders with a blank or an id in its slot.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Army sheet | "Marching to take Silverborough for the Hold of Witness Skyfield, which pays its soldiers." | PC-1, PC-3 | The liege name routes (Law 21). Tooltip on the clause: "This army fights for whoever pays its soldiers. When the pay stops, it fights under its own banner again." |
| Fealty clause | "Its liege pays its soldiers." · partial: "Its liege pays some of its soldiers; the rest go unpaid." | PC-1, PC-6 | Reads beside the oath's kind ("bought with silver"), so a hire reads as a hire. Same verb phrase as the army sheet and the liege's Purse sentence. |
| Purse (liege) | "It pays the soldiers of the Scarlet Company." · several: "It pays the soldiers of the Scarlet Company and one other." | PC-3, PC-6 | Company name routes; counts spelled out. |
| Chronicle | § Prose tables samples | PC-5, PC-6 | At most one line per pair per five days, and one per liege per pay day (§ Prose tables, de-duplication). |

**Law 45 guard:** the army-sheet clause renders only from a fresh `liegePaidTick` stamp. Nothing says a company is "hired" or "under contract" unless its liege paid it in the last pay day.

**Words:** *free company* is design shorthand (the companies' own names, e.g. the Scarlet Company, are what the player reads). The words *mercenary*, *contract* and *hire* do not appear on a player surface for this feature: the player reads *pays its soldiers*, which is literally true and needs no new term (Law 43). *King*, *queen*, *kingdom* and *sworn* stay banned as in the crown plan.

### Playtest signal

A tester who opens a company's army sheet can say who it fights for and why. A tester who watches a liege go broke reads, unprompted, that the company leaves because the pay stopped. **Watch item:** testers describe hires in story terms (a lord bought swords, the swords walked away), never as a wage number.

### Event notifications

Chronicle lines only, as in the crown plan. No toast and no Needs-you entry.

### Debug inspection (DebugPanel)

- **Economy debug tab, Oaths table:** two new columns, *wages paid today* and *armies covered / uncovered*.
- **Armies tab** (`ArmiesTabContent.tsx`): a *fights for* column (`commanderFactionOf`) and a *fed by* column (`supplyFactionsOf`).
- **`window.__DEBUG.getArmyPaymaster(armyId): Promise<{ ownFactionId: string | null; commanderFactionId: string | null; liegePaidTick: number | null; supplyFactionIds: string[] } | null>`**, typed in `src/debug-bridge.d.ts`.

### Visual presence (HexMapV2)

N/A. A hired army is drawn as today, in its own faction's colour. The crown outline (crown plan) already shows who rules whom, and a second army colour would add a plain-map signifier the [THR-1830](https://linear.app/threadbare/issue/THR-1830) grammar does not have.

### UI Laws engaged

| Law | Verdict |
|---|---|
| 1 / 17 | The army-sheet clause carries a registry tooltip (`ui.army.paidBy`). Build obligation. |
| 13 / 14 | No wage amount, gift amount or price on any player surface. |
| 21 | Every faction name in the new clauses routes through `useRefRouter`. |
| 33 | One clause per surface; no new section; the faction page still fits 1920×1080. |
| 37 | N/A — no multi-beat flow. |
| 45 | Clauses render only from a fresh stamp (above). |
| 56 | Each clause renders only from written state (`liegePaidTick`, `wagesFromLiege`, `wagesToVassals`); nothing renders empty. |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `crown.ts` (wage step) | `crown` | Fealty clause, Purse sentence | `armyState.liegePaidTick`, `paidThroughTick`, `PurseDay.wages*`, liege `wealth` | `oath_wages` | Oaths table; `__DEBUG.getOaths` (new fields ride along) |
| `crown/offer.ts` + `crown/eligibility.ts` (`oathValueOf`) | faction actions (`seek_fealty`) | — | — | existing `oath_sworn` / `oath_refused` gain `oathValue` | Oaths table |
| `factionPurse.ts` (Means term) | `faction_purse` | Means word | `meansBand` | existing `economy.purse.day` gains `wagesToVassals` | Purse debug |
| `warAims/enemy.ts` (`commanderFactionOf`) | army supply / movement / battle | army sheet | — | `war.aim.picked` / `war.aim.hold` gain `commanderFactionId` | Armies table; `__DEBUG.getArmyPaymaster` |
| `armySupply.ts` + `phases/armySupply.ts` (`supplyFactionsOf`) | army supply scan | — | `armyState.supply` | existing supply scan trace gains `hostFactionId` | Armies table |
| `armySpawning.ts` (`wouldRaiseSize`, objective via commander) | army spawn | — | — | — | — |
| chronicle content | `crown` | Great Chronicle | — | `oath_wages` (cause) | Chronicle panel |

**Prose pipeline:** chronicle lines through `resolveEconomicChronicle`; sheet clauses composed in `fealtySentences.ts` and `sheetView.ts`, never `enrichProse`. **Player controls:** none. The player reads the hire and acts through existing verbs.

## Interface impact

Mapped subsystems in `Docs/canon/interface-map.generated.md`: **Factions & Succession** (the oath's wage), **War, Armies & Battles** (supply, command), **Mortal Economy & Prosperity** (the purse's Means term).

| Contract | Kind | Production read site |
|---|---|---|
| `crown-liege-pays-vassal-wages` (`armyState.liegePaidTick`, `PurseDay.armiesPaidByLiege / wagesFromLiege / wagesToVassals`) | **add** | `commanderFactionOf` (war aims, siege and battle start, objective), `supplyFactionsOf` (army supply phase), `faction_purse` Means band, `FactionFealty.tsx`, `FactionPursePanel.tsx` |
| `crown-oaths-pay-fealty-tax` (crown plan) | **extend** (the wage step runs before the tax in the same phase) | unchanged readers |
| `crown-protected-holdings-to-war-aims` (crown plan) | **extend** (read for the commander, not only the own faction) | `warAims/defence.ts` |
| `faction-purse-pays-faction-holders` (purse plan) | **extend** (`PurseDay` wage fields; Means reads wages) | Purse panel |

`scripts/interface-contracts.ts` gets the same rows. `Docs/canon/systems-inventory.md`'s Factions row gains "a liege pays, feeds and commands the armies of vassals it pays". Wiki pages whose `sources` match (`public/wiki-manifest.json`): **`factions-cultures-reference`** (lists `crown.ts`) and **`armies-battles-reference`** (lists `battleResolution.ts`) update in the same PR.

**UL:** no new term. *Free company* is design shorthand here and never appears on a player surface; the player reads the company's own name and a plain sentence (*pays its soldiers*).

## Constants table

All in `src/data/crown-constants.ts` unless noted.

| Constant | Default | Purpose |
|----------|---------|---------|
| `CROWN_WAGES_ENABLED` | `true` | Master switch for all four rules; forced off when `CROWN_ENABLED` is off |
| `LIEGE_WAGE_RESERVE_DAYS` | `2` | Days of its own armies' upkeep a liege keeps back before paying wages (how-level 4) |
| `LIEGE_COMMAND_WINDOW_TICKS` | `12` (= `PURSE_CYCLE_TICKS`) | How long a wage stamp makes the army fight for, and eat from, its liege |
| `OATH_PRICE_READS_UPKEEP` | `true` | Rule 1's upkeep half; off → price on income alone (the pre-plan rule) |
| `WAGES_CHRONICLE_SIGNIFICANCE` (`economic-chronicle-content.ts`) | `0.6` both triggers | Chronicle weight |
| `WAGES_CHRONICLE_MIN_GAP_DAYS` | `5` | Days between two wage lines for one vassal–liege pair (PC-5) |
| `ARMY_UPKEEP_PER_DAY` (`faction-purse-constants.ts:139`, read only) | warband 1.5 · regiment 2.5 · host 3.5 | The upkeep the price and the wage read |

## Tracing

```ts
interface OathWagesTrace {
  category: 'oath_wages';
  tick: number;
  vassalId: string;
  liegeId: string;
  armiesCovered: string[];
  armiesUncovered: string[];
  paid: number;
  liegeSpareBefore: number;   // wealth(R) − reserve, before this oath's wages
  started: boolean;           // first day covered after a day not covered (drives wages_taken_up)
  stopped: boolean;           // first day uncovered after a day covered (drives wages_stopped)
}
```

Registered as a `TraceCategory` member, a `TRACE_CATEGORIES` entry and a `TraceEntry` union interface in `src/types/trace.ts`, in the crown's undotted style. Additive fields on existing traces: `oath_sworn` / `oath_refused` gain `oathValue: number`; `economy.purse.day` gains `wagesToVassals: number`; `war.aim.picked` / `war.aim.hold` and the siege-start and battle-start traces in `battleResolution.ts` gain `commanderFactionId: string` (every decision that read the commander records it); the army supply scan trace's per-line record gains `hostFactionId: string | null`.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `CROWN_ENABLED` or the purse off | `CROWN_WAGES_ENABLED` forced false at startup with one `console.warn` |
| Vassal has no `purseLastDay` today | No wage for it today; its armies follow the purse's own verdict |
| An id in `armiesUnpaid` is no longer an army | Skipped; the next army is considered |
| `liegePaidTick` missing or stale, or the vassal has no live `sworn_to` edge | `commanderFactionOf` / `supplyFactionsOf` return the own faction |
| Army with no `member_of` | Commander and supply factions are `undefined` / `[]`, as today (cut off, no quarrel) |
| `armyReachTier` throws or returns NaN for the price | `wouldRaiseSize` returns `'warband'` (the cheapest), so the price never inflates on bad data |
| Exception inside one oath's wages | Caught per oath; that oath's armies follow the purse's verdict; the phase's outer try/catch protects the tick |
| Liege spare below 0 | Treated as 0: no wages, no debt |

## Blast Radius

`src/types/trace.ts` (≥100 importers, codesight hot file) gains one category and additive fields. `src/types/army.ts` (`ArmyState`, 31 importing files) gains one optional field. Neither changes an existing shape.

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | ≥100 (hot file) | One additive category; additive optional fields on four existing interfaces |
| `src/types/army.ts` | 31 | One optional field on `ArmyState` |
| `src/engine/armySupply.ts` | moderate | `isSupplyHost` / `resolveSupplyLine` accept a string or a list; every existing caller passes a string unchanged |

## Game Design Laws check

- **Law 42 [E]** (simple frameworks): no new edge, no contract system, no mercenary special case. The four rules apply to every oath, and a realm vassal's armies obey them as a company's do. Conforms.
- **Law 43 [E]** (one concept): a hire is fealty bought with silver, a concept the player already reads. No new player word. Conforms.
- **Law 45 [P]** (never promise what the world will not do): this plan *removes* a broken promise (the company's contract text). Every new clause renders from a fresh stamp. Conforms.
- **Law 22 [E]** (no dead air): pay starting and stopping each leave a chronicle line inside attention; the desertion and break that may follow already do. Conforms.
- **Law 36** (the god's purse is small): untouched. All coin here is the world's.
- No new random draw (Laws 1–8 untouched).

## Three-pillar check

- [x] Engine pillar present (price, wages, Means term, command, supply)
- [x] Content pillar present (two chronicle triggers, army-words clause, constants; encounters N/A with the existing deferral named)
- [x] UI pillar present (army sheet, Fealty clause, Purse sentences, debug tables and accessor; map N/A with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves the map's destination (*factions need something worth fighting over*) and *mechanics surface through prose*: the wage is a sentence, never a figure.
- [x] No Vision edit needed.

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does** (below).
- [x] **It changes a rule of play.** `Docs/canon/rulebook.md`'s *Realms win fealty* paragraph gains, in the build PR: "*Fealty can carry an army. A gift is priced on what a faction costs to keep, so a free company is priced on the host it fields or would raise. Each pay day, after a vassal has paid what soldiers it can, its liege pays the rest, keeping two days of its own soldiers' pay back. An army its liege paid that day eats from the liege's towns as well as its own, and fights the liege's enemies, not its own, until the pay stops.*" The quick reference's crown line gains: "*A liege pays, feeds and commands any vassal army it pays (THR-1974).*"

> Brainstorm companion: `Docs/plans/2026-10-19-thr-1974-hiring-a-free-company-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Four new named constants and one master switch; the price lever is its own switch |
| 2. Inspectability | PASS | `oath_wages` trace with covered/uncovered armies and the spare purse; the commander id on every war-aim trace; `__DEBUG.getArmyPaymaster` |
| 3. Determinism | PASS | No new PRNG; oaths in edge-id order, armies in id order |
| 4. Fail-soft | PASS | Per-oath catch; every missing input falls back to the own faction or to no wage |
| 5. Narrative over mechanical perfection | PASS | Pay starting and stopping are chronicle beats; the company leaves through the crown's own loyalty |
| 6. Additive over destructive | PASS | No new edge; optional fields only; everything behind `CROWN_WAGES_ENABLED` |
| 7. Performance budget | PASS with note | The wage step is ≤ ~30 oaths × ≤ 1 army daily. `commanderFactionOf` is two edge reads per army per call; the war-aim and supply passes already walk every army. Budgets, both measured in `test:heavy` over 600 ticks on seed 42 medium: the `crown` phase stays under 1 ms per pay day, and the summed army phases (movement, supply, battle and siege start) stay within 5% of the same run with `CROWN_WAGES_ENABLED = false` |

## Kill criteria

- **A crown bankrupted by wages alone** (the ticket's kill case): on any of seeds 42/99/7, a liege reads *Destitute* on a pay day when `wagesToVassals > 0` and its wealth plus the wages it paid in the last 10 days would have kept it above *Destitute*. First lever: raise `LIEGE_WAGE_RESERVE_DAYS` to 4. If that fails, turn `CROWN_WAGES_ENABLED` off and reopen [Mercenary hire](https://linear.app/threadbare/issue/THR-1939) (its *Would change the call*: "a measured wage bill that bankrupts crowns on its own").
- **Companies stay armyless:** if the reported share (§ Done when, *companies field armies*) is below half, the build PR files "a liege pays for its vassal's raise" as a Deferral in this project (brainstorm choice 9), with the measurement quoted, and ships. It does not add the rule silently.
- **Realm vassals join every war:** if more than a quarter of realm-vassal armies fight for their liege on a given day on two of three seeds, the reserve is not binding and lieges are paying vassal realms' armies wholesale. Restrict wages to vassals with no held town (a one-line test in the wage step) and record it.

## Done when

Predicates are measured over 1080 ticks (90 days), medium map, with the purse, crown, war aims and THR-1973 live, unless stated.

- [ ] **Hired host lasts** (fixture): a free company sworn to a realm that can cover its wage, whose own purse is empty, keeps its host for 30 days with no desertion. Its supply host is one of the liege's towns, and its war aim names an enemy of the liege.
- [ ] **Own wars kept** (fixture): a realm vassal that pays its own army keeps its own faction as commander on every tick (`commanderFactionOf` = own).
- [ ] **No march on the paymaster** (invariant over the three runs): no army whose commander is its liege ever targets, besieges or fights a town or army of that liege or of a fellow vassal not at war with the liege.
- [ ] **Price is never free:** on each seed, every free company has `oathValueOf > 0` on every day, including days it fields no army.
- [ ] **Companies field armies — measured and reported:** the PR reports, across seeds 42/99/7, the share of sworn free-company days on which the company fields an army (today: 0 from day 30 on). This is a report, not a gate: if the share is below half, the PR files the Deferral the second kill criterion names, and the ticket still closes.
- [ ] **Wage bill:** on each seed, no liege is bankrupted by wages (the first kill criterion never fires), and no wage ever takes a liege's purse below its reserve (`LIEGE_WAGE_RESERVE_DAYS` × its own upkeep) — an invariant over every pay day. The census expects wages of 13–30% of income for the richest realm on each seed and more for poorer ones; the reserve, not a share cap, is the guard.
- [ ] **Courtable:** on each seed, each free company is reached by some court-eligible realm on at least 45 of 90 days (the lowest measured today; the plan must not lower it).
- [ ] **Rollback:** with `CROWN_WAGES_ENABLED = false`, a 300-tick run on seed 42 is identical to today's in faction wealth, army disband ticks and war-aim picks.
- [ ] Army sheet and faction sheet show the clauses. Four-part browser evidence:
  - a 1920×1080 screenshot of a hired army's sheet and its company's faction sheet;
  - a clean console;
  - `(await window.__DEBUG.getArmyPaymaster('<armyId>')).commanderFactionId === '<liegeId>'`;
  - a UI-Laws line for Laws 1, 13/14, 17, 21, 33, 37, 45, 56.
- [ ] Interface contracts, systems inventory, the two wiki pages, the rulebook paragraph and the quick-reference line updated in the same PR.
- [ ] `npm run gate` green (code track: tests, typecheck ratchet, build, 30-tick CLI smoke, `test:heavy`); `npm run gate -- --final` last before push.
- [ ] Closing commit body and PR body carry the line-anchored closer for this issue.

## Coordination block

**Suggested model:** opus. Four rules across the crown phase, the purse, army supply and five war-aim call sites, with determinism-sensitive ordering on pay day.

**Parallel-safe with:** UI-only and content-only work that does not touch `FactionFealty.tsx`, `FactionPursePanel.tsx` or the army sheet, e.g. [the type and icons rollout](https://linear.app/threadbare/issue/THR-1879).

**Mutex with:**

- [Hunger and unrest S2](https://linear.app/threadbare/issue/THR-1957): it reads the crown's offer score (`crown/offer.ts`), which this plan's price changes.
- [War aims pick the nearest enemy town](https://linear.app/threadbare/issue/THR-1970): both edit `warAims/score.ts` call paths.
- [God's stake S3](https://linear.app/threadbare/issue/THR-1969) and [mortal wealth S3](https://linear.app/threadbare/issue/THR-1953) only where they edit `factionPurse.ts`'s pay day; run one after the other.
- [The Inspector](https://linear.app/threadbare/issue/THR-1876) follow-ups that re-home the faction page or army sheet: whichever lands second moves the clauses.

**Files to touch:**

- Edit (engine): `src/engine/crown.ts` (wage step), `src/engine/crown/offer.ts` + `crown/eligibility.ts` (`oathValueOf`), `src/engine/factionPurse.ts` (Means term, `PurseDay` fields), `src/engine/warAims/enemy.ts` (`commanderFactionOf`), `src/engine/warAims.ts`, `warAims/score.ts`, `warAims/defence.ts`, `src/engine/battleResolution.ts`, `src/engine/armySpawning.ts` (`wouldRaiseSize` export, objective via commander), `src/engine/armySupply.ts` + `src/engine/phases/armySupply.ts` (`supplyFactionsOf`).
- Edit (types): `src/types/army.ts` (`liegePaidTick`), `src/types/trace.ts` (`oath_wages`, additive fields).
- Edit (content): `src/data/crown-constants.ts`, `src/data/army-words.ts`, `src/data/economic-chronicle-content.ts`.
- Edit (UI): `src/engine/warAims/sheetView.ts` (+ `detailPageResolvers.ts` / `views/subjects/linkedProse.ts` if the slot needs routing), `src/engine/crown/fealtySentences.ts`, `src/components/Game/FactionFealty.tsx`, `src/components/Game/FactionPursePanel.tsx`, the tooltip registry, `EconomyDebugTab.tsx`, `ArmiesTabContent.tsx`, `src/debug-bridge.ts` + `src/debug-bridge.d.ts`.
- Edit (docs): `scripts/interface-contracts.ts`, `Docs/canon/systems-inventory.md`, `Docs/canon/rulebook.md` + quick reference, two wiki pages, `Docs/plans/wiring-checklist.md` (crown section).
- Create: tests under `src/engine/__tests__/crownWages*.test.ts` and `warAims/__tests__/commander*.test.ts`.

## Notes for the executor

- **Do not add an edge or a contract node.** The decision ruled it out (Law 42). The `sworn_to` oath is the hire.
- **Do not rewrite the vassal's `armiesUnpaid`.** Write `armiesPaidByLiege` beside it (brainstorm § 3).
- **Do not change `grievanceFactionOf` or the crown's own `isEnemy`.** Only army-level enemy questions read the commander.
- **Never show *mercenary*, *contract*, *hire*, *king*, *queen*, *kingdom* or *sworn*** on a player surface for this feature.
- **`wouldRaiseSize` must be the spawn's own rule.** Export it from `armySpawning.ts` and have `spawnArmy` call it, so price and raise cannot drift.

## Intent-judge verdicts

| Pass | Verdict | Findings | Disposition |
|---|---|---|---|
| 1 | **Revise** (Reversible) | Dims 1–7 and 9 PASS. GAPs: dim 8, the army stamp stored a liege id that readers re-derive anyway; dim 10, the Done-when and a kill criterion contradicted each other on the armies share; dim 11, the price priced a non-standing faction that *fields* an army on income alone (narrowing "would raise" was ruled faithful, narrowing "what it fields" was not); dim 12, no PC-5 de-duplication, three phrasings of one fact (PC-6), no empty-slot rule (PC-3) | All fixed: the price reads fielded upkeep for any faction; the stamp is a tick (`liegePaidTick`) and the liege is read from the live oath; the armies share is a reported measure that triggers the Deferral; `WAGES_CHRONICLE_MIN_GAP_DAYS` and one line per liege per pay day; one verb phrase across surfaces, the vassal Purse duplicate dropped; unresolved names omit the clause |
| 2 | **Allow** (Reversible) | All six pass-1 fixes verified as landed. One GAP (dim 4): a fail-soft row still named the removed `liegeId`. Advisories: the army-sheet tooltip said "its own company", which is false for a realm vassal's army; the action proposal still described the old stamp; the several-vassals Purse variant belonged in the text table | All taken: fail-soft row reworded; the tooltip says "under its own banner"; proposal updated; the variant added to the Player-facing text table |

## Forked-audit verdicts

Run on the first draft, 2026-10-19 (design lane), in parallel with intent-judge pass 1. The pass-1 revisions changed the price formula, the army stamp's shape, two predicates and some UI wording; each disposition below says which notes they answer.

### NFP audit

**PASS-with-notes.**

- Tunability, Determinism, Fail-soft and Narrative: PASS.
- Inspectability: PASS-with-note. Siege start and battle start read the commander, but no trace recorded it there. *Fixed: the siege-start and battle-start traces gain `commanderFactionId`.*
- Additive: PASS-with-note. Six existing army-level call sites change what they read. *Kept:* this is the decision's rule 4. It sits behind `CROWN_WAGES_ENABLED`, and the rollback predicate proves the switched-off run is identical.
- Performance: PASS-with-note. The budget covered only the crown phase, not the per-army reads. *Fixed: the summed army phases must stay within 5% of the switched-off run in `test:heavy`.*

### Three-pillar audit

**PASS-with-notes.** Engine, Content and UI are present and substantive. No required section is missing. The Wiring table connects every module. There is no green-field duplication: the `sworn_to` oath is reused and no new edge is added.

Notes:

1. The Substrate inventory follows § Measurements rather than opening the plan. *Kept:* the ticket asked for measurements first, and the inventory is still the first spec section.
2. The inventory cites modules, not systems-inventory names. *Kept:* the canonical names are in § Interface impact.

### Vision audit

**PASS-with-notes.** No contradictions. North star, non-negotiables (no player control; the god's purse is untouched), design tensions and taste profile all conform.

Notes:

1. The plan names its premises without citing Vision files. *Kept:* it cites the map's destination test, which is where the premise lives for this work.
2. The hire never becomes encounter content in v1. *Kept:* encounter effects for oaths are already deferred to [encounters that broker an oath](https://linear.app/threadbare/issue/THR-1944).
