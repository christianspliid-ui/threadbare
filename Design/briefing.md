---
needsChristian: thr-883-producer-gap, process-rule-retroactivity, thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-09 09:56 local (07:56 UTC) · by keep-work-flowing-cc

## Needs Christian

**Two more things shipped this hour, nothing broke, and one new question arrived from the daily backlog sweep.** The lead item is unchanged and is now fourteen hours old.

- **Your biggest blocker is still one short read away, and still nothing is scheduled to write it.** You settled the encounter-writing format yesterday afternoon. What closes it is you reading two short things: the amended writing rules, and one worked example encounter written to them. **Neither exists, and no work item exists to make them** — re-checked this run against the board rather than carried over, including the four factory tickets filed alongside it (none of them is the drafting job).

  It is now **fourteen hours** and five work-picking rounds have passed it by, because a thing nobody has written down is a thing no lane can pick up. **Eleven content tickets and the factory harness are held behind it** — nothing else on the board unblocks that much work.

  **One word from you fixes it** — say "file it" and the next working session creates the item so the drafting gets scheduled. I cannot file work items from this lane. [THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) *(also raised by the daily backlog grooming and the orchestrator)*

- **NEW — a rule you wrote yesterday would empty half the work queue if a lane took it literally, so this morning's sweep paused rather than act.** Your 2026-08-08 correction says a process ticket without a cost-and-benefit line gets demoted. **Every process ticket on the board was filed before that rule existed**, so applied backwards it demotes **13–17 of the 34** ready items in one automated pass — each move looking individually correct.

  **This morning's sweep demoted nothing** and treated the rule as binding only on tickets filed from yesterday onward, leaving the older pile for the weekly review — which your own amendment already assigns that job. **The question is just: backwards or from now on?** One yes/no settles it, and "from now on" is what already happened, so saying nothing is safe. [THR-871](https://linear.app/threadbare/issue/THR-871) *(from the daily backlog grooming)*

- **Both play sessions are still ready and still unplayed.** Two rulings sharing the same five encounters, so it can be one sitting.

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

Backed up — **34 items ready for dev, 1 in progress**. Planning is ahead of execution, and nothing is stuck.

- **One item in progress and it has an owner; no unowned work**, for a fourteenth consecutive run. That one is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), deliberately paused behind the format question and correctly not re-raised as a decision.
- **A new content defect entered the queue this morning** and is the only non-trivial one there: [ten encounters key their written endings the wrong way](https://linear.app/threadbare/issue/THR-1054), so nobody ever sees those endings. Queued, nothing needed from you.
- **About a dozen items have been waiting more than a week.** All small cleanup; none blocks anything.

## Freshness

- All nine scheduled jobs are running on time; the automated checks are healthy; the live site is serving the newest code (`13be45f9`, checked against the site rather than assumed from the merge).
- No pull requests are stuck. The one open request is the paused encounter batch, held on purpose.
- **The background jobs went quiet overnight again** (roughly 20:30 to 06:00) and resumed on their own. **Logged as normal per your message on 2026-08-06, not raised.** The detector still flags this shape every night; teaching it that overnight quiet is expected is on the agent-side list, not yours.
- The housekeeping job that cleans up old work folders ran sixteen minutes ago. 48 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

Two things shipped in the last hour, both aimed at the encounter factory:

- **You can now see an encounter's entire content package on one page** ([THR-1046](https://linear.app/threadbare/issue/THR-1046)) — every step, hand, cast member, reward, ending and image for a single encounter, side by side, with the quality-gate verdict inline. Six can be shown together so you can see how much they vary. **This is the review surface you asked for**, and it is the one you'll open when the format review finally happens.
- **The mercenary encounters can be played again** ([THR-1040](https://linear.app/threadbare/issue/THR-1040)) — they were reachable but not playable.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
