# User Action Required

**Last updated:** 2026-08-15 08:00 local (2026-08-15 06:00 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Give the Encounter Factory design an attended session

[**THR-1043**](https://linear.app/threadbare/issue/THR-1043/the-encounter-factory-agentic-workflow-for-composition-complete) has sat in "In Design" since 2026-08-08. Your note on 2026-08-11 asked for three missing sections to be backfilled into the plan doc before it can move toward Ready for Dev; that hasn't happened, and no automated lane can author a plan doc (the orchestrator deliberately runs a cheaper model).

It is now the choke point on the feature pipeline, not just a stale ticket: the Ready-for-Dev shelf holds only Low-priority workshop cleanup, and the design lane stages one thing at a time — so nothing player-facing can be queued behind THR-1043 while it sits.

*Raised by `tb-orchestrator`, 2026-08-15 runs a and b.*

### 2. Rule the consequence verdict — play one encounter through to its aftermath

[**THR-974**](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) — the last verdict still open on the Encounter Experience map. You ruled it **"not yet"** on 2026-08-10 because the chips were unreadable (*"what does steadily even mean?"*). Everything you chartered against that ruling has shipped and deployed: the icon vocabulary ([THR-1082](https://linear.app/threadbare/issue/THR-1082)) and the rewrite of all 55 authored consequences ([THR-1097](https://linear.app/threadbare/issue/THR-1097)), on top of the logic ([THR-969](https://linear.app/threadbare/issue/THR-969)) and UI ([THR-971](https://linear.app/threadbare/issue/THR-971)). Level re-checked 2026-08-15 06:00 UTC — deployed artifact current (`4867ce10`).

**The question:** after a hand resolves, does the consequence read as a real thing that happened to that person — noun, direction, rough magnitude — rather than an ungaugeable adverb?

**Free play**: [threadbare.vercel.app/?view=game&seeded&size=medium&forceencounters](https://threadbare.vercel.app/?view=game&seeded&size=medium&forceencounters) · **straight to any ending**: [the review table in THR-1097's closeout](https://linear.app/threadbare/issue/THR-1097).

One honest seam, by design: no encounter authors a `success` band — the base text *is* the ordinary win, so `?outcome=success` reports `unauthored_band` correctly. "Needs another iteration" is a valid ruling; it closes the verdict and charters the follow-up. When this closes, the map ([THR-902](https://linear.app/threadbare/issue/THR-902)) closes with it.

### 3. One command on your machine — the main working copy stopped updating

The working copy at `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator` last synced at 20:50 on 2026-08-14 and is now **25 commits behind, growing every hour** (23 an hour ago). Three locally-modified files block the automatic fast-forward, and per [THR-937](https://linear.app/threadbare/issue/THR-937) this shape never resumes on its own — every hourly attempt re-hits the same collision. No automated lane may run git operations there ([THR-672](https://linear.app/threadbare/issue/THR-672)), so it needs you or an attended session.

```
cd 'C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator'
git stash push -m home-tree-recovery
git pull --ff-only origin main
```

Nothing is destroyed: `git stash push` keeps all three edits and `git stash show -p` reads them back. Two are local permission-allowlist entries in `.claude/settings*.json`; the third is an impediment row that needs re-filing under a fresh id afterwards — an agent's job, not yours. Nothing in the game is affected — worktrees fetch `main` directly. The risk is a future session branching off a stale copy.

### 4. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-15: **the documentation-freshness gate stopped having blind spots.** [THR-1061](https://linear.app/threadbare/issue/THR-1061) ([PR #1465](https://github.com/christianspliid-ui/threadbare/pull/1465)) — two reference pages did not watch their own source files, so those systems could change without the docs being flagged stale.
- 2026-08-15: **the glossary can now say a word was rejected.** [THR-991](https://linear.app/threadbare/issue/THR-991) ([PR #1464](https://github.com/christianspliid-ui/threadbare/pull/1464)) — previously the only way to record a term we turned down was to mislabel it "deprecated", which reads as *was used, then dropped*.
- 2026-08-15: **grooming now judges what a ticket is worth, not just whether it is well-formed.** [THR-1090](https://linear.app/threadbare/issue/THR-1090) ([PR #1462](https://github.com/christianspliid-ui/threadbare/pull/1462)) — your 2026-08-11 queue review found a third of the shelf below the materiality bar on a board three lanes scan daily, none of which was ever asked to judge worth. The daily grooming lane now runs a materiality sweep and cancels with its reason recorded.
- 2026-08-15: **the lanes now clean up their own litter.** [THR-1056](https://linear.app/threadbare/issue/THR-1056) ([PR #1461](https://github.com/christianspliid-ui/threadbare/pull/1461)) — leftover files from scheduled runs had been jamming the sync that keeps the main working copy current. Workshop maintenance; nothing in the game changed.
- 2026-08-15: **an aftermath can no longer be picked twice.** [THR-1112](https://linear.app/threadbare/issue/THR-1112) ([PR #1460](https://github.com/christianspliid-ui/threadbare/pull/1460)) — the pick now refuses an aftermath the tick loop has already run, instead of quietly resolving it a second time.
- 2026-08-15: **the workspace repair now fires by itself.** [THR-1115](https://linear.app/threadbare/issue/THR-1115) ([PR #1459](https://github.com/christianspliid-ui/threadbare/pull/1459)) — the build-environment fault named one hour earlier is now self-healing, and refuses to run while anyone is working. Filed to the shelf at 23:33 and drawn back down by 00:30.
- 2026-08-14: **the tool that wipes a workspace now says its own name.** [THR-1111](https://linear.app/threadbare/issue/THR-1111) ([PR #1458](https://github.com/christianspliid-ui/threadbare/pull/1458)) — a recurring build-environment fault agents kept rediscovering by hand is now named and visible the moment it happens. Workshop maintenance; nothing in the game changed.
- 2026-08-14: **one renderer now draws both halves of the aftermath.** [THR-1105](https://linear.app/threadbare/issue/THR-1105) ([PR #1457](https://github.com/christianspliid-ui/threadbare/pull/1457)) — the consequence chip and the reaction label each ran their own copy of the same link-and-tooltip rule. They now share one, with the chip tests passing unchanged.
- 2026-08-14: **the Codex stopped naming its own enums.** [THR-1113](https://linear.app/threadbare/issue/THR-1113) ([PR #1456](https://github.com/christianspliid-ui/threadbare/pull/1456)) — the browsable catalog at [`?view=codex`](https://threadbare.vercel.app/?view=codex) still showed raw agreement and resource keys where it should read as English. This was the residue THR-1103 deliberately left behind rather than quietly dropping.
- 2026-08-14: **withdrawn — the slice verdict session was never open.** [THR-907](https://linear.app/threadbare/issue/THR-907) was briefed as a live ask for three consecutive hours. It was not: you ruled all four verdicts on 2026-08-10 (prose *"this is the bar"*, firing *"rhythm works, prune later"*, UI *"the encounter view is good enough"*, game *"the decisions land"*). It stays open pending an agent-authored plan-doc carve-up, which is not your work. The ask is retired.

---
*Refreshed hourly by `keep-work-flowing-cc`. Full history of every prior version: `git log -p origin/ops -- Design/user-actions.md`.*
