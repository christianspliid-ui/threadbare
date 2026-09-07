# Briefing
**Generated:** 2026-09-07 06:00 local (04:00 UTC) · keep-work-flowing-cc

## The one thing

**Approve the camp six — three words and six encounters get built without you.** [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md)

Fourth hour at the top, unchanged, and the case for it got slightly stronger while you slept. The board gained one ticket overnight and it is engine plumbing; the executor's slot is **free**, and there is still **no content or feature work queued at all**. The encounter line is idle waiting on a word, not on capacity.

Six encounters, not seven — sharpening blades, warding the camp, a small prayer, rest, tending wounds, scouting. `shrine_offering` is held to batch 3, which is why your slice checkpoint waits one batch longer. Two questions in the brief: **repair the six in place, or re-roll them from fresh premises?** (repair is the plan), and the 2-of-6 sample — `ward_the_camp` and `tend_to_wounds`, your own pick.

Say the word and the unattended machine picks up [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) the same hour.

**"batch 2, run the six"** · *"re-roll them"* · *"put shrine_offering back in."*

## Also waiting (14)

- **[What should a proportion read as?](https://linear.app/threadbare/issue/THR-1424)** — one answer settles ten readouts: percentages, timestamps like *t42*, rates like *regen 1.5 per tick* ([THR-1426](https://linear.app/threadbare/issue/THR-1426)). Recommendation stands: *"drop them"*.
- **[Are you still planning to design Traits wave 2?](https://linear.app/threadbare/issue/THR-790)** — one word. In Design, your name on it, over three weeks, no plan doc; it holds the design tier's one preparation slot.
- **[The undertaking retirement list](https://linear.app/threadbare/issue/THR-1392)** — four templates get deleted; *"run 4b"* finishes the migration and flips the model on. Last slice of four.
- **[Do you still want the incident-capture button?](https://linear.app/threadbare/issue/THR-1134)** — you filed it 16 August; yes or no.
- **[Three questions on the undertakings map](https://linear.app/threadbare/issue/THR-1396)** — take [the division rule](https://linear.app/threadbare/issue/THR-1398) first; it unblocks four.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258)** — settle [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) and three more open by themselves.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — sketches built for you to react to.
- **[Image credits](https://linear.app/threadbare/issue/THR-876)** — should the spend be gated on you at all?
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — remembrance, or named campaigns.
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133)** — roughly twenty minutes, no decision in it, and the dev-server fault that ate a quarter of your last attempt is fixed and shipped ([THR-1415](https://linear.app/threadbare/issue/THR-1415)).
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-1220)** — advice is still to wait for your slice checkpoint.
- **A Tenacious-style trait** — parked by default, listed so it is not forgotten.
- **Should weekend quiet be normal too?** — one word declines the 45-hour Friday-to-Sunday gap the way you declined overnight quiet.
- **[The scripted half of Linear access](https://linear.app/threadbare/issue/THR-1077)** — `LINEAR_API_KEY` still unset; nothing is blocked on it. Worth doing eventually, not worth your evening.

## Queue

**Thin but healthy — 2 ready, both unclaimed, and the executor's slot is free.**

- [THR-1422](https://linear.app/threadbare/issue/THR-1422/six-constants-are-defined-twice-with-no-shared-source-sea-level) (constants defined twice) and [THR-1427](https://linear.app/threadbare/issue/THR-1427/the-undertaking-grid-emits-no-subsystem-verb-view-the-join-thr-1407) (the undertaking grid's missing subsystem × verb view, filed by the orchestrator at 03:31Z). Both engine, both fresh — neither is stale, nothing is blocked.
- Two items sit In Dev and both are **deliberate parks**, so nothing is stuck: [THR-1130](https://linear.app/threadbare/issue/THR-1130) waits on the ask above, and [THR-1392](https://linear.app/threadbare/issue/THR-1392) waits on the retirement list. Neither is a dead session.
- Still the standing shape: **zero content or feature work queued.** The constraint is design supply, not executor capacity — the same finding the weekly hygiene sweep and the orchestrator reached independently.

## Health

**Everything green except one measurement, and it is an agent's job, not yours.**

- **Engine speed drifted:** tick cost 109 ms/tick steady, 27% above the 7-day median (86, 25 rows since b95996df); top phase agent_decision, 511 agents. Name the merges between b95996df and 6260806b: `git log --oneline --merges b95996df..6260806b`
- Deploy, CI, all three scheduled workflows, post-merge checks, the merge queue, all nine scheduled tasks and the worktree reaper: green. Nothing waiting to merge.
- The two overnight gaps in lane coverage (10h and 11.7h) are the nightly shape you already ruled normal on 8 August — noted, not raised. The 45-hour weekend gap is ask 14 above.
- The home tree is 17 commits behind `origin/main`. It is autosync's read-only mirror and no lane works in it, so nothing is affected; recorded because the freshness probe reads it.
