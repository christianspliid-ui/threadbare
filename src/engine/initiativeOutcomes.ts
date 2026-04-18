// src/engine/initiativeOutcomes.ts
// Executes the outcome list of a completed initiative (THR-51).
// Each outcome type mutates the graph and/or GameState.

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type { InitiativeProgress, InitiativeTemplate } from '../types/initiative';
import type { TickEvent } from '../types/gameState';
import { createSublocation, recordIntelligence } from './strategicGraphOps';
import { getAgentsAtLocation } from './graphQueries';
import { emitTrace } from './traceBuffer';

export interface OutcomeResult {
  newEvents: TickEvent[];
}

/**
 * Execute all outcomes for a completed initiative.
 * Mutates graph in place. Fail-soft per outcome — one failing outcome doesn't abort others.
 */
export function executeInitiativeOutcomes(
  state: GameState,
  graph: WorldGraph,
  progress: InitiativeProgress,
  template: InitiativeTemplate,
): OutcomeResult {
  const newEvents: TickEvent[] = [];
  const agentNode = graph.getNode(progress.actorId);
  if (!agentNode) return { newEvents };

  for (const outcome of template.outcomes) {
    try {
      switch (outcome.type) {
        case 'create_sublocation': {
          const locationNode = graph.getNode(progress.locationId);
          if (!locationNode) break;
          const name = generateSublocationName(
            agentNode.name, outcome.sublocationTypeId, progress.sphereColoring,
          );
          createSublocation(
            graph,
            progress.locationId,
            progress.actorId,
            name,
            outcome.sublocationTypeId,
            state.tick,
          );
          newEvents.push({
            id: `initiative_sublocation_${progress.initiativeId}_${state.tick}`,
            tick: state.tick,
            type: 'world_change',
            message: `A ${formatSublocationTypeName(outcome.sublocationTypeId)} was established at ${locationNode.name} by ${agentNode.name}.`,
            significance: 0.8,
            actorId: progress.actorId,
          });
          break;
        }

        case 'create_bonds': {
          const targets = getAgentsAtLocation(graph, progress.locationId)
            .filter(a => a.id !== progress.actorId)
            .slice(0, outcome.count);
          for (const target of targets) {
            const edgeIdFwd = `bond_${progress.actorId}_${target.id}_${outcome.bondBasis}`;
            const edgeIdRev = `bond_${target.id}_${progress.actorId}_${outcome.bondBasis}`;
            if (!graph.getEdge(edgeIdFwd)) {
              graph.addEdge({
                id: edgeIdFwd,
                source: progress.actorId,
                target: target.id,
                type: 'relates_to',
                properties: { sentiment: 0.6, strength: 0.4, basis: outcome.bondBasis, trust: 0.5 },
              });
            }
            if (!graph.getEdge(edgeIdRev)) {
              graph.addEdge({
                id: edgeIdRev,
                source: target.id,
                target: progress.actorId,
                type: 'relates_to',
                properties: { sentiment: 0.5, strength: 0.3, basis: outcome.bondBasis, trust: 0.4 },
              });
            }
          }
          if (targets.length > 0) {
            newEvents.push({
              id: `initiative_bonds_${progress.initiativeId}_${state.tick}`,
              tick: state.tick,
              type: 'social',
              message: `${agentNode.name} formed bonds with ${targets.map(t => t.name).join(', ')}.`,
              significance: 0.5,
              actorId: progress.actorId,
            });
          }
          break;
        }

        case 'temporary_location_boost': {
          const locationNode = graph.getNode(progress.locationId);
          if (!locationNode) break;
          locationNode.properties[outcome.property] = outcome.value;
          locationNode.properties[`${outcome.property}ExpiresAtTick`] = state.tick + outcome.duration;
          newEvents.push({
            id: `initiative_festival_${progress.initiativeId}_${state.tick}`,
            tick: state.tick,
            type: 'world_change',
            message: `A festival has begun at ${locationNode.name}!`,
            significance: 0.7,
            actorId: progress.actorId,
          });
          break;
        }

        case 'create_edge': {
          const edgeId = `${outcome.edgeType}_${progress.actorId}_${progress.locationId}_${outcome.edgeBasis ?? 'default'}`;
          if (!graph.getEdge(edgeId)) {
            graph.addEdge({
              id: edgeId,
              source: progress.actorId,
              target: progress.locationId,
              type: outcome.edgeType as 'relates_to',
              properties: {
                basis: outcome.edgeBasis ?? '',
                strength: 0.6,
                sentiment: 0.0,
                trust: 0.3,
                networkActive: true,
                networkEstablishedTick: state.tick,
              },
            });
          }
          break;
        }

        case 'record_intelligence': {
          recordIntelligence(
            graph,
            progress.actorId,
            progress.locationId,
            outcome.intelligenceType,
            state.tick,
          );
          break;
        }

        case 'spawn_encounter':
          // TODO(THR-158): Dynamic quest encounter generation — see deep design §5
          break;

        case 'create_faction':
          // TODO(THR-157): Dynamic faction generation — see deep design §1
          break;
      }
    } catch {
      // Fail-soft: one outcome failure doesn't abort others
      emitTrace({
        category: 'initiative_completed',
        tick: state.tick,
        agentId: progress.actorId,
        initiativeId: progress.initiativeId,
        templateId: progress.templateId,
        locationId: progress.locationId,
        summary: `outcome '${outcome.type}' threw during execution — skipped`,
      });
    }
  }

  return { newEvents };
}

function generateSublocationName(
  agentName: string,
  sublocationTypeId: string,
  sphere?: string,
): string {
  if (sublocationTypeId.includes('shrine')) {
    const sphereLabel = sphere ? `of ${capitalize(sphere)}` : '';
    return `${agentName}'s Shrine ${sphereLabel}`.trim();
  }
  if (sublocationTypeId.includes('guild-hall')) {
    return `${agentName}'s Guild Hall`;
  }
  return `${agentName}'s ${formatSublocationTypeName(sublocationTypeId)}`;
}

function formatSublocationTypeName(typeId: string): string {
  const segment = typeId.split('.').pop() ?? typeId;
  return segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
