/**
 * THR-1658 — descent from a dead empire, read at play time.
 *
 * DW1: the Raise-the-Old-Banner gate (`requiresDescent`, fail-closed).
 * DW2: the two milestone conditions, `agent_at_ancestral_ruin` and
 * `agent_took_ancestral_ground`, on hand-built graphs. The writer/reader agreement on
 * a generated world lives in the heavy file `descent-generatedWorld.test.ts`.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { evaluateGraphCondition } from '../graphConditions';
import { passesEligibility, type AmbitionAgentSnapshot } from '../ambitionSelection';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';
import { OLD_BANNER_TEMPLATE_ID, OLD_BANNER_LABEL_STEM } from '../../data/descent-constants';
import { getDescentCultureIds, historicalCultureOfRegion, ancestralRuinIds } from '../descent';
import { oldBannerLabel } from '../ambitionTick';
import type { ReachDomain } from '../../types/traits';

const OLD = 'culture_ash';
const OTHER = 'culture_salt';

function snapshot(descentCultureIds?: string[]): AmbitionAgentSnapshot {
  const caps = { iron: 0.6, heart: 0.6 } as Record<ReachDomain, number>;
  return { domainCapabilities: caps, traits: [], culturalSpheres: [], bonds: [], ...(descentCultureIds ? { descentCultureIds } : {}) };
}

/**
 * Two regions: `region_old` was the Ash-Crowned's land, `region_new` belonged to the
 * Salt people. A town on each, a Place inside the old town, an Ash ruin on hex (2,2)
 * and a Salt ruin on (5,5). The heir is located in the old town at hex (2,2).
 */
function world(opts: { descent?: boolean; at?: string } = {}): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: OLD, type: 'actor', name: 'The Ash-Crowned', properties: {} });
  g.addNode({ id: OTHER, type: 'actor', name: 'The Salt Kings', properties: {} });
  for (const [region, culture] of [['region_old', OLD], ['region_new', OTHER]] as const) {
    g.addNode({ id: region, type: 'region', name: region, properties: {} });
    g.addEdge({ id: `e_${region}_hist`, source: region, target: culture, type: 'belongs_to', properties: { cultureLayer: 'historical' } });
  }
  g.addNode({ id: 'town_old', type: 'location', name: 'Old Town', properties: { hexCol: 2, hexRow: 2, locationSubtype: 'town' } });
  g.addNode({ id: 'town_new', type: 'location', name: 'New Town', properties: { hexCol: 8, hexRow: 8, locationSubtype: 'town' } });
  g.addNode({ id: 'place_old', type: 'location', name: 'Old Mill', properties: { parentLocationId: 'town_old' } });
  g.addEdge({ id: 'e_c_old', source: 'region_old', target: 'town_old', type: 'contains', properties: {} });
  g.addEdge({ id: 'e_c_new', source: 'region_new', target: 'town_new', type: 'contains', properties: {} });
  g.addEdge({ id: 'e_c_place', source: 'town_old', target: 'place_old', type: 'contains', properties: {} });
  g.addNode({ id: 'elder_ruin_1', type: 'location', name: 'Temple Ruin', properties: { locationSubtype: 'elder_ruin', hexCol: 2, hexRow: 2, originCultureId: OLD } });
  g.addNode({ id: 'elder_ruin_2', type: 'location', name: 'Vault Ruin', properties: { locationSubtype: 'elder_ruin', hexCol: 5, hexRow: 5, originCultureId: OTHER } });
  g.addNode({ id: 'salt_town', type: 'location', name: 'Salt Ruin Town', properties: { hexCol: 5, hexRow: 5 } });
  g.addNode({
    id: 'heir', type: 'actor', name: 'Heir',
    properties: { actorType: 'individual', ...(opts.descent === false ? {} : { backstoryStrata: [{ cultureId: OLD, relation: 'descent' }] }) },
  });
  g.addEdge({ id: 'e_heir_at', source: 'heir', target: opts.at ?? 'town_old', type: 'located_at', properties: {} });
  return g;
}

describe('descent readers (THR-1658)', () => {
  it('reads only descent strata, sorted and de-duplicated; malformed reads as none', () => {
    expect(getDescentCultureIds({ properties: { backstoryStrata: [
      { cultureId: 'b', relation: 'descent' }, { cultureId: 'a', relation: 'descent' },
      { cultureId: 'a', relation: 'descent' }, { cultureId: 'c', relation: 'other' }, null, 'x',
    ] } })).toEqual(['a', 'b']);
    expect(getDescentCultureIds({ properties: { originCultureId: 'a' } })).toEqual([]);
    expect(getDescentCultureIds({ properties: { backstoryStrata: 'nope' } })).toEqual([]);
    expect(getDescentCultureIds(undefined)).toEqual([]);
  });

  it('historical culture takes the lowest id on a tie; ruins filter by origin culture', () => {
    const g = world();
    g.addNode({ id: 'culture_aaa', type: 'actor', name: 'The First People', properties: {} });
    g.addEdge({ id: 'e_extra', source: 'region_old', target: 'culture_aaa', type: 'belongs_to', properties: { cultureLayer: 'historical' } });
    expect(historicalCultureOfRegion(g, 'region_old')).toBe('culture_aaa');
    expect(historicalCultureOfRegion(g, 'region_missing')).toBeUndefined();
    expect(ancestralRuinIds(g, [OLD])).toEqual(['elder_ruin_1']);
    expect(ancestralRuinIds(g, [])).toEqual([]);
  });
});

describe('DW1 — the descent gate', () => {
  const template = AMBITION_TEMPLATES.find(t => t.id === OLD_BANNER_TEMPLATE_ID)!;

  it('is in the re-evaluation pool, gated, and names no culprit', () => {
    expect(template).toBeDefined();
    expect(template.requiresDescent).toBe(true);
    expect(template.completion).toEqual({ requires: 2, of: 2 });
    expect(template.milestones.map(m => m.id).sort()).toEqual(Object.keys(template.milestoneProse).sort());
  });

  it('refuses a snapshot with no descent and one without the field; accepts descent past the floors', () => {
    expect(passesEligibility(template, snapshot())).toBe(false);
    expect(passesEligibility(template, snapshot([]))).toBe(false);
    expect(passesEligibility(template, snapshot([OLD]))).toBe(true);
    const weak = { ...snapshot([OLD]), domainCapabilities: { iron: 0.1, heart: 0.6 } as Record<ReachDomain, number> };
    expect(passesEligibility(template, weak)).toBe(false);
  });

  it('leaves every ungated template unaffected by the new field', () => {
    for (const t of AMBITION_TEMPLATES.filter(x => !x.requiresDescent)) {
      expect(passesEligibility(t, snapshot([OLD]))).toBe(passesEligibility(t, snapshot()));
    }
  });

  it('labels the drive with the blood it comes from, worded as the chronicle words it', () => {
    const g = world();
    expect(oldBannerLabel(g, [OLD])).toBe(`${OLD_BANNER_LABEL_STEM} the Ash-Crowned`);
    expect(oldBannerLabel(g, ['culture_unknown'])).toBe(`${OLD_BANNER_LABEL_STEM} a people long gone`);
    expect(oldBannerLabel(g, undefined)).toBe(`${OLD_BANNER_LABEL_STEM} a people long gone`);
  });
});

describe('DW2 — agent_at_ancestral_ruin', () => {
  const cond = { type: 'agent_at_ancestral_ruin' } as const;

  it('true on the hex of an elder ruin of the agent’s own empire', () => {
    expect(evaluateGraphCondition(cond, world(), 'heir')).toBe(true);
  });

  it('true from a Place on that hex (climbs to the parent Location)', () => {
    expect(evaluateGraphCondition(cond, world({ at: 'place_old' }), 'heir')).toBe(true);
  });

  it('false on a ruin of another empire', () => {
    expect(evaluateGraphCondition(cond, world({ at: 'salt_town' }), 'heir')).toBe(false);
  });

  it('false with no descent', () => {
    expect(evaluateGraphCondition(cond, world({ descent: false }), 'heir')).toBe(false);
  });

  it('false when the position cannot be resolved', () => {
    const g = world();
    g.removeEdge('e_heir_at');
    expect(evaluateGraphCondition(cond, g, 'heir')).toBe(false);
    expect(evaluateGraphCondition(cond, g, 'nobody')).toBe(false);
  });

  it('false on a minimal graph view that cannot enumerate nodes', () => {
    const g = world();
    const view = { getNode: (id: string) => g.getNode(id), getOutgoingEdges: (id: string, t?: string) => g.getOutgoingEdges(id, t as never), getIncomingEdges: (id: string, t?: string) => g.getIncomingEdges(id, t as never) };
    expect(evaluateGraphCondition(cond, view, 'heir')).toBe(false);
  });
});

describe('DW2 — agent_took_ancestral_ground', () => {
  const cond = { type: 'agent_took_ancestral_ground' } as const;
  const own = (g: WorldGraph, target: string, acquiredTick?: number) =>
    g.addEdge({ id: `e_own_${target}`, source: 'heir', target, type: 'owns', properties: acquiredTick === undefined ? {} : { acquiredTick } });

  it('true for a Place on the old land acquired at or after the window start', () => {
    const g = world();
    own(g, 'place_old', 100);
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 120, windowStartTick: 100 })).toBe(true);
  });

  it('false for one acquired before the drive began (the seed-7 case)', () => {
    const g = world();
    own(g, 'place_old', 0);
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 120, windowStartTick: 100 })).toBe(false);
  });

  it('false off the old land', () => {
    const g = world();
    own(g, 'town_new', 110);
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 120, windowStartTick: 100 })).toBe(false);
  });

  it('a claim (controls, establishedTick) on old land counts, windowed', () => {
    const g = world();
    g.addEdge({ id: 'e_ctl', source: 'heir', target: 'town_old', type: 'controls', properties: { establishedTick: 105, controlType: 'strategic' } });
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 120, windowStartTick: 100 })).toBe(true);
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 120, windowStartTick: 110 })).toBe(false);
  });

  it('a founding (incoming constructed_by, tick) of a Place on old land counts, windowed', () => {
    const g = world();
    g.addEdge({ id: 'e_built', source: 'place_old', target: 'heir', type: 'constructed_by', properties: { tick: 105 } });
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 120, windowStartTick: 100 })).toBe(true);
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 120, windowStartTick: 110 })).toBe(false);
  });

  it('false with no window, with no descent, and for an edge without acquiredTick', () => {
    const g = world();
    own(g, 'place_old', 110);
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 120 })).toBe(false);
    expect(evaluateGraphCondition(cond, g, 'heir')).toBe(false);
    const noBlood = world({ descent: false });
    own(noBlood, 'place_old', 110);
    expect(evaluateGraphCondition(cond, noBlood, 'heir', { currentTick: 120, windowStartTick: 100 })).toBe(false);
    const legacy = world();
    own(legacy, 'place_old');
    expect(evaluateGraphCondition(cond, legacy, 'heir', { currentTick: 120, windowStartTick: 100 })).toBe(false);
  });
});

describe('agent_rooted_off_ancestral_land (the drive\u2019s abandonment)', () => {
  const cond = { type: 'agent_rooted_off_ancestral_land', minTicks: 120 } as const;
  const settle = (g: WorldGraph, at: string, arrivedTick: number) => {
    const heir = g.getNode('heir')!;
    heir.properties.originLocationId = 'town_old';
    heir.properties.residencePositionId = at;
    heir.properties.residenceArrivedTick = arrivedTick;
  };

  it('true once settled off the old land for the dwell, counted from the window', () => {
    const g = world({ at: 'town_new' });
    settle(g, 'town_new', 0);
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 300, windowStartTick: 100 })).toBe(true);
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 200, windowStartTick: 100 })).toBe(false);
  });

  it('false when settled away from home but still on the old land (a Place in town, the next town, the ruin)', () => {
    const g = world({ at: 'place_old' });
    settle(g, 'place_old', 0);
    expect(evaluateGraphCondition(cond, g, 'heir', { currentTick: 300, windowStartTick: 100 })).toBe(false);
    // The exile's location-exact trigger would have fired here.
    expect(evaluateGraphCondition({ type: 'agent_away_from_origin', minTicks: 120 }, g, 'heir', { currentTick: 300, windowStartTick: 100 })).toBe(true);
  });

  it('false with no clock, no descent, or an unresolvable region', () => {
    const g = world({ at: 'town_new' });
    settle(g, 'town_new', 0);
    expect(evaluateGraphCondition(cond, g, 'heir')).toBe(false);
    const noBlood = world({ descent: false, at: 'town_new' });
    settle(noBlood, 'town_new', 0);
    expect(evaluateGraphCondition(cond, noBlood, 'heir', { currentTick: 300, windowStartTick: 100 })).toBe(false);
    const lost = world({ at: 'salt_town' }); // salt_town has no region edge
    settle(lost, 'salt_town', 0);
    expect(evaluateGraphCondition(cond, lost, 'heir', { currentTick: 300, windowStartTick: 100 })).toBe(false);
  });
});
