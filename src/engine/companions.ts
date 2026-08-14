/**
 * Companions (THR-1096) — a named person who walks with a mortal.
 *
 * A companion is a graph node of type `companion`, joined to its bearer by an
 * `accompanies` edge. It is deliberately *not* an actor: no decisions, no
 * movement, no encounters of its own. The capability walk reads its
 * `domainContributions` exactly the way it reads an artifact's, so a companion
 * nudges a roll through the same path as a sword — the difference is that a
 * companion has a name and a reason for being there.
 *
 * Invariants this module owns:
 *  - one bearer per companion (a second `accompanies` edge is refused at mint)
 *  - no silent departures (`removeCompanion` always emits a trace with a reason)
 *  - names come from the world's own generator, threaded with the caller's PRNG
 *
 * Fail-soft throughout: an unknown template, a missing bearer, or an
 * already-instanced unique warns once and grants nothing. Resolution proceeds.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { DomainContributions } from '../types/traits';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';
import {
  COMPANION_MAX,
  getCompanionTemplate,
  type CompanionTemplate,
} from '../data/companion-templates';
import { pickCulturalName } from '../data/culture-name-pools';

/** Node id prefix for minted companion instances. */
export const COMPANION_NODE_PREFIX = 'companion';

/** Reason a companion left. Every departure names one. */
export type CompanionDepartureReason =
  | 'contract_ended'
  | 'lured_away'
  | 'story'
  | 'bearer_missing';

/** A companion instance resolved against its edge — what every reader wants. */
export interface CompanionEntry {
  /** Instance node id. */
  id: string;
  /** The generated (or fixed, for uniques) personal name. */
  name: string;
  templateId: string;
  profession: string;
  goodFor: string;
  domainContributions: DomainContributions;
  tier: number;
  lossCondition: string;
  /** Null/undefined for companions who stay until a story removes them. */
  ticksRemaining: number | null;
  totalTicks: number | null;
  sinceTick: number;
  /** Encounter or action id that brought them. */
  source: string;
  edgeId: string;
}

/**
 * Names already in use across the world, so a companion never arrives wearing
 * someone else's name. Actors and existing companions both count.
 */
function collectUsedNames(graph: WorldGraph): Set<string> {
  const used = new Set<string>();
  for (const node of graph.getNodesByType('actor')) used.add(node.name);
  for (const node of graph.getNodesByType('companion')) used.add(node.name);
  return used;
}

/**
 * Resolve the bearer's culture so a companion's name sounds like the place they
 * came from. Unknown culture is not an error — `pickCulturalName` finds empty
 * pools and falls through to the generic tier, which is the designed fallback.
 */
function resolveCultureHints(
  graph: WorldGraph,
  bearer: GraphNode,
): { foundationBias: string; primarySphere: string } {
  const belongsTo = graph.getOutgoingEdges(bearer.id, 'belongs_to')[0];
  const culture = belongsTo ? graph.getNode(belongsTo.target) : undefined;
  const props = culture?.properties ?? {};
  return {
    foundationBias: typeof props.foundationBias === 'string' ? props.foundationBias : '',
    primarySphere: typeof props.primarySphere === 'string' ? props.primarySphere : '',
  };
}

/**
 * Mint a name for a companion instance. Uniques carry a fixed name; professions
 * draw from the same generator worldgen uses, threaded with the caller's PRNG so
 * the same seed yields the same person.
 *
 * Fail-soft: if the generator yields nothing usable, the profession becomes the
 * name ("a Wayfarer") — designed, not broken.
 */
function mintCompanionName(
  graph: WorldGraph,
  template: CompanionTemplate,
  bearer: GraphNode,
  prng: () => number,
): string {
  if (template.fixedName) return template.fixedName;

  const { foundationBias, primarySphere } = resolveCultureHints(graph, bearer);
  try {
    const name = pickCulturalName(
      foundationBias,
      primarySphere,
      prng,
      collectUsedNames(graph),
    );
    if (name) return name;
  } catch {
    // fall through to the profession fallback
  }
  return `a ${template.profession}`;
}

/** Every companion currently at this bearer's side, resolved through their edges. */
export function getCompanions(graph: WorldGraph, bearerId: string): CompanionEntry[] {
  const entries: CompanionEntry[] = [];

  for (const edge of graph.getOutgoingEdges(bearerId, 'accompanies')) {
    const node = graph.getNode(edge.target);
    if (!node || node.type !== 'companion') continue;

    const props = node.properties ?? {};
    const edgeProps = edge.properties ?? {};
    entries.push({
      id: node.id,
      name: node.name,
      templateId: (props.templateId as string) ?? '',
      profession: (props.profession as string) ?? '',
      goodFor: (props.goodFor as string) ?? '',
      domainContributions: (props.domainContributions as DomainContributions) ?? {},
      tier: (props.tier as number) ?? 1,
      lossCondition: (props.lossCondition as string) ?? 'permanent',
      ticksRemaining: (edgeProps.ticksRemaining as number | null | undefined) ?? null,
      totalTicks: (edgeProps.totalTicks as number | null | undefined) ?? null,
      sinceTick: (edgeProps.sinceTick as number) ?? 0,
      source: (edgeProps.source as string) ?? '',
      edgeId: edge.id,
    });
  }

  return entries;
}

/** True when this unique template already has an instance somewhere in the world. */
export function isUniqueAlreadyInstanced(graph: WorldGraph, templateId: string): boolean {
  return graph
    .getNodesByType('companion')
    .some(n => n.properties?.templateId === templateId);
}

/**
 * True when the bearer is at or above the companion cap. The reward pool reads
 * this as a filter; a *direct authored* grant deliberately ignores it — authored
 * intent wins, and the UI shows the crowd honestly (design decision 6).
 */
export function isAtCompanionCap(graph: WorldGraph, bearerId: string): boolean {
  return getCompanions(graph, bearerId).length >= COMPANION_MAX;
}

export interface MintCompanionOptions {
  /** Encounter or action id — recorded on the edge so every companion has a why. */
  source: string;
  /**
   * Enforce `COMPANION_MAX`. The reward pool passes true; authored grants leave
   * it false so an encounter can always deliver the person it promised.
   */
  respectCap?: boolean;
}

export interface MintCompanionResult {
  companionId: string;
  edgeId: string;
  name: string;
  template: CompanionTemplate;
}

/**
 * Mint a companion instance from a template and attach it to a bearer.
 *
 * Returns null (having warned once) when the template is unknown, the bearer is
 * missing, a unique is already instanced, or the cap applies and is reached.
 * Never throws — the tick loop must not crash over a companion.
 */
export function mintCompanion(
  graph: WorldGraph,
  templateId: string,
  bearerId: string,
  tick: number,
  prng: () => number,
  options: MintCompanionOptions,
): MintCompanionResult | null {
  const template = getCompanionTemplate(templateId);
  if (!template) {
    console.warn(`[companions] unknown companion template "${templateId}" — granting nothing`);
    return null;
  }

  const bearer = graph.getNode(bearerId);
  if (!bearer) {
    console.warn(`[companions] bearer "${bearerId}" not found — granting nothing`);
    return null;
  }

  if (template.unique && isUniqueAlreadyInstanced(graph, templateId)) {
    console.warn(`[companions] unique companion "${templateId}" already exists — granting nothing`);
    return null;
  }

  if (options.respectCap && isAtCompanionCap(graph, bearerId)) return null;

  const companionId = `${COMPANION_NODE_PREFIX}_${bearerId}_${tick}_${templateId}`;
  // A re-grant at the same tick from the same source would collide; treat the
  // existing instance as the grant rather than minting a duplicate.
  if (graph.getNode(companionId)) return null;

  const name = mintCompanionName(graph, template, bearer, prng);
  const totalTicks = template.durationTicks ?? null;

  graph.addNode({
    id: companionId,
    type: 'companion',
    name,
    properties: {
      templateId: template.id,
      profession: template.profession,
      goodFor: template.goodFor,
      domainContributions: { ...template.domainContributions },
      tier: template.tier,
      lossCondition: template.lossCondition,
      tags: [...template.tags],
      unique: template.unique === true,
      joinSentence: template.joinSentence.replace(/\{name\}/g, name),
      departSentence: template.departSentence.replace(/\{name\}/g, name),
      acquiredTick: tick,
    },
  });

  const edgeId = `${companionId}_edge`;
  graph.addEdge({
    id: edgeId,
    source: bearerId,
    target: companionId,
    type: 'accompanies',
    properties: {
      sinceTick: tick,
      ticksRemaining: totalTicks,
      totalTicks,
      source: options.source,
    },
  });

  // `Omit<TraceEntry, …>` collapses the union to its common keys, so a
  // category-specific payload needs the cast the rest of the engine uses.
  emitTrace({
    tick,
    category: 'companion_joined',
    bearerId,
    companionId,
    companionName: name,
    templateId: template.id,
    source: options.source,
    contributions: { ...template.domainContributions } as Record<string, number>,
    ticksRemaining: totalTicks,
    summary: `${name} (${template.profession}) joins ${bearer.name}`,
  } as unknown as TraceEntry);

  return { companionId, edgeId, name, template };
}

export interface RemoveCompanionResult {
  companionId: string;
  companionName: string;
  bearerId: string;
  /** The authored departure line, name already substituted. */
  departSentence: string;
  reason: CompanionDepartureReason;
}

/**
 * Remove a companion and its edge, emitting the departure trace.
 *
 * Returns null when the instance is already gone. Every real removal produces a
 * result carrying the departure sentence, so no companion ever vanishes without
 * the surface being able to say so.
 */
export function removeCompanion(
  graph: WorldGraph,
  companionId: string,
  reason: CompanionDepartureReason,
  tick: number,
): RemoveCompanionResult | null {
  const node = graph.getNode(companionId);
  if (!node || node.type !== 'companion') return null;

  const edge = graph.getIncomingEdges(companionId, 'accompanies')[0];
  const bearerId = edge?.source ?? '';
  const sinceTick = (edge?.properties?.sinceTick as number | undefined) ?? tick;

  const result: RemoveCompanionResult = {
    companionId,
    companionName: node.name,
    bearerId,
    departSentence: (node.properties?.departSentence as string) ?? `${node.name} goes their own way.`,
    reason,
  };

  if (edge) graph.removeEdge(edge.id);
  graph.removeNode(companionId);

  emitTrace({
    tick,
    category: 'companion_departed',
    bearerId,
    companionId,
    companionName: node.name,
    templateId: (node.properties?.templateId as string) ?? '',
    reason,
    ticksAccompanied: Math.max(0, tick - sinceTick),
    summary: `${node.name} leaves ${bearerId || 'their bearer'} (${reason})`,
  } as unknown as TraceEntry);

  return result;
}

/**
 * Decrement contracted companions by one tick and remove those whose contract
 * has run out. Called from the condition-expiry phase — companions ride the
 * existing phase rather than adding one, and permanent companions cost nothing
 * per tick because they carry no `ticksRemaining`.
 *
 * Also collects companions whose bearer has gone missing, so an orphaned card
 * does not linger in the graph.
 */
export function expireCompanions(
  graph: WorldGraph,
  tick: number,
): RemoveCompanionResult[] {
  const departed: RemoveCompanionResult[] = [];

  // Orphans first. `WorldGraph.removeNode` cascades edge removal, so a departed
  // bearer leaves a companion node with *no* `accompanies` edge at all — the
  // edge walk below cannot see it, and it would linger in the graph forever.
  for (const node of [...graph.getNodesByType('companion')]) {
    if (graph.getIncomingEdges(node.id, 'accompanies').length === 0) {
      const orphan = removeCompanion(graph, node.id, 'bearer_missing', tick);
      if (orphan) departed.push(orphan);
    }
  }

  for (const edge of [...graph.getEdgesByType('accompanies')]) {
    // A bearer that still holds the edge but has lost its node is the other
    // orphan shape — belt and braces, since both are cheap.
    if (!graph.getNode(edge.source)) {
      const orphan = removeCompanion(graph, edge.target, 'bearer_missing', tick);
      if (orphan) departed.push(orphan);
      continue;
    }

    const remaining = edge.properties?.ticksRemaining;
    if (remaining === undefined || remaining === null) continue;
    if (typeof remaining !== 'number') continue;

    const next = remaining - 1;
    if (next <= 0) {
      const gone = removeCompanion(graph, edge.target, 'contract_ended', tick);
      if (gone) departed.push(gone);
    } else {
      graph.updateEdge(edge.id, {
        properties: { ...edge.properties, ticksRemaining: next },
      });
    }
  }

  return departed;
}
