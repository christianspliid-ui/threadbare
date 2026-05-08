// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  EiraHeroPanel,
  type EncounterHeroPanelData,
} from '../EiraHeroPanel';

function renderInViewport(node: React.ReactElement) {
  return render(
    <div style={{ width: 1920, height: 1080 }}>{node}</div>,
  );
}

const baseHero: EncounterHeroPanelData = {
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

describe('EiraHeroPanel snapshots', () => {
  it('matches snapshots for full, no-items, no-vow, and four-recent-moments fixtures', () => {
    const { asFragment, rerender } = renderInViewport(
      <EiraHeroPanel data={baseHero} />,
    );
    expect(asFragment()).toMatchSnapshot('full-hero');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <EiraHeroPanel
          data={{
            ...baseHero,
            items: [],
          }}
        />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('no-items');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <EiraHeroPanel
          data={{
            ...baseHero,
            activeVow: undefined,
          }}
        />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('no-vow');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <EiraHeroPanel
          data={{
            ...baseHero,
            recentMoments: [
              {
                id: 'echo-1',
                title: 'Iron market in winter',
                detail: 'Veiren tested her patience in the open queue.',
              },
              {
                id: 'echo-2',
                title: 'Lantern bridge at dusk',
                detail: 'The crowd moved for her without command.',
              },
              {
                id: 'echo-3',
                title: 'Ash quarter bargain',
                detail: 'She traded certainty for a fragile truce.',
              },
              {
                id: 'echo-4',
                title: 'Civic gate in rain',
                detail: 'The guard held his tongue and watched.',
              },
            ],
          }}
        />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('four-recent-moments');
  });
});
