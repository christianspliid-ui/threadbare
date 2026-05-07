/**
 * Civic Guard Encounter Content — migrated to UnifiedActionTemplate (THR-92).
 *
 * Quest, social, join, and promotion templates for the Civic Guard.
 * All 15 legacy EncounterTemplate entries rewritten to UnifiedActionTemplate
 * format with Threadbare-aesthetic prose, enrichment placeholders, and
 * contextual aftermath (reputation flow for public trust, hidden marks for
 * corruption and compromise, encounter seeds for institutional consequences).
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { FactionEncounterMeta } from '../types/faction';
import { withEncounterContract } from './encounter-contract-builder';

// ─── Constants ───────────────────────────────────────────────────────────

const CG_DIFFICULTY_BASE = 25;
const CG_DIFFICULTY_STEP = 10;
const CG_SENIOR_BASE = 40;
const CG_ELITE_BASE = 55;
const CG_JOIN_DIFFICULTY = 20;
const CG_PROMOTION_DIFFICULTY = 35;

// ─── Faction Encounter Metadata Registry ─────────────────────────────────

export const CIVIC_GUARD_ENCOUNTER_META: ReadonlyMap<string, FactionEncounterMeta> = new Map([
  // Join & Promotion
  ['cg.join', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.0, questType: 'standard' }],
  ['cg.promotion', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.0, questType: 'standard' }],
  // Standard quests
  ['cg.quest.wall_patrol', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.04, questType: 'standard' }],
  ['cg.quest.gate_duty', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.04, questType: 'standard' }],
  ['cg.quest.break_up_brawl', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.04, questType: 'standard' }],
  ['cg.quest.escort_prisoner', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.05, questType: 'standard' }],
  ['cg.quest.investigate_disturbance', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.05, questType: 'standard' }],
  // Senior quests
  ['cg.senior.raid_hideout', { factionDefId: 'civic_guard', minRank: 'sergeant', reputationReward: 0.06, questType: 'senior' }],
  ['cg.senior.defend_gate', { factionDefId: 'civic_guard', minRank: 'sergeant', reputationReward: 0.06, questType: 'senior' }],
  ['cg.senior.command_watch', { factionDefId: 'civic_guard', minRank: 'sergeant', reputationReward: 0.06, questType: 'senior' }],
  // Elite quests
  ['cg.elite.siege_defense', { factionDefId: 'civic_guard', minRank: 'captain', reputationReward: 0.08, questType: 'elite' }],
  ['cg.elite.purge_corruption', { factionDefId: 'civic_guard', minRank: 'captain', reputationReward: 0.08, questType: 'elite' }],
  // Social encounters
  ['cg.social.training_yard', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.02, questType: 'standard' }],
  ['cg.social.barracks_meal', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.02, questType: 'standard' }],
  ['cg.social.citizen_petition', { factionDefId: 'civic_guard', minRank: 'recruit', reputationReward: 0.02, questType: 'standard' }],
]);

// ─── Templates ───────────────────────────────────────────────────────────

export const CIVIC_GUARD_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  // ── Standard Quests (Recruit+) ──────────────────────────────────

  withEncounterContract({
    id: 'cg.quest.wall_patrol',
    name: 'Wall Patrol',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: CG_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The wall section assigned to {name} runs from the east granary to the third watchtower — ' +
          'half a mile of dressed stone and older mortar, walked twice a shift by whoever the sergeant ' +
          'trusts with the dull work. At first bell the mist has not lifted. The city below sounds like ' +
          'itself, which means there are no particular alarms, which means nothing has happened yet. ' +
          '{name} begins at the granary end and set{s} a pace that will not look like hurrying to anyone ' +
          'watching from below. ' +
          '{?has_faction}The guard runs these sections because the wall is the promise the city makes ' +
          'to itself. {name} has heard the speech. {They} walk{s}.{/has_faction}' +
          '{?no_faction}No uniform yet to give the walk its authority. Just {their} presence on the ' +
          'stone and whatever {they} project{s} when {they} choose{s} to project something.{/no_faction}',
        successAfterimage:
          'A crumbling section near the second merlon — the kind of thing that announces itself ' +
          'to a careful eye. {name} marks it in the watch log before continuing.',
        failureAfterimage:
          'The wall looks as it looked yesterday. The sergeant will find what {name} missed, ' +
          'and the finding will be filed.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (CG_DIFFICULTY_BASE + CG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.04,
        },
        failureMetadata: {
          reputationDelta: -0.01,
        },
        narrativeTemplate:
          'Figures on the exterior face of the wall — three of them, moving with the quiet of people ' +
          'who have done this before. {name} calls the challenge. The sound carries in the dark. ' +
          '{?has_ally}{ally:strongest} is two sections over — close enough to hear the challenge, ' +
          'too far to close the distance quickly. Whatever happens next happens to {name} first.{/has_ally}' +
          '{?no_ally}No partner on this section. The challenge and what follows are {their} calculation alone.{/no_ally}',
        successAfterimage:
          'Intruders apprehended. Two of them stopped talking when they saw the uniform. ' +
          'The third kept asking about the grain stores.',
        failureAfterimage:
          'The last figure clears the parapet before {name} can close the distance. ' +
          'Three sets of boot prints in the lime dust, and no answers about the purpose of them.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} walks the wall section between the east granary and the third watchtower. ' +
        'The city watches the wall so that the wall can watch the city. ' +
        'Someone has to do the walking.',
      success:
        'The patrol finds something that was not supposed to be found. ' +
        '{name} files the report in full.',
      failure:
        'The wall holds its secrets. The sergeant will read the gaps in the patrol log ' +
        'and draw the obvious conclusion.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The wall patrol is complete. What was found — or not found — is now part of the watch record. ' +
          'The third intruder asked about the grain stores, which was not a random question.',
        changes: [
          {
            id: 'wall_patrol_standing',
            kind: 'reputation',
            title: 'Watch Standing',
            detail: 'A thorough patrol builds trust with the sergeant. A missed section does the opposite.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note from the wall?',
        reactions: [
          {
            id: 'wall_patrol_note_intruders',
            label: 'The intruders asked about the grain stores.',
            intent:
              'That question was not random — someone sent them to count something. ' +
              'The grain stores in {location} are a resource someone is measuring.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Intruders surveying grain stores at {location}',
                detail:
                  'Three-person team, deliberate entry, specific question about supply volume. ' +
                  'Commission unknown — purpose is assessment, not theft.',
                reliability: 0.6,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'wall_patrol_log_entry',
            label: 'File the report.',
            intent:
              'Clean work, documented. The watch record grows one entry more reliable.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.watch_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'cg.quest.gate_duty',
    name: 'Gate Duty',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: CG_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The gate is backed three carts deep when {name} arrives. {They} take{s} a position at ' +
          'the edge of the checkpoint and read{s} faces before {they} read{s} papers — the impatience ' +
          'that is ordinary, and the impatience that means something else. ' +
          '{?has_faction}The guard trains for this distinction. Most never stop needing the training.{/has_faction}' +
          '{?no_faction}Nothing in any manual covers the specific reading {name} is doing now — ' +
          'the manual is written by people who have never worked this gate.{/no_faction}',
        successAfterimage:
          '{name} feel{s} the wrongness in the papers before the whole line can name it.',
        failureAfterimage:
          '{their} eye skims the queue without mastering it. ' +
          'The crowd begins to write the scene for itself.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (CG_DIFFICULTY_BASE + CG_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.015 },
        failureMetadata: { reputationDelta: -0.015 },
        narrativeTemplate:
          'The seizure begins. The courier has not yet understood what {name}\'s hand on {their} arm ' +
          'means — that understanding comes in stages, and the first stage is denial. ' +
          'The whole line is watching to see whether this becomes law or theater. ' +
          '{name} know{s} which version the captain will want to read about in tomorrow\'s report.',
        successAfterimage:
          'The courier is stopped, and the line sees discipline before it sees spectacle.',
        failureAfterimage:
          'The stop turns ugly enough that the crowd will remember force before proof.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (CG_DIFFICULTY_BASE + CG_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#checkpoint'],
          },
        },
        failureMetadata: {
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#checkpoint'],
          },
        },
        narrativeTemplate:
          'The cart is stopped, but the story is still moving. {name} feel{s} the gate\'s next chapter ' +
          'forming in the attention of the line behind — merchants, pilgrims, and carters who will carry ' +
          'this morning\'s events outward and turn them into whatever version the district prefers. ' +
          '{?has_ally}There is a moment where {ally:strongest} catches {their} eye from across the gatehouse. ' +
          'An acknowledgment. It is enough.{/has_ally}' +
          '{?no_ally}The checkpoint settles around {name} alone. Whatever judgment comes will arrive ' +
          'without context.{/no_ally}',
        successAfterimage:
          'The checkpoint settles. Its memory now belongs partly to {them}.',
        failureAfterimage:
          'The gatehouse keeps standing, but the district leaves with a harsher story ' +
          'than the watch can contain.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} takes checkpoint duty at the gate of {location}. ' +
        'Every queue has a rhythm. The job is to find the moment when the rhythm breaks.',
      success:
        'The checkpoint held — and what it revealed becomes the morning\'s record.',
      failure:
        'The checkpoint held in stone, if not in reputation. ' +
        'The district will carry its own version of what happened here.',
    },
    supportBundle: [
      {
        kind: 'location',
        key: 'gatehouse',
        delivery: 'pre-seeded',
        persistence: 'must-persist',
        sublocationTypeId: 'sublocation-type.gatehouse',
        fallbackName: 'Gatehouse Checkpoint',
      },
      {
        kind: 'actor',
        key: 'gate_guard',
        delivery: 'pre-seeded',
        persistence: 'must-persist',
        reuseNpcRoles: ['guard'],
        supportRole: 'checkpoint_guard',
        spawnNpcRole: 'guard',
        spawnName: 'Gate Guard',
        preferredLocationKey: 'gatehouse',
        factionDefId: 'civic_guard',
      },
      {
        kind: 'actor',
        key: 'gate_captain',
        delivery: 'pre-seeded',
        persistence: 'must-persist',
        reuseNpcRoles: ['guard_captain'],
        supportRole: 'checkpoint_captain',
        spawnNpcRole: 'guard_captain',
        spawnName: 'Gate Captain',
        preferredLocationKey: 'gatehouse',
        factionDefId: 'civic_guard',
      },
      {
        kind: 'actor',
        key: 'suspect_courier',
        delivery: 'lazy-materialize-on-trigger',
        persistence: 'must-persist',
        supportRole: 'checkpoint_courier',
        spawnNpcRole: 'courier',
        spawnName: 'Harried Courier',
        preferredLocationKey: 'gatehouse',
      },
      {
        kind: 'actor',
        key: 'checkpoint_witness',
        delivery: 'lazy-materialize-on-trigger',
        persistence: 'must-persist',
        reuseNpcRoles: ['merchant', 'trader', 'lookout'],
        supportRole: 'checkpoint_witness',
        spawnNpcRole: 'merchant',
        spawnName: 'Shaken Witness',
        preferredLocationKey: 'gatehouse',
      },
    ],
    clearanceGates: [
      {
        id: 'checkpoint_clearance',
        subjectBindingKey: 'suspect_courier',
        authorityBindingKey: 'gate_captain',
        witnessBindingKeys: ['checkpoint_witness'],
        locationBindingKey: 'gatehouse',
        initialState: 'pending',
        signals: [
          { key: 'forged_papers', label: 'Forged Papers', visibility: 'hidden' },
          { key: 'hidden_cargo', label: 'Hidden Cargo', visibility: 'hidden' },
          { key: 'witness_pressure', label: 'Witness Pressure', visibility: 'known' },
        ],
        transitions: [
          {
            stepIndex: 0,
            outcomes: ['critical_success', 'success', 'success_at_cost'],
            revealSignals: ['forged_papers'],
            nextState: 'flagged',
            addFollowOnTags: ['#papers_flagged'],
          },
          {
            stepIndex: 1,
            outcomes: ['critical_success', 'success', 'success_at_cost'],
            revealSignals: ['hidden_cargo'],
            nextState: 'exposed',
            addFollowOnTags: ['#cargo_exposed'],
          },
          {
            stepIndex: 2,
            outcomes: ['critical_success', 'success', 'success_at_cost'],
            nextState: 'cleared',
            addFollowOnTags: ['#watch_credible', '#checkpoint_stable'],
          },
          {
            stepIndex: 2,
            outcomes: ['failure', 'critical_failure'],
            nextState: 'compromised',
            addFollowOnTags: ['#watch_doubted', '#checkpoint_unsettled'],
          },
        ],
        persistence: 'must-persist',
      },
    ],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The gate processed its queue, and most of the world moved through it. ' +
          'The courier\'s errand is interrupted, but the question of what they were carrying ' +
          'and who sent them remains open.',
        changes: [
          {
            id: 'gate_duty_reputation',
            kind: 'reputation',
            title: 'Checkpoint Performance',
            detail:
              'The gate is a public stage. What happened here will be talked about ' +
              'in ways the watch report will not fully capture.',
            polarity: 'mixed',
          },
          {
            id: 'gate_duty_courier_mystery',
            kind: 'future_hook',
            title: "Courier's Commission",
            detail:
              'Forged papers suggest deliberate purpose. ' +
              'Someone sent this courier and needs to know the result.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The courier stopped at this gate had a purpose. What thread does the god pull?',
        reactions: [
          {
            id: 'gate_duty_note_cargo',
            label: 'The cargo tells a story.',
            intent:
              'What was hidden behind the forged papers is in the watch\'s custody. ' +
              'Someone will come looking for it — and that someone is a thread worth following.',
            effects: [
              {
                kind: 'intelligence',
                category: 'political_secret',
                label: 'Intercepted courier cargo at {location} gate',
                detail:
                  'Forged transit papers suggest organized movement of contraband — ' +
                  'probable faction connection, destination unknown.',
                reliability: 0.75,
              },
              {
                kind: 'encounter_seed',
                templateId: 'cg.quest.investigate_disturbance',
                delayTicks: 10,
                seedLabel: 'Whoever sent the courier will send someone else',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'gate_duty_watch_standing',
            label: 'The gate held.',
            intent:
              'A checkpoint that functions is a checkpoint that builds trust — ' +
              'however the district tells the story afterward.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.checkpoint_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'cg.quest.break_up_brawl',
    name: 'Break Up a Brawl',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: CG_DIFFICULTY_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The fight reaches {name} as sound before it arrives as sight — the register of voices ' +
          'that have moved past argument into something more physical. A tavern brawl that has ' +
          'spilled onto the street means the establishment did not want the liability, which means ' +
          'the principals will not be cooperative. {name} arrives at the edge of the scene: three ' +
          'combatants, one bleeding moderately, two bystanders who are enjoying this more than they should. ' +
          '{?has_faction}The uniform registers before {name} speaks — that is the first tool ' +
          'the guard has, and the most reliable.{/has_faction}' +
          '{?no_faction}No uniform to do the work first. Just {their} presence and whatever {name} ' +
          'project{s} when {they} choose{s} to project something.{/no_faction}',
        successAfterimage:
          'Combatants separated with enough authority that no one needed to be hit. ' +
          'The bystanders are disappointed.',
        failureAfterimage:
          'A chair catches {their} shoulder at the wrong moment. ' +
          'The brawl earns itself another thirty seconds.',
      },
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (CG_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.04 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Two stories, neither of them true. {name} listen{s} to both in the way that is less about ' +
          'comprehension and more about noticing what each person avoids saying. ' +
          'The instigator has allies in the crowd — not involved, just watching, ' +
          'which is its own kind of involvement. ' +
          '{?has_ally}If {ally:strongest} were here, {they} could manage the crowd while {name} took ' +
          'the statements. Without that, the audience is a variable.{/has_ally}' +
          '{?no_ally}{name} work{s} the statements and the crowd simultaneously, ' +
          'which is one thing too many.{/no_ally}',
        successAfterimage:
          '{name} read{s} the truth in who looked away first. Fine levied. Order restored, if not justice.',
        failureAfterimage:
          'Both sides close ranks. The street knows who started it and is not saying.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} responds to a tavern brawl that has graduated to the public street. ' +
        'The law is simple. The enforcement is not.',
      success:
        'Separated, cited, ordered to move on. The street returns to its ordinary business.',
      failure:
        'The brawl writes its own ending. The watch report will mention mitigating circumstances.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The brawl is over. What it was about — the stated reason and the real one — ' +
          'are almost certainly different things. The instigator had organized witnesses.',
        changes: [
          {
            id: 'brawl_resolution',
            kind: 'reputation',
            title: 'Public Order',
            detail:
              'How the guard handled this will be the version the neighborhood remembers.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'Something about this brawl was not ordinary.',
        reactions: [
          {
            id: 'brawl_mark_witness',
            label: "The instigator's allies took note of {name}.",
            intent:
              'People were watching who had a reason to watch. ' +
              'The guard who settled this is now in someone\'s accounting.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.25,
                label: 'Guard identified by associates of a cited brawl instigator at {location}',
                revealFamilies: ['investigation', 'cg.senior', 'social'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'brawl_let_settle',
            label: 'Order restored. Move on.',
            intent: 'The street\'s ordinary arithmetic reasserts itself. The watch continues its route.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.watch_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'cg.quest.escort_prisoner',
    name: 'Escort Prisoner',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (CG_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The prisoner is calmer than {name} expected, which is the more concerning kind. ' +
          'The manacles go on without struggle — the calculation about what resisting would cost has ' +
          'already been done and found unprofitable. {name} reads this as arithmetic, not compliance. ' +
          'Somewhere in {location}, someone knows where this prisoner is being taken. ' +
          '{?has_ally}If {ally:strongest} takes the other side of the escort, the formation holds ' +
          'two bodies between any intervention and the prisoner.{/has_ally}' +
          '{?no_ally}{name} moves {their} charge alone. ' +
          'The math of that is what it is.{/no_ally}',
        successAfterimage:
          'Prisoner secured and moving. {name} keeps {their} pace steady — ' +
          'not slow enough to seem uncertain, not fast enough to seem afraid.',
        failureAfterimage:
          'The manacles are on, but the prisoner knows something {name} does not. ' +
          'The tension of it fills the walk before the first corner.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (CG_DIFFICULTY_BASE + CG_DIFFICULTY_STEP + 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The ambush comes at the second bridge — three figures, pre-positioned before {name} arrived. ' +
          'That means the escape route was planned before the arrest, which means someone ' +
          'with advance knowledge organized this. {name} has six seconds to make the situation ' +
          'better or worse. ' +
          '{?has_faction}Guard response to ambush is trained, not improvised. ' +
          'That is the advantage.{/has_faction}' +
          '{?no_faction}No partner, no backup call. Just movement and the understanding that ' +
          'hesitation is a choice with consequences.{/no_faction}',
        successAfterimage:
          'The three figures break and scatter. Prisoner delivered. ' +
          '{name} files a supplementary report on what the ambush implied.',
        failureAfterimage:
          'Chaos in the street, and the prisoner dissolves into it. ' +
          'Someone planned for this outcome better than the watch planned against it.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} escorts a convicted prisoner from the arrest site to the garrison lockup in {location}. ' +
        'The prisoner is calm. That is the part to watch.',
      success:
        'Delivered. The ambush failed. The question of who organized it ' +
        'belongs to someone else\'s investigation now.',
      failure:
        'The prisoner is free. Somewhere in {location}, plans are being adjusted.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The escort is complete, or it is not. Either way, the ambush existed — ' +
          'three people with advance information tried to prevent this prisoner ' +
          'from reaching custody. That level of organization means something.',
        changes: [
          {
            id: 'escort_ambush_intel',
            kind: 'future_hook',
            title: 'Organized Rescue Attempt',
            detail:
              'Three people, pre-positioned, implies a command structure and prior knowledge. ' +
              'The prisoner knows something worth that kind of protection.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The ambush was organized. What does the god make of that?',
        reactions: [
          {
            id: 'escort_file_intelligence',
            label: 'File the ambush details.',
            intent:
              'Position, timing, coordination — this was not improvised. ' +
              'That information belongs in the watch\'s record and deserves follow-up.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Organized rescue network active in {location}',
                detail:
                  'Three-person ambush, pre-positioned — implies command structure and advance warning ' +
                  'about arrest and transfer route.',
                reliability: 0.7,
              },
              { kind: 'reputation_tally', key: 'cg.watch_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'escort_complete',
            label: 'Duty done.',
            intent: 'The prisoner is in custody, or was not. Either way, the escort is over.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.watch_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'cg.quest.investigate_disturbance',
    name: 'Investigate Disturbance',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 3 },
        difficulty: (CG_DIFFICULTY_BASE + 5) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The lower ward at the second hour after dark. The reports said strange noises, ' +
          'which is the version citizens give when they do not want to say what they actually heard. ' +
          '{name} walks the indicated blocks with the attention that is not quite looking — ' +
          'eyes moving but not pointing, ears open without being visible about it. ' +
          '{?has_faction}Three households on this block filed watch complaints last season. ' +
          'The captain\'s notes say recurring, not escalating. ' +
          'That distinction matters now.{/has_faction}' +
          '{?no_faction}No watch history to lean on. Just the block and what ' +
          '{name} can read from it tonight.{/no_faction}',
        successAfterimage:
          'A cellar access behind the cooper\'s workshop — unlocked, recently used, ' +
          'not on any district map {name} has seen.',
        failureAfterimage:
          'The reports seem exaggerated from the outside. ' +
          'The inside of that assessment is less certain than the outside.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (CG_DIFFICULTY_BASE + CG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.40, bestowed_power: 0.20 },
          },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Whatever is below knows {name} is here — the stillness of something that heard {them} ' +
          'on the stairs is different from the stillness of an empty room. ' +
          '{name} has a decision to make about how much of this goes into the official report. ' +
          'Not everything the guard finds below the city was put there by criminals, ' +
          'and not everything should be escalated to people who respond with methods that ' +
          'make the problem worse. ' +
          '{?has_ally}{ally:strongest} would have an opinion about that. {they} always do{es}.{/has_ally}' +
          '{?no_ally}Alone, the decision belongs to {name} and will stay there.{/no_ally}',
        successAfterimage:
          'Neutralized. The ward sleeps easier for it. What exactly was cleared ' +
          'stays out of the written report — some findings benefit no one by becoming official record.',
        failureAfterimage:
          '{name} retreats to street level. The threat remains below. ' +
          'The question now is what to tell the captain and what to keep.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} investigates a disturbance in the lower ward of {location}. ' +
        'The report says strange noises. The lower ward always has a translation for that.',
      success:
        'The threat is cleared. The district does not know what from.',
      failure:
        'Something is below the ward. The watch knows it now and does not know what to do with that.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The disturbance has been investigated. What was found — or not found — ' +
          'is part of the watch\'s record now, at least in the version {name} decides to write.',
        changes: [
          {
            id: 'disturbance_finding',
            kind: 'future_hook',
            title: 'Underground Threat',
            detail:
              'What was in that cellar will be there whether it was cleared or not. ' +
              'Or something else will take its place.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What did {name} choose not to file?',
        reactions: [
          {
            id: 'disturbance_hidden_record',
            label: 'The official report leaves things out.',
            intent:
              'The guard knows something about what exists below the lower ward that ' +
              'is not going into any document that gets reviewed. ' +
              'That is a debt the district owes, quietly.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.4,
                label: '{name} withheld investigation findings from a lower-ward disturbance in {location}',
                revealFamilies: ['investigation', 'cg.elite', 'cg.senior'],
              },
              { kind: 'reputation_tally', key: 'cg.watch_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'disturbance_full_report',
            label: 'The report is complete and honest.',
            intent:
              'Everything found goes on the record. The captain can decide what it means.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.watch_work', delta: 2 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  // ── Senior Quests (Sergeant+) ─────────────────────────────────

  withEncounterContract({
    id: 'cg.senior.raid_hideout',
    name: 'Raid Criminal Hideout',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    description:
      'Intelligence on a smugglers\' den in {location} is three days old — ' +
      'enough time for the situation to have shifted. {name} must plan the entry, ' +
      'read the intelligence honestly, and decide how much trust to put in information ' +
      'that someone had a reason to provide.',
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 3 },
        difficulty: CG_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The informant\'s description is detailed and probably honest about everything except ' +
          'the one thing that will matter. That is how informants work — specific about what they saw, ' +
          'silent about what they were paid to omit. {name} maps the entry anyway: the side passage, ' +
          'the loading dock, the window on the third floor that the informant did not mention. ' +
          '{?has_faction}Three guards on the detail. The captain approved four. ' +
          'The missing guard\'s absence was explained by a sick report that arrived this morning, ' +
          'which {name} suspects was arranged.{/has_faction}' +
          '{?no_faction}The planning rests on {their} judgment alone. ' +
          'Fewer voices means fewer leaks, which is either wisdom or excuse.{/no_faction}',
        successAfterimage:
          'Routes mapped. The entry point is the loading dock — ' +
          'the one the informant did not mention, which makes it the one to trust.',
        failureAfterimage:
          'The layout is different than described. The informant left out the second floor, ' +
          'or never knew it existed.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (CG_SENIOR_BASE + CG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.06,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The door comes off its hinges at the first contact. After that it is noise and motion ' +
          'and the clarity that comes when there is no time left for doubt. ' +
          '{name} moves through the space with {their} detail behind {them}, checking corners ' +
          'the way training says to check them — which accounts for about seventy percent ' +
          'of what actually happens. The rest is response. ' +
          '{?has_ally}{ally:strongest}\'s voice from the back passage — good. ' +
          'The building is held from both ends.{/has_ally}' +
          '{?no_ally}Three bodies covering a space built for six. That is the arithmetic tonight.{/no_ally}',
        successAfterimage:
          'Contraband seized. Arrests made. Something on the shelves that was not on the informant\'s list — ' +
          'either they did not know, or they did not say.',
        failureAfterimage:
          'The den was empty in the relevant sense: evacuated within the last twelve hours, ' +
          'by the temperature of the ashes in the stove. Someone warned them.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} leads a raid on a suspected smugglers\' den in {location}. ' +
        'The intelligence is three days old and the success depends on whether that matters.',
      success:
        'Cleared. What was there is in the watch\'s custody — most of it.',
      failure:
        'They knew. The question is who told them, and when.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The hideout is cleared or it is not — either way, the informant\'s role in the outcome ' +
          'is worth considering. A warned target means the intelligence was compromised ' +
          'before it reached the raid.',
        changes: [
          {
            id: 'raid_informant',
            kind: 'future_hook',
            title: 'Informant Reliability',
            detail:
              'Someone provided the intelligence. Whether they were paid to tell the truth ' +
              'or to steer the watch is a question the raid answered, one way or another.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The raid is done. The question that remains is who knew it was coming.',
        reactions: [
          {
            id: 'raid_corruption_thread',
            label: 'Someone warned the den.',
            intent:
              'A twelve-hour evacuation means a warning that preceded the raid. ' +
              'That warning came from someone with access to the plan. ' +
              'The corruption is inside the watch or adjacent to it.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'betrayal',
                severity: 0.5,
                label: 'Raid intelligence was leaked — source inside watch command or adjacent faction at {location}',
                revealFamilies: ['cg.elite', 'investigation'],
              },
              {
                kind: 'encounter_seed',
                templateId: 'cg.elite.purge_corruption',
                delayTicks: 20,
                seedLabel: 'The leak has a name. Finding it takes time.',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'raid_complete',
            label: 'File the outcome.',
            intent:
              'Clean or compromised, the report goes up the chain. The watch did its work.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.senior_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'cg.senior.defend_gate',
    name: 'Defend the Gate',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    description:
      'A hostile force approaches the gate of {location}. The sentry\'s report was garbled ' +
      'by the distance it traveled and the fear it traveled through. {name} has minutes to ' +
      'assemble a defense from what is actually present — not what should be.',
    steps: [
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: CG_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          '{name} check{s} the roster for the third time because the first two times did not ' +
          'produce a different number. Seventeen guards where the gate defense protocol requires ' +
          'twenty-four. The gap is not in the duty report. Three of the missing are simply missing. ' +
          '{They} work{s} with what is present, assigning positions not by the manual but by ' +
          'who will hold and who will need to be positioned near someone who will. ' +
          '{?has_faction}A sergeant from the evening watch is still on site — technically off duty, ' +
          'technically about to become essential.{/has_faction}' +
          '{?no_faction}The organizing falls to {name} entirely. No delegation possible.{/no_faction}',
        successAfterimage:
          'Defenders in position. The gaps are covered by overlap rather than numbers. ' +
          'It works until the force arrives.',
        failureAfterimage:
          'Two positions are left without coverage. The incoming force will find them.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: (CG_SENIOR_BASE + CG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.06,
          rewardPool: {
            categoryWeights: { possession: 0.40, condition: 0.30, bestowed_power: 0.30 },
          },
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The assault is smaller than the intelligence suggested, which is either good news ' +
          'or a decoy for something worse happening at another entrance. {name} hold{s} the gate ' +
          'and process{es} this question simultaneously with the business of actually holding, ' +
          'which is the division of attention that command requires and never fully accommodates. ' +
          '{?has_ally}{ally:strongest} is on the left flank — {name} can feel the steadiness of ' +
          'that presence without looking.{/has_ally}' +
          '{?no_ally}The defense runs on {name}\'s presence. When {they} breathe{s}, others breathe. ' +
          'When {they} stop{s}, the line will too.{/no_ally}',
        successAfterimage:
          'The gate holds. The attackers break against seventeen people who understood ' +
          'what \'hold\' actually meant today.',
        failureAfterimage:
          '{name} gives the order to fall back to the inner ward before the order becomes obvious. ' +
          'The gate is lost. The city is not — yet.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} musters the gate defense of {location} against an approaching hostile force. ' +
        'The roster says seventeen. The protocol requires twenty-four.',
      success:
        'The gate held. The three missing guards will have a question to answer in the morning.',
      failure:
        'The inner ward holds instead. The gate is now a tactical problem ' +
        'for the people who should have been there.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The defense is resolved — but three guards were missing before the attack, not after. ' +
          'That is a fact worth sitting with longer than the debrief allows.',
        changes: [
          {
            id: 'defend_gate_dereliction',
            kind: 'future_hook',
            title: 'Missing Guardsmen',
            detail:
              'Three guards did not report during a gate attack. ' +
              'That could be coincidence, illness, or arrangement.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The gate held — but the three empty positions were not an accident.',
        reactions: [
          {
            id: 'defend_gate_investigate_absence',
            label: 'The missing guards are not explained by the duty log.',
            intent:
              'Three people absent during a pre-planned gate attack suggest advance knowledge. ' +
              'That is not dereliction — it may be something worse.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'betrayal',
                severity: 0.6,
                label: 'Three guards absent without explanation during a pre-planned gate attack at {location}',
                revealFamilies: ['cg.elite', 'investigation'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'defend_gate_commend',
            label: 'The gate held.',
            intent:
              'Whatever its cost, the defense succeeded. The watch held its post.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.senior_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'cg.senior.command_watch',
    name: 'Command the Night Watch',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: CG_SENIOR_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.01 },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'Twelve guards, six routes, eight hours, and the mathematics of coverage that ' +
          'always leave something uncovered. {name} work{s} through the assignments with ' +
          'the patience that is not optimism — coverage is a resource allocation problem ' +
          'with no clean solution, only better and worse trade-offs. ' +
          '{?has_faction}The watch sergeant has opinions about the south quarter that are ' +
          'partly experience and partly the fact that {their} brother runs a stall there.{/has_faction}' +
          '{?no_faction}The assignments rest on {name}\'s judgment alone, ' +
          'which is cleaner and lonelier.{/no_faction}',
        successAfterimage:
          'Full coverage of the district, achieved by overlap in the high-risk blocks ' +
          'and accepted gaps in the ones that have not had incidents.',
        failureAfterimage:
          'Two blind spots, one of them in the south quarter. ' +
          'The sergeant\'s brother\'s stall is in the south quarter.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (CG_SENIOR_BASE + CG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.06,
        },
        failureMetadata: { reputationDelta: -0.02 },
        narrativeTemplate:
          'The patrol signal comes from the south quarter at the second bell — ' +
          'too early to be a nuisance call, too organized to be random. ' +
          '{name} lead{s} the response with the understanding that the incident will be what it is, ' +
          'and the watch\'s job is to be present when it resolves. ' +
          '{?has_ally}{ally:strongest} takes the second approach while {name} takes the first. ' +
          'Two directions closed is better than one direction controlled.{/has_ally}' +
          '{?no_ally}{name} arrives first, which means alone for the minute it takes the patrol ' +
          'to catch up — which is the minute that usually determines the next hour.{/no_ally}',
        successAfterimage:
          'Incident contained before the district noticed. ' +
          '{name} does not include the south quarter detail in the morning report. ' +
          'Some things are absorbed into the watch\'s institutional memory without ' +
          'needing to become official record.',
        failureAfterimage:
          'Morning finds the south quarter with a broken window and a complaint filed ' +
          'against the watch for slow response.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} commands the night watch over {location}. ' +
        'Twelve guards. Six routes. Whatever happens in the next eight hours is {their} watch.',
      success:
        'The night passed. The district does not know what the watch absorbed.',
      failure:
        'Morning has questions the watch\'s report will need to answer.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The night watch is complete. What was contained, and what was left out of ' +
          'the written report, belongs to the specific accounting that night watch commanders ' +
          'develop over time.',
        changes: [
          {
            id: 'command_watch_standing',
            kind: 'reputation',
            title: 'Command Standing',
            detail:
              'How the night went is the measure of the commander. ' +
              'The written record may not capture all of it.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does not make it into the morning report?',
        reactions: [
          {
            id: 'command_watch_silent',
            label: 'The report is edited.',
            intent:
              'Some incident details benefit no one by being written down. ' +
              'The watch absorbs these things so the district does not have to.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.3,
                label: '{name} omitted incident details from the night watch report at {location}',
                revealFamilies: ['cg.elite', 'investigation'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'command_watch_clean',
            label: 'The report is complete.',
            intent:
              'Everything that happened is documented. Whatever comes of it ' +
              'is the captain\'s determination.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.senior_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  // ── Elite Quests (Captain+) ───────────────────────────────────

  withEncounterContract({
    id: 'cg.elite.siege_defense',
    name: 'Siege Defense',
    rarityTier: 4,
    intrinsicTier: 'story_beat',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    description:
      'Enemy forces have encircled {location}. {name} is the highest command presence ' +
      'on the walls. The city will survive or not based in part on decisions made in ' +
      'the next seventy-two hours, and the city knows {name} is there.',
    steps: [
      {
        reach: 'stone',
        duration: { min: 3, max: 3 },
        difficulty: CG_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} walk{s} the inner perimeter at dawn of the second day. ' +
          'The siege lines are visible from the walls — two miles of enemy camp ' +
          'wrapped around {location} like a deliberate thought. ' +
          'The first question is supply; the second is where the wall is weakest; ' +
          'the third is whether either answer changes if the siege runs past two weeks. ' +
          'All three are present in {their} mind simultaneously with the work of ' +
          'actually walking and actually looking. ' +
          '{?has_faction}The watch\'s senior officers are waiting for orders that need to be ' +
          'specific enough to be useful and wrong enough to be revisable.{/has_faction}' +
          '{?no_faction}The command structure defaults to {name} by circumstance rather than appointment. ' +
          'That makes the orders harder to question and harder to share the weight of.{/no_faction}',
        successAfterimage:
          'Walls reinforced in the three critical sections. Supply lines rerouted ' +
          'through the secondary channels. It will not be enough — ' +
          'but it will be enough for longer than doing nothing would have been.',
        failureAfterimage:
          'Two positions remain weak. The enemy\'s scouts will find them ' +
          'before the next supply window.',
      },
      {
        reach: 'eye',
        duration: { min: 2, max: 2 },
        difficulty: (CG_ELITE_BASE + CG_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'Three fronts, twelve captains, six hundred soldiers eating less than they would prefer ' +
          'and sleeping less than they need. {name} move{s} between the sections delivering not optimism ' +
          '— no one would believe optimism at this stage — but the calm of a command that understands ' +
          'the situation clearly and has plans for most of it. ' +
          '{?has_ally}The presence of {ally:strongest} at the south section means {name} can direct ' +
          'attention elsewhere — one person {they} trust{s} to not require {their} physical presence.{/has_ally}' +
          '{?no_ally}{name}\'s own presence has to be everywhere it matters. ' +
          'That is a finite resource being spent.{/no_ally}',
        successAfterimage:
          'Every section covered, at the cost of committing the reserve to the east wall. ' +
          'Morale holds — not through comfort but through the particular competence ' +
          'of leadership that is not pretending this is fine.',
        failureAfterimage:
          'The east section is stretched past its limit. By nightfall the cost of ' +
          'that decision is visible from the wall.',
      },
      {
        reach: 'iron',
        duration: { min: 3, max: 3 },
        difficulty: (CG_ELITE_BASE + CG_DIFFICULTY_STEP * 2) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.08,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'The sortie is {name}\'s call, made after exhausting every other option and finding ' +
          'all of them worse. A siege that does not break kills the city slowly. ' +
          'A sortie that fails kills the sortie. {name} has run the arithmetic. ' +
          '{They} brief{s} the captains at midnight — specific objectives, specific rally points, ' +
          'the explicit understanding that the sortie achieves its purpose or the survivors ' +
          'pull back to the secondary wall. No heroic exceptions. No improvised expansions of scope. ' +
          '{?has_ally}{ally:strongest} will take the right flank. The assignment is a statement of ' +
          'trust and a distribution of command weight.{/has_ally}' +
          '{?no_ally}The right flank goes to {name}\'s second choice, ' +
          'which is the limit of what is available.{/no_ally}',
        successAfterimage:
          'The siege breaks. The enemy\'s logistics do not survive the sortie\'s impact ' +
          'on their supply column. In the aftermath, {name} finds no triumph — just the ' +
          'particular exhaustion of problems that are now different problems, and the knowledge ' +
          'that what just happened will be written about by people who were not here.',
        failureAfterimage:
          '{name} gives the recall order before the losses compound. ' +
          'The city survives this engagement. The siege continues.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} commands the defense of besieged {location}. ' +
        'The siege lines are visible from the walls. ' +
        'The decisions made in the next seventy-two hours will be written about afterward ' +
        'by people who were not present for them.',
      success:
        'The siege breaks. The city stands. The cost of its standing ' +
        'is counted in the week that follows.',
      failure:
        'The city endures. The siege continues. ' +
        'The window for a decisive move has closed — until it opens again.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} commanded this city\'s defense, and that fact is now part of the city\'s ' +
          'history and {their} own — regardless of how the siege resolved.',
        changes: [
          {
            id: 'siege_reputation',
            kind: 'reputation',
            title: 'Siege Command',
            detail:
              'A city that survived remembers who was on its walls. ' +
              'So does a city that did not.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'The siege is over. What persists from it?',
        reactions: [
          {
            id: 'siege_recognition',
            label: 'The city remembers.',
            intent:
              'Command during siege is a defining act. The watch\'s institutional memory ' +
              'and the city\'s public memory both carry it forward.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.elite_command', delta: 3 },
              {
                kind: 'encounter_seed',
                templateId: 'cg.elite.purge_corruption',
                delayTicks: 30,
                seedLabel: 'Post-siege command reveals what was compromised under pressure',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'siege_quiet',
            label: 'The duty is done.',
            intent:
              'The city survived because someone held the walls. ' +
              'That fact requires no amplification.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.elite_command', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'cg.elite.purge_corruption',
    name: 'Purge Corruption',
    rarityTier: 3,
    intrinsicTier: 'shaping',
    reach: 'iron',
    crudType: 'delete',
    scale: 'local',
    locationSubtypes: ['city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    description:
      'The names on the list are names {name} knows. Three of them have eaten at the same table, ' +
      'complained about the same captain, done the same work — and one of them has been taking money ' +
      'to look the other way. The evidence requires assembling. The arrests require making.',
    steps: [
      {
        reach: 'eye',
        duration: { min: 3, max: 3 },
        difficulty: CG_ELITE_BASE / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The evidence trail is older than the corruption, which means it was always there ' +
          'and the watch chose not to look. {name} look{s} now. Pay records that do not match ' +
          'duties assigned. Arrest reports filed late — or not at all — for specific infractions ' +
          'in the south ward for two seasons. The testimony of three witnesses who spoke to someone ' +
          'they trusted in the watch, believing someone in the watch would care. ' +
          '{?has_faction}Three of the named officers are senior to {name}. ' +
          'That is a political fact as much as an organizational one.{/has_faction}' +
          '{?no_faction}No institutional backing to make this easier. ' +
          'Just the evidence and what it says.{/no_faction}',
        successAfterimage:
          'Evidence documented. Specific. Timestamped. Named. ' +
          'The truth is particular and ugly in the way that truth usually is ' +
          'when it concerns people who should have known better.',
        failureAfterimage:
          'The named officers caught the investigation\'s direction before it completed. ' +
          'Documents have moved. A witness has become unavailable.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: (CG_ELITE_BASE + CG_DIFFICULTY_STEP) / 100,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        successMetadata: { reputationDelta: 0.02 },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          '{name} makes the arrests personally. That decision was made before dawn ' +
          'for compound reasons: courtesy to people who wore the same uniform, ' +
          'acknowledgment of what it costs the guard to discipline its own, ' +
          'and the simpler reason that delegating the arrests of senior officers ' +
          'creates opportunity for warning and departure. ' +
          'The arrests happen in uniform, in daylight, in front of witnesses. ' +
          '{?has_ally}{ally:strongest} is present — not to assist, but to witness. ' +
          'What happens in this hour needs someone else\'s eyes on it.{/has_ally}' +
          '{?no_ally}No witness whose presence was arranged. Whatever happens ' +
          'is on {name}\'s account alone.{/no_ally}',
        successAfterimage:
          'The named officers are detained. The guard is smaller. ' +
          'The truth is on a table somewhere, and the institution will have to decide what it means.',
        failureAfterimage:
          'Two of the named officers were not where the investigation expected. ' +
          'Someone warned them with enough time.',
      },
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: (CG_ELITE_BASE + CG_DIFFICULTY_STEP) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          tierPromotionEligible: true,
          reputationDelta: 0.08,
          rewardPool: {
            categoryWeights: { possession: 0.20, condition: 0.40, bestowed_power: 0.40 },
          },
        },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'The public trial draws two crowds: people who came to see the guard fail, ' +
          'and people who came to see it hold. {name} present{s} the evidence in the register ' +
          'that institutional truth requires — specific, documented, stripped of the anger ' +
          'that would make it look personal rather than principled. ' +
          '{?has_faction}The senior captain watches from the back of the chamber. ' +
          '{their} expression is unreadable, which tells {name} everything.{/has_faction}' +
          '{?no_faction}The trial is {name}\'s presentation of evidence to a public audience ' +
          'with no institutional backing behind {their} credibility. ' +
          'Every word has to carry its own weight.{/no_faction}',
        successAfterimage:
          'Justice is seen to be done. Not forgiveness — the guard will be watched more carefully now, ' +
          'which is the correct outcome. Something that was broken has been handled in a way ' +
          'that does not require pretending it was not broken.',
        failureAfterimage:
          'Public cynicism deepens. The trial produces verdicts, but the district\'s ' +
          'experience of the guard will be shaped by what the trial failed to resolve.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} pursues corruption within the Civic Guard of {location}. ' +
        'The names on the list are names {they} know{s}.',
      success:
        'Justice is done. The guard is smaller, and cleaner. ' +
        'Neither of those facts is comfortable.',
      failure:
        'The corruption is documented but not resolved. ' +
        'The district will choose its own version of why.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The purge reached as far as it could. What was exposed is on the record; ' +
          'what was not found still exists somewhere in the institution.',
        changes: [
          {
            id: 'purge_corruption_aftermath',
            kind: 'future_hook',
            title: 'Residual Corruption',
            detail:
              'Not everyone on the list was caught. ' +
              'The ones who were not will adjust, not stop.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'The purge found what it found. What about what it did not find?',
        reactions: [
          {
            id: 'purge_seed_investigation',
            label: "The ones who escaped are not done.",
            intent:
              'Two names on the list were not where the investigation expected them. ' +
              'They are somewhere — adjusted, quiet, waiting for the attention to move. ' +
              'That is a thread with a future end.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'betrayal',
                severity: 0.7,
                label: 'Corrupt guard officers escaped arrest and remain active in {location}',
                revealFamilies: ['investigation', 'cg.elite'],
              },
              { kind: 'reputation_tally', key: 'cg.elite_command', delta: 2 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'purge_closed',
            label: 'The case is closed.',
            intent:
              'The watch did what it could. The rest belongs to time ' +
              'and whatever the escaped officers do with their borrowed clarity.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.elite_command', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Social Encounters ──────────────────────────────────────────────────

export const CIVIC_GUARD_SOCIAL_TEMPLATES: UnifiedActionTemplate[] = [
  withEncounterContract({
    id: 'cg.social.training_yard',
    name: 'Training Yard',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 1 },
        difficulty: CG_DIFFICULTY_BASE / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.01,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
          },
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The training yard at first bell, before the heat settles into the cobblestones ' +
          'and the drill sergeant has started to feel philosophical about whether any of this matters. ' +
          'Formation work: three rows, fifteen paces of advance, wheel on the command, hold. ' +
          '{name} has {their} own theory about the exercise\'s usefulness and keeps it to {them}self. ' +
          '{?has_faction}The sergeant watches the wheel. That is the part that reveals whether ' +
          'the training is there or just the memory of training.{/has_faction}' +
          '{?no_faction}{name} drills alongside guards with years more experience in this formation. ' +
          'The gap is legible. The gap is the lesson.{/no_faction}',
        successAfterimage:
          'The wheel is clean. The sergeant nods once — in training yard vocabulary, ' +
          'that is almost effusive.',
        failureAfterimage:
          'Sloppy footwork on the wheel. Extra drills are added to tomorrow\'s assignment. ' +
          'The sergeant does not explain why; the explanation is implicit.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} joins the morning drill in {location}\'s guard training yard. ' +
        'The training is the same as yesterday. That is the point.',
      success:
        'Clean formation. The sergeant\'s single nod is recorded in no document but exists nonetheless.',
      failure:
        'Extra drills tomorrow. The sergeant\'s silence about why is its own communication.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The drill is complete. The training yard processes guards through repetition ' +
          'until the repetition becomes reflex.',
        changes: [
          {
            id: 'training_standing',
            kind: 'reputation',
            title: 'Training Standing',
            detail: 'The drill sergeant sees everything. The performance this morning is part of a longer evaluation.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god take from the drill?',
        reactions: [
          {
            id: 'training_note_form',
            label: 'The muscle memory is real.',
            intent:
              'Repetition is the training. The god notes what the drill has made automatic.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.watch_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'cg.social.barracks_meal',
    name: 'Barracks Meal',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (CG_DIFFICULTY_BASE - 10) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: { categoryWeights: { possession: 1.0 } },
        },
        failureMetadata: { reputationDelta: -0.005 },
        narrativeTemplate:
          'The mess hall after the evening watch change: institutional food, institutional quiet, ' +
          'and the exhaustion of people who have been performing competence for eight hours ' +
          'and can briefly stop. {name} sit{s} with a plate at whatever end of a table has space, ' +
          'which is a social calculation that matters in the barracks more than the manuals suggest. ' +
          '{?has_faction}The guard has its internal geography — who eats with whom is a record of ' +
          'alliances, resentments, and probationary acceptances that no organizational chart reflects.{/has_faction}' +
          '{?no_faction}The geography of the table is legible but not yet fully mapped for {name}. ' +
          'The meal is reconnaissance as much as nourishment.{/no_faction}',
        successAfterimage:
          'A conversation that starts about nothing and becomes something — the kind ' +
          'that does not happen on duty, which is part of why it happens here. ' +
          '{name} learns something about one of the guards that {they} could not have ' +
          'learned any other way.',
        failureAfterimage:
          '{name} eats alone at the far end of the table. ' +
          'The others have their circles, and the meal is too short to change that.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} takes a meal in the barracks mess of {location}. ' +
        'The food is institutional. The company is what changes.',
      success:
        'Something was learned over food that could not be learned on duty. ' +
        'The barracks geography shifted slightly.',
      failure:
        'Ate alone. The circle did not open. Tomorrow is another chance.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The meal is finished. Whether the time at the table built anything ' +
          'depends on whether anything was built.',
        changes: [
          {
            id: 'barracks_social',
            kind: 'reputation',
            title: 'Barracks Standing',
            detail: 'The mess hall is where guards decide what they think of each other.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What came from the table?',
        reactions: [
          {
            id: 'barracks_connection',
            label: 'Something was shared over the meal.',
            intent:
              'A piece of information, a moment of recognition, a grudging acknowledgment. ' +
              'The barracks geography shifted.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.watch_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),

  withEncounterContract({
    id: 'cg.social.citizen_petition',
    name: 'Citizen Petition',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    locationSubtypes: ['town', 'city', 'capital'],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        reach: 'heart',
        duration: { min: 1, max: 1 },
        difficulty: (CG_DIFFICULTY_BASE - 5) / 100,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          reputationDelta: 0.02,
          rewardPool: { categoryWeights: { possession: 0.50, condition: 0.50 } },
        },
        failureMetadata: { reputationDelta: -0.01 },
        narrativeTemplate:
          'The citizen approaches at the edge of {name}\'s patrol route — the calculated moment ' +
          'when the guard is visible but not occupied. The complaint is about the granary accounting, ' +
          'or the neighbor who keeps unusual hours, or the family from the eastern quarter ' +
          'who have an accent no one can place. {name} listen{s} with the attention that separates ' +
          'what the complaint says from what the complaint means. ' +
          '{?has_faction}The guard\'s doctrine says to validate the concern and redirect to the ' +
          'appropriate mechanism. The mechanism is usually {name}, which simplifies things.{/has_faction}' +
          '{?no_faction}No institutional backing for whatever response {they} give{s}. ' +
          'The response will be attributed to the guard anyway.{/no_faction}',
        successAfterimage:
          'The citizen leaves with an answer, a referral, or the plain acknowledgment ' +
          'that someone heard them — which, for this person, was the most necessary of the three.',
        failureAfterimage:
          'The citizen storms off having received something that satisfied neither of them. ' +
          'Another complaint will be filed. It will reach the captain with {name}\'s name adjacent to it.',
      },
    ],
    narrativeTemplates: {
      initiation:
        '{name} receives a citizen complaint during patrol in {location}. ' +
        'The complaint is the version the citizen will tell. ' +
        'The truth is a related document.',
      success:
        'The citizen left with something. What it was matters less than that they had something to carry away.',
      failure:
        'The citizen left without it. Whatever they needed was not what they received.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The petition is resolved or not. The citizen leaves with their version of how ' +
          'the guard handled it, which will travel further than the interaction itself.',
        changes: [
          {
            id: 'citizen_petition_reputation',
            kind: 'reputation',
            title: 'Public Trust',
            detail: 'The guard\'s reputation is built one citizen interaction at a time.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What the citizen said and what the citizen meant are different things.',
        reactions: [
          {
            id: 'petition_note_intel',
            label: "The complaint about the neighbor is specific.",
            intent:
              'The description — unusual hours, unfamiliar accent — is specific enough to be noticed. ' +
              'Something is being observed without being named.',
            effects: [
              {
                kind: 'intelligence',
                category: 'agent_network',
                label: 'Citizen complaint about unidentified residents in {location} district',
                detail:
                  'Eastern accent, unusual hours — observed without reported. ' +
                  'Possibly nothing. Possibly not.',
                reliability: 0.4,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'petition_complete',
            label: 'The complaint was heard.',
            intent: 'The guard received the petition. The encounter is what it is.',
            effects: [
              { kind: 'reputation_tally', key: 'cg.watch_work', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  }),
];

// ─── Join & Promotion ───────────────────────────────────────────────────

export const CG_JOIN_TEMPLATE: UnifiedActionTemplate = {
  id: 'cg.join',
  name: 'Enlist in the Civic Guard',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  reach: 'iron',
  crudType: 'delete',
  scale: 'local',
  locationSubtypes: ['town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  steps: [
    {
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: CG_JOIN_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.0 },
      failureMetadata: { reputationDelta: 0.0 },
      narrativeTemplate:
        'The Civic Guard\'s fitness trial is designed to eliminate the people who assumed ' +
        'it would be easier than this. Three events: a wall run, a weighted carry, and a ' +
        'weapons drill that tests form rather than skill. The recruiter who runs the trial ' +
        'has seen people fail at all three and told none of them which was the actual disqualifier — ' +
        'the actual disqualifier is the attitude that surfaces when things are harder than expected. ' +
        '{name} understand{s} this instinctively or {they} do{es} not, ' +
        'and the trial will determine which. ' +
        '{?has_ally}{ally:strongest} passed this same trial — {name} has {their} account of it, ' +
        'which may or may not match the experience of actually doing it.{/has_ally}' +
        '{?no_ally}{name} goes in without anyone\'s account of what it is actually like. ' +
        'Just the doing of it.{/no_ally}',
      successAfterimage:
        'The trial is passed. A recruit\'s tabard is pressed into {name}\'s hands without ceremony, ' +
        'which is itself a kind of ceremony — the guard\'s welcome is indistinguishable from its expectations.',
      failureAfterimage:
        'Not today. The recruiter says \'come back when you\'re ready,\' which is the only version of ' +
        '\'no\' that has a time attached to it.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name} presents for the Civic Guard fitness trial at {location}. ' +
      'The trial tests more than fitness.',
    success:
      'Accepted. The tabard is the welcome and the expectation simultaneously.',
    failure:
      'Not yet. The recruiter\'s \'come back\' is a door that stays open.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The trial is complete. {name} is either a recruit of the Civic Guard or not — ' +
        'and the guard\'s door is open to one outcome and holds at the other.',
      changes: [
        {
          id: 'join_outcome',
          kind: 'reputation',
          title: 'Civic Guard Status',
          detail: 'Acceptance or deferral. The trial determined which.',
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'The trial said something about who is ready.',
      reactions: [
        {
          id: 'join_accept',
          label: 'The guard has a new recruit.',
          intent:
            'Passed. The world the guard is responsible for now includes {name}.',
          effects: [
            { kind: 'reputation_tally', key: 'cg.watch_work', delta: 1 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const CG_PROMOTION_TEMPLATE: UnifiedActionTemplate = {
  id: 'cg.promotion',
  name: 'Guard Promotion Review',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'iron',
  crudType: 'delete',
  scale: 'local',
  locationSubtypes: ['town', 'city', 'capital'],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  steps: [
    {
      reach: 'iron',
      duration: { min: 2, max: 2 },
      difficulty: CG_PROMOTION_DIFFICULTY / 100,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: { reputationDelta: 0.0 },
      failureMetadata: { reputationDelta: 0.0 },
      narrativeTemplate:
        'Three senior officers in a room, a candle burning down, {name}\'s service record ' +
        'on the table between them. The review board asks questions mostly about things that ' +
        'already happened — which is a reasonable way to predict things that have not — ' +
        'and makes observations about the record that {name} will need to acknowledge or explain. ' +
        'The officers have decided who they want to promote before this meeting; ' +
        'the meeting is the process by which they confirm or revise that decision in front of a witness. ' +
        '{name} is the witness. ' +
        '{?has_faction}The middle officer handled {name}\'s initial assignment. ' +
        'That history is either an advantage or a complication.{/has_faction}' +
        '{?no_faction}None of the three have specific context for {name}\'s background ' +
        'to incline them toward or against. The record is the record.{/no_faction}',
      successAfterimage:
        'Promoted. New rank, new responsibilities, and the particular weight of being ' +
        'one of the people others look to when the situation is ambiguous.',
      failureAfterimage:
        'The board defers. The language used is \'additional service\' rather than ' +
        '\'deficient performance,\' which is a distinction the guard keeps carefully ambiguous.',
    },
  ],
  narrativeTemplates: {
    initiation:
      '{name}\'s service record goes before the review board of the Civic Guard of {location}. ' +
      'Three officers. One decision.',
    success:
      'Promoted. The responsibility is not different in kind, only in degree.',
    failure:
      'Deferred. The board\'s language was careful. The meaning was not ambiguous.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The board has rendered its judgment. The watch adapts to the outcome, ' +
        'as it adapts to everything — by continuing to function.',
      changes: [
        {
          id: 'promotion_outcome',
          kind: 'reputation',
          title: 'Guard Rank',
          detail: "The board's decision shapes what {name} is responsible for next.",
          polarity: 'mixed',
        },
      ],
      reactionPrompt: 'The review board decided. What did the god observe?',
      reactions: [
        {
          id: 'promotion_noted',
          label: 'The promotion was earned.',
          intent: 'The record was read. The decision followed. The god notes the advancement.',
          effects: [
            { kind: 'reputation_tally', key: 'cg.watch_work', delta: 2 },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

export const CG_LIFECYCLE_TEMPLATES: readonly UnifiedActionTemplate[] = [
  CG_JOIN_TEMPLATE,
  CG_PROMOTION_TEMPLATE,
];

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up a civic guard encounter template by ID.
 */
export function getCivicGuardEncounterById(id: string): UnifiedActionTemplate | undefined {
  return CIVIC_GUARD_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? CG_LIFECYCLE_TEMPLATES.find(t => t.id === id)
    ?? CIVIC_GUARD_SOCIAL_TEMPLATES.find(t => t.id === id);
}
