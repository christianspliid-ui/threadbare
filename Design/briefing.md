# Briefing

**Generated:** 2026-07-25 11:09 local (2026-07-25 09:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One optional preference — nothing is blocked on it, and the safe default is already in place.**

- **Five roadmap projects are marked "in progress" but have no work left in them.** "Agent Coordination Protocol", "Repo Health", "Marketing Site", "Small manual tweaks" and "Procedural Hex Vignettes" have all had their last item finished. The tidy-up rule says close them; each one's own description, though, says it's meant to be a *permanent home* for a kind of work ("where small manual tweaks directly driven by the human goes"), and Hex Vignettes is a paused experiment whose later phases were never written up. **This morning's grooming pass closed none of them** and recommends leaving them open as standing intake buckets — so "in progress with nothing in it" reads as "no current work", not "stalled". That stands unless you'd rather the roadmap only ever show projects with live work. **Yes/no, no rush** — ignoring it changes nothing.

Nothing else needs you. The queue is draining on its own and the executor is mid-flight.

## Queue

**Healthy again — 15 ready items, back under the soft ceiling of 15**, down from 16 at the last two briefs. Nothing is blocked and nothing has gone stale; every item was touched within the last two days. The self-closing-tickets fix is still the only High and is now in its final stretch — see below. Everything else is Medium or Low: two hygiene sweeps from Friday's retro, the player-cast variance spec that already carries your "yes, with a safety floor", the group-conflict and Reunite/Sunder company designs, the instruction-file slimming pass, and a tail of small deferrals.

The collision pattern named in the last two briefs — this briefing's own pull request knocking the executor's out of date — is now written up as a known impediment and ticketed, so it stops being rediscovered each hour. It self-corrects on the next pass; agent work, not yours.

## Freshness

**Home tree: on `main`, effectively current.** Four commits behind the server as of this run — well under the level that would mean the sync had stopped, and it reads as the ordinary lag of a busy morning rather than a stall; nothing is parked and nothing is stranded. The same two leftovers persist and neither blocks anything: one tracked settings edit (`.claude/settings.local.json`) and one untracked file, Friday's weekly-retro write-up, which is still the only copy anywhere and still agent work to land via a docs pass.

**Cleanup reaper: alive** — last run 10:40 (29 minutes ago), tracking 27 work folders / 35 branches / 1 stash, nothing awaiting a human decision. The folder count crept up from 25 because several sessions opened new ones this morning; that is normal churn, and the reaper clears them once their work merges.

## What's moving

- **The self-closing-tickets problem is now provably fixed — including your half of it.** This was the fault where a ticket marked itself finished because some unrelated pull request happened to mention its number — three times in two days on the same ticket. The repo-side fix shipped Thursday; the other half was the setting you switched off yesterday morning. Two fixes by two different parties with no test in between is exactly the shape of a fix that looks done and isn't, so the executor ran a live proof this hour: a throwaway ticket, plus two pull requests deliberately shaped to trip the fault. **The one designed to trip it left the ticket untouched; the one designed to close it properly closed it.** Both controls passed between 11:04 and 11:08. Tickets still link to their pull requests — they just stop moving themselves, which is the end state you asked for.
- **Item effects landed (10:27).** Consumables, breakage and curses stop being tooltip text and start firing as real effects — all nine triggers ported. This was the item flagged as "one green test run away" in the last brief.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
