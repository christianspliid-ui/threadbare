> **title:** Brainstorm — a faction's commission pays the member who takes it up — THR-2042
> **linear_issue:** THR-2042
> **author:** Claude Code (design lane, run 2026-10-25g, unattended)
> **created:** 2026-10-25
> **companion_of:** `Docs/plans/2026-10-25-thr-2042-faction-commission-pay.md`

# Brainstorm — faction commission pay

The considered alternatives behind the plan's four decisions, and the tensions they settle.

## Who takes up a commission

| Option | For | Against | Verdict |
|---|---|---|---|
| **A. Mortals who make choices only** (spotlight deciders finishing the faction's work) | They carry Means; the pay shows on a sheet and in an aftermath; the census leaves postings for them | Unseen members do the bulk of guild work and are never paid for it | **Taken** |
| B. Any member, unseen work included | Every posting is taken within hours; the coin always moves | Unseen members hold no Means (`giveBirthMeans` skips them), so the pay lands on a number nothing reads; on seed 42 they hit an open posting 347 times against 47 postings, so no watched mortal would ever be paid | Rejected |
| C. Only the work named on the posting (a posting picks one template) | Reads like a real errand board | Needs a template pick per posting, a reachability guarantee for that template, and a board surface; Law 42 prefers the generic seam | Rejected for this slice |
| D. Pay unseen members into the faction's purse instead (the tribute rate) | Gives `FACTION_TREASURY_TRIBUTE_RATE` a reader | Coin would flow faction → faction, not faction → mortal, which is what the row asks for | Rejected |

## How much it pays, and from where

- **Escrow at posting (taken).** The coin already leaves the purse at posting today. Holding it on the posting makes the books balance (posted = paid + refunded + open) and lets a lapse give it back. The purse plan's gate and the posting rate are unchanged.
- **Pay from the purse at take-up (rejected).** A purse can be empty by then (p10 is 0 on all three seeds), so the promise would fail at the moment it is due.
- **Size: `MEANS_STEP` for `W_PURSE.step` (taken).** This mirrors the border levy, which moves the same pair the other way. `MEANS_STEP_BIG` for a 10-coin escrow would double the posting's cost and cut the posting rate in poor factions. It is the veto line.
- **The retired `reward: BOUNTY_REWARD` (10).** It is a number no system reads, and higher than the coin the faction put up. Keeping it would leave a second, false answer to "what does this pay" (Law 45).

## Lapse

- **Refund (taken)** keeps the purse's small-on-purpose economy honest. An errand nobody did costs nothing beyond the time.
- **Burn (rejected)** is today's behaviour. It is invisible, and it drains poor factions for nothing.

## Bounties

A bounty names a hostile mortal and puts `hunted` on them, but nothing reads `hunted`. Paying a bounty needs a hunt: who looks, how they find the target, and a fight that ends in death or capture. That is the fight-end path ([fight clock and consequence](2026-09-23-fight-block.md)), not a payout row. Folding it in would make this two slices. It stays on [the leftovers list](https://linear.app/threadbare/issue/THR-1954).

## Tensions noted, not acted on

- The purse plan's § Content line, *"they post quests and bounties mortals already draw"*, is not true of the code. This plan corrects it for commissions only. The bounty half stays false until the leftovers row is built.
- `FACTION_TREASURY_TRIBUTE_RATE` (0.1) stays unread. A member giving a cut of their pay back to the faction is a later choice; the mortal wealth plan rules out dues.
- The census leaks module state across seeds run in one process (seed 7 read 75 factions / 47 postings when run second, 76 / 49 alone). The landed `census:commissions` script must run one seed per process.
