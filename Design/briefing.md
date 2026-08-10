---
needsChristian: thr-1064-ruling-reversed, thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-10 11:58 local (09:58 UTC) · by keep-work-flowing-cc

## Needs Christian

**One new thing, and it is a correction to something you were told by this brief.** The rest is the same five play-and-taste items. Nothing on the board is blocked on any of them.

- **A ruling you gave yesterday was based on a wrong brief — mine. It needs one word from you to close.** ([THR-1064](https://linear.app/threadbare/issue/THR-1064/the-stone-sets-five-axiological-templates-are-inverted-against))

  On Saturday you were told the stone reach's five trials say the opposite of their label, and asked which of three fixes to take. You answered *"flip the label"*, which was the sensible answer to the question as put.

  **The question was wrong.** A working session went to implement your ruling, checked the underlying convention against the code before touching anything, and found the stone trials are correct as written. The evidence I quoted to you — *"one scene literally says pride preserved is a wall … filed under transformation"* — had the two poles the wrong way round. Pride-preserved is filed under **preservation**, which is right. I inherited that error from the ticket and passed it to you as though I had checked it.

  **What it needs:** the ticket closed as *not a defect*. No lane here is allowed to mark something Done, so it sits in progress until you clear it. Nothing else waits on it.

  **The real bug turned out to be much bigger, and it does not need you.** Across the other 40 converted encounters, 37 have the sign backwards — the merciful choice makes a person *more* ruthless, not less. Kneeling in the dirt to hold a cup to a dying boy's lips currently pushes that character toward Conqueror. It is filed as [THR-1071](https://linear.app/threadbare/issue/THR-1071/37-of-40-converted-dilemmas-write-the-axiological-profile-backwards) at High priority and carries its own fix decision, so it proceeds without you. Stone reads right only because two separate mistakes cancel each other out there.

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

**Backed up — 35 ready for dev, one item in progress.** That one is the stone ticket above, sitting in progress only because it is waiting on you to close it.

**Your `gogogo` from this morning was applied to the board in full.** All ten encounter-batch tickets and their parent were dropped at 08:31Z, exactly as the ruling said. Roughly thirty-four encounters written to the old instructions are now off the board.

**One correction to what I told you last hour.** I said those encounters would "re-enter the pipeline as re-authoring passes". They have not, and there is currently no ticket queued that will produce them. The work has been folded into a larger effort instead — [the Encounter Factory](https://linear.app/threadbare/issue/THR-1043), a machine for producing finished encounters at scale, which is still being designed. Three of its parts shipped over the weekend. That is a reasonable place for the work to go, but it means the honest picture today is: **no encounter content is queued, and the next batch of encounters arrives when the Factory does.** If you would rather have some hand-written ones in the meantime, that is a call worth making — say the word and it becomes a ticket.

**The rest of the shelf is unchanged in shape:** of the 35 ready items, 31 are `Low` priority cleanup — dead code, stale comments, prose-detector misses. The one High-priority item on the board is the backwards-mercy bug found this morning, and it is a repair rather than new play.

## Freshness

- **Home tree:** on `main`, fully up to date with the remote, nothing stranded. Two tracked config files are still modified (`.claude/settings.json`, `.claude/settings.local.json`) — harmless, but they will block the automatic sync the moment a change to those same files arrives. Clear whenever convenient: `git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- .claude/settings.json .claude/settings.local.json` (only if you did not mean to change them).
- **25 untracked report files** still piling up in the home tree's `Docs/ops/` and `Design/retros/`. Already filed as [THR-1056](https://linear.app/threadbare/issue/THR-1056) and queued — noted only because it is the shape that has stalled the sync before.
- **Deploy:** the live site is serving the latest commit on `main` (`ef7658be`). Green.
- **Automated checks:** running normally; all nine scheduled jobs on time. One open pull request, correctly held on purpose ([#1114](https://github.com/christianspliid-ui/threadbare/pull/1114)) — the branch behind the encounters you just dropped; it wants closing rather than merging.
- **Overnight quiet:** the lane-silence probe again reports the last few nights as unexplained gaps (roughly 20:30→06:15 UTC). It is repeating a question **you already answered on 2026-08-06**, so it is not being raised to you again. Recorded here so the decline is visible rather than silent: the shape is nightly and machine-off-shaped, and the probe has no way to express "expected every night."
- **Housekeeping:** the git reaper ran 18 minutes ago and is healthy — 48 worktrees, 63 branches, 2 needing a human call on whether their unmerged work is wanted.

## What's moving

- **The backwards-mercy bug was caught** ([THR-1071](https://linear.app/threadbare/issue/THR-1071)) — found because a session checked a convention against the code instead of trusting the ticket that sent it. It is the most consequential thing found this week: it silently pointed thirty-seven encounters' moral outcomes the wrong way.
- **The veil's countdown bug is fixed** ([THR-1068](https://linear.app/threadbare/issue/THR-1068)) — encounters set to resolve on their own now actually do, instead of piling up a badge that counted downward past zero forever.
- Still fresh from overnight: thirty-five encounters rewritten so the ending names what actually happened ([THR-929](https://linear.app/threadbare/issue/THR-929)), the Compulsion now plants a weight instead of pushing ([THR-886](https://linear.app/threadbare/issue/THR-886)), and all forty meeting tests finished ([THR-875](https://linear.app/threadbare/issue/THR-875)) — every one of the eight reaches now gives a mortal a real formative test the first time you meet them.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
