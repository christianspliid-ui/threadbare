// @vitest-environment jsdom

/**
 * THR-854 — Browser-verify substitution: jsdom render of the real `CoatOfArms`
 * component on the actual colliding faction definitions.
 *
 * Why this stands in for a screenshot: this ran in an unattended scheduled
 * session, where `preview_start` refuses to start a dev server outright
 * ("Dev servers can't be started from unattended sessions"), which closes both
 * the Browser-pane route and the Playwright route — the latter presumes a
 * running server. See CLAUDE.md § Definition of Done → Browser-verify, and
 * impediments #546/#574.
 *
 * What it proves that the generator tests do not: the string the generator
 * builds actually reaches the DOM through the component's `useMemo` +
 * `dangerouslySetInnerHTML` path, and the two shields differ *as mounted
 * elements*, not merely as strings.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CoatOfArms } from '../CoatOfArms';
import { getFactionDefinition } from '../../../data/faction-definition-lookup';

afterEach(cleanup);

/** Mount one faction's shield and hand back its rendered <svg>. */
function mountShield(defId: string): SVGSVGElement {
  const definition = getFactionDefinition(defId);
  expect(definition, `${defId} must be a registered definition`).not.toBeNull();
  const { container } = render(<CoatOfArms definition={definition!} size={256} />);
  const svg = container.querySelector('svg');
  expect(svg, `${defId} must render an <svg>`).not.toBeNull();
  return svg as unknown as SVGSVGElement;
}

/**
 * The clip-path id is a module counter in the component path (no seed is
 * passed), so it differs on every mount whether or not the shield does.
 * Normalise it away or every comparison here passes vacuously.
 */
function shieldMarkup(svg: SVGSVGElement): string {
  return svg.innerHTML.replace(/coa-clip-[A-Za-z0-9_-]+/g, 'coa-clip-NORMALISED');
}

describe('CoatOfArms — mounted heraldry is distinct for the THR-854 pairs', () => {
  // Each pair agreed on (dominantReach, secondaryReach, factionType) before the
  // fix and therefore mounted byte-identical shields.
  const PAIRS: ReadonlyArray<readonly [string, string, string]> = [
    ['adventuring_guild', 'lorekeepers_covenant', 'both eye-dominant guilds'],
    ['thieves_guild', 'underking_court', 'both shadow-then-gold criminal factions'],
    ['monster_energy', 'monster_time', 'both star-dominant monster factions'],
  ];

  for (const [a, b, why] of PAIRS) {
    it(`renders ${a} and ${b} differently (${why})`, () => {
      const markupA = shieldMarkup(mountShield(a));
      const markupB = shieldMarkup(mountShield(b));
      expect(markupA).not.toBe(markupB);
      // Not merely different — both must be real shields, not one empty render.
      expect(markupA).toContain('<path');
      expect(markupB).toContain('<path');
    });
  }

  it('mounts a shield for every registered definition, all distinct', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const [defId] of [...PAIRS.flatMap(([a, b]) => [[a], [b]])] as [string][]) {
      const markup = shieldMarkup(mountShield(defId));
      const prior = seen.get(markup);
      if (prior) collisions.push(`${prior} == ${defId}`);
      seen.set(markup, defId);
    }
    expect(collisions).toEqual([]);
  });

  it('carries the tertiary reach into the mounted bordure stroke', () => {
    // underking_court ranks shadow → gold → heart. Heart's sphere colour must
    // appear on the border, and must NOT appear on thieves_guild, whose third
    // reach is eye. This is the axis that separates the pair.
    const underking = shieldMarkup(mountShield('underking_court'));
    const thieves = shieldMarkup(mountShield('thieves_guild'));
    const borderStroke = (markup: string) =>
      [...markup.matchAll(/<path[^>]*fill="none"[^>]*stroke="(#[0-9a-fA-F]{6})"[^>]*stroke-width="4"/g)]
        .map((m) => m[1]);
    const underkingBorder = borderStroke(underking);
    const thievesBorder = borderStroke(thieves);
    expect(underkingBorder.length).toBeGreaterThan(0);
    expect(thievesBorder.length).toBeGreaterThan(0);
    expect(underkingBorder).not.toEqual(thievesBorder);
  });
});
