// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameView } from '../GameView';
import type { AscendantArchetype } from '../../../types/influence';
import type { CosmologyProfile } from '../../../types';

describe('GameView', () => {
  const mockArchetype: AscendantArchetype = {
    id: 'justice',
    name: 'The Just One',
    title: 'The Just One',
    description: 'A god of justice and order',
    sphereAlignment: {
      primary: 'force',
      secondary: 'mind',
    },
    startingDomainAffinities: {
      iron: 0.8,
      gold: 0.4,
    },
    personalitySeed: {
      ambition_contentment: 0.7,
      courage_prudence: 0.6,
      cruelty_compassion: 0.5,
      cunning_honesty: 0.4,
      devotion_independence: 0.8,
      loyalty_treachery: 0.3,
      tradition_innovation: 0.5,
      dominance_humility: 0.6,
      wrath_patience: -0.2,
      greed_generosity: -0.1,
    },
    flavorText: 'A god of justice and righteous order',
  };

  const mockCosmology: CosmologyProfile = {
    force: 0.7,
    matter: 0.5,
    energy: 0.6,
    life: 0.5,
    mind: 0.8,
    spirit: 0.3,
    time: 0.4,
    entropy: 0.3,
  };

  it('renders the retinue panel', () => {
    const { container } = render(
      <GameView
        archetype={mockArchetype}
        avatarName="The Divine Witness"
        cosmology={mockCosmology}
        seed={42}
      />
    );
    // Check for right sidebar with retinue content
    const rightSidebar = container.querySelector('.w-72');
    expect(rightSidebar).toBeInTheDocument();
    expect(rightSidebar?.textContent).toMatch(/Retinue|No agents/);
  });

  it('renders the ascendant info', () => {
    render(
      <GameView
        archetype={mockArchetype}
        avatarName="The Divine Witness"
        cosmology={mockCosmology}
        seed={42}
      />
    );
    expect(screen.getByText('The Just One')).toBeInTheDocument();
    expect(screen.getByText(/Avatar: The Divine Witness/)).toBeInTheDocument();
  });

  it('renders simulation controls with tick info', () => {
    render(
      <GameView
        archetype={mockArchetype}
        avatarName="The Divine Witness"
        cosmology={mockCosmology}
        seed={42}
      />
    );
    // Check for simulation control elements by looking for Time header or tick/season info
    const timeControl = screen.queryByText('Time') ||
                       screen.queryByText(/Tick:/) ||
                       screen.queryByText(/Spring|Summer|Autumn|Winter/);
    expect(timeControl || screen.getByText(/Time|Tick|spring|summer|autumn|winter/i)).toBeTruthy();
  });

  it('renders doom bar at top', () => {
    render(
      <GameView
        archetype={mockArchetype}
        avatarName="The Divine Witness"
        cosmology={mockCosmology}
        seed={42}
      />
    );
    // DoomBar should show the breach archetype
    expect(screen.getByText('breach')).toBeInTheDocument();
  });

  it('renders three-column layout with right sidebar', () => {
    const { container } = render(
      <GameView
        archetype={mockArchetype}
        avatarName="The Divine Witness"
        cosmology={mockCosmology}
        seed={42}
      />
    );
    // Check for left, center, and right columns by class names
    const leftSidebar = container.querySelector('.w-80');
    const rightSidebar = container.querySelector('.w-72');
    expect(leftSidebar).toBeInTheDocument();
    expect(rightSidebar).toBeInTheDocument();
  });
});
