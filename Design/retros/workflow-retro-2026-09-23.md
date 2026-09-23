# Workflow Retro — 2026-09-23

Covers 2026-09-16T09:20Z → 2026-09-23T09:20Z. The previous report is [`workflow-retro-2026-09-09.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-09.md). **There is no 09-16 report.** That scheduled run never started (see Throughput), so the week of 09-09 → 09-16 went unretro'd. Its raw volume is recorded below but not analysed.

## Needs Christian

**Nothing new needs you from this retro.** The lead ask on [your briefing](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md) is the right one: one design hour on [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), because the builder has nothing left to build. I am not restating it.

What this retro adds is **part of an answer to a question the briefing asks you**: *"Were the weekday stops deliberate?"* I read the computer's own power log, which gives two different answers for two different gaps:

- **17 and 18 September: the computer was asleep.** It went to sleep at 08:11 your time on the 17th and woke at 17:50. On the 18th it slept from 03:13 to 18:44. The lanes cannot run on a sleeping machine, so this is not a lane fault and you do not need to answer for these two days.
- **Monday 14 and Tuesday 15 September: the computer was on, and nothing ran.** It was awake from about 09:00 to 22:00 your time on Monday (with a few restarts around 22:00) and from about 08:00 to 21:15 on Tuesday. On both days `main` and the ops branch got zero commits, and no scheduled lane started at all. Daily grooming skipped both days, and this retro's 16 September slot never fired. So the machine was not the reason. Either the Claude app was closed, or the lanes were switched off. **Only you know which, and that narrows the briefing's question to one line: were you away from the app on those two days?**

The other two items on the briefing are right and I endorse them without restating: **the Linear sub-issue toggle**, and **topping up model credit**. The credit outage on 22 September is the reason for this week's one finding (below).

## Throughput

- **32 issues reached Done**, against 62 last week. **40 pull requests merged, 123 commits** on `main`.
- **Completions per day (UTC):** `09-16: 10 · 09-17: 3 · 09-18: 6 · 09-19: 1 · 09-20: 2 · 09-21: 2 · 09-22: 7 · 09-23: 1`.
- **Composition: 29 product, 3 process.** By project: 11 in Thematic Pressure & Living World (the appointment primitive, traits wave 2 and the held-town slices), 9 in Content Architecture, 9 in Encounter Experience, and 3 in Continuous Improvement (THR-1512, THR-1513, THR-1517). THR-1517 cleared the bar on its own evidence: impediment row 1054 records four recurrences and six armed PRs turned red in four days. **The process-work throttle held.**
- **The machine was off or dark for about 60% of the week, and that explains most of the drop.** The Windows System log shows three kinds of gap:
  - Asleep: 09-17 06:11Z→15:50Z, 09-18 01:13Z→16:44Z, 09-19 19:58Z→09-20 09:44Z, 09-20 19:17Z→09-21 15:36Z, and 09-22 17:47Z→09-23 05:23Z. The weekend gaps are covered by the 09-11 ruling.
  - Awake with no lanes running: 09-14 and 09-15 (see Needs Christian). This is also why the 09-16 retro slot never started. Lanes resumed around 09-16T14:00Z.
  - Awake with lanes running but the builder failing: 09-22 08:11Z→16:11Z.
- **Pickup outcomes, from the scheduler's own run list** (the 50 most recent runs, 09-18 22:01Z → 09-23 09:11Z):
  - ~18 runs did real work (9–67 min each).
  - ~23 exited on an empty shelf (~1 min each).
  - **9 failed** on *"You've reached your Fable limit"*, back to back on the hour from 08:11Z to 16:11Z on 09-22. The first of those nine died 26 minutes into a claimed slice, which is the finding below.
- **Queue depth: the shelf is empty and has been empty repeatedly.** Right now Ready for Dev and In Dev are both empty. The pattern is the same as last week. When design produces a batch, it drains within hours: the four 09-21 plan docs drove 7 completions on 09-22. Then the builder idles. This is a supply problem, not a lane failure, and the briefing already treats it that way.
- **Orchestrator:** 30 published reports over the week. Short unchanged-board runs are suppressed by the skip probe as designed (`.claude/skills/orchestrator/SKILL.md`), so a lower report count than last week's 41 is not silence.
- **The unretro'd week (09-09T20Z → 09-16T09Z), for the record only:** 268 commits on `main`, almost all on 09-10 → 09-13. Zero on 09-14/15. I did not reconstruct that week's Done list. Doing it properly would double this report, and nothing in this week's evidence points back into it.

## Findings filed

**[THR-1529](https://linear.app/threadbare/issue/THR-1529/a-pickup-run-killed-mid-slice-leaves-its-work-invisible-no-wip-push)** is titled *"A pickup run killed mid-slice leaves its work invisible — no WIP push before verify, and the 'claimed but unstarted' check reads branches, not the worktree."* It is Medium, `Ready for Dev`, in Continuous Improvement, with its coordination block posted as the first comment.

What happened, in order:

1. THR-1521 was claimed at 09-22T08:11Z.
2. The run wrote the whole slice (39 files in worktree `quirky-knuth-1bb9b6`) and then died at 08:37Z on the usage limit. It had committed nothing, pushed nothing, and left no checkpoint.
3. For **seven hourly briefings in a row**, `keep-work-flowing-cc` told Christian that the job was *"re-verified this run as unstarted: no branch, no pull request, no code … Nothing was lost."* That was false every time. The check looks at branches and PRs, and uncommitted work in a worktree is invisible to it.
4. The next morning's resume found the worktree by hand, transplanted the diff, and landed it (PR [#1985](https://github.com/christianspliid-ui/threadbare/pull/1985); impediment row 1059).

The worktree sat idle for ~19.5h, far past the reaper's 180-minute idle guard, so a full slice rebuild was one reaper pass away.

The ticket asks for three prose rules:
- push a no-keyword WIP commit before the long verify phase;
- in the resume path, probe `git worktree list` for a dirty worktree on the claim's branch;
- the briefing may not say "no code" without that same probe.

Why it was promoted rather than left as a log row is explained in Notes.

## Clean checks

- **Ship mechanics: PASS.** There were **31 distinct line-anchored closers** across 123 commits, and every one landed on an issue that is Done. The one Done issue with no closer, **THR-1510**, was closed ~24 min after the pickup lane posted a measured not-a-defect verdict and parked it. It shipped no code, so no closer could exist. This is the uncloseable-verdict pattern, not a false close. I could not attribute who pressed Done. It was not the executor, whose comment explicitly left the state at In Dev.
- **Autoclose: PASS.** 80 `linear-autoclose` runs, 80 successes.
- **CI: PASS.** 85 `ci.yml` runs: 81 success, 2 failure, 2 cancelled. Both failures are PR-branch runs (`thr-1516` 09-20, `thr-1448` 09-22), and neither is a `main` push. THR-1517's timeout fix landed 09-20, and the orchestrator-timeout reds that dominated 09-17 → 09-19 stopped after it.
- **Open-PR backlog: zero.** This is the fifth consecutive week, so the check has nothing to test.
- **Handoff quality: PASS.** I sampled THR-1510 and THR-1521:
  - Both had a filing-time coordination block (THR-836) and a promotion-time block with the reason for each mutex.
  - THR-1521 named its plan doc in both the description and the comments.
  - THR-1521's 02:32Z cascade restoration deliberately put it back to `Todo`, not `Ready for Dev`, because its own blocker was still open. That is the right call.
  - I found no pickup bounces for a missing block.
- **WIP discipline: PASS on the rule, finding on the practice.** In Dev never held two items, and no executor set `state:"Done"` by hand. The only stale claim was THR-1521 (~22h, 0 checkpoints), and it is the finding above.
- **Checkpoint hygiene: PASS for the churn case.** No issue reached 3+ checkpoints without shipping. The failure this week was the opposite case: **zero** checkpoints from a run that was killed. THR-632's protocol assumes the dying session gets to write one. THR-1529 covers this.
- **False closes: 5 this week, all repaired, none by our tooling.** Linear's parent-close cascade completed unworked children twice. The first was via THR-1479 on 09-21 (2 children). The second was via THR-790 at 09-22T02:15Z (THR-1519, THR-1520 and THR-1521 at +188/+219/+246 ms). `tb-orchestrator` restored all five by hand with the evidence written out ([run 09-21e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-21e.md)). The repo's own close discipline was followed exactly. The durable fix is a Linear team setting only Christian can change, and it is already on the briefing. **Not filed:** a ticket for a setting no agent can reach would sit unexecutable.

## Handoffs to the Friday retro

- **The heavy simulation lane read red for about 27h** before a no-change re-run passed on 09-23 08:34Z, which suggests a slow runner rather than broken code. The briefing names the fix (a larger time limit on the world-building tests). It is a test-health question, so it belongs to you.
- **Flaky-test cluster in the log:**
  - row 1048: `controlRenewalReach` passes alone and fails in the heavy lane;
  - row 1051: the `check-lane-silence` `readPauseMarker` arm is deterministic-red locally on Windows;
  - row 1053: the 11th instance of the git-shelling worker-contention flake.
- **Product staleness, from THR-1521's landing comment:** `FactionSheet` and `ArmySheet` are mounted with the same stale-memo shape `ArtifactSheet` had (no `worldVersion`). It is noted there, and I found no ticket for it.
- **Impediment row 1049 / THR-1510** is a good case study in a diagnostic that trusts the evicting trace ring and so manufactures a defect. Rows 1052 and 1049 are the same family.

## Notes

- **Judgment call: why THR-1529 was promoted to a ticket while its log row counts 1.** Taken strictly, the materiality bar is not met by the direct loss, which was ~30 min of forensics. I promoted it anyway for three reasons:
  1. **The trigger is now structural.** A lane's model cannot be set by any agent (registry note, 2026-09-23), and a usage limit killed nine runs in one day. Every future limit hit that lands mid-slice repeats this exact shape.
  2. **The exposure is a full slice, not 30 minutes.** The only thing that kept this a near-miss was that the reaper happened not to take the worktree.
  3. **It made the Christian-facing channel wrong for seven consecutive hours.** A briefing that says "nothing lost" while work is at risk is the kind of error the THR-608 interface cannot absorb, because he has no other view.

  The fix is small (prose in two skills plus one mirror), so the cost/benefit is lopsided. If the Friday retro disagrees, a veto is cheap: the ticket has not been claimed.
- **Judgment call: I did not file the `lastInDesignActivityMs` ratchet.** [Orchestrator run 09-21b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-21b.md) left this for the retro. Its analysis is correct and it corrects run a's misdiagnosis:
  - `scripts/stale-claim-sweep/index.ts:327` counts *any* comment as human activity;
  - every lane comments under Christian's identity;
  - so the stale-claim sweep's own "this no longer bars staging" warning resets the clock it is warning about.

  But run b sizes the cost itself: *"the practical cost this run is nil"*. The column is now occupied by a genuinely live item (THR-1525), so the defect does not bind. This is the same reasoning I used last week for the assigned-forever case. Staging design requests is not the constraint; answering them is. It is recorded here with its code path so that a week where it *does* cost something can cite this paragraph.
- **I corrected the briefing's 17/18 September question instead of repeating it.** The power log answers it without asking Christian anything. I checked the log rather than trusting any lane's account of its own silence, as every week.
- **Window boundary:** I started at 09-16T09:20Z (seven days before this run), not at last report's end (09-09T20:02Z), because the charter asks for the last seven days. The gap between the two is the unretro'd week described above.
- **No queue mutation.** This retro claimed nothing, moved nothing and closed nothing. THR-1529 was created in `Ready for Dev` and re-queried with `get_issue` (impediment #48): its status is `Ready for Dev` and it has no assignee key (born unassigned, THR-845 holds). Its coordination block was posted as the first comment (THR-836).
