// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AscendantHand, type AscendantHandPartitionView } from '../AscendantHand';
import { CastRail } from '../CastRail';
import type { CastTileData } from '../CastTile';
import type { UnifiedActionTemplate } from '../../../../types/unifiedAction';
import type {
  HandFilterDimmedEntry,
  HandFilterPlayableEntry,
} from '../../../../engine/encounters/handFilter';

function makeTemplate(id: string, name: string): UnifiedActionTemplate {
  return {
    id,
    rarityTier: 1,
    intrinsicTier: 'background',
    name,
    reach: 'heart',
    crudType: 'update',
    scale: 'personal',
    steps: [{
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: 0.5,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
    }],
    apCost: 1,
    essenceCost: 2,
    actorAffinities: ['individual'],
    motivations: ['loyalty_ambition'],
    narrativeTemplates: {
      initiation: 'a quiet pressure',
      success: 'the thread holds',
      failure: 'the thread frays',
    },
    description: 'a divine nudge for this scene',
  };
}

function playable(id: string): HandFilterPlayableEntry {
  return { template: makeTemplate(id, `Card ${id}`) };
}

function dimmed(id: string): HandFilterDimmedEntry {
  return {
    template: makeTemplate(id, `Card ${id}`),
    prereq: {
      stage: 'place_gating',
      code: 'place_gated',
      message: 'available at sphere-aligned places',
    },
  };
}

function makeHand(overrides?: Partial<AscendantHandPartitionView>): AscendantHandPartitionView {
  return {
    playable: [],
    dimmed: [],
    hidden: [],
    rarePulses: [],
    ...overrides,
  };
}

function castEntry(id: string, priority: CastTileData['attentionPriority']): CastTileData {
  return {
    id,
    name: `Cast ${id}`,
    sphereLabel: 'IRON',
    roleInScene: 'witness',
    sceneDisposition: 'guarded',
    relationshipToHer: null,
    fallbackSentiment: 'a measured distance',
    attentionPriority: priority,
  };
}

describe('AscendantHand + CastRail (C3)', () => {
  it('renders 0 playable hand snapshot', () => {
    const { asFragment } = render(
      <div style={{ width: 1920, height: 1080 }}>
        <AscendantHand hand={makeHand()} />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders 3 playable hand snapshot', () => {
    const hand = makeHand({
      playable: [playable('a'), playable('b'), playable('c')],
    });
    const { asFragment } = render(
      <div style={{ width: 1920, height: 1080 }}>
        <AscendantHand hand={hand} newlyAvailableCount={1} />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders 7+ cards with disclosure and dimmed prereq snapshot', () => {
    const hand = makeHand({
      playable: [playable('a'), playable('b'), playable('c'), playable('d'), playable('e')],
      dimmed: [dimmed('f'), dimmed('g')],
      rarePulses: ['e'],
    });
    const { asFragment } = render(
      <div style={{ width: 1920, height: 1080 }}>
        <AscendantHand hand={hand} />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot();
    expect(screen.getByTestId('encounter-ascendant-hand-disclosure')).toBeInTheDocument();
  });

  it('commits only playable cards', () => {
    const onCommit = vi.fn();
    const hand = makeHand({
      playable: [playable('playable')],
      dimmed: [dimmed('dimmed')],
    });
    render(<AscendantHand hand={hand} onCommitTemplate={onCommit} />);

    fireEvent.click(screen.getByTestId('encounter-ascendant-card-playable-playable'));
    fireEvent.click(screen.getByTestId('encounter-ascendant-card-dimmed-dimmed'));

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('playable');
  });

  it('renders cast rail snapshots for 0/1/4/6 members', () => {
    const { asFragment, rerender } = render(
      <div style={{ width: 1920, height: 1080 }}>
        <CastRail cast={[]} />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('cast-0');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <CastRail cast={[castEntry('one', 'primary')]} />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('cast-1');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <CastRail cast={[
          castEntry('a', 'primary'),
          castEntry('b', 'primary'),
          castEntry('c', 'background'),
          castEntry('d', 'offstage'),
        ]}
        />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('cast-4');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <CastRail cast={[
          castEntry('a', 'primary'),
          castEntry('b', 'primary'),
          castEntry('c', 'background'),
          castEntry('d', 'background'),
          castEntry('e', 'offstage'),
          castEntry('f', 'offstage'),
        ]}
        />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('cast-6');
  });

  it('uses relationship resolver first, then falls back to edge sentiment', () => {
    render(
      <CastRail
        cast={[
          {
            ...castEntry('node', 'primary'),
            relationshipToHer: 'a debt and a winter ago',
            fallbackSentiment: 'ignored fallback',
          },
          {
            ...castEntry('edge', 'primary'),
            relationshipToHer: null,
            fallbackSentiment: 'uneasy ally',
          },
        ]}
      />,
    );

    expect(screen.getByTestId('encounter-cast-tile-relationship-node')).toHaveTextContent(
      'to her: a debt and a winter ago',
    );
    expect(screen.getByTestId('encounter-cast-tile-relationship-edge')).toHaveTextContent(
      'to her: uneasy ally',
    );
  });
});
