/**
 * The Undertaking Contract, falsified per block (THR-1300 slice 1).
 *
 * The registry test's shape: one adversarial fixture per rule, each differing
 * from a known-good shipped template in exactly one respect, so a block that
 * fires proves the rule and a block that stays quiet proves the fixture did not
 * trip a neighbour. The known-good template is one of the five that pass the
 * contract on introduction; the reachability context is widened with a synthetic
 * ambition profile so a fixture's fresh id fails only the block under test.
 */

import { describe, expect, it } from 'vitest';
import type { StrategicActionTemplate } from '../../../types/strategicAction';
import type { AmbitionTemplate } from '../../../types/ambition';
import { getAllStrategicTemplates } from '../../../engine/strategicActionCandidates';
import { AMBITION_TEMPLATES, EVENT_MINTED_AMBITION_TEMPLATES, GRIEVANCE_AMBITION_TEMPLATES } from '../../ambition-templates';
import {
  buildUndertakingContractContext,
  checkUndertakingContract,
  failedBlocks,
  findMotivationDefects,
  UNDERTAKING_BLOCKS,
  type UndertakingBlock,
  type UndertakingContractContext,
} from '../undertakingContract';
import { UNDERTAKING_RETROFIT_PENDING, isUndertakingRetrofitPending } from '../undertakingRetrofitPending';
import { UNDERTAKING_TIER_PAYOFF_BANDS } from '../undertakingConstants';

const corpus = getAllStrategicTemplates();
const known = corpus.find(t => t.id === 'strategic_craft_masterwork')!;
const FIXTURE_ID = 'strategic_fixture_under_test';

/** A context whose reachability set also names the fixture id, so only the block under test can fire. */
function ctxFor(...extraIds: string[]): UndertakingContractContext {
  const synthetic = {
    id: 'ambition_fixture_profile',
    strategicProfile: { templateIds: [FIXTURE_ID, ...extraIds] },
  } as unknown as AmbitionTemplate;
  return buildUndertakingContractContext(corpus, {
    ambitions: [...AMBITION_TEMPLATES, ...EVENT_MINTED_AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES, synthetic],
  });
}

/**
 * A copy of the known-good template with one field changed. It **keeps the known
 * id**: kind membership, the tier band and reachability are all looked up by id,
 * so a fresh id would trip three blocks at once and no falsification below could
 * be attributed to its rule. Fixtures that *need* a row-less id say so and use
 * `FIXTURE_ID` with a context that names it.
 */
function fixture(overrides: Partial<StrategicActionTemplate>): StrategicActionTemplate {
  return { ...known, ...overrides } as StrategicActionTemplate;
}

function blocksOf(t: StrategicActionTemplate, ctx = ctxFor()): readonly UndertakingBlock[] {
  return failedBlocks(checkUndertakingContract(t, ctx));
}

describe('Undertaking Contract — green on a shipped template', () => {
  it('the known-good template exists and passes every block', () => {
    expect(known).toBeDefined();
    const report = checkUndertakingContract(known, buildUndertakingContractContext(corpus));
    expect(report.violations).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('an unchanged copy passes under the widened context (fixture guard)', () => {
    expect(blocksOf(fixture({}))).toEqual([]);
  });
});

describe('Undertaking Contract — each block falsified from the passing template', () => {
  it('identity: a numeral in displayName', () => {
    expect(blocksOf(fixture({ displayName: 'Craft 2 Masterworks' }))).toEqual(['identity']);
  });

  it('identity: an id without the strategic_ prefix', () => {
    // A renamed id also leaves its row and its profiles behind; identity is the
    // block under test, and the others firing is the by-id lookup doing its job.
    const ctx = ctxFor('fixture_no_prefix');
    expect(blocksOf(fixture({ id: 'fixture_no_prefix' }), ctx)).toContain('identity');
  });

  it('kind membership: a multi_tick_project in no kind row', () => {
    // The fresh id sits in no row; the known template's own row does not know it.
    expect(known.executionMode).toBe('multi_tick_project');
    expect(blocksOf(fixture({ id: FIXTURE_ID, executionMode: 'multi_tick_project' }))).toContain('kind_membership');
  });

  it('kind membership: a row-less instant template without a mutationHint', () => {
    const t = fixture({ id: FIXTURE_ID, executionMode: 'instant', mutationHint: undefined, cast: undefined, verb: 'gather_info' });
    expect(blocksOf(t)).toEqual(['kind_membership']);
  });

  it('counter-play: a destroy verb without motiveGate, harmClass, or an ownable target', () => {
    const t = fixture({
      id: FIXTURE_ID, executionMode: 'instant', verb: 'destroy', mutationHint: known.mutationHint,
      motiveGate: undefined, harmClass: undefined, targetRule: { type: 'self' }, cast: undefined,
    });
    const report = checkUndertakingContract(t, ctxFor());
    expect(failedBlocks(report)).toEqual(['counter_play']);
    expect(report.violations.map(v => v.message).join(' ')).toMatch(/motiveGate/);
    expect(report.violations.map(v => v.message).join(' ')).toMatch(/harmClass/);
    expect(report.violations.map(v => v.message).join(' ')).toMatch(/ownable/);
  });

  it('counter-play: a motiveGate naming something outside MOTIVE_GATE_KINDS', () => {
    const t = fixture({
      id: FIXTURE_ID, executionMode: 'instant', verb: 'destroy', mutationHint: known.mutationHint, cast: undefined,
      motiveGate: ['spite' as never], harmClass: 'property_destroyed', targetRule: { type: 'any_location' },
    });
    expect(blocksOf(t)).toEqual(['counter_play']);
  });

  it('cast: a create project with no cast declared', () => {
    expect(known.verb).toBe('create');
    expect(known.cast?.length ?? 0).toBeGreaterThan(0);
    expect(blocksOf(fixture({ cast: [] }))).toEqual(['cast']);
  });

  it('cast: a must-persist slot without an identity requirement', () => {
    const slot = known.cast![0];
    const t = fixture({ cast: [{ ...slot, persistence: 'must-persist', identityRequirement: undefined }] });
    expect(blocksOf(t)).toEqual(['cast']);
  });

  it('creation: a create verb whose only product is prose', () => {
    // Instant so the kind-membership row rule does not also fire; the creation
    // rule is what a mutation-less create must be told about.
    const t = fixture({ id: FIXTURE_ID, executionMode: 'instant', mutationHint: undefined, creationEffects: undefined, cast: undefined });
    expect(blocksOf(t)).toEqual(['kind_membership', 'creation']);
  });

  it('bands: a payoff outside the tier band of the row the template sits in', () => {
    // The fixture keeps the known id's row membership by being checked *as* the known
    // template with one field changed — the row lookup is by id.
    const [, max] = UNDERTAKING_TIER_PAYOFF_BANDS[1];
    const t = { ...known, payoffValue: max + 1 } as StrategicActionTemplate;
    expect(failedBlocks(checkUndertakingContract(t, buildUndertakingContractContext(corpus)))).toEqual(['bands']);
  });

  it('bands: a project with no projectDuration', () => {
    expect(blocksOf(fixture({ projectDuration: undefined }))).toEqual(['bands']);
  });

  it('board: silent motivations, and an absent payoffValue', () => {
    expect(blocksOf(fixture({ motivations: [] }))).toEqual(['board']);
    expect(blocksOf(fixture({ payoffValue: undefined }))).toEqual(['board']);
  });

  it('reachability: a template no ambition profile names', () => {
    // Same template, a context whose ambitions have forgotten it.
    const forgetting = [...AMBITION_TEMPLATES, ...EVENT_MINTED_AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES]
      .map(a => a.strategicProfile
        ? { ...a, strategicProfile: { ...a.strategicProfile, templateIds: a.strategicProfile.templateIds.filter(id => id !== known.id) } }
        : a) as AmbitionTemplate[];
    const ctx = buildUndertakingContractContext(corpus, { ambitions: forgetting });
    expect(blocksOf(fixture({}), ctx)).toEqual(['reachability']);
  });

  it('register: an evasive term, a second-person address, a numeral, an exclamation', () => {
    const t = fixture({ completionProse: ['Somehow you finish 3 of them!'] });
    const report = checkUndertakingContract(t, ctxFor());
    expect(failedBlocks(report)).toEqual(['register']);
    expect(report.violations.filter(v => v.block === 'register').length).toBeGreaterThanOrEqual(3);
  });

  it('tokens: a brace token the strategic prose path does not resolve', () => {
    expect(blocksOf(fixture({ activityProse: ['The smith works at {location}.'] }))).toEqual(['tokens']);
  });

  it('lexicon (warn, never a block): a consequence noun outside the kind\'s write set', () => {
    const t = fixture({ completionProse: ['The smith sets down the finished blade and counts a fortune in the ledger.'] });
    const report = checkUndertakingContract(t, buildUndertakingContractContext(corpus));
    expect(report.passed).toBe(true);
    expect(report.warnings.some(w => w.includes("'fortune'"))).toBe(true);
  });

  it('every violation names where the rule is written down', () => {
    const t = fixture({ motivations: [], cast: [], completionProse: ['Somehow it is done.'] });
    for (const v of checkUndertakingContract(t, ctxFor()).violations) expect(v.rule).toMatch(/Docs\/plans\//);
  });
});

describe('findMotivationDefects (lifted from the motivations test)', () => {
  it('names silence, low arity, duplicates and non-members', () => {
    // Composed rather than written as a literal: `valuePairVocabulary.lint.test.ts`
    // scans `src/data` for `motivations: [ …quoted tokens… ]` and would fail on a
    // bad literal here — correctly. The composed token is not a pure literal array.
    const notAPair = `${'loyalty_ambition'}s`;
    const rows = findMotivationDefects([
      { id: 'a' },
      { id: 'b', motivations: ['honesty_cunning'] as never },
      { id: 'c', motivations: ['honesty_cunning', 'honesty_cunning'] as never },
      { id: 'd', motivations: ['honesty_cunning', notAPair] as never },
    ]);
    expect(rows.map(r => `${r.id}:${r.problem}`)).toEqual([
      'a:silent', 'b:arity 1 < 2', 'c:duplicate pair', `d:not a ValuePair: ${notAPair}`,
    ]);
  });
});

describe('the ratchet', () => {
  const ctx = buildUndertakingContractContext(corpus);
  const reports = new Map(corpus.map(t => [t.id, checkUndertakingContract(t, ctx)]));

  it('sweeps a non-empty population', () => {
    expect(corpus.length).toBeGreaterThanOrEqual(40);
  });

  it('no template off the ratchet fails the contract', () => {
    const offenders = corpus.filter(t => !isUndertakingRetrofitPending(t.id) && !reports.get(t.id)!.passed)
      .map(t => `${t.id} [${failedBlocks(reports.get(t.id)!).join(', ')}]`);
    expect(offenders).toEqual([]);
  });

  it('every ratchet entry names a template that still fails — no stale entries', () => {
    const stale = UNDERTAKING_RETROFIT_PENDING.filter(id => reports.get(id)?.passed !== false);
    expect(stale).toEqual([]);
  });

  it('is sorted and free of duplicates, so a diff adding one is one line', () => {
    expect([...UNDERTAKING_RETROFIT_PENDING]).toEqual([...new Set(UNDERTAKING_RETROFIT_PENDING)].sort());
  });

  it('holds only strategic_ ids', () => {
    expect(UNDERTAKING_RETROFIT_PENDING.every(id => id.startsWith('strategic_'))).toBe(true);
  });

  it('reports blocks in the contract\'s declared order', () => {
    for (const r of reports.values()) {
      const order = failedBlocks(r).map(b => UNDERTAKING_BLOCKS.indexOf(b));
      expect([...order].sort((a, b) => a - b)).toEqual(order);
    }
  });
});
