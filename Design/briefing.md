---
needsChristian: thr-883-producer-gap, thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-09 08:55 local (06:55 UTC) · by keep-work-flowing-cc

## Needs Christian

**Quiet night — two pieces of work shipped, nothing broke, and one thing has now been waiting on nobody for thirteen hours.** That last one is the only item that changed shape since last night, and it is the first below.

- **Your biggest blocker is one short read away, and still nothing is scheduled to write it.** You settled the encounter-writing format yesterday afternoon. What closes it is you reading two short things: the amended writing rules, and one worked example encounter written to them. **Neither exists, and no work item exists to make them.** This was flagged at 20:00 last night as "second hour running"; it is now **thirteen hours** and three more work-picking rounds have passed it by, because a thing nobody has written down is a thing no lane can pick up.

  **Eleven content tickets and the factory harness are held behind it.** Nothing else on the board unblocks that much work.

  **One word from you fixes it** — say "file it" and the next working session creates the item so the drafting actually gets scheduled. I cannot file work items from this lane. [THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) *(also raised by the daily backlog grooming and the orchestrator)*

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

Backed up — **35 items ready for dev, 2 in progress**. Planning is ahead of execution, and nothing is stuck.

- **The cosmetic-fix question from last night has largely answered itself.** Three of the small player-facing text defects that were sitting outside the work queue are now in it (the messy decimal on the nudge screen, the raw internal word in written endings, and the `{cast:*}` placeholders leaking into reaction labels). One remains in the holding column. **Dropping this from your list** — it no longer needs a decision from you.
- **Both in-progress items have owners; no unowned work**, for a thirteenth consecutive run. One is the [Package View](https://linear.app/threadbare/issue/THR-1046) picked up overnight; the other is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), deliberately paused and correctly not re-raised.
- **Twelve items have been waiting more than a week** (up from eight, because time passed rather than because anything decayed). All small cleanup; none blocks anything.

## Freshness

- All nine scheduled jobs are running on time; the automated checks are healthy; the live site is serving the newest code.
- No pull requests are stuck. The one open request is the paused encounter batch, held on purpose.
- **The background jobs went quiet overnight again** (roughly 20:30 to 06:00) and resumed on their own. **Logged as normal per your message on 2026-08-06, not raised.** The detector still flags this shape every night; teaching it that overnight quiet is expected is on the agent-side list, not yours.
- The housekeeping job that cleans up old work folders ran fifteen minutes ago. 46 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

Two things shipped overnight, both plumbing for the encounter factory rather than anything you'd see on screen:

- **Encounters in the new format can now name who's in the scene** ([THR-1044](https://linear.app/threadbare/issue/THR-1044)) — the cast a writer declares gets filled in from the kind of place the encounter happens in.
- **One command now runs every quality check on a single encounter** ([THR-1045](https://linear.app/threadbare/issue/THR-1045)) — the gate the factory needs so a batch of encounters can be checked by machine instead of by you.

*Note on the board: a large batch of tickets shows a fresh timestamp this morning from a bulk field edit, not from being completed. Nothing else finished overnight.*

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
