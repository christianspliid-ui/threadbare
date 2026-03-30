// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListRow } from '../ListRow';

describe('ListRow', () => {
  it('renders children', () => {
    render(<ListRow>Hello</ListRow>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders Title compound component', () => {
    render(<ListRow><ListRow.Title>Agent Name</ListRow.Title></ListRow>);
    expect(screen.getByText('Agent Name')).toBeInTheDocument();
  });

  it('renders Subtitle compound component', () => {
    render(<ListRow><ListRow.Subtitle>Location</ListRow.Subtitle></ListRow>);
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('renders Leading compound component', () => {
    render(<ListRow><ListRow.Leading><span data-testid="lead">●</span></ListRow.Leading></ListRow>);
    expect(screen.getByTestId('lead')).toBeInTheDocument();
  });

  it('fires onClick', () => {
    const fn = vi.fn();
    render(<ListRow onClick={fn}>Click me</ListRow>);
    fireEvent.click(screen.getByText('Click me').closest('[role="button"]')!);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('has role=button when interactive', () => {
    render(<ListRow onClick={() => {}}>Row</ListRow>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has no role when not interactive', () => {
    render(<ListRow>Row</ListRow>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('responds to Enter key', () => {
    const fn = vi.fn();
    render(<ListRow onClick={fn}>Row</ListRow>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('responds to Space key', () => {
    const fn = vi.fn();
    render(<ListRow onClick={fn}>Row</ListRow>);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('applies accent color as left border', () => {
    render(<ListRow accentColor="#ff4444">Row</ListRow>);
    const row = screen.getByText('Row').closest('.interactive-row') as HTMLElement;
    expect(row.style.borderLeft).toMatch(/3px solid (rgb\(255, 68, 68\)|#ff4444)/);
  });

  it('applies selected styling', () => {
    render(<ListRow selected>Row</ListRow>);
    const row = screen.getByText('Row').closest('.interactive-row') as HTMLElement;
    expect(row.style.backgroundColor).toBe('var(--accent-gold-glow)');
  });

  it('renders trailing element', () => {
    render(<ListRow trailing={<span data-testid="trail">👁</span>}>Row</ListRow>);
    expect(screen.getByTestId('trail')).toBeInTheDocument();
  });

  it('stops propagation on trailing click', () => {
    const rowClick = vi.fn();
    const trailClick = vi.fn();
    render(
      <ListRow onClick={rowClick} trailing={<button onClick={trailClick}>Eye</button>}>
        Row
      </ListRow>,
    );
    fireEvent.click(screen.getByText('Eye'));
    expect(trailClick).toHaveBeenCalledOnce();
    expect(rowClick).not.toHaveBeenCalled();
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<ListRow ref={ref}>Row</ListRow>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
