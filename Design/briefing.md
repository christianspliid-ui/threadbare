# Briefing

**Generated:** 2026-07-27 02:54 local (2026-07-27 00:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One question, unchanged, and no ping was sent.**

Should the ceremonial reveal screens — the Civ-style "you unlocked this" moment you asked for — be built next, or stay in line? Asked once at 11pm, still open. Silence means "leave it in line", and it has.

Nothing about it moved this hour beyond the shelf getting one job shorter. That is not news, so the doorbell stayed quiet. Answer whenever, or never.

## Queue

**22 jobs ready — ten middling, twelve minor, none urgent. Nothing on the workbench; the next shift starts within the hour.**

The count went 23 → 22: one job shipped, and for once nothing new was written down in its place.

**That is the fourth time this week I could have called that a turning point, and I am not going to.** The three previous times it lasted exactly one hour. The honest description remains a steady state — about one job out per hour, and one or two in, with the incoming ones being things the crew trips over while fixing something else rather than anything you or anyone asked for. Depth holds at roughly twenty by construction, not by neglect.

Nothing is stale, nothing is stuck waiting on anything else. One job on the shelf is something **you** asked for.

## Freshness

**Home tree: level with the server, nothing stranded.** The same two small leftovers as the last twelve hours — a permissions edit to the tool config, and Friday's retro write-up. Both are the crew's to land; neither blocks anything.

**Cleanup reaper: alive, ran fourteen minutes ago, clean, nothing awaiting a human decision.** One workspace and one branch added by tonight's job, exactly as expected.

**Published to players: working.** Tonight's fix went live 47 seconds after approval — confirmed, not assumed.

**Discord: nothing new in the channel this hour.** Genuinely empty rather than unread.

## What's moving

**A lost tavern brawl finally leaves you wounded.**

This closes a chain three jobs deep, and it is a good illustration of how this week has gone. It started as "a losing brawl was written to wound the loser, and never once did." That was fixed a day ago — the wiring was correct and the tests were green — but when the crew actually ran a world to watch it happen, nobody got hurt. The reason sat further upstream: the *definitions* of every temporary condition and mastery the world can hand out were never planted at world creation. The routine that plants them hung off an old loop nothing calls anymore, so of thirteen definitions, eleven simply did not exist in any world. A wound could be applied to nobody, because "wounded" was not a thing.

They are now planted at world creation, so their presence is a guarantee rather than a race. A second trap went with it: the planting routine used to check whether *one* definition existed and skip all thirteen if it did — so the moment anything minted that one by another route, the other twelve were locked out permanently.

Filed 9:17pm, on the bench 2:02am, done 2:30am — **28 minutes**, and it shipped without leaving a new problem behind it.

**The pattern worth noticing:** the last three jobs each found their real bug only by running the world and looking, never by reading the code. Green tests and a correct-looking change agreed with the bug every time.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
