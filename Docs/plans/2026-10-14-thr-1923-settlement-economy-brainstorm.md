# Brainstorm companion — the settlement economy (THR-1923)

Companion to [`2026-10-14-thr-1923-settlement-economy.md`](2026-10-14-thr-1923-settlement-economy.md). It records the alternatives considered, the tensions, and the Vision premises behind each choice.

## Where the direction came from

Four messages from Christian in one chat on 2026-10-14, each narrowing the last. They are recorded verbatim on the [goods-flow ticket](https://linear.app/threadbare/issue/THR-1866):

1. *"simple simulation of goods flow a la civ, not along roads."* This retired the design lane's decision that morning, which had towns draw stock from nearby fields and parked lane flow.
2. *"resources do not stockpile to large numbers but instead … extra resources lead to growth on different dimensions locally, as well as start of trade routes trying to sell the surplus."*
3. *"we want a diverse world map … diverse settlements of diverse sizes and with diverse buildings and traits."*
4. *"you also don't get a city unless there is a faction HQ in the city that can pull in resources."* He also confirmed that a town is what a strong local economy reaches on its own.

## Alternatives weighed

### How goods move

| Option | Verdict | Why |
|---|---|---|
| Fixed stocks plus shocks (today) | rejected | The goods-flow prototype showed blights never heal and only 16 of 38 settlements can starve. |
| Regrowth and use of stocks | rejected as the core | Empty land filled up with gluts while towns starved (staple median 42 → 67, 13 empty places glutted). |
| Lanes balancing surplus to scarcity | rejected | Christian: "not along roads". The prototype also measured 0 staple moved, because lanes join towns, not fields. |
| Hinterland draw (towns pull stock from fields) | superseded | It worked (7 promotions against 0 elsewhere), but it moved piles of stock around. Civ yields are flows, which is simpler. |
| **Civ-style yields into local sinks, with surplus-born routes** | **chosen** | It matches all four directions. There are no piles, and routes exist only to sell surplus. |

### What surplus becomes

- **Food → people.** Christian's own example. Population becomes a number for the first time. It is never shown as a numeral: the player reads a size word and a trend (UI Law 13).
- **Wood and stone → buildings.** These are Places (UL), not a new building system. That reuses the Place cards, art categories, the trait plumbing and encounter placement.
- **Special goods → unlocks and traits.** This is the main source of diversity. Rare place subtypes already exist on the map (gem deposits, herb gardens, crystal caverns, iron seeps), so no new content is needed to place them.
- **Happiness:** a separate "happiness" stat was rejected under Game Design Law 43 (one concept per thing). Happiness writes into `unrest`, which the game already reads (prosperity target, the *lawless* trait).

### Why the map stays diverse (the levers the prototype found)

The prototype's agreed model ([output](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1923-settlement-economy/scripts/proto/settlement-economy-agreed.output.txt)) passes all four measures. The control ([output](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1923-settlement-economy/scripts/proto/settlement-economy-flat.output.txt)) has no slot limit, no specialisation and no seat rule. It makes 28 of 38 settlements cities, and only 30% of same-tier pairs differ. The tuning history of the sketch:

1. **First run:** imports did not feed anyone, so land-poor seat cities starved to 1 person. Fixed by adding imports to the next day's yield.
2. **"Iron Town" on most towns:** ore deposits sit in most hills. Fixed by making ore special only at quantity ≥ 60 or at an iron seep or mine.
3. **"Breadbasket" measured size, not soil.** Fixed by measuring food per worked hex.
4. **Everyone stopped at the same housing cap (7).** This was the biggest convergence trap. Fixed by making housing land-based: one home per 2.5 food the best hexes can give.
5. **Too many cities, then too few:**
   - When every faction home counted as a seat, 23 places could become cities.
   - When only seats with holdings counted, only 3 realm seats could, and the world's 12 genome cities collapsed to towns.
   - The chosen rule, "a seat pulls when it holds another settlement or at least 2 routes run into it", gives 13 cities and 2 capitals. Christian's wording "can pull in resources" decided it.
6. **The world shrank before play started.** Two causes: a negative-day sentinel bug made every hex count as blighted during the settling run, and settlements started above what their land could hold. Fixed by starting each at its land cap and running 100 settling days. Day 0 now sits within one tier of the genome for 34 of 38 settlements.

### The tension that stays open

**A still world after settling.** With no war, god verbs or faction moves, the sketch's world is static after day 0. The canon (*"equilibrium is silence"*) says that is right: stories come from anomalies. The engine supplies them through land shocks (god verbs, sieges), seats lost and won, and cut routes. If a playtest finds the map too still, the lever is shock frequency and size, not more churn in the model.

### Rejected along the way

- **A separate building system with its own slots and art.** Rejected under Law 41 (one vocabulary) and Law 58 (one entry per kind). Buildings are Places with an `isBuilding` flag.
- **Showing population as a number.** Rejected under UI Law 13.
- **Capital tier for any big city.** Capital means a realm's (or crown's) seat. The prototype showed that "big" alone makes every seat a capital.
- **Making the genome materialize on promotion** (the "Task 10" gap). Out of scope; buildings come from this phase instead.

## Vision premises

- The world is alive without the god, and the god moves it through mortals and a few verbs. Here the economy moves on its own, and the god's verbs land as visible shocks to the land.
- Factions have something to fight over: the map's first judgement test. Fields feed towns, villages feed seat cities, and routes carry what war can cut.
- The map is different every run: the second judgement test. The four measures are now a heavy test, not a hope.
