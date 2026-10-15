// @vitest-environment jsdom
/**
 * THR-1884 — Overlay: the one backdrop, z-band and Escape implementation, and the
 * escape-registry reads it reports through (`getEscapeLayers`).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Overlay } from '../Overlay';
import { Modal } from '../Modal';
import { Tooltip } from '../Tooltip';
import { Dropdown } from '../Dropdown';
import { getEscapeLayers } from '../useEscapeLayer';
import { Z_BAND } from '../zBands';
import { CEREMONY_SURFACES, surfaceHomeProps } from '../surfaceHomes';

describe('Overlay', () => {
  it('portals a labelled dialog at its named band', () => {
    render(
      <div data-testid="parent">
        <Overlay open onClose={() => {}} label="Path codex" band="modal">
          <p>Inside</p>
        </Overlay>
      </div>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Path codex' });
    expect(screen.getByTestId('parent').contains(dialog)).toBe(false);
    expect(dialog.style.zIndex).toBe(String(Z_BAND.modal));
    expect(dialog.dataset.overlayBand).toBe('modal');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('draws each backdrop from its token', () => {
    const { rerender } = render(<Overlay open onClose={() => {}} label="x" backdrop="dim">.</Overlay>);
    expect(screen.getByRole('dialog').style.background).toBe('var(--scrim-dim)');
    rerender(<Overlay open onClose={() => {}} label="x" backdrop="heavy">.</Overlay>);
    expect(screen.getByRole('dialog').style.background).toBe('var(--scrim-heavy)');
    rerender(<Overlay open onClose={() => {}} label="x" backdrop="void">.</Overlay>);
    expect(screen.getByRole('dialog').style.background).toBe('var(--bg-abyss)');
  });

  it('closes on a dim backdrop click but not on a void one', () => {
    const dim = vi.fn();
    const { unmount } = render(<Overlay open onClose={dim} label="dim">.</Overlay>);
    fireEvent.click(screen.getByRole('dialog'));
    expect(dim).toHaveBeenCalledOnce();
    unmount();

    const ceremony = vi.fn();
    render(<Overlay open onClose={ceremony} label="ceremony" backdrop="void">.</Overlay>);
    fireEvent.click(screen.getByRole('dialog'));
    expect(ceremony).not.toHaveBeenCalled();
  });

  it('makes a none backdrop pointer-transparent unless it closes on click', () => {
    const { rerender } = render(<Overlay open onClose={() => {}} label="stage" backdrop="none">.</Overlay>);
    expect(screen.getByRole('dialog').style.pointerEvents).toBe('none');
    rerender(<Overlay open onClose={() => {}} label="menu" backdrop="none" closeOnBackdrop>.</Overlay>);
    expect(screen.getByRole('dialog').style.pointerEvents).toBe('');
  });

  it('starts below the top bar when inset is belowTopBar (the Stage, Law 52)', () => {
    render(<Overlay open onClose={() => {}} label="stage" band="stage" inset="belowTopBar">.</Overlay>);
    expect(screen.getByRole('dialog').style.top).toBe('var(--topbar-height)');
  });

  it('registers no escape layer when closeOnEscape is false', () => {
    const fn = vi.fn();
    render(<Overlay open onClose={fn} label="harvest" closeOnEscape={false}>.</Overlay>);
    expect(getEscapeLayers()).toEqual([]);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('the Escape stack (Law 23, THR-1884)', () => {
  it('reports open layers topmost first, by label and band', () => {
    render(
      <>
        <Overlay open onClose={() => {}} label="Ceremony" band="focused" backdrop="void">.</Overlay>
        <Modal open onClose={() => {}} aria-label="Sheet"><Modal.Body>.</Modal.Body></Modal>
      </>,
    );
    expect(getEscapeLayers()).toEqual([
      { label: 'Sheet', band: Z_BAND.modal },
      { label: 'Ceremony', band: Z_BAND.focused },
    ]);
  });

  it('closes the Modal over an Overlay alone, leaving only the Overlay open', () => {
    const overlay = vi.fn();
    const modal = vi.fn();
    render(
      <>
        <Overlay open onClose={overlay} label="Stacking demo overlay">.</Overlay>
        <Modal open onClose={modal} aria-label="Stacking demo modal" zIndex={Z_BAND.modalAboveInterrupt}>
          <Modal.Body>.</Modal.Body>
        </Modal>
      </>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(modal).toHaveBeenCalledOnce();
    expect(overlay).not.toHaveBeenCalled();
  });

  it('closes a tooltip open over a modal alone', async () => {
    vi.useFakeTimers();
    const modalClose = vi.fn();
    render(
      <Modal open onClose={modalClose} aria-label="Sheet">
        <Modal.Body>
          <Tooltip label="Doom" desc="How near the end is.">
            <span>Doom</span>
          </Tooltip>
        </Modal.Body>
      </Modal>,
    );
    fireEvent.pointerEnter(screen.getByText('Doom'));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(getEscapeLayers()[0]).toEqual({ label: 'tooltip', band: Z_BAND.tooltip });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(modalClose).not.toHaveBeenCalled();
    expect(getEscapeLayers().map((l) => l.label)).toEqual(['Sheet']);
    vi.useRealTimers();
  });

  it('closes an open menu alone, above any dialog', () => {
    const modalClose = vi.fn();
    const menuChange = vi.fn();
    render(
      <Modal open onClose={modalClose} aria-label="Sheet">
        <Modal.Body>
          <Dropdown trigger={<button>Menu</button>} open onOpenChange={menuChange}>
            <Dropdown.Item>One</Dropdown.Item>
          </Dropdown>
        </Modal.Body>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(menuChange).toHaveBeenCalledWith(false);
    expect(modalClose).not.toHaveBeenCalled();
  });
});

describe('surface homes (Law 58)', () => {
  it('derives the ceremony list from the one home list', () => {
    expect([...CEREMONY_SURFACES]).toEqual(['meet-the-first', 'threading-rite', 'cycle-harvest']);
  });

  it('mounts a ceremony on the focused band over the void, filling the viewport', () => {
    for (const kind of CEREMONY_SURFACES) {
      expect(surfaceHomeProps(kind)).toMatchObject({ band: 'focused', backdrop: 'void', placement: 'fill' });
    }
  });

  it('mounts a dialog-homed surface on the modal band', () => {
    expect(surfaceHomeProps('chapter-ledger')).toMatchObject({ band: 'modal', backdrop: 'dim' });
  });
});
