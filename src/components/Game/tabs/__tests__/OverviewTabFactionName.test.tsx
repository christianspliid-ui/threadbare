// @vitest-environment jsdom
/**
 * The character sheet's faction name is a concept, not a string (THR-1149,
 * Laws 1 and 21).
 *
 * It used to render as a bare `<p>` with a glyph prefix: no link, no tooltip,
 * no heraldry. `FactionSheet` exists and was reachable from nowhere on the sheet
 * that names the faction (Law 21), and a game concept was presented as text
 * alone (Law 1).
 *
 * The three treatments are asserted independently because each depends on
 * different data and each degrades on its own (NFP #4). The negative cases
 * matter more than the positive ones here: the failure this ticket must not
 * introduce is a control that *looks* live and does nothing.
 *
 * Expected tooltip copy is read from the faction definition rather than typed
 * as a literal, so these exercise definition → registry → surface instead of
 * restating the content in a second place that could drift from it.
 *
 * These stand in for the contractual 1920×1080 capture, which no unattended run
 * can produce (`preview_start` is refused with nobody present to approve it —
 * impediments #546, #574). They cover that the treatments reached the DOM and
 * that the fail-open paths stay inert; they do not cover what only pixels can
 * (paint, overflow, z-index, tooltip placement/flip). That capture is owed to
 * the attended pixel-pass sweep.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { OverviewTab } from '../OverviewTab';
import type { AgentInfoCardData } from '../../../../engine/agentDetail';
import { resolveTooltip } from '../../../../engine/tooltipResolver';
import { getFactionDefinition } from '../../../../data/faction-definition-lookup';

/** A shipped definition, so the registry lookup under test is a real one. */
const FACTION_DEF_ID = 'adventuring_guild';
const FACTION_NODE_ID = 'faction_adventuring_guild_ashford';
const FACTION_NAME = 'The Ashen Concord';

/** Hover delay used by `Tooltip` before it paints. */
const TOOLTIP_DELAY_MS = 200;

function card(overrides: Partial<AgentInfoCardData> = {}): AgentInfoCardData {
  return {
    name: 'Sevrin',
    knowledgeLevel: 'known',
    factionName: FACTION_NAME,
    factionRank: 'Warden',
    factionReputation: 0.62,
    factionDefId: FACTION_DEF_ID,
    factionNodeId: FACTION_NODE_ID,
    ...overrides,
  } as unknown as AgentInfoCardData;
}

/**
 * The Faction `<section>`, located by the heading the player actually reads.
 *
 * Every query below is scoped to it. The Identity section a few lines up prints
 * the same faction name in its "faction · culture" line, so an unscoped
 * `getByText` matches two elements and a `getByRole` could silently assert
 * against the wrong one.
 */
function factionSection(): HTMLElement {
  const section = screen.getByText('Faction').closest('section');
  expect(section, 'Faction section should render').not.toBeNull();
  return section as HTMLElement;
}

/** The faction-name control, whose accessible name is the faction's own name. */
function factionControl(): HTMLElement {
  return within(factionSection()).getByRole('button', { name: FACTION_NAME });
}

describe('OverviewTab — faction name is a concept (THR-1149)', () => {
  describe('link (Law 21)', () => {
    it('opens the faction sheet with the faction NODE id, not the definition id', () => {
      const onOpenFaction = vi.fn();
      render(<OverviewTab card={card()} onOpenFaction={onOpenFaction} />);

      fireEvent.click(factionControl());

      expect(onOpenFaction).toHaveBeenCalledTimes(1);
      // The distinction is the bug this field exists to prevent: several
      // chapters of one order share a `factionDefId`, so the def id opens the
      // wrong sheet or none at all.
      expect(onOpenFaction).toHaveBeenCalledWith(FACTION_NODE_ID, FACTION_NAME);
      expect(onOpenFaction).not.toHaveBeenCalledWith(FACTION_DEF_ID, FACTION_NAME);
    });

    it('is a native button, so it is focusable and Enter/Space activate it (Law 23)', () => {
      render(<OverviewTab card={card()} onOpenFaction={vi.fn()} />);

      const control = factionControl();
      // Native button semantics rather than a hand-rolled role + keydown pair:
      // focusability, key activation and `:focus-visible` all come for free and
      // cannot drift out of step with each other.
      expect(control.tagName).toBe('BUTTON');
      control.focus();
      expect(document.activeElement).toBe(control);
    });

    it('fails open to plain text when the card carries no faction node id', () => {
      render(<OverviewTab card={card({ factionNodeId: undefined })} onOpenFaction={vi.fn()} />);

      // The name is still shown — it is only the affordance that is withheld.
      expect(factionSection()).toHaveTextContent(FACTION_NAME);
      expect(factionSection().querySelector('button')).toBeNull();
    });

    it('fails open to plain text when no handler is supplied', () => {
      render(<OverviewTab card={card()} />);

      expect(factionSection()).toHaveTextContent(FACTION_NAME);
      expect(factionSection().querySelector('button')).toBeNull();
    });
  });

  describe('tooltip (Law 17)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('resolves its description from the registry, not from inline copy', () => {
      const definition = getFactionDefinition(FACTION_DEF_ID);
      expect(definition, 'fixture must name a shipped definition').not.toBeNull();

      render(<OverviewTab card={card()} onOpenFaction={vi.fn()} />);

      fireEvent.pointerEnter(within(factionSection()).getByText(FACTION_NAME));
      act(() => {
        vi.advanceTimersByTime(TOOLTIP_DELAY_MS);
      });

      const tooltip = screen.getByRole('tooltip');
      // Sourced from the definition — this is the link under test. The label is
      // the faction's own name (data the card carries); the description is the
      // registry's.
      expect(tooltip).toHaveTextContent(definition!.description);
      expect(tooltip).toHaveTextContent(FACTION_NAME);
    });

    it('offers no hover at all when the definition is unknown', () => {
      // A tooltip that opens empty is worse than none: it advertises depth the
      // surface cannot deliver.
      expect(resolveTooltip('faction.no_such_definition')).toBeNull();

      render(<OverviewTab card={card({ factionDefId: 'no_such_definition' })} onOpenFaction={vi.fn()} />);

      fireEvent.pointerEnter(within(factionSection()).getByText(FACTION_NAME));
      act(() => {
        vi.advanceTimersByTime(TOOLTIP_DELAY_MS);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('heraldry (Laws 3, 4)', () => {
    it('renders a designed tile through the shared resolver even with no graph', () => {
      render(<OverviewTab card={card()} onOpenFaction={vi.fn()} />);

      const heraldry = within(factionSection()).getByTestId('faction-heraldry');
      // No graph and no shipped sigil for this id — the resolver must land on
      // its designed fallback tier, never a broken image (Law 4). The tier is
      // asserted directly rather than inferred from the absence of an `<img>`,
      // so a future art hookup fails this loudly instead of drifting past it.
      expect(heraldry).toHaveAttribute('data-entity-visual-tier', 'fallback');
      expect(heraldry.querySelector('img')).toBeNull();
      expect(heraldry).toHaveAttribute('title', FACTION_NAME);
    });

    it('replaces the ad-hoc glyph prefix rather than sitting beside it (Law 3)', () => {
      const glyph = '⚔';
      render(<OverviewTab card={card({ factionIconGlyph: glyph })} onOpenFaction={vi.fn()} />);

      // The name itself must no longer carry a hand-prefixed glyph string; one
      // resolver owns this representation class now.
      const control = factionControl();
      expect(control.textContent).toBe(FACTION_NAME);
      expect(control.textContent).not.toContain(glyph);
    });
  });
});
