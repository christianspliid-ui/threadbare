// @vitest-environment jsdom
/** THR-1884 — Panel: the one surface shell, by hierarchy level. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Panel, panelStyle } from '../Panel';
import { Modal, modalPanelStyle } from '../Modal';

describe('Panel', () => {
  afterEach(() => vi.restoreAllMocks());

  it('draws each level from the tokens', () => {
    expect(panelStyle('page').borderRadius).toBe('var(--radius-page)');
    expect(panelStyle('panel').borderRadius).toBe('var(--radius-panel)');
    expect(panelStyle('panel').backgroundColor).toBe('var(--bg-surface)');
    expect(panelStyle('inset')).toEqual({ backgroundColor: 'var(--bg-raised)', borderRadius: 'var(--radius-control)' });
  });

  it('adds the level shadow only when floating', () => {
    expect(panelStyle('panel').boxShadow).toBeUndefined();
    expect(panelStyle('panel', { floating: true }).boxShadow).toBe('var(--shadow-panel)');
    expect(panelStyle('inset', { floating: true }).boxShadow).toBeUndefined();
  });

  it('uses the glass token and blur for the glass material', () => {
    const glass = panelStyle('panel', { material: 'glass' });
    expect(glass.background).toBe('var(--bg-glass)');
    expect(glass.backdropFilter).toBe('blur(10px)');
  });

  it('renders its element with the level as a data attribute', () => {
    render(<Panel level="panel" as="section">Body</Panel>);
    const el = screen.getByText('Body');
    expect(el.tagName).toBe('SECTION');
    expect(el.dataset.panelLevel).toBe('panel');
  });

  it('warns once in dev when a panel nests at the same or a lower level', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Panel level="inset">
        <Panel level="panel">inner</Panel>
      </Panel>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('page ⊃ panel ⊃ inset');
  });

  it('does not warn for page ⊃ panel ⊃ inset', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Panel level="page">
        <Panel level="panel">
          <Panel level="inset">ok</Panel>
        </Panel>
      </Panel>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('is the look Modal draws: a floating page panel', () => {
    const modal = modalPanelStyle(500);
    const page = panelStyle('page', { floating: true });
    expect(modal).toMatchObject(page);
    render(<Modal open onClose={() => {}}><Modal.Body>prose</Modal.Body></Modal>);
    const surface = screen.getByText('prose').closest('[data-panel-level]') as HTMLElement;
    expect(surface.dataset.panelLevel).toBe('page');
  });
});
