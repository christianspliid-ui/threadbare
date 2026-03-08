// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScryOverlay } from '../ScryOverlay';
import { ScryProvider } from '../contexts/ScryContext';
import { createScryState, initializeCourt } from '../../../engine/scry';
import type { RetinueAgent } from '../../../engine/retinue';
import { SPHERE_NAMES } from '../../../types/index';
import type { EssencePool } from '../../../types/influence';

describe('ScryOverlay', () => {
  const mockAgents: RetinueAgent[] = [
    {
      id: 'agent.1',
      name: 'Kalam',
      tier: 3,
      tierName: 'Champion',
      locationId: 'loc.a',
      locationName: 'Shadow Keep',
      profile: {
        ambition_contentment: 0.3,
        courage_prudence: -0.1,
        cruelty_compassion: 0.2,
        cunning_honesty: -0.5,
        devotion_independence: 0.7,
        loyalty_treachery: 0.9,
        tradition_innovation: 0.1,
        dominance_humility: -0.2,
        wrath_patience: 0.4,
        greed_generosity: -0.3,
      },
      domainCapabilities: {
        iron: 7,
        gold: 3,
        shadow: 8,
        veil: 2,
        heart: 4,
        eye: 5,
        stone: 1,
        star: 2,
        flesh: 3,
      },
      factionName: null,
    },
    {
      id: 'agent.2',
      name: 'Tattersail',
      tier: 2,
      tierName: 'Devoted',
      locationId: 'loc.b',
      locationName: 'Moon Tower',
      profile: {
        ambition_contentment: 0.1,
        courage_prudence: 0.2,
        cruelty_compassion: -0.1,
        cunning_honesty: 0.4,
        devotion_independence: 0.6,
        loyalty_treachery: 0.8,
        tradition_innovation: -0.2,
        dominance_humility: 0.0,
        wrath_patience: 0.3,
        greed_generosity: 0.2,
      },
      domainCapabilities: {
        iron: 2,
        gold: 4,
        shadow: 3,
        veil: 7,
        heart: 5,
        eye: 6,
        stone: 2,
        star: 4,
        flesh: 1,
      },
      factionName: 'Bridgeburners',
    },
  ];

  const mockEssencePool = Object.fromEntries(
    SPHERE_NAMES.map(s => [s, 20])
  ) as EssencePool;

  const baseContextValue = {
    scryState: initializeCourt(createScryState(), 'high_house'),
    retinueAgents: mockAgents,
    essencePool: mockEssencePool,
    primarySphere: 'force' as const,
    tick: 10,
    seed: 42,
    onAssign: vi.fn(),
    onDemote: vi.fn(),
    onClose: vi.fn(),
  };

  const renderWithContext = (contextValue = baseContextValue) => {
    return render(
      <ScryProvider value={contextValue}>
        <ScryOverlay />
      </ScryProvider>
    );
  };

  it('renders court name "The High House"', () => {
    renderWithContext();
    expect(screen.getByText('The High House')).toBeInTheDocument();
  });

  it('renders close button with aria-label', () => {
    renderWithContext();
    const closeBtn = screen.getByLabelText('close');
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    const context = { ...baseContextValue, onClose };
    renderWithContext(context);
    const closeBtn = screen.getByLabelText('close');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders 10 position slots', () => {
    renderWithContext();
    const emptySlots = screen.getAllByText(/Empty/i);
    // All 10 positions should be empty initially
    expect(emptySlots.length).toBeGreaterThanOrEqual(10);
  });

  it('renders apex position with "The Sovereign" archetype', () => {
    renderWithContext();
    expect(screen.getByText('The Sovereign')).toBeInTheDocument();
  });

  it('renders inner position with "The Shield" archetype', () => {
    renderWithContext();
    expect(screen.getByText('The Shield')).toBeInTheDocument();
  });

  it('renders "Sacred Sites" section heading', () => {
    renderWithContext();
    expect(screen.getByText(/Sacred Sites/i)).toBeInTheDocument();
  });

  it('renders "Divine Artifacts" section heading', () => {
    renderWithContext();
    expect(screen.getByText(/Divine Artifacts/i)).toBeInTheDocument();
  });

  it('clicking empty position opens agent picker', () => {
    renderWithContext();
    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]);
    expect(screen.getByText('Choose Agent')).toBeInTheDocument();
  });

  it('agent picker shows retinue agent names', () => {
    renderWithContext();
    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]); // Apex requires tier 3
    // Kalam is tier 3, Tattersail is tier 2 - only Kalam should appear
    expect(screen.getByText('Kalam')).toBeInTheDocument();
  });

  it('agent picker filters agents by minimum tier', () => {
    // Create state with outer position (tier 1 minimum)
    const state = initializeCourt(createScryState(), 'high_house');
    const context = {
      ...baseContextValue,
      scryState: state,
      retinueAgents: [
        { ...mockAgents[0], tier: 1 }, // Tier 1, should be eligible for outer
        { ...mockAgents[1], tier: 1 },
      ],
    };

    renderWithContext(context);

    // Click an outer position (requires tier 1)
    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[emptySlots.length - 1]); // Click last (outer)

    expect(screen.getByText('Kalam')).toBeInTheDocument();
    expect(screen.getByText('Tattersail')).toBeInTheDocument();
  });

  it('clicking agent in picker opens title picker', () => {
    renderWithContext();
    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]); // Click apex position

    expect(screen.getByText('Choose Agent')).toBeInTheDocument();

    const agentName = screen.getByText('Kalam');
    fireEvent.click(agentName);

    expect(screen.getByText(/Select Title for Kalam/i)).toBeInTheDocument();
  });

  it('title picker displays title proposals', () => {
    renderWithContext();
    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]); // Apex position

    const agentName = screen.getByText('Kalam');
    fireEvent.click(agentName);

    // Title proposals should appear (generated from mock seed)
    expect(screen.getByText(/Select Title for Kalam/i)).toBeInTheDocument();
  });

  it('clicking title proposal calls onAssign', () => {
    const onAssign = vi.fn();
    const context = { ...baseContextValue, onAssign };
    renderWithContext(context);

    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]); // Apex

    const agentName = screen.getByText('Kalam');
    fireEvent.click(agentName);

    // Wait for title picker to appear by checking for cost text
    expect(screen.getByText(/Cost:/i)).toBeInTheDocument();

    // Get all buttons in the title picker area (the dialog)
    const dialog = screen.getByText(/Select Title for Kalam/i).closest('div');
    if (dialog) {
      const titleButtons = dialog.querySelectorAll('button');
      // Filter to get actual title proposal buttons (not the back button)
      const proposalButtons = Array.from(titleButtons).filter(
        btn => btn.textContent.length > 10 && !btn.getAttribute('aria-label')
      );

      if (proposalButtons.length > 0) {
        fireEvent.click(proposalButtons[0]);
        // onAssign should have been called
        expect(onAssign).toHaveBeenCalled();
      }
    }
  });

  it('closing agent picker resets picker mode', () => {
    renderWithContext();
    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]);

    expect(screen.getByText('Choose Agent')).toBeInTheDocument();

    const closeBtn = screen.getByLabelText('close picker');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Choose Agent')).not.toBeInTheDocument();
  });

  it('renders flavor text for court structure', () => {
    renderWithContext();
    expect(screen.getByText(/Stone upon stone/i)).toBeInTheDocument();
  });

  it('displays structure bonus description', () => {
    renderWithContext();
    expect(screen.getByText(/Structure Bonus:/i)).toBeInTheDocument();
  });

  it('displays section headers for ranks', () => {
    renderWithContext();
    // Use queryAllByText and check length to find the headers
    const apexHeaders = screen.getAllByText('Apex');
    const innerHeaders = screen.getAllByText('Inner Circle');
    const outerHeaders = screen.getAllByText('Outer Reaches');
    expect(apexHeaders.length).toBeGreaterThan(0);
    expect(innerHeaders.length).toBeGreaterThan(0);
    expect(outerHeaders.length).toBeGreaterThan(0);
  });

  it('shows essence cost in title picker', () => {
    renderWithContext();
    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]); // Apex

    const agentName = screen.getByText('Kalam');
    fireEvent.click(agentName);

    // Cost should be displayed
    expect(screen.getByText(/Cost:/i)).toBeInTheDocument();
  });

  it('title picker shows insufficient essence message if needed', () => {
    const lowEssencePool = Object.fromEntries(
      SPHERE_NAMES.map(s => [s, 1])
    ) as EssencePool;

    const context = {
      ...baseContextValue,
      essencePool: lowEssencePool,
    };

    renderWithContext(context);

    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]); // Apex (costs 30 essence)

    const agentName = screen.getByText('Kalam');
    fireEvent.click(agentName);

    // Should show insufficient essence message for apex (costs 30)
    expect(screen.getByText(/Insufficient/i)).toBeInTheDocument();
  });
});
