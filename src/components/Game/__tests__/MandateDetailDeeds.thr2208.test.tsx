// @vitest-environment jsdom
//
// THR-2208 — the Mandate detail's "Last deeds": the line reads in words, and the mortal's
// name is a link (Law 21; review-gate round 1). The modal renders through a portal, so the
// arms read `baseElement`, never `container` (impediment #1009).
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { RefRouterProvider } from '../../../contexts/RefRouterContext';
import { MandateDetail } from '../MandateDetail';
import type { MandateDefinition, MandateState } from '../../../types/mandate';

const definition = {
  id: 'mandate.growth',
  type: 'sphere_dominance',
  runtimeKind: 'sphere_growth',
  name: 'The Rising Mind',
  description: 'Raise mind, and let spirit follow.',
  primarySphere: 'mind',
  secondarySphere: 'spirit',
  primaryTargetDelta: 0.12,
  secondaryTargetDelta: 0.08,
  stages: [
    { stage: 'setup', description: 'Begin', conditions: [] },
    { stage: 'escalation', description: 'Press', conditions: [] },
    { stage: 'culmination', description: 'Hold', conditions: [] },
  ],
} as unknown as MandateDefinition;

function stateWith(deeds: MandateState['recentDeeds']): MandateState {
  return {
    mandateId: 'mandate.growth',
    currentStage: 'setup',
    progress: 0.1,
    completed: false,
    failed: false,
    recentDeeds: deeds,
  } as MandateState;
}

describe('THR-2208 — Mandate detail last deeds', () => {
  it('lists the deed in words with the mortal\'s name as a link', () => {
    const open = vi.fn();
    const router = { open, armHover: vi.fn(), closeHover: vi.fn(), peek: vi.fn(), close: vi.fn() } as unknown as Parameters<typeof RefRouterProvider>[0]['router'];
    const { baseElement } = render(
      <RefRouterProvider router={router}>
        <MandateDetail open onClose={() => {}} definition={definition} currentTick={50}
          state={stateWith([{ tick: 40, actorId: 'kael', actorName: 'Kael Thornweaver', sphere: 'mind', points: 1 }])} />
      </RefRouterProvider>,
    );
    const block = baseElement.querySelector('[data-testid="mandate-recent-deeds"]');
    expect(block?.textContent).toContain('Last deeds');
    expect(block?.textContent).toContain("Kael Thornweaver's deed raised your Mandate in Mind.");
    expect(block?.textContent).not.toMatch(/\d/);
    const link = [...(block?.querySelectorAll('button') ?? [])].find(b => b.textContent === 'Kael Thornweaver');
    expect(link).toBeTruthy();
    fireEvent.click(link!);
    expect(open).toHaveBeenCalledWith({ kind: 'agent', id: 'kael' }, 'card', expect.anything());
  });

  it('a nameless deed reads the fallback line; no deeds, no block', () => {
    const { baseElement, unmount } = render(
      <MandateDetail open onClose={() => {}} definition={definition} currentTick={50}
        state={stateWith([{ tick: 40, actorId: 'gone', sphere: 'spirit', points: 5 }])} />,
    );
    expect(baseElement.querySelector('[data-testid="mandate-recent-deeds"]')?.textContent)
      .toContain("A mortal bound to you's deed raised your Mandate far in Spirit.");
    unmount();
    const empty = render(<MandateDetail open onClose={() => {}} definition={definition} currentTick={50} state={stateWith([])} />);
    expect(empty.baseElement.textContent).toContain('The Rising Mind');
    expect(empty.baseElement.querySelector('[data-testid="mandate-recent-deeds"]')).toBeNull();
  });
});
