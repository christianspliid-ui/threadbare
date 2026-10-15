# Brainstorm companion — the faction purse (THR-1931)

Companion to [`2026-10-15-thr-1931-faction-purse.md`](2026-10-15-thr-1931-faction-purse.md). It records where the direction came from, the alternatives weighed, the tensions, and the Vision premises behind each choice. The decisions themselves are settled input from the [Mortal economy map](https://linear.app/threadbare/issue/THR-1863); this file records the *how* choices this plan doc made on top of them.

## Where the direction came from

Christian, in an attended session on 2026-10-14, ruled four scopes on the [faction purse ticket](https://linear.app/threadbare/issue/THR-1867), verbatim in its comments:

1. *"make sure that we also connect faction control of locations on the map that provide resources to the factions resources. and ensure we have a way of connecting factions to control of hexes, using our border system"* — place yield and land rent.
2. *"find a way for faction types to connect to certain relevant resource producing locations. the king of a country has a faction of his own that owns armies and taxes everyone in the country."* — the guild affinity table and the two-layer kingdom.
3. *"the crown goes to those who can convince other factions of fealty and tax rights"* — the crown is earned; it is the next plan doc ([THR-1932](https://linear.app/threadbare/issue/THR-1932)), not this one.
4. The map-level priority: *"a basic 'kingdom' economy so factions have something to fight over"*, and kingdom before individual richness.

On 2026-10-15 he released the carve-up: *"Keep all three calls as decided. The plan docs can go ahead."* (map comment, 08:29Z).

## Settled, not re-opened here

Income sources and rates, the 20% landholder cut, no dues, army raise 50, upkeep 1.5 / 2.5 / 3.5, desertion through the existing underfunded path, the four guild spends going live, the 1000 treasury cap, the Means word as days of upkeep, and the Purse panel's content (from the visibility decision, [THR-1870](https://linear.app/threadbare/issue/THR-1870)). The prototype ledger ([output](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1867-faction-purse/scripts/proto/faction-purse-ledger.output.txt)) is the evidence base.

## How-level choices this plan made

### 1. One phase, or fold income into holding income?

| Option | Verdict | Why |
|---|---|---|
| Extend `payHoldingIncome` to pay factions | rejected | Holding income is the *mortal* funnel (`bankWealth`, the Means word for agents, the 0–100 clamp). Factions need their own cap (1000), their own five sources, upkeep and a broke state. Folding them in would put two scales behind one function and make every mortal-income test a faction test too. |
| **A new `faction_purse` phase on the same daily cadence, reading the same `controls` edges** | **chosen** | One writer for faction treasuries, one place to trace a faction's day. Holding income keeps its faction skip, which now means "factions are paid elsewhere" instead of "factions are never paid". |
| Pay per tick | rejected | The decision is per day; a per-tick drip makes the ledger unreadable in traces and multiplies work by 12. |

### 2. Where does the money live?

`faction.properties.wealth` already exists and the faction sheet already reads it (`getWealthTier`). A second field (`treasury`) would leave two numbers that could disagree. The plan keeps **`wealth`** as the one store and gives factions their own clamp (0–`FACTION_TREASURY_CAP`) at the one writer, so the mortal clamp never touches a faction. Law 43 (one concept per thing): the player's word is still *Means*.

### 3. A faction with armies at game start and an empty purse

The decision did not say what a faction starts with. Measured: five armies are fielded at day 0 (two mercenary hosts, two realm regiments, one realm host) and every treasury is 0. With no opening purse, the two mercenary companies (no towns, no places, no guild work) would be Destitute on day 1 and their hosts would start deserting at once — a world that opens with armies melting is noise, not story.

| Option | Verdict | Why |
|---|---|---|
| Start everyone at 0 | rejected | Day-1 desertion everywhere a worldgen army stands. |
| **Seed `FACTION_STARTING_UPKEEP_DAYS` (20) days of the upkeep a faction fields at worldgen, plus `FACTION_STARTING_PURSE` (10) for everyone** | **chosen** | Every faction opens Comfortable; a faction whose land cannot carry its army drifts to Getting by and Destitute over weeks, which is the story the decision wants ("losing land bankrupts"). 10 covers a quest and leaves room for nothing more, so guilds still earn their first warehouse. |
| A flat 100 for everyone | rejected | Hands small guilds a counting house on day 1 and makes the first month quiet. |

### 4. The mercenary companies

They hold no towns, no places and do no guild work, so under the decision they earn nothing and their hosts desert once the opening purse runs out (~20 days). The decision did not address them; no hire system exists that would pay them.

| Option | Verdict | Why |
|---|---|---|
| Let them run dry | **chosen for v1** | It is the decision applied as written, it is a readable story ("the Free Company went unpaid and broke up"), and it costs no special case (Law 42). |
| Exempt them from upkeep | rejected | A per-faction-type exemption is the bespoke case Law 42 warns against, and it hides the gap instead of naming it. |
| Invent a hire contract now | out of scope | Who hires a free company, and with what, is a new mechanic. Filed as [mercenary hire](https://linear.app/threadbare/issue/THR-1939). |

### 5. Which lands first: this plan or the settlement economy?

The settlement economy ([THR-1923](https://linear.app/threadbare/issue/THR-1923)) ships `faction-building-lean.ts` if it lands first and says the purse's affinity table supersedes it. This plan ships `GUILD_PLACE_AFFINITY` in `src/data/faction-purse-constants.ts` either way, and adds one line to the lean: a faction whose affinity entry names a building type uses it; otherwise the lean's class table stands. No file is deleted. Either order works; the second to land wires the read.

### 6. Town tax with two controllers

Today two `controls` edges on one town each collect in full. The decision says one holder. The rule here is the decision's: the realm whose border holds the town, if that realm holds it; else the strongest controller. *Strongest* reads the edge's existing `influence` property (worldgen writes it, `worldSeed.ts:508,1697`; conquest and strategic edges carry none, read as 0), ties broken by the earliest `establishedTick` (missing = 0) and then faction id, so the result is deterministic. No new edge property. The crown plan grows this rule.

### 7. Upkeep when the purse cannot pay

| Option | Verdict | Why |
|---|---|---|
| Treasury goes negative (the prototype's ledger) | rejected | A debt nobody collects is a number with no story, and `getWealthTier` would need a negative band. |
| **Pay what you can, floor at 0, mark every army of the faction unpaid for the day** | **chosen** | `checkUnderfunded` reads "unpaid today", so desertion runs through the existing cohesion path. The broke state is a fact on the faction, not a sign on a number. |
| Disband the newest army first | rejected for v1 | A choice of *which* army deserts is a design question the decision left to the existing path; that path treats every unpaid army alike. |

### 8. Schism pressure from an empty purse

The decision adds a treasury term to `factionTopology` pressure. It is bounded (`PURSE_SCHISM_PRESSURE` at most, only while Destitute) so an empty purse alone never splits a faction; it tips a faction already strained by membership or grievance.

### 9. Which words the Means chip says

The purse decision named the bands Bankrupt · Strained · Solvent · Flush · Overflowing. The later visibility decision (THR-1870 § 1) fixed one purse ladder for every surface — Destitute · Getting by · Comfortable · Wealthy · Magnate, the mortal words — with factions measured by days of upkeep. The intent judge (first pass, Revise) flagged the two ladders as one fact told two ways (PC-6).

| Option | Verdict | Why |
|---|---|---|
| Keep the decision's words for factions | rejected | Two ladders for one word (*Means*) breaks Law 43 and PC-6; a player who learnt "Comfortable" on a mortal has to learn "Solvent" for a faction. |
| **Shared five words, faction measured in days of upkeep** | **chosen** | Exactly what THR-1870 § 1 says; same thresholds as the decision, so no number changes. The decision's working names map one-to-one and appear nowhere. |

## Tensions noted

- **Realms bleed members** ([THR-1918](https://linear.app/threadbare/issue/THR-1918)). The purse does not depend on members (no dues), so the bug does not starve it; but schism pressure reads members too, so the bug should land first for the pressure term to read true.
- **Seizing a lane tolls the wrong lane** ([THR-1883](https://linear.app/threadbare/issue/THR-1883)). Tolls are one of five sources; no faction holds a lane at worldgen, so the purse works without it. When the bug is fixed, tolls flow through this phase with no change here.
- **Law 36 (the purse is small on purpose)** is about the god's essence, not faction coin. Faction purses are the world's weather; the player reads them, never spends them.

## Vision premises

- *All mechanics surface through prose, never numbers* (Vision non-negotiable § 3): the Purse panel names sources and says how long the coin lasts; no amount appears.
- *Factions need something to fight over* (the map's destination): the purse makes towns, mines and borders pay, and makes armies cost, so war has a price and land has a value.
- *Equilibrium is silence*: a solvent faction with no armies does not chronicle anything; only a faction going broke, and soldiers leaving, reach the player.
