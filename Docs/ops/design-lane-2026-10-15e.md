---
lane: tb-design-lane
run: 2026-10-15e
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-15 (run e, ~19:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The mortal wealth plan](https://linear.app/threadbare/issue/THR-1936/plan-doc-mortal-wealth-a-mortals-means-becomes-a-want-and-the-money) — **your re-check, answered: a mortal keeps their own purse, and their town and faction reach it from outside.** You asked whether a mortal's money should come from their town's and faction's fortunes. It doesn't: then every mortal in a town would be equally rich, and the money encounters would have nothing of theirs to change. Instead, a mortal born in a thriving town starts a little richer and one born in a poor town a little poorer. What they hold still pays them. A hungry town makes its people poorer. Coin flows from mortals to their factions, through levies and dues paid in scenes. Factions do not pay their people yet: a faction's quests paying out is filed for later. ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-15-thr-1936-mortal-wealth.md), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-15-thr-1936-mortal-wealth-brainstorm.md)) *Veto:* **"a mortal's money should come from their town"** or **"factions should pay their members"**.
- Same plan — **every mortal who makes their own choices is born with money from their walk of life**, so the sheet shows their Means from day one. A noble starts Wealthy, a monk Destitute. *Veto:* **"start everyone equal"**.
- Same plan — **the dice decide what a venture paid, not the mortal's reaction afterwards.** A money encounter pays or costs its mortal once, by how the roll fell: a win pays, a big win can pay more, and a loss costs. The mortal then reacts to what happened. *Veto:* **"let the reaction choose who pays"**.
- Same plan — **a mortal who is already poor loses half as much when a venture fails**, so bad luck never traps them at nothing. *Veto:* **"the poor should lose the same"**.
- Same plan — **before the roll, the encounter's opening line warns that the purse is at stake** ("…must strike a bargain at the market — or come away poorer"). After it, the aftermath says *better off* or *worse off*, or *fortunes turn up* or *down*. It never gives an amount. *Veto:* **"don't warn about money before the roll"**.
- Same plan — **nothing in it is built before the faction purse**, keeping your order: kingdom first, then individual wealth. The plan comes in three parts: money at birth and the first paying encounter; then the other ~40 encounters, with poor and greedy mortals leaning toward paying work; then encounters that change towns, roads and faction purses. Costs for founding a town stay off until paying work is shown to pay. *Veto:* **"build mortal wealth now, beside the purse"**.

## Work

- **Claimed** [the mortal wealth plan](https://linear.app/threadbare/issue/THR-1936/plan-doc-mortal-wealth-a-mortals-means-becomes-a-want-and-the-money) (claim `2026-10-15e`). No vetoes in the briefing, no open maps, and the shelf is full (17 ready). The next three plans in the map's order ([war aims](https://linear.app/threadbare/issue/THR-1933/plan-doc-economic-war-aims-armies-march-on-enemies-for-their-richest), [hunger and unrest](https://linear.app/threadbare/issue/THR-1934/plan-doc-hunger-and-unrest-a-hungry-town-boils-over-through-restless), [the god's stake](https://linear.app/threadbare/issue/THR-1935/plan-doc-the-gods-stake-in-the-economy-hungry-towns-on-your-ground)) build on [what the player sees of the economy](https://linear.app/threadbare/issue/THR-1870/what-the-player-sees-of-the-economy-prosperity-unrest-tolls-and), whose veto day runs to 22:29Z tonight. So the lane took this one: its own window passed at 10:42Z.
- **Measured** every code claim on main first. Today the mortals who make choices carry no money at all. 70 of the 71 money encounters change nothing. Simple encounters cannot carry a write. Nothing reads a mortal's money when they choose. The plan's key finding is that a resolved encounter already knows its outcome band at one point in the code, for every mortal, so money can land there once.
- **Gates:**
  - The intent judge returned Escalate once. The draft let mortal wealth build alongside the faction purse, but the ticket says to build it after. The ticket's own words settled that, so I followed them rather than asking you.
  - It then returned Revise twice: for the warning line before the roll, a debug route to see it in a browser, and tier numbers copied instead of shared. The fourth pass was **Allow**.
  - The NFP and Vision audits passed with notes, with the notes folded in; the pillar audit passed.
  - Plan-doc lint, generated freshness and impediment ids are green.
- **PR** [#2429](https://github.com/christianspliid-ui/threadbare/pull/2429), auto-merge armed.
- **Filed:**
  - [Mortal wealth, part 2](https://linear.app/threadbare/issue/THR-1952/mortal-wealth-s2-the-money-encounters-pay-their-mortal-and-poor-or): the ~40 paying encounters and the lean toward paying work.
  - [Mortal wealth, part 3](https://linear.app/threadbare/issue/THR-1953/mortal-wealth-s3-money-encounters-change-the-world-prosperity-unrest): encounters that change towns, roads, purses and debts.
  - [Later money rows](https://linear.app/threadbare/issue/THR-1954/money-encounters-later-rows-a-place-held-after-success-writes-bound-to) (Deferral): the rows that need something new first.
- **Coordinated** with [the god's stake](https://linear.app/threadbare/issue/THR-1935/plan-doc-the-gods-stake-in-the-economy-hungry-towns-on-your-ground): it reuses this plan's "better off / worse off" aftermath line for its cards.

## Escalations

None.
