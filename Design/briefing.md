---
needsChristian: thr-883-fable-format-lock, demo-readiness-hold, demo-fix-tickets-unqueued, thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-08 18:55 local (16:55 UTC) · by keep-work-flowing-cc

## Needs Christian

**Two things changed since the last brief.** One is good news you asked for directly. The other is a correction to what this file told you an hour ago: the hold on your play sessions has **no end date**, because the four fixes it is waiting on are not actually queued for anyone to do. Details in the second and third items. Everything else carries unchanged and was re-pulled from the board rather than assumed.

- **The encounter-writing session with Fable is still the largest single blocker on the board.** [Lock the authoring format](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) — sit down with Fable, write one encounter end-to-end, and sign off on how encounters get written from now on. It is the board's only Urgent row and it has not moved since 2026-08-02. **Twelve content tickets are held waiting on it**, plus one finished batch parked nine days.

  The sitting turns on **one question: what does an author write for the *aftermath* of an encounter?** Today's answer is "a paragraph and a button", which you rejected on 2026-08-02 against the approved mockup. **Settle the aftermath half first** — otherwise the twelve held tickets unblock into a format that is missing its back half. — *from daily-backlog-grooming*

- **CORRECTION — the hold on your two play sessions has no end date, so it is now your call rather than a wait.** An hour ago this file told you four small blemishes were found, that fix tickets were "queued for the next working sessions", and to expect them "later this evening or tomorrow". **The first half is true and the second half is not.** The four tickets exist, but they were filed in a holding state that the work-picking lane does not read, so **nothing is scheduled to pick them up** and no session will start on them on its own. Left alone they will sit.

  So the honest position is a straight trade-off rather than a wait:

  - **Play now** and mentally discount four cosmetic edges (listed below). Nothing is broken, the endings genuinely differ by how the hand went, and none of it changes what you would be ruling *on*.
  - **Or say the word** and the fixes get moved into the work queue on the next pass, which puts them a session or two away rather than indefinite.

  **Recommendation: play now.** The blemishes are all surface, your verdicts are about prose, rhythm, feel and consequence, and an indefinite hold is worse than a slightly rough edge. Getting the four tickets moving is agent-side housekeeping and is being handled either way — it just is not a reason for you to wait.

  The four edges, so none of them surprises you mid-session: some result labels (like "Star grew" or "standing rose") look clickable but aren't; one screen flashes a long messy decimal where a clean number belongs; one screen prints a raw internal code-word instead of plain English; and one unrelated background encounter leaks a raw text-template glitch into the story log.

- **NEW — you can now see every ending of an encounter from a link, which is the thing you asked for this morning.** Your ask was *"I'd like to test all the different aftermaths."* That shipped about half an hour ago and **is live on the site right now** — I checked the deployed build, not just the merge. Add `&outcome=` to any encounter link and it ends the way you name, instead of you replaying and hoping the dice cooperate. The rare endings — the disasters and the triumphs — were exactly the ones that were hardest to see before, and those are the ones most worth reviewing.

  The six endings, on the bridge encounter as an example: [a clean triumph](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) · [it works](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success) · [it works, but it costs you](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost) · [a near miss](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=near_miss) · [it fails](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=failure) · [it fails badly](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_failure). Swap the encounter name for any of the five below.

  **One honest caveat:** not every encounter has all six endings written yet. Where nobody wrote one, you will get the encounter's normal ending rather than an error — so if two links read the same, that is a gap in the writing, not a bug in the lever. Worth knowing, since spotting those gaps is half of what a review pass like this is for.

- **The four-verdict slice session — ready, and now unblocked by the recommendation above.** [Play the 5-encounter slice](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and rule on four things: does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. "Needs another iteration" is valid on any of them. One link each:
  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - And for the firing-rhythm verdict, which needs natural play rather than spawn-on-demand: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)

- **The consequence verdict, same sitting if you want it.** You split this out on 2026-08-02 so it would not be ruled against an unfinished aftermath — and the aftermath is now finished and live. [The consequence session](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) asks one thing: play a hand to its ending, and say whether **the change to the world is visible, and whether it feels like it happened in the world** rather than being announced at you. Same encounters as above, so both sittings can be one go — and the new ending links make it much easier to see the consequence of an ending you would rarely roll.

- **A two-minute check, not a decision: does the ending of an encounter now appear on its own when you play?** You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your exact repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket — a recurrence now would be a different bug, not the old one. You will pass through this naturally during either session above. — *from daily-backlog-grooming*

- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, which makes the same card read differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998)

- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).

## Queue

Backed up — **32 items ready for dev, 1 in progress**. Planning is ahead of execution, and nothing is stuck.

- **The four demo-readiness fix tickets are not in the work queue.** They sit in an early holding state that the hourly work-picking lane never reads — it scans two later columns only — so they are filed but unscheduled. This is the finding behind the correction above; it is agent-side housekeeping, not a decision for you.
- **A new defect reached the top of the pile this afternoon:** fifteen mercenary-company encounters were written against the wrong shape and fail every time their ending is worked out. Filed and queued; it is the highest-priority item now waiting.
- **No unowned work** — the one in-progress item has an owner, for a ninth consecutive run.
- The only item in progress is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), deliberately paused behind the Fable format lock. Nothing to do — it waits on the same decision as everything else in that stack.
- Everything else in the ready pile is small cleanup. **Eight items have been waiting more than a week**, unchanged. None of them blocks anything.

## Freshness

- **The live site is serving the newest work** (`e329caa2` — the ending-review links above). Worth knowing before you sit down: what you would be ruling on is genuinely deployed, checked against the live build rather than the merge.
- All nine scheduled jobs are running on time, and the automated checks are healthy.
- **The background jobs went quiet overnight again** and resumed on their own. **Logged as normal per your message on 2026-08-06, not raised.** The detector still flags this shape every night; teaching it that overnight quiet is expected is on the agent-side list, not yours.
- One pull request is open: the encounter batch paused on purpose. **It needs nothing from you** — the pause is recorded on the PR itself, so it no longer gets re-raised here.
- The housekeeping job that cleans up old work folders ran fifteen minutes ago. 44 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

- **The ending-review lever shipped and deployed** ([THR-1030](https://linear.app/threadbare/issue/THR-1030)) — filed off your chat ask this morning, merged and live within the day. That is the `&outcome=` links above.
- The [UX Laws assessment of the encounter popups](https://linear.app/threadbare/issue/THR-1031), your other ask from this morning, is written up and waiting in the ready pile.
- Two other repairs closed today: encounter history was silently losing entries, and aftermath choices were rendering as bare labels with the authored intent dropped.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
