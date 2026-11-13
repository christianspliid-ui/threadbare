# Briefing
**Generated:** 2026-11-13 09:58 local (08:58 UTC) · keep-work-flowing-cc

## The one thing

**From Sunday 8 to Thursday 12 Nov, the lanes were silent for about 103 hours. Was the computer off, was the app closed, or was that a pause?** Every lane and the worktree reaper came back in the same minute on Thursday evening, so it looks like the computer or the app was off. If so, just say so. If it wasn't, it becomes a fault to chase. Detail: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (9)

- **Set the Claude app to open when Windows starts.** That would have closed most of these silent gaps without anyone noticing ([the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)).
- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** silent for 40 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Wednesday 21 to Friday 23 Oct:** silent for 48 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Sunday 18 to Monday 19 Oct:** silent for 23 hours, with no pause recorded. App closed, or a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Make the purse bite — a full hand should cost more than the god can afford](https://linear.app/threadbare/issue/THR-2201) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-13-thr-2201-make-the-purse-bite.md)). **Essence becomes scarce mainly because the god earns less, not only because cards cost more.**
  - **What was tested:** I measured three worlds. The god could afford every card in the hand at every attended step, in all three. Even with prices tripled and a smaller pool, it still could. Attended steps come only every 40 to 48 ticks, and in that time the god's own pools earn about ten times what a hand costs.
  - **What changes:** cards cost about three times more, each pool holds 35 instead of 50, and the god's base and home-seat income halve. Two hidden rules also change. The cheaper price on your own spheres now goes only to spheres you actually chose. A card with no sphere is now paid from your own spheres, not from all twelve pools added together.
  - **Result in the test runs:** the full hand was affordable at 5 of 13 steps in one world and 2 of 19 in another.
  - **Safeguards:** the builder stops tuning at the first setting where a full hand is affordable less than half the time. At least one card must stay playable at nine steps in ten, a god who plays nothing must keep its threads, and Meet The First must not change.
  - **Veto:** held for your veto until 20:46 UTC today. Say "veto purse bite" to keep the god's income as it is and only raise prices. The measurements say that alone will not make anyone choose.

Say "veto <title>" to reverse any of these. (The thread-row veto window closed at 08:19 UTC with no veto; the builder has started on it.)

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-12/contact-sheet.jpg) — better: The First's name fits, the essence and Doom readouts speak in words, and returning to the mid-game now opens on a "While you were away" summary, but arrival toasts still pile up and his thread row cuts his story short.

## Queue

**Starved but moving: 1 ticket ready, 1 being built.**

- Being built: [THR-2193](https://linear.app/threadbare/issue/THR-2193) thread row wraps. The builder claimed it after the veto window closed at 08:19 UTC; its run is active.
- Ready: [THR-2201 Make the purse bite](https://linear.app/threadbare/issue/THR-2201/make-the-purse-bite-a-full-hand-should-cost-more-than-the-god-can), planned by the design lane this morning and held for your veto until 20:46 UTC.
- Waiting to merge: [PR #2806](https://github.com/christianspliid-ui/threadbare/pull/2806), the plan for "give both clocks a verb", waiting on its checks.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (24 days; In Dev since 15 Oct). No pushed branch and no local worktree names it. It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- **Engine speed reading high, for the builder to check:** tick cost 176 ms/tick steady, 25% above the 7-day median (140, 58 rows since dd214308); top phase agent_decision, 638 agents. Name the merges between dd214308 and 1e32e9f6: git log --oneline --merges dd214308..1e32e9f6. The only merge since the 135 ms reading an hour ago was a plan doc, so the likely cause is the builder running on the same computer during the measurement; next hour's reading will tell.
- Everything else green: the live site is current (only docs changed since the last publish), checks on main and the 3 scheduled background jobs pass, 1 PR is waiting on checks and will merge on green, and the builder is working.
