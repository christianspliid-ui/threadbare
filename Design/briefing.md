# Briefing
**Generated:** 2026-11-06 21:58 local (20:58 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** The lanes lost 40 hours on 29–30 Oct and 48 hours on 21–23 Oct while the app was not running, with tickets ready to build both times. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) traced every recent gap to the app not reopening after a start or wake. Only you can change that setting. Say "done" and the next silence check confirms it.

## Also waiting (8)

- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. The next story-beat rewrite waits on it too. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** the lanes were silent for 40 hours and no pause was recorded. Was the computer off or the app closed, or was this a pause?
- **Wednesday night to Friday night (21–23 Oct):** the lanes were silent for 48 hours and no pause was recorded. Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

From the design lane's [11:51 UTC run](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-06d.md), on [which of the mortal's own chapters should give the god a hand](https://linear.app/threadbare/issue/THR-2179). Nobody builds on these before 23:50 UTC on 6 November.

- **Your cards now say how they landed.** Every card carries a line for each result, such as *"The odds had been quietly widened, and Kael walked through the gap."* No screen has ever shown one. The only answer a played card got was "your cards held it". Each card you play now adds its line under how the step went, on the encounter screen and in the Ledger: *"Press The Odds — The odds had been quietly widened, and Kael walked through the gap."* At most two lines per step. Build ticket: [Your cards say how they landed](https://linear.app/threadbare/issue/THR-2187).
- Same ticket — when a card has no line for a critical failure (31 of the 38 library cards don't), it uses its plain failure line. So the god's card is never missing from the worst roll.
- **Five quiet chapters now ask you once.** Measured live over four worlds, 70% of The First's story chapters already wait for your cards. The ones that play out alone are mostly five: Consecrate the Ground, The Haggle, Tend the Shrine, The Market Haggle and Heal the Sick. Each gets a hand dealt from your cards on its **first step only**. That makes the world stop about a fifth more often for The First, against nearly half more if every step asked. How often The First starts a chapter does not change. This builds after the card lines, so the new hands pay off.
- Same ticket — the other seven quiet chapters stay as they are. Together they are a quarter of the alone chapters, and they are rare.

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-02/contact-sheet.jpg) — better: all three of last week's faults are fixed, and for the first time the review reached a real mid-game, where one new overlap shows.

## Queue

**Healthy: nothing being built right now, two ready.**
- **Ready now:** [rank words show their ladder](https://linear.app/threadbare/issue/THR-2182/rank-words-show-their-ladder-a-reach-tile-says-where-its-word-sits-and) (THR-2182). Its veto window closed at 20:59 UTC; the next builder run (about 21:10 UTC) should take it.
- **Ready at 23:50 UTC:** [your cards say how they landed](https://linear.app/threadbare/issue/THR-2187/your-cards-say-how-they-landed-each-card-the-god-played-adds-its-own) (THR-2187).

Items for agents, not you:
- **A finished fix is still waiting to be queued.** [THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid) is built on [branch `thr-2091-oddq`](https://github.com/christianspliid-ui/threadbare/tree/thr-2091-oddq) (also checked out, clean, in local worktree `admiring-wescoff-384eb1`), but the ticket is still in Idea, so no builder run will take it.
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (17 days; In Dev since 15 Oct, 22 days; last touched 1 Nov). It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching. No local worktree holds work for it (checked this run).

## Health

- The live site serves the latest commit on main (79a90972, the THR-2186 merge). Checks on main and the 3 scheduled background jobs pass. No pull requests are waiting to merge. All 10 scheduled tasks are on time, and the worktree cleaner ran at 21:54 local. The builder is not stalled: its runs since 17:50 UTC found nothing claimable because both ready tickets were inside their veto windows.
- Engine speed: 144 ms/tick steady, −2% against the 7-day median (147).
- The lanes were quiet overnight 3–4 Nov (20:25–08:19 local); overnight quiet is normal, so it is not an ask.
- The home-folder copy of the repo is 138 commits behind main; its newest commit is from 4 Nov 11:02 local, about 59 hours ago. It has one edited tracked file (`.claude/settings.local.json`), which may be what stops the mirror's sync from fast-forwarding. This is the fourteenth hour in a row this brief has flagged it, so an agent should check the mirror's sync. Nothing is lost, because the lanes work from fresh copies of main.
