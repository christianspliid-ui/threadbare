/**
 * THR-1498 — the graph-holding halves of a consequence chip, built once for
 * every adapter that emits chips.
 *
 * `buildAftermathConsequences` is deliberately pure — no graph, no React — so
 * the two things a chip needs from the world arrive as callbacks: the tile an
 * entity draws (`resolveIcon`, THR-1004) and what a declared anchor sentinel
 * means in *this* world (`resolveAnchor`, THR-1164). Until this module the
 * unified adapter was the only place those closures existed, which is exactly
 * why the gate-duty ending rendered its cast as inert text: the surface that
 * knew the ids had no way to spend them, and the fix for the unified path
 * landed beside the bespoke one without covering it.
 *
 * Both closures live here so the next adapter that emits chips picks them up
 * by import rather than by copy. A second hand-rolled copy is how the two
 * paths drift apart again.
 */

import type { WorldGraph } from '../../../../engine/graph';
import type { UnifiedAction } from '../../../../types/unifiedAction';
import { resolveAnchorDeclaration } from '../../../../data/content-eval/chipAnchorDeclarations';
import type { RealmProjectionThunk } from '../../../../engine/sceneRealm';
import { resolveEntityVisual } from '../../../shared/entityVisualResolver';
import type { ChipIconResolver } from './buildAftermathConsequences';

/**
 * The UI Law's image half (THR-1004). Resolved in the adapter layer because
 * that is the layer that holds the graph; the veil renders what comes out and
 * stays graph-free. A concept whose entity has no art resolves to the designed
 * fallback tile rather than nothing (NFP #4).
 */
export function buildChipIconResolver(graph: WorldGraph): ChipIconResolver {
  return (concept) => {
    const kind = concept.visualKind;
    if (!kind) return undefined;
    // THR-1120 — an attachment has a page but no entity-visual family: its art
    // lives on its own template node and `AttachmentDetailView` draws it. It
    // takes the link tier and no tile, which is the documented fail-open path
    // rather than a wrong glyph. `EntityVisualKind` excludes it, so removing
    // this guard is a type error, not a silent regression.
    if (kind === 'attachment') return undefined;
    // THR-1155 — an Area is the second kind with a route and no tile. It is a
    // stretch of ground: the map draws its dotted border and its label, and there is
    // no portrait of a mountain range that a chip could carry. Same guard, same
    // reason, same compile-time enforcement — `EntityVisualKind` excludes it.
    if (kind === 'area') return undefined;
    const entityId = concept.entityId ?? concept.visualName ?? concept.text;
    const name = concept.visualName ?? concept.text;
    const descriptor = resolveEntityVisual({ id: entityId, kind, name }, graph);
    return { entityId, kind, name, src: descriptor.src };
  };
}

/**
 * Law 56 clause 2's runtime half (THR-1164). An anchor that cannot be a
 * literal id (a faction node minted per world, a cast actor, the acting
 * agent) is authored as a sentinel and only the graph can say what it means
 * here. Same module the gate classifies with, so a declaration that passed
 * `check:chip-anchors` is the one resolved on screen.
 *
 * Takes the action rather than its fields so the two adapters cannot disagree
 * about which of them `$target` or `$artifact` reads from. Fail-soft on a
 * missing action: every sentinel resolves to `undefined` and the chip renders
 * as the plain text it was before it declared anything (NFP #4, Law 21).
 *
 * `realmProjection` (THR-1499) is what `$realm` reads — the political map the
 * border mesh draws, handed in as a thunk so an ending with no realm chip never
 * pays for it. Optional for the same fail-soft reason: an adapter with no map
 * resolves `$realm` to `undefined` and the standing chip stays `named`.
 */
export function buildChipAnchorResolver(
  graph: WorldGraph,
  activeAction: UnifiedAction | undefined,
  realmProjection?: RealmProjectionThunk,
): (entityId: string) => string | undefined {
  const castNodeIdByKey = new Map(
    (activeAction?.supportBindings ?? []).map(b => [b.key, b.nodeId]),
  );
  return (entityId) =>
    resolveAnchorDeclaration(entityId, {
      graph,
      actorId: activeAction?.actorId,
      // THR-1130 — the other end of the edge. Effects that write onto the
      // agent the encounter was aimed at (`favor_creation` mints `owes_favor`
      // debtor-side) produce chips whose sentence is about the target, and
      // until this was passed the only anchor available was `$actor`.
      targetId: activeAction?.targetId,
      castNodeIdByKey,
      // THR-1275 — what `$artifact` searches by. `spawn_artifact` stamps
      // `sourceEncounterId` from `action.templateId`, so passing the same value
      // here is what lets a `possession` chip anchor the possession instead of
      // the holder. Without it the sentinel fails soft to text.
      encounterTemplateId: activeAction?.templateId,
      // THR-1499 — the nation holding the ground. Same thunk shape the effect
      // binder takes, so a standing chip links the Realm the map draws.
      realmProjection,
    });
}
