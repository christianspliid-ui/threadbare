/**
 * `$realm` — the Realm that holds the ground a scene is on, resolved once and read by
 * both halves.
 *
 * THR-1499 extracted this from `encounterAftermath.ts`, for the reason THR-1462 gave
 * when it extracted `$here` into `sceneHere.ts`: the effect side had the sentinel and
 * the chip side did not, so a `faction_reputation_gain` could land on the crown while
 * the chip reporting it could not link the crown. Every standing chip in the realm-court
 * family named the state instead and left the player unable to click through to whose
 * court it was — the one faction class whose name is drawn on the map was the one no
 * chip could reach.
 *
 * Closing it needed a second *reader* of the lookup, never a second *copy*: a chip that
 * resolved `$realm` from a different map than the effect it reports would point the
 * player at a nation the border mesh does not draw, while passing every gate. So the
 * lookup lives here, and `encounterAftermath.ts` and `chipAnchorDeclarations.ts` both
 * import it.
 *
 * **Why not in `sceneSentinels.ts`.** That module is deliberately pure — "no graph, no
 * state, no fs, and no template" — so the authoring-time gate can import the field→kind
 * table without pulling the runtime dispatcher into a CLI bundle. This lookup needs a
 * `WorldGraph` and the political map. One small graph-reading module beside the pure one
 * keeps both, exactly as `sceneHere.ts` does.
 */

import type { WorldGraph } from './graph';
import type { SceneSentinelKind } from './sceneSentinels';
import type { RealmProjection } from './realmProjection';
import { resolveSceneHere } from './sceneHere';
import { hexKeyFromCoord } from '../lib/hexKey';

/**
 * The political map, **lazily** — called at most once per lookup, and only when a
 * `$realm` sentinel is actually present.
 *
 * A thunk rather than the projection itself because `ensureRealmProjection` takes a
 * fingerprint of every faction-`controls` edge on each call when the version is current
 * (the belt that catches a writer who skipped `touchStructure`). That is cheap against a
 * rebuild and wasteful against the overwhelming majority of effects and chips, which
 * carry no `$realm` at all. Returning `null` — or throwing, which is caught — leaves the
 * sentinel unbound (NFP #4).
 */
export type RealmProjectionThunk = () => RealmProjection | null;

/**
 * THR-1155 — resolve `$realm`: the Realm whose political map claims the hex the acting
 * agent is standing on.
 *
 * Three hops, each one already the sanctioned way to ask its question:
 * `resolveSceneHere` for the Location (so `$realm` inherits the avatar hop and the
 * three-tier walk rather than re-deriving them), the Location's `hexCol`/`hexRow` for
 * the ground, and `realmProjection.hexRealmId` for the nation — the same map the
 * border mesh draws.
 *
 * **Reading the hex rather than the Location's holder is deliberate.** A Location's
 * holder can be a guild, an order or a monster faction; the projection contains Realms
 * only. Asking the map therefore *cannot* return a non-Realm, where asking the town
 * would need a `factionClass` filter bolted on to be safe — and a filter that is
 * merely remembered is a filter that is one day forgotten.
 *
 * Fail-soft throughout (NFP #4): no actor, no position, a Location with no stamped hex,
 * an unclaimed hex, a projection that throws, or a claimed hex whose Realm node has
 * since gone away all return `null`, and the sentinel stays in place.
 */
export function resolveSceneRealm(
  graph: WorldGraph,
  actorId: string | undefined,
  kind: SceneSentinelKind,
  projection: RealmProjectionThunk | undefined,
): string | null {
  if (kind !== 'faction' || !projection) return null;

  const locationId = resolveSceneHere(graph, actorId, 'location');
  if (!locationId) return null;

  const col = graph.getNode(locationId)?.properties?.hexCol;
  const row = graph.getNode(locationId)?.properties?.hexRow;
  if (typeof col !== 'number' || typeof row !== 'number') return null;

  let realmId: string | undefined;
  try {
    realmId = projection()?.hexRealmId.get(hexKeyFromCoord({ col, row }));
  } catch {
    // The projection is a cache behind a belt; a build that throws is already traced
    // by `ensureRealmProjection`. Never let a sentinel lookup be what breaks a tick.
    return null;
  }
  if (!realmId) return null;

  // The projection is rebuilt on structural change, so a stale entry is not the
  // expected case — but binding an id to a node that is gone would mint an edge into
  // nothing, which is worse than an unbound sentinel.
  return graph.getNode(realmId) ? realmId : null;
}
