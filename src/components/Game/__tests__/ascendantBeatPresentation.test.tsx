// @vitest-environment jsdom
/**
 * Contract tests for the beat modal's authored-presentation lookup (THR-613 Slice 3a).
 *
 * The regression these pin: Slices 2 and 2b authored per-reach Deepening vignettes and a
 * Milestone vignette, but the modal only consulted `SPINE_BEAT_PRESENTATION`, so every
 * Deepening rendered the same generic kind-derived card and the authored prose was dead
 * data. These tests fail if that wiring is dropped, and if the three id namespaces ever
 * collide (which would silently shadow one table with another).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AscendantBeatModal } from '../AscendantBeatModal';
import { SPINE_BEAT_PRESENTATION } from '../../../data/ascendant-beat-content';
import {
  DEEPENING_BEAT_PRESENTATION,
  ASCENDANT_DEEPENING_BEATS,
} from '../../../data/ascendant-deepening-beats';
import {
  MILESTONE_BEAT_PRESENTATION,
  ASCENDANT_MILESTONE_BEATS,
} from '../../../data/ascendant-milestone-beats';
import type { PendingBeat } from '../../../types/ascendantBeat';

function pendingFor(beatId: string, kind: PendingBeat['kind']): PendingBeat {
  return { beatId, kind, offeredTurn: 1 } as PendingBeat;
}

describe('AUTHORED_BEAT_PRESENTATION — id namespaces are disjoint', () => {
  it('no beat id appears in more than one authored table', () => {
    const ids = [
      ...Object.keys(SPINE_BEAT_PRESENTATION),
      ...Object.keys(DEEPENING_BEAT_PRESENTATION),
      ...Object.keys(MILESTONE_BEAT_PRESENTATION),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every Deepening beat definition has authored presentation', () => {
    for (const beat of ASCENDANT_DEEPENING_BEATS) {
      expect(DEEPENING_BEAT_PRESENTATION[beat.beatId]).toBeDefined();
    }
  });

  it('every Milestone beat definition has authored presentation', () => {
    for (const beat of ASCENDANT_MILESTONE_BEATS) {
      expect(MILESTONE_BEAT_PRESENTATION[beat.beatId]).toBeDefined();
    }
  });
});

describe('AscendantBeatModal — renders authored copy, not the kind placeholder', () => {
  it.each(ASCENDANT_DEEPENING_BEATS.map(b => b.beatId))(
    'Deepening %s renders its authored title + prose',
    (beatId) => {
      const authored = DEEPENING_BEAT_PRESENTATION[beatId];
      render(
        <AscendantBeatModal
          open
          pending={pendingFor(beatId, 'deepening')}
          onResolve={() => {}}
        />,
      );
      expect(screen.getByText(authored.title)).toBeInTheDocument();
      expect(screen.getByText(authored.prose)).toBeInTheDocument();
      // The generic placeholder must not survive alongside the authored vignette.
      expect(
        screen.queryByText(/the world has learned the shape of your will\./i),
      ).not.toBeInTheDocument();
    },
  );

  it('each Deepening reach renders distinct prose (not one shared card)', () => {
    const proseSet = new Set(
      ASCENDANT_DEEPENING_BEATS.map(b => DEEPENING_BEAT_PRESENTATION[b.beatId].prose),
    );
    expect(proseSet.size).toBe(ASCENDANT_DEEPENING_BEATS.length);
  });

  it.each(ASCENDANT_MILESTONE_BEATS.map(b => b.beatId))(
    'Milestone %s renders its authored title + prose',
    (beatId) => {
      const authored = MILESTONE_BEAT_PRESENTATION[beatId];
      render(
        <AscendantBeatModal
          open
          pending={pendingFor(beatId, 'milestone')}
          onResolve={() => {}}
        />,
      );
      expect(screen.getByText(authored.title)).toBeInTheDocument();
      expect(screen.getByText(authored.prose)).toBeInTheDocument();
    },
  );

  it('an uncatalogued beat id still falls back to kind-derived copy (fail-soft)', () => {
    render(
      <AscendantBeatModal
        open
        pending={pendingFor('beat.pool.not_authored_anywhere', 'investment')}
        onResolve={() => {}}
      />,
    );
    expect(screen.getByText(/something in the world stands ready/i)).toBeInTheDocument();
  });
});
