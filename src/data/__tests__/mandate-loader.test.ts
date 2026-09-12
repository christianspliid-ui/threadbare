import { describe, it, expect } from 'vitest';
import { loadMandateTemplates, validateMandateJson } from '../mandate-loader';
import type { SphereName } from '../../types/index';
import { assertNoDuplicateIds } from '../../testing/contentInvariants';

const VALID_CONDITION_TYPES = ['node_count', 'edge_count', 'sphere_weight', 'actor_tier'];
const VALID_STAGES = ['setup', 'escalation', 'culmination'];
const VALID_TYPES = ['graph_state', 'narrative', 'sphere_dominance', 'simulation_achievable'];
const VALID_SPHERES: SphereName[] = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
// THR-1198 retired the co-located `prose` block and its loader; milestone prose
// is keyed to the remembrance ids a live game mints and is covered by
// `mandateRemembranceProse.test.ts`.

// contentInvariants sweep v2 (THR-245): kept 1 structural (fixed-enum), replaced 1 growth-tracking

describe('mandate-loader', () => {
  describe('loadMandateTemplates', () => {
    const templates = loadMandateTemplates();

    it('loads template rows with unique mandate ids', () => {
      expect(templates.length).toBeGreaterThan(0);
      assertNoDuplicateIds(templates);
    });

    it('every template has required fields', () => {
      templates.forEach((t) => {
        expect(t.id).toBeTruthy();
        expect(t.type).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.sphereAffinities.length).toBeGreaterThan(0);
        // Fixed mandate stage enum — setup/escalation/culmination.
        expect(t.stages).toHaveLength(VALID_STAGES.length);
      });
    });

    it('every template has valid type', () => {
      templates.forEach((t) => {
        expect(VALID_TYPES).toContain(t.type);
      });
    });

    it('every template has valid sphere affinities', () => {
      templates.forEach((t) => {
        t.sphereAffinities.forEach((s) => {
          expect(VALID_SPHERES).toContain(s);
        });
      });
    });

    it('every stage has correct order', () => {
      templates.forEach((t) => {
        t.stages.forEach((s, i) => {
          expect(s.stage).toBe(VALID_STAGES[i]);
        });
      });
    });

    it('every condition has valid type', () => {
      templates.forEach((t) => {
        t.stages.forEach((s) => {
          s.conditions.forEach((c) => {
            expect(VALID_CONDITION_TYPES).toContain(c.type);
          });
        });
      });
    });

    it('all templates have unique IDs', () => {
      const ids = templates.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('sphere_dominance mandates have targetSphere', () => {
      const sphereDominance = templates.filter((t) => t.type === 'sphere_dominance');
      expect(sphereDominance.length).toBe(3);
      sphereDominance.forEach((t) => {
        expect(t.targetSphere).toBeTruthy();
        expect(VALID_SPHERES).toContain(t.targetSphere);
      });
    });
  });

  describe('validateMandateJson', () => {
    it('rejects JSON missing id', () => {
      expect(() => validateMandateJson({ type: 'graph_state', name: 'X', description: 'X', sphereAffinities: ['life'], stages: [], prose: {} }, 'test.json')).toThrow();
    });

    it('rejects JSON with wrong number of stages', () => {
      expect(() => validateMandateJson({
        id: 'mandate.test', type: 'graph_state', name: 'X', description: 'X',
        sphereAffinities: ['life'],
        stages: [{ stage: 'setup', description: 'x', conditions: [] }],
        prose: { setup_to_escalation: 'x', escalation_to_culmination: 'x', completed: 'x', failed: 'x' },
      }, 'test.json')).toThrow(/3 stages/);
    });

    it('rejects JSON with invalid condition type', () => {
      expect(() => validateMandateJson({
        id: 'mandate.test', type: 'graph_state', name: 'X', description: 'X',
        sphereAffinities: ['life'],
        stages: [
          { stage: 'setup', description: 'x', conditions: [{ type: 'custom', description: 'x', params: {} }] },
          { stage: 'escalation', description: 'x', conditions: [] },
          { stage: 'culmination', description: 'x', conditions: [] },
        ],
        prose: { setup_to_escalation: 'x', escalation_to_culmination: 'x', completed: 'x', failed: 'x' },
      }, 'test.json')).toThrow(/condition type/i);
    });

    it('rejects JSON with invalid sphere affinity', () => {
      expect(() => validateMandateJson({
        id: 'mandate.test', type: 'graph_state', name: 'X', description: 'X',
        sphereAffinities: ['water'],
        stages: [
          { stage: 'setup', description: 'x', conditions: [] },
          { stage: 'escalation', description: 'x', conditions: [] },
          { stage: 'culmination', description: 'x', conditions: [] },
        ],
        prose: { setup_to_escalation: 'x', escalation_to_culmination: 'x', completed: 'x', failed: 'x' },
      }, 'test.json')).toThrow(/sphere/i);
    });

    it('rejects JSON with invalid mandate type', () => {
      expect(() => validateMandateJson({
        id: 'mandate.test', type: 'invalid_type', name: 'X', description: 'X',
        sphereAffinities: ['life'],
        stages: [
          { stage: 'setup', description: 'x', conditions: [] },
          { stage: 'escalation', description: 'x', conditions: [] },
          { stage: 'culmination', description: 'x', conditions: [] },
        ],
        prose: { setup_to_escalation: 'x', escalation_to_culmination: 'x', completed: 'x', failed: 'x' },
      }, 'test.json')).toThrow(/type/i);
    });
  });
});
