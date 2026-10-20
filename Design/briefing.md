# Briefing
**Generated:** 2026-10-20 06:57 local (04:57 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** No lane ran from 20:26 Sunday until about 19:42 Monday. That is all of Monday, with 25 jobs ready for the builder. Every recent silence has the same shape: the computer starts or wakes, and the app does not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (5)

- **Sunday evening to Monday evening (18–19 Oct):** "The scheduled lanes went silent for 23.3h (2026-10-18T18:26:51.000Z → 2026-10-19T17:42:15.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided)) *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-18d.md)*
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

From [the design lane tonight, run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-20b.md):

- [Warm brief v2 — the next mid-game playtest round](https://linear.app/threadbare/issue/THR-1861/warm-brief-v2-trigger-fired-round-2-had-3-coverage-failures-on-v1-03) tells returning testers they are curious **"which factions have risen while you were away"**, as agreed after round 2 if it failed again (0 of 3 reached the mid-game). The pass bar stays at 2 of 3. *Veto:* "keep the old brief".
- Same ticket: the round's "did they reach the mid-game" check now looks for the new Inspector's pages, since the faction sheet and Journey tab it looked for were deleted on 18 October. Harness repair ([PR #2493](https://github.com/christianspliid-ui/threadbare/pull/2493)).

From [the design lane tonight, run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-20a.md):

- [Ordinary scenes still hand The First a trade she never had](https://linear.app/threadbare/issue/THR-1983/ordinary-scenes-still-hand-the-first-a-trade-she-never-had-guild) — of 28 everyday scenes that assume her trade, **six now wait for a mortal of the right trade**; **twenty-one stay open to anyone** and stop saying she already works it (a healer may still try the smiths' iron test, as a healer). *Veto:* "a mortal should only be offered work in her own trade".

From [the hiring-a-free-company plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-19-thr-1974-hiring-a-free-company.md) ([THR-1974](https://linear.app/threadbare/issue/THR-1974/plan-doc-hiring-a-free-company-a-realm-buys-a-companys-oath-then-pays)), decided by [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-19a.md):

- **A hired company fights its paymaster's wars, not its own.** *Veto:* "a hired company should still fight its own enemies too".
- **A lord keeps two days of its own soldiers' pay before it pays anyone else's.** *Veto:* "a lord should spend its last coin on its sworn swords".
- **A company is priced on the soldiers it keeps.** *Veto:* "price companies on what they earn, like everyone else".
- **A company that swears for protection, with no army left, gets no help to raise one.** *Veto:* "a lord should pay to raise its vassal's army at once".
- **Two hired companies still make a realm a Crown.** *Veto:* "hired companies should not count toward a Crown".
- **The player reads "pays its soldiers", never a sum, and never *mercenary*, *contract* or *hire*.** *Veto:* "call them mercenaries on screen".

Say 'veto <title>' to reverse any of these.

## Queue

**Backed up: 30 ready, 1 in progress.** [Find anything with Ctrl+K](https://linear.app/threadbare/issue/THR-1915/find-anything-ctrlk-finds-what-the-god-has-seen-and-opens-it-in-the) shipped ([PR #2495](https://github.com/christianspliid-ui/threadbare/pull/2495)) and is live. The builder is now on [a town on the edge turns to a better lord](https://linear.app/threadbare/issue/THR-1957/hunger-and-unrest-s2-a-town-on-the-edge-turns-to-a-better-lord-and-a) (High, claimed 03:30 UTC; a builder run is active right now).

- Next up: [words that wait for their moment](https://linear.app/threadbare/issue/THR-1986/words-that-wait-for-their-moment-first-use-captions-attention-at-the) and [cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) (both High).
- No ticket has sat in the queue for more than a week without being touched.

## Health

- All green. The live site is current (53ec5332). Main's checks, including heavy simulation tests, are green, and all 13 scheduled lanes are on time. No pull requests are waiting to merge.
- The engine runs at 117 ms a tick, 14% faster than its week's median.
- The tidy-up job reports 565 old worktrees, with 5 items waiting for a decision. Builder housekeeping. You sent no new Discord messages.
