/**
 * useCardArming — card-first from the hand (THR-1914, Inspector plan § D9 way 3, call 14).
 *
 * The god presses a card in the hand: it arms. While armed, every thing it can land on is
 * lit on the map and in the Inspector and the rest dims; navigation stays live. A map
 * click or a drop **chooses** a target (the banner turns into the commit line); "Cast here"
 * on an Inspector row, or "Cast on Shutash" on the commit line, **casts** — arm, then cast
 * (Law 48), through the one cast path (`useCastOnTarget`).
 *
 * This hook is the only writer of `GameScreenState.armed`. It also:
 * - holds the lens off while a card is armed, so two dims never stack (THR-1878 D2) —
 *   GameView's one `lensSuppressed` writer reads `armed` beside the Stage;
 * - registers the Esc layer above the dialog band, so Esc puts the card down first;
 * - clears an arm whose card left the hand, saying so ("… left your hand. Nothing was
 *   spent.") in the banner, or as a toast with the Inspector closed;
 * - emits `ui_card_arm` for every armed / staged / cast / refused / disarmed.
 *
 * Fail-soft (NFP #4): every engine read is guarded; a throw logs and leaves the arm as it was.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { GameState } from '../../../types/gameState';
import type { WorldRef } from '../../../types/worldRef';
import type { ToastItem } from '../../../types/notification';
import type { AnyRef } from '../../../types/contentRef';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import type { UiCardArmEvent, UiCardArmOrigin } from '../../../types/traces/ui-traces';
import { readView } from '../../../engine/views/readView';
import {
  armedCardName,
  armedTargetName,
  armedTargetsSelector,
  evaluateCardOnTarget,
  type ArmedTargetsVM,
  type CardOnTarget,
} from '../../../engine/views/armedTargets';
import { actOnTargetForRef } from '../../../engine/views/subjects/actOn';
import { isGodCard } from '../../../engine/views/godRail';
import { isActionRevealed } from '../../../engine/actionUnlock';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { ARMED_WORDS } from '../../../data/view-content';
import { ARMED_CLEARED_LINE_MS } from '../../../engine/views/viewConstants';
import { emitTrace } from '../../../engine/traceBuffer';
import type { GameScreenStore } from '../frame/GameScreenState';
import type { HandPressValue } from '../frame/HandPressContext';
export { CARD_DRAG_MIME } from '../frame/HandPressContext';
import { useEscapeLayer } from '../../shared/useEscapeLayer';
import { Z_BAND } from '../../shared/zBands';
import { isInspectorOpen } from './inspectorState';
import { armForDrag, noteArmed, pressHandCard, stageTarget, type ArmedSlice } from './armedState';
import type { CastOnTarget, CastOutcome } from './useCastOnTarget';
import { godRailStamp } from '../../../engine/views/godRail';

/** The Esc layer's label in `__DEBUG.getEscapeLayers()`. */
export const ARMED_ESCAPE_LABEL = 'Armed card';

/** How long a cleared-arm toast stays up with the Inspector closed. */
const CLEARED_TOAST_MS = ARMED_CLEARED_LINE_MS;

export interface CardArmingDeps {
  gameState: GameState;
  runtime: SimulationRuntime | null;
  /** The one cast path. */
  castOnTarget: CastOnTarget;
  pushToast: (toast: ToastItem) => void;
  /** Open a page in the Inspector — a map click on a hex with several lit targets opens it. */
  openInspector: (subject: AnyRef, size: 'docked' | 'wide', fromMap?: boolean) => void;
  /** The debug fog lever: with fog off every hex counts as seen, as the lenses read it. */
  fogOff: boolean;
  /**
   * The screen store. GameView owns it and sits above its own provider, so the hook takes
   * it as an argument rather than reading the context (which is inert there).
   */
  screenStore: GameScreenStore;
}

export interface CardArming {
  armed: ArmedSlice;
  /** The lit targets for the armed card, or null. */
  vm: ArmedTargetsVM | null;
  /** The card's player-facing name, or null. */
  cardName: string | null;
  /** The god rail's press seam (replaces the frame's Codex default). */
  handPress: HandPressValue;
  /** The armed card on one ref (rows the build did not draw — Connections are open). */
  evaluate: (ref: WorldRef) => CardOnTarget;
  /** A map click or a drop on a thing: stage it, or answer why not. Never casts. */
  choose: (ref: WorldRef, origin: UiCardArmOrigin) => void;
  /** A map click or a drop on a hex. */
  chooseHex: (coord: { col: number; row: number }, origin: UiCardArmOrigin) => void;
  /** Cast on a ref ("Cast here"), or on the staged target when none is given. */
  castOn: (ref?: WorldRef) => CastOutcome;
  /** Put the card down. */
  disarm: () => void;
  /** The name a cast on this ref lands on. */
  targetName: (ref: WorldRef) => string;
  /** The staged target's commit line ("Illuminating Whisper on Shutash. …"), or null. */
  commitLine: string | null;
}

/** Whether the card is still in the god's hand: a revealed god card. */
export function handHasCard(state: Pick<GameState, 'unlockedActionIds'>, actionId: string): boolean {
  const t = getUnifiedTemplateById(actionId);
  return !!t && isGodCard(t) && isActionRevealed(t, state.unlockedActionIds);
}

function traceArm(tick: number, actionId: string, event: UiCardArmEvent, origin: UiCardArmOrigin, ref?: WorldRef | null, reason?: string): void {
  const on = ref ? ` on ${ref.kind} ${ref.id}` : '';
  emitTrace({
    tick,
    category: 'ui_card_arm',
    actionId,
    event,
    origin,
    ...(ref ? { targetKind: ref.kind, targetId: ref.id } : {}),
    ...(reason ? { reason } : {}),
    summary: `ui_card_arm: ${actionId} ${event}${on} (${origin})${reason ? ` — ${reason}` : ''}`,
  });
}

export function useCardArming({ gameState, runtime, castOnTarget, pushToast, openInspector, fogOff, screenStore }: CardArmingDeps): CardArming {
  const { state: screen, setArmed, setArmedCleared } = screenStore;
  const armed = screen.armed;
  const inspectorOpen = isInspectorOpen(screen.inspector);

  // Read the latest values inside stable callbacks.
  const live = useRef({ gameState, armed, inspectorOpen });
  live.current = { gameState, armed, inspectorOpen };

  const template = armed ? getUnifiedTemplateById(armed.actionId) : undefined;
  const cardName = template ? armedCardName(template) : null;

  const vm = useMemo<ArmedTargetsVM | null>(() => {
    if (!armed) return null;
    return readView(runtime, gameState, armedTargetsSelector, { actionId: armed.actionId, fogOff, stamp: armedTargetsStamp(gameState) }, gameState.tiles);
    // The world is mutated in place: re-read on every state the game hands down.
  }, [armed?.actionId, gameState, runtime, fogOff]); // eslint-disable-line react-hooks/exhaustive-deps

  const evaluate = useCallback((ref: WorldRef): CardOnTarget => {
    const { armed: a, gameState: s } = live.current;
    if (!a) return { state: 'not_a_target', reason: null, slotId: null };
    try {
      return evaluateCardOnTarget(s, a.actionId, ref);
    } catch (err) {
      console.warn('[useCardArming] evaluate failed:', err);
      return { state: 'not_a_target', reason: null, slotId: null };
    }
  }, []);

  const targetName = useCallback((ref: WorldRef): string => {
    try {
      return armedTargetName(live.current.gameState, ref) ?? ref.id;
    } catch {
      return ref.id;
    }
  }, []);

  const disarm = useCallback(() => {
    const a = live.current.armed;
    if (!a) return;
    traceArm(live.current.gameState.tick, a.actionId, 'disarmed', a.origin, a.target);
    setArmed(null);
  }, [setArmed]);

  const handPress = useMemo<HandPressValue>(() => ({
    press: (cardId: string) => {
      const prev = live.current.armed;
      const next = pressHandCard(prev, cardId, 'hand');
      if (prev && (!next || next.actionId !== prev.actionId)) traceArm(live.current.gameState.tick, prev.actionId, 'disarmed', prev.origin, prev.target);
      if (next && next !== prev) traceArm(live.current.gameState.tick, cardId, 'armed', 'hand');
      setArmedCleared(null);
      setArmed(next);
    },
    dragStart: (cardId: string) => {
      const prev = live.current.armed;
      const next = armForDrag(prev, cardId);
      if (next && (!prev || prev.actionId !== cardId)) traceArm(live.current.gameState.tick, cardId, 'armed', 'drag');
      setArmedCleared(null);
      setArmed(next);
    },
    armedActionId: armed?.actionId ?? null,
  }), [armed?.actionId, setArmed, setArmedCleared]);

  const choose = useCallback((ref: WorldRef, origin: UiCardArmOrigin) => {
    const a = live.current.armed;
    if (!a) return;
    const name = cardNameOf(a.actionId);
    const verdict = evaluate(ref);
    const t = live.current.gameState.tick;
    if (verdict.state === 'castable') {
      traceArm(t, a.actionId, 'staged', origin, ref);
      setArmed(prev => stageTarget(prev, ref));
    } else if (verdict.state === 'locked') {
      traceArm(t, a.actionId, 'refused', origin, ref, verdict.reason ?? 'locked');
      setArmed(prev => noteArmed(prev, verdict.reason ?? ARMED_WORDS.notATarget.replace('{card}', name)));
    } else {
      traceArm(t, a.actionId, 'refused', origin, ref, 'not_a_target');
      setArmed(prev => noteArmed(prev, verdict.reason ?? ARMED_WORDS.notATarget.replace('{card}', name)));
    }
  }, [evaluate, setArmed]);

  const chooseHex = useCallback((coord: { col: number; row: number }, origin: UiCardArmOrigin) => {
    const a = live.current.armed;
    if (!a) return;
    const key = `${coord.col},${coord.row}`;
    const entries = vm ? Object.values(vm.lit).filter(e => e.hexKey === key) : [];
    const castable = entries.filter(e => e.state === 'castable');
    if (castable.length > 1 || (castable.length === 0 && entries.length > 1)) {
      // Several things here: open the land page with them lit, and let the god pick by name.
      openInspector({ kind: 'hex', id: key }, 'docked', true);
      return;
    }
    const only = castable[0] ?? entries[0];
    choose(only ? only.ref : { kind: 'hex', id: key }, origin);
  }, [vm, choose, openInspector]);

  const castOn = useCallback((ref?: WorldRef): CastOutcome => {
    const { armed: a, gameState: s } = live.current;
    const target = ref ?? a?.target ?? null;
    if (!a || !target) return { cast: false, reason: null };
    const origin: UiCardArmOrigin = ref ? 'inspector' : a.origin;
    const verdict = evaluate(target);
    const actOn = actOnTargetForRef(s, target);
    if (verdict.state !== 'castable' || !verdict.slotId || !actOn) {
      const reason = verdict.reason ?? ARMED_WORDS.notATarget.replace('{card}', cardNameOf(a.actionId));
      traceArm(s.tick, a.actionId, 'refused', origin, target, verdict.state === 'locked' ? (verdict.reason ?? 'locked') : 'not_a_target');
      setArmed(prev => noteArmed(prev, reason));
      return { cast: false, reason };
    }
    let outcome: CastOutcome;
    try {
      // Re-read this card alone: the full hand stops at MAX_SLOTS, and a lit card must cast.
      const template = getUnifiedTemplateById(a.actionId);
      outcome = castOnTarget(verdict.slotId, actOn, template ? [template] : undefined);
    } catch (err) {
      console.warn('[useCardArming] cast failed:', err);
      outcome = { cast: false, reason: null };
    }
    if (outcome.cast) {
      traceArm(s.tick, a.actionId, 'cast', origin, target);
      setArmed(null);
    } else {
      traceArm(s.tick, a.actionId, 'refused', origin, target, outcome.reason ?? 'cast_refused');
      // Every refusal answers (Law 47): the reason, or the not-a-target line.
      setArmed(prev => noteArmed(prev, outcome.reason ?? ARMED_WORDS.notATarget.replace('{card}', cardNameOf(a.actionId))));
    }
    return outcome;
  }, [evaluate, castOnTarget, setArmed]);

  const isArmed = armed !== null;

  // Esc puts the card down first (above the dialog band, plan § Debug inspection).
  useEscapeLayer(isArmed, disarm, Z_BAND.modalAboveInterrupt, ARMED_ESCAPE_LABEL);

  // An arm whose card left the hand clears itself, and says so; nothing was spent.
  const armedId = armed?.actionId ?? null;
  const inHand = armedId ? handHasCard(gameState, armedId) : true;
  useEffect(() => {
    const a = live.current.armed;
    if (!a || inHand) return;
    const line = ARMED_WORDS.cleared.replace('{card}', cardNameOf(a.actionId));
    traceArm(live.current.gameState.tick, a.actionId, 'refused', a.origin, a.target, 'card_left_hand');
    setArmed(null);
    if (live.current.inspectorOpen) {
      setArmedCleared(line);
    } else {
      pushToast({ id: `toast_armed_cleared_${Date.now()}`, message: line, count: 1, createdTick: live.current.gameState.tick, expiresAt: Date.now() + CLEARED_TOAST_MS });
    }
  }, [armedId, inHand, setArmed, setArmedCleared, pushToast]);

  const cleared = screen.armedCleared;
  useEffect(() => {
    if (!cleared) return;
    const id = setTimeout(() => setArmedCleared(null), ARMED_CLEARED_LINE_MS);
    return () => clearTimeout(id);
  }, [cleared, setArmedCleared]);

  const commitLine = useMemo(() => {
    if (!armed?.target || !cardName) return null;
    const head = ARMED_WORDS.commit.replace('{card}', cardName).replace('{name}', targetName(armed.target));
    const effect = armed ? evaluate(armed.target).effectsLine : null;
    return effect ? `${head} ${effect}` : head;
    // gameState: the target's name and effect line read the live world.
  }, [armed, cardName, targetName, evaluate, gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  return { armed, vm, cardName, handPress, evaluate, choose, chooseHex, castOn, disarm, targetName, commitLine };
}

/**
 * What the verdicts read that a cast changes without moving `worldVersion`: the pool, the
 * held and pending actions, the god's covenants, and the avatar's hex (the range gate).
 */
export function armedTargetsStamp(state: GameState): string {
  const at = state.graph.getNode(state.ascendantId)?.properties;
  return [godRailStamp(state), (state.controlEffects ?? []).length, at?.hexCol ?? '', at?.hexRow ?? '', state.visibilityMap?.size ?? 0].join('|');
}

function cardNameOf(actionId: string): string {
  const t = getUnifiedTemplateById(actionId);
  return t ? armedCardName(t) : actionId;
}
