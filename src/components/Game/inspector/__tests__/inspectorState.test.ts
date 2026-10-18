/**
 * THR-1911 — the Inspector's state rules (plan § D2, § D3): history, sizes, the pin, the
 * Esc order and the trail. Pure transitions, so every rule is pinned here.
 */
import { describe, it, expect } from 'vitest';
import {
  INITIAL_INSPECTOR_STATE,
  INSPECTOR_HISTORY_MAX,
  INSPECTOR_TRAIL_CRUMBS,
  closeInspector,
  currentEntry,
  cycleSize,
  escapeStep,
  goBack,
  goForward,
  goTo,
  isInspectorOpen,
  nameEntry,
  openFromMap,
  openSubject,
  stepFullToDocked,
  togglePin,
  trailSteps,
  widen,
  type InspectorState,
} from '../inspectorState';

const coast = { kind: 'area', id: 'coast' } as const;
const quarter = { kind: 'location', id: 'quarter' } as const;
const shutash = { kind: 'agent', id: 'shutash' } as const;
const cong = { kind: 'faction', id: 'cong' } as const;

function keys(s: InspectorState): string[] {
  return s.history.map(h => h.key);
}

describe('inspectorState — history (§ D3)', () => {
  it('opens closed, then walks the chain Bone Coast → Temple Quarter → a person → their faction in four opens', () => {
    let s = INITIAL_INSPECTOR_STATE;
    expect(isInspectorOpen(s)).toBe(false);
    s = openSubject(s, coast, 'docked');
    s = openSubject(s, quarter, 'docked');
    s = openSubject(s, shutash, 'docked');
    s = openSubject(s, cong, 'wide');
    expect(keys(s)).toEqual(['area:coast', 'location:quarter', 'agent:shutash', 'faction:cong']);
    expect(currentEntry(s)?.key).toBe('faction:cong');
    expect(s.size).toBe('wide');
  });

  it('Back returns step by step, and Forward comes back', () => {
    let s = INITIAL_INSPECTOR_STATE;
    for (const subject of [coast, quarter, shutash, cong]) s = openSubject(s, subject, 'docked');
    s = goBack(s);
    expect(currentEntry(s)?.key).toBe('agent:shutash');
    s = goBack(s);
    expect(currentEntry(s)?.key).toBe('location:quarter');
    s = goBack(s);
    expect(currentEntry(s)?.key).toBe('area:coast');
    expect(goBack(s)).toBe(s); // nothing older
    s = goForward(s);
    expect(currentEntry(s)?.key).toBe('location:quarter');
  });

  it('opening while not at the end drops the forward entries (browser rule)', () => {
    let s = INITIAL_INSPECTOR_STATE;
    for (const subject of [coast, quarter, shutash]) s = openSubject(s, subject, 'docked');
    s = goBack(goBack(s));
    s = openSubject(s, cong, 'docked');
    expect(keys(s)).toEqual(['area:coast', 'faction:cong']);
  });

  it('opening the subject already shown adds no step', () => {
    const s = openSubject(INITIAL_INSPECTOR_STATE, shutash, 'docked');
    expect(openSubject(s, shutash, 'docked')).toBe(s);
  });

  it(`keeps at most INSPECTOR_HISTORY_MAX (${INSPECTOR_HISTORY_MAX}) steps; the oldest falls off`, () => {
    let s = INITIAL_INSPECTOR_STATE;
    for (let i = 0; i < INSPECTOR_HISTORY_MAX + 5; i++) s = openSubject(s, { kind: 'agent', id: `a${i}` }, 'docked');
    expect(s.history).toHaveLength(INSPECTOR_HISTORY_MAX);
    expect(s.history[0].key).toBe('agent:a5');
    expect(s.index).toBe(INSPECTOR_HISTORY_MAX - 1);
  });

  it('goTo jumps to a trail step; close empties the Inspector', () => {
    let s = INITIAL_INSPECTOR_STATE;
    for (const subject of [coast, quarter, shutash]) s = openSubject(s, subject, 'docked');
    expect(currentEntry(goTo(s, 0))?.key).toBe('area:coast');
    expect(isInspectorOpen(closeInspector(s))).toBe(false);
  });
});

describe('inspectorState — sizes (§ D2)', () => {
  it('opening never narrows a wider current size (Law 57)', () => {
    let s = openSubject(INITIAL_INSPECTOR_STATE, cong, 'wide');
    s = openSubject(s, shutash, 'docked');
    expect(s.size).toBe('wide');
  });

  it('W cycles docked → wide → full → docked', () => {
    let s = openSubject(INITIAL_INSPECTOR_STATE, shutash, 'docked');
    s = cycleSize(s);
    expect(s.size).toBe('wide');
    s = cycleSize(s);
    expect(s.size).toBe('full');
    s = cycleSize(s);
    expect(s.size).toBe('docked');
  });

  it('Esc steps one down: full → wide → docked → closed', () => {
    let s = cycleSize(cycleSize(openSubject(INITIAL_INSPECTOR_STATE, shutash, 'docked')));
    expect(s.size).toBe('full');
    s = escapeStep(s);
    expect(s.size).toBe('wide');
    s = escapeStep(s);
    expect(s.size).toBe('docked');
    s = escapeStep(s);
    expect(isInspectorOpen(s)).toBe(false);
  });

  it('a pause-tier interrupt steps Full to docked on the same subject', () => {
    const full = cycleSize(cycleSize(openSubject(INITIAL_INSPECTOR_STATE, shutash, 'docked')));
    const s = stepFullToDocked(full);
    expect(s.size).toBe('docked');
    expect(currentEntry(s)?.key).toBe('agent:shutash');
    const docked = openSubject(INITIAL_INSPECTOR_STATE, shutash, 'docked');
    expect(stepFullToDocked(docked)).toBe(docked);
  });

  it('widen steps one up and stops at Full', () => {
    let s = widen(openSubject(INITIAL_INSPECTOR_STATE, shutash, 'docked'));
    expect(s.size).toBe('wide');
    s = widen(widen(s));
    expect(s.size).toBe('full');
  });
});

describe('inspectorState — pin and trail (§ D3)', () => {
  it('a pinned Inspector ignores a map click; a link still navigates', () => {
    const pinned = togglePin(openSubject(INITIAL_INSPECTOR_STATE, shutash, 'docked'));
    expect(openFromMap(pinned, { kind: 'hex', id: '3,4' }, 'docked')).toBe(pinned);
    expect(currentEntry(openSubject(pinned, cong, 'wide'))?.key).toBe('faction:cong');
    const unpinned = togglePin(pinned);
    expect(currentEntry(openFromMap(unpinned, { kind: 'hex', id: '3,4' }, 'docked'))?.key).toBe('hex:3,4');
  });

  it(`the trail shows the last ${INSPECTOR_TRAIL_CRUMBS} steps with a leading "…" when older ones exist`, () => {
    let s = INITIAL_INSPECTOR_STATE;
    for (const subject of [coast, quarter, shutash, cong]) {
      s = openSubject(s, subject, 'docked');
      s = nameEntry(s, currentEntry(s)!.key, subject.id);
    }
    const trail = trailSteps(s);
    expect(trail.steps.map(t => t.name)).toEqual(['quarter', 'shutash', 'cong']);
    expect(trail.more).toBe(true);
    expect(trail.steps.at(-1)?.current).toBe(true);
  });
});
