/**
 * The innate-power stamp (THR-1671, power runtime S3).
 *
 * A lair's elite is born with its family's Innate Power: one `has_trait` edge to the
 * shared `power.innate.<family>` definition node, `source: 'innate'`. Called from
 * `createNamedElite` right after the monster card is minted, because the card is what
 * names the family.
 *
 * The definitions are seeded at world init (`seedAttachments`); a world seeded before
 * this class existed has none, so the stamp mints the family's definition on demand
 * rather than skipping — the definitions are static data, and an elite without its
 * anatomy would be a quieter bug than a node added late (NFP #4, NFP #6).
 *
 * Deterministic (NFP #3): no draw — the family decides the power.
 */

import type { WorldGraph } from '../graph';
import { assignTrait } from '../traits';
import { emitTrace } from '../traceBuffer';
import { INNATE_POWER_SOURCE, innatePowerDefinition, innatePowerId } from '../../data/innate-powers';
import type { MonsterFamilyId } from '../../types/monster';

/** What the stamp did, for the caller and the tests. */
export interface InnatePowerStampResult {
  readonly powerId: string;
  readonly stamped: boolean;
}

/**
 * Give an elite its family's innate power. Idempotent: an elite already bearing it is
 * left as it is. Fail-soft: an unknown family writes nothing and traces why.
 */
export function stampInnatePower(
  graph: WorldGraph,
  eliteId: string,
  family: MonsterFamilyId | string | undefined,
  tick: number,
): InnatePowerStampResult {
  const familyId = String(family ?? '');
  const powerId = innatePowerId(familyId as MonsterFamilyId);
  let stamped = false;
  try {
    const definition = innatePowerDefinition(familyId);
    if (definition && graph.getNode(eliteId)) {
      if (!graph.getNode(definition.id)) {
        graph.addNode({ ...definition, properties: { ...definition.properties } });
      }
      const already = graph.getOutgoingEdges(eliteId, 'has_trait').some(e => e.target === definition.id);
      if (!already) assignTrait(graph, eliteId, definition.id, { tick, source: INNATE_POWER_SOURCE });
      stamped = graph.getOutgoingEdges(eliteId, 'has_trait').some(e => e.target === definition.id);
    }
  } catch {
    stamped = false; // NFP #4 — the elite keeps its card; it is only missing its anatomy
  }

  const name = graph.getNode(eliteId)?.name ?? eliteId;
  emitTrace({
    category: 'power.innate_stamped',
    tick,
    agentId: eliteId,
    eliteId,
    family: familyId,
    powerId,
    stamped,
    summary: stamped
      ? `${name} is born with ${graph.getNode(powerId)?.name ?? powerId} (${familyId})`
      : `${name} was minted without an innate power — no definition for family "${familyId}"`,
  });

  return { powerId, stamped };
}
