# User Action Required

**Last updated:** 2026-08-14 04:56 local (2026-08-14 02:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. One attended session to finish the aftermath work — [THR-1082](https://linear.app/threadbare/issue/THR-1082) / [PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415)

**Open a Claude Code session on the repo and say "finish THR-1082".** The session resolves the branch conflict, takes the full-size screenshot, and merges. Open 32 hours as of this update; the wait has since added a merge conflict in three files (two code, one generated), which the session also handles.

This is not a design or taste question — the new consequence chips are already built and your Law 13/15 sign-off is recorded. What is owed is the mechanical check that the new layout does not overflow or render off-screen, on two encounters across two outcome bands.

**Why it needs you specifically:** the automated hourly runs cannot start the game — the command that launches it needs someone present to approve it, so there is no running build for any agent to photograph.

**Cost of waiting:** two High-priority tickets are blocked behind the merge — [THR-1096](https://linear.app/threadbare/issue/THR-1096) (companion attachments) and [THR-1097](https://linear.app/threadbare/issue/THR-1097) (the content pass that rewrites the endings the chips summarise). Both are still in Todo, and THR-1097 is why the aftermath read half-finished when you looked on the 13th.

### 2. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-14: **the mad-lib encounters are getting written, five families deep.** Batch 1 authored the seven `deadly`-rated story beats; batches 2–5 drained **duel** (10 templates), **build** (16), **trade** (15) and **assist** (15) ([THR-1101](https://linear.app/threadbare/issue/THR-1101), PRs [#1434](https://github.com/christianspliid-ui/threadbare/pull/1434)–[#1438](https://github.com/christianspliid-ui/threadbare/pull/1438)). Three families now split near half-and-half between true mad-libs and authored prose with tokens wedged in, making the ratio predictive for scoping. 88 templates remain; the ticket stays open for them.
- 2026-08-13: **a ninth fix shipped without you.** Rites now take longer at higher tiers — a Legendary rite is no longer as quick as a Mundane one ([THR-1100](https://linear.app/threadbare/issue/THR-1100), [PR #1433](https://github.com/christianspliid-ui/threadbare/pull/1433)).
- 2026-08-13: **an eighth demo-path fix shipped without you.** The prose abstraction detector stopped gating and started ranking ([THR-1092](https://linear.app/threadbare/issue/THR-1092), [PR #1432](https://github.com/christianspliid-ui/threadbare/pull/1432)).
- 2026-08-13: **the aftermath *review* ask is withdrawn, under your own new rule.** Your ruling — *"i cannot evaluate gameplay before all elements of a system has been brought up to the same level. data, ui, content, logic"* — landed as [canon rule 5](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) ([PR #1431](https://github.com/christianspliid-ui/threadbare/pull/1431)). The gameplay look stays withdrawn until [THR-1097](https://linear.app/threadbare/issue/THR-1097)'s content pass lands with it. (The *screenshot* half is a separate, mechanical gate and is now standing ask 1 above.)
- 2026-08-13: **a seventh demo-path fix shipped without you.** Action cards stopped naming the graph and the backlog at the player ([THR-1085](https://linear.app/threadbare/issue/THR-1085), [PR #1428](https://github.com/christianspliid-ui/threadbare/pull/1428)).
- 2026-08-13: **a sixth demo-path fix shipped without you.** The ruins surfaces stopped speaking schema to the player ([THR-1080](https://linear.app/threadbare/issue/THR-1080), [PR #1427](https://github.com/christianspliid-ui/threadbare/pull/1427)).
- 2026-08-13: **a fifth demo-path fix shipped without you.** The Codex stopped speaking CRUD to the player ([THR-1076](https://linear.app/threadbare/issue/THR-1076), [PR #1426](https://github.com/christianspliid-ui/threadbare/pull/1426)).
- 2026-08-13: **a fourth demo-path fix shipped without you.** Three artifact verbs stopped telling the player they are "NOT YET WIRED" ([THR-1075](https://linear.app/threadbare/issue/THR-1075), [PR #1425](https://github.com/christianspliid-ui/threadbare/pull/1425)).
- 2026-08-13: **two more demo-path fixes shipped without you.** The Empower card is no longer artless ([THR-1074](https://linear.app/threadbare/issue/THR-1074), [PR #1424](https://github.com/christianspliid-ui/threadbare/pull/1424)) and the veil now says how long a moment lasts instead of counting ticks ([THR-1070](https://linear.app/threadbare/issue/THR-1070), [PR #1423](https://github.com/christianspliid-ui/threadbare/pull/1423)).
- 2026-08-13: **the demo-ready checkpoint is closed and defect-free.** [THR-986](https://linear.app/threadbare/issue/THR-986) went Done when its last player-visible defect shipped — the Chapter Ledger no longer prints `success_at_cost` at you ([PR #1422](https://github.com/christianspliid-ui/threadbare/pull/1422)).

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
