// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dropdown } from '../Dropdown';

describe('Dropdown', () => {
  it('renders trigger', () => {
    render(
      <Dropdown trigger={<button>Open</button>} open={false} onOpenChange={() => {}}>
        <div>Menu</div>
      </Dropdown>,
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders panel content when open', () => {
    render(
      <Dropdown trigger={<button>Open</button>} open onOpenChange={() => {}}>
        <div>Menu content</div>
      </Dropdown>,
    );
    expect(screen.getByText('Menu content')).toBeInTheDocument();
  });

  it('renders Dropdown.Item', () => {
    render(
      <Dropdown trigger={<button>Open</button>} open onOpenChange={() => {}}>
        <Dropdown.Item>Option A</Dropdown.Item>
      </Dropdown>,
    );
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  it('fires Item onClick', () => {
    const fn = vi.fn();
    render(
      <Dropdown trigger={<button>Open</button>} open onOpenChange={() => {}}>
        <Dropdown.Item onClick={fn}>Option A</Dropdown.Item>
      </Dropdown>,
    );
    fireEvent.click(screen.getByText('Option A'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('closes on Escape key', () => {
    const fn = vi.fn();
    render(
      <Dropdown trigger={<button>Open</button>} open onOpenChange={fn}>
        <div>Menu</div>
      </Dropdown>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(fn).toHaveBeenCalledWith(false);
  });

  it('closes on outside click', () => {
    const fn = vi.fn();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <Dropdown trigger={<button>Open</button>} open onOpenChange={fn}>
          <div>Menu</div>
        </Dropdown>
      </div>,
    );
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(fn).toHaveBeenCalledWith(false);
  });

  it('does not close when clicking inside panel', () => {
    const fn = vi.fn();
    render(
      <Dropdown trigger={<button>Open</button>} open onOpenChange={fn}>
        <div>Inside</div>
      </Dropdown>,
    );
    fireEvent.mouseDown(screen.getByText('Inside'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('portals panel to document.body', () => {
    render(
      <div data-testid="parent">
        <Dropdown trigger={<button>Open</button>} open onOpenChange={() => {}}>
          <div>Portaled</div>
        </Dropdown>
      </div>,
    );
    const parent = screen.getByTestId('parent');
    expect(parent.querySelector('[data-testid="dropdown-panel"]')).toBeNull();
    expect(screen.getByTestId('dropdown-panel')).toBeInTheDocument();
  });

  it('Item responds to Enter key', () => {
    const fn = vi.fn();
    render(
      <Dropdown trigger={<button>Open</button>} open onOpenChange={() => {}}>
        <Dropdown.Item onClick={fn}>Option</Dropdown.Item>
      </Dropdown>,
    );
    fireEvent.keyDown(screen.getByText('Option'), { key: 'Enter' });
    expect(fn).toHaveBeenCalledOnce();
  });
});
