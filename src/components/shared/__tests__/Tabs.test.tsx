// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Tabs, resetTabsWarningsForTest } from '../Tabs';

afterEach(() => {
  resetTabsWarningsForTest();
  vi.restoreAllMocks();
});

function Chronicle({ initial = 'now' }: { initial?: string }) {
  const [tab, setTab] = useState(initial);
  return (
    <Tabs kind="tabs" value={tab} onChange={setTab} label="Chronicle">
      <Tabs.Tab value="now" label="Now" />
      <Tabs.Tab value="years" label="Years" />
      <Tabs.Tab value="ledger" label="Ledger" count={{ value: 2, label: '2 new chapters' }} />
      <Tabs.Panel value="now">now panel</Tabs.Panel>
      <Tabs.Panel value="years">years panel</Tabs.Panel>
      <Tabs.Panel value="ledger">ledger panel</Tabs.Panel>
    </Tabs>
  );
}

describe('Tabs kind="tabs"', () => {
  it('is a WAI-ARIA tablist with one selected tab and its panel', () => {
    render(<Chronicle />);
    expect(screen.getByRole('tablist', { name: 'Chronicle' })).toBeInTheDocument();
    const now = screen.getByRole('tab', { name: 'Now' });
    expect(now).toHaveAttribute('aria-selected', 'true');
    expect(now).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Years' })).toHaveAttribute('tabindex', '-1');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('now panel');
    expect(now.getAttribute('aria-controls')).toBe(panel.id);
  });

  it('the count is spoken in the tab name and drawn after the word', () => {
    render(<Chronicle />);
    const ledger = screen.getByRole('tab', { name: 'Ledger, 2 new chapters' });
    expect(ledger.querySelector('[data-chip-role="count"]')).toHaveAttribute('data-count', '2');
  });

  it('arrows, Home and End move focus and selection', () => {
    render(<Chronicle />);
    const now = screen.getByRole('tab', { name: 'Now' });
    now.focus();
    fireEvent.keyDown(now, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Years' })).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Years' }));
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Ledger, 2 new chapters' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Now' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Ledger, 2 new chapters' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Now' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('now panel');
  });

  it('an unknown value selects the first tab and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(
      <Tabs kind="tabs" value="gone" label="Chronicle">
        <Tabs.Tab value="now" label="Now" />
        <Tabs.Tab value="years" label="Years" />
      </Tabs>,
    );
    rerender(
      <Tabs kind="tabs" value="gone" label="Chronicle">
        <Tabs.Tab value="now" label="Now" />
        <Tabs.Tab value="years" label="Years" />
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'Now' })).toHaveAttribute('aria-selected', 'true');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('works uncontrolled from defaultValue', () => {
    render(
      <Tabs label="Chronicle" defaultValue="years">
        <Tabs.Tab value="now" label="Now" />
        <Tabs.Tab value="years" label="Years" />
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'Years' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Now' }));
    expect(screen.getByRole('tab', { name: 'Now' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders nothing with no tabs', () => {
    const { container } = render(<Tabs label="Empty">{null}</Tabs>);
    expect(container.innerHTML).toBe('');
  });
});

describe('Tabs kind="toggle"', () => {
  function Lenses({ allowNone = true }: { allowNone?: boolean }) {
    const [lens, setLens] = useState<string | null>(null);
    return (
      <Tabs kind="toggle" value={lens} onChange={setLens} allowNone={allowNone} label="Map lenses">
        <Tabs.Tab value="dominion" label="Dominion" keyCap="1" />
        <Tabs.Tab value="threads" label="Threads" keyCap="2" />
      </Tabs>
    );
  }

  it('is a toolbar of pressed buttons, at most one pressed', () => {
    render(<Lenses />);
    expect(screen.getByRole('toolbar', { name: 'Map lenses' })).toBeInTheDocument();
    const dominion = screen.getByRole('button', { name: /Dominion/ });
    const threads = screen.getByRole('button', { name: /Threads/ });
    expect(dominion).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(dominion);
    expect(dominion).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(threads);
    expect(threads).toHaveAttribute('aria-pressed', 'true');
    expect(dominion).toHaveAttribute('aria-pressed', 'false');
  });

  it('allowNone: pressing the pressed one turns it off', () => {
    render(<Lenses />);
    const dominion = screen.getByRole('button', { name: /Dominion/ });
    fireEvent.click(dominion);
    fireEvent.click(dominion);
    expect(dominion).toHaveAttribute('aria-pressed', 'false');
  });

  it('without allowNone the pressed one stays pressed', () => {
    render(<Lenses allowNone={false} />);
    const dominion = screen.getByRole('button', { name: /Dominion/ });
    fireEvent.click(dominion);
    fireEvent.click(dominion);
    expect(dominion).toHaveAttribute('aria-pressed', 'true');
  });

  it('arrows move focus only, never the pressed state', () => {
    render(<Lenses />);
    const dominion = screen.getByRole('button', { name: /Dominion/ });
    dominion.focus();
    fireEvent.keyDown(dominion, { key: 'ArrowRight' });
    const threads = screen.getByRole('button', { name: /Threads/ });
    expect(document.activeElement).toBe(threads);
    expect(threads).toHaveAttribute('aria-pressed', 'false');
  });

  it('draws the key cap', () => {
    render(<Lenses />);
    expect(screen.getByText('1').tagName).toBe('KBD');
  });
});

// THR-2141: nothing in the bar moves while time runs.
describe('Tabs held places', () => {
  function Reserved() {
    const [tab, setTab] = useState('now');
    return (
      <Tabs kind="tabs" value={tab} onChange={setTab} label="Chronicle">
        <Tabs.Tab value="now" label="Now" />
        <Tabs.Tab value="years" label="Years" reserved />
        <Tabs.Tab value="ledger" label="Ledger" count={{ value: 0, label: 'no new chapters' }} />
        <Tabs.Panel value="now">now panel</Tabs.Panel>
        <Tabs.Panel value="ledger">ledger panel</Tabs.Panel>
      </Tabs>
    );
  }

  it('a reserved tab keeps its place unseen, unannounced and out of the arrow keys', () => {
    const { container } = render(<Reserved />);
    const held = container.querySelector('[data-tab-reserved="true"]') as HTMLButtonElement;
    expect(held).not.toBeNull();
    expect(held.style.visibility).toBe('hidden');
    expect(held).toHaveAttribute('aria-hidden', 'true');
    expect(held).toBeDisabled();
    expect(screen.queryByRole('tab', { name: 'Years' })).toBeNull();
    const now = screen.getByRole('tab', { name: 'Now' });
    now.focus();
    fireEvent.keyDown(now, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Ledger' })).toHaveAttribute('aria-selected', 'true');
  });

  it('a zero count still keeps its slot, so the first unread does not widen the tab', () => {
    render(<Reserved />);
    const ledger = screen.getByRole('tab', { name: 'Ledger' });
    const slot = ledger.querySelector('span + span') as HTMLElement;
    expect(slot).not.toBeNull();
    expect(slot.style.minWidth).toBe('1.5rem');
  });
});
