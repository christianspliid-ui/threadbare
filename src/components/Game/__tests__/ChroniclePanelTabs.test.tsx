// @vitest-environment jsdom
/**
 * THR-1893 — the Chronicle's tabs (frame plan § F7): Now · Years · Ledger on the shared
 * `Tabs`, Years only from the second calendar year, the Ledger tab marks its new rows
 * before it records them as seen (Law 40), and the tab and voice persist (Law 51).
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ChroniclePanel, CHRONICLE_TAB_KEY, CHRONICLE_VOICE_KEY } from '../ChroniclePanel';
import type { ChronicleEntry } from '../../../types/narrative';
import type { LedgerRailVM } from '../../../engine/views/ledgerRail';

function entry(id: string, tick: number): ChronicleEntry {
  return {
    id, tier: 'chronicle', title: `Entry ${id}`, prose: `Prose ${id}`,
    promptContext: { actors: [], location: '', sphere: 'life', mood: '' }, tick,
  } as ChronicleEntry;
}

const ENTRIES = [entry('a', 1), entry('b', 400)];

function vm(over: Partial<LedgerRailVM> = {}): Pick<LedgerRailVM, 'worldSoul' | 'now' | 'years' | 'ledger'> {
  return {
    worldSoul: { label: 'World-Soul', sentence: 'Spirit moves through the world.', mood: 'Tension rises beneath the surface.', sphere: 'spirit' },
    now: { entryIds: ['b'], emptyLine: null },
    years: [{ year: 2, label: 'Year 2 · 1 entry', entryIds: ['b'] }, { year: 1, label: 'Year 1 · 1 entry', entryIds: ['a'] }],
    ledger: {
      rows: [
        { recordId: 'c2', name: 'The Healer\'s Oath', mortalId: 'k', mortalName: 'Kael Thorne', state: 'resolved · it held', isNew: true },
        { recordId: 'c1', name: 'Deep Descent', mortalId: 'k', mortalName: 'Kael Thorne', state: 'active · step 2', isNew: false },
      ],
      unread: 1,
    },
    ...over,
  };
}

describe('ChroniclePanel tabs (THR-1893)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('heads the Chronicle with the World-Soul line and draws Now · Years · Ledger', () => {
    render(<ChroniclePanel entries={ENTRIES} vm={vm()} />);
    expect(screen.getByTestId('world-soul-line').textContent).toContain('Tension rises beneath the surface.');
    expect(screen.getByTestId('chronicle-tab-now')).toBeTruthy();
    expect(screen.getByTestId('chronicle-tab-years')).toBeTruthy();
    expect(screen.getByTestId('chronicle-tab-ledger')).toBeTruthy();
    expect(screen.getByTestId('chronicle-panel').style.maxHeight).toBe('');
  });

  it('Years renders only when the entries span two calendar years; Ledger only once revealed', () => {
    render(<ChroniclePanel entries={ENTRIES} vm={vm({ years: [{ year: 1, label: 'Year 1 · 2 entries', entryIds: ['b', 'a'] }] })} reveal={{ worldSoul: true, ledger: false }} />);
    expect(screen.queryByTestId('chronicle-tab-years')).toBeNull();
    expect(screen.queryByTestId('chronicle-tab-ledger')).toBeNull();
    expect(screen.getByTestId('chronicle-panel').dataset.tabsRendered).toBe('now');
  });

  it('the Ledger tab shows its new rows marked, then records them as seen', () => {
    const onSeen = vi.fn();
    render(<ChroniclePanel entries={ENTRIES} vm={vm()} onLedgerSeen={onSeen} />);
    expect(onSeen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('chronicle-tab-ledger'));
    const rows = screen.getAllByTestId('chronicle-ledger-row');
    expect(rows.map(r => r.dataset.new ?? '')).toEqual(['true', '']);
    expect(rows[0].textContent).toContain('new');
    expect(onSeen).toHaveBeenCalledTimes(1);
  });

  it('a Ledger row opens the reader at its chapter; the button opens it at the newest', () => {
    const onOpen = vi.fn();
    render(<ChroniclePanel entries={ENTRIES} vm={vm()} onOpenLedger={onOpen} />);
    fireEvent.click(screen.getByTestId('chronicle-tab-ledger'));
    fireEvent.click(screen.getAllByText('Deep Descent')[0]);
    expect(onOpen).toHaveBeenLastCalledWith('c1');
    fireEvent.click(screen.getByTestId('chronicle-ledger-open'));
    expect(onOpen).toHaveBeenLastCalledWith(null);
  });

  it('the selected tab and the voice persist across a remount', () => {
    const first = render(<ChroniclePanel entries={ENTRIES} vm={vm()} />);
    fireEvent.click(screen.getByText('Poet'));
    fireEvent.click(screen.getByTestId('chronicle-tab-years'));
    expect(localStorage.getItem(CHRONICLE_TAB_KEY)).toBe('years');
    expect(localStorage.getItem(CHRONICLE_VOICE_KEY)).toBe('poet');
    first.unmount();
    render(<ChroniclePanel entries={ENTRIES} vm={vm()} />);
    expect(screen.getByTestId('chronicle-panel').dataset.tab).toBe('years');
  });
});
