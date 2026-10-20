// @vitest-environment jsdom
/**
 * ChoiceSetModal on the S tier (THR-1880, Law 57). The browser has no one-call
 * lever for a choice set, so its dialog evidence is this render: an S `Modal`
 * panel, every option shown whole (no scroll box of its own), and Escape defers.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoiceSetModal } from '../ChoiceSetModal';
import type { PendingChoiceData } from '../../../engine/effectExecutors';

const pending: PendingChoiceData = {
  choiceId: 'choice.test',
  actorId: 'agent.1',
  sourceId: 'source.1',
  timeoutMs: 0,
  options: [
    { id: 'a', label: 'Spare the bridge', description: 'The toll keeper keeps his post.', consequences: [] },
    { id: 'b', label: 'Burn the bridge', description: 'No one crosses before the thaw.', consequences: [] },
    { id: 'c', label: 'Wait', description: 'The river decides.', consequences: [] },
  ],
};

describe('ChoiceSetModal (THR-1880)', () => {
  it('draws its panel at the S tier with every option visible', () => {
    render(<ChoiceSetModal pending={pending} onResolve={vi.fn()} onDismiss={vi.fn()} />);
    const panel = screen.getByText('A choice presents itself.').closest('[data-dialog-size]') as HTMLElement;
    expect(panel.getAttribute('data-dialog-size')).toBe('s');
    for (const o of pending.options) expect(screen.getByText(o.label)).toBeInTheDocument();
    // The old free width is gone.
    expect(panel.style.width).not.toContain('32rem');
  });

  it('Escape defers, like the Defer button', () => {
    const onDismiss = vi.fn();
    render(<ChoiceSetModal pending={pending} onResolve={vi.fn()} onDismiss={onDismiss} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('commits the picked option', () => {
    const onResolve = vi.fn();
    render(<ChoiceSetModal pending={pending} onResolve={onResolve} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByText('Burn the bridge'));
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));
    expect(onResolve).toHaveBeenCalledWith('choice.test', 'b');
  });
});
