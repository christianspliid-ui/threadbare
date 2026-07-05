/**
 * Motive Receipt read helper (THR-631, Phase B consumption).
 *
 * Reads and validates the `motiveReceipt` property an agent node carries from
 * its most recent encounter selection. Both foreshadowing resolvers (tooltip and
 * panel) read the same receipt off the same node — one source of causality.
 *
 * A receipt is only used when it matches the encounter being foreshadowed: if
 * the agent has since selected a different encounter (the receipt is overwritten
 * per selection), the stored receipt names a different template/location and is
 * rejected here → the caller falls to the composed-generic path (fail-soft).
 *
 * Pure, defensive, never throws.
 */

import type { GraphNode } from '../../types/graph';
import type { MotiveReceipt } from '../../types/foreshadowing';

/** Structural guard — a stored property is only a receipt if it has the shape. */
function isMotiveReceipt(value: unknown): value is MotiveReceipt {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<MotiveReceipt>;
  return (
    typeof r.templateId === 'string'
    && typeof r.locationId === 'string'
    && Array.isArray(r.contributions)
    && typeof r.decidedAtTick === 'number'
  );
}

/**
 * Return the agent's Motive Receipt when it matches the requested encounter.
 *
 * @param node       The agent graph node (may be undefined).
 * @param templateId The encounter template being foreshadowed.
 * @param locationId Optional location id; when provided, must also match. The
 *                   tooltip path has no location context and omits it.
 * @returns The matching receipt, or null when absent / stale / mismatched.
 */
export function readMotiveReceipt(
  node: GraphNode | undefined | null,
  templateId: string,
  locationId?: string,
): MotiveReceipt | null {
  const raw = node?.properties?.motiveReceipt as unknown;
  if (!isMotiveReceipt(raw)) return null;
  if (raw.templateId !== templateId) return null;
  if (locationId !== undefined && raw.locationId !== locationId) return null;
  return raw;
}
