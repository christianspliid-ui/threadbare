// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PopupItem } from '../../../types/notification';
import { EventPopup, eventPopupTestHelpers } from '../EventPopup';
import { REVEAL_CATEGORY_TITLES } from '../../../data/reveal-content';

const basePopup: PopupItem = {
  id: 'p1', title: 'Doom', body: 'Bad things.',
  sourceEventId: 'e1', tick: 1,
};

describe('EventPopup helpers', () => {
  it('detects informational popups (no choices)', () => {
    expect(eventPopupTestHelpers.hasChoices(basePopup)).toBe(false);
  });

  it('detects interactive popups (with choices)', () => {
    const popup: PopupItem = {
      ...basePopup, title: 'Offer', body: 'A sage approaches.',
      choices: [
        { label: 'Accept', effect: 'accept' },
        { label: 'Reject', effect: 'reject' },
      ],
    };
    expect(eventPopupTestHelpers.hasChoices(popup)).toBe(true);
  });

  it('formats queue count badge text', () => {
    expect(eventPopupTestHelpers.queueBadge(0)).toBe('');
    expect(eventPopupTestHelpers.queueBadge(1)).toBe('');
    expect(eventPopupTestHelpers.queueBadge(3)).toBe('+2');
  });
});

// THR-799 — the presentation split. Ceremonial needs a sphere (the event's only
// canonical visual identity) AND no choices (a decision is not a reveal).
describe('EventPopup presentation tier (THR-799)', () => {
  it('routes a sphere-carrying informational popup to the ceremonial tier', () => {
    expect(eventPopupTestHelpers.isCeremonialPopup({ ...basePopup, sphere: 'entropy' })).toBe(true);
  });

  it('keeps a popup with no sphere on the compact tier', () => {
    expect(eventPopupTestHelpers.isCeremonialPopup(basePopup)).toBe(false);
  });

  it('keeps a choice popup on the compact tier even when it carries a sphere', () => {
    const decision: PopupItem = {
      ...basePopup,
      sphere: 'entropy',
      choices: [{ label: 'Accept', effect: 'accept' }],
    };
    expect(eventPopupTestHelpers.isCeremonialPopup(decision)).toBe(false);
  });

  it('renders the ceremonial zones for a sphere-carrying popup', () => {
    render(
      <EventPopup
        popup={{ ...basePopup, sphere: 'entropy' }}
        queueLength={1}
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByTestId('reveal-title').textContent).toContain(REVEAL_CATEGORY_TITLES.event);
    expect(screen.getByTestId('reveal-banner').textContent).toBe('Doom');
    expect(screen.getByTestId('reveal-body').textContent).toContain('Bad things.');
    expect(screen.getByTestId('reveal-dismiss')).toBeTruthy();
  });

  it('renders the compact layout unchanged for a plain popup', () => {
    render(<EventPopup popup={basePopup} queueLength={1} onDismiss={() => {}} />);
    expect(screen.queryByTestId('reveal-title')).toBeNull();
    expect(screen.queryByTestId('reveal-card-frame')).toBeNull();
    expect(screen.getByText('Doom')).toBeTruthy();
    expect(screen.getByText('Acknowledge')).toBeTruthy();
  });

  it('renders choice buttons on the compact tier for a sphere-carrying decision', () => {
    render(
      <EventPopup
        popup={{ ...basePopup, sphere: 'entropy', choices: [{ label: 'Accept', effect: 'accept' }] }}
        queueLength={1}
        onDismiss={() => {}}
        onChoice={() => {}}
      />,
    );
    expect(screen.queryByTestId('reveal-card-frame')).toBeNull();
    expect(screen.getByText('Accept')).toBeTruthy();
  });

  it('keeps the queue badge on both tiers', () => {
    const { unmount } = render(
      <EventPopup popup={{ ...basePopup, sphere: 'entropy' }} queueLength={3} onDismiss={() => {}} />,
    );
    expect(screen.getByText('+2')).toBeTruthy();
    unmount();

    render(<EventPopup popup={basePopup} queueLength={3} onDismiss={() => {}} />);
    expect(screen.getByText('+2')).toBeTruthy();
  });
});
