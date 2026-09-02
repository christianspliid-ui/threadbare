// @vitest-lane heavy — builds a world and drives it 60 ticks (THR-1384)
/**
 * Sublocation category art (THR-638, sublocation batch).
 *
 * Two blocks here are load-bearing, and both exist because of a specific way
 * this ticket has been fooled before.
 *
 * 1. *Coverage against a seeded world.* The population is a ticked world, not
 *    this module's own table. Batch 2 shipped a coverage test whose population
 *    was the authored faction-definition table; it stayed green while the live
 *    surface rendered an empty shell (impediment #295). Asserting over
 *    `SUBLOCATION_TYPE_CATEGORY`'s own keys could only ever prove the object
 *    equals itself.
 *
 * 2. *Agreement with the genome.* `SUBLOCATION_TYPE_CATEGORY` is seeded from the
 *    tags the `settlementGenome` tables already declare. Nothing stops a hand
 *    edit from quietly contradicting the engine, so every type id the genome
 *    tags with exactly one value is pinned to that value. Multi-tag ids are
 *    excluded — those are the art-direction judgment calls.
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { initializeGameState } from '../../engine/gameInit';
import { runTick } from '../../engine/orchestrator';
import { generateArchetypes } from '../../engine/ascendant';
import { createBalancedCosmology } from '../../engine/cosmology';
import { SETTLEMENT_INFRASTRUCTURE } from '../../engine/settlementGenome/infrastructure';
import { CULTURE_BASELINE_MAP } from '../../engine/settlementGenome/cultureBaseline';
import { SPHERE_SUBLOCATION_MENU } from '../../engine/settlementGenome/sphereMenu';
import { REACH_SUBLOCATION_MENU } from '../../engine/settlementGenome/reachMenu';
import type { SublocationContribution } from '../../engine/settlementGenome/types';
import type { GameState } from '../../types/gameState';
import {
  SUBLOCATION_CATEGORY_ART,
  CATEGORY_SPHERE_TINT,
  SUBLOCATION_TYPE_CATEGORY,
  normalizeSublocationTypeId,
  getSublocationCategory,
  getSublocationCategoryArtUrl,
  getSublocationArtUrl,
} from '../sublocation-category-art';
import { SUBLOCATION_CONCEPT_ART } from '../sublocation-concept-art';

/** Seed shared with the CLI smoke path, so a failure here reproduces there. */
const TEST_SEED = 42;

/**
 * Every `SublocationContribution` the genome tables declare, flattened.
 *
 * Note the culture pass: its contributions live under `additions` and
 * `substitutions[].replacement`, not a `sublocations` array like the sphere and
 * reach menus. Reading a `sublocations` field here would silently yield nothing
 * and quietly narrow both assertions below to the other three passes.
 */
function allGenomeContributions(): SublocationContribution[] {
  const out: SublocationContribution[] = [...SETTLEMENT_INFRASTRUCTURE];
  for (const baseline of Object.values(CULTURE_BASELINE_MAP)) {
    out.push(...baseline.additions);
    out.push(...baseline.substitutions.map(s => s.replacement));
  }
  for (const def of Object.values(SPHERE_SUBLOCATION_MENU)) {
    out.push(...(def?.sublocations ?? []));
  }
  for (const def of Object.values(REACH_SUBLOCATION_MENU)) {
    out.push(...(def?.sublocations ?? []));
  }
  return out;
}

describe('sublocation category art — registry', () => {
  it('documents a sphere tint for every plate', () => {
    // toEqual, not a count: a length check passes when the SET drifts.
    expect(Object.keys(CATEGORY_SPHERE_TINT).sort()).toEqual(
      Object.keys(SUBLOCATION_CATEGORY_ART).sort(),
    );
  });

  it('ships every registered plate as a real file on disk', () => {
    // A path string proves nothing — the plate has to exist, or the surface
    // renders a broken <img> and a path-only test still passes.
    for (const [category, path] of Object.entries(SUBLOCATION_CATEGORY_ART)) {
      expect(existsSync(join(process.cwd(), 'public', path)), `${category} -> ${path}`).toBe(true);
    }
  });

  it('gives each category a distinct plate so categories separate at a glance', () => {
    const paths = Object.values(SUBLOCATION_CATEGORY_ART);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keys the type map on normalised ids only', () => {
    // A key that kept the `sublocation-type.` prefix would never be hit, since
    // the lookup normalises first. Silent dead rows are the failure mode.
    const prefixed = Object.keys(SUBLOCATION_TYPE_CATEGORY).filter(k =>
      k.startsWith('sublocation-type.'),
    );
    expect(prefixed).toEqual([]);
  });

  it('maps every type id to one of the ten categories', () => {
    const unknown = Object.entries(SUBLOCATION_TYPE_CATEGORY).filter(
      ([, category]) => !(category in SUBLOCATION_CATEGORY_ART),
    );
    expect(unknown).toEqual([]);
  });
});

describe('sublocation category art — agreement with the settlement genome', () => {
  it('never contradicts a single-tag genome declaration', () => {
    // The genome is the authority on what a sublocation type IS. Where it
    // declares exactly one tag, this registry must not disagree.
    const declared = new Map<string, Set<string>>();
    for (const contribution of allGenomeContributions()) {
      const id = normalizeSublocationTypeId(contribution.id);
      if (!declared.has(id)) declared.set(id, new Set());
      for (const tag of contribution.tags) declared.get(id)!.add(tag);
    }

    const disagreements: string[] = [];
    for (const [id, tags] of declared) {
      if (tags.size !== 1) continue; // multi-tag ⇒ judgment call, 0 ⇒ nothing to pin
      const [onlyTag] = [...tags];
      const mapped = SUBLOCATION_TYPE_CATEGORY[id];
      if (mapped !== onlyTag) {
        disagreements.push(`${id}: genome says ${onlyTag}, registry says ${mapped ?? '(absent)'}`);
      }
    }
    expect(disagreements).toEqual([]);
  });

  it('has a row for every sublocation type the genome can emit', () => {
    // The genome is the largest producer; a type it can emit with no row here
    // renders the glyph tile in a live world.
    const missing = [...new Set(allGenomeContributions().map(c => normalizeSublocationTypeId(c.id)))]
      .filter(id => !(id in SUBLOCATION_TYPE_CATEGORY))
      .sort();
    expect(missing).toEqual([]);
  });
});

describe('sublocation category art — resolution', () => {
  it('resolves both the prefixed and the bare form of an id', () => {
    // Content writes both: the genome writes `sublocation-type.tavern`, a dozen
    // encounter context specs write bare `workshop` / `shrine` / `court`.
    expect(getSublocationArtUrl('sublocation-type.library')).toBe(SUBLOCATION_CATEGORY_ART.scholarly);
    expect(getSublocationArtUrl('library')).toBe(SUBLOCATION_CATEGORY_ART.scholarly);
  });

  it('falls back to a declared genome tag for an id it has not learned', () => {
    // Forward compatibility: a future genome type id still resolves via its tag.
    expect(getSublocationArtUrl('sublocation-type.not-yet-registered', ['underworld']))
      .toBe(SUBLOCATION_CATEGORY_ART.underworld);
  });

  it('prefers the type map over the tag fallback', () => {
    // `library` is scholarly. A stray tag must not override the authored row.
    expect(getSublocationArtUrl('library', ['commerce']))
      .toBe(SUBLOCATION_CATEGORY_ART.scholarly);
  });

  it('ignores an empty or unrecognised tag array', () => {
    // `genomeTags: []` is the common case on 77 live nodes — it must not throw
    // and must not resolve to an arbitrary plate.
    expect(getSublocationArtUrl('unknown-type', [])).toBeNull();
    expect(getSublocationArtUrl('unknown-type', ['not-a-tag'])).toBeNull();
  });

  it('returns null rather than throwing for absent or unknown ids', () => {
    expect(getSublocationArtUrl(undefined)).toBeNull();
    expect(getSublocationArtUrl(null)).toBeNull();
    expect(getSublocationArtUrl('')).toBeNull();
    expect(getSublocationArtUrl('nonexistent-type')).toBeNull();
    expect(getSublocationCategory(undefined)).toBeNull();
    expect(getSublocationCategoryArtUrl(undefined)).toBeNull();
    expect(getSublocationCategoryArtUrl('not-a-category')).toBeNull();
  });
});

describe('sublocation category art — coverage against a seeded world', () => {
  const archetype = generateArchetypes(4, TEST_SEED)[0];
  const { state: initial } = initializeGameState(
    archetype,
    'Test Avatar',
    createBalancedCosmology(),
    TEST_SEED,
  );
  let state: GameState = initial;
  for (let i = 0; i < 60; i++) state = runTick(state);

  const sublocationNodes = state.graph
    .getNodesByType('location')
    .filter(n => typeof n.properties?.sublocationTypeId === 'string');

  it('finds sublocation nodes to assert over (guards against a vacuous pass)', () => {
    // Without this, every assertion below would pass over an empty array. The
    // measured population at tick 60 on seed 42 is 470; the floor is set close
    // enough to notice a collapse in sublocation seeding, not just an empty one.
    expect(sublocationNodes.length).toBeGreaterThan(300);
  });

  it('resolves a plate for every sublocation node in the world', () => {
    const unresolved: string[] = [];
    for (const node of sublocationNodes) {
      const typeId = node.properties.sublocationTypeId as string;
      const tags = node.properties.genomeTags as string[] | undefined;
      if (getSublocationArtUrl(typeId, tags) === null) {
        unresolved.push(`${node.id} (sublocationTypeId=${typeId})`);
      }
    }
    expect(unresolved).toEqual([]);
  });

  it('covers the population through the type map, not the tag fallback', () => {
    // States why the type id is the key: `genomeTags` alone reaches under half
    // the population, so a tag-keyed registry would have blanked the rest while
    // its own tests passed. If this inverts, the design rationale is stale.
    const viaTagOnly = sublocationNodes.filter(n => {
      const typeId = n.properties.sublocationTypeId as string;
      return SUBLOCATION_TYPE_CATEGORY[normalizeSublocationTypeId(typeId)] === undefined;
    });
    expect(viaTagOnly.length).toBe(0);

    const withUsableTags = sublocationNodes.filter(n => {
      const tags = n.properties.genomeTags as string[] | undefined;
      return Array.isArray(tags) && tags.some(t => t in SUBLOCATION_CATEGORY_ART);
    });
    expect(withUsableTags.length).toBeLessThan(sublocationNodes.length);
  });

  it('reaches more of the population than the legacy gradient table did', () => {
    // The concrete win, stated as an assertion rather than a comment: the
    // 12-entry `sublocation-concept-art.ts` table matches a minority of live
    // nodes (its `tavern` entry matches none at all — the genome seeds `inn`).
    const legacyKeys = new Set(Object.keys(SUBLOCATION_CONCEPT_ART));
    const legacyCovered = sublocationNodes.filter(n =>
      legacyKeys.has(n.properties.sublocationTypeId as string),
    ).length;

    expect(legacyCovered).toBeLessThan(sublocationNodes.length / 2);
    expect(sublocationNodes.length).toBeGreaterThan(legacyCovered * 2);
  });
});
