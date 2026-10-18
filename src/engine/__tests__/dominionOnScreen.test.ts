/**
 * THR-1750 — Dominion on screen, engine half (plan § Done when):
 * - the same card read on a Sovereign and a Hostile place shows different pips and
 *   chips, and the slot's `essenceCost` equals what the cast charges;
 * - on Foreign ground, and on a free card, no chip;
 * - `DOMINION_PRICES_LIVE` is on;
 * - the sheet view models (place, mortal, unborne artifact, no god) and the hex line.
 */
import { describe, it, expect } from 'vitest';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { SphereName } from '../../types/index';
import { WorldGraph } from '../graph';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import { getTargetActionSlots } from '../targetActions';
import { preparePlayerCast } from '../playerCastDispatch';
import { dominionOf } from '../dominion';
import { DOMINION_PRICES_LIVE, DOMINION_BAND_LINES } from '../../data/dominion-content';
import { DOMINION_CHIP_WORDS, DOMINION_CAST_CLAUSE, DOMINION_TEND_LINES } from '../../data/dominion-ui-content';
import { dominionChipFields } from '../../components/Game/actionCardModel';
import { dominionSheetVM, dominionHexLineVM } from '../dominionViewModels';
import { buildDominionHexAssignment, buildDominionHexProjection } from '../dominionProjection';
import type { HexTile } from '../../types';
import type { WheelSlot } from '../wheel';

const GOD = 'asc.witness';

function bag(scores: Partial<Record<SphereName, number>>) {
  const a = createDefaultSphereAffinity();
  for (const [s, v] of Object.entries(scores)) a.scores[s as SphereName] = v as number;
  return a;
}

function makeTemplate(essenceCost = 8): UnifiedActionTemplate {
  return {
    id: 'loc.test_working', rarityTier: 2, intrinsicTier: 'background', name: 'Test Working',
    reach: 'stone', crudType: 'update', scale: 'local',
    steps: [{ reach: 'stone', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' }],
    apCost: 1, essenceCost, actorAffinities: ['ascendant'], targetCategories: ['location'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  };
}

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: GOD, type: 'actor', name: 'The Witness',
    properties: {
      actorType: 'ascendant', domainAffinities: { stone: 4 },
      spherePoints: { mind: 3, spirit: 2 }, sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      sphereAffinity: bag({ mind: 2, spirit: 1 }), dominionPowerBaseline: 3,
      homeSeatLocationId: 'loc.home',
    },
  });
  graph.addNode({ id: 'loc.home', type: 'location', name: 'Home', properties: { hexCol: 1, hexRow: 1, sphereAffinity: bag({ mind: 5, spirit: 5 }) } });
  graph.addNode({ id: 'loc.foe', type: 'location', name: 'Foe', properties: { hexCol: 6, hexRow: 1, sphereAffinity: bag({ force: 5, energy: 5 }) } });
  graph.addNode({ id: 'loc.plain', type: 'location', name: 'Plain', properties: { hexCol: 9, hexRow: 1, sphereAffinity: bag({}) } });
  graph.addNode({ id: 'm.walker', type: 'actor', name: 'Walker', properties: { actorType: 'individual', sphereAffinity: bag({ mind: 5, spirit: 5 }) } });
  graph.addNode({ id: 'art.loose', type: 'artifact', name: 'Loose Ring', properties: {} });
  return graph;
}

function slotFor(graph: WorldGraph, targetId: string, template = makeTemplate()): WheelSlot {
  const slots = getTargetActionSlots({
    target: {
      nodeId: targetId, nodeType: 'location', displayName: targetId, displayLabel: '',
      subtype: null, traitIds: [], sphereAffinity: null, position: null,
      properties: graph.getNode(targetId)!.properties,
    },
    templates: [template],
    pool: { mind: 99, spirit: 99 } as never,
    primarySphere: 'mind',
    accessibleSpheres: ['mind', 'spirit'] as never,
    unlockedActionIds: [template.id],
    graph,
    controlOwnerId: GOD,
  });
  return slots.find(sl => sl.id.endsWith(template.id))!;
}

describe('THR-1750 — prices live, the slot carries par, the chip', () => {
  it('DOMINION_PRICES_LIVE is on', () => {
    expect(DOMINION_PRICES_LIVE).toBe(true);
  });

  it('the fixture bands are Sovereign, Hostile and Foreign', () => {
    const g = makeGraph();
    expect(dominionOf(g, GOD, 'loc.home').band).toBe('sovereign');
    expect(dominionOf(g, GOD, 'loc.foe').band).toBe('hostile');
    expect(dominionOf(g, GOD, 'loc.plain').band).toBe('foreign');
  });

  it('the same card on Sovereign and Hostile ground: different pips, different chips, preview = charge', () => {
    const g = makeGraph();
    const home = slotFor(g, 'loc.home');
    const foe = slotFor(g, 'loc.foe');
    expect(home.dominionParCost).toBe(8);
    expect(foe.dominionParCost).toBe(8);
    expect(home.essenceCost).toBeLessThan(8);
    expect(foe.essenceCost).toBeGreaterThan(8);

    expect(dominionChipFields(home).dominion).toEqual({ band: 'sovereign', parCost: 8, chip: DOMINION_CHIP_WORDS.sovereign });
    expect(dominionChipFields(foe).dominion).toEqual({ band: 'hostile', parCost: 8, chip: DOMINION_CHIP_WORDS.hostile });

    for (const [slot, targetId] of [[home, 'loc.home'], [foe, 'loc.foe']] as const) {
      const charged = preparePlayerCast({
        graph: g, ascendantId: GOD, template: makeTemplate(), templateId: 'loc.test_working', targetId,
        tick: 10, seed: 42, sphere: 'mind', applyBuffs: false,
      } as never);
      expect(slot.essenceCost).toBe(charged.action.essencePaid);
    }
  });

  it('no chip on Foreign ground, and none on a free card', () => {
    const g = makeGraph();
    expect(dominionChipFields(slotFor(g, 'loc.plain'))).toEqual({});
    const free = slotFor(g, 'loc.home', makeTemplate(0));
    expect(free.dominionParCost).toBeUndefined();
    expect(dominionChipFields(free)).toEqual({});
  });

});

describe('THR-1750 — sheet view models', () => {
  it('a place box: band word, line, and the seat tend line', () => {
    const vm = dominionSheetVM(makeGraph(), GOD, 'loc.home', [], true)!;
    expect(vm.band).toBe('sovereign');
    expect(vm.word).toBe('Sovereign');
    expect(vm.line).toBe(DOMINION_BAND_LINES.sovereign);
    expect(vm.tendLine).toBe(DOMINION_TEND_LINES.seat);
    expect(vm.sphereColorVar).toBe('var(--sphere-mind-bright)');
    expect(vm.tooltipId).toBe('ui.dominion.sovereign');
  });

  it('Hostile ground: red word, no tend line', () => {
    const vm = dominionSheetVM(makeGraph(), GOD, 'loc.foe', [], true)!;
    expect(vm.band).toBe('hostile');
    expect(vm.sphereColorVar).toBe('var(--negative)');
    expect(vm.tendLine).toBeNull();
  });

  it('untended Touched-or-better ground says it will slip back', () => {
    const g = makeGraph();
    g.updateNode(GOD, { properties: { homeSeatLocationId: undefined } });
    expect(dominionSheetVM(g, GOD, 'loc.home', [], true)!.tendLine).toBe(DOMINION_TEND_LINES.untended);
  });

  it('a mortal reads her own scores; an unborne artifact is Foreign; no god → null', () => {
    const g = makeGraph();
    expect(dominionSheetVM(g, GOD, 'm.walker')!.band).toBe(dominionOf(g, GOD, 'm.walker').band);
    expect(dominionSheetVM(g, GOD, 'art.loose')!.band).toBe('foreign');
    expect(dominionSheetVM(g, null, 'loc.home')).toBeNull();
    expect(dominionSheetVM(g, 'asc.missing', 'loc.home')).toBeNull();
    expect(dominionSheetVM(g, GOD, 'nope')).toBeNull();
  });

  it('the hex line names the place that lent the band, and agrees with the place', () => {
    const g = makeGraph();
    const tiles = [{ coord: { col: 1, row: 1 }, terrain: 'grassland' }, { coord: { col: 2, row: 1 }, terrain: 'grassland' }] as HexTile[];
    const p = buildDominionHexProjection(g, GOD, buildDominionHexAssignment(g, tiles));
    const line = dominionHexLineVM(g, p, '2,1')!;
    expect(line.text).toBe('Sovereign ground, by Home');
    expect(line.prefix).toBe('Sovereign ground, by ');
    expect(line.band).toBe(dominionSheetVM(g, GOD, 'loc.home')!.band);
  });
});

describe('THR-1750 review round 2', () => {
});
