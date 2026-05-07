// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AscendantHand } from '../AscendantHand';
import type {
  AscendantHandPartition,
  HandFilterDimmedEntry,
  HandFilterPlayableEntry,
} from '../../../../engine/encounters/handFilter';
import type {
  ActionScale,
  AttentionTier,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import type { RarityTier } from '../../../../types/rarity';

function makeTemplate(overrides: Partial<UnifiedActionTemplate>): UnifiedActionTemplate {
  return {
    id: overrides.id ?? 'tmpl',
    rarityTier: (overrides.rarityTier ?? 'common') as RarityTier,
    intrinsicTier: (overrides.intrinsicTier ?? 'visible') as AttentionTier,
    name: overrides.name ?? 'Send a sign',
    reach: overrides.reach ?? 'heart',
    crudType: overrides.crudType ?? 'update',
    scale: (overrides.scale ?? 'agent') as ActionScale,
    steps: overrides.steps ?? [],
    apCost: overrides.apCost ?? 0,
    actorAffinities: overrides.actorAffinities ?? [],
    essenceCost: overrides.essenceCost,
    description: overrides.description,
    sphereAffinity: overrides.sphereAffinity,
    ...overrides,
  } as UnifiedActionTemplate;
}

function makePartition(
  overrides: Partial<AscendantHandPartition> = {},
): AscendantHandPartition {
  return {
    playable: overrides.playable ?? [],
    dimmed: overrides.dimmed ?? [],
    hidden: overrides.hidden ?? [],
    rarePulses: overrides.rarePulses ?? [],
  };
}

function playable(template: UnifiedActionTemplate): HandFilterPlayableEntry {
  return { template };
}

function dimmed(
  template: UnifiedActionTemplate,
  message: string,
): HandFilterDimmedEntry {
  return {
    template,
    prereq: { stage: 'cost_availability', code: 'cost_unavailable', message },
  };
}

const SEND_A_SIGN = makeTemplate({
  id: 'divine.omen',
  name: 'Send a sign',
  description: 'cast unease · tilts dispositions soft',
  essenceCost: 2,
  reach: 'heart',
});

const VEIL_THE_TRADER = makeTemplate({
  id: 'divine.deceive',
  name: "Veil the trader's cargo",
  description: 'one beat of cover for the trader',
  essenceCost: 2,
  reach: 'veil',
});

const MARK_WITH_FATE = makeTemplate({
  id: 'divine.coincidence',
  name: 'Mark her with fate',
  description: 'this scene becomes biographical',
  essenceCost: 4,
  reach: 'star',
});

const STILL_THE_GUARD = makeTemplate({
  id: 'divine.compel.still',
  name: 'Still the guard',
  description: 'his hand pauses before it falls',
  essenceCost: 3,
  reach: 'iron',
});

function renderInViewport(node: React.ReactElement) {
  return render(<div style={{ width: 1920, height: 1080 }}>{node}</div>);
}

describe('AscendantHand', () => {
  it('renders the empty state when no playable or dimmed cards exist', () => {
    renderInViewport(<AscendantHand partition={makePartition()} />);
    expect(screen.getByTestId('ascendant-hand-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('ascendant-hand-list')).not.toBeInTheDocument();
  });

  it('renders playable cards bright and dimmed cards at 0.35 opacity with prereq line', () => {
    const partition = makePartition({
      playable: [playable(SEND_A_SIGN)],
      dimmed: [dimmed(MARK_WITH_FATE, 'sphere attunement missing')],
    });
    renderInViewport(<AscendantHand partition={partition} />);

    const playableCard = screen.getByTestId('ascendant-hand-card-divine.omen');
    expect(playableCard).toHaveStyle({ opacity: '1' });
    expect(playableCard).toHaveAttribute('data-state', 'playable');
    expect(playableCard).toHaveAttribute('role', 'button');
    expect(playableCard).toHaveAttribute('aria-disabled', 'false');

    const dimmedCard = screen.getByTestId('ascendant-hand-card-divine.coincidence');
    expect(dimmedCard).toHaveStyle({ opacity: '0.35' });
    expect(dimmedCard).toHaveAttribute('data-state', 'dimmed');
    expect(dimmedCard).toHaveAttribute('aria-disabled', 'true');
    expect(dimmedCard).toHaveAttribute('title', 'sphere attunement missing');
    expect(
      screen.getByTestId('ascendant-hand-card-prereq-divine.coincidence'),
    ).toHaveTextContent('sphere attunement missing');
  });

  it('orders playable cards above dimmed cards regardless of partition order', () => {
    const partition = makePartition({
      playable: [playable(SEND_A_SIGN), playable(VEIL_THE_TRADER)],
      dimmed: [dimmed(MARK_WITH_FATE, 'cost too high')],
    });
    renderInViewport(<AscendantHand partition={partition} />);
    const list = screen.getByTestId('ascendant-hand-list');
    const ids = within(list)
      .getAllByTestId(/^ascendant-hand-card-divine\./)
      .map((el) => el.getAttribute('data-state'));
    expect(ids).toEqual(['playable', 'playable', 'dimmed']);
  });

  it('hides cards beyond defaultVisibleCount and reveals them via the disclosure', () => {
    const cards = [SEND_A_SIGN, VEIL_THE_TRADER, MARK_WITH_FATE, STILL_THE_GUARD];
    const partition = makePartition({
      playable: cards.map(playable),
    });
    renderInViewport(<AscendantHand partition={partition} />);

    expect(screen.getAllByRole('button', { name: /^(?!.*more)/ })).toHaveLength(3);
    const disclosure = screen.getByTestId('ascendant-hand-disclosure');
    expect(disclosure).toHaveTextContent(/\+ 1 more/);
    fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByTestId(`ascendant-hand-card-${STILL_THE_GUARD.id}`),
    ).toBeInTheDocument();
  });

  it('omits the disclosure when the visible count covers the whole list', () => {
    const partition = makePartition({
      playable: [SEND_A_SIGN, VEIL_THE_TRADER].map(playable),
    });
    renderInViewport(<AscendantHand partition={partition} />);
    expect(screen.queryByTestId('ascendant-hand-disclosure')).not.toBeInTheDocument();
  });

  it('fires onPlay with the template id on click for playable cards only', () => {
    const onPlay = vi.fn();
    const partition = makePartition({
      playable: [playable(SEND_A_SIGN)],
      dimmed: [dimmed(MARK_WITH_FATE, 'cost too high')],
    });
    renderInViewport(<AscendantHand partition={partition} onPlay={onPlay} />);

    fireEvent.click(screen.getByTestId('ascendant-hand-card-divine.omen'));
    expect(onPlay).toHaveBeenCalledWith('divine.omen');

    fireEvent.click(screen.getByTestId('ascendant-hand-card-divine.coincidence'));
    expect(onPlay).toHaveBeenCalledTimes(1); // dimmed card did not fire
  });

  it('activates onPlay via Enter and Space keypresses on playable cards', () => {
    const onPlay = vi.fn();
    const partition = makePartition({ playable: [playable(SEND_A_SIGN)] });
    renderInViewport(<AscendantHand partition={partition} onPlay={onPlay} />);
    const card = screen.getByTestId('ascendant-hand-card-divine.omen');
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(onPlay).toHaveBeenCalledTimes(2);
  });

  it('marks rare cards via data-rare and the pulse-rare class', () => {
    const partition = makePartition({
      playable: [playable(MARK_WITH_FATE)],
      rarePulses: ['divine.coincidence'],
    });
    renderInViewport(<AscendantHand partition={partition} />);
    const card = screen.getByTestId('ascendant-hand-card-divine.coincidence');
    expect(card).toHaveAttribute('data-rare', 'true');
    expect(card.className).toContain('pulse-rare');
  });

  it('renders the +N NEW header badge when newCardIds intersects the hand', () => {
    const partition = makePartition({
      playable: [playable(SEND_A_SIGN), playable(MARK_WITH_FATE)],
    });
    renderInViewport(
      <AscendantHand
        partition={partition}
        newCardIds={new Set(['divine.coincidence'])}
      />,
    );
    expect(screen.getByTestId('ascendant-hand-new-badge')).toHaveTextContent(/\+1 new/i);
  });

  it('omits the NEW badge when newCardIds is empty or absent', () => {
    const partition = makePartition({ playable: [playable(SEND_A_SIGN)] });
    renderInViewport(<AscendantHand partition={partition} />);
    expect(screen.queryByTestId('ascendant-hand-new-badge')).not.toBeInTheDocument();
  });

  it('does not render hidden entries from the partition', () => {
    const partition = makePartition({
      playable: [playable(SEND_A_SIGN)],
      hidden: [
        {
          template: VEIL_THE_TRADER,
          hiddenReason: { stage: 'target_match', code: 'target_mismatch' },
        },
      ],
    });
    renderInViewport(<AscendantHand partition={partition} />);
    expect(
      screen.queryByTestId('ascendant-hand-card-divine.deceive'),
    ).not.toBeInTheDocument();
  });

  it('renders snapshots at 1920x1080 for the three card-count boundaries (0 / 3 / 7+) plus dimmed-only', () => {
    const seven = [
      makeTemplate({ id: 'a', name: 'Send a sign', essenceCost: 2, reach: 'heart' }),
      makeTemplate({ id: 'b', name: "Veil the trader's cargo", essenceCost: 2, reach: 'veil' }),
      makeTemplate({ id: 'c', name: 'Still the guard', essenceCost: 3, reach: 'iron' }),
      makeTemplate({ id: 'd', name: 'Speak through Eira', essenceCost: 2, reach: 'eye' }),
      makeTemplate({ id: 'e', name: 'Sharpen her sight', essenceCost: 1, reach: 'eye' }),
      makeTemplate({ id: 'f', name: 'Steady her hands', essenceCost: 1, reach: 'iron' }),
      makeTemplate({ id: 'g', name: 'Mark her with fate', essenceCost: 4, reach: 'star' }),
    ];

    const empty = renderInViewport(<AscendantHand partition={makePartition()} />);
    expect(empty.asFragment()).toMatchSnapshot('0 cards (empty)');
    empty.unmount();

    const three = renderInViewport(
      <AscendantHand
        partition={makePartition({ playable: seven.slice(0, 3).map(playable) })}
      />,
    );
    expect(three.asFragment()).toMatchSnapshot('3 cards (no disclosure)');
    three.unmount();

    const sevenPlus = renderInViewport(
      <AscendantHand
        partition={makePartition({
          playable: seven.map(playable),
          rarePulses: ['g'],
        })}
      />,
    );
    expect(sevenPlus.asFragment()).toMatchSnapshot('7 cards (with disclosure + rare)');
    sevenPlus.unmount();

    const dimmedOnly = renderInViewport(
      <AscendantHand
        partition={makePartition({
          dimmed: [
            dimmed(seven[0], 'not enough essence for this move'),
            dimmed(seven[1], 'sphere attunement missing'),
          ],
        })}
      />,
    );
    expect(dimmedOnly.asFragment()).toMatchSnapshot('dimmed cards only');
  });
});
