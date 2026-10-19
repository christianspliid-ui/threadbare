/**
 * useArmedDebugBridge — `__DEBUG.getArmedTargets()` and the arming levers (THR-1914, plan
 * § Debug inspection). The levers go through the same seams a player's press, click and
 * cast do (the hand's press, `choose`, `castOn`), so a lever exercises the real path.
 * Dev only.
 */
import { useEffect, useRef } from 'react';
import type { WorldRef } from '../../../types/worldRef';
import type { DebugArmedTargets } from '../../../debug-bridge.d';
import { refKey } from '../../../engine/views/armedTargets';
import type { CardArming } from './useCardArming';
import { handHasCard } from './useCardArming';
import type { GameState } from '../../../types/gameState';

export function useArmedDebugBridge(arming: CardArming, gameState: GameState, lensSuppressed: boolean): void {
  const latest = useRef({ arming, gameState, lensSuppressed });
  latest.current = { arming, gameState, lensSuppressed };

  useEffect(() => {
    if (!import.meta.env.DEV || !window.__DEBUG?._registerArmedBridge) return;
    window.__DEBUG._registerArmedBridge({
      getTargets: (): DebugArmedTargets | null => {
        const { arming: a, lensSuppressed: suppressed } = latest.current;
        if (!a.armed) return null;
        const vm = a.vm;
        return {
          actionId: a.armed.actionId,
          cardName: a.cardName ?? a.armed.actionId,
          targetWords: vm?.targetWords ?? '',
          origin: a.armed.origin,
          staged: a.armed.target ? refKey(a.armed.target) : null,
          note: a.armed.note,
          lit: vm ? Object.entries(vm.lit).map(([ref, e]) => ({ ref, name: e.name, state: e.state, reason: e.reason, hexKey: e.hexKey })) : [],
          map: vm ? vm.map : { lit: [], litLocked: [], hover: {} },
          emptyLine: vm?.emptyLine ?? null,
          lensSuppressed: suppressed,
        };
      },
      arm: (actionId: string) => {
        const { arming: a, gameState } = latest.current;
        if (!handHasCard(gameState, actionId)) return false;
        a.handPress.press(actionId);
        return true;
      },
      choose: (kind: string, id: string) => {
        const { arming: a } = latest.current;
        if (!a.armed) return null;
        if (kind === 'hex') {
          const [col, row] = id.split(',').map(Number);
          if (Number.isFinite(col) && Number.isFinite(row)) a.chooseHex({ col, row }, 'map');
        } else {
          a.choose({ kind, id } as WorldRef, 'map');
        }
        // The state lands on the next render; the caller reads it back with getArmedTargets().
        return { staged: null, note: null };
      },
      cast: () => latest.current.arming.castOn(),
      disarm: () => latest.current.arming.disarm(),
    });
    return () => window.__DEBUG?._registerArmedBridge?.(null);
  }, []);
}
