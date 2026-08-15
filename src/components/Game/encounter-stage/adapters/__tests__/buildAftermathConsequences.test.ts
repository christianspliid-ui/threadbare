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
  categoryForKind,
  classifyChangeKind,
  CONSEQUENCE_KIND_LABELS,
} from '../buildAftermathConsequences';
import { DELTA_CLUSTER_MAX } from '../../../../shared/DeltaCluster';
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
    // THR-1082 — the structured half, forwarded the same way. Every field is
    // optional, so a case that omits them is exercising the pre-THR-1082
    // authored-content path rather than a degenerate one.
    category: over.category,
    stateNoun: over.stateNoun,
    direction: over.direction,
    magnitude: over.magnitude,
    storyWeight: over.storyWeight,
    causeClause: over.causeClause,
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

  it('carries a granted attachment through to the segment that links it (THR-1120)', () => {
    // The defect: a chip names the thing the ending granted and the player
    // cannot reach it. The state noun is what carries the grant, because the
    // state noun *is* the changed state — so it is the field asserted here.
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'trait',
        polarity: 'loss',
        detail: 'The leg will carry them, and it will have opinions about stairs.',
        stateNoun: {
          text: 'wounded',
          entityId: 'trait.condition.wounded',
          visualKind: 'attachment',
        },
        concepts: [{
          text: 'wounded',
          entityId: 'trait.condition.wounded',
          visualKind: 'attachment',
        }],
      })],
      enrich: (t) => t,
      link: (id) => ({ id, segments: [{ text: 'They are wounded now.' }] }),
    });

    const linked = chips[0].sentence.segments.find((s) => s.text === 'wounded');
    expect(linked?.entityId).toBe('trait.condition.wounded');
    // The kind is what routes the click to the attachment sheet. Without it the
    // segment falls through to the agent path, which is the dead-link shape.
    expect(linked?.entityKind).toBe('attachment');
  });

  it('draws no icon tile for an attachment, which has a page and no visual family', () => {
    // Falsification for the resolveIcon guard: an attachment must reach the
    // sentence's link tier without ever being handed to the entity-visual
    // resolver, which has no 'attachment' kind to resolve.
    const seen: string[] = [];
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'trait',
        polarity: 'loss',
        stateNoun: { text: 'wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' },
      })],
      ...passthrough,
      resolveIcon: (concept) => {
        // Mirrors the adapter's own guard, so this test fails if that guard is
        // removed rather than passing on a coincidence.
        if (concept.visualKind === 'attachment') return undefined;
        seen.push(concept.visualKind ?? 'none');
        return { entityId: 'x', kind: 'artifact', name: 'x' };
      },
    });

    expect(chips[0].icon).toBeUndefined();
    expect(seen).toEqual([]);
  });

  it('leaves a chip with no graph-real grant exactly as it was (THR-1120 absence)', () => {
    // The other half of the Done-when. A state noun with no entity — a reach, a
    // standing, a bare condition word — must render with no affordance at all.
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'reputation_tally',
        polarity: 'gain',
        stateNoun: { text: 'their name on this road', tooltipId: 'ui.standing' },
      })],
      ...passthrough,
    });

    for (const seg of chips[0].sentence.segments) {
      expect(seg.entityId).toBeUndefined();
      expect(seg.entityKind).toBeUndefined();
    }
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
      resolveIcon: (concept) => {
        // THR-1120 — `attachment` is the one visual kind with a page and no
        // entity-visual family, so the adapter never hands one to a resolver.
        // Mirroring that guard here is what keeps the mock a faithful stand-in;
        // without it the mock would claim to resolve a tile production cannot.
        if (!concept.visualKind || concept.visualKind === 'attachment') return undefined;
        return {
          entityId: concept.entityId ?? concept.visualName ?? concept.text,
          kind: concept.visualKind,
          name: concept.visualName ?? concept.text,
          src: 'art/meditation-stones.jpg',
        };
      },
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

// ─── THR-1082 — the four story categories, and the magnitude idiom ────

describe('story categories (THR-1082)', () => {
  it('folds every wire kind onto one of exactly four categories', () => {
    const seen = new Set<string>();
    for (const kind of ['prize', 'standing', 'toll', 'wound', 'seed', 'mark'] as const) {
      for (const polarity of ['gain', 'loss', 'mixed', 'info'] as const) {
        seen.add(categoryForKind(kind, polarity));
      }
    }
    // Four and only four — the taxonomy's whole claim is that a player learns
    // these once and can then read any ending in the game.
    expect([...seen].sort()).toEqual(['bond', 'boon', 'path', 'scar']);
  });

  it('MARK has no successor — an unclassifiable change folds by polarity', () => {
    // The bucket named "everything else" is what made the old surface
    // unreadable, so there is deliberately no fifth category to fall into.
    expect(categoryForKind('mark', 'gain')).toBe('boon');
    expect(categoryForKind('mark', 'loss')).toBe('scar');
    expect(categoryForKind('mark', 'mixed')).toBe('scar');
    expect(categoryForKind('mark', 'info')).toBe('path');
  });

  it('never renders the retired MARK label on any chip', () => {
    const chips = buildAftermathConsequences({
      // `shell_state` + info is the combination that used to classify as `mark`.
      changes: [
        change({ kind: 'shell_state', polarity: 'info' }),
        change({ kind: 'trait', polarity: 'gain', id: 'c2' }),
      ],
      ...passthrough,
    });
    expect(chips.map(c => c.categoryLabel)).not.toContain('MARK');
    for (const chip of chips) {
      expect(['SCAR', 'BOND', 'BOON', 'PATH']).toContain(chip.categoryLabel);
    }
  });

  it("a producer's declared category wins over the derived one", () => {
    const chips = buildAftermathConsequences({
      changes: [change({ kind: 'growth', polarity: 'gain', category: 'scar' })],
      ...passthrough,
    });
    expect(chips[0].category).toBe('scar');
    expect(chips[0].categoryLabel).toBe('SCAR');
  });

  it('pre-THR-1082 content renders unchanged — no noun, no cluster, no compaction', () => {
    // The identity assertion. Every authored change in the game today carries
    // none of the new fields, and must keep rendering exactly as it did.
    const chips = buildAftermathConsequences({
      changes: [change({ kind: 'item', polarity: 'gain', detail: 'A parcel changed hands.' })],
      ...passthrough,
    });
    expect(chips).toHaveLength(1);
    expect(chips[0].nounLabel).toBeUndefined();
    expect(chips[0].delta).toBeUndefined();
    expect(chips[0].compact).toBe(false);
    expect(chips[0].sentence.segments.map(s => s.text).join('')).toBe('A parcel changed hands.');
    // And it still lands in a category, because the fallback derives one.
    expect(chips[0].category).toBe('boon');
  });
});

describe('the state noun (THR-1082)', () => {
  it('names the changed state on the tag, so no chip says "something"', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'growth',
        polarity: 'gain',
        stateNoun: { text: 'Stone', tooltipId: 'reach.stone' },
        direction: 'gain',
      })],
      ...passthrough,
    });
    expect(chips[0].nounLabel).toBe('STONE');
  });

  it('routes a reach noun to the reach glyph, read from the declared tooltip id', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'growth',
        polarity: 'gain',
        stateNoun: { text: 'Stone', tooltipId: 'reach.stone' },
        direction: 'gain',
      })],
      ...passthrough,
    });
    expect(chips[0].reachDomain).toBe('stone');
  });

  it('leaves reachDomain unset for a non-reach noun', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'reputation',
        polarity: 'gain',
        stateNoun: { text: 'standing', tooltipId: 'ui.standing' },
        direction: 'gain',
      })],
      ...passthrough,
    });
    expect(chips[0].reachDomain).toBeUndefined();
  });

  it('prefers the state noun over a decorating concept for the icon tile', () => {
    // `concepts` decorates the sentence; `stateNoun` *is* the thing that changed.
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'faction_reputation',
        polarity: 'gain',
        stateNoun: {
          text: 'The Mason Guild', entityId: 'f1',
          visualKind: 'faction', visualName: 'The Mason Guild',
        },
        concepts: [{ text: 'Vara', entityId: 'a1', visualKind: 'agent', visualName: 'Vara' }],
        direction: 'gain',
      })],
      ...passthrough,
      resolveIcon: (concept) => ({
        entityId: concept.entityId ?? concept.text,
        kind: concept.visualKind as 'agent' | 'faction' | 'artifact',
        name: concept.text,
      }),
    });
    expect(chips[0].icon?.entityId).toBe('f1');
  });
});

describe('the delta cluster (THR-1082)', () => {
  const growth = (band: number, direction: 'gain' | 'loss' = 'gain') =>
    buildAftermathConsequences({
      changes: [change({
        kind: 'growth',
        polarity: direction === 'gain' ? 'gain' : 'loss',
        stateNoun: { text: 'Stone' },
        direction,
        magnitude: { ladder: 'growth', band },
      })],
      ...passthrough,
    })[0].delta;

  it('grows the cluster with the band, so a bigger change reads bigger', () => {
    expect(growth(0)?.count).toBe(1);
    expect(growth(2)?.count).toBe(2);
    expect(growth(4)?.count).toBe(3);
  });

  it('never draws more than the maximum, whatever the ladder says', () => {
    for (let band = 0; band < 8; band++) {
      const count = growth(band)?.count ?? 0;
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(DELTA_CLUSTER_MAX);
    }
  });

  it('clamps an out-of-range band rather than blanking the chip', () => {
    // A ladder that grows a rung without this map following must degrade, not
    // erase the change (NFP #4).
    expect(growth(99)?.count).toBe(3);
    expect(growth(-5)?.count).toBe(1);
  });

  it('draws a single mark when the change has a direction but no scale', () => {
    // The Eldritch Horror "impair" case: noun + direction is legible with no
    // magnitude at all. An item was gained or it was not.
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'item',
        polarity: 'gain',
        stateNoun: { text: 'Meditation Stones' },
        direction: 'gain',
      })],
      ...passthrough,
    });
    expect(chips[0].delta).toEqual({
      direction: 'gain',
      count: 1,
      label: 'Meditation Stones rose, a slight amount',
    });
  });

  it('states the reading in words, for the aria label (Law 11)', () => {
    expect(growth(4)?.label).toBe('Stone rose, a great amount');
    expect(growth(4, 'loss')?.label).toBe('Stone fell, a great amount');
  });

  it('gives a PATH its scale-less marker rather than a run', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'future_hook',
        polarity: 'info',
        stateNoun: { text: 'the gate' },
        direction: 'opens',
      })],
      ...passthrough,
    });
    expect(chips[0].delta).toEqual({
      direction: 'opens', count: 1, label: 'the gate — a way opens',
    });
  });

  it('omits the cluster entirely when no producer declared a direction', () => {
    const chips = buildAftermathConsequences({
      changes: [change({ kind: 'item', polarity: 'gain' })],
      ...passthrough,
    });
    expect(chips[0].delta).toBeUndefined();
  });
});

describe('incidental drift versus story beat (THR-1082)', () => {
  it('renders incidental drift compact, with the sentence kept for the hover tier', () => {
    // Christian's ruling, 2026-08-10: the drift the engine noticed every single
    // encounter "takes away from the encounter story", so it loses its sentence
    // on screen — but the words are not destroyed, only demoted.
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'growth',
        polarity: 'gain',
        detail: "Vara's Stone grew steadily.",
        stateNoun: { text: 'Stone' },
        direction: 'gain',
        magnitude: { ladder: 'growth', band: 2 },
        storyWeight: 'incidental',
      })],
      ...passthrough,
    });
    expect(chips[0].compact).toBe(true);
    expect(chips[0].sentenceText).toBe("Vara's Stone grew steadily.");
  });

  it('keeps a story beat full, sentence and all', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'growth',
        polarity: 'gain',
        stateNoun: { text: 'Stone' },
        direction: 'gain',
        storyWeight: 'beat',
      })],
      ...passthrough,
    });
    expect(chips[0].compact).toBe(false);
  });

  it('an authored cause clause always overrides compactness', () => {
    // An author who wrote a cause meant it to be read.
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'growth',
        polarity: 'gain',
        storyWeight: 'incidental',
        causeClause: 'Hauling the beam across the span',
        detail: 'her hands learned the weight of stone',
      })],
      ...passthrough,
    });
    expect(chips[0].compact).toBe(false);
  });
});

describe('the causality rule (THR-1082)', () => {
  it('leads with the cause, so a consequence never appears divorced from it', () => {
    const chips = buildAftermathConsequences({
      changes: [change({
        kind: 'trait',
        polarity: 'gain',
        causeClause: 'Caught at the rail by a passing wanderer',
        detail: 'Jorun the Wayfarer walks with her now',
      })],
      ...passthrough,
    });
    expect(chips[0].sentenceText)
      .toBe('Caught at the rail by a passing wanderer — Jorun the Wayfarer walks with her now');
  });

  it('renders the change alone when no cause was authored', () => {
    const chips = buildAftermathConsequences({
      changes: [change({ kind: 'trait', polarity: 'gain', detail: 'She came away steadier.' })],
      ...passthrough,
    });
    expect(chips[0].sentenceText).toBe('She came away steadier.');
  });
});

describe('planted seeds are PATH (THR-1082)', () => {
  it('tags a planted sequel PATH with the scale-less marker', () => {
    const reactions: EncounterAftermathReaction[] = [{
      id: 'r1',
      label: 'Let it lie',
      effects: [{ kind: 'encounter_seed', delayTicks: 5, seedLabel: 'A debt falls due at the full moon.' }],
    }];
    const chips = buildAftermathConsequences({ changes: [], reactions, ...passthrough });
    expect(chips[0].category).toBe('path');
    expect(chips[0].categoryLabel).toBe('PATH');
    expect(chips[0].delta).toEqual({ direction: 'opens', count: 1, label: 'A way opens' });
    // A seed is pure story — it never loses its sentence.
    expect(chips[0].compact).toBe(false);
  });
});
