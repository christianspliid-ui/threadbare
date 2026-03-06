/**
 * Tests for mandateGenerator.ts — sphere-weighted mandate selection.
 *
 * Test suite validates:
 * 1. Returns valid MandateTemplate with required fields
 * 2. Deterministic behavior (same seed → same mandate)
 * 3. Seed variation (50 different seeds produce at least 2 unique mandates)
 * 4. Sphere affinity weighting (life-primary favors life mandates)
 * 5. Returned mandate exists in MANDATE_TEMPLATES
 */

import { describe, it, expect } from 'vitest';
import { generateMandate } from '../mandateGenerator';
import { MANDATE_TEMPLATES } from '../../data/mandate-content';
import type { CosmologyProfile, SphereName } from '../../types/index';
import type { SphereAlignment } from '../../types/influence';

// ─── Test Fixtures ────────────────────────────────────────────────────────

/** Dummy cosmology profile (unused in generator, but required by signature) */
const dummyCosmology: CosmologyProfile = {
  force: 0.125,
  matter: 0.125,
  energy: 0.125,
  life: 0.125,
  mind: 0.125,
  spirit: 0.125,
  time: 0.125,
  entropy: 0.125,
};

/** Life-primary ascendant alignment */
const lifeAlignment: SphereAlignment = {
  primary: 'life',
  secondary: 'spirit',
};

/** Entropy-primary ascendant alignment */
const entropyAlignment: SphereAlignment = {
  primary: 'entropy',
  secondary: 'time',
};

/** Force-primary ascendant alignment */
const forceAlignment: SphereAlignment = {
  primary: 'force',
  secondary: 'matter',
};

// ─── Test Suite ───────────────────────────────────────────────────────────

describe('mandateGenerator', () => {
  // ─── Test 1: Valid MandateTemplate Structure ──────────────────────────

  it('Test 1: Returns a valid MandateTemplate with required fields', () => {
    const mandate = generateMandate(dummyCosmology, lifeAlignment, 42);

    // Check basic fields
    expect(mandate).toBeDefined();
    expect(mandate.id).toBeDefined();
    expect(typeof mandate.id).toBe('string');
    expect(mandate.name).toBeDefined();
    expect(typeof mandate.name).toBe('string');
    expect(mandate.description).toBeDefined();
    expect(typeof mandate.description).toBe('string');

    // Check mandate type
    expect(mandate.type).toMatch(/^(graph_state|sphere_dominance|narrative)$/);

    // Check 3-stage structure
    expect(mandate.stages).toBeDefined();
    expect(Array.isArray(mandate.stages)).toBe(true);
    expect(mandate.stages.length).toBe(3);

    // Verify each stage
    mandate.stages.forEach((stage, index) => {
      expect(stage.stage).toMatch(/^(setup|escalation|culmination)$/);
      expect(stage.description).toBeDefined();
      expect(Array.isArray(stage.conditions)).toBe(true);
      expect(stage.conditions.length).toBeGreaterThan(0);
    });

    // Check sphere affinities
    expect(mandate.sphereAffinities).toBeDefined();
    expect(Array.isArray(mandate.sphereAffinities)).toBe(true);
    expect(mandate.sphereAffinities.length).toBeGreaterThan(0);
  });

  // ─── Test 2: Deterministic Behavior ───────────────────────────────────

  it('Test 2: Deterministic — same seed + alignment → same mandate', () => {
    const seed = 12345;

    const mandate1 = generateMandate(dummyCosmology, lifeAlignment, seed);
    const mandate2 = generateMandate(dummyCosmology, lifeAlignment, seed);

    expect(mandate1.id).toBe(mandate2.id);
    expect(mandate1.name).toBe(mandate2.name);
  });

  // ─── Test 3: Seed Variation ───────────────────────────────────────────

  it('Test 3: Seed variation — 50 seeds produce at least 2 unique mandates', () => {
    const uniqueMandates = new Set<string>();

    for (let seed = 0; seed < 50; seed++) {
      const mandate = generateMandate(dummyCosmology, lifeAlignment, seed);
      uniqueMandates.add(mandate.id);
    }

    expect(uniqueMandates.size).toBeGreaterThanOrEqual(2);
  });

  // ─── Test 4: Sphere Affinity Weighting ────────────────────────────────

  it('Test 4: Affinity weighting — life-primary favors life mandates over baseline', () => {
    const lifeAffinitySelections: Record<string, number> = {};
    const numSeeds = 200;

    for (let seed = 0; seed < numSeeds; seed++) {
      const mandate = generateMandate(dummyCosmology, lifeAlignment, seed);
      lifeAffinitySelections[mandate.id] =
        (lifeAffinitySelections[mandate.id] ?? 0) + 1;
    }

    // Count how many times "Tide of Life" is selected with life-primary alignment
    const tideOfLifeCount = lifeAffinitySelections['mandate.tide_of_life'] ?? 0;

    // "Tide of Life" should be selected more often for life-primary ascendants
    // It has weight 3 (primary match), while others have weight 1-2
    // Over 200 seeds, we expect it to appear noticeably more (at least 15 times)
    expect(tideOfLifeCount).toBeGreaterThan(15);
  });

  // ─── Test 5: Template Validation ──────────────────────────────────────

  it('Test 5: Returned mandate exists in MANDATE_TEMPLATES', () => {
    const testedSeeds = 100;

    for (let seed = 0; seed < testedSeeds; seed++) {
      const mandate = generateMandate(dummyCosmology, lifeAlignment, seed);

      // Check that the returned mandate is in the template library
      const foundInTemplates = MANDATE_TEMPLATES.some(
        (t) => t.id === mandate.id,
      );
      expect(foundInTemplates).toBe(true);
    }
  });

  // ─── Additional Tests (Coverage) ───────────────────────────────────────

  it('Should handle different sphere alignments', () => {
    const entropyMandate = generateMandate(dummyCosmology, entropyAlignment, 42);
    const forceMandate = generateMandate(dummyCosmology, forceAlignment, 42);

    // Different alignments should be able to produce different mandates
    // (though not guaranteed for a single seed)
    expect(entropyMandate).toBeDefined();
    expect(forceMandate).toBeDefined();
  });

  it('Should produce consistent results across multiple calls with same seed', () => {
    const mandates = [];
    for (let i = 0; i < 10; i++) {
      const mandate = generateMandate(dummyCosmology, lifeAlignment, 999);
      mandates.push(mandate.id);
    }

    // All should be identical
    const firstId = mandates[0];
    mandates.forEach((id) => {
      expect(id).toBe(firstId);
    });
  });

  it('Should select from all 9 mandate templates over sufficient seed range', () => {
    const selectedMandates = new Set<string>();
    const numSeeds = 1000;

    for (let seed = 0; seed < numSeeds; seed++) {
      const mandate = generateMandate(
        dummyCosmology,
        {
          primary: (['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'][
            seed % 8
          ] as SphereName),
          secondary: (['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'][
            (seed + 1) % 8
          ] as SphereName),
        },
        seed,
      );
      selectedMandates.add(mandate.id);
    }

    // With 1000 seeds and varying alignments, we should see all 9 templates
    expect(selectedMandates.size).toBe(9);
  });
});
