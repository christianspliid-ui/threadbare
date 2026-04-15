/**
 * Counter-Argument Content — personality-driven pushback tables.
 *
 * Each axiological axis has two poles. When a social scene reaches the
 * Counter step, the target's dominant personality axis determines which
 * counter-argument they use. The counter modifies the NEXT step's difficulty:
 *
 * - If actor's reach is in `vulnerableTo` → difficulty reduced (COUNTER_VULNERABLE_BONUS)
 * - If actor's reach is in `resistantTo`  → difficulty increased (COUNTER_RESISTANT_PENALTY)
 * - Otherwise                              → no modification
 *
 * Rock-paper-scissors logic:
 *   courage is brave but reckless  → Shadow undermines confidence, Iron can't intimidate the brave
 *   prudence is careful but risk-averse → Gold sweetens the deal, Heart emotion doesn't sway caution
 *   loyalty is principled but rigid → Shadow reveals ally betrayal, Heart solidarity doesn't move them
 *   ambition is driven but self-interested → Gold matches their price, Star ideals bore the ambitious
 *   honesty demands proof           → Eye shows truth, Shadow lies enrage the honest
 *   cunning sees through pitches    → Heart genuine emotion surprises, Shadow can't trick the trickster
 *   mercy worries about harm        → Heart assures no harm, Iron threats repel
 *   ruthlessness sees weakness      → Iron matches strength, Heart sentiment is irrelevant
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to change counter-argument narratives,
 * vulnerability mappings, and resistance mappings.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { ReachDomain } from '../types/traits';
import type { ValuePair } from '../types/agent';

// ─── Tunable Constants ─────────────────────────────────────────────────────

/** Difficulty reduction (on 0–100 scale) when actor's approach matches target's vulnerability. */
export const COUNTER_VULNERABLE_BONUS = -10;

/** Difficulty increase (on 0–100 scale) when actor's approach matches target's resistance. */
export const COUNTER_RESISTANT_PENALTY = 15;

/**
 * If leverage exceeds this threshold, the counter-argument step is suppressed —
 * the target is too outmatched to mount effective opposition.
 */
export const COUNTER_ARGUMENT_LEVERAGE_THRESHOLD = 0.70;

// ─── Content Types ─────────────────────────────────────────────────────────

export interface CounterNarrative {
  /** Prose template for this counter-argument. Placeholders: {target}, {actor}. */
  narrative: string;
  /** Reach domains that work against this counter (difficulty reduction). */
  vulnerableTo: ReachDomain[];
  /** Reach domains that bounce off this counter (difficulty increase). */
  resistantTo: ReachDomain[];
}

export interface CounterArgumentPole {
  /** Counter used when target leans toward the positive pole (+1 end). */
  positive: CounterNarrative;
  /** Counter used when target leans toward the negative pole (-1 end). */
  negative: CounterNarrative;
}

/** Counter-argument tables keyed by axiological axis. */
export type CounterArgumentLibrary = Partial<Record<ValuePair, CounterArgumentPole>>;

// ─── Counter-Argument Library ──────────────────────────────────────────────

export const COUNTER_ARGUMENT_LIBRARY: CounterArgumentLibrary = {

  // ─── courage_prudence ─────────────────────────────────────────────────────
  courage_prudence: {
    positive: {
      // Positive pole = courage. Brave but reckless — can be undermined by Shadow.
      narrative: "{target} meets your words with a steady gaze. 'I've faced worse odds than this. " +
        "What makes you think I'd flinch now?' Their confidence doesn't waver.",
      vulnerableTo: ['shadow'],   // Shadow: undermine confidence with doubt/revelation
      resistantTo: ['iron'],      // Iron: can't intimidate the brave
    },
    negative: {
      // Negative pole = prudence. Careful but risk-averse — Gold reassurance works.
      narrative: "{target} frowns, turning the proposal over with slow deliberation. " +
        "'I need guarantees. The risks aren't worth it without better terms.'",
      vulnerableTo: ['gold'],     // Gold: sweeten the deal, reduce perceived risk
      resistantTo: ['heart'],     // Heart: emotional appeals don't sway the cautious
    },
  },

  // ─── loyalty_ambition ─────────────────────────────────────────────────────
  loyalty_ambition: {
    positive: {
      // Positive pole = loyalty. Principled but rigid — Shadow can reveal betrayal.
      narrative: "{target}'s jaw tightens. 'My word is my bond. I made a promise — " +
        "and that promise holds whether it costs me or not.'",
      vulnerableTo: ['shadow'],   // Shadow: reveal that allies have already betrayed them
      resistantTo: ['heart'],     // Heart: loyalty trumps new friendships
    },
    negative: {
      // Negative pole = ambition. Self-interested — Gold matches their price.
      narrative: "A calculating light enters {target}'s eyes. 'What's in it for me, exactly? " +
        "I need to see the numbers before I agree to anything.'",
      vulnerableTo: ['gold'],     // Gold: match their price, make it worth their while
      resistantTo: ['star'],      // Star: abstract ideals bore the ambitious
    },
  },

  // ─── honesty_cunning ──────────────────────────────────────────────────────
  honesty_cunning: {
    positive: {
      // Positive pole = honesty. Demands proof — Eye reveals truth.
      narrative: "{target} crosses their arms, eyes skeptical. 'Prove it. I don't take " +
        "claims on faith — bring me evidence or don't waste my time.'",
      vulnerableTo: ['eye'],      // Eye: show them the truth directly
      resistantTo: ['shadow'],    // Shadow: lies enrage the honest
    },
    negative: {
      // Negative pole = cunning. Sees through pitches — Heart's sincerity surprises.
      narrative: "{target}'s smile is thin and knowing. 'Nice approach. Practiced, even. " +
        "But I know a pitch when I hear one — what are you really after?'",
      vulnerableTo: ['heart'],    // Heart: genuine emotion surprises the cynic
      resistantTo: ['shadow'],    // Shadow: can't manipulate the manipulator
    },
  },

  // ─── mercy_ruthlessness ───────────────────────────────────────────────────
  mercy_ruthlessness: {
    positive: {
      // Positive pole = mercy. Worried about harm — Heart assures no harm.
      narrative: "{target}'s expression clouds with concern. 'And what of the people caught " +
        "between us? Someone always pays the price for deals like this.'",
      vulnerableTo: ['heart'],    // Heart: assure no harm comes to the innocent
      resistantTo: ['iron'],      // Iron: threats repel the merciful
    },
    negative: {
      // Negative pole = ruthlessness. Sees compassion as weakness — Iron matches strength.
      narrative: "{target}'s voice drops to something quiet and cold. 'Sentiment is a luxury " +
        "for those who can afford to lose. I can't. Come back with strength, not sympathy.'",
      vulnerableTo: ['iron'],     // Iron: match strength with strength
      resistantTo: ['heart'],     // Heart: sentiment is irrelevant to the ruthless
    },
  },

  // ─── asceticism_extravagance ──────────────────────────────────────────────
  asceticism_extravagance: {
    positive: {
      // Positive pole = asceticism. Disdains material incentives — Star/ideals work.
      narrative: "{target} waves off the offered incentives. 'Keep your coin. I'm not in " +
        "this for wealth — what matters is whether the cause is just.'",
      vulnerableTo: ['star'],     // Star: appeal to higher purpose and sacrifice
      resistantTo: ['gold'],      // Gold: material offers are beneath them
    },
    negative: {
      // Negative pole = extravagance. Responds to comfort and luxury — Gold seals it.
      narrative: "{target} tilts their head, considering. 'The arrangement has merit, " +
        "but the terms could be sweeter. I do have a certain standard to maintain.'",
      vulnerableTo: ['gold'],     // Gold: appeal to their appetite for comfort
      resistantTo: ['star'],      // Star: selfless ideals fall flat
    },
  },

  // ─── revelation_discretion ────────────────────────────────────────────────
  revelation_discretion: {
    positive: {
      // Positive pole = revelation. Wants everything in the open — Eye-based openness works.
      narrative: "{target} leans forward. 'Before we go any further — I want everything " +
        "on the table. No half-truths, no omissions. The whole picture.'",
      vulnerableTo: ['eye'],      // Eye: full transparency wins their trust
      resistantTo: ['shadow'],    // Shadow: concealment poisons the well
    },
    negative: {
      // Negative pole = discretion. Guards information carefully — Shadow respects secrecy.
      narrative: "{target}'s expression closes like a shutter. 'There are things I'm not " +
        "at liberty to discuss. And I have serious concerns about how widely this might spread.'",
      vulnerableTo: ['shadow'],   // Shadow: operate in secrecy, meet their caution
      resistantTo: ['eye'],       // Eye: exposing everything threatens their guarded nature
    },
  },

  // ─── preservation_transformation ──────────────────────────────────────────
  preservation_transformation: {
    positive: {
      // Positive pole = preservation. Values stability — Stone-grounded arguments work.
      narrative: "{target} shakes their head slowly. 'What you're proposing would upend " +
        "everything that holds this place together. Change isn't always progress.'",
      vulnerableTo: ['stone'],    // Stone: ground it in stability and continuity
      resistantTo: ['veil'],      // Veil: tradition arguments feel circular to them
    },
    negative: {
      // Negative pole = transformation. Impatient with the old — novelty and vision win.
      narrative: "{target} paces, frustrated. 'The old ways aren't working. Whatever you're " +
        "offering had better be something new — I'm done patching a broken system.'",
      vulnerableTo: ['veil'],     // Veil: invoke change, progress, and new paradigms
      resistantTo: ['stone'],     // Stone: tradition arguments feel suffocating
    },
  },

  // ─── sacrifice_survival ───────────────────────────────────────────────────
  sacrifice_survival: {
    positive: {
      // Positive pole = sacrifice. Accepts cost for greater good — Star appeals resonate.
      narrative: "{target} looks at you with quiet certainty. 'I know what this costs. " +
        "But if the cause is right — the sacrifice is worth it.'",
      vulnerableTo: ['star'],     // Star: affirm the sacrifice has meaning
      resistantTo: ['gold'],      // Gold: material reward cheapens the sacrifice
    },
    negative: {
      // Negative pole = survival. Won't be martyred for others — Heart appeal to self works.
      narrative: "{target}'s voice hardens. 'I've already given enough. You're asking me to " +
        "risk everything I have left. I need to know I'll come out the other side.'",
      vulnerableTo: ['heart'],    // Heart: appeal to their bonds, not their ideals
      resistantTo: ['star'],      // Star: abstract sacrifice doesn't move the pragmatic
    },
  },

  // ─── tradition_novelty ────────────────────────────────────────────────────
  tradition_novelty: {
    positive: {
      // Positive pole = tradition. Respects precedent — invoke history and precedent.
      narrative: "{target} frowns. 'This isn't how it's been done. There are reasons " +
        "things work the way they do — breaking with tradition has consequences.'",
      vulnerableTo: ['veil'],     // Veil: invoke respected precedent and continuity
      resistantTo: ['eye'],       // Eye: cold facts don't address the cultural concern
    },
    negative: {
      // Negative pole = novelty. Craves innovation — new approaches resonate.
      narrative: "{target} leans back, unimpressed. 'The same approach that's been " +
        "tried a dozen times before. I need something that hasn't been done yet.'",
      vulnerableTo: ['eye'],      // Eye: present new information and fresh perspectives
      resistantTo: ['veil'],      // Veil: tradition arguments are exactly what they're bored of
    },
  },
};
