---
description: Run the design-audit-pipeline against a plan doc — spawns three independent auditors (NFP / three-pillar / Vision) and merges verdicts into the plan-doc tail.
---

# /design-audit

Manually invoke the design-audit-pipeline skill against a plan doc. Use when:

- Running the audit before applying `plan-pending-commit` (manual mode).
- A plan doc was authored outside the auto-trigger window (e.g. drafted in CC).
- A Reopened issue's revised plan doc needs re-auditing.
- The Cowork session already ran intent-judge Allow and you want to run the structural audit separately.

## Usage

    /design-audit <plan-doc-path>

Example:

    /design-audit Docs/plans/2026-06-11-thr-452-branching-encounter-reachability.md

## What happens

1. Resolves the plan-doc path and confirms the file exists.
2. Spawns three subagents in a **single message** (parallel):
   - NFP auditor — checks all 7 NFPs, returns compliance table
   - Three-pillar auditor — checks Engine / Content / UI coverage, returns per-pillar verdict
   - Vision auditor — checks Vision premises, returns contradiction report
3. Waits for all three verdicts.
4. Writes the merged verdicts into the plan-doc tail under `## Forked-audit verdicts`.
5. Pastes a summary in chat showing the three overall verdict lines.

## Verdict handling

- **All PASS / PASS-with-notes** → audit complete. Proceed to `plan-pending-commit` and Linear state transition as normal.
- **Any REVISE** → surface finding to author for inline fix before transitioning.
- **Any FAIL / BLOCK** → do NOT apply `plan-pending-commit`. Author must resolve the finding and re-run `/design-audit`.

## What this does NOT do

- Edit the plan doc beyond the `## Forked-audit verdicts` tail section.
- Move the Linear issue.
- Apply or remove labels (that is the Cowork orchestrator's job after verdict is clear).

## Load the skill

The full orchestration logic is in `.claude/skills/design-audit-pipeline/SKILL.md`. Load it before spawning subagents.
