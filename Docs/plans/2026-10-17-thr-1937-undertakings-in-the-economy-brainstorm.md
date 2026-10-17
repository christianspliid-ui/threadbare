> **title:** Undertakings in the economy — brainstorm companion — THR-1937
> **linear_issue:** THR-1937
> **author:** Claude Code (design lane, unattended, run 2026-10-17a)
> **created:** 2026-10-17
> **companion_of:** `Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy.md`

# Undertakings in the economy — brainstorm companion

The *what* is settled by [Undertakings in the economy](https://linear.app/threadbare/issue/THR-1873) (decided by the design lane under delegation 2026-10-14T17:32Z; veto day closed 2026-10-15T17:33Z with no veto). This file records the *how-level* alternatives the plan weighed, the tensions it holds, and the Vision premises it leans on. Each choice below is invited for veto in the lane report.

## How-level choices and the alternatives not taken

### 1. Slicing: three builds, ordered by the map's ruling

- **Taken:** S1 *what founding leaves behind* (town ruler and founder freehold, the lane's toll holder, the guild's purse and reach) after the faction purse build; S2 *the town's next building* after the settlement-economy build; S3 *trade pays and ambitions measure it* after mortal wealth S1 and war aims S2.
- **Not taken — one build:** five cells, four upstream builds and the ambition table in one PR. Its blockers would be the union of all four, so nothing would ship until the last upstream lands, and a regression would be hard to attribute.
- **Not taken — S1 before the purse:** the ruler's `controls` edge is only worth writing once something taxes through it. Writing it earlier is harmless but the map's order (*"kingdom before individual richness"*, then *"mortal wealth, then undertakings, last"*) puts every undertaking build last.

### 2. Which faction rules a founded town

- **Taken:** the founder's faction with the highest `member_of.rank` among those that already control at least one settlement; a tie goes to a realm, then the lower faction id. Rank is read through the one rank reader, never the raw edge, because rank has disagreeing writers (THR-1448).
- **Not taken — the faction whose border holds the hex:** that is the purse's *tax holder* rule, which already sends land rent to the bordering realm. Using it for the ruler too would make founding a town inside a rival realm a gift to that rival, which no founder would do. The decision names the founder's own faction.
- **Not taken — the founder always rules:** rejected by the decision itself (mortal lords outside the realm-and-crown structure).

### 3. The building: chosen when the work starts, checked again when it ends

- **Taken:** the candidate is picked from the settlement-economy chooser when the undertaking starts (so the moment card can name it) and re-checked at completion. If the town's slots filled in the meantime, or the candidate no longer qualifies, the chooser runs again; if it returns nothing, the work completes with nothing raised and a plain completion line saying so.
- **Not taken — pick only at completion:** the moment card and the activity line could not name what is being built, which fails Law 16 (say what is happening).
- **Not taken — force the original pick past a full slot:** breaks the slot rule the diversity measures depend on.

### 4. Trade pay: once per trader per day

- **Taken:** a trade run pays `TRADE_RUN_PAY_BASE` + `TRADE_RUN_PAY_PER_UNIT` × the lane's `carriedPerDay`, capped at `TRADE_RUN_PAY_MAX`, at most once per trader per game day, kept as one number on the trader (`lastTradeRunPaidTick`).
- **Not taken — once per trader per lane:** needs a map keyed by trader id on each lane, an id-keyed relationship in a property bag (Vision non-negotiable #4); a mortal who trades two lanes a day gains little the want does not already give.
- **Why the limit:** `use × route` is an instant cell, and canon records that an instant cell cannot fail and becomes a no-risk farm when it pays every time (THR-1440, the capability rider). A day's limit keeps the run a living and not a mill.
- **Not taken — pay by a roll:** the cell has no checkpoint to roll; adding one changes the undertaking model.

### 5. Founding a guild with costs off

- **Taken:** the guild's purse starts with exactly what the founder paid. With founding costs switched off (mortal wealth S2 ships them off unless its predicate holds), that is 0, and the purse's guild-work income fills it from the first pay day. The plan adds the missing `create × faction` row to the cost table so that the transfer has something to move when costs are on.
- **Not taken — a starting grant:** minting coin contradicts the decision (*"nothing minted"*).

### 6. Lanes a mortal "holds"

- **Taken:** a lane counts for `agent_holds_lanes` while it stands and the mortal either tolls it (`controlledBy`) or founded it (a `constructed_by` edge from the lane's identity node, which `create × route` already mints, to the founder), or claimed it (`owns` on the identity node).
- **Not taken — a `foundedBy` id on the `trades_with` edge:** the first draft did this; the Vision audit flagged it (relationships are edges, never property ids). The identity node exists exactly so a lane can be owned and named, so the founder hangs off it like a town's founder.

## Tensions held

- **Tycoon pull (Vision tension: Malazan vs 4X).** Ambitions that count lanes and Means could turn mortals into spreadsheets. Held by: words only on every surface (Means words, "holds two trade lanes"), no amounts, and the ambition table keeping its story milestones (bonds, Reach) beside the new ones.
- **Sameness.** A mortal-raised building could make every town grow the same way. Held by drawing it from the town's own chooser, so the land decides, and by the slot rule.
- **Ordering vs. usefulness.** S3 waits on the longest chain. Accepted: the map's order is Christian's ruling.

## Vision premises leaned on

- *The world does not wait for the god*: mortals found, build and trade on their own, and what they make stays.
- *Mechanics surface through prose, never numbers*: every new fact reads as a word or a sentence.
- *A mortal is a person, not a unit*: the founder keeps a freehold in the town they founded, a personal stake the chronicle can name.
