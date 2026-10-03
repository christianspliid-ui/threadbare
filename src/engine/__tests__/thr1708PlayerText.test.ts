/**
 * THR-1708 — player text says the wrong thing (cold playtest round 2).
 *
 * 1. "The The Builders Fellowship" — article-aware `{faction}` substitution.
 * 2. "completed Observe" for a Piercing Gaze cast — spell name on resolved lines.
 * 3. "Your nudge left …" on encounters the god never touched.
 */
import { describe, it, expect } from 'vitest';
import { substituteFactionName } from '../factionNameSubstitution';
import { COMPLICATION_TEMPLATES } from '../../data/complication-templates';
import {
  buildEncounterAftermathOverview,
  godTouchedEncounter,
  playerFacingTemplateName,
} from '../unifiedActionResolution';
import { NUDGE_COMMIT_INTERVENTION_TYPE } from '../encounterChoiceMemory';
import type { EncounterChoiceMemory } from '../../types/encounter';
import type { EncounterAftermathChange } from '../../types/unifiedAction';

const DOUBLE_ARTICLE = /\bThe [Tt]he\b|\bthe [Tt]he\b/;

describe('THR-1708 (1) — article-aware {faction} substitution', () => {
  it('drops the name\'s own article when the template supplies one', () => {
    expect(substituteFactionName('The {faction} intelligence is thorough.', 'The Builders Fellowship'))
      .toBe('The Builders Fellowship intelligence is thorough.');
    expect(substituteFactionName('picture the {faction} report', 'The Builders Fellowship'))
      .toBe('picture the Builders Fellowship report');
  });

  it('keeps a bare token exactly as the name is written', () => {
    expect(substituteFactionName('Word reaches {faction} today.', 'The Builders Fellowship'))
      .toBe('Word reaches The Builders Fellowship today.');
    expect(substituteFactionName('Word reaches {faction} today.', 'Ironhand Company'))
      .toBe('Word reaches Ironhand Company today.');
  });

  it('capitalises a sentence-initial lowercase fallback', () => {
    expect(substituteFactionName('{faction} cleaned it up.', 'the faction')).toBe('The faction cleaned it up.');
  });

  it('no complication prose template yields a double article, for an articled name or the fallback', () => {
    const lines = COMPLICATION_TEMPLATES.flatMap(t => t.proseTemplates).filter(p => p.includes('{faction}'));
    expect(lines.length).toBeGreaterThan(0);
    const bad = lines.flatMap(line => ['The Builders Fellowship', 'the faction']
      .map(name => substituteFactionName(line, name))
      .filter(out => DOUBLE_ARTICLE.test(out)));
    expect(bad).toEqual([]);
  });
});

describe('THR-1708 (2) — resolved lines name the card the player saw', () => {
  it('prefers the spell name over the plain template name', () => {
    expect(playerFacingTemplateName({ name: 'Observe', spellName: 'Piercing Gaze' })).toBe('Piercing Gaze');
    expect(playerFacingTemplateName({ name: 'Mend Equipment' })).toBe('Mend Equipment');
  });

  it('the aftermath overview carries the spell name it is given', () => {
    const line = buildEncounterAftermathOverview('The Living Balm', playerFacingTemplateName({ name: 'Observe', spellName: 'Piercing Gaze' }), 'success', [], false);
    expect(line).toContain('Piercing Gaze');
    expect(line).not.toContain('Observe');
  });
});

describe('THR-1708 (3) — "Your nudge" only when the god played into the encounter', () => {
  const changes = [{ id: 'c1', kind: 'item' }] as unknown as EncounterAftermathChange[];
  const entry = (over: Partial<EncounterChoiceMemory>): EncounterChoiceMemory => ({
    stepIndex: 0, stepId: 's0', choiceId: 'x', choiceText: 'x',
    interventionType: 'agent_decided', essenceSpent: 0, probabilityBoost: 0, tick: 1, ...over,
  });

  it('an untouched encounter credits the mortal, not the player', () => {
    expect(godTouchedEncounter({})).toBe(false);
    expect(godTouchedEncounter({ choiceHistory: [entry({})] })).toBe(false);
    const line = buildEncounterAftermathOverview('Thessa', 'Mend Equipment', 'success', changes, false);
    expect(line).not.toMatch(/your nudge/i);
    expect(line).toContain("Thessa's choices left");
  });

  it('a committed nudge (recorded or live) earns "Your nudge"', () => {
    expect(godTouchedEncounter({ choiceHistory: [entry({ interventionType: NUDGE_COMMIT_INTERVENTION_TYPE, essenceSpent: 2 })] })).toBe(true);
    expect(godTouchedEncounter({ activeNudges: ['nudge.steady'] })).toBe(true);
    expect(godTouchedEncounter({ choiceHistory: [entry({ interventionType: 'supportive', essenceSpent: 1 })] })).toBe(true);
    const line = buildEncounterAftermathOverview('Thessa', 'The Bridge', 'success', changes, true);
    expect(line).toContain('Your nudge left');
  });
});
