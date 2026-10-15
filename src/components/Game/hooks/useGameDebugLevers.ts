/**
 * useGameDebugLevers — every `window.__DEBUG` registration the game screen makes,
 * plus the `?spawn` / `?undertaking` / `?spell` / `?testavatar` URL review levers.
 *
 * THR-1881 (the GameView split, step a): moved out of `GameView.tsx` verbatim. Each
 * lever keeps the deps array and the comment it had inline; the only change is that
 * the values it reads arrive in one context object instead of the component's scope.
 * GameView calls this hook last, after every value it reads is defined.
 *
 * Nothing here changes what the game does: the bridge registrations are DEV-only,
 * and the URL levers are the same review tools they were (they run on the deployed
 * build too, the THR-880 `?forceencounters` pattern).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import type { DebugBridge } from '../../../debug-bridge.d';
import type { HexTile } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { PendingVignette } from '../../../types/journeyEngine';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { ClearanceGateRuntimeState } from '../../../types/contentShells';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { HexMapV2Handle } from '../../HexMapV2/HexMapV2';
import type { useRefRouter } from '../../../hooks/useRefRouter';
import type { useOpeningReveal } from '../GameView/openingReveal';
import type { ChapterAnswerRunHandle } from './useChapterAnswerRun';
import { hexToPixel } from '../../../lib/hexMath';
import { HEX_CONSTANTS } from '../../HexMapV2/scene/HexFillMesh';
import { resolveDebugAgent, isDebugAgentMiss } from '../../../engine/debugAgentResolver';
import { followAgent, unfollowAgent } from '../../../engine/followedAgents';
import { getViewSelector, listViewSelectors } from '../../../engine/views/selectors';
import { readView, viewCacheStats } from '../../../engine/views/readView';
import type { ViewSource } from '../../../contexts/ViewSourceContext';
import {
  ensureDominionProjection, touchWorld, touchStructure, type SimulationRuntime, type updateDominionDrops,
} from '../../../engine/simulationRuntime';
import { dominionLensVM } from '../../../engine/dominionViewModels';
import { countHexBands } from '../../../engine/dominionProjection';
import { hexKey as dominionHexKey } from '../../../lib/hexKey';
import { FORCE_COMPULSION_FLAG } from '../../../engine/premonitionCompulsion';
import { buildWhisperPremonition } from '../../../engine/phaseDivinePremonition';
import { mulberry32 } from '../../../lib/prng';
import { PREMONITION_EXPIRY_TICKS } from '../../../data/premonition-constants';
import { UNIFIED_ACTION_TEMPLATES, getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { ACTION_CONTROL_VERB_WORD, ACTION_VERB_WORDS, ACTION_SCALE_WORDS } from '../../../data/action-card-display';
import { ACTION_VERB_FALLBACK_WORD } from '../actionCardModel';
import { preparePlayerCast, commitPlayerCast } from '../../../engine/playerCastDispatch';
import { isStarterActionId } from '../../../engine/actionUnlock';
import {
  prepareDebugEncounterSpawn, applySpellStamp, applyBalancedTestAvatar, prepareDebugEncounterContext,
} from '../../../engine/debugEncounterTools';
import { buildEncounterBinderContext } from '../../../engine/binding/encounterBinderContext';
import {
  buildActiveEncounterDisplayFromUnifiedAction, buildActiveEncounterDisplayFromLegacyProgress,
  type ActiveEncounterDisplay,
} from '../encounterNotificationRuntime';
import { courtPositionToThreadTier } from '../encounter-stage/types';
import { startUndertakingForReview, REVIEW_LEVER_MAX_ATTEMPTS } from '../../../engine/undertakingReviewLevers';
import { enqueueUndertakingMoments } from '../../../engine/undertakingMoments';
import { isAutonomousDecisionActor } from '../../../engine/strategicKindReachability';
import {
  spawnDebugAttachment, spawnDebugMark, type DebugSpawnMarkOptions, spawnDebugCompanion,
  spawnDebugLocationAtHex, spawnDebugSublocation, spawnDebugNpc, spawnDebugBand, moveDebugAgent,
} from '../../../engine/debugWorldSpawnTools';
import { pinAgent as pinAgentDebug, unpinAgent as unpinAgentDebug } from '../../../engine/portfolioManager';
import { setHomeSeat as setHomeSeatEngine } from '../../../engine/influence';
import {
  forceOffering, forceOfferBeatById, resolvePendingBeat, getBeatDefinitionById,
} from '../../../engine/ascendantBeat';
import { emitTrace } from '../../../engine/traceBuffer';
import { resolveAftermathContextForAgent } from '../../../engine/encounterAftermath';
import { type BeatDismissalRecord, type BeatInterruptSurface, selectDefaultBeatChoice } from '../beatDismissal';
import type { WorldRef } from '../../../types/worldRef';

/** The argument a bridge's `_register*` method takes. */
type Registered<K extends keyof DebugBridge> =
  NonNullable<DebugBridge[K]> extends (fn: infer A, ...rest: never[]) => unknown ? A : never;

/** What the encounter spawn lever opens — the fields GameView's encounter state carries. */
export interface DebugOpenedEncounter {
  notification: EncounterNotification;
  encounter: ActiveEncounterDisplay;
  template: UnifiedActionTemplate;
  agentId: string;
  agentName: string;
  threadTier: ReturnType<typeof courtPositionToThreadTier>;
  activeActionId?: string;
  clearanceGateRuntimeId?: string;
  activeActionSnapshot?: UnifiedAction;
  clearanceGateStateSnapshot?: ClearanceGateRuntimeState;
}

/** Everything the levers read from the game screen. Names match GameView's own. */
export interface GameDebugLeverContext {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  runtime: SimulationRuntime;
  tiles: HexTile[];
  hexMapRef: RefObject<HexMapV2Handle>;
  retinueEyeZoomScale: number;
  handleAgentSelect: (agentId: string) => void;
  openAgentProfileForId: (agentId: string) => void;
  fogDisabled: boolean;
  setFogDisabled: Dispatch<SetStateAction<boolean>>;
  _gameStateRef: MutableRefObject<GameState>;
  viewSource: ViewSource;
  avatarNodeId: string | null | undefined;
  threadedAgentIdsForActivity: unknown;
  activityActionsVersion: unknown;
  dominionLensBase: unknown;
  dominionLensOn: boolean;
  dominionProjectionNow: ReturnType<typeof ensureDominionProjection> | null;
  dominionDrops: ReturnType<typeof updateDominionDrops>;
  setDominionLens: (on: boolean) => void;
  omniscienceMode: boolean;
  setOmniscienceMode: (on: boolean) => void;
  setTieredEncounterState: (next: DebugOpenedEncounter) => void;
  runTicksSync: (n: number) => ReturnType<Registered<'_registerTickBridge'>>;
  setBeatEntered: (entered: boolean) => void;
  applyAftermathReactionForAgent: (
    agentId: string,
    reactionId: string | undefined,
    source: 'debug-bridge',
  ) => {
    success: boolean;
    message: string;
    reactionId?: string;
    touchedWorld?: boolean;
    touchedStructure?: boolean;
  };
  refRouter: ReturnType<typeof useRefRouter>;
  getDebugOpenModals: Registered<'_registerOpenModalsProvider'>;
  getDebugActiveUIState: Registered<'_registerActiveUIStateProvider'>;
  getDebugInterruptState: Registered<'_registerInterruptStateProvider'>;
  getDebugGiftDelivery: Registered<'_registerGiftDeliveryProvider'>;
  getDebugClockHold: Registered<'_registerClockHoldProvider'>;
  arrivalBeatOffered: boolean;
  clockEverRan: boolean;
  openingReveal: ReturnType<typeof useOpeningReveal>;
  chapterAnswer: ChapterAnswerRunHandle;
  pendingBeat: NonNullable<GameState['ascendantBeats']>['pending'] | null;
  beatEntered: boolean;
  interruptsSuppressed: boolean;
  activeVignette: PendingVignette | null;
  handleJourneyChoice: (choiceId: string) => void;
  activeStoryBeatId: string | null;
  activeStoryBeatTemplate: UnifiedActionTemplate | null;
  handleStoryBeatDismiss: () => void;
  activePremonition: unknown;
  handlePremonitionDismiss: () => void;
  handleResolveBeat: (chosenActionId?: string) => void;
}

export function useGameDebugLevers(ctx: GameDebugLeverContext): void {
  const {
    gameState, setGameState, runtime, tiles, hexMapRef,
    handleAgentSelect, openAgentProfileForId, fogDisabled, setFogDisabled, _gameStateRef,
    viewSource, avatarNodeId, threadedAgentIdsForActivity, activityActionsVersion,
    dominionLensBase, dominionLensOn, dominionProjectionNow, dominionDrops, setDominionLens,
    omniscienceMode, setOmniscienceMode, setTieredEncounterState, runTicksSync, setBeatEntered,
    applyAftermathReactionForAgent, refRouter,
    getDebugOpenModals, getDebugActiveUIState, getDebugInterruptState, getDebugGiftDelivery,
    getDebugClockHold, arrivalBeatOffered, clockEverRan, openingReveal, chapterAnswer,
    pendingBeat, beatEntered, interruptsSuppressed, activeVignette, handleJourneyChoice,
    activeStoryBeatId, activeStoryBeatTemplate, handleStoryBeatDismiss,
    activePremonition, handlePremonitionDismiss, handleResolveBeat,
  } = ctx;
  const RETINUE_EYE_ZOOM_SCALE = ctx.retinueEyeZoomScale;

  // ── Debug bridge: gotoAgent ───────────────────────────────────────────────
  // graphRef always holds the latest graph so the registered callback never
  // closes over a stale reference (graph mutates in-place but rerenders swap
  // the object). See load-bearing decision: "world graph is mutated in place".
  const _gotoAgentGraphRef = useRef(gameState.graph);
  _gotoAgentGraphRef.current = gameState.graph;

  // ── Debug bridge: openAgentSheet (THR-1433) ──────────────────────────────
  // The sheet renders only while the mortal is the selected agent (the card the
  // modal reads is built from `selectedAgentId`), so this goes through `gotoAgent`
  // first and then the same setter the info card's "Sheet →" button uses.
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerOpenAgentSheet((id: string) => {
      const graph = _gotoAgentGraphRef.current;
      const match = graph.getNodesByType('actor').find(n =>
        n.id === id ||
        n.id.startsWith(id) ||
        ((n.properties.name as string | undefined) ?? '').toLowerCase().includes(id.toLowerCase())
      );
      if (!match) return false;
      window.__DEBUG?.gotoAgent(match.id);
      openAgentProfileForId(match.id);
      return true;
    });
  }, [openAgentProfileForId]);

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

  // ── Debug bridge: follow write levers (THR-1299) ─────────────────────────
  // A write lever rather than a provider mutation: follow state is React state,
  // and mutating the provider's GameState in place would flip the predicate
  // without re-rendering the surfaces that read it — the change would be real and
  // invisible, which is the worst shape for a lever whose whole job is to make a
  // constructed proof observable.
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;

    const applyFollow = (
      agentQuery: string,
      apply: (state: GameState, agentId: string) => Pick<GameState, 'followedAgentIds' | 'mutedAgentIds'>,
    ) => {
      const resolved = resolveDebugAgent(_gameStateRef.current, agentQuery);
      if (isDebugAgentMiss(resolved)) return { success: false, message: resolved.error };
      const agentId = resolved.node.id;
      setGameState(prev => ({ ...prev, ...apply(prev, agentId) }));
      return { success: true, agentId };
    };

    window.__DEBUG._registerFollowBridge({
      followAgent: (agentQuery: string) =>
        applyFollow(agentQuery, (state, agentId) => followAgent(state, agentId, 'debug')),
      unfollowAgent: (agentQuery: string) =>
        applyFollow(agentQuery, (state, agentId) => unfollowAgent(state, state.graph, agentId, 'debug')),
    });
  }, [setGameState]);

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

  const viewSourceRef = useRef(viewSource);
  viewSourceRef.current = viewSource;
  // The args this screen reads the map and lens selectors with — one superset object,
  // each selector reads its own fields — so `getView('map.agents')` with no args
  // returns the very object the map drew (a cache hit, same key).
  const screenViewArgsRef = useRef<Record<string, unknown>>({});
  screenViewArgsRef.current = {
    avatarNodeId: avatarNodeId ?? null,
    hexSize: HEX_CONSTANTS.HEX_SIZE,
    threadedAgentIds: threadedAgentIdsForActivity,
    telemetryVersion: runtime.balanceTelemetryVersion,
    actionsVersion: activityActionsVersion,
  };
  // The lens the screen drew — off, on, or on with no god — returned as is, so a
  // debug read never builds a projection the screen did not ask for.
  const screenLensRef = useRef(dominionLensBase);
  screenLensRef.current = dominionLensBase;
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerViewBridge({
      get: (id: string, args?: unknown) => {
        if (id === 'lens' && args === undefined) return screenLensRef.current;
        const sel = getViewSelector(id);
        if (!sel) return null;
        const src = viewSourceRef.current;
        return readView(src.runtime, src.state, sel, args ?? screenViewArgsRef.current, src.tiles);
      },
      list: () => listViewSelectors(),
      stats: () => viewCacheStats(viewSourceRef.current.runtime),
    });
  }, []);

  // Debug bridge: setDominionLens / getDominionLens / getDominionHex (THR-1750).
  const dominionBridgeStateRef = useRef({ on: dominionLensOn, projection: dominionProjectionNow, drops: dominionDrops });
  dominionBridgeStateRef.current = { on: dominionLensOn, projection: dominionProjectionNow, drops: dominionDrops };
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerDominionLensBridge({
      set: (on: boolean) => { setDominionLens(on); return on; },
      get: () => {
        const { on, drops } = dominionBridgeStateRef.current;
        const projection = gameState.ascendantId
          ? ensureDominionProjection(runtime, gameState.graph, tiles, gameState.ascendantId, gameState.tick)
          : null;
        const edges = projection ? dominionLensVM(projection, null, [], true).edges : [];
        return {
          on,
          byBand: projection ? countHexBands(projection) : { hostile: 0, foreign: 0, touched: 0, held: 0, sovereign: 0 },
          frontierEdges: edges.length,
          hostileEdges: edges.filter(e => e.meetsHostile).length,
          drops: drops.length,
        };
      },
      hex: (col: number, row: number) => {
        if (!gameState.ascendantId) return null;
        const projection = ensureDominionProjection(runtime, gameState.graph, tiles, gameState.ascendantId, gameState.tick);
        const key = dominionHexKey(col, row);
        const band = projection.hexBand.get(key);
        if (!band) return null;
        const frontier = dominionLensVM(projection, null, [], true).edges.some(e => e.key === key);
        return { band, placeId: projection.hexPlaceId.get(key) ?? null, frontier };
      },
    });
  }, [setDominionLens, runtime, gameState.graph, gameState.ascendantId, gameState.tick, tiles]);

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
        companyClusters: 0,
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
  // The ref is the synchronous source of truth. Reading `omniscienceMode` from
  // the closure meant two `toggleOmniscience()` calls inside one tick both saw
  // the pre-render value and both returned the same thing (THR-1412); state
  // updates do not land until React re-renders, but a debug lever has to report
  // what it just did.
  const omniscienceRef = useRef(omniscienceMode);
  omniscienceRef.current = omniscienceMode;

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerOmniscienceToggle((enabled?: boolean) => {
      const next = enabled === undefined ? !omniscienceRef.current : enabled;
      omniscienceRef.current = next;
      setOmniscienceMode(next);
      return next;
    });
  }, []);

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

  // ── Debug bridge: forcePremonition (THR-1414) ─────────────────────────────
  // The whisper arm queues a real premonition visible immediately; the compulsion
  // arm arms the decision phase, because a compulsion is composed from candidates
  // that only exist inside it.
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerForcePremonition((agentId, kind) => {
      let outcome: import('../../../debug-bridge.d').ForcePremonitionResult = {
        error: 'Game not loaded',
      };

      setGameState(prev => {
        const agent = prev.graph.getNode(agentId);
        if (!agent) {
          outcome = { error: `Agent ${agentId} is not in the graph` };
          return prev;
        }

        if (kind === 'compulsion') {
          // Direct property write — updateNode replaces the handle.
          agent.properties[FORCE_COMPULSION_FLAG] = true;
          // A property write on a mutated-in-place graph is invisible to memoized
          // selectors until the world is touched.
          touchWorld(runtime);
          outcome = {
            staged: 'armed', kind, agentId, agentName: agent.name, id: null,
            nextStep: 'call window.__DEBUG.tick(1) — the compulsion is emitted at the next scoring moment',
          };
          return prev;
        }

        const built = buildWhisperPremonition(agent, prev, mulberry32(prev.seed + prev.tick * 67));
        if (!built) {
          outcome = { error: `No nudge candidates for ${agent.name} — nothing to whisper` };
          return prev;
        }

        // Show it now rather than after PREMONITION_DISPLAY_DELAY_TICKS: a forced
        // premonition exists to be looked at, and a lever that still needs ten ticks
        // is the same wait it was meant to remove. Expiry keeps its usual width.
        const premonition = {
          ...built,
          showAfterTick: prev.tick,
          eligibleUntilTick: prev.tick + PREMONITION_EXPIRY_TICKS,
        };
        outcome = {
          staged: 'queued', kind, agentId, agentName: agent.name, id: premonition.id,
          nextStep: 'the modal opens on the next render — read window.__DEBUG.getOpenModals()',
        };
        return {
          ...prev,
          premonitionQueue: [...(prev.premonitionQueue ?? []), premonition],
        };
      });

      return outcome;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debug bridge: listActions / fireAction ────────────────────────────────
  // A single ref captures the mutable state slices needed by both commands.
  // setGameState is a stable React dispatcher — it doesn't need the ref treatment.
  // `state` carries the whole slice so agent selectors resolve through the
  // shared `resolveDebugAgent` (THR-1032), which needs `ascendantId` to honour
  // `@hero`. The destructured fields stay for the cast path below.
  const _actionStateRef = useRef({
    state: gameState,
    graph: gameState.graph,
    tick: gameState.tick,
    seed: gameState.seed,
    ascendantId: gameState.ascendantId,
  });
  _actionStateRef.current = {
    state: gameState,
    graph: gameState.graph,
    tick: gameState.tick,
    seed: gameState.seed,
    ascendantId: gameState.ascendantId,
  };

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerActionBridge({
      listActions: (agentId?: string) => {
        const { state } = _actionStateRef.current;

        // If agentId given, verify the agent exists first. Resolution goes
        // through the shared resolver (THR-1032) — the hand-rolled matcher this
        // replaced read `properties.name`, which actors do not carry, so the
        // documented "doubles as an existence check" reported every agent
        // non-existent (THR-1412).
        if (agentId !== undefined) {
          if (isDebugAgentMiss(resolveDebugAgent(state, agentId))) return [];
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
            // THR-1002: the two words the card's chips print, alongside the raw
            // keys above — so a verification run can check the translation rather
            // than only the schema.
            verbWord: t.durationMode === 'sustained'
              ? ACTION_CONTROL_VERB_WORD
              : ACTION_VERB_WORDS[t.crudType] ?? ACTION_VERB_FALLBACK_WORD,
            scaleWord: ACTION_SCALE_WORDS[t.scale] ?? '',
          }));
      },

      fireAction: (agentId: string, templateId: string) => {
        const { state, graph, tick, seed, ascendantId } = _actionStateRef.current;

        // Find agent — shared resolver (THR-1032): exact id, id prefix, display
        // name, or the `@hero` alias. Its miss text names how many actors were
        // searched, so "no such agent" stays distinguishable from "the matcher
        // is blind" (THR-1412).
        const resolved = resolveDebugAgent(state, agentId);
        if (isDebugAgentMiss(resolved)) return { success: false, message: resolved.error };
        const agentMatch = resolved.node;

        // Find template — exact id first, then partial match
        let template = getUnifiedTemplateById(templateId);
        if (!template) {
          template = UNIFIED_ACTION_TEMPLATES.find(t =>
            t.id.includes(templateId) ||
            t.name.toLowerCase().includes(templateId.toLowerCase())
          );
        }
        if (!template) return { success: false, message: `No template matching '${templateId}'` };

        // Shares the player-cast path (THR-739). Fires at list price and skips
        // the buff pass — a debug cast must not silently eat the player's
        // one-shot Recede/Focus. No recentEvents line: this is a dev lever, not
        // a narrated beat.
        const tpl = template; // stable reference for closure
        const cast = preparePlayerCast({
          graph,
          ascendantId,
          template: tpl,
          templateId: tpl.id,
          targetId: agentMatch.id,
          tick,
          seed,
          sphere: tpl.sphereAffinity ?? null,
          applyBuffs: false,
          essencePaid: tpl.essenceCost ?? 0,
        });

        setGameState(prev => commitPlayerCast(prev, { cast }));

        const agentName = agentMatch.name ?? agentMatch.id;
        return {
          success: true,
          actionId: cast.action.actionId,
          templateName: tpl.name,
          message: `Fired '${tpl.name}' on '${agentName}'`,
        };
      },
      grantAction: (actionId: string) => {
        const normalized = actionId.trim();
        if (!normalized) return { success: false, message: 'Action ID is required' };

        const template = UNIFIED_ACTION_TEMPLATES.find((entry) =>
          entry.id === normalized || entry.id.includes(normalized),
        );
        if (!template) {
          return { success: false, message: `No action template matches '${normalized}'` };
        }
        if (template.starter === true || isStarterActionId(template.id)) {
          return { success: false, actionId: template.id, message: `${template.id} is already a starter action` };
        }

        let wasAdded = false;
        setGameState((prev) => {
          const unlocked = prev.unlockedActionIds ?? [];
          if (unlocked.includes(template.id)) return prev;
          wasAdded = true;
          return { ...prev, unlockedActionIds: [...unlocked, template.id] };
        });

        return wasAdded
          ? { success: true, actionId: template.id, message: `Unlocked action '${template.id}'` }
          : { success: false, actionId: template.id, message: `${template.id} is already unlocked` };
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Runs once — live deps accessed via _actionStateRef; setGameState is a stable dispatcher

  // Shared by the __DEBUG encounter bridge and the `?spawn=` URL lever
  // (THR-883). Stable: reads live state via _gameStateRef; the two setters are
  // stable dispatchers.
  const debugSpawnEncounter = useCallback(
    (agentId: string, templateId: string, options?: Parameters<typeof prepareDebugEncounterSpawn>[3]) => {
        // THR-1305: hand the spawn the same scored board live play uses, so a
        // migrated template is reviewed as it will actually be cast. The assembler
        // returns undefined when this session cannot ledger, which is the legacy
        // fallback rather than an error.
        const prepared = prepareDebugEncounterSpawn(_gameStateRef.current, agentId, templateId, {
          ...(options ?? {}),
          // No actorId here on purpose: `agentId` is a *query* ('@hero', a partial
          // name). The tool resolves it and stamps the real node id on the context.
          binder: buildEncounterBinderContext(runtime, _gameStateRef.current),
        });
        if (!prepared.success || !prepared.template || !prepared.notification || !prepared.agent) {
          return {
            success: false,
            message: prepared.message,
          };
        }

        // The spawn threads its target in place on the graph (THR-934). The graph
        // mutates without changing identity, so ThreadsPanel's worldVersion-keyed
        // selectors need an explicit bump or the new row — and the encounter badge
        // anchored to it — never appears.
        if (prepared.threadWrite?.created || prepared.threadWrite?.retuned) {
          touchWorld(runtime);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Debug: direct-URL encounter spawn (`?spawn=<templateId>`) — THR-883 ──
  // A shareable review link that stages one named encounter on The First and
  // opens it, e.g. `?view=game&seeded&size=medium&spawn=encounter.slice.
  // unsafe_bridge`. Read from the URL (not window.__DEBUG) so it also works on
  // the deployed build — the THR-880 `?forceencounters` pattern. Retries across
  // early renders until the seeded world can resolve `@hero`; capped, one spawn
  // per page load, fail-soft: a bad id logs its message and the game proceeds.
  //
  // `?spawn` first stamps its target as the **balanced test avatar** (equal
  // mid-competent capability in all eight reaches, neutral value axes, an
  // essence floor in all twelve spheres) so review is not skewed by the seeded
  // identity's reach spread (Christian, 2026-07-31). `?testavatar` applies the
  // same stamp without spawning, for balanced free play.
  // ── Debug: the undertaking review levers (THR-1300 slice 2) ──
  // The `?spawn` analog for undertakings. Resolves the agent the way the CLI does
  // (`@first` → the bonded First, `@hero` → the ascendant, else id/name), starts the
  // template through the board's own path, and applies the returned runtime state
  // and founding moment exactly as the decision phase would.
  const debugStartUndertaking = useCallback(
    (agentRef: string, templateId: string, options?: { target?: string; band?: string }) => {
      const current = _gameStateRef.current;
      const graph = current.graph;
      const resolveAgent = (): string | null => {
        if (agentRef === '@hero') return current.ascendantId ?? null;
        if (agentRef === '@first') {
          const first = graph.getEdgesByType('thread')
            .find(e => e.properties.courtPosition === 'the_first');
          return first?.target ?? null;
        }
        const q = agentRef.toLowerCase();
        return graph.getNodesByType('actor').find(n => n.id === agentRef
          || n.id.includes(agentRef) || (n.name ?? '').toLowerCase().includes(q))?.id ?? null;
      };
      const actorId = resolveAgent();
      if (!actorId) return { ok: false, reason: 'unknown_actor' as const, message: `No agent matching "${agentRef}"` };
      const result = startUndertakingForReview(current, graph, actorId, templateId, {
        targetId: options?.target,
        band: options?.band,
      });
      if (result.ok) {
        const nextStrategic = result.strategicState;
        const moments = result.moments ?? [];
        touchWorld(runtime);
        setGameState(prev => ({
          ...prev,
          strategicState: nextStrategic ?? prev.strategicState,
          pendingUndertakingMoments: moments.length
            ? enqueueUndertakingMoments(prev.pendingUndertakingMoments, moments, prev.tick)
            : prev.pendingUndertakingMoments,
        }));
      }
      return {
        ok: result.ok,
        reason: result.reason,
        refusals: result.refusals,
        projectId: result.projectId,
        bypassedGates: result.bypassedGates,
        belowSpotlight: result.belowSpotlight,
        targetOwned: result.targetOwned,
        message: result.message,
      };
    },
    [],
  );

  const urlUndertakingDoneRef = useRef(false);
  const urlUndertakingAttemptsRef = useRef(0);
  useEffect(() => {
    if (urlUndertakingDoneRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('undertaking');
    const wantsForceMoments = params.has('forcemoments');
    if (!templateId && !wantsForceMoments) {
      urlUndertakingDoneRef.current = true;
      return;
    }
    if (params.get('spawn') && templateId) {
      // `?spawn` wins (stated in the pin block above); the undertaking flag is dropped.
      urlUndertakingDoneRef.current = true;
      return;
    }
    if (urlUndertakingAttemptsRef.current >= REVIEW_LEVER_MAX_ATTEMPTS) return;
    urlUndertakingAttemptsRef.current += 1;

    const current = _gameStateRef.current;
    const hasFirst = current.graph.getEdgesByType('thread').some(e => e.properties.courtPosition === 'the_first');
    if (!hasFirst) {
      if (urlUndertakingAttemptsRef.current === REVIEW_LEVER_MAX_ATTEMPTS) {
        console.warn(`[?undertaking] gave up after ${REVIEW_LEVER_MAX_ATTEMPTS} attempts: no bonded First to stage on`);
      }
      return;
    }

    if (wantsForceMoments) {
      // Follow every spotlight individual through the single writer, never a
      // parallel follow set. Unfollowed (ambient) mortals stay invisible.
      const spotlight = current.graph.getNodesByType('actor')
        .filter(n => n.properties.actorType === 'individual' && isAutonomousDecisionActor(n))
        .map(n => n.id);
      setGameState(prev => {
        let next = prev;
        for (const id of spotlight) next = { ...next, ...followAgent(next, id, 'debug') };
        return next;
      });
    }

    if (templateId) {
      const result = debugStartUndertaking('@first', templateId, {});
      if (!result.ok && urlUndertakingAttemptsRef.current === REVIEW_LEVER_MAX_ATTEMPTS) {
        console.warn(`[?undertaking] gave up after ${REVIEW_LEVER_MAX_ATTEMPTS} attempts: ${result.message}`);
      }
      if (!result.ok) return;
      console.info(`[?undertaking] ${result.message}`);
    }
    urlUndertakingDoneRef.current = true;
  }, [debugStartUndertaking, gameState]);

  const urlSpawnDoneRef = useRef(false);
  const urlSpawnAttemptsRef = useRef(0);
  const urlSpellDoneRef = useRef(false);
  useEffect(() => {
    if (urlSpawnDoneRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('spawn');
    // THR-1670 — `?spell=<templateId>` stamps @hero as knowing and wielding the
    // spell (after the balanced stamp, which would otherwise reset the reaches the
    // spell stamp may have raised to its floor), so a step cast is reviewable.
    const spellParam = params.get('spell');
    const wantsTestAvatar = params.has('testavatar') || templateId !== null;
    if (!templateId && !wantsTestAvatar && !spellParam) {
      urlSpawnDoneRef.current = true;
      return;
    }
    if (urlSpawnAttemptsRef.current >= 30) return;
    urlSpawnAttemptsRef.current += 1;

    // Returns false while @hero cannot be resolved yet (the effect retries).
    const stampSpell = (): boolean => {
      if (!spellParam || urlSpellDoneRef.current) return true;
      const stamped = applySpellStamp(_gameStateRef.current, '@hero', spellParam);
      if (!stamped.success) {
        if (urlSpawnAttemptsRef.current === 30) console.warn(`[?spell] gave up after 30 attempts: ${stamped.message}`);
        return false;
      }
      urlSpellDoneRef.current = true;
      touchWorld(runtime);
      console.info(`[?spell] ${stamped.message}`);
      return true;
    };

    if (wantsTestAvatar) {
      const stamped = applyBalancedTestAvatar(_gameStateRef.current, '@hero');
      if (stamped.success) {
        touchWorld(runtime);
        if (stamped.essencePool) {
          const pool = stamped.essencePool;
          setGameState(prev => ({ ...prev, essencePool: pool }));
        }
        if (!stampSpell()) return;
        if (!templateId) {
          urlSpawnDoneRef.current = true;
          return;
        }
      } else if (!templateId) {
        if (urlSpawnAttemptsRef.current === 30) {
          console.warn(`[?testavatar] gave up after 30 attempts: ${stamped.message}`);
        }
        return;
      }
    } else {
      if (!stampSpell()) return;
      if (!templateId) {
        urlSpawnDoneRef.current = true;
        return;
      }
    }

    const result = debugSpawnEncounter('@hero', templateId!, {
      open: true,
      courtPosition: 'the_first',
    });
    if (result.success) {
      urlSpawnDoneRef.current = true;
    } else if (urlSpawnAttemptsRef.current === 30) {
      console.warn(`[?spawn] gave up after 30 attempts: ${result.message}`);
    }
  }, [debugSpawnEncounter, gameState]);

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerEncounterBridge({
      spawnEncounter: (agentId: string, templateId: string, options) =>
        debugSpawnEncounter(agentId, templateId, options),
      // THR-1300 slice 2 — the undertaking review lever's state-mutating half.
      startUndertaking: (agentRef, templateId, options) =>
        debugStartUndertaking(agentRef as string, templateId as string, options as { target?: string; band?: string } | undefined),
      spawnEncounterContext: (templateId, options) => {
        // THR-1305: same scored board as live play. No actorId — this site stages an
        // encounter at a place before any agent is chosen.
        const result = prepareDebugEncounterContext(_gameStateRef.current, templateId, {
          ...(options ?? {}),
          binder: buildEncounterBinderContext(runtime, _gameStateRef.current),
        });
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
      // THR-1433 — a mark on a stranger, so the mind-reading proof can be constructed.
      spawnMark: (holderQuery, subjectQuery, options) => {
        const result = spawnDebugMark(
          _gameStateRef.current, String(holderQuery), String(subjectQuery),
          (options ?? undefined) as DebugSpawnMarkOptions | undefined,
        );
        if (result.success) {
          touchWorld(runtime);
          setGameState(prev => ({ ...prev, graph: prev.graph }));
        }
        return result;
      },
      // THR-1413 — the companions row (THR-1096) had no deliberate mint route.
      spawnCompanion: (agentQuery, templateQuery, options) => {
        const result = spawnDebugCompanion(_gameStateRef.current, agentQuery, templateQuery, options);
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
      // Unannotated params, matching every sibling spawn* above: the bridge is
      // registered against a loose `Record<string, (...args: unknown[]) => unknown>`,
      // which cannot accept a precisely-typed function (contravariance), so each of
      // these carries one `unknown`-param error. Annotating trades that for a worse
      // whole-signature mismatch — the baseline absorbs it, as it does for the others.
      spawnBand: (factionQuery, options) => {
        const result = spawnDebugBand(_gameStateRef.current, factionQuery as string, options as { role?: 'raider' | 'defender' } | undefined);
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
      setHomeSeat: (locationRef) => {
        const state = _gameStateRef.current;
        const result = setHomeSeatEngine(state.graph, state.ascendantId, locationRef as string | undefined);
        if (result.success) {
          touchStructure(runtime);
          setGameState(prev => ({ ...prev, graph: prev.graph }));
        }
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

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerGameStateProvider(() => _gameStateRef.current);
    // THR-1134: the runtime the bridge hands to `buildIncidentBundle` and
    // `getIncidentRecorderStats`. `runtimeRef.current` is stable for the session,
    // so registering once is enough.
    window.__DEBUG._registerRuntimeProvider(() => runtime);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debug bridge: synchronous tick batch (THR-689) ────────────────────────
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerTickBridge((n: number) => runTicksSync(n));
  }, [runTicksSync]);

  // ── Debug bridge: Ascendant Beat Director controls (THR-507) ──────────────
  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerBeatBridge({
      // THR-1811: draw an offering now (debug path; seeded by the tick so it repeats).
      forceOffering: () => {
        const state = _gameStateRef.current;
        if (!state?.ascendantBeats) return { success: false, message: 'Game not loaded' };
        const next = forceOffering(state, mulberry32(state.tick + 1811));
        if (!next) return { success: false, message: 'Nothing can be offered (no open rung or no offerable card)' };
        setGameState(prev => ({ ...prev, ascendantBeats: next }));
        return { success: true, beatId: next.pending?.beatId, kind: 'offering', message: 'Offered: ' + (next.pending?.offeredActionIds ?? []).join(', ') };
      },
      fireBeat: (beatId: string) => {
        const state = _gameStateRef.current;
        if (!state) return { success: false, message: 'Game not loaded' };
        if (!state.ascendantBeats) return { success: false, message: 'Ascendant beat state not initialized' };
        const result = forceOfferBeatById(state.ascendantBeats, beatId.trim(), state.tick, state);
        if (!result) return { success: false, message: `No beat matching '${beatId}'` };
        setGameState(prev =>
          prev.ascendantBeats ? { ...prev, ascendantBeats: result.next } : prev,
        );
        return {
          success: true,
          beatId: result.def.beatId,
          kind: result.def.kind,
          message: `Offered beat '${result.def.beatId}' (${result.def.kind})`,
        };
      },
      grantUnlock: (actionId: string) => {
        const normalized = actionId.trim();
        if (!normalized) return { success: false, message: 'Action ID is required' };
        const state = _gameStateRef.current;
        if (!state) return { success: false, message: 'Game not loaded' };
        if ((state.unlockedActionIds ?? []).includes(normalized)) {
          return { success: false, actionId: normalized, message: `'${normalized}' is already unlocked` };
        }
        emitTrace({
          tick: state.tick,
          category: 'action.unlock.granted',
          turn: state.tick,
          actionId: normalized,
          via: 'debug',
          summary: `action.unlock.granted: ${normalized} (via debug)`,
        } as unknown as Parameters<typeof emitTrace>[0]);
        setGameState(prev => {
          const unlocked = prev.unlockedActionIds ?? [];
          if (unlocked.includes(normalized)) return prev;
          return { ...prev, unlockedActionIds: [...unlocked, normalized] };
        });
        return { success: true, actionId: normalized, message: `Unlocked '${normalized}' (via debug)` };
      },
      // Resolve the currently-pending beat headlessly (THR-517) — the running-sim
      // closing half of offer → enter → resolve. Mirrors what the modal's resolve does.
      resolveBeat: (chosenActionId?: string) => {
        const state = _gameStateRef.current;
        if (!state) return { success: false, message: 'Game not loaded' };
        if (!state.ascendantBeats?.pending) {
          return { success: false, message: 'No beat is pending — fire one first.' };
        }
        const result = resolvePendingBeat(
          state,
          {
            ...(chosenActionId ? { chosenActionId } : {}),
            // THR-522: run the matched template's aftermath (if any) through the resolver.
            runtime,
            templateProvider: getUnifiedTemplateById,
          },
          (id) => getUnifiedTemplateById(id) !== undefined,
        );
        if (result.resolved || result.state !== state) {
          setGameState(() => result.state);
          setBeatEntered(false);
        }
        return {
          success: result.resolved,
          beatId: result.beatId ?? undefined,
          grantedActionIds: [...result.grantedActionIds],
          message: result.message,
        };
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Runs once — live state via _gameStateRef; setGameState is a stable dispatcher

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;

    // THR-1032: this matcher failed on every spelling of the ascendant avatar —
    // it had no `@hero` alias, and it read the display name from
    // `properties.name` when `GraphNode.name` is a TOP-LEVEL field, so partial-name
    // matching silently matched nothing at all. Both aftermath accessors therefore
    // returned `No agent matching '<x>'` for the one actor `?spawn=` stages on
    // (impediment #486, six spellings tried). Shared resolver fixes both halves.
    const resolveAgent = (agentQuery: string): { id: string } | { error: string } => {
      const resolved = resolveDebugAgent(_gameStateRef.current, agentQuery);
      return isDebugAgentMiss(resolved) ? { error: resolved.error } : { id: resolved.node.id };
    };

    window.__DEBUG._registerAftermathBridge({
      listAftermathReactions: (agentQuery: string) => {
        const resolution = resolveAgent(agentQuery);
        if ('error' in resolution) {
          return { reactions: [], error: resolution.error };
        }

        const resolvedContext = resolveAftermathContextForAgent(_gameStateRef.current, resolution.id);
        if ('error' in resolvedContext) {
          return { reactions: [], error: resolvedContext.error };
        }

        const reactions = resolvedContext.action.aftermathSummary?.reactions ?? [];
        return { reactions: reactions.map(reaction => ({ id: reaction.id, label: reaction.label })) };
      },
      pickAftermathReaction: (agentQuery: string, reactionId?: string) => {
        const resolution = resolveAgent(agentQuery);
        if ('error' in resolution) {
          return { success: false, message: resolution.error };
        }

        const result = applyAftermathReactionForAgent(resolution.id, reactionId, 'debug-bridge');
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

  // `__DEBUG.openRef` drives the live router. Unregistered on unmount so a torn-down
  // game view cannot be driven into a stack that no longer renders.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const open = (ref: { kind: string; id: string }, mode: 'card' | 'sheet') => {
      refRouter.open(ref as WorldRef, mode, { via: 'debug' });
    };
    window.__DEBUG?._registerRefRouterOpen?.(open);
    return () => window.__DEBUG?._registerRefRouterOpen?.(null);
  }, [refRouter]);

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerOpenModalsProvider(getDebugOpenModals);
    window.__DEBUG._registerActiveUIStateProvider(getDebugActiveUIState);
    window.__DEBUG._registerInterruptStateProvider?.(getDebugInterruptState);
    window.__DEBUG._registerOpeningUiProvider?.(() => ({ arrivalBeatOffered, clockEverRan }));
    window.__DEBUG._registerOpeningRevealProvider?.(() => openingReveal.reveal);
    window.__DEBUG._registerGiftDeliveryProvider?.(getDebugGiftDelivery);
    window.__DEBUG._registerChapterAnswerProvider?.(chapterAnswer.getDebugState);
    window.__DEBUG._registerClockHoldProvider?.(getDebugClockHold);
  }, [getDebugActiveUIState, getDebugOpenModals, getDebugInterruptState, getDebugGiftDelivery, arrivalBeatOffered, clockEverRan, chapterAnswer.getDebugState, getDebugClockHold, openingReveal.reveal]);

  // ── THR-1019: narrative-interrupt levers for browser verification ──────────
  // Browser-verify runs must reach surfaces *behind* the game's beats, and seven
  // impediments in one week (#385, #427, #445, #446, #447, #453, #455) were spent
  // hand-rolling `[role="dialog"]` click loops to get there. These route each surface
  // through its own handler — and so through the engine's beat state machine — so the
  // lever works regardless of which component renders the beat, and cannot drift from
  // the render conditions the way a DOM selector does.
  //
  // This is a verification tool, NOT a change to interrupt behavior: nothing here runs
  // unless a debug caller asks, and the whole path is DEV-only.
  const [beatSuppressionActive, setBeatSuppressionActive] = useState(false);

  /**
   * One pass over the currently-open narrative interrupts. The drain loop lives in
   * `__DEBUG.dismissBeats()`, because a successor beat only becomes visible after React
   * re-renders — a loop inside this closure would read stale state and miss the chain.
   *
   * Each branch mirrors its surface's render condition exactly, for the same reason the
   * THR-668 auto-pause set does: acting on a surface that cannot render would report a
   * dismissal that never happened.
   */
  const dismissOpenBeatInterrupts = useCallback((): BeatDismissalRecord[] => {
    const records: BeatDismissalRecord[] = [];
    const attempt = (surface: BeatInterruptSurface, run: () => void) => {
      try {
        run();
        records.push({ surface, dismissed: true });
      } catch (err) {
        // Fail-soft (NFP #4): one stuck surface must not strand the rest of the drain.
        records.push({ surface, dismissed: false, error: err instanceof Error ? err.message : String(err) });
      }
    };

    if (pendingBeat) {
      const resolveWithDefault = () => handleResolveBeat(
        selectDefaultBeatChoice(pendingBeat, getBeatDefinitionById),
      );
      if (beatEntered) {
        attempt('AscendantBeatModal', resolveWithDefault);
      } else if (!interruptsSuppressed) {
        // The offer banner does not pause the sim, but it gates the beat behind it.
        // Resolve straight through rather than entering first, so one pass clears it.
        attempt('AscendantBeatOfferBanner', resolveWithDefault);
      }
    }

    if (activeVignette && !interruptsSuppressed) {
      attempt('JourneyVignetteModal', () => {
        // Mirrors JourneyVignetteModal's own onClose: dismissing is a withdrawal.
        const withdrawn = activeVignette.data.choices.find(c => c.effects.interventionType === 'withdrawn');
        if (withdrawn) {
          handleJourneyChoice(withdrawn.id);
        } else {
          setGameState(prev => ({
            ...prev,
            pendingVignettes: (prev.pendingVignettes ?? []).filter(v => v.id !== activeVignette.id),
          }));
        }
      });
    }

    if (activeStoryBeatId && activeStoryBeatTemplate && !interruptsSuppressed) {
      attempt('StoryBeatModal', handleStoryBeatDismiss);
    }

    if (activePremonition && !interruptsSuppressed) {
      attempt('PremonitionModal', handlePremonitionDismiss);
    }

    return records;
  }, [
    activePremonition,
    activeStoryBeatId,
    activeStoryBeatTemplate,
    activeVignette,
    beatEntered,
    handleJourneyChoice,
    handlePremonitionDismiss,
    handleResolveBeat,
    handleStoryBeatDismiss,
    interruptsSuppressed,
    pendingBeat,
    setGameState,
  ]);

  // While suppression is on, clear interrupts as they arrive — this is what makes a
  // scripted `__DEBUG.tick(n)` batch survive beats that fire mid-run. Settles on its
  // own: once nothing is open the pass returns no records and no state changes.
  useEffect(() => {
    if (!import.meta.env.DEV || !beatSuppressionActive) return;
    dismissOpenBeatInterrupts();
  }, [beatSuppressionActive, dismissOpenBeatInterrupts]);

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;
    window.__DEBUG._registerBeatDismisser(dismissOpenBeatInterrupts);
    window.__DEBUG._registerBeatSuppression(setBeatSuppressionActive);
  }, [dismissOpenBeatInterrupts]);
}
