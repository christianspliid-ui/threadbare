/**
 * Sustained-control status prose — THR-418.
 *
 * Three lookup tables surfaced by `ThreadsPanel` for sustained controls:
 *
 *   1. `SUSTAINED_STATUS_LABELS` — short Threadbare-voice status per template × lapse-risk tier.
 *      Looked up as `SUSTAINED_STATUS_LABELS[templateId][risk]`, falling back to `__default__`
 *      when the template has no hand-written entry.
 *
 *   2. `CHAMPION_BADGE_LABELS` — chip label per champion template id. Renders next to the
 *      agent name when `ThreadedAgent.championEffectId !== null`.
 *
 *   3. `LAPSE_WARNING_TOOLTIPS` — long tooltip shown on hover when a row's `lapseRisk` is
 *      `'critical'`. Three category-level entries (hex / source / location).
 *
 * Voice rules:
 * - Present tense, second-person where natural.
 * - Image-first, no numbers in the player-facing string.
 * - 2–6 words for the row label; one sentence for the tooltip.
 * - No numbers anywhere player-facing, including the sustain-bar hover (THR-1008, UI Law 13).
 *   Per-tick flow and runway band into words through `sustainFlowWord` / `sustainRunwayWord`
 *   below; the raw magnitudes stay in traces and the designer view. This reverses the
 *   THR-418 note that sent the numbers to the tooltip instead of the prose tables — the
 *   tooltip is player-facing too, so it was never a place numbers could hide.
 */

import type { LapseRisk, SustainedControlCategory } from '../engine/retinue';
import { magnitudeWord, type MagnitudeBand } from '../engine/aftermathWords';

/**
 * Short status label per template × lapse-risk tier. Looked up at render time.
 *
 * Template IDs are the canonical `UnifiedActionTemplate.id` strings used by the
 * action catalog. Templates missing from this table fall back to `__default__`.
 */
export const SUSTAINED_STATUS_LABELS: Record<string, Record<LapseRisk, string>> = {
  'hex.claim_dominion': {
    safe: 'Your sphere holds.',
    tightening: 'The hold thins.',
    critical: 'The claim is bleeding out.',
  },
  'hex.claim_resource': {
    safe: 'A sustained flow of essence.',
    tightening: 'The siphon strains.',
    critical: 'The flow nearly breaks.',
  },
  'hex.cultivate': {
    safe: 'The land flourishes under your gaze.',
    tightening: 'The growth wavers.',
    critical: 'Your blessing fades.',
  },
  'hex.shepherd_flock': {
    safe: 'The flock drifts toward worship.',
    tightening: 'The pull weakens.',
    critical: 'The flock is slipping.',
  },
  'hex.anchor_sphere': {
    safe: 'The sphere is fixed here.',
    tightening: 'The anchor loosens.',
    critical: 'The sphere is slipping its mooring.',
  },
  'hex.bind_echoes': {
    safe: 'Old voices speak only to you.',
    tightening: 'The echoes wander.',
    critical: 'The echoes are breaking loose.',
  },
  'hex.ward_against_deep': {
    safe: 'The ward stands against the deep.',
    tightening: 'The ward thins.',
    critical: 'Something is reaching through.',
  },
  'sub.sanctify': {
    safe: 'Sanctified ground holds.',
    tightening: 'The sanctity thins.',
    critical: 'The ground stirs against you.',
  },
  'sub.sanctify_tavern': {
    safe: 'A blessed hearth at the heart of the noise.',
    tightening: 'The blessing wavers under the smoke.',
    critical: 'The hearth is going cold.',
  },
  'loc.ward': {
    safe: 'A ward holds the gates.',
    tightening: 'The ward bends.',
    critical: 'The ward is failing.',
  },
  'loc.sanctify_square': {
    safe: 'The square stands as your sign.',
    tightening: 'The sign blurs.',
    critical: 'The square forgets you.',
  },
  'loc.place_of_power': {
    safe: 'A node of your influence.',
    tightening: 'The node dims.',
    critical: 'The node is failing.',
  },
  /**
   * Fallback for templates without hand-written prose. Kept terse so it does
   * not pretend to be specific.
   */
  '__default__': {
    safe: 'Held.',
    tightening: 'Holding.',
    critical: 'Slipping.',
  },
};

/**
 * Chip label per champion template. Rendered next to agent names when their
 * `championEffectId` resolves to one of these templates.
 */
export const CHAMPION_BADGE_LABELS: Record<string, string> = {
  'action.anoint-champion': 'Anointed',
  'hex.install_champion': 'Installed Champion',
};

/**
 * Long tooltip shown when a row's `lapseRisk` is `'critical'`. One per category.
 */
export const LAPSE_WARNING_TOOLTIPS: Record<SustainedControlCategory, string> = {
  hex: 'The reservoir is nearly empty. Your hold on this territory will break within a few ticks unless essence returns.',
  source: 'The sanctity is bleeding through. Without renewal, this node will fall back to neutral ground.',
  location: 'Your covenant with this place is thinning. The bond will lapse soon if it is not fed.',
};

/**
 * Resolve a status label for a sustained control row, falling back to the
 * `__default__` entry when the template has no hand-written prose.
 */
export function getSustainedStatusLabel(templateId: string, risk: LapseRisk): string {
  const entry = SUSTAINED_STATUS_LABELS[templateId] ?? SUSTAINED_STATUS_LABELS['__default__'];
  return entry[risk];
}

/**
 * Resolve a champion badge label. Returns `'Champion'` as a generic fallback
 * for any template not in the table (matches the engine allowlist behavior).
 */
export function getChampionBadgeLabel(templateId: string): string {
  return CHAMPION_BADGE_LABELS[templateId] ?? 'Champion';
}

// ─── Sustain magnitudes as words (THR-1008, UI Law 13) ──────────────
//
// The sustained-control row used to print `⤓ 12/tick`, `⤒ 5/tick` and a hover
// reading `−12 per tick · +5 per tick (net −7) / Active 40 ticks / Runway: ~6
// ticks at current reserves`. All of it is raw magnitude on a player-facing
// surface. The ladders below carry the same reading in words; the numbers stay
// in traces and the designer view.

/**
 * Per-tick essence flow. Sustained controls cost single digits per tick in
 * practice — `hex.claim_dominion` sits near 2 — so the ladder is tuned tight,
 * with the top rung reserved for a hold that is genuinely expensive.
 */
export const SUSTAIN_FLOW_BANDS: readonly MagnitudeBand[] = [
  { min: 12, word: 'ruinous' },
  { min: 6,  word: 'heavy' },
  { min: 3,  word: 'steady' },
  { min: 1,  word: 'slight' },
  { min: 0,  word: 'negligible' },
];

/**
 * Runway in ticks, banded against the engine's own risk thresholds so the words
 * and the bar colour can never disagree: below `SUSTAIN_LAPSE_RISK_CRITICAL_TICKS`
 * (3) reads as failing, below `SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS` (8) as
 * thinning, and a full game day (12 ticks) or more as comfortable.
 */
export const SUSTAIN_RUNWAY_BANDS: readonly MagnitudeBand[] = [
  { min: 36, word: 'many days' },
  { min: 12, word: 'days' },
  { min: 8,  word: 'most of a day' },
  { min: 3,  word: 'a few ticks' },
  { min: 0,  word: 'moments' },
];

/** Band a per-tick cost or income into a word. */
export function sustainFlowWord(perTick: number): string {
  return magnitudeWord(perTick, SUSTAIN_FLOW_BANDS);
}

/**
 * Band a runway into a word. An infinite runway (net-positive flow) is not a
 * magnitude at all, so it answers with its own term rather than a top rung.
 */
export function sustainRunwayWord(runwayTicks: number): string {
  if (!Number.isFinite(runwayTicks)) return 'indefinite';
  return magnitudeWord(Math.max(0, runwayTicks), SUSTAIN_RUNWAY_BANDS);
}

/**
 * The sustain hover, in sentences. Reads cost against return, then how long the
 * reserves carry it. Never a numeral, and never a key:value strip (Law 16).
 */
export function sustainSummarySentences(node: {
  perTickCostTotal: number;
  perTickIncomeTotal: number;
  netFlow: number;
  runwayTicks: number;
}): string {
  const cost = node.perTickCostTotal === 0
    ? 'This hold asks nothing of you each turn.'
    : `It draws a ${sustainFlowWord(node.perTickCostTotal)} tithe of essence each turn.`;

  const income = node.perTickIncomeTotal > 0
    ? ` It returns a ${sustainFlowWord(node.perTickIncomeTotal)} flow in kind.`
    : '';

  const net = node.netFlow > 0
    ? ' On balance it feeds you.'
    : node.netFlow === 0
      ? ' On balance it pays for itself.'
      : ' On balance it runs you down.';

  const runway = !Number.isFinite(node.runwayTicks)
    ? ' Your reserves carry it indefinitely.'
    : ` Your reserves carry it for ${sustainRunwayWord(node.runwayTicks)}.`;

  return `${cost}${income}${net}${runway}`;
}
