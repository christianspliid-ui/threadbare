# Briefing
**Generated:** 2026-09-10 14:00 local (12:00 UTC) · keep-work-flowing-cc

## The one thing

**Are you still planning to design Traits wave 2 — yes or not getting to it?** — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

Same ask as last hour, and the case for it got slightly stronger: the ready shelf went from five jobs to **four**, and all four are still low-priority leftovers. No new *program* work is on it.

New program work is made by a design pass. The design tier holds exactly one job at a time, and that slot is THR-790: In Design, assigned to you, no plan doc, untouched since **15 August**. For nine hours running the orchestrator has been unable to queue a single new design job, and this is the only reason.

**One word either way.** *Yes* changes nothing except that the asking stops. *Not getting to it* frees the slot and the design tier starts producing again. (Only the `Parked` label frees it — unassigning does not.)

The work itself, if you want it: location traits going live, artifact traits, and draw-by-trait pools ("gain a random #relic").

## Also waiting (9)

- **[Sample two of the camp six and say if they are worth meeting twice](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)** — **correction to last hour's brief: this is no longer blocking anything.** Batch 2 shipped last night; the encounter line has moved on to batch 3. Your standing 2-of-6 rule still owes a verdict on the six that shipped, whenever you want to give it. [Ward the Camp](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) · [Tend to Wounds](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds).
- **Six words the game uses that the glossary has never blessed** — oldest has waited 67 days; the rule says only you can seat one. Say **"delegate it"** and agents seat words with you keeping a veto — that retires the queue permanently. Say **"send me the six"** and they come as a batch.
- **[Rule on the backlog](https://linear.app/threadbare/issue/THR-1195)** — ~14 items stop at a question, not a developer. Say *"rule on the backlog"* and they come smallest-first, in game terms.
- **[The screenshot sweep wants an attended hour](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)** — nineteen captures, one dev-server session; nothing technical blocks it any more.
- **[The fight map — ten open, every one yours](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — all legwork finished; [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) are the head. Say *"work the fight map"*.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — a session builds the sketch, your reaction is the decision.
- **[Should image spends be gated on you at all?](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** — one answer settles five quarantined images and every batch after.
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — a run's spine from what your god remembers, or from a named campaign the world offers.
- **Are weekend-long quiet spells normal too?** — you ruled overnight quiet normal; weekends are still unruled, so the probe keeps raising a 44.9 h gap.

Detail and links for all nine: [Design/user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Four ready, one in flight — no program work on the shelf, and the one job in flight is parked on a question that has already answered itself.**

- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) is parked for nothing, and a session should unpark it.** It parked at 08:14 UTC asking one yes/no: *wait for [THR-1446](https://linear.app/threadbare/issue/THR-1446) before running batch 3?* — recommendation *yes*. **THR-1446 went Done at 09:52 UTC.** The wait is over, the recommendation is satisfied by events, and nothing on this ticket needs you. It has been sitting in a park with no live question for ~2 hours. *(This is why last hour's second ask was mis-framed as blocking — corrected above.)*
- **All four ready jobs are Low-priority leftovers** ([THR-1426](https://linear.app/threadbare/issue/THR-1426), [THR-1315](https://linear.app/threadbare/issue/THR-1315), [THR-1424](https://linear.app/threadbare/issue/THR-1424), [THR-1195](https://linear.app/threadbare/issue/THR-1195)). THR-1114 merged this morning and left the shelf; nothing replaced it — see the lead ask.
- **[THR-1053](https://linear.app/threadbare/issue/THR-1053) stays off your list, and the orchestrator still disagrees.** Its hourly report re-raised the `concepts` rule as needing your ruling for the seventh hour. The decline holds: the rulebook and the code disagree about whether a field is required, the code is the authority, and that is gate calibration — the agent's call under your 2026-08-12 rule. Two encounters wait on it and a design session will settle it. Say the word if you want it back.

## Health

- **Last hour's tick-cost alarm did not reproduce — treat it as noise.** The probe now reads *"tick cost 95 ms/tick steady, +14% vs the 7-day median (83, 63 rows)"*, comfortably inside the 25% drift line. The 40% spike an hour ago and the 8% dip before that were the same swing in both directions. No regression, nothing owed.
- **Heavy simulation tests are green again on the latest main.** Last hour's red has cleared on its own; nothing is owed there either.
- **Three overnight quiet gaps (18.6 h, 18.1 h, 10 h) recovered on their own** and are declined under your 2026-08-08 ruling that overnight quiet is normal. Noted for visibility only; the unruled weekend gap is the standing ask above.
- Everything else green: live site serving the latest commit ([12464dfe](https://github.com/christianspliid-ui/threadbare/commit/12464dfe)), CI green on main, no PRs waiting to merge, all 9 scheduled tasks on time, worktree reaper ran 13:40 local.
