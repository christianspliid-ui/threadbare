import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { SPHERE_NAMES, type CosmologyProfile } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import { resumeMusic as resumeTheme, getMusicVolume, setMusicVolume, isMusicMuted, toggleMusicMute } from '../../audio/MusicChannel';
import { getBackgroundVolume, setBackgroundVolume, isBackgroundMuted, muteBackground, unmuteBackground } from '../../audio/BackgroundChannel';
import { getUiVolume, setUiVolume, isUiMuted, muteUi, unmuteUi } from '../../audio/UiChannel';
import { muteAll, unmuteAll, isAllMuted } from '../../audio/AudioMaster';
import { useAmbientContext } from './hooks/useAmbientContext';
import { CAMERA_CONSTANTS } from '../HexMapV2/camera/D3ZoomCamera';
import type { ScryState } from '../../types/scry';
import { createScryState } from '../../engine/scry';
import { useSimulation } from './hooks/useSimulation';
import type { EncounterTemplate } from '../../types/encounter';
import { getEncountersForLocation, getAnyEncounterById } from '../../data/encounter-content';
import { SUBTYPE_SUBLOCATION_MAP } from '../../engine/sublocation';
import { useHexZoomData } from './hooks/useHexZoomData';
import { useLocationActivities } from './hooks/useLocationActivities';
import { useAvatarData } from './hooks/useAvatarData';
import { useScry } from './hooks/useScry';
import { useAgentInteraction } from './hooks/useAgentInteraction';
import { useViewNavigation } from './hooks/useViewNavigation';
import { hexToPixel } from '../../lib/hexMath';
import { hexToWorld } from '../../lib/worldPosition';
import { getSphereColor } from '../../data/sphereIcons';
import { ANOMALY_SPHERE_MAP } from '../../components/HexMapV2/scene/anomalyConstants';
export type { ViewLevel } from './hooks/useViewNavigation';

import { GameErrorBoundary } from '../shared/GameErrorBoundary';
import { IconButton } from '../shared/IconButton';
import { AnimateMount } from '../shared/AnimateMount';
import HexMapV2 from '../HexMapV2/HexMapV2';
import type { AgentRenderData } from '../HexMapV2/agents/agentSpriteTypes';
import { FACTION_HERALDIC_COLORS } from '../HexMapV2/agents/agentSpriteTypes';
import type { LocationNode } from '../HexMapV2/scene/LocationIconMesh';
import type { ArmyRenderData } from '../HexMapV2/scene/ArmySpriteMesh';
import { ARMY_SIZE_SMALL_MAX } from '../HexMapV2/scene/ArmySpriteMesh';
import type { BattleRenderData } from '../HexMapV2/scene/BattleIndicatorMesh';
import type { SiegeRenderData } from '../HexMapV2/scene/SiegeIndicatorMesh';
import type { ThreadLineData, TugData } from '../HexMapV2/scene/ThreadLineMesh';
import type { ActivityIconData } from '../HexMapV2/scene/ActivityIconMesh';
import {
  ACTIVITY_ICON_OPACITY_BACKGROUND,
  ACTIVITY_ICON_OPACITY_SHAPING,
  ACTIVITY_ICON_OPACITY_STORY,
  ATTENTION_BASE_CAPACITY,
} from '../../data/attention-constants';
import type { ArmyState } from '../../types/army';
import type { BattleState } from '../../types/battle';
import { extractRoadPaths } from '../../engine/roadNetwork';
import { getRetinueAgents } from '../../engine/retinue';
import { TIER_NAMES } from '../../data/influence-content';
import type { ThreadedNode, ThreadedFaction } from '../../engine/retinue';
import { getAgentPortraitUrlFromProperties } from '../../data/portrait-assets';
import { getOriginPortraitUrl } from '../../data/avatar-portrait-assets';
import { HEX_CONSTANTS } from '../HexMapV2/scene/HexFillMesh';
import { EssencePanel } from './EssencePanel';
import { SimulationControls } from './SimulationControls';
import { DoomBar } from './DoomBar';
import { OmenIndicator } from './OmenIndicator';
import { DoomClockDetail } from './DoomClockDetail';
import { MandateDetail } from './MandateDetail';
import { ActionDrawer } from './ActionDrawer';
import { HarvestScreen } from './HarvestScreen';
import { RetinuePanel } from './RetinuePanel';
import { AgentInfoCard } from './AgentInfoCard';
import { ThreadsPanel } from './ThreadsPanel';
import { ThreadDetailView } from './ThreadDetailView';
import { HexDetailView } from './HexDetailView';
import { LocationProfileModal } from './LocationProfileModal';
import { FactionSheet } from './FactionSheet';
import { ArmySheet } from './ArmySheet';
import { ArtifactSheet } from './ArtifactSheet';
import { AgentProfileModal } from './AgentProfileModal';
import { StrandView } from './StrandView';
import { InterventionConfirm } from './InterventionConfirm';
import { ChoiceSetModal } from './ChoiceSetModal';
import { AgendaPicker } from './AgendaPicker';
import { ScryOverlay } from './ScryOverlay';
import { ScryProvider } from './contexts/ScryContext';
import { LocationView } from './LocationView';
import { HexBreadcrumb } from './HexBreadcrumb';
import { HexSidebar } from './HexSidebar';
import { HexChronicle } from './HexChronicle';
import { INTERVENTION_DEFINITIONS } from '../../types/dream';
import { MandateTracker } from './MandateTracker';
import { DebugPanel } from './DebugPanel';
import { getEncounterCacheManager } from '../../engine/orchestrator';
import { getLatestEncounterDecisionForAgent, getLatestEncounterDecisionsByAgent } from '../../engine/balanceTelemetry';
import { AvatarHUD } from './AvatarHUD';
import { LiveLocationBar } from './LiveLocationBar';
import { WorldPulse } from './WorldPulse';
import { ChroniclePanel } from './ChroniclePanel';
import { ToastStack } from './ToastStack';
import { AlertBar } from './AlertBar';
import { useNotificationNavigation } from './hooks/useNotificationNavigation';
import { useNotificationPreferences } from './hooks/useNotificationPreferences';
import { RivalsButton } from './RivalsButton';
import { IdentityChip } from './IdentityChip';
import { AscendantBar } from './ascendant-bar/AscendantBar';
import { AscendantSheet } from './AscendantSheet';
import { EventPopup } from './EventPopup';
import { SettingsPanel } from './SettingsPanel';
import { courtPositionToThreadTier } from './encounter-stage/types';
import { MeetTheFirstFlow } from '../MeetTheFirst/MeetTheFirstFlow';
import { JourneyVignetteModal } from './JourneyVignetteModal';
import { PremonitionModal } from './PremonitionModal';
import { StoryBeatModal } from './StoryBeatModal';
import type { WhisperNudge, CompulsionCandidate } from '../../types/premonition';
import { applyWhisperChoice, applyCompulsionChoice, dismissPremonition } from '../../engine/premonitionActions';
import { buildGateDutyEncounterStageModel } from './encounter-stage/adapters/buildGateDutyEncounterStageModel';
import { buildUnifiedEncounterStageModel } from './encounter-stage/adapters/buildUnifiedEncounterStageModel';
import { buildSimpleEncounterStageModel } from './encounter-stage/adapters/buildSimpleEncounterStageModel';
import { EncounterVeil } from './EncounterVeil';
import {
  buildActiveEncounterDisplayFromLegacyProgress,
  buildActiveEncounterDisplayFromUnifiedAction,
  shouldAutoOpenEncounterNotification,
  type ActiveEncounterDisplay,
  selectEncounterRuntimeForDisplay,
  selectEncounterRuntimeForNotification,
} from './encounterNotificationRuntime';
import type { MeetingEncounterState, MeetingEncounterResult } from '../../types/meetingEncounter';
import type { JourneyVignetteData, PendingVignette } from '../../types/journeyEngine';
import { applyBeatChoice } from '../../engine/journeyEngine';
import { getThreadsFrom } from '../../engine/graphQueries';
import type { ThreadEdgeProperties } from '../../types/influence';
import { createMeetingEncounterState, createAgentFromMeeting, isMeetTheFirstAvailable } from '../../engine/meetingEncounter';
import { buildStubAscendantLens } from '../../types/hunger';
import type { AscendantLens } from '../../types/hunger';
import { useNotifications } from './hooks/useNotifications';
import { useEncounterNotifications } from './hooks/useEncounterNotifications';
import { toggleAttentionMode } from '../../engine/encounterVisibility';
import { useTopBarHotkeys } from './hooks/useTopBarHotkeys';
import { computeEssenceIncome } from '../../engine/essenceIncome';
import { buildActorTargetContext, buildHexTargetContext, buildLocationTargetContext } from '../../engine/targetContextBuilders';
import { useTargetActions } from './hooks/useTargetActions';
import { templateIdFromSlotId } from '../../engine/targetActions';
import type { WheelSlot } from '../../engine/wheel';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES, resolveEncounterTemplate } from '../../data/unified-action-templates';
import { CRUD_TO_ENCOUNTER_TYPE } from '../../engine/encounterCache';
import { createUnifiedAction } from '../../engine/unifiedActionLifecycle';
import { mulberry32 } from '../../lib/prng';
import { DIVINE_INFLUENCE_CONSTANTS } from '../../data/intervention-feedback-content';
import { WorldSoulIndicator } from '../WorldSoulIndicator';
import { prepareDebugEncounterContext, prepareDebugEncounterSpawn } from '../../engine/debugEncounterTools';
import {
  moveDebugAgent,
  spawnDebugAttachment,
  spawnDebugLocationAtHex,
  spawnDebugNpc,
  spawnDebugSublocation,
} from '../../engine/debugWorldSpawnTools';
import { pinAgent as pinAgentDebug, unpinAgent as unpinAgentDebug } from '../../engine/portfolioManager';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { ClearanceGateRuntimeState } from '../../types/contentShells';
import { touchStructure, touchWorld } from '../../engine/simulationRuntime';
import { executeEffect } from '../../engine/effectExecutors';
import type { ExecutionContext } from '../../engine/effectExecutors';
import { emitTrace } from '../../engine/traceBuffer';
import {
  applyEncounterAftermathReaction,
  AUTO_AFTERMATH_TRACE_CATEGORY,
  resolveAftermathContextForAgent,
} from '../../engine/encounterAftermath';
import { checkMidEncounterPromotion } from '../../engine/attentionTier';
import { consumeMatchingMarks } from '../../engine/hiddenMarks';
import { observeResolutionIntelligence } from '../../engine/intelligence';
import {
  markEncounterProgressDisregarded,
  markUnifiedActionDisregarded,
  recordEncounterChoiceMemory,
  recordUnifiedActionChoiceMemory,
} from '../../engine/encounterChoiceMemory';
import { AttentionPoolIndicator } from './AttentionPoolIndicator';
import { ReadTheThreadsPanel } from './ReadTheThreadsPanel';
import { DelveProgressPanel } from '../ruins/DelveProgressPanel';
import { EmergenceDilemmaModal } from '../ruins/EmergenceDilemmaModal';
import { resolveEmergenceDecision } from '../../engine/ruins/delveVariant';
import { useLastViewedTick } from '../../hooks/useLastViewedTick';
import type { SpotlightTier } from '../../types/npc';
import { shouldRenderIndividualOnHexMap } from './hexMapAgentVisibility';
import {
  getEncounterActivityIconKey,
  getSelectedEncounterPoolCandidate,
} from './encounterActivityPresentation';
import {
  getHexStrategicOverlays,
  getAgentStrategicSummary,
  type AgentStrategicSummary,
  type HexStrategicOverlay,
} from '../../engine/strategicPresentation';

interface GameViewProps {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
  mapSize?: import('../../engine/gameInit').MapSizePreset;
  ascendantIdentity?: import('../../types/remembrance').AscendantIdentity;
  preSeeded?: boolean;
}

function formatJourneyPhaseLabel(
  phase: ThreadEdgeProperties['storyPhase'] | undefined,
  active: boolean,
): string {
  switch (phase) {
    case 'call': return 'Call';
    case 'road_of_trials': return 'Trials';
    case 'crisis': return 'Crisis';
    case 'ordeal': return 'Ordeal';
    case 'return': return active ? 'Return' : 'Return resolved';
    default: return active ? 'Unfolding' : 'Dormant';
  }
}

export function GameView({ archetype, avatarName, cosmology, seed, mapSize, ascendantIdentity, preSeeded }: GameViewProps) {
  // ── Resume theme music if it was started on the start screen ──
  useEffect(() => {
    resumeTheme();
  }, []);

  // ── Scry state (lifted here so simulation + navigation can use it for LOS) ──
  const [scryState, setScryState] = useState<ScryState>(createScryState);

  // ── Read the Threads panel state ──
  const [readThreadsOpen, setReadThreadsOpen] = useState(false);
  const [lastReadThreadsTick, setLastReadThreadsTick] = useState(0);

  // ── Last viewed tick tracking (drives "new" badges on digest entries) ──
  const { markViewed, getLastViewedTick } = useLastViewedTick();

  // ── Use simulation hook ──
  const {
    gameState, setGameState, tiles, riverPaths, lakeIds, regionData,
    running, speed, harvestResult, doTick, handleBeginNextCycle,
    handleToggleRunning, setRunning, setSpeed, seasonName, year, maxEssence, COLS, ROWS,
    runtime,
  } = useSimulation({ archetype, avatarName, cosmology, seed, scryState, mapSize, ascendantIdentity, preSeeded });

  // O(1) tile lookup by hex coordinate (tiles array is stable — created once at init)
  const tileMap = useMemo(() => {
    const m = new Map<string, HexTile>();
    for (const t of tiles) m.set(`${t.coord.col},${t.coord.row}`, t);
    return m;
  }, [tiles]);
  const getTile = useCallback((col: number, row: number) => tileMap.get(`${col},${row}`), [tileMap]);

  // ── Avatar data hook (needed before view navigation for avatarPixelPos) ──
  const {
    avatarPos,
    avatarNodeId,
    sphereColor,
    locationOverlays,
    avatarPixelPos,
      avatarRoute,
      avatarTargetHex,
      debugPanelOpen,
      debugPanelPreferredViewMode,
      debugPanelPreferredViewNonce,
      handleToggleDebug,
    } = useAvatarData({
    graph: gameState.graph,
    ascendantId: gameState.ascendantId,
    archetype,
  });

  // ── Debug: fog-of-war toggle ──
  const [fogDisabled, setFogDisabled] = useState(
    () => new URLSearchParams(window.location.search).has('nofog')
  );

  // ── Debug: omniscience mode (bypass familiarity gating on agent character sheets) ──
  const [omniscienceMode, setOmniscienceMode] = useState(false);

  // ── Debug: organic shore toggle ──
  const [showOrganicShore, setShowOrganicShore] = useState(false);

  // ── Settings panel state ──
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  // ── Camera center hex (for ambient audio terrain context) ──
  const [cameraCenter, setCameraCenter] = useState<import('../../types').HexCoord>({
    col: CAMERA_CONSTANTS.INITIAL_CENTER_COL,
    row: CAMERA_CONSTANTS.INITIAL_CENTER_ROW,
  });

  // ── Audio state (singletons are source of truth; React state mirrors for re-renders) ──
  const [musicVolume, setMusicVolumeState] = useState(() => getMusicVolume());
  const [bgVolume, setBgVolumeState] = useState(() => getBackgroundVolume());
  const [uiVolume, setUiVolumeState] = useState(() => getUiVolume());
  const [audioMuted, setAudioMuted] = useState(() => isAllMuted());

  // ── Ascendant sheet modal state ──
  const [ascendantSheetOpen, setAscendantSheetOpen] = useState(false);

  // ── Doom clock and mandate detail modals ──
  const [doomDetailOpen, setDoomDetailOpen] = useState(false);
  const [mandateDetailOpen, setMandateDetailOpen] = useState(false);

  // ── View navigation hook ──
  const {
    hoveredHex, setHoveredHex, selectedHex, viewLevel,
    focusedHex, focusedLocationId, moveMode, hexMapRef,
    handleHexClick, handleBackToWorld,
    handleBackToHex, handleLocationClick, handleCenterOnAvatar,
    handleAvatarMoveClick, handleHexClickMove,
  } = useViewNavigation({ gameState, setGameState, avatarPixelPos, tiles, COLS, ROWS, scryState, fogDisabled, setRunning });

  // ── Scry hook ──
  const {
    scryVisible,
    handleOpenScry,
    handleScryAssign,
    handleScryDemote,
    handleCloseScry,
    handleAvatarScryClick,
  } = useScry({ gameState, setGameState, archetype, scryState, setScryState });

  // ── Imperative toast state (for action dispatch feedback from useAgentInteraction) ──
  // Toasts pushed here are merged with notificationState.toasts in ToastStack.
  // Must be defined before useAgentInteraction since onPushToast is passed to that hook.
  const [actionToasts, setActionToasts] = useState<import('../../types/notification').ToastItem[]>([]);
  const handlePushToast = useCallback((toast: import('../../types/notification').ToastItem) => {
    setActionToasts(prev => {
      const now = Date.now();
      const live = prev.filter(t => t.expiresAt > now);
      return [...live, toast];
    });
  }, []);

  // ── Agent interaction hook ──
  const {
    selectedAgentId,
    selectedThreadNode,
    drawerOpen,
    pendingIntervention,
    pendingChoice,
    setPendingChoice,
    profileModalAgentId,
    playingCardId,
    selectedAgenda,
    agendaPickerOpen,
    pendingAgendas,
    retinueAgents,
    threadedNodes,
    agentDetail,
    agentInfoCard,
    agentFullProfile,
    wheelSlots,
    strandData,
    handleAgentSelect,
    handleThreadNodeSelect,
    handleWheelSlotClick,
    handleInterventionConfirm,
    handleInterventionCancel,
    handleAgendaSelect,
    handleAgendaCancel,
    handleDrawerClose,
    handleStrandClose,
    handleBackFromAgentDetail,
    handleViewPsyche,
    handleOpenDrawer,
    handleAvatarActionClick,
    handleViewProfile,
    handleCloseProfile,
    closeAllAgentOverlays,
    handleThreadDetailClose,
    selectedHexCoord,
    handleHexSelect,
    handleHexDetailClose,
  } = useAgentInteraction({
    gameState,
    setGameState,
    archetype,
    onOpenScry: handleOpenScry,
    scryState,
    onPushToast: handlePushToast,
    onParticleBurst: (hexCol, hexRow, sphereColor) => {
      hexMapRef.current?.spawnParticleBurst(hexCol, hexRow, sphereColor);
    },
    runtime,
    setRunning,
    omniscienceMode,
  });

  // ── Mark agent as viewed when detail panel opens ──
  useEffect(() => {
    if (selectedAgentId) {
      markViewed(selectedAgentId, gameState.tick);
    }
  }, [selectedAgentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Composite hex click: move avatar if moveMode is active, otherwise select hex ──
  // moveMode is activated by handleAvatarMoveClick; once a destination is picked (or Escape pressed)
  // it resets to false. Normal clicks just select the hex — no navigation.
  const handleHexClickFull = useCallback((coord: import('../../types').HexCoord) => {
    if (moveMode) {
      handleHexClickMove(coord); // moves avatar and clears moveMode
    } else {
      handleHexSelect(coord);    // select hex → detail panel + action cards
    }
  }, [moveMode, handleHexClickMove, handleHexSelect]);

  // ── Anomaly discovery event → reveal flash trigger ──
  // Watch recentEvents for 'anomaly_discovered' and trigger the hex map reveal animation.
  const processedAnomalyEventsRef = useRef(new Set<string>());
  useEffect(() => {
    for (const evt of gameState.recentEvents) {
      if (evt.type !== 'anomaly_discovered') continue;
      if (processedAnomalyEventsRef.current.has(evt.id)) continue;
      processedAnomalyEventsRef.current.add(evt.id);

      const hexCol = evt.hexCoords?.col;
      const hexRow = evt.hexCoords?.row;
      if (hexCol == null || hexRow == null) continue;

      // Derive sphere color from the anomaly's location subtype
      const locNode = gameState.graph.getNodesByType('location').find(n =>
        n.properties.hexCol === hexCol && n.properties.hexRow === hexRow && n.properties.isAnomalyLocation,
      );
      const locSubtype = (locNode?.properties.locationSubtype ?? locNode?.properties.locationType) as string | undefined;
      const sphere = locSubtype ? ANOMALY_SPHERE_MAP[locSubtype] : undefined;
      const color = sphere ? getSphereColor(sphere) : '#d4a574';

      hexMapRef.current?.triggerAnomalyReveal(hexCol, hexRow, color);
    }
  }, [gameState.recentEvents]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep recent events behind a lazy getter so debug streaming can opt in.
  const recentEventsRef = useRef(gameState.recentEvents);
  useEffect(() => {
    recentEventsRef.current = gameState.recentEvents;
  }, [gameState.recentEvents]);
  const getRecentEvents = useCallback(() => recentEventsRef.current, []);

  // ── Avatar arrival event → auto-pause + toast ──
  // When the ascendant reaches its move target, pause the game and notify the player.
  const processedArrivalEventsRef = useRef(new Set<string>());
  useEffect(() => {
    for (const evt of gameState.tickEvents) {
      if (evt.type !== 'avatar_arrival') continue;
      if (processedArrivalEventsRef.current.has(evt.id)) continue;
      processedArrivalEventsRef.current.add(evt.id);

      setRunning(false);
      handlePushToast({
        id: `toast_arrival_${evt.id}`,
        message: evt.message,
        count: 1,
        createdTick: evt.tick,
        expiresAt: Date.now() + 5000,
      });
    }
  }, [gameState.tickEvents, setRunning, handlePushToast]);

  // Cache selected retinue agent lookup (used in ActionDrawer props)
  const selectedRetinueAgent = useMemo(
    () => selectedAgentId ? retinueAgents.find(a => a.id === selectedAgentId) : undefined,
    [retinueAgents, selectedAgentId],
  );

  const latestThreadEncounterDecisions = useMemo(() => {
    const threadedAgentIds = threadedNodes
      .filter((node): node is Extract<ThreadedNode, { category: 'agent' }> => node.category === 'agent')
      .map(node => node.id);
    if (threadedAgentIds.length === 0) return new Map();
    return getLatestEncounterDecisionsByAgent(runtime, threadedAgentIds);
  }, [threadedNodes, runtime, runtime.balanceTelemetryVersion]);

  const selectedAgentEncounterDecision = useMemo(() => {
    if (selectedThreadNode?.category !== 'agent') return null;
    return latestThreadEncounterDecisions.get(selectedThreadNode.nodeId)
      ?? getLatestEncounterDecisionForAgent(runtime, selectedThreadNode.nodeId);
  }, [selectedThreadNode, latestThreadEncounterDecisions, runtime, runtime.balanceTelemetryVersion]);

  // When fog is disabled, create a proxy map that returns 'visible' for every key
  const effectiveVisibilityMap = useMemo(() => {
    if (!fogDisabled) return gameState.visibilityMap;
    // Proxy: any .get() call returns { state: 'visible' }, .size returns 1 to avoid "empty map" edge cases
    return new Proxy(new Map() as import('../../types/visibility').VisibilityMap, {
      get(target, prop) {
        if (prop === 'get') return () => ({ state: 'visible' as const });
        if (prop === 'size') return 1;
        return Reflect.get(target, prop);
      },
    });
  }, [fogDisabled, gameState.visibilityMap]);

  // ── Ascendant Lens (Hunger-based intent derivation for meetings) ──
  const ascendantLens = useMemo<AscendantLens>(
    () => buildStubAscendantLens(archetype.sphereAlignment.primary, archetype.sphereAlignment.secondary),
    [archetype.sphereAlignment.primary, archetype.sphereAlignment.secondary],
  );

  // ── Shared actor + faction lookups (single graph traversal per tick) ──
  // TB-086: Key off runtime.worldVersion, not graph identity (graph is mutated in place)
  const actors = useMemo(() => gameState.graph.getNodesByType('actor'), [gameState.graph, runtime.worldVersion]);
  const factionNodes = useMemo(
    () => actors.filter(node => node.properties.actorType === 'faction'),
    [actors],
  );

  // ── Agent render data adapter (graph → AgentRenderData[]) ──
  const agentRenderData = useMemo<AgentRenderData[]>(() => {
    const retinueIds = new Set(
      getRetinueAgents(gameState.graph, gameState.ascendantId).map(r => r.id)
    );
    const result: AgentRenderData[] = [];
    for (let i = 0; i < actors.length; i++) {
      const n = actors[i];
      // Only render notable-or-higher individuals and army groups on the hex map.
      // Factions, cultures, gods, ascendants are not map-positioned entities.
      // Ambient NPCs stay in rosters; promoted NPCs become visible on the map.
      const actorType = n.properties.actorType as string | undefined;
      if (actorType !== 'individual' && actorType !== 'group') continue;
      // Army nodes are rendered by the army layer, not the agent sprite system.
      if (n.properties.armyState != null) continue;
      if (actorType === 'individual') {
        // Commanders are represented by their army's icon while on campaign.
        const commandedByEdges = gameState.graph.getIncomingEdges(n.id, 'commanded_by');
        const tier = n.properties.spotlightTier as SpotlightTier | undefined;
        if (!shouldRenderIndividualOnHexMap(tier, commandedByEdges.length)) continue;
      }
      let hexCol = n.properties.hexCol as number | undefined;
      let hexRow = n.properties.hexRow as number | undefined;
      if (hexCol == null || hexRow == null) {
        const locEdges = gameState.graph.getOutgoingEdges(n.id, 'located_at');
        const locationId = locEdges.length > 0 ? locEdges[0].target : undefined;
        if (locationId) {
          const loc = gameState.graph.getNode(locationId);
          if (loc) {
            hexCol = loc.properties.hexCol as number | undefined;
            hexRow = loc.properties.hexRow as number | undefined;
          }
        }
      }
      if (hexCol == null || hexRow == null) continue;

      const movState = n.properties.movementState as
        | { currentHexPosition?: { col: number; row: number }; currentRoadType?: string; roadHexQueue?: unknown[] }
        | undefined;
      if (movState?.currentHexPosition) {
        hexCol = movState.currentHexPosition.col;
        hexRow = movState.currentHexPosition.row;
      }

      const isAvatar = n.id === avatarNodeId;
      result.push({
        id: n.id,
        hexCol,
        hexRow,
        portraitUrl: isAvatar
          ? getOriginPortraitUrl(ascendantIdentity?.originFragmentId ?? '')
          : (getAgentPortraitUrlFromProperties(n.properties as Record<string, unknown>) ?? undefined),
        factionIndex: i % 6,
        isRetinue: retinueIds.has(n.id),
        isAvatar,
        avatarSphereColor: isAvatar ? sphereColor : undefined,
        name: n.name,
        currentRoadType: movState?.currentRoadType as 'major' | 'trail' | undefined,
        roadHexQueueLength: Array.isArray(movState?.roadHexQueue) ? movState.roadHexQueue.length : undefined,
      });
    }
    return result;
  }, [actors, gameState.graph, runtime.worldVersion, gameState.ascendantId, avatarNodeId, sphereColor, ascendantIdentity?.originFragmentId]);

  // ── Thread line render data (ascendant → threaded agents) ──
  // Rebuilds on every worldVersion tick so line positions track moving agents.
  const threadLineData = useMemo<ThreadLineData[]>(() => {
    const avatarPos = avatarNodeId
      ? (() => {
          const n = gameState.graph.getNode(avatarNodeId);
          if (!n) return null;
          let col = n.properties.hexCol as number | undefined;
          let row = n.properties.hexRow as number | undefined;
          if (col == null || row == null) {
            const locEdges = gameState.graph.getOutgoingEdges(avatarNodeId, 'located_at');
            if (locEdges.length > 0) {
              const loc = gameState.graph.getNode(locEdges[0].target);
              col = loc?.properties.hexCol as number | undefined;
              row = loc?.properties.hexRow as number | undefined;
            }
          }
          return col != null && row != null ? { col, row } : null;
        })()
      : null;

    if (!avatarPos) return [];
    const fromWorld = hexToWorld(avatarPos, HEX_CONSTANTS.HEX_SIZE);
    const threadEdges = gameState.graph.getOutgoingEdges(gameState.ascendantId, 'thread');
    const result: ThreadLineData[] = [];

    for (const edge of threadEdges) {
      const agentNode = gameState.graph.getNode(edge.target);
      if (!agentNode) continue;
      let hexCol = agentNode.properties.hexCol as number | undefined;
      let hexRow = agentNode.properties.hexRow as number | undefined;
      if (hexCol == null || hexRow == null) {
        const locEdges = gameState.graph.getOutgoingEdges(edge.target, 'located_at');
        if (locEdges.length > 0) {
          const loc = gameState.graph.getNode(locEdges[0].target);
          hexCol = loc?.properties.hexCol as number | undefined;
          hexRow = loc?.properties.hexRow as number | undefined;
        }
      }
      if (hexCol == null || hexRow == null) continue;

      const toWorld = hexToWorld({ col: hexCol, row: hexRow }, HEX_CONSTANTS.HEX_SIZE);
      const courtPosition = (edge.properties as Record<string, unknown>)['courtPosition'] as string | undefined;
      result.push({
        agentId: edge.target,
        courtPosition: courtPosition ?? 'watched',
        fromX: fromWorld.x,
        fromY: fromWorld.y,
        toX: toWorld.x,
        toY: toWorld.y,
      });
    }
    return result;
  }, [gameState.graph, gameState.ascendantId, avatarNodeId, runtime.worldVersion]);

  // ── Active tug data — drives reach-coloured vibration animation on thread lines ──
  // Unattended tugs only; attended tugs have already been acknowledged by the player.
  const activeTugData = useMemo<Map<string, TugData>>(() => {
    const tugs = gameState.activeThreadTugs ?? [];
    const map = new Map<string, TugData>();
    for (const t of tugs) {
      if (!t.attended) {
        map.set(t.agentId, { reachPrimary: t.reachPrimary, threatLevel: t.threatLevel });
      }
    }
    return map;
  }, [gameState.activeThreadTugs]);

  // ── Attention pool/capacity — component-level so they're in scope everywhere ──
  const { attentionPool, attentionCapacity } = useMemo(() => {
    const ascNode = gameState.graph.getNode(gameState.ascendantId);
    return {
      attentionPool:    (ascNode?.properties?.attentionPool    as number) ?? ATTENTION_BASE_CAPACITY,
      attentionCapacity:(ascNode?.properties?.attentionCapacity as number) ?? ATTENTION_BASE_CAPACITY,
    };
  }, [gameState.graph, gameState.ascendantId, runtime.worldVersion]);

  // ── Attention ratio — scales thread line opacity in the Three.js layer ──
  const attentionRatio = useMemo<number>(() => {
    return attentionCapacity > 0 ? Math.min(1, attentionPool / attentionCapacity) : 1;
  }, [attentionPool, attentionCapacity]);

  // ── Activity icon render data (active encounters → per-agent reach icons) ──
  // Rebuilds on worldVersion so icons appear/disappear as encounters start/end.
  const activityIconData = useMemo<ActivityIconData[]>(() => {
    const resultByAgent = new Map<string, ActivityIconData & { __priority__: number }>();

    const getAgentWorldPosition = (agentId: string): { worldX: number; worldY: number } | null => {
      const agentNode = gameState.graph.getNode(agentId);
      if (!agentNode) return null;

      let hexCol = agentNode.properties.hexCol as number | undefined;
      let hexRow = agentNode.properties.hexRow as number | undefined;
      if (hexCol == null || hexRow == null) {
        const locEdges = gameState.graph.getOutgoingEdges(agentId, 'located_at');
        if (locEdges.length > 0) {
          const loc = gameState.graph.getNode(locEdges[0].target);
          hexCol = loc?.properties.hexCol as number | undefined;
          hexRow = loc?.properties.hexRow as number | undefined;
        }
      }
      if (hexCol == null || hexRow == null) return null;

      const worldPos = hexToWorld({ col: hexCol, row: hexRow }, HEX_CONSTANTS.HEX_SIZE);
      return { worldX: worldPos.x, worldY: worldPos.y };
    };

    const upsertIcon = (
      agentId: string,
      iconData: Omit<ActivityIconData, 'agentId' | 'worldX' | 'worldY'>,
      priority: number,
    ) => {
      const worldPosition = getAgentWorldPosition(agentId);
      if (!worldPosition) return;
      const storedPriority = resultByAgent.get(agentId)?.__priority__ ?? -1;
      if (storedPriority > priority) return;

      const entry = {
        agentId,
        worldX: worldPosition.worldX,
        worldY: worldPosition.worldY,
        ...iconData,
        __priority__: priority,
      } as ActivityIconData & { __priority__: number };
      resultByAgent.set(agentId, entry);
    };

    for (const [agentId, decision] of latestThreadEncounterDecisions.entries()) {
      if (decision.decisionType === 'idle') continue;
      const selectedCandidate = getSelectedEncounterPoolCandidate(decision);
      if (!selectedCandidate) continue;
      upsertIcon(
        agentId,
        {
          iconKey: getEncounterActivityIconKey(selectedCandidate.encounterType, decision.decisionType),
          tierOpacity: ACTIVITY_ICON_OPACITY_SHAPING,
        },
        0,
      );
    }

    for (const action of gameState.unifiedActions) {
      if (action.resolved) continue;
      const template = resolveEncounterTemplate(action.templateId);
      if (!template) continue;
      const tier = action.effectiveTier ?? template.intrinsicTier;
      const tierOpacity =
        tier === 'story_beat'  ? ACTIVITY_ICON_OPACITY_STORY :
        tier === 'shaping'     ? ACTIVITY_ICON_OPACITY_SHAPING :
        ACTIVITY_ICON_OPACITY_BACKGROUND;
      upsertIcon(
        action.actorId,
        {
          iconKey: getEncounterActivityIconKey(template.encounterType, 'start_local'),
          tierOpacity,
        },
        2,
      );
    }

    // Also scan legacy encounterProgress so agents in old-system encounters show icons too.
    for (const ep of gameState.encounterProgress) {
      if (ep.status !== 'active') continue;
      const legacyTemplate = getAnyEncounterById(ep.encounterId);
      const unifiedTemplate = legacyTemplate ? undefined : getUnifiedTemplateById(ep.encounterId);
      if (!legacyTemplate && !unifiedTemplate) continue;
      const encounterType = legacyTemplate
        ? legacyTemplate.encounterType
        : CRUD_TO_ENCOUNTER_TYPE[unifiedTemplate!.crudType] ?? 'assist';
      const epTier = ep.effectiveTier;
      const epTierOpacity =
        epTier === 'story_beat'  ? ACTIVITY_ICON_OPACITY_STORY :
        epTier === 'shaping'     ? ACTIVITY_ICON_OPACITY_SHAPING :
        ACTIVITY_ICON_OPACITY_BACKGROUND;
      upsertIcon(
        ep.actorId,
        {
          iconKey: getEncounterActivityIconKey(encounterType, 'start_local'),
          tierOpacity: epTierOpacity,
        },
        2,
      );
    }

    return [...resultByAgent.values()].map((entry) => ({
      agentId: entry.agentId,
      worldX: entry.worldX,
      worldY: entry.worldY,
      iconKey: entry.iconKey,
      tierOpacity: entry.tierOpacity,
    }));
  }, [
    gameState.unifiedActions,
    gameState.encounterProgress,
    gameState.graph,
    latestThreadEncounterDecisions,
    runtime.worldVersion,
  ]);

  // ── Strategic overlay data (hex map dots + ThreadsPanel summaries) ──
  // Rebuilds when strategicState changes (each tick where agents take strategic actions).
  const hexStrategicOverlays = useMemo<Map<string, HexStrategicOverlay>>(() => {
    return getHexStrategicOverlays(gameState.strategicState, gameState.graph);
  }, [gameState.strategicState, gameState.graph]);

  const agentStrategicSummaries = useMemo<Map<string, AgentStrategicSummary>>(() => {
    const result = new Map<string, AgentStrategicSummary>();
    if (!gameState.strategicState) return result;
    for (const node of threadedNodes) {
      if (node.category !== 'agent') continue;
      const summary = getAgentStrategicSummary(gameState.strategicState, node.id, gameState.graph, gameState.tick);
      if (summary) result.set(node.id, summary);
    }
    return result;
  }, [gameState.strategicState, gameState.graph, gameState.tick, threadedNodes]);

  // ── Location render data adapter (graph → LocationNode[]) ──
  // TB-086: Key off structuralCacheVersion (not worldVersion) — locationSubtype
  // changes from settlement promotion call touchStructure(), so structuralCacheVersion
  // is the correct dependency. worldVersion bumps every tick and would rebuild the
  // entire Three.js scene on each tick (zoom reset + visual artifacts).
  const locationNodes = useMemo<LocationNode[]>(() => {
    return gameState.graph.getNodesByType('location')
      .filter(n => n.properties.hexCol != null && n.properties.hexRow != null)
      .filter(n => !n.properties.sublocationTypeId)
      .map(n => ({
        locationType: (n.properties.locationSubtype ?? n.properties.locationType ?? 'unexplored_poi') as string,
        hexCol: n.properties.hexCol as number,
        hexRow: n.properties.hexRow as number,
        name: n.name,
        isCapital: n.properties.locationType === 'capital' || n.properties.locationSubtype === 'capital',
        isAnomalyLocation: n.properties.isAnomalyLocation === true,
        discoveredByExploration: n.properties.discoveredByExploration === true,
      }));
  }, [gameState.graph, runtime.structuralCacheVersion]);

  // ── Anomaly shimmer data (all anomalies including undiscovered) ──
  const anomalyNodes = useMemo(() => {
    return locationNodes
      .filter(n => n.isAnomalyLocation)
      .map(n => ({
        hexCol: n.hexCol,
        hexRow: n.hexRow,
        locationType: n.locationType,
        discovered: n.discoveredByExploration ?? false,
      }));
  }, [locationNodes]);

  const roadPaths = useMemo(() => extractRoadPaths(gameState.graph), [gameState.graph, runtime.structuralCacheVersion]);

  // ── Military render data adapters (graph → ArmyRenderData[], BattleRenderData[], SiegeRenderData[]) ──
  // Single pass over actors for army + battle + siege data (was 3 separate getNodesByType calls)
  const { armyRenderData, battleRenderData, siegeRenderDataRaw } = useMemo(() => {
    // Build faction ID → index map once (was inside army loop)
    const factionIdxMap = new Map<string, number>();
    for (let i = 0; i < factionNodes.length; i++) {
      factionIdxMap.set(factionNodes[i].id, i);
    }

    const armies: ArmyRenderData[] = [];
    const battles: BattleRenderData[] = [];
    const sieges: { node: typeof actors[0]; battleState: BattleState }[] = [];

    for (const node of actors) {
      const armyState = node.properties.armyState as ArmyState | undefined;
      const battleState = node.properties.battleState as BattleState | undefined;

      // Army data
      if (armyState != null) {
        let hexCol = node.properties.hexCol as number | undefined;
        let hexRow = node.properties.hexRow as number | undefined;
        if (hexCol == null || hexRow == null) {
          const locEdges = gameState.graph.getOutgoingEdges(node.id, 'located_at');
          if (locEdges.length > 0) {
            const loc = gameState.graph.getNode(locEdges[0].target);
            hexCol = loc?.properties.hexCol as number | undefined;
            hexRow = loc?.properties.hexRow as number | undefined;
          }
        }
        if (hexCol != null && hexRow != null) {
          const memberEdges = gameState.graph.getOutgoingEdges(node.id, 'member_of');
          const factionId = memberEdges.length > 0 ? memberEdges[0].target : undefined;
          const factionIdx = factionId ? (factionIdxMap.get(factionId) ?? 0) : 0;
          const factionColor = FACTION_HERALDIC_COLORS[Math.max(0, factionIdx) % FACTION_HERALDIC_COLORS.length];
          // Extract faction definition ID for coat of arms lookup
          // factionId format: "faction_def_{defId}" or "faction_def_{defId}_{suffix}"
          let factionDefId: string | null = null;
          if (factionId) {
            const defMatch = factionId.match(/^faction_def_(.+?)(?:_\d+)?$/);
            if (defMatch) factionDefId = defMatch[1];
          }
          armies.push({
            armyId: node.id, hexCol, hexRow, factionColor, factionDefId,
            armySize: armyState.headcount ?? ARMY_SIZE_SMALL_MAX,
            isInBattle: battleState != null,
          });
        }
      }

      // Battle data
      if (battleState != null) {
        const hexCol = node.properties.hexCol as number | undefined;
        const hexRow = node.properties.hexRow as number | undefined;
        if (hexCol != null && hexRow != null) {
          battles.push({ battleNodeId: node.id, hexCol, hexRow });
        }
        // Siege candidates
        if (battleState.battleType === 'siege' && battleState.settlementId) {
          sieges.push({ node, battleState });
        }
      }
    }
    return { armyRenderData: armies, battleRenderData: battles, siegeRenderDataRaw: sieges };
  }, [actors, factionNodes, gameState.graph]);

  const siegeRenderData = useMemo<SiegeRenderData[]>(() => {
    // Build faction ID → index map once
    const factionIdxMap = new Map<string, number>();
    for (let i = 0; i < factionNodes.length; i++) {
      factionIdxMap.set(factionNodes[i].id, i);
    }
    const result: SiegeRenderData[] = [];
    for (const { node, battleState } of siegeRenderDataRaw) {
      const settlementNode = gameState.graph.getNode(battleState.settlementId!);
      const sCol = settlementNode?.properties.hexCol as number | undefined;
      const sRow = settlementNode?.properties.hexRow as number | undefined;
      if (sCol == null || sRow == null) continue;

      const attackerNode = gameState.graph.getNode(battleState.attackerArmyId);
      const memberEdges = attackerNode ? gameState.graph.getOutgoingEdges(attackerNode.id, 'member_of') : [];
      const factionId = memberEdges.length > 0 ? memberEdges[0].target : undefined;
      const factionIdx = factionId ? (factionIdxMap.get(factionId) ?? 0) : 0;
      const factionColor = FACTION_HERALDIC_COLORS[Math.max(0, factionIdx) % FACTION_HERALDIC_COLORS.length];

      result.push({
        siegeNodeId: node.id,
        settlementHexCol: sCol,
        settlementHexRow: sRow,
        factionColor,
      });
    }
    return result;
  }, [siegeRenderDataRaw, factionNodes, gameState.graph]);

  // ── Notification preferences hook ──
  const {
    preferences: notificationPrefs,
    toggleCategory: toggleNotifCategory,
    setMode: setNotifMode,
    resetToDefaults: resetNotifPrefs,
  } = useNotificationPreferences();
  const [interruptSuppressedUntilTick, setInterruptSuppressedUntilTick] = useState<number | null>(null);
  const interruptsSuppressed = interruptSuppressedUntilTick !== null && gameState.tick < interruptSuppressedUntilTick;

  // ── Notification navigation hook ──
  const handleNotificationNavigate = useNotificationNavigation({
    onSelectAgent: handleAgentSelect,
    onFocusHex: (col: number, row: number) => {
      if (hexMapRef.current) {
        const px = hexToPixel({ col, row }, HEX_CONSTANTS.HEX_SIZE);
        hexMapRef.current.centerOn(px.x, -px.y, RETINUE_EYE_ZOOM_SCALE);
      }
    },
    onOpenLocation: handleLocationClick,
  });

  // ── Notification system hook ──
  const {
    notificationState,
    currentPopup,
    handleDismissToast,
    handleDismissAlert,
    handleDismissPopup,
    handlePopupChoice,
  } = useNotifications({
    tickEvents: gameState.tickEvents,
    running,
    setRunning,
    visibilityMap: effectiveVisibilityMap,
    suspendChoicePopups: interruptSuppressedUntilTick !== null && gameState.tick < interruptSuppressedUntilTick,
    preferences: notificationPrefs,
  });

  // ── Divine Premonition modal state ──
  // Pops the next ready premonition from the queue (respects display delay).
  const activePremonition = useMemo(() => {
    const queue = gameState.premonitionQueue ?? [];
    const ready = queue.find(p => gameState.tick >= p.showAfterTick);
    return ready ?? null;
  }, [gameState.premonitionQueue, gameState.tick]);

  const handleWhisperChoice = useCallback((nudge: WhisperNudge) => {
    if (!activePremonition) return;
    const result = applyWhisperChoice(
      gameState, activePremonition.agentId, activePremonition.agentName, nudge,
    );
    // Remove from queue
    const remaining = (gameState.premonitionQueue ?? []).filter(p => p.id !== activePremonition.id);
    setGameState(prev => ({ ...prev, premonitionQueue: remaining }));
  }, [activePremonition, gameState]);

  const handleCompulsionChoice = useCallback((candidate: CompulsionCandidate) => {
    if (!activePremonition) return;
    const result = applyCompulsionChoice(
      gameState, activePremonition.agentId, activePremonition.agentName, candidate,
    );
    // Remove from queue
    const remaining = (gameState.premonitionQueue ?? []).filter(p => p.id !== activePremonition.id);
    setGameState(prev => ({ ...prev, premonitionQueue: remaining }));
  }, [activePremonition, gameState]);

  const handlePremonitionDismiss = useCallback(() => {
    if (!activePremonition) return;
    dismissPremonition(
      activePremonition.id,
      activePremonition.agentId,
      activePremonition.agentName,
      activePremonition.type,
      gameState.tick,
    );
    // Remove from queue
    const remaining = (gameState.premonitionQueue ?? []).filter(p => p.id !== activePremonition.id);
    setGameState(prev => ({ ...prev, premonitionQueue: remaining }));
  }, [activePremonition, gameState.tick]);

  // ── Tiered encounter modal (TB-055) ──
  const [tieredEncounterState, setTieredEncounterState] = useState<{
    notification: EncounterNotification;
    encounter: ActiveEncounterDisplay;
    template: EncounterTemplate;
    agentId: string;
    agentName: string;
    threadTier: ReturnType<typeof courtPositionToThreadTier>;
    openedAsInterrupt?: boolean;
    activeActionId?: string;
    clearanceGateRuntimeId?: string;
    activeActionSnapshot?: UnifiedAction;
    clearanceGateStateSnapshot?: ClearanceGateRuntimeState;
  } | null>(null);

  // ── Encounter adapter routing: gate duty uses its specialized adapter,
  // other qualifying unified encounters use the general adapter,
  // legacy encounters fall back to the simple adapter ──
  const isGateDutyEncounterStage = tieredEncounterState?.template.id === 'cg.quest.gate_duty'
    && tieredEncounterState.threadTier !== 'watched';

  // Check if the current encounter qualifies for the general unified encounter stage
  const unifiedTemplateForStage = useMemo(() => {
    if (!tieredEncounterState || isGateDutyEncounterStage) return null;
    if (tieredEncounterState.threadTier === 'watched') return null;
    const ut = getUnifiedTemplateById(tieredEncounterState.template.id);
    if (!ut) return null;
    // Qualify if the template has support bundle, branching steps, or aftermath config
    const hasSupportBundle = !!ut.supportBundle && ut.supportBundle.length > 0;
    const hasBranching = ut.steps.some(step => 'branchOnStep' in step);
    const hasAftermath = !!ut.aftermathConfig;
    return (hasSupportBundle || hasBranching || hasAftermath) ? ut : null;
  }, [tieredEncounterState, isGateDutyEncounterStage]);

  const encounterStageActiveAction = useMemo(() => {
    if (!(isGateDutyEncounterStage || !!unifiedTemplateForStage) || !tieredEncounterState) return null;
    if (tieredEncounterState.activeActionId) {
      const byId = gameState.unifiedActions.find(action => action.actionId === tieredEncounterState.activeActionId);
      if (byId) return byId;
    }
    const byAgentAndTemplate = gameState.unifiedActions.find(action =>
      !action.resolved
      && action.actorId === tieredEncounterState.agentId
      && action.templateId === tieredEncounterState.template.id,
    );
    return byAgentAndTemplate ?? tieredEncounterState.activeActionSnapshot ?? null;
  }, [gameState.unifiedActions, isGateDutyEncounterStage, unifiedTemplateForStage, tieredEncounterState]);

  const gateDutyClearanceGateState = useMemo(() => {
    const runtimeId = tieredEncounterState?.clearanceGateRuntimeId ?? encounterStageActiveAction?.clearanceGateIds?.[0];
    if (!runtimeId) return tieredEncounterState?.clearanceGateStateSnapshot;
    return gameState.clearanceGateStates?.get(runtimeId) ?? tieredEncounterState?.clearanceGateStateSnapshot;
  }, [gameState.clearanceGateStates, encounterStageActiveAction, tieredEncounterState]);

  // Build EncounterStageModel for gate duty and general unified encounters
  const encounterStageModel = useMemo(() => {
    if (!(isGateDutyEncounterStage || !!unifiedTemplateForStage) || !tieredEncounterState) return null;

    // Gate duty uses its specialized adapter
    if (isGateDutyEncounterStage) {
      return buildGateDutyEncounterStageModel({
        template: tieredEncounterState.template,
        encounter: tieredEncounterState.encounter,
        notification: tieredEncounterState.notification,
        agentName: tieredEncounterState.agentName,
        threadTier: tieredEncounterState.threadTier,
        graph: gameState.graph,
        activeAction: encounterStageActiveAction ?? undefined,
        clearanceGateState: gateDutyClearanceGateState,
        essence: SPHERE_NAMES.reduce((sum, s) => sum + gameState.essencePool[s], 0),
      });
    }

    // General unified encounters use the new adapter
    if (unifiedTemplateForStage && encounterStageActiveAction) {
      return buildUnifiedEncounterStageModel({
        template: unifiedTemplateForStage,
        activeAction: encounterStageActiveAction,
        notification: tieredEncounterState.notification,
        agentName: tieredEncounterState.agentName,
        threadTier: tieredEncounterState.threadTier,
        graph: gameState.graph,
        essence: SPHERE_NAMES.reduce((sum, s) => sum + gameState.essencePool[s], 0),
        doomIdentityMatrix: gameState.doomIdentityMatrix,
        gameState,
        tick: gameState.tick,
      });
    }

    return null;
  }, [
    gameState,
    gameState.graph,
    gameState.essencePool,
    gameState.tick,
    encounterStageActiveAction,
    gateDutyClearanceGateState,
    isGateDutyEncounterStage,
    unifiedTemplateForStage,
    tieredEncounterState,
  ]);

  // ── Unified model for EncounterVeil: reuses existing adapters when available,
  // falls back to the simple adapter for legacy encounters ──
  const encounterVeilModel = useMemo(() => {
    if (!tieredEncounterState) return null;
    // Existing adapter paths remain
    if (isGateDutyEncounterStage && encounterStageModel) return encounterStageModel;
    if (unifiedTemplateForStage && encounterStageModel) return encounterStageModel;
    // Fall back to simple adapter for legacy encounters
    return buildSimpleEncounterStageModel({
      notification: tieredEncounterState.notification,
      encounter: tieredEncounterState.encounter,
      template: tieredEncounterState.template,
      agentName: tieredEncounterState.agentName,
      agentId: tieredEncounterState.agentId,
      graph: gameState.graph,
      threadTier: tieredEncounterState.threadTier,
      essence: SPHERE_NAMES.reduce((sum, s) => sum + gameState.essencePool[s], 0),
      tick: gameState.tick,
      gameState,
    });
  }, [tieredEncounterState, isGateDutyEncounterStage, unifiedTemplateForStage, encounterStageModel, gameState, gameState.graph, gameState.essencePool, gameState.tick]);

  // ── Encounter notification surfacing (TB-040 / TB-055) ──
  /** Open the tiered encounter modal from a notification (toast click or auto-interrupt) */
  const handleOpenEncounterFromNotification = useCallback((notif: EncounterNotification) => {
    const template = resolveEncounterTemplate(notif.encounterId);
    if (!template) return;
    const { encounter, activeAction } = selectEncounterRuntimeForNotification(
      notif,
      gameState.encounterProgress,
      gameState.unifiedActions,
      gameState.tick,
    );
    if (!encounter) return;
    if (notif.stepIndex !== undefined && notif.stepIndex !== encounter.currentStepIndex) return;
    const threadTier = courtPositionToThreadTier(notif.courtPosition);
    const clearanceGateRuntimeId = activeAction?.clearanceGateIds?.[0];
    const clearanceGateStateSnapshot = clearanceGateRuntimeId
      ? gameState.clearanceGateStates?.get(clearanceGateRuntimeId)
      : undefined;
    setTieredEncounterState({
      notification: notif,
      encounter,
      template,
      agentId: notif.agentId,
      agentName: notif.agentName,
      threadTier,
      openedAsInterrupt: true,
      activeActionId: activeAction?.actionId,
      clearanceGateRuntimeId,
      activeActionSnapshot: activeAction,
      clearanceGateStateSnapshot,
    });
  }, [gameState.clearanceGateStates, gameState.encounterProgress, gameState.tick, gameState.unifiedActions]);

  const encounterToasts = useEncounterNotifications({
    encounterNotifications: gameState.encounterNotifications,
    setGameState,
    onOpenEncounter: handleOpenEncounterFromNotification,
  });

  // ── Keyboard hotkeys ──
  useTopBarHotkeys({
    running,
    speed,
    onToggle: handleToggleRunning,
    onSpeedChange: setSpeed,
    onStep: doTick,
    onMoveClick: handleAvatarMoveClick,
  });

  // ── Audio volume handlers ──
  const handleMusicVolume = useCallback((v: number) => {
    setMusicVolume(v);
    setMusicVolumeState(v);
  }, []);

  const handleBgVolume = useCallback((v: number) => {
    setBackgroundVolume(v);
    setBgVolumeState(v);
  }, []);

  const handleUiVolume = useCallback((v: number) => {
    setUiVolume(v);
    setUiVolumeState(v);
  }, []);

  const handleToggleAudioMute = useCallback(() => {
    if (audioMuted) { unmuteAll(); setAudioMuted(false); }
    else { muteAll(); setAudioMuted(true); }
  }, [audioMuted]);

  // ── Essence income (view-layer, pure computation) ──
  const essenceIncome = useMemo(
    () => computeEssenceIncome(gameState.graph, gameState.ascendantId, gameState.controlEffects),
    [gameState.graph, gameState.ascendantId, gameState.tick, gameState.controlEffects],
  );

  const firstJourneyStatus = useMemo(() => {
    const candidates = getThreadsFrom(gameState.graph, gameState.ascendantId)
      .map((edge) => ({
        props: edge.properties as ThreadEdgeProperties,
        node: gameState.graph.getNode(edge.target),
      }))
      .filter(({ props }) =>
        props.courtPosition === 'the_first' ||
        props.storyPhase != null ||
        (props.beatHistory?.length ?? 0) > 0 ||
        props.ordealOutcome != null,
      );

    if (candidates.length === 0) return null;

    const current = candidates.find(({ props }) => props.courtPosition === 'the_first') ?? candidates[0];
    return {
      active: current.props.courtPosition === 'the_first',
      phase: current.props.storyPhase,
      agentName: current.node?.name ?? 'The First',
    };
  }, [gameState.graph, gameState.ascendantId, runtime.worldVersion]);

  const doomJourneyLabel = useMemo(() => {
    if (!firstJourneyStatus) return undefined;
    return formatJourneyPhaseLabel(firstJourneyStatus.phase, firstJourneyStatus.active);
  }, [firstJourneyStatus]);

  // ── Non-agent target context (hex-zoom and location views) ──
  const [nonAgentDrawerOpen, setNonAgentDrawerOpen] = useState(false);
  const [manualTargetContext, setManualTargetContext] = useState<import('../../types/targetContext').TargetContext | null>(null);

  // Build a TargetContext for the currently focused hex or location, or selected hex on world map
  const autoNonAgentTargetContext = useMemo(() => {
    if (viewLevel === 'hex-zoom' && focusedHex) {
      // Use gameState.tiles for live mutable state (divineInfluence, corruption)
      const liveTile = getTile(focusedHex.col, focusedHex.row);
      return buildHexTargetContext({
        col: focusedHex.col,
        row: focusedHex.row,
        terrain: liveTile?.terrain ?? 'plains',
        divineInfluence: liveTile?.divineInfluence,
        corruption: liveTile?.corruption,
      });
    }
    if (viewLevel === 'location' && focusedLocationId) {
      return buildLocationTargetContext(focusedLocationId, gameState.graph);
    }
    // Selected hex on world map (click-to-select pattern)
    if (selectedHexCoord) {
      const liveTile = getTile(selectedHexCoord.col, selectedHexCoord.row);
      return buildHexTargetContext({
        col: selectedHexCoord.col,
        row: selectedHexCoord.row,
        terrain: liveTile?.terrain ?? 'plains',
        divineInfluence: liveTile?.divineInfluence,
        corruption: liveTile?.corruption,
      });
    }
    return null;
  }, [viewLevel, focusedHex, focusedLocationId, selectedHexCoord, getTile, gameState.graph]);

  const nonAgentTargetContext = manualTargetContext ?? autoNonAgentTargetContext;

  // Auto-open the non-agent drawer when a targetable context is active.
  // World map: hex selected → show hex actions. Location view: show location actions.
  // Hex-zoom: no auto-open — user picks targets (locations, agents) within the chronicle.
  useEffect(() => {
    if (manualTargetContext) return;
    const hasTarget =
      (viewLevel === 'location' && !!focusedLocationId) ||
      (viewLevel === 'world' && !!selectedHexCoord);
    setNonAgentDrawerOpen(hasTarget);
  }, [viewLevel, selectedHexCoord, focusedLocationId, manualTargetContext]);

  const nonAgentSlots = useTargetActions({
    target: nonAgentTargetContext,
    gameState,
    archetype,
    drawerOpen: nonAgentDrawerOpen,
  });

  // ── Hex zoom derived data ──
  const {
    hexLocations,
    hexAgentsByLocation,
    hexFactionsByLocation,
    hexConnections,
    hexSphereInfluence,
    hexLineOfSight,
    hexTotalAgents,
    hexCultures,
    hexFactions,
    hexRegionData,
    focusedLocation,
    focusedLocationAgents,
  } = useHexZoomData({
    graph: gameState.graph,
    ascendantId: gameState.ascendantId,
    focusedHex,
    focusedLocationId,
    tiles,
    fogDisabled,
    worldVersion: runtime.worldVersion,
  });

  // ── Location activity summaries — drives murmur tooltips on hex hover (THR-22) ──
  const { summaries: locationActivitySummaries } = useLocationActivities({
    graph: gameState.graph,
    unifiedActions: gameState.unifiedActions,
    familiarityMap: gameState.familiarityMap,
    visibilityMap: effectiveVisibilityMap,
    fogDisabled,
    tick: gameState.tick,
    omenState: gameState.omenState,
    worldVersion: runtime.worldVersion,
  });
  // agentId → ActivityCategory lookup for halo rendering (stranger tier excluded)
  const agentActivityCategoryMap = useMemo(() => {
    const map = new Map<string, import('../../types/locationActivity').ActivityCategory>();
    for (const summary of locationActivitySummaries.values()) {
      for (const thread of summary.agentThreads) {
        if (thread.familiarityScore >= 0.2 && thread.category !== 'idle') {
          map.set(thread.agentId, thread.category);
        }
      }
    }
    return map;
  }, [locationActivitySummaries]);

  // Enrich agentRenderData with activityCategory for halo rendering (must follow agentActivityCategoryMap)
  const agentRenderDataWithActivity = useMemo(
    () => agentRenderData.map(a => ({
      ...a,
      activityCategory: agentActivityCategoryMap.get(a.id),
    })),
    [agentRenderData, agentActivityCategoryMap],
  );

  // Re-key by "col,row" for O(1) lookup by hoveredHex in HexMapV2
  const locationActivityByHex = useMemo(() => {
    const byHex = new Map<string, import('../../types/locationActivity').LocationActivitySummary>();
    for (const summary of locationActivitySummaries.values()) {
      byHex.set(`${summary.hexCol},${summary.hexRow}`, summary);
    }
    return byHex;
  }, [locationActivitySummaries]);

  // ── Ambient audio context inputs ──
  /** Dominant location sound subtype for the hex chronicle panel (priority 1). */
  const hexChronicleSubtype = useMemo<import('../../types').LocationSubtype | null>(() => {
    if (viewLevel !== 'hex-zoom' || !focusedHex) return null;
    const locs = locationNodes.filter(
      l => l.hexCol === focusedHex.col && l.hexRow === focusedHex.row
    );
    if (locs.length === 0) return null;
    const PRIORITY = [
      'city', 'capital', 'castle', 'fort', 'temple', 'shrine', 'healing_spring',
      'standing_stones', 'ley_nexus', 'fey_crossing', 'living_archive',
      'cavern', 'ruins', 'ruined_city', 'crystal_cavern', 'ancient_vault', 'shadow_hollow',
      'sacrifice_site', 'haunted_ground', 'corruption_zone', 'nest', 'lair', 'battleground',
      'hamlet', 'town',
    ] as const;
    for (const s of PRIORITY) {
      if (locs.some(l => l.locationType === s)) return s as import('../../types').LocationSubtype;
    }
    return (locs[0]!.locationType as import('../../types').LocationSubtype) ?? null;
  }, [viewLevel, focusedHex, locationNodes]);

  /** Location subtype for the open location detail panel (priority 2). */
  const locationDetailSubtype = useMemo<import('../../types').LocationSubtype | null>(() => {
    if (viewLevel !== 'location') return null;
    const subtype = focusedLocation?.properties?.locationSubtype as string | undefined;
    return (subtype as import('../../types').LocationSubtype) ?? null;
  }, [viewLevel, focusedLocation]);

  /** Active encounter template for audio override (priority 3). */
  const activeEncounterTemplate = useMemo<EncounterTemplate | null>(() => {
    const active = gameState.encounterProgress.find(ep => ep.status === 'active');
    if (!active) return null;
    return resolveEncounterTemplate(active.encounterId) ?? null;
  }, [gameState.encounterProgress]);

  // ── Ambient audio context ──
  useAmbientContext({
    terrainHex: selectedHex ?? cameraCenter,
    tiles,
    hexChronicleSubtype,
    locationDetailSubtype,
    activeEncounterTemplate,
  });

  // ── Location encounter data (available + active) ──
  const locationEncounters = useMemo(() => {
    if (!focusedLocation || viewLevel !== 'location') {
      return { available: [], active: [] };
    }

    // Get location subtype for encounter lookup
    const locProps = (focusedLocation.properties ?? {}) as Record<string, unknown>;
    const subtype = typeof locProps.locationSubtype === 'string'
      ? locProps.locationSubtype
      : '';

    // Get available encounters for this location type + its sublocation types
    const sublocationTypeIds = (SUBTYPE_SUBLOCATION_MAP[subtype] ?? []).map(d => d.id);
    const available = subtype ? getEncountersForLocation(subtype, sublocationTypeIds) : [];

    // Get active encounters whose actor is at this location.
    // Unified actions are the primary display model; legacy progress only fills gaps.
    const activeByActor = new Map<string, ActiveEncounterDisplay>();
    const actorAtFocusedLocation = (actorId: string) => {
      const actorEdges = gameState.graph.getAllEdgesForNode(actorId);
      return actorEdges.some(e => e.type === 'located_at' && e.target === focusedLocation.id);
    };

    for (const progress of gameState.encounterProgress) {
      if (progress.status !== 'active') continue;
      if (!actorAtFocusedLocation(progress.actorId)) continue;
      activeByActor.set(progress.actorId, buildActiveEncounterDisplayFromLegacyProgress(progress));
    }

    for (const action of gameState.unifiedActions) {
      if (action.resolved) continue;
      if (!resolveEncounterTemplate(action.templateId)) continue;
      if (!actorAtFocusedLocation(action.actorId)) continue;
      activeByActor.set(action.actorId, buildActiveEncounterDisplayFromUnifiedAction(action, gameState.tick));
    }

    const active = Array.from(activeByActor.values());

    return { available, active };
  }, [focusedLocation, viewLevel, gameState.encounterProgress, gameState.graph, gameState.tick, gameState.unifiedActions]);

  // RC-002: Extracted to avoid inline arrow in render
  const getAgentName = useCallback(
    (id: string) => gameState.graph.getNode(id)?.name ?? 'Unknown',
    [gameState.graph, runtime.worldVersion],
  );

  // IX-002: Wrapped scry click with cross-hook overlay mutual exclusion
  // Also clears agent & hex selection so ActionDrawers don't persist behind the court overlay
  const handleScryWithMutex = useCallback(() => {
    closeAllAgentOverlays();
    handleBackFromAgentDetail(); // clears selectedAgentId + drawerOpen
    handleHexDetailClose();      // clears selectedHexCoord
    setNonAgentDrawerOpen(false);
    setManualTargetContext(null);
    handleAvatarScryClick();
  }, [closeAllAgentOverlays, handleBackFromAgentDetail, handleHexDetailClose, handleAvatarScryClick]);

  // NFP #1: Named constant for retinue eye-icon zoom level.
  // Maximum zoom — agent eye icon zooms in tight to the agent's hex.
  const RETINUE_EYE_ZOOM_SCALE = 20;

  // Eye icon next to agent name: zoom camera to agent's hex at max zoom
  const handleCenterOnHex = useCallback((locationId: string) => {
    const locNode = gameState.graph.getNode(locationId);
    if (!locNode) return;
    const props = (locNode.properties ?? {}) as Record<string, unknown>;
    const col = typeof props.hexCol === 'number' ? props.hexCol : undefined;
    const row = typeof props.hexRow === 'number' ? props.hexRow : undefined;
    if (col !== undefined && row !== undefined && hexMapRef.current) {
      const px = hexToPixel({ col, row }, HEX_CONSTANTS.HEX_SIZE);
      // Y-flip: hexToPixel returns SVG y-down, Three.js camera uses y-up
      hexMapRef.current.centerOn(px.x, -px.y, RETINUE_EYE_ZOOM_SCALE);
    }
  }, [gameState.graph, hexMapRef]);

  // Eye icon next to location name: navigate to the location detail view
  const handleZoomToLocation = useCallback((locationId: string) => {
    handleLocationClick(locationId);
  }, [handleLocationClick]);

  // ── Debug bridge: gotoAgent ───────────────────────────────────────────────
  // graphRef always holds the latest graph so the registered callback never
  // closes over a stale reference (graph mutates in-place but rerenders swap
  // the object). See load-bearing decision: "world graph is mutated in place".
  const _gotoAgentGraphRef = useRef(gameState.graph);
  _gotoAgentGraphRef.current = gameState.graph;

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerGotoAgent((id: string) => {
      const graph = _gotoAgentGraphRef.current;
      const actors = graph.getNodesByType('actor');
      const match = actors.find(n =>
        n.id === id ||
        n.id.startsWith(id) ||
        ((n.properties.name as string | undefined) ?? '').toLowerCase().includes(id.toLowerCase())
      );
      if (!match) return false;

      // Walk located_at → parentLocationId chain to find hexCol/hexRow
      let hexCol: number | undefined;
      let hexRow: number | undefined;
      const locEdges = graph.getOutgoingEdges(match.id, 'located_at');
      if (locEdges.length > 0) {
        let locNode = graph.getNode(locEdges[0].target) ?? null;
        for (let depth = 0; depth < 3 && locNode; depth++) {
          const p = locNode.properties as Record<string, unknown>;
          if (typeof p.hexCol === 'number') {
            hexCol = p.hexCol;
            hexRow = p.hexRow as number;
            break;
          }
          const parentId = p.parentLocationId as string | undefined;
          locNode = parentId ? (graph.getNode(parentId) ?? null) : null;
        }
      }

      if (hexCol !== undefined && hexRow !== undefined && hexMapRef.current) {
        const px = hexToPixel({ col: hexCol, row: hexRow }, HEX_CONSTANTS.HEX_SIZE);
        hexMapRef.current.centerOn(px.x, -px.y, RETINUE_EYE_ZOOM_SCALE);
      }

      handleAgentSelect(match.id);
      return true;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Runs once — live deps accessed via refs (graphRef) or stable callbacks (handleAgentSelect, hexMapRef)

  // ── Debug bridge: fog toggle ─────────────────────────────────────────────
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerFogToggle((enabled?: boolean) => {
      if (enabled === undefined) {
        // Toggle: flip the current state; return new fog-enabled state
        const newFogEnabled = fogDisabled; // fogDisabled=true means fog is currently off, so toggling enables it
        setFogDisabled(prev => !prev);
        return newFogEnabled;
      }
      setFogDisabled(!enabled);
      return enabled;
    });
  }, [fogDisabled]);

  // ── Debug bridge: scene snapshot + viewport/hex conversion ────────────────
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;

    window.__DEBUG._registerSceneSnapshot(() => (
      hexMapRef.current?.snapshotScene() ?? {
        hexCount: 0,
        agentsVisible: 0,
        locationsVisible: 0,
        armiesVisible: 0,
        battlesVisible: 0,
        siegesVisible: 0,
        threadLines: 0,
        activityIcons: 0,
        fogEnabled: !fogDisabled,
        layersActive: [],
      }
    ));
    window.__DEBUG._registerViewportForHex((col: number, row: number) =>
      hexMapRef.current?.getViewportForHex(col, row) ?? null
    );
    window.__DEBUG._registerHexAtViewport((x: number, y: number) =>
      hexMapRef.current?.getHexAtViewport(x, y) ?? null
    );
  }, [fogDisabled, hexMapRef]);

  // ── Debug bridge: omniscience toggle ─────────────────────────────────────
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerOmniscienceToggle((enabled?: boolean) => {
      if (enabled === undefined) {
        const next = !omniscienceMode;
        setOmniscienceMode(next);
        return next;
      }
      setOmniscienceMode(enabled);
      return enabled;
    });
  }, [omniscienceMode]);

  // ── Debug bridge: setQuintessence / setBand (THR-184) ─────────────────────
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerSetQuintessence((ratio: number) => {
      setGameState(prev => {
        const ascNode = prev.graph.getNode(prev.ascendantId);
        if (!ascNode) return prev;
        const props = ascNode.properties as Record<string, unknown>;
        const max = (props.quintessenceMax as number) ?? 100;
        props.quintessenceCurrent = Math.round(ratio * max);
        return { ...prev, worldVersion: (prev.worldVersion ?? 0) + 1 };
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debug bridge: listActions / fireAction ────────────────────────────────
  // A single ref captures the mutable state slices needed by both commands.
  // setGameState is a stable React dispatcher — it doesn't need the ref treatment.
  const _actionStateRef = useRef({
    graph: gameState.graph,
    tick: gameState.tick,
    seed: gameState.seed,
    ascendantId: gameState.ascendantId,
  });
  _actionStateRef.current = {
    graph: gameState.graph,
    tick: gameState.tick,
    seed: gameState.seed,
    ascendantId: gameState.ascendantId,
  };

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerActionBridge({
      listActions: (agentId?: string) => {
        const { graph } = _actionStateRef.current;

        // If agentId given, verify the agent exists first
        if (agentId !== undefined) {
          const actors = graph.getNodesByType('actor');
          const match = actors.find(n =>
            n.id === agentId ||
            n.id.startsWith(agentId) ||
            ((n.properties.name as string | undefined) ?? '').toLowerCase().includes(agentId.toLowerCase())
          );
          if (!match) return [];
        }

        // Return all actor-targeting templates
        return UNIFIED_ACTION_TEMPLATES
          .filter(t => {
            const cats = (t as { targetCategories?: string[] }).targetCategories ?? ['actor'];
            return cats.includes('actor');
          })
          .map(t => ({
            id: t.id,
            name: t.name,
            sphere: (t.sphereAffinity as string | null | undefined) ?? null,
            reach: (t as { reach?: string | null }).reach ?? null,
            essenceCost: t.essenceCost ?? 0,
            steps: t.steps.length,
            scale: t.scale,
          }));
      },

      fireAction: (agentId: string, templateId: string) => {
        const { graph, tick, seed, ascendantId } = _actionStateRef.current;

        // Find agent
        const actors = graph.getNodesByType('actor');
        const agentMatch = actors.find(n =>
          n.id === agentId ||
          n.id.startsWith(agentId) ||
          ((n.properties.name as string | undefined) ?? '').toLowerCase().includes(agentId.toLowerCase())
        );
        if (!agentMatch) return { success: false, message: `No agent matching '${agentId}'` };

        // Find template — exact id first, then partial match
        let template = getUnifiedTemplateById(templateId);
        if (!template) {
          template = UNIFIED_ACTION_TEMPLATES.find(t =>
            t.id.includes(templateId) ||
            t.name.toLowerCase().includes(templateId.toLowerCase())
          );
        }
        if (!template) return { success: false, message: `No template matching '${templateId}'` };

        const rng = mulberry32(seed + tick * 43);
        const action = createUnifiedAction({
          actorId: ascendantId,
          templateId: template.id,
          targetId: agentMatch.id,
          scale: template.scale,
          source: 'player',
          tick,
          template,
          rng,
          essencePaid: template.essenceCost ?? 0,
        });

        const tpl = template; // stable reference for closure
        setGameState(prev => {
          const newPool = { ...prev.essencePool };
          const cost = tpl.essenceCost ?? 0;
          if (cost > 0 && tpl.sphereAffinity) {
            newPool[tpl.sphereAffinity] = Math.max(0, (newPool[tpl.sphereAffinity] ?? 0) - cost);
          }
          return {
            ...prev,
            essencePool: newPool,
            unifiedActions: [...(prev.unifiedActions ?? []), action],
          };
        });

        const agentName = (agentMatch.properties.name as string | undefined) ?? agentMatch.id;
        return {
          success: true,
          actionId: action.actionId,
          templateName: tpl.name,
          message: `Fired '${tpl.name}' on '${agentName}'`,
        };
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Runs once — live deps accessed via _actionStateRef; setGameState is a stable dispatcher

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerEncounterBridge({
      spawnEncounter: (agentId: string, templateId: string, options) => {
        const prepared = prepareDebugEncounterSpawn(_gameStateRef.current, agentId, templateId, options);
        if (!prepared.success || !prepared.template || !prepared.notification || !prepared.agent) {
          return {
            success: false,
            message: prepared.message,
          };
        }

        const shouldOpen = options?.open ?? true;
        const notificationForState = {
          ...prepared.notification,
          viewed: shouldOpen,
        };

        setGameState(prev => ({
          ...prev,
          unifiedActions: prepared.unifiedAction
            ? [...(prev.unifiedActions ?? []), prepared.unifiedAction]
            : prev.unifiedActions,
          encounterProgress: prepared.encounterProgress
            ? [...prev.encounterProgress, prepared.encounterProgress]
            : prev.encounterProgress,
          clearanceGateStates: prepared.clearanceGateStates ?? prev.clearanceGateStates,
          encounterNotifications: [...(prev.encounterNotifications ?? []), notificationForState],
        }));

        if (shouldOpen) {
          const clearanceGateRuntimeId = prepared.unifiedAction?.clearanceGateIds?.[0];
          const encounter = prepared.unifiedAction
            ? buildActiveEncounterDisplayFromUnifiedAction(prepared.unifiedAction, _gameStateRef.current.tick)
            : prepared.encounterProgress
              ? buildActiveEncounterDisplayFromLegacyProgress(prepared.encounterProgress)
              : null;
          if (!encounter) {
            return {
              success: false,
              message: 'Encounter prepared but no modal runtime could be built.',
            };
          }
          setTieredEncounterState({
            notification: notificationForState,
            encounter,
            template: prepared.template,
            agentId: prepared.agent.id,
            agentName: prepared.agent.name,
            threadTier: courtPositionToThreadTier(notificationForState.courtPosition),
            activeActionId: prepared.unifiedAction?.actionId,
            clearanceGateRuntimeId,
            activeActionSnapshot: prepared.unifiedAction,
            clearanceGateStateSnapshot: clearanceGateRuntimeId
              ? prepared.clearanceGateStates?.get(clearanceGateRuntimeId)
              : undefined,
          });
        }

        return {
          success: true,
          templateId: prepared.template.id,
          templateName: prepared.template.name,
          mode: prepared.mode,
          actionId: prepared.unifiedAction?.actionId,
          notificationId: notificationForState.id,
          message: shouldOpen
            ? `${prepared.message} and opened it`
            : prepared.message,
        };
      },
      spawnEncounterContext: (templateId, options) => {
        const result = prepareDebugEncounterContext(_gameStateRef.current, templateId, options);
        if (result.success) {
          touchStructure(runtime);
          setGameState(prev => ({ ...prev, graph: prev.graph, clearanceGateStates: prev.clearanceGateStates }));
        }
        return result;
      },
      spawnAttachment: (agentQuery, templateQuery, options) => {
        const result = spawnDebugAttachment(_gameStateRef.current, agentQuery, templateQuery, options);
        if (result.success) {
          touchStructure(runtime);
          setGameState(prev => ({ ...prev, graph: prev.graph }));
        }
        return result;
      },
      spawnLocation: (subtype, col, row, options) => {
        const result = spawnDebugLocationAtHex(_gameStateRef.current, subtype, col, row, options);
        if (result.success) {
          touchStructure(runtime);
          setGameState(prev => ({ ...prev, graph: prev.graph }));
        }
        return result;
      },
      spawnSublocation: (sublocationTypeId, anchor, options) => {
        const result = spawnDebugSublocation(_gameStateRef.current, sublocationTypeId, anchor, options);
        if (result.success) {
          touchStructure(runtime);
          setGameState(prev => ({ ...prev, graph: prev.graph }));
        }
        return result;
      },
      spawnNpc: (role, anchor, options) => {
        const result = spawnDebugNpc(_gameStateRef.current, role, anchor, options);
        if (result.success) {
          touchStructure(runtime);
          setGameState(prev => ({ ...prev, graph: prev.graph }));
        }
        return result;
      },
      moveAgent: (agentQuery, anchor, options) => {
        const result = moveDebugAgent(_gameStateRef.current, agentQuery, anchor, options);
        if (result.success) {
          touchStructure(runtime);
          setGameState(prev => ({ ...prev, graph: prev.graph }));
        }
        return result;
      },
      pinAgent: (agentQuery: string) => {
        const state = _gameStateRef.current;
        const node = state.graph.getNodesByType('actor').find(
          n => n.id === agentQuery
            || n.name.toLowerCase() === agentQuery.toLowerCase()
            || n.id.startsWith(agentQuery),
        );
        if (!node) return { success: false, message: `No actor matching '${agentQuery}'.`, pinnedCount: 0 };
        const result = pinAgentDebug(state.graph, node.id, state.tick);
        if (result.success) setGameState(prev => ({ ...prev, graph: prev.graph }));
        return result;
      },
      unpinAgent: (agentQuery: string) => {
        const state = _gameStateRef.current;
        const node = state.graph.getNodesByType('actor').find(
          n => n.id === agentQuery
            || n.name.toLowerCase() === agentQuery.toLowerCase()
            || n.id.startsWith(agentQuery),
        );
        if (!node) return { success: false, message: `No actor matching '${agentQuery}'.`, pinnedCount: 0 };
        const result = unpinAgentDebug(state.graph, node.id, state.tick);
        if (result.success) setGameState(prev => ({ ...prev, graph: prev.graph }));
        return result;
      },
    });
  }, [runtime, setGameState]); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Runs effectively once; live game state is read through _gameStateRef and UI setters are stable.

  // ── Debug bridge: getRarityInfo / forceGraduate ──────────────────────────
  // Reuses _gotoAgentGraphRef which is already kept up-to-date with the live graph.
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerGraphProvider(() => _gotoAgentGraphRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debug bridge: inspectEncounterPipeline ────────────────────────────────
  const _gameStateRef = useRef(gameState);
  useEffect(() => { _gameStateRef.current = gameState; });
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerGameStateProvider(() => _gameStateRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const retinueActiveEncounters = useMemo(() => {
    const map = new Map<string, { encounter: ActiveEncounterDisplay; template: EncounterTemplate }>();
    for (const p of gameState.encounterProgress) {
      if (p.status !== 'active') continue;
      const tmpl = resolveEncounterTemplate(p.encounterId);
      if (tmpl) {
        map.set(p.actorId, {
          encounter: buildActiveEncounterDisplayFromLegacyProgress(p),
          template: tmpl,
        });
      }
    }
    for (const action of gameState.unifiedActions) {
      if (action.resolved) continue;
      const tmpl = resolveEncounterTemplate(action.templateId);
      if (!tmpl) continue;
      map.set(action.actorId, {
        encounter: buildActiveEncounterDisplayFromUnifiedAction(action, gameState.tick),
        template: tmpl,
      });
    }
    return map;
  }, [gameState.encounterProgress, gameState.tick, gameState.unifiedActions]);

  /** Open the tiered encounter modal from RetinuePanel or EncounterLog click */
  const handleEncounterClick = useCallback((
    agentId: string,
    encounter: ActiveEncounterDisplay,
    template: EncounterTemplate,
  ) => {
    // Resolve live runtime first so the modal opens from unified state when available.
    const { encounter: runtimeEncounter, activeAction } = selectEncounterRuntimeForDisplay(
      encounter,
      gameState.encounterProgress,
      gameState.unifiedActions,
      gameState.tick,
    );
    if (!runtimeEncounter) return;
    const notif = (gameState.encounterNotifications ?? []).find(
      n => n.agentId === agentId
        && n.encounterId === encounter.encounterId
        && (
          n.kind === 'aftermath'
            ? Boolean(runtimeEncounter.aftermathSummary)
            : (n.stepIndex ?? runtimeEncounter.currentStepIndex) === runtimeEncounter.currentStepIndex
        )
        && !n.resolved,
    );
    // Build a synthetic notification if none exists (e.g., for non-threaded agents)
    const notification: EncounterNotification = notif ?? {
      id: `synthetic-${agentId}-${encounter.encounterId}`,
      agentId,
      agentName: gameState.graph.getNode(agentId)?.name ?? 'Unknown',
      courtPosition: null,
      encounterId: encounter.encounterId,
      kind: runtimeEncounter.aftermathSummary ? 'aftermath' : 'step',
      stepIndex: runtimeEncounter.aftermathSummary ? undefined : runtimeEncounter.currentStepIndex,
      encounterName: template.name,
      prose: runtimeEncounter.aftermathSummary
        ? runtimeEncounter.aftermathSummary.overview
        : template.steps[runtimeEncounter.currentStepIndex]?.narrative ?? '',
      choices: [],
      createdTick: runtimeEncounter.startedTick,
      autoResolveTick: null,
      viewed: true,
      resolved: false,
      sourceSystem: runtimeEncounter.sourceSystem,
      actionId: runtimeEncounter.actionId ?? activeAction?.actionId,
    };
    const threadTier = courtPositionToThreadTier(notification.courtPosition);
    const clearanceGateRuntimeId = activeAction?.clearanceGateIds?.[0];
    const clearanceGateStateSnapshot = clearanceGateRuntimeId
      ? gameState.clearanceGateStates?.get(clearanceGateRuntimeId)
      : undefined;
    setTieredEncounterState({
      notification,
      encounter: runtimeEncounter,
      template,
      agentId,
      agentName: notification.agentName,
      threadTier,
      openedAsInterrupt: false,
      activeActionId: activeAction?.actionId,
      clearanceGateRuntimeId,
      activeActionSnapshot: activeAction,
      clearanceGateStateSnapshot,
    });
  }, [gameState.clearanceGateStates, gameState.encounterNotifications, gameState.encounterProgress, gameState.graph, gameState.tick, gameState.unifiedActions]);

  const resumeAfterEncounterCommit = useRef<boolean>(false);
  const suppressedEncounterNotificationId = useRef<string | null>(null);

  const closeEncounterModalAndResume = useCallback((openedAsInterrupt?: boolean) => {
    resumeAfterEncounterCommit.current = false;
    setTieredEncounterState(null);
    if (wasRunningBeforeEncounterPause.current || openedAsInterrupt) {
      wasRunningBeforeEncounterPause.current = false;
      setRunning(true);
    }
  }, [setRunning]);

  const handleEncounterDisregard = useCallback(() => {
    if (tieredEncounterState?.notification?.id) {
      suppressedEncounterNotificationId.current = tieredEncounterState.notification.id;
      setInterruptSuppressedUntilTick(gameState.tick + 1);
      setGameState(prev => {
        const unifiedActions = (prev.unifiedActions ?? []).map(action => {
          const matchesActiveAction =
            (tieredEncounterState.activeActionId && action.actionId === tieredEncounterState.activeActionId)
            || (
              !tieredEncounterState.activeActionId
              && !action.resolved
              && action.actorId === tieredEncounterState.agentId
              && action.templateId === tieredEncounterState.notification.encounterId
            );
          if (!matchesActiveAction) return action;
          const step = tieredEncounterState.template.steps[action.currentStep];
          return markUnifiedActionDisregarded(
            action,
            action.currentStep,
            step?.id ?? `step-${action.currentStep + 1}`,
            prev.tick,
          );
        });

        const encounterProgress = tieredEncounterState.encounter.sourceSystem === 'legacy_encounter'
          ? prev.encounterProgress.map(entry => {
              if (
                entry.actorId !== tieredEncounterState.agentId
                || entry.encounterId !== tieredEncounterState.notification.encounterId
                || entry.currentEncounterIndex !== tieredEncounterState.encounter.currentStepIndex
              ) {
                return entry;
              }
              const step = tieredEncounterState.template.steps[tieredEncounterState.encounter.currentStepIndex];
              return markEncounterProgressDisregarded(
                entry,
                tieredEncounterState.encounter.currentStepIndex,
                step?.id ?? `step-${tieredEncounterState.encounter.currentStepIndex + 1}`,
                prev.tick,
              );
            })
          : prev.encounterProgress;

        return {
          ...prev,
          unifiedActions,
          encounterProgress,
          encounterNotifications: (prev.encounterNotifications ?? []).map(notification =>
            notification.id === tieredEncounterState.notification.id
              ? { ...notification, resolved: true }
              : notification,
          ),
        };
      });
    }
    closeEncounterModalAndResume(tieredEncounterState?.openedAsInterrupt);
  }, [closeEncounterModalAndResume, gameState.tick, setGameState, tieredEncounterState]);

  const handleEncounterAcknowledgeAftermath = useCallback(() => {
    if (tieredEncounterState?.notification?.id) {
      suppressedEncounterNotificationId.current = tieredEncounterState.notification.id;
      setInterruptSuppressedUntilTick(gameState.tick + 1);
      setGameState(prev => ({
        ...prev,
        encounterNotifications: (prev.encounterNotifications ?? []).map(notification =>
          notification.id === tieredEncounterState.notification.id
            ? { ...notification, resolved: true }
            : notification,
        ),
      }));
    }
    closeEncounterModalAndResume(tieredEncounterState?.openedAsInterrupt);
  }, [closeEncounterModalAndResume, gameState.tick, setGameState, tieredEncounterState]);

  const applyAftermathReactionForAgent = useCallback((
    agentId: string,
    reactionId?: string,
    source: 'modal' | 'debug-bridge' = 'modal',
  ): {
    success: boolean;
    message: string;
    reactionId?: string;
    touchedWorld?: boolean;
    touchedStructure?: boolean;
    closeAfterSelection?: boolean;
  } => {
    // THR-114: mutable object written inside updater, read outside (pattern per plan §D7)
    const pendingAftermathMutations = { touchedWorld: false, touchedStructure: false };
    // THR-133: traces collected inside updater, emitted outside (StrictMode-safe)
    let pendingMarkTraces: Parameters<typeof emitTrace>[0][] = [];
    const resolvedContext = resolveAftermathContextForAgent(_gameStateRef.current, agentId, reactionId);
    if ('error' in resolvedContext) {
      return {
        success: false,
        message: resolvedContext.error,
      };
    }

    const selectedReactionId = resolvedContext.reaction.id;
    const selectedActionId = resolvedContext.action.actionId;
    const selectedEncounterId = resolvedContext.action.templateId;
    const selectedCloseAfterSelection = resolvedContext.reaction.closeAfterSelection ?? true;

    setGameState(prev => {
      const activeAction = prev.unifiedActions.find(action => action.actionId === selectedActionId) ?? resolvedContext.action;
      const reaction = activeAction.aftermathSummary?.reactions?.find(entry => entry.id === selectedReactionId) ?? resolvedContext.reaction;

      const { state: nextState, mutationSummary: reactionMutations } = applyEncounterAftermathReaction(
        prev,
        activeAction,
        reaction,
        prev.tick,
        runtime,
      );
      pendingAftermathMutations.touchedWorld = reactionMutations.touchedWorld;
      pendingAftermathMutations.touchedStructure = reactionMutations.touchedStructure;

      // THR-117: condition_attachment aftermath path — wire woundApplied into mid-encounter tier promotion.
      // Mirrors the legacy resolveEncounter → orchestrator promotion contract.
      let stateAfterPromotion = nextState;
      if (reactionMutations.woundApplied && activeAction.effectiveTier && activeAction.effectiveTier !== 'invisible') {
        const newTier = checkMidEncounterPromotion(activeAction.effectiveTier, { wound: true });
        if (newTier !== null) {
          stateAfterPromotion = {
            ...nextState,
            unifiedActions: nextState.unifiedActions.map((action: UnifiedAction) =>
              action.actionId === activeAction.actionId ? { ...action, effectiveTier: newTier } : action
            ),
          };
          emitTrace({
            type: 'encounter_promotion',
            tick: prev.tick,
            encounterId: activeAction.templateId ?? 'unknown',
            agentId: activeAction.actorId,
            fromTier: activeAction.effectiveTier,
            toTier: newTier,
            reason: 'wound',
          } as unknown as Parameters<typeof emitTrace>[0]);
        }
      }

      const { nextState: stateAfterMarks, tracesToEmit: markTraces } = consumeMatchingMarks(
        stateAfterPromotion,
        activeAction.actorId,
        activeAction.templateId,
        prev.tick,
      );
      pendingMarkTraces = markTraces as Parameters<typeof emitTrace>[0][];
      // THR-113: passive observation — trace when a resolved encounter's target
      // matches an existing intelligence record held by the actor. No state mutation.
      observeResolutionIntelligence(stateAfterMarks, activeAction, reaction, prev.tick);
      return {
        ...stateAfterMarks,
        encounterNotifications: (stateAfterMarks.encounterNotifications ?? []).map(notification => {
          if (notification.resolved) return notification;
          const matchesActionId = Boolean(notification.actionId) && notification.actionId === activeAction.actionId;
          const matchesTemplate = notification.agentId === activeAction.actorId && notification.encounterId === activeAction.templateId;
          if (!matchesActionId && !matchesTemplate) return notification;
          return { ...notification, resolved: true };
        }),
      };
    });

    if (pendingAftermathMutations.touchedStructure) touchStructure(runtime);
    else if (pendingAftermathMutations.touchedWorld) touchWorld(runtime);
    for (const trace of pendingMarkTraces) emitTrace(trace);

    if (source === 'debug-bridge') {
      emitTrace({
        tick: _gameStateRef.current.tick,
        category: AUTO_AFTERMATH_TRACE_CATEGORY,
        agentId,
        encounterId: selectedEncounterId,
        actionId: selectedActionId,
        reactionId: selectedReactionId,
        source: 'debug-bridge',
        summary: `headless aftermath (debug-bridge) ${agentId} -> ${selectedReactionId}`,
      } as unknown as Parameters<typeof emitTrace>[0]);
    }

    return {
      success: true,
      message: `Applied aftermath reaction '${selectedReactionId}'.`,
      reactionId: selectedReactionId,
      touchedWorld: pendingAftermathMutations.touchedWorld,
      touchedStructure: pendingAftermathMutations.touchedStructure,
      closeAfterSelection: selectedCloseAfterSelection,
    };
  }, [runtime, setGameState]);

  const handleEncounterAftermathReaction = useCallback((reactionId: string) => {
    if (!tieredEncounterState) return;
    const result = applyAftermathReactionForAgent(tieredEncounterState.agentId, reactionId, 'modal');
    if (!result.success) return;

    if (tieredEncounterState.notification?.id) {
      suppressedEncounterNotificationId.current = tieredEncounterState.notification.id;
      setInterruptSuppressedUntilTick(gameState.tick + 1);
    }

    if (result.closeAfterSelection ?? true) {
      closeEncounterModalAndResume(tieredEncounterState.openedAsInterrupt);
    }
  }, [applyAftermathReactionForAgent, closeEncounterModalAndResume, gameState.tick, tieredEncounterState]);

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;

    const resolveAgentId = (agentQuery: string): string | null => {
      const actors = _gameStateRef.current.graph.getNodesByType('actor');
      const match = actors.find(node =>
        node.id === agentQuery
        || node.id.startsWith(agentQuery)
        || ((node.properties.name as string | undefined) ?? '').toLowerCase().includes(agentQuery.toLowerCase())
      );
      return match?.id ?? null;
    };

    window.__DEBUG._registerAftermathBridge({
      listAftermathReactions: (agentQuery: string) => {
        const resolvedAgentId = resolveAgentId(agentQuery);
        if (!resolvedAgentId) {
          return { reactions: [], error: `No agent matching '${agentQuery}'.` };
        }

        const resolvedContext = resolveAftermathContextForAgent(_gameStateRef.current, resolvedAgentId);
        if ('error' in resolvedContext) {
          return { reactions: [], error: resolvedContext.error };
        }

        const reactions = resolvedContext.action.aftermathSummary?.reactions ?? [];
        return { reactions: reactions.map(reaction => ({ id: reaction.id, label: reaction.label })) };
      },
      pickAftermathReaction: (agentQuery: string, reactionId?: string) => {
        const resolvedAgentId = resolveAgentId(agentQuery);
        if (!resolvedAgentId) {
          return { success: false, message: `No agent matching '${agentQuery}'.` };
        }

        const result = applyAftermathReactionForAgent(resolvedAgentId, reactionId, 'debug-bridge');
        return {
          success: result.success,
          reactionId: result.reactionId,
          touchedWorld: result.touchedWorld,
          touchedStructure: result.touchedStructure,
          message: result.message,
        };
      },
    });
  }, [applyAftermathReactionForAgent]);

  /** Intervention handler — player chose an intervention for the current encounter step */
  const handleEncounterIntervene = useCallback((choiceId: string, essenceSpent: number) => {
    if (!tieredEncounterState) return;
    const {
      notification,
      agentId,
      encounter,
    } = tieredEncounterState;
    const choice = notification.choices.find(c => c.id === choiceId);
    if (!choice) return;

    setGameState(prev => {
      const newPool = { ...prev.essencePool };
      if (essenceSpent > 0) {
        newPool[archetype.sphereAlignment.primary] = Math.max(
          0,
          newPool[archetype.sphereAlignment.primary] - essenceSpent,
        );
      }

      return {
        ...prev,
        essencePool: newPool,
        unifiedActions: (prev.unifiedActions ?? []).map(action => {
          const matchesActiveAction =
            (tieredEncounterState.activeActionId && action.actionId === tieredEncounterState.activeActionId)
            || (
              !tieredEncounterState.activeActionId
              && !action.resolved
              && action.actorId === agentId
              && action.templateId === notification.encounterId
            );
          if (!matchesActiveAction) return action;
          const step = tieredEncounterState.template.steps[action.currentStep];
          if (!step) return action;
          return recordUnifiedActionChoiceMemory(
            action,
            action.currentStep,
            step.id,
            choice,
            prev.tick,
            essenceSpent,
          );
        }),
        encounterProgress: tieredEncounterState.encounter.sourceSystem === 'legacy_encounter'
          ? prev.encounterProgress.map(entry => {
              if (
                entry.actorId !== agentId
                || entry.encounterId !== notification.encounterId
                || entry.currentEncounterIndex !== encounter.currentStepIndex
              ) {
                return entry;
              }
              const step = tieredEncounterState.template.steps[encounter.currentStepIndex];
              if (!step) return entry;
              return recordEncounterChoiceMemory(
                entry,
                encounter.currentStepIndex,
                step.id,
                choice,
                prev.tick,
                essenceSpent,
              );
            })
          : prev.encounterProgress,
        encounterNotifications: (prev.encounterNotifications ?? []).map(n =>
          n.id === notification.id ? { ...n, resolved: true } : n,
        ),
      };
    });

    // Emit trace
    console.debug('[EncounterVeil] Intervention:', {
      agentId,
      encounterId: notification.encounterId,
      choiceId,
      essenceSpent,
      interventionType: choice.interventionType,
      probabilityBoost: choice.probabilityBoost,
    });
  }, [tieredEncounterState, setGameState, archetype.sphereAlignment.primary]);

  const handleEncounterCommitAndContinue = useCallback((choiceId: string, essenceSpent: number) => {
    if (!tieredEncounterState) return;
    handleEncounterIntervene(choiceId, essenceSpent);
    suppressedEncounterNotificationId.current = tieredEncounterState.notification.id;
    resumeAfterEncounterCommit.current = true;
    setInterruptSuppressedUntilTick(gameState.tick + 1);
    setTieredEncounterState(null);
    wasRunningBeforeEncounterPause.current = false;
  }, [gameState.tick, handleEncounterIntervene, tieredEncounterState]);

  /** Boost handler — Watched tier essence boost */
  const handleEncounterBoost = useCallback((essenceSpent: number) => {
    if (!tieredEncounterState || essenceSpent <= 0) return;

    setGameState(prev => {
      const newPool = { ...prev.essencePool };
      newPool[archetype.sphereAlignment.primary] = Math.max(0, newPool[archetype.sphereAlignment.primary] - essenceSpent);
      return { ...prev, essencePool: newPool };
    });

    // Mark notification as resolved
    setGameState(prev => ({
      ...prev,
      encounterNotifications: (prev.encounterNotifications ?? []).map(n =>
        n.id === tieredEncounterState.notification.id ? { ...n, resolved: true } : n,
      ),
    }));
  }, [tieredEncounterState, setGameState, archetype.sphereAlignment.primary]);

  /** Peek handler — Watched tier peek gate (costs 1 essence) */
  const handleEncounterPeek = useCallback(() => {
    setGameState(prev => {
      const newPool = { ...prev.essencePool };
      newPool[archetype.sphereAlignment.primary] = Math.max(0, newPool[archetype.sphereAlignment.primary] - 1);
      return { ...prev, essencePool: newPool };
    });
  }, [setGameState, archetype.sphereAlignment.primary]);

  // Auto-interrupt only pause-mode encounter notifications.
  // Pause is handled by the general encounterModalOpen useEffect below
  useEffect(() => {
    if (interruptsSuppressed) return;
    // Don't auto-open tiered encounters while a premonition modal is active —
    // compulsion handles encounter selection for that agent
    if (activePremonition) return;
    const notifications = gameState.encounterNotifications ?? [];
    if (suppressedEncounterNotificationId.current) {
      const suppressedStillPending = notifications.some(
        notif => notif.id === suppressedEncounterNotificationId.current && !notif.resolved,
      );
      if (!suppressedStillPending) {
        suppressedEncounterNotificationId.current = null;
      }
    }
    for (const notif of notifications) {
      if (!shouldAutoOpenEncounterNotification(notif)) continue;
      if (suppressedEncounterNotificationId.current === notif.id) continue;
      handleOpenEncounterFromNotification(notif);
      break; // Only one auto-interrupt at a time
    }
  }, [gameState.encounterNotifications, handleOpenEncounterFromNotification, interruptsSuppressed, activePremonition]);

  // ── Meeting encounter (Meet The First) ──
  const [meetingState, setMeetingState] = useState<MeetingEncounterState | null>(null);

  // ── Stub modal state for non-agent thread types (Plan 16-02) ──
  const [stubModalState, setStubModalState] = useState<{ nodeId: string; category: import('../../engine/retinue').ThreadCategory } | null>(null);

  // ── Auto-pause when encounter modal opens, auto-resume on close ──
  /** Tracks whether the game was running before an encounter modal opened */
  const wasRunningBeforeEncounterPause = useRef<boolean>(false);
  const encounterModalOpen = tieredEncounterState !== null || meetingState !== null || activePremonition !== null;

  useEffect(() => {
    if (encounterModalOpen && running) {
      wasRunningBeforeEncounterPause.current = true;
      setRunning(false);
    }
  }, [encounterModalOpen, running, setRunning]);

  useEffect(() => {
    if (encounterModalOpen || !resumeAfterEncounterCommit.current) return;
    resumeAfterEncounterCommit.current = false;
    setRunning(true);
  }, [encounterModalOpen, setRunning]);

  useEffect(() => {
    if (interruptSuppressedUntilTick === null) return;
    if (gameState.tick >= interruptSuppressedUntilTick) {
      setInterruptSuppressedUntilTick(null);
    }
  }, [gameState.tick, interruptSuppressedUntilTick]);

  const handleStartMeeting = useCallback((locationId: string) => {
    if (!isMeetTheFirstAvailable(gameState.graph, gameState.ascendantId, gameState.tick)) return;
    const state = createMeetingEncounterState(
      locationId, gameState.ascendantId, gameState.tick,
    );
    setMeetingState(state);
  }, [gameState.graph, gameState.ascendantId, gameState.tick]);

  const handleMeetingComplete = useCallback((result: MeetingEncounterResult) => {
    const agentId = createAgentFromMeeting(gameState.graph, result, gameState.ascendantId, gameState.tick);
    setMeetingState(null);

    // Update familiarity map for the new agent
    setGameState(prev => {
      const newFamiliarityMap = new Map(prev.familiarityMap);
      newFamiliarityMap.set(agentId, 0.5); // Start with high familiarity (we created them)
      return {
        ...prev,
        familiarityMap: newFamiliarityMap,
        recentEvents: [
          ...prev.recentEvents.slice(-99),
          {
            id: `evt_meet_first_${prev.tick}_${Date.now()}`,
            tick: prev.tick,
            type: 'narrative' as const,
            message: `The thread of fate is woven. ${result.name} has been claimed as The First.`,
            significance: 1.0,
            sphere: archetype.sphereAlignment.primary,
          },
        ],
      };
    });
  }, [gameState.graph, gameState.ascendantId, gameState.tick, setGameState, archetype.sphereAlignment.primary]);

  const handleMeetingClose = useCallback(() => {
    setMeetingState(null);
    if (wasRunningBeforeEncounterPause.current) {
      wasRunningBeforeEncounterPause.current = false;
      setRunning(true);
    }
  }, [setRunning]);

  // ── Meet The First as action card slot ──
  const MEET_THE_FIRST_SLOT_ID = 'meet_the_first';

  const meetTheFirstAvailable = useMemo(() =>
    isMeetTheFirstAvailable(gameState.graph, gameState.ascendantId, gameState.tick),
  [gameState.graph, gameState.ascendantId, gameState.tick]);

  // ── Auto-trigger Meet The First early in the game ──
  // The meeting encounter generates candidates from scratch — it doesn't
  // need pre-existing agents at the location. Fire as soon as the avatar
  // is at any location and Meet The First is available.
  useEffect(() => {
    if (gameState.tick < 2) return; // let the world settle
    if (gameState.meetTheFirstAutoTriggered) return;
    if (meetingState) return;
    if (!meetTheFirstAvailable) return;

    // Find avatar's current location — must be a place where people live
    // (dilemmas describe merchants, guards, children, councils — needs a settlement)
    if (!avatarNodeId) return;
    const avatarLocEdge = gameState.graph.getOutgoingEdges(avatarNodeId, 'located_at')[0];
    if (!avatarLocEdge) return;
    const locationId = avatarLocEdge.target;
    const locNode = gameState.graph.getNode(locationId);
    if (!locNode) return;
    const subtype = locNode.properties.locationSubtype as string | undefined;
    const settledTypes = ['town', 'city', 'hamlet', 'village', 'capital', 'port', 'outpost', 'fortress', 'monastery', 'trading_post'];
    if (!subtype || !settledTypes.includes(subtype)) return;

    // All conditions met — auto-trigger once
    gameState.meetTheFirstAutoTriggered = true;
    handleStartMeeting(locationId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.tick, meetTheFirstAvailable, meetingState, gameState.meetTheFirstAutoTriggered]);

  // Inject Meet The First card into non-agent slots when on a location view
  const enrichedNonAgentSlots = useMemo(() => {
    const base = nonAgentSlots ?? [];
    if (viewLevel !== 'location' || !meetTheFirstAvailable || !focusedLocation) return base;
    const meetSlot: WheelSlot = {
      id: MEET_THE_FIRST_SLOT_ID,
      label: 'Meet The First',
      type: 'intervention',
      angleDeg: 0,
      available: true,
      lockedReason: null,
      essenceCost: 0,
      detectionRisk: 0,
      sphere: archetype.sphereAlignment.primary,
      interventionType: null,
      rangeStatus: 'unlimited',
      hexDistance: null,
      description: 'Claim a mortal as your champion — The First to carry your will.',
    };
    return [meetSlot, ...base];
  }, [nonAgentSlots, viewLevel, meetTheFirstAvailable, focusedLocation, focusedLocationAgents, archetype.sphereAlignment.primary]);

  const handleNonAgentSlotClick = useCallback((slotId: string) => {
    if (slotId === MEET_THE_FIRST_SLOT_ID) {
      if (focusedLocation) {
        handleStartMeeting(focusedLocation.id);
      }
      return;
    }

    if (!nonAgentTargetContext) return;

    const templateId = templateIdFromSlotId(slotId);
    if (!templateId) return;

    const template = getUnifiedTemplateById(templateId);
    if (!template) {
      console.warn(`[targetAction] template not found: ${templateId}`);
      return;
    }

    try {
      const essenceCost = template.essenceCost ?? 0;
      const sphere = template.sphereAffinity ?? archetype.sphereAlignment.primary;

      const rng = mulberry32(gameState.seed + gameState.tick * 43);
      const action = createUnifiedAction({
        actorId: gameState.ascendantId,
        templateId,
        targetId: nonAgentTargetContext.nodeId,
        scale: template.scale,
        source: 'player',
        tick: gameState.tick,
        template,
        rng,
        essencePaid: essenceCost,
      });

      setGameState(prev => {
        const newPool = { ...prev.essencePool };
        if (essenceCost > 0) {
          newPool[sphere] = Math.max(0, (newPool[sphere] ?? 0) - essenceCost);
        }
        return {
          ...prev,
          essencePool: newPool,
          unifiedActions: [...(prev.unifiedActions ?? []), action],
          recentEvents: [
            ...prev.recentEvents.slice(-99),
            {
              id: `evt_target_action_${prev.tick}_${Date.now()}`,
              tick: prev.tick,
              type: 'narrative' as const,
              message: `The Ascendant ${template.narrativeTemplates.initiation}.`,
              significance: 0.5,
              sphere,
              isInterventionBeat: false,
            },
          ],
        };
      });

      setTimeout(() => {
        setNonAgentDrawerOpen(false);
        setManualTargetContext(null);
      }, DIVINE_INFLUENCE_CONSTANTS.DRAWER_CLOSE_DELAY_MS);
    } catch (err) {
      console.warn('[targetAction] failed to create action:', err);
    }
  }, [nonAgentTargetContext, gameState.ascendantId, gameState.seed, gameState.tick, archetype, setGameState, focusedLocation, handleStartMeeting]);

  const handleOpenFactionActions = useCallback((factionId: string) => {
    const context = buildActorTargetContext(factionId, gameState.graph);
    if (!context) return;
    setManualTargetContext(context);
    setNonAgentDrawerOpen(true);
  }, [gameState.graph]);

  const handleCloseNonAgentDrawer = useCallback(() => {
    setNonAgentDrawerOpen(false);
    if (manualTargetContext) {
      setManualTargetContext(null);
      return;
    }
    handleHexDetailClose();
  }, [manualTargetContext, handleHexDetailClose]);

  // ── Profile modal routing for thread detail view ──
  const handleOpenProfileModal = useCallback((nodeId: string, category: import('../../engine/retinue').ThreadCategory) => {
    if (category === 'agent') {
      // Use existing agent profile modal flow (selectedAgentId must match for agentInfoCard to load)
      handleViewProfile();
    } else {
      setStubModalState({ nodeId, category });
    }
  }, [handleViewProfile]);

  // ── Attention mode toggle (TB-040) ──
  const handleToggleAttentionMode = useCallback((threadEdgeId: string) => {
    const result = toggleAttentionMode(
      gameState.graph, threadEdgeId, gameState.ascendantId, gameState.tick,
    );
    if (result) {
      // Deduct essence cost
      setGameState(prev => ({
        ...prev,
        essence: Math.max(0, (prev.essence ?? 0) - result.essenceCost),
      }));
    }
  }, [gameState.graph, gameState.ascendantId, gameState.tick, setGameState]);

  // ── Journey vignette (auto-interrupt for The First) ──
  const activeVignette: PendingVignette | null = useMemo(() => {
    const pending = gameState.pendingVignettes;
    if (!pending || pending.length === 0) return null;
    // Highest priority first (already sorted by engine)
    return pending[0];
  }, [gameState.pendingVignettes]);

  // Auto-pause simulation when a vignette is pending
  useEffect(() => {
    if (interruptsSuppressed) return;
    if (activeVignette && running) {
      setRunning(false);
    }
  }, [activeVignette, interruptsSuppressed, running, setRunning]);

  // ── Story beat modal (pacing governor) ──
  const activeStoryBeatId: string | null = useMemo(() => {
    const ascNode = gameState.graph.getNode(gameState.ascendantId);
    const id = (ascNode?.properties as Record<string, unknown> | undefined)?.pacingActiveStoryBeat;
    return typeof id === 'string' ? id : null;
  }, [gameState.graph, gameState.ascendantId, gameState.worldVersion]);

  const activeStoryBeatTemplate = useMemo((): import('../../types/unifiedAction').UnifiedActionTemplate | null => {
    if (!activeStoryBeatId) return null;
    // activeStoryBeatId is an action ID — look up the unified action to get the templateId
    const ua = gameState.unifiedActions?.find(a => a.actionId === activeStoryBeatId);
    if (ua) {
      return UNIFIED_ACTION_TEMPLATES.find(t => t.id === ua.templateId) ?? null;
    }
    return null;
  }, [activeStoryBeatId, gameState.unifiedActions]);

  const activeStoryBeatAgentName = useMemo(() => {
    if (!activeStoryBeatId) return '';
    const ua = gameState.unifiedActions?.find(a => a.actionId === activeStoryBeatId);
    if (ua) {
      const agentNode = gameState.graph.getNode(ua.actorId);
      return (agentNode?.properties as Record<string, unknown> | undefined)?.name as string ?? agentNode?.name ?? 'Unknown';
    }
    return '';
  }, [activeStoryBeatId, gameState.unifiedActions, gameState.graph]);

  const handleStoryBeatDismiss = useCallback(() => {
    setGameState(prev => {
      const ascNode = prev.graph.getNode(prev.ascendantId);
      if (!ascNode) return prev;
      const props = ascNode.properties as Record<string, unknown>;
      props.pacingActiveStoryBeat   = null;
      props.pacingLastCompletedTick = prev.tick;
      return { ...prev, worldVersion: (prev.worldVersion ?? 0) + 1 };
    });
  }, [setGameState]);

  // Auto-pause simulation when a story beat fires
  useEffect(() => {
    if (interruptsSuppressed) return;
    if (activeStoryBeatId && running) {
      setRunning(false);
    }
  }, [activeStoryBeatId, interruptsSuppressed, running, setRunning]);

  const getDebugOpenModals = useCallback((): string[] => {
    const openModals: string[] = [];

    if (debugPanelOpen) openModals.push('DebugPanel');
    if (settingsPanelOpen) openModals.push('SettingsPanel');
    if (readThreadsOpen) openModals.push('ReadTheThreadsPanel');
    if (scryVisible) openModals.push('ScryOverlay');
    if (agendaPickerOpen && !!pendingAgendas) openModals.push('AgendaPicker');
    if (drawerOpen && !!selectedAgentId) openModals.push('ActionDrawer');
    if (nonAgentDrawerOpen && !!enrichedNonAgentSlots?.length && !selectedAgentId) openModals.push('ActionDrawer');
    if (profileModalAgentId && !!agentInfoCard) openModals.push('AgentProfileModal');
    if (stubModalState) {
      if (stubModalState.category === 'location') openModals.push('LocationProfileModal');
      if (stubModalState.category === 'faction') openModals.push('FactionSheet');
      if (stubModalState.category === 'army') openModals.push('ArmySheet');
      if (stubModalState.category === 'artifact') openModals.push('ArtifactSheet');
    }
    if (tieredEncounterState && encounterVeilModel) openModals.push('EncounterVeil');
    if (meetingState && ascendantIdentity) openModals.push('MeetTheFirstFlow');
    if (activeVignette && !interruptsSuppressed) openModals.push('JourneyVignetteModal');
    if (activeStoryBeatId && activeStoryBeatTemplate && !interruptsSuppressed) openModals.push('StoryBeatModal');
    if (activePremonition && !interruptsSuppressed) openModals.push('PremonitionModal');
    if (ascendantSheetOpen) openModals.push('AscendantSheet');
    if (doomDetailOpen) openModals.push('DoomClockDetail');
    if (mandateDetailOpen && gameState.mandateDefinition && gameState.mandateState) openModals.push('MandateDetail');
    if (harvestResult) openModals.push('HarvestScreen');

    return openModals;
  }, [
    activePremonition,
    activeStoryBeatId,
    activeStoryBeatTemplate,
    activeVignette,
    agendaPickerOpen,
    agentInfoCard,
    ascendantIdentity,
    ascendantSheetOpen,
    debugPanelOpen,
    doomDetailOpen,
    drawerOpen,
    encounterVeilModel,
    enrichedNonAgentSlots,
    gameState.mandateDefinition,
    gameState.mandateState,
    harvestResult,
    interruptsSuppressed,
    mandateDetailOpen,
    meetingState,
    nonAgentDrawerOpen,
    pendingAgendas,
    profileModalAgentId,
    readThreadsOpen,
    scryVisible,
    selectedAgentId,
    settingsPanelOpen,
    stubModalState,
    tieredEncounterState,
  ]);

  const getDebugActiveUIState = useCallback(() => {
    const urlView = new URLSearchParams(window.location.search).get('view') ?? 'game';
    const openModals = getDebugOpenModals();
    const selectedFactionId = stubModalState?.category === 'faction'
      ? stubModalState.nodeId
      : selectedThreadNode?.category === 'faction'
        ? selectedThreadNode.nodeId
        : null;

    return {
      view: urlView,
      selectedAgentId: selectedAgentId ?? null,
      selectedLocationId: focusedLocationId,
      selectedFactionId,
      selectedHex: selectedHexCoord ?? selectedHex ?? focusedHex ?? null,
      openModals,
      actionDrawerOpen: (drawerOpen && !!selectedAgentId)
        || (nonAgentDrawerOpen && !!enrichedNonAgentSlots?.length && !selectedAgentId),
      scryActive: scryVisible,
      cameraFocusHex: cameraCenter ?? null,
    };
  }, [
    cameraCenter,
    drawerOpen,
    enrichedNonAgentSlots,
    focusedHex,
    focusedLocationId,
    getDebugOpenModals,
    nonAgentDrawerOpen,
    scryVisible,
    selectedAgentId,
    selectedHex,
    selectedHexCoord,
    selectedThreadNode,
    stubModalState,
  ]);

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerOpenModalsProvider(getDebugOpenModals);
    window.__DEBUG._registerActiveUIStateProvider(getDebugActiveUIState);
  }, [getDebugActiveUIState, getDebugOpenModals]);

  // Close detail panel on Escape key
  useEffect(() => {
    if (!selectedThreadNode && !selectedHexCoord) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleThreadDetailClose();
        handleHexDetailClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedThreadNode, selectedHexCoord, handleThreadDetailClose, handleHexDetailClose]);

  const handleJourneyChoice = useCallback((choiceId: string) => {
    if (!activeVignette) return;
    const vignetteData = activeVignette.data;

    // Find the thread edge for this agent
    const threads = getThreadsFrom(gameState.graph, gameState.ascendantId);
    const threadEdge = threads.find(e => e.target === vignetteData.agentId);
    if (!threadEdge) return;

    const threadProps = threadEdge.properties as ThreadEdgeProperties;

    // Apply beat choice — updates thread edge properties + records outcome
    const { updatedProps } = applyBeatChoice(threadProps, vignetteData, choiceId);

    // Update the thread edge in the graph
    gameState.graph.updateEdge(threadEdge.id, { properties: updatedProps });

    // Remove this vignette from the queue
    setGameState(prev => ({
      ...prev,
      pendingVignettes: (prev.pendingVignettes ?? []).filter(v => v.id !== activeVignette.id),
    }));
  }, [activeVignette, gameState.graph, gameState.ascendantId, setGameState]);

  // IX-013: Wrapped location click closes drawer before drilling down
  const handleLocationClickWithClose = useCallback((locationId: string) => {
    handleDrawerClose();
    handleLocationClick(locationId);
  }, [handleDrawerClose, handleLocationClick]);

  return (
    <GameErrorBoundary>
      <div className="h-screen flex flex-col overflow-hidden relative grain" style={{ backgroundColor: 'var(--bg-abyss)' }}>
      {/* ═══ Top bar — Stellaris-style: identity + time + essence ║ doom + mandate + alerts + rivals + debug ═══ */}
      <div
        className="w-full flex items-center relative z-30 flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, rgba(17,17,20,0.98), rgba(10,10,14,0.95))',
          borderBottom: `1px solid rgba(var(--accent-gold-rgb, 212,175,55), 0.3)`,
          minHeight: 'var(--topbar-height)',
          paddingTop: '4px',
          paddingBottom: '4px',
          paddingLeft: 'var(--topbar-padding-x)',
          paddingRight: 'var(--topbar-padding-x)',
          gap: 'var(--topbar-gap)',
        }}
      >
        {/* LEFT GROUP: identity · time · essence */}
        <div className="flex items-center flex-1 min-w-0" style={{ gap: 'var(--topbar-gap)' }}>
          {/* IdentityChip superseded by AscendantBar (THR-184) */}

          {/* Time controls */}
          <SimulationControls
            tick={gameState.tick}
            season={seasonName}
            year={year}
            running={running}
            speed={speed}
            onToggle={handleToggleRunning}
            onStep={doTick}
            onSpeedChange={setSpeed}
            compact
          />

          {/* EssencePanel superseded by AscendantBar (THR-184) */}

          {/* WorldSoulIndicator — prose description of dominant sphere */}
          {gameState.worldSoul?.aggregate && (
            <>
              <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
              <WorldSoulIndicator aggregate={gameState.worldSoul.aggregate} />
            </>
          )}

          {/* Attention pool indicator — shows how much focused attention the ascendant has left */}
          {(() => {
            const ascNode = gameState.graph.getNode(gameState.ascendantId);
            const attentionRegen = (ascNode?.properties?.attentionRegen as number) ?? 0.4;
            return (
              <>
                <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
                <AttentionPoolIndicator
                  attentionPool={attentionPool}
                  attentionCapacity={attentionCapacity}
                  attentionRegen={attentionRegen}
                />
              </>
            );
          })()}
        </div>

        {/* Group divider */}
        <div
          className="w-px self-stretch ml-auto flex-shrink-0"
          style={{ background: 'rgba(212,175,55,0.4)' }}
        />

        {/* RIGHT GROUP: doom · mandate · alerts · rivals · debug */}
        <div
          className="flex items-center flex-shrink-0 rounded"
          style={{
            gap: 'var(--topbar-gap)',
            padding: '0 var(--space-2)',
            backgroundColor: 'rgba(10, 10, 14, 0.4)',
          }}
        >
          <div
            role="button" tabIndex={0}
            onClick={() => setDoomDetailOpen(true)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDoomDetailOpen(true); } }}
            className="cursor-pointer"
            style={{ minWidth: '140px' }}
            aria-label="View doom clock details"
          >
            <DoomBar
              definition={gameState.doomDefinition}
              state={gameState.doomClock}
              journeyLabel={doomJourneyLabel}
            />
          </div>
          {gameState.omenState?.primary && (
            <>
              <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
              <OmenIndicator
                omenState={gameState.omenState}
                currentTick={gameState.tick}
              />
            </>
          )}
          {/* MandateTracker superseded by AscendantBar (THR-184) */}
          {/* AlertBar disabled */}
          <RivalsButton
            definitions={gameState.rivalDefinitions}
            states={gameState.rivalStates}
          />
          {/* Read the Threads — divine digest review */}
          <IconButton
            icon={<span>📖</span>}
            active={readThreadsOpen}
            onClick={() => setReadThreadsOpen(true)}
            title="Read the Threads"
            aria-label="Read the Threads"
          />
          <div className="flex items-center gap-1" style={{ position: 'relative' }}>
            <IconButton
              data-testid="settings-toggle"
              icon={<span>⚙</span>}
              active={settingsPanelOpen}
              onClick={() => setSettingsPanelOpen(v => !v)}
              title="Settings"
              aria-label="Settings"
            />
            <SettingsPanel
              open={settingsPanelOpen}
              onClose={() => setSettingsPanelOpen(false)}
              fogDisabled={fogDisabled}
              onToggleFog={() => setFogDisabled(v => !v)}
              debugPanelOpen={debugPanelOpen}
              onToggleDebug={handleToggleDebug}
              showOrganicShore={showOrganicShore}
              onToggleOrganicShore={() => setShowOrganicShore(v => !v)}
              notificationPrefs={notificationPrefs}
              onToggleNotificationCategory={toggleNotifCategory}
              onSetNotificationMode={setNotifMode}
              onResetNotificationPrefs={resetNotifPrefs}
              musicVolume={musicVolume}
              onMusicVolume={handleMusicVolume}
              bgVolume={bgVolume}
              onBgVolume={handleBgVolume}
              uiVolume={uiVolume}
              onUiVolume={handleUiVolume}
              audioMuted={audioMuted}
              onToggleAudioMute={handleToggleAudioMute}
            />
          </div>
        </div>
      </div>

      {/* ═══ Main content area ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left rail: Ascendant Bar (THR-184) ── */}
        <AscendantBar
          gameState={gameState}
          archetype={archetype}
          ascendantIdentity={ascendantIdentity ?? null}
          avatarName={avatarName}
          worldVersion={runtime.worldVersion}
          onOpenSheet={() => setAscendantSheetOpen(true)}
          onOpenMandate={() => setMandateDetailOpen(true)}
          onMove={handleAvatarMoveClick}
          onInvestiture={handleScryWithMutex}
        />

        {/* ── Center: map / hex zoom / location ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative">
            {/* Toast notifications */}
            <ToastStack
              toasts={[...notificationState.toasts, ...encounterToasts, ...actionToasts]}
              onDismiss={handleDismissToast}
              onSelectAgent={handleAgentSelect}
              onNavigate={handleNotificationNavigate}
            />
            {viewLevel === 'world' && (
              <>
                <HexMapV2
                  ref={hexMapRef}
                  tiles={tiles}
                  cols={COLS}
                  rows={ROWS}
                  seed={gameState.seed}
                  hoveredHex={hoveredHex}
                  selectedHex={selectedHexCoord ?? selectedHex}
                  riverPaths={riverPaths}
                  lakeIds={lakeIds}
                  regionData={regionData}
                  locations={locationNodes}
                  anomalies={anomalyNodes}
                  roadPaths={roadPaths}
                  agents={agentRenderDataWithActivity}
                  armies={armyRenderData}
                  battles={battleRenderData}
                  sieges={siegeRenderData}
                  threadLines={threadLineData}
                  activityIcons={activityIconData}
                  activeTugs={activeTugData}
                  attentionRatio={attentionRatio}
                  visibilityMap={fogDisabled ? undefined : effectiveVisibilityMap}
                  fogEnabled={!fogDisabled}
                  showOrganicShore={showOrganicShore}
                  overlayOpen={scryVisible || harvestResult !== null}
                  selectionColor={sphereColor}
                  moveDestinationHex={avatarTargetHex}
                  onCameraCenterHex={setCameraCenter}
                  onHexClick={handleHexClickFull}
                  onHexHover={setHoveredHex}
                  onAgentClick={(agentId) => handleThreadNodeSelect(agentId, 'agent')}
                  onArmyClick={(armyId) => handleOpenProfileModal(armyId, 'army')}
                  strategicOverlays={hexStrategicOverlays}
                  locationActivityMap={locationActivityByHex}
                />

                {/* AvatarHUD superseded by AscendantBar (THR-184) */}

                {/* Living World summary bar — top-3 active locations (THR-127) */}
                <LiveLocationBar
                  summaries={locationActivitySummaries}
                  tick={gameState.tick}
                  onCenterOnHex={(col, row) => {
                    if (!hexMapRef.current) return;
                    const px = hexToPixel({ col, row }, HEX_CONSTANTS.HEX_SIZE);
                    hexMapRef.current.centerOn(px.x, -px.y, RETINUE_EYE_ZOOM_SCALE);
                  }}
                />

                {/* Agenda picker overlay */}
                <AnimateMount show={agendaPickerOpen && !!pendingAgendas} animation="anim-fade">
                  {pendingAgendas && (() => {
                    const slot = wheelSlots?.find(s => s.id === pendingIntervention?.slotId);
                    return (
                      <AgendaPicker
                        agendas={pendingAgendas}
                        onSelect={handleAgendaSelect}
                        onCancel={handleAgendaCancel}
                        sphere={slot?.sphere ?? 'mind'}
                      />
                    );
                  })()}
                </AnimateMount>

                {/* Intervention confirmation popover */}
                {pendingIntervention && wheelSlots && !agendaPickerOpen && (() => {
                  const slot = wheelSlots.find(s => s.id === pendingIntervention.slotId);
                  if (!slot) return null;
                  return (
                    <InterventionConfirm
                      interventionType={pendingIntervention.interventionType}
                      label={slot.label}
                      deliveryMode={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].deliveryMode}
                      essenceCost={slot.essenceCost}
                      sphere={slot.sphere ?? 'mind'}
                      detectionRisk={slot.detectionRisk}
                      rangeStatus={slot.rangeStatus}
                      hexDistance={slot.hexDistance}
                      description={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].description}
                      agendaName={selectedAgenda?.name}
                      agendaNarrativeHook={selectedAgenda?.narrativeHook}
                      onConfirm={handleInterventionConfirm}
                      onCancel={handleInterventionCancel}
                    />
                  );
                })()}

                {/* Player choice modal — fires when a choice_set effect resolves in 'player' mode */}
                <AnimateMount show={!!pendingChoice} animation="anim-fade">
                  {pendingChoice && (
                    <ChoiceSetModal
                      pending={pendingChoice}
                      onResolve={(choiceId, selectedOptionId) => {
                        if (!pendingChoice) return; // guard: race between timeout and click

                        const selectedOption = pendingChoice.options.find(o => o.id === selectedOptionId);
                        let nestedPending = null as typeof pendingChoice | null;

                        if (selectedOption && selectedOption.consequences.length > 0) {
                          const ctx: ExecutionContext = {
                            casterId: pendingChoice.actorId,
                            tick: gameState.tick,
                            graph: gameState.graph,
                          };

                          // Execute each consequence — effects mutate the graph in place
                          for (const consequence of selectedOption.consequences) {
                            try {
                              const result = executeEffect(consequence, ctx);
                              if (result.pendingChoice) nestedPending = result.pendingChoice;
                            } catch (err) {
                              console.error('[THR-73] Consequence effect failed:', consequence.type, err);
                            }
                          }

                          // Emit resolution trace for debug panel visibility
                          emitTrace({
                            category: 'choice_set_player_resolved',
                            tick: gameState.tick,
                            actorId: pendingChoice.actorId,
                            choiceId,
                            selectedOptionId,
                            consequenceCount: selectedOption.consequences.length,
                            agentId: pendingChoice.actorId,
                            summary: `Player resolved choice '${choiceId}' → '${selectedOptionId}' (${selectedOption.consequences.length} consequences)`,
                          });

                          // Bump world version — graph was mutated in place
                          touchWorld(runtime);

                          // Add player-visible event to the narrative log
                          setGameState(prev => ({
                            ...prev,
                            recentEvents: [
                              ...prev.recentEvents.slice(-99),
                              {
                                id: `evt_choice_resolved_${prev.tick}_${Date.now()}`,
                                tick: prev.tick,
                                type: 'choice_set_resolved' as const,
                                message: selectedOption.label
                                  ? `Choice made: ${selectedOption.label}`
                                  : 'Your choice has been made.',
                                significance: 0.7,
                              },
                            ],
                          }));
                        }

                        // Queue nested choice (if a consequence produced one) or clear and resume
                        setPendingChoice(nestedPending);
                        if (!nestedPending) setRunning(true);
                      }}
                      onDismiss={() => {
                        if (pendingChoice) {
                          emitTrace({
                            category: 'choice_set_player_dismissed',
                            tick: gameState.tick,
                            actorId: pendingChoice.actorId,
                            choiceId: pendingChoice.choiceId,
                            agentId: pendingChoice.actorId,
                            summary: `Player dismissed choice '${pendingChoice.choiceId}' — no consequences fired`,
                          });
                        }
                        setPendingChoice(null);
                        setRunning(true);
                      }}
                    />
                  )}
                </AnimateMount>
              </>
            )}

            {viewLevel === 'hex-zoom' && focusedHex && hexSphereInfluence && (() => {
              const focusedTile = getTile(focusedHex.col, focusedHex.row);
              const hexTerrain = focusedTile?.terrain ?? 'grassland';
              const hexDangerLevel = focusedTile?.dangerLevel ?? 0;
              return (
                <div className="flex flex-col h-full w-full">
                  <HexBreadcrumb
                    hexCol={focusedHex.col}
                    hexRow={focusedHex.row}
                    terrain={hexTerrain}
                    locationCount={hexLocations.length}
                    agentCount={hexTotalAgents}
                    lineOfSight={hexLineOfSight}
                    sphereInfluence={hexSphereInfluence}
                    cultures={hexCultures}
                    factions={hexFactions}
                    regionName={hexRegionData?.regionName}
                    onBack={handleBackToWorld}
                    data-testid="hex-breadcrumb"
                  />
                  <div className="flex-1 flex overflow-hidden">
                    {/* Left: Collapsible stats sidebar */}
                    <HexSidebar
                      terrain={hexTerrain}
                      hexCol={focusedHex.col}
                      hexRow={focusedHex.row}
                      sphereInfluence={hexSphereInfluence}
                      regionData={hexRegionData}
                      locations={hexLocations}
                      agentsByLocation={hexAgentsByLocation}
                      lineOfSight={hexLineOfSight}
                      cultures={hexCultures}
                      factions={hexFactions}
                      dangerLevel={hexDangerLevel}
                    />

                    {/* Main: Narrative chronicle */}
                    <HexChronicle
                      terrain={hexTerrain}
                      hexCol={focusedHex.col}
                      hexRow={focusedHex.row}
                      lineOfSight={hexLineOfSight}
                      sphereInfluence={hexSphereInfluence}
                      cultures={hexCultures}
                      factions={hexFactions}
                      locations={hexLocations}
                      agentsByLocation={hexAgentsByLocation}
                      factionsByLocation={hexFactionsByLocation}
                      regionData={hexRegionData}
                      onLocationClick={handleLocationClickWithClose}
                      onAgentClick={(agentId) => handleThreadNodeSelect(agentId, 'agent')}
                      onFactionClick={(factionId) => handleThreadNodeSelect(factionId, 'faction')}
                      graph={gameState.graph}
                      seed={gameState.seed}
                      tick={gameState.tick}
                      controlEffects={(gameState.controlEffects ?? []).filter(
                        e => e.active && e.targetHexCol === focusedHex.col && e.targetHexRow === focusedHex.row
                      )}
                    />
                  </div>
                </div>
              );
            })()}

            {viewLevel === 'location' && focusedLocation && focusedHex && (
              <LocationView
                location={focusedLocation}
                agents={focusedLocationAgents}
                hexTerrain={getTile(focusedHex.col, focusedHex.row)?.terrain ?? 'grassland'}
                hexCol={focusedHex.col}
                hexRow={focusedHex.row}
                onAgentClick={handleAgentSelect}
                onBack={handleBackToHex}
                availableEncounters={locationEncounters.available}
                activeEncounters={locationEncounters.active}
                getAgentName={getAgentName}
                onEncounterClick={handleEncounterClick}
                getEncounterTemplate={resolveEncounterTemplate}
                graph={gameState.graph}
                seed={gameState.seed}
                tick={gameState.tick}
                onNavigateToRuin={handleZoomToLocation}
              />
            )}
          </div>

          {/* ActionDrawer overlay — agent (intervention) path */}
          {wheelSlots && drawerOpen && selectedAgentId && (
            <ActionDrawer
              open={drawerOpen}
              slots={wheelSlots}
              targetName={selectedRetinueAgent?.name ?? ''}
              targetLabel={selectedRetinueAgent?.tierName ?? ''}
              playingCardId={playingCardId}
              onSlotClick={handleWheelSlotClick}
              onClose={handleDrawerClose}
            />
          )}

          {/* ActionDrawer overlay — non-agent (hex / location) path */}
          {enrichedNonAgentSlots && enrichedNonAgentSlots.length > 0 && nonAgentDrawerOpen && !selectedAgentId && (
            <ActionDrawer
              open={nonAgentDrawerOpen}
              slots={enrichedNonAgentSlots}
              targetName={nonAgentTargetContext?.displayName ?? ''}
              targetLabel={nonAgentTargetContext?.displayLabel ?? ''}
              playingCardId={null}
              onSlotClick={handleNonAgentSlotClick}
              onClose={handleCloseNonAgentDrawer}
            />
          )}
        </div>

        {/* ── Right panel: Debug Panel OR sidebar (+ detail view) ── */}
        {debugPanelOpen ? (
            <DebugPanel
              currentTick={gameState.tick}
              followAgentId={selectedAgentId ?? undefined}
              onClose={handleToggleDebug}
              preferredViewMode={debugPanelPreferredViewMode}
              preferredViewNonce={debugPanelPreferredViewNonce}
              graph={gameState.graph}
            retinueAgents={retinueAgents}
            cacheEntries={getEncounterCacheManager()?.getAllEntries()}
            encounterProgress={gameState.encounterProgress}
            onZoomToLocation={handleZoomToLocation}
            getWebGLDiagnostics={() => hexMapRef.current?.getDiagnostics() ?? null}
            getZoomLevel={() => hexMapRef.current?.getZoomLevel() ?? 1.5}
            showOrganicShore={showOrganicShore}
            onToggleOrganicShore={setShowOrganicShore}
            encounterNotifications={gameState.encounterNotifications}
            pendingVignettes={gameState.pendingVignettes}
            seed={gameState.seed}
            sphereAggregate={gameState.worldSoul?.aggregate}
            agentKnowledge={gameState.agentKnowledge}
            strategicState={gameState.strategicState}
            omenState={gameState.omenState}
            doomIdentityMatrix={gameState.doomIdentityMatrix}
            hiddenMarks={gameState.hiddenMarks}
            pendingEncounterSeeds={gameState.pendingEncounterSeeds}
            activeDelves={gameState.activeDelves}
            getRecentEvents={getRecentEvents}
            flipTableStates={gameState.flipTableStates}
            activeCompositions={gameState.activeCompositions}
            doomClockStage={gameState.doomClock?.currentStage}
          />
        ) : (
          <div className="flex flex-shrink-0" style={{ alignItems: 'stretch' }}>
            {/* Detail view — to the LEFT of sidebar, own scroll context */}
            <AnimateMount show={selectedThreadNode !== null || selectedHexCoord !== null} animation="anim-fade">
              {(selectedThreadNode !== null || selectedHexCoord !== null) && (
                <div
                  data-testid="thread-detail-scroll"
                  style={{
                    width: 'clamp(240px, 280px, 30vw)',
                    borderLeft: '1px solid var(--border-gold)',
                    background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
                    overflowY: 'auto',
                  }}
                >
                  {selectedThreadNode && (() => {
                    const detailNode: ThreadedNode | undefined =
                      threadedNodes.find(n => n.id === selectedThreadNode.nodeId)
                      ?? (() => {
                        // Fallback for non-threaded nodes (e.g. unbound agents clicked on map)
                        const graphNode = gameState.graph.getNode(selectedThreadNode.nodeId);
                        if (!graphNode) return undefined;
                        if (selectedThreadNode.category === 'agent') {
                          const locEdges = gameState.graph.getOutgoingEdges(graphNode.id, 'located_at');
                          const locNode = locEdges.length > 0 ? gameState.graph.getNode(locEdges[0].target) : null;
                          const locationName = locNode?.name ?? '(unknown)';
                          return {
                            id: graphNode.id,
                            name: graphNode.name,
                            tier: 0 as import('../../types/influence').InfluenceTier,
                            tierName: TIER_NAMES[0],
                            category: 'agent' as const,
                            threadEdgeId: '',
                            attentionMode: 'auto_resolve' as const,
                            courtPosition: null,
                            locationName,
                            activityLabel: 'Unknown',
                          } satisfies ThreadedNode;
                        }
                        if (selectedThreadNode.category === 'faction') {
                          const memberEdges = gameState.graph.getIncomingEdges(graphNode.id, 'member_of');
                          return {
                            id: graphNode.id,
                            name: graphNode.name,
                            tier: 0 as import('../../types/influence').InfluenceTier,
                            tierName: TIER_NAMES[0],
                            category: 'faction' as const,
                            threadEdgeId: '',
                            attentionMode: 'auto_resolve' as const,
                            courtPosition: null,
                            dominantSphere: null,
                            territoryCount: 0,
                            memberCount: memberEdges.length,
                          } satisfies ThreadedFaction;
                        }
                        return undefined;
                      })();
                    if (!detailNode) return null;
                    return (
                      <ThreadDetailView
                        node={detailNode}
                        agentInfoCard={selectedThreadNode.category === 'agent' ? agentInfoCard : null}
                        agentEncounterDecision={selectedThreadNode.category === 'agent' ? selectedAgentEncounterDecision : null}
                        onClose={handleThreadDetailClose}
                        onViewProfile={handleOpenProfileModal}
                        onZoomToLocation={handleZoomToLocation}
                        graph={gameState.graph}
                        digestBuffer={selectedThreadNode.category === 'agent' ? (gameState.digestBuffer ?? []) : undefined}
                        currentTick={selectedThreadNode.category === 'agent' ? gameState.tick : undefined}
                        lastViewedTick={selectedThreadNode.category === 'agent' ? getLastViewedTick(selectedThreadNode.nodeId) : undefined}
                        strategicState={selectedThreadNode.category === 'agent' ? gameState.strategicState : undefined}
                        intelligenceRecords={selectedThreadNode.category === 'agent' ? (gameState.intelligenceRecords ?? []) : undefined}
                      />
                    );
                  })()}
                  {selectedHexCoord && !selectedThreadNode && (
                    <HexDetailView
                      coord={selectedHexCoord}
                      tile={tiles.find(t => t.coord.col === selectedHexCoord.col && t.coord.row === selectedHexCoord.row) ?? null}
                      onClose={handleHexDetailClose}
                      onGoToChronicle={(coord) => { handleHexClick(coord); handleHexDetailClose(); }}
                      graph={gameState.graph}
                    />
                  )}
                </div>
              )}
            </AnimateMount>

            {/* Sidebar — always rendered */}
            <div
              data-testid="right-sidebar"
              className="flex-shrink-0 overflow-y-auto"
              style={{
                width: 'var(--sidebar-width)',
                background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
                borderLeft: '1px solid var(--border-gold)',
              }}
            >
              <div style={{ padding: 'var(--panel-padding)' }}>
                <ThreadsPanel
                  threadedNodes={threadedNodes}
                  selectedNodeId={selectedThreadNode?.nodeId ?? null}
                  onNodeSelect={handleThreadNodeSelect}
                  onCenterOnHex={handleCenterOnHex}
                  onZoomToLocation={handleZoomToLocation}
                  activeEncounters={retinueActiveEncounters}
                  agentEncounterDecisions={latestThreadEncounterDecisions}
                  onEncounterClick={handleEncounterClick}
                  onToggleAttentionMode={handleToggleAttentionMode}
                  agentStrategicSummaries={agentStrategicSummaries}
                />
                <div style={{ marginTop: 'var(--panel-padding)' }}>
                  <WorldPulse
                    gameState={gameState}
                    season={seasonName}
                    year={year}
                    speed={speed}
                    onSpeedChange={setSpeed}
                  />
                </div>
                {gameState.chronicleEntries.length > 0 && (
                  <div style={{ marginTop: 'var(--panel-padding)' }}>
                    <ChroniclePanel entries={gameState.chronicleEntries} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* StrandView overlay */}
      <AnimateMount show={strandData !== null} animation="anim-fade">
        {strandData && (
          <StrandView
            agentName={strandData.agentName}
            strands={strandData.strands}
            onClose={handleStrandClose}
          />
        )}
      </AnimateMount>

      {/* Scry overlay */}
      <AnimateMount show={scryVisible} animation="anim-fade">
        <ScryProvider
          value={{
            scryState,
            retinueAgents,
            essencePool: gameState.essencePool,
            primarySphere: archetype.sphereAlignment.primary,
            secondarySphere: archetype.sphereAlignment.secondary,
            tick: gameState.tick,
            seed: gameState.seed + gameState.tick,
            onAssign: handleScryAssign,
            onDemote: handleScryDemote,
            onClose: handleCloseScry,
            onAgentSelect: handleAgentSelect,
          }}
        >
          <ScryOverlay />
        </ScryProvider>
      </AnimateMount>

      {/* Harvest overlay */}
      <AnimateMount show={harvestResult !== null} animation="anim-fade">
        {harvestResult && (
          <HarvestScreen
            harvest={harvestResult}
            cycle={gameState.cycle}
            onBeginNextCycle={handleBeginNextCycle}
          />
        )}
      </AnimateMount>

      {/* Agent Profile Modal overlay */}
      <AnimateMount show={!!profileModalAgentId && !!agentInfoCard} animation="anim-fade-up">
        {agentInfoCard && (
          <AgentProfileModal
            card={agentInfoCard}
            profile={agentFullProfile}
            onClose={handleCloseProfile}
            scrollToNewStrata={agentInfoCard.backstory?.strata.some(s => s.isNew) ?? false}
            knowledge={profileModalAgentId ? gameState.agentKnowledge.get(profileModalAgentId) : undefined}
          />
        )}
      </AnimateMount>

      {/* Delve progress overlay — active delves for bonded agents (THR-152) */}
      {(gameState.activeDelves?.some(d => !d.aborted && d.beatIndex <= d.totalBeats) || gameState.pendingEmergenceDecision) && (
        <DelveProgressPanel
          gameState={gameState}
          graph={gameState.graph}
          ascendantId={gameState.ascendantId}
          onStateUpdate={(patch) => setGameState(prev => ({ ...prev, ...patch }))}
        />
      )}

      {/* Emergence Dilemma — blocking modal when a delve awaits a divine decision (THR-153) */}
      {gameState.pendingEmergenceDecision && (
        <EmergenceDilemmaModal
          gameState={gameState}
          onResolve={(choice) => {
            setGameState(prev => ({
              ...prev,
              ...resolveEmergenceDecision(prev, choice, prev.ascendantId),
            }));
          }}
        />
      )}

      {/* Read the Threads panel — divine digest review */}
      <ReadTheThreadsPanel
        open={readThreadsOpen}
        onClose={() => setReadThreadsOpen(false)}
        digestBuffer={gameState.digestBuffer ?? []}
        currentTick={gameState.tick}
        essenceAvailable={SPHERE_NAMES.reduce((sum, s) => sum + gameState.essencePool[s], 0)}
        lastReadTick={lastReadThreadsTick}
        attentionPool={attentionPool}
        attentionCapacity={attentionCapacity}
        onSpendEssence={(cost) => {
          setLastReadThreadsTick(gameState.tick);
          setGameState(prev => {
            const newPool = { ...prev.essencePool };
            let remaining = cost;
            const sphereOrder = [
              archetype.sphereAlignment.primary,
              archetype.sphereAlignment.secondary,
              ...SPHERE_NAMES.filter(s => s !== archetype.sphereAlignment.primary && s !== archetype.sphereAlignment.secondary),
            ];
            for (const s of sphereOrder) {
              if (remaining <= 0) break;
              const deduct = Math.min(remaining, newPool[s] ?? 0);
              newPool[s] = (newPool[s] ?? 0) - deduct;
              remaining -= deduct;
            }
            return { ...prev, essencePool: newPool };
          });
        }}
      />

      {/* Stub profile modals for non-agent thread types */}
      <AnimateMount show={stubModalState !== null} animation="anim-fade-up">
        {stubModalState && (() => {
          // Look in retinue first; fall back to full graph so non-retinue nodes also work.
          const retinueNode = threadedNodes.find(n => n.id === stubModalState.nodeId);
          const graphNode = retinueNode ?? gameState.graph.getNode(stubModalState.nodeId);
          if (!graphNode) return null;
          const nodeId = stubModalState.nodeId;
          const nodeName = graphNode.name;
          const onClose = () => setStubModalState(null);
          switch (stubModalState.category) {
            case 'location':
              return <LocationProfileModal name={nodeName} onClose={onClose} />;
            case 'faction':
              return (
                <FactionSheet
                  factionId={nodeId}
                  name={nodeName}
                  graph={gameState.graph}
                  onClose={onClose}
                  onOpenTargetActions={handleOpenFactionActions}
                />
              );
            case 'army':
              return <ArmySheet name={nodeName} onClose={onClose} />;
            case 'artifact':
              return <ArtifactSheet name={nodeName} onClose={onClose} />;
            default:
              return null;
          }
        })()}
      </AnimateMount>

      {/* EncounterVeil — unified encounter display for all encounter types */}
      {tieredEncounterState && encounterVeilModel && (
        <EncounterVeil
          open={true}
          model={encounterVeilModel}
          threadTier={tieredEncounterState.threadTier}
          essence={SPHERE_NAMES.reduce((sum, s) => sum + gameState.essencePool[s], 0)}
          tick={gameState.tick}
          autoResolveTick={tieredEncounterState.notification.autoResolveTick}
          onIntervene={handleEncounterIntervene}
          onBoost={handleEncounterBoost}
          onPeek={handleEncounterPeek}
          onDisregard={handleEncounterDisregard}
          onAcknowledgeAftermath={handleEncounterAcknowledgeAftermath}
          onAftermathReaction={handleEncounterAftermathReaction}
        />
      )}

      {/* Meeting encounter — full-screen narrative flow */}
      {meetingState && ascendantIdentity && (
        <MeetTheFirstFlow
          ascendantIdentity={ascendantIdentity}
          graph={gameState.graph}
          ascendantId={gameState.ascendantId}
          locationId={meetingState.locationId}
          seed={gameState.seed}
          tick={gameState.tick}
          onComplete={handleMeetingComplete}
          onClose={handleMeetingClose}
        />
      )}

      {/* Journey vignette modal (auto-interrupt for The First) */}
      {activeVignette && !interruptsSuppressed && (
        <JourneyVignetteModal
          open={true}
          onClose={() => {
            // Dismissing = step back choice (withdrawn)
            const fallbackChoice = activeVignette.data.choices.find(c => c.effects.interventionType === 'withdrawn');
            if (fallbackChoice) {
              handleJourneyChoice(fallbackChoice.id);
            } else {
              // No withdrawn choice available — just dismiss
              setGameState(prev => ({
                ...prev,
                pendingVignettes: (prev.pendingVignettes ?? []).filter(v => v.id !== activeVignette.id),
              }));
            }
          }}
          onChoice={handleJourneyChoice}
          vignette={activeVignette.data}
        />
      )}

      {/* Story beat modal (pacing governor) */}
      {activeStoryBeatId && activeStoryBeatTemplate && !interruptsSuppressed && (
        <StoryBeatModal
          open={true}
          onDismiss={handleStoryBeatDismiss}
          template={activeStoryBeatTemplate}
          agentName={activeStoryBeatAgentName}
        />
      )}

      {/* Divine Premonition modal (Whisper / Compulsion) */}
      {activePremonition && !interruptsSuppressed && (
        <PremonitionModal
          open={true}
          premonition={activePremonition}
          essencePool={gameState.essencePool}
          onWhisperChoice={handleWhisperChoice}
          onCompulsionChoice={handleCompulsionChoice}
          onDismiss={handlePremonitionDismiss}
        />
      )}

      {/* Ascendant Sheet modal (character sheet for the player's god) */}
      <AscendantSheet
        open={ascendantSheetOpen}
        onClose={() => setAscendantSheetOpen(false)}
        gameState={gameState}
        archetype={archetype}
        avatarName={avatarName}
        sphereColor={sphereColor}
        originFragmentId={ascendantIdentity?.originFragmentId ?? ''}
      />

      {/* Doom clock detail modal */}
      <DoomClockDetail
        open={doomDetailOpen}
        onClose={() => setDoomDetailOpen(false)}
        definition={gameState.doomDefinition}
        state={gameState.doomClock}
        journeyLabel={doomJourneyLabel}
      />

      {/* Mandate detail modal */}
      {gameState.mandateDefinition && gameState.mandateState && (
        <MandateDetail
          open={mandateDetailOpen}
          onClose={() => setMandateDetailOpen(false)}
          definition={gameState.mandateDefinition}
          state={gameState.mandateState}
        />
      )}

      {/* Event popup overlay */}
      <EventPopup
        popup={interruptsSuppressed ? null : currentPopup}
        queueLength={notificationState.popupQueue.length}
        onDismiss={handleDismissPopup}
        onChoice={handlePopupChoice}
      />
    </div>
    </GameErrorBoundary>
  );
}
