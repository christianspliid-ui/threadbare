/**
 * The `'live'`-mode guard (THR-1292 slice 6).
 *
 * The property under test is awkward precisely because it is the one that
 * matters: the guard must fire for a mode value the shipped constant does not
 * hold. Asserting it against the real `'shadow'` constant would only ever
 * exercise the early return — a test that passes because the interesting branch
 * is unreachable, which is the vacuity this ticket has logged four times.
 * So the constants module is mocked per-arm and the module under test is
 * re-imported against it.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

async function loadGuardWithMode(mode: 'off' | 'shadow' | 'live') {
  vi.resetModules();
  vi.doMock('../../data/strategic-action-constants', async () => {
    const actual = await vi.importActual<
      typeof import('../../data/strategic-action-constants')
    >('../../data/strategic-action-constants');
    return { ...actual, UNIFIED_DECISION_BOARD_MODE: mode };
  });
  return import('../decisionBoardModeGuard');
}

describe('decision-board live-mode guard', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.doUnmock('../../data/strategic-action-constants');
    vi.resetModules();
  });

  it('warns when the mode is live but the cutover branch is absent', async () => {
    const guard = await loadGuardWithMode('live');
    guard.warnLiveBoardModeUnimplemented();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = String(warnSpy.mock.calls[0][0]);
    // Pin the two facts the message exists to convey. A guard whose text drifts
    // into something generic stops doing the only job it has.
    expect(message).toContain('LEGACY');
    expect(message).toContain('THR-1292');
  });

  it('warns exactly once — it sits on the per-agent decision path', async () => {
    const guard = await loadGuardWithMode('live');
    for (let i = 0; i < 50; i++) guard.warnLiveBoardModeUnimplemented();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('is silent in shadow — the shipped mode must not warn', async () => {
    const guard = await loadGuardWithMode('shadow');
    guard.warnLiveBoardModeUnimplemented();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('is silent when off', async () => {
    const guard = await loadGuardWithMode('off');
    guard.warnLiveBoardModeUnimplemented();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  /**
   * Falsification arm. If the mock did not actually replace the constant, every
   * assertion above would still pass — the two silent arms trivially, and the
   * `'live'` arms would fail loudly enough to notice. This pins the mock itself,
   * so a future vitest change that breaks `doMock` surfaces here rather than as
   * a guard that silently stopped being tested.
   */
  it('the mocked constant really is the one the guard reads', async () => {
    await loadGuardWithMode('live');
    const constants = await import('../../data/strategic-action-constants');
    expect(constants.UNIFIED_DECISION_BOARD_MODE).toBe('live');
  });
});
