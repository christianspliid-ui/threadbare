/**
 * A finished undertaking, named as a deed (THR-1434): the verb's ledger word and the
 * object the world names — *Founded the Saltway*, *Cured Old Maerin's fever*,
 * *Sealed Vessa's art*. Built once at the producer (the lifecycle's completion) and
 * carried on the history entry and the completion event, so the sheet's ledger and
 * any chronicle surface render the same structured reference and never parse English.
 *
 * Only a cell yields a deed: a template-model completion keeps its display name.
 * Pure and read-only; never throws (NFP #4) — a deed that cannot be named is absent.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { StrategicActionCandidate, StrategicProjectRuntime, UndertakingDeed, UndertakingObjectHandle } from '../types/strategicAction';
import type { WorldRef, WorldRefKind } from '../types/worldRef';
import { getStrategicTemplate } from './strategicActionCandidates';
import { objectDisplayName } from './undertakingProse';
import { deedWordFor } from '../data/undertaking-verb-prose';
import { getUndertakingObjectType } from '../data/undertaking-objects';

/**
 * The world-reference kind a node reads as, or null when no page exists for it —
 * a company, a network, a power, a condition or an agreement is named, never linked.
 */
export function worldRefKindOf(node: GraphNode | undefined): WorldRefKind | null {
  if (!node) return null;
  if (node.type === 'actor') {
    const actorType = node.properties?.actorType;
    if (actorType === 'faction') return 'faction';
    if (actorType === 'individual' || actorType === 'npc' || actorType === undefined) return 'agent';
    return null;
  }
  if (node.type === 'location') return node.properties?.parentLocationId ? 'sublocation' : 'location';
  if (node.type === 'artifact' || node.type === 'artifact_legendary') return 'artifact';
  return null;
}

function refFor(graph: WorldGraph, nodeId: string | undefined): WorldRef | undefined {
  if (!nodeId) return undefined;
  const node = graph.getNode(nodeId);
  const kind = worldRefKindOf(node);
  if (!node || !kind) return undefined;
  return { kind, id: node.id, name: node.name };
}

/**
 * Name a completed cell's deed. `createdId` is the christened node for a create
 * cell; otherwise the object is the candidate's handle.
 */
export function describeDeed(
  graph: WorldGraph,
  candidate: Pick<StrategicActionCandidate, 'templateId' | 'objectTypeId' | 'objectHandle' | 'targetNodeId'>,
  project: Pick<StrategicProjectRuntime, 'objectTypeId' | 'objectHandle' | 'targetNodeId'> | undefined,
  createdId: string | undefined,
): UndertakingDeed | undefined {
  try {
    const template = getStrategicTemplate(candidate.templateId);
    const variant = template?.cellVariant;
    if (!variant) return undefined;
    const objectTypeId = project?.objectTypeId ?? candidate.objectTypeId;
    const type = objectTypeId ? getUndertakingObjectType(objectTypeId) : undefined;
    const handle: UndertakingObjectHandle | undefined = project?.objectHandle ?? candidate.objectHandle;

    // A made thing is the deed's object; a thing acted on is the handle's.
    const createdNode = createdId ? graph.getNode(createdId) : undefined;
    const objectName = createdNode?.name
      ?? (type ? objectDisplayName(graph, type.id, handle) : undefined)
      ?? (type ? `the ${type.displayName.toLowerCase()}` : undefined);
    if (!objectName) return undefined;

    const objectRef = createdNode
      ? refFor(graph, createdNode.id)
      : handle?.kind === 'node'
        ? refFor(graph, handle.nodeId)
        : refFor(graph, project?.targetNodeId ?? candidate.targetNodeId);

    const word = deedWordFor(candidate.templateId, variant);
    return {
      verb: variant,
      word,
      objectName,
      ...(objectRef ? { objectRef } : {}),
      phrase: `${word} ${objectName}`,
    };
  } catch {
    return undefined;
  }
}
