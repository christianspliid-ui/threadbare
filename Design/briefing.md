# Briefing
**Generated:** 2026-11-15 02:58 local (01:58 UTC) · keep-work-flowing-cc

## The one thing

**Sunday 8 to Thursday 12 Nov: was the computer off or the app closed, or was this a pause?** The silence check says: "The scheduled lanes went silent for 103.3h (2026-11-08T12:37:04.000Z → 2026-11-12T19:52:37.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Every lane and the worktree reaper came back in the same minute, so it looks like the computer or app was off. **If so:** just say so. **If it wasn't:** say so, and it becomes a fault to chase. ([detail](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md))

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

- [The Mandate bar says the mortal's deeds fill it, but they never do](https://linear.app/threadbare/issue/THR-2199/the-mandate-bar-says-the-mortals-deeds-fill-it-but-they-never-do-after): **the Mandate now says what moves it.** The line will read "Rises when you spend Mind or Spirit essence on Kael's chapters, or on places", and "Rising" lasts three days instead of one. The rule itself stays: only chapters you put essence into count. Built in [The Mandate says what moves it](https://linear.app/threadbare/issue/THR-2236/the-mandate-says-what-moves-it-the-fill-line-names-the-spend-rising). **Veto:** say "the mortal alone should fill it". Held until 11:30 UTC. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-14f.md)*
- [Read the Threads returns only a tally](https://linear.app/threadbare/issue/THR-2225/read-the-threads-costs-a-dozen-essence-and-a-short-look-back-returns): **paying more for Read the Threads now always shows more, never less.** Each chapter fades by its own age, so a 3-day read shows the last half day in full; each faded group opens with one story line; each window says what it buys before you pay. Built in [A longer look back is always more](https://linear.app/threadbare/issue/THR-2235/a-longer-look-back-is-always-more-not-less-read-the-threads-fades-each). **Veto:** say "keep deep reads blurry". Held until 08:35 UTC. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-14e.md)*
- [Check that the First's whole journey fits one run](https://linear.app/threadbare/issue/THR-2232/check-that-the-firsts-whole-journey-fits-one-run-measure-when-each): **a run already tells the whole journey, and Doom never cuts it short. The Apotheosis moves to after the Ordeal** ([THR-2234](https://linear.app/threadbare/issue/THR-2234/the-firsts-apotheosis-comes-after-the-ordeal-once-between-the-ordeal)), **and no trial vision goes missing** ([THR-2233](https://linear.app/threadbare/issue/THR-2233/no-journey-vision-is-lost-a-road-of-trials-beat-whose-moment-passed)). **Veto:** say "the Apotheosis is a mid-run power spike". Held until 05:45 UTC. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-14d.md)*
- [The mid-game words still mean nothing](https://linear.app/threadbare/issue/THR-2224/recurs-after-fix-seven-times-the-mid-game-words-still-mean-nothing): **half of this came from the test, not the game.** Warm playtests will start in a real world without the showcase kit ([THR-2230](https://linear.app/threadbare/issue/THR-2230/warm-playtests-arrive-in-a-real-world-the-warm-start-stops-loading-the)), and the Stage gets one mark, one meaning ([THR-2231](https://linear.app/threadbare/issue/THR-2231/one-mark-one-meaning-on-the-stage-the-steps-standing-reads-as-a-word)). **Veto:** say "keep the test kit". Held until 02:40 UTC. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-14c.md)*

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-12/contact-sheet.jpg) — better: The First's name fits, the essence and Doom readouts speak in words, and returning to the mid-game now opens on a "While you were away" summary, but arrival toasts still pile up and his thread row cuts his story short.

## Queue

**Healthy: 7 tickets in Ready for Dev, and the builder is working.** [The Ordeal is rolled](https://linear.app/threadbare/issue/THR-2226/the-ordeal-is-rolled-and-journey-visions-read-the-scene-the-god-leans) is open as [PR #2835](https://github.com/christianspliid-ui/threadbare/pull/2835): every check is green, and it is not yet armed to merge. A pickup run has been working since 01:31 UTC. Next up: [The Apotheosis deals the run's largest hand](https://linear.app/threadbare/issue/THR-2227/the-apotheosis-deals-the-runs-largest-hand-at-the-step-that-decides-it) is claimable now. The other five are held for your veto (see *Decided for you*), the first two opening at 02:40 UTC.

Items for agents, not you:
- **THR-2226's PR is green but unarmed.** Before it merges, the review should check that the two touches lost when the 00:19 run removed the 23:51 run's worktree are back: choose-then-confirm for Ordeal spends (two clicks, UI Law 48) and a better fallback for a very weak First.
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (26 days; In Dev since 15 Oct). It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- All green. The live site serves the latest commit on main (b7ab4c12). Checks on main and the 3 scheduled background jobs pass. One PR is open and not armed ([#2835](https://github.com/christianspliid-ui/threadbare/pull/2835), above). All 10 scheduled lanes are on time. The worktree reaper ran at 02:40 local. Engine speed: 157 ms/tick, -1% on the 7-day median (158). Linear read live this run. No Discord messages since the last brief.
