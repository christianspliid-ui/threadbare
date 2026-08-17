# Briefing
**Generated:** 2026-08-17 10:57 local (08:57 UTC) · keep-work-flowing-cc

## The one thing

**When the game writes something down about you that nothing reads yet — does it tell you?**

**[THR-1161 — the acted-on taxonomy](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions)** *— from tb-orchestrator.* A chat session, no prep, nothing built or waiting on it. Say **"work the map"** when you have the time.

You have ruled on this twice in opposite directions, and both rulings are right in their own case:

- Reach-reputation tallies — *invisible everywhere*, in the aftermath and on the sheet, while still bending how people treat you ([THR-1136](https://linear.app/threadbare/issue/THR-1136/aftermath-screen-corner-chrome-removal-step-replay-from-the-ending) §5, 2026-08-16).
- A plot-hook-worthy recording — legitimate to file, **but** *"we need to make it clear to the player that that is what has happened"* (yesterday morning, 2026-08-17).

The sitting reconciles those into one rule the code can carry instead of a habit reviewers remember. Three classes are on the table: **acted-on** (something reads it now — the player sees it in full), **dormant hook** (filed for a story to pick up later — the player is told it was filed, and something must eventually use it or it lapses), **bookkeeping** (the player never sees it, by design). The sub-questions are the interesting part: does an unused hook expire, and does the player watch it expire; who is allowed to mint one, authored content or the engine or both.

**Why this one and not the encounter verdict.** This is your own sequencing — *"lets get it sorted. higest priority. new features can wait as they will just be implemented badly due to these issues"* — and this is the one question on the [new architecture map](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map) that needs nothing built first. The map's other three all wait on the bridge-chip work that is running right now.

## Also waiting (4)

- **[The yes/no on your two batch-1 samples](https://linear.app/threadbare/issue/THR-1131/retrofit-batch-1-the-slice-six-through-the-factory-line-contract-thr)** — worth meeting twice, on each: [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin). About a minute now — your 07:36 comment made it set the bar rather than open the gate.
- **[Batch 2 — THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to).** Behind two gates, one of them yours; [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) is the other and is agent work moving without you. Nine encounters sit behind it. *(Also raised by daily-backlog-grooming this morning.)*
- **[THR-1133 — one attended dev-server session clears the owed screenshot passes](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)** *— from daily-backlog-grooming.* ~30 min, one `npm run dev`, 13 captures across 6 surfaces. No routine can take it — a scheduled run is refused a dev server.
- **A Tenacious-style trait stays parked** — open design option, no ticket, nothing waiting on it. Listed so it isn't silently dropped.

## Queue

**Thin but fed, and honestly thin: 2 Ready for Dev, only 1 of them claimable by a routine.**

- [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) (Urgent) — ratify the chip-anchoring rule, ship the anchor catalog, give the factory a package-level judgment stage. Your ruling, filed 07:36. Claimable now.
- [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) (Low) — the screenshot sweep above; structurally not claimable by a routine.
- **In Dev, live:** [THR-1153](https://linear.app/threadbare/issue/THR-1153/a-law-56-backed-chip-whose-backing-the-player-cannot-reach-is-still-a) — the Bridge chip you flagged shipped and merged ([PR #1520](https://github.com/christianspliid-ui/threadbare/pull/1520)) about half an hour ago, and the ticket is **deliberately left open**. The fix took your harder bar seriously: rather than making a dead chip clickable, it deleted the claim — the chip named a river the world does not have, so the river went. A sweep of all 683 templates then found **65 more chips naming something the game has no object for**, 19 of them naming "The Dawn". Sorting those needs THR-1154's anchor vocabulary first, so the ticket waits on it rather than pretending to be done.
- **In Dev, parked:** [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), holding for the verdict above. Parked ~35 h.

**Nothing here needs you.** The 65-chip finding is the good kind of bad news — one bug you reported from live play turned into a corpus-wide count with a named fix path, and the queue behind it is sequenced without asking you anything.

## Health

**All green.**

Site serving `d942ac8f`, the current tip of main. No PR waiting to merge, all 9 lanes on schedule, background jobs healthy, reaper ran 17 minutes ago, home tree clean and synced.

Two visibility lines, no action:

- The lane-silence probe still reports the 20.6-hour quiet of 2026-08-10 → 08-11 as unexplained. Recovered six days ago; declined under your 2026-08-08 ruling that overnight quiet is normal.
- The reaper still can't remove three stale worktrees (unmerged, 16–29 days old), now against 82 worktrees and 95 branches. Housekeeping for an agent, not for you.
