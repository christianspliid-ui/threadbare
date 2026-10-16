// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RivalIcon } from '../RivalIcon';

describe('RivalIcon (THR-1906 — sphere marks, Law 9)', () => {
  it('draws one SphereIcon per sphere', () => {
    const { container } = render(<RivalIcon spheres={['force', 'mind']} />);
    expect(container.querySelectorAll('[aria-label="force"], [aria-label="mind"]').length).toBe(2);
  });

  it('limits to a maximum of 3 spheres', () => {
    const { container } = render(
      <RivalIcon spheres={['force', 'mind', 'spirit', 'energy', 'life']} />,
    );
    const root = screen.getByTestId('rival-icon');
    expect(root.children.length).toBe(3);
    expect(container.textContent).not.toContain('●');
  });

  it('draws the fallback mark, not a dot, for an empty list', () => {
    const { container } = render(<RivalIcon spheres={[]} />);
    expect(container.querySelector('[data-icon="fallback"]')).toBeTruthy();
    expect(container.textContent).toBe('');
  });

  it('respects size, className and title', () => {
    render(<RivalIcon spheres={['force']} size="2rem" className="my-icon" title="Rival affinities" />);
    const root = screen.getByTestId('rival-icon');
    expect(root).toHaveClass('my-icon');
    expect(root).toHaveAttribute('title', 'Rival affinities');
    expect(root.getAttribute('style')).toContain('2rem');
  });
});
