/**
 * The odds pip vocabulary — THR-890 (UI pillar of the locked card format).
 *
 * One odds language for the whole nudge surface: a card's contribution and the
 * step's base forecast both render as pips, so the player never has to hold two
 * scales in their head. Approved 2026-07-30; spec in
 * `Docs/plans/2026-07-30-nudge-card-repertoire.md` § Decision 5 and rendered on
 * the wiki page `public/nudge-cards-reference.html`.
 *
 * **Tiering is pure display (NFP #1/#3).** Stored values stay raw fractions on
 * `StepNudge.forecastDelta` and `ForecastSummary.successProbability`; nothing
 * here is persisted, traced, or fed back into resolution. Re-tuning how the odds
 * *read* is editing the constants in this file, never editing a component.
 *
 * The ladder is twenty ~5% steps grouped into four tiers of five, with **shape
 * changing per tier** so magnitude survives colourblindness — colour is the
 * secondary channel, shape is the accessible one. Shape escalation also matches
 * the attachment-rarity ladder's felt progression.
 */

/** One ~5% step of magnitude. The whole ladder is built off this. */
export const PIP_STEP_PERCENT = 5;

/** Pip slots per tier — five steps, so a full row is the top of its tier. */
export const PIPS_PER_TIER = 5;

/**
 * Below this magnitude there is nothing worth drawing. A card authored at
 * exactly 0 (a pure rider, a pure cost channel) shows no odds row rather than an
 * empty one claiming a change it does not make.
 */
export const PIP_ZERO_EPSILON_PERCENT = 0.5;

export type PipTierId = 'faint' | 'strong' | 'potent' | 'fated' | 'penalty';

export interface PipTier {
  readonly id: PipTierId;
  /** Player-facing tier word, used as the row's accessible label. */
  readonly label: string;
  readonly filledGlyph: string;
  readonly hollowGlyph: string;
  readonly color: string;
  /** Inclusive magnitude band in percentage points, for the wiki page and tests. */
  readonly minPercent: number;
  readonly maxPercent: number;
}

/**
 * The four positive tiers, in ascending magnitude. Index is the tier index the
 * step arithmetic in {@link oddsPips} produces — order is load-bearing.
 *
 * Bounds are the plan's constants table row "Pip tier bounds | 25/50/75/100".
 */
export const PIP_ODDS_TIERS: readonly PipTier[] = [
  {
    id: 'faint',
    label: 'Faint',
    filledGlyph: '●',
    hollowGlyph: '○',
    color: 'rgba(134, 239, 172, 0.9)',
    minPercent: 5,
    maxPercent: 25,
  },
  {
    id: 'strong',
    label: 'Strong',
    filledGlyph: '■',
    hollowGlyph: '□',
    color: 'rgba(125, 190, 245, 0.9)',
    minPercent: 30,
    maxPercent: 50,
  },
  {
    id: 'potent',
    label: 'Potent',
    filledGlyph: '◆',
    hollowGlyph: '◇',
    color: 'rgba(191, 148, 228, 0.9)',
    minPercent: 55,
    maxPercent: 75,
  },
  {
    id: 'fated',
    label: 'Fated',
    filledGlyph: '★',
    hollowGlyph: '☆',
    color: 'rgba(212, 175, 55, 0.95)',
    minPercent: 80,
    maxPercent: 100,
  },
];

/**
 * Penalties — Gambit downsides, detection and doom costs, the echo card's scar.
 *
 * Rendered as filled triangles only, with no hollow remainder: a penalty is not
 * "progress toward" anything, so a five-slot track would read as a goal.
 */
export const PIP_PENALTY_TIER: PipTier = {
  id: 'penalty',
  label: 'Penalty',
  filledGlyph: '▼',
  hollowGlyph: '▽',
  color: 'rgba(248, 113, 113, 0.9)',
  minPercent: 5,
  maxPercent: 25,
};

/** Highest step index on the positive ladder (four tiers × five slots). */
const MAX_ODDS_STEP = PIP_ODDS_TIERS.length * PIPS_PER_TIER;

export interface PipReading {
  readonly tier: PipTier;
  /** Glyphs drawn solid, 1…{@link PIPS_PER_TIER}. */
  readonly filled: number;
  /** Glyph slots drawn in total — equal to `filled` on the penalty tier. */
  readonly total: number;
  readonly polarity: 'gain' | 'penalty';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Read a raw 0–1 magnitude as pips.
 *
 * `value` is the stored fraction — a card's `forecastDelta` (0.08) or a step's
 * success probability (0.42) — **not** a percentage. Negative values read as
 * penalties.
 *
 * Fail-soft (NFP #4): a non-finite value, or one below
 * {@link PIP_ZERO_EPSILON_PERCENT}, yields `undefined` so the caller renders no
 * row rather than a misleading one. Magnitudes past the top of the ladder clamp
 * to a full gold row instead of overflowing into a fifth tier that has no glyph.
 */
export function oddsPips(value: number): PipReading | undefined {
  const percent = value * 100;
  if (!Number.isFinite(percent)) return undefined;
  if (Math.abs(percent) < PIP_ZERO_EPSILON_PERCENT) return undefined;

  if (percent < 0) {
    const filled = clamp(Math.round(-percent / PIP_STEP_PERCENT), 1, PIPS_PER_TIER);
    return { tier: PIP_PENALTY_TIER, filled, total: filled, polarity: 'penalty' };
  }

  // Step 1 is the first ~5% notch; step 20 tops the gold tier. Rounding (rather
  // than flooring) is what makes "to the nearest ~5%" true at the band edges.
  const step = clamp(Math.round(percent / PIP_STEP_PERCENT), 1, MAX_ODDS_STEP);
  const tierIndex = Math.floor((step - 1) / PIPS_PER_TIER);
  return {
    tier: PIP_ODDS_TIERS[tierIndex],
    filled: ((step - 1) % PIPS_PER_TIER) + 1,
    total: PIPS_PER_TIER,
    polarity: 'gain',
  };
}

/**
 * The row's accessible label — the one place the magnitude is stated in words.
 *
 * Screen readers get "Strong, three of five" rather than a run of geometric
 * characters, which is the same information the sighted player reads off shape
 * and fill without ever meeting a numeral on the card face.
 */
export function pipReadingLabel(reading: PipReading): string {
  return reading.polarity === 'penalty'
    ? `${reading.tier.label}, ${reading.filled}`
    : `${reading.tier.label}, ${reading.filled} of ${reading.total}`;
}
