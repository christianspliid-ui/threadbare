/**
 * Game Theory Content Package — Archetype cooperation strategies and action social orientations.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change strategy weights
 * per archetype and to refine which action templates are cooperative/defective.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. ARCHETYPE_STRATEGY_WEIGHTS — 19 archetypes × 5 cooperation strategies
 * 2. Helper function getStrategyWeights
 * 3. SOCIAL_ORIENTATION_MAP — Action template social biases
 *
 * Source: Docs/plans/2026-03-07-game-theory-design.md
 */

import type { CooperationStrategy } from '../types/disposition';
import type { SocialOrientation } from '../types/disposition';

// ═══════════════════════════════════════════════════════════════════
// 1. ARCHETYPE STRATEGY WEIGHTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Cooperation strategy probability distributions for each narrative archetype.
 *
 * Each archetype has a Record<CooperationStrategy, number> where weights sum to 1.0.
 * These weights bias the agent's initial cooperation strategy selection based on
 * archetype personality, story shape, and prose tone.
 *
 * Strategy meanings:
 * - tit-for-tat: Mirror partner's last move; responsive and fair
 * - grudger: Cooperate until betrayed; then always defect
 * - pavlov: Repeat winning move; reactive but can adapt
 * - always-cooperate: Trust everyone unconditionally
 * - always-defect: Never cooperate; pure self-interest
 */
export const ARCHETYPE_STRATEGY_WEIGHTS: Record<
  string,
  Record<CooperationStrategy, number>
> = {
  // ─── Tragically Flawed ────────────────────────────────────────
  tragic_hero: {
    'tit-for-tat': 0.4,
    grudger: 0.3,
    pavlov: 0.2,
    'always-cooperate': 0.1,
    'always-defect': 0.0,
  },
  // Story: Rise, hubris, fall. Tone: Grand, foreboding, inevitable.
  // Hero tries to cooperate and respond fairly, but pride and past betrayals
  // breed grudging behavior. No pure defection (still noble), some cooperation.

  trickster: {
    'tit-for-tat': 0.2,
    grudger: 0.1,
    pavlov: 0.3,
    'always-cooperate': 0.05,
    'always-defect': 0.35,
  },
  // Story: Schemes, reversals, ironic justice. Tone: Wry, quick, darkly comic.
  // Trickster is self-serving and defective by default. Pavlov fits (repeat wins).
  // Minimal cooperation or grudging. Lowest tit-for-tat (why mirror someone?).

  coming_of_age: {
    'tit-for-tat': 0.35,
    grudger: 0.25,
    pavlov: 0.15,
    'always-cooperate': 0.2,
    'always-defect': 0.05,
  },
  // Story: Innocence, hardening, transformation. Tone: Wonder fading to resolve.
  // Young and learning. Lean toward cooperation and fairness. Becoming more guarded.
  // Learns grudging through hardship, but not yet pure defection.

  brooding_warrior: {
    'tit-for-tat': 0.25,
    grudger: 0.35,
    pavlov: 0.2,
    'always-cooperate': 0.1,
    'always-defect': 0.1,
  },
  // Story: Burden, endurance, reluctant action. Tone: Terse, heavy, physical.
  // Warrior is scarred and grudging. High grudger (burns bridges slowly, holds grudges).
  // Tit-for-tat as a warrior's code (match strength with strength).
  // Some defection from cynicism, but still bound by honor.

  fallen_noble: {
    'tit-for-tat': 0.3,
    grudger: 0.35,
    pavlov: 0.15,
    'always-cooperate': 0.05,
    'always-defect': 0.15,
  },
  // Story: Lost glory, bitter wisdom, possible redemption. Tone: Weary, sharp-edged, proud.
  // Embittered, grudging about past betrayals. Some defection from desperation.
  // Tit-for-tat as a last hope for dignity. Lean toward holding grudges.

  true_believer: {
    'tit-for-tat': 0.15,
    grudger: 0.1,
    pavlov: 0.2,
    'always-cooperate': 0.5,
    'always-defect': 0.05,
  },
  // Story: Faith tested, vindicated or shattered. Tone: Fervent, intense, certain.
  // Believer trusts the divine and world. Heavy always-cooperate (faith in people).
  // Some pavlov (test faith and learn), minimal grudging (forgive in faith).
  // Rare defection (faith can fail).

  schemer: {
    'tit-for-tat': 0.15,
    grudger: 0.1,
    pavlov: 0.35,
    'always-cooperate': 0.0,
    'always-defect': 0.4,
  },
  // Story: Webs of manipulation, delayed payoffs. Tone: Cold, precise, calculating.
  // Schemer is purely self-interested. High defect (no intrinsic cooperation).
  // High pavlov (repeat whatever wins). No always-cooperate. Minimal tit-for-tat
  // (why give opponent leverage?).

  wanderer: {
    'tit-for-tat': 0.4,
    grudger: 0.15,
    pavlov: 0.2,
    'always-cooperate': 0.15,
    'always-defect': 0.1,
  },
  // Story: Rootless, observing, stumbling into consequence. Tone: Detached, laconic, urgent.
  // Wanderer is flexible and detached. Tit-for-tat as a fair stranger's code.
  // Not grudging (moves on from conflict), some cooperation (fellow travelers).
  // Some defection from independence and self-reliance.

  monster: {
    'tit-for-tat': 0.05,
    grudger: 0.05,
    pavlov: 0.25,
    'always-cooperate': 0.0,
    'always-defect': 0.65,
  },
  // Story: Inhuman acts, possibly with buried humanity. Tone: Brutal, unflinching.
  // Monster is inherently defective. High always-defect (inhuman). Pavlov works
  // (repeat what works, even if brutal). Almost no cooperation or fairness.

  folk_hero: {
    'tit-for-tat': 0.3,
    grudger: 0.15,
    pavlov: 0.15,
    'always-cooperate': 0.35,
    'always-defect': 0.05,
  },
  // Story: Unlikely champion, beloved by common people. Tone: Warm, earthy, darkly funny.
  // Folk hero believes in people and common good. High always-cooperate.
  // Lean toward tit-for-tat (reciprocal help). Minimal grudging (forgive easily).
  // Occasional defection when protecting others.

  reluctant_king: {
    'tit-for-tat': 0.45,
    grudger: 0.2,
    pavlov: 0.15,
    'always-cooperate': 0.15,
    'always-defect': 0.05,
  },
  // Story: Refuses power, forced to accept, transformed by burden. Tone: Quiet dignity, melancholy.
  // King is dutiful and responsive. High tit-for-tat (rule by fairness and response).
  // Some cooperation (serve the realm), minimal defection (honor binds).
  // Grudging when duty is betrayed.

  oathkeeper: {
    'tit-for-tat': 0.2,
    grudger: 0.45,
    pavlov: 0.15,
    'always-cooperate': 0.15,
    'always-defect': 0.05,
  },
  // Story: Bound by a vow that costs everything. Tone: Stubborn, grinding.
  // Oathkeeper is defined by the oath. High grudger (vow is the grudge against betrayal).
  // Some cooperation (vow demands fairness), but mostly bound to the vow.
  // Minimal defection (oath prevents it).

  poisoned_court: {
    'tit-for-tat': 0.15,
    grudger: 0.3,
    pavlov: 0.3,
    'always-cooperate': 0.0,
    'always-defect': 0.25,
  },
  // Story: Power corrupts, alliances shift, trust is a weapon. Tone: Silken, venomous.
  // Courtier is calculating and defective. High pavlov (repeat what wins in court).
  // High grudger (court politics breed enemies). No cooperation (everyone is threat).
  // Some defection (betray or be betrayed).

  doomed_innocent: {
    'tit-for-tat': 0.2,
    grudger: 0.1,
    pavlov: 0.15,
    'always-cooperate': 0.5,
    'always-defect': 0.05,
  },
  // Story: Good person in a world that will break them. Tone: Tender, darkening.
  // Innocent trusts and cooperates unconditionally. High always-cooperate.
  // Some tit-for-tat (learn fairness), minimal grudging (too kind to hold grudges).
  // World breaks them, not their strategy choosing defection.

  old_power: {
    'tit-for-tat': 0.25,
    grudger: 0.25,
    pavlov: 0.35,
    'always-cooperate': 0.1,
    'always-defect': 0.05,
  },
  // Story: Ancient, vast, fading or awakening. Tone: Slow, heavy, elemental.
  // Old power is vast and cautious. High pavlov (vast experience, repeat what works).
  // Balanced grudging and fairness (ancient alliances and enemies).
  // Minimal cooperation (above such concerns) or defection (too dignified).

  kingmaker: {
    'tit-for-tat': 0.25,
    grudger: 0.2,
    pavlov: 0.35,
    'always-cooperate': 0.1,
    'always-defect': 0.1,
  },
  // Story: Never rules, always decides who does. Tone: Shrewd, understated.
  // Kingmaker is calculating and responsive. High pavlov (repeat political wins).
  // Tit-for-tat and grudging in balance (alliances and betrayals).
  // Some defection when needed for power plays.

  seeker: {
    'tit-for-tat': 0.2,
    grudger: 0.15,
    pavlov: 0.3,
    'always-cooperate': 0.2,
    'always-defect': 0.15,
  },
  // Story: Pursues forbidden knowledge, pays the price. Tone: Obsessive, precise, unhinged.
  // Seeker is self-driven and pragmatic. High pavlov (repeat what yields knowledge).
  // Some cooperation and defection as means to an end. Obsession overrides fairness.

  maker: {
    'tit-for-tat': 0.3,
    grudger: 0.15,
    pavlov: 0.25,
    'always-cooperate': 0.25,
    'always-defect': 0.05,
  },
  // Story: Creates something that outlasts them. Tone: Patient, hands-on, proud.
  // Maker is collaborative and fair in craft. Tit-for-tat and cooperation balance.
  // Pavlov for learning craft. Minimal defection (craft demands honor).
  // Grudging only when craft is disrespected.

  noble_savage: {
    'tit-for-tat': 0.15,
    grudger: 0.2,
    pavlov: 0.3,
    'always-cooperate': 0.15,
    'always-defect': 0.2,
  },
  // Story: Primal strength meets civilization. Tone: Raw, physical, elemental.
  // Savage is direct and reactive. High pavlov (instinct, repeat what works).
  // Moderate grudging and defection (no patience for complexity).
  // Some cooperation and tit-for-tat (primal honor codes).
};

// ═══════════════════════════════════════════════════════════════════
// 2. HELPER FUNCTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Retrieve cooperation strategy weights for an archetype.
 *
 * @param archetypeId - ID of the archetype (e.g. 'tragic_hero')
 * @returns Record<CooperationStrategy, number> with weights summing to 1.0
 *
 * If the archetype is unknown, returns a uniform distribution (0.2 each strategy).
 */
export function getStrategyWeights(
  archetypeId: string
): Record<CooperationStrategy, number> {
  // Return known weights if archetype exists
  if (archetypeId && ARCHETYPE_STRATEGY_WEIGHTS[archetypeId]) {
    return ARCHETYPE_STRATEGY_WEIGHTS[archetypeId];
  }

  // Fallback: uniform distribution over all 5 strategies
  return {
    'tit-for-tat': 0.2,
    grudger: 0.2,
    pavlov: 0.2,
    'always-cooperate': 0.2,
    'always-defect': 0.2,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 3. SOCIAL ORIENTATION MAP
// ═══════════════════════════════════════════════════════════════════

/**
 * Maps action template IDs to their social orientation (cooperative/defective/neutral).
 *
 * Used when an agent selects a candidate action and must decide whether to
 * cooperate or defect. Actions marked 'cooperative' bias toward cooperation,
 * 'defective' toward defection, and 'neutral' are unbiased.
 *
 * Starter set of common action templates. Expand as more action types are defined.
 */
export const SOCIAL_ORIENTATION_MAP: Record<string, SocialOrientation> = {
  // ─── Cooperative Actions ────────────────────────────────────────
  // Trade, alliance, gift, share, heal, teach
  trade_goods: 'cooperative',
  trade_resource: 'cooperative',
  trade_labor: 'cooperative',
  alliance_form: 'cooperative',
  alliance_reinforce: 'cooperative',
  gift_give: 'cooperative',
  gift_honor: 'cooperative',
  share_knowledge: 'cooperative',
  share_food: 'cooperative',
  share_shelter: 'cooperative',
  heal_wound: 'cooperative',
  heal_curse: 'cooperative',
  teach_craft: 'cooperative',
  teach_secret: 'cooperative',
  counsel_wise: 'cooperative',
  counsel_mercy: 'cooperative',
  parley_peaceful: 'cooperative',
  parley_negotiation: 'cooperative',

  // ─── Defective Actions ──────────────────────────────────────────
  // Betray, steal, attack, sabotage, poison, deceive
  betray_ally: 'defective',
  betray_trust: 'defective',
  betray_secret: 'defective',
  steal_resource: 'defective',
  steal_artifact: 'defective',
  steal_identity: 'defective',
  attack_direct: 'defective',
  attack_ambush: 'defective',
  attack_mass: 'defective',
  sabotage_plan: 'defective',
  sabotage_craft: 'defective',
  sabotage_alliance: 'defective',
  poison_body: 'defective',
  poison_mind: 'defective',
  deceive_outright: 'defective',
  deceive_mask: 'defective',
  usurp_position: 'defective',
  usurp_authority: 'defective',
  curse_enemy: 'defective',

  // ─── Neutral Actions ───────────────────────────────────────────
  // Travel, build, meditate, explore, research, rest
  travel_distant: 'neutral',
  travel_local: 'neutral',
  travel_pilgrimage: 'neutral',
  build_structure: 'neutral',
  build_craft: 'neutral',
  build_alliance: 'neutral',
  meditate_ritual: 'neutral',
  meditate_prayer: 'neutral',
  explore_wilderness: 'neutral',
  explore_ruin: 'neutral',
  explore_mystery: 'neutral',
  research_craft: 'neutral',
  research_lore: 'neutral',
  research_magic: 'neutral',
  rest_recovery: 'neutral',
  rest_reflection: 'neutral',
  guard_post: 'neutral',
  guard_person: 'neutral',
  wait_observe: 'neutral',
};
