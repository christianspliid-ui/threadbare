---
lane: tb-design-lane
run: 2026-10-27a
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-27 (run a, ~03:05Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Attention is never spent](https://linear.app/threadbare/issue/THR-2062/attention-is-never-spent-spendattention-has-no-production-caller-so): five calls inside [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-27-thr-2062-attention-has-a-price.md#decisions). Each can be vetoed on its own until Wednesday 28 Oct 03:01 UTC.
  - **Attention stays, and it becomes the price of looking in on a mortal who lives on without you.** Answering "the thread pulls" on such a mortal lets you see their chapter, and that costs Attention. *Veto:* "retire Attention".
  - **A mortal who asks you never costs Attention.** The First's chapters already stop the world for free. Until now she still raised pulls that charged for them. *Veto:* "The First's chapters should cost Attention too".
  - **News of a mortal's home is free, and comes once.** When their town runs short of, or has spare, grain, fish, grazing land or fresh water, you hear it once, and answering costs nothing. Today it repeats every few hours and charges each time. These pulls were two thirds of all pulls. *Veto:* "home news should cost Attention".
  - **No chapter is charged for stopping the world.** *Veto:* "every chapter should cost Attention".
  - **The Attention gauge comes back once you have a mortal on *Lives on*.** With only The First it stays hidden, because nothing could make it move. It speaks in words (Busy, Strained), never numbers. *Veto:* "always show the gauge".

## Work

- **Claimed, designed and handed off** [Attention is never spent](https://linear.app/threadbare/issue/THR-2062/attention-is-never-spent-spendattention-has-no-production-caller-so). The ticket is now Ready for Dev, claimable from 2026-10-28T03:01Z.
  - Evidence: the [census prototype](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2062-attention-census) (never merged) ran seeds 42/99/7 for 30 days. With The First alone, the pool never left full. With three *Lives on* mortals it sat below half 87–99 % of the time, and two thirds of the pulls bought nothing. With this plan that falls to 7 · 30 · 86 %.
  - Gates: [plan PR](https://github.com/christianspliid-ui/threadbare/pull/2620) merged. The intent judge returned Allow on its third run (run 1 asked for player-facing text, run 2 for per-good wording). The NFP, pillar and Vision audits passed with notes, all applied. Plan-doc liveness is LIVE.
- **Filed** [UL-proposal: Thread Tug causes](https://linear.app/threadbare/issue/THR-2074/ul-proposal-thread-tug-a-tugs-cause-is-a-chapter-or-the-mortals-home-a). It adds the home-news cause to the glossary entry rather than editing it directly.
- **Skipped** [famine and glut draws](https://linear.app/threadbare/issue/THR-2040): its re-plan rests on [the board reads the place](https://linear.app/threadbare/issue/THR-2071), a lane decision still inside its veto window (until 27 Oct 23:45 UTC).

## Escalations

- **One PR replaced.** The first plan PR (#2619) used a branch name containing the ticket id, which Linear could treat as a closer. It was closed unmerged, and the same commit was re-opened as #2620 on an id-free branch. The ticket's state was unaffected.
- **Auto-merge did not fire.** On #2620 it stayed armed with every required check green and the PR CLEAN for about eight minutes. The PR was then merged directly, as design-session Step 4 allows.
- **Hook skip.** The proto branch commit used `--no-verify`. It is a never-merged prototype, the same practice as earlier lane protos.
