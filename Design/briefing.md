# Briefing
**Generated:** 2026-10-28 07:57 local (06:57 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent silence began when the computer started or woke and the app did not come back by itself. The longest was two days, Wednesday 21 to Friday 23 Oct, with 20 jobs ready. Turning on "open at login" for the Claude app closes these gaps. Only you can change that setting. Say "done" and the next silence check confirms it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (6)

- **Wednesday night to Friday night (21–23 Oct):** "The scheduled lanes went silent for 48.1h (2026-10-21T21:07:01.000Z → 2026-10-23T21:15:17.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Debt Collection is rarely drawn by a mortal who is owed](https://linear.app/threadbare/issue/THR-2044/debt-collection-is-rarely-drawn-by-a-mortal-who-is-owed-93percent-of): **a loan now brings its lender back to collect.** About two days after a mortal lends coin at the counting house, that lender gets a Debt Collection scene, while the debt still stands. Today almost nobody who collects is owed anything (86–100% of collections found no debt), so loans just lapsed and the lender's coin vanished. In a test run, planted collections found their debt, and the share that finds nothing fell to 36–48%. *Veto:* "a lender shouldn't always come back, only sometimes", or "the collection should come at the end of the loan, not halfway". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-28a.md)*
- [Plan doc: famine and glut draws](https://linear.app/threadbare/issue/THR-2040/plan-doc-famine-and-glut-draws-a-hungry-town-tells-hungers-stories-a) — **a hungry town now plants a hunger story instead of nudging the odds.** On a town's second hungry day, one person living there is handed a fitting scene: refugees, barter, the merchant's granaries, the exchange bell. When a town's granaries first overflow, someone gets a plenty scene: the harvest bounty, the market festival, the mill lease. It happens at most once per town every 10 days, and the granary riot still comes first. The first design, a small lean on the scene scores, shipped nothing because its own test failed. Even a much stronger lean barely moved anything this run. Planting moved it from about 1 in 5 hungry spells with a hunger story to 2 in 3. "Fairs grow rarer in a famine" is dropped, because a planted story adds a scene and cannot remove one. *Veto:* "famine should only make hunger stories likelier, not hand one out", or "a starving town should also hold fewer festivals". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-27e.md)*
- [The world's own drift fills the Mandate with no god](https://linear.app/threadbare/issue/THR-2081): **only growth the god causes counts toward the Mandate.** The world keeps founding places and filling with newborn mortals, and every new one adds to every sphere's total, so the Mandate filled with nobody playing. Two of four test worlds ended their age that way. From now on, Mandate progress counts what the god's own hand puts into its spheres: deeds, holds, claims, answered prayers. Rivals and doom wearing those spheres down still pulls it back, so it stays a contest. Veto open until 08:29 UTC today. *Veto:* "the world drifting toward my spheres is my doing" or "a mortal acting on my nudge should count". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-27d.md)*

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — the twelve screens of the fixed journey](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-10-27/contact-sheet.jpg) — first week, so there is nothing to compare yet. The opening holds up. Opening a page brings two visible faults, and the mid-game cannot be reached because the seeded world ends after 41 ticks.

## Queue

**Thin: 2 ready, nothing being built.** Attention's price ([THR-2062](https://linear.app/threadbare/issue/THR-2062/attention-is-never-spent-spendattention-has-no-production-caller-so)) merged via [#2644](https://github.com/christianspliid-ui/threadbare/pull/2644) and is live. Both ready tickets sit in their veto windows, so the builder is idle by design: hunger and plenty stories ([THR-2040](https://linear.app/threadbare/issue/THR-2040/plan-doc-famine-and-glut-draws-a-hungry-town-tells-hungers-stories-a)) until 13:30 UTC, the loan-collection plan ([THR-2044](https://linear.app/threadbare/issue/THR-2044/debt-collection-is-rarely-drawn-by-a-mortal-who-is-owed-93percent-of)) until 14:48 UTC.

- **The paperwork-cut question stays off your list.** [THR-1947](https://linear.app/threadbare/issue/THR-1947) has been parked with no owner since 15 Oct (13 days). Agents can un-park it.
- Warm playtest round 3 cannot start yet. Its gate waits on two round-2 tickets ([THR-1859](https://linear.app/threadbare/issue/THR-1859), [THR-1860](https://linear.app/threadbare/issue/THR-1860)). The playtest lane owns that gate.

## Health

All green. The live site serves the latest commit (a2e88585), CI and the background jobs pass, no PRs are waiting, all 9 scheduled lanes are on time, the worktree reaper last ran 07:40 local, and the engine runs at 161 ms/tick, 7% below the 7-day median.
