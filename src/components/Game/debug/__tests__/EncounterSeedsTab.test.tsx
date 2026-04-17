// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EncounterSeedsTab } from '../EncounterSeedsTab';
import type { PendingEncounterSeed } from '../../../../types/unifiedAction';
import type { RetinueAgent } from '../../../../engine/retinue';

function makeSeed(overrides: Partial<PendingEncounterSeed> = {}): PendingEncounterSeed {
  return {
    seedId: 'seed-abc123',
    sourceEncounterId: 'enc-xyz',
    sourceReactionId: 'rx-001',
    templateId: 'encounter.trial.betrayal',
    targetAgentId: 'agent-001',
    eligibleAfterTick: 50,
    priority: 1,
    seedLabel: 'A coming reckoning',
    plantedTick: 40,
    ...overrides,
  };
}

const RETINUE = [
  { id: 'agent-001', name: 'Serafina' },
] as unknown as RetinueAgent[];

describe('EncounterSeedsTab', () => {
  it('renders empty state when seeds is empty', () => {
    render(<EncounterSeedsTab seeds={[]} currentTick={100} />);
    expect(screen.getByText('Seed queue empty.')).toBeTruthy();
  });

  it('sorts seeds by eligibleAfterTick ascending', () => {
    const seedA = makeSeed({ seedId: 'seed-a', seedLabel: 'Fires last', eligibleAfterTick: 100 });
    const seedB = makeSeed({ seedId: 'seed-b', seedLabel: 'Fires first', eligibleAfterTick: 20 });
    const { container } = render(<EncounterSeedsTab seeds={[seedA, seedB]} currentTick={10} />);
    const labels = Array.from(container.querySelectorAll('*'))
      .map(el => el.textContent ?? '')
      .filter(t => t === 'Fires first' || t === 'Fires last');
    // "Fires first" (tick 20) should appear before "Fires last" (tick 100) in the DOM
    const firstIdx = labels.indexOf('Fires first');
    const lastIdx = labels.indexOf('Fires last');
    expect(firstIdx).toBeLessThan(lastIdx);
  });

  it('"Ready now" filter shows only seeds with eligibleAfterTick <= currentTick', () => {
    const ready = makeSeed({ seedId: 'seed-ready', seedLabel: 'Ready seed', eligibleAfterTick: 50 });
    const waiting = makeSeed({ seedId: 'seed-wait', seedLabel: 'Waiting seed', eligibleAfterTick: 200 });
    render(<EncounterSeedsTab seeds={[ready, waiting]} currentTick={100} />);

    fireEvent.click(screen.getByText('Ready now'));

    expect(screen.getByText('Ready seed')).toBeTruthy();
    expect(screen.queryByText('Waiting seed')).toBeNull();
  });

  it('"Waiting" filter shows only seeds with eligibleAfterTick > currentTick', () => {
    const ready = makeSeed({ seedId: 'seed-ready', seedLabel: 'Ready seed', eligibleAfterTick: 50 });
    const waiting = makeSeed({ seedId: 'seed-wait', seedLabel: 'Waiting seed', eligibleAfterTick: 200 });
    render(<EncounterSeedsTab seeds={[ready, waiting]} currentTick={100} />);

    fireEvent.click(screen.getByText('Waiting'));

    expect(screen.queryByText('Ready seed')).toBeNull();
    expect(screen.getByText('Waiting seed')).toBeTruthy();
  });

  it('shows template pill for template seeds', () => {
    const seed = makeSeed({ templateId: 'encounter.trial.betrayal', encounterFamily: undefined });
    render(<EncounterSeedsTab seeds={[seed]} currentTick={10} />);
    expect(screen.getByText(/tmpl: encounter\.trial\.betrayal/)).toBeTruthy();
  });

  it('shows family pill for family-only seeds (no templateId)', () => {
    const seed = makeSeed({ templateId: undefined, encounterFamily: 'investigation' });
    render(<EncounterSeedsTab seeds={[seed]} currentTick={10} />);
    expect(screen.getByText(/family: investigation/)).toBeTruthy();
  });

  it('resolves targetAgentId to agent name via retinueAgents', () => {
    const seed = makeSeed({ targetAgentId: 'agent-001' });
    render(<EncounterSeedsTab seeds={[seed]} currentTick={10} retinueAgents={RETINUE} />);
    expect(screen.getByText(/Serafina/)).toBeTruthy();
  });

  it('renders (unresolved) suffix for unknown agent IDs without throwing', () => {
    const seed = makeSeed({ targetAgentId: 'unknown-agent-xyz' });
    expect(() =>
      render(<EncounterSeedsTab seeds={[seed]} currentTick={10} retinueAgents={RETINUE} />),
    ).not.toThrow();
    expect(screen.getByText(/(unresolved)/)).toBeTruthy();
  });
});
