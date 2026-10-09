/**
 * THR-1774 — the doom bar and tooltips tell the doom the way the engine does it.
 */
import { describe, it, expect } from 'vitest';
import {
  DOOM_ARCHETYPE_DISPLAY_NAMES,
  DOOM_ARCHETYPE_GLYPHS,
  DOOM_ARCHETYPE_SPHERE,
  DOOM_ARCHETYPE_TOOLTIPS,
  doomArchetypeDisplayName,
  doomWakeNamingSentence,
} from '../doom-archetype-presentation';
import { getDoomCardSpheres } from '../../engine/doomClock';
import { resolveTooltip } from '../../engine/tooltipResolver';
import { DOOM_CLOCK_ARCHETYPES } from '../../types/doomClock';
import { getVolumeTitle } from '../../engine/chronicle';

describe('doom archetype presentation (THR-1774)', () => {
  it.each(DOOM_CLOCK_ARCHETYPES)('%s: the sigil sphere equals the spheres its cards press (PC-6)', (archetype) => {
    const cardSpheres = getDoomCardSpheres(archetype);
    const sigil = DOOM_ARCHETYPE_SPHERE[archetype];
    if (sigil) {
      expect(cardSpheres).toEqual([sigil]);
    } else {
      expect(cardSpheres).toEqual([]);
    }
  });

  it.each(DOOM_CLOCK_ARCHETYPES)('%s: has a name, a glyph, and a tooltip ending in its sphere sentence', (archetype) => {
    expect(DOOM_ARCHETYPE_DISPLAY_NAMES[archetype]).toMatch(/^[A-Z]/);
    expect(DOOM_ARCHETYPE_GLYPHS[archetype]).toBeTruthy();
    const body = DOOM_ARCHETYPE_TOOLTIPS[archetype];
    const sphere = DOOM_ARCHETYPE_SPHERE[archetype];
    expect(body.endsWith(sphere ? `It presses {{sphere.${sphere}}}.` : 'It presses no single sphere.')).toBe(true);
  });

  it.each(DOOM_CLOCK_ARCHETYPES)('%s: doom.<archetype> resolves, ≤ 200 characters (Law 18)', (archetype) => {
    const resolved = resolveTooltip(`doom.${archetype}`);
    expect(resolved?.label).toBe(DOOM_ARCHETYPE_DISPLAY_NAMES[archetype]);
    expect(resolved?.desc?.length ?? 0).toBeLessThanOrEqual(200);
  });

  it('the wake sentence names the doom with the volume title\'s words', () => {
    expect(doomWakeNamingSentence('reckoning')).toBe('The Age of the Reckoning has begun.');
    for (const archetype of DOOM_CLOCK_ARCHETYPES) {
      const title = getVolumeTitle(archetype, 1);
      expect(title).toContain(`The Age of the ${DOOM_ARCHETYPE_DISPLAY_NAMES[archetype]}`);
    }
  });

  it('an unknown key never renders lowercase', () => {
    expect(doomArchetypeDisplayName('unheard')).toBe('Unheard');
  });
});
