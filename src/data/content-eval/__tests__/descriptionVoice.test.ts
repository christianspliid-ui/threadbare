/**
 * Designer-voice `description` detector. THR-1739.
 *
 * Three properties:
 *
 * 1. **The marker list is pinned** — names in order, and every marker matches its
 *    own designer-voice example. Widening or loosening it is a reviewed diff.
 * 2. **The gate fails a package** — a shipped package compiled in memory with a
 *    designer-voice description swapped in trips `designerVoiceProblems`, the
 *    function `check:encounter`'s register block calls.
 * 3. **The corpus census is zero** — every template defined under
 *    `src/data/encounters/`, plus every `encounter.*` template wherever it lives,
 *    carries player prose in `description`.
 */

import { readdirSync, readFileSync } from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import {
  DESIGNER_VOICE_MARKERS,
  designerVoiceMarkers,
  designerVoiceProblems,
} from '../descriptionVoice';
import { compilePackageInMemory } from '../encounterPackage';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { NUDGE_GOLDEN_EXEMPLAR } from '../../__fixtures__/nudge-exemplar/swollen-ford-exemplar';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

describe('DESIGNER_VOICE_MARKERS', () => {
  it('is the pinned list', () => {
    expect(DESIGNER_VOICE_MARKERS.map(m => m.name)).toEqual([
      'step count',
      'band + job/test',
      'job/test for a band',
      '"the mortal"',
      '"the agent"',
      'payoff verb "plants"',
      'payoff verb "earns"',
      'payoff "wins the trust"',
      'sequel',
      'calls itself an encounter',
      'missed branch',
      'Reach label',
      'content query',
      'content tag',
      'binding sentinel',
      'Reach/persona in parentheses',
    ]);
  });

  it.each(DESIGNER_VOICE_MARKERS.map(m => [m.name, m] as const))('%s matches its own example', (_, marker) => {
    expect(marker.pattern.test(marker.example)).toBe(true);
  });

  it('passes narrator prose that shares words with the markers', () => {
    // "expert" without job/test, "plant" as a noun-free verb form, "agent" alone.
    for (const prose of [
      'The lord\'s reeve blames a stranger for a tithe-barn theft only an expert could manage.',
      'Bread has doubled overnight and a crowd is forcing the abbey granary gate.',
      'A master star-reader saw a hard year in the newborn heir\'s stars.',
    ]) {
      expect(designerVoiceMarkers(prose), prose).toEqual([]);
    }
  });
});

describe('check:encounter fails a designer-voice package', () => {
  const SHIPPED = 'Docs/plans/encounters/granary-riot.package.json';
  const DESIGNER_VOICE =
    'A two-step master Heart job in a town: the mortal holds the crowd back, then rules on the '
    + 'seed grain. A ruling both sides accept wins the trust of the crowd\'s speaker and plants a '
    + 'town-watch errand.';

  const compile = (description?: string): UnifiedActionTemplate => {
    const parsed = JSON.parse(readFileSync(path.resolve(SHIPPED), 'utf8')) as {
      template: { description?: string };
    };
    if (description !== undefined) parsed.template.description = description;
    const compiled = compilePackageInMemory(parsed);
    expect(compiled.problems).toEqual([]);
    return compiled.template as UnifiedActionTemplate;
  };

  it('fails the fixture and names every marker it trips', () => {
    const problems = designerVoiceProblems(compile(DESIGNER_VOICE));
    expect(problems).toHaveLength(1);
    for (const name of ['step count', 'band + job/test', '"the mortal"', 'payoff verb "plants"', 'payoff "wins the trust"']) {
      expect(problems[0]).toContain(name);
    }
  });

  it('passes the rewritten shipped package', () => {
    expect(designerVoiceProblems(compile())).toEqual([]);
  });
});

describe('encounter description census', () => {
  /** Template ids authored in `src/data/encounters/*.ts`, by literal `id:` line. */
  const fileIds = (): Set<string> => {
    const dir = path.resolve('src/data/encounters');
    const ids = new Set<string>();
    for (const file of readdirSync(dir).filter(f => f.endsWith('.ts'))) {
      for (const match of readFileSync(path.join(dir, file), 'utf8').matchAll(/^\s*id: '([^']+)'/gmu)) {
        ids.add(match[1]);
      }
    }
    return ids;
  };

  it('finds zero designer-voice descriptions', () => {
    const ids = fileIds();
    // Nudge and aftermath ids share the `id:` shape; intersecting with the registry
    // keeps template ids only.
    // The golden exemplar is registered nowhere, but authors copy it and
    // `check:encounter` treats it as the contract's green reference.
    const corpus = [
      ...UNIFIED_ACTION_TEMPLATES.filter(t => ids.has(t.id) || t.id.startsWith('encounter.')),
      NUDGE_GOLDEN_EXEMPLAR,
    ];
    expect(corpus.length).toBeGreaterThan(200);
    const offenders = corpus
      .filter(t => (t.description ?? '').length > 0)
      .map(t => ({ id: t.id, markers: designerVoiceMarkers(t.description ?? '') }))
      .filter(r => r.markers.length > 0)
      .map(r => `${r.id}: ${r.markers.join(', ')}`);
    expect(offenders).toEqual([]);
  });
});
