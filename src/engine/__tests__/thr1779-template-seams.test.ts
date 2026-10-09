/**
 * THR-1779 — template seams that reached the player in warm playtest round 1.
 *
 * One block per cause named on the ticket:
 *   1. Empty cast slot — a chapter archived from `drowned-mans-testimony` names the heir.
 *   2. Literal tokens — no `{…}` survives in an archived aftermath overview or change.
 *   3. Doubled noun — a work anchored on a named work never says its noun twice.
 *   4. Pronoun flips — ambition prose for a male agent never says "her", and the
 *      reverse for a female one.
 *
 * The 300-tick sweep over a real archive lives in `thr1779-chapterSeamSweep.test.ts`
 * (heavy lane).
 */

import { describe, it, expect } from 'vitest';
import { buildChapterRecord } from '../chapterArchive';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { DROWNED_MANS_TESTIMONY_TEMPLATE } from '../../data/encounters/drowned-mans-testimony';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { ChapterRecord } from '../../types/chapterRecord';
import { generateWorkName, anchorRepeatsNoun } from '../naming/workNames';
import { resolveAnchorName, CHRISTENED_AT_TICK_PROPERTY } from '../strategicActionLifecycle';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';
import {
  ambitionPronounsFor,
  resolveAmbitionPronouns,
  resolveAmbitionProseFor,
} from '../ambitionProse';
import { resolveContentEntry } from '../contentEntryResolver';
import type { ContentRef } from '../../types/contentRef';

/** Every player-facing string an archived chapter carries. */
function chapterText(rec: ChapterRecord): string[] {
  return [
    rec.openingProse,
    rec.stakesLine ?? '',
    rec.aftermathProse ?? '',
    rec.aftermathSummary?.overview ?? '',
    ...(rec.aftermathSummary?.changes ?? []).flatMap(c => [c.title, c.detail]),
    ...rec.steps.flatMap(s => [s.narrativeProse, s.afterimageProse ?? '']),
  ];
}

// ─── 1 + 2. The chapter archive ────────────────────────────────────────────────

describe('THR-1779 — chapter archive names its cast and resolves its aftermath', () => {
  function buildTestimonyChapter(): { rec: ChapterRecord; heirName: string; placeName: string } {
    const archetype = generateArchetypes(4, 42)[0];
    const preset = MAP_SIZE_PRESETS.small;
    const { state } = initializeGameState(
      archetype, 'Test-Runner', createBalancedCosmology(), 42, preset.cols, preset.rows,
    );
    const individuals = state.graph
      .getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    expect(individuals.length).toBeGreaterThanOrEqual(2);
    const [actor, heir] = individuals;
    const place = state.graph.getNodesByType('location')[0];

    const action: UnifiedAction = {
      actionId: 'thr1779-testimony',
      actorId: actor.id,
      templateId: DROWNED_MANS_TESTIMONY_TEMPLATE.id,
      targetId: place.id,
      scale: 'personal',
      source: 'agent',
      startTick: state.tick,
      currentStep: 1,
      stepProgress: 0,
      stepDuration: 1,
      resolved: true,
      outcome: 'failure',
      stepOutcomes: ['failure'],
      supportBindings: [{ key: 'heir', nodeId: heir.id, kind: 'actor' }],
      aftermathSummary: {
        encounterId: DROWNED_MANS_TESTIMONY_TEMPLATE.id,
        outcome: 'failure',
        overview: '{cast:heir} took the estate, and {location} talks of {actor} with less trust.',
        changes: [
          { id: 'c1', kind: 'reputation', title: '{cast:heir}', detail: '{actor} lost standing in {location}.', polarity: 'negative' },
        ],
      },
    } as UnifiedAction;

    const rec = buildChapterRecord(action, state as GameState);
    expect(rec).not.toBeNull();
    return { rec: rec!, heirName: heir.name, placeName: place.name };
  }

  it('names the heir in the opening step — no ", ," hole', () => {
    const { rec, heirName } = buildTestimonyChapter();
    const step0 = rec.steps[0]?.narrativeProse ?? '';
    expect(step0).toContain(`His only kin, ${heirName}, claims`);
    expect(chapterText(rec).filter(t => t.includes(', ,'))).toEqual([]);
  });

  it('stores the aftermath overview and change lines with no literal token', () => {
    const { rec, heirName } = buildTestimonyChapter();
    expect(rec.aftermathProse).toBeDefined();
    expect(rec.aftermathProse).toContain(heirName);
    expect(rec.aftermathSummary?.changes[0].title).toBe(heirName);
    expect(chapterText(rec).filter(t => /\{[^}]*\}/.test(t))).toEqual([]);
  });
});

// ─── 3. Work naming ──────────────────────────────────────────────────────────

describe('THR-1779 — a work anchored on a named work does not double its noun', () => {
  it('anchorRepeatsNoun matches the noun as a whole word only', () => {
    expect(anchorRepeatsNoun('Quarter of Heart of the Barrow', 'Quarter')).toBe(true);
    expect(anchorRepeatsNoun('quarter of heart', 'Quarter')).toBe(true);
    expect(anchorRepeatsNoun('Quartermaine', 'Quarter')).toBe(false);
    expect(anchorRepeatsNoun('Heart of the Barrow', 'Quarter')).toBe(false);
    expect(anchorRepeatsNoun('Heart of the Barrow', '')).toBe(false);
  });

  it('never renders "Quarter … Quarter" across many work ids', () => {
    const names = Array.from({ length: 200 }, (_, i) => generateWorkName({
      workId: `work-${i}`,
      kindId: 'found_quarter',
      reach: 'heart',
      anchorName: 'The Quarter of Heart of the Barrow',
      actorName: 'Ilsa',
      nounOverride: 'Quarter',
    }));
    expect(names.filter(n => (n.match(/\bQuarter\b/g) ?? []).length > 1)).toEqual([]);
  });

  it('an anchor without the noun still names the work after its ground', () => {
    const names = Array.from({ length: 50 }, (_, i) => generateWorkName({
      workId: `w-${i}`, reach: 'heart', anchorName: 'Heart of the Barrow', nounOverride: 'Quarter',
    }));
    expect(names.some(n => n.includes('Heart of the Barrow'))).toBe(true);
  });

  it('resolveAnchorName skips a christened work and falls through to the next candidate', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'town', type: 'location', name: 'Heart of the Barrow', properties: {} });
    graph.addNode({
      id: 'quarter', type: 'location', name: 'The Quarter of Heart of the Barrow',
      properties: { parentLocationId: 'town', [CHRISTENED_AT_TICK_PROPERTY]: 40 },
    });
    const state = { strategicState: { bindings: [] } } as unknown as GameState;
    const project = { projectId: 'p1', targetNodeId: 'quarter', originLocationId: 'town' } as unknown as Parameters<typeof resolveAnchorName>[2];
    expect(resolveAnchorName(state, graph, project)).toBe('Heart of the Barrow');

    // Unchristened, the same target is still a fair anchor.
    graph.updateNode('quarter', { properties: { [CHRISTENED_AT_TICK_PROPERTY]: undefined } });
    expect(resolveAnchorName(state, graph, project)).toBe('The Quarter of Heart of the Barrow');
  });

  it('a christened settlement stays ground — a work raised in it is named for it', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'origin', type: 'location', name: 'Ardenmor', properties: {} });
    graph.addNode({
      id: 'newhold', type: 'location', name: 'Newhold',
      properties: { [CHRISTENED_AT_TICK_PROPERTY]: 12 },
    });
    const state = { strategicState: { bindings: [] } } as unknown as GameState;
    const project = { projectId: 'p2', targetNodeId: 'newhold', originLocationId: 'origin' } as unknown as Parameters<typeof resolveAnchorName>[2];
    expect(resolveAnchorName(state, graph, project)).toBe('Newhold');
  });
});

// ─── 4. Ambition pronouns ────────────────────────────────────────────────────

function allAmbitionLines(): string[] {
  return AMBITION_TEMPLATES.flatMap(t => [
    ...t.selectionProse,
    ...t.completionProse,
    ...t.abandonmentProse,
    ...t.milestones.flatMap(m => m.prose),
    ...(t.abandonmentTriggers ?? []).flatMap(a => a.prose ?? []),
    ...Object.values(t.milestoneProse ?? {}).flat(),
  ]);
}

describe('THR-1779 — ambition prose follows the agent\'s pronouns', () => {
  const FEMININE = /\b(she|her|hers|herself)\b/i;
  const MASCULINE = /\b(he|him|his|himself)\b/i;

  it('authors no hardcoded gendered pronoun', () => {
    const lines = allAmbitionLines();
    expect(lines.length).toBeGreaterThan(50);
    expect(lines.filter(l => FEMININE.test(l) || MASCULINE.test(l))).toEqual([]);
  });

  it('a male agent reads no "her"; a female agent reads no "his"; no token survives', () => {
    const male = ambitionPronounsFor('male');
    const female = ambitionPronounsFor('female');
    const neutral = ambitionPronounsFor(undefined);
    for (const line of allAmbitionLines()) {
      const m = resolveAmbitionPronouns(line, male);
      const f = resolveAmbitionPronouns(line, female);
      const n = resolveAmbitionPronouns(line, neutral);
      expect(m).not.toMatch(FEMININE);
      expect(f).not.toMatch(MASCULINE);
      for (const out of [m, f, n]) expect(out).not.toMatch(/\{[^}]*\}/);
    }
  });

  it('agrees the verb with the pronoun', () => {
    const line = 'The divine courses through {them}. {They} {is} vessel and voice. {They} read{s} stone.';
    expect(resolveAmbitionPronouns(line, ambitionPronounsFor('m')))
      .toBe('The divine courses through him. He is vessel and voice. He reads stone.');
    expect(resolveAmbitionPronouns(line, ambitionPronounsFor('')))
      .toBe('The divine courses through them. They are vessel and voice. They read stone.');
  });

  it('the content card for an ambition reads they/them, with no token', () => {
    for (const t of AMBITION_TEMPLATES) {
      const view = resolveContentEntry({ kind: 'ambition_template', id: t.id } as ContentRef);
      if (!view) continue;
      expect(`${view.description} ${view.flavour}`).not.toMatch(/\{[^}]*\}/);
    }
    const trade = resolveContentEntry({ kind: 'ambition_template', id: 'ambition_dominate_trade' } as ContentRef);
    expect(trade?.description).toContain('They set their eyes on the trade roads');
  });

  it('resolves for the actor in the graph', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'actor', name: 'Bram', properties: { gender: 'male' } });
    expect(resolveAmbitionProseFor('{They} set {their} eyes on the roads.', graph, 'a'))
      .toBe('He set his eyes on the roads.');
    expect(resolveAmbitionProseFor('{They} wait.', graph, 'missing')).toBe('They wait.');
  });
});
