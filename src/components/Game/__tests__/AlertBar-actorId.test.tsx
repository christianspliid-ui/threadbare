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
  it('does NOT dismiss on left-click (alerts persist as bookmarks)', () => {
    const onDismiss = vi.fn();
    render(<AlertBar alerts={[baseAlert]} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('listitem'));
    // Alerts no longer auto-dismiss on left-click — use right-click to dismiss
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('calls onSelectAgent when alert with actorId is clicked (without dismissing)', () => {
    const onDismiss = vi.fn();
    const onSelectAgent = vi.fn();
    const linkedAlert: AlertItem = { ...baseAlert, actorId: 'actor.warrior' };
    render(<AlertBar alerts={[linkedAlert]} onDismiss={onDismiss} onSelectAgent={onSelectAgent} />);
    fireEvent.click(screen.getByRole('listitem'));
    expect(onSelectAgent).toHaveBeenCalledWith('actor.warrior');
    // No dismiss on left-click
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('does not call onSelectAgent if onSelectAgent prop is absent', () => {
    const onDismiss = vi.fn();
    const linkedAlert: AlertItem = { ...baseAlert, actorId: 'actor.warrior' };
    render(<AlertBar alerts={[linkedAlert]} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('listitem'));
    // No dismiss, no agent select
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('includes navigation hint in aria-label when actorId linked', () => {
    const linkedAlert: AlertItem = { ...baseAlert, actorId: 'actor.warrior' };
    render(<AlertBar alerts={[linkedAlert]} onDismiss={vi.fn()} onSelectAgent={vi.fn()} />);
    const btn = screen.getByRole('listitem');
    expect(btn.getAttribute('aria-label')).toContain('click to navigate');
  });

  it('dismisses on right-click', () => {
    const onDismiss = vi.fn();
    render(<AlertBar alerts={[baseAlert]} onDismiss={onDismiss} />);
    fireEvent.contextMenu(screen.getByRole('listitem'));
    // Right-click triggers dismiss after 150ms fade, but the callback is in a setTimeout
    // The dismiss is triggered via setTimeout, so we need to advance timers
    vi.useFakeTimers();
    fireEvent.contextMenu(screen.getByRole('listitem'));
    vi.advanceTimersByTime(200);
    expect(onDismiss).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('navigates via navigationTarget when present', () => {
    const onNavigate = vi.fn();
    const alertWithNav: AlertItem = {
      ...baseAlert,
      navigationTarget: { kind: 'agent', agentId: 'actor.warrior' },
    };
    render(<AlertBar alerts={[alertWithNav]} onDismiss={vi.fn()} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('listitem'));
    expect(onNavigate).toHaveBeenCalledWith({ kind: 'agent', agentId: 'actor.warrior' });
  });
});
