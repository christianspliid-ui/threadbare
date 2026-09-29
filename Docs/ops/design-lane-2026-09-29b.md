---
lane: tb-design-lane
run: 2026-09-29b
promoted: 1
filed: 7
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-29 (run b, ~06:15Z)

## Needs Christian

Nothing needs you. No vetoes were waiting in the briefing.

## Decided for you

- [Journeymen and experts have almost nothing to attempt](https://linear.app/threadbare/issue/THR-1627/journeymen-and-experts-have-almost-nothing-to-attempt-measure-the): **the plan is written, and step one is ready to build.**
  - **Today:** mortals take on challenges they can win about half the time, but only beginners find any. A journeyman standing in a town has 10 everyday encounters that suit them, an expert has 1, and a master has none. So everyone does the same easy things, and "what a mortal attempts grows with them" is not true yet above beginner level.
  - **Step one:** everyday tasks stop getting a hidden discount. Today almost every roll quietly treats a step as easier than its author wrote. So a step that reads *fair* is rolled as if it were gentler than that.
  - **After that:** 36 new everyday encounters, written at journeyman, expert and master level for every Reach, plus two expert-level monsters.

  Plan: [content above novice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-29-thr-1627-content-above-novice.md). Calls made:
  - **The hidden discount goes.** The world gets about nine points harder: success falls from about 71% to about 62%, inside the 50–65% band you set. Weak mortals feel it most. Every failure still leaves a story. The word you read on a step now matches what the dice roll against. Today's setting also misses two of the game's own safety checks on the test worlds, and the new one passes them. It is one number if the world reads as a grind.
  - **The new content is ordinary town life, not more ruins and forts.** The harder encounters that already exist almost never reach anyone. Only 11 of the 62 that suit a journeyman fired in a test world, because they need a fort, a ruin, a guild rank or a war. The new ones happen where mortals actually stand. The higher stakes sit in the story (who is across the table, what is at risk), never in a rule that locks them away.
  - **Enough for each Reach, not a flood.** The target is three journeyman, two expert and one master everyday encounter per Reach. That comes to 36 over six Encounter Factory batches, each with your usual 2-of-6 sample. Each batch first checks whether the last one already did the job, and stops early if so.
  - **Journeymen first.** They are the next-largest group, about a third of all attempts. If two journeyman batches do not change what journeymen attempt, the writing stops and the plan comes back for rethinking before any expert work.
  - **Masters get no monster fight that suits them for now.** The hardest monster rating tops out at expert level. Raising it belongs to a later fight-tuning pass.
  - **You are not asked to review any of this yet.** You will see the new encounters only through the factory's normal 2-of-6 samples.

Say "veto content above novice" to reverse this.

## Work

- **Claimed** [Journeymen and experts have almost nothing to attempt](https://linear.app/threadbare/issue/THR-1627/journeymen-and-experts-have-almost-nothing-to-attempt-measure-the). It is the content half you set aside on 24 September ("we can always create more higher difficulty encounter, monster and undertaking content"). Why this ticket:
  - no map is open;
  - four jobs were ready to build, which is not below the floor;
  - [the spell generator](https://linear.app/threadbare/issue/THR-1572) and [the lead-climb re-plan](https://linear.app/threadbare/issue/THR-1675) both build on lane calls less than a day old, so they wait out the veto window;
  - this ticket's inputs date from 24 and 26 September.
- **Measured on today's `main`.** Five test worlds per setting, four settings of the discount, plus a census of every encounter by level, Reach and where it can happen.
- **Found:**
  - **The ticket had the old discount wrong.** It said 0.20; it is 0.10.
  - **The coverage count read content at the wrong odds.** It banded each encounter at 40% odds, while mortals choose at 50–65%. So it put some content half a level too low. Fixed in step one.
  - **The existing harder content rarely reaches anyone.** It is situational: it needs a fort, a ruin, a guild rank or a war. It stays the living-world plans' job.
- **Gates:**
  - The intent judge **allowed** the plan. It asked for the content tickets to exist before the plan names them, and for a note on two new working words. Both were done before merge.
  - The rules audit and the Vision audit passed with notes.
  - The completeness audit asked for the list of existing systems the plan builds on. That list was added and it passed.
- **Merged** via [PR #2142](https://github.com/christianspliid-ui/threadbare/pull/2142). Step one is Ready for Dev with its coordination block.
- **Filed** seven authoring tickets. Each is Todo, unassigned, with its coordination block, chained so each batch waits for the one before it:
  - [journeyman batch 1](https://linear.app/threadbare/issue/THR-1676);
  - [journeyman batch 2](https://linear.app/threadbare/issue/THR-1677);
  - [expert batch 1](https://linear.app/threadbare/issue/THR-1678);
  - [expert batch 2](https://linear.app/threadbare/issue/THR-1679);
  - [expert batch 3](https://linear.app/threadbare/issue/THR-1680);
  - [master encounters and the last check](https://linear.app/threadbare/issue/THR-1681);
  - [two expert monster elites](https://linear.app/threadbare/issue/THR-1682).

## Escalations

None.
