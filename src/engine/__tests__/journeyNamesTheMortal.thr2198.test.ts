/**
 * THR-2198 item 3 — "The Call" read "The First stands at the threshold between the life
 * they know…" four chapters in (round-7 cold playtest). Journey prose now names the mortal,
 * and the generic Call reads as something already under way.
 */
import { describe, it, expect } from 'vitest';
import { buildVignetteData, personalizeJourneyText } from '../journeyEngine';
import { JOURNEY_BEAT_TEMPLATES } from '../../data/journey-content';
import type { StateSnapshot } from '../../types/journeyEngine';

const SNAPSHOT = {} as StateSnapshot;

describe('THR-2198 — journey prose names the mortal', () => {
  it('replaces the role title, either case, and leaves other text alone', () => {
    expect(personalizeJourneyText("The First's name carries weight. Amid the wreckage, the First finds a path.", 'Seren'))
      .toBe("Seren's name carries weight. Amid the wreckage, Seren finds a path.");
    expect(personalizeJourneyText('The thread hums.', 'Seren')).toBe('The thread hums.');
  });

  it('fails soft on a blank name', () => {
    expect(personalizeJourneyText('The First waits.', '  ')).toBe('The First waits.');
  });

  it('no fired beat of any template shows "The First" to the player', () => {
    for (const template of JOURNEY_BEAT_TEMPLATES) {
      for (const variant of template.variants) {
        const data = buildVignetteData('a1', 'Seren', template.validPhases[0], 0, 0.1, template, variant, SNAPSHOT, 10);
        const shown = [
          data.setupProse,
          data.tensionProse,
          ...data.choices.flatMap(c => [c.text, c.effects.consequenceProse ?? '']),
        ];
        for (const text of shown) expect(text, `${template.id}/${variant.key}`).not.toMatch(/\b[Tt]he First\b/);
      }
    }
  });

  it('the generic Call names the mortal and reads after the bond, not as a start', () => {
    const template = JOURNEY_BEAT_TEMPLATES.find(t => t.id === 'call_fallback')!;
    const data = buildVignetteData('a1', 'Seren', 'call', 0, 0.1, template, template.variants[0], SNAPSHOT, 10);
    expect(data.tensionProse).toContain('Seren');
    const all = [data.setupProse, data.tensionProse, ...data.choices.map(c => c.effects.consequenceProse ?? '')].join(' ');
    expect(all).not.toMatch(/journey begins|Something is beginning/i);
    expect(all).not.toMatch(/\bthey\b/i);
  });

  it('does not mutate the authored template', () => {
    const template = JOURNEY_BEAT_TEMPLATES.find(t => t.id === 'call_fallback')!;
    const before = template.variants[0].tensionProse;
    buildVignetteData('a1', 'Seren', 'call', 0, 0.1, template, template.variants[0], SNAPSHOT, 10);
    expect(template.variants[0].tensionProse).toBe(before);
    expect(before).toContain('The First');
  });
});
