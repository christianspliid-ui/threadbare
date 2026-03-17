// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastStack } from '../ToastStack';
import type { ToastItem } from '../../../types/notification';

const baseToast: ToastItem = {
  id: 'toast.1',
  message: 'A warrior claims new land',
  count: 1,
  createdTick: 1,
  expiresAt: Date.now() + 10000,
};

describe('ToastStack — actorId click-through', () => {
  it('calls onDismiss when toast without actorId is clicked', () => {
    const onDismiss = vi.fn();
    render(<ToastStack toasts={[baseToast]} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('status'));
    expect(onDismiss).toHaveBeenCalledWith('toast.1');
  });

  it('calls onSelectAgent when toast with actorId is clicked', () => {
    const onDismiss = vi.fn();
    const onSelectAgent = vi.fn();
    const linkedToast: ToastItem = { ...baseToast, actorId: 'actor.warrior' };
    render(<ToastStack toasts={[linkedToast]} onDismiss={onDismiss} onSelectAgent={onSelectAgent} />);
    fireEvent.click(screen.getByRole('status'));
    expect(onSelectAgent).toHaveBeenCalledWith('actor.warrior');
    expect(onDismiss).toHaveBeenCalledWith('toast.1');
  });

  it('does not call onSelectAgent if onSelectAgent prop is absent', () => {
    const onDismiss = vi.fn();
    const linkedToast: ToastItem = { ...baseToast, actorId: 'actor.warrior' };
    render(<ToastStack toasts={[linkedToast]} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('status'));
    expect(onDismiss).toHaveBeenCalledWith('toast.1');
  });

  it('renders arrow indicator when actorId + onSelectAgent present', () => {
    const linkedToast: ToastItem = { ...baseToast, actorId: 'actor.warrior' };
    render(<ToastStack toasts={[linkedToast]} onDismiss={vi.fn()} onSelectAgent={vi.fn()} />);
    // The → indicator should be in the DOM
    expect(screen.getByText('→')).toBeTruthy();
  });
});
