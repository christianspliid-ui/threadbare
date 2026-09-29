// src/engine/__tests__/worldPastWords.test.ts
//
// THR-1656 (THR-1631 S2) — the player meets the past. Asserted on a *generated* small
// world, never a fixture: the words read what S1's pass derived from the map.

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { _resetNpcCounter } from '../npcSeeding';
import { resetEventCounter } from '../orchestrator';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { getPlacePast, readWorldPast, readWorldPastForPlayer, isPastPlaceKnown } from '../worldPast';
import {
  buildBeforeYouWoke,
  buildDeadPastLine,
  buildPlacePastLine,
  pastLineText,
  renderPastTemplate,
  resetWorldPastWordsWarnings,
  ruinKindsPhrase,
  assignWonderLegends,
  placePastEnrichment,
  worldHasPast,
  type PastLine,
} from '../worldPastWords';
import { getLocationNodes } from '../sublocationShape';
import { enrichProse, gatherNarrativeContext, type NarrativeContext } from '../proseEnrichment';
import {
  WONDER_LEGEND_LINES,
  BURNED_TOWN_FOGGED_LINE,
} from '../../data/world-past-content';
import type { GameState } from '../../types/gameState';
import type { WorldPastKnowledge } from '../../types/worldPast';

const SEED = 42;

function buildWorld(seed = SEED): GameState {
  _resetNpcCounter();
  resetEventCounter();
  resetReputationTraitInit();
  const preset = MAP_SIZE_PRESETS.small;
  return initializeGameState(generateArchetypes(4, seed)[0], 'T', createBalancedCosmology(), seed, preset.cols, preset.rows).state;
}

/** Fog with nothing seen — every specific must stay unnamed. */
const DARK: WorldPastKnowledge = { visibility: new Map(), hexRevelation: {} };

function seeing(keys: string[]): WorldPastKnowledge {
  return { visibility: new Map(keys.map(k => [k, { state: 'remembered' }])), hexRevelation: {} };
}

function hexKeyOf(state: GameState, id: string): string {
  const p = state.graph.getNode(id)!.properties;
  return `${p.hexCol},${p.hexRow}`;
}

const DIGIT = /\d/;
const LEAK = /[{}]|<<|>>/;

function allLines(state: GameState, knowledge: WorldPastKnowledge): PastLine[] {
  const g = state.graph;
  const view = readWorldPastForPlayer(g, knowledge);
  const lines = buildBeforeYouWoke(g, view).flatMap(gr => gr.lines);
  for (const loc of g.getNodesByType('location')) {
    const line = buildPlacePastLine(g, loc.id, knowledge);
    if (line) lines.push(line);
  }
  for (const a of g.getNodesByType('actor')) {
    const line = buildDeadPastLine(g, a.id);
    if (line) lines.push(line);
  }
  return lines;
}

describe('worldPastWords — the player meets the past (THR-1656)', () => {
  let state: GameState;
  beforeAll(() => { state = buildWorld(); });
  afterEach(() => { resetWorldPastWordsWarnings(); vi.restoreAllMocks(); });

  it('no past line carries a numeral or a leaked token, fogged or not', () => {
    for (const k of [DARK, {}]) {
      const lines = allLines(state, k);
      expect(lines.length).toBeGreaterThan(10);
      for (const line of lines) {
        const text = pastLineText(line) + (line.quote ?? '');
        expect(text, text).not.toMatch(DIGIT);
        expect(text, text).not.toMatch(LEAK);
      }
    }
  });

  it('the chapter has four counted groups and the outline shows from minute one', () => {
    const view = readWorldPastForPlayer(state.graph, DARK);
    expect(worldHasPast(view)).toBe(true);
    const groups = buildBeforeYouWoke(state.graph, view);
    expect(groups.map(g => g.key)).toEqual(['elder', 'settling', 'living', 'wonders']);
    const elder = groups[0];
    expect(elder.count).toBe(view.elderAge.empires.length);
    // Every capital's founder is named in the dark — founding is outline.
    const settling = groups[1];
    const founders = view.settling.filter(s => s.founderId);
    expect(founders.length).toBeGreaterThan(0);
    for (const f of founders) {
      expect(settling.lines.some(l => l.segments.some(s => s.ref?.id === f.founderId))).toBe(true);
    }
  });

  it('a burned town is unnamed in the dark and named once its hex is seen', () => {
    const war = readWorldPast(state.graph).livingMemory.find(w => w.burnedTownId);
    expect(war, 'seed 42 small has a war with a burned town').toBeDefined();
    const town = war!.burnedTownId!;

    const darkLiving = buildBeforeYouWoke(state.graph, readWorldPastForPlayer(state.graph, DARK))[2];
    const darkLine = darkLiving.lines.find(l => l.id === `war:${war!.eventId}`)!;
    expect(darkLine.segments.some(s => s.ref?.id === town)).toBe(false);
    expect(pastLineText(darkLine)).toContain(BURNED_TOWN_FOGGED_LINE.replace(/<<|>>/g, ''));

    const lit = seeing([hexKeyOf(state, town)]);
    expect(isPastPlaceKnown(state.graph, town, lit)).toBe(true);
    const litLine = buildBeforeYouWoke(state.graph, readWorldPastForPlayer(state.graph, lit))[2]
      .lines.find(l => l.id === `war:${war!.eventId}`)!;
    expect(litLine.segments.some(s => s.ref?.id === town && s.ref.kind === 'location')).toBe(true);

    // The page line: fogged twin names no war; found, it names both sides.
    const pageDark = buildPlacePastLine(state.graph, town, DARK)!;
    expect(pageDark.segments.some(s => s.ref?.kind === 'faction')).toBe(false);
    const pageLit = buildPlacePastLine(state.graph, town, lit)!;
    const factions = pageLit.segments.filter(s => s.ref?.kind === 'faction').map(s => s.ref!.id).sort();
    expect(factions).toEqual([war!.winnerId, war!.loserId].sort());
  });

  it('a ruin revealed by a Find counts as found', () => {
    const ruin = getLocationNodes(state.graph).find(n => n.properties.locationSubtype === 'elder_ruin')!;
    const key = hexKeyOf(state, ruin.id);
    expect(isPastPlaceKnown(state.graph, ruin.id, DARK)).toBe(false);
    expect(isPastPlaceKnown(state.graph, ruin.id, { visibility: new Map(), hexRevelation: { [key]: { ruins: true } } })).toBe(true);
  });

  it('an elder ruin names its empire only when found, and its fall only where the engine holds one', () => {
    const g = state.graph;
    const ruins = getLocationNodes(g).filter(n => n.properties.locationSubtype === 'elder_ruin');
    for (const r of ruins) {
      const dark = buildPlacePastLine(g, r.id, DARK)!;
      expect(dark.segments.some(s => s.tooltipId === 'ui.past.elder_ruin_empire')).toBe(false);
      const lit = buildPlacePastLine(g, r.id, {})!;
      const past = getPlacePast(g, r.id)!;
      expect(lit.segments.some(s => s.tooltipId === 'ui.past.elder_ruin_empire')).toBe(!!past.empireId);
      expect(pastLineText(lit).includes('It fell in')).toBe(!!past.fellInEventId);
    }
  });

  it('every settlement page carries its founding line, fog or not', () => {
    const g = state.graph;
    const settlements = getLocationNodes(g).filter(n => ['capital', 'city', 'town', 'hamlet'].includes(String(n.properties.locationSubtype)));
    expect(settlements.length).toBeGreaterThan(0);
    for (const s of settlements) {
      const line = buildPlacePastLine(g, s.id, DARK);
      expect(line, s.id).not.toBeNull();
      expect(line!.segments.some(seg => seg.tooltipId === 'ui.past.founding')).toBe(true);
    }
  });

  it('every seeded dead person has a role line and an age, and no one else does', () => {
    const g = state.graph;
    let seeded = 0;
    for (const a of g.getNodesByType('actor')) {
      const line = buildDeadPastLine(g, a.id);
      if (a.properties.pastOrigin === 'worldgen' && a.properties.deceased === true) {
        seeded++;
        expect(line, a.id).not.toBeNull();
        expect(line!.segments.some(s => s.tooltipId === 'ui.past.dead')).toBe(true);
      } else {
        expect(line).toBeNull();
      }
    }
    expect(seeded).toBeGreaterThanOrEqual(5);
  });

  it('no two wonders of one subtype share a legend while a line is unused', () => {
    const ids = ['w.a', 'w.b', 'w.c'];
    const graph = {
      getNode: (id: string) => ({ id, properties: { locationSubtype: 'crystal_cavern' } }),
    } as unknown as GameState['graph'];
    const legends = assignWonderLegends(graph, ids);
    const n = WONDER_LEGEND_LINES.crystal_cavern.length;
    expect(new Set(ids.slice(0, n).map(id => legends.get(id))).size).toBe(n);
  });

  it('every wonder subtype has at least two legends', () => {
    for (const lines of Object.values(WONDER_LEGEND_LINES)) expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it('an unbound token is dropped with one warning, never rendered', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const segs = renderPastTemplate('{missing} stood here.', {});
    expect(segs.map(s => s.text).join('')).toBe(' stood here.');
    renderPastTemplate('{missing} stood here.', {});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ruin counts read as words', () => {
    expect(ruinKindsPhrase({ temple: 12, vault: 5, battlefield: 1 })).toBe('many temples, several vaults and a battlefield');
    expect(ruinKindsPhrase({ temple: 0, vault: 0, battlefield: 0 })).toBe('nothing that still stands');
  });

  it('the four place placeholders resolve through enrichProse and never leak', () => {
    const g = state.graph;
    const capital = readWorldPast(g).settling.find(s => s.founderId)!;
    const values = placePastEnrichment(g, capital.settlementId);
    expect(values.foundedAgo).toBeDefined();
    expect(values.founder).toBe(g.getNode(capital.founderId!)!.name);
    const someone = g.getNodesByType('actor').find(a => a.properties.actorType === 'individual' && !a.properties.deceased)!;
    const base = gatherNarrativeContext(g, someone.id);
    const ctx: NarrativeContext = { ...base, placePast: values };
    const out = enrichProse('Founded {place.founded_ago} ago by {place.founder}. {?has_ruin_fall}It fell in {ruin.fall}.{/has_ruin_fall}', ctx);
    expect(out).toBe(`Founded ${values.foundedAgo} ago by ${values.founder}. `);
    const bare = enrichProse('{place.founded_ago} {place.founder} {ruin.empire} {ruin.fall}', { ...base, placePast: {} });
    expect(bare).not.toMatch(LEAK);
    expect(bare).toContain('its first settlers');
  });

  it('a scene context carries its place past from where the agent stands', () => {
    const g = state.graph;
    const withPast = g.getNodesByType('actor').find(a => {
      if (a.properties.actorType !== 'individual' || a.properties.deceased) return false;
      const at = g.getOutgoingEdges(a.id, 'located_at')[0]?.target;
      return at != null && typeof g.getNode(at)?.properties.foundedYearsAgo === 'number';
    });
    expect(withPast).toBeDefined();
    expect(gatherNarrativeContext(g, withPast!.id).placePast?.foundedAgo).toBeDefined();
  });
});
