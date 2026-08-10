// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Body>Hello modal</Modal.Body>
      </Modal>,
    );
    expect(screen.getByText('Hello modal')).toBeInTheDocument();
  });

  it('renders header text', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Header>Confirm</Modal.Header>
      </Modal>,
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders footer children', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Footer><button>OK</button></Modal.Footer>
      </Modal>,
    );
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('has role=dialog and aria-modal', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Body>Content</Modal.Body>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose on Escape key', () => {
    const fn = vi.fn();
    render(
      <Modal open onClose={fn}>
        <Modal.Body>Content</Modal.Body>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls onClose on backdrop click', () => {
    const fn = vi.fn();
    render(
      <Modal open onClose={fn}>
        <Modal.Body>Content</Modal.Body>
      </Modal>,
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not call onClose when clicking panel', () => {
    const fn = vi.fn();
    render(
      <Modal open onClose={fn}>
        <Modal.Body>Content</Modal.Body>
      </Modal>,
    );
    fireEvent.click(screen.getByText('Content'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('renders Header close button when onClose provided', () => {
    const fn = vi.fn();
    render(
      <Modal open onClose={() => {}}>
        <Modal.Header onClose={fn}>Title</Modal.Header>
      </Modal>,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('portals to document.body', () => {
    render(
      <div data-testid="parent">
        <Modal open onClose={() => {}}>
          <Modal.Body>Portaled</Modal.Body>
        </Modal>
      </div>,
    );
    const parent = screen.getByTestId('parent');
    expect(parent.querySelector('[role="dialog"]')).toBeNull();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

/**
 * Law 50 — "Opening an overlay moves keyboard focus into it, Tab cycles within
 * it while modal, and closing returns focus to the invoking element."
 *
 * jsdom does not move focus on Tab by itself, so these assert the two wrap
 * points the trap actually owns. Tabbing between interior controls is native
 * browser behaviour and is covered by the keyboard-only browser pass instead.
 */
describe('Modal — Law 50 focus contract', () => {
  /** A modal whose open state is driven by a real invoking button. */
  function Harness({ withInvoker = true }: { withInvoker?: boolean }) {
    const [open, setOpen] = useState(false);
    const [invokerMounted, setInvokerMounted] = useState(withInvoker);
    return (
      <>
        {invokerMounted && <button onClick={() => setOpen(true)}>Open sheet</button>}
        <button onClick={() => setInvokerMounted(false)}>Drop invoker</button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <Modal.Body>
            <button>Inside</button>
          </Modal.Body>
        </Modal>
      </>
    );
  }

  it('moves focus to the first focusable control on open', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Body>
          <button>First</button>
          <button>Last</button>
        </Modal.Body>
      </Modal>,
    );
    expect(document.activeElement).toBe(screen.getByText('First'));
  });

  it('focuses the panel itself when the modal has no focusable controls', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Body>Just prose</Modal.Body>
      </Modal>,
    );
    const panel = screen.getByText('Just prose').closest('[tabindex="-1"]');
    expect(panel).not.toBeNull();
    expect(document.activeElement).toBe(panel);
  });

  it('wraps Tab forward from the last control back to the first', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Body>
          <button>First</button>
          <button>Last</button>
        </Modal.Body>
      </Modal>,
    );
    const last = screen.getByText('Last');
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByText('First'));
  });

  it('wraps Shift+Tab backward from the first control to the last', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Body>
          <button>First</button>
          <button>Last</button>
        </Modal.Body>
      </Modal>,
    );
    const first = screen.getByText('First');
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText('Last'));
  });

  it('does not let Tab escape a modal with no focusable controls', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Body>Just prose</Modal.Body>
      </Modal>,
    );
    const panel = screen.getByText('Just prose').closest('[tabindex="-1"]') as HTMLElement;
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    fireEvent(panel, event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('returns focus to the invoking element on close', () => {
    render(<Harness />);
    const invoker = screen.getByText('Open sheet');
    invoker.focus();

    fireEvent.click(invoker);
    expect(document.activeElement).toBe(screen.getByText('Inside'));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(invoker);
  });

  it('fails soft when the invoking element unmounted while the modal was open', () => {
    render(<Harness />);
    const invoker = screen.getByText('Open sheet');
    invoker.focus();
    fireEvent.click(invoker);

    // The row that opened the sheet is filtered out of its list mid-flow.
    fireEvent.click(screen.getByText('Drop invoker'));
    expect(() => fireEvent.keyDown(document, { key: 'Escape' })).not.toThrow();
  });
});
