import type { GameState } from '../types/gameState';
import type { EncounterProgress, EncounterTemplate } from '../types/encounter';
import type { EncounterNotification } from '../types/encounterVisibility';
import type { CourtPosition, ThreadEdgeProperties } from '../types/influence';
import type { UnifiedAction } from '../types/unifiedAction';
import { buildEncounterNotification } from './encounterVisibility';
import { VISIBILITY_BY_POSITION } from '../types/encounterVisibility';
import { getAnyEncounterById } from '../data/encounter-content';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { getAgentLocationId } from './graphQueries';
import { prepareEncounterSupportBundle, prepareEncounterSupportBundleForContext } from './encounterSupportBundle';
import { initializeClearanceGates } from './clearanceGate';
import { createUnifiedAction } from './unifiedActionLifecycle';
import { mulberry32 } from '../lib/prng';
import { selectDefaultTrackedHero } from './balanceTelemetry';
import { moveDebugAgent, spawnDebugLocationAtHex } from './debugWorldSpawnTools';
import type { DebugWorldSpawnResult } from './debugWorldSpawnTools';
import type { EncounterSupportBinding } from '../types/encounter';

export interface DebugSpawnEncounterOptions {
  courtPosition?: CourtPosition;
  open?: boolean;
}

export interface DebugSpawnEncounterContextOptions {
  agentQuery?: string;
  locationQuery?: string;
  col?: number;
  row?: number;
  moveAgent?: boolean;
}

export interface DebugSpawnEncounterResult {
  success: boolean;
  templateId?: string;
  templateName?: string;
  mode?: 'unified' | 'legacy';
  actionId?: string;
  notificationId?: string;
  message: string;
}

export interface DebugSpawnEncounterContextResult {
  success: boolean;
  templateId?: string;
  templateName?: string;
  mode?: 'unified' | 'legacy';
  agentId?: string;
  agentName?: string;
  anchorLocationId?: string;
  anchorLocationName?: string;
  bindings?: EncounterSupportBinding[];
  blockedKeys?: string[];
  unresolvedKeys?: string[];
  createdAnchor?: boolean;
  movedAgent?: boolean;
  message: string;
}

export interface PreparedDebugEncounterSpawn {
  success: boolean;
  message: string;
  mode?: 'unified' | 'legacy';
  agent?: { id: string; name: string };
  template?: EncounterTemplate;
  notification?: EncounterNotification;
  encounterProgress?: EncounterProgress;
  unifiedAction?: UnifiedAction;
  clearanceGateStates?: Map<string, import('../types/contentShells').ClearanceGateRuntimeState>;
}

function findAgent(state: GameState, agentQuery: string) {
  const actors = state.graph.getNodesByType('actor');
  const query = agentQuery.trim().toLowerCase();

  if (query === '@hero') {
    const heroCandidates = actors.filter(node => node.properties.actorType === 'individual');
    const heroId = selectDefaultTrackedHero(heroCandidates.map(node => node.id));
    return heroCandidates.find(node => node.id === heroId) ?? heroCandidates[0];
  }

  if (query === '@ascendant') {
    return actors.find(node => node.id === state.ascendantId);
  }

  return actors.find(node =>
    node.id === agentQuery
    || node.id.startsWith(agentQuery)
    || node.name.toLowerCase().includes(agentQuery.toLowerCase()),
  );
}

function resolveTemplate(templateQuery: string): EncounterTemplate | undefined {
  const exact = getAnyEncounterById(templateQuery);
  if (exact) return exact;
  return undefined;
}

function normalizeAnchorLocationId(state: GameState, locationId: string): string {
  const locationNode = state.graph.getNode(locationId);
  if (locationNode?.type === 'location') {
    const parentLocationId = locationNode.properties.parentLocationId as string | undefined;
    return parentLocationId ?? locationId;
  }
  return locationId;
}

function topLevelLocationsAtHex(state: GameState, col: number, row: number) {
  return state.graph.getNodesByType('location').filter(node =>
    node.properties.parentLocationId === undefined
    && node.properties.hexCol === col
    && node.properties.hexRow === row,
  );
}

function formatHexLocationSummary(state: GameState, col: number, row: number): string {
  return topLevelLocationsAtHex(state, col, row)
    .map(node => {
      const subtype = (node.properties.locationSubtype as string | undefined)
        ?? (node.properties.locationType as string | undefined)
        ?? 'unknown';
      return `${node.name} (${subtype})`;
    })
    .join(', ');
}

function resolveLocationAnchor(state: GameState, query: string) {
  const locations = state.graph.getNodesByType('location');
  const normalized = query.trim().toLowerCase();
  const locationMatch = locations.find(node =>
    node.id === query
    || node.id.startsWith(query)
    || node.name.toLowerCase().includes(normalized),
  );
  if (locationMatch) return locationMatch;

  const actor = findAgent(state, query);
  if (!actor) return null;
  const locationId = getAgentLocationId(state.graph, actor.id);
  if (!locationId) return null;
  return state.graph.getNode(locationId) ?? null;
}

function chooseAnchorLocation(
  state: GameState,
  template: EncounterTemplate,
  options: DebugSpawnEncounterContextOptions,
): { locationId: string; locationName: string; createdAnchor: boolean } | { error: string } {
  if (options.locationQuery) {
    const location = resolveLocationAnchor(state, options.locationQuery);
    if (!location) return { error: `No location matching '${options.locationQuery}'.` };
    const normalizedId = normalizeAnchorLocationId(state, location.id);
    const normalizedNode = state.graph.getNode(normalizedId);
    return {
      locationId: normalizedId,
      locationName: normalizedNode?.name ?? normalizedId,
      createdAnchor: false,
    };
  }

  if (options.col !== undefined && options.row !== undefined) {
    const locationsAtHex = topLevelLocationsAtHex(state, options.col, options.row);
    const validAtHex = locationsAtHex.find(node => {
      const subtype = node.properties.locationSubtype as string | undefined;
      return subtype !== undefined && template.locationTypes.includes(subtype as never);
    });
    if (validAtHex) {
      return {
        locationId: validAtHex.id,
        locationName: validAtHex.name,
        createdAnchor: false,
      };
    }

    if (locationsAtHex.length > 0) {
      return {
        error: `Hex ${options.col},${options.row} is already occupied by ${formatHexLocationSummary(state, options.col, options.row)} and cannot safely host a temporary ${template.locationTypes[0] ?? 'encounter'} anchor. Use --at <settlement>, choose an empty hex, or move the agent first.`,
      };
    }

    const fallbackSubtype = template.locationTypes[0];
    if (!fallbackSubtype) {
      return { error: `Encounter '${template.id}' has no valid anchor location type.` };
    }
    const spawned = spawnDebugLocationAtHex(state, fallbackSubtype, options.col, options.row, {
      name: `${template.name} Test ${fallbackSubtype[0]?.toUpperCase() ?? ''}${fallbackSubtype.slice(1)}`
    });
    if (!spawned.success || !spawned.locationId || !spawned.locationName) {
      return { error: spawned.message };
    }
    return {
      locationId: spawned.locationId,
      locationName: spawned.locationName,
      createdAnchor: !spawned.reused,
    };
  }

  if (options.agentQuery) {
    const agent = findAgent(state, options.agentQuery);
    if (!agent) return { error: `No agent matching '${options.agentQuery}'.` };
    const locationId = getAgentLocationId(state.graph, agent.id);
    if (!locationId) return { error: `${agent.name} has no location anchor for encounter testing` };
    const normalizedId = normalizeAnchorLocationId(state, locationId);
    const normalizedNode = state.graph.getNode(normalizedId);
    return {
      locationId: normalizedId,
      locationName: normalizedNode?.name ?? normalizedId,
      createdAnchor: false,
    };
  }

  return { error: 'spawn encounter-context requires --agent <agent>, --at <location|actor>, or --hex <col> <row>.' };
}

function getThreadContext(
  state: GameState,
  agentId: string,
  preferredCourtPosition?: CourtPosition,
): { courtPosition: CourtPosition; attentionMode: 'pause' | 'auto_resolve' } {
  const defaultCourtPosition = preferredCourtPosition ?? 'retinue';
  if (!state.ascendantId) {
    return {
      courtPosition: defaultCourtPosition,
      attentionMode: VISIBILITY_BY_POSITION[defaultCourtPosition].defaultAttentionMode,
    };
  }

  const edge = state.graph.getOutgoingEdges(state.ascendantId, 'thread').find(candidate => candidate.target === agentId);
  const props = edge?.properties as ThreadEdgeProperties | undefined;
  const courtPosition = preferredCourtPosition ?? props?.courtPosition ?? 'retinue';
  const attentionMode = props?.attentionMode ?? VISIBILITY_BY_POSITION[courtPosition].defaultAttentionMode;
  return { courtPosition, attentionMode };
}

function makeUiProgress(template: EncounterTemplate, actorId: string, tick: number, occupiedUntilTick?: number): EncounterProgress {
  return {
    encounterId: template.id,
    actorId,
    currentEncounterIndex: 0,
    history: [],
    status: 'active',
    startedTick: tick,
    occupiedUntilTick,
  };
}

export function prepareDebugEncounterSpawn(
  state: GameState,
  agentQuery: string,
  templateQuery: string,
  options: DebugSpawnEncounterOptions = {},
): PreparedDebugEncounterSpawn {
  const agent = findAgent(state, agentQuery);
  if (!agent) {
    return {
      success: false,
      message: `No agent matching '${agentQuery}'`,
    };
  }

  const template = resolveTemplate(templateQuery);
  if (!template) {
    return {
      success: false,
      message: `No encounter template matching '${templateQuery}'. Use the exact encounter id for now.`,
    };
  }

  const locationId = getAgentLocationId(state.graph, agent.id);
  if (!locationId) {
    return {
      success: false,
      message: `${agent.name} has no location anchor for encounter testing`,
    };
  }

  const locationName = state.graph.getNode(locationId)?.name ?? 'unknown location';
  const { courtPosition, attentionMode } = getThreadContext(state, agent.id, options.courtPosition);
  const notification = buildEncounterNotification(
    agent.id,
    agent.name,
    template.id,
    template.name,
    locationName,
    courtPosition,
    attentionMode,
    state.tick,
  );

  if (!notification) {
    return {
      success: false,
      message: `Encounter visibility is disabled for ${agent.name}`,
    };
  }

  const unifiedTemplate = getUnifiedTemplateById(template.id);
  if (unifiedTemplate) {
    const supportBindings = prepareEncounterSupportBundle(state, unifiedTemplate, locationId);
    const gateInit = initializeClearanceGates(
      state.clearanceGateStates,
      unifiedTemplate,
      supportBindings,
      locationId,
      state.tick,
    );
    const rng = mulberry32(state.seed + state.tick * 43 + agent.id.length);
    const action = createUnifiedAction({
      actorId: agent.id,
      templateId: unifiedTemplate.id,
      targetId: locationId,
      scale: unifiedTemplate.scale,
      source: 'system',
      tick: state.tick,
      template: unifiedTemplate,
      rng,
      supportBindings,
      clearanceGateIds: gateInit.gateIds,
    });

    return {
      success: true,
      message: `Spawned '${template.name}' on '${agent.name}'`,
      mode: 'unified',
      agent: { id: agent.id, name: agent.name },
      template,
      notification,
      unifiedAction: action,
      clearanceGateStates: gateInit.clearanceGateStates,
    };
  }

  const firstStepDuration = template.steps[0]?.duration ?? 1;
  const progress = makeUiProgress(template, agent.id, state.tick, state.tick + firstStepDuration);

  return {
    success: true,
    message: `Spawned '${template.name}' on '${agent.name}'`,
    mode: 'legacy',
    agent: { id: agent.id, name: agent.name },
    template,
    notification,
    encounterProgress: progress,
  };
}

export function prepareDebugEncounterContext(
  state: GameState,
  templateQuery: string,
  options: DebugSpawnEncounterContextOptions = {},
): DebugSpawnEncounterContextResult {
  const template = resolveTemplate(templateQuery);
  if (!template) {
    return {
      success: false,
      message: `No encounter template matching '${templateQuery}'. Use the exact encounter id for now.`,
    };
  }

  const unifiedTemplate = getUnifiedTemplateById(template.id);
  if (!unifiedTemplate) {
    return {
      success: false,
      templateId: template.id,
      templateName: template.name,
      mode: 'legacy',
      message: `Encounter '${template.name}' has no unified support-bundle context path yet.`,
    };
  }

  const anchor = chooseAnchorLocation(state, template, options);
  if ('error' in anchor) {
    return {
      success: false,
      templateId: template.id,
      templateName: template.name,
      mode: 'unified',
      message: anchor.error,
    };
  }

  const prepared = prepareEncounterSupportBundleForContext(state, unifiedTemplate, anchor.locationId, anchor.locationId);
  let movedAgent = false;
  let agentId: string | undefined;
  let agentName: string | undefined;
  if (options.agentQuery) {
    const agent = findAgent(state, options.agentQuery);
    if (agent) {
      agentId = agent.id;
      agentName = agent.name;
      if (options.moveAgent ?? true) {
        const moveResult: DebugWorldSpawnResult = moveDebugAgent(state, options.agentQuery, {
          locationQuery: anchor.locationId,
        }, {
          destinationLabel: anchor.locationName,
        });
        movedAgent = moveResult.success && !moveResult.reused;
      }
    }
  }

  const reused = prepared.bindings.filter(binding => binding.reused).length;
  const materialized = prepared.bindings.length - reused;
  const blockedKeys = prepared.blocked.map(spec => spec.key);
  const unresolvedKeys = prepared.unresolved.map(spec => spec.key);
  const parts = [
    `Prepared '${template.name}' context at '${anchor.locationName}'.`,
    reused > 0 ? `${reused} reused` : null,
    materialized > 0 ? `${materialized} materialized` : null,
    anchor.createdAnchor ? 'anchor created' : null,
    movedAgent ? `moved ${agentName ?? 'agent'}` : null,
    blockedKeys.length > 0 ? `blocked: ${blockedKeys.join(', ')}` : null,
    unresolvedKeys.length > 0 ? `unresolved: ${unresolvedKeys.join(', ')}` : null,
  ].filter(Boolean);

  return {
    success: unresolvedKeys.length === 0,
    templateId: template.id,
    templateName: template.name,
    mode: 'unified',
    agentId,
    agentName,
    anchorLocationId: anchor.locationId,
    anchorLocationName: anchor.locationName,
    bindings: prepared.bindings,
    blockedKeys,
    unresolvedKeys,
    createdAnchor: anchor.createdAnchor,
    movedAgent,
    message: parts.join(' | '),
  };
}
