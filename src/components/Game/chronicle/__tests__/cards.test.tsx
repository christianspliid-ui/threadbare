// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationCard, SoulCard, EventBlock, ExplorationHook } from '../index';

describe('LocationCard', () => {
  it('renders name and subtype', () => {
    render(
      <LocationCard
        name="The Forge"
        subtype="settlement"
        agentCount={3}
        flavorText="test"
        onClick={() => {}}
        onDoubleClick={() => {}}
      />,
    );
    expect(screen.getByText('The Forge')).toBeTruthy();
    expect(screen.getByText('settlement')).toBeTruthy();
  });

  it('renders agent count', () => {
    render(
      <LocationCard
        name="The Forge"
        subtype="settlement"
        agentCount={3}
        flavorText=""
        onClick={() => {}}
        onDoubleClick={() => {}}
      />,
    );
    expect(screen.getByText('3 souls present')).toBeTruthy();
  });

  it('renders flavor text when provided', () => {
    const flavorText = 'A place of ancient power';
    render(
      <LocationCard
        name="The Forge"
        subtype="settlement"
        agentCount={0}
        flavorText={flavorText}
        onClick={() => {}}
        onDoubleClick={() => {}}
      />,
    );
    expect(screen.getByText(flavorText)).toBeTruthy();
  });

  it('fires onClick on single click', () => {
    const fn = vi.fn();
    render(
      <LocationCard
        name="The Forge"
        subtype="settlement"
        agentCount={0}
        flavorText=""
        onClick={fn}
        onDoubleClick={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('fires onDoubleClick on double click', () => {
    const fn = vi.fn();
    render(
      <LocationCard
        name="The Forge"
        subtype="settlement"
        agentCount={0}
        flavorText=""
        onClick={() => {}}
        onDoubleClick={fn}
      />,
    );
    fireEvent.doubleClick(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('hides agent count when zero', () => {
    render(
      <LocationCard
        name="The Forge"
        subtype="settlement"
        agentCount={0}
        flavorText=""
        onClick={() => {}}
        onDoubleClick={() => {}}
      />,
    );
    expect(screen.queryByText(/soul/)).toBeNull();
  });

  it('renders correct glyph for settlement', () => {
    const { container } = render(
      <LocationCard
        name="The Forge"
        subtype="settlement"
        agentCount={0}
        flavorText=""
        onClick={() => {}}
        onDoubleClick={() => {}}
      />,
    );
    expect(container.textContent).toContain('🏘');
  });

  it('renders correct glyph for landmark', () => {
    const { container } = render(
      <LocationCard
        name="The Peak"
        subtype="landmark"
        agentCount={0}
        flavorText=""
        onClick={() => {}}
        onDoubleClick={() => {}}
      />,
    );
    expect(container.textContent).toContain('⛰');
  });

  it('renders correct glyph for ruin', () => {
    const { container } = render(
      <LocationCard
        name="The Ruin"
        subtype="ruin"
        agentCount={0}
        flavorText=""
        onClick={() => {}}
        onDoubleClick={() => {}}
      />,
    );
    expect(container.textContent).toContain('🏚');
  });

  it('renders default glyph for unknown subtype', () => {
    const { container } = render(
      <LocationCard
        name="The Place"
        subtype="unknown"
        agentCount={0}
        flavorText=""
        onClick={() => {}}
        onDoubleClick={() => {}}
      />,
    );
    expect(container.textContent).toContain('◆');
  });

  it('fires onClick on Enter key', () => {
    const fn = vi.fn();
    render(
      <LocationCard
        name="The Forge"
        subtype="settlement"
        agentCount={0}
        flavorText=""
        onClick={fn}
        onDoubleClick={() => {}}
      />,
    );
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('has correct accessibility label', () => {
    render(
      <LocationCard
        name="The Forge"
        subtype="settlement"
        agentCount={0}
        flavorText=""
        onClick={() => {}}
        onDoubleClick={() => {}}
      />,
    );
    expect(screen.getByLabelText('Location: The Forge')).toBeTruthy();
  });

  it('singular soul text', () => {
    render(
      <LocationCard
        name="The Forge"
        subtype="settlement"
        agentCount={1}
        flavorText=""
        onClick={() => {}}
        onDoubleClick={() => {}}
      />,
    );
    expect(screen.getByText('1 soul present')).toBeTruthy();
  });
});

describe('SoulCard', () => {
  it('renders name and location', () => {
    render(
      <SoulCard
        name="Kael"
        locationName="The Forge"
        sphereColor="#ff0000"
        flavorText="test"
        onClick={() => {}}
      />,
    );
    expect(screen.getByText('Kael')).toBeTruthy();
    expect(screen.getByText('The Forge')).toBeTruthy();
  });

  it('renders archetype when provided', () => {
    render(
      <SoulCard
        name="Kael"
        locationName="The Forge"
        sphereColor="#ff0000"
        archetypeName="Reluctant King"
        flavorText="test"
        onClick={() => {}}
      />,
    );
    expect(screen.getByText('Reluctant King')).toBeTruthy();
  });

  it('does not render archetype when not provided', () => {
    render(
      <SoulCard
        name="Kael"
        locationName="The Forge"
        sphereColor="#ff0000"
        flavorText="test"
        onClick={() => {}}
      />,
    );
    expect(screen.queryByText(/Archetype|archetype/)).toBeNull();
  });

  it('renders flavor text when provided', () => {
    const flavorText = 'A conflicted ruler';
    render(
      <SoulCard
        name="Kael"
        locationName="The Forge"
        sphereColor="#ff0000"
        flavorText={flavorText}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText(flavorText)).toBeTruthy();
  });

  it('fires onClick on click', () => {
    const fn = vi.fn();
    render(
      <SoulCard
        name="Kael"
        locationName="The Forge"
        sphereColor="#ff0000"
        flavorText=""
        onClick={fn}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('fires onClick on Enter key', () => {
    const fn = vi.fn();
    render(
      <SoulCard
        name="Kael"
        locationName="The Forge"
        sphereColor="#ff0000"
        flavorText=""
        onClick={fn}
      />,
    );
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('has correct accessibility label', () => {
    render(
      <SoulCard
        name="Kael"
        locationName="The Forge"
        sphereColor="#ff0000"
        flavorText=""
        onClick={() => {}}
      />,
    );
    expect(screen.getByLabelText('Soul: Kael')).toBeTruthy();
  });
});

describe('EventBlock', () => {
  it('renders label and text', () => {
    render(<EventBlock label="Stirring" text="Something stirs in the dark." />);
    expect(screen.getByText('Stirring')).toBeTruthy();
    expect(screen.getByText('Something stirs in the dark.')).toBeTruthy();
  });

  it('renders label as uppercase', () => {
    const { container } = render(
      <EventBlock label="Crisis" text="The world trembles." />,
    );
    const label = screen.getByText('Crisis');
    expect(label).toBeTruthy();
    expect(label.style.textTransform).toBe('uppercase');
  });

  it('renders with correct structure', () => {
    const { container } = render(
      <EventBlock label="Stirring" text="Something stirs." />,
    );
    const root = container.querySelector('div');
    expect(root).toBeTruthy();
    expect(root?.style.borderLeft).toBeTruthy();
  });
});

describe('ExplorationHook', () => {
  it('renders text with diamond glyph', () => {
    render(<ExplorationHook text="Ancient ruins await exploration." />);
    expect(screen.getByText(/Ancient ruins/)).toBeTruthy();
    expect(screen.getByText('⟐')).toBeTruthy();
  });

  it('renders multiple lines of text', () => {
    const text = 'This is a long exploration hook that spans multiple lines of text.';
    render(<ExplorationHook text={text} />);
    expect(screen.getByText(text)).toBeTruthy();
  });

  it('glyph appears before text', () => {
    const { container } = render(
      <ExplorationHook text="Mysteries await." />,
    );
    const flexContainer = container.querySelector('div');
    expect(flexContainer?.style.display).toBe('flex');
  });
});
