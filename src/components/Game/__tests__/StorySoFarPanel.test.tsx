// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StorySoFarPanel } from '../StorySoFarPanel';
import type { ThreadStoryComposition } from '../../../engine/threadDigest';

function makeComposition(overrides: Partial<ThreadStoryComposition> = {}): ThreadStoryComposition {
  return {
    agentId: 'agent-1',
    agentName: 'Test Agent',
    currentTickWhenComposed: 100,
    tensionLine: 'Test Agent moves through the world at their own pace.',
    beatLines: [
      'Test Agent faced the danger head-on and came through.',
      'Then, the work Test Agent put in yielded something solid.',
      'Now, Test Agent stands.',
    ],
    lookbackTicks: 36,
    beatCount: 3,
    isEmpty: false,
    ...overrides,
  };
}

describe('StorySoFarPanel', () => {
  it('renders tension line', () => {
    const { container } = render(
      <StorySoFarPanel composition={makeComposition()} lastViewedTick={90} />,
    );
    expect(container.textContent).toContain('Test Agent moves through the world');
  });

  it('renders the "Story so far" section divider', () => {
    const { container } = render(
      <StorySoFarPanel composition={makeComposition()} lastViewedTick={90} />,
    );
    expect(container.textContent).toContain('Story so far');
  });

  it('renders beat lines', () => {
    const { container } = render(
      <StorySoFarPanel composition={makeComposition()} lastViewedTick={90} />,
    );
    expect(container.textContent).toContain('Test Agent faced the danger');
    expect(container.textContent).toContain('Test Agent stands');
  });

  it('renders empty state when isEmpty is true', () => {
    const emptyComposition = makeComposition({
      isEmpty: true,
      beatLines: ['The thread of Test Agent\'s story is just beginning to unspool.'],
      beatCount: 0,
    });
    const { container } = render(
      <StorySoFarPanel composition={emptyComposition} lastViewedTick={90} />,
    );
    expect(container.textContent).toContain('just beginning to unspool');
    // Should not render beat rows in empty state
    expect(container.querySelector('[data-beat-row]')).toBeNull();
  });

  it('does not crash when beatLines is empty', () => {
    const composition = makeComposition({
      isEmpty: true,
      beatLines: [''] as any,
    });
    expect(() => render(
      <StorySoFarPanel composition={composition} lastViewedTick={90} />,
    )).not.toThrow();
  });
});
