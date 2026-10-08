# Briefing
**Generated:** 2026-10-08 10:00 local (08:00 UTC) · keep-work-flowing-cc

## The one thing

**The builder is still frozen on a yes/no box in the Claude app. Please click "Allow".** Nothing has been built for almost three hours because of it.

- **Where:** in the Claude app, open the session called **"Tb opus pickup"**. It started at 06:41 your time and has waited since 07:21 for you to approve one step.
- **What it is asking:** to update the daily playtest lane's instructions, so it can also start *warm* playtest rounds (testers who arrive a few seasons into a world). That is the last step of [the warm playtest job](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a). It is safe to allow.
- **Why it matters:** while that box is open, the builder cannot start another run. **13 jobs are ready and none can move**, including the two worst warm-playtest bugs ([God's Will does nothing](https://linear.app/threadbare/issue/THR-1781/gods-will-takes-the-essence-and-changes-nothing-a-whispers), [chapter choices ignore the click](https://linear.app/threadbare/issue/THR-1777/the-players-chapter-choice-does-nothing-an-aftermath-reaction-resolves)).
- If you would rather it didn't make that change, click **"Deny"**. Either answer unfreezes it.

## Also waiting (5)

- **How does your god get new powers: A or B?** A: the world gives, matched to your god. B: three omens rise every few days and you pay to take one. The lane leans B. [Ticket](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the) · [write-up](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-god-card-buy-system-prototype.md) · [what B looks like](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-buy-mock/market-mock.html). Reply "A" or "B".
- **Set the Claude app to open when Windows starts.** Only you can change that setting. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** same shape. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Every run's doom is Breach](https://linear.app/threadbare/issue/THR-1774/every-runs-doom-is-breach-six-of-the-seven-authored-doom-archetypes) — the other six written dooms finally run. Each new world draws its doom at even odds, your god's nature does not choose it, and the doom is named to you when it wakes (*"…The Age of the Reckoning has begun."*). The doom bar's symbol will match what the doom really presses. Your review view stays on Breach. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-08-thr-1774-doom-archetype-draw.md). Building waits until 08:41 Friday your time. *Calls to veto:* **"the doom should match the god"**, **"let me pick the doom"**, **"keep every world on Breach"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-08b.md)*
- [A buy system for god actions](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the) — settled whichever of A or B you pick: a power is never paid for from the essence your god casts with; there is no open shop; today's samey gifts change either way; 24 powers stay gifts. *Calls to veto:* **"pay from the casting pool"**, **"an open shop"**, **"keep today's gifts as they are"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-08a.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy, but stalled: 13 jobs ready, 1 being built, nothing moving until the box above is answered.**

- **Top of the queue (high priority):** the two warm-playtest bugs above, then [sphere scores land where Dominion reads them](https://linear.app/threadbare/issue/THR-1768/sphere-scores-never-land-where-dominion-must-read-them-the-god-has-no), [buy your spheres](https://linear.app/threadbare/issue/THR-1749/buy-your-spheres-point-buy-across-the-eight-creation-spheres-at) and [keeping mortals no longer bankrupts your god](https://linear.app/threadbare/issue/THR-1747/divine-economy-shared-prerequisites-thread-upkeep-a-god-can-keep-the).
- **Doom draw:** [every run's doom is Breach](https://linear.app/threadbare/issue/THR-1774/every-runs-doom-is-breach-six-of-the-seven-authored-doom-archetypes) is in the queue, claimable from Friday morning.
- **Oldest in the queue:** [threading as character creation](https://linear.app/threadbare/issue/THR-1644/threading-as-character-creation-every-thread-plays-a-ceremony-the), ready 11 days, behind higher-priority work, not blocked.
- **Being built:** [warm playtest](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a), held by the frozen run above. Its work is sitting uncommitted in local worktree `determined-margulis-d41841` (one file), idle ~160 min — the run is still alive, so it saves once the box is answered.

## Health

- **Builder lane stalled:** *"tb-opus-pickup has not run since 2026-10-08T04:41:50.212Z — 3+ hourly slots behind, while keep-work-flowing-cc kept firing. The lane is stalled, not idle."* Cause: its run has waited on an approval prompt since 05:21 UTC (the ask above).
- **Worktree cleaner guard:** the frozen run's uncommitted file passes the cleaner's 180-minute idle guard at about 08:20 UTC. If the cleaner removes it, the next builder run recovers it — builder's job, not yours.
- **Heavy simulation tests still read red, but it's a flaky test, not broken code.** The same commit passed on Wednesday's nightly run; [THR-1776](https://linear.app/threadbare/issue/THR-1776/the-main-red-probe-ignores-a-green-re-run-of-the-same-commit-the) fixes the check. Builder's job, not yours.
- **The 6–8 October lane silence is explained:** the computer was asleep the whole time.
- Everything else is green: the live site is current, no pull requests are stuck, Actions are healthy, the worktree cleaner ran, simulation speed is normal (125 ms per tick, 4% over the weekly median).
