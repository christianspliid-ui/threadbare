---
needsChristian: thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: skipped
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-09 10:57 local (08:57 UTC) · by keep-work-flowing-cc

## Needs Christian

**Your two biggest open items both closed this hour, and both closed because of something you said.** The encounter-writing format is locked, and the process-rule question is answered. What is left is play, not paperwork.

- **Both play sessions are ready, and they are now the only things on your list that hold anything up.** Two rulings sharing the same five encounters, so it can be one sitting.

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

## From Christian

**You answered the process-rule question at 10:45 local**, and you rejected the way it was put to you:

> *"your choice is a false dichotomy. its not either of these. it is from now on and existing tickets should be re-read and reprioritized in the light of a cost benefit analysis"*

Recorded as settled, and the question is off your list. Two halves, handled differently:

- **"From now on" is now the standing rule** — the cost-and-benefit requirement binds tickets filed from 2026-08-08 onward. That is what this morning's sweep already did, so nothing has to be undone.
- **"Existing tickets should be re-read and reprioritized under a cost-benefit analysis"** is a real piece of work and is **not something this lane may do** — it re-orders the board, and I only write these two files. **Routed to the next working session**, which owns the backlog sweep. Roughly 13–17 of the 39 ready items are in scope; none of them gets demoted on age, each gets read on what it costs versus what it saves. You will see the result as a re-ordered queue, not as another question.

## Queue

Backed up — **39 items ready for dev, 2 in progress**. Nothing is stuck and nothing is unowned.

- **Both in-progress items have an owner**, for a fifteenth consecutive run. One is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), whose hold was lifted by your format approval this morning — the pipeline picks it up on its own now; the other is [ten encounters whose written endings reach nobody](https://linear.app/threadbare/issue/THR-1054), mid-flight.
- **Six new housekeeping items were filed this morning** by the weekly sweep — wiki gaps, a plan doc missing its required sections, untracked files piling up in your working copy. All small, all queued. **These are exactly the pile your cost-benefit ruling now applies to.**
- **About a dozen items have been waiting more than a week.** All small cleanup; none blocks anything.

## Freshness

- All nine scheduled jobs are running on time; the automated checks are healthy; the live site is current — nothing since the last publish touched game code, only notes and docs.
- **One pull request needs a working session, not you** — the ten-endings fix ([#1364](https://github.com/christianspliid-ui/threadbare/pull/1364)) has both a merge conflict and a failing check, 34 minutes old. Inside the normal window; the next session clears it.
- **The background jobs went quiet overnight again** (roughly 20:30 to 06:00) and resumed on their own. **Logged as normal per your message on 2026-08-06, not raised.** The detector still flags this shape every night; teaching it that overnight quiet is expected is on the agent-side list, not yours.
- The housekeeping job that cleans up old work folders ran seventeen minutes ago. 49 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

**The encounter-writing format is locked.** You read the amended [writing rules](https://github.com/christianspliid-ui/threadbare/blob/main/.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md) and the [Swollen Ford exemplar](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts) in chat this morning and approved them — *"looks fine."* [THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) closed at 10:45 local after ten days as the board's only Urgent row.

What that releases, without anything further from you:

- **Eleven paused content tickets and the encounter factory harness unblock** on the next automatic sweep — all the Nudge Model content batches, the Meeting dilemma conversion, and the harness that runs the whole thing.
- **The retrofit of all fifteen existing nudge-era encounters** becomes the factory's first real batch, rather than a separate cleanup job.
- **The civic-seats batch that has been parked since 2026-07-30** stops being parked.

Also shipped since the last brief: your Rule Zero — every reference you see carries a clickable link — is now the first section of the project's own instructions, so it binds every agent from here on.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
