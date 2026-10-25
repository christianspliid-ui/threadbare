# Briefing
**Generated:** 2026-10-25 14:56 local (13:56 UTC) · keep-work-flowing-cc

## The one thing

**Log the playtest testers back in.** Round 5 of the new-player playtest is due: every round-4 fix is live on [threadbearer.co](https://threadbearer.co/). But the testers could not start this morning, because their Claude login has expired. Open a terminal, run `claude`, then type `/login`. That takes a minute. The next daily run then plays round 5 by itself. *— from [cold playtest round 5](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-5.md)*

## Also waiting (8)

- **Approve the new weekly review lane.** The builder wrote it ([THR-1950](https://linear.app/threadbare/issue/THR-1950)): one Friday pass that replaces five separate review lanes. But creating a scheduled lane needs your click. Open one session, say "finish THR-1950", and approve the prompts. The five old lanes keep running until then.
- **Set the Claude app to open when Windows starts.** The longest gap so far was two days, Wednesday 21 to Friday 23 Oct, with 20 jobs ready. Say "done" and the next silence check confirms it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*
- **Wednesday night to Friday night (21–23 Oct):** "The scheduled lanes went silent for 48.1h (2026-10-21T21:07:01.000Z → 2026-10-23T21:15:17.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours with no pause recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Founding gates read a meeting-record field nobody writes](https://linear.app/threadbare/issue/THR-2009/founding-gates-read-a-meeting-record-field-nobody-writes-the-reach): at the end of the run, what the First becomes depends on **who they were born as**, not on the Reach the god strengthened. Their mark does not decide it. A Shadow-born First can never end in Sacrifice. Only a Star-, Veil- or Eye-born First can Transcend. Today Transcendence never happens in any run, because the check reads an empty field. *Veto:* "the ending should follow what the god made of them — the mark". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25b.md)*
- [A seeded relic has no place in the graph](https://linear.app/threadbare/issue/THR-2030/a-seeded-relic-has-no-place-in-the-graph-its-site-is-only-a-property): a relic left by an earlier god now **lies at its place** through its own link, the way an unclaimed thing lies on the ground. It is not "at" the place the way a person is. Its page says where it lies, the place's page lists it, and it still reads Foreign until someone takes it up. *Veto:* "an artifact should simply be at a place like a person". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25a.md)*
- [No non-human cast primitive](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor): closed under its 20 Oct decision. A beast you can fight is a lair's monster; any other animal stays scenery. *Veto:* "animals should live in the world". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25d.md)*
- [Debts in the money encounters](https://linear.app/threadbare/issue/THR-2023): four calls inside [the debts plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-24-thr-2023-encounter-debts.md). Each can be vetoed on its own; the veto window closes around 20:55 tonight. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-24c.md)*
  - **A collected debt is the oldest one owed to the collector.** A won collection pays it, a lost one writes it off. *Veto:* "the collector should pick the biggest or the newest debt".
  - **The cathedral's treasury is the dean's own purse**, not a temple faction's. *Veto:* "the temple faction's treasury should pay".
  - **In The Loan, your mortal is the lender**, and is out of pocket until they collect. *Veto:* "the mortal should only broker the loan".
  - **A note from a house that has stopped paying is worthless** on a bad failure. *Veto:* "the bad note should still count as a debt".

Say "veto <title>" to reverse any of these.

## Queue

**3 ready, but none can be picked up before about 20:45 tonight.** All three ([THR-2023](https://linear.app/threadbare/issue/THR-2023), [THR-2009](https://linear.app/threadbare/issue/THR-2009), [THR-2030](https://linear.app/threadbare/issue/THR-2030)) are inside their veto windows (see *Decided for you*), so the builder is idle by design: every pickup run since 12:43 UTC stood down for that reason. Nothing new merged since the last brief.

- **The paperwork-cut question stays off your list.** The weekly hygiene and grooming reports still ask for an attended sitting for [THR-1947](https://linear.app/threadbare/issue/THR-1947) and THR-1949. But the builder shipped THR-1949, gate files included, so that wall is gone. THR-1947 (parked and unassigned since 15 Oct) can go the same way.
- [THR-1950](https://linear.app/threadbare/issue/THR-1950) is parked in progress, unassigned: its code is merged and it waits only on your approval above. No uncommitted work is sitting in any local worktree for it or for THR-1947.
- Warm playtest round 3 cannot start: its gate waits on two round-2 tickets ([THR-1859](https://linear.app/threadbare/issue/THR-1859), [THR-1860](https://linear.app/threadbare/issue/THR-1860)) that themselves wait on round 3. The playtest lane owns that gate.

## Health

- **Engine speed is still past the alarm line:** tick cost 187 ms/tick steady, 30% above the 7-day median (143, 80 rows since 2db65f97); top phase agent_decision, 610 agents. Name the merges between 2db65f97 and e67e0517: `git log --oneline --merges 2db65f97..e67e0517`. Last brief it was 185 (29%); no code merged in between, so this is noise around a steady level. The settlement economy ([THR-1923](https://linear.app/threadbare/issue/THR-1923)) is still the likeliest cause. This is the builder's to chase, not yours.

Everything else is green: the live site serves the newest commit ([e67e0517](https://github.com/christianspliid-ui/threadbare/commit/e67e0517)), main's CI, the three scheduled background jobs, all 13 scheduled lanes, no PRs stuck, the worktree reaper, and the builder (idle by design, not stalled).
