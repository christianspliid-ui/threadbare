# Briefing
**Generated:** 2026-10-08 08:00 local (06:00 UTC) · keep-work-flowing-cc

## The one thing

**How does your god get new powers: A or B?** You asked whether powers could be *bought*. The design lane built a prototype and narrowed it to two options. Both give each god its own powers. Today's gifts don't: two very different gods share almost four of their first five powers.

- **A: the world gives, by who you are.** Gifts keep their timing and stay free. Each gift is now drawn to match your god's reaches and spheres. The rulebook line "story moments, not from a menu" stays.
- **B: the world offers, you choose and pay.** Every few days *three omens rise*. You take one up with essence you drew through its sphere, or you let them pass. A run ends with about twice as many powers, so prices will need tuning.
- **The lane leans B.** It is the version of buying that keeps gods distinct.
- **What waits on it:** [how a player's gods grow across runs](https://linear.app/threadbare/issue/THR-1773/how-a-players-gods-grow-across-runs-what-a-second-fifth-and-twentieth).
- **Read:** [the ticket, with every number](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the) · [the prototype write-up](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-god-card-buy-system-prototype.md) · [what B looks like](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-buy-mock/market-mock.html)

Reply **"A"** or **"B"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-08a.md) and the [orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-08b.md)*

## Also waiting (4)

- **Set the Claude app to open when Windows starts.** Only you can change that setting. It closes the hours-long gaps after the computer wakes. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** same shape. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [A buy system for god actions](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the): these calls were settled by the evidence, whichever of A or B you pick.
  - **Your god never pays for a power out of the essence it casts with.** Any price is paid in essence you have *drawn through* that power's sphere. A god that sits on full pools earns nothing to buy with, so casting is what pays for it. Paying from the casting pool would let you buy 22–24 powers on the first turn.
  - **No open shop.** If you could buy any power, a player who plays to win would buy the same five powers in the same order for every god.
  - **Today's gifts are already samey.** Two very different gods share almost four of their first five powers. That changes under either A or B.
  - **24 powers stay gifts no matter what:** the opening, your first signature, the Wellspring, and the powers the world hands you for what happened in it.
  - *The calls to veto:* **"pay from the casting pool"**, **"an open shop"** or **"keep today's gifts as they are"**.

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 12 jobs ready, 1 being built.**

- **New this morning: the first warm playtest filed 9 fixes**, 6 already ready to build. Testers started a few seasons into a world. The two that matter most: [paid nudges ("God's Will") that change nothing](https://linear.app/threadbare/issue/THR-1781/gods-will-takes-the-essence-and-changes-nothing-a-whispers) and [chapter choices that ignore the click](https://linear.app/threadbare/issue/THR-1777/the-players-chapter-choice-does-nothing-an-aftermath-reaction-resolves). [Round report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-1.md). Round 2 runs on its own once they close.
- **Ready, Dominion:** [sphere scores land where Dominion reads them](https://linear.app/threadbare/issue/THR-1768/sphere-scores-never-land-where-dominion-must-read-them-the-god-has-no), [buy your spheres](https://linear.app/threadbare/issue/THR-1749/buy-your-spheres-point-buy-across-the-eight-creation-spheres-at), [keeping mortals no longer bankrupts your god](https://linear.app/threadbare/issue/THR-1747/divine-economy-shared-prerequisites-thread-upkeep-a-god-can-keep-the) and [retune a fresh god's casting odds](https://linear.app/threadbare/issue/THR-1775/the-gods-cast-odds-verdict-thr-766-was-measured-on-the-retired-dice).
- **Oldest in the queue:** [threading as character creation](https://linear.app/threadbare/issue/THR-1644/threading-as-character-creation-every-thread-plays-a-ceremony-the), ready 11 days. It sits behind higher-priority work. It isn't blocked.
- **Being built:** [warm playtest](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a). Its first round ran this morning. No unsaved work exists for it in any branch or local work folder.

## Health

- **Heavy simulation tests read red, but it's a flaky test, not broken code.** The check still says *"\"Heavy simulation tests\" has been failing on main for 36 hours and nobody has picked it up — the code on main has a problem the merge gate does not check."* The [retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) found the same code passed on Wednesday's nightly run. [THR-1776](https://linear.app/threadbare/issue/THR-1776/the-main-red-probe-ignores-a-green-re-run-of-the-same-commit-the) fixes the check. Builder's job, not yours.
- **Lane silence, explained:** *"The scheduled lanes went silent for 31.8h (2026-10-06T20:56:43.000Z → 2026-10-08T04:42:41.000Z) and have since resumed, with no pause marker covering that window."* The power log shows the computer was asleep the whole time, so this is already answered.
- **Simulation speed is back to normal:** 120 ms per tick, matching the weekly median. Last hour's spike came from catch-up runs sharing the machine, as suspected.
- Everything else is green. The live site serves the latest game build, no pull requests are stuck, Actions are healthy, the worktree cleaner ran this hour, and every scheduled lane is on schedule.
