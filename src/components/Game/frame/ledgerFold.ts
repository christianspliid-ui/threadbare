/**
 * The Ledger rail's fold, as pure rules (THR-1893, frame plan § F8).
 *
 * Two reasons to fold, one rail: the player folded it (`L`, the Fold control; a
 * remembered preference, Law 51) or the docked Inspector is open. A Stage moment
 * hides it entirely. Precedence: hidden (Stage) › strip (Inspector, or the player's
 * fold) › open. Closing the Inspector restores the player's choice, because the
 * preference is never overwritten by the Inspector.
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | LEDGER_FOLDED_KEY | threadbare.ui.frame.ledgerFolded | The player's fold (Law 51) |
 */
import type { LedgerSectionId } from '../../../data/frame-registry';

export const LEDGER_FOLDED_KEY = 'threadbare.ui.frame.ledgerFolded';

export type LedgerRailState = 'open' | 'strip' | 'hidden';
export type LedgerFoldReason = 'player' | 'inspector' | 'stage' | null;

export interface LedgerFoldInputs {
  foldPref: boolean;
  inspectorOpen: boolean;
  /** THR-1877's `stage.phase !== 'idle'`; false until THR-1892 adds the read. */
  stageOpen: boolean;
}

export function ledgerRailState({ foldPref, inspectorOpen, stageOpen }: LedgerFoldInputs): LedgerRailState {
  if (stageOpen) return 'hidden';
  if (inspectorOpen || foldPref) return 'strip';
  return 'open';
}

/** Why the rail is not open; the Stage outranks the Inspector, which outranks the player. */
export function ledgerFoldReason({ foldPref, inspectorOpen, stageOpen }: LedgerFoldInputs): LedgerFoldReason {
  if (stageOpen) return 'stage';
  if (inspectorOpen) return 'inspector';
  if (foldPref) return 'player';
  return null;
}

export interface LedgerKeyResult {
  foldPref: boolean;
  flyout: LedgerSectionId | null;
}

/**
 * `L`: with the Inspector closed it folds or unfolds; with it open it opens or closes
 * the flyout on the last-used section. During a Stage moment it does nothing.
 */
export function ledgerKeyPress(
  inputs: LedgerFoldInputs & { flyout: LedgerSectionId | null; lastSection: LedgerSectionId },
): LedgerKeyResult {
  if (inputs.stageOpen) return { foldPref: inputs.foldPref, flyout: inputs.flyout };
  if (inputs.inspectorOpen) {
    return { foldPref: inputs.foldPref, flyout: inputs.flyout ? null : inputs.lastSection };
  }
  return { foldPref: !inputs.foldPref, flyout: null };
}

/** Fail-soft (NFP #4): private browsing throws; the designed failure is "rail open". */
export function readLedgerFoldedPref(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(LEDGER_FOLDED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeLedgerFoldedPref(folded: boolean): void {
  try {
    localStorage.setItem(LEDGER_FOLDED_KEY, folded ? 'true' : 'false');
  } catch {
    // Quota or private browsing — the choice still holds for this session.
  }
}
