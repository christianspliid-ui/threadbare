// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
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
