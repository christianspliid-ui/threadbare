/**
 * THR-1810 — `{is}` / `{are}` in encounter prose.
 *
 * The copula tokens were resolved only by `ambitionProse` and the rite prose's own
 * filler, so two encounter lines reached the Chapter Ledger with a raw `{are}`. The
 * encounter enricher now resolves both spellings from the pronoun set's `s` suffix.
 *
 * The corpus lock below is the lint: any pronoun or agreement token that survives
 * `enrichProse` in either pronoun arm fails, so the next verb token an author borrows
 * from another resolver (`{does}`, `{es}`, `{has}`…) is caught before it ships.
 */

import { describe, it, expect } from 'vitest';
import { enrichProse } from '../proseEnrichment';
import type { NarrativeContext } from '../proseEnrichment';
import { ENCOUNTER_TEMPLATES } from '../../data/encounter-content';
import { BORDERLAND_ENCOUNTER_TEMPLATES } from '../../data/borderland-encounter-content';
import { ANOMALY_ENCOUNTER_TEMPLATES } from '../../data/encounter-anomaly-content';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

type Pronouns = NarrativeContext['pronouns'];

const SHE: Pronouns = { they: 'she', them: 'her', their: 'her', s: 's' };
const HE: Pronouns = { they: 'he', them: 'him', their: 'his', s: 's' };
const THEY: Pronouns = { they: 'they', them: 'them', their: 'their', s: '' };

function ctx(pronouns: Pronouns): NarrativeContext {
  return {
    agentName: 'Syntar',
    agentId: 'agent_syntar',
    archetypeId: 'rebel',
    cultureName: 'The Aurelians',
    primaryReach: 'iron',
    titles: [],
    notableArtifacts: [],
    strongAllies: [],
    rivals: [],
    currentLocationName: 'The Shattered Sanctum',
    completedPhases: [],
    beatHistory: [],
    pronouns,
  };
}

function collectStrings(node: unknown, path: string, out: Array<[string, string]>): void {
  if (typeof node === 'string') {
    if (node.length > 0) out.push([path, node]);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) collectStrings(v, path ? `${path}.${k}` : k, out);
  }
}

function findTemplate(list: readonly UnifiedActionTemplate[], id: string): UnifiedActionTemplate {
  const t = list.find((x) => x.id === id);
  if (!t) throw new Error(`template ${id} not found`);
  return t;
}

function stringsContaining(template: UnifiedActionTemplate, needle: string): string[] {
  const fields: Array<[string, string]> = [];
  collectStrings(template, '', fields);
  return fields.map(([, s]) => s).filter((s) => s.includes(needle));
}

/** Actor pronoun and verb-agreement tokens — the family `enrichProse` must leave none of. */
const AGREEMENT_TOKEN = /\{(?:is|are|am|es|does|do|has|have|was|were|s|they|them|their|theirs|themselves|They|Them|Their)\}/g;

describe('THR-1810 — enrichProse resolves the copula', () => {
  it('reads "is" for he/she and "are" for they, under either spelling', () => {
    expect(enrichProse('{They} {is} tired.', ctx(SHE))).toBe('She is tired.');
    expect(enrichProse('{They} {are} tired.', ctx(HE))).toBe('He is tired.');
    expect(enrichProse('{They} {is} tired.', ctx(THEY))).toBe('They are tired.');
    expect(enrichProse('{They} {are} tired.', ctx(THEY))).toBe('They are tired.');
  });

  it('renders borderland.feral_dogs failure with no raw token', () => {
    const [line] = stringsContaining(findTemplate(BORDERLAND_ENCOUNTER_TEMPLATES, 'borderland.feral_dogs'), '{are}');
    expect(line).toBeDefined();
    const she = enrichProse(line, ctx(SHE));
    expect(she).not.toContain('{');
    expect(she).toContain('she is bitten and walking');
    expect(enrichProse(line, ctx(THEY))).toContain('they are bitten and walking');
  });

  it('renders the dreaming-light spore line with no raw token', () => {
    const [line] = stringsContaining(findTemplate(ANOMALY_ENCOUNTER_TEMPLATES, 'encounter.anomaly.dreaming_light'), '{are}');
    expect(line).toBeDefined();
    const he = enrichProse(line, ctx(HE));
    expect(he).not.toContain('{');
    expect(he).toContain('he is already breathing them');
    expect(enrichProse(line, ctx(THEY))).toContain('they are already breathing them');
  });
});

describe('THR-1810 lint — no encounter string leaves an agreement token unresolved', () => {
  it('every pronoun/agreement token resolves in both pronoun arms', () => {
    const corpus = [...ENCOUNTER_TEMPLATES, ...BORDERLAND_ENCOUNTER_TEMPLATES, ...ANOMALY_ENCOUNTER_TEMPLATES];
    const leaks = new Set<string>();
    for (const template of corpus) {
      const fields: Array<[string, string]> = [];
      collectStrings(template, '', fields);
      for (const [path, field] of fields) {
        if (!field.match(AGREEMENT_TOKEN)) continue;
        for (const arm of [SHE, THEY]) {
          for (const m of enrichProse(field, ctx(arm)).match(AGREEMENT_TOKEN) ?? []) {
            leaks.add(`${template.id} ${path}: ${m}`);
          }
        }
      }
    }
    expect([...leaks]).toEqual([]);
  });
});
