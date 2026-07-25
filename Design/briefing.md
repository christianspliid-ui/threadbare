# Briefing

**Generated:** 2026-07-25 10:10 local (2026-07-25 08:10 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One optional preference — nothing is blocked on it, and the safe default is already in place.**

- **Five roadmap projects are marked "in progress" but have no work left in them.** "Agent Coordination Protocol", "Repo Health", "Marketing Site", "Small manual tweaks" and "Procedural Hex Vignettes" have all had their last item finished. The tidy-up rule says close them; each one's own description, though, says it's meant to be a *permanent home* for a kind of work ("where small manual tweaks directly driven by the human goes"), and Hex Vignettes is a paused experiment whose later phases were never written up. **This morning's grooming pass closed none of them** and recommends leaving them open as standing intake buckets — so "in progress with nothing in it" reads as "no current work", not "stalled". That stands unless you'd rather the roadmap only ever show projects with live work. **Yes/no, no rush** — ignoring it changes nothing.

Nothing else needs you. The queue is draining on its own and the executor is mid-flight.

## Queue

**Backed up, just barely — 16 ready items against a soft ceiling of 15**, unchanged from the last two briefs. Nothing is blocked and nothing has gone stale (every item was touched within the last two days). THR-738, the self-closing-tickets fix, is still the only High, and its last step is a two-pull-request live test proving the new rule works — docs-only, safe to run alongside anything. Everything else is Medium or Low: two hygiene sweeps from Friday's retro, the player-cast variance spec that already carries your "yes, with a safety floor", the group-conflict and Reunite/Sunder company designs, and a tail of small deferrals.

One pattern worth naming because it keeps recurring: **this briefing's own pull request keeps knocking the executor's out of date.** The repo requires a branch to be level with `main` before it may merge, and hourly automation merging into `main` is enough to unseat whatever else is queued behind it. The grooming pass caught and repaired exactly that at 09:23; the same collision is likely again this hour. It self-corrects on the next pass and is already ticketed — agent work, not yours.

## Freshness

**Home tree: current.** On `main`, exactly level with the server (0 behind, 0 stranded). One leftover tracked edit (`.claude/settings.local.json`) and one untracked file — Friday's weekly-retro write-up, `Design/retros/retro-2026-07-24-draft.md` — remain; neither blocks the sync, and landing the retro is agent work for the next docs pass, still the only copy anywhere. Local dependencies are healthy (284 packages, 99 tool shims present).

**Cleanup reaper: alive** — last run 09:40 (30 minutes ago), tracking 25 worktrees / 34 branches / 1 stash, nothing awaiting a human decision. Its new safety guard is visibly working: this morning's log shows it severing a work folder's shared-dependency link before deleting the folder, which is precisely the step whose absence twice wiped the shared install.

## What's moving

- **Item on-use triggers are one green test run from landing (THR-719).** All nine triggers are ported — consumables, breakage and curses stop being tooltip text and start firing as real effects. The pull request is armed to merge itself the moment tests pass.
- **This morning's backlog tidy-up landed (09:24).** It closed five duplicate scan reports that had been filed twice over, and confirmed every one of the 96 open items belongs to a project.
- **The design-audit pipeline was repaired (07:11).** Three of its inputs had drifted out of step with what they audit against.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
