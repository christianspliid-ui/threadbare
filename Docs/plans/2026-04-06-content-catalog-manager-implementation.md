# Content Catalog Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `content-catalog-manager` skill with three modes — assess (gap analysis), upgrade (add effects to legacy items), and fill (create new items) — that wraps the existing attachment pipeline.

**Architecture:** A single orchestrator skill (`SKILL.md`) routes between three modes. Two new agent prompts handle assess and upgrade-draft. Passes 2-4 (editorial, systems, implementation) reuse the existing attachment-pipeline agents verbatim — no duplication.

**Tech Stack:** Skill markdown files (`.agents/skills/`), dispatched via Claude Code agent system. No TypeScript code to write — this is pure prompt engineering.

**Design spec:** `Docs/plans/2026-04-06-content-catalog-manager-design.md`

---

### Task 1: Create Skill Directory and Orchestrator

**Files:**
- Create: `.agents/skills/content-catalog-manager/SKILL.md`
- Create: `.agents/skills/content-catalog-manager/agents/` (directory)

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .agents/skills/content-catalog-manager/agents
```

- [ ] **Step 2: Write SKILL.md orchestrator**

Create `.agents/skills/content-catalog-manager/SKILL.md` with the following content:

```markdown
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
```

- [ ] **Step 3: Verify skill is discoverable**

```bash
ls .agents/skills/content-catalog-manager/
```

Expected: `SKILL.md` and `agents/` directory.

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/content-catalog-manager/SKILL.md
git commit -m "feat(skill): add content-catalog-manager orchestrator

Three-mode skill for systematic catalog improvement:
- assess: gap analysis across 5 dimensions
- upgrade: add effects to legacy items (4-pass pipeline)
- fill: create new items (delegates to attachment-pipeline)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create Assess Agent Prompt

**Files:**
- Create: `.agents/skills/content-catalog-manager/agents/assess-prompt.md`

- [ ] **Step 1: Write assess-prompt.md**

Create `.agents/skills/content-catalog-manager/agents/assess-prompt.md` with the following content:

```markdown
# Content Catalog Assess Agent

You are a content systems analyst for The Fantasy World Simulator. Scan all content catalogs and produce a structured gap report with a prioritized work plan.

## Your Inputs

The orchestrator has injected these into your context:
1. All content catalog files (reward-attachment-catalog, starter-attachments, agreement-reward-catalog, anomaly-reward-catalog, artifact-templates, spell-templates)
2. The `AttachmentEffect` type union from `src/types/effects.ts` (39 primitives)
3. Balance constants from `src/data/effect-constants.ts`
4. Encounter template files (encounter-content, monster-encounter-content, social-encounter-content, faction-encounter-content)
5. Obsidian vault Index.md (world scope)

## What You Must Produce

Write a comprehensive gap report to `Docs/plans/attachments/catalog-assessment-YYYY-MM-DD.md`.

### Classification Rules

For every item in the catalogs, classify it:

| Status | Rule |
|--------|------|
| **Alive** | Has an `effects[]` array with at least one entry using a non-passive primitive (conditional, cooldown, stacking, decay, tradeoff, test_shaper, reactive, transform, etc.) |
| **Dead** | Has no `effects[]` array, OR has only `reachBonus`/`domainContributions` flat modifiers, OR has `effects[]` with only passive entries |
| **Empty** | No item exists for a given reach × subcategory × tier cell |

An item with `onUseTriggers` but no `effects[]` is still **Dead** — triggers are the old pattern.

### Dimension 1: Reach × Subcategory × Tier Matrix

Build a matrix of 11 reaches × 7 possession subcategories × 4 tiers.

**Reaches:** iron, gold, shadow, veil, heart, eye, stone, star, flesh, time, life

**Subcategories:** arms, mounts_beasts, vestments, tomes_scrolls, relics_talismans, tools_instruments, provisions

**Tiers:** 1 (Mundane), 2 (Storied), 3 (Mythic), 4 (Legendary)

For each cell, count items and classify. An item's reach is determined by its `tags` array (e.g., `#iron`) or `reachBonus` keys.

Output as a heatmap table per subcategory:

```markdown
### Arms
| Reach | T1 | T2 | T3 | T4 |
|-------|----|----|----|----|
| Iron  | 2 Dead | 1 Alive | — | — |
| Gold  | — | — | — | — |
| Shadow | 1 Dead | — | 1 Dead | — |
...
```

Use `—` for empty cells. Format alive/dead counts clearly.

### Dimension 2: Sphere Affinity Coverage

For each of the 12 spheres, count items with matching `sphereAffinity`:

**Foundation:** chaos, order, light, darkness
**Creation:** force, matter, energy, life, mind, spirit, time, entropy

```markdown
| Sphere | Items | Alive | Dead | Notes |
|--------|-------|-------|------|-------|
| chaos  | 2     | 0     | 2    | No alive items |
| entropy | 5    | 1     | 4    | Mostly dead |
...
```

Flag spheres with fewer than 3 total items or 0 alive items.

### Dimension 3: Effect Primitive Usage

For each of the 39 effect primitives, count how many catalog items use it:

```markdown
| Primitive | Usage Count | Tier Range | Notes |
|-----------|------------|------------|-------|
| passive | 8 | T1-T3 | Overused as sole effect |
| conditional | 3 | T1-T2 | Never used at T3-T4 |
| cooldown | 0 | — | UNUSED — creative opportunity |
| stacking | 1 | T2 | Underrepresented |
...
```

Flag primitives with 0 usage as creative opportunities. Note tier gaps (e.g., "only used at T1-T2, never T3-T4").

### Dimension 4: Encounter Reward Pool Demand

Scan all encounter templates for `rewardPool` entries. For each `tagFilter` value:

```markdown
| Tag | Encounters Demanding | Items Available | Deficit |
|-----|---------------------|----------------|---------|
| #beast | 4 | 2 | YES — need 1+ more |
| #ancient | 3 | 5 | No |
| #cursed | 2 | 1 | YES — need 2+ more |
...
```

Also check: do encounters request categories (possession, condition, bestowed_power) that have thin pools?

### Dimension 5: Category Balance

```markdown
| Category | Total | Alive | Dead | % Alive | Notes |
|----------|-------|-------|------|---------|-------|
| Possessions | 65 | 8 | 57 | 12% | Critical — 88% dead |
| Conditions | 27 | 0 | 27 | 0% | All dead |
| Blessings | 5 | 0 | 5 | 0% | All dead |
| Bestowed Powers | 12 | 1 | 11 | 8% | Nearly all dead |
| Agreements | 6 | 6 | 0 | 100% | Healthy |
| Spells | 5 | 5 | 0 | 100% | Healthy |
| Artifacts | 3 | 3 | 0 | 100% | Healthy |
```

### Prioritized Work Plan

Generate two phases of batch specs:

**Phase 1: Upgrade Batches**

Group dead items into upgrade batches of 8-12 items, ordered by impact:
1. **Highest impact first:** Items used most by encounter reward pools (Dimension 4 demand)
2. **Then by category severity:** Categories with 0% alive first (Dimension 5)
3. **Then by reach coverage:** Fills the most empty cells in the matrix (Dimension 1)

For each batch:

```markdown
| Batch | Items | Impact | Spec |
|-------|-------|--------|------|
| upgrade-batch-1 | 8 items (list IDs) | Fills #beast demand, upgrades all T1-T2 arms | `/content-catalog upgrade "T1-T2 arms with iron/shadow reach"` |
| upgrade-batch-2 | 10 items (list IDs) | All conditions currently dead | `/content-catalog upgrade "wound and disease conditions"` |
...
```

List the specific item IDs in each batch so the upgrade agent knows exactly which items to process.

**Phase 2: Fill Batches**

After all upgrades, identify remaining empty cells. Generate fill batch specs targeting:
1. Subcategories with no coverage for a given reach
2. Underused effect primitives (from Dimension 3) — suggest them in the spec
3. Spheres with < 3 items (from Dimension 2)
4. Tags with supply deficit (from Dimension 4)

For each batch:

```markdown
| Batch | Gap Addressed | Spec |
|-------|--------------|------|
| fill-batch-1 | No Shadow vestments at any tier | `/content-catalog fill "T1-T3 Shadow/Veil vestments, entropy sphere, emphasizing ConditionalEffect and DecayEffect"` |
| fill-batch-2 | No mounts with Eye reach | `/content-catalog fill "T1-T2 mounts and beasts with Eye/Heart reach, mind sphere, using ReactiveEffect"` |
...
```

### Executive Summary

At the top of the report, provide:

```markdown
## Executive Summary

- **Total items scanned:** N across K catalog files
- **Alive:** N (N%) — has composable effects with non-passive primitives
- **Dead:** N (N%) — reachBonus only or no effects
- **Empty cells:** N of 308 in the reach×subcategory×tier matrix
- **Effect primitives unused:** N of 39
- **Spheres with < 3 items:** N of 12
- **Tags with supply deficit:** N

### Top 5 Critical Gaps
1. [Most impactful gap]
2. ...

### Recommended First Batch
`/content-catalog upgrade "<spec>"` — [why this batch first]
```

## What You Must NOT Do

- Do not design effects or write attachment templates — that's the draft agent's job
- Do not modify any source files
- Do not make subjective quality judgments about existing items beyond alive/dead classification
- Do not count `onUseTriggers` as "alive" — they are the old pattern, not composable effects
```

- [ ] **Step 2: Verify file exists**

```bash
ls .agents/skills/content-catalog-manager/agents/
```

Expected: `assess-prompt.md`

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/content-catalog-manager/agents/assess-prompt.md
git commit -m "feat(skill): add assess agent prompt for catalog gap analysis

Five-dimension analysis: reach×subcategory×tier matrix, sphere coverage,
effect primitive usage, encounter demand vs supply, category balance.
Produces prioritized upgrade + fill batch specs.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Create Upgrade Draft Agent Prompt

**Files:**
- Create: `.agents/skills/content-catalog-manager/agents/upgrade-draft-prompt.md`

- [ ] **Step 1: Write upgrade-draft-prompt.md**

Create `.agents/skills/content-catalog-manager/agents/upgrade-draft-prompt.md` with the following content:

```markdown
# Attachment Upgrade Draft Agent

You are a game systems designer for The Fantasy World Simulator. You receive existing mechanically-dead items and design composable effects for them, preserving their identity while making them mechanically interesting.

## Your Inputs

- **Batch spec:** {{SPEC}}
- **Target items:** {{ITEMS}} (existing items to upgrade)
- **Inspiration context:** Obsidian vault excerpts for the batch's reach/sphere/faction themes

The orchestrator has also injected:
1. The primitives vocabulary (from the proposal doc)
2. The `AttachmentEffect` type union (from `src/types/effects.ts`)
3. Balance constants (from `src/data/effect-constants.ts`)
4. Format reference (sample entries from `src/data/reward-attachment-catalog.ts`)
5. `STYLE.md` — Threadbare aesthetic

## What You Must Produce

Write upgraded attachment templates to `Docs/plans/attachments/{{SLUG}}-draft.md`.

### File Header

```
# Attachment Upgrade Pipeline: {{SPEC}}
> Slug: {{SLUG}} | Pass: draft | Mode: upgrade
> Items: {{COUNT}} items | Date: {{DATE}}
```

### For Each Item

Produce the full TypeScript object with effects added. The output format is identical to the standard attachment pipeline draft:

```typescript
{
  id: '<EXISTING_ID — do not change>',
  type: '<EXISTING — do not change>',
  name: '<EXISTING — do not change>',
  properties: {
    subcategory: '<EXISTING — do not change>',
    tier: <EXISTING — do not change>,
    tags: [<EXISTING — do not change>],
    mechanicalSummary: '<UPDATED — must accurately describe new effects[]>',
    lossCondition: '<EXISTING — do not change>',
    flavorText: '<EXISTING — do not change>',
    effects: [
      // NEW: composable effects designed by you
    ],
    // Keep existing optional fields (sphereAffinity, image, etc.) unchanged
    // Remove reachBonus — it's subsumed by PassiveEffect entries in effects[]
  },
}
```

### Summary Table

After all items, include:

| # | Name | Tier | Niche | Primitives Added | Total Value | Changes |
|---|------|------|-------|-----------------|-------------|---------|
| 1 | Thornwood Staff | T2 | Living weapon, nature-reactive | passive + conditional + reactive | 0.07 | +effects[], -reachBonus, updated summary |

## The Upgrade Process

For each item in the batch, follow these steps in order:

### Step 1: Infer Gameplay Niche

Read the item's name, flavor text, reach tags, tier, and subcategory. Infer what gameplay niche this item should fill.

Examples:
- "Thornwood Staff" (T2, iron/stone, "The wood is alive. It sprouts small leaves in spring, thorns in winter.") → **Living weapon niche**: reactive to seasons/environment, grows stronger through use
- "Bronze Spear" (T1, iron, "Pitted and green with age...") → **Reliable workhorse niche**: simple conditional bonus in direct combat
- "The Woven Sky" (T4, star/veil, legendary vestment) → **Cosmic protection niche**: complex composed effects that interact with celestial/mystical themes

The niche should emerge naturally from the item's existing identity. Don't force a niche that contradicts the name or flavor.

### Step 2: Convert reachBonus to PassiveEffect

Every existing `reachBonus` entry becomes a PassiveEffect with the exact same values:

```typescript
// Before (old pattern):
reachBonus: { iron: 0.05, stone: 0.03 }

// After (new pattern):
effects: [
  { type: 'passive', reach: 'iron', value: 0.05 },
  { type: 'passive', reach: 'stone', value: 0.03 },
  // ... plus non-passive effects below
]
```

**Do not change the reach values.** The passive effects must produce identical mechanical output to the old reachBonus.

### Step 3: Add Non-Passive Effects

Based on the inferred niche, add at least one non-passive effect. Complexity scales with tier:

**T1 (Mundane) — 1 effect total:**
The passive conversion may be the only effect, but prefer adding a simple conditional or trait_grant if the item's niche suggests one. Keep it minimal.

Example — Bronze Spear (T1, iron):
```typescript
effects: [
  { type: 'passive', reach: 'iron', value: 0.03 },
  { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.02 },
]
```

**T2 (Storied) — 1-2 effects:**
Passive + one interesting primitive that reinforces the niche.

Example — Thornwood Staff (T2, iron/stone):
```typescript
effects: [
  { type: 'passive', reach: 'iron', value: 0.06 },
  { type: 'passive', reach: 'stone', value: 0.03 },
  { type: 'reactive', triggerEvent: 'encounter_success', nestedEffect: {
    type: 'stacking', trigger: 'encounter_success', reach: 'stone', valuePerStack: 0.01, maxStacks: 3
  }},
]
```

**T3 (Mythic) — 2-3 effects:**
Passive + composition of primitives with interaction.

Example — Starfall Longbow (T3, iron/eye):
```typescript
effects: [
  { type: 'passive', reach: 'iron', value: 0.08 },
  { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.04 },
  { type: 'cooldown', activeTicks: 6, dormantTicks: 12, reach: 'iron', activeValue: 0.04 },
]
```

**T4 (Legendary) — 3-4 effects:**
Rich composition where effects reinforce each other.

Example — The Woven Sky (T4, star/veil):
```typescript
effects: [
  { type: 'passive', reach: 'star', value: 0.10 },
  { type: 'passive', reach: 'veil', value: 0.05 },
  { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.05 },
  { type: 'reactive', triggerEvent: 'encounter_failure', nestedEffect: {
    type: 'duration', ticksRemaining: 6, reach: 'veil', value: 0.05
  }},
]
```

### Step 4: Update mechanicalSummary

Rewrite the summary to accurately describe the new effects:

```
// Before:
mechanicalSummary: '+0.06 Iron reach, +0.03 Stone reach'

// After:
mechanicalSummary: '+0.06 Iron, +0.03 Stone, gains +0.01 Stone per encounter success (max +0.03)'
```

### Step 5: Remove reachBonus

Delete the `reachBonus` field entirely. Its values are now expressed as PassiveEffect entries in `effects[]`.

Also remove `domainContributions` if present — same pattern, same migration.

## Inspiration Context

The orchestrator may inject Obsidian vault excerpts relevant to this batch's themes. Use them for:
- **Niche inspiration:** A sphere page describing "entropy as unraveling" might inspire a decay-themed effect for an entropy-aligned item
- **Naming validation:** Ensure your niche inference is consistent with established lore
- **Effect flavor:** Vault descriptions of how a reach manifests can suggest which primitives fit best

This context is grounding, not binding. You don't need to reference every detail.

## Design Rules

1. **Preserve identity.** Never change id, name, flavorText, tier, tags, subcategory, lossCondition, sphereAffinity, or image. The item must still feel like the same item.

2. **reachBonus values are sacred.** The PassiveEffect conversions must use the exact same reach and value as the old reachBonus. You're adding effects on top, not changing the base power.

3. **Non-passive effects are mandatory.** Every item must have at least one effect that isn't a plain passive. This is the whole point of the upgrade.

4. **Respect caps.** Per-item total: 0.15 max reach bonus across all effects. Individual effect values proportional to tier.

5. **Niche coherence.** The added effects should feel natural for the item. A scholarly tome shouldn't get a combat stacking effect. A crude weapon shouldn't get mystical resonance.

6. **Variety across the batch.** Don't give every item the same primitive. If one item gets conditional, another should get stacking or decay or cooldown. Spread the primitive vocabulary.

7. **Use the inspiration context.** If the vault says "Iron reach governs violence, labor, and endurance" then an Iron weapon's non-passive effect should relate to combat or endurance — not trade or diplomacy.

## Primitive Quick Reference

| Primitive | Key Fields | Best For |
|-----------|-----------|----------|
| `passive` | `reach`, `value` | Base layer from reachBonus conversion. Never the only effect. |
| `conditional` | `condition`, `reach`, `value` | Situational bonuses. Most versatile. |
| `consumable_charge` | `charges`, `chargeEffect` | Limited-use dramatic moments. |
| `cooldown` | `activeTicks`, `dormantTicks`, `reach`, `activeValue` | Powerful but intermittent. |
| `stacking` | `trigger`, `valuePerStack`, `maxStacks`, `reach` | Rewards consistent behavior. |
| `decay` | `startValue`, `changePerTick`, `limitValue`, `reach` | Temporary buffs that fade. |
| `tradeoff` | `bonuses`, `penalties` | Interesting choices: +Iron, -Heart. |
| `test_shaper` | `shaperType`, `reach` | Rerolls, outcome shifts. |
| `prevent_loss` | `protectedCategory` | Rescue on failure. |
| `trait_grant` | `grantedTrait` | Unlock capabilities. |
| `duration` | `ticksRemaining`, `reach`, `value` | Buff with countdown. |
| `transform` | `triggerEvent`, `probability`, `transformInto` | Evolution/degradation. |
| `reactive` | `triggerEvent`, `nestedEffect` | Fires on events. |
| `behavior_weight` | `encounterType`, `multiplier` | Personality shaping. |
| `social_modifier` | `faction`, `modifier` | Relationship effects. |
| `action_gate` | `actionId`, `gateType` | Locks/unlocks actions. |
| `axiological_drift` | `valuePair`, `driftPerTick` | Slow personality change. |
| `range_modifier` | `movementCostMod`, `awarenessRangeMod` | Travel/perception. |
| `tag_immunity` | `immuneToTags` | Block conditions by tag. |

## What You Must NOT Do

- Do not change names, flavor text, tags, tier, subcategory, loss condition, or sphere affinity
- Do not invent new items — only upgrade the items provided
- Do not exceed per-item cap (0.15 total reach bonus)
- Do not use only passive effects — every item needs at least one non-passive
- Do not give all items the same primitive — spread variety across the batch
```

- [ ] **Step 2: Verify file exists**

```bash
ls .agents/skills/content-catalog-manager/agents/
```

Expected: `assess-prompt.md` and `upgrade-draft-prompt.md`

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/content-catalog-manager/agents/upgrade-draft-prompt.md
git commit -m "feat(skill): add upgrade-draft agent prompt

Designs composable effects for existing mechanically-dead items.
Preserves identity (name, flavor, tier, tags), converts reachBonus
to PassiveEffect, adds non-passive primitives based on inferred niche.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Smoke Test — Run Assess Mode

**Files:**
- None modified — this is a verification step

- [ ] **Step 1: Verify skill loads**

Run the skill to confirm it's discoverable and the orchestrator parses correctly:

```bash
# The skill should appear in the skill list
ls .agents/skills/content-catalog-manager/
```

Expected output:
```
SKILL.md
agents/
```

- [ ] **Step 2: Verify agent prompts are readable**

```bash
ls .agents/skills/content-catalog-manager/agents/
```

Expected output:
```
assess-prompt.md
upgrade-draft-prompt.md
```

- [ ] **Step 3: Verify cross-references to attachment-pipeline agents exist**

The SKILL.md references these paths for reuse — confirm they exist:

```bash
ls .agents/skills/attachment-pipeline/agents/
```

Expected output includes:
```
draft-prompt.md
editorial-prompt.md
systems-prompt.md
implementation-prompt.md
```

- [ ] **Step 4: Run assess mode**

```
/content-catalog assess
```

Verify:
- The orchestrator reads all catalog files
- The assess agent produces a report at `Docs/plans/attachments/catalog-assessment-YYYY-MM-DD.md`
- The report contains all 5 dimensions
- The work plan contains concrete batch specs
- Item counts roughly match: ~152 total, ~115 dead, ~35 alive

- [ ] **Step 5: Review the assess output**

Read `Docs/plans/attachments/catalog-assessment-YYYY-MM-DD.md` and verify:
- Executive summary numbers are plausible
- Heatmap tables cover all reaches × subcategories
- Upgrade batch specs reference real item IDs from the catalogs
- Fill batch specs target actual gaps (not already-covered cells)

---

### Task 5: Final Commit and Push

- [ ] **Step 1: Verify all files are committed**

```bash
git status
```

Expected: clean working tree for `.agents/skills/content-catalog-manager/` files.

- [ ] **Step 2: Push to remote**

```bash
git push
```

- [ ] **Step 3: Verify skill file structure**

Final structure should be:

```
.agents/skills/content-catalog-manager/
  SKILL.md                            (orchestrator — 3 modes)
  agents/
    assess-prompt.md                  (gap analysis agent)
    upgrade-draft-prompt.md           (modified Pass 1 for upgrades)
```

Passes 2-4 are reused from:
```
.agents/skills/attachment-pipeline/agents/
    editorial-prompt.md               (reused by upgrade mode)
    systems-prompt.md                 (reused by upgrade mode)
    implementation-prompt.md          (reused by upgrade mode, with in-place instruction)
```
