# User Action Required

**Last updated:** 2026-08-15 10:57 local (2026-08-15 08:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Say the consequence verdict — one line closes it

[**THR-974**](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) — you re-played it this morning on production and filed four findings, but the session note records the ruling itself as still pending.

**The question:** after a hand resolves, does the consequence read as a real thing that happened to that person — noun, direction, rough magnitude — rather than an ungaugeable adverb? You ruled **"not yet"** on 2026-08-10 (*"what does steadily even mean?"*).

**Changed since you looked:** your finding #1 (no links to any reward/penalty attachment) shipped 39 minutes after you filed it and is live — [THR-1120](https://linear.app/threadbare/issue/THR-1120/consequence-chips-name-their-rewardpenalty-attachment-but-never-link), deployed at [`cf410dce`](https://github.com/christianspliid-ui/threadbare/commit/cf410dcee523a3c98d04eee5057e78bd1906f4e1) and verified live 2026-08-15 08:57 UTC. A chip now links the attachment its ending grants.

**Straight to an ending:** [threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

Your other three findings are chartered and need nothing more: #2 and #3 became [THR-1121](https://linear.app/threadbare/issue/THR-1121), #4 is on the [THR-1043](https://linear.app/threadbare/issue/THR-1043) retrofit list. "Still not yet" is a valid ruling — it re-charters rather than closing.

### 2. Give the Encounter Factory design an attended session

[**THR-1043**](https://linear.app/threadbare/issue/THR-1043/the-encounter-factory-agentic-workflow-for-composition-complete) has sat in "In Design" since 2026-08-08. Your 2026-08-11 note asked for three missing sections to be backfilled into the plan doc (NFP compliance table, constants table, Substrate inventory) before it can move toward Ready for Dev; that hasn't happened, and no automated lane can author a plan doc (the orchestrator deliberately runs a cheaper model).

It holds the only design slot, so nothing player-facing can be staged behind it. It also now carries the retrofit bar for `encounter.slice.grateful_kin` — the convoluted prose and stat-only non-choices you flagged this morning.

*Raised by `tb-orchestrator`, 2026-08-15 runs a–c.*

### 3. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-15: **the four slice verdicts are withdrawn as an ask until the step interaction is fixed.** [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) — your own [THR-1121](https://linear.app/threadbare/issue/THR-1121) finding this morning showed the encounter step still runs the pre-nudge stance-purchase pattern, so the **UI** and **game** verdicts would rule on a surface you had already condemned. Re-asks once THR-1121 lands, as one sitting. This lane should not have invited the sitting at 09:57.
- 2026-08-15: **a consequence chip now links what it grants.** [THR-1120](https://linear.app/threadbare/issue/THR-1120) ([PR #1473](https://github.com/christianspliid-ui/threadbare/pull/1473)) — filed 10:00, live 10:39. The reward or penalty an ending hands out is reachable from the aftermath instead of merely named.
- 2026-08-15: **the main working copy is syncing again.** [THR-1119](https://linear.app/threadbare/issue/THR-1119) — after 14 consecutive hourly refusals and 27 commits of drift, the three blocking edits were triaged and the tree fast-forwarded cleanly. The automated watcher half is queued for the lane and needs nothing from you.
- 2026-08-15: **eleven dead modules deleted, four spared on re-check.** [THR-1089](https://linear.app/threadbare/issue/THR-1089) ([PR #1467](https://github.com/christianspliid-ui/threadbare/pull/1467)) — the batched prune sweep you asked for on 2026-08-11 instead of seven separate queue slots. Four candidates had gained a caller since the evidence was written and were kept.
- 2026-08-15: **the documentation-freshness gate stopped having blind spots.** [THR-1061](https://linear.app/threadbare/issue/THR-1061) ([PR #1465](https://github.com/christianspliid-ui/threadbare/pull/1465)) — two reference pages did not watch their own source files, so those systems could change without the docs being flagged stale.
- 2026-08-15: **the glossary can now say a word was rejected.** [THR-991](https://linear.app/threadbare/issue/THR-991) ([PR #1464](https://github.com/christianspliid-ui/threadbare/pull/1464)) — previously the only way to record a term we turned down was to mislabel it "deprecated", which reads as *was used, then dropped*.
- 2026-08-15: **grooming now judges what a ticket is worth, not just whether it is well-formed.** [THR-1090](https://linear.app/threadbare/issue/THR-1090) ([PR #1462](https://github.com/christianspliid-ui/threadbare/pull/1462)) — your 2026-08-11 queue review found a third of the shelf below the materiality bar on a board three lanes scan daily, none of which was ever asked to judge worth.
- 2026-08-15: **the lanes now clean up their own litter.** [THR-1056](https://linear.app/threadbare/issue/THR-1056) ([PR #1461](https://github.com/christianspliid-ui/threadbare/pull/1461)) — leftover files from scheduled runs had been jamming the sync that keeps the main working copy current. Workshop maintenance; nothing in the game changed.
- 2026-08-15: **an aftermath can no longer be picked twice.** [THR-1112](https://linear.app/threadbare/issue/THR-1112) ([PR #1460](https://github.com/christianspliid-ui/threadbare/pull/1460)) — the pick now refuses an aftermath the tick loop has already run, instead of quietly resolving it a second time.
- 2026-08-15: **the workspace repair now fires by itself.** [THR-1115](https://linear.app/threadbare/issue/THR-1115) ([PR #1459](https://github.com/christianspliid-ui/threadbare/pull/1459)) — the build-environment fault named one hour earlier is now self-healing, and refuses to run while anyone is working.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
