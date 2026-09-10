# Briefing
**Generated:** 2026-09-10 15:00 local (13:00 UTC) · keep-work-flowing-cc

## The one thing

**Are you still planning to design Traits wave 2 — yes, or not getting to it?** — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

Third hour on this ask, and it now has a clock. The ready shelf dropped again — **five jobs this morning, four an hour ago, three now** — and all three are low-priority leftovers ([THR-1426](https://linear.app/threadbare/issue/THR-1426), [THR-1315](https://linear.app/threadbare/issue/THR-1315), [THR-1424](https://linear.app/threadbare/issue/THR-1424)). At today's pace that is roughly **two to three hours of builder work left**.

New program work comes from a design pass. The design bench holds exactly one job at a time, and that seat is THR-790: In Design, assigned to you, no plan doc, unmoved since **15 August — twenty-six days**. I confirmed it live this run: it is the *only* item on the bench. Seven jobs are waiting to be designed behind it, including [the held-town question you answered this morning](https://linear.app/threadbare/issue/THR-1448), whose prerequisite [finished at 07:44Z](https://linear.app/threadbare/issue/THR-1287).

**One word either way.** *Yes* changes nothing except that the asking stops. *Not getting to it* frees the seat and the design bench starts producing within the hour. (Only the `Parked` label frees it — unassigning does not.)

The work itself, if you want it: location traits going live, artifact traits, and draw-by-trait pools ("gain a random #relic").

## Also waiting (9)

- **[Sample two of the camp six and say if they are worth meeting twice](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)** — not blocking anything; batch 2 shipped 09-09 on your approval. Your standing 2-of-6 rule still owes a verdict, whenever you want to give it. [Ward the Camp](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) · [Tend to Wounds](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds).
- **Six words the game uses that the glossary has never blessed** — oldest has waited 68 days; the rule says only a human can seat one. Say **"delegate it"** (agents seat words, you keep a veto — retires the queue permanently) or **"send me the six"**.
- **[Rule on the backlog](https://linear.app/threadbare/issue/THR-1189)** — ~13 items stop at a question, not a developer. One left the list under its own power this morning: [what a Divine Herald is](https://linear.app/threadbare/issue/THR-1195) shipped. Say *"rule on the backlog"* and the rest come smallest-first, in game terms.
- **[The screenshot sweep wants an attended hour](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)** — nineteen captures, one dev-server session; nothing technical blocks it any more.
- **[The fight map — ten open, every one yours](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — all legwork finished; [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) are the head. Say *"work the fight map"*.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — a session builds the sketch, your reaction is the decision.
- **[Should image spends be gated on you at all?](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** — one answer settles five quarantined images and every batch after.
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — a run's spine from what your god remembers, or from a named campaign the world offers.
- **Are weekend-long quiet spells normal too?** — you ruled overnight quiet normal; weekends are still unruled, so the probe keeps raising a 44.9 h gap.

Detail and links for all nine: [Design/user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Three ready, one in flight — no program work on the shelf, and the one job in flight is still parked on a question that answered itself five hours ago.**

- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) has now been parked for nothing for ~4.8 hours.** It parked at 08:14 UTC asking one yes/no: *wait for [THR-1446](https://linear.app/threadbare/issue/THR-1446) before running batch 3?* — recommendation *yes*. THR-1446 went Done at 09:52 UTC. The wait is over and nothing on this ticket needs you; a session should clear the `Parked` label and pick it up. Flagged last hour and unchanged since.
- **All three ready jobs are Low-priority leftovers.** [THR-1195](https://linear.app/threadbare/issue/THR-1195) merged this morning and left the shelf; nothing replaced it — see the lead ask.
- **[THR-1053](https://linear.app/threadbare/issue/THR-1053) stays off your list.** The `concepts` rule is gate calibration — the agent's call under your 2026-08-12 rule — and a design session will settle it. Two encounters wait on it. Say the word if you want it back.

## Health

- **Tick cost is over the drift line again, and the swing itself is now the story.** The probe's words: *"tick cost 106 ms/tick steady, 27% above the 7-day median (84, 64 rows since 1c725457); top phase agent_decision, 492 agents. Name the merges between 1c725457 and 6a55c3e1: `git log --oneline --merges 1c725457..6a55c3e1`"*. Three consecutive readings have gone **+40% → +14% → +27%** on a median that has barely moved, which reads more like measurement noise on a busy machine than a regression — but three crossings in three hours is worth one session confirming rather than four more lanes re-reporting. Executor's job, not yours.
- **"Heavy simulation tests" is red on the latest main.** The post-merge heavy lane failed on `6a55c3e1` (0 h ago); its last five scheduled runs are four green, one red. A follow-up fix is owed — an impediment row if no session has claimed it. The required CI check (`Test · Typecheck · Build`) is green, so nothing is blocked from merging.
- Everything else green: site serving the latest commit, all 9 scheduled tasks on schedule, no PRs waiting to merge, automated checks running normally, the worktree reaper ran 13 minutes ago.
