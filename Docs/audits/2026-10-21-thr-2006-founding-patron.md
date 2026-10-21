> **Measurement and decision audit for THR-2006** (project M3: Dynamic Economy; deferred from THR-1967, undertakings in the economy S3). Design lane run 2026-10-21a, unattended. Decided by delegation (process.md rule 4) with a veto invited. Prototype and sketch on the never-merged branch `proto/thr-2006-founding-patron`: `src/engine/foundingPatron.ts`, `scripts/proto/founding-purse-sketch.ts`, `scripts/proto/founding-patron-arm.build.mjs`.

# THR-2006 — how founding stays affordable once founding costs switch on

Ground truth: `main` @ `9b73a4cf`, 2026-10-21. Medium map, 600 ticks, seeds 42, 7 and 99.

## Verdict in one paragraph

**A founding the mortal cannot pay for is paid by their faction.** Founding costs (`MEANS_CELL_COST`) stay as they are, and a mortal who can pay still pays from their own Means. When they cannot, the faction they rank highest in pays the whole cost from its purse, if the purse covers it. That faction is the **patron**. With no patron the founding stays off the mortal's board, as today. Measured with costs on, this brings foundings over 600 ticks back from **3 to 14** across the three seeds. With no costs at all the same seeds found 14. The switch itself (`MEANS_CELL_COST_ENABLED`) stays **off**. It now needs two measured predicates, not one: today's comfort pace, plus the founding-starvation floor on every gate seed. Seed 42 still fails the floor with the patron (1 against a floor of 2.5), so the switch would stay off even if comfort pace passed.

## 1. Why founding starves with costs on

`decisionBoard.ts:581-602` drops a costed cell from a mortal's board when `wealth < cost`, and `strategicActionLifecycle.ts:477` charges the founder when the work starts. Nothing else can pay. The sketch (`founding-purse-sketch.ts`) ran each seed as shipped (costs **off**). At every costed undertaking a mortal started, it recorded the founder's Means and the purse of the richest purse faction they belong to:

| Cell (cost) | Starts (3 seeds) | Founder can pay | Founder's faction can pay | Either can pay |
|---|---|---|---|---|
| Found a town, `create×location` (40) | 23 | 10 | 12 | 17 |
| Found a place, `create×place` (25) | 15 | 11 | 13 | 15 |
| Open a lane, `create×route` (20) | 19 | 18 | 11 | 18 |
| Raise a lane, `change:raise×route` (10) | 3 | 3 | 3 | 3 |
| Found a guild, `create×faction` (30) | 6 | **0** | 5 | 5 |

Per seed, town founders who could pay alone: seed 42, 1 of 7 (founders' median Means 27); seed 7, 5 of 10 (43); seed 99, 4 of 6 (100). **No guild founder could pay their own founding** on any seed (median Means 19 to 29). Most founders can pay for lanes and places themselves. They cannot pay for towns and guilds, which are the foundings a faction gains from: the founder's top-ranked town-holding faction rules a founded town (`pickFoundedTownRuler`, `undertakingEconomy.ts:89`).

The ticket's other numbers hold: trade pay paid 1 run (2 Means) on seed 42 and none on 7 or 99 in the costs-off arm. Lowering `TRADE_RUN_PAY_MAX`, the plan's prescribed lever, cannot move founding.

Purse scale: median purse-faction treasury rises from about 14 at tick 100 to 34–40 at tick 600 (52 to 61 purse factions per seed; the largest 198 to 237; `FACTION_TREASURY_CAP` 1000). A 40-Means founding is a real cost to the median faction and small to a realm.

## 2. Three arms, end to end

`npm run measure:founding-starvation`'s script, built three ways on the same commit: as shipped; costs patched on; costs and the patron patched on (`founding-patron-arm.build.mjs`). Foundings are settlements standing at tick 600 that did not exist at tick 0.

| Seed | Costs off | Costs on | Costs on + patron | Floor (0.5 × off) | Patron arm |
|---|---|---|---|---|---|
| 42 | 5 | 0 | 1 | 2.5 | FAIL |
| 7 | 5 | 1 | 4 | 2.5 | PASS |
| 99 | 4 | 2 | 9 | 2.0 | PASS |
| **Total** | **14** | **3** | **14** | | |

The costs-off and costs-on arms reproduce the ticket's table exactly. Seed 99 overshoots (9 against 4). With costs on, the cheaper cells the mortal cannot afford still drop, so a patron-funded town wins more boards. Whoever builds this watches that count. A ceiling is not set here, because the [settlement economy](https://linear.app/threadbare/issue/THR-1923) wants towns to grow, and one seed is not a trend.

## 3. Options weighed

| Option | Measured or reasoned | Verdict |
|---|---|---|
| **Faction patron** (taken) | 3 → 14 foundings; guilds 0 → 5 of 6 affordable | Fits Christian's 2026-10-14 priority: the kingdom economy (towns, factions, what they fight over) over deeper individual wealth. Faction purses already exist (THR-1931), and a founded town already goes to the founder's faction. Founding becomes a call on the purse that also pays armies: something for factions to spend on and fight over. It reuses the membership rank read and `applyTreasuryDelta`, so no new system is added (Game Design Law 42). |
| Cheaper town row (40 → 20 or 25) | Seed 42's town founders' median Means is 27, so it would roughly double who can pay there. Guild founders (median 19–29) stay mostly unable to pay | Rejected as the main lever: it leaves the guild hole, and it keeps the cost on the individual ledger Christian deprioritised. It stays the named next lever if seed 42 still fails after the patron ships. |
| A want that saves toward a founding | Already shipped: `MEANS_UNAFFORDED_WANT` (0.3) is live in the costs-on arm, and that arm founds 3 | Rejected. A pull toward paying work has nothing to pull with while paying work pays this little (THR-1865's own finding: paying work won 9 to 17 of about 1,650 board decisions). |
| Lower `TRADE_RUN_PAY_MAX` (the plan's kill-line lever) | Trade pay is not what moves the count | Retired. The kill line's lever is replaced by this decision. |

## 4. The decision, as build-ready rules

1. **Patron rule.** When a mortal cannot pay a costed cell (`wealth < MEANS_CELL_COST[key]`), their highest-ranked purse faction pays the whole cost, if its treasury covers it. Rank comes from `getDerivedMembershipRank`; ties break by faction id. The board treats the cell as affordable when a patron exists. The cost is charged to the patron's treasury through `applyTreasuryDelta`, never to the mortal. A guild's opening purse is unchanged: it starts with what the founding cost, now moved from the patron (a charter), and nothing is minted.
2. **Switch gate.** `MEANS_CELL_COST_ENABLED` may switch on only when both hold: comfort pace (`npm run measure:means`, median ≤ `MEANS_COMFORT_PACE_TARGET_TICKS`) **and** the founding-starvation floor (`FOUNDING_STARVATION_FLOOR` × costs-off, per seed, seeds 42, 7 and 99, patron on). Today comfort pace measures 514 against 120, and seed 42 fails the floor, so the switch stays off.
3. **Inspectability.** A patron payment emits a trace (`economy.founding.patron`: founder, patron, cost, template). When the switch is on, the founding's Chronicle line names the patron ("{founder} founds {town} with the backing of {patron}"), and the patron's purse spending sentence counts it. A switched-off feature shows nothing (Law 45).
4. **Next lever, if seed 42 still fails after the build:** lower `MEANS_CELL_COST['create×location']`, measured against the same three arms. That is a tuning call for whoever runs the switch, not a new decision.

## 5. Would change the call

- Christian saying a founding should be a **mortal's own** achievement, paid from their own purse ("no patrons"). Then the cheaper town row is next.
- A measurement after the [settlement economy build](https://linear.app/threadbare/issue/THR-1923) showing faction purses spent down by town growth, so that patrons rarely exist.

## Re-run

```
# on proto/thr-2006-founding-patron
npx esbuild scripts/proto/founding-purse-sketch.ts --bundle --platform=node --format=esm --outfile=.cache/founding-purse-sketch.mjs --external:fs --external:path
node .cache/founding-purse-sketch.mjs --seed 42 --ticks 600
node scripts/proto/founding-patron-arm.build.mjs && node .cache/founding-patron-on.mjs --seeds 42 --ticks 600
```

Run one seed per process: two arms on several seeds exceed the 600 s command cap.
