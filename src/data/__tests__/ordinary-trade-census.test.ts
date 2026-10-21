/**
 * THR-1993 — ordinary scenes stop recasting The First.
 *
 * Pins the census `Docs/audits/2026-10-20-thr-1983-ordinary-scene-trade-census.md`:
 * the six gated templates declare `protagonistRoles` (every role real), none of the
 * 21 phrased rows' quoted phrases is back in its file, and a priest First (the dev
 * seed's) is turned away from the mason's commission with a trace but still rallies
 * the faithful. THR-1982's own guard test does not see these shapes (census § Gap).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NPC_ROLES } from '../../types/npc';
import { getUnifiedTemplateById } from '../unified-action-templates';
import { WorldGraph } from '../../engine/graph';
import { filterByProtagonistRole } from '../../engine/encounterFilterPipeline';
import type { EncounterCacheEntry } from '../../engine/encounterCache';
import { DEV_FIRST_TRADE } from '../../engine/gameInit';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../engine/traceBuffer';
import { enrichProse, gatherNarrativeContext } from '../../engine/proseEnrichment';

const GATED = [
  'bf.quest.craft_commission',
  'encounter.trial_of_flame',
  'encounter.healers_oath',
  'encounter.rally_faithful',
  'encounter.town.masons_commission',
  'encounter.town.comet_disputation',
] as const;

/** Census rows whose call is *phrase*: file (under `src/data/`) → the quoted phrases. */
const PHRASED: ReadonlyArray<readonly [number, string, readonly string[]]> = [
  [1, 'builders-fellowship-encounter-content.ts', ['{name} is given iron stock and asked', 'Arriving with personal tools is expected at this level of craft']],
  [2, 'mercenary-encounter-content.ts', ['one question about the last contract']],
  [3, 'builders-fellowship-encounter-content.ts', ['The stock decides more than the smith.']],
  [7, 'encounter-content.ts', ['are not the ones who worry {actor} most']],
  [10, 'encounter-content.ts', ['whose authority over the mine is now on trial']],
  [11, 'encounter-content.ts', ['a commission every other craftsman has turned down']],
  [12, 'encounter-content.ts', ['{actor} knows the limits of hedge magic']],
  [13, 'encounters/cathedral-vault.ts', ['sent for as master builder']],
  [14, 'encounters/hill-conduit.ts', ['sent for as a master builder']],
  [16, 'encounters/flood-dyke-mending.ts', ['sends for a mason', 'sent for a mason to save the dyke']],
  [17, 'encounters/well-sinking.ts', ['comes into {location} to sink a new well', 'arrives in {location} to sink a new well']],
  [18, 'encounters/boundary-survey.ts', ['sent for a surveyor', 'sworn surveyor']],
  [19, 'encounters/tourney-marshal.ts', ['as marshal of the town']],
  [21, 'encounters/drowned-mans-testimony.ts', ['the best dream reader in the district']],
  [22, 'encounters/harvest-almanac.ts', ['asks a star-reader', 'send for a reader']],
  [23, 'encounters/pilots-reckoning.ts', ['comes looking for a star-reader']],
  [24, 'encounters/cunning-fair.ts', ['loses trade in {location}']],
  [25, 'encounters/ducal-nativity.ts', ['A reader who saw a hard star']],
  [26, 'encounters/bloodletting-hour.ts', ['from the tables in their almanac']],
  [27, 'encounters/oath-breaker-rite.ts', ['{actor}, a reader of oaths']],
  [28, 'encounters/sin-eater.ts', ['paid for a sin-eater', 'A sin-eater who leaves']],
];

/** Whitespace and `' + '` string joins collapsed, so a phrase split across source lines still matches. */
function flatSource(file: string): string {
  return readFileSync(join(__dirname, '..', file), 'utf8')
    .replace(/['"]\s*\+\s*['"]/g, '')
    .replace(/\\'/g, "'")
    .replace(/\s+/g, ' ');
}

beforeEach(() => { enableTracing(); clearTraces(); });
afterEach(() => { disableTracing(); clearTraces(); });

describe('the six gates', () => {
  it.each(GATED)('%s declares a non-empty protagonistRoles of real roles', id => {
    const roles = getUnifiedTemplateById(id)?.protagonistRoles;
    expect(roles?.length, id).toBeGreaterThan(0);
    for (const r of roles!) expect(NPC_ROLES, `${id}: ${r}`).toContain(r);
  });
});

describe('the twenty-one rewrites', () => {
  it('covers 21 census rows', () => {
    expect(PHRASED).toHaveLength(21);
  });
  it.each(PHRASED)('row %i (%s) no longer carries its quoted phrase', (_row, file, phrases) => {
    const src = flatSource(file);
    for (const p of phrases) expect(src, p).not.toContain(p);
  });
});

describe('the three {trade} rows read both ways', () => {
  function ctxFor(props: Record<string, unknown>) {
    const g = new WorldGraph();
    g.addNode({ id: 'a', type: 'actor', name: 'Elara', properties: { actorType: 'individual', ...props } });
    return gatherNarrativeContext(g, 'a');
  }
  const LINES = [
    getUnifiedTemplateById('bf.join')?.steps[0]?.narrativeTemplate,
    getUnifiedTemplateById('mc.join')?.steps[0]?.narrativeTemplate,
    getUnifiedTemplateById('encounter.master_craftsman_challenge')?.steps
      .map(s => s.narrativeTemplate).find(t => t?.includes('{?has_trade}')),
  ];
  it('each line carries the guarded token', () => {
    for (const l of LINES) expect(l).toMatch(/\{\?has_trade\}[^]*\{trade\}[^]*\{\/has_trade\}/);
  });
  it('a healer is named a healer; a roleless mortal gets no trade at all', () => {
    const healer = ctxFor({ npcRole: 'healer', tradeWord: 'Healer' });
    const none = ctxFor({});
    for (const l of LINES) {
      expect(enrichProse(l!, healer)).toContain('healer');
      const plain = enrichProse(l!, none);
      expect(plain).not.toMatch(/\{|\}/);
      expect(plain).not.toContain(' a person');
    }
  });
  it('a trade that starts with a vowel never reads "a oracle" (no article before the token)', () => {
    const oracle = ctxFor({ npcRole: 'oracle', tradeWord: 'Oracle' });
    for (const l of LINES) {
      expect(l).not.toMatch(/\ba \{trade\}/);
      expect(enrichProse(l!, oracle)).not.toMatch(/\ba oracle\b/i);
    }
  });
});

describe('a priest First (the dev seed)', () => {
  const MASONS = 'encounter.town.masons_commission';
  const RALLY = 'encounter.rally_faithful';
  const entry = (templateId: string) => ({ templateId }) as EncounterCacheEntry;

  it('is turned away from the mason\'s commission with a role_fit trace, and still rallies the faithful', () => {
    expect(DEV_FIRST_TRADE.role).toBe('priest');
    const g = new WorldGraph();
    g.addNode({ id: 'first', type: 'actor', name: 'F', properties: { actorType: 'individual', npcRole: DEV_FIRST_TRADE.role } });
    const out = filterByProtagonistRole([entry(MASONS), entry(RALLY)], 'first', g, 3);
    expect(out.map(e => e.templateId)).toEqual([RALLY]);
    const traces = getTraces().filter(t => t.category === 'encounter.filter.role_fit');
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({ agentId: 'first', templateId: MASONS, actorRole: 'priest' });
  });
});
