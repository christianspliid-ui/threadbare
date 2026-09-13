/**
 * `$here` — the place a scene is happening at, resolved once and read by both halves.
 *
 * THR-1462 extracted this from `encounterAftermath.ts`. THR-1446 shipped `$here` on the
 * **effect** side only: an aftermath effect could land a condition on the shrine, and the
 * **chip** reporting that write could not point at the shrine, because
 * `classifyAnchorDeclaration` resolved five sentinel forms and `$here` was not among them.
 * So the two halves disagreed about what an author may name — the exact drift
 * `sceneSentinels.ts`'s own header warns against.
 *
 * Closing that gap needed a second *reader* of the location walk, never a second *copy*
 * of it: a chip that resolved `$here` one hop differently from the effect it reports would
 * point the player at the wrong node while passing every gate. The walk therefore lives
 * here, and `encounterAftermath.ts` and `chipAnchorDeclarations.ts` both import it.
 *
 * **Why not in `sceneSentinels.ts`.** That module is deliberately pure — "no graph, no
 * state, no fs, and no template" — so the authoring-time gate can import the field→kind
 * table without pulling the runtime dispatcher into a CLI bundle. This walk needs a
 * `WorldGraph`, so putting it there would cost that property. One small graph-reading
 * module beside the pure one keeps both.
 */

import type { WorldGraph } from './graph';
import type { SceneSentinelKind } from './sceneSentinels';
import { isPlaceNode, isLocationNode, resolveToParentLocation } from './sublocationShape';

/**
 * THR-1446 — resolve `$here` for a sentinel field: the place the acting agent stands in,
 * walked to the tier the field wants.
 *
 * Three-tier position model (CLAUDE.md § Load-Bearing Architectural Decisions): an agent
 * holds exactly one `located_at` edge, pointing at the most specific node it occupies.
 * So a `sublocation` field takes that node when it is a Place, and a `location` field
 * walks up through `resolveToParentLocation`.
 *
 * The ascendant hop is the reason this is a function rather than one line at the call
 * site: an ascendant node carries no `located_at` of its own — its *avatar* does — and
 * the divine self-targeted encounter is precisely the shape that could not wire `place`
 * before. Fail-soft throughout: any unresolvable link returns `null` and leaves the
 * sentinel in place (NFP #4).
 */
export function resolveSceneHere(
  graph: WorldGraph,
  actorId: string | undefined,
  kind: SceneSentinelKind,
): string | null {
  if (!actorId) return null;
  if (kind !== 'location' && kind !== 'sublocation') return null;

  let locatedId = graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  if (!locatedId) {
    const avatarId = graph.getNode(actorId)?.properties?.avatarId;
    if (typeof avatarId === 'string' && avatarId.length > 0) {
      locatedId = graph.getOutgoingEdges(avatarId, 'located_at')[0]?.target;
    }
  }
  if (!locatedId) return null;

  const located = graph.getNode(locatedId);
  if (!located) return null;

  if (kind === 'sublocation') return isPlaceNode(located) ? located.id : null;

  const parent = resolveToParentLocation(graph, located);
  return parent && isLocationNode(parent) ? parent.id : null;
}
