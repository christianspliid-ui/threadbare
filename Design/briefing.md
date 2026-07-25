# Briefing

**Generated:** 2026-07-25 09:09 local (2026-07-25 07:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs you right now — and this is the first clean hour in four days.** Both items carried since yesterday closed between the 08:09 brief and this one:

- **You flipped the Linear setting.** The ticket that kept closing itself mid-work can no longer be closed by anything but a deliberate instruction. Worth recording: the click path we'd written for you was wrong — the toggle isn't under Settings → Integrations → GitHub, it's per-team under Settings → Team Threadbare → Workflows & automations → "when PRs are merged". You found it anyway. The remaining step is a two-minute live test that an agent runs, not you.
- **Your local game folder caught up.** It is now exactly level with the server — no gap at all, where the last brief measured 122 commits. Nothing to run.

The queue is draining on its own and the executor is mid-flight. Enjoy the quiet.

## Queue

**Backed up, just barely — 16 ready items against a soft ceiling of 15.** Planning is running slightly ahead of execution, which is a good problem: nothing is blocked and nothing is stale. THR-738 (the self-closing-tickets fix) is the only high-priority item and it is now *unblocked* by your flip — its last step is the scratch-issue verification, docs-only, safe to run alongside anything else. Everything else is Medium or Low: two hygiene sweeps from Friday's retro, the player-cast variance spec that already carries your "yes, with a safety floor", the group-conflict and Reunite/Sunder company designs, and a tail of small deferrals.

The executor is working on item on-use triggers — the change that makes a cursed or breakable item actually *do* something when used, rather than just describing itself in a tooltip. Its pull request is queued to merge itself the moment the tests go green.

## Freshness

**Home tree: current.** On `main`, exactly level with the server (0 behind, 0 stranded) — the four-day freeze is over. One leftover tracked edit remains (`.claude/settings.local.json`, three permission grants) but it is no longer blocking anything; the sync went through around it. Untracked: Friday's weekly-retro write-up (`Design/retros/retro-2026-07-24-draft.md`), still the only copy anywhere and still **agent work, not yours** — the next design or grooming session should land it via a docs PR.

**Cleanup reaper: alive** — last run 08:40 (29 minutes ago), tracking 23 worktrees / 33 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **Tickets can no longer close themselves (THR-738 — your half done, unblocked at 06:39).** The repo half merged overnight: our own workflow now only reacts to a deliberate, standalone closing line, so the keyword buried in a sentence is inert. With your team-settings flip, Linear's own integration can no longer sweep an issue to Done off a branch name or a title. Three days of a ticket being declared finished while work was still in it — closed at the cause.
- **A pass at trimming the always-loaded instructions is specced (THR-760, plan doc merged 08:41).** The file every session reads before doing anything has grown to the point where it repeats itself; the plan dedupes it against the three docs that actually own each rule, relocating rather than deleting.
- **Item on-use triggers are in flight (THR-719).** Consumables, breakage and curses stop being tooltip text and start firing as real effects.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
