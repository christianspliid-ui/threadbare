# Briefing

**Generated:** 2026-07-25 04:09 local (2026-07-25 02:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Still the one thing — same two commands as the last brief.**

**1. Your local game folder is still frozen at yesterday morning's state.** The blocker is unchanged: a leftover permission edit to `.claude/settings.local.json`, which the hourly sync deliberately refuses to overwrite (three added lines, all tool-permission grants — nothing at risk). The gap is now 111 commits (was 106 an hour ago). The wrinkle still stands: the weekly-retro write-up exists **only** as a draft file in your local folder (`Design/retros/retro-2026-07-24-draft.md`), so the stash step below carries the only copy — safe, a stash is fully recoverable, and an agent session should land that report on the server via a small PR regardless (flagged under Freshness). Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Alternatively, say the word in any chat session and it can land the permission grants and the retro draft via a small PR instead.

*(No new doorbell sent for this — it's the same ask as the last ping, only the commit count moved.)*

## Queue

**Backed up — 16 ready items, 1 in dev.** Nothing is blocked, nothing is stale. The executor picked up **THR-738 at ~04:02** — hardening the auto-close that kept sweeping the party ticket to Done prematurely; fitting, since that ticket just closed *for real* (see What's moving). The other High item, junction-safe cleanup (THR-753), is now top of the ready queue. Sequencing note resolved: the missing-field sweep (THR-736) was waiting on the party work's files — that mutex released when THR-74 closed.

## Freshness

**Home tree: on `main` but 111 commits behind the server**, one tracked edit blocking the self-heal — see Needs Christian item 1. Two untracked local files: yesterday's grooming report (verified byte-identical to the server copy at earlier runs) and the weekly-retro draft (still the only copy anywhere — **agent work, not yours**: the next design or grooming session should commit it via a docs PR, same move as the 07-23 retro backup, PR #768).

**Cleanup reaper: alive** — last run 03:40 (within the hour), tracking 23 worktrees / 30 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **Party formation is finished — THR-74 closed for real at 01:57 (PR #821), and this close is verified, not another phantom.** The final PR deliberately carried the closing keyword and shipped the last pillar: companies are now *visible* — a ring on the map around each active company (gold when their fates are threaded together), a Company section on character profiles that speaks in prose ("holding", "fraying") instead of numbers, and a debug tab with the full roster. The whole arc landed across the week: authored founding/blessing/gathering/fraying/parting moments, the Bless this Company and Draw Together actions, and now the three player-facing surfaces. One piece was deferred with a ticket (THR-759): the interactive multi-step "Seeking Companions" encounter — the founding *moment* ships now, the playable *scene* is future work.
- **Zero open PRs** — everything merged on green.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
