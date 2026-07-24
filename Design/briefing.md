# Briefing

**Generated:** 2026-07-24 10:11 local (2026-07-24 08:11 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs you right now.** The four Cowork switches are flipped (done this morning — the migration is closed end to end), and the "queue is empty, point the next design pass" lever from the last brief resolved itself: a design session refilled the board an hour later. The lane is feeding itself.

## Queue

**Healthy — 7 ready, 1 in dev.** The board refilled this morning after yesterday's full drain, and the executor is mid-flight on **Party Formation & Group Mechanics** (THR-74, the highest-priority item on the board). Nothing in the ready queue is blocked or stale — the oldest item is three days old.

## Freshness

**Home tree: on `main`, nothing stranded, but 7 commits behind the server and not self-healing.** One tracked file is edited in place — `.claude/settings.local.json`, a two-line permission-grant addition — and autosync refuses to fast-forward a tree with tracked edits. This is the same benign class as 2026-07-23, which an agent session resolved by landing the edit via a docs PR (PR #768); fourth occurrence of the dirty-tree-blocks-self-heal class, and today's 17:09 weekly retro is the standing place to finally file the general ticket. Practical effect for you: until it clears, the home tree serves slightly stale files (this morning's briefings included) — your next interactive session's precheck will surface it as `behind:7`, and the repair is agent work, not yours.

Also sitting untracked in the home tree: this morning's backlog-grooming report (`Docs/ops/backlog-grooming-2026-07-24.md`). Untracked files are inert, but the grooming task should have committed its own report via PR — noted as a process miss for the retro.

**Cleanup reaper: alive and healthy** — last run 09:40 (within the hour), tracking 25 worktrees / 33 branches / 1 stash, nothing flagged for a human decision.

## What's moving

- **Party formation is being built (THR-74).** The first slice — letting groups of mortals qualify for actions together — merged overnight; the executor continues on the remaining slices.
- **Overnight incident, already contained:** THR-74 was wrongly marked Done at 00:41 because a merged PR's *title* happened to contain "THR-74" — the auto-close read it as a completion claim. It was reopened, and a hardening ticket (THR-738) is on the queue so bare ticket numbers in titles stop triggering closes. Third known instance of this failure class; no work was lost.
- **Your Tuesday "yes" on player-cast variance is packaged (THR-728):** paid miracles roll the same outcome ladder mortals use, floored at "the miracle lands crooked" — never outright failure. Plan doc landed this morning; it's Ready for Dev.
- The rest of the morning's refill: two vocabulary proposals (group-layer terms, encounter-surface terms), a sweep for 18 action templates missing a required field, wiring trait-granting item effects to a real consumer, and a fix for drifted design-audit inputs.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
