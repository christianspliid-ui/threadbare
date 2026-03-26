/**
 * Journey content — structural templates for hero's journey beats.
 *
 * Layer 1 of the 4-layer beat architecture. Each template defines:
 * - Dramatic shape (setup, tension, choices)
 * - State-driven variants (scored against StateSnapshot)
 * - Choices with effects
 *
 * Phase 2 starter set: 2-3 templates per phase.
 * Phase 6 target: 5-8 templates per phase.
 */

import type { JourneyBeatTemplate, StateSnapshot } from '../types/journeyEngine';

// ─── Scoring Helpers ────────────────────────────────────────────────

/** High power = primary reach > 30 and many traits */
function scorePowerHigh(s: StateSnapshot): number {
  return Math.min(1, (s.power.primaryReachLevel / 60) + (s.power.totalTraits / 10));
}

/** Low power = primary reach < 20 and few traits */
function scorePowerLow(s: StateSnapshot): number {
  return Math.max(0, 1 - (s.power.primaryReachLevel / 30) - (s.power.totalTraits / 8));
}

/** High influence = leading factions, many agreements */
function scoreInfluenceHigh(s: StateSnapshot): number {
  return Math.min(1, (s.influence.factionsLed * 0.3) + (s.influence.agreementsForged * 0.15) + (s.influence.locationsControlled * 0.2));
}

/** Lone wolf = no factions, no agreements, enemies */
function scoreLoneWolf(s: StateSnapshot): number {
  return Math.min(1,
    (s.influence.factionsLed === 0 ? 0.4 : 0) +
    (s.influence.agreementsForged === 0 ? 0.3 : 0) +
    (s.influence.enemiesMade * 0.15)
  );
}

/** Strong divine bond = high tier, high intervention */
function scoreDivineBond(s: StateSnapshot): number {
  return Math.min(1, (s.relationship.threadTier / 4) * 0.6 + s.relationship.interventionRatio * 0.4);
}

/** Distant divine = low tier or auto-resolve */
function scoreDistant(s: StateSnapshot): number {
  const modeScore = s.relationship.attentionMode === 'auto_resolve' ? 0.4 : 0;
  return Math.min(1, modeScore + (1 - s.relationship.threadTier / 4) * 0.6);
}

/** Ambitious = many active ambitions, completions */
function scoreAmbitious(s: StateSnapshot): number {
  return Math.min(1, (s.ambition.activeAmbitions * 0.3) + (s.ambition.completedMilestones * 0.2));
}

/** Generic middle-ground scorer (always returns moderate score) */
function scoreGeneric(_s: StateSnapshot): number {
  return 0.3;
}

// ─── Call Phase Templates ───────────────────────────────────────────

const CALL_AWAKENING: JourneyBeatTemplate = {
  id: 'call_awakening',
  validPhases: ['call'],
  description: 'The First feels something stirring — the divine thread pulls at their fate.',
  variants: [
    {
      key: 'ambitious_call',
      label: 'The Ambitious Awakening',
      score: scoreAmbitious,
      setupProse: 'Something has changed. Since the thread was woven, the world feels different — sharper, more demanding. Dreams of greatness whisper at the edges of sleep, and every crossroad seems to lead somewhere important.',
      tensionProse: 'The call comes not as a thunderbolt, but as a quiet certainty: this life was meant for more. The question is not whether to answer, but how.',
      choices: [
        {
          id: 'call_embrace',
          text: 'Embrace the call with open arms',
          godVoice: 'Yes. Rise, and let the world see what I have chosen.',
          effects: {
            interventionType: 'supportive',
            axiologicalShifts: { courage_cowardice: 0.1 },
            consequenceProse: 'The First steps forward with divine confidence. Their eyes burn with purpose.',
          },
        },
        {
          id: 'call_cautious',
          text: 'Accept cautiously — prepare before acting',
          godVoice: 'Patience is not weakness. Gather your strength.',
          effects: {
            interventionType: 'supportive',
            reachChanges: { eye: 0.05 },
            consequenceProse: 'The First takes stock of their surroundings, measuring the weight of destiny against the reality of their current means.',
          },
        },
        {
          id: 'call_step_back',
          text: 'Let them find their own way to answer',
          godVoice: '...',
          effects: {
            interventionType: 'withdrawn',
            consequenceProse: 'The divine presence recedes. The First must discover their own path to greatness — or obscurity.',
          },
        },
      ],
    },
    {
      key: 'reluctant_call',
      label: 'The Reluctant Awakening',
      score: scorePowerLow,
      setupProse: 'The world has not been kind, and the thread feels like just another burden. Who asks a nobody to save anything? Who threads fate around someone who can barely save themselves?',
      tensionProse: 'Yet the thread tugs. Not demanding — inviting. As if something vast and patient is saying: you are more than you know.',
      choices: [
        {
          id: 'call_encourage',
          text: 'Send a vision of what they could become',
          godVoice: 'See yourself through my eyes. You are not small.',
          effects: {
            interventionType: 'supportive',
            axiologicalShifts: { courage_cowardice: 0.15 },
            consequenceProse: 'The First glimpses a future self — powerful, purposeful. The vision fades, but the warmth remains.',
          },
        },
        {
          id: 'call_push',
          text: 'Force their hand — create a crisis only they can solve',
          godVoice: 'No more hiding. The world needs you whether you agree or not.',
          effects: {
            interventionType: 'coercive',
            axiologicalShifts: { courage_cowardice: 0.1, mercy_ruthlessness: -0.05 },
            consequenceProse: 'Circumstance conspires. The First is thrust into action not by choice but by necessity — and discovers they can rise to meet it.',
          },
        },
        {
          id: 'call_wait',
          text: 'Let them find their own reason to act',
          effects: {
            interventionType: 'withdrawn',
            consequenceProse: 'Silence from above. The First must decide for themselves whether destiny is worth answering.',
          },
        },
      ],
    },
  ],
};

const CALL_FALLBACK: JourneyBeatTemplate = {
  id: 'call_fallback',
  validPhases: ['call'],
  description: 'Generic call — fate moves.',
  isFallback: true,
  variants: [
    {
      key: 'generic_call',
      label: 'The Thread Stirs',
      score: scoreGeneric,
      setupProse: 'The thread between god and mortal hums with new energy. Something is beginning — a story that will reshape this corner of the world.',
      tensionProse: 'The First stands at the threshold between the life they know and the destiny they were chosen for.',
      choices: [
        {
          id: 'call_guide',
          text: 'Guide them gently toward their path',
          effects: { interventionType: 'supportive', consequenceProse: 'A gentle nudge. The journey begins.' },
        },
        {
          id: 'call_observe',
          text: 'Watch and wait',
          effects: { interventionType: 'withdrawn', consequenceProse: 'The god watches. The mortal chooses.' },
        },
      ],
    },
  ],
};

// ─── Road of Trials Templates ───────────────────────────────────────

const TRIALS_RISING_STAR: JourneyBeatTemplate = {
  id: 'trials_rising_star',
  validPhases: ['road_of_trials'],
  description: 'The First is growing in power and reputation. Success breeds new challenges.',
  variants: [
    {
      key: 'rising_star',
      label: 'Rising Star',
      score: (s) => scorePowerHigh(s) * 0.5 + scoreInfluenceHigh(s) * 0.5,
      setupProse: 'Word spreads. The First\'s name carries weight now — earned through deeds and sealed by the thread that connects them to something greater. But rising stars attract attention, and not all of it welcome.',
      tensionProse: 'A rival emerges — someone who sees the First not as an ally but as an obstacle. The confrontation is inevitable.',
      choices: [
        {
          id: 'trials_diplomacy',
          text: 'Counsel diplomacy — turn the rival into an ally',
          godVoice: 'Strength need not crush. Sometimes it embraces.',
          effects: {
            interventionType: 'supportive',
            axiologicalShifts: { mercy_ruthlessness: 0.1 },
            reachChanges: { heart: 0.05 },
            consequenceProse: 'The First extends a hand where a fist was expected. The rival hesitates — and perhaps reconsiders.',
          },
        },
        {
          id: 'trials_confront',
          text: 'Embolden them to face the rival directly',
          godVoice: 'Show them what divine favor looks like.',
          effects: {
            interventionType: 'coercive',
            axiologicalShifts: { courage_cowardice: 0.1 },
            reachChanges: { iron: 0.05 },
            consequenceProse: 'The First stands their ground. Whether through force or sheer presence, the rival learns the cost of opposition.',
          },
        },
        {
          id: 'trials_step_back',
          text: 'Let them handle this alone',
          effects: {
            interventionType: 'withdrawn',
            consequenceProse: 'The First faces the challenge with only mortal resolve. The outcome will be theirs alone.',
          },
        },
      ],
    },
    {
      key: 'lonely_climb',
      label: 'The Lonely Climb',
      score: scoreLoneWolf,
      setupProse: 'Power comes, but at a cost. The First stands taller than those around them, and the distance between grows with each victory. Allies are few. The path is solitary.',
      tensionProse: 'A moment of vulnerability: the First must trust someone, or continue alone into increasingly dangerous territory.',
      choices: [
        {
          id: 'trials_send_ally',
          text: 'Arrange a fateful meeting with a potential companion',
          godVoice: 'Even gods do not walk alone. Why should you?',
          effects: {
            interventionType: 'supportive',
            reachChanges: { heart: 0.05 },
            consequenceProse: 'A chance encounter — or so it seems. The First finds an unexpected kindred spirit.',
          },
        },
        {
          id: 'trials_harden',
          text: 'Reinforce their self-reliance',
          godVoice: 'You need no one. You have me.',
          effects: {
            interventionType: 'coercive',
            axiologicalShifts: { humility_pride: -0.1 },
            consequenceProse: 'The First steels themselves. Alone is not the same as weak.',
          },
        },
        {
          id: 'trials_watch',
          text: 'Observe without intervening',
          effects: {
            interventionType: 'withdrawn',
            consequenceProse: 'The First walks on, unaware of the eyes that watch from above.',
          },
        },
      ],
    },
  ],
};

const TRIALS_TEMPTATION: JourneyBeatTemplate = {
  id: 'trials_temptation',
  validPhases: ['road_of_trials'],
  description: 'The First faces a moral test — power offered at a cost.',
  variants: [
    {
      key: 'power_temptation',
      label: 'The Temptation of Power',
      score: (s) => scorePowerHigh(s) * 0.4 + scoreAmbitious(s) * 0.6,
      setupProse: 'A shortcut presents itself. Power, influence, safety — all within reach. The price is steep, but the First has paid steep prices before.',
      tensionProse: 'The choice crystallizes: take what is offered and risk corruption, or walk the harder path and keep faith with what they believe.',
      choices: [
        {
          id: 'trials_warn',
          text: 'Send a warning — this gift has teeth',
          godVoice: 'What is freely given is rarely free. Look deeper.',
          effects: {
            interventionType: 'supportive',
            axiologicalShifts: { honesty_deception: 0.1 },
            consequenceProse: 'The First hesitates, then looks past the gleaming surface. The trap reveals itself.',
          },
        },
        {
          id: 'trials_allow',
          text: 'Let them take it — sometimes the dark path teaches most',
          godVoice: 'Wisdom sometimes wears thorns.',
          effects: {
            interventionType: 'withdrawn',
            axiologicalShifts: { mercy_ruthlessness: -0.05 },
            consequenceProse: 'The First reaches out and takes what was offered. Only time will tell if the price was worth it.',
          },
        },
        {
          id: 'trials_redirect',
          text: 'Redirect them toward a harder but truer path',
          godVoice: 'Not that way. This way — and trust me.',
          effects: {
            interventionType: 'coercive',
            axiologicalShifts: { sacrifice_selfishness: 0.1 },
            reachChanges: { star: 0.03 },
            consequenceProse: 'The First turns away from the easy answer. The harder path opens before them, unmarked but honest.',
          },
        },
      ],
    },
  ],
};

const TRIALS_FALLBACK: JourneyBeatTemplate = {
  id: 'trials_fallback',
  validPhases: ['road_of_trials'],
  description: 'Generic trial — the journey continues.',
  isFallback: true,
  variants: [
    {
      key: 'generic_trial',
      label: 'The Road Continues',
      score: scoreGeneric,
      setupProse: 'Another step on the long road. The First grows through each challenge, though the destination remains unclear.',
      tensionProse: 'A choice must be made. There is no wrong answer — only different stories.',
      choices: [
        {
          id: 'trials_support',
          text: 'Offer divine guidance',
          effects: { interventionType: 'supportive', consequenceProse: 'The thread hums with warmth. The First feels less alone.' },
        },
        {
          id: 'trials_observe',
          text: 'Watch from above',
          effects: { interventionType: 'withdrawn', consequenceProse: 'The journey continues under mortal power alone.' },
        },
      ],
    },
  ],
};

// ─── Crisis Templates ───────────────────────────────────────────────

const CRISIS_SHADOW: JourneyBeatTemplate = {
  id: 'crisis_shadow',
  validPhases: ['crisis'],
  description: 'The archetype\'s shadow surfaces. Everything the First has built is threatened.',
  variants: [
    {
      key: 'hubris_crisis',
      label: 'The Price of Hubris',
      score: (s) => scorePowerHigh(s) * 0.6 + scoreInfluenceHigh(s) * 0.4,
      setupProse: 'Success has bred certainty, and certainty has bred blindness. The First stands at the height of their power — exactly where the fall begins.',
      tensionProse: 'Everything comes due at once. Alliances fray, enemies converge, and the First discovers that power without wisdom is a tower built on sand.',
      choices: [
        {
          id: 'crisis_shield',
          text: 'Shield them from the worst of it',
          godVoice: 'I will not watch you fall. Not yet.',
          effects: {
            interventionType: 'supportive',
            essenceCost: 2,
            axiologicalShifts: { humility_pride: 0.1 },
            consequenceProse: 'Divine grace softens the blow. The First survives the crisis humbled but intact.',
          },
        },
        {
          id: 'crisis_let_fall',
          text: 'Let the crisis run its course — they need this lesson',
          godVoice: 'Pain is a teacher I cannot replace.',
          effects: {
            interventionType: 'withdrawn',
            axiologicalShifts: { humility_pride: 0.15, sacrifice_selfishness: 0.05 },
            consequenceProse: 'The tower crumbles. The First learns what foundations really hold.',
          },
        },
        {
          id: 'crisis_redirect',
          text: 'Turn the crisis into an opportunity',
          godVoice: 'See it differently. This is not an ending — it is a door.',
          effects: {
            interventionType: 'coercive',
            reachChanges: { eye: 0.05 },
            consequenceProse: 'Amid the wreckage, the First finds something unexpected: a path they never would have seen from the summit.',
          },
        },
      ],
    },
    {
      key: 'survival_crisis',
      label: 'The Desperate Hour',
      score: scorePowerLow,
      setupProse: 'The journey has taken everything. Strength is spent, allies are scattered, and the darkness that has always been waiting finally closes in.',
      tensionProse: 'This is the bottom. The First must find something — anything — to keep going, or the thread will unravel.',
      choices: [
        {
          id: 'crisis_surge',
          text: 'Pour divine energy into them — they must survive',
          godVoice: 'I chose you. I will not let you end here.',
          effects: {
            interventionType: 'supportive',
            essenceCost: 3,
            axiologicalShifts: { courage_cowardice: 0.15 },
            consequenceProse: 'Light pours through the thread. The First gasps, steadies, and stands. Not strong — but alive. Enough.',
          },
        },
        {
          id: 'crisis_inner_strength',
          text: 'Whisper that they already have what they need',
          godVoice: 'You have always been enough. Remember.',
          effects: {
            interventionType: 'supportive',
            axiologicalShifts: { humility_pride: -0.05, courage_cowardice: 0.1 },
            consequenceProse: 'The words echo in the dark. The First reaches inward and finds a flame that was never quite extinguished.',
          },
        },
        {
          id: 'crisis_silence',
          text: 'Say nothing — this crucible will forge them or break them',
          effects: {
            interventionType: 'withdrawn',
            consequenceProse: 'Silence from the heavens. The First faces their darkest hour truly alone.',
          },
        },
      ],
    },
  ],
};

const CRISIS_FALLBACK: JourneyBeatTemplate = {
  id: 'crisis_fallback',
  validPhases: ['crisis'],
  description: 'Generic crisis — everything is tested.',
  isFallback: true,
  variants: [
    {
      key: 'generic_crisis',
      label: 'The Crucible',
      score: scoreGeneric,
      setupProse: 'The journey darkens. What seemed like progress reveals itself as preparation — preparation for this, the moment where everything hangs in the balance.',
      tensionProse: 'The First must face what they fear most. There is no path around it, only through.',
      choices: [
        {
          id: 'crisis_help',
          text: 'Stand with them in the darkness',
          effects: { interventionType: 'supportive', consequenceProse: 'The thread blazes. They are not alone.' },
        },
        {
          id: 'crisis_withdraw',
          text: 'Step back and let the crucible do its work',
          effects: { interventionType: 'withdrawn', consequenceProse: 'The fire burns. What emerges will be tested.' },
        },
      ],
    },
  ],
};

// ─── Ordeal Templates ───────────────────────────────────────────────

const ORDEAL_PEAK: JourneyBeatTemplate = {
  id: 'ordeal_peak',
  validPhases: ['ordeal'],
  description: 'The Ordeal — the single most important moment in the arc. Determines the Return.',
  variants: [
    {
      key: 'ordeal_mighty',
      label: 'The Ordeal of the Mighty',
      score: (s) => scorePowerHigh(s) * 0.5 + scoreInfluenceHigh(s) * 0.3 + scoreDivineBond(s) * 0.2,
      setupProse: 'Everything has led to this. The First stands at the culmination of their journey — powerful, tested, and facing the one challenge that all their strength may not be enough to overcome.',
      tensionProse: 'The ordeal demands everything. Not just strength but wisdom, not just courage but sacrifice. The thread between god and mortal strains under the weight of what must be decided.',
      choices: [
        {
          id: 'ordeal_direct',
          text: 'Intervene directly — guarantee their triumph',
          godVoice: 'This is MY champion. The world will know it.',
          effects: {
            interventionType: 'coercive',
            essenceCost: 5,
            ordealOutcome: 'triumph',
            consequenceProse: 'Divine power surges through the thread. The First blazes with borrowed glory. The ordeal shatters before them.',
          },
        },
        {
          id: 'ordeal_guide',
          text: 'Guide them subtly — give them a chance to succeed on their own',
          godVoice: 'You can do this. I believe in you.',
          effects: {
            interventionType: 'supportive',
            essenceCost: 2,
            ordealOutcome: 'scraped_through',
            consequenceProse: 'A whisper of guidance at the crucial moment. The First stumbles, recovers, and pushes through — battered but victorious.',
          },
        },
        {
          id: 'ordeal_withdraw',
          text: 'Step back entirely — this must be their moment',
          effects: {
            interventionType: 'withdrawn',
            ordealOutcome: 'broken',
            consequenceProse: 'The god withdraws. The First faces the ordeal with nothing but mortal will. What breaks can be reforged — but the scars will remain.',
          },
        },
      ],
    },
    {
      key: 'ordeal_humble',
      label: 'The Ordeal of the Humble',
      score: (s) => scorePowerLow(s) * 0.4 + scoreDistant(s) * 0.3 + scoreGeneric(s) * 0.3,
      setupProse: 'The ordeal comes not as a great battle but as a quiet reckoning. The First, who has never been mighty, faces something that requires not power but heart.',
      tensionProse: 'This is the moment that defines them. Not strength against strength, but will against despair. The thread is thin here — the god\'s reach barely extends this far.',
      choices: [
        {
          id: 'ordeal_pour_in',
          text: 'Pour everything into the thread — save them at any cost',
          godVoice: 'I will not lose you. Whatever it costs.',
          effects: {
            interventionType: 'supportive',
            essenceCost: 5,
            ordealOutcome: 'triumph',
            consequenceProse: 'The thread blazes white-hot. The First feels the full weight of divine love crash through them like a wave. They stand, impossibly. They endure.',
          },
        },
        {
          id: 'ordeal_steady',
          text: 'Steady the thread — let them feel they are not alone',
          godVoice: 'I am here. You are not alone in this.',
          effects: {
            interventionType: 'supportive',
            essenceCost: 2,
            ordealOutcome: 'scraped_through',
            consequenceProse: 'Not enough to turn the tide, but enough to hold the line. The First scrapes through by the narrowest margin, forever changed.',
          },
        },
        {
          id: 'ordeal_trust',
          text: 'Trust them — they have grown enough for this',
          effects: {
            interventionType: 'withdrawn',
            ordealOutcome: 'broken',
            consequenceProse: 'The god trusts. The mortal breaks. But breaking is not ending — and what was shattered may yet be remade.',
          },
        },
      ],
    },
  ],
};

// ─── Return Templates ───────────────────────────────────────────────

const RETURN_CONVERGENCE: JourneyBeatTemplate = {
  id: 'return_convergence',
  validPhases: ['return'],
  description: 'The Return — dramatic conclusion of the arc. Outcome determined by peak-end model.',
  variants: [
    {
      key: 'triumphant_return',
      label: 'Triumphant Return',
      score: (s) => scorePowerHigh(s) * 0.3 + scoreInfluenceHigh(s) * 0.3 + scoreDivineBond(s) * 0.4,
      setupProse: 'The journey is complete. The First returns not as the uncertain soul who answered the call, but as something more — forged by trial, tempered by crisis, defined by the ordeal.',
      tensionProse: 'The world has changed in their absence, and they have changed more. The question now is not what they have become, but what they will do with it.',
      choices: [
        {
          id: 'return_bless',
          text: 'Bless their return — let the world know your champion',
          godVoice: 'You have exceeded even my hopes. Go now, and be magnificent.',
          effects: {
            interventionType: 'supportive',
            consequenceProse: 'The First returns wreathed in subtle glory. Those who see them know: this is someone touched by something greater.',
          },
        },
        {
          id: 'return_release',
          text: 'Release them from the intensity of the thread — they have earned their freedom',
          effects: {
            interventionType: 'withdrawn',
            consequenceProse: 'The thread loosens. Not severed, but relaxed. The First is free to choose their own path, carrying the journey\'s lessons.',
          },
        },
      ],
    },
    {
      key: 'bittersweet_return',
      label: 'Bittersweet Return',
      score: (s) => scoreDistant(s) * 0.4 + scoreLoneWolf(s) * 0.3 + scoreGeneric(s) * 0.3,
      setupProse: 'The journey ends, but not as anyone imagined. The First has survived — grown, even — but the cost is written in every line of their face, every scar they carry.',
      tensionProse: 'What remains is enough. Not the triumph they might have won, but something quieter: wisdom, endurance, and the knowledge that they faced the worst and did not break entirely.',
      choices: [
        {
          id: 'return_comfort',
          text: 'Offer comfort through the thread — they have done enough',
          godVoice: 'Rest now. You have carried more than any mortal should.',
          effects: {
            interventionType: 'supportive',
            consequenceProse: 'Warmth flows through the thread. The First exhales a breath they have been holding since the ordeal.',
          },
        },
        {
          id: 'return_quiet',
          text: 'Let them find their own peace',
          effects: {
            interventionType: 'withdrawn',
            consequenceProse: 'Silence. The First finds their own way home, carrying the weight of everything that happened.',
          },
        },
      ],
    },
  ],
};

// ─── Export ──────────────────────────────────────────────────────────

/**
 * All journey beat templates — Phase 2 starter set.
 * Indexed by ID for quick lookup.
 */
export const JOURNEY_BEAT_TEMPLATES: JourneyBeatTemplate[] = [
  // Call (2 templates)
  CALL_AWAKENING,
  CALL_FALLBACK,
  // Road of Trials (3 templates)
  TRIALS_RISING_STAR,
  TRIALS_TEMPTATION,
  TRIALS_FALLBACK,
  // Crisis (2 templates)
  CRISIS_SHADOW,
  CRISIS_FALLBACK,
  // Ordeal (1 template, 2 variants)
  ORDEAL_PEAK,
  // Return (1 template, 2 variants)
  RETURN_CONVERGENCE,
];
