/**
 * THR-2102 (art-led pass, slice 6) — the pictures the ceremony host hands its ceremonies.
 *
 * Plan: `Docs/plans/2026-11-01-thr-2102-art-led-ceremonies.md` § S6.1. The ceremonies never
 * read the graph for these pictures: `CeremonyHost` holds the game state, builds every face
 * and echo picture here once, and passes the descriptors down, so the knowledge gate is
 * applied in one place and a ceremony cannot re-open it.
 *
 * Pure reads, never a write. Fail-soft: anything that cannot be resolved draws the designed
 * tile or nothing, never a throw (NFP #4).
 */
import type { GameState } from '../../types/gameState';
import type { EchoDefinition } from '../../types/echo';
import { echoDisplayName } from '../../data/account-content';
import { godName } from '../twilight';
import { ascendantPortraitSrc } from './subjects/godSheet';
import { resolveEntityVisual, type EntityVisualDescriptor } from './entityVisualResolver';
import { rowVisual } from './rowVisual';

/**
 * Decision 3 — the picture of what an echo is of: a legacy's face (knowledge-gated, Law 8),
 * a monument's place picture on its hex's terrain, a relic's painting. A `card` echo has no
 * picture (null). An origin gone from the graph keeps the designed tile under the echo's own
 * name (Law 4).
 */
export function echoVisual(state: GameState, def: EchoDefinition): EntityVisualDescriptor | null {
  if (def.echoType === 'card') return null;
  const name = echoDisplayName(def);
  try {
    const node = state.graph?.getNode(def.originNodeId);
    if (!node) {
      const kind = def.echoType === 'legacy' ? 'agent' : def.echoType === 'monument' ? 'location' : 'artifact';
      return resolveEntityVisual({ id: def.originNodeId, kind, name }, null);
    }
    // THR-2103 (one path, Law 3): a person's knowledge gate and a place's terrain are read by
    // the list rows' helper, so the harvest and the lists cannot disagree about a picture.
    if (node.type === 'actor' || node.type === 'location') {
      const kind = node.type === 'actor' ? 'agent' : 'location';
      const visual = rowVisual(
        { graph: state.graph, familiarityMap: state.familiarityMap, tiles: state.tiles, withSphereInfluence: true },
        { kind, id: node.id, name },
      );
      if (visual) return visual;
    }
    return resolveEntityVisual({ id: node.id, name }, state.graph);
  } catch {
    return null;
  }
}

/** Every echo's picture, keyed by echo id; an echo with no picture has no entry. */
export function echoVisuals(
  state: GameState,
  defs: readonly EchoDefinition[],
): Readonly<Record<string, EntityVisualDescriptor>> {
  const out: Record<string, EntityVisualDescriptor> = {};
  for (const def of defs) {
    const visual = echoVisual(state, def);
    if (visual) out[def.id] = visual;
  }
  return out;
}

/**
 * Decision 1 — the god's face: its origin portrait (`ascendantPortraitSrc`, the one portrait
 * read), else the designed tile. Never null, never gated: the player knows their own god.
 */
export function godFaceVisual(state: GameState): EntityVisualDescriptor {
  let name = 'Your god';
  try {
    name = godName(state);
  } catch {
    // fail-soft: the fallback name
  }
  return resolveEntityVisual(
    { id: state.ascendantId ?? 'ascendant', kind: 'avatar', name, knownSrc: ascendantPortraitSrc(state) },
    null,
  );
}

/**
 * Decision 5 — the rite's mortal through the shared resolver, so an unpainted mortal gets the
 * designed tile instead of a colour smear. Not knowledge-gated: the god is binding this mortal
 * by hand, and the rite has always shown their face (it changes the tile, not who may see it).
 */
export function riteFaceVisual(state: Pick<GameState, 'graph'>, agentId: string, fallbackName: string): EntityVisualDescriptor {
  try {
    const node = state.graph?.getNode(agentId);
    return resolveEntityVisual({ id: agentId, kind: 'agent', name: node?.name ?? fallbackName }, state.graph);
  } catch {
    return resolveEntityVisual({ id: agentId, kind: 'agent', name: fallbackName }, null);
  }
}
