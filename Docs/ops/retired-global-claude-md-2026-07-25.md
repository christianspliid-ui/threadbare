# Retired: global `~/.claude/CLAUDE.md` (2026-07-25)

**What it was.** `C:\Users\chris\.claude\CLAUDE.md` — 71 lines of generic "reduce common LLM coding mistakes" guidance that loaded into **every** Claude Code session on this machine, across all of Christian's projects, not only Threadbare.

**Why it was retired.** THR-760 (CLAUDE.md slimming pass, plan `Docs/plans/2026-07-25-thr-760-claude-md-slimming.md` item 5). Two reasons:

1. It is the genre Anthropic's Claude 5 context-engineering guidance explicitly retires — broad behavioral exhortation that the model already does by default, paid for on every session.
2. Its "if uncertain, ask" / "stop and ask" default **conflicts with Threadbare's autonomous scheduled sessions**, which run unattended and must decide rather than block. A rule that cannot be followed in the lane it loads into is worse than no rule.

**Safety check performed before deletion (2026-07-25, re-verified 2026-07-26 at execution):** the file was read in full and contains no project-specific facts, no paths, and names no project — so retiring it is safe cross-project. The plan's instruction was: if project-specific content had appeared in it since the design pass, stop and surface instead of deleting. It had not.

**Human gate:** satisfied via chat review 2026-07-25 — Christian approved the 5-item THR-760 scope including this retirement.

**Recovery.** The file was outside version control, so this archive is the only copy. To restore, write the content below back to `C:\Users\chris\.claude\CLAUDE.md`.

---

## Archived content (verbatim, 71 lines)

```markdown
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
```

---

**Where the surviving rules live now.** Nothing in the archived file was uniquely load-bearing for Threadbare — the project `CLAUDE.md` already carries the equivalents that matter here: Non-Functional Priorities (tunability/simplicity pressure), the Definition of Done (goal-driven verification with named gates), and the Debugging Protocol (verify the noun before the verb). The archived file's "ask when uncertain" default is deliberately **not** carried forward; Threadbare's execution lane decides and records the decision instead.
