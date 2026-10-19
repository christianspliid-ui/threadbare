/**
 * useLedgerKey — what `L` does to the Ledger rail (THR-1893, frame plan § F8, § F10).
 *
 * The key itself is declared once, on the frame registry (`LEDGER_RAIL_HOTKEY`, spread
 * into `TOP_BAR_KEYS`); the top-bar hotkey hook calls this when it fires. The rule is
 * `ledgerKeyPress`: fold or unfold with the Inspector closed, the flyout with it open.
 */
import { useCallback, useRef } from 'react';
import type { GameScreenStore } from './GameScreenState';
import { ledgerKeyPress } from './ledgerFold';
import { isStageOpen } from '../stage/stageState';

export function useLedgerKey(store: GameScreenStore): () => void {
  const ref = useRef(store);
  ref.current = store;
  return useCallback(() => {
    const { state, setLedgerFoldPref, setLedgerFlyout } = ref.current;
    const next = ledgerKeyPress({
      foldPref: state.ledgerFoldPref,
      inspectorOpen: state.inspectorOpen,
      stageOpen: isStageOpen(state.stage),
      flyout: state.ledgerFlyout,
      lastSection: state.ledgerLastSection,
    });
    if (next.foldPref !== state.ledgerFoldPref) setLedgerFoldPref(next.foldPref);
    if (next.flyout !== state.ledgerFlyout) setLedgerFlyout(next.flyout);
  }, []);
}
