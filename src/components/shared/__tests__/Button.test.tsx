// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button variant="secondary">Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders with icon + children', () => {
    render(<Button variant="secondary" icon={<span data-testid="ico">★</span>}>Action</Button>);
    expect(screen.getByTestId('ico')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('fires onClick', () => {
    const fn = vi.fn();
    render(<Button variant="secondary" onClick={fn}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', () => {
    const fn = vi.fn();
    render(<Button variant="secondary" disabled onClick={fn}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('does not fire onClick when loading', () => {
    const fn = vi.fn();
    render(<Button variant="secondary" loading onClick={fn}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('applies disabled opacity', () => {
    render(<Button variant="secondary" disabled>No</Button>);
    expect(screen.getByRole('button')).toHaveStyle({ opacity: '0.4' });
  });

  it('applies full width', () => {
    render(<Button variant="secondary" fullWidth>Wide</Button>);
    expect(screen.getByRole('button')).toHaveStyle({ width: '100%' });
  });

  it('renders primary variant with gold background', () => {
    render(<Button variant="primary">Confirm</Button>);
    expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: 'var(--accent-gold)' });
  });

  it('renders ghost variant with transparent background', () => {
    render(<Button variant="ghost">X</Button>);
    const bg = screen.getByRole('button').style.backgroundColor;
    expect(bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)').toBe(true);
  });

  it('renders danger variant', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveStyle({ color: 'var(--negative)' });
  });

  it('applies size sm height', () => {
    render(<Button variant="secondary" size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveStyle({ height: '28px' });
  });

  it('applies size lg height', () => {
    render(<Button variant="secondary" size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveStyle({ height: '44px' });
  });

  it('adds animate-breathe class when loading', () => {
    render(<Button variant="secondary" loading>Wait</Button>);
    expect(screen.getByRole('button')).toHaveClass('animate-breathe');
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button variant="secondary" ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
