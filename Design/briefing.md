# Briefing

**Generated:** 2026-07-28 18:57 local (2026-07-28 16:57 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**GitHub is refusing to run our safety checks because of a payment problem, and work is merging anyway.** This is the one thing today that only you can fix.

**Fix:** open GitHub → **Settings → Billing & plans** for the `christianspliid-ui` account, and either clear the failed payment or raise the spending limit.

GitHub's own message, word for word:

> The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings

**Why it matters, plainly.** Every change to the game is supposed to pass an automatic check — tests, type-check, build — before it is allowed in. Since about 18:00 local that check has not run **at all**: three separate attempts, each dying in four seconds without executing a single step. But the merges are still going through. So today's work is landing on the main line **unverified**. Nothing is known to be broken; the point is that nothing is being checked, and a real breakage would land just as quietly.

**There is a visible symptom already.** The agent-residence work finished and merged an hour ago, and its ticket is *still* showing as in-progress — the robot that ticks tickets off runs on the same blocked machinery, so it never fired. Anything that merges while this lasts will look unfinished on the board even when it is done.

**This is the third time.** It happened on 25 April, on 12 May, and you cleared the same block three days ago on 25 July. It has come back, which suggests the underlying card or limit is still not settled rather than a one-off. Worth a look at *why* while you are on the page.

**Not urgent to the minute** — the crew keeps working and nothing is lost. But every hour it stays broken is another hour of changes going in unchecked.

## Queue

**32 jobs ready, one on the bench, nothing stale.** Busy but healthy: two urgent, one high, six medium, twenty-three small. The depth is the usual steady state — roughly one job shipped and one or two new findings filed each hour — not a backlog piling up.

**Both urgent jobs are about the payment problem above**, from opposite ends: one is the alarm that should have warned us automatically, the other is today's incident. Neither can finish while the machinery they need is switched off, so they are waiting on your billing page rather than on the crew.

**The one job on the bench is finished and merged** — it only looks open because the tick-off robot is down. Not a real occupancy; the crew is free to take the next thing.

**Nine ready jobs still carry a name in the "who is working on this" field, and the crew only looks at jobs where that field is empty** — so they are invisible to the automatic pickup, including the single high-priority one. Up from seven yesterday. Mechanical, one line for any session with write access, and still not yours to fix.

**The encounter rewrite's first batch — 48 encounters, about nine in ten a player actually meets — remains the top visible job.**

## Freshness

**Your folder is healthy.** On the right branch, fully current, nothing stranded, nothing of yours sitting uncommitted. The cleanup reaper ran seventeen minutes ago: 32 worktrees, 44 branches, nothing awaiting a human decision. All eight active routines are on schedule — the ninth first fires on 1 August, which is expected.

**The live site is current.** Everything merged since the last publish was notes and docs, so no rebuild was needed. The site itself is fine and unaffected by the payment problem — that only blocks the checking machinery, not the published game.

**Discord: nothing new from you**, so no reply was owed and none was sent. A doorbell *was* rung this hour, for the billing item above.

## What's moving

**Agents now have a sense of home.** The residence work shipped this afternoon: a character can settle somewhere, and the world notices how long they have stayed. That unlocks two ways an ambition can finally be abandoned — the wanderer who stops wandering, the exile who never goes back — which previously could never trigger because nothing recorded where anyone lived.

**One thing worth knowing about how it was built:** residence is *observed*, not stamped on. Nobody declares a character a resident; the world watches where they keep ending up and draws the conclusion. That is the same grain as the rest of the simulation, and it means the state can be wrong in interesting ways rather than merely absent.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
