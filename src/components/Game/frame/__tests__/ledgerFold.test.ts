// @vitest-environment jsdom
/**
 * THR-1893 — the Ledger rail's fold rules (frame plan § F8).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  LEDGER_FOLDED_KEY,
  ledgerFoldReason,
  ledgerKeyPress,
  ledgerRailState,
  readLedgerFoldedPref,
  writeLedgerFoldedPref,
} from '../ledgerFold';

const base = { foldPref: false, inspectorOpen: false, stageOpen: false };

describe('ledger fold', () => {
  beforeEach(() => localStorage.clear());

  it('precedence: hidden (Stage) › strip (Inspector or the player) › open', () => {
    expect(ledgerRailState(base)).toBe('open');
    expect(ledgerRailState({ ...base, foldPref: true })).toBe('strip');
    expect(ledgerRailState({ ...base, inspectorOpen: true })).toBe('strip');
    expect(ledgerRailState({ ...base, inspectorOpen: true, stageOpen: true })).toBe('hidden');
    expect(ledgerFoldReason({ ...base, foldPref: true })).toBe('player');
    expect(ledgerFoldReason({ ...base, foldPref: true, inspectorOpen: true })).toBe('inspector');
    expect(ledgerFoldReason({ ...base, stageOpen: true })).toBe('stage');
    expect(ledgerFoldReason(base)).toBeNull();
  });

  it('L folds and unfolds with the Inspector closed', () => {
    const k = { ...base, flyout: null, lastSection: 'threads' as const };
    expect(ledgerKeyPress(k)).toEqual({ foldPref: true, flyout: null });
    expect(ledgerKeyPress({ ...k, foldPref: true })).toEqual({ foldPref: false, flyout: null });
  });

  it('L toggles the flyout on the last section with the Inspector open, and keeps the player fold', () => {
    const k = { ...base, inspectorOpen: true, flyout: null, lastSection: 'chronicle' as const };
    expect(ledgerKeyPress(k)).toEqual({ foldPref: false, flyout: 'chronicle' });
    expect(ledgerKeyPress({ ...k, flyout: 'chronicle' })).toEqual({ foldPref: false, flyout: null });
  });

  it('L does nothing during a Stage moment', () => {
    expect(ledgerKeyPress({ ...base, stageOpen: true, flyout: null, lastSection: 'threads' })).toEqual({ foldPref: false, flyout: null });
  });

  it('the fold persists (Law 51)', () => {
    expect(readLedgerFoldedPref()).toBe(false);
    writeLedgerFoldedPref(true);
    expect(localStorage.getItem(LEDGER_FOLDED_KEY)).toBe('true');
    expect(readLedgerFoldedPref()).toBe(true);
  });
});
