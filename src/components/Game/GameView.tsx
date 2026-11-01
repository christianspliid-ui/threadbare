import { useState, useCallback, useMemo, useEffect, useRef, type DragEvent } from 'react';
import { flushSync } from 'react-dom';
import type { CosmologyProfile, SphereName } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import { resumeMusic as resumeTheme, getMusicVolume, setMusicVolume, isMusicMuted, toggleMusicMute } from '../../audio/MusicChannel';
import { getBackgroundVolume, setBackgroundVolume, isBackgroundMuted, muteBackground, unmuteBackground } from '../../audio/BackgroundChannel';
import { getUiVolume, setUiVolume, isUiMuted, muteUi, unmuteUi } from '../../audio/UiChannel';
import { muteAll, unmuteAll, isAllMuted } from '../../audio/AudioMaster';
import { useAmbientContext } from './hooks/useAmbientContext';
import { CAMERA_CONSTANTS } from '../HexMapV2/camera/D3ZoomCamera';
import type { ScryState } from '../../types/scry';
import { createScryState } from '../../engine/scry';
import { followAgent, unfollowAgent } from '../../engine/followedAgents';
import {
  acknowledgeUndertakingMoment,
  markUndertakingMomentOpened,
  nextInterruptMoment,
  settleUndertakingMomentsAsBadges,
} from '../../engine/undertakingMoments';
import { resolveAttentionMode } from '../../engine/attentionCadence';
import { useWarmStart, type AttentionMode } from './hooks/useWarmStart';
import { canAfford } from '../../engine/influence';
import { payingSphere } from '../../engine/targetActions';
import type { UndertakingMomentRecord } from '../../types/strategicAction';
import { useSimulation } from './hooks/useSimulation';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { CardPlayTallyEntry } from '../../types/gameState';
import { useLocationActivities } from './hooks/useLocationActivities';
import { useAvatarData } from './hooks/useAvatarData';
import { useIncidentCapture } from './hooks/useIncidentCapture';
import { getCrashLog } from '../../engine/tickHealthMonitor';
import {
  INCIDENT_PROMPT_ON_CRASH,
  INCIDENT_PROMPT_COOLDOWN_TICKS,
} from '../../data/incident-snapshot-constants';
import { useScry } from './hooks/useScry';
import { useAgentInteraction, unthreadedAgentTierName } from './hooks/useAgentInteraction';
import { useViewNavigation } from './hooks/useViewNavigation';
import { resolvePlaceHex } from '../../engine/views/map/focusTargets';
import { readView } from '../../engine/views/readView';
import { stageViewSelector, type StageVM } from '../../engine/views/stage/stageView';
import { isStageOpen } from './stage/stageState';
import { useStageDebugBridge } from './stage/useStageDebugBridge';
import { mapAgentsSelector } from '../../engine/views/map/agents';
import { mapThreadLinesSelector } from '../../engine/views/map/threadLines';
import { mapCompaniesSelector } from '../../engine/views/map/companies';
import { mapActivitySelector } from '../../engine/views/map/activityIcons';
import { mapPlacesSelector } from '../../engine/views/map/places';
import { mapArmiesAndBattlesSelector } from '../../engine/views/map/armiesAndBattles';
import { mapRealmInkSelector } from '../../engine/views/map/realmInk';
import { lensViewSelector, dominionProjectionStamp, lensLayerOf, hexLensViewSelector, type HexLensId } from '../../engine/views/lenses/lensView';
import { toAgentRenderData, toArmyRenderData, toActivityIconData, toRealmHolderIndex, type AvatarPaint } from './map/mapViewAdapters';
import { ViewSourceContext, type ViewSource } from '../../contexts/ViewSourceContext';
import { getSphereColor, getSphereSymbol } from '../../data/sphereIcons';
import { AFTERMATH_REACTION_REFUSAL_COPY } from '../../data/aftermath-reaction-copy';
import { ANOMALY_SPHERE_MAP } from '../../components/HexMapV2/scene/anomalyConstants';
export type { ViewLevel } from './hooks/useViewNavigation';

import { useDebugOpenModal } from './useDebugOpenModal';
import { GameErrorBoundary } from '../shared/GameErrorBoundary';
import type { AgentRenderData } from '../HexMapV2/agents/agentSpriteTypes';
import type { LocationNode } from '../HexMapV2/scene/LocationIconMesh';
import type { ArmyRenderData } from '../HexMapV2/scene/ArmySpriteMesh';
import type { BattleIndicatorData } from '../HexMapV2/scene/BattleIndicatorLayer';
import type { ThreadLineData } from '../HexMapV2/scene/ThreadLineMesh';
import type { CompanyRenderData } from '../HexMapV2/scene/CompanyClusterMesh';
import type { ActivityIconData } from '../HexMapV2/scene/ActivityIconMesh';
import { ATTENTION_BASE_CAPACITY } from '../../data/attention-constants';
import { extractRoadPaths } from '../../engine/roadNetwork';
import { buildReachSignatureMarkers } from '../../engine/reachSignatureMarkers';
import { getSustainedControlNodes } from '../../engine/retinue';
import { buildAppointmentBadges, type AppointmentBadgeModel } from './appointmentBadgeModel';
import { resolveAxiologicalProfile } from '../../engine/encounterScoring';
import { TIER_NAMES } from '../../data/influence-content';
import type { ThreadedNode, ThreadedFaction, ThreadCategory, SustainedControlNode } from '../../engine/retinue';
import { getOriginPortraitUrl } from '../../data/avatar-portrait-assets';
import { HEX_CONSTANTS } from '../HexMapV2/scene/HexFillMesh';
import { EssencePanel } from './EssencePanel';
import { GameViewTopBar, type TopBarFrameFixture } from './GameView/GameViewTopBar';
import { beatOfferWords } from './AscendantBeatModal';
import { buildNeedsYou, withNeedsYouFaces, needsYouFixtureSubject, needsYouStamp, type NeedsYouNamedPause, type NeedsYouRowVM, type NeedsYouSources } from '../../engine/views/needsYou';
import type { AlertItem } from '../../types/notification';
import { shouldCenterOnAgentMove } from './cameraInteractionGate';
import { REACH_TO_SPHERE, SPHERE_COLORS } from '../icons/constants';
import type { ReachDomain } from '../../types/traits';
import { useEscapeLayer, ESCAPE_LAYER_Z_PANEL } from '../shared/useEscapeLayer';
import { countThreadedChapters } from './ChapterLedger';
import { useFirstScreenReveal } from './GameView/firstScreenReveal';
import { useOpeningReveal } from './GameView/openingReveal';
import { OpeningDirectionLine } from './OpeningDirectionLine';
import { getPronouns } from '../../data/domain-prose';
import { OPENING_REVEAL_TOAST_MS } from '../../data/ui-content';
import { MandateTracker } from './MandateTracker';
import { DebugPanel } from './DebugPanel';
import { getEncounterCacheManager } from '../../engine/orchestrator';
import { getLatestEncounterDecisionsByAgent } from '../../engine/balanceTelemetry';
import { readWorldPastForPlayer } from '../../engine/worldPast';
import { buildBeforeYouWoke, buildEchoGroup, worldHasPast } from '../../engine/worldPastWords';
import { ToastStack } from './ToastStack';
import { useNotificationNavigation, useSheetOpeners } from './hooks/useNotificationNavigation';
import { useRefRouter } from '../../hooks/useRefRouter';
import { RefRouterProvider } from '../../contexts/RefRouterContext';
import { DetailPageOpenerProvider } from '../../contexts/DetailPageOpenerContext';
import { useDetailNodeRefOpener, worldRefForNodeId } from '../../hooks/useDetailNodeRefOpener';
import { HoverCard } from '../shared/HoverCard';
import { useNotificationPreferences } from './hooks/useNotificationPreferences';
import { IdentityChip } from './IdentityChip';
import { GodRail } from './frame/GodRail';
import { LedgerRail } from './frame/LedgerRail';
import { useLedgerKey } from './frame/useLedgerKey';
import { GameScreenStateProvider, useGameScreenStore } from './frame/GameScreenState';
import { InspectorHost } from './inspector/InspectorHost';
import { canOpenMeetTheFirst } from './meetTheFirstCard';
import { placeRefKind } from '../../engine/views/subjects/actOn';
import { useInterventionAudio } from './hooks/useInterventionAudio';
import { useCastOnTarget } from './inspector/useCastOnTarget';
import { useCardArming } from './inspector/useCardArming';
import { FindBox } from './find/FindBox';
import { rememberFindRecent, type FindCodexSeed } from '../../engine/views/find';
import { refForMapNode } from '../../engine/views/armedTargets';
import { useArmedDebugBridge } from './inspector/useArmedDebugBridge';
import { ArmedBanner, ArmedCardProvider, isCardDrag } from './inspector/ArmedCard';
import { HandPressProvider } from './frame/HandPressContext';
import type { InspectorPageReport } from './inspector/InspectorPage';
import { currentEntry, isInspectorOpen, openFromMap, openSubject, stepFullToDocked } from './inspector/inspectorState';
import { SURFACE_BY_WORLD_REF } from '../../data/surface-registry';
import { INSPECTOR_WORDS } from '../../data/view-content';
import type { WorldRef, WorldRefKind } from '../../types/worldRef';
import { parseHexRefId } from '../../types/worldRef';
import type { AnyRef } from '../../types/contentRef';
import type { CodexRunStateFilter } from '../Codex/codexRunState';
import { courtPositionToThreadTier } from './encounter-stage/types';
import type { WhisperNudge, CompulsionCandidate } from '../../types/premonition';
import { applyWhisperChoice, applyCompulsionChoice, dismissPremonition, spendPremonitionEssence } from '../../engine/premonitionActions';
// THR-1414 — the forcePremonition debug lever.
import { buildGateDutyEncounterStageModel } from './encounter-stage/adapters/buildGateDutyEncounterStageModel';
import { buildUnifiedEncounterStageModel } from './encounter-stage/adapters/buildUnifiedEncounterStageModel';
import { spendAuthoredChoiceEssence, spendNudgeEssence, type NudgeSpendRequest } from './encounter-stage/nudgeCommit';
import { resolveInterveneChoice } from './encounter-stage/resolveInterveneChoice';
import { claimAuthoredChoiceCommit } from './encounter-stage/authoredChoiceCommitGuard';
import { forecastWithNudges } from './encounter-stage/useNudgeHand';
import { NUDGE_REJECT_TOAST_MS, CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK, CHAPTER_ANSWER_TOAST_MS, chapterAnswerChoiceLine, resolveClockHolder } from '../../data/nudge-stage-content';
import { sphereWord } from '../shared/formatEssence';
import { buildSimpleEncounterStageModel } from './encounter-stage/adapters/buildSimpleEncounterStageModel';
import { buildMomentCardModel } from '../../engine/views/stage/momentCardModel';
import { selectMomentBadges, type MomentBadgeModel } from './momentBadgeModel';
import { describeFollow } from './FollowToggle';
import {
  buildActiveEncounterDisplayFromLegacyProgress,
  buildActiveEncounterDisplayFromUnifiedAction,
  isEncounterAutoOpenSuppressed,
  isStepNotificationSupersededByAftermath,
  resolveNotificationsOnAftermathAcknowledge,
  resolveNotificationsOnVeilLeave,
  runEncounterAutoOpenScan,
  type ActiveEncounterDisplay,
  selectEncounterRuntimeForNotification,
} from './encounterNotificationRuntime';
import type { MeetingEncounterState, MeetingEncounterResult } from '../../types/meetingEncounter';
import type { JourneyVignetteData, PendingVignette } from '../../types/journeyEngine';
import { recordJourneyChoice } from '../../engine/journeyEngine';
import { recordStoryBeatDismissed } from '../../engine/phaseAttention';
import { getThreadsFrom } from '../../engine/graphQueries';
import type { ThreadEdgeProperties } from '../../types/influence';
import { createMeetingEncounterState, isMeetTheFirstAvailable, pickMeetingLocation } from '../../engine/meetingEncounter';
import { bondFirstFromMeeting } from './meetingBond';
import { closeThreadingRite, isRiteAgentMissing, type RiteClose } from '../../engine/threadingRiteQueue';
import { firstClaimedMessage } from '../../data/threading-rite-prose';
import { useNotifications } from './hooks/useNotifications';
import { useInterruptAutoPause, releaseClockOnBond, type InterruptAutoPauseHandle } from './hooks/useInterruptAutoPause';
import { useChapterAnswerRun, type ChapterAnswerRunHandle } from './hooks/useChapterAnswerRun';
import { resolveInterrupts, worldOpenedEncounterHeldBy, INTERRUPT_QUIET_AFTER_INPUT_MS, type ArrivalHoldReason } from './interruptRegistry';
import { HOMED_SURFACES, type HomedSurfaceKind, type StageHomedKind } from '../../data/homed-surfaces';
import { selectEncounterBadges, type EncounterBadgeModel } from './encounterBadgeModel';
import { selectEncounterStakesLines, stakesLineForNotification } from './encounterStakesRows';
import { selectThreadTugBadges } from './threadTugBadgeModel';
import {
  selectEntityNoticeBadges, buildRevealedNotices,
  type EntityNoticeBadgeModel, type RevealedNoticeGroup,
} from './entityNoticeBadgeModel';
import { toggleAttentionMode } from '../../engine/encounterVisibility';
import { setForceFullEncounterVisibility } from '../../engine/debugVisibilityOverride';
import { clearOutcomePin, setOutcomePin } from '../../engine/debugOutcomePin';
import {
  setUndertakingBandPin,
  clearUndertakingBandPin,
  setForceMoments,
} from '../../engine/undertakingReviewLevers';
import { useTopBarHotkeys } from './hooks/useTopBarHotkeys';
import { useGameDebugLevers } from './hooks/useGameDebugLevers';
import { computeEssenceIncome } from '../../engine/essenceIncome';
import { resolvePendingBeat, settleOpeningSpineBeats } from '../../engine/ascendantBeat';
import {
  findDeliverySubject,
  prepareDeliveryEncounter,
  sourceTemplateIdOf,
  type PreparedDeliveryEncounter,
} from '../../engine/deliveryBeatAdapter';
import { ASCENDANT_SPINE, GIFT_RESUME_BOUNDARY_WINDOW_MS, isSpineBeatId } from '../../data/ascendant-beat-content';
import { gatherNarrativeContext, enrichProse } from '../../engine/proseEnrichment';
import {
  resolveGiftDelivery,
  openPlayerSurfaces,
  arrivalHoldingSurfaces,
  encounterHoldingSurfaces,
  isGiftHoldExempt,
  PLAYER_SURFACE_INTERRUPT_IDS,
  type GiftDelivery,
} from './giftDelivery';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { preparePlayerCast, commitPlayerCast } from '../../engine/playerCastDispatch';
import { withEssenceSpend, recordEssenceMovement } from '../../engine/essenceMovement';
import { buildEncounterBinderContext } from '../../engine/binding/encounterBinderContext';
import type { UnifiedAction } from '../../types/unifiedAction';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { ClearanceGateRuntimeState } from '../../types/contentShells';
import { touchStructure, touchWorld } from '../../engine/simulationRuntime';
import { emitTrace } from '../../engine/traceBuffer';
import {
  applyEncounterAftermathReaction,
  AUTO_AFTERMATH_TRACE_CATEGORY,
  resolveAftermathContextForAgent,
  resolveNotificationsForAnsweredAction,
} from '../../engine/encounterAftermath';
import { checkMidEncounterPromotion } from '../../engine/attentionTier';
import { consumeMatchingMarks } from '../../engine/hiddenMarks';
import { observeResolutionIntelligence } from '../../engine/intelligence';
import type { EncounterNotification } from '../../types/encounterVisibility';
import { isPlayerHoldLive, releasePlayerHold, setPlayerHold, tracePlayerHoldReleased, tracePlayerHoldSet } from '../../engine/playerStepHold';
import {
  markEncounterProgressDisregarded,
  markUnifiedActionDisregarded,
  recordEncounterChoiceMemory,
  recordUnifiedActionChoiceMemory,
  recordUnifiedActionNudgeMemory,
} from '../../engine/encounterChoiceMemory';
import { DialogHost } from './hosts/DialogHost';
import { GameMap } from './map/GameMap';
import { CeremonyHost } from './hosts/CeremonyHost';
import { StageHost } from './hosts/StageHost';
import { useLastViewedTick } from '../../hooks/useLastViewedTick';
import {
  getHexStrategicOverlays,
  getAgentStrategicSummary,
  type AgentStrategicSummary,
  type HexStrategicOverlay,
} from '../../engine/strategicPresentation';
import { dominionScaledEssenceCost } from '../../engine/dominion';
import { dominionLensVM, dominionHexLineVM, dominionBandColorVar, godPrimarySphere } from '../../engine/dominionViewModels';
import { ensureDominionProjection, updateDominionDrops } from '../../engine/simulationRuntime';
import { hexKey as dominionHexKey } from '../../lib/hexKey';
import { DOMINION_BANDS, DOMINION_BAND_WORDS } from '../../data/dominion-content';
import { DOMINION_TOOLTIP_IDS } from '../../data/dominion-ui-content';
import { getUITooltip } from '../../data/ui-content';
import { MAP_LENSES, type MapLensId } from '../../data/map-lenses';
import type { MapLensChangeSource } from '../../types/traces/ui-traces';
import { toggleLensValue } from './frame/GameScreenState';

interface GameViewProps {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
  mapSize?: import('../../engine/gameInit').MapSizePreset;
  ascendantIdentity?: import('../../types/remembrance').AscendantIdentity;
  /** Dev-only: bond The First at init. Split from `preSeeded` by THR-874. */
  seedFirst?: boolean;
  /** Dev-only: inject the ascendant test package. Split from `preSeeded` by THR-874. */
  seedTestPackage?: boolean;
  /** Dev-only: move the avatar to a settlement so the meeting can auto-trigger (THR-874). */
  placeAvatarForMeeting?: boolean;
  /** Leave this world for the title screen (THR-1604). Settings offers it only when wired. */
  onExitToTitle?: () => void;
  /** THR-1744: `?warm=<ticks>` — advance the seeded world this many ticks before handing over control. 0/absent = off. */
  warmTicks?: number;
  /** THR-1774: pin the doom (the showcase routes, `?doom=`). Absent → the world draws it. */
  doomArchetype?: import('../../types/doomClock').DoomClockArchetype;
  /** THR-1813 — the account record this run folds into at harvest. */
  account?: import('../../types/account').AccountRecord;
  /** THR-1813 — build this world from `account` (false on the dev routes). */
  shapeWorldFromAccount?: boolean;
  /** THR-1813 — write the concluded record to storage (false for `?account=` override sessions). */
  persistAccount?: boolean;
  /** THR-1813 — an earlier run in this tab failed to save, so this run is not kept either. */
  accountSaveFailed?: boolean;
  /** THR-1813 — *Wake in a new world*: the concluded record goes up to `App`. */
  onWakeNewWorld?: (account: import('../../types/account').AccountRecord, saved: boolean) => void;
  /** THR-1813 — false when this run is not carried into the next world (the Advanced path). Default true. */
  carriesRun?: boolean;
}

/** The spine's Beat 0 ("Reach Down"); the meeting follows it directly (THR-1605 S1). */
const OPENING_SPINE_BEAT_ID = ASCENDANT_SPINE[0].beatId;

/** `__DEBUG.getInterruptState().homedSurfaces` (THR-1877) — the home list, as data. */
const DEBUG_HOMED_SURFACES = HOMED_SURFACES.map(e => ({
  kind: e.kind,
  surfaceId: e.surfaceId,
  home: e.home,
  stopsTime: e.stopsTime,
}));
/**
 * THR-1716 — how long the world must sit still with no interrupt open before the
 * first-run Play prompt shows. Stops it flashing under the arrival beat.
 */
export const FIRST_RUN_PROMPT_DELAY_MS = 1500;

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

/**
 * The unified action the open encounter veil is showing: its pinned action id,
 * or (older notifications) the actor's unresolved action on the template.
 * Shared by dismiss and minimise (THR-1730) so both touch the same action.
 */
function matchesTieredEncounterAction(
  action: UnifiedAction,
  open: { activeActionId?: string; agentId: string; notification: EncounterNotification },
): boolean {
  if (open.activeActionId) return action.actionId === open.activeActionId;
  return !action.resolved
    && action.actorId === open.agentId
    && action.templateId === open.notification.encounterId;
}

/** Stable empties for the chapter-answer hook's inputs (THR-1812), so a missing list never re-runs its effect. */
const EMPTY_UNIFIED_ACTIONS: readonly import('../../types/unifiedAction').UnifiedAction[] = [];
const EMPTY_ENCOUNTER_NOTIFICATIONS: readonly EncounterNotification[] = [];

export function GameView({ archetype, avatarName, cosmology, seed, mapSize, ascendantIdentity, seedFirst, seedTestPackage, placeAvatarForMeeting, onExitToTitle, warmTicks = 0, doomArchetype, account, shapeWorldFromAccount, persistAccount, accountSaveFailed, onWakeNewWorld, carriesRun = true }: GameViewProps) {
  // ── Resume theme music if it was started on the start screen ──
  useEffect(() => {
    resumeTheme();
  }, []);

  // ── Scry state (lifted here so simulation + navigation can use it for LOS) ──
  const [scryState, setScryState] = useState<ScryState>(createScryState);

  // ── Read the Threads panel state ──
  // THR-1881 step e: the dialog-open flags the rails, top bar and DialogHost share
  // live in one GameScreenState reducer (frame/GameScreenState.tsx).
  const gameScreen = useGameScreenStore();
  const {
    state: { readThreadsOpen, chapterLedgerOpen, codexOpen, doomDetailOpen, mandateDetailOpen },
    setReadThreadsOpen, setChapterLedgerOpen, setChapterLedgerSeenCount, setCodexOpen, setDoomDetailOpen,
  } = gameScreen;
  const setInspector = gameScreen.setInspector;
  const inspectorState = gameScreen.state.inspector;
  const inspectorFullOpen = isInspectorOpen(inspectorState) && inspectorState.size === 'full';
  /**
   * THR-1911 (Inspector plan § D4, § D13) — the one door into the Inspector. The router's
   * card and sheet arms call it, and so do the selection handlers in `useAgentInteraction`;
   * a map click (`fromMap`) leaves a pinned Inspector where it is (§ D3).
   */
  const openInspector = useCallback((subject: AnyRef, size: 'docked' | 'wide', fromMap = false) => {
    setInspector(prev => (fromMap ? openFromMap(prev, subject, size) : openSubject(prev, subject, size)));
  }, [setInspector]);
  /** Open a world ref as a link would: `card` at its row's `opensAt`, `sheet` wide. */
  const openPage = useCallback((ref: WorldRef, mode: 'card' | 'sheet' = 'card') => {
    openInspector(ref, mode === 'sheet' ? 'wide' : (SURFACE_BY_WORLD_REF[ref.kind].opensAt ?? 'docked'));
  }, [openInspector]);
  // The Ledger rail folds while the Inspector is open (THR-1893 reads `inspectorOpen`).
  const inspectorIsOpen = isInspectorOpen(inspectorState);
  const setInspectorOpenFlag = gameScreen.setInspectorOpen;
  useEffect(() => {
    setInspectorOpenFlag(inspectorIsOpen);
  }, [inspectorIsOpen, setInspectorOpenFlag]);
  const [lastReadThreadsTick,setLastReadThreadsTick] = useState(0);
  // THR-603 / THR-1648: the Chapter Ledger flags live in GameScreenState; its
  // launcher (and the launcher's blur-on-close) lives in frame/LedgerRail.

  // ── Last viewed tick tracking (drives "new" badges on digest entries) ──
  const { markViewed } = useLastViewedTick();

  // ── Use simulation hook ──
  const {
    gameState, setGameState, tiles, riverPaths, lakeIds, areaProjection, realmProjection,
    running, speed, harvestResult, doTick, runTicksSync, getLiveState, handleWakeNewWorld,
    concludedRun, baseAccount, endAgeNow, previewRunEnd,
    twilightBeats, completeTwilightNow, beginTwilightNow,
    handleToggleRunning, setRunning, setSpeed, seasonName, year, maxEssence, COLS, ROWS,
    runtime, clockEverRan, arrivalBeatOffered, noteClockRunSource,
  } = useSimulation({ archetype, avatarName, cosmology, seed, scryState, mapSize, ascendantIdentity, seedFirst, seedTestPackage, placeAvatarForMeeting, doomArchetype, account, shapeWorldFromAccount, persistAccount, accountSaveFailed, onWakeNewWorld });

  // ── Debug bridge: the account record (THR-1813) ──
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerAccountBridge({
      get: () => concludedRun?.account ?? baseAccount,
      previewRunEnd,
      endAge: endAgeNow,
      beginTwilight: beginTwilightNow,
      getTwilightBeats: () => twilightBeats,
    });
  }, [concludedRun, baseAccount, previewRunEnd, endAgeNow, beginTwilightNow, twilightBeats]);

  // THR-1711 (6): the interrupt auto-pause is declared far below (it reads the
  // interrupt registry), but the play toggle and the arrival pause are wired
  // above it. This ref hands them its handle, so a toggle pressed while an
  // interrupt holds the clock changes the state the clock returns to, instead
  // of flipping `running` and being undone on close.
  const interruptHoldRef = useRef<InterruptAutoPauseHandle | null>(null);
  /** THR-1812 — the chapter answer run; declared after the auto-pause hook it reads, reached here by ref. */
  const chapterAnswerRef = useRef<ChapterAnswerRunHandle | null>(null);
  const handleToggleRunningRespectingHold = useCallback(() => {
    if (interruptHoldRef.current?.toggleIfHeld()) return;
    handleToggleRunning();
  }, [handleToggleRunning]);
  // THR-1716: a press that will start time tags its source for `clock.first_run`;
  // a press that pauses clears the tag, so a stale one never names a later start.
  const tagClockToggle = useCallback((source: 'hotkey' | 'play_control') => {
    const held = interruptHoldRef.current?.heldRunning ?? null;
    const willRun = held !== null ? !held : !running;
    noteClockRunSource(willRun ? source : null);
  }, [running, noteClockRunSource]);
  const handleHotkeyToggleRunning = useCallback(() => {
    tagClockToggle('hotkey');
    handleToggleRunningRespectingHold();
  }, [tagClockToggle, handleToggleRunningRespectingHold]);
  const handlePlayControlToggle = useCallback(() => {
    tagClockToggle('play_control');
    handleToggleRunningRespectingHold();
  }, [tagClockToggle, handleToggleRunningRespectingHold]);

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

  // ── Debug: force full-prose, always-popup encounter visibility (THR-880) ──
  // Testing lever for the Encounter Experience project — makes every threaded
  // agent's encounter render and interrupt as if they were The First, so
  // background/shaping-tier content isn't invisible during review. Read from
  // a URL flag (not window.__DEBUG) so it also works on the deployed build.
  useState(() => {
    setForceFullEncounterVisibility(new URLSearchParams(window.location.search).has('forceencounters'));
    return null;
  });

  // ── Debug: outcome-band review pin (`?outcome=<band>`) — THR-1030 ──
  // Rides on `?spawn=`: the band is pinned for the spawned template only, so the
  // rest of the world resolves normally and the reviewed ending is the one a
  // player could actually reach. Armed here rather than inside the spawn effect
  // below because the effect retries across early renders, and re-arming the pin
  // on each retry would clear the verdict of a resolution already in flight.
  // A band the URL misspells is refused with one warning and the game proceeds.
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const band = params.get('outcome');
    const spawnTemplateId = params.get('spawn');
    // THR-1300 slice 2: `?outcome=` is reused for undertakings. When `?undertaking=` is
    // present the pin targets that template's checkpoints; when both `?spawn=` and
    // `?undertaking=` are present `?spawn` wins and says so — precedence stated, never
    // silent, and no third flag.
    const undertakingTemplateId = params.get('undertaking');
    if (!band) {
      clearOutcomePin();
      clearUndertakingBandPin();
    } else if (spawnTemplateId) {
      if (undertakingTemplateId) {
        console.warn('[?outcome] both `?spawn=` and `?undertaking=` are present — `?spawn` wins; the undertaking resolves normally.');
      }
      setOutcomePin(spawnTemplateId, band);
      clearUndertakingBandPin();
    } else if (undertakingTemplateId) {
      clearOutcomePin();
      setUndertakingBandPin(undertakingTemplateId, band);
    } else {
      console.warn('[?outcome] needs a `?spawn=<templateId>` or `?undertaking=<templateId>` to pin — the band is scoped to one template. Resolving normally.');
    }
    // `?forcemoments`: the `?forceencounters` analog — every followed mortal's founding
    // interrupts for the flag's lifetime. Follow scope itself is widened in the effect
    // below once the world is ready.
    setForceMoments(params.has('forcemoments'));
    return null;
  });

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

  // ── The god page ──
  /**
   * THR-1911 (§ D13): the god's name in the rail opens the god page, wide — the subject
   * `{ kind: 'agent', id: ascendantId }`. The god sheet it replaced retired (THR-1912);
   * closing is the Inspector's own.
   */
  const setAscendantSheetOpen = useCallback((value: React.SetStateAction<boolean>) => {
    const next = typeof value === 'function' ? value(false) : value;
    if (next) openPage({ kind: 'agent', id: gameState.ascendantId }, 'sheet');
  }, [openPage, gameState.ascendantId]);

  // ── Codex overlay (THR-613 Slice 3b-tail): full three-state path catalog ──
  const [codexInitialFilter, setCodexInitialFilter] = useState<CodexRunStateFilter>('all');
  const [codexInitialEntryId, setCodexInitialEntryId] = useState<string | null>(null);
  const openCodex = useCallback((filter: CodexRunStateFilter = 'all') => {
    setCodexInitialFilter(filter);
    setCodexInitialEntryId(null);
    setCodexOpen(true);
  }, []);
  /**
   * Open the codex straight to one entry (THR-1002, Law 21).
   *
   * The action card's title is a link, and this is where it goes. Entry ids for
   * actions are the bare template id, which is what `WheelSlot.templateId` holds.
   */
  const openCodexEntry = useCallback((entryId: string) => {
    setCodexInitialFilter('all');
    setCodexInitialEntryId(entryId);
    setCodexOpen(true);
  }, []);

  // ── Ascendant beat: whether the player has "entered" the pending beat (THR-517) ──
  // THR-1716 U1: the opening beat offered at arrival enters itself — no offer
  // banner frame first. Later beats still start un-entered.
  const [beatEntered, setBeatEntered] = useState(arrivalBeatOffered);
  // THR-1809: wall-clock time of the player's last pointer or key input. A ready
  // opening gift waits `GIFT_QUIET_AFTER_INPUT_MS` after it (`giftDelivery.ts`).
  // Capture phase + passive: it only stamps, never stops or delays the event.
  // Starts at 0, so with no input yet the hold is surface-only (fail-soft).
  const lastInputAtRef = useRef(0);
  useEffect(() => {
    const stamp = () => { lastInputAtRef.current = Date.now(); };
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('pointerdown', stamp, opts);
    window.addEventListener('keydown', stamp, opts);
    return () => {
      window.removeEventListener('pointerdown', stamp, opts);
      window.removeEventListener('keydown', stamp, opts);
    };
  }, []);

  // THR-1853: the top bar's Rivals and Notables dropdowns, reported up so a queued
  // arrival or a waiting gift never mounts over them.
  const [rivalsOpen, setRivalsOpen] = useState(false);
  const [notablesOpen, setNotablesOpen] = useState(false);

  // ── View navigation hook ──
  const {
    hoveredHex, setHoveredHex, selectedHex,
    moveMode, hexMapRef,
    handleCenterOnAvatar,
    handleAvatarMoveClick, handleHexClickMove,
  } = useViewNavigation({ gameState, setGameState, avatarPixelPos, tiles, COLS, ROWS, scryState, fogDisabled, setRunning });

  // THR-1911 (§ D13): the `location` and `hex-zoom` views retire — a place and a hex
  // open their pages in the Inspector. The names stay, so every caller keeps its call.
  const handleLocationClick = useCallback((locationId: string) => {
    openPage({ kind: placeRefKind(gameState, locationId), id: locationId });
  }, [gameState, openPage]);
  const handleHexClick = useCallback((coord: import('../../types').HexCoord) => {
    openPage({ kind: 'hex', id: `${coord.col},${coord.row}` });
  }, [openPage]);

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
  // ── Divine Receipt (THR-727): id of a toast-tier receipt the player clicked through. ──
  // Modal-tier receipts auto-open (oldest unacknowledged); this only holds an explicitly
  // opened toast-tier receipt. Cleared on acknowledge.
  const [openedReceiptId, setOpenedReceiptId] = useState<string | null>(null);
  // ── Moment card (THR-1299 slice 3): the one interrupt-tier moment record on screen. ──
  // Filled from the queue only while no other interrupt is open (encounter first,
  // never two modals — review M4); held across an encounter that opens on top of
  // it; released on acknowledge.
  const [pendingMoment, setPendingMoment] = useState<UndertakingMomentRecord | null>(null);
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
    pendingIntervention,
    pendingChoice,
    setPendingChoice,
    selectedAgenda,
    agendaPickerOpen,
    pendingAgendas,
    retinueAgents,
    threadedNodes,
    agentDetail,
    wheelSlots,
    strandData,
    handleAgentSelect,
    handleThreadNodeSelect,
    attendThreadTug,
    beginIntervention,
    handleInterventionConfirm,
    handleInterventionCancel,
    handleAgendaSelect,
    handleAgendaCancel,
    handleStrandClose,
    handleBackFromAgentDetail,
    handleViewPsyche,
    handleOpenDrawer,
    handleAvatarActionClick,
    openAgentSheetForId,
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
    openInspector,
  });

  // ── Mark agent as viewed when detail panel opens ──
  useEffect(() => {
    if (selectedAgentId) {
      markViewed(selectedAgentId, gameState.tick);
    }
  }, [selectedAgentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // THR-1911 (§ D10): a map click on an agent or an army opens it; a place label opens the place.
  const handleMapNodeSelect = useCallback((nodeId: string, category: import('../../engine/retinue').ThreadCategory) => {
    handleThreadNodeSelect(nodeId, category, true);
  }, [handleThreadNodeSelect]);
  const handlePlaceLabelClick = useCallback((locationId: string) => {
    openInspector({ kind: placeRefKind(gameState, locationId), id: locationId }, 'docked', true);
  }, [gameState, openInspector]);

  // ── Composite hex click: move avatar if moveMode is active, otherwise select hex ──
  // moveMode is activated by handleAvatarMoveClick; once a destination is picked (or Escape pressed)
  // it resets to false. Normal clicks just select the hex — no navigation.
  const handleHexClickFull = useCallback((coord: import('../../types').HexCoord) => {
    if (moveMode) {
      handleHexClickMove(coord); // moves avatar and clears moveMode
    } else {
      handleHexSelect(coord, true);    // THR-1911: the land page (§ D10)
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

  // ── Avatar arrival event → a named pause (THR-1875, frame plan § F4) ──
  // When the ascendant reaches its move target, pause the game and name the pause: the
  // time status line reads "paused · {line}" and Needs you lists it with "Show". It
  // clears when the clock next runs. Not an interrupt: it has no surface, and the player
  // resumes it (the retired 5 s toast let its cause vanish, THR-1825 row 20).
  const [namedPause, setNamedPause] = useState<NeedsYouNamedPause | null>(null);
  const processedArrivalEventsRef = useRef(new Set<string>());
  useEffect(() => {
    for (const evt of gameState.tickEvents) {
      if (evt.type !== 'avatar_arrival') continue;
      if (processedArrivalEventsRef.current.has(evt.id)) continue;
      processedArrivalEventsRef.current.add(evt.id);

      // THR-1711: while an interrupt holds the clock, pause the state it returns to.
      if (!interruptHoldRef.current?.pauseIfHeld()) setRunning(false);
      setNamedPause({ line: evt.message, hex: evt.hexCoords ?? null, tick: evt.tick });
    }
  }, [gameState.tickEvents, setRunning]);
  const namedPauseSetAtRef = useRef(false);
  useEffect(() => {
    // The pause clears on its own when the clock next runs.
    if (running && namedPauseSetAtRef.current) setNamedPause(null);
    namedPauseSetAtRef.current = !running && namedPause !== null;
  }, [running, namedPause]);

  // Spotlight thread color (THR-340): sphere color of the spotlighted agent's primary domain.
  // Looks up the agent first in retinueAgents, then in threadedNodes (non-retinue threaded agents).
  // Falls back to undefined → AgentPulseOverlay uses gold default.
  const spotlightThreadColor = useMemo<string | undefined>(() => {
    const id = gameState.spotlightedAgent;
    if (!id) return undefined;
    const fromRetinue = retinueAgents.find(a => a.id === id);
    let domain: ReachDomain | null = fromRetinue?.primaryDomain ?? null;
    if (!domain) {
      const fromThread = threadedNodes.find(n => n.category === 'agent' && n.id === id);
      if (fromThread && fromThread.category === 'agent') domain = fromThread.primaryDomain;
    }
    if (!domain) return undefined;
    const sphere = REACH_TO_SPHERE[domain];
    return sphere ? SPHERE_COLORS[sphere] : undefined;
  }, [gameState.spotlightedAgent, retinueAgents, threadedNodes]);

  const latestThreadEncounterDecisions = useMemo(() => {
    const threadedAgentIds = threadedNodes
      .filter((node): node is Extract<ThreadedNode, { category: 'agent' }> => node.category === 'agent')
      .map(node => node.id);
    if (threadedAgentIds.length === 0) return new Map();
    return getLatestEncounterDecisionsByAgent(runtime, threadedAgentIds);
  }, [threadedNodes, runtime, runtime.balanceTelemetryVersion]);

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

  // The world's past, as the player's fog knows it (THR-1656). The outline is the
  // same every tick; only the specifics move, as fog reveals hexes — hence the
  // visibility and revelation deps beside worldVersion.
  const pastKnowledge = useMemo(
    () => ({ visibility: effectiveVisibilityMap, hexRevelation: gameState.hexRevelation }),
    [effectiveVisibilityMap, gameState.hexRevelation],
  );
  const beforeYouWoke = useMemo(() => {
    const view = readWorldPastForPlayer(gameState.graph, pastKnowledge);
    const past = worldHasPast(view) ? buildBeforeYouWoke(gameState.graph, view) : [];
    // THR-1843 — the earlier worlds' marks lead the section when this world carries any.
    const echoes = buildEchoGroup(gameState.graph, gameState.seededEchoes);
    return echoes ? [echoes, ...past] : past;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.graph, runtime.worldVersion, pastKnowledge, gameState.seededEchoes]);

  // THR-1213 slice 2 deleted an `ascendantLens` memo here. It built a stub lens
  // from *archetype* spheres, nothing read it, and the real lens now comes from
  // the player's remembrance identity inside `MeetTheFirstFlow` — where a lens
  // can actually reach the deal. (The identity-less `MeetingEncounterModal`, never
  // mounted, was deleted by THR-1897.)

  // ── Camera interaction gate (THR-463) ──
  // Stable callback that the HexMapV2 follow-mode checks on every hex change.
  // Re-computed only when the inputs that affect the decision change.
  const cameraGateCallback = useMemo(() => {
    const inputs = {
      graph: gameState.graph,
      encounterNotifications: gameState.encounterNotifications,
      encounterProgress: gameState.encounterProgress,
      tick: gameState.tick,
    };
    return (agentId: string) => shouldCenterOnAgentMove(agentId, inputs).center;
  }, [
    gameState.graph,
    runtime.worldVersion,
    gameState.encounterNotifications,
    gameState.encounterProgress,
    gameState.tick,
  ]);

  // ── Map view models (THR-1822) ──
  // The map's always-on data is read off the view-model seam (`src/engine/views/map/`),
  // cached on the runtime per world/structure version. Rows carry semantic keys; the
  // scene's render constants are applied by `map/mapViewAdapters.ts` after the read.
  const mapAgentRows = readView(runtime, gameState, mapAgentsSelector, { avatarNodeId: avatarNodeId ?? null }, tiles);
  const avatarPaint = useMemo<AvatarPaint>(() => ({
    portraitUrl: getOriginPortraitUrl(ascendantIdentity?.originFragmentId ?? ''),
    sphereColor,
    sigil: getSphereSymbol(archetype.sphereAlignment.primary),
  }), [ascendantIdentity?.originFragmentId, sphereColor, archetype.sphereAlignment.primary]);
  const agentRenderData = useMemo<AgentRenderData[]>(
    () => toAgentRenderData(mapAgentRows, avatarPaint),
    [mapAgentRows, avatarPaint],
  );

  // ── Thread line render data (ascendant → threaded agents) — map.threadLines ──
  const threadLineData: ThreadLineData[] = readView(
    runtime, gameState, mapThreadLinesSelector,
    { avatarNodeId: avatarNodeId ?? null, hexSize: HEX_CONSTANTS.HEX_SIZE }, tiles,
  );

  // ── Company cluster render data — map.companies ──
  const companyRenderData: CompanyRenderData[] = readView(
    runtime, gameState, mapCompaniesSelector, { hexSize: HEX_CONSTANTS.HEX_SIZE }, tiles,
  );

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

  // ── Activity icon render data (active encounters → per-agent reach icons) — map.activity ──
  const threadedAgentIdsForActivity = useMemo(
    () => threadedNodes.filter(node => node.category === 'agent').map(node => node.id),
    [threadedNodes],
  );
  // The action lists are replaced out of tick (a witnessed delivery beat) without a
  // worldVersion bump, so their replacement is part of the activity key.
  const activityActionsSeq = useRef(0);
  const activityActionsVersion = useMemo(
    () => ++activityActionsSeq.current,
    [gameState.unifiedActions, gameState.encounterProgress],
  );
  const mapActivityRows = readView(runtime, gameState, mapActivitySelector, {
    hexSize: HEX_CONSTANTS.HEX_SIZE,
    threadedAgentIds: threadedAgentIdsForActivity,
    telemetryVersion: runtime.balanceTelemetryVersion,
    actionsVersion: activityActionsVersion,
  }, tiles);
  const activityIconData = useMemo<ActivityIconData[]>(
    () => toActivityIconData(mapActivityRows),
    [mapActivityRows],
  );

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

  // ── Appointment clock lines (THR-1479) ──
  // Read off the seed queue — the appointment's one record — for the threaded
  // mortals only. Recomputed when the queue or the tick moves.
  const appointmentBadges = useMemo<Map<string, AppointmentBadgeModel>>(() => {
    const agentIds = threadedNodes.filter(n => n.category === 'agent').map(n => n.id);
    if (agentIds.length === 0) return new Map();
    return buildAppointmentBadges(
      gameState,
      agentIds,
      (agentId) => resolveAxiologicalProfile(gameState.graph, agentId, gameState.tick, gameState.worldSoul?.fundament),
    );
  }, [gameState, threadedNodes]);

  // ── Sustained-control rows (THR-418) ──
  // Recomputed whenever the control-effect list or essence reserves change.
  // worldVersion is included so that mid-tick property updates (e.g. settlement
  // promotion changing the hex display name) are picked up.
  const sustainedControls = useMemo<SustainedControlNode[]>(() => {
    if (!gameState.ascendantId) return [];
    return getSustainedControlNodes(
      gameState.graph,
      gameState.ascendantId,
      gameState.controlEffects,
      gameState.essencePool,
      gameState.tick,
    );
  }, [
    gameState.graph,
    gameState.ascendantId,
    gameState.controlEffects,
    gameState.essencePool,
    gameState.tick,
    runtime.worldVersion,
  ]);

  // ── Location render data — map.places ──
  // Structure-keyed on the seam: a settlement promotion calls touchStructure(), while
  // worldVersion moves every tick and would rebuild the whole icon layer each tick.
  const locationNodes: LocationNode[] = readView(runtime, gameState, mapPlacesSelector, undefined, tiles);

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

  // Ascendant reach-signature footprints (warhost/rift/wonder) → map signifiers (THR-554).
  // Recomputed on graph mutation (new army/wonder) or a new rift control effect.
  const reachSignatureMarkers = useMemo(
    () => buildReachSignatureMarkers(gameState.graph, gameState.controlEffects),
    [gameState.graph, gameState.controlEffects, runtime.worldVersion],
  );

  // THR-1898: rival marks, trade roads and their tooltip words left the plain map;
  // the Trouble and Trade lenses read them on the seam (views/lenses/).

  // ── Military render data — map.armiesAndBattles (one pass over the actors) ──
  const mapArmiesAndBattles = readView(runtime, gameState, mapArmiesAndBattlesSelector, undefined, tiles);
  const armyRenderData = useMemo<ArmyRenderData[]>(
    () => toArmyRenderData(mapArmiesAndBattles.armies),
    [mapArmiesAndBattles],
  );
  const battleRenderData: BattleIndicatorData[] = mapArmiesAndBattles.battles;

  // ── Realm border ink — map.realmInk (THR-1902): each Realm's holder, keyed for the scene ──
  const mapRealmInk = readView(runtime, gameState, mapRealmInkSelector, undefined, tiles);
  const realmHolderIndex = useMemo(() => toRealmHolderIndex(mapRealmInk), [mapRealmInk]);

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
  // THR-1155: where an Area opens. It has no sheet of its own — its surface is the hex
  // chronicle, which names it and tells its history — so both routes to an Area (a
  // notification's navigation target and an aftermath chip's link) focus the Area's own
  // centre hex. The centre is a hex inside the Area by construction, so the camera never
  // lands in the sea; an Area whose node has gone is a no-op rather than a jump to (0,0).
  // One definition, because two would drift into two different destinations.
  const handleFocusArea = useCallback((areaId: string) => {
    const node = gameState.graph.getNode(areaId);
    const col = node?.properties.centerCol as number | undefined;
    const row = node?.properties.centerRow as number | undefined;
    if (col === undefined || row === undefined) return;
    handleHexClick({ col, row });
    hexMapRef.current?.focusOn({ col, row });
  }, [gameState.graph, handleHexClick, hexMapRef]);

  const handleFocusHex = useCallback((col: number, row: number) => {
    hexMapRef.current?.focusOn({ col, row });
  }, [hexMapRef]);

  // ── Notification system hook ──
  const {
    notificationState,
    currentPopup,
    handleDismissToast,
    handleDismissAlert,
    handleDismissPopup,
    handlePopupChoice,
    handleClearEntityNotices,
  } = useNotifications({
    tickEvents: gameState.tickEvents,
    running,
    visibilityMap: effectiveVisibilityMap,
    suspendChoicePopups: interruptSuppressedUntilTick !== null && gameState.tick < interruptSuppressedUntilTick,
    preferences: notificationPrefs,
    // THR-666 threading gate — an unthreaded agent's beat never reaches the player.
    graph: gameState.graph,
    ascendantId: gameState.ascendantId,
  });

  // ── Divine Premonition modal state ──
  // Pops the next ready premonition from the queue (respects display delay).
  const activePremonition = useMemo(() => {
    const queue = gameState.premonitionQueue ?? [];
    const ready = queue.find(p => gameState.tick >= p.showAfterTick);
    return ready ?? null;
  }, [gameState.premonitionQueue, gameState.tick]);

  // THR-1781 — a paid steer is confirmed on the spot, naming what was bought; the
  // outcome of a compulsion follows later as its own toast from the decision phase.
  const pushSteerToast = useCallback((
    result: { success: boolean; message: string },
    sphere: SphereName,
    agentId: string,
  ) => {
    handlePushToast({
      id: `toast_premonition_steer_${Date.now()}`,
      message: result.message,
      sphere,
      count: 1,
      createdTick: gameState.tick,
      expiresAt: Date.now() + 5000,
      ...(result.success ? { actorId: agentId } : {}),
    });
  }, [handlePushToast, gameState.tick]);

  const handleWhisperChoice = useCallback((nudge: WhisperNudge) => {
    if (!activePremonition) return;
    const result = applyWhisperChoice(
      gameState, activePremonition.agentId, activePremonition.agentName, nudge,
    );
    pushSteerToast(result, nudge.sphere, activePremonition.agentId);
    // Remove from queue
    const remaining = (gameState.premonitionQueue ?? []).filter(p => p.id !== activePremonition.id);
    // THR-1783 — the spend lands inside the state update, not on the render's pool.
    setGameState(prev => {
      const essencePool = result.success
        ? spendPremonitionEssence(prev.essencePool, nudge.sphere, result.essenceSpent)
        : prev.essencePool;
      return {
        ...prev,
        premonitionQueue: remaining,
        essencePool,
        essenceMovement: recordEssenceMovement(prev.essenceMovement, prev.essencePool, essencePool, 'premonition', prev.tick),
      };
    });
  }, [activePremonition, gameState, pushSteerToast]);

  const handleCompulsionChoice = useCallback((candidate: CompulsionCandidate) => {
    if (!activePremonition) return;
    const result = applyCompulsionChoice(
      gameState, activePremonition.agentId, activePremonition.agentName, candidate,
    );
    pushSteerToast(result, candidate.sphere, activePremonition.agentId);
    // Remove from queue
    const remaining = (gameState.premonitionQueue ?? []).filter(p => p.id !== activePremonition.id);
    setGameState(prev => {
      const essencePool = result.success
        ? spendPremonitionEssence(prev.essencePool, candidate.sphere, result.essenceSpent)
        : prev.essencePool; // THR-1783, as above
      return {
        ...prev,
        premonitionQueue: remaining,
        essencePool,
        essenceMovement: recordEssenceMovement(prev.essenceMovement, prev.essencePool, essencePool, 'premonition', prev.tick),
      };
    });
  }, [activePremonition, gameState, pushSteerToast]);

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
    template: UnifiedActionTemplate;
    agentId: string;
    agentName: string;
    threadTier: ReturnType<typeof courtPositionToThreadTier>;
    openedAsInterrupt?: boolean;
    activeActionId?: string;
    clearanceGateRuntimeId?: string;
    activeActionSnapshot?: UnifiedAction;
    clearanceGateStateSnapshot?: ClearanceGateRuntimeState;
  } | null>(null);

  // THR-1477 — which aftermath reaction the player has already taken on the
  // open encounter, or null. The pick no longer closes the veil, so the veil
  // needs to know the decision is spent: without this the same buttons keep
  // their live chrome after the choice is made (Law 21), and the second click
  // would be a no-op the surface never admitted to. Cleared whenever an
  // encounter opens or closes, so it can only ever describe the open one.
  const [aftermathReactionTakenId, setAftermathReactionTakenId] = useState<string | null>(null);

  // The flag belongs to exactly one open encounter. Keying the reset on the
  // veil's subject — rather than clearing at each of the six
  // `setTieredEncounterState` call sites — means a new call site cannot forget
  // it, and a pick can never leak onto the next encounter.
  const openEncounterKey = tieredEncounterState
    ? `${tieredEncounterState.agentId}::${tieredEncounterState.notification?.id ?? tieredEncounterState.template.id}`
    : null;
  // THR-1777 — why the last aftermath pick did not land, in player words, or
  // null. Same lifetime as the taken id: it describes the open encounter only.
  const [aftermathReactionError, setAftermathReactionError] = useState<string | null>(null);
  useEffect(() => {
    setAftermathReactionTakenId(null);
    setAftermathReactionError(null);
  }, [openEncounterKey]);

  // THR-1777 — the last live copy of the action the veil is showing. The world
  // ticks on under an open aftermath, and the engine prunes a resolved action
  // once its notification is trimmed; the player is still looking at it. The
  // reaction resolver answers this copy when the live action is gone, so the
  // choice on screen always has something to land on.
  const onScreenActionRef = useRef<UnifiedAction | null>(null);
  const onScreenActionId = tieredEncounterState?.activeActionId ?? tieredEncounterState?.notification?.actionId;
  useEffect(() => {
    if (!onScreenActionId) { onScreenActionRef.current = null; return; }
    const live = gameState.unifiedActions.find(action => action.actionId === onScreenActionId);
    if (live) onScreenActionRef.current = live;
    else if (onScreenActionRef.current?.actionId !== onScreenActionId) {
      onScreenActionRef.current = tieredEncounterState?.activeActionSnapshot ?? null;
    }
  }, [gameState.unifiedActions, onScreenActionId, tieredEncounterState?.activeActionSnapshot]);

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
    // THR-1121 — every unified template qualifies. The old gate admitted only
    // templates with a support bundle, branching, aftermath config or an authored
    // nudge hand (THR-775's clause, load-bearing at the time: a nudge-bearing
    // template is typically plain otherwise, and without it the hand was
    // unreachable for exactly the templates WS1 authors it onto). Everything else
    // fell through to `buildSimpleEncounterStageModel`.
    //
    // That fall-through only worked because the simple screen had a move set to
    // render: the generic supportive/coercive/withdrawn triple from
    // `generateInterventionChoices`. Retiring that producer leaves the simple
    // adapter with `notification.choices` empty and no nudge phase to offer
    // instead — a stage with nothing on it to do. Widening the gate routes those
    // templates to the unified adapter, which builds the fate-alone nudge phase
    // (`Stay silent, let fate answer`) for a step that authored nothing. The gate lost its
    // reason before it lost its condition; this removes both.
    //
    // `watched` tier and gate duty are still excluded above, and both are
    // unaffected by the retirement: watched was observation-only already
    // (`maxChoices: 0`), and gate duty sources its stances locally.
    return ut;
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

  // THR-1803 — every encounter surface is billed to the god's primary sphere
  // (`handleEncounterIntervene`), so it reads that one pool. Summing all twelve
  // put "◆ 608 essence" in the veil footer beside per-sphere bars reading 45–55
  // (THR-1706's rule: no surface shows a summed essence total).
  const encounterPayingSphere = archetype.sphereAlignment.primary;
  const encounterPayingEssence = gameState.essencePool[encounterPayingSphere] ?? 0;

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
        essence: encounterPayingEssence,
        // THR-1123 — the authored nudge hand needs the per-sphere pool and the
        // unlock list to decide what is playable; the single-pool `essence`
        // above cannot answer that.
        gameState,
        // THR-1499 — the political map a `$realm` standing chip links through.
        realmProjection: () => realmProjection,
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
        essence: encounterPayingEssence,
        // THR-1720 — price choices against the pool handleEncounterIntervene charges.
        payingSphere: encounterPayingSphere,
        doomIdentityMatrix: gameState.doomIdentityMatrix,
        gameState,
        tick: gameState.tick,
        runtime,
        // THR-1499 — the political map a `$realm` standing chip links through. The
        // same projection the border mesh draws, from `useSimulation`, so the chip
        // and the map cannot name different nations.
        realmProjection: () => realmProjection,
      });
    }

    return null;
  }, [
    gameState,
    realmProjection,
    gameState.graph,
    gameState.essencePool,
    gameState.tick,
    encounterStageActiveAction,
    gateDutyClearanceGateState,
    isGateDutyEncounterStage,
    unifiedTemplateForStage,
    tieredEncounterState,
    archetype.sphereAlignment.primary,
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
      essence: encounterPayingEssence,
      // THR-1720 — price choices against the pool handleEncounterIntervene charges.
      payingSphere: encounterPayingSphere,
      tick: gameState.tick,
      gameState,
      // THR-1551 (fight on screen F2) — the watched view's one opponent line on a
      // fight step reads the live unified action, found the way the unified path
      // finds it: by id, else the snapshot the notification runtime carried.
      activeAction: (tieredEncounterState.activeActionId
        ? gameState.unifiedActions.find(action => action.actionId === tieredEncounterState.activeActionId)
        : undefined) ?? tieredEncounterState.activeActionSnapshot ?? undefined,
    });
  }, [tieredEncounterState, isGateDutyEncounterStage, unifiedTemplateForStage, encounterStageModel, gameState, gameState.graph, gameState.essencePool, gameState.tick, archetype.sphereAlignment.primary]);

  // ── Encounter notification surfacing (TB-040 / TB-055) ──
  /** Open the tiered encounter modal from a notification (toast click or auto-interrupt) */
  // Returns whether the modal actually opened — a stale notification (missing
  // template, no live runtime, or a step the encounter has already moved past)
  // declines, and callers must not treat it as read (THR-664).
  /**
   * Can this notification open a veil right now? The open below and THR-2053's
   * auto-open hold share it, so the hold waits on the chapter the scan would open,
   * never on a spent step record.
   */
  const canOpenEncounterNotification = useCallback((notif: EncounterNotification): boolean => {
    if (!getUnifiedTemplateById(notif.encounterId)) return false;
    const { encounter, activeAction } = selectEncounterRuntimeForNotification(
      notif,
      gameState.encounterProgress,
      gameState.unifiedActions,
      gameState.tick,
    );
    if (!encounter) return false;
    if (notif.stepIndex !== undefined && notif.stepIndex !== encounter.currentStepIndex) return false;
    // THR-1005: the final step of a resolved action still matches `currentStep`
    // (it freezes rather than advancing), so the stepIndex check above cannot
    // catch it. Left openable it eats the one auto-interrupt slot and the
    // aftermath queued behind it never pops on its own.
    return !isStepNotificationSupersededByAftermath(
      notif,
      activeAction,
      gameState.encounterNotifications ?? [],
    );
  }, [gameState.encounterNotifications, gameState.encounterProgress, gameState.tick, gameState.unifiedActions]);

  const handleOpenEncounterFromNotification = useCallback((notif: EncounterNotification): boolean => {
    if (!canOpenEncounterNotification(notif)) return false;
    const template = getUnifiedTemplateById(notif.encounterId);
    if (!template) return false;
    const { encounter, activeAction } = selectEncounterRuntimeForNotification(
      notif,
      gameState.encounterProgress,
      gameState.unifiedActions,
      gameState.tick,
    );
    if (!encounter) return false;
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
    return true;
  }, [canOpenEncounterNotification, gameState.clearanceGateStates, gameState.encounterNotifications, gameState.encounterProgress, gameState.tick, gameState.unifiedActions]);

  // THR-664: encounter activity is anchored to the entity it concerns. Pending
  // notifications become badges on the agent's thread row instead of toasts in
  // the global queue.
  const encounterBadges = useMemo(
    // THR-1727 — the badge names its encounter by the stakes / result line too.
    () => selectEncounterBadges(
      gameState.encounterNotifications,
      (notif) => stakesLineForNotification(gameState, notif),
      // THR-1730 — a step held for the player says it is waiting, and keeps its
      // badge — except while its own veil is open.
      new Set((gameState.unifiedActions ?? [])
        .filter(a => a.actionId !== tieredEncounterState?.activeActionId
          && isPlayerHoldLive(a, gameState.graph, gameState.tick))
        .map(a => a.actionId)),
    ),
    // The line reads the action and the archive; both change only with the tick.
    // Hold liveness reads the thread edge, edited in place by the attention
    // toggle (touchWorld), so worldVersion re-derives "waiting" while paused.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState.encounterNotifications, gameState.unifiedActions, gameState.tick, runtime.worldVersion, tieredEncounterState?.activeActionId],
  );

  // THR-1727 — each agent row's story line: the live encounter's stakes line,
  // else the last chapter's result line.
  const encounterStakesLines = useMemo(
    () => selectEncounterStakesLines(
      gameState,
      threadedNodes.filter(n => n.category === 'agent').map(n => n.id),
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threadedNodes, gameState.unifiedActions, gameState.chapterArchive, gameState.tick],
  );

  // THR-665: the same treatment for thread tugs — the shaping-tier "about to
  // happen" signal. Replaces the map's tug vibration, which no player perceived.
  // Depends on the pool so an unaffordable tug renders as such.
  const tugBadges = useMemo(
    () => selectThreadTugBadges(gameState.activeThreadTugs, attentionPool, attentionCapacity),
    [gameState.activeThreadTugs, attentionPool, attentionCapacity],
  );

  // THR-666: and the same treatment for a threaded agent's own beats — becomings,
  // complications, ambition milestones. The threading gate has already dropped
  // every unthreaded agent's notifications, so whatever reaches here is someone
  // the player is actually watching. THR-667: the same map also carries faction
  // rows, keyed by faction node id.
  const noticeBadges = useMemo(
    () => selectEntityNoticeBadges(notificationState.entityNotices),
    [notificationState.entityNotices],
  );
  // THR-1299 slice 4: the moment badge — unacknowledged, unexpired records per mortal.
  const momentBadges = useMemo(
    () => selectMomentBadges(gameState.pendingUndertakingMoments, gameState.tick),
    [gameState.pendingUndertakingMoments, gameState.tick],
  );

  /**
   * Resolve the node the thread-detail surface will render for a selection, or
   * `undefined` when nothing can render.
   *
   * Hoisted out of the detail panel's JSX (THR-935) so the notice badge's
   * "will this open?" guard and the panel's own render consult one predicate.
   * As two separate expressions they could disagree, and a badge clearing its
   * news against a surface that then declined to render is exactly the
   * destroy-unread failure this ticket exists to close.
   */
  const resolveThreadDetailNode = useCallback((nodeId: string, category: ThreadCategory) => {
    const detailNode: ThreadedNode | undefined =
      threadedNodes.find(n => n.id === nodeId)
      ?? (() => {
        // Fallback for non-threaded nodes (e.g. unbound agents clicked on map)
        const graphNode = gameState.graph.getNode(nodeId);
        if (!graphNode) return undefined;
        if (category === 'agent') {
          const locEdges = gameState.graph.getOutgoingEdges(graphNode.id, 'located_at');
          const locNode = locEdges.length > 0 ? gameState.graph.getNode(locEdges[0].target) : null;
          const locationName = locNode?.name ?? '(unknown)';
          return {
            id: graphNode.id,
            name: graphNode.name,
            tier: 0 as import('../../types/influence').InfluenceTier,
            // THR-1710: the avatar has no thread edge, but it is not "Unaware".
            tierName: unthreadedAgentTierName(graphNode.id, avatarNodeId),
            category: 'agent' as const,
            threadEdgeId: '',
            attentionMode: 'auto_resolve' as const,
            courtPosition: null,
            locationName,
            activityLabel: 'Unknown',
          } satisfies ThreadedNode;
        }
        if (category === 'faction') {
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
    return detailNode;
  }, [threadedNodes, gameState.graph, avatarNodeId]);

  /**
   * The notices a badge click revealed, snapshotted at click time (THR-935).
   *
   * Held here rather than read live because the click clears the source notices.
   * The snapshot is what the detail surface renders, so the news survives exactly
   * as long as the surface that was opened to show it.
   */
  const [revealedNotices, setRevealedNotices] = useState<RevealedNoticeGroup | null>(null);

  /**
   * Notice-badge click — reveal the anchor's news on its thread surface, then
   * clear the badge. This is only news, so reading it is the whole interaction;
   * there is nothing to resolve and nothing to pay. `anchorKind` is a
   * `ThreadCategory` by construction, so it selects the right panel section for
   * agents and factions alike (THR-667).
   *
   * THR-935: the clear used to be unconditional, and the surface it opened showed
   * the notices nowhere — so the only observable effect of a click was N pieces of
   * news being destroyed unread. Now the snapshot is taken first and the clear is
   * guarded, mirroring `handleOpenEncounterBadge` one function down: if the target
   * surface cannot render, the badge stays and the news keeps waiting.
   */
  const handleOpenNoticeBadge = useCallback((badge: EntityNoticeBadgeModel) => {
    if (!resolveThreadDetailNode(badge.anchorId, badge.anchorKind)) return;
    setRevealedNotices(buildRevealedNotices(badge));
    handleThreadNodeSelect(badge.anchorId, badge.anchorKind);
    handleClearEntityNotices(badge.anchorId);
  }, [resolveThreadDetailNode, handleThreadNodeSelect, handleClearEntityNotices]);

  /**
   * Moment badge click (THR-1299 slice 4) — put the badge's newest record in the
   * card's slot. Nothing is acknowledged here (Law 40: the click shows what the
   * badge counted; only the card's Acknowledge clears it). If another interrupt
   * is up the slot fills and the card waits behind it, exactly as an interrupt
   * would — a badge-opened card and an interrupt-opened card are one surface.
   */
  const handleOpenMomentBadge = useCallback((badge: MomentBadgeModel) => {
    markUndertakingMomentOpened(badge.primary, _gameStateRef.current.tick);
    setPendingMoment(badge.primary);
  }, []);

  /**
   * Badge click — open the encounter modal, then mark that notification read so
   * the badge clears. If the modal declines to open (stale notification), the
   * badge stays: clearing it would drop the beat with nothing shown.
   */
  const handleOpenEncounterBadge = useCallback((badge: EncounterBadgeModel) => {
    if (!handleOpenEncounterFromNotification(badge.primary)) return;
    const openedId = badge.primary.id;
    setGameState(prev => ({
      ...prev,
      encounterNotifications: (prev.encounterNotifications ?? []).map(n =>
        n.id === openedId ? { ...n, viewed: true } : n,
      ),
    }));
  }, [handleOpenEncounterFromNotification, setGameState]);

  // ── Keyboard hotkeys ──
  // THR-1878 (plan § D1, D2) — the map lens: one at a time, none by default, kept in
  // GameScreenState. Everything below keys on the lens's layer family from the list,
  // never on a lens id. The rest of the lens block sits with the debug bridges below.
  const activeLens = gameScreen.state.activeLens;
  const lensSuppressed = gameScreen.state.lensSuppressed;
  // THR-1892 (plan THR-1877 § D7) — while a moment plays on the Stage the lens is suppressed,
  // not switched off: two dims never compose, the bar keeps its lens pressed, and the lens
  // draws again when the moment ends. THR-1914: an armed card dims the map too, so the one
  // writer suppresses while either holds — neither can lift the other's suppression.
  const stageOpen = isStageOpen(gameScreen.state.stage);
  const cardArmed = gameScreen.state.armed !== null;
  const lensHeldOff = stageOpen || cardArmed;
  const setLensSuppressedFromStage = gameScreen.setLensSuppressed;
  const lensHeldOffRef = useRef(false);
  useEffect(() => {
    if (lensHeldOff === lensHeldOffRef.current) return;
    lensHeldOffRef.current = lensHeldOff;
    setLensSuppressedFromStage(lensHeldOff);
  }, [lensHeldOff, setLensSuppressedFromStage]);
  const activeLensLayer = activeLens ? lensLayerOf(activeLens) : null;
  const dominionLensOn = activeLensLayer === 'dominion';
  const dominionLensOpenedRef = useRef(false);
  const activeLensRef = useRef(activeLens);
  activeLensRef.current = activeLens;
  const tickRef = useRef(gameState.tick);
  tickRef.current = gameState.tick;
  const setMapLens = useCallback((next: MapLensId | null, source: MapLensChangeSource) => {
    const prev = activeLensRef.current;
    if (prev === next) return;
    if (next && lensLayerOf(next) === 'dominion') dominionLensOpenedRef.current = true;
    activeLensRef.current = next;
    gameScreen.setActiveLens(next);
    emitTrace({
      tick: tickRef.current,
      category: 'ui_map_lens_changed',
      from: prev,
      to: next,
      source,
      summary: `ui_map_lens_changed: ${prev ?? 'null'} → ${next ?? 'null'} (${source})`,
    });
  }, [gameScreen]);
  const setDominionLens = useCallback((on: boolean) => {
    setMapLens(on ? 'dominion' : null, 'debug');
  }, [setMapLens]);
  // THR-2060 — a lens whose reveal has not arrived answers no key; set once the reveal is read below.
  const lensShownRef = useRef<(lens: MapLensId) => boolean>(() => true);
  const toggleMapLens = useCallback((lens: MapLensId) => {
    if (!lensShownRef.current(lens)) return;
    setMapLens(toggleLensValue(activeLensRef.current, lens), 'key');
  }, [setMapLens]);
  const setMapLensFromBar = useCallback((next: MapLensId | null) => {
    setMapLens(next, 'bar');
  }, [setMapLens]);
  const handleLedgerKey = useLedgerKey(gameScreen);
  // THR-1875 — N opens Needs you; the queue is built further down, so the key reads a ref.
  const needsYouKeyRef = useRef<() => void>(() => {});
  const handleNeedsYouKey = useCallback(() => needsYouKeyRef.current(), []);
  useTopBarHotkeys({
    running,
    speed,
    onToggle: handleHotkeyToggleRunning,
    onSpeedChange: setSpeed,
    onStep: doTick,
    onMoveClick: handleAvatarMoveClick,
    onToggleLens: toggleMapLens,
    // THR-1893: L folds the Ledger rail, or toggles its flyout while the Inspector is open.
    onLedgerKey: handleLedgerKey,
    // THR-1875: N opens or closes Needs you while its pill renders.
    onNeedsYouKey: handleNeedsYouKey,
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

  // THR-1648 (S5): doom, mandate, notables, rivals and omens stay off the first
  // screen until the bond with The First (Law 53 — the HUD is a budget).
  // THR-1837: after the bond the screen fills one gift at a time. The staged rows
  // are a floor under THR-1648 (both need the bond); one merged toast per reveal.
  const pushOpeningRevealToast = useCallback((message: string, key: string) => {
    handlePushToast({
      id: `opening-reveal-${key}`,
      message,
      count: 1,
      createdTick: _gameStateRef.current.tick,
      expiresAt: Date.now() + OPENING_REVEAL_TOAST_MS,
    });
  }, [handlePushToast]);
  const openingReveal = useOpeningReveal(gameState, runtime.worldVersion, pushOpeningRevealToast);
  const firstScreenReveal = useFirstScreenReveal(gameState, openingReveal.show);
  // THR-2060 — the lens bar grows one lens per arrival (Dominion with Dominion, Trouble with Doom).
  // `show` is a fresh object each render; key the set on its lens bits so the bar's memo holds.
  const shownLensKey = MAP_LENSES.filter(l => openingReveal.show[l.revealSurface]).map(l => l.id).join('|');
  const shownLenses = useMemo(
    () => new Set(shownLensKey ? (shownLensKey.split('|') as MapLensId[]) : []),
    [shownLensKey],
  );
  lensShownRef.current = (lens) => shownLenses.has(lens);

  /**
   * The direction line arrow (THR-1837 U3): open The First's waiting chapter
   * through her unread encounter notification, the path the Threads badge uses.
   * If none can open (the chapter moved on between render and click), open the
   * Chapter Ledger instead — already on screen, since a waiting chapter brings it.
   */
  const handleOpenFirstChapter = useCallback(() => {
    const firstId = openingReveal.reveal.direction.firstId;
    const notif = firstId
      ? [...(gameState.encounterNotifications ?? [])]
          .reverse()
          .find(n => n.agentId === firstId && !n.resolved)
      : undefined;
    if (notif && handleOpenEncounterFromNotification(notif)) return;
    setChapterLedgerSeenCount(countThreadedChapters(gameState));
    setChapterLedgerOpen(true);
  }, [openingReveal.reveal.direction.firstId, gameState, handleOpenEncounterFromNotification]);

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
  /** Active encounter template for audio override (priority 3). */
  const activeUnifiedActionTemplate = useMemo<UnifiedActionTemplate | null>(() => {
    const active = gameState.encounterProgress.find(ep => ep.status === 'active');
    if (!active) return null;
    return getUnifiedTemplateById(active.encounterId) ?? null;
  }, [gameState.encounterProgress]);

  // ── Ambient audio context ──
  useAmbientContext({
    terrainHex: selectedHex ?? cameraCenter,
    tiles,
    // THR-1912: the hex chronicle and location panels that fed priorities 1 and 2 retired.
    hexChronicleSubtype: null,
    locationDetailSubtype: null,
    activeUnifiedActionTemplate,
  });

  // IX-002: Wrapped scry click with cross-hook overlay mutual exclusion
  // Also clears agent & hex selection so nothing selected persists behind the court overlay
  const handleScryWithMutex = useCallback(() => {
    closeAllAgentOverlays();
    handleBackFromAgentDetail(); // clears selectedAgentId + drawerOpen
    handleHexDetailClose();      // clears selectedHexCoord
    handleAvatarScryClick();
  }, [closeAllAgentOverlays, handleBackFromAgentDetail, handleHexDetailClose, handleAvatarScryClick]);

  // Eye icons and the seat button: centre the camera on a place at FOCUS_ZOOM (THR-1900 D7;
  // was a k-20 close-up). THR-1792 — `resolvePlaceHex` climbs `parentLocationId` (as debug
  // `gotoAgent` does) so a sublocation id finds its settlement's hex instead of failing silently.
  const handleCenterOnHex = useCallback((locationId: string) => {
    const hex = resolvePlaceHex(gameState.graph, locationId);
    if (hex) hexMapRef.current?.focusOn(hex);
  }, [gameState.graph, hexMapRef]);

  // Eye icon next to location name: navigate to the location detail view
  const handleZoomToLocation = useCallback((locationId: string) => {
    handleLocationClick(locationId);
  }, [handleLocationClick]);


  // ── THR-1750 — the Dominion lens: state, projection, view model, tooltip, bridge ──
  // Session-local, off at the start of a run, kept across view changes. The runtime
  // owns the projection (`ensureDominionProjection`); this block only re-reads it.
  const dominionGodSphere = useMemo(
    () => godPrimarySphere(gameState.graph, gameState.ascendantId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the graph is mutated in place; worldVersion is the key
    [gameState.graph, gameState.ascendantId, runtime.worldVersion],
  );
  const dominionDrops = useMemo(
    () => (gameState.ascendantId ? updateDominionDrops(runtime, gameState.graph, gameState.ascendantId, gameState.tick) : []),
    [runtime, gameState.graph, gameState.ascendantId, gameState.tick],
  );
  const dominionProjectionNow = useMemo(() => {
    if (!dominionLensOn || !gameState.ascendantId) return null;
    const opened = dominionLensOpenedRef.current;
    dominionLensOpenedRef.current = false;
    return ensureDominionProjection(runtime, gameState.graph, tiles, gameState.ascendantId, gameState.tick, opened);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- structuralCacheVersion is read off the runtime
  }, [dominionLensOn, runtime, gameState.graph, tiles, gameState.ascendantId, gameState.tick, runtime.structuralCacheVersion]);
  // THR-1822: with the lens on, its view model is read off the seam (`views/lenses/lensView.ts`),
  // which calls `ensureDominionProjection` + `dominionLensVM` unchanged.
  const dominionLensFromSeam = dominionLensOn && dominionProjectionNow
    ? readView(runtime, gameState, lensViewSelector,
      { lensId: 'dominion', stamp: dominionProjectionStamp(dominionProjectionNow, dominionGodSphere) }, tiles)
    : null;
  const dominionLensBase = useMemo(
    () => dominionLensFromSeam ?? dominionLensVM(dominionProjectionNow, dominionGodSphere, [], dominionLensOn),
    [dominionLensFromSeam, dominionProjectionNow, dominionGodSphere, dominionLensOn],
  );
  const dominionLensForMap = useMemo(
    // D2: while a moment or an armed card holds the map the lens layer is not drawn;
    // the band-drop badges are not the lens and stay.
    () => ({ ...dominionLensBase, on: dominionLensBase.on && !lensSuppressed, drops: dominionDrops }),
    [dominionLensBase, dominionDrops, lensSuppressed],
  );
  // THR-1878 — every other lens is a HexLensVM on the seam, drawn by the generic hex layer.
  const hexLensId = activeLens && activeLensLayer === 'hex' ? (activeLens as HexLensId) : null;
  const hexLensVM = hexLensId
    ? readView(runtime, gameState, hexLensViewSelector, { lensId: hexLensId, fogOff: fogDisabled }, tiles)
    : null;
  const dominionBandColors = useMemo(() => {
    const out: Record<string, string> = {};
    for (const band of DOMINION_BANDS) out[band] = dominionBandColorVar(band, dominionGodSphere);
    return out;
  }, [dominionGodSphere]);
  const dominionTooltip = useCallback((col: number, row: number) => {
    const key = dominionHexKey(col, row);
    const drop = dominionDrops.find(d => d.hexKey === key);
    const lineVm = dominionLensOn && !lensSuppressed ? dominionHexLineVM(gameState.graph, dominionProjectionNow, key, gameState.ascendantId) : null;
    if (!drop && !lineVm) return null;
    return {
      ...(lineVm ? { line: { prefix: lineVm.prefix, placeName: lineVm.placeName, word: DOMINION_BAND_WORDS[lineVm.band], color: dominionBandColorVar(lineVm.band, dominionGodSphere), pressure: lineVm.pressure ?? null } } : {}),
      ...(drop ? { drop: { lead: getUITooltip(DOMINION_TOOLTIP_IDS.drop)?.desc ?? '', line: drop.line } } : {}),
    };
  }, [dominionDrops, dominionLensOn, lensSuppressed, gameState.graph, gameState.ascendantId, dominionProjectionNow, dominionGodSphere]);

  // ── The view-model seam's source and debug bridge (THR-1822) ──
  // Components below read view models through `useView`; `__DEBUG.getView(id, args)`
  // returns exactly the view model a screen is given (same cache, same args).
  const viewSource = useMemo<ViewSource>(
    () => ({ runtime, state: gameState, tiles }),
    [runtime, gameState, tiles],
  );
  // Live game state for callbacks that must not close over a stale render. The
  // debug levers (`useGameDebugLevers`) read it too.
  const _gameStateRef = useRef(gameState);
  useEffect(() => { _gameStateRef.current = gameState; });
  // ── Ascendant beat: offer → enter → resolve (THR-517) ─────────────────────
  const pendingBeat = gameState.ascendantBeats?.pending ?? null;

  /**
   * Run-specific title + body for a template-backed pool beat (THR-514). Resolves the
   * beat's content template (`ASCENDANT_POOL_BEAT_TEMPLATES`, via `getUnifiedTemplateById`)
   * and runs its `name` + `description` through `enrichProse` against the god's anchor
   * mortal — The First (the `thread` edge with `courtPosition: 'the_first'`), falling back
   * to any threaded actor — so placeholders read as run-specific names. Returns undefined
   * for spine beats (they keep their authored `SPINE_BEAT_PRESENTATION`) and whenever no
   * subject can be resolved, so the modal falls back to safe kind-derived copy rather than
   * leaking raw `{placeholders}`. Fail-soft (NFP #4): any enrichment error → undefined.
   */
  const beatProseOverride = useMemo((): { title: string; prose: string } | undefined => {
    if (!pendingBeat || isSpineBeatId(pendingBeat.beatId)) return undefined;
    // THR-1650: a delivery beat's id is prefixed (`beat.delivery.<templateId>`); look up
    // the source encounter so the modal shows its real teaser, not the kind placeholder.
    const template = getUnifiedTemplateById(sourceTemplateIdOf(pendingBeat.beatId) ?? pendingBeat.beatId);
    const body = template?.description ?? template?.narrativeTemplates.initiation;
    if (!template || !body) return undefined;
    try {
      const ascendantId = gameState.ascendantId;
      if (!ascendantId) return undefined;
      const threads = gameState.graph.getOutgoingEdges(ascendantId, 'thread');
      const actorThread =
        threads.find(e =>
          (e.properties as { courtPosition?: string }).courtPosition === 'the_first' &&
          gameState.graph.getNode(e.target)?.type === 'actor',
        ) ?? threads.find(e => gameState.graph.getNode(e.target)?.type === 'actor');
      const subjectId = actorThread?.target;
      if (!subjectId) return undefined; // no anchor mortal → fall back to kind copy
      const ctx = gatherNarrativeContext(
        gameState.graph, subjectId, undefined, undefined, null, gameState, gameState.tick,
      );
      // THR-522: name the Director-bound introduction subject via the {group} placeholder.
      const boundGroupId = pendingBeat.boundNodeIds?.[0];
      if (boundGroupId) {
        const groupName = gameState.graph.getNode(boundGroupId)?.name;
        if (groupName) ctx.boundGroupName = groupName;
      }
      return { title: enrichProse(template.name, ctx), prose: enrichProse(body, ctx) };
    } catch {
      return undefined; // fail-soft: never crash the beat surface over prose
    }
  }, [pendingBeat, gameState]);

  // THR-1851: the people an introduction beat names, as a ref the modal can open.
  const beatSubjectId = pendingBeat?.kind === 'introduction' ? pendingBeat.boundNodeIds?.[0] : undefined;
  const beatSubjectRef = useMemo(() => {
    if (!beatSubjectId) return undefined;
    // A bound culture resolves to the Realm over it — a culture has no sheet of its own.
    const ref = worldRefForNodeId(gameState.graph, beatSubjectId);
    return ref?.kind === 'faction' ? ref : undefined;
  }, [beatSubjectId, gameState.graph]);

  /**
   * Resolve the pending beat: apply its grants into `unlockedActionIds` and clear
   * `pending` (engine `resolvePendingBeat`). For selection beats `chosenActionId`
   * names the picked card. A template resolver wires the missing-template fail-soft.
   */
  const handleResolveBeat = useCallback((chosenActionId?: string) => {
    setGameState(prev => resolvePendingBeat(
      prev,
      // THR-522: pass runtime + template provider so a beat template's aftermath reactions
      // (unlock_action / encounter_seed / graph ops) run on resolution; no-op when the
      // template declares none (the documented grant-only fallback).
      { chosenActionId, runtime, templateProvider: getUnifiedTemplateById },
      (id) => getUnifiedTemplateById(id) !== undefined,
    ).state);
    setBeatEntered(false);
  }, [setGameState, runtime]);

  /**
   * The modal's resolve (THR-1650). For a `delivery` beat, Witness *plays* the vision:
   * the source encounter is minted on The First (`prepareDeliveryEncounter`) and opened
   * in the encounter veil, whose own aftermath then runs against The First. The beat is
   * recorded as delivered either way; a vision that cannot bind resolves quietly with no
   * aftermath (the engine no longer runs a delivery template's reactions on the god).
   * Every other kind resolves exactly as {@link handleResolveBeat}. The debug drains
   * (`dismissBeats` / `suppressBeats`) keep calling `handleResolveBeat`, so they never
   * open a veil — that surface is what a verification run is there to observe.
   */
  const handleWitnessBeat = useCallback((chosenActionId?: string) => {
    const current = _gameStateRef.current;
    const pending = current?.ascendantBeats?.pending;
    if (!current || !pending || pending.kind !== 'delivery') {
      handleResolveBeat(chosenActionId);
      return;
    }
    const sourceTemplateId = sourceTemplateIdOf(pending.beatId);
    const subjectId = findDeliverySubject(current);
    const prepared: PreparedDeliveryEncounter = sourceTemplateId && subjectId
      ? prepareDeliveryEncounter(current, sourceTemplateId, subjectId, {
        binder: buildEncounterBinderContext(runtime, current),
      })
      : { success: false, reason: sourceTemplateId ? 'no_first' : 'template_missing', message: '' };
    const { unifiedAction: action, notification: preparedNotification, template: deliveredTemplate, agent } = prepared;
    const played = Boolean(prepared.success && action && preparedNotification && deliveredTemplate && agent);
    emitTrace({
      tick: current.tick,
      category: played ? 'beat.delivery_played' : 'beat.delivery_skipped',
      turn: current.tick,
      beatId: pending.beatId,
      sourceTemplateId: sourceTemplateId ?? undefined,
      subjectId,
      ...(played ? {} : { reason: prepared.reason }),
      summary: played
        ? `beat.delivery_played: ${pending.beatId} opened on ${subjectId}`
        : `beat.delivery_skipped: ${pending.beatId} (${prepared.reason ?? 'unknown'})`,
    });

    if (played && action && preparedNotification && deliveredTemplate && agent) {
      const notification = { ...preparedNotification, viewed: true };
      const encounter = buildActiveEncounterDisplayFromUnifiedAction(action, current.tick);
      const clearanceGateRuntimeId = action.clearanceGateIds?.[0];
      setGameState(prev => ({
        ...prev,
        unifiedActions: [...(prev.unifiedActions ?? []), action],
        clearanceGateStates: prepared.clearanceGateStates ?? prev.clearanceGateStates,
        encounterNotifications: [...(prev.encounterNotifications ?? []), notification],
      }));
      if (encounter) {
        setTieredEncounterState({
          notification,
          encounter,
          template: deliveredTemplate,
          agentId: agent.id,
          agentName: agent.name,
          threadTier: courtPositionToThreadTier(notification.courtPosition),
          // Player-opened (they pressed Witness), like a ThreadsPanel click: closing
          // the veil must not force-resume a sim the player had paused.
          openedAsInterrupt: false,
          activeActionId: action.actionId,
          clearanceGateRuntimeId,
          activeActionSnapshot: action,
          clearanceGateStateSnapshot: clearanceGateRuntimeId
            ? prepared.clearanceGateStates?.get(clearanceGateRuntimeId)
            : undefined,
        });
      }
    }
    handleResolveBeat(chosenActionId);
  }, [handleResolveBeat, setGameState, runtime]);

  // Spine beats present modally so the opening is not missable; pool beats wait behind
  // the offer affordance. THR-1744: a gift waits while a journey vignette is pending, so
  // two held decisions open one at a time. THR-1809: the entry itself is decided by
  // `resolveGiftDelivery` (the effect sits after `interruptResolution`, which it reads).
  const journeyVignettePending = (gameState.pendingVignettes?.length ?? 0) > 0;

  const retinueActiveEncounters = useMemo(() => {
    const map = new Map<string, { encounter: ActiveEncounterDisplay; template: UnifiedActionTemplate }>();
    for (const p of gameState.encounterProgress) {
      if (p.status !== 'active') continue;
      const tmpl = getUnifiedTemplateById(p.encounterId);
      if (tmpl) {
        map.set(p.actorId, {
          encounter: buildActiveEncounterDisplayFromLegacyProgress(p),
          template: tmpl,
        });
      }
    }
    for (const action of gameState.unifiedActions) {
      if (action.resolved) continue;
      const tmpl = getUnifiedTemplateById(action.templateId);
      if (!tmpl) continue;
      map.set(action.actorId, {
        encounter: buildActiveEncounterDisplayFromUnifiedAction(action, gameState.tick),
        template: tmpl,
      });
    }
    return map;
  }, [gameState.encounterProgress, gameState.tick, gameState.unifiedActions]);


  const suppressedEncounterNotificationId = useRef<string | null>(null);
  /**
   * THR-2053 — a chapter the world opens waits like any arrival. The scan runs above
   * the player-surface list, so it reads that list through this ref (synced each
   * render below it) and looks again on `encounterHoldRecheck` when the hold lifts.
   */
  const encounterSurfaceHoldRef = useRef(false);
  const [encounterHoldRecheck, setEncounterHoldRecheck] = useState(0);
  /** `__DEBUG.getInterruptState().heldEncounter` — the chapter the scan holds, and why. */
  const heldEncounterRef = useRef<{ notificationId: string; heldBy: ArrivalHoldReason[] } | null>(null);
  /**
   * THR-1724 — notifications the player minimised. The auto-open scan skips
   * them for as long as they stay pending; only the badge reopens them. A set,
   * not the single suppression ref above, because two encounters can be set
   * down in a row and the first must not pop back when the second is.
   */
  const minimisedEncounterNotificationIds = useRef<Set<string>>(new Set());
  /**
   * THR-1730 — step notifications the player has already committed a hand or a
   * choice on. Each step raises its own notification id, so membership means
   * "this step is decided": minimise never holds it. Pruned with the minimised
   * set once the notification is no longer pending.
   */
  const committedEncounterNotificationIds = useRef<Set<string>>(new Set());

  // `openedAsInterrupt` no longer forces a resume (THR-1608): the central
  // auto-pause restores the clock to its state before the encounter opened.
  const closeEncounterModalAndResume = useCallback((_openedAsInterrupt?: boolean) => {
    setTieredEncounterState(null);
    // Clear the spotlight so AgentPulseOverlay stops pulsing once the encounter screen unmounts (THR-340).
    setGameState(prev => (prev.spotlightedAgent === undefined
      ? prev
      : { ...prev, spotlightedAgent: undefined }));
  }, [setGameState]);

  const handleEncounterDisregard = useCallback(() => {
    // THR-1856 — leaving an aftermath (Escape, the context strip) is an
    // acknowledgement: nothing on it is pending, so there is no step to mark
    // disregarded, and it must resolve what "Return to the world" resolves or a
    // sibling step notification reopens the same aftermath.
    if (tieredEncounterState?.notification?.id && tieredEncounterState.notification.kind === 'aftermath') {
      suppressedEncounterNotificationId.current = tieredEncounterState.notification.id;
      setInterruptSuppressedUntilTick(gameState.tick + 1);
      setGameState(prev => ({
        ...prev,
        encounterNotifications: resolveNotificationsOnVeilLeave(
          prev.encounterNotifications ?? [],
          tieredEncounterState.notification,
          tieredEncounterState.activeActionId,
        ),
      }));
      closeEncounterModalAndResume(tieredEncounterState.openedAsInterrupt);
      return;
    }
    if (tieredEncounterState?.notification?.id) {
      suppressedEncounterNotificationId.current = tieredEncounterState.notification.id;
      setInterruptSuppressedUntilTick(gameState.tick + 1);
      const heldAction = (gameState.unifiedActions ?? []).find(action =>
        action.playerHold && matchesTieredEncounterAction(action, tieredEncounterState));
      if (heldAction) tracePlayerHoldReleased(heldAction, gameState.tick, 'dismiss');
      setGameState(prev => {
        const unifiedActions = (prev.unifiedActions ?? []).map(action => {
          if (!matchesTieredEncounterAction(action, tieredEncounterState)) return action;
          const step = tieredEncounterState.template.steps[action.currentStep];
          // THR-1730 (U2) — a dismiss ends the set-down.
          return markUnifiedActionDisregarded(
            releasePlayerHold(action),
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
  }, [closeEncounterModalAndResume, gameState.tick, gameState.unifiedActions, setGameState, tieredEncounterState]);

  /**
   * THR-1724 — set the encounter down without deciding it. Nothing on the action
   * or the notification changes: the step stays pending, the badge stays
   * standing (Law 40), and the badge reopens it. The notification id is held in
   * the auto-open suppression so the scan does not throw the veil straight back
   * up; that suppression clears itself once the notification resolves.
   */
  const handleEncounterMinimize = useCallback(() => {
    const minimisedId = tieredEncounterState?.notification?.id;
    if (minimisedId) {
      minimisedEncounterNotificationIds.current.add(minimisedId);
      setInterruptSuppressedUntilTick(gameState.tick + 1);
      // THR-1730 (U1) — a pause-tier unified-action step waits for its god: the
      // set-down writes a hold that Phase 1 honours. Auto-mode and legacy
      // notifications keep today's behaviour (no hold; they play out).
      const notification = tieredEncounterState.notification;
      // Read the live record, not the veil's snapshot: an authored-choice commit
      // resolves the notification but leaves the veil open, and a set-down after
      // that must not hold a step the player already decided (it would have no
      // badge to come back through).
      const stillPending = (gameState.encounterNotifications ?? [])
        .some(n => n.id === minimisedId && !n.resolved);
      const holdsStep = stillPending
        && !committedEncounterNotificationIds.current.has(minimisedId)
        && notification.sourceSystem === 'unified_action'
        && (notification.kind ?? 'encounter') === 'encounter'
        && notification.autoResolveTick === null;
      const holdTarget = holdsStep
        ? (gameState.unifiedActions ?? []).find(action =>
            !action.resolved && matchesTieredEncounterAction(action, tieredEncounterState))
        : undefined;
      // The badge counts unviewed notifications (`isBadgeWorthy`), and a badge
      // reopen marks one viewed — so a minimise un-views it, or the second
      // set-down would leave the encounter pending with no way back in.
      setGameState(prev => ({
        ...prev,
        ...(holdTarget
          ? {
              unifiedActions: (prev.unifiedActions ?? []).map(action =>
                action.actionId === holdTarget.actionId ? setPlayerHold(action, prev.tick) : action),
            }
          : {}),
        encounterNotifications: (prev.encounterNotifications ?? []).map(n =>
          n.id === minimisedId && n.viewed ? { ...n, viewed: false } : n,
        ),
      }));
      if (holdTarget && !holdTarget.playerHold) {
        tracePlayerHoldSet(holdTarget, gameState.tick, tieredEncounterState.agentName);
      }
    }
    closeEncounterModalAndResume(tieredEncounterState?.openedAsInterrupt);
  }, [closeEncounterModalAndResume, gameState.encounterNotifications, gameState.tick, gameState.unifiedActions, setGameState, tieredEncounterState]);

  const handleEncounterAcknowledgeAftermath = useCallback(() => {
    if (tieredEncounterState?.notification?.id) {
      suppressedEncounterNotificationId.current = tieredEncounterState.notification.id;
      setInterruptSuppressedUntilTick(gameState.tick + 1);
      // THR-1778: resolve every record this aftermath discharges, not only the one
      // on screen — a leftover step notification otherwise re-opens the aftermath.
      setGameState(prev => ({
        ...prev,
        encounterNotifications: resolveNotificationsOnAftermathAcknowledge(
          prev.encounterNotifications ?? [],
          tieredEncounterState.notification,
          tieredEncounterState.activeActionId,
        ),
      }));
    }
    closeEncounterModalAndResume(tieredEncounterState?.openedAsInterrupt);
  }, [closeEncounterModalAndResume, gameState.tick, setGameState, tieredEncounterState]);

  const applyAftermathReactionForAgent = useCallback((
    agentId: string,
    reactionId?: string,
    source: 'modal' | 'debug-bridge' | 'receipt-modal' = 'modal',
    // THR-1777 — the aftermath on screen. Without it the resolver picks the
    // agent's oldest pending notification, which on any agent holding several
    // aftermaths is a different encounter whose reactions miss the clicked id.
    actionId?: string,
    actionSnapshot?: UnifiedAction,
  ): {
    success: boolean;
    message: string;
    reactionId?: string;
    touchedWorld?: boolean;
    touchedStructure?: boolean;
    closeAfterSelection?: boolean;
    alreadyApplied?: boolean;
  } => {
    const resolvedContext = resolveAftermathContextForAgent(_gameStateRef.current, agentId, reactionId, { actionId, actionSnapshot });
    if ('error' in resolvedContext) {
      return {
        success: false,
        message: resolvedContext.error,
        alreadyApplied: Boolean(resolvedContext.alreadyApplied),
      };
    }

    const selectedReactionId = resolvedContext.reaction.id;
    const selectedActionId = resolvedContext.action.actionId;
    const selectedEncounterId = resolvedContext.action.templateId;
    const selectedCloseAfterSelection = resolvedContext.reaction.closeAfterSelection ?? true;

    // THR-780: `applyEncounterAftermathReaction` mutates the live WorldGraph in place
    // (e.g. `node.properties.reputationTallies` in encounterAftermath.ts), so it must NOT
    // run inside a `setGameState` updater — `<StrictMode>` double-invokes updaters in dev,
    // which applied every accumulating effect twice (a 0.35 tally delta landed as 0.70)
    // while idempotent ones (hidden_mark, deduped by a deterministic markId) silently
    // looked correct. Compute against the live ref here and commit the finished state
    // below, mirroring the `resolveBeat` idiom above. This also retires the THR-114
    // (mutable write-out object) and THR-133 (deferred trace list) workarounds, which
    // shielded the reads but not the mutation itself.
    const baseState = _gameStateRef.current;
    const activeAction = baseState.unifiedActions.find(action => action.actionId === selectedActionId) ?? resolvedContext.action;
    const reaction = activeAction.aftermathSummary?.reactions?.find(entry => entry.id === selectedReactionId) ?? resolvedContext.reaction;

    const { state: nextState, mutationSummary: reactionMutations } = applyEncounterAftermathReaction(
      baseState,
      activeAction,
      reaction,
      baseState.tick,
      runtime,
    );

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
          tick: baseState.tick,
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
      baseState.tick,
    );
    // THR-113: passive observation — trace when a resolved encounter's target
    // matches an existing intelligence record held by the actor. No state mutation.
    observeResolutionIntelligence(stateAfterMarks, activeAction, reaction, baseState.tick);

    const committedState = {
      ...stateAfterMarks,
      encounterNotifications: resolveNotificationsForAnsweredAction(
        stateAfterMarks.encounterNotifications ?? [],
        activeAction,
      ),
    };

    // Constant-returning updater: a StrictMode double-invoke returns the same object and
    // re-runs nothing. Callers never queue a gameState write before this one.
    setGameState(() => committedState);

    if (reactionMutations.touchedStructure) touchStructure(runtime);
    else if (reactionMutations.touchedWorld) touchWorld(runtime);
    for (const trace of markTraces as Parameters<typeof emitTrace>[0][]) emitTrace(trace);

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
      touchedWorld: reactionMutations.touchedWorld,
      touchedStructure: reactionMutations.touchedStructure,
      closeAfterSelection: selectedCloseAfterSelection,
    };
  }, [runtime, setGameState]);

  const handleEncounterAftermathReaction = useCallback((reactionId: string) => {
    if (!tieredEncounterState) return;
    const result = applyAftermathReactionForAgent(
      tieredEncounterState.agentId,
      reactionId,
      'modal',
      onScreenActionId,
      onScreenActionRef.current ?? undefined,
    );
    if (!result.success) {
      // THR-1777 — never fail silently. The veil says, in plain words, that the
      // choice did not land; the engine's reason goes to the trace log.
      setAftermathReactionError(result.alreadyApplied
        ? AFTERMATH_REACTION_REFUSAL_COPY.alreadyApplied
        : AFTERMATH_REACTION_REFUSAL_COPY.unavailable);
      emitTrace({
        tick: _gameStateRef.current.tick,
        category: 'aftermath_reaction_refused',
        agentId: tieredEncounterState.agentId,
        actionId: onScreenActionId,
        reactionId,
        reason: result.message,
        summary: `aftermath reaction refused: ${result.message}`,
      });
      return;
    }
    setAftermathReactionError(null);

    if (tieredEncounterState.notification?.id) {
      suppressedEncounterNotificationId.current = tieredEncounterState.notification.id;
      setInterruptSuppressedUntilTick(gameState.tick + 1);
    }

    // THR-1477 — the pick lands its effects and the encounter STAYS OPEN.
    //
    // Before this, the reaction applied and closed the veil on the same click
    // (`closeAfterSelection ?? true`), so there was no moment when the grants
    // the aftermath chips describe had been written *and* the encounter was
    // still on screen — opening the sheet beforehand shows the pre-encounter
    // agent, which is the opposite of what the director asked for. Now the
    // aftermath keeps "Return to the world" (already rendered beneath the
    // reaction box) as its single exit, and the sheet opened from here shows
    // the encounter's writes.
    //
    // `closeAfterSelection` is authored content and is still returned by
    // `applyAftermathReactionForAgent` for its non-modal callers; it no longer
    // decides when the modal closes, because the player does.
    setAftermathReactionTakenId(result.reactionId ?? reactionId);
  }, [applyAftermathReactionForAgent, gameState.tick, onScreenActionId, tieredEncounterState]);

  // ── Divine Receipt (THR-727) ──
  // The active receipt: an explicitly opened toast-tier receipt, else the oldest
  // unacknowledged modal-tier receipt. Only this one renders (queue is the buffer).
  const activeReceipt = useMemo(() => {
    const receipts = gameState.playerActionReceipts ?? [];
    if (openedReceiptId) {
      const opened = receipts.find(r => r.id === openedReceiptId && !r.acknowledged);
      if (opened) return opened;
    }
    return receipts.find(r => !r.acknowledged && r.presentation === 'modal') ?? null;
  }, [gameState.playerActionReceipts, openedReceiptId]);

  const handleAcknowledgeReceipt = useCallback(() => {
    if (!activeReceipt) return;
    const id = activeReceipt.id;
    setGameState(prev => ({
      ...prev,
      playerActionReceipts: (prev.playerActionReceipts ?? []).map(r =>
        r.id === id ? { ...r, acknowledged: true } : r,
      ),
    }));
    setOpenedReceiptId(null);
    emitTrace({
      tick: _gameStateRef.current.tick,
      category: 'player_receipt',
      event: 'acknowledged',
      actionId: activeReceipt.actionId,
      templateId: activeReceipt.templateId,
      presentation: activeReceipt.presentation,
      band: activeReceipt.outcomeBand,
      changeCount: activeReceipt.changes.length,
      summary: `player_receipt: acknowledged ${activeReceipt.templateName}`,
    } as unknown as Parameters<typeof emitTrace>[0]);
  }, [activeReceipt, setGameState]);

  const handleReceiptReaction = useCallback((reactionId: string) => {
    if (!activeReceipt) return;
    const result = applyAftermathReactionForAgent(gameState.ascendantId, reactionId, 'receipt-modal', activeReceipt.actionId);
    if (result.success) {
      emitTrace({
        tick: _gameStateRef.current.tick,
        category: 'player_receipt',
        event: 'reaction_applied',
        actionId: activeReceipt.actionId,
        templateId: activeReceipt.templateId,
        presentation: activeReceipt.presentation,
        band: activeReceipt.outcomeBand,
        changeCount: activeReceipt.changes.length,
        reactionId,
        summary: `player_receipt: reaction '${reactionId}' applied on ${activeReceipt.templateName}`,
      } as unknown as Parameters<typeof emitTrace>[0]);
    }
    handleAcknowledgeReceipt();
  }, [activeReceipt, applyAftermathReactionForAgent, gameState.ascendantId, handleAcknowledgeReceipt]);

  // ── Moment card (THR-1299 slice 3) ──
  // The read-model is rebuilt when the tick, the projects or the pool move: the
  // action slot's affordability and the checkpoint dots both read live state, and
  // the forward link reads the graph, which is mutated in place — so the tick is
  // the version signal here, never the graph object's identity.
  const momentCardModel = useMemo(
    () => (pendingMoment ? buildMomentCardModel(gameState, pendingMoment) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingMoment, gameState.strategicState, gameState.essencePool, gameState.tick],
  );

  const handleAcknowledgeMoment = useCallback(() => {
    if (!pendingMoment) return;
    const id = pendingMoment.id;
    setGameState(prev => ({
      ...prev,
      pendingUndertakingMoments: acknowledgeUndertakingMoment(prev.pendingUndertakingMoments, id, prev.tick),
    }));
    setPendingMoment(null);
  }, [pendingMoment, setGameState]);

  /**
   * The card's action slot — Inspire / Sabotage on the mortal whose moment this
   * is. A real player cast on the shared path (THR-739): buffs apply, the pool is
   * charged, the rider lands on the next checkpoint. Affordability is checked
   * here so a blocked act fails fast inline (Law 48) rather than committing a
   * cast the pool cannot pay for.
   */
  const handleMomentDivineAct = useCallback((templateId: string, targetAgentId: string) => {
    const template = getUnifiedTemplateById(templateId);
    if (!template) return { success: false, message: 'No such working.' };
    // THR-1977: the same paying sphere the hand prices from — a card with no sphere
    // of its own pays from the god's primary, never from no pool.
    const sphere = payingSphere(template, archetype.sphereAlignment.primary);
    // THR-1750: check the price the cast will charge (tier-scaled, then the target's band).
    const essenceCost = dominionScaledEssenceCost(gameState.graph, gameState.ascendantId, template, targetAgentId).cost;
    if (!canAfford(gameState.essencePool, sphere, essenceCost)) {
      return { success: false, message: `Not enough ${sphere} essence.` };
    }
    const cast = preparePlayerCast({
      graph: gameState.graph,
      ascendantId: gameState.ascendantId,
      template,
      templateId: template.id,
      targetId: targetAgentId,
      tick: gameState.tick,
      seed: gameState.seed,
      sphere,
      runtime,
    });
    setGameState(prev => commitPlayerCast(prev, {
      cast,
      event: {
        idPrefix: 'evt_moment_act',
        message: `The Ascendant ${template.narrativeTemplates?.initiation ?? template.name}.${cast.buffParenthetical}`,
        isInterventionBeat: true,
      },
    }));
    return { success: true, message: `${template.name} is cast. It lands on the next checkpoint.` };
  }, [gameState.essencePool, gameState.graph, gameState.ascendantId, gameState.tick, gameState.seed, runtime, setGameState, archetype.sphereAlignment.primary]);

  // ── Follow affordance (THR-1299 slice 4) — one state, two surfaces ──
  // The JourneyTab header and the EncounterVeil context strip both render the
  // three-way read and both write through the single writer. Un-following a
  // bond-followed mortal is a mute, decided by the writer from the state of the
  // world, never by the surface.
  const describeFollowFor = useCallback(
    (agentId: string) => describeFollow(gameState, gameState.graph, agentId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState.followedAgentIds, gameState.mutedAgentIds, gameState.ascendantId, gameState.graph, gameState.tick],
  );
  const handleToggleFollow = useCallback((agentId: string, source: 'arc_panel' | 'encounter_ui') => {
    setGameState(prev => {
      const d = describeFollow(prev, prev.graph, agentId);
      const patch = d.followed
        ? unfollowAgent(prev, prev.graph, agentId, source)
        : followAgent(prev, agentId, source);
      return { ...prev, ...patch };
    });
  }, [setGameState]);

  /** Intervention handler — player chose an intervention for the current encounter step */
  const handleEncounterIntervene = useCallback((choiceId: string, essenceSpent: number): boolean => {
    if (!tieredEncounterState) return false;
    const {
      notification,
      agentId,
      encounter,
    } = tieredEncounterState;
    // THR-989: the veil renders `authoredChoices` when the step carries them, so
    // the clicked id is frequently not in `notification.choices` at all. Looking
    // only there dropped the pick silently — see `resolveInterveneChoice`.
    const choice = resolveInterveneChoice(
      tieredEncounterState.template,
      tieredEncounterState.activeActionSnapshot?.currentStep,
      notification.choices,
      choiceId,
    );
    if (!choice) return false;

    // THR-1720 — pre-roll rejection, as `handleCommitNudges` does for a hand:
    // a choice the paying pool cannot cover changes nothing and says so. This
    // used to floor the pool at zero and apply the choice anyway, so a choice
    // costing 5 could be bought with 1.
    const payingSphere = archetype.sphereAlignment.primary;
    if (!spendAuthoredChoiceEssence(gameState.essencePool, essenceSpent, payingSphere).ok) {
      handlePushToast({
        id: `choice-reject-${notification.id}-${gameState.tick}`,
        message: `Not enough ${sphereWord(payingSphere)} essence — the moment passes untouched.`,
        count: 1,
        createdTick: gameState.tick,
        expiresAt: Date.now() + NUDGE_REJECT_TOAST_MS,
        sphere: payingSphere,
      });
      return false;
    }

    setGameState(prev => {
      // Re-charged against `prev`: the pool can move between the check above
      // and this update, and the rule is the same all-or-nothing one.
      const spend = spendAuthoredChoiceEssence(prev.essencePool, essenceSpent, payingSphere);
      if (!spend.ok) return prev;

      return {
        ...prev,
        ...withEssenceSpend(prev, spend.pool, 'spend_nudge'),
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
          // THR-1730 (U2) — a commit ends the set-down: the step resumes its clock.
          const released = releasePlayerHold(action);
          const step = tieredEncounterState.template.steps[action.currentStep];
          if (!step) return released;
          return recordUnifiedActionChoiceMemory(
            released,
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

    const heldAction = (gameState.unifiedActions ?? []).find(action =>
      action.playerHold && matchesTieredEncounterAction(action, tieredEncounterState));
    if (heldAction) tracePlayerHoldReleased(heldAction, gameState.tick, 'commit');

    // Emit trace
    console.debug('[EncounterVeil] Intervention:', {
      agentId,
      encounterId: notification.encounterId,
      choiceId,
      essenceSpent,
      interventionType: choice.interventionType,
      probabilityBoost: choice.probabilityBoost,
    });
    return true;
  }, [
    tieredEncounterState,
    setGameState,
    archetype.sphereAlignment.primary,
    gameState.essencePool,
    gameState.tick,
    gameState.unifiedActions,
    handlePushToast,
  ]);

  /**
   * THR-775 — commit the player's nudge hand for the current step.
   *
   * This is the writer WS0 declared and never built: it writes `activeNudges`
   * onto the in-flight action, spends the essence, and emits the
   * declared-but-never-emitted `nudge_played` trace. The legacy
   * `handleEncounterIntervene` is untouched and still owns `authoredChoices`
   * templates.
   *
   * Pre-roll rejection: if the pool cannot cover the hand at commit time (the
   * player spent elsewhere while the stage was open), nothing is written and a
   * toast says so. The cards snap back because `activeNudges` never changed —
   * the failure can never surface after the roll.
   */
  /**
   * THR-1812 — after a commit, should the veil stay up as the answering card?
   * Yes when the clock will stay paused once the veil closes: the step needs
   * world time to answer, and closing would leave a silent, paused map. The hold
   * is read here, before `tieredEncounterState` changes, while the veil still
   * holds the clock. `null` (no hold recorded) counts as running — the worst
   * case is today's behaviour. Returns `true` when it showed the card.
   */
  const keepChapterOnScreenAfterCommit = useCallback((
    actionId: string,
    stepIndex: number,
    choiceNames: ReadonlyArray<string | null | undefined>,
  ): boolean => {
    if (!tieredEncounterState) return false;
    const wasRunning = interruptHoldRef.current?.getWasRunningBeforeInterrupt() ?? null;
    if (wasRunning !== false && !CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK) return false;
    const answer = chapterAnswerRef.current;
    if (!answer) return false;
    answer.showCard({
      actionId,
      stepIndex,
      notificationId: tieredEncounterState.notification.id,
      chapterName: encounterVeilModel?.header.title || null,
      choiceLine: chapterAnswerChoiceLine(choiceNames),
    });
    return true;
  }, [tieredEncounterState, encounterVeilModel]);

  /** THR-1812 — *Let the world turn*: set the hold to run, then close the veil. */
  const handleChapterLetWorldTurn = useCallback(() => {
    chapterAnswerRef.current?.letWorldTurn();
    setInterruptSuppressedUntilTick(gameState.tick + 1);
    setTieredEncounterState(null);
  }, [gameState.tick]);

  /** THR-1812 — *Back to the map*: the answer waits; the clock stays paused. */
  const handleChapterBackToMap = useCallback(() => {
    chapterAnswerRef.current?.backToMap();
    setInterruptSuppressedUntilTick(gameState.tick + 1);
    setTieredEncounterState(null);
  }, [gameState.tick]);

  const handleCommitNudges = useCallback((nudgeIds: string[], _essenceCost: number) => {
    if (!tieredEncounterState) return;
    const phase = encounterVeilModel?.nudgePhase;
    if (!phase) return;

    const cardsById = new Map(phase.cards.map(c => [c.id, c]));
    const requests = nudgeIds.map(id => ({
      sphere: cardsById.get(id)?.sphere,
      cost: Math.max(0, cardsById.get(id)?.essenceCost ?? 0),
    }));

    // THR-1706 — bill the sphere the cards named. `budgetSphere` is what each
    // sphere-less card's cost row printed; the archetype's primary is the same
    // sphere on every identity run and the fallback on a legacy one.
    const spend = spendNudgeEssence(
      gameState.essencePool,
      requests,
      phase.budgetSphere ?? archetype.sphereAlignment.primary,
    );

    if (!spend.ok) {
      handlePushToast({
        id: `nudge-reject-${phase.actionId}-${gameState.tick}`,
        message: spend.shortfallSphere
          ? `Not enough ${spend.shortfallSphere} essence — the moment passes untouched.`
          : 'Not enough essence — the moment passes untouched.',
        count: 1,
        createdTick: gameState.tick,
        expiresAt: Date.now() + NUDGE_REJECT_TOAST_MS,
        sphere: spend.shortfallSphere,
      });
      return;
    }

    setGameState(prev => {
      // THR-887 — tally the library cards this hand played, so the twilight
      // harvest has something to select the run's defining card from. Cards
      // with no `libraryCardId` are one-off authored options and are skipped:
      // an echo can only carry a card the next run's library still builds.
      const tally: Record<string, CardPlayTallyEntry> = { ...(prev.cardPlayTally ?? {}) };
      const climax = prev.doomClock?.progress ?? 0;
      for (const id of nudgeIds) {
        const libraryCardId = cardsById.get(id)?.libraryCardId;
        if (!libraryCardId) continue;
        const existing = tally[libraryCardId];
        tally[libraryCardId] = {
          timesPlayed: (existing?.timesPlayed ?? 0) + 1,
          peakSignificance: Math.max(existing?.peakSignificance ?? 0, climax),
        };
      }

      return {
        ...prev,
        ...withEssenceSpend(prev, spend.pool, 'spend_nudge'),
        cardPlayTally: tally,
        unifiedActions: (prev.unifiedActions ?? []).map(action => {
          if (action.actionId !== phase.actionId) return action;
          // THR-1730 (U2) — a commit (cards or an empty hand) ends the set-down.
          const withHand = { ...releasePlayerHold(action), activeNudges: [...nudgeIds] };
          // THR-1123 — also remember the hand per step. `activeNudges` is
          // replaced when the next step commits, so it cannot answer "what was
          // played on step 0" afterwards; retrospective surfaces (gate duty's
          // history afterimages and aftermath echoes) need exactly that, and
          // `choiceHistory` is the existing per-step channel for it.
          const step = tieredEncounterState.template.steps[action.currentStep];
          if (!step || isActionStepBranch(step)) return withHand;
          // `ActionStep` declares no `id` even though every built template
          // carries one — one of the THR-489 baseline's wrong types, which the
          // two `step.id` reads above this function hit as well. Read through a
          // narrow local shape rather than adding a third baseline entry; the
          // fallback is the id convention the templates are built with, so a
          // step that genuinely lacks one still records a usable key.
          const stepId = (step as { id?: string }).id
            ?? `${phase.templateId}.${action.currentStep + 1}`;
          return recordUnifiedActionNudgeMemory(
            withHand,
            action.currentStep,
            stepId,
            nudgeIds,
            nudgeIds.map(id => cardsById.get(id)?.name).filter(Boolean).join(', '),
            prev.tick,
            nudgeIds.reduce((sum, id) => sum + Math.max(0, cardsById.get(id)?.essenceCost ?? 0), 0),
          );
        }),
      };
    });

    const heldAction = (gameState.unifiedActions ?? []).find(a => a.actionId === phase.actionId && a.playerHold);
    if (heldAction) tracePlayerHoldReleased(heldAction, gameState.tick, 'commit');

    // One trace per played card (player-driven, low volume — not an
    // all-agents phase, so the aggregate-batching rule does not apply).
    for (const id of nudgeIds) {
      const card = cardsById.get(id);
      if (!card) continue;
      emitTrace({
        type: 'nudge_played',
        tick: gameState.tick,
        actionId: phase.actionId,
        templateId: phase.templateId,
        nudgeId: id,
        essenceSpent: Math.max(0, card.essenceCost),
        forecastBefore: phase.baseForecast.tier,
        forecastAfter: forecastWithNudges(phase, nudgeIds).tier,
        rider: card.riderLabel,
        summary: `Nudge played: ${card.name} on ${phase.templateId} step ${phase.stepIndex + 1}`,
      } as unknown as Parameters<typeof emitTrace>[0]);
    }

    // The hand is committed; the step now resolves on mortal terms. Closing the
    // stage releases the THR-668 interrupt the veil registered.
    suppressedEncounterNotificationId.current = tieredEncounterState.notification.id;
    // THR-1730 — the step is decided; a later set-down of it (reopened from the
    // badge before it resolves) must not hold it again.
    committedEncounterNotificationIds.current.add(tieredEncounterState.notification.id);
    // THR-1812 — on a paused clock the step cannot answer until world time
    // passes; keep the veil up as the answering card instead of closing onto a
    // silent map. Read the hold *before* the veil closes, while it still holds.
    if (keepChapterOnScreenAfterCommit(
      phase.actionId,
      phase.stepIndex,
      nudgeIds.map(id => cardsById.get(id)?.name),
    )) return;
    setInterruptSuppressedUntilTick(gameState.tick + 1);
    setTieredEncounterState(null);
  }, [
    tieredEncounterState,
    encounterVeilModel,
    gameState.essencePool,
    gameState.tick,
    gameState.unifiedActions,
    archetype.sphereAlignment.primary,
    handlePushToast,
    setGameState,
    keepChapterOnScreenAfterCommit,
  ]);

  /**
   * THR-1976 — the veil's Play button. It used to call `handleEncounterIntervene`
   * directly, which charges and records but never closes the veil, so the step
   * could not resolve (the open veil holds the clock), a free choice looked
   * dead, and every further press charged again. This handler is the one the
   * veil commits through: one commit per step, then the answering card or the
   * close, exactly as a committed hand does.
   */
  const handleEncounterCommitAndContinue = useCallback((choiceId: string, essenceSpent: number) => {
    if (!tieredEncounterState) return;
    const commit = claimAuthoredChoiceCommit(
      tieredEncounterState.notification.id,
      committedEncounterNotificationIds.current,
    );
    if (!commit.claimed) return;
    // THR-1720 — a rejected spend leaves the stage open, like a rejected hand.
    if (!handleEncounterIntervene(choiceId, essenceSpent)) {
      commit.release();
      return;
    }
    suppressedEncounterNotificationId.current = tieredEncounterState.notification.id;
    // THR-1812 — same answering card as a committed hand. A legacy encounter
    // with no unified action has no step to watch, so it closes as before.
    const { actionId, stepIndex } = tieredEncounterState.notification;
    if (actionId && stepIndex !== undefined && keepChapterOnScreenAfterCommit(
      actionId,
      stepIndex,
      [encounterVeilModel?.choices.find(c => c.id === choiceId)?.label],
    )) return;
    setInterruptSuppressedUntilTick(gameState.tick + 1);
    setTieredEncounterState(null);
    // The clock returns to its state before the encounter opened, once ALL
    // interrupts are closed (THR-668 auto-pause, THR-1608 resume-to-prior).
  }, [gameState.tick, handleEncounterIntervene, tieredEncounterState, encounterVeilModel, keepChapterOnScreenAfterCommit]);

  /** Boost handler — Watched tier essence boost */
  const handleEncounterBoost = useCallback((essenceSpent: number) => {
    if (!tieredEncounterState || essenceSpent <= 0) return;

    setGameState(prev => {
      const newPool = { ...prev.essencePool };
      newPool[archetype.sphereAlignment.primary] = Math.max(0, newPool[archetype.sphereAlignment.primary] - essenceSpent);
      return { ...prev, ...withEssenceSpend(prev, newPool, 'spend_nudge') };
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
      return { ...prev, ...withEssenceSpend(prev, newPool, 'spend_nudge') };
    });
  }, [setGameState, archetype.sphereAlignment.primary]);

  // Auto-interrupt only pause-mode encounter notifications. At that tier every
  // beat should interrupt on its own — each step and the closing aftermath —
  // with the thread badge as the recovery route, not the primary one. The scan
  // keeps trying past a notification that declines to open, so one stale record
  // cannot starve the beats behind it (THR-1005).
  // Pause is handled by the central interrupt auto-pause (useInterruptAutoPause below)
  // THR-1017: the suppression window is gated on `running` here — a paused sim
  // can never reach the tick that clears it, so behind a stacked modal this
  // scan would bail forever and strand the aftermath. See
  // `isEncounterAutoOpenSuppressed` for the full mechanism.
  useEffect(() => {
    heldEncounterRef.current = null;
    if (isEncounterAutoOpenSuppressed(interruptsSuppressed, running)) return;
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
    // THR-1724 — a minimised encounter waits for its badge. Ids that are no
    // longer pending are pruned so the set cannot grow without bound.
    const minimised = minimisedEncounterNotificationIds.current;
    const committed = committedEncounterNotificationIds.current;
    if (minimised.size > 0 || committed.size > 0) {
      const pending = new Set(notifications.filter(n => !n.resolved).map(n => n.id));
      for (const id of minimised) if (!pending.has(id)) minimised.delete(id);
      for (const id of committed) if (!pending.has(id)) committed.delete(id);
    }
    const candidates = minimised.size > 0 ? notifications.filter(n => !minimised.has(n.id)) : notifications;
    // THR-2053 — the world never opens a chapter under the player's click or over a
    // surface they opened; it looks again when the quiet window ends or the surface closes.
    // A dry run of the scan with the open's own checks: the chapter it would open.
    const waitingId = runEncounterAutoOpenScan(candidates, suppressedEncounterNotificationId.current, canOpenEncounterNotification);
    const waiting = waitingId ? candidates.find(n => n.id === waitingId) : undefined;
    const msSinceInput = Date.now() - lastInputAtRef.current;
    const heldBy = waiting
      ? worldOpenedEncounterHeldBy({
          playerSurfaceOpen: encounterSurfaceHoldRef.current,
          recentInput: lastInputAtRef.current > 0 && msSinceInput < INTERRUPT_QUIET_AFTER_INPUT_MS,
        })
      : [];
    if (waiting && heldBy.length > 0) {
      heldEncounterRef.current = { notificationId: waiting.id, heldBy };
      if (!heldBy.includes('recent_input')) return;
      const timer = setTimeout(
        () => setEncounterHoldRecheck(n => n + 1),
        Math.max(0, INTERRUPT_QUIET_AFTER_INPUT_MS - msSinceInput) + 50,
      );
      return () => clearTimeout(timer);
    }
    heldEncounterRef.current = null;
    runEncounterAutoOpenScan(
      candidates,
      suppressedEncounterNotificationId.current,
      handleOpenEncounterFromNotification,
    );
  }, [gameState.encounterNotifications, handleOpenEncounterFromNotification, interruptsSuppressed, running, activePremonition, encounterHoldRecheck, canOpenEncounterNotification]);

  // THR-1724 (review gate) — a minimised step the world resolved without the
  // player must not leave a badge that opens nothing. Since THR-1730 a
  // minimised pause-tier unified-action step is held and does not resolve, so
  // this now covers legacy and auto-mode notifications, and a hold the engine
  // released (thread set to Lives on); a held step found here is a real bug. Once its step can no longer be opened — the same three
  // checks `handleOpenEncounterFromNotification` makes — the notification is
  // resolved, which retires the badge and prunes the minimised set. Pause-tier
  // records carry no `autoResolveTick`, so nothing else would ever retire it.
  useEffect(() => {
    const minimised = minimisedEncounterNotificationIds.current;
    if (minimised.size === 0) return;
    const notifications = gameState.encounterNotifications ?? [];
    const spent = new Set<string>();
    for (const notif of notifications) {
      if (!minimised.has(notif.id) || notif.resolved || notif.kind === 'aftermath') continue;
      const { encounter, activeAction } = selectEncounterRuntimeForNotification(
        notif,
        gameState.encounterProgress,
        gameState.unifiedActions,
        gameState.tick,
      );
      const stillOpenable = Boolean(encounter)
        && (notif.stepIndex === undefined || notif.stepIndex === encounter!.currentStepIndex)
        && !isStepNotificationSupersededByAftermath(notif, activeAction, notifications);
      if (!stillOpenable) spent.add(notif.id);
    }
    if (spent.size === 0) return;
    for (const id of spent) minimised.delete(id);
    setGameState(prev => ({
      ...prev,
      encounterNotifications: (prev.encounterNotifications ?? []).map(n =>
        spent.has(n.id) ? { ...n, resolved: true } : n,
      ),
    }));
  }, [gameState.encounterNotifications, gameState.encounterProgress, gameState.unifiedActions, gameState.tick, setGameState]);

  // ── Meeting encounter (Meet The First) ──
  const [meetingState, setMeetingState] = useState<MeetingEncounterState | null>(null);

  // ── Sheet openers for non-agent thread types (Plan 16-02) ──
  /**
   * THR-1911 (§ D13): every caller of the old place, faction, army and artifact sheets
   * keeps its call and reaches the subject's page, wide. The sheets themselves retired
   * with THR-1912; `null` (close) is the Inspector's own.
   */
  const setStubModalState = useCallback((value: { nodeId: string; category: import('../../engine/retinue').ThreadCategory } | null) => {
    if (value === null) return;
    const kind: WorldRefKind = value.category === 'location' ? placeRefKind(gameState, value.nodeId) : value.category;
    openPage({ kind, id: value.nodeId }, 'sheet');
  }, [gameState, openPage]);

  // ── Attachment page, opened from an aftermath consequence chip (THR-1120) ──
  /** THR-1911 (§ D13): an attachment opens its content card in the Inspector. */
  const setAttachmentSheetId = useCallback((id: string | null) => {
    if (id !== null) openPage({ kind: 'attachment', id });
  }, [openPage]);

  // ═══ The one ref router (THR-1490) ═══════════════════════════════════════
  //
  // Built here rather than in a provider because GameView's own handlers call `open`,
  // and a component cannot consume a context it renders. It is published to the tree
  // below through `RefRouterProvider`.
  //
  // Placed at this line and not beside the other handlers because the Tier-3 openers it
  // needs (`setStubModalState`, `setAttachmentSheetId`) are declared just above.

  /**
   * Tier 3 — the sheets, by `NavigationTarget` arm.
   *
   * Every arm is the destination that arm already had; this is a gathering, not a
   * redesign. Three are new because THR-1490 gave `NavigationTarget` three arms for
   * sheets that already existed (artifact, attachment, army) and had no address.
   *
   * `encounter` and `journey` stay unwired deliberately — no sheet exists for either, and
   * the router turns an unwired arm into that thing's *card* rather than a dead click.
   */
  const sheetOpeners = useSheetOpeners({
    onSelectAgent: handleAgentSelect,
    onFocusHex: handleFocusHex,
    onOpenLocation: handleLocationClick,
    onFocusArea: handleFocusArea,
    // THR-727: clicking a divine-receipt toast opens the receipt dialogue.
    onOpenReceipt: (receiptId: string) => setOpenedReceiptId(receiptId),
    onOpenFaction: (factionId: string) => setStubModalState({ nodeId: factionId, category: 'faction' }),
    onOpenArtifact: (artifactId: string) => setStubModalState({ nodeId: artifactId, category: 'artifact' }),
    onOpenArmy: (armyId: string) => setStubModalState({ nodeId: armyId, category: 'army' }),
    // THR-1120 — the attachment *template* node id, not the granted instance.
    onOpenAttachment: setAttachmentSheetId,
  });

  /**
   * Tier 3 for content — the codex overlay (THR-1491).
   *
   * `openCodexEntry` already exists for the action card's title link (THR-1002); this is
   * the same door, reached by a `ContentRef` instead. The router asks whether the overlay
   * can actually show an id, because the registry row promises only that the *kind* is
   * catalogued: `undertaking_template` is `sheet: 'codex'` and 56 of its 116 templates
   * have no codex card, so a caller trusting the row alone would draw an "open in codex ↗"
   * that opens nothing (Law 25).
   *
   * **The id set is hydrated lazily, and that is the point.** `Codex` is a lazy chunk and
   * `codexRunState` imports the registry type-only, so `codexRegistry` — the whole catalog
   * plus its art registries — is not in the main bundle today. A static import here to
   * answer one membership question would put it there (NFP #7). Until the dynamic import
   * lands the set is empty, which costs a content card its footer CTA for the few
   * milliseconds after mount and never draws a dead one.
   */
  const [codexEntryIds, setCodexEntryIds] = useState<ReadonlySet<string>>(() => new Set());
  // THR-1915 — Find lists the Codex's entries; the same lazy load hands them over.
  const [codexFindSeeds, setCodexFindSeeds] = useState<readonly FindCodexSeed[]>(() => []);
  useEffect(() => {
    let live = true;
    void import('../Codex/codexRegistry')
      .then((m) => {
        if (!live) return;
        const entries = m.getAllCodexEntries();
        setCodexEntryIds(new Set(entries.map((e) => e.id)));
        setCodexFindSeeds(entries.map((e) => ({ id: e.id, name: e.name, fact: e.category })));
      })
      // A failed chunk load costs the CTA, never the card (NFP #4).
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const codexHasEntry = useCallback((entryId: string) => codexEntryIds.has(entryId), [codexEntryIds]);
  const openCodexSheet = useCallback(
    (entryId: string) => {
      if (!codexHasEntry(entryId)) return false;
      openCodexEntry(entryId);
      return true;
    },
    [codexHasEntry, openCodexEntry],
  );

  const refRouter = useRefRouter({
    graph: gameState.graph,
    tick: gameState.tick,
    seed: gameState.seed,
    runtime,
    protagonistId: avatarNodeId ?? gameState.ascendantId,
    openSheet: sheetOpeners,
    openCodexEntry: openCodexSheet,
    codexHasEntry,
    openInspector,
  });

  // Notifications keep their exact behaviour: the adapter maps the target to a ref and
  // asks for the sheet, and the sheet is the same handler it always called.
  const handleNotificationNavigate = useNotificationNavigation(refRouter);

  // THR-1851 — the links inside a detail card (faction allegiances, threads, prose
  // terms). Until this was mounted every one of them rendered as plain text in the game.
  const getLiveGraph = useCallback(() => _gameStateRef.current.graph, []);
  const openDetailNodeRef = useDetailNodeRefOpener(refRouter, getLiveGraph);

  // ── Debug modal auto-opener (dev-only, tree-shaken in prod) ──
  // THR-1912: the levers open the Inspector pages that replaced the retired sheets.
  useDebugOpenModal(_gameStateRef, {
    openAgentProfileForId: openAgentSheetForId,
    openStubModal: (nodeId, category) => setStubModalState({ nodeId, category }),
  });

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

  /**
   * THR-1706 — Meet The First's test hands are a real spend. The beat used to
   * show "598" while the player picked and then commit without charging, so the
   * pool snapped back to 600. Charged with the same `spendNudgeEssence` every
   * other nudge commit uses: the god's primary pays first, the spend spills
   * across the pool only if it runs dry (the meeting's cards are not
   * sphere-gated). All-or-nothing; a shortfall charges nothing and is traced.
   */
  const handleMeetingSpendEssence = useCallback((testIndex: number, requests: NudgeSpendRequest[]) => {
    // Priced against the pool this render shows, as `handleCommitNudges` is —
    // the meeting is modal, so nothing else spends while a test is open.
    const primarySphere = archetype.sphereAlignment.primary;
    const spend = spendNudgeEssence(gameState.essencePool, requests, primarySphere);
    emitTrace({
      tick: gameState.tick,
      category: 'meeting.essence_spent',
      testIndex,
      primarySphere,
      spent: spend.spent,
      ok: spend.ok,
      summary: spend.ok
        ? `meeting.essence_spent: test ${testIndex} charged ${spend.spent} (${primarySphere} first)`
        : `meeting.essence_spent: test ${testIndex} not charged — pool short`,
    });
    if (!spend.ok) return;
    setGameState(prev => ({ ...prev, ...withEssenceSpend(prev, spend.pool, 'spend_nudge') }));
  }, [gameState.essencePool, gameState.tick, setGameState, archetype.sphereAlignment.primary]);

  const handleMeetingComplete = useCallback((result: MeetingEncounterResult) => {
    // THR-1704: the bond mutates the graph in place and the clock comes back paused,
    // so it must touch the runtime itself or the Threads panel stays "No Threads".
    const agentId = bondFirstFromMeeting(gameState.graph, result, gameState.ascendantId, gameState.tick, runtime);
    // THR-1716 U2: "Let them walk." starts time — once, while the clock has never
    // run. It goes through the held state (the THR-1711 path), so the world runs
    // when the last interrupt closes. After the first run, resume-to-prior holds.
    if (releaseClockOnBond(clockEverRan, interruptHoldRef.current)) {
      noteClockRunSource('bond_release');
    }
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
            message: firstClaimedMessage(result.name),
            significance: 1.0,
            sphere: archetype.sphereAlignment.primary,
          },
        ],
      };
    });
  }, [gameState.graph, gameState.ascendantId, gameState.tick, setGameState, archetype.sphereAlignment.primary, runtime, clockEverRan, noteClockRunSource]);

  const handleMeetingClose = useCallback(() => {
    // The central interrupt auto-pause resumes the sim (if it auto-paused)
    // once all interrupt surfaces are closed.
    setMeetingState(null);
  }, []);

  // ── The Rite of the Thread (THR-1754) ──
  // The engine queued the rite when the thread was written; the surface gathers
  // the hand and `closeThreadingRite` lands it through the one writer, then
  // promotes the next queued rite. The rite writes the graph in place (poles,
  // reception, the First's mark), so it touches the runtime itself (THR-1704).
  //
  // The graph write runs here, never inside the state updater: React may run an
  // updater twice (StrictMode), and the writer must land a rite exactly once.
  const closedRiteKeyRef = useRef<string | null>(null);
  const closeRite = useCallback((close: RiteClose) => {
    const open = _gameStateRef.current.pendingThreadingRite;
    if (!open) return;
    // A second click before the state lands must not close the same rite twice.
    const key = `${open.agentId}_${open.tick}`;
    if (closedRiteKeyRef.current === key) return;
    closedRiteKeyRef.current = key;
    const closed = closeThreadingRite(_gameStateRef.current, close);
    if (!closed.result) return;
    touchStructure(runtime);
    setGameState(prev => ({
      ...prev,
      pendingThreadingRite: closed.pendingThreadingRite,
      pendingThreadingRiteQueue: closed.pendingThreadingRiteQueue,
      recentEvents: closed.event ? [...prev.recentEvents.slice(-99), closed.event] : prev.recentEvents,
    }));
  }, [setGameState, runtime]);
  const handleRiteComplete = useCallback((close: Extract<RiteClose, { kind: 'played' }>) => closeRite(close), [closeRite]);
  const handleRiteWithoutHand = useCallback(() => closeRite({ kind: 'no_hand', reason: 'dismissed' }), [closeRite]);

  // This session can open a rite, so the drain queues rites for it rather than
  // resolving them at once (a headless run never sets this).
  useEffect(() => {
    setGameState(prev => (prev.riteSurfaceMounted ? prev : { ...prev, riteSurfaceMounted: true }));
  }, [setGameState]);

  // Fail-soft: a mortal who died or vanished before the rite opened gets no rite —
  // the chronicle says the thread reached them too late (plan § Fail-soft).
  const pendingRite = gameState.pendingThreadingRite ?? null;
  useEffect(() => {
    if (pendingRite && isRiteAgentMissing(gameState.graph, pendingRite)) {
      closeRite({ kind: 'no_hand', reason: 'agent_missing' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRite, gameState.tick]);

  // ── Meet The First as action card slot ──
  const MEET_THE_FIRST_SLOT_ID = 'meet_the_first';

  const meetTheFirstAvailable = useMemo(() =>
    isMeetTheFirstAvailable(gameState.graph, gameState.ascendantId, gameState.tick),
  [gameState.graph, gameState.ascendantId, gameState.tick]);

  // THR-1978: the flow mounts only with an identity, so no surface offers the
  // card on a run without one (the dev-only Advanced World Setup path).
  const meetTheFirstOpenable = canOpenMeetTheFirst({
    meetTheFirstAvailable,
    hasAscendantIdentity: !!ascendantIdentity,
  });

  // ── Auto-trigger Meet The First right after "Reach Down" (THR-1605 S1) ──
  // The meeting comes to the player: it opens at the settlement nearest the
  // avatar (`pickMeetingLocation`) as soon as the spine opening beat resolves,
  // with no avatar movement and no wait on the world. The god senses the souls
  // from a height and the candidates are born at the meeting location, so the
  // avatar need not stand there — and the dilemmas' settlement prose stays true.
  // Before S1 this waited for the avatar to walk into a settlement, which a
  // first-time player starting at the Sacred Grove shrine never did (0 of 3
  // round-1 cold testers met a mortal).
  const openingBeatResolved = useMemo(() => {
    const beats = gameState.ascendantBeats;
    // No beat state (old save / fixture) → no opening beat to wait for.
    if (!beats) return true;
    return beats.history.some(r => r.beatId === OPENING_SPINE_BEAT_ID);
  // History is append-only, so its length is a sufficient change signal even if
  // a resolver ever mutated the beat state in place.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.ascendantBeats, gameState.ascendantBeats?.history.length]);

  useEffect(() => {
    if (gameState.meetTheFirstAutoTriggered) return;
    if (meetingState) return;
    if (!meetTheFirstAvailable) return;
    // `MeetTheFirstFlow` mounts only with an identity. Without one, spending the
    // one-shot flag would open a flow that never renders.
    if (!ascendantIdentity) return;
    if (!openingBeatResolved) return;

    const pick = pickMeetingLocation(gameState.graph, gameState.ascendantId);
    const fallbackId = avatarNodeId
      ? gameState.graph.getOutgoingEdges(avatarNodeId, 'located_at')[0]?.target
      : undefined;
    const locationId = pick?.locationId ?? fallbackId;
    if (!locationId) return;

    // All conditions met — auto-trigger once
    gameState.meetTheFirstAutoTriggered = true;
    gameState.meetingLocationId = locationId;
    emitTrace({
      tick: gameState.tick,
      category: 'meeting.location_picked',
      locationId,
      hexDistance: pick?.hexDistance ?? -1,
      cultured: pick?.cultured ?? false,
      fallback: !pick,
      summary: pick
        ? `meeting.location_picked: ${locationId} (${pick.hexDistance} hexes${pick.cultured ? ', cultured' : ''})`
        : `meeting.location_picked: ${locationId} (fallback — no settlement on the map)`,
    });
    handleStartMeeting(locationId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.tick, meetTheFirstAvailable, meetingState, gameState.meetTheFirstAutoTriggered, openingBeatResolved, ascendantIdentity]);

  // ── Attention mode toggle (TB-040) ──
  // THR-1715: changing attention mode is free (ATTENTION_MODE_CHANGE_COST = 0);
  // the old charge wrote `prev.essence`, a field GameState does not have, so it
  // never fired. The toggle mutates the graph in place, so the world is touched
  // and a render forced — otherwise the threadedNodes memo serves the old label.
  // A refusal comes back with its reason for the toggle's Law 47 feedback.
  const handleToggleAttentionMode = useCallback((threadEdgeId: string) => {
    const result = toggleAttentionMode(
      gameState.graph, threadEdgeId, gameState.ascendantId, gameState.tick,
    );
    if (!result.ok) return { ok: false as const, reason: result.reason };
    touchWorld(runtime);
    setGameState(prev => ({ ...prev }));
    return { ok: true as const };
  }, [gameState.graph, gameState.ascendantId, gameState.tick, setGameState, runtime]);

  // ── Warm start (THR-1744) ──
  // `?view=game&seeded&warm=<ticks>` advances the world behind WarmStartOverlay before
  // the player gets control. Nothing is decided for the player: held decisions wait,
  // The First runs on Lives on through the toggle's own path and is restored, and the
  // warm-up's undertaking moments are re-tiered to unacknowledged badges.
  const getFirstThreadEdge = useCallback(() => {
    const live = getLiveState();
    return live.graph.getEdgesByType('thread')
      .find(e => (e.properties as { courtPosition?: string }).courtPosition === 'the_first') ?? null;
  }, [getLiveState]);
  const warmOpenInterruptsRef = useRef<string[]>([]);
  const warmStart = useWarmStart({
    requested: warmTicks,
    ready: gameState.phase === 'playing',
    startTick: gameState.tick,
    // One tick per chunk, committed synchronously: `runTickBatch` commits only a batch's
    // final state, and `tickEvents` is reset every tick, so a multi-tick chunk would hide
    // the intermediate ticks' events from the notification layer (doom-stage popups,
    // arrival toasts). flushSync makes each tick's state render — and its effects run —
    // before the next tick, exactly as live play does.
    runChunk: n => {
      let result!: ReturnType<typeof runTicksSync>;
      flushSync(() => { result = runTicksSync(n, { markClock: false }); });
      return result;
    },
    getFirstMode: (): AttentionMode | null => {
      const edge = getFirstThreadEdge();
      return edge ? resolveAttentionMode(edge.properties as unknown as ThreadEdgeProperties) : null;
    },
    toggleFirstMode: () => {
      const edge = getFirstThreadEdge();
      if (edge) handleToggleAttentionMode(edge.id);
    },
    setSuppressedUntil: setInterruptSuppressedUntilTick,
    settleMoments: since => {
      const before = getLiveState().pendingUndertakingMoments ?? [];
      const after = settleUndertakingMomentsAsBadges(before, since);
      const settled = after.filter((r, i) => r !== before[i]).length;
      if (after !== before) {
        setGameState(prev => ({
          ...prev,
          pendingUndertakingMoments: settleUndertakingMomentsAsBadges(prev.pendingUndertakingMoments, since),
        }));
      }
      const pendingInterrupts = after.filter(r => r.presentation === 'interrupt' && !r.acknowledged).length;
      return { settled, pendingInterrupts };
    },
    // THR-1787: the no-choice opening gifts settle before the first warm tick. Seeding
    // mutates the graph in place, so the world is touched; flushSync commits the patch
    // so the first chunk's `runTicksSync` reads it from the live ref.
    settleOpening: ids => {
      const live = getLiveState();
      const result = settleOpeningSpineBeats(live, ids, live.tick);
      if (result.settled.length > 0) {
        touchWorld(runtime);
        flushSync(() => { setGameState(prev => ({ ...prev, ...result.patch })); });
      }
      return { settled: result.settled, failedBeatId: result.failedBeatId };
    },
    getOpenInterrupts: () => warmOpenInterruptsRef.current,
  });
  const warmFirstName = useMemo(() => {
    if (!warmStart.running) return null;
    const edge = getFirstThreadEdge();
    const node = edge ? gameState.graph.getNode(edge.target) : undefined;
    return (node?.properties as { name?: string } | undefined)?.name ?? node?.name ?? null;
  }, [warmStart.running, getFirstThreadEdge, gameState.graph]);

  // ── Journey vignette (auto-interrupt for The First) ──
  const activeVignette: PendingVignette | null = useMemo(() => {
    const pending = gameState.pendingVignettes;
    if (!pending || pending.length === 0) return null;
    // Highest priority first (already sorted by engine)
    return pending[0];
  }, [gameState.pendingVignettes]);

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

  // THR-1892 — the story beat's Stage view model, lit at its mortal's Location. The active
  // beat keeps no hex of its own: it either fired without being queued, or was shifted out
  // of `storyBeatQueue`, whose leftover copies carry the agent's hex from the tick they were
  // queued (or the 0,0 fallback). Reading the queue would light a stale place.
  const activeStoryBeatAgentId = useMemo(() => {
    if (!activeStoryBeatId) return null;
    return gameState.unifiedActions?.find(a => a.actionId === activeStoryBeatId)?.actorId ?? null;
  }, [activeStoryBeatId, gameState.unifiedActions]);
  const storyBeatStageVM: StageVM | null = activeStoryBeatId && activeStoryBeatTemplate
    ? readView(runtime, gameState, stageViewSelector, {
      kind: 'story-beat',
      hex: null,
      subjectAgentId: activeStoryBeatAgentId,
      hasArt: false,
      hasCast: false,
    }, tiles)
    : null;

  // THR-1895 — the encounter's Stage view model: lit at the encounter's own hex (its
  // header's, set by every adapter), else its mortal's Location. Full layout: the left
  // column always holds the cast and *At stake*.
  const encounterStageVM: StageVM | null = tieredEncounterState && encounterVeilModel
    ? readView(runtime, gameState, stageViewSelector, {
      kind: 'encounter',
      hex: typeof encounterVeilModel.header.hexCol === 'number' && typeof encounterVeilModel.header.hexRow === 'number'
        ? { col: encounterVeilModel.header.hexCol, row: encounterVeilModel.header.hexRow }
        : null,
      subjectAgentId: tieredEncounterState.agentId,
      phase: encounterVeilModel.aftermath ? 'aftermath' : tieredEncounterState.threadTier === 'watched' ? 'watched' : 'step',
      hasArt: Boolean(encounterVeilModel.illustration),
      hasCast: true,
    }, tiles)
    : null;

  // THR-1897 (S4) — the last four Stage moments' view models. A journey moment and an
  // undertaking moment are lit at their mortal's place; a premonition at its mortal's, with
  // its options' places ringed on hover; the emergence dilemma at its ruin, else its mortal.
  const vignetteStageVM: StageVM | null = activeVignette
    ? readView(runtime, gameState, stageViewSelector, {
      kind: 'journey-vignette',
      subjectAgentId: activeVignette.data.agentId,
      hasArt: false,
      hasCast: false,
    }, tiles)
    : null;
  const momentStageVM: StageVM | null = pendingMoment && momentCardModel
    ? readView(runtime, gameState, stageViewSelector, {
      kind: 'undertaking-moment',
      subjectAgentId: momentCardModel.actorExists ? momentCardModel.actorId : null,
      hasArt: false,
      hasCast: false,
    }, tiles)
    : null;
  const premonitionStageVM: StageVM | null = activePremonition
    ? readView(runtime, gameState, stageViewSelector, {
      kind: 'premonition',
      subjectAgentId: activePremonition.agentId,
      optionLocationIds: activePremonition.type === 'compulsion'
        ? (activePremonition.compulsionCandidates ?? []).map(c => c.locationId || null)
        : null,
      hasArt: false,
      hasCast: true,
    }, tiles)
    : null;
  const pendingEmergence = gameState.pendingEmergenceDecision;
  const emergenceStageVM: StageVM | null = pendingEmergence
    ? readView(runtime, gameState, stageViewSelector, {
      kind: 'emergence-dilemma',
      ruinId: pendingEmergence.ruinId,
      subjectAgentId: pendingEmergence.agentId,
      hasArt: false,
      hasCast: false,
    }, tiles)
    : null;
  const stageVMByKind: Partial<Record<StageHomedKind, StageVM | null>> = {
    'story-beat': storyBeatStageVM,
    encounter: encounterStageVM,
    'journey-vignette': vignetteStageVM,
    'undertaking-moment': momentStageVM,
    premonition: premonitionStageVM,
    'emergence-dilemma': emergenceStageVM,
  };

  const handleStoryBeatDismiss = useCallback(() => {
    setGameState(prev => {
      // THR-1822 § D15: the engine writes the dismissal and bumps worldVersion.
      if (!recordStoryBeatDismissed(prev.graph, runtime, prev.ascendantId, prev.tick)) return prev;
      return { ...prev, worldVersion: (prev.worldVersion ?? 0) + 1 };
    });
  }, [setGameState, runtime]);

  // ── Player-opened surfaces (THR-1809) ──
  // One list for the gift hold, the arrival hold (THR-1853) and the debug open-modals
  // list, so they cannot drift. Built before the registry, which reads it.
  const playerSurfacesOpen = openPlayerSurfaces({
    settingsPanelOpen,
    readThreadsOpen,
    agendaPickerOpen: agendaPickerOpen && !!pendingAgendas,
    inspectorFullOpen,
    doomDetailOpen,
    mandateDetailOpen: mandateDetailOpen && !!gameState.mandateDefinition && !!gameState.mandateState,
    harvestOpen: !!harvestResult,
    codexOpen,
    chapterLedgerOpen,
    scryOpen: scryVisible,
    rivalsOpen,
    notablesOpen,
  });
  const playerSurfacesKey = playerSurfacesOpen.join('|');

  // ── Arrivals wait their turn (THR-1853) ──
  // A surface the world pushes on screen mounts only when the player is not mid-click
  // and has none of their own surfaces open. The ledger and the court are registry
  // interrupts already, so they hold arrivals as interrupts, not as surfaces.
  // The card hand is exempt: it stays open through play (`arrivalHoldingSurfaces`).
  const arrivalSurfaceOpen = arrivalHoldingSurfaces(playerSurfacesOpen).length > 0;
  // THR-2053 — the encounter scan's surface hold (ledger and court included); a lift re-runs it.
  const encounterSurfaceHold = encounterHoldingSurfaces(playerSurfacesOpen).length > 0;
  encounterSurfaceHoldRef.current = encounterSurfaceHold;
  useEffect(() => {
    if (!encounterSurfaceHold && heldEncounterRef.current) setEncounterHoldRecheck(n => n + 1);
  }, [encounterSurfaceHold]);
  const msSinceInputNow = Date.now() - lastInputAtRef.current;
  const arrivalRecentInput = lastInputAtRef.current > 0 && msSinceInputNow < INTERRUPT_QUIET_AFTER_INPUT_MS;
  // What the registry rendered last commit: an arrival already on screen keeps its slot.
  const shownInterruptsRef = useRef<readonly string[]>([]);
  const [arrivalRecheck, setArrivalRecheck] = useState(0);
  // THR-1877 — the previous render's foreground: the surface on screen keeps it (D2, R2).
  const foregroundIncumbentRef = useRef<HomedSurfaceKind | null>(null);
  // THR-1877 — kinds set down through `HomedSurfaceFallback`'s Continue, until their flag clears.
  const [skippedHomedKinds, setSkippedHomedKinds] = useState<readonly HomedSurfaceKind[]>([]);

  // ── The Stellaris clock: interrupt registry + auto-pause (THR-668, THR-1608) ──
  // Every surface that stops the world is an entry in `INTERRUPT_SURFACES`
  // (interruptRegistry.ts); this snapshot is the raw state their render
  // conditions read. The auto-pause, `getOpenModals()` and
  // `getInterruptState()` all read the same resolution, so they cannot disagree.
  // Add a new interrupt surface to the registry, never to an expression here.
  //
  // `otherInterruptOpen` is every surface except the moment card, and is what
  // gates the card (THR-1299 slice 3): the card fills its slot only when this is
  // false and renders only while it stays false, so an encounter that opens in the
  // same tick wins the race and a card never co-renders with anything. The popup
  // channel yields to everything, the card included (one interrupt at a time).
  const interruptResolution = resolveInterrupts({
    interruptsSuppressed,
    encounterOpen: tieredEncounterState !== null,
    meetingPending: meetingState !== null,
    hasAscendantIdentity: !!ascendantIdentity,
    threadingRitePending: pendingRite !== null && !isRiteAgentMissing(gameState.graph, pendingRite),
    premonitionPending: activePremonition !== null,
    vignettePending: activeVignette !== null,
    storyBeatPending: !!activeStoryBeatId && !!activeStoryBeatTemplate,
    ascendantBeatEntered: !!pendingBeat && beatEntered,
    choiceSetPending: !!pendingChoice,
    emergenceDecisionPending: !!gameState.pendingEmergenceDecision,
    divineReceiptPending: activeReceipt !== null,
    momentPending: pendingMoment !== null,
    chapterLedgerOpen,
    courtOpen: scryVisible,
    popupQueued: currentPopup !== null,
    warmStartRunning: warmStart.running,
    playerSurfaceOpen: arrivalSurfaceOpen,
    recentInput: arrivalRecentInput,
    alreadyShown: shownInterruptsRef.current,
    cycleHarvestPending: harvestResult !== null,
    twilightPending: twilightBeats !== null,
    foregroundIncumbent: foregroundIncumbentRef.current,
    skippedKinds: skippedHomedKinds,
  });
  warmOpenInterruptsRef.current = interruptResolution.open;
  const interruptOpenKey = interruptResolution.open.join('|');
  useEffect(() => {
    shownInterruptsRef.current = interruptOpenKey ? interruptOpenKey.split('|') : [];
  }, [interruptOpenKey]);
  const interruptForeground = interruptResolution.foreground;
  useEffect(() => {
    foregroundIncumbentRef.current = interruptForeground;
  }, [interruptForeground]);
  // THR-1892 — `__DEBUG.getStage()` and `__DEBUG.openHomedSurface(kind)`.
  useStageDebugBridge({ gameScreen, hexMapRef, interruptResolution, stageVM: interruptResolution.stage ? stageVMByKind[interruptResolution.stage] ?? null : null, setGameState, runtime });
  // A set-down kind is forgotten once its own flag clears, so its next opening shows.
  const wishedHomedKey = interruptResolution.wished.join('|');
  useEffect(() => {
    setSkippedHomedKinds(prev => {
      if (prev.length === 0) return prev;
      const wished = new Set(wishedHomedKey ? wishedHomedKey.split('|') : []);
      const next = prev.filter(kind => wished.has(kind));
      return next.length === prev.length ? prev : next;
    });
  }, [wishedHomedKey]);
  const handleHomedSurfaceSkip = useCallback((kind: HomedSurfaceKind) => {
    // THR-1381 — the end of the age cannot be set down: its fallback's Continue leads to
    // the harvest, so a ceremony that cannot show never holds the run.
    if (kind === 'age-twilight') { completeTwilightNow('mount_failed'); return; }
    setSkippedHomedKinds(prev => (prev.includes(kind) ? prev : [...prev, kind]));
  }, [completeTwilightNow]);
  const handleHomedSurfaceFallback = useCallback((kind: HomedSurfaceKind) => {
    emitTrace({
      tick: gameState.tick,
      category: 'ui_stage',
      action: 'fallback',
      kind,
      summary: `ui_stage: fallback ${kind} — no host case renders it`,
    });
  }, [gameState.tick]);
  // `ui_stage` held — once per transition: a surface starts waiting behind another (D2, R6).
  const heldHomedKey = interruptResolution.held.map(h => `${h.kind}>${h.behind ?? ''}`).join('|');
  const tracedHeldRef = useRef<ReadonlySet<string>>(new Set());
  useEffect(() => {
    const now = new Set(heldHomedKey ? heldHomedKey.split('|') : []);
    for (const entry of now) {
      if (tracedHeldRef.current.has(entry)) continue;
      const [kind, behind] = entry.split('>') as [HomedSurfaceKind, string];
      emitTrace({
        tick: gameState.tick,
        category: 'ui_stage',
        action: 'held',
        kind,
        behind: (behind || null) as HomedSurfaceKind | null,
        summary: `ui_stage: held ${kind}${behind ? ` behind ${behind}` : ''}`,
      });
    }
    tracedHeldRef.current = now;
    // Only a change in what is held emits; the tick is read, not watched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldHomedKey]);
  // A held arrival whose only wait is the quiet window looks again when it ends; the
  // clock's own ticks re-render too, but a paused clock does not.
  const arrivalWaitsOnInput = interruptResolution.heldArrivals.some(h => h.heldBy.includes('recent_input'));
  useEffect(() => {
    if (!arrivalWaitsOnInput) return undefined;
    const wait = Math.max(0, INTERRUPT_QUIET_AFTER_INPUT_MS - (Date.now() - lastInputAtRef.current)) + 50;
    const timer = setTimeout(() => setArrivalRecheck(n => n + 1), wait);
    return () => clearTimeout(timer);
  }, [arrivalWaitsOnInput, arrivalRecheck]);
  const otherInterruptOpen = interruptResolution.otherThanMomentOpen;
  const anyInterruptShown = interruptResolution.open.length > 0;
  useEffect(() => {
    if (anyInterruptShown && inspectorFullOpen) setInspector(stepFullToDocked);
  }, [anyInterruptShown, inspectorFullOpen, setInspector]);

  const interruptAutoPause = useInterruptAutoPause({
    // THR-1911: the Inspector's Full view holds the clock while it is open (§ D2).
    interruptOpen: interruptResolution.anyOpen || inspectorFullOpen,
    running,
    setRunning,
  });
  useEffect(() => {
    interruptHoldRef.current = interruptAutoPause;
  }, [interruptAutoPause]);

  // ── A chapter answers on screen (THR-1812) ──
  // Declared after `useInterruptAutoPause` on purpose: effects run in
  // declaration order, so when the answer's veil opens the hold has already
  // recorded its return state, and this hook's `pauseIfHeld()` re-points it.
  const pushChapterAnswerToast = useCallback((message: string) => {
    handlePushToast({
      id: `chapter-answer-${Date.now()}`,
      message,
      count: 1,
      createdTick: gameState.tick,
      expiresAt: Date.now() + CHAPTER_ANSWER_TOAST_MS,
    });
  }, [handlePushToast, gameState.tick]);
  const setRunningPlain = useCallback((next: boolean) => setRunning(next), [setRunning]);
  const chapterAnswer = useChapterAnswerRun({
    unifiedActions: gameState.unifiedActions ?? EMPTY_UNIFIED_ACTIONS,
    encounterNotifications: gameState.encounterNotifications ?? EMPTY_ENCOUNTER_NOTIFICATIONS,
    tick: gameState.tick,
    running,
    veilOpen: Boolean(tieredEncounterState && encounterVeilModel),
    heldRunning: interruptAutoPause.heldRunning,
    hold: interruptAutoPause,
    setRunning: setRunningPlain,
    pushToast: pushChapterAnswerToast,
  });
  chapterAnswerRef.current = chapterAnswer;

  // ── First-run Play prompt (THR-1716 U3) ──
  // While the clock has never run and nothing holds it, the Play control asks for
  // it — after `FIRST_RUN_PROMPT_DELAY_MS`, so it never flashes under the arrival beat.
  const firstRunCandidate = !clockEverRan && !running && interruptAutoPause.heldRunning === null;
  const [firstRunPromptDue, setFirstRunPromptDue] = useState(false);
  useEffect(() => {
    if (!firstRunCandidate) {
      setFirstRunPromptDue(false);
      return;
    }
    const timer = setTimeout(() => setFirstRunPromptDue(true), FIRST_RUN_PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [firstRunCandidate]);
  const firstRunPrompt = firstRunCandidate && firstRunPromptDue;

  // THR-1837 U3 — the standing direction line. It hides while the THR-1716 Play
  // caption shows, so the two never stack.
  const openingDirection = openingReveal.reveal.direction;
  const openingFirstNode = openingDirection.firstId ? gameState.graph.getNode(openingDirection.firstId) : undefined;
  const openingDirectionLine = openingDirection.show && !firstRunPrompt ? (short: boolean) => (
    <OpeningDirectionLine
      short={short}
      mode={openingDirection.mode}
      firstName={openingFirstNode?.name}
      theirPossessive={getPronouns(openingFirstNode?.properties.gender as string | undefined).their}
      onOpenChapter={handleOpenFirstChapter}
    />
  ) : null;

  // ── Moment queue consumer (THR-1299 slice 3) ──
  // Pops the oldest unacknowledged interrupt-tier record into the slot when nothing
  // else is up. Deliberately NOT gated on `interruptsSuppressed`: `suppressBeats`
  // exists so a verification run can drive ticks past narrative beats, and a moment
  // card is one of the things such a run is there to observe. The opened-trace is
  // deduped by id because StrictMode runs effects twice in dev.
  const openedMomentTraceRef = useRef<string | null>(null);
  useEffect(() => {
    if (pendingMoment || otherInterruptOpen) return;
    const next = nextInterruptMoment(gameState.pendingUndertakingMoments);
    if (!next) return;
    if (openedMomentTraceRef.current !== next.id) {
      openedMomentTraceRef.current = next.id;
      markUndertakingMomentOpened(next, gameState.tick);
    }
    setPendingMoment(next);
  }, [pendingMoment, otherInterruptOpen, gameState.pendingUndertakingMoments, gameState.tick]);

  // The ledger and the court are registry interrupts *and* player surfaces: report them
  // once, as surfaces. The gift's own modal is not a hold on itself.
  const giftOtherInterrupts = interruptResolution.open.filter(
    id => id !== 'AscendantBeatModal' && !PLAYER_SURFACE_INTERRUPT_IDS.includes(id),
  );
  const giftOtherInterruptsKey = giftOtherInterrupts.join('|');
  // THR-1853 — a resume boundary: the interrupt in front of a held gift just closed.
  // Read in render on purpose: the gift effect below runs in the same commit.
  const prevGiftOtherKeyRef = useRef('');
  const giftBoundaryAtRef = useRef(0);
  if (prevGiftOtherKeyRef.current !== giftOtherInterruptsKey) {
    if (prevGiftOtherKeyRef.current && !giftOtherInterruptsKey) giftBoundaryAtRef.current = Date.now();
    prevGiftOtherKeyRef.current = giftOtherInterruptsKey;
  }

  // ── A ready opening gift waits for a quiet moment (THR-1809) ──
  // `resolveGiftDelivery` is the one rule; this effect and `__DEBUG.getGiftDelivery()`
  // both read it. A surface closing or an interrupt changing re-runs the effect through
  // React; a recent-input hold re-runs it once by timer.
  const computeGiftDelivery = useCallback((): GiftDelivery & { msSinceLastInput: number } => {
    const msSinceLastInput = Date.now() - lastInputAtRef.current;
    const delivery = resolveGiftDelivery({
      pendingBeatId: pendingBeat?.beatId ?? null,
      isSpine: !!pendingBeat && isSpineBeatId(pendingBeat.beatId),
      isArrivalBeat: !!pendingBeat && isGiftHoldExempt(pendingBeat.beatId),
      suppressed: interruptsSuppressed,
      journeyVignettePending,
      otherInterruptsOpen: giftOtherInterruptsKey ? giftOtherInterruptsKey.split('|') : [],
      playerSurfacesOpen: playerSurfacesKey ? playerSurfacesKey.split('|') : [],
      msSinceLastInput,
      atResumeBoundary: giftBoundaryAtRef.current > 0
        && Date.now() - giftBoundaryAtRef.current <= GIFT_RESUME_BOUNDARY_WINDOW_MS,
    });
    return { ...delivery, msSinceLastInput };
  }, [pendingBeat, interruptsSuppressed, journeyVignettePending, giftOtherInterruptsKey, playerSurfacesKey]);

  const [giftRecheck, setGiftRecheck] = useState(0);
  const giftHoldLogRef = useRef('');
  useEffect(() => {
    if (!pendingBeat || beatEntered) {
      giftHoldLogRef.current = '';
      return undefined;
    }
    const delivery = computeGiftDelivery();
    if (import.meta.env.DEV && delivery.heldBy.length > 0) {
      const key = `${delivery.heldBy.join(',')}:${delivery.heldBySurfaces.join(',')}`;
      if (giftHoldLogRef.current !== key) {
        giftHoldLogRef.current = key;
        console.debug('[gift-delivery] held', delivery.heldBy, delivery.heldBySurfaces);
      }
    }
    if (delivery.enter) {
      setBeatEntered(true);
      return undefined;
    }
    if (delivery.recheckInMs === null) return undefined;
    const timer = setTimeout(() => setGiftRecheck(n => n + 1), delivery.recheckInMs);
    return () => clearTimeout(timer);
  }, [pendingBeat, beatEntered, computeGiftDelivery, giftRecheck]);

  // THR-1809: the held pill rises above the player surface holding the gift, never above
  // an interrupt or a vignette (there it stays under the backdrop and cannot stack the gift).
  const giftPillRaised = !!pendingBeat && !beatEntered && (() => {
    const held = computeGiftDelivery().heldBy;
    return held.length > 0
      && held.every(r => r === 'player_surface' || r === 'recent_input' || r === 'awaiting_boundary');
  })();

  // ── Needs you (THR-1875, frame plan § F4–F5) ──
  // The top bar's queue of what waits on the god without stopping time. GameView owns its
  // sources (React-held) and passes them to the pure view model; nothing here is new state
  // except the list's open flag, the named pause and the dev fixture.
  const [needsYouOpen, setNeedsYouOpen] = useState(false);
  const [needsYouFixtureAlerts, setNeedsYouFixtureAlerts] = useState<AlertItem[]>([]);
  const [needsYouFixtureHeld, setNeedsYouFixtureHeld] = useState(false);
  const [frameFixture, setFrameFixture] = useState<TopBarFrameFixture | null>(null);
  const needsYouSources = useMemo((): NeedsYouSources => {
    const offerShown = !!pendingBeat && !beatEntered && !interruptsSuppressed;
    const words = offerShown && pendingBeat ? beatOfferWords(pendingBeat) : null;
    const receipts = (gameState.playerActionReceipts ?? [])
      .filter(r => r.presentation === 'toast' && !r.acknowledged)
      .map(r => ({ id: r.id, headline: r.toastMessage ?? r.overview, tick: r.resolvedTick }));
    const popupHead = notificationState.popupQueue[0];
    const held = interruptResolution.held.map(h => ({
      kind: h.kind,
      surfaceId: h.surfaceId,
      title: h.kind === 'event-popup' ? popupHead?.title ?? null : null,
    }));
    if (needsYouFixtureHeld && !held.some(h => h.kind === 'event-popup')) {
      held.push({ kind: 'event-popup', surfaceId: 'EventPopup', title: gameState.doomDefinition?.stages?.[0]?.name ?? null });
    }
    return {
      currentTick: gameState.tick,
      beatOffer: words && pendingBeat ? {
        kind: words.kind,
        beatId: pendingBeat.beatId,
        eyebrow: words.eyebrow,
        title: beatProseOverride?.title ?? null,
        tick: gameState.tick,
      } : null,
      receipts,
      namedPause,
      held,
      alerts: [...notificationState.alerts, ...needsYouFixtureAlerts],
    };
  }, [pendingBeat, beatEntered, interruptsSuppressed, gameState.playerActionReceipts, gameState.tick, gameState.doomDefinition,
    notificationState.popupQueue, notificationState.alerts, interruptResolution.held, beatProseOverride, namedPause,
    needsYouFixtureAlerts, needsYouFixtureHeld]);
  // THR-2099 — rows about a mortal carry their face; sources change every tick, so the memo refreshes with them.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the graph is mutated in place (never a dep)
  const needsYouVM = useMemo(() => withNeedsYouFaces(buildNeedsYou(needsYouSources), gameState.graph), [needsYouSources]);
  // Rows are read-only while a moment holds the clock — not while the player's own surface
  // (the Chapter Ledger, the court) does: the THR-1809 raised pill exists to open a gift over
  // those, so they must not guard its row (review gate, THR-1875).
  const needsYouGuarded = interruptResolution.open.some(id => !PLAYER_SURFACE_INTERRUPT_IDS.includes(id))
    || interruptResolution.heldArrivals.length > 0;
  const handlePressNeedsYouRow = useCallback((row: NeedsYouRowVM) => {
    switch (row.opens) {
      case 'beatOffer':
        // THR-1853: never enter a gift beside another blocking interrupt.
        if (giftOtherInterrupts.length === 0) setBeatEntered(true);
        return;
      case 'receipt':
        if (row.receiptId) setOpenedReceiptId(row.receiptId);
        return;
      case 'place':
        if (row.hex) hexMapRef.current?.focusOn(row.hex);
        setNamedPause(null);
        return;
      case 'subject':
        if (row.navigationTarget) handleNotificationNavigate(row.navigationTarget);
        for (const id of row.alertIds ?? []) handleDismissAlert(id);
        setNeedsYouFixtureAlerts(prev => prev.filter(a => !(row.alertIds ?? []).includes(a.id)));
        return;
      default:
        return;
    }
  }, [giftOtherInterrupts.length, hexMapRef, handleNotificationNavigate, handleDismissAlert]);
  // N answers only while the pill is on the bar (its reveal gate holds and something waits).
  needsYouKeyRef.current = () => {
    if (needsYouVM.total > 0 && document.querySelector('[data-testid="needs-you-pill"] button')) setNeedsYouOpen(o => !o);
  };
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__DEBUG?._registerTopBarBridge?.({
      pushNeedsYouFixture: (opts) => pushNeedsYouFixtureRef.current(opts),
      setFrameFixture: (fixture) => { setFrameFixture(fixture); return true; },
    });
  }, []);
  /** `__DEBUG.pushNeedsYouFixture` (dev): news on distinct ticks, a same-tick burst, a held popup. */
  const pushNeedsYouFixture = useCallback((opts: { news?: number; burst?: number; heldPopup?: boolean } = {}) => {
    const g = _gameStateRef.current;
    const tick = g.tick;
    const subject = needsYouFixtureSubject(g);
    const firstId = subject?.id;
    const name = subject?.name ?? 'A mortal';
    const nav = firstId ? { kind: 'agent' as const, agentId: firstId } : undefined;
    const stamp = Date.now();
    const out: AlertItem[] = [];
    for (let i = 0; i < Math.max(0, opts.news ?? 0); i++) {
      out.push({ id: `fixture_news_${stamp}_${i}`, icon: 'discovery', message: `${name} hears of a new road (${i + 1}).`, sourceEventId: `fixture_news_${stamp}_${i}`, tick: tick - i, ...(nav ? { navigationTarget: nav } : {}) });
    }
    for (let i = 0; i < Math.max(0, opts.burst ?? 0); i++) {
      out.push({ id: `fixture_burst_${stamp}_${i}`, icon: 'faction', message: `${name}'s standing shifts (${i + 1}).`, sourceEventId: `fixture_burst_${stamp}_${i}`, tick, ...(nav ? { navigationTarget: nav } : {}) });
    }
    if (out.length) setNeedsYouFixtureAlerts(prev => [...prev, ...out]);
    if (opts.heldPopup !== undefined) setNeedsYouFixtureHeld(opts.heldPopup);
    return { pushed: out.length };
  }, []);
  const pushNeedsYouFixtureRef = useRef(pushNeedsYouFixture);
  pushNeedsYouFixtureRef.current = pushNeedsYouFixture;

  const getDebugGiftDelivery = useCallback(() => {
    const d = computeGiftDelivery();
    const entered = !!pendingBeat && beatEntered;
    return {
      pendingBeatId: pendingBeat?.beatId ?? null,
      entered,
      heldBy: entered ? [] : d.heldBy,
      heldBySurfaces: entered ? [] : d.heldBySurfaces,
      msSinceLastInput: d.msSinceLastInput,
    };
  }, [computeGiftDelivery, pendingBeat, beatEntered]);

  const getDebugOpenModals = useCallback((): string[] => {
    const openModals: string[] = [];

    if (debugPanelOpen) openModals.push('DebugPanel');
    // Player-opened surfaces (THR-1809 shared helper); the two that are also registry
    // interrupts come from the registry below, so they are listed once.
    const surfaces = playerSurfacesKey ? playerSurfacesKey.split('|') : [];
    openModals.push(...surfaces.filter(id => !PLAYER_SURFACE_INTERRUPT_IDS.includes(id)));
    // Every interrupt comes from the registry (THR-1608) — the same resolution
    // the auto-pause reads, so the debug surface and the pause cannot disagree.
    openModals.push(...interruptResolution.open);
    // The offer banner is not an interrupt: it does not stop the world.
    if (pendingBeat && !beatEntered && !interruptsSuppressed) openModals.push('AscendantBeatOfferBanner');

    return openModals;
  }, [
    debugPanelOpen,
    playerSurfacesKey,
    interruptResolution,
    interruptsSuppressed,
    pendingBeat,
    beatEntered,
  ]);

  /** `__DEBUG.getInterruptState()` (THR-1608 S3) — what stops the clock, and what it returns to. */
  const getDebugInterruptState = useCallback(() => ({
    open: interruptResolution.open,
    wasRunningBeforeInterrupt: interruptAutoPause.getWasRunningBeforeInterrupt(),
    // Popups waiting their turn: the whole queue while one is held back, the
    // rest behind the head while it shows.
    queuedPopups: Math.max(0, notificationState.popupQueue.length - (interruptResolution.popupMayRender ? 1 : 0)),
    running,
    // THR-1853: arrivals waiting their turn, and why.
    heldArrivals: interruptResolution.heldArrivals,
    // THR-2053: a chapter the world would open, waiting on the player.
    heldEncounter: heldEncounterRef.current,
    // THR-1877: what renders, the one foreground, and what waits behind it.
    rendering: interruptResolution.rendering,
    foreground: interruptResolution.foreground,
    stage: interruptResolution.stage,
    held: interruptResolution.held,
    homedSurfaces: DEBUG_HOMED_SURFACES,
  }), [interruptResolution, interruptAutoPause, notificationState.popupQueue.length, running]);

  // ── Who holds the clock (THR-1814) ──
  // Every held state names its holder, not only an encounter veil (Law 52): the
  // veil's title first, else the open interrupt's holder name, else the fallback.
  const clockHeldNow = interruptAutoPause.heldRunning !== null;
  const clockHolderIds = [...interruptResolution.open, ...interruptResolution.heldArrivals.map(h => h.id)];
  const clockHolder = clockHeldNow && clockHolderIds.length === 0 && inspectorFullOpen
    ? INSPECTOR_WORDS.fullHolder
    : clockHeldNow
    ? resolveClockHolder(
        // THR-1853: a held arrival holds the clock too, so the readout names it.
        [...interruptResolution.open, ...interruptResolution.heldArrivals.map(h => h.id)],
        tieredEncounterState && encounterVeilModel ? encounterVeilModel.header.title : null,
      )
    : null;
  /** `__DEBUG.getClockHold()` (THR-1814) — the same values the TIME readout renders. */
  const getDebugClockHold = useCallback(() => ({
    held: clockHeldNow,
    holder: clockHolder,
    runsOnAfter: clockHeldNow ? interruptAutoPause.heldRunning : null,
  }), [clockHeldNow, clockHolder, interruptAutoPause.heldRunning]);

  const getDebugActiveUIState = useCallback(() => {
    const urlView = new URLSearchParams(window.location.search).get('view') ?? 'game';
    const openModals = getDebugOpenModals();
    const selectedFactionId = selectedThreadNode?.category === 'faction'
      ? selectedThreadNode.nodeId
      : null;

    return {
      view: urlView,
      selectedAgentId: selectedAgentId ?? null,
      selectedLocationId: selectedThreadNode?.category === 'location' ? selectedThreadNode.nodeId : null,
      selectedFactionId,
      selectedHex: selectedHexCoord ?? selectedHex ?? null,
      openModals,
      // THR-1911: both ActionDrawer mounts are retired; the Act row in the Inspector casts.
      actionDrawerOpen: false,
      scryActive: scryVisible,
      cameraFocusHex: cameraCenter ?? null,
      simRunning: running,
    };
  }, [
    cameraCenter,
    getDebugOpenModals,
    running,
    scryVisible,
    selectedAgentId,
    selectedHex,
    selectedHexCoord,
    selectedThreadNode,
  ]);

  // ── Incident snapshot (THR-1134) ──
  // `getDebugActiveUIState` is composed outside the `import.meta.env.DEV` guard
  // above — only the *bridge registration* is dev-gated — so the same record the
  // debug bridge serves is the one the production bundle carries. That is
  // deliberate: the snapshot's whole point is working where `window.__DEBUG` does
  // not exist, and a second composer would drift from this one.
  const incidentCapture = useIncidentCapture({
    gameState,
    runtime,
    mapSize,
    mapCols: COLS,
    mapRows: ROWS,
    getActiveUIState: getDebugActiveUIState,
    onPushToast: handlePushToast,
  });

  /**
   * The crash prompt (THR-1134) — discoverability without a shortcut to memorise.
   *
   * When `tickHealthMonitor` catches something the player would otherwise never
   * see, one toast points at the door. Debounced by tick rather than by wall
   * clock so a crashing tick loop produces one prompt instead of one per tick,
   * and it is a toast, never a modal — it must not block the veil, a beat or a
   * receipt.
   */
  const lastCrashPromptTickRef = useRef(-Infinity);
  const lastCrashCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (!INCIDENT_PROMPT_ON_CRASH) return;
    const count = getCrashLog().length;
    // First observation seeds the baseline: a crash that predates this mount is
    // history, not news, and must not fire a prompt on load.
    if (lastCrashCountRef.current === null) {
      lastCrashCountRef.current = count;
      return;
    }
    if (count <= lastCrashCountRef.current) return;
    lastCrashCountRef.current = count;
    if (gameState.tick - lastCrashPromptTickRef.current < INCIDENT_PROMPT_COOLDOWN_TICKS) return;
    lastCrashPromptTickRef.current = gameState.tick;
    handlePushToast({
      id: `incident-crash-${gameState.tick}`,
      message: 'Something went wrong under the hood. You can save a snapshot from Settings.',
      count: 1,
      createdTick: gameState.tick,
      expiresAt: Date.now() + 10000,
      onClick: () => setSettingsPanelOpen(true),
    });
  }, [gameState.tick, handlePushToast]);

  /**
   * THR-935: a revealed-notice snapshot belongs to the surface the badge opened.
   * Once the selection moves elsewhere — or the panel closes — it is news held
   * past its welcome, so drop it rather than let it resurface on a later visit to
   * the same row. The render also gates on the anchor id, so nothing flashes.
   */
  useEffect(() => {
    if (!revealedNotices) return;
    if (selectedThreadNode?.nodeId !== revealedNotices.anchorId) setRevealedNotices(null);
  }, [selectedThreadNode, revealedNotices]);

  // Close detail panel on Escape key — only when no overlay sits above it
  // (THR-1816: the escape layer ranks below every modal and the veil).
  const closeDetailPanels = useCallback(() => {
    handleThreadDetailClose();
    handleHexDetailClose();
  }, [handleThreadDetailClose, handleHexDetailClose]);
  useEscapeLayer(!!selectedThreadNode || !!selectedHexCoord, closeDetailPanels, ESCAPE_LAYER_Z_PANEL);

  const handleJourneyChoice = useCallback((choiceId: string) => {
    if (!activeVignette) return;
    const vignetteData = activeVignette.data;

    // Find the thread edge for this agent
    const threads = getThreadsFrom(gameState.graph, gameState.ascendantId);
    const threadEdge = threads.find(e => e.target === vignetteData.agentId);
    if (!threadEdge) return;

    // THR-1854 — a journey choice's essence cost is charged, all-or-nothing, against
    // the pool every encounter choice bills (THR-1720). The modal disables a choice the
    // pool cannot cover; this re-check covers a pool that moved since it rendered.
    const choice = vignetteData.choices.find(c => c.id === choiceId);
    const essenceCost = choice?.effects.essenceCost ?? 0;
    const payingSphere = archetype.sphereAlignment.primary;
    if (essenceCost > 0 && !spendAuthoredChoiceEssence(gameState.essencePool, essenceCost, payingSphere).ok) {
      handlePushToast({
        id: `journey-reject-${activeVignette.id}-${gameState.tick}`,
        message: `Not enough ${sphereWord(payingSphere)} essence for that.`,
        count: 1,
        createdTick: gameState.tick,
        expiresAt: Date.now() + NUDGE_REJECT_TOAST_MS,
        sphere: payingSphere,
      });
      return;
    }

    // THR-1822 § D15: the engine records the beat on the thread edge, applies what the
    // choice does to the First herself (THR-1854), and bumps worldVersion.
    recordJourneyChoice(gameState.graph, runtime, gameState.ascendantId, vignetteData, choiceId, gameState.tick);

    // Remove this vignette from the queue, paying its cost in the same update
    setGameState(prev => {
      const spend = essenceCost > 0
        ? spendAuthoredChoiceEssence(prev.essencePool, essenceCost, payingSphere)
        : null;
      return {
        ...prev,
        ...(spend?.ok ? withEssenceSpend(prev, spend.pool, 'spend_nudge') : {}),
        pendingVignettes: (prev.pendingVignettes ?? []).filter(v => v.id !== activeVignette.id),
      };
    });
  }, [activeVignette, gameState.graph, gameState.ascendantId, gameState.essencePool, gameState.tick, archetype.sphereAlignment.primary, handlePushToast, runtime, setGameState]);

  // ── Debug levers (THR-1881) ──
  // Every `window.__DEBUG` registration and the `?spawn` / `?undertaking` / `?spell` /
  // `?testavatar` URL levers live in `useGameDebugLevers`. Called last so every value
  // it reads is already defined; each lever keeps the deps it had inline.
  useGameDebugLevers({
    gameState, setGameState, runtime, tiles, hexMapRef,
    handleAgentSelect, openAgentProfileForId: openAgentSheetForId, fogDisabled, setFogDisabled, _gameStateRef,
    viewSource, avatarNodeId, threadedAgentIdsForActivity, activityActionsVersion,
    needsYouSources, needsYouStamp: needsYouStamp(needsYouSources),
    dominionLensBase, dominionLensOn, dominionProjectionNow, dominionDrops, setDominionLens,
    activeLens, lensSuppressed, hexLensVM, setMapLens, setLensSuppressed: gameScreen.setLensSuppressed,
    omniscienceMode, setOmniscienceMode, setTieredEncounterState, runTicksSync, setBeatEntered,
    applyAftermathReactionForAgent, refRouter,
    getDebugOpenModals, getDebugActiveUIState, getDebugInterruptState, getDebugGiftDelivery,
    getDebugClockHold, arrivalBeatOffered, clockEverRan, openingReveal, chapterAnswer,
    pendingBeat, beatEntered, interruptsSuppressed, activeVignette, handleJourneyChoice,
    activeStoryBeatId, activeStoryBeatTemplate, handleStoryBeatDismiss,
    activePremonition, handlePremonitionDismiss, handleResolveBeat,
  });

  // ── The Inspector in the game (THR-1911) ──
  // What only GameView holds, for the person page (S2a's input note on THR-1911): the
  // notices a badge click revealed, and the realm projection for the allegiance row.
  const inspectorExtras = useMemo(() => ({ revealedNotices, realmProjection }), [revealedNotices, realmProjection]);
  const { playCastSound: playInspectorCastSound } = useInterventionAudio();
  // The one cast path (plan § D9): the Act row's second beat lands here.
  const castOnTarget = useCastOnTarget({
    gameState,
    setGameState,
    runtime,
    primarySphere: archetype.sphereAlignment.primary,
    pushToast: handlePushToast,
    particleBurst: (col, row, color) => hexMapRef.current?.spawnParticleBurst(col, row, color),
    playCastSound: playInspectorCastSound,
    beginIntervention,
    openScry: handleOpenScry,
    startMeeting: handleStartMeeting,
  });
  // THR-1914 (plan § D9 way 3) — card-first from the hand: arm, light, choose, cast.
  const arming = useCardArming({
    gameState,
    runtime,
    castOnTarget,
    pushToast: handlePushToast,
    openInspector,
    fogOff: fogDisabled,
    screenStore: gameScreen,
  });
  useArmedDebugBridge(arming, gameState, lensSuppressed);

  // ── Find (THR-1915, Inspector plan § D11) ──
  // A world result flies the camera there and opens through the router (never around it);
  // the router's card arm reaches the Inspector at the row's `opensAt` (factions wide) and
  // replaces a pinned subject, because a search is a deliberate ask (§ D3).
  // Recent is kept apart from the Inspector's history: closing the Inspector resets that.
  const [findRecentKeys, setFindRecentKeys] = useState<string[]>([]);
  const currentInspectorKey = currentEntry(inspectorState)?.key ?? null;
  useEffect(() => {
    if (currentInspectorKey) setFindRecentKeys(prev => rememberFindRecent(prev, currentInspectorKey));
  }, [currentInspectorKey]);
  const findFlyTo = useCallback((hexKey: string | null) => {
    const hex = hexKey ? parseHexRefId(hexKey) : undefined;
    if (hex) hexMapRef.current?.focusOn(hex);
  }, [hexMapRef]);
  const findOpenWorld = useCallback((ref: WorldRef, hexKey: string | null) => {
    findFlyTo(hexKey);
    refRouter.open(ref, 'card', { via: 'find' });
  }, [findFlyTo, refRouter]);
  const findArmCard = arming.armFromFind;
  const findSlot = (
    <FindBox
      gameState={gameState}
      runtime={runtime}
      fogOff={fogDisabled}
      recentKeys={findRecentKeys}
      codex={codexFindSeeds}
      onPickWorld={findOpenWorld}
      onArmCard={findArmCard}
      onOpenCodex={openCodexSheet}
      onShowOnMap={findFlyTo}
      disabled={Boolean(tieredEncounterState && encounterVeilModel) || stageOpen}
    />
  );
  const armedNow = arming.armed !== null;
  const armedChooseHex = arming.chooseHex;
  const armedChoose = arming.choose;
  // While a card is armed a map click chooses a target instead of opening a page (§ D3).
  const handleMapHexClick = useCallback((coord: import('../../types').HexCoord) => {
    if (armedNow && !moveMode) armedChooseHex(coord, 'map');
    else handleHexClickFull(coord);
  }, [armedNow, moveMode, armedChooseHex, handleHexClickFull]);
  const handleMapNodeClick = useCallback((nodeId: string, category: import('../../engine/retinue').ThreadCategory) => {
    if (armedNow) {
      const ref = refForMapNode(gameState, nodeId);
      if (ref) { armedChoose(ref, 'map'); return; }
    }
    handleMapNodeSelect(nodeId, category);
  }, [armedNow, gameState, armedChoose, handleMapNodeSelect]);
  const handleMapPlaceLabelClick = useCallback((locationId: string) => {
    if (armedNow) armedChoose({ kind: placeRefKind(gameState, locationId), id: locationId }, 'map');
    else handlePlaceLabelClick(locationId);
  }, [armedNow, gameState, armedChoose, handlePlaceLabelClick]);
  // A hand card dropped on the map chooses what is under it (never casts).
  const handleMapDragOver = useCallback((e: DragEvent) => {
    if (armedNow && isCardDrag(e)) e.preventDefault();
  }, [armedNow]);
  const handleMapDrop = useCallback((e: DragEvent) => {
    if (!armedNow || !isCardDrag(e)) return;
    e.preventDefault();
    const hex = hexMapRef.current?.getHexAtViewport(e.clientX, e.clientY);
    if (hex) armedChooseHex(hex, 'drag');
  }, [armedNow, armedChooseHex]);
  const inspectorReportRef = useRef<(InspectorPageReport & { subjectKey: string; pageKind: string }) | null>(null);
  const handleInspectorReport = useCallback((r: InspectorPageReport & { subjectKey: string; pageKind: string }) => {
    inspectorReportRef.current = r;
  }, []);
  // `__DEBUG.getInspectorState()` / `openInInspector()` (dev only).
  const inspectorStateRef = useRef(inspectorState);
  inspectorStateRef.current = inspectorState;
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerInspectorBridge({
      getState: () => {
        const st = inspectorStateRef.current;
        const entry = currentEntry(st);
        const r = inspectorReportRef.current && entry && inspectorReportRef.current.subjectKey === entry.key ? inspectorReportRef.current : null;
        const actCards = Array.from(document.querySelectorAll<HTMLElement>('[data-inspector-host] [data-inspector-act] [data-act-card]'))
          .filter(el => !el.closest('[data-row-tray]'))
          .map(el => el.dataset.actCard ?? '');
        // THR-1913 — the open row tray and the card armed in it, as the page shows them.
        const trayEl = document.querySelector<HTMLElement>('[data-inspector-host] [data-row-tray]');
        const trayArmedEl = trayEl?.querySelector<HTMLElement>('[data-act-card][data-armed="true"]');
        const rowCounts = Array.from(document.querySelectorAll<HTMLElement>('[data-inspector-host] [data-row-cards]'))
          .map(el => ({ row: el.dataset.rowCards ?? '', count: Number(el.querySelector<HTMLElement>('[data-count]')?.dataset.count ?? 0) }));
        return {
          open: isInspectorOpen(st),
          size: st.size,
          pinned: st.pinned,
          subjectKey: entry?.key ?? null,
          pageKind: r?.pageKind ?? null,
          name: entry?.name || null,
          history: st.history.map(h => h.key),
          index: st.index,
          sectionsShown: r?.sectionsShown ?? [],
          foldedGroups: r?.foldedGroups ?? [],
          hiddenForWidth: r?.hiddenForWidth ?? [],
          dressing: r?.dressing ?? null,
          actCards,
          rowCounts,
          trayOpen: trayEl?.dataset.rowTray ?? null,
          trayArmed: trayEl && trayArmedEl ? { actionId: trayArmedEl.dataset.actCard ?? '', target: trayEl.dataset.rowTray ?? '' } : null,
        };
      },
      open: (kind, id, mode = 'card') => {
        if (!(kind in SURFACE_BY_WORLD_REF)) return false;
        refRouter.open({ kind: kind as WorldRefKind, id }, mode, { via: 'debug' });
        return true;
      },
    });
    return () => window.__DEBUG?._registerInspectorBridge(null);
  }, [refRouter]);

  return (
    <GameErrorBoundary>
      <ViewSourceContext.Provider value={viewSource}>
      <RefRouterProvider router={refRouter}>
      <DetailPageOpenerProvider value={openDetailNodeRef}>
      <GameScreenStateProvider value={gameScreen}>
      <div className="h-screen flex flex-col overflow-hidden relative grain" style={{ backgroundColor: 'var(--bg-abyss)' }}>
      {/* ═══ Top bar — extracted to GameViewTopBar (THR-579) ═══ */}
      <GameViewTopBar
        gameState={gameState}
        seasonName={seasonName}
        year={year}
        // THR-1711: while an interrupt holds the clock, show the state it returns
        // to — that is what the button now toggles — and label it as held.
        running={interruptAutoPause.heldRunning ?? running}
        clockHeld={clockHeldNow}
        // THR-1724 / THR-1814 — Law 52 (amended): the time control names whatever
        // holds the clock (the encounter's title, or the interrupt's holder name).
        clockHeldBy={clockHolder ?? undefined}
        // THR-1812 — the TIME readout names a chapter answer the clock is turning
        // toward, or one waiting on a paused clock.
        clockAnswerStatus={chapterAnswer.answerStatus}
        // THR-1892 — the guard covers every Stage moment, not only the encounter (plan § D7).
        encounterOpen={Boolean(tieredEncounterState && encounterVeilModel) || stageOpen}
        firstRunPrompt={firstRunPrompt}
        speed={speed}
        handleToggleRunning={handlePlayControlToggle}
        doTick={doTick}
        setSpeed={setSpeed}
        doomJourneyLabel={doomJourneyLabel}
        setDoomDetailOpen={setDoomDetailOpen}
        readThreadsOpen={readThreadsOpen}
        setReadThreadsOpen={setReadThreadsOpen}
        settingsPanelOpen={settingsPanelOpen}
        setSettingsPanelOpen={setSettingsPanelOpen}
        fogDisabled={fogDisabled}
        setFogDisabled={setFogDisabled}
        debugPanelOpen={debugPanelOpen}
        handleToggleDebug={handleToggleDebug}
        showOrganicShore={showOrganicShore}
        setShowOrganicShore={setShowOrganicShore}
        notificationPrefs={notificationPrefs}
        toggleNotifCategory={toggleNotifCategory}
        setNotifMode={setNotifMode}
        resetNotifPrefs={resetNotifPrefs}
        musicVolume={musicVolume}
        handleMusicVolume={handleMusicVolume}
        bgVolume={bgVolume}
        handleBgVolume={handleBgVolume}
        uiVolume={uiVolume}
        handleUiVolume={handleUiVolume}
        audioMuted={audioMuted}
        handleToggleAudioMute={handleToggleAudioMute}
        recordingTrouble={incidentCapture.recording}
        handleToggleRecordTrouble={incidentCapture.toggleRecording}
        includeWorldInSnapshot={incidentCapture.includeWorld}
        handleToggleIncludeWorld={incidentCapture.toggleIncludeWorld}
        handleSaveSnapshot={incidentCapture.captureSnapshot}
        {...(onExitToTitle ? { onExitToTitle } : {})}
        reveal={firstScreenReveal}
        opening={openingReveal}
        showEveryPanel={openingReveal.showAll}
        onToggleShowEveryPanel={() => openingReveal.setShowAll(!openingReveal.showAll)}
        directionLine={openingDirectionLine}
        onRivalsOpenChange={setRivalsOpen}
        onNotablesOpenChange={setNotablesOpen}
        needsYou={needsYouVM}
        needsYouOpen={needsYouOpen}
        setNeedsYouOpen={setNeedsYouOpen}
        needsYouRaised={giftPillRaised}
        needsYouGuarded={needsYouGuarded}
        onPressNeedsYouRow={handlePressNeedsYouRow}
        namedPause={namedPause?.line}
        alertsTrimmedAtCap={notificationState.alertsTrimmedAtCap ?? 0}
        frameFixture={frameFixture}
        findSlot={findSlot}
      />

      {/* ═══ Main content area ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left rail: the God rail, the Ascendant Bar (THR-184; THR-1881 step e) ──
            THR-1914: the hand's press arms a card (replaces the Codex default). */}
        <ArmedCardProvider value={arming}>
        <HandPressProvider value={arming.handPress}>
        <GodRail
          gameState={gameState}
          setGameState={setGameState}
          archetype={archetype}
          ascendantIdentity={ascendantIdentity ?? null}
          avatarName={avatarName}
          worldVersion={runtime.worldVersion}
          setAscendantSheetOpen={setAscendantSheetOpen}
          openCodex={openCodex}
          setAttachmentSheetId={setAttachmentSheetId}
          showMandate={firstScreenReveal.mandate}
          opening={openingReveal}
          handleCenterOnHex={handleCenterOnHex}
          handleAvatarMoveClick={handleAvatarMoveClick}
          handleScryWithMutex={handleScryWithMutex}
          openCodexEntry={openCodexSheet}
          // THR-1894: the hand rests while a moment is on screen (not while one only waits its turn); an encounter deals its own hand.
          handRest={interruptResolution.open.length > 0 ? (interruptResolution.open.includes('EncounterVeil') ? 'encounter' : 'moment') : null}
        />
        </HandPressProvider>

        {/* ── Center: the map, and the Inspector beside it (THR-1911, plan § D1).
            The wrap is the map region right of the god rail: Full covers exactly it. ── */}
        <div className="flex-1 flex overflow-hidden relative" data-map-region="">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative" onDragOver={handleMapDragOver} onDrop={handleMapDrop}>
            {/* THR-1914 — with the Inspector closed, the armed card's banner sits over the map. */}
            {!inspectorIsOpen && <ArmedBanner floating />}
            {/* Toast notifications */}
            <ToastStack
              toasts={[...notificationState.toasts, ...actionToasts]}
              onDismiss={handleDismissToast}
              onSelectAgent={handleAgentSelect}
              onNavigate={handleNotificationNavigate}
              // THR-1877 (D7): a receipt waits while a ceremony or Stage moment holds the screen.
              receiptOpenLocked={interruptResolution.foreground !== null}
            />
            {/* The world map: HexMapV2, lens switch, summary bar, map-anchored dialogs (THR-1881 step d) */}
            <GameMap
              gameState={gameState}
              setGameState={setGameState}
              runtime={runtime}
              hexMapRef={hexMapRef}
              tiles={tiles}
              COLS={COLS}
              ROWS={ROWS}
              hoveredHex={hoveredHex}
              selectedHexCoord={selectedHexCoord}
              selectedHex={selectedHex}
              riverPaths={riverPaths}
              lakeIds={lakeIds}
              areaProjection={areaProjection}
              realmProjection={realmProjection}
              realmHolderIndex={realmHolderIndex}
              locationNodes={locationNodes}
              anomalyNodes={anomalyNodes}
              roadPaths={roadPaths}
              agentRenderDataWithActivity={agentRenderDataWithActivity}
              armyRenderData={armyRenderData}
              reachSignatureMarkers={reachSignatureMarkers}
              battleRenderData={battleRenderData}
              threadLineData={threadLineData}
              companyRenderData={companyRenderData}
              activityIconData={activityIconData}
              attentionRatio={attentionRatio}
              fogDisabled={fogDisabled}
              effectiveVisibilityMap={effectiveVisibilityMap}
              showOrganicShore={showOrganicShore}
              scryVisible={scryVisible}
              harvestResult={harvestResult}
              sphereColor={sphereColor}
              avatarTargetHex={avatarTargetHex}
              setCameraCenter={setCameraCenter}
              handleHexClickFull={handleMapHexClick}
              setHoveredHex={setHoveredHex}
              // THR-1911 (§ D10): agents and armies open themselves; a pinned Inspector stays.
              handleThreadNodeSelect={handleMapNodeClick}
              handleOpenProfileModal={handleMapNodeClick}
              onPlaceLabelClick={handleMapPlaceLabelClick}
              hexStrategicOverlays={hexStrategicOverlays}
              locationActivityByHex={locationActivityByHex}
              spotlightThreadColor={spotlightThreadColor}
              cameraGateCallback={cameraGateCallback}
              dominionLensForMap={dominionLensForMap}
              dominionTooltip={dominionTooltip}
              activeLens={activeLens}
              lensSuppressed={lensSuppressed}
              hexLens={hexLensVM}
              // Under the Stage the map is the moment's backdrop: no armed lighting on top of it.
              armedHighlight={stageOpen ? null : (arming.vm?.map ?? null)}
              setMapLensFromBar={setMapLensFromBar}
              shownLenses={shownLenses}
              dominionBandColors={dominionBandColors}
              agendaPickerOpen={agendaPickerOpen}
              pendingAgendas={pendingAgendas}
              wheelSlots={wheelSlots}
              pendingIntervention={pendingIntervention}
              handleAgendaSelect={handleAgendaSelect}
              handleAgendaCancel={handleAgendaCancel}
              selectedAgenda={selectedAgenda}
              handleInterventionConfirm={handleInterventionConfirm}
              handleInterventionCancel={handleInterventionCancel}
              pendingChoice={pendingChoice}
              setPendingChoice={setPendingChoice}
            />

          </div>

        </div>

        {/* THR-1911: the Inspector — every link, card and map click opens here. Both
            ActionDrawer mounts are gone: the page's Act row casts (plan § D9 way 1). */}
        <InspectorHost
          gameState={gameState}
          runtime={runtime}
          extras={inspectorExtras}
          onCast={castOnTarget}
          onShowOnMap={(hex) => hexMapRef.current?.focusOn(hex)}
          onReport={handleInspectorReport}
          meetTheFirst={meetTheFirstOpenable ? { actionId: MEET_THE_FIRST_SLOT_ID, sphere: archetype.sphereAlignment.primary } : null}
        />
        </div>

        </ArmedCardProvider>

        {/* ── Right panel: Debug Panel OR sidebar ── */}
        {debugPanelOpen ? (
            <DebugPanel
              currentTick={gameState.tick}
              accountRecord={concludedRun?.account ?? baseAccount}
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
            holdStandings={runtime?.holdStandings}
            omenState={gameState.omenState}
            doomIdentityMatrix={gameState.doomIdentityMatrix}
            hiddenMarks={gameState.hiddenMarks}
            pendingEncounterSeeds={gameState.pendingEncounterSeeds}
            regionalDetectionPressure={gameState.regionalDetectionPressure}
            archetypeDrift={gameState.archetypeDrift}
            activeDelves={gameState.activeDelves}
            getRecentEvents={getRecentEvents}
            flipTableStates={gameState.flipTableStates}
            activeCompositions={gameState.activeCompositions}
            doomClockStage={gameState.doomClock?.currentStage}
            controlEffects={gameState.controlEffects}
            essenceReserves={gameState.essencePool}
          />
        ) : (
          <div className="flex flex-shrink-0" style={{ alignItems: 'stretch' }}>
            {/* Sidebar — always rendered: the Ledger rail (THR-1881 step e) */}
            <LedgerRail
              gameState={gameState}
              openingReveal={openingReveal}
              threadedNodes={threadedNodes}
              selectedThreadNodeId={selectedThreadNode?.nodeId ?? null}
              handleThreadNodeSelect={handleThreadNodeSelect}
              handleCenterOnHex={handleCenterOnHex}
              handleZoomToLocation={handleZoomToLocation}
              retinueActiveEncounters={retinueActiveEncounters}
              latestThreadEncounterDecisions={latestThreadEncounterDecisions}
              handleToggleAttentionMode={handleToggleAttentionMode}
              agentStrategicSummaries={agentStrategicSummaries}
              appointmentBadges={appointmentBadges}
              encounterStakesLines={encounterStakesLines}
              encounterBadges={encounterBadges}
              handleOpenEncounterBadge={handleOpenEncounterBadge}
              tugBadges={tugBadges}
              attendThreadTug={attendThreadTug}
              noticeBadges={noticeBadges}
              handleOpenNoticeBadge={handleOpenNoticeBadge}
              momentBadges={momentBadges}
              handleOpenMomentBadge={handleOpenMomentBadge}
              sustainedControls={sustainedControls}
              openAgentSheetForId={openAgentSheetForId}
              beforeYouWoke={beforeYouWoke}
            />
          </div>
        )}
      </div>

      {/* Dialogs and ceremonies (THR-1881 split step b). DialogHost first, then
          CeremonyHost: the non-portal z-50 overlays keep their inline DOM order. */}
      <DialogHost
        gameState={gameState}
        onHomedSurfaceSkip={handleHomedSurfaceSkip}
        onHomedSurfaceFallback={handleHomedSurfaceFallback}
        setGameState={setGameState}
        runtime={runtime}
        archetype={archetype}
        strandData={strandData}
        handleStrandClose={handleStrandClose}
        scryVisible={scryVisible}
        scryState={scryState}
        retinueAgents={retinueAgents}
        handleScryAssign={handleScryAssign}
        handleScryDemote={handleScryDemote}
        handleCloseScry={handleCloseScry}
        handleAgentSelect={handleAgentSelect}
        warmStart={warmStart}
        warmFirstName={warmFirstName}
        openAgentSheetForId={openAgentSheetForId}
        lastReadThreadsTick={lastReadThreadsTick}
        setLastReadThreadsTick={setLastReadThreadsTick}
        attentionPool={attentionPool}
        attentionCapacity={attentionCapacity}
        activeReceipt={activeReceipt}
        handleAcknowledgeReceipt={handleAcknowledgeReceipt}
        handleReceiptReaction={handleReceiptReaction}
        pendingBeat={pendingBeat}
        beatEntered={beatEntered}
        setBeatEntered={setBeatEntered}
        handleWitnessBeat={handleWitnessBeat}
        beatProseOverride={beatProseOverride}
        avatarName={avatarName}
        beatSubjectRef={beatSubjectRef}
        codexInitialFilter={codexInitialFilter}
        codexInitialEntryId={codexInitialEntryId}
        doomJourneyLabel={doomJourneyLabel}
        interruptResolution={interruptResolution}
        currentPopup={currentPopup}
        notificationState={notificationState}
        handleDismissPopup={handleDismissPopup}
        handlePopupChoice={handlePopupChoice}
      />
      <CeremonyHost
        gameState={gameState}
        onHomedSurfaceSkip={handleHomedSurfaceSkip}
        onHomedSurfaceFallback={handleHomedSurfaceFallback}
        archetype={archetype}
        twilightBeats={twilightBeats}
        handleCompleteTwilight={completeTwilightNow}
        twilightRemembered={carriesRun && !accountSaveFailed}
        harvestResult={harvestResult}
        handleWakeNewWorld={handleWakeNewWorld}
        accountSaved={concludedRun ? concludedRun.saved : null}
        accountCarried={carriesRun}
        meetingState={meetingState}
        ascendantIdentity={ascendantIdentity}
        handleMeetingSpendEssence={handleMeetingSpendEssence}
        handleMeetingComplete={handleMeetingComplete}
        handleMeetingClose={handleMeetingClose}
        pendingRite={pendingRite}
        interruptResolution={interruptResolution}
        handleRiteComplete={handleRiteComplete}
        handleRiteWithoutHand={handleRiteWithoutHand}
      />

      {/* The Stage (THR-1881 split step c): the encounter veil and the one-moment
          interrupts — emergence dilemma, moment card, journey vignette, story beat,
          premonition. All of them portal, so this mount point decides no stacking. */}
      <StageHost
        gameState={gameState}
        onHomedSurfaceSkip={handleHomedSurfaceSkip}
        onHomedSurfaceFallback={handleHomedSurfaceFallback}
        setGameState={setGameState}
        interruptResolution={interruptResolution}
        openAgentSheetForId={openAgentSheetForId}
        tieredEncounterState={tieredEncounterState}
        encounterVeilModel={encounterVeilModel}
        encounterStageVM={encounterStageVM}
        openEncounterKey={openEncounterKey}
        describeFollowFor={describeFollowFor}
        handleToggleFollow={handleToggleFollow}
        encounterPayingEssence={encounterPayingEssence}
        encounterPayingSphere={encounterPayingSphere}
        handleEncounterCommitAndContinue={handleEncounterCommitAndContinue}
        handleEncounterBoost={handleEncounterBoost}
        handleEncounterPeek={handleEncounterPeek}
        handleEncounterDisregard={handleEncounterDisregard}
        handleEncounterMinimize={handleEncounterMinimize}
        handleEncounterAcknowledgeAftermath={handleEncounterAcknowledgeAftermath}
        handleEncounterAftermathReaction={handleEncounterAftermathReaction}
        aftermathReactionTakenId={aftermathReactionTakenId}
        aftermathReactionError={aftermathReactionError}
        refRouter={refRouter}
        handleCommitNudges={handleCommitNudges}
        chapterAnswer={chapterAnswer}
        handleChapterLetWorldTurn={handleChapterLetWorldTurn}
        handleChapterBackToMap={handleChapterBackToMap}
        hexMapRef={hexMapRef}
        pendingMoment={pendingMoment}
        momentCardModel={momentCardModel}
        handleAcknowledgeMoment={handleAcknowledgeMoment}
        handleMomentDivineAct={handleMomentDivineAct}
        momentStageVM={momentStageVM}
        vignetteStageVM={vignetteStageVM}
        premonitionStageVM={premonitionStageVM}
        emergenceStageVM={emergenceStageVM}
        activeVignette={activeVignette}
        handleJourneyChoice={handleJourneyChoice}
        activeStoryBeatId={activeStoryBeatId}
        activeStoryBeatTemplate={activeStoryBeatTemplate}
        activeStoryBeatAgentName={activeStoryBeatAgentName}
        storyBeatStageVM={storyBeatStageVM}
        handleStoryBeatDismiss={handleStoryBeatDismiss}
        activePremonition={activePremonition}
        handleWhisperChoice={handleWhisperChoice}
        handleCompulsionChoice={handleCompulsionChoice}
        handlePremonitionDismiss={handlePremonitionDismiss}
      />

      {refRouter.hoverCard && (
        <HoverCard page={refRouter.hoverCard.page} anchorEl={refRouter.hoverCard.anchorEl} />
      )}
    </div>
      </GameScreenStateProvider>
      </DetailPageOpenerProvider>
      </RefRouterProvider>
      </ViewSourceContext.Provider>
    </GameErrorBoundary>
  );
}
