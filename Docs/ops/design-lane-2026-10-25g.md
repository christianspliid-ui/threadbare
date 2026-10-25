---
lane: tb-design-lane
run: 2026-10-25g
promoted: 1
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-25 (run g, ~20:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

All three calls are inside [Plan doc: a faction's commission pays the member who takes it up](https://linear.app/threadbare/issue/THR-2042/plan-doc-a-factions-commission-pays-the-member-who-takes-it-up-the) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-25-thr-2042-faction-commission-pay.md)). Each one can be vetoed on its own.

- **A guild's errand pays the mortal who does it.** When a faction posts a commission, the coin it spends is now held on the posting. The first of its members **who makes choices** to finish any of its work is paid, and their Means rises one step. The aftermath says "— a commission their faction paid for." Unseen members still earn only standing. *Veto:* "any member, seen or unseen, can take a commission".
- **The pay is one Means step for the 5 coin posted.** This is the border levy in reverse. *Veto:* "a commission should pay more than that".
- **An errand nobody takes gives its coin back** to the faction's purse when it expires. Today that coin simply vanishes. *Veto:* "a lapsed commission's coin is spent anyway".

## Work

- **What was open.**
  - The briefing has no *From Christian* section, so there were no vetoes to apply.
  - Ready for Dev held 4 items that are not Deferrals, which is at the floor, so the shelf is not thin.
  - No wayfinder map is open, and no lane claim was waiting to resume.
  - So the lane took agreed-but-undesigned work: the next row of [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954), *a faction's quest or bounty pays its finisher*. It draws on no decision still inside its veto day.
- **What the census found.** I ran headless worlds on main @ 01cd21b6: seeds 42 / 99 / 7, medium map, 30 days each, one seed per process. The script is on the unmerged branch [proto/thr-2042-commission-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2042-commission-census).
  - **Nothing ever takes up a commission or a bounty.** Factions post 41–49 commissions a month, and the coin they spend leaves the world. The faction purse plan's line, that mortals "already draw" these errands, is not true of the code.
  - Mortals who make choices finish faction work 30–92 times a month. 13–42 of those finishes come while their faction has a commission open.
  - Unseen guild members finish about 2,000 jobs a month, but they hold no Means, so the plan keeps them out.
  - None of the 188 faction-work scenes pays Means today, so nothing pays twice.
- **Filed and claimed.** I filed [the plan-doc ticket](https://linear.app/threadbare/issue/THR-2042/plan-doc-a-factions-commission-pays-the-member-who-takes-it-up-the) and claimed it with `design-lane claim 2026-10-25g`. The claim stuck.
- **Gates.**
  - The intent judge ran three times. **Run 1, Revise:** the aftermath did not name the cause, and it did not match the tooltip. Both now use one shared phrase. **Run 2, Block:** the plan stored who took a posting as a property. It is now a `took_up` edge, as the graph rule requires. **Run 3, Allow.**
  - The design audit passed on NFP, three pillars and Vision, each with notes. All notes are folded in.
  - The docs gate passed.
  - [PR #2582](https://github.com/christianspliid-ui/threadbare/pull/2582) merged, and the liveness check reads LIVE.
- **Handoff.**
  - The ticket is in Ready for Dev, unassigned, with its decision record, handoff and coordination block.
  - Its description carries `Claimable from: 2026-10-26T20:53:00Z`, so the builder waits out your veto day.
- **Filed (Deferral):** [The faction sheet names its open commission](https://linear.app/threadbare/issue/THR-2043/the-faction-sheet-names-its-open-commission-the-player-can-see-before). Until it ships, the pay arrives unannounced: the aftermath names the cause, but nothing says beforehand that a commission is open.
- **The leftovers list** now keeps bounty collection with its reason (it needs a hunt and a fight's end). It also keeps place as a holding, lane-bound writes, tribute oaths, salt, tolls and threatened lanes.
- **Impediment logged (#1224).** In a worktree, a `git stash push` that saved nothing let the next `git stash pop` apply the home tree's shared recovery stash. I undid that in the worktree, and the shared stash is intact.

## Escalations

None.
