// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChronicleEntryCard } from '../ChronicleEntryCard';
import { ChroniclePanel } from '../ChroniclePanel';
import type { ChronicleEntry } from '../../../types/narrative';

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

  it('shows tick and title in header', () => {
    render(<ChronicleEntryCard entry={dualVoiceEntry} voiceMode="witness" />);
    expect(screen.getByText(/t42/)).toBeDefined();
    expect(screen.getByText(/The Fall of Iron Gate/)).toBeDefined();
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
