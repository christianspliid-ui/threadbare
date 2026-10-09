# Briefing
**Generated:** 2026-10-09 13:58 local (11:58 UTC) · keep-work-flowing-cc

## The one thing

**How does your god get new powers: A or B?** This answer unblocks the most work.

- **A: the world gives, by who you are.** Gifts stay free and keep their timing. Each one is drawn to match your god's reaches and spheres.
- **B: the world offers, you choose and pay.** Every few days three omens rise. You take one up with essence drawn through its sphere, or let them pass. The design lane leans B.

[Ticket](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the) · [write-up](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-god-card-buy-system-prototype.md) · [what B looks like](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-buy-mock/market-mock.html). [How gods grow across runs](https://linear.app/threadbare/issue/THR-1773/how-a-players-gods-grow-across-runs-what-a-second-fifth-and-twentieth) waits on it. Reply "A" or "B". *— also from the [orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-09d.md)*

## Also waiting (4)

- **Set the Claude app to open when Windows starts.** Only you can change that setting. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [What the band buys](https://linear.app/threadbare/issue/THR-1761/what-the-band-buys-cost-effect-strength-thread-yield-and-source-income) — what your turf is worth in play. Home turf is a bonus, never a requirement: neutral ground costs and pays as today. On your own ground cards cost up to a quarter less, casts land more often, and your mortals and wellsprings pay up to half again. On hostile ground cards cost half again as much, casts land less often, and a wellspring there pays nothing. A threaded mortal now earns more than it costs to keep. *To veto, say:* **"a wellspring should only pay on ground I hold"** or **"turf should change the size of what I do, not just the odds"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09b.md)*
- [The formula settled](https://linear.app/threadbare/issue/THR-1760/the-formula-settled-normalisation-the-gods-power-factor-and-the-five) — how much of the world is your god's turf. No world starts hostile: every god opens with a home turf, some places Touched, a few Held. Hostile ground arrives during the run as enemies press opposing spheres. Sovereign is never given; you earn it. A stronger god holds more ground, and growing stronger never makes enemy ground cost more. *To veto, say:* **"the world should be able to start against you"** or **"a stronger god should feel enemies push back harder"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09a.md)*
- [Outcomes still can't be read](https://linear.app/threadbare/issue/THR-1784/recurs-after-fix-twice-outcomes-still-cant-be-read-six-identical-bond) — an ending shows one named reputation row per mortal instead of six identical "World Standing" rows; the ▲ scale gets a legend; a chapter step shows one odds word; Star's "Fated" becomes "Charted"; your god's seat always lands in a town, with a "Seat: <town>" jump. Building waits until 20:25 Friday. *To veto, say:* **"keep the word standing"**, **"let me choose where the seat goes"** or **"keep Fated for Star"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-08d.md)*
- [A returning player is greeted by the opening again](https://linear.app/threadbare/issue/THR-1782/a-returning-player-is-greeted-by-the-opening-again-after-the-warm-up) — a warm world arrives with the opening already played; only "A Path Opens" waits for you. Building waits until 14:45 Friday. *To veto, say:* **"let warm testers play the opening gifts"** or **"give returning players a while-you-were-away screen"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-08c.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 7 jobs ready, 1 being built.** Nothing in the ready queue is older than 3 days or blocked.

- **Elder magic gets a ruin-discovery path** ([THR-1753](https://linear.app/threadbare/issue/THR-1753/foundation-signed-cards-lose-their-only-identity-route-once-spheres)) is being built; the builder touched it at 13:52. Not yours.
- **God's Will now does something** ([THR-1781](https://linear.app/threadbare/issue/THR-1781/gods-will-takes-the-essence-and-changes-nothing-a-whispers)): the fix merged in [#2273](https://github.com/christianspliid-ui/threadbare/pull/2273) and is live. No pull requests are waiting.

## Health

- **Heavy simulation tests went red again on main** ([run on the latest main](https://github.com/christianspliid-ui/threadbare/actions/runs/37924278689)). The same commit before it passed once and failed once, so this looks flaky rather than a new break. The builder lane owns the follow-up. Not yours.
- The 6–8 October lane silence is still flagged by the silence check, but it is already explained (the computer was asleep), so it is not an ask.
- Everything else is green. The live site serves the latest main (de881c96), all 11 lanes are on schedule, the worktree cleaner last ran at 13:40, and the simulation runs at normal speed (126 ms/tick, +2% on the weekly median).
