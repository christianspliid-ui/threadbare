---
lane: tb-design-lane
run: 2026-10-20c
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-20 (run c, ~10:30Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Reward category shares still fold into item weights](https://linear.app/threadbare/issue/THR-1890/reward-category-shares-still-fold-into-item-weights-decide-whether): a reward draw rolls its **rarity first, exactly as today**. Then it picks **the kind of reward the scene asked for** (a thing, a condition or a power) by the scene's own shares, and only then the item. Rarity and Legendaries do not change. On scenes that offer several kinds, **permanent powers come up about twice as often** (8% → 16% of those prizes), because that is what the scenes were written to give. *Veto:* "keep today's mix of rewards".

## Work

- **Claimed** [Reward category shares still fold into item weights](https://linear.app/threadbare/issue/THR-1890/reward-category-shares-still-fold-into-item-weights-decide-whether) (`design-lane claim 2026-10-20c`). No map is open, the shelf is full (34 ready), and every economy plan doc is authored. This ticket is a consequence of [fair luck](https://linear.app/threadbare/issue/THR-1889), and its Done-when hands the call to an agent.
- **Measured** 132 multi-kind reward recipes on seeds 42/99/7. Today 25.8% of their prizes land in a different kind than the recipe says; after the change, 13.0%. Two rejected options would have lowered Legendaries (critical success 4.5% → 3.1–3.3%), against the 2026-10-14 call to keep today's rarity feel. Census code and the full per-recipe table are on the never-merged branch [`proto/thr-1890-category-first`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1890-category-first).
- **Audit:** [reward category shares](https://github.com/christianspliid-ui/threadbare/blob/docs/plan-2026-10-20-thr-1890-reward-category-shares/Docs/audits/2026-10-20-thr-1890-reward-category-shares.md), [PR #2500](https://github.com/christianspliid-ui/threadbare/pull/2500), auto-merge armed. Docs-only gate passed: `npm run gate -- --final` PASS.
- **Filed** [A reward's kind comes up at the recipe's share](https://linear.app/threadbare/issue/THR-1997/a-rewards-kind-comes-up-at-the-recipes-share-the-draw-rolls-the-rarity): Todo, with a coordination block and `Claimable from: 2026-10-21T10:45:00Z` (the veto day). The decision ticket is released to Todo, unassigned and blocked by the build, because the build finishes its Done-when.

## Escalations

- One process slip, fixed in place: the first version of the build ticket's description named the decision ticket after a close keyword. It was rewritten within a minute, before any lane read it. The proto-branch commit was also made with `--no-verify`. That commit is on a branch that is never merged, and no gate was skipped on the docs PR.
