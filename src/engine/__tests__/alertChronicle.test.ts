/**
 * THR-1896 — news that leaves Needs you lives on in the Chronicle.
 *
 * Part 1 enumerates every `channel: 'alert'` site in `src/engine` and asserts each is
 * classified: an `// alert-chronicle: <type>` marker just above it naming a type that
 * `ALERT_CHRONICLE_POLICY` either chronicles or exempts with a reason.
 * Part 2 drives `phaseAlertChronicle` on real producer output.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { WorldGraph } from '../graph';
import type { GameState, TickEvent } from '../../types/gameState';
import type { ChronicleEntry } from '../../types/narrative';
import {
  ALERT_CHRONICLE_POLICY,
  collectAlertChronicle,
  phaseAlertChronicle,
} from '../alertChronicle';
import { buildDiscoveryTickEvent } from '../revelationResolver';
import { hexKeyFromCoord } from '../../lib/hexKey';

const ENGINE_DIR = join(__dirname, '..');
/** Any channel expression that can yield 'alert', including a conditional one. */
const ALERT_SITE = /channel:[^,}\n]*'alert'/;
const MARKER = /\/\/ alert-chronicle: (.+)$/;
/** How far above an alert site its marker may sit. */
const MARKER_WINDOW_LINES = 12;

function engineSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === '__tests__') continue;
      out.push(...engineSourceFiles(path));
    } else if (name.endsWith('.ts') && !name.endsWith('.test.ts') && !name.endsWith('.d.ts')) {
      out.push(path);
    }
  }
  return out;
}

interface AlertSite { file: string; line: number; types: string[] | null }

function alertSites(): AlertSite[] {
  const sites: AlertSite[] = [];
  for (const path of engineSourceFiles(ENGINE_DIR)) {
    const lines = readFileSync(path, 'utf8').split(/\r?\n/);
    lines.forEach((text, i) => {
      if (!ALERT_SITE.test(text) || text.trim().startsWith('//') || text.trim().startsWith('*')) return;
      let types: string[] | null = null;
      for (let j = i; j >= Math.max(0, i - MARKER_WINDOW_LINES); j--) {
        const m = MARKER.exec(lines[j]);
        if (m) { types = m[1].split(',').map(t => t.trim()).filter(Boolean); break; }
      }
      sites.push({ file: relative(ENGINE_DIR, path).replace(/\\/g, '/'), line: i + 1, types });
    });
  }
  return sites;
}

describe('every alert producer is classified for the Chronicle (THR-1896)', () => {
  const sites = alertSites();

  it('finds the alert producers (the scan is not vacuous)', () => {
    const files = new Set(sites.map(s => s.file));
    for (const f of ['phaseMandate.ts', 'factionOutcome.ts', 'revelationResolver.ts', 'prayers.ts', 'ambitionTick.ts']) {
      expect(files.has(f), `${f} has an alert site`).toBe(true);
    }
  });

  it('each alert site carries an alert-chronicle marker naming a classified type', () => {
    const unmarked = sites.filter(s => s.types === null).map(s => `${s.file}:${s.line}`);
    expect(unmarked, 'alert sites with no `// alert-chronicle: <type>` marker above them').toEqual([]);
    const unclassified = sites.flatMap(s => (s.types ?? [])
      .filter(t => !(t in ALERT_CHRONICLE_POLICY))
      .map(t => `${s.file}:${s.line} → ${t}`));
    expect(unclassified, 'marker types with no ALERT_CHRONICLE_POLICY row').toEqual([]);
  });

  it('every policy row is used by a producer, and every exemption says why', () => {
    const named = new Set(sites.flatMap(s => s.types ?? []));
    for (const [type, policy] of Object.entries(ALERT_CHRONICLE_POLICY)) {
      expect(named.has(type), `policy row ${type} names no alert producer`).toBe(true);
      if (!policy.chronicle) expect(policy.exemption.trim().length, `${type} exemption`).toBeGreaterThan(0);
    }
  });
});

// ─── Behaviour ──────────────────────────────────────────────────

const ASC = 'asc';
const THREADED = 'mortal.threaded';
const STRANGER = 'mortal.stranger';

function makeState(tickEvents: TickEvent[], chronicleEntries: ChronicleEntry[] = []): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: THREADED, type: 'actor', name: 'Vara', properties: { actorType: 'individual' } });
  graph.addNode({ id: STRANGER, type: 'actor', name: 'Ossen', properties: { actorType: 'individual' } });
  graph.addEdge({ id: `thread_${THREADED}`, source: ASC, target: THREADED, type: 'thread', properties: { tier: 2 } });
  return { tick: 40, graph, ascendantId: ASC, tickEvents, chronicleEntries } as unknown as GameState;
}

function alertEvent(over: Partial<TickEvent>): TickEvent {
  return {
    id: 'evt', tick: 40, type: 'mandate_progress', message: 'Mandate "Green Crown" enters its next stage.',
    significance: 0.85, notification: { channel: 'alert', icon: 'mandate' }, ...over,
  } as TickEvent;
}

describe('phaseAlertChronicle', () => {
  it('writes one Witness line from the alert’s own words — the mandate stage the narrative intake never sees', () => {
    const state = makeState([alertEvent({ id: 'mandate_1' })]);
    const patch = phaseAlertChronicle(state);
    expect(patch.chronicleEntries).toHaveLength(1);
    const [entry] = patch.chronicleEntries!;
    expect(entry).toMatchObject({
      id: 'mandate_1', tier: 'chronicle', tick: 40,
      prose: 'Mandate "Green Crown" enters its next stage.',
      witnessFacts: ['Mandate "Green Crown" enters its next stage.'],
    });
  });

  it('keeps a real producer’s alert: an elder site uncovered', () => {
    const event = buildDiscoveryTickEvent(
      { sublocationId: 's1', sublocationName: 'the Drowned Vault', hexCol: 3, hexRow: 4, hasElderMagic: true }, 40);
    const patch = phaseAlertChronicle(makeState([event]));
    expect(patch.chronicleEntries?.map(e => e.prose)).toEqual([event.message]);
  });

  it('reads playerProse over message, and names the actor', () => {
    const state = makeState([alertEvent({
      id: 'amb_1', type: 'ambition_abandoned', actorId: THREADED,
      message: 'raw', playerProse: 'Vara sets aside her oath.', notification: { channel: 'alert', icon: 'dilemma' },
    })]);
    const [entry] = phaseAlertChronicle(state).chronicleEntries!;
    expect(entry.prose).toBe('Vara sets aside her oath.');
    expect(entry.promptContext.actors).toEqual(['Vara']);
  });

  it('writes nothing for an alert the Chronicle already holds this tick (phaseNarrative took it)', () => {
    const event = alertEvent({ id: 'amb_done', type: 'ambition_completed', significance: 0.8 });
    const already = { id: 'amb_done', tick: 40 } as ChronicleEntry;
    expect(phaseAlertChronicle(makeState([event], [already]))).toEqual({});
  });

  it('leaves out an alert the threading gate suppresses — a stranger’s news never reached News', () => {
    const state = makeState([alertEvent({
      id: 'amb_stranger', type: 'ambition_abandoned', actorId: STRANGER, notification: { channel: 'alert', icon: 'dilemma' },
    })]);
    const result = collectAlertChronicle(state);
    expect(result.entries).toEqual([]);
    expect(result.suppressedIds).toEqual(['amb_stranger']);
  });

  it('leaves out an alert on a hex the player cannot see — the same fog filter News applies', () => {
    const fogged = alertEvent({ id: 'prayer_fog', type: 'narrative', hexCoords: { col: 5, row: 6 }, notification: { channel: 'alert' } });
    const seen = alertEvent({ id: 'prayer_seen', type: 'narrative', hexCoords: { col: 1, row: 2 }, notification: { channel: 'alert' } });
    const state = makeState([fogged, seen]);
    (state as { visibilityMap: unknown }).visibilityMap = new Map([
      [hexKeyFromCoord({ col: 5, row: 6 }), { state: 'explored' }],
      [hexKeyFromCoord({ col: 1, row: 2 }), { state: 'visible' }],
    ]);
    const result = collectAlertChronicle(state);
    expect(result.writtenIds).toEqual(['prayer_seen']);
    expect(result.unseenIds).toEqual(['prayer_fog']);
  });

  it('ignores toasts and popups, and writes a repeated id once', () => {
    const state = makeState([
      alertEvent({ id: 'toast_1', notification: { channel: 'toast' } }),
      alertEvent({ id: 'dup' }),
      alertEvent({ id: 'dup' }),
    ]);
    expect(phaseAlertChronicle(state).chronicleEntries?.map(e => e.id)).toEqual(['dup']);
  });

  it('appends to the existing Chronicle rather than replacing it', () => {
    const older = { id: 'old', tick: 12 } as ChronicleEntry;
    const patch = phaseAlertChronicle(makeState([alertEvent({ id: 'new' })], [older]));
    expect(patch.chronicleEntries?.map(e => e.id)).toEqual(['old', 'new']);
  });
});
