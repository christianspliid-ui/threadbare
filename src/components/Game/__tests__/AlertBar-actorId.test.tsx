// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertBar } from '../AlertBar';
import type { AlertItem } from '../../../types/notification';

const baseAlert: AlertItem = {
  id: 'alert.1',
  icon: 'dilemma',
  message: 'A warrior abandoned their quest',
  sourceEventId: 'evt.1',
  tick: 15,
};

describe('AlertBar — actorId click-through', () => {
  it('calls onDismiss when alert without actorId is clicked', () => {
    const onDismiss = vi.fn();
    render(<AlertBar alerts={[baseAlert]} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('listitem'));
    expect(onDismiss).toHaveBeenCalledWith('alert.1');
  });

  it('calls onSelectAgent when alert with actorId is clicked', () => {
    const onDismiss = vi.fn();
    const onSelectAgent = vi.fn();
    const linkedAlert: AlertItem = { ...baseAlert, actorId: 'actor.warrior' };
    render(<AlertBar alerts={[linkedAlert]} onDismiss={onDismiss} onSelectAgent={onSelectAgent} />);
    fireEvent.click(screen.getByRole('listitem'));
    expect(onSelectAgent).toHaveBeenCalledWith('actor.warrior');
    expect(onDismiss).toHaveBeenCalledWith('alert.1');
  });

  it('does not call onSelectAgent if onSelectAgent prop is absent', () => {
    const onDismiss = vi.fn();
    const linkedAlert: AlertItem = { ...baseAlert, actorId: 'actor.warrior' };
    render(<AlertBar alerts={[linkedAlert]} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('listitem'));
    expect(onDismiss).toHaveBeenCalledWith('alert.1');
  });

  it('includes agent navigation hint in aria-label when actorId linked', () => {
    const linkedAlert: AlertItem = { ...baseAlert, actorId: 'actor.warrior' };
    render(<AlertBar alerts={[linkedAlert]} onDismiss={vi.fn()} onSelectAgent={vi.fn()} />);
    const btn = screen.getByRole('listitem');
    expect(btn.getAttribute('aria-label')).toContain('click to view agent');
  });
});
