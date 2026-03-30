import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSocialCandidates,
  computeBondModifier,
  STRONG_BOND_THRESHOLD,
  HOSTILE_BOND_THRESHOLD,
  COOPERATIVE_BOND_BOOST,
  RIVAL_BOND_BOOST,
  STRANGER_MODIFIER,
  STRANGER_CURIOSITY_BONUS,
  STRANGER_CURIOSITY_THRESHOLD,
  MAX_SOCIAL_CANDIDATES_PER_AGENT,
} from '../socialEncounterGeneration';
import { SOCIAL_ENCOUNTER_TEMPLATES } from '../../data/social-encounter-content';
import { WorldGraph } from '../graph';
import type { DistanceMatrix } from '../distanceMatrix';

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgent(g: WorldGraph, id: string, locationId: string): void {
  g.addNode({
    id,
    type: 'actor',
    name: id,
    properties: { actorType: 'individual' },
  });
  g.addEdge({
    id: `located-${id}-${locationId}`,
    source: id,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function addLocation(g: WorldGraph, id: string, locationType: string): void {
  g.addNode({
    id,
    type: 'location',
    name: id,
    properties: { locationType },
  });
}

function addAdjacency(g: WorldGraph, loc1: string, loc2: string): void {
  g.addEdge({
    id: `adj-${loc1}-${loc2}`,
    source: loc1,
    target: loc2,
    type: 'adjacent',
    properties: {},
  });
}

function addRelatesTo(
  g: WorldGraph,
  source: string,
  target: string,
  trust: number,
): void {
  g.addEdge({
    id: `edge-${source}-${target}`,
    source,
    target,
    type: 'relates_to',
    properties: { trust },
  });
}

function addTraitWithEye(
  g: WorldGraph,
  agentId: string,
  eyeContribution: number,
): void {
  const traitId = `trait-eye-${agentId}`;
  g.addNode({
    id: traitId,
    type: 'trait',
    name: 'Eye Mastery',
    properties: { domainContributions: { eye: eyeContribution } },
  });
  g.addEdge({
    id: `has-trait-${agentId}-eye`,
    source: agentId,
    target: traitId,
    type: 'has_trait',
    properties: { level: 1 },
  });
}

function makeDistanceMatrix(
  entries: Array<[string, string, number]>,
): DistanceMatrix {
  const distances = new Map<string, Map<string, number>>();
  for (const [from, to, dist] of entries) {
    if (!distances.has(from)) distances.set(from, new Map());
    distances.get(from)!.set(to, dist);
  }
  return { distances, builtAtTick: 0, locationCount: distances.size };
}

describe('socialEncounterGeneration', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = makeGraph();
  });

  describe('generateSocialCandidates', () => {
    it('generates candidates for agents at the same location', () => {
      addLocation(graph, 'town-1', 'town');
      addAgent(graph, 'agent-a', 'town-1');
      addAgent(graph, 'agent-b', 'town-1');

      const dm = makeDistanceMatrix([['town-1', 'town-1', 0]]);
      const candidates = generateSocialCandidates(
        graph,
        'agent-a',
        'town-1',
        dm,
      );

      expect(candidates.length).toBeGreaterThan(0);
      // All candidates should reference town-1
      for (const c of candidates) {
        expect(c.locationId).toBe('town-1');
      }
    });

    it('generates candidates for agents at adjacent locations', () => {
      addLocation(graph, 'town-1', 'town');
      addLocation(graph, 'town-2', 'town');
      addAdjacency(graph, 'town-1', 'town-2');
      addAgent(graph, 'agent-a', 'town-1');
      addAgent(graph, 'agent-b', 'town-2');

      const dm = makeDistanceMatrix([
        ['town-1', 'town-2', 1],
        ['town-2', 'town-1', 1],
      ]);

      const candidates = generateSocialCandidates(
        graph,
        'agent-a',
        'town-1',
        dm,
      );

      expect(candidates.length).toBeGreaterThan(0);
    });

    it('limits to MAX_SOCIAL_CANDIDATES_PER_AGENT per target', () => {
      addLocation(graph, 'city-1', 'city');
      addAgent(graph, 'agent-a', 'city-1');
      addAgent(graph, 'agent-b', 'city-1');

      const dm = makeDistanceMatrix([['city-1', 'city-1', 0]]);
      const candidates = generateSocialCandidates(
        graph,
        'agent-a',
        'city-1',
        dm,
      );

      // Should not exceed MAX_SOCIAL_CANDIDATES_PER_AGENT per target
      expect(candidates.length).toBeLessThanOrEqual(
        MAX_SOCIAL_CANDIDATES_PER_AGENT,
      );
    });

    it('returns empty when no visible agents exist', () => {
      addLocation(graph, 'town-1', 'town');
      addAgent(graph, 'agent-a', 'town-1');
      // No other agents

      const dm = makeDistanceMatrix([['town-1', 'town-1', 0]]);
      const candidates = generateSocialCandidates(
        graph,
        'agent-a',
        'town-1',
        dm,
      );

      expect(candidates).toEqual([]);
    });

    it('returns empty for missing agent node', () => {
      const dm = makeDistanceMatrix([]);
      const candidates = generateSocialCandidates(
        graph,
        'nonexistent',
        'town-1',
        dm,
      );
      expect(candidates).toEqual([]);
    });
  });

  describe('computeBondModifier', () => {
    it('returns cooperative boost for strong trust', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');
      addRelatesTo(graph, 'a', 'b', STRONG_BOND_THRESHOLD + 0.1);

      expect(computeBondModifier(graph, 'a', 'b')).toBe(COOPERATIVE_BOND_BOOST);
    });

    it('returns rival boost for hostile trust', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');
      addRelatesTo(graph, 'a', 'b', HOSTILE_BOND_THRESHOLD - 0.1);

      expect(computeBondModifier(graph, 'a', 'b')).toBe(RIVAL_BOND_BOOST);
    });

    it('returns stranger modifier for no bond', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');
      // No relates_to edge → trust = 0

      expect(computeBondModifier(graph, 'a', 'b')).toBe(STRANGER_MODIFIER);
    });

    it('adds curiosity bonus for perceptive agent with stranger', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');

      // Give agent-a high Eye capability
      addTraitWithEye(graph, 'a', 30); // High eye → curiosity bonus

      const modifier = computeBondModifier(graph, 'a', 'b');
      expect(modifier).toBeCloseTo(STRANGER_MODIFIER + STRANGER_CURIOSITY_BONUS);
    });
  });

  describe('social encounter templates content', () => {
    it('contains exactly 14 templates', () => {
      expect(SOCIAL_ENCOUNTER_TEMPLATES).toHaveLength(14);
    });

    it('all templates have required fields', () => {
      for (const tmpl of SOCIAL_ENCOUNTER_TEMPLATES) {
        expect(tmpl.id).toBeTruthy();
        expect(tmpl.name).toBeTruthy();
        expect(tmpl.locationTypes.length).toBeGreaterThan(0);
        expect(tmpl.steps.length).toBeGreaterThanOrEqual(2);
        expect(tmpl.reachPrimary).toBeTruthy();
        expect(tmpl.reachSecondary).toBeTruthy();
        expect(tmpl.encounterType).toBeTruthy();
        expect(tmpl.threatRating).toBeTruthy();
        expect(tmpl.motivations.length).toBeGreaterThan(0);
      }
    });

    it('all steps have required fields', () => {
      for (const tmpl of SOCIAL_ENCOUNTER_TEMPLATES) {
        for (const step of tmpl.steps) {
          expect(step.id).toBeTruthy();
          expect(step.name).toBeTruthy();
          expect(step.reach).toBeTruthy();
          expect(step.difficulty).toBeGreaterThan(0);
          expect(step.duration).toBeGreaterThan(0);
          expect(step.narrative).toBeTruthy();
          expect(step.onSuccess).toBeTruthy();
          expect(step.onFailure).toBeTruthy();
        }
      }
    });

    it('all templates target settlement locations', () => {
      const settlements = ['hamlet', 'town', 'city', 'capital'];
      for (const tmpl of SOCIAL_ENCOUNTER_TEMPLATES) {
        const hasSettlement = tmpl.locationTypes.some(lt =>
          settlements.includes(lt),
        );
        expect(hasSettlement).toBe(true);
      }
    });

    it('template IDs are unique', () => {
      const ids = SOCIAL_ENCOUNTER_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
