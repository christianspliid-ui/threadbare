/**
 * Possession subcategory vocabulary (THR-857).
 *
 * `PossessionSubcategory` is a seven-member union, and until this ticket five
 * content sites wrote values outside it — `intelligence` ×3, `talisman`, `charm` —
 * while a sixth producer wrote no `subcategory` at all. Nothing caught any of it:
 * the catalog entries are asserted with `as PossessionNodeProperties` rather than
 * checked against it, encounter graph-ops carry an untyped `Record<string, unknown>`
 * property bag, and `seedWorld` builds its properties inline. All three shapes are
 * invisible to `tsc` by construction, so a type gate cannot close this class on its
 * own — which is why the gate is a test, and why it has three arms rather than one.
 *
 * Each arm covers a shape that actually produced a stray:
 *
 *   1. **Catalogs** — the authored arrays, swept whole. The live world below only
 *      instantiates a handful of the ~120 catalog entries at tick 60, so a stray on
 *      an entry that happens not to spawn would sail past a runtime-only check.
 *   2. **Encounter graph-ops** — the untyped property bag that produced site #5.
 *      Scanned from source because there is no importable value to assert over.
 *   3. **A live seeded world** — the procedural producers no authored table can see.
 *      This is the arm that found the subcategory-less `artifact_0`.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { initializeGameState } from '../../engine/gameInit';
import { runTick } from '../../engine/orchestrator';
import { generateArchetypes } from '../../engine/ascendant';
import { createBalancedCosmology } from '../../engine/cosmology';
import { POSSESSION_SUBCATEGORIES } from '../../types/attachments';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import { resolveSlotTag } from '../../engine/attachmentSlotResolver';
import { SLOT_CAPS } from '../attachment-slot-constants';
import { REWARD_POSSESSIONS, TREASURE_MAPS } from '../reward-attachment-catalog';
import { STARTER_POSSESSIONS } from '../starter-attachments';
import { ANOMALY_SIGNATURE_ARTIFACTS } from '../anomaly-reward-catalog';

/** Seed shared with the CLI smoke path, so a failure here reproduces there. */
const TEST_SEED = 42;

/** Node types that carry `PossessionNodeProperties`. */
const ARTIFACT_NODE_TYPES = ['artifact', 'artifact_legendary'] as const;

const CANONICAL = new Set<string>(POSSESSION_SUBCATEGORIES);

/** `id (subcategory=x)` for every entry whose subcategory is absent or off-union. */
function offUnion(nodes: readonly GraphNode[]): string[] {
  return nodes
    .filter(n => !CANONICAL.has(n.properties?.subcategory as string))
    .map(n => `${n.id} (subcategory=${String(n.properties?.subcategory)})`);
}

describe('possession subcategory vocabulary — authored catalogs', () => {
  const CATALOGS: Array<[string, readonly GraphNode[]]> = [
    ['REWARD_POSSESSIONS', REWARD_POSSESSIONS],
    ['TREASURE_MAPS', TREASURE_MAPS],
    ['STARTER_POSSESSIONS', STARTER_POSSESSIONS],
    ['ANOMALY_SIGNATURE_ARTIFACTS', ANOMALY_SIGNATURE_ARTIFACTS],
  ];

  it.each(CATALOGS)('%s holds entries to assert over', (_name, catalog) => {
    // Without this an emptied or renamed export would make the sweep below pass
    // by having nothing to sweep.
    expect(catalog.length).toBeGreaterThan(0);
  });

  it.each(CATALOGS)('%s writes only canonical subcategories', (_name, catalog) => {
    // toEqual([]) rather than a count: the failure message has to name the entry,
    // because "1 stray" sends the next reader back to grep for it.
    expect(offUnion(catalog)).toEqual([]);
  });
});

describe('possession subcategory vocabulary — encounter graph-ops', () => {
  // `add_node` ops with `nodeType: 'artifact'` build their properties as an
  // untyped bag, so the value is unreachable from an import. Read the source.
  const ENCOUNTER_DIR = join(__dirname, '..', 'encounters');
  const MINTS_ARTIFACT = /nodeType:\s*'artifact(_legendary)?'/;
  const SUBCATEGORY = /subcategory:\s*'([a-z_]+)'/;

  /** Subcategory literals appearing inside an artifact-minting op, by file. */
  const found: Array<{ file: string; value: string }> = [];
  for (const file of readdirSync(ENCOUNTER_DIR).filter(f => f.endsWith('.ts'))) {
    const lines = readFileSync(join(ENCOUNTER_DIR, file), 'utf-8').split('\n');
    lines.forEach((line, i) => {
      if (!MINTS_ARTIFACT.test(line)) return;
      // The property bag follows the nodeType line; 12 lines covers the ones
      // authored so far without running into the next op.
      for (const near of lines.slice(i, i + 12)) {
        const match = SUBCATEGORY.exec(near);
        if (match) { found.push({ file, value: match[1] }); break; }
      }
    });
  }

  it('finds at least one artifact-minting op to assert over', () => {
    // The scan is a regex over source. If a refactor changes the op shape this
    // goes quiet and would otherwise pass vacuously forever.
    expect(found.length).toBeGreaterThan(0);
  });

  it('mints artifacts only with canonical subcategories', () => {
    expect(found.filter(f => !CANONICAL.has(f.value))).toEqual([]);
  });
});

// One world, ticked far enough for the reward pipeline and the world seeder to
// have minted procedural items — the producers no authored table can see. Built
// once at module scope because two describes below assert over it.
const WORLD_ARTIFACTS: GraphNode[] = (() => {
  const archetype = generateArchetypes(4, TEST_SEED)[0];
  const { state: initial } = initializeGameState(
    archetype,
    'Test Avatar',
    createBalancedCosmology(),
    TEST_SEED,
  );
  let state: GameState = initial;
  for (let i = 0; i < 60; i++) state = runTick(state);
  return ARTIFACT_NODE_TYPES.flatMap(t => state.graph.getNodesByType(t));
})();

describe('possession subcategory vocabulary — a live seeded world', () => {
  const artifactNodes = WORLD_ARTIFACTS;

  it('finds artifact nodes to assert over (guards against a vacuous pass)', () => {
    expect(artifactNodes.length).toBeGreaterThan(50);
  });

  it('carries a canonical subcategory on every artifact node in the world', () => {
    // The measurement the ticket was filed on: this listed six entries at tick 60
    // (`intelligence` ×3, `talisman`, `charm`, and two nodes with none at all).
    expect(offUnion(artifactNodes)).toEqual([]);
  });
});

describe('possession subcategory vocabulary — the slot consequence of reconciling', () => {
  // Reconciling the vocabulary is not behaviour-neutral, and that is the point.
  // None of the five reconciled entries carries an explicit `slotTag`, so while
  // their subcategory was off-union `resolveSlotTag` missed `SUBCATEGORY_TO_SLOT_TAG`
  // and returned undefined — the item landed in `uncategorized`, which has no cap.
  // Five items were therefore free to hold. They now map to real, capped slots.
  // Pinned here rather than left to be discovered after merge.
  const RECONCILED: Array<[string, string]> = [
    ['reward_intelligence_shrine_map', 'tome'],
    ['reward_intelligence_trade_route_dossier', 'tome'],
    ['reward_talisman_pilgrims_wayfinding_stone', 'ring'],
    ['reward_charm_battle_spoils_talisman', 'ring'],
  ];

  it.each(RECONCILED)('%s now resolves to the capped %s slot', (id, expectedTag) => {
    const node = REWARD_POSSESSIONS.find(n => n.id === id);
    expect(node, id).toBeDefined();
    const tag = resolveSlotTag(
      node!.properties.slotTag as string | undefined,
      node!.properties.subcategory as string | undefined,
    );
    expect(tag).toBe(expectedTag);
    // The half that matters: the slot it lands in is actually capped, so the
    // item now competes for space instead of bypassing the system.
    expect(SLOT_CAPS[tag!]).toBeGreaterThan(0);
  });

  it('leaves seeded world artifacts in capped slots too', () => {
    // `seedWorld`'s artifacts were the subcategory-less half of the same defect.
    const worldArtifacts = WORLD_ARTIFACTS.filter(n => n.id.startsWith('artifact_'));
    expect(worldArtifacts.length).toBeGreaterThan(0);
    const uncapped = worldArtifacts.filter(n => {
      const tag = resolveSlotTag(
        n.properties.slotTag as string | undefined,
        n.properties.subcategory as string | undefined,
      );
      return tag === undefined || SLOT_CAPS[tag] === undefined;
    });
    expect(uncapped.map(n => n.id)).toEqual([]);
  });
});
