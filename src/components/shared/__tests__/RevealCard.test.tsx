// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RevealCard, REVEAL_CONSEQUENCE_CHIP_MAX } from '../RevealCard';

function sampleConsequences(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `c${i}`, title: `Effect ${i}` }));
}

describe('RevealCard (THR-799)', () => {
  it('renders its zones when open', () => {
    render(
      <RevealCard open onClose={() => {}} aria-label="reveal">
        <RevealCard.Title>A BOND FORMED</RevealCard.Title>
        <RevealCard.Medallion title="Old Steel" />
        <RevealCard.Banner>Old Steel</RevealCard.Banner>
        <RevealCard.Body>A blade carried through three winters.</RevealCard.Body>
        <RevealCard.Dismiss onClick={() => {}} />
      </RevealCard>,
    );

    expect(screen.getByTestId('reveal-title').textContent).toContain('A BOND FORMED');
    expect(screen.getByTestId('reveal-medallion')).toBeTruthy();
    expect(screen.getByTestId('reveal-banner').textContent).toBe('Old Steel');
    expect(screen.getByTestId('reveal-body').textContent).toContain('three winters');
  });

  it('renders nothing when closed', () => {
    render(
      <RevealCard open={false} onClose={() => {}}>
        <RevealCard.Banner>Old Steel</RevealCard.Banner>
      </RevealCard>,
    );
    expect(screen.queryByTestId('reveal-banner')).toBeNull();
  });

  // Zone omission is the plan's core quality rule: a visible zone must be full.
  it.each([
    ['Title', <RevealCard.Title key="t">{null}</RevealCard.Title>, 'reveal-title'],
    ['Banner', <RevealCard.Banner key="b">{null}</RevealCard.Banner>, 'reveal-banner'],
    ['Body', <RevealCard.Body key="y">{null}</RevealCard.Body>, 'reveal-body'],
  ])('omits an empty %s zone entirely', (_label, node, testId) => {
    render(<RevealCard.Frame>{node}</RevealCard.Frame>);
    expect(screen.queryByTestId(testId)).toBeNull();
  });

  it('omits the Consequences zone rather than printing an empty (0) row', () => {
    render(
      <RevealCard.Frame>
        <RevealCard.Consequences label="What follows" items={[]} />
      </RevealCard.Frame>,
    );
    expect(screen.queryByTestId('reveal-consequences')).toBeNull();
  });

  it('shows the true total in the label even when chips overflow', () => {
    const total = REVEAL_CONSEQUENCE_CHIP_MAX + 3;
    render(
      <RevealCard.Frame>
        <RevealCard.Consequences label="What follows" items={sampleConsequences(total)} />
      </RevealCard.Frame>,
    );
    expect(screen.getByTestId('reveal-consequences').textContent).toContain(`(${total})`);
  });

  it('caps chips at REVEAL_CONSEQUENCE_CHIP_MAX and collapses the rest into +N', () => {
    const overflow = 3;
    const total = REVEAL_CONSEQUENCE_CHIP_MAX + overflow;
    render(
      <RevealCard.Frame>
        <RevealCard.Consequences label="What follows" items={sampleConsequences(total)} />
      </RevealCard.Frame>,
    );
    // capped chips + one overflow chip
    expect(screen.getAllByTestId('medallion')).toHaveLength(REVEAL_CONSEQUENCE_CHIP_MAX + 1);
    expect(screen.getByTestId('reveal-consequences').textContent).toContain(`+${overflow}`);
  });

  it('renders no overflow chip when the item count fits', () => {
    render(
      <RevealCard.Frame>
        <RevealCard.Consequences label="What follows" items={sampleConsequences(REVEAL_CONSEQUENCE_CHIP_MAX)} />
      </RevealCard.Frame>,
    );
    expect(screen.getAllByTestId('medallion')).toHaveLength(REVEAL_CONSEQUENCE_CHIP_MAX);
    expect(screen.getByTestId('reveal-consequences').textContent).not.toContain('+');
  });

  it('fires onClick from the dismiss button', () => {
    const onClick = vi.fn();
    render(<RevealCard.Frame><RevealCard.Dismiss onClick={onClick} /></RevealCard.Frame>);
    fireEvent.click(screen.getByTestId('reveal-dismiss'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Frame embeds the zone stack without portaling a modal (no nested modals)', () => {
    const { container } = render(
      <RevealCard.Frame>
        <RevealCard.Banner>Old Steel</RevealCard.Banner>
      </RevealCard.Frame>,
    );
    // Rendered in place, not into document.body via a portal.
    expect(container.querySelector('[data-testid="reveal-card-frame"]')).toBeTruthy();
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
  });

  // Regression: the dismiss used to sit inside the scrolling zone stack, so a tall
  // reveal (e.g. the beat-unlock card row) pushed its own button past the panel edge.
  it('pins Dismiss outside the scrolling zone stack', () => {
    render(
      <RevealCard open onClose={() => {}}>
        <RevealCard.Banner>Old Steel</RevealCard.Banner>
        <RevealCard.Dismiss onClick={() => {}} />
      </RevealCard>,
    );
    const frame = document.querySelector('[data-testid="reveal-card-frame"]')!;
    const dismiss = document.querySelector('[data-testid="reveal-dismiss"]')!;
    expect(frame).toBeTruthy();
    expect(dismiss).toBeTruthy();
    expect(frame.contains(dismiss)).toBe(false);
  });

  it('still renders the other zones inside the frame', () => {
    render(
      <RevealCard open onClose={() => {}}>
        <RevealCard.Banner>Old Steel</RevealCard.Banner>
        <RevealCard.Dismiss onClick={() => {}} />
      </RevealCard>,
    );
    const frame = document.querySelector('[data-testid="reveal-card-frame"]')!;
    expect(frame.contains(document.querySelector('[data-testid="reveal-banner"]'))).toBe(true);
  });

  it('applies the ceremonial frame to the modal panel', () => {
    render(
      <RevealCard open onClose={() => {}}>
        <RevealCard.Banner>Old Steel</RevealCard.Banner>
      </RevealCard>,
    );
    expect(document.querySelector('.frame-ceremonial')).toBeTruthy();
  });
});
