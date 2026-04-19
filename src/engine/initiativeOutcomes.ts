// src/engine/initiativeOutcomes.ts
// Executes the outcome list of a completed initiative (THR-51).
// Each outcome type mutates the graph and/or GameState.

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type { InitiativeProgress, InitiativeTemplate } from '../types/initiative';
import type { TickEvent } from '../types/gameState';
import type { FactionDefinition, FactionType } from '../types/faction';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import { createSublocation, recordIntelligence } from './strategicGraphOps';
import { getAgentsAtLocation } from './graphQueries';
import { seedFactionFromDefinition } from './factionSeeding';
import { emitTrace } from './traceBuffer';
import { FACTION_REPUTATION_DECAY_PER_TICK } from '../data/faction-constants';
import type { SimulationRuntime } from './simulationRuntime';
import { applyEncounterCacheUpdate } from './simulationRuntime';

export interface OutcomeResult {
  newEvents: TickEvent[];
  /** New encounter seeds planted by spawn_encounter outcomes */
  newEncounterSeeds: PendingEncounterSeed[];
  /** Dynamic faction definitions created by create_faction outcomes */
  newFactionDefinitions: Record<string, FactionDefinition>;
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
  runtime?: SimulationRuntime,
): OutcomeResult {
  const newEvents: TickEvent[] = [];
  const newEncounterSeeds: PendingEncounterSeed[] = [];
  const newFactionDefinitions: Record<string, FactionDefinition> = {};
  const agentNode = graph.getNode(progress.actorId);
  if (!agentNode) return { newEvents, newEncounterSeeds, newFactionDefinitions };

  for (const outcome of template.outcomes) {
    try {
      switch (outcome.type) {
        case 'create_sublocation': {
          const locationNode = graph.getNode(progress.locationId);
          if (!locationNode) break;
          const name = generateSublocationName(
            agentNode.name, outcome.sublocationTypeId, progress.sphereColoring,
          );
          const result = createSublocation(
            graph,
            progress.locationId,
            progress.actorId,
            name,
            outcome.sublocationTypeId,
            state.tick,
          );
          if (result.success && result.createdId && runtime) {
            const createdId = result.createdId;
            const parentId = progress.locationId;
            applyEncounterCacheUpdate(runtime, cache =>
              cache.onSublocationCreated(graph, createdId, parentId));
          }
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

        case 'spawn_encounter': {
          // Push a pending encounter seed — evaluated by evaluateEncounterSeeds next tick.
          const seed: PendingEncounterSeed = {
            seedId: `initiative_seed_${progress.initiativeId}_${state.tick}`,
            sourceEncounterId: progress.initiativeId,
            sourceReactionId: 'initiative_outcome',
            templateId: outcome.templateId,
            targetAgentId: progress.actorId,
            eligibleAfterTick: state.tick + 1,
            priority: 2,
            seedLabel: `initiative:${progress.templateId}`,
            plantedTick: state.tick,
          };
          newEncounterSeeds.push(seed);
          break;
        }

        case 'create_faction': {
          const locationNode = graph.getNode(progress.locationId);
          if (!locationNode) break;
          const def = buildDynamicFactionDefinition(
            agentNode.name, progress.actorId, state.tick, progress.sphereColoring,
            (agentNode.properties.domainCapabilities as Record<string, number> | undefined) ?? {},
          );
          const factionSeed = simpleHash(progress.actorId) + state.tick * 31;
          seedFactionFromDefinition(graph, def, [progress.locationId], factionSeed);
          newFactionDefinitions[def.id] = def;
          emitTrace({
            category: 'initiative_completed',
            tick: state.tick,
            agentId: progress.actorId,
            initiativeId: progress.initiativeId,
            templateId: progress.templateId,
            locationId: progress.locationId,
            summary: `${agentNode.name} founded '${def.nameTemplate}' at ${locationNode.name}`,
          });
          newEvents.push({
            id: `initiative_faction_${progress.initiativeId}_${state.tick}`,
            tick: state.tick,
            type: 'faction_founded',
            message: `${agentNode.name} founded ${def.nameTemplate} at ${locationNode.name}!`,
            significance: 0.9,
            actorId: progress.actorId,
          });
          break;
        }
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

  return { newEvents, newEncounterSeeds, newFactionDefinitions };
}

// ─── Dynamic Faction Definition Builder ─────────────────────────────────────

function buildDynamicFactionDefinition(
  agentName: string,
  agentId: string,
  tick: number,
  sphereColoring: string | undefined,
  caps: Record<string, number>,
): FactionDefinition {
  const topDomains = Object.entries(caps)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([d]) => d);

  const factionType: FactionType =
    topDomains.includes('star') || topDomains.includes('veil') ? 'religious' :
    topDomains.includes('shadow') || topDomains.includes('eye') ? 'criminal' :
    topDomains.includes('iron') ? 'military' : 'guild';

  const iconGlyph = factionType === 'religious' ? '✦' :
    factionType === 'criminal' ? '◈' :
    factionType === 'military' ? '⚔' : '⚙';

  const themeColor = sphereColoring === 'star' ? '#C0A070' :
    sphereColoring === 'shadow' ? '#7060A0' : '#8090A0';

  const reachWeights: Partial<Record<string, number>> = {};
  for (const [d, v] of Object.entries(caps)) {
    reachWeights[d] = Math.min(0.8, v as number);
  }

  return {
    id: `dynamic_${agentId.slice(-8)}_${tick}`,
    nameTemplate: `${agentName}'s ${factionType === 'religious' ? 'Order' : factionType === 'criminal' ? 'Brotherhood' : factionType === 'military' ? 'Company' : 'Guild'}`,
    description: `A ${factionType} organization founded by ${agentName}.`,
    iconGlyph,
    themeColor,
    factionType,
    reachWeights: reachWeights as Partial<Record<import('../types/traits').ReachDomain, number>>,
    locationTypes: ['town', 'city', 'capital'],
    rankTiers: [
      { id: 'member', name: 'Member', minReputation: 0, maxSlots: null, bonuses: [], encounterAccess: [] },
      { id: 'leader', name: 'Leader', minReputation: 0.7, maxSlots: 1, bonuses: [], encounterAccess: [] },
    ],
    reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK,
    joinEncounterTemplateId: '',
    promotionEncounterTemplateId: '',
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [],
  };
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
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
