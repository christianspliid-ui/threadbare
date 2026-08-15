# User Action Required

**Last updated:** 2026-08-15 11:57 local (2026-08-15 09:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Say the consequence verdict — one line closes it

[**THR-974**](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) — you re-played it this morning on production and filed four findings, but the session note records the ruling itself as still pending.

**The question:** after a hand resolves, does the consequence read as a real thing that happened to that person — noun, direction, rough magnitude — rather than an ungaugeable adverb? You ruled **"not yet"** on 2026-08-10 (*"what does steadily even mean?"*).

**Changed since you looked:** your finding #1 (no links to any reward/penalty attachment) shipped 39 minutes after you filed it and is live — [THR-1120](https://linear.app/threadbare/issue/THR-1120/consequence-chips-name-their-rewardpenalty-attachment-but-never-link). A chip now links the attachment its ending grants.

**Straight to an ending:** [threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

Your other three findings are chartered and need nothing more: #2 and #3 became [THR-1121](https://linear.app/threadbare/issue/THR-1121) (now shipped and live), #4 is on the [THR-1043](https://linear.app/threadbare/issue/THR-1043) retrofit list. "Still not yet" is a valid ruling — it re-charters rather than closing.

### 2. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-15: **the Encounter Factory ask was this lane's error — withdrawn, nothing owed by you.** [THR-1043](https://linear.app/threadbare/issue/THR-1043) was briefed for several days as needing your attended session. In fact you approved the plan 2026-08-08, the authoring format locked 2026-08-09 ([THR-883](https://linear.app/threadbare/issue/THR-883) closed on the amended spec + full-contract exemplar), and the three plan-doc sections your 2026-08-11 review asked for merged at 10:14 today ([PR #1471](https://github.com/christianspliid-ui/threadbare/pull/1471)). What remains is running the retrofit batches — a lane's job; you enter only to sample 2 of 6 after a batch runs.
- 2026-08-15: **the encounter veil stopped selling odds.** [THR-1121](https://linear.app/threadbare/issue/THR-1121) ([PR #1474](https://github.com/christianspliid-ui/threadbare/pull/1474)) — the `supportive / coercive / withdrawn` stance purchases behind Intervene/Resume, which you condemned at 10:00, are gone from the veil and the fix is deployed. Two follow-ups fell out and are queued: one quest encounter still decorating the old triple, and a percentage readout that survives only off the surface you review.
- 2026-08-15: **the four slice verdicts are still not a sitting to book, for a smaller reason than this morning.** [THR-907](https://linear.app/threadbare/issue/THR-907) — with THR-1121 live, firing, UI and game are judgeable. Prose is not: `encounter.slice.grateful_kin` is unretrofitted, so that ruling would land on content already known to be below bar. Re-asks as one sitting when the retrofit batch runs.
- 2026-08-15: **a consequence chip now links what it grants.** [THR-1120](https://linear.app/threadbare/issue/THR-1120) ([PR #1473](https://github.com/christianspliid-ui/threadbare/pull/1473)) — filed 10:00, live 10:39. The reward or penalty an ending hands out is reachable from the aftermath instead of merely named.
- 2026-08-15: **the main working copy is syncing again.** [THR-1119](https://linear.app/threadbare/issue/THR-1119) — after 14 consecutive hourly refusals and 27 commits of drift, the three blocking edits were triaged and the tree fast-forwarded cleanly. The automated watcher half is queued for the lane and needs nothing from you.
- 2026-08-15: **eleven dead modules deleted, four spared on re-check.** [THR-1089](https://linear.app/threadbare/issue/THR-1089) ([PR #1467](https://github.com/christianspliid-ui/threadbare/pull/1467)) — the batched prune sweep you asked for on 2026-08-11 instead of seven separate queue slots. Four candidates had gained a caller since the evidence was written and were kept.
- 2026-08-15: **the documentation-freshness gate stopped having blind spots.** [THR-1061](https://linear.app/threadbare/issue/THR-1061) ([PR #1465](https://github.com/christianspliid-ui/threadbare/pull/1465)) — two reference pages did not watch their own source files, so those systems could change without the docs being flagged stale.
- 2026-08-15: **the glossary can now say a word was rejected.** [THR-991](https://linear.app/threadbare/issue/THR-991) ([PR #1464](https://github.com/christianspliid-ui/threadbare/pull/1464)) — previously the only way to record a term we turned down was to mislabel it "deprecated", which reads as *was used, then dropped*.
- 2026-08-15: **grooming now judges what a ticket is worth, not just whether it is well-formed.** [THR-1090](https://linear.app/threadbare/issue/THR-1090) ([PR #1462](https://github.com/christianspliid-ui/threadbare/pull/1462)) — your 2026-08-11 queue review found a third of the shelf below the materiality bar on a board three lanes scan daily, none of which was ever asked to judge worth.
- 2026-08-15: **an aftermath can no longer be picked twice.** [THR-1112](https://linear.app/threadbare/issue/THR-1112) ([PR #1460](https://github.com/christianspliid-ui/threadbare/pull/1460)) — the pick now refuses an aftermath the tick loop has already run, instead of quietly resolving it a second time.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
