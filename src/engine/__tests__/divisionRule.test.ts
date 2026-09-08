/**
 * The division rule, wired into the board (THR-1403 — the flip onto the cells model).
 *
 * Proves the wiring, not the tables (those are THR-1398's and the codex test reads
 * them): a mortal's spread is derived from the ambition's category and their leading
 * Reaches; the board walks derived cells the hand list never named; under `templates`
 * no cell is walked at all; the rotation is deterministic and a rotation; and the
 * per-ambition cap that starved list positions on the template model does not bind a
 * cell — six cell candidates from one ambition where the cap allows five.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateStrategicCandidates, findAmbitionTemplate } from '../strategicActionCandidates';
import { deriveDivisionCells, leadingReachPair, rotateForTick } from '../divisionRule';
import { mulberry32 } from '../../lib/prng';
import { clearTraces, enableTracing } from '../traceBuffer';
import {
  STRATEGIC_MAX_CANDIDATES_PER_AMBITION,
  STRATEGIC_MAX_CANDIDATES_PER_ACTOR,
  UNDERTAKING_MAX_CANDIDATES_PER_CELL,
} from '../../data/strategic-action-constants';
import { isCellTemplateId } from '../../data/undertaking-cells';

const ME = 'actor_me';
const RIVAL = 'actor_rival';
const REVENGE = 'ambition_seek_revenge';

function mortal(g: WorldGraph, id: string, caps: Record<string, number>, name = id): void {
  g.addNode({ id, name, type: 'actor', properties: { actorType: 'individual', spotlightTier: 'spotlight', domainCapabilities: caps } });
}

const FULL = { iron: 0.9, shadow: 0.9, eye: 0.9, heart: 0.9, gold: 0.9, stone: 0.9, star: 0.9, veil: 0.9 };

/** Two rivals in one town; the rival holds two charts, two marks and two standings — six objects across three vengeance cells. */
function world(): WorldGraph {
  const g = new WorldGraph();
  mortal(g, ME, FULL, 'Hask');
  mortal(g, RIVAL, FULL, 'Lirik');
  mortal(g, 'a', {}, 'Ada');
  mortal(g, 'b', {}, 'Bram');
  g.addNode({ id: 'town', name: 'Millbrook', type: 'location', properties: { locationSubtype: 'town', hexCol: 5, hexRow: 5 } });
  for (const id of [ME, RIVAL, 'a', 'b']) g.addEdge({ id: `loc_${id}`, source: id, target: 'town', type: 'located_at', properties: {} });
  for (const n of ['chart_1', 'chart_2']) {
    g.addNode({ id: n, name: n, type: 'artifact', properties: { tier: 1 } });
    g.addEdge({ id: `p_${n}`, source: RIVAL, target: n, type: 'possesses', properties: { active: true } });
  }
  for (const t of ['a', 'b']) {
    g.addEdge({ id: `mark_${t}`, source: RIVAL, target: t, type: 'knows_secret_of', properties: { magnitude: 0.5, revealed: false, secretType: 'affair', discoveredTick: 0, source: 'observed' } });
    g.addEdge({ id: `rel_${t}`, source: RIVAL, target: t, type: 'relates_to', properties: { sentiment: 0.5, basis: 'friendship', trust: 0.2 } });
  }
  g.addEdge({ id: 'h', source: ME, target: RIVAL, type: 'hostile_to', properties: { cause: 'covets' } });
  return g;
}

describe('the derivation', () => {
  it('reads the two leading reaches, and the crossing of the category\'s verbs with their kinds', () => {
    const g = new WorldGraph();
    mortal(g, 'm', { gold: 0.9, stone: 0.5, iron: 0.1 });
    expect(leadingReachPair(g.getNode('m'))).toEqual(['gold', 'stone']);
    const cells = deriveDivisionCells(g.getNode('m'), 'dominion');
    expect(cells).toContain('cell.create.route');
    expect(cells).toContain('cell.create.place');
    expect(cells).toContain('cell.control_claim.route');
    // Dominion has no destroy; gold and stone reach no faction.
    expect(cells.some(c => c.startsWith('cell.destroy.'))).toBe(false);
    expect(cells.some(c => c.endsWith('.faction'))).toBe(false);
    expect(cells).toEqual([...cells].sort());
  });

  it('adds watching on every kind for an Eye, and derives nothing for a mortal with no capabilities', () => {
    const g = new WorldGraph();
    mortal(g, 'eye', { eye: 0.9 });
    mortal(g, 'none', {});
    expect(deriveDivisionCells(g.getNode('eye'), 'discovery')).toContain('cell.observe.faction');
    expect(deriveDivisionCells(g.getNode('none'), 'dominion')).toEqual([]);
  });

  it('rotates deterministically — same inputs, same order, the same set', () => {
    const items = ['a', 'b', 'c', 'd'];
    const once = rotateForTick(items, 7, 'actor_x');
    expect(rotateForTick(items, 7, 'actor_x')).toEqual(once);
    expect([...once].sort()).toEqual(items);
    expect(rotateForTick(items, 8, 'actor_x')).not.toEqual(once);
    expect(rotateForTick([], 3, 'actor_x')).toEqual([]);
  });
});

describe('the board under the cells model', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });

  it('walks derived cells the ambition\'s hand list never named, and no cell at all under templates', () => {
    // A bare world — one mortal, nothing to act on — so every walked id lands as a
    // refusal and the per-actor cap never cuts the walk short.
    const g = new WorldGraph();
    mortal(g, ME, FULL, 'Hask');
    g.addNode({ id: 'town', name: 'Millbrook', type: 'location', properties: { locationSubtype: 'town', hexCol: 5, hexRow: 5 } });
    g.addEdge({ id: 'loc_me', source: ME, target: 'town', type: 'located_at', properties: {} });
    const hand = new Set(findAmbitionTemplate(REVENGE)!.strategicProfile!.cells ?? []);
    const derived = deriveDivisionCells(g.getNode(ME), 'vengeance').filter(c => !hand.has(c));
    expect(derived.length).toBeGreaterThan(0);

    const cells = generateStrategicCandidates(g, ME, [REVENGE], undefined, 10, mulberry32(1), undefined, 'cells');
    const walked = new Set([...cells.candidates.map(c => c.templateId), ...cells.rejections.map(r => r.templateId)]);
    for (const c of derived) expect(walked.has(c), `${c} is walked`).toBe(true);

    const templates = generateStrategicCandidates(g, ME, [REVENGE], undefined, 10, mulberry32(1), undefined, 'templates');
    const walkedTemplates = [...templates.candidates.map(c => c.templateId), ...templates.rejections.map(r => r.templateId)];
    expect(walkedTemplates.some(isCellTemplateId)).toBe(false);
  });

  it('offers mentorship beside the spread for the categories that used to list it, and nowhere else', () => {
    const g = world();
    const walked = (ambitionId: string) => {
      const r = generateStrategicCandidates(g, ME, [ambitionId], undefined, 10, mulberry32(1), undefined, 'cells');
      return new Set([...r.candidates.map(c => c.templateId), ...r.rejections.map(x => x.templateId)]);
    };
    expect(findAmbitionTemplate('ambition_arcane_enlightenment')!.category).toBe('mastery');
    expect(walked('ambition_arcane_enlightenment').has('strategic_train_apprentice')).toBe(true);
    expect(walked(REVENGE).has('strategic_train_apprentice')).toBe(false);
  });

  it('the per-ambition cap does not bind a cell — six cell candidates from one ambition where the cap allows five', () => {
    const g = world();
    const { candidates } = generateStrategicCandidates(g, ME, [REVENGE], undefined, 10, mulberry32(1), undefined, 'cells');
    const cellCandidates = candidates.filter(c => isCellTemplateId(c.templateId));
    expect(STRATEGIC_MAX_CANDIDATES_PER_AMBITION).toBeLessThan(6);
    expect(cellCandidates.length).toBeGreaterThanOrEqual(6);
    // Several cells each enumerate more than one object — which is the claim: a cell
    // takes its own per-cell allowance (`UNDERTAKING_MAX_CANDIDATES_PER_CELL`) and is
    // not rationed by the per-ambition cap.
    const byCell = new Map<string, number>();
    for (const c of cellCandidates) byCell.set(c.templateId, (byCell.get(c.templateId) ?? 0) + 1);
    expect([...byCell.values()].filter(n => n >= 2).length).toBeGreaterThanOrEqual(3);
    expect([...byCell.values()].every(n => n <= UNDERTAKING_MAX_CANDIDATES_PER_CELL)).toBe(true);

    // What *does* bind is the per-actor ceiling — never the per-ambition cap, which is
    // the claim. Asserted as the ceiling rather than *at* it (THR-1439): whether the
    // ceiling is actually reached depends on how many of the rotated cells find an
    // object in this fixture world, and the rotation offset is `% items.length`, so
    // every cell the division rule gains reshuffles which ones land inside it. Pinning
    // the exact total made this test fail on any change to the derived set — the same
    // brittleness that made pinning three cell ids by name untenable (THR-1438 added
    // two and it did; THR-1439 added four more).
    expect(cellCandidates.length).toBeLessThanOrEqual(STRATEGIC_MAX_CANDIDATES_PER_ACTOR);
    expect(cellCandidates.length).toBeGreaterThan(STRATEGIC_MAX_CANDIDATES_PER_AMBITION);
  });
});
