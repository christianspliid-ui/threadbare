---
needsChristian: thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-09 11:55 local (09:55 UTC) · by keep-work-flowing-cc

## Needs Christian

**Nothing new since the last brief, and nothing has gone wrong.** Your list is the same six items it was an hour ago — all of them play or taste, none of them urgent, none of them blocking anyone. The machine is busy draining the work your format approval released this morning.

- **Both play sessions are ready, and they are still the only things on your list that hold anything up.** Two rulings sharing the same five encounters, so it can be one sitting.

  **Session A — the four-part verdict** ([THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game)): does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. *"Needs another iteration"* is a valid answer on any of the four.

  **Session B — the consequence verdict** ([THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence)): play a hand to its ending and say whether the change to the world is **visible**, and whether it feels like it **happened in the world** rather than being announced at you.

  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - For the firing-rhythm verdict, which needs natural play: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)

  Add `&outcome=critical_failure` (or `success`, `failure`, `near_miss`, `success_at_cost`, `critical_success`) to any link to end it that way instead of replaying and hoping. Where nobody has written that ending yet you get the normal one — so two links reading the same means a gap in the writing, not a bug.

- **A two-minute check, not a decision: does an encounter's ending now appear on its own when you play?** You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your exact repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket; a recurrence now would be a different bug. You'll pass through this naturally during the sessions above.

- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, so the same card reads differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998)

- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).

## Queue

Backed up — **39 items ready for dev, 2 in progress**. Nothing is stuck and nothing is unowned.

- **The content pipeline is moving again for the first time in ten days.** Your format approval this morning released twelve held tickets; the promotion lane took the first of them ([the meeting-batch conversion, THR-875](https://linear.app/threadbare/issue/THR-875)) at 09:26Z and the rest drain over the next several runs. **Nothing needed from you** — this is the thing your approval was for.
- **Both in-progress items have an owner**, for a sixteenth consecutive run: the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860) and [ten encounters whose written endings reach nobody](https://linear.app/threadbare/issue/THR-1054), mid-flight.
- **One piece of tidying for a working session, not for you:** the civic-seats pull request still carries the "paused until the format is locked" note that stopped it merging. The format *is* locked, so that note is now stale and needs removing by hand before the batch can land.
- **Four items have been waiting more than a week** (the oldest eleven days). All small cleanup; none blocks anything. These, plus the six housekeeping items filed yesterday morning, are the pile your cost-benefit ruling now governs.

## Freshness

- All nine scheduled jobs are running on time, the automated checks are healthy, and **the live site is serving the latest code**.
- **One pull request needs a working session, not you** — the ten-endings fix ([#1364](https://github.com/christianspliid-ui/threadbare/pull/1364)) has both a merge conflict and a failing check, and has now been sitting 94 minutes, just past the point where it stops being normal. Flagged for the next session to clear.
- **The background jobs went quiet overnight again** (roughly 22:30 to 08:00) and resumed on their own. **Logged as normal per your message on 2026-08-06, not raised** — seventeenth run in a row. The detector still flags this shape every night; teaching it that overnight quiet is expected is on the agent-side list, not yours.
- The housekeeping job that cleans up old work folders ran fifteen minutes ago. 50 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

**The ten-day content freeze is over and the queue is acting like it.** [THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) closed at 08:45Z on your chat approval of the writing rules and the Swollen Ford exemplar. Since then, without anything further from you:

- The first of the twelve released tickets was promoted and is claimable now; eleven more follow, including the [encounter factory harness](https://linear.app/threadbare/issue/THR-1047) and eight batches of encounter writing.
- The [ten-endings fix](https://linear.app/threadbare/issue/THR-1054) is mid-flight — the one that makes written endings actually reach players on ten temple-and-quest encounters. Relevant to Session B, though not blocking it: the five encounters in your links are a different set and already work.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
