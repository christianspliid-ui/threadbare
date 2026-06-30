import { describe, it, expect } from 'vitest';
import {
  CORE_TRAIT_DEFINITIONS,
  CORE_TRAIT_BY_CONTINUUM,
} from '../core-trait-content';
import { CORE_CONTINUA, CORE_CONTINUUM_IDS } from '../../types/coreRegistry';
import type { TraitDefinitionProperties } from '../../types/traits';

function props(node: { properties: Record<string, unknown> }): TraitDefinitionProperties {
  return node.properties as unknown as TraitDefinitionProperties;
}

describe('CORE_TRAIT_DEFINITIONS', () => {
  it('defines exactly 10 traits (5 continuums × virtue/vice)', () => {
    expect(CORE_TRAIT_DEFINITIONS).toHaveLength(10);
  });

  it('every def is a trait node with subcategory "core"', () => {
    for (const node of CORE_TRAIT_DEFINITIONS) {
      expect(node.type).toBe('trait');
      expect(props(node).subcategory).toBe('core');
    }
  });

  it('ids follow trait.core.<continuumId>.<pole> and are unique', () => {
    const ids = CORE_TRAIT_DEFINITIONS.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const node of CORE_TRAIT_DEFINITIONS) {
      expect(node.id).toMatch(/^trait\.core\.core_[a-z]+\.(virtue|vice)$/);
    }
  });

  it('carries NO domainContributions and NO scoringModifiers (Core ≠ reach ≠ capability)', () => {
    for (const node of CORE_TRAIT_DEFINITIONS) {
      const p = props(node);
      expect(Object.keys(p.domainContributions)).toHaveLength(0);
      // scoringModifiers must be absent or empty — the Core never biases reach selection.
      expect(p.scoringModifiers === undefined || Object.keys(p.scoringModifiers).length === 0).toBe(true);
    }
  });

  it('is binary present/absent (maxLevel 1) with authored flavor text', () => {
    for (const node of CORE_TRAIT_DEFINITIONS) {
      const p = props(node);
      expect(p.maxLevel).toBe(1);
      expect(p.flavorText.length).toBeGreaterThan(0);
      expect(p.visibility).toBe('public');
    }
  });

  it('names the trait with the registry pole word', () => {
    for (const continuum of CORE_CONTINUA) {
      const ids = CORE_TRAIT_BY_CONTINUUM[continuum.continuumId];
      const virtueNode = CORE_TRAIT_DEFINITIONS.find((n) => n.id === ids.virtue)!;
      const viceNode = CORE_TRAIT_DEFINITIONS.find((n) => n.id === ids.vice)!;
      expect(virtueNode.name).toBe(continuum.virtue.word);
      expect(viceNode.name).toBe(continuum.vice.word);
    }
  });
});

describe('CORE_TRAIT_BY_CONTINUUM', () => {
  it('maps every continuum id to its virtue/vice trait ids', () => {
    for (const id of CORE_CONTINUUM_IDS) {
      const ids = CORE_TRAIT_BY_CONTINUUM[id];
      expect(ids).toBeDefined();
      expect(ids.virtue).toBe(`trait.core.${id}.virtue`);
      expect(ids.vice).toBe(`trait.core.${id}.vice`);
    }
  });

  it('every mapped id resolves to a defined trait node', () => {
    const known = new Set(CORE_TRAIT_DEFINITIONS.map((n) => n.id));
    for (const id of CORE_CONTINUUM_IDS) {
      const ids = CORE_TRAIT_BY_CONTINUUM[id];
      expect(known.has(ids.virtue)).toBe(true);
      expect(known.has(ids.vice)).toBe(true);
    }
  });
});
