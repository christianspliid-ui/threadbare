// @vitest-environment jsdom
/**
 * THR-1716 U3 — until the clock has run once, the Play control asks for it: a
 * pulse ring (static under reduced motion, Law 44), the first-run caption in the
 * status line, and the `ui.sim_first_run` tooltip. Without the prompt the
 * control is unchanged.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulationControls } from '../SimulationControls';
import { FIRST_RUN_PROMPT_CAPTION, UI_TOOLTIPS } from '../../../data/ui-content';

function renderControls(props: { firstRunPrompt?: boolean; running?: boolean; held?: boolean }) {
  return render(
    <SimulationControls
      season="spring" year={1} running={props.running ?? false} speed={1}
      onToggle={vi.fn()} onStep={vi.fn()} onSpeedChange={vi.fn()}
      compact held={props.held ?? false} firstRunPrompt={props.firstRunPrompt}
    />,
  );
}

const stubMatchMedia = (matches: boolean) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

afterEach(() => vi.unstubAllGlobals());

describe('SimulationControls — first-run prompt (THR-1716)', () => {
  it('shows the ring and the caption only while firstRunPrompt is true', () => {
    renderControls({ firstRunPrompt: true });
    expect(screen.getByTestId('first-run-prompt')).toBeTruthy();
    expect(screen.getByTestId('first-run-caption').textContent).toBe(FIRST_RUN_PROMPT_CAPTION);
    expect(screen.getByLabelText('Play simulation')).toBeTruthy();
  });

  it('without the prompt the control and status line are unchanged', () => {
    renderControls({ firstRunPrompt: false });
    expect(screen.queryByTestId('first-run-prompt')).toBeNull();
    expect(document.body.textContent).not.toContain(FIRST_RUN_PROMPT_CAPTION);
    expect(document.body.textContent).toContain('paused');
  });

  it('a held or running clock never shows the prompt', () => {
    renderControls({ firstRunPrompt: true, held: true });
    expect(screen.queryByTestId('first-run-prompt')).toBeNull();
  });

  it('the first-run tooltip is authored and within Law 18', () => {
    const tip = UI_TOOLTIPS['ui.sim_first_run'];
    expect(tip).toBeDefined();
    expect(tip.desc.length).toBeLessThanOrEqual(200);
  });

  it('pulses at full motion', () => {
    stubMatchMedia(false);
    renderControls({ firstRunPrompt: true });
    const ring = screen.getByTestId('first-run-prompt');
    expect(ring.dataset.motion).toBe('pulse');
    expect(ring.style.animation).toContain('pulseGlow');
  });

  it('is a static ring under prefers-reduced-motion (Law 44)', () => {
    stubMatchMedia(true);
    renderControls({ firstRunPrompt: true });
    const ring = screen.getByTestId('first-run-prompt');
    expect(ring.dataset.motion).toBe('static');
    expect(ring.style.animation).toBe('');
    expect(ring.style.boxShadow).not.toBe('');
  });
});
