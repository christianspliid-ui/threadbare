/**
 * useStageDebugBridge — `__DEBUG.getStage()` and `__DEBUG.openHomedSurface(kind)`
 * (THR-1892, plan THR-1877 § Debug inspection).
 *
 * `getStage()` reports what the Stage was given and where everything landed, read live
 * from the DOM (`data-stage-panel`, `data-stage-window`) and the map handle, so an
 * assertion checks the screen, not the intent.
 *
 * `openHomedSurface(kind)` is one lever per kind through a `Record` over
 * `HomedSurfaceKind`, so a kind without a lever is a type error. S2 builds the story
 * beat's; S4 (THR-1897) the journey moment's and the emergence dilemma's, and routes the
 * premonition and the undertaking moment to their existing levers.
 */
import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { GameState } from '../../../types/gameState';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import { touchWorld } from '../../../engine/simulationRuntime';
import { homedSurfaceFor, type HomedSurfaceKind } from '../../../data/homed-surfaces';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import type { StageVM } from '../../../engine/views/stage/stageView';
import type { HexMapV2Handle } from '../../HexMapV2/HexMapV2';
import type { GameScreenStore } from '../frame/GameScreenState';
import type { InterruptResolution } from '../interruptRegistry';
import type { DebugOpenHomedSurfaceResult, DebugStageState } from '../../../debug-bridge.d';
import { isStageOpen } from './stageState';
import { getThreadsFrom } from '../../../engine/graphQueries';
import type { ThreadEdgeProperties } from '../../../types/influence';
import { buildStateSnapshot, buildVignetteData, selectTemplate } from '../../../engine/journeyEngine';
import { JOURNEY_BEAT_TEMPLATES } from '../../../data/journey-content';

/** How long a debug-staged emergence dilemma waits before `let` auto-fires. */
const DEBUG_EMERGENCE_WAIT_TICKS = 30;

type Lever = () => Promise<DebugOpenHomedSurfaceResult>;

function rectOf(selector: string): { x: number; y: number; w: number; h: number } | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

type ScrollBox = { element: string; axis: 'x' | 'y' };

/**
 * Law 57: the scroll boxes inside the panel that actually scroll, split by where they
 * scroll. A box as tall as the panel scrolls **at** the cap — the Stage's one lawful
 * scroll region, "the whole height of the panel" (THR-1895; the same rule
 * `getDialogSizes()` applies to a dialog at its cap). Any shorter box scrolls **below**
 * it, and that is the violation.
 */
function scrollingInside(panel: Element | null): { below: ScrollBox[]; atCap: ScrollBox[] } {
  const below: ScrollBox[] = [];
  const atCap: ScrollBox[] = [];
  if (!panel) return { below, atCap };
  const capPx = panel.clientHeight;
  for (const el of [panel, ...panel.querySelectorAll('*')]) {
    const style = getComputedStyle(el);
    const name = el.getAttribute('data-testid') ?? [...el.attributes].find(a => a.name.startsWith('data-'))?.name ?? el.tagName.toLowerCase();
    if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) {
      (el !== panel && el.clientHeight >= capPx - STAGE_SCROLL_CAP_TOLERANCE_PX ? atCap : below).push({ element: name, axis: 'y' });
    }
    if (/(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1) below.push({ element: name, axis: 'x' });
  }
  return { below, atCap };
}

/** A column as tall as the panel, give or take its border, counts as at the cap. */
const STAGE_SCROLL_CAP_TOLERANCE_PX = 2;

const later = (kind: HomedSurfaceKind, how: string): Lever => async () => ({ opened: false, reason: `${kind} has no one-call lever yet — ${how}` });

export function useStageDebugBridge(args: {
  gameScreen: GameScreenStore;
  hexMapRef: RefObject<HexMapV2Handle>;
  interruptResolution: InterruptResolution;
  /** The view model of the moment on the Stage now. */
  stageVM: StageVM | null;
  setGameState: Dispatch<SetStateAction<GameState>>;
  runtime: SimulationRuntime | null;
}): void {
  const latest = useRef(args);
  latest.current = args;

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG) return;

    const getStage = (): DebugStageState => {
      const { gameScreen, hexMapRef, interruptResolution, stageVM } = latest.current;
      const stage = gameScreen.state.stage;
      const open = isStageOpen(stage);
      const map = hexMapRef.current;
      const vm = open && stageVM && stageVM.kind === stage.kind ? stageVM : null;
      const windowRect = open ? rectOf('[data-stage-window]') : null;
      const lit = vm?.litHex?.split(',').map(Number) ?? null;
      const vp = lit && map ? map.getViewportForHex(lit[0], lit[1]) : null;
      const litHexScreen = vp ? { x: vp.x, y: vp.y } : null;
      const inWindow = Boolean(litHexScreen && windowRect
        && litHexScreen.x >= windowRect.x && litHexScreen.x <= windowRect.x + windowRect.w
        && litHexScreen.y >= windowRect.y && litHexScreen.y <= windowRect.y + windowRect.h);
      return {
        open: open && stage.kind ? {
          kind: stage.kind,
          surfaceId: homedSurfaceFor(stage.kind)?.surfaceId ?? stage.kind,
          phase: stage.phase === 'idle' ? 'entering' : stage.phase,
          layout: vm?.layout ?? 'compact',
        } : null,
        vm,
        held: interruptResolution.held.map(h => ({ kind: h.kind, behind: h.behind ?? null })),
        panelRect: open ? rectOf('[data-stage-panel]') : null,
        windowRect,
        litHexScreen,
        litHexInWindow: inWindow,
        camera: open && stage.cameraMode && map ? { k: map.getCameraState().k, mode: stage.cameraMode } : null,
        mapDim: map?.getStageFocusState() ?? null,
        folded: {
          inspector: open && !stage.inspectorOverStage,
          ledgerRail: open && document.querySelector('[data-ledger-state]') === null,
          lensSuppressed: gameScreen.state.lensSuppressed,
          mapControlsHidden: document.querySelector('[data-testid="map-corner-chrome"]') === null,
        },
        ...(() => {
          const scroll = open ? scrollingInside(document.querySelector('[data-stage-panel]')) : { below: [], atCap: [] };
          return { scrollingBelowCap: scroll.below, scrollingAtCap: scroll.atCap };
        })(),
        // THR-1942 — the count the hand bar's "more cards below" line reads, off its DOM.
        handCardsBelowBar: Number(document.querySelector('[data-testid="nudge-hand-bar"]')?.getAttribute('data-cards-below') ?? 0) || 0,
      };
    };

    const storyBeat: Lever = () => new Promise(resolve => {
      const { setGameState, runtime } = latest.current;
      setGameState(prev => {
        const asc = prev.graph.getNode(prev.ascendantId);
        if (!asc) {
          resolve({ opened: false, reason: 'no god in the world' });
          return prev;
        }
        const open = (prev.unifiedActions ?? []).filter(a => !a.resolved && getUnifiedTemplateById(a.templateId));
        const ua = open.find(a => a.effectiveTier === 'story_beat') ?? open[0];
        if (!ua) {
          resolve({ opened: false, reason: 'no unresolved chapter to stage — tick the world first (__DEBUG.tick(n))' });
          return prev;
        }
        (asc.properties as Record<string, unknown>).pacingActiveStoryBeat = ua.actionId;
        if (runtime) touchWorld(runtime);
        resolve({ opened: true });
        // GameView's story-beat memo re-reads on `worldVersion`, as the dismiss handler bumps it.
        const version = (prev as GameState & { worldVersion?: number }).worldVersion ?? 0;
        return { ...prev, worldVersion: version + 1 } as GameState;
      });
    });

    // THR-1897 — The First's journey moment: a real beat for her current phase, queued now.
    const journeyVignette: Lever = () => new Promise(resolve => {
      const { setGameState } = latest.current;
      setGameState(prev => {
        const first = getThreadsFrom(prev.graph, prev.ascendantId)
          .find(e => (e.properties as unknown as ThreadEdgeProperties).courtPosition === 'the_first');
        const agent = first ? prev.graph.getNode(first.target) : undefined;
        if (!first || !agent) {
          resolve({ opened: false, reason: 'no First is bonded — use ?view=game&seeded' });
          return prev;
        }
        const props = first.properties as unknown as ThreadEdgeProperties;
        const phase = props.storyPhase && props.storyPhase !== 'return' ? props.storyPhase : 'call';
        const snapshot = buildStateSnapshot(prev.graph, agent.id, props);
        const picked = selectTemplate(JOURNEY_BEAT_TEMPLATES, phase, snapshot, prev.seed + prev.tick, props.beatHistory ?? []);
        if (!picked) {
          resolve({ opened: false, reason: `no journey beat for the ${phase} phase` });
          return prev;
        }
        const data = buildVignetteData(agent.id, agent.name, phase, 0, prev.doomClock.progress, picked.template, picked.variant, snapshot, prev.tick);
        resolve({ opened: true });
        return {
          ...prev,
          pendingVignettes: [
            ...(prev.pendingVignettes ?? []).filter(v => v.data.agentId !== agent.id),
            { id: `vignette_debug_${agent.id}_${prev.tick}`, data, priority: 100, queuedTick: prev.tick },
          ],
        };
      });
    });

    // THR-1897 — a ruin's emergence dilemma: the nearest-to-hand elder ruin and the First
    // (or any mortal), with a transformed outcome so every card can be chosen.
    const emergenceDilemma: Lever = () => new Promise(resolve => {
      const { setGameState } = latest.current;
      setGameState(prev => {
        const ruin = prev.graph.getNodesByType('location')
          .find(n => n.properties.locationType === 'elder_ruin' || n.properties.locationSubtype === 'elder_ruin');
        if (!ruin) {
          resolve({ opened: false, reason: 'no elder ruin in this world' });
          return prev;
        }
        const first = getThreadsFrom(prev.graph, prev.ascendantId)
          .find(e => (e.properties as unknown as ThreadEdgeProperties).courtPosition === 'the_first');
        const agentId = first?.target ?? prev.graph.getNodesByType('actor').find(n => n.properties.actorType === 'individual')?.id;
        if (!agentId) {
          resolve({ opened: false, reason: 'no mortal in the world' });
          return prev;
        }
        resolve({ opened: true });
        return {
          ...prev,
          pendingEmergenceDecision: {
            delveId: `delve_debug_${prev.tick}`,
            agentId,
            ruinId: ruin.id,
            ruinMagnitude: 1,
            sphereAlignment: 'force',
            consequenceRoll: 'transformed',
            autoFiresTick: prev.tick + DEBUG_EMERGENCE_WAIT_TICKS,
          },
        };
      });
    });

    // THR-1897 — routes to the existing levers: a whisper about The First opens at once (a compulsion is
    // composed at a scoring moment: `forcePremonition('@hero', 'compulsion')` then `tick(1)`);
    // `forceMoments(true)` makes the next undertaking checkpoint an interrupt.
    const premonition: Lever = async () => {
      // About The First when one is bonded (the mortal a god dreams through), else `@hero`.
      const firstId = await new Promise<string | null>(resolve => {
        latest.current.setGameState(prev => {
          resolve(getThreadsFrom(prev.graph, prev.ascendantId)
            .find(e => (e.properties as unknown as ThreadEdgeProperties).courtPosition === 'the_first')?.target ?? null);
          return prev;
        });
      });
      const result = await window.__DEBUG?.forcePremonition?.(firstId ?? '@hero', 'whisper');
      if (!result || 'error' in result) return { opened: false, reason: result && 'error' in result ? result.error : 'no premonition lever' };
      return { opened: true };
    };
    const undertakingMoment: Lever = async () => {
      await window.__DEBUG?.forceMoments?.(true);
      return { opened: false, reason: 'armed — the next undertaking checkpoint opens on the Stage; tick the world (__DEBUG.tick(n))' };
    };

    const levers: Record<HomedSurfaceKind, Lever> = {
      'warm-start': later('warm-start', 'it opens on a warm start (?warm)'),
      'meet-the-first': later('meet-the-first', 'use ?view=game&firstunmet'),
      'threading-rite': later('threading-rite', 'use __DEBUG.openThreadingRite(agentId)'),
      encounter: later('encounter', 'use ?forceencounters or __DEBUG.spawnEncounter; it plays on the Stage'),
      premonition,
      'journey-vignette': journeyVignette,
      'story-beat': storyBeat,
      'ascendant-beat': later('ascendant-beat', 'use __DEBUG.forceOffering()'),
      'choice-set': later('choice-set', 'cast a choice-set card from the god rail'),
      'emergence-dilemma': emergenceDilemma,
      'divine-receipt': later('divine-receipt', 'it opens when a divine act resolves'),
      'chapter-ledger': later('chapter-ledger', 'open it from the Ledger rail'),
      'divine-court': later('divine-court', 'open it from the god rail'),
      'undertaking-moment': undertakingMoment,
      'event-popup': later('event-popup', 'it opens on a doom stage or the Mandate'),
      'age-twilight': later('age-twilight', 'use __DEBUG.beginTwilight()'),
      'cycle-harvest': later('cycle-harvest', 'it opens at the end of the age'),
    };

    window.__DEBUG._registerStageProvider?.(getStage);
    window.__DEBUG._registerOpenHomedSurface?.(async (kind: string) => {
      const lever = (levers as Record<string, Lever | undefined>)[kind];
      return lever ? lever() : { opened: false, reason: `unknown kind '${kind}' — see HOMED_SURFACES (src/data/homed-surfaces.ts)` };
    });
  }, []);
}
