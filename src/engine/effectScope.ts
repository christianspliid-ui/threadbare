/**
 * Effect Scope Resolver — resolves which entities fall within an effect's scope.
 *
 * Takes an EffectScope and returns the set of affected entity IDs.
 * Cached per structuralCacheVersion for permanent scoped effects.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                     | Default | Purpose                        |
 * |--------------------------|---------|--------------------------------|
 * | SCOPE_REGION_MAX_HEXES   | 50      | Max hexes in a region scope    |
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case              | Fallback                         |
 * |---------------------------|----------------------------------|
 * | 0 targets in scope        | No-op, trace empty scope         |
 * | Region exceeds max hexes  | Clamp to SCOPE_REGION_MAX_HEXES  |
 * | Unknown scope type        | Return empty set                 |
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { WorldGraph } from './graph';
import type { EffectScope } from '../types/effects';
import { SCOPE_REGION_MAX_HEXES } from '../data/effect-constants';

// ═══════════════════════════════════════════════════════════════════
// Scope Resolution
// ═══════════════════════════════════════════════════════════════════

export interface ScopeResolution {
  /** Agent IDs affected by this scope */
  affectedAgents: string[];
  /** Hex coordinates affected by this scope */
  affectedHexes: Array<{ col: number; row: number }>;
  /** Whether the scope was truncated (region too large) */
  truncated: boolean;
}

/**
 * Resolve which entities fall within an effect's scope.
 *
 * @param graph - World graph
 * @param scope - Effect scope to resolve
 * @param casterId - Agent who owns the effect
 * @param targetId - Target entity (if any)
 */
export function resolveScope(
  graph: WorldGraph,
  scope: EffectScope,
  casterId: string,
  targetId?: string,
): ScopeResolution {
  switch (scope.scope) {
    case 'self':
      return { affectedAgents: [casterId], affectedHexes: [], truncated: false };

    case 'target':
      return {
        affectedAgents: targetId ? [targetId] : [],
        affectedHexes: [],
        truncated: false,
      };

    case 'hex': {
      const hexAgentId = scope.target === 'self' ? casterId : targetId;
      if (!hexAgentId) return { affectedAgents: [], affectedHexes: [], truncated: false };

      const hex = resolveAgentHex(graph, hexAgentId);
      if (!hex) return { affectedAgents: [], affectedHexes: [], truncated: false };

      const agents = getAgentsOnHex(graph, hex.col, hex.row);
      return { affectedAgents: agents, affectedHexes: [hex], truncated: false };
    }

    case 'radius': {
      const center = resolveAgentHex(graph, casterId);
      if (!center) return { affectedAgents: [], affectedHexes: [], truncated: false };

      const hexes = getHexesInRadius(center.col, center.row, scope.hexes);
      const agents: string[] = [];
      for (const hex of hexes) {
        agents.push(...getAgentsOnHex(graph, hex.col, hex.row));
      }
      return { affectedAgents: agents, affectedHexes: hexes, truncated: false };
    }

    case 'faction': {
      let factionId: string | undefined;
      if (scope.faction === 'self') {
        const casterNode = graph.getNode(casterId);
        factionId = casterNode?.properties.factionId as string | undefined;
      } else if (scope.faction === 'enemy') {
        // Find a hostile faction (simplified)
        factionId = undefined; // Would need relationship resolution
      } else {
        factionId = scope.faction;
      }

      if (!factionId) return { affectedAgents: [], affectedHexes: [], truncated: false };

      const members = graph.getIncomingEdges(factionId, 'member_of');
      return {
        affectedAgents: members.map(e => e.source),
        affectedHexes: [],
        truncated: false,
      };
    }

    case 'region': {
      // Region-scoped effects affect all agents in a named region
      // For now: collect agents on hexes belonging to the region
      // Simplified: use hex distance from caster as proxy
      const center = resolveAgentHex(graph, casterId);
      if (!center) return { affectedAgents: [], affectedHexes: [], truncated: false };

      // Use a default region radius of ~4 hexes, capped by SCOPE_REGION_MAX_HEXES
      const hexes = getHexesInRadius(center.col, center.row, 4);
      const capped = hexes.slice(0, SCOPE_REGION_MAX_HEXES);
      const agents: string[] = [];
      for (const hex of capped) {
        agents.push(...getAgentsOnHex(graph, hex.col, hex.row));
      }
      return {
        affectedAgents: agents,
        affectedHexes: capped,
        truncated: hexes.length > SCOPE_REGION_MAX_HEXES,
      };
    }

    case 'biome': {
      // Affect all agents on hexes of a specific biome type
      const agents: string[] = [];
      const hexes: Array<{ col: number; row: number }> = [];

      const locations = graph.getNodesByType('location');
      for (const loc of locations) {
        const terrain = loc.properties.terrain as string | undefined;
        if (terrain === scope.biome) {
          const col = loc.properties.hexCol as number | undefined;
          const row = loc.properties.hexRow as number | undefined;
          if (col !== undefined && row !== undefined) {
            hexes.push({ col, row });
            agents.push(...getAgentsOnHex(graph, col, row));
          }
        }
        if (hexes.length >= SCOPE_REGION_MAX_HEXES) break;
      }

      return {
        affectedAgents: agents,
        affectedHexes: hexes,
        truncated: hexes.length >= SCOPE_REGION_MAX_HEXES,
      };
    }

    case 'global': {
      const allAgents = graph.getNodesByType('actor')
        .filter(n => n.properties.actorType === 'individual')
        .map(n => n.id);
      return { affectedAgents: allAgents, affectedHexes: [], truncated: false };
    }

    default:
      return { affectedAgents: [], affectedHexes: [], truncated: false };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function resolveAgentHex(
  graph: WorldGraph,
  agentId: string,
): { col: number; row: number } | null {
  const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
  if (locEdges.length === 0) return null;

  const locNode = graph.getNode(locEdges[0].target);
  if (!locNode) return null;

  let col = locNode.properties.hexCol as number | undefined;
  let row = locNode.properties.hexRow as number | undefined;

  if (col === undefined && locNode.properties.parentLocationId) {
    const parent = graph.getNode(locNode.properties.parentLocationId as string);
    if (parent) {
      col = parent.properties.hexCol as number | undefined;
      row = parent.properties.hexRow as number | undefined;
    }
  }

  if (col === undefined || row === undefined) return null;
  return { col, row };
}

function getAgentsOnHex(
  graph: WorldGraph,
  hexCol: number,
  hexRow: number,
): string[] {
  const agents: string[] = [];
  const allAgents = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  for (const agent of allAgents) {
    const pos = resolveAgentHex(graph, agent.id);
    if (pos && pos.col === hexCol && pos.row === hexRow) {
      agents.push(agent.id);
    }
  }

  return agents;
}

function getHexesInRadius(
  centerCol: number,
  centerRow: number,
  radius: number,
): Array<{ col: number; row: number }> {
  const hexes: Array<{ col: number; row: number }> = [];

  // Convert center to axial
  const cq = centerCol - Math.floor(centerRow / 2);
  const cr = centerRow;

  for (let dq = -radius; dq <= radius; dq++) {
    for (let dr = -radius; dr <= radius; dr++) {
      const ds = -dq - dr;
      if (Math.abs(ds) > radius) continue;

      const q = cq + dq;
      const r = cr + dr;

      // Convert back to offset
      const col = q + Math.floor(r / 2);
      const row = r;

      hexes.push({ col, row });
    }
  }

  return hexes;
}
