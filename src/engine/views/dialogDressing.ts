/**
 * THR-2101 (art-led pass, slice 5) — the pictures the dialog host hands its dialogs.
 *
 * The dialogs never read the graph (slice 4's rule): `DialogHost` holds the game state and
 * builds every face, medallion and relic tile here, then passes the descriptors down. So
 * the knowledge gate is applied once, in one place, and a dialog cannot re-open it.
 *
 * Pure reads, never a write. Fail-soft: anything that cannot be resolved draws nothing
 * (no medallion, no tile), never a throw (NFP #4).
 */
import type { GameState } from '../../types/gameState';
import type { TerrainType } from '../../types';
import type { EncounterAftermathChange } from '../../types/unifiedAction';
import type { PlayerActionReceipt } from '../playerReceipts';
import type { PendingBeat } from '../../types/ascendantBeat';
import { getAttachmentArtUrl } from '../../data/artifact-category-art';
import { mortalFace, resolveEntityVisual, type EntityVisualDescriptor } from './entityVisualResolver';

type DressingState = Pick<GameState, 'graph' | 'familiarityMap'>;

/**
 * A mortal's face for a dialog about them (the chooser, the beat's subject, a court seat),
 * or null when the id names no mortal. A mortal no longer in the graph keeps the designed
 * tile under `fallbackName` when one is given (Law 4).
 */
export function dialogSubjectFace(
  state: DressingState,
  id: string | null | undefined,
  fallbackName?: string,
): EntityVisualDescriptor | null {
  if (!id) return null;
  try {
    if (state.graph?.getNode(id)) return mortalFace(state.graph, id, state.familiarityMap);
    return fallbackName ? resolveEntityVisual({ id, kind: 'agent', name: fallbackName }, null) : null;
  } catch {
    return null;
  }
}

/**
 * Decision 2 — who the act touched: a mortal's face (knowledge-gated), a place's picture or
 * a faction's arms. Anything else, and an act on yourself, draws no medallion.
 */
export function receiptTargetVisual(
  state: DressingState,
  receipt: Pick<PlayerActionReceipt, 'targetId' | 'targetName'>,
): EntityVisualDescriptor | null {
  try {
    if (!receipt.targetId || receipt.targetName === 'yourself') return null;
    const node = state.graph?.getNode(receipt.targetId);
    if (!node) return null;
    if (node.type === 'actor') {
      const actorType = node.properties?.actorType;
      if (actorType === 'faction' || actorType === 'culture') {
        return resolveEntityVisual({ id: node.id, kind: 'faction', name: node.name }, state.graph);
      }
      return mortalFace(state.graph, node.id, state.familiarityMap);
    }
    if (node.type === 'location') {
      const terrain = node.properties?.terrain;
      return resolveEntityVisual({ id: node.id, name: node.name }, state.graph, {
        terrain: typeof terrain === 'string' ? (terrain as TerrainType) : undefined,
      });
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * S5.3 — a change that names a relic shows its painting: change id → plate URL, through
 * `getAttachmentArtUrl` (bespoke, else the category plate). No plate → no entry.
 */
export function receiptChangeArt(
  state: Pick<GameState, 'graph'>,
  changes: readonly EncounterAftermathChange[],
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const change of changes) {
    const relic = change.concepts?.find(c => c.visualKind === 'attachment' || c.visualKind === 'artifact');
    if (!relic?.entityId) continue;
    try {
      const subcategory = state.graph?.getNode(relic.entityId)?.properties?.subcategory;
      const src = getAttachmentArtUrl(relic.entityId, typeof subcategory === 'string' ? subcategory : null);
      if (src) out[change.id] = src;
    } catch {
      // fail-soft: no tile
    }
  }
  return out;
}

/**
 * The node a gift beat is about: an introduction beat's first bound node (the same id
 * GameView reads for its Attend route), else none. A faction or culture id draws no face
 * downstream, since `dialogSubjectFace` resolves mortals only.
 */
export function beatSubjectNodeId(
  pending: Pick<PendingBeat, 'kind' | 'boundNodeIds'> | null | undefined,
): string | undefined {
  return pending?.kind === 'introduction' ? pending.boundNodeIds?.[0] : undefined;
}

/** Decision 3 — every court seat's face through the one face path, keyed by mortal id. */
export function courtFaces(
  state: DressingState,
  agents: readonly { id: string; name: string }[],
): Readonly<Record<string, EntityVisualDescriptor>> {
  const out: Record<string, EntityVisualDescriptor> = {};
  for (const agent of agents) {
    const face = dialogSubjectFace(state, agent.id, agent.name);
    if (face) out[agent.id] = face;
  }
  return out;
}
