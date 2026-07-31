---
needsChristian: thr-924-broken-test-links, thr-860-capital-cluster-verdict
queue: backed-up
freshness: behind
deploy: skipped
tasks: ok
---
# Briefing

**Generated:** 2026-07-31 23:54 local (21:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Both items are unchanged from the last two hours. Nothing new needs you, and no doorbell was rung.**

**1 — The five test links you were sent at 20:30 are still mostly broken.** Four of the five stall after their opening scene; only #2, **The Unsafe Bridge**, plays end to end. The fix is written up and sits at the top of the work queue as the single most urgent job on the board. It has not been picked up yet — not because anything is stuck, but because the one working session was busy finishing two other encounter-screen fixes, which landed about half an hour ago. That session is now free, and its next pass is due within minutes.

**Recommendation is unchanged: hold the verdict session until the fix lands.** Judging the format on four encounters you can't play past scene one would be judging the delivery, not the writing.

**2 — The four finished capital-cluster encounters are still parked on your call.** The millrace dispute, the ford toll house, the feuding houses, and the monument that turned into a problem with a rock. Written, passing every check, held in the old style. The question is whether they land as-is and get tidied up alongside the seven earlier ones, or get dropped and rewritten under the locked format. Nothing is lost either way. It belongs with the session that closes out the format work — not tonight.

*No doorbell this hour. Both items are identical to the ping you got at 21:02, and the change-detector was calibrated against its own stored value before being trusted — it agreed exactly, so "unchanged" is a measurement this hour rather than an assumption.*

## Queue

**Fifty-four jobs ready, one being worked, one parked.** One urgent, five high, four medium, three unranked, forty-one low-priority tidy-ups. Fifty-four is well past comfortable, which is expected while the content side stays paused behind the format work.

**The count rose by one, and it is accounted for by name** — a single new job promoted at 23:31 about how the work-limit rule miscounts. Not a backlog creeping up on its own.

**The working lane cleared out this hour, which is the useful news.** Three jobs finished and merged: the clipped-prose fix, the odds-panel explanations descending from your "key:value is unfinished" note, and the stuck-pull-request sweep. That leaves the lane with nothing in hand — so the urgent encounter bug is now first in line with nothing ahead of it, where for the last two hours it was queued behind live work.

**The one parked job** is the finished-but-held encounter batch described above, roughly thirty-five hours parked, holding no one up.

**Six of the fifty-four still have your name attached.** Re-checked against the pickup lane's own instructions again rather than carried over: it considers every ready job and treats a name on one as noise, not a claim. The stray name genuinely cannot hide the urgent bug.

## Freshness

**Your working copy has fallen behind, and this one is worth a look in the morning.** It's on the right branch with nothing of yours stranded — but it's sitting 36 commits back, last updated at 22:01. The background job that keeps it current runs hourly on the clock and has now **missed two turns in a row** (22:50 and 23:50). That gap is real rather than a quiet-hour artefact: there were 36 commits waiting to come down, so a healthy run would have left a visible trace and didn't.

Nothing is lost and nothing is broken — it just means a session started there would begin on old state. Your session-start check catches this on its own and will tell you. If you'd rather clear it directly, it's one command:

```bash
git switch main && git pull --ff-only origin main
```

Not raised as something needing you tonight: it may well fix itself on the next turn, and if it's still stuck by morning it'll be at the top of this section rather than buried here.

The two Claude permission files you edited are still sitting uncommitted, as they have been for days. They don't conflict with anything waiting to come down, so they aren't what's blocking it — harmless, no action wanted.

**The live site is current.** Everything merged since the last publish was notes and docs, so no rebuild was needed. Automated checks normal, all eight scheduled jobs on time, cleanup job ran at 23:40 and found nothing needing a human call.

## What's moving

**Three fixes landed in the last hour.** Two are the encounter screen: prose that was getting clipped at the top of long content, and the tooltip layer explaining the odds panel — the one that came out of your "key:value reads as unfinished" note. The third teaches the automated merge sweep to notice pull requests that have gone conflicted rather than merely stale, which is the failure that had been quietly stranding finished work.

**The merge congestion fix from this morning is visibly working.** This lane and its sibling now check whether they have anything worth saying before filing a report, and the backlog that congestion created is draining rather than growing.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
