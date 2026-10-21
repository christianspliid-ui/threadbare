// @vitest-environment jsdom
/**
 * THR-1992 — four things the retired sheets showed, back on the Inspector.
 *
 * Each display is resolved in the engine from the data the engine still writes, then
 * rendered through the shared parts (`Section`, `ActOnRow`). Each test asserts the words
 * the player reads and that the display is absent when there is no data (Law 25).
 * Words, never numbers (Laws 13/14).
 *
 * 1. The Blood line on the person page (Bonds) — `card.grudges`.
 * 2. The pilgrim way on the place page and the faction page — `sacred_route` edges.
 * 3. The lair's monster card on the lair's place page and in the land page's Lair row.
 * 4. A cast card's fate word on the Act row — `playerActionReceipts`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { HexTile } from '../../../../types';
import type { PageLayoutKind, Section as DetailSection } from '../../../../types/detailPage';
import type { GraphNode } from '../../../../types/graph';
import { composeSections } from '../../../../engine/detailPageGenerator';
import { buildActOn } from '../../../../engine/views/subjects/actOn';
import { templateIdFromSlotId } from '../../../../engine/targetActions';
import { buildLandIndex } from '../../../../engine/views/landIndex';
import type { HexContentsVM } from '../../../../engine/views/hexContents';
import { Section } from '../../../shared/Section';
import { ActOnRow } from '../InspectorParts';

afterEach(cleanup);

const ASC = 'asc';
const TICK = 100;

function state(graph: WorldGraph, extra: Partial<GameState> = {}): GameState {
  return {
    graph,
    ascendantId: ASC,
    tick: TICK,
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
    ...extra,
  } as unknown as GameState;
}

function sections(s: GameState, kind: PageLayoutKind, nodeId: string): DetailSection[] {
  return composeSections(kind, { nodeId, pageKind: kind, graph: s.graph, seed: s.seed, tick: s.tick, protagonistId: ASC, state: s });
}

function row(s: GameState, kind: PageLayoutKind, nodeId: string, typeId: string): DetailSection | undefined {
  return sections(s, kind, nodeId).find(x => x.typeId === typeId);
}

/** No numeral reaches the player (Laws 13/14). */
function expectNoDigits(text: string | null | undefined) {
  expect(text ?? '').not.toMatch(/\d/);
}

// ─── 1. The Blood line ────────────────────────────────────────────────────────

function bloodWorld(withGrudge: boolean): GameState {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'town', type: 'location', name: 'Ashford', properties: { locationType: 'town', hexCol: 3, hexRow: 4 } });
  g.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual', npcRole: 'smith', locationId: 'town' } });
  g.addNode({ id: 'oswen', type: 'actor', name: 'Oswen', properties: { actorType: 'individual' } });
  g.addEdge({ id: 'at1', source: 'kael', target: 'town', type: 'located_at', properties: {} });
  // The god's own avatar is read whole, so the knowledge gate is open.
  g.addEdge({ id: 'av1', source: 'kael', target: ASC, type: 'avatar_of', properties: {} });
  if (withGrudge) g.addEdge({ id: 'h1', source: 'kael', target: 'oswen', type: 'hostile_to', properties: { cause: 'grievance_cooled' } });
  return state(g);
}

describe('the Blood line (person page, Bonds)', () => {
  it('names the other party as a link and says why the blood stands', () => {
    const section = row(bloodWorld(true), 'actor', 'kael', 'blood');
    expect(section).toMatchObject({ kind: 'prose', label: 'Blood', tab: 'bonds' });
    const { container } = render(<Section section={section!} />);
    const text = container.textContent ?? '';
    expect(text).toContain('There is blood between them and Oswen — ');
    expect(text).toMatch(/Oswen — .+\.$/);
    expect(container.querySelector('[data-term="t0"]')?.textContent).toBe('Oswen');
    expect(section!.kind === 'prose' && section!.termRefs?.t0).toEqual({ nodeId: 'oswen', pageKind: 'actor' });
    expectNoDigits(text);
  });

  it('is absent when there is no blood', () => {
    expect(row(bloodWorld(false), 'actor', 'kael', 'blood')).toBeUndefined();
  });
});

// ─── 2. The pilgrim way ───────────────────────────────────────────────────────

function pilgrimWorld(withWay: boolean): GameState {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'town', type: 'location', name: 'Ashford', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
  g.addNode({ id: 'brindle', type: 'location', name: 'Brindle', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
  g.addNode({ id: 'cong', type: 'actor', name: 'The Ashen Folk', properties: { actorType: 'faction' } });
  if (withWay) {
    g.addEdge({ id: 'sr1', source: 'cong', target: 'town', type: 'sacred_route', properties: { origin: 'worldgen', establishedTick: 0 } });
    g.addEdge({ id: 'sr2', source: 'cong', target: 'brindle', type: 'sacred_route', properties: { origin: 'undertaking', establishedTick: 40 } });
  }
  return state(g);
}

describe('the pilgrim way (place page and faction page)', () => {
  it('a town names the congregation whose pilgrims come there', () => {
    const section = row(pilgrimWorld(true), 'place', 'town', 'pilgrim_way');
    expect(section).toMatchObject({ kind: 'prose', label: 'Pilgrim ways', labelTooltipId: 'ui.pilgrim_way' });
    const { container } = render(<Section section={section!} />);
    expect(container.textContent).toContain('Pilgrims come here — a way of The Ashen Folk.');
    expect(section!.kind === 'prose' && section!.termRefs?.t0).toEqual({ nodeId: 'cong', pageKind: 'faction' });
    expectNoDigits(container.textContent);
  });

  it('a congregation names the towns its ways lead to, in id order', () => {
    const section = row(pilgrimWorld(true), 'faction', 'cong', 'pilgrim_ways');
    const { container } = render(<Section section={section!} />);
    expect(container.textContent).toContain('Pilgrim ways to Brindle, Ashford.');
    expect(section!.kind === 'prose' && section!.termRefs).toEqual({
      t0: { nodeId: 'brindle', pageKind: 'place' },
      t1: { nodeId: 'town', pageKind: 'place' },
    });
    expectNoDigits(container.textContent);
  });

  it('is absent on a town no way reaches and a congregation with none', () => {
    expect(row(pilgrimWorld(false), 'place', 'town', 'pilgrim_way')).toBeUndefined();
    expect(row(pilgrimWorld(false), 'faction', 'cong', 'pilgrim_ways')).toBeUndefined();
  });
});

// ─── 3. The lair's monster card ───────────────────────────────────────────────

const LAIR = 'lair_ashen';
const BEAST = 'elite_ashen';
const KILLER = 'tam';

function lairWorld(opts: { monster: 'living' | 'slain' | 'none' }): GameState {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'trait.temper.berserk', type: 'trait', name: 'Berserk', properties: {} });
  g.addNode({
    id: LAIR, type: 'location', name: 'The Ashen Hollow',
    properties: { locationType: 'lair', locationSubtype: 'lair', lairTier: 'major', hexCol: 3, hexRow: 4, ...(opts.monster === 'none' ? {} : { namedEliteId: BEAST }) },
  });
  if (opts.monster !== 'none') {
    const slain = opts.monster === 'slain';
    const beast: GraphNode = {
      id: BEAST, type: 'actor', name: 'Grothmaw the Hollow',
      properties: {
        actorType: 'individual', isMonsterElite: true, lairId: LAIR,
        monsterState: { family: 'beast', dread: 'steep', might: 'steep', clockSize: 6, clockFilled: 3, clockUpdatedTick: TICK, temperShown: false },
        ...(slain ? { deceased: true, deceasedTick: 90, deathCause: 'fight', slainBy: KILLER } : {}),
      },
    };
    g.addNode(beast);
    g.addEdge({ id: 'tmp', source: BEAST, target: 'trait.temper.berserk', type: 'has_trait', properties: {} });
    g.addNode({ id: KILLER, type: 'actor', name: 'Tam Rook', properties: { actorType: 'individual' } });
  }
  return state(g);
}

describe("the lair's monster card (lair place page)", () => {
  it('names the monster, says its sentence, and draws square pips with the clock word', () => {
    const section = row(lairWorld({ monster: 'living' }), 'place', LAIR, 'lair_monster');
    expect(section).toMatchObject({ kind: 'cards', label: 'What lairs here' });
    const { container } = render(<Section section={section!} />);
    const text = container.textContent ?? '';
    expect(text).toContain('Holds this lair');
    expect(text).toContain('Grothmaw the Hollow');
    expect(text).toContain('half-broken');
    expect(container.querySelector('[data-tile-clock]')).not.toBeNull();
    expect(container.querySelector('[data-tile-by]')).toBeNull();
    expectNoDigits(text);
  });

  it('a slain monster reads "slain by" its killer, the killer a link', () => {
    const section = row(lairWorld({ monster: 'slain' }), 'place', LAIR, 'lair_monster');
    const { container } = render(<Section section={section!} />);
    const clock = container.querySelector('[data-tile-clock]');
    expect(clock?.textContent).toContain('slain');
    expect(clock?.textContent).toContain('by');
    expect(container.querySelector('[data-tile-by]')?.textContent).toContain('Tam Rook');
    expect(container.textContent).toContain('Held this lair');
    expectNoDigits(container.textContent);
  });

  it('is absent when no monster holds or held the lair, and on a place that is not a lair', () => {
    expect(row(lairWorld({ monster: 'none' }), 'place', LAIR, 'lair_monster')).toBeUndefined();
    expect(row(pilgrimWorld(true), 'place', 'town', 'lair_monster')).toBeUndefined();
  });
});

describe("the lair's monster in the land page's Lair row", () => {
  const contents = (lairs: HexContentsVM['lairs']): HexContentsVM => ({
    hexKey: '3,4', people: [], locations: [], armies: [], artifacts: [], lairs, ruins: [], halls: [], resources: [], covenants: [],
  } as unknown as HexContentsVM);

  it('lists the monster under its lair, its fact the clock word', () => {
    const s = lairWorld({ monster: 'slain' });
    const lair = buildLandIndex(contents([{ ref: { kind: 'location', id: LAIR }, name: 'The Ashen Hollow' }]), s).rows.find(r => r.id === 'lair');
    expect(lair?.rows.map(r => r.name)).toEqual(['The Ashen Hollow', 'Grothmaw the Hollow']);
    expect(lair?.rows[1]).toMatchObject({ ref: { kind: 'agent', id: BEAST }, fact: 'slain by Tam Rook' });
  });

  it('lists the lair alone when no monster resolves', () => {
    const s = lairWorld({ monster: 'none' });
    const lair = buildLandIndex(contents([{ ref: { kind: 'location', id: LAIR }, name: 'The Ashen Hollow' }]), s).rows.find(r => r.id === 'lair');
    expect(lair?.rows.map(r => r.name)).toEqual(['The Ashen Hollow']);
  });
});

// ─── 4. The fate word on the Act row ──────────────────────────────────────────

function actWorld(): GameState {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'quarter', type: 'location', name: 'Temple Quarter', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
  g.addNode({ id: 'shutash', type: 'actor', name: 'Shutash', properties: { actorType: 'individual' } });
  g.addNode({ id: 'other', type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
  g.addEdge({ id: 'at1', source: 'shutash', target: 'quarter', type: 'located_at', properties: {} });
  g.addEdge({ id: 'at2', source: 'other', target: 'quarter', type: 'located_at', properties: {} });
  return state(g);
}

describe('the fate word on the Act row card (Law 37)', () => {
  function withReceipt(s: GameState, templateId: string, targetId: string, band: string): GameState {
    return {
      ...s,
      playerActionReceipts: [{
        id: 'r1', actionId: 'a1', templateId, templateName: 'x', targetId, targetName: 'x', essencePaid: 1,
        startTick: 90, resolvedTick: 95, outcome: 'failure', outcomeBand: band, overview: '', changes: [],
        presentation: 'toast', acknowledged: true,
      }],
    } as unknown as GameState;
  }

  it('the card cast on this subject wears how it landed', () => {
    const base = actWorld();
    const plain = buildActOn(base, { kind: 'agent', id: 'shutash' }, 'Shutash');
    expect(plain.cards.length).toBeGreaterThan(0);
    // A cast card: the receipt keys on the template id the slot carries (the drawer's `resolvedBands`).
    const first = plain.cards.find(c => templateIdFromSlotId(c.actionId))!;
    const s = withReceipt(base, templateIdFromSlotId(first.actionId)!, 'shutash', 'setback');
    const actOn = buildActOn(s, { kind: 'agent', id: 'shutash' }, 'Shutash');
    const card = actOn.cards.find(c => c.actionId === first.actionId)!;
    expect(card.fate).toEqual({ band: 'setback', word: 'broke' });
    expect(actOn.cards.filter(c => c.fate).length).toBe(1);

    const { container } = render(<ActOnRow actOn={actOn} targetName="Shutash" />);
    expect(container.querySelector(`[data-act-card="${first.actionId}"] [data-act-fate]`)?.textContent).toBe('broke');
    expectNoDigits(container.textContent);
  });

  it('wears nothing for a cast on someone else, or with no receipts', () => {
    const base = actWorld();
    const plain = buildActOn(base, { kind: 'agent', id: 'shutash' }, 'Shutash');
    expect(plain.cards.every(c => c.fate === undefined)).toBe(true);
    const first = plain.cards.find(c => templateIdFromSlotId(c.actionId))!;
    const elsewhere = withReceipt(base, templateIdFromSlotId(first.actionId)!, 'other', 'setback');
    const actOn = buildActOn(elsewhere, { kind: 'agent', id: 'shutash' }, 'Shutash');
    expect(actOn.cards.every(c => c.fate === undefined)).toBe(true);
    const { container } = render(<ActOnRow actOn={actOn} targetName="Shutash" />);
    expect(container.querySelector('[data-act-fate]')).toBeNull();
  });
});
