/**
 * The lair's monster card, as the sidebar renders it (THR-1550, plan doc
 * `Docs/plans/2026-09-23-fight-on-screen.md` § UI pillar 3, slice F1).
 *
 * F1 carries the **name only**: the lair block used to print the elite's raw
 * node id (`HexSidebar` "Elite: elite_…", a Law 14/21 defect), and the card now
 * names it and links it. F4 (THR-1552) extends this same model with the card
 * sentence, the clock pips and the slain reading (the reverse lookup by
 * `lairId`), so the sidebar and `window.__DEBUG.getLairMonsterCard` keep reading
 * one view-model.
 *
 * Pure: reads the graph, never writes it, emits no traces (the plan's Tracing
 * section is N/A — render correctness is asserted through the debug accessor).
 */

import type { WorldGraph } from '../../../engine/graph';
import { isMonster } from '../../../engine/monsters/isMonster';

/** The monster row of a lair card. */
export interface LairMonsterRow {
  /** The monster's node id — the link target, never rendered as text. */
  readonly id: string;
  /** The monster's name, as its sheet shows it. */
  readonly name: string;
}

/** What the sidebar's lair block shows about the lair's monster. */
export interface LairMonsterCardModel {
  readonly lairId: string;
  readonly lairName: string;
  /**
   * The living monster that holds the lair, or `null` when none resolves.
   * `null` omits the row: a raw id never renders (plan § Fail-soft).
   */
  readonly monster: LairMonsterRow | null;
}

/**
 * Build the lair card for `lairId`. Returns `null` when the lair node itself
 * is missing (NFP #4 — the caller renders nothing rather than a broken card).
 *
 * The monster row resolves from the lair's `namedEliteId` and is kept only when
 * that node exists, is a monster, is alive and carries a name of its own. Every
 * other case — a dangling id, a slain elite (F4's slain row), a node minted
 * with no name — omits the row.
 *
 * `_tick` is the pinned signature's clock-recovery input; F1 renders no clock.
 */
export function buildLairMonsterCardModel(
  graph: WorldGraph,
  lairId: string,
  _tick?: number,
): LairMonsterCardModel | null {
  const lair = graph.getNode(lairId);
  if (!lair) return null;
  return {
    lairId: lair.id,
    lairName: lair.name ?? '',
    monster: resolveLivingMonster(graph, lair.properties?.namedEliteId),
  };
}

function resolveLivingMonster(graph: WorldGraph, eliteId: unknown): LairMonsterRow | null {
  if (typeof eliteId !== 'string' || eliteId.length === 0) return null;
  const node = graph.getNode(eliteId);
  if (!node || !isMonster(node)) return null;
  if (node.properties?.deceased === true) return null;
  const name = typeof node.name === 'string' ? node.name.trim() : '';
  if (name.length === 0 || name === node.id) return null;
  return { id: node.id, name };
}
