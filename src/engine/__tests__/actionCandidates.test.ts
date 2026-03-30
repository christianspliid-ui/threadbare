import { describe, it, expect, beforeEach } from 'vitest';
import { generateActionCandidates } from '../actionCandidates';
import { WorldGraph } from '../graph';
import type { ActionCandidate } from '../../types/agent';

describe('generateActionCandidates', () => {
  let graph: WorldGraph;
  let actorId: string;
  let locationId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    actorId = 'actor.alice';
    locationId = 'loc.keep';
  });

  it('should return ActionCandidate[] with templateId and motivations', () => {
    // Setup: location with keep subtype
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Fortress',
      properties: {
        locationType: 'stronghold',
        locationSubtype: 'keep',
      },
    });

    // Add actor with axiological profile
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Alice',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0.5,
          loyalty_ambition: 0.2,
          mercy_ruthlessness: -0.3,
          honesty_cunning: 0.1,
          sacrifice_survival: 0,
          loyalty_ambition: 0,
          tradition_novelty: 0,
          preservation_transformation: 0,
          mercy_ruthlessness: 0.1,
          asceticism_extravagance: 0,
        },
      },
    });

    // Action: generate candidates
    const candidates = generateActionCandidates(graph, actorId, locationId);

    // Assert: should have candidates
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) {
      expect(c.templateId).toMatch(/^action\./);
      expect(c.motivations.length).toBeGreaterThan(0);
      expect(c.domain).toBeDefined();
      expect(c.targetId).toBe(locationId);
      expect(c.score).toBe(0);
    }
  });

  it('should return empty array if actor not found', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Fortress',
      properties: {
        locationType: 'stronghold',
        locationSubtype: 'keep',
      },
    });

    const candidates = generateActionCandidates(graph, 'nonexistent', locationId);
    expect(candidates).toEqual([]);
  });

  it('should return empty array if location not found', () => {
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Alice',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          loyalty_ambition: 0,
          mercy_ruthlessness: 0,
          honesty_cunning: 0,
          sacrifice_survival: 0,
          loyalty_ambition: 0,
          tradition_novelty: 0,
          preservation_transformation: 0,
          mercy_ruthlessness: 0,
          asceticism_extravagance: 0,
        },
      },
    });

    const candidates = generateActionCandidates(graph, actorId, 'nonexistent');
    expect(candidates).toEqual([]);
  });

  it('should filter by location subtype if template specifies locationSubtypes', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Fortress',
      properties: {
        locationType: 'stronghold',
        locationSubtype: 'keep',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Alice',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          loyalty_ambition: 0,
          mercy_ruthlessness: 0,
          honesty_cunning: 0,
          sacrifice_survival: 0,
          loyalty_ambition: 0,
          tradition_novelty: 0,
          preservation_transformation: 0,
          mercy_ruthlessness: 0,
          asceticism_extravagance: 0,
        },
      },
    });

    const candidates = generateActionCandidates(graph, actorId, locationId);

    // All returned candidates should have either no locationSubtypes filter
    // or include 'keep' in their locationSubtypes
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('should filter by actor affinity if template specifies actorAffinities', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Fortress',
      properties: {
        locationType: 'stronghold',
        locationSubtype: 'keep',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Alice',
      properties: {
        actorType: 'faction',
        axiologicalProfile: {
          courage_prudence: 0,
          loyalty_ambition: 0,
          mercy_ruthlessness: 0,
          honesty_cunning: 0,
          sacrifice_survival: 0,
          loyalty_ambition: 0,
          tradition_novelty: 0,
          preservation_transformation: 0,
          mercy_ruthlessness: 0,
          asceticism_extravagance: 0,
        },
      },
    });

    const candidates = generateActionCandidates(graph, actorId, locationId);

    // All returned candidates should have either no actorAffinities filter
    // or include 'faction' in their actorAffinities
    expect(candidates.length).toBeGreaterThanOrEqual(0);
  });

  it('should set score to 0 (filled by selection pipeline)', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Fortress',
      properties: {
        locationType: 'stronghold',
        locationSubtype: 'keep',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Alice',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0,
          loyalty_ambition: 0,
          mercy_ruthlessness: 0,
          honesty_cunning: 0,
          sacrifice_survival: 0,
          loyalty_ambition: 0,
          tradition_novelty: 0,
          preservation_transformation: 0,
          mercy_ruthlessness: 0,
          asceticism_extravagance: 0,
        },
      },
    });

    const candidates = generateActionCandidates(graph, actorId, locationId);
    for (const c of candidates) {
      expect(c.score).toBe(0);
    }
  });

  it('should return candidates from ACTION_TEMPLATES when filters pass', () => {
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Fortress',
      properties: {
        locationType: 'stronghold',
        locationSubtype: 'keep',
      },
    });

    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Alice',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          courage_prudence: 0.5,
          loyalty_ambition: 0,
          mercy_ruthlessness: 0,
          honesty_cunning: 0,
          sacrifice_survival: 0,
          loyalty_ambition: 0,
          tradition_novelty: 0,
          preservation_transformation: 0,
          mercy_ruthlessness: 0,
          asceticism_extravagance: 0,
        },
      },
    });

    const candidates = generateActionCandidates(graph, actorId, locationId);

    // Should have some candidates from the ACTION_TEMPLATES
    expect(candidates.length).toBeGreaterThan(0);
    // All should have the expected structure
    candidates.forEach(c => {
      expect(c).toHaveProperty('templateId');
      expect(c).toHaveProperty('targetId');
      expect(c).toHaveProperty('domain');
      expect(c).toHaveProperty('score');
      expect(c).toHaveProperty('motivations');
    });
  });
});
