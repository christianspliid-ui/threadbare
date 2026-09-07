# Briefing
**Generated:** 2026-09-07 03:56 local (01:56 UTC) · keep-work-flowing-cc

## The one thing

**Approve the camp six — three words and six encounters get built tonight.** [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md)

Unchanged from last hour and still the ask whose answer turns into shipped work the same hour: say the word and the unattended machine picks up [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) without you being present.

Six encounters, not seven — sharpening blades, warding the camp, a small prayer, rest, tending wounds, scouting. `shrine_offering` is held to batch 3, which is why your slice checkpoint waits one batch longer. Two questions in the brief: **repair the six in place, or re-roll them from fresh premises?** (repair is the plan), and the 2-of-6 sample — `ward_the_camp` and `tend_to_wounds`, your own pick.

**"batch 2, run the six"** · *"re-roll them"* · *"put shrine_offering back in."*

## Also waiting (14)

- **[What should a proportion read as?](https://linear.app/threadbare/issue/THR-1424)** — *the same question, now worth more.* A second ticket landed this hour ([THR-1426](https://linear.app/threadbare/issue/THR-1426)) covering two more shapes with no sanctioned reading — timestamps like *t42*, rates like *regen 1.5 per tick*. **One answer now settles ten readouts instead of two.** Same recommendation: *"drop them"*.
- **[Are you still planning to design Traits wave 2?](https://linear.app/threadbare/issue/THR-790)** — one word. In Design, your name on it, **23 days**, no plan doc; it holds the design tier's one preparation slot.
- **[The undertaking retirement list](https://linear.app/threadbare/issue/THR-1392)** — four templates get deleted; *"run 4b"* finishes the migration.
- **[Do you still want the incident-capture button?](https://linear.app/threadbare/issue/THR-1134)** — you filed it 16 August; yes or no.
- **[Three questions on the undertakings map](https://linear.app/threadbare/issue/THR-1396)** — take [the division rule](https://linear.app/threadbare/issue/THR-1398) first; it unblocks four.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258)** — settle [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) and three more open by themselves.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — sketches built for you to react to.
- **[Image credits](https://linear.app/threadbare/issue/THR-876)** — should the spend be gated on you at all?
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — remembrance, or named campaigns.
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133)** — *materially better than it was.* The last of the three holes that made three passes impossible closed at 00:28 tonight; all nine passes are now genuinely reachable. Nineteen captures, roughly twenty minutes, no decision in it.
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-1220)** — advice is still to wait for your slice checkpoint.
- **A Tenacious-style trait** — parked by default, listed so it is not forgotten.
- **Should weekend quiet be normal too?** — one word declines the 45-hour Friday-to-Sunday gap the way you declined overnight quiet.
- **The scripted half of Linear access** — `LINEAR_API_KEY` is still unset, so a handful of background checks stay dark. Nothing is blocked on it.

**No ask joined and none left this hour.** The proportion question widened rather than multiplied, so you are not being rung twice for the same fork. No message came in.

## Queue

**Healthy — 3 ready, and the machine shipped again this hour.**

- **Ready for Dev: 3**, all unclaimed, none stale. [THR-1407](https://linear.app/threadbare/issue/THR-1407) (owningSystem registry), [THR-1422](https://linear.app/threadbare/issue/THR-1422) (duplicated constants), [THR-1415](https://linear.app/threadbare/issue/THR-1415) (Vite watches worktrees).
- **One shipped since the last brief** — [THR-1425](https://linear.app/threadbare/issue/THR-1425), five more elapsed-term surfaces now read in words instead of raw ticks. Claimed at 01:25 and Done at 01:32. That is the second tick-readout ticket to ship overnight.
- **In Dev: nothing live.** The only two In-Dev items are your two parked approvals, [THR-1130](https://linear.app/threadbare/issue/THR-1130) and [THR-1392](https://linear.app/threadbare/issue/THR-1392) — correctly parked on your word, not stalled.

## Health

- **Green everywhere else the probes can see.** Deploy live and current at `4a394e3e`; all scheduled workflows and post-merge CI green; no PRs waiting to merge; all 9 scheduled tasks on schedule; the worktree reaper ran at 03:40.
- **Engine speed crossed the line this hour — executor's job, not yours.** Probe verbatim: *"tick cost 109 ms/tick steady, 28% above the 7-day median (85, 23 rows since b95996df); top phase agent_decision, 511 agents. Name the merges between b95996df and 4a394e3e: `git log --oneline --merges b95996df..4a394e3e`"*. Last hour read 105 ms / +24%, just under the 25% threshold; this reading is just over it. Warm-up 39.2 ms against a normal 38, so the reading is trustworthy rather than a loaded machine.
- Visibility only, no action: the silence probe still reports the same three gaps (44.9 h weekend, 11.7 h and 10 h overnight). The two overnight ones are declined under your 8 August ruling; the weekend one is on your list above.
- Agent-owned, unchanged and flagged for the Friday retro: **seven merges to `main` from the Linear outage window carry no `Fixes THR-XX` line** ([PRs #1821–#1827](https://github.com/christianspliid-ui/threadbare/pulls?q=is%3Apr+is%3Amerged)) because the lanes correctly refused to claim board tickets they could not reach. Shipped but unticketed, and needs reconciling.
- Minor, no action: the home tree sits behind `origin/main`. It is autosync's read-only mirror and no lane reads from it — every session works in its own worktree off `origin/main`.
