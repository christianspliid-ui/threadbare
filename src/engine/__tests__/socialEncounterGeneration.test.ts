import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSocialCandidates,
  computeBondModifier,
  computeReputationBondShift,
  STRONG_BOND_THRESHOLD,
  HOSTILE_BOND_THRESHOLD,
  COOPERATIVE_BOND_BOOST,
  RIVAL_BOND_BOOST,
  STRANGER_MODIFIER,
  STRANGER_CURIOSITY_BONUS,
  STRANGER_CURIOSITY_THRESHOLD,
  MAX_SOCIAL_CANDIDATES_PER_AGENT,
  TAVERN_SOCIAL_ENCOUNTER_BOOST,
  SOCIAL_DENSITY_BONUS_PER_AGENT,
  REPUTATION_REACTION_MAX_LEVEL,
  REPUTATION_BOND_SHIFT_SCALE,
  REPUTATION_BOND_SHIFT_MAX,
} from '../socialEncounterGeneration';
import { SOCIAL_ENCOUNTER_TEMPLATES } from '../../data/social-encounter-content';
import { TAVERN_ENCOUNTER_TEMPLATES } from '../../data/tavern-encounter-content';
import { TAVERN_SUBLOCATION_TYPE_ID } from '../sublocation';
import { generateTavernName } from '../../data/tavern-names';
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

function addTavernSublocation(
  g: WorldGraph,
  id: string,
  parentId: string,
  name = 'The Rusty Flagon',
): void {
  g.addNode({
    id,
    type: 'location',
    name,
    properties: {
      sublocationTypeId: TAVERN_SUBLOCATION_TYPE_ID,
      parentLocationId: parentId,
    },
  });
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

  describe('tavern social mechanics', () => {
    it('applies questPriority boost when agent is at a tavern sublocation', () => {
      addLocation(graph, 'town-1', 'town');
      addTavernSublocation(graph, 'tavern-1', 'town-1');
      addAgent(graph, 'agent-a', 'tavern-1');
      addAgent(graph, 'agent-b', 'town-1');

      // Distance matrix scans from parent (town-1) when agent is at tavern
      const dm = makeDistanceMatrix([['town-1', 'town-1', 0]]);
      const candidates = generateSocialCandidates(graph, 'agent-a', 'tavern-1', dm);

      expect(candidates.length).toBeGreaterThan(0);
      // questPriority starts at 1.0 * multiplier; with tavern boost multiplier > 1.0
      const minExpected = 1.0 * (1 + TAVERN_SOCIAL_ENCOUNTER_BOOST);
      for (const c of candidates) {
        expect(c.questPriority).toBeGreaterThanOrEqual(minExpected);
      }
    });

    it('expands colocation to parent location when agent is at tavern', () => {
      addLocation(graph, 'town-1', 'town');
      addTavernSublocation(graph, 'tavern-1', 'town-1');
      addAgent(graph, 'agent-a', 'tavern-1');
      addAgent(graph, 'agent-b', 'town-1'); // at parent, not inside the tavern

      const dm = makeDistanceMatrix([['town-1', 'town-1', 0]]);
      const candidates = generateSocialCandidates(graph, 'agent-a', 'tavern-1', dm);

      // agent-b at the parent location should be visible via colocation expansion
      expect(candidates.length).toBeGreaterThan(0);
      const targetIds = candidates.map(c => c.targetAgentId);
      expect(targetIds).toContain('agent-b');
    });

    it('also sees agents co-present inside the tavern sublocation', () => {
      addLocation(graph, 'town-1', 'town');
      addTavernSublocation(graph, 'tavern-1', 'town-1');
      addAgent(graph, 'agent-a', 'tavern-1');
      addAgent(graph, 'agent-b', 'tavern-1'); // also inside the tavern

      const dm = makeDistanceMatrix([['town-1', 'town-1', 0]]);
      const candidates = generateSocialCandidates(graph, 'agent-a', 'tavern-1', dm);

      expect(candidates.length).toBeGreaterThan(0);
      const targetIds = candidates.map(c => c.targetAgentId);
      expect(targetIds).toContain('agent-b');
    });

    it('sets sublocationId and sublocationTypeId on candidates when at tavern', () => {
      addLocation(graph, 'town-1', 'town');
      addTavernSublocation(graph, 'tavern-1', 'town-1');
      addAgent(graph, 'agent-a', 'tavern-1');
      addAgent(graph, 'agent-b', 'town-1');

      const dm = makeDistanceMatrix([['town-1', 'town-1', 0]]);
      const candidates = generateSocialCandidates(graph, 'agent-a', 'tavern-1', dm);

      expect(candidates.length).toBeGreaterThan(0);
      for (const c of candidates) {
        expect(c.sublocationId).toBe('tavern-1');
        expect(c.sublocationTypeId).toBe(TAVERN_SUBLOCATION_TYPE_ID);
      }
    });

    it('does NOT set sublocationId for agents at a regular location', () => {
      addLocation(graph, 'town-1', 'town');
      addAgent(graph, 'agent-a', 'town-1');
      addAgent(graph, 'agent-b', 'town-1');

      const dm = makeDistanceMatrix([['town-1', 'town-1', 0]]);
      const candidates = generateSocialCandidates(graph, 'agent-a', 'town-1', dm);

      expect(candidates.length).toBeGreaterThan(0);
      for (const c of candidates) {
        expect(c.sublocationId).toBeNull();
        expect(c.sublocationTypeId).toBeNull();
      }
    });

    it('includes tavern templates only when agent is at a tavern', () => {
      addLocation(graph, 'town-1', 'town');
      addTavernSublocation(graph, 'tavern-1', 'town-1');
      addAgent(graph, 'agent-a', 'tavern-1');
      addAgent(graph, 'agent-b', 'town-1');

      const dm = makeDistanceMatrix([['town-1', 'town-1', 0]]);
      const candidates = generateSocialCandidates(graph, 'agent-a', 'tavern-1', dm);

      const tavernTemplateIds = new Set(TAVERN_ENCOUNTER_TEMPLATES.map(t => t.id));
      const hasTavernTemplate = candidates.some(c => tavernTemplateIds.has(c.templateId));
      expect(hasTavernTemplate).toBe(true);
    });

    it('does NOT include tavern templates for agents at a non-tavern location', () => {
      addLocation(graph, 'town-1', 'town');
      addAgent(graph, 'agent-a', 'town-1');
      addAgent(graph, 'agent-b', 'town-1');

      const dm = makeDistanceMatrix([['town-1', 'town-1', 0]]);
      const candidates = generateSocialCandidates(graph, 'agent-a', 'town-1', dm);

      const tavernTemplateIds = new Set(TAVERN_ENCOUNTER_TEMPLATES.map(t => t.id));
      for (const c of candidates) {
        expect(tavernTemplateIds.has(c.templateId)).toBe(false);
      }
    });

    it('social density bonus raises questPriority when more agents are at target', () => {
      addLocation(graph, 'town-1', 'town');
      addTavernSublocation(graph, 'tavern-1', 'town-1');
      addAgent(graph, 'agent-a', 'tavern-1');
      addAgent(graph, 'agent-b', 'town-1');

      const dm = makeDistanceMatrix([['town-1', 'town-1', 0]]);

      // Sparse: 1 agent at town-1 → densityBonus = 0
      const sparseCandidates = generateSocialCandidates(graph, 'agent-a', 'tavern-1', dm);
      const sparseForB = sparseCandidates.filter(c => c.targetAgentId === 'agent-b');
      expect(sparseForB.length).toBeGreaterThan(0);

      // Add two more agents to make it dense: 3 agents at town-1 → densityBonus = 2 * SOCIAL_DENSITY_BONUS_PER_AGENT
      addAgent(graph, 'agent-c', 'town-1');
      addAgent(graph, 'agent-d', 'town-1');

      const denseCandidates = generateSocialCandidates(graph, 'agent-a', 'tavern-1', dm);
      const denseForB = denseCandidates.filter(c => c.targetAgentId === 'agent-b');
      expect(denseForB.length).toBeGreaterThan(0);

      // Dense questPriority should exceed sparse by 2 × SOCIAL_DENSITY_BONUS_PER_AGENT per template
      const expectedBonus = 2 * SOCIAL_DENSITY_BONUS_PER_AGENT;
      expect(denseForB[0].questPriority).toBeCloseTo(
        sparseForB[0].questPriority + expectedBonus,
        5,
      );
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
        expect((tmpl.locationSubtypes ?? []).length).toBeGreaterThan(0);
        expect(tmpl.steps.length).toBeGreaterThanOrEqual(2);
        expect(tmpl.reach).toBeTruthy();
        expect(tmpl.crudType).toBeTruthy();
        expect(tmpl.rarityTier).toBeGreaterThan(0);
        expect(tmpl.motivations.length).toBeGreaterThan(0);
      }
    });

    it('all steps have required fields', () => {
      for (const tmpl of SOCIAL_ENCOUNTER_TEMPLATES) {
        for (const stepOrBranch of tmpl.steps) {
          const step = 'branchOnStep' in stepOrBranch ? stepOrBranch.fallback : stepOrBranch;
          expect(step.reach).toBeTruthy();
          expect(step.difficulty).toBeGreaterThan(0);
          expect(step.duration).toBeTruthy();
          expect((step.duration as { min: number }).min).toBeGreaterThan(0);
          expect(step.narrativeTemplate).toBeTruthy();
        }
      }
    });

    it('all templates target settlement locations', () => {
      const settlements = ['hamlet', 'town', 'city', 'capital'];
      for (const tmpl of SOCIAL_ENCOUNTER_TEMPLATES) {
        const hasSettlement = (tmpl.locationSubtypes ?? []).some(lt =>
          settlements.includes(lt as string),
        );
        expect(hasSettlement).toBe(true);
      }
    });

    it('template IDs are unique', () => {
      const ids = SOCIAL_ENCOUNTER_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('tavern encounter templates content', () => {
    it('contains exactly 10 templates', () => {
      expect(TAVERN_ENCOUNTER_TEMPLATES).toHaveLength(10);
    });

    it('all templates have sublocationTypes containing TAVERN_SUBLOCATION_TYPE_ID', () => {
      for (const tmpl of TAVERN_ENCOUNTER_TEMPLATES) {
        expect(tmpl.sublocationTypes).toBeDefined();
        expect(tmpl.sublocationTypes).toContain(TAVERN_SUBLOCATION_TYPE_ID);
      }
    });

    it('all templates target settlement locations', () => {
      const settlements = ['hamlet', 'town', 'city', 'capital'];
      for (const tmpl of TAVERN_ENCOUNTER_TEMPLATES) {
        const hasSettlement = tmpl.locationTypes.some(lt => settlements.includes(lt));
        expect(hasSettlement).toBe(true);
      }
    });

    it('all templates have required fields', () => {
      for (const tmpl of TAVERN_ENCOUNTER_TEMPLATES) {
        expect(tmpl.id).toBeTruthy();
        expect(tmpl.name).toBeTruthy();
        expect(tmpl.steps.length).toBeGreaterThanOrEqual(1);
        expect(tmpl.reachPrimary).toBeTruthy();
        expect(tmpl.reachSecondary).toBeTruthy();
        expect(tmpl.encounterType).toBeTruthy();
        expect(tmpl.threatRating).toBeTruthy();
        expect(tmpl.motivations.length).toBeGreaterThan(0);
      }
    });

    it('all steps have required fields', () => {
      for (const tmpl of TAVERN_ENCOUNTER_TEMPLATES) {
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

    it('template IDs are unique and all start with "tavern."', () => {
      const ids = TAVERN_ENCOUNTER_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(id.startsWith('tavern.')).toBe(true);
      }
    });
  });

  // ─── Helper for adding reputation traits in tests ──────────────
  function addReputationTrait(
    g: WorldGraph,
    agentId: string,
    traitId: string,
    reactions: Array<{ target: string; effect: string; magnitude: number }>,
    level = 1,
  ): void {
    g.addNode({
      id: traitId,
      type: 'trait',
      name: traitId,
      properties: {
        reputationEffects: {
          reactions,
          encounterGates: { unlocks: [], blocks: [] },
          scoringModifiers: {},
          scopeByLevel: [0, 1, 3],
        },
      },
    });
    g.addEdge({
      id: `has-trait-${agentId}-${traitId}`,
      source: agentId,
      target: traitId,
      type: 'has_trait',
      properties: { level },
    });
  }

  describe('computeReputationBondShift', () => {
    it('returns 0 when target has no traits', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      expect(computeReputationBondShift(graph, 'a')).toBe(0);
    });

    it('returns 0 when target traits have no reputationEffects', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addTraitWithEye(graph, 'a', 5); // Eye mastery — no reputationEffects
      expect(computeReputationBondShift(graph, 'a')).toBe(0);
    });

    it('returns positive shift for positive-valence reactions (approach)', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      // 1 approach reaction with magnitude 0.5 at level 1
      // raw = 0.5 * 1.0 * (1/3) ≈ 0.167; scaled = 0.167 * 0.2 ≈ 0.033
      addReputationTrait(graph, 'a', 'rep-trait-pos', [
        { target: 'commoner', effect: 'approach', magnitude: 0.5 },
      ], 1);
      expect(computeReputationBondShift(graph, 'a')).toBeGreaterThan(0);
    });

    it('returns negative shift for negative-valence reactions (flee)', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addReputationTrait(graph, 'a', 'rep-trait-neg', [
        { target: 'commoner', effect: 'flee', magnitude: 0.5 },
      ], 1);
      expect(computeReputationBondShift(graph, 'a')).toBeLessThan(0);
    });

    it('scales with trait level — level 3 produces larger shift than level 1', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');

      addReputationTrait(graph, 'a', 'rep-trait-a', [
        { target: 'commoner', effect: 'approach', magnitude: 1.0 },
      ], 1);
      addReputationTrait(graph, 'b', 'rep-trait-b', [
        { target: 'commoner', effect: 'approach', magnitude: 1.0 },
      ], 3);

      const shiftLevel1 = computeReputationBondShift(graph, 'a');
      const shiftLevel3 = computeReputationBondShift(graph, 'b');
      expect(shiftLevel3).toBeGreaterThan(shiftLevel1);
    });

    it('level 3 shift is exactly 3× level 1 shift (linear scaling)', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');

      // Single reaction so no clamping interference
      addReputationTrait(graph, 'a', 'rep-trait-a', [
        { target: 'commoner', effect: 'approach', magnitude: 0.1 },
      ], 1);
      addReputationTrait(graph, 'b', 'rep-trait-b', [
        { target: 'commoner', effect: 'approach', magnitude: 0.1 },
      ], REPUTATION_REACTION_MAX_LEVEL);

      const shiftLevel1 = computeReputationBondShift(graph, 'a');
      const shiftLevelMax = computeReputationBondShift(graph, 'b');
      expect(shiftLevelMax).toBeCloseTo(shiftLevel1 * REPUTATION_REACTION_MAX_LEVEL, 5);
    });

    it('clamps to +REPUTATION_BOND_SHIFT_MAX when reactions are extremely positive', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      // Many high-magnitude positive reactions at max level → raw sum will be large
      addReputationTrait(graph, 'a', 'rep-trait-huge', [
        { target: 'commoner', effect: 'approach', magnitude: 1.0 },
        { target: 'merchant', effect: 'approach', magnitude: 1.0 },
        { target: 'guard', effect: 'approach', magnitude: 1.0 },
        { target: 'scholar', effect: 'reverence', magnitude: 1.0 },
        { target: 'priest', effect: 'reverence', magnitude: 1.0 },
      ], REPUTATION_REACTION_MAX_LEVEL);
      expect(computeReputationBondShift(graph, 'a')).toBe(REPUTATION_BOND_SHIFT_MAX);
    });

    it('clamps to -REPUTATION_BOND_SHIFT_MAX when reactions are extremely negative', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addReputationTrait(graph, 'a', 'rep-trait-huge-neg', [
        { target: 'commoner', effect: 'flee', magnitude: 1.0 },
        { target: 'merchant', effect: 'flee', magnitude: 1.0 },
        { target: 'guard', effect: 'hostility', magnitude: 1.0 },
        { target: 'scholar', effect: 'hostility', magnitude: 1.0 },
        { target: 'priest', effect: 'flee', magnitude: 1.0 },
      ], REPUTATION_REACTION_MAX_LEVEL);
      expect(computeReputationBondShift(graph, 'a')).toBe(-REPUTATION_BOND_SHIFT_MAX);
    });

    it('level 3 shift = raw × REPUTATION_BOND_SHIFT_SCALE (before clamping)', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      // Single reaction: magnitude 0.1, valence +1 (approach), level max
      // raw = 0.1 * 1.0 * 1.0 = 0.1; scaled = 0.1 * REPUTATION_BOND_SHIFT_SCALE
      addReputationTrait(graph, 'a', 'rep-trait-scale', [
        { target: 'commoner', effect: 'approach', magnitude: 0.1 },
      ], REPUTATION_REACTION_MAX_LEVEL);
      const expected = 0.1 * REPUTATION_BOND_SHIFT_SCALE;
      expect(computeReputationBondShift(graph, 'a')).toBeCloseTo(expected, 5);
    });
  });

  describe('computeBondModifier — reputation integration', () => {
    it('stranger baseline includes positive reputation shift from beloved target', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');
      // b is beloved: approach with magnitude 1.0 at max level
      addReputationTrait(graph, 'b', 'rep-beloved', [
        { target: 'commoner', effect: 'approach', magnitude: 1.0 },
      ], REPUTATION_REACTION_MAX_LEVEL);

      const modifier = computeBondModifier(graph, 'a', 'b');
      const expectedShift = 1.0 * REPUTATION_BOND_SHIFT_SCALE; // 0.2
      expect(modifier).toBeCloseTo(STRANGER_MODIFIER + expectedShift, 5);
    });

    it('stranger baseline includes negative reputation shift from feared target', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');
      addReputationTrait(graph, 'b', 'rep-feared', [
        { target: 'commoner', effect: 'flee', magnitude: 1.0 },
      ], REPUTATION_REACTION_MAX_LEVEL);

      const modifier = computeBondModifier(graph, 'a', 'b');
      const expectedShift = -1.0 * REPUTATION_BOND_SHIFT_SCALE; // -0.2
      expect(modifier).toBeCloseTo(STRANGER_MODIFIER + expectedShift, 5);
    });

    it('strong trust ignores reputation shift — cooperative boost unchanged', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');
      addRelatesTo(graph, 'a', 'b', STRONG_BOND_THRESHOLD + 0.1);
      // b has extremely negative reputation — but trust is strong
      addReputationTrait(graph, 'b', 'rep-feared-strong', [
        { target: 'commoner', effect: 'flee', magnitude: 1.0 },
        { target: 'guard', effect: 'hostility', magnitude: 1.0 },
      ], REPUTATION_REACTION_MAX_LEVEL);

      expect(computeBondModifier(graph, 'a', 'b')).toBe(COOPERATIVE_BOND_BOOST);
    });

    it('hostile trust ignores reputation shift — rival boost unchanged', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');
      addRelatesTo(graph, 'a', 'b', HOSTILE_BOND_THRESHOLD - 0.1);
      // b has extremely positive reputation — but trust is hostile
      addReputationTrait(graph, 'b', 'rep-beloved-hostile', [
        { target: 'commoner', effect: 'approach', magnitude: 1.0 },
        { target: 'merchant', effect: 'reverence', magnitude: 1.0 },
      ], REPUTATION_REACTION_MAX_LEVEL);

      expect(computeBondModifier(graph, 'a', 'b')).toBe(RIVAL_BOND_BOOST);
    });

    it('weak bond with no reputation returns 0', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');
      // Weak trust (above hostile, below strong, non-zero)
      addRelatesTo(graph, 'a', 'b', 0.3);

      expect(computeBondModifier(graph, 'a', 'b')).toBe(0);
    });

    it('weak bond uses reputation shift when target has reputation traits', () => {
      addLocation(graph, 'loc-1', 'town');
      addAgent(graph, 'a', 'loc-1');
      addAgent(graph, 'b', 'loc-1');
      addRelatesTo(graph, 'a', 'b', 0.3);
      addReputationTrait(graph, 'b', 'rep-weak-bond', [
        { target: 'commoner', effect: 'approach', magnitude: 1.0 },
      ], REPUTATION_REACTION_MAX_LEVEL);

      const expectedShift = 1.0 * REPUTATION_BOND_SHIFT_SCALE;
      expect(computeBondModifier(graph, 'a', 'b')).toBeCloseTo(expectedShift, 5);
    });
  });

  describe('generateTavernName', () => {
    it('returns a non-empty string starting with "The "', () => {
      const rng = () => 0.5;
      const name = generateTavernName(rng);
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
      expect(name.startsWith('The ')).toBe(true);
    });

    it('returns deterministic result for the same RNG sequence', () => {
      const constant = () => 0.42;
      const name1 = generateTavernName(constant);
      const name2 = generateTavernName(constant);
      expect(name1).toBe(name2);
    });

    it('uses culture-specific vocabulary when culture is recognized', () => {
      const rng = () => 0;
      const genericName = generateTavernName(rng, undefined);
      const northernName = generateTavernName(rng, 'northern-culture');
      // With rng always returning 0, picks first element of each pool
      // Generic first adj: 'Rusty', Northern first adj: 'Frosted'
      expect(genericName).not.toBe(northernName);
    });

    it('falls back to generic pool for unrecognized culture IDs', () => {
      const rng = () => 0;
      const name = generateTavernName(rng, 'unknown-culture-xyz');
      // Should not throw and should return a valid name
      expect(name.startsWith('The ')).toBe(true);
    });
  });
});
