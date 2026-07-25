# Briefing

**Generated:** 2026-07-25 19:15 local (2026-07-25 17:15 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**All clear — the GitHub billing ask from the last brief is withdrawn. Don't go pay anything on account of it.**

- **What changed.** An hour ago this file told you to open GitHub → Settings → Billing & plans and clear a failed payment. As of a few minutes ago the automated checks are running again. I tested it rather than assumed it: I took a check that had died at 18:13 without doing any work, ran it again at 19:09, and this time it did the whole job properly and passed. That is the same one-run test that proved the problem was real an hour ago, run in the other direction.
- **If you already fixed it, that's what fixed it, and thank you** — the timing fits. **If you didn't touch it, then it cleared on GitHub's side**, and the honest caveat is that it could come back. Either way there is nothing for you to do now.
- **Nothing was damaged while it lasted.** I checked rather than trusted it. The worry last hour was that the safety net over the game's main code line had quietly opened — that code could get in without tests running. It could have. But nothing did: everything that reached the main line during the whole outage was writing — three copies of this briefing, one standing-notes update, one written-up incident note. **Not a single line of game code went in untested.** The last real code change to land, this afternoon's group-conflict work, passed a genuine full check before it merged.

**Also carried, unchanged, optional — five roadmap projects marked "in progress" with nothing left in them.** "Agent Coordination Protocol", "Repo Health", "Marketing Site", "Small manual tweaks" and "Procedural Hex Vignettes" have each had their last item finished. The tidy-up rule says close them; each one's own description says it is meant to be a *permanent home* for a kind of work. The standing recommendation is to leave them open as intake buckets, so "in progress with nothing in it" reads as "no current work". **That holds by default** — it only needs you if you would rather the roadmap only ever show projects with live work. Yes/no, no rush; ignoring it changes nothing.

## Queue

**Healthy — 12 ready items, nothing urgent, nothing stale.** Everything waiting is Medium or Low, and every item was touched within the last two days.

**The lane has restarted.** Last hour's worker deliberately parked rather than ship game code into an unguarded main line — the right call, and it is now moot. Work on the "Reunite / Sunder" actions (the pair that let you pull a broken-up company back together, or push a strained one apart) was being actively worked as of ten minutes ago.

**One piece of tidying is now unblocked:** this afternoon's group-versus-group work is finished and merged but still reads as "being worked on", because the little job that ticks it off died during the outage. That job can now be re-run. The slot it was holding was already released by hand, so nothing is stuck behind it. Agent work, not yours.

## Freshness

**Home tree: on `main`, fully level with the server, nothing stranded.** Two leftovers persist and neither blocks anything: one tracked settings edit and one untracked file — Friday's weekly-retro write-up, still the only copy anywhere and still agent work to land.

**Cleanup reaper: alive** — last run 18:40, tracking 25 work folders / 35 branches / 1 stash, nothing awaiting a human decision.

**Automated checks: back up as of ~19:09 local**, after roughly two hours down. Publishing to the live site runs on a separate service and was untouched throughout.

## What's moving

**Reunite / Sunder is in progress** — the two ascendant actions that let you influence whether a company re-forms after a split or comes apart under strain.

**Still true from earlier today, and still the headline:** the thing you asked for — a company of yours toppling a local assassins' guild by tangling with the guild's own band — is built, merged, and was watched running end to end this afternoon, with the guild's cohesion collapsing, yours rising, and a lasting grudge written between the two sides.

**Worth keeping from the outage:** this was the third time this exact failure has hit, and the first two times it was rediagnosed from scratch. It is now written down, including the one cheap test that separates "GitHub is having a bad minute" from "the account is blocked" — the test that made this morning's first call wrong, this afternoon's call right, and this hour's all-clear trustworthy. A ticket is filed to have the hourly worker recognise it on sight.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
