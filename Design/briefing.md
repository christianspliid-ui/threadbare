# Briefing
**Generated:** 2026-10-25 10:59 local (09:59 UTC) · keep-work-flowing-cc

## The one thing

**Log the playtest testers back in.** Round 5 of the new-player playtest is due: every round-4 fix is live on [threadbearer.co](https://threadbearer.co/). But the testers could not start this morning, because their Claude login has expired. Open a terminal, run `claude`, then type `/login`. That takes a minute. The next daily run then plays round 5 by itself. *— from [cold playtest round 5](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-5.md)*

## Also waiting (8)

- **Set the Claude app to open when Windows starts.** The longest gap so far was two days, Wednesday 21 to Friday 23 Oct, with 20 jobs ready. Say "done" and the next silence check confirms it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*
- **Wednesday night to Friday night (21–23 Oct):** "The scheduled lanes went silent for 48.1h (2026-10-21T21:07:01.000Z → 2026-10-23T21:15:17.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed or the computer off, or was this a pause?
- **The two process cuts you approved on 15 Oct are stuck (day 3).** The unattended builder may not edit the gate and CI files that [THR-1947](https://linear.app/threadbare/issue/THR-1947) and [THR-1949](https://linear.app/threadbare/issue/THR-1949) change. Recommended: one attended session, say "build THR-1947, then THR-1949". *— from [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-10-25.md) and [weekly hygiene](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-hygiene-2026-10-25.md)*
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours with no pause recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Founding gates read a meeting-record field nobody writes](https://linear.app/threadbare/issue/THR-2009/founding-gates-read-a-meeting-record-field-nobody-writes-the-reach): at the end of the run, what the First becomes depends on **who they were born as**, not on the Reach the god strengthened. Their mark does not decide it. A Shadow-born First can never end in Sacrifice. Only a Star-, Veil- or Eye-born First can Transcend. Today Transcendence never happens in any run, because the check reads an empty field. *Veto:* "the ending should follow what the god made of them — the mark". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25b.md)*
- [A seeded relic has no place in the graph](https://linear.app/threadbare/issue/THR-2030/a-seeded-relic-has-no-place-in-the-graph-its-site-is-only-a-property): a relic left by an earlier god now **lies at its place** through its own link, the way an unclaimed thing lies on the ground. It is not "at" the place the way a person is. Its page says where it lies, the place's page lists it, and it still reads Foreign until someone takes it up. *Veto:* "an artifact should simply be at a place like a person". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25a.md)*
- [Debts in the money encounters](https://linear.app/threadbare/issue/THR-2023): four calls inside [the debts plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-24-thr-2023-encounter-debts.md). Each can be vetoed on its own; the veto window closes around 20:55 tonight. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-24c.md)*
  - **A collected debt is the oldest one owed to the collector.** A won collection pays it, a lost one writes it off. *Veto:* "the collector should pick the biggest or the newest debt".
  - **The cathedral's treasury is the dean's own purse**, not a temple faction's. *Veto:* "the temple faction's treasury should pay".
  - **In The Loan, your mortal is the lender**, and is out of pocket until they collect. *Veto:* "the mortal should only broker the loan".
  - **A note from a house that has stopped paying is worthless** on a bad failure. *Veto:* "the bad note should still count as a debt".

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 8 ready, 1 being built.** Since the last brief, [encounters that broker an oath](https://linear.app/threadbare/issue/THR-1944/encounters-that-broker-an-oath-faction-unification-and-the-warlords) merged ([#2570](https://github.com/christianspliid-ui/threadbare/pull/2570)) and is live. A pickup run is now building [the world tilt that never reaches a place](https://linear.app/threadbare/issue/THR-2028/the-world-tilt-never-reaches-a-place-the-accounts-fundament-leaves).

- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947) is still parked and unassigned, 10 days after it was first claimed. No branch or local worktree holds work for it. It waits on your answer above, not on the builder.
- [The settlement-economy glossary terms](https://linear.app/threadbare/issue/THR-1924) have sat on the shelf 8 days. Agent-owned.
- Warm playtest round 3 cannot start: its gate waits on two round-2 tickets ([THR-1859](https://linear.app/threadbare/issue/THR-1859), [THR-1860](https://linear.app/threadbare/issue/THR-1860)) that themselves wait on round 3. The playtest lane owns that gate.

## Health

- **Heavy tests red on main since 09:21 local** (the first full run after the last fix): one check fails. An appointment test never sees a mortal far from the meeting place ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/40176299598)). Ticket [THR-2037](https://linear.app/threadbare/issue/THR-2037) filed for the builder. A run on the newest commit is in progress.
- **Engine speed is past the alarm line and still rising:** tick cost 195 ms/tick steady, 36% above the 7-day median (143, 80 rows since ea49ecbb); top phase agent_decision, 610 agents. Name the merges between ea49ecbb and f87d7afa: `git log --oneline --merges ea49ecbb..f87d7afa`. Last brief it was 191 (34%). The settlement economy ([THR-1923](https://linear.app/threadbare/issue/THR-1923)) is still the likeliest cause. This is the builder's to chase, not yours.

Everything else is green: main's CI, the three scheduled background jobs, all 13 scheduled lanes, no PRs waiting, and the builder (shipping, not stalled). The live site serves the latest commit ([f87d7afa](https://github.com/christianspliid-ui/threadbare/commit/f87d7afa)).
