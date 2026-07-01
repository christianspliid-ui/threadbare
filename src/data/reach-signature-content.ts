/**
 * Reach Signature Content — sphere-power scaling constants.
 *
 * The general "most divine actions scale effect + cost with sphere power" tunables.
 * Reusable, not signature-specific (Christian, 2026-06-30) — reach signatures and any
 * other sphere-gated effect compose against these.
 *
 * THR-548 seeded the file with the sphere-power scaling constants. THR-549 adds
 * the SignatureMatrix / individualization layer below — the (reach × sphere)
 * resolver every reach signature composes against.
 *
 * Plan: Docs/plans/2026-06-30-ascendant-reach-signatures.md §3.2, §3.3, §3.8, §2
 */

import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { CreationSphereName } from '../types/index';
import { CREATION_SPHERE_NAMES } from '../types/index';
import type { AttachmentEffect } from '../types/effects';
import { SPHERE_EFFECT_TABLE } from '../engine/ascendantPrimitives';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { TargetCategory } from '../types/targetContext';
import { GREAT_WORK_ARTIFACT_TIER } from './game-config';

// ─── Sphere-Power Scaling (NFP #1: Tunability) ────────────────────

/**
 * Effect/cost multiplier at sphere score 0 — actions at no sphere mastery.
 * Below 1.0: a weak-sphere action produces a diminished effect (but cost is floored
 * at base by `scaledCost`, so low power is never a discount).
 */
export const SIGNATURE_SCALE_FLOOR = 0.6;

/**
 * Effect/cost multiplier at MAX_SPHERE_SCORE — actions at full sphere mastery.
 * Above 1.0: a maxed-sphere action produces a larger effect at a higher cost.
 */
export const SIGNATURE_SCALE_CEIL = 2.0;

// ═══════════════════════════════════════════════════════════════════════════
// Reach-Signature Individualization (THR-549)
//
// A reach signature is the ascendant's headline divine action for a Reach. The
// *individualization layer* makes a signature read differently per Creation
// Sphere: same Reach, different primary Sphere → a distinct name, prose, and a
// unique twist on the effect. The (reach × primarySphere) pair is fixed for a
// run under the two-domain lock (every ascendant has exactly one primary +
// one secondary reach, see project_ascendant_two_domains), so the cell a player
// lands on MUST always produce a real signature — never an empty card. That is
// the correctness property this layer guarantees via a composed default per
// reach: bespoke cells are authored later (THR-550..552 + content issues),
// every un-authored cell still resolves to a non-null individualization.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The individualization bar (Christian, 2026-06-30): a signature is genuinely
 * *individual* only when it carries BOTH a named effect with numbers AND a
 * unique trigger — not merely a bigger version of a generic card. SphereTwistSpec
 * is exactly that delta: the part that distinguishes a (reach × sphere) cell
 * from its reach's composed default.
 */
export interface SphereTwistSpec {
  /** Stable id, e.g. `signature.iron.force`. Used for traces + prose enrichment. */
  readonly id: string;
  /**
   * The unique trigger/condition half of the bar — the part that is *not* just
   * "bigger numbers". A prose-grade description of when the twist fires; the
   * runtime predicate (`when?: EffectPredicate`) is wired by the per-signature
   * effect issues (THR-550..552). This data layer only declares the intent.
   */
  readonly trigger: string;
  /**
   * The named-effect-with-numbers half of the bar — the payload delta layered on
   * top of the reach base. Generic effects so any signature card can apply them.
   */
  readonly payload: readonly AttachmentEffect[];
}

/**
 * One (reach × sphere) signature cell: the twist plus the cosmetic
 * individualization (name fragment woven into the card title, prose enrichment
 * key). Resolved via {@link resolveSignatureIndividualization}.
 */
export interface SignatureIndividualization {
  readonly twist: SphereTwistSpec;
  /** Woven into the signature card's display name (e.g. "Warhost of Force"). */
  readonly nameFragment: string;
  /** Enrichment lookup key for the prose pipeline. */
  readonly proseKey: string;
}

/**
 * The sparse authored matrix. Bespoke per-cell content lands in the authoring
 * issues; every empty cell falls back to {@link composeDefaultSignature}. Kept
 * a full `Record<ReachDomain, …>` (all eight reaches present, values empty) so
 * the resolver's reach lookup is always defined.
 */
export type SignatureMatrix = Record<ReachDomain, Partial<Record<CreationSphereName, SignatureIndividualization>>>;

/**
 * Base value for a composed-default signature's reach passive (NFP #1). Bespoke
 * cells override with their own authored numbers; this is the floor a default
 * card delivers so it is never mechanically empty.
 */
export const SIGNATURE_DEFAULT_BASE_VALUE = 3;

/**
 * Reach-base passive value for a bespoke (reach × primary-sphere) signature cell
 * (NFP #1). Higher than {@link SIGNATURE_DEFAULT_BASE_VALUE}: the headline
 * intersection of a reach with its own Creation Sphere is the ascendant's most
 * individual cell (the "bespoke veneer", THR-555), so it hits harder than a
 * composed default. Bespoke cells are exempt from the default's floor assertion.
 */
export const SIGNATURE_BESPOKE_BASE_VALUE = 5;

/** Per-reach default name stem, prose stem, and characteristic trigger phrase. */
interface ReachSignatureDefault {
  /** Name stem; the sphere is appended ("{stem} of {Sphere}"). */
  readonly nameStem: string;
  /** Prose-key stem; the sphere is appended ("{stem}.{sphere}"). */
  readonly proseStem: string;
  /** The reach's characteristic activation condition (the default's trigger). */
  readonly trigger: string;
}

/**
 * The composed-default seed per reach. Eight entries — one per ReachDomain — so
 * every reach has a non-null default. Name stems echo the reach flavor used by
 * CHOSEN_POWER_TABLE (ascendantPrimitives) and the authored signatures
 * (THR-550 Iron/Warhost, THR-551 Veil/Rend-the-Gate, THR-552 Stone/Great-Work).
 */
export const REACH_SIGNATURE_DEFAULTS: Record<ReachDomain, ReachSignatureDefault> = {
  iron: {
    nameStem: 'Warhost',
    proseStem: 'signature.iron.default',
    trigger: 'when the chosen faction enters or escalates a conflict',
  },
  gold: {
    nameStem: 'Charter',
    proseStem: 'signature.gold.default',
    trigger: 'when the target accrues, trades, or invests wealth',
  },
  shadow: {
    nameStem: 'Veiled Hand',
    proseStem: 'signature.shadow.default',
    trigger: 'when the action passes unobserved',
  },
  veil: {
    nameStem: 'Rent Gate',
    proseStem: 'signature.veil.default',
    trigger: 'at a boundary between planes or hidden places',
  },
  heart: {
    nameStem: 'Hallowed Creed',
    proseStem: 'signature.heart.default',
    trigger: 'when devotion is professed or a bond deepens',
  },
  eye: {
    nameStem: 'Revelation',
    proseStem: 'signature.eye.default',
    trigger: 'when knowledge is revealed or a secret uncovered',
  },
  stone: {
    nameStem: 'Great Work',
    proseStem: 'signature.stone.default',
    trigger: 'when something enduring is built or fortified',
  },
  star: {
    nameStem: 'Fated Decree',
    proseStem: 'signature.star.default',
    trigger: 'when fate turns or an omen is read',
  },
};

/**
 * Authored matrix. All reaches present; the three engine-backed signatures
 * (THR-555) carry a bespoke cell at their reach × *primary* Creation Sphere —
 * the highest-value intersection under the two-domain lock (REACH_TO_SPHERE:
 * iron→force, veil→mind, stone→matter). Every other cell falls back to
 * {@link composeDefaultSignature}. The bespoke twist is the individualization
 * bar: an authored trigger + a richer reach base ({@link SIGNATURE_BESPOKE_BASE_VALUE})
 * layered with the sphere-flavored passive, plus a distinct name + prose key.
 */
export const SIGNATURE_MATRIX: SignatureMatrix = {
  iron: {
    // The muster that answers before the banner is even raised — force made loyal.
    force: {
      twist: {
        id: 'signature.iron.force',
        trigger: 'when the host first takes the field, or a rival banner rises against it',
        payload: [
          { type: 'passive', reach: 'iron', value: SIGNATURE_BESPOKE_BASE_VALUE },
          ...(SPHERE_EFFECT_TABLE.force ?? []),
        ],
      },
      nameFragment: 'Warhost of the Unbroken Line',
      proseKey: 'signature.iron.force',
    },
  },
  gold: {},
  shadow: {},
  veil: {
    // The gate torn onto thought itself — every secret on the far side laid bare.
    mind: {
      twist: {
        id: 'signature.veil.mind',
        trigger: 'while the rift stands open over a place of learning, memory, or secrets',
        payload: [
          { type: 'passive', reach: 'veil', value: SIGNATURE_BESPOKE_BASE_VALUE },
          ...(SPHERE_EFFECT_TABLE.mind ?? []),
        ],
      },
      nameFragment: 'The Unshuttered Gate',
      proseKey: 'signature.veil.mind',
    },
  },
  heart: {},
  eye: {},
  stone: {
    // A work of matter so true it forgets how to fall — the forge that outlasts the age.
    matter: {
      twist: {
        id: 'signature.stone.matter',
        trigger: 'when the Great Work is raised, and again each age it stands unbroken',
        payload: [
          { type: 'passive', reach: 'stone', value: SIGNATURE_BESPOKE_BASE_VALUE },
          ...(SPHERE_EFFECT_TABLE.matter ?? []),
        ],
      },
      nameFragment: 'The Imperishable Forge',
      proseKey: 'signature.stone.matter',
    },
  },
  star: {},
};

/** Title-case a lowercase sphere name for display ("force" → "Force"). */
function titleCaseSphere(sphere: CreationSphereName): string {
  return sphere.charAt(0).toUpperCase() + sphere.slice(1);
}

/**
 * Build a composed-default individualization for a reach × sphere pair when no
 * bespoke cell is authored. Composes against the shipped `sphere_flavored_effect`
 * primitive (THR-509): the reach's base passive plus the sphere's flavored
 * passive when {@link SPHERE_EFFECT_TABLE} carries one. Creation spheres without
 * a table entry (`time`, `entropy`) still yield a real payload from the reach
 * base alone — so the result is never mechanically empty.
 *
 * Pure + deterministic (no PRNG, no graph): same inputs → same individualization.
 */
export function composeDefaultSignature(
  reach: ReachDomain,
  sphere: CreationSphereName,
): SignatureIndividualization {
  const base = REACH_SIGNATURE_DEFAULTS[reach];
  const basePayload: AttachmentEffect = { type: 'passive', reach, value: SIGNATURE_DEFAULT_BASE_VALUE };
  // CreationSphereName ⊂ SphereName, so the table lookup is well-typed; `time`
  // and `entropy` simply have no entry → spherePayload is empty.
  const spherePayload = SPHERE_EFFECT_TABLE[sphere] ?? [];
  return {
    twist: {
      id: `${base.proseStem}.${sphere}`,
      trigger: base.trigger,
      payload: [basePayload, ...spherePayload],
    },
    nameFragment: `${base.nameStem} of ${titleCaseSphere(sphere)}`,
    proseKey: `${base.proseStem}.${sphere}`,
  };
}

/**
 * Resolve the signature individualization for a reach × primary-sphere pair.
 * Returns the bespoke authored cell when present, otherwise a composed default.
 * Guaranteed non-null for every (ReachDomain × CreationSphereName) pair — the
 * never-an-empty-card correctness property under the two-domain lock.
 */
export function resolveSignatureIndividualization(
  reach: ReachDomain,
  primarySphere: CreationSphereName,
): SignatureIndividualization {
  return SIGNATURE_MATRIX[reach]?.[primarySphere] ?? composeDefaultSignature(reach, primarySphere);
}

/** All ReachDomains — re-exported for consumers iterating the signature space. */
export { REACH_DOMAINS };
/** All Creation Sphere names — re-exported for consumers iterating the matrix. */
export { CREATION_SPHERE_NAMES };

// ═══════════════════════════════════════════════════════════════════════════
// Content-only reach signatures (THR-553)
//
// The five reach signatures that sit ENTIRELY on shipped primitives/effects —
// pure content authoring, no new engine effect (plan §3.7, §4.1). Gold & Heart
// compose the shipped sustained `ControlSpec` path (perTickIncome / co-located
// thread aura); Shadow, Star & Eye compose shipped `EncounterAftermathReaction`
// effect kinds (`hidden_mark`, `intelligence`, `encounter_seed`, `spawn_clue`)
// on `aftermathConfig.fallback.reactions`.
//
// The engine-backed signatures (Iron `signature_warhost`, Veil
// `sphere_influence_amplify`, Stone `spawn_unique_location`) are THR-555. The
// `ASCENDANT_ACTION_BUCKETS` reach-gated entries + acquisition beats are THR-523
// (plan §4.3–§4.4) — NOT authored here. These templates are made reach-gated by
// the shipped `requiresReach` field (THR-503): `getTargetActionSlots()` hides a
// card unless the ascendant holds that reach.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Signature constants (NFP #1: Tunability, plan §3.8) ──────────────────────

/**
 * One-time essence base cost per reach signature, pre-sphere-scale. Higher than
 * the generic expression verbs (imbue 4, anoint 6) — a signature is the headline
 * reach-gated power of an identity. The runtime multiplies this by
 * {@link spherePowerMultiplier} (floored at 1× for cost) so a strong-sphere god
 * pays more for a more dramatic effect; the template carries the base.
 */
export const SIGNATURE_BASE_COST: Record<ReachDomain, number> = {
  iron: 8, gold: 8, shadow: 8, veil: 8, heart: 8, eye: 8, stone: 8, star: 8,
};

/**
 * Gold — Patronage Network. Per-tick `order`-sphere essence the sustained
 * patronage control yields (the economic snowball). Net positive: the control
 * carries no per-tick drain, so a patronage network is a standing income engine
 * until a rival contests the site.
 */
export const PATRONAGE_INCOME_PER_TICK = 0.15;

/**
 * Shadow — Broker's Web. Severity (0–1) of the concealed-operation `hidden_mark`
 * the web plants, and the reliability (0–1) of the `agent_network` intelligence
 * it yields to the god. Mid-severity: a real, revealable covert footprint that a
 * later investigation encounter can surface.
 */
export const BROKERS_WEB_MARK_SEVERITY = 0.5;
export const BROKERS_WEB_INTEL_RELIABILITY = 0.8;

/**
 * Star — Beacon of Fate. `encounter_seed.delayTicks` for the fated quest the
 * beacon lights (plan §3.8) — a short delay so the long-distance call resolves
 * within a play arc rather than a distant future.
 */
export const BEACON_QUEST_DELAY = 6;

/**
 * Eye — The Deep Eye. Precision of the `spawn_clue` the Deep Eye grants toward
 * the elder layer (plan §3.8: the sharpest band), and the reliability of the
 * `cultural_knowledge` intelligence it reveals.
 */
export const DEEP_EYE_CLUE_PRECISION = 'located' as const;
export const DEEP_EYE_INTEL_RELIABILITY = 0.85;

/**
 * Heart — Sworn Oath (stub). Per-tick loyalty magnitude of the
 * `co_located_thread_aura` the oath radiates over its site (plan §3.8). Reuses
 * the shipped THR-509 aura primitive (same field as consecrate's faith-spread —
 * advancing every co-located thread's tier-promotion clock). The full retinue is
 * deferred (Heart Deferral, plan §10).
 */
export const SWORN_OATH_LOYALTY_PER_TICK = 0.02;

// ─── The five content-only signature templates (plan §3.7) ────────────────────
//
// `faction` is not a `TargetCategory` literal (it is 'actor' | 'location' |
// 'sublocation' | 'hex' | 'artifact' | 'artifact_legendary' | 'resource'), so a
// faction-targeting template casts, matching the shipped `action.anoint` idiom.
const FACTION_TARGET = ['faction'] as unknown as readonly TargetCategory[];

// ─── Engine-backed signatures (THR-555): sentinels + constants ────────────────
//
// The three engine-backed reach signatures (Iron / Warhost, Veil / Rend the
// Gate, Stone / The Great Work) consume the aftermath effect kinds shipped by
// THR-550/551/552 (`signature_warhost`, `sphere_influence_amplify`,
// `spawn_unique_location`). Those resolvers read a literal id off the effect, so
// a static template declares a sentinel here and the aftermath dispatch binds it
// to the card's resolved target at fire time (`bindReachSignatureTargets` in
// `encounterAftermath.ts`) — mirroring the shipped `$target` idiom the step-level
// imbue / anoint ops already use. Kept in the content layer (not the engine) so
// `encounterAftermath.ts` → here is a one-way import, no cycle.

/** Bind an effect's target-id field to the card's resolved `action.targetId`. */
export const AFTERMATH_TARGET_SENTINEL = '$target';

/**
 * Bind a rift's amplified sphere to the *caster's* primary Creation Sphere. A
 * static Veil template cannot know which sphere the ascendant leads with, but the
 * rift is meant to amplify the ascendant's own primary (§ effect doc: "set to the
 * ascendant's primary Creation Sphere, so individualization is intrinsic").
 */
export const AFTERMATH_PRIMARY_SPHERE_SENTINEL = '$primary';

/**
 * Run-unique tag for the Stone / Great Work location (NFP #1). One location
 * carrying this tag exists per run — the `spawn_unique_location` resolver dedups
 * on it, so a second cast is a no-op. A single tag ⇒ one Great Work per game.
 */
export const GREAT_WORK_UNIQUE_TAG = 'ascendant.great_work';

export const REACH_SIGNATURE_CONTENT_TEMPLATES: UnifiedActionTemplate[] = [
  // ─── Gold — Patronage Network ───────────────────────────────────────────────
  // Sustained ControlSpec that yields per-tick essence (the economic snowball).
  // Reuses the shipped sustained-control path end-to-end (spawnControlEffect
  // resolves the target settlement's hex; phaseControlEffects pays out income).
  {
    id: 'invest.gold.patronage_network',
    name: 'Patronage Network',
    spellName: 'The Golden Charter',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    description:
      'You weave your regard through a settlement\'s ledgers and loyalties until wealth ' +
      'itself learns to flow toward your design. Every deal struck beneath your patronage ' +
      'returns a tithe of its prosperity to you — a standing engine of essence for as long ' +
      'as the network holds.',
    reach: 'gold',
    requiresReach: 'gold',
    trayTier: 'rare',
    crudType: 'update',
    scale: 'regional',
    steps: [{
      reach: 'gold',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: SIGNATURE_BASE_COST.gold,
    actorAffinities: ['ascendant'],
    targetCategories: ['location'],
    targetSubtypes: ['settlement'],
    motivations: ['asceticism_extravagance', 'loyalty_ambition'],
    durationMode: 'sustained',
    controlSpec: {
      // A patronage network is a net-income engine: no essence drain, a steady
      // per-tick `order`-sphere yield (structured wealth — charters, trade, tithe).
      perTickCost: {},
      perTickIncome: { order: PATRONAGE_INCOME_PER_TICK },
      narrativeTemplates: {
        established: 'the network takes hold — coin and favour begin to bend toward your design',
        active: 'the patronage holds — a steady tithe of the settlement\'s prosperity flows up to you',
        lapsed: 'the network unravels; the ledgers forget your name and the flow of coin runs dry',
      },
    },
    narrativeTemplates: {
      initiation: 'weaves a patronage network through the settlement\'s ledgers and loyalties',
      success: 'the network is woven — prosperity itself now returns a tithe to your design',
      failure: 'the network will not hold; the settlement\'s wealth slips through your regard',
    },
  },
  // ─── Shadow — Broker's Web ───────────────────────────────────────────────────
  // Information asymmetry + covert nudging. On success the aftermath offers to
  // establish the web: a concealed-operation `hidden_mark` (a revealable covert
  // footprint) plus `agent_network` intelligence granted to the god (the web's
  // informants map the faction). Both are shipped `EncounterAftermathReaction`
  // effect kinds; the reaction surfaces via `aftermathConfig.fallback`.
  {
    id: 'invest.shadow.brokers_web',
    name: "Broker's Web",
    spellName: 'The Whispering Ledger',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    description:
      'You spin a lattice of informants and quiet debts through a faction until its secrets ' +
      'run to you like water downhill. What the faction whispers, you hear; what it hides, you ' +
      'hold — a concealed hand on the levers no one knows to look for.',
    reach: 'shadow',
    requiresReach: 'shadow',
    trayTier: 'rare',
    crudType: 'update',
    scale: 'regional',
    steps: [{
      reach: 'shadow',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: SIGNATURE_BASE_COST.shadow,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'darkness',
    targetCategories: FACTION_TARGET,
    motivations: ['honesty_cunning', 'loyalty_ambition'],
    narrativeTemplates: {
      initiation: 'spins a web of informants and quiet debts through the faction',
      success: 'the web is spun — the faction\'s secrets now run to you unseen',
      failure: 'the web tears; the faction\'s confidences stay beyond your reach',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The lattice is laid. Threads of obligation and rumour now run from the faction\'s ' +
          'quietest rooms to your hand.',
        changes: [],
        reactionPrompt: 'The web is spun. Decide what you draw from it now.',
        reactions: [
          {
            id: 'brokers_web_establish',
            label: 'Draw the threads tight.',
            intent:
              'Consolidate the informant lattice: plant a concealed covert footprint on the ' +
              'operation and take in the faction\'s network of contacts as usable intelligence.',
            effects: [
              {
                kind: 'hidden_mark' as const,
                category: 'concealed_action' as const,
                severity: BROKERS_WEB_MARK_SEVERITY,
                label: 'A broker\'s web of informants and quiet debts, run unseen through the faction',
                revealFamilies: ['investigation', 'shadow', 'faction'],
              },
              {
                kind: 'intelligence' as const,
                category: 'agent_network' as const,
                label: 'The faction\'s informant network',
                detail:
                  'A map of who carries word for whom inside the faction — the couriers, the ' +
                  'quiet debts, the rooms where its secrets are kept.',
                reliability: BROKERS_WEB_INTEL_RELIABILITY,
              },
            ],
          },
        ],
      },
    },
  },
  // ─── Star — Beacon of Fate ───────────────────────────────────────────────────
  // Long-distance influence; breaks locality. On success the aftermath lights the
  // beacon: an `encounter_seed` planting a fated quest at a short delay
  // (BEACON_QUEST_DELAY). The "ranged reach-bonus" half of the §3.7 skeleton is a
  // sphere/reach passive that belongs to the individualization layer (matrix) and
  // the engine-backed scaling pass; the content-only card ships the shipped
  // `encounter_seed` core here (no new engine effect).
  {
    id: 'invest.star.beacon_of_fate',
    name: 'Beacon of Fate',
    spellName: 'The Far Light',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    description:
      'You kindle a light that no distance can dim and set it in a mortal\'s path, far beyond ' +
      'your usual reach. Fate bends toward the beacon: a calling takes shape around them, and ' +
      'the road they did not know they were on begins to open.',
    reach: 'star',
    requiresReach: 'star',
    trayTier: 'rare',
    crudType: 'update',
    scale: 'cosmic',
    steps: [{
      reach: 'star',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: SIGNATURE_BASE_COST.star,
    actorAffinities: ['ascendant'],
    targetCategories: ['actor'],
    motivations: ['sacrifice_survival', 'tradition_novelty'],
    narrativeTemplates: {
      initiation: 'kindles a beacon of fate in a distant mortal\'s path',
      success: 'the far light catches — a fated calling begins to take shape around them',
      failure: 'the light gutters out before it can catch; fate holds its course',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The beacon is lit. Far off, a mortal lifts their head toward a light they cannot ' +
          'name, and the shape of a calling gathers around them.',
        changes: [],
        reactionPrompt: 'The beacon burns. Let fate answer it.',
        reactions: [
          {
            id: 'beacon_of_fate_seed_quest',
            label: 'Set the calling in motion.',
            intent:
              'Let the beacon draw a fated quest toward the one it lights — a road that opens ' +
              'for them a few turns hence.',
            effects: [
              {
                kind: 'encounter_seed' as const,
                encounterFamily: 'fate.quest',
                delayTicks: BEACON_QUEST_DELAY,
                priority: 1.2,
                seedLabel: 'A fated calling answers the beacon',
              },
            ],
          },
        ],
      },
    },
  },
  // ─── Eye — The Deep Eye ──────────────────────────────────────────────────────
  // Discovery/understanding of the elder layer. On success the aftermath opens
  // the Deep Eye: `cultural_knowledge` intelligence granted to the god (the Eye
  // reads the region's deep memory) plus a `spawn_clue` toward the nearest ruin
  // at the sharpest precision (DEEP_EYE_CLUE_PRECISION). Both shipped effect kinds.
  {
    id: 'invest.eye.deep_eye',
    name: 'The Deep Eye',
    spellName: 'The Unclouded Sight',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    description:
      'You open an eye that sees past the surface of a place into the strata beneath it — the ' +
      'buried memory of a people, the elder work half-swallowed by the earth. What was lost to ' +
      'the age becomes legible to you, and a path toward it takes shape.',
    reach: 'eye',
    requiresReach: 'eye',
    trayTier: 'rare',
    crudType: 'read',
    scale: 'regional',
    steps: [{
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: SIGNATURE_BASE_COST.eye,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'mind',
    targetCategories: ['location'],
    motivations: ['revelation_discretion', 'tradition_novelty'],
    narrativeTemplates: {
      initiation: 'opens the Deep Eye upon the strata beneath this place',
      success: 'the sight comes unclouded — the region\'s buried memory becomes legible to you',
      failure: 'the depths stay dark; the elder layer keeps its silence',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The Deep Eye opens. The region\'s buried strata lie legible before you, and a path ' +
          'toward the elder work half-swallowed by the earth begins to clear.',
        changes: [],
        reactionPrompt: 'The sight is yours. Follow where it leads.',
        reactions: [
          {
            id: 'deep_eye_reveal',
            label: 'Read the deep memory.',
            intent:
              'Take in the region\'s elder-layer knowledge and let the sight sharpen into a ' +
              'located path toward the nearest buried work.',
            effects: [
              {
                kind: 'intelligence' as const,
                category: 'cultural_knowledge' as const,
                label: 'The elder memory of this region',
                detail:
                  'The buried history of the people who held this land before — their rites, ' +
                  'their ruins, the shape of what they left half-swallowed by the earth.',
                reliability: DEEP_EYE_INTEL_RELIABILITY,
              },
              {
                kind: 'spawn_clue' as const,
                source: 'library_research' as const,
                precision: DEEP_EYE_CLUE_PRECISION,
                targetRuinId: '$nearest_ruin',
              },
            ],
          },
        ],
      },
    },
  },
  // ─── Heart — Sworn Oath (stub) ───────────────────────────────────────────────
  // Devoted inner circle (full retinue deferred, plan §10). A sustained
  // ControlSpec whose `perTickThreadAuras` radiate loyalty over a site — reuses
  // the shipped THR-509 co_located_thread_aura primitive exactly (same default
  // field as consecrate's faith-spread: advancing every co-located thread's
  // tier-promotion clock, here read as deepening devotion).
  {
    id: 'invest.heart.sworn_oath',
    name: 'Sworn Oath',
    spellName: 'The Binding Word',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    description:
      'You lay a binding word upon a place and all who keep faith within it, and the oath ' +
      'answers. Those bound to you who gather here are drawn steadily deeper into your service — ' +
      'a devoted inner circle taking shape around the ground you have claimed.',
    reach: 'heart',
    requiresReach: 'heart',
    trayTier: 'rare',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: SIGNATURE_BASE_COST.heart,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'spirit',
    targetCategories: ['location'],
    motivations: ['loyalty_ambition', 'tradition_novelty'],
    durationMode: 'sustained',
    controlSpec: {
      perTickCost: { spirit: PATRONAGE_INCOME_PER_TICK },
      // Loyalty aura: each tick, deepen every co-located thread's bond (the
      // shipped co_located_thread_aura, default `ticksAtCurrentTier` field).
      perTickThreadAuras: [{ magnitude: SWORN_OATH_LOYALTY_PER_TICK }],
      narrativeTemplates: {
        established: 'the oath is sworn — the ground holds your binding word',
        active: 'the oath holds — the faithful who gather here are drawn deeper into your service',
        lapsed: 'the binding word fails; the oath loosens and the circle drifts apart',
      },
    },
    narrativeTemplates: {
      initiation: 'lays a binding oath upon this place and all who keep faith within it',
      success: 'the oath is sworn — a devoted inner circle begins to take shape around the ground',
      failure: 'the word will not bind; the oath falls silent',
    },
  },
  // ─── Iron — Warhost (engine-backed, THR-555) ────────────────────────────────
  // Consumes the shipped `signature_warhost` aftermath effect (THR-550): mobilize
  // the target faction and raise a force on the army node form, strength
  // sphere-scaled (THR-548) inside the resolver. The step also anoints the faction
  // a chosen banner (the shipped `anoint_faction` op → `chosen_status_grant`
  // primitive, THR-509/513), so the muster rallies under the ascendant's mark.
  {
    id: 'invest.iron.warhost',
    name: 'Warhost',
    spellName: 'The Call to Arms',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    description:
      'You reach into a faction\'s marrow and wake the old hunger for war. Banners you never sewed ' +
      'rise in your name; blades you never forged are drawn toward a cause suddenly, terribly clear. ' +
      'An army musters where a moment ago there was only a people — and it musters for you.',
    reach: 'iron',
    requiresReach: 'iron',
    trayTier: 'rare',
    crudType: 'update',
    scale: 'regional',
    steps: [{
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      // Mark the faction a chosen banner (shipped anoint_faction → chosen_status_grant).
      onSuccess: [{ op: 'anoint_faction', nodeId: '$target' }],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: SIGNATURE_BASE_COST.iron,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'force',
    targetCategories: FACTION_TARGET,
    motivations: ['mercy_ruthlessness', 'loyalty_ambition'],
    narrativeTemplates: {
      initiation: 'wakes the old hunger for war in the faction\'s marrow',
      success: 'the muster answers — an army rises under your banner',
      failure: 'the call goes unanswered; no host gathers to your name',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The faction is roused. Somewhere a horn sounds that no living hand lifted, and the first ' +
          'of the host begins to gather beneath your mark.',
        changes: [],
        reactionPrompt: 'The people are willing. Decide what you make of them.',
        reactions: [
          {
            id: 'warhost_muster',
            label: 'Sound the muster.',
            intent:
              'Raise the faction as a warhost — mobilize it for conflict and gather a force under a ' +
              'chosen commander, its strength swelling with the reach you pour into it.',
            effects: [
              { kind: 'signature_warhost' as const, factionId: AFTERMATH_TARGET_SENTINEL },
            ],
          },
        ],
      },
    },
  },
  // ─── Veil — Rend the Gate (engine-backed, THR-555) ──────────────────────────
  // Consumes the shipped `sphere_influence_amplify` aftermath effect (THR-551): a
  // sustained rift at the target location amplifying the ascendant's *primary*
  // Creation Sphere each tick (bound at fire time via $primary), with a seeded
  // chaos-pulse downside. Magnitude, cost, and leak chance all sphere-scale
  // (THR-548) inside the resolver; it resolves into a ControlEffect ticked by
  // phaseControlEffects.
  {
    id: 'invest.veil.rend_the_gate',
    name: 'Rend the Gate',
    spellName: 'The Opened Way',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    description:
      'You set your hands to the seam between what is and what waits behind it, and you pull. The ' +
      'world tears. Through the wound your own sphere comes flooding into the land — a standing tide ' +
      'of power you have opened, and must now hold against whatever else the tear lets slip through.',
    reach: 'veil',
    requiresReach: 'veil',
    trayTier: 'rare',
    crudType: 'update',
    scale: 'regional',
    steps: [{
      reach: 'veil',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: SIGNATURE_BASE_COST.veil,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'mind',
    targetCategories: ['location'],
    motivations: ['tradition_novelty', 'sacrifice_survival'],
    narrativeTemplates: {
      initiation: 'sets its hands to the seam of the world and pulls it wide',
      success: 'the gate is rent — your sphere floods the land through the wound',
      failure: 'the seam holds; the world will not tear at your touch',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The tear hangs open in the air, and through it the sphere you command pours into the land. ' +
          'It will hold as long as you feed it — and leak as long as it holds.',
        changes: [],
        reactionPrompt: 'The way is open. Decide whether to hold it wide.',
        reactions: [
          {
            id: 'rend_the_gate_open',
            label: 'Hold the rift open.',
            intent:
              'Sustain the rift — each tick it strengthens your sphere across the surrounding land, ' +
              'at a standing essence cost and the risk of a hostile pulse leaking through.',
            effects: [
              {
                kind: 'sphere_influence_amplify' as const,
                locationId: AFTERMATH_TARGET_SENTINEL,
                sphere: AFTERMATH_PRIMARY_SPHERE_SENTINEL as unknown as CreationSphereName,
                durationMode: 'sustained' as const,
              },
            ],
          },
        ],
      },
    },
  },
  // ─── Stone — The Great Work (engine-backed, THR-555) ────────────────────────
  // Consumes the shipped `spawn_unique_location` aftermath effect (THR-552): mint a
  // one-of-a-kind master forge at the target location's hex (dedup by
  // GREAT_WORK_UNIQUE_TAG — one per run), and forge a legendary relic inside it by
  // reusing the spawn_artifact legendary path (artifactForgeTier). NOT a new node
  // type — a `location` flagged unique + a `controls` edge from the ascendant.
  {
    id: 'invest.stone.great_work',
    name: 'The Great Work',
    spellName: 'The Deep Foundation',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    description:
      'You lay a foundation the age itself will not outlive. Stone answers stone; the land gives up ' +
      'its deep bones to your design, and a work rises that mortals will name a wonder and ascribe to ' +
      'no god — the last and greatest of your makings, and cradled within it, a relic to match.',
    reach: 'stone',
    requiresReach: 'stone',
    trayTier: 'rare',
    crudType: 'create',
    scale: 'regional',
    steps: [{
      reach: 'stone',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: SIGNATURE_BASE_COST.stone,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'matter',
    targetCategories: ['location'],
    motivations: ['preservation_transformation', 'loyalty_ambition'],
    narrativeTemplates: {
      initiation: 'lays a foundation the age itself will not outlive',
      success: 'the Great Work rises — a wonder of stone that will outlast its makers',
      failure: 'the foundation will not take; the land keeps its deep bones',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The ground is ready and the design is set. What rises here will stand when the names of ' +
          'everyone who saw it built are long forgotten.',
        changes: [],
        reactionPrompt: 'The site is prepared. Decide what you raise upon it.',
        reactions: [
          {
            id: 'great_work_raise',
            label: 'Raise the Great Work.',
            intent:
              'Mint an enduring master forge at this place — one of a kind for the whole run — and ' +
              'forge within it a legendary relic bound to your hand.',
            effects: [
              {
                kind: 'spawn_unique_location' as const,
                subtype: 'master_forge',
                uniqueTag: GREAT_WORK_UNIQUE_TAG,
                nearAgentId: AFTERMATH_TARGET_SENTINEL,
                artifactForgeTier: GREAT_WORK_ARTIFACT_TIER,
              },
            ],
          },
        ],
      },
    },
  },
];

/**
 * `reach → signature template id`, derived from the templates above so the map can
 * never drift from what actually ships (THR-523). Exactly one signature per Reach
 * (the two-domain lock, `project_ascendant_two_domains`), so the mapping is total over
 * every reach that has a signature. Consumers: the acquisition-beat dynamic grant
 * (`resolveReachSignatureGrant`) and the reach-gated bucket catalogue
 * (`ASCENDANT_ACTION_BUCKETS`) — both read this instead of hard-coding the eight ids.
 */
export const REACH_SIGNATURE_ID_BY_REACH: Readonly<Partial<Record<ReachDomain, string>>> =
  Object.fromEntries(
    REACH_SIGNATURE_CONTENT_TEMPLATES.map((t) => [t.reach, t.id]),
  ) as Partial<Record<ReachDomain, string>>;
