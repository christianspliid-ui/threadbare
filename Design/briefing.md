# Briefing
**Generated:** 2026-09-07 04:57 local (02:57 UTC) · keep-work-flowing-cc

## The one thing

**Approve the camp six — three words and six encounters get built without you.** [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md)

Third hour at the top, and it stays there for the same reason: it is the only ask on your list whose answer turns into shipped work the same hour, with you absent. Say the word and the unattended machine picks up [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine).

It also happens to be the ask that matches where the machine is thin. The queue holds two engine-cleanup tickets and **no content or feature work at all** — the encounter line is idle waiting on this word, not on capacity.

Six encounters, not seven — sharpening blades, warding the camp, a small prayer, rest, tending wounds, scouting. `shrine_offering` is held to batch 3, which is why your slice checkpoint waits one batch longer. Two questions in the brief: **repair the six in place, or re-roll them from fresh premises?** (repair is the plan), and the 2-of-6 sample — `ward_the_camp` and `tend_to_wounds`, your own pick.

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
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133)** — *cheaper than it was an hour ago.* The dev-server fault that ate a quarter of your 2026-09-04 attempt shipped fixed at 02:16Z ([THR-1415](https://linear.app/threadbare/issue/THR-1415)) — the game would not load because the server was watching ~199 lane worktrees. Roughly twenty minutes now, no decision in it. *— from [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07c.md), 2026-09-07*
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-1220)** — advice is still to wait for your slice checkpoint.
- **A Tenacious-style trait** — parked by default, listed so it is not forgotten.
- **Should weekend quiet be normal too?** — one word declines the 45-hour Friday-to-Sunday gap the way you declined overnight quiet.
- **The scripted half of Linear access** — `LINEAR_API_KEY` is still unset, so a handful of background checks stay dark. Nothing is blocked on it.

**No ask joined and none left this hour.** No message came in.

## Queue

**Thin — 2 ready, and both are engine cleanup.**

- **Ready for Dev: 2**, both unclaimed, neither stale. [THR-1407](https://linear.app/threadbare/issue/THR-1407) (owningSystem registry) and [THR-1422](https://linear.app/threadbare/issue/THR-1422) (six constants defined twice). Down from three because one shipped.
- **One shipped this hour** — [THR-1415](https://linear.app/threadbare/issue/THR-1415), the dev server no longer watches the lane worktrees. That is the fix behind the pixel-sweep line above.
- **In Dev: nothing live.** The only two In-Dev items are your two parked approvals, [THR-1130](https://linear.app/threadbare/issue/THR-1130) and [THR-1392](https://linear.app/threadbare/issue/THR-1392) — correctly parked on your word, not stalled. The executor's one slot is free and pointed at a queue with no content in it.

## Health

- **Green everywhere the probes can see.** Deploy live and current at `cf41033e`; all scheduled workflows and post-merge CI green; no PRs waiting to merge; all 9 scheduled tasks on schedule; the worktree reaper ran at 04:41.
- **Engine speed is still over the line — executor's job, not yours.** Probe verbatim: *"tick cost 108 ms/tick steady, 27% above the 7-day median (85, 24 rows since b95996df); top phase agent_decision, 511 agents. Name the merges between b95996df and cf41033e: `git log --oneline --merges b95996df..cf41033e`"*. Third consecutive reading in the same band (105 / 109 / 108), so it is a settled step up rather than a spike, and warm-up at 38.7 ms says the machine was not loaded.
- Visibility only, no action: the silence probe still reports the same three gaps (44.9 h weekend, 11.7 h and 10 h overnight). The two overnight ones are declined under your 8 August ruling; the weekend one is on your list above.
- Agent-owned, unchanged and flagged for the Friday retro: **seven merges to `main` from the Linear outage window carry no `Fixes THR-XX` line** ([PRs #1821–#1827](https://github.com/christianspliid-ui/threadbare/pulls?q=is%3Apr+is%3Amerged)) because the lanes correctly refused to claim board tickets they could not reach. Shipped but unticketed, and needs reconciling.
- Minor, no action: the home tree sits 15 commits behind `origin/main`. It is autosync's read-only mirror and no lane reads from it — every session works in its own worktree off `origin/main`.
