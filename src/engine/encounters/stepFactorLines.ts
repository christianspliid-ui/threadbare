/**
 * Derived test-panel factor lines — THR-892.
 *
 * ## The variance rule
 *
 * A factor line earns its place on the test panel **only if it could have read
 * differently on another run**. That is the whole rule, and it is what separates
 * a factor from a scene fact.
 *
 * A static authored line ("The vault door is iron-bound") reads the same every
 * time the encounter fires. It cannot inform a decision, because there was never
 * a run where it said otherwise — so it is priced into the step's authored
 * `difficulty` and lives in the prose, where scene facts belong.
 *
 * What varies run to run is the *broader game context*: who is acting and how
 * skilled they are, what they carry, what is wrong with them, where they stand,
 * who holds that ground, and how the previous step of this same encounter went.
 * Those are the lines this module derives.
 *
 * ## One read path, never a parallel computation
 *
 * Every line here is a projection of a number **resolution itself already
 * computed** — `computeCapability` for the skill line, and
 * `ModifierBreakdown.contributions` for the rest, which the same
 * `computeResolutionModifiers` call that feeds `ResolutionInput.actionModifiers`
 * produces. Nothing in this file walks the graph or scores anything. A panel that
 * re-derived its own numbers would eventually disagree with the roll, and the
 * player would read a factor that did not apply.
 *
 * ## Fail-soft (NFP #4)
 *
 * A line whose source cannot be read is omitted, never thrown. A step with no
 * variance at all renders the skill line and the difficulty word alone — which is
 * an honest report ("nothing here tilts this but you"), not a degraded one.
 *
 * Ticket: THR-892. Rule origin: THR-883 mockup review, approved 2026-07-30.
 */

import type { NamedModifierContribution } from '../resolutionModifiers';
import type { ReachDomain } from '../../types/traits';
import type { StepOutcome } from '../../types/unifiedAction';
import { DOMAIN_WORD_SCALES, getDomainTier } from '../../data/domain-words';
import {
  DERIVED_FACTOR_ACTOR_FALLBACK,
  DERIVED_FACTOR_SENTENCES,
  DERIVED_SKILL_SENTENCE,
} from '../../data/nudge-stage-content';

/** Domain capability is 0–1; the reach word scales are indexed off 0–10. */
const CAPABILITY_TO_DOMAIN_SCALE = 10;

/**
 * Below this magnitude a contribution is not worth a line. Matches
 * `PIP_ZERO_EPSILON_PERCENT` (0.5%) expressed as a raw fraction, so a
 * contribution too small to draw a single pip never draws a sentence either.
 */
export const FACTOR_LINE_EPSILON = 0.005;

export type DerivedFactorKind =
  | 'skill'
  | 'equipment'
  | 'trait'
  | 'terrain'
  | 'faction'
  | 'sphere'
  | 'effect'
  | 'divine'
  | 'rule'
  | 'carryover';

export interface DerivedFactorLine {
  /** Stable within one panel build — `<kind>:<sourceId>`. */
  readonly id: string;
  readonly kind: DerivedFactorKind;
  readonly text: string;
  readonly polarity: 'for' | 'against';
  /** Named modifier source, matching the resolution channel where one exists. */
  readonly source: string;
  /** Raw 0–1 magnitude, for the pip row. Signed: negative reads as a penalty. */
  readonly delta: number;
}

export interface DeriveFactorLinesArgs {
  /** Display name of the acting mortal. Blank/absent falls back, never throws. */
  readonly actorName: string | undefined;
  readonly reach: ReachDomain;
  /** `computeCapability` output (0–1) — the same read resolution used. */
  readonly capability: number;
  /** `ModifierBreakdown.contributions` from the same call that fed the forecast. */
  readonly contributions: readonly NamedModifierContribution[];
  /** The carryover line this step drew, if the prior step's band authored one. */
  readonly carryover?: {
    readonly outcome: StepOutcome;
    readonly line: { readonly text: string; readonly polarity: 'for' | 'against'; readonly forecastDelta?: number };
  };
}

function substitute(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);
}

/**
 * The agent's capability in the step's reach, as the panel's first line.
 *
 * Always emitted, and always `for`: capability is what the actor brings, and a
 * low capability is reported by the *word* ("meek") rather than by flipping the
 * line's polarity. Flipping it would double-count — the difficulty word beside it
 * already carries the "this is hard" signal.
 */
export function deriveSkillLine(args: {
  actorName: string | undefined;
  reach: ReachDomain;
  capability: number;
}): DerivedFactorLine {
  const { actorName, reach, capability } = args;
  const safeCapability = Number.isFinite(capability) ? capability : 0;
  const tier = getDomainTier(safeCapability * CAPABILITY_TO_DOMAIN_SCALE);
  const scale = DOMAIN_WORD_SCALES[reach];
  const word = scale?.[tier] ?? scale?.[0] ?? '';

  return {
    id: `skill:${reach}`,
    kind: 'skill',
    text: substitute(DERIVED_SKILL_SENTENCE, {
      actor: actorName || DERIVED_FACTOR_ACTOR_FALLBACK,
      word: word.toLowerCase(),
      reach,
    }),
    polarity: 'for',
    source: `skill:${reach}`,
    delta: safeCapability,
  };
}

/**
 * One line per named modifier contribution, in the order resolution summed them.
 *
 * Contributions below {@link FACTOR_LINE_EPSILON} are dropped: a modifier too
 * small to move a pip is a line that claims an effect the player cannot observe.
 * A contribution whose `kind` has no authored sentence is dropped rather than
 * rendered with a placeholder — a new modifier source must author its prose
 * before it can speak (NFP #4, and the reason the sentence table is exhaustive).
 */
export function deriveContributionLines(
  contributions: readonly NamedModifierContribution[],
  actorName: string | undefined,
): DerivedFactorLine[] {
  const lines: DerivedFactorLine[] = [];
  const seen = new Set<string>();

  for (const contribution of contributions) {
    const { kind, sourceId, sourceName, value } = contribution;
    if (!Number.isFinite(value) || Math.abs(value) < FACTOR_LINE_EPSILON) continue;

    const sentences = DERIVED_FACTOR_SENTENCES[kind];
    if (!sentences) continue;

    const polarity = value >= 0 ? 'for' : 'against';
    // Two artifacts with the same id would otherwise collide as React keys.
    let id = `${kind}:${sourceId}`;
    if (seen.has(id)) id = `${id}:${lines.length}`;
    seen.add(id);

    lines.push({
      id,
      kind: kind as DerivedFactorKind,
      text: substitute(sentences[polarity], {
        actor: actorName || DERIVED_FACTOR_ACTOR_FALLBACK,
        source: sourceName,
      }),
      polarity,
      source: `${kind}:${sourceId}`,
      delta: value,
    });
  }

  return lines;
}

/**
 * Every derived line for one step, in panel order: what the actor brings first,
 * then what the world adds, then what the previous step left behind.
 *
 * The carryover line is authored prose (it is the one authored factor surface
 * that survives the variance rule), so it is passed through verbatim — the
 * sentence table does not touch it.
 */
export function deriveStepFactorLines(args: DeriveFactorLinesArgs): DerivedFactorLine[] {
  const { actorName, reach, capability, contributions, carryover } = args;

  const lines: DerivedFactorLine[] = [
    deriveSkillLine({ actorName, reach, capability }),
    ...deriveContributionLines(contributions, actorName),
  ];

  if (carryover) {
    lines.push({
      id: `carryover:${carryover.outcome}`,
      kind: 'carryover',
      text: carryover.line.text,
      polarity: carryover.line.polarity,
      source: `carryover:${carryover.outcome}`,
      delta: carryover.line.forecastDelta ?? 0,
    });
  }

  return lines;
}
