// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  ArchetypeDriftLanding,
  ConditionAttachmentLanding,
  EncounterSeedLanding,
  FactionLanding,
  HiddenMarkLanding,
  IntelligenceLanding,
  RecentEventLanding,
  ReputationScoreLanding,
  ReputationTallyLanding,
  SpawnArtifactLanding,
} from '../EffectRegistration';

function renderInViewport(node: React.ReactElement) {
  return render(<div style={{ width: 1920, height: 1080 }}>{node}</div>);
}

describe('EffectRegistration components — settled snapshots', () => {
  it('IntelligenceLanding renders mind-blue clue card', () => {
    const { asFragment } = renderInViewport(
      <IntelligenceLanding
        skipAnimation
        data={{
          label: 'CLUE · NEW',
          name: "The trader's satchel is sewn shut from the inside.",
          tail: 'eye · she will see it in him next time',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('ConditionAttachmentLanding renders spirit-violet pill', () => {
    const { asFragment } = renderInViewport(
      <ConditionAttachmentLanding
        skipAnimation
        data={{
          label: 'CONDITION',
          pillName: 'Sworn-witness',
          qualifier: 'she has spoken what she saw',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('ReputationTallyLanding renders cast tile pulse + new disposition', () => {
    const { asFragment } = renderInViewport(
      <ReputationTallyLanding
        skipAnimation
        data={{
          castLabel: 'CAPTAIN VEIREN',
          oldPhrase: 'wary, watching',
          newPhrase: 'cooled, watching',
          tail: 'iron · he marks her now',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('ReputationScoreLanding renders cast tile prose band swap', () => {
    const { asFragment } = renderInViewport(
      <ReputationScoreLanding
        skipAnimation
        data={{
          groupLabel: 'CIVIC GUARD OF BREN',
          oldBandWord: 'a quiet certainty',
          newBandWord: 'a name they remember',
          crossingNote: 'crossed: from useful to known',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('EncounterSeedLanding renders time-orange dim seed card', () => {
    const { asFragment } = renderInViewport(
      <EncounterSeedLanding
        skipAnimation
        data={{
          label: 'SEED · ELIGIBLE',
          summary: 'A reckoning at the iron market.',
          when: 'time · 3–7 turns from now · veiren-related',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('HiddenMarkLanding renders dotted-outline player-only pill', () => {
    const { asFragment } = renderInViewport(
      <HiddenMarkLanding
        skipAnimation
        data={{
          label: 'HIDDEN · ONLY YOU SEE THIS',
          markName: 'Marked by coincidence',
          descriptor: 'this scene becomes biographical',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('RecentEventLanding renders heart-coloured echo card', () => {
    const { asFragment } = renderInViewport(
      <RecentEventLanding
        skipAnimation
        data={{
          label: 'INVOKED THIS BEAT',
          summary: "She held the captain's eye and did not look away.",
          tail: 'heart-related · 0 turns ago',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('SpawnArtifactLanding renders matter-umber items rail tile', () => {
    const { asFragment } = renderInViewport(
      <SpawnArtifactLanding
        skipAnimation
        data={{
          label: 'ITEM · NEW',
          name: 'A pressed iron coin, warm.',
          tail: 'matter · favor of the captain',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('FactionLanding renders order-gold chip with tone swap', () => {
    const { asFragment } = renderInViewport(
      <FactionLanding
        skipAnimation
        data={{
          factionName: 'CIVIC GUARD OF BREN',
          oldTone: 'allied',
          newTone: 'wary',
          descriptor: 'order · because of what she said',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('ArchetypeDriftLanding renders Heart-band dot fill + chaos particle', () => {
    const { asFragment } = renderInViewport(
      <ArchetypeDriftLanding
        skipAnimation
        data={{
          bandSphere: 'spirit',
          bandLabel: 'HEART · DRIFT',
          oldPhrase: 'her deepest thread',
          newPhrase: 'the thread she lives by',
          dotChangeNote: '+1 dot · she is more this now',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

describe('EffectRegistration — onEffectLand callbacks', () => {
  it('fires onEffectLand exactly once when the landing settles', () => {
    let count = 0;
    renderInViewport(
      <IntelligenceLanding
        skipAnimation
        onEffectLand={() => {
          count += 1;
        }}
        data={{ label: 'CLUE · NEW', name: 'a clue', tail: 'eye · tail' }}
      />,
    );
    expect(count).toBe(1);
  });

  it('fires for each component independently', () => {
    let countA = 0;
    let countB = 0;
    renderInViewport(
      <>
        <IntelligenceLanding
          skipAnimation
          onEffectLand={() => {
            countA += 1;
          }}
          data={{ label: 'A', name: 'a', tail: 'a' }}
        />
        <SpawnArtifactLanding
          skipAnimation
          onEffectLand={() => {
            countB += 1;
          }}
          data={{ label: 'B', name: 'b', tail: 'b' }}
        />
      </>,
    );
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });
});

describe('EffectRegistration — pre-settle (pending) phase renders aria-hidden placeholder', () => {
  it('renders pending placeholder when not skipping animation and delay > 0', () => {
    const { container } = renderInViewport(
      <IntelligenceLanding
        delay={5_000}
        data={{ label: 'CLUE · NEW', name: 'a clue', tail: 'eye · tail' }}
      />,
    );
    const placeholder = container.querySelector(
      '[data-testid="effect-registration-intelligence"]',
    );
    expect(placeholder).not.toBeNull();
    expect(placeholder?.getAttribute('data-phase')).toBe('pending');
    expect(placeholder?.getAttribute('aria-hidden')).toBe('true');
  });
});
