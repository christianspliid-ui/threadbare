---
lane: tb-design-lane
run: 2026-10-06a
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-06 (run a, ~00:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Divine economy shared prerequisites](https://linear.app/threadbare/issue/THR-1747) — the first build step of your Dominion ruling, now designed ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1747-divine-economy-shared-prerequisites.md)). **Keeping mortals no longer bankrupts your god.** Today one thread empties your own sphere by day 20. After this, your base income keeps one mortal all the way to Aspect, or two at Champion. A deeper following needs ground you hold, which is your home-turf idea in miniature. **The Wellspring arrives at a fixed moment**, about half a season after the bond (when the rivals wake), instead of by luck. Cards you already hold stop being offered again. **Holding a wellspring costs a little each turn and pays back more.** It shows in your list of holdings in plain words. If you can't pay, it stops growing but is never lost. **Four holding cards nobody could get** (Tap the Source, Claim Resource, Claim Dominion, Place of Power) arrive together once two of your wellsprings flower. *The calls to veto:* **"orphans with the first wellspring"** (all at once, a bigger modal), **"unpaid ground should wither"** or **"Wellspring later"**. The build is held until ~00:45 UTC Wednesday 7 October so a veto lands first.

## Work

- **Claimed** [Divine economy shared prerequisites](https://linear.app/threadbare/issue/THR-1747) (marker `design-lane claim 2026-10-06a`). It is the only unblocked piece of the Dominion ruling, and the Dominion core waits on it. The shelf held 4 ready jobs and no maps were open, so this run wrote a plan doc.
- **Measured before writing** (commands and results are in the plan's *Measured substrate* table). Two measurements changed the ticket:
  - **Place of Power has no income path at all.** Nothing in the code ever makes a place a place of power, so the card's promised income never arrives. It is granted as filed, and the fix is split out.
  - **The "timing comments are wrong" premise was half wrong.** 1,080 ticks *is* three years on the season calendar the player sees (90 ticks a season). Only one phrase changes.
- **Gates:** first plan review: *Revise*. It found three real gaps: an investment beat with no eligibility would never retire; old saves would have lost the source cards; and the ticket's own two pass/fail checks had been dropped. All three fixed. Second review: *Allow*. Design principles: pass with notes. All three parts covered: pass. Game vision: pass with notes.
- **Plan doc PR:** [#2251](https://github.com/christianspliid-ui/threadbare/pull/2251) merged (`56174365`), liveness LIVE. The ticket is in **Ready for Dev**, unassigned, with its handoff and coordination block, and `Claimable from: 2026-10-07T00:45:00Z` in the description so the builder waits out the veto window.
- **Filed:** [Place of Power never makes a place of power](https://linear.app/threadbare/issue/THR-1751) (Deferral, blocked by the prerequisites ticket, three options laid out for whoever designs it next to the Dominion core).

## Escalations

None.
