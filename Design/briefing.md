# Briefing

**Generated:** 2026-07-27 04:54 local (2026-07-27 02:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Same one question as last hour. No ping sent.**

Should the ceremonial reveal screens — the Civ-style "you unlocked this" moment you asked for — be built next, or stay in line? Asked once at 11pm, still open, still safe to ignore. Silence means "leave it in line", and it has.

Nothing moved around it this hour. Answer whenever, or never.

## Queue

**20 jobs ready — eight middling, twelve minor, none urgent. Nothing on the workbench, nothing waiting to be approved.**

The count went 21 → 20: one job shipped, nothing new written down. Three hours running of one out and none in.

I have declined to call this a turning point twice now, and I decline a third time — the three earlier dips each lasted exactly one hour, and three is no more a trend than two. The composition is the honest part: nothing on the shelf is urgent, nothing has gone cold, nothing waits on anything else, and every recent arrival was something the crew tripped over while fixing something adjacent. One job on the shelf is something **you** asked for.

## Freshness

**Home tree: level with the server, nothing stranded.** The same two small leftovers as the last fourteen hours — a permissions edit to the tool config, and Friday's retro write-up. Both are the crew's to land; neither blocks anything.

**Cleanup reaper: alive, ran fourteen minutes ago, clean, nothing awaiting a human decision.** Flat — no workspaces finished this hour, and it left the live ones alone.

**Discord: nothing new in the channel this hour.** Genuinely empty rather than unread.

## What's moving

**The game now has a watchman for whether it actually reached players.**

Every time work is approved, it is supposed to go live within a minute or two. The only signal anyone had that this happened was a green tick from the publishing service — and that tick has two meanings. It means "published". It also means "we looked at this and decided nothing needed publishing". Same tick, same colour, no way to tell them apart from the outside.

That ambiguity had already produced one false all-clear. Yesterday a commit reported a perfectly green tick while having **no publication behind it at all** — the publisher had skipped the build, and reported the skip as a success. Anyone reading the tick would have concluded the game was live when it was not. Worse, this is precisely the signal nobody is required to look at: it deliberately does not block approvals, so the habit is to walk past it.

Tonight's job replaces the tick with a question asked directly of the publisher: *which version of the game are you actually serving right now?* Then it compares that against the newest approved work and reaches one of four honest answers — live, nothing-to-publish, still-building, or **stopped**. Only the last two can ever reach you, and only after a twenty-minute grace period so a slow build is never mistaken for a failure.

**The detail worth admiring is how it avoids going stale.** To judge "nothing needed publishing" it has to know what counts as a real change — and rather than keep its own copy of that list, it reads the publisher's list, the same one the publisher uses to make the decision. A copy would drift the moment someone edited one side, and a drifted copy would quietly start rubber-stamping every skip as harmless, which is the exact failure the job exists to catch. There is now no second list to drift.

This brief is the first one it has filed. **Its verdict: the live game is serving tonight's newest work.** Previous briefs asserted that from a green tick; this one asked.

**A note this file has been carrying since yesterday closed itself in the process.** The observation was that publication health must be judged by *what changed*, never by the label on the work — a documentation-titled job had once triggered a real publish because it touched a player-facing file. That note was written into the ticket rather than left in the margin, and it shipped in exactly that shape, then went one better by reading the publisher's list instead of restating it.

On the bench 3:01am, done 3:29am — **28 minutes**, and the third consecutive job to finish within seconds of that same figure. No new problem left behind it; three clean closes in a row.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
