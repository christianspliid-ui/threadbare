# Content Catalog Manager — Design Spec

> Date: 2026-04-06
> Status: Draft
> Skill: `content-catalog-manager`

## Problem

The Fantasy World Simulator has a 39-primitive effects library that is barely used. Of ~152 content items across all catalogs, ~115 (77%) are "mechanically dead" — they carry only flat `reachBonus` numbers with no composable effects. The reward-attachment-catalog is worst at 90.6% dead. Meanwhile, there is no tooling to identify what content is missing across the reach/tier/sphere/category matrix.

Two capabilities are needed:

1. **Gap analysis** — systematically identify what content is missing or mechanically dead
2. **Automated production** — upgrade existing items and create new ones to fill gaps, at high reproducible quality without human interaction besides final evaluation

## Solution

A single orchestrator skill — `content-catalog-manager` — with three modes that wrap the existing attachment pipeline:

```
/content-catalog assess              → gap report + prioritized work plan
/content-catalog upgrade <batch>     → upgrade legacy items with effects
/content-catalog fill <batch>        → create new items for remaining gaps
```

The intended workflow is: assess → upgrade batches → re-assess → fill remaining gaps → final assess.

## Skill File Structure

```
.agents/skills/content-catalog-manager/
  SKILL.md                        — orchestrator (mode routing, pre-reads, vault lookup)
  agents/
    assess-prompt.md              — gap analysis agent prompt
    upgrade-draft-prompt.md       — modified Pass 1 for upgrading existing items
```

Passes 2-4 (editorial, systems, implementation) reuse the existing attachment pipeline agents verbatim. No duplication.

---

## Mode 1: Assess

### Purpose

Scan all content catalogs and produce a structured gap report across five dimensions, plus a prioritized work plan with ready-to-run batch specs.

### Inputs

The assess agent reads:

| File | Purpose |
|------|---------|
| `src/data/reward-attachment-catalog.ts` | Primary reward pool (~106 items) |
| `src/data/starter-attachments.ts` | Tutorial items (~8 possessions, ~4 conditions) |
| `src/data/agreement-reward-catalog.ts` | Agreement templates (~6) |
| `src/data/anomaly-reward-catalog.ts` | Anomaly rewards (~24) |
| `src/data/artifact-templates.ts` | Legendary artifacts (~3) |
| `src/data/spell-templates.ts` | Spell templates (~5) |
| `src/types/effects.ts` | Full effects vocabulary (39 primitives) |
| `src/data/effect-constants.ts` | Balance constants |
| Encounter templates (`src/data/encounter-content.ts`, `monster-encounter-content.ts`, `social-encounter-content.ts`, `faction-encounter-content.ts`) | Reward pool demand (tagFilters) |
| Obsidian vault `Index.md` (via MCP) | World scope — factions, cultures, spheres, locations |

### Five Dimensions of Analysis

**Dimension 1: Reach x Subcategory x Tier**

Matrix of 11 reaches x 7 possession subcategories x 4 tiers (308 cells). Each cell is classified:

| Status | Meaning |
|--------|---------|
| Empty | No item exists for this combination |
| Dead | Item exists but has no `effects[]` (reachBonus only) |
| Alive | Item exists with composable effects |

Output: heatmap table. Highlight empty and dead cells.

**Dimension 2: Sphere Affinity Coverage**

12 spheres (4 foundation + 8 creation). For each sphere:
- Count of items with matching `sphereAffinity`
- Cross-referenced with reach — identify "no Force-sphere arms" type holes
- Flag spheres with fewer than 3 items total

**Dimension 3: Effect Primitive Usage**

For each of the 39 effect primitives:
- Count of items using it
- Flag primitives with zero usage as creative opportunities
- Note which tiers they appear at (e.g., "ConditionalEffect only used at T1-T2, never T3-T4")

**Dimension 4: Encounter Reward Pool Demand**

Scan all encounter templates for `rewardPool.tagFilters`. For each tag:
- Count of encounters demanding it
- Count of catalog items matching it
- Flag tags with demand > 0 but supply < 3 items

**Dimension 5: Category Balance**

Across all catalogs:

| Category | Count target | Notes |
|----------|-------------|-------|
| Possessions | Largest pool | 7 subcategories should each have depth |
| Conditions | Wounds, diseases, curses | Need variety per condition type |
| Blessings | Positive conditions | Should match curse count roughly |
| Bestowed powers | Spell-like abilities | Need tier spread |
| Agreements | Pacts, debts, oaths | Already 100% alive, assess for variety |

### Output

Markdown report at `Docs/plans/attachments/catalog-assessment-YYYY-MM-DD.md`:

```markdown
# Content Catalog Assessment — YYYY-MM-DD

## Executive Summary
- Total items: N
- Alive: N (N%)
- Dead: N (N%)
- Empty cells: N of 308

## Dimension 1: Reach x Subcategory x Tier
[Heatmap table]

## Dimension 2: Sphere Coverage
[Table with counts per sphere]

## Dimension 3: Effect Primitive Usage
[Table: primitive name, usage count, tier range, notes]

## Dimension 4: Reward Pool Demand vs Supply
[Table: tag, demand count, supply count, deficit flag]

## Dimension 5: Category Balance
[Table: category, count, alive%, notes]

## Prioritized Work Plan

### Phase 1: Upgrade Batches (existing items → add effects)
| Batch | Items | Spec |
|-------|-------|------|
| batch-1-arms-iron | 5 items | `/content-catalog upgrade "arms with iron/force reach"` |
| batch-2-conditions-wounds | 8 items | `/content-catalog upgrade "wound and disease conditions"` |
| ... | ... | ... |

### Phase 2: Fill Batches (new items for remaining gaps)
| Batch | Gap addressed | Spec |
|-------|--------------|------|
| fill-1-vestments-shadow | No T2-T3 Shadow vestments | `/content-catalog fill "T2-T3 vestments, Shadow/Veil reach, entropy sphere, ConditionalEffect + DecayEffect"` |
| ... | ... | ... |
```

---

## Mode 2: Upgrade

### Purpose

Take existing mechanically-dead items and add effects while preserving their identity.

### What Changes vs What Doesn't

| Preserved (no changes) | Updated |
|------------------------|---------|
| `id` | `effects[]` — added or enriched |
| `name` | `mechanicalSummary` — updated to reflect effects |
| `flavorText` | `reachBonus` — removed (subsumed by PassiveEffect) |
| `tier` | |
| `tags` | |
| `subcategory` | |
| `lossCondition` | |
| `sphereAffinity` | |
| `image` | |

### Batch Sizing

8-12 items per upgrade batch, grouped by affinity:
- Same subcategory (e.g., all arms), or
- Same reach cluster (e.g., all Iron-primary items), or
- Same condition type (e.g., all wounds)

Grouping by affinity helps the draft agent design effects that feel cohesive and avoid mechanical duplication within the batch.

### Pipeline: 4 Passes

**Pass 0: Pre-Read (Orchestrator)**

The orchestrator injects these files before dispatching any agent:

| File | Purpose |
|------|---------|
| `src/types/effects.ts` (lines 540-587: AttachmentEffect union) | Valid effect discriminants |
| `src/types/attachments.ts` | Property shapes, loss conditions, triggers |
| `src/data/effect-constants.ts` | Balance caps and limits |
| `STYLE.md` | Threadbare aesthetic |
| Relevant Obsidian vault pages (see below) | Creative inspiration |

**Obsidian vault page selection:** The orchestrator reads vault `Index.md`, then selects pages matching the batch's reach/sphere/category:

| Batch tag | Vault pages to read |
|-----------|-------------------|
| Sphere (e.g., `entropy`) | Sphere definition page — themes, imagery, aesthetic |
| Reach (e.g., `#iron`) | Reach definition page — activities, domain, flavor |
| Faction/culture | Faction or culture page — customs, materials, style |
| Location/biome | Location or biome page — environment, resources |

The draft agent receives these as "inspiration context" — grounding, not binding.

**Pass 1: Upgrade Draft (Opus)**

Custom prompt at `agents/upgrade-draft-prompt.md`. The draft agent receives the batch of existing items and designs effects for each one.

For each item, the agent must:

1. **Infer gameplay niche** from name + flavor text + reach + tier. Example: "Thornwood Staff" (T2, iron/stone, flavorText mentions living wood) → living weapon, nature-reactive niche
2. **Convert `reachBonus` to PassiveEffect entries** — exact same values, proper effect type
3. **Add at least one non-passive effect** that reinforces the inferred niche:
   - T1: 1 effect total (the passive counts, but add a conditional or trait_grant if the passive alone is boring)
   - T2: 1-2 effects (passive + one interesting primitive)
   - T3: 2-3 effects (passive + composition of primitives)
   - T4: 3-4 effects (passive + rich composition with interaction between effects)
4. **Update `mechanicalSummary`** to accurately describe the new effects
5. **Leave name, flavorText, tags, tier, lossCondition unchanged**

**Output format:** Same as standard attachment pipeline draft — TypeScript objects with summary table.

**Pass 2: Editorial (Opus)** — Standard attachment pipeline editorial agent. Since names/flavor are preserved, this should mostly PASS. The editorial agent still checks that `mechanicalSummary` matches the new `effects[]` and that tag variety is maintained across the batch.

**Pass 3: Systems Audit (Sonnet)** — Standard attachment pipeline systems agent. Validates effect types, balance math, tier appropriateness, duplicate IDs, predicate validity.

**Pass 4: Implementation (Sonnet)** — Modified behavior: instead of appending new items, **replaces existing items in-place** by matching on `id`.

Implementation agent behavior:
1. For each item in the final file, find the matching `id` in the target catalog file
2. Replace the entire object (preserving its position in the array)
3. Do NOT add section comments for upgrades (the item stays where it was)
4. Run `npx tsc --noEmit`, `npm test`, `npx vite build`
5. Commit with message: `content: upgrade N items with effects (<batch-name>)`

### Output Files

```
Docs/plans/attachments/<slug>-draft.md
Docs/plans/attachments/<slug>-editorial.md
Docs/plans/attachments/<slug>-revised.md
Docs/plans/attachments/<slug>-systems.md
Docs/plans/attachments/<slug>-final.md
```

Slug derived from batch spec: `"arms with iron reach"` → `upgrade-arms-iron`

---

## Mode 3: Fill

### Purpose

Create net-new items for gaps that remain after upgrading existing content.

### Execution

Delegates directly to the existing `/attachment-pipeline` skill. No modifications needed — the standard pipeline already produces properly-effected items.

The assess mode's gap report provides batch specs specific enough to produce good results:

```
# Bad (too vague):
/attachment-pipeline mixed "fill gaps"

# Good (from assess report):
/attachment-pipeline vestments "T2-T3 vestments with Shadow/Veil reach, entropy sphere, emphasizing ConditionalEffect and DecayEffect primitives"
```

### Obsidian Vault Context

Same vault page selection as upgrade mode. The orchestrator reads relevant pages based on the batch spec's reach/sphere/faction tags and injects them as inspiration context for the draft agent.

### Pre-Read Addition

The fill mode adds one extra pre-read: the current catalog file, so the draft agent can see what already exists and avoid duplicating names, niches, or effect compositions.

---

## Orchestrator Protocol (SKILL.md)

### Mode Routing

```
/content-catalog assess              → dispatch assess agent
/content-catalog upgrade "<spec>"    → dispatch upgrade pipeline (4 passes)
/content-catalog fill "<spec>"       → delegate to /attachment-pipeline
```

### Assess Dispatch

1. Pre-read all catalog files + encounter templates + effects types
2. Read Obsidian `Index.md` for world scope
3. Dispatch assess agent with all data
4. Write report to `Docs/plans/attachments/catalog-assessment-YYYY-MM-DD.md`

### Upgrade Dispatch

1. Pre-read: effects types, attachments types, balance constants, STYLE.md
2. Identify items matching the batch spec from the relevant catalog file
3. Select Obsidian vault pages matching batch tags
4. Dispatch upgrade draft agent (Opus) with items + vault context
5. On draft complete → dispatch editorial agent (Opus)
6. Editorial verdict routing:
   - PASS / PASS WITH REVISIONS → dispatch systems agent
   - REVISE BEFORE CONTINUING → auto-retry draft once with editorial feedback → second REVISE → STOP
7. Systems verdict routing:
   - READY / READY WITH CAVEATS → dispatch implementation agent
   - BLOCKED → STOP
8. Implementation: in-place replacement, verify, commit, push

### Fill Dispatch

1. Pre-read: same as upgrade, plus current catalog for dedup
2. Select Obsidian vault pages matching batch tags
3. Delegate to `/attachment-pipeline <category> "<spec>"` with vault context injected

### Verdict Routing (shared with attachment pipeline)

```
Draft → Editorial
  ├─ PASS / PASS WITH REVISIONS → Systems
  └─ REVISE → retry once → still REVISE → STOP

Systems
  ├─ READY / READY WITH CAVEATS → Implementation
  └─ BLOCKED → STOP

Implementation
  ├─ tsc ✓ + tests ✓ + build ✓ → commit + push
  └─ verification failure → fix and retry
```

---

## Intended Workflow

```
Session 1: Assess
  /content-catalog assess
  → Read report, review work plan
  → Approve batch prioritization

Session 2-N: Upgrade
  /content-catalog upgrade "arms with iron/force reach"
  /content-catalog upgrade "wound and disease conditions"
  /content-catalog upgrade "vestments and cloaks"
  ... (evaluate each batch's output)

Re-Assess:
  /content-catalog assess
  → See remaining gaps after upgrades

Session N+1: Fill
  /content-catalog fill "T2-T3 Shadow vestments, entropy sphere"
  /content-catalog fill "T1-T2 beast mounts with reactive effects"
  ... (evaluate each batch's output)

Final Check:
  /content-catalog assess
  → Confirm coverage targets met
```

---

## Catalog Files Affected

| File | Assess reads | Upgrade writes | Fill writes |
|------|-------------|---------------|-------------|
| `src/data/reward-attachment-catalog.ts` | Yes | Yes (in-place) | Yes (append) |
| `src/data/starter-attachments.ts` | Yes | Yes (in-place) | No |
| `src/data/agreement-reward-catalog.ts` | Yes | No (already 100% alive) | Possible |
| `src/data/anomaly-reward-catalog.ts` | Yes | Yes (in-place) | No |
| `src/data/artifact-templates.ts` | Yes | No (already 100% alive) | No |
| `src/data/spell-templates.ts` | Yes | No (already 100% alive) | No |

---

## Balance Constants (inherited from attachment pipeline)

| Constant | Value | Source |
|----------|-------|--------|
| `EFFECT_MODIFIER_CAP_PER_ITEM` | 0.15 | `effect-constants.ts` |
| `EFFECT_MODIFIER_CAP_GLOBAL` | 0.30 | `effect-constants.ts` |
| `MAX_ATTACHMENT_TIER` | 4 | `effect-constants.ts` |
| `MAX_EFFECTS_PER_ATTACHMENT` | 6 | `effect-constants.ts` |

### Tier Power Guidelines

| Tier | Effect count | Total value range | Complexity |
|------|-------------|-------------------|------------|
| T1 (Mundane) | 1 | 0.03-0.05 | Single effect, often passive + conditional |
| T2 (Storied) | 1-2 | 0.05-0.08 | Passive + one interesting primitive |
| T3 (Mythic) | 2-3 | 0.08-0.12 | Composed primitives with interaction |
| T4 (Legendary) | 3-4 | 0.10-0.15 | Rich composition, effects reinforce each other |

---

## Quality Gates Summary

| Gate | Enforced by | Blocks on |
|------|------------|-----------|
| Non-passive effects required | Draft prompt | Every item must use at least one non-passive primitive |
| Threadbare naming/tone | Editorial (Opus) | Generic names, exclamatory prose, MMO descriptions |
| Reach variety in batch | Editorial (Opus) | All items on same reach |
| mechanicalSummary accuracy | Editorial (Opus) | Summary doesn't match effects[] |
| Effect type validity | Systems (Sonnet) | Unknown discriminant or invalid field |
| Balance math | Systems (Sonnet) | Per-item or global cap exceeded |
| Tier appropriateness | Systems (Sonnet) | Over/under-designed for tier |
| No duplicate IDs | Systems (Sonnet) | ID collision with existing catalog |
| TypeScript compilation | Implementation (Sonnet) | `tsc --noEmit` fails |
| Test suite | Implementation (Sonnet) | `npm test` fails |
| Production build | Implementation (Sonnet) | `vite build` fails |
