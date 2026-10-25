# Briefing
**Generated:** 2026-10-25 20:56 local (19:56 UTC) · keep-work-flowing-cc

## The one thing

**Log the playtest testers back in.** Round 5 of the new-player playtest is due: every round-4 fix is live on [threadbearer.co](https://threadbearer.co/). But the testers could not start this morning, because their Claude login has expired. Open a terminal, run `claude`, then type `/login`. That takes a minute. The next daily run (about 10:48 tomorrow) then plays round 5 by itself. *— from [cold playtest round 5](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-5.md)*

## Also waiting (7)

- **Set the Claude app to open when Windows starts.** The longest gap so far was two days, Wednesday 21 to Friday 23 Oct, with 20 jobs ready. Say "done" and the next silence check confirms it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*
- **Wednesday night to Friday night (21–23 Oct):** "The scheduled lanes went silent for 48.1h (2026-10-21T21:07:01.000Z → 2026-10-23T21:15:17.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours with no pause recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Famine and glut draws](https://linear.app/threadbare/issue/THR-2040/plan-doc-famine-and-glut-draws-a-hungry-town-tells-hungers-stories-a): three calls inside [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-25-thr-2040-famine-and-glut-draws.md). Each can be vetoed on its own. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25f.md)*
  - **A starving town tells hunger's stories.** In a hungry town, refugees, hard bartering, the merchant's granaries, the exchange bell and mending nets for work become likelier. Fairs and festivals there become rarer. "Hungry" is the town's existing hunger, the same one its Fortunes sentence and its unrest read. *Veto:* "famine should mean a staple at the scarce tier".
  - **Glut means grain with nowhere to go.** Only a town with a large spare harvest for three days running (food at least 1.75 times its need) leans toward the harvest bounty, the mill lease and the tithe-barn raid. A town with a little spare food is the normal state of a settled town, so it does not count. *Veto:* "any town with spare food is in glut".
  - **The granary riot keeps one cause.** Hunger and unrest already start it. Famine does not also make it likelier on the everyday board. *Veto:* "famine should also make the riot likelier".
- [A sequel seeded by templateId fires wherever the mortal stands](https://linear.app/threadbare/issue/THR-1929/a-sequel-seeded-by-templateid-fires-wherever-the-mortal-stands-no): a follow-up scene that belongs somewhere (a rematch in a tavern, a mill lease in a town) **waits for its place**. It plays the first time the mortal stands somewhere it fits. If that does not happen within 4 days, it withers with the existing "a planted thread withered" line. It never plays on the wrong ground. Today 29% of these scenes play in the wrong place. *Veto:* "a sequel should find the mortal wherever they are". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25e.md)*
- [Founding gates read a meeting-record field nobody writes](https://linear.app/threadbare/issue/THR-2009/founding-gates-read-a-meeting-record-field-nobody-writes-the-reach): at the end of the run, what the First becomes depends on **who they were born as**, not on the Reach the god strengthened. Their mark does not decide it. A Shadow-born First can never end in Sacrifice. Only a Star-, Veil- or Eye-born First can Transcend. Today Transcendence never happens in any run, because the check reads an empty field. *Veto:* "the ending should follow what the god made of them — the mark". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25b.md)*
- [A seeded relic has no place in the graph](https://linear.app/threadbare/issue/THR-2030/a-seeded-relic-has-no-place-in-the-graph-its-site-is-only-a-property): a relic left by an earlier god now **lies at its place** through its own link, the way an unclaimed thing lies on the ground. It is not "at" the place the way a person is. Its page says where it lies, the place's page lists it, and it still reads Foreign until someone takes it up. *Veto:* "an artifact should simply be at a place like a person". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25a.md)*
- [No non-human cast primitive](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor): closed under its 20 Oct decision. A beast you can fight is a lair's monster; any other animal stays scenery. *Veto:* "animals should live in the world". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25d.md)*

Say "veto <title>" to reverse any of these. (The four debt calls in [THR-2023](https://linear.app/threadbare/issue/THR-2023) have passed their veto window, which closed at 20:45, and drop off this list.)

## Queue

**Healthy: 5 ready, and the builder is working.** The pickup run that started at 20:32 claimed [THR-2041](https://linear.app/threadbare/issue/THR-2041/measure-and-census-scripts-one-call-fits-the-600-s-command-cap-per) (long measurement scripts should fit the 10-minute command limit), which the orchestrator moved onto the build shelf at about 20:30. [THR-2023](https://linear.app/threadbare/issue/THR-2023) (debts) left its veto window at 20:45 and is now free to claim. The other four wait on their windows: [THR-2030](https://linear.app/threadbare/issue/THR-2030) and [THR-2009](https://linear.app/threadbare/issue/THR-2009) overnight, [THR-1929](https://linear.app/threadbare/issue/THR-1929) tomorrow 15:29, and [THR-2040](https://linear.app/threadbare/issue/THR-2040) (famine and glut draws) tomorrow 19:05.

- **The paperwork-cut question stays off your list.** [THR-1947](https://linear.app/threadbare/issue/THR-1947) has been parked and unassigned since 15 Oct (10 days). The [weekly review](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-review-2026-10-25.md) agrees it needs no attended sitting: agents can un-park it and let the builder do the remaining half.
- Warm playtest round 3 cannot start: its gate waits on two round-2 tickets ([THR-1859](https://linear.app/threadbare/issue/THR-1859), [THR-1860](https://linear.app/threadbare/issue/THR-1860)). The playtest lane owns that gate.

## Health

- **Engine speed is over the alarm line again, and higher than last hour:** "tick cost 188 ms/tick steady, 31% above the 7-day median (144, 84 rows since de68cb60); top phase agent_decision, 610 agents. Name the merges between de68cb60 and 01cd21b6: git log --oneline --merges de68cb60..01cd21b6". Last hour read 180. The climb across the week is the builder's to chase, not yours.

Everything else is green. The live site serves the newest commit ([01cd21b6](https://github.com/christianspliid-ui/threadbare/commit/01cd21b6)). Main's CI, the three scheduled background jobs, all 9 enabled scheduled lanes and the worktree reaper (last run 20:40) are healthy, and no PRs are waiting.
