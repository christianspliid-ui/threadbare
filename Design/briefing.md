# Briefing
**Generated:** 2026-10-21 22:58 local (20:58 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** No lane ran from 20:26 Sunday until about 19:42 Monday. That is all of Monday, with 25 jobs ready for the builder. Every recent silence has the same shape: the computer starts or wakes, and the app does not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (6)

- **The two process cuts you approved on 15 Oct are stuck.** The builder is not allowed to edit the gate and CI files that [THR-1947](https://linear.app/threadbare/issue/THR-1947) (one status line per PR) changes, and [THR-1949](https://linear.app/threadbare/issue/THR-1949) changes the same files. Either run them in one session with you present, or allow the builder to edit those files. Recommended: one session with you present. *— from [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-10-21.md)*
- **Sunday evening to Monday evening (18–19 Oct):** "The scheduled lanes went silent for 23.3h (2026-10-18T18:26:51.000Z → 2026-10-19T17:42:15.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Founding costs starve founding on their own](https://linear.app/threadbare/issue/THR-2006/founding-costs-starve-founding-on-their-own-with-costs-on-seeds-427): when founding costs one day switch on, a mortal who cannot afford to found a town or a guild **has it paid by their faction**, which becomes the founding's backer. A mortal who can pay still pays. Measured, this brings foundings back from 3 to 14 across three test worlds, the same as with no costs. Founding costs stay **off** for now, so nothing changes in play today. *Veto:* "a founding should be the mortal's own; no patrons". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-21a.md)*
- [The mislabel audit — 110 encounters whose words test a different Reach than their label](https://linear.app/threadbare/issue/THR-1940/mislabel-audit-110-encounters-whose-prose-tests-a-different-reach-than) — every one of the 110 was read. **32 encounters change Reach**: Temple of Spheres rites become Veil (the Temple had no Veil quest), smithing, net-mending and drinking contests become Stone, and the Easter calendar pair becomes Eye. **6 keep their Reach but move a step**: for example, the three faction-governance scenes keep the Reach of the god card that seeds them, but their loyalty moment now rolls Heart. **35 keep their Reach and get a prose fix**, and **37 stay as they are**. A faction's quests only move within its own top three Reaches. The test encounters with made-up Reaches become Stone, Star and Iron. Before it runs again, the encounter judge will see each encounter's stakes and will judge the test, not the noticing on the way to it. Its "Eye" answers were right 5 times out of 67. *Veto:* "a faction's Reaches are flavour" (three prose fixes become relabels), or "a god card's scene should test what it tests" (the three governance scenes move to Heart outright). *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-21b.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Backed up: 20 ready, 2 in progress.**

- [Four things the retired sheets showed are Inspector rows again](https://linear.app/threadbare/issue/THR-1992/four-things-the-retired-sheets-showed-that-no-inspector-page-shows-the) — the Blood line, the pilgrim way, the lair's monster card and the fate word. Merged as [PR #2525](https://github.com/christianspliid-ui/threadbare/pull/2525) and live.
- The builder has finished [ordinary scenes stop recasting The First](https://linear.app/threadbare/issue/THR-1993/ordinary-scenes-stop-recasting-the-first-six-scenes-wait-for-a-mortal) (six scenes now wait for a mortal of the right trade; 21 lines stop calling her a trade she never had). [PR #2526](https://github.com/christianspliid-ui/threadbare/pull/2526) merges itself when its checks pass.
- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) is parked and unassigned, 6 days since it was first claimed. It waits on your answer above, not on the builder. No pushed branch and no local worktree for it (checked this run).
- No ticket has sat in the queue for more than a week without being touched.

## Health

All green: main's checks and the three background jobs are healthy, one pull request is waiting on its checks, all 13 scheduled lanes are on time, the live site is current, and the engine runs at 147 ms/tick (+4% vs the 7-day median).
