import type { GameState } from '../types/gameState';
import type { EncounterProgress } from '../types/encounter';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { EncounterNotification } from '../types/encounterVisibility';
import type { CourtPosition, ThreadEdgeProperties } from '../types/influence';
import type { UnifiedAction } from '../types/unifiedAction';
import { buildEncounterNotification } from './encounterVisibility';
import { VISIBILITY_BY_POSITION } from '../types/encounterVisibility';
import { getAnyEncounterById } from '../data/encounter-content';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { getAgentLocationId, getAvatarsOf } from './graphQueries';
import { prepareEncounterSupportBundle, prepareEncounterSupportBundleForContext } from './encounterSupportBundle';
import type { EncounterBinderContext } from './encounterSupportBundle';
import { initializeClearanceGates } from './clearanceGate';
import { createUnifiedAction } from './unifiedActionLifecycle';
import { mulberry32 } from '../lib/prng';
import { selectDefaultTrackedHero } from './balanceTelemetry';
import { moveDebugAgent, spawnDebugLocationAtHex } from './debugWorldSpawnTools';
import type { DebugWorldSpawnResult } from './debugWorldSpawnTools';
import type { EncounterSupportBinding } from '../types/encounter';
import type { EssencePool } from '../types/influence';
import { REACH_DOMAINS } from '../types/traits';
import { SPHERE_NAMES } from '../types/index';
import { ARCHETYPE_NAMES } from '../types/agent';

export interface DebugSpawnEncounterOptions {
  courtPosition?: CourtPosition;
  open?: boolean;
  /**
   * The scored-binder context (THR-1305). Supply it and a template opting in with
   * `useScoredBinder` is cast by the same board live play uses, and its `must-persist`
   * specs reach the ledger; omit it and every template takes the legacy path.
   *
   * The struct is passed rather than the `SimulationRuntime` it comes from, for the
   * reason {@link EncounterBinderContext} gives for being narrow — this module's tests
   * construct `GameState` by hand and have no runtime to offer. Callers that do have
   * one assemble it with `buildEncounterBinderContext`.
   */
  binder?: EncounterBinderContext;
}

export interface DebugSpawnEncounterContextOptions {
  agentQuery?: string;
  locationQuery?: string;
  col?: number;
  row?: number;
  moveAgent?: boolean;
  /** See {@link DebugSpawnEncounterOptions.binder}. */
  binder?: EncounterBinderContext;
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
  template?: UnifiedActionTemplate;
  notification?: EncounterNotification;
  encounterProgress?: EncounterProgress;
  unifiedAction?: UnifiedAction;
  clearanceGateStates?: Map<string, import('../types/contentShells').ClearanceGateRuntimeState>;
  /**
   * Set when the spawn wrote or retuned a `thread` edge on its target (THR-934).
   * The caller must `touchWorld` on a truthy value — the graph mutates in place,
   * so ThreadsPanel's `worldVersion`-keyed selectors otherwise serve a stale roster
   * and the new row (with its encounter badge) never appears.
   */
  threadWrite?: DebugSpawnThreadWrite;
}

/** Outcome of the thread upsert a debug spawn performs on its target (THR-934). */
export interface DebugSpawnThreadWrite {
  threadEdgeId: string | null;
  created: boolean;
  retuned: boolean;
}

/**
 * Thread properties a debug spawn stamps on its target (THR-934).
 *
 * `pause` is the load-bearing value, not a preference. An `auto_resolve` thread
 * gives every generated notification a non-null `autoResolveTick`
 * (`buildEncounterNotification`), and `shouldAutoOpenEncounterNotification`
 * treats a non-null tick as "do not open now" — so steps 2+ of a spawned
 * encounter build a notification that silently times out instead of popping.
 * Tier sits at `PAUSE_MODE_MIN_TIER` or above so `toggleAttentionMode` will not
 * refuse the mode if a session flips it in the UI.
 */
const DEBUG_SPAWN_THREAD_TIER = 5;
const DEBUG_SPAWN_ATTENTION_MODE = 'pause' as const;
const DEBUG_SPAWN_THREAD_AWARENESS = 'faith' as const;

function findAgent(state: GameState, agentQuery: string) {
  const actors = state.graph.getNodesByType('actor');
  const query = agentQuery.trim().toLowerCase();

  if (query === '@avatar') {
    // @avatar — strictly the ascendant's avatar actor via avatar_of edge.
    const avatars = getAvatarsOf(state.graph, state.ascendantId);
    return avatars[0];
  }

  if (query === '@hero') {
    // @hero — prefers avatar, falls back to heuristic individual selection.
    const avatars = getAvatarsOf(state.graph, state.ascendantId);
    if (avatars.length > 0) return avatars[0];
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

function resolveTemplate(templateQuery: string): UnifiedActionTemplate | undefined {
  return getAnyEncounterById(templateQuery) ?? getUnifiedTemplateById(templateQuery);
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
  template: UnifiedActionTemplate,
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
      return subtype !== undefined && (template.locationSubtypes ?? []).includes(subtype);
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
        error: `Hex ${options.col},${options.row} is already occupied by ${formatHexLocationSummary(state, options.col, options.row)} and cannot safely host a temporary ${template.locationSubtypes?.[0] ?? 'encounter'} anchor. Use --at <settlement>, choose an empty hex, or move the agent first.`,
      };
    }

    const fallbackSubtype = template.locationSubtypes?.[0];
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

/**
 * Upsert the `thread` edge a debug spawn needs on its target (THR-934).
 *
 * Before this existed, `?spawn` passed `courtPosition: 'the_first'` as a
 * *notification-time override* and wrote nothing to the graph, so only the
 * spawn-time notification carried it. Every later tick re-derived visibility
 * from the graph: `collectThreadedAgents` does synthesize a `the_first` entry
 * for the ascendant's avatar (which is what `@hero` resolves to), but it stamps
 * `attentionMode: 'auto_resolve'` — so steps 2+ generated a notification that
 * never auto-opened, and the Threads panel, which lists real thread edges, had
 * no row to hang the encounter badge on.
 *
 * Writing the edge makes every downstream phase read the same truth. The edge
 * is left in place after the encounter ends: cleanup is a non-goal, since the
 * only routes here are `?spawn` and the debug bridge, where a permanently
 * threaded hero is the desired testing posture.
 *
 * Fail-soft: a world with no ascendant returns a null edge id and no mutation.
 */
export function ensureDebugSpawnThread(
  state: GameState,
  agentId: string,
  courtPosition: CourtPosition,
  tick: number,
): DebugSpawnThreadWrite {
  const ascendantId = state.ascendantId;
  if (!ascendantId) return { threadEdgeId: null, created: false, retuned: false };

  const existing = state.graph
    .getOutgoingEdges(ascendantId, 'thread')
    .find(candidate => candidate.target === agentId);

  if (existing) {
    // A genuinely threaded target (e.g. `?seeded`'s Kael) still arrives on
    // `auto_resolve` — retune rather than skip, or the spawn inherits the very
    // setting that suppresses its own continuation. Read the two fields straight
    // off the property bag: `ThreadEdgeProperties` does not overlap
    // `Record<string, unknown>` enough for a direct cast.
    const retuned =
      existing.properties.courtPosition !== courtPosition
      || existing.properties.attentionMode !== DEBUG_SPAWN_ATTENTION_MODE;
    if (retuned) {
      state.graph.updateEdge(existing.id, {
        properties: { courtPosition, attentionMode: DEBUG_SPAWN_ATTENTION_MODE },
      });
    }
    return { threadEdgeId: existing.id, created: false, retuned };
  }

  const threadEdgeId = `edge_thread_${ascendantId}_${agentId}`;
  state.graph.addEdge({
    id: threadEdgeId,
    source: ascendantId,
    target: agentId,
    type: 'thread',
    properties: {
      courtPosition,
      tier: DEBUG_SPAWN_THREAD_TIER,
      ticksAtCurrentTier: 0,
      establishedTick: tick,
      totalEssenceSpent: 0,
      maintenanceCurrent: true,
      awareness: DEBUG_SPAWN_THREAD_AWARENESS,
      readBackstoryTier: 0,
      attentionMode: DEBUG_SPAWN_ATTENTION_MODE,
      storyPhase: 'call',
      meetingChoiceRecord: null,
      beatHistory: [],
    },
  });
  return { threadEdgeId, created: true, retuned: false };
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

function makeUiProgress(template: UnifiedActionTemplate, actorId: string, tick: number, occupiedUntilTick?: number): EncounterProgress {
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

/** Build a resolution note showing what a query resolved to, so misresolution is visible. */
function resolutionNote(query: string, resolvedId: string, resolvedName: string): string {
  const q = query.trim().toLowerCase();
  if (q === resolvedId.toLowerCase() || q === resolvedName.toLowerCase()) return '';
  return ` (resolved '${query}' → ${resolvedName} [${resolvedId}])`;
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
  const agentNote = resolutionNote(agentQuery, agent.id, agent.name);

  const locationId = getAgentLocationId(state.graph, agent.id);
  if (!locationId) {
    return {
      success: false,
      message: `${agent.name} has no location anchor for encounter testing`,
    };
  }

  const locationName = state.graph.getNode(locationId)?.name ?? 'unknown location';
  // Thread the target before reading its context, so the spawn-time notification
  // and every later tick's notification derive from the same edge (THR-934).
  const threadWrite = options.courtPosition
    ? ensureDebugSpawnThread(state, agent.id, options.courtPosition, state.tick)
    : undefined;
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
    // The caller supplies the context but cannot supply `actorId` — it holds a query
    // ('@hero', a partial name), not a node id. The resolved agent is stamped here so
    // the board's story-tie term measures ties to the agent actually walking in.
    const supportBindings = prepareEncounterSupportBundle(
      state, unifiedTemplate, locationId, undefined,
      options.binder ? { ...options.binder, actorId: agent.id } : undefined,
    );
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
      // THR-1100: target-derived step duration for tier-scaled templates.
      targetProperties: state.graph.getNode(locationId)?.properties,
    });

    // Rebuild notification with unified_action metadata so the dedup key matches
    // what phaseEncounterVisibility generates next tick — prevents the first step
    // firing twice (once from spawn, once from visibility phase).
    const unifiedNotification = buildEncounterNotification(
      agent.id,
      agent.name,
      template.id,
      template.name,
      locationName,
      courtPosition,
      attentionMode,
      state.tick,
      { sourceSystem: 'unified_action', stepIndex: 0, actionId: action.actionId },
    ) ?? notification;

    return {
      success: true,
      message: `Spawned '${template.name}' on '${agent.name}'${agentNote}`,
      mode: 'unified',
      agent: { id: agent.id, name: agent.name },
      template,
      notification: unifiedNotification,
      unifiedAction: action,
      clearanceGateStates: gateInit.clearanceGateStates,
      threadWrite,
    };
  }

  const rawDur = template.steps[0]?.duration;
  const firstStepDuration = (rawDur !== null && rawDur !== undefined && typeof rawDur === 'object')
    ? (rawDur as { min: number }).min
    : ((rawDur as number | undefined) ?? 1);
  const progress = makeUiProgress(template, agent.id, state.tick, state.tick + firstStepDuration);

  return {
    success: true,
    message: `Spawned '${template.name}' on '${agent.name}'${agentNote}`,
    mode: 'legacy',
    agent: { id: agent.id, name: agent.name },
    template,
    notification,
    encounterProgress: progress,
    threadWrite,
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

  const prepared = prepareEncounterSupportBundleForContext(
    state, unifiedTemplate, anchor.locationId, anchor.locationId, options.binder,
  );
  let movedAgent = false;
  let agentId: string | undefined;
  let agentName: string | undefined;
  let agentNote = '';
  if (options.agentQuery) {
    const agent = findAgent(state, options.agentQuery);
    if (agent) {
      agentId = agent.id;
      agentName = agent.name;
      agentNote = resolutionNote(options.agentQuery, agent.id, agent.name);
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
    movedAgent ? `moved ${agentName ?? 'agent'}${agentNote}` : null,
    !movedAgent && agentNote ? `agent${agentNote}` : null,
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

// ─── Balanced test avatar (THR-883 review lever) ─────────────────────

/**
 * Raw domain-capability score the balanced test avatar carries in every reach.
 * The attended sigmoid sits at midpoint 10 but is not centred against equal
 * difficulty (the MEETING_TEST_CAPABILITY lesson, THR-868): raw 12 still reads
 * `perilous` on a `fair` step. 14 (capability ~0.83) lands the forecast
 * mid-word on `fair`, with room for a hand to move it in either direction —
 * the whole point of balanced review. Measured live 2026-07-31.
 */
export const DEV_TEST_AVATAR_REACH_RAW = 14;

/**
 * Minimum essence per sphere for balanced review — every sphere-gated card in
 * every hand is playable, so no card is invisible for pool reasons.
 */
export const DEV_TEST_AVATAR_ESSENCE_PER_SPHERE = 12;

export interface BalancedTestAvatarResult {
  success: boolean;
  message: string;
  agentId?: string;
  agentName?: string;
  /** Caller merges this into gameState (the pool lives on state, not the graph). */
  essencePool?: EssencePool;
}

/**
 * Stamp an agent as the balanced test avatar (Christian, 2026-07-31): equal
 * mid-competent raw capability in all eight reaches, a neutral zero on every
 * value axis (so THR-894 forks resolve from the seeded coin and both poles
 * stay reachable across seeds), and an essence floor in all twelve spheres.
 *
 * Dev-only review tooling: mutates the agent node in place (caller calls
 * `touchWorld` and merges the returned pool via its own state setter). Traits
 * are deliberately untouched — a trait-gated card staying hidden on the test
 * avatar is correct behavior, not a gap.
 */
export function applyBalancedTestAvatar(
  state: GameState,
  agentQuery: string,
): BalancedTestAvatarResult {
  const agent = findAgent(state, agentQuery);
  if (!agent) {
    return { success: false, message: `No agent matches '${agentQuery}'` };
  }

  const domainCapabilities: Record<string, number> = {};
  for (const reach of REACH_DOMAINS) domainCapabilities[reach] = DEV_TEST_AVATAR_REACH_RAW;
  agent.properties.domainCapabilities = domainCapabilities;

  const axiologicalProfile: Record<string, number> = {};
  for (const axis of Object.keys(ARCHETYPE_NAMES)) axiologicalProfile[axis] = 0;
  agent.properties.axiologicalProfile = axiologicalProfile;

  const essencePool = { ...state.essencePool };
  for (const sphere of SPHERE_NAMES) {
    essencePool[sphere] = Math.max(essencePool[sphere] ?? 0, DEV_TEST_AVATAR_ESSENCE_PER_SPHERE);
  }

  return {
    success: true,
    agentId: agent.id,
    agentName: agent.name,
    essencePool,
    message:
      `Stamped '${agent.name}' as the balanced test avatar: raw ${DEV_TEST_AVATAR_REACH_RAW} in all reaches, `
      + `neutral value axes, essence floor ${DEV_TEST_AVATAR_ESSENCE_PER_SPHERE} in all spheres`,
  };
}
