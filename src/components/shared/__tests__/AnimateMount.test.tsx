// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnimateMount } from '../AnimateMount';

describe('AnimateMount', () => {
  it('renders children when show is true', () => {
    render(
      <AnimateMount show={true} animation="anim-fade">
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not render children when show is false and never was true', () => {
    render(
      <AnimateMount show={false} animation="anim-fade">
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('applies enter class when show becomes true', async () => {
    const { container } = render(
      <AnimateMount show={true} animation="anim-fade">
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains('anim-fade-enter')).toBe(true);
  });

  it('applies exit class when show becomes false', async () => {
    const { container, rerender } = render(
      <AnimateMount show={true} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    rerender(
      <AnimateMount show={false} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains('anim-fade-exit')).toBe(true);
  });

  it('removes children from DOM after exit duration', async () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <AnimateMount show={true} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    rerender(
      <AnimateMount show={false} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('handles rapid show toggle without breaking', async () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <AnimateMount show={true} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    rerender(
      <AnimateMount show={false} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    rerender(
      <AnimateMount show={true} animation="anim-fade" duration={100}>
        <div data-testid="child">Hello</div>
      </AnimateMount>
    );
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId('child')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
