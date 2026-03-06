/**
 * Tests for mandate content data structure and integrity.
 *
 * Validates:
 * - All 9 templates present
 * - Correct distribution: 3 per type (graph_state, sphere_dominance, narrative)
 * - 3-stage structure with proper ordering
 * - At least 1 condition per stage
 * - All templates have sphere affinities
 * - No conditions use 'custom' type
 */

import { describe, it, expect } from 'vitest';
import { MANDATE_TEMPLATES } from '../../data/mandate-content';
import type { MandateType, MandateStage, MandateCondition } from '../../types/mandate';
import type { SphereName } from '../../types/index';

describe('Mandate Content Data', () => {
  // ─────────────────────────────────────────────────────────────
  // Template Presence and Count
  // ─────────────────────────────────────────────────────────────

  it('exports exactly 9 mandate templates', () => {
    expect(MANDATE_TEMPLATES).toHaveLength(9);
  });

  it('has 3 graph_state mandates', () => {
    const graphState = MANDATE_TEMPLATES.filter((t) => t.type === 'graph_state');
    expect(graphState).toHaveLength(3);
  });

  it('has 3 sphere_dominance mandates', () => {
    const sphereDominance = MANDATE_TEMPLATES.filter((t) => t.type === 'sphere_dominance');
    expect(sphereDominance).toHaveLength(3);
  });

  it('has 3 narrative mandates', () => {
    const narrative = MANDATE_TEMPLATES.filter((t) => t.type === 'narrative');
    expect(narrative).toHaveLength(3);
  });

  // ─────────────────────────────────────────────────────────────
  // Stage Structure and Ordering
  // ─────────────────────────────────────────────────────────────

  it('every template has exactly 3 stages in correct order', () => {
    const expectedOrder: MandateStage[] = ['setup', 'escalation', 'culmination'];

    MANDATE_TEMPLATES.forEach((template) => {
      expect(template.stages).toHaveLength(3);
      template.stages.forEach((stage, idx) => {
        expect(stage.stage).toBe(expectedOrder[idx]);
      });
    });
  });

  it('every stage has at least 1 condition', () => {
    MANDATE_TEMPLATES.forEach((template) => {
      template.stages.forEach((stage) => {
        expect(stage.conditions.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Condition Validation
  // ─────────────────────────────────────────────────────────────

  it('no conditions use the "custom" type', () => {
    MANDATE_TEMPLATES.forEach((template) => {
      template.stages.forEach((stage) => {
        stage.conditions.forEach((condition) => {
          expect(condition.type).not.toBe('custom');
        });
      });
    });
  });

  it('all conditions use valid mechanically verifiable types', () => {
    const validTypes = ['node_count', 'edge_count', 'sphere_weight', 'actor_tier'];

    MANDATE_TEMPLATES.forEach((template) => {
      template.stages.forEach((stage) => {
        stage.conditions.forEach((condition) => {
          expect(validTypes).toContain(condition.type);
        });
      });
    });
  });

  it('every condition has a description', () => {
    MANDATE_TEMPLATES.forEach((template) => {
      template.stages.forEach((stage) => {
        stage.conditions.forEach((condition) => {
          expect(condition.description).toBeTruthy();
          expect(typeof condition.description).toBe('string');
        });
      });
    });
  });

  it('every condition has params object', () => {
    MANDATE_TEMPLATES.forEach((template) => {
      template.stages.forEach((stage) => {
        stage.conditions.forEach((condition) => {
          expect(condition.params).toBeDefined();
          expect(typeof condition.params).toBe('object');
        });
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Sphere Affinity Validation
  // ─────────────────────────────────────────────────────────────

  it('every template has sphere affinities', () => {
    MANDATE_TEMPLATES.forEach((template) => {
      expect(template.sphereAffinities).toBeDefined();
      expect(Array.isArray(template.sphereAffinities)).toBe(true);
      expect(template.sphereAffinities.length).toBeGreaterThan(0);
    });
  });

  it('all sphere affinities are valid sphere names', () => {
    const validSpheres: SphereName[] = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];

    MANDATE_TEMPLATES.forEach((template) => {
      template.sphereAffinities.forEach((affinity) => {
        expect(validSpheres).toContain(affinity);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Graph-State Mandate Specifics
  // ─────────────────────────────────────────────────────────────

  it('graph_state mandates do not have targetSphere set', () => {
    const graphState = MANDATE_TEMPLATES.filter((t) => t.type === 'graph_state');
    graphState.forEach((template) => {
      // Graph-state mandates should not define a targetSphere
      expect(template.targetSphere).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Sphere Dominance Mandate Specifics
  // ─────────────────────────────────────────────────────────────

  it('sphere_dominance mandates have targetSphere set', () => {
    const sphereDominance = MANDATE_TEMPLATES.filter((t) => t.type === 'sphere_dominance');
    sphereDominance.forEach((template) => {
      expect(template.targetSphere).toBeDefined();
    });
  });

  it('sphere_dominance targetSphere matches one of their affinities', () => {
    const sphereDominance = MANDATE_TEMPLATES.filter((t) => t.type === 'sphere_dominance');
    sphereDominance.forEach((template) => {
      if (template.targetSphere) {
        expect(template.sphereAffinities).toContain(template.targetSphere);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Individual Template Checks
  // ─────────────────────────────────────────────────────────────

  it('Dominion of Stone has matter and force affinities', () => {
    const template = MANDATE_TEMPLATES.find((t) => t.id === 'mandate.dominion_of_stone');
    expect(template).toBeDefined();
    expect(template?.sphereAffinities).toContain('matter');
    expect(template?.sphereAffinities).toContain('force');
  });

  it("The Builder's Legacy has matter and energy affinities", () => {
    const template = MANDATE_TEMPLATES.find((t) => t.id === 'mandate.builders_legacy');
    expect(template).toBeDefined();
    expect(template?.sphereAffinities).toContain('matter');
    expect(template?.sphereAffinities).toContain('energy');
  });

  it('Web of Allegiance has mind and spirit affinities', () => {
    const template = MANDATE_TEMPLATES.find((t) => t.id === 'mandate.web_of_allegiance');
    expect(template).toBeDefined();
    expect(template?.sphereAffinities).toContain('mind');
    expect(template?.sphereAffinities).toContain('spirit');
  });

  it('Tide of Life has life affinity and targetSphere life', () => {
    const template = MANDATE_TEMPLATES.find((t) => t.id === 'mandate.tide_of_life');
    expect(template).toBeDefined();
    expect(template?.sphereAffinities).toContain('life');
    expect(template?.targetSphere).toBe('life');
  });

  it('The Entropic Cascade has entropy affinity and targetSphere entropy', () => {
    const template = MANDATE_TEMPLATES.find((t) => t.id === 'mandate.entropic_cascade');
    expect(template).toBeDefined();
    expect(template?.sphereAffinities).toContain('entropy');
    expect(template?.targetSphere).toBe('entropy');
  });

  it('Illumination has energy affinity and targetSphere energy', () => {
    const template = MANDATE_TEMPLATES.find((t) => t.id === 'mandate.illumination');
    expect(template).toBeDefined();
    expect(template?.sphereAffinities).toContain('energy');
    expect(template?.targetSphere).toBe('energy');
  });

  it("The Ascendant's Champion has spirit and mind affinities", () => {
    const template = MANDATE_TEMPLATES.find((t) => t.id === 'mandate.ascendants_champion');
    expect(template).toBeDefined();
    expect(template?.sphereAffinities).toContain('spirit');
    expect(template?.sphereAffinities).toContain('mind');
  });

  it('The Devoted Circle has all 8 sphere affinities (universal)', () => {
    const template = MANDATE_TEMPLATES.find((t) => t.id === 'mandate.devoted_circle');
    expect(template).toBeDefined();
    expect(template?.sphereAffinities).toHaveLength(8);
    const spheres: SphereName[] = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
    spheres.forEach((sphere) => {
      expect(template?.sphereAffinities).toContain(sphere);
    });
  });

  it('The Shadow Sovereign has time and entropy affinities', () => {
    const template = MANDATE_TEMPLATES.find((t) => t.id === 'mandate.shadow_sovereign');
    expect(template).toBeDefined();
    expect(template?.sphereAffinities).toContain('time');
    expect(template?.sphereAffinities).toContain('entropy');
  });

  // ─────────────────────────────────────────────────────────────
  // Condition Type Specificity
  // ─────────────────────────────────────────────────────────────

  it('graph_state mandates use node_count and edge_count conditions', () => {
    const graphState = MANDATE_TEMPLATES.filter((t) => t.type === 'graph_state');
    const validTypes = new Set(['node_count', 'edge_count']);

    graphState.forEach((template) => {
      template.stages.forEach((stage) => {
        stage.conditions.forEach((condition) => {
          expect(validTypes.has(condition.type)).toBe(true);
        });
      });
    });
  });

  it('sphere_dominance mandates use sphere_weight conditions', () => {
    const sphereDominance = MANDATE_TEMPLATES.filter((t) => t.type === 'sphere_dominance');

    sphereDominance.forEach((template) => {
      template.stages.forEach((stage) => {
        stage.conditions.forEach((condition) => {
          expect(condition.type).toBe('sphere_weight');
        });
      });
    });
  });

  it('narrative mandates use actor_tier conditions', () => {
    const narrative = MANDATE_TEMPLATES.filter((t) => t.type === 'narrative');

    narrative.forEach((template) => {
      template.stages.forEach((stage) => {
        stage.conditions.forEach((condition) => {
          expect(condition.type).toBe('actor_tier');
        });
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Template Metadata Integrity
  // ─────────────────────────────────────────────────────────────

  it('all templates have unique IDs', () => {
    const ids = MANDATE_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all templates have names and descriptions', () => {
    MANDATE_TEMPLATES.forEach((template) => {
      expect(template.name).toBeTruthy();
      expect(typeof template.name).toBe('string');
      expect(template.description).toBeTruthy();
      expect(typeof template.description).toBe('string');
    });
  });

  it('all stages have descriptions', () => {
    MANDATE_TEMPLATES.forEach((template) => {
      template.stages.forEach((stage) => {
        expect(stage.description).toBeTruthy();
        expect(typeof stage.description).toBe('string');
      });
    });
  });
});
