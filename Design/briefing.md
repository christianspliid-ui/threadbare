# Briefing

**Generated:** 2026-07-25 15:12 local (2026-07-25 13:12 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two items. The first is new this hour, and it has stopped anything from shipping.**

- **The machinery that checks and publishes the game has hit its monthly allowance. Nothing can go live until it resets or you top it up.** At **14:27 today** the automated checks stopped running — not failing, *not starting*: three separate jobs, across three unrelated pieces of work, each quit in under a second having done nothing at all, while everything an hour earlier ran normally. In the same minute the site host began refusing to publish with *"deployment rate limited — retry in 24 hours"* and a link to its paid plan. Two independent services hitting a wall in the same minute points at one cause: **the free monthly allowance on this private project is used up.** **What it means in practice:** the work itself continues — the executor can still build and propose changes — but *nothing can merge and nothing reaches the live site*, because the safety check that must pass before anything lands can no longer run. That includes this briefing file, so if it stops updating, this is the reason. **What only you can do:** on GitHub, open your account **Settings → Billing and licensing** and look at the Actions minutes used and the spending limit; then check the site host's plan the same way. **Both directions have a cost:** raising the limit or upgrading is a paid change, while waiting is free — the site host's own block clears by itself in 24 hours, and the monthly allowance resets at the start of the next billing cycle. **My recommendation: wait it out, unless you want work shipping again today.** One honesty note — I could not read the billing page myself (my access doesn't extend to it), so the *cause* is strongly indicated rather than confirmed; the outage itself is measured, not guessed.

- **Carried, unchanged, optional — five roadmap projects marked "in progress" with no work left in them.** "Agent Coordination Protocol", "Repo Health", "Marketing Site", "Small manual tweaks" and "Procedural Hex Vignettes" have each had their last item finished — re-checked live this run, all five still sit in an active status. The tidy-up rule says close them; each one's own description, though, says it's meant to be a *permanent home* for a kind of work ("where small manual tweaks directly driven by the human goes"), and Hex Vignettes is a paused experiment whose later phases were never written up. This morning's grooming pass closed none of them and recommends leaving them open as standing intake buckets — so "in progress with nothing in it" reads as "no current work", not "stalled". **That recommendation holds by default**; it only needs you if you'd rather the roadmap only ever show projects with live work. **Yes/no, no rush** — ignoring it changes nothing.

## Queue

**13 ready items — healthy by count, but the exit is blocked.** Everything waiting is Medium or Low priority; nothing is blocked on another ticket and nothing has gone stale, every item having been touched within the last two days. The constraint this hour isn't the queue, it's the outage above: finished work can pile up but cannot land.

What's waiting: two hygiene sweeps from Friday's retro, the Reunite/Sunder company designs, the instruction-file slimming pass, two vocabulary proposals, and a tail of small deferrals. One item is being worked right now — the group-versus-group fighting, on its second stretch.

## Freshness

**Home tree: on `main` and level with the server** — zero commits behind, nothing parked, nothing stranded. The same two leftovers persist and neither blocks anything: one tracked settings edit (`.claude/settings.local.json`) and one untracked file, Friday's weekly-retro write-up, still the only copy anywhere and still agent work to land.

**Cleanup reaper: alive** — last run 14:40 (32 minutes ago), tracking 24 work folders / 34 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **The second half of the group-versus-group work was finished and proposed at 14:26** — companies and NPC bands resolving a fight as one contested pair, rather than as a crowd of unrelated individuals. It is queued to land automatically the moment it passes its checks. **It has not passed them, and not because anything is wrong with it:** the checks never ran at all — this is the same 14:27 outage described above, which began one minute after the work was proposed. So the fighting itself is written but unproven; treat it as pending, not as landed.
- **Everything up to 14:12 landed clean**, including the previous hour's briefing and the first half of the group work — the NPC band spawner, which merged at 13:41 and is genuinely live.
- **One item in flight, one proposal waiting, nothing else queued.** No other work is stuck behind the outage yet; if it persists, the next few hours will start accumulating.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
