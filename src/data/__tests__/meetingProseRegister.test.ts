/**
 * Register-compliance invariants for the Meet The First prose corpus (THR-868 WS6).
 *
 * The WS6 mandate rewrites every meeting-facing string off the lyrical register onto
 * the nudge-spec register: plain, descriptive of events, people and motivations. This
 * suite is the enforcement — the rewrite itself is not the durable artifact, this is.
 * A future author who reaches for "something inside them settles into place" fails here
 * rather than shipping it into the game's first five minutes.
 *
 * Scored with the real `scoreProseEntry` and the real nudge detectors, not a local copy.
 * Thresholds come from `nudgeAuditDetectors.ts` so a recalibration there propagates.
 */
import { describe, expect, it } from 'vitest';
import { scoreProseEntry } from '../../engine/content-eval/proseQualityScore';
import {
  countVagueness,
  countIntensifiers,
  countNotXButY,
  NOT_X_BUT_Y_FAIL,
  type ProseFieldClass,
} from '../content-eval/nudgeAuditDetectors';
import { CANDIDATE_VIGNETTES } from '../candidate-vignettes';
import {
  SENSING_OPENING_PROSE,
  SENSING_OPENING_FALLBACK,
  SENSING_FOCUS_PROMPT,
  SENSING_REST_PROMPT,
  TESTING_TRANSITION_IN,
  TESTING_BETWEEN_DILEMMAS,
  MEETING_FATE_REVEAL_CONTINUE,
  SPARK_TRANSITION_IN,
  BOND_PROSE,
  BOND_PROSE_FALLBACK,
  BOND_RELEASE_TEXT,
} from '../meeting-narrative-prose';

/** Every hunger the meeting must speak for. Pinned so a dropped key fails loudly. */
const HUNGERS = [
  'hunger.gather',
  'hunger.witness',
  'hunger.preserve',
  'hunger.reshape',
  'hunger.reclaim',
  'hunger.consume',
  'hunger.sever',
  'hunger.kindle',
  'hunger.bind',
  'hunger.wander',
  'hunger.haunt',
  'hunger.illuminate',
] as const;

interface Entry {
  id: string;
  fields: Record<string, string>;
  /**
   * Which vagueness scope this entry is read under (THR-899). Scene-setup prose
   * is held to the evasive terms only; prose that reports a result is held to
   * the natural indefinites as well, because after the roll an indefinite is the
   * writer withholding what the player is owed.
   */
  scope: ProseFieldClass;
}

/**
 * The scored corpus. Built explicitly rather than by globbing the module's exports so
 * that adding a new player-facing string is a deliberate act that shows up in this list
 * — an auto-discovered corpus silently stops covering whatever it fails to see.
 */
const CORPUS: Entry[] = [
  // Vignettes and sensing openings are the player looking at a life before
  // choosing — scene prose in the THR-899 sense.
  ...CANDIDATE_VIGNETTES.map((v) => ({
    id: v.id,
    fields: { narrative: v.prose, epithet: v.epithet },
    scope: 'scene' as const,
  })),
  ...HUNGERS.map((h) => ({
    id: `prose.sensing_opening.${h}`,
    fields: { narrative: SENSING_OPENING_PROSE[h] },
    scope: 'scene' as const,
  })),
  // The bond is the result the meeting resolves to, so it is read as outcome
  // prose: "something settles" is exactly the withholding this scope exists for.
  ...HUNGERS.map((h) => ({
    id: `prose.bond.${h}`,
    fields: { narrative: BOND_PROSE[h] },
    scope: 'outcome' as const,
  })),
  {
    id: 'prose.sensing_misc',
    fields: {
      fallback: SENSING_OPENING_FALLBACK,
      focus: SENSING_FOCUS_PROMPT,
      rest: SENSING_REST_PROMPT,
    },
    scope: 'scene' as const,
  },
  {
    id: 'prose.transitions',
    fields: {
      testingIn: TESTING_TRANSITION_IN,
      between: TESTING_BETWEEN_DILEMMAS,
      sparkIn: SPARK_TRANSITION_IN,
    },
    scope: 'scene' as const,
  },
  {
    id: 'prose.bond_misc',
    fields: { fallback: BOND_PROSE_FALLBACK },
    scope: 'outcome' as const,
  },
];

/** Label-class strings — held to the hard plainness rule, scored as labels not prose. */
const LABELS: Record<string, string> = {
  MEETING_FATE_REVEAL_CONTINUE,
  BOND_RELEASE_TEXT,
  SENSING_FOCUS_PROMPT,
};

const textOf = (e: Entry) => Object.values(e.fields).join(' ');

describe('Meet The First prose corpus — population', () => {
  it('covers all 8 reaches with 3 vignettes each', () => {
    // Pins the population: a vacuous corpus would pass every scoring assertion below.
    expect(CANDIDATE_VIGNETTES).toHaveLength(24);
    const byReach = new Map<string, number>();
    for (const v of CANDIDATE_VIGNETTES) {
      byReach.set(v.primaryReach, (byReach.get(v.primaryReach) ?? 0) + 1);
    }
    expect([...byReach.keys()].sort()).toEqual([
      'eye',
      'gold',
      'heart',
      'iron',
      'shadow',
      'star',
      'stone',
      'veil',
    ]);
    expect([...byReach.values()]).toEqual([3, 3, 3, 3, 3, 3, 3, 3]);
  });

  it('speaks for every hunger in both hunger-keyed tables', () => {
    for (const h of HUNGERS) {
      expect(SENSING_OPENING_PROSE[h], `sensing opening missing ${h}`).toBeTruthy();
      expect(BOND_PROSE[h], `bond prose missing ${h}`).toBeTruthy();
    }
    // No extra keys: an orphan hunger key is prose nothing can reach.
    expect(Object.keys(SENSING_OPENING_PROSE).sort()).toEqual([...HUNGERS].sort());
    expect(Object.keys(BOND_PROSE).sort()).toEqual([...HUNGERS].sort());
  });

  it('scores a non-trivial corpus', () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(24 + 12 + 12);
    for (const e of CORPUS) expect(textOf(e).trim().length, `${e.id} is empty`).toBeGreaterThan(0);
  });
});

describe('Meet The First prose corpus — register compliance', () => {
  it('no entry fails the prose scorer', () => {
    const failures = CORPUS.map((e) => ({ e, r: scoreProseEntry({ entryId: e.id, contentType: 'encounter', fields: e.fields }) }))
      .filter(({ r }) => r.band === 'fail')
      .map(({ e, r }) => `${e.id}: ${r.band}`);
    expect(failures, `prose scorer failures:\n${failures.join('\n')}`).toEqual([]);
  });

  it('no entry fails register compliance', () => {
    const failures = CORPUS.map((e) => ({
      e,
      r: scoreProseEntry({ entryId: e.id, contentType: 'encounter', fields: e.fields }),
    }))
      .filter(({ r }) => r.registerCompliance.band === 'fail')
      .map(
        ({ e, r }) =>
          `${e.id}: ${r.registerCompliance.metrics
            .filter((m) => m.band === 'fail')
            .map((m) => `${m.name} (${m.detail})`)
            .join('; ')}`,
      );
    expect(failures, `register failures:\n${failures.join('\n')}`).toEqual([]);
  });
});

describe('Meet The First prose corpus — nudge-spec detectors', () => {
  it('carries zero vagueness-lexicon words in its own scope', () => {
    // Spec target is zero, not a density budget: each of these words stands where a
    // picturable noun belongs, and the meeting is the game's teaching surface.
    // Scoped per THR-899 — scene entries are held to the evasive set, bond prose
    // (a result) to the indefinites as well.
    const hits = CORPUS.map((e) => ({ id: e.id, scope: e.scope, n: countVagueness(textOf(e), e.scope) }))
      .filter(({ n }) => n > 0)
      .map(({ id, scope, n }) => `${id} [${scope}]: ${n}`);
    expect(hits, `vagueness hits:\n${hits.join('\n')}`).toEqual([]);
  });

  it('stays inside the not-X-but-Y budget per entry', () => {
    const hits = CORPUS.map((e) => ({ id: e.id, n: countNotXButY(textOf(e)) }))
      .filter(({ n }) => n >= NOT_X_BUT_Y_FAIL)
      .map(({ id, n }) => `${id}: ${n}`);
    expect(hits, `not-X-but-Y over budget:\n${hits.join('\n')}`).toEqual([]);
  });
});

describe('the guard itself is falsifiable', () => {
  /**
   * Negative controls. Without these, every assertion above could be passing because
   * the detectors are inert rather than because the corpus is clean — the failure mode
   * a green suite cannot distinguish on its own. Each string below is real prose this
   * ticket retired; each must still be caught.
   */
  it('catches the retired lyrical register the WS6 rewrite removed', () => {
    // The plan doc names this exact sentence as "the register being retired".
    const retired =
      'Something inside them settles into place like a stone dropped into still water.';
    // Asserted in the *loosest* scope: this register stays retired even where the
    // rescope relaxed the most, because its fault is evasion and not indefiniteness.
    expect(countVagueness(retired, 'scene')).toBeGreaterThan(0);

    // The pre-rewrite sensing opening: weave metaphor, no picturable subject.
    const oldSensing =
      'You reach out through the web of fates, feeling for a thread that hums with longing. Three lives flicker at the edge of your sight.';
    const r = scoreProseEntry({
      entryId: 'control.old_sensing',
      contentType: 'encounter',
      fields: { narrative: oldSensing },
    });
    expect(r.registerCompliance.band).toBe('fail');
  });

  it('catches the evasive stand-ins in every scope', () => {
    // These are the lexicon groups the corpus is asserted clean of; if the detector
    // stopped matching them, the zero above would be meaningless. Evasive terms
    // have no plain-English defence, so they are caught in scene scope too — the
    // looser of the two, which makes this the stronger assertion.
    for (const bad of ['something', 'somehow', 'the tension', 'seems to']) {
      expect(countVagueness(`The guard waited, ${bad} in the dark.`, 'scene'), bad).toBeGreaterThan(0);
    }
  });

  it('catches natural indefinites in outcome scope and permits them in scene scope', () => {
    // The rescope itself, pinned in both directions. Only asserting the loosening
    // would let the detector go inert on outcome prose and still read green.
    for (const bad of ['someone', 'things', 'nothing', 'anything', 'whatever', 'way']) {
      expect(countVagueness(`They left with ${bad} of it.`, 'outcome'), bad).toBeGreaterThan(0);
      expect(countVagueness(`They left with ${bad} of it.`, 'scene'), bad).toBe(0);
    }
  });

  it('demotes intensifiers to a warning rather than a vagueness hit', () => {
    // THR-899 moved these off the fail path in every scope. They must still be
    // *countable* — a demotion that loses the signal entirely is not a demotion.
    for (const weak of ['very', 'deeply', 'profoundly', 'utterly']) {
      const sentence = `The guard waited, ${weak} still in the dark.`;
      expect(countVagueness(sentence, 'outcome'), weak).toBe(0);
      expect(countIntensifiers(sentence), weak).toBeGreaterThan(0);
    }
  });

  it('accepts the reference sentences the rescope was written for', () => {
    // THR-899 acceptance fixtures, verbatim from the ticket. The first is
    // Christian's canonical example of *correct* prose and used to fail; the
    // second is rule zero's canonical example of the detector's real prey.
    const good = 'someone is asking around after the agent, and not in a good way';
    expect(countVagueness(good, 'scene'), 'the reference scene sentence must pass').toBe(0);

    const bad = 'it cost them something';
    expect(countVagueness(bad, 'outcome'), 'the reference outcome sentence must fail').toBeGreaterThan(0);
    // …and it is evasive, not merely indefinite: it fails in every scope.
    expect(countVagueness(bad, 'scene')).toBeGreaterThan(0);
  });

  it('catches an over-budget not-X-but-Y run', () => {
    const overBudget =
      'It was not just a debt but a promise. She was not angry — she was afraid. He came not because he was paid but because he was owed.';
    expect(countNotXButY(overBudget)).toBeGreaterThanOrEqual(NOT_X_BUT_Y_FAIL);
  });
});

describe('Meet The First labels — hard plainness rule', () => {
  it('every label is plain and short', () => {
    for (const [name, value] of Object.entries(LABELS)) {
      const r = scoreProseEntry({
        entryId: `label.${name}`,
        contentType: 'encounter',
        fields: { name: value },
      });
      const plainness = r.registerCompliance.metrics.find((m) => m.name === 'interactivePlainness');
      expect(plainness?.band, `${name} = "${value}" → ${plainness?.detail}`).not.toBe('fail');
      // Labels are interactive-class: evasive terms only. Their real guardrail is
      // `interactivePlainness` above, which THR-899 deliberately left alone.
      expect(
        countVagueness(value, 'interactive'),
        `${name} = "${value}" carries an evasive word`,
      ).toBe(0);
    }
  });
});
