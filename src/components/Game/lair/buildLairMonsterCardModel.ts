/**
 * The lair's monster card, as the sidebar renders it (plan doc
 * `Docs/plans/2026-09-23-fight-on-screen.md` § UI pillar 3; F1 THR-1550, F4 THR-1552).
 *
 * F1 put the monster's **name** on the card, as a link (the lair block used to
 * print the elite's raw node id, a Law 14/21 defect). F4 adds the rest of the card:
 *   - **the card sentence** (Law 16): the family line, then the Dread and Might
 *     phrases, and the temper clause once the temper has shown
 *     (`monsterState.temperShown`, written by plan doc 2's FB4). It is the same
 *     sentence the opponent header says, built by the same function;
 *   - **the clock**: square pips and the clock-state word (Law 13, never a digit),
 *     read through `readOpponentCard`, so the lair shows the *recovered* clock the
 *     next fight starts from;
 *   - **the slain reading.** When no living monster holds the lair, the card
 *     looks for the dead one: first the lair's own `namedEliteId`, then a reverse
 *     lookup for the retained deceased elite whose `lairId` names this lair (the
 *     latest `deceasedTick` wins). A legendary lair keeps its lair but loses its
 *     `namedEliteId` when the beast is felled, and a major lair becomes a cleared
 *     lair, so both need the lookup. The killer is named **only** when the
 *     monster's own sheet names one (`getAgentInfoCard(...).death.by`, behind
 *     `killerIsKnown`), so the card and the sheet never disagree about who did it.
 *
 * Pure: reads the graph, never writes it, emits no traces (the plan's Tracing
 * section is N/A: render correctness is asserted through
 * `window.__DEBUG.getLairMonsterCard`, which returns this model). The caller
 * memoizes it on `worldVersion` (NFP #7), because the death reading is not O(1).
 */

import type { WorldGraph } from '../../../engine/graph';
import type { GraphNode } from '../../../types/graph';
import { isMonster } from '../../../engine/monsters/isMonster';
import { readOpponentCard } from '../../../engine/fights/opponentCard';
import { getAgentInfoCard } from '../../../engine/agentDetail';
import {
  buildSentence,
  clockModel,
  familyLineFor,
  type OpponentHeaderClockModel,
  type OpponentSentenceSegment,
} from '../encounter-stage/adapters/buildOpponentHeaderModel';

/**
 * The knowledge level the death reading is asked at. The sheet sets `.death`
 * before any knowledge gate, so the level does not change the answer. It is
 * pinned at the lowest one so the card never learns more than a stranger would.
 */
export const LAIR_CARD_DEATH_KNOWLEDGE = 'stranger' as const;

/** The monster row of a lair card. */
export interface LairMonsterRow {
  /** The monster's node id: the link target, never rendered as text. */
  readonly id: string;
  /** The monster's name, as its sheet shows it. */
  readonly name: string;
  /** True when the monster is dead: the card reads "slain". */
  readonly deceased: boolean;
  /** The card sentence as clauses, each carrying its tooltip (Law 16/17). */
  readonly sentence: readonly OpponentSentenceSegment[];
  /** The whole sentence as plain text (tests, debug). */
  readonly sentenceText: string;
  /** Whether the temper clause is in the sentence (it has shown). */
  readonly temperShown: boolean;
  /** The clock: square pips and the clock-state word ("slain" once dead). */
  readonly clock: OpponentHeaderClockModel;
  /** The killer's name, present only when the monster's sheet names one. */
  readonly slainBy?: string;
  /** The killer's node id (the link target), present with `slainBy`. */
  readonly slainById?: string;
}

/** What the sidebar's lair card shows about the lair's monster. */
export interface LairMonsterCardModel {
  readonly lairId: string;
  readonly lairName: string;
  /**
   * The monster that holds (or held) the lair, or `null` when none resolves.
   * `null` omits the row: a raw id never renders (plan § Fail-soft).
   */
  readonly monster: LairMonsterRow | null;
}

/**
 * Build the lair card for `lairId` at `tick`. Returns `null` when the lair node
 * itself is missing (NFP #4: the caller renders nothing rather than a broken card).
 *
 * The monster resolves in order: the living `namedEliteId`; else the slain
 * monster of this lair (the `namedEliteId` if it points at a retained dead
 * elite, else the reverse lookup by `lairId`). A node with no name of its own is
 * never shown, and neither is a dangling id.
 *
 * `ascendantId` feeds the sheet read that names a killer. The death reading does
 * not depend on it, so the debug accessor and tests may leave it out.
 */
export function buildLairMonsterCardModel(
  graph: WorldGraph,
  lairId: string,
  tick = 0,
  ascendantId = '',
): LairMonsterCardModel | null {
  const lair = graph.getNode(lairId);
  if (!lair) return null;
  const node = resolveLivingMonster(graph, lair.properties?.namedEliteId)
    ?? resolveSlainMonster(graph, lair.id, lair.properties?.namedEliteId);
  return {
    lairId: lair.id,
    lairName: lair.name ?? '',
    monster: node ? buildRow(graph, node, tick, ascendantId) : null,
  };
}

function nameOf(node: GraphNode): string | null {
  const name = typeof node.name === 'string' ? node.name.trim() : '';
  return name.length === 0 || name === node.id ? null : name;
}

function isDead(node: GraphNode): boolean {
  return node.properties?.deceased === true || node.properties?.status === 'dead';
}

function resolveLivingMonster(graph: WorldGraph, eliteId: unknown): GraphNode | null {
  if (typeof eliteId !== 'string' || eliteId.length === 0) return null;
  const node = graph.getNode(eliteId);
  if (!node || !isMonster(node) || isDead(node) || !nameOf(node)) return null;
  return node;
}

/**
 * The lair's slain monster: the `namedEliteId` when it points at a retained dead
 * monster, else the dead monster whose `lairId` names this lair, latest
 * `deceasedTick` first (then id, NFP #3).
 */
function resolveSlainMonster(graph: WorldGraph, lairId: string, eliteId: unknown): GraphNode | null {
  if (typeof eliteId === 'string' && eliteId.length > 0) {
    const named = graph.getNode(eliteId);
    if (named && isMonster(named) && isDead(named) && nameOf(named)) return named;
  }
  let best: GraphNode | null = null;
  let bestTick = -Infinity;
  for (const node of graph.getNodesByType('actor')) {
    if (node.properties?.lairId !== lairId) continue;
    if (!isMonster(node) || !isDead(node) || !nameOf(node)) continue;
    const died = typeof node.properties.deceasedTick === 'number' ? node.properties.deceasedTick : -1;
    if (died > bestTick || (died === bestTick && best !== null && node.id.localeCompare(best.id) < 0)) {
      best = node;
      bestTick = died;
    }
  }
  return best;
}

function buildRow(graph: WorldGraph, node: GraphNode, tick: number, ascendantId: string): LairMonsterRow {
  const deceased = isDead(node);
  const card = readOpponentCard(graph, node.id, tick);
  const bag = node.properties.monsterState as Record<string, unknown> | undefined;
  const temperShown = bag?.temperShown === true;
  const sentence = buildSentence(familyLineFor(bag, true), card.dread, card.might, card.temper, temperShown);
  // A slain monster's clock reads full and "slain", whatever it last recorded.
  const clock = deceased
    ? clockModel(card.clockSize, card.clockSize, true)
    : clockModel(card.clockFilled, card.clockSize, false);

  let slainBy: string | undefined;
  let slainById: string | undefined;
  if (deceased) {
    try {
      const sheet = getAgentInfoCard(graph, node.id, ascendantId, LAIR_CARD_DEATH_KNOWLEDGE, 0, tick);
      if (sheet?.death?.by) {
        slainBy = sheet.death.by;
        const killerId = node.properties.slainBy;
        if (typeof killerId === 'string' && graph.getNode(killerId)) slainById = killerId;
      }
    } catch {
      // Fail-soft (plan § Fail-soft): an unreadable sheet names nobody — "slain".
    }
  }

  return {
    id: node.id,
    name: nameOf(node) ?? '',
    deceased,
    sentence,
    sentenceText: sentence.map((s) => s.text).join(''),
    temperShown,
    clock,
    ...(slainBy ? { slainBy } : {}),
    ...(slainById ? { slainById } : {}),
  };
}
