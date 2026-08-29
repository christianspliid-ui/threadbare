// @vitest-environment jsdom
/**
 * THR-1330 — the composed-bar capture.
 *
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`
 * (`Docs/canon/verification-gates.md` § Browser-verify, the impediments #546 / #574
 * route). The contract for that substitution is render assertions on the **real
 * component**, covering every face the change produces plus absence where the element
 * must not render — which is why this file exists alongside `hooksBlockLink.test.tsx`
 * rather than being folded into it: that file asserts the block, this one asserts the
 * surface the player actually opens, with the prop travelling `GameView → AscendantBar
 * → HooksBlock` under its own power.
 *
 * A block-level test cannot catch a bar that forgets to forward `onOpenAttachment`,
 * and that is precisely the wiring THR-1330 adds. The world is the real one —
 * `initializeGameState` on a small map, then `devSeedAscendantTestPackage`, the same
 * pair behind `?view=game&seeded`.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AscendantBar } from '../AscendantBar';
import { initializeGameState, devSeedAscendantTestPackage } from '../../../../engine/gameInit';
import { generateArchetypes } from '../../../../engine/ascendant';
import { createBalancedCosmology } from '../../../../engine/cosmology';
import type { GameState } from '../../../../types/gameState';

const TEST_SEED = 42;

const archetype = generateArchetypes(4, TEST_SEED)[0];
const { state: world } = initializeGameState(
  archetype,
  'Vess',
  createBalancedCosmology(),
  TEST_SEED,
  16,
  12,
);
devSeedAscendantTestPackage(world);

function renderBar(onOpenAttachment?: (id: string) => void) {
  const utils = render(
    <AscendantBar
      gameState={world as GameState}
      archetype={archetype}
      ascendantIdentity={null}
      avatarName="Vess"
      worldVersion={1}
      onOpenSheet={vi.fn()}
      onOpenMandate={vi.fn()}
      onOpenAttachment={onOpenAttachment}
    />,
  );
  // Hooks is closed by default on the rail (ASCENDANT_BAR_SECTION_DEFAULT_OPEN) — the
  // player's first act on this surface is to open it, so the capture does the same.
  fireEvent.click(screen.getByText('Hooks'));
  return utils;
}

describe('THR-1330 — the composed ascendant bar, Hooks section open', () => {
  it('renders all three rows with their chips — the face the player sees', () => {
    renderBar();

    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getByText('Clues')).toBeInTheDocument();
    expect(screen.getByText('Vows & Bonds')).toBeInTheDocument();

    // One named chip per row, so a row that rendered its header and no chips fails.
    expect(screen.getByText('Veiled')).toBeInTheDocument();
    expect(screen.getByText('Rumor: The Sunken Vale')).toBeInTheDocument();
    expect(screen.getByText('Debt: The Grey Seer')).toBeInTheDocument();

    // The pre-THR-1307 surface must not be what we captured.
    expect(screen.queryByText('No marks, clues, or vows.')).toBeNull();
  });

  it('the bar forwards `onOpenAttachment`, so a condition chip reaches the sheet', () => {
    const onOpenAttachment = vi.fn();
    renderBar(onOpenAttachment);

    fireEvent.click(screen.getByText('Veiled'));

    // The template node id GameView hands to `resolveAttachmentTemplateDetail`. A bar
    // that dropped the prop calls nothing here while every block-level test stays green.
    expect(onOpenAttachment).toHaveBeenCalledWith('trait.dev.veiled');
  });

  it('on the composed bar, exactly the linkable chips advertise themselves as controls', () => {
    renderBar(vi.fn());

    // Scoped to the Hooks block, not the whole rail. A container-wide sweep counts the
    // bar's own six section toggles — 13 buttons on the composed surface — so it would
    // have measured the rail's chrome and called the result a statement about chips.
    const hooks = screen
      .getByTestId('ascendant-hooks')
      .querySelectorAll('[role="button"]');
    const labels = Array.from(hooks).map((el) => el.textContent);

    // Every seeded condition, and nothing from the other two rows. Asserted as the
    // whole set rather than as spot checks: a bar that gave every chip the affordance
    // would satisfy "the conditions are buttons" and still be the released defect.
    expect(new Set(labels)).toEqual(
      new Set(['Veiled', 'Thornmarked', 'Unforgotten', 'Cold of Eye']),
    );
  });

  it('with no handler the bar is inert end to end — the styleguide / read-only case', () => {
    renderBar(undefined);

    expect(screen.getByText('Veiled')).toBeInTheDocument();
    expect(
      screen.getByTestId('ascendant-hooks').querySelectorAll('[role="button"]'),
    ).toHaveLength(0);
  });

  it('the viewport contract holds — the rail is a fixed-width column that owns its scroll', () => {
    // The bar is the 360px left rail under the 1920×1080 contract. jsdom has no layout
    // engine, so this asserts the contract's *mechanism* — the aside exists, is the
    // labelled landmark, and every section lives inside it rather than escaping into
    // the document body, which is the structural half a screenshot would show.
    const { container } = renderBar(vi.fn());

    const rail = container.querySelector('aside[aria-label="Ascendant status"]');
    expect(rail).not.toBeNull();
    expect(within(rail as HTMLElement).getByText('Conditions')).toBeInTheDocument();
    expect(within(rail as HTMLElement).getByText('Veiled')).toBeInTheDocument();
  });
});
