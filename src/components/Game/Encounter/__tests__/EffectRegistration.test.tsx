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
  return render(
    <div style={{ position: 'relative', width: 1920, height: 1080 }}>{node}</div>,
  );
}

describe('EffectRegistration 1920×1080 snapshot grid', () => {
  it('renders IntelligenceLanding at 1920×1080', () => {
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

  it('renders ConditionAttachmentLanding at 1920×1080', () => {
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

  it('renders ReputationTallyLanding at 1920×1080', () => {
    const { asFragment } = renderInViewport(
      <ReputationTallyLanding
        skipAnimation
        data={{
          castLabel: 'CAPTAIN VEIREN',
          oldPhrase: 'disposition: wary',
          newPhrase: 'disposition: cooled, watching',
          tail: 'iron · he marks her now',
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders ReputationScoreLanding at 1920×1080', () => {
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

  it('renders EncounterSeedLanding at 1920×1080', () => {
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

  it('renders HiddenMarkLanding at 1920×1080', () => {
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

  it('renders RecentEventLanding at 1920×1080', () => {
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

  it('renders SpawnArtifactLanding at 1920×1080', () => {
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

  it('renders FactionLanding at 1920×1080', () => {
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

  it('renders ArchetypeDriftLanding at 1920×1080', () => {
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
