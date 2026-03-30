// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeading } from '../SectionHeading';

describe('SectionHeading', () => {
  it('renders label text', () => {
    render(<SectionHeading>Retinue</SectionHeading>);
    expect(screen.getByText('Retinue')).toBeInTheDocument();
  });

  it('renders with count', () => {
    render(<SectionHeading count={3}>Retinue</SectionHeading>);
    expect(screen.getByText(/Retinue/)).toHaveTextContent('Retinue (3)');
  });

  it('renders as h3 by default', () => {
    render(<SectionHeading>Test</SectionHeading>);
    expect(screen.getByText('Test').tagName).toBe('H3');
  });

  it('renders as custom element', () => {
    render(<SectionHeading as="h2">Test</SectionHeading>);
    expect(screen.getByText('Test').tagName).toBe('H2');
  });

  it('applies section-heading class', () => {
    render(<SectionHeading>Test</SectionHeading>);
    expect(screen.getByText('Test')).toHaveClass('section-heading');
  });

  it('renders count of 0', () => {
    render(<SectionHeading count={0}>Empty</SectionHeading>);
    expect(screen.getByText(/Empty/)).toHaveTextContent('Empty (0)');
  });
});
