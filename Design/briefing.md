---
needsChristian: thr-883-collapsed-to-review, demo-fix-tickets-unqueued, thr-1042-consequence-suppression, thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-08 20:55 local (18:55 UTC) · by keep-work-flowing-cc

## Needs Christian

**The big one changed, and it changed in your favour.** The encounter-writing session — the thing this brief has called your largest blocker every hour for a week — **is no longer a session you have to run.** You settled it in chat this afternoon. Details first item. Everything else below is unchanged and was re-read off the board rather than carried.

- **The format sitting is done. You answered all eight open questions this afternoon, and what's left of it is a short read, not a sitting.** Your rulings this afternoon settled every open point: batches of six with the variance visible, briefs drafted for you and approved in chat, **no exemptions ever** (a shape that can't carry a piece becomes its own kind of encounter, never a waiver), park-for-salvage instead of killing a failed draft, cast written in named prose with the binding mandatory, a floor of three endings per encounter, and retrofit all fifteen existing encounters.

  **What remains of THR-883 is you reading two things Fable will write** — the amended writing rules, and one worked example encounter that follows them end to end. **Neither exists yet, so there is nothing for you to do this evening.** The four build tickets that came out of your rulings are filed and sitting at the top of the ready pile.

  **One honest gap, and it is mine to close, not yours:** nothing is currently scheduled to make Fable *write* those two things. The four filed tickets cover the tooling around them, not the drafting. I can't file tickets from this lane, so it goes on the agent-side list and gets picked up on the next grooming pass. Flagging it because otherwise your "short read" quietly never arrives. [THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format)

- **Still your call, unchanged: play now, or wait for small cosmetic fixes that nothing is scheduled to do.** Same as the last three hours, with one change — it's **five** blemishes now, not four. The tickets all sit in a holding column the work-picking lane does not read, so **left alone they sit indefinitely.** Either play now and mentally discount some surface edges, or say the word and they get moved into the work queue.

  **Recommendation still: play now.** The five, so none surprises you: some result labels (like "Star grew" or "standing rose") look clickable but aren't; one screen flashes a long messy decimal where a clean number belongs; one screen prints a raw internal code-word instead of plain English; one background encounter leaks a raw text-template glitch into the story log; and **new this hour** — an older-style choice card shows a bare "+15% success" and a raw internal word (`coercive`) on a screen a player can reach.

- **Unchanged and still worth knowing before the consequence session: the ending screen is hiding the mechanical half of what happened.** When the game finishes working out an encounter it builds one list of everything that changed — the written consequences the author wrote, **plus** what the world actually did (skill growth, standing shifts, anything won). The ending screen keeps only the written half. All five of your encounters take that path.

  - **The slice session ([THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game)) is unaffected — play it now.** Prose, firing rhythm, interface, and whether deciding is fun do not depend on this.
  - **The consequence session ([THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence)) is the one I'd hold**, or play knowing you're seeing only the authored half.

  Same honest limit as last hour: I confirmed the discard happens and that your five encounters hit it. I did not measure how much is being dropped on those five — none of them award a prize, so it's growth and standing rather than anything dramatic. Could read as mild thinness rather than an obvious hole. [THR-1042](https://linear.app/threadbare/issue/THR-1042)

- **The four-verdict slice session — ready, and it got better an hour ago.** [Play the 5-encounter slice](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and rule on four things: does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. "Needs another iteration" is valid on any of them.
  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - And for the firing-rhythm verdict, which needs natural play: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)

  **What's new since you last played: the scene now shows you who is in it and what's at stake.** The encounter screen was quietly working out a cast list and a stakes preview and then showing neither; both now appear, along with a short line on a resolved step saying how it ended. That shipped and went live twenty minutes ago, so it's in every link above.

  **The ending-review links still work** — add `&outcome=critical_failure` (or `success`, `failure`, `near_miss`, `success_at_cost`, `critical_success`) to any of the above to end it that way instead of replaying and hoping. Where nobody has written that ending yet you'll get the normal one, so two links reading the same means a gap in the writing, not a bug.

- **A two-minute check, not a decision: does the ending of an encounter now appear on its own when you play?** You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your exact repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket — a recurrence now would be a different bug, not the old one. You'll pass through this naturally during the slice session.

- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, which makes the same card read differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998)

- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).

## Queue

Backed up — **36 items ready for dev, 1 in progress**. Planning is ahead of execution, and nothing is stuck.

- **Your rulings this afternoon turned into four filed tickets, three of them top-priority and ready to pick up**: the engine plumbing that lets encounters bind a real cast; a single command that runs every quality gate on an encounter with no exemptions; a page showing an encounter's entire content package in one view (your ask — *"easily being able to see the entire encounter content package"*); and the batch-run harness.
- **Nothing is yet filed to have Fable draft the two artifacts your review needs** — named under Needs Christian above because it decides whether that review ever lands. Agent-side to fix.
- **The cosmetic fix tickets are still not in the work queue** — now five of them, and a fifth was filed this afternoon into the same holding state. Unchanged agent-side housekeeping, not a decision for you.
- **No unowned work** — the single in-progress item has an owner, for an eleventh consecutive run. It is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), deliberately paused; with the format now settled, it becomes unblockable as soon as the writing rules are amended.
- Everything else in the ready pile is small cleanup. **Eight items have been waiting more than a week**, unchanged. None of them blocks anything.

## Freshness

- All nine scheduled jobs are running on time, and the automated checks are healthy.
- **The live site is serving the newest code** — including the cast-and-stakes change from twenty minutes ago. What you'd play is current.
- No pull requests are stuck. The one open request is the paused encounter batch, held on purpose.
- **The background jobs went quiet overnight again** and resumed on their own. **Logged as normal per your message on 2026-08-06, not raised.** The detector still flags this shape every night; teaching it that overnight quiet is expected is on the agent-side list, not yours.
- The housekeeping job that cleans up old work folders ran fifteen minutes ago. 45 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main`, three commits behind the very latest (it catches up on the hour). The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

- **Two repairs shipped and went live in the last hour.** The encounter screen now shows its cast and stakes and says how a resolved step ended ([THR-1041](https://linear.app/threadbare/issue/THR-1041)); and the mercenary-company encounters, whose endings were written in a format nothing could read, were repaired ([THR-1038](https://linear.app/threadbare/issue/THR-1038)).
- **The Encounter Factory design was approved in chat and is now real work.** Your eight rulings are recorded in the plan, and the build tickets are filed. The thing it promises is the thing you asked for: many encounters, same quality every time, with the checking done by machines and only a sample coming to you.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
