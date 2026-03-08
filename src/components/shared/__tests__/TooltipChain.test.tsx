// @vitest-environment jsdom
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tooltip } from '../Tooltip';

describe('Tooltip linked chains', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders {{concept.id}} markers as underlined text', () => {
    render(
      <Tooltip label="Test" desc="Influenced by {{sphere.force}} power">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const tooltip = screen.getByRole('tooltip');
    const underlined = tooltip.querySelector('[data-tooltip-link]');
    expect(underlined).toBeInTheDocument();
    expect(underlined?.textContent).toBeTruthy();
  });

  it('spawns child tooltip when hovering a linked concept', () => {
    render(
      <Tooltip label="Test" desc="See {{ui.doom_bar}} for details">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const link = screen.getByRole('tooltip').querySelector('[data-tooltip-link]');
    expect(link).toBeInTheDocument();
    fireEvent.pointerEnter(link!);
    act(() => { vi.advanceTimersByTime(200); });

    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips.length).toBe(2);
    // Should have at least one "Doom Clock" in the tooltips
    const doomClockElements = screen.getAllByText('Doom Clock');
    expect(doomClockElements.length).toBeGreaterThanOrEqual(1);
  });

  it('does not spawn tooltips beyond max depth', () => {
    render(
      <Tooltip label="Test" desc="See {{ui.doom_bar}}" depth={2}>
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const tooltip = screen.getByRole('tooltip');
    const links = tooltip.querySelectorAll('[data-tooltip-link]');
    expect(links.length).toBe(0);
  });

  it('renders unresolvable {{markers}} as plain text', () => {
    render(
      <Tooltip label="Test" desc="See {{nonexistent.thing}} here">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const tooltip = screen.getByRole('tooltip');
    const links = tooltip.querySelectorAll('[data-tooltip-link]');
    expect(links.length).toBe(0);
    // Check that the raw marker text appears in the description
    expect(tooltip.textContent).toContain('{{nonexistent.thing}}');
  });

  it('renders mixed content with text and links correctly', () => {
    render(
      <Tooltip
        label="Complex"
        desc="The {{sphere.force}} and {{sphere.chaos}} clash here"
      >
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const tooltip = screen.getByRole('tooltip');
    const links = tooltip.querySelectorAll('[data-tooltip-link]');
    expect(links.length).toBe(2);
    expect(tooltip.textContent).toContain('The');
    expect(tooltip.textContent).toContain('and');
    expect(tooltip.textContent).toContain('clash here');
  });

  it('applies amber-400 color to linked concepts', () => {
    render(
      <Tooltip label="Test" desc="See {{ui.doom_bar}} here">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const link = screen.getByRole('tooltip').querySelector('[data-tooltip-link]');
    expect(link).toHaveStyle('color: #fbbf24');
    expect(link).toHaveStyle('text-decoration: underline');
    expect(link).toHaveStyle('cursor: pointer');
  });

  it('preserves text before first link', () => {
    render(
      <Tooltip label="Test" desc="Start here: {{ui.doom_bar}} is important">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toContain('Start here:');
  });

  it('preserves text after last link', () => {
    render(
      <Tooltip label="Test" desc="See {{ui.doom_bar}} for details today">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toContain('for details today');
  });

  it('handles consecutive links without text between', () => {
    render(
      <Tooltip label="Test" desc="{{sphere.force}}{{sphere.chaos}}">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const tooltip = screen.getByRole('tooltip');
    const links = tooltip.querySelectorAll('[data-tooltip-link]');
    expect(links.length).toBe(2);
  });

  it('allows nested tooltip to stay visible when moving pointer from parent to child', () => {
    render(
      <Tooltip label="Parent" desc="Click {{ui.doom_bar}} link">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const parentTooltip = screen.getByRole('tooltip');
    expect(parentTooltip).toBeInTheDocument();

    const link = parentTooltip.querySelector('[data-tooltip-link]');
    fireEvent.pointerEnter(link!);
    act(() => { vi.advanceTimersByTime(200); });

    // Both tooltips should exist
    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips.length).toBe(2);

    // Parent tooltip should still be visible (pointerEvents: auto)
    expect(parentTooltip).toBeInTheDocument();
  });

  it('depth 0 allows links to depth 1', () => {
    render(
      <Tooltip label="Depth0" desc="See {{ui.doom_bar}}" depth={0}>
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const link = screen.getByRole('tooltip').querySelector('[data-tooltip-link]');
    expect(link).toBeInTheDocument();
  });

  it('depth 1 allows links to depth 2', () => {
    render(
      <Tooltip label="Depth1" desc="See {{ui.doom_bar}}" depth={1}>
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const link = screen.getByRole('tooltip').querySelector('[data-tooltip-link]');
    expect(link).toBeInTheDocument();
  });

  it('resolves correct label from concept ID', () => {
    render(
      <Tooltip label="Test" desc="The {{sphere.force}} is power">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const link = screen.getByRole('tooltip').querySelector('[data-tooltip-link]');
    // sphere.force should resolve to "Force"
    expect(link?.textContent).toBe('Force');
  });

  it('renders description with no links unchanged', () => {
    render(
      <Tooltip label="Test" desc="Plain text description without links">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toContain('Plain text description without links');
    const links = tooltip.querySelectorAll('[data-tooltip-link]');
    expect(links.length).toBe(0);
  });

  it('handles description with only marker, no surrounding text', () => {
    render(
      <Tooltip label="Test" desc="{{ui.doom_bar}}">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => { vi.advanceTimersByTime(200); });

    const tooltip = screen.getByRole('tooltip');
    const link = tooltip.querySelector('[data-tooltip-link]');
    expect(link).toBeInTheDocument();
    expect(link?.textContent).toBe('Doom Clock');
  });
});
