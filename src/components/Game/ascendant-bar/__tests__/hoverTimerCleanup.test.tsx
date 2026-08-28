// @vitest-environment jsdom
/**
 * THR-1108 — the two hover-delay tooltip timers in the ascendant bar cleared only
 * in `onMouseLeave`. That handler never fires when the pointer leaves *because the
 * element unmounted*, so a component that went away inside the delay window left
 * the timer armed and its callback ran `setShow` on a torn-down component.
 *
 * **Retargeted by THR-1118.** Both hand-rolled hovers were deleted when the two sites
 * moved onto the shared `Tooltip` (Law 17 — hover explanations route through the one
 * primitive). The defect shape is therefore unreachable *here* by construction, and
 * the guarantee now lives in `Tooltip`'s own unmount cleanup. These tests survive the
 * migration on purpose: they assert the invariant on the **composed surface**, so a
 * future hand-rolled hover re-introduced into either component fails here rather than
 * only in a primitive test that the new code would not be going through.
 *
 * The falsification discipline is unchanged — each site keeps a premise test proving
 * the timer being counted is genuinely the tooltip's, so the post-unmount assertion
 * cannot pass for the wrong reason (e.g. against a hover that armed nothing at all).
 * That guard earns its keep across this rewrite: the shared `Tooltip` listens on
 * `onPointerEnter`, not `onMouseEnter`, so the old `fireEvent.mouseEnter` calls now
 * arm nothing — and without the premise assertions every unmount test here would
 * still have passed, green and vacuous.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IdentityStrip } from '../IdentityStrip';
import { HooksBlock } from '../HooksBlock';
import type { AscendantIdentityView, QuintessenceView } from '../selectors';
import type { GameState } from '../../../../types/gameState';
import type { WorldGraph } from '../../../../engine/graph';
import { TOOLTIP_SHOW_DELAY } from '../../../../types/tooltip';
import { UI_TOOLTIPS } from '../../../../data/ui-content';

// ─── IdentityStrip fixtures ──────────────────────────────────────────────────

/** The Name tooltip's body — now registry copy, so it is read from the registry. */
const NAME_TOOLTIP_BODY = UI_TOOLTIPS['ui.ascendant_name'].desc!;

const IDENTITY: AscendantIdentityView = {
  divineName: 'Vess of the Long Dark',
  mortalName: 'Vess',
  archetypeTitle: 'The Unblinking',
  epithet: null,
  portraitSrc: null,
  primarySphere: 'mind',
  secondarySphere: 'spirit',
};

const QUINTESSENCE: QuintessenceView = {
  ratio: 0.72,
  band: 'healthy',
  lexiconWord: 'Resonant',
};

function renderIdentityStrip() {
  return render(
    <IdentityStrip identity={IDENTITY} quintessence={QUINTESSENCE} onOpen={vi.fn()} />,
  );
}

/** The hover handlers sit on the `Tooltip` span wrapping the name text. */
function nameHoverTarget(): HTMLElement {
  const nameText = screen.getByText(IDENTITY.divineName);
  const target = nameText.parentElement;
  if (!target) throw new Error('name text has no Tooltip parent — fixture drifted');
  return target;
}

// ─── HooksBlock fixtures ─────────────────────────────────────────────────────

const CHIP_LABEL = 'Hollow-Marked';
const CHIP_DEF = 'A thinning where something reached through and did not fully withdraw.';

/**
 * `HooksBlock` reads chips off the ascendant's `has_trait` edges (THR-1307 — it read a
 * writerless `has_attachment` until then, so this stub described a shape no world
 * produced). Stub shape follows the established component-test pattern
 * (`src/components/ruins/__tests__/DelveProgressPanel.test.tsx:25`).
 */
function makeHooksState(): GameState {
  const graph = {
    getOutgoingEdges: (source: string, type: string) =>
      source === 'ascendant-1' && type === 'has_trait'
        ? [{ source, target: 'mark-1', type }]
        : [],
    getIncomingEdges: () => [],
    getNode: (id: string) =>
      id === 'mark-1'
        ? {
            id,
            properties: {
              name: CHIP_LABEL,
              description: CHIP_DEF,
              subcategory: 'condition',
              valence: 'curse',
            },
          }
        : undefined,
  } as unknown as WorldGraph;

  return { ascendantId: 'ascendant-1', graph } as unknown as GameState;
}

// ─── IdentityStrip ───────────────────────────────────────────────────────────

describe('IdentityStrip — hover tooltip timer lifecycle (THR-1108, via shared Tooltip)', () => {
  it('arms exactly one timer on hover, and that timer is what reveals the tooltip', () => {
    vi.useFakeTimers();
    try {
      renderIdentityStrip();

      // Premise: nothing pending, and no tooltip, before the hover.
      expect(vi.getTimerCount()).toBe(0);
      expect(screen.queryByText(NAME_TOOLTIP_BODY)).toBeNull();

      fireEvent.pointerEnter(nameHoverTarget());

      expect(vi.getTimerCount()).toBe(1);
      // Still hidden — the reveal is the timer's job, not the hover's.
      expect(screen.queryByText(NAME_TOOLTIP_BODY)).toBeNull();

      act(() => { vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY); });

      // Ties the counted timer to the tooltip: firing it is what shows the copy.
      expect(screen.getByText(NAME_TOOLTIP_BODY)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the pending tooltip timer on unmount instead of firing into a torn-down strip', () => {
    vi.useFakeTimers();
    try {
      const { unmount } = renderIdentityStrip();

      fireEvent.pointerEnter(nameHoverTarget());
      // Guard against a vacuous pass: the hover must actually arm the timer, or
      // the post-unmount assertion below would hold for the wrong reason.
      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
      expect(() => vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY * 4)).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ─── HooksBlock ──────────────────────────────────────────────────────────────

describe('HooksBlock chip — hover tooltip timer lifecycle (THR-1108, via shared Tooltip)', () => {
  it('arms exactly one timer on hover, and that timer is what reveals the tooltip', () => {
    vi.useFakeTimers();
    try {
      render(<HooksBlock gameState={makeHooksState()} />);

      // Premise: the chip rendered at all, nothing pending, no tooltip.
      const chip = screen.getByText(CHIP_LABEL);
      expect(vi.getTimerCount()).toBe(0);
      expect(screen.queryByText(CHIP_DEF)).toBeNull();

      fireEvent.pointerEnter(chip);

      expect(vi.getTimerCount()).toBe(1);
      expect(screen.queryByText(CHIP_DEF)).toBeNull();

      act(() => { vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY); });

      expect(screen.getByText(CHIP_DEF)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the pending tooltip timer on unmount instead of firing into a torn-down chip', () => {
    vi.useFakeTimers();
    try {
      const { unmount } = render(<HooksBlock gameState={makeHooksState()} />);

      fireEvent.pointerEnter(screen.getByText(CHIP_LABEL));
      // Guard against a vacuous pass, as above.
      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
      expect(() => vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY * 4)).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});
