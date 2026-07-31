# Briefing

**Generated:** 2026-07-31 16:16 local (14:16 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**A new question is waiting, and it's a genuine creative call: which five encounters make up the vertical slice?** The groundwork it was waiting on finished at lunchtime — someone catalogued every encounter that exists today and every game system encounter content can currently reach. The next move is picking the five that between them touch the widest spread of the game. An agent will propose a roster with a coverage table and say what each pick uniquely covers; you rule. **Two further pieces of work are already stalled waiting on this one pick.** When you have the appetite: open a chat and say *"work the map"*.

**Your read of the five prototype encounters is done and no longer an open ask.** You approved the first three outright, and your notes on the last two became two permanent rules — one about encounters personalising themselves to the agent involved, one about an encounter being allowed to plant a designed sequel that fires later. That gate is cleared; the writing format is locked. **Eight encounters have since been written in it**, including a bridge crossing, a night after a mountain climb that reads how the climb went, riders following a caravan, a bargain at a crossroads, and a swindled family whose story continues in two different later encounters depending on what you do.

**You cannot play any of those eight yet, and I want to correct an earlier note that implied you could.** A previous checkpoint said the new encounters would show up on the live site. **I checked the live site's contents directly: they are not there.** All eight — plus the click-straight-into-one link and the balanced test character built for you this morning — are riding on a single pull request that has gone tangled again and is failing its checks. **This is hands work, not a decision, and it is not yours to fix.** It is named here only because it is the sole thing standing between you and being able to play what was written. Until it lands, there is nothing new for you to look at in the game itself.

**One command on your machine, and it is worth doing before your next session.** Your working copy stopped receiving updates about two and a half hours ago and is now 22 changes behind. The cause is this very task: an earlier run left two of its own files sitting in your working copy, and the sync refuses to write over them. **Nothing can be lost by clearing them** — I compared them byte for byte against what is already published, and they are identical. Run this and the sync will catch up on its own within the hour:

```bash
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" restore Design/briefing.md Design/user-actions.md
```

**The four older finished encounters stay parked, unchanged.** The capital-cluster batch — the millrace dispute, the ford toll house, the two feuding houses, the monument that became a problem with a rock — is written and passing every check, but in the old style. Whether those four land as-is and get tidied up alongside the seven earlier ones, or get rewritten in the locked format, is a question for the session that closes out the format work. Nothing lost either way, and nothing for you today.

## Queue

**Forty-six jobs ready, one being worked, one parked.** The shelf is well past comfortable, which means planning is running ahead of building — expected while the content side is paused. One high-priority job leads (narrowing an over-eager prose check so it flags evasive writing rather than ordinary writing), four medium behind it, the rest low.

**Two jobs arrived this hour and one shipped** — the one that shipped extends encounter branching from two outcomes to several, which is machinery the new encounters depend on.

**The one job in progress** is a fix for a sweep that only rescues stuck work in one of the two ways it can get stuck. Picked up at the top of the hour and moving.

**The parked job** is the finished-but-held encounter batch described above — about a day parked, holding no one up.

The longest-waiting item crosses our one-week line late this evening. Low-priority tidy-up, so a note rather than a problem.

## Freshness

**Your working copy is stalled** — 22 changes behind, cause identified, one command above. Everything else about it is healthy: right branch, nothing stranded, no work of yours at risk.

**The live site is current** for what has actually been published; nothing game-facing has merged since the last release, so no rebuild was needed. Automated checks normal.

**All eight scheduled jobs are running on time.** Last hour's briefing reported one of them as possibly stalled and said it would say so with real evidence if it missed its next slot. **It did not miss it** — it ran at the top of the hour. That alarm is closed, and it was right not to have been passed to you as a problem. The cleanup job ran half an hour ago and collected a large batch: workspaces down from 44 to 23, branches from 63 to 40.

## What's moving

**Three pull requests are open.** One is the encounter work described above, which needs hands. One is this briefing. One is a housekeeping report from an earlier automated run.

**A two-day-old tangle cleared this morning** — the housekeeping change that had been stuck since Wednesday is merged.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
