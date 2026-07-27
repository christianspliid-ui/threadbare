/**
 * THR-809 — encounter-owned trait definitions must be an invariant of every
 * world graph, present at construction rather than minted by a tick phase.
 *
 * The defect these tests pin: `MASTERY_TRAIT_DEFINITIONS` +
 * `CONDITION_TRAIT_DEFINITIONS` reached the graph only via
 * `phaseEncounterTraits.ensureTraitNodes`, called from inside the orchestrator's
 * loop over the legacy `state.encounterProgress` collection — which the
 * unified-action pipeline never populates. The loop body never ran, so
 * `trait.condition.wounded` did not exist and every `condition_attachment`
 * effect naming it took the `template_missing` fail-soft branch.
 *
 * Assertions read the *shipped* definition arrays, never a hand-copied id list,
 * so they cannot go vacuous when a definition is added or renamed.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { seedWorld } from '../worldSeed';
import {
  seedEncounterTraitDefinitions,
  ENCOUNTER_TRAIT_DEFINITIONS,
} from '../traitDefinitionSeeding';
import { MASTERY_TRAIT_DEFINITIONS } from '../../data/mastery-trait-content';
import { CONDITION_TRAIT_DEFINITIONS } from '../../data/condition-trait-content';
import type { CosmologyProfile, HexTile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

// ─── Fixtures ──────────────────────────────────────────────────────

/** Flat per-sphere weights, built from SPHERE_NAMES so a new sphere cannot silently omit a key. */
function balancedCosmology(): CosmologyProfile {
  return Object.fromEntries(
    SPHERE_NAMES.map(s => [s, 1 / SPHERE_NAMES.length]),
  ) as CosmologyProfile;
}

/** A small but non-degenerate map — enough terrain variety for seedWorld to place settlements. */
function tinyTiles(): HexTile[] {
  const terrains = ['plains', 'forest', 'hills', 'mountains'] as const;
  const tiles: HexTile[] = [];
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 6; row++) {
      tiles.push({
        coord: { col, row },
        terrain: terrains[(col + row) % terrains.length],
        elevation: 0.4,
        explored: true,
      } as unknown as HexTile);
    }
  }
  return tiles;
}

// ─── Definition-array integrity ────────────────────────────────────

describe('ENCOUNTER_TRAIT_DEFINITIONS', () => {
  it('covers both shipped families with no id collisions', () => {
    expect(MASTERY_TRAIT_DEFINITIONS.length).toBeGreaterThan(0);
    expect(CONDITION_TRAIT_DEFINITIONS.length).toBeGreaterThan(0);
    expect(ENCOUNTER_TRAIT_DEFINITIONS).toHaveLength(
      MASTERY_TRAIT_DEFINITIONS.length + CONDITION_TRAIT_DEFINITIONS.length,
    );

    const ids = ENCOUNTER_TRAIT_DEFINITIONS.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('declares every node as a trait node', () => {
    for (const node of ENCOUNTER_TRAIT_DEFINITIONS) {
      expect(node.type).toBe('trait');
    }
  });
});

// ─── The invariant: present after init, before any encounter ───────

describe('seedWorld — trait definitions present at construction (THR-809)', () => {
  const { graph } = seedWorld(balancedCosmology(), tinyTiles(), 42);

  it('carries every mastery + condition definition with zero ticks run', () => {
    const missing = ENCOUNTER_TRAIT_DEFINITIONS
      .filter(def => !graph.getNode(def.id))
      .map(def => def.id);

    // Named, not counted — a failure says which definitions are absent.
    expect(missing).toEqual([]);
  });

  it('resolves trait.condition.wounded — the id the tavern brawl points at', () => {
    // The specific node whose absence made `condition_attachment` no-op.
    const wounded = graph.getNode('trait.condition.wounded');
    expect(wounded).toBeDefined();
    expect(wounded?.type).toBe('trait');
  });

  it('preserves each definition’s authored properties', () => {
    for (const def of ENCOUNTER_TRAIT_DEFINITIONS) {
      const node = graph.getNode(def.id);
      expect(node?.name).toBe(def.name);
      expect(node?.properties.subcategory).toBe(def.properties.subcategory);
    }
  });
});

// ─── Per-node seeding, not a first-node short-circuit ──────────────

describe('seedEncounterTraitDefinitions', () => {
  it('adds every definition to an empty graph', () => {
    const graph = new WorldGraph();
    const added = seedEncounterTraitDefinitions(graph);

    expect(added).toBe(ENCOUNTER_TRAIT_DEFINITIONS.length);
    for (const def of ENCOUNTER_TRAIT_DEFINITIONS) {
      expect(graph.getNode(def.id)).toBeDefined();
    }
  });

  it('is idempotent — a second call adds nothing and throws nothing', () => {
    const graph = new WorldGraph();
    seedEncounterTraitDefinitions(graph);

    // addNode throws on duplicate ids, so a non-idempotent implementation fails loudly here.
    expect(() => seedEncounterTraitDefinitions(graph)).not.toThrow();
    expect(seedEncounterTraitDefinitions(graph)).toBe(0);
  });

  it('completes a partially seeded graph instead of skipping it', () => {
    // This is the regression the old `allDefs[0]` guard could not survive: the
    // first id is a *mastery* node, and any foreign path minting it caused the
    // remaining definitions — including every condition — to be skipped forever.
    const graph = new WorldGraph();
    const first = ENCOUNTER_TRAIT_DEFINITIONS[0];
    graph.addNode(first);

    const added = seedEncounterTraitDefinitions(graph);

    expect(added).toBe(ENCOUNTER_TRAIT_DEFINITIONS.length - 1);
    const missing = ENCOUNTER_TRAIT_DEFINITIONS
      .filter(def => !graph.getNode(def.id))
      .map(def => def.id);
    expect(missing).toEqual([]);
  });
});
