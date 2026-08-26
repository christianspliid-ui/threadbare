/**
 * THR-868 WS6 — the UI slice's wiring contracts.
 *
 * These are the assertions that would have caught the two ways this slice can
 * be silently dead: the stage adapter drifting from the engine's resolution
 * inputs, and `selectDilemmas` dropping `test` at the instance boundary.
 */

import { describe, it, expect, vi } from 'vitest';
import { buildMeetingNudgePhaseModel } from '../buildMeetingNudgePhaseModel';
import { selectDilemmas, resolveFormativeTest, resolveBondTest } from '../../../engine/meetingEncounter';
import { forecastAction } from '../../../engine/resolutionService';
import { ENRICHED_DILEMMA_LIBRARY } from '../../../data/meeting-dilemma-library';
import { MEETING_BOND_TEST } from '../../../data/meeting-bond-test';
import {
  BOND_RECEPTION_BY_BAND,
  MEETING_POOL_MIN_CONVERTED,
  MEETING_TEST_ACTOR_ID,
  MEETING_TEST_CAPABILITY,
  MEETING_TEST_REACH,
  MEETING_TEST_SPHERE_FACTOR,
} from '../../../data/meeting-nudge-constants';
import type { EnrichedDilemmaTemplate, FormativeTest } from '../../../types/meetingEncounter';

/** Every template that has actually been converted. Pinned, not assumed. */
const CONVERTED: readonly EnrichedDilemmaTemplate[] =
  ENRICHED_DILEMMA_LIBRARY.filter((t) => t.test != null);

describe('THR-868 — converted population', () => {
  it('is non-empty (a vacuous suite would pass over zero converted templates)', () => {
    expect(CONVERTED.length).toBeGreaterThan(0);
  });

  it('every converted template satisfies the authoring contract', () => {
    for (const template of CONVERTED) {
      const test = template.test as FormativeTest;
      // THR-1062, director verdict 2026-08-09 (option 2, "loosen the rule").
      // A template that *declares* a target pair must still agree with its test —
      // that is the guard against a mis-keyed axiological conversion, and it
      // holds over all 40 `axiological` conversions, every one of which sets
      // `targetValuePair`. A `reach_specific` template declares only a
      // `targetReach` and never a pair, so it is free to name the axis its own
      // scenario actually tests: the weapons master offering blade or shield is
      // `courage_prudence`, not the `mercy_ruthlessness` that iron maps to.
      // Forcing the reach's pair on it would make the declared axis a lie about
      // the fiction, and `poleLean` cards would then argue an axis the scene
      // never raises.
      if (template.targetValuePair !== undefined) {
        expect(test.valuePair, `${template.id} valuePair`).toBe(template.targetValuePair);
      }
      expect(test.purposeLine.trim().split(/\s+/).length, `${template.id} purposeLine ≤4 words`)
        .toBeLessThanOrEqual(4);
      expect(test.difficulty, `${template.id} difficulty`).toBeGreaterThanOrEqual(0);
      expect(test.difficulty, `${template.id} difficulty`).toBeLessThanOrEqual(1);

      expect(test.factorLines.length, `${template.id} factorLines 2–4`).toBeGreaterThanOrEqual(2);
      expect(test.factorLines.length, `${template.id} factorLines 2–4`).toBeLessThanOrEqual(4);

      expect(test.nudges.length, `${template.id} hand 4–8`).toBeGreaterThanOrEqual(4);
      expect(test.nudges.length, `${template.id} hand 4–8`).toBeLessThanOrEqual(8);

      // ≥1 sphere-less common option, or a player holding no essence in the
      // hand's spheres has nothing playable at all.
      expect(
        test.nudges.some((n) => n.sphere == null),
        `${template.id} has ≥1 common (sphere-less) card`,
      ).toBe(true);

      // Sphere coverage ≥4 across the hand.
      const spheres = new Set(test.nudges.map((n) => n.sphere).filter(Boolean));
      expect(spheres.size, `${template.id} sphere coverage ≥4`).toBeGreaterThanOrEqual(4);

      // Both poles must be leanable, or the test can only ever be pushed one way.
      const leans = new Set(test.nudges.map((n) => n.poleLean).filter(Boolean));
      expect(leans.has('a'), `${template.id} has a pole-'a' card`).toBe(true);
      expect(leans.has('b'), `${template.id} has a pole-'b' card`).toBe(true);

      // All five prose slots authored — a missing slot renders blank at the
      // exact moment the player is waiting for fate's answer.
      for (const slot of ['cleanA', 'cleanB', 'tempered', 'brokenIntoA', 'brokenIntoB'] as const) {
        expect(test.bandProse[slot]?.length ?? 0, `${template.id} bandProse.${slot}`)
          .toBeGreaterThan(0);
      }

      // Card ids unique within the hand — duplicates make toggle state ambiguous.
      const ids = test.nudges.map((n) => n.id);
      expect(new Set(ids).size, `${template.id} card ids unique`).toBe(ids.length);
    }
  });

  // ── Slot-2 pool coverage (THR-1062) ────────────────────────────────
  //
  // `selectDilemmas` fills slot 2 from `reach_specific` templates matching the
  // primary *or* secondary reach. Below `MEETING_POOL_MIN_CONVERTED` converted
  // candidates a reach draws the same test every run, which reads worse than
  // the legacy choice scene — so this is the assertion the slot-2 half of
  // Batch A exists to satisfy.
  //
  // Predicate, not a snapshot count (THR-688 rule A): every reach must clear
  // the bar. Adding a ninth reach makes this fail until that reach is authored,
  // which is the intended behaviour.
  it(`every reach has ≥${MEETING_POOL_MIN_CONVERTED} converted slot-2 candidates`, () => {
    const reachSpecific = ENRICHED_DILEMMA_LIBRARY.filter((t) => t.category === 'reach_specific');
    // Guard against a vacuous pass over an empty population.
    expect(reachSpecific.length).toBeGreaterThan(0);

    const reaches = [...new Set(reachSpecific.map((t) => t.targetReach))];
    expect(reaches.length, 'every reach_specific template declares a targetReach').toBe(
      [...new Set(reachSpecific.filter((t) => t.targetReach != null).map((t) => t.targetReach))].length,
    );

    for (const reach of reaches) {
      const converted = reachSpecific.filter((t) => t.targetReach === reach && t.test != null);
      expect(converted.length, `${reach} converted slot-2 candidates`).toBeGreaterThanOrEqual(
        MEETING_POOL_MIN_CONVERTED,
      );
    }
  });
});

describe('THR-868 — selectDilemmas carries `test` to the instance', () => {
  it('a converted template selected into a run arrives with its test attached', () => {
    const converted = CONVERTED[0];
    // Drive the real selector rather than hand-building an instance: the bug
    // this guards against lives in the selector's field allowlist, so a
    // fixture that supplied `test` itself would verify fiction.
    const instances = selectDilemmas(
      [converted],
      'iron',
      'gold',
      'life',
      'any-archetype',
      'village',
      42,
    );
    expect(instances.length).toBeGreaterThan(0);
    const match = instances.find((i) => i.templateId === converted.id);
    expect(match, 'converted template was selected').toBeDefined();
    expect(match?.test, 'test survived the template→instance mapping').toBeDefined();
    expect(match?.test?.valuePair).toBe(converted.test?.valuePair);
  });

  it('an unconverted template arrives with no test (the legacy branch stays reachable)', () => {
    const unconverted = ENRICHED_DILEMMA_LIBRARY.find((t) => t.test == null);
    expect(unconverted, 'library still has unconverted templates').toBeDefined();
    const instances = selectDilemmas(
      [unconverted!],
      'iron',
      'gold',
      'life',
      'any-archetype',
      'village',
      42,
    );
    expect(instances[0]?.test).toBeUndefined();
  });
});

describe('THR-868 — stage adapter mirrors the engine resolution inputs', () => {
  const test = CONVERTED[0].test as FormativeTest;

  it('builds the exact ResolutionInput resolveMeetingBand rolls against', () => {
    const phase = buildMeetingNudgePhaseModel({
      test,
      testId: CONVERTED[0].id,
      stepIndex: 0,
      essencePool: { life: 10 },
    });

    expect(phase.forecastInput).toEqual({
      actorId: MEETING_TEST_ACTOR_ID,
      domain: MEETING_TEST_REACH,
      capability: MEETING_TEST_CAPABILITY,
      difficulty: test.difficulty,
      sphereFactor: MEETING_TEST_SPHERE_FACTOR,
      actionModifiers: 0,
    });
  });

  it('the displayed base forecast is the same call resolution makes', () => {
    const phase = buildMeetingNudgePhaseModel({
      test,
      testId: CONVERTED[0].id,
      stepIndex: 0,
    });
    const direct = forecastAction(phase.forecastInput);
    expect(phase.baseForecast.tier).toBe(direct.forecastTier);
    expect(phase.baseForecast.probability).toBe(direct.successProbability);
  });

  it('renders every authored card, dimming only what the pool cannot cover', () => {
    const poor = buildMeetingNudgePhaseModel({
      test,
      testId: CONVERTED[0].id,
      stepIndex: 0,
      essencePool: { life: 0 },
    });
    expect(poor.cards.length).toBe(test.nudges.length);

    const freeCards = test.nudges.filter((n) => n.essenceCost === 0).map((n) => n.id);
    for (const card of poor.cards) {
      const expected = freeCards.includes(card.id) ? 'playable' : 'dimmed';
      expect(card.state, `${card.id} with an empty pool`).toBe(expected);
    }
    // A dimmed card always says why — that is why it dims instead of hiding.
    for (const card of poor.cards.filter((c) => c.state === 'dimmed')) {
      expect(card.blockedReason, `${card.id} reason`).toBeTruthy();
    }
  });

  it('an unaffordable card becomes playable once the pool covers it', () => {
    const rich = buildMeetingNudgePhaseModel({
      test,
      testId: CONVERTED[0].id,
      stepIndex: 0,
      essencePool: { life: 99 },
    });
    expect(rich.cards.every((c) => c.state === 'playable')).toBe(true);
  });

  it('substitutes {agent.*} placeholders in cards, factors and purpose line', () => {
    // Regression: `NudgePhaseShell` renders these strings verbatim — it is a
    // generic surface with no knowledge of the meeting's candidate — so a
    // literal `{agent.name}` reached the player on every authored card until
    // the adapter took over substitution. Caught in browser verification.
    const phase = buildMeetingNudgePhaseModel({
      test,
      testId: CONVERTED[0].id,
      stepIndex: 0,
      essencePool: { life: 99 },
      agentName: 'Maren Aldwych',
      locationName: 'Fenmarch',
    });

    const rendered = [
      phase.testPanel.purposeLine ?? '',
      ...phase.testPanel.factors.map((f) => f.text),
      ...phase.cards.flatMap((c) => [c.name, c.effectLine]),
    ];
    for (const line of rendered) {
      expect(line, 'no raw placeholder reaches the shell').not.toMatch(/\{agent\./);
    }

    // And the substitution actually happened somewhere — otherwise a hand that
    // simply authored no placeholders would pass the check above vacuously.
    const authoredPlaceholders = [
      test.purposeLine,
      ...test.factorLines.map((f) => f.text),
      ...test.nudges.flatMap((n) => [n.name, n.effectLine]),
    ].some((s) => /\{agent\./.test(s));
    expect(authoredPlaceholders, 'fixture actually exercises substitution').toBe(true);
    expect(rendered.some((l) => l.includes('Maren Aldwych'))).toBe(true);
  });

  it('accepts the bond test through the same builder', () => {
    const phase = buildMeetingNudgePhaseModel({
      test: MEETING_BOND_TEST,
      testId: MEETING_BOND_TEST.id,
      stepIndex: 2,
      essencePool: { life: 99 },
    });
    expect(phase.cards.length).toBe(MEETING_BOND_TEST.nudges.length);
    expect(phase.testPanel.purposeLine).toBe(MEETING_BOND_TEST.purposeLine);
  });
});

describe('THR-868 — the ladder is playable, not pre-lost', () => {
  // Regression for the tuning fault the UI slice exposed: at capability 0.5 an
  // authored difficulty of 0.5 forecast p=0.09 (`doomed`), so every formative
  // test opened as already lost and needed a hand costing more essence than the
  // player holds to reach the middle. These pin the *shape*, not the constant —
  // retuning is allowed, opening at `doomed` with no cards played is not.
  const MID_DIFFICULTY = 0.5;

  const forecastAt = (actionModifiers: number) =>
    forecastAction({
      actorId: MEETING_TEST_ACTOR_ID,
      domain: MEETING_TEST_REACH,
      capability: MEETING_TEST_CAPABILITY,
      difficulty: MID_DIFFICULTY,
      sphereFactor: MEETING_TEST_SPHERE_FACTOR,
      actionModifiers,
    });

  it('an unled moment at mid difficulty is genuinely uncertain, not doomed', () => {
    const base = forecastAt(0);
    expect(base.forecastTier).not.toBe('doomed');
    expect(base.successProbability).toBeGreaterThan(0.25);
    expect(base.successProbability).toBeLessThan(0.6);
  });

  it('a modest two-card lean moves the forecast up a tier', () => {
    const base = forecastAt(0);
    const leaned = forecastAt(0.22);
    expect(leaned.successProbability).toBeGreaterThan(base.successProbability);
    expect(leaned.forecastTier).not.toBe(base.forecastTier);
  });

  it('every converted hand is affordable within the meeting cost cap', () => {
    for (const template of CONVERTED) {
      const test = template.test as FormativeTest;
      // At least two cards must be playable on a starting pool, or the hand is
      // decorative. The free options alone have to clear that bar.
      const free = test.nudges.filter((n) => n.essenceCost === 0);
      expect(free.length, `${template.id} free options`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('THR-868 — the real bond test has no dead reception', () => {
  // The engine suite drives `resolveBondTest` with its own fixtures, which warn
  // "no content for reception X" — that is the fixture being partial, not the
  // shipped content. This pins the *real* bond test: every reception a band can
  // produce must be authored, and the fallback must never fire on real data.
  it('authors content for every reception reachable from a band', () => {
    const reachable = new Set(Object.values(BOND_RECEPTION_BY_BAND));
    for (const reception of reachable) {
      const content = MEETING_BOND_TEST.receptions[reception];
      expect(content, `bond reception '${reception}' is unauthored`).toBeDefined();
      expect(content.prose.length, `bond reception '${reception}' prose`).toBeGreaterThan(0);
      expect(content.traitSeed.length, `bond reception '${reception}' traitSeed`).toBeGreaterThan(0);
    }
  });

  it('never falls back across a wide seed sweep', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const seen = new Set<string>();
    try {
      for (let seed = 0; seed < 300; seed++) {
        seen.add(resolveBondTest(MEETING_BOND_TEST, [], seed).reception);
      }
    } finally {
      warn.mockRestore();
    }
    expect(warn, 'fallback warning fired on shipped content').not.toHaveBeenCalled();
    // Guard against a vacuous sweep: an empty hand must still reach more than
    // one reception, or this loop proves nothing about the ladder.
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('THR-868 — the committed hand reaches resolution', () => {
  const template = CONVERTED[0];
  const test = template.test as FormativeTest;

  it('a leaned hand is recorded on the outcome it produces', () => {
    const poleA = test.nudges.find((n) => n.poleLean === 'a')!;
    const outcome = resolveFormativeTest(test, 0, template.id, [poleA.id], 7);
    expect(outcome.netLean).toBe('a');
    expect(outcome.playedNudgeIds).toEqual([poleA.id]);
    expect(outcome.templateId).toBe(template.id);
    expect(outcome.prose.length).toBeGreaterThan(0);
  });

  it('is deterministic for a given seed (NFP #3)', () => {
    const ids = [test.nudges[0].id];
    const a = resolveFormativeTest(test, 0, template.id, ids, 99);
    const b = resolveFormativeTest(test, 0, template.id, ids, 99);
    expect(a).toEqual(b);
  });

  it('an empty hand still resolves — an unled moment is a legitimate play', () => {
    const outcome = resolveFormativeTest(test, 0, template.id, [], 12);
    expect(outcome.netLean).toBe('none');
    expect(outcome.prose.length).toBeGreaterThan(0);
    expect(['a', 'b']).toContain(outcome.writtenPole);
  });
});
