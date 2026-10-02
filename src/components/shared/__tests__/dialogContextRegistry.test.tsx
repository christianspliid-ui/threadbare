// @vitest-environment jsdom
/**
 * dialogContextRegistry — the surface → context map is what ships (THR-1586).
 *
 * Three gates:
 *  1. `Modal` applies the context class and `data-dialog-context`, and a modal
 *     with no `context` is unchanged — no `dialog-ctx-*` class, the neutral
 *     gradient as the fallback of every `--dlg-*` read (the additive guarantee).
 *  2. Every registry surface that does not own its palette passes its context to
 *     `Modal` in source. A source-shape gate rather than six full renders: the
 *     receipts, the moment card and the elder dilemma each need a live world to
 *     render, and what drifts is the one prop, not their content.
 *  3. One adopting surface rendered live (`StoryBeatModal`), so the prop is proven
 *     end to end, not only present in text.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { render } from '@testing-library/react';
import { Modal } from '../Modal';
import { DIALOG_CONTEXT_CLASS, DIALOG_CONTEXT_SURFACES, dialogContextClass } from '../dialogContext';
import { StoryBeatModal } from '../../Game/StoryBeatModal';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

const here = dirname(fileURLToPath(import.meta.url));
const components = resolve(here, '../..');

/** Where each registry surface lives. A surface added to the registry must be added here. */
const SURFACE_FILES: Record<string, string> = {
  StoryBeatModal: 'Game/StoryBeatModal.tsx',
  AscendantBeatModal: 'Game/AscendantBeatModal.tsx',
  JourneyVignetteModal: 'Game/JourneyVignetteModal.tsx',
  EmergenceDilemmaModal: 'ruins/EmergenceDilemmaModal.tsx',
  DivineReceiptModal: 'Game/DivineReceiptModal.tsx',
  MomentCard: 'Game/MomentCard.tsx',
};

const panelOf = () => document.querySelector('[role="dialog"] > div') as HTMLElement;

describe('Modal context prop (THR-1586)', () => {
  it('applies the context class and data-dialog-context', () => {
    render(
      <Modal open onClose={() => {}} context="elder">
        <Modal.Body>x</Modal.Body>
      </Modal>,
    );
    const panel = panelOf();
    expect(panel.className).toContain('dialog-ctx-elder');
    expect(panel.getAttribute('data-dialog-context')).toBe('elder');
  });

  it('keeps panelClassName alongside the context class', () => {
    render(
      <Modal open onClose={() => {}} context="story" panelClassName="frame-ceremonial">
        <Modal.Body>x</Modal.Body>
      </Modal>,
    );
    expect(panelOf().className.split(' ').sort()).toEqual(['dialog-ctx-story', 'frame-ceremonial']);
  });

  it('a modal with no context is neutral: no context class, neutral fallbacks', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Body>x</Modal.Body>
      </Modal>,
    );
    const panel = panelOf();
    expect(panel.className).not.toMatch(/dialog-ctx-/);
    expect(panel.getAttribute('data-dialog-context')).toBe('neutral');
    // Every --dlg-* read falls back to the value the panel had before THR-1586.
    expect(panel.getAttribute('style')).toContain('var(--dlg-bg, linear-gradient(180deg, var(--bg-deep), var(--bg-abyss)))');
    expect(panel.getAttribute('style')).toContain('var(--dlg-border, var(--border-gold))');
  });

  it('dialogContextClass maps neutral and undefined to no class', () => {
    expect(dialogContextClass(undefined)).toBeUndefined();
    expect(dialogContextClass('neutral')).toBeUndefined();
    expect(dialogContextClass('gain')).toBe(DIALOG_CONTEXT_CLASS.gain);
  });
});

describe('every registry surface declares its context (THR-1586)', () => {
  const adopting = DIALOG_CONTEXT_SURFACES.filter((s) => !s.ownsPalette);

  it('the file map covers exactly the adopting surfaces', () => {
    expect(Object.keys(SURFACE_FILES).sort()).toEqual(adopting.map((s) => s.surface).sort());
  });

  for (const { surface, context } of adopting) {
    it(`${surface} passes context="${context}"`, () => {
      const src = readFileSync(resolve(components, SURFACE_FILES[surface]), 'utf8');
      expect(src).toContain(`context="${context}"`);
    });
  }

  it('the palette-owning surfaces are the Premonition and the veil', () => {
    const owners = DIALOG_CONTEXT_SURFACES.filter((s) => s.ownsPalette).map((s) => `${s.surface}:${s.context}`);
    expect(owners.sort()).toEqual(['EncounterVeil:encounter', 'PremonitionModal:divine']);
  });
});

describe('StoryBeatModal renders in the story context (THR-1586)', () => {
  it('its panel carries the story class', () => {
    const template = {
      id: 'sg.story', name: 'A Test Beat', description: 'Something stirs.', reach: 'iron',
    } as unknown as UnifiedActionTemplate;
    render(<StoryBeatModal open onDismiss={() => {}} template={template} agentName="Kael" />);
    const panel = panelOf();
    expect(panel.getAttribute('data-dialog-context')).toBe('story');
    expect(panel.className).toContain('dialog-ctx-story');
  });
});
