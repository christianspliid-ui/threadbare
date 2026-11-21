// @vitest-environment jsdom
/**
 * THR-2266 — jsdom render evidence: during the quiet day after an Aftermath, Needs you
 * shows "‹Mortal› — ‹chapter› waits for you" as a Waiting row, the pill counts it, and a
 * press asks the host to open that chapter. A 2.5 s click hold shows nothing.
 */
import { useState } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NeedsYou } from '../frame/NeedsYou';
import { buildNeedsYou, type NeedsYouHeldChapter, type NeedsYouRowVM } from '../../../engine/views/needsYou';

function vmFor(heldChapter: NeedsYouHeldChapter | null) {
  return buildNeedsYou({ currentTick: 40, beatOffer: null, receipts: [], namedPause: null, heldChapter, held: [], alerts: [] });
}

const breather: NeedsYouHeldChapter = {
  notificationId: 'n_b1', agentId: 'agent_1', agentName: 'Maren', title: 'The Salt Road', heldBy: ['breather'], tick: 38,
};

function Harness({ heldChapter, onPress }: { heldChapter: NeedsYouHeldChapter | null; onPress: (row: NeedsYouRowVM) => void }) {
  const [open, setOpen] = useState(false);
  return <NeedsYou vm={vmFor(heldChapter)} open={open} onOpenChange={setOpen} guarded={false} raised={false} onPressRow={onPress} />;
}

describe('THR-2266 — the waiting chapter in Needs you', () => {
  it('draws the row with its words, counts it, and a press opens that chapter', () => {
    const pressed: NeedsYouRowVM[] = [];
    render(<Harness heldChapter={breather} onPress={row => pressed.push(row)} />);
    expect(screen.getByTestId('needs-you-pill').getAttribute('data-needs-you-count')).toBe('1');
    fireEvent.click(screen.getByTestId('needs-you-pill').querySelector('button')!);
    const row = document.querySelector('[data-needs-you-row="chapter_waiting"]');
    expect(row).not.toBeNull();
    expect(row!.textContent).toContain('Maren — The Salt Road waits for you');
    expect(row!.textContent).not.toContain('n_b1');
    fireEvent.click(row!);
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toMatchObject({ opens: 'chapter', notificationId: 'n_b1' });
  });

  it('every mounted chapter is marked opened, whatever route mounted it (review gate)', () => {
    const src = readFileSync(resolve(__dirname, '../GameView.tsx'), 'utf8');
    expect(src).toMatch(/const mountedChapterNotification = tieredEncounterState\?\.notification;\s*useEffect\(\(\) => \{\s*if \(!mountedChapterNotification\) return;\s*rememberOpenedChapter\(mountedChapterNotification\);/);
    // Round 2 — the held chapter opened by another route clears its waiting row.
    expect(src).toMatch(/setHeldChapter\(prev => \(prev\?\.notificationId === mountedChapterNotification\.id \? null : prev\)\);/);
  });

  it('shows no row for the 2.5 s click hold', () => {
    render(<Harness heldChapter={{ ...breather, heldBy: ['recent_input'] }} onPress={() => {}} />);
    expect(screen.queryByTestId('needs-you-pill')?.getAttribute('data-needs-you-count') ?? '0').toBe('0');
    expect(document.querySelector('[data-needs-you-row="chapter_waiting"]')).toBeNull();
  });
});
