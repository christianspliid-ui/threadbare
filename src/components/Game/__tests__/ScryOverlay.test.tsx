// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { ScryOverlay } from '../ScryOverlay';
import { SCRY_BACK_TO_COURT_LABEL } from '../../../data/ui-content';
import { ScryProvider } from '../contexts/ScryContext';
import { createScryState, initializeCourt, assignAgentToPosition } from '../../../engine/scry';
import type { RetinueAgent } from '../../../engine/retinue';
import type { Title } from '../../../types/scry';
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
        loyalty_ambition: 0.3,
        courage_prudence: -0.1,
        mercy_ruthlessness: 0.2,
        honesty_cunning: -0.5,
        sacrifice_survival: 0.7,
        loyalty_ambition: 0.9,
        tradition_novelty: 0.1,
        humility_pride: -0.2,
        mercy_ruthlessness: 0.4,
        asceticism_extravagance: -0.3,
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
        loyalty_ambition: 0.1,
        courage_prudence: 0.2,
        mercy_ruthlessness: -0.1,
        honesty_cunning: 0.4,
        sacrifice_survival: 0.6,
        loyalty_ambition: 0.8,
        tradition_novelty: -0.2,
        humility_pride: 0.0,
        mercy_ruthlessness: 0.3,
        asceticism_extravagance: 0.2,
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
    const closeBtn = screen.getByLabelText('Close Divine Court');
    expect(closeBtn).toBeInTheDocument();
  });

  it('is an L dialog portalled to <body>, two columns, with the ✕ outside the scroll regions (THR-1709, THR-1880)', () => {
    const { container } = renderWithContext();
    const overlay = screen.getByTestId('scry-overlay');
    // Not inside the render container — no ancestor stacking context can trap it.
    expect(container.contains(overlay)).toBe(false);
    const panel = overlay.closest('[data-dialog-size]') as HTMLElement;
    expect(panel.getAttribute('data-dialog-size')).toBe('l');
    expect(screen.getByTestId('sheet-columns').getAttribute('data-layout')).toBe('two');
    // Name, flavour and art left; the seats right.
    const aside = screen.getByTestId('sheet-columns-aside');
    expect(within(aside).getByText('The High House')).toBeInTheDocument();
    const main = screen.getByTestId('sheet-columns-main');
    expect(main.contains(screen.getByTestId('scry-overlay-body'))).toBe(true);
    // The close button is in the header, never inside a scroll region.
    expect(screen.getByTestId('sheet-columns').contains(screen.getByLabelText('Close Divine Court'))).toBe(false);
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    const context = { ...baseContextValue, onClose };
    renderWithContext(context);
    const closeBtn = screen.getByLabelText('Close Divine Court');
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
    fireEvent.click(emptySlots[emptySlots.length - 1]); // Outer — affordable with the mock pool
    fireEvent.click(screen.getByText('Kalam'));
    expect(screen.getByTestId('scry-cost-sentence').textContent).toMatch(/^Moving them costs \d+ force essence\.$/);

    const picker = screen.getByTestId('scry-title-picker');
    const proposal = within(picker).getAllByRole('button').find(btn => btn.textContent !== SCRY_BACK_TO_COURT_LABEL);
    expect(proposal).toBeDefined();
    fireEvent.click(proposal!);
    expect(onAssign).toHaveBeenCalled();
  });

  it('closing agent picker resets picker mode', () => {
    renderWithContext();
    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]);

    expect(screen.getByText('Choose Agent')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: SCRY_BACK_TO_COURT_LABEL }));

    expect(screen.queryByText('Choose Agent')).not.toBeInTheDocument();
    expect(screen.getByTestId('scry-overlay-body')).toBeInTheDocument();
  });

  it('renders flavor text for court structure', () => {
    renderWithContext();
    expect(screen.getByText(/Stone upon stone/i)).toBeInTheDocument();
  });

  it('displays structure bonus description', () => {
    renderWithContext();
    // THR-2101: a sentence in the structure's own words, no "Structure Bonus:" label.
    expect(screen.getByTestId('scry-structure-bonus').textContent).toBe('In The High House, top 3 positions cost 1 less essence for tier maintenance.');
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
    expect(screen.getByTestId('scry-cost-sentence').textContent).toMatch(/^Moving them costs \d+ force essence\.$/);
  });

  it('agent picker excludes agents already assigned to a court position', () => {
    // Assign Kalam to the apex position
    const baseState = initializeCourt(createScryState(), 'high_house');
    const apexPosition = baseState.positions.find(p => p.rank === 'apex')!;
    const mockTitle: Title = {
      id: 'title.test',
      name: 'The Iron Sovereign',
      rank: 'apex',
      sphereAffinity: 'force',
      domainAffinity: 'iron',
      bonuses: [],
      weaknesses: [],
      flavorText: 'Test title',
      generationSeed: {},
    };
    const stateWithKalamAssigned = assignAgentToPosition(
      baseState, apexPosition.id, 'agent.1', mockTitle, 30, 1
    );

    const context = {
      ...baseContextValue,
      scryState: stateWithKalamAssigned,
    };

    renderWithContext(context);

    // Click an empty inner position (tier 2 minimum — both agents eligible by tier)
    const emptySlots = screen.getAllByText(/Empty/i);
    fireEvent.click(emptySlots[0]);

    const pickerHeading = screen.getByText('Choose Agent');
    expect(pickerHeading).toBeInTheDocument();
    // Tattersail has no position — should appear in picker
    expect(screen.getByText('Tattersail')).toBeInTheDocument();
    // Kalam is already in apex — must NOT appear in the picker agent list
    // (Kalam's name may appear in the filled slot, so scope to picker)
    const pickerPanel = screen.getByTestId('scry-agent-picker');
    const kalamInPicker = pickerPanel?.querySelector?.('button')
      ? Array.from(pickerPanel.querySelectorAll('button')).some(
          btn => btn.textContent?.includes('Kalam')
        )
      : false;
    expect(kalamInPicker).toBe(false);
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
    // THR-2101: one sentence with both numbers, never "Required: / Available:".
    expect(screen.getByTestId('scry-shortfall-sentence').textContent).toMatch(/^You hold 1 force essence; this needs \d+\.$/);
  });

  describe('picker views in the court column (THR-1880)', () => {
    it('opens the agent picker as a view in the right column, replacing the seats', () => {
      renderWithContext();
      fireEvent.click(screen.getAllByText(/Empty/i)[0]);
      const main = screen.getByTestId('sheet-columns-main');
      expect(main.contains(screen.getByTestId('scry-agent-picker'))).toBe(true);
      expect(screen.queryByTestId('scry-overlay-body')).toBeNull();
      // The court stays named on the left (Law 24).
      expect(within(screen.getByTestId('sheet-columns-aside')).getByText('The High House')).toBeInTheDocument();
      // No nested scroll box.
      expect(screen.getByTestId('scry-agent-picker').innerHTML).not.toContain('max-h-96');
    });

    it('Escape returns to the seats first, and a second Escape closes the court', () => {
      const onClose = vi.fn();
      renderWithContext({ ...baseContextValue, onClose });
      fireEvent.click(screen.getAllByText(/Empty/i)[0]);
      expect(screen.getByText('Choose Agent')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByText('Choose Agent')).toBeNull();
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('the title picker goes back to the court, not to the agent list', () => {
      renderWithContext();
      fireEvent.click(screen.getAllByText(/Empty/i)[0]);
      fireEvent.click(screen.getByText('Kalam'));
      expect(screen.getByText(/Select Title for Kalam/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: SCRY_BACK_TO_COURT_LABEL }));
      expect(screen.queryByText(/Select Title for Kalam/i)).toBeNull();
      expect(screen.queryByText('Choose Agent')).toBeNull();
      expect(screen.getByTestId('scry-overlay-body')).toBeInTheDocument();
    });

    it('a pick returns to the seats with the filled seat highlighted, then the ring fades', () => {
      vi.useFakeTimers();
      try {
        const onAssign = vi.fn();
        renderWithContext({ ...baseContextValue, onAssign });
        const emptySlots = screen.getAllByText(/Empty/i);
        fireEvent.click(emptySlots[emptySlots.length - 1]); // Outer — affordable
        fireEvent.click(screen.getByText('Kalam'));
        const picker = screen.getByTestId('scry-title-picker');
        const proposal = within(picker).getAllByRole('button').find(b => b.textContent !== SCRY_BACK_TO_COURT_LABEL);
        expect(proposal).toBeDefined();
        fireEvent.click(proposal!);
        expect(onAssign).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('scry-overlay-body')).toBeInTheDocument();
        expect(document.querySelectorAll('[data-filled-highlight="true"]')).toHaveLength(1);
        act(() => { vi.runAllTimers(); });
        expect(document.querySelectorAll('[data-filled-highlight="true"]')).toHaveLength(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
