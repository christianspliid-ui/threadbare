/**
 * THR-971 — the aftermath consequence taxonomy.
 *
 * These tests pin the mapping table, not the styling: the defect this ticket
 * exists to kill is a consequence the ending never admits to, so every case
 * below asks "does this survive into a chip?" and one asks the falsification
 * question — "does a nothing-planted ending correctly show no seed?"
 */

import { describe, it, expect } from 'vitest';
import {
  buildAftermathConsequences,
  classifyChangeKind,
  CONSEQUENCE_KIND_LABELS,
} from '../buildAftermathConsequences';
import type {
  EncounterAftermathChange,
  EncounterAftermathReaction,
} from '../../../../../types/unifiedAction';

/** Identity enrich + single-segment link — isolates the taxonomy from prose plumbing. */
const passthrough = {
  enrich: (text: string) => text,
  link: (id: string, text: string) => ({ id, segments: [{ text }] }),
};

function change(
  over: Partial<EncounterAftermathChange> & Pick<EncounterAftermathChange, 'kind' | 'polarity'>,
): EncounterAftermathChange {
  return {
    id: over.id ?? `chg-${over.kind}-${over.polarity}`,
    kind: over.kind,
    title: over.title ?? 'A thing happened',
    detail: over.detail ?? 'A thing happened, and it is worth saying out loud.',
    polarity: over.polarity,
    // THR-1004 — forwarded, so a test can declare the concepts a producer named.
    concepts: over.concepts,
  };
}

function seedReaction(
  id: string,
  seeds: Array<{ seedLabel: string; delayTicks?: number }>,
): EncounterAftermathReaction {
  return {
    id,
    label: 'Carry it',
    effects: seeds.map((s) => ({
      kind: 'encounter_seed' as const,
      templateId: 'encounter.slice.full_moon_collection',
      delayTicks: s.delayTicks ?? 132,
      seedLabel: s.seedLabel,
    })),
  };
}

describe('classifyChangeKind — the mapping table', () => {
  it('maps a gained item to a prize and a lost one to a toll', () => {
    expect(classifyChangeKind('item', 'gain')).toBe('prize');
    expect(classifyChangeKind('item', 'loss')).toBe('toll');
  });

  it('maps every reputation flavour to standing', () => {
    expect(classifyChangeKind('reputation', 'gain')).toBe('standing');
    expect(classifyChangeKind('faction_reputation', 'loss')).toBe('standing');
    expect(classifyChangeKind('reputation_tally', 'info')).toBe('standing');
  });

  it('maps a costly trait to a wound and a free one to a mark', () => {
    expect(classifyChangeKind('trait', 'loss')).toBe('wound');
    expect(classifyChangeKind('trait', 'mixed')).toBe('wound');
    expect(classifyChangeKind('trait', 'gain')).toBe('mark');
  });

  it('maps a future hook to a seed', () => {
    expect(classifyChangeKind('future_hook', 'info')).toBe('seed');
  });

  it('maps growth and shell_state by whether they cost something', () => {
    expect(classifyChangeKind('growth', 'gain')).toBe('mark');
    expect(classifyChangeKind('growth', 'loss')).toBe('toll');
    expect(classifyChangeKind('shell_state', 'loss')).toBe('toll');
  });

  it('degrades an unknown kind to a mark rather than dropping it (fail-soft)', () => {
    expect(classifyChangeKind('a_kind_invented_next_year', 'info')).toBe('mark');
  });
});

describe('buildAftermathConsequences — chips', () => {
  it('renders one chip per authored change, in authored order', () => {
    const chips = buildAftermathConsequences({
      changes: [
        change({ kind: 'item', polarity: 'gain', id: 'a', detail: 'A wrapped parcel changed hands.' }),
        change({ kind: 'reputation', polarity: 'loss', id: 'b', detail: 'The village remembers the refusal.' }),
      ],
      ...passthrough,
    });

    expect(chips.map((c) => c.kind)).toEqual(['prize', 'standing']);
    expect(chips.map((c) => c.kindLabel)).toEqual([
      CONSEQUENCE_KIND_LABELS.prize,
      CONSEQUENCE_KIND_LABELS.standing,
    ]);
    expect(chips[0].sentence.segments[0].text).toBe('A wrapped parcel changed hands.');
    expect(chips[0].tone).toBe('gain');
    expect(chips[1].tone).toBe('loss');
  });

  it('gives a toll and a wound loss tone regardless of how the change reads', () => {
    const chips = buildAftermathConsequences({
      changes: [
        change({ kind: 'item', polarity: 'loss', id: 'a' }),
        change({ kind: 'trait', polarity: 'mixed', id: 'b' }),
      ],
      ...passthrough,
    });

    expect(chips.map((c) => c.tone)).toEqual(['loss', 'loss']);
  });

  it('never prints a magnitude — the chip carries only authored prose', () => {
    const chips = buildAftermathConsequences({
      changes: [change({ kind: 'reputation', polarity: 'loss', detail: 'Standing slipped, and it was noticed.' })],
      ...passthrough,
    });

    const rendered = chips[0].sentence.segments.map((s) => s.text).join('');
    expect(rendered).toBe('Standing slipped, and it was noticed.');
    expect(rendered).not.toMatch(/\d/);
  });

  it('surfaces a planted sequel as a seed chip, read from the reaction effect', () => {
    const chips = buildAftermathConsequences({
      changes: [],
      reactions: [
        seedReaction('slice.crossroads.carry_the_promise', [
          { seedLabel: 'A promise made at the crossroads falls due at the full moon.' },
        ]),
      ],
      ...passthrough,
    });

    expect(chips).toHaveLength(1);
    expect(chips[0].kind).toBe('seed');
    expect(chips[0].tone).toBe('seed');
    expect(chips[0].sentence.segments.map((s) => s.text).join('')).toBe(
      'A promise made at the crossroads falls due at the full moon.',
    );
  });

  it('surfaces every seed when one reaction plants more than one', () => {
    const chips = buildAftermathConsequences({
      changes: [],
      reactions: [
        seedReaction('slice.family.help', [
          { seedLabel: 'The man who sold the paper is still working.' },
          { seedLabel: 'Word of a kindness on the fen road is traveling ahead.' },
        ]),
      ],
      ...passthrough,
    });

    expect(chips.filter((c) => c.kind === 'seed')).toHaveLength(2);
  });

  it('FALSIFICATION: an ending that plants nothing shows no seed chip', () => {
    const chips = buildAftermathConsequences({
      changes: [change({ kind: 'reputation', polarity: 'gain' })],
      reactions: [{ id: 'slice.crossroads.walk_on', label: 'Walk on', effects: [] }],
      ...passthrough,
    });

    expect(chips.some((c) => c.kind === 'seed')).toBe(false);
    expect(chips).toHaveLength(1);
  });

  it('de-duplicates seeds that repeat the same label across reactions', () => {
    const label = 'A promise falls due at the full moon.';
    const chips = buildAftermathConsequences({
      changes: [],
      reactions: [seedReaction('r1', [{ seedLabel: label }]), seedReaction('r2', [{ seedLabel: label }])],
      ...passthrough,
    });

    expect(chips).toHaveLength(1);
  });

  it('skips a label-less seed rather than rendering an empty chip', () => {
    const chips = buildAftermathConsequences({
      changes: [],
      reactions: [seedReaction('r1', [{ seedLabel: '   ' }])],
      ...passthrough,
    });

    expect(chips).toHaveLength(0);
  });

  it('orders changes before seeds — what happened, then what it set in motion', () => {
    const chips = buildAftermathConsequences({
      changes: [change({ kind: 'item', polarity: 'gain' })],
      reactions: [seedReaction('r1', [{ seedLabel: 'Something is coming.' }])],
      ...passthrough,
    });

    expect(chips.map((c) => c.kind)).toEqual(['prize', 'seed']);
  });

  it('returns nothing for an ending with no changes and no reactions', () => {
    expect(buildAftermathConsequences({ changes: [], ...passthrough })).toEqual([]);
  });

  it('passes chip prose through enrichment before segmenting it', () => {
    const chips = buildAftermathConsequences({
      changes: [change({ kind: 'item', polarity: 'gain', detail: '{actor} took the parcel.' })],
      enrich: (text) => text.replace('{actor}', 'Kael'),
      link: (id, text) => ({
        id,
        segments: text.startsWith('Kael')
          ? [{ text: 'Kael', entityId: 'agent-1' }, { text: ' took the parcel.' }]
          : [{ text }],
      }),
    });

    expect(chips[0].sentence.segments[0]).toMatchObject({ text: 'Kael', entityId: 'agent-1' });
  });
});

// ─── THR-1004 — the UI Law on a chip ───────────────────────────────
//
// The rule: every game concept rendered to the player carries its image, its
// tooltip, and its link where a page exists. These tests ask whether a concept
// the *producer declared* survives into something the surface can decorate —
// and, in the falsification case, whether a concept that names nothing
// decorable correctly leaves the sentence alone rather than splitting it for
// an affordance that would be dead.

describe('concept decorations (THR-1004)', () => {
  it('attaches a tooltip to the concept word the producer named', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'growth',
        polarity: 'gain',
        detail: "Vara's Star grew a little.",
        concepts: [{ text: 'Star', tooltipId: 'reach.star' }],
      })],
      ...passthrough,
    });

    expect(chips[0].sentence.segments).toEqual([
      { text: "Vara's " },
      { text: 'Star', emphasis: 'accent', tooltipId: 'reach.star', entityId: undefined },
      { text: ' grew a little.' },
    ]);
  });

  it('makes an entity concept both linkable and tooltipped', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'faction_reputation',
        polarity: 'gain',
        detail: "Vara's standing with The Mason Guild rose markedly.",
        concepts: [{
          text: 'The Mason Guild',
          entityId: 'faction-mason',
          visualKind: 'faction',
          visualName: 'The Mason Guild',
        }],
      })],
      ...passthrough,
    });

    const linked = chips[0].sentence.segments.find((s) => s.text === 'The Mason Guild');
    expect(linked?.entityId).toBe('faction-mason');
    // The kind is what routes the click to the faction sheet rather than the
    // agent drawer — an entity id without it would be a dead link that looks live.
    expect(linked?.entityKind).toBe('faction');
  });

  it('leaves entityKind absent for a cast segment, which has always meant "a person"', () => {
    const chips = buildAftermathConsequences({
      changes: [change({ kind: 'item', polarity: 'gain', detail: 'Kael took the parcel.' })],
      enrich: (t) => t,
      link: (id) => ({ id, segments: [{ text: 'Kael', entityId: 'agent-1' }, { text: ' took the parcel.' }] }),
    });

    expect(chips[0].sentence.segments[0].entityKind).toBeUndefined();
  });

  it('leaves a segment the linker already claimed alone — its link is the richer one', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'growth',
        polarity: 'gain',
        detail: 'Vara grew.',
        concepts: [{ text: 'Vara', tooltipId: 'ui.standing' }],
      })],
      enrich: (t) => t,
      // A linker that has already claimed "Vara" as a cast member — the case
      // where the concept list must defer rather than overwrite.
      link: (id) => ({
        id,
        segments: [{ text: 'Vara', entityId: 'agent-vara', referenceId: 'cast:vara' }, { text: ' grew.' }],
      }),
    });

    // Still the linker's segment: entity link intact, no concept tooltip stamped over it.
    expect(chips[0].sentence.segments[0]).toMatchObject({
      text: 'Vara',
      entityId: 'agent-vara',
      referenceId: 'cast:vara',
    });
    expect(chips[0].sentence.segments[0].tooltipId).toBeUndefined();
  });

  it('falsification: a concept with nothing to show does not split the sentence', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'trait',
        polarity: 'gain',
        detail: 'Vara came away carrying Steady Hands.',
        // A trait: named, but neither a tooltip concept nor an entity page.
        concepts: [{ text: 'Steady Hands' }],
      })],
      ...passthrough,
    });

    expect(chips[0].sentence.segments).toEqual([
      { text: 'Vara came away carrying Steady Hands.' },
    ]);
  });

  it('falsification: a concept whose text is absent from the sentence changes nothing', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'growth',
        polarity: 'gain',
        detail: "Vara's Iron grew a little.",
        concepts: [{ text: 'Star', tooltipId: 'reach.star' }],
      })],
      ...passthrough,
    });

    expect(chips[0].sentence.segments).toEqual([{ text: "Vara's Iron grew a little." }]);
  });

  it('resolves the chip icon from the first concept that names an entity', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'item',
        polarity: 'gain',
        detail: 'Vara gained Meditation Stones.',
        concepts: [
          { text: 'standing', tooltipId: 'ui.standing' },
          { text: 'Meditation Stones', visualKind: 'artifact', visualName: 'Meditation Stones' },
        ],
      })],
      ...passthrough,
      resolveIcon: (concept) => ({
        entityId: concept.entityId ?? concept.visualName ?? concept.text,
        kind: concept.visualKind!,
        name: concept.visualName ?? concept.text,
        src: 'art/meditation-stones.jpg',
      }),
    });

    expect(chips[0].icon).toEqual({
      entityId: 'Meditation Stones',
      kind: 'artifact',
      name: 'Meditation Stones',
      src: 'art/meditation-stones.jpg',
    });
  });

  it('fail-open: a host that wires no icon resolver still gets chips', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'item',
        polarity: 'gain',
        concepts: [{ text: 'A thing', visualKind: 'artifact', visualName: 'A thing' }],
      })],
      ...passthrough,
    });

    expect(chips).toHaveLength(1);
    expect(chips[0].icon).toBeUndefined();
  });
});
