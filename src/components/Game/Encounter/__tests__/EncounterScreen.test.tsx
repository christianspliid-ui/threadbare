// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  EncounterScreen,
  ENCOUNTER_SCREEN_LAYOUT,
} from '../EncounterScreen';
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

describe('EncounterScreen', () => {
  it('renders the shell with center, right, and bottom zones', () => {
    render(
      <EncounterScreen
        heroPanel={heroPanelData}
        header={<div>BEAT 2 - NOW</div>}
        centerColumn={<div>The center card</div>}
        rightRail={<div>Cast and hand</div>}
        bottomStrip={<div>Quintessence and watch-only</div>}
      />,
    );

    expect(screen.getByTestId('encounter-screen-shell')).toBeInTheDocument();
    expect(screen.getByTestId('encounter-screen-center-column')).toHaveTextContent('The center card');
    expect(screen.getByTestId('encounter-screen-right-rail')).toHaveTextContent('Cast and hand');
    expect(screen.getByTestId('encounter-screen-bottom-strip')).toHaveTextContent('Quintessence and watch-only');
  });

  it('respects canonical fixed layout constants for hero, rail, and bottom strip', () => {
    render(
      <EncounterScreen
        heroPanel={heroPanelData}
        centerColumn={<div>Center</div>}
        rightRail={<div>Right</div>}
        bottomStrip={<div>Bottom</div>}
      />,
    );

    const bottomStrip = screen.getByTestId('encounter-screen-bottom-strip');
    expect(bottomStrip).toHaveStyle({
      minHeight: `${ENCOUNTER_SCREEN_LAYOUT.BOTTOM_STRIP_HEIGHT_PX}px`,
      maxHeight: `${ENCOUNTER_SCREEN_LAYOUT.BOTTOM_STRIP_HEIGHT_PX}px`,
    });
  });

  it('renders protagonist panel sections and fallback portrait', () => {
    render(
      <EncounterScreen
        heroPanel={heroPanelData}
        centerColumn={<div>Center</div>}
        rightRail={<div>Right</div>}
        bottomStrip={<div>Bottom</div>}
      />,
    );

    expect(screen.getByTestId('encounter-eira-hero-panel')).toBeInTheDocument();
    expect(screen.getByText('Eira of Bren')).toBeInTheDocument();
    expect(screen.getByText('Capability In This Scene')).toBeInTheDocument();
    expect(screen.getByText('She Carries Into This Scene')).toBeInTheDocument();
    expect(screen.getByText('Recent Moments')).toBeInTheDocument();
  });
});
