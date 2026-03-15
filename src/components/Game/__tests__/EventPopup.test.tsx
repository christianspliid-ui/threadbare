import { describe, it, expect } from 'vitest';
import type { PopupItem } from '../../../types/notification';
import { eventPopupTestHelpers } from '../EventPopup';

describe('EventPopup helpers', () => {
  it('detects informational popups (no choices)', () => {
    const popup: PopupItem = {
      id: 'p1', title: 'Doom', body: 'Bad things.',
      sourceEventId: 'e1', tick: 1,
    };
    expect(eventPopupTestHelpers.hasChoices(popup)).toBe(false);
  });

  it('detects interactive popups (with choices)', () => {
    const popup: PopupItem = {
      id: 'p1', title: 'Offer', body: 'A sage approaches.',
      sourceEventId: 'e1', tick: 1,
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
