# Briefing

**Generated:** 2026-07-25 17:21 local (2026-07-25 15:21 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing is blocked on you. One optional preference, carried unchanged.**

- **Carried, unchanged, optional — five roadmap projects marked "in progress" with no work left in them.** "Agent Coordination Protocol", "Repo Health", "Marketing Site", "Small manual tweaks" and "Procedural Hex Vignettes" have each had their last item finished — re-checked live this run, all five still sit in an active status. The tidy-up rule says close them; each one's own description, though, says it's meant to be a *permanent home* for a kind of work ("where small manual tweaks directly driven by the human goes"), and Hex Vignettes is a paused experiment whose later phases were never written up. This morning's grooming pass closed none of them and recommends leaving them open as standing intake buckets — so "in progress with nothing in it" reads as "no current work", not "stalled". **That recommendation holds by default**; it only needs you if you'd rather the roadmap only ever show projects with live work. **Yes/no, no rush** — ignoring it changes nothing.

## Queue

**Healthy — 13 ready items, and nothing urgent on the board.** Everything waiting is Medium or Low, and nothing has gone stale — every item was touched within the last two days.

**One thing needs an agent's hands this hour, not yours: the group-versus-group work is finished, and the board doesn't know it.** Its fourth and final piece landed at 17:05, carrying the correctly-written instruction that marks the ticket finished. The small automation that reads that instruction and moves the ticket **failed to start** in the same second (see Freshness below), so the ticket still reads "being worked on" while every part of it is merged. The cost is real but contained: the hourly worker allows itself one job at a time, so it may look at a slot held by *finished* work and stand down instead of starting the next thing. It needs a re-run and a status correction — squarely agent work, and the next session or pickup run can do it.

**One ordering note, no action needed:** the Reunite/Sunder company designs deliberately must not run at the same time as that group-conflict work — they touch the same company code. They free up as soon as the ticket above is marked finished.

## Freshness

**Home tree: on `main`, four commits behind the server.** Those four *are* the group-conflict work that landed in the last half hour; the sync job collects them within the hour, and this is well under the level worth flagging. The same two leftovers persist and neither blocks anything: one tracked settings edit (`.claude/settings.local.json`) and one untracked file, Friday's weekly-retro write-up, still the only copy anywhere and still agent work to land.

**Cleanup reaper: alive** — last run 16:40, tracking 24 work folders / 32 branches / 1 stash, nothing awaiting a human decision.

**Automated checks: broken since 17:05, and the safety net is currently open.** Runs start and die within five seconds having executed **no work at all** — the startup signature, not a test failure. The code itself is fine, independently: the group-conflict branch ran a full green suite seventeen minutes before it landed (885 files, 13,200 tests, clean build), and publishing is untouched — the live site rebuilt from the exact version now on the server at 17:06 and reports success. **Deliberately not calling this a spending cap:** that conclusion was drawn from this identical signature at 15:12 today and retracted as wrong four minutes later. This is a stumble at the automation provider, unacknowledged on their own status page, which currently reports everything healthy.

**The part worth knowing, and it is the reason this brief was rewritten twice:** this briefing's own pull request was the probe, and it came back worse than expected. Its checks also died in four seconds — *and it merged anyway, two seconds later.* The reason is a gap in how the gate is wired: when the little job that decides *whether* to run the tests dies, the test job itself is recorded as **skipped**, and a skipped check counts as a passed one. So for as long as this lasts, **anything can land on the main line without a single test having run.** Nothing bad got in — the only thing that took that path is this text file, and it says what I meant it to say — but the next agent to merge actual game code needs to know the net is open and check the tests by hand. **Nothing here is yours to fix**; it is written down so it cannot be discovered the hard way.

## What's moving

**The founding image is finished.** The last piece of company-versus-band conflict landed at 17:05, closing the four-part run that started this morning:

- **A way to summon the opposition (`spawn band`).** You can now make a chosen faction field its muscle on demand instead of waiting for one to appear — and when it refuses, it says *which* condition stopped it, because "why is this guild not mustering?" is the question anyone actually asks.
- **Rivals, in the company's own panel.** A company that has fought someone now says so in a sentence — *"There is blood between them and The Errant Keys of The Arcane Circle"* — never a tally, and absent entirely for a company that has never come to blows.
- **The bug worth knowing about: one missing hyphen hid the headline scene.** The capstone — *The Guild Falls* — and the band's answering encounter were both waiting for a place called `guildhall`. The world only ever builds `guild-hall`. Thirty-four of those exist on a test world; none of the unhyphenated spelling exists anywhere, on any seed. So the ticket's own centrepiece was unreachable by construction, while the test suite stayed green throughout. It is fixed, and locked by a check that *derives* the list of real places rather than trusting a hand-written one.

**So the thing you asked for is now watchable:** a company of yours toppling a local assassins' guild by tangling with the guild's own band — run headlessly end to end this afternoon, with the guild's cohesion collapsing, yours rising, and a lasting grudge written between the two sides.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
