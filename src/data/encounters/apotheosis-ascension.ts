/**
 * The Apotheosis — the capstone covenant that makes a mortal an Aspect of the god. (THR-479)
 *
 * A Tier-1 bespoke marquee, seeded onto a mortal who has held the top Influence
 * rung (Enthralled / tier 4) long enough that the bond has worn the soul thin
 * enough to pour through. The god decides whether to raise the mortal into a
 * partial aspect of itself, or to let them remain wholly mortal.
 *
 * Trigger: seeded by seedApotheosisEncounters (engine/aspects.ts) when a tier-4
 * thread has held for ASPECT_ELIGIBILITY_TICKS. Self-targeting onto the mortal.
 *
 * The accept branch's aftermath carries the `grant_aspect` effect, which creates
 * the permanent `aspect_of` edge. Refusal leaves the mortal at tier 4; the offer
 * can re-seed after ASPECT_REOFFER_COOLDOWN_TICKS.
 *
 * Design doc: Docs/plans/2026-06-23-thr479-aspect-apex-state.md
 *
 * NOTE: the director verdict named accept / refuse / "unmade" branches. This
 * first implementation ships accept (grant) + refuse (no grant); the "unmade"
 * fail-forward (a mortal frame that cannot hold the divinity) is rendered as
 * narrative weight in the accept prose and tracked as a content follow-up rather
 * than a mechanical branch, so the grant path stays deterministic.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import { withEncounterContract } from '../encounter-contract-builder';
import { APOTHEOSIS_ENCOUNTER_TEMPLATE_ID } from '../aspect-content';

// ─── Steps ───────────────────────────────────────────────────────────

/**
 * Step 0 — The Threshold. The god perceives a mortal worn translucent by
 * devotion. Difficulty 0: the choice is the point, not a roll.
 */
const step0TheThreshold: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'There is a kind of devotion that stops being a feeling and becomes a doorway, and the god ' +
    'found one standing open. The mortal had given everything a mortal can give — years, certainty, ' +
    'the shape of an ordinary life worn away like a coin handled too long — and somewhere in the ' +
    'giving the boundary between worshipper and worshipped had gone thin as wet paper. The god could ' +
    'see through it now. Not into the mortal; *out* through them, as though their eyes had become a ' +
    'second window onto the world, and through that window the god glimpsed what it would be to stand ' +
    'in two places at once: to walk a dusty road on tired feet and to hang in the high cold air over ' +
    'the whole of it, both, together, forever. The doorway would not stay open. Doorways like this ' +
    'open once. The god could step through and pour itself partway into the vessel — make of this one ' +
    'mortal a true aspect, a fragment of heaven wearing a name — or it could let the doorway close and ' +
    'leave the faithful one whole, finite, and entirely their own.',
  successAfterimage: 'The god stood at the threshold of a worn soul and weighed apotheosis.',
  failureAfterimage: 'The god reached for the threshold but could not hold it long enough to choose.',
};

/**
 * Step 1 — Ascend variant. The god pours partway into the vessel. Difficulty 0:
 * apotheosis is divine fiat, not a contest. The grant fires in aftermath.
 */
const step1Ascend: ActionStep = {
  reach: 'star',
  duration: { min: 3, max: 4 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god leaned through the doorway. There was no thunder. Apotheosis is not an explosion; it is a ' +
    'filling, the way a dry riverbed fills when the rains finally come — first a darkening of the dust, ' +
    'then a thread of water, then the whole channel running with something that was always meant to be ' +
    'there and had only been waiting. The mortal did not cry out. They went still in the particular way ' +
    'of a held breath that does not need to end, and when they moved again they moved like someone who ' +
    'has remembered a language they were never taught. The god did not take them; gods do not take. The ' +
    'god *joined* — kept a portion of itself here now, in this walking, breathing, finite frame, knowing ' +
    'that no frame holds the divine without strain, that to be filled is also to be stretched, and that ' +
    'the vessel had said yes to both the glory and the cost with the same quiet certainty that had carried ' +
    'it this far. An aspect of the god now walks the world on mortal feet. The world has one more place ' +
    'where heaven leaks in.',
  successAfterimage: 'The vessel opened. An aspect of the god walks the world.',
  failureAfterimage: 'The pouring faltered; the vessel held only the ordinary measure of devotion.',
};

/**
 * Step 1 — Withhold variant. The god lets the doorway close. Difficulty 0.
 */
const step1Withhold: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god looked through the open doorway at everything the mortal could become, and then, gently, ' +
    'let it close. Not from doubt of the vessel — the soul was ready, the devotion was true — but ' +
    'because there is a mercy in finitude that even gods can honor. The mortal would live and die as a ' +
    'mortal, would carry their faith to the grave as a private and human thing, would never feel the cold ' +
    'high air or the strain of holding more than a single life can hold. The doorway thinned, and faded, ' +
    'and was an ordinary devotion again. The faithful one felt, for a moment, an ache they could not name ' +
    '— a door they had not known was open, closing — and then it passed, and they were only themselves, ' +
    'which is its own kind of grace. The thread between them and the god remained, taut and warm and whole. ' +
    'There would be other thresholds, perhaps. The god could choose again, when the time had worn around.',
  successAfterimage: 'The god let the doorway close. The faithful one remains wholly mortal.',
  failureAfterimage: 'The god withdrew, and the moment passed unremarked.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    raise_to_apotheosis: step1Ascend,
    let_them_remain: step1Withhold,
  },
  fallback: { ...step1Withhold },
};

// ─── Aftermath ─────────────────────────────────────────────────────────

const ASCEND_AFTERMATH = {
  overview:
    'By the next dawn those who knew the mortal best could not say what had changed, only that something ' +
    'had. They stood the same and spoke the same and answered to the same name, and yet to be near them ' +
    'was to feel the air go close and strange, as before a storm that never quite breaks. The faithful ' +
    'called it blessing. The fearful called it wrongness. Both were right. An aspect of the god moves ' +
    'among mortals now, and the world will bend a little, here and there, around the place where heaven ' +
    'has learned to walk.',
  changes: [
    {
      id: 'apotheosis_aspect_attained',
      kind: 'future_hook' as const,
      title: 'An Aspect Walks',
      detail:
        'The mortal has become a partial aspect of the god — beyond the five tiers of influence, a ' +
        'permanent bond that channels a trickle of essence and bends curated events toward them. It ' +
        'cannot be undone, and will outlast the body that holds it.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt: 'The doorway stands open. Pour yourself through.',
  reactions: [
    {
      id: 'apotheosis_consummate',
      label: 'Make them an aspect of yourself.',
      intent:
        'The god commits the apotheosis — a portion of the divine takes up residence in a mortal frame, ' +
        'permanent and irreversible. The vessel becomes a true aspect: a living conduit while it breathes, ' +
        'and a lasting myth when it does not.',
      effects: [
        {
          kind: 'grant_aspect' as const,
          reason: 'apotheosis',
        },
      ],
      closeAfterSelection: true,
    },
  ],
} as const;

const WITHHOLD_AFTERMATH = {
  overview:
    'The mortal woke the next morning to an ordinary sky and an ordinary body, and went about the work ' +
    'of being alive with no memory of the threshold and only the faintest residue of an ache, like the ' +
    'ghost of a dream about flying. The thread to the god held. The devotion held. Nothing had been ' +
    'taken and nothing had been given, and the faithful one remained, as they had always been, wholly ' +
    'and finitely their own.',
  changes: [
    {
      id: 'apotheosis_declined',
      kind: 'future_hook' as const,
      title: 'The Doorway Closed',
      detail:
        'The god let the apotheosis pass. The mortal remains at the height of mortal devotion (tier 4). ' +
        'The offer may come again, once the moment has worn back around.',
      polarity: 'mixed' as const,
    },
  ],
} as const;

// ─── Template ──────────────────────────────────────────────────────────

export const APOTHEOSIS_ASCENSION_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: APOTHEOSIS_ENCOUNTER_TEMPLATE_ID,
  rarityTier: 4,
  intrinsicTier: 'story_beat',
  name: 'The Apotheosis',
  reach: 'star',
  crudType: 'update',
  scale: 'local',

  steps: [step0TheThreshold, step1Branch],

  apCost: 1,

  actorAffinities: ['individual'],
  motivations: ['sacrifice_survival', 'tradition_change'],

  narrativeTemplates: {
    initiation:
      'A mortal worn thin by devotion stands at a doorway only the god can see — the threshold of ' +
      'apotheosis. The god must decide whether to pour itself partway through, or to let the faithful ' +
      'one remain wholly mortal.',
    success:
      'The god acts at the threshold — raising the mortal into a partial aspect of itself, or letting ' +
      'the doorway close — and the world is changed, quietly, by the choice.',
    failure:
      'The threshold thins before the god can hold it, and the moment passes; the faithful one remains ' +
      'as they were, and the doorway will not open again soon.',
  },

  illustrationUrl: '/concept-art/encounters/placeholder.jpg',

  authoredChoices: {
    0: [
      {
        id: 'raise_to_apotheosis',
        label: 'Raise them to apotheosis.',
        intent:
          'Pour a portion of yourself through the worn doorway of their devotion and make of this mortal ' +
          'a true aspect — a fragment of heaven wearing a name. It cannot be undone. No frame holds the ' +
          'divine without strain, and not every vessel that says yes survives being filled — but this one ' +
          'is ready, and the god wills it. A living conduit while they breathe; a lasting myth when they ' +
          'do not.',
        targetLabel: 'The faithful one',
        interventionType: 'coercive',
      },
      {
        id: 'let_them_remain',
        label: 'Let them remain mortal.',
        intent:
          'Honor the mercy of finitude. Let the doorway close and leave the faithful one whole, human, ' +
          'and entirely their own — their faith a private thing carried to an ordinary grave. The thread ' +
          'remains; the offer may come again when the moment has worn back around.',
        targetLabel: 'The faithful one',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      raise_to_apotheosis: ASCEND_AFTERMATH,
      let_them_remain: WITHHOLD_AFTERMATH,
    },
    fallback: { ...WITHHOLD_AFTERMATH },
  },

  description:
    'The capstone covenant of divine influence: a mortal worn thin by devotion can be raised into a ' +
    'partial aspect of the god — a permanent apex beyond the five Influence tiers.',
});
