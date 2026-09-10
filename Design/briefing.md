# Briefing
**Generated:** 2026-09-10 08:58 local (06:58 UTC) · keep-work-flowing-cc

## The one thing

**You answered one question this morning and the builder had work eleven minutes later. There are about fourteen more of exactly that shape.**

At 06:36 you ruled that a claimed town is a **commitment** — a hold is kept by working it. By 06:47 [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets) was a finished plan sitting in the builder's queue, and two follow-on tickets ([THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and), [THR-1449](https://linear.app/threadbare/issue/THR-1449/ul-proposal-hold-a-location-kept-by-a-mortals-commitment-the-controls)) were written from your answer without asking you anything further. One sentence, one job, no session.

That is also the problem. **It is the only job on the shelf**, and the pickup lane runs in two minutes — so by 07:00 the queue is empty again. The forty-item backlog cannot refill it, because nearly every candidate stops at a question rather than at a developer. Rulings are the input the machine is starved of, and this morning measured exactly how fast it converts them.

Roughly fourteen are one- and two-sentence answers. A sample of what is waiting:

- [What a Divine Herald is](https://linear.app/threadbare/issue/THR-1195) — three live options; a question about what the thing *is*.
- [Which Spheres shadow and void belong to](https://linear.app/threadbare/issue/THR-1114) — the ticket forbids the mechanical fix outright.
- [Whether a toll moves wealth or gets deleted](https://linear.app/threadbare/issue/THR-1189).
- [Activate the pressure system or retire it](https://linear.app/threadbare/issue/THR-1318).
- [Should every faction commission ruin expeditions, or only the adventurers' guild?](https://linear.app/threadbare/issue/THR-1026) — reads like a one-line fix; is really a question about what the world is like.
- [The consequence draw can deal a hand no authored content can wire](https://linear.app/threadbare/issue/THR-1446).

**Say "rule on the backlog"** and they come to you in game terms, smallest first — the same format as this morning's.

## Also waiting (8)

- [Batch 2 — sample the two](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to): [Ward the Camp](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) and [Tend to Wounds](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds) — yes releases batch 3. The board's only parked job.
- [The screenshot sweep](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) wants an attended hour — nineteen captures, nothing technical blocking it.
- [The fight map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — ten questions, all legwork finished; [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) open the rest.
- Two sketches to react to: [twenty spells](https://linear.app/threadbare/issue/THR-1232), [thirty items](https://linear.app/threadbare/issue/THR-1236).
- [Should image spends be gated on you at all?](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — your answer settles five plates and every batch after.
- [What is a run *about*?](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) — remembrance, or named campaigns. 48 authored lines no player has read.
- [Are you still planning to design Traits wave 2?](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — one word; holds one of two design slots.
- Are weekend-long quiet spells normal? You ruled overnight quiet normal; weekends are still unruled, so the probe keeps raising them.

## Queue

**Starved — 1 ready, and it arrives and leaves within the hour.** [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets) (Medium, Engine) went Ready for Dev at 06:47 on your ruling; the pickup lane fires at 07:00.

- **In Dev: 1** — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), `Parked` and unassigned, waiting on your two-encounter verdict (above). Not stalled — held on purpose.
- **In Design: 1** — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools), assigned to you, no plan doc.
- **Todo: 34** (15 wayfinder items). Nothing stale at the top of the ready queue.

## Health

- **The engine got slower and nobody has looked yet.** Probe, verbatim: *tick cost 117 ms/tick steady, 42% above the 7-day median (82, 58 rows since 1c725457); top phase agent_decision, 504 agents. Name the merges between 1c725457 and 910d95b0: `git log --oneline --merges 1c725457..910d95b0`.* Measured twice this run — the first reading overlapped other jobs, so it was re-measured clean and held. A session's job, not yours.
- **Heavy simulation tests red on the latest main (2 h).** The post-merge-only suite; the required CI check is green and the site is current. A follow-up fix is owed by a session.
- Site up to date (last publish `ccc1e874`; commits since touched only notes and docs). Automated checks running normally, no PRs waiting to merge, all 9 scheduled tasks on schedule, stale-worktree reaper ran 16 minutes ago.
