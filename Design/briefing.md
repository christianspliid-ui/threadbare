# Briefing
**Generated:** 2026-09-11 09:00 local (07:00 UTC) · keep-work-flowing-cc

## The one thing

**One sentence starts the first design work in four weeks: [a held town is a faction position](https://linear.app/threadbare/issue/THR-1448). Say *"work the held-town design"*.**

This is the second half of your own sentence from yesterday. You were asked whether a claimed town is a commitment or a possession, and said *"it is a commitment and probably also a faction position? it could open up specific encounters within that faction and influence what undertakings are prioritized."*

**The first half is built and merged** — a hold is now kept by working it. The second half is the interesting one: when a mortal keeps a town, the faction starts treating them as **its** town-keeper — sending them work it would not send a stranger, and bending what that mortal chooses to do next toward the town and the faction that cares about it.

It needs a design pass before any code, and **the design desk is free for the first time in about four weeks** — your approval this morning is what freed it. Nothing is being asked of you except to open a session when you have an hour; it is already staged with the questions it has to answer and the reading it should start from. — *from tb-orchestrator, [run 2026-09-11d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11d.md#needs-christian)*

## Also waiting (2)

- [**THR-1133**](https://linear.app/threadbare/issue/THR-1133) — nineteen owed screen captures across nine shipped UI changes; wants one attended dev-server hour, and nothing technical blocks it.
- [**THR-1130**](https://linear.app/threadbare/issue/THR-1130) — sample two of the camp six ([Ward the Camp](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) · [Tend to Wounds](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds)); your standing 2-of-6 verdict, blocking nothing.

## From Christian

**"all recommendations accepted"** (Discord, 08:00 local) — and in the attended session that followed, *"you are approved to unblock everything here. none of it seems dangerous or problematic or requires an important verdict from me."*

**Eleven of the thirteen standing asks closed on that.** What was decided under it, all with your veto still open:

- [**Traits wave 2**](https://linear.app/threadbare/issue/THR-790) let go of the design desk after 27 days — its place, notes and priority kept.
- [**Realm**](https://linear.app/threadbare/issue/THR-1453) is the headword; *nation* is the alias. The entry lands with the realm code it names, inside [THR-1155](https://linear.app/threadbare/issue/THR-1155).
- **Glossary seating is delegated to agents.** Six more words land in one pass ([THR-1457](https://linear.app/threadbare/issue/THR-1457)) — *hold*, *cast*, *Forecast tier*, *Agreement*, *Motive gate*, *Composition Contract*, *Motive Receipt*.
- [**A run's spine is what your god remembers**](https://linear.app/threadbare/issue/THR-1198) — named campaigns declined; the milestone prose gets written for the twelve hungers instead.
- [**The three words are Done**](https://linear.app/threadbare/issue/THR-1380), the [encounter quality rule](https://linear.app/threadbare/issue/THR-1053) is in the build queue, [image spend](https://linear.app/threadbare/issue/THR-876) inside a ticket's stated batch no longer asks you, and the [fight](https://linear.app/threadbare/issue/THR-1258), [powers](https://linear.app/threadbare/issue/THR-1226) and [items](https://linear.app/threadbare/issue/THR-1227) maps are now the design sessions' to settle.
- **Weekend quiet is ruled normal**, extending your overnight ruling.

All of it is written into [`Docs/canon/process.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) so no lane asks you again. Two skill files still carry the old wording — [THR-1458](https://linear.app/threadbare/issue/THR-1458) finishes that sweep.

## Queue

**Healthy at 9 ready, and every one of them claimable** — no parked item is left on the board for the first time in days. Top: [THR-1456](https://linear.app/threadbare/issue/THR-1456) (High, a monster raid corrupting a town's prosperity and defense) · [THR-1130](https://linear.app/threadbare/issue/THR-1130) (High) · four Medium · three Low.

- **[THR-1155](https://linear.app/threadbare/issue/THR-1155) is the only live build**, and slice 3's second half merged at 08:25 ([PR #1895](https://github.com/christianspliid-ui/threadbare/pull/1895)) — the court a mortal can climb. What remains is the *takes / loses* chronicle line and the registry/canon/wiki/UL rows, where the **Realm** entry lands.
- **The two stuck tickets from yesterday are both unstuck.** [THR-1130](https://linear.app/threadbare/issue/THR-1130)'s discharged park was cleared and it is back in the queue; [THR-1380](https://linear.app/threadbare/issue/THR-1380) is **Done**.
- **[THR-1454](https://linear.app/threadbare/issue/THR-1454) (realm content — court summons, border levy, tithe) unblocks with that merge.** The orchestrator held it because its substrate sat on an open PR; that PR is now on `main`, so the next run at 09:26 promotes it. No action.

## Health

Deploy is serving the latest `main` ([1ed92064](https://github.com/christianspliid-ui/threadbare/commit/1ed92064)), CI and all three scheduled jobs green, no PRs waiting, all nine scheduled tasks on time, the worktree reaper ran 17 minutes ago. Two non-green signals, neither yours:

- **Engine tick cost has drifted past tolerance** — the executor's to look at, not a decision for you: *"tick cost 122 ms/tick steady, 40% above the 7-day median (87, 77 rows since 7fd33ed7); top phase agent_decision, 493 agents. Name the merges between 7fd33ed7 and 1ed92064: `git log --oneline --merges 7fd33ed7..1ed92064`"* — worth noting that this window covers the whole realms build, which added simulated nations to a world that only drew them before.
- **Lane silence: an 18.6 h gap (07–08 Sep), overnight-shaped** — declined under your overnight ruling, noted for visibility only. The 44.9 h weekend gap that led this line for days is now covered by a marker and has stopped surfacing.
