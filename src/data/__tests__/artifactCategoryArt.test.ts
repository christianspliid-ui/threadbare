/**
 * Artifact category art (THR-638, artifact batch).
 *
 * The load-bearing test here is the last describe block, and its population is a
 * **seeded world**, not this module's own table. Batch 2 of this ticket shipped a
 * coverage test whose population was the authored faction-definition table; it
 * stayed green while the live surface rendered an empty shell, because ~3/4 of
 * the factions a player can open were procedurally generated and invisible to
 * the table (impediment #295). Asserting over `ARTIFACT_CATEGORY_ART`'s own keys
 * would repeat that mistake exactly — it can only ever prove the object equals
 * itself. So the world is initialized, ticked, and every artifact node it
 * actually holds is required to resolve.
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { initializeGameState } from '../../engine/gameInit';
import { runTick } from '../../engine/orchestrator';
import { generateArchetypes } from '../../engine/ascendant';
import { createBalancedCosmology } from '../../engine/cosmology';
import { POSSESSION_SUBCATEGORIES } from '../../types/attachments';
import type { GameState } from '../../types/gameState';
import {
  ARTIFACT_CATEGORY_ART,
  CATEGORY_REACH_TINT,
  SUBCATEGORY_ART_ALIASES,
  getArtifactCategoryArtUrl,
  getAttachmentArtUrl,
} from '../artifact-category-art';
import { ITEM_ART } from '../item-art-registry';

/** Seed shared with the CLI smoke path, so a failure here reproduces there. */
const TEST_SEED = 42;

/** Node types that `deriveKind` maps to the `artifact` visual kind. */
const ARTIFACT_NODE_TYPES = ['artifact', 'artifact_legendary', 'resource'] as const;

describe('artifact category art — registry', () => {
  it('registers a plate for every canonical possession subcategory', () => {
    // toEqual, not a length check: a count cap passes when the SET drifts.
    expect(Object.keys(ARTIFACT_CATEGORY_ART).sort()).toEqual(
      [...POSSESSION_SUBCATEGORIES].sort(),
    );
  });

  it('ships every registered plate as a real file on disk', () => {
    // A path string proves nothing — the plate has to exist, or the surface
    // renders a broken <img> and the registry test still passes.
    for (const [subcategory, path] of Object.entries(ARTIFACT_CATEGORY_ART)) {
      const onDisk = join(process.cwd(), 'public', path);
      expect(existsSync(onDisk), `${subcategory} -> ${path}`).toBe(true);
    }
  });

  it('documents a reach tint for every plate', () => {
    expect(Object.keys(CATEGORY_REACH_TINT).sort()).toEqual(
      [...POSSESSION_SUBCATEGORIES].sort(),
    );
  });

  it('gives each category a distinct plate so categories separate at a glance', () => {
    const paths = Object.values(ARTIFACT_CATEGORY_ART);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('artifact category art — resolution', () => {
  it('resolves a canonical subcategory to its own plate', () => {
    expect(getArtifactCategoryArtUrl('arms')).toBe(ARTIFACT_CATEGORY_ART.arms);
    expect(getArtifactCategoryArtUrl('provisions')).toBe(ARTIFACT_CATEGORY_ART.provisions);
  });

  it('resolves each off-union stray through the alias map', () => {
    // These three values are written by live content but are not members of
    // PossessionSubcategory (THR-857). Without aliasing they render blank.
    for (const [alias, canonical] of Object.entries(SUBCATEGORY_ART_ALIASES)) {
      expect(getArtifactCategoryArtUrl(alias), alias).toBe(ARTIFACT_CATEGORY_ART[canonical]);
    }
  });

  it('returns null rather than throwing for absent or unknown subcategories', () => {
    expect(getArtifactCategoryArtUrl(undefined)).toBeNull();
    expect(getArtifactCategoryArtUrl(null)).toBeNull();
    expect(getArtifactCategoryArtUrl('')).toBeNull();
    expect(getArtifactCategoryArtUrl('not_a_subcategory')).toBeNull();
  });

  it('prefers a bespoke plate over the category plate', () => {
    // Hollowfang is `arms` AND has its own painting — the bespoke one must win.
    const bespoke = getAttachmentArtUrl('first_hollowfang', 'arms');
    expect(bespoke).toBe(ITEM_ART.first_hollowfang);
    expect(bespoke).not.toBe(ARTIFACT_CATEGORY_ART.arms);
  });

  it('falls back to the category plate for an item with no bespoke art', () => {
    expect(getAttachmentArtUrl('some_generated_item_id', 'vestments'))
      .toBe(ARTIFACT_CATEGORY_ART.vestments);
  });

  it('resolves a bespoke plate from an instance id suffix', () => {
    expect(getAttachmentArtUrl('reward_npc_30_0_reward_arms_hollowfang', 'arms'))
      .toBe(ITEM_ART.reward_arms_hollowfang);
  });

  it('returns null when neither id nor subcategory resolves', () => {
    expect(getAttachmentArtUrl(undefined, undefined)).toBeNull();
    expect(getAttachmentArtUrl('', null)).toBeNull();
  });
});

describe('artifact category art — coverage against a seeded world', () => {
  // One world, ticked far enough for the reward pipeline to mint procedural
  // items (the ones no per-item registry could ever cover).
  const archetype = generateArchetypes(4, TEST_SEED)[0];
  const { state: initial } = initializeGameState(
    archetype,
    'Test Avatar',
    createBalancedCosmology(),
    TEST_SEED,
  );
  let state: GameState = initial;
  for (let i = 0; i < 60; i++) state = runTick(state);

  const artifactNodes = ARTIFACT_NODE_TYPES.flatMap(t => state.graph.getNodesByType(t));

  it('finds artifact nodes to assert over (guards against a vacuous pass)', () => {
    // Without this, every assertion below would pass over an empty array.
    expect(artifactNodes.length).toBeGreaterThan(50);
  });

  it('resolves art for every artifact node that carries a known subcategory', () => {
    const unresolved: string[] = [];
    for (const node of artifactNodes) {
      const sub = node.properties?.subcategory as string | undefined;
      if (sub === undefined) continue; // covered by the census test below
      if (getAttachmentArtUrl(node.id, sub) === null) {
        unresolved.push(`${node.id} (subcategory=${sub})`);
      }
    }
    expect(unresolved).toEqual([]);
  });

  it('holds the unresolvable remainder to nodes with no subcategory at all', () => {
    // The honest coverage statement: everything that declares a category gets a
    // plate, and the only blanks left are nodes carrying no category to key on.
    // If this number grows, a producer started emitting subcategory-less items.
    const noSubcategory = artifactNodes.filter(
      n => (n.properties?.subcategory as string | undefined) === undefined,
    );
    expect(noSubcategory.length).toBeLessThanOrEqual(2);
  });

  it('reaches most of the population through the category tier, not the bespoke tier', () => {
    // States the actual shape of the win: bespoke art covers a handful, the
    // category plates carry the rest. If this inverts, the batch stopped mattering.
    const viaCategory = artifactNodes.filter(n => {
      const sub = n.properties?.subcategory as string | undefined;
      return getAttachmentArtUrl(n.id, sub) !== null && getAttachmentArtUrl(n.id, undefined) === null;
    });
    expect(viaCategory.length).toBeGreaterThan(artifactNodes.length / 2);
  });
});
