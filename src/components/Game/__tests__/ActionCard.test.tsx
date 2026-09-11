// @vitest-environment jsdom
/**
 * ActionCard — the one card face (THR-1002).
 *
 * Rewritten from the two-size suite (`hand` / `focused`) that pinned a card no
 * longer in the game. Almost every arm it held asserted something the grammar now
 * forbids: the numeral cost badge, the `IRON · CREATE` type line, `{n} hex`, the
 * `technicalDescription` block, the dispatch pulse and its spent overlay. Pinning
 * those would be pinning the defects.
 *
 * What carried over is the *purpose* of each: a card names its action, says what it
 * does, shows what it costs, dims with a reason when it cannot be played, and fires
 * only when it can. Those are all here, asserted against the face that shipped.
 *
 * The suite's centre of gravity is the two Laws the retired card broke wholesale —
 * **13** (no numerals) and **14** (no raw keys). Those are asserted over the card's
 * whole rendered text rather than zone by zone, so a numeral reaching *any* future
 * zone fails rather than only the zones someone remembered to check.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionCard } from '../ActionCard';
import { ACTION_BLOCKED_OUT_OF_RANGE, ACTION_BLOCKED_TIER, ACTION_BLOCKED_GENERIC } from '../../../data/action-card-display';
import { CARD_CHIP_ROW_GAP_PX } from '../../shared/CardFace';
import type { WheelSlot } from '../../../engine/wheel';

const baseSlot: WheelSlot = {
  id: 'target_action_action.imbue',
  templateId: 'action.imbue',
  label: 'Imbue',
  type: 'target_action',
  angleDeg: 45,
  available: true,
  lockedReason: null,
  essenceCost: 3,
  sphere: 'mind',
  interventionType: null,
  rangeStatus: 'in_range',
  hexDistance: 2,
  description: 'Presses a sliver of your nature into an artifact',
  effectsLine: 'Wakes a power in an artifact, shaped by your sphere.',
  crudType: 'update',
  reach: 'iron',
  scale: 'local',
  scaleWord: 'Local',
  forecastTier: 'favorable',
  rarityTier: 2,
};

function slot(overrides: Partial<WheelSlot> = {}): WheelSlot {
  return { ...baseSlot, ...overrides };
}

/** Everything the card renders, as one string — the surface a player reads. */
function cardText(s: WheelSlot = baseSlot): string {
  const { container } = render(<ActionCard slot={s} onClick={vi.fn()} />);
  return container.textContent ?? '';
}

describe('ActionCard — what the card says', () => {
  it('names the action, preferring the spell name', () => {
    render(<ActionCard slot={slot({ spellName: 'Quicken the Iron' })} onClick={vi.fn()} />);
    expect(screen.getByText('Quicken the Iron')).toBeTruthy();
  });

  it('falls back to the label when there is no spell name', () => {
    render(<ActionCard slot={slot()} onClick={vi.fn()} />);
    expect(screen.getByText('Imbue')).toBeTruthy();
  });

  it('prints the effect line, and not the technical description', () => {
    // Prose Doctrine v2 + Law 16: the card's one line is its effect. The
    // description is the codex page's job, and the retired card printed both.
    const text = cardText(slot({ technicalDescription: 'Applies an artifactPower property.' }));
    expect(text).toContain('Wakes a power in an artifact');
    expect(text).not.toContain('artifactPower');
  });

  it('prints the verb as a word, and the scale beside it', () => {
    const text = cardText();
    expect(text).toContain('Change');   // crudType 'update' → the player's word
    expect(text).toContain('Local');
  });

  it('files a sustained action under Control, whatever it changes', () => {
    // A sustained action is an arrangement rather than an act — the card the
    // player recognises by its upkeep row — so it earns its own verb.
    const text = cardText(slot({ durationMode: 'sustained', upkeepWord: 'steady' }));
    expect(text).toContain('Control');
    expect(text).not.toContain('Change');
  });

  it('states upkeep as a band, never a rate', () => {
    const text = cardText(slot({
      durationMode: 'sustained',
      upkeepWord: 'heavy',
      perTickCostLabel: '0.5 force/tick',
    }));
    expect(text).toContain('heavy upkeep');
    expect(text).not.toContain('0.5');
    expect(text).not.toContain('/tick');
  });

  it('prints the forecast tier word when the slot carries one', () => {
    expect(screen.queryByText('favorable')).toBeNull();
    render(<ActionCard slot={slot()} onClick={vi.fn()} />);
    expect(screen.getByText('favorable')).toBeTruthy();
  });

  it('renders no odds zone at all when no capability was supplied', () => {
    // Omitted, never guessed. A card showing `uncertain` by default would be
    // making a claim nobody computed.
    const bare = slot();
    delete (bare as { forecastTier?: string }).forecastTier;
    const { container } = render(<ActionCard slot={bare} onClick={vi.fn()} />);
    expect(container.querySelector('[data-forecast-tier]')).toBeNull();
  });
});

describe('ActionCard — Law 13 (no numerals) and Law 14 (no raw keys)', () => {
  it('shows no digit anywhere on a fully-populated card', () => {
    // The whole surface, not a zone list: the retired card leaked numerals from
    // four separate zones, and three of them were added after the first was fixed.
    const text = cardText(slot({
      essenceCost: 3,
      hexDistance: 4,
      rarityTier: 3,
      maxStepDifficulty: 0.5,
      effectiveStepDifficulty: 0.25,
      perTickCostLabel: '0.5 force/tick',
      durationMode: 'sustained',
      upkeepWord: 'steady',
    }));
    expect(text).not.toMatch(/\d/);
  });

  it('shows no percentage and no hex count on a dimmed out-of-range card', () => {
    const text = cardText(slot({
      available: false,
      rangeStatus: 'out_of_range',
      hexDistance: 7,
      lockedReason: 'Out of range (7 hexes)',
    }));
    expect(text).not.toMatch(/\d/);
    expect(text.toLowerCase()).not.toContain('hex');
    expect(text).toContain(ACTION_BLOCKED_OUT_OF_RANGE);
  });

  it('never prints the schema type line the slot id used to be split into', () => {
    const text = cardText();
    // `IRON · CREATE` and friends — a developer's axis, printed at the player.
    expect(text).not.toMatch(/[A-Z]{3,}\s·\s[A-Z]{3,}/);
  });

  it('speaks the CRUD axis in the player\'s words, not the schema\'s', () => {
    expect(cardText(slot({ crudType: 'read' }))).toContain('Find');
    expect(cardText(slot({ crudType: 'read' }))).not.toContain('read');
    expect(cardText(slot({ crudType: 'delete' }))).toContain('Destroy');
  });
});

describe('ActionCard — Law 25 (a dimmed card says why)', () => {
  it('turns a tier requirement into words', () => {
    const text = cardText(slot({ available: false, lockedReason: 'Requires tier 2' }));
    expect(text).toContain(ACTION_BLOCKED_TIER);
    expect(text).not.toMatch(/\d/);
  });

  it('keeps a producer\'s own wording when it carries no numeral', () => {
    const text = cardText(slot({ available: false, lockedReason: 'Not enough mind essence' }));
    expect(text).toContain('Not enough mind essence');
  });

  it('falls back to a vaguer true sentence rather than leaking an unknown numeral', () => {
    // The structural guard: a reason shape nobody anticipated loses precision,
    // never the law. This is what stops the next producer re-opening Law 13.
    const text = cardText(slot({
      available: false,
      lockedReason: 'Blocked for 12 more turns by the Accord',
    }));
    expect(text).toContain(ACTION_BLOCKED_GENERIC);
    expect(text).not.toMatch(/\d/);
  });

  it('says nothing about being blocked while the card is playable', () => {
    expect(cardText()).not.toContain(ACTION_BLOCKED_GENERIC);
  });
});

describe('ActionCard — the card is a button (Laws 23, 48)', () => {
  it('fires the click handler when the card can be played', () => {
    const onClick = vi.fn();
    render(<ActionCard slot={slot()} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('action-card-target_action_action.imbue'));
    expect(onClick).toHaveBeenCalledWith('target_action_action.imbue');
  });

  it('is disabled, not merely unresponsive, while its cast is in flight', () => {
    const onClick = vi.fn();
    render(<ActionCard slot={slot()} onClick={onClick} playing />);
    const button = screen.getByTestId('action-card-target_action_action.imbue') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('reports the armed state through aria-pressed', () => {
    const { rerender } = render(<ActionCard slot={slot()} onClick={vi.fn()} />);
    const testId = 'action-card-target_action_action.imbue';
    expect(screen.getByTestId(testId).getAttribute('aria-pressed')).toBe('false');
    rerender(<ActionCard slot={slot()} onClick={vi.fn()} selected />);
    expect(screen.getByTestId(testId).getAttribute('aria-pressed')).toBe('true');
  });

  it('drops the play affordance when the card is pure display', () => {
    // The Ascendant Beat unlock reveal (THR-639) shows a card being *given*.
    const onClick = vi.fn();
    render(<ActionCard slot={slot()} onClick={onClick} interactive={false} />);
    fireEvent.click(screen.getByTestId('action-card-target_action_action.imbue'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('ActionCard — Law 21 (a named concept reaches its page)', () => {
  it('links the name to the codex entry, by template id', () => {
    const onOpenCodexEntry = vi.fn();
    render(<ActionCard slot={slot()} onClick={vi.fn()} onOpenCodexEntry={onOpenCodexEntry} />);
    fireEvent.click(screen.getByTestId('action-card-name-link-target_action_action.imbue'));
    expect(onOpenCodexEntry).toHaveBeenCalledWith('action.imbue');
  });

  it('renders the name as plain text when there is no page to reach', () => {
    // *Where a page exists* — never a dead link. A slot with no template id has
    // no codex entry to open.
    const bare = slot();
    delete (bare as { templateId?: string }).templateId;
    const { container } = render(
      <ActionCard slot={bare} onClick={vi.fn()} onOpenCodexEntry={vi.fn()} />,
    );
    expect(container.querySelector('[data-testid^="action-card-name-link-"]')).toBeNull();
  });
});

describe('ActionCard — Law 37 (the ending wears the card\'s chrome)', () => {
  it('wears the fate word of its own last cast', () => {
    render(<ActionCard slot={slot()} onClick={vi.fn()} resolvedBand="surge" />);
    expect(screen.getByText('triumphed')).toBeTruthy();
  });

  it('wears nothing when the action has not resolved', () => {
    expect(cardText()).not.toContain('triumphed');
  });
});

describe('ActionCard — rarity', () => {
  it('shows the rarity badge for Storied and above', () => {
    render(<ActionCard slot={slot({ rarityTier: 2 })} onClick={vi.fn()} />);
    expect(screen.getByTestId('action-card-rarity-target_action_action.imbue')).toBeTruthy();
  });

  it('shows no badge for Mundane', () => {
    const { container } = render(<ActionCard slot={slot({ rarityTier: 1 })} onClick={vi.fn()} />);
    expect(container.querySelector('[data-testid^="action-card-rarity-"]')).toBeNull();
  });
});

describe('ActionCard — THR-1464: the chip row wraps instead of overlapping', () => {
  /**
   * The defect, measured on the deployed build at 1920×1080 before the fix:
   * `Agent Thread`'s chip row needed 315px of content in a 184px row (keyword 94 +
   * gap 4 + scale 77 + gap 6 + right group 134). The grouping span holding the two
   * chips carries `min-width: 0`, so it absorbed the whole 131px deficit and shrank
   * to 44px — and because its chips are `inline-flex` + `white-space: nowrap` with
   * visible overflow, they kept painting past its edge, straight through the price.
   * The scale chip overlapped the price badge by its full 77px width.
   *
   * jsdom has no layout engine, so the *pixel* proof lives in the ticket (a Playwright
   * re-measure of the live surface with these exact declarations injected took every
   * overlap to zero area). What this suite pins is the three declarations that proof
   * depended on — each one falsified below by the shape that made the row collapse.
   */

  /** The row is the parent of the group that holds the keyword chip. */
  function chipRow(container: HTMLElement): HTMLElement {
    const kw = container.querySelector('[data-testid^="action-card-keyword-"]');
    if (!kw) throw new Error('no keyword chip rendered — fixture no longer reaches the chip row');
    // keyword → (tooltip wrapper?) → grouping span → row
    let el = kw.parentElement;
    while (el && !(el.tagName === 'DIV' && el.style.justifyContent === 'space-between')) {
      el = el.parentElement;
    }
    if (!el) throw new Error('chip row not found above the keyword chip');
    return el;
  }

  /** The two-chip card is the failing shape: it is the only one with a grouping span. */
  const twoChipSlot = slot({ scale: 'cosmic', scaleWord: 'Cosmic', essenceCost: 10 });

  it('renders the failing shape — two chips and an overflowing price', () => {
    // Falsification guard: if the fixture ever stops producing both chips, every
    // assertion below would pass vacuously against a row that cannot overflow.
    const { container } = render(<ActionCard slot={twoChipSlot} onClick={vi.fn()} />);
    expect(container.querySelector('[data-testid^="action-card-keyword-"]')).toBeTruthy();
    expect(container.querySelector('[data-testid^="action-card-scale-"]')).toBeTruthy();
    const cost = container.querySelector('[data-testid^="action-card-cost-"]') as HTMLElement;
    // The price is shown IN FULL — six pips plus the overflow glyph, never ellipsised
    // away. Wrapping is what buys the room for it (the ticket's explicit choice).
    expect(cost.textContent).toBe('✦'.repeat(6) + '⋯');
  });

  it('lets the row wrap, so content that will not fit takes a second line', () => {
    const { container } = render(<ActionCard slot={twoChipSlot} onClick={vi.fn()} />);
    const row = chipRow(container);
    expect(row.style.flexWrap).toBe('wrap');
    // `nowrap` is precisely what forced the collapse — pin its absence, not merely
    // the presence of a value.
    expect(row.style.flexWrap).not.toBe('nowrap');
  });

  it('keeps the price against the right edge on a wrapped line', () => {
    // `justify-content: space-between` does not right-align a line holding one item,
    // so without this the price would pack to the left when it wraps.
    const { container } = render(<ActionCard slot={twoChipSlot} onClick={vi.fn()} />);
    const cost = container.querySelector('[data-testid^="action-card-cost-"]') as HTMLElement;
    const rightGroup = cost.parentElement as HTMLElement;
    expect(rightGroup.style.marginLeft).toBe('auto');
    expect(rightGroup.style.flexShrink).toBe('0');
  });

  it('lets the chip group itself wrap, so min-width:0 can no longer shrink it under its chips', () => {
    const { container } = render(<ActionCard slot={twoChipSlot} onClick={vi.fn()} />);
    const kw = container.querySelector('[data-testid^="action-card-keyword-"]') as HTMLElement;
    const row = chipRow(container);
    let group = kw.parentElement as HTMLElement;
    while (group.parentElement !== row) group = group.parentElement as HTMLElement;
    // Both halves of the defect, asserted together: the group may still shrink
    // (min-width: 0), but it may no longer do so while forbidding its chips to wrap.
    expect(group.style.minWidth).toBe('0px');
    expect(group.style.flexWrap).toBe('wrap');
  });

  it('uses one gap for both axes, so a wrapped row reads as one strip', () => {
    const { container } = render(<ActionCard slot={twoChipSlot} onClick={vi.fn()} />);
    const row = chipRow(container);
    expect(row.style.rowGap).toBe(`${CARD_CHIP_ROW_GAP_PX}px`);
    expect(row.style.gap).toContain(`${CARD_CHIP_ROW_GAP_PX}px`);
  });
});
