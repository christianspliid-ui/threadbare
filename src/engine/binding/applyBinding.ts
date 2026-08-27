/**
 * Applying a binder decision's fills — the binder's single writer (THR-1296 slice 6).
 *
 * `resolveBinding` is graph-read-only by contract: it returns an intent and never
 * touches the world. Something has to *apply* that intent, and as of slice 6 two
 * callers do — the undertaking bind pass and the encounter support bundle's opt-in
 * route. This module is that writer, extracted from `undertakingBindPass` rather
 * than copied into the second caller.
 *
 * Extracted for the same reason slice 5 extracted {@link
 * import('../encounterSupportBundle').materializeWalkOnActor}: two copies of a rule
 * about *never overwriting authored state* is two places for the rule to drift, and
 * the drift would be silent — an overwrite reads as a successful bind.
 *
 * It deliberately does not live in `binder.ts`. That module's stated contract is
 * graph-read-only, and a mutator sitting inside it would make the contract a comment
 * rather than a property of the file.
 */
import type { WorldGraph } from '../graph';
import type { AxiologicalProfile } from '../../types/agent';
import type { BindingModification } from './binder';

/**
 * Apply a modify's fills. Additive-only, re-checked at write time.
 *
 * The binder only *offers* a fill for something blank, so the guards here are
 * belt-and-braces — but the board is scored against the world as it was at the top of
 * the pass, and an earlier slot in the same pass can have written the very field this
 * one means to fill. Re-reading at write time is what keeps "modify never overwrites"
 * true under composition rather than only in isolation.
 */
export function applyModifications(
  graph: WorldGraph,
  nodeId: string,
  modifications: readonly BindingModification[],
): void {
  const node = graph.getNode(nodeId);
  if (!node) return;

  const properties: Record<string, unknown> = {};
  let touched = false;

  for (const mod of modifications) {
    if (mod.kind === 'set_npc_role') {
      if (node.properties?.npcRole) continue; // already stated — never overwrite
      properties.npcRole = mod.role;
      touched = true;
    } else {
      const existing = node.properties?.axiologicalProfile as AxiologicalProfile | undefined;
      if (existing?.[mod.axis] !== undefined) continue; // stated — never overwrite
      properties.axiologicalProfile = {
        ...(existing ?? {}),
        ...(properties.axiologicalProfile as AxiologicalProfile | undefined),
        [mod.axis]: mod.signedValue,
      };
      touched = true;
    }
  }

  // `updateNode` merges `properties` shallowly and replaces the node object, so the
  // handle read above is stale afterwards — take the id, never the node (the
  // documented `updateNode` trap).
  if (touched) graph.updateNode(nodeId, { properties: { ...node.properties, ...properties } });
}
