/**
 * Domain Prose — Narrator-voice descriptions for each reach at each tier.
 *
 * Each reach has 5 prose templates (indexed 0–4, matching DOMAIN_WORD_SCALES tiers).
 * Templates use {name}, {they}, {them}, {their}, {They}, {Their} placeholders
 * for agent-specific interpolation at render time.
 *
 * Voice: Third-person narrator/observer — warm, literary, as if the game
 * knows the character personally.
 */

import type { ReachDomain } from '../types/traits';

export const DOMAIN_PROSE: Record<ReachDomain, [string, string, string, string, string]> = {
  iron: [
    '{name} flinches at the sound of drawn steel. {They} are no fighter, and know it.',
    '{name} holds a blade correctly and knows when to raise a shield. Drilled, not tested.',
    '{name} fights with a cold precision that unnerves even seasoned warriors. {Their} blade finds openings others wouldn\'t dare reach for.',
    'Soldiers who\'ve faced {name} don\'t speak of it willingly. {They} move through battle like a scythe through wheat.',
    'Songs are sung of {name}\'s blade-work, though the songs get the details wrong. The truth is worse.',
  ],

  gold: [
    '{name} barely understands the value of what little {they} have. Commerce is a foreign tongue.',
    '{name} has learned the rhythms of barter — when to push, when to hold, when to walk away.',
    '{name} reads a deal the way others read weather — instinctively, and rarely wrong about which way the wind blows.',
    'Merchants speak {name}\'s name in the same breath as their ledgers. {They} don\'t just trade — {they} set the terms everyone else follows.',
    'Wealth flows toward {name} like water toward the sea. {They} have moved beyond gold into the currency of empires — debt, obligation, and necessity.',
  ],

  shadow: [
    '{name} casts a long shadow. {They} are noticed in every room, remembered by every face — concealment is beyond {them}.',
    '{name} has learned to move quietly and choose {their} moments. Not invisible, but careful.',
    '{name} operates beneath the surface, pulling threads others never see. By the time anyone notices, {they} are already somewhere else.',
    '{name} can vanish in a crowded room and leave no memory of {their} passing. Witnesses contradict each other — was {name} even there?',
    '{name} moves like a phantom through the world. Hardly seen, quickly forgotten, with a knack for manipulating plans and people without them noticing.',
  ],

  veil: [
    '{name} is blind to the arcane. Magic passes through {them} like light through glass — unfelt, unseen.',
    '{name} senses something others miss — a tremor in the air, a warmth behind closed doors. The gift is faint, but real.',
    '{name} reads the weave of magic the way a sailor reads the wind. Spells answer {their} call with growing confidence.',
    'Raw arcane energy coils around {name} like a living thing. {They} don\'t just cast — {they} shape reality with practiced hands.',
    '{name} has touched something beyond the veil that most never glimpse. When {they} work magic, the world bends to accommodate.',
  ],

  heart: [
    '{name} is kept at arm\'s length by those around {them}. {Their} presence is tolerated, not sought.',
    '{name} is welcome enough — a familiar face, a nod across the room. Not loved, but not unwanted.',
    'People are drawn to {name} without quite knowing why. {They} have a gift for making others feel at ease.',
    'When {name} speaks, even the quarrelling fall silent. {Their} presence draws loyalty not through command, but through a warmth that makes others feel truly seen.',
    '{name}\'s name is spoken like a prayer by those who know {them}. {They} don\'t lead — {they} simply exist at the center, and the world arranges itself around {them}.',
  ],

  eye: [
    '{name} sees what\'s in front of {them} and little else. The world\'s deeper patterns go unnoticed.',
    '{name} notices things — the pause before a lie, the fresh scratch on an old lock. Not a scholar\'s eye, but a survivor\'s.',
    '{name} connects threads others miss entirely. A footprint here, a rumor there — and suddenly {they} know more than anyone intended.',
    '{name}\'s gaze is unsettling. {They} see through pretense the way fire burns through parchment — swiftly and completely.',
    'Nothing escapes {name}. {They} perceive the world the way an eagle sees a field — every creature, every movement, every hidden thing laid bare.',
  ],

  stone: [
    '{name} is clumsy with materials. What {they} build leans, creaks, and rarely lasts.',
    '{name} can shape wood and stone with growing competence. The work is honest, if unremarkable.',
    '{name} builds with the quiet confidence of a true craftsperson. {Their} walls are plumb, {their} joints are tight, {their} work will outlast {them}.',
    'What {name} builds, others call masterwork. Every stone placed with intention, every arch a study in balance and permanence.',
    '{name} shapes the world itself. Structures rise under {their} hand that seem less built than grown — as if the earth chose to become architecture.',
  ],

  star: [
    '{name} wanders without direction, under a sky that offers nothing. Fate is a word for other people.',
    'A faint thread of purpose has found {name} — not certainty, but the first stirring of something that might be guidance.',
    '{name} walks a path that feels chosen for {them}. Coincidences pile up. Doors open without being pushed.',
    'The arc of {name}\'s life bends toward something vast. {They} speak of the heavens as though the heavens speak back.',
    '{name}\'s destiny burns like a second heartbeat — steady, sure, and visible to anyone with eyes to see. The stars themselves rearrange when {they} pass.',
  ],
};

// ─── Interpolation ──────────────────────────────────────────────

export interface DomainProsePronouns {
  they: string;
  them: string;
  their: string;
  They: string;
  Their: string;
}

const DEFAULT_PRONOUNS: DomainProsePronouns = {
  they: 'they', them: 'them', their: 'their',
  They: 'They', Their: 'Their',
};

/** Derive pronouns from a gender string (matches proseEnrichment.ts convention). */
export function getPronouns(gender?: string): DomainProsePronouns {
  switch ((gender ?? '').toLowerCase()) {
    case 'male':
    case 'm':
      return { they: 'he', them: 'him', their: 'his', They: 'He', Their: 'His' };
    case 'female':
    case 'f':
      return { they: 'she', them: 'her', their: 'her', They: 'She', Their: 'Her' };
    default:
      return DEFAULT_PRONOUNS;
  }
}

/**
 * Get the prose description for a reach at a given tier, interpolated for a specific agent.
 *
 * @param reach - The reach domain
 * @param tier - 0-indexed tier (0–4, matching DOMAIN_WORD_SCALES)
 * @param name - Agent name for {name} substitution
 * @param gender - Optional gender string for pronoun resolution
 */
export function getDomainProse(
  reach: ReachDomain,
  tier: number,
  name: string,
  gender?: string,
): string {
  const clampedTier = Math.max(0, Math.min(4, tier));
  const template = DOMAIN_PROSE[reach][clampedTier];
  const p = getPronouns(gender);

  return template
    .replace(/\{name\}/g, name)
    .replace(/\{They\}/g, p.They)
    .replace(/\{Their\}/g, p.Their)
    .replace(/\{they\}/g, p.they)
    .replace(/\{them\}/g, p.them)
    .replace(/\{their\}/g, p.their);
}
