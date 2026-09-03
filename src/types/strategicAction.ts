// src/types/strategicAction.ts
//
// Core types for the ambition-driven strategic action system.
// Strategic actions are proactive world-shaping steps generated from active ambitions,
// scored alongside encounter candidates in phaseAgentDecision.

import type { ReachDomain } from './traits';
import type { ValuePair } from './agent';
import type { EdgeType } from './graph';
// The group family's discriminator, imported rather than restated (THR-1309). A
// literal copy of the union here would be a second authority on what a group kind
// is, which is exactly the drift `groupShape.ts` was created to end (THR-1297 §4).
// `groupShape` is a leaf that imports only `types/graph`, so this cannot cycle, and
// the types layer already takes engine types this way (`gameState`, `prose`, `trace`).
import type { GroupKind } from '../engine/groupShape';

// ─── Strategic Verbs ────────────────────────────────────────────────
// Five world-shaping verbs from the design — the execution language under ambitions.

export type StrategicVerb =
  | 'gather_info'
  | 'create'
  | 'change'
  | 'control'
  | 'destroy';

// ─── Verb × object type (THR-1392) ──────────────────────────────────
// An undertaking is a verb acted on an object the world already has. The verb set
// is closed; the object types are registered once each in
// `src/data/undertaking-objects.ts`. `StrategicVerb` above stays as the legacy
// alias every importer compiles against until the flag flips
// (`STRATEGIC_VERB_OF_UNDERTAKING_VERB` maps between them).

/** found · improve · use · control · undo · survey. */
export type UndertakingVerb = 'found' | 'improve' | 'use' | 'control' | 'undo' | 'survey';

/**
 * A verb as a cell names it. `control` has two variants decided by what the resolved
 * object's ownership actually is: `claim` (nobody holds it) or `seize` (someone else
 * does) — Christian, 2026-09-03.
 */
export type UndertakingVerbVariant = Exclude<UndertakingVerb, 'control'> | 'control:claim' | 'control:seize';

/** The seven object types the world already has. */
export type UndertakingObjectTypeId =
  | 'attachment' | 'room' | 'settlement' | 'route' | 'company' | 'faction' | 'mark';

/**
 * The object an undertaking acts on. Node objects by node id; edge objects (a mark
 * is a `knows_secret_of` edge) by edge id. Carried beside `targetNodeId`, which stays
 * the *place* of the work for distance and moments.
 */
export type UndertakingObjectHandle =
  | { readonly kind: 'node'; readonly nodeId: string }
  | { readonly kind: 'edge'; readonly edgeId: string };

/** A cell's ownership rule: whose object the verb may be aimed at. */
export type UndertakingOwnership = 'own' | 'other' | 'unowned' | 'any';

// ─── Execution Modes ────────────────────────────────────────────────

export type StrategicExecutionMode =
  | 'instant'            // Single-tick graph mutation
  | 'multi_tick_project' // Progress-tracked build/research/negotiation
  | 'seed_encounter'     // Plant a follow-up encounter seed
  | 'claim_control'      // Establish ongoing control stance
  | 'contest_control';   // Challenge existing control holder

// ─── Behavior Families ──────────────────────────────────────────────
// Broad archetypal families that group strategic templates.

export type BehaviorFamily =
  | 'merchant-expansion'
  | 'builder-civic'
  | 'scholar-seeker'
  | 'zealot-mission'
  | 'court-political'
  | 'underworld-network'
  | 'warlord-expansion'
  | 'caretaker-steward'
  | 'artist-crafter'
  | 'wanderer-explorer';

// ─── Decision Family ────────────────────────────────────────────────
// Used by the unified chooser to tag what kind of candidate won.

export type DecisionFamily =
  | 'encounter'
  | 'strategic_action'
  | 'idle'
  | 'forced_travel';

// ─── Strategic Action Template ──────────────────────────────────────
// A reusable blueprint for a proactive world-shaping step.

export interface StrategicActionTemplate {
  readonly id: string;
  readonly displayName: string;
  readonly verb: StrategicVerb;
  /**
   * The verb × object cell this template is (THR-1392): the undertaking verb and
   * the object type it acts on. Set on cells and on migrated templates; absent on
   * every legacy template, which the resolver never sees.
   */
  readonly undertakingVerb?: UndertakingVerb;
  readonly objectTypeId?: UndertakingObjectTypeId;
  readonly executionMode: StrategicExecutionMode;
  readonly behaviorFamily: BehaviorFamily;

  /** Which reaches this action aligns with (for role-fit scoring) */
  readonly reachProfile: Partial<Record<ReachDomain, number>>;

  /** Ticks required for multi_tick_project mode (ignored for instant) */
  readonly projectDuration?: number;

  /** Prose templates for activity description */
  readonly activityProse: readonly string[];

  /** Prose templates for completion */
  readonly completionProse: readonly string[];

  /** Encounter template IDs that can be seeded as catalyst follow-ups */
  readonly catalystEncounterIds?: readonly string[];

  /** Target validation: what kind of graph target this step needs */
  readonly targetRule: StrategicTargetRule;

  /** Resource heuristics — optional cost/affordability hints */
  readonly resourceHint?: {
    readonly wealthCost?: number;
    readonly reachFloor?: Partial<Record<ReachDomain, number>>;
  };

  /** Data-driven mutation descriptor — replaces hardcoded switch in lifecycle */
  readonly mutationHint?: StrategicMutationHint;

  // ─── Checkpoint authoring (THR-1292 §2, §5) ───────────────────────

  /**
   * Normalised 0–1 difficulty each checkpoint rolls against.
   *
   * Absent ⇒ `UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY`. Per-kind band tables are
   * plan doc 2's content; this field is the seam they write into.
   */
  readonly checkpointDifficulty?: number;

  /**
   * Whether the actor must be *at* the undertaking's stage for a checkpoint to
   * resolve (THR-1279 verdict 7). Absent ⇒ `true`.
   *
   * When it holds and the actor is elsewhere the checkpoint defers rather than
   * halting; `UNDERTAKING_ABSENCE_DEFERRAL_LIMIT` consecutive absences convert to
   * one halt. That is deliberately not movement AI — moving an actor *toward* its
   * stage is board/binder behaviour and belongs to docs 3/5.
   */
  readonly requiresLocation?: boolean;

  /**
   * Whether checkpoints may resolve while the actor is mid-encounter. Absent ⇒ `true`.
   *
   * A `false` here *reads* the busy set and never writes it — the busy gate is
   * untouched, and the contract test in slice 2 exists to keep it that way.
   */
  readonly canRunBeside?: boolean;

  /**
   * Who and where this undertaking needs (THR-1296 §3) — the binder's input.
   *
   * Absent or empty ⇒ the bind pass does nothing for this template, which is every
   * shipped template in v1. Authoring the rows is doc 2's
   * ([THR-1297](https://linear.app/threadbare/issue/THR-1297)) work; this field is
   * the seam it authors into.
   */
  readonly cast?: readonly UndertakingCastSpec[];

  /**
   * What this undertaking *makes*, banded by how the checkpoint went (THR-1296 §3).
   *
   * Absent ⇒ the undertaking creates nothing, which is every shipped template in v1.
   * The band tables are doc 2's ([THR-1297](https://linear.app/threadbare/issue/THR-1297))
   * to author; this field and the engine that honors it are the seam.
   */
  readonly creationEffects?: UndertakingCreationEffects;

  /**
   * Does this verb reach beyond the agent's own presence (THR-1296 §6)?
   *
   * A remote undertaking must anchor through something the agent commands at or near
   * the site; without one, the verb is not offered. Commissioning, garrisoning and
   * raiding are remote in this sense. Walking four hexes to survey a market is not —
   * that is travel, and it is the distinction §6 as written did not draw.
   *
   * Absent ⇒ `false`, which is every shipped template in v1: with armies alone as the
   * anchor source, remote undertakings are deliberately **rare** until the T1 network
   * kind ([THR-1288](https://linear.app/threadbare/issue/THR-1288)) and doc 2's
   * holdings widen what counts as commanded. Doc 2 authors the rows; this field and
   * the gate that honors it are the seam, and an emptiness-pinning test fails
   * deliberately when the first `remote: true` lands.
   */
  readonly remote?: boolean;

  // ─── Board authoring (THR-1292 §4) ────────────────────────────────

  /**
   * What completing this undertaking is worth, in the board's common currency.
   *
   * Absent ⇒ derived from the shared verb-impact table (`STRATEGIC_VERB_IMPACT`)
   * scaled by `UNDERTAKING_PAYOFF_SCALE`. **Unauthored on every template in v1**
   * and deliberately so: per-kind payoff rows are plan doc 2's content, and a
   * first-guess number hand-written onto 43 templates would be fiction wearing a
   * data field. The verb table is at least a value the legacy scorer already
   * ranks on, so the fallback is a real signal rather than a placeholder.
   */
  readonly payoffValue?: number;

  /**
   * Value pairs this undertaking appeals to — the desire term's input, in exactly
   * the vocabulary encounter `motivations` use, so one function weights both.
   *
   * Absent ⇒ the desire multiplier rests on the ambition boost alone, which is
   * live from day one. Doc 2 authors these per kind. Every entry must be a member
   * of `VALUE_PAIRS`; slice 1's schema test is what makes that binding rather than
   * aspirational (a non-member reads `undefined ?? 0` and contributes nothing,
   * silently, forever).
   */
  readonly motivations?: readonly ValuePair[];

  // ─── Counter-play authoring (THR-1297 §2) ─────────────────────────

  /**
   * Motives that license this destroy verb against an owned target (THR-1281 §4).
   *
   * Absent ⇒ ungated, which is what every shipped template was before this field
   * existed. Present ⇒ candidate generation refuses the candidate unless the actor
   * holds at least one of the named motives toward whoever owns the target, with
   * refusal reason `no_motive` and a trace saying so — no motiveless demolition,
   * every destroy narratable, which is what doc 4's grievance minting consumes.
   *
   * The registry's schema gate (`src/data/undertaking-kinds.ts`) requires this on
   * every template a kind row names as a destroy, so a kind cannot ship its
   * counter-play as a verb anyone may fire for no reason.
   */
  readonly motiveGate?: readonly MotiveKind[];

  /**
   * What kind of harm this undertaking does when it completes (THR-1298).
   *
   * Present ⇒ the terminal path writes an `undertaking_outcome` event node, which is
   * what the mint lane reads to turn a harm into somebody's next drive. Absent ⇒ the
   * undertaking is harmless in the grievance sense and mints nothing.
   *
   * **Authored, never inferred from the verb.** A `destroy` verb is not automatically
   * a `property_destroyed`: severing a network and razing a settlement are different
   * wounds that want different drives, and the schema stays the authority on which is
   * which. Seizure routes through the holding-transfer emission site instead of this
   * field, because the victim there is the displaced owner rather than the target's.
   */
  readonly harmClass?: UndertakingHarmClass;
}

// ─── Harm classes (THR-1298) ────────────────────────────────────────

/**
 * The kinds of harm an undertaking outcome can register as.
 *
 * This is the shared vocabulary between the template schema (which authors it) and
 * `UNDERTAKING_MINTING_RULES` (which keys candidate drives off it). Both halves must
 * name the same members or the weight fires zero times — the `hungerResonance`
 * failure class. A schema test pins every authored value to this union.
 */
export type UndertakingHarmClass =
  | 'property_destroyed'      // a thing they owned is rubble
  | 'holding_seized'          // a thing they owned now answers to someone else
  | 'network_severed'         // the ties they worked through are cut
  | 'named_death'             // someone bound to them is dead
  | 'undertaking_abandoned';  // their own work was walked away from (self-facing, culprit-less)

// ─── Motives (THR-1281 §4) ──────────────────────────────────────────
// The vocabulary a destroy verb may name as its licence. Each member maps to a
// mechanism that already exists — this type introduces no new relation, it names
// the four the world already writes.

export type MotiveKind =
  /** A standing `hostile_to` edge from the actor toward the owner. */
  | 'rivalry'
  /** A `hostile_to` edge minted by a specific past injury (a group engagement). */
  | 'grudge'
  /** Actor and owner both actively `pursues` the same ambition node. */
  | 'contested_ambition'
  /** The actor's faction and the owner's faction are declared rivals. */
  | 'faction_war';

// ─── Undertaking Kinds (THR-1281 §1/§2) ─────────────────────────────

/**
 * What a work *is* — the kind-first grammar's discriminator.
 *
 * The ten named members are the grammar verdict's set; the `string & {}` arm keeps
 * the registry genuinely open (a pack may register an eleventh kind without editing
 * this union) while preserving completion on the ten that are designed.
 */
export type UndertakingKindId =
  | 'intelligence_cache'
  | 'leverage_mark'
  | 'masterwork_item'
  | 'chart_find'
  | 'network'
  | 'sublocation'
  | 'place_location'
  | 'trade_route'
  | 'warband'
  | 'faction'
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

/**
 * Which name table the work namer draws this kind's proper names from.
 *
 * A bare string in slice 2 because the lexicons themselves are the namer's content
 * (THR-1297 §5, slice 4) — narrowing this to a union before those tables exist
 * would be a taxonomy invented by a type rather than by the naming design.
 */
export type WorkLexiconId = string;

/**
 * One row of the kind registry — the CRUD closure for a kind of work.
 *
 * The registry is data the engine reads for naming, holdings and (doc 6) the factory
 * gates. Candidate generation continues to run off the packs; a row does not make a
 * verb offerable, it declares what the verb *builds* and how it can be undone.
 */
export interface UndertakingKindRow {
  readonly kindId: UndertakingKindId;
  readonly tier: 1 | 2 | 3;
  /** UL term for the kind, as players and the chronicle say it. */
  readonly displayName: string;
  /** Documentation of the node/edge shape produced — existing types only. */
  readonly objectShape: string;
  /** Whether completed works of this kind join the holdings system (§3). */
  readonly ownable: boolean;
  readonly createTemplateIds: readonly string[];
  readonly updateTemplateIds: readonly string[];
  /**
   * The counter-play. **Must be non-empty**, and every id must resolve to a template
   * that carries a `motiveGate` — the no-destroy-no-kind gate, enforced as a schema
   * test rather than an audit.
   */
  readonly destroyTemplateIds: readonly string[];
  readonly lexicon: WorkLexiconId;
}

// ─── Mutation Hints ─────────────────────────────────────────────────
// Data-driven execution descriptors so new packs don't need hardcoded switch cases.

export type StrategicMutationHint =
  | { type: 'record_intelligence'; intelligenceType: string }
  | { type: 'create_sublocation'; sublocationTypeId: string; nameTemplate: string }
  | { type: 'create_trade_route' }
  /**
   * Mint a place-tier `location` node — the T2 tier's object (THR-1308).
   *
   * The corpus had no op that founds a *place*. `create_sublocation` mints a room
   * inside somewhere that already exists (`parentLocationId` is required, and that
   * field is the sublocation discriminator, THR-1183); this mints the somewhere.
   * The node is place-tier by construction: it carries `hexCol`/`hexRow` and no
   * `parentLocationId`, which is exactly what `isPlaceTierLocation` tests.
   *
   * `anchor` decides whose hex it lands on. `actor_hex` founds where the founder
   * stands — the settlement case, and the reason this is not simply the target's
   * hex: founding a settlement *on top of* the town you targeted is not founding
   * anything. `target_hex` co-locates with the target, which is what a route
   * identity wants (it belongs at its origin endpoint).
   */
  | {
      type: 'create_location';
      locationSubtype: string;
      nameTemplate: string;
      anchor: 'actor_hex' | 'target_hex';
      /** Seed prosperity for the founded place. Omitted → 0, the worldSeed default. */
      prosperity?: number;
    }
  /**
   * Suspend a trade route the target endpoint carries — the `trade_route` kind's
   * counter-play (THR-1308; the plan's T2 vertical slice, "merchant route vs
   * warlord blockade").
   *
   * Writes `threatened: true` on the `trades_with` edge rather than deleting it,
   * because `threatened` is a property the world **already consumes**:
   * `phaseProsperity` skips a threatened route when it counts active routes at both
   * endpoints, so the blockade lands as a prosperity shock on the owner rather than
   * as a silent graph edit. `routeEvents` clears the flag after
   * `ROUTE_THREATENED_CLEAR_TICKS`, which is the right shape for counter-play — a
   * blockade that never lifts is deletion, not a counter.
   */
  | { type: 'blockade_route' }
  /**
   * Plant a transient `knows_clue_of` lead about the target location (THR-1297 §7).
   *
   * The explorer arc's output is *a lead the world can act on*, not a stat: the ruins
   * layer already consumes `knows_clue_of` at convergence and converts it to `knows_of`,
   * so a chart verb feeds an economy that exists rather than minting a private score.
   * `magnitude`/`precision` are the clue's strength and how narrowly it points.
   */
  | { type: 'spawn_clue'; magnitude: number; precision: number; detail?: string }
  /**
   * Stamp durable familiarity with the target location.
   *
   * The same edge the ruins layer writes at clue convergence, written directly here
   * because a survey that *finds* the place has done what convergence does. Idempotent:
   * the underlying op refuses a duplicate rather than stacking edges.
   */
  | { type: 'seed_knows_of' }
  /**
   * Mint a treasure map possession pointing at the target (THR-1297 §7).
   *
   * A possession rather than a property because the map is meant to be *takeable* —
   * that is the whole counter-play of the `chart_find` kind, and `treasureMapConsumption`
   * already removes it when its site is discovered. `consumeOnEvent` is what joins it to
   * that existing lifecycle; a map minted without one would never be spent.
   */
  | { type: 'mint_treasure_map'; consumeOnEvent?: string }
  /**
   * Take a `knows_secret_of` hold on the target actor — the `leverage_mark` kind's
   * object (THR-1297 §5).
   *
   * A dedicated op rather than `create_relation_edge` because that primitive stamps
   * only `establishedTick`, while `knows_secret_of` requires five properties including
   * a `discoveredTick` no authoring-time literal can carry. Routing a mark through the
   * generic maker would mint an edge the schema warns on, every time, forever — the
   * Secrets & Favors economy reads those properties, so a mark missing them is a hold
   * nothing can press.
   */
  | { type: 'mint_leverage_mark'; secretType: string; magnitude: number }
  /**
   * Press a held mark into a debt — the `leverage_mark` kind's *use* (THR-1297 §5).
   *
   * Converts a standing `knows_secret_of` hold into an `owes_favor` the subject carries,
   * which is what "feeding Secrets & Favors" means concretely: the mark stops being a
   * private fact and becomes an obligation the social systems already read. Refuses when
   * no mark is held, so pressing is genuinely gated on having cultivated one — that
   * refusal is what makes the arc an arc rather than three unrelated verbs.
   */
  | { type: 'press_the_mark'; favorMagnitude: number; context: string }
  /**
   * Forge an artifact the maker keeps — the `masterwork_item` kind's object.
   *
   * The one T1 kind whose object *is already an attachment*, so it needs no new
   * carrying mechanism: an artifact node plus the `possesses` edge is exactly what the
   * attachment layer reads. `craftTag` joins the piece to its maker's trade so the
   * namer and the codex can say what it is.
   */
  | { type: 'mint_masterwork'; craftTag: string; tier?: number }
  /**
   * Mint a real organisation — the T3 tier's object (THR-1309).
   *
   * **Two group kinds, one hint, because they are the same authored act at two
   * scales**: a commander raises a *company* of people who follow them, and a
   * founder charters a *faction* that outlives them. Both were previously faked.
   * `strategic_recruit_warband` wrote an intelligence record called
   * `warband_recruited` and minted nobody — the "recruit-warband mirage" the plan
   * names — and `strategic_found_order` shipped only a guild-hall sublocation, with
   * `dynamicFactionDefinitions` carrying no live producer at all since the
   * initiative retirement (THR-1295, absorbed here).
   *
   * `company` routes through `createGroup` (`groups/groupFormation.ts`), the one
   * code path that mints a company, so the node arrives already carrying
   * `groupKind: 'company'` and its `member_of` / `commanded_by` edges. `faction`
   * routes through a `FactionDefinition` synthesized from `factionSeed` into
   * `seedFactionFromDefinition`, which is what restores the missing producer.
   *
   * **Why `factionSeed` is authored content rather than derived.** A
   * `FactionDefinition` carries ~20 fields including four content-id lists (join,
   * promotion, quest and social template ids). Synthesizing those from nothing
   * would mint a faction whose encounters resolve to no content — a faction only
   * its founder can see, which is the orphan the kind registry exists to refuse.
   * The seed points them at existing generic guild content instead.
   */
  | {
      type: 'create_group';
      groupKind: 'company' | 'faction';
      /** `{actor}` / `{location}` placeholders, as `create_sublocation` uses. */
      nameTemplate?: string;
      /** Required when `groupKind` is `'faction'`; ignored for a company. */
      factionSeed?: StrategicFactionSeed;
    }
  /**
   * Add fighters to a warband the actor already commands — the `warband` kind's
   * *update* (THR-1309).
   *
   * A real `member_of` write rather than an intelligence record, deliberately. The
   * update column is where a T3 verb could most easily become a second mirage: the
   * nearest precedent (`strategic_extend_reach`, the network's update) records an
   * intelligence entry and changes nothing about the network it claims to extend,
   * which is the same shape as the `warband_recruited` record this slice removes.
   * Replacing one mirage while shipping another would be a wash.
   */
  | { type: 'reinforce_group' }
  /**
   * Break an organisation the actor did not raise — the `warband` kind's
   * counter-play (THR-1309).
   *
   * Writes through `dissolveGroup`, the single dissolution writer, so a suborned
   * warband inertifies exactly as one that starved does: the node and every
   * `member_of` edge stay in the graph carrying `leftAtTick`, because this is
   * inertification rather than deletion. A hand-rolled `groupStatus` write here
   * would leave live membership edges pointing at a dead company, which every
   * roster reader would then report as an active band.
   */
  | { type: 'disband_group' }
  | { type: 'create_relation_edge'; edgeType: string; direction: 'actor_to_target' | 'target_to_actor'; properties?: Record<string, unknown> }
  | {
      type: 'modify_location_property';
      property: string;
      delta: number;
      clamp?: [number, number];
      /**
       * When set, the write also stamps `<property>ExpiresAtTick` and the boost is
       * cleared that many ticks later by `phaseStrategicProjects` (THR-1292 §3).
       *
       * This exists because the retired initiative pipeline owned the *only* expiry
       * for the festival boost. Making it a hint field rather than a special case
       * keeps the retirement additive: the sweep is driven by
       * `EXPIRING_LOCATION_PROPERTIES`, so a second timed boost is a data edit.
       */
      expiresAfterTicks?: number;
    }
  | { type: 'no_mutation' };

/**
 * The authored half of a founded faction (THR-1309; THR-1295's Done-when).
 *
 * A `FactionDefinition` is ~20 fields and four of them are **content-id lists** the
 * encounter layer resolves against. Everything mechanical — reach weights from the
 * founder's own profile, hall locations from where they stand, rank tiers from the
 * shared ladder — the op derives. What it cannot derive is which encounters the new
 * order runs, so those ids are authored here and point at existing generic guild
 * content. A faction founded with unresolvable ids would offer join and quest
 * encounters that resolve to nothing: live by every dashboard, inert in play.
 */
export interface StrategicFactionSeed {
  /** Faction archetype — drives UI glyph/colour defaults and ambition weighting. */
  readonly factionType: string;
  /** `{actor}` / `{location}` placeholders, rendered at completion. */
  readonly nameTemplate: string;
  readonly description: string;
  readonly motto?: string;
  readonly iconGlyph: string;
  readonly themeColor: string;
  /** Settlement subtypes that can carry this order's halls. */
  readonly locationTypes: readonly string[];
  /** The four content-id lists. Every id must resolve — see the interface note. */
  readonly joinEncounterTemplateId: string;
  readonly promotionEncounterTemplateId: string;
  readonly questTemplateIds: readonly string[];
  readonly socialTemplateIds: readonly string[];
}

// ─── Target Rules ───────────────────────────────────────────────────

export type StrategicTargetRule =
  | { type: 'location_subtype'; subtypes: readonly string[] }
  | { type: 'any_location' }
  | { type: 'actor_with_trait'; trait: string }
  | { type: 'faction' }
  | { type: 'trade_route' }
  | { type: 'self' }          // No external target needed
  | { type: 'hex_region' }    // Targets a hex area
  | { type: 'sublocation_type'; subtypeIds: readonly string[] }
  /**
   * Every object of a registered type in the world, filtered by the cell's
   * ownership rule (THR-1392). The one rule the verb × object model needs: the
   * registry's `shape` enumerates the handles, `resolveObjectOwners` classifies
   * them, and the candidate carries the handle it chose.
   */
  | { type: 'object'; objectTypeId: UndertakingObjectTypeId; ownership: UndertakingOwnership }
  /**
   * People standing where the actor is standing (THR-1297 §5).
   *
   * The `leverage_mark` kind needed an actor-shaped target and the only one that
   * existed — `actor_with_trait` — scans the **whole graph** and slices five, so a
   * mark could be cultivated on someone the actor has never been within twenty hexes
   * of. `knows_secret_of` is a relationship between two people who have met; this rule
   * is what makes the target set say so. Self is always excluded.
   */
  | {
      type: 'colocated_actor';
      roles?: readonly string[];
      /**
       * Narrow to people the actor already holds this edge type toward.
       *
       * Measured need, not speculative generality (THR-1297 slice 5): `press_the_mark`
       * refuses without a held `knows_secret_of`, and a role-only target rule picks
       * whichever clerk is standing there — so in a 150-tick seed-42 run the press
       * verb completed 3 times against 3 strangers and minted 0 debts. The guard was
       * working perfectly and the arc still could not connect, because *selection* did
       * not know what *resolution* required. This is the field that tells it.
       */
      // Typed `EdgeType` rather than `string` so a typo names an edge that exists: an
      // unregistered type would silently match nothing, reproducing the exact dead-verb
      // symptom this field was added to cure.
      readonly withEdgeFromActor?: EdgeType;
    }
  /**
   * Group-family `actor` nodes, split by who commands them (THR-1309).
   *
   * **This rule exists because trap 1 has a shape, and the warband walks straight
   * into it.** A company is an `actor` node with no `located_at` edge of its own —
   * position derives from its leader — so no existing rule can see one:
   * `colocated_actor` reads `located_at` incoming and finds nothing,
   * `actor_with_trait` wants a trait a company has never carried, and `self` returns
   * the commander rather than the band. Authoring the warband's update and destroy
   * against any of those would offer both verbs against targets that can never
   * satisfy them — `press_the_mark`'s failure exactly, where the guard was correct,
   * every layer was correct, and the arc still could not connect.
   *
   * `ownership` is the half that makes selection know what resolution requires. A
   * commander reinforces the band they *have* (`commanded_by_actor`); a rival breaks
   * one they do *not* (`other_commander`), because the D column is what the world can
   * do to take a work back and a self-spend is a use, not a counter. Disbanded groups
   * are excluded from both — an inert node is not a target.
   */
  | {
      type: 'group_node';
      groupKind: GroupKind;
      ownership: 'commanded_by_actor' | 'other_commander';
    };

// ─── Strategic Action Candidate ─────────────────────────────────────
// A scored, concrete candidate generated from an ambition + world state.

export interface StrategicActionCandidate {
  readonly candidateId: string;
  readonly templateId: string;
  readonly ambitionId: string;
  readonly actorId: string;
  readonly verb: StrategicVerb;
  readonly executionMode: StrategicExecutionMode;
  readonly behaviorFamily: BehaviorFamily;
  readonly displayName: string;

  /**
   * Who this undertaking is aimed *at* (THR-1298) — the owner the motive gate named
   * when it licensed a destroy verb.
   *
   * The gate already computes this (`MotiveGateResult.ownerId`) and, before this
   * field existed, discarded it one line later. Carrying it forward is what lets a
   * completed harm say whose thing it was: the grievance mint needs a victim, and
   * re-deriving ownership at completion time reads a graph the undertaking has
   * already mutated (the razed node may be gone, the seized one already retargeted).
   *
   * Absent on every ungated template, which is most of them.
   */
  readonly victimAgentId?: string;

  /** Origin anchor for completion-time mutations (THR-669) — see StrategicProjectRuntime.originLocationId. */
  readonly originLocationId?: string;

  /** The graph node this action targets (location, actor, faction, etc.) */
  readonly targetNodeId?: string;
  readonly targetHex?: { col: number; row: number };

  /**
   * The object this undertaking acts on (THR-1392), beside `targetNodeId` (the place
   * of the work). Set only by the `object` target rule; absent on every template
   * that names a legacy rule.
   */
  readonly objectHandle?: UndertakingObjectHandle;
  readonly objectTypeId?: UndertakingObjectTypeId;

  /**
   * The commanded entity this remote undertaking reaches through (THR-1296 §6).
   *
   * Set by the remote-anchor gate at proposal time, and only for a target beyond
   * `BINDER_REMOTE_RANGE_HEXES` of the agent — a nearby target needs no anchor and
   * carries none. The bind pass binds it as the `$anchor` cast slot, must-persist,
   * which is what makes severing an agent's army a complication for everything that
   * army was footing rather than a silent stall.
   */
  readonly anchorNodeId?: string;

  /** Raw score components before normalization */
  readonly scoreComponents: StrategicScoreComponents;
  /** Final normalized score (0-1 range, comparable with encounter scores) */
  readonly finalScore: number;

  /** Why this candidate was generated */
  readonly generationReason: StrategicGenerationReason;
}

export type StrategicGenerationReason =
  | 'ambition_progression'  // Direct next step for the ambition
  | 'blocker_relief'        // Removes an obstacle to ambition progress
  | 'opportunity_pull'      // World state presents a favorable opening
  | 'control_obligation'    // Existing control needs maintenance
  | 'unfinished_work';      // Previously started project needs continuation

export interface StrategicScoreComponents {
  readonly ambitionAlignment: number;
  readonly blockerRelief: number;
  readonly worldImpact: number;
  readonly catalystValue: number;
  readonly roleFit: number;
  readonly controlPressure: number;
  readonly travelPenalty: number;
  readonly varietyPenalty: number;
}

// ─── Candidate Rejection ────────────────────────────────────────────

export interface StrategicCandidateRejection {
  readonly templateId: string;
  readonly reason: string;
}

// ─── Strategic Project Runtime ──────────────────────────────────────
// In-progress multi-tick project state, stored on GameState.

export interface StrategicProjectRuntime {
  readonly projectId: string;
  readonly actorId: string;
  readonly templateId: string;
  readonly ambitionId: string;
  readonly verb: StrategicVerb;
  readonly behaviorFamily: BehaviorFamily;
  readonly targetNodeId?: string;
  readonly targetHex?: { col: number; row: number };

  /** The object this undertaking acts on (THR-1392), carried from the candidate. */
  readonly objectHandle?: UndertakingObjectHandle;
  readonly objectTypeId?: UndertakingObjectTypeId;

  /**
   * Who this undertaking is aimed at (THR-1298), carried from the candidate the
   * motive gate approved. Read at the terminal paths to attribute the harm.
   * Absent on every ungated undertaking.
   */
  readonly victimAgentId?: string;
  /**
   * Where the project was undertaken (THR-669): the actor's resolved,
   * non-transient location at project start. Trade routes must anchor here —
   * the actor's completion-time location is often a transient transit hex
   * that gets garbage-collected, silently evaporating the route.
   */
  readonly originLocationId?: string;

  /**
   * The commanded entity this remote undertaking reaches through (THR-1296 §6),
   * carried from the candidate the gate approved. Bound as `$anchor` by the bind
   * pass; absent on every local undertaking.
   */
  readonly anchorNodeId?: string;

  /** Ticks of work accumulated */
  progress: number;
  /** Ticks of work required to complete */
  readonly progressRequired: number;
  /** Tick when project was started */
  readonly startedTick: number;
  /** Tick of last progress advancement */
  lastProgressTick: number;

  status: 'active' | 'completed' | 'stalled' | 'failed';

  /** For control stances: ticks since last upkeep action */
  neglectTicks?: number;

  // ─── Checkpoint state (THR-1292 §2) ───────────────────────────────
  //
  // Every field below is optional so a world saved before checkpoints loads as a
  // fresh, un-checkpointed undertaking rather than throwing (NFP #6/#4). The
  // reader treats absent as the zero value in each case, and
  // `nextCheckpointTick` absent means "schedule one from now".

  /** Checkpoints resolved so far — the index carried on the trace */
  checkpointIndex?: number;
  /** Tick at or after which the next checkpoint fires */
  nextCheckpointTick?: number;
  /** Accumulated ratchet points; at `UNDERTAKING_HALT_RATCHET_N` the fork fires */
  halts?: number;
  /** Set once the fork chose to escalate. A second ratchet trip forces abandon. */
  escalated?: boolean;
  /**
   * Whether any moment on this undertaking ever reached the player as an
   * interrupt. This is the input to the §2.2 residue rule: a failure nobody
   * watched leaves a chronicle line, a failure they watched leaves a scar.
   */
  everInterrupted?: boolean;
  /** Gates repeat at-cost interrupts — only the *first* advance-at-cost interrupts */
  atCostMomentFired?: boolean;
  /** Consecutive absence deferrals; `UNDERTAKING_ABSENCE_DEFERRAL_LIMIT` of them convert to one halt */
  deferrals?: number;
  /**
   * Doc 3's re-binding seam. Set when an escalation asks for the undertaking to be
   * re-bound with complications.
   *
   * **Consumed** (THR-1296 §3, slice 4) by the bind pass in
   * `src/engine/binding/undertakingBindPass.ts`: it releases the undertaking's live
   * cast bindings so the next pass re-scores every slot from scratch, then clears
   * the flag. An escalation is a fresh attempt at the same undertaking, so it gets
   * a fresh cast — that is what "re-bound with complications" means mechanically.
   */
  rebindRequested?: boolean;
  /** Difficulty override accumulated by escalation, on top of the template's authored value */
  checkpointDifficultyDelta?: number;
  /** Why the undertaking failed, when it did */
  failureReason?: 'abandoned_after_halts' | 'actor_lost' | 'timeout';
  /** Telemetry from the most recent checkpoint — what the debug surfaces read */
  lastCheckpoint?: {
    readonly band: import('./unifiedAction').StepOutcome;
    readonly effect: UndertakingCheckpointEffect;
    readonly roll: number;
    readonly probability: number;
    readonly tick: number;
  };
  /**
   * The most recent divine act that moved one of this undertaking's checkpoints
   * (THR-1299 slice 2 — scapegoat provenance, THR-1282 §6). Stamped where the
   * Inspire/Sabotage rider is consumed, so the moment that checkpoint produced can
   * name the god's hand in it. Absent until a rider lands.
   */
  divineInfluence?: UndertakingDivineInfluence;
}

/** What a checkpoint band does to an undertaking (THR-1292 §2). */
export type UndertakingCheckpointEffect = 'advance' | 'advance_at_cost' | 'halt';

/**
 * A divine act's fingerprint on an undertaking (THR-1299 slice 2).
 *
 * `tick` is the checkpoint the rider moved, which is what lets a moment record
 * claim the influence only when it was *this* checkpoint the god touched. The
 * shipped rider flags carry a magnitude, not an action id, so `actionId` is
 * optional until a writer records one — the provenance chip renders unlinked text
 * without it (Law 17: no dead-end click).
 */
export interface UndertakingDivineInfluence {
  readonly verb: 'inspire' | 'sabotage';
  readonly tick: number;
  readonly actionId?: string;
}

/**
 * One moment, as the player-facing surfaces consume it (THR-1299 slice 2).
 *
 * The producer half of the moment stream shipped with doc 1 and died in the
 * trace buffer; this record is what the moment card, the thread-row badge and
 * the arc panel read. `id` is the TickEvent id, so a card can be reached from a
 * chronicle line and vice versa. `presentation` is stamped at push time from
 * `resolveMomentPresentation`, never recomputed — the follow state at the moment
 * the thing happened is the honest one.
 *
 * `acknowledged` is the idempotency flag (the receipts idiom): an interrupt-tier
 * record the player dismissed stops being offered as an interrupt but stays in
 * the queue for the badge to count until it ages out.
 */
export interface UndertakingMomentRecord {
  readonly id: string;
  readonly projectId: string;
  readonly actorId: string;
  readonly templateId: string;
  readonly momentClass: UndertakingMomentClass;
  readonly presentation: UndertakingMomentPresentation;
  readonly tick: number;
  /** The one-line narrator label — the same text as the TickEvent message. */
  readonly label: string;
  /** The undertaking's player-facing name: christened where one exists, else the display name. */
  readonly undertakingName: string;
  /** The checkpoint band that produced this moment; absent on a founding. */
  readonly band?: import('./unifiedAction').StepOutcome;
  readonly effect?: UndertakingCheckpointEffect;
  /** The must-persist cast member a complication lost (THR-1296 §3). */
  readonly lostCastName?: string;
  /** Set only when a divine rider moved the checkpoint this moment came from. */
  readonly divineInfluence?: UndertakingDivineInfluence;
  acknowledged: boolean;
}

/**
 * Moment classes emitted by checkpoint resolution and read by
 * `resolveMomentPresentation`. Doc 5 owns the surfaces; the vocabulary lives here
 * so the engine can stamp `everInterrupted` without waiting for them.
 */
export type UndertakingMomentClass =
  | 'started'
  | 'at_cost'
  | 'completion'
  | 'fork'
  | 'abandoned'
  | 'complication';

/** How a moment reaches the player. `'none'` means chronicle-only. */
export type UndertakingMomentPresentation = 'interrupt' | 'badge' | 'none';

// ─── Control State ──────────────────────────────────────────────────
// Ongoing control stance held by an actor over a graph target.

export interface StrategicControlState {
  readonly controlId: string;
  readonly actorId: string;
  readonly templateId: string;
  readonly ambitionId: string;
  readonly targetNodeId: string;
  readonly verb: 'control';
  readonly behaviorFamily: BehaviorFamily;

  /** Tick when control was established */
  readonly establishedTick: number;
  /** Ticks since last upkeep action */
  neglectTicks: number;
  /** Whether control is actively maintained */
  active: boolean;
  /** Degradation level (0 = healthy, 1 = about to collapse) */
  degradation: number;
}

// ─── Strategic History Entry ────────────────────────────────────────
// Record of a completed or failed strategic action for player/debug inspection.

export interface StrategicHistoryEntry {
  readonly tick: number;
  readonly actorId: string;
  readonly templateId: string;
  readonly ambitionId: string;
  readonly verb: StrategicVerb;
  readonly behaviorFamily: BehaviorFamily;
  readonly displayName: string;
  readonly targetNodeId?: string;
  readonly outcome: 'completed' | 'failed' | 'stalled';
  readonly graphOps: readonly string[];
  readonly catalystSeeded: boolean;
}

// ─── Ambition Strategic Profile ─────────────────────────────────────
// Optional metadata on AmbitionTemplate that bridges ambitions to strategic steps.

export interface AmbitionStrategicProfile {
  /** Which behavior family this ambition naturally produces */
  readonly behaviorFamily: BehaviorFamily;
  /** Preferred strategic verbs for this ambition (ordered by priority) */
  readonly preferredVerbs: readonly StrategicVerb[];
  /** Strategic template IDs that this ambition can generate */
  readonly templateIds: readonly string[];
  /** Reach domains this ambition's strategic steps emphasize */
  readonly reachEmphasis: Partial<Record<ReachDomain, number>>;
}

// ─── Binding Ledger (THR-1296 doc 3 §3) ─────────────────────────────
//
// Why records and not a `bound_by` edge, addressed against the
// relationships-are-edges rule rather than skipped: an edge needs two graph
// endpoints, and the undertaking side of a binding is not a graph node. The
// ratified substrate verdict (THR-1280 addendum) put undertakings in the
// strategic runtime as `StrategicProjectRuntime` records — there is no `project`
// node type in `src/types/graph.ts` — so a `bound_by` edge would first require
// inventing a node type, which the no-new-node-types rule forbids and nothing in
// the binding ruling requests. The narrower ground holds too: that rule governs
// *entity-to-entity* relationships, and a binding is bookkeeping between an
// entity and a runtime record. The traversal-shaped query an edge would have
// served ("is this node bound?") is answered by the registry's runtime reverse
// index plus the `WorldGraph.removeNode` hook.

/** Why a binding stopped being live. */
export type UndertakingBindingBrokenCause =
  | 'node_removed'
  | 'deceased'
  | 'severed';

/**
 * One cast or stage slot of one undertaking, bound to one graph node.
 *
 * `status: 'broken'` is terminal and triggers a re-bind — it is never a value any
 * scorer reads. That is the THR-1286 lesson (dead records poison scorers) applied
 * by construction rather than by discipline.
 */
export interface UndertakingBindingRecord {
  readonly projectId: string;
  /** The cast-spec key this record fills (`'$anchor'`, an authored cast key, …). */
  readonly castKey: string;
  readonly nodeId: string;
  readonly kind: 'actor' | 'location';
  readonly persistence: import('./encounter').EncounterSupportPersistence;
  /**
   * The role this slot was filled by, snapshotted at bind time (THR-1296 §3).
   *
   * Stored rather than read back off the node, because by the time anyone asks how
   * rare the lost role was, the node is *gone* — that is what "lost" means. Reading
   * it live made every node-removal loss score as maximally scarce and therefore
   * singular, so every honest death halted its undertaking instead of downgrading
   * it to at-cost. The ledger is what remembers there was a steward here.
   */
  readonly boundRole?: string;
  readonly boundAtTick: number;
  readonly stepIndex: number;
  status: 'live' | 'broken' | 'released';
  brokenCause?: UndertakingBindingBrokenCause;
  /** Tick at which status left `'live'` — inspection only. */
  endedAtTick?: number;
  /**
   * Whether this breakage has already been turned into a named complication
   * (THR-1296 §3, slice 4).
   *
   * A broken binding is terminal, so without this the same loss would re-fire its
   * complication at every checkpoint until the slot re-bound — one death, an
   * unbounded stream of "hits serious trouble" moments. Set by the bind pass at the
   * moment it reports the loss; the record stays `broken` (terminal, unread by any
   * scorer) and the slot re-binds on the following pass.
   */
  lossReported?: boolean;
}

// ─── The mint queue (THR-1296 doc 3 §5) ─────────────────────────────
//
// A binder mint is never immediate. The request is queued here and drained by
// `phaseAgentLifecycle`'s births block through the same valve every other new
// mortal passes — at most `BINDER_MINT_BUDGET_PER_TICK` per tick, never on a
// death tick. That is the THR-814/THR-162 lesson made mechanical: an unmetered
// spawn path is how a large map ends up with a thousand agents by tick 72.
//
// Queue-before-valve also dissolves the phase-ordering problem: decision runs
// before lifecycle in the tick, so a request made at tick T is born at T or
// T+1, and the checkpoint simply binds when the mint exists.

/**
 * What a cast slot demands of a candidate's stated values.
 *
 * Defined here rather than in the binder so the mint request can carry it without
 * an engine→engine import from a types module — `binder.ts` re-exports it as
 * `BindingIdentityRequirement`, which is the name the scored board reads it under.
 * One definition, two names, no drift.
 *
 * The schema seam doc 2 ([THR-1297](https://linear.app/threadbare/issue/THR-1297))
 * authors values into; this plan ships the engine that honors it and deliberately
 * no authored rows of its own.
 */
export interface UndertakingIdentityRequirement {
  readonly axis: ValuePair;
  readonly pole: 'virtue' | 'vice';
  /** Distance from neutral (0.5 canonical) the candidate must clear, 0–0.5. */
  readonly minStrength: number;
}

/**
 * One thing an undertaking creates when a checkpoint lands on the right band.
 *
 * The two kinds are the ones the recon confirmed missing from the strategic mutation
 * vocabulary — `StrategicMutationHint` can build a sublocation only at *completion*,
 * and has never been able to make a person at all. A creation effect fires per
 * checkpoint instead, which is what makes an undertaking's middle eventful rather
 * than a progress bar with a payoff bolted to the end.
 *
 * `spawn_npc` with `must-persist` routes through the mint valve (§5) and is therefore
 * budgeted, deterministic, and born real. `scene-only` materializes immediately as a
 * walk-on through the same writer the encounter support bundle uses — the split is
 * deliberate: the birth budget exists for people the world will keep, and spending it
 * on a face in one scene is what would starve it.
 */
export type UndertakingCreationEffect =
  | {
      readonly kind: 'spawn_npc';
      /** `NpcRole`, widened to string at the seam (as `UndertakingCastSpec.mintRole` is). */
      readonly role: string;
      readonly persistence: import('./encounter').EncounterSupportPersistence;
      /**
       * Ledger key for a must-persist spawn. Absent ⇒ derived from the effect's role
       * and the band, which keeps a template that authors no key idempotent per band
       * rather than minting a fresh person at every checkpoint.
       */
      readonly castKey?: string;
      readonly spawnName?: string;
      readonly factionDefId?: string;
      readonly identityRequirement?: UndertakingIdentityRequirement;
    }
  | {
      readonly kind: 'spawn_sublocation';
      readonly sublocationTypeId: string;
      /** Authored name; absent ⇒ the type id, title-cased by the graph op's caller. */
      readonly nameTemplate?: string;
    };

/**
 * Creation effects banded by checkpoint outcome (THR-1290 §4).
 *
 * The bands are deliberately not the full six-value `StepOutcome` ladder: what a
 * creation effect keys on is what the checkpoint *did*, and three of the six bands
 * advance while two halt. `onCritFailure` is the exception that earns its own entry —
 * "critical failure creates the problem" is a distinct authoring intent from
 * "advance creates the reward", and collapsing it into the halt case would make the
 * worst band the only one that can never put anything in the world.
 *
 * A plain `halt` creates nothing. That is the whole halt rule.
 */
export interface UndertakingCreationEffects {
  readonly onAdvance?: readonly UndertakingCreationEffect[];
  readonly onAtCost?: readonly UndertakingCreationEffect[];
  readonly onCritFailure?: readonly UndertakingCreationEffect[];
}

/**
 * One cast or stage slot an undertaking template declares (THR-1296 §3).
 *
 * This is the **schema seam**, shipped unauthored on purpose. Doc 2
 * ([THR-1297](https://linear.app/threadbare/issue/THR-1297)) authors the per-kind
 * rows; slice 4 ships the engine that honors them plus emptiness-pinning tests, so
 * doc 2's first authored row fails one deliberately rather than landing on a seam
 * nobody proved.
 *
 * Shaped after `EncounterSupportActorSpec` rather than beside it — same job, same
 * vocabulary (`key`, `persistence`, spawn fields) — because the encounter support
 * bundle is exactly what this promotes (THR-1290 §1). It is a separate interface
 * only because an undertaking slot carries two things a scene slot does not: an
 * `identityRequirement` for the scored board, and a `steps` window, since an
 * undertaking runs across many checkpoints while a scene runs once.
 */
export interface UndertakingCastSpec {
  /** Slot name, unique within the template. The binding ledger's `castKey`. */
  readonly key: string;
  readonly kind: 'actor' | 'location';
  readonly persistence: import('./encounter').EncounterSupportPersistence;
  /** Roles that satisfy this slot on reuse. Empty/absent ⇒ any role fits. */
  readonly acceptedRoles?: readonly string[];
  /** The role a mint would be born into. Required — a mint must know what it makes. */
  readonly mintRole: string;
  readonly identityRequirement?: UndertakingIdentityRequirement;
  /** Authored name for a mint; absent ⇒ culture-phonetic (the mint path's default). */
  readonly spawnName?: string;
  readonly factionDefId?: string;
  /**
   * Checkpoint indices this slot is wanted at. Absent ⇒ every step.
   *
   * This is the per-step half of "per-step anchoring": a slot is bound at the step
   * that needs it, not once for the whole undertaking (the THR-1289 finding — today
   * binding runs once per action at one anchor).
   */
  readonly steps?: readonly number[];
  /**
   * Stage override — the `key` of a `kind: 'location'` spec in the same bundle whose
   * bound node becomes this slot's stage. Absent ⇒ the undertaking's `targetNodeId`.
   *
   * The same idea as `EncounterSupportActorSpec.preferredLocationKey`, under the
   * name the plan uses for it. A location spec naming itself is ignored.
   */
  readonly anchor?: string;
}

/**
 * One queued birth, owed to one cast slot of one undertaking.
 *
 * The id the mint will take is `mint_<projectId>_<castKey>` — instance-unique by
 * construction (a project id already is) and seed-deterministic, so replaying a
 * seed produces the same person under the same name. Deliberately *not* the
 * encounter path's `enc_support_<templateId>_<locId>_<key>`, whose self-reuse
 * across every instance of a template is a feature there and would be a collision
 * here.
 */
export interface UndertakingMintRequest {
  readonly projectId: string;
  readonly castKey: string;
  readonly stepIndex: number;
  /** The role the newborn is born into — `NpcRole`, widened to string at the seam. */
  readonly role: string;
  /** Where they are born: the stage node, or the place tier that holds it. */
  readonly placementNodeId: string;
  readonly persistence: import('./encounter').EncounterSupportPersistence;
  /** Authored name wins when the spec provides one; otherwise culture-phonetic. */
  readonly spawnName?: string;
  readonly factionDefId?: string;
  /** Born to the requirement — the reason the mint row scores identity at 1. */
  readonly identityRequirement?: UndertakingIdentityRequirement;
  readonly requestedAtTick: number;
}

// ─── Strategic Runtime State ────────────────────────────────────────
// Aggregate runtime state stored on GameState for strategic actions.

export interface StrategicRuntimeState {
  /** Active multi-tick projects */
  readonly projects: StrategicProjectRuntime[];
  /** Active control stances */
  readonly controls: StrategicControlState[];
  /** Rolling history window for inspection */
  readonly history: StrategicHistoryEntry[];
  /**
   * The binder's persistence ledger (THR-1296). Optional so a world saved before
   * the binder loads as one with no bindings rather than throwing (NFP #6/#4);
   * every reader treats absent as empty. The `Map<nodeId, recordIds>` reverse
   * index is a runtime-owned lazy derivation, deliberately not serialized.
   */
  bindings?: UndertakingBindingRecord[];
  /**
   * Births the binder owes but has not yet taken through the lifecycle valve
   * (THR-1296 §5). Optional for the same reason `bindings` is: a world saved
   * before the binder loads as one with nothing queued. Bounded by
   * `BINDER_MINT_QUEUE_MAX` — an overflowing queue refuses the bind and traces
   * it rather than growing without limit.
   */
  mintQueue?: UndertakingMintRequest[];
}
