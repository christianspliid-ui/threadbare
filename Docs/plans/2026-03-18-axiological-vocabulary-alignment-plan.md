# Axiological Vocabulary Alignment — Implementation Plan

**Date:** 2026-03-18
**Status:** Ready for Claude Code
**Type:** Content migration + type refactoring (no new features)
**Canonical source:** Obsidian → `TheFantasyWorldSimulator/Domains/Axiological Pairs.md`
**Estimated scope:** ~92 files, ~982 string occurrences + sign flips on some axes

## Problem

The `ValuePair` type and `AxiologicalProfile` type use an older vocabulary that predates the canonical axiological pairs design. Two pairs in the code don't exist in the canonical system. Two canonical pairs aren't in the code at all. Several pairs have different names for the same concept, and two have reversed polarity (left/right poles swapped).

This causes the encounter motivation scoring (`scoreByGoalAlignment`) to match against wrong or misaligned pair names, producing meaningless or incorrect personality-driven behavior.

## The Migration

### Step 1: Update the `ValuePair` Type

In `src/types/agent.ts`, replace the current union:

```typescript
// OLD
export type ValuePair =
  | 'ambition_contentment'
  | 'courage_prudence'
  | 'cruelty_compassion'
  | 'cunning_honesty'
  | 'devotion_independence'
  | 'loyalty_treachery'
  | 'tradition_innovation'
  | 'dominance_humility'
  | 'wrath_patience'
  | 'greed_generosity';
```

With the canonical set:

```typescript
// NEW — canonical axiological pairs from Obsidian vault
export type ValuePair =
  | 'mercy_ruthlessness'       // Iron — Mercy (-1) vs Ruthlessness (+1)
  | 'asceticism_extravagance'  // Gold — Asceticism (-1) vs Extravagance (+1)
  | 'honesty_cunning'          // Shadow — Honesty (-1) vs Cunning (+1)
  | 'tradition_novelty'        // Veil — Tradition (-1) vs Novelty (+1)
  | 'loyalty_ambition'         // Heart — Loyalty (-1) vs Ambition (+1)
  | 'frankness_propriety'      // Eye — Frankness (-1) vs Propriety (+1)
  | 'humility_pride'           // Stone — Humility (-1) vs Pride (+1)
  | 'sacrifice_survival'       // Star — Sacrifice (-1) vs Survival (+1)
  | 'stoicism_passion'         // Flesh — Stoicism (-1) vs Passion (+1)
  | 'courage_prudence';        // Meta — Courage (-1) vs Prudence (+1)
```

### Step 2: Create a Reach-to-ValuePair Mapping

Add a canonical mapping constant (new file or in agent types):

```typescript
// Maps each reach domain to its bound axiological pair
export const REACH_VALUE_PAIR: Record<ReachDomain, ValuePair> = {
  iron:   'mercy_ruthlessness',
  gold:   'asceticism_extravagance',
  shadow: 'honesty_cunning',
  veil:   'tradition_novelty',
  heart:  'loyalty_ambition',
  eye:    'frankness_propriety',
  stone:  'humility_pride',
  star:   'sacrifice_survival',
  flesh:  'stoicism_passion',
};

// The meta pair (not reach-bound)
export const META_VALUE_PAIR: ValuePair = 'courage_prudence';
```

### Step 3: String Rename — Full Mapping Table

Apply these renames across all 92 files. Use find-and-replace with whole-word matching.

| Old string | New string | Notes |
|-----------|-----------|-------|
| `'courage_prudence'` | `'courage_prudence'` | **No change** |
| `'cunning_honesty'` | `'honesty_cunning'` | Swap order. **Sign flip needed on profile values** (see Step 4) |
| `'tradition_innovation'` | `'tradition_novelty'` | Rename only. Same polarity (-1 = tradition, +1 = novelty). No sign flip. |
| `'greed_generosity'` | `'asceticism_extravagance'` | Full replace. **Sign flip needed** — old: greed = -1, generosity = +1. New: asceticism = -1, extravagance = +1. The concepts don't map 1:1 but the polarity convention roughly matches (hoarding ≈ asceticism at -1, spending ≈ extravagance at +1). **Review profile values for semantic accuracy.** |
| `'wrath_patience'` | `'mercy_ruthlessness'` | Full replace. **Sign flip needed** — old: wrath = -1, patience = +1. New: mercy = -1, ruthlessness = +1. These are inverted concepts: wrath(-1) maps to ruthlessness(+1). **All existing values on this axis must be negated.** |
| `'cruelty_compassion'` | `'mercy_ruthlessness'` | Merge into Iron pair. **Sign flip needed** — old: cruelty = -1, compassion = +1. New: mercy = -1, ruthlessness = +1. Cruelty(-1) maps to ruthlessness(+1). **All existing values must be negated.** |
| `'dominance_humility'` | `'humility_pride'` | Full replace. **Sign flip needed** — old: dominance = -1, humility = +1. New: humility = -1, pride = +1. Dominance(-1) maps to pride(+1). **All existing values must be negated.** |
| `'loyalty_treachery'` | `'loyalty_ambition'` | Rename right pole. Same left pole (loyalty = -1). No sign flip — loyalty stays at -1. Treachery was +1, now ambition is +1. Semantically different but direction preserved. |
| `'devotion_independence'` | `'sacrifice_survival'` | Full replace. **Sign flip review** — old: devotion = -1, independence = +1. New: sacrifice = -1, survival = +1. Devotion(-1) ≈ sacrifice(-1), independence(+1) ≈ survival(+1). **Same polarity — no sign flip needed.** |
| `'ambition_contentment'` | `'loyalty_ambition'` | Merge into Heart pair. **Sign flip needed** — old: ambition = -1, contentment = +1. New: loyalty = -1, ambition = +1. Ambition flips from -1 to +1. **All existing values must be negated.** |
| *(add new)* | `'frankness_propriety'` | **New pair — Eye.** Add to all AxiologicalProfile initializations with default 0.0. |
| *(add new)* | `'stoicism_passion'` | **New pair — Flesh.** Add to all AxiologicalProfile initializations with default 0.0. |

### Step 4: Sign Flips on Profile Values

The following axes have **reversed polarity** between old and new naming. All hardcoded profile values, cultural defaults, and test fixtures on these axes must have their sign negated:

| Axis | Why sign flips |
|------|---------------|
| `cunning_honesty` → `honesty_cunning` | Left pole was cunning, now honesty. +0.5 (honest) becomes -0.5 (honest in new convention). Wait — let me be precise. |

**Polarity analysis (be very careful here):**

The naming convention is `leftPole_rightPole` where leftPole = -1.0, rightPole = +1.0.

| Old pair | Old -1.0 | Old +1.0 | New pair | New -1.0 | New +1.0 | Sign flip? |
|----------|----------|----------|----------|----------|----------|-----------|
| `cunning_honesty` | Cunning | Honesty | `honesty_cunning` | Honesty | Cunning | **YES** — Cunning was -1, now +1 |
| `wrath_patience` | Wrath | Patience | `mercy_ruthlessness` | Mercy | Ruthlessness | **YES** — Wrath(-1)≈Ruthlessness(+1) |
| `cruelty_compassion` | Cruelty | Compassion | `mercy_ruthlessness` | Mercy | Ruthlessness | **YES** — Cruelty(-1)≈Ruthlessness(+1) |
| `dominance_humility` | Dominance | Humility | `humility_pride` | Humility | Pride | **YES** — Dominance(-1)≈Pride(+1) |
| `ambition_contentment` | Ambition | Contentment | `loyalty_ambition` | Loyalty | Ambition | **YES** — Ambition(-1) is now Ambition(+1) |
| `tradition_innovation` | Tradition | Innovation | `tradition_novelty` | Tradition | Novelty | **NO** — same direction |
| `greed_generosity` | Greed | Generosity | `asceticism_extravagance` | Asceticism | Extravagance | **REVIEW** — Greed(-1)≈Asceticism(-1)? Not really. Greed and Asceticism are different. Greed is wanting more, Asceticism is wanting less. These are **opposite** concepts. So **YES** — sign flip. |
| `loyalty_treachery` | Loyalty | Treachery | `loyalty_ambition` | Loyalty | Ambition | **NO** — Loyalty stays at -1 |
| `devotion_independence` | Devotion | Independence | `sacrifice_survival` | Sacrifice | Survival | **NO** — Devotion(-1)≈Sacrifice(-1) |
| `courage_prudence` | Courage | Prudence | `courage_prudence` | Courage | Prudence | **NO** — unchanged |

**Summary: 5 axes need sign flips, 5 do not.**

Sign flip axes: `cunning_honesty`, `wrath_patience`, `cruelty_compassion`, `dominance_humility`, `ambition_contentment`, `greed_generosity` (6 total, but `cruelty_compassion` and `wrath_patience` merge into the same target, and `ambition_contentment` and `loyalty_treachery` share a target, so it's 6 old-axis flips mapped to 4 new axes).

### Step 5: Update `ENCOUNTER_TYPE_MOTIVATIONS`

In `src/types/encounter.ts`:

```typescript
// OLD
export const ENCOUNTER_TYPE_MOTIVATIONS: Record<EncounterType, ValuePair[]> = {
  explore:  ['courage_prudence', 'ambition_contentment'],
  acquire:  ['greed_generosity', 'ambition_contentment'],
  create:   ['tradition_innovation', 'devotion_independence'],
  hire:     ['dominance_humility', 'loyalty_treachery'],
  duel:     ['wrath_patience', 'courage_prudence'],
  steal:    ['cunning_honesty', 'greed_generosity'],
  trade:    ['greed_generosity', 'cunning_honesty'],
  assist:   ['cruelty_compassion', 'loyalty_treachery'],
  build:    ['tradition_innovation', 'devotion_independence'],
  lead:     ['dominance_humility', 'ambition_contentment'],
};

// NEW — canonical pairs
export const ENCOUNTER_TYPE_MOTIVATIONS: Record<EncounterType, ValuePair[]> = {
  explore:  ['courage_prudence', 'loyalty_ambition'],
  acquire:  ['asceticism_extravagance', 'loyalty_ambition'],
  create:   ['tradition_novelty', 'sacrifice_survival'],
  hire:     ['humility_pride', 'loyalty_ambition'],
  duel:     ['mercy_ruthlessness', 'courage_prudence'],
  steal:    ['honesty_cunning', 'asceticism_extravagance'],
  trade:    ['asceticism_extravagance', 'honesty_cunning'],
  assist:   ['mercy_ruthlessness', 'loyalty_ambition'],
  build:    ['tradition_novelty', 'sacrifice_survival'],
  lead:     ['humility_pride', 'loyalty_ambition'],
};
```

### Step 6: Update Per-Encounter Motivations

Each encounter template in `src/data/encounter-content.ts` has a `motivations` array. Apply the same mapping table to each.

### Step 7: Update Backstory Content

`src/data/backstory-content.ts` has prose tables keyed by value pair names (FEAR_PROSE, HIDDEN_MOTIVE_PROSE, etc.). These need:
1. Keys renamed to canonical pair names
2. New entries added for `frankness_propriety` and `stoicism_passion`
3. Merged entries for pairs that collapsed (e.g., `cruelty_compassion` and `wrath_patience` both become `mercy_ruthlessness` — combine the best prose from both)

### Step 8: Update Strand Content, Narrative Content, Domain Words

Same pattern: rename keys, add new pairs, merge collapsed pairs. Files:
- `src/data/strand-content.ts`
- `src/data/narrative-content.ts`
- `src/data/domain-words.ts`
- `src/data/agenda-content.ts`
- `src/data/action-template-content.ts`

### Step 9: Update All Profile Initializations

Search for all places where `axiologicalProfile` objects are constructed (world seeding, guild seeding, test fixtures, etc.) and:
1. Rename keys to canonical names
2. Apply sign flips for the 6 reversed axes
3. Add `frankness_propriety: 0` and `stoicism_passion: 0` to every profile

**Key files:**
- `src/engine/worldSeed.ts` — agent creation profiles
- `src/engine/guildSeeding.ts` — guild axiological bias
- `src/engine/ascendant.ts` — ascendant profile creation
- `src/engine/agentLifecycle.ts` — if profiles are created here
- All test files with axiological profile fixtures (50+ files)

### Step 10: Update All Profile Reads

Search for all places where profile values are read by old key names and update:
- `src/engine/agentSelection.ts` — `scoreByGoalAlignment`
- `src/engine/disposition.ts` — axiological nudges on cooperation strategy
- `src/engine/encounterCandidates.ts` — courage value read
- `src/engine/sublocation.ts` — sublocation scoring by motivation
- `src/engine/interventionEffects.ts` — divine influence overlay
- `src/engine/strands.ts` — strand extraction
- `src/engine/backstoryResolvers.ts` — backstory generation

### Step 11: Add New Pairs to Content Tables

For `frankness_propriety` (Eye) and `stoicism_passion` (Flesh), add:
- Backstory prose templates (FEAR_PROSE, etc.) — 4 entries per new pair
- Strand content entries
- Narrative content entries
- Domain word scale entries
- Cultural default profiles that include these axes

### Step 12: Run Tests, Fix Failures

After all renames and sign flips:
```bash
npm test
```

Expect many test failures from hardcoded old pair names in test fixtures. Fix each by applying the same mapping + sign flips. This is the bulk of the work.

### Step 13: Verify Behavioral Correctness

After tests pass, verify that:
1. Agent profiles are initialized with all 10 canonical pairs
2. `scoreByGoalAlignment` produces sensible scores (positive for aligned, negative for opposed)
3. Encounter motivations map to the correct reach domains
4. Guild axiological biases still produce Gold-leaning behavior
5. Backstory prose uses the new pair names correctly

## Execution Strategy

This is a **mechanical refactoring** with a large blast radius. Recommended approach:

1. Start with `src/types/agent.ts` — change the type. TypeScript will immediately flag every file that uses a removed pair name.
2. Work through compiler errors file by file, applying the mapping table.
3. For sign flips: search for hardcoded numeric values on the 6 flipped axes and negate them.
4. Add the two new pairs (`frankness_propriety`, `stoicism_passion`) last — these are additive and won't break existing code.
5. Run tests frequently — every 5-10 files, run `npm test` to catch issues early.

## Risk: Semantic Drift

Some mappings are not perfect 1:1 semantic matches. `greed_generosity` → `asceticism_extravagance` changes the meaning of the Gold axis. An agent who was "generous" (+1.0 on `greed_generosity`) becomes "extravagant" (+1.0 on `asceticism_extravagance`). These are related but different concepts. The canonical design chose Asceticism vs. Extravagance because it better captures the merchant's tension (how much is enough?) than Greed vs. Generosity (do I take or give?).

For the migration, accept this semantic shift. The canonical pairs were designed with more thought and better narrative grounding. The old pairs were placeholder labels from early development.

## Files Changed (estimated)

- **Type definitions:** 3 files (agent.ts, encounter.ts, possibly new mapping file)
- **Content/data files:** ~10 files (encounter-content, backstory-content, strand-content, narrative-content, domain-words, agenda-content, action-template-content, unified-action-templates, game-theory-content, economic-trait-content)
- **Engine files:** ~15 files (worldSeed, guildSeeding, agentSelection, disposition, encounterCandidates, sublocation, interventionEffects, strands, backstoryResolvers, agentDetail, ascendant, movementCandidates, phaseMovement, dream, narrative)
- **Test files:** ~60 files (most files with axiological profile fixtures)
- **Component files:** ~5 files (UI components reading profile data)

Total: ~92 files, but the changes in each are mechanical find-and-replace + sign flips.
