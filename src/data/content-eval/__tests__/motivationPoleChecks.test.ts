/**
 * THR-1525 — the pin-on-fork-axis warning, tested in both directions (a fixture
 * that trips it and one that does not), plus the live corpus: nothing ships
 * pinned today, so the corpus sweep must be silent.
 */

import { describe, expect, it } from 'vitest';

import type { UnifiedActionTemplate, ActionStep } from '../../../types/unifiedAction';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { forkAxes, pinnedForkAxisWarnings } from '../motivationPoleChecks';

type Fixture = Pick<UnifiedActionTemplate, 'steps' | 'motivations' | 'motivationPoles'>;

const step = {} as ActionStep;

function poleFork(motivationPoles?: Fixture['motivationPoles']): Fixture {
  return {
    motivations: ['tradition_novelty', 'revelation_discretion'],
    motivationPoles,
    steps: [
      step,
      {
        branchOnStep: 0,
        variants: { positive: step, negative: step },
        fallback: step,
        decidedBy: { axis: 'tradition_novelty' },
      },
    ],
  };
}

describe('pinnedForkAxisWarnings (THR-1525)', () => {
  it('reads pole and route fork axes', () => {
    const routed: Fixture = {
      motivations: [],
      steps: [
        step,
        {
          branchOnStep: 0,
          variants: { a: step, b: step },
          fallback: step,
          decidedBy: {
            routes: [
              { key: 'a', reach: 'iron', axis: 'mercy_ruthlessness', toward: 'negative' },
              { key: 'b', reach: 'heart' },
            ],
          },
        },
      ],
    } as unknown as Fixture;
    expect([...forkAxes(routed)]).toEqual(['mercy_ruthlessness']);
    expect([...forkAxes(poleFork())]).toEqual(['tradition_novelty']);
  });

  it('warns when a template pins the axis its own fork decides on', () => {
    const warnings = pinnedForkAxisWarnings(poleFork({ tradition_novelty: 'positive' }));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("'tradition_novelty'");
  });

  it('is silent for an unpinned fork axis and for a pin on a non-fork axis', () => {
    expect(pinnedForkAxisWarnings(poleFork())).toEqual([]);
    expect(pinnedForkAxisWarnings(poleFork({ revelation_discretion: 'negative' }))).toEqual([]);
  });

  it('warns on a pin naming an axis absent from motivations; ignores malformed pins', () => {
    expect(pinnedForkAxisWarnings(poleFork({ courage_prudence: 'positive' }))[0])
      .toContain('not in motivations');
    const malformed = poleFork({ tradition_novelty: 'sideways' as never });
    expect(pinnedForkAxisWarnings(malformed)).toEqual([]);
  });

  it('the shipped corpus trips nothing (the census authored no pins)', () => {
    const tripped = UNIFIED_ACTION_TEMPLATES.flatMap((t) =>
      pinnedForkAxisWarnings(t).map((w) => `${t.id}: ${w}`),
    );
    expect(tripped).toEqual([]);
  });
});
