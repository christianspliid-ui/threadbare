---
name: content-catalog-manager
description: Content catalog health manager. Three modes — assess (gap analysis across 5 dimensions), upgrade (add effects to legacy items), fill (create new items for remaining gaps). Wraps the attachment pipeline with gap-aware orchestration and Obsidian vault inspiration. Run with `/content-catalog assess`, `/content-catalog upgrade "<spec>"`, or `/content-catalog fill "<spec>"`.
model: opus
---

# Content Catalog Manager

Three-mode orchestrator for systematic content catalog improvement:

```
/content-catalog assess              → gap report + prioritized work plan
/content-catalog upgrade "<spec>"    → upgrade legacy items with effects (4-pass pipeline)
/content-catalog fill "<spec>"       → create new items for remaining gaps (delegates to /attachment-pipeline)
```

**Intended workflow:** assess → upgrade batches → re-assess → fill remaining gaps → final assess.

## Mode Routing

Parse the user's command to determine mode:

| Input | Mode |
|-------|------|
| `/content-catalog assess` | Assess |
| `/content-catalog upgrade "<spec>"` | Upgrade |
| `/content-catalog fill "<spec>"` | Fill |

---

## Mode 1: Assess

Scan all content catalogs and produce a structured gap report across five dimensions, plus a prioritized work plan with ready-to-run batch specs.

### Step 0: Pre-Read

Read these files and inject them as context for the assess agent:

| File | Purpose |
|------|---------|
| `src/data/reward-attachment-catalog.ts` | Primary reward pool |
| `src/data/starter-attachments.ts` | Tutorial items |
| `src/data/agreement-reward-catalog.ts` | Agreement templates |
| `src/data/anomaly-reward-catalog.ts` | Anomaly rewards |
| `src/data/artifact-templates.ts` | Legendary artifacts |
| `src/data/spell-templates.ts` | Spell templates |
| `src/types/effects.ts` | Full effects vocabulary (39 primitives) |
| `src/data/effect-constants.ts` | Balance constants |
| `src/data/encounter-content.ts` | Encounter templates (reward pool demand) |
| `src/data/monster-encounter-content.ts` | Monster encounter templates |
| `src/data/social-encounter-content.ts` | Social encounter templates |
| `src/data/faction-encounter-content.ts` | Faction encounter templates |

Also read Obsidian vault `Index.md` (via Obsidian MCP → `TheFantasyWorldSimulator/Index.md`) for world scope context.

### Step 1: Dispatch Assess Agent

Dispatch sub-agent with `agents/assess-prompt.md`, model `opus`.
Inject all pre-read material as context.
Agent writes: `Docs/plans/attachments/catalog-assessment-YYYY-MM-DD.md`

### Step 2: Report

Present the executive summary to the user. Highlight:
- Total alive vs dead vs empty counts
- Top 5 most critical gaps
- Recommended first upgrade batch

---

## Mode 2: Upgrade

Take existing mechanically-dead items and add composable effects while preserving their identity.

### Slug Generation

Derive a kebab-case slug from the spec, prefixed with `upgrade-`:
- "arms with iron reach" → `upgrade-arms-iron`
- "wound and disease conditions" → `upgrade-wounds-diseases`

All output files go to `Docs/plans/attachments/<slug>-<pass>.md`.

### Step 0: Pre-Read Reference Material

Read these files ONCE and inject as context for all agents:

1. `src/types/effects.ts` — all `AttachmentEffect` type definitions (lines 540-587 for the union)
2. `src/types/attachments.ts` — `PossessionNodeProperties`, `OnUseTrigger`, loss conditions
3. `src/data/effect-constants.ts` — tunable caps and balance constants
4. `STYLE.md` — Threadbare aesthetic
5. A sample from `src/data/reward-attachment-catalog.ts` (first 100 lines for format reference)
6. `Docs/plans/2026-04-05-attachment-primitives-proposal.md` — primitives vocabulary

**Identify target items:** Read the relevant catalog file and extract items matching the batch spec. These are the items the draft agent will upgrade.

**Obsidian vault page selection:** Read vault `Index.md` (via Obsidian MCP), then read pages matching the batch's reach/sphere/category:

| Batch tag | Vault pages to read |
|-----------|-------------------|
| Sphere (e.g., `entropy`) | Sphere definition page — themes, imagery, aesthetic |
| Reach (e.g., `#iron`) | Reach definition page — activities, domain, flavor |
| Faction/culture | Faction or culture page — customs, materials, style |
| Location/biome | Location or biome page — environment, resources |

Inject vault excerpts as "Inspiration Context" for the draft agent — grounding, not binding.

### Step 1: Dispatch Pass 1 (Upgrade Draft)

Dispatch sub-agent with `agents/upgrade-draft-prompt.md`, model `opus`.
Inject: target items, pre-read reference material, vault inspiration context.
Agent writes: `<slug>-draft.md`

### Step 2: Dispatch Pass 2 (Editorial + Revision)

Dispatch sub-agent with `.agents/skills/attachment-pipeline/agents/editorial-prompt.md`, model `opus`.
Inject: `<slug>-draft.md`.
Agent writes: `<slug>-editorial.md` AND `<slug>-revised.md`

**Check verdict:**
- `PASS` or `PASS WITH REVISIONS` → proceed to Step 3.
- `REVISE BEFORE CONTINUING` → re-dispatch Pass 1 once with editorial feedback appended. Second REVISE → stop pipeline.

### Step 3: Dispatch Pass 3 (Systems + Final Merge)

Dispatch sub-agent with `.agents/skills/attachment-pipeline/agents/systems-prompt.md`, model `sonnet`.
Inject: `<slug>-revised.md`, plus source files for validation.
Agent writes: `<slug>-systems.md` AND `<slug>-final.md`

**Check verdict:**
- `READY FOR IMPLEMENTATION` or `READY WITH CAVEATS` → proceed to Step 4.
- `BLOCKED` → stop pipeline, tell user.

### Step 4: Dispatch Pass 4 (Implementation — In-Place Replacement)

Dispatch sub-agent with `.agents/skills/attachment-pipeline/agents/implementation-prompt.md`, model `sonnet`.

**Critical difference from standard attachment pipeline:** Tell the implementation agent:

> **UPGRADE MODE: In-place replacement, not append.**
> For each item in the final file, find the matching `id` in the target catalog file and REPLACE the entire object in-place (preserving its array position). Do NOT append new entries or add section comments. The items already exist — you are upgrading them.
> Commit message: `content: upgrade N items with effects (<batch-name>)`

Agent modifies: `src/data/reward-attachment-catalog.ts` (or `starter-attachments.ts`, `anomaly-reward-catalog.ts`)
Agent runs: `npx tsc --noEmit`, `npm test`, `npx vite build`

**On completion:** commit and push. Report to user.

### Step 5: Done

Report: items upgraded, primitive usage breakdown, reach/tier coverage.

---

## Mode 3: Fill

Create net-new items for gaps that remain after upgrading existing content.

### Step 0: Pre-Read

Same pre-reads as Upgrade mode, plus:
- The full current catalog file (so the draft agent can avoid duplicating names/niches/effects)

**Obsidian vault page selection:** Same strategy as Upgrade mode — read pages matching batch tags.

### Step 1: Delegate to Attachment Pipeline

Invoke the attachment-pipeline skill:
```
/attachment-pipeline <category> "<spec>"
```

Where `<category>` and `<spec>` are extracted from the user's fill command.

Pass the vault inspiration context to the attachment-pipeline orchestrator by injecting it alongside the standard pre-read material.

### Step 2: Done

The attachment-pipeline handles the full 4-pass workflow. Report results to user when complete.

---

## Batch Sizing (inherited from attachment pipeline)

| Category | Batch Size | Tier Distribution |
|----------|-----------|-------------------|
| Single subcategory | 6-8 items | 3 T1, 2 T2, 1-2 T3, 0-1 T4 |
| Mixed | 8-12 items | 4 T1, 3 T2, 2 T3, 1 T4 |
| Conditions/Powers | 6-10 items | 3 T1, 2-3 T2, 1-2 T3, 0-1 T4 |

## Balance Constants (inherited from attachment pipeline)

| Constant | Value | Meaning |
|----------|-------|---------|
| `EFFECT_MODIFIER_CAP_PER_ITEM` | 0.15 | Max total reach bonus from one attachment |
| `EFFECT_MODIFIER_CAP_GLOBAL` | 0.30 | Max total reach bonus from all effects combined |
| `MAX_ATTACHMENT_TIER` | 4 | Tier range: 1 (common) to 4 (legendary) |

**Tier power guidelines:**
- T1: 1 effect, total value ~0.03-0.05
- T2: 1-2 effects, total value ~0.05-0.08
- T3: 2-3 effects, total value ~0.08-0.12
- T4: 3-4 effects, total value ~0.10-0.15

## Model Assignment

| Pass | Model | Why |
|------|-------|-----|
| Assess | **Opus** | Needs judgment to generate useful batch specs |
| 1: Upgrade Draft | **Opus** | Creative effect design requires taste |
| 2: Editorial + Revision | **Opus** | Must catch naming/tone weakness |
| 3: Systems + Final Merge | **Sonnet** | Type correctness and balance math |
| 4: Implementation | **Sonnet** | Code translation of already-authored data |

## File Dependencies

```
Assess mode:
  All catalog files + encounter templates + vault Index.md
      |
      v
  Assess Agent (Opus) --> catalog-assessment-YYYY-MM-DD.md
      |
      v
  User reviews report, picks batches to run

Upgrade mode:
  Reference material + target items + vault pages (pre-read by orchestrator)
      |
      v
  Pass 1 (Upgrade Draft, Opus) --> <slug>-draft.md
      |
      v
  Pass 2 (Editorial+Revision, Opus) --> <slug>-editorial.md + <slug>-revised.md
      |
      +-- REVISE? -> auto-retry once -> still REVISE? -> STOP
      |
      v
  Pass 3 (Systems+Merge, Sonnet) --> <slug>-systems.md + <slug>-final.md
      |
      +-- BLOCKED? -> STOP
      |
      v
  Pass 4 (Implementation, Sonnet) --> catalog file modified in-place
      |
      v
  Commit + Push

Fill mode:
  Delegates to /attachment-pipeline with vault context injected
```
