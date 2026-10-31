/**
 * THR-2095 — a won encounter must never hand out a wound and call it a boon.
 *
 * Three faults, three pins, each with a falsifying arm:
 *
 * 1. **The prize pool never holds harm.** A success recipe that weights `condition`
 *    assembles against the real condition catalog with no `#negative` template in it;
 *    the same recipe marked `admitsHarm` (the bad-outcome table) does hold them, so the
 *    exclusion is measured rather than assumed.
 * 2. **Harm is a scar whatever the wire says.** A reward change flagged `harmful`
 *    folds to SCAR / WOUND with cost polarity even when its producer declared `item` +
 *    `gain` — the exact shape that rendered BOON · CRACKED RIBS ▲.
 * 3. **Every scar says why.** The cause clause is non-empty for every row, renders
 *    ahead of the change, and fits the 15-word chip budget with the detail.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  REWARD_HARM_TAG,
  assembleRewardPool,
  drawSeededReward,
  isHarmfulRewardTemplate,
  resolveRewardRecipe,
  toBadOutcomeRecipe,
} from '../rewardPool';
import { HARMFUL_CONDITION_TAG } from '../effects/conditionProxyEvents';
import { REWARD_CONDITIONS, REWARD_POSSESSIONS } from '../../data/reward-attachment-catalog';
import { REWARD_HARM_CAUSE_LINES, rewardHarmCauseClause, rewardSentence } from '../aftermathWords';
import { buildAftermathConsequences } from '../views/stage/buildAftermathConsequences';
import { NUDGE_WORD_BUDGETS } from '../../data/content-eval/nudgeAuthoringConstants';
import type { EncounterAftermathChange } from '../../types/unifiedAction';
import type { OutcomeType } from '../../types/resolution';

/** `fa.bounty_hunt`'s Shadow step weights `condition: 0.30` on success — the reported shape. */
const BOUNTY_RECIPE = { categoryWeights: { possession: 0.7, condition: 0.3 } };

function catalogGraph(): WorldGraph {
  const graph = new WorldGraph();
  for (const node of [...REWARD_CONDITIONS, ...REWARD_POSSESSIONS]) {
    graph.addNode({ ...node, properties: { ...node.properties } });
  }
  return graph;
}

describe('THR-2095 — the prize pool never deals harm', () => {
  it('keeps the local harm tag equal to the condition system\'s', () => {
    expect(REWARD_HARM_TAG).toBe(HARMFUL_CONDITION_TAG);
  });

  it('the catalog really does hold harmful conditions (Cracked Ribs among them)', () => {
    const graph = catalogGraph();
    expect(isHarmfulRewardTemplate(graph, 'reward_condition_cracked_ribs')).toBe(true);
  });

  for (const outcome of ['success', 'critical_success'] as const satisfies readonly OutcomeType[]) {
    it(`a ${outcome} prize pool weighting condition holds no #negative template`, () => {
      const graph = catalogGraph();
      const recipe = resolveRewardRecipe(BOUNTY_RECIPE, outcome);
      const pool = assembleRewardPool(graph, recipe);
      expect(pool.some(e => e.category === 'condition')).toBe(true);
      expect(pool.filter(e => isHarmfulRewardTemplate(graph, e.nodeId))).toEqual([]);
    });

    it(`falsifying arm: the same ${outcome} recipe admitting harm does hold them`, () => {
      const graph = catalogGraph();
      const recipe = { ...resolveRewardRecipe(BOUNTY_RECIPE, outcome), admitsHarm: true };
      const pool = assembleRewardPool(graph, recipe);
      expect(pool.some(e => isHarmfulRewardTemplate(graph, e.nodeId))).toBe(true);
    });
  }

  it('the bad-outcome table admits harm', () => {
    const graph = catalogGraph();
    const bad = toBadOutcomeRecipe(resolveRewardRecipe(BOUNTY_RECIPE, 'success'));
    expect(bad.admitsHarm).toBe(true);
    expect(assembleRewardPool(graph, bad).some(e => e.nodeId === 'reward_condition_cracked_ribs')).toBe(true);
  });

  it('across many seeded success draws, harm arrives only on a bad-outcome flip', () => {
    let draws = 0;
    let badFlips = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const graph = catalogGraph();
      graph.addNode({ id: 'agent.hesper', type: 'agent', name: 'Hesper', properties: {} });
      const draw = drawSeededReward(graph, {
        recipe: BOUNTY_RECIPE,
        outcomeType: 'success',
        seed,
        tick: 10,
        actorId: 'agent.hesper',
        templateId: 'fa.bounty_hunt',
      });
      if (!draw.drawnTemplateId) continue;
      draws++;
      if (draw.isBadOutcome) { badFlips++; continue; }
      expect(isHarmfulRewardTemplate(graph, draw.drawnTemplateId)).toBe(false);
    }
    expect(draws).toBeGreaterThan(200);
    // The 5% flip still fires — harm is not abolished, only routed through it.
    expect(badFlips).toBeGreaterThan(0);
  });
});

const passthrough = {
  enrich: (text: string) => text,
  link: (id: string, text: string) => ({ id, segments: [{ text }] }),
};

function harmfulRewardChange(over: Partial<EncounterAftermathChange> = {}): EncounterAftermathChange {
  const sentence = rewardSentence({ actorName: 'Hesper', rewardName: 'Cracked Ribs', gained: true });
  return {
    id: 'a1:step:0:item:Cracked Ribs',
    kind: 'item',
    title: 'A reward changed hands',
    detail: sentence.detail,
    concepts: sentence.concepts,
    stateNoun: sentence.stateNoun,
    direction: 'gain',
    polarity: 'gain',
    harmful: true,
    ...over,
  };
}

describe('THR-2095 — a harmful change is never a boon', () => {
  it('folds an item + gain change flagged harmful to SCAR / WOUND with cost polarity', () => {
    const [chip] = buildAftermathConsequences({ changes: [harmfulRewardChange()], reactions: [], ...passthrough });
    expect(chip.category).toBe('scar');
    expect(chip.categoryLabel).toBe('SCAR');
    expect(chip.kind).toBe('wound');
    expect(chip.delta?.direction).toBe('loss');
    expect(chip.tone).not.toBe(
      buildAftermathConsequences({ changes: [harmfulRewardChange({ harmful: undefined })], reactions: [], ...passthrough })[0].tone,
    );
  });

  it('wins over a producer-declared boon category, whatever the wire kind', () => {
    for (const kind of ['item', 'trait', 'growth', 'unknown_kind'] as const) {
      const [chip] = buildAftermathConsequences({
        changes: [harmfulRewardChange({ kind: kind as EncounterAftermathChange['kind'], category: 'boon' })],
        reactions: [],
        ...passthrough,
      });
      expect(chip.category).toBe('scar');
    }
  });

  it('falsifying arm: the same change without the flag still reads BOON (the reported bug)', () => {
    const [chip] = buildAftermathConsequences({
      changes: [harmfulRewardChange({ harmful: undefined })], reactions: [], ...passthrough,
    });
    expect(chip.category).toBe('boon');
  });
});

describe('THR-2095 — every scar from a reward draw says why', () => {
  it('a scar row renders a non-empty cause clause ahead of the change', () => {
    const cause = rewardHarmCauseClause({ tags: ['#wound', '#physical', '#combat', '#negative'], stepWon: true });
    const sentence = rewardSentence({ actorName: 'Hesper', rewardName: 'Cracked Ribs', gained: false });
    const [chip] = buildAftermathConsequences({
      changes: [harmfulRewardChange({ detail: sentence.detail, direction: 'loss', polarity: 'loss', causeClause: cause })],
      reactions: [],
      ...passthrough,
    });
    expect(cause.trim().length).toBeGreaterThan(0);
    expect(chip.sentenceText.startsWith(cause)).toBe(true);
    expect(chip.sentenceText).toContain('Cracked Ribs');
    expect(chip.sentenceText).not.toMatch(/gained/);
  });

  it('a won step reads as a cost of winning, never as a failure', () => {
    for (const row of REWARD_HARM_CAUSE_LINES) {
      expect(row.won).toMatch(/not cleanly/i);
      expect(row.won).not.toMatch(/fail|went wrong/i);
    }
  });

  it('falls back to a general line for tags no row names', () => {
    expect(rewardHarmCauseClause({ tags: ['#negative'], stepWon: false }).length).toBeGreaterThan(0);
    expect(rewardHarmCauseClause({ tags: [], stepWon: true }).length).toBeGreaterThan(0);
  });

  it('every cause + change sentence fits the 15-word chip budget', () => {
    const detail = rewardSentence({ actorName: 'Hesper', rewardName: 'Cracked Ribs', gained: false }).detail;
    for (const row of REWARD_HARM_CAUSE_LINES) {
      for (const line of [row.won, row.lost]) {
        const words = `${line} — ${detail}`.split(/\s+/).filter(w => /\w/.test(w)).length;
        expect(words, line).toBeLessThanOrEqual(NUDGE_WORD_BUDGETS.chipSentence);
      }
    }
  });
});
