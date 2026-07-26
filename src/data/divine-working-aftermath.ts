/**
 * Divine Working Aftermath — authored reaction sets for the destructive player casts (THR-741).
 *
 * The Divine Receipt (THR-727) renders `aftermathSummary.reactions` as a player choice row —
 * the loop-closing "what thread do you keep alive" beat. The surface shipped; the content did
 * not: only the six `invest.*` reach signatures authored an `aftermathConfig`, so every other
 * cast resolved to a receipt with no choices. This module fills the first tranche: the five
 * destructive/large workings where "what do you do with what you just did" writes itself.
 *
 * ─── The fork ───────────────────────────────────────────────────────────────────
 * Every set offers the same underlying decision in the card's own idiom: **claim the working
 * or conceal it.**
 *
 * - *Claim* writes a full-weight reach-polarity `reputation_tally` on the ascendant and a
 *   chronicle-visible `recent_event`. Tallies are read by `phaseReputationTraits`, which
 *   scans every `actor` node (the ascendant included) and assigns the reach's reputation
 *   trait at the 3 / 8 / 15 thresholds. Repeated ruin is how a god earns "Brutal Thug".
 * - *Conceal* writes a muted tally, a quiet event, and a `concealed_action` `hidden_mark` on
 *   the ascendant whose `revealFamilies` match the other divine-working prefixes — so a later
 *   working on the world is what surfaces the one you hid (`evaluateMarkReveals` matches on
 *   `templateId.startsWith(family)`; `consumeMatchingMarks` rolls it at reaction time).
 * - Two cards offer a third path where the fiction genuinely supports it: a *positive*-polarity
 *   reading of the same act (scorching as deterrence, unrest as a presence behind the
 *   grievance). Polarity competes inside `phaseReputationTraits`, so the two claims are
 *   mutually exclusive over repeated casts — a real fork, not a flavour toggle.
 *
 * ─── Engine surface ─────────────────────────────────────────────────────────────
 * None. Every effect here is a shipped `EncounterAftermathReactionEffect` kind with a live
 * consumer, dispatched by `applyEncounterAftermathReaction`. No new effect kinds, no new
 * fields, no new phases.
 *
 * ─── Voice ──────────────────────────────────────────────────────────────────────
 * Overviews and `intent` prose sit at peak register (a major aftermath beat is a designated
 * peak surface — `Docs/canon/prose.md`). `label` is interactive text and therefore plain: a
 * player must never misread what a click does.
 */

import type { BranchAwareAftermathConfig } from '../types/unifiedAction';

// ─── Tuning constants (NFP #1: Tunability) ──────────────────────────────────────

/**
 * Reach-polarity tally delta when the god lets the working be attributed. One openly claimed
 * working is a third of the way to the Level-1 reputation threshold
 * (`REPUTATION_LEVEL_1_THRESHOLD` = 3), so a reputation is earned over a handful of casts
 * rather than in one.
 */
export const DIVINE_WORKING_CLAIMED_TALLY = 1.0;

/**
 * Tally delta when the god conceals the working. Word still moves — a sundered hex is not
 * deniable — but it attaches to the act, not the hand. Against the 0.02/tick tally decay this
 * fades inside a run unless concealed workings are repeated.
 */
export const DIVINE_WORKING_CONCEALED_TALLY = 0.35;

/** Ripple significance for a claimed working — at/above the chronicle threshold, so it is recorded. */
export const DIVINE_WORKING_CLAIMED_SIGNIFICANCE = 0.85;

/** Ripple significance for a concealed working — recentEvents only, below the chronicle threshold. */
export const DIVINE_WORKING_CONCEALED_SIGNIFICANCE = 0.5;

/**
 * `hidden_mark` severity for a concealed working. Severity drives both reveal probability
 * (`severity * REVEAL_PROBABILITY_MULT`) and decay lifetime — mid-severity is a real, revealable
 * footprint rather than a permanent secret.
 */
export const DIVINE_WORKING_MARK_SEVERITY = 0.55;

/** Heavier severity for the workings too large to hide well — a sundered hex leaves more to find. */
export const DIVINE_WORKING_MARK_SEVERITY_HEAVY = 0.7;

/**
 * Template-id prefixes that can surface a concealed working. Matched by
 * `templateId.startsWith(family)`, so these are the ascendant's own world-shaping families:
 * keep laying hands on the world and the working you hid is what gets traced.
 */
export const DIVINE_WORKING_REVEAL_FAMILIES: readonly string[] = ['hex.', 'loc.', 'artifact.'];

// ─── hex.rend_earth — Rend the Earth (stone) ────────────────────────────────────

export const REND_EARTH_AFTERMATH: BranchAwareAftermathConfig = {
  branchOnStep: 0,
  variants: {},
  fallback: {
    overview:
      'The ground remembers being whole. It will not again. Where you set your hand the land ' +
      'lies open to its bones, and every road that used to cross it now ends at an edge.',
    changes: [],
    reactionPrompt: 'The land is broken. Decide what you do with the breaking.',
    reactions: [
      {
        id: 'rend_earth_claim',
        label: 'Let them name the hand.',
        intent:
          'Leave the sundering unhidden. Let every traveller who walks to the edge and turns ' +
          'back learn the same thing about what you are willing to do.',
        effects: [
          { kind: 'reputation_tally' as const, key: 'stone.negative', delta: DIVINE_WORKING_CLAIMED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'ripple_consequence' as const,
            message:
              'The broken land is spoken of as a god\'s work, and the speaking does not soften it.',
            significance: DIVINE_WORKING_CLAIMED_SIGNIFICANCE,
          },
        ],
      },
      {
        id: 'rend_earth_conceal',
        label: 'Leave no hand to find.',
        intent:
          'Let the sundering read as the earth\'s own failure. What they cannot attribute, they ' +
          'cannot pray against — though a wound this size keeps something of its making.',
        effects: [
          {
            kind: 'hidden_mark' as const,
            category: 'concealed_action' as const,
            severity: DIVINE_WORKING_MARK_SEVERITY_HEAVY,
            label: 'A hex sundered to its bones, left to read as the earth\'s own failure',
            revealFamilies: DIVINE_WORKING_REVEAL_FAMILIES,
          },
          { kind: 'reputation_tally' as const, key: 'stone.negative', delta: DIVINE_WORKING_CONCEALED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'narrative' as const,
            message: 'The land is called unlucky ground. No one yet says whose luck.',
            significance: DIVINE_WORKING_CONCEALED_SIGNIFICANCE,
          },
        ],
      },
    ],
  },
};

// ─── hex.corrupt_land — Corrupt the Land (veil) ─────────────────────────────────

export const CORRUPT_LAND_AFTERMATH: BranchAwareAftermathConfig = {
  branchOnStep: 0,
  variants: {},
  fallback: {
    overview:
      'The taint is in the soil now, patient as rot. It will take a season for anyone to be ' +
      'certain, and by then the certainty will not help them.',
    changes: [],
    reactionPrompt: 'The corruption is seeded. Decide whose work it appears to be.',
    reactions: [
      {
        id: 'corrupt_land_claim',
        label: 'Let the blight carry your name.',
        intent:
          'Make no secret of the souring. A land that withers on a god\'s word is a sermon ' +
          'that preaches itself to every neighbouring field.',
        effects: [
          { kind: 'reputation_tally' as const, key: 'veil.negative', delta: DIVINE_WORKING_CLAIMED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'ripple_consequence' as const,
            message: 'Word runs ahead of the rot: the ground was cursed, and the curse was asked for.',
            significance: DIVINE_WORKING_CLAIMED_SIGNIFICANCE,
          },
        ],
      },
      {
        id: 'corrupt_land_conceal',
        label: 'Let it look like bad seasons.',
        intent:
          'Keep your hand out of it. Let the failing crops be weather and ill fortune, and let ' +
          'them exhaust their prayers on the wrong cause.',
        effects: [
          {
            kind: 'hidden_mark' as const,
            category: 'concealed_action' as const,
            severity: DIVINE_WORKING_MARK_SEVERITY,
            label: 'A slow corruption seeded into a hex and dressed as bad seasons',
            revealFamilies: DIVINE_WORKING_REVEAL_FAMILIES,
          },
          { kind: 'reputation_tally' as const, key: 'veil.negative', delta: DIVINE_WORKING_CONCEALED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'narrative' as const,
            message: 'The harvest comes in thin and no one can agree why.',
            significance: DIVINE_WORKING_CONCEALED_SIGNIFICANCE,
          },
        ],
      },
    ],
  },
};

// ─── hex.scorch_earth — Scorch Earth (iron) ─────────────────────────────────────

export const SCORCH_EARTH_AFTERMATH: BranchAwareAftermathConfig = {
  branchOnStep: 0,
  variants: {},
  fallback: {
    overview:
      'The fire has gone out and left the shape of itself behind. Nothing here will feed anyone ' +
      'this year, and everyone who passes will be able to see exactly how far it reached.',
    changes: [],
    reactionPrompt: 'The burning is done. Decide what it is understood to mean.',
    reactions: [
      {
        id: 'scorch_earth_terror',
        label: 'Let it be read as a warning.',
        intent:
          'Say nothing to soften it. A god who burns a valley for a reason no one is told is a ' +
          'god no one argues with twice.',
        effects: [
          { kind: 'reputation_tally' as const, key: 'iron.negative', delta: DIVINE_WORKING_CLAIMED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'ripple_consequence' as const,
            message: 'The burnt ground is talked about far past the smoke, and always in the same lowered voice.',
            significance: DIVINE_WORKING_CLAIMED_SIGNIFICANCE,
          },
        ],
      },
      {
        id: 'scorch_earth_deterrence',
        label: 'Let it be read as a shield.',
        intent:
          'Give the burning a purpose they can repeat: nothing crosses here now. Terrible is ' +
          'easier to live beside when it is pointed outward.',
        effects: [
          { kind: 'reputation_tally' as const, key: 'iron.positive', delta: DIVINE_WORKING_CLAIMED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'ripple_consequence' as const,
            message: 'They call the scorched line a wall, and are glad of it in the way people are glad of a drawn blade.',
            significance: DIVINE_WORKING_CLAIMED_SIGNIFICANCE,
          },
        ],
      },
      {
        id: 'scorch_earth_conceal',
        label: 'Leave it unexplained.',
        intent:
          'Take the meaning away entirely. Let the burn be a thing that happened, with no hand ' +
          'behind it worth naming — for as long as that holds.',
        effects: [
          {
            kind: 'hidden_mark' as const,
            category: 'concealed_action' as const,
            severity: DIVINE_WORKING_MARK_SEVERITY,
            label: 'A hex burned bare and left without an explanation',
            revealFamilies: DIVINE_WORKING_REVEAL_FAMILIES,
          },
          { kind: 'reputation_tally' as const, key: 'iron.negative', delta: DIVINE_WORKING_CONCEALED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'narrative' as const,
            message: 'The valley burned in clear weather. That is all anyone can say about it.',
            significance: DIVINE_WORKING_CONCEALED_SIGNIFICANCE,
          },
        ],
      },
    ],
  },
};

// ─── artifact.curse — Curse (shadow) ────────────────────────────────────────────

export const ARTIFACT_CURSE_AFTERMATH: BranchAwareAftermathConfig = {
  branchOnStep: 0,
  variants: {},
  fallback: {
    overview:
      'The malediction settles into the object the way damp settles into wood — no seam, no ' +
      'mark, nothing to hand back. It will travel now, and it will be carried gladly.',
    changes: [],
    reactionPrompt: 'The curse is bound. Decide whether it travels known or unknown.',
    reactions: [
      {
        id: 'artifact_curse_conceal',
        label: 'Let it travel unnoticed.',
        intent:
          'Leave the binding silent. An object that is wanted moves faster than one that is ' +
          'feared, and the wanting is the delivery.',
        effects: [
          {
            kind: 'hidden_mark' as const,
            category: 'concealed_action' as const,
            severity: DIVINE_WORKING_MARK_SEVERITY,
            label: 'A curse bound quietly into an object still passing hand to hand',
            revealFamilies: DIVINE_WORKING_REVEAL_FAMILIES,
          },
          { kind: 'reputation_tally' as const, key: 'shadow.negative', delta: DIVINE_WORKING_CONCEALED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'narrative' as const,
            message: 'Ill luck follows the object from owner to owner, and none of them connect the two.',
            significance: DIVINE_WORKING_CONCEALED_SIGNIFICANCE,
          },
        ],
      },
      {
        id: 'artifact_curse_declare',
        label: 'Let the curse be known.',
        intent:
          'Let word of the binding run with the object. A thing everyone knows is poisoned still ' +
          'gets picked up — by exactly the sort of person you want holding it.',
        effects: [
          { kind: 'reputation_tally' as const, key: 'shadow.negative', delta: DIVINE_WORKING_CLAIMED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'ripple_consequence' as const,
            message: 'The object is named cursed, and named as yours, and is wanted no less for either.',
            significance: DIVINE_WORKING_CLAIMED_SIGNIFICANCE,
          },
        ],
      },
    ],
  },
};

// ─── loc.incite_unrest — Incite Unrest (shadow) ─────────────────────────────────

export const INCITE_UNREST_AFTERMATH: BranchAwareAftermathConfig = {
  branchOnStep: 0,
  variants: {},
  fallback: {
    overview:
      'The grievance was already there. All you did was stop it being private. It moves through ' +
      'the streets now at the speed of people agreeing with each other.',
    changes: [],
    reactionPrompt: 'The discontent is loose. Decide what stands behind it.',
    reactions: [
      {
        id: 'incite_unrest_claim',
        label: 'Let them know you set it going.',
        intent:
          'Put your hand openly under the anger. A god who is seen to stir a city is a god the ' +
          'next city plans around.',
        effects: [
          { kind: 'reputation_tally' as const, key: 'shadow.negative', delta: DIVINE_WORKING_CLAIMED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'ripple_consequence' as const,
            message: 'The unrest is laid at your feet by everyone who benefits from laying it somewhere.',
            significance: DIVINE_WORKING_CLAIMED_SIGNIFICANCE,
          },
        ],
      },
      {
        id: 'incite_unrest_presence',
        label: 'Be the presence behind it.',
        intent:
          'Stay unnamed but not unfelt. Let the crowd carry the sense that something larger agrees ' +
          'with them — and let them decide for themselves what that is.',
        effects: [
          { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: DIVINE_WORKING_CLAIMED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'ripple_consequence' as const,
            message: 'The crowd speaks as if it has a backer it cannot name, and is braver for it.',
            significance: DIVINE_WORKING_CLAIMED_SIGNIFICANCE,
          },
        ],
      },
      {
        id: 'incite_unrest_conceal',
        label: 'Keep out of it entirely.',
        intent:
          'Withdraw the hand and let the anger belong to the people who feel it. Nothing to trace ' +
          'back — until someone thinks to look at who else was in the city.',
        effects: [
          {
            kind: 'hidden_mark' as const,
            category: 'concealed_action' as const,
            severity: DIVINE_WORKING_MARK_SEVERITY,
            label: 'Unrest stirred into a settlement and left to look like its own idea',
            revealFamilies: DIVINE_WORKING_REVEAL_FAMILIES,
          },
          { kind: 'reputation_tally' as const, key: 'shadow.negative', delta: DIVINE_WORKING_CONCEALED_TALLY },
          {
            kind: 'recent_event' as const,
            eventType: 'narrative' as const,
            message: 'The city argues with itself and believes the argument is entirely its own.',
            significance: DIVINE_WORKING_CONCEALED_SIGNIFICANCE,
          },
        ],
      },
    ],
  },
};

/**
 * Every authored divine-working aftermath, keyed by template id. The templates reference the
 * named consts directly; this map exists so sweeps and tests can iterate the tranche without
 * re-listing it.
 */
export const DIVINE_WORKING_AFTERMATH: Readonly<Record<string, BranchAwareAftermathConfig>> = {
  'hex.rend_earth': REND_EARTH_AFTERMATH,
  'hex.corrupt_land': CORRUPT_LAND_AFTERMATH,
  'hex.scorch_earth': SCORCH_EARTH_AFTERMATH,
  'artifact.curse': ARTIFACT_CURSE_AFTERMATH,
  'loc.incite_unrest': INCITE_UNREST_AFTERMATH,
};
