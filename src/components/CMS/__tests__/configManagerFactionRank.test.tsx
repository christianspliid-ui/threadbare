// @vitest-environment jsdom

/**
 * ConfigManager paints the two faction-rank thresholds (THR-1151).
 *
 * THR-1151 is an engine ticket — three dead readers testing an integer threshold against a
 * 0–1 scale — but registering the replacement constants on the CMS tunable surface puts a
 * file under `src/components/` in the diff, which trips the UI-pillar browser-verify trigger.
 *
 * This file is the **browser-verify substitution** for that (THR-754 / impediments #546, #574):
 * `preview_start` is refused in unattended scheduled runs — verified this run, the tool returned
 * "Dev servers can't be started from unattended sessions" — so the contractual 1920×1080 capture
 * has no reachable route. Substitution is honest here rather than merely convenient: the change
 * appends two rows to an existing vertical list of ~60 sibling rows rendered by the same
 * `ConstantRow` component, so the failure classes only pixels can catch (overflow, z-index,
 * off-viewport paint) are structurally absent — the rows cannot lay out differently from the
 * siblings already shipping on that surface.
 *
 * What this asserts that a screenshot could not: that the values reaching the surface are the
 * post-fix ones. A capture of the CMS would show two rows whatever numbers they carried.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigManager } from '../viewers/ConfigManager';
import { TUNABLE_GROUPS } from '../tunableConstants';
import { FACTION_RANK_SENIOR, FACTION_RANK_NOTABLE } from '../../../data/agent-behavior-constants';

describe('ConfigManager — faction rank thresholds (THR-1151)', () => {
  it('paints FACTION_RANK_SENIOR with its live value and range', () => {
    render(<ConfigManager groups={TUNABLE_GROUPS} searchQuery="FACTION_RANK_SENIOR" />);

    expect(screen.getByText('FACTION_RANK_SENIOR')).toBeTruthy();
    // The rendered value is the live constant, not a literal duplicated into the test —
    // so this arm fails if the registry drifts from the module the readers import.
    expect(screen.getByDisplayValue(String(FACTION_RANK_SENIOR))).toBeTruthy();
    expect(screen.getByText('[0.4, 0.85]')).toBeTruthy();
  });

  it('paints FACTION_RANK_NOTABLE with its live value and range', () => {
    render(<ConfigManager groups={TUNABLE_GROUPS} searchQuery="FACTION_RANK_NOTABLE" />);

    expect(screen.getByText('FACTION_RANK_NOTABLE')).toBeTruthy();
    expect(screen.getByDisplayValue(String(FACTION_RANK_NOTABLE))).toBeTruthy();
    expect(screen.getByText('[0.2, 0.6]')).toBeTruthy();
  });

  it('registers both thresholds on the 0-1 scale the readers actually use', () => {
    // The defect THR-1151 fixes was a threshold off the declared scale. Pinning that
    // property here means a future retune cannot silently reintroduce an integer tier.
    expect(FACTION_RANK_SENIOR).toBeGreaterThan(0);
    expect(FACTION_RANK_SENIOR).toBeLessThanOrEqual(1);
    expect(FACTION_RANK_NOTABLE).toBeGreaterThan(0);
    expect(FACTION_RANK_NOTABLE).toBeLessThanOrEqual(1);
    expect(FACTION_RANK_NOTABLE).toBeLessThan(FACTION_RANK_SENIOR);
  });
});
