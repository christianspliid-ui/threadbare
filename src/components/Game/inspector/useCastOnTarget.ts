/**
 * useCastOnTarget — the one cast path (THR-1911, Inspector plan § D9).
 *
 * Given a card and a target it builds the target's context through
 * `TARGET_CONTEXT_BUILDERS`, re-reads that card's slot with the same parameters every
 * hand uses (`actOnSlots`), and if the card is available runs `preparePlayerCast` → the
 * cast receipt toast → `commitPlayerCast`, as the two retired `ActionDrawer` fire paths
 * (`handleWheelSlotClick`, `handleNonAgentSlotClick`) did. The scry card, Meet The First
 * and the agenda-picker interventions keep their own flows and are handed back to the
 * caller unchanged.
 *
 * Fail-soft (NFP #4): a gone target, an unknown card or a locked one casts nothing and
 * reports why; a throw from deeper in the dispatch is caught and logged.
 */
import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../../types/gameState';
import type { SphereName } from '../../../types';
import type { ToastItem } from '../../../types/notification';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import type { WheelSlot } from '../../../engine/wheel';
import { actOnSlots, castHexOf, type ActOnTarget } from '../../../engine/views/subjects/actOn';
import { templateIdFromSlotId } from '../../../engine/targetActions';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { preparePlayerCast, commitPlayerCast } from '../../../engine/playerCastDispatch';
import { castOpensRite } from '../../../engine/threadingRite';
import { getSphereColor } from '../../../data/sphereIcons';
import { actionBlockedReason } from '../../../data/action-card-display';
import { buildCastReceipt } from '../hooks/castReceipt';

/** The drawer's Meet The First slot id, kept so the card reads the same everywhere. */
export const MEET_THE_FIRST_SLOT_ID = 'meet_the_first';
/** The scry card's slot id on a person's hand. */
export const SCRY_SLOT_ID = 'scry';

/** How long a dispatch toast stays up (the drawer's value). */
const CAST_TOAST_MS = 4000;

export interface CastOutcome {
  cast: boolean;
  /** Why nothing was cast, in words (Law 47), or null. */
  reason: string | null;
}

export interface CastOnTargetDeps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  runtime: SimulationRuntime | null;
  primarySphere: SphereName;
  pushToast: (toast: ToastItem) => void;
  particleBurst?: (col: number, row: number, color: string) => void;
  playCastSound?: (sphere: SphereName, big: boolean) => void;
  /** A person's intervention card opens the agenda picker (the drawer's intervention branch). */
  beginIntervention?: (agentId: string, slot: WheelSlot) => void;
  openScry?: () => void;
  startMeeting?: (locationId: string) => void;
}

export function useCastOnTarget(deps: CastOnTargetDeps): (actionId: string, target: ActOnTarget) => CastOutcome {
  const { gameState, setGameState, runtime, primarySphere, pushToast, particleBurst, playCastSound, beginIntervention, openScry, startMeeting } = deps;

  return useCallback((actionId: string, target: ActOnTarget): CastOutcome => {
    if (actionId === SCRY_SLOT_ID) {
      openScry?.();
      return { cast: !!openScry, reason: null };
    }
    if (actionId === MEET_THE_FIRST_SLOT_ID) {
      if (target.kind !== 'location' && target.kind !== 'sublocation') return { cast: false, reason: null };
      startMeeting?.(target.id);
      return { cast: !!startMeeting, reason: null };
    }

    const read = actOnSlots(gameState, target);
    if (!read) return { cast: false, reason: null };
    const slot = read.slots.find(s => s.id === actionId);
    if (!slot) return { cast: false, reason: null };
    if (!slot.available) return { cast: false, reason: actionBlockedReason(slot.lockedReason, slot.rangeStatus) ?? null };

    if (slot.type === 'intervention' && slot.interventionType && target.kind === 'agent') {
      beginIntervention?.(target.id, slot);
      return { cast: !!beginIntervention, reason: null };
    }
    if (slot.type !== 'target_action') return { cast: false, reason: null };

    const templateId = templateIdFromSlotId(slot.id);
    const template = templateId ? getUnifiedTemplateById(templateId) : undefined;
    if (!templateId || !template) {
      console.warn(`[castOnTarget] template not found for ${slot.id}`);
      return { cast: false, reason: null };
    }

    try {
      const sphere = (slot.sphere ?? template.sphereAffinity ?? primarySphere) as SphereName;
      if (playCastSound && slot.sphere) playCastSound(slot.sphere as SphereName, false);
      const targetId = read.ctx.nodeId;
      const cast = preparePlayerCast({
        graph: gameState.graph,
        ascendantId: gameState.ascendantId,
        template,
        templateId,
        targetId,
        tick: gameState.tick,
        seed: gameState.seed,
        sphere,
        runtime: runtime ?? undefined,
      });

      // The receipt names the card and the target (THR-1603). An Agent Thread on a mortal
      // opens the Rite of the Thread, which tells the fact itself (PC-5).
      const targetName = targetId === gameState.ascendantId ? null : read.ctx.displayName;
      const message = buildCastReceipt(template, targetName).message;
      const opensRite = target.kind === 'agent' && castOpensRite(gameState.graph, gameState.ascendantId, templateId, targetId);
      if (!opensRite) {
        pushToast({
          id: `toast_cast_${Date.now()}`,
          message,
          sphere,
          count: 1,
          createdTick: gameState.tick,
          expiresAt: Date.now() + CAST_TOAST_MS,
        });
      }
      const hex = castHexOf(gameState, target, targetId);
      if (particleBurst && hex) particleBurst(hex.col, hex.row, getSphereColor(sphere));

      setGameState(prev => commitPlayerCast(prev, opensRite
        ? { cast }
        : {
            cast,
            event: {
              idPrefix: target.kind === 'agent' ? 'evt_action' : 'evt_target_action',
              message: message + cast.buffParenthetical,
              isInterventionBeat: target.kind === 'agent',
            },
          }));
      return { cast: true, reason: null };
    } catch (err) {
      console.warn('[castOnTarget] failed to cast:', err);
      return { cast: false, reason: null };
    }
  }, [gameState, setGameState, runtime, primarySphere, pushToast, particleBurst, playCastSound, beginIntervention, openScry, startMeeting]);
}
