---
name: weekly-retro
description: Run weekly retrospective reading drift-scan issues + impediments log (Fridays ~1 hour after drift scan)
---

Run the weekly retrospective for The Fantasy World Simulator (repo: C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator, Linear team: Threadbare).

This is an automated run of a scheduled task. The user is not present to answer questions. Execute autonomously — make reasonable choices and note them in the output.

Invoke the `retrospective` skill via the Skill tool and follow it exactly. It will load this week's `drift-scan`-labeled Linear issues from the Continuous Improvement project as Step 0, then synthesize with `Docs/impediments.md`.

Write output to `Design/retros/retro-YYYY-MM-DD.md`. Implement quick wins. Open Linear issues for larger improvements.

**Commit the report before any ticket cites it (THR-798).** The skill's Step 8 is blocking: the report ships as its own `docs/retro-*` PR (`main` is branch-protected) and `git ls-files --error-unmatch` must confirm it is tracked *before* Step 9 files the backlog tickets. The 2026-07-24 run filed five tickets citing a report it never wrote, because the old ordering filed tickets first and had no commit step at all. If this run cannot complete the commit, it must file tickets **without** the report citation rather than pointing at a phantom path.

Registered as a CC-lane task by THR-653 (Pure Claude Code Migration, Phase 3 cutover) — the CLAUDE.md scheduled-task table had claimed this task existed since the weekly continuous-improvement cycle was written, but it had never actually been created.

## Rule-0 minting bar (2026-08-08):

Before filing any process/infrastructure ticket, apply the materiality bar (CLAUDE.md § Prioritization, amended 2026-08-08): quotable loss ≥ ~1 lane/human hour, a corrupted shipped artifact, or ≥3 recurrences in a week. Below the bar: impediment-log row only — no ticket. Every ticket filed carries one cost/benefit line ("costs ~X to fix; not fixing costs ~Y per week"). Grooming additionally demotes any open process ticket lacking that line to Idea with a comment naming this rule. The goal is fewer, denser process tickets — not more receipts.
