// @vitest-environment jsdom
/**
 * Layout-focused snapshot tests for the encounter screen shell.
 *
 * Spec: THR-344 Phase G2. Captures the full three-zone shell at the canonical
 * 1920×1080 viewport contract (CLAUDE.md) and a 2560×1440 sample (the optimal
 * viewport per project_viewport_target memory). Source `*.tsx` components are
 * untouched — these are pure rendering snapshots.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EncounterScreen } from '../EncounterScreen';
import type { EncounterHeroPanelData } from '../EiraHeroPanel';

const heroPanelData: EncounterHeroPanelData = {
  name: 'Eira of Bren',
  subtitle: 'IRON - DRAWN BOND - 28 WINTERS',
  statusLine: 'steady, but reading the room',
  capabilities: [
    {
      id: 'force',
      label: 'Force',
      sphereLabel: 'IRON',
      filledDots: 3,
      narrativeHint: 'a steady arm in a tight queue',
      accentColor: 'var(--sphere-force-bright)',
    },
    {
      id: 'mind',
      label: 'Mind',
      sphereLabel: 'EYE',
      filledDots: 3,
      narrativeHint: 'she misses little',
      accentColor: 'var(--sphere-mind-bright)',
    },
    {
      id: 'spirit',
      label: 'Spirit',
      sphereLabel: 'HEART',
      filledDots: 5,
      narrativeHint: 'her deepest thread',
      accentColor: 'var(--sphere-spirit-bright)',
    },
  ],
  items: [
    {
      id: 'captain-token',
      title: "Captain's token",
      detail: 'small favor - civic guard remembers her',
    },
  ],
  activeVow: {
    title: 'Vow to the small folk',
    detail: 'she will not crush a frightened man',
  },
  recentMoments: [
    {
      id: 'echo-1',
      title: 'Iron market in winter',
      detail: 'Veiren tested her patience in the open queue.',
    },
  ],
};

function shellAt(width: number, height: number) {
  return render(
    <div style={{ width, height }}>
      <EncounterScreen
        heroPanel={heroPanelData}
        header={<div>BEAT 2 - NOW</div>}
        centerColumn={<div>The center card</div>}
        rightRail={<div>Cast and hand</div>}
        bottomStrip={<div>Quintessence and watch-only</div>}
      />
    </div>,
  );
}

describe('EncounterScreen layout', () => {
  it('matches the full-shell snapshot at 1920x1080 (canonical viewport)', () => {
    const { asFragment } = shellAt(1920, 1080);
    expect(asFragment()).toMatchSnapshot('encounter-shell-1920x1080');
  });

  it('matches the full-shell snapshot at 2560x1440 (optimal viewport sample)', () => {
    const { asFragment } = shellAt(2560, 1440);
    expect(asFragment()).toMatchSnapshot('encounter-shell-2560x1440');
  });
});
