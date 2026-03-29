// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentDetailView } from '../AttachmentDetailView';
import type { AttachmentDetailData } from '../AttachmentDetailView';

const basePossession: AttachmentDetailData = {
  id: 'item.1',
  name: "Ashenmane's Fang",
  subcategory: 'arms',
  tier: 2,
  mechanicalSummary: '+Iron in open terrain',
  flavorText: 'Won in a border raid. Still bites strangers.',
  tags: ['weapon', 'iron', 'mount'],
  lossCondition: 'breakable',
  source: 'Battle of the Ash Ford',
};

const transientCondition: AttachmentDetailData = {
  id: 'cond.1',
  name: 'Bruised Ribs',
  subcategory: 'wound',
  tier: 1,
  mechanicalSummary: '-Iron (minor)',
  tags: ['wound'],
  ticksRemaining: 8,
  totalTicks: 20,
};

const triggeredItem: AttachmentDetailData = {
  id: 'item.2',
  name: 'Cursed Blade',
  subcategory: 'arms',
  tier: 3,
  mechanicalSummary: '+Iron, +Shadow',
  tags: ['weapon', 'cursed'],
  onUseTriggers: [{
    triggerCondition: 'critical_failure',
    probability: 0.10,
    effect: { type: 'remove_possession' },
    narrativeTemplate: 'The blade shatters against the shield...',
  }],
};

describe('AttachmentDetailView', () => {
  it('renders attachment name in header', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText("Ashenmane's Fang")).toBeTruthy();
  });

  it('renders tier and subcategory subtitle', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText(/Storied/)).toBeTruthy();
  });

  it('renders flavor text as italic prose', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText('Won in a border raid. Still bites strangers.')).toBeTruthy();
  });

  it('renders effect section with mechanical summary', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText(/\+Iron in open terrain/)).toBeTruthy();
  });

  it('renders loss condition in effect section', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText(/Loss: breakable/)).toBeTruthy();
  });

  it('renders tags as keyword cloud', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText('weapon')).toBeTruthy();
    expect(screen.getByText('iron')).toBeTruthy();
  });

  it('renders source section', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.getByText('Battle of the Ash Ford')).toBeTruthy();
  });

  it('renders duration section for transient conditions', () => {
    render(<AttachmentDetailView attachment={transientCondition} onBack={vi.fn()} />);
    expect(screen.getByText('8 / 20 ticks')).toBeTruthy();
  });

  it('does not render duration section for permanent items', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    const text = screen.queryByText(/ticks$/);
    expect(text).toBeNull();
  });

  it('renders triggers section when triggers exist', () => {
    render(<AttachmentDetailView attachment={triggeredItem} onBack={vi.fn()} />);
    expect(screen.getByTestId('trigger-block')).toBeTruthy();
    expect(screen.getByText(/Critical failure/)).toBeTruthy();
  });

  it('does not render triggers section when no triggers', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    expect(screen.queryByTestId('trigger-block')).toBeNull();
  });

  it('renders glyph fallback when no image', () => {
    render(<AttachmentDetailView attachment={basePossession} onBack={vi.fn()} />);
    // Arms glyph ⚔
    expect(screen.getByText('\u2694')).toBeTruthy();
  });

  it('renders image when provided', () => {
    const withImage = { ...basePossession, image: '/art/fang.png' };
    render(<AttachmentDetailView attachment={withImage} onBack={vi.fn()} />);
    const img = screen.getByAltText("Ashenmane's Fang");
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/art/fang.png');
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<AttachmentDetailView attachment={basePossession} onBack={onBack} />);
    fireEvent.click(screen.getByLabelText('close'));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
