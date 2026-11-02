// THR-2139 — the Aftermath and the mortal's sheet tell one fact one way.
//
// Cold playtest round 6: reputation rose in the Aftermath while the sheet said no one
// had spoken of it; a lost guard trial read "Passed"; "won, at a price" named no price;
// "faced it alone" after the god paid; two-step chapters listed twice in the Story.
// One guard per item.

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentInfoCard } from '../agentDetail';
import { getReputationWord } from '../../data/domain-words';
import { CG_JOIN_TEMPLATE } from '../../data/civic-guard-encounter-content';
import { resolveAftermathVariant, type BranchAwareAftermathConfig } from '../../types/unifiedAction';
import {
  buildAftermathCauseLine,
  CAUSE_ALONE,
  CAUSE_GOD_ELSEWHERE,
  PRICE_WORDS,
  priceRowFor,
  type CauseLineStep,
} from '../aftermathWords';
import { createUnifiedActionEventNode, EVENT_NODE_ID_PREFIX } from '../encounterEventNode';
import { buildConnections } from '../views/connections';

const AGENT = 'agent.elara';
const ASC = 'asc.test';

describe('THR-2139 — 1: the reputation word at `known`', () => {
  it('a known mortal with a reputation score carries the word the sheet row shows', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: AGENT,
      type: 'actor',
      name: 'Elara',
      properties: { actorType: 'individual', reputationScore: 0.9 },
    });
    graph.addNode({ id: ASC, type: 'actor', name: 'Ascendant', properties: { actorType: 'individual' } });
    const card = getAgentInfoCard(graph, AGENT, ASC, 'known');
    expect(card?.reputationWord).toBe(getReputationWord(0.9));
  });
});

describe('THR-2139 — 2: a lost `cg.join` trial never reads "Passed"', () => {
  const config = CG_JOIN_TEMPLATE.aftermathConfig as BranchAwareAftermathConfig;
  for (const outcome of ['failure', 'critical_failure', 'contested_lost'] as const) {
    it(`${outcome}: no reaction or overview says "Passed"`, () => {
      const variant = resolveAftermathVariant(config, [], outcome);
      const text = [variant.overview, ...(variant.reactions ?? []).flatMap(r => [r.label, r.intent])].join(' ');
      expect(text).not.toMatch(/Passed/);
      expect(variant.reactions?.length).toBeGreaterThan(0);
    });
  }

  it('a won trial still reads "Passed"', () => {
    const variant = resolveAftermathVariant(config, [], 'success');
    expect(variant.reactions?.some(r => r.intent?.includes('Passed'))).toBe(true);
  });
});

const step = (band: CauseLineStep['band'], godTouched = false, reach = 'iron'): CauseLineStep => ({ band, reach, godTouched });

describe('THR-2139 — 3: no "at a price" without a named price', () => {
  const base = { outcome: 'success_at_cost' as const, actorId: AGENT, actorName: 'Baldur', changes: [], drewComplication: false };

  for (const band of ['near_miss', 'failure', 'critical_failure'] as const) {
    it(`a ${band} step with no at-cost step still names its price`, () => {
      const row = priceRowFor({ ...base, paidAtCostStep: false, steps: [step('success'), step(band)] });
      expect(row).not.toBeNull();
      expect(row!.detail).toContain('The work on Iron');
    });
  }

  it('an at-cost step keeps the existing price line', () => {
    const row = priceRowFor({ ...base, paidAtCostStep: true, steps: [step('success_at_cost')] });
    expect(row?.detail).toContain('learned less');
  });

  it('every at-cost ending that missed a step names a price', () => {
    const line = buildAftermathCauseLine({ actorName: 'Baldur', templateName: 'Trial', outcome: 'success_at_cost', steps: [step('failure')] });
    expect(line).toContain(PRICE_WORDS);
    expect(priceRowFor({ ...base, paidAtCostStep: false, steps: [step('failure')] })).not.toBeNull();
  });
});

describe('THR-2139 — 4: no "alone" when the god played any step', () => {
  it('the hand on step 1 and the deciding step 2 untouched', () => {
    const line = buildAftermathCauseLine({
      actorName: 'Baldur',
      templateName: 'Trial',
      outcome: 'success_at_cost',
      steps: [step('success', true, 'gold'), step('near_miss', false)],
    });
    expect(line).not.toContain(CAUSE_ALONE('Baldur'));
    expect(line).toContain(CAUSE_GOD_ELSEWHERE);
  });

  it('no hand anywhere still reads "alone"', () => {
    const line = buildAftermathCauseLine({
      actorName: 'Baldur',
      templateName: 'Trial',
      outcome: 'success_at_cost',
      steps: [step('success'), step('near_miss')],
    });
    expect(line).toContain(CAUSE_ALONE('Baldur'));
  });
});

describe('THR-2139 — 5: one Story row per action instance', () => {
  it('a two-step encounter yields one Story row, the later step', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: AGENT, type: 'actor', name: 'Elara', properties: { actorType: 'individual' } });
    for (const [tick, stepIndex] of [[10, 0], [12, 1]] as const) {
      createUnifiedActionEventNode({
        graph, actorId: AGENT, actionId: 'ua.forage.1', templateId: 'forage', templateName: 'Forage',
        stepIndex, outcome: 'success', tick,
      });
    }
    // A second, separate Forage stays its own row.
    createUnifiedActionEventNode({
      graph, actorId: AGENT, actionId: 'ua.forage.2', templateId: 'forage', templateName: 'Forage',
      stepIndex: 0, outcome: 'success', tick: 30,
    });
    const story = buildConnections(graph, null, { cls: 'person', id: AGENT }).groups.find(g => g.id === 'story');
    const ids = story?.rows.map(r => r.ref.id) ?? [];
    expect(ids).toHaveLength(2);
    expect(ids).toContain(`${EVENT_NODE_ID_PREFIX}${AGENT}_12_1`);
    expect(ids).not.toContain(`${EVENT_NODE_ID_PREFIX}${AGENT}_10_0`);
  });
});
