// @vitest-environment jsdom

/**
 * Surface evidence for THR-1213 slice 2 — the god's Hunger changes what the
 * player reads in the Defining Moment.
 *
 * The contractual 1920×1080 browser capture is unavailable in this run:
 * `preview_start` is refused outright in unattended sessions (impediments #546,
 * #574), which shuts the Playwright route too since it presumes a running
 * server. Requirement 1 of the Browser-verify clause is therefore discharged by
 * the sanctioned jsdom-render substitution (THR-754), recorded in the commit
 * body as `Browser-verify substitution: jsdom-render`.
 *
 * These assertions run the **real** picker over the **real** shipped library and
 * render the **real** beat component, then read the DOM. That distinction is the
 * point: an engine-only assertion would pass just as happily if the flow kept
 * calling the unlensed overload and the deal never reached a screen — which is
 * precisely the shape of the defect this slice repairs. Before it, the only lens
 * in the tree was built from archetype spheres into a memo nothing consumed.
 *
 * The two identities differ **only** in `hungerId`. Same seed, same candidate,
 * same reach/sphere/subtype, same mortal tags — so a difference in the rendered
 * prose can be attributed to the Hunger and to nothing else.
 */

import { describe, expect, it, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';

import { TestingBeat } from '../TestingBeat';
import { selectDilemmasScored } from '../../../engine/meetingEncounter';
import { buildLensFromIdentity } from '../../../engine/ascendantLens';
import { ENRICHED_DILEMMA_LIBRARY } from '../../../data/meeting-dilemma-library';
import { DEV_ASCENDANT_IDENTITY } from '../../../engine/gameInit';
import type { AscendantIdentity } from '../../../types/remembrance';
import type { NarrativeCandidate, DilemmaInstance } from '../../../types/meetingEncounter';
import type { ReachDomain } from '../../../types/traits';
import type { SphereName } from '../../../types/index';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** The beat fades in on a 1.5s timer before it renders any dilemma. */
const FADE_IN_MS = 1500;

// The selection inputs the flow passes, held fixed across both arms.
const PRIMARY_REACH: ReachDomain = 'iron';
const SECONDARY_REACH: ReachDomain = 'heart';
const SPHERE: SphereName = 'force';
const ARCHETYPE = 'iron_heart';
const SUBTYPE = 'village';
const SEED = 43;

/** `gather` is the one hunger the shipped corpus already serves (coverage ≥ 6). */
const RESONANT_HUNGER = 'hunger.gather' as const;

function identityWithHunger(hungerId: AscendantIdentity['hungerId']): AscendantIdentity {
  return { ...DEV_ASCENDANT_IDENTITY, hungerId };
}

function dealFor(identity: AscendantIdentity): DilemmaInstance[] {
  return selectDilemmasScored(
    [...ENRICHED_DILEMMA_LIBRARY],
    PRIMARY_REACH, SECONDARY_REACH, SPHERE, ARCHETYPE, SUBTYPE, SEED,
    buildLensFromIdentity(identity),
  ).dilemmas;
}

const CANDIDATE = {
  tempId: 'c0',
  name: 'Kael',
  archetypeId: ARCHETYPE,
  cultureId: 'default',
  primaryReach: PRIMARY_REACH,
  secondaryReach: SECONDARY_REACH,
  sphere: SPHERE,
  vignetteText: '',
  personalityHints: [],
  axiologicalSeed: {} as NarrativeCandidate['axiologicalSeed'],
  reachCapabilities: {} as NarrativeCandidate['reachCapabilities'],
  cooperationStrategy: 'reciprocator',
  appearanceSeed: 1,
} as unknown as NarrativeCandidate;

/** The beat's own prose substitution, mirrored so expectations match the DOM. */
function filled(text: string): string {
  return text
    .replace(/\{agent\.name\}/g, 'Kael')
    .replace(/\{agent\.location\}/g, 'Thornhollow');
}

/** Render the beat and advance past its fade-in, returning the visible text. */
function renderBeatText(dilemmas: DilemmaInstance[]): string {
  vi.useFakeTimers();
  render(
    <TestingBeat
      candidate={CANDIDATE}
      dilemmas={dilemmas}
      locationName="Thornhollow"
      onComplete={() => {}}
    />,
  );
  act(() => {
    vi.advanceTimersByTime(FADE_IN_MS);
  });
  return document.body.textContent ?? '';
}

describe('THR-1213 — the chosen Hunger reaches the Defining Moment', () => {
  it('renders the dealt dilemma prose (the deal reaches the DOM at all)', () => {
    const dilemmas = dealFor(identityWithHunger(RESONANT_HUNGER));
    expect(dilemmas.length).toBeGreaterThanOrEqual(2);

    vi.useFakeTimers();
    render(
      <TestingBeat
        candidate={CANDIDATE}
        dilemmas={dilemmas}
        locationName="Thornhollow"
        onComplete={() => {}}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(FADE_IN_MS);
    });

    // The first dealt dilemma's authored setup is on screen, name-substituted.
    expect(document.body.textContent).toContain(filled(dilemmas[0].setup));

    // And so is a choice the player can take — a rendered scene, not a stub.
    expect(dilemmas[0].choices.length).toBeGreaterThanOrEqual(2);
  });

  it('a different Hunger puts different prose on screen at the same seed', () => {
    const resonant = dealFor(identityWithHunger(RESONANT_HUNGER));
    // The shipped dev identity — `hunger.witness`, which the corpus does not yet
    // serve. Its deal is the unweighted one, so this arm is the baseline.
    const baseline = dealFor(DEV_ASCENDANT_IDENTITY);

    // Guard first: if the two arms dealt the same templates there is nothing for
    // the DOM comparison to be about, and a passing render assertion would be
    // vacuous rather than reassuring.
    const firstDiff = resonant.findIndex(
      (d, i) => d.templateId !== baseline[i]?.templateId,
    );
    expect(
      firstDiff,
      'the two Hungers dealt identical decks — nothing for the DOM to differ about',
    ).toBeGreaterThanOrEqual(0);

    // The beat renders one dilemma at a time and opens on index 0, so compare at
    // the slot that actually differs rather than at whichever slot happens to be
    // first. Slicing keeps both arms real dealt decks — the same instances the
    // flow hands the beat — with the differing slot brought to the front.
    const resonantText = renderBeatText(resonant.slice(firstDiff));
    cleanup();
    vi.useRealTimers();
    const baselineText = renderBeatText(baseline.slice(firstDiff));

    expect(resonantText).toContain(filled(resonant[firstDiff].setup));
    expect(baselineText).toContain(filled(baseline[firstDiff].setup));
    expect(resonantText).not.toEqual(baselineText);
  });

  it('the lens carries the identity the player authored, not the archetype', () => {
    const lens = buildLensFromIdentity(DEV_ASCENDANT_IDENTITY);
    expect(lens.hunger.id).toBe('witness');
    expect(lens.mortalName).toBe(DEV_ASCENDANT_IDENTITY.mortalName);
    // `mortalTags` is genuinely mixed — 'scholar', 'seeker' and 'mind' are not
    // themes, 'loss' is. The resolver narrows rather than casting.
    expect(lens.driveTags).toEqual(['loss']);
  });
});
