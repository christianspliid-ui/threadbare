---
needsChristian: thr-1064-needs-close, thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-10 14:58 local (12:58 UTC) · by keep-work-flowing-cc

## Needs Christian

**One new ten-second item, then the same five play-and-taste calls. Nothing new has been asked of your judgement since the last brief.**

- **Ten seconds, not a decision: the stone ticket needs closing by hand.** ([THR-1064](https://linear.app/threadbare/issue/THR-1064/the-stone-sets-five-axiological-templates-are-inverted-against)) You settled it an hour ago — the stone reach's five trials stay as written, not a defect. The reasoning is recorded on the ticket and the corrected notes have shipped. **The last brief said a working session would close it. That was wrong, and this is the correction:** none of the automated sessions is permitted to mark a ticket finished — that write is deliberately reserved to you — so it will sit showing "in progress" until you close it. It is the only thing the board thinks is being worked on right now.

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

  The [demo-ready checkpoint](https://linear.app/threadbare/issue/THR-986) rides on the same sitting — the "is this good enough to show someone" call, once A and B are answered. It is **not** ready yet: still blocked on its own thirteen named tickets, unchanged this run.

- **A two-minute check, not a decision: does an encounter's ending now appear on its own when you play?** You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your exact repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket; a recurrence now would be a different bug. You'll pass through this naturally during the sessions above.

- **Action cards are telling players a risk that isn't real.** ([THR-998](https://linear.app/threadbare/issue/THR-998)) Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. **(a)** make the word track the odds the cast will actually roll, so the same card reads differently for different gods; **(b)** stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; **(c)** lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print.

- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961).

## Queue

**Backed up — 34 ready for dev, one item in progress.** That one item is the stone ticket above; it stops showing as in-progress the moment you close it.

**The shape of the shelf is the thing worth knowing, and it has not changed.** Of the 34 ready items, 31 are `Low`-priority cleanup — dead code, stale comments, prose-detector misses. **There is still no encounter content queued.** The thirty-four encounters dropped on your ruling have not re-entered as tickets; that work is folded into [the Encounter Factory](https://linear.app/threadbare/issue/THR-1043), which is still being designed. **If you would rather have some hand-written encounters in the meantime rather than waiting for the machine, say the word and it becomes a ticket** — noted as available, not asked as a question.

**The one genuinely important repair still does not need you:** [THR-1071](https://linear.app/threadbare/issue/THR-1071) — across 37 of the 40 converted encounters the merciful choice currently makes a character *more* ruthless. It is the board's only High-priority item, it carries its own fix decision, and it is waiting to be pulled into the ready queue on the next promotion sweep rather than waiting for a ruling. Correcting the last brief: it sits one step earlier in the pipeline than that brief implied — filed and prioritised, not yet queued.

## Freshness

- **Home tree:** on `main`, fully up to date with the remote, nothing stranded. Two tracked config files are still modified (`.claude/settings.json`, `.claude/settings.local.json`) — harmless, but they will block the automatic sync the moment a change to those same files arrives. Clear whenever convenient: `git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- .claude/settings.json .claude/settings.local.json` (only if you did not mean to change them).
- **26 untracked report files** still piling up in the home tree's `Docs/ops/` and `Design/retros/`. Already filed as [THR-1056](https://linear.app/threadbare/issue/THR-1056) and queued — noted only because it is the shape that has stalled the sync before.
- **Deploy:** the live site is serving the latest commit on `main` (`f042c335`). Green.
- **Automated checks:** running normally. All nine scheduled jobs are on schedule.
- **Overnight quiet:** the lane-silence probe again reports the last few nights as unexplained gaps (roughly 20:30→06:15 UTC). It is repeating a question **you already answered on 2026-08-08** — *"overnight quiet is normal"* — so it is not being raised to you again. Recorded here so the decline is visible rather than silent: the shape is nightly and machine-off-shaped, and the probe has no way to express "expected every night."
- **Housekeeping:** the git reaper ran 18 minutes ago and is healthy — 48 worktrees, 64 branches, 2 needing a human call on whether their unmerged work is wanted.

## What's moving

- **The stone investigation is finished bar the click.** The ticket that claimed the stone reach was broken now records that it isn't, the notes that said otherwise are corrected and merged, and the real bug it uncovered is filed at High.
- **The backwards-mercy bug** ([THR-1071](https://linear.app/threadbare/issue/THR-1071)) remains the most consequential find this week: it silently pointed thirty-seven encounters' moral outcomes the wrong way. It surfaced because a session checked a convention against the code instead of trusting the ticket that sent it.
- Still fresh from the last day: the veil's countdown bug fixed ([THR-1068](https://linear.app/threadbare/issue/THR-1068)), thirty-five encounters rewritten so the ending names what actually happened ([THR-929](https://linear.app/threadbare/issue/THR-929)), the Compulsion now planting a weight instead of pushing ([THR-886](https://linear.app/threadbare/issue/THR-886)), and all forty meeting tests finished ([THR-875](https://linear.app/threadbare/issue/THR-875)).

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
