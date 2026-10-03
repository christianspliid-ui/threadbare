// @vitest-environment jsdom

/**
 * The Codex keeps its engine audit out of a player's build (THR-1707).
 *
 * Cold playtest round 2 found "Engine bridge: creates a `narrowed` `knows_clue_of` edge…" and a
 * WIRED · ENGINE badge on the deployed Codex. Those lines are the THR-610 catalog audit — for
 * whoever builds the game, not for whoever plays it. The gate: a production build shows them
 * only under the designer view; a dev build keeps them. Renders real catalog entries, so the
 * evidence is about what the panel paints, not about an object shape.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CodexDetailPanel } from '../CodexDetailPanel';
import { getAllCodexEntries, type CodexEntry } from '../codexRegistry';
import { setNudgeDesignerView } from '../../Game/encounter-stage/designerView';

/** Every action entry that carries an engine-facing effect line — the population at risk. */
function technicalEntries(): CodexEntry[] {
  return getAllCodexEntries().filter(e => !!e.technicalEffect);
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  setNudgeDesignerView(false);
});

describe('THR-1707 — the Codex effect audit stays out of a player build', () => {
  it('has entries to test (guard the guard)', () => {
    expect(technicalEntries().length).toBeGreaterThan(10);
    expect(technicalEntries().some(e => /Engine bridge/.test(e.technicalEffect ?? ''))).toBe(true);
  });

  it('a production render shows no Effect block, no wiring badge, no engine prose', () => {
    vi.stubEnv('DEV', false);
    for (const entry of technicalEntries()) {
      const { container, unmount } = render(<CodexDetailPanel entry={entry} onClose={() => {}} />);
      const text = container.textContent ?? '';
      expect(screen.queryByTestId('codex-effect-block'), entry.id).toBeNull();
      expect(screen.queryByTestId('codex-effect-badge'), entry.id).toBeNull();
      expect(text, entry.id).not.toMatch(/Engine bridge/);
      expect(text, entry.id).not.toMatch(/wired/i);
      // The panel still says something: the player keeps the entry's own lines.
      expect(text.length, entry.id).toBeGreaterThan(20);
      unmount();
    }
  });

  it('the designer view brings the audit back in a production build', () => {
    vi.stubEnv('DEV', false);
    setNudgeDesignerView(true);
    const entry = technicalEntries().find(e => !!e.effectSource)!;
    render(<CodexDetailPanel entry={entry} onClose={() => {}} />);
    expect(screen.getByTestId('codex-effect-block')).toBeTruthy();
    expect(screen.getByTestId('codex-effect-badge')).toBeTruthy();
  });

  it('a dev build keeps the audit for whoever builds the catalog', () => {
    vi.stubEnv('DEV', true);
    const entry = technicalEntries()[0];
    render(<CodexDetailPanel entry={entry} onClose={() => {}} />);
    expect(screen.getByTestId('codex-effect-block')).toBeTruthy();
  });
});
