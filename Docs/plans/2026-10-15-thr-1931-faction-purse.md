> **title:** The faction purse — the land fills it, war empties it, and a broke faction's armies desert — THR-1931
> **linear_issue:** THR-1931
> **author:** Claude Code (design lane, unattended, run 2026-10-15c)
> **created:** 2026-10-15
> **three_pillars:** Engine done · Content done · UI done

# The faction purse — THR-1931

*Every faction gets a purse the land fills and war empties, so towns, mines and borders are worth taking and armies cost something to keep.*

## Why this is load-bearing

The [Mortal economy map](https://linear.app/threadbare/issue/THR-1863) set the destination: *"a basic 'kingdom' economy so factions have something to fight over"* (Christian, 2026-10-14). Today they have nothing to fight over in coin. **No code adds to a faction's `wealth`.** Seeding writes 0 (`factionSeeding.ts:268`, `guildSeeding.ts:310`); the only two writers subtract (Commission Quest `phaseFactionActions.ts:308-310`, Issue Bounty `:663-665`), and both sit behind a gate a 0 balance never passes (`:793`). Holding income skips factions on purpose (`holdingIncome.ts:10-13, 85-88`). So:

- every faction sheet reads **Destitute** (`FactionSheet.tsx:416-421` → `getWealthTier`, `wealth.ts:82-88`);
- the guild warehouse (30) and counting house (50) never spawn (`phaseSublocations.ts:68,71`, gate `sublocation.ts:920-930`);
- raising an army is free: `ARMY_CREATION_GOLD_COST = 50` (`types/army.ts:86`) has **zero readers**, and `ARMY_MAINTENANCE_COST` (`:108-112`) is stamped on the army and never debited (`checkUnderfunded` takes it as `_maintenanceCost`, `armyAttrition.ts:227`). In the prototype run faction_1 raised a host eleven times in 50 days.

This plan is the first of the kingdom economy, in Christian's order (purse → crown → war aims). [The crown](https://linear.app/threadbare/issue/THR-1932) grows the one-holder town-tax rule into oaths and tax rights; [economic war aims](https://linear.app/threadbare/issue/THR-1933) reads what a town is worth to its holder. Both read this purse.

**Settled input** (cited inline where used; not re-opened):

- **[The faction purse decision](https://linear.app/threadbare/issue/THR-1867)** — decided in an attended session **with Christian present**, built on his four scope rulings (comments on the ticket). Prototype [`proto/thr-1867-faction-purse` @ 055aba10](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1867-faction-purse), never merged: [ledger output](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1867-faction-purse/scripts/proto/faction-purse-ledger.output.txt), [constants](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1867-faction-purse/src/data/faction-purse-constants.ts).
- **[What the player sees of the economy](https://linear.app/threadbare/issue/THR-1870)**, § 4 (the Purse panel) only — **decided by the design lane under delegation** on 2026-10-14T22:29Z, record [`Docs/audits/2026-10-15-thr-1870-economy-visibility-decision.md`](../audits/2026-10-15-thr-1870-economy-visibility-decision.md). Its veto window runs to 2026-10-15T22:29Z, so the issue carries `Claimable from: 2026-10-15T22:29:00Z`.
- **The carve-up release:** Christian on the map, 2026-10-15 08:29Z — *"Keep all three calls as decided. The plan docs can go ahead."*

**How-level choices this plan made** (the decision left them open; reasons in the [brainstorm companion](2026-10-15-thr-1931-faction-purse-brainstorm.md)): a separate daily phase rather than folding into holding income; `wealth` stays the one store with a faction clamp; an opening purse so worldgen armies do not desert on day 1; pay-what-you-can with a floor at 0 instead of debt; mercenary companies run dry like anyone else (hire contracts filed as a follow-up); `influence` breaks a two-controller town-tax tie.

## Substrate inventory

Measured on this worktree at `origin/main` 565dd5fc, 2026-10-15. Citations are `path:line`.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Holding income (`holdingIncome.ts`; daily gate `:174`, `HOLDING_INCOME_INTERVAL_TICKS` 12 `strategic-action-constants.ts:1483`; orchestrator inline phase `orchestrator.ts:3749`) | 🟢 ACTIVE | **untouched, extended beside.** It keeps paying mortals only. The new `faction_purse` phase runs right after it on the same day tick and reuses its toll formula (`:109-118`) and ruin floor (`:148-150`). The faction skip stays; its comment changes from "never paid" to "paid by `faction_purse`". |
| Wealth store (`wealth.ts`: `readWealth` :105, `applyWealthDelta` 0–100 clamp :97-98, `bankWealth` :122-132, `getWealthTier` :82-88) | 🟢 ACTIVE | **extends.** Faction `wealth` stays the one store. A new `applyTreasuryDelta` clamps factions to 0–`FACTION_TREASURY_CAP`; the two faction-action writers switch to it so a faction above 100 is not cut back to 100 by a quest. |
| Faction actions (`phaseFactionActions.ts`; Commission Quest `:86-93`, Issue Bounty `:127-134`, gate `:787-793`) | 🟠 DORMANT (gate unreachable) | **activates.** No change to the gate; income makes it reachable. |
| Guild sublocations (`phaseSublocations.ts:68,71,151-164`; `checkGuildWealthAtLocation` `sublocation.ts:920-930`) | 🟠 DORMANT | **activates.** Warehouse and counting house thresholds unchanged. |
| Armies: spawn (`spawnArmy` `armySpawning.ts:206`; gate `isEligibleForArmySpawn` `:61-97`; `MAX_ARMIES_PER_FACTION` 1 `types/army.ts:89`), warhost (`raiseWarhostForce` `armySpawning.ts:382`) | 🟢 ACTIVE | **extends.** The gate gains a purse check; `spawnArmy` charges the raise cost. Worldgen spawns (`worldSeed.ts:2239`, `seedLivingWorld.ts:1211`) and encounter warhosts are not charged (§ Resolution 4). |
| Army attrition (`checkUnderfunded` `armyAttrition.ts:224-239`, penalty 1.5 `:43`, disband at cohesion 0 `:197-199`; caller `:113`) | 🟢 ACTIVE | **replaces the predicate, keeps the path.** Underfunded = "the purse did not pay this army on its last pay day". The old prosperity predicate stays behind `FACTION_PURSE_ENABLED = false`. |
| Realm projection (`buildRealmProjection` `realmProjection.ts:98`, radius `REALM_FILL_RADIUS` 3 `realm-content.ts:77`; cached `ensureRealmProjection` `simulationRuntime.ts:665-712`) | 🟢 ACTIVE | **reads only.** Land rent counts the hexes the cached projection gives each realm. No per-hex owner is stored. |
| Schism (`decideSchismOutcome` `factionTopology.ts:346-374`; weights `game-config.ts:390-396`) | 🟢 ACTIVE | **extends** with one bounded purse term. |
| Resource stocks on places (stock tiers `phases/resourceStockTiers.ts`) | 🟢 ACTIVE | **reads only.** Place yield reads quantity and tier; it never drains a stock ([THR-1866](https://linear.app/threadbare/issue/THR-1866) owns flow). |
| Faction sheet (`FactionSheet.tsx`: What They Control `:405-410`, Means `:412-422`) | 🟢 ACTIVE | **extends** with the Purse panel. |
| Settlement economy ([THR-1923](https://linear.app/threadbare/issue/THR-1923), Ready for Dev, not built; `faction-building-lean.ts` not on main) | ⚪ PLANNED | **beside it.** Either may land first (§ Wiring, order). |

**Runtime counts, seed 42 medium** (prototype ledger, same world): 3 realms; 34 town guilds; 52 factions; 5 armies fielded at day 0 (two mercenary hosts, faction_0 regiment, faction_1 host, faction_2 regiment); 768 hexes, 375 inside a realm border at day 0, 393 unclaimed; 78 resource places, 44 held by nobody.

## Engine pillar

### Systems design

One new inline phase, **`faction_purse`**, in `src/engine/factionPurse.ts`, run by the orchestrator directly after `holding_income` (`orchestrator.ts:3749`), wrapped in the same try/catch. It runs on the same tick gate (`tick > 0 && tick % PURSE_CYCLE_TICKS === 0`) and is skipped otherwise. Pure helpers (income sources, upkeep, Means band) live in `src/engine/factionPurse/` so tests and the debug bridge can call them without a tick.

For each faction node (`actorType: 'faction'`) in id order, skipping `factionType` in `PURSE_EXCLUDED_FACTION_TYPES` (`['monster']`; lairs are not an economy):

1. **Income**, the five sources of [the purse decision](https://linear.app/threadbare/issue/THR-1867), each summed into a `PurseDay` record:
   1. **Town tax** — per settlement (`locationSubtype` in `SETTLEMENT_TIER_SUBTYPES`, via `getLocationNodes`) for which this faction is the **tax holder**: `TOWN_TAX_BASE × prosperity / TOWN_TAX_PROSPERITY_PIVOT`. A ruin (at or below `RUINED_SETTLEMENT_PROSPERITY_FLOOR`) pays nothing. The tax holder of a town is **one** faction: the realm whose border holds the town's hex, if that realm has a `controls` edge to it; else the controller with the highest edge `influence` (missing = 0), ties by earliest `establishedTick` then faction id. Today two controllers are each paid in full; that ends here.
   2. **Place yield** — every held place with a resource bag pays, per good, `quantity / 100 × YIELD_RATE[class] × STOCK_TIER_MULT[tier]`. Read only.
   3. **Land rent** — realms only: for every hex the cached realm projection gives this realm, `HEX_RENT[TERRAIN_RENT_CATEGORY[terrain]]`. Taking a town moves the border and the rent with it, through the projection's existing rebuild on a `controls` change.
   4. **Tolls** — every `trades_with` edge with `controlledBy` = this faction, using holding income's toll formula unchanged (`holdingIncome.ts:109-118`). No faction holds a lane at worldgen; the [lane-seizure bug](https://linear.app/threadbare/issue/THR-1883) decides which lane is tolled, not this phase.
   5. **Guild work** — for a faction with an affinity (town guilds by `guildType`, definition factions by `DEFINITION_FACTION_AFFINITY[factionDefId]`), in **every town where it keeps a hall or members** (a `located_at` member, or the guild's own `located_at`/home): matched units = stock quantity of each affine resource at that town and its places + `GUILD_SUBLOCATION_UNITS` per affine Place + (`lanes`) `GUILD_LANE_UNITS` per live `trades_with` touching the town + (`townTaxShare`) town prosperity × `BANKER_TAX_BASE_SHARE`. Gross = units / 100 × `GUILD_RATE`. **The town's tax holder takes `LANDHOLDER_TAX_RATE` of the gross**; the guild keeps the rest. A guild that is itself the tax holder keeps all of it.
2. **Upkeep** — for every army whose faction is this one (the army's `member_of` edge), `ARMY_UPKEEP_PER_DAY[size]`, paid in army id order.
3. **Settle** — `wealth ← applyTreasuryDelta(wealth, income)`, then each army's upkeep is paid while the purse covers it. An army paid today gets `armyState.paidThroughTick = tick`; an army the purse could not pay keeps its old value. The purse floors at 0; there is no debt.
4. **Means** — `meansBand` (§ Resolution 3) is written to `faction.properties.meansBand` so the sheet, receipts and the crown read one word and never recompute it.
5. **Record** — `faction.properties.purseLastDay` keeps the day's `PurseDay` (by-source totals, the two largest named sources, upkeep paid / owed, `brokeSinceTick`). This is what the Purse panel and the trace read. It replaces itself each day; nothing accumulates.

**Raising costs coin.** `isEligibleForArmySpawn` adds one check after the Gold tier (`armySpawning.ts:93-94`): `readWealth(faction) >= ARMY_CREATION_GOLD_COST + ARMY_UPKEEP_PER_DAY[sizeFor(faction)]` (raise it and pay its first day). `spawnArmy` deducts `ARMY_CREATION_GOLD_COST` through `applyTreasuryDelta` when called with `charge: true`; the two ambition/agenda callers (`factionAmbitions.ts:165`, `notableAgendas.ts:656`) pass it. Worldgen (`worldSeed.ts:2239`, `seedLivingWorld.ts:1211`) and `raiseWarhostForce` do not: a warhost is raised by an encounter's story, which already paid its price in the scene; it still costs upkeep from its faction like any army.

**Desertion.** `checkUnderfunded(graph, factionId, …)` gains the army: underfunded = `tick − (armyState.paidThroughTick ?? raisedTick) > PURSE_CYCLE_TICKS`. The existing attrition penalty, fraying report and disband at cohesion 0 follow unchanged (`armyAttrition.ts:132-199`). That is the decision's desertion, already built.

**Schism.** `decideSchismOutcome` adds `weights.purse × purseStrain`, where `purseStrain` = 1 while the faction's Means band is Destitute and has been for at least `PURSE_SCHISM_GRACE_DAYS`, else 0. Weight `SCHISM_WEIGHT_PURSE` 0.15. Bounded: alone it never splits a faction (the outcome is still a PRNG draw against `splitPressure`); it tips one already strained.

**Opening purse.** At the end of worldgen (after armies spawn, `worldSeed.ts:2239`, and after `seedLivingWorld`), each faction's `wealth` = `FACTION_STARTING_PURSE` + `FACTION_STARTING_UPKEEP_DAYS` × its fielded upkeep per day, and every worldgen army's `paidThroughTick = 0`. Every faction opens at least Comfortable.

**Rollback.** `FACTION_PURSE_ENABLED = false` skips the phase, the spawn check and charge, the opening purse and the schism term, and restores the prosperity predicate in `checkUnderfunded`. The game then behaves as on main today.

### Graph nodes / edges

No new node or edge types. New properties:

| Where | Property | Type | Writer |
|---|---|---|---|
| faction node | `wealth` (existing) | number 0–`FACTION_TREASURY_CAP` | `faction_purse`, `spawnArmy`, faction actions, worldgen |
| faction node | `meansBand` | `'Destitute' \| 'Getting by' \| 'Comfortable' \| 'Wealthy' \| 'Magnate'` | `faction_purse` |
| faction node | `purseLastDay` | `PurseDay` (below) | `faction_purse` |
| army `armyState` | `paidThroughTick` | number | `faction_purse`, worldgen |

```ts
interface PurseDay {
  tick: number;
  income: { townTax: number; placeYield: number; landRent: number; tolls: number; guildWork: number; guildTaxIn: number; guildTaxOut: number };
  topSources: { kind: 'town' | 'place' | 'land' | 'lane' | 'guild'; nodeId: string }[]; // the two largest, by amount
  paysTo: string | null;           // the tax holder this faction paid guildTaxOut to (largest one), for the "A share goes to …" line
  upkeepOwed: number;
  upkeepPaid: number;
  armiesPaid: string[];
  armiesUnpaid: string[];
  brokeSinceTick: number | null;   // first day Means went Destitute; null when not
}
```

### Tick phases

| Phase | Slot | Cadence | Reads | Writes |
|---|---|---|---|---|
| `faction_purse` (new) | inline, after `holding_income` (`orchestrator.ts:3749`) | daily (`PURSE_CYCLE_TICKS`) | factions, `controls`, settlements + prosperity, place stocks + tiers, cached realm projection, hex terrain, `trades_with`, members, armies | `wealth`, `meansBand`, `purseLastDay`, `paidThroughTick`, traces, chronicle |
| `army_attrition` (existing, `orchestrator.ts:3468`) | unchanged | per tick | `paidThroughTick` | unchanged |
| schism resolution (existing) | unchanged | unchanged | `meansBand`, `purseLastDay.brokeSinceTick` | unchanged |

Attrition runs earlier in the tick than the purse, so an army unpaid on pay day starts losing cohesion on the next tick.

### Resolution logic

1. **Tax holder of a town** (§ Systems design 1.1) — deterministic, no PRNG.
2. **Upkeep order** — armies paid in army id order; the first the purse cannot cover and every army after it are unpaid that day (no partial payment of one army).
3. **Means band** — `days = wealth / upkeepPerDay` when the faction fields any army, against `MEANS_BANDS_DAYS` (< 1 Destitute, < 5 Getting by, < 15 Comfortable, < 40 Wealthy, else Magnate); with no army, `wealth` against `MEANS_BANDS_ABSOLUTE` (< 1, < 15, < 60, < 250, else). A faction with armies unpaid today is Destitute whatever the division says.

   **One ladder (Law 43, PC-6).** The words are the shared purse ladder of [the visibility decision](../audits/2026-10-15-thr-1870-economy-visibility-decision.md) § 1 — Destitute · Getting by · Comfortable · Wealthy · Magnate, the same words `getWealthTier` gives a mortal — and only the *measure* differs: a faction is banded by days of upkeep in hand (THR-1870 § 1: *"faction reads THR-1867's days of upkeep"*). The purse decision's working names (Bankrupt · Strained · Solvent · Flush · Overflowing) map one-to-one onto these five bands at the same thresholds and are not shown anywhere. So a mortal sheet, a faction sheet and a receipt name Means with the same five words.
4. **Who pays to raise** — ambition and agenda raises pay; worldgen and encounter warhosts do not (§ Systems design).
5. **Excluded** — monster factions (`factionType: 'monster'`) earn and pay nothing; their armies, if any, keep the pre-purse predicate.

### PRNG callouts

None new. The schism outcome keeps its existing PRNG draw (`factionTopology.ts:370`); the purse term only changes the pressure it is drawn against.

## Content pillar

### Encounter templates

N/A — the purse adds no encounters. It makes four existing faction-side content paths reachable: Commission Quest and Issue Bounty (they post quests and bounties mortals already draw), and the guild warehouse and counting house Places (already authored in `GOLD_SUBLOCATION_SPECS`).

### Prose tables

New Great Chronicle triggers in `src/data/faction-purse-chronicle-content.ts`, three variants each, game register (prose doctrine v2: GM narration), resolved through the existing economic chronicle resolver used by the settlement economy plan. Emitted only for factions with a member or holding inside the player's attention (a threaded mortal is a member, or the faction holds a place on the god's Held ground), so equilibrium stays silent:

| Trigger | When | Variants (rendered samples) |
|---|---|---|
| `purse_broke` | Means crosses into Destitute | "House Ashfold could not pay its soldiers today." · "Saltmarch Hold could not find the silver to pay its spears." · "The Merchant Consortium's strongbox is bare." (no-army faction) — each fires only when the crossing is real: with an army, only on a day an army went unpaid; never a debt, never a length of arrears |
| `army_unpaid_desertion` | an army disbands with `reason: 'attrition'` while unpaid | "Unpaid, the Ashfold host melted away on the road; men went home by night." · "The Free Company broke up for want of pay; its banners were sold in Millbrook market." · "Saltmarch's warband scattered when the pay stopped coming." |
| `purse_recovered` | Means rises out of Destitute to Comfortable or above | "Coin is flowing into House Ashfold again." · "Saltmarch Hold can pay its soldiers again." · "The Consortium's strongbox is filling once more." |

Raising an army is already chronicled by the war reports; no new line.

### Attachment content

N/A — no attachments.

### Data tables

`src/data/faction-purse-constants.ts`, taken from the prototype file with the decision's corrections (upkeep is the decision's flattened per-day table, not a scale on `ARMY_MAINTENANCE_COST`): `TERRAIN_RENT_CATEGORY`, `HEX_RENT`, `YIELD_RATE`, `STOCK_TIER_MULT`, `GUILD_PLACE_AFFINITY` (miners · merchants · traders · bankers · artisans · thieves · temples · builders, each with resources, sublocation types, lanes, town-tax share), `DEFINITION_FACTION_AFFINITY`, `MEANS_BANDS_DAYS`, `MEANS_BANDS_ABSOLUTE`. Tables are data; a new faction type earns by adding a row.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces only — the faction sheet and the debug tab; no WebGL change).*

### Player-facing display

**The faction sheet gains a Purse panel** (THR-1870 § 4), in `FactionSheet.tsx`, replacing the bare Means row (`:412-422`) and placed under *What They Control*:

1. **Means chip** — reads `meansBand`, not `getWealthTier(wealth)`. Registry tooltip `ui.econ.means.faction`.
2. **Income sentence** — names the two `topSources` by name, never an amount; adds the share sentence when `paysTo` is set.
3. **Spending sentence** — what its armies are and how long the purse keeps them; the broke variant when any army is unpaid.
4. **Monopoly chip slot** — rendered empty here; [economic war aims](https://linear.app/threadbare/issue/THR-1933) writes the state that fills it (Law 56: no chip without state).

*What They Control* gains one short clause per holding saying what it pays in words (*"pays tax"*, *"yields salt"*, *"tolls the road"*), from the same `PurseDay` the sentences read.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Purse panel, Means chip | "Comfortable" (one of Destitute · Getting by · Comfortable · Wealthy · Magnate) | PC-1, PC-6 (same five words as the mortal sheet's Means, `OverviewTab.tsx:708-724`, and THR-1870's receipts; only the faction's measure differs, and the tooltip says so) | Tooltip: "How long this faction could pay its soldiers from what it holds now. A faction with no soldiers is judged by its coin alone." |
| Purse panel, income | "Most of its coin comes from the salt pans of Saltmarch Hold and the toll on the Millbrook road. A share goes to House Ashfold." | PC-1, PC-3 | Names route through `useRefRouter` (Law 21); no amounts. One source: "Most of its coin comes from the town of Millbrook." No income: "It has no income of its own." |
| Purse panel, spending | "It pays for one warband, and has coin to spare for a month of it." · no army: "It keeps no soldiers." | PC-1 | Duration words from the days figure: "a few days" (< 5), "a fortnight" (< 15), "a month" (< 40), "a season and more". |
| Purse panel, broke | "Its purse cannot pay its soldiers. They go unpaid and begin to slip away." | PC-6 | Same `armiesUnpaid` drives this line, the Destitute chip and the desertion chronicle, so they cannot disagree. |
| What They Control clause | "Millbrook — pays tax" · "Saltmarch salt pans — yields salt" | PC-3 | Good names come from the resource registry's display names, never ids. |
| Great Chronicle | "House Ashfold could not pay its soldiers today." (words owned by § Prose tables) | PC-5, PC-6 | One line per crossing; recovering then going broke again inside `PURSE_CHRONICLE_COOLDOWN_DAYS` stays silent. |

### Playtest signal

A tester who opens a realm's faction sheet can say where its coin comes from and whether it can afford its soldiers; a tester who watches a faction lose its last town later reads, unprompted, that its army broke up for want of pay. **Watch item (Vision audit):** no tester describes faction economies as something to optimise — the purse is the world's weather, not a spreadsheet.

### Event notifications

Chronicle lines only (§ Prose tables). No toast and no Needs-you entry: a faction's purse is the world's weather, and Needs you stays for the god's choices (THR-1923, THR-1870 § 7).

### Debug inspection (DebugPanel)

- **Economy debug tab** (`EconomyDebugTab.tsx`) gains a **Purses** table: faction, wealth, Means, income by source, upkeep owed / paid, armies unpaid, broke since.
- **`window.__DEBUG.getFactionPurse(factionId): Promise<PurseDay & { wealth: number; meansBand: string } | null>`** and **`window.__DEBUG.getPurseLedger(): Promise<Record<string, PurseDay>>`**, typed in `src/debug-bridge.d.ts`.
- CLI: `eval` reaches the same helpers (`factionPurse/` is pure).

### Visual presence (HexMapV2)

N/A — no map change. The plain map stays quiet (THR-1830 lens grammar); land rent rides the existing border, and the Trade lens's toll line is [war aims'](https://linear.app/threadbare/issue/THR-1933) to draw.

### UI Laws engaged

| Law | Verdict |
|---|---|
| 1 / 17 | The Means chip and each clause word carry a `ui.econ.*` registry tooltip. Build obligation. |
| 13 / 14 | Words only: no amount, price or id on the sheet. |
| 21 | Every name in the income sentence and clauses routes through `useRefRouter`. Build obligation. |
| 33 | The panel fits the faction page at 1920×1080 (the THR-1870 mock's faction screen). |
| 37 | N/A — no multi-beat flow. |
| 56 | The Means chip reads written `meansBand`; the monopoly chip slot renders nothing without state. |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/engine/factionPurse.ts` | inline `faction_purse` after `holding_income` | `FactionSheet` Purse panel | faction `wealth`, `meansBand`, `purseLastDay`; army `paidThroughTick` | `economy.purse.day`, `economy.purse.band_change` | Economy tab Purses table; `__DEBUG.getFactionPurse` |
| `src/engine/factionPurse/*.ts` (pure helpers) | — | — | — | — | CLI `eval` |
| `armySpawning.ts` (gate + charge) | via ambitions / agendas | — | faction `wealth` | `economy.purse.army_raised` | Armies tab shows "paid through" |
| `armyAttrition.ts` (`checkUnderfunded`) | `army_attrition` | — | reads `paidThroughTick` | existing `army_fraying` | Armies tab |
| `factionTopology.ts` (schism term) | schism resolution | — | reads `meansBand` | existing schism trace gains `purseStrain` | trace viewer (schism entries) |
| `phaseFactionActions.ts` (writers → `applyTreasuryDelta`) | faction actions | — | faction `wealth` | existing | — |
| worldgen opening purse (`worldSeed.ts`) | worldgen | — | faction `wealth`, `paidThroughTick` | — | Purses table day-0 row; `__DEBUG.getPurseLedger` before tick 12 |
| chronicle content | `faction_purse` | Great Chronicle | — | `economy.purse.band_change` (the line's cause) | Chronicle panel |

**Prose pipeline:** chronicle lines go through the economic chronicle resolver; the sheet sentences are composed from `PurseDay` in a pure helper (`factionPurse/purseSentences.ts`), never `enrichProse`. **Player controls:** none; the player reads the purse.

**Order with the settlement economy ([THR-1923](https://linear.app/threadbare/issue/THR-1923)).** Either may land first. This plan ships `GUILD_PLACE_AFFINITY`. If THR-1923 is already on main, its `faction-building-lean.ts` gains one rule: a faction whose affinity entry lists a building type uses it as its natural building; otherwise the class table stands. If THR-1923 lands second, its executor wires that read. No file is deleted. Town tax reads prosperity, which THR-1923 drives; nothing here depends on its population.

**Bugs in the way, by priority:** [realms lose most of their members](https://linear.app/threadbare/issue/THR-1918) (the purse needs no dues, but the schism term reads cohesion beside membership — land the bug first for the term to read true); [seizing a lane tolls the wrong lane](https://linear.app/threadbare/issue/THR-1883) (tolls are correct once it lands; nothing here waits on it).

## Interface impact

`Docs/canon/interface-map.generated.md` has no faction-wealth contract. Mapped subsystems: **War, Armies & Battles** (spawn gate, raise charge, underfunded predicate — changed below); **Factions & Succession** (schism term added; realm projection read only); **Mortal Economy & Prosperity** (prosperity, stocks and lanes read only; holding income untouched); **Essence & Divine Economy** — no read or write: no Dominion or essence code reads faction wealth (THR-1867, measured), and the god's cards that touch faction coin arrive with [the god's stake](https://linear.app/threadbare/issue/THR-1935). Contracts this plan touches:

| Contract | Kind | Production read site |
|---|---|---|
| `faction-purse-pays-faction-holders` (node-prop `wealth`, `meansBand`, `purseLastDay` on factions) | **add** | `FactionSheet.tsx` Purse panel; `phaseFactionActions.ts:787`; `sublocation.ts:926`; `isEligibleForArmySpawn` |
| `faction-purse-pays-armies` (army-prop `paidThroughTick`) | **add** | `checkUnderfunded` (`armyAttrition.ts:224`) |
| `settlement-prosperity-funds-armies` (`interface-contracts.ts:6553`) | **retire** (replaced by `faction-purse-pays-armies`; kept behind the flag) | — |
| `realm-holdings-to-political-map` (`interface-contracts.ts:199`) | **preserve** (new reader: land rent) | `faction_purse` |
| `freehold-income-pays-mortal-holders` (`interface-contracts.ts:5018`) | **preserve** | unchanged |
| `faction-purse-schism-strain` | **add** | `decideSchismOutcome` |

**UL:** `Docs/ubiquitous-language/Agents.md` § Means gains two sentences in the build PR: faction treasuries write through `applyTreasuryDelta` (0–`FACTION_TREASURY_CAP`) beside the mortal funnel `bankWealth`, and a faction's Means band measures days of upkeep in hand on the same five words. The word and its ladder do not change, so no `UL-proposal` is needed.

`scripts/interface-contracts.ts` gets the same rows; `Docs/canon/systems-inventory.md`'s Mortal Economy row gains "faction purse (income, upkeep, desertion)". Design Reference Wiki pages whose `sources` match (`public/wiki-manifest.json`): **`armies-battles-reference`** (lists `armyAttrition.ts`, `armySpawning.ts`, `types/army.ts`) and **`factions-cultures-reference`** (lists `phaseFactionActions.ts`, `factionTopology.ts`) update in the same PR; add `factionPurse.ts` to `settlements-economy-reference`'s sources.

## Constants table

All in `src/data/faction-purse-constants.ts` unless noted. Income and Means values are the decision's; upkeep is the decision's flattened table.

| Constant | Default | Purpose |
|----------|---------|---------|
| `FACTION_PURSE_ENABLED` | `true` | Master switch and rollback lever (§ Systems design) |
| `PURSE_CYCLE_TICKS` | `12` | Pay day cadence; one day (`TICKS_PER_DAY`) |
| `FACTION_TREASURY_CAP` | `1000` | Faction ceiling; mortals keep 0–100 |
| `PURSE_EXCLUDED_FACTION_TYPES` | `['monster']` | Factions outside the economy |
| `TOWN_TAX_BASE` | `0.8` | Per held settlement per day at the pivot |
| `TOWN_TAX_PROSPERITY_PIVOT` | `50` | Prosperity at which a town pays exactly the base |
| `SETTLEMENT_TIER_SUBTYPES` | `hamlet, town, city, capital` | What pays town tax |
| `YIELD_RATE` | staple 0.1 · strategic 0.2 · luxury 0.4 · arcane 0.6 | Per 100 stock per day, by resource class |
| `STOCK_TIER_MULT` | scarce 0.5 · adequate 1 · surplus 1.25 | Stock tier on place yield |
| `HEX_RENT` | staple 0.015 · timber 0.012 · stone 0.008 · wetland 0.003 · none 0 | Per border hex per day |
| `TERRAIN_RENT_CATEGORY` | table (prototype) | Terrain → rent category |
| `GUILD_RATE` | `1.0` | Guild income per 100 matched units per day |
| `GUILD_SUBLOCATION_UNITS` | `50` | Units one affine Place counts as |
| `GUILD_LANE_UNITS` | `50` | Units one live lane touching the town counts as |
| `BANKER_TAX_BASE_SHARE` | `1.0` | Bankers' units = town prosperity × this |
| `LANDHOLDER_TAX_RATE` | `0.2` | The tax holder's cut of guild work in its town |
| `GUILD_PLACE_AFFINITY`, `DEFINITION_FACTION_AFFINITY` | tables (prototype) | What each faction type earns from |
| `ARMY_UPKEEP_PER_DAY` | warband 1.5 · regiment 2.5 · host 3.5 | Daily upkeep (ratio flattened to 1.4× so a small realm keeps its host) |
| `ARMY_CREATION_GOLD_COST` (`types/army.ts:86`, existing) | `50` | Raise cost, now read |
| `MEANS_BANDS_DAYS` | 1 · 5 · 15 · 40 | Means bands in days of upkeep in hand |
| `MEANS_BANDS_ABSOLUTE` | 1 · 15 · 60 · 250 | Means bands for a faction with no army |
| `FACTION_STARTING_PURSE` | `10` | Opening coin for every faction |
| `FACTION_STARTING_UPKEEP_DAYS` | `20` | Opening coin per day of fielded upkeep, so worldgen armies start paid |
| `SCHISM_WEIGHT_PURSE` (`game-config.ts`) | `0.15` | Weight of an empty purse in split pressure |
| `PURSE_SCHISM_GRACE_DAYS` | `5` | Days Destitute before the strain counts |
| `PURSE_CHRONICLE_COOLDOWN_DAYS` | `10` | Minimum days between two purse chronicle lines for one faction |

## Tracing

```ts
// economy.purse.day — once per faction per pay day (only when tracing is enabled)
interface PurseDayTrace {
  type: 'economy.purse.day';
  tick: number;
  factionId: string;
  wealthBefore: number;
  wealthAfter: number;
  income: PurseDay['income'];
  upkeepOwed: number;
  upkeepPaid: number;
  armiesUnpaid: string[];
  taxHolderOf: string[];          // settlement ids this faction collected town tax from
}

// economy.purse.band_change — when meansBand changes
interface PurseBandChangeTrace {
  type: 'economy.purse.band_change';
  tick: number;
  factionId: string;
  from: string;
  to: string;
  days: number | null;            // null when no army (absolute bands)
}

// economy.purse.army_raised — when spawnArmy charges the raise cost
interface PurseArmyRaisedTrace {
  type: 'economy.purse.army_raised';
  tick: number;
  factionId: string;
  armyId: string;
  cost: number;
  wealthAfter: number;
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Realm projection missing or failed to build | Land rent 0 that day; other sources pay; `console.warn` once per day |
| Settlement has no prosperity | Treated as the pivot (pays `TOWN_TAX_BASE`) |
| Unknown terrain or resource class | Rent / yield 0 for that hex or good |
| Faction with no `factionDefId`, no `guildType`, or no affinity row | No guild work; other sources pay |
| Army whose faction node is missing | Not charged; `checkUnderfunded` returns true as today (`armyAttrition.ts:229-231`) |
| `wealth` missing or non-numeric | `readWealth` falls back to 0 |
| Exception inside one faction's day | Caught per faction; that faction is skipped for the day, the rest settle; the phase's outer try/catch protects the tick |
| `paidThroughTick` missing on an old save's army | Read as `raisedTick`; the next pay day sets it |
| Old save with `FACTION_PURSE_ENABLED` but no opening purse | Factions start from their saved `wealth` (0); armies desert unless the land pays — acceptable, logged once |

## Blast Radius

`src/types/graph.ts` is not changed. `orchestrator.ts` gains one inline phase call. `debug-bridge.ts` gains two accessors. No ≥100-importer file changes shape; `types/army.ts` gains one optional field (`paidThroughTick`) on `armyState`.

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/engine/orchestrator.ts` | wide | One added call in a try/catch beside `holding_income`; no signature change |
| `src/types/army.ts` | wide | Additive optional field only |

## Game Design Laws check

- **Law 36** (the purse is small on purpose) — about the god's essence; untouched. Faction coin is world state the player reads, never spends.
- **Law 42** (simple frameworks, richness in connections) — one phase, five sources from data tables; no per-faction-type code (mercenaries get no exemption).
- **Law 43** (one concept per thing) — one store (`wealth`), one word (*Means*), and one five-word ladder shared with mortals on every surface; only what a faction's band measures (days of upkeep) differs.
- **Law 45 [P]** (never promise what the world will not do) — the spending sentence promises "a month" only from the same figure that pays the army; the broke line appears only when an army is actually unpaid.
- No random draw added (Laws 1–8 untouched).

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (chronicle triggers, data tables; encounter/attachment N/A with rationale)
- [x] UI pillar present (Purse panel, debug)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves *factions need something to fight over* (the map's destination) and *mechanics surface through prose, never numbers*.
- [x] No Vision edit needed.

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does**: armies now cost coin to raise and keep, and unpaid armies desert.
- [x] `Docs/canon/rulebook.md` is updated in the same PR as the build: one paragraph in the faction / war section (the executor writes it from § Systems design), and one line in the quick reference.

> Brainstorm companion: `Docs/plans/2026-10-15-thr-1931-faction-purse-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 25+ named constants in one file; tables are data |
| 2. Inspectability | PASS | Three trace types; `purseLastDay` on the node; debug tab and two bridge accessors |
| 3. Determinism | PASS | No new PRNG; factions and armies in id order; tax-holder ties broken deterministically |
| 4. Fail-soft | PASS | Per-faction catch inside the phase's try/catch; every missing input pays 0 |
| 5. Narrative over mechanical perfection | PASS | No debt number; broke is a state with a chronicle line; desertion through the existing story path |
| 6. Additive over destructive | PASS | New phase, new properties; the old underfunded predicate kept behind the flag; no file deleted |
| 7. Performance budget | PASS with note | Once a day: 52 factions × their holdings; land rent reads the cached projection (no rebuild). Guild work builds one town → present-factions index per pay day (a single pass over `member_of` + `located_at`, ~O(agents)), then each faction reads only its towns — no per-faction scan of all members. Measure the phase time in the 30-tick smoke and `test:heavy`; budget < 2 ms per pay day on seed 42 medium |

## Kill criteria

- If the four measured predicates below fail at the decision's numbers (big realm pace 7–12 days, small realm holds its host, losing land leaves a realm Destitute within 25 days, merchants afford a warehouse in ~10 days), retune the constants first; if no tuning passes, flip `FACTION_PURSE_ENABLED` off and reopen [the purse decision](https://linear.app/threadbare/issue/THR-1867).
- If worldgen armies desert in the first week on seed 42, the opening purse is wrong — retune `FACTION_STARTING_UPKEEP_DAYS`.
- If no realm raises an army in 50 days on seed 42 (or a warm playtest shows factions too poor to ever wage war), the purse throttles too hard — raise income, do not remove the gate.

## Done when

Predicates are measured on seed 42 medium over 600 ticks unless stated (the decision's plan-doc predicates):

- [ ] **Big realm pace:** the largest realm's purse affords a new army (raise + first day) within 7–12 days of paying for the previous one while that one is kept in the field.
- [ ] **Small realm holds its host:** a one-host realm with two towns keeps its host paid every day it holds both towns.
- [ ] **Losing land bankrupts:** a realm that loses its last town while keeping an army reaches Destitute within 25 days (fixture test that removes the town's `controls` edge).
- [ ] **Merchants can build:** the largest merchant guild affords a warehouse within ~10 days of game start.
- [ ] **Nothing pays twice:** across the run, every settlement's town tax goes to exactly one faction per day (test over the `economy.purse.day` traces).
- [ ] **No day-one desertion:** no worldgen army is unpaid on day 1.
- [ ] **Rollback:** with `FACTION_PURSE_ENABLED = false`, a 300-tick run on seed 42 is identical to main's in faction wealth (all 0) and army disband ticks.
- [ ] The faction sheet shows the Purse panel with a non-Destitute Means word for faction_0, its two named sources and its spending line. Four-part browser evidence: 1920×1080 screenshot, console clean, `await window.__DEBUG.getFactionPurse('faction_0')` non-null with `meansBand !== 'Destitute'`, a UI-Laws line for Laws 1, 13/14, 17, 21, 33, 37, 56.
- [ ] Interface contracts, systems inventory, the three wiki pages and the rulebook paragraph updated in the same PR.
- [ ] `npm run gate` green (code track: tests, typecheck ratchet, build, 30-tick CLI smoke, `test:heavy`); `npm run gate -- --final` last before push.
- [ ] Closing commit body and PR body carry the line-anchored closer for this issue.

## Coordination block

**Suggested model:** opus — an engine phase across armies, attrition, schism and worldgen, plus a UI panel; cross-system writes need care.

**Parallel-safe with:** [the encounter Stage](https://linear.app/threadbare/issue/THR-1877) follow-ups and [the type and icons rollout](https://linear.app/threadbare/issue/THR-1879) — no engine or `FactionSheet.tsx` overlap.

**Mutex with:** [the settlement economy](https://linear.app/threadbare/issue/THR-1923) — both add a daily economy phase near `holding_income` in `orchestrator.ts`, both touch `phaseSublocations.ts` reads and the economy wiki page; run one after the other. [The Inspector](https://linear.app/threadbare/issue/THR-1876) — it re-homes the faction page; whichever lands second moves the Purse panel. [Realms lose their members](https://linear.app/threadbare/issue/THR-1918) — touches `factionTopology.ts` / membership; land it first.

**Files to touch:**
- Create: `src/engine/factionPurse.ts`, `src/engine/factionPurse/{income,upkeep,means,purseSentences}.ts`, `src/data/faction-purse-constants.ts`, `src/data/faction-purse-chronicle-content.ts`, tests under `src/engine/__tests__/factionPurse*.test.ts`
- Edit: `Docs/ubiquitous-language/Agents.md` (§ Means, two sentences), `src/types/trace.ts` (register the three `economy.purse.*` trace types), `Docs/plans/wiring-checklist.md` (a *Faction purse* section below the stamp), `src/engine/orchestrator.ts` (one inline phase), `src/engine/wealth.ts` (`applyTreasuryDelta`), `src/engine/phaseFactionActions.ts` (two writers), `src/engine/armySpawning.ts` (gate + charge), `src/engine/armyAttrition.ts` (`checkUnderfunded`), `src/types/army.ts` (`paidThroughTick`), `src/engine/factionTopology.ts` + `src/data/game-config.ts` (schism term), `src/engine/worldSeed.ts` (opening purse), `src/engine/holdingIncome.ts` (comment only), `src/components/Game/FactionSheet.tsx` (Purse panel), `src/components/Game/debug/EconomyDebugTab.tsx`, `src/components/Game/debug/ArmiesTabContent.tsx` (a "paid through" column), `src/debug-bridge.ts` + `src/debug-bridge.d.ts`, tooltip registry, `scripts/interface-contracts.ts`, `Docs/canon/systems-inventory.md`, `Docs/canon/rulebook.md` + quick reference, `public/wiki-manifest.json` + the three wiki pages

## Notes for the executor

- **Do not drain stocks** for place yield; flow is THR-1866 / THR-1923's.
- **Do not add dues.** Realm membership churns ([THR-1918](https://linear.app/threadbare/issue/THR-1918)); a dues-built purse collapses.
- **Do not let `applyWealthDelta` touch a faction** after this lands; route every faction write through `applyTreasuryDelta` (grep `wealth:` writers under `phaseFactionActions.ts`).
- **Mercenary companies run dry** after their opening purse (~20 days) and their hosts desert — expected under this plan. Who hires a free company is a follow-up ([mercenary hire](https://linear.app/threadbare/issue/THR-1939)); do not add an exemption.
- `FACTION_TREASURY_TRIBUTE_RATE` (`types/factionAction.ts:109`, no readers) stays unread: a quest's tribute is mortal wealth's ([THR-1936](https://linear.app/threadbare/issue/THR-1936)).
- The crown ([THR-1932](https://linear.app/threadbare/issue/THR-1932)) will change *who* the tax holder is; keep the tax-holder rule in one helper (`factionPurse/income.ts → taxHolderOf`) so the crown replaces one function.

## Intent-judge verdicts

| Pass | Verdict | Findings | Disposition |
|---|---|---|---|
| 1 | **Revise** (Reversible) | dim 6 GAP (UL Means names one funnel); dim 10 GAP (kill criteria only in the proposal); dim 12 GAP (two Means ladders vs THR-1870 § 1, PC-6; `purse_broke` samples claimed debt and a month's arrears) | All four fixed: shared ladder (§ Resolution 3), chronicle samples rewritten, `## Kill criteria` added, UL Means edit in files to touch |
| 2 | **Revise** (Reversible) | dims 1–11 PASS; dim 12 GAP: the Player-facing text table still quoted the old arrears line | Fixed: the row now quotes § Prose tables; the desertion sample no longer implies arrears; Armies debug tab added to Files to touch |
| 3 | **Allow** (Reversible) | all 12 dimensions PASS; one unscored advisory: all-or-nothing upkeep means an army can go unpaid while coin remains, so "purse is empty" overclaimed | Taken: the broke line and the `purse_broke` sample now say the purse *cannot pay*, not that it is empty |

## Forked-audit verdicts

Run on the first draft, 2026-10-15 (design lane). The revisions after the intent judge change words and add sections; they do not touch any audited axis's findings.

### NFP audit

**PASS-with-notes.** Tunability PASS (~27 named constants, tables as data). Inspectability PASS-with-note: the three trace types were not registered in `src/types/trace.ts` — *fixed: added to Files to touch.* Determinism PASS (no new PRNG, id order, deterministic tie-break). Fail-soft PASS (per-faction catch inside the phase try/catch; missing inputs pay 0). Narrative PASS (no debt number; desertion through the story path). Additive PASS-with-note: retires one contract and ends double town tax, both behind the flag and the rollback Done-when. Performance PASS-with-note: guild work's per-faction search was uncosted — *fixed: one town → present-factions index per pay day (NFP row 7).*

### Three-pillar audit

**PASS-with-notes.** Engine, Content and UI all present and substantive; every required section present; Substrate inventory opens the plan with extends / activates / reads dispositions and runtime counts, and no green-field duplication. Notes: three Wiring rows had "—" in debug visibility — *fixed (opening purse, chronicle, schism rows now name their surface)*; `Docs/plans/wiring-checklist.md` was missing from Files to touch — *fixed.*

### Vision audit

**PASS-with-notes.** No contradictions. Confirms non-negotiables #2 (narrative over mechanics: no debt number), #3 (prose, never numbers: Means words, named sources, no amounts), #4 (graph-only), #5–#7. Core loop preserved — faction coin is world weather, no Needs-you entry. Note on design tension #4 (legibility vs mystery): a kingdom economy leans toward the 4X drift the north star warns against; the panel stays in words, and the next warm playtest should watch whether players start talking about faction economies as "optimal strategy". Carried into § Playtest signal as a watch item, not a change.
