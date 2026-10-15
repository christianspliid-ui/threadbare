# Brainstorm companion — economic war aims (THR-1933)

Companion to [`2026-10-15-thr-1933-war-aims.md`](2026-10-15-thr-1933-war-aims.md). The game-level calls were made in [the war-aims decision](https://linear.app/threadbare/issue/THR-1868) (design lane, 2026-10-14, kept by Christian 2026-10-15). This file records the how-level choices the plan made, the options not taken, and the Vision premises they rest on.

## Vision premises in play

- **Factions act whether or not the god watches** (Law 13). War aims must run for every army, so the world's wars have causes a player can read after the fact.
- **The world's weather, not a spreadsheet** (the purse plan's watch item). War value is never shown as a number; the player reads "the richest enemy town within reach", not a score.
- **The god tilts, never commands.** This plan adds no card. The god's way into a war stays the economy verbs (Bless the Harvest, Blight the Fields, Guide the Caravan…), which now change *what an army wants*, because a town's fields and stocks set its value.

## Choices made under delegation

**1. One enemy rule for targeting, battles and sieges.** Veto: *"armies of different factions should still fight when they meet"*.
- *Taken:* `isEnemyFaction` gates all three. The decision says an army marches only on an enemy; a march that stops one hex short because two non-enemy armies fight in the road, or a siege laid on a neutral town the army passes through (`battleResolution.ts:619-629`), would break that promise from the side.
- *Not taken:* fix targeting only (THR-1922's scope). Cheaper, but the sketch's Civic Guard besieged its own hall towns in place, which the siege start does regardless of targeting.
- *Not taken:* widen `areFactionsHostile`. Its callers (auras, spells, undertaking motives) mean "a declared rivalry"; widening it changes three unrelated systems.

**2. Defend at the holding, do not chase.** Veto: *"armies should ride out to meet the enemy"*.
- *Taken:* the defender marches to the threatened town and stands with the existing prepared-defence bonus. Movement paths to Locations; an enemy army moves every tick, so chasing needs a moving-target path and a re-path every tick. Holding the walls is also the story a player expects.
- *Not taken (B):* `intercept` the enemy army. Left unwritten; the objective type stays declared for a later need.

**3. Re-aim once a day.** Veto: *"an army should keep the target it was raised for"*.
- *Taken:* daily, with no churn mid-march (a still-valid conquer target is kept; only defence interrupts). Defence first cannot work if the objective is chosen only at the raise, as today.
- *Not taken:* every tick (churn, cost) or only on events (no event exists for "an enemy army chose my town").

**4. Supply reach = the supply walk from the target town.** Veto: *"armies should march anywhere they can walk"*.
- *Taken:* a town is in reach when an army besieging it could be fed, using `resolveSupplyLine` unchanged, with a 16-hex backstop. The decision required the cap ("the mean value pick is 9.8 hexes away against 0.7 today") and named supply as the measure.
- *Not taken:* a flat hex radius only. Kept as the kill-criterion fallback if the walk proves too strict.

**5. A town's field share is split among its neighbours.** The decision says "its share of the fields within 3 hexes". *Taken:* a field's yield ÷ the settlements within 3 hexes of it, so a field between two towns is worth half to each. *Not taken:* full yield to every town near it (double counts; every border town looks rich).

**6. Revenge leans, it does not lock.** `× 1.5` for the grievance's faction. A revenge army can still take a richer enemy's town. *Not taken:* revenge only against the grievance faction (an army with that enemy out of reach would hold forever).

**7. Two slices, monopolies second.** Veto: *"ship monopolies with the armies"*. S1 is worth having alone (wars about something, defence that backs the crown). Every monopoly piece needs the regional rule first, and two of its surfaces wait on unbuilt screens (the Trade lens, the Purse panel). S1 keeps one seam (`monopolyBonusFor`) so S2 changes no S1 code.

**8. A regional monopoly is anchored on one place.** *Taken:* the holder's bearing place with the most held places within 8 hexes. A region that is "8 hexes around wherever" would wander day to day and fire `monopoly_broken` / `monopoly_established` pairs as the anchor moved. *Not taken:* regions as realm borders (only realms have borders; guilds would never hold one).

**9. Embargo: a stock cut on the towns, drawn on the lanes.** The decision: "the enemy's towns in that region lose that resource's stock contribution". Measured: lanes carry no goods into stocks on main; a town's stock reads only its own props. *Taken:* the embargoed towns lose `EMBARGO_BALANCE_CUT` on that resource's balance (one term in the stock pass), and the lanes between the region and those towns are derived from the holder's one `activeEmbargo` record so the Trade lens draws them red and dashed. One record on the faction, not marks on towns and lanes: a relationship stored on both ends is a second source of truth (intent judge, dimension 8). When goods flow lands, the cut becomes "the lanes carry none of it". *Not taken:* lanes only (nothing would happen today: a promise the world does not keep, Law 45); towns only (invisible on the map).

**10. Dead Consortium ids: map two, drop five.** `trade_war` and `monopoly_bid` → `mct.senior.trade_monopoly`, `trade_empire` → `mct.elite.market_domination` (the decision). The other five have no template and no decision to author them; a quest id with no template is a promise the world does not keep (Law 45).

## Tensions noted

- **Excommunication writes `hostile_to`** ([THR-1918](https://linear.app/threadbare/issue/THR-1918): 264 excommunications in 600 ticks). Under the enemy rule, a realm's former members' factions may become enemies. That is correct by the rule, but the predicates should be re-measured once THR-1918 lands.
- **Mercenary companies** have no hire yet ([THR-1939](https://linear.app/threadbare/issue/THR-1939)). Under the enemy rule they fight only their enemies; with the purse they break up when their coin runs out. Hire contracts will need to make an employer's enemy the company's enemy.
- **The 6-hex half-value** is the decision's; with the supply cap, most picks will be 4–12 hexes out. Tunable.
