// @vitest-environment jsdom
//
// THR-1451 — the rest of the percentage sweep: the four classes THR-1424's ruling did not
// settle by itself. The rulings this file guards are recorded in `Docs/design-system/laws.md`
// under Law 13; the short forms:
//
//   A — a delta is a CONVERSION into the Law 15 delta cluster, not a drop.
//   B — a probability is a CONVERSION into pips, not a drop.
//   C — a plain proportion drops to the reading the surface already had.
//   D — app chrome and designer-gated readouts are out of membership.
//
// This file is also the ticket's **Browser-verify substitution** (`jsdom-render`): the run
// that shipped it was a scheduled, unattended one, where `preview_start` is refused outright
// and the Playwright route is shut with it (verification-gates.md, impediments #546/#574).
//
// **Every negative arm is paired with a positive one.** A bare `not.toMatch(/%/)` passes just
// as happily on a component that rendered nothing at all, so each arm below also proves the
// bar, cluster, pip row or word the player is now meant to read is actually there. THR-1424's
// first draft learned this the hard way and THR-1426 hit the same trap again a day later.
//
// **Modal surfaces assert on `baseElement`, never `container`.** `Modal` uses `createPortal`,
// so RTL's `container` is EMPTY for `MandateDetail` — an arm on `container` is vacuously true
// no matter what the component draws. This is the third recurrence of that trap (impediment
// #1009); it is called out here so the fourth does not have to rediscover it.
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MandateDetail } from '../MandateDetail';
import { MandateTracker } from '../MandateTracker';
import { InterventionConfirm } from '../InterventionConfirm';
import { OmenDetail } from '../OmenDetail';
import { InfoPanel } from '../../UI/InfoPanel';
import { sphereDeltaReading, GROWTH_DELTA_CLUSTER_COLLAPSE } from '../../../engine/aftermathWords';
import { hostilityLabel } from '../../../data/uiColorPalette';
import { geoWord, ELEVATION_WORDS, MOISTURE_WORDS, TEMPERATURE_WORDS } from '../../../data/geo-word-bands';
import { DELTA_CLUSTER_BAND_MAP } from '../encounter-stage/adapters/buildAftermathConsequences';
import type { MandateDefinition, MandateState } from '../../../types/mandate';
import type { HexTile } from '../../../types';

// ─── Fixtures ───────────────────────────────────────────────────────

const sphereGrowthDefinition: MandateDefinition = {
  id: 'mandate.growth',
  type: 'sphere_dominance',
  runtimeKind: 'sphere_growth',
  name: 'The Rising Mind',
  description: 'Raise mind, and let spirit follow.',
  primarySphere: 'mind',
  secondarySphere: 'spirit',
  primaryTargetDelta: 0.12,
  secondaryTargetDelta: 0.08,
  checkpoints: [
    {
      index: 0,
      doomProgressThreshold: 0.4,
      label: 'First Omen',
      description: 'Hold the opening omen.',
      requiredPrimaryDelta: 0.07,
      requiredSecondaryDelta: 0.04,
    },
  ],
  stages: [
    { stage: 'setup', description: 'Begin', conditions: [{ type: 'custom', description: 'x', params: {} }] },
    { stage: 'escalation', description: 'Press', conditions: [{ type: 'custom', description: 'x', params: {} }] },
    { stage: 'culmination', description: 'Hold', conditions: [{ type: 'custom', description: 'x', params: {} }] },
  ],
} as MandateDefinition;

const sphereGrowthState: MandateState = {
  mandateId: 'mandate.growth',
  currentStage: 'escalation',
  progress: 0.5,
  completed: false,
  failed: false,
  primaryDelta: 0.09,
  secondaryDelta: -0.03,
  checkpointResults: [
    { index: 0, passed: true, exceeded: false, evaluatedTick: 20, observedPrimaryDelta: 0.09 },
  ],
} as MandateState;

// Real union members, not `as never` — an invented prop shape verifies fiction, and the
// missing REQUIRED fields (`rangeStatus`, `hexDistance`, `description`) were caught by the
// ratchet rather than the suite, which renders such a fixture perfectly happily.
const interventionBaseProps = {
  interventionType: 'deceive' as const,
  label: 'Deceive',
  deliveryMode: 'regional' as const,
  essenceCost: 2,
  sphere: 'mind' as const,
  rangeStatus: 'in_range' as const,
  hexDistance: 2,
  description: 'Inject false information into world-model',
  onConfirm: () => {},
  onCancel: () => {},
};

const tile = {
  coord: { col: 3, row: 4 },
  terrain: 'plains',
  geoParams: { elevation: 0.12, temperature: 0.55, moisture: 0.91 },
} as unknown as HexTile;

// ─── Class A — a delta reads as a cluster ───────────────────────────

describe('Class A — sphere deltas read as the delta cluster (THR-1451)', () => {
  it('sphereDeltaReading bands direction, count and words without emitting a numeral', () => {
    const rise = sphereDeltaReading(0.09, 'mind');
    expect(rise).not.toBeNull();
    expect(rise!.direction).toBe('gain');
    expect(rise!.count).toBeGreaterThanOrEqual(1);
    expect(rise!.count).toBeLessThanOrEqual(3);
    expect(rise!.label).toContain('mind');
    expect(rise!.label).toContain('rose');
    // The whole point: the reading carries no digits at all.
    expect(rise!.label).not.toMatch(/[0-9]/);
    expect(rise!.label).not.toMatch(/%/);
  });

  it('reads a fall as a loss, and an unmoved sphere as no cluster at all', () => {
    expect(sphereDeltaReading(-0.09, 'spirit')!.direction).toBe('loss');
    expect(sphereDeltaReading(-0.09, 'spirit')!.label).toContain('fell');
    // A change that did not happen draws nothing, rather than an empty run of marks.
    expect(sphereDeltaReading(0, 'mind')).toBeNull();
    expect(sphereDeltaReading(undefined, 'mind')).toBeNull();
    expect(sphereDeltaReading(Number.NaN, 'mind')).toBeNull();
  });

  it('bands a bigger delta to at least as many marks as a smaller one', () => {
    // Monotonicity is the property a player relies on when comparing two clusters.
    // Asserting it directly beats pinning counts to literals that a retune would break.
    const small = sphereDeltaReading(0.02, 'mind')!.count;
    const mid = sphereDeltaReading(0.10, 'mind')!.count;
    const large = sphereDeltaReading(0.60, 'mind')!.count;
    expect(mid).toBeGreaterThanOrEqual(small);
    expect(large).toBeGreaterThanOrEqual(mid);
    expect(large).toBeGreaterThan(small);
  });

  it('the aftermath adapter and the mandate sheet share ONE collapse, not two copies', () => {
    // The defect this guards: two literal `[1,1,2,3,3]` arrays that a retune moves one of.
    expect(DELTA_CLUSTER_BAND_MAP.growth).toBe(GROWTH_DELTA_CLUSTER_COLLAPSE);
  });

  it('MandateTracker draws clusters and no percentage', () => {
    const { container } = render(
      <MandateTracker definition={sphereGrowthDefinition} state={sphereGrowthState} />
    );
    expect(container.textContent).not.toMatch(/%/);
    // Positive arm: the spheres are still named, and the clusters carry their readings.
    expect(container.textContent).toContain('mind');
    const clusters = container.querySelectorAll('[role="img"]');
    expect(clusters.length).toBeGreaterThan(0);
    expect(Array.from(clusters).some((n) => (n.getAttribute('aria-label') ?? '').includes('rose'))).toBe(true);
  });

  it('MandateDetail draws clusters for Needs and Observed, and no percentage (baseElement — portal)', () => {
    const { baseElement } = render(
      <MandateDetail
        open
        onClose={() => {}}
        definition={sphereGrowthDefinition}
        state={sphereGrowthState}
        currentTick={30}
      />
    );
    // Guard the guard: if the portal ever stops rendering, this arm must not pass vacuously.
    expect(baseElement.textContent).toContain('The Rising Mind');
    expect(baseElement.textContent).not.toMatch(/%/);
    // Positive arm: both halves of the comparison the checkpoint asks for are drawn.
    expect(baseElement.textContent).toContain('Needs');
    expect(baseElement.textContent).toContain('Observed');
    const clusters = baseElement.querySelectorAll('[role="img"]');
    expect(clusters.length).toBeGreaterThan(0);
  });
});

// ─── Class B — a probability reads as pips ──────────────────────────

describe('Class B — probabilities read as pips (THR-1451)', () => {
  it('InterventionConfirm draws a detection-risk pip row instead of "N% risk"', () => {
    const { baseElement } = render(
      <InterventionConfirm {...interventionBaseProps} detectionRisk={0.35} />
    );
    expect(baseElement.textContent).toContain('Detection');
    expect(baseElement.textContent).not.toMatch(/%/);
    // Positive arm: the odds row is really there, carrying its reading in words.
    const pips = baseElement.querySelector('[data-testid="detection-risk-pips"]');
    expect(pips).toBeTruthy();
    expect(pips!.getAttribute('aria-label')).toBeTruthy();
  });

  it('a risk of zero says so in a word rather than drawing an empty row', () => {
    const { baseElement } = render(
      <InterventionConfirm {...interventionBaseProps} detectionRisk={0} />
    );
    expect(baseElement.textContent).toContain('none');
    expect(baseElement.textContent).not.toMatch(/%/);
    expect(baseElement.querySelector('[data-testid="detection-risk-pips"]')).toBeNull();
  });
});

// ─── Class C — a proportion drops to the reading already there ──────

describe('Class C — plain proportions drop to their existing reading (THR-1451)', () => {
  it('InfoPanel reads geography in words, not percentages', () => {
    const { container } = render(<InfoPanel tile={tile} />);
    expect(container.textContent).not.toMatch(/%/);
    // Positive arm: each of the three parameters still reads, in the ladder's words.
    expect(container.textContent).toContain('Lowland');   // elevation 0.12
    expect(container.textContent).toContain('Temperate'); // temperature 0.55
    expect(container.textContent).toContain('Drenched');  // moisture 0.91
  });

  it('the geo ladder is ONE table, shared, and bands monotonically', () => {
    // The defect this guards: HexDetailView banded these and kept the table private, so two
    // other surfaces went on drawing `73%` of the same quantity for months.
    expect(geoWord(0.05, ELEVATION_WORDS)).toBe('Lowland');
    expect(geoWord(0.99, ELEVATION_WORDS)).toBe('Alpine');
    expect(geoWord(0.5, TEMPERATURE_WORDS)).toBe('Temperate');
    expect(geoWord(0.1, MOISTURE_WORDS)).toBe('Arid');
    // Out-of-range clamps rather than throwing or falling through to undefined (NFP #4).
    expect(geoWord(5, ELEVATION_WORDS)).toBe('Alpine');
    expect(geoWord(-1, ELEVATION_WORDS)).toBe('Lowland');
  });

  it('hostility reads in words, and the ladder is shared rather than a panel-local closure', () => {
    expect(hostilityLabel(0.1)).toBe('wary');
    expect(hostilityLabel(0.3)).toBe('hostile');
    expect(hostilityLabel(0.6)).toBe('aggressive');
    expect(hostilityLabel(0.9)).toBe('wrathful');
    expect(hostilityLabel(0.9)).not.toMatch(/[0-9%]/);
  });

  it('OmenDetail states which way a bias leans, without a magnitude', () => {
    // `omen.breach.thin_places` carries `encounterBias: { explore: 0.2 }` — a real template,
    // so this arm exercises the branch that used to print `explore +20%`.
    const omenState = {
      primary: {
        templateId: 'omen.breach.thin_places',
        name: 'Thin Places',
        category: 'doom_echo',
        startTick: 4,
        duration: 10,
        slot: 'primary',
        lastBeatTick: 4,
      },
      secondary: null,
      history: [],
    } as unknown as Parameters<typeof OmenDetail>[0]['omenState'];

    const { baseElement } = render(
      <OmenDetail omenState={omenState} currentTick={8} onClose={() => {}} />
    );
    // Guard the guard: the omen really rendered, so the negative arm is not vacuous.
    expect(baseElement.textContent).toContain('Thin Places');
    expect(baseElement.textContent).not.toMatch(/%/);
    // Positive arm: the direction the omen leans survives the drop, as a word.
    expect(baseElement.textContent).toMatch(/favoured|dampened/);
  });
});

// ─── Class D — out of membership, on purpose ────────────────────────

describe('Class D — the carve-outs are deliberate and written down (THR-1451)', () => {
  it('laws.md records the volume slider and the designer readout as out of membership', async () => {
    // The Done-when for Class D is a RULING, not a code change — so the artifact to assert on
    // is the law text. Without this arm "we decided" and "we forgot" look identical next sweep.
    const fs = await import('node:fs/promises');
    const laws = await fs.readFile('Docs/design-system/laws.md', 'utf8');
    expect(laws).toContain('THR-1451');
    expect(laws).toMatch(/volume slider/i);
    expect(laws).toMatch(/aria-valuenow/);
  });
});
