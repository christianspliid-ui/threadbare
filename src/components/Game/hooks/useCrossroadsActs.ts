/**
 * useCrossroadsActs — the Crossroads row's lean and lift (THR-1928; plan
 * `Docs/plans/2026-10-14-thr-1926-the-crossroads.md` § UI pillar, the
 * `handleCompulsionChoice` pattern).
 *
 * Placement runs once against the live state ref (it writes `crossroadsLean` on the node
 * in place, and a StrictMode double-invoked updater would refuse `held` the second time);
 * the `setGameState` updater only spends, through `spendPremonitionEssence` +
 * `withEssenceSpend(…, 'crossroads')` (THR-1783) — the same seam as `__DEBUG.leanCrossroads`.
 * Both writes touch the world (no change detection on graph identity) and hand down a new
 * state so the Inspector rebuilds the row in its held / unheld shape at once (Law 47).
 *
 * Placement does not toast — the row's held line is the acknowledgement. A refusal comes
 * back as the strip's reason line. A lift toasts "You lift your hand from Kael." (no refund).
 */
import { useCallback, useMemo, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { GameState } from '../../../types/gameState';
import type { ToastItem } from '../../../types/notification';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import { touchWorld } from '../../../engine/simulationRuntime';
import { placeCrossroadsLean, liftCrossroadsLean } from '../../../engine/crossroadsActions';
import { spendPremonitionEssence } from '../../../engine/premonitionActions';
import { withEssenceSpend } from '../../../engine/essenceMovement';
import type { CardActHandlers, CardActResult } from '../../shared/CardActStrip';
import type { CardActOffer, CardsActStrip } from '../../../types/detailPage';

/** How long the lift toast stays (ms). NFP #1. */
export const CROSSROADS_TOAST_MS = 5000;

export interface CrossroadsActsDeps {
  gameStateRef: MutableRefObject<GameState>;
  runtime: SimulationRuntime | null;
  setGameState: Dispatch<SetStateAction<GameState>>;
  pushToast: (toast: ToastItem) => void;
}

/**
 * Lean on one road, named by identity — the road the player armed. A road the live reading
 * no longer holds is refused `stale_option` by `placeCrossroadsLean`, spending nothing.
 * Pure of React: the hook and the tests call it.
 */
export function leanOnRoad(deps: CrossroadsActsDeps, agentId: string, road: CardActOffer['road'], direction: CardActOffer['direction']): CardActResult {
  const result = placeCrossroadsLean(deps.gameStateRef.current, agentId, road, direction);
  if (!result.success || !result.sphere) return { ok: false, message: result.message };
  if (deps.runtime) touchWorld(deps.runtime);
  const sphere = result.sphere;
  const cost = result.essenceCost;
  deps.setGameState(prev => {
    const pool = spendPremonitionEssence(prev.essencePool, sphere, cost);
    return { ...prev, ...withEssenceSpend(prev, pool, 'crossroads') };
  });
  return { ok: true };
}

/** Lift the held lean (no refund) and say so. */
export function liftLean(deps: CrossroadsActsDeps, agentId: string): CardActResult {
  const live = deps.gameStateRef.current;
  const result = liftCrossroadsLean(live, agentId);
  if (!result.success) return { ok: false, message: result.message };
  if (deps.runtime) touchWorld(deps.runtime);
  deps.setGameState(prev => ({ ...prev }));
  deps.pushToast({
    id: `toast_crossroads_lift_${agentId}_${live.tick}`,
    message: result.message,
    count: 1,
    createdTick: live.tick,
    expiresAt: Date.now() + CROSSROADS_TOAST_MS,
    actorId: agentId,
  });
  return { ok: true };
}

export function useCrossroadsActs(deps: CrossroadsActsDeps): CardActHandlers {
  const { gameStateRef, runtime, setGameState, pushToast } = deps;
  const fire = useCallback((strip: CardsActStrip, offer: CardActOffer): CardActResult => {
    if (strip.kind !== 'crossroads') return { ok: false };
    return leanOnRoad({ gameStateRef, runtime, setGameState, pushToast }, strip.subjectId, offer.road, offer.direction);
  }, [gameStateRef, runtime, setGameState, pushToast]);
  const lift = useCallback((strip: CardsActStrip): CardActResult => {
    if (strip.kind !== 'crossroads') return { ok: false };
    return liftLean({ gameStateRef, runtime, setGameState, pushToast }, strip.subjectId);
  }, [gameStateRef, runtime, setGameState, pushToast]);
  return useMemo(() => ({ fire, lift }), [fire, lift]);
}
