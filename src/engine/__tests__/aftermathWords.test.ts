/**
 * THR-1004 — the words-never-numerals rule, held as a gate rather than a habit.
 *
 * The load-bearing test here is `every derived sentence builder`: it enumerates
 * the production builders and runs each over a spread of inputs that covers
 * every band, asserting no Arabic numeral survives. That is only meaningful
 * because `unifiedActionResolution.ts` builds *all* of its derived details
 * through these functions — a new producer that assembles its own literal would
 * escape this test, which is exactly why the module header forbids it.
 */

import { describe, it, expect } from 'vitest';
import {
  GROWTH_MAGNITUDE_BANDS,
  REPUTATION_MAGNITUDE_BANDS,
  TALLY_MAGNITUDE_BANDS,
  containsNumeral,
  countWord,
  describeTallyKey,
  factionStandingSentence,
  gateFollowOnSentence,
  gateStateSentence,
  growthSentence,
  magnitudeWord,
  overviewHighlightPhrase,
  reachDisplayName,
  reachTooltipId,
  reputationSentence,
  reputationTallySentence,
  rewardSentence,
  traitGrantedSentence,
} from '../aftermathWords';

describe('magnitude banding', () => {
  it('bands reputation deltas by magnitude, ignoring sign', () => {
    expect(magnitudeWord(0.5, REPUTATION_MAGNITUDE_BANDS)).toBe('profoundly');
    expect(magnitudeWord(-0.5, REPUTATION_MAGNITUDE_BANDS)).toBe('profoundly');
    expect(magnitudeWord(0.2, REPUTATION_MAGNITUDE_BANDS)).toBe('markedly');
    expect(magnitudeWord(0.05, REPUTATION_MAGNITUDE_BANDS)).toBe('noticeably');
    expect(magnitudeWord(0.02, REPUTATION_MAGNITUDE_BANDS)).toBe('a little');
    expect(magnitudeWord(0.002, REPUTATION_MAGNITUDE_BANDS)).toBe('faintly');
  });

  it('bands the growth and tally ladders on their own scales', () => {
    // 0.04 is the value from Christian's screenshot — an ordinary tick of growth.
    expect(magnitudeWord(0.04, GROWTH_MAGNITUDE_BANDS)).toBe('a little');
    expect(magnitudeWord(0.6, GROWTH_MAGNITUDE_BANDS)).toBe('in a leap');
    expect(magnitudeWord(1, TALLY_MAGNITUDE_BANDS)).toBe('again');
    expect(magnitudeWord(4, TALLY_MAGNITUDE_BANDS)).toBe('markedly');
  });

  it('fail-soft: a non-finite delta still yields a word', () => {
    expect(magnitudeWord(Number.NaN, REPUTATION_MAGNITUDE_BANDS)).toBe('faintly');
    expect(containsNumeral(magnitudeWord(Number.POSITIVE_INFINITY, GROWTH_MAGNITUDE_BANDS))).toBe(false);
  });
});

describe('countWord', () => {
  it('spells small counts and collapses the rest', () => {
    expect(countWord(1)).toBe('one');
    expect(countWord(3)).toBe('three');
    expect(countWord(9)).toBe('nine');
    expect(countWord(10)).toBe('many');
    expect(countWord(400)).toBe('many');
  });
});

describe('describeTallyKey', () => {
  it('resolves a typed reach tally into words plus its reach tooltip', () => {
    // The exact key from the screenshot: "Vara's star.positive tally shifted by +1.00".
    const resolved = describeTallyKey('star.positive');
    expect(resolved.phrase).toBe('reputation for Star');
    expect(resolved.concept).toEqual({ text: 'Star', tooltipId: 'reach.star' });
  });

  it('distinguishes the negative pole', () => {
    expect(describeTallyKey('iron.negative').phrase).toBe('ill repute in Iron');
  });

  it('drops the engine namespace from a free-form authored key', () => {
    expect(describeTallyKey('ac.guild_work').phrase).toBe('record of guild work');
    expect(describeTallyKey('army.command.banner_up').phrase).toBe('record of command banner up');
  });

  it('fail-soft: an unnamespaced key is humanised whole rather than dropped', () => {
    expect(describeTallyKey('lone_key').phrase).toBe('record of lone key');
  });
});

describe('reach vocabulary', () => {
  it('names reaches and resolves their tooltip ids', () => {
    expect(reachDisplayName('star')).toBe('Star');
    expect(reachTooltipId('star')).toBe('reach.star');
  });

  it('fail-soft: an unknown domain humanises and carries no tooltip', () => {
    expect(reachDisplayName('made_up_reach')).toBe('made up reach');
    expect(reachTooltipId('made_up_reach')).toBeUndefined();
  });
});

describe('derived sentences name their concepts', () => {
  it('growth names its reach and carries the reach tooltip', () => {
    const sentence = growthSentence({
      actorName: 'Vara', domain: 'star', applied: 0.04, tierCrossed: false,
    });
    expect(sentence.detail).toBe("Vara's Star grew a little.");
    expect(sentence.concepts).toEqual([{ text: 'Star', tooltipId: 'reach.star' }]);
  });

  it('growth states a crossed tier as a fact, never as tier numbers', () => {
    const sentence = growthSentence({
      actorName: 'Vara', domain: 'iron', applied: 0.3, tierCrossed: true,
    });
    expect(sentence.detail).toContain('crossed into a new tier');
    expect(containsNumeral(sentence.detail)).toBe(false);
  });

  it('reputation states direction and weight, never the delta', () => {
    expect(reputationSentence({ actorName: 'Vara', delta: 0.05, flavour: 'authored' }).detail)
      .toBe("Vara's standing rose noticeably.");
    expect(reputationSentence({ actorName: 'Vara', delta: -0.05, flavour: 'branch' }).detail)
      .toBe("Vara's standing fell noticeably as the checkpoint's judgement landed.");
  });

  it('faction standing carries the faction as a linkable entity with a tile', () => {
    const sentence = factionStandingSentence({
      actorName: 'Vara',
      factionId: 'faction-mason-guild',
      factionName: 'The Mason Guild',
      delta: 0.2,
      beforeRole: 'member',
      afterRole: 'member',
    });
    expect(sentence.detail).toBe("Vara's standing with The Mason Guild rose markedly.");
    expect(sentence.concepts[0]).toEqual({
      text: 'The Mason Guild',
      entityId: 'faction-mason-guild',
      visualKind: 'faction',
      visualName: 'The Mason Guild',
    });
  });

  it('faction standing says the rank moved when only the rank moved', () => {
    const sentence = factionStandingSentence({
      actorName: 'Vara',
      factionId: 'faction-mason-guild',
      factionName: 'The Mason Guild',
      delta: 0,
      beforeRole: 'member',
      afterRole: 'journeyman',
    });
    expect(sentence.detail).toBe('The Mason Guild now names Vara journeyman.');
  });

  it('the tally sentence replaces the raw key it used to print', () => {
    const sentence = reputationTallySentence({ actorName: 'Vara', key: 'star.positive', delta: 1 });
    expect(sentence.detail).toBe("Vara's reputation for Star deepened again.");
    expect(sentence.detail).not.toContain('star.positive');
  });

  it('a reward names an entity the chip can picture', () => {
    const sentence = rewardSentence({
      actorName: 'Vara', rewardName: 'Meditation Stones', gained: true,
    });
    expect(sentence.concepts[0].visualKind).toBe('artifact');
    expect(sentence.concepts[0].text).toBe('Meditation Stones');
  });
});

describe('overview highlight phrase', () => {
  it('spells the counts the old line printed as numerals', () => {
    // The exact shape from the screenshot: "1 reward, 3 skill shifts".
    expect(overviewHighlightPhrase({ traits: 0, rewards: 1, growth: 3, hooks: 0 }))
      .toBe('one reward, three skill shifts');
  });

  it('returns null when nothing landed, so the caller picks its quiet line', () => {
    expect(overviewHighlightPhrase({ traits: 0, rewards: 0, growth: 0, hooks: 0 })).toBeNull();
  });
});

describe('every derived sentence builder is numeral-free', () => {
  // A spread wide enough to reach every rung of every ladder, in both
  // directions, plus the degenerate inputs a fail-soft producer can hand over.
  const DELTAS = [0.001, 0.02, 0.05, 0.2, 0.5, 1, 4, 12, -0.02, -0.2, -1, -7, Number.NaN];

  it('produces no Arabic numeral across every band and sign', () => {
    const offenders: string[] = [];
    const record = (label: string, text: string) => {
      if (containsNumeral(text)) offenders.push(`${label}: ${text}`);
    };

    for (const delta of DELTAS) {
      record('growth', growthSentence({
        actorName: 'Vara', domain: 'star', applied: delta, tierCrossed: true,
      }).detail);
      record('reputation', reputationSentence({
        actorName: 'Vara', delta, flavour: 'authored',
      }).detail);
      record('branch', reputationSentence({
        actorName: 'Vara', delta, flavour: 'branch',
      }).detail);
      record('residual', reputationSentence({
        actorName: 'Vara', delta, flavour: 'residual',
      }).detail);
      record('faction', factionStandingSentence({
        actorName: 'Vara',
        factionId: 'f1',
        factionName: 'The Mason Guild',
        delta,
        beforeRole: 'member',
        afterRole: 'journeyman',
      }).detail);
      for (const key of ['star.positive', 'iron.negative', 'ac.guild_work', 'army.command.banner_up']) {
        record(`tally:${key}`, reputationTallySentence({ actorName: 'Vara', key, delta }).detail);
      }
    }

    record('trait', traitGrantedSentence({ actorName: 'Vara', traitLabel: 'Steady Hands' }).detail);
    record('reward-gain', rewardSentence({
      actorName: 'Vara', rewardName: 'Meditation Stones', gained: true,
    }).detail);
    record('reward-loss', rewardSentence({
      actorName: 'Vara', rewardName: 'a scar', gained: false,
    }).detail);
    record('gate-state', gateStateSentence({
      beforeState: 'closed_watchful', afterState: 'open',
    }).detail);
    record('gate-follow-on', gateFollowOnSentence('#witness_story_followed').detail);

    for (let n = 0; n <= 12; n++) {
      const phrase = overviewHighlightPhrase({ traits: n, rewards: n, growth: n, hooks: n });
      if (phrase) record(`overview:${n}`, phrase);
    }

    expect(offenders).toEqual([]);
  });
});
