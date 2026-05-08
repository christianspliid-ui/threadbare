// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EiraHeroPanel,
  type EncounterHeroPanelData,
} from '../EiraHeroPanel';

const baseData: EncounterHeroPanelData = {
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

function renderInViewport(node: React.ReactElement) {
  return render(<div style={{ width: 1920, height: 1080 }}>{node}</div>);
}

describe('EiraHeroPanel', () => {
  it('renders the populated baseline panel', () => {
    renderInViewport(<EiraHeroPanel data={baseData} />);

    expect(screen.getByTestId('encounter-eira-hero-panel')).toBeInTheDocument();
    expect(screen.getByText('Eira of Bren')).toBeInTheDocument();
    expect(screen.getByText(baseData.subtitle!)).toBeInTheDocument();
    expect(screen.getByText(baseData.statusLine!)).toBeInTheDocument();
    expect(screen.getByText('Capability In This Scene')).toBeInTheDocument();
    expect(screen.getByText('She Carries Into This Scene')).toBeInTheDocument();
    expect(screen.getByText('Recent Moments')).toBeInTheDocument();
    expect(screen.getByText('Vow - Active Now')).toBeInTheDocument();
  });

  it('matches the snapshot for the populated baseline at 1920x1080', () => {
    const { asFragment } = renderInViewport(<EiraHeroPanel data={baseData} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches the snapshot when no portrait is provided (initials fallback)', () => {
    const { asFragment } = renderInViewport(
      <EiraHeroPanel data={{ ...baseData, portraitUrl: null }} />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches the snapshot with a real portrait URL', () => {
    const { asFragment } = renderInViewport(
      <EiraHeroPanel
        data={{ ...baseData, portraitUrl: '/portraits/eira.png', portraitAlt: 'Eira portrait' }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches the snapshot with no active vow', () => {
    const { activeVow: _ignored, ...rest } = baseData;
    const { asFragment } = renderInViewport(<EiraHeroPanel data={rest as EncounterHeroPanelData} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches the snapshot with empty items and recent moments', () => {
    const { asFragment } = renderInViewport(
      <EiraHeroPanel
        data={{
          ...baseData,
          items: [],
          recentMoments: [],
          activeVow: undefined,
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders the registration slot when provided', () => {
    renderInViewport(
      <EiraHeroPanel
        data={baseData}
        registrationSlot={<div data-testid="custom-registration">attached</div>}
      />,
    );
    expect(screen.getByTestId('hero-registration-slot')).toBeInTheDocument();
    expect(screen.getByTestId('custom-registration')).toHaveTextContent('attached');
  });

  it('omits the registration slot when none is provided', () => {
    renderInViewport(<EiraHeroPanel data={baseData} />);
    expect(screen.queryByTestId('hero-registration-slot')).toBeNull();
  });

  it('renders the open-her-sheet affordance when onOpenProfile is provided', () => {
    const onOpenProfile = vi.fn();
    renderInViewport(<EiraHeroPanel data={baseData} onOpenProfile={onOpenProfile} />);

    const button = screen.getByRole('button', { name: /open her sheet/i });
    fireEvent.click(button);
    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });

  it('omits the open-her-sheet affordance when onOpenProfile is absent', () => {
    renderInViewport(<EiraHeroPanel data={baseData} />);
    expect(screen.queryByRole('button', { name: /open her sheet/i })).toBeNull();
  });

  it('renders one CapabilityStrip per provided capability', () => {
    renderInViewport(<EiraHeroPanel data={baseData} />);
    expect(screen.getAllByTestId('capability-strip')).toHaveLength(baseData.capabilities.length);
  });
});
