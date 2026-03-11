import { describe, it, expect } from 'vitest';
import { DECISION_REEVALUATION_TICKS } from '../../types/movement';

describe('decision re-evaluation constants', () => {
  it('re-evaluation interval is 4 ticks', () => {
    expect(DECISION_REEVALUATION_TICKS).toBe(4);
  });
});
