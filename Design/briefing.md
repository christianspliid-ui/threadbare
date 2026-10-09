# Briefing
**Generated:** 2026-10-09 15:57 local (13:57 UTC) · keep-work-flowing-cc

## The one thing

**How does your god get new powers: A or B?** This answer unblocks the most work.

- **A: the world gives, by who you are.** Gifts stay free and keep their timing. Each one is drawn to match your god's reaches and spheres.
- **B: the world offers, you choose and pay.** Every few days three omens rise. You take one up with essence drawn through its sphere, or let them pass. The design lane leans B.

[Ticket](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the) · [write-up](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-god-card-buy-system-prototype.md) · [what B looks like](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-buy-mock/market-mock.html). [How gods grow across runs](https://linear.app/threadbare/issue/THR-1773/how-a-players-gods-grow-across-runs-what-a-second-fifth-and-twentieth) waits on it. Reply "A" or "B". *— also from the [orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-09e.md)*

## Also waiting (4)

- **Set the Claude app to open when Windows starts.** Only you can change that setting. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [How the frontier moves](https://linear.app/threadbare/issue/THR-1762/how-the-frontier-moves-which-verbs-push-dominion-outward-what-they) — how your god's turf grows. You take ground in two moves: **Shift Dominion** breaks a place's resistance, then **Claim Dominion** tends it as a hold you keep paying for. With steady attention a place becomes Touched in about 5 days, Held in about 2 weeks and Sovereign in about 6 weeks, faster as your god grows stronger. Your seat tends itself for free; threaded mortals slowly spread your spheres where they stand. *To veto, say:* **"turf should spread on its own around what I hold"**, **"taking a place should be quicker than six weeks"** or **"my mortals shouldn't spread my turf until they're truly mine"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09c.md)*
- [What the band buys](https://linear.app/threadbare/issue/THR-1761/what-the-band-buys-cost-effect-strength-thread-yield-and-source-income) — what your turf is worth in play. Home turf is a bonus, never a requirement: neutral ground costs and pays as today. On your own ground cards cost up to a quarter less, casts land more often, and your mortals and wellsprings pay up to half again. On hostile ground cards cost half again as much, casts land less often, and a wellspring there pays nothing. *To veto, say:* **"a wellspring should only pay on ground I hold"** or **"turf should change the size of what I do, not just the odds"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09b.md)*
- [The formula settled](https://linear.app/threadbare/issue/THR-1760/the-formula-settled-normalisation-the-gods-power-factor-and-the-five) — how much of the world is your god's turf. No world starts hostile: every god opens with a home turf, some places Touched, a few Held. Hostile ground arrives during the run. Sovereign is never given; you earn it. *To veto, say:* **"the world should be able to start against you"** or **"a stronger god should feel enemies push back harder"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-09a.md)*
- [Outcomes still can't be read](https://linear.app/threadbare/issue/THR-1784/recurs-after-fix-twice-outcomes-still-cant-be-read-six-identical-bond) — an ending shows one named reputation row per mortal instead of six identical "World Standing" rows; the ▲ scale gets a legend; Star's "Fated" becomes "Charted"; your god's seat always lands in a town. *To veto, say:* **"keep the word standing"**, **"let me choose where the seat goes"** or **"keep Fated for Star"**. *— from the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-08d.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 7 jobs ready, 1 being built.** Nothing in the ready queue is older than 3 days or blocked. The orchestrator promoted two warm-playtest fixes this hour ([THR-1786](https://linear.app/threadbare/issue/THR-1786/a-bonded-first-is-asked-to-reach-down-again-beat-0-should-settle-as), [THR-1788](https://linear.app/threadbare/issue/THR-1788/the-firsts-story-moments-are-footed-beat-1-call-an-internal-index-that)).

- **"Return to the world" bounces back** ([THR-1778](https://linear.app/threadbare/issue/THR-1778/return-to-the-world-bounces-back-closing-an-aftermath-resolves-only)) is being built; its branch is pushed and its worktree was touched at 15:51. Not yours.
- **Every world now draws its doom from all seven archetypes** ([THR-1774](https://linear.app/threadbare/issue/THR-1774/every-runs-doom-is-breach-six-of-the-seven-authored-doom-archetypes)) merged in [#2284](https://github.com/christianspliid-ui/threadbare/pull/2284) and is live. No pull requests are waiting.

## Health

- **Heavy simulation tests have failed on the last three main runs** ([latest failure, 30b072e2](https://github.com/christianspliid-ui/threadbare/actions/runs/37931222964)); a run on the new head (b72c3c1d) is in progress. Already in the impediment log; the builder lane owns the fix. Not yours.
- **Simulation speed:** tick cost 228 ms/tick steady, 83% above the 7-day median (124, 134 rows since 7d53560b); top phase agent_decision, 609 agents. Name the merges between 7d53560b and b72c3c1d: git log --oneline --merges 7d53560b..b72c3c1d. *One hour earlier it was 108 ms/tick, and warm-up tripled too (380 vs 94 ms), so machine load from a concurrent build is a likely cause; next hour's row will tell. Builder's job, not yours.*
- The 6–8 October lane silence is still flagged by the silence check, but it is already explained (the computer was asleep), so it is not an ask.
- Everything else is green. The live site serves the latest main (b72c3c1d), all 11 lanes are on schedule, and the worktree cleaner last ran at 15:40.
