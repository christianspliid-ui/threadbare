/**
 * The tradition catalog the spell generator reads (THR-1572).
 *
 * The 34 `magic-tradition` nodes of `world-model.json` — the same file `taxonomy.ts`
 * loads — reduced to what the generator needs: an id, a name and Creation-sphere
 * weights. Traditions are **not** minted into the game graph (plan § Graph nodes /
 * edges): a tradition is a catalog id, like a sphere name. Sorted by id so every walk is
 * deterministic (NFP #3). The world model's stray fifth Foundation sphere (Shadow, not in
 * canon's twelve) never appears in a tradition's weights and is ignored.
 */

import worldModel from '../../data/world-model.json';
import { SPHERE_NAMES, type SphereName } from '../../types';
import { TRADITION_ENV, traditionDisplayName } from '../../data/spell-generator-tables';

export interface TraditionEntry {
  readonly id: string;
  /** The world model's full name ("Holy & Divine Magic"). */
  readonly fullName: string;
  /** The sheet's plain name ("Holy"). */
  readonly name: string;
  readonly sphereWeights: Readonly<Partial<Record<SphereName, number>>>;
}

let cache: readonly TraditionEntry[] | null = null;

/** Every tradition the generator knows — world-model traditions that carry an authored row. */
export function traditionCatalog(): readonly TraditionEntry[] {
  if (cache) return cache;
  const nodes = (worldModel as { nodes: { id: string; name: string; category?: string; properties?: Record<string, unknown> }[] }).nodes;
  cache = nodes
    .filter(n => n.category === 'magic-tradition' && TRADITION_ENV[n.id])
    .map(n => {
      const raw = (n.properties?.sphereWeights ?? {}) as Record<string, number>;
      const sphereWeights: Partial<Record<SphereName, number>> = {};
      for (const [key, w] of Object.entries(raw)) {
        const sphere = key.split('.').pop() as SphereName;
        if ((SPHERE_NAMES as readonly string[]).includes(sphere) && w > 0) sphereWeights[sphere] = w;
      }
      return { id: n.id, fullName: n.name, name: traditionDisplayName(n.name, n.id), sphereWeights };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  return cache;
}

/** One tradition by id, or undefined. */
export function traditionEntry(id: string): TraditionEntry | undefined {
  return traditionCatalog().find(t => t.id === id);
}
