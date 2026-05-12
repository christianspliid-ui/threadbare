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
 * - Numbers (per-tick cost, runway ticks) appear in the sustain-bar hover tooltip rendered
 *   by `SustainedControlRow`, not in the prose tables.
 */

import type { LapseRisk, SustainedControlCategory } from '../engine/retinue';

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
