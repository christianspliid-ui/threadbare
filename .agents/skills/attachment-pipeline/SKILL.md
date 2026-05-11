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
last_validated_against: 2026-05-12
---

> **Load before authoring:** `Docs/canon/rulebook-quick-reference.md` (always — the synthesis layer for rules of play). Load `Docs/canon/rulebook.md` (full rulebook) when the work touches a specific rule of play and you need depth, status flags, or source citations.

# Attachment Pipeline

This skill is defined at `.agents/skills/attachment-pipeline/`. See that directory for the full orchestrator SKILL.md and all 4 agent prompts (`agents/draft-prompt.md`, `agents/editorial-prompt.md`, `agents/systems-prompt.md`, `agents/implementation-prompt.md`).

Load the `.agents` version for execution. This file is a pointer for the Claude Code skill registry.

## Step 0 — Canon-First Pre-Read

Read [`Docs/canon/attachments.md`](../../../Docs/canon/attachments.md) first. This is the canonical "what is current?" page for attachment authoring and is the required entrypoint before running `/attachment-pipeline`.

Then continue with the existing pre-reads:
- `Docs/authoring-brief.md` (preferred compiled preamble)
- if the brief is missing or stale: `Docs/plans/2026-04-16-systemic-wiring-guide.md`
- if the brief is missing or stale: `Docs/plans/2026-04-16-game-design-direction.md`

Every attachment should evoke a human condition, not just modify a number.
