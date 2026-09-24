/**
 * `liveLairMonsterAt` — the living monster a place's lair holds, if any (THR-1545,
 * plan doc `Docs/plans/2026-09-23-monsters-as-opponents.md` § Engine 4).
 *
 * The one reading behind the `requiresLiveMonster` draw gate, on both draw paths
 * (the encounter cache's filter pipeline and `generateUnifiedCandidates`). A place
 * inside a lair resolves to the lair (`resolveToParentLocation`); the lair must still
 * be a lair (a cleared one has given up its beast) and its `namedEliteId` must name a
 * node that `isMonster` and is not gone.
 *
 * O(1): two node reads and a property read. Nothing is cached — the answer changes
 * whenever a monster dies, and the question is cheap.
 *
 * Fail-soft: a missing location, a non-lair, a missing or dangling `namedEliteId`, or
 * a node that is not a monster all read as "no living monster here", so a gate built
 * on it can only hide content.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { resolveToParentLocation } from '../sublocationShape';
import { isAgentGone } from '../groups/groupQueries';
import { isMonster } from './isMonster';

/** The living monster of the lair at `locationId` (or at the lair a place sits in), else undefined. */
export function liveLairMonsterAt(graph: WorldGraph, locationId: string | undefined | null): GraphNode | undefined {
  if (!locationId) return undefined;
  const lair = resolveToParentLocation(graph, graph.getNode(locationId));
  if (!lair || lair.properties.locationSubtype !== 'lair') return undefined;
  const eliteId = lair.properties.namedEliteId;
  if (typeof eliteId !== 'string' || eliteId.length === 0) return undefined;
  const monster = graph.getNode(eliteId);
  if (!monster || !isMonster(monster) || isAgentGone(monster)) return undefined;
  return monster;
}

/** True when the lair at (or around) `locationId` holds a living monster. */
export function hasLiveLairMonsterAt(graph: WorldGraph, locationId: string | undefined | null): boolean {
  return liveLairMonsterAt(graph, locationId) !== undefined;
}
