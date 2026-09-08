/**
 * The capability rider (THR-1440) — a completed undertaking grows the Reach it
 * leaned on, and nothing else does.
 *
 * Two arms. The **namer and the writer** against a bare graph: which Reach a cell
 * leans on (including the tie-break, which two of the six verb profiles actually
 * hit), what a tier pays, the cap, and the seams that fail soft. Then the **real
 * pipeline**: an instant cell started through the review lever grows its actor and
 * stamps the growth on the history entry — the arm that would go red if the writer
 * were never called, which no fixture test can see.
 *
 * The failure arm (a work that ends without completing grows nothing) lives in the
 * live sibling, where a failed terminal can be observed in a population rather than
 * asserted against a builder that trivially cannot set the field.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  leaningReachOf,
  completionGrowthForTier,
  growCapabilityOnCompletion,
} from '../undertakingCapabilityGrowth';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { startUndertakingForReview } from '../undertakingReviewLevers';
import { UNDERTAKING_CELL_TEMPLATES, CELL_REACH_BY_VERB } from '../../data/undertaking-cells';
import {
  CAPABILITY_MAX,
  UNDERTAKING_COMPLETION_CAPABILITY_GROWTH,
  UNDERTAKING_DEFAULT_TIER,
} from '../../data/strategic-action-constants';
import { REACH_DOMAINS, type ReachDomain } from '../../types/traits';
import type { StrategicActionTemplate } from '../../types/strategicAction';

const FLAT: Record<ReachDomain, number> = {
  iron: 20, gold: 20, shadow: 20, veil: 20, heart: 20, eye: 20, stone: 20, star: 20,
};

function graphWithActor(caps: Record<string, number> | undefined): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'ind_kael', type: 'actor', name: 'Kael',
    properties: { actorType: 'individual', ...(caps ? { domainCapabilities: { ...caps } } : {}) },
  });
  return g;
}

const tpl = (reachProfile: Partial<Record<ReachDomain, number>>) =>
  ({ reachProfile }) as unknown as StrategicActionTemplate;

const capsOf = (g: WorldGraph) =>
  g.getNode('ind_kael')!.properties.domainCapabilities as Record<string, number>;

describe('leaningReachOf — which Reach a work leaned on', () => {
  it('takes the highest-weighted entry', () => {
    expect(leaningReachOf(tpl({ stone: 0.6, gold: 0.4 }))).toBe('stone');
    expect(leaningReachOf(tpl({ iron: 0.6, shadow: 0.4 }))).toBe('iron');
  });

  it('breaks a tie by REACH_DOMAINS order, not by key insertion order', () => {
    // Written stone-first and heart-first: both must answer `heart`, which precedes
    // `stone` in REACH_DOMAINS. Key order alone would split them.
    expect(leaningReachOf(tpl({ stone: 0.5, heart: 0.5 }))).toBe('heart');
    expect(leaningReachOf(tpl({ heart: 0.5, stone: 0.5 }))).toBe('heart');
  });

  it('answers for every verb the cell table declares, and the answer is a real Reach', () => {
    for (const [verb, profile] of Object.entries(CELL_REACH_BY_VERB)) {
      const reach = leaningReachOf(tpl(profile));
      expect(reach, `verb ${verb} leans on nothing`).toBeDefined();
      expect(REACH_DOMAINS).toContain(reach!);
    }
  });

  it('fails soft on a template with no profile', () => {
    expect(leaningReachOf(undefined)).toBeUndefined();
    expect(leaningReachOf(tpl({}))).toBeUndefined();
  });
});

describe('completionGrowthForTier — what a tier pays', () => {
  it('reads the per-tier constant, and an unstamped tier falls to the grid default', () => {
    expect(completionGrowthForTier(1)).toBe(UNDERTAKING_COMPLETION_CAPABILITY_GROWTH[0]);
    expect(completionGrowthForTier(2)).toBe(UNDERTAKING_COMPLETION_CAPABILITY_GROWTH[1]);
    expect(completionGrowthForTier(3)).toBe(UNDERTAKING_COMPLETION_CAPABILITY_GROWTH[2]);
    expect(completionGrowthForTier(undefined))
      .toBe(UNDERTAKING_COMPLETION_CAPABILITY_GROWTH[UNDERTAKING_DEFAULT_TIER - 1]);
  });

  it('pays strictly more for a heavier work', () => {
    expect(completionGrowthForTier(2)).toBeGreaterThan(completionGrowthForTier(1));
    expect(completionGrowthForTier(3)).toBeGreaterThan(completionGrowthForTier(2));
  });
});

describe('growCapabilityOnCompletion — the writer', () => {
  it('grows the leaning Reach by the tier\'s constant and no other Reach', () => {
    const g = graphWithActor(FLAT);
    const grown = growCapabilityOnCompletion(g, 'ind_kael', tpl({ iron: 0.6, shadow: 0.4 }), 3);

    expect(grown).toEqual({ reach: 'iron', delta: UNDERTAKING_COMPLETION_CAPABILITY_GROWTH[2] });
    const after = capsOf(g);
    expect(after.iron).toBe(FLAT.iron + UNDERTAKING_COMPLETION_CAPABILITY_GROWTH[2]);
    // Every other Reach is untouched — including `shadow`, which the profile names.
    for (const reach of REACH_DOMAINS) {
      if (reach === 'iron') continue;
      expect(after[reach], `${reach} moved`).toBe(FLAT[reach]);
    }
  });

  it('accumulates across completions rather than re-writing the same value', () => {
    const g = graphWithActor(FLAT);
    growCapabilityOnCompletion(g, 'ind_kael', tpl({ iron: 1 }), 2);
    growCapabilityOnCompletion(g, 'ind_kael', tpl({ iron: 1 }), 2);
    expect(capsOf(g).iron).toBe(FLAT.iron + 2 * UNDERTAKING_COMPLETION_CAPABILITY_GROWTH[1]);
  });

  it('holds the cap, and a saturated Reach reports no growth rather than a zero one', () => {
    const g = graphWithActor({ ...FLAT, iron: CAPABILITY_MAX });
    expect(growCapabilityOnCompletion(g, 'ind_kael', tpl({ iron: 1 }), 3)).toBeUndefined();
    expect(capsOf(g).iron).toBe(CAPABILITY_MAX);

    // Just under the cap: the growth is clipped to the headroom, and the reported
    // delta is what landed — not what the tier nominally pays.
    const near = CAPABILITY_MAX - 0.25;
    const h = graphWithActor({ ...FLAT, iron: near });
    const grown = growCapabilityOnCompletion(h, 'ind_kael', tpl({ iron: 1 }), 3);
    expect(grown).toEqual({ reach: 'iron', delta: 0.25 });
    expect(capsOf(h).iron).toBe(CAPABILITY_MAX);
  });

  it('fails soft: no actor, no template, no capability model', () => {
    const g = graphWithActor(FLAT);
    expect(growCapabilityOnCompletion(g, 'ind_nobody', tpl({ iron: 1 }), 2)).toBeUndefined();
    expect(growCapabilityOnCompletion(g, 'ind_kael', undefined, 2)).toBeUndefined();

    // The common case in a real world: most mortals carry no `domainCapabilities`
    // at all, and finishing a job does not mint them one.
    const bare = graphWithActor(undefined);
    expect(growCapabilityOnCompletion(bare, 'ind_kael', tpl({ iron: 1 }), 2)).toBeUndefined();
    expect(bare.getNode('ind_kael')!.properties.domainCapabilities).toBeUndefined();
  });
});

describe('an instant cell pays nothing — it cannot fail, so it has no price', () => {
  it('completes through the real pipeline, writes its history entry, and grows no Reach', () => {
    const archetype = generateArchetypes(4, 42)[0];
    const preset = MAP_SIZE_PRESETS.small;
    const { state } = initializeGameState(
      archetype, 'growth', createBalancedCosmology(), 42, preset.cols, preset.rows,
    );

    const instant = UNDERTAKING_CELL_TEMPLATES.find(
      t => t.executionMode === 'instant' && t.cellVariant === 'observe' && t.objectTypeId === 'area',
    );
    expect(instant, 'no instant observe cell — the fixture assumption is stale').toBeDefined();

    const before = state.graph.getNode('ind_0')?.properties.domainCapabilities as
      Record<string, number> | undefined;
    expect(before, 'ind_0 carries no domainCapabilities — the fixture would prove nothing').toBeDefined();
    // The writer *would* answer for this template if it were called — so the arm below
    // is about the call site, not about a template the rider cannot read.
    expect(leaningReachOf(instant), 'the instant cell leans on no Reach').toBeDefined();

    const started = startUndertakingForReview(state, state.graph, 'ind_0', instant!.id);
    expect(started.ok, started.message).toBe(true);

    const entry = started.strategicState?.history.find(
      h => h.actorId === 'ind_0' && h.templateId === instant!.id,
    );
    expect(entry, 'no history entry for the instant cell').toBeDefined();
    expect(entry!.outcome).toBe('completed');
    expect(entry!.capabilityGrowth, 'an instant cell paid the rider — the farm is back').toBeUndefined();

    const after = state.graph.getNode('ind_0')!.properties.domainCapabilities as Record<string, number>;
    for (const reach of REACH_DOMAINS) {
      expect(after[reach], `${reach} moved on a free instant work`).toBe(before![reach]);
    }
  });
});
