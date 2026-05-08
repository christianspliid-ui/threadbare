// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  EncounterScreen,
} from '../EncounterScreen';
import { EncounterChoiceCard } from '../EncounterChoiceCard';
import { OutcomeForecastBand } from '../OutcomeForecastBand';
import { AscendantHand, type AscendantHandPartitionView } from '../AscendantHand';
import { CastRail } from '../CastRail';
import type { EncounterHeroPanelData } from '../EiraHeroPanel';
import type { EncounterChoiceContract } from '../../../../types/encounter-contract';
import type { UnifiedActionTemplate } from '../../../../types/unifiedAction';
import type {
  HandFilterPlayableEntry,
  HandFilterDimmedEntry,
} from '../../../../engine/encounters/handFilter';
import type { CastTileData } from '../CastTile';

function renderInViewport(node: React.ReactElement, width = 1920, height = 1080) {
  return render(
    <div style={{ width, height }}>{node}</div>,
  );
}

const heroPanelData: EncounterHeroPanelData = {
  name: 'Eira of Bren',
  subtitle: 'IRON - DRAWN BOND - 28 WINTERS',
  statusLine: 'steady, but reading the room',
  capabilities: [
    {
      id: 'force',
      label: 'Force',
      sphereLabel: 'IRON',
      filledDots: 3,
      narrativeHint: 'a steady arm in a tight queue',
      accentColor: 'var(--sphere-force-bright)',
    },
    {
      id: 'mind',
      label: 'Mind',
      sphereLabel: 'EYE',
      filledDots: 3,
      narrativeHint: 'she misses little',
      accentColor: 'var(--sphere-mind-bright)',
    },
    {
      id: 'spirit',
      label: 'Spirit',
      sphereLabel: 'HEART',
      filledDots: 5,
      narrativeHint: 'her deepest thread',
      accentColor: 'var(--sphere-spirit-bright)',
    },
  ],
  items: [
    {
      id: 'captain-token',
      title: "Captain's token",
      detail: 'small favor - civic guard remembers her',
    },
  ],
  activeVow: {
    title: 'Vow to the small folk',
    detail: 'she will not crush a frightened man',
  },
  recentMoments: [
    {
      id: 'echo-1',
      title: 'Iron market in winter',
      detail: 'Veiren tested her patience in the open queue.',
    },
  ],
};

const sampleChoice: EncounterChoiceContract = {
  reach: 'iron',
  cost: 'fuller_breath',
  god_verb: 'Stir her resolve.',
  agent_reaction:
    "Her shoulders set. She closes the distance and meets Veiren's eye.",
  tilts_toward: 'a wound, a debt, or his favour earned',
  moral_axis_pole: 'conqueror',
  fail_forward: 'she draws steel and the queue splinters',
  consumes_item: 'captain-token',
};

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

function fullHand(): AscendantHandPartitionView {
  return {
    playable: [playable('a'), playable('b'), playable('c')],
    dimmed: [dimmed('d')],
    hidden: [],
    rarePulses: ['c'],
  };
}

function fullRightRail() {
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: '1fr 1fr', gap: 8 }}>
      <CastRail cast={[
        castEntry('a', 'primary'),
        castEntry('b', 'background'),
        castEntry('c', 'offstage'),
      ]}
      />
      <AscendantHand hand={fullHand()} newlyAvailableCount={1} />
    </div>
  );
}

function fullCenterColumn() {
  return (
    <div style={{ padding: 12, display: 'grid', gap: 10 }}>
      <EncounterChoiceCard choice={sampleChoice} selected />
      <EncounterChoiceCard
        choice={{
          ...sampleChoice,
          reach: 'charm',
          moral_axis_pole: 'caregiver',
          consumes_item: null,
          god_verb: 'Lay a gentler hand on the thread.',
        }}
        dimmed
      />
    </div>
  );
}

function fullBottomStrip() {
  return (
    <div style={{ padding: 8 }}>
      <OutcomeForecastBand
        successProbability={0.7}
        factors={[
          'the captain remembers her name',
          'the queue is restless tonight',
          'the lantern threads run thin',
        ]}
      />
    </div>
  );
}

describe('EncounterScreen layout snapshots', () => {
  it('matches snapshots for full 1920x1080 layout, minimum viable layout, and full 2560x1440 sample', () => {
    const { asFragment, rerender } = renderInViewport(
      <EncounterScreen
        heroPanel={heroPanelData}
        header={<div>BEAT 2 - NOW</div>}
        centerColumn={fullCenterColumn()}
        rightRail={fullRightRail()}
        bottomStrip={fullBottomStrip()}
      />,
    );
    expect(asFragment()).toMatchSnapshot('encounter-screen-full-1920x1080');

    rerender(
      <div style={{ width: 1920, height: 1080 }}>
        <EncounterScreen
          heroPanel={heroPanelData}
          centerColumn={<EncounterChoiceCard choice={sampleChoice} />}
          rightRail={<CastRail cast={[]} />}
          bottomStrip={<OutcomeForecastBand successProbability={null} factors={[]} />}
        />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('encounter-screen-minimum-1920x1080');

    rerender(
      <div style={{ width: 2560, height: 1440 }}>
        <EncounterScreen
          heroPanel={heroPanelData}
          header={<div>BEAT 2 - NOW</div>}
          centerColumn={fullCenterColumn()}
          rightRail={fullRightRail()}
          bottomStrip={fullBottomStrip()}
        />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('encounter-screen-2560x1440');
  });
});
