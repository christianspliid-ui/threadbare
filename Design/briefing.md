---
needsChristian: ws5-batch-disposition, thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-09 13:56 local (11:56 UTC) · by keep-work-flowing-cc

## Needs Christian

**One new thing, and it is a direct consequence of your approval this morning.** The rest of your list is unchanged.

- **NEW — what happens to the four encounters that were written before you locked the format?** ([THR-860](https://linear.app/threadbare/issue/THR-860/nudge-model-ws5-batch-1b-i-civic-seats-rewrite-set-capital-cluster-4)) Four civic-seat encounters — the capital-cluster set, seats of office in a capital city — were fully written back on 30 July and then frozen mid-air when you paused content to settle the writing rules. They have been sitting finished-but-unlanded for ten days. Now that the rules are locked, they no longer match them.

  Two honest ways forward:

  **(a) Land them as they are, fix them later.** The four encounters become playable today. They read in the older, more lyrical voice you rejected, and they join the queue of seven other early templates already waiting to be brought up to the new standard. You'd be accepting four slightly-off encounters in the world for a while in exchange for four more encounters existing.

  **(b) Throw them away and let the new writing pipeline redo them.** They get rewritten to the locked format from the start, by the same process that will write everything after them. Nothing off-standard ever reaches a player. The cost is that ten days of finished writing is discarded and those four seats stay empty until the pipeline reaches them.

  **Recommendation: (b).** You paused ten days of content work *specifically* because quality-that-passed-the-gates was still not good enough. Landing four encounters that predate the fix spends that decision for very little — four encounters, in a world that is about to get many more. The one reason to choose (a) is if you want those four capital seats populated now for a play session.

  This is only about the four written ones. The other eight paused batches were never written and will simply be authored in the new format — no decision needed there.

- **Both play sessions are still ready, and they are still the only things on your list that hold anything up.** Two rulings sharing the same five encounters, so it can be one sitting.

  **Session A — the four-part verdict** ([THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game)): does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. *"Needs another iteration"* is a valid answer on any of the four.

  **Session B — the consequence verdict** ([THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence)): play a hand to its ending and say whether the change to the world is **visible**, and whether it feels like it **happened in the world** rather than being announced at you.

  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - For the firing-rhythm verdict, which needs natural play: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)

  Add `&outcome=critical_failure` (or `success`, `failure`, `near_miss`, `success_at_cost`, `critical_success`) to any link to end it that way instead of replaying and hoping. Where nobody has written that ending yet you get the normal one — so two links reading the same means a gap in the writing, not a bug.

  The [demo-ready checkpoint](https://linear.app/threadbare/issue/THR-986) is assigned to you and rides on the same sitting — it is the "is this good enough to show someone" call, once A and B are answered.

- **A two-minute check, not a decision: does an encounter's ending now appear on its own when you play?** You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your exact repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket; a recurrence now would be a different bug. You'll pass through this naturally during the sessions above.

- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, so the same card reads differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998)

- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).

## Queue

Backed up — **40 items ready for dev, 2 in progress**. Nothing is stuck, nothing is unowned, and no one is idle.

- **The meeting-conversion work is running hot.** [Meeting Batch A](https://linear.app/threadbare/issue/THR-875) — the formative tests a mortal faces when you first meet them — went from 1 converted to **20** in three hours across two shipped batches this morning. Four of the eight reaches now draw a real test on every meeting; four to go, at roughly two reaches per hourly run.
- **One in-progress item is parked on purpose**: the [civic-seats batch](https://linear.app/threadbare/issue/THR-860), which is the disposition call at the top of this brief. It has been parked ten days and will stay parked until you rule.
- **Eleven ready items have been waiting more than a week**, the oldest twelve days. All small cleanup — dead code, stale comments, naming — none of it blocks anything or anyone.
- **Nothing urgent or high-priority is waiting to be picked up.** Everything on the shelf is medium or low, which is healthy: it means the work that matters is either moving or on your list, not queued behind something.

## Freshness

- All nine scheduled jobs are running on time, the automated checks are healthy, and **the live site is serving the latest code**.
- **No pull request needs attention** — the conflicted one flagged last hour ([#1364](https://github.com/christianspliid-ui/threadbare/pull/1364), the ten-endings fix) was cleared and merged. The only thing still open is the parked civic-seats batch above.
- **The background jobs went quiet overnight again** (roughly 22:30 to 08:00) and resumed on their own. **Logged as normal per your message on 2026-08-06, not raised** — eighteenth run in a row. The detector still flags this shape every night; teaching it that overnight quiet is expected is on the agent-side list, not yours.
- The housekeeping job that cleans up old work folders ran sixteen minutes ago. 49 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

**Everything your approval released this morning is draining, without anything further from you.**

- [Meeting Batch A](https://linear.app/threadbare/issue/THR-875) is mid-flight and shipping every run — twenty of forty formative tests written, in the locked format.
- The [encounter factory harness](https://linear.app/threadbare/issue/THR-1047) is claimable and waiting its turn; it is the machine that will write the remaining encounter batches, and it is the reason recommendation (b) above is cheap rather than expensive.
- One scoping note, handled agent-side, no action from you: Batch A turns out to contain a second half that cannot be converted as originally specified. It has been split onto its own ticket so Batch A can finish on the half that works, rather than staying open forever on a blocker it doesn't own.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
