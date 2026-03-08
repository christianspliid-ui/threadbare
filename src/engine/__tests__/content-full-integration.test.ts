import { describe, it, expect } from 'vitest';
import { ORDEAL_TEMPLATES, ORDEAL_INSPECTION_VIGNETTES, ORDEAL_DIFFICULTY_TIERS, ORDEAL_SYSTEM_CONNECTIONS } from '../../data/ordeal-content';
import { CHRONICLER_VIGNETTES, SUBLOCATION_FLAVOR, ARTIFACT_LORE, LOCATION_TYPE_FLAVOR, MAGIC_TRADITION_FLAVOR } from '../../data/chronicler-content';
import { ROUTINE_TEMPLATES, NOTABLE_TEMPLATES, LIFECYCLE_TEMPLATES, ARCHETYPE_EVENT_TEMPLATES, SPHERE_INFLUENCE_EVENTS, SEASONAL_VOCABULARY, ECHO_FLAVOR_TEXTS, STEALTH_DETECTION_PROSE, DILEMMA_STAKES_PROSE } from '../../data/narrative-content';
import { DOOM_VOCABULARY } from '../../data/doom-content';
import { RIVAL_PERSONALITY_PROFILES } from '../../data/rival-content';
import { CULTURAL_PROSE_PALETTES, CULTURAL_TENSION_TEMPLATES } from '../../data/culture-content';
import { FUNDAMENT_DESCRIPTIONS, RESONANCE_FRAGMENT_PROSE } from '../../data/worldsoul-content';

describe('Full content population integration', () => {
  it('Layer 1: minimum visible playthrough content present', () => {
    expect(ORDEAL_TEMPLATES.length).toBe(10);
    expect(Object.values(ROUTINE_TEMPLATES).flat().length).toBeGreaterThanOrEqual(80);
    expect(Object.values(NOTABLE_TEMPLATES).flat().length).toBeGreaterThanOrEqual(20);
    expect(Object.values(LIFECYCLE_TEMPLATES).flat().length).toBe(11);
    expect(Object.keys(DOOM_VOCABULARY)).toHaveLength(7);
  });

  it('Layer 2: inspection content present', () => {
    expect(Object.keys(CHRONICLER_VIGNETTES)).toHaveLength(15);
    expect(Object.keys(SUBLOCATION_FLAVOR)).toHaveLength(14);
    expect(ARTIFACT_LORE).toHaveLength(30);
    expect(Object.keys(LOCATION_TYPE_FLAVOR)).toHaveLength(15);
    expect(Object.keys(MAGIC_TRADITION_FLAVOR)).toHaveLength(34);
    expect(ORDEAL_INSPECTION_VIGNETTES.inProgress).toHaveLength(10);
  });

  it('Layer 3: replay variety content present', () => {
    expect(Object.keys(CULTURAL_PROSE_PALETTES)).toHaveLength(12);
    expect(Object.keys(ARCHETYPE_EVENT_TEMPLATES).length).toBeGreaterThanOrEqual(58);
    expect(RIVAL_PERSONALITY_PROFILES).toHaveLength(8);
    expect(Object.keys(DILEMMA_STAKES_PROSE)).toHaveLength(12);
    expect(Object.keys(ORDEAL_DIFFICULTY_TIERS)).toHaveLength(3);
  });

  it('Layer 4: connective tissue present', () => {
    expect(Object.keys(SPHERE_INFLUENCE_EVENTS)).toHaveLength(16);
    expect(Object.keys(SEASONAL_VOCABULARY)).toHaveLength(4);
    expect(ECHO_FLAVOR_TEXTS).toHaveLength(12);
    expect(Object.keys(STEALTH_DETECTION_PROSE)).toHaveLength(8);
    expect(Object.keys(FUNDAMENT_DESCRIPTIONS)).toHaveLength(12);
    expect(RESONANCE_FRAGMENT_PROSE).toHaveLength(8);
    expect(Object.keys(CULTURAL_TENSION_TEMPLATES)).toHaveLength(4);
    expect(ORDEAL_SYSTEM_CONNECTIONS.doom).toHaveLength(3);
  });

  it('grand total: substantial content across all layers', () => {
    const layer1 = ORDEAL_TEMPLATES.length * 3 + // ordeal encounters
      Object.values(ROUTINE_TEMPLATES).flat().length +
      Object.values(NOTABLE_TEMPLATES).flat().length +
      Object.values(LIFECYCLE_TEMPLATES).flat().length +
      Object.keys(DOOM_VOCABULARY).length * 14; // ~5+5+3+1 per stage

    const layer2 = Object.keys(CHRONICLER_VIGNETTES).length +
      Object.keys(SUBLOCATION_FLAVOR).length +
      ARTIFACT_LORE.length +
      Object.keys(LOCATION_TYPE_FLAVOR).length +
      Object.keys(MAGIC_TRADITION_FLAVOR).length +
      (ORDEAL_INSPECTION_VIGNETTES.inProgress.length + ORDEAL_INSPECTION_VIGNETTES.completed.length + ORDEAL_INSPECTION_VIGNETTES.failed.length);

    const layer3 = Object.keys(CULTURAL_PROSE_PALETTES).length +
      Object.keys(ARCHETYPE_EVENT_TEMPLATES).length +
      RIVAL_PERSONALITY_PROFILES.length +
      Object.keys(DILEMMA_STAKES_PROSE).length +
      Object.keys(ORDEAL_DIFFICULTY_TIERS).length;

    const layer4 = Object.keys(SPHERE_INFLUENCE_EVENTS).length +
      Object.keys(SEASONAL_VOCABULARY).length +
      ECHO_FLAVOR_TEXTS.length +
      Object.keys(STEALTH_DETECTION_PROSE).length +
      Object.keys(FUNDAMENT_DESCRIPTIONS).length +
      RESONANCE_FRAGMENT_PROSE.length +
      Object.keys(CULTURAL_TENSION_TEMPLATES).length +
      ORDEAL_SYSTEM_CONNECTIONS.doom.length +
      ORDEAL_SYSTEM_CONNECTIONS.culture.length +
      ORDEAL_SYSTEM_CONNECTIONS.rival.length;

    // Verify totals are in the right ballpark
    expect(layer1).toBeGreaterThan(150);
    expect(layer2).toBeGreaterThan(80);
    expect(layer3).toBeGreaterThan(30);
    expect(layer4).toBeGreaterThan(50);
    expect(layer1 + layer2 + layer3 + layer4).toBeGreaterThan(400);
  });
});
