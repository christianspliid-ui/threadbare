// @vitest-environment jsdom
/**
 * THR-1108 — the two hover-delay tooltip timers in the ascendant bar cleared only
 * in `onMouseLeave`. That handler never fires when the pointer leaves *because the
 * element unmounted*, so a component that went away inside the delay window left
 * the timer armed and its callback ran `setShow` on a torn-down component.
 *
 * Same defect shape as THR-1106 (`ActionCard`'s shake timer), and these tests
 * borrow its falsification discipline: each site gets a premise test proving the
 * timer we count is genuinely the tooltip's, so the post-unmount assertion cannot
 * pass for the wrong reason (e.g. against a hover that armed nothing at all).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IdentityStrip } from '../IdentityStrip';
import { HooksBlock } from '../HooksBlock';
import type { AscendantIdentityView, QuintessenceView } from '../selectors';
import type { GameState } from '../../../../types/gameState';
import type { WorldGraph } from '../../../../engine/graph';

// ─── IdentityStrip fixtures ──────────────────────────────────────────────────

/** Mirrors `TOOLTIP_DELAY_MS` in IdentityStrip.tsx (not exported). */
const IDENTITY_DELAY_MS = 450;

/** The Name tooltip's body copy — unique on the surface, so it marks "tooltip shown". */
const NAME_TOOLTIP_BODY =
  'Your name carries the shape of what you were. Click to open the full sheet.';

const IDENTITY: AscendantIdentityView = {
  divineName: 'Vess of the Long Dark',
  mortalName: 'Vess',
  archetypeTitle: 'The Witness',
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

/** The hover handlers sit on the `HoveredTerm` span wrapping the name text. */
function nameHoverTarget(): HTMLElement {
  const nameText = screen.getByText(IDENTITY.divineName);
  const target = nameText.parentElement;
  if (!target) throw new Error('name text has no HoveredTerm parent — fixture drifted');
  return target;
}

// ─── HooksBlock fixtures ─────────────────────────────────────────────────────

/** Mirrors `TOOLTIP_DELAY_MS` in HooksBlock.tsx (not exported). */
const HOOKS_DELAY_MS = 600;

const CHIP_LABEL = 'Hollow-Marked';
const CHIP_DEF = 'A thinning where something reached through and did not fully withdraw.';

/**
 * `HooksBlock` reads chips off `has_attachment` edges from the ascendant node.
 * Stub shape follows the established component-test pattern
 * (`src/components/ruins/__tests__/DelveProgressPanel.test.tsx:25`).
 */
function makeHooksState(): GameState {
  const graph = {
    getOutgoingEdges: (source: string, type: string) =>
      source === 'ascendant-1' && type === 'has_attachment'
        ? [{ source, target: 'mark-1', type }]
        : [],
    getNode: (id: string) =>
      id === 'mark-1'
        ? {
            id,
            properties: {
              name: CHIP_LABEL,
              description: CHIP_DEF,
              category: 'condition',
              valence: 'curse',
            },
          }
        : undefined,
  } as unknown as WorldGraph;

  return { ascendantId: 'ascendant-1', graph } as unknown as GameState;
}

// ─── IdentityStrip ───────────────────────────────────────────────────────────

describe('IdentityStrip — hover tooltip timer lifecycle (THR-1108)', () => {
  it('arms exactly one timer on hover, and that timer is what reveals the tooltip', () => {
    vi.useFakeTimers();
    try {
      renderIdentityStrip();

      // Premise: nothing pending, and no tooltip, before the hover.
      expect(vi.getTimerCount()).toBe(0);
      expect(screen.queryByText(NAME_TOOLTIP_BODY)).toBeNull();

      fireEvent.mouseEnter(nameHoverTarget());

      expect(vi.getTimerCount()).toBe(1);
      // Still hidden — the reveal is the timer's job, not the hover's.
      expect(screen.queryByText(NAME_TOOLTIP_BODY)).toBeNull();

      act(() => { vi.advanceTimersByTime(IDENTITY_DELAY_MS); });

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

      fireEvent.mouseEnter(nameHoverTarget());
      // Guard against a vacuous pass: the hover must actually arm the timer, or
      // the post-unmount assertion below would hold for the wrong reason.
      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
      expect(() => vi.advanceTimersByTime(IDENTITY_DELAY_MS * 4)).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ─── HooksBlock ──────────────────────────────────────────────────────────────

describe('HooksBlock chip — hover tooltip timer lifecycle (THR-1108)', () => {
  it('arms exactly one timer on hover, and that timer is what reveals the tooltip', () => {
    vi.useFakeTimers();
    try {
      render(<HooksBlock gameState={makeHooksState()} />);

      // Premise: the chip rendered at all, nothing pending, no tooltip.
      const chip = screen.getByText(CHIP_LABEL);
      expect(vi.getTimerCount()).toBe(0);
      expect(screen.queryByText(CHIP_DEF)).toBeNull();

      fireEvent.mouseEnter(chip);

      expect(vi.getTimerCount()).toBe(1);
      expect(screen.queryByText(CHIP_DEF)).toBeNull();

      act(() => { vi.advanceTimersByTime(HOOKS_DELAY_MS); });

      expect(screen.getByText(CHIP_DEF)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the pending tooltip timer on unmount instead of firing into a torn-down chip', () => {
    vi.useFakeTimers();
    try {
      const { unmount } = render(<HooksBlock gameState={makeHooksState()} />);

      fireEvent.mouseEnter(screen.getByText(CHIP_LABEL));
      // Guard against a vacuous pass, as above.
      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
      expect(() => vi.advanceTimersByTime(HOOKS_DELAY_MS * 4)).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});
