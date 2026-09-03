/**
 * World-object registry contract (THR-1394 slice 1).
 *
 * The registry claims to cover three vocabularies. This test pins each claim against
 * the vocabulary itself — never against a copy — so a member added to a union without
 * a kind, or a kind that names a writer that does not exist, fails by name:
 *
 *   1. Every `NodeType` is claimed by at least one kind (the type-level parse reads
 *      `src/types/graph.ts` through the anchor catalog's parser, the same one the
 *      generator uses).
 *   2. Every `LocationSubtype` sits in exactly one Location class, or is the Route
 *      identity subtype.
 *   3. Every non-reserved `WorldRefKind` is claimed by at least one kind, and every
 *      kind's `worldRef` is a real `WorldRefKind` (the reverse is the type system's).
 *   4. Every class member is a value its kind's discriminator claims.
 *   5. Every writer names a module that exists under `src/`.
 *   6. A small seeded world writes no discriminator value the registry does not claim —
 *      the write-time guard, run against a generated world rather than a fixture, so a
 *      writer that mints an unregistered subtype fails here before it fails in `--check`.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import {
  WORLD_OBJECT_KINDS,
  LOCATION_CLASSES,
  LOCATION_SUBTYPES,
  ROUTE_IDENTITY_LOCATION_SUBTYPE,
  PLACE_CLASSES,
  PLACE_TYPE_IDS,
  getWorldObjectKind,
  kindsForNodeType,
  locationClassOf,
  placeClassOf,
} from '../world-objects';
import { SUBLOCATION_TYPE_CATEGORY } from '../sublocation-category-art';
import { WORLD_REF_KINDS, WORLD_REF_RESERVED_KINDS, isWorldRefKind } from '../../types/worldRef';
import { validateNodeAgainstRegistry, getNodeSchema } from '../../types/nodeSchema';
import { parseUnionMembers, stripLineComments } from '../../../scripts/anchor-catalog-sources';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../../engine/orchestrator';
import { createBalancedCosmology } from '../../engine/cosmology';
import { generateArchetypes } from '../../engine/ascendant';
import { createSimulationRuntime } from '../../engine/simulationRuntime';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
/** Comments stripped first: the parser stops at the first `;`, and a trailing comment inside a union can carry one. */
const read = (rel: string) => stripLineComments(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8'));

/** Ticks the seeded-world probe runs — short, because it is the write-time guard, not the census. */
const WORLD_OBJECT_TEST_TICKS = 20;
const WORLD_OBJECT_TEST_SEED = 42;

describe('world-object registry — union coverage', () => {
  it('claims every NodeType in src/types/graph.ts', () => {
    const nodeTypes = parseUnionMembers(read('src/types/graph.ts'), 'NodeType', 'src/types/graph.ts');
    expect(nodeTypes.length).toBeGreaterThan(10);
    const unclaimed = nodeTypes.filter(t => kindsForNodeType(t as never).length === 0);
    expect(unclaimed, 'NodeType members no world-object kind claims').toEqual([]);
  });

  it('places every LocationSubtype in exactly one Location class (or the Route identity subtype)', () => {
    const subtypes = parseUnionMembers(read('src/types/index.ts'), 'LocationSubtype', 'src/types/index.ts');
    expect(subtypes.length).toBeGreaterThan(40);
    const unclassed = subtypes.filter(s => s !== ROUTE_IDENTITY_LOCATION_SUBTYPE && !locationClassOf(s));
    expect(unclassed, 'LocationSubtype members in no class').toEqual([]);
    const seen = new Map<string, string>();
    for (const [cls, members] of Object.entries(LOCATION_CLASSES)) {
      for (const m of members) {
        expect(seen.has(m), `${m} sits in both ${seen.get(m)} and ${cls}`).toBe(false);
        seen.set(m, cls);
      }
    }
    const notInUnion = LOCATION_SUBTYPES.filter(s => !subtypes.includes(s));
    expect(notInUnion, 'class members that are not LocationSubtype members').toEqual([]);
  });

  it('derives the Place classes from SUBLOCATION_TYPE_CATEGORY without losing a type id', () => {
    const fromClasses = Object.values(PLACE_CLASSES).flat().sort();
    expect(fromClasses).toEqual(Object.keys(SUBLOCATION_TYPE_CATEGORY).sort());
    expect(PLACE_TYPE_IDS.length).toBe(fromClasses.length);
    expect(placeClassOf('sublocation-type.granary')).toBe(placeClassOf('granary'));
  });

  it('covers every non-reserved WorldRefKind, and names only real ones', () => {
    const claimed = new Set(WORLD_OBJECT_KINDS.map(k => k.worldRef).filter((w): w is NonNullable<typeof w> => w !== null));
    const uncovered = WORLD_REF_KINDS.filter(w => !WORLD_REF_RESERVED_KINDS.includes(w) && !claimed.has(w));
    expect(uncovered, 'WorldRefKind members no kind projects onto').toEqual([]);
    for (const k of WORLD_OBJECT_KINDS) if (k.worldRef) expect(isWorldRefKind(k.worldRef), `${k.id}.worldRef`).toBe(true);
  });

  it('has unique kind ids, unique game words, and a note on every kind', () => {
    const ids = WORLD_OBJECT_KINDS.map(k => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    const words = WORLD_OBJECT_KINDS.map(k => k.gameWord);
    expect(new Set(words).size).toBe(words.length);
    for (const k of WORLD_OBJECT_KINDS) expect(k.note.length, `${k.id}.note`).toBeGreaterThan(20);
    expect(getWorldObjectKind('location')?.gameWord).toBe('Location');
  });
});

describe('world-object registry — internal consistency', () => {
  it('keeps every class member inside its kind\'s claimed values', () => {
    for (const k of WORLD_OBJECT_KINDS) {
      if (!k.classes) continue;
      const claimed = k.shape.kind === 'node' ? new Set(k.shape.discriminator?.values ?? []) : k.shape.kind === 'edge' ? new Set(k.shape.edgeTypes) : null;
      if (!claimed) continue;
      for (const [cls, members] of Object.entries(k.classes)) {
        for (const m of members) expect(claimed.has(m), `${k.id}.${cls} member ${m} is not a claimed value`).toBe(true);
      }
    }
  });

  it('names writers that exist under src/', () => {
    const missing: string[] = [];
    for (const k of WORLD_OBJECT_KINDS) {
      for (const w of k.writers) {
        const candidates = [`src/engine/${w}.ts`, `src/data/${w}.ts`, `src/engine/${w}/index.ts`];
        if (!candidates.some(c => fs.existsSync(path.join(REPO_ROOT, c)))) missing.push(`${k.id}: ${w}`);
      }
    }
    expect(missing, 'writers with no module').toEqual([]);
  });

  it('claims each discriminator value for exactly one kind per node type (a refined value is shared by design)', () => {
    const seen = new Map<string, string>();
    for (const k of WORLD_OBJECT_KINDS) {
      if (k.shape.kind !== 'node' || !k.shape.discriminator) continue;
      const refines = k.shape.refines;
      if (refines) expect(kindsForNodeType(k.shape.nodeType).some(o => o.shape.kind === 'node' && o.shape.discriminator?.key === refines.key), `${k.id} refines a key no sibling kind discriminates on`).toBe(true);
      for (const v of k.shape.discriminator.values) {
        const key = `${k.shape.nodeType}|${k.shape.discriminator.key}=${v}`;
        expect(seen.has(key), `${key} claimed by both ${seen.get(key)} and ${k.id}`).toBe(false);
        seen.set(key, k.id);
      }
    }
  });

  it('derives a node schema with the two location tiers told apart by parentLocationId', () => {
    const schema = getNodeSchema();
    expect(schema).not.toBeNull();
    const loc = schema!.get('location')!;
    expect(loc.discriminators.map(d => d.requires).sort()).toEqual(['no-parentLocationId', 'parentLocationId']);
  });
});

describe('world-object registry — write-time guard', () => {
  it('accepts registered values and reports unregistered ones by key and value', () => {
    const ok = { id: 'l1', type: 'location' as const, name: 'x', properties: { locationSubtype: 'town' } };
    expect(validateNodeAgainstRegistry(ok)).toBeNull();
    const place = { id: 'p1', type: 'location' as const, name: 'x', properties: { parentLocationId: 'l1', sublocationTypeId: 'sublocation-type.granary' } };
    expect(validateNodeAgainstRegistry(place)).toBeNull();
    const bad = { id: 'l2', type: 'location' as const, name: 'x', properties: { locationSubtype: 'market' } };
    expect(validateNodeAgainstRegistry(bad)).toMatchObject({ key: 'locationSubtype', value: 'market', reason: 'unregistered_value' });
    const badPlace = { id: 'p2', type: 'location' as const, name: 'x', properties: { parentLocationId: 'l1', sublocationTypeId: 'sublocation-type.throne_room' } };
    expect(validateNodeAgainstRegistry(badPlace)).toMatchObject({ key: 'sublocationTypeId', reason: 'unregistered_value' });
    const noDisc = { id: 'a1', type: 'actor' as const, name: 'x', properties: {} };
    expect(validateNodeAgainstRegistry(noDisc)).toBeNull();
  });

  it('finds no unregistered discriminator value in a generated world', () => {
    resetDecisionCache();
    resetEventCounter();
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS.small;
    const archetype = generateArchetypes(4, WORLD_OBJECT_TEST_SEED)[0];
    let { state } = initializeGameState(archetype, 'WorldObjectsTest', createBalancedCosmology(), WORLD_OBJECT_TEST_SEED, preset.cols, preset.rows);
    for (let i = 0; i < WORLD_OBJECT_TEST_TICKS; i++) state = runTick(state, [], runtime);
    const nodes = state.graph.getAllNodes();
    expect(nodes.length).toBeGreaterThan(100);
    const violations = new Set<string>();
    for (const n of nodes) {
      const v = validateNodeAgainstRegistry(n);
      if (v) violations.add(`${v.nodeType} ${v.key}=${v.value}`);
    }
    expect([...violations].sort(), 'values the world writes that no kind claims').toEqual([]);
  }, 120_000);
});
