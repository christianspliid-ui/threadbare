// @vitest-environment jsdom
/**
 * THR-2219 — browser-verify substitution (jsdom-render): the Doom stage popup, composed.
 *
 * The stage popup used to read only "Barrier Thinning" — each card's title. This builds the
 * body exactly as `phaseDoom` does (`doomStageCardLine` per card of a real generated stage),
 * routes it through `routeNotifications`, and renders the real `EventPopup`: every card's
 * title, description and plain "what it does" line must reach the screen, one card per
 * paragraph.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EventPopup } from '../EventPopup';
import { routeNotifications } from '../../../engine/notificationRouter';
import { doomStageCardLine } from '../../../engine/phaseDoom';
import { generateDoomClock } from '../../../engine/doomClock';
import type { TickEvent } from '../../../types/gameState';

describe('THR-2219 — the Doom stage popup tells what each card does', () => {
  const definition = generateDoomClock('breach', 1092, 42);
  const stages = definition.stages.filter((s) => s.events.length > 0);

  it('a generated doom has stage cards carrying an effect summary', () => {
    expect(stages.length).toBeGreaterThan(0);
    expect(stages.some((s) => s.events.some((c) => c.effectSummary))).toBe(true);
  });

  for (const stage of stages) {
    it(`stage "${stage.name}" renders every card's title, description and effect summary`, () => {
      const event = {
        id: `evt_doom_${stage.stage}`,
        tick: 200,
        type: 'doom_escalation',
        message: `The Breach intensifies — ${stage.name}`,
        significance: 0.9,
        notification: {
          channel: 'popup',
          popup: { title: stage.name, body: stage.events.map(doomStageCardLine).join('\n\n') },
        },
      } as TickEvent;
      const routed = routeNotifications([event], { toasts: [], alerts: [], popupQueue: [], entityNotices: [] }, 0);
      const { baseElement } = render(<EventPopup popup={routed.popupQueue[0]} queueLength={1} onDismiss={() => {}} />);
      const text = baseElement.textContent ?? '';
      for (const card of stage.events) {
        if (card.title) expect(text).toContain(card.title);
        expect(text).toContain(card.description);
        if (card.effectSummary) expect(text).toContain(card.effectSummary);
      }
      // One card per paragraph: the body keeps its line breaks on screen.
      expect(baseElement.querySelector('.whitespace-pre-line')).toBeTruthy();
    });
  }
});

describe('doomStageCardLine — fail-soft', () => {
  it('reads title, description, effect summary as sentences', () => {
    expect(doomStageCardLine({
      id: 'x', title: 'Barrier Thinning', narrativeHook: '',
      description: 'Old wards dim.', effectSummary: 'Divine influence drains from vulnerable hexes.',
    })).toBe('Barrier Thinning. Old wards dim. Divine influence drains from vulnerable hexes.');
  });

  it('drops missing parts without leaving empty text', () => {
    expect(doomStageCardLine({ id: 'x', narrativeHook: '', description: 'Old wards dim.' })).toBe('Old wards dim.');
    expect(doomStageCardLine({ id: 'x', title: 'Barrier Thinning', narrativeHook: '', description: '' })).toBe('Barrier Thinning');
  });
});
