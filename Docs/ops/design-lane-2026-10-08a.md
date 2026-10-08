---
lane: tb-design-lane
run: 2026-10-08a
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Design lane — 2026-10-08 (run a, ~05:15Z)

## Needs Christian

- **How does your god get new powers?** You asked whether powers could be *bought*. The prototype narrowed it to two options. Both give each god its own powers, and today's gifts do not.
  - **A: the world gives, by who you are.** Gifts keep their timing and stay free. What each gift *is* now matches your god's reaches and spheres. The rulebook's "story moments, not from a menu" stays.
  - **B: the world offers, you choose and pay.** Every few days *three omens rise*. You take up one with what you have drawn through its sphere, or let them pass. The rulebook line becomes "from what the world offers". About twice as many powers over a run.
  - My lean is **B**, because it is the version of buying that keeps gods distinct. Reply **"A"** or **"B"**.
  - Links: [the ticket, with every number](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the) · [what B looks like](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-buy-mock/market-mock.html).
  - [How gods grow across runs](https://linear.app/threadbare/issue/THR-1773/how-a-players-gods-grow-across-runs-what-a-second-fifth-and-twentieth) waits on this answer.

## Decided for you

- [A buy system for god actions](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the): these calls were settled by the evidence, whichever of A or B you pick.
  - **Your god never pays for a power out of the essence it casts with.** Any price is paid in essence you have *drawn through* that power's sphere. A god that sits on full pools earns nothing to buy with, so casting is what pays for it. Paying from the casting pool would let you buy 22–24 powers on the first turn.
  - **No open shop.** If you could buy any power, a player who plays to win would buy the same five powers in the same order for every god.
  - **Today's gifts are already samey.** Two very different gods share almost four of their first five powers. That changes under either A or B.
  - **24 powers stay gifts no matter what:** the opening, your first signature, the Wellspring, and the powers the world hands you for what happened in it.
  - *The calls to veto:* **"pay from the casting pool"**, **"an open shop"** or **"keep today's gifts as they are"**.

## Work

- **Unit chosen:** a map decision. The shelf holds 6 jobs that are not deferrals, so it is not thin. The [Dominion map](https://linear.app/threadbare/issue/THR-1758/wayfinder-map-dominion-how-the-gods-power-grows-across-a-run) had one workable frontier ticket, THR-1770, whose two blockers ([card inventory](https://linear.app/threadbare/issue/THR-1769/every-god-card-how-it-is-granted-today-and-when-it-arrives-for-a) and [model port](https://linear.app/threadbare/issue/THR-1767/port-the-full-window-power-model-into-scripts-so-every-verdict-on-this)) are Done. The other open children wait on [the formula](https://linear.app/threadbare/issue/THR-1760/the-formula-settled-normalisation-the-gods-power-factor-and-the-five), which waits on the [sphere-score fix](https://linear.app/threadbare/issue/THR-1768/sphere-scores-never-land-where-dominion-must-read-them-the-god-has-no) in Ready for Dev.
- **Claimed** THR-1770 with the marker `design-lane claim 2026-10-08a`, verified as assigned.
- **Prototype:**
  - Six ways of getting powers, modelled for two sample gods over a 90-day run on the retuned economy: today's gifts, gifts drawn by identity, a shop paid from the casting pool, a shop paid from essence earned, two "pick one" hybrids, and a three-card market.
  - Two kinds of scripted player (one shops for fit, one optimises), with 400 seeds where a lottery is involved.
  - Model on the never-merged branch [proto/thr-1770-card-buy](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1770-card-buy/scripts/proto-card-buy-model.mjs).
- **Audit and mock:** [audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-god-card-buy-system-prototype.md) and [market mock](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-buy-mock/market-mock.html) in [PR #2266](https://github.com/christianspliid-ui/threadbare/pull/2266), docs-only, auto-merge armed. Docs gates: generated-freshness OK, impediment-ids OK, and plan-doc lint was skipped because the PR holds no plan doc.
- **Recorded:**
  - The decision record is on the ticket.
  - The gist is added to the map's *Decisions so far*.
  - THR-1770 is listed under the map's *Reserved for Christian*.
  - The ticket is unassigned and left in Todo, not closed, because the fork is open.
- **Mock caveat:** the static mock does not yet meet three UI laws: tooltips (Laws 1 and 17) and clickable power names (Law 21). Any build of B must add them.

## Escalations

None.
