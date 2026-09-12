// @vitest-environment jsdom

/**
 * The CMS tuning panel no longer offers the retired mandate-selection weights (THR-1198).
 *
 * `MANDATE_PRIMARY_WEIGHT`, `MANDATE_SECONDARY_WEIGHT`, `MANDATE_BASE_WEIGHT` and
 * `MANDATE_ACHIEVABLE_MULTIPLIER` weighted `generateMandate`'s sphere-weighted selection
 * over the 12 mandate templates. THR-1198 ruled the run's spine is what the god remembers,
 * retiring `generateMandate`; the four constants then tuned nothing while still shipping as
 * editable controls on this surface. A control that moves no number is a dead affordance
 * that reads as live — Law 21's named anti-pattern, and NFP #1 (Tunability) inverted: the
 * promise of this panel is that changing a number changes game feel.
 *
 * This file is the **browser-verify substitution** for the UI half (THR-754 / impediments
 * #546, #574): `preview_start` is refused in unattended scheduled runs — verified this run,
 * the tool returned "Dev servers can't be started from unattended sessions" — so the
 * contractual 1920×1080 capture has no reachable route. Recorded in the commit body as
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`.
 * It follows the precedent set by `configManagerWorldgenConstants.test.tsx` (THR-1409).
 *
 * Substitution is honest here rather than merely convenient: the change *removes* four rows
 * from a flat, uniformly-rendered list. It adds no element, changes no layout rule, and
 * introduces no new painted surface, so the failure classes only pixels can catch —
 * overflow, z-index, off-viewport paint — are structurally absent. Removal is also the one
 * change class a screenshot verifies poorly: proving something is *absent* everywhere on a
 * scrolling surface is exactly what a DOM query does better than an image.
 *
 * Both faces are asserted: the rows are gone, and their siblings still render — so a test
 * that passed because the panel failed to render at all is not mistaken for the fix.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigManager } from '../viewers/ConfigManager';
import { TUNABLE_GROUPS } from '../tunableConstants';
import { CONTENT_REGISTRY } from '../registry';

const RETIRED = [
  'MANDATE_PRIMARY_WEIGHT',
  'MANDATE_SECONDARY_WEIGHT',
  'MANDATE_BASE_WEIGHT',
  'MANDATE_ACHIEVABLE_MULTIPLIER',
] as const;

describe('CMS — retired mandate selection weights (THR-1198)', () => {
  it('renders no row for any retired weight, searched by its own name', () => {
    for (const name of RETIRED) {
      const { unmount } = render(
        <ConfigManager groups={TUNABLE_GROUPS} searchQuery={name} />,
      );
      expect(screen.queryByText(name), `${name} still paints a tuning row`).toBeNull();
      unmount();
    }
  });

  it('still renders the surviving siblings from the same group', () => {
    // The falsification arm: the assertions above would also pass if ConfigManager
    // rendered nothing at all. These rows sit beside the retired four.
    render(<ConfigManager groups={TUNABLE_GROUPS} searchQuery="DEFAULT_DOOM_TICKS" />);
    expect(screen.getByText('DEFAULT_DOOM_TICKS')).toBeTruthy();

    render(<ConfigManager groups={TUNABLE_GROUPS} searchQuery="TWILIGHT_TICKS" />);
    expect(screen.getByText('TWILIGHT_TICKS')).toBeTruthy();
  });

  it('drops the rows from the content-browser constants dataset too', () => {
    // The same four shipped on a second surface (`?view=cms` → Game Config), which
    // reads the registry rather than TUNABLE_GROUPS. Both had to be cleared.
    const entry = CONTENT_REGISTRY.find((e) => e.sourceFile === 'src/data/game-config.ts');
    expect(entry, 'game-config registry entry missing').toBeDefined();

    const rendered = JSON.stringify(entry!.data);
    for (const name of RETIRED) {
      expect(rendered, `${name} still listed in the registry dataset`).not.toContain(name);
    }
    // Falsification: the surviving rows prove the dataset is populated.
    expect(rendered).toContain('DEFAULT_DOOM_TICKS');
  });
});
