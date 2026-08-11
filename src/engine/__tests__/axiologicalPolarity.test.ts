/**
 * Axiological polarity contract (THR-1071).
 *
 * `AxiologicalProfile` is signed: `+1` = the **first-named pole** of the
 * `ValuePair`, `-1` = the second (`src/types/agent.ts`, `poleLean.ts`,
 * `meetingEncounter.ts` — one convention, stated in all three). A converted
 * dilemma writes that profile down **two independent paths**:
 *
 * - the **legacy** path, through the authored `choices[].axiologicalShifts`;
 * - the **formative** path, through `resolveFormativeTest`, which writes
 *   `+magnitude` for pole `'a'` and renders `bandProse.cleanA` / `brokenIntoA`.
 *
 * Before THR-1071 nothing checked either path against the convention or against
 * the other, and **all 40** converted templates were wrong: 35 had inverted
 * authored shift signs (showing mercy made an agent more ruthless), and the 5
 * stone templates had an inverted `test` binding instead — the one reach where
 * the `humility_pride → preservation_transformation` rename cancelled the sign
 * inversion, so its shifts were right and its pole letters were not. Two
 * defects, opposite halves, invisible from either path alone. This file is the
 * guard whose absence let that ship.
 */
import { describe, it, expect } from 'vitest';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';
import type { EnrichedDilemmaTemplate } from '../../types/meetingEncounter';

/**
 * Which choice expresses the **first-named pole** of the template's `ValuePair`.
 *
 * Hand-recorded, because it is a reading of the prose — no derivation from the
 * data can establish it, and deriving it from the shift signs would make this
 * whole file circular. Each entry was read off the choice text, its `gateTags`
 * and its `traitSeeds`, which agree in every case (THR-1071's per-template
 * audit). Changing a row is asserting that a choice's *story* changed sides.
 *
 * Value is the index into `choices`. Note the eight rows that are `1`: those
 * templates narrate the second pole first, which is exactly why the original
 * "choice `a` carries a negative shift" measurement scored three of them clean
 * when they were as inverted as the rest.
 */
const FIRST_POLE_CHOICE_INDEX: Readonly<Record<string, 0 | 1>> = {
  // Iron — mercy(+) / ruthlessness(-)
  'AX-IRON-01': 0, // a: water to the wounded raider    | b: watches him die
  'AX-IRON-02': 0, // a: speaks for the starving thief  | b: lets the sentence stand
  'AX-IRON-03': 0, // a: carries the children out       | b: the calculated rescue
  'AX-IRON-04': 0, // a: shelters the deserter          | b: puts him on the road
  'AX-IRON-05': 1, // a: performs the execution         | b: sets the blade down
  // Gold — asceticism(+) / extravagance(-)
  'AX-GOLD-01': 0, // a: cancels the feast              | b: lets the square eat
  'AX-GOLD-02': 0, // a: gives up the pendant           | b: keeps the heirloom
  'AX-GOLD-03': 0, // a: reports the cheat              | b: learns the trade
  'AX-GOLD-04': 0, // a: feeds her, no ledger           | b: feeds her, on terms
  'AX-GOLD-05': 0, // a: walks away from the carving    | b: buys the dancer
  // Shadow — honesty(+) / cunning(-)
  'AX-SHADOW-01': 0, // a: tells the elders plainly     | b: keeps the leverage
  'AX-SHADOW-02': 1, // a: the forged letter            | b: the plain warning
  'AX-SHADOW-03': 0, // a: repeats the message          | b: carries it sealed
  'AX-SHADOW-04': 1, // a: lets the founding lie stand  | b: tells the elders
  'AX-SHADOW-05': 0, // a: sits for the mirror          | b: refuses to look
  // Veil — tradition(+) / novelty(-)
  'AX-VEIL-01': 0, // a: sings the old words            | b: speaks the new ones
  'AX-VEIL-02': 0, // a: keeps her with the herb-keeper | b: the foreigner's tent
  'AX-VEIL-03': 0, // a: refits the broken shrine       | b: quarries new stone
  'AX-VEIL-04': 0, // a: memorizes, refuses the stylus  | b: takes up the stylus
  'AX-VEIL-05': 0, // a: defends the covenant           | b: reads the seams
  // Heart — loyalty(+) / ambition(-)
  'AX-HEART-01': 0, // a: stays at the bellows          | b: runs for the wagon
  'AX-HEART-02': 0, // a: speaks the faction's words    | b: refuses to lie
  'AX-HEART-03': 0, // a: hands over the coins          | b: refuses, offers help
  'AX-HEART-04': 0, // a: buries the dying man's words  | b: speaks them
  'AX-HEART-05': 0, // a: honours the horse-agreement   | b: keeps the horse
  // Eye — revelation(+) / discretion(-)
  'AX-EYE-01': 0, // a: speaks at the planting council  | b: plants barley, quiet
  'AX-EYE-02': 0, // a: warns the bride                 | b: says nothing
  'AX-EYE-03': 0, // a: corrects the dignitary          | b: lifts the cup
  'AX-EYE-04': 0, // a: the whole eulogy                | b: the bridge only
  'AX-EYE-05': 0, // a: tells the mentor                | b: builds around them
  // Stone — preservation(+) / transformation(-). The pair was renamed from
  // `humility_pride` at import, which inverted the pole *names*: humility is
  // the transforming side, pride the preserving one. So the *pride* choice is
  // the first pole here, and stone's authored shifts were right all along.
  'AX-STONE-01': 1, // a: laughs at the failure         | b: "the soil was wrong"
  'AX-STONE-02': 1, // a: yields in the ring            | b: says no, takes it
  'AX-STONE-03': 1, // a: credits the scholar           | b: keeps the credit
  'AX-STONE-04': 1, // a: refuses the pedestal          | b: accepts the sign
  'AX-STONE-05': 1, // a: "thank you", hangs it up      | b: demands the grade
  // Star — sacrifice(+) / survival(-)
  'AX-STAR-01': 0, // a: crawls into the mine           | b: runs the rescue
  'AX-STAR-02': 0, // a: splits every meal              | b: eats the full portion
  'AX-STAR-03': 0, // a: rows out to the plague ship    | b: poles it past the bar
  'AX-STAR-04': 0, // a: burns the bridge               | b: holds the bridge
  'AX-STAR-05': 0, // a: goes over the mountain         | b: stays, works the night
};

const STOP = new Set([
  'agent', 'name', 'the', 'and', 'of', 'to', 'in', 'is', 'it', 'that', 'which', 'with', 'for',
  'not', 'but', 'on', 'at', 'as', 'his', 'her', 'their', 'this', 'what', 'who', 'does', 'has',
  'have', 'had', 'was', 'were', 'been', 'are', 'from', 'by', 'out', 'into', 'over', 'after',
  'before', 'all', 'some', 'more', 'than', 'then', 'there', 'when', 'while', 'because',
  'something', 'someone', 'nothing', 'anything', 'its', 'about', 'like', 'goes', 'back', 'down',
  'off', 'own', 'way', 'long', 'enough', 'never', 'still', 'only', 'very', 'much', 'make',
  'makes', 'made', 'say', 'says', 'said',
]);

/** Distinctive content words, for matching a band's prose to the choice it narrates. */
function contentTokens(s: string): Set<string> {
  return new Set(
    (s.toLowerCase().match(/[a-z']+/g) ?? [])
      .map(w => w.replace(/'s$/, ''))
      .filter(w => w.length > 3 && !STOP.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const x of a) if (b.has(x)) shared++;
  return shared / (a.size + b.size - shared || 1);
}

/**
 * Which choice a band's prose narrates, by content-word overlap.
 *
 * Derived rather than recorded on purpose: a second hand table would just be
 * this file asserting against itself. A **clean** band re-narrates its choice's
 * concrete nouns, so the two separate cleanly — measured across all 40
 * templates the correct choice wins by ≥35% relative margin. A rewrite that
 * drifts a clean band's vocabulary far enough to flip this fails loudly and
 * readably, which is the right trade for a guard that exists because 40
 * templates shipped inverted in silence.
 *
 * **Only the clean bands are matchable this way.** A `brokenInto*` band narrates
 * a *crossing* — it opens on one pole's setup and ends at the other ("the three
 * apprentices assembled … on the mountain road within the hour") — so it carries
 * both choices' vocabulary by construction and scores 26/40 and 20/40, at times
 * on a zero margin. That is a property of how those bands are written, not a
 * defect in them. Asserting the clean pair is enough to catch the inversion this
 * file exists for: `selectFormativeProse` keys all four keys off the same
 * `writtenPole`, so a binding that flips flips them together.
 */
function narratedChoiceIndex(prose: string, t: EnrichedDilemmaTemplate): 0 | 1 {
  const p = contentTokens(prose);
  return jaccard(p, contentTokens(t.choices[0].text)) >= jaccard(p, contentTokens(t.choices[1].text)) ? 0 : 1;
}

const converted = ENRICHED_DILEMMA_LIBRARY.filter(
  (t): t is EnrichedDilemmaTemplate & { test: NonNullable<EnrichedDilemmaTemplate['test']> } =>
    t.category === 'axiological' && Boolean(t.test),
);

describe('axiological polarity contract (THR-1071)', () => {
  it('records a first-pole reading for every converted template, and no others', () => {
    // A ticket-shaped count would rot; the predicate is "converted axiological".
    expect(converted.length).toBeGreaterThan(0);
    expect(Object.keys(FIRST_POLE_CHOICE_INDEX).sort()).toEqual(converted.map(t => t.id).sort());
  });

  it('every converted template offers exactly two choices', () => {
    for (const t of converted) {
      expect(t.choices, t.id).toHaveLength(2);
    }
  });

  describe.each(converted.map(t => [t.id, t] as const))('%s', (id, t) => {
    const pair = t.test.valuePair;
    const firstIdx = FIRST_POLE_CHOICE_INDEX[id];
    const secondIdx = (1 - firstIdx) as 0 | 1;

    it('binds the test to the template\'s own target pair', () => {
      expect(pair).toBe(t.targetValuePair);
    });

    // Defect 1 — the legacy path. The choice whose content is the first-named
    // pole must write a positive shift, and its opposite a negative one.
    it(`legacy path: the ${pair.split('_')[0]} choice writes a positive shift`, () => {
      const first = t.choices[firstIdx].axiologicalShifts?.[pair];
      const second = t.choices[secondIdx].axiologicalShifts?.[pair];
      expect(typeof first, `${id} choice ${firstIdx} has no ${pair} shift`).toBe('number');
      expect(typeof second, `${id} choice ${secondIdx} has no ${pair} shift`).toBe('number');
      expect(first, `${id}: choice ${firstIdx} is ${pair.split('_')[0]} and must write +`).toBeGreaterThan(0);
      expect(second, `${id}: choice ${secondIdx} is ${pair.split('_')[1]} and must write -`).toBeLessThan(0);
    });

    // Defect 2 — the formative path. `resolveFormativeTest` writes `+magnitude`
    // for pole `'a'` and renders the `*A` prose, so the `*A` bands must narrate
    // the same outcome the first-pole choice does. When these disagree the two
    // paths write opposite profiles for one narrative outcome.
    it('formative path: the pole-`a` band narrates the first-pole choice', () => {
      expect(narratedChoiceIndex(t.test.bandProse.cleanA, t), `${id}: cleanA`).toBe(firstIdx);
      expect(narratedChoiceIndex(t.test.bandProse.cleanB, t), `${id}: cleanB`).toBe(secondIdx);
    });

    it('authors all five bands as distinct prose', () => {
      const bands = t.test.bandProse;
      const written = [bands.cleanA, bands.cleanB, bands.brokenIntoA, bands.brokenIntoB, bands.tempered];
      for (const b of written) expect(b.trim().length, `${id}: empty band`).toBeGreaterThan(0);
      // A duplicated band is how a half-applied pole swap would hide.
      expect(new Set(written).size, `${id}: two bands share prose`).toBe(written.length);
    });

    it('offers the god a card for each pole', () => {
      const leans = new Set(t.test.nudges.map(n => n.poleLean).filter(Boolean));
      expect(leans, `${id}: a test with no card for one pole cannot be leaned both ways`).toContain('a');
      expect(leans).toContain('b');
    });
  });
});
