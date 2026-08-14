/**
 * Encounter Content Package — 115 encounter templates (76 location-specific + 18 universal + 21 gap-fill) with cultural vocabulary overlays.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change encounter templates,
 * step sequences, difficulty curves, and cultural prose variations.
 * ═══════════════════════════════════════════════════════════════════
 */

import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import type { LocationSubtype } from '../types/index';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { compileOpeningEnvelope, expandSettings, type SettingClass } from './settingClasses';
import {
  ENCOUNTER_TONE_ADJECTIVES,
  encounterToneTierForThreat,
  resolveWordPoolTokens,
} from './encounter-words';
import { getSocialEncounterById } from './social-encounter-content';
import { getFactionEncounterById } from './faction-encounter-content';
import { getMercenaryEncounterById } from './mercenary-encounter-content';
import { getArmyEncounterById } from './army-encounter-content';
import { getMonsterEncounterById } from './monster-encounter-content';
import { getBorderlandEncounterById } from './borderland-encounter-content';
import { SECRET_DISCOVERY_ENCOUNTER_TEMPLATES } from './secret-encounter-content';

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Difficulty tier for an encounter, including base multiplier and tone adjectives.
 */
export interface EncounterDifficultyTier {
  /** Multiplier applied to base difficulty (e.g., 0.8 for easier, 1.3 for harder) */
  difficultyMultiplier: number;
  /** Tone adjectives to flavor prose at this difficulty level */
  toneAdjectives: string[];
}

// ─── Tunable Constants ──────────────────────────────────────────

/** Difficulty progression within a template (escalates per step).
 * Easy tier: starting agents (cap ~0.05–0.15) can pass step 1 ~10–20% of the time.
 * Formula: prob = cap + mods - diff/100, clamped [0.05, 0.95].
 * Design goal: agents always progress slowly, reaching cap ~1.0 around tick 1000. */
const DIFFICULTY_BASE = 10;
const DIFFICULTY_STEP = 8;

/** Difficulty base for moderate encounters (mid-game agents, cap ~0.30–0.50) */
const MODERATE_DIFFICULTY_BASE = 25;
const MODERATE_DIFFICULTY_STEP = 8;
/** Difficulty base for hard encounters (experienced agents, cap ~0.50–0.75) */
const HARD_DIFFICULTY_BASE = 40;
const HARD_DIFFICULTY_STEP = 10;
/** Difficulty base for deadly encounters (master-tier agents, cap ~0.75+) */
const DEADLY_DIFFICULTY_BASE = 60;
const DEADLY_DIFFICULTY_STEP = 10;

/** Difficulty base for universal (fallback) encounters — accessible to all agents */
const UNIVERSAL_DIFFICULTY_BASE = 5;
/** Difficulty step between stages in universal encounters */
const UNIVERSAL_DIFFICULTY_STEP = 5;
/** Difficulty base for reach-agnostic encounters — near-guaranteed pass for any agent */
const AGNOSTIC_DIFFICULTY_BASE = 3;
/** Difficulty step for reach-agnostic encounters */
const AGNOSTIC_DIFFICULTY_STEP = 3;

/**
 * Every LocationSubtype value — used by universal encounters that should
 * appear at any settlement regardless of type.
 */
const ALL_LOCATION_SUBTYPES: LocationSubtype[] = [
  'hamlet', 'town', 'city', 'capital',
  'camp', 'farmland',
  'castle', 'fort', 'tower', 'shrine', 'temple',
  'mining', 'ruins', 'ruined_tower', 'ruined_city', 'ruined_village',
  'battleground', 'oasis', 'unexplored_poi',
  'wilderness',
];

// ─── System 6 Constants (Economic Encounters) ────────────────────────

/** Prosperity gain applied to the host settlement from Market Day Festival */
export const MARKET_FESTIVAL_PROSPERITY_BOOST = 5;

/**
 * PRNG probability of a new relates_to edge forming between each pair of
 * agents present at Market Day Festival. Seeded roll per pair per tick.
 */
export const MARKET_FESTIVAL_RELATIONSHIP_CHANCE = 0.3;

/** Resource quantity bonus on a successful Rich Vein discovery */
export const RICH_VEIN_RESOURCE_BONUS = 20;

/** Resource quantity penalty (and injury condition) on a Rich Vein collapse */
export const RICH_VEIN_COLLAPSE_PENALTY = 10;

// ─── 3 Difficulty Tiers ─────────────────────────────────────────

/**
 * Encounter difficulty tiers determine how challenging an encounter is and what tone it carries.
 * Used to flavor prose and adjust difficulty multipliers for encounter steps.
 */
export const ENCOUNTER_DIFFICULTY_TIERS: Record<string, EncounterDifficultyTier> = {
  // Tone adjectives are owned by `encounter-words.ts` (THR-1036) so the enrichment path
  // and this table cannot drift apart — the drift is what let the tokens leak.
  early: {
    difficultyMultiplier: 0.8,
    toneAdjectives: ENCOUNTER_TONE_ADJECTIVES.early,
  },
  mid: {
    difficultyMultiplier: 1.0,
    toneAdjectives: ENCOUNTER_TONE_ADJECTIVES.mid,
  },
  late: {
    difficultyMultiplier: 1.3,
    toneAdjectives: ENCOUNTER_TONE_ADJECTIVES.late,
  },
};

// ─── Local Raw Type ──────────────────────────────────────────────

/** Shape used for raw encounter data in this file. Converted to UnifiedActionTemplate at export. */
type EncounterEntry = {
  id: string;
  name: string;
  /**
   * THR-884: the setting envelope — the preferred way to place an encounter.
   * Declare classes (`['rural', 'wayside']`); the converter expands them through
   * `SETTING_CLASS_MAP` into `locationSubtypes`, which the encounter cache filters
   * on unchanged. Write toward the *widest honest envelope* and keep it honest with
   * per-class `openings` rather than by narrowing.
   */
  settings?: readonly SettingClass[];
  /**
   * Exact-subtype placement. Now the **override** for genuinely specific encounters
   * (a temple rite that belongs at `temple` and nowhere else); every other template
   * should prefer `settings`. Optional since THR-884 — an entry must carry at least
   * one of `settings` / `locationTypes`, enforced by `settingClasses.test.ts`.
   * Unioned with the expanded envelope when both are present.
   */
  locationTypes?: LocationSubtype[];
  sublocationTypes?: string[];
  /**
   * THR-884: per-setting-class opening paragraphs. Compiled by the converter into a
   * `{frag:opening}` fragment set on the `setting` axis, with the first step's
   * authored narrative as the `'*'` default. Must cover every class `settings`
   * declares (build-time test).
   */
  openings?: Readonly<Partial<Record<SettingClass, string>>>;
  reachPrimary: string;
  reachSecondary?: string;
  encounterType: string;
  threatRating?: string;
  intrinsicTier?: string;
  motivations?: readonly string[];
  sphereAffinity?: string;
  foreshadowing?: import('../types/foreshadowing').EncounterForeshadowingDefinition;
  reputationPolarity?: 'positive' | 'negative';
  favorGeneration?: { onSuccess: boolean; magnitudeRange: [number, number]; context: string };
  /** THR-724: births a `knows_secret_of` edge on success (see secretsFromResolution.ts). */
  secretDiscovery?: { onSuccess: boolean; sourceName: import('../types/encounter').SecretDiscoverySource };
  /**
   * THR-74: overrides the converter's default `actorAffinities: ['individual']`.
   * `['group']` (no `'individual'`) makes the template party-EXCLUSIVE — only a
   * company draws it, gated on `minGroupMembers` living members in
   * `generateUnifiedCandidates`. Absent for the ~76 individual-actor archetypes,
   * which keep the default.
   */
  actorAffinities?: readonly import('../types/graph').ActorType[];
  /** THR-74: minimum living company members required to draw a group-exclusive template. */
  minGroupMembers?: number;
  /**
   * THR-731: only drawable while an opposing band shares the company's hex.
   * Set by the confrontation family — an encounter about fighting a specific
   * enemy must not surface when that enemy is not there.
   */
  requiresOpposingBand?: boolean;
  /** THR-731: a decisive loss in this contest never kills. See the template field. */
  contestNonLethal?: boolean;
  /**
   * THR-838 (WS5): template-level trait variants, passed through to
   * `UnifiedActionTemplate.traitVariants`. Absent for every un-migrated entry.
   */
  traitVariants?: readonly import('../types/unifiedAction').TraitVariant[];
  steps: ReadonlyArray<{
    id?: string;
    name?: string;
    reach: string;
    difficulty: number;
    duration?: number;
    narrative: string;
    /** Band-specific afterimage shown when this step resolves as a critical
     *  success — the rare, flawless outcome. Falls through to the base
     *  onSuccess.narrative afterimage when absent (THR-584). */
    criticalSuccessAfterimage?: string;
    /** Band-specific afterimage shown when this step resolves as a critical
     *  failure — the rare, ruinous outcome. Falls through to the base
     *  onFailure.narrative afterimage when absent (THR-584). */
    criticalFailureAfterimage?: string;
    /**
     * THR-838 (WS5): the nudge-model authoring fields.
     *
     * `ActionStep` has carried all five since WS0/THR-820, but this file's raw
     * entry type declared none of them and the converter below built its steps
     * field-by-field — so a nudge hand authored on an entry here was dropped on
     * the floor, silently, with no type error. That made the ~41 Batch-1
     * templates living in this file unauthorable: the WS1 checklist asks for a
     * hand the pipeline could not carry. These five fields are the passthrough.
     *
     * All optional, all absent from every un-migrated entry, so the conversion
     * is byte-identical for templates that do not author them (NFP #6).
     */
    successAtCostAfterimage?: string;
    purposeLine?: string;
    factorLines?: readonly import('../types/unifiedAction').StepFactorLine[];
    nudges?: readonly import('../types/unifiedAction').StepNudge[];
    onSuccess: {
      narrative: string;
      rewardPool?: import('../types/attachments').RewardPoolRecipe;
      tierPromotionEligible?: boolean;
      reputationDelta?: number;
    };
    onFailure: {
      narrative: string;
      rewardPool?: import('../types/attachments').RewardPoolRecipe;
      reputationDelta?: number;
    };
  }>;
};

// ─── Converter ───────────────────────────────────────────────────

// Map legacy reach domains to their nearest valid equivalents.
// 'spirit' → 'veil' (mystical/spiritual), 'dominance' → 'stone' (structural authority)
function normalizeReach(reach: string): import('../types/traits').ReachDomain {
  if (reach === 'spirit') return 'veil';
  if (reach === 'dominance') return 'stone';
  return reach as import('../types/traits').ReachDomain;
}

function toCrudType(encounterType: string): UnifiedActionTemplate['crudType'] {
  switch (encounterType) {
    case 'create': case 'hire': case 'build': return 'create';
    case 'explore': case 'acquire': case 'steal': case 'trade': return 'read';
    case 'duel': return 'delete';
    default: return 'update';
  }
}

function toOutcomeMeta(
  outcome: { rewardPool?: import('../types/attachments').RewardPoolRecipe; tierPromotionEligible?: boolean; reputationDelta?: number },
): import('../types/unifiedAction').ActionStepOutcomeMetadata | undefined {
  if (outcome.rewardPool === undefined && outcome.tierPromotionEligible === undefined && outcome.reputationDelta === undefined) {
    return undefined;
  }
  return { rewardPool: outcome.rewardPool, tierPromotionEligible: outcome.tierPromotionEligible, reputationDelta: outcome.reputationDelta };
}

function toUnifiedTemplate(e: EncounterEntry): UnifiedActionTemplate {
  const motivations = (ENCOUNTER_TYPE_MOTIVATIONS as Record<string, readonly import('../types/agent').ValuePair[]>)[e.encounterType]
    ?? (e.motivations as readonly import('../types/agent').ValuePair[] ?? []);
  const firstStep = e.steps[0];
  const lastStep = e.steps[e.steps.length - 1];
  // THR-884: envelope expansion happens here, once, at conversion — never per tick.
  // THR-932: the openings *compile* is no longer done here. It moved to the shared
  // `compileOpeningEnvelope` applied to the finished template below, so the raw-entry
  // and direct-authored paths have one semantic instead of two. The old local version
  // *replaced* step-0 prose with the token (discarding the authored step paragraph);
  // the shared one prepends. Behavior-neutral for shipped content — no raw entry in
  // this corpus authors `openings` (verified 2026-08-01), so the replace path had no
  // shipped users.
  return compileOpeningEnvelope({
    id: e.id,
    name: e.name,
    reach: normalizeReach(e.reachPrimary),
    crudType: toCrudType(e.encounterType),
    scale: 'local',
    steps: e.steps.map((step, index) => {
      const dur = step.duration ?? 1;
      return {
        reach: normalizeReach(step.reach),
        duration: { min: dur, max: dur },
        difficulty: step.difficulty / 100,
        onSuccess: [],
        onFailure: [],
        failBehavior: (index < e.steps.length - 1 ? 'continue_weakened' : 'fail_action') as 'continue_weakened' | 'fail_action',
        // THR-884/THR-932: every step keeps its authored prose verbatim here. Step 0
        // additionally gets the `{frag:opening}` token *prepended* by
        // `compileOpeningEnvelope` below, when and only when the entry authored openings.
        narrativeTemplate: step.narrative,
        successAfterimage: step.onSuccess.narrative,
        failureAfterimage: step.onFailure.narrative,
        criticalSuccessAfterimage: step.criticalSuccessAfterimage,
        criticalFailureAfterimage: step.criticalFailureAfterimage,
        successMetadata: toOutcomeMeta(step.onSuccess),
        failureMetadata: toOutcomeMeta(step.onFailure),
        // THR-838 (WS5): nudge-model passthrough. Undefined for every
        // un-migrated entry, which is exactly how `ActionStep` reads "no hand".
        successAtCostAfterimage: step.successAtCostAfterimage,
        purposeLine: step.purposeLine,
        factorLines: step.factorLines,
        nudges: step.nudges,
      };
    }),
    apCost: 1,
    // THR-74: party-exclusive delves author `['group']` explicitly; every other
    // archetype keeps the individual-actor default. Group-swept templates (those
    // carrying both `'individual'` and `'group'`) are produced downstream by
    // `withGroupAffinity` in unified-action-templates.ts, not here.
    actorAffinities: e.actorAffinities ?? ['individual'],
    minGroupMembers: e.minGroupMembers,
    requiresOpposingBand: e.requiresOpposingBand,
    contestNonLethal: e.contestNonLethal,
    // THR-884: the envelope expands first (canonical class order), then any
    // exact-subtype override, then sublocations. Deduplicated so a template
    // declaring both `settings: ['sacred']` and `locationTypes: ['temple']`
    // registers `temple` once — the cache filter uses `includes`, but a duplicated
    // entry would double-count in the coverage matrix.
    locationSubtypes: [
      ...new Set<string>([
        ...expandSettings(e.settings),
        ...(e.locationTypes ?? []),
        ...(e.sublocationTypes ?? []),
      ]),
    ],
    settings: e.settings,
    openings: e.openings,
    sphereAffinity: e.sphereAffinity as UnifiedActionTemplate['sphereAffinity'],
    motivations,
    narrativeTemplates: {
      initiation: firstStep?.narrative ?? `${e.name} begins.`,
      success: lastStep?.onSuccess.narrative ?? `${e.name} succeeds.`,
      failure: lastStep?.onFailure.narrative ?? `${e.name} fails.`,
    },
    foreshadowing: e.foreshadowing,
    // THR-724: both fields were declared on the raw entry type but dropped here, so
    // the authored `favorGeneration` data was inert and no encounter in this file
    // could ever seed a secret. Pass them through to the resolution read site.
    secretDiscovery: e.secretDiscovery,
    favorGeneration: e.favorGeneration,
    // THR-838 (WS5): trait hooks, the template-level half of the nudge model.
    traitVariants: e.traitVariants,
    rarityTier: 1,
    intrinsicTier: 'background',
  });
}

// ─── Encounter Templates ──────────────────────────────────────

/**
 * 76 location-specific encounter archetypes + 18 universal fallbacks.
 * Location-specific: 3 steps with escalating difficulty (25 → 35 → 45).
 * Universal: 2 steps, lower difficulty (20 → 25), available at every location type.
 * Reach-agnostic: 2 steps, extra-low difficulty (15 → 20), near-guaranteed pass.
 */
const ENCOUNTER_TEMPLATES_RAW: EncounterEntry[] = [
  {
    id: 'encounter.deep_descent',
    name: 'The Deep Descent',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city', 'mining', 'unexplored_poi'],
    sublocationTypes: ['sublocation-type.dungeon'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'deep_descent.entrance',
        name: 'The Entrance',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (explore-family
        // batch, survey slice). Register: survey work is measurement under conditions
        // that do not care about you — the place answers or it does not, and the only
        // question is whether you read it right before the light or the weather turns.
        // Calibrated against `encounter.trial_by_combat` (THR-1036).
        narrative: 'The stair goes down further than the lamp reaches. {actor} counts the first twenty steps aloud. A count keeps its shape after the light stops being useful.',
        onSuccess: {
          narrative: '{actor} keeps the count past a hundred, then stops needing it. The air turns cold and stops moving, which is the good sign: the passage ahead has not fallen in.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} gets forty steps down and feels the stair shift underfoot. Turning back takes about a second to decide. Saying so at the surface takes considerably longer.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'deep_descent.labyrinth',
        name: 'The Labyrinth',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Below the stair the passages fork, and fork again, and none of the forks are marked. {actor} keeps a hand on the left wall — the old rule, imperfect, better than the alternative.',
        onSuccess: {
          narrative: '{actor} finds the draught instead: a thread of moving air that has to be coming from an opening. It arrives where the left wall would have, four hours sooner.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The left-wall rule returns {actor} to {their} own chalk mark. Then it does it again. The passages are a loop that has been dressed up as a maze.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'deep_descent.abyss',
        name: 'The Abyss',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The passage ends at an edge. {actor} drops a stone and counts four before the water answers. What lies below was never meant to be reached from this side.',
        onSuccess: {
          narrative: '{actor} crosses on the old span, which holds, and lifts what is on the far ledge without examining it closely. The crossing back is worse — {their} hands are full now, and the span has been tested once already.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The span gives on the third step. {actor} reaches the near ledge instead of the far one, which is the difference between a bad week and a last one. The ledge below keeps what it has.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.trial_of_flame',
    name: 'Trial of Flame',
    locationTypes: ['mining', 'fort', 'camp'],
    sublocationTypes: ['sublocation-type.temple-quarter', 'sublocation-type.barracks'],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'create',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'trial_of_flame.ignition',
        name: 'The Ignition',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        // THR-1101 batch 8: the `create` family authored out of the `{adj}`/`{verb}`/
        // `{action}` mad-lib shape. Register for the family — the material has an
        // opinion, and craft is finding out what it is before it tells you the
        // expensive way. Calibrated against `encounter.trial_by_combat` (THR-1036).
        narrative: 'The forge comes up slow and then all at once. Heat rolls off the coals hard enough to bend the air behind it. The first billet waits on the anvil, cold and unimpressed.',
        onSuccess: {
          narrative: '{actor} finds the rhythm by the third strike. After that the steel goes where it is put.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} swings half a beat early. The billet splits along a line nobody had seen, and the split runs its whole length.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'trial_of_flame.tempering',
        name: 'The Tempering',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'The blade comes out the colour of a sunset and has to go into the ice at once. Every instinct says wait. Waiting ruins it.',
        onSuccess: {
          narrative: '{actor} counts the quench and pulls at the right moment. The blade rings once when it comes clear, one clean note.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The steel shatters. {actor}\'s moment of doubt costs them a blade and a chance at mastery.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'trial_of_flame.transformation',
        name: 'The Transformation',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'The master smith arrives with a bundle of rust and a name attached to it. What is left of the weapon is more story than steel. {actor} is asked to make it a weapon again.',
        onSuccess: {
          narrative: 'The reforged blade comes off the stone with an edge that holds. The master turns it twice and sets it down without comment. That is the whole verdict.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: {
          narrative: 'The old metal will not take the new. It crumbles at the weld and keeps crumbling, and what is left fits in one hand.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.spirit_walk',
    name: 'The Spirit Walk',
    locationTypes: ['shrine', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'spirit_walk.threshold',
        name: 'The Threshold',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (batch 12,
        // divination slice). Register: reading what was not written for you.
        narrative: 'The veil is thin at this shrine, and thinner after dark. The watchers on the far side turn toward {actor} the way a room goes quiet when a stranger walks in.',
        onSuccess: {
          narrative: '{actor} slows {their} breathing until the watching stops mattering, and walks through it.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'They crowd in all at once. {actor} comes back to the shrine floor with cold hands and no memory of having sat down.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'spirit_walk.communion',
        name: 'The Communion',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'One of them comes forward. It is old, and it is patient, and it has come to find out how much of {actor}\'s faith is habit.',
        onSuccess: {
          narrative: '{actor} gives the honest answer instead of the creditable one. What the spirit leaves behind sits warm under the breastbone for three days and is then gone.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} looks away first. The spirit does not follow, and the shrine is a room again — cold stone, a guttering wick, nobody in it.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'spirit_walk.transcendence',
        name: 'The Transcendence',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The veil does not thin this time. It opens, and behind it the world is being taken apart and put back together, and has been all along.',
        onSuccess: {
          narrative: '{actor} holds it as long as a person can, then lets go before it lets go of {them}. What walks back out of the shrine is mostly {actor}.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'Too much, too fast. {actor} is on the flagstones again, breathing hard, already losing the shape of what was shown.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.merchants_gambit',
    name: 'Merchant\'s Gambit',
    locationTypes: ['town', 'city', 'capital', 'oasis'],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    secretDiscovery: { onSuccess: true, sourceName: 'observation' },
    steps: [
      {
        id: 'merchants_gambit.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Two grain factors have been shouting across the same stall for an hour, and the crowd has stopped pretending not to listen. {actor} steps between them before the shouting finds a knife. Both want the same contract, and neither will be the first to name a number.',
        onSuccess: {
          narrative: 'The split {actor} proposes gives each factor slightly less than he demanded and slightly more than he expected. They sign, because arithmetic is harder to argue with than pride.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Neither factor hears an offer. They hear a stranger putting a price on their quarrel. The shouting resumes over {actor}\'s shoulder, and the stall owner begins moving his stock indoors.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'merchants_gambit.deception',
        name: 'The Deception',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'A buyer lays out six bolts of dyed wool and names a price that assumes nobody will check the underside. {actor} checks the underside. The difficulty is not seeing the short measure — it is saying so without turning a market into a court.',
        onSuccess: {
          narrative: '{actor} names the shortfall to the inch and offers to buy at the honest measure instead. The buyer laughs, recalculates, and sells. A man caught quietly loses less than a man caught loudly, and both of them know it.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} calls the measure short, and it is not. The buyer unrolls the bolt full-length across the stones and lets the market count it aloud. The wool sells at a rival stall before noon.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'merchants_gambit.fortune',
        name: 'The Fortune',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'A factor {actor} has never traded with offers a cargo of untaxed salt at two-thirds the quay price, payable after resale. The margin is real. So is the reason no one else in the square has touched it.',
        onSuccess: {
          narrative: '{actor} declines without insulting the offer, which is the harder half. By evening, three factors who watched the refusal have revised upward what {actor}\'s word is worth on a delayed payment.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: '{actor} takes the cargo. The excise men take it back at the second gate, along with the ledger naming who paid for it. The salt was never the trap. The ledger was.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.shadow_hunt',
    name: 'The Shadow Hunt',
    locationTypes: ['ruins', 'ruined_village', 'ruined_city', 'city'],
    reachPrimary: 'shadow',
    reachSecondary: 'star',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'shadow_hunt.stalk',
        name: 'The Stalk',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (steal-family batch).
        // Register: theft is bookkeeping with consequences — a job is measured in what it
        // leaves behind, and the bill is presented later. Calibrated against
        // `encounter.trial_by_combat` (THR-1036). The prior prose also carried the retired
        // lyrical register ("glides through shadow like water"), removed with the tokens.
        narrative: 'The quarry keeps to broken ground, where a footfall carries and a silhouette does not. {actor} works the low line and pays for it in speed.',
        onSuccess: {
          narrative: 'The quarry never checks the back trail. {actor} follows it to a shuttered mill and marks the door that stays unbarred.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Wet timber gives under {actor}\'s heel with a sound like a shot. The quarry is moving before the echo returns, and the trail after that is all guesswork.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'shadow_hunt.patience',
        name: 'The Patience',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The mill has one window worth watching and no cover within forty paces of it. {actor} takes the ditch and settles in for as long as it takes.',
        onSuccess: {
          // The bare `{They} move` here rendered as "she move" before this batch — the
          // {they}-plus-bare-verb class met in every batch since 3. Pronoun subject dropped.
          narrative: '{actor} lets three good chances pass because none of them are the fourth. The fourth comes at the turn of the watch, and {they} take{s} it.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} moves at the third chance instead of the fourth. The ditch gives up {their} outline, and the quarry is gone into the treeline.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'shadow_hunt.convergence',
        name: 'The Convergence',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The quarry goes to ground in a walled compound with one gate and a dog. {actor} has until the dog is fed.',
        onSuccess: {
          narrative: '{actor} is over the wall while the dog is still eating, and out again before the bowl is empty. The gate stays barred all night, which is what the household will remember.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'The dog finishes early. {actor} goes back over the wall with a torn sleeve and a shout following, and the compound doubles its watch by morning.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.knowledge_test',
    name: 'The Knowledge Test',
    locationTypes: ['tower', 'temple', 'capital'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'knowledge_test.archives',
        name: 'The Archives',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (batch 13,
        // scholarship-and-hearsay slice). Register: knowledge held by other
        // people, with a price of admission.
        narrative: 'The library runs four floors and has no catalogue anyone will admit to keeping. One answer is in it. The examiners have declined to say which floor.',
        onSuccess: {
          narrative: 'It is not in the text. {actor} finds it in a margin, in a second hand, arguing with the author.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The lamps are trimmed twice while {actor} reads. By dawn {they} can name eleven books that do not hold the answer, and the examiners write that down without comment.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'knowledge_test.riddle',
        name: 'The Riddle',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The scholar recites the riddle without looking up from the desk. It has been answered twice in sixty years, and both answers were accepted before anyone found the fault in them.',
        onSuccess: {
          narrative: '{actor} takes it apart at the joint where the grammar lies about the meaning. The scholar writes the answer down, which {actor} understands to be the larger compliment.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} gives an answer that holds for three clauses and then does not. The scholar calls it a good failure and does not write it down.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'knowledge_test.synthesis',
        name: 'The Synthesis',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'Four schools have argued this for a century without any of them being wrong. {actor} is asked to say what shape the argument has, which no one has done.',
        onSuccess: {
          narrative: '{actor} finds the assumption all four schools share and had never thought to name. The argument does not end. It moves, for the first time in a century, and the academy will be a long while forgiving that.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
          },
        },
        onFailure: {
          narrative: 'The synthesis holds until the third reading, when two of its supports turn out to be the same support. The academy files the work politely. It will be useful to whoever tries this again in forty years.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.warlords_crucible',
    name: 'The Warlord\'s Crucible',
    locationTypes: ['fort', 'castle', 'battleground'],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'warlords_crucible.duel',
        name: 'The Duel',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (duel-family batch).
        narrative: 'The garrison clears a square in the courtyard and lines the walls to watch. {actor} is handed a blade with another man\'s notches worn into the grip.',
        onSuccess: {
          narrative: '{actor} ends it with a turn of the wrist and a step back. The walls make a noise the fort has not made in years.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} plants a foot on loose gravel and the fight decides itself there. The yielding is quick, and the walls stay quiet about it.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'warlords_crucible.command',
        name: 'The Command',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The siege arrives before the bruises fade. {actor} is given a garrison that has buried two captains this season and told to hold the gate.',
        onSuccess: {
          narrative: '{actor} spends the archers early and the reserves late, and the enemy breaks on the wall instead of through it. The garrison starts using {their} name for orders.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} holds the reserves too long. The gate goes in the third hour, and the fighting moves indoors, where plans do not reach.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'warlords_crucible.ascension',
        name: 'The Ascension',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The warlord comes through the smoke without an escort, which is the whole message. The fortress and the title go to whoever is standing at the end of it.',
        onSuccess: {
          narrative: '{actor} is the one left standing. The fortress changes hands in the time it takes a body to fall, and the garrison decides, quietly, that this is acceptable.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor} is put down in front of the garrison and dragged out in chains. The warlord does not bother to learn the name.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.healers_oath',
    name: 'The Healer\'s Oath',
    locationTypes: ['temple', 'shrine'],
    sublocationTypes: ['sublocation-type.temple-quarter'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'healers_oath.diagnosis',
        name: 'The Diagnosis',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape, `assist` family batch.
        narrative: 'The patient has been sick eleven days and seen by three people who each named a different cause. {actor} starts the examination from the beginning, because nobody else has.',
        onSuccess: {
          narrative: '{actor} finds it in the hands — the swelling everyone took for the illness is what the illness left behind. The remedy follows from that.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} examines the patient twice and comes away with the same three guesses the others brought. The family is polite about it, which is worse.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'healers_oath.remedy',
        name: 'The Remedy',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The temple stores are thinner than the season warrants. {actor} measures what is left and builds the remedy from that, not from the recipe.',
        onSuccess: {
          narrative: 'The patient keeps it down, then sleeps, then wakes asking for water. {actor} counts the water as the better sign.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The fever takes the remedy and keeps its course. {actor} sits with the patient through the night, which is the whole of what is left to offer.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'healers_oath.sacrifice',
        name: 'The Sacrifice',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: 'The sickness has outgrown the temple and taken the lower streets. {actor} has a cough of {their} own and no hour to spare naming it.',
        onSuccess: {
          narrative: '{actor} works the last of it standing, then sits down on the step and stays there a full day. The city counts its dead and finds the number smaller than it feared.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor} goes down with the sickness {they} spent the month fighting. The temple keeps working. The city remembers the effort and buries the rest.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.diplomats_maze',
    name: 'The Diplomat\'s Maze',
    locationTypes: ['capital', 'city', 'town'],
    sublocationTypes: ['sublocation-type.throne-room'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'diplomats_maze.audience',
        name: 'The Audience',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The audience is granted for as long as it takes a clerk to read three petitions. {actor} kneels on stone worn smooth by better-connected knees and waits to be looked at.',
        onSuccess: {
          narrative: '{actor} speaks briefly and stops early. The ruler, who had prepared to be flattered for longer, looks up.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s words ring hollow. The ruler\'s gaze moves on to the next petitioner, and the audience is over before its time.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'diplomats_maze.bargain',
        name: 'The Bargain',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'The ruler names a price, then names it again with a different number, watching which of the two {actor} argues with. The accord will be built out of whichever answer comes first.',
        onSuccess: {
          narrative: '{actor} gives up the smaller concession loudly and the larger one not at all. Both sides sign believing they took the better half.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} argues the wrong number. The terms close in a shape that costs more each season, and the court remembers who agreed to it.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'diplomats_maze.alliance',
        name: 'The Alliance',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'The ruler\'s enemies keep their own doors and their own clerks. {actor} must get three houses that dislike each other into one room, and out of it still speaking.',
        onSuccess: {
          narrative: '{actor} finds the one grievance all three houses share and builds on that. The ruler signs last, which everyone present understands to mean the alliance is not the ruler\'s.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Two houses leave before the third arrives. What {actor} assembled reads afterwards as a list of people who refused, and the ruler keeps that list.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.starborn_vigil',
    name: 'The Starborn Vigil',
    locationTypes: ['tower', 'fort', 'castle', 'camp'],
    sublocationTypes: ['sublocation-type.temple-quarter'],
    reachPrimary: 'star',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'starborn_vigil.vigil',
        name: 'The Vigil',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (batch 12,
        // divination slice). The failure line also carried THR-1107's `{they}`
        // + bare-verb defect ("she descend"), fixed here by rephrasing.
        narrative: '{actor} climbs above the roofline before dusk and settles in. The alignment lasts a quarter of an hour, near dawn, and there is no second showing.',
        onSuccess: {
          narrative: '{actor} is still awake when the constellations close. What they spell out is short, and legible, and not addressed to anyone in particular.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Sleep takes {actor} an hour before dawn. The alignment happens on schedule, unobserved, and will not repeat in {their} lifetime.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'starborn_vigil.revelation',
        name: 'The Revelation',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The pattern is about {actor}. That much is plain inside a minute. What it says about the next few years takes longer, and gets worse.',
        onSuccess: {
          narrative: '{actor} reads it through to the end without looking away. Knowing the shape of a life is not the same as being able to bend it, and {actor} takes both.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} decides the pattern means less than it means, and climbs down. The reading keeps. It always keeps.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'starborn_vigil.transcendence',
        name: 'The Transcendence',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'Near the end of the night the pattern stops describing and starts offering. There is a passage through it, and it is open now, and it will not be open at sunrise.',
        onSuccess: {
          narrative: '{actor} goes through. What comes back down the tower stairs at dawn answers to the name, and takes the steps two at a time in the dark without once looking down.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: '{actor} hesitates one breath too long. The sky closes over, ordinary again. {actor} comes down the stairs a breath short of a different life.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // ACQUIRE (8 new templates)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.market_haggle',
    name: 'The Market Haggle',
    locationTypes: ['town', 'city', 'capital', 'oasis'],
    sublocationTypes: ['sublocation-type.market-district'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'acquire',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'market_haggle.entrance',
        name: 'The Entrance',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The market runs three deep at every stall and the noise makes honest talk impossible. {actor} picks out the one merchant not calling prices — the sign of a seller who already knows what the goods are worth.',
        onSuccess: {
          narrative: '{actor} opens with a number instead of a greeting. The merchant stops mid-count and looks up, which is the whole reason to open with a number.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The opening offer lands a shade too low, and the merchant goes back to counting without answering. Being ignored costs more here than being refused — a refusal at least sets a floor.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'market_haggle.exchange',
        name: 'The Exchange',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Now the slow part. Every price named is a claim about who can afford to walk away, and {actor} has to keep two sums running: what the goods are worth, and what the merchant believes {they} will pay.',
        onSuccess: {
          narrative: 'The two of them settle a hand\'s breadth above what {actor} hoped and well under what the merchant asked. Both shake on it a little too quickly, which means both think they won.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} pushes one round too many. The merchant names a final price, higher than the last, and starts wrapping the goods for someone else.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'market_haggle.closing',
        name: 'The Closing',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'A second buyer arrives at the stall with coin already counted. The merchant stays quiet and lets the two of them work it out; {actor} has until the wrapping is finished to beat the number.',
        onSuccess: {
          narrative: '{actor} beats the number without emptying the purse, and the goods change hands. The merchant remembers the face, which at this market is worth more than the margin.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
        onFailure: {
          narrative: 'The other buyer goes higher and does not blink. {actor} walks out past four stalls selling the same goods at twice the price, having learned exactly what the first merchant was willing to take.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.relic_hunt',
    name: 'The Relic Hunt',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city', 'unexplored_poi'],
    sublocationTypes: ['sublocation-type.dungeon', 'sublocation-type.library'],
    reachPrimary: 'eye',
    reachSecondary: 'shadow',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'relic_hunt.discovery',
        name: 'The Discovery',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The ruin covers more ground than a village, and most of it has been picked over twice. What has not been picked over lies under the collapsed east wing, which is where {actor} starts.',
        onSuccess: {
          narrative: '{actor} works the rubble in grid lines rather than by instinct, and on the fourth pass finds an edge that is worked metal, not stone.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Four hours of lifting stone, and every lift turns up more stone. {actor} marks the ground already covered before leaving — the next search will start where this one stopped.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'relic_hunt.retrieval',
        name: 'The Retrieval',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The relic sits under a slab the builders meant to stay put. The mechanism holding it has had centuries to settle, and settled mechanisms fail in one of two directions.',
        onSuccess: {
          narrative: '{actor} braces the slab before touching the relic, which is the order the builders did not plan for. The mechanism releases into the brace instead of into {them}.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The slab drops a hand\'s width and stops, and the sound it makes carries further than the ruin is wide. {actor} leaves with a torn shoulder and the knowledge that the relic is still there, still under stone.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'relic_hunt.escape',
        name: 'The Escape',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'Taking the relic took the load off a wall that had been carrying it. The east wing starts coming down in the order it was built, and {actor} has the length of that sequence to reach open air.',
        onSuccess: {
          narrative: '{actor} runs the line already marked on the descent and clears the doorway as the lintel goes. The relic is out, and the ruin has closed over the rest of what it held.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
        onFailure: {
          narrative: 'The floor opens under the last twenty feet. {actor} gets out; the relic goes down into the dark, into a space no map of this ruin records.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.harvest_bounty',
    name: 'The Harvest Bounty',
    locationTypes: ['farmland', 'hamlet', 'oasis', 'ruined_village'],
    reachPrimary: 'gold',
    reachSecondary: 'stone',
    encounterType: 'acquire',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'harvest_bounty.gathering',
        name: 'The Gathering',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The field came in heavy this year, and the whole crop wants cutting inside a week. {actor} starts at the near edge, where the grain has stood longest.',
        onSuccess: {
          narrative: '{actor} keeps a rhythm that holds all day rather than a pace that looks good for an hour. By dusk the near third is down and tied.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} cuts too high and leaves grain standing that will not be worth a second pass. It is not ruin, but the yield comes in a fifth short of what the field was carrying.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'harvest_bounty.preservation',
        name: 'The Preservation',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Cut grain is not saved grain. It has to come to the right dryness — too damp and it heats in the sack, too dry and it shatters under the flail.',
        onSuccess: {
          narrative: '{actor} turns the drying floor twice a day and sets the sacks off the ground on slats. Come spring the store opens clean, without the sour smell that means a season wasted.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} sacks the grain a day early, while it still holds warmth. By midwinter the bottom of the store has gone to mould, and the smell reaches the door.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'harvest_bounty.surplus',
        name: 'The Surplus',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'Past the drainage ditch is a strip nobody counted, planted two seasons back and then left. It has gone on yielding without being asked, and it is standing ripe.',
        onSuccess: {
          narrative: '{actor} brings the strip in before word spreads and splits it — a share to the common store, the rest to {their} own. Both halves come out larger than anyone expected either to be.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: '{actor} can carry a quarter of the strip and no more. By the second trip three other families are working it, and the claim gets settled by who is standing in the rows.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#survival'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.spell_bargain',
    name: 'The Spell Bargain',
    locationTypes: ['tower', 'temple', 'shrine'],
    reachPrimary: 'veil',
    reachSecondary: 'gold',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'spell_bargain.petition',
        name: 'The Petition',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The mage takes petitioners on the second morning of each week and turns most of them away before noon. {actor} joins the line holding one argument for why the spell should go to {them} and not to the six people ahead.',
        onSuccess: {
          narrative: '{actor} asks for a narrow spell instead of a famous one, and names the exact use. The mage puts down the pen — a request that specific means the asker has already done the reading.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} asks for too much at once, and the mage hears a petitioner who does not know what the asking costs. The interview ends politely and early.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'spell_bargain.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The mage names a price, and it is not coin. It is a year of service, or a name, or a debt payable on demand — and {actor} has to work out which of the three costs least in the end.',
        onSuccess: {
          narrative: '{actor} counters with the debt and adds a limit: one call, inside five years. The mage takes it, because a bounded debt is worth more than an open one nobody ever collects.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} offers coin against a price that was never about coin. The mage does not argue the point, and the spell stays on the shelf it has sat on for thirty years.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'spell_bargain.binding',
        name: 'The Binding',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The binding takes four hours and cannot be paused. {actor} holds still while the shape of the spell is worked into a place that was not built to hold it, and it is felt the entire time.',
        onSuccess: {
          narrative: '{actor} holds through the fourth hour without breaking the posture. The spell settles where it was put, and afterwards {they} find{s} it by reaching — as a hand finds a tool left in the same place each night.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
        onFailure: {
          narrative: '{actor} moves in the third hour — a small shift, and enough. The spell fails to seat and comes apart, and the ache of a binding that half-took stays for a month afterwards.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.war_trophy',
    name: 'The War Trophy',
    locationTypes: ['battleground', 'fort', 'castle'],
    sublocationTypes: ['sublocation-type.barracks'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'acquire',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'war_trophy.claim',
        name: 'The Claim',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The field has been quiet for an hour and the collecting has started. The banner is still where it fell, and four people have walked past it without picking it up, each waiting to see who moves first.',
        onSuccess: {
          narrative: '{actor} picks it up and does not hurry. Lifting a banner slowly, in front of witnesses, is how a claim becomes a fact instead of a theft.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} reaches a half-step behind someone else, and two hands close on the staff at once. Two claims on one banner, with an audience — this will not be settled by talking.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'war_trophy.contest',
        name: 'The Contest',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The rival holds the staff and will not swing first, which means this gets settled in front of the witnesses rather than between the two of them. {actor} starts building the case the witnesses will accept.',
        onSuccess: {
          narrative: '{actor} names the two people who saw the banner fall and asks them, out loud, who reached it first. The rival lets go rather than be told the answer by a crowd.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The witnesses do not remember it as {actor} needs them to. The rival walks off with the banner, and the version of the afternoon that gets told afterwards is the rival\'s.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'war_trophy.possession',
        name: 'The Possession',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'A banner is only cloth until people start acting as though it decides who they follow. Within a week two parties have sent word asking after it, and one of them did not ask politely.',
        onSuccess: {
          narrative: '{actor} keeps it in the open where it can be seen, and keeps the ground around it clear. Both parties send a second message; neither sends anyone.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
        onFailure: {
          narrative: 'The second party comes at night and does not come to talk. {actor} keeps a life and loses a banner, and within the month it flies over a camp two valleys away.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.sacred_offering',
    name: 'The Sacred Offering',
    locationTypes: ['shrine', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'acquire',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'sacred_offering.preparation',
        name: 'The Preparation',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The shrine takes offerings but names no price, which makes it harder rather than easier. {actor} has to choose an object whose loss will actually be felt — the giving is the measure, not the goods.',
        onSuccess: {
          narrative: '{actor} brings the good knife rather than the spare. It is the one that would be missed, which is the only test the shrine applies.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} brings what was easiest to spare, and it sits on the stone looking exactly like what it is. The shrine stays a shrine and does not become more than that.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'sacred_offering.ritual',
        name: 'The Ritual',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The words are fixed and short, and everyone in the valley knows them. Which means the words carry no weight on their own — all that is left to bring is meaning them.',
        onSuccess: {
          narrative: '{actor} says the fixed words slowly enough to hear them. Halfway through the second line the air in the shrine goes cold, and it stays cold until the last word is out.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} gets through the words at speed, correct in every syllable. The air does not change. The knife stays on the stone, and it is still a knife.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'sacred_offering.blessing',
        name: 'The Blessing',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'What comes back is not a gift. It is an exchange, and the shrine names its half plainly: a year off the far end of {actor}\'s life, taken now rather than then.',
        onSuccess: {
          narrative: '{actor} agrees to the year and feels it go — not as pain, but as a subtraction, like a coin counted out of a purse in the dark. What arrives in its place is warm, and it stays.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
        onFailure: {
          narrative: '{actor} does not agree to the year. The cold leaves the shrine all at once, and the knife stays on the stone — {actor} finds {they} cannot pick it up again.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.rare_material',
    name: 'The Rare Material',
    locationTypes: ['mining', 'camp', 'wilderness', 'unexplored_poi'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'rare_material.search',
        name: 'The Search',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The seam is supposed to run under this slope, on the word of a survey forty years old and one man who says his father worked it. {actor} has three days of daylight to test both claims.',
        onSuccess: {
          narrative: '{actor} follows the wet line down the slope instead of the old survey marks, and finds the seam exposed where a winter\'s runoff cut the bank back.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} works the slope for three days and turns up country rock and more country rock. The survey was forty years old, and the man\'s father may have meant a different slope entirely.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'rare_material.extraction',
        name: 'The Extraction',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The seam runs under grazing land, which makes this two problems. The rock has to come out without bringing the slope with it, and the family that grazes the slope has to agree to let it happen.',
        onSuccess: {
          narrative: '{actor} settles with the family on a share of the take rather than a flat fee, which costs more and ends the argument. The rock comes out in clean blocks over eight days.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} cuts too close to the fault and the seam comes out as gravel. It is the same rock at a fraction of the price, and the family watched the whole eight days of it.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'rare_material.transport',
        name: 'The Transport',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'Eleven days to the buyer, four of them through country where the roads are a courtesy. A loaded cart moves at the speed of its worst stretch and is visible from a long distance off.',
        onSuccess: {
          narrative: '{actor} moves in short stages and pays for company on the two worst days. The load arrives whole, and the buyer honours the price agreed before the seam was proven.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'The axle goes on the fourth day, in the stretch with no houses on it. By the time {actor} reaches the buyer the load is two-thirds of what left, and the price has moved against {them} besides.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#survival'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.forbidden_tome',
    name: 'The Forbidden Tome',
    locationTypes: ['tower', 'ruins', 'capital'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'acquire',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'forbidden_tome.location',
        name: 'The Location',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The book is in no catalogue, which is itself a record of a kind. {actor} works backwards from the people who have cited it, and three of the four citations lead to the same private library.',
        onSuccess: {
          narrative: 'The fourth citation names a room. {actor} finds the house on a tax roll and the room on a builder\'s plan, and both are still standing.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Every citation leads to another citation, and the chain runs out in a letter that references the book without saying where it sat. The trail is not cold so much as circular.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'forbidden_tome.infiltration',
        name: 'The Infiltration',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The room is warded and the house is staffed. The wards are old enough to be predictable and the staff are not, which reverses the usual order of the problem.',
        onSuccess: {
          narrative: '{actor} goes in during the hour the house is loudest, when the staff are all accounted for elsewhere and one more set of footsteps is only the house being used. The wards read the footsteps as household.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A maid comes up the back stairs an hour early. {actor} is out of the house before the shouting organises into a search, and the room will be watched from tonight onward.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'forbidden_tome.claiming',
        name: 'The Claiming',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The book comes off the shelf harder than it should, as though the shelf holds an opinion about it. {actor} has the rest of the loud hour to be out of the house with it.',
        onSuccess: {
          narrative: '{actor} gets it into a grain sack and walks out through the kitchen door with the rest of the evening\'s traffic. The house will not know the book is gone for a month, and by then {actor} will have read it.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#ancient', '#arcane'],
          },
        },
        onFailure: {
          narrative: 'The book comes off the shelf and the wards read it leaving. {actor} drops it on the stairs and takes the window, and the last sight of it is a servant setting it back in its place with a cloth over both hands.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#ancient', '#arcane'],
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // CREATE (5 new templates; trial_of_flame is already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.brew_potion',
    name: 'The Brew Potion',
    locationTypes: ['hamlet', 'shrine', 'camp', 'ruined_village'],
    reachPrimary: 'gold',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'brew_potion.gathering',
        name: 'The Gathering',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        narrative: 'The recipe calls for three herbs that grow nowhere convenient — one in standing water, one in deep shade, one only where a tree has fallen and rotted. {actor} goes out with a basket and a long afternoon.',
        onSuccess: {
          narrative: '{actor} comes back with all three, and the third one twice, because the first was picked too young.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Two of the three, and the third replaced with a cousin close enough to argue about. The recipe will notice.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'brew_potion.brewing',
        name: 'The Brewing',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'The blend goes in in order and at heat, and the asking is done aloud. {actor} keeps {their} voice level and adds the shade-herb last.',
        onSuccess: {
          narrative: 'The surface goes still, and stays still when the pot is knocked. The asking was answered.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The mixture separates and stays separated. Oil on top, grit at the bottom, and no magic in either.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'brew_potion.distillation',
        name: 'The Distillation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'What is in the pot is a cauldron of medicine. What is wanted is one vial. The reduction takes hours, and the magic burns off before the water does.',
        onSuccess: {
          narrative: '{actor} stops the reduction one breath before the colour turns, and bottles it warm. One vial, holding everything the cauldron held.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'It reduces past the point of return while {actor}\'s back is turned. What is left in the pot is a black ring, and the ring is all of it.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#veil'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.inscribe_ward',
    name: 'The Inscribe Ward',
    locationTypes: ['tower', 'temple', 'ruins', 'ruined_tower'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'inscribe_ward.knowledge',
        name: 'The Knowledge',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        narrative: 'The ward is old enough that nobody living has drawn it correctly. {actor} starts where anyone would: with the books, and with the three of them that disagree.',
        onSuccess: {
          narrative: 'The disagreement turns out to be the answer. Two of the books copied a mistake; the third copied the ward. {actor} can draw it now.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The books agree on the outer ring and part company after that. {actor} closes them knowing the shape and not the sequence, which is the half that matters.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'inscribe_ward.inscription',
        name: 'The Inscription',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Forty-one marks, and the ward reads them in the order they were cut. {actor} works from the outside in, one mark to a sitting, hand braced against the stone.',
        onSuccess: {
          narrative: 'The last mark closes the ring, and the whole inscription settles half a hair deeper into the stone. The ward is awake.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The thirty-second mark runs long. It is a finger\'s width of extra line, and it makes the ward a decoration.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'inscribe_ward.activation',
        name: 'The Activation',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'A cut ward is a drawing until it is tied to the ground it sits on. The tying is done at night, out loud, and cannot be attempted twice.',
        onSuccess: {
          narrative: 'The air over the stone goes cold and stays cold. What comes at this place from now on will have to be invited.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#arcane'],
          },
        },
        onFailure: {
          narrative: 'The binding takes hold of the ground instead of the ward. The marks go grey from the centre outward, and by morning the stone is only stone.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#arcane'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.compose_saga',
    name: 'The Compose Saga',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'compose_saga.inspiration',
        name: 'The Inspiration',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        narrative: 'A saga needs a spine — one true detail the rest can hang from. {actor} spends three days looking for it in other people\'s stories.',
        onSuccess: {
          narrative: 'It turns up in the part nobody thought was the point: a man who went back for a dog. The saga arranges itself around that.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Every story {actor} turns up belongs to whoever told it first, and they told it better. Three days, and no spine.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'compose_saga.composition',
        name: 'The Composition',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'The spine is the easy part. What it needs now is four hundred lines that scan, in a meter a drunk room can still follow.',
        onSuccess: {
          narrative: 'It comes out in one long sitting and needs almost no cutting. {actor} reads it back at a whisper, and the meter holds from the first line to the last.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The lines scan and land flat. {actor} has written four hundred of them about a man and a dog, and left out why he went back.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'compose_saga.performance',
        name: 'The Performance',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'A hall with too many people in it and the beer already sold. {actor} has one verse to make them stop talking.',
        onSuccess: {
          narrative: 'The room goes quiet at the fourth line and stays quiet. When it ends nobody claps for a moment, which is better than clapping.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: {
          narrative: 'The room never stops talking. {actor} finishes it anyway, to the front two tables, and the landlord does not ask for a second night.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.craft_talisman',
    name: 'The Craft Talisman',
    locationTypes: ['shrine', 'camp', 'wilderness', 'unexplored_poi'],
    reachPrimary: 'veil',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'craft_talisman.communion',
        name: 'The Communion',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        narrative: 'A talisman is a house with a tenant, and the tenant is asked first. {actor} sits down where the spirit already lives and waits to be noticed.',
        onSuccess: {
          narrative: 'It comes close enough to be felt on the skin, and it stays. The tenant has agreed.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} sits until the light goes. The spirit is present the entire time and does not answer.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'craft_talisman.creation',
        name: 'The Creation',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'The house has to be built to fit. Bone, wire, and a stone the spirit picked out, worked small enough to hang from a neck.',
        onSuccess: {
          narrative: 'The pieces close around the stone and the weight changes in {actor}\'s palm. Heavier than it was, and warmer.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The wire is set a hair too tight. The stone cracks, the tenant leaves, and the rest comes apart in {actor}\'s hands.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'craft_talisman.binding',
        name: 'The Binding',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'The last of it is an oath, said once, with terms on both sides. {actor} names what the spirit is given and what it is owed.',
        onSuccess: {
          narrative: 'The oath closes. The talisman goes quiet against the skin, and stays warm long after it should have cooled.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#arcane'],
          },
        },
        onFailure: {
          narrative: '{actor} names a term the spirit will not take. It is gone before the sentence finishes, and what is left is bone, wire, and a cold stone.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#arcane'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.raise_monument',
    name: 'The Raise Monument',
    locationTypes: ['capital', 'city', 'battleground'],
    reachPrimary: 'stone',
    reachSecondary: 'star',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.create,
    steps: [
      {
        id: 'raise_monument.design',
        name: 'The Design',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 3,
        narrative: 'The commission is a monument. The argument is what it is a monument to. {actor} draws until the drawing answers that, then draws it again in stone thicknesses.',
        onSuccess: {
          narrative: 'The final drawing is plainer than the first six and reads from across a square. It will still read in two hundred years.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The drawing is busy and clever and makes four points at once. From across the square it will make none of them.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'raise_monument.construction',
        name: 'The Construction',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Forty hands, two seasons, and a quarry that ships short. {actor} spends more days arguing about stone than standing over it.',
        onSuccess: {
          narrative: 'The courses go up square, and the quarry is shamed into honest loads. It stands finished a week before the frost.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The base is laid on ground nobody tested. It settles unevenly over the winter, and by spring the crew has taken other work.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'raise_monument.dedication',
        name: 'The Dedication',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'A monument becomes a monument when a crowd agrees it is one. The dedication is short, public, and cannot be given twice.',
        onSuccess: {
          narrative: '{actor} keeps it to four sentences and names the dead correctly. People come back to it the next day without being told to.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
        onFailure: {
          narrative: 'The speech runs long and names the wrong family first. The stone is standing. Nobody stops at it.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // HIRE (6 templates, all new)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.recruit_militia',
    name: 'The Recruit Militia',
    locationTypes: ['hamlet', 'town', 'farmland', 'ruined_village', 'battleground'],
    reachPrimary: 'heart',
    reachSecondary: 'iron',
    encounterType: 'hire',
    reputationPolarity: 'positive', // lawful community defense recruitment (2a)
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'recruit_militia.selection',
        name: 'The Selection',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (hire-family batch).
        // Register: a hire buys a promise, and the promise is only priced when keeping it
        // costs the hired party something. Calibrated against `encounter.trial_by_combat`
        // (THR-1036). Militia are the family's cheapest contract and its least enforceable.
        narrative: 'The call goes out at the mill and again at the well. {actor} watches who comes: a smith\'s daughter with a cooper\'s forearms, two brothers who arrive already arguing, an old man who fought once and wants to be asked again. Half of them are here because the harvest is in and the winter is long.',
        onSuccess: {
          narrative: '{actor} takes eleven and turns away nine, and does it in the open so the reasons are on the record. The nine grumble. The eleven stand straighter for having been chosen in front of witnesses.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Six come forward, and two of those are boys lying about their age. {actor} takes the four who are not, and does not say aloud that four is not a militia.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'recruit_militia.training',
        name: 'The Training',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'A militia is not made of willing people. It is made of people who will hold a line on the third bad day. {actor} drills them in the stubble field until the shapes stop being instructions and start being habits.',
        onSuccess: {
          narrative: 'By the eighth day they form up without being told twice, and the brothers have stopped arguing where the others can hear. It is not discipline yet. It is the habit that discipline is built out of.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} pushes past what farmers will take from an outsider. Three stop coming. The rest keep coming and keep their hands in their pockets, which is worse than the three.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'recruit_militia.commitment',
        name: 'The Commitment',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Drill is cheap. {actor} asks them to swear to muster when the horn goes — in weather, at night, with the crop standing in the field. Every face in the line does the arithmetic.',
        onSuccess: {
          narrative: 'They swear one at a time rather than together, which takes most of an afternoon and means more for taking it. The old man swears last and holds {actor}\'s wrist a moment afterward, a soldier\'s habit older than the oath.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The oath asks for the crop, and they will not give the crop. They will muster if the fighting reaches their own fields and not a mile past, and they say so to {actor}\'s face without shame. It is a fence, not a militia.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.sway_mercenary',
    name: 'The Sway Mercenary',
    locationTypes: ['camp', 'battleground', 'fort'],
    reachPrimary: 'gold',
    reachSecondary: 'iron',
    encounterType: 'hire',
    reputationPolarity: 'positive', // legitimate mercenary hire — above-board offer with fair terms (2a)
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'sway_mercenary.approach',
        name: 'The Approach',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (hire-family batch). Mercenaries are
        // the family thesis at its plainest — coin buys attendance, and the contract is
        // tested on the day walking away pays better than staying.
        narrative: 'The band is camped where the road forks, which is a decision about tolls as much as water. {actor} comes in daylight, alone, with the coin visible and the terms short. The captain lets {them} stand a while before a stool is pushed out with a boot.',
        onSuccess: {
          narrative: 'The captain hears the number and does not laugh, which is the whole of the first hurdle. A cup is filled without being asked for. The talking starts.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The number is low enough to be an insult, and {actor} learns this from the captain\'s face before the sentence is finished. The stool stays where it is. The camp goes back to its business around {them}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'sway_mercenary.negotiation',
        name: 'The Negotiation',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The captain has forty swords and a reputation for delivering exactly what was paid for, no less and never more. {actor} argues over the line where the contract ends, which is where the argument always is.',
        onSuccess: {
          narrative: 'They settle it in writing: what the band will do, what it will not, and what happens if the fighting outlasts the coin. The captain signs, and remarks that most employers skip the third clause and are surprised later.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} presses for a clause the captain will not sell — an obligation that outlasts the payment. The captain stands. Two of the band drift in behind {actor}\'s shoulder, unhurried, and the terms of the conversation change.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'sway_mercenary.loyalty',
        name: 'The Loyalty',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The band takes half in advance, which is standard, and half on completion, which is where employers get clever and mercenaries get careful. {actor} has to decide how much of the second payment to hold back.',
        onSuccess: {
          narrative: '{actor} pays a third of the remainder early and unasked. The captain does the arithmetic aloud — the band now loses more by leaving than by staying — and grins at having been handled well. Loyalty is not what the coin buys. The price of walking is.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} holds the entire balance to the end, which is prudent and reads as distrust. The band honours the letter of the contract for eleven days. On the twelfth a better offer arrives from the other side, and the letter of the contract has no clause about that.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.court_noble',
    name: 'The Court Noble',
    locationTypes: ['capital', 'city', 'castle'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'hire',
    reputationPolarity: 'positive', // legitimate courtly employment — service rendered by merit (2a)
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'court_noble.presentation',
        name: 'The Presentation',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (hire-family batch). The court is the
        // family run backwards — here the noble is the buyer, and the price is quoted in
        // obligations rather than coin.
        narrative: 'The audience runs the length of a candle-mark and {actor} is fourth in a line of six. The three ahead are all asking for money. {actor} spends the wait learning what boredom looks like on this particular face, so as to recognise it later.',
        onSuccess: {
          narrative: '{actor} states the case in under a minute and stops talking while the noble is still interested. The candle has barely moved. The noble asks a question — the first real one of the afternoon — and the steward reaches for a pen.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} talks well past the point where the case was already made. The noble\'s attention withdraws in stages, politely, and by the end is being performed for the room. The steward\'s pen does not move.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'court_noble.demonstration',
        name: 'The Demonstration',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Claims are cheap in a hall built to receive them. The noble sets {actor} a real problem out of the estate\'s own accounts — a mill that has lost money for two years under three different managers — and allows until evening.',
        onSuccess: {
          narrative: '{actor} has it by supper: the mill is sound, and the cartage contract is the theft. The noble reads the page twice, then looks up with the expression of a person revising an estimate upward.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} presents an answer that is tidy, plausible, and about the wrong half of the ledger. The noble declines to correct {them} in front of the room, which is a courtesy, and asks no second question, which is the verdict.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'court_noble.service',
        name: 'The Service',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The offer, when it comes, is generous, and it is a leash. Retainer, lodging, the house\'s name standing behind {actor}\'s own — and the house\'s enemies inherited entire, and the expectation that {they} will be in this hall whenever the hall calls.',
        onSuccess: {
          narrative: '{actor} takes the position and negotiates two days a month that belong to no one but {them}. The noble allows it, amused, and has it entered in the book. Both parties understand that being written down is what makes it real.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} will not hand over the calendar, and the noble will not pay a retainer to a servant who keeps a door open. The refusal is received courteously and remembered precisely. The house\'s name goes to a candidate with fewer conditions attached.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.bind_spirit',
    name: 'The Bind Spirit',
    locationTypes: ['shrine', 'temple', 'tower'],
    reachPrimary: 'veil',
    reachSecondary: 'veil',
    encounterType: 'hire',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'bind_spirit.summoning',
        name: 'The Summoning',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (hire-family batch). Same arithmetic as
        // the mercenary contract, with a counterparty that reads the terms more carefully
        // than the employer does. Uncanny, not pyrotechnic — the register canon's hard rule.
        narrative: '{actor} sets the circle in the old manner: salt, iron filings, and the name spoken once and not repeated. The temple is cold when {they} begin{s} and stays exactly as cold. Calling is the easy half. Being worth an answer is the other.',
        onSuccess: {
          narrative: 'The candle flames lean in toward the circle against the draught, and go on leaning. What has come does not show itself. It waits to hear why it was disturbed.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The circle holds and the room stays as it was. {actor} speaks the name a second time, which the old manner forbids, and the silence that follows has the quality of having been considered and declined.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'bind_spirit.negotiation',
        name: 'The Negotiation',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The spirit wants what it cannot reach unaided, and it will not name that until {actor} has offered first. Every offer teaches it more about {actor} than {they} learn{s} in return.',
        onSuccess: {
          narrative: 'They settle on years — a count of {actor}\'s own, paid at the end rather than the beginning. The spirit accepts with an eagerness that {actor} files away to examine later.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} offers memory, then blood, then service, and each is declined with the patience of a creature that has nowhere else to be. The last refusal comes with a suggestion of what would be accepted instead. {actor} has not the stomach for it.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'bind_spirit.binding',
        name: 'The Binding',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The binding is one sentence and every word of it bears load. {actor} must say what the spirit will do, for how long, and on what release — aloud, once, with no correction permitted afterward.',
        onSuccess: {
          narrative: '{actor} names the terms cleanly and leaves no clause to lean on. The cold goes out of the room all at once. What remains is bound, and attends, and is not tame.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} says "until I have no further need of you" and hears the flaw in it a heartbeat too late. The binding takes. It will hold for precisely as long as the spirit agrees the need is real, and the spirit is now the judge of that.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.rally_faithful',
    name: 'The Rally Faithful',
    locationTypes: ['temple', 'shrine', 'town'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'hire',
    reputationPolarity: 'positive', // lawful religious community organization — communal and voluntary (2a)
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'rally_faithful.preaching',
        name: 'The Preaching',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (hire-family batch). The unpaid hire —
        // belief is the currency here, which makes it cheap to raise and impossible to bank.
        narrative: 'The temple seats ninety and about sixty come, most of them out of habit rather than heat. {actor} has one sermon in which to turn attendance into intent, and this congregation has sat through a great many sermons.',
        onSuccess: {
          narrative: '{actor} stops preaching about the god and starts preaching about the road outside, and the room changes temperature. Afterward nobody leaves promptly. They stand in the aisle asking what happens next.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The sermon is correct in every particular and moves no one. The congregation files out on time and kindly, the manner of a room emptying after a duty has been discharged.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'rally_faithful.organization',
        name: 'The Organization',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Fervour keeps badly. {actor} has until the week takes the heat out of them to give sixty willing people specific work with names written against it.',
        onSuccess: {
          narrative: 'By the third day there is a roster, a store of grain in the undercroft, and an argument about who holds the keys — which {actor} counts as the best of the three signs. People argue about keys once the work has become theirs.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} keeps every decision in {their} own hands, and sixty people stand about waiting to be told. Willingness does not survive going unused. By the week\'s end it is thirty, and the thirty have come to watch.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'rally_faithful.mission',
        name: 'The Mission',
        reach: 'spirit',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The ask is real now: a fortnight\'s walk, at their own cost, to a place with a reputation. {actor} puts it to them plainly rather than beautifully, because they will be a long distance from the beautiful version by the time it gets hard.',
        onSuccess: {
          narrative: 'Twenty-two go, and they are not the twenty-two {actor} expected — the loudest stay home and the quiet ones pack. They leave before dawn to avoid a send-off. Faith that declines an audience is the kind that arrives.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} asks for the fortnight and the room finds its reasons: the season, the children, a duty at home. None of the reasons are lies. The congregation keeps its faith, and keeps it here, where it costs a morning a week.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.hire_guide',
    name: 'The Hire Guide',
    locationTypes: ['wilderness', 'oasis', 'camp', 'unexplored_poi'],
    reachPrimary: 'star',
    reachSecondary: 'gold',
    encounterType: 'hire',
    reputationPolarity: 'positive', // above-board guide hire for legitimate expedition (2a)
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'hire_guide.search',
        name: 'The Search',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (hire-family batch). The family's
        // cheapest contract and the one whose counterparty is hardest to test before the
        // money is spent — competence here is only demonstrable once it is too late to shop.
        narrative: 'Four people at the waystation claim the route, and three of them claim it confidently. {actor} listens for the one who mentions the dull parts — which water is reliable, which stretch takes two days rather than the one it looks like.',
        onSuccess: {
          narrative: 'The guide {actor} settles on is the one who talked about grass: where it fails in a dry year, and what that does to the timing. It is knowledge a person only gets by having been out there in one.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} hires the confident one. The confidence survives the first day, which is flat and well-marked and contains no test at all.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'hire_guide.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The guide asks a flat fee, half in advance. {actor} counters with less in advance and a bonus on arrival — the same coin, arranged so that some of it still matters on the fourth day.',
        onSuccess: {
          narrative: 'They settle slightly above what {actor} wanted and comfortably short of insult, with the bonus tied to the day of arrival rather than the fact of it. The guide starts talking about the route unprompted, which is the first work done for free.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The haggling runs three rounds past where it should have stopped, and {actor} wins the rate. The guide takes the job at a price {they} resent{s} being offered, and resentment is a poor navigator.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'hire_guide.journey',
        name: 'The Journey',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'On the fourth day the route stops matching the ground under it. {actor} has to judge whether the guide is wrong or the season has moved the water since the last crossing — and the guide is the only source of either answer.',
        onSuccess: {
          narrative: 'The guide admits to being uncertain before the uncertainty gets expensive. They lose half a day locating the crossing instead of two days committing to the wrong one. {actor} pays the bonus at the gate and asks about the return leg.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The guide holds to the described route for another day and a half rather than own a bad turn. They arrive four days late and short of water, and the fee is the smallest part of what the delay costs {actor}.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // DUEL (6 new; warlords_crucible is already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.tavern_brawl',
    name: 'The Tavern Brawl',
    locationTypes: ['town', 'hamlet', 'camp', 'ruined_village'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    secretDiscovery: { onSuccess: true, sourceName: 'observation' },
    steps: [
      {
        id: 'tavern_brawl.provocation',
        name: 'The Provocation',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (duel-family batch).
        narrative: 'A drunk at the long table has decided {actor} is worth insulting, and has an audience for it. The room quiets by half, the way rooms do.',
        onSuccess: {
          narrative: '{actor} says almost nothing and does not move. The drunk runs out of material, and his friends develop an interest in their drinks.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} answers in kind, which is the one reply that could not be walked back. The drunk swings before the sentence lands.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'tavern_brawl.fighting',
        name: 'The Fighting',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The table goes over. The drunk has three friends, the room has no room, and every one of them stands between {actor} and the door.',
        onSuccess: {
          narrative: '{actor} works close, where numbers matter less. All four end up on the boards, and {actor} is bleeding from the ear and still upright.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} goes under the weight of them. The night ends face down on the cobbles with the door shut behind {them}.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'tavern_brawl.aftermath',
        name: 'The Aftermath',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The keeper comes out of the back with a ledger and a look. Broken furniture is a number, and the number is coming to {actor}.',
        criticalSuccessAfterimage: '{actor} not only settles the keeper\'s rage but leaves the tavern better than {they} found it — the broken table replaced, a song started, {their} name buying a round it did not pay for. This becomes the house\'s favorite story about the night everything nearly went wrong.',
        criticalFailureAfterimage: 'The keeper\'s anger finds a footing {actor} cannot argue past, and by morning the whole town has the tale — the stranger who broke the place and could not make it right. The doors that matter here shut ahead of {them}.',
        onSuccess: {
          narrative: '{actor} pays the number without arguing it, then pays a little past it. The keeper puts the ledger away and pours {them} one on the house.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor} has no coin and no argument the keeper wants to hear. The banning is done at volume, in front of everyone who watched the fight.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.arcane_duel',
    name: 'The Arcane Duel',
    locationTypes: ['tower', 'temple', 'ruins'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'arcane_duel.challenge',
        name: 'The Challenge',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (duel-family batch).
        narrative: 'A mage lays a challenge down in front of witnesses, phrased so that refusing it is also an answer. The room waits to see which one {actor} gives.',
        onSuccess: {
          narrative: '{actor} accepts flatly, without dressing it up. The mage reconsiders the shape of his afternoon.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} accepts a beat too late and a word too carefully. The mage smiles at the pause, having already learned what he came to learn.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'arcane_duel.casting',
        name: 'The Casting',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'It is not a contest of force. Each of them shapes the air and waits to see what the other does about it, and the cost is paid in attention.',
        onSuccess: {
          narrative: '{actor} holds the working longer than the mage expects and turns it back on him. He gives ground across the flagstones, one careful step at a time.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s working comes apart at the seam. What the mage sends after it does not miss, and {actor} gives up the floor to keep {their} feet.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'arcane_duel.victory',
        name: 'The Victory',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Both of them are down to one working apiece, and both know it. The next thing either of them does will be the last thing.',
        onSuccess: {
          narrative: '{actor} goes first and goes through. The mage\'s guard folds, and he says the word for surrender in the old form, which costs him more than the duel did.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
            tagFilters: ['#arcane'],
          },
        },
        onFailure: {
          narrative: '{actor} goes first and comes up short by a hand\'s breadth. The counter lands clean, and the flagstones arrive faster than expected.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
            tagFilters: ['#arcane'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.arena_combat',
    name: 'The Arena Combat',
    locationTypes: ['city', 'capital', 'battleground'],
    reachPrimary: 'iron',
    reachSecondary: 'star',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'arena_combat.entry',
        name: 'The Entry',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (duel-family batch).
        narrative: 'The gate lifts onto sand that has been raked and does not look it. The crowd has been drinking since noon and wants a name to shout.',
        onSuccess: {
          narrative: '{actor} walks the sand slowly and gives them the pause before giving them the name. By the far wall the noise has turned into a chant.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} comes out too fast, and the crowd reads it as nerves. The chant that starts is not the one {actor} wanted.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'arena_combat.combat',
        name: 'The Combat',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Two of them, sent in staggered so the second arrives while {actor} is busy. The sand is deep along the wall, and everyone in the stands knows it.',
        onSuccess: {
          narrative: '{actor} takes the first at the edge of the deep sand and the second before he finishes turning. It ends quickly enough that the crowd feels cheated and cheers regardless.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} is worked toward the deep sand and spends the whole bout staying out of it. Both of them are still standing when the horn goes.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'arena_combat.triumph',
        name: 'The Triumph',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} is the last one upright, which in this place is a question rather than an answer. The crowd decides what it saw, and the crowd is not reliable.',
        onSuccess: {
          narrative: '{actor} raises a hand and the stands come apart. By evening there are three versions of the fight in the wine shops, and all of them are generous.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s legs go on the walk back, and the noise turns while the gate is still ahead of {them}. Two attendants carry {them} out under it.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.shadow_ambush',
    name: 'The Shadow Ambush',
    locationTypes: ['ruins', 'wilderness', 'camp', 'unexplored_poi'],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'shadow_ambush.detection',
        name: 'The Detection',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (duel-family batch).
        narrative: 'A stone turns over somewhere behind and to the left, and then does not turn over again, which is worse. Someone has been walking in {actor}\'s footsteps for a while.',
        onSuccess: {
          narrative: '{actor} stops walking and turns before the killer expects it. The advantage he bought over the last mile is gone in one step.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} keeps walking. The first {actor} knows of him is a hand on the shoulder and a blade already moving.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'shadow_ambush.combat',
        name: 'The Combat',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'He fights the way ambushers do once the ambush is gone — close, fast, and already looking for the exit. There is no ground here that favors either of them.',
        onSuccess: {
          narrative: '{actor} gets inside his reach and stays there. He breaks off with a ruined arm and takes the dark with him.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} covers the wrong line twice. The second cut goes deep along the ribs, and the dark is suddenly all his.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'shadow_ambush.pursuit',
        name: 'The Pursuit',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'He is wounded and running, and wounded men leave a line to follow. Following it into the ruins is exactly what he would want.',
        onSuccess: {
          narrative: '{actor} follows the blood and does not follow it into the obvious place. He is waiting in the second-most obvious one, and it goes badly for him.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor} loses the line at the treeline and casts about until the light goes. The assassin is clear, and he has {actor}\'s face now.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.trial_by_combat',
    name: 'The Trial By Combat',
    locationTypes: ['castle', 'fort', 'capital'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'trial_by_combat.accusation',
        name: 'The Accusation',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1036: authored out of the `{adj}`/`{verb}` mad-lib shape. The word pools now
        // resolve corpus-wide, but a template the player was reported reading deserves
        // written prose, not a substitution that happens to be grammatical.
        narrative: 'The charge is read twice — once in law, once in plain words — so nobody can claim they misheard it. {actor} is offered the old remedy: answer it in court, or answer it with a blade.',
        onSuccess: {
          narrative: '{actor} answers without raising {their} voice. The court had prepared for shouting, and the quiet unsettles it more.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} says too much, and the wrong parts of it. By the time {they} stop{s}, half the room has already decided, and the trial is a formality with swords in it.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'trial_by_combat.combat',
        name: 'The Combat',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The floor is cleared and sanded for grip. The accuser has fought on these boards before and knows which ones give. {actor} learns them at speed.',
        onSuccess: {
          narrative: '{actor} ends it in three exchanges. The accuser stays down, still breathing — which the court notes, and the crowd resents.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The accuser is patient and {actor} is not. A shoulder gives, then a knee, and the sand takes the rest. {actor} is still alive when it stops, which the room reads as its own verdict.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'trial_by_combat.judgment',
        name: 'The Judgment',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Winning the fight is not the same as winning the case, and the court takes its time making that clear. The judges confer behind a screen while {actor} waits in the sand.',
        onSuccess: {
          narrative: 'The verdict comes back innocent. Nobody uses the word proven. {actor} is free to go, and free to notice who will not meet {their} eye on the way out.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: 'The court rules the victory a technicality and sentences {actor} anyway. The law is satisfied. Nobody in the room pretends justice is.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.honor_duel',
    name: 'The Honor Duel',
    locationTypes: ['castle', 'capital', 'fort'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'honor_duel.insult',
        name: 'The Insult',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (duel-family batch).
        // Sits directly beside `encounter.trial_by_combat`, the THR-1036 exemplar, so the
        // register is calibrated against it rather than derived independently.
        narrative: 'The noble makes it loud enough to carry and light enough to deny, which is the craft of it. The room turns to see whether {actor} knows the difference.',
        onSuccess: {
          narrative: '{actor} answers in the same register and no louder, and the denial stops being available. The seconds are named before the wine is finished.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} answers too plainly for a room that runs on the other thing. The insult is left standing, and the court agrees, without discussing it, that it heard no such remark.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'honor_duel.preparation',
        name: 'The Preparation',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'A day to prepare — enough time to get ready, and far too much time to think. {actor}\'s seconds settle the ground, the hour, and the blades.',
        onSuccess: {
          narrative: '{actor} sleeps, eats, and works the wrist until it stops complaining. By dawn the waiting has been spent rather than endured.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} spends the night rehearsing the duel and arrives having already lost it several times. The wrist is ready. {actor} is not.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'honor_duel.engagement',
        name: 'The Engagement',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Frost on the grass, and a surgeon standing well back with a bag he expects to open. The noble has done this before and is in no hurry.',
        onSuccess: {
          narrative: '{actor} takes the noble\'s arm on the third pass and stops there, which is a choice every witness can see being made. The court will talk about the stopping, not the cut.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor} is put on the grass in under a minute. The surgeon does his work while the noble accepts congratulations a polite distance away.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // STEAL (4 new; shadow_hunt is already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.pickpocket',
    name: 'The Pickpocket',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'pickpocket.selection',
        name: 'The Selection',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The market runs on habit. {actor} finds a post by the cloth-seller where two lanes cross, and watches which purses ride loose and which ride under a hand.',
        onSuccess: {
          narrative: 'A wool-buyer counts coin twice and puts it away once. {actor} marks the pocket, and the shoulder that guards it.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The crowd thins before {actor} settles on a mark, and the ones left are the ones who have been robbed before. They all walk with a hand on the seam.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'pickpocket.approach',
        name: 'The Approach',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} needs to arrive at the wool-buyer\'s elbow without appearing to have crossed the square to get there. The trick is to be carried, not to walk.',
        onSuccess: {
          narrative: '{actor} joins a knot of people arguing over dye prices and steps out of it at the right elbow. Nobody notices an arrival that came with a crowd.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} closes a half-step too directly, and the wool-buyer turns to see who is standing there. The pocket goes under an arm and stays there.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'pickpocket.extraction',
        name: 'The Extraction',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The purse sits four inches down, and the cloth is stiff enough to hold its shape once the weight is gone. {actor} has the length of one transaction to work in.',
        onSuccess: {
          narrative: 'Two fingers, a wrist turn, and the weight is gone before the cloth remembers it. {actor} is three stalls away before the wool-buyer reaches for coin that is no longer there.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s knuckle catches the seam. The wool-buyer has hold of {their} wrist before the purse clears the pocket, and the shouting brings the whole lane around.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.vault_heist',
    name: 'The Vault Heist',
    locationTypes: ['castle', 'capital', 'tower'],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'vault_heist.planning',
        name: 'The Planning',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The vault sits under the counting-house, with one stair down and no other opening anyone will admit to. {actor} spends the week learning the building\'s habits instead of its locks.',
        onSuccess: {
          narrative: 'The night clerk drinks at the eighth bell and the relief comes at the ninth. That hour is the whole plan, and {actor} writes the rest of it backwards from there.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} learns the stair, the clerk, and the bell, and never learns what the second key opens. The plan has a hole in it shaped like a door.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'vault_heist.infiltration',
        name: 'The Infiltration',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The stair is stone and carries every step to the room above it. {actor} goes down it in the ten breaths between the bell and the relief arriving.',
        onSuccess: {
          narrative: '{actor} is past the clerk\'s empty chair and through the inner door with four breaths to spare. The vault opens quietly, on hinges that have been kept oiled.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The relief clerk comes early and finds the inner door standing open. The bell goes up before {actor} reaches the strongbox, and the stair fills from the top.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'vault_heist.escape',
        name: 'The Escape',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The strongbox gives up its contents. Carrying them out is the other half of the job, and the counting-house stands on a square with four exits, all of them watched by morning.',
        onSuccess: {
          narrative: '{actor} leaves by the coal chute, which is on nobody\'s list of doors, and crosses the square while it is still quiet.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
        onFailure: {
          narrative: 'The coal chute is barred from the outside. {actor} drops the strongbox to climb faster, and gets over the wall with a hand full of splinters and none of the money.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.grave_robbery',
    name: 'The Grave Robbery',
    locationTypes: ['ruins', 'ruined_village', 'battleground'],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'grave_robbery.location',
        name: 'The Location',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The barrow field has forty mounds and one of them is worth opening. {actor} works from the old grave-tax rolls, which record what was buried with whom and were never meant to be read this closely.',
        onSuccess: {
          narrative: 'The rolls name a captain buried in harness. {actor} finds the mound by its frost, which lies thinner where the stone sits close under the turf.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} opens two mounds and finds a child and a horse. The rolls were copied badly a century ago, and the captain is under one of the other thirty-eight.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'grave_robbery.opening',
        name: 'The Opening',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The capstone is set dry, without mortar, which means it can be lifted and will speak while it is lifted. {actor} works at it with a bar and a folded coat.',
        onSuccess: {
          narrative: 'The stone comes up onto the coat with barely a grind. The dark below it stays where it is, and the cold coming out of the hole is only cold.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The bar slips and the capstone drops back hard. The sound goes down into the ground rather than out of it, and what answers does not sound like an echo.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'grave_robbery.claiming',
        name: 'The Claiming',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The captain is still in harness, and the harness is still worth money. {actor} has as long as the air in the chamber stays breathable, which is not long.',
        onSuccess: {
          narrative: '{actor} takes the gorget and the rings and leaves the blade, which is bedded into the ribs and would need cutting free. The capstone goes back square, which is the part nobody bothers with.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: '{actor} gets a hand on the gorget and then cannot make the hand let go of the barrow wall. The climb out costs the gorget, and the cold follows {them} across the field.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.smuggle_goods',
    name: 'The Smuggle Goods',
    locationTypes: ['town', 'city', 'oasis'],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'smuggle_goods.acquisition',
        name: 'The Acquisition',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The goods are three crates of untaxed salt in a yard behind a tannery, where the smell keeps honest people from lingering. {actor} has to buy them without leaving a name.',
        onSuccess: {
          narrative: 'The seller wants coin and no conversation, which suits. {actor} pays over a barrel head, and the crates are loaded before the price is repeated aloud.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Two crates are salt and the third is sand with salt laid over the top. {actor} finds out at the barrel head, and the seller is already through the tannery gate.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'smuggle_goods.transportation',
        name: 'The Transportation',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The road has one checkpoint and the river has none, but the river has a ferryman who talks. {actor} takes the road, with the crates under a load of hides.',
        onSuccess: {
          narrative: 'The hides do the work. The checkpoint guard lifts one corner, decides against lifting the rest, and waves the cart through with the back of his hand.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The guard lifts the third hide instead of the first. The salt is counted out onto the road in front of {actor}, crate by crate, and the tally is written down.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'smuggle_goods.delivery',
        name: 'The Delivery',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The buyer wants the crates at a mill outside the walls, after dark, which is either caution or a plan. {actor} arrives early to find out which.',
        onSuccess: {
          narrative: 'The buyer comes alone and the coin is counted out on the millstone. {actor} leaves by a different road than the one {they} came in on.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
        onFailure: {
          narrative: 'There are four men at the mill and one of them is the buyer. {actor} leaves the crates in the yard and takes the road at a run, a mile off before the shouting stops.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.steal_secrets',
    name: 'The Steal Secrets',
    locationTypes: ['castle', 'tower', 'capital'],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'steal_secrets.infiltration',
        name: 'The Infiltration',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The tower keeps its correspondence on the third floor and its guards on the first and second. {actor} goes up the outside, where the stonework is old enough to have handholds and sound enough to hold weight.',
        onSuccess: {
          narrative: '{actor} comes in through a window left open for the heat, and stands a while letting {their} eyes adjust. The floor below is loud with people who believe the stair is the only route up.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'A shutter swings on its own two floors up, and a guard on the wall walk looks for the reason. {actor} spends an hour flat against the stone, and goes back down the stones {they} climbed.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'steal_secrets.discovery',
        name: 'The Discovery',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        // The prior prose used `{their}` for the secrets' meaning, but the pronoun tokens
        // resolve to the acting agent — it rendered as the actor's. Third parties get nouns.
        narrative: 'The correspondence room is not locked, because a locked door on the third floor would tell everyone which door mattered. {actor} has to read enough to know what is worth taking.',
        onSuccess: {
          narrative: 'The letters worth having are the ones filed under a dull heading and dated out of order. {actor} reads four of them twice, and puts every sheet back in the order it lay.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} reads a season of grain contracts and a dispute about a fence line. The letters that matter are in the room, and the night is spent.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'steal_secrets.exfiltration',
        name: 'The Exfiltration',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Going down the outside in the dark is harder than coming up it was, and now there is a reason to hurry. The window has been shut and latched since {actor} came through it.',
        onSuccess: {
          narrative: '{actor} goes down the same stones with the letters copied and the originals back in their order. The tower will not know it was read until the knowledge is used against it.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: '{actor} is out on the stonework when the shutter is thrown open above. Hands come down and take {their} wrists, and the letters go back on the desk with a guard standing over them.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow'],
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // TRADE (5 new; merchants_gambit is already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.caravan_deal',
    name: 'The Caravan Deal',
    locationTypes: ['oasis', 'camp', 'town'],
    reachPrimary: 'gold',
    reachSecondary: 'star',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'caravan_deal.meeting',
        name: 'The Meeting',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} finds the caravan master counting water skins against a tally board and coming up three short for the next stage. That shortfall is the whole of {actor}\'s leverage, and it lasts exactly until the next well.',
        onSuccess: {
          narrative: 'The caravan master sets the tally board down, which in this trade is the same as agreeing to listen. {actor} is given a seat in the shade and a cup poured from the good skin.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The caravan master hears the offer out and goes back to counting. The column forms up an hour later and leaves {actor} at the well with the price still unnamed.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'caravan_deal.negotiation',
        name: 'The Negotiation',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The route matters more than the cargo. {actor} argues for a share measured in stages travelled rather than a single fee — less at the outset, and a great deal more if the caravan runs the whole season.',
        onSuccess: {
          narrative: 'The terms settle on payment by stage, with the final stage counted double. The caravan master marks it on the tally board in charcoal, which in this company holds until the next reckoning.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} holds out for a single fee. The caravan master offers half of it, then withdraws the offer, then calls the column forward. The dust settles over an unmarked board.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'caravan_deal.exchange',
        name: 'The Exchange',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The goods come off the pack animals in the grey hour before the heat. Every bale is weighed twice, once by each party, and the second weighing is the one that decides the price.',
        onSuccess: {
          narrative: 'Both weighings agree to within a handspan of rope. The caravan master writes {actor}\'s name at the head of the board for next season, which is worth more than the cargo ever was.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: 'The weighings disagree by a full bale, and neither party will say the word thief aloud. The cargo stays with the caravan pending a reckoning four hundred miles from here, if it happens at all.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.guild_negotiation',
    name: 'The Guild Negotiation',
    locationTypes: ['city', 'capital', 'town'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    secretDiscovery: { onSuccess: true, sourceName: 'observation' },
    steps: [
      {
        id: 'guild_negotiation.audience',
        name: 'The Audience',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The guild hall keeps two waiting rooms: one with chairs and one without. {actor} is shown to the one without, which is the guild\'s opening offer and the cheapest it will ever make.',
        onSuccess: {
          narrative: 'After an hour the clerk returns and opens the inner door. The guild master does not stand, but does set down the pen — and the pen is what {actor} came to be worth.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The clerk comes back at dusk to say the guild master\'s day is spent. The room without chairs has done its work, and {actor} has paid an afternoon to learn the rate.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'guild_negotiation.proposal',
        name: 'The Proposal',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'A guild does not buy goods. It buys the removal of a problem. {actor} orders the terms so that the guild\'s bottleneck, and not {actor}\'s margin, is the first figure on the page.',
        onSuccess: {
          narrative: 'The guild master reads as far as the third clause, then turns back and reads the first again. That second reading is a price being accepted before it is spoken aloud.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The guild master reads the first clause and stops there. The proposal solves {actor}\'s problem at the guild\'s expense, and it took one paragraph to say so.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'guild_negotiation.contract',
        name: 'The Contract',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The contract is read aloud twice, because the guild has learned what silence during a first reading costs it. {actor} must hold to the terms {they} named while hearing them come back in a clerk\'s flat voice.',
        onSuccess: {
          narrative: 'Both seals go on the page inside the hour, rare enough that the clerk notes the date in the margin. The guild is bound to {actor} now, and it binds no one it expects to outgrow.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: 'A clause on delivery timing reads one meaning aloud and another on the page. The guild master closes the folio, and the clerk carries it back toward the room without chairs.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.smuggler_pact',
    name: 'The Smuggler Pact',
    locationTypes: ['camp', 'town', 'ruins'],
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'trade',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    secretDiscovery: { onSuccess: true, sourceName: 'spy_debrief' },
    steps: [
      {
        id: 'smuggler_pact.contact',
        name: 'The Contact',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Contact is made slowly: a name left with a bargeman, a coin left under a particular cup, then three days of behaving as though neither had happened. Smugglers price patience before they price cargo.',
        onSuccess: {
          narrative: 'On the fourth evening a stranger sits down across from {actor} uninvited and asks what tonnage {they} had in mind. No name is offered, and asking for one would end the conversation.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The coin under the cup is gone by morning and no one comes. Either the signal was stale or {actor} is still being weighed, and from this side of the table the two look identical.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'smuggler_pact.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The terms are simple and the risk is not: who holds the cargo when the excise men board, and who gets named if they do. Every clause is an argument about which of the two takes the rope.',
        onSuccess: {
          narrative: '{actor} agrees to carry the manifest in person, which moves the risk and therefore the price. The smuggler cuts a third off the cut and calls it fair payment for a spine.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} pushes the risk back across the table one clause too many. The smuggler stands, pays for both cups, and goes — a courtesy meaning the door is closed rather than merely shut.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'smuggler_pact.binding',
        name: 'The Binding',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'There is no paper to sign, because paper is evidence. The pact binds as this trade binds: a route named aloud, a date, and a token exchanged that is worthless to anyone who has not been told what it stands for.',
        onSuccess: {
          narrative: 'The token changes hands. From tonight {actor} holds a route that appears on no chart and a name to give at the far end of it, which in this trade is the whole of a fortune.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: '{actor} asks for the route before the token is offered, and the order of those two is the whole test. The smuggler is three streets gone before {actor} finishes the sentence.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#shadow'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.tribute_exchange',
    name: 'The Tribute Exchange',
    locationTypes: ['capital', 'castle', 'temple'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'tribute_exchange.presentation',
        name: 'The Presentation',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The tribute comes in on three trays and is set down where the whole court can count it. What {actor} brought matters less than the order it is laid out in — best piece last, or the court reads the entire gift as an opening offer.',
        onSuccess: {
          narrative: 'The ruler lifts the cloth from the third tray in person rather than letting a steward do it. The court marks the gesture, and the court is who the gesture was aimed at.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'A steward lifts all three cloths at once and the trays go out together. The court has been told exactly what the tribute is worth, and not a word was spent on saying it.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'tribute_exchange.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The demand is an annual payment, set at a figure the crown settled on before {actor} ever arrived. {actor} can argue the figure or argue the schedule, and only one of those is ever conceded in this hall.',
        onSuccess: {
          narrative: '{actor} leaves the figure untouched and takes the schedule instead: paid after harvest rather than before it. The crown keeps its number, {actor} keeps a season of use, and both sides call it a victory.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} argues the figure. The crown raises it, because a hall like this cannot be seen to give ground, and the new number sits past what {actor} came prepared to promise.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'tribute_exchange.commitment',
        name: 'The Commitment',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The oath is sworn in front of witnesses whose only office is to remember it. Once spoken, the terms outlive both parties and pass to whoever holds {actor}\'s house after {them}.',
        onSuccess: {
          narrative: '{actor} swears to the schedule as agreed, and the crown swears to the protection that answers it. Both halves go on the page. The second half is what {actor} climbed the hill for.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: '{actor} hedges on the first payment date, in front of the witnesses. The crown strikes the protection clause and keeps the tribute clause, and the witnesses remember that half just as well.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.barter_survival',
    name: 'The Barter Survival',
    locationTypes: ['wilderness', 'hamlet', 'camp', 'ruined_village', 'oasis'],
    reachPrimary: 'gold',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'barter_survival.hunt',
        name: 'The Hunt',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The pack holds no goods a trader would look at twice. {actor} spends the morning on the ridge taking what the country gives up cheaply — snare meat, a pouch of dye-lichen, resin scraped off the cut faces of pines.',
        onSuccess: {
          narrative: 'By dusk the pack is heavy: two hares, the pouch full, resin enough to seal a boat seam. All of it keeps four days, and four days is the distance {actor} can now afford to walk.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The snares come up empty and the lichen on this slope is the pale kind that dyes grey. {actor} walks out with a quarter of what the morning promised and a day gone against it.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'barter_survival.trade',
        name: 'The Trade',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'At the camp the rate is set by whoever arrived last and how hungry they looked doing it. {actor} lays the resin out first and keeps the hares covered, because meat named early prices everything after it.',
        onSuccess: {
          narrative: 'The resin goes for salt and a spare blade, and the hares go last for grain at a rate the camp calls generous. {actor} leaves carrying food that keeps a month in place of food that keeps four days.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} shows the meat first and the camp prices the rest against it. The grain costs twice what it should, and the spare blade stays on the trader\'s blanket.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'barter_survival.sustenance',
        name: 'The Sustenance',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Grain lasts exactly as long as the discipline that portions it. {actor} measures the country ahead in days and the sack in handfuls, and the two figures do not agree.',
        onSuccess: {
          narrative: '{actor} stretches the sack by walking longer and eating later, and reaches the far settlement three days thinner with two handfuls left over. Two handfuls is a margin, and a margin counts.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'The sack runs out a day and a half short. {actor} comes into the settlement upright and not much more, and trades the spare blade for one meal at a rate that would have been an insult a week ago.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#survival'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.mystic_trade',
    name: 'The Mystic Trade',
    locationTypes: ['shrine', 'tower', 'temple'],
    reachPrimary: 'gold',
    reachSecondary: 'veil',
    encounterType: 'trade',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    secretDiscovery: { onSuccess: true, sourceName: 'observation' },
    steps: [
      {
        id: 'mystic_trade.offering',
        name: 'The Offering',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The mystic takes no coin, which does not make the price lower. {actor} sets out what was carried up the hill: beeswax, a measure of blood-red thread, a jar of rainwater caught off a roof nobody has ever repaired.',
        onSuccess: {
          narrative: 'The mystic slides the rainwater jar to the left of the others and leaves the rest where they lie. That one sorting is the whole of the acceptance, and it cost no words at all.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The mystic looks at the beeswax for a long moment and then out the window. The offerings sit untouched until {actor} gathers them back up, which takes longer than setting them down did.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'mystic_trade.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'What the mystic asks for never matches the shape of what {actor} brought: a season of silence, a name surrendered, a road never walked again. The bargaining is over which of those {actor} can survive losing.',
        onSuccess: {
          narrative: 'The road is what they settle on. {actor} gives up the northern pass by name and in full knowledge of the cost, and the mystic writes it on the wall beneath the others who paid the same.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} offers the season of silence intending to keep half of it. The mystic hears the half inside the offer and names a second price, higher, that {actor} has already refused once.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'mystic_trade.blessing',
        name: 'The Blessing',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The blessing comes at the hour the mystic picks, not the hour {actor} would have chosen. It arrives as a mark drawn in beeswax at the base of the throat and one sentence {actor} is told never to repeat.',
        onSuccess: {
          narrative: 'The mark takes cleanly and does not smear. {actor} walks down the hill hearing weather two valleys off before it arrives, and pays for the hearing with a pass {they} will never use again.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#arcane'],
          },
        },
        onFailure: {
          narrative: 'The mark takes badly and runs. What {actor} carries down the hill is the sentence without the sight — words that surface unbidden at the wrong hours, and a pass given up to buy them.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
            tagFilters: ['#arcane'],
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // ASSIST (5 new; 1 already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.aid_refugees',
    name: 'The Refugee Aid',
    locationTypes: ['hamlet', 'town', 'ruined_village'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'refugees.recognition',
        name: 'The Recognition',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape, `assist` family batch.
        narrative: 'Forty of them at the edge of the fields, carrying what they could hold. They have not asked for aid yet. That silence is its own kind of asking.',
        onSuccess: {
          narrative: '{actor} counts them properly — the children, the elders, the two who cannot walk — before promising a single ration. The counting is what says where to start.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} sees a crowd instead of the people in it, and plans for the crowd. The two who cannot walk are still at the field\'s edge at dusk.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'refugees.shelter',
        name: 'The Shelter',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'There is canvas, a fallen barn, and four hours of light. {actor} decides what the barn is worth pulling apart for.',
        onSuccess: {
          narrative: 'The shelter is ugly and it holds. Forty people sleep dry, which the builders of better roofs rarely manage on a first night.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The frame goes up crooked and comes down in the wind before midnight. {actor} spends the dark hours re-tying canvas by feel.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'refugees.sustenance',
        name: 'The Sustenance',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: 'The food will not stretch to forty at a full ration. {actor} decides who eats first, and does it in the open where the decision can be watched being made.',
        onSuccess: {
          narrative: 'The rations hold four days — long enough for the town to be shamed into sending more. Nobody thanks {actor} directly. The bowls come back washed.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: 'The stores run out on the second day. {actor} divides what is left into portions too small to matter and hands them out anyway.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.healer_aid',
    name: 'The Healing Vigil',
    locationTypes: ['shrine', 'temple', 'tower'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    favorGeneration: { onSuccess: true, magnitudeRange: [0.2, 0.35], context: 'tended to them through the vigil' },
    steps: [
      {
        id: 'healer.diagnosis',
        name: 'The Diagnosis',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape, `assist` family batch.
        narrative: 'Nine in the vigil hall, and the ones who cough are not the ones who worry {actor} most. The quiet ones have stopped shivering.',
        onSuccess: {
          narrative: '{actor} works out the order of it — who has days, who has hours, who only looks worse than they are. The order is the treatment.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} treats the loudest symptoms first, which is the mistake the tired always make. By dawn the quiet ones have not improved.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'healer.treatment',
        name: 'The Treatment',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The medicines are old stock and half of them are past their season. {actor} works out which will still do what the label claims.',
        onSuccess: {
          narrative: 'Fevers break in six of the nine before the second night. {actor} does not say aloud which six were expected to.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Two of the remedies fail outright and the third makes the fever climb. {actor} stops it before it costs more than it already has.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'healer.recovery',
        name: 'The Recovery',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: 'The hard part is not the medicine. It is staying awake in a room that smells of sickness while people decide, hour by hour, whether to keep going.',
        onSuccess: {
          narrative: '{actor} is there when they wake, which turns out to be most of the work. The hall empties over a week, and nearly all of it walks out.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor} sleeps four hours and wakes to two beds already stripped. The rest of the hall watched it happen and does not mention it.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.militia_aid',
    name: 'The Militia Assistance',
    locationTypes: ['fort', 'castle', 'battleground'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'militia.assessment',
        name: 'The Assessment',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape, `assist` family batch.
        narrative: 'Sixty men with farm tools and eleven with real weapons, holding a wall never meant to be held. {actor} walks the line twice before speaking.',
        onSuccess: {
          narrative: '{actor} finds the gap on the east side that the militia had stopped seeing because it had always been there. That is where it would have broken.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} reads the line as a soldier reads a line, and these are not soldiers. The plan assumes a discipline the militia does not have.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'militia.coordination',
        name: 'The Coordination',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'They will not hold a formation they do not understand. {actor} has one afternoon to teach them a shape simple enough to survive fear.',
        onSuccess: {
          narrative: 'Two ranks, one order, and a signal they can hear over shouting. It is not tactics. It is enough.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The drill goes well and the militia learns it well, and none of it survives the first real noise. {actor} sees that coming and cannot mend it in an afternoon.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'militia.battle',
        name: 'The Battle',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: 'The line meets what it was built for at first light. {actor} fights where the wall is thinnest, because that is where the youngest are standing.',
        onSuccess: {
          narrative: 'The wall holds. Eleven dead, which the militia counts as a victory, and {actor} does not correct them.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: 'The east side goes first, and the rest goes quickly after. {actor} pulls back who {they} can and leaves the wall to what comes over it.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.scholar_aid',
    name: 'The Academic Preservation',
    locationTypes: ['ruins', 'temple'],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'scholar.discovery',
        name: 'The Discovery',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape, `assist` family batch.
        narrative: 'Three scholars are packing an archive into crates while the roof above them gives up its tiles one at a time. They have run out of crates.',
        onSuccess: {
          narrative: '{actor} asks which volumes are irreplaceable and which are merely old. The eldest scholar is slow to answer honestly, and that answer halves the work.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} treats it all as equally precious, which is generous and useless. The crates fill with sermons while the ledgers stay on the shelf.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'scholar.organization',
        name: 'The Organization',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Order first, then speed. {actor} sorts by what a later reader would need, not by what looks valuable in the hand.',
        onSuccess: {
          narrative: 'The crates leave labelled and in sequence. Whoever opens them in ten years will not have to guess.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s system holds until the third crate, then stops making sense to anyone but {them}. The scholars pack the remainder by instinct.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'scholar.transcription',
        name: 'The Transcription',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: 'Some of it will not survive the move at all. {actor} copies what cannot travel, working from the page while the light lasts.',
        onSuccess: {
          narrative: 'Four volumes exist twice by the time the roof comes down. The copies are plainer than the originals and will outlast them.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: 'The ink runs, the hand cramps, and the copying falls behind the weather. What is left on the shelf goes down with the roof.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.guild_aid',
    name: 'The Guild Crisis',
    locationTypes: ['city', 'capital', 'town'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'guild.crisis',
        name: 'The Crisis',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape, `assist` family batch.
        narrative: 'The guild has been solvent on paper for two years and solvent in fact for none of them. The treasurer shows {actor} the ledger, having shown it to nobody else.',
        onSuccess: {
          narrative: '{actor} finds the year it turned — a bad contract nobody wanted to be the one to refuse. Everything after it is consequence.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} reads the numbers and believes them, which is the error. The ledger was arranged to be believed.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'guild.negotiation',
        name: 'The Negotiation',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Four creditors, and only two of them want their money back more than they want the guild gone. {actor} has to work out which two before committing to terms.',
        onSuccess: {
          narrative: 'The two who wanted paying take a schedule. The two who wanted the guild leave with neither, and lose the room.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} argues the case well to the wrong half of the table. The terms that come back are worse than the ones on offer before {they} spoke.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'guild.restoration',
        name: 'The Restoration',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 4,
        narrative: 'Debt is arithmetic. Reputation is not. {actor} has to make the guild worth trading with again before the schedule comes due.',
        onSuccess: {
          narrative: 'Two houses place orders they would not have placed last season. The guild survives on that, and knows it.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: 'The orders do not come. The schedule comes due regardless, and the guild is sold off in pieces to the two who wanted it so.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // BUILD (6 new)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.forge_construction',
    name: 'The Forge Construction',
    locationTypes: ['town', 'castle', 'fort'],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'forge.design',
        name: 'The Design',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (build-family batch).
        // Builders-Fellowship register per the `template-encounter-rewrite` voice guide —
        // craft patience, material detail, time measured in how long a thing takes to do
        // properly — calibrated against `encounter.trial_by_combat`, the THR-1036 exemplar.
        narrative: 'A forge is a box that has to survive what it holds. {actor} draws it out three times before the smiths will look at it — flue height, hearth depth, and where the heat goes when nobody is watching it.',
        onSuccess: {
          narrative: 'The smiths take the drawing away and argue over it, which is how they agree. Nobody says the plan is good. Somebody asks when the digging starts.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The plan puts the bellows where the door has to be. An apprentice notices it first, and is polite about it, which is worse.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'forge.excavation',
        name: 'The Excavation',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: 'Foundation before anything else. {actor} has the ground opened to the depth the drawing calls for, and then a hand deeper, because the drawing has never stood out in the rain.',
        onSuccess: {
          narrative: 'The floor comes up level and dry. The diggers stop asking why they went the extra hand down.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'They strike water at four feet and {actor} decides to build over it. The pit takes the whole winter to admit that was wrong.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'forge.assembly',
        name: 'The Assembly',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: 'Stone, then iron, then fire. {actor} sets the hearth course by course while the smiths wait with the kind of patience that is really just watching.',
        onSuccess: {
          narrative: 'The first firing runs clean — the draw is right, the smoke goes where it was told. A smith puts his hand flat against the outer wall and finds it cool. That is the whole test.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The first firing splits the hearth stone end to end. The forge will work. It will also need rebuilding before the year is out, and everyone standing there knows it.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.tower_restoration',
    name: 'The Tower Restoration',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city'],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'tower.assessment',
        name: 'The Assessment',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: 'The tower has been coming down for two hundred years and has most of the way left to go. {actor} walks it from the base up, counting which stones are holding and which are only leaning.',
        onSuccess: {
          narrative: '{actor} finds the line where the old work stops and a bad repair starts. Everything above it comes down, everything below it stays. The decision takes an afternoon and saves a season.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} reads the cracks as settling, and they are not settling. That wall is travelling, a hair a year, and the survey has just written down that it is fine.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'tower.reconstruction',
        name: 'The Reconstruction',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: 'Stone has to come from somewhere, and the nearest quarry closed a lifetime ago. {actor} works the tower back up out of its own fallen courses, sorting what can be reset from what has to be cut fresh.',
        onSuccess: {
          narrative: 'The new courses go up matched close enough that you have to stand well back to find the seam. After a week the masons stop mentioning the seam.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The rebuilt section runs out of plumb by a thumb\'s width per course, and the error compounds. By the third course it is visible from the road.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'tower.completion',
        name: 'The Completion',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: 'What is left is roof, stair and rail — the parts that decide whether anyone will actually use the tower. {actor} finishes them the slow way.',
        onSuccess: {
          narrative: 'The stair takes weight without complaint and the roof sheds its first rain. A family moves in before the mortar has fully cured, which is the compliment.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The tower stands and nobody trusts it. The stair is sound. It is the memory of the ruin that keeps people standing at the bottom of it.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.bridge_engineering',
    name: 'The Bridge Engineering',
    locationTypes: ['wilderness', 'farmland', 'oasis'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'build',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'bridge.planning',
        name: 'The Planning',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: 'The chasm is wider at the top than at the bottom, which is the problem stated in one sentence. {actor} takes the measure of it twice, from both rims, because the rims disagree.',
        onSuccess: {
          narrative: 'The span works out shorter than anyone assumed, once the anchor points move upstream. The engineers check the figure twice and then stop checking it.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The plan rests the load on rock that is only sitting there. Nobody catches it on paper.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'bridge.construction',
        name: 'The Construction',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: 'Piers first, then the span, then all the parts that were easy to draw. {actor} keeps the crews on the rope-work through a month of wind.',
        onSuccess: {
          narrative: 'The two halves meet within a finger of each other. The crews call it luck. {actor} knows it is arithmetic and lets them keep the luck.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A pier settles during the pour and the whole span has to be shimmed true. It is straight now. It is also carrying a correction it was never designed to carry.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'bridge.testing',
        name: 'The Testing',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: 'A bridge nobody has loaded is a rumour. {actor} runs stone carts across it, heavier each pass, and stands underneath for the last one.',
        onSuccess: {
          narrative: 'The deck flexes and comes back, which is exactly what it was built to do. {actor} walks out from under it, and the crews finally cross without looking down.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The third pass opens a crack clean across the deck seam. Nobody is hurt. The bridge is closed by evening and the crossing goes back to the ford.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.temple_expansion',
    name: 'The Temple Expansion',
    locationTypes: ['shrine', 'temple', 'city'],
    reachPrimary: 'stone',
    reachSecondary: 'veil',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'temple.consecration',
        name: 'The Consecration',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: 'The ground has to be spoken for before it is dug. {actor} walks the marked line at first light with the rite the temple keeps for it, which is older than the temple.',
        onSuccess: {
          narrative: 'The rite passes without incident, which is the correct outcome, and the priests treat it as one. Digging starts that afternoon.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} loses the thread of the rite halfway and finishes it from memory. The priests say the words were close enough. They also come back that night and say them again.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'temple.raising',
        name: 'The Raising',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: 'Walls and pillars, and the pillars matter more than they look. {actor} keeps the courses low and the pace slow while the mortar takes.',
        onSuccess: {
          narrative: 'The pillars come up plumb and the walls follow them. It is unremarkable work, and unremarkable is what a building wants.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A pillar goes up half a degree off and takes the wall with it. The lean is small. It will be pointed out to visitors for the next hundred years.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'temple.sanctification',
        name: 'The Sanctification',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: 'The last thing a temple is given is use. {actor} stands at the back of the new hall for the first service, where the sound either comes together or does not.',
        onSuccess: {
          narrative: 'The room holds a voice better than the old hall ever did. Nobody planned that. The priests decide it was intended, and {actor} does not correct them.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The hall echoes wrong, and every word arrives twice. It is a fine building that people will go on quietly choosing not to pray in.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.harbor_construction',
    name: 'The Harbor Construction',
    locationTypes: ['city', 'capital', 'town'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'build',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'harbor.survey',
        name: 'The Survey',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: 'A harbour is mostly a decision about where. {actor} takes soundings along four miles of coast, reading depth, bottom, and the way the wind sits in each bay.',
        onSuccess: {
          narrative: 'The best water is not the obvious bay but the one past it, with a bar that can be cut. The merchants argue for a week and then agree.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The chosen bay sounds deep, and is deep only at the top of the tide. The mistake is six months from being visible.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'harbor.dredging',
        name: 'The Dredging',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: 'The channel has to be dug out from under water, which is as awkward as it sounds. {actor} runs the barges and the spoil-carts through a full season of it.',
        onSuccess: {
          narrative: 'The channel comes up to depth and holds it through the winter storms. A deep-hulled trader comes in without waiting on the tide, and the whole quay stops to watch.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The silt returns faster than it is lifted. The channel ends up deeper than it was and shallower than it needs to be, and it will want doing again every year.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'harbor.wharves',
        name: 'The Wharves',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: 'Timber, iron, and the exact height above the water that lets a loaded hull sit against it. {actor} builds the wharves to the tide rather than to the drawing.',
        onSuccess: {
          narrative: 'The wharves take their first cargo and the crews find they can work at any hour of the tide. Within a month nobody remembers the beach that used to be there.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The wharf decks sit a foot too high. Every cargo comes ashore up a ramp, slowly, and the traders begin quoting the delay in their prices.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // LEAD (4 new; 1 already in initial 10)
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'encounter.expedition_leadership',
    name: 'The Expedition Leadership',
    locationTypes: ['wilderness', 'unexplored_poi', 'ruined_city'],
    reachPrimary: 'heart',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'expedition.gathering',
        name: 'The Gathering',
        reach: 'dominance',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'Six are willing to go, and four of them are willing for reasons {actor} would rather not depend on. The party has to be picked before the season closes the passes.',
        onSuccess: {
          narrative: '{actor} takes the four who asked what the return trip looked like and leaves the two who did not. The camp notices the choosing.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} takes whoever volunteered first. Two of them have never carried a full pack a full day, and the passes do not grade on intent.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'expedition.navigation',
        name: 'The Navigation',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'The map was drawn from a report rather than from a walk, and it disagrees with the valley in two places. {actor} reads the ground instead — water direction, tree lean, where the game trails give out.',
        onSuccess: {
          narrative: '{actor} trusts the ground over the paper, and the party loses half a day proving it right. Nobody argues with the map again.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} trusts the paper. The valley closes into scree, and the party spends the last of the light walking back the distance it walked out.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'expedition.triumph',
        name: 'The Triumph',
        reach: 'dominance',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'The last stretch is what the expedition was funded for, and it is also where the food arithmetic stops being comfortable. {actor} has to decide how much of the return the party can spend getting there.',
        onSuccess: {
          narrative: '{actor} spends it and calls the turn early enough that the walk back is only hard. The party comes in thin and entire, which is the version worth reporting.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} presses past the turn. The objective is reached, and the party comes off the descent in twos and threes, each pair certain the order was wrong.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.council_mediation',
    name: 'The Council Mediation',
    locationTypes: ['capital', 'city', 'castle'],
    reachPrimary: 'heart',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'council.assembly',
        name: 'The Assembly',
        reach: 'dominance',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The council has sat twice this month and settled neither dispute. {actor} sends the summons for a third, knowing three of the seats will go looking for a reason not to fill.',
        onSuccess: {
          narrative: 'Every seat fills. Two members arrive late enough to make a point and early enough to be counted, which {actor} allows them.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Four seats stay empty and the chamber talks around them. What is decided today can be denied tomorrow by the people who were not here to decide it.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'council.hearing',
        name: 'The Hearing',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Each faction has an account, and each account is true from where it is told. {actor} has to hear all three without letting the longest become the loudest.',
        onSuccess: {
          narrative: '{actor} lets the quietest faction finish. What it says last turns out to be the grievance the other two had been talking around all morning.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} cuts the third account short for time. The council leaves with a decision and a faction that was not heard, and only one of those keeps.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'council.judgment',
        name: 'The Judgment',
        reach: 'dominance',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'A ruling has to be spoken aloud, in the room, by a person who will still be in the city next week. {actor} is that person, and the council has come to watch {them} be it.',
        onSuccess: {
          narrative: '{actor} rules against the faction {they} privately agrees with, on the narrow point where the law is plain. The room dislikes it and does not challenge it.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} rules for the strongest faction and calls it compromise. The chamber empties fast, and the dispute walks out with the losers.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.merchant_caravan',
    name: 'The Merchant Caravan Leadership',
    locationTypes: ['town', 'city', 'farmland'],
    reachPrimary: 'gold',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'caravan.organization',
        name: 'The Organization',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'Nine merchants, four wagons, and every one of them certain their goods belong nearest the front. {actor} has the loading order to set before the gate opens.',
        onSuccess: {
          narrative: '{actor} loads by weight and tells the merchants it was by weight. The complaints are short, because the arithmetic can be checked.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} loads by whoever complained hardest. The axle that goes at noon is under the wagon that should have ridden third.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'caravan.route',
        name: 'The Route',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Two roads reach the same market. The short one is taxed at a bridge and the long one is not taxed at all, which usually means it charges differently.',
        onSuccess: {
          narrative: '{actor} takes the taxed road and pays the toll out of the common purse. The caravan arrives a day early with every merchant still holding their own goods.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} takes the untaxed road. It saves the toll and costs two days, and the merchants do that subtraction out loud for the rest of the season.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'caravan.profit',
        name: 'The Profit',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'The market opens before dawn and the good prices go in the first hour. {actor} has to decide what to sell into the early rush and what to hold for buyers who arrive later with more patience and more coin.',
        onSuccess: {
          narrative: '{actor} sells the perishables at dawn and holds the cloth. By midday the cloth buyers are bidding against each other, which is the only reason the margin exists.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} holds too much too long. The stalls shutter around a wagon still half full, and the merchants take the next caravan out under a different name.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.faction_unification',
    name: 'The Faction Unification',
    locationTypes: ['capital', 'castle', 'ruins'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'faction.coalition',
        name: 'The Coalition',
        reach: 'dominance',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (story_beat tier).
        narrative: 'The factions agree on one point: the threat is real. Everything after that is grievance, and most of it predates anyone in the room. {actor} has until dusk to turn a shared enemy into a shared plan.',
        onSuccess: {
          narrative: '{actor} gets them into one room and keeps them there. Nobody concedes a grievance — they agree to postpone all of them, which is further than anyone has got in thirty years.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The oldest grievance surfaces an hour in and the room takes sides on it. Two delegations leave before the threat is named. The ones who stay spend the evening explaining to {actor} why the others were always going to walk.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'faction.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Terms are the hard part. Each faction wants its own losses counted first, and the ledger has only so many lines. {actor} works through the night with a scribe who has stopped pretending to be neutral.',
        onSuccess: {
          narrative: 'The terms are signed a little after dawn. Every faction gets slightly less than it demanded and slightly more than it expected, which is what a treaty looks like when it is going to hold.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The draft collapses over a clause about who commands whom. {actor} offers three redrafts and the room refuses all three. What began as a negotiation is now a record of who refused what, and it will be read back for years.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'faction.victory',
        name: 'The Victory',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'The plan survives contact for about an hour. After that it is {actor}\'s voice, the field, and whichever captains can still hear an order.',
        onSuccess: {
          narrative: 'The line holds because the factions hold it together, which surprises them more than it surprises {actor}. Afterward they argue about who held hardest. {actor} lets them.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The coalition breaks at the left flank and takes the rest with it. {actor} gets most of them off the field alive. The alliance does not survive the retreat, and each faction rides home with its own account of whose fault it was.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.sanctuary_construction',
    name: 'The Sanctuary Construction',
    locationTypes: ['mining', 'unexplored_poi'],
    reachPrimary: 'stone',
    reachSecondary: 'heart',
    encounterType: 'build',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'sanctuary.discovery',
        name: 'The Discovery',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (story_beat tier).
        narrative: 'The cavern runs deeper than the maps allow for, and the air at the back of it is dry and still. {actor} walks the length twice, counting paces, listening for water. A place people can live in has to be found before it can be built.',
        onSuccess: {
          narrative: 'The rock is sound and the drainage runs the right direction. {actor} marks out the first chamber in charcoal and then stands back from it for longer than the work requires.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} reads the fault lines wrong. A test cut brings down half a ceiling and the dust takes two days to settle. The cavern is still a cavern, and now the crew knows it.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'sanctuary.carving',
        name: 'The Carving',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: 'Chambers and halls, cut by hand out of rock that yields about a hand\'s breadth a day. The work is measured in seasons rather than days, and {actor} keeps a tally on the wall because the mind needs a number to hold.',
        onSuccess: {
          narrative: 'The halls come out true. Sound carries their full length without echo, which was not planned and is the part {actor} is quietly proudest of.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A main span is cut too wide and the rock says so, in the small sounds it makes overnight. {actor} pulls the crew out before it comes down. What is left is smaller than the plan and safer than the pride that drew it.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'sanctuary.consecration',
        name: 'The Consecration',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: 'A refuge is only a refuge if the people inside believe it will hold them. {actor} performs the consecration in front of the first families to arrive, who have brought what they own and have nowhere else to take it.',
        onSuccess: {
          narrative: 'The rite lands. People stop clustering near the entrance. By evening a side hall has washing strung across it, which is how {actor} knows it worked.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The words come out flat and the room hears it. The sanctuary keeps the rain off, and that is all it does. Families bed down near the entrance for weeks afterward, closest to the door.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.library_expansion',
    name: 'The Library Expansion',
    locationTypes: ['tower', 'ruins', 'city'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'library.acquisition',
        name: 'The Acquisition',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: 'Books come from estates, debts, and people who have stopped caring. {actor} spends the season buying badly kept libraries off families who want the shelf space back.',
        onSuccess: {
          narrative: 'Three crates of parish records nobody wanted turn out to run unbroken for ninety years. {actor} pays for them by weight and does not mention the dates.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} pays scholar\'s prices for a set of copies. They are handsome, and there are four other sets of them within a day\'s ride.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'library.organization',
        name: 'The Organization',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: 'A collection nobody can search is a pile. {actor} sets a scheme and starts moving shelves to fit it, which the scholars take personally.',
        onSuccess: {
          narrative: 'The scheme survives contact with the scholars. Within a month they are using it without being reminded, and complaining about the old one.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The scheme is elegant and nobody else can hold it in their head. The scholars keep a private order of their own on the side, which amounts to having none.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'library.preservation',
        name: 'The Preservation',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: 'Damp, rot, mice and light — the four things that eat books, in order of appetite. {actor} builds the vault against all four.',
        onSuccess: {
          narrative: 'The vault holds its temperature through a wet spring. {actor} opens it and finds the ink where it was left. That is the entire ambition.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The vault is dry, windowless, and — it emerges — warm. Warm is what glue likes. The bindings are the first to go.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.warband_training',
    name: 'The Warband Training',
    locationTypes: ['fort', 'camp', 'castle'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'warband.assembly',
        name: 'The Assembly',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The fighters who come are the ones without a better offer this season. {actor} has to turn a queue of separate reasons into a warband that will stand next to each other.',
        onSuccess: {
          narrative: '{actor} pays the first week in advance and posts the terms where they can be read. Eleven stay, which is more than the coin alone would hold.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} promises the campaign will be short. Half the queue signs; the other half has heard that promise before, from people who meant it.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'warband.discipline',
        name: 'The Discipline',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Drill is where a warband finds out what it is. {actor} runs the line until the formation closes without being called for, which takes longer than any of the fighters expected.',
        onSuccess: {
          narrative: 'By the fourth day the line closes on its own when a gap opens. Nobody praises it. Closing on its own is what the praise would have been for.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The line breaks at the same place every run, and {actor} drills past the point where drilling helps. The fighters learn the movement and not the reason for it.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'warband.campaign',
        name: 'The Campaign',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 5,
        narrative: 'The first real contact is not the test. The test is the hour after it, when the warband learns whether {actor} counts the dead before the objective or after it.',
        onSuccess: {
          narrative: '{actor} counts first. The warband takes the ground the next morning instead, and takes it at the strength it started with.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} counts after. The objective is held, and the warband holds it as strangers, each of them privately deciding how long they will stay.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.frontier_settlement',
    name: 'The Frontier Settlement',
    locationTypes: ['farmland', 'battleground', 'camp', 'mining', 'temple', 'unexplored_poi', 'ruined_tower', 'ruined_city', 'ruined_village', 'oasis'],
    reachPrimary: 'stone',
    reachSecondary: 'heart',
    encounterType: 'build',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    steps: [
      {
        id: 'settlement.survey',
        name: 'The Survey',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 5,
        narrative: 'Water, wood, ground that can be held, and soil that will feed people who are already hungry. {actor} looks for a place with three of the four, because four does not exist.',
        onSuccess: {
          narrative: '{actor} settles on a shoulder of high ground with a spring below it. The soil is thin. Everyone agrees that thin soil and a spring beats good soil and a well.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The site has everything except a reason nobody else took it. That reason arrives with the spring floods.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'settlement.construction',
        name: 'The Construction',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 7,
        narrative: 'Shelter before wall, wall before comfort. {actor} holds to that order and takes the complaints, because the order is what carries people through a first winter.',
        onSuccess: {
          narrative: 'The wall closes before the frost, with the roofs already on. It is a poor-looking place, and every part of it is finished.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Half the roofs go on, and the wall is a ditch and a promise. The settlement gets through the winter. It does not get through it whole.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'settlement.establishment',
        name: 'The Establishment',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 8,
        narrative: 'A settlement stops being a camp when the arguments start being about ordinary things. {actor} has to watch the first of them settled without being the one who settles it.',
        onSuccess: {
          narrative: 'A dispute over a boundary stone goes to three neighbours instead of to {actor}, and comes back settled. Nobody sends for {actor} about the second one.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Every question still comes to {actor}, including the small ones. The place runs. It runs on one person, and everybody there can see how that ends.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // GOLD SUBLOCATION ENCOUNTERS (System 6 — 12 templates)
  // ────────────────────────────────────────────────────────────────────

  // ── Market District (2) ──────────────────────────────────────────
  {
    id: 'encounter.the_haggle',
    name: 'The Haggle',
    locationTypes: ['hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.market-district'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'the_haggle.opening',
        name: 'The Opening Bid',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} squares off against a merchant who has held this pitch for eleven years. The first price named is a barb — too high by half, as any fool could see.',
        onSuccess: {
          narrative: '{actor} names a counter to the copper. The merchant blinks, recalculates, and the dance begins in earnest.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: '{actor} hesitates a beat too long. The merchant smiles, scenting hesitation, and repeats the opening price without moving a finger.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'the_haggle.pressure',
        name: 'The Pressure',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Stalls around them fall quiet. {actor} must read the merchant\'s resolve — break it with words, or yield ground to save the deal.',
        onSuccess: {
          narrative: '{actor} finds the angle: a past debt, a future favour, a word that lands like a coin on stone. The merchant folds.',
          reputationDelta: 0.07,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s words slide past the merchant\'s guard without catching. The deal stalls, and the crowd loses interest.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'the_haggle.close',
        name: 'The Close',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'One price remains between profit and insult. {actor} must close the gap without breaking what goodwill remains.',
        onSuccess: {
          narrative: 'Hands clasp. The deal is struck at {actor}\'s terms — not all of them, but enough. Both walk away richer for the sparring.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: 'The merchant pulls back at the last. {actor} leaves the stall empty-handed, the deal dead in the dust.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.market_day_festival',
    name: 'Market Day Festival',
    locationTypes: ['hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.market-district'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'market_day_festival.celebration',
        name: 'The Celebration',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The whole settlement floods the market square. Banners fly, prices drop, and strangers share tables. {actor} moves through the crowd, coin and conversation flowing freely.',
        onSuccess: {
          narrative: '{actor} works the festival steadily — a word here, a purchase there. By dusk, new faces have become familiar ones.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} misreads the mood and steps on toes {they} never saw. The festival carries on without {them}.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'market_day_festival.connections',
        name: 'The Connections',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'As the fires are lit and the crowd thins, {actor} has a chance to build on the acquaintances the day has made — follow up, leave a mark, or let the hour pass.',
        onSuccess: {
          narrative: '{actor} finds the right words at the right moment. A stranger becomes a contact; a contact becomes a name that will answer when called.',
          reputationDelta: 0.09,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: '{actor} presses too hard and the stranger drifts back into the crowd. The festival ends without its promise kept.',
          reputationDelta: -0.03,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },

  // ── Mine (2) ────────────────────────────────────────────────────
  {
    id: 'encounter.the_rich_vein',
    name: 'The Rich Vein',
    locationTypes: ['mining', 'hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.mine'],
    reachPrimary: 'gold',
    reachSecondary: 'stone',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.acquire,
    steps: [
      {
        id: 'the_rich_vein.survey',
        name: 'The Survey',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} descends into the shaft where a seam of ore runs deep in the cold rock, far richer than the ledgers suggest.',
        onSuccess: {
          narrative: '{actor} reads the stone correctly — the vein is real, running deep and wide. The foreman scratches his beard and does not speak for a while.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} misjudges the depth. The vein twists away into harder rock, unreachable with the tools on hand.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'the_rich_vein.extraction',
        name: 'The Extraction',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must fund and organise the extraction before word spreads and rivals move in.',
        onSuccess: {
          narrative: '{actor}\'s arrangements hold. Carts of ore roll out, and the settlement\'s stores swell.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s planning buckles under the weight of the hauling. The seam is still there; the season to work it is not.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'the_rich_vein.collapse',
        name: 'The Risk',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The shaft groans. {actor} must decide — press on into the unstable seam, or pull back and lose the haul.',
        onSuccess: {
          narrative: '{actor} reads the warning in the rock and braces the shaft in time. The ore comes out, and everyone comes out with it.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'The shaft comes down with terrible finality. {actor} escapes, but the ore is buried, and the leg that got out will not be the same leg afterwards.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#survival'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.labor_dispute',
    name: 'Labor Dispute',
    locationTypes: ['mining', 'hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.mine'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'labor_dispute.grievance',
        name: 'The Grievance',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The miners have downed tools. A foreman presents their list of grievances to {actor}, whose authority over the mine is now on trial.',
        onSuccess: {
          narrative: '{actor} listens without flinching. The miners\' litany runs long — some of it fair, some of it embellishment. {actor} separates the two.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor}\'s attention wanders, and the foreman sees it wander. The jaw tightens. This is going to cost more than it should.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'labor_dispute.resolution',
        name: 'The Resolution',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: '{actor} must choose: pay the miners fairly and accept the cost, or squeeze them and risk a harder fight later.',
        onSuccess: {
          narrative: '{actor} offers terms — not generous, but honest. The tools go back to work, and word spreads that {actor} is fair.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} lowballs the settlement. The miners go back down slowly, carrying a resentment the mine will feel for seasons.',
          reputationDelta: -0.06,
        },
      },
    ],
  },

  // ── Harbor (2) ─────────────────────────────────────────────────
  {
    id: 'encounter.foreign_trader',
    name: 'Foreign Trader',
    locationTypes: ['town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.harbor'],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'foreign_trader.appraisal',
        name: 'The Appraisal',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A foreign vessel has docked. The captain spreads exotic wares across the quay, and {actor} must determine what is genuinely rare and what is dockside theatre.',
        onSuccess: {
          narrative: '{actor}\'s eye cuts through the display. Two items are genuine; the rest is clever staging. {actor} knows which is which.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor}\'s appraisal lands in the middle and commits to neither reading. The captain notices, and prices accordingly.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'foreign_trader.negotiation',
        name: 'The Negotiation',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The captain quotes a price in a coin nobody on this quay mints. {actor} must negotiate across that, a language barrier, and a set of customs neither side has thought to explain.',
        onSuccess: {
          narrative: '{actor} bridges the gap with coin and a trader\'s instinct for when to stop talking. The goods change hands at terms both sides can defend at home.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
        onFailure: {
          narrative: 'A term goes wrong in translation. {actor} overpays, or misses what the captain was actually offering. The goods are sound; the price is not.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { possession: 0.9, condition: 0.1 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.pirate_raid',
    name: 'Pirate Raid',
    locationTypes: ['town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.harbor'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'pirate_raid.warning',
        name: 'The Warning',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (duel-family batch).
        narrative: 'Sails on the horizon, wrong colours. {actor} has minutes to rally the harbor guards and get a defence onto the quay before the raiders make land.',
        onSuccess: {
          narrative: '{actor} gets the chains up and the archers onto the warehouse roofs with time to spare. The first boat comes in under arrow fire and thinks better of the second.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s orders arrive out of sequence and half of them not at all. The docks are still arguing when the first hull scrapes stone.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'pirate_raid.repel',
        name: 'The Repel',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Raiders pour across the gangplanks. {actor} is in the thick of it — defend the cargo sheds or let them burn.',
        onSuccess: {
          narrative: '{actor} holds the line at the shed doors and makes them pay for every yard of it. They take more losses than the cargo is worth and pull back to the boats.',
          reputationDelta: 0.09,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} is pushed off the quay. The sheds go up, and the harbor smells of burnt pitch and grain for a week after the ships depart.',
          reputationDelta: -0.07,
        },
      },
      {
        id: 'pirate_raid.aftermath',
        name: 'The Aftermath',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The raiders are rallying for a second push. {actor} must lead the counterattack before they regroup.',
        onSuccess: {
          narrative: '{actor} takes them while they are still forming up and drives them into the water. The harbor will not be struck again this season.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
            tagFilters: ['#beast'],
          },
        },
        onFailure: {
          narrative: 'The second wave comes in wider, and the defence is not there to meet it. {actor} survives. The harbor is stripped back to the stone.',
          reputationDelta: -0.12,
          rewardPool: {
            categoryWeights: { condition: 0.6, possession: 0.4 },
            tagFilters: ['#beast'],
          },
        },
      },
    ],
  },

  // ── Counting House (2) ─────────────────────────────────────────
  {
    id: 'encounter.the_loan',
    name: 'The Loan',
    locationTypes: ['town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.counting-house'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'the_loan.proposal',
        name: 'The Proposal',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Across the ledger, a choice. {actor} can extend a loan to a desperate borrower — terms to be set, risk to be weighed. No sword needed. Only judgment.',
        onSuccess: {
          narrative: '{actor} draws up the terms: fair interest, a schedule the borrower can actually meet, and a clause that protects both parties. The borrower considers.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor}\'s terms lean too far in one direction. The borrower balks, or the house extends more than wisdom allows. The ledger closes exposed.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'the_loan.binding',
        name: 'The Binding',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: '{actor} must read the borrower\'s true intent before ink touches parchment. A cautious lender and a desperate debtor — the agreement must hold both.',
        onSuccess: {
          narrative: 'The agreement is struck. Both parties sign without flinching, and the debt is recorded as what it is: an obligation freely made.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
        onFailure: {
          narrative: '{actor}\'s judgment slips. The borrower signs, but the terms breed resentment before the ink is dry.',
          reputationDelta: -0.04,
          rewardPool: {
            categoryWeights: { blessing: 0.6, condition: 0.4 },
          },
        },
      },
    ],
  },
  {
    id: 'encounter.debt_collection',
    name: 'Debt Collection',
    locationTypes: ['town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.counting-house'],
    reachPrimary: 'gold',
    reachSecondary: 'iron',
    encounterType: 'hire',
    reputationPolarity: 'positive', // legitimate debt enforcement — contract authority, not violence (2a)
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'debt_collection.demand',
        name: 'The Demand',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: wedged tokens removed (hire-family batch). The authored bones were sound;
        // the `{adj}`/`{verb}` slots sat inside otherwise working sentences.
        narrative: 'The agreement is past due. {actor} presents the ledger to the debtor, who has an explanation ready and a second one waiting behind it. Every word is a delay wearing the manners of cooperation.',
        onSuccess: {
          narrative: '{actor} lays out the terms without apology and without heat, and reads the total aloud twice. The debtor stops explaining and starts proposing dates.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} allows one further week as a courtesy. The debtor hears a precedent rather than a courtesy, and by the next visit the debt has become a matter for lawyers.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'debt_collection.enforcement',
        name: 'The Enforcement',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Words have failed. What remains to {actor} is consequence rather than violence: the guild notified, the credit withdrawn, the debtor\'s name read out where the suppliers can hear it.',
        onSuccess: {
          narrative: '{actor} files the notice and takes no further step. Payment arrives inside four days, in full, delivered by a clerk who will not meet {their} eye.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The debtor is gone before the notice takes effect — house emptied, counting-house lease signed over to a cousin. {actor} holds a contract that is entirely valid and entirely uncollectable.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ── Smuggler's Den (2) ─────────────────────────────────────────
  {
    id: 'encounter.black_market_deal',
    name: 'Black Market Deal',
    locationTypes: ['hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.smugglers-den'],
    reachPrimary: 'gold',
    reachSecondary: 'shadow',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'black_market_deal.contact',
        name: 'The Contact',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} follows directions given twice and written down nowhere, to a back room that smells of tallow and wet wool. The broker is there. So, perhaps, is a watcher.',
        onSuccess: {
          narrative: '{actor} arrives on the hour, reads the room, and gives the signal the broker is waiting on. The goods come out from under the table wrapped in sacking.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: '{actor} looks at the door twice and at the broker once too often. Two men by the wall stop talking. The broker packs up and leaves without a word.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'black_market_deal.purchase',
        name: 'The Purchase',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        // `the situation` is in the evasive set, which is enforced at zero in every field
        // class — it went out with the tokens rather than surviving beside them.
        narrative: 'The goods are real. The risk is real. {actor} has to buy quickly, pay without haggling, and be gone before anyone in the room decides {they} might be worth following.',
        onSuccess: {
          narrative: '{actor} completes the exchange in under a minute. No names. No receipts. The sacking goes under a coat, and the coat goes out the door.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'The watcher was real. The goods are seized, and {actor}\'s name goes onto a list kept by people who do not lose lists. That will cost more than the coin did.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#shadow'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.the_fence',
    name: 'The Fence',
    locationTypes: ['hamlet', 'town', 'city', 'capital'],
    sublocationTypes: ['sublocation-type.smugglers-den'],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'the_fence.transaction',
        name: 'The Transaction',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} has goods that cannot be sold honestly. The fence names a price worth about a third of them, which is the going insult. {They} can take it, or carry the risk to the next door down.',
        onSuccess: {
          narrative: 'The exchange is made without either of them saying aloud what is being sold. {actor} walks out lighter and richer, and no ledger anywhere is the wiser.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The fence turns the goods over once, sets them down, and waves {actor} off without naming a price. Word travels from there: the original owner is asking after them by name.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'the_fence.clean_exit',
        name: 'The Clean Exit',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Coin in hand, {actor} has to leave the quarter without becoming interesting. The people on these streets remember faces for a living.',
        onSuccess: {
          narrative: '{actor} takes the alleys at an unhurried pace and comes out onto the main road with the coin quiet in {their} coat. Nobody follows.',
          reputationDelta: 0.07,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
        onFailure: {
          narrative: '{actor} walks too fast for the hour. A constable marks the pace; a woman in a doorway marks the face. The coin was earned. The attention was not.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
          },
        },
      },
    ],
  },

  // ── Caravan Rest (2) ──────────────────────────────────────────
  {
    id: 'encounter.toll_bridge',
    name: 'Toll Bridge',
    locationTypes: ['hamlet', 'town', 'city', 'capital', 'camp'],
    sublocationTypes: ['sublocation-type.caravan-rest'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'toll_bridge.control',
        name: 'The Control',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} holds the only crossing for a day\'s ride. Merchants pass or they go around. The toll is the whole question — how much is enough, and how much is too much.',
        onSuccess: {
          narrative: '{actor} sets a toll merchants can bear without real complaint. Coin flows, and nobody loses a day going around.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor}\'s toll is too steep. One merchant turns back; another finds a shortcut and tells the rest. The crossing earns less than it did before the gate went up.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'toll_bridge.reputation',
        name: 'The Reputation',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Word of the toll travels up and down the road faster than the wagons do. {actor} has a chance to shape what is said: a fair tax, or a bandit with a gate.',
        onSuccess: {
          narrative: 'Caravans speak of {actor}\'s toll as reasonable — expensive, but posted, and the same for everyone. The road stays open and the coin keeps coming.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The stories run in the wrong direction. Merchants start finding other routes, and each week the gate takes in a little less than the last.',
          reputationDelta: -0.06,
        },
      },
    ],
  },
  {
    id: 'encounter.caravan_guard',
    name: 'Caravan Guard',
    locationTypes: ['hamlet', 'town', 'city', 'capital', 'camp'],
    sublocationTypes: ['sublocation-type.caravan-rest'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'hire',
    reputationPolarity: 'positive', // legitimate escort contract — fair pay, clear terms (2a)
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'caravan_guard.contract',
        name: 'The Contract',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: wedged tokens removed (hire-family batch). Here {actor} is the hired party
        // rather than the employer — the same contract read from the other side of the table.
        narrative: 'A merchant needs six swords for a route that has attracted attention twice this season. {actor} settles the rate and the terms at the caravan-rest, before the wagons are loaded and the merchant\'s need turns into leverage.',
        onSuccess: {
          narrative: '{actor} agrees plain terms: pay by the day, a bonus on undamaged delivery, and a written line on who decides when to run. The merchant signs gladly, having been robbed once already by an ambiguity.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: '{actor} holds out for the higher rate. The merchant hires four cheaper swords instead and leaves a day early, and the coin leaves with them.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'caravan_guard.escort',
        name: 'The Escort',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Three days on the road. On the second, riders hold the ridge line for an hour without closing. {actor} has to place the guards and decide whether that is a count being taken or a herd being moved.',
        onSuccess: {
          narrative: '{actor} puts two swords forward where they can be counted and keeps four out of sight. The riders take the count, find the sum unwelcome, and are gone by dusk. Nobody draws.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} reads the riders as drovers and keeps the guard bunched at the front. They come in at the third wagon from the ditch side and are away with the bolt-cloth inside two minutes. The merchant does not shout, which is worse than shouting.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'caravan_guard.delivery',
        name: 'The Delivery',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The last stretch is the one the guards have already been paid for and the one they are most tempted to hurry. Word comes up the road of a second party waiting at the ford. {actor} has to keep six tired swords moving at the pace that keeps them useful.',
        onSuccess: {
          narrative: '{actor} holds the pace and takes the long route around the ford, which costs half a day and no cargo at all. The bonus is paid at the gate, and the merchant asks for {actor} by name on the next run.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The ford is precisely what the rumour said. {actor} gets the wagons through and two of the six swords do not come out with them. The cargo arrives; the bonus does not; and the merchant pays the day-rate in full without being asked, which is its own verdict.',
          reputationDelta: -0.10,
        },
      },
    ],
  },

  // ─── Higher-Difficulty Location-Specific Templates (diff 40–90) ────
  //
  // 30+ templates for mid-game and late-game agents across all archetypes.
  // Difficulty tiers: moderate (40–50), hard (60–70), deadly (80–90).
  // Added in Phase 15 Plan 03 to extend progression beyond the early-game pool.

  // ── Settlement Types ──────────────────────────────────────────────

  {
    id: 'encounter.guild_initiation_trial',
    name: 'Guild Initiation Trial',
    locationTypes: ['hamlet', 'town', 'city'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'hire',
    reputationPolarity: 'positive', // sanctioned institutional membership trial (2a)
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'loyalty_ambition'],
    steps: [
      {
        id: 'guild_initiation.challenge',
        name: 'The Opening Challenge',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: wedged tokens removed (hire-family batch). The two crit-band afterimages
        // below were already authored and are left untouched.
        narrative: 'The guild masters watch from the gallery as {actor} steps onto the trial floor. The sand has not been swept since the last candidate, which is not an oversight.',
        onSuccess: {
          narrative: '{actor} takes the first exchange without hurrying and without decorating it. Up in the gallery, two masters stop talking to each other.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} opens well and then adds a flourish nobody asked for. A master writes one short line and does not look up again.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'guild_initiation.prove_worth',
        name: 'Prove Your Worth',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        // THR-1101: the bare `{they} stand` below rendered as "she stand" and predates this
        // batch — it sits on a line carrying no word-pool token, so the campaign's own scan
        // could never have flagged it (impediment #567). Found by rendering the family.
        narrative: 'The final test is not skill — it is allegiance. {actor} must declare what {they} stand{s} for before the assembled guild.',
        criticalSuccessAfterimage: '{actor} says the one sentence the guild did not know it was waiting to hear. The masters offer the oath and a place near the centre of the room with it — and a few of the older ones begin watching {them} as an inheritance rather than an applicant.',
        criticalFailureAfterimage: 'The declaration lands wrong before the whole assembled guild — not merely hollow but revealing, a glimpse of {actor} that the masters will not unsee. Membership is not withheld this once. It is closed.',
        onSuccess: {
          narrative: '{actor} names the one order {they} would refuse, and names it ahead of everything the guild came to hear. The oath is offered before the sentence is done.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The declaration is the one the guild hears most often, in the words it usually hears it in. Membership is withheld rather than refused, and the masters take care to say so aloud.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  {
    id: 'encounter.master_craftsman_challenge',
    name: 'Master Craftsman Challenge',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['preservation_transformation', 'asceticism_extravagance'],
    steps: [
      {
        id: 'master_craftsman.design',
        name: 'The Commission',
        reach: 'stone',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'A wealthy patron offers a commission every other craftsman has turned down. {actor} reads the drawing twice and finds the reason: it calls for a joint that should not hold.',
        onSuccess: {
          narrative: 'The joint will hold if it is cut in the wrong order. {actor} starts cutting.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The design defeats {actor} at first reading. {They} must rebuild {their} approach.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'master_craftsman.execution',
        name: 'The Execution',
        reach: 'gold',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Days of work, each piece cut to a tolerance nobody will ever see. The patron visits to inspect progress, asking questions that probe {actor}\'s every decision.',
        criticalSuccessAfterimage: 'The patron sets down every objection prepared in advance and simply looks. Word of the piece travels faster than {actor} can follow it, and other patrons begin to arrive before the varnish has dried.',
        criticalFailureAfterimage: 'The work fails at the unveiling — a flaw {actor} had talked past surfaces under the patron\'s hand. The commission is refused, the fee withheld, and the story reaches the guild before {actor} does.',
        onSuccess: {
          narrative: 'The patron pays without haggling, which is not the habit of a lifetime. The piece will outlast them both.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, bestowed_power: 0.4 },
            tagFilters: ['#craft'],
          },
        },
        onFailure: {
          narrative: 'The patron is unmoved. The work is competent, and competent was not the commission. It is paid for, and not renewed.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.6, bestowed_power: 0.4 },
            tagFilters: ['#craft'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.political_intrigue',
    name: 'Political Intrigue at Court',
    locationTypes: ['city', 'capital'],
    reachPrimary: 'heart',
    reachSecondary: 'shadow',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['honesty_cunning', 'loyalty_ambition'],
    steps: [
      {
        id: 'political_intrigue.read_room',
        name: 'Read the Room',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The court is a maze of alliances and grievances, most of them undeclared. {actor} maps the currents before speaking a word.',
        onSuccess: {
          narrative: '{actor} reads the court like a familiar text — every faction\'s hope and fear legible by the second pass.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} misreads a key faction\'s intent, and proceeds on false ground without knowing it yet.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'political_intrigue.play_factions',
        name: 'Play the Factions',
        reach: 'shadow',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The opening comes. {actor} must balance three competing demands without naming which of the three {they} actually came for.',
        onSuccess: {
          narrative: '{actor} moves through the court\'s web without snagging it. Two factions leave satisfied, one intrigued. The outcome belongs to {actor}.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The court sees through the maneuvering. Old alliances cool, and the new enemies are the patient kind.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'political_intrigue.secure_outcome',
        name: 'Secure the Outcome',
        reach: 'heart',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The final negotiation. {actor} sits across from the strongest power in the room, at the table where the reading either paid off or did not.',
        onSuccess: {
          narrative: '{actor} finds what that power actually values, which is not what it has been saying, and offers that instead. The agreement is sealed.',
          reputationDelta: 0.16,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The final deal comes apart at the table. {actor} leaves court having learned exactly what overreach costs, at the price it usually asks.',
          reputationDelta: -0.10,
        },
      },
    ],
  },

  {
    id: 'encounter.trade_caravan_escort',
    name: 'Trade Caravan Escort',
    locationTypes: ['hamlet', 'town', 'city'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'asceticism_extravagance'],
    steps: [
      {
        id: 'caravan_escort.depart',
        name: 'Departure',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The caravan master is nervous — two caravans lost this season. {actor} must hold the convoy together from the first hour.',
        onSuccess: {
          narrative: '{actor} sets a pace the slowest wagon can keep and a clear watch rotation. The caravan departs in good order.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The convoy staggers at the first sign of trouble. {actor} spends the whole first day managing fear, not movement.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'caravan_escort.ambush',
        name: 'Ambush on the Road',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Shapes move in the treeline, keeping pace. {actor} has seconds to react before the caravan freezes.',
        onSuccess: {
          narrative: '{actor} drives them off with decisive force before the first wagon stops. The caravan passes safely.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The ambush costs them half the goods and one of the guards. The caravan limps on.',
          reputationDelta: -0.07,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.festival_of_spheres',
    name: 'Festival of the Spheres',
    locationTypes: ['town', 'city', 'capital'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['tradition_novelty', 'loyalty_ambition'],
    steps: [
      {
        id: 'festival_spheres.participate',
        name: 'Join the Rites',
        reach: 'veil',
        difficulty: MODERATE_DIFFICULTY_BASE - 5,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (batch 12,
        // divination slice).
        narrative: 'The Festival draws pilgrims from every road, and every road brought its own version of the rite. {actor} has to get through the first hour without performing the wrong one.',
        onSuccess: {
          narrative: '{actor} watches the woman in front and copies her half a beat late all evening. The officiants take it for reverence.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} kneels on the beat the others rise. Nobody says a word, and everybody adjusts to leave a little more room.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'festival_spheres.commune',
        name: 'The Communal Offering',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP - 5,
        duration: 2,
        narrative: 'The last rite is the offering. Each pilgrim gives up one item they would rather keep, and the crowd watches to see how long the choosing takes.',
        onSuccess: {
          narrative: '{actor} chooses fast and gives up more than the rite asks for. The officiant holds it a second longer than the others before setting it down.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.5, condition: 0.5 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: '{actor} gives up the least of what {they} carried in. It is accepted, thanked for, and set at the back of the table.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.5, condition: 0.5 },
            tagFilters: ['#heart'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.plague_outbreak',
    name: 'Plague Outbreak',
    locationTypes: ['hamlet', 'town', 'city'],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'revelation_discretion'],
    steps: [
      {
        id: 'plague_outbreak.diagnose',
        name: 'Diagnose the Sickness',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The sick fill the streets. {actor} must determine what the illness actually is before panic does more damage than the disease.',
        onSuccess: {
          narrative: '{actor} identifies the sickness and how it travels — well water, not breath. Containment becomes possible.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: '{actor} cannot determine the cause. Treatment is guesswork and the disease spreads.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'plague_outbreak.contain',
        name: 'Contain the Spread',
        reach: 'heart',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Containment means separating families, closing markets, enforcing a quarantine against a people already broken by fear.',
        criticalSuccessAfterimage: 'The outbreak does not merely fade — it breaks against {actor} and turns. Households that had shut their doors open them again to nurse their neighbors. The settlement will remember the sickness as the season it learned to hold together.',
        criticalFailureAfterimage: 'The quarantine breaks in the worst place, and {actor} keeps the memory of which door {they} chose to bar and which {they} left open. The settlement survives. It does not forgive, and it does not forget who decided.',
        onSuccess: {
          narrative: '{actor} holds the line without turning cruel about it. The outbreak peaks and begins to fade.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#healing'],
          },
        },
        onFailure: {
          narrative: 'The quarantine breaks at the east gate. The disease escapes containment and the settlement darkens.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.4, possession: 0.2 },
            tagFilters: ['#healing'],
          },
        },
      },
    ],
    foreshadowing: {
      fallback: '{name.first} has heard of the {encounter.heading} spreading through these lands. {pronoun.subject_capitalized} moves to help, though {pronoun.subject} cannot say what, exactly, awaits.',
      variants: [
        {
          id: 'plague_outbreak.unknown',
          when: { intelligenceTier: 'unknown' },
          template: '{name.first} has caught word of sickness spreading through the settlements. {pronoun.subject_capitalized} moves toward the outbreak, uncertain what {pronoun.subject} will find — or what {pronoun.subject} can do.',
        },
        {
          id: 'plague_outbreak.rumor',
          when: { intelligenceTier: 'rumor' },
          template: 'Rumor paints the {encounter.heading} in the worst colors it has — shuttered doors, empty markets, quarantine fires burning through the night. {name.first} does not yet know the truth of it.',
        },
        {
          id: 'plague_outbreak.briefed',
          when: { intelligenceTier: 'briefed' },
          template: 'Word has reached {name.first} through the healer guilds in {encounter_location} — symptoms catalogued, the likely vector named. {pronoun.subject_capitalized} knows what needs doing. The question is how much time remains to do it.',
        },
        {
          id: 'plague_outbreak.expert',
          when: { intelligenceTier: 'expert' },
          template: '{name.first} has encountered this before. The disease has a pattern and it follows it. {pronoun.subject_capitalized} approaches with grim clarity, already planning the quarantine, already mourning what it will cost.',
        },
        {
          id: 'plague_outbreak.threat',
          when: { topMotive: 'threat' },
          template: 'The outbreak has reached a settlement {name.first} cannot allow to fall. {pronoun.subject_capitalized} moves fast, calculating not mercy but necessity, each hour already counted in lives.',
        },
        {
          id: 'plague_outbreak.healer_curiosity',
          when: { topMotive: 'awareness', dominantReach: 'eye' },
          template: 'The disease fascinates {name.first} as disasters do — not with pleasure, but with the need to understand. {pronoun.subject_capitalized} wants to trace the vector, read the pattern, before trying to stop it.',
        },
      ],
    },
  },

  // ── Fort/Castle Types ─────────────────────────────────────────────

  {
    id: 'encounter.siege_defense_planning',
    name: 'Siege Defense Planning',
    locationTypes: ['fort', 'castle'],
    reachPrimary: 'iron',
    reachSecondary: 'star',
    encounterType: 'build',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'preservation_transformation'],
    steps: [
      {
        id: 'siege_defense.assess',
        name: 'Assess the Fortifications',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        // THR-1101: `{adj}` tokens removed from otherwise-authored prose (build-family batch).
        // These nine templates were the family's second failure shape — a word-pool token
        // wedged into a finished sentence, which is where the ungrammatical readings came
        // from ("stand another generation at {adj} least"). Surgical, not rewritten.
        narrative: 'The enemy is days away. {actor} walks the walls and towers, cataloguing every weakness with an honesty nobody will thank {them} for.',
        onSuccess: {
          narrative: '{actor} produces a clear assessment. The garrison knows exactly where to spend its last reserves.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: '{actor} overestimates the walls\' strength. The flaws stay hidden until the worst moment to find them.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'siege_defense.fortify',
        name: 'Reinforce and Rally',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Stone and mortar fly. {actor} drives the garrison through exhausting repairs while keeping their spirits from breaking.',
        onSuccess: {
          narrative: 'The walls hold. When the enemy arrives, they find a garrison rested and ready.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The repairs are unfinished and the garrison is spent. The fort will face the siege undermanned.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  {
    id: 'encounter.prisoner_interrogation',
    name: 'Prisoner Interrogation',
    locationTypes: ['fort', 'castle'],
    reachPrimary: 'shadow',
    reachSecondary: 'heart',
    encounterType: 'acquire',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['honesty_cunning', 'mercy_ruthlessness'],
    steps: [
      {
        id: 'prisoner_interrogation.approach',
        name: 'Choose Your Approach',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The prisoner sits across the table — frightened, defiant, calculating. {actor} must read which before a word is spoken.',
        onSuccess: {
          narrative: '{actor} reads the prisoner accurately and picks the approach that fits.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} misreads the prisoner\'s mask. The opening exchange gives away more than it takes.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'prisoner_interrogation.extract',
        name: 'Extract the Truth',
        reach: 'shadow',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The prisoner is holding one fact worth the whole afternoon. {actor} has to work it free without breaking the man who is carrying it.',
        onSuccess: {
          narrative: '{actor} finds the crack in the prisoner\'s story — a name given twice with two different dates — and works it open.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The prisoner holds his secrets tight. {actor} leaves with sore knuckles and an afternoon spent for a name that was already known.',
          reputationDelta: -0.07,
        },
      },
    ],
  },

  {
    id: 'encounter.fortification_engineering',
    name: 'Fortification Engineering',
    locationTypes: ['fort', 'castle'],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['preservation_transformation', 'sacrifice_survival'],
    steps: [
      {
        id: 'fortification_engineering.design',
        name: 'Survey and Design',
        reach: 'stone',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The castle needs its expansion, and the terrain will not have it. {actor} must find a design that works with the land rather than against it.',
        onSuccess: {
          narrative: '{actor} finds the elegant solution — the expansion carries straight out of the existing structure as though it had always been planned.',
          reputationDelta: 0.07,
        },
        onFailure: {
          narrative: 'The terrain defeats {actor}\'s first three designs. The fourth is a compromise, and nobody in the yard pretends otherwise.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'fortification_engineering.build',
        name: 'Oversee Construction',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Weeks of hard labor under {actor}\'s direction. Stone, mortar, timber — and the endless work of keeping the workforce motivated and unhurt.',
        onSuccess: {
          narrative: 'The expansion stands square and true. The castle is stronger than it has ever been.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A structural flaw shows itself on the final day. The work has to be partly redone, and the cost is taken out of somebody.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ── Ruins Types (Pale Cairn / Grey Meadowguard content deserts) ───

  {
    id: 'encounter.delve_into_depths',
    name: 'Delve into the Depths',
    locationTypes: ['ruins', 'ruined_city', 'ruined_tower', 'ruined_village'],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'revelation_discretion'],
    steps: [
      {
        id: 'delve_depths.descend',
        name: 'Find the Way Down',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        narrative: 'The upper floors were stripped a generation ago; the scavengers left the marks of their own tools on the doorframes. {actor} looks instead for a floor that has fallen through, which is how the lower levels are usually found.',
        onSuccess: {
          narrative: '{actor} finds a stair under a fallen ceiling and spends the afternoon moving rubble one block at a time. The gap it opens is narrow enough to argue about, and wide enough.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Every stair {actor} finds ends in packed fill. It was poured deliberately, and poured from below — this place was shut by the people who lived in it.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'delve_depths.navigate',
        name: 'Navigate the Ruin',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The lower levels have been shut long enough that the first lamp burns badly. {actor} moves along the walls, where the floor is still carried by the joists.',
        onSuccess: {
          narrative: '{actor} works out the building\'s plan from three rooms and stops guessing after that. Storerooms below kitchens, kitchens below halls. The map fills in ahead of {their} feet.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A floor lets go under {actor} and takes a room\'s worth of ceiling down with it. The dust clears on the wrong side of the drop. The lamp is still lit, which is more luck than {actor} will admit to later.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'delve_depths.retrieve',
        name: 'Retrieve the Prize',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The lowest floor is dry, which is the first surprise, and occupied, which is the second. {actor} came for one item and has a decision to make about how long to stay.',
        onSuccess: {
          narrative: '{actor} comes up into daylight carrying a sealed case and a lungful of dust that will take a week to clear. The ruin gave up one floor of the several it has.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.4, bestowed_power: 0.4, condition: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: '{actor} goes back up with empty hands and an accurate memory of the route. The bottom floor is still down there, and now {actor} knows exactly how far.',
          reputationDelta: -0.07,
          rewardPool: {
            categoryWeights: { possession: 0.4, bestowed_power: 0.4, condition: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.decipher_ancient_inscriptions',
    name: 'Decipher Ancient Inscriptions',
    locationTypes: ['ruins', 'ruined_city'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['revelation_discretion', 'tradition_novelty'],
    steps: [
      {
        id: 'decipher_inscriptions.locate',
        name: 'Locate the Text',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101 (batch 13, scholarship slice).
        narrative: 'The carving covers walls, floors and lintels, and most of it was cut by masons who could not read it either. One surface is the text. The rest is border.',
        onSuccess: {
          narrative: '{actor} finds it by the spacing — the one panel where the carver left room for the words to be wrong. Under the grime the letters are sharp enough to argue with.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} spends two days on a lintel and comes away with a clean, confident reading of a decorative border. It says the same four words forty-one times.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'decipher_inscriptions.translate',
        name: 'Work the Translation',
        reach: 'veil',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The grammar has a case for things done to you by the dead. No living tongue has needed one, so every rendering {actor} writes is a little bit of a lie.',
        onSuccess: {
          narrative: '{actor} breaks it on the numerals. The inscription names the people who raised this place, and the year they walked away from it — a century before any record says they existed.',
          reputationDelta: 0.16,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, possession: 0.4 },
            tagFilters: ['#ancient', '#knowledge'],
          },
        },
        onFailure: {
          narrative: '{actor} gets four clauses out of nine. They are the four describing what was done — the subject and the reason both sit in the five that will not come.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, possession: 0.4 },
            tagFilters: ['#ancient', '#knowledge'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.restless_spirits',
    name: 'Restless Spirits',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_village'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'tradition_novelty'],
    steps: [
      {
        id: 'restless_spirits.commune',
        name: 'Make Contact',
        reach: 'veil',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The spirits cling to the ruin\'s bones — neither gone nor present, howling at what they cannot release. {actor} must reach them across the veil.',
        onSuccess: {
          narrative: '{actor} opens the channel and makes contact. The spirits are old, confused, but aware.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The spirits recoil at {actor}\'s approach. Contact is not made — only felt, like a wound under cold water.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'restless_spirits.resolve',
        name: 'Offer Resolution',
        reach: 'heart',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} must understand what holds the spirits here and offer them a reason to let go — not through force, but through compassion.',
        onSuccess: {
          narrative: 'One by one, the presences still. The ruin is quieter. Not empty — but no longer haunted.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The spirits cannot be reached. They turn from {actor}\'s offering and retreat deeper into the ruin.',
          reputationDelta: -0.07,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.salvage_operation',
    name: 'Salvage Operation',
    locationTypes: ['ruins', 'ruined_city', 'ruined_village'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['preservation_transformation', 'asceticism_extravagance'],
    steps: [
      {
        id: 'salvage_operation.survey',
        name: 'Survey the Pickings',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE - 5,
        duration: 1,
        narrative: 'The ruin offers plenty — and hazard in the same measure. {actor} must assess what can be safely removed and what must be left to gravity.',
        onSuccess: {
          narrative: '{actor} identifies the high-value salvage that can come out without bringing the rest down after it.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} misjudges which walls are still carrying load. The best pickings sit behind the ones that are.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'salvage_operation.extract',
        name: 'Extract the Goods',
        reach: 'stone',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP - 5,
        duration: 2,
        narrative: 'Beams, stonework, ironwork, timber — {actor} takes each piece in the reverse of the order it was set, while the ruin groans overhead.',
        onSuccess: {
          narrative: '{actor} carries out a considerable load. A profitable day\'s work from the bones of the old world.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'A partial collapse in the north corner forces {actor} back. What comes out is a cart-load of rubble with two good beams in it.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.seal_the_breach',
    name: 'Seal the Breach',
    locationTypes: ['ruins', 'ruined_city'],
    reachPrimary: 'veil',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ['courage_prudence', 'sacrifice_survival'],
    steps: [
      {
        id: 'seal_breach.locate',
        name: 'Find the Source',
        reach: 'eye',
        difficulty: DEADLY_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (story_beat tier).
        narrative: 'A pressure comes up out of the ruin\'s lower levels, steady as a draught. It is not weather and it is not spirit-work. {actor} has to find where it enters before it reaches the foundations.',
        onSuccess: {
          narrative: '{actor} tracks it down three levels to a seam in the floor that has no business being a seam. The pressure is strongest at arm\'s length above it.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The pressure reads identical on every level, which means {actor} has spent two days measuring an effect and not a source. The upper rooms have started to feel it too.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'seal_breach.prepare',
        name: 'Prepare the Sealing',
        reach: 'veil',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The sealing rite has to be right the first time. A botched seal does not fail closed — it fails open, and it takes whoever was holding it. {actor} lays the anchors out and checks them twice while there is still light.',
        onSuccess: {
          narrative: 'The rite holds under load. The breach pushes back hard enough to crack an anchor stone, and {actor} keeps the shape of it anyway.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'An anchor slips at the third recitation and the rite comes apart in {actor}\'s hands. The recoil throws {them} clear with scorched palms and ringing ears. The breach is wider than it was, and now it has been touched.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'seal_breach.close',
        name: 'Seal It Shut',
        reach: 'iron',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The last of it is will and not craft. {actor} has to drive the seal home against a pressure that has spent three days learning what frightens {them}.',
        onSuccess: {
          narrative: 'The breach shuts with a sound like the world letting out a breath it had been holding. {actor} stays kneeling in the quiet for longer than is dignified.',
          reputationDelta: 0.20,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The seal cracks under the last push and {actor} runs. Behind {them} the floor gives, and the ruin folds inward around a gap a person could now walk through upright.',
          reputationDelta: -0.12,
        },
      },
    ],
  },

  // ── Wilderness/Camp/Mining ─────────────────────────────────────────

  {
    id: 'encounter.beast_hunt',
    name: 'Beast Hunt',
    locationTypes: ['wilderness', 'camp'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'acquire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    steps: [
      {
        id: 'beast_hunt.track',
        name: 'Track the Beast',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The creature has been raiding the outlying camps for weeks, and always on the nights with no moon. {actor} must find its trail before the next dark.',
        onSuccess: {
          narrative: '{actor} reads the signs correctly — a bent branch, a print in soft earth, a scrape of hair at chest height. The trail is clear.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The creature crosses water twice and the trail ends in gravel. {actor} circles back empty and starts again from the last camp it hit.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'beast_hunt.confront',
        name: 'The Confrontation',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The beast is larger than the rumours had it. {actor} faces it alone in a clearing with a single opening, and the beast is standing in it.',
        onSuccess: {
          narrative: '{actor} ends the hunt in the opening, where the beast has to come straight on. The camps will sleep tonight.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.5 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The beast breaks past into the trees and is gone in four strides. {actor} retreats with a torn arm and a hunt that is now personal on both sides.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.5 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.prospecting_expedition',
    name: 'Prospecting Expedition',
    locationTypes: ['wilderness', 'mining'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['revelation_discretion', 'asceticism_extravagance'],
    steps: [
      {
        id: 'prospecting.survey',
        name: 'Survey the Ground',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 2,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        narrative: 'Ore leaves signs on the surface for anyone holding the list: stained water, a slope where one plant will not grow, a ridge of rock running against the grain of the rest. {actor} walks the ground for nine days with that list in mind.',
        onSuccess: {
          narrative: 'Three of the signs turn up inside a half-mile of each other, which is more than coincidence usually pays for. {actor} drives a stake and writes down the bearing from two hills.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The signs turn up one at a time, miles apart, each with an innocent explanation. {actor} comes back with a notebook full of maybes and boots worth less than at the start.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'prospecting.verify',
        name: 'Verify the Vein',
        reach: 'stone',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} sinks test shafts at the three best marks. Each shaft costs a week and tells the truth exactly once, at the bottom.',
        onSuccess: {
          narrative: 'The second shaft strikes ore at eleven feet and keeps finding it for another six. {actor} has a mine here, given ground held long enough to dig it.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, bestowed_power: 0.3 },
            tagFilters: ['#stone'],
          },
        },
        onFailure: {
          narrative: 'All three shafts bottom out in dry rock. The expedition cost a season and four hired backs, and produced an accurate map of where the ore is not.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.7, bestowed_power: 0.3 },
            tagFilters: ['#stone'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.hermits_wisdom',
    name: "Hermit's Wisdom",
    locationTypes: ['wilderness'],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['loyalty_ambition', 'revelation_discretion'],
    steps: [
      {
        id: 'hermits_wisdom.find',
        name: 'Find the Hermit',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE - 5,
        duration: 1,
        // THR-1101 (batch 13, scholarship slice).
        narrative: 'The hermit has been out here long enough to be good at it. Nobody keeps a camp this quiet by accident, and that is the first true thing anyone learns about the hermit.',
        onSuccess: {
          narrative: '{actor} follows the wrong signs for a day, then the right ones: a cold fire ring, a grave someone still weeds. The hermit is sitting where the smoke would not show.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} walks four days of good country and finds only what the weather put there. The hermit may well have watched {them} go.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'hermits_wisdom.earn_trust',
        name: 'Earn the Teaching',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP - 5,
        duration: 2,
        narrative: 'The hermit puts water on and asks nothing at all. The silence is the examination, and it runs as long as {actor} lets it run.',
        onSuccess: {
          narrative: '{actor} gives the true reason instead of the presentable one, and the night goes long. What {actor} carries back out is a question, not an answer, and it will not put itself down.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The hermit talks about the weather until the fire burns down, kindly and at length. Walking back, {actor} works out that the examination ended early.',
          reputationDelta: -0.03,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.bandit_ambush',
    name: 'Bandit Ambush',
    locationTypes: ['wilderness', 'camp'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'mercy_ruthlessness'],
    steps: [
      {
        id: 'bandit_ambush.react',
        name: 'Immediate Response',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (duel-family batch).
        narrative: 'The ambush was set by someone who knew the road — rocks above, trees on both sides, and the track narrowing exactly where it should not.',
        onSuccess: {
          narrative: '{actor} is moving before the first arrow lands, out of the channel and into the rocks. The plan was a good one and it lasted four seconds.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} stops to look, which is the half-second the whole ambush was built around. They close from three sides.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'bandit_ambush.turn_tables',
        name: 'Turn the Tables',
        reach: 'shadow',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Outnumbered, but the terrain does not care who set it. {actor} works uphill through the rocks the bandits left unwatched, because nobody comes that way.',
        onSuccess: {
          narrative: '{actor} comes down on them from their own high ground. Two run, one is not given the chance, and the road is quiet inside a minute.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.5 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The bandits hold the rocks and the road both. {actor} gets clear down the streambed, lighter by a pack and a good deal of blood.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.5 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.mineral_vein_discovery',
    name: 'Mineral Vein Discovery',
    locationTypes: ['mining'],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['preservation_transformation', 'asceticism_extravagance'],
    steps: [
      {
        id: 'mineral_vein.survey',
        name: 'Follow the Formation',
        reach: 'stone',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        narrative: 'The seam runs into the mountain at an angle that says it goes a long distance. Following it is straightforward. Deciding where to stop is the part that costs money.',
        onSuccess: {
          narrative: '{actor} reads the fracture pattern right and keeps going past where a careful person would have turned around. At two hundred feet the seam widens instead of pinching.',
          reputationDelta: 0.07,
        },
        onFailure: {
          narrative: 'At ninety feet the seam thins to a finger\'s width and then to a stain. {actor} has spent three weeks proving that the mountain is mostly mountain.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'mineral_vein.assess',
        name: 'Assess the Vein',
        reach: 'gold',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The vein is real. What it is worth depends on how far it runs, and the only honest answer comes from measuring it rather than hoping at it.',
        onSuccess: {
          narrative: '{actor} maps it end to end and checks the figures twice before saying the number out loud. No one has taken this much out of this mountain in forty years.',
          reputationDelta: 0.16,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, bestowed_power: 0.4 },
            tagFilters: ['#stone'],
          },
        },
        onFailure: {
          narrative: 'Measured properly, the vein is a third of what it looked like from the face. Worth digging. Not worth what {actor} has already told people it was worth.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.6, bestowed_power: 0.4 },
            tagFilters: ['#stone'],
          },
        },
      },
    ],
  },

  // ── Shrine/Temple Types ───────────────────────────────────────────

  {
    id: 'encounter.pilgrimage_trial',
    name: 'Pilgrimage Trial',
    locationTypes: ['shrine', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'heart',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['tradition_novelty', 'courage_prudence'],
    steps: [
      {
        id: 'pilgrimage_trial.journey',
        name: 'The Sacred Path',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 2,
        // THR-1101 (batch 13, scholarship slice).
        narrative: 'The road is not the hard part. Custom is that a pilgrim gives up what they would rather keep, chooses it alone, and is never asked afterward what it was.',
        onSuccess: {
          narrative: '{actor} gives up the one {they} had been hoping would not count. The road afterwards is the same road and walks differently.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} offers up what was already spent. The road takes it, because the road takes everything, and the walk afterwards is exactly the walk before.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'pilgrimage_trial.arrive',
        name: 'Arrival at the Shrine',
        reach: 'veil',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The last mile is walked without company. The veil is thin at the shrine, and thin things are poor at telling a guard apart from a lie.',
        onSuccess: {
          narrative: 'The shrine does not do anything. {actor} is received all the same, and walks back out carrying a stillness {they} did not bring in.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: '{actor} stands in the doorway for an hour. The threshold does for {them} what it does for strangers, which is to stay a doorway, and there is no one to appeal to about it.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.sacred_text_study',
    name: 'Sacred Text Study',
    locationTypes: ['shrine', 'temple'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['revelation_discretion', 'tradition_novelty'],
    steps: [
      {
        id: 'sacred_text.access',
        name: 'Gain Access',
        reach: 'heart',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101 (batch 13, scholarship slice).
        narrative: 'The custodians do not refuse outright. They ask what {actor} intends to do with what is written there, and they have been asked that before by people who lied well.',
        onSuccess: {
          narrative: '{actor} answers smaller than expected — one question, honestly bounded. A custodian unlocks the case and then stays in the room.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} answers too well. The senior custodian thanks {them} for the interest and recommends the copies kept for visitors, which are accurate and say little.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'sacred_text.study',
        name: 'Study the Texts',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 4,
        narrative: 'Four days in a room with no window, by design. The text is layered, and each layer was written for a reader who had already survived the one above it.',
        onSuccess: {
          narrative: 'On the fourth day the outer doctrine stops being the point and becomes the lock. What it was keeping shut is shorter than {actor} expected, and worse.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: '{actor} leaves with the doctrine word-perfect and no sense of what it is for. The custodians are pleased. It is what most readers take away.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.mystical_vision_quest',
    name: 'Mystical Vision Quest',
    locationTypes: ['shrine', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ['courage_prudence', 'tradition_novelty'],
    steps: [
      {
        id: 'vision_quest.enter',
        name: 'Enter the Vision',
        reach: 'veil',
        difficulty: DEADLY_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (story_beat tier).
        narrative: 'The potion is bitter and slow. {actor} counts sixty breaths before the room stops behaving like a room. Nobody who has crossed this threshold has come back able to describe it usefully.',
        onSuccess: {
          narrative: '{actor} comes through whole. The self thins on the crossing and holds, which is the part that cannot be taught to anyone.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The crossing tears. {actor} is stuck half through it, awake and unable to make a sound, for what the priests outside measure as a quarter of an hour.',
          reputationDelta: -0.06,
        },
      },
      {
        id: 'vision_quest.navigate',
        name: 'Navigate the Vision',
        reach: 'eye',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The vision is vast and does not reward reason. {actor} came in with a question, and has to keep hold of both the question and the thread back to {their} own body.',
        onSuccess: {
          narrative: '{actor} finds the answer and grips it while the vision rearranges itself around {them} twice.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The thread goes slack. {actor} wanders a beautiful, unreadable country until the priests haul {them} back by the body.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'vision_quest.return',
        name: 'Return with the Gift',
        reach: 'veil',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'Carrying it back is the hard part. The knowledge wants to stay where it was found, and it thins as {actor} nears the threshold.',
        onSuccess: {
          narrative: '{actor} comes back into {their} body still holding it. The priests do not ask what {they} saw — it is legible enough in {their} face.',
          reputationDelta: 0.20,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.8, condition: 0.2 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The knowledge dissolves in {actor}\'s hands at the crossing. {They} return{s} with the outline of it and none of the content, and the outline will not leave {them} alone.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.8, condition: 0.2 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },

  // ── Deadly-Tier (diff 80–90) ──────────────────────────────────────

  {
    id: 'encounter.dragons_challenge',
    name: "Dragon's Challenge",
    locationTypes: ['wilderness', 'ruins'],
    reachPrimary: 'iron',
    reachSecondary: 'veil',
    encounterType: 'duel',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ['courage_prudence', 'sacrifice_survival'],
    steps: [
      {
        id: 'dragons_challenge.approach',
        name: 'Approach the Dragon',
        reach: 'eye',
        difficulty: DEADLY_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (story_beat tier).
        narrative: 'The creature waits and does not pretend to be asleep. It has outlasted the language {actor} would use to flatter it. Cowardice reads as prey and contempt reads as a challenge already made; {actor} has to walk in as neither.',
        onSuccess: {
          narrative: '{actor} comes in level, hands visible, and stops at a distance {they} chose rather than one the dragon allowed. The great head turns. Interest is not safety, but it is a beginning.',
          reputationDelta: 0.07,
        },
        onFailure: {
          narrative: 'The dragon has {actor} placed before the scree is crossed, and lets {them} hear the sound it keeps for creatures it has already dismissed.',
          reputationDelta: -0.06,
        },
      },
      {
        id: 'dragons_challenge.contest',
        name: 'The Contest',
        reach: 'iron',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The dragon names the terms itself: will, cunning, endurance, in that order and with no stated end. Most who accept do not walk away from it. {actor} accepts.',
        criticalSuccessAfterimage: '{actor} does not merely endure the contest — {they} turn{s} it, and set{s} the dragon a question it has not been asked in an age. The creature goes still, then answers. What passes between them is not victory but recognition. The dragon keeps few names. It keeps this one.',
        criticalFailureAfterimage: '{actor} fails the contest in a way the dragon finds genuinely interesting, which is worse than losing. It lets {them} go with a parting word that will not stop echoing — a truth about {actor} that {they} would have paid the dragon to keep to itself.',
        onSuccess: {
          narrative: '{actor} lasts to the end of the contest. The dragon acknowledges it out loud, once, and does not repeat itself. The acknowledgement is the whole prize, and both parties know it.',
          reputationDelta: 0.18,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: '{actor} loses the contest and is permitted to leave. The dragon does not say whether mercy or boredom decided that, and {actor} will turn the question over for years.',
          reputationDelta: -0.10,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.arcane_cataclysm',
    name: 'Arcane Cataclysm',
    locationTypes: ['ruins', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ['courage_prudence', 'preservation_transformation'],
    steps: [
      {
        id: 'arcane_cataclysm.contain',
        name: 'Contain the Cascade',
        reach: 'veil',
        difficulty: DEADLY_DIFFICULTY_BASE,
        duration: 2,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (story_beat tier).
        narrative: 'Old power has come unanchored in the ruin and is spreading at a walking pace. It consumes what it touches without heat and without noise, which is the part that empties the corridors ahead of it.',
        onSuccess: {
          narrative: '{actor} finds the anchor points still standing and binds the leading edge of the cascade to them. It stops spreading. It does not stop.',
          reputationDelta: 0.07,
        },
        onFailure: {
          narrative: 'The cascade goes through {actor}\'s first binding without slowing. Two more chambers are gone by evening, and the ruin\'s map is out of date.',
          reputationDelta: -0.07,
        },
      },
      {
        id: 'arcane_cataclysm.neutralize',
        name: 'Neutralize the Source',
        reach: 'eye',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The source sits at the centre, and the route to it runs back through every room the cascade has already taken. {actor} will not be able to trust the floor.',
        onSuccess: {
          narrative: '{actor} reaches the centre and unmakes the source in the order it was built. The ruin goes quiet in stages, room by room, over most of an hour.',
          reputationDelta: 0.20,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The corruption closes the last approach and {actor} turns back with the source still burning. The ruin is written off, and the villages downriver are told to move.',
          reputationDelta: -0.12,
        },
      },
    ],
  },

  {
    id: 'encounter.grand_tournament',
    name: 'Grand Tournament',
    locationTypes: ['city', 'capital', 'castle'],
    reachPrimary: 'iron',
    reachSecondary: 'star',
    encounterType: 'duel',
    threatRating: 'deadly',
    intrinsicTier: 'story_beat',
    motivations: ['mercy_ruthlessness', 'sacrifice_survival'],
    steps: [
      {
        id: 'grand_tournament.qualify',
        name: 'The Qualifying Round',
        reach: 'iron',
        difficulty: DEADLY_DIFFICULTY_BASE - 5,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (story_beat tier).
        narrative: 'Three hundred enter and thirty advance. The qualifiers are fought on packed sand in front of a half-empty stand, and the people who matter are in it, taking notes.',
        onSuccess: {
          narrative: '{actor} advances. It is the third bout that draws comment from the gallery — a recovery none of them had watched a competitor make before.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: '{actor} goes out in the qualifiers. The gallery has moved on to the next pairing before the sand is behind {them}.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'grand_tournament.semifinals',
        name: 'The Semifinals',
        reach: 'iron',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP - 5,
        duration: 2,
        narrative: 'The semifinal draw is the one nobody wanted. The opponent has been fighting these rounds since before {actor} could hold a blade, and every competitor {they} put down came away having learned one specific, expensive lesson.',
        onSuccess: {
          narrative: '{actor} takes the semifinal on a move the opponent has apparently never had used against {them}. The crowd is slow to react, and then very loud.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The opponent demonstrates, patiently and at length, why the draw was the one nobody wanted. {actor} does not reach the final.',
          reputationDelta: -0.07,
        },
      },
      {
        id: 'grand_tournament.final',
        name: 'The Final',
        reach: 'star',
        difficulty: DEADLY_DIFFICULTY_BASE + DEADLY_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The final fills the stands and empties the streets. Skill got {actor} here and skill is now the baseline; what the city has come for is a story it can repeat.',
        criticalSuccessAfterimage: '{actor} takes the final without a killing blow — the reigning champion lowers a blade and kneels. The city will tell this version for a generation, and each retelling makes the name larger.',
        criticalFailureAfterimage: '{actor} falls in the final round, and the fall is the kind the crowd goes silent for. The name still travels — but attached now to a single ruinous mistake that no one here will let {them} forget.',
        onSuccess: {
          narrative: '{actor} takes the Grand Tournament. The name is out of the arena and into the city before the sand is raked, and out past the city walls within the week.',
          reputationDelta: 0.22,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.5, possession: 0.3, condition: 0.2 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: '{actor} loses the final. Runner-up at the Grand Tournament is a career for most people, and the crowd says so as it files out, which does not help tonight.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.5, possession: 0.3, condition: 0.2 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  // ─── 18 Universal Encounter Templates ───────────────────────────
  //
  // Available at every location type. Low difficulty, 2 steps, minimal
  // rewards. These exist to prevent content starvation at frontier
  // settlements that lack archetype-specific encounter templates.
  //
  // Coverage: 2 per canonical Reach (Iron, Gold, Shadow, Veil, Heart,
  // Eye, Stone, Star) + 2 reach-agnostic fallbacks with extra-low
  // difficulty. No Flesh reach — Flesh is now Quintessence (meta-property).

  // ── Iron (2) ──────────────────────────────────────────────────────

  {
    id: 'encounter.patrol_perimeter',
    name: 'Patrol the Perimeter',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'lead',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'justice_mercy'],
    steps: [
      {
        id: 'patrol_perimeter.walk',
        name: 'Walk the Boundary',
        reach: 'iron',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} traces the edge of the settlement, noting every gap in fence and wall. Vigilance is mostly routine, and the routine is mostly walking.',
        onSuccess: {
          narrative: 'Every approach mapped, every weak point catalogued. {actor} finishes the circuit knowing exactly where the wall would give first.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The perimeter is too large, the terrain too broken. {actor} covers half the ground and hopes it is enough.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'patrol_perimeter.secure',
        name: 'Secure the Weak Points',
        reach: 'shadow',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'A gap in the stones, a trampled section of hedge — {actor} must decide what to fix and what to watch.',
        onSuccess: {
          narrative: '{actor} shores up the worst of it and places markers where the rest need attention. The perimeter holds.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'There is too much to fix with too little. {actor} leaves the gaps as they are, uneasy.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.sharpen_blades',
    name: 'Sharpen Blades',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'build',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    /**
     * THR-838 (WS5 Batch 1) — migrated to the nudge model.
     *
     * Vignette record (checklist step 1; no schema field for these yet):
     *   Motive hooks   — `chance` above all: the sitting-down encounter, drawn
     *                    because the day stopped and the blade is on the hip.
     *                    `choice` for one who keeps a schedule about it. Never
     *                    `mission`; nobody is sent to hone a knife.
     *   Quintessence   — light. A ruined edge costs the next fight some margin,
     *   stakes           and costs this evening a whetstone. No wound here.
     *   Scene tag      — `camp.night.maintenance` (audit tag: place:hamlet ·
     *                    reach:iron · situation:encounter).
     *
     * Both steps sit far under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.05 and 0.10
     * against a 0.45 ceiling) — `background` tier is open draw, so the roster
     * that meets this mostly holds neither `iron` nor `stone` and the hand has
     * to move the forecast for them anyway.
     */
    traitVariants: [
      {
        // `core_humility` virtue pole — a seeded Core definition, so the ref is
        // live for `validateTraitRefs()` (checklist step 5's hard constraint).
        traitId: 'trait.core.core_humility.virtue',
        forecastDelta: 0.04,
        difficultyDelta: -0.01,
        factorLine: 'They can be told the edge is bad, including by the edge.',
        addNudgeIds: ['sharpen.admit_the_nick'],
      },
    ],
    steps: [
      {
        id: 'sharpen_blades.assess',
        name: 'Inspect the Edge',
        reach: 'iron',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        purposeLine: 'Read the steel',
        factorLines: [
          { text: 'The blade has been in {their} hand for years and has a known feel.', polarity: 'for' },
          { text: 'Firelight lies about steel, and there is only firelight.', polarity: 'against' },
        ],
        narrative: '{actor} draws the blade slowly across a thumbnail and watches where it bites and where it skates. A nick catches. A rolled stretch near the guard does not catch at all, which is worse.',
        successAtCostAfterimage: 'They found every flaw, and found them by opening the ball of {their} thumb on one.',
        criticalSuccessAfterimage: 'They read the whole length of it in one pass and could have named the fight that put each mark there.',
        criticalFailureAfterimage: 'They came away sure the edge was sound. It was sound along the half {they} tested.',
        nudges: [
          {
            // Shared generic pool — the `focus` family.
            id: 'sharpen.turn_it_to_the_light',
            name: 'Turn it to the light',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.focus',
            fiction: 'The blade comes round to the fire at the angle where damage shows as a dark line instead of a bright one.',
            effectLine: 'A small, reliable push toward seeing what is there.',
            bandProse: {
              success: 'Held to the fire at that angle, every nick stood out dark, and {actor} counted them.',
              near_miss: 'The angle showed the nicks. The rolled stretch near the guard threw back clean light and hid.',
            },
          },
          {
            id: 'sharpen.let_the_flaw_show',
            name: 'Let the flaw show',
            sphere: 'matter',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.matter',
            fiction: 'The steel stops flattering itself. Every place the grain went wrong sits up on the surface.',
            effectLine: 'Strong help. The metal gives an honest account of itself.',
            bandProse: {
              success_at_cost: 'The steel told the truth, and the truth was that a hand-span of it was finished.',
              failure: 'The flaws rose to the surface of a blade {actor} was no longer looking at.',
            },
          },
          {
            id: 'sharpen.remember_the_last_edge',
            name: 'Remember the last edge',
            sphere: 'mind',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.mind',
            fiction: 'How this blade felt the last time it was right comes back exactly, and gives {them} a mark to measure against.',
            effectLine: 'Good help. There is a before to compare this to.',
            bandProse: {
              failure: 'They recalled the old edge perfectly and still could not say what this one had lost.',
            },
          },
          {
            id: 'sharpen.lend_the_dawn_early',
            name: 'Lend the dawn early',
            sphere: 'light',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.light',
            fiction: 'Grey working light arrives over the camp hours before the sun has any business being up.',
            effectLine: 'Good help. Firelight stops doing the deciding.',
            bandProse: {
              critical_success: 'In flat grey light the whole blade read at a glance, guard to tip, with no guessing in it.',
              near_miss: 'The light came early and went again before {actor} had turned the blade over.',
            },
          },
          {
            id: 'sharpen.hold_the_hour',
            name: 'Hold the hour',
            sphere: 'time',
            essenceCost: 2,
            forecastDelta: 0.12,
            imageTag: 'generic.time-slow',
            fiction: 'The camp stops needing {them}. The hour before the watch changes stretches out with room in it.',
            effectLine: 'Strong help. There is time to be thorough.',
            bandProse: {
              failure: 'The hour ran long and {actor} spent all of it on the first hand-span of the blade.',
              critical_failure: 'The hour would not end. They checked the same stretch of steel until it stopped meaning anything.',
            },
          },
          {
            // Trait-only card: cost 0, the price paid by being this person.
            id: 'sharpen.admit_the_nick',
            name: 'Admit the nick',
            requiredTrait: 'trait.core.core_humility.virtue',
            essenceCost: 0,
            forecastDelta: 0.08,
            imageTag: 'generic.oath',
            fiction: 'They stop arguing with the thumbnail. The blade is worse than {they} had been telling people, and {they} let that be true.',
            effectLine: 'A steady help, and it costs no essence.',
            bandProse: {
              near_miss: 'They admitted the blade was half gone, and still put off admitting which half.',
            },
          },
        ],
        onSuccess: {
          narrative: 'The flaws are plain. {actor} knows where the steel has gone and where it can still be brought back.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Good steel and bad look the same at this hour. {actor} guesses at the damage and sets to work on the guess.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'sharpen_blades.grind',
        name: 'Work the Whetstone',
        reach: 'stone',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        purposeLine: 'Put the edge back',
        factorLines: [
          { text: 'Stone on steel is a rhythm the hands already know.', polarity: 'for' },
          { text: 'The whetstone is worn dish-shaped in the middle.', polarity: 'against' },
          { text: 'There is no water left to wet it with.', polarity: 'against' },
        ],
        narrative: 'Stone on steel, over and over, until the sound of the camp goes away behind it. {actor} keeps the angle by feel — the same angle for four hundred strokes, which is easy for thirty and hard after that.',
        successAtCostAfterimage: 'The edge came back. So much steel went onto the stone that the blade will not take this again.',
        criticalSuccessAfterimage: 'The edge came up so fine it took hair off {their} forearm without being asked twice.',
        criticalFailureAfterimage: 'The angle wandered and kept wandering, and what {they} sheathed had two edges arguing along one blade.',
        nudges: [
          {
            // Shared generic pool — the `focus` family.
            id: 'sharpen.find_the_rhythm',
            name: 'Find the rhythm',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.focus',
            fiction: 'The stroke settles into a count {they} stop{s} having to keep. The arm does it without {them}.',
            effectLine: 'A small, reliable push toward keeping at it.',
            bandProse: {
              success: 'The count kept itself, and the edge came up under it stroke by stroke.',
              near_miss: 'The rhythm held for three hundred strokes and slipped on the last of them.',
            },
          },
          {
            id: 'sharpen.even_the_pressure',
            name: 'Even the pressure',
            sphere: 'force',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.force',
            fiction: 'The weight through {their} wrist stops rising at the tip and dropping at the heel. It goes down the same all the way along.',
            effectLine: 'Strong help. The whole length gets the same treatment.',
            bandProse: {
              success_at_cost: 'The pressure stayed even and wore a fresh hollow into the middle of the stone.',
              failure: 'The wrist held true and the dished stone put the bevel on crooked anyway.',
            },
          },
          {
            id: 'sharpen.take_the_rust_first',
            name: 'Take the rust first',
            sphere: 'entropy',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.decay',
            fiction: 'The orange bloom along the spine lifts off ahead of the stone, leaving grey metal for the edge work.',
            effectLine: 'Good help. The stone gets clean steel to bite.',
            bandProse: {
              failure: 'The rust came away clean off a blade that was already too far gone under it.',
            },
          },
          {
            id: 'sharpen.keep_the_angle',
            name: 'Keep the angle',
            sphere: 'order',
            essenceCost: 2,
            forecastDelta: 0.13,
            imageTag: 'generic.order',
            fiction: 'The blade sits at one angle to the stone and will not be talked out of it, stroke after stroke.',
            effectLine: 'Strong help. One bevel instead of four.',
            bandProse: {
              critical_success: 'The angle never moved once, and the bevel came off the stone as one clean line from guard to point.',
              failure: 'The angle held all the way through, on the wrong side of the edge.',
            },
          },
          {
            id: 'sharpen.warm_the_stone',
            name: 'Warm the stone',
            sphere: 'energy',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.spark',
            fiction: 'The whetstone comes up to blood heat under {their} palm and stops dragging at the steel.',
            effectLine: 'Good help. The stone gives instead of fighting.',
            bandProse: {
              near_miss: 'The warm stone cut fast and clean, and ran out of grit before the tip was done.',
              critical_failure: 'The stone got too hot to hold, cracked along its length, and took a curl of the edge with it.',
            },
          },
        ],
        onSuccess: {
          narrative: 'The edge catches the fire like a thread of silver. Sharp enough. {actor} sheathes it and rolls {their} shoulder out.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The stone slips, the angle goes. {actor} gets an edge that will cut rope and would embarrass {them} against mail.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── Gold (2) ──────────────────────────────────────────────────────

  {
    id: 'encounter.barter_supplies',
    name: 'Barter for Supplies',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['loyalty_ambition', 'justice_mercy'],
    steps: [
      {
        id: 'barter_supplies.offer',
        name: 'Make an Offer',
        reach: 'gold',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} approaches with goods to trade — a skill, a trinket, a day of labor. The art of exchange begins.',
        onSuccess: {
          narrative: 'A nod, a handshake. What {actor} carried in is worth what {they} walk{s} out with. Fair dealing.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'No deal. {actor}\'s offer falls flat — too little, too strange, too late in the day.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'barter_supplies.seal',
        name: 'Seal the Deal',
        reach: 'heart',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Trust is the final currency. {actor} meets the trader\'s eyes, each measuring the other\'s intent.',
        onSuccess: {
          narrative: 'The exchange is done. Both parties walk away satisfied — rare enough to be worth remembering.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Doubt creeps in at the last. The deal collapses, and {actor} leaves with what {they} came with.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.assess_holdings',
    name: 'Take Stock of Holdings',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'loyalty_ambition'],
    steps: [
      {
        id: 'assess_holdings.count',
        name: 'Count What Remains',
        reach: 'gold',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} lays out every coin, every scrap of value. The arithmetic of survival.',
        onSuccess: {
          narrative: 'The accounting is done. {actor} knows exactly what {they} hold{s} — and what it can buy.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The numbers do not add up. A coin was lost or a tally miscounted, and {actor} cannot say which.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'assess_holdings.plan',
        name: 'Plan the Next Purchase',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Knowing what {they} hold{s} matters less than knowing what {they} need{s}. {actor} weighs priorities with care.',
        onSuccess: {
          narrative: 'A clear plan forms — what to buy, what to save, what to trade. {actor} is ready for the next exchange.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Too many needs, too few resources. {actor} sets the ledger aside, no clearer than before.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── Shadow (2) ────────────────────────────────────────────────────

  {
    id: 'encounter.night_watch',
    name: 'Keep the Night Watch',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'lead',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'justice_mercy'],
    steps: [
      {
        id: 'night_watch.vigil',
        name: 'Stand Vigil',
        reach: 'shadow',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Darkness settles. {actor} takes the watch, eyes adjusting to the shapes that move beyond the firelight and the ones that only appear to.',
        onSuccess: {
          narrative: '{actor} reads the night like a language — every sound placed, every shadow accounted for. What moves out there stays out there.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Fatigue wins. {actor} nods off, jerking awake to find the fire low and the perimeter unchecked.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'night_watch.respond',
        name: 'Respond to a Disturbance',
        reach: 'iron',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'A sound at the edge of camp, wrong for the wind. {actor} rises with a hand on the weapon and waits for it to come again.',
        onSuccess: {
          narrative: 'A wild animal, a falling branch — no more than that. {actor} handles it cleanly and the camp sleeps on.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'Too slow, too loud. The camp is awake and shouting before {actor} can put a name to what caused it.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.listen_for_rumors',
    name: 'Listen for Rumors',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    secretDiscovery: { onSuccess: true, sourceName: 'spy_debrief' },
    steps: [
      {
        id: 'listen_for_rumors.loiter',
        name: 'Loiter and Listen',
        reach: 'shadow',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101 (batch 13, hearsay slice).
        narrative: '{actor} takes up position where voices gather — a well, a hearth, a crossroads. The trick is having a reason to be there that nobody has to ask about.',
        onSuccess: {
          narrative: 'Fragments reach {their} ears — a name dropped carelessly, a warning half-whispered. {actor} files it all away.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The locals are tight-lipped, or the noise is too thick. {actor} hears nothing worth remembering.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'listen_for_rumors.sift',
        name: 'Sift Truth from Gossip',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Most of it is repeated, and repetition is not evidence. {actor} sorts for the detail nobody would have bothered to invent.',
        onSuccess: {
          narrative: 'One thread holds up. {actor} has learned something real — where to go, whom to trust, what to avoid.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.6, bestowed_power: 0.2, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'All gossip, no substance. {actor} walks away knowing only what everyone already knows.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.6, bestowed_power: 0.2, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  // ── Veil (2) ──────────────────────────────────────────────────────

  {
    id: 'encounter.ward_the_camp',
    name: 'Ward the Camp',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'veil',
    reachSecondary: 'star',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    /**
     * THR-838 (WS5 Batch 1) — migrated to the nudge model.
     *
     * Vignette record (checklist step 1; no schema field for these yet):
     *   Motive hooks   — `chance` first: the camp is made and the dark is
     *                    coming, so somebody walks the edge. `choice` for one
     *                    who does it every night on principle. `mission` only
     *                    where a caravan master posted the watch.
     *   Quintessence   — light. A failed ward costs a bad night and a jumpy
     *   stakes           watch, never a wound. The aftermath owes no more.
     *   Scene tag      — `camp.night.ward` (audit tag: place:hamlet ·
     *                    reach:veil · situation:encounter).
     *
     * Both steps sit far under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.05 and 0.10
     * against a 0.45 ceiling). This is `background` tier — open-draw content a
     * mortal meets by having stopped for the night — so the hand has to move
     * the forecast for a roster that mostly holds neither `veil` nor `star`.
     */
    traitVariants: [
      {
        // `core_integrity` virtue pole — a seeded Core definition, so the ref is
        // live for `validateTraitRefs()` (checklist step 5's hard constraint).
        traitId: 'trait.core.core_integrity.virtue',
        forecastDelta: 0.04,
        difficultyDelta: -0.01,
        factorLine: 'They will not call a circle closed while they can see the gap.',
        addNudgeIds: ['ward_camp.walk_it_again'],
      },
    ],
    steps: [
      {
        id: 'ward_the_camp.trace',
        name: 'Trace the Boundary',
        reach: 'veil',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        purposeLine: 'Close the circle',
        factorLines: [
          { text: 'The ground is soft enough to hold a drawn line.', polarity: 'for' },
          { text: 'Camp sprawls wider than one walk around it.', polarity: 'against' },
          { text: 'The picket rope cuts the circle in two places.', polarity: 'against' },
        ],
        narrative: '{actor} walks the edge of camp with two fingers out, brushing stone, bark, tent rope, the wheel of a cart. The line has to come back to where it started, and the ground keeps offering reasons it should not.',
        successAtCostAfterimage: 'The circle closed. It ran wide of the horses, and the horses stayed outside it.',
        criticalSuccessAfterimage: 'The line came back to its own start clean, and {actor} felt it take like a knot pulling tight.',
        criticalFailureAfterimage: 'They walked it three times and the ends would not meet, and the fourth walk was worse than the first.',
        nudges: [
          {
            // Shared generic pool — the `focus` family.
            id: 'ward_camp.steady_the_hand',
            name: 'Steady the hand',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.focus',
            fiction: 'The tremor goes out of {their} fingers. The line stops wandering where the ground dips.',
            effectLine: 'A small, reliable push toward closing it at all.',
            bandProse: {
              success: 'The hand held steady the whole way round, and the line held with it.',
              near_miss: 'The hand stayed steady. The ground under the north side did not.',
            },
          },
          {
            id: 'ward_camp.salt_from_the_pack',
            name: 'Salt from the pack',
            sphere: 'matter',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.matter',
            fiction: 'A palmful of travelling salt goes down along the line, coarse and white against wet earth.',
            effectLine: 'Good help. The circle has a body now, not just an intention.',
            bandProse: {
              success_at_cost: 'The salt held the line. It was three days of cooking salt, and they ate flat food after.',
              failure: 'The salt went down and the wind took most of it off the stones before {actor} finished the turn.',
            },
          },
          {
            id: 'ward_camp.hold_the_dark_off',
            name: 'Hold the dark off',
            sphere: 'darkness',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.dark',
            fiction: 'The dark past the last tent stops pressing inward and sits where it is, patient.',
            effectLine: 'Good help. There is less leaning on the line while it is drawn.',
            bandProse: {
              failure: 'The dark sat back and waited, and the line failed on its own without any help from it.',
            },
          },
          {
            id: 'ward_camp.true_the_circle',
            name: 'True the circle',
            sphere: 'order',
            essenceCost: 2,
            forecastDelta: 0.12,
            imageTag: 'generic.order',
            fiction: 'The walk straightens itself. Where {actor} would have cut a corner, {their} feet go the long way without being told.',
            effectLine: 'Strong help. The shape comes out round.',
            bandProse: {
              critical_success: 'The circle came out true enough to see from the cart roof, and every tent stood inside it.',
              failure: 'The shape was perfect and it ended a stride short of its own beginning.',
            },
          },
          {
            id: 'ward_camp.lend_the_line_heat',
            name: 'Lend the line heat',
            sphere: 'energy',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.spark',
            fiction: 'The traced ground gives off the warmth of a stone that sat in sun all day.',
            effectLine: 'Strong help. The line stays awake behind {them}.',
            bandProse: {
              near_miss: 'The warmth ran the whole circle and went cold at the gate before {actor} got back to it.',
              critical_failure: 'The heat came up too fast, dried the traced earth to dust, and the wind had the line off the ground by moonrise.',
            },
          },
          {
            // Trait-only card: cost 0, the price paid by being this person.
            // Unlocked either by holding the trait or through the template's
            // traitVariant naming it in `addNudgeIds`.
            id: 'ward_camp.walk_it_again',
            name: 'Walk it again',
            requiredTrait: 'trait.core.core_integrity.virtue',
            essenceCost: 0,
            forecastDelta: 0.08,
            imageTag: 'generic.oath',
            fiction: 'They reach the start, look at the gap by the picket line, and set off round a second time.',
            effectLine: 'A steady help, and it costs no essence.',
            bandProse: {
              near_miss: 'The second walk closed the gap by the picket and opened a smaller one by the fire.',
            },
          },
        ],
        onSuccess: {
          narrative: 'The ward settles, thin as cobweb and holding. {actor} can feel where the boundary runs without looking at it.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The line goes slack before the circle closes. {actor} has drawn a mark in wet dirt, and the dirt knows it.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'ward_the_camp.anchor',
        name: 'Anchor the Ward',
        reach: 'star',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        purposeLine: 'Give it a root',
        factorLines: [
          { text: 'The sky is open and the stars are out to be read.', polarity: 'for' },
          { text: 'A drawn circle wants a weight, and there is little in the pack.', polarity: 'against' },
        ],
        narrative: 'A traced circle fades by dawn unless it is tied to a heavier thing. {actor} kneels at the north of the line and reaches past the camp for a hold — a star, a vow, the slow turn the sky makes over a sleeping road.',
        successAtCostAfterimage: 'The ward took root, and {they} gave up the ring off {their} hand to root it.',
        criticalSuccessAfterimage: 'It anchored so hard the ground inside the line stayed dry when the rain came through at dawn.',
        criticalFailureAfterimage: 'What the ward caught hold of pulled back, and {actor} knelt there a long while before letting go of it.',
        nudges: [
          {
            // Shared generic pool — the `luck` family.
            id: 'ward_camp.a_gap_in_the_wind',
            name: 'A gap in the wind',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.luck',
            fiction: 'The wind drops for as long as the kneeling takes, and picks up again after.',
            effectLine: 'A small push. The work gets a quiet minute to happen in.',
            bandProse: {
              success: 'The wind held off, the anchor went down, and the gust that came after found the ward already set.',
              near_miss: 'The quiet came and went too quickly, and {actor} was still reaching when the wind returned.',
            },
          },
          {
            id: 'ward_camp.give_it_a_name',
            name: 'Give it a name',
            sphere: 'spirit',
            essenceCost: 2,
            forecastDelta: 0.12,
            imageTag: 'generic.oath',
            fiction: '{actor} says a name over the line — a dead brother, a home hex, a debt owed. The circle takes it and holds.',
            effectLine: 'Strong help. A named ward is harder to shift.',
            bandProse: {
              success_at_cost: 'The name held the ward down all night and sat in {their} mouth for three days after.',
              failure: 'The name was spoken and the line did not answer to it.',
            },
          },
          {
            id: 'ward_camp.set_a_star_over_it',
            name: 'Set a star over it',
            sphere: 'light',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.light',
            fiction: 'One star over the north edge stops wheeling with the rest and stands where it was put.',
            effectLine: 'Good help. The ward has a mark above it to hang from.',
            bandProse: {
              failure: 'The star stood over the camp all night and the ward under it came apart regardless.',
            },
          },
          {
            id: 'ward_camp.let_it_outlast_dawn',
            name: 'Let it outlast dawn',
            sphere: 'time',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.time-slow',
            fiction: 'The ward is set to fade on a longer clock than the night — first light comes and the line is still there.',
            effectLine: 'Strong help. The work outlives the watch that made it.',
            bandProse: {
              critical_success: 'The ward stood through dawn, through the striking of the tents, and was still faintly warm underfoot at noon.',
              failure: 'It was built to last past dawn. It did not last past the second watch.',
            },
          },
          {
            id: 'ward_camp.let_the_edges_blur',
            name: 'Let the edges blur',
            sphere: 'chaos',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.chaos',
            fiction: 'The line stops being exactly where it is. Whatever wants to find its edge has to guess.',
            effectLine: 'Good help against anything hunting for the seam.',
            bandProse: {
              near_miss: 'The edge blurred and held, and by morning nobody in camp could say where it had run.',
              critical_failure: 'The edges blurred until the ward could not find its own line, and it came undone from the middle outward.',
            },
          },
        ],
        onSuccess: {
          narrative: 'The ward takes hold and hums under the grass. Small and low and enough to turn what creeps in at night.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The anchor slips free. The ward will be gone before midnight, and {actor} kneels there knowing it.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.trace_ley_lines',
    name: 'Trace the Ley Lines',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    steps: [
      {
        id: 'trace_ley_lines.sense',
        name: 'Sense the Current',
        reach: 'veil',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}` mad-lib shape (batch 12, divination
        // slice). The failure line was also character-identical to
        // `study_surroundings` (impediment #571) — the duplicate is resolved here.
        narrative: 'Older channels run under this ground the way water runs under limestone. {actor} sits down on the dirt and stops trying to see.',
        onSuccess: {
          narrative: 'There — a pull, faint but unmistakable. The land remembers its channels, and {actor} begins to read them.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The ground stays ground. {actor} sits long enough to be certain of it, and being certain is worth the hour.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'trace_ley_lines.map',
        name: 'Map the Flow',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Feeling the pull is the easy half. Following it to where it goes, and working out what put it there, takes the rest of the daylight.',
        onSuccess: {
          narrative: 'The ley line resolves into a path {actor} can follow. Where it leads, the magic runs stronger.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The pattern fractures under scrutiny. {actor} loses the thread, left with impressions but no map.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  // ── Heart (2) ─────────────────────────────────────────────────────

  {
    id: 'encounter.local_tales',
    name: 'Gather Local Tales',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'loyalty_ambition'],
    secretDiscovery: { onSuccess: true, sourceName: 'tavern_gossip' },
    steps: [
      {
        id: 'local_tales.listen',
        name: 'Listen to the Locals',
        reach: 'heart',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Every place has stories. {actor} sits among the people who know this land and lets them talk.',
        onSuccess: {
          narrative: 'Words flow freely. {actor} earns a fragment of history — a name, a warning, a half-remembered song.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Suspicion closes mouths. {actor} hears the room resume its own conversation, one table over.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'local_tales.record',
        name: 'Commit to Memory',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Details fade fast. {actor} fixes the tales in mind — names, places, the shape of truth beneath the telling.',
        onSuccess: {
          narrative: 'The story takes root. {actor} carries knowledge of what came before, which is worth more than coin.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.6, bestowed_power: 0.2, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The details blur and tangle overnight. {actor} keeps the shape of it and loses the names.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.6, bestowed_power: 0.2, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.tend_the_weary',
    name: 'Tend the Weary',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'star',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'loyalty_ambition'],
    steps: [
      {
        id: 'tend_the_weary.approach',
        name: 'Offer Comfort',
        reach: 'heart',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Someone nearby is struggling — exhaustion, grief, or the accumulated weight of days without rest. {actor} draws near.',
        onSuccess: {
          narrative: 'A word, a steady hand, a moment of presence. {actor} eases a burden that was not {their} own.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The weary one flinches away. Some wounds are too raw for a stranger\'s touch.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'tend_the_weary.sustain',
        name: 'Share What You Have',
        reach: 'star',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Comfort is not enough. {actor} offers what can be used — food, warmth, an hour of undivided attention.',
        onSuccess: {
          narrative: 'Color returns to a drawn face. The weary one nods, once, and that is thanks enough.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: '{actor} has too little to share. The gesture is kind but hollow, and both of {them} know it.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── Eye (2) ───────────────────────────────────────────────────────

  {
    id: 'encounter.study_surroundings',
    name: 'Study the Surroundings',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    steps: [
      {
        id: 'study_surroundings.observe',
        name: 'Observe the Terrain',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        // The two failure lines also carried pre-existing `nothing` (a natural indefinite,
        // enforced at zero in outcome prose) on untokened lines — fixed here per the
        // batch-5 rule that a template being authored gets its whole prose read.
        narrative: '{actor} climbs to the highest ground within an hour\'s walk and sits down to look properly. Paths, water, smoke, and where the shadows fall at this hour.',
        onSuccess: {
          narrative: 'Patterns emerge — trade routes, game trails, places where the land folds inward. {actor} maps it all.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Haze and distance defeat the eye. {actor} comes back down knowing what any traveller on the road already knew.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'study_surroundings.sense',
        name: 'Read the Deeper Signs',
        reach: 'veil',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The visible terrain tells one story. {actor} sits still long enough to hear the other one — where the birds will not settle, where the frost holds past noon.',
        onSuccess: {
          narrative: 'The land whispers back. {actor} feels the pull of ley and root — this place has secrets worth knowing.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The silence holds all afternoon. {actor} learns only that this place keeps its own counsel, which is itself a fact about the place.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.decipher_old_markings',
    name: 'Decipher Old Markings',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'gold',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'loyalty_ambition'],
    steps: [
      {
        id: 'decipher_old_markings.find',
        name: 'Find the Inscriptions',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101 (batch 13, scholarship slice).
        narrative: 'Old stones carry old marks — trade signs, boundary cuts, warnings weathered down to a suggestion. {actor} works along the wall with a thumb.',
        onSuccess: {
          narrative: '{actor} finds what time almost erased — scratches in rock, paint faded to ghosts. Something was written here.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'If markings were ever here, the years have taken them. {actor} finds only weathered stone.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'decipher_old_markings.read',
        name: 'Interpret the Symbols',
        reach: 'gold',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The letters mean little on their own. {actor} works out who cut them, and what such a person would have needed to say in a place like this.',
        onSuccess: {
          narrative: 'The markings resolve — a trader\'s waypoint, a miner\'s claim, a warning from another age. Knowledge earned.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.5, bestowed_power: 0.2, possession: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The symbols resist interpretation. {actor} copies what {they} can and hopes someone else can read them.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.5, bestowed_power: 0.2, possession: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  // ── Stone (2) ─────────────────────────────────────────────────────

  {
    id: 'encounter.mend_equipment',
    name: 'Mend Equipment',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'mend_equipment.assess',
        name: 'Assess the Damage',
        reach: 'stone',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Gear frays and blunts with use. {actor} lays out {their} tools and takes stock of what needs fixing.',
        onSuccess: {
          narrative: '{actor} identifies the worst of it — a cracked haft, a loosened strap — and sets to work without hurrying.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The damage runs deeper than expected. {actor} lacks the materials for a proper repair.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'mend_equipment.repair',
        name: 'Make Repairs',
        reach: 'iron',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Improvisation is its own craft. {actor} works with what the land provides, bending skill to necessity.',
        // THR-1101 (build-family batch): `{they}` resolves to a singular pronoun, so a bare
        // verb after it reads "she mend" / "she carry". Pre-existing, caught by rendering
        // these lines through `enrichProse` rather than reading the source; `{s}` is the
        // engine's existing agreement token and is what the rest of the corpus uses.
        criticalSuccessAfterimage: 'The repair holds better than the gear did new. {actor} stumbles on an old improvement in the fixing — a balance, a set to the grip — and keeps it for everything {they} mend{s} after.',
        criticalFailureAfterimage: 'The fix fails at the worst moment to learn it failed — not on the bench but later, out where it mattered. {actor} carries the lesson a good deal longer than the broken gear.',
        onSuccess: {
          narrative: 'Not perfect, but serviceable. {actor} tests the repair — it holds. Good enough for what lies ahead.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The fix does not hold. {actor} packs the broken gear away, hoping for better tools elsewhere.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.shore_up_shelter',
    name: 'Shore Up Shelter',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'build',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'loyalty_ambition'],
    steps: [
      {
        id: 'shore_up_shelter.survey',
        name: 'Survey the Structure',
        reach: 'stone',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Roof, wall, foundation — {actor} checks each in turn. The plain calculus of what will hold and what will not.',
        onSuccess: {
          narrative: 'The weak points are clear. A sagging beam here, a crumbling joint there. {actor} knows where to start.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Everything looks equally fragile. {actor} cannot tell what is load-bearing and what is cosmetic.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'shore_up_shelter.reinforce',
        name: 'Reinforce What Matters',
        reach: 'gold',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Salvaged timber, borrowed rope, stones wedged into gaps. {actor} makes do with what is to hand.',
        onSuccess: {
          narrative: 'The shelter holds firmer now. Not beautiful, but solid. {actor} has earned a dry night.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The materials give out before the work is done. The shelter is no worse, but no better either.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── Star (2) ──────────────────────────────────────────────────────

  {
    id: 'encounter.commune_with_stars',
    name: 'Commune with the Stars',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'star',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'loyalty_ambition'],
    steps: [
      {
        id: 'commune_with_stars.gaze',
        name: 'Read the Sky',
        reach: 'star',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'When the sky clears, {actor} turns {their} face upward. The constellations have moved since the last clear night, and moved exactly as far as they should have.',
        onSuccess: {
          narrative: 'The stars speak to those who know how to listen. {actor} reads an omen — faint, but unmistakable.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Cloud comes in from the west, or the mind wanders. {actor} sees cold light and no sign in it.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'commune_with_stars.interpret',
        name: 'Interpret the Omen',
        reach: 'veil',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'An omen means little until it is read against what is already known. {actor} sets the two side by side and looks for the place they disagree.',
        onSuccess: {
          narrative: 'The pattern resolves. {actor} glimpses a thread of fate — where it leads, only time will tell.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The meaning slips away like smoke. {actor} is left holding a sign with no sentence around it.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.3, bestowed_power: 0.5, possession: 0.2 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.offer_small_prayer',
    name: 'Offer a Small Prayer',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'tradition_progress'],
    /**
     * THR-838 (WS5 Batch 1) — migrated to the nudge model.
     *
     * Vignette record (checklist step 1; no schema field for these yet):
     *   Motive hooks   — `chance` above all: the roadside encounter, drawn
     *                    because the walking stopped and the sky is right there.
     *                    `choice` for one who keeps the hours. Never `mission`;
     *                    nobody is dispatched to say a private prayer.
     *   Quintessence   — light. Nothing is lost by asking and going unheard;
     *   stakes           what is at stake is the hour and the knee.
     *   Scene tag      — `road.dusk.devotion` (audit tag: place:hamlet ·
     *                    reach:star · situation:encounter).
     *
     * The paired half of `encounter.shrine_offering`: the same act with no
     * shrine to do it at, so the whole rite has to be carried by the person.
     * Both steps sit far under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.05 and 0.10
     * against a 0.45 ceiling) — `background` tier is open draw, so most of the
     * roster that meets this holds neither `star` nor `heart` and the hand has
     * to move the forecast for them regardless.
     *
     * Pre-migration detectors: abstraction 1.27, vagueness 1.27, not-X-but-Y 2
     * (the "not a voice, not a vision, but a settling" line, twice over).
     */
    traitVariants: [
      {
        // `core_hope` virtue pole — a seeded Core definition, so the ref is live
        // for `validateTraitRefs()` (checklist step 5's hard constraint).
        traitId: 'trait.core.core_hope.virtue',
        forecastDelta: 0.04,
        difficultyDelta: -0.01,
        factorLine: 'They kneel down already believing the road is not empty.',
        addNudgeIds: ['prayer.expect_an_answer', 'prayer.take_it_on_faith'],
      },
    ],
    steps: [
      {
        id: 'offer_small_prayer.kneel',
        name: 'Find a Quiet Place',
        reach: 'star',
        difficulty: UNIVERSAL_DIFFICULTY_BASE,
        duration: 1,
        purposeLine: 'Quiet the road',
        factorLines: [
          { text: 'The words are old, and {they} learned them before {they} could read.', polarity: 'for' },
          { text: 'The road is loud and has no reason to stop.', polarity: 'against' },
        ],
        narrative: '{actor} goes down on one knee in the dirt at the road\'s edge, hands flat on {their} thighs, and lets the cart-noise and the birds and {their} own breathing come apart into separate sounds.',
        successAtCostAfterimage: 'The road went quiet for {them}, and {they} knelt long enough that the cart {they} had been walking beside went on without {them}.',
        criticalSuccessAfterimage: 'The noise came apart between one breath and the next, and what was left had room in it for the whole prayer.',
        criticalFailureAfterimage: 'They knelt in the dirt a long while and got up having said the words out loud to no one, with a carter watching.',
        nudges: [
          {
            // Shared generic pool — the `focus` family.
            id: 'prayer.steady_the_breath',
            name: 'Steady the breath',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.focus',
            fiction: 'The breath lengthens on its own until it is slower than the cart-wheels going past.',
            effectLine: 'A small, reliable push toward settling.',
            bandProse: {
              success: 'The breath went long and the road went small, and {actor} found the first line waiting.',
              near_miss: 'The breath steadied. A dog started up behind the hedge and took it all back.',
            },
          },
          {
            id: 'prayer.open_the_ear',
            name: 'Open the ear',
            sphere: 'spirit',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.listening',
            fiction: 'Whatever sits on the other side of the prayer turns its head, and the empty road feels occupied.',
            effectLine: 'Strong help. The prayer lands on an ear.',
            bandProse: {
              success_at_cost: 'The ear opened, and what leaned in came closer than {they} had wanted it.',
              failure: 'A weight turned toward the road, then turned away again before {actor} had begun.',
            },
          },
          {
            id: 'prayer.lend_the_last_light',
            name: 'Lend the last light',
            sphere: 'light',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.light',
            fiction: 'The sun that had already gone behind the ridge comes back a hand\'s width and lays gold along the ditch.',
            effectLine: 'Good help. The hour stops being a rush.',
            bandProse: {
              critical_success: 'In that late gold the road held still, and {actor} said all of it without hurrying a word.',
              near_miss: 'The light came back and went again, and {they} lost the thread reaching after it.',
            },
          },
          {
            id: 'prayer.stretch_the_pause',
            name: 'Stretch the pause',
            sphere: 'time',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.time-slow',
            fiction: 'The gap between two cart-wheels turning opens up wide enough to kneel inside.',
            effectLine: 'Good help. There is room to finish.',
            bandProse: {
              failure: 'The pause ran long and {actor} spent all of it deciding how to begin.',
              critical_failure: 'The pause would not close. They knelt in it until the words stopped landing and kept going.',
            },
          },
          {
            id: 'prayer.draw_the_dusk_close',
            name: 'Draw the dusk close',
            sphere: 'darkness',
            essenceCost: 2,
            forecastDelta: 0.08,
            imageTag: 'generic.dark',
            fiction: 'The dark comes in early and near, until the road is two arm-lengths of dirt and no view at all.',
            effectLine: 'A steady help. Less to be caught by.',
            bandProse: {
              near_miss: 'The dark closed in kindly and hid the road, and hid the hour along with it.',
            },
          },
          {
            // Trait-only card: cost 0, the price paid by being this person.
            id: 'prayer.expect_an_answer',
            name: 'Expect an answer',
            requiredTrait: 'trait.core.core_hope.virtue',
            essenceCost: 0,
            forecastDelta: 0.08,
            imageTag: 'generic.oath',
            fiction: 'It does not occur to {them} that the road might be empty. {They} kneel{s} the way a caller knocks at a door with a light behind it.',
            effectLine: 'A steady help, and it costs no essence.',
            bandProse: {
              critical_failure: 'They knelt certain of an answer, and built one out of the wind rather than get up without.',
            },
          },
        ],
        onSuccess: {
          narrative: 'The road falls back. {actor} speaks — to the sky, to the dirt, to whoever keeps the ledger — and the words come without being hunted for.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The road will not fall back. {actor} kneels, waits, and gets up with the prayer still folded in {their} mouth.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'offer_small_prayer.listen',
        name: 'Wait for an Answer',
        reach: 'heart',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP,
        duration: 1,
        purposeLine: 'Wait without filling it',
        factorLines: [
          { text: 'This is not the first wait, and it runs longer than it feels.', polarity: 'for' },
          { text: 'There is work left undone, and it has an hour on it.', polarity: 'against' },
        ],
        narrative: 'Half of praying is shutting up afterward. {actor} stays down, hands still flat, and lets the wait run past the point where it starts to itch.',
        successAtCostAfterimage: 'An answer came. The rain started with {them} still on {their} knee, and did not move {them}.',
        criticalSuccessAfterimage: 'The wait paid. {actor} came up off {their} knee knowing which fork to take, and could not have said who told {them}.',
        criticalFailureAfterimage: 'They waited long enough to build an answer out of {their} own voice, and walked off certain of it.',
        nudges: [
          {
            // Shared generic pool — the `focus` family.
            id: 'prayer.hold_the_quiet',
            name: 'Hold the quiet',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.focus',
            fiction: 'The urge to fill the gap with more words passes, and passes again, and stops coming back.',
            effectLine: 'A small, reliable push toward staying put.',
            bandProse: {
              success: 'They held the gap open and did not talk into it, and it filled from the other side.',
              near_miss: 'The quiet held until {their} own knee began to ache, and the ache did the talking.',
            },
          },
          {
            id: 'prayer.set_the_errand_down',
            name: 'Set the errand down',
            sphere: 'mind',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.mind',
            fiction: 'The list of what has to be done by dark stops reciting itself behind {their} eyes.',
            effectLine: 'Good help. Little is pulling at {them}.',
            bandProse: {
              failure: 'The errand stayed down, and {actor} waited on an empty road with an empty head.',
            },
          },
          {
            id: 'prayer.slow_the_pulse',
            name: 'Slow the pulse',
            sphere: 'life',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.vigor',
            fiction: 'The heartbeat in {their} ears drops away until it is no louder than the ditch-water.',
            effectLine: 'Good help. There is less noise inside than out.',
            bandProse: {
              near_miss: 'The pulse went quiet and {they} heard the whole road, and the road said none of it back.',
            },
          },
          {
            id: 'prayer.keep_the_hour',
            name: 'Keep the hour',
            sphere: 'order',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.order',
            fiction: 'The wait takes the shape of a rite with a beginning and an end, and {they} know{s} where in it {they} stand{s}.',
            effectLine: 'Strong help. The waiting has edges.',
            bandProse: {
              failure: 'The hour kept itself to the last beat, and the last beat came and went unanswered.',
              critical_failure: 'The hour was kept so exactly that the counting replaced the listening.',
            },
          },
          {
            id: 'prayer.thin_the_veil',
            name: 'Thin the veil',
            sphere: 'spirit',
            essenceCost: 2,
            forecastDelta: 0.12,
            imageTag: 'generic.listening',
            fiction: 'The gap between the kneeling and the listened-to closes by a step.',
            effectLine: 'Strong help. Less between {them} and an answer.',
            bandProse: {
              success_at_cost: 'The veil thinned, and what came through arrived with more of itself than {they} had asked for.',
              failure: 'The veil went thin and stayed empty, which is worse than thick.',
            },
          },
          {
            // Trait-only card: cost 0, the price paid by being this person.
            id: 'prayer.take_it_on_faith',
            name: 'Take it on faith',
            requiredTrait: 'trait.core.core_hope.virtue',
            essenceCost: 0,
            forecastDelta: 0.08,
            imageTag: 'generic.oath',
            fiction: 'The wait does not curdle. {They} keep{s} the gap open past where a harder head would fold it up.',
            effectLine: 'A steady help, and it costs no essence.',
            bandProse: {
              critical_success: 'They waited past the sensible hour, and the hour past sensible was the one that answered.',
              near_miss: 'They waited past the sensible hour, and got a cold knee and a held opinion for it.',
            },
          },
        ],
        onSuccess: {
          narrative: 'The chest loosens. No voice, no light — a settling, the way a cooling house settles. {actor} rises with the next step already chosen.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The road answers with cart-wheels. {actor} rises no worse for the asking and no better, and shoulders {their} pack.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── Reach-Agnostic (2) ────────────────────────────────────────────
  //
  // These use common reaches but at extra-low difficulty (15 → 20)
  // so any agent passes regardless of capability. True fallbacks.

  {
    id: 'encounter.rest_and_recover',
    name: 'Rest and Recover',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'stone',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'rest_and_recover.settle',
        name: 'Find Shelter',
        reach: 'heart',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} searches for a sheltered spot to rest. The land offers little comfort, but a dry hollow and a windbreak will serve.',
        onSuccess: {
          narrative: '{actor} settles into stillness, letting the weight of the road lift from aching limbs.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'No shelter holds. {actor} shivers against the cold, unable to find true rest.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'rest_and_recover.sleep',
        name: 'Sleep It Off',
        reach: 'stone',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Rest is its own kind of work. {actor} surrenders to the pull of exhaustion.',
        onSuccess: {
          narrative: 'Sleep comes deep and dreamless. {actor} wakes stiff but renewed, ready for what comes next.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'The ground is hard, the noises too close. {actor} rises no more rested than when {they} lay down.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
  {
    id: 'encounter.forage_provisions',
    name: 'Forage for Provisions',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['loyalty_ambition', 'justice_mercy'],
    steps: [
      {
        id: 'forage_provisions.search',
        name: 'Search the Land',
        reach: 'eye',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        narrative: 'Hunger sharpens the eye. {actor} works the ground with a forager\'s list: what can be eaten raw, what needs boiling twice, what is best left where it grows.',
        onSuccess: {
          narrative: '{actor} spots what others miss — a cluster of roots, a clean spring, enough to sustain {them} another day.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The land gives up bitter root and water that has stood too long. {actor} comes back with an empty satchel and the day spent.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'forage_provisions.gather',
        name: 'Gather and Carry',
        reach: 'stone',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'What the eye found, the back has to carry. {actor} bends to it — digging, cutting, and tying the load so it rides high enough to walk with.',
        onSuccess: {
          narrative: 'Arms full, {actor} hauls {their} findings back. Not a feast — but enough. Always enough.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'Too heavy and too far. The load shifts at the second ford, and {actor} arrives with half of what {they} dug and a shoulder that will complain for a week.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ─── Additional Universal Encounter Templates (Phase 15 Plan 03) ───
  //
  // 19 new universal templates spanning difficulty 15–70.
  // Use ALL_LOCATION_SUBTYPES to guarantee baseline content at every
  // location type including content deserts (ruins, unexplored_poi, etc.).
  // Narrative text is location-agnostic — {actor} placeholder only.

  // ── Low Difficulty (diff 15–30) — Early-Game ──────────────────────

  {
    id: 'encounter.forage_the_land',
    name: 'Forage the Land',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['preservation_transformation', 'revelation_discretion'],
    steps: [
      {
        id: 'forage_land.look',
        name: 'Read the Terrain',
        reach: 'eye',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        narrative: 'Even worked-out land keeps a little back for anyone who knows the order to look in. {actor} reads the ground: low places first, then edges, then the north side of stone.',
        onSuccess: {
          narrative: '{actor} reads the terrain correctly — water, roots, shelter material. The land is never entirely empty.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'Thin pickings. {actor} works until the light goes and carries back bitter root, a nest robbed too late in the season, and little else.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'forage_land.harvest',
        name: 'Harvest What Is Found',
        reach: 'stone',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} puts {their} back into it — digging, cutting, hauling. The finding was the clever part; this part is only work.',
        onSuccess: {
          narrative: '{actor} gathers half again what the survey promised, because the digging turned up a second root run beside the first. The labour pays for itself before dark.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'The ground is harder than it looked and the roots break instead of lifting. {actor} has not yet learned this soil, and it costs a day to find out.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  {
    id: 'encounter.rest_and_reflect',
    name: 'Rest and Reflect',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['loyalty_ambition', 'courage_prudence'],
    /**
     * THR-838 (WS5 Batch 1) — migrated to the nudge model.
     *
     * Vignette record (checklist step 1; no schema field for these yet):
     *   Motive hooks   — `chance` above all: this is the encounter a mortal
     *                    draws because the day ended, not because anyone sent
     *                    them. `choice` for one who stops on purpose. Never
     *                    `mission`; nobody is dispatched to sit down.
     *   Quintessence   — light. Two gentle steps and no trap. Failing here
     *   stakes           costs a night's recovery, not a limb, and the
     *                    aftermath owes no more than that.
     *   Scene tag      — `camp.night.rest` (audit tag: place:hamlet ·
     *                    reach:heart · situation:encounter).
     *
     * Both steps sit far under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.03 and 0.06
     * against a 0.45 ceiling), which is what makes an open-draw hand do
     * anything here — this is background content any mortal can draw, so it
     * cannot be gated to actors who hold `heart`.
     */
    traitVariants: [
      {
        // `core_hope` virtue pole — a seeded Core definition, so the ref is
        // live for `validateTraitRefs()` (checklist step 5's hard constraint).
        traitId: 'trait.core.core_hope.virtue',
        forecastDelta: 0.04,
        difficultyDelta: -0.01,
        factorLine: 'Hopeful, they lie down expecting the morning to be better.',
        addNudgeIds: ['rest_reflect.trust_the_morning'],
      },
    ],
    steps: [
      {
        id: 'rest_reflect.rest',
        name: 'Allow the Rest',
        reach: 'heart',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        purposeLine: 'Put the road down',
        factorLines: [
          { text: 'The fire is already lit and someone else built it.', polarity: 'for' },
          { text: 'Their boots have not come off in three days.', polarity: 'against' },
          { text: 'Every noise past the firelight sounds like a horse.', polarity: 'against' },
        ],
        narrative: '{actor} has walked since before light. The road is still in {their} legs when {they} sit{s} down against the wall, and the fire is close enough to dry one boot at a time.',
        successAtCostAfterimage: 'They slept, and woke with the wall\'s cold worked into one shoulder.',
        criticalSuccessAfterimage: 'They went down at dusk and did not move again until birds.',
        criticalFailureAfterimage: 'They sat up all night with {their} back to the wall, watching the dark past the fire.',
        nudges: [
          {
            // Shared generic pool — the `focus` family.
            id: 'rest_reflect.steady_the_breath',
            name: 'Steady the breath',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.focus',
            fiction: 'Their breathing lengthens without them deciding it. The count between one breath and the next doubles.',
            effectLine: 'A small, reliable push toward sleeping at all.',
            bandProse: {
              success: 'They breathed slow, and slow breathing turned into sleep somewhere they did not notice.',
              near_miss: 'The breathing steadied. Their jaw stayed clamped shut until dawn.',
            },
          },
          {
            id: 'rest_reflect.let_the_ache_out',
            name: 'Let the ache out',
            sphere: 'life',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.warmth',
            fiction: 'The stiffness goes out of one calf, then the other, the way heat leaves a stone.',
            effectLine: 'Good help. The body stops arguing with the ground.',
            bandProse: {
              success_at_cost: 'The ache left {their} legs and settled in {their} lower back instead.',
              failure: 'The legs let go. The blistered heel kept them awake on its own.',
            },
          },
          {
            id: 'rest_reflect.stretch_the_night',
            name: 'Stretch the night',
            sphere: 'time',
            essenceCost: 2,
            forecastDelta: 0.12,
            imageTag: 'generic.time-slow',
            fiction: 'Dawn holds off. The fire burns down to coals twice over before the sky greys.',
            effectLine: 'Strong help. There is more night to sleep in.',
            bandProse: {
              critical_success: 'The night ran long and they used all of it, and stood up in the morning without a sound in {their} knees.',
              failure: 'The night ran long. They spent every extra hour of it staring at the roof beam.',
            },
          },
          {
            id: 'rest_reflect.quiet_the_road_behind',
            name: 'Quiet the road behind',
            sphere: 'spirit',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.stillness',
            fiction: 'The faces {actor} left on the road stop arriving at the edge of sleep. The fire is just a fire.',
            effectLine: 'Strong help against what follows them to bed.',
            bandProse: {
              near_miss: 'The road went quiet. One face waited until {they} had almost gone under, then arrived.',
              critical_failure: 'Nothing came to {them} from the road. What came was closer, and had {their} own voice.',
            },
          },
          {
            id: 'rest_reflect.bank_the_dark',
            name: 'Bank the dark',
            sphere: 'darkness',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.dark',
            fiction: 'The dark past the firelight closes up and stops showing shapes in it.',
            effectLine: 'Good help. There is less out there to watch.',
            bandProse: {
              failure: 'The dark stayed shut. They watched it anyway, all night, to be sure.',
            },
          },
          {
            // Trait-only card: cost 0, the price paid by being this person.
            // Unlocked either by holding the trait or through the template's
            // traitVariant naming it in `addNudgeIds`.
            id: 'rest_reflect.trust_the_morning',
            name: 'Trust the morning',
            requiredTrait: 'trait.core.core_hope.virtue',
            essenceCost: 0,
            forecastDelta: 0.08,
            imageTag: 'generic.oath',
            fiction: 'They stop counting what could go wrong before light. The list was going to keep either way.',
            effectLine: 'A steady help, and it costs no essence.',
            bandProse: {
              near_miss: 'They put the list down and slept badly and woke up glad of the light anyway.',
            },
          },
        ],
        onSuccess: {
          narrative: '{actor} sleeps through, and wakes with the road out of {their} legs.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{actor} cannot stay down. Twice before midnight the bed gives {them} up, and {they} rise{s} stiffer than {they} lay down.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'rest_reflect.reflect',
        name: 'Sit with What Has Passed',
        reach: 'eye',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        purposeLine: 'Count the road back',
        factorLines: [
          { text: 'A whole night of firelight and no one asking for {them}.', polarity: 'for' },
          { text: 'Most of the last month happened on no sleep.', polarity: 'against' },
        ],
        narrative: 'Where has {actor} actually been? {they} walk{s} the last month back in {their} head, one stop at a time, starting from the fire and going backward.',
        successAtCostAfterimage: 'They found the turn where it went wrong, and knew whose turn it was.',
        criticalSuccessAfterimage: 'The whole month laid itself out end to end, and the pattern in it was plain.',
        criticalFailureAfterimage: 'They went back over it until the order came apart and the days would not stay in sequence.',
        nudges: [
          {
            // Shared generic pool — the `luck` family.
            id: 'rest_reflect.a_stray_recollection',
            name: 'A stray recollection',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.luck',
            fiction: 'A smell off the fire — wet wool — puts {them} back on a specific afternoon {they} had lost.',
            effectLine: 'A small push. One day comes back whole.',
            bandProse: {
              success: 'The wet-wool afternoon came back, and the rest of that week came back behind it.',
              near_miss: 'The afternoon came back clear. What happened after it stayed gone.',
            },
          },
          {
            id: 'rest_reflect.hold_the_order',
            name: 'Hold the order',
            sphere: 'mind',
            essenceCost: 2,
            forecastDelta: 0.13,
            imageTag: 'generic.recall',
            fiction: 'The stops stay in the order {they} walked them. Nothing slides forward to sit beside a day it did not happen near.',
            effectLine: 'Strong help. The month keeps its sequence.',
            bandProse: {
              success_at_cost: 'The order held all the way back, and {they} could not stop at the part {they} wanted to skip.',
              failure: 'The order held. There was nothing in it {they} had not already counted twice.',
            },
          },
          {
            id: 'rest_reflect.turn_the_coal',
            name: 'Turn the coal',
            sphere: 'light',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.light',
            fiction: 'A coal turns over on its own and the fire comes up, and {they} can see {their} own hands again.',
            effectLine: 'Good help. Enough light to keep thinking by.',
            bandProse: {
              critical_success: 'The fire came up and stayed up, and by the time it died {they} had the whole shape of it.',
              failure: 'The fire came up well. It showed {them} the same three faces {they} had been avoiding.',
            },
          },
          {
            id: 'rest_reflect.let_the_weight_settle',
            name: 'Let the weight settle',
            sphere: 'entropy',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.settling',
            fiction: 'The parts {they} keep{s} turning over stop turning. What is heavy goes to the bottom and stays there.',
            effectLine: 'Strong help. The small grievances sink out of the way.',
            bandProse: {
              near_miss: 'The small grievances sank. The big one sat on top where it always had.',
              critical_failure: 'Everything settled, and what settled out at the bottom was {their} own part in it.',
            },
          },
          {
            id: 'rest_reflect.name_the_dead',
            name: 'Name the dead',
            sphere: 'spirit',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.remembrance',
            fiction: '{actor} says the names of whoever did not finish the month out loud, once each, to the fire.',
            effectLine: 'Good help, and the count comes out honest.',
            bandProse: {
              failure: 'They said every name {they} had. Two more came to {them} at dawn.',
            },
          },
        ],
        onSuccess: {
          narrative: '{actor} walks the month back to its start and finds the one turn the rest of it hangs on.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'The month will not hold its order. {actor} gives it up at the fourth attempt and watches the fire instead.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  {
    id: 'encounter.local_gossip',
    name: 'Local Gossip',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['loyalty_ambition', 'honesty_cunning'],
    secretDiscovery: { onSuccess: true, sourceName: 'tavern_gossip' },
    steps: [
      {
        id: 'local_gossip.listen',
        name: 'Find the Talkers',
        reach: 'heart',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101 (batch 13, hearsay slice).
        narrative: 'Every place keeps its own historians, and they are not the ones with the records. {actor} has to find them and then be worth the telling.',
        onSuccess: {
          narrative: '{actor} is handed a stool before asking for one. The talk gets ahead of itself inside ten minutes.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The talk goes on around {actor} and never once toward {them}. It is not hostility. The locals simply have not decided yet.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'local_gossip.sort',
        name: 'Sort the True from the Embellished',
        reach: 'shadow',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Half of it is wishful, a quarter is spite, and the rest has been improved in the retelling. {actor} works out which parts nobody had a motive to alter.',
        onSuccess: {
          narrative: 'One account carries a detail that flatters none of the people repeating it. {actor} takes that one and leaves the rest where it lies.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'Every account agrees, which is the trouble with them. {actor} leaves knowing what this place would prefer to be the case.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  {
    id: 'encounter.tend_to_wounds',
    name: 'Tend to Wounds',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['mercy_ruthlessness', 'revelation_discretion'],
    /**
     * THR-838 (WS5 Batch 1) — migrated to the nudge model.
     *
     * Vignette record (checklist step 1):
     *   Motive hooks   — `chance` (the hurt arrive where {actor} happens to be)
     *                    and `choice` (a mortal who goes toward them). `mission`
     *                    where a guild or a lord sends a hand after a bad day.
     *   Quintessence   — moderate on step two and asymmetric: the erosion here
     *   stakes           is watching someone lose a limb {they} could have kept,
     *                    which the failure prose owes plainly.
     *   Scene tag      — `sickroom.table.wounded` (audit tag: place:hamlet ·
     *                    reach:eye · situation:encounter).
     */
    traitVariants: [
      {
        traitId: 'trait.core.core_warmth.virtue',
        forecastDelta: 0.05,
        difficultyDelta: -0.02,
        factorLine: 'Warm, {they} get{s} a hand on the man before asking him anything.',
        addNudgeIds: ['tend_wounds.hold_them_still'],
      },
    ],
    steps: [
      {
        id: 'tend_wounds.assess',
        name: 'Assess the Injury',
        reach: 'eye',
        difficulty: AGNOSTIC_DIFFICULTY_BASE,
        duration: 1,
        purposeLine: 'Find the worst wound',
        factorLines: [
          { text: 'The bleeding has slowed enough to see where it starts.', polarity: 'for' },
          { text: 'He will not lie flat and will not say which arm.', polarity: 'against' },
        ],
        narrative: 'They get him onto the table with his coat still on. {actor} cuts the sleeve away first, because the blood on the outside of a coat says one and the blood inside it says another.',
        successAtCostAfterimage: 'They found the break, and found it by moving the arm he screamed about.',
        criticalSuccessAfterimage: 'Sleeve off, hands on, and {actor} had the whole of it before he stopped shouting.',
        criticalFailureAfterimage: 'They worked on the arm for an hour. The wound that killed him was under his belt.',
        nudges: [
          {
            // Shared generic pool — the `focus` family.
            id: 'tend_wounds.steady_the_hands',
            name: 'Steady the hands',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.focus',
            fiction: 'The shake goes out of {their} fingers. The cut down the sleeve seam runs straight.',
            effectLine: 'A small, reliable push toward reading him right.',
            bandProse: {
              success: 'Steady hands got the coat off him without opening anything further.',
              near_miss: 'The hands were steady. The light over the table was not.',
            },
          },
          {
            id: 'tend_wounds.lamp_over_the_table',
            name: 'Lamp over the table',
            sphere: 'light',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.light',
            fiction: 'The lamp flares and holds, and the dark blood and the bright blood stop looking the same colour.',
            effectLine: 'Strong help. The wound shows what it is.',
            bandProse: {
              critical_success: 'Under the raised lamp {actor} saw the second wound as well as the loud one.',
              failure: 'The light was good. What it showed was a man who had been bleeding inside since noon.',
            },
          },
          {
            id: 'tend_wounds.slow_the_bleeding',
            name: 'Slow the bleeding',
            sphere: 'life',
            essenceCost: 3,
            forecastDelta: 0.14,
            imageTag: 'generic.warmth',
            fiction: 'The flow out of the arm drops to a seep. The cloth under it stops darkening while {they} look{s} at it.',
            effectLine: 'A large help. There is time to look properly.',
            bandProse: {
              success_at_cost: 'The bleeding held off long enough to work. It came back the moment {they} moved him.',
              failure: 'The arm stopped bleeding. His colour kept going anyway.',
            },
          },
          {
            id: 'tend_wounds.quiet_the_room',
            name: 'Quiet the room',
            sphere: 'order',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.stillness',
            fiction: 'The three at the door stop talking at once. His wife sits down without being asked to.',
            effectLine: 'Good help. Nobody is shouting over him.',
            bandProse: {
              near_miss: 'The room went quiet, and in the quiet {they} could hear how he was breathing.',
              critical_failure: 'The room was silent for all of it, and every one of them watched {actor} get it wrong.',
            },
          },
          {
            id: 'tend_wounds.stop_the_clock',
            name: 'Stop the clock',
            sphere: 'time',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.time-slow',
            fiction: 'The blood coming off the table hangs a moment before it falls. There is longer between one of his breaths and the next.',
            effectLine: 'Good help. There is more of the hour to look in.',
            bandProse: {
              failure: 'They had all the time {they} wanted with the arm. The arm was never the problem.',
            },
          },
          {
            // Trait-only card: cost 0.
            id: 'tend_wounds.hold_them_still',
            name: 'Hold him still',
            requiredTrait: 'trait.core.core_warmth.virtue',
            essenceCost: 0,
            forecastDelta: 0.08,
            imageTag: 'generic.oath',
            fiction: 'A hand on his good shoulder, and he stops fighting the table long enough to be looked at.',
            effectLine: 'A steady help, and it costs no essence.',
            bandProse: {
              near_miss: 'He lay still for {them}, and {they} still had to guess at the shoulder.',
            },
          },
        ],
        onSuccess: {
          narrative: '{actor} finds the break under the swelling and knows what it will take.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{actor} reads the arm and misses the ribs. Everything after this is aimed at the wrong wound.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'tend_wounds.treat',
        name: 'Apply the Treatment',
        reach: 'heart',
        difficulty: AGNOSTIC_DIFFICULTY_BASE + AGNOSTIC_DIFFICULTY_STEP,
        duration: 1,
        purposeLine: 'Set it and hold',
        factorLines: [
          { text: 'There is clean linen and a fire to boil water on.', polarity: 'for' },
          { text: 'Setting the arm means holding him down while he fights.', polarity: 'against' },
          { text: 'The only spirits in the house are what he has already drunk.', polarity: 'against' },
        ],
        narrative: 'The bone has to go back before the swelling closes over it. {actor} has two people to hold him, a strip of boiled linen, and the length of time he can stand it.',
        successAtCostAfterimage: 'The arm went back. He will not use the hand the same way again.',
        criticalSuccessAfterimage: 'One pull, clean, and he was asleep before the splint was tied.',
        criticalFailureAfterimage: 'The arm came back out of true under the linen, and by morning it had set that way.',
        nudges: [
          {
            // Shared generic pool — the `strength` family.
            id: 'tend_wounds.one_clean_pull',
            name: 'One clean pull',
            essenceCost: 1,
            forecastDelta: 0.07,
            imageTag: 'generic.strength',
            fiction: 'The pull comes from {their} back and not {their} arms, and the bone goes where it is sent on the first try.',
            effectLine: 'A small push, and it only has to happen once.',
            bandProse: {
              success: 'One pull, and the ends met, and he stopped screaming a breath later.',
              near_miss: 'The pull was clean. It was half a finger short of true.',
            },
          },
          {
            id: 'tend_wounds.dull_the_pain',
            name: 'Dull the pain',
            sphere: 'spirit',
            essenceCost: 3,
            forecastDelta: 0.15,
            imageTag: 'generic.mercy',
            fiction: 'He goes somewhere behind his own eyes for a while. His arm stays on the table without him in it.',
            effectLine: 'A large help. He stops fighting the hands holding him.',
            bandProse: {
              failure: 'He felt none of it and the arm still would not seat.',
              critical_failure: 'He was somewhere else for the setting, and came back to an arm bent where no arm bends.',
            },
          },
          {
            id: 'tend_wounds.clean_water',
            name: 'Clean water',
            sphere: 'matter',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.water',
            fiction: 'The water in the pot goes clear as it comes to the boil, and stays clear when the linen comes out of it.',
            effectLine: 'Strong help against what comes after the setting.',
            bandProse: {
              success_at_cost: 'The linen was clean and the wound stayed clean. The fever came from the ribs instead.',
              failure: 'Clean linen, clean water, and the wound went bad on the third day regardless.',
            },
          },
          {
            id: 'tend_wounds.steady_the_lamp_arm',
            name: 'Steady the lamp',
            sphere: 'light',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.light',
            fiction: 'The boy holding the lamp stops swaying with it. The shadow of {their} own hand quits crossing the wound.',
            effectLine: 'Good help. The work stays lit while it is done.',
            bandProse: {
              failure: 'The lamp never wavered, and every bit of what went wrong was plainly visible.',
            },
          },
          {
            id: 'tend_wounds.hold_the_flesh_closed',
            name: 'Hold the flesh closed',
            sphere: 'life',
            essenceCost: 2,
            forecastDelta: 0.12,
            imageTag: 'generic.knit',
            fiction: 'The lips of the cut sit together instead of gaping, and stay together while the linen goes round.',
            effectLine: 'Strong help. The wound closes as it is bound.',
            bandProse: {
              critical_success: 'The cut closed under the linen and was pink at the edges by the second day.',
              failure: 'It held closed while {they} bound it. It opened under the binding by dark.',
            },
          },
        ],
        onSuccess: {
          narrative: '{actor} sets the arm and splints it, and he sleeps before the second knot is tied.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#healing'],
          },
        },
        onFailure: {
          narrative: 'The bone will not seat. {actor} binds it as it lies and tells his wife what that means.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  {
    id: 'encounter.scout_the_perimeter',
    name: 'Scout the Perimeter',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'courage_prudence'],
    /**
     * THR-838 (WS5 Batch 1) — migrated to the nudge model.
     *
     * Vignette record (checklist step 1):
     *   Motive hooks   — `mission` (posted to walk the line) and `choice` (a
     *                    cautious mortal who wants the ground in {their} head
     *                    before dark). `chance` is thin here and `divine` is
     *                    the god's own hand, which the motive line already says.
     *   Quintessence   — moderate. Step two puts them on the weak approach
     *   stakes           with a billhook in the dark; a critical failure is a
     *                    real injury, and the failure reward pool is weighted
     *                    to conditions to match.
     *   Scene tag      — `perimeter.dusk.watch` (audit tag: place:hamlet ·
     *                    reach:eye · situation:encounter).
     *
     * Difficulties 0.10 and 0.15 — well under `NUDGE_OFF_REACH_MAX_DIFFICULTY`,
     * which an open-draw background template must be.
     */
    traitVariants: [
      {
        traitId: 'trait.core.core_humility.virtue',
        forecastDelta: 0.04,
        difficultyDelta: -0.01,
        factorLine: 'Humble, they walk the line again rather than trust the first pass.',
        addNudgeIds: ['scout_perimeter.walk_it_twice'],
      },
    ],
    steps: [
      {
        id: 'scout_perimeter.map',
        name: 'Map the Approaches',
        reach: 'eye',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + 5,
        duration: 1,
        purposeLine: 'Walk the ground',
        factorLines: [
          { text: 'The ditch on the north side has been dry for a month.', polarity: 'for' },
          { text: 'Thorn scrub covers the whole eastern slope to head height.', polarity: 'against' },
          { text: 'Light goes off the western wall an hour before dusk.', polarity: 'against' },
        ],
        narrative: '{actor} walks the outside edge of the place, hand on the wall where there is wall. Where a man could come up unseen, {they} stop{s} and look{s} back at the roofs to see what he would see.',
        successAtCostAfterimage: 'They finished the circuit, and finished it limping off the thorn slope.',
        criticalSuccessAfterimage: 'One pass, every approach, and the two nobody had ever marked.',
        criticalFailureAfterimage: 'They lost the wall in the scrub and came out on the wrong side of the ditch after dark.',
        nudges: [
          {
            // Shared generic pool — the `light` family.
            id: 'scout_perimeter.hold_the_last_light',
            name: 'Hold the last light',
            essenceCost: 1,
            forecastDelta: 0.07,
            imageTag: 'generic.light',
            fiction: 'The sun sits on the western wall a while longer than it should, and the ditch keeps its shadow.',
            effectLine: 'A small, reliable push. More of the ground stays visible.',
            bandProse: {
              success: 'They had light on the ditch the whole way round, and used all of it.',
              near_miss: 'The light held. It held on the side they had already walked.',
            },
          },
          {
            id: 'scout_perimeter.still_the_scrub',
            name: 'Still the scrub',
            sphere: 'life',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.thicket',
            fiction: 'The thorn on the east slope lies over, all one way, as if a cart had gone through it.',
            effectLine: 'Strong help on the slope that fights hardest.',
            bandProse: {
              success_at_cost: 'The thorn lay down for {them}. It came back up across the path out.',
              failure: 'The slope opened. What it opened onto was more slope.',
            },
          },
          {
            id: 'scout_perimeter.read_the_prints',
            name: 'Read the prints',
            sphere: 'mind',
            essenceCost: 2,
            forecastDelta: 0.13,
            imageTag: 'generic.tracks',
            fiction: 'The scuffs in the ditch sort themselves: sheep, sheep, sheep, and one boot with a worn outside heel.',
            effectLine: 'Strong help. The ground says who has been on it.',
            bandProse: {
              critical_success: 'They read every print in the ditch and knew the man by his heel before {they} ever saw him.',
              failure: 'The prints read clean. All of them were three weeks old.',
            },
          },
          {
            id: 'scout_perimeter.carry_the_sound',
            name: 'Carry the sound',
            sphere: 'energy',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.listening',
            fiction: 'Noise from the far side of the wall arrives as if it were made at {their} shoulder — a bucket, a latch, a cough.',
            effectLine: 'Good help. The far side of the wall stops being quiet.',
            bandProse: {
              near_miss: 'The latch on the far gate came through late. It came through with the gate already behind {them}.',
              critical_failure: 'Every sound came to {them} at once, from every side, and {they} stopped being able to place any of it.',
            },
          },
          {
            id: 'scout_perimeter.settle_the_dust',
            name: 'Settle the dust',
            sphere: 'matter',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.stillness',
            fiction: 'The dry ditch stops smoking under {their} boots. What {they} kick{s} up drops straight back down.',
            effectLine: 'Good help. Nothing announces where they are walking.',
            bandProse: {
              failure: 'No dust went up behind {them} at all. The dogs had them by the second corner regardless.',
            },
          },
          {
            // Trait-only card: cost 0.
            id: 'scout_perimeter.walk_it_twice',
            name: 'Walk it twice',
            requiredTrait: 'trait.core.core_humility.virtue',
            essenceCost: 0,
            forecastDelta: 0.08,
            imageTag: 'generic.oath',
            fiction: 'They do not trust the first pass. They go round again, the other direction, and the wall looks different from it.',
            effectLine: 'A steady help, and it costs no essence.',
            bandProse: {
              near_miss: 'The second pass caught the gap. The second pass also cost {them} the light.',
            },
          },
        ],
        onSuccess: {
          narrative: '{actor} closes the circuit with every approach counted, and the two nobody had marked.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The scrub and the ditch beat the circuit. {actor} covers three sides and guesses at the fourth.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'scout_perimeter.report',
        name: 'Act on What Was Found',
        reach: 'iron',
        difficulty: UNIVERSAL_DIFFICULTY_BASE + UNIVERSAL_DIFFICULTY_STEP + 5,
        duration: 1,
        purposeLine: 'Close the weak side',
        factorLines: [
          { text: 'The smith has cut thorn stakes before and knows the length.', polarity: 'for' },
          { text: 'Everyone who could swing a billhook is already asleep.', polarity: 'against' },
        ],
        narrative: 'Knowing where the wall is thin does nothing by itself. {actor} has one night, whoever will get up, and whatever is stacked behind the smithy.',
        successAtCostAfterimage: 'The gap is stopped. It is stopped with the timber meant for the byre roof.',
        criticalSuccessAfterimage: 'Stakes in the ditch, thorn on the slope, and a boy on the roof by midnight.',
        criticalFailureAfterimage: 'They worked the gap till dawn and left it worse — the ditch bank cut through and open.',
        nudges: [
          {
            // Shared generic pool — the `strength` family.
            id: 'scout_perimeter.one_more_pull',
            name: 'One more pull',
            essenceCost: 1,
            forecastDelta: 0.07,
            imageTag: 'generic.strength',
            fiction: 'The stake that will not seat goes in on the next swing, and the one after that goes in easier.',
            effectLine: 'A small push. The arms last past the point they would.',
            bandProse: {
              success: 'The stakes went in, all of them, and {their} arms gave out afterward instead of during.',
              near_miss: 'The arms held. The daylight did not.',
            },
          },
          {
            id: 'scout_perimeter.wake_the_willing',
            name: 'Wake the willing',
            sphere: 'order',
            essenceCost: 2,
            forecastDelta: 0.12,
            imageTag: 'generic.muster',
            fiction: 'Three doors open on the lane without anyone knocking twice. The smith brings his own billhook.',
            effectLine: 'Strong help. There are hands enough for the work.',
            bandProse: {
              success_at_cost: 'Enough of them came out. Two will not be fit for the fields tomorrow.',
              failure: 'The lane turned out to a man. Nobody among them had ever cut a stake.',
            },
          },
          {
            id: 'scout_perimeter.set_the_timber_true',
            name: 'Set the timber true',
            sphere: 'matter',
            essenceCost: 2,
            forecastDelta: 0.13,
            imageTag: 'generic.stakes',
            fiction: 'Each stake finds the one line of clay under the ditch gravel and stands where it is put.',
            effectLine: 'Strong help. What goes in stays in.',
            bandProse: {
              critical_success: 'Every stake found clay, and the ditch bristled by midnight like it had been planted years back.',
              failure: 'The stakes stood true. The bank they stood in slid a foot before morning.',
            },
          },
          {
            id: 'scout_perimeter.keep_the_arms_warm',
            name: 'Keep the arms warm',
            sphere: 'energy',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.strength',
            fiction: 'Nobody on the ditch stiffens up in the cold. The billhooks keep swinging at the pace they started.',
            effectLine: 'Good help. The work does not slow down toward dawn.',
            bandProse: {
              failure: 'They swung at the same pace all night and the same pace was never going to be enough.',
            },
          },
          {
            id: 'scout_perimeter.stretch_the_hours',
            name: 'Stretch the hours',
            sphere: 'time',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.time-slow',
            fiction: 'The night takes longer to use up. The work goes on past when it should have been too dark to see the line.',
            effectLine: 'Strong help. There is more dark to work in.',
            bandProse: {
              near_miss: 'The night ran long enough for the stakes. Not for the thorn.',
              critical_failure: 'They had all the night {they} wanted, and spent every hour of it cutting the bank open wider.',
            },
          },
        ],
        onSuccess: {
          narrative: '{actor} stops the gap before light — stakes in the ditch, thorn dragged across the slope.',
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The gap is still a gap at dawn. {actor} knows exactly where it is and has done none of the work.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  // ── Moderate Difficulty (diff 35–50) — Mid-Game Universal ─────────

  {
    id: 'encounter.barter_with_travelers',
    name: 'Barter with Travelers',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['asceticism_extravagance', 'loyalty_ambition'],
    steps: [
      {
        id: 'barter_travelers.meet',
        name: 'Make the Approach',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE - 5,
        duration: 1,
        narrative: 'Travelers stop here, and travelers carry goods worth wanting. {actor} must make an approach that reads as neither threat nor desperation.',
        onSuccess: {
          narrative: '{actor} opens the exchange with easy confidence. The travelers are interested.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The travelers stay wary. The exchange starts badly.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'barter_travelers.deal',
        name: 'Strike the Deal',
        reach: 'gold',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP - 5,
        duration: 1,
        narrative: 'Both parties have what the other wants. The question is who blinks first on the price.',
        criticalSuccessAfterimage: '{actor} closes the deal and walks away with more than was on the table — a traveler, impressed, lets slip where the good roads lead and who to name at the far end of them. The goods were never the real prize.',
        criticalFailureAfterimage: 'The deal collapses, and it collapses with an insult {actor} did not intend. The travelers move on and carry the story down every road they take. Some doors close a week\'s walk away before {actor} ever knocks.',
        onSuccess: {
          narrative: '{actor} closes the deal at favorable terms. Both parties leave satisfied.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#trade'],
          },
        },
        onFailure: {
          narrative: 'The deal falls through. Too far apart on price, too little trust. The travelers move on.',
          reputationDelta: -0.04,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#trade'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.defend_against_predators',
    name: 'Defend Against Predators',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    favorGeneration: { onSuccess: true, magnitudeRange: [0.2, 0.40], context: 'stood between them and danger' },
    steps: [
      {
        id: 'defend_predators.detect',
        name: 'Detect the Threat',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The circling animal is large enough to be patient. {actor} reads the signs before it shows itself — the behavior of other animals, a smell, a pattern of silence.',
        onSuccess: {
          narrative: '{actor} places the predator early, two ridges out. {actor} is ready when it moves.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} does not read the signs in time. The predator closes first, and the ground it picks is its own.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'defend_predators.drive_off',
        name: 'Drive It Off',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The predator is not deterred by numbers or noise alone. {actor} must make it understand the cost of attacking.',
        onSuccess: {
          narrative: '{actor} drives the predator off with decisive force. It will not return today.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The predator holds its ground. {actor} drives it back but not away — it is still out there at dusk.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  {
    id: 'encounter.investigate_anomaly',
    name: 'Investigate Anomaly',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['revelation_discretion', 'tradition_novelty'],
    steps: [
      {
        id: 'investigate_anomaly.observe',
        name: 'Observe the Anomaly',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}` mad-lib shape (batch 12, divination
        // slice). The failure line also carried THR-1107's `{they} are` defect
        // ("she are"), which `{s}` cannot reach — fixed by rephrasing.
        narrative: 'Everything in this room is where it should be, and the room is still wrong. {actor} walks the edges of it, looking for the seam.',
        onSuccess: {
          narrative: '{actor} finds the seam: a corner where the light arrives a half-second late. Real, then, and not a trick of tiredness.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The wrongness moves whenever {actor} looks at it directly. After an hour {actor} cannot say what {they} came in here to find.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'investigate_anomaly.understand',
        name: 'Understand the Cause',
        reach: 'veil',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The eye has taken this as far as it goes. The cause left through the other side, and only the veil keeps that record.',
        onSuccess: {
          narrative: '{actor} follows it down to the cause. What passed through this room did not touch the floor, and the air has been holding its shape ever since.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The cause stays behind the veil. {actor} can name the hour it happened and not one detail past that.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.rally_the_locals',
    name: 'Rally the Locals',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['sacrifice_survival', 'loyalty_ambition'],
    secretDiscovery: { onSuccess: true, sourceName: 'confession' },
    steps: [
      {
        id: 'rally_locals.assess_mood',
        name: 'Assess the Mood',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE - 5,
        duration: 1,
        narrative: 'Before rallying anyone, {actor} has to understand what drained them. The complaint people state first is rarely the one that hollowed them out.',
        onSuccess: {
          narrative: '{actor} reads the grievance under the grievance. The speech will land on the real wound instead of beside it.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} addresses the surface complaint. The real wound goes unnamed, and the crowd hears the omission.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'rally_locals.inspire',
        name: 'Inspire Action',
        reach: 'star',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP - 5,
        duration: 1,
        narrative: 'The crowd is assembled and waiting. {actor} stands in front of people who want a reason to hope and will recognise a manufactured one on sight.',
        onSuccess: {
          narrative: '{actor}\'s words move through the crowd like warmth through cold hands. People rise — not because they were told to, but because they decided to.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s words fall flat. The crowd drifts away unchanged, and the drifting is its own answer.',
          reputationDelta: -0.06,
        },
      },
    ],
  },

  {
    id: 'encounter.negotiate_dispute',
    name: 'Negotiate a Dispute',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'heart',
    reachSecondary: 'star',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'loyalty_ambition'],
    steps: [
      {
        id: 'negotiate_dispute.hear',
        name: 'Hear Both Sides',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Two parties arrive at {actor} with opposing accounts of the same injury. Both believe they are right. Both may be.',
        onSuccess: {
          narrative: '{actor} hears both accounts through to the end. By the third telling the shape of the real dispute has surfaced.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} favors one account before hearing the other in full. The mediation is decided before it opens; only the sitting remains.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'negotiate_dispute.resolve',
        name: 'Broker the Resolution',
        reach: 'star',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'A resolution both parties can accept requires finding what each of them actually values, which is rarely what either has asked for out loud.',
        onSuccess: {
          narrative: '{actor} finds the common ground. Both parties leave dissatisfied in equal measure, which is what an accepted settlement looks like.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The dispute will not resolve today. {actor} separates the parties, which is not the same as separating them from the grievance.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  {
    id: 'encounter.shadow_in_the_night',
    name: 'Shadow in the Night',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['honesty_cunning', 'courage_prudence'],
    steps: [
      {
        id: 'shadow_night.move',
        name: 'Move Unseen',
        reach: 'shadow',
        difficulty: MODERATE_DIFFICULTY_BASE + 5,
        duration: 1,
        narrative: 'The night offers cover, and cover works for whoever is already still. {actor} moves between the places where the dark sits deepest, and waits in each one long enough to be sure of the next.',
        onSuccess: {
          narrative: '{actor} crosses the open ground in three moves instead of one. The night holds, and the dogs stay quiet.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'A loose board, a creak, a silhouette against a lit window one beat too long. {actor} is not seen. It is closer than that sounds.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'shadow_night.complete',
        name: 'Complete the Task',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP + 5,
        duration: 2,
        narrative: 'The objective is reached. {actor} has to finish in the dark, working by touch, with the time the household\'s sleep allows and not a minute past it.',
        // Both crit bands predate this batch and carried vagueness-lexicon hits on lines the
        // token sweep never touched: `something` (evasive — enforced at zero in every field
        // class, scope-independent) and `thing`/`someone` (natural indefinites, enforced in
        // outcome prose, which an afterimage is). Fixed here rather than left beside authored
        // prose, per the batch-5 rule that the pass covers every line a batch touches.
        criticalSuccessAfterimage: '{actor} takes what {they} came for and leaves a rearrangement in its place — a drawer half-closed, a coin moved to the wrong shelf — that will have the household blaming each other for weeks. No one hunts a thief who left the count unchanged.',
        criticalFailureAfterimage: 'The task comes apart at the last reach, and {actor} leaves a mark {they} cannot take back — a print, a dropped pick, a face half-seen. The job is unfinished, and there is a household now looking for the shape of {them} in the dark.',
        onSuccess: {
          narrative: '{actor} finishes and puts the room back as {they} found it. Gone before the sun, and before the household stirs.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.4 },
            tagFilters: ['#stealth'],
          },
        },
        onFailure: {
          narrative: 'The lock is a better one than the report described. {actor} withdraws with the task unfinished, having learned the shape of the problem and paid a night for it.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.4 },
            tagFilters: ['#stealth'],
          },
        },
      },
    ],
  },

  // ── High Difficulty (diff 55–70) — Late-Game Universal ────────────

  {
    id: 'encounter.master_local_craft',
    name: 'Master the Local Craft',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'stone',
    reachSecondary: 'gold',
    encounterType: 'create',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['preservation_transformation', 'asceticism_extravagance'],
    steps: [
      {
        id: 'master_craft.study',
        name: 'Study the Tradition',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'Every place makes one thing better than anywhere else, and the reason is usually two hundred years old and never written down. {actor} sets out to learn it properly.',
        onSuccess: {
          narrative: '{actor} learns it in the order they teach it and suggests no improvements. The masters start leaving the workshop unlocked.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: '{actor} learns the steps and not the reasons. The steps are the part the masters do not mind sharing.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'master_craft.execute',
        name: 'Demonstrate Mastery',
        reach: 'stone',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'The last test is simple to state: make one thing in the local tradition that the masters cannot dismiss.',
        criticalSuccessAfterimage: 'The masters do not praise the work. They go quiet, and one of them takes it apart to understand how {actor} did in a single season what should not be done at all. The tradition changes shape around the piece.',
        criticalFailureAfterimage: 'The piece fails in front of the assembled masters — a seam splits as it is lifted, along the exact line the tradition warns about. The story of it outlives the shame, a cautionary example handed to every apprentice after.',
        onSuccess: {
          narrative: 'The masters cannot dismiss it. The tradition has a new practitioner, and — quietly, unwillingly — a new direction.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.5, bestowed_power: 0.5 },
            tagFilters: ['#craft'],
          },
        },
        onFailure: {
          narrative: 'The work is competent. Competent is what the tradition looks like from outside, and outside is where {actor} still stands.',
          reputationDelta: -0.07,
          rewardPool: {
            categoryWeights: { possession: 0.5, bestowed_power: 0.5 },
            tagFilters: ['#craft'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.confront_the_unknown',
    name: 'Confront the Unknown',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'iron',
    reachSecondary: 'veil',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['courage_prudence', 'sacrifice_survival'],
    steps: [
      {
        id: 'confront_unknown.identify',
        name: 'Identify the Threat',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (duel-family batch).
        narrative: 'The place is wrong in a way that does not survive being looked at directly. {actor} works out what is actually here before deciding what to do about it.',
        onSuccess: {
          narrative: '{actor} puts a shape to it — old, patient, and bound here by an arrangement that has outlived the ones who made it. Still dangerous. No longer strange.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'It fits none of the categories {actor} brought. Acting on half an understanding is the only route left, and half an understanding is how people end up inside the walls.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'confront_unknown.face',
        name: 'Face It Directly',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'There is no clever approach left. It has to be met head on — will against will, and whoever stops first loses more than the argument.',
        criticalSuccessAfterimage: '{actor} does not merely outlast it — {they} name{s} it, and the naming undoes it. Where it stood, the air closes like a wound healing clean.',
        criticalFailureAfterimage: 'The unknown takes a piece {actor} cannot name in return. {They} walk{s} out whole in body, but a door was left open behind {their} eyes, and it does not shut.',
        onSuccess: {
          narrative: '{actor} does not flinch and does not look away. It finds no purchase, and withdraws the way cold leaves a room — slowly, and without apology.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'It goes badly, and it goes badly quietly. {actor} walks out under {their} own power, carrying a mark {they} will find later.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.6, condition: 0.4 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  {
    id: 'encounter.weave_political_alliance',
    name: 'Weave a Political Alliance',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'star',
    reachSecondary: 'shadow',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['loyalty_ambition', 'honesty_cunning'],
    secretDiscovery: { onSuccess: true, sourceName: 'confession' },
    steps: [
      {
        id: 'political_alliance.identify',
        name: 'Identify the Right Partners',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'An alliance is worth exactly what its partners are. {actor} has to sort who actually holds power from who merely holds a seat.',
        onSuccess: {
          narrative: '{actor} maps where the power actually sits, which is two seats over from where the seating chart puts it.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: '{actor} misjudges who holds what. The partners approached turn out to be weaker than their titles, and titles are what {actor} read.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'political_alliance.negotiate',
        name: 'Negotiate the Terms',
        reach: 'shadow',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Every partner wants a specific concession and will name only half of it aloud. {actor} has to read the unnamed half off the pauses.',
        onSuccess: {
          narrative: '{actor} answers the requirements nobody stated. The alliance takes shape around them.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A key partner withdraws when the unstated requirement goes unmet. The alliance closes one signature short, which is the same as not closing.',
          reputationDelta: -0.07,
        },
      },
      {
        id: 'political_alliance.seal',
        name: 'Seal the Alliance',
        reach: 'star',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The signing ceremony. {actor} has to hold the alliance together through the point at which its full cost becomes clear to everyone in the room at once.',
        criticalSuccessAfterimage: '{actor} seals the alliance and, in the same breath, binds a partner no one thought could be brought to the table. The room recalculates. What was an agreement is now a power that will outlast its makers.',
        criticalFailureAfterimage: 'The alliance dissolves at the sealing, and it dissolves loudly — a partner names the true price aloud, in front of everyone. {actor} leaves worse off than on arrival, and every enemy made in that room now knows exactly what {actor} wanted.',
        onSuccess: {
          narrative: '{actor} seals the alliance with the kind of authority that makes the room believe it will hold, which is most of what makes it hold.',
          reputationDelta: 0.18,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The alliance dissolves at the sealing. The partners leave in opposite directions, and the work leaves with them.',
          reputationDelta: -0.10,
        },
      },
    ],
  },

  {
    id: 'encounter.arcane_resonance_study',
    name: 'Arcane Resonance Study',
    locationTypes: [...ALL_LOCATION_SUBTYPES],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['tradition_novelty', 'revelation_discretion'],
    steps: [
      {
        id: 'arcane_resonance.attune',
        name: 'Attune to the Resonance',
        reach: 'veil',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (batch 12,
        // divination slice).
        narrative: 'Rooms keep what is done in them. It settles into plaster and floorboard and stays there, thinning by the year. {actor} stops moving and lets it come.',
        onSuccess: {
          narrative: 'It arrives as feeling before it arrives as picture. {actor} waits through the first and the second assembles on its own.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'It comes in pieces and refuses to be more. {actor} holds a shout, a smell of cut wood, and a door closing, and cannot put them in order.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'arcane_resonance.interpret',
        name: 'Interpret What Was Felt',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Feeling is not yet knowledge. Turning one into the other is a separate skill, and the one that fails more often.',
        criticalSuccessAfterimage: 'The impressions do not just resolve — they open. {actor} reads not only what happened in this place but the shape of what it wanted, and the knowing settles in like a language {they} always spoke.',
        // THR-1107: `{they} hold` rendered "she hold" in the he/she arm. `{s}` is
        // the present-tense agreement suffix and reaches this one in place.
        criticalFailureAfterimage: 'The interpretation turns on {actor}. For a breath {they} hold{s} every layer of the place at once — every act, every intention — and the weight of it leaves a ringing that follows {them} into other rooms, other days.',
        onSuccess: {
          narrative: '{actor} gets it across into words. The room gave up a quarrel, a decision, and the name of the person who lost.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The translation comes apart in {actor}\'s hands. The feeling was real and stays real, and will not resolve into a sentence.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { bestowed_power: 0.7, condition: 0.3 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },

  // ─── Content Audit Gap-Fill (Phase: Variety Pass) ────────────────────
  // Fills coverage gaps identified in the trivial/easy content audit:
  // - Veil: zero trivials → 4 added; Star: thin → 4 added; Stone easy gap → 3 added
  // - Iron/Shadow trivials beyond generic → location-flavored added
  // - Castle/fort/tower/mining/shrine/ruins/wilderness specifics
  // - Encounter type diversity (hire, steal, create, duel at trivial)

  // ═══════════════════════════════════════════════════════════════════
  //  VEIL TRIVIALS & EASY (was: 0 trivials, 3 easy)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.read_the_wards',
    name: 'Read the Wards',
    locationTypes: ['castle', 'fort', 'tower', 'temple'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'tradition_progress'],
    steps: [
      {
        id: 'read_wards.sense',
        name: 'Sense the Weave',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The stones here hum with old protections. {actor} places a palm flat against the wall and listens with senses beyond hearing.',
        onSuccess: {
          // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (batch 12,
          // divination slice).
          narrative: 'The pattern opens in {actor}\'s mind, layer on layer, each one laid deliberately over the last. Whoever built this was not in a hurry.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} feels the hum and gets no further. It stays a sound in the teeth, steady, and closed.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'read_wards.interpret',
        name: 'Interpret the Purpose',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Reading the shape of a ward is straightforward work. Reading what it was built to keep out is a different trade entirely.',
        onSuccess: {
          // THR-1101 batch 12: pre-existing `something` in outcome prose — evasive
          // set, enforced at zero in every field class. Carried no `{adj}` token,
          // so no token scan would ever have found it.
          narrative: '{actor} traces the ward to its anchor and reads its intent. It was raised against one named threat, and the name is still legible.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The purpose slips away like smoke. {actor} can tell the ward is guarding, and not what it is guarding against.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'read_wards.catalogue',
        name: 'Catalogue the Defences',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: '{actor} starts at the gate and works inward: every ward, every binding, every glyph still asleep in the mortar. A full census, or none.',
        onSuccess: {
          narrative: 'The full ward-map settles into {actor}\'s memory like a diagram drawn in light. Every vulnerability, every strength, known.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'Too many layers, laid by too many hands. {actor} finishes with a survey good enough to be careful by and not good enough to trust.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.minor_cantrip',
    name: 'Practice a Minor Cantrip',
    locationTypes: ['shrine', 'temple', 'tower', 'ruins'],
    reachPrimary: 'veil',
    reachSecondary: 'star',
    encounterType: 'create',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'revelation_discretion'],
    steps: [
      {
        id: 'minor_cantrip.focus',
        name: 'Draw the Focus',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A quiet corner. A steady breath. {actor} traces a three-stroke sigil in the air with one finger, willing the smallest thread of power into being.',
        onSuccess: {
          narrative: 'Light gathers at {actor}\'s fingertip — faint, trembling, but real. The sigil holds.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The sigil flickers and dissipates. {actor}\'s concentration wavers, and the thread escapes.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'minor_cantrip.sustain',
        name: 'Hold the Working',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Casting is easy. Holding is hard. The cantrip pulls against {actor}\'s attention the whole time, wanting to come apart.',
        onSuccess: {
          narrative: 'Three heartbeats. Five. Ten. The cantrip holds, obedient and unremarkable. Small magic is still magic.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The working collapses after two breaths. {actor} lets it go and shakes out {their} hand. Tomorrow, then.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'minor_cantrip.release',
        name: 'Shape the Release',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The cantrip completes when released properly — not dropped, but set down, like a stone pressed into wet mortar.',
        onSuccess: {
          narrative: 'The cantrip settles into the world with a soft click, like a key turning. A small piece of work done exactly right, and {actor} notices.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#veil'],
          },
        },
        onFailure: {
          narrative: 'The release is clumsy. The cantrip sputters away harmlessly — no damage done, but no craft achieved.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.hedge_remedy',
    name: 'Brew a Hedge Remedy',
    locationTypes: ['wilderness', 'oasis', 'farmland', 'hamlet'],
    reachPrimary: 'veil',
    reachSecondary: 'eye',
    encounterType: 'create',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'tradition_progress'],
    steps: [
      {
        id: 'hedge_remedy.gather',
        name: 'Gather the Ingredients',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} combs the undergrowth for the right leaves, the right bark, the right fungus. Folk medicine begins with knowing where to look.',
        onSuccess: {
          // THR-1101 batch 8: was `{actor} has what {they} need{they}.` — a mangled `{s}`
          // suffix that rendered as "she has what she needshe". Pre-existing, unrelated to
          // the mad-lib rewrite, fixed here because the line was being rewritten anyway.
          narrative: 'Yarrow, willow bark, and a nameless grey fungus that grows only in shadow. {actor} has all three by dusk.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Wrong season, wrong soil. {actor} finds substitutes, but substitutes are never quite the same.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'hedge_remedy.prepare',
        name: 'Prepare the Poultice',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The line between herbalism and magic blurs in the mortar. {actor} grinds steadily and says the old words under {their} breath.',
        onSuccess: {
          narrative: 'The poultice warms under {actor}\'s hands, which yarrow does not do on its own. The remedy works.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The mixture turns grey and smells of iron. {actor} discards it before it does more harm than the wound.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'hedge_remedy.apply',
        name: 'Apply with Care',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Healing is the gentlest magic and the most exacting. {actor} lays the remedy on flesh and wills it to take.',
        onSuccess: {
          narrative: 'The wound closes, the fever breaks, the cough eases. {actor} wipes {their} hands and keeps quiet. The remedy speaks for itself.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#healing'],
          },
        },
        onFailure: {
          narrative: 'The remedy helps, and stops helping short of enough. {actor} knows the limits of hedge magic and does not pretend otherwise.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.test_the_seal',
    name: 'Test a Binding Seal',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city'],
    reachPrimary: 'veil',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'courage_prudence'],
    steps: [
      {
        id: 'test_seal.approach',
        name: 'Approach the Seal',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (batch 12,
        // divination slice).
        narrative: 'A door in the ruin was shut with will and sigil rather than lock and key. {actor} feels the pressure of it from ten paces out.',
        onSuccess: {
          narrative: '{actor} places the tradition: old work, careful work, and still bad-tempered about visitors.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The pressure moves {actor} back a pace without touching {them}. The warning lands. The language it is written in does not.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'test_seal.probe',
        name: 'Probe the Edges',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Testing a seal means finding where it gives, if it gives at all. {actor} leans on the edges of it, a little at a time.',
        onSuccess: {
          narrative: 'A hairline weakness. The seal holds, but {actor} knows where it could be opened — or reinforced.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The seal pushes back harder than it was pushed. {actor} withdraws with two burnt fingers and a better estimate of the work.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'test_seal.record',
        name: 'Record the Findings',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'Knowledge of a seal — its strength, its age, its purpose — is valuable to those who know what to do with it.',
        onSuccess: {
          narrative: '{actor} fixes the whole schema in memory: age, tradition, strength, and a fair guess at what is on the other side of it.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.5, bestowed_power: 0.5 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The detail goes soft within the hour. {actor} keeps the location and loses the reading, which is the worse half to lose.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  //  STAR TRIVIALS & EASY (was: 2 trivials, 1 easy)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.shrine_offering',
    name: 'Leave a Shrine Offering',
    locationTypes: ['shrine', 'temple', 'ruins'],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'create',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    /**
     * THR-838 (WS5 Batch 1) — migrated to the nudge model.
     *
     * Vignette record (checklist step 1; no schema field for these yet):
     *   Motive hooks   — `choice` above all: the shrine is a place one goes to,
     *                    and the gift was picked before the walk. `chance` for
     *                    one who passes the stones with a bad week behind them.
     *                    `mission` only where a household sends its youngest.
     *   Quintessence   — moderate, and the only one in the pair that bites: the
     *   stakes           gift is really given, and step 0 decides how much it
     *                    cost to give. No wound, but a real ledger entry.
     *   Scene tag      — `shrine.dusk.offering` (audit tag: place:hamlet ·
     *                    reach:star · situation:encounter).
     *
     * The paired half of `encounter.offer_small_prayer`: the same rite with
     * stones to do it at, so the shape is given and what is tested is what the
     * person brings to it. Three steps sit at 0.10 / 0.18 / 0.26 against the
     * 0.45 `NUDGE_OFF_REACH_MAX_DIFFICULTY` ceiling — `background` tier is open
     * draw, so the roster meeting this mostly holds neither `star` nor `heart`.
     *
     * Pre-migration detectors: abstraction 0.89, vagueness 2.23 (fail),
     * not-X-but-Y 2 (fail), second person 2 (fail — "What do you give a god?").
     */
    traitVariants: [
      {
        // `core_integrity` virtue pole — seeded Core definition, live ref for
        // `validateTraitRefs()` (checklist step 5's hard constraint).
        traitId: 'trait.core.core_integrity.virtue',
        forecastDelta: 0.04,
        difficultyDelta: -0.01,
        factorLine: 'What {they} bring{s} to the stones is what {they} would bring unwatched.',
        addNudgeIds: ['shrine.give_the_good_one', 'shrine.mean_it_going_down'],
      },
      {
        // `core_hope` virtue pole — the same seeded family the paired
        // `offer_small_prayer` uses, and for the same reason: staying past the
        // sensible hour is a hope test, not a devotion test.
        traitId: 'trait.core.core_hope.virtue',
        forecastDelta: 0.03,
        difficultyDelta: -0.01,
        factorLine: 'They stay down past the hour a harder head would call it off.',
        addNudgeIds: ['shrine.wait_one_hour_more'],
      },
    ],
    steps: [
      {
        id: 'shrine_offering.select',
        name: 'Choose the Gift',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        purposeLine: 'Weigh what to give',
        factorLines: [
          { text: 'The same coin has been in the pack since spring, kept for this.', polarity: 'for' },
          { text: 'The pack holds three days of food and one knife, both spoken for.', polarity: 'against' },
        ],
        narrative: 'A god is owed better than the cheapest item in the pack. {actor} turns the pack out onto a flat stone and looks at it: coin, a comb, dried meat, a ring off a dead man\'s hand.',
        successAtCostAfterimage: 'They gave the ring. It had been meant to settle a debt, and the debt is still standing.',
        criticalSuccessAfterimage: 'They set down the coin carried since spring without weighing it against the others, because it had always been the one.',
        criticalFailureAfterimage: 'They picked out the comb with its teeth gone, told themselves it was humble, and knew better while doing it.',
        nudges: [
          {
            // Shared generic pool — the `focus` family.
            id: 'shrine.count_it_honestly',
            name: 'Count it honestly',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.focus',
            fiction: 'The pack empties onto the stone and {they} look{s} at each item for what it would cost to walk on without it.',
            effectLine: 'A small, reliable push toward an honest count.',
            bandProse: {
              success: 'Laid out honestly, one item was plainly worth more to give up than the rest.',
              near_miss: 'The count was honest until it reached the coin, and there it went crooked.',
            },
          },
          {
            id: 'shrine.feel_the_weight',
            name: 'Feel the weight',
            sphere: 'spirit',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.listening',
            fiction: 'Each item on the stone carries how much it would be missed, and the missing is what the shrine reads.',
            effectLine: 'Strong help. The gift is judged by loss.',
            bandProse: {
              success_at_cost: 'They felt exactly what the ring was worth to keep, and gave it anyway.',
              failure: 'Every item on the stone weighed the same, which meant nothing on it was being given up.',
            },
          },
          {
            id: 'shrine.remember_the_asking',
            name: 'Remember the asking',
            sphere: 'mind',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.memory',
            fiction: 'What {they} came here to ask for comes back word for word, and sets the price of the answer.',
            effectLine: 'Good help. The gift is sized to the ask.',
            bandProse: {
              failure: 'They recalled the asking perfectly and still could not price it.',
              critical_failure: 'They recalled the asking so exactly that {they} priced it above everything in the pack, and left the stone bare.',
            },
          },
          {
            id: 'shrine.let_the_grain_show',
            name: 'Let the grain show',
            sphere: 'matter',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.matter',
            fiction: 'The comb\'s cracked spine and the ring\'s worn shank sit up plain on the stone, past arguing with.',
            effectLine: 'Good help. The goods stop flattering themselves.',
            bandProse: {
              critical_success: 'Grain and wear read at a glance, and the one sound, loved item stood out among them.',
              near_miss: 'The wear showed on all of it, and {they} learned only that {they} owned rubbish.',
            },
          },
          {
            id: 'shrine.count_what_is_going',
            name: 'Count what is going',
            sphere: 'entropy',
            essenceCost: 2,
            forecastDelta: 0.08,
            imageTag: 'generic.decay',
            fiction: 'How long each item has left — the meat, the shank, the man who owned the ring — comes clear.',
            effectLine: 'A steady help. None of it keeps.',
            bandProse: {
              failure: 'They saw how little of it would last, and gave the shrine the item that was rotting anyway.',
            },
          },
          {
            // Trait-only card: cost 0, the price paid by being this person.
            id: 'shrine.give_the_good_one',
            name: 'Give the good one',
            requiredTrait: 'trait.core.core_integrity.virtue',
            essenceCost: 0,
            forecastDelta: 0.08,
            imageTag: 'generic.oath',
            fiction: 'The cheap option is on the stone with the rest and stays there. It was never going to be picked up.',
            effectLine: 'A steady help, and it costs no essence.',
            bandProse: {
              near_miss: 'They gave the good one and spent the walk out counting what it had cost.',
            },
          },
        ],
        onSuccess: {
          narrative: '{actor} chooses a gift with {their} own use still on it — worn, personal, missed. The stones of the shrine seem to lean in a hand\'s width.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} sets down the item {they} would have thrown out by autumn. The air over the stones does not stir.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'shrine_offering.place',
        name: 'Place with Reverence',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        purposeLine: 'Set it down right',
        factorLines: [
          { text: '{Their} mother did this at the same stones, and {they} watched it done.', polarity: 'for' },
          { text: '{Their} knees are wet and the light is going.', polarity: 'against' },
        ],
        narrative: 'An offering is placed, never dropped. {actor} kneels at the weathered stones, holds the gift a while on both palms, and sets it in the hollow where rain has worn a dish.',
        successAtCostAfterimage: 'It went down right. {Their} knees will be stiff for two days, and {they} left the walking-staff leaning at the stones.',
        criticalSuccessAfterimage: 'The gift went into the hollow as though the hollow had been cut for it, and the whole shrine felt aimed at {them} for a breath.',
        criticalFailureAfterimage: 'They fumbled it. The ring went off the stone into wet grass, and {they} left it there rather than kneel again.',
        nudges: [
          {
            // Shared generic pool — the `focus` family.
            id: 'shrine.steady_the_hands',
            name: 'Steady the hands',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.focus',
            fiction: 'The shake goes out of {their} wrists between one breath and the next.',
            effectLine: 'A small, reliable push toward a clean placing.',
            bandProse: {
              success: 'The hands were steady and the gift went into the hollow without a sound.',
              near_miss: 'The hands held to the last inch, and gave out on the last inch.',
            },
          },
          {
            id: 'shrine.keep_the_old_form',
            name: 'Keep the old form',
            sphere: 'order',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.order',
            fiction: 'The order of it comes back: right knee down, both palms, the hollow, and no words until after.',
            effectLine: 'Strong help. The rite has a shape to follow.',
            bandProse: {
              failure: 'They kept the form exactly and it stayed a set of motions.',
              critical_failure: 'They kept the form so hard the stones got a performance where a gift should have been.',
            },
          },
          {
            id: 'shrine.find_the_hollow',
            name: 'Find the hollow',
            sphere: 'matter',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.matter',
            fiction: 'The worn dish in the stone shows itself under the moss, exactly where a hundred hands put it.',
            effectLine: 'Good help. There is a right place for it.',
            bandProse: {
              near_miss: 'The hollow lay under moss outside the search, and the gift went down beside it.',
            },
          },
          {
            id: 'shrine.warm_it_first',
            name: 'Warm it first',
            sphere: 'life',
            essenceCost: 2,
            forecastDelta: 0.08,
            imageTag: 'generic.warmth',
            fiction: 'The ring takes {their} heat and holds it, so what goes down on the stone is warm off a body.',
            effectLine: 'Good help. The gift arrives carrying its owner.',
            bandProse: {
              success_at_cost: 'It went down warm, and {they} felt the loss of it the second the warmth left {their} hand.',
              near_miss: 'It went down warm, and the warmth was off it before the stones had noticed.',
            },
          },
          {
            id: 'shrine.let_it_fall_true',
            name: 'Let it fall true',
            sphere: 'chaos',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.luck',
            fiction: '{They} stop{s} aiming. The gift goes down where the hand was already going.',
            effectLine: 'A steady help. Aim stops being the trouble.',
            bandProse: {
              critical_success: '{They} did not aim, and it went dead centre of the hollow, where no amount of practice puts it.',
              near_miss: 'They let the hand decide, and the hand put it an inch wide of the dish.',
            },
          },
          {
            // Trait-only card: cost 0, the price paid by being this person.
            id: 'shrine.mean_it_going_down',
            name: 'Mean it going down',
            requiredTrait: 'trait.core.core_integrity.virtue',
            essenceCost: 0,
            forecastDelta: 0.08,
            imageTag: 'generic.oath',
            fiction: 'There is no part of {them} standing off to one side and watching {them} do it.',
            effectLine: 'A steady help, and it costs no essence.',
            bandProse: {
              failure: 'They meant every inch of it, and the stones took no notice at all.',
            },
          },
        ],
        onSuccess: {
          narrative: 'The air over the stones goes thick and old for a breath, and then is ordinary air again. The gift is taken.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The gift sits in the hollow looking like an item on a rock. {actor} rises with wet knees and no reply.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'shrine_offering.listen',
        name: 'Listen for an Answer',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        purposeLine: 'Stay past the rite',
        factorLines: [
          { text: 'No one is waiting, and there is no bed to reach by dark.', polarity: 'for' },
          { text: 'Most who wait at these stones hear the wind and go home.', polarity: 'against' },
        ],
        narrative: 'The faithful stay on after the gift is down. {actor} keeps the knee on wet stone and listens through the wind for whatever sits behind it.',
        successAtCostAfterimage: 'An answer came, and by then the cold had set in too deep to stand without hauling on the stones.',
        criticalSuccessAfterimage: 'What arrived was a heading — plain as a hand laid on the shoulder, turning {them} to face the right road.',
        criticalFailureAfterimage: 'The wind did all the talking and {they} took it for an answer, and set off the way it happened to be blowing.',
        nudges: [
          {
            // Shared generic pool — the `focus` family.
            id: 'shrine.outlast_the_cold',
            name: 'Outlast the cold',
            essenceCost: 1,
            forecastDelta: 0.06,
            imageTag: 'generic.focus',
            fiction: 'The cold in {their} knees stops being the loudest fact about the evening.',
            effectLine: 'A small, reliable push toward staying.',
            bandProse: {
              success: 'They outlasted the cold, and it came in the hour after most would have gone.',
              near_miss: 'They outlasted the cold and not the light, and left at dusk one hour short.',
            },
          },
          {
            id: 'shrine.listen_past_the_wind',
            name: 'Listen past the wind',
            sphere: 'spirit',
            essenceCost: 2,
            forecastDelta: 0.12,
            imageTag: 'generic.listening',
            fiction: 'The wind comes apart from what stands behind the wind, and only one of the two is worth hearing.',
            effectLine: 'Strong help. The wind stops counting as an answer.',
            bandProse: {
              failure: 'They heard past the wind and found the space behind it empty.',
              critical_failure: 'They listened past the wind and put a voice into the hush themselves, and believed it.',
            },
          },
          {
            id: 'shrine.hold_the_last_light',
            name: 'Hold the last light',
            sphere: 'time',
            essenceCost: 2,
            forecastDelta: 0.10,
            imageTag: 'generic.time-slow',
            fiction: 'The dusk stops falling and stands where it is, and the hour {they} needed is simply there.',
            effectLine: 'Good help. The hour does not run out.',
            bandProse: {
              near_miss: 'The light held and held, and {actor} spent all of it waiting for a better hush to listen into.',
            },
          },
          {
            id: 'shrine.let_the_dark_come',
            name: 'Let the dark come',
            sphere: 'darkness',
            essenceCost: 2,
            forecastDelta: 0.09,
            imageTag: 'generic.dark',
            fiction: 'Full dark closes over the stones and takes the view away, and there is only listening left to do.',
            effectLine: 'Good help. There is less to look at.',
            bandProse: {
              critical_success: 'In full dark the stones stopped being stones, and what {actor} heard came with no wind in it.',
              near_miss: 'The dark came down whole, and {they} heard {their} own heart and called it a reply.',
            },
          },
          {
            id: 'shrine.set_down_the_wanting',
            name: 'Set down the wanting',
            sphere: 'mind',
            essenceCost: 2,
            forecastDelta: 0.11,
            imageTag: 'generic.mind',
            fiction: 'What {they} hoped to be told stops sitting in front of what is actually said.',
            effectLine: 'Strong help. The asking stays honest.',
            bandProse: {
              success_at_cost: 'They stopped wanting a particular answer, and got one, and it was not that one.',
              failure: 'They set the wanting down and found {they} had set the whole asking down with it.',
            },
          },
          {
            // Trait-only card: cost 0, the price paid by being this person.
            id: 'shrine.wait_one_hour_more',
            name: 'Wait one hour more',
            requiredTrait: 'trait.core.core_hope.virtue',
            essenceCost: 0,
            forecastDelta: 0.08,
            imageTag: 'generic.oath',
            fiction: 'The hour where a sensible person stands up and goes comes and goes, and finds {them} still down on the stone.',
            effectLine: 'A steady help, and it costs no essence.',
            bandProse: {
              near_miss: 'They waited an hour past sense, and got a cold knee and the wind for it.',
              critical_failure: 'They waited past every sensible hour, and walked home in the dark sure of an answer {they} had built.',
            },
          },
        ],
        onSuccess: {
          narrative: 'A certainty goes through {actor} — no voice, no light, a heading. The road ahead has one fork fewer on it.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'Wind, and the stones, and the light going. {actor} gets up cold with the gift given and no reply to carry off.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.read_the_stars',
    name: 'Read the Night Sky',
    locationTypes: ['wilderness', 'camp', 'oasis', 'battleground'],
    reachPrimary: 'star',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'tradition_progress'],
    steps: [
      {
        id: 'read_stars.observe',
        name: 'Chart the Constellations',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}` mad-lib shape (batch 12, divination
        // slice).
        narrative: 'Clear sky, no moon. {actor} lies back on cold ground and finds the old markers first — the Forge, the Wanderer, the Broken Crown.',
        onSuccess: {
          narrative: 'The stars are where they should be. {actor} takes the season off them, and the north, and one reading that will keep until morning.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Cloud comes in off the west. {actor} gets half the sky and loses the half that mattered.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'read_stars.interpret',
        name: 'Read the Portents',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Stars give time and direction to anybody who looks up. The rest of it they give to whoever is still lying there at the third hour.',
        onSuccess: {
          narrative: 'The pattern says one clear word and no more. {actor} could not repeat it aloud, and makes the next three decisions faster than {they} would have.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The stars are only stars tonight. {actor} gets up, brushes the dew off {their} back, and allows that the fault may be the reader.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'read_stars.divine',
        name: 'Accept the Omen',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'An omen does not instruct. It puts weight on one side of a scale that was already tipping, and leaves the walking to the walker.',
        onSuccess: {
          narrative: '{actor} takes the reading down off the hill intact: a warning, or a promise, or a question that will need answering before winter.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'It fades like a dream at first light. {actor} keeps the certainty of having been told, and not one word of what.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.tend_the_dead',
    name: 'Tend the Resting Dead',
    locationTypes: ['battleground', 'ruins', 'ruined_village', 'ruined_city'],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'tradition_progress'],
    steps: [
      {
        id: 'tend_dead.find',
        name: 'Find the Unquiet',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Not all the dead rest well. {actor} walks the killing ground, listening for the whispers of those who linger.',
        onSuccess: {
          narrative: '{actor} finds them — not ghosts, not yet, but echoes of pain caught between the world and the door out of it.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The dead are silent. Perhaps they rest after all. Perhaps {actor} simply cannot hear them.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'tend_dead.rites',
        name: 'Speak the Words',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} does not know the proper rites for every faith, every culture, every fallen soul. But grief is a universal language.',
        onSuccess: {
          narrative: 'The words are imperfect. The intent is not. The air eases, and the ground feels lighter underfoot.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s words fall flat. The dead want a name, a kin, a truth — and {actor} can offer none of the three.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'tend_dead.mark',
        name: 'Mark the Place',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The last duty: mark the place so others know. A cairn. A carved stone. A marker that says: here, people mattered.',
        onSuccess: {
          narrative: '{actor} raises a cairn that will outlast the season. Passers-by will stop at the spot, and know the dead here were counted.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The cairn is rough and badly stacked. It will not survive the winter. But the attempt was made.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.blessing_of_passage',
    name: 'Bless the Road',
    locationTypes: ['camp', 'hamlet', 'oasis', 'farmland'],
    reachPrimary: 'star',
    reachSecondary: 'veil',
    encounterType: 'create',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    steps: [
      {
        id: 'bless_road.prepare',
        name: 'Prepare the Blessing',
        reach: 'star',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101 batch 8: `{they} carry` was the pronoun-plus-bare-verb defect batches
        // 3–7 each met — `{s}` cannot reach a verb inside a subordinate clause, so a
        // gendered render read "she carry". Pronoun subject dropped rather than patched.
        narrative: 'Travelers deserve safe roads. {actor} gathers salt, water, and one word of protection, taken from whatever faith is close to hand.',
        onSuccess: {
          narrative: 'The materials are simple and the faith is sincere. Both are what the work needs, and {actor} has both.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The faith falters before it reaches {actor}\'s hands. A blessing said in doubt is a sentence said out loud.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'bless_road.walk',
        name: 'Walk the Boundary',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} walks the road\'s edge, scattering salt at the crossroads and touching each boundary stone. The words come without being reached for.',
        onSuccess: {
          narrative: 'The road feels different underfoot — lighter, less grudging, as if the ground has stopped bracing against being walked on.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The road takes the effort and does not change. {actor} cannot tell whether the blessing set or ran off into the dirt.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'bless_road.seal',
        name: 'Seal with Conviction',
        reach: 'star',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The final word is the hardest. It has to carry far enough to still be there when the next traveler comes through.',
        onSuccess: {
          narrative: 'Done. Travelers will feel it without knowing what it is — an easier mile, and weather that turns kind at the right hour.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The blessing is thin. It will fade before the next rain. But for one day, the road was safer.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#divine'],
          },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  //  STONE EASY & LOCATION-SPECIFIC (was: only 1 easy — temple_expansion)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.patch_the_walls',
    name: 'Patch the Walls',
    locationTypes: ['castle', 'fort', 'tower', 'ruined_tower'],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'patch_walls.assess',
        name: 'Survey the Damage',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} runs a hand along the stonework, testing mortar joints with a thumbnail. Every fortress tells its age in cracks.',
        onSuccess: {
          narrative: 'The weak points are catalogued — here, where frost has pried; there, where a siege engine left its mark and nobody wrote it down.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} misses the deeper cracks, the ones hidden behind moss and forty years of nobody looking.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'patch_walls.repair',
        name: 'Mix and Lay',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Mortar, water, aggregate, patience. {actor} works with cold hands, pressing new life into old stone.',
        onSuccess: {
          narrative: 'The patch holds. Not elegant, but sound — the wall is whole again where it was failing.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The mortar cures wrong — too wet, too fast. {actor}\'s patch will need patching.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'patch_walls.reinforce',
        name: 'Brace the Foundation',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The surface is repaired. But the foundation beneath the crack — that is what decides whether the wall stands through winter.',
        onSuccess: {
          narrative: '{actor} braces the foundation with cairn-stone and iron pins. This wall will stand another generation at least.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The foundation shifts under the repair. {actor}\'s work is adequate above ground and a question below it.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.dig_a_well',
    name: 'Dig a Well',
    locationTypes: ['hamlet', 'farmland', 'camp', 'oasis'],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'tradition_progress'],
    steps: [
      {
        id: 'dig_well.divine_water',
        name: 'Find the Water',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Water is down there. The question is where, and how deep. {actor} reads the land — the way grass grows greener in one line, the way mud persists after rain.',
        onSuccess: {
          narrative: '{actor} drives a stake into the spot and turns the sod back. Mud. Good mud. The water is close.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Dry earth, then more dry earth. {actor} chose the wrong spot, and the spot took three days to say so.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'dig_well.dig',
        name: 'Break the Ground',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Spade, bucket, aching shoulders. {actor} digs steadily, one load at a time, deeper and deeper.',
        onSuccess: {
          narrative: 'Water seeps into the hole — clear, cold, and rising. {actor} cups a palmful and drinks. The well is true.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The walls of the hole collapse inward. {actor} climbs out covered in clay and starts considering a different site.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'dig_well.line',
        name: 'Line and Cap',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'A hole is not a well. {actor} lines the shaft with dressed stone, builds a rim, mounts a windlass. Craft is what turns a pit into water a village can rely on.',
        onSuccess: {
          narrative: 'The well is finished. Clean water, close to where people live. {actor} leaves behind the one kind of work that will outlast {them}.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The lining shifts. The well works, and it leaks — usable, not permanent. The finishing falls to whoever comes after.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.clear_the_rubble',
    name: 'Clear the Rubble',
    locationTypes: ['ruins', 'ruined_village', 'ruined_city', 'ruined_tower', 'battleground'],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'build',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'clear_rubble.sort',
        name: 'Sort What Can Be Saved',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} picks through the wreckage with care — good stone here, rotten timber there, a hinge that still works.',
        onSuccess: {
          narrative: 'A tidy pile of salvage grows. {actor} finds enough sound material to make the clearing worth the week.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Everything is cracked, warped, or ruined past saving. The rubble gives back broken stone and a wasted day.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'clear_rubble.haul',
        name: 'Haul and Stack',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The heavy work. {actor} lifts, drags, and stacks until the arms stop registering the weight, turning chaos into cleared ground.',
        onSuccess: {
          narrative: 'The site is clear. For the first time in years, the ground beneath the ruin sees daylight. A foundation could go down here.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s strength gives out before the job is done. Half-cleared rubble is worse than untouched rubble.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'clear_rubble.discover',
        name: 'What Lies Beneath',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'Beneath the rubble the original foundation shows itself — and now and then, what somebody took the trouble to bury under it.',
        onSuccess: {
          narrative: '{actor} uncovers the foundation line, intact and true. Set into it, a sealed compartment, still whole.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.4 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The foundation is too far gone to tell much. Under the rubble was more rubble.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  //  IRON TRIVIALS — LOCATION-FLAVORED (was: only generic sharpen_blades)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.drill_the_watch',
    name: 'Drill the Watch',
    locationTypes: ['castle', 'fort', 'camp', 'town'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'drill_watch.assemble',
        name: 'Call the Muster',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} rings the bell and watches who comes running and who comes when it suits them. Discipline starts at the muster or it does not start.',
        onSuccess: {
          narrative: 'Full turnout, faster than {actor} expected. Not sharp, but present and willing, which is the harder half.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Half the watch is late. Two are drunk. {actor} holds the post and has not yet been granted what the post is supposed to come with.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'drill_watch.run',
        name: 'Run the Drill',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Posts, rotations, challenge-and-response. {actor} drills the basics past boredom and into reflex.',
        onSuccess: {
          narrative: 'By the third repetition the watch moves without thinking about it. {actor} says so once, out loud — this will hold through the night.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Confusion at the third post. The rotation collapses into an argument about whose relief was whose. {actor} will run it again tomorrow.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'drill_watch.test',
        name: 'Test with a Surprise',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} stages a test — a false alarm, an intruder who is only a sergeant in a borrowed cloak — to see whether the drill holds when it is not expected.',
        onSuccess: {
          narrative: 'The watch responds. Not cleanly, but the drill holds. When it happens for real they will be ready enough.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Panic. The watch scatters in four directions. {actor} calls a halt and starts again from the muster, because that is where it came apart.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.spar_with_a_stranger',
    name: 'Spar with a Stranger',
    locationTypes: ['town', 'city', 'camp', 'fort'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'spar_stranger.size_up',
        name: 'Size Up the Opponent',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the `{adj}`/`{verb}` mad-lib shape (duel-family batch).
        narrative: 'A stranger in the yard. Good stance, calm eyes, blunt steel on the rack behind {them}. {actor} watches {them} move and reads the story the body tells.',
        onSuccess: {
          narrative: 'Left-handed, favors the riposte, drops the shoulder before striking. {actor} has the measure of them before the first touch.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} misjudges the stranger\'s reach by a hand. The first exchange will teach it properly.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'spar_stranger.cross',
        name: 'Cross Blades',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The first touch. Blunt steel rings in the cold morning air. {actor} tests, feints, and learns.',
        onSuccess: {
          narrative: 'Three exchanges, and {actor} finds the rhythm. The stranger grins — they have found a morning worth getting up for.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The stranger is faster than advertised. {actor} takes one across the forearm that will be purple by noon, and adjusts. Learning hurts.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'spar_stranger.respect',
        name: 'Earn the Nod',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'A sparring match ends when one of them does enough to be worth acknowledging. {actor} presses for the last exchange.',
        onSuccess: {
          narrative: 'The stranger lowers the blade and nods once. No words are offered and none are needed — steel says it plainly enough.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The stranger takes the last exchange cleanly and does not make a show of it. {actor} bows, bruised, and files the lesson.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  //  SHADOW TRIVIALS — LOCATION-FLAVORED (was: only pickpocket)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.case_the_joint',
    name: 'Case the Joint',
    locationTypes: ['city', 'capital', 'town', 'castle'],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'loyalty_ambition'],
    steps: [
      {
        id: 'case_joint.observe',
        name: 'Watch and Count',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        narrative: '{actor} finds a doorway with a view and settles in for the evening. How many guards, on what hours, and which of the doors does not quite sit in its frame.',
        onSuccess: {
          narrative: 'The pattern comes clear by the second night: the shift changes late, the north corner is unwatched for the length of it, and a kitchen boy props the side door with a boot to smoke.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Three nights, and the pattern refuses to settle. The guard rota turns on a schedule {actor} cannot find from the outside, which is either good practice or bad luck.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'case_joint.map',
        name: 'Map the Approaches',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Knowing the inside is half of it. {actor} walks the outside — alleys, rooftops, the drain that runs under the yard — at hours when walking there is unremarkable.',
        onSuccess: {
          narrative: 'Three routes in, two out, and a third out through a cooper\'s yard that no one has thought to watch since the cooper died. {actor} commits all six to memory and writes down none of them.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A watchman marks {actor} standing too long at the same corner and says so, pleasantly, which is worse than shouting. That corner is spent now, and so is that face for a fortnight.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'case_joint.assess',
        name: 'Judge the Risk',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Every job carries a price that is only ever paid on failure. {actor} sets what is inside against what the magistrate here does to people caught inside, and the second figure is the easier one to learn.',
        onSuccess: {
          narrative: '{actor} knows the building better than the people sleeping in it. The risk has a number now, and the number is survivable. The decision stops being a guess and becomes a choice.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'The figures will not come out. {actor} cannot price the strongroom without opening it, and cannot open it without paying the price first. Uncertainty has buried more thieves than watchmen have.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.dead_drop',
    name: 'Service a Dead Drop',
    locationTypes: ['town', 'city', 'capital', 'camp'],
    reachPrimary: 'shadow',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'loyalty_ambition'],
    steps: [
      {
        id: 'dead_drop.approach',
        name: 'Walk the Route',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} takes the long route. Double back at the fountain, pause at the baker\'s stall, check the reflection in a puddle. Clean approach.',
        onSuccess: {
          narrative: 'No tail. No watching eyes. {actor} reaches the drop site clean.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'A face appears twice in the crowd. Coincidence? {actor} aborts and walks away.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'dead_drop.exchange',
        name: 'Make the Exchange',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The loose brick. The hollow tree. The gap beneath the third step. {actor}\'s hands work with practiced speed.',
        onSuccess: {
          narrative: 'Message left, message taken. {actor} walks away with a name and a date, small and valuable — information, always information.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The drop is empty — already serviced, or the signal was wrong. {actor} leaves with an empty hand and a route now burned.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'dead_drop.vanish',
        name: 'Vanish into the Crowd',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The art is not in arriving or exchanging. The art is in disappearing afterward, as though {actor} had never stood there at all.',
        onSuccess: {
          narrative: '{actor} melts into the crowd and becomes nobody. The drop is complete. Nobody knows.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'A face in a doorway held on {actor} a beat too long. No name taken, no arrest — but a seed of suspicion planted. Sloppy.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  //  LOCATION-GAP FILLS (castle, fort, mining, tower, wilderness)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'encounter.inspect_the_armoury',
    name: 'Inspect the Armoury',
    locationTypes: ['castle', 'fort'],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'tradition_progress'],
    steps: [
      {
        id: 'inspect_armoury.count',
        name: 'Count the Stock',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        narrative: '{actor} walks the racks with a slate: swords, spears, shields, bows. Two columns only — fit for use, and rusted past a smith\'s help.',
        onSuccess: {
          narrative: 'The count comes out at forty-three serviceable blades, eleven shields, and a crossbow wanting a string. Enough to arm a wall, and not enough to lose any of it.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'A messenger takes {actor} away at the second rack and the count never resumes. The figure that goes in the ledger is an estimate, and estimates have a habit of becoming the number everyone plans around.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'inspect_armoury.test',
        name: 'Test the Quality',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} draws a blade at random and tries the edge, the weight in the hand, the temper against a thumbnail. An armoury says more about a garrison than its commander does.',
        onSuccess: {
          narrative: 'Good steel under clean oil, and the racks arranged so the worst blades are drawn first at drill. The quartermaster is doing the job unwatched, which is the only test worth running.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Pitted edges, shields warped where they were stacked wet, and a rack of spears with the heads gone loose. The armoury has been signed off every month by a name {actor} can read on the ledger.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'inspect_armoury.report',
        name: 'File the Report',
        reach: 'iron',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'An inspection without a report is a walk through a shed. {actor} sits down with the slate and turns four days of counting into a page a commander will actually read.',
        onSuccess: {
          narrative: 'The report runs to one page and a schedule: what to repair this month, what to replace before winter, what to requisition and from whom. The commander reads it twice and signs the requisition that evening.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The report says the armoury needs attention and stops there. No rack numbers, no smith named, no line to draw the money against. It will be filed, and the racks will look the same in spring.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.shore_up_the_mine',
    name: 'Shore Up the Mine',
    locationTypes: ['mining'],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'shore_mine.inspect',
        name: 'Inspect the Timbers',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} taps the support beams and listens. Good wood answers differently from rot. A mine gives its warnings to anyone willing to stand still for them.',
        onSuccess: {
          narrative: 'Three beams need replacing and one of them needs replacing today. {actor} marks them in chalk and moves deeper.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor}\'s ear isn\'t tuned to timber. The mine keeps its secrets and its schedule.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'shore_mine.brace',
        name: 'Cut and Brace',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'New timber against old stone. {actor} cuts, fits, and hammers fast, because the ceiling has started making noise.',
        onSuccess: {
          narrative: 'The new brace takes the weight. The groaning stops. {actor} wipes dust from {their} face and moves to the next beam.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The fit is wrong — too short, too green. {actor} braces it anyway and hopes the timber holds through winter.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'shore_mine.test',
        name: 'Test the Load',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The real test: driving a loaded cart through the shored section. If the timbers hold under it, the mine stays open.',
        onSuccess: {
          narrative: 'The cart passes. The timbers hold. The mine earns another season, and {actor} earns a nod from men who do not hand them out.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'A timber cracks under load. Nobody is buried, and the section is closed off. More work tomorrow.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.map_the_passages',
    name: 'Map the Passages',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city', 'mining'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'tradition_progress'],
    steps: [
      {
        id: 'map_passages.enter',
        name: 'Mark the Entrance',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        narrative: '{actor} scratches a chalk mark at the entrance and starts the tally. Left hand on the wall, paces counted under the breath, a knot in a cord at every hundred.',
        onSuccess: {
          narrative: 'The first junction goes down on the slate: three passages, two of them blind within twenty paces, one that drops. The cord has four knots in it.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} loses the count at the second turning and will not admit which side of it. Chalk does not hold on wet stone; by the return trip the marks are grey smears at knee height.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'map_passages.chart',
        name: 'Chart the Depths',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Deeper, the rock changes and starts giving useful answers. {actor} reads the strata, the draught, and where the water chooses to run. Underground has a geography of its own, and it is not the surface one.',
        onSuccess: {
          narrative: 'The chart comes together rough and correct: distances paced, elevations guessed within a fathom, and the route back marked in a heavier hand than the rest.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Two of the passages meet where the chart says they cannot. {actor} has drawn a map of a place that does not exist, using measurements taken from one that does.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'map_passages.complete',
        name: 'Complete the Survey',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The last passages, and the lamp oil is a real number now. {actor} walks the remaining branches on tired legs, marking each dead end so the next surveyor need not walk it twice.',
        onSuccess: {
          narrative: 'The map is finished. It is ugly and it is right. Anyone carrying a copy gets in, and — the part that matters — gets back out.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The oil runs low before the legs do, which settles it. {actor} hands over a chart of the upper levels with the bottom third left blank, and marks the blank honestly rather than guessing at it.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.catalogue_the_tower',
    name: 'Catalogue the Tower Library',
    locationTypes: ['tower'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'tradition_progress'],
    steps: [
      {
        id: 'catalogue_tower.inventory',
        name: 'Take Inventory',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        narrative: 'Dust, cobwebs, and the smell of vellum that has been damp at least once. {actor} starts at the bottom shelf and works upward, counting spines and writing the number at the end of each run.',
        onSuccess: {
          narrative: 'Two hundred and thirty texts, fourteen scrolls, and three cases still sealed with wax that has a sigil pressed into it. {actor} now knows the size of the job.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The shelving follows no order {actor} can find — not subject, not age, not size. One section gets counted twice, and an alcove behind the stair gets missed until the light moves.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'catalogue_tower.classify',
        name: 'Classify the Contents',
        reach: 'veil',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Not every book in a tower is only a book. {actor} goes along the shelves with a palm out, feeling for the ones warmer than the room has any reason to make them.',
        onSuccess: {
          narrative: 'Seven answer the hand. Three of those are warded on top of it, and one is warm enough to read by. {actor} moves each with a cloth and does not open the warm one.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The whole room reads the same to {actor}\'s hand — faintly wrong, and uniformly so. The tower is either hiding which books matter, or the honest answer is all of them.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'catalogue_tower.record',
        name: 'Record the Finds',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'A catalogue is worth exactly its accuracy. {actor} writes title, condition, subject, and — where the hand felt one — the signature, for every text on the shelves.',
        onSuccess: {
          narrative: 'The catalogue is complete down to the water damage on the third shelf. Scholars will use it for a century, and none of them will learn whose winter it cost.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'The catalogue covers two walls of the four. Good enough that the next reader does not repeat the work, not good enough to find one named book without walking the shelves.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#knowledge'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.gather_firewood',
    name: 'Gather Firewood',
    locationTypes: ['wilderness', 'camp', 'farmland', 'ruins'],
    reachPrimary: 'eye',
    reachSecondary: 'stone',
    encounterType: 'acquire',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'justice_mercy'],
    steps: [
      {
        id: 'gather_wood.find',
        name: 'Find the Good Wood',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Not all wood burns clean. {actor} hunts the dry timber — standing deadwood, storm-fallen oak, any trunk with two seasons of drying behind it.',
        onSuccess: {
          narrative: '{actor} finds a windfall — a dead oak, bark-stripped and bone-dry. Enough to burn hot for days.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Green wood, wet wood, punky wood that crumbles at the axe. {actor} collects what there is, knowing it will smoke more than it burns.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'gather_wood.carry',
        name: 'Bundle and Carry',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Finding wood is easy. Carrying enough of it back is the work. {actor} bundles, ties, and shoulders the load.',
        onSuccess: {
          narrative: 'A full bundle, well-tied and balanced across the shoulders. The camp will eat warm tonight because {actor} did the carrying.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The bundle splits halfway back and the best of it goes down a bank. {actor} arrives with half a load and aching shoulders.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'gather_wood.stack',
        name: 'Stack for the Season',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'A proper woodstack is engineering. Air flow, rain cover, the oldest wood where the hand reaches first. {actor} stacks with care.',
        onSuccess: {
          narrative: 'The stack is tight, covered, and ordered oldest to greenest. Months of warmth, secured against weather and theft.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#survival'],
          },
        },
        onFailure: {
          narrative: 'The stack collapses twice. {actor} piles it rough against the wall and hopes the rain holds off.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.prospect_the_seam',
    name: 'Prospect the Seam',
    locationTypes: ['mining', 'wilderness', 'ruins'],
    reachPrimary: 'gold',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'asceticism_extravagance'],
    steps: [
      {
        id: 'prospect_seam.sample',
        name: 'Take Samples',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101: authored out of the mad-lib shape (explore-family batch, survey slice).
        narrative: '{actor} takes a hammer to the face and works along it, a sample every few paces. Grain, colour, and how the stone breaks — three questions, asked over and over.',
        onSuccess: {
          narrative: 'The breaks come away clean and heavy, and the colour holds through six samples running. The seam goes back into the hill rather than along it. Worth the next week.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The good rock stops a handspan behind the face. What looked like a seam is a skin over ordinary stone — the find that has ruined every prospector who stopped sampling early.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'prospect_seam.estimate',
        name: 'Estimate the Yield',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} does the arithmetic on a board: depth, richness, the cost of hauling it to a road. A seam that pays at the face can still lose money by the time it reaches a buyer.',
        onSuccess: {
          narrative: 'The numbers come out on the right side, with room left over for the winter the figures do not know about yet. {actor} checks them once more and lets {themselves} believe it.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Too deep, too much rock on top, and forty miles to a road that carries a cart. The ore is there. Getting it out costs more than it sells for.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'prospect_seam.stake',
        name: 'Stake the Claim',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'A find is only a find if it can be held. {actor} builds cairns at the corners and blazes the trees along the boundary, which is the law here and also the argument.',
        onSuccess: {
          narrative: 'The claim is staked, the boundary walked with a witness, and the entry made at the assay office before dark. {actor} owns a piece of the mountain on paper, which is the only place ownership has ever lived.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#stone'],
          },
        },
        onFailure: {
          narrative: 'There is a cairn at the north corner already, weathered by one winter. {actor} did the survey work and another prospector did the paperwork, and only the second of those counts.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.wildcraft_shelter',
    name: 'Build a Wildcraft Shelter',
    locationTypes: ['wilderness', 'unexplored_poi', 'battleground'],
    reachPrimary: 'stone',
    reachSecondary: 'eye',
    encounterType: 'build',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['tradition_progress', 'courage_prudence'],
    steps: [
      {
        id: 'wildcraft_shelter.site',
        name: 'Choose the Site',
        reach: 'eye',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Not too close to water, not too exposed to wind, not beneath anything that might fall. {actor} reads the terrain with a survivor\'s eye.',
        onSuccess: {
          narrative: 'Good ground: dry, out of the prevailing wind, with a natural windbreak on two sides.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} picks a spot that looks right and drains badly. Tomorrow\'s rain will make the case.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'wildcraft_shelter.build',
        name: 'Raise the Shelter',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Branches, bracken, bark. {actor} builds with what the land offers — no nails, no rope, just knowledge and effort.',
        onSuccess: {
          narrative: 'The shelter stands: low, snug, and dry enough. Not comfortable, but alive. {actor} crawls inside having earned it.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The frame collapses as soon as {actor} adds the roof layer. Back to the first three branches.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'wildcraft_shelter.improve',
        name: 'Weatherproof',
        reach: 'stone',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The difference between surviving the night and surviving the week is weatherproofing. {actor} layers, seals, and banks the walls up with earth.',
        onSuccess: {
          narrative: 'Rain drums on the roof. Inside stays dry. {actor} watches the weather from the other side of it and allows a rare smile.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Leaks in three places. {actor} spends the night moving pots around and cursing the wind.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.negotiate_passage',
    name: 'Negotiate Safe Passage',
    locationTypes: ['wilderness', 'camp', 'fort', 'hamlet'],
    reachPrimary: 'heart',
    reachSecondary: 'gold',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'loyalty_ambition'],
    steps: [
      {
        id: 'negotiate_passage.approach',
        name: 'Make the Approach',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Empty hands held high. {actor} approaches the checkpoint and asks to pass. The answer depends on who\'s asking.',
        onSuccess: {
          narrative: '{actor}\'s bearing says \'traveler, not threat.\' The guards lower their spears by a fraction.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'Suspicion. The spears stay level. {actor}\'s approach reads wrong, and no second reading is offered.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'negotiate_passage.terms',
        name: 'Agree the Terms',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Safe passage has a price. {actor} negotiates: a toll, a favour, a piece of information. The currency of the road.',
        onSuccess: {
          narrative: 'A price is named and paid. {actor} passes through with a nod — commerce, not conflict.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The price is too high. {actor} cannot or will not pay what\'s asked. The road remains closed.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'negotiate_passage.honour',
        name: 'Honour the Agreement',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'The deal is only as good as the honour behind it. {actor} keeps to the agreed terms, even while the other side watches for betrayal.',
        onSuccess: {
          narrative: 'Clean passage. {actor} crosses without incident and leaves behind a reputation for keeping {their} word.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'The mood sours before the last spear is lowered. The passage is grudging, the terms strained. {actor} gets through and leaves no goodwill behind.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#gold'],
          },
        },
      },
    ],
  },
  {
    id: 'encounter.garrison_gossip',
    name: 'Garrison Gossip',
    locationTypes: ['castle', 'fort', 'tower'],
    reachPrimary: 'heart',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'loyalty_ambition'],
    steps: [
      {
        id: 'garrison_gossip.listen',
        name: 'Sit and Listen',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        // THR-1101 (batch 13, hearsay slice).
        narrative: 'The mess hall after dark. {actor} nurses a cup and lets the talk go past — complaints, boasts, the same three stories the garrison tells about itself.',
        onSuccess: {
          narrative: 'The complaints are the useful part. By the third round {actor} knows who is obeyed, who is only feared, and which watch nobody volunteers for.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The table goes quiet when {actor} sits, then starts up again on the weather. They are not unfriendly. They are simply not going to do this tonight.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'garrison_gossip.steer',
        name: 'Steer the Conversation',
        reach: 'shadow',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 1,
        narrative: 'A question with the weight taken out of it, set down at the right moment. {actor} steers by agreeing with the wrong man at the right time.',
        onSuccess: {
          narrative: 'Nobody notices doing it. Between them the table gives up troop strength, how long the stores last, and precisely which of the commander\'s orders get quietly rounded off.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'One question too many, and a sergeant changes the subject with some skill. {actor} drinks the rest of the cup and lets it go. The table will remember the question longer than the answer.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'garrison_gossip.file',
        name: 'File It Away',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Overheard talk is not intelligence until it has been arranged. {actor} sits with it afterwards and works out which pieces contradict each other.',
        onSuccess: {
          narrative: 'The contradictions are where the useful part was hiding. {actor} walks out understanding this garrison better than the officers who file reports on it.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'It will not arrange. {actor} comes away with forty true statements and no idea which three matter, which is worse company than an empty notebook.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.mend_fishing_nets',
    name: 'Mend the Fishing Nets',
    locationTypes: ['hamlet', 'oasis', 'camp'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['justice_mercy', 'tradition_progress'],
    steps: [
      {
        id: 'mend_nets.inspect',
        name: 'Find the Tears',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} spreads the nets across the dock boards and runs fingers along the mesh, feeling for gaps, for weakness, for the places where the catch escapes.',
        onSuccess: {
          narrative: 'Seven tears, two worn sections, and a knot that was never properly tied. {actor} has the full picture.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} misses the subtler damage — the stretched mesh that will split under the first heavy catch.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'mend_nets.repair',
        name: 'Tie the Knots',
        reach: 'heart',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Net-mending is rhythmic, patient work. {actor}\'s fingers learn the pattern: loop, pull, tighten. Repeat.',
        onSuccess: {
          narrative: 'The nets are whole again. The fisher at the dock nods once — no words needed between people who understand useful work.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor}\'s knots are clumsy — too loose, or the wrong gauge. Serviceable, but a real net-mender would wince.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'mend_nets.deliver',
        name: 'Return to the Dock',
        reach: 'gold',
        difficulty: DIFFICULTY_BASE + DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Good work deserves fair payment. {actor} returns the mended nets and settles the account.',
        onSuccess: {
          narrative: 'A meal, a bed, and the quiet satisfaction of being useful. Some days that is the whole of it.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'The fisher finds a flaw {actor} missed. Payment is docked a third. Fair enough.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ─── Party-exclusive delves (THR-74 PR 2b) ──────────────────────
  // Group-EXCLUSIVE content: `actorAffinities: ['group']` (no 'individual') +
  // `minGroupMembers: 2`. Unreachable to solo agents by construction — only a
  // company fielding ≥2 living members draws them (generateUnifiedCandidates
  // group gate, THR-74 reachability seam). Physical-challenge shaped (iron/stone
  // qualifying, shadow supporting; no heart/gold/star step), so best-member
  // substitution spotlights a different companion on each step: {actor} is the
  // acting member for that step while the others back them.
  {
    id: 'encounter.sunken_vault',
    name: 'The Sunken Vault',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city', 'mining', 'unexplored_poi'],
    sublocationTypes: ['sublocation-type.dungeon'],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    actorAffinities: ['group'],
    minGroupMembers: 2,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'sunken_vault.door',
        name: 'The Sealed Door',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A slab of black stone bars the vault, swollen shut by centuries of flood. It will not yield to one pair of hands. {actor} sets their shoulder to it while the others find their grip.',
        onSuccess: {
          narrative: '{actor} braces and the company heaves as one; the slab grinds inward on a gasp of stale air.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The slab holds. {actor} slips on the wet floor and the company loses the grip they had won, breath spent for nothing.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'sunken_vault.channels',
        name: 'The Drowned Channels',
        reach: 'shadow',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Beyond the door the passages fork and flood, half-submerged and lightless. {actor} reads the current where the others see only black water, calling the turnings back over their shoulder.',
        onSuccess: {
          narrative: '{actor} finds the dry line through the maze, and the company wades after their voice into the vault\'s heart.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} misreads a fork and the company backs out of a dead flooded gallery, colder and turned around.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'sunken_vault.haul',
        name: 'The Rising Water',
        reach: 'stone',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'The prize sits on a plinth as the water climbs their knees, then their waists. {actor} takes the weight and the company forms a chain to pass it back toward the light before the vault drowns them with it.',
        onSuccess: {
          narrative: '{actor} bears the load hand to hand up the chain, and the company breaks the surface soaked and laughing, the vault\'s treasure between them.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.3, bestowed_power: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The water wins. {actor} loses their footing and the company hauls each other out empty-handed, the prize left to the dark below.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.broken_span',
    name: 'The Broken Span',
    locationTypes: ['ruins', 'ruined_tower', 'mining', 'unexplored_poi', 'cavern'],
    sublocationTypes: ['sublocation-type.dungeon'],
    reachPrimary: 'stone',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    actorAffinities: ['group'],
    minGroupMembers: 2,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'broken_span.anchor',
        name: 'The Anchor',
        reach: 'stone',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The bridge has fallen into a chasm with no bottom the light can find. {actor} drives a line into the living rock while the company tests every span of it with their weight.',
        onSuccess: {
          narrative: '{actor} sets the anchor true; it takes the strain of them all without a groan.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The rock crumbles around {actor}\'s spike. The company draws back from the edge, the crossing still ahead and no purchase won.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'broken_span.crossing',
        name: 'The Crossing',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} goes first across the swaying line, hand over hand above the dark, the others feeding the rope and watching the anchor hold.',
        onSuccess: {
          narrative: '{actor} reaches the far ledge and turns to belay the rest; one by one the company crosses into the deep on their strength.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} swings hard into the far wall and the company hauls them back bruised; the span is not crossed this way.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'broken_span.rearguard',
        name: 'The Rearguard',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'Something in the dark has smelled them cross. {actor} holds the choke at the ledge\'s mouth while the company drags their prize clear behind.',
        onSuccess: {
          narrative: '{actor} breaks the pursuit at the narrow place, and the company withdraws intact into open air, the deep sealed behind them.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, possession: 0.4, bestowed_power: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The choke gives. {actor} is overrun and the company scatters for the light, leaving more behind than they carried out.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.hollow_watch',
    name: 'The Hollow Watch',
    locationTypes: ['ruins', 'ruined_city', 'mining', 'fort', 'unexplored_poi'],
    sublocationTypes: ['sublocation-type.dungeon', 'sublocation-type.barracks'],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'explore',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    actorAffinities: ['group'],
    minGroupMembers: 2,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'hollow_watch.breach',
        name: 'The Breach',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 2,
        narrative: 'The warren has grown up into the ruin\'s bones, and what nests there must be cleared before it spreads. {actor} takes the first dark mouth of it while the company packs in close behind their back.',
        onSuccess: {
          narrative: '{actor} carries the threshold and the company floods the breach behind them, driving the nesting things back off their own ground.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The breach turns into a killing box. {actor} is forced back onto the company and they give up the mouth of it, bloodied.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'hollow_watch.line',
        name: 'The Line',
        reach: 'stone',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Deeper in, the warren comes for them from every gallery at once. {actor} anchors the line in a chamber they can hold while the others fight shoulder to shoulder around them.',
        onSuccess: {
          narrative: '{actor} will not be moved, and the company holds the chamber until the tide of them breaks and thins.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The line bends. {actor} is cut from the others for a heartbeat too long, and the company gives ground it will have to win twice.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'hollow_watch.collapse',
        name: 'The Collapse',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP * 2,
        duration: 3,
        narrative: 'One deep gallery holds the heart of the warren. {actor} sets the last props to fall while the company buys the moments it takes, everyone counting the same breaths.',
        onSuccess: {
          narrative: '{actor} brings the gallery down on the nest and the company runs out ahead of the dust, the hollow watch finally silent behind them.',
          reputationDelta: 0.15,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.35, possession: 0.25 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The collapse comes early. {actor} barely clears the fall and the company counts heads in the dark outside, not liking the number.',
          reputationDelta: -0.1,
        },
      },
    ],
  },

  // ─── Band counter-encounters (THR-731 PR 2) ─────────────────────
  // The band's side of a contested engagement. `bandOpposition.synthesizeBandCounter`
  // picks one of these by `bandRole` when a band is walked into, and the pair resolves
  // through the shipped TB-044 contested path.
  //
  // They are ordinary group-exclusive templates, deliberately: a band is a company,
  // and a defender band standing its watch or a raider band working a road is a
  // perfectly good encounter for it to draw on its own. Fencing them off into a
  // synth-only pool would have been the special-casing this ticket is under orders to
  // resist — and would have left them unreachable and unverifiable in a live run.
  //
  // Two steps, not three: the answering side is reacting, not mounting an expedition.
  {
    id: 'encounter.band_defend',
    name: 'Hold the Ground',
    locationTypes: ['hamlet', 'town', 'city', 'capital', 'castle', 'fort', 'tower', 'temple', 'shrine'],
    sublocationTypes: ['sublocation-type.barracks', 'sublocation-type.guild-hall'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    actorAffinities: ['group'],
    minGroupMembers: 2,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'band_defend.mark',
        name: 'The Mark',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Strangers with purpose in their walk, and the hall behind them to lose. {actor} counts the approach and passes the number down the line without turning their head.',
        onSuccess: {
          narrative: '{actor} reads them before they are close enough to matter, and the band is standing where it means to stand when they arrive.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{actor} misjudges the approach, and the band is still finding its ground when the strangers reach it.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'band_defend.ground',
        name: 'The Ground',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'No speeches. {actor} sets themselves in the doorway and the others close up either side, and what the faction pays them for comes due.',
        onSuccess: {
          narrative: '{actor} holds the doorway and the band holds behind them; whatever the strangers came for, they do not leave with it.',
          reputationDelta: 0.1,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The line bends and then it is not a line. {actor} gives ground they were sent to keep, and the hall is open behind them.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
  {
    id: 'encounter.band_raid',
    name: 'Take the Road',
    locationTypes: ['camp', 'farmland', 'ruins', 'ruined_village', 'ancient_road', 'oasis', 'unexplored_poi'],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    actorAffinities: ['group'],
    minGroupMembers: 2,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'band_raid.wait',
        name: 'The Wait',
        reach: 'shadow',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The road runs where it has always run, and the band has been in the grass beside it since before light. {actor} holds the others still with one flat hand.',
        onSuccess: {
          narrative: '{actor} keeps the band silent past the point where silence is comfortable, and nothing on the road knows they are there.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'Someone shifts, a bird goes up, and {actor} watches the road ahead of them learn exactly where they are lying.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'band_raid.spring',
        name: 'The Spring',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} comes out of the grass first because that is what going first means, and the rest of the band comes out behind them.',
        onSuccess: {
          narrative: '{actor} takes the road out from under them, and the band closes it before anyone on it decides to fight for it.',
          reputationDelta: 0.1,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'They were ready. {actor} is met on the way in, and the band goes back into the grass with less than it brought.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // ─── Confrontation family (THR-731 PR 3) ────────────────────────
  // The company's side of a band engagement, and the reason a fight reads as a
  // confrontation rather than as whatever errand the company happened to be on
  // when it walked into one.
  //
  // All four carry `requiresOpposingBand: true`, so they are unreachable unless a
  // band is standing on the hex — these are encounters *about* a specific enemy,
  // and one that surfaces with nobody on the other side is a scene with an empty
  // chair in it. The band answers with `encounter.band_defend` / `band_raid`
  // (PR 2) and the pair resolves on the shipped TB-044 contested ladder.
  //
  // Reaches rotate across steps on purpose: best-member substitution puts a
  // different companion in {actor} for each one, so a confrontation spotlights
  // the whole company rather than its strongest fighter three times.
  {
    id: 'encounter.confront_ambush',
    name: 'The Ambush',
    locationTypes: ['camp', 'farmland', 'ruins', 'ruined_village', 'ancient_road', 'oasis', 'unexplored_poi'],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    actorAffinities: ['group'],
    minGroupMembers: 2,
    requiresOpposingBand: true,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'confront_ambush.quiet',
        name: 'The Wrong Quiet',
        reach: 'eye',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The birds went up a while back and have not come down. {actor} keeps walking at the same pace and looks at the treeline without turning their head.',
        onSuccess: {
          narrative: '{actor} names the shapes in the grass before the grass moves, and the company is already turning to face them when it does.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} reads the quiet as quiet. The company is strung out along the road when the road stops being empty.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'confront_ambush.rush',
        name: 'The First Rush',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'They come out of the ground on both sides at once. {actor} meets the nearest of them before the company has finished understanding what is happening.',
        onSuccess: {
          narrative: '{actor} breaks the rush where it is thinnest, and the company comes through the gap they made instead of dying strung out along the road.',
          reputationDelta: 0.1,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The rush goes through. {actor} is turned around by it and the company is fighting in three places that cannot see each other.',
          reputationDelta: -0.06,
        },
      },
      {
        id: 'confront_ambush.break',
        name: 'The Break',
        reach: 'heart',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Ambushes end when one side decides they have had enough of it. {actor} sets about making that decision for the other side.',
        onSuccess: {
          narrative: '{actor} holds the company together past the point the road expected them to run, and it is the other side that goes back into the grass.',
          reputationDelta: 0.14,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} cannot make the line hold. The company leaves the road to whoever wanted it, carrying what they can.',
          reputationDelta: -0.1,
        },
      },
    ],
  },
  {
    id: 'encounter.confront_den_assault',
    name: 'Den Assault',
    locationTypes: ['ruins', 'ruined_tower', 'ruined_city', 'mining', 'unexplored_poi', 'cavern'],
    sublocationTypes: ['sublocation-type.dungeon'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    actorAffinities: ['group'],
    minGroupMembers: 2,
    requiresOpposingBand: true,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'confront_den_assault.approach',
        name: 'The Approach',
        reach: 'shadow',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Going in after them means giving up the ground they know for the ground they chose. {actor} takes the company the last stretch on the side where the wind runs the wrong way for sentries.',
        onSuccess: {
          narrative: '{actor} brings the company to the mouth of it unannounced, and whoever was supposed to be watching is still watching the road.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'Something goes over in the dark and the noise carries. {actor} arrives at a den that has had time to arrange itself.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'confront_den_assault.mouth',
        name: 'The Mouth',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The entrance is narrow, which cuts both ways. {actor} goes in first because the company cannot go in abreast and someone has to be the one who does not.',
        onSuccess: {
          narrative: '{actor} takes the narrow part and holds it open long enough for the company to come through behind them.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The narrow part holds against them instead. {actor} is pushed back into the company, and the den keeps its door.',
          reputationDelta: -0.08,
        },
      },
      {
        id: 'confront_den_assault.deep',
        name: 'The Deep End',
        reach: 'stone',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'Past the entrance it opens out, and every turning belongs to them. {actor} keeps the company moving toward the part of it worth taking.',
        onSuccess: {
          narrative: '{actor} carries the company all the way in, and the den stops being anybody\'s. What was kept here is theirs to carry out.',
          reputationDelta: 0.18,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.5, condition: 0.3, bestowed_power: 0.2 },
          },
        },
        onFailure: {
          narrative: '{actor} takes the company as deep as it will go and no further. They come back out through their own way in, with less than they brought.',
          reputationDelta: -0.12,
        },
      },
    ],
  },
  {
    id: 'encounter.confront_guild_falls',
    name: 'The Guild Falls',
    locationTypes: ['hamlet', 'town', 'city', 'capital', 'castle', 'fort', 'tower', 'temple', 'shrine'],
    // `guild-hall`, hyphenated — the id worldgen actually mints (34 on seed 42
    // medium). Shipped as `guildhall` in PR 3 (and in `band_defend` above), which
    // matched nothing in any world and was the sole reason this capstone and the
    // band's own counter-encounter could never draw.
    sublocationTypes: ['sublocation-type.guild-hall'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    actorAffinities: ['group'],
    minGroupMembers: 2,
    requiresOpposingBand: true,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'confront_guild_falls.names',
        name: 'The Names',
        reach: 'eye',
        difficulty: HARD_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A guild is not a building. {actor} spends the last of the waiting working out which of the people inside it the rest of them will not stand without.',
        onSuccess: {
          narrative: '{actor} comes back with the names that matter, and the company walks in knowing who they are walking in for.',
          reputationDelta: 0.07,
        },
        onFailure: {
          narrative: '{actor} gets the shape of it and not the substance. The company goes in against a hall full of strangers.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'confront_guild_falls.door',
        name: 'The Door',
        reach: 'shadow',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'They keep people on the door for exactly this. {actor} finds the way past them that does not begin with shouting.',
        onSuccess: {
          narrative: '{actor} has the company inside before the hall knows the door has been used, and the watch is behind them now instead of in front.',
          reputationDelta: 0.1,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The door does what a door is for. {actor} is seen, and the hall has as long as it takes to cross the yard.',
          reputationDelta: -0.07,
        },
      },
      {
        id: 'confront_guild_falls.hall',
        name: 'The Hall',
        reach: 'iron',
        difficulty: HARD_DIFFICULTY_BASE + HARD_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The whole thing comes down to a room and the people standing in it. {actor} goes at the ones whose names they came for.',
        onSuccess: {
          narrative: '{actor} takes the hall, and what the guild was is now a building and some furniture. The people who made it what it was are not standing in it.',
          reputationDelta: 0.2,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.4, condition: 0.3, bestowed_power: 0.3 },
          },
        },
        onFailure: {
          narrative: 'The hall holds. {actor} gets the company back out through the door they came in by, and the guild will know exactly whose company it was.',
          reputationDelta: -0.14,
        },
      },
    ],
  },
  {
    id: 'encounter.confront_standoff',
    name: 'The Standoff',
    locationTypes: ['hamlet', 'town', 'city', 'camp', 'farmland', 'ruins', 'ruined_village', 'ancient_road', 'oasis', 'unexplored_poi'],
    reachPrimary: 'gold',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    actorAffinities: ['group'],
    minGroupMembers: 2,
    requiresOpposingBand: true,
    // The non-lethal rung. Conflict at this scale should not only ever be
    // slaughter, so a decisive loss here costs cohesion and standing and takes
    // nobody's life — see `contestNonLethal` on the template type.
    contestNonLethal: true,
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'confront_standoff.line',
        name: 'The Line',
        reach: 'iron',
        difficulty: MODERATE_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Nobody has drawn anything yet. {actor} steps out where the other side can count the company properly, and lets them.',
        onSuccess: {
          narrative: '{actor} stands where they can be counted and does not shift, and the arithmetic on the other side comes up short.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{actor} steps out and the company does not come with them cleanly. What the other side counts is a company that is not sure.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'confront_standoff.word',
        name: 'The Word',
        reach: 'gold',
        difficulty: MODERATE_DIFFICULTY_BASE + MODERATE_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Somebody has to say the thing that lets the other side leave. {actor} finds a way to say it that does not sound like mercy.',
        onSuccess: {
          narrative: '{actor} gives them the road and they take it. Both companies walk off the field on their own feet.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{actor} says it wrong, or says it to the wrong one. The other side holds the ground and the company backs off first.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // Borderland encounters migrated to UnifiedActionTemplate (THR-107) —
  // now spread into UNIFIED_ACTION_TEMPLATES via unified-action-templates.ts.

];

export const ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = ENCOUNTER_TEMPLATES_RAW.map(toUnifiedTemplate);

// ─── Cultural Encounter Overlays ───────────────────────────────────

/**
 * 6 cultural vocabulary sets that modify step prose generation
 * without changing the underlying structure. Each covers foundation
 * sphere affinities (chaos, order, light, darkness) plus key creation
 * spheres (force, mind).
 */
export const CULTURAL_ENCOUNTER_OVERLAYS: Record<
  string,
  {
    adjectives: string[];
    verbs: string[];
    atmosphere: string;
  }
> = {
  chaos: {
    adjectives: ['wild', 'untamed', 'feverish', 'whirling', 'fractured'],
    verbs: ['tears', 'shatters', 'erupts', 'cascades', 'splinters'],
    atmosphere: 'Reality bends under forces too vast to control or predict.',
  },
  order: {
    adjectives: ['measured', 'pristine', 'exact', 'geometrical', 'immaculate'],
    verbs: ['aligns', 'crystallizes', 'locks', 'settles', 'resolves'],
    atmosphere: 'Every element falls into place with inexorable precision.',
  },
  light: {
    adjectives: ['radiant', 'luminous', 'blazing', 'pure', 'clear'],
    verbs: ['blazes', 'burns', 'illuminates', 'cleanses', 'reveals'],
    atmosphere: 'Truth and clarity cast all shadows into retreat.',
  },
  darkness: {
    adjectives: ['shrouded', 'murky', 'shadowed', 'hidden', 'obsidian'],
    verbs: ['conceals', 'devours', 'suffocates', 'corrupts', 'obscures'],
    atmosphere: 'Mystery and danger lurk in every crevice and silence.',
  },
  force: {
    adjectives: ['violent', 'crushing', 'relentless', 'thunderous', 'merciless'],
    verbs: ['smashes', 'crushes', 'obliterates', 'overwhelms', 'annihilates'],
    atmosphere: 'Raw power manifests without mercy or restraint.',
  },
  mind: {
    adjectives: ['subtle', 'intricate', 'labyrinthine', 'profound', 'arcane'],
    verbs: ['unravels', 'deciphers', 'perceives', 'comprehends', 'calculates'],
    atmosphere: 'Intellect and pattern recognition become the only weapons.',
  },
};

// ─── Encounter Inspection Vignettes ────────────────────────────────
//
// Prose describing what a player/god observes when inspecting a location
// with active encounter activity, completed success, or failed attempt.

export const ENCOUNTER_INSPECTION_VIGNETTES = {
  inProgress: [
    'The air thrums with barely-contained trial. A figure moves through the test, strain evident in every breath and gesture. The outcome hangs unresolved.',
    'Ritual markers glow faintly on the ground, pulsing with the cadence of the encounter\'s progression. The candidate struggles forward, will against demand.',
    'The location crackles with sacred tension. An encounter is underway—the veil between triumph and ruin paper-thin here.',
    'Threads of consequence shimmer around the encounter. The outcome is not yet written; the candidate still pushes against their limit.',
    'The ground seems to hold its breath. An encounter unfolds—a test older than kingdoms, demanding payment in will or blood.',
    'Unresolved power coils in this place. The encounter is active; success is still possible, but the way is steep and uncertain.',
    'A figure stands at the threshold between trials, the encounter\'s weight pressing down. The next moment will reshape them or break them.',
    'The location is thick with challenge and determination. An encounter is being faced; the candidate is neither victor nor corpse—yet.',
    'Echoes of ancient tests linger here, now playing out again through a new candidate. The outcome remains suspended, waiting.',
    'The air smells of sweat and magic. An encounter is underway—hope and despair both possible in the next heartbeat.',
  ],
  completed: [
    'The location is serene now, the encounter\'s fire extinguished. A figure bears the marks of having passed through trial—scarred, changed, unmistakably stronger.',
    'This place remembers victory. The encounter has been completed; remnants of challenge still linger, but the candidate walks freely, bearing the weight of their triumph.',
    'A glow of completion rests upon this location. The encounter is finished; the candidate succeeded, and the land itself seems to acknowledge their new standing.',
    'The traces of trial have faded, leaving behind only the echo of a completed encounter. The candidate moves with the certainty of having endured and prevailed.',
    'This location holds the silence of finished trials. The encounter is complete; the candidate stands transformed, carrying proof of their passage in bearing and breath.',
  ],
  failed: [
    'The ground is scarred here, torn by an encounter that ended in defeat. The candidate retreated or was cast back; failure clings to this place like ash.',
    'Something is broken here—not just in stone and structure, but in the air itself. An encounter failed; the candidate was found wanting, and the trial\'s mercy is the only mercy they received.',
    'The location is hollow now, drained. An encounter was attempted and did not end in victory. The candidate bears the invisible marks of trial that broke them.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// ENCOUNTER SYSTEM CONNECTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Connections between encounters and other game systems: doom clock,
 * cultural forces, and rival god interference. These templates describe
 * how external forces shape or complicate an encounter's outcome.
 */
export interface EncounterSystemConnection {
  id: string;
  trigger: string;
  prose: string;
}

export const ENCOUNTER_SYSTEM_CONNECTIONS: {
  doom: EncounterSystemConnection[];
  culture: EncounterSystemConnection[];
  rival: EncounterSystemConnection[];
} = {
  doom: [
    {
      id: 'doom_intensification',
      trigger: 'Rising doom clock (>60%) intensifies encounter stakes',
      prose: 'The air thickens with dread. As doom rises, the encounter\'s weight compounds—{location} itself seems to turn hostile, magic warping under pressure. {actor} must not merely pass the trial but do so before the world\'s collapse becomes complete.',
    },
    {
      id: 'doom_corruption',
      trigger: 'High doom (>80%) corrupts encounter outcome',
      prose: 'The encounter has been touched by the approaching unmaking. Reality flickers here; success feels possible, but fragile. Even if {actor} prevails, the victory tastes ashen—tainted by knowledge that the world itself might not survive to remember {their} triumph.',
    },
    {
      id: 'doom_acceleration',
      trigger: 'Encounter completion (success or failure) accelerates doom by 5 ticks',
      prose: 'The {location} trembles as the encounter concludes. Whether {actor} triumphed or fell, the trial\'s conclusion sends ripples outward—the doom clock ticks faster, as if the world must compress its reckoning into dwindling moments.',
    },
  ],
  culture: [
    {
      id: 'culture_facilitation',
      trigger: 'Encounter\'s culture shares {actor}\'s cultural identity (>70% similarity)',
      prose: 'The encounter speaks {actor}\'s language. The rituals, the methods, the values tested here align with {their} own culture\'s traditions. {They} move through the trial with native grace—threads of {their} people\'s wisdom guide each step, making the impossible merely difficult.',
    },
    {
      id: 'culture_opposition',
      trigger: 'Encounter\'s culture opposes {actor}\'s cultural values (tension >0.6)',
      prose: 'The encounter demands something {actor}\'s culture forbids. Each test feels like a betrayal of {their} own people. {They} must choose between honoring the tradition and passing the trial—a choice that will mark {them} forever in the eyes of {their} kind.',
    },
    {
      id: 'culture_transformation',
      trigger: 'Success in culturally opposed encounter grants cultural trait',
      prose: 'By passing this encounter on foreign terms, {actor} is reforged. The culture of the trial seeps into {their} bones—{they} carry back not just triumph but a piece of something alien, woven now into {their} identity. {They} are no longer purely what {they} were.',
    },
  ],
  rival: [
    {
      id: 'rival_interference',
      trigger: 'Rival god opposes {actor}\'s sphere (faction conflict)',
      prose: '{actor} is not alone in the encounter. Phantom presence shadows every choice—a rival god, sensing vulnerability. The trial becomes a battleground; {actor} must overcome not just the encounter\'s design but the subtle corruption that seeks to twist success into ruin.',
    },
    {
      id: 'rival_corruption',
      trigger: 'Rival agent stationed in encounter location',
      prose: 'The encounter has been corrupted from within. A servant of a rival god moves through the trial\'s spaces, ready to tip the scales. {actor} must not only face the test but navigate {their} presence—and decide whether to confront {them} directly or move unseen.',
    },
    {
      id: 'rival_escalation',
      trigger: 'Encounter victory grants {rival god} 0.3 escalation in response',
      prose: 'As {actor} claims triumph, distant divine laughter echoes. A rival god recognizes the shift in power and rises to meet it. The victory is real—but {it} has been noticed, and the consequences ripple outward faster now. The game\'s stakes climb.',
    },
  ],
};

// ─── Narrative Resolver ──────────────────────────────────────────

/**
 * Resolve template placeholders in an encounter narrative string.
 *
 * Replaces {actor}, {adj}, {verb}, {verb}s, {themselves}, {their},
 * {them}, {They}, {they}, {action}, {noun}, {target}, {it}.
 *
 * Multiple occurrences of {adj} in the same string get different adjectives
 * by cycling through the pool with an incrementing offset.
 *
 * **The word-pool half of this now lives in `encounter-words.ts` (THR-1036),** because
 * this function had zero callers while `enrichProse()` — the path that actually renders
 * encounter prose — did not know the tokens, so all 153 templates using them leaked raw
 * `{adj}` / `{verb}s` to the player. The pools moved to a shared module rather than being
 * duplicated; this signature is unchanged and delegates.
 */
export function resolveEncounterNarrative(
  narrative: string,
  actorName: string,
  stepId: string,
  threatRating: string = 'moderate',
): string {
  let text = narrative;

  // Replace {actor} globally
  text = text.replace(/\{actor\}/g, actorName);

  // Replace pronouns
  text = text.replace(/\{themselves\}/g, 'themselves');
  text = text.replace(/\{their\}/g, 'their');
  text = text.replace(/\{them\}/g, 'them');
  text = text.replace(/\{They\}/g, 'They');
  text = text.replace(/\{they\}/g, 'they');
  text = text.replace(/\{it\}/g, 'it');

  // Replace {target} with generic (no target context in display)
  text = text.replace(/\{target\}/g, 'their opponent');

  return resolveWordPoolTokens(text, stepId, encounterToneTierForThreat(threatRating));
}

// ─── Lookup Functions ───────────────────────────────────────────

/**
 * Return all encounters available at a given location type.
 */
export function getEncountersByLocationType(locationType: string): UnifiedActionTemplate[] {
  return ENCOUNTER_TEMPLATES.filter(encounter =>
    encounter.locationSubtypes?.includes(locationType as LocationSubtype)
  );
}

/**
 * Get encounter templates that match a sublocation's type.
 * Templates with sublocation entries in locationSubtypes are matched against the sublocation type ID.
 * Templates without sublocation entries use locationSubtypes for fallback (locationTypes).
 */
export function getEncountersBySublocationAndLocation(
  sublocationTypeId: string,
  locationType: string,
): UnifiedActionTemplate[] {
  return ENCOUNTER_TEMPLATES.filter(t => {
    const hasSublocation = t.locationSubtypes?.some(s => s.startsWith('sublocation-type.'));
    if (hasSublocation) {
      return t.locationSubtypes?.includes(sublocationTypeId as LocationSubtype);
    }
    return t.locationSubtypes?.includes(locationType as LocationSubtype);
  });
}

/**
 * Return all encounters available at a location, including those that target
 * sublocation types present at that location subtype.
 * Use this when building the full encounter list for a location view.
 */
export function getEncountersForLocation(
  locationType: string,
  sublocationTypeIds: string[],
): UnifiedActionTemplate[] {
  return ENCOUNTER_TEMPLATES.filter(t => {
    const hasSublocation = t.locationSubtypes?.some(s => s.startsWith('sublocation-type.'));
    if (hasSublocation) {
      return t.locationSubtypes?.some(st => sublocationTypeIds.includes(st));
    }
    return t.locationSubtypes?.includes(locationType as LocationSubtype);
  });
}

/**
 * Retrieve a specific encounter by ID (exploration templates only).
 */
export function getEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ENCOUNTER_TEMPLATES.find(encounter => encounter.id === id);
}

/**
 * Retrieve any encounter by ID — checks exploration templates first,
 * then social/faction/mercenary/army/monster/borderland/secret templates.
 * Use this everywhere an encounter might be any type (resolution, advancement, display).
 */
export function getAnyEncounterById(id: string): UnifiedActionTemplate | undefined {
  return ENCOUNTER_TEMPLATES.find(encounter => encounter.id === id)
    ?? getSocialEncounterById(id)
    ?? getFactionEncounterById(id)
    ?? getMercenaryEncounterById(id)
    ?? getArmyEncounterById(id)
    ?? getMonsterEncounterById(id)
    ?? getBorderlandEncounterById(id)
    ?? SECRET_DISCOVERY_ENCOUNTER_TEMPLATES.find(encounter => encounter.id === id);
}
