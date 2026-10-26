/**
 * THR-2052 — an unattended harness lets every held step play out, so the
 * First-rhythm gate keeps measuring rhythm now that steps are held on post.
 */

import { describe, expect, it } from 'vitest';
import { releaseAllPlayerHolds } from '../playerStepHold';
import type { UnifiedAction } from '../../types/unifiedAction';

const action = (id: string, held: boolean): UnifiedAction =>
  ({ actionId: id, ...(held ? { playerHold: { stepIndex: 0, sinceTick: 3 } } : {}) }) as unknown as UnifiedAction;

describe('THR-2052 — releaseAllPlayerHolds', () => {
  it('drops every hold and leaves unheld actions untouched', () => {
    const free = action('b', false);
    const out = releaseAllPlayerHolds([action('a', true), free]);
    expect(out.every(a => a.playerHold === undefined)).toBe(true);
    expect(out[1]).toBe(free);
  });

  it('returns the input array when nothing is held', () => {
    const actions = [action('a', false)];
    expect(releaseAllPlayerHolds(actions)).toBe(actions);
  });
});
