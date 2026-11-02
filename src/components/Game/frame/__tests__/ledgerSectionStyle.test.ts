import { describe, expect, it } from 'vitest';
import { LEDGER_CHRONICLE_MIN_REM, LEDGER_THREADS_GROW, ledgerSectionStyle } from '../LedgerRail';

// THR-2126: a long Chronicle Now tab squeezed Threads to ~12px because the Chronicle's
// flex basis was its content height. jsdom cannot measure layout, so this pins the rule.
describe('ledgerSectionStyle (THR-2126)', () => {
  it('grows the Chronicle from a zero basis, so its content height never wins the shrink', () => {
    const style = ledgerSectionStyle('chronicle');
    expect(style.flex).toBe('1 1 0');
    expect(style.minHeight).toBe(`${LEDGER_CHRONICLE_MIN_REM}rem`);
  });

  // THR-2141: Threads at its content height moved the Chronicle's tab row every tick.
  it('gives Threads a fixed share from a zero basis, scrolling inside it', () => {
    expect(ledgerSectionStyle('threads')).toEqual({ flex: `${LEDGER_THREADS_GROW} 1 0`, minHeight: 0, overflowY: 'auto' });
  });
});
