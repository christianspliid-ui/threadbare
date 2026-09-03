// @vitest-lane heavy — builds a world and drives it 60 ticks (THR-1384)
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
  getArtifactCategoryArtUrl,
  getAttachmentArtUrl,
} from '../artifact-category-art';
import { ITEM_ART } from '../item-art-registry';

/** Seed shared with the CLI smoke path, so a failure here reproduces there. */
const TEST_SEED = 42;

/** Node types that `deriveKind` maps to the `artifact` visual kind. */
const ARTIFACT_NODE_TYPES = ['artifact', 'artifact_legendary'] as const;

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

  it('no longer resolves the retired off-union aliases', () => {
    // THR-857 rewrote the five content sites to canonical values and deleted the
    // alias map. Asserting the *absence* is the point: while aliasing existed, a
    // new off-union value could be made to render by adding a row here, which is
    // how a second vocabulary grows. These must now read as unknown.
    for (const retired of ['talisman', 'charm', 'intelligence']) {
      expect(getArtifactCategoryArtUrl(retired), retired).toBeNull();
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

  it('leaves no artifact node without a subcategory at all', () => {
    // Was `<= 2` until THR-857. The two were `artifact_0` and its reward-instance
    // clone, both minted by `seedWorld` with no category to key on — so a
    // world-legendary rendered blank and slotted as `uncategorized`. `seedWorld`
    // now assigns from `ARTIFACT_SUBCATEGORY`, so the allowance is zero and a
    // producer that starts emitting category-less items fails here rather than
    // being absorbed by a tolerance.
    const noSubcategory = artifactNodes.filter(
      n => (n.properties?.subcategory as string | undefined) === undefined,
    );
    expect(noSubcategory.map(n => n.id)).toEqual([]);
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
