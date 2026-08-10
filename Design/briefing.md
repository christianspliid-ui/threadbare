---
needsChristian: thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, ws5-batch-scope-extension, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-10 08:58 local (06:58 UTC) · by keep-work-flowing-cc

## Needs Christian

**One new question this morning, and it is a scope call only you can make.** The other six are the same play-and-taste items as last night. Nothing new arrived on Discord.

- **NEW — your civic-seats answer settled four encounters. Does it settle the other thirty-four?** You said *"go B for the four encounters"* — drop the four capital-city seats and let the new writing pipeline re-author them, since they were written to instructions that predate the format lock. **The rest of the shelf is in exactly the same condition** — roughly thirty-four more encounters, all written to those same old instructions, across [THR-848](https://linear.app/threadbare/issue/THR-848), [THR-855](https://linear.app/threadbare/issue/THR-855), [THR-856](https://linear.app/threadbare/issue/THR-856), [THR-858](https://linear.app/threadbare/issue/THR-858), [THR-859](https://linear.app/threadbare/issue/THR-859), [THR-861](https://linear.app/threadbare/issue/THR-861), [THR-863](https://linear.app/threadbare/issue/THR-863) and [THR-864](https://linear.app/threadbare/issue/THR-864). The team is holding all of them rather than guessing whether "drop and re-author" was about those four specifically or about the whole leftover pile. **A one-line answer either way unblocks the shelf.** *— raised by `tb-orchestrator`.*

  **Recommendation: extend it.** The same reason applies — these were written before the format was locked, and re-authoring them under the new pipeline costs less than retrofitting prose that was never right.

- **Both play sessions are still ready, and they are still the same one sitting.** Two rulings over the same five encounters.

  **Session A — the four-part verdict** ([THR-907](https://linear.app/threadbare/issue/THR-907)): does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. *"Needs another iteration"* is a valid answer on any of the four.

  **Session B — the consequence verdict** ([THR-974](https://linear.app/threadbare/issue/THR-974)): play a hand to its ending and say whether the change to the world is **visible**, and whether it feels like it **happened in the world** rather than being announced at you.

  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - For the firing-rhythm verdict, which needs natural play: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)

  Add `&outcome=critical_failure` (or `success`, `failure`, `near_miss`, `success_at_cost`, `critical_success`) to any link to end it that way instead of replaying and hoping. Where nobody has written that ending yet you get the normal one — so two links reading the same means a gap in the writing, not a bug.

  The [demo-ready checkpoint](https://linear.app/threadbare/issue/THR-986) rides on the same sitting — the "is this good enough to show someone" call, once A and B are answered. It is **not** ready yet: still blocked on its own named tickets, unchanged this run.

- **A two-minute check, not a decision: does an encounter's ending now appear on its own when you play?** You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your exact repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket; a recurrence now would be a different bug. You'll pass through this naturally during the sessions above.

- **Action cards are telling players a risk that isn't real.** ([THR-998](https://linear.app/threadbare/issue/THR-998)) Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. **(a)** make the word track the odds the cast will actually roll, so the same card reads differently for different gods; **(b)** stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; **(c)** lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print.

- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961).

## Queue

**Backed up — 34 ready for dev, 2 in progress and both parked.** Nobody is idle and nothing is stuck, but the ready pile is almost entirely small cleanup: **31 of the 34 are `Low` priority** and the other three are internal tidying. There is still no High or Urgent work on the shelf at all — which is the same thing the new question above is about. The feature pipeline is thin because the content batches that would fill it are the ones waiting on your one-line answer.

- **[THR-875](https://linear.app/threadbare/issue/THR-875) — the meeting tests — finished all forty and parked.** Every one of the eight reaches now gives a mortal a real formative test the first time you meet them. It parked on a scope-bookkeeping question (does this ticket close at forty, with the second forty carried by [THR-1062](https://linear.app/threadbare/issue/THR-1062)) — **that is an agent's call, not yours**, and the answer you already gave settles the substance. Parked ~18 hours.
- **[THR-860](https://linear.app/threadbare/issue/THR-860) — the four civic seats — parked, and your answer already closed the question.** What is left is mechanical: close the pull request, drop the branch, re-author the four under the locked format. Waiting on a working session, not on you. Parked ~4 days.
- One parked item ([THR-860](https://linear.app/threadbare/issue/THR-860)) still reports you as its owner, which you are not — the known ticket-system glitch filed as [THR-1058](https://linear.app/threadbare/issue/THR-1058), not a real assignment. Both working slots are actually free.

## Freshness

- **Home tree:** on `main`, fully up to date with the remote, nothing stranded. Two tracked config files are still modified (`.claude/settings.json`, `.claude/settings.local.json`) — harmless, but they will block the automatic sync the moment a change to those same files arrives. Clear whenever convenient: `git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- .claude/settings.json .claude/settings.local.json` (only if you did not mean to change them).
- **25 untracked report files** still piling up in the home tree's `Docs/ops/` and `Design/retros/`. Already filed as [THR-1056](https://linear.app/threadbare/issue/THR-1056) and queued — noted only because it is the shape that has stalled the sync before.
- **Deploy:** the live site is serving the latest commit on `main` (`cd087df4`). Green.
- **Automated checks:** running normally; all nine scheduled jobs on time. One open pull request, correctly held on purpose ([#1114](https://github.com/christianspliid-ui/threadbare/pull/1114)) — held for a reason you have now decided, and being closed out rather than merged.
- **Overnight quiet:** the lane-silence probe again reports the last few nights as unexplained gaps (roughly 20:30→06:15). It is repeating a question **you already answered on 2026-08-06**, so it is not being raised to you again. Recorded here so the decline is visible rather than silent: the shape is nightly and machine-off-shaped, and the probe has no way to express "expected every night."
- **Housekeeping:** the git reaper ran 18 minutes ago and is healthy — 46 worktrees, 62 branches, 2 needing a human call on whether their unmerged work is wanted.

## What's moving

Four things shipped overnight while you were away:

- **Encounters now name what actually happened at the end** ([THR-929](https://linear.app/threadbare/issue/THR-929)) — thirty-five templates were rewritten so the closing line states the result instead of gesturing at it. This is the writing-quality work that feeds directly into Session A's prose verdict.
- **The Compulsion now plants a weight rather than pushing directly** ([THR-886](https://linear.app/threadbare/issue/THR-886)) — your "the whisper that tilts" ruling, built: the mortal's own next decision leans, instead of the god moving them.
- **Joining a faction is now its own moment in the world** ([THR-862](https://linear.app/threadbare/issue/THR-862)) — it has its own event, so a story beat can anchor to it.
- **All forty meeting tests are done** ([THR-875](https://linear.app/threadbare/issue/THR-875)) — every reach now gives a real formative test on first meeting.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
