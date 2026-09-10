# Briefing
**Generated:** 2026-09-10 09:58 local (07:58 UTC) · keep-work-flowing-cc

## The one thing

**Ten minutes of play, and the encounter line gets its cadence back.** Batch 2 is live on the deployed build; your own rule samples two of every six, and that verdict is the last thing owed on it — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to).

- [**Ward the Camp**](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) — the thinnest opening in the batch; its hand forces the game's second omen emitter.
- [**Tend to Wounds**](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds) — the warmest; a possession and a piece of knowledge come out the other side.

Both were confirmed rendering on the live site. **The one question: are these worth meeting twice?** Yes releases batch 3; anything short of yes is feedback the line can act on. [Batch report](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/batch-report-2026-09-09.md).

Why it is the lead rather than the backlog sitting: **the shelf refilled overnight** — eight jobs are queued and claimable, so rulings are no longer the thing the machine is starving for this hour. This is. It is also the only ask on the board where nobody but you can supply the answer.

## Also waiting (8)

- **Rule on the backlog — one sitting, smallest first.** Roughly fourteen one- and two-sentence answers, each unblocking a job: [what a Divine Herald is](https://linear.app/threadbare/issue/THR-1195), [which Spheres shadow and void belong to](https://linear.app/threadbare/issue/THR-1114), [whether a toll moves wealth or is deleted](https://linear.app/threadbare/issue/THR-1189), [activate the pressure system or retire it](https://linear.app/threadbare/issue/THR-1318).
- [The screenshot sweep](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) wants an attended hour — nineteen captures, nothing technical blocking it since 4 September.
- [The fight map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — ten questions, all legwork finished; [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) open the rest.
- Two sketches to react to: [twenty spells](https://linear.app/threadbare/issue/THR-1232), [thirty items](https://linear.app/threadbare/issue/THR-1236).
- [Should image spends be gated on you at all?](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — your answer settles five plates and every batch after.
- [What is a run *about*?](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) — remembrance, or named campaigns. 48 authored lines no player has read.
- [Are you still planning to design Traits wave 2?](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — one word; holds the only design slot in use.
- Are weekend-long quiet spells normal? You ruled overnight quiet normal; weekends are still unruled, so the probe keeps raising them.

## Not coming to you — a call two lanes disagreed about

**The `concepts`-on-aftermath rule ([THR-1053](https://linear.app/threadbare/issue/THR-1053/the-composition-contract-requires-concepts-on-every-aftermath-change)) is being taken as an agent decision, not queued on you.** One lane briefed it this morning as yours, on the grounds that narrowing it edits your "no exemptions" ruling; another called it gate calibration. The second is right by your 2026-08-12 rule: the ticket itself says the answer turns on a checkable fact — whether the narrative linker already reaches a change's `detail` label. That is a test, not a question about what the game means, and narrowing a gate to what the linker cannot reach is not an exemption mechanism.

It matters because it is the only rule failing two encounters — *Snow on the Pass* and *Riders Behind the Caravan* — which have now been held out of two consecutive batches. A design session settles it against the linker's real coverage. **Say the word if you want it back**; otherwise it resolves without you.

## Queue

**Healthy — 8 ready, nothing In Dev, no parked jobs.** Six deferrals were promoted this morning and the shelf went from 1 to 8; the builder's constraint is now hands, not answers.

- Top of queue: [THR-1130](https://linear.app/threadbare/issue/THR-1130) (High, batch 3's brief is the executable half), [THR-1446](https://linear.app/threadbare/issue/THR-1446) and [THR-1450](https://linear.app/threadbare/issue/THR-1450) (Medium), five Low deferrals behind them.
- **In Design: 1** — [THR-790](https://linear.app/threadbare/issue/THR-790), assigned to you, no plan doc.
- Nothing stale, nothing blocked at the top of the ready queue.

## Health

- **The engine got slower and still nobody has looked.** Probe, verbatim: *tick cost 123 ms/tick steady, 49% above the 7-day median (83, 59 rows since 1c725457); top phase agent_decision, 504 agents. Name the merges between 1c725457 and b5569a1b: `git log --oneline --merges 1c725457..b5569a1b`.* Up from 42% an hour ago. A session's job, not yours.
- **Heavy simulation tests red on the latest main (3 h).** Post-merge-only suite; required CI is green and the site is current. A follow-up fix is owed by a session.
- Site serving the latest commit (`b5569a1b`). Automated checks normal, no PRs waiting to merge, all 9 scheduled tasks on schedule, stale-worktree reaper ran 18 minutes ago.
