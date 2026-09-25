---
name: tb-cold-playtest
description: Threadbare cold playtest lane, daily — when the last cold-playtest round's milestone is fully closed and deployed, three no-knowledge testers play the live build and the round's verified findings are filed into a new milestone (THR-1610).
---

You are Claude Code running the **Threadbare cold playtest lane** (`tb-cold-playtest`, daily). This is an automated run and the user is not present. Execute autonomously end to end. Do not stop to ask "should I proceed?".

Repo: `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator`
Linear team: **Threadbare** · project **Onboarding & First-Run Experience**

## What this lane is

Christian's direction, 2026-09-25: *"build this test into our harness, so we do it routinely … track if we have fixed the feedback, and when all feedback has been addressed (bugs and gameplay) we run it again."* Each run checks whether the current cold-playtest round is finished. If it is, the lane runs the next round. Most days the gate is shut and the run does nothing, which is the correct outcome.

**Load `.claude/skills/cold-playtest/SKILL.md` first and run it in lane mode.** It is the full procedure: gates, round run, verification, filing, cross-round tracking, report and fail-soft. This prompt is the entry point; the skill is the specification.

## Non-negotiables

1. **Gates first, all four** (skill step 0): round milestone closed, fixes deployed and settled, spacing since the last round, standalone CLI login alive. Any gate shut means exit silently. The only exceptions are the stale-round report and the expired-login line.
2. **Never file on a tester's word.** Every finding is verified against `origin/main` source before it is filed. `tester-error` and `unverified` go in the report, not in Linear.
3. **Never reword the player brief in a run.** A brief change is a PR that bumps `briefVersion`.
4. **Never write `Design/briefing.md` or `Design/user-actions.md`** (`keep-work-flowing-cc` owns both). Your report's `## Needs Christian` reaches the briefing through its sibling fold.
5. **Every reference Christian reads is a clickable link** (Rule Zero), in plain language and game terms. The report is a status report, never a review invitation.
6. **Never write `Fixes` / `Closes` / `Resolves` before an issue id.** This lane files tickets; it never closes them.

## Run order (condensed; the skill is authoritative)

0. `node --experimental-strip-types scripts/session-precheck.ts`. If `linear=noauth|unreachable`, write one line and exit. Evaluate gates 1–4.
1. Pick N = highest `Cold playtest · round <k>` milestone + 1.
2. `pwsh scripts/cold-playtest/run-round.ps1 -Round N` (background; ~10–15 min). Void if `usable < minUsablePersonas`.
3–6. Read every log in full, list candidates, verify against source, compare with earlier `cold-playtest` issues.
7. Create the round milestone and file the verified findings (verify every write).
8. Publish `Docs/ops/cold-playtest-round-N.md` + scorecard rows with `bash scripts/ops-publish.sh`, then delete the local copies.

## Fail-soft

A failed tester, an unreachable site, an expired login or a void round files nothing and reports why. Log any new friction via the `impediment-reporter` skill.
