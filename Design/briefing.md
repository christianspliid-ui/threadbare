# Briefing
**Generated:** 2026-09-07 07:00 local (05:00 UTC) · keep-work-flowing-cc

## The one thing

**Approve the camp six — three words and six encounters get built without you.** [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md)

Fifth hour at the top, and the queue argues for it harder than it did an hour ago: the build shelf is down to **one** item — an engine-plumbing ticket nobody has claimed — and there is still **no content or feature work queued at all**. Your word is what refills it.

Six encounters, not seven — sharpening blades, warding the camp, a small prayer, rest, tending wounds, scouting. `shrine_offering` is held to batch 3, which is why your slice checkpoint waits one batch longer. Two questions in the brief: **repair the six in place, or re-roll them from fresh premises?** (repair is the plan), and the 2-of-6 sample — `ward_the_camp` and `tend_to_wounds`, your own pick.

Say the word and the unattended machine picks up [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) the same hour.

**"batch 2, run the six"** · *"re-roll them"* · *"put shrine_offering back in."*

## Also waiting (15)

- **[What should a proportion read as?](https://linear.app/threadbare/issue/THR-1424)** — one answer settles ten readouts: percentages, timestamps like *t42*, rates like *regen 1.5 per tick* ([THR-1426](https://linear.app/threadbare/issue/THR-1426)). Recommendation stands: *"drop them"*.
- **[Are you still planning to design Traits wave 2?](https://linear.app/threadbare/issue/THR-790)** — one word. In Design, your name on it, over three weeks, no plan doc.
- **[Unify the card grammar](https://linear.app/threadbare/issue/THR-1002)** — *new here, though it has waited 19 days.* Your own August direction that action cards are too verbose; worked up far enough that a design session could start on it cold. It needs one of your sessions, not a decision.
- **[The undertaking retirement list](https://linear.app/threadbare/issue/THR-1392)** — four templates get deleted; *"run 4b"* finishes the migration and flips the model on. Last slice of four.
- **[Do you still want the incident-capture button?](https://linear.app/threadbare/issue/THR-1134)** — you filed it 16 August; yes or no.
- **[Three questions on the undertakings map](https://linear.app/threadbare/issue/THR-1396)** — take [the division rule](https://linear.app/threadbare/issue/THR-1398) first; it unblocks four. [The untouched list](https://linear.app/threadbare/issue/THR-1401) is now machine-made and says **17 systems, not 14** — worth re-splitting against the new list rather than the old.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258)** — settle [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) and three more open by themselves.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — sketches built for you to react to.
- **[Image credits](https://linear.app/threadbare/issue/THR-876)** — should the spend be gated on you at all?
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — remembrance, or named campaigns.
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133)** — roughly twenty minutes, no decision in it, and the dev-server fault that ate a quarter of your last attempt is fixed and shipped ([THR-1415](https://linear.app/threadbare/issue/THR-1415)).
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-1220)** — advice is still to wait for your slice checkpoint.
- **A Tenacious-style trait** — parked by default, listed so it is not forgotten.
- **Should weekend quiet be normal too?** — one word declines the 45-hour Friday-to-Sunday gap the way you declined overnight quiet.
- **The scripted half of Linear access** — `LINEAR_API_KEY` still unset (re-checked this run); nothing is blocked on it. Worth doing eventually, not worth your evening.

## Queue

**Starved — one ready item, and it is not content.**

- [THR-1422](https://linear.app/threadbare/issue/THR-1422/six-constants-are-defined-twice-with-no-shared-source-sea-level) (six constants defined twice) is the whole build shelf. Unclaimed for ~9½ hours, which is correct rather than stuck: it carries no priority, and the executor's 04:01 run took the higher-priority [THR-1427](https://linear.app/threadbare/issue/THR-1427) instead and shipped it in 54 minutes. THR-1422 is next by construction.
- Two items sit In Dev and both are **deliberate parks**, so nothing is stuck: [THR-1130](https://linear.app/threadbare/issue/THR-1130) waits on the ask above, [THR-1392](https://linear.app/threadbare/issue/THR-1392) on the retirement list.
- The standing shape is unchanged and now sharper: **the constraint is design supply, not executor capacity.** Both In-Design slots are occupied by items waiting on you ([THR-790](https://linear.app/threadbare/issue/THR-790), [THR-1002](https://linear.app/threadbare/issue/THR-1002)), so the orchestrator cannot stage a third. *— finding carried from [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md), fourth consecutive run*

## Health

**Everything green except one measurement, and it is an agent's job, not yours.**

- **Engine speed drifted:** tick cost 114 ms/tick steady, 28% above the 7-day median (89, 26 rows since b95996df); top phase agent_decision, 511 agents. Name the merges between b95996df and c798bc91: `git log --oneline --merges b95996df..c798bc91`
- Deploy, CI, all three scheduled workflows, post-merge checks, the merge queue, all nine scheduled tasks and the worktree reaper: green. Nothing waiting to merge.
- The two overnight gaps in lane coverage (10h and 11.7h) are the nightly shape you already ruled normal on 8 August — noted, not raised. The 45-hour weekend gap is the ask above.
- The home tree is 19 commits behind `origin/main`. It is autosync's read-only mirror and no lane works in it, so nothing is affected; recorded because the freshness probe reads it.
