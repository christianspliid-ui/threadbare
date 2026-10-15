# Brainstorm companion — mortal wealth (THR-1936)

Companion to [`2026-10-15-thr-1936-mortal-wealth.md`](2026-10-15-thr-1936-mortal-wealth.md). It records where the direction came from, the alternatives weighed and the Vision premises behind each *how* choice this plan made. The decisions themselves are settled input from the [Mortal economy map](https://linear.app/threadbare/issue/THR-1863).

## Where the direction came from

- [What money means to a mortal](https://linear.app/threadbare/issue/THR-1865), decided by the design lane under delegation on 2026-10-14: *a want first, a cost later.* Deciders are born with role Means; poverty and greed pull toward paying work; Generous softens it; the rich who are not greedy turn away; founding costs switch on only once paying work pays; the 50–65% window is untouched. Its veto window closed with no veto.
- [Which money encounters should change the economy](https://linear.app/threadbare/issue/THR-1872), the orchestrator's research: 71 rows, two structural blockers (simple encounters drop step writes; step writes are binary), thirteen defects. It left *how much of the table to build* open.
- Christian, 2026-10-14, parking THR-1865 behind the kingdom economy: re-check it *"against the kingdom design (for example, whether a mortal's Means should come from their town's and faction's fortunes rather than their own ledger)."*
- Christian, 2026-10-15 08:29Z, releasing the carve-up: *"The plan docs can go ahead."* This plan is seventh in the map's order; authoring may start because the kingdom tickets are decided (ticket description).

## How-level choices this plan made

### 1. Own ledger, or Means from the town and faction?

| Option | Verdict | Why |
|---|---|---|
| Means derived from the home town's prosperity and the faction's purse | rejected | Every mortal in a town would be equally rich, which the map's second ruling forbids (*"all settlements shouldn't end up looking the same"* applies to people inside them too). The money encounters and holding income would have nothing personal to write, so the research table would be dead on arrival. |
| **Own ledger, born from role and shifted by the home town's fortunes** | **chosen** | Keeps the decision's ledger and the one funnel (`bankWealth`). The town reaches a mortal's Means three ways: at birth (±10 by the town's prosperity word), through what a held place pays (holding income, unchanged), and through [hunger and unrest](https://linear.app/threadbare/issue/THR-1934)'s *Restless home = one Means band poorer*. That is the kingdom design reaching the individual without replacing them. |
| Own ledger that drifts daily toward the town's fortune | rejected for v1 | A second daily writer that would fight every encounter write and erase the story of a lucky or ruined mortal. Revisit if a playtest shows Means detached from the world. |

### 2. Where does an encounter's money get written?

| Option | Verdict | Why |
|---|---|---|
| Step `onSuccess` / `onFailure` ops | rejected | Binary (no success-at-cost or critical bands), and simple encounters drop them in the converter. Fixing both would rebuild step ops for one use. |
| Put the write in the aftermath reactions | rejected | Reactions are the mortal's choice of what to carry forward; money is what the dice decided. A write in every reaction duplicates content, and an unwatched mortal's reaction is applied by a capped phase that can lag. |
| **An outcome table on the template (band → effects), applied once at resolution in `fireResolvedActionTriggers`** | **chosen** | The hook already has the world state, the final band and the change list, and runs for every mortal. It reuses the aftermath effect executor (Law 41), so the table can carry any existing effect — debts, conditions — not just money. Branching encounters can put a table on an aftermath variant when the path decides who paid. |

### 3. One effect kind or several?

The research names money, prosperity, staples, deposits, lane volume, unrest and purses. One `economy_shift` with a `quantity` field covers them all with one executor case and one trace shape; S1 implements `means` only, S3 widens it. Separate kinds per quantity would be the special-casing Law 42 warns against.

### 4. What counts as paying work?

| Option | Verdict | Why |
|---|---|---|
| A fixed list of encounter types (trade, acquire, steal, hire), as the prototype did | rejected | The measured types do not line up with money: the merchant caravan is `lead`, the craftsman's challenge `create`, the sunken vault `explore`, and `acquire` includes market haggling, which *costs* Means. |
| **Derived from content: an encounter whose outcome table pays its actor at success** | **chosen** | What counts follows what was authored; adding a paying encounter needs no list edit (Law 42). The want and the table therefore ship together in S2, which is the decision's own warning (*"the want is hollow until paying work reaches the boards"*). |

### 5. Poverty spirals

The want pulls poor mortals toward paying work, and paying work can fail and cost. Without a guard, a run of failures could pin a mortal at 0 with the want at full: the stuck trap the THR-1575 ruling forbids. Losses are halved below Getting by and Means floors at 0. A kill criterion watches the Destitute share over 600 ticks.

### 6. How much of the 71-row table?

S2 builds the Means half of every row (about 40 templates), because that is what the want needs. S3 builds the world halves (prosperity, unrest, stock, lanes) and the purse rows after the faction purse ships. The rows that need a new primitive the research could not specify cheaply — a place held after success, a write bound to one lane (the seeds drop it), an oath from tribute, removing a debt, and draws that lean on famine or glut — go to one Deferral rather than being guessed here.

### 7. Founding costs

The decision measured costs before income starving founding (costed starts 9 → 1). The switch ships off; S2 measures the decision's predicate (a Getting-by decider reaches Comfortable in at most 120 ticks, half today's 240) with the Means rows live, and flips it on in the same PR only if it holds.

### 8. When does it build?

The first draft let birth Means and the encounter seam build alongside the faction purse, holding back only the purse rows. The intent judge escalated it: Christian ranked individual richness below the kingdom economy, and the ticket says to schedule the build after the purse. The plan now blocks S1 on the faction purse build, so nothing here ships first.

## Tensions

- **Legibility vs mystery.** Showing every small Means move would turn the aftermath into a ledger. The `economy` change names the word only when a band is crossed and otherwise says only which way fortunes turned (the visibility decision, § 5).
- **4X drift.** The want is a weight on what mortals choose, never a number the player manages. The player has no verb on a mortal's Means in this plan; the god's-stake plan's *Fortune's Favour* and *Ruin* move it by a whole band and land later.

## Vision premises

- *Mechanics surface through prose, never numbers* (non-negotiable § 3): Means stays a word; no amount anywhere.
- *The world does not wait for the god* (Law 13): mortals now earn and lose on their own.
- *Failure is plot, not punishment* (Law 22): failed ventures cost Means, a mark the sheet shows.
