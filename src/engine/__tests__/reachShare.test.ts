/**
 * THR-1562 — reach on one scale.
 *
 * Every capability *requirement* reads the reach share (0–1): effective raw score ÷
 * REACH_SHARE_FULL_RAW, capped at 1. These tests pin the function, each read site that
 * moved onto it, and the authored corpus (no raw-scale number can be authored again).
 *
 * Plan: Docs/plans/2026-09-24-thr-1562-reach-on-one-scale.md
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { computeReachShare, computeReachShares } from '../domainCapability';
import { REACH_SHARE_FULL_RAW, AMBITION_MILESTONE_RESCALE, rawToReachShare } from '../../data/reach-share-constants';
import { buildAmbitionAgentSnapshot } from '../ambitionTick';
import { passesEligibility } from '../ambitionSelection';
import {
  AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
} from '../../data/ambition-templates';
import { SPELL_TEMPLATES } from '../../data/spell-templates';
import { checkPrerequisites, canPayCosts } from '../spellActivation';
import { buildPredicateContext, evaluatePredicate } from '../effects/effectPredicates';
import { meetsJoinPrerequisites } from '../encounterFilterPipeline';
import { deriveNudgeCandidates } from '../phaseDivinePremonition';
import { getAllStrategicTemplates } from '../strategicActionCandidates';
import { ARCANE_CIRCLE_DEFINITION } from '../../data/arcane-circle-definition';
import { HOLY_ORDER_DAWN_DEFINITION } from '../../data/holy-order-dawn-definition';
import { TEMPLE_OF_SPHERES_DEFINITION } from '../../data/temple-of-spheres-definition';
import { THIEVES_GUILD_DEFINITION } from '../../data/thieves-guild-definition';
import { UNDERKING_COURT_DEFINITION } from '../../data/underking-court-definition';
import type { AmbitionTemplate, GraphCondition } from '../../types/ambition';
import type { ReachDomain } from '../../types/traits';

function actorGraph(caps: Partial<Record<ReachDomain, number>> | undefined): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'a1', type: 'actor', name: 'Aldis',
    properties: { actorType: 'individual', ...(caps ? { domainCapabilities: caps } : {}) },
  });
  return graph;
}

// ─── The function ───────────────────────────────────────────────

describe('computeReachShare', () => {
  it('reads the base as raw ÷ REACH_SHARE_FULL_RAW', () => {
    expect(REACH_SHARE_FULL_RAW).toBe(40);
    const graph = actorGraph({ iron: 20, gold: 10 });
    expect(computeReachShare(graph, 'a1', 'iron')).toBeCloseTo(0.5);
    expect(computeReachShare(graph, 'a1', 'gold')).toBeCloseTo(0.25);
  });

  it('reads the effective score: a trait and an item both count', () => {
    const graph = actorGraph({ iron: 10 });
    graph.addNode({ id: 'trait.strong', type: 'trait', name: 'Strong', properties: { domainContributions: { iron: 4 } } });
    graph.addEdge({ id: 'e.t', source: 'a1', target: 'trait.strong', type: 'has_trait', properties: { level: 1 } });
    graph.addNode({ id: 'art.blade', type: 'artifact', name: 'Blade', properties: { domainContributions: { iron: 6 } } });
    graph.addEdge({ id: 'e.p', source: 'a1', target: 'art.blade', type: 'possesses', properties: {} });
    expect(computeReachShare(graph, 'a1', 'iron')).toBeCloseTo(20 / 40);
  });

  it('caps at 1', () => {
    expect(computeReachShare(actorGraph({ star: 86 }), 'a1', 'star')).toBe(1);
  });

  it('reads 0 for a node with no capabilities, and for a missing node', () => {
    expect(computeReachShare(actorGraph(undefined), 'a1', 'eye')).toBe(0);
    expect(computeReachShare(actorGraph({}), 'missing', 'eye')).toBe(0);
  });

  it('rawToReachShare fails closed on nonsense', () => {
    expect(rawToReachShare(Number.NaN)).toBe(0);
    expect(rawToReachShare(-5)).toBe(0);
  });

  it('computeReachShares returns all eight reaches', () => {
    const shares = computeReachShares(actorGraph({ veil: 30 }), 'a1');
    expect(Object.keys(shares).sort()).toEqual(['eye', 'gold', 'heart', 'iron', 'shadow', 'star', 'stone', 'veil']);
    expect(shares.veil).toBeCloseTo(0.75);
    expect(shares.iron).toBe(0);
  });
});

// ─── The read sites ─────────────────────────────────────────────

describe('ambition floors read the share (the snapshot converts)', () => {
  const dominateTrade = AMBITION_TEMPLATES.find(t => t.id === 'ambition_dominate_trade')!;

  it('the fixture template has a gold floor (guards against a vacuous test)', () => {
    expect(dominateTrade.reachFloors.gold).toBeGreaterThan(0);
  });

  it('a raw 10 no longer clears every floor — the THR-1562 defect', () => {
    const snap = buildAmbitionAgentSnapshot(actorGraph({ gold: 10, eye: 10 }), 'a1');
    expect(snap.domainCapabilities.gold).toBeCloseTo(0.25);
    expect(passesEligibility(dominateTrade, snap)).toBe(false);
  });

  it('a capable mortal clears it', () => {
    const snap = buildAmbitionAgentSnapshot(actorGraph({ gold: 36, eye: 36 }), 'a1');
    expect(passesEligibility(dominateTrade, snap)).toBe(true);
  });
});

describe('spell prerequisites and the reach_drain check read the share', () => {
  const veilwalk = SPELL_TEMPLATES.find(s => s.id === 'spell_veilwalk')!;

  it('a shipped spell passes its prerequisites for a capable caster', () => {
    expect(veilwalk.prerequisites.minReach?.veil).toBeGreaterThan(0);
    expect(checkPrerequisites(actorGraph({ veil: 30 }), 'a1', veilwalk).met).toBe(true);
  });

  it('and fails for an incapable one', () => {
    expect(checkPrerequisites(actorGraph({ veil: 4 }), 'a1', veilwalk).met).toBe(false);
  });

  it('the reach_drain affordability check passes for a capable caster', () => {
    expect(canPayCosts(actorGraph({ veil: 30 }), 'a1', veilwalk.cost).canPay).toBe(true);
    expect(canPayCosts(actorGraph({ veil: 0 }), 'a1', veilwalk.cost).canPay).toBe(false);
  });
});

describe('the reach_above: predicate reads the share', () => {
  it('the shipped star trickle pays for a capable bearer and not for an incapable one', () => {
    const capable = buildPredicateContext(actorGraph({ star: 20 }), 'a1');
    const incapable = buildPredicateContext(actorGraph({ star: 2 }), 'a1');
    expect(evaluatePredicate('reach_above:star:0.10', capable)).toBe(true);
    expect(evaluatePredicate('reach_above:star:0.10', incapable)).toBe(false);
  });
});

describe('guild joins read the share', () => {
  it('a qualifying mortal is offered the join; an unqualified one is not', () => {
    const prereqs = THIEVES_GUILD_DEFINITION.joinPrerequisites!;
    expect(prereqs.shadow).toBe(0.5);
    // The old raw requirement (20) is kept exactly: raw 20 → share 0.5.
    expect(meetsJoinPrerequisites(actorGraph({ shadow: 20 }), 'a1', prereqs)).toBe(true);
    expect(meetsJoinPrerequisites(actorGraph({ shadow: 19 }), 'a1', prereqs)).toBe(false);
  });
});

describe('the premonition reach bias reads the share', () => {
  it('the 0.1–0.8 window can be entered by a mid-capability mortal', () => {
    const graph = actorGraph({ iron: 16, gold: 40 });
    const agent = graph.getNode('a1')!;
    const state = { tick: 0 } as unknown as GameState;
    const reaches = deriveNudgeCandidates(agent, graph, state)
      .filter(c => c.category === 'reach_bias')
      .map(c => c.targetReach);
    expect(reaches).toContain('iron'); // share 0.4 — inside the window
    expect(reaches).not.toContain('gold'); // share 1.0 — saturated
  });
});

// ─── The authored corpus ────────────────────────────────────────

const ALL_AMBITIONS: readonly AmbitionTemplate[] = [
  ...AMBITION_TEMPLATES,
  ...EVENT_MINTED_AMBITION_TEMPLATES,
  ...GRIEVANCE_AMBITION_TEMPLATES,
];

function reachConditions(t: AmbitionTemplate): GraphCondition[] {
  return [
    ...t.milestones.map(m => m.condition),
    ...t.abandonmentTriggers.map(tr => tr.condition),
  ].filter(c => c.type === 'agent_reach_above' || c.type === 'agent_reach_below');
}

function expectShare(label: string, value: number): void {
  expect(value, `${label} = ${value} is not a reach share (0 < t ≤ 1)`).toBeGreaterThan(0);
  expect(value, `${label} = ${value} is not a reach share (0 < t ≤ 1)`).toBeLessThanOrEqual(1);
}

describe('every authored capability threshold is a reach share (0 < t ≤ 1)', () => {
  it('ambition reachFloors', () => {
    let n = 0;
    for (const t of ALL_AMBITIONS) {
      for (const [reach, v] of Object.entries(t.reachFloors)) { expectShare(`${t.id}.reachFloors.${reach}`, v as number); n++; }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('agent_reach_above / agent_reach_below thresholds', () => {
    let n = 0;
    for (const t of ALL_AMBITIONS) {
      for (const c of reachConditions(t)) {
        if (c.type === 'agent_reach_above' || c.type === 'agent_reach_below') {
          expectShare(`${t.id}.${c.type}.${c.reach}`, c.threshold); n++;
        }
      }
    }
    expect(n).toBeGreaterThan(25);
  });

  it('spell minReach and reach_drain amounts', () => {
    let n = 0;
    for (const s of SPELL_TEMPLATES) {
      for (const [reach, v] of Object.entries(s.prerequisites.minReach ?? {})) { expectShare(`${s.id}.minReach.${reach}`, v as number); n++; }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('guild joinPrerequisites', () => {
    const defs = [ARCANE_CIRCLE_DEFINITION, HOLY_ORDER_DAWN_DEFINITION, TEMPLE_OF_SPHERES_DEFINITION, THIEVES_GUILD_DEFINITION, UNDERKING_COURT_DEFINITION];
    let n = 0;
    for (const d of defs) {
      for (const [reach, v] of Object.entries(d.joinPrerequisites ?? {})) { expectShare(`${d.id}.joinPrerequisites.${reach}`, v as number); n++; }
    }
    expect(n).toBe(6);
  });

  it('strategic reachFloor', () => {
    let n = 0;
    for (const t of getAllStrategicTemplates()) {
      for (const [reach, v] of Object.entries(t.resourceHint?.reachFloor ?? {})) { expectShare(`${t.id}.reachFloor.${reach}`, v as number); n++; }
    }
    expect(n).toBeGreaterThan(0);
  });
});

describe('the abandonment idiom holds on the share', () => {
  it('every agent_reach_below trigger sits below its template floor for that reach', () => {
    let n = 0;
    for (const t of ALL_AMBITIONS) {
      for (const tr of t.abandonmentTriggers) {
        const c = tr.condition;
        if (c.type !== 'agent_reach_below') continue;
        const floor = t.reachFloors[c.reach];
        expect(floor, `${t.id}: reach_below ${c.reach} has no floor — it would fire on assignment`).toBeDefined();
        expect(c.threshold, `${t.id}: trigger ${c.reach} < ${c.threshold} is not below its floor ${floor}`).toBeLessThan(floor as number);
        n++;
      }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('the milestone rescale is recorded (1.25, capped at 1)', () => {
    expect(AMBITION_MILESTONE_RESCALE).toBe(1.25);
    const forge = AMBITION_TEMPLATES.find(t => t.id === 'ambition_forge_legend')!;
    const thresholds = forge.milestones
      .map(m => m.condition)
      .filter((c): c is Extract<GraphCondition, { type: 'agent_reach_above' }> => c.type === 'agent_reach_above')
      .map(c => c.threshold);
    // stone 0.3, veil 0.6, iron 0.7 before THR-1562.
    expect(thresholds).toEqual([0.375, 0.75, 0.875]);
  });
});
