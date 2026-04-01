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

describe('ToastStack — visibility cap', () => {
  it('renders at most 6 toasts when given more than 6', () => {
    const manyToasts: ToastItem[] = Array.from({ length: 9 }, (_, i) => ({
      id: `toast.${i + 1}`,
      message: `Message ${i + 1}`,
      count: 1,
      createdTick: i + 1,
      expiresAt: Date.now() + 10000,
    }));
    render(<ToastStack toasts={manyToasts} onDismiss={vi.fn()} />);
    expect(screen.getAllByRole('status')).toHaveLength(6);
  });

  it('shows the 6 newest toasts (last in array)', () => {
    const manyToasts: ToastItem[] = Array.from({ length: 8 }, (_, i) => ({
      id: `toast.${i + 1}`,
      message: `Message ${i + 1}`,
      count: 1,
      createdTick: i + 1,
      expiresAt: Date.now() + 10000,
    }));
    render(<ToastStack toasts={manyToasts} onDismiss={vi.fn()} />);
    // Oldest 2 (Message 1, Message 2) should not be visible
    expect(screen.queryByText('Message 1')).toBeNull();
    expect(screen.queryByText('Message 2')).toBeNull();
    // Newest 6 should all be visible
    for (let i = 3; i <= 8; i++) {
      expect(screen.getByText(`Message ${i}`)).toBeTruthy();
    }
  });

  it('renders all toasts when 6 or fewer are given', () => {
    const fewToasts: ToastItem[] = Array.from({ length: 4 }, (_, i) => ({
      id: `toast.${i + 1}`,
      message: `Message ${i + 1}`,
      count: 1,
      createdTick: i + 1,
      expiresAt: Date.now() + 10000,
    }));
    render(<ToastStack toasts={fewToasts} onDismiss={vi.fn()} />);
    expect(screen.getAllByRole('status')).toHaveLength(4);
  });
});
