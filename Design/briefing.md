# Briefing
**Generated:** 2026-09-10 16:00 local (14:00 UTC) · keep-work-flowing-cc

## The one thing

**Are you still planning to design Traits wave 2 — yes, or not getting to it?** — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

Fourth hour on this ask, and the shelf kept falling while it waited: **five jobs this morning, four, three, now two** — [THR-1426](https://linear.app/threadbare/issue/THR-1426) and [THR-1424](https://linear.app/threadbare/issue/THR-1424), both low-priority leftovers about how the game should word a number on screen. That is **roughly an hour or two of builder work**, and the builder's slot is empty right now.

New program work comes from a design pass. The design bench holds exactly one job at a time, and that seat is THR-790: In Design, assigned to you, no plan doc, unmoved since **15 August — twenty-six days**. Confirmed live again this run: still the only item on the bench, seven jobs queued behind it.

**One word either way.** *Yes* changes nothing except that the asking stops. *Not getting to it* frees the seat and the design bench starts producing within the hour. (Only the `Parked` label frees it — unassigning does not.)

The work itself, if you want it: location traits going live, artifact traits, and draw-by-trait pools ("gain a random #relic").

## Also waiting (9)

- **[Sample two of the camp six and say if they are worth meeting twice](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)** — not blocking anything; batch 2 shipped 09-09 on your approval. Your standing 2-of-6 rule still owes a verdict, whenever you want to give it. [Ward the Camp](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) · [Tend to Wounds](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds).
- **Six words the game uses that the glossary has never blessed** — oldest has waited 68 days; the rule says only a human can seat one. Say **"delegate it"** (agents seat words, you keep a veto — retires the queue permanently) or **"send me the six"**.
- **[Rule on the backlog](https://linear.app/threadbare/issue/THR-1189)** — now ~12 items that stop at a question rather than a developer. **Two left the list under their own power today** — [what a Divine Herald is](https://linear.app/threadbare/issue/THR-1195) and [whether a mid-game codex page should exist](https://linear.app/threadbare/issue/THR-1315) — both ruled by a session and shipped. Say *"rule on the backlog"* and the rest come smallest-first, in game terms.
- **[The screenshot sweep wants an attended hour](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)** — nineteen captures, one dev-server session; nothing technical blocks it any more.
- **[The fight map — ten open, every one yours](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — all legwork finished; [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) are the head. Say *"work the fight map"*.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — a session builds the sketch, your reaction is the decision.
- **[Should image spends be gated on you at all?](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** — one answer settles five quarantined images and every batch after.
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — a run's spine from what your god remembers, or from a named campaign the world offers.
- **Are weekend-long quiet spells normal too?** — you ruled overnight quiet normal; weekends are still unruled, so the probe keeps raising a 44.9 h gap.

Detail and links for all nine: [Design/user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Two ready, none in flight, and the one real piece of work today is sitting where the queue cannot see it.**

- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) has now been parked for nothing for ~6 hours.** It parked at 08:14 UTC asking one yes/no; the thing it was waiting for ([THR-1446](https://linear.app/threadbare/issue/THR-1446)) finished at 09:52 UTC, and both possible answers now lead to the same step — run batch 3. Nothing on it needs you. But it sits `In Dev` + `Parked` + unassigned, and the pickup lane only looks at `Ready for Dev`, so **no scheduled lane can reach it**; the daily grooming pass frees it tomorrow morning, or an attended session in a minute. Flagged for the third hour running.
- **Both ready jobs are Low-priority leftovers** — how the game should word tick timestamps and two on-screen percentages. [THR-1315](https://linear.app/threadbare/issue/THR-1315) merged at 13:27 UTC and left the shelf; nothing replaced it. See the lead ask.
- **[THR-1053](https://linear.app/threadbare/issue/THR-1053) stays off your list.** Gate calibration, the agent's call under your 2026-08-12 rule; two encounters wait on it. Say the word if you want it back.

## Health

- **Tick cost crossed the drift line for the fourth hour running, and the readings are now swinging too widely to be a clean signal.** The probe's words: *"tick cost 117 ms/tick steady, 39% above the 7-day median (84, 65 rows since 1c725457); top phase agent_decision, 492 agents. Name the merges between 1c725457 and 201d8a21: `git log --oneline --merges 1c725457..201d8a21`"*. Four consecutive readings: **+40% → +14% → +27% → +39%**, on a median that has barely moved. That pattern reads more like a busy machine than a regression, but four crossings in four hours deserves one session either finding the cause or recalibrating the probe — rather than every lane re-reporting it. Executor's job, not yours.
- **"Heavy simulation tests" has gone green again** — last hour's red on `6a55c3e1` did not repeat; the latest main is clean on every post-merge check.
- Everything else green: site serving the latest commit (`201d8a21`), all 9 scheduled tasks on schedule, no PRs waiting to merge, automated checks running normally, the worktree reaper ran 16 minutes ago.
