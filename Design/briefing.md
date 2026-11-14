# Briefing
**Generated:** 2026-11-15 00:58 local (23:58 UTC) · keep-work-flowing-cc

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

- [The Mandate bar says the mortal's deeds fill it, but they never do](https://linear.app/threadbare/issue/THR-2199/the-mandate-bar-says-the-mortals-deeds-fill-it-but-they-never-do-after): **the Mandate now says what moves it.** *(new this hour)*
  - **What went wrong:** in warm round 4 the Mandate still read "Holding" for most of the session. This was the veteran's quit point. The skimmer said "it says it's filled by Mind and Spirit, but my pools are full and the bar looks empty".
  - **What is really happening:** playing any card on Kael's chapter already raises the Mandate. Without a card, nothing moves. The screen says the opposite: "Filled by what you and the one mortal bound to you raise". Full pools mean nothing was spent.
  - **The fix:** the line now names the act: "Rises when you spend Mind or Spirit essence on Kael's chapters, or on places." "Rising" now lasts three days instead of one, so it no longer fades before your next chance to play.
  - **Kept as it is:** the rule itself. Only chapters you put essence into count, as decided in [Give both clocks a verb](https://linear.app/threadbare/issue/THR-2202).
  - Built in [The Mandate says what moves it](https://linear.app/threadbare/issue/THR-2236/the-mandate-says-what-moves-it-the-fill-line-names-the-spend-rising).
  - **Veto:** say "the mortal alone should fill it" if Kael's chapters should count even when you play nothing. Held until 11:30 UTC tomorrow. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-14f.md)*
- [Read the Threads returns only a tally](https://linear.app/threadbare/issue/THR-2225/read-the-threads-costs-a-dozen-essence-and-a-short-look-back-returns): **paying more for Read the Threads now always shows more, never less.**
  - **What went wrong:** the story tester paid 12 essence for the longest look back (3 days). That read blurred everything it covered into counts like "2 encounters: 2 succeeded", even the last half day, which the cheapest read (2 essence) shows in full. The most expensive read gave the least.
  - **The fix:** each chapter fades by its own age. A 3-day read shows the last half day in full and lets only older days fade. Each faded group opens with one story line about its biggest chapter, naming the mortal; the count sits under it.
  - **Each window says what it buys** before you pay, e.g. "3 days: the last half day in full, older days fading to a line each". Also fixed: the empty "Notable" heading at the faded level.
  - Built in [A longer look back is always more, not less](https://linear.app/threadbare/issue/THR-2235/a-longer-look-back-is-always-more-not-less-read-the-threads-fades-each).
  - **Veto:** say "keep deep reads blurry" if a long look back should stay a blur on purpose. Held until 08:35 UTC tomorrow. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-14e.md)*
- [Check that the First's whole journey fits one run](https://linear.app/threadbare/issue/THR-2232/check-that-the-firsts-whole-journey-fits-one-run-measure-when-each) (your ask from this afternoon): **a run already tells the First's whole journey, and Doom never cuts it short. The Apotheosis was in the wrong place, so it moves.**
  - **The journey runs on Doom's own clock.** Call at 10% of the age, the trials from 20% to 48%, the Crisis at 55%, the Ordeal at 70%, the Return at 80%. On all six test runs the Return came the moment Doom's last stage began. The last fifth of the age then belongs to the clocks, as you chose with "A".
  - **The Apotheosis came far too early** (about 40% of the age, mid-trials, and in hands-off runs it came back every few days). Now it comes once, after the Ordeal and before the Return: [The First's Apotheosis comes after the Ordeal](https://linear.app/threadbare/issue/THR-2234/the-firsts-apotheosis-comes-after-the-ordeal-once-between-the-ordeal).
  - **One trial vision sometimes went missing.** It now arrives late instead of never: [No journey vision is lost](https://linear.app/threadbare/issue/THR-2233/no-journey-vision-is-lost-a-road-of-trials-beat-whose-moment-passed).
  - **Veto:** say "the Apotheosis is a mid-run power spike" to keep it where it is today. Both builds are held until 05:45 UTC tomorrow. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-14d.md)*
- [The mid-game words still mean nothing (seventh recurrence)](https://linear.app/threadbare/issue/THR-2224/recurs-after-fix-seven-times-the-mid-game-words-still-mean-nothing): **half of this complaint came from the test, not the game.**
  - **Warm testers have been playing a showcase world** (11 made-up "Hooks" and a little essence in every pool). From now on the warm start skips that kit: [Warm playtests arrive in a real world](https://linear.app/threadbare/issue/THR-2230/warm-playtests-arrive-in-a-real-world-the-warm-start-stops-loading-the).
  - **On a chapter screen, dots mean only the odds; the Elder powers row shows up the first time a card's price names an elder pool; card-tag hovers get checked on cards you can't afford.** Built in [One mark, one meaning on the Stage](https://linear.app/threadbare/issue/THR-2231/one-mark-one-meaning-on-the-stage-the-steps-standing-reads-as-a-word).
  - **Veto:** say "keep the test kit" if warm rounds should keep the showcase world on purpose. Held until 02:40 UTC tomorrow. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-14c.md)*
- [Put the god in the climax](https://linear.app/threadbare/issue/THR-2204/put-the-god-in-the-climax-the-journey-visions-read-from-the-scene-the): **the run's big moments now need the god, and the ending says what the god did.** Its veto window closed at 23:53 UTC and the first build has started.
  - **The Ordeal is no longer bought.** Each choice leans on a roll and shows its odds before you pay: [The Ordeal is rolled](https://linear.app/threadbare/issue/THR-2226/the-ordeal-is-rolled-and-journey-visions-read-the-scene-the-god-leans) (being built now).
  - **The Apotheosis is in doubt, and its deciding step has the run's largest hand:** [The Apotheosis deals the run's largest hand](https://linear.app/threadbare/issue/THR-2227/the-apotheosis-deals-the-runs-largest-hand-at-the-step-that-decides-it).
  - **Visions happen where the First is. The Return gets a "Go on" button** ([THR-2228](https://linear.app/threadbare/issue/THR-2228/the-return-has-a-go-on-button-and-says-what-the-age-has-left-today)). **The ending names what you did** ([THR-2229](https://linear.app/threadbare/issue/THR-2229/the-ending-tells-what-this-god-did-with-its-first-the-ordeal-and-the)).
  - **Veto:** "veto climax" still reverses it, though the build is now under way. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-14b.md)*

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-12/contact-sheet.jpg) — better: The First's name fits, the essence and Doom readouts speak in words, and returning to the mid-game now opens on a "While you were away" summary, but arrival toasts still pile up and his thread row cuts his story short.

## Queue

**Healthy: 7 tickets in Ready for Dev, and the builder is working again.** The climax veto window closed at 23:53 UTC, and the builder claimed [The Ordeal is rolled](https://linear.app/threadbare/issue/THR-2226/the-ordeal-is-rolled-and-journey-visions-read-the-scene-the-god-leans) at 23:52 UTC; that run is live now. Next up: [The Apotheosis deals the run's largest hand](https://linear.app/threadbare/issue/THR-2227) is claimable now. The rest are held for your veto: the warm-playtest fixes ([THR-2230](https://linear.app/threadbare/issue/THR-2230), [THR-2231](https://linear.app/threadbare/issue/THR-2231)) until 02:40 UTC, the pacing builds ([THR-2233](https://linear.app/threadbare/issue/THR-2233), [THR-2234](https://linear.app/threadbare/issue/THR-2234)) until 05:45 UTC, Read the Threads ([THR-2235](https://linear.app/threadbare/issue/THR-2235)) until 08:35 UTC, and the new Mandate fix ([THR-2236](https://linear.app/threadbare/issue/THR-2236)) until 11:30 UTC.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (26 days; In Dev since 15 Oct). It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- All green. The live site serves the latest commit on main (b7ab4c12). Checks on main and the 3 scheduled background jobs pass; no PRs are waiting. All 10 scheduled lanes are on time. The worktree reaper ran at 00:53 local. Engine speed: 152 ms/tick, -4% on the 7-day median (159), inside the normal range. Linear read live this run.
