---
name: weekly-memory-grooming
description: Groom CC (and any residual Cowork) memory files via consolidate-memory skill (Sunday evening local)
---

Run weekly memory hygiene for TheFantasyWorldSimulator.

This is an automated run of a scheduled task. The user is not present to answer questions. Execute autonomously.

## Paths
- Claude Code memory (primary): `C:\Users\chris\.claude\projects\C--Users-chris-Dev-Projects-TheFantasyWorldSimulator\memory\MEMORY.md`
- Cowork memory (legacy, dynamic): newest matching `C:\Users\chris\AppData\Roaming\Claude\local-agent-mode-sessions\*\*\spaces\*\memory\MEMORY.md`

## Procedure
1. Groom the Claude Code memory target first — it is the live one post-migration.
2. Resolve the Cowork memory path dynamically from the glob above. If none exists, log `Cowork memory: missing - skipped` and continue. Threadbare work no longer runs in Cowork (Pure Claude Code Migration), so a miss here is expected, not an error.
3. For each resolved target:
   - If the `consolidate-memory` skill/tool is available, run it for that target.
   - If it is unavailable, do a fail-soft dry pass: verify the file exists and is readable, count entries, detect obvious duplicate index rows, and log a no-op summary.
4. Emit one summary line per target:
   - `<agent> memory: kept=<n> merged=<n> pruned=<n> status=<ok|skipped|warning>`
5. Never delete files outright. If uncertain, keep entries and only report candidates.

Registered as a CC-lane task by THR-653 (Pure Claude Code Migration, Phase 3 cutover) — the CLAUDE.md table had listed this as a CC task but it was never actually registered with the scheduler.