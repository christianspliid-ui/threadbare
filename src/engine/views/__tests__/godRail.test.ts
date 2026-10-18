/**
 * THR-1894 — the god rail's view model (frame plan § E2, § F6, Done when slice 2).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { readView } from '../readView';
import { getViewSelector } from '../selectors';
import {
  buildGodRail,
  buildHandCard,
  buildHandCards,
  emptyGodRail,
  godRailSelector,
  handPriceTooltipDesc,
  reachSummary,
  mandateSummary,
  type GodRailArgs,
} from '../godRail';
import { dominionScaledEssenceCost } from '../../dominion';
import { DOMINION_BAND_LINES, DOMINION_BAND_WORDS, DOMINION_PAR_BAND } from '../../../data/dominion-content';
import { DOMINION_CAST_CLAUSE } from '../../../data/dominion-ui-content';
import { ASCENDANT_REACH_REGISTER } from '../../../data/ascendant-reach-register';
import { REACH_COPY, MANDATE_TREND_WORD } from '../../../data/ascendant-bar-content';
import { GOD_RAIL_SUMMARY_MAX_CH } from '../../../data/frame-content';
import { essencePriceLabel } from '../../../data/essence-format';
import { assertSerialisable } from './viewContract';

const ARGS: GodRailArgs = { primarySphere: 'spirit', secondarySphere: 'life', archetypeTitle: 'The Thread-Singer', avatarName: 'Vara', hookCount: 0 };

function tpl(id: string): UnifiedActionTemplate {
  const t = UNIFIED_ACTION_TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`no template ${id}`);
  return t;
}

function makeState(o: { pool?: Record<string, number>; unlocked?: string[]; first?: boolean } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Vara', properties: { actorType: 'ascendant', attentionPool: 4, attentionCapacity: 10, attentionRegen: 0.4 } });
  if (o.first) {
    graph.addNode({ id: 'kael', type: 'actor', name: 'Kael Thorne', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.thread', source: 'asc', target: 'kael', type: 'thread', properties: { courtPosition: 'the_first' } });
  }
  return {
    graph,
    ascendantId: 'asc',
    tick: 10,
    essencePool: o.pool ?? { spirit: 10, life: 10 },
    unlockedActionIds: o.unlocked ?? ['divine.inspire', 'divine.self.focus', 'divine.self.stillness'],
    unifiedActions: [],
  } as unknown as GameState;
}

describe('godRail view model', () => {
  it('is registered, reads through readView, and its fallback is plain data', () => {
    expect(getViewSelector('godRail')).toBe(godRailSelector);
    assertSerialisable(godRailSelector.fallback(ARGS, 'resolver_threw'));
    const state = makeState({ first: true });
    assertSerialisable(buildGodRail(state, ARGS));
    expect(readView(null, state, godRailSelector, ARGS).hand.cards.length).toBe(3);
    expect(emptyGodRail().hand.cards).toEqual([]);
  });

  it('the hand lists every revealed god card and nothing locked', () => {
    const cards = buildHandCards(makeState(), 'spirit', 'life');
    expect(cards.map((c) => c.id).sort()).toEqual(['divine.inspire', 'divine.self.focus', 'divine.self.stillness']);
    expect(buildHandCards(makeState({ unlocked: [] }), 'spirit', 'life')).toEqual([]);
  });

  it('a row\'s price is the par price, through the label the Codex uses', () => {
    const state = makeState();
    for (const id of ['divine.inspire', 'divine.self.focus']) {
      const par = dominionScaledEssenceCost(state.graph, state.ascendantId, tpl(id), undefined);
      expect(buildHandCard(state, tpl(id), 'spirit').parPriceLabel).toBe(essencePriceLabel(par.cost));
    }
    expect(essencePriceLabel(0)).toBe('Free');
    expect(essencePriceLabel(2)).toBe('2 essence');
  });

  it('Inspire pays from Life; Focus, with no sphere, from the primary pool; Stillness is free', () => {
    const state = makeState();
    const inspire = buildHandCard(state, tpl('divine.inspire'), 'spirit');
    expect(inspire.paySphere).toBe('life');
    expect(inspire.line2).toMatch(/^Life · \d+(\.\d+)? essence$/);
    const focus = buildHandCard(state, tpl('divine.self.focus'), 'spirit');
    expect(focus.paySphere).toBe('spirit');
    expect(focus.line2).toBe('Spirit · 5 essence');
    const still = buildHandCard(state, tpl('divine.self.stillness'), 'spirit');
    expect(still.line2).toBe('Free');
    expect(still.payable).toBe(true);
    expect(still.priceTooltip).toBeNull();
    expect(buildHandCard(makeState({ pool: {} }), tpl('divine.self.stillness'), 'spirit').payable).toBe(true);
  });

  it('payable is measured at the sovereign price: a pool that pays sovereign but not par stays pressable', () => {
    // Focus: par 5; sovereign = max(1, ceil(5 × 0.5), round(5 × 0.75)) = 4.
    const between = buildHandCard(makeState({ pool: { spirit: 4 } }), tpl('divine.self.focus'), 'spirit');
    expect(between.payable).toBe(true);
    expect(between.reason).toBeNull();
    const short = buildHandCard(makeState({ pool: { spirit: 3 } }), tpl('divine.self.focus'), 'spirit');
    expect(short.payable).toBe(false);
    expect(short.reason).toBe('Not enough Spirit essence');
    const life = buildHandCard(makeState({ pool: { life: 0 } }), tpl('divine.inspire'), 'spirit');
    expect(life.reason).toBe('Not enough Life essence');
  });

  it('sorts by paying sphere in the essence order, then by name; Focus sits with the primary sphere', () => {
    const cards = buildHandCards(makeState(), 'spirit', 'life');
    expect(cards.map((c) => `${c.paySphere}:${c.name}`)).toEqual(['spirit:Focus', 'spirit:Stillness', 'life:Inspire']);
  });

  it('ui.hand_price opens with the Foreign band\'s words and quotes the cast clauses verbatim', () => {
    const desc = handPriceTooltipDesc(false);
    const parLine = DOMINION_BAND_LINES[DOMINION_PAR_BAND];
    expect(desc.startsWith(`The price on ${DOMINION_BAND_WORDS[DOMINION_PAR_BAND]} ground: ${parLine.charAt(0).toLowerCase()}${parLine.slice(1)}`)).toBe(true);
    expect(desc).toContain(DOMINION_CAST_CLAUSE.sovereign!);
    expect(desc).toContain(DOMINION_CAST_CLAUSE.hostile!);
    expect(desc).not.toContain('A rarer target costs more.');
    expect(handPriceTooltipDesc(true).endsWith('A rarer target costs more.')).toBe(true);
    expect(buildHandCard(makeState(), tpl('artifact.enchant'), 'spirit').priceTooltip).toContain('A rarer target costs more.');
    expect(buildHandCard(makeState(), tpl('artifact.empower'), 'spirit').priceTooltip).toContain('A rarer target costs more.');
    expect(buildHandCard(makeState(), tpl('divine.self.focus'), 'spirit').priceTooltip).not.toContain('A rarer target costs more.');
  });

  it('every folded-row summary fits GOD_RAIL_SUMMARY_MAX_CH, falling back to the tier word past it', () => {
    for (const [reach, rungs] of Object.entries(ASCENDANT_REACH_REGISTER)) {
      const label = REACH_COPY[reach as keyof typeof REACH_COPY]?.label ?? reach;
      for (const rung of rungs.tierWords) {
        const s = reachSummary(label, rung);
        expect(s.length, `${label} · ${rung}`).toBeLessThanOrEqual(GOD_RAIL_SUMMARY_MAX_CH);
      }
    }
    expect(reachSummary('Eye', 'Before It Happens')).toBe('Eye · Before It Happens');
    expect(reachSummary('A Very Long Reach Name', 'Thinning')).toBe('Thinning');
    for (const word of Object.values(MANDATE_TREND_WORD)) expect(word.length).toBeLessThanOrEqual(GOD_RAIL_SUMMARY_MAX_CH);
    expect(mandateSummary(null)).toBe('');
  });

  it('the optional rows render only when they hold something; counts read right at one', () => {
    const vm = buildGodRail(makeState(), ARGS);
    expect(vm.rows.covenants.renders).toBe(false);
    expect(vm.rows.hooks.renders).toBe(false);
    const withHooks = buildGodRail(makeState(), { ...ARGS, hookCount: 3 });
    expect(withHooks.rows.hooks).toMatchObject({ renders: true, summary: '3 on you' });
    expect(buildGodRail(makeState(), { ...ARGS, hookCount: 1 }).rows.hooks.summary).toBe('1 on you');
  });

  it('Attention carries a word, a fill for the bar, and the balance for the meter', () => {
    const vm = buildGodRail(makeState(), ARGS);
    expect(vm.attention.fill).toBeCloseTo(0.4);
    expect(vm.attention.word).toBe('Busy');
    expect(vm.attention.pool).toBe(4);
  });

  it('names The First only once bonded (Law 56)', () => {
    expect(buildGodRail(makeState(), ARGS).identity?.first).toBeNull();
    expect(buildGodRail(makeState({ first: true }), ARGS).identity?.first).toEqual({ id: 'kael', name: 'Kael Thorne' });
  });
});
