// @vitest-environment jsdom
/**
 * THR-2252 — the race on the Mandate block, the Mandate dialog and the Doom dialog:
 * the forecast takes the flavour line's slot, the dialogs name the one move, and the
 * Doom dialog drops its rate-blind Remaining row while the race is shown.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MandateBlock } from '../ascendant-bar/MandateBlock';
import { MandateDetail } from '../MandateDetail';
import { DoomClockDetail } from '../DoomClockDetail';
import type { MandateRowView, RaceLeverView, RaceView } from '../../../engine/views/subjects/godSheet';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';
import type { MandateDefinition, MandateState } from '../../../types/mandate';
import { RACE_FORECAST_LINES, RACE_LEVER_STAY, raceChapterLeverRuns } from '../../../data/race-content';

const race: RaceView = { state: 'doom_first', sentence: RACE_FORECAST_LINES.doom_first, word: 'Doom lands first' };
const runs = raceChapterLeverRuns('Order', 'Kael Thornweaver');
const chapter: RaceLeverView = { kind: 'chapter', runs, line: runs.map(r => r.text).join(''), mortalId: 'kael', sphere: 'order' };
const stay: RaceLeverView = { kind: 'stay', line: RACE_LEVER_STAY, button: 'Stay it' };

const row = (r: RaceView | null): MandateRowView => ({
  name: 'M', flavorLine: 'A hunger for order.', boundCount: 1, fillLine: 'Rises when…', progress: 0.3, stage: 'I',
  trend: 'steady', recentDeedLines: [], race: r,
});

const mandateDef = { id: 'm', name: 'Seat of Rule', description: 'A hunger for order.', type: 'graph_state', runtimeKind: 'sphere_growth', stages: [], checkpoints: [] } as unknown as MandateDefinition;
const mandateState = { mandateId: 'm', currentStage: 'setup', progress: 0.3, completed: false, failed: false } as unknown as MandateState;

const doomDef: DoomClockDefinition = {
  archetype: 'breach',
  totalTicks: 100,
  stages: [
    { stage: 1, name: 'Whispers', tickThreshold: 0.0, events: [] },
    { stage: 2, name: 'Signs', tickThreshold: 0.2, events: [] },
    { stage: 3, name: 'Tremors', tickThreshold: 0.4, events: [] },
    { stage: 4, name: 'Crisis', tickThreshold: 0.6, events: [] },
    { stage: 5, name: 'Culmination', tickThreshold: 0.8, events: [] },
  ],
};
const doomState: DoomClockState = {
  definitionArchetype: 'breach', currentTick: 25, totalTicks: 100, currentStage: 2, progress: 0.25,
  stageTransitions: [0, 20, 40, 60, 80], expired: false, tickModifier: 1.0,
  nextEscalationSeverityModifier: 0, counterOmens: 0, resolvedEvents: [],
};

describe('THR-2252 — MandateBlock', () => {
  it('keeps the flavour line while the race is hidden', () => {
    render(<MandateBlock mandate={row(null)} onOpen={() => {}} />);
    expect(screen.getByText('A hunger for order.')).toBeTruthy();
    expect(screen.queryByTestId('mandate-race-line')).toBeNull();
  });

  it('puts the forecast in the flavour slot, with the ui.race hover', () => {
    const { container } = render(<MandateBlock mandate={row(race)} onOpen={() => {}} />);
    expect(screen.getByTestId('mandate-race-line').textContent).toBe(RACE_FORECAST_LINES.doom_first);
    expect(screen.queryByText('A hunger for order.')).toBeNull();
    expect(container.querySelector('[data-tooltip-id="ui.race"]')).toBeTruthy();
  });
});

describe('THR-2252 — MandateDetail', () => {
  it('orders forecast, lever, then the flavour line', () => {
    const { baseElement } = render(
      <MandateDetail open onClose={() => {}} definition={mandateDef} state={mandateState} race={race} lever={chapter} />,
    );
    const text = baseElement.textContent ?? '';
    const f = text.indexOf(RACE_FORECAST_LINES.doom_first);
    const l = text.indexOf(chapter.line);
    const d = text.indexOf('A hunger for order.');
    expect(f).toBeGreaterThanOrEqual(0);
    expect(l).toBeGreaterThan(f);
    expect(d).toBeGreaterThan(l);
    expect(baseElement.querySelector('[data-tooltip-id="sphere.order"]')).toBeTruthy();
  });

  it('wires the Stay lever button to onStay', () => {
    const onStay = vi.fn();
    render(<MandateDetail open onClose={() => {}} definition={mandateDef} state={mandateState} race={race} lever={stay} onStay={onStay} />);
    fireEvent.click(screen.getByTestId('race-lever-stay-button'));
    expect(onStay).toHaveBeenCalledOnce();
  });

  it('draws no race block while hidden', () => {
    render(<MandateDetail open onClose={() => {}} definition={mandateDef} state={mandateState} />);
    expect(screen.queryByTestId('mandate-detail-race')).toBeNull();
  });
});

describe('THR-2252 — DoomClockDetail', () => {
  it('keeps the Remaining row while the race is hidden', () => {
    const { baseElement } = render(<DoomClockDetail open onClose={() => {}} definition={doomDef} state={doomState} />);
    expect(baseElement.textContent).toContain('Remaining');
  });

  it('shows the forecast and the chapter lever, and drops Remaining, while shown', () => {
    const { baseElement } = render(<DoomClockDetail open onClose={() => {}} definition={doomDef} state={doomState} race={race} lever={chapter} />);
    expect(baseElement.textContent).not.toContain('Remaining');
    expect(screen.getByTestId('race-forecast').textContent).toBe(RACE_FORECAST_LINES.doom_first);
    expect(screen.getByTestId('race-lever').getAttribute('data-lever-kind')).toBe('chapter');
  });

  it('shows no Stay lever of its own (THR-2240\'s answer covers Stay)', () => {
    render(<DoomClockDetail open onClose={() => {}} definition={doomDef} state={doomState} race={race} lever={stay} />);
    expect(screen.getByTestId('race-forecast')).toBeTruthy();
    expect(screen.queryByTestId('race-lever')).toBeNull();
  });
});
