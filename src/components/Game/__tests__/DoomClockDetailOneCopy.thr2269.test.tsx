// @vitest-environment jsdom
/**
 * THR-2269 — the Doom dialog fits at its last stage. Each card shows once, inside the
 * stage that dealt it; Recent consequences is gone; a card reads as its title and what
 * it did (no `1.23x` severity, Law 13); passed stages fold and open again; the dialog
 * says "stage", not "chapter".
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { DoomClockDetail, DOOM_STAGE_FOLD_STORE_KEY } from '../DoomClockDetail';
import type { DoomClockDefinition, DoomClockState, DoomResolvedEvent } from '../../../types/doomClock';

const definition: DoomClockDefinition = {
  archetype: 'breach',
  totalTicks: 100,
  stages: [
    { stage: 1, name: 'Whispers', tickThreshold: 0.0, events: [{ title: 'The Veil Thins', description: 'd' } as never] },
    { stage: 2, name: 'Signs', tickThreshold: 0.2, events: [{ title: 'Bleeding Sky', description: 'd' } as never] },
    { stage: 3, name: 'Tremors', tickThreshold: 0.4, events: [{ title: 'Cracked Wells', description: 'd' } as never] },
    { stage: 4, name: 'Crisis', tickThreshold: 0.6, events: [{ title: 'Shadow Tide', description: 'd' } as never] },
    { stage: 5, name: 'Culmination', tickThreshold: 0.8, events: [{ title: 'The Rending', description: 'd' } as never, { title: 'Last Light', description: 'd' } as never] },
  ],
};

const card = (stage: number, title: string, effectSummary?: string): DoomResolvedEvent => ({
  id: `doom-${stage}-${title}`,
  stage,
  title,
  description: 'desc',
  severity: 1.23,
  resolvedTick: stage * 20,
  effectType: 'hex_corruption',
  effectSummary,
});

const resolved: DoomResolvedEvent[] = [
  card(1, 'The Veil Thins', 'Two hexes darken'),
  card(2, 'Bleeding Sky'),
  card(3, 'Cracked Wells', 'Oakmere grows restless'),
  card(4, 'Shadow Tide'),
  card(5, 'The Rending', 'The veil tears at Ashford'),
  card(5, 'Last Light'),
];

const state: DoomClockState = {
  definitionArchetype: 'breach',
  currentTick: 85,
  totalTicks: 100,
  currentStage: 5,
  progress: 0.85,
  stageTransitions: [0, 20, 40, 60, 80],
  expired: false,
  tickModifier: 1.0,
  nextEscalationSeverityModifier: 0,
  counterOmens: 0,
  resolvedEvents: resolved,
};

function renderDialog() {
  return render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state} />);
}

function countText(root: HTMLElement, text: string): number {
  return [...root.querySelectorAll('*')].filter((el) => el.children.length === 0 && el.textContent === text).length;
}

describe('DoomClockDetail — one copy of each card (THR-2269)', () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it('renders each card title exactly once once every passed stage is opened', () => {
    const { baseElement } = renderDialog();
    for (const toggle of [...baseElement.querySelectorAll('[data-testid="doom-stage-toggle"]')]) {
      fireEvent.click(toggle);
    }
    for (const event of resolved) {
      expect(countText(baseElement, event.title)).toBe(1);
    }
  });

  it('has no Recent consequences section, no x-suffixed severity, and says stage not chapter', () => {
    const { baseElement } = renderDialog();
    const text = baseElement.textContent ?? '';
    expect(text).not.toContain('Recent consequences');
    expect(text).not.toMatch(/\d\.\d{1,2}x/);
    expect(text).not.toMatch(/severity/i);
    expect(text).toContain('Current stage');
    expect(text).not.toContain('Current chapter');
    expect(text).not.toMatch(/Chapter/);
    expect(text).toContain('Stages 1–4 tighten the omen. Stage 5 is the climax, where the world-scale fallout lands.');
  });

  it('a card reads as its title then what it did, with the effect type only when there is no summary', () => {
    const { baseElement } = renderDialog();
    const cards = [...baseElement.querySelectorAll('[data-testid="doom-stage-card"]')];
    expect(cards.map((c) => c.textContent)).toEqual([
      'The RendingThe veil tears at Ashford',
      'Last LightHex corruption',
    ]);
  });

  it('keeps the current stage open and folds passed stages to their name row', () => {
    const { baseElement } = renderDialog();
    const stage5 = baseElement.querySelector('[data-testid="doom-stage"][data-stage="5"]')!;
    expect(stage5.querySelector('[data-testid="doom-stage-toggle"]')).toBeNull();
    expect(stage5.querySelectorAll('[data-testid="doom-stage-card"]').length).toBe(2);
    const toggles = baseElement.querySelectorAll('[data-testid="doom-stage-toggle"]');
    expect(toggles.length).toBe(4);
    for (const t of toggles) expect(t.getAttribute('aria-expanded')).toBe('false');
    expect(baseElement.textContent).not.toContain('Cracked Wells');
  });

  it('a passed stage opens to show its cards and closes again', () => {
    const { baseElement } = renderDialog();
    const stage3 = () => baseElement.querySelector('[data-testid="doom-stage"][data-stage="3"]')!;
    const toggle = stage3().querySelector('[data-testid="doom-stage-toggle"]')!;
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(stage3().textContent).toContain('Cracked Wells');
    expect(stage3().textContent).toContain('Oakmere grows restless');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(stage3().textContent).not.toContain('Cracked Wells');
  });

  it('the open state survives closing and reopening the dialog within the session', () => {
    const first = renderDialog();
    const toggle = first.baseElement.querySelector('[data-testid="doom-stage"][data-stage="2"] [data-testid="doom-stage-toggle"]')!;
    fireEvent.click(toggle);
    expect(sessionStorage.getItem(DOOM_STAGE_FOLD_STORE_KEY)).toContain('breach:2');
    first.unmount();
    const second = renderDialog();
    expect(second.baseElement.querySelector('[data-testid="doom-stage"][data-stage="2"]')!.textContent).toContain('Bleeding Sky');
  });

  it('future stages stay name-only', () => {
    const { baseElement } = render(
      <DoomClockDetail open onClose={() => {}} definition={definition} state={{ ...state, currentStage: 2, progress: 0.3, resolvedEvents: resolved.slice(0, 2) }} />,
    );
    const stage4 = baseElement.querySelector('[data-testid="doom-stage"][data-stage="4"]')!;
    expect(stage4.textContent).toBe('4Crisis');
  });
});
