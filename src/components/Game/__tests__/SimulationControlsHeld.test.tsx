// @vitest-environment jsdom
/**
 * While an interrupt holds the clock, the time control shows the state the
 * clock returns to and says it is held (THR-1711, review-gate finding): drawn
 * from the frozen `running=false`, the button showed Play while a press paused.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulationControls } from '../SimulationControls';

function renderControls(running: boolean, held: boolean) {
  return render(
    <SimulationControls
      season="spring" year={1} running={running} speed={1}
      onToggle={vi.fn()} onStep={vi.fn()} onSpeedChange={vi.fn()}
      compact held={held}
    />,
  );
}

describe('SimulationControls — held by an interrupt (THR-1711)', () => {
  it('a held world that will run on shows Pause and says it is held', () => {
    renderControls(true, true);
    expect(screen.getByLabelText('Pause simulation')).toBeTruthy();
    expect(document.body.textContent).toContain('held · runs on after');
  });

  it('a held world that will stay paused shows Play and says so', () => {
    renderControls(false, true);
    expect(screen.getByLabelText('Play simulation')).toBeTruthy();
    expect(document.body.textContent).toContain('held · stays paused');
  });

  it('unheld, the status line is unchanged', () => {
    renderControls(true, false);
    expect(document.body.textContent).toContain('running ×1');
    expect(document.body.textContent).not.toContain('held');
  });
});
