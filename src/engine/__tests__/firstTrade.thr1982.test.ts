/**
 * THR-1982 / THR-1984 — The First keeps her trade.
 *
 * Pins: the 24 vignette trades and the 56 role words (content completeness); the
 * bond writing `npcRole` + `tradeWord` before Means is born; the dev seed's trade;
 * the `protagonist_role_fit` stage (fail-open on a roleless actor); the job-cast
 * chapters declaring their lists; `displayTradeWord`; `{trade}`; and the binder
 * delta a role brings (in for her role's slots, out of others').
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { NPC_ROLES } from '../../types/npc';
import { CANDIDATE_VIGNETTES } from '../../data/candidate-vignettes';
import { NPC_ROLE_WORD, TRADE_WORD_MAX_WORDS, TRADE_TOKEN_FALLBACK_WORD } from '../../data/npc-role-words';
import {
  bindSparkVisionsToCandidate,
  buildNarrativeResult,
  createAgentFromMeeting,
  generateNarrativeCandidates,
  generateSparkVisions,
  resetMeetingCounter,
} from '../meetingEncounter';
import { DEV_FIRST_TRADE } from '../gameInit';
import { displayTradeLabel, displayTradeWord, readTrade, writeFirstTrade } from '../firstTrade';
import { filterByProtagonistRole } from '../encounterFilterPipeline';
import type { EncounterCacheEntry } from '../encounterCache';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { buildRoleCensus } from '../binding/roleCensus';
import { scoreBindingBoard, type BindingRequest } from '../binding/binder';
import { gatherNarrativeContext, enrichProse } from '../proseEnrichment';

const ASC = 'asc';
const PAGE = 'veil.truth.page_beneath_saint';

const JOB_CAST_FILES = [
  'the-page-beneath-the-saint',
  'the-comet-at-the-turning',
  'the-verdict-that-burns',
  'the-wall-of-the-mason-lord',
  'the-granaries-in-the-famine-year',
];

beforeEach(() => { enableTracing(); clearTraces(); });
afterEach(() => { disableTracing(); clearTraces(); });

describe('content — the trades and the role words', () => {
  it('every vignette carries a trade: a real role and a word of at most three words', () => {
    expect(CANDIDATE_VIGNETTES).toHaveLength(24);
    for (const v of CANDIDATE_VIGNETTES) {
      expect(v.trade, v.id).toBeDefined();
      expect(NPC_ROLES, v.id).toContain(v.trade.role);
      expect(v.trade.word.trim().split(/\s+/).length, v.id).toBeLessThanOrEqual(TRADE_WORD_MAX_WORDS);
    }
  });

  it('the empath is a healer, not the bard her reaches would give', () => {
    const empath = CANDIDATE_VIGNETTES.find(v => v.id === 'vignette.veil.empath');
    expect(empath?.trade).toEqual({ role: 'healer', word: 'Healer' });
  });

  it('every role has a word', () => {
    for (const role of NPC_ROLES) expect(NPC_ROLE_WORD[role], role).toMatch(/\S/);
    expect(Object.keys(NPC_ROLE_WORD).sort()).toEqual([...NPC_ROLES].sort());
  });

  it('every job-cast chapter declares a list naming at least one role a First can start with', () => {
    const firstRoles = new Set(CANDIDATE_VIGNETTES.map(v => v.trade.role));
    const ids = JOB_CAST_FILES.map(f => {
      const src = readFileSync(join(__dirname, '../../data/encounters', `${f}.ts`), 'utf8');
      return /\bid: '([^']+)'/.exec(src.slice(src.indexOf(': UnifiedActionTemplate')))?.[1] ?? '';
    });
    for (const id of ids) {
      const roles = getUnifiedTemplateById(id)?.protagonistRoles;
      expect(roles?.length, id).toBeGreaterThan(0);
      expect(roles!.some(r => firstRoles.has(r)), id).toBe(true);
    }
  });

  it('a chapter that casts "A threaded <job>" or a literal "The <job>" target declares protagonistRoles', () => {
    const dir = join(__dirname, '../../data/encounters');
    const offenders: string[] = [];
    for (const file of readdirSync(dir).filter(f => f.endsWith('.ts'))) {
      const src = readFileSync(join(dir, file), 'utf8');
      const castsJob = /['"`]A threaded /.test(src) || /targetLabel: '(The [a-z][^'{]*)'/.test(src);
      if (castsJob && !/protagonistRoles: \[[^\]]+\]/.test(src)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});

function empathCandidate() {
  for (let seed = 1; seed < 400; seed++) {
    const c = generateNarrativeCandidates('hunger.kindle', 'culture.golden', seed, undefined, 'life')
      .find(x => x.vignetteId === 'vignette.veil.empath');
    if (c) return { c, seed };
  }
  throw new Error('no empath candidate drawn');
}

describe('the bond writes the trade', () => {
  it('candidates carry their vignette trade and id', () => {
    const { c } = empathCandidate();
    expect(c.trade).toEqual({ role: 'healer', word: 'Healer' });
  });

  it('choosing the empath writes healer / Healer before Means is born', () => {
    const { c, seed } = empathCandidate();
    const visions = bindSparkVisionsToCandidate(generateSparkVisions(c.primaryReach, 'life', seed), c);
    const result = buildNarrativeResult({
      candidate: c, vision: visions[0], dilemmaChoices: [], editedName: undefined,
      locationId: 'loc_village', ascendantSphere: 'life', tick: 10,
    });
    expect(result.trade).toEqual({ role: 'healer', word: 'Healer' });
    expect(result.vignetteId).toBe('vignette.veil.empath');

    const g = new WorldGraph();
    g.addNode({ id: ASC, type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
    g.addNode({ id: 'loc_village', type: 'location', name: 'Ashenmoor', properties: {} });
    resetMeetingCounter();
    const id = createAgentFromMeeting(g, result, ASC, 10);

    expect(readTrade(g.getNode(id))).toEqual({ role: 'healer', word: 'Healer' });
    const written = getTraces().filter(t => t.category === 'first.trade.written');
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ agentId: id, vignetteId: 'vignette.veil.empath', role: 'healer' });
    // Means reads the role: the birth trace (when the First is a decider) names healer.
    const births = getTraces().filter(t => t.category === 'economy.means.birth' && t.agentId === id);
    expect(births).toHaveLength(1);
    expect((births[0] as unknown as { role: string | null }).role).toBe('healer');
    const writtenIdx = getTraces().findIndex(t => t.category === 'first.trade.written');
    const birthIdx = getTraces().findIndex(t => t.category === 'economy.means.birth' && t.agentId === id);
    if (birthIdx >= 0) expect(writtenIdx).toBeLessThan(birthIdx);
  });

  it('a result with no trade (a pre-THR-1982 save) writes nothing', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'f', type: 'actor', name: 'F', properties: { actorType: 'individual' } });
    expect(writeFirstTrade(g, 'f', undefined, null, 1)).toBe(false);
    expect(g.getNode('f')?.properties.npcRole).toBeUndefined();
  });

  it('the dev seed First is a shrine-keeper priest', () => {
    expect(DEV_FIRST_TRADE).toEqual({ role: 'priest', word: 'Shrine-keeper' });
  });
});

function entry(templateId: string): EncounterCacheEntry {
  return { templateId } as EncounterCacheEntry;
}

describe('protagonist_role_fit', () => {
  function graphWith(role?: string): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'a', type: 'actor', name: 'A', properties: { actorType: 'individual', ...(role ? { npcRole: role } : {}) } });
    return g;
  }
  const entries = () => [entry(PAGE), entry('some.other.template')];

  it('a healer does not draw The Page Beneath the Saint, and the rejection is traced', () => {
    const out = filterByProtagonistRole(entries(), 'a', graphWith('healer'), 7);
    expect(out.map(e => e.templateId)).toEqual(['some.other.template']);
    const t = getTraces().filter(x => x.category === 'encounter.filter.role_fit');
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ agentId: 'a', templateId: PAGE, actorRole: 'healer' });
  });

  it('a scribe draws it', () => {
    expect(filterByProtagonistRole(entries(), 'a', graphWith('scribe'), 7).map(e => e.templateId)).toContain(PAGE);
  });

  it('a roleless actor draws it (fail-open) — the same array back', () => {
    const input = entries();
    expect(filterByProtagonistRole(input, 'a', graphWith(), 7)).toBe(input);
    expect(getTraces().filter(x => x.category === 'encounter.filter.role_fit')).toHaveLength(0);
  });
});

describe('displayTradeWord', () => {
  const node = (props: Record<string, unknown>) => ({ properties: props }) as Pick<GraphNode, 'properties'>;
  it('prefers the trade word, then the role word, then nothing', () => {
    expect(displayTradeWord(node({ tradeWord: 'Saboteur', npcRole: 'burglar' }))).toBe('Saboteur');
    expect(displayTradeWord(node({ npcRole: 'guard_captain' }))).toBe('captain');
    expect(displayTradeWord(node({ npcRole: 'innkeeper' }))).toBe('innkeeper');
    expect(displayTradeWord(node({}))).toBeNull();
    expect(displayTradeWord(undefined)).toBeNull();
  });
  it('the label capitalises and falls back to the legacy role property', () => {
    expect(displayTradeLabel(node({ tradeWord: 'Shrine-keeper', npcRole: 'priest' }))).toBe('Shrine-keeper');
    expect(displayTradeLabel(node({ npcRole: 'warrior_priest' }))).toBe('Warrior-priest');
    expect(displayTradeLabel(node({ role: 'war_chief' }))).toBe('War chief');
    expect(displayTradeLabel(node({}))).toBe('');
  });
});

describe('{trade}', () => {
  function ctxFor(props: Record<string, unknown>) {
    const g = new WorldGraph();
    g.addNode({ id: 'a', type: 'actor', name: 'Elara', properties: { actorType: 'individual', ...props } });
    return gatherNarrativeContext(g, 'a');
  }
  it('names the trade, lower-cased, and guards with has_trade', () => {
    const ctx = ctxFor({ npcRole: 'healer', tradeWord: 'Healer' });
    expect(enrichProse('{name} the {trade}.{?has_trade} Known.{/has_trade}', ctx)).toBe('Elara the healer. Known.');
  });
  it('falls back to a plain noun and drops the guarded block', () => {
    const ctx = ctxFor({});
    expect(enrichProse('the {trade}.{?has_trade} Known.{/has_trade}', ctx)).toBe(`the ${TRADE_TOKEN_FALLBACK_WORD}.`);
  });
});

describe('binder delta — a priest First joins the census both ways', () => {
  function world(): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'loc', type: 'location', name: 'Shrine', properties: { hexCol: 3, hexRow: 3 } });
    g.addNode({ id: ASC, type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
    g.addNode({ id: 'hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'e-hero', source: 'hero', target: 'loc', type: 'located_at', properties: {} });
    g.addNode({ id: 'first', type: 'actor', name: 'Kael', properties: { actorType: 'individual', npcRole: 'priest', tradeWord: 'Shrine-keeper' } });
    g.addEdge({ id: 'e-first', source: 'first', target: 'loc', type: 'located_at', properties: {} });
    g.addEdge({ id: 'e-thread', source: ASC, target: 'first', type: 'thread', properties: { courtPosition: 'the_first' } });
    return g;
  }
  const req = (mintRole: string): BindingRequest => ({
    projectId: 'p', castKey: '$x', stepIndex: 0, actorId: 'hero', mintRole, stageNodeId: 'loc',
  } as BindingRequest);

  it('is a candidate for a priest slot and excluded from an innkeeper slot', () => {
    const g = world();
    const ctx = { graph: g, census: buildRoleCensus(g), tick: 10 };
    const priestBoard = scoreBindingBoard(ctx, req('priest')).rows.map(r => r.candidate?.id);
    const innBoard = scoreBindingBoard(ctx, req('innkeeper')).rows.map(r => r.candidate?.id);
    expect(priestBoard).toContain('first');
    expect(innBoard).not.toContain('first');
  });
});
