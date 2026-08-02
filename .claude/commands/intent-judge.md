---
description: Run the intent-judge subagent against a plan doc.
---

# /intent-judge

Manually invoke the intent-judge skill against a plan doc. Use when:

- You want to dry-run the judge before opening the `docs/plan-*` PR.
- A plan doc was authored outside the auto-trigger window.
- A Reopened issue's revised plan doc needs re-judging.

## Usage

    /intent-judge <plan-doc-path>

Example:

    /intent-judge Docs/plans/2026-05-11-intent-judge-skill.md

## What happens

1. The command resolves the plan-doc slug from the path.
2. Confirms an action proposal exists at
   `Docs/plans/.intent-proposals/<slug>.md`. If missing, prompts the user
   to create it before invoking the judge (the judge will Block on missing
   proposals anyway; better to catch it here).
3. Spawns the judge as a `general-purpose` subagent with `model: "opus"`,
   following the spawn template in `.claude/skills/intent-judge/SKILL.md`.
4. Pastes the verdict block in chat.
5. **The invoking session** — not the judge — appends a metrics row to
   `Docs/judge-metrics/YYYY-Www.md` (ISO week, `W` literal: `2026-W31.md`),
   transcribed from the verdict's `### Metrics (judge instrumentation)` block.
   Column mapping and the latency measurement are in
   `.claude/skills/intent-judge/SKILL.md` § Metrics to track.

## What the judge does NOT do

- Edit the plan doc.
- Move the Linear issue.
- Apply or remove labels.
- **Write the metrics file.** The judge is read-only by hard rule; step 5 above
  is the invoker's, which is also why it is the only party that can measure
  spawn-to-verdict latency (THR-762).

Acting on the verdict is the invoker's job. The `design-session` skill's plan-doc
workflow handles the standard Allow → Ready for Dev transition; for manual
`/intent-judge` runs, the human invoker decides what to do with
Revise/Block/Escalate verdicts.
