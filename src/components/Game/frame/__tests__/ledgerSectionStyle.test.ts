import { describe, expect, it } from 'vitest';
import { LEDGER_CHRONICLE_MIN_REM, ledgerSectionStyle } from '../LedgerRail';

// THR-2126: a long Chronicle Now tab squeezed Threads to ~12px because the Chronicle's
// flex basis was its content height. jsdom cannot measure layout, so this pins the rule.
describe('ledgerSectionStyle (THR-2126)', () => {
  it('grows the Chronicle from a zero basis, so its content height never wins the shrink', () => {
    const style = ledgerSectionStyle('chronicle');
    expect(style.flex).toBe('1 1 0');
    expect(style.minHeight).toBe(`${LEDGER_CHRONICLE_MIN_REM}rem`);
  });

  it('keeps Threads at its content height, scrolling once the Chronicle is at its floor', () => {
    expect(ledgerSectionStyle('threads')).toEqual({ flex: '0 1 auto', minHeight: 0, overflowY: 'auto' });
  });
});
