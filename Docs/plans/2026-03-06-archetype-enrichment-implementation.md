# Archetype Content Enrichment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enrich the existing 19 narrative archetypes in `src/data/archetype-content.ts` with tone keywords, beat patterns, vignette seeds, and narrative requirements.

**Architecture:** Expand the `NarrativeArchetype` interface with 4 new fields and populate all 19 entries. Define supporting interfaces (`ToneKeywords`, `BeatPattern`, `NarrativeRequirement`) locally in the content package. Add 3 new lookup functions. All work in a single file + its test file.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Add New Interfaces and Expand NarrativeArchetype

**Files:**
- Modify: `src/data/archetype-content.ts:1-18` (interface section)

**Step 1: Write the failing test**

Add to `src/data/__tests__/archetype-content.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  NARRATIVE_ARCHETYPES,
  getArchetype,
  getArchetypeTone,
  getArchetypeBeatPatterns,
  getArchetypeVignette,
} from '../archetype-content';
import type { NarrativeArchetype, ToneKeywords, BeatPattern, NarrativeRequirement } from '../archetype-content';

// Keep all existing tests, then add:

describe('enriched archetype data', () => {
  it('every archetype has toneKeywords with >=5 adjectives and >=5 verbs', () => {
    for (const arch of NARRATIVE_ARCHETYPES) {
      expect(arch.toneKeywords.adjectives.length).toBeGreaterThanOrEqual(5);
      expect(arch.toneKeywords.verbs.length).toBeGreaterThanOrEqual(5);
      expect(arch.toneKeywords.sentenceRhythm.length).toBeGreaterThan(10);
    }
  });

  it('every archetype has >=2 beat patterns', () => {
    for (const arch of NARRATIVE_ARCHETYPES) {
      expect(arch.beatPatterns.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every archetype has >=3 vignette seeds', () => {
    for (const arch of NARRATIVE_ARCHETYPES) {
      expect(arch.vignetteSeeds.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every archetype has >=2 narrative requirements', () => {
    for (const arch of NARRATIVE_ARCHETYPES) {
      expect(arch.narrativeRequirements.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('vignette seeds contain {name} placeholder', () => {
    for (const arch of NARRATIVE_ARCHETYPES) {
      const hasName = arch.vignetteSeeds.some(s => s.includes('{name}'));
      expect(hasName).toBe(true);
    }
  });

  it('beat patterns reference valid NarrativeEventType values', () => {
    const validTypes = [
      'action_resolved', 'action_failed', 'action_critical',
      'trait_acquired', 'trait_lost', 'tier_transition',
      'doom_escalation', 'mandate_stage', 'divine_intervention',
      'actor_death', 'contested_action',
    ];
    for (const arch of NARRATIVE_ARCHETYPES) {
      for (const bp of arch.beatPatterns) {
        for (const et of bp.eventTypes) {
          expect(validTypes).toContain(et);
        }
      }
    }
  });

  it('beat patterns have valid tier values', () => {
    const validTiers = ['routine', 'notable', 'chronicle'];
    for (const arch of NARRATIVE_ARCHETYPES) {
      for (const bp of arch.beatPatterns) {
        expect(validTiers).toContain(bp.minimumTier);
        if (bp.promoteTo) {
          expect(validTiers).toContain(bp.promoteTo);
        }
      }
    }
  });

  it('narrative requirements have valid categories', () => {
    const validCats = ['artifact', 'location', 'character', 'faction'];
    for (const arch of NARRATIVE_ARCHETYPES) {
      for (const nr of arch.narrativeRequirements) {
        expect(validCats).toContain(nr.category);
        expect(nr.tags.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('lookup functions', () => {
  it('getArchetypeTone returns tone keywords for valid id', () => {
    const tone = getArchetypeTone('tragic_hero');
    expect(tone).toBeDefined();
    expect(tone!.adjectives.length).toBeGreaterThanOrEqual(5);
  });

  it('getArchetypeTone returns undefined for unknown id', () => {
    expect(getArchetypeTone('nonexistent')).toBeUndefined();
  });

  it('getArchetypeBeatPatterns returns patterns for valid id', () => {
    const patterns = getArchetypeBeatPatterns('schemer');
    expect(patterns.length).toBeGreaterThanOrEqual(2);
  });

  it('getArchetypeBeatPatterns returns empty array for unknown id', () => {
    expect(getArchetypeBeatPatterns('nonexistent')).toEqual([]);
  });

  it('getArchetypeVignette returns a string for valid id', () => {
    const vignette = getArchetypeVignette('wanderer', 42);
    expect(typeof vignette).toBe('string');
    expect(vignette!.length).toBeGreaterThan(10);
  });

  it('getArchetypeVignette is deterministic (same seed = same result)', () => {
    const v1 = getArchetypeVignette('folk_hero', 999);
    const v2 = getArchetypeVignette('folk_hero', 999);
    expect(v1).toBe(v2);
  });

  it('getArchetypeVignette returns undefined for unknown id', () => {
    expect(getArchetypeVignette('nonexistent', 1)).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/archetype-content.test.ts`
Expected: FAIL — imports don't exist yet, archetype objects lack new fields.

**Step 3: Add new interfaces and expand NarrativeArchetype**

In `src/data/archetype-content.ts`, replace the interface section (lines 1-18) with:

```typescript
/**
 * Archetype Content Package — 19 narrative archetypes from the content strategy.
 *
 * Each agent is assigned one archetype during world generation. The archetype
 * influences prose tone, story shape, beat patterns, and highlights certain Reach affinities.
 *
 * Source: Docs/plans/2026-03-06-content-strategy.md
 * Enrichment: Docs/plans/2026-03-06-archetype-enrichment-design.md
 */

import type { ReachDomain } from '../types/traits';
import type { NarrativeEventType, NarrativeTier } from '../types/narrative';

// ─── Supporting Types ──────────────────────────────────────────

export interface ToneKeywords {
  adjectives: string[];     // 5-8 adjective palette for this archetype
  verbs: string[];          // 5-8 preferred verbs
  sentenceRhythm: string;   // prose guidance, e.g. "Short punchy clauses."
}

export interface NarrativeRequirement {
  category: 'artifact' | 'location' | 'character' | 'faction';
  tags: string[];
  required: boolean;        // true = spawn if absent
  culturallyShape: boolean; // true = use local culture vocabulary
}

export interface BeatPattern {
  eventTypes: NarrativeEventType[];
  minimumTier: NarrativeTier;
  promoteTo?: NarrativeTier;
  narrativeRequirements: NarrativeRequirement[];
  contextPreferences: string[];
}

// ─── Main Interface ────────────────────────────────────────────

export interface NarrativeArchetype {
  id: string;
  name: string;
  storyShape: string;
  proseTone: string;
  reachAffinities: ReachDomain[];
  toneKeywords: ToneKeywords;
  beatPatterns: BeatPattern[];
  vignetteSeeds: string[];
  narrativeRequirements: NarrativeRequirement[];
}
```

Do NOT yet populate the data — that's Tasks 2-5. Just add the interface. This step will cause TypeScript errors because the existing data objects lack the new fields. That's expected.

**Step 4: Verify the test still fails (now for missing data, not missing types)**

Run: `npx vitest run src/data/__tests__/archetype-content.test.ts`
Expected: FAIL — existing archetype entries lack `toneKeywords`, `beatPatterns`, etc.

---

### Task 2: Populate Archetypes 1-5 (Tragic Hero through Fallen Noble)

**Files:**
- Modify: `src/data/archetype-content.ts` — archetypes array entries 1-5

**Step 1: Replace the first 5 archetype entries with enriched versions**

Replace the `tragic_hero` through `fallen_noble` entries in the `NARRATIVE_ARCHETYPES` array. Each entry needs all new fields populated per the content strategy:

**Tragic Hero:**
- toneKeywords: adjectives `['grand', 'doomed', 'magnificent', 'fatal', 'towering']`, verbs `['rose', 'defied', 'shattered', 'overreached', 'blazed']`, rhythm `"Long opening clause, short devastating conclusion. Let grandeur build before the fall."`
- beatPatterns: death → promote to chronicle; action_critical → promote to notable; trait_lost → promote to notable
- vignetteSeeds: 3-5 fragments with `{name}` placeholder, chronicler voice
- narrativeRequirements: legendary weapons, cursed artifacts, monuments to past glory

**Trickster:**
- toneKeywords: adjectives `['sly', 'quicksilver', 'impudent', 'sardonic', 'mercurial']`, verbs `['slipped', 'twisted', 'upended', 'deceived', 'improvised']`, rhythm `"Quick, clipped sentences. Wry asides. The punchline lands dry."`
- beatPatterns: contested_action success → promote to notable; action_critical → promote to notable
- vignetteSeeds: 3-5 trickster-flavored chronicler fragments
- narrativeRequirements: disguises, hidden passages, compromising secrets, unlikely tools

**Coming of Age:**
- toneKeywords: adjectives `['wide-eyed', 'trembling', 'untested', 'bright', 'determined']`, verbs `['stumbled', 'reached', 'awakened', 'hardened', 'stepped']`, rhythm `"Start soft and wondering. Let sentences grow blunter as innocence fades."`
- beatPatterns: trait_acquired → promote to notable; tier_transition → promote to notable
- vignetteSeeds: 3-5 coming-of-age chronicler fragments
- narrativeRequirements: mentors, first weapons, rites of passage, threshold locations

**Brooding Warrior:**
- toneKeywords: adjectives `['heavy', 'scarred', 'weary', 'silent', 'relentless']`, verbs `['endured', 'bore', 'struck', 'shouldered', 'ground']`, rhythm `"Short. Blunt. Physical. The body carries what the words won't say."`
- beatPatterns: actor_death → promote to chronicle; action_critical → stays notable; contested_action → stays notable
- vignetteSeeds: 3-5 warrior-flavored chronicler fragments
- narrativeRequirements: battlefields, scarred weapons, graves of fallen comrades

**Fallen Noble:**
- toneKeywords: adjectives `['faded', 'bitter', 'proud', 'threadbare', 'sharp-eyed']`, verbs `['remembered', 'endured', 'condescended', 'clung', 'surveyed']`, rhythm `"Sentences that start with dignity and end with loss. A faint echo of past grandeur in every clause."`
- beatPatterns: trait_lost → promote to notable; contested_action → stays notable; tier_transition → promote to notable
- vignetteSeeds: 3-5 fallen-noble chronicler fragments
- narrativeRequirements: faded insignia, ruined estates, loyal retainers, lost heirlooms

**Step 2: Run tests for just the new data shape tests**

Run: `npx vitest run src/data/__tests__/archetype-content.test.ts`
Expected: FAIL — archetypes 6-19 still lack new fields. But the first 5 should pass structural checks if run individually.

Note: At this stage, `tsc` will also fail because entries 6-19 are incomplete. This is expected — we're building incrementally.

---

### Task 3: Populate Archetypes 6-10 (True Believer through Folk Hero)

**Files:**
- Modify: `src/data/archetype-content.ts` — archetypes array entries 6-10

**Step 1: Replace entries 6-10 with enriched versions**

**True Believer:**
- toneKeywords: adjectives `['fervent', 'burning', 'absolute', 'righteous', 'unwavering']`, verbs `['proclaimed', 'knelt', 'defied', 'sanctified', 'condemned']`, rhythm `"Declarative. Certain. Sentences that brook no doubt, until doubt arrives."`
- beatPatterns: doom_escalation → promote to chronicle; trait_lost (faith-related) → promote to notable; actor_death → promote to chronicle
- vignetteSeeds: 3-5 true-believer chronicler fragments
- narrativeRequirements: shrines, holy relics, sacred texts, heretical counterpoints

**Schemer:**
- toneKeywords: adjectives `['cold', 'precise', 'patient', 'hidden', 'calculating']`, verbs `['maneuvered', 'positioned', 'leveraged', 'betrayed', 'anticipated']`, rhythm `"Measured. Each sentence places a piece. The reader sees the trap close only in the final clause."`
- beatPatterns: contested_action → promote to notable; action_critical → promote to notable
- vignetteSeeds: 3-5 schemer chronicler fragments
- narrativeRequirements: tools of betrayal, secret meeting locations, forged documents, poisons

**Wanderer:**
- toneKeywords: adjectives `['distant', 'road-worn', 'laconic', 'watchful', 'rootless']`, verbs `['drifted', 'observed', 'stumbled', 'departed', 'wandered']`, rhythm `"Loose, drifting cadence. Then a sudden short sentence when consequence arrives."`
- beatPatterns: action_critical → promote to notable; trait_acquired → stays notable
- vignetteSeeds: 3-5 wanderer chronicler fragments
- narrativeRequirements: crossroads, foreign artifacts, strangers' debts, forgotten paths

**Monster:**
- toneKeywords: adjectives `['brutal', 'unflinching', 'massive', 'pitiless', 'raw']`, verbs `['crushed', 'tore', 'devoured', 'loomed', 'destroyed']`, rhythm `"Flat and heavy. No flourish. Violence described with the plainness of weather."`
- beatPatterns: actor_death → promote to chronicle; action_critical → promote to notable; contested_action → stays notable
- vignetteSeeds: 3-5 monster chronicler fragments
- narrativeRequirements: trophies of conquest, devastated landscapes, fearful witnesses

**Folk Hero:**
- toneKeywords: adjectives `['stubborn', 'calloused', 'warm', 'unlikely', 'plain-spoken']`, verbs `['stood', 'laughed', 'shared', 'rallied', 'persisted']`, rhythm `"Earthy and warm. Humor arrives naturally. Gallows comedy earns its place through the character."`
- beatPatterns: action_critical → promote to notable; contested_action → promote to notable; tier_transition → stays notable
- vignetteSeeds: 3-5 folk-hero chronicler fragments
- narrativeRequirements: common tools turned weapons, grateful communities, humble gifts

---

### Task 4: Populate Archetypes 11-15 (Reluctant King through Old Power)

**Files:**
- Modify: `src/data/archetype-content.ts` — archetypes array entries 11-15

**Step 1: Replace entries 11-15 with enriched versions**

**Reluctant King:**
- toneKeywords: adjectives `['burdened', 'quiet', 'reluctant', 'dignified', 'melancholic']`, verbs `['accepted', 'bore', 'decided', 'sighed', 'ruled']`, rhythm `"Weight in every sentence. Duty named plainly. Melancholy underneath, never self-pitying."`
- beatPatterns: tier_transition → promote to notable; actor_death → promote to chronicle; mandate_stage → promote to notable
- vignetteSeeds: 3-5 reluctant-king chronicler fragments
- narrativeRequirements: thrones, crowns, seals of office, petitioners, unanswered letters

**Oathkeeper:**
- toneKeywords: adjectives `['stubborn', 'grinding', 'iron-willed', 'unbending', 'devoted']`, verbs `['swore', 'held', 'endured', 'refused', 'kept']`, rhythm `"Repetitive structure mirrors the oath's grip. The same word or phrase echoes, tightening."`
- beatPatterns: actor_death → promote to chronicle; contested_action → promote to notable; trait_lost → promote to notable
- vignetteSeeds: 3-5 oathkeeper chronicler fragments
- narrativeRequirements: the oath's physical token, witnesses to the vow, tests of faith

**Poisoned Court:**
- toneKeywords: adjectives `['silken', 'venomous', 'perfumed', 'treacherous', 'gleaming']`, verbs `['smiled', 'poisoned', 'insinuated', 'maneuvered', 'struck']`, rhythm `"Every sentence has a second meaning. Civility is the weapon. Subtext does the killing."`
- beatPatterns: contested_action → promote to notable; action_critical → promote to notable
- vignetteSeeds: 3-5 poisoned-court chronicler fragments
- narrativeRequirements: thrones, poisoned gifts, spy networks, alliances

**Doomed Innocent:**
- toneKeywords: adjectives `['tender', 'small', 'bright', 'doomed', 'fading']`, verbs `['hoped', 'trusted', 'reached', 'lost', 'dimmed']`, rhythm `"Start gentle and bright. Let the prose darken one degree at a time. Never rescue them."`
- beatPatterns: actor_death → promote to chronicle; trait_lost → promote to notable; doom_escalation → promote to notable
- vignetteSeeds: 3-5 doomed-innocent chronicler fragments
- narrativeRequirements: small personal treasures, protective figures, places of safety lost

**Old Power:**
- toneKeywords: adjectives `['ancient', 'vast', 'slow', 'elemental', 'immeasurable']`, verbs `['stirred', 'remembered', 'woke', 'endured', 'crumbled']`, rhythm `"Geological pace. Sentences heavy with deep time. Weight, not speed."`
- beatPatterns: doom_escalation → promote to chronicle; tier_transition → promote to notable; action_critical → promote to notable
- vignetteSeeds: 3-5 old-power chronicler fragments
- narrativeRequirements: ancient sites, sleeping artifacts, geological features, forgotten wards

---

### Task 5: Populate Archetypes 16-19 (Kingmaker through Noble Savage)

**Files:**
- Modify: `src/data/archetype-content.ts` — archetypes array entries 16-19

**Step 1: Replace entries 16-19 with enriched versions**

**Kingmaker:**
- toneKeywords: adjectives `['shrewd', 'quiet', 'understated', 'watchful', 'influential']`, verbs `['arranged', 'whispered', 'chose', 'positioned', 'withdrew']`, rhythm `"Understatement. The biggest moves described in the smallest words. Power exercised through others."`
- beatPatterns: contested_action → promote to notable; action_critical → promote to notable
- vignetteSeeds: 3-5 kingmaker chronicler fragments
- narrativeRequirements: candidates, leverage, intelligence networks, debts owed

**Seeker:**
- toneKeywords: adjectives `['obsessive', 'precise', 'fevered', 'brilliant', 'unraveling']`, verbs `['searched', 'decoded', 'uncovered', 'pierced', 'paid']`, rhythm `"Precise at first, growing fragmented. Clarity of mind giving way to compulsion."`
- beatPatterns: trait_acquired → promote to notable; action_critical → promote to chronicle; doom_escalation → promote to notable
- vignetteSeeds: 3-5 seeker chronicler fragments
- narrativeRequirements: ancient ruins, forbidden libraries, cryptic artifacts, warning inscriptions

**Maker:**
- toneKeywords: adjectives `['patient', 'meticulous', 'proud', 'calloused', 'devoted']`, verbs `['shaped', 'forged', 'measured', 'perfected', 'finished']`, rhythm `"Hands-on specificity. Name the materials, describe the process. The craft is sacred."`
- beatPatterns: action_critical → promote to notable; trait_acquired → stays notable; actor_death → promote to chronicle
- vignetteSeeds: 3-5 maker chronicler fragments
- narrativeRequirements: raw materials, workshops, unfinished masterworks, apprentices

**Noble Savage:**
- toneKeywords: adjectives `['raw', 'primal', 'towering', 'contemptuous', 'elemental']`, verbs `['charged', 'roared', 'broke', 'scorned', 'endured']`, rhythm `"Direct. Physical. Contempt for abstraction. The body is the argument."`
- beatPatterns: contested_action → promote to notable; action_critical → promote to notable; actor_death → promote to chronicle
- vignetteSeeds: 3-5 noble-savage chronicler fragments
- narrativeRequirements: wilderness landmarks, totemic animals, sacred natural sites, tribal tokens

**Step 2: Run all tests — everything should pass now**

Run: `npx vitest run src/data/__tests__/archetype-content.test.ts`
Expected: ALL PASS — all 19 archetypes fully populated, all structural checks pass.

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

**Step 4: Commit all enriched archetypes**

```bash
git add src/data/archetype-content.ts src/data/__tests__/archetype-content.test.ts
git commit -m "feat: enrich 19 narrative archetypes with tone, beats, vignettes, requirements"
```

---

### Task 6: Add Lookup Functions

**Files:**
- Modify: `src/data/archetype-content.ts` — add 3 new exports after existing `getArchetype()`

**Step 1: The tests for these are already written in Task 1 (lookup functions describe block). Implement:**

```typescript
export function getArchetypeTone(id: string): ToneKeywords | undefined {
  return NARRATIVE_ARCHETYPES.find(a => a.id === id)?.toneKeywords;
}

export function getArchetypeBeatPatterns(id: string): BeatPattern[] {
  return NARRATIVE_ARCHETYPES.find(a => a.id === id)?.beatPatterns ?? [];
}

export function getArchetypeVignette(id: string, seed: number): string | undefined {
  const arch = NARRATIVE_ARCHETYPES.find(a => a.id === id);
  if (!arch || arch.vignetteSeeds.length === 0) return undefined;
  const index = ((seed % arch.vignetteSeeds.length) + arch.vignetteSeeds.length) % arch.vignetteSeeds.length;
  return arch.vignetteSeeds[index];
}
```

**Step 2: Run tests**

Run: `npx vitest run src/data/__tests__/archetype-content.test.ts`
Expected: ALL PASS

**Step 3: Run full build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Clean

**Step 4: Commit**

```bash
git add src/data/archetype-content.ts
git commit -m "feat: add archetype lookup functions (tone, beats, vignettes)"
```

---

### Task 7: Verify Existing Consumers Still Work

**Files:**
- Read only: `src/engine/agentDetail.ts`, `src/engine/worldSeed.ts`, `src/components/Game/AgentDetailPanel.tsx`

**Step 1: Run all engine tests that touch archetypes**

```bash
npx vitest run src/engine/__tests__/agentDetail-integration.test.ts
npx vitest run src/data/__tests__/archetype-content.test.ts
```

Expected: ALL PASS — the enriched interface is backward compatible (new fields added, no fields removed).

**Step 2: Run the full test suite for content packages**

```bash
npx vitest run src/data/__tests__/
```

Expected: ALL PASS across all content package test files.

**Step 3: Verify build**

Run: `npx vite build`
Expected: Clean build

---

### Task 8: Documentation Updates

**Files:**
- Modify: Obsidian vault via MCP — update Narrative Archetypes.md, Content Packages.md
- Modify: Notion backlog — mark "Implementation: Archetype Content Data" complete
- Modify: `CLAUDE.md` — add changelog entries, update engine stats

**Step 1: Update Obsidian Narrative Archetypes.md**

Add implementation status, data fields, and cross-references to content strategy.

**Step 2: Update Obsidian Content Packages.md**

Mark `archetype-content.ts` as enriched (was ✅ basic, now ✅ enriched with tone/beats/vignettes/requirements).

**Step 3: Update Notion backlog**

Mark "Implementation: Archetype Content Data" as complete with reference to design + plan docs.

**Step 4: Update CLAUDE.md changelog**

Add entries for archetype enrichment.

**Step 5: Commit docs**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for archetype content enrichment"
```
