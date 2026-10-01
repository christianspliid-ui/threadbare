---
lane: tb-design-lane
run: 2026-10-01a
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-01 (run a, ~00:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Re-plan the lead climb's survey and visit rungs](https://linear.app/threadbare/issue/THR-1684/re-plan-the-lead-climbs-survey-and-visit-rungs-on-current-main-no-seed): **a mortal who has heard of a ruin now goes to look at it, and a mortal waiting at a meeting stays for it.** Today no ruin on the two test worlds is ever surveyed, so no secret is ever found. The calls made:
  - **Looking at a ruin you already know about is not a gamble.** A survey cannot fail. The rule that mortals only take on work they would win about half the time (your 50–65% ruling) was treating it as a dice roll. So the survey no longer has to pass that test. The real gamble is the visit to the ruin, and its dice are unchanged.
  - **This only covers ruins someone holds a lead on.** Freeing every survey would have made surveys 6 to 22 times more common.
  - **A mortal waiting at a meeting place no longer wanders off** on a trip they cannot get back from in time. Hunters waiting to confront a beast get the same hold.
  - **No lead hand-off is needed.** Every test world now arranges at least 3 visits to ruins.
  - In a trial build (thrown away afterwards), one mortal went all the way: heard the rumour, looked at the ruin, visited it, learned where it lies, and went down into it.

  Plan: [Seeded things that stay alive, § Re-plan after S3](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md). Build: [The lead survey and the kept visit](https://linear.app/threadbare/issue/THR-1686/the-lead-survey-and-the-kept-visit-a-survey-of-a-held-lead-skips-the). To reverse the main call, say that a survey of a lead should face the same 50–65% test as any other work. Ruins are not ready for you to look at until this is built.

## Work

- **Chosen:** the build shelf held 1 job (floor 4), and no map was open. This re-plan was the oldest design request the orchestrator had staged. The plan it amends cleared its veto window on 2026-09-30.
- **Measured before deciding** (main `218cdfa7`, medium, 300 ticks):
  - The survey is not blocked by a rule. Mortals holding a lead considered the survey on 61 of 63 decisions (seed 42) and 30 of 30 (seed 99), and it won 0 times. The 50–65% test scored it at about a fifth of the work that won.
  - The [odds retune](https://github.com/christianspliid-ui/threadbare/pull/2143) changed who held the leads. Their odds had only ever fallen inside the 50–65% band by luck.
  - The waiting mortal on seed 8 was sent 5 places away with 4 ticks to spare. Nothing filters a mortal's choices while it waits at a meeting.
- **Trial:** a ~12-line patch, run in four versions on four seeds and then reverted. Nothing reached `main` from it. Results are committed as [the census data](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/upkeep-2026-10-01-thr1684-arms.json).
- **Checks:**
  - The independent plan reviewer first asked for changes. Its main catch: my limit on extra surveys would have failed the very version I chose. After the fixes it approved, and it agreed this is a design detail, not a call that needs you.
  - The three side reviews (rules, completeness, vision) each passed with notes, and every note was folded in.
- **Plan merged:** [PR #2159](https://github.com/christianspliid-ui/threadbare/pull/2159), `a3b56fd3`, confirmed live on `main`.
- **Handed off:** [The lead survey and the kept visit](https://linear.app/threadbare/issue/THR-1686/the-lead-survey-and-the-kept-visit-a-survey-of-a-held-lead-skips-the) is in Ready for Dev with its build notes. [The re-plan ticket](https://linear.app/threadbare/issue/THR-1684/re-plan-the-lead-climbs-survey-and-visit-rungs-on-current-main-no-seed) goes back to Todo for someone to close by hand, since no lane may mark it Done.

## Escalations

- **An observation for whoever next works on the 50–65% rule, not decided here:** every survey and harvest is a sure thing, yet the decision board scores them as dice rolls. That scoring is what keeps them rare. It is recorded in the plan's re-plan section.
- **A separate gap, not fixed here:** a mortal planted at a full-moon gathering about 130 ticks early wanders off and often cannot get back in time (6 of 19 missed meetings across ten seeds).
