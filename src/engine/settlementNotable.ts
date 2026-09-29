/**
 * settlementNotable — who matters in a settlement, read from the graph (THR-1655, slice S4 of
 * THR-1630; plan doc `Docs/plans/2026-09-27-thr-1630-notables-and-ties.md` § UI pillar 2).
 *
 * The settlement page lifts its seeded notable to the top of Inhabitants with one sentence:
 * *Holds* the Tanner's Yard. *At odds with* Kael. *Knows something about* Ysolde. That sentence
 * is built from this selector's structured clauses, never from prose — the producer declares
 * the concepts (Law 2), the component only picks the words. `window.__DEBUG.getSettlementNotable`
 * returns the same object, so the surface cannot drift from state.
 *
 * Every clause is read live at render from the edges `seedLivingWorld.seedNotables` wrote:
 *
 * | Clause            | Edge                                                   |
 * |-------------------|--------------------------------------------------------|
 * | `holds`           | notable →`owns`→ Place / location                      |
 * | `at_odds_with`    | notable →`hostile_to`→ X, `cause: 'old_quarrel'`       |
 * | `knows_secret_of` | notable →`knows_secret_of`→ X, not yet `revealed`      |
 * | `is_owed_by`      | X →`owes_favor`→ notable, neither redeemed nor broken   |
 *
 * A clause whose edge is gone (or whose other end is dead) is dropped; the sentence is
 * omitted when nothing is left. The secret clause is the one fact gated on the player's
 * knowledge of the notable: with a familiarity map it renders only at `known` or above.
 *
 * Pure and fail-soft: a missing node or a throwing read yields `null`, never an exception.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { FamiliarityMap, KnowledgeLevel } from '../types/familiarity';
import { getFamiliarity, getKnowledgeLevel } from './familiarity';
import { NOTABLE_ORIGIN_WORLDGEN } from '../data/worldgen-living-constants';

/** The `hostile_to` cause a seeded notable's quarrel carries (`seedNotables`). */
export const NOTABLE_QUARREL_CAUSE = 'old_quarrel';

/** The lowest knowledge of the notable at which the player may read their secret. */
export const NOTABLE_SECRET_MIN_KNOWLEDGE: KnowledgeLevel = 'known';

const KNOWLEDGE_RANK: Record<KnowledgeLevel, number> = {
  stranger: 0,
  recognised: 1,
  known: 2,
  intimate: 3,
  transparent: 4,
};

export type SettlementNotableClauseKind = 'holds' | 'at_odds_with' | 'knows_secret_of' | 'is_owed_by';

export interface SettlementNotableClause {
  kind: SettlementNotableClauseKind;
  targetId: string;
  targetName: string;
  /** What the target opens as — a Place routes to its place card, a person to their sheet. */
  targetKind: 'agent' | 'location' | 'sublocation';
}

export interface SettlementNotable {
  notableId: string;
  notableName: string;
  /** The clauses the player may read, in sentence order (holds, quarrel, secret, favour). */
  clauses: SettlementNotableClause[];
  /** True when a secret clause exists but the player does not know the notable well enough. */
  secretWithheld: boolean;
}

export interface SettlementNotableOptions {
  /**
   * The player's familiarity. When present, the secret clause is gated at
   * {@link NOTABLE_SECRET_MIN_KNOWLEDGE}; when absent (debug reads), every clause is returned.
   */
  familiarityMap?: FamiliarityMap;
}

const CLAUSE_ORDER: SettlementNotableClauseKind[] = ['holds', 'at_odds_with', 'knows_secret_of', 'is_owed_by'];

function isAlive(node: GraphNode | undefined): node is GraphNode {
  return !!node && node.properties.alive !== false;
}

/** Whether `node` stands in `settlementId` — on it directly or in one of its Places. */
function standsIn(graph: WorldGraph, node: GraphNode, settlementId: string): boolean {
  const at = graph.getOutgoingEdges(node.id, 'located_at')[0]?.target;
  if (!at) return false;
  if (at === settlementId) return true;
  return graph.getNode(at)?.properties.parentLocationId === settlementId;
}

/** The settlement's seeded notable — alive and resident — by id when there are several. */
function findNotable(graph: WorldGraph, settlementId: string): GraphNode | undefined {
  const candidates: GraphNode[] = [];
  const consider = (locId: string): void => {
    for (const e of graph.getIncomingEdges(locId, 'located_at')) {
      const node = graph.getNode(e.source);
      if (!isAlive(node) || node.type !== 'actor') continue;
      if (node.properties.notableOrigin !== NOTABLE_ORIGIN_WORLDGEN) continue;
      candidates.push(node);
    }
  };
  consider(settlementId);
  for (const place of graph.getNodesByType('location')) {
    if (place.properties.parentLocationId === settlementId) consider(place.id);
  }
  return candidates
    .filter(n => standsIn(graph, n, settlementId))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
}

function clauseFor(
  graph: WorldGraph,
  kind: SettlementNotableClauseKind,
  targetId: string,
): SettlementNotableClause | null {
  const target = graph.getNode(targetId);
  if (!target) return null;
  if (target.type === 'location') {
    return {
      kind,
      targetId,
      targetName: target.name ?? targetId,
      targetKind: typeof target.properties.parentLocationId === 'string' ? 'sublocation' : 'location',
    };
  }
  if (!isAlive(target)) return null;
  return { kind, targetId, targetName: target.name ?? targetId, targetKind: 'agent' };
}

/**
 * The notable of `locationId` and what the player may read of them, or `null` when the
 * settlement has no living, resident seeded notable.
 */
export function getSettlementNotable(
  graph: WorldGraph,
  locationId: string,
  options: SettlementNotableOptions = {},
): SettlementNotable | null {
  try {
    const notable = findNotable(graph, locationId);
    if (!notable) return null;

    const raw: SettlementNotableClause[] = [];
    const push = (kind: SettlementNotableClauseKind, targetId: string): void => {
      if (raw.some(c => c.kind === kind && c.targetId === targetId)) return;
      const clause = clauseFor(graph, kind, targetId);
      if (clause) raw.push(clause);
    };

    for (const e of graph.getOutgoingEdges(notable.id, 'owns')) push('holds', e.target);
    for (const e of graph.getOutgoingEdges(notable.id, 'hostile_to')) {
      if (e.properties?.cause === NOTABLE_QUARREL_CAUSE) push('at_odds_with', e.target);
    }
    for (const e of graph.getOutgoingEdges(notable.id, 'knows_secret_of')) {
      if (e.properties?.revealed !== true) push('knows_secret_of', e.target);
    }
    for (const e of graph.getIncomingEdges(notable.id, 'owes_favor')) {
      if (e.properties?.redeemed !== true && e.properties?.broken !== true) push('is_owed_by', e.source);
    }

    let secretWithheld = false;
    let clauses = raw;
    if (options.familiarityMap) {
      const level = getKnowledgeLevel(getFamiliarity(options.familiarityMap, notable.id));
      if (KNOWLEDGE_RANK[level] < KNOWLEDGE_RANK[NOTABLE_SECRET_MIN_KNOWLEDGE]) {
        secretWithheld = raw.some(c => c.kind === 'knows_secret_of');
        clauses = raw.filter(c => c.kind !== 'knows_secret_of');
      }
    }

    clauses = [...clauses].sort(
      (a, b) => CLAUSE_ORDER.indexOf(a.kind) - CLAUSE_ORDER.indexOf(b.kind)
        || (a.targetId < b.targetId ? -1 : a.targetId > b.targetId ? 1 : 0),
    );

    return {
      notableId: notable.id,
      notableName: notable.name ?? notable.id,
      clauses,
      secretWithheld,
    };
  } catch {
    return null;
  }
}
