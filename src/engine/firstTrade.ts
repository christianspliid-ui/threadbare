/**
 * The First keeps her trade (THR-1982).
 *
 * The meeting shows the player a healer; this module makes the bond write that
 * trade onto The First (`npcRole` for every system that reads a mortal's role,
 * `tradeWord` for what the player reads), and gives every surface one way to
 * print a mortal's trade (`displayTradeWord`).
 *
 * Two writers call `writeFirstTrade`: the bond (`createAgentFromMeeting`) and the
 * dev seed (`devSeedTheFirst`). Both call it before `giveBirthMeans`, which reads
 * `npcRole` for the Means a mortal is born with.
 */
import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { NpcRole } from '../types/npc';
import { emitTrace } from './traceBuffer';
import { FIRST_TRADE_ENABLED, NPC_ROLE_WORD } from '../data/npc-role-words';

export interface FirstTrade {
  role: NpcRole;
  word: string;
}

/**
 * Write The First's trade onto her node and trace it. No-op (returns false) when
 * the switch is off, the trade is missing (a pre-THR-1982 save or fixture) or the
 * node is gone. Fail-soft: never throws.
 */
export function writeFirstTrade(
  graph: WorldGraph,
  agentId: string,
  trade: FirstTrade | undefined,
  vignetteId: string | null,
  tick: number,
): boolean {
  if (!FIRST_TRADE_ENABLED || !trade) return false;
  const node = graph.getNode(agentId);
  if (!node) return false;
  node.properties.npcRole = trade.role;
  node.properties.tradeWord = trade.word;
  emitTrace({
    category: 'first.trade.written',
    tick,
    agentId,
    vignetteId,
    role: trade.role,
    word: trade.word,
    summary: `${node.name} keeps the trade the god met them in: ${trade.word} (${trade.role})`,
  });
  return true;
}

/** The trade written on a node, or null when it carries none. */
export function readTrade(node: GraphNode | undefined): FirstTrade | null {
  const role = node?.properties.npcRole;
  const word = node?.properties.tradeWord;
  if (typeof role !== 'string' || typeof word !== 'string' || !word) return null;
  return { role: role as NpcRole, word };
}

/**
 * What the player reads for a mortal's work: the authored `tradeWord` first, else
 * the word for its `npcRole` (`NPC_ROLE_WORD`, falling back to the role with `_`
 * as a space for a role outside the table), else null.
 */
export function displayTradeWord(node: Pick<GraphNode, 'properties'> | undefined): string | null {
  const word = node?.properties.tradeWord;
  if (typeof word === 'string' && word.trim()) return word;
  return roleWord(node?.properties.npcRole);
}

/** The table word for a role value, or null for a missing/blank one. */
export function roleWord(role: unknown): string | null {
  if (typeof role !== 'string' || !role) return null;
  return NPC_ROLE_WORD[role as NpcRole] ?? role.replace(/[-_]+/g, ' ').trim();
}

/**
 * The trade as a label for the Inspector's rows and headers: `displayTradeWord`, else
 * the legacy `role` property (non-roled actors such as faction leaders), first letter
 * capitalised. Empty string when the node names no work at all.
 */
export function displayTradeLabel(node: Pick<GraphNode, 'properties'> | undefined): string {
  const word = displayTradeWord(node) ?? roleWord(node?.properties.role);
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : '';
}
