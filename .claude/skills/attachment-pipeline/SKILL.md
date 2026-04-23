---
name: attachment-pipeline
description: >
  Automated 4-pass attachment authoring pipeline: draft composable attachments
  using the primitive vocabulary, editorial review for Threadbare tone, systems
  audit for balance and cap compliance, final merge into catalog files.
  Run with `/attachment-pipeline <category> <premise>`.
  Triggers on "attachment pipeline", "author attachments", "create attachments",
  "new items", "new possessions", "new conditions", "new bestowed powers".
model: opus
---

# Attachment Pipeline

This skill is defined at `.agents/skills/attachment-pipeline/`. See that directory for the full orchestrator SKILL.md and all 4 agent prompts (`agents/draft-prompt.md`, `agents/editorial-prompt.md`, `agents/systems-prompt.md`, `agents/implementation-prompt.md`).

Load the `.agents` version for execution. This file is a pointer for the Claude Code skill registry.

**Game design direction enforcement:** The `.agents` orchestrator now requires checking `Docs/authoring-brief.md` (compiled preamble) before authoring — preferred over the full source docs. If the brief is missing or stale, fall back to `Docs/plans/2026-04-16-systemic-wiring-guide.md` and `Docs/plans/2026-04-16-game-design-direction.md`. Every attachment must evoke a human condition, not just modify a number. See the orchestrator SKILL.md for details.
