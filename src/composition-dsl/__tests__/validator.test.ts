import { describe, expect, it } from 'vitest';

import { WINNOWING_OF_LUCK_EVENT_RECIPE } from '../examples/event-winnowing-of-luck.recipe';
import { MERCHANT_CONSORTIUM_FACTION_RECIPE } from '../examples/faction.recipe';
import { formatValidationReport, runValidationHarness } from '../harness';
import { parseComposition } from '../schema';
import type { WorldState } from '../validator';
import { validateComposition } from '../validator';

const EMPTY_WORLD: WorldState = {
  nodes: [],
  doomClockTier: 0,
  worldFlags: {},
  firedCompositions: [],
};

const CONSORTIUM_WORLD: WorldState = {
  nodes: [
    {
      id: 'faction.merchant-consortium',
      kind: 'faction',
      class: 'promoted',
      tags: {
        archetype: ['merchant_consortium'],
        reach: ['order'],
        sphere: ['gold'],
      },
      edges: [],
    },
    {
      id: 'agent.merchant-clerk',
      kind: 'agent',
      class: 'generic',
      tags: {
        archetype: ['merchant_agent'],
        reach: ['order'],
        sphere: ['gold'],
      },
      edges: [],
    },
  ],
  doomClockTier: 1,
  worldFlags: {
    'omens.luck-thinning': false,
  },
  firedCompositions: [],
};

const EVENT_READY_WORLD: WorldState = {
  nodes: [
    {
      id: 'faction.merchant-consortium',
      kind: 'faction',
      class: 'promoted',
      tags: {
        archetype: ['merchant_consortium'],
        reach: ['order'],
        sphere: ['gold'],
      },
      edges: [{ type: 'advises', to: 'location.wizard-tower-ash' }],
    },
    {
      id: 'location.wizard-tower-ash',
      kind: 'location',
      class: 'generic',
      tags: {
        archetype: ['wizard_tower'],
        reach: ['order'],
        sphere: ['mind'],
      },
      edges: [],
    },
    {
      id: 'artifact.luckstone-fragment',
      kind: 'artifact',
      class: 'generic',
      tags: {
        archetype: ['luck_stone'],
        sphere: ['spirit'],
      },
      edges: [{ type: 'housed-in', to: 'location.wizard-tower-ash' }],
    },
    {
      id: 'agent.omen-whisperer',
      kind: 'agent',
      class: 'generic',
      tags: {
        archetype: ['omen_broker'],
        reach: ['order'],
        sphere: ['spirit'],
      },
      edges: [],
    },
    {
      id: 'agent.merchant-clerk',
      kind: 'agent',
      class: 'generic',
      tags: {
        archetype: ['merchant_agent'],
        reach: ['order'],
        sphere: ['gold'],
      },
      edges: [],
    },
  ],
  doomClockTier: 2,
  worldFlags: {
    'omens.luck-thinning': true,
  },
  firedCompositions: ['merchant-consortium-court'],
};

describe('composition DSL v0 validator', () => {
  it('parses both reference recipes against schema', () => {
    expect(parseComposition(MERCHANT_CONSORTIUM_FACTION_RECIPE).id).toBe('merchant-consortium-court');
    expect(parseComposition(WINNOWING_OF_LUCK_EVENT_RECIPE).id).toBe('the-winnowing-of-luck');
  });

  it('fails to fire faction recipe against empty world with readable errors', () => {
    const report = validateComposition(MERCHANT_CONSORTIUM_FACTION_RECIPE, EMPTY_WORLD);

    expect(report.willFire).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors.join(' ')).toContain('patronFaction');
    expect(report.nodes.patronFaction.status).toBe('error');
  });

  it('fires faction recipe against consortium world and previews mutation/create work', () => {
    const report = validateComposition(MERCHANT_CONSORTIUM_FACTION_RECIPE, CONSORTIUM_WORLD);

    expect(report.willFire).toBe(true);
    expect(report.nodes.patronFaction.status).toBe('resolved');
    expect(report.nodes.guildFactor.status).toBe('resolved');
    expect(report.mutations.length).toBeGreaterThanOrEqual(1);
    expect(report.nodes.tariffScribes.status).toBe('would-create');
  });

  it('fails to fire event recipe when hard precondition is unmet', () => {
    const report = validateComposition(WINNOWING_OF_LUCK_EVENT_RECIPE, CONSORTIUM_WORLD);

    expect(report.willFire).toBe(false);
    expect(report.errors.join(' ')).toContain('Hard precondition');
    expect(report.preconditions.some((item) => item.status === 'blocked')).toBe(true);
  });

  it('fires event recipe against event-ready world and exercises all required dimensions', () => {
    const report = validateComposition(WINNOWING_OF_LUCK_EVENT_RECIPE, EVENT_READY_WORLD);
    const nodes = Object.values(report.nodes);

    expect(report.willFire).toBe(true);

    expect(report.preconditions.some((item) => item.strength === 'hard')).toBe(true);
    expect(report.preconditions.some((item) => item.strength === 'medium')).toBe(true);
    expect(report.preconditions.some((item) => item.strength === 'soft')).toBe(true);

    expect(nodes.some((node) => node.strategy === 'literal')).toBe(true);
    expect(nodes.some((node) => node.strategy === 'procedural')).toBe(true);
    expect(nodes.some((node) => node.strategy === 'find-rename-create')).toBe(true);

    expect(nodes.some((node) => node.tier === 'essential')).toBe(true);
    expect(nodes.some((node) => node.tier === 'flavor')).toBe(true);
    expect(nodes.some((node) => node.tier === 'atmospheric')).toBe(true);
  });

  it('formats harness output with a concise execution summary', () => {
    const report = runValidationHarness(WINNOWING_OF_LUCK_EVENT_RECIPE, EVENT_READY_WORLD);
    const text = formatValidationReport(report);

    expect(text).toContain('Composition: the-winnowing-of-luck');
    expect(text).toContain('Will fire: yes');
    expect(text).toContain('Node resolution:');
  });
});
