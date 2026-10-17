// @vitest-environment jsdom
/**
 * SheetColumns (THR-1820 § 4): two columns when the container provides 'two',
 * stacked under 'one' and with no provider (fail-soft), and Modal provides the
 * value from its tier.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SheetColumns, SheetLayoutContext } from '../SheetColumns';
import { Modal } from '../Modal';

describe('SheetColumns', () => {
  it("renders two grid columns under 'two'", () => {
    render(
      <SheetLayoutContext.Provider value="two">
        <SheetColumns aside={<span>aside</span>}>main</SheetColumns>
      </SheetLayoutContext.Provider>,
    );
    const root = screen.getByTestId('sheet-columns');
    expect(root.getAttribute('data-layout')).toBe('two');
    expect(root.style.display).toBe('grid');
    expect(root.style.gridTemplateColumns).toContain('--sheet-aside-w');
    expect(screen.getByTestId('sheet-columns-aside').textContent).toBe('aside');
    expect(screen.getByTestId('sheet-columns-main').textContent).toBe('main');
  });

  it("stacks under 'one'", () => {
    render(
      <SheetLayoutContext.Provider value="one">
        <SheetColumns aside={<span>aside</span>}>main</SheetColumns>
      </SheetLayoutContext.Provider>,
    );
    const root = screen.getByTestId('sheet-columns');
    expect(root.getAttribute('data-layout')).toBe('one');
    expect(root.style.display).not.toBe('grid');
  });

  it('stacks with no provider', () => {
    render(<SheetColumns aside={<span>aside</span>}>main</SheetColumns>);
    expect(screen.getByTestId('sheet-columns').getAttribute('data-layout')).toBe('one');
  });

  it('goes two-column inside an L Modal and stacks inside an M Modal', () => {
    const { unmount } = render(
      <Modal open onClose={() => {}} size="l"><SheetColumns aside="a">b</SheetColumns></Modal>,
    );
    expect(screen.getByTestId('sheet-columns').getAttribute('data-layout')).toBe('two');
    unmount();
    render(<Modal open onClose={() => {}} size="m"><SheetColumns aside="a">b</SheetColumns></Modal>);
    expect(screen.getByTestId('sheet-columns').getAttribute('data-layout')).toBe('one');
  });
});
