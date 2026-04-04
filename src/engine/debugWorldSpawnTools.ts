import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { LocationSubtype } from '../types';
import type { NpcRole, SpotlightTier } from '../types/npc';
import { NPC_ROLE_SUBLOCATION_MAP } from '../types/npc';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { getAgentLocationId, getAllActorsAtLocation, getSublocationsAt, getAvatarsOf } from './graphQueries';
import { selectDefaultTrackedHero } from './balanceTelemetry';
import { instantiateReward, REWARD_INSTANTIATE_PREFIX } from './rewardPool';

/** Build a resolution note showing what a query resolved to, so misresolution is visible. */
function resolutionNote(query: string, resolvedId: string, resolvedName: string): string {
  const q = query.trim().toLowerCase();
  if (q === resolvedId.toLowerCase() || q === resolvedName.toLowerCase()) return '';
  return ` (resolved '${query}' → ${resolvedName} [${resolvedId}])`;
}

export interface DebugWorldSpawnResult {
  success: boolean;
  kind?: 'location' | 'sublocation' | 'npc' | 'agent' | 'attachment';
  nodeId?: string;
  nodeName?: string;
  locationId?: string;
  locationName?: string;
  reused?: boolean;
  message: string;
}

export interface DebugSpawnLocationOptions {
  name?: string;
}

export interface DebugSpawnSublocationOptions {
  name?: string;
}

export interface DebugSpawnNpcOptions {
  name?: string;
  factionDefId?: string;
  spotlightTier?: SpotlightTier;
}

export interface DebugMoveAgentOptions {
  destinationLabel?: string;
}

export interface DebugSpawnAttachmentOptions {
  tick?: number;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function titleCaseFromId(raw: string): string {
  return raw
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part[0] ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ');
}

function topLevelLocationsAtHex(state: GameState, col: number, row: number): GraphNode[] {
  return state.graph.getNodesByType('location').filter(node =>
    node.properties.parentLocationId === undefined
    && node.properties.hexCol === col
    && node.properties.hexRow === row,
  );
}

function locationPriority(node: GraphNode): number {
  const subtype = node.properties.locationSubtype as string | undefined;
  switch (subtype) {
    case 'capital': return 0;
    case 'city': return 1;
    case 'town': return 2;
    case 'hamlet': return 3;
    case 'fort': return 4;
    case 'castle': return 5;
    default: return 10;
  }
}

function bestTopLevelLocationAtHex(state: GameState, col: number, row: number): GraphNode | null {
  const candidates = topLevelLocationsAtHex(state, col, row)
    .sort((a, b) => locationPriority(a) - locationPriority(b) || a.name.localeCompare(b.name));
  return candidates[0] ?? null;
}

function findAgentNode(state: GameState, query: string): GraphNode | undefined {
  const actors = state.graph.getNodesByType('actor');
  const normalized = normalize(query);
  if (normalized === '@avatar') {
    const avatars = getAvatarsOf(state.graph, state.ascendantId);
    return avatars[0];
  }
  if (normalized === '@hero') {
    const avatars = getAvatarsOf(state.graph, state.ascendantId);
    if (avatars.length > 0) return avatars[0];
    const heroCandidates = actors.filter(node => node.properties.actorType === 'individual');
    const heroId = selectDefaultTrackedHero(heroCandidates.map(node => node.id));
    return heroCandidates.find(node => node.id === heroId) ?? heroCandidates[0];
  }
  if (normalized === '@ascendant') {
    return actors.find(node => node.id === state.ascendantId);
  }
  return actors.find(node =>
    node.id === query
    || node.id.startsWith(query)
    || node.name.toLowerCase().includes(normalized),
  );
}

function findActorNode(state: GameState, query: string): GraphNode | undefined {
  const actors = state.graph.getNodesByType('actor');
  const normalized = normalize(query);
  if (normalized === '@avatar' || normalized === '@hero' || normalized === '@ascendant') {
    return findAgentNode(state, query);
  }
  return actors.find(node =>
    node.id === query
    || node.id.startsWith(query)
    || node.name.toLowerCase().includes(normalized),
  );
}

function resolveLocationAnchor(state: GameState, query: string): GraphNode | null {
  const locations = state.graph.getNodesByType('location');
  const normalized = normalize(query);
  const locationMatch = locations.find(node =>
    node.id === query
    || node.id.startsWith(query)
    || node.name.toLowerCase().includes(normalized),
  );
  if (locationMatch) return locationMatch;

  const actor = findAgentNode(state, query);
  if (!actor) return null;
  const locationId = getAgentLocationId(state.graph, actor.id);
  if (!locationId) return null;
  return state.graph.getNode(locationId) ?? null;
}

function resolveParentLocation(state: GameState, query?: string, col?: number, row?: number): GraphNode | null {
  const location = query
    ? resolveLocationAnchor(state, query)
    : (col !== undefined && row !== undefined ? bestTopLevelLocationAtHex(state, col, row) : null);
  if (!location) return null;

  const parentId = location.properties.parentLocationId as string | undefined;
  if (parentId) {
    return state.graph.getNode(parentId) ?? null;
  }
  return location;
}

function resolvePlacementLocation(state: GameState, query?: string, col?: number, row?: number): GraphNode | null {
  if (query) {
    return resolveLocationAnchor(state, query);
  }
  const parent = col !== undefined && row !== undefined ? bestTopLevelLocationAtHex(state, col, row) : null;
  return parent;
}

function resolveAttachmentTemplate(state: GameState, query: string): GraphNode | null {
  const normalized = normalize(query);
  const candidates = [
    ...state.graph.getNodesByType('artifact'),
    ...state.graph.getNodesByType('artifact_legendary'),
    ...state.graph.getNodesByType('trait'),
  ];

  const exact = candidates.find(node => node.id === query);
  if (exact) return exact;

  const prefix = candidates.find(node => node.id.startsWith(query));
  if (prefix) return prefix;

  return candidates.find(node => node.name.toLowerCase().includes(normalized)) ?? null;
}

function nextRewardTick(state: GameState, recipientAgentId: string, templateNodeId: string, requestedTick?: number): number {
  let tick = requestedTick ?? state.tick;
  while (state.graph.getNode(`${REWARD_INSTANTIATE_PREFIX}_${recipientAgentId}_${tick}_${templateNodeId}`)) {
    tick += 1;
  }
  return tick;
}

function rebindLocatedAt(state: GameState, actorId: string, locationId: string): void {
  const oldEdges = state.graph.getOutgoingEdges(actorId, 'located_at');
  for (const edge of oldEdges) {
    state.graph.removeEdge(edge.id);
  }
  state.graph.addEdge({
    id: `debug_located_at_${actorId}_${locationId}`,
    source: actorId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function copyCurrentCulture(state: GameState, sourceLocationId: string, targetNodeId: string): void {
  const source = state.graph.getNode(sourceLocationId);
  const currentCulture = state.graph.getOutgoingEdges(sourceLocationId, 'belongs_to').find(edge =>
    edge.properties.cultureLayer === 'current',
  ) ?? state.graph.getOutgoingEdges(sourceLocationId, 'belongs_to')[0];
  if (!source || !currentCulture) return;
  const edgeId = `debug_belongs_to_${targetNodeId}_${currentCulture.target}`;
  if (state.graph.getEdge(edgeId)) return;
  state.graph.addEdge({
    id: edgeId,
    source: targetNodeId,
    target: currentCulture.target,
    type: 'belongs_to',
    properties: { ...currentCulture.properties },
  });
}

function findFactionNodeId(state: GameState, factionDefId: string | undefined): string | null {
  if (!factionDefId) return null;
  for (const node of state.graph.getNodesByType('actor')) {
    if (
      node.properties.actorType === 'faction'
      && node.properties.factionDefId === factionDefId
    ) {
      return node.id;
    }
  }
  return null;
}

function nextNodeId(state: GameState, prefix: string): string {
  let index = 1;
  while (true) {
    const candidate = `${prefix}_${index}`;
    if (!state.graph.getNode(candidate)) return candidate;
    index += 1;
  }
}

function defaultLocationName(subtype: string, col: number, row: number): string {
  return `${titleCaseFromId(subtype)} (${col}, ${row})`;
}

function defaultSublocationName(typeId: string, parentName: string): string {
  return `${titleCaseFromId(typeId)} (${parentName})`;
}

function defaultNpcName(role: string, locationName: string): string {
  return `${titleCaseFromId(role)} of ${locationName}`;
}

function preferredPlacementForRole(state: GameState, parentLocation: GraphNode, role: NpcRole): GraphNode {
  const preferredType = NPC_ROLE_SUBLOCATION_MAP[role];
  if (!preferredType) return parentLocation;
  const sublocation = getSublocationsAt(state.graph, parentLocation.id).find(node =>
    node.properties.sublocationTypeId === preferredType,
  );
  return sublocation ?? parentLocation;
}

export function spawnDebugLocationAtHex(
  state: GameState,
  subtype: LocationSubtype | string,
  col: number,
  row: number,
  options: DebugSpawnLocationOptions = {},
): DebugWorldSpawnResult {
  const desiredName = options.name ?? defaultLocationName(subtype, col, row);
  const cultureSource = bestTopLevelLocationAtHex(state, col, row);
  const existing = topLevelLocationsAtHex(state, col, row).find(node =>
    node.properties.locationSubtype === subtype
    && node.name === desiredName,
  );
  if (existing) {
    return {
      success: true,
      kind: 'location',
      nodeId: existing.id,
      nodeName: existing.name,
      locationId: existing.id,
      locationName: existing.name,
      reused: true,
      message: `Reused '${existing.name}' at (${col}, ${row}).`,
    };
  }

  const locationId = nextNodeId(state, `debug_loc_${slugify(subtype)}_${col}_${row}`);
  state.graph.addNode({
    id: locationId,
    type: 'location',
    name: desiredName,
    properties: {
      hexCol: col,
      hexRow: row,
      locationSubtype: subtype,
      locationType: subtype,
      settlementTier: ['hamlet', 'town', 'city', 'capital'].includes(subtype) ? subtype : undefined,
      generatedBy: 'debug_spawn',
    },
  });

  if (cultureSource) {
    copyCurrentCulture(state, cultureSource.id, locationId);
  }

  return {
    success: true,
    kind: 'location',
    nodeId: locationId,
    nodeName: desiredName,
    locationId,
    locationName: desiredName,
    reused: false,
    message: `Spawned location '${desiredName}' at (${col}, ${row}).`,
  };
}

export function spawnDebugSublocation(
  state: GameState,
  sublocationTypeId: string,
  anchor: { locationQuery?: string; col?: number; row?: number },
  options: DebugSpawnSublocationOptions = {},
): DebugWorldSpawnResult {
  const parent = resolveParentLocation(state, anchor.locationQuery, anchor.col, anchor.row);
  if (!parent) {
    return {
      success: false,
      message: anchor.locationQuery
        ? `No location matching '${anchor.locationQuery}'.`
        : 'No parent location found at that hex.',
    };
  }

  const desiredName = options.name ?? defaultSublocationName(sublocationTypeId, parent.name);
  const existing = getSublocationsAt(state.graph, parent.id).find(node =>
    node.properties.sublocationTypeId === sublocationTypeId
    && (!options.name || node.name === desiredName),
  );
  if (existing) {
    return {
      success: true,
      kind: 'sublocation',
      nodeId: existing.id,
      nodeName: existing.name,
      locationId: parent.id,
      locationName: parent.name,
      reused: true,
      message: `Reused sublocation '${existing.name}' under '${parent.name}'.`,
    };
  }

  const nodeId = nextNodeId(state, `debug_subloc_${slugify(sublocationTypeId)}_${slugify(parent.id)}`);
  state.graph.addNode({
    id: nodeId,
    type: 'location',
    name: desiredName,
    properties: {
      sublocationTypeId,
      parentLocationId: parent.id,
      generatedBy: 'debug_spawn',
    },
  });
  state.graph.addEdge({
    id: `debug_contains_${parent.id}_${nodeId}`,
    source: parent.id,
    target: nodeId,
    type: 'contains',
    properties: {},
  });

  return {
    success: true,
    kind: 'sublocation',
    nodeId,
    nodeName: desiredName,
    locationId: parent.id,
    locationName: parent.name,
    reused: false,
    message: `Spawned sublocation '${desiredName}' under '${parent.name}'.`,
  };
}

export function spawnDebugNpc(
  state: GameState,
  role: NpcRole | string,
  anchor: { locationQuery?: string; col?: number; row?: number },
  options: DebugSpawnNpcOptions = {},
): DebugWorldSpawnResult {
  const resolvedLocation = resolvePlacementLocation(state, anchor.locationQuery, anchor.col, anchor.row);
  if (!resolvedLocation) {
    return {
      success: false,
      message: anchor.locationQuery
        ? `No location matching '${anchor.locationQuery}'.`
        : 'No location found at that hex.',
    };
  }

  const parentLocationId = (resolvedLocation.properties.parentLocationId as string | undefined) ?? resolvedLocation.id;
  const parentLocation = state.graph.getNode(parentLocationId) ?? resolvedLocation;
  const placement = resolvedLocation.properties.parentLocationId
    ? resolvedLocation
    : preferredPlacementForRole(state, resolvedLocation, role as NpcRole);
  const desiredName = options.name ?? defaultNpcName(role, placement.name);

  const existingActors = getAllActorsAtLocation(state.graph, placement.id)
    .filter(node => node.properties.actorType === 'individual');
  const reusable = existingActors.find(node =>
    node.properties.npcRole === role
    && node.name === desiredName,
  ) ?? (
    !options.name
      ? existingActors.filter(node => node.properties.npcRole === role)[0]
      : undefined
  );
  if (reusable) {
    return {
      success: true,
      kind: 'npc',
      nodeId: reusable.id,
      nodeName: reusable.name,
      locationId: placement.id,
      locationName: placement.name,
      reused: true,
      message: `Reused NPC '${reusable.name}' at '${placement.name}'.`,
    };
  }

  const nodeId = nextNodeId(state, `debug_npc_${slugify(role)}_${slugify(placement.id)}`);
  state.graph.addNode({
    id: nodeId,
    type: 'actor',
    name: desiredName,
    properties: {
      actorType: 'individual',
      spotlightTier: options.spotlightTier ?? 'ambient',
      npcRole: role,
      generatedBy: 'debug_spawn',
      importance: 0,
      reputationScore: DEFAULT_REPUTATION,
      sphereAffinity: null,
    },
  });
  state.graph.addEdge({
    id: `debug_located_at_${nodeId}_${placement.id}`,
    source: nodeId,
    target: placement.id,
    type: 'located_at',
    properties: {},
  });

  copyCurrentCulture(state, parentLocation.id, nodeId);
  const factionNodeId = findFactionNodeId(state, options.factionDefId);
  if (factionNodeId) {
    state.graph.addEdge({
      id: `debug_member_of_${nodeId}_${factionNodeId}`,
      source: nodeId,
      target: factionNodeId,
      type: 'member_of',
      properties: {
        role,
        rank: 0.05,
        joinedTick: state.tick,
      },
    });
  }

  return {
    success: true,
    kind: 'npc',
    nodeId,
    nodeName: desiredName,
    locationId: placement.id,
    locationName: placement.name,
    reused: false,
    message: `Spawned NPC '${desiredName}' at '${placement.name}'.`,
  };
}

export function moveDebugAgent(
  state: GameState,
  agentQuery: string,
  anchor: { locationQuery?: string; col?: number; row?: number },
  options: DebugMoveAgentOptions = {},
): DebugWorldSpawnResult {
  const actor = findActorNode(state, agentQuery);
  if (!actor) {
    return {
      success: false,
      message: `No actor matching '${agentQuery}'.`,
    };
  }

  const destination = resolvePlacementLocation(state, anchor.locationQuery, anchor.col, anchor.row);
  if (!destination) {
    return {
      success: false,
      message: anchor.locationQuery
        ? `No location matching '${anchor.locationQuery}'.`
        : 'No location found at that hex.',
    };
  }

  const actorNote = resolutionNote(agentQuery, actor.id, actor.name);
  const currentLocationId = getAgentLocationId(state.graph, actor.id);
  if (currentLocationId === destination.id) {
    return {
      success: true,
      kind: 'agent',
      nodeId: actor.id,
      nodeName: actor.name,
      locationId: destination.id,
      locationName: destination.name,
      reused: true,
      message: `${actor.name} is already at '${destination.name}'.${actorNote}`,
    };
  }

  rebindLocatedAt(state, actor.id, destination.id);

  return {
    success: true,
    kind: 'agent',
    nodeId: actor.id,
    nodeName: actor.name,
    locationId: destination.id,
    locationName: destination.name,
    reused: false,
    message: `Moved '${actor.name}' to '${options.destinationLabel ?? destination.name}'.${actorNote}`,
  };
}

export function spawnDebugAttachment(
  state: GameState,
  agentQuery: string,
  templateQuery: string,
  options: DebugSpawnAttachmentOptions = {},
): DebugWorldSpawnResult {
  const actor = findActorNode(state, agentQuery);
  if (!actor) {
    return {
      success: false,
      message: `No actor matching '${agentQuery}'.`,
    };
  }

  const actorNote = resolutionNote(agentQuery, actor.id, actor.name);
  const template = resolveAttachmentTemplate(state, templateQuery);
  if (!template) {
    return {
      success: false,
      message: `No attachment template matching '${templateQuery}'.`,
    };
  }

  const effectiveTick = nextRewardTick(state, actor.id, template.id, options.tick);
  const instantiated = instantiateReward(state.graph, template.id, actor.id, effectiveTick);
  if (!instantiated) {
    return {
      success: false,
      message: `Could not instantiate '${template.name}' on '${actor.name}'.${actorNote}`,
    };
  }

  return {
    success: true,
    kind: 'attachment',
    nodeId: instantiated.instanceId,
    nodeName: instantiated.displayName,
    reused: false,
    message: `Spawned ${instantiated.category} '${instantiated.displayName}' on '${actor.name}' from '${template.name}'.${actorNote}`,
  };
}
