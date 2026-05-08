// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InterventionConfirm } from '../InterventionConfirm';

const baseProps = {
  interventionType: 'deceive' as const,
  label: 'Deceive',
  deliveryMode: 'regional' as const,
  essenceCost: 2,
  sphere: 'mind' as const,
  detectionRisk: 0.30,
  rangeStatus: 'in_range' as const,
  hexDistance: 2,
  description: 'Inject false information into world-model',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('InterventionConfirm', () => {
  it('renders intervention name and description', () => {
    render(<InterventionConfirm {...baseProps} />);
    expect(screen.getByText('Deceive')).toBeTruthy();
    expect(screen.getByText(/false information/)).toBeTruthy();
  });

  it('shows essence cost and detection risk', () => {
    render(<InterventionConfirm {...baseProps} />);
    expect(screen.getByText(/2 mind/i)).toBeTruthy();
    expect(screen.getByText(/30%/)).toBeTruthy();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(<InterventionConfirm {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<InterventionConfirm {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows local encounter choice for local delivery mode', () => {
    render(
      <InterventionConfirm
        {...baseProps}
        interventionType="persuade"
        label="Persuade"
        deliveryMode="local"
        rangeStatus="in_range"
        hexDistance={0}
      />
    );
    expect(screen.getByText(/go to them/i)).toBeTruthy();
    expect(screen.getByText(/summon/i)).toBeTruthy();
  });

  it('calls onConfirm with encounter mode for local interventions', () => {
    const onConfirm = vi.fn();
    render(
      <InterventionConfirm
        {...baseProps}
        interventionType="persuade"
        label="Persuade"
        deliveryMode="local"
        rangeStatus="in_range"
        hexDistance={0}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByText(/summon/i));
    expect(onConfirm).toHaveBeenCalledWith('summon');
  });

  it('displays selected agenda name and hook', () => {
    render(<InterventionConfirm
      {...baseProps}
      agendaName="Whisper Ambition"
      agendaNarrativeHook="golden visions of conquest"
    />);
    expect(screen.getByText('Whisper Ambition')).toBeTruthy();
    expect(screen.getByText(/golden visions/)).toBeTruthy();
  });

  it('does not render agenda section when no agenda provided', () => {
    render(<InterventionConfirm {...baseProps} />);
    expect(screen.queryByText(/golden visions/)).toBeNull();
  });

  it('shows out-of-range message when out of range', () => {
    render(
      <InterventionConfirm
        {...baseProps}
        rangeStatus="out_of_range"
        hexDistance={7}
      />
    );
    expect(screen.getByText(/out of range — move avatar closer/i)).toBeTruthy();
    // Confirm button should be disabled or hidden
    expect(screen.queryByRole('button', { name: /confirm/i })).toBeNull();
  });

  // v7 visual elements
  it('renders sphere and delivery label line above title', () => {
    render(<InterventionConfirm {...baseProps} sphere="mind" deliveryMode="regional" />);
    const line = screen.getByTestId('sphere-delivery-line');
    expect(line).toBeTruthy();
    // Text content before CSS text-transform: lowercase values are in the DOM
    expect(line.textContent).toContain('mind');
    expect(line.textContent).toContain('regional');
  });

  it('applies sphere-bright ring via boxShadow on the panel', () => {
    render(<InterventionConfirm {...baseProps} sphere="mind" />);
    const panel = screen.getByTestId('intervention-panel');
    expect(panel.style.boxShadow).toContain('#44aaff'); // mind sphere color
  });

  it('renders tilts-toward line when agendaNarrativeHook present', () => {
    render(<InterventionConfirm {...baseProps} agendaNarrativeHook="a wound or a debt" />);
    expect(screen.getByText(/tilts toward:/)).toBeTruthy();
    expect(screen.getByText(/a wound or a debt/)).toBeTruthy();
  });
});
