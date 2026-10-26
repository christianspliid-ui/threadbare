// @vitest-environment jsdom
/**
 * THR-2054 — The First's own sheet agrees with the bond.
 *
 * 1. Disposition reads the god's thread: a threaded mortal gets a bonded line keyed
 *    on the rite's reception, never "has not yet crossed paths with you".
 * 2. The line is stable across ticks (the seed no longer carries the tick).
 * 3. A threaded mortal's Act row offers no `bind_thread_*` card.
 * 4. An armed card that rolls shows its odds before the Cast press.
 * 5. A success at cost reads "held at a cost", not "faltered".
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { HexTile } from '../../../../types';
import type { Section as DetailSection } from '../../../../types/detailPage';
import { composeSections } from '../../../../engine/detailPageGenerator';
import { actOnSlots, buildActOn } from '../../../../engine/views/subjects/actOn';
import { AGENT_INTERVENTION_TEMPLATES } from '../../../../data/unified-action-templates';
import { templateIdFromSlotId } from '../../../../engine/targetActions';
import { ActOnRow } from '../InspectorParts';
import { ACTOR_BONDED_DISPOSITION_TEMPLATES, ACTOR_FALLBACK_TEMPLATES } from '../../../../data/detail-page-fallback-templates';
import { OUTCOME_BAND_WORDS } from '../../../../data/outcome-band-content';
import type { ActOnVM } from '../../../../engine/views/subjects/subjectTypes';

afterEach(cleanup);

const ASC = 'asc';
const FIRST = 'thessa';

function world(opts: { threaded: boolean; reception?: string; history?: boolean }): GameState {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'quarter', type: 'location', name: 'Temple Quarter', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
  g.addNode({
    id: FIRST, type: 'actor', name: 'Thessa',
    properties: {
      actorType: 'individual',
      ...(opts.history ? { riteHistory: [{ tick: 3, shape: 'meeting', reception: 'doubt' }] } : {}),
    },
  });
  g.addEdge({ id: 'at1', source: FIRST, target: 'quarter', type: 'located_at', properties: {} });
  if (opts.threaded) {
    g.addEdge({
      id: 'th1', source: ASC, target: FIRST, type: 'thread',
      properties: { courtPosition: 'the_first', ...(opts.reception ? { bondReception: opts.reception } : {}) },
    });
  }
  return {
    graph: g,
    ascendantId: ASC,
    tick: 100,
    seed: 42,
    tiles: [{ coord: { col: 3, row: 4 }, terrain: 'grassland', elevation: 0.5, moisture: 0.5 } as unknown as HexTile],
    recentEvents: [],
    familiarityMap: new Map(),
    visibilityMap: new Map(),
    essencePool: { spirit: 50, mind: 50, veil: 50 },
    unifiedActions: [],
    encounterProgress: [],
    controlEffects: [],
    chapterArchive: [],
    strategicState: { projects: [], controls: [], history: [] },
    ascendantIdentity: { divineName: 'Vara', hungerName: 'Witness', sphereAlignment: { primary: 'spirit', secondary: 'mind' } },
  } as unknown as GameState;
}

function disposition(s: GameState, tick = s.tick): string | undefined {
  const rows: DetailSection[] = composeSections('actor', { nodeId: FIRST, pageKind: 'actor', graph: s.graph, seed: s.seed, tick, protagonistId: ASC, state: s });
  const row = rows.find(r => r.typeId === 'portrait_with_disposition') as { bodyProse?: string } | undefined;
  return row?.bodyProse;
}

const fill = (pool: readonly string[]) => pool.map(t => t.replace(/\{Name\}/g, 'Thessa'));

describe('THR-2054 — Disposition reads the bond', () => {
  it('a threaded First gets a line from her reception pool, never a "not yet met" line', () => {
    const line = disposition(world({ threaded: true, reception: 'devotion' }));
    expect(fill(ACTOR_BONDED_DISPOSITION_TEMPLATES.devotion)).toContain(line);
    expect(fill(ACTOR_FALLBACK_TEMPLATES.disposition_no_history)).not.toContain(line);
  });

  it('falls back to the newest riteHistory reception when the edge has none', () => {
    const line = disposition(world({ threaded: true, history: true }));
    expect(fill(ACTOR_BONDED_DISPOSITION_TEMPLATES.doubt)).toContain(line);
  });

  it('uses the plain bonded pool when no reception is recorded', () => {
    const line = disposition(world({ threaded: true }));
    expect(fill(ACTOR_BONDED_DISPOSITION_TEMPLATES.bonded)).toContain(line);
  });

  it('an unthreaded mortal still reads the not-yet-met pool', () => {
    const line = disposition(world({ threaded: false }));
    expect(fill(ACTOR_FALLBACK_TEMPLATES.disposition_no_history)).toContain(line);
  });

  it('the line does not change between ticks', () => {
    const s = world({ threaded: false });
    const lines = new Set([100, 101, 102, 137, 5000].map(t => disposition(s, t)));
    expect(lines.size).toBe(1);
  });
});

describe('THR-2054 — no bind on a mortal who already carries the thread', () => {
  // The bind cards alone: the full hand is capped at MAX_SLOTS, so the narrowed
  // re-read (the cast path's own) is what isolates the dedup gate.
  const binds = AGENT_INTERVENTION_TEMPLATES.filter(t => t.id.startsWith('bind_thread_agent'));
  const bindIds = (s: GameState) =>
    (actOnSlots(s, { kind: 'agent', id: FIRST }, binds)?.slots ?? []).map(sl => templateIdFromSlotId(sl.id) ?? sl.id);

  it('a threaded First is offered no bind_thread_* card', () => {
    expect(binds.length).toBeGreaterThan(0);
    expect(bindIds(world({ threaded: true, reception: 'devotion' })).filter(id => id.startsWith('bind_thread_'))).toEqual([]);
    const actOn = buildActOn(world({ threaded: true, reception: 'devotion' }), { kind: 'agent', id: FIRST }, 'Thessa');
    expect(actOn.cards.some(c => (templateIdFromSlotId(c.actionId) ?? '').startsWith('bind_thread_'))).toBe(false);
  });

  it('an unthreaded mortal is still offered the bind', () => {
    expect(bindIds(world({ threaded: false })).some(id => id.startsWith('bind_thread_'))).toBe(true);
  });
});

describe('THR-2054 — odds before the essence is taken', () => {
  it('an Act row card that rolls carries its odds word', () => {
    const actOn = buildActOn(world({ threaded: false }), { kind: 'agent', id: FIRST }, 'Thessa');
    const rolled = actOn.cards.filter(c => c.odds);
    expect(rolled.length).toBeGreaterThan(0);
  });

  it('arming the card shows "Odds: …" beside the Cast button, before any cast', () => {
    const actOn: ActOnVM = {
      heading: 'Act on Thessa',
      emptyLine: null,
      cards: [{ actionId: 'ta_x', name: 'Bless', sphere: 'spirit', available: true, reason: null, odds: 'Favorable' }],
    };
    let casts = 0;
    const { container } = render(<ActOnRow actOn={actOn} targetName="Thessa" onCast={() => { casts++; return { cast: true, reason: null }; }} />);
    expect(container.querySelector('[data-act-odds]')).toBeNull();
    fireEvent.click(container.querySelector('[data-act-card="ta_x"] button')!);
    expect(casts).toBe(0);
    expect(container.querySelector('[data-act-odds]')?.textContent).toBe('Odds: Favorable');
    expect(container.querySelector('[data-act-cast="ta_x"]')).not.toBeNull();
  });
});

describe('THR-2054 — a success at cost does not read as failure', () => {
  it('strained reads "held at a cost"', () => {
    expect(OUTCOME_BAND_WORDS.strained).toBe('held at a cost');
  });
});
