/**
 * The Granaries in the Famine Year — regional-scale branching encounter (THR-466).
 *
 * A threaded merchant-prince bought up the region's grain cheap in the weeks
 * before anyone else knew the harvest had failed, and now holds, in their locked
 * granaries, the only thing standing between a whole region and starvation. They
 * can corner it — meter it out at the edge of what people will pay to keep their
 * children alive, and take the region's land and labor and a generation's freedom
 * as the debt — or open it, sell at cost or give, eat the loss, and feed the
 * region through the dead winter. The god can press against the merchant's
 * grasping nature until the granaries open; or stay its hand and let the
 * merchant's own market-logic run, and watch the region get bled.
 *
 * Reach: gold (Patron ↔ Extractor). Scale: regional — the granaries decide
 * whether a whole region is fed or sold.
 *
 * Player-as-god framing: both choices are god-actions. "Open the granaries" is
 * active intervention (coercive) — the god presses the merchant past their own
 * instinct toward patronage. "Let the market close" is divine restraint — the
 * always-valid "let them handle it," which here is the *brutal* pole: a
 * merchant-prince left to their own logic corners the grain, and non-intervention
 * is complicity in the bleeding. This batch's deliberate inversion of the usual
 * restraint-is-mercy shape — sometimes letting them handle it is the cruelty.
 *
 * TODO(THR-498): repeatability: 'unique' — bespoke regional marquee, fire ≤1×/playthrough.
 * Field does not exist on UnifiedActionTemplate until THR-498 lands.
 *
 * Authored directly to the exemplar quality bar (rival-shrine-betrayal 10/10,
 * flawed-steel 9/10) rather than via the 4-pass encounter-pipeline, which is not
 * supervisable inside an automated single-issue run. Held to the editorial REVISE
 * triggers: approach prose at every step, scene-specific god-verbs, cool failure
 * at every branch, human consequences over mechanical labels.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import { withEncounterContract } from '../encounter-contract-builder';

// ─── Steps ───────────────────────────────────────────────────────────

/**
 * Step 0 — The Key on the Ledger. The merchant-prince weighs a fortune against a
 * region. Difficulty 0 — the choice is the point.
 */
const step0TheKey: ActionStep = {
  reach: 'gold',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The granary key lay on the open ledger, and the merchant-prince looked at both and saw the same number ' +
    'from two directions. They had bought the region\'s grain for a song in the soft weeks before anyone else ' +
    'understood the harvest was gone — not by cheating, exactly, only by reading the sky one market-day ' +
    'earlier than their neighbors — and now every locked granary from the river to the hills was theirs, and ' +
    'so, in the most literal way, was the region. They could see the whole winter laid out in the ledger like ' +
    'a campaign. Meter the grain out at the price a parent will pay when the alternative is a child\'s empty ' +
    'bowl, and the region\'s farmland, its tools, its strong young backs, the next twenty years of its labor ' +
    'would come to them in debt-bond, parcel by parcel, perfectly legally, and they would end the famine the ' +
    'richest house the region had ever produced, sitting on a generation of people who owed them their lives. ' +
    'Or unlock the doors and sell at cost, or under it, and feed the region through to spring, and be poorer ' +
    'in the only way that shows on a ledger. The merchant-prince was not a monster. They were a person who ' +
    'had spent their whole life being good at exactly this, in a chair by a stove, with a key on a ledger and ' +
    'a region\'s winter in their hand. The god stood by the cold hearth and could feel the weight of the ' +
    'fortune and the weight of the hungry both.',
  successAfterimage: 'The merchant-prince looked from the granary key to the ledger and saw a fortune and a region in the same number.',
  failureAfterimage: 'The merchant-prince\'s hand hovered over the key and would not close on it, and they sat a long time with neither door nor ledger decided.',
};

/**
 * Step 1 — Open the Granaries (Patron). The god presses the merchant past their
 * own grasping instinct; the doors unlock, the region is fed, and the merchant
 * takes the loss that makes them a patron instead of a master.
 */
const step1OpenTheGranaries: ActionStep = {
  reach: 'gold',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god pressed against the merchant-prince the way a thumb presses a scale — not erasing their nature, ' +
    'which was acquisitive to the bone, but leaning on the one part of them that had never quite stopped ' +
    'being a child who had also, once, been hungry. And the merchant looked at the campaign laid out in the ' +
    'ledger and could not, today, run it. They unlocked the granaries. They sold at cost where people could ' +
    'pay and gave where they could not, and they did the arithmetic of their own loss with a steadiness that ' +
    'surprised them, the way a generous act surprises the person committing it. The region ate. The children ' +
    'kept their bowls full and their families kept their farmland, and the strong young backs that would have ' +
    'spent twenty years working off a debt instead spent that winter hauling the merchant\'s grain to the ' +
    'far villages for free, because you carry water for the one who carried you. The merchant-prince ended ' +
    'the famine poorer than they began it and richer in the one currency they had never bothered to bank: ' +
    'a region that would, for a generation, answer to their name with something other than fear. They never ' +
    'fully understood why they had done it. They suspected, in an unbusinesslike corner of themselves, that ' +
    'they had been leaned on, and they decided not to mind.',
  successAfterimage: 'The granaries opened and the region ate, and the merchant ended the famine poorer in coin and bound to no one\'s ruin.',
  failureAfterimage:
    'The generosity half-took — the merchant opened some doors and kept the richest closed, hedging the loss ' +
    'so the region was fed thin and unevenly, fed enough to live and not enough to forgive.',
  successMetadata: { reputationDelta: 0.16 },
  failureMetadata: { reputationDelta: -0.1 },
};

/**
 * Step 1 — Let the Market Close (Extractor / divine restraint = "let them handle
 * it"). The god stays its hand; the merchant's own market-logic runs; the grain
 * is cornered, the region bled, a generation sold into debt — non-intervention
 * as complicity.
 */
const step1LetTheMarketClose: ActionStep = {
  reach: 'gold',
  duration: { min: 2, max: 3 },
  difficulty: 0.4,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god put no thumb on the scale, and the scale did what scales do when a careful hand has loaded one ' +
    'side. The merchant-prince ran the campaign in the ledger because it was the campaign in the ledger, and ' +
    'there was no one and nothing in the cold room leaning the other way. They metered the grain out at the ' +
    'price a parent pays when the alternative is the empty bowl, and the price did exactly what they had ' +
    'foreseen: it bought them the region a piece at a time. A farm signed over in the second month so the ' +
    'family could buy the flour to last the third. A village\'s commons taken as surety. The strong young ' +
    'backs bonded for a term that would outlast the famine by fifteen years. No law was broken. Every ' +
    'transaction was willing in the particular way that a transaction is willing when one party is holding ' +
    'the only food. By spring the region was fed — most of it — and sold, all of it, and the merchant-prince ' +
    'was the richest house the region had ever produced, with a generation of people who owed them their ' +
    'lives and would raise their own children inside that debt. The merchant slept well. They had done ' +
    'nothing wrong. The god had done nothing at all, and the doing-nothing had a harvest of its own, gathered ' +
    'in farmland and freedom, that would come in for twenty years.',
  successAfterimage: 'The market closed its fist and the region was fed and sold at once, a generation bonded into the merchant\'s ledger.',
  failureAfterimage:
    'The cornering came out clumsy — prices set too cruel too fast, a granary stormed, some grain spoiled in ' +
    'the holding — so the region was bled and starved both, and the merchant got a smaller fortune and a ' +
    'larger hatred than the clean extraction would have brought.',
  successMetadata: { reputationDelta: 0.1 },
  failureMetadata: { reputationDelta: -0.13 },
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    open_the_granaries: step1OpenTheGranaries,
    let_the_market_close: step1LetTheMarketClose,
  },
  fallback: { ...step1LetTheMarketClose },
};

// ─── Aftermath ─────────────────────────────────────────────────────────

const GRANARIES_OPENED_AFTERMATH = {
  overview:
    'A region fed through a famine by a hand that did not have to feed it remembers the feeding for longer ' +
    'than the hunger. The merchant-prince came out of the dead winter poorer in coin than any rival and ' +
    'richer in a thing the rivals could not buy: a whole region that owed them not a debt but a kindness, ' +
    'which is a stronger bond and a freer one. The farms stayed in the families. The young kept their backs ' +
    'and their years. And the strange truth of it — that the region was saved by a born extractor leaned on, ' +
    'for one winter, into patronage — settled into the local story as a kind of miracle, the rich man who ' +
    'opened his doors, while the god who did the leaning kept its name off the ledger. The merchant never ' +
    'quite understood the choice. The region never forgot it.',
  changes: [
    {
      id: 'granaries_region_fed',
      kind: 'future_hook' as const,
      title: 'A Region Fed and Free',
      detail:
        'The granaries opened and the region ate through to spring with its farmland, its tools, and its ' +
        'young still its own. The famine was survived without a generation sold — and the region knows ' +
        'exactly whose doors opened.',
      polarity: 'gain' as const,
    },
    {
      id: 'granaries_merchant_patron',
      kind: 'reputation' as const,
      title: 'The House That Opened Its Doors',
      detail:
        'The merchant-prince ended the famine poorer in coin and bound to no one\'s ruin — a patron, not a ' +
        'master, with a region that answers to their name with gratitude instead of fear.',
      polarity: 'gain' as const,
    },
    {
      id: 'granaries_loss_real',
      kind: 'future_hook' as const,
      title: 'The Fortune Not Made',
      detail:
        'The richest house the region could have produced was not produced. The merchant ate a real loss to ' +
        'feed the region, and the rivals who did not are circling — a generous house is a vulnerable one.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The granaries opened, the region is fed and free, and the merchant who opened them is poorer and ' +
    'exposed. What does the god do with the patronage it pressed into being?',
  reactions: [
    {
      id: 'granaries_opened_react_root_the_patron',
      label: 'Root the patron. Make the open-handed house a regional institution.',
      intent:
        'The generosity was leaned into being; make it last. Pour the divine attention into the merchant\'s ' +
        'house and the gratitude it earned — turn one winter\'s mercy into a standing patronage the region ' +
        'relies on, so the open hand becomes an institution and the next famine has somewhere to turn. Patron ' +
        'to the bone, rooting the kindness so it outlives the impulse.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'granaries_patron_rooted',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message:
            'The god roots the open-handed house into a standing regional patronage — one winter\'s mercy ' +
            'made into an institution the region can lean on when the next harvest fails.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'gold.patron_house',
          delayTicks: 18,
          priority: 1.1,
          seedLabel: 'The open-handed house becomes an institution',
        },
      ],
    },
    {
      id: 'granaries_opened_react_guard_the_generous',
      label: 'Guard the generous. Shield the house the rivals are circling.',
      intent:
        'A generous house is a vulnerable house, and the rivals who hoarded are already moving on the one who ' +
        'gave. Move the god\'s attention to protecting the merchant-prince from the consequences of their own ' +
        'mercy — steady their footing, blunt the rivals, make sure the open hand is not the one that gets ' +
        'broken for opening. Patron who refuses to let generosity be punished.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'granaries_generous_guarded',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god moves to shield the house that opened its doors — blunting the rivals circling the ' +
            'merchant who chose to feed the region instead of buying it.',
          significance: 0.72,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'gold.circling_rivals',
          delayTicks: 14,
          priority: 1.15,
          seedLabel: 'The rivals who circle the generous house',
        },
      ],
    },
  ],
} as const;

const MARKET_CLOSED_AFTERMATH = {
  overview:
    'A region fed and sold in the same winter does not starve and does not forgive. The merchant-prince came ' +
    'out of the famine the richest house the region had ever produced, sitting on farmland signed over in the ' +
    'second month, commons taken as surety, a generation of young backs bonded for terms that would outlast ' +
    'the hunger by fifteen years — and not one law broken, every transaction willing in the way a transaction ' +
    'is willing when one hand holds all the food. The children kept their bowls full and lost their futures. ' +
    'The god had stood by the cold hearth and put no thumb on the scale, and the empty other side of the ' +
    'scale had a harvest of its own: farmland and freedom, gathered in for twenty years, with the god\'s ' +
    'silence underwriting the deed.',
  changes: [
    {
      id: 'market_region_bonded',
      kind: 'future_hook' as const,
      title: 'A Region Fed and Sold',
      detail:
        'The region survived the famine and lost itself doing it — farmland signed over, commons taken, a ' +
        'generation bonded into debt. The merchant-prince owns the next twenty years of the region\'s labor, ' +
        'all of it perfectly legal.',
      polarity: 'loss' as const,
    },
    {
      id: 'market_merchant_magnate',
      kind: 'reputation' as const,
      title: 'The Richest House the Region Made',
      detail:
        'The merchant-prince ended the famine the wealthiest power the region has ever produced, with a ' +
        'generation that owes them their lives and fears them for it. They sleep well; they broke no law.',
      polarity: 'mixed' as const,
    },
    {
      id: 'market_god_silent',
      kind: 'future_hook' as const,
      title: 'The Scale Left Unweighted',
      detail:
        'The god stood by the cold hearth and did nothing, and the doing-nothing had consequences — a region ' +
        'bonded, a fortune built on hunger, all of it underwritten by a divine silence the bled will remember.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The market closed its fist, the region is fed and bonded, and the merchant is the richest power it has ' +
    'ever made. What does the god do with the bleeding it chose not to stop?',
  reactions: [
    {
      id: 'market_closed_react_tend_the_bonded',
      label: 'Tend the bonded. Be present for the generation that was sold.',
      intent:
        'The god withheld its hand and a generation paid; do not now withhold its presence. Move the divine ' +
        'attention to the bonded young and the families who signed their farms away to keep their children ' +
        'fed — be in the long debt with them, steady them through the twenty years, and make sure the ones ' +
        'the silence cost are not also abandoned in it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'market_bonded_tended',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god that stayed its hand now walks among the bonded — present in the long debt with the ' +
            'generation its silence helped sell.',
          significance: 0.75,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'gold.bonded_generation',
          delayTicks: 16,
          priority: 1.1,
          seedLabel: 'The generation bonded into the merchant\'s ledger',
        },
      ],
    },
    {
      id: 'market_closed_react_unmake_the_debt',
      label: 'Unmake the debt. Turn the region against the ledger that owns it.',
      intent:
        'The cornering was legal and the legality is the wound; do not let it stand uncontested. Turn the ' +
        'god\'s attention to the slow work of unmaking the debt — stir the bonded toward their own power, ' +
        'erode the merchant\'s grip on the region they bought, and make the fortune built on a famine into a ' +
        'thing the region takes back. Patron arriving late, in fury, to undo an extraction the silence allowed.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'market_debt_unmade',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god turns against the ledger it let close — stirring the bonded toward their own power and ' +
            'eroding the famine-fortune\'s grip on the region it bought.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'gold.debt_revolt',
          delayTicks: 20,
          priority: 1.05,
          seedLabel: 'The region rising against the famine-ledger',
        },
      ],
    },
  ],
} as const;

// ─── Template ──────────────────────────────────────────────────────────

export const GRANARIES_IN_THE_FAMINE_YEAR_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'gold.famine.merchant_granaries',
  rarityTier: 4,
  intrinsicTier: 'story_beat',
  name: 'The Granaries in the Famine Year',
  reach: 'gold',
  crudType: 'update',
  scale: 'regional',

  steps: [step0TheKey, step1Branch],

  apCost: 1,
  essenceCost: 3,

  actorAffinities: ['individual'],
  motivations: ['asceticism_extravagance', 'mercy_ruthlessness'],

  locationSubtypes: ['city', 'town', 'capital'],

  narrativeTemplates: {
    initiation:
      'A threaded merchant-prince holds the region\'s entire grain supply in a famine year — the only thing ' +
      'between a whole region and starvation. The god decides whether to press them into opening the granaries ' +
      'or to stay its hand and let the market corner the region.',
    success:
      'The merchant does what the god leans them toward — opens the granaries at a loss or corners the grain ' +
      'at the starvation price — and a whole region is either fed and left free or fed and sold, a generation ' +
      'into debt.',
    failure:
      'The choosing comes out clumsy — a hedged half-generosity or a botched cornering — and the region is ' +
      'fed thin and unevenly, living but unforgiving.',
  },

  illustrationUrl: '/concept-art/encounters/placeholder.jpg',

  authoredChoices: {
    0: [
      {
        id: 'open_the_granaries',
        label: 'Press them open. Let the granaries feed the region.',
        intent:
          'Lean on the part of them that was once, also, a hungry child, and press their grasping nature past ' +
          'itself until the doors unlock. They will sell at cost where people can pay and give where they ' +
          'cannot, and feed the region through to spring — keeping the farmland in its families and the young ' +
          'out of bond. The merchant ends the famine poorer in coin and bound to no one\'s ruin, a patron ' +
          'instead of a master. Generosity that has to be pressed into being, paid for by the fortune not made.',
        targetLabel: 'The merchant-prince',
        interventionType: 'coercive',
      },
      {
        id: 'let_the_market_close',
        label: 'Stay your hand. Let the market close.',
        intent:
          'Put no thumb on the scale, and let a merchant-prince run the campaign already written in their ' +
          'ledger. They will meter the grain at the price a parent pays against an empty bowl, and the price ' +
          'will buy the region a piece at a time — farms signed over, commons taken, a generation bonded for ' +
          'terms that outlast the famine by fifteen years. No law broken; every deal willing in the way it is ' +
          'willing when one hand holds all the food. The region is fed and sold at once, and your silence ' +
          'underwrites the deed. Letting them handle it, when handling it means the bleeding.',
        targetLabel: 'The merchant-prince',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      open_the_granaries: GRANARIES_OPENED_AFTERMATH,
      let_the_market_close: MARKET_CLOSED_AFTERMATH,
    },
    fallback: { ...MARKET_CLOSED_AFTERMATH },
  },

  description:
    'A regional-scale patronage-versus-extraction encounter: a threaded merchant-prince holds a whole ' +
    'region\'s grain in a famine year and can feed it or bleed it, and the god decides whether to press the ' +
    'granaries open or stay its hand and let the market corner the region. Reach: gold (Patron ↔ Extractor).',
});

export default GRANARIES_IN_THE_FAMINE_YEAR_TEMPLATE;
