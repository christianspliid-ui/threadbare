// @vitest-environment jsdom
/**
 * Stone virtue word render assertions (THR-1135).
 *
 * The rename Dependable → Careful lives in one cell of the canonical axis
 * registry, and every player-facing surface is supposed to derive from it. These
 * assertions prove that derivation actually reaches the DOM on the surface where
 * Christian saw the defect — the character sheet's Personality section, which
 * showed the chips `Disloyal` (Heart) and `Dependable` (Stone) side by side.
 *
 * Two independent paths render the word and both are asserted, because a rename
 * that fixed only one would still read as the same contradiction:
 *   1. the emergent trait **chip**, whose name comes from the trait definition
 *      node built off the registry (`PERSONALITY_TRAIT_DEFINITIONS`), and
 *   2. the moral-axis **pole label**, which OverviewTab reads straight off
 *      `CANONICAL_AXES`.
 *
 * The chip fixture deliberately takes its name from the real definition node
 * rather than a hardcoded string, so the test exercises registry → definition →
 * display → DOM instead of restating the literal in a second place.
 *
 * These stand in for the contractual 1920×1080 capture, which no unattended run
 * can produce (impediment #546 — `preview_start` is refused with nobody present
 * to approve it). They cover that the word reached the surface; they do not
 * cover what only pixels can (paint, overflow, z-index, off-viewport).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewTab } from '../OverviewTab';
import type { AgentInfoCardData, PersonalityTraitDisplay } from '../../../../engine/agentDetail';
import { PERSONALITY_TRAIT_DEFINITIONS } from '../../../../data/personality-trait-content';
import { CANONICAL_AXES } from '../../../../types/axisRegistry';

/** The registry-derived definition node behind the Stone virtue chip. */
const STONE_VIRTUE_DEF = PERSONALITY_TRAIT_DEFINITIONS.find(
  (n) => n.id === 'trait.personality.stone.virtue',
)!;

function stoneVirtueChip(): PersonalityTraitDisplay {
  return {
    id: STONE_VIRTUE_DEF.id,
    // Sourced from the definition node, not typed literally — this is the link
    // under test.
    name: STONE_VIRTUE_DEF.name,
    pole: 'virtue',
    reach: 'stone',
    flavorText: (STONE_VIRTUE_DEF.properties as { flavorText?: string }).flavorText,
  };
}

/**
 * Minimum card that opens the Personality section: intimate knowledge, one
 * emergent trait, and a Stone axis position past `AXIS_SIGNAL_EPSILON` (0.1) so
 * the axis row renders its pole labels.
 */
function cardWithStoneVirtue(): AgentInfoCardData {
  return {
    name: 'Sevrin',
    knowledgeLevel: 'intimate',
    personalityTraits: [stoneVirtueChip()],
    axiologicalProfile: { preservation_transformation: 0.9 },
  } as unknown as AgentInfoCardData;
}

describe('OverviewTab — Stone virtue word (THR-1135)', () => {
  it('renders the emergent Stone virtue chip as "Careful"', () => {
    render(<OverviewTab card={cardWithStoneVirtue()} />);

    const chips = screen.getAllByTestId('personality-trait');
    expect(chips.map((c) => c.textContent)).toContain('Careful');
  });

  it('renders the Stone moral-axis virtue pole label as "Careful"', () => {
    render(<OverviewTab card={cardWithStoneVirtue()} />);

    // Both the chip and the pole label read "Careful" — the point of the rename
    // is that they agree, so assert the pole label is present alongside the chip
    // rather than asserting a unique match.
    expect(screen.getAllByText('Careful').length).toBeGreaterThanOrEqual(2);
    // The vice pole is untouched by this ticket and must still render.
    expect(screen.getByText('Reckless')).toBeInTheDocument();
  });

  it('renders "Dependable" nowhere on the sheet', () => {
    const { container } = render(<OverviewTab card={cardWithStoneVirtue()} />);

    expect(container.textContent).not.toMatch(/Dependable/i);
  });
});

describe('axis registry — Stone virtue word is the single source (THR-1135)', () => {
  it('carries Careful on the registry, with Keeper and the vice pole unchanged', () => {
    const stone = CANONICAL_AXES.find((a) => a.reachDomain === 'stone')!;

    expect(stone.virtue).toEqual({ role: 'Keeper', word: 'Careful' });
    expect(stone.vice).toEqual({ role: 'Destroyer', word: 'Reckless' });
  });

  it('propagates the word to the trait definition node without changing its id', () => {
    // The id is what save data and grant/release logic key on — a rename that
    // moved it would be a migration, and this ticket is display-only.
    expect(STONE_VIRTUE_DEF.id).toBe('trait.personality.stone.virtue');
    expect(STONE_VIRTUE_DEF.name).toBe('Careful');
  });
});
