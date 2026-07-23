/**
 * Worked-example content guard (THR-573).
 *
 * `social_scene.recruitment_pitch` is the Tier-2 proof unit: 20 authored surfaces from
 * 9 fragments. These assertions pin the three things that make the multiplication real
 * rather than an accounting trick — the fragments survive the whitelist converter, the
 * enumeration reports the claimed count, and every variant clears the register bar.
 */

import { describe, it, expect } from 'vitest';
import { SOCIAL_SCENE_TEMPLATES } from '../../data/social-scene-templates';
import { enumerateTemplateSurfaces, resolveFragment } from '../fragmentResolution';
import { collectAuthoredProse } from '../content-eval/collectAuthoredProse';
import { scoreProseBatch } from '../content-eval/proseQualityScore';
import { enrichProse, type NarrativeContext } from '../proseEnrichment';

const TEMPLATE_ID = 'social_scene.recruitment_pitch';

function template() {
  const t = SOCIAL_SCENE_TEMPLATES.find(x => x.id === TEMPLATE_ID);
  expect(t, `${TEMPLATE_ID} must exist in the social-scene pool`).toBeDefined();
  return t!;
}

describe('recruitment_pitch context fragments', () => {
  it('survives the social-scene whitelist converter', () => {
    // The converter is an explicit field whitelist — an unlisted field is dropped
    // silently, which would make the whole layer a no-op for this family.
    expect(template().contextFragments).toBeDefined();
    expect(template().contextFragments).toHaveLength(2);
  });

  it('enumerates 20 authored surfaces from 5 places × 4 roles', () => {
    const result = enumerateTemplateSurfaces(template());
    expect(result.axisValues.place).toHaveLength(5);
    expect(result.axisValues.counterpartRole).toHaveLength(4);
    expect(result.surfaceCount).toBe(20);
    expect(result.exceedsCap).toBe(false);
    expect(result.problems).toEqual([]);
  });

  it('declares the required default on every slot', () => {
    for (const set of template().contextFragments ?? []) {
      expect(set.variants['*'], `slot ${set.slot} needs a '*' default`).toBeTruthy();
    }
  });

  it('references its slots from the opening and counter steps', () => {
    const narratives = template().steps.map(s => ('narrativeTemplate' in s ? s.narrativeTemplate : ''));
    expect(narratives.some(n => n?.includes('{frag:opening}'))).toBe(true);
    expect(narratives.some(n => n?.includes('{frag:counterpart}'))).toBe(true);
  });

  it('expands the fragment token to the default for static catalog display', () => {
    // narrativeTemplates.initiation is read raw by Codex/preview surfaces that never
    // run enrichProse — a bare token would leak to the player there.
    expect(template().narrativeTemplates.initiation).not.toContain('{frag:');
    expect(template().narrativeTemplates.initiation).toContain('finds the target where the day has put them');
  });

  it('scores clean under the prose-quality register bar', () => {
    const entry = collectAuthoredProse().find(e => e.entryId === `${TEMPLATE_ID}#fragments`);
    expect(entry, 'fragments must reach the prose-QA corpus').toBeDefined();
    // 9 authored variants + the 2 required defaults.
    expect(Object.keys(entry!.fields)).toHaveLength(11);

    const report = scoreProseBatch([entry!]);
    expect(report.summary.fail).toBe(0);
    expect(report.summary.error).toBe(0);
    expect(report.entries[0].band).toBe('pass');
  });

  it('binds a distinct opening per place', () => {
    const fragments = template().contextFragments;
    const tavern = resolveFragment(fragments, 'opening', { place: 'sublocation-type.tavern' });
    const harbor = resolveFragment(fragments, 'opening', { place: 'sublocation-type.harbor' });
    expect(tavern!.text).not.toBe(harbor!.text);
    expect(tavern!.usedDefault).toBe(false);
    expect(harbor!.usedDefault).toBe(false);
  });

  it('renders a bound surface through enrichProse with no raw fragment token', () => {
    const ctx = {
      agentName: 'Marek',
      agentId: 'a1',
      archetypeId: '',
      cultureName: 'test',
      primaryReach: 'heart',
      titles: [],
      notableArtifacts: [],
      strongAllies: [],
      rivals: [],
      currentLocationName: 'Test Town',
      completedPhases: [],
      beatHistory: [],
      pronouns: { they: 'they', them: 'them', their: 'their', s: '' },
      contextFragments: template().contextFragments,
      contextFragmentTemplateId: TEMPLATE_ID,
      sublocationTypeId: 'sublocation-type.tavern',
      targetRole: 'fence',
    } as unknown as NarrativeContext;

    const opening = enrichProse('{frag:opening}', ctx);
    const counter = enrichProse('{frag:counterpart}', ctx);
    expect(opening).toContain('pays for the second round');
    expect(counter).toContain('simple arithmetic');
    expect(opening).not.toContain('{frag:');
    expect(counter).not.toContain('{frag:');
  });

  it('falls back to the default when no axis is bound, and never leaks a token', () => {
    const ctx = {
      agentName: 'Marek',
      agentId: 'a1',
      archetypeId: '',
      cultureName: 'test',
      primaryReach: 'heart',
      titles: [],
      notableArtifacts: [],
      strongAllies: [],
      rivals: [],
      currentLocationName: 'Test Town',
      completedPhases: [],
      beatHistory: [],
      pronouns: { they: 'they', them: 'them', their: 'their', s: '' },
      contextFragments: template().contextFragments,
      contextFragmentTemplateId: TEMPLATE_ID,
    } as unknown as NarrativeContext;

    const opening = enrichProse('{frag:opening}', ctx);
    expect(opening).toContain('finds the target where the day has put them');
    expect(opening).not.toContain('{frag:');
  });

  it('strips the token when the caller threaded no fragments at all', () => {
    const ctx = {
      agentName: 'Marek',
      agentId: 'a1',
      archetypeId: '',
      cultureName: 'test',
      primaryReach: 'heart',
      titles: [],
      notableArtifacts: [],
      strongAllies: [],
      rivals: [],
      currentLocationName: 'Test Town',
      completedPhases: [],
      beatHistory: [],
      pronouns: { they: 'they', them: 'them', their: 'their', s: '' },
    } as unknown as NarrativeContext;

    expect(enrichProse('Before {frag:opening} after', ctx)).toBe('Before  after');
  });
});
