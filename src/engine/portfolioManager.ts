import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { emitTrace } from './traceBuffer';

/** Maximum number of agents the player can have pinned as protagonists at once. */
export const PORTFOLIO_MAX_PINNED = 7;

/** Returns true when the agent node has the portfolio-pinned flag set. */
export function isPortfolioPinned(node: GraphNode): boolean {
  return node.properties.isPortfolioPinned === true;
}

/** Returns all actor nodes currently marked as portfolio-pinned. */
export function getPortfolioPinnedAgents(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('actor').filter(isPortfolioPinned);
}

export interface PortfolioPinResult {
  success: boolean;
  message: string;
  pinnedCount: number;
}

/**
 * Pin an agent as a protagonist. Enforces PORTFOLIO_MAX_PINNED cap.
 * Emits a portfolio.pinned trace on success.
 */
export function pinAgent(graph: WorldGraph, agentId: string, tick: number): PortfolioPinResult {
  const node = graph.getNode(agentId);
  if (!node) return { success: false, message: `Agent '${agentId}' not found.`, pinnedCount: 0 };
  if (node.type !== 'actor') return { success: false, message: `Node '${agentId}' is not an actor.`, pinnedCount: 0 };

  if (isPortfolioPinned(node)) {
    const pinnedCount = getPortfolioPinnedAgents(graph).length;
    return { success: false, message: `${node.name} is already portfolio-pinned.`, pinnedCount };
  }

  const currentPinned = getPortfolioPinnedAgents(graph);
  if (currentPinned.length >= PORTFOLIO_MAX_PINNED) {
    return {
      success: false,
      message: `Portfolio is full (${PORTFOLIO_MAX_PINNED} max). Unpin another agent first.`,
      pinnedCount: currentPinned.length,
    };
  }

  node.properties.isPortfolioPinned = true;
  const pinnedCount = currentPinned.length + 1;

  emitTrace({
    category: 'portfolio.pinned',
    tick,
    agentId,
    agentName: node.name,
    pinnedCount,
    summary: `${node.name} added to protagonist portfolio (${pinnedCount}/${PORTFOLIO_MAX_PINNED})`,
  });

  return { success: true, message: `${node.name} pinned to portfolio.`, pinnedCount };
}

/**
 * Unpin an agent from the protagonist portfolio.
 * Emits a portfolio.unpinned trace on success.
 */
export function unpinAgent(graph: WorldGraph, agentId: string, tick: number): PortfolioPinResult {
  const node = graph.getNode(agentId);
  if (!node) return { success: false, message: `Agent '${agentId}' not found.`, pinnedCount: 0 };
  if (node.type !== 'actor') return { success: false, message: `Node '${agentId}' is not an actor.`, pinnedCount: 0 };

  if (!isPortfolioPinned(node)) {
    const pinnedCount = getPortfolioPinnedAgents(graph).length;
    return { success: false, message: `${node.name} is not portfolio-pinned.`, pinnedCount };
  }

  node.properties.isPortfolioPinned = false;
  const pinnedCount = getPortfolioPinnedAgents(graph).length;

  emitTrace({
    category: 'portfolio.unpinned',
    tick,
    agentId,
    agentName: node.name,
    pinnedCount,
    summary: `${node.name} removed from protagonist portfolio (${pinnedCount}/${PORTFOLIO_MAX_PINNED} remaining)`,
  });

  return { success: true, message: `${node.name} unpinned from portfolio.`, pinnedCount };
}
