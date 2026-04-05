---
name: attachment-pipeline
description: Automated 4-pass attachment authoring pipeline. Composes mechanically interesting attachments using the Generic Effect System primitives, then runs editorial + systems audit + implementation. Run with `/attachment-pipeline <category> <premise>`. Triggers on "attachment pipeline", "author attachments", "create attachments", "new items", "new possessions", "new conditions", "new bestowed powers".
model: opus
---

# Attachment Pipeline

Automated 4-pass workflow for composing mechanically interesting attachments using the Generic Effect System primitives. Every attachment must use composable `effects[]` arrays — flat `reachBonus` / `domainContributions` modifiers are the old pattern we're moving away from.

```
Premise → Draft (Opus) → Editorial+Revised (Opus) → Systems+Final (Sonnet) → Implementation (Sonnet)
```

## Invocation

The user provides:
- **category** — One of: `arms`, `vestments`, `tomes_scrolls`, `tools_instruments`, `relics_talismans`, `mounts_beasts`, `provisions`, `conditions`, `bestowed_powers`, `agreements`, `mixed`
- **premise** — creative brief for the batch
- **optional constraints** — sphere affinity, reach focus, tier range, count

```
/attachment-pipeline arms "weapons forged in volcanic ruins, Iron + Force sphere"
/attachment-pipeline conditions "curses from broken agreements with the entropy sphere"
/attachment-pipeline mixed "a treasure hoard from a fallen dragon's lair, tiers 2-4"
```

**Modes:**
- Default → full pipeline (all 4 passes), attachments deployed to code
- `draft` → Pass 1 only
- `design` → Passes 1-3 only (no implementation)

## Slug Generation

Derive a kebab-case slug from the premise:
- "volcanic weapons" → `volcanic-weapons`
- "entropy curses" → `entropy-curses`

All output files go to `Docs/plans/attachments/<slug>-<pass>.md`.

---

## Orchestration Protocol

### Step 0: Pre-Read Reference Material

Before dispatching any agent, the orchestrator reads these files ONCE and injects them as context:

1. `Docs/plans/2026-04-05-attachment-primitives-proposal.md` — primitives vocabulary
2. `src/types/effects.ts` — all 29 `AttachmentEffect` type definitions (lines 540-587 for the union)
3. `src/types/attachments.ts` — `PossessionNodeProperties`, `OnUseTrigger`, loss conditions
4. `src/data/effect-constants.ts` — tunable caps and balance constants
5. `STYLE.md` — Threadbare aesthetic
6. A sample from `src/data/reward-attachment-catalog.ts` (first 100 lines for format reference)

If any file is unavailable, note it and proceed.

### Step 1: Dispatch Pass 1 (Draft)

Dispatch sub-agent with `agents/draft-prompt.md`, model `opus`.
Inject: category, premise, constraints, pre-read reference material.
Agent writes: `<slug>-draft.md`

### Step 2: Dispatch Pass 2 (Editorial + Revision)

Dispatch sub-agent with `agents/editorial-prompt.md`, model `opus`.
Agent writes: `<slug>-editorial.md` AND `<slug>-revised.md`

**Check verdict:**
- `PASS` or `PASS WITH REVISIONS` → proceed to Step 3.
- `REVISE BEFORE CONTINUING` → auto-retry once with feedback. Second REVISE → stop pipeline.

### Step 3: Dispatch Pass 3 (Systems + Final Merge)

Dispatch sub-agent with `agents/systems-prompt.md`, model `sonnet`.
Agent writes: `<slug>-systems.md` AND `<slug>-final.md`

**Check verdict:**
- `READY FOR IMPLEMENTATION` or `READY WITH CAVEATS` → proceed to Step 4.
- `BLOCKED` → stop pipeline, tell user.

### Step 4: Dispatch Pass 4 (Implementation)

Dispatch sub-agent with `agents/implementation-prompt.md`, model `sonnet`.
Agent modifies: `src/data/reward-attachment-catalog.ts` (or `starter-attachments.ts`)
Agent runs: `npx tsc --noEmit`, `npm test`, `npx vite build`

**On completion:** commit and push. Report to user.

### Step 5: Done

Report: items authored, primitive usage breakdown, reach/tier coverage, any cuts.

---

## Batch Sizing

| Category | Batch Size | Tier Distribution |
|----------|-----------|-------------------|
| Single subcategory | 6-8 items | 3 T1, 2 T2, 1-2 T3, 0-1 T4 |
| Mixed | 8-12 items | 4 T1, 3 T2, 2 T3, 1 T4 |
| Conditions/Powers | 6-10 items | 3 T1, 2-3 T2, 1-2 T3, 0-1 T4 |

## Balance Constants

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
| 1: Draft | **Opus** | Creative composition and naming quality |
| 2: Editorial + Revision | **Opus** | Must catch naming/tone weakness and rewrite |
| 3: Systems + Final Merge | **Sonnet** | Type correctness and balance math |
| 4: Implementation | **Sonnet** | Code translation of already-authored data |

## File Dependencies

```
Reference material (pre-read by orchestrator)
    |
    v
Pass 1 (Draft, Opus) --> <slug>-draft.md
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
Pass 4 (Implementation, Sonnet) --> src/data/reward-attachment-catalog.ts (modified)
    |
    v
Commit + Push -> Vercel auto-deploys
```
