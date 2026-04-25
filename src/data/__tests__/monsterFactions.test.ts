/**
 * Tests for monster type system and monster faction definitions.
 *
 * Plan: m2.5-01 Task 1
 * Covers: LairTier type, SPHERE_ARCHETYPE_MAP completeness, DANGER_ZONE_LABELS,
 *         MonsterFactionDefinitions shape and count.
 */

import { describe, it, expect } from 'vitest';
import { SPHERE_ARCHETYPE_MAP, DANGER_ZONE_LABELS } from '../../types/monster';
import type { LairTier, DangerZone } from '../../types/monster';
import { MONSTER_FACTION_DEFINITIONS, getMonsterFactionBySphere } from '../monster-faction-definitions';
import { CREATION_SPHERE_NAMES } from '../../types/index';

// contentInvariants sweep v2 (THR-245): kept 3 structural (fixed-enum), replaced 0 growth-tracking

// ─── Test 1: LairTier type validation ────────────────────────────────────────

describe('LairTier type', () => {
  it('accepts valid values: minor, major, legendary', () => {
    const validTiers: LairTier[] = ['minor', 'major', 'legendary'];
    // Fixed LairTier union in src/types/monster.ts.
    expect(validTiers).toHaveLength(3);
    expect(validTiers).toContain('minor');
    expect(validTiers).toContain('major');
    expect(validTiers).toContain('legendary');
  });

  it('does not include invalid values', () => {
    const validTiers: LairTier[] = ['minor', 'major', 'legendary'];
    // @ts-expect-error testing invalid value at runtime
    const invalid: LairTier = 'epic';
    expect(validTiers).not.toContain(invalid);
  });
});

// ─── Test 2: SPHERE_ARCHETYPE_MAP completeness ───────────────────────────────

describe('SPHERE_ARCHETYPE_MAP', () => {
  it('has exactly 8 creation sphere entries', () => {
    const keys = Object.keys(SPHERE_ARCHETYPE_MAP);
    // 8 creation spheres — see CREATION_SPHERE_NAMES in src/types/index.ts.
    expect(keys).toHaveLength(CREATION_SPHERE_NAMES.length);
  });

  it('covers all 8 creation spheres', () => {
    const expectedSpheres = [...CREATION_SPHERE_NAMES] as string[];
    for (const sphere of expectedSpheres) {
      expect(SPHERE_ARCHETYPE_MAP).toHaveProperty(sphere);
      expect(SPHERE_ARCHETYPE_MAP[sphere].sphere).toBe(sphere);
      expect(SPHERE_ARCHETYPE_MAP[sphere].name).toBeTruthy();
      expect(SPHERE_ARCHETYPE_MAP[sphere].description).toBeTruthy();
    }
  });

  it('each archetype has sphere, name, and description', () => {
    for (const [key, archetype] of Object.entries(SPHERE_ARCHETYPE_MAP)) {
      expect(archetype.sphere).toBe(key);
      expect(typeof archetype.name).toBe('string');
      expect(archetype.name.length).toBeGreaterThan(0);
      expect(typeof archetype.description).toBe('string');
      expect(archetype.description.length).toBeGreaterThan(0);
    }
  });
});

// ─── Test 3: DANGER_ZONE_LABELS mapping ──────────────────────────────────────

describe('DANGER_ZONE_LABELS', () => {
  it('maps capital to Safe', () => {
    expect(DANGER_ZONE_LABELS.capital).toBe('Safe');
  });

  it('maps heartland to Low Risk', () => {
    expect(DANGER_ZONE_LABELS.heartland).toBe('Low Risk');
  });

  it('maps borderland to Moderate Risk', () => {
    expect(DANGER_ZONE_LABELS.borderland).toBe('Moderate Risk');
  });

  it('maps wilderness to Danger Zone', () => {
    expect(DANGER_ZONE_LABELS.wilderness).toBe('Danger Zone');
  });

  it('covers all 4 DangerZone values', () => {
    const zones: DangerZone[] = ['capital', 'heartland', 'borderland', 'wilderness'];
    for (const zone of zones) {
      expect(DANGER_ZONE_LABELS[zone]).toBeTruthy();
    }
  });
});

// ─── Test 4: MONSTER_FACTION_DEFINITIONS shape ───────────────────────────────

describe('MONSTER_FACTION_DEFINITIONS shape', () => {
  it('each definition has valid FactionDefinition shape', () => {
    for (const def of MONSTER_FACTION_DEFINITIONS) {
      expect(typeof def.id).toBe('string');
      expect(def.id.length).toBeGreaterThan(0);
      expect(typeof def.nameTemplate).toBe('string');
      expect(def.factionType).toBe('monster');
      expect(typeof def.reachWeights).toBe('object');
      expect(Array.isArray(def.locationTypes)).toBe(true);
      expect(Array.isArray(def.rankTiers)).toBe(true);
      expect(def.rankTiers.length).toBeGreaterThanOrEqual(1);
      expect(typeof def.reputationDecayPerTick).toBe('number');
      expect(typeof def.joinEncounterTemplateId).toBe('string');
      expect(typeof def.promotionEncounterTemplateId).toBe('string');
      expect(Array.isArray(def.questTemplateIds)).toBe(true);
      expect(Array.isArray(def.socialTemplateIds)).toBe(true);
      expect(Array.isArray(def.expulsionConsequences)).toBe(true);
    }
  });

  it('each definition has isMonsterFaction: true', () => {
    for (const def of MONSTER_FACTION_DEFINITIONS) {
      expect(def.isMonsterFaction).toBe(true);
    }
  });

  it('each definition has non-empty ambitionWeights', () => {
    for (const def of MONSTER_FACTION_DEFINITIONS) {
      expect(def.ambitionWeights).toBeDefined();
      const weights = def.ambitionWeights!;
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeGreaterThan(0);
    }
  });

  it('each definition has lair in locationTypes', () => {
    for (const def of MONSTER_FACTION_DEFINITIONS) {
      expect(def.locationTypes).toContain('lair');
    }
  });
});

// ─── Test 5: MONSTER_FACTION_DEFINITIONS count ───────────────────────────────

describe('MONSTER_FACTION_DEFINITIONS count', () => {
  it('has exactly 8 entries (one per creation sphere)', () => {
    // One monster faction per creation sphere in src/types/index.ts.
    expect(MONSTER_FACTION_DEFINITIONS).toHaveLength(CREATION_SPHERE_NAMES.length);
  });

  it('has one entry per creation sphere', () => {
    const expectedIds = CREATION_SPHERE_NAMES.map(s => `monster_${s}`);
    const actualIds = MONSTER_FACTION_DEFINITIONS.map(d => d.id);
    for (const expectedId of expectedIds) {
      expect(actualIds).toContain(expectedId);
    }
  });
});

// ─── Test 6: getMonsterFactionBySphere helper ────────────────────────────────

describe('getMonsterFactionBySphere', () => {
  it('finds a faction definition by sphere name', () => {
    const def = getMonsterFactionBySphere('force');
    expect(def).toBeDefined();
    expect(def?.id).toBe('monster_force');
  });

  it('returns undefined for unknown sphere', () => {
    const def = getMonsterFactionBySphere('unknown_sphere');
    expect(def).toBeUndefined();
  });
});
