/**
 * One rule for reading a mortal's mind (THR-1433).
 *
 * The god may read what a mortal *intends* — the ambition they pursue and the work
 * it heads toward — through any of three doors:
 *
 *   1. **familiarity** — the god has watched them to `INTENTION_KNOWLEDGE_TIER`;
 *   2. **a mark** — a mortal the god follows holds an unrevealed `knows_secret_of`
 *      edge on them (a spider dug something up, and the god follows the spider);
 *   3. **a network** — a ring whose leader the god follows has a living member
 *      within `NETWORK_READ_REACH_HEXES` of them.
 *
 * Doors 2 and 3 are the point of the ticket: a mortal's intelligence work counts as
 * the god's own knowledge (Christian, THR-1404), so running a network and digging up
 * secrets changes what the player can see on a sheet. Before this, nothing a mortal
 * learned reached the god's reading of anyone.
 *
 * **A secret intention** — an active undertaking on a cell in `SECRET_CELL_IDS`
 * (the plot) — closes door 1. Familiarity never reveals a murder in the making;
 * a mark or a network does.
 *
 * One module, one predicate, called by every surface that decides whether to show
 * a mortal's mind: the sheet's intention line and ambition strands, the encounter
 * receipt. `through` and `via` come back so a surface can say *how* the god knows
 * (Law 17), never a numeral. Pure, read-only, never throws (NFP #4).
 */

import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { KnowledgeLevel } from '../types/familiarity';
import type { WorldGraph } from './graph';
import { KNOWLEDGE_LEVELS } from '../types/familiarity';
import { INTENTION_KNOWLEDGE_TIER } from '../types/agentKnowledge';
import { NETWORK_READ_REACH_HEXES, SECRET_CELL_IDS } from '../data/intention-reading-constants';
import { getFamiliarity, getKnowledgeLevel } from './familiarity';
import { isFollowed } from './followedAgents';
import { getActiveGroups, getGroupLeader } from './groups/groupQueries';
import { ringMemberHexes } from './strategicGraphOps';
import { resolveAgentHex } from './relocationIntent';
import { hexDistance } from '../lib/hexMath';

/** Which door the reading came through. */
export type IntentionReadThrough = 'familiarity' | 'mark' | 'network';

export type IntentionRead =
  | {
      readonly readable: true;
      readonly through: IntentionReadThrough;
      /** The mark-holder (mark) or the network node (network); absent for familiarity. */
      readonly via?: string;
      /** The name behind `via`, for the surface's sentence. */
      readonly viaName?: string;
      /** Whether the mortal's current work is a secret cell — read only through a mark or a network. */
      readonly secret: boolean;
    }
  | { readonly readable: false; readonly secret: boolean };

export interface CanReadIntentionOptions {
  /**
   * The knowledge tier to read the familiarity door with, when the caller has
   * already lifted it (the debug omniscience flag reads every sheet at
   * `transparent`). Absent: derived from the god's familiarity map.
   */
  readonly knowledgeLevel?: KnowledgeLevel;
}

/** `level` is at or above `minimum` on the knowledge ladder. */
export function knowledgeAtLeast(level: KnowledgeLevel, minimum: KnowledgeLevel): boolean {
  return KNOWLEDGE_LEVELS.indexOf(level) >= KNOWLEDGE_LEVELS.indexOf(minimum);
}

/** Whether a template id names a secret cell, or an override of one. */
export function isSecretCellId(templateId: string | undefined | null): boolean {
  if (typeof templateId !== 'string') return false;
  return SECRET_CELL_IDS.some(id => templateId === id || templateId.startsWith(`${id}.`));
}

/**
 * The secret work a mortal is in the middle of, if any — the template id of their
 * active undertaking on a secret cell — else `null`.
 */
export function secretIntentionOf(state: GameState, mortalId: string): string | null {
  const projects = state.strategicState?.projects ?? [];
  const secret = projects.find(p => p.actorId === mortalId && p.status === 'active' && isSecretCellId(p.templateId));
  return secret?.templateId ?? null;
}

/** A followed mortal's unrevealed mark on `mortalId`, if the god follows any holder. */
function markHolderFollowedBy(state: GameState, graph: WorldGraph, mortalId: string): GraphNode | undefined {
  const holders = graph.getIncomingEdges(mortalId, 'knows_secret_of')
    .filter(e => e.source !== mortalId && e.properties?.revealed !== true)
    .map(e => e.source)
    .sort();
  for (const holderId of holders) {
    if (isFollowed(state, graph, holderId)) return graph.getNode(holderId);
  }
  return undefined;
}

/** A followed network with a living member within reach of `mortalId`, if any. */
function networkInReachFollowedBy(state: GameState, graph: WorldGraph, mortalId: string): GraphNode | undefined {
  const target = resolveAgentHex(graph, mortalId);
  if (!target) return undefined;
  const rings = getActiveGroups(graph, ['network']).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const ring of rings) {
    const leader = getGroupLeader(graph, ring.id);
    if (!leader || !isFollowed(state, graph, leader.id)) continue;
    const near = ringMemberHexes(graph, ring.id).some(({ hex }) => hexDistance(hex, target) <= NETWORK_READ_REACH_HEXES);
    if (near) return ring;
  }
  return undefined;
}

/**
 * Whether `godId` may read `mortalId`'s intention, and through which door.
 *
 * Door order is the plainest reason first — familiarity, then a mark, then a network
 * — so the tooltip says "you know them well" when that is true, and names the spy or
 * the ring only when the god's own watching would not have sufficed. A secret
 * intention skips the familiarity door entirely. Only the ascendant holds a
 * familiarity map today, so any other reader reads through mortals alone.
 */
export function canReadIntention(
  state: GameState,
  godId: string,
  mortalId: string,
  opts: CanReadIntentionOptions = {},
): IntentionRead {
  try {
    const graph = state.graph;
    const secret = secretIntentionOf(state, mortalId) !== null;

    if (!secret && godId === state.ascendantId) {
      const level = opts.knowledgeLevel ?? getKnowledgeLevel(getFamiliarity(state.familiarityMap, mortalId));
      if (knowledgeAtLeast(level, INTENTION_KNOWLEDGE_TIER)) {
        return { readable: true, through: 'familiarity', secret };
      }
    }

    const holder = markHolderFollowedBy(state, graph, mortalId);
    if (holder) return { readable: true, through: 'mark', via: holder.id, viaName: holder.name, secret };

    const ring = networkInReachFollowedBy(state, graph, mortalId);
    if (ring) return { readable: true, through: 'network', via: ring.id, viaName: ring.name, secret };

    return { readable: false, secret };
  } catch {
    // Fail-soft: a broken read closes the door rather than opening it.
    return { readable: false, secret: false };
  }
}

/**
 * The predicate's answer for a rendered card.
 *
 * The sheet's tabs hold a card, not the state; the hook that builds the card stamps
 * the live answer on it (`intentionRead`). A card built without one — an older
 * caller, a test fixture — falls back to the familiarity door on the card's own
 * tier, so the one tier compare outside `canReadIntention` still lives in this file.
 */
export function readIntentionFromCard(card: {
  readonly knowledgeLevel: KnowledgeLevel;
  readonly intentionRead?: IntentionRead;
}): IntentionRead {
  if (card.intentionRead) return card.intentionRead;
  return knowledgeAtLeast(card.knowledgeLevel, INTENTION_KNOWLEDGE_TIER)
    ? { readable: true, through: 'familiarity', secret: false }
    : { readable: false, secret: false };
}

/**
 * How the god knows, in words, for the tooltip (Law 17). `name` is the mortal's.
 * No numeral, no tier word.
 */
export function describeIntentionRead(read: IntentionRead, name: string): string {
  if (!read.readable) return '';
  switch (read.through) {
    case 'familiarity':
      return `You have watched ${name} long enough to know what they want.`;
    case 'mark':
      return read.viaName
        ? `${read.viaName}, whom you follow, holds a secret of ${name}'s — and what a follower knows, you know.`
        : `A mortal you follow holds a secret of ${name}'s.`;
    case 'network':
      return read.viaName
        ? `${read.viaName}'s people are near ${name}, and their patron is someone you follow — their eyes are yours.`
        : `A network you follow has people near ${name}.`;
  }
}
