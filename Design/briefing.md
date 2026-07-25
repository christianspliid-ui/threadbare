# Briefing

**Generated:** 2026-07-25 18:11 local (2026-07-25 16:11 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One thing, and it is genuinely yours: GitHub has stopped running our automated checks because of a payment problem on the account.**

- **What to do:** open GitHub → **Settings → Billing & plans**, and either clear the failed payment or raise the spending limit. That is the entire fix, and no agent can do any part of it.
- **How we know, stated carefully because the last brief said the opposite.** At 17:21 I wrote that this was *not* a spending cap. That was a reasonable call on the evidence available then, and it is now wrong. GitHub is naming the cause itself, in its own words on the failed runs: *"The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings."* I re-ran a check from scratch a few minutes ago as a deliberate test, and it died the same way in six seconds. That re-run is the whole difference: this morning's identical-looking stumble at 15:12 recovered on its own, which is why calling it a billing problem then was wrong. This one reproduces on demand and carries GitHub's own explanation.
- **What it costs while it lasts, in two parts.** First, finished work stops being marked finished — this afternoon's group-conflict work merged correctly and then sat looking unfinished because the small job that ticks it off never ran. Annoying, harmless. **Second, and this is the part worth your attention: the safety net over the game's main code line is currently open.** The rule that says "nothing gets in without passing the tests" is still switched on and still displayed — but when the checks can't start, they are recorded as *skipped*, and a skipped check counts as a passed one. So for as long as this lasts, code can reach the main line with zero tests having run. Nothing harmful has taken that path — the only things that have are this briefing file and one written-up note — and the agents have been told to stop shipping game code until it clears. But the guarantee you think you have is not there right now.
- **No rush in the sense of minutes; real in the sense of hours.** Nothing is on fire and nothing will be lost. The cost is that the whole automated lane is idling, and the longer it idles the more work piles up behind a gate that cannot open.

**Also carried, unchanged, optional — five roadmap projects marked "in progress" with nothing left in them.** "Agent Coordination Protocol", "Repo Health", "Marketing Site", "Small manual tweaks" and "Procedural Hex Vignettes" have each had their last item finished. The tidy-up rule says close them; each one's own description says it is meant to be a *permanent home* for a kind of work. The standing recommendation is to leave them open as intake buckets, so "in progress with nothing in it" reads as "no current work". **That holds by default** — it only needs you if you would rather the roadmap only ever show projects with live work. Yes/no, no rush; ignoring it changes nothing.

## Queue

**Healthy — 13 ready items, nothing urgent, nothing stale.** Everything waiting is Medium or Low, and every item was touched within the last two days.

**But the lane is deliberately parked, not stuck.** The 17:00 worker took one look at the situation above, declined to start new game code into an unguarded main line, and spent its hour doing the right thing instead: proving the cause, writing it down, and filing the durable fix. That is the correct trade — a healthy queue loses nothing by waiting an hour, and an unguarded main line is not worth one hour of throughput. Work resumes on its own once the billing clears.

**One piece of tidying is queued for whoever picks up next:** this afternoon's group-versus-group work is completely finished and merged, but still reads as "being worked on" because the job that marks it done could not run. The slot it was holding has already been released by hand, so nothing is blocked behind it — it just needs its status corrected once checks run again. Agent work, not yours.

## Freshness

**Home tree: on `main`, two commits behind the server** — well under the level worth flagging, and the sync job collects them within the hour. The same two leftovers persist and neither blocks anything: one tracked settings edit and one untracked file, Friday's weekly-retro write-up, still the only copy anywhere and still agent work to land.

**Cleanup reaper: alive** — last run 17:40, tracking 25 work folders / 34 branches / 1 stash, nothing awaiting a human decision.

**Automated checks: down since 15:05 UTC, cause confirmed above.** Publishing to the live site runs on a separate service and is untouched — the site is current with the code on the server.

## What's moving

**Nothing shipped this hour, on purpose.** The hour went into diagnosis rather than features, and the diagnosis was worth having: this is the *third* time this exact failure has hit us, and the previous two times it was rediscovered from scratch. It is now written down properly — including the one cheap test that separates "GitHub is having a bad minute" from "the account is blocked", which is what made today's first call wrong and today's second call safe. A ticket is filed, marked urgent, to have the hourly worker recognise this on sight and say so immediately instead of losing a run to it.

**Still true from earlier today, and still the headline:** the thing you asked for — a company of yours toppling a local assassins' guild by tangling with the guild's own band — is built, merged, and was watched running end to end this afternoon, with the guild's cohesion collapsing, yours rising, and a lasting grudge written between the two sides.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
