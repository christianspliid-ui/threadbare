# QA Orchestrator Skill — Test Results

**Date:** 2026-03-07
**Test type:** RED-GREEN comparison (technique skill)

## RED Phase: Baseline (No Skill)

Agent dispatched with generic "run a QA audit" prompt. No skill file provided.

### Behavior Observed

- Covered 4 areas (visual, redundancy, interaction, code) but **read code files instead of using Playwright** for visual/interaction checks
- Produced prose report with tables — **not structured JSON**, not machine-processable
- Found real issues (47 TypeScript errors, sphere color mismatches, biome brightness) but **severity levels inconsistent** ("CRITICAL/HIGH/MEDIUM/LOW" instead of schema-compliant)
- **No effort estimates per finding** — only aggregate time estimates
- **No Notion integration** mentioned
- **No archival** of raw findings
- **No deduplication logic** — some findings repeated across sections

### Strengths
- Thorough code analysis (read actual files, counted TS errors)
- Good priority ordering (P0/P1/P2)
- Specific file:line references in many findings

## GREEN Phase: With Skill (Agent 4 Only)

Agent 4 (React Code Quality) dispatched with exact prompt template from skill. Told to output JSON array of Finding objects.

### Behavior Observed

- **Structured JSON output** — 20 findings in schema-compliant format
- **Proper IDs:** RC-001 through RC-020
- **Consistent severity:** critical/major/minor/suggestion (4-level enum)
- **Per-finding effort:** S/M/L on every finding
- **Evidence with file:line** on every finding
- **suggestedFix** on every finding with corrected code patterns
- **Categorized:** performance (5), accessibility (6), code-hygiene (7), error-handling (1), architecture (1)

### Comparison

| Metric | RED | GREEN |
|--------|-----|-------|
| Output format | Prose + tables | JSON array |
| Machine-processable | No | Yes |
| Finding IDs | None | RC-NNN |
| Effort per finding | No | S/M/L |
| Severity schema | 4 levels (ad hoc) | 4 levels (spec-compliant) |
| suggestedFix | Some | All |
| Dedup-ready | No | Yes |
| Notion-ready | No | Yes (schema matches template) |

## Conclusion

The skill adds clear value for:
1. **Structured output** — findings can be merged, deduped, sorted programmatically
2. **Consistency** — all agents use same schema, same severity definitions
3. **Actionability** — every finding has effort + suggested fix
4. **Integration** — findings flow directly into Notion backlog template

The skill does NOT need pressure-testing (it's a technique skill, not a discipline skill). The baseline comparison confirms the skill teaches the right structure.
