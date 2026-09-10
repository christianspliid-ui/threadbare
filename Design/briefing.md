# Briefing
**Generated:** 2026-09-10 11:57 local (09:57 UTC) · keep-work-flowing-cc

## The one thing

**Sample two encounters from batch 2 and say whether they are worth meeting twice** — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

The camp six are live on the deployed build. Your rule samples two of every six; this pair is the widest tonal gap in the batch:

- [**Ward the Camp**](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) — thinnest start; its hand forces the game's second omen emitter.
- [**Tend to Wounds**](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds) — warmest tone; a possession and a piece of knowledge come out the other side.

**The caveat that sat under this ask an hour ago is gone.** Batch 3 — one encounter, [Leave a Shrine Offering](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-10-retrofit-batch-3-brief.md) — was dealt two kinds of consequence the game could not actually build, and its brief asked whether to wait a day for a fix or ship a compromise. **The fix landed at 11:52 and is already on the live site** ([THR-1446](https://linear.app/threadbare/issue/THR-1446), [PR #1875](https://github.com/christianspliid-ui/threadbare/pull/1875)): it adds exactly the two missing pieces — a way for an encounter to name *your god* and a way to name *the place the scene happens at*. So batch 3 can now be built honestly, with the hand it was dealt and no compromise.

Which leaves only your word. **Yes releases batch 3.** Anything short of yes is feedback the line can act on. [Batch report](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/batch-report-2026-09-09.md).

## Also waiting (8)

- **[Rule on the backlog](https://linear.app/threadbare/issue/THR-1195)** — ~14 items stop at a question, not a developer. Say *"rule on the backlog"* and they come smallest-first, in game terms.
- **[The screenshot sweep wants an attended hour](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)** — nineteen captures, one dev-server session; nothing technical blocks it any more.
- **[The fight map — ten open, every one yours](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — all legwork finished; [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) are the head. Say *"work the fight map"*.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — a session builds the sketch, your reaction is the decision.
- **[Should image spends be gated on you at all?](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** — one answer settles five quarantined images and every batch after.
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — a run's spine from what your god remembers, or from a named campaign the world offers.
- **[Are you still planning to design Traits wave 2?](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)** — one word; it is the only design slot in use, so *not getting to it* frees the queue.
- **Are weekend-long quiet spells normal too?** — you ruled overnight quiet normal; weekends are still unruled, so the probe keeps raising a 44.9h gap.

Detail and links for all eight: [Design/user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Healthy — 6 ready, 1 in flight.** Nothing on the ready shelf is blocked.

- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) is parked on the ask above** and is the only issue in flight. Parked since 08:14 UTC (~1.7 h) — correctly, since it is waiting on you.
- **[THR-1450](https://linear.app/threadbare/issue/THR-1450) is the top of the ready shelf** (Medium, a real bug: harvesting a location banks no wealth in any live run). The other five are Low.
- **[THR-1053](https://linear.app/threadbare/issue/THR-1053) is not on your list, and the orchestrator disagrees.** Its hourly report re-raised the `concepts` rule as needing your ruling. It stays declined here: the rulebook and the code disagree about whether a field is required, and the code is the authority — that is gate calibration, the agent's call under your 2026-08-12 rule. A design session will settle it. Two encounters wait on it. Say the word if you want it back.

## Health

- **Heavy simulation tests are red on main** and have been for ~5 h — the non-required post-merge suite, so nothing is blocked and no PR is held. A follow-up fix is owed by a session, not by you.
- **Two overnight quiet gaps (18.6 h, 18.1 h) recovered on their own** and are declined under your 2026-08-08 ruling that overnight quiet is normal. Noted for visibility only; the unruled weekend gap is the standing ask above.
- Everything else green: live site serving the latest commit, CI green on main, no PRs waiting, all 9 scheduled tasks on time, worktree reaper ran 11:40.
- **Tick cost 76 ms/tick steady, 8% *below* the 7-day median** (83 ms, 61 rows). The engine got faster, not slower.
