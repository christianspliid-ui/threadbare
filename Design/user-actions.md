# User Action Required

**Last updated:** 2026-08-15 09:57 local (2026-08-15 07:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Play the slice and rule the four verdicts

[**THR-907**](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) — the destination of the [Encounter Experience map](https://linear.app/threadbare/issue/THR-902), and fully unblocked for the first time as of this morning.

Four rulings from one sitting: **prose** (does the plain register read clear and grounded in-game?), **firing** (does the rhythm work as a starting point, and what's your first pruning instinct — this one wants some free play, not only spawn-on-demand), **UI** (the new screen and modifier iconography with real nudge-native encounters — gamey enough?), **game** (is it fun, in a gaming sense, to make decisions inside an encounter?).

Both blockers are `Done`: the multi-step tick-loop crash ([THR-924](https://linear.app/threadbare/issue/THR-924)) and the roster readiness gap ([THR-906](https://linear.app/threadbare/issue/THR-906)). The defect that would have polluted the prose verdict — authoring notes printing above the fiction — shipped 2026-08-10 ([THR-1078](https://linear.app/threadbare/issue/THR-1078)). Level re-checked 2026-08-15 07:57 UTC; deployed artifact current (`104101ee`).

**Free play, everything firing:** [threadbare.vercel.app/?view=game&seeded&size=medium&forceencounters](https://threadbare.vercel.app/?view=game&seeded&size=medium&forceencounters)

"Needs another iteration" is a valid ruling on any of the four — it closes the verdict and charters the follow-up work.

*Raised by `tb-orchestrator` (2026-08-15 run c) and `daily-backlog-grooming` (2026-08-15), independently.*

### 2. Rule the consequence verdict — same sitting as #1

[**THR-974**](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) — the fifth verdict, split out on your 2026-08-02 ruling. You ruled it **"not yet"** on 2026-08-10 because the chips were unreadable (*"what does steadily even mean?"*). Everything you chartered against that ruling has shipped and deployed: the icon vocabulary ([THR-1082](https://linear.app/threadbare/issue/THR-1082)) and the rewrite of all 55 authored consequences ([THR-1097](https://linear.app/threadbare/issue/THR-1097)), on top of the logic ([THR-969](https://linear.app/threadbare/issue/THR-969)) and UI ([THR-971](https://linear.app/threadbare/issue/THR-971)).

**The question:** after a hand resolves, does the consequence read as a real thing that happened to that person — noun, direction, rough magnitude — rather than an ungaugeable adverb?

**Straight to any ending:** [the review table in THR-1097's closeout](https://linear.app/threadbare/issue/THR-1097). One honest seam, by design: no encounter authors a `success` band — the base text *is* the ordinary win, so `?outcome=success` correctly reports `unauthored_band`.

Ruling this and #1 together closes the map ([THR-902](https://linear.app/threadbare/issue/THR-902)).

### 3. Give the Encounter Factory design an attended session

[**THR-1043**](https://linear.app/threadbare/issue/THR-1043/the-encounter-factory-agentic-workflow-for-composition-complete) has sat in "In Design" since 2026-08-08. Your note on 2026-08-11 asked for three missing sections to be backfilled into the plan doc (NFP compliance table, constants table, Substrate inventory) before it can move toward Ready for Dev; that hasn't happened, and no automated lane can author a plan doc (the orchestrator deliberately runs a cheaper model).

It holds the only design slot, so nothing player-facing can be staged behind it. Best done *after* the verdicts above, not before — the slice rulings tell you whether the encounter design is right before a factory is built to scale it.

*Raised by `tb-orchestrator`, 2026-08-15 runs a–c.*

### 4. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-15: **the main working copy is syncing again.** [THR-1119](https://linear.app/threadbare/issue/THR-1119) — after 14 consecutive hourly refusals and 27 commits of drift, the three blocking edits were triaged and the tree fast-forwarded cleanly (`09:50 ok: already up to date`). The automated half — a watcher so the next stall surfaces within the hour rather than by accident — is queued for the lane and needs nothing from you.
- 2026-08-15: **eleven dead modules deleted, four spared on re-check.** [THR-1089](https://linear.app/threadbare/issue/THR-1089) ([PR #1467](https://github.com/christianspliid-ui/threadbare/pull/1467)) — the batched prune sweep you asked for on 2026-08-11 instead of seven separate queue slots. Four candidates had gained a caller since the evidence was written and were kept.
- 2026-08-15: **the documentation-freshness gate stopped having blind spots.** [THR-1061](https://linear.app/threadbare/issue/THR-1061) ([PR #1465](https://github.com/christianspliid-ui/threadbare/pull/1465)) — two reference pages did not watch their own source files, so those systems could change without the docs being flagged stale.
- 2026-08-15: **the glossary can now say a word was rejected.** [THR-991](https://linear.app/threadbare/issue/THR-991) ([PR #1464](https://github.com/christianspliid-ui/threadbare/pull/1464)) — previously the only way to record a term we turned down was to mislabel it "deprecated", which reads as *was used, then dropped*.
- 2026-08-15: **grooming now judges what a ticket is worth, not just whether it is well-formed.** [THR-1090](https://linear.app/threadbare/issue/THR-1090) ([PR #1462](https://github.com/christianspliid-ui/threadbare/pull/1462)) — your 2026-08-11 queue review found a third of the shelf below the materiality bar on a board three lanes scan daily, none of which was ever asked to judge worth. The daily grooming lane now runs a materiality sweep and cancels with its reason recorded.
- 2026-08-15: **the lanes now clean up their own litter.** [THR-1056](https://linear.app/threadbare/issue/THR-1056) ([PR #1461](https://github.com/christianspliid-ui/threadbare/pull/1461)) — leftover files from scheduled runs had been jamming the sync that keeps the main working copy current. Workshop maintenance; nothing in the game changed.
- 2026-08-15: **an aftermath can no longer be picked twice.** [THR-1112](https://linear.app/threadbare/issue/THR-1112) ([PR #1460](https://github.com/christianspliid-ui/threadbare/pull/1460)) — the pick now refuses an aftermath the tick loop has already run, instead of quietly resolving it a second time.
- 2026-08-15: **the workspace repair now fires by itself.** [THR-1115](https://linear.app/threadbare/issue/THR-1115) ([PR #1459](https://github.com/christianspliid-ui/threadbare/pull/1459)) — the build-environment fault named one hour earlier is now self-healing, and refuses to run while anyone is working. Filed to the shelf at 23:33 and drawn back down by 00:30.
- 2026-08-14: **the tool that wipes a workspace now says its own name.** [THR-1111](https://linear.app/threadbare/issue/THR-1111) ([PR #1458](https://github.com/christianspliid-ui/threadbare/pull/1458)) — a recurring build-environment fault agents kept rediscovering by hand is now named and visible the moment it happens. Workshop maintenance; nothing in the game changed.
- 2026-08-14: **one renderer now draws both halves of the aftermath.** [THR-1105](https://linear.app/threadbare/issue/THR-1105) ([PR #1457](https://github.com/christianspliid-ui/threadbare/pull/1457)) — the consequence chip and the reaction label each ran their own copy of the same link-and-tooltip rule. They now share one, with the chip tests passing unchanged.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
