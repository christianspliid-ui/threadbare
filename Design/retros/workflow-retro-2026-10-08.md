# Workflow Retro — 2026-10-08

Covers 2026-10-01T04:43Z → 2026-10-08T04:43Z. This run is the scheduler catching up the missed Wednesday 7 October slot. The previous report is [`workflow-retro-2026-09-23.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md). **There is no 09-30 report.** That slot fell while the computer was down (see Notes), so the week of 09-23 → 10-01 went unretro'd.

## Needs Christian

**Nothing new.** I can answer most of the lead question on [your briefing](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md) from the computer's own power log, so you only need to answer part of it.

- **Tuesday 6 Oct night → Thursday 8 Oct morning: the computer was asleep.** It went to sleep at 23:23 your time on Tuesday and woke at 06:39 this morning. Nothing could run, and you don't need to answer for this gap.
- **Tuesday 29 Sep → Wednesday 30 Sep: the computer crashed or lost power.** The log records an unexpected shutdown, not a normal one. It started again at 16:53 on Wednesday, and the lanes came back about 20:20, roughly 3½ hours later.
- **Thursday 1 Oct → Friday 2 Oct: the computer was on, but the lanes were not running.** The lanes stopped about 16:30 on Thursday. The computer stayed awake until 21:38, when someone told it to shut down or sleep. It woke at 08:49 on Friday, and the lanes didn't return until about 13:45.

**That narrows it to one question: on Thursday afternoon 1 Oct, and on Friday morning 2 Oct, was the Claude app closed?** In all three cases where the computer started or woke, the lanes came back hours late. That points to the app not reopening by itself.

**My recommendation:** if the Claude app doesn't open when Windows starts, set it to. That would close these gaps without anyone noticing them. Only you can change that setting.

**One correction to the briefing, for your peace of mind.** It says the heavy simulation tests have been "failing on main for 35 hours". That isn't true. The same version of the code passed on Wednesday morning, so this is a flaky test, not broken code. The health check just doesn't look at that run. I filed the fix (below). You don't need to do anything.

## Throughput

- **79 issues reached Done**, against 32 in the 09-23 report's week. **130 pull requests merged, 480 commits** on `main`.
- **Commits per day (local):** `10-01: 8 · 10-02: 45 · 10-03: 138 · 10-04: 127 · 10-05: 97 · 10-06: 65 · 10-07: 0 · 10-08: 0`. The machine was asleep or off for about 2.4 of the 7 days. When it was up, this was the fastest week on record. It is the first full week of the THR-1717 velocity changes (one-shot gate, back-to-back pickup every 20 minutes).
- **Composition:**
  - **68 product, 11 Continuous Improvement.** Two of the 11 are drift-scan rows.
  - The process share is ~14%, under the one-in-three throttle.
  - All 13 findings from cold playtest round 2 (THR-1704 → THR-1716) shipped this week.
- **Pickup run outcomes.** The scheduler exposes only the newest 50 of its 1,733 runs, which reach back to 10-06 03:51Z.
  - Of those, **4 did real work** (24–56 min each) and **45 exited in about a minute**.
  - On 10-06 the short exits were correct. Four of the five Ready for Dev items had `Claimable from:` holds expiring 10-07 (the THR-1694 veto window), and the fifth (THR-1775) was only promoted at 20:31Z.
  - I could not count outcomes for 10-01 → 10-05.
- **Queue depth: healthy, never empty of claimable work for long.**
  - Ready for Dev now holds 5. Four are design-lane handoffs whose holds all expired during the outage: [THR-1747](https://linear.app/threadbare/issue/THR-1747), [THR-1749](https://linear.app/threadbare/issue/THR-1749), [THR-1768](https://linear.app/threadbare/issue/THR-1768) and [THR-1644](https://linear.app/threadbare/issue/THR-1644). The fifth is [THR-1775](https://linear.app/threadbare/issue/THR-1775).
  - The supply problem from the last two reports has eased. The design lane ran its four slots a day whenever the machine was up and kept refilling the shelf.

## Findings filed

- **[THR-1776](https://linear.app/threadbare/issue/THR-1776/the-main-red-probe-ignores-a-green-re-run-of-the-same-commit-the)**: *the main-red probe ignores a green re-run of the same commit.* It is Medium, `Ready for Dev`, in Continuous Improvement, labelled Improvement + Infrastructure, with its coordination block posted as the first comment.
  - `classifyPushLane` in `scripts/check-workflow-health.ts` reads only `event=push` runs. The heavy lane went red on push for `a43dc356` at 10-06 20:44Z and then passed on the nightly schedule run of the **same SHA** at 10-07 10:15Z.
  - The 04:47Z briefing still told Christian "failing on main for 35 hours … the code on main has a problem".
  - This is the second consecutive week the heavy lane has read red over a flake: the 09-23 retro saw ~27h red before a no-change re-run passed.
  - The fix adds a `flaky` verdict and does not page.

## Clean checks

- **Ship mechanics: PASS.**
  - There are **65 distinct line-anchored closers** on `main` in the window, and every one landed on an issue that is now Done. No merged PR left its issue open.
  - 14 Done issues carry no in-window closer, and none is a false close. All have an explanation:
    - THR-1706, THR-1688, THR-1728 and THR-1572 have merged landing PRs.
    - THR-1759, THR-1769 and THR-1772 are `wayfinder:research` tickets with merged audit PRs, closed under the orchestrator's wayfinder carve-out.
    - Six (THR-716, THR-1088, THR-1295, THR-1393, THR-1675, THR-1684) were closed 10-02 11:18–11:25Z in an attended board tidy-up with Christian. Each comment cites the sibling it shipped under and the code that proves it.
- **Open-PR backlog: zero.** This is the sixth consecutive week.
- **CI: PASS.** Since 10-01, `ci.yml` has 200 runs: 178 success, 6 failure, 16 cancelled. None of the failures is a sustained red on `main`.
- **WIP and claim discipline: PASS.**
  - In Dev holds one item: [THR-1744](https://linear.app/threadbare/issue/THR-1744). It was claimed 10-06 19:33Z and checkpointed 20:14Z.
  - Phase 1 merged ([PR #2264](https://github.com/christianspliid-ui/threadbare/pull/2264)). Phase 2 waits on a deploy check that the outage interrupted.
  - Its age (~33h) is the outage, not a stall.
  - No executor set `state:"Done"` by hand.
- **Checkpoint hygiene: PASS.** THR-1744's checkpoint is the model shape: done / remains / branch / next step, and an explicit "does not close the ticket". No issue reached 3+ checkpoints without shipping.
- **Handoff quality: PASS.**
  - All four design-lane handoffs in Ready for Dev name their plan doc in the description, with a main link, and carry a full coordination block. THR-1749 and THR-1775 were read in full.
  - THR-1744's handoff comment names its plan doc and gives each mutex a reason.
  - THR-1775 is a direct-filed measurement ticket with a block and no plan doc, which is acceptable for its shape.
  - I saw no sign of pickup bounces for a missing block. Pickup transcripts were not read, so this is inferred from Linear state.

## Handoffs to the Friday retro

- **Heavy simulation lane flakiness.**
  - On 10-06 it went red on 4 of 5 pushes, and the head then passed unchanged on schedule. That is test health, which is Friday's.
  - THR-1776 only stops the probe from calling it broken code. It does not fix the flake.
- **Tick-cost probe:** +44% over the 7-day median on the first measurement after wake. The briefing already suspects wake-up noise. Re-measure before chasing it.
- **Worktree and branch sprawl:** 485 worktrees and 318 local branches, per the briefing. The reaper missed its runs during the outage. Watch whether it recovers on its own.

## Notes

- **Power log, read directly** (System log: Kernel-Power 41/42/107, EventLog 6005/6008, User32 1074, Power-Troubleshooter 1). All times UTC:
  - Unexpected shutdown before 09-30 14:53 (boot). Lanes resumed ~18:20.
  - 10-01: lanes quiet from ~14:30; user-initiated shutdown/sleep at 19:38; wake 10-02 06:49; lanes resumed ~11:45.
  - Sleep 10-06 21:23 → wake 10-08 04:39.
  - I did not trust any lane's account of its own silence.
- **Why the 10-01/10-02 awake gaps are not a ticket.** They are the same shape as 14–15 September: the machine is on, and every lane is silent together, including the design lane's 10-01 18:14Z and 10-02 12:14Z slots. That points at the app's process, not at any lane. No agent can fix it. It sits with Christian and stays a briefing question, not a backlog item.
- **The unretro'd week (09-23 → 10-01) is not reconstructed.** This report covers the charter's seven days. The intervening week's Done issues show up only where their `updatedAt` fell inside this window.
- **No queue mutation.** This retro claimed nothing, moved nothing and closed nothing. THR-1776 was created in `Ready for Dev` and re-queried with `get_issue` (impediment #48): status is `Ready for Dev`, assignee null.
