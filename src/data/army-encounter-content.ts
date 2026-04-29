/**
 * Army Encounter Content — migrated to UnifiedActionTemplate (THR-104).
 *
 * Six templates covering the army lifecycle:
 *
 *   Lifecycle (programmatically spawned, not pool-drawn):
 *     - mc.army.raise              Raise an Army (Iron muster + Gold pay)
 *     - army.aftermath.refugees    Refugees at the Gates
 *
 *   Threshold encounters (spawned when Quintessence degrades past defined
 *   percentages — see QUINTESSENCE_THRESHOLDS in src/engine/armyAttrition.ts):
 *     - army.threshold.supply_crisis    (strained, ≤70% Q)
 *     - army.threshold.desertion        (weakened, ≤50% Q)
 *     - army.threshold.mutiny           (critical, ≤30% Q)
 *     - army.threshold.disbandment      (collapse, ≤10% Q)
 *
 * Each template carries Threadbare-aesthetic prose (sergeants and lieutenants
 * speak, the captain is offstage, the romance is undercut by mud and rations)
 * and authored aftermath: reputation tallies for command performance, hidden
 * marks for witnessed cowardice or heroism, encounter seeds for cascading
 * consequences (a deserted army leaves grudges; a mutiny breeds future
 * faction fragmentation), and intelligence grants for what the commander
 * learned about their own ranks.
 *
 * Programmatic-spawn signal: `locationSubtypes: []` is preserved on the lifecycle
 * and threshold templates. They are not selected from the location pool; they
 * fire by lifecycle trigger (army-raise initiative, Quintessence threshold
 * crossings, refugee aftermath of major destruction).
 *
 * NFP #1: All difficulty values are named constants.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Difficulty Constants ────────────────────────────────────────────────

const ARMY_RAISE_IRON_DIFFICULTY = 0.40;     // Muster test (Iron Tier 4+ gate)
const ARMY_RAISE_GOLD_DIFFICULTY = 0.45;     // Pay test (Gold Tier 3+ gate)

const THRESHOLD_BASE_DIFFICULTY = 0.35;
const THRESHOLD_STEP = 0.10;

const SUPPLY_CRISIS_ASSESS = THRESHOLD_BASE_DIFFICULTY;                   // 0.35
const SUPPLY_CRISIS_RESUPPLY = THRESHOLD_BASE_DIFFICULTY + THRESHOLD_STEP; // 0.45

const DESERTION_RALLY = THRESHOLD_BASE_DIFFICULTY + THRESHOLD_STEP;       // 0.45
const DESERTION_DISCIPLINE = THRESHOLD_BASE_DIFFICULTY;                   // 0.35

const MUTINY_FACE = THRESHOLD_BASE_DIFFICULTY + 2 * THRESHOLD_STEP;       // 0.55
const MUTINY_RESOLVE = THRESHOLD_BASE_DIFFICULTY + 2 * THRESHOLD_STEP;    // 0.55

/** Auto-fail — disbandment is a narrative beat, not a test. */
const DISBANDMENT_DIFFICULTY = 1.00;

const REFUGEE_HEART_DIFFICULTY = 0.35;
const REFUGEE_GOLD_DIFFICULTY = 0.40;

// ─── Army Encounter Metadata ─────────────────────────────────────────────

/**
 * Lightweight metadata for army encounter templates.
 * Describes the lifecycle event category and eligibility gate.
 *
 * Retained for any caller that wants to enumerate the army-encounter ID set
 * (e.g. lifecycle-trigger code looking up templates by category). The runtime
 * registration into UNIFIED_ACTION_TEMPLATES happens via direct spread of
 * ARMY_ENCOUNTER_TEMPLATES, not via this map.
 */
export interface ArmyEncounterMeta {
  /** Lifecycle category: 'raise' | 'threshold' | 'aftermath' */
  category: 'raise' | 'threshold' | 'aftermath';
  /** Minimum Iron capability tier required (0 = no gate) */
  minIronTier: number;
  /** Minimum Gold capability tier required (0 = no gate) */
  minGoldTier: number;
}

export const ARMY_ENCOUNTER_META: ReadonlyMap<string, ArmyEncounterMeta> = new Map([
  ['mc.army.raise',                     { category: 'raise',     minIronTier: 4, minGoldTier: 3 }],
  ['army.threshold.supply_crisis',      { category: 'threshold', minIronTier: 0, minGoldTier: 0 }],
  ['army.threshold.desertion',          { category: 'threshold', minIronTier: 0, minGoldTier: 0 }],
  ['army.threshold.mutiny',             { category: 'threshold', minIronTier: 0, minGoldTier: 0 }],
  ['army.threshold.disbandment',        { category: 'threshold', minIronTier: 0, minGoldTier: 0 }],
  ['army.aftermath.refugees',           { category: 'aftermath', minIronTier: 0, minGoldTier: 0 }],
]);

// ─── mc.army.raise — Raise an Army ───────────────────────────────────────

/**
 * Spawned programmatically when a faction's ambition requires military force
 * and Iron/Gold tier eligibility checks pass. Empty `locationSubtypes` is the
 * load-bearing signal that this template is spawned, not selected.
 */
export const ARMY_RAISE_TEMPLATE: UnifiedActionTemplate = {
  id: 'mc.army.raise',
  name: 'Raise an Army',
  rarityTier: 3,
  intrinsicTier: 'story_beat',
  reach: 'iron',
  crudType: 'create',
  scale: 'local',
  locationSubtypes: [], // programmatically spawned
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
  steps: [
    {
      reach: 'iron',
      duration: { min: 2, max: 2 },
      difficulty: ARMY_RAISE_IRON_DIFFICULTY,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'The call goes out from {location} the way these things have always gone out — ' +
        'criers in the markets, banners on the gate, a sergeant at the muster ground ' +
        'with a roster the quartermaster pretends is current. ' +
        '{name} stands at the trestle table where men sign their names or make a mark, ' +
        'and watches the line. Some of the faces are veterans who remember the last campaign ' +
        'and have come back anyway. Some are boys who have never held a billhook ' +
        'and are pretending the weight of one is nothing. ' +
        '{?has_faction}The {faction} can call on its retinues, its sworn men, ' +
        'the second sons of the houses that owe service. ' +
        'But a list of names is not yet a column.{/has_faction}' +
        '{?no_faction}No banner above the table. No house behind {them}. ' +
        'Whoever signs is signing for {name}, not for an institution that will pay regardless.{/no_faction}',
      successAfterimage:
        'By dusk the muster ground is full enough. Hardened men and eager recruits, ' +
        'standing in the rough rows the sergeants beat into them, ready to be sorted into companies tomorrow.',
      failureAfterimage:
        'The line thins by midafternoon. Too few veterans, too few willing boys. ' +
        'The sergeants exchange the look that means: this will not be enough.',
    },
    {
      reach: 'gold',
      duration: { min: 1, max: 1 },
      difficulty: ARMY_RAISE_GOLD_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        tierPromotionEligible: true,
        reputationDelta: 0.10,
      },
      failureMetadata: { reputationDelta: -0.05 },
      narrativeTemplate:
        'Soldiers are paid, equipped, and provisioned, or they are not soldiers — ' +
        'they are angry men with farm tools and grievances. ' +
        '{name} sits at the long table in the keep\'s counting room while the quartermaster reads ' +
        'the lists: pikes, mail, dried meat, salt, two months\' wages, mules to carry the mail and meat. ' +
        'The sums are not abstract. Each one comes from a coffer that was already promised to something else. ' +
        '{?has_artifact}The {artifact:any} is not currency. {name} sets it aside before the conversation begins, ' +
        'because some debts must not be paid in the wrong things.{/has_artifact}',
      successAfterimage:
        'Coin flows. The bills are settled in the order the quartermaster prefers — supplies first, ' +
        'then mail, then wages — and by morning the army has shape. It marches at the third bell.',
      failureAfterimage:
        'The coffers do not stretch. Without pay or provisions, even willing men disperse by the second day. ' +
        'The army that was almost an army becomes a story about an army that was almost raised.',
    },
  ],
  narrativeTemplates: {
    initiation: '{name} undertakes to raise an army from {location} — muster the troops, then pay and provision them.',
    success: 'The army is raised. Banners up, columns ordered, the road south or east opening before them.',
    failure: 'The muster failed. {name} stands at the empty ground with the sergeants and the unpaid bills.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'An army raised at {location} carries the place that raised it — the names on the muster roll, ' +
        'the houses that paid, the sergeants who held the line on the parade ground. ' +
        'Whether the column marches or the muster collapses, those names will be remembered against {name}.',
      changes: [
        {
          id: 'army_raise_command',
          kind: 'reputation',
          title: 'Command Record',
          detail: 'The raising of an army is a public act. Successes and failures attach to the commander\'s name in the way these things always have.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god mark in this raising?',
      reactions: [
        {
          id: 'army_raise_command_reputation',
          label: 'A successful muster is a kind of legitimacy.',
          intent:
            'Raising an army is the oldest form of public credit. ' +
            'Men signed for {name}; the houses paid; the column marches under {their} command. ' +
            'That fact propagates through the chronicle of the region.',
          effects: [
            { kind: 'reputation_tally', key: 'army.command.muster_held', delta: 2 },
            {
              kind: 'recent_event',
              message: '{name} raises an army at {location}. The muster ground stands full.',
              significance: 0.7,
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'army_raise_intel',
          label: 'Note who answered the call. That list will matter again.',
          intent:
            'A muster roll is intelligence — who came, who didn\'t, which houses paid in coin and which paid in promises. ' +
            '{name} carries this knowledge forward, and the next campaign will be planned with it.',
          effects: [
            {
              kind: 'intelligence',
              category: 'military_position',
              label: 'Army composition raised at {location}',
              detail:
                'Detailed roster of veterans, recruits, and supply commitments from the muster. ' +
                'Names of houses whose contributions were generous and those whose were grudging.',
              reliability: 0.9,
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'army_raise_seeded_first_action',
          label: 'A column on the road draws attention.',
          intent:
            'An army does not move unobserved. Whoever it marches against is already learning of it, ' +
            'and so are the rivals who would prefer the column never reached its target.',
          effects: [
            {
              kind: 'encounter_seed',
              encounterFamily: 'investigation',
              delayTicks: 12,
              priority: 0.75,
              seedLabel: 'The army raised at {location} has been observed on the march — interested parties are calculating.',
            },
            { kind: 'reputation_tally', key: 'army.command.banner_up', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

// ─── army.threshold.supply_crisis — Supply Crisis ────────────────────────

/**
 * Fires when an army's Quintessence drops below the `strained` threshold (≤70%).
 * Empty locationSubtypes — spawned by lifecycle trigger, not location selection.
 */
export const ARMY_THRESHOLD_SUPPLY_CRISIS_TEMPLATE: UnifiedActionTemplate = {
  id: 'army.threshold.supply_crisis',
  name: 'Supply Crisis',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'gold',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: [], // programmatically spawned on threshold crossing
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: SUPPLY_CRISIS_ASSESS,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'The quartermaster finds {name} at the cookfire and says nothing for a long moment, ' +
        'which is how {name} knows the news is bad before it has been spoken. ' +
        'The salt pork is two days from finished. The hardtack is going green at the edges. ' +
        'The water barrels are still full but the men have started rationing themselves, ' +
        'which is the worst kind of discipline because it means they do not trust the column. ' +
        '{?has_ally}{ally:strongest} would call this the moment the army stops being an army ' +
        'and starts being a problem looking for a place to happen.{/has_ally}',
      successAfterimage:
        '{name} reads the column\'s situation correctly. There is a resupply route still open — ' +
        'a town two days east that has not been picked clean. The window is narrow but it exists.',
      failureAfterimage:
        'The numbers are worse than the quartermaster admitted. ' +
        'Half the men are already on short rations, and the column has lost two days of march speed.',
    },
    {
      reach: 'gold',
      duration: { min: 2, max: 2 },
      difficulty: SUPPLY_CRISIS_RESUPPLY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        rewardPool: {
          categoryWeights: { possession: 0.3, condition: 0.4, bestowed_power: 0.3 },
          tagFilters: ['#military', '#supply'],
        },
        tierPromotionEligible: false,
        reputationDelta: 0.06,
      },
      failureMetadata: { reputationDelta: -0.08 },
      narrativeTemplate:
        'The convoy is arranged the way these things are always arranged: too few wagons, ' +
        'a price that the merchants know is desperate, and a small escort because the rest are needed at the column. ' +
        '{name} negotiates with a town factor whose own granaries are not as full as he claims. ' +
        'Coin is counted. Sealed barrels are loaded. Mules are checked for soundness ' +
        'and at least one is sent back. The work is unromantic and it is the work that keeps men alive.',
      successAfterimage:
        'The convoy reaches the column three days later. The cooks weep — actual weeping — ' +
        'because there is bread again, and salt, and the men can stop hating their commander.',
      failureAfterimage:
        'The convoy does not arrive in time. The men tighten their belts another notch ' +
        'and the column begins to take on the gaunt, hard-eyed cast that precedes worse decisions.',
    },
  ],
  narrativeTemplates: {
    initiation: 'The army under {name}\'s command is running short. Assess the situation, then secure resupply.',
    success: 'The supply line holds. The column eats and the men remember what {name} did.',
    failure: 'The supply line breaks. The column hungers, and the men remember that too.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'A supply crisis is a measurement taken of the commander. ' +
        'Whether {name} held the column together by competent logistics or watched it weaken on short rations, ' +
        'the men have done the measuring and they will not forget the result.',
      changes: [
        {
          id: 'supply_crisis_morale',
          kind: 'reputation',
          title: 'Quartermaster Reputation',
          detail: 'How a commander handles a supply crisis is what soldiers tell each other in the years afterward.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god take from this crisis?',
      reactions: [
        {
          id: 'supply_crisis_held_logistics',
          label: 'The column ate. That is what command means.',
          intent:
            '{name} solved a logistics problem at the right speed. The men know it. ' +
            'In army life, food at the right time is the difference between a column and a mob.',
          effects: [
            { kind: 'reputation_tally', key: 'army.command.logistics_held', delta: 2 },
            {
              kind: 'intelligence',
              category: 'trade_route',
              label: 'Resupply route from {location}',
              detail:
                'A confirmed supply line from {location} capable of provisioning a column at short notice. ' +
                'The factor is greedy but reliable; the road can take wagons in any season except deep winter.',
              reliability: 0.85,
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'supply_crisis_morale_mark',
          label: 'Hungry men remember being hungry.',
          intent:
            'A column that goes short blames the commander. ' +
            'The grievance is filed away in the particular way soldiers file such things — ' +
            'and it will surface, sooner or later, in the next crisis.',
          effects: [
            {
              kind: 'hidden_mark',
              category: 'debt',
              severity: 0.4,
              label: 'Column blamed {name} for the supply shortfall — the grievance is filed.',
              revealFamilies: ['army.threshold', 'mutiny', 'desertion'],
            },
            {
              kind: 'encounter_seed',
              templateId: 'army.threshold.desertion',
              delayTicks: 8,
              priority: 0.8,
              seedLabel: 'The supply shortfall under {name}\'s command is bleeding into morale — desertions are coming.',
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

// ─── army.threshold.desertion — Desertion Wave ───────────────────────────

/**
 * Fires when Quintessence drops below the `weakened` threshold (≤50%).
 */
export const ARMY_THRESHOLD_DESERTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'army.threshold.desertion',
  name: 'Desertion Wave',
  rarityTier: 3,
  intrinsicTier: 'story_beat',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: [],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
  steps: [
    {
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: DESERTION_RALLY,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'They go in the third watch — quiet men, careful men, the kind who have made the calculation ' +
        'and decided their farms outweigh the oath they swore drunk in {location} weeks ago. ' +
        'The sergeants find the tent flaps left half-laced. The pickets find the gaps in the line. ' +
        'By dawn there are eleven empty bedrolls and a silence at breakfast that {name} can read as accusation. ' +
        '{?has_title}{name} {title} climbs onto an upturned cart and the men come, ' +
        'because that is what they do when the title is the right one.{/has_title}' +
        '{?no_title}{name} climbs onto an upturned cart and the men come slowly, ' +
        'with the wariness of soldiers who are deciding whether to be persuaded.{/no_title}',
      successAfterimage:
        'The speech finds the right register. Not eloquence — soldiers do not trust eloquence — ' +
        'but the specific kind of plain words that acknowledge the cost. The desertions slow.',
      failureAfterimage:
        'The speech falls flat. {name}\'s words are heard in silence and the silence does not warm. ' +
        'The next watch loses four more men.',
    },
    {
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: DESERTION_DISCIPLINE,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        tierPromotionEligible: false,
        reputationDelta: 0.05,
      },
      failureMetadata: { reputationDelta: -0.10 },
      narrativeTemplate:
        'Steel discipline is the other half of holding a column together. ' +
        'The provost-sergeants ride the line with a roll-call that is read three times daily, ' +
        'each name answered or marked. {name} signs off on the floggings the way commanders always sign off — ' +
        'reluctantly, on paper, with the men present so the example is not abstract. ' +
        'Two ringleaders are hung from the supply train\'s tongue at the next dawn. ' +
        'The column watches and does not look away. That is the point of the watching.',
      successAfterimage:
        'The discipline holds where the speech could not. The column tightens around what remains, ' +
        'grim but cohesive. No more empty bedrolls in the third watch.',
      failureAfterimage:
        'The hangings turn the column harder than {name} intended. ' +
        'Some men obey out of fear, some plot in pairs at the cookfire — ' +
        'and the pickets begin disappearing again within three nights.',
    },
  ],
  narrativeTemplates: {
    initiation: 'Soldiers are slipping away in the night. {name} must rally the remaining men, then enforce discipline.',
    success: 'The bleeding stops. What remains is grim but holds together, because {name} held it together.',
    failure: 'The bleeding does not stop. The column thins each night and the captains begin trading looks at the staff meetings.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'Desertion is a verdict the men pass on the campaign. ' +
        'Whether {name} stopped it with words and discipline or watched it bleed past the point of repair, ' +
        'the army is now a smaller, harder thing — and what it does next will be coloured by it.',
      changes: [
        {
          id: 'desertion_morale',
          kind: 'reputation',
          title: 'Cohesion Verdict',
          detail: 'A column that has lived through a desertion wave is not the column that started the campaign.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god mark in this thinning?',
      reactions: [
        {
          id: 'desertion_held_command',
          label: 'The column stayed. The credit is {name}\'s.',
          intent:
            'Holding men in the line through a desertion wave is the work command was made for. ' +
            'The remaining soldiers know who held them. The reputation is earned in the particular way only soldiers can grant it.',
          effects: [
            { kind: 'reputation_tally', key: 'army.command.cohesion_held', delta: 2 },
            {
              kind: 'recent_event',
              message: '{name}\'s column survived a desertion wave. The remaining men hold their oath.',
              significance: 0.6,
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'desertion_witnessed_hangings',
          label: 'The hangings were watched. They will not be forgotten.',
          intent:
            'Soldiers who watched their fellows hang on the supply train\'s tongue carry that image forward. ' +
            'It will surface in confessionals, in dreams, in the way they vote with their feet at the next campaign.',
          effects: [
            {
              kind: 'hidden_mark',
              category: 'betrayal',
              severity: 0.5,
              label: 'Witnessed {name}\'s field executions during the desertion wave — image filed against future loyalty.',
              revealFamilies: ['army.threshold', 'mutiny', 'civic_guard'],
            },
            {
              kind: 'encounter_seed',
              templateId: 'army.threshold.mutiny',
              delayTicks: 14,
              priority: 0.85,
              seedLabel: 'The hard discipline {name} used at the desertion wave is breeding a quieter, more dangerous resentment.',
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'desertion_failed_intel',
          label: 'Note where the deserters went. They will surface again.',
          intent:
            'Deserters do not vanish. They go home, or they form bands in the hill country, ' +
            'or they take service with whichever rival has coin. {name} now has a list of names ' +
            'and a rough sense of where each one was making for.',
          effects: [
            {
              kind: 'intelligence',
              category: 'agent_network',
              label: 'Roster of deserters from {name}\'s column',
              detail:
                'Names, home villages, and probable destinations of the men who slipped the column. ' +
                'Some will turn up in rival service; some will become bandit problems in the hill country.',
              reliability: 0.7,
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

// ─── army.threshold.mutiny — Mutiny ──────────────────────────────────────

/**
 * Fires when Quintessence drops below the `critical` threshold (≤30%).
 */
export const ARMY_THRESHOLD_MUTINY_TEMPLATE: UnifiedActionTemplate = {
  id: 'army.threshold.mutiny',
  name: 'Mutiny',
  rarityTier: 3,
  intrinsicTier: 'story_beat',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: [],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
  steps: [
    {
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: MUTINY_FACE,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'They are at the command tent before {name} has finished the morning despatches — ' +
        'a half-circle of armed men, none of them sergeants, all of them experienced enough to know ' +
        'this is the conversation that ends in either a new commander or a known grave. ' +
        'A man named Voern speaks for them. He has been in the column since {location}. ' +
        'He has been wounded twice. He says, in the careful voice men use when they have rehearsed it, ' +
        'that the campaign as it stands is over. ' +
        '{?has_ally}{ally:strongest}\'s name comes up — not as accusation, but as the alternative ' +
        '{name} could appoint and walk away cleanly. The mutineers have done their politics.{/has_ally}',
      successAfterimage:
        '{name} meets Voern\'s eyes and does not look away. The half-circle wavers. ' +
        'Leadership is, in this moment, the simple refusal to be deposed.',
      failureAfterimage:
        '{name}\'s words come out wrong. Voern\'s men shift their grips. ' +
        'The conversation has tipped past the point where words can pull it back.',
    },
    {
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: MUTINY_RESOLVE,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        tierPromotionEligible: false,
        reputationDelta: 0.10,
      },
      failureMetadata: { reputationDelta: -0.20 },
      narrativeTemplate:
        'Order is restored or it is not. There is no third path. ' +
        '{name} names the ringleaders by name — Voern, and Eldis, and the man called Brink ' +
        'who was always going to be in the half-circle when it came — and the loyalist sergeants ' +
        'do the work that follows naming. The column watches. The captains take their cues. ' +
        'Whatever is decided in the next quarter-hour will be the army\'s discipline ' +
        'for the rest of the campaign, however long that is.',
      successAfterimage:
        'The ringleaders are taken alive. The column re-forms by midday under {name}\'s command, ' +
        'reduced but no longer in revolt. The captains exhale. The grave-diggers do not.',
      failureAfterimage:
        '{name} is deposed at the command tent. ' +
        'Voern\'s men disarm {them} without unnecessary cruelty and the column splits — ' +
        'one half marching back the way it came, one half melting into the country.',
    },
  ],
  narrativeTemplates: {
    initiation: 'A ring of armed men blocks {name}\'s tent. The column hangs by a thread. {name} must face them, then resolve the crisis.',
    success: 'Order holds. The ringleaders are dealt with. The column is smaller and harder and still {name}\'s.',
    failure: 'Order breaks. {name} is deposed and the column fractures into the country.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'A mutiny is the army\'s final argument with its commander. ' +
        'However it ended, {name} now leads — or no longer leads — a force that has tested its own loyalty in the open. ' +
        'Whatever follows will be coloured by the answer.',
      changes: [
        {
          id: 'mutiny_outcome',
          kind: 'reputation',
          title: 'Mutiny Verdict',
          detail: 'The army has shown {name} who it is. {name} now decides what to do with that knowledge.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god take from the mutineers\' tribunal?',
      reactions: [
        {
          id: 'mutiny_held_command',
          label: 'The ringleaders are dead. The army is {name}\'s.',
          intent:
            'Putting down a mutiny is one of the oldest tests of command. ' +
            '{name} passed it. The story will travel — to the rival captains, to the houses that fielded the column, ' +
            'to the bards who write the campaign history later.',
          effects: [
            { kind: 'reputation_tally', key: 'army.command.mutiny_quelled', delta: 3 },
            {
              kind: 'recent_event',
              message: '{name} put down a mutiny in the field. The ringleaders are named in the despatches.',
              significance: 0.85,
            },
            {
              kind: 'hidden_mark',
              category: 'secret_knowledge',
              severity: 0.4,
              label: 'Witnessed {name} suppress a mutiny by force — the loyalist sergeants saw the order given.',
              revealFamilies: ['army.threshold', 'civic_guard', 'investigation'],
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'mutiny_intel',
          label: 'Note who held the line and who did not.',
          intent:
            'A mutiny separates the loyal from the wavering and the wavering from the lost. ' +
            '{name} now has a precise reading of {their} captains — who stood, who hesitated, who would have turned ' +
            'if Voern\'s men had pressed harder. That knowledge is worth a campaign\'s worth of staff meetings.',
          effects: [
            {
              kind: 'intelligence',
              category: 'agent_network',
              label: 'Loyalty roster from the mutiny at {location}',
              detail:
                'A precise reading of the column\'s officer corps under pressure: who stood, who hesitated, ' +
                'who would have flipped. Useful for the next campaign and the next mutiny.',
              reliability: 0.9,
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'mutiny_seeded_faction_split',
          label: 'A column that mutinied once will be told about, and the houses will hear.',
          intent:
            'News of a mutiny does not stay in the field. The houses that fielded the column will hear ' +
            'and so will their rivals. Some of those houses will rethink their alliance with the faction. ' +
            'A faction that loses houses loses its next muster.',
          effects: [
            {
              kind: 'encounter_seed',
              encounterFamily: 'investigation',
              delayTicks: 18,
              priority: 0.7,
              seedLabel: 'News of {name}\'s mutiny is spreading through the houses — alliances are being recalculated.',
            },
            { kind: 'reputation_tally', key: 'army.command.faction_strain', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

// ─── army.threshold.disbandment — Forced Disbandment ─────────────────────

/**
 * Fires when Quintessence collapses below the `collapse` threshold (≤10%).
 * One step. Auto-fail difficulty — the army is past the point where any test can save it.
 * The narrative beat is the disbandment itself.
 */
export const ARMY_THRESHOLD_DISBANDMENT_TEMPLATE: UnifiedActionTemplate = {
  id: 'army.threshold.disbandment',
  name: 'Forced Disbandment',
  rarityTier: 3,
  intrinsicTier: 'story_beat',
  reach: 'iron',
  crudType: 'delete',
  scale: 'local',
  locationSubtypes: [],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
  steps: [
    {
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: DISBANDMENT_DIFFICULTY, // auto-fail; this is a narrative beat
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        tierPromotionEligible: false,
        reputationDelta: -0.05, // even the best outcome is a quiet loss
      },
      failureMetadata: { reputationDelta: -0.20 },
      narrativeTemplate:
        'There is no speech. There is no rally. ' +
        'The supply train is empty, the men are starving, the captains have stopped attending the staff meetings. ' +
        'The army does what armies do when there is no longer an army — it dissolves at dawn ' +
        'in small groups, taking what they can carry, taking the campfire pots and the spare pikes ' +
        'and the salt from the cook\'s wagon. {name} stands at the cold fire pit ' +
        'and counts the shapes leaving against the trees. ' +
        'A sergeant named Halland salutes once, formally, and walks east with eight men under him. ' +
        'The standard is left propped against the supply wagon. No one wants the responsibility of carrying it home.',
      successAfterimage:
        'A core remains. Halland stays. Twenty men, a handful of officers, and the standard itself — ' +
        '{name} keeps a remnant that can be honourably discharged at {location}.',
      failureAfterimage:
        'The army is no more. The standard is left in the mud. ' +
        '{name} stands alone at a campsite that was, an hour ago, a force in the field.',
    },
  ],
  narrativeTemplates: {
    initiation: 'The army has crossed the line where any speech can hold it. {name} watches the column come apart at dawn.',
    success: 'A core stays. {name} discharges what remains with such honour as the campaign allows.',
    failure: 'The army is gone. The standard is left in the mud. {name} carries the campaign home alone.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The disbandment of an army is a public fact. The houses that paid for it will hear; ' +
        'the rivals who feared it will exhale; the men who walked away will tell the story their way at every tavern they pass. ' +
        '{name} now lives inside that telling.',
      changes: [
        {
          id: 'disbandment_record',
          kind: 'reputation',
          title: 'Disbandment Record',
          detail: 'A campaign that ended in dissolution attaches to a commander\'s name in a particular, durable way.',
          polarity: 'loss',
        },
      ],
      reactionPrompt: 'What does the god mark in the dissolving column?',
      reactions: [
        {
          id: 'disbandment_command_marked',
          label: 'A campaign that ended this way will be remembered.',
          intent:
            'There is no spinning a disbandment. The chronicle will record what happened, ' +
            'and the next muster {name} attempts will begin with that chapter already in the room.',
          effects: [
            { kind: 'reputation_tally', key: 'army.command.disbandment', delta: 2 },
            {
              kind: 'recent_event',
              message: '{name}\'s army disbands at {location}. The standard is left at the camp.',
              significance: 0.9,
            },
            {
              kind: 'hidden_mark',
              category: 'debt',
              severity: 0.6,
              label: 'Commanded an army to dissolution at {location} — the houses that paid will collect.',
              revealFamilies: ['army.threshold', 'investigation', 'merchant_consortium'],
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'disbandment_seed_refugees',
          label: 'A column that disbands becomes a refugee tide.',
          intent:
            'Soldiers walking home in groups of eight and twelve are not soldiers anymore — ' +
            'they are hungry men with weapons, looking for shelter and stew, ' +
            'and the settlements they pass will see them at the gates by the tenth day.',
          effects: [
            {
              kind: 'encounter_seed',
              templateId: 'army.aftermath.refugees',
              delayTicks: 10,
              priority: 0.95,
              seedLabel: 'The men of {name}\'s disbanded column are appearing at settlements as refugees and ex-soldiers.',
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'disbandment_intel_collapse',
          label: 'Note what failed. Future musters will begin from this lesson.',
          intent:
            '{name} now knows, in specific detail, what broke the column — ' +
            'the supply chain, the captains who flipped, the moment cohesion crossed the line of return. ' +
            'That knowledge is the only thing that is going home with {them}.',
          effects: [
            {
              kind: 'intelligence',
              category: 'military_position',
              label: 'Failure analysis of the disbanded column at {location}',
              detail:
                'Detailed account of which logistical and command failures preceded the disbandment. ' +
                'Worth more, in the long run, than the campaign itself was.',
              reliability: 0.95,
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

// ─── army.aftermath.refugees — Refugees at the Gates ─────────────────────

/**
 * Spawned at neighbouring settlements after major or total destruction
 * (army disbandment, settlement razing, etc.). Empty locationSubtypes — fired
 * by aftermath trigger, not location selection.
 */
export const REFUGEE_AFTERMATH_TEMPLATE: UnifiedActionTemplate = {
  id: 'army.aftermath.refugees',
  name: 'Refugees at the Gates',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'heart',
  crudType: 'update',
  scale: 'local',
  locationSubtypes: [], // programmatically spawned after destruction events
  apCost: 1,
  actorAffinities: ['individual'],
  reputationPolarity: 'positive',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.discovery,
  steps: [
    {
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: REFUGEE_HEART_DIFFICULTY,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'They arrive at {location} on the fourth day after the column came apart — ' +
        'a thin line of haggard people on the east road, some still carrying their packs, ' +
        'some carrying children, some carrying nothing because there was nothing to carry. ' +
        'The watch sergeant sees them at midmorning and sends for {name}, ' +
        'because the watch knows this is not a decision the gate can make. ' +
        '{?has_faction}The {faction} has standing orders about refugees from broken columns. ' +
        'The orders are pragmatic and they are not generous.{/has_faction}' +
        '{?no_faction}There are no standing orders. ' +
        '{name} stands at the parapet and decides what {they} are willing to be the kind of person who decides.{/no_faction}',
      successAfterimage:
        'The gates open. The watch counts heads — sixty-three, of whom eleven are children — ' +
        'and the sergeants begin the unromantic work of finding floor-space and bowls of stew.',
      failureAfterimage:
        'The gates stay shut. The refugees do not press; they camp in the long grass beyond bowshot ' +
        'and the watch sees their fires after sunset. The decision will not stay made.',
    },
    {
      reach: 'gold',
      duration: { min: 2, max: 2 },
      difficulty: REFUGEE_GOLD_DIFFICULTY,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        rewardPool: {
          categoryWeights: { possession: 0.2, condition: 0.4, bestowed_power: 0.4 },
          tagFilters: ['#community', '#stewardship'],
        },
        tierPromotionEligible: false,
        reputationDelta: 0.10,
      },
      failureMetadata: { reputationDelta: -0.05 },
      narrativeTemplate:
        'Welcoming people through a gate is the easy part. ' +
        'Feeding sixty-three of them through a winter the granaries did not plan for is harder. ' +
        '{name} sits with the reeve and the senior factor and the watch captain and they do the arithmetic ' +
        'that produces either a settlement enlarged or a settlement strained past breaking. ' +
        'Stalls are reassigned in the longhouse. The granary lock is broken open early. ' +
        'A second well is dug in the eastern field because sixty-three more bodies cannot drink ' +
        'from the existing wells without trouble starting at them.',
      successAfterimage:
        'The arithmetic works, barely. The refugees settle into the eastern fields ' +
        'and within a season their hands are in the harvest. {location} is larger and tireder and intact.',
      failureAfterimage:
        'The granary thins. The wells run muddy. ' +
        'A fight at the longhouse leaves two dead and the watch in arrest of three — ' +
        'and the rest of the winter will be a slow argument between {location} and the people it tried to save.',
    },
  ],
  narrativeTemplates: {
    initiation: 'Refugees from a broken column arrive at {location}. {name} must decide whether to welcome them, then how to feed them.',
    success: 'The settlement absorbs the displaced. The work is unromantic and the gain is slow, but it holds.',
    failure: 'The gates closed, or the granaries failed. {location} carries the cost either way.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The arrival of refugees is a measurement {location} takes of itself, ' +
        'and the chronicle keeps the result. ' +
        'Whether the settlement opened or closed, fed or starved, the decision is now part of how the world reads {name}.',
      changes: [
        {
          id: 'refugee_record',
          kind: 'reputation',
          title: 'Refugee Response',
          detail: 'How a community handles displaced people is a moral verdict in a form everyone in the region can read.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'What does the god take from this welcome?',
      reactions: [
        {
          id: 'refugee_compassion_held',
          label: 'The settlement opened. That choice will travel.',
          intent:
            'Hospitality of this kind is not free, and the wider region knows it. ' +
            'The story will move through the chronicle with {name}\'s name attached, ' +
            'and the houses that hear it will form their own opinion.',
          effects: [
            { kind: 'reputation_tally', key: 'community.refugee_welcome', delta: 2 },
            {
              kind: 'recent_event',
              message: '{location} took in refugees from a broken column under {name}\'s direction. The story is travelling.',
              significance: 0.7,
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'refugee_intel_displaced',
          label: 'Note who came. The displaced carry stories worth hearing.',
          intent:
            'Refugees from a broken column carry intelligence that staff officers and merchants alike will pay for — ' +
            'who fielded the army, what supplies failed, what command decisions broke the cohesion. ' +
            '{name} now has access to that account.',
          effects: [
            {
              kind: 'intelligence',
              category: 'military_position',
              label: 'Refugee testimony at {location}',
              detail:
                'Detailed accounts from soldiers and camp followers of a broken column: ' +
                'commanders, supply failures, the moment morale collapsed. ' +
                'Useful for both staff officers and commercial actors.',
              reliability: 0.75,
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'refugee_strain_mark',
          label: 'A settlement that turned them away will be marked for it.',
          intent:
            'Closing the gates against displaced people is not a private decision — ' +
            'the refugees and the houses they reach next will both remember. ' +
            'Some kinds of failure are quietly catalogued by systems that pay attention to such things.',
          effects: [
            {
              kind: 'hidden_mark',
              category: 'betrayal',
              severity: 0.45,
              label: '{location} closed its gates to refugees from a broken column under {name}\'s authority.',
              revealFamilies: ['investigation', 'civic_guard', 'holy_order_dawn'],
            },
            {
              kind: 'encounter_seed',
              encounterFamily: 'investigation',
              delayTicks: 16,
              priority: 0.65,
              seedLabel: 'The refugees turned from {location}\'s gates have surfaced elsewhere — and they are telling the story.',
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

// ─── All Army Templates ─────────────────────────────────────────────────

export const ARMY_THRESHOLD_TEMPLATES: readonly UnifiedActionTemplate[] = [
  ARMY_THRESHOLD_SUPPLY_CRISIS_TEMPLATE,
  ARMY_THRESHOLD_DESERTION_TEMPLATE,
  ARMY_THRESHOLD_MUTINY_TEMPLATE,
  ARMY_THRESHOLD_DISBANDMENT_TEMPLATE,
];

export const ARMY_ENCOUNTER_TEMPLATES: readonly UnifiedActionTemplate[] = [
  ARMY_RAISE_TEMPLATE,
  ...ARMY_THRESHOLD_TEMPLATES,
  REFUGEE_AFTERMATH_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

export function getArmyEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ARMY_ENCOUNTER_TEMPLATES.find(t => t.id === id);
}
