// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentWheel } from '../AgentWheel';
import type { WheelSlot } from '../../../engine/wheel';

describe('AgentWheel', () => {
  const mockAvailableSlot: WheelSlot = {
    id: 'scry',
    label: 'Scry',
    type: 'observation',
    angleDeg: 0,
    available: true,
    lockedReason: null,
    essenceCost: 0,
    detectionRisk: 0,
    sphere: null,
    interventionType: null,
  };

  const mockUnavailableSlot: WheelSlot = {
    id: 'coincidence',
    label: 'Coincidence',
    type: 'intervention',
    angleDeg: 225,
    available: false,
    lockedReason: 'Requires tier 3',
    essenceCost: 50,
    detectionRisk: 0.8,
    sphere: 'force',
    interventionType: 'coincidence',
  };

  const mockDreamSlot: WheelSlot = {
    id: 'dream',
    label: 'Dream',
    type: 'intervention',
    angleDeg: 45,
    available: true,
    lockedReason: null,
    essenceCost: 20,
    detectionRisk: 0.3,
    sphere: 'mind',
    interventionType: 'dream',
  };

  const mockCenterSlot: WheelSlot = {
    id: 'center',
    label: '',
    type: 'info',
    angleDeg: -1,
    available: true,
    lockedReason: null,
    essenceCost: 0,
    detectionRisk: 0,
    sphere: null,
    interventionType: null,
  };

  it('renders slot labels', () => {
    const slots = [mockAvailableSlot, mockDreamSlot, mockCenterSlot];
    render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="Test Agent"
          agentTitle={null}
          cx={200}
          cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );

    expect(screen.getByText('Scry')).toBeInTheDocument();
    expect(screen.getByText('Dream')).toBeInTheDocument();
  });

  it('shows agent name in center', () => {
    const slots = [mockAvailableSlot, mockDreamSlot, mockCenterSlot];
    render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="The Brave Knight"
          agentTitle={null}
          cx={200}
          cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );

    expect(screen.getByText('The Brave Knight')).toBeInTheDocument();
  });

  it('shows agent title when present', () => {
    const slots = [mockAvailableSlot, mockDreamSlot, mockCenterSlot];
    render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="The Sword"
          agentTitle="The Sword of Ashara"
          cx={200}
          cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );

    expect(screen.getByText('The Sword of Ashara')).toBeInTheDocument();
  });

  it('calls onSlotClick when available slot is clicked', () => {
    const mockOnSlotClick = vi.fn();
    const slots = [mockAvailableSlot, mockDreamSlot, mockCenterSlot];
    const { container } = render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="Test Agent"
          agentTitle={null}
          cx={200}
          cy={200}
          onSlotClick={mockOnSlotClick}
          onDismiss={vi.fn()}
        />
      </svg>
    );

    // Find the clickable group for the scry slot (first slot after center)
    const groups = container.querySelectorAll('g[data-slot-id]');
    const scryGroup = Array.from(groups).find(
      (g) => g.getAttribute('data-slot-id') === 'scry'
    );

    expect(scryGroup).toBeTruthy();
    fireEvent.click(scryGroup!);
    expect(mockOnSlotClick).toHaveBeenCalledWith('scry');
  });

  it('does NOT call onSlotClick for unavailable slots', () => {
    const mockOnSlotClick = vi.fn();
    const slots = [mockUnavailableSlot, mockCenterSlot];
    const { container } = render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="Test Agent"
          agentTitle={null}
          cx={200}
          cy={200}
          onSlotClick={mockOnSlotClick}
          onDismiss={vi.fn()}
        />
      </svg>
    );

    const groups = container.querySelectorAll('g[data-slot-id="coincidence"]');
    const unavailableGroup = groups[0];

    expect(unavailableGroup).toBeTruthy();
    fireEvent.click(unavailableGroup);
    expect(mockOnSlotClick).not.toHaveBeenCalled();
  });

  it('calls onDismiss when backdrop circle is clicked', () => {
    const mockOnDismiss = vi.fn();
    const slots = [mockAvailableSlot, mockCenterSlot];
    const { container } = render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="Test Agent"
          agentTitle={null}
          cx={200}
          cy={200}
          onSlotClick={vi.fn()}
          onDismiss={mockOnDismiss}
        />
      </svg>
    );

    // Find the backdrop circle (data-backdrop attribute)
    const backdrop = container.querySelector('[data-backdrop="true"]');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('skips rendering center slot content', () => {
    const slots = [mockAvailableSlot, mockDreamSlot, mockCenterSlot];
    const { container } = render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="Test Agent"
          agentTitle={null}
          cx={200}
          cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );

    // Center slot should have no clickable group or icon rendered outside center text area
    // We just verify the center text is there, but the center slot's content group is not visible as a separate slot
    const centerSlotGroup = container.querySelector('g[data-slot-id="center"]');
    expect(centerSlotGroup).toBeFalsy();
  });

  it('renders available slots with bright opacity', () => {
    const slots = [mockAvailableSlot, mockCenterSlot];
    const { container } = render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="Test Agent"
          agentTitle={null}
          cx={200}
          cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );

    const scryGroup = container.querySelector('g[data-slot-id="scry"]');
    expect(scryGroup).toBeTruthy();
    // Available slots should not have reduced opacity
    const opacity = scryGroup?.getAttribute('opacity');
    expect(opacity).not.toBe('0.3');
  });

  it('renders unavailable slots with dimmed opacity', () => {
    const slots = [mockUnavailableSlot, mockCenterSlot];
    const { container } = render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="Test Agent"
          agentTitle={null}
          cx={200}
          cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );

    const unavailableGroup = container.querySelector('g[data-slot-id="coincidence"]');
    expect(unavailableGroup).toBeTruthy();
    expect(unavailableGroup).toHaveAttribute('opacity', '0.3');
  });

  it('has outer ring circle for decoration', () => {
    const slots = [mockAvailableSlot, mockCenterSlot];
    const { container } = render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="Test Agent"
          agentTitle={null}
          cx={200}
          cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );

    const ringCircles = container.querySelectorAll('circle[data-ring="true"]');
    expect(ringCircles.length).toBeGreaterThan(0);
  });

  it('renders multiple available slots correctly', () => {
    const slots = [mockAvailableSlot, mockDreamSlot, mockCenterSlot];
    const { container } = render(
      <svg>
        <AgentWheel
          slots={slots}
          agentName="Test Agent"
          agentTitle={null}
          cx={200}
          cy={200}
          onSlotClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      </svg>
    );

    expect(screen.getByText('Scry')).toBeInTheDocument();
    expect(screen.getByText('Dream')).toBeInTheDocument();

    const scryGroup = container.querySelector('g[data-slot-id="scry"]');
    const dreamGroup = container.querySelector('g[data-slot-id="dream"]');

    expect(scryGroup).toBeTruthy();
    expect(dreamGroup).toBeTruthy();
  });
});
