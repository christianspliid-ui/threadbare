---
name: weekly-retro
description: Run weekly retrospective reading drift-scan issues + impediments log (Fridays ~1 hour after drift scan)
---

Run the weekly retrospective for The Fantasy World Simulator (repo: C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator, Linear team: Threadbare).

This is an automated run of a scheduled task. The user is not present to answer questions. Execute autonomously — make reasonable choices and note them in the output.

Invoke the `retrospective` skill via the Skill tool and follow it exactly. It will load this week's `drift-scan`-labeled Linear issues from the Continuous Improvement project as Step 0, then synthesize with `Docs/impediments.md`.

Write output to `Design/retros/retro-YYYY-MM-DD.md`. Implement quick wins. Open Linear issues for larger improvements.

Registered as a CC-lane task by THR-653 (Pure Claude Code Migration, Phase 3 cutover) — the CLAUDE.md scheduled-task table had claimed this task existed since the weekly continuous-improvement cycle was written, but it had never actually been created.