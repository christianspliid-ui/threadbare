import type { GameState } from '../types/gameState';
import type {
  EncounterSupportActorSpec,
  EncounterSupportBinding,
  EncounterSupportLocationSpec,
  EncounterSupportSpec,
} from '../types/encounter';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { SublocationPersistence } from '../types/sublocation';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { getAgentLocationId, getAllActorsAtLocation, getSublocationsAt } from './graphQueries';

const PERMANENT_SUBLOCATION_PERSISTENCE: SublocationPersistence = { type: 'permanent' };

function makeSupportNodeId(templateId: string, locationId: string, key: string): string {
  return `enc_support_${templateId}_${locationId}_${key}`;
}

function normalizeAnchorLocationId(state: GameState, locationId: string): string {
  const locationNode = state.graph.getNode(locationId);
  if (locationNode?.type === 'location') {
    const parentLocationId = locationNode.properties.parentLocationId as string | undefined;
    return parentLocationId ?? locationId;
  }
  return locationId;
}

function resolveAnchorLocationId(
  state: GameState,
  targetId: string,
  fallbackLocationId?: string,
): string {
  const targetNode = state.graph.getNode(targetId);
  if (targetNode?.type === 'location') {
    return normalizeAnchorLocationId(state, targetId);
  }
  if (targetNode?.type === 'actor') {
    const actorLocationId = getAgentLocationId(state.graph, targetId);
    if (actorLocationId) {
      return normalizeAnchorLocationId(state, actorLocationId);
    }
  }
  if (fallbackLocationId) {
    return normalizeAnchorLocationId(state, fallbackLocationId);
  }
  return targetId;
}

function getLocationCultureId(state: GameState, locationId: string): string | null {
  const cultureEdges = state.graph.getOutgoingEdges(locationId, 'belongs_to');
  for (const edge of cultureEdges) {
    if ((edge.properties.cultureLayer as string | undefined) === 'current') {
      return edge.target;
    }
  }
  return cultureEdges[0]?.target ?? null;
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

function resolveLocationSupport(
  state: GameState,
  templateId: string,
  locationId: string,
  spec: EncounterSupportLocationSpec,
  options: { allowMaterializePreseeded?: boolean } = {},
): EncounterSupportBinding | null {
  const sublocation = getSublocationsAt(state.graph, locationId).find(
    loc => loc.properties.sublocationTypeId === spec.sublocationTypeId,
  );
  if (sublocation) {
    return {
      key: spec.key,
      nodeId: sublocation.id,
      kind: spec.kind,
      delivery: spec.delivery,
      persistence: spec.persistence,
      reused: true,
    };
  }

  if (spec.delivery !== 'lazy-materialize-on-trigger' && !(options.allowMaterializePreseeded && spec.delivery === 'pre-seeded')) {
    return null;
  }

  const supportId = makeSupportNodeId(templateId, locationId, spec.key);
  const existing = state.graph.getNode(supportId);
  if (existing) {
    return {
      key: spec.key,
      nodeId: existing.id,
      kind: spec.kind,
      delivery: spec.delivery,
      persistence: spec.persistence,
      reused: true,
    };
  }

  state.graph.addNode({
    id: supportId,
    type: 'location',
    name: spec.fallbackName ?? spec.sublocationTypeId,
    properties: {
      locationSubtype: 'encounter_support',
      sublocationTypeId: spec.sublocationTypeId,
      parentLocationId: locationId,
      persistence: PERMANENT_SUBLOCATION_PERSISTENCE,
      generatedBy: 'encounter_support_bundle',
      encounterSupportKey: spec.key,
      encounterTemplateId: templateId,
    },
  });
  state.graph.addEdge({
    id: `${supportId}_contained_by_${locationId}`,
    source: locationId,
    target: supportId,
    type: 'contains',
    properties: {},
  });

  return {
    key: spec.key,
    nodeId: supportId,
    kind: spec.kind,
    delivery: spec.delivery,
    persistence: spec.persistence,
    reused: false,
  };
}

function findExistingActorSupport(
  state: GameState,
  placementId: string,
  spec: EncounterSupportActorSpec,
): string | null {
  const candidates = getAllActorsAtLocation(state.graph, placementId)
    .filter(node => node.properties.actorType === 'individual');

  const supportMatch = candidates.find(
    node => node.properties.encounterSupportRole === spec.supportRole,
  );
  if (supportMatch) return supportMatch.id;

  const reusableRoles = new Set(spec.reuseNpcRoles ?? []);
  if (reusableRoles.size === 0) return null;

  const roleMatch = candidates.find(node => {
    if (node.properties.encounterSupportRole !== undefined) return false;
    const npcRole = node.properties.npcRole as string | undefined;
    return npcRole !== undefined && reusableRoles.has(npcRole);
  });
  return roleMatch?.id ?? null;
}

/** What a walk-on is made of — the parameters {@link materializeWalkOnActor} needs. */
export interface WalkOnSpec {
  /** The node id to write. The caller owns the naming scheme, and thus idempotency. */
  readonly nodeId: string;
  readonly name?: string;
  readonly npcRole?: string;
  /** Stamped as `encounterSupportRole`; also the faction membership role. */
  readonly supportRole?: string;
  readonly factionDefId?: string;
  /** Provenance — which system made this person, for the debug surfaces. */
  readonly generatedBy: string;
  /** Extra provenance properties, merged last. */
  readonly extraProperties?: Record<string, unknown>;
}

/**
 * Write one walk-on: a body at a place, with a culture and maybe a faction.
 *
 * This is the **legacy find-or-mint path's writer**, extracted (THR-1296 slice 5) so
 * the undertaking creation effects can spawn a `scene-only` face through the same
 * code rather than a second copy of this node shape. It deliberately stays thin —
 * no capabilities, no axiological profile, no ambitions. A walk-on is cardboard by
 * design; {@link import('./binding/mintInhabitant').mintInhabitant} is the born-real
 * path, and the split is what keeps the 1/tick birth budget spent on people the world
 * will keep.
 *
 * Idempotent on `nodeId` — a second call returns the existing node untouched.
 */
export function materializeWalkOnActor(
  state: GameState,
  anchorLocationId: string,
  placementId: string,
  spec: WalkOnSpec,
): string {
  const existing = state.graph.getNode(spec.nodeId);
  if (existing) return existing.id;

  state.graph.addNode({
    id: spec.nodeId,
    type: 'actor',
    // `GraphNode.name` is required. The encounter path always supplies one, so this
    // fallback never fires there and the extraction stays behaviour-identical; a
    // creation effect with no authored name falls back to its role rather than to
    // `undefined`, which would have written a nameless person into the world.
    name: spec.name ?? spec.npcRole ?? spec.nodeId,
    properties: {
      actorType: 'individual',
      spotlightTier: 'ambient',
      npcRole: spec.npcRole,
      encounterSupportRole: spec.supportRole,
      generatedBy: spec.generatedBy,
      importance: 0,
      sphereAffinity: null,
      reputationScore: DEFAULT_REPUTATION,
      ...(spec.extraProperties ?? {}),
    },
  });

  state.graph.addEdge({
    id: `${spec.nodeId}_located_at_${placementId}`,
    source: spec.nodeId,
    target: placementId,
    type: 'located_at',
    properties: {},
  });

  const cultureId = getLocationCultureId(state, anchorLocationId);
  if (cultureId) {
    state.graph.addEdge({
      id: `edge_culture_${spec.nodeId}_${cultureId}`,
      source: spec.nodeId,
      target: cultureId,
      type: 'belongs_to',
      properties: { culturalStrength: 1.0 },
    });
  }

  const factionId = findFactionNodeId(state, spec.factionDefId);
  if (factionId) {
    state.graph.addEdge({
      id: `${spec.nodeId}_member_of_${factionId}`,
      source: spec.nodeId,
      target: factionId,
      type: 'member_of',
      properties: {
        role: spec.supportRole,
        rank: 0.05,
        joinedTick: state.tick,
      },
    });
  }

  return spec.nodeId;
}

function materializeActorSupport(
  state: GameState,
  templateId: string,
  anchorLocationId: string,
  placementId: string,
  spec: EncounterSupportActorSpec,
): string {
  return materializeWalkOnActor(state, anchorLocationId, placementId, {
    nodeId: makeSupportNodeId(templateId, anchorLocationId, spec.key),
    name: spec.spawnName,
    npcRole: spec.spawnNpcRole,
    supportRole: spec.supportRole,
    factionDefId: spec.factionDefId,
    generatedBy: 'encounter_support_bundle',
    extraProperties: {
      encounterSupportKey: spec.key,
      encounterTemplateId: templateId,
    },
  });
}

function resolveActorSupport(
  state: GameState,
  templateId: string,
  anchorLocationId: string,
  bindings: Map<string, EncounterSupportBinding>,
  spec: EncounterSupportActorSpec,
  options: { allowMaterializePreseeded?: boolean } = {},
): EncounterSupportBinding | null {
  const placementId = spec.preferredLocationKey
    ? bindings.get(spec.preferredLocationKey)?.nodeId
    : anchorLocationId;

  if (!placementId) return null;

  const existingId = findExistingActorSupport(state, placementId, spec);
  if (existingId) {
    return {
      key: spec.key,
      nodeId: existingId,
      kind: spec.kind,
      delivery: spec.delivery,
      persistence: spec.persistence,
      reused: true,
    };
  }

  if (spec.delivery !== 'lazy-materialize-on-trigger' && !(options.allowMaterializePreseeded && spec.delivery === 'pre-seeded')) {
    return null;
  }

  const supportId = materializeActorSupport(state, templateId, anchorLocationId, placementId, spec);
  return {
    key: spec.key,
    nodeId: supportId,
    kind: spec.kind,
    delivery: spec.delivery,
    persistence: spec.persistence,
    reused: false,
  };
}

export interface PreparedEncounterSupportBundleResult {
  anchorLocationId: string;
  bindings: EncounterSupportBinding[];
  blocked: EncounterSupportSpec[];
  unresolved: EncounterSupportSpec[];
}

function prepareEncounterSupportBundleInternal(
  state: GameState,
  template: UnifiedActionTemplate,
  targetId: string,
  fallbackLocationId?: string,
  options: { allowMaterializePreseeded?: boolean } = {},
): PreparedEncounterSupportBundleResult {
  if (!template.supportBundle || template.supportBundle.length === 0) {
    const anchorLocationId = resolveAnchorLocationId(state, targetId, fallbackLocationId);
    return {
      anchorLocationId,
      bindings: [],
      blocked: [],
      unresolved: [],
    };
  }

  const anchorLocationId = resolveAnchorLocationId(state, targetId, fallbackLocationId);
  const bindings = new Map<string, EncounterSupportBinding>();
  const unresolved: EncounterSupportSpec[] = [];
  const blocked: EncounterSupportSpec[] = [];

  for (const spec of template.supportBundle) {
    if (spec.delivery === 'blocked-primitive') {
      blocked.push(spec);
      continue;
    }
    if (spec.kind !== 'location') continue;
    const binding = resolveLocationSupport(state, template.id, anchorLocationId, spec, options);
    if (binding) bindings.set(spec.key, binding);
    else unresolved.push(spec);
  }

  for (const spec of template.supportBundle) {
    if (spec.delivery === 'blocked-primitive') continue;
    if (spec.kind !== 'actor') continue;
    const binding = resolveActorSupport(state, template.id, anchorLocationId, bindings, spec, options);
    if (binding) bindings.set(spec.key, binding);
    else unresolved.push(spec);
  }

  return {
    anchorLocationId,
    bindings: template.supportBundle
      .map(spec => bindings.get(spec.key))
      .filter((binding): binding is EncounterSupportBinding => binding != null),
    blocked,
    unresolved,
  };
}

export function prepareEncounterSupportBundle(
  state: GameState,
  template: UnifiedActionTemplate,
  targetId: string,
  fallbackLocationId?: string,
): EncounterSupportBinding[] {
  return prepareEncounterSupportBundleInternal(state, template, targetId, fallbackLocationId).bindings;
}

export function prepareEncounterSupportBundleForContext(
  state: GameState,
  template: UnifiedActionTemplate,
  targetId: string,
  fallbackLocationId?: string,
): PreparedEncounterSupportBundleResult {
  return prepareEncounterSupportBundleInternal(state, template, targetId, fallbackLocationId, {
    allowMaterializePreseeded: true,
  });
}
