# Briefing

**Generated:** 2026-07-24 22:09 local (2026-07-24 20:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Still the one thing — same two commands as the last brief.**

**1. Your local game folder is still frozen at this morning's state.** The blocker is unchanged: a leftover one-line permission edit to `.claude/settings.local.json`, which the hourly sync deliberately refuses to overwrite. Until you unfreeze the tree, the copy of this inbox in your local folder is still the 07:09 edition — the server copy is the current one (the gap is now 71 commits and climbing; see Freshness). Nothing is at risk: zero unique work is stranded locally, and the one stray untracked file is byte-identical to the server copy. Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Alternatively, say the word in any chat session and it can land the grant via a small PR instead.

## Queue

**Healthy — 8 ready items, none blocked, none stale.** The executor picked up the top item at 22:02: surfacing mortal ambitions to you in play (THR-721, High) — so you'll be able to see what a hero *wants* without befriending them first.

**One board fault for the agents, not you: the party-formation ticket (THR-74) was swept to Done a third time.** It flipped at 21:33, two seconds after its checkpoint PR merged, while the executor's comment fifteen minutes earlier explicitly said "checkpoint, not a handoff." This time the PR and commit titles were clean — the previously-known vectors don't obviously explain it — which makes the queued hardening ticket (THR-738) more urgent than its Medium priority suggests. The remaining scope (three authored company moments, the two player actions, the rulebook section, and the final map/profile UI) is invisible to the hourly pickup until an agent session reopens it; tomorrow's 09:16 grooming run does exactly this kind of queue repair. No action needed from you.

## Freshness

**Home tree: on `main` but 71 commits behind the server**, one tracked edit blocking the self-heal — see Needs Christian item 1. Last local update was 07:13.

**Cleanup reaper: alive** — last run 21:40 (within the hour), tracking 24 worktrees / 33 branches / 1 stash, nothing awaiting a human decision.

**Note:** today's Friday retro (fires ~17:09) left no report in `Design/retros/` and no open PR — either it found nothing to say or it didn't run. The 07-23 close-out had earmarked "file the general home-tree ticket" for it; that filing is still outstanding. The next retro or grooming run should check the task's `lastRunAt`.

## What's moving

- **The Parting shipped (PR #807, merged 21:33).** When a company whose members you've threaded comes apart, it's now an authored farewell — bittersweet when the road simply ends, bitter when trust broke — instead of a silent bookkeeping line. Untethered companies still end quietly, as designed.
- **Earlier today:** magic items now genuinely make their bearers more capable (the item-power feature), and adventuring companies got their exclusive delves — three challenges only a bonded group of two or more can attempt.
- **Executor is now on THR-721:** making mortal ambitions visible in the journey panel and chronicle.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
