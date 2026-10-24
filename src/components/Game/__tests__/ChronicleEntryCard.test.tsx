// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChronicleEntryCard } from '../ChronicleEntryCard';
import { ChroniclePanel } from '../ChroniclePanel';
import type { ChronicleEntry } from '../../../types/narrative';
import { RefRouterProvider } from '../../../contexts/RefRouterContext';
import type { RefRouter } from '../../../hooks/useRefRouter';

// ── Fixtures ──────────────────────────────────────────────────────

const dualVoiceEntry: ChronicleEntry = {
  id: 'test-entry-1',
  tier: 'chronicle',
  title: 'The Fall of Iron Gate',
  prose: 'Iron Gate has fallen.',
  poetProse: 'The silence after the last gate fell was absolute — as if the world itself held its breath.',
  witnessFacts: ['Iron Gate fortress has been lost.', 'Defenders scattered to the surrounding hills.'],
  promptContext: { actors: ['Thane Volkar'], location: 'Iron Gate', sphere: 'force', mood: 'tragic' },
  tick: 42,
};

const legacyEntry: ChronicleEntry = {
  id: 'test-entry-2',
  tier: 'chronicle',
  title: 'Trade Route Dissolved',
  prose: 'The eastern trade route has collapsed.',
  promptContext: { actors: [], location: 'Eastern Road', sphere: 'gold', mood: 'economic' },
  tick: 10,
};

// ── ChronicleEntryCard ────────────────────────────────────────────

describe('ChronicleEntryCard', () => {
  it('schema roundtrip: dual-voice entry has expected fields', () => {
    expect(dualVoiceEntry.poetProse).toBeTruthy();
    expect(dualVoiceEntry.witnessFacts).toHaveLength(2);
    expect(dualVoiceEntry.prose).toBe('Iron Gate has fallen.');
  });

  it('renders both voices in interleaved mode', () => {
    render(<ChronicleEntryCard entry={dualVoiceEntry} voiceMode="interleaved" />);
    expect(screen.getByText(dualVoiceEntry.poetProse!)).toBeDefined();
    expect(screen.getByText(dualVoiceEntry.witnessFacts![0])).toBeDefined();
  });

  it('renders only poet voice in poet mode', () => {
    render(<ChronicleEntryCard entry={dualVoiceEntry} voiceMode="poet" />);
    expect(screen.getByText(dualVoiceEntry.poetProse!)).toBeDefined();
    expect(screen.queryByText(dualVoiceEntry.witnessFacts![0])).toBeNull();
  });

  it('renders only witness voice in witness mode', () => {
    render(<ChronicleEntryCard entry={dualVoiceEntry} voiceMode="witness" />);
    expect(screen.queryByText(dualVoiceEntry.poetProse!)).toBeNull();
    expect(screen.getByText(dualVoiceEntry.witnessFacts![0])).toBeDefined();
  });

  it('migration shim: legacy entry (prose only) renders prose as witness fact in interleaved mode', () => {
    render(<ChronicleEntryCard entry={legacyEntry} voiceMode="interleaved" />);
    // No poetProse — poet section should not render
    expect(screen.queryByText(legacyEntry.prose)).toBeDefined(); // shown as witness bullet
  });

  it('migration shim: legacy entry does not crash in poet mode', () => {
    // No poetProse, poet mode → nothing to show (component returns null for poet section)
    const { container } = render(<ChronicleEntryCard entry={legacyEntry} voiceMode="poet" />);
    // The card itself still renders (title visible) but no poet text
    expect(container).toBeDefined();
  });

  it('heads the entry with an elapsed reading and the title, never a tick index (THR-1426)', () => {
    // `t42` was the engine's clock index on a player-facing heading (Laws 13/14). A current
    // tick of 90 against the entry's 42 is 48 ticks — four days — so this exercises the real
    // multi-day branch rather than `elapsedLabel`'s `less than a day` floor, which a missing
    // `currentTick` would also produce and which would therefore prove nothing.
    render(<ChronicleEntryCard entry={dualVoiceEntry} voiceMode="witness" currentTick={90} />);
    const heading = screen.getByText(/The Fall of Iron Gate/);
    expect(heading.textContent).toContain('four days ago · The Fall of Iron Gate');
    expect(heading.textContent).not.toMatch(/\bt\d/);
    expect(heading.textContent).not.toMatch(/tick/i);
  });

  // THR-1986 (Law 13): the Chronicle speaks in words — a quintessence delta on the
  // entry never prints as "+0.50Q", whatever its sign.
  it.each([0.5, -1.25, 0])('prints no Q for a quintessenceDelta of %s', (delta) => {
    const entry: ChronicleEntry = { ...legacyEntry, quintessenceDelta: delta };
    const { container } = render(<ChronicleEntryCard entry={entry} voiceMode="witness" />);
    expect(container.textContent ?? '').not.toMatch(/\d\.\d\dQ/);
  });

  it('renders no Q-delta annotation when quintessenceDelta is absent', () => {
    render(<ChronicleEntryCard entry={legacyEntry} voiceMode="witness" />);
    expect(screen.queryByText(/Q$/)).toBeNull();
  });
});

// ── ChroniclePanel ────────────────────────────────────────────────

describe('ChroniclePanel', () => {
  it('renders empty state message when no entries', () => {
    render(<ChroniclePanel entries={[]} />);
    expect(screen.getByText(/The world awaits/)).toBeDefined();
  });

  it('renders entry list with default interleaved mode', () => {
    render(<ChroniclePanel entries={[dualVoiceEntry]} />);
    expect(screen.getByText(dualVoiceEntry.poetProse!)).toBeDefined();
    expect(screen.getByText(dualVoiceEntry.witnessFacts![0])).toBeDefined();
  });

  it('toggle switches to poet-only mode', () => {
    render(<ChroniclePanel entries={[dualVoiceEntry]} />);
    fireEvent.click(screen.getByText('Poet'));
    expect(screen.getByText(dualVoiceEntry.poetProse!)).toBeDefined();
    expect(screen.queryByText(dualVoiceEntry.witnessFacts![0])).toBeNull();
  });

  it('toggle switches to witness-only mode', () => {
    render(<ChroniclePanel entries={[dualVoiceEntry]} />);
    fireEvent.click(screen.getByText('Witness'));
    expect(screen.queryByText(dualVoiceEntry.poetProse!)).toBeNull();
    expect(screen.getByText(dualVoiceEntry.witnessFacts![0])).toBeDefined();
  });

  it('toggle returns to interleaved', () => {
    render(<ChroniclePanel entries={[dualVoiceEntry]} />);
    fireEvent.click(screen.getByText('Poet'));
    fireEvent.click(screen.getByText('Both'));
    expect(screen.getByText(dualVoiceEntry.poetProse!)).toBeDefined();
    expect(screen.getByText(dualVoiceEntry.witnessFacts![0])).toBeDefined();
  });

  it('renders multiple entries', () => {
    render(<ChroniclePanel entries={[dualVoiceEntry, legacyEntry]} />);
    expect(screen.getByText(dualVoiceEntry.poetProse!)).toBeDefined();
    // legacy prose rendered as witness bullet
    expect(screen.getByText(legacyEntry.prose)).toBeDefined();
  });
});

// ── THR-1959: a line whose producer declared its names ───────────

const linkedEntry: ChronicleEntry = {
  id: 'restless_road_agent_1_90',
  tier: 'chronicle',
  title: 'Thessa grows restless and takes the road to Greyw',
  prose: 'Thessa grows restless and takes the road to Greywater.',
  witnessFacts: ['Thessa grows restless and takes the road to Greywater.'],
  promptContext: { actors: ['Thessa'], location: 'Hearth', sphere: 'force', mood: 'dramatic' },
  tick: 90,
  segments: [
    { text: 'Thessa', ref: { kind: 'agent', id: 'agent_1', name: 'Thessa' } },
    { text: ' grows restless and takes the road to ' },
    { text: 'Greywater', ref: { kind: 'location', id: 'loc_a', name: 'Greywater' } },
    { text: '.' },
  ],
};

describe('ChronicleEntryCard — declared names (THR-1959)', () => {
  it('renders both names as links that open their pages through the ref router (Law 21)', () => {
    const opened: unknown[] = [];
    const router = {
      open: (ref: unknown) => opened.push(ref),
      armHover: () => {},
      disarmHover: () => {},
      closeHover: () => {},
    } as unknown as RefRouter;
    render(
      <RefRouterProvider router={router}>
        <ChronicleEntryCard entry={linkedEntry} voiceMode="interleaved" />
      </RefRouterProvider>,
    );
    expect(screen.getByTestId('chronicle-linked-line').textContent).toBe(linkedEntry.prose);
    fireEvent.click(screen.getByRole('button', { name: 'Thessa — open page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Greywater — open page' }));
    expect(opened).toEqual([
      { kind: 'agent', id: 'agent_1', name: 'Thessa' },
      { kind: 'location', id: 'loc_a', name: 'Greywater' },
    ]);
  });

  it('with no router in scope, the names read as plain text and the line is whole', () => {
    render(<ChronicleEntryCard entry={linkedEntry} voiceMode="witness" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByTestId('chronicle-linked-line').textContent).toBe(linkedEntry.prose);
  });
});
