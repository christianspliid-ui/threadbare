// @vitest-environment jsdom

/**
 * The CMS tuning panel no longer offers the five sliders whose constants only deleted
 * modules read (THR-2131).
 *
 * `INTERVENTION_MAX_BONUS`, `OPPOSING_SPHERE_COST_MULTIPLIER` and
 * `NEUTRAL_SPHERE_COST_MULTIPLIER` were read only by `interventionCost.ts`;
 * `VIGNETTE_MAX_PER_TICK` and `VIGNETTE_QUEST_PRIORITY_THRESHOLD` only by
 * `vignetteNotification.ts`. Neither module had a production caller, and both were
 * deleted with their tests. A control that moves no number is a dead affordance (Law 21).
 *
 * Browser-verify substitution: jsdom-render — unattended run, no startable dev server.
 * Same reasoning as `configManagerMandateWeights.test.tsx` (THR-1198): the change only
 * removes rows from a flat list, which a DOM query proves better than a screenshot.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigManager } from '../viewers/ConfigManager';
import { TUNABLE_GROUPS } from '../tunableConstants';

const RETIRED = [
  'INTERVENTION_MAX_BONUS',
  'OPPOSING_SPHERE_COST_MULTIPLIER',
  'NEUTRAL_SPHERE_COST_MULTIPLIER',
  'VIGNETTE_MAX_PER_TICK',
  'VIGNETTE_QUEST_PRIORITY_THRESHOLD',
] as const;

describe('CMS — sliders of deleted modules (THR-2131)', () => {
  it('renders no row for any retired slider, searched by its own name', () => {
    for (const name of RETIRED) {
      const { unmount } = render(
        <ConfigManager groups={TUNABLE_GROUPS} searchQuery={name} />,
      );
      expect(screen.queryByText(name), `${name} still paints a tuning row`).toBeNull();
      unmount();
    }
  });

  it('still renders the surviving siblings from the same groups', () => {
    // Falsification arm: the assertions above would also pass if nothing rendered.
    for (const name of ['FOCUS_EFFICIENCY_BOOST', 'VIGNETTE_SCENE_MAX_SENTENCES']) {
      const { unmount } = render(
        <ConfigManager groups={TUNABLE_GROUPS} searchQuery={name} />,
      );
      expect(screen.getByText(name)).toBeTruthy();
      unmount();
    }
  });
});
