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
last_validated_against: 2026-07-22
---

> **Load before authoring:** `Docs/canon/rulebook-quick-reference.md` (always — the synthesis layer for rules of play). Load `Docs/canon/rulebook.md` (full rulebook) when the work touches a specific rule of play and you need depth, status flags, or source citations.

# Attachment Pipeline

This file is the orchestrator. It runs a 4-pass pipeline — draft → editorial → systems audit → implementation merge — dispatching each pass as a subagent briefed from its prompt file in `agents/` (written for real in THR-684; the earlier pointer to `.agents/skills/` copies was broken from the start, see THR-654).

## Pipeline Passes

| Pass | Prompt | Model | Writes |
|------|--------|-------|--------|
| 1. Draft | `agents/draft-prompt.md` | opus | `Docs/plans/attachments/<slug>-draft.md` |
| 2. Editorial + Revision | `agents/editorial-prompt.md` | opus | `<slug>-editorial.md` + `<slug>-revised.md` |
| 3. Systems + Final Merge | `agents/systems-prompt.md` | sonnet | `<slug>-systems.md` + `<slug>-final.md` |
| 4. Implementation | `agents/implementation-prompt.md` | sonnet | data entries + registration + tests |

Dispatch each pass with the prompt file's `{{CATEGORY}}` / `{{PREMISE}}` / `{{CONSTRAINTS}}` / `{{SLUG}}` / `{{TITLE}}` / `{{DATE}}` placeholders filled from the invocation. Stop-points mirror encounter-pipeline: `draft` runs Pass 1 only; `design` runs Passes 1–3; default runs all four. Each pass reads only its declared inputs — the final packet is the implementation contract, so Pass 4 should never need to reopen the draft.

## Step 0 — Canon-First Pre-Read

Read [`Docs/canon/attachments.md`](../../../Docs/canon/attachments.md) first. This is the canonical "what is current?" page for attachment authoring and is the required entrypoint before running `/attachment-pipeline`.

Then continue with the existing pre-reads:
- `Docs/authoring-brief.md` (preferred compiled preamble)
- if the brief is missing or stale: `Docs/plans/2026-04-16-systemic-wiring-guide.md`
- if the brief is missing or stale: `Docs/plans/2026-04-16-game-design-direction.md`

Every attachment should evoke a human condition, not just modify a number.

**Register (plainspoken Malazan, THR-609): baseline is the default.** Attachment names are **interactive text — always plain** (no metaphor, no archaic diction; a player reads the name to know what the item is). Description and flavor prose are **baseline register** — plain, concrete, dry wit over ornament — unless the attachment is a marquee/high-rarity artifact whose lore legitimately reaches for **peak** (declare it). Declare a non-default register with the additive `register?: 'baseline' | 'character' | 'peak'` field (absent → baseline). Canon: [`Docs/canon/prose.md` § the register model](../../../Docs/canon/prose.md); deterministic floor: `registerCompliance` in `window.__DEBUG.proseQualityReport()`.
