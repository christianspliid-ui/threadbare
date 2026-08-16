// src/types/unifiedAction.ts
import type { ReachDomain, TraitPredicate } from './traits';
import type { SphereName, CreationSphereName, HexCoord, LocationSubtype } from './index';
import type { OmenCategory, EmittedOmenScope } from './omen';
import type { ActorType } from './graph';
import type { ValuePair } from './agent';
import type { GraphOp } from './graphOp';
import type { TargetCategory } from './targetContext';
import type { ControlSpec } from './controlEffect';
import type { RarityTier } from './rarity';
import type { AttentionTier } from './attention';
import type { RewardPoolRecipe } from './attachments';
import type { EncounterChoiceMemory, EncounterSupportBinding, EncounterSupportBundle, EncounterType } from './encounter';
import type { ClearanceGateConfig } from './contentShells';
import type { EffectPredicate } from './effects';
import type { EncounterForeshadowingDefinition } from './foreshadowing';
import type { AmbitionPriority } from './ambition';
import type { RelocationDestination } from './movement';

export type ActionScale = 'cosmic' | 'regional' | 'local' | 'personal';
export type ActionSource = 'agent' | 'player' | 'system';

// ─── Layer Revelation ────────────────────────────────────────────────────────

/** The four narrative layers a hex can reveal independently. */
export type NarrativeLayer = 'land' | 'soul' | 'people' | 'ruins';

/** Per-layer revelation state for a single hex. */
export type HexRevelation = Record<NarrativeLayer, boolean>;

/** All narrative layers, for iteration. */
export const NARRATIVE_LAYERS: readonly NarrativeLayer[] = ['land', 'soul', 'people', 'ruins'];

/** Create a default (all unrevealed) HexRevelation. */
export function createDefaultHexRevelation(): HexRevelation {
  return { land: false, soul: false, people: false, ruins: false };
}
export type StepFailBehavior = 'fail_action' | 'continue_weakened';

/**
 * Compatibility payload carried forward from legacy encounter authoring.
 * Phase 5 uses this to preserve reward cadence and promotion hooks while
 * the runtime moves fully onto unified actions.
 */
export interface ActionStepOutcomeMetadata {
  readonly rewardPool?: RewardPoolRecipe;
  readonly tierPromotionEligible?: boolean;
  readonly reputationDelta?: number;
  /**
   * THR-783 — aftermath effects applied when *this* outcome side fires, dispatched
   * through the same {@link applyEncounterAftermathReaction} the reaction path uses,
   * so the full effect vocabulary is authorable per step rather than only per
   * encounter. Read symmetrically: declare it on `successMetadata` to mark a win,
   * on `failureMetadata` to mark a loss.
   *
   * Note the outcome-band split is `isStepSuccess`, which counts `near_miss` as
   * success — a near miss therefore does *not* fire `failureMetadata.effects`.
   *
   * Supersedes the never-declared, never-read `onFailureEffects` key that the
   * THR-101 tavern migration authored in place of the legacy `appliesWound` flag:
   * five sites named an effect nothing consumed, so a lost brawl marked no one.
   */
  readonly effects?: readonly EncounterAftermathReactionEffect[];
}

// ─── Structured Intelligence ────────────────────────────────────────────────

/** Category of intelligence record held by an agent. */
export type IntelligenceCategory =
  | 'shrine_location'
  | 'agent_network'
  | 'trade_route'
  | 'military_position'
  | 'political_secret'
  | 'cultural_knowledge';

/**
 * A queryable intelligence record held by an agent — structured knowledge
 * gained through encounter aftermath that future encounters can reference.
 *
 * Intelligence records live on GameState.intelligenceRecords (not on graph nodes)
 * so they are queryable without graph traversal.
 */
export interface IntelligenceRecord {
  readonly recordId: string;
  readonly category: IntelligenceCategory;
  /** Human-readable label for what this intelligence represents. */
  readonly label: string;
  /** Narrative description of what is known. */
  readonly detail: string;
  /** Geographic relevance — which region this intelligence is about. */
  readonly targetRegion?: string;
  /** Specific entity this intelligence concerns. */
  readonly targetEntityId?: string;
  readonly sourceEncounterId: string;
  /** Agent who holds this intelligence. */
  readonly agentId: string;
  readonly acquiredTick: number;
  /** Reliability 0-1; how trustworthy this intelligence is. */
  readonly reliability: number;
}

// ─── Hidden Marks ───────────────────────────────────────────────────────────

/** Category of concealed consequence placed on an agent. */
export type HiddenMarkCategory =
  | 'betrayal'
  | 'debt'
  | 'secret_knowledge'
  | 'concealed_action'
  | 'forbidden_contact'
  | 'soul_diminishment'
  | 'mystical_contract'
  | 'reputation_note'
  | 'divine_favor';

/**
 * A persistent hidden mark on an agent — a concealed consequence that can be
 * queried by future encounters and revealed through investigation.
 *
 * Marks live on GameState.hiddenMarks (not on graph nodes) so they are
 * queryable without graph traversal.
 */
export interface HiddenMark {
  readonly markId: string;
  readonly category: HiddenMarkCategory;
  /** Severity 0-1; affects reveal likelihood in future encounters. */
  readonly severity: number;
  /** Human-readable description of what the mark represents. */
  readonly label: string;
  readonly sourceEncounterId: string;
  readonly placedTick: number;
  readonly targetAgentId: string;
  /** Encounter families that can trigger reveal checks (prefix-matched). */
  readonly revealFamilies?: readonly string[];
}

/**
 * A dream-sent urge planted on one mortal, tilting their *own* next decision.
 * The Compulsion card's world change (THR-886).
 *
 * **Per-agent, where an omen is per-hex** — that difference is the whole card.
 * An omen stains a place and bends whoever walks through it; a compulsion is
 * addressed to a person and travels with them. So this cannot reuse
 * `state.emittedOmens`, and `derivePlantedCompulsionEncounterBias` keys on
 * `targetAgentId` where the omen path keys on hex distance.
 *
 * It expires rather than being consumed on use. The card's printed line says
 * "shaping the mortal's *next* decision", and a short `expiresTick` says that
 * without making the scoring path — a read — start writing state, which would
 * also burn the urge on decisions the strategic-candidate override later
 * overturns.
 */
export interface PlantedCompulsion {
  readonly compulsionId: string;
  /** The mortal the urge is addressed to. Never a hex, never a region. */
  readonly targetAgentId: string;
  /**
   * Encounter types the urge leans toward, and (negatively) away from —
   * the same authoring shape omen templates already use for `encounterBias`,
   * so a content author meets one vocabulary rather than two.
   *
   * Keyed on the closed {@link EncounterType} union rather than `string`, so a
   * misspelled type is a compile error instead of a card that silently does
   * nothing — which is the precise defect THR-886 exists to end.
   */
  readonly encounterBias: Partial<Record<EncounterType, number>>;
  /** Short prose; surfaces in the chronicle so the tilt is visible, not silent. */
  readonly narrativeHook?: string;
  readonly sourceEncounterId: string;
  readonly sourceReactionId: string;
  readonly plantedTick: number;
  readonly expiresTick: number;
}

export type EncounterAftermathChangeKind =
  | 'growth'
  | 'trait'
  | 'item'
  | 'reputation'
  | 'faction_reputation'
  | 'reputation_tally'
  | 'shell_state'
  | 'future_hook';

export type EncounterAftermathChangePolarity = 'gain' | 'loss' | 'mixed' | 'info';

/**
 * THR-1004 — one game concept named inside an aftermath change's `detail`.
 *
 * The UI Law says every game concept rendered to the player carries its image,
 * its tooltip, and its link where a page exists. A surface cannot honour that
 * by reading English, so the producer of the sentence declares what it named.
 *
 * All three presentation fields are optional and independent: a reach has a
 * tooltip and no page, a faction has all three, an item has a visual and no
 * tooltip. Fail-open (NFP #4) — a concept the surface cannot decorate still
 * renders as plain text rather than vanishing.
 */
export interface EncounterAftermathConceptRef {
  /** The exact substring of `detail` this concept occupies. */
  readonly text: string;
  /** Tooltip concept id (`reach.star`, `ui.standing`, …) when one resolves. */
  readonly tooltipId?: string;
  /** Graph node id behind the concept, when the entity has a page to open. */
  readonly entityId?: string;
  /**
   * What this concept *is*. Two consumers read it, each fail-open (NFP #4):
   * the chip's **link** routes by it, and the chip's **icon** is resolved from
   * it where an entity-visual family exists. Absent ⇒ neither is drawn.
   *
   * Deliberately narrower than `EntityVisualKind`: only these name things the
   * aftermath can produce. A trait is a concept, not an entity with art — it
   * takes a tooltip and no tile rather than a wrong one.
   *
   * **`attachment` is the one member with a page and no tile (THR-1120).** The
   * consequence of an ending is routinely a granted attachment — a condition, a
   * blessing, a curse, a bestowed power — and until this member existed the chip
   * could name that grant and never reach it. It carries no entity-visual family
   * because an attachment's art lives on its own template node and
   * `AttachmentDetailView` draws it; `resolveIcon` therefore skips this kind
   * rather than resolving a wrong one, which the `EntityVisualKind` union
   * enforces at compile time.
   *
   * `entityId` for an `attachment` is the **template** node id, never a granted
   * instance: the grant is written by the reaction's effects, which apply after
   * the player picks — at which point the veil closes. What the chip can honestly
   * link is the thing being granted, not a node that does not exist yet.
   */
  readonly visualKind?: 'agent' | 'faction' | 'artifact' | 'companion' | 'attachment';
  /** Display name for the visual's alt text and fallback tile. */
  readonly visualName?: string;
}

/**
 * THR-1082 — the four story-first consequence categories.
 *
 * These replace the six *display* kinds (`EncounterStageConsequenceKind`) as the
 * player-facing taxonomy. The wire `kind` union above is untouched: it says what
 * the engine changed, this says what the change *means to the character*.
 *
 * - `scar` — what the trial cost them, on body or spirit.
 * - `bond` — who now stands with or against them.
 * - `boon` — what they earned, and why.
 * - `path` — a way that has opened **and that the engine now tracks**.
 *
 * **UI Law 56 (THR-1141) binds every member, and `path` most of all.** A chip may
 * only report state a write actually produced. `path` was the category that
 * invited the breach, because a way opening reads as atmosphere: the Unsafe
 * Bridge shipped `PATH · THE RIVER CROSSING` on a band whose only reaction had
 * `effects: []`, so the player was told a route existed that nothing in the
 * simulation had ever heard of. A `path` is a route learned (an `intelligence`
 * record), an offer that will come round again (an `encounter_seed`), or a door
 * a later system can open — never the sentence alone. Prose belongs in the
 * band's `overview`, which promises nothing and is the right home for a mood.
 *
 * There is deliberately no fifth "everything else" member: a bucket named that
 * can never be story-legible, which is why MARK was retired. An unclassifiable
 * change folds by polarity instead (see `buildAftermathConsequences.ts`).
 */
export type EncounterAftermathCategory = 'scar' | 'bond' | 'boon' | 'path';

/**
 * THR-1082 — which way the state moved, stated rather than inferred from prose.
 * `opens` is PATH's direction: a way opening has no gain/loss axis.
 */
export type EncounterAftermathDirection = 'gain' | 'loss' | 'opens';

/**
 * THR-1082 — a banded magnitude as *data*, so the surface can draw it.
 *
 * `band` is an **ascending rung index**: 0 is the faintest rung of the named
 * ladder, `length - 1` the strongest. Note this is the reverse of the literal
 * array order in `engine/aftermathWords.ts`, where ladders are declared
 * highest-first so `bandWord` can read them top-down. Ascending is the order a
 * display wants ("bigger index, bigger cluster"), so the conversion happens once
 * at the producer rather than at every consumer.
 *
 * The raw delta is not carried here and never should be — it stays on the trace
 * (Law 13). This is the banding the words were already built from, kept instead
 * of being thrown away once the sentence was assembled.
 */
export interface EncounterAftermathMagnitude {
  readonly ladder: 'growth' | 'reputation' | 'tally';
  readonly band: number;
}

/**
 * THR-1082 — how much narrative weight a derived change carries.
 *
 * The surface renders `incidental` changes as a compact icon-first row (tag +
 * delta cluster, sentence demoted to the tooltip) and `beat` changes as a full
 * chip with its sentence. The distinction is the producer's to make because only
 * the producer knows whether anything notable happened: a capability that merely
 * drifted upward is incidental, the same capability *crossing a tier* is a beat.
 *
 * Absent ⇒ `beat`. Authored consequences never set this: an author who wrote a
 * sentence meant it to be read.
 */
export type EncounterAftermathStoryWeight = 'incidental' | 'beat';

export interface EncounterAftermathChange {
  readonly id: string;
  readonly kind: EncounterAftermathChangeKind;
  readonly title: string;
  readonly detail: string;
  readonly polarity: EncounterAftermathChangePolarity;
  readonly actorId?: string;
  readonly actorName?: string;
  /**
   * THR-1004 — the game concepts `detail` names, declared by whoever built the
   * sentence. Absent on authored changes, which are prose written by a human
   * and carry their entity links through the narrative linker instead.
   */
  readonly concepts?: readonly EncounterAftermathConceptRef[];
  /**
   * THR-1082 — the structured half of a consequence, all optional and additive.
   *
   * Before this, a producer computed the state noun, the direction and the
   * magnitude, spent them on an English sentence, and handed the surface a
   * finished string — so the chip could not draw an icon, an arrow or a
   * cluster, because none of them existed as data any more. These fields keep
   * that structure alive to the surface. The sentence is still built and still
   * shipped: on a derived chip it becomes the tooltip and the aria text, which
   * is what keeps THR-1004's numeral gate a real gate.
   *
   * Every field is optional, so all pre-existing authored content renders
   * exactly as it did (NFP #6) — the adapter derives `category` from
   * `kind` + `polarity` when the producer declared none.
   */
  readonly category?: EncounterAftermathCategory;
  /**
   * The one concept that *is* the changed state — the reach that grew, the
   * faction whose measure moved, the item that changed hands. Distinct from
   * `concepts`, which decorates the sentence: this one drives the icon tile and
   * the `CATEGORY · NOUN` tag.
   */
  readonly stateNoun?: EncounterAftermathConceptRef;
  readonly direction?: EncounterAftermathDirection;
  readonly magnitude?: EncounterAftermathMagnitude;
  readonly storyWeight?: EncounterAftermathStoryWeight;
  /**
   * Authored chips only — the clause naming *why* this happened, drawn from the
   * scene. Rendered before the change ("Caught at the rail by a passing
   * wanderer — Jorun walks with her now"). Enriched like `detail`.
   */
  readonly causeClause?: string;
}

// ─── World-shaping aftermath supporting types (THR-115) ─────────────────────

export type ArtifactTier = 'common' | 'shaping' | 'legendary';
export type ArtifactCategory = 'weapon' | 'talisman' | 'relic' | 'tome' | 'vessel' | 'key' | 'mundane';

export type FactionMemberSelection =
  | { readonly kind: 'all_matching_trait'; readonly traitId: string }
  | { readonly kind: 'within_radius'; readonly hexCol: number; readonly hexRow: number; readonly radius: number }
  | { readonly kind: 'by_reputation_below'; readonly threshold: number }
  | { readonly kind: 'by_reputation_above'; readonly threshold: number }
  | { readonly kind: 'explicit_ids'; readonly agentIds: readonly string[] }
  | { readonly kind: 'random_sample'; readonly fraction: number };

/**
 * Resolved target for a multi-target aftermath effect.
 * `actor_fallback` means no explicit target was supplied and the action actor was used.
 */
export type AftermathTarget =
  | { readonly kind: 'agent'; readonly id: string }
  | { readonly kind: 'faction'; readonly id: string }
  | { readonly kind: 'sublocation'; readonly id: string }
  | { readonly kind: 'actor_fallback' };

export type EncounterAftermathReactionEffect =
  | {
    readonly kind: 'reputation_score';
    /** @deprecated Use targetAgentId instead. Kept for backward compatibility. */
    readonly actorId?: string;
    readonly delta: number;
    /** Direct the rep change at a specific agent (not the actor). */
    readonly targetAgentId?: string;
    /** Direct the rep change at a faction node. */
    readonly targetFactionId?: string;
    /** Optional predicate gate — effect skips if predicate evaluates false (THR-116). */
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'reputation_tally';
    /** @deprecated Use targetAgentId instead. Kept for backward compatibility. */
    readonly actorId?: string;
    readonly key: string;
    readonly delta: number;
    /** Direct the tally change at a specific agent (not the actor). */
    readonly targetAgentId?: string;
    /** Direct the tally change at a faction node. */
    readonly targetFactionId?: string;
    /** Optional predicate gate — effect skips if predicate evaluates false (THR-116). */
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'clearance_gate_tag';
    readonly runtimeId?: string;
    readonly tag: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'recent_event';
    readonly eventType?: 'narrative' | 'ripple_consequence';
    readonly message: string;
    readonly significance?: number;
    /**
     * Fan-out: record this event in each listed witness's recentEvents as well.
     * The actor always records implicitly; duplicates are de-duped.
     */
    readonly witnessAgentIds?: readonly string[];
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'encounter_seed';
    readonly encounterFamily?: string;
    readonly templateId?: string;
    readonly targetAgentId?: string;
    readonly delayTicks: number;
    readonly priority?: number;
    readonly seedLabel: string;
    /**
     * THR-697 (Slice D) — opt-in scene-context inheritance. When true, the planting
     * site copies the source action's `targetId` and `supportBindings` onto the seed so
     * the follow-up encounter stars the same people (see `PendingEncounterSeed`). Default
     * false: the follow-up self-targets (today's behavior).
     */
    readonly inheritContext?: boolean;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * THR-1082 — an authored shift in the target's quintessence: the "loss of
     * confidence" shape of consequence, where what the trial cost was existential
     * rather than material.
     *
     * The engine has moved quintessence since TB-075, but only ever *itself* —
     * overchannel, encounter failure, doom. No encounter could author the shift
     * as a consequence of its own fiction, so a scene that should have shaken
     * someone had to spend a reputation delta or an item instead. This member
     * closes that gap and reuses the existing write path exactly: the effect
     * queues a `QuintessenceEvent` onto `pendingQuintessenceEvents`, and
     * `phaseQuintessence` applies it next tick with all its clamping, dissolution
     * checks and loss-prevention intact.
     *
     * Surfaces as a SCAR when negative and a BOON when positive. Never renders a
     * number — `delta` is designer data and stays on the trace (Law 13).
     */
    readonly kind: 'quintessence_shift';
    /** Negative = erosion, positive = recovery. Designer-facing only. */
    readonly delta: number;
    /** Shift a specific agent's quintessence (not the actor's). */
    readonly targetAgentId?: string;
    /**
     * Trace/debug provenance, appended to `encounter_aftermath:` so a shift is
     * attributable to the encounter that authored it. Defaults to the reaction id.
     */
    readonly source?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'hidden_mark';
    readonly category: HiddenMarkCategory;
    readonly severity: number;
    readonly label: string;
    readonly revealFamilies?: readonly string[];
    /** Place the mark on a specific agent (not the actor). */
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'intelligence';
    readonly category: IntelligenceCategory;
    readonly label: string;
    readonly detail: string;
    readonly targetRegion?: string;
    readonly targetEntityId?: string;
    /** Reliability 0-1; defaults to 0.8 if omitted. */
    readonly reliability?: number;
    /** Grant intelligence to a specific agent (not the actor). */
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * THR-139 — Authored "the intel paid off" chronicle line.
     *
     * Fires when the actor (or `targetAgentId`) holds an intelligence record
     * matching `category` AND the action's encounter context (templateId /
     * locationId / region). The matched record's reliability band picks
     * which prose variant lands on `recentEvents` / `tickEvents` and is
     * surfaced in the chronicle.
     *
     * Closes the consumption loop: scoring, prose enrichment, resolution
     * match, and difficulty modifier all reference records passively. This
     * variant adds an authored, player-visible reference. Records are read,
     * never consumed.
     */
    readonly kind: 'intel_referenced_prose';
    /** Which intelligence category this prose is conditional on. Effect no-ops if the actor has no matching record. */
    readonly category: IntelligenceCategory;
    /**
     * Reliability-tiered prose variants. The matched record's reliability band
     * (`reliable` / `uncertain` / `dubious`) picks which line is appended to
     * `recentEvents` / `tickEvents`. Authors must supply at least `reliable`;
     * `uncertain` and `dubious` are optional and inherit upward when absent
     * (uncertain → reliable; dubious → uncertain → reliable).
     *
     * Use the same enrichment vocabulary as other aftermath prose
     * ({name}, {location}, {intel:category}, etc.) — the message string
     * passes through the standard prose-enrichment path before being
     * stored on the TickEvent.
     */
    readonly prose: {
      readonly reliable: string;
      readonly uncertain?: string;
      readonly dubious?: string;
    };
    /**
     * Optional significance override (0–1). Defaults derived per band:
     *   reliable → INTEL_REFERENCED_PROSE_SIGNIFICANCE_RELIABLE  (0.6)
     *   uncertain → INTEL_REFERENCED_PROSE_SIGNIFICANCE_UNCERTAIN (0.45)
     *   dubious → INTEL_REFERENCED_PROSE_SIGNIFICANCE_DUBIOUS    (0.3)
     */
    readonly significance?: number;
    /** Direct the reference at a specific agent (defaults to actor). */
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'reputation_set';
    /** Absolute reputation value to assign (clamped to 0..1). */
    readonly value: number;
    /** Target a specific agent (not the actor). */
    readonly targetAgentId?: string;
    /** Target a faction node directly. */
    readonly targetFactionId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'apply_condition';
    /** ID of an existing trait/condition node in the graph. */
    readonly conditionTraitId: string;
    /** How long the condition lasts in ticks. 0 = indefinite (no auto-expiry). */
    readonly durationTicks?: number;
    /** Intensity 0-1. Stored on the has_trait edge. */
    readonly intensity?: number;
    readonly targetAgentId?: string;
    readonly targetFactionId?: string;
    readonly targetSublocationId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * Grant a named companion (THR-1096) — a person who joins the bearer and
     * grants their small always-on bonus until a story removes them.
     *
     * Authored grants deliberately ignore `COMPANION_MAX`: an encounter that
     * promised someone delivers them, and the surface shows the crowd honestly.
     */
    readonly kind: 'grant_companion';
    /** Companion template id from `src/data/companion-templates.ts`. */
    readonly companionTemplateId: string;
    /** Grant to a specific agent; defaults to the encounter's actor. */
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    /** Remove a companion the bearer currently has (THR-1096). */
    readonly kind: 'remove_companion';
    /** Companion template id — the instance minted from it is the one that leaves. */
    readonly companionTemplateId: string;
    /** Why they left — every departure names a reason; defaults to 'story'. */
    readonly reason?: 'lured_away' | 'story';
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'remove_condition';
    /** ID of the condition trait node to remove. */
    readonly conditionTraitId: string;
    /** Remove all matching edges (default: remove oldest). */
    readonly removeAll?: boolean;
    readonly targetAgentId?: string;
    readonly targetFactionId?: string;
    readonly targetSublocationId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * The Kindled Ambition (THR-885) — plant or wake an ambition on an actor.
     *
     * This is the **missing dispatcher**, not a new system. Reactive ambition
     * templates have had no assignment path at all (THR-812 / THR-726): the world
     * mints ambitions from events during `ambitionTick`, but nothing outside that
     * phase could ever assign one, so a whole class of authored templates was
     * unreachable. This effect calls `assignAmbitionToActor` — the shared helper
     * extracted from the three in-phase copies of the node+edge write — so a
     * card-planted ambition is byte-identical to a world-minted one.
     */
    readonly kind: 'assign_ambition';
    /** Ambition template id (`AMBITION_TEMPLATES[].id`). Pinned live by the grant-liveness test. */
    readonly templateId: string;
    /**
     * Priority to assign at. Omitted ⇒ `primary` when the actor pursues nothing
     * active, `secondary` otherwise — the same slot rule `ambitionTick` uses.
     */
    readonly priority?: AmbitionPriority;
    /** Short prose for the chronicle entry. Falls back to the template's own selection prose. */
    readonly narrativeHook?: string;
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'condition_attachment';
    /**
     * Condition trait node ID from condition-trait-content (e.g. 'trait.condition.wounded').
     * Unlike apply_condition's conditionTraitId, this surface also:
     *   • looks up the template's default duration from CONDITION_DURATIONS if durationOverride is absent,
     *   • surfaces a woundApplied signal for mid-encounter tier promotion when the template is the wounded condition.
     */
    readonly templateId: string;
    /** Who receives the condition. Defaults to action.actorId (same fallback as other effect kinds). */
    readonly targetAgentId?: string;
    /** Duration override in ticks. If omitted, uses the template's default from CONDITION_DURATIONS. */
    readonly durationOverride?: number;
    /** Number of stacks to apply. Defaults to CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT (1). */
    readonly stackCount?: number;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * THR-1110 — grant any catalog attachment as an authored consequence.
     *
     * THR-1082's palette rule names all seven attachment categories as legitimate
     * consequence material, but this vocabulary could reach only two of them:
     * `condition` (via `condition_attachment` / `apply_condition`) and `possession`
     * (via `spawn_artifact`). An aftermath that wanted to hand over a blessing, a
     * curse, a bestowed power, a spell or an agreement had no member to say it with,
     * so the author's only options were to fake it in prose — a chip claiming state
     * nothing wrote, the pathology THR-971's single-sourcing rule exists to stop —
     * or drop the consequence. Measured on THR-1097: A Bargain at the Crossroads is
     * literally an agreement and shipped carried by an `encounter_seed` instead.
     *
     * This is a **dispatcher, not a new system** (Law 3 / THR-658). Both write paths
     * already existed and are called unchanged:
     *   • node-backed (`blessing`, `curse`, `bestowed_power`, `spell`, and the two
     *     already-covered categories) → `instantiateReward`, which clones the
     *     template node and writes the `possesses` / `has_trait` edge.
     *   • edge-backed (`agreement`) → `instantiateAgreementReward`, which had been
     *     fully built since the attachment-slot design and had **zero callers** —
     *     a dormant path, the THR-614 shape.
     *
     * Category is never declared: it is a property of the template, resolved by the
     * same lookup the reward pool uses. An author names a thing, not a taxonomy.
     */
    readonly kind: 'attachment_grant';
    /**
     * Attachment template id. Either an agreement catalog id
     * (`AGREEMENT_REWARD_TEMPLATES[].id`) or a graph template node id from the
     * reward/starter catalogs. Pinned live by the grant-liveness sweep.
     */
    readonly templateId: string;
    /** Who receives it. Defaults to the encounter's actor. Accepts scene sentinels. */
    readonly targetAgentId?: string;
    /**
     * The other party — **agreements only, and required for them**.
     *
     * An agreement is a claim *between* two entities, unlike a condition which sits
     * on one, so it is edge-backed (`relates_to` with `agreement: true`) and needs
     * both ends. Accepts scene sentinels (`$actor`, `$target`, `$cast:<key>`) and
     * may name an agent, faction or location. An agreement grant whose counterparty
     * does not resolve to a real node no-ops with a trace rather than writing a
     * dangling edge (NFP #4) — a promise needs someone on the other end of it.
     *
     * Ignored by node-backed grants.
     */
    readonly counterpartyId?: string;
    /**
     * Duration override in ticks; `null` makes it permanent. When omitted the
     * template's own duration stands.
     */
    readonly durationOverride?: number | null;
    readonly when?: EffectPredicate;
  }
  // ─── World-shaping effects (THR-115) ──────────────────────────────────────
  | {
    readonly kind: 'spawn_artifact';
    /** Artifact template id from content catalog. */
    readonly templateId?: string;
    /** Fallback category if templateId not given. */
    readonly category?: ArtifactCategory;
    /** Override template tier. Determines node type and edge kind. */
    readonly tier?: ArtifactTier;
    /** Override display name. */
    readonly nameOverride?: string;
    readonly tags?: readonly string[];
    /** Place artifact in actor inventory (possesses / bonded_to). Symbolic: $actor | $ally | $rival | $witness. */
    readonly targetAgentId?: string;
    /** Place artifact at location (contains). */
    readonly targetLocationId?: string;
    /** Chronicle message override. */
    readonly messageOverride?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'emit_omen';
    readonly category: OmenCategory;
    /** Intensity 0–1; drives encounter bias weight and chronicle significance. */
    readonly intensity: number;
    /** How long the omen stains the scope in ticks. Falls back to EMITTED_OMEN_DEFAULT_DURATION_TICKS when omitted. */
    readonly durationTicks?: number;
    /** Short prose, appears in chronicle + feeds enrichment {omen}. */
    readonly narrativeHook: string;
    readonly scope: EmittedOmenScope;
    /** Optional sphere tint — biases sphere_surge category encounters. */
    readonly sphereAlignment?: SphereName;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * The Compulsion (THR-886) — plant a dream-sent urge that tilts one mortal's
     * *own* next decision, then let the existing pipeline resolve it.
     *
     * The card was the last of THR-885's six dispatch hooks left unwired, because
     * its apparent host — `buildCompulsionEvent` — takes the decision pipeline's
     * `ScoredCandidate[]`, a list that exists only mid-`phaseAgentDecision` and
     * that aftermath cannot obtain. Synthesizing fakes to fit that signature would
     * have been the parallel-path failure `nudgeDispatch` exists to avoid, so the
     * card waited on a design call instead.
     *
     * Christian's ruling (2026-08-09): The Compulsion is *a whisper that tilts
     * them* — no second choice-screen inside an encounter mid-resolution. So this
     * plants a **weight**, which is available at the aftermath seam where a
     * candidate menu is not, and `phaseAgentDecision` folds it into the same
     * `combinedBias` the omen path already feeds. `premonitionCompulsion` is not
     * touched: the pick-one-of-three vision stays on the god's own premonition
     * turn, which is where it already lives.
     */
    readonly kind: 'plant_compulsion';
    /**
     * Encounter types to lean toward (positive) or away from (negative), before
     * scaling by `COMPULSION_BIAS_WEIGHT` and clamping. Mirrors the
     * `encounterBias` shape omen templates already author, and is keyed on the
     * closed {@link EncounterType} union so a typo cannot ship as a silent no-op.
     */
    readonly encounterBias: Partial<Record<EncounterType, number>>;
    /** Who dreams it. Defaults to `action.actorId`, as every other effect kind does. */
    readonly targetAgentId?: string;
    /** How long the urge lasts. Falls back to COMPULSION_DEFAULT_DURATION_TICKS. */
    readonly durationTicks?: number;
    /**
     * Short prose for the chronicle. Optional, but omitting it makes a successful
     * tilt indistinguishable from the do-nothing behaviour this card had before —
     * so authors should supply one.
     */
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'faction_splinter';
    readonly sourceFactionId: string;
    readonly newFactionName: string;
    readonly memberSelection: FactionMemberSelection;
    /** Fraction of parent reputation transferred to splinter members (0–1). */
    readonly inheritReputationShare?: number;
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'faction_absorb';
    readonly absorbingFactionId: string;
    readonly absorbedFactionId: string;
    readonly reputationMerge?: 'max' | 'sum_clamped' | 'weighted_avg';
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'faction_dissolve';
    readonly factionId: string;
    readonly memberFallback?: 'independent' | 'drift_to_rival';
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'faction_declare_war';
    readonly factionA: string;
    readonly factionB: string;
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'faction_force_peace';
    readonly factionA: string;
    readonly factionB: string;
    /** Sentiment boost applied to both parties. Defaults to FACTION_PEACE_DEFAULT_SENTIMENT_BOOST. */
    readonly sentimentBoost?: number;
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  // ─── Reach signature: Iron / Warhost (THR-550) ────────────────────────────
  | {
    /**
     * Iron's reach-signature aftermath — a divine "Call to Arms". Mobilizes a
     * faction for conflict: marks the faction `mobilized` and raises a force on
     * the existing army node form (`armySpawning.raiseWarhostForce` — NOT a new
     * node type) when a leader is available, falling back to a faction property
     * plus a rival-sentiment shift otherwise. Force strength scales with the
     * actor's primary-sphere power via `spherePowerMultiplier` (THR-548).
     */
    readonly kind: 'signature_warhost';
    /** Faction node id to rally. */
    readonly factionId: string;
    /**
     * Authored base force strength before sphere scaling. Defaults to
     * `WARHOST_BASE_STRENGTH` when omitted — the `scaledEffect(WARHOST_BASE_STRENGTH, mult)`
     * base from the plan.
     */
    readonly baseStrength?: number;
    /**
     * Preferred commander for the raised force. Falls back to the faction's
     * strongest Iron member (`selectCommander`) when omitted or invalid.
     */
    readonly leaderAgentId?: string;
    readonly when?: EffectPredicate;
  }
  // ─── Reach signature: Veil / Rend the Gate (THR-551) ──────────────────────
  | {
    /**
     * Veil's reach-signature aftermath — "Rend the Gate". Opens a sustained rift
     * onto a Creation Sphere at a location: while held it amplifies that sphere's
     * local influence each tick (pushed through the canonical pressure system, up
     * to a cap) at a per-tick essence cost, but each tick risks a hostile chaos
     * pulse leaking through (hex corruption + entropy pressure). Magnitude, cost,
     * AND leak chance all scale with the actor's primary-sphere power via
     * `spherePowerMultiplier` (THR-548) — the downside scales with the upside, so
     * it is the individualization, not a flat tax. Resolves into a `ControlEffect`
     * on `GameState.controlEffects[]`, ticked by `phaseControlEffects`.
     */
    readonly kind: 'sphere_influence_amplify';
    /** Location node id the rift anchors to (resolves to the rift's hex). */
    readonly locationId: string;
    /**
     * Sphere the rift amplifies — set by the content layer to the ascendant's
     * primary Creation Sphere, so individualization is intrinsic.
     */
    readonly sphere: CreationSphereName;
    /**
     * Authored base per-tick sphere influence before sphere-power scaling.
     * Defaults to `RIFT_INFLUENCE_PER_TICK` when omitted.
     */
    readonly perTick?: number;
    /** Sustained-effect marker (a rift persists until it lapses). */
    readonly durationMode: 'sustained';
    readonly when?: EffectPredicate;
  }
  // ─── Reach signature: Stone / The Great Work (THR-552) ────────────────────
  | {
    /**
     * Stone's reach-signature aftermath — "The Great Work". Mints a one-of-a-kind
     * `location` node (a legendary forge / deep mine) flagged `unique` (a property
     * + a `controls` edge from the actor — NOT a new node type, per the
     * everything-is-a-graph-node rule), de-duplicated by `uniqueTag` so only one
     * ever exists per run. Optionally forges an "extra-powerful artifact" by
     * reusing `spawn_artifact` with `tier: 'legendary'` (`GREAT_WORK_ARTIFACT_TIER`)
     * placed in the new location — no new artifact path. The sphere twist
     * (matter→inexhaustible mine, order→unbreakable forge, time→early completion)
     * comes from the individualization matrix (THR-549); this effect ships the
     * mint + dedup + legendary-forge reuse.
     */
    readonly kind: 'spawn_unique_location';
    /** Location subtype for the minted node (e.g. 'forge', 'mine', 'monument'). */
    readonly subtype: LocationSubtype;
    /**
     * Run-unique tag. Only one location carrying this tag exists per run — a
     * second cast with the same tag is a no-op (dedup, §3.10).
     */
    readonly uniqueTag: string;
    /** Explicit hex placement. Falls back to `nearAgentId`, then the actor's hex. */
    readonly hex?: HexCoord;
    /** Place the Great Work at this agent's hex when `hex` is omitted. */
    readonly nearAgentId?: string;
    /**
     * When set, also forge a legendary artifact inside the new location by reusing
     * the `spawn_artifact` path at this tier. Defaults to no artifact when omitted.
     */
    readonly artifactForgeTier?: ArtifactTier;
    /** Override display name for the minted location. */
    readonly nameOverride?: string;
    readonly when?: EffectPredicate;
  }
  // ─── Thread mutation effects (THR-116) ────────────────────────────────────
  | {
    readonly kind: 'thread_strengthen';
    readonly ascendantId: string;
    readonly mortalId: string;
    /** Strength delta. Defaults to THREAD_STRENGTHEN_DEFAULT. */
    readonly delta?: number;
    /** Narrative label stored on the thread edge. */
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'thread_weaken';
    readonly ascendantId: string;
    readonly mortalId: string;
    /** Strength delta (positive value applied as subtraction). Defaults to THREAD_WEAKEN_DEFAULT. */
    readonly delta?: number;
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'thread_break';
    readonly ascendantId: string;
    readonly mortalId: string;
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'thread_branch';
    readonly ascendantId: string;
    /** Existing thread recipient the branch originates from. */
    readonly sourceMortalId: string;
    /** New thread recipient. */
    readonly newMortalId: string;
    /** Starting strength of the new thread edge. Defaults to THREAD_BRANCH_INITIAL_STRENGTH. */
    readonly initialStrength?: number;
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
  // ─── Archetype drift surface (THR-328) ───────────────────────────────────
  | {
    /**
     * UI surface trigger: register that a drift threshold is currently held
     * on a moral axis after encounter resolution.
     */
    readonly kind: 'archetype_drift_register';
    /** Moral axis the registration applies to (for example: protector_conqueror). */
    readonly axisId: string;
    /** Threshold band that must currently be held on the axis. */
    readonly threshold: 'soft' | 'banner' | 'becoming';
    /** Direct the registration at a specific agent (defaults to actor). */
    readonly targetAgentId?: string;
    /** Optional predicate gate — effect skips if predicate evaluates false. */
    readonly when?: EffectPredicate;
  }
  // ─── Ruins Layer clue effects (THR-150) ──────────────────────────────────
  | {
    /**
     * Spawn a knows_clue_of edge on the actor (or a specified candidate pool).
     * Runs Narrative Gravity to select the recipient.
     */
    readonly kind: 'spawn_clue';
    readonly source: 'library_research' | 'tavern_rumor' | 'treasure_map' | 'spy_debrief' | 'encounter_outcome' | 'faction_dossier';
    /** Precision of the clue. Defaults to 'vague'. */
    readonly precision?: 'vague' | 'narrowed' | 'located';
    /**
     * ID of the ruin this clue points at.
     * Use '$nearest_ruin' to let the runtime pick a ruin near the actor at resolution time.
     */
    readonly targetRuinId: string;
    readonly when?: EffectPredicate;
  }
  // ─── Secrets & Favors effects (THR-30) ────────────────────────────────────
  | {
    /**
     * Attempt secret discovery: run secretGeneration.ts against the encounter target
     * and create a knows_secret_of edge (actor → target) on success.
     * Source is used to pick magnitude modifier and prose.
     */
    readonly kind: 'secret_discovery';
    readonly source: 'confession' | 'observation' | 'spy_debrief' | 'tavern_gossip' | 'encounter_outcome';
    /** Magnitude modifier applied on top of generation roll (0.0–1.0, default 0). */
    readonly magnitudeBonus?: number;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * Create an owes_favor edge (target → actor) when the encounter succeeds.
     * The favor magnitude is sampled from magnitudeRange using the session RNG.
     */
    readonly kind: 'favor_creation';
    readonly magnitudeRange: [number, number];
    readonly context: string;
    readonly when?: EffectPredicate;
  }
  // ─── Faction standing effects (THR-167) ──────────────────────────────────
  | {
    /**
     * Grow (or reduce) an agent's standing within a specific faction by calling
     * applyFactionReputationGain. This is the type-safe way for content authors
     * to advance rank as an encounter aftermath — preferred over reputation_tally
     * with off-axis keys.
     */
    readonly kind: 'faction_reputation_gain';
    /** The faction node ID (e.g. 'faction.civic-guard'). */
    readonly factionId: string;
    /** Reputation delta. Applied as-is; clamped to [-1.0, +1.0] at runtime. */
    readonly amount: number;
    readonly when?: EffectPredicate;
  }
  // ─── Aspect apex grant (THR-479) ──────────────────────────────────────────
  | {
    /**
     * Grant the *Aspect* apex milestone to a mortal: create an `aspect_of`
     * edge (ascendant → mortal), bump narrative gravity, and emit the
     * attainment beat. Idempotent — a no-op if the pair is already an Aspect.
     * Resolves the mortal from the encounter actor and the ascendant from
     * the mortal's incoming `thread` edge when ids are omitted.
     */
    readonly kind: 'grant_aspect';
    /** Explicit ascendant id. Defaults to the source of the mortal's thread edge. */
    readonly ascendantId?: string;
    /** Explicit mortal id. Defaults to the encounter actor. */
    readonly mortalId?: string;
    /** Narrative label stored on the aspect_of edge / chronicle beat. */
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
  // ─── Ascendant beat action unlock (THR-500) ───────────────────────────────
  | {
    /**
     * Unlock a player action into the run-scoped unlock set
     * (`GameState.unlockedActionIds`). The action drawer already filters on this
     * set via `isActionRevealed`, so a granted action simply appears — no drawer
     * change is needed. Idempotent: granting an already-unlocked id is a no-op.
     * Fail-soft: an unknown `actionId` is pushed harmlessly (no template matches,
     * so nothing reveals) rather than throwing.
     */
    readonly kind: 'unlock_action';
    /** Action template id to reveal. */
    readonly actionId: string;
    /** How the unlock should present in the UI (card-flight reveal vs. silent). */
    readonly revealStyle?: 'card_flight' | 'silent';
    readonly when?: EffectPredicate;
  }
  // ─── Formative-mark primitive (THR-529) ───────────────────────────────────
  | {
    /**
     * Apply a *permanent* formative mark: a rare, author-gated shift to the
     * actor's standing moral **baseline** on one reach's virtue↔vice axis. This
     * moves the baseline itself — the `AxiologicalProfile` value seeded at birth
     * by origin vignettes — not the temporary drift layer (THR-528) that decays
     * back toward it. Reserve for defining-moment encounters; rarity is enforced
     * by content discipline, magnitude by `FORMATIVE_MARK_MAX_MAGNITUDE`.
     *
     * Operates on the legacy ±1 axis scale (virtue toward +1, vice toward −1),
     * the scale shared by `AxiologicalProfile` and the drift accumulator. The
     * resulting baseline is clamped to [−1, +1].
     */
    readonly kind: 'axiological_mark_apply';
    /** Reach whose virtue↔vice axis the mark moves (e.g. 'iron', 'gold'). */
    readonly reach: ReachDomain;
    /**
     * Signed shift on the ±1 axis scale: positive tilts toward the reach's
     * virtue pole, negative toward the vice pole. Clamped to ±`FORMATIVE_MARK_MAX_MAGNITUDE`.
     */
    readonly signedMagnitude: number;
    /** Direct the mark at a specific agent (defaults to the encounter actor). */
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * THR-695 (Slice B) — move a directed relationship bond between two agents.
     *
     * Creates or mutates the actor→`withAgentId` `relates_to` edge: applies
     * `sentimentDelta` (result clamped to [-1, 1]) and, when supplied,
     * `trustDelta` (result clamped to [0, 1]). A missing edge is created with
     * `BOND_CREATE_INITIAL_SENTIMENT` / `BOND_CREATE_INITIAL_TRUST` before the
     * delta lands. `reciprocal` (default true) mirrors the same deltas onto the
     * reverse edge so a formed alliance is symmetric. No new node or edge type.
     */
    readonly kind: 'bond_change';
    /**
     * The other agent in the bond. Literal node id, `'$target'` (rebinds to the
     * action's resolved target), or `'$cast:<key>'` / `'role:<key>'` (rebinds via
     * the action's support bindings). Resolved by `bindAftermathSceneTargets`
     * before dispatch; an unresolved sentinel or non-agent node no-ops the effect.
     */
    readonly withAgentId: string;
    /** Signed change to edge sentiment; result clamped to [-1, 1]. */
    readonly sentimentDelta: number;
    /** Optional signed change to edge trust; result clamped to [0, 1]. */
    readonly trustDelta?: number;
    /** Mirror the deltas onto the reverse (with→actor) edge. Default true. */
    readonly reciprocal?: boolean;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * THR-1142 — send someone somewhere: a departure, an exile, a pilgrimage,
     * a family taking the east road.
     *
     * Before this kind no effect in the vocabulary could move anyone, which is
     * the gap the THR-1141 Law 56 census kept hitting — "Maret Departs", "East
     * Is Theirs" and "He Left First" all *describe* movement that nothing caused,
     * so their chips claimed state no write backed.
     *
     * Default `travel` mode writes a `relocationIntent` onto the agent node and
     * lets the existing agent-decision/movement system pursue it: the mortal walks
     * there and the journey stays visible on the map. It does **not** teleport, and
     * it does not add a second movement path — the intent only tilts the movement
     * scoring already there. `instant` retargets the `located_at` edge immediately
     * and is for scene logic (someone flees the room *now*); rare by intent, not gated.
     */
    readonly kind: 'agent_relocation';
    /**
     * Who is being sent. Literal node id, `'$actor'`, `'$target'`, or
     * `'$cast:<key>'` / `'role:<key>'` — bound by `bindAftermathSceneTargets`
     * before dispatch. Defaults to the encounter's actor.
     */
    readonly targetAgentId?: string;
    /**
     * Where they are going. A `location` destination may carry `'$target'` or
     * `'$cast:<key>'`, bound by `bindReachSignatureTargets` (the nested field is
     * outside the generic top-level scene pass).
     */
    readonly destination: RelocationDestination;
    /** `travel` (default) writes an intent; `instant` retargets `located_at` now. */
    readonly mode?: 'travel' | 'instant';
    /** Intent lifetime. Defaults to `RELOCATION_INTENT_TTL_TICKS`. Ignored when instant. */
    readonly ttlTicks?: number;
    /**
     * `set_destination` stamps the observed-residence property on arrival (THR-822
     * shape) — the difference between visiting and moving house. Default `unchanged`.
     */
    readonly residence?: 'set_destination' | 'unchanged';
    readonly when?: EffectPredicate;
  };

export interface PendingEncounterSeed {
  readonly seedId: string;
  readonly sourceEncounterId: string;
  readonly sourceReactionId: string;
  readonly encounterFamily?: string;
  readonly templateId?: string;
  readonly targetAgentId: string;
  readonly eligibleAfterTick: number;
  readonly priority: number;
  readonly seedLabel: string;
  readonly plantedTick: number;
  /** Event node ID of the source encounter that planted this seed (THR-143). */
  readonly sourceEventNodeId?: string;
  /**
   * THR-697 (Slice D) — inherited scene context, set only when the planting effect
   * carried `inheritContext: true`. At spawn, `evaluateEncounterSeeds` re-validates
   * both against the live graph: a dead `inheritedTargetId` falls back to self-target,
   * and dead-node bindings are dropped. Absent on ordinary (self-targeting) seeds.
   */
  readonly inheritedTargetId?: string;
  readonly inheritedBindings?: readonly EncounterSupportBinding[];
  /**
   * THR-731 — the band this seeded encounter is *against*. Set when a confrontation
   * is seeded while a hostile band shares the hex; carried onto the spawned action
   * as {@link UnifiedAction.opposingGroupId}, which is what the contestation
   * detector pairs on. Absent on every ordinary (uncontested) seed.
   */
  readonly opposingGroupId?: string;
}

export interface EncounterAftermathReaction {
  readonly id: string;
  readonly label: string;
  readonly intent?: string;
  readonly effects: readonly EncounterAftermathReactionEffect[];
  readonly closeAfterSelection?: boolean;
}

export interface EncounterAftermathSummary {
  readonly encounterId: string;
  readonly outcome: UnifiedActionOutcome;
  readonly overview: string;
  readonly changes: readonly EncounterAftermathChange[];
  /** Outcome band tag (e.g. 'fortunate' for near_miss). Propagated into EncounterNotification.narrativeTag for toast styling (THR-462). */
  readonly narrativeTag?: string;
  /**
   * Reserved for future "react to what you learned" follow-up options.
   * Gate Duty does not use them yet, but the ending model can.
   */
  readonly reactionPrompt?: string;
  readonly reactions?: readonly EncounterAftermathReaction[];
}

// ─── Nudge Model (THR-773 / WS0) ───────────────────────────────────
//
// A nudge is an authored, essence-priced card the god may play into an
// *attended* encounter step. It shifts the odds; it never picks the outcome.
// The whole feature is opt-in: a step without `nudges` resolves exactly as it
// did before this schema landed (NFP #4, NFP #6).

/**
 * Band rider attached to a nudge — a deterministic remap of the resolved
 * `StepOutcome`, applied after the d100 has already been drawn.
 *
 * `reroll_once` was considered and REJECTED at design audit: any extra draw from
 * the resolution rng stream shifts every downstream consumer for that action.
 * Riders are pure band-mapping and take **zero** draws from any stream, so the
 * same seed plus the same nudges yields the same roll and the same outcome.
 */
export type NudgeRider =
  /** `critical_failure` → `failure`. Every other outcome passes through. */
  | 'no_crit_fail'
  /** `failure` → `success_at_cost` **and** `near_miss` → `success_at_cost`. */
  | 'floor_at_cost'
  /**
   * The Gambit (THR-885). Widens **both** ends: every non-critical band moves one
   * step away from the middle, so a good result gets better and a bad one gets
   * worse. The crits are already at the ends and pass through.
   *
   * This is the one rider that can make an outcome *worse*, which is the point —
   * it is a card the player chooses, not a hazard the world applies.
   */
  | 'all_or_nothing';

/**
 * Which pole of a value axis a nudge card argues for (THR-894).
 *
 * Two authoring forms, one meaning:
 *
 * - **Axis-explicit** `{ axis, toward, weight? }` — the general form. Names the
 *   `ValuePair` it argues on, so it counts only toward a branch deciding on
 *   *that* axis and abstains everywhere else. `toward: 'positive'` is the
 *   first-named pole of the pair (the `+1` direction in `AxiologicalProfile`);
 *   `'negative'` is the second-named pole.
 * - **Axis-implicit** `'a' | 'b'` — the shorthand, legal only where the *host*
 *   declares the axis for the whole beat. Today that is exactly one host: a
 *   meeting `FormativeTest`, whose `valuePair` supplies the axis for every card
 *   in the test (`MeetingStepNudge` narrows to this form). A bare shorthand on
 *   an ordinary encounter step names no axis and therefore abstains from every
 *   branch decision — the template validator warns rather than guessing.
 *
 * - **Route-explicit** `{ route, weight? }` — the N-route form (THR-898). Names a
 *   {@link BranchRoute.key} directly rather than a value axis, for the case a
 *   card argues for one *course* among several toward the same objective
 *   ("slip him a purse") where no axis cleanly separates the options. It counts
 *   only toward the route it names, and abstains from every two-pole decision —
 *   a route key is not an axis and must never be read as one.
 *
 * `weight` scales the card's pull; omitted ⇒ {@link POLE_LEAN_DEFAULT_WEIGHT}.
 * A heavier card is a louder argument, not a better one — it moves the
 * direction the moment takes, never the odds it takes it at (that is
 * `forecastDelta`, deliberately a separate field).
 */
export type StepNudgePoleLean =
  | {
      readonly axis: ValuePair;
      readonly toward: BranchPoleKey;
      readonly weight?: number;
    }
  | {
      readonly route: string;
      readonly weight?: number;
    }
  | 'a'
  | 'b';

/**
 * The two keys a `decidedBy` branch may name (THR-894).
 *
 * Deliberately not free strings: a `decidedBy` branch whose variants key
 * anything else fails template validation at build time rather than silently
 * falling through to `fallback` forever — the THR-844 lesson, where a typo'd
 * family id made 66 of 138 entries permanently unreachable and nothing noticed.
 */
export type BranchPoleKey = 'positive' | 'negative';

/**
 * Authored per-encounter nudge option (THR-772 ruling 3).
 *
 * Lives on `ActionStep.nudges`. `bandProse` keys on the six-value `StepOutcome`
 * (including `near_miss`) — NOT the five-band `EncounterOutcomeBand`, and NOT
 * `OutcomeBand` from `outcomeConsequences.ts`, either of which would type-check
 * while being the wrong domain.
 */
export interface StepNudge {
  /** Unique within the owning template. */
  readonly id: string;
  /**
   * The library card this authored option *is* an instance of (THR-887) — an id
   * in `NUDGE_CARD_LIBRARY`.
   *
   * `id` is unique within its template; this is the shared identity across every
   * template that deals the same card. Two encounters both dealing the core
   * Boost carry different `id`s and the same `libraryCardId`, which is what lets
   * the twilight harvest tally "how often did this god play Boost" across a
   * whole run rather than counting per-template aliases as distinct cards.
   *
   * Absent ⇒ a one-off authored option that is not in the library: playable and
   * fully supported, simply never a candidate for the echo card.
   */
  readonly libraryCardId?: string;
  /** ≤6 words, plain language (interactivePlainness applies). */
  readonly name: string;
  /** Sphere gate; absent ⇒ common pool. */
  readonly sphere?: SphereName;
  /** God-power template id that must be unlocked before this card is playable. */
  readonly requiredUnlock?: string;
  /** Trait-only option; pairs with `UnifiedActionTemplate.traitVariants`. */
  readonly requiredTrait?: string;
  /**
   * The Fellowship (THR-885) — dealt only when the acting mortal is in a group.
   * Like `requiredTrait`, an unmet requirement *hides* the card rather than
   * dimming it: a card the player cannot make true from here is noise, not a goal.
   */
  readonly requiresGroup?: boolean;
  /**
   * The Favor, call variant (THR-885) — dealt only when the acting mortal is owed
   * an unredeemed, unbroken favor by someone. Hides when there is none, same
   * reasoning as {@link requiresGroup}.
   */
  readonly requiresFavor?: boolean;
  /** Essence price at commit. 0 is allowed (trait options). */
  readonly essenceCost: number;
  /** Named forecast modifier contributed as `{ source: 'nudge:<id>', delta }`. */
  readonly forecastDelta: number;
  /** Optional band rider applied at step-outcome selection. */
  readonly rider?: NudgeRider;
  /**
   * Which pole of a value axis this card argues for (THR-894).
   *
   * A card with no lean **abstains**: it moves the odds without arguing for a
   * direction, which is a legitimate and common way to author. Absent ⇒ every
   * shipped card behaves byte-for-byte as it does today (NFP #6).
   *
   * See {@link StepNudgePoleLean} for the two authoring forms.
   */
  readonly poleLean?: StepNudgePoleLean;
  /** WS4 image-library tag; absent ⇒ category generic. */
  readonly imageTag?: string;
  /** Card body — a concrete, witnessed effect. */
  readonly fiction: string;
  /**
   * Per-setting-class rewrites of {@link fiction} (THR-884). A card whose fiction
   * names class-specific scenery ("the threshing floor") carries one line per class
   * its template's envelope declares, so a wide envelope stays honest without
   * narrowing to one subtype.
   *
   * Resolved through `resolveSettingVariant` — the same lookup chain as `{frag:*}`,
   * with `fiction` as the default. Absent → the card reads exactly as today (NFP #6).
   */
  readonly fictionBySetting?: Readonly<Record<string, string>>;
  /** Player guidance, words only (never a number). */
  readonly effectLine: string;
  /** Appended to the step's prose when this nudge was active for that outcome. */
  readonly bandProse?: Partial<Record<StepOutcome, string>>;
  /**
   * Cost channels beyond essence (THR-885). A card may be cheap or free in
   * essence and paid for somewhere else entirely — that is the whole design of
   * The Heavy Hand, The Veil, and The Bargain.
   *
   * Applied once, at commit, through each host system's own API. Absent ⇒ the
   * card costs only its `essenceCost`, exactly as every shipped card does.
   */
  readonly costs?: NudgeCostChannels;
  /**
   * World changes this card makes when it was committed, expressed in the
   * **existing aftermath effect vocabulary** and dispatched through the existing
   * applier (THR-885).
   *
   * Sharing the vocabulary is the design, not a shortcut: every grant a card can
   * make (omen, condition lift, item, mark, favor, ambition) already has exactly
   * one host system that owns it, and reusing `EncounterAftermathReactionEffect`
   * routes the card to that owner instead of minting a second path to the same
   * place — the failure mode the systems inventory exists to prevent.
   *
   * Grants fire once per committed card, *after* the step resolves, so a card's
   * fiction and its world change cannot disagree about whether it happened.
   */
  readonly grants?: readonly EncounterAftermathReactionEffect[];
}

/**
 * Non-essence prices a nudge card charges (THR-885).
 *
 * Both deltas are signed: The Heavy Hand raises detection, The Veil lowers it;
 * The Bargain pushes doom forward. Zero and absent are the same thing.
 */
export interface NudgeCostChannels {
  /**
   * Detection-pressure delta in the acting mortal's region, applied through
   * `applyDetectionDelta`. Positive = more visible to rivals.
   */
  readonly detectionDelta?: number;
  /**
   * Doom-clock delta, applied through `accelerateDoomClock` / `decelerateDoomClock`.
   * Positive = the clock runs faster.
   */
  readonly doomDelta?: number;
}

/**
 * Template-level variant applied when the acting agent holds `traitId`
 * (resolved through the same `has_trait` walk as `requiredTraits`).
 *
 * Fail-soft: a variant naming an absent trait — or an `addNudgeIds` entry with
 * no matching `StepNudge` — is inert and warns once.
 */
export interface TraitVariant {
  readonly traitId: string;
  /** Added to the forecast as `{ source: 'trait:<traitId>', delta }`. */
  readonly forecastDelta?: number;
  /** Added to the step's effective difficulty (negative eases the step). */
  readonly difficultyDelta?: number;
  /** Player-facing factor line surfaced alongside the forecast. */
  readonly factorLine: string;
  /** Nudge ids unlocked into the hand by holding this trait. */
  readonly addNudgeIds?: readonly string[];
}

/**
 * An authored for/against line in the step's test panel — the encounter's own
 * account of why the odds sit where they do (THR-820).
 *
 * Distinct from `beat.forecast_factors`, the bare string tuple the contract
 * adapter exposes: that pool carries no sign, so a line drawn from it can only
 * render `neutral`. An authored `StepFactorLine` declares its polarity, which
 * is what lets the panel colour it the way it colours a live `trait:*` line.
 *
 * **Naming its source is a prose rule, not a field.** Per the authoring spec's
 * canon rule 1, the cause lives *in the sentence* ("The mason cut his mark
 * beside the third pin"), exactly as a trait-derived line names its trait. A
 * structured `source` on this type would invite a label beside the line, which
 * is the key:value UX the project rejects.
 *
 * Authoring guardrails (`FACTOR_LINES_MIN`/`MAX`, `NUDGE_WORD_BUDGETS.factorLine`)
 * live in `data/content-eval/nudgeAuthoringConstants.ts` and are warn-level —
 * the renderer draws whatever is authored.
 */
export interface StepFactorLine {
  /** One concrete sentence, ≤`NUDGE_WORD_BUDGETS.factorLine` words. */
  readonly text: string;
  /** Which way this line cuts. Authored, never inferred. */
  readonly polarity: 'for' | 'against';
}

/**
 * A carryover line — how the *previous* step's resolution tilts this one (THR-892).
 *
 * The variance rule says a test-panel factor line earns its place only if it could
 * have read differently on another run. A static authored line cannot: it is the
 * same sentence every time, so it is priced into `difficulty` and belongs in the
 * prose. A carryover line is the one authored factor surface besides trait lines
 * that is **variant by construction** — it is keyed on an outcome the run rolled,
 * so a different roll shows a different line, or none.
 *
 * `forecastDelta` is optional and, when declared, rides the existing named-modifier
 * channel as `carryover:<outcome>` (see {@link CARRYOVER_MODIFIER_SOURCE_PREFIX}).
 * It takes no rng draw of its own — the draw already happened, on the prior step.
 */
export interface StepCarryoverFactorLine extends StepFactorLine {
  /** Additive forecast contribution, same 0–1 channel as a nudge or trait delta. */
  readonly forecastDelta?: number;
}

export interface ActionStep {
  readonly reach: ReachDomain;
  readonly duration: { readonly min: number; readonly max: number };
  readonly difficulty: number; // 0-1
  /**
   * Opt-in for state-derived difficulty during resolution. Declarative by
   * design — a serializable enum rather than a function, so the generated action
   * catalog and the running game cannot disagree about a step's price.
   *
   * - `'intel_sensitive'` — actionable intelligence eases the roll.
   * - `'target_tier_scaled'` (THR-1073) — difficulty *and* duration come from the
   *   authored per-tier ramp in `attachment-tier-content.ts`, indexed by the
   *   target artifact's current tier. Pair with `essenceCostContext` on the
   *   template so the price ramps alongside the difficulty. The duration half
   *   was unimplemented until THR-1100 — this line described it from the start,
   *   and `tierScaledDuration` is what finally made the sentence true; the
   *   marker stayed one enum rather than splitting, because both numbers are
   *   per-step and both index off the same source tier.
   */
  readonly difficultyContext?: 'intel_sensitive' | 'target_tier_scaled';
  readonly onSuccess: readonly GraphOp[];
  readonly onFailure: readonly GraphOp[];
  readonly failBehavior: StepFailBehavior;
  readonly narrativeTemplate?: string;
  readonly successMetadata?: ActionStepOutcomeMetadata;
  readonly failureMetadata?: ActionStepOutcomeMetadata;
  /** Narrative afterimage shown in Scene So Far on success (replaces bare "Succeeded"). */
  readonly successAfterimage?: string;
  /** Narrative afterimage shown in Scene So Far on failure (replaces bare "Failed"). */
  readonly failureAfterimage?: string;
  /** Band-specific afterimage overrides. When present, these take priority over
   *  successAfterimage/failureAfterimage for the named outcome band.
   *  When absent, falls back to successAfterimage or failureAfterimage with a
   *  `[band]` debug prefix so missing content is visible without breaking players. */
  readonly successAtCostAfterimage?: string;
  readonly criticalSuccessAfterimage?: string;
  readonly criticalFailureAfterimage?: string;
  /** THR-773: authored nudge hand for this step. Absent ⇒ no hand, no nudge path. */
  readonly nudges?: readonly StepNudge[];
  /**
   * THR-820: ≤`REACH_PURPOSE_MAX_WORDS` (4) words, plain — what this step is
   * *testing*, rendered beside the reach in the test panel. "Read the lock",
   * not "The mason's puzzle awaits". Absent ⇒ the panel renders reach +
   * difficulty alone, which is what every pre-nudge template does.
   */
  readonly purposeLine?: string;
  /**
   * THR-820: authored for/against lines for the test panel. When present these
   * are the panel's factor lines; when absent it falls back to the contract's
   * unsigned `beat.forecast_factors`, which can only render `neutral`. Live
   * trait-variant lines are appended in either case — they are derived, not
   * authored here.
   */
  readonly factorLines?: readonly StepFactorLine[];
  /**
   * THR-892: outcome-keyed lines describing how the *previous* step's resolution
   * tilts this one. Resolved against `UnifiedAction.stepOutcomes[currentStep - 1]`,
   * so the first step of an encounter never draws one and a step whose predecessor
   * landed on an unauthored band draws nothing rather than a fallback.
   *
   * This is the one authored factor surface besides trait lines that survives the
   * variance rule — see {@link StepCarryoverFactorLine}.
   */
  readonly carryoverFactorLines?: Partial<Record<StepOutcome, StepCarryoverFactorLine>>;
}

// ─── Branching step support ────────────────────────────────────

/**
 * A branching step definition — the step to execute depends on
 * which choice the player made at a prior step.
 * Discriminated from ActionStep by the presence of `branchOnStep`.
 *
 * SCOPE (THR-191): step-level branching is exclusive to *branching
 * encounters* in `src/data/encounters/` (authored via the
 * `encounter-pipeline` skill). Linear-template encounters — guild,
 * social, tavern, combat, borderland — must NOT use ActionStepBranch.
 * Their player-choice surface is aftermath reactions and, optionally,
 * `BranchAwareAftermathConfig.variants`. If a linear template needs a
 * mid-quest fork, that is a signal it should be promoted to a branching
 * encounter, not that the linear format should carry step branching.
 * See `Docs/plans/2026-05-15-thr-191-actionstepbranch-linear-template-scope.md`.
 */
export interface ActionStepBranch {
  /** Step index (0-based) whose choiceId determines the variant. */
  readonly branchOnStep: number;
  /** Map from choiceId → step definition. */
  readonly variants: Readonly<Record<string, ActionStep>>;
  /** Fallback step if the choice was not recorded (e.g., disregarded). */
  readonly fallback: ActionStep;
  /**
   * Opt-in: let the **acting mortal** decide this fork from who they are,
   * instead of waiting for a recorded `choiceId` (THR-894).
   *
   * Absent ⇒ today's behavior exactly: the branch reads `choiceHistory` for a
   * `choiceId` and falls back when none is there. That path is why branches
   * authored *today* can only ever take `fallback` — the one thing that ever
   * recorded a `choiceId` was the retired player-pick (`authoredChoices`).
   *
   * Present ⇒ at the moment `branchOnStep` resolves, the engine reads the
   * mortal's live position on {@link BranchPoleDecision.axis} (their standing
   * `AxiologicalProfile` baseline plus accumulated drift), adds the net
   * {@link StepNudge.poleLean} of the cards the god committed on that step, and
   * records the resulting key through the **existing** choice-history path.
   * `variants` must then key exactly the decision's keys — `'positive'` /
   * `'negative'` in pole mode, the declared route keys in route mode — so the
   * decision arrives at `resolveStepDefinition` as an ordinary recorded choice
   * and no second branch-resolution path exists.
   *
   * The player never picks. They lean; the mortal chooses; the choice is theirs
   * to keep — it drifts their axis toward the pole they took.
   */
  readonly decidedBy?: BranchDecision;
}

/**
 * A two-pole agent-decided fork (THR-894): one axis, two opposed answers.
 *
 * The question is *which way* a mortal leans, so `variants` key `'positive'` and
 * `'negative'` and the decision is a signed number collapsed to a side.
 */
export interface BranchPoleDecision {
  /** The value axis this fork is a question about. */
  readonly axis: ValuePair;
}

/**
 * One course toward the objective in an N-route fork (THR-898).
 *
 * A route is not a pole. Poles are the two ends of one question; routes are
 * several *different* questions pointing at the same door — bribe the wainwright
 * (Gold), intimidate him (Iron), win him over (Heart). What separates them is
 * primarily **capability**: the mortal takes the course they are actually good
 * at, which is why {@link reach} is required and {@link axis} is not.
 */
export interface BranchRoute {
  /** Variant key this route selects. Unique within the branch. */
  readonly key: string;
  /** The reach whose capability makes this course come naturally to the mortal. */
  readonly reach: ReachDomain;
  /**
   * Optional value axis this course *also* speaks to. Present ⇒ the mortal's
   * standing on it counts toward the route, and taking the route drifts them —
   * exactly as a two-pole decision does. Absent ⇒ the route is a pure question
   * of competence and nothing drifts.
   */
  readonly axis?: ValuePair;
  /** Which pole of {@link axis} this course sits at. Required when `axis` is present. */
  readonly toward?: BranchPoleKey;
}

/**
 * An N-route agent-decided fork (THR-898): several courses, one objective.
 *
 * `variants` must key exactly the declared route keys — same contract as pole
 * mode, same reason (a key that matches nothing is silently unreachable
 * forever, the THR-844 shape).
 */
export interface BranchRouteDecision {
  readonly routes: readonly BranchRoute[];
}

/**
 * Configuration for an agent-decided branch: two poles (THR-894) or N routes
 * (THR-898). Discriminated by the presence of `routes` — see
 * {@link isRouteDecision}.
 */
export type BranchDecision = BranchPoleDecision | BranchRouteDecision;

/** Type guard: distinguish an N-route decision from a two-pole one. */
export function isRouteDecision(decision: BranchDecision): decision is BranchRouteDecision {
  return 'routes' in decision;
}

/**
 * A step in a template is either a concrete ActionStep or a branch point.
 */
export type ActionStepOrBranch = ActionStep | ActionStepBranch;

/** Type guard: distinguish branching steps from concrete steps. */
export function isActionStepBranch(step: ActionStepOrBranch): step is ActionStepBranch {
  return 'branchOnStep' in step;
}

/**
 * Branch-aware aftermath — different summaries per choice path.
 * Resolved at aftermath assembly time by inspecting choice history.
 */
export interface BranchAwareAftermathConfig {
  /** Step index (0-based) whose choiceId determines the aftermath variant. */
  readonly branchOnStep: number;
  /** Map from choiceId → aftermath definition. */
  readonly variants: Readonly<Record<string, AftermathVariant>>;
  /** Fallback aftermath if choice was not recorded. */
  readonly fallback: AftermathVariant;
}

export interface AftermathVariant {
  readonly overview: string;
  readonly changes: readonly EncounterAftermathChange[];
  readonly reactionPrompt?: string;
  readonly reactions?: readonly EncounterAftermathReaction[];
  /**
   * Outcome-banded overrides of this variant (THR-969) — the ending reflects how
   * the encounter ended, not only which route was taken.
   *
   * Optional and additive (NFP #6): a variant without it resolves exactly as it
   * did before this field existed. Authored on the variant itself, so both a
   * choice-keyed `variants[choiceId]` entry and the `fallback` may carry bands —
   * which is what lets a choice-less encounter (`encounter.slice.unsafe_bridge`)
   * have distinct endings at all.
   */
  readonly byOutcome?: Readonly<Partial<Record<UnifiedActionOutcome, AftermathOutcomeOverride>>>;
}

/**
 * One outcome band's authored overrides of an {@link AftermathVariant} (THR-969).
 *
 * Every field is optional and layers over the un-banded variant field by field,
 * so a band may restate only what actually differs — a band that changes the
 * closing paragraph but keeps the same consequences authors `overview` alone.
 */
export interface AftermathOutcomeOverride {
  readonly overview?: string;
  readonly changes?: readonly EncounterAftermathChange[];
  readonly reactionPrompt?: string;
  readonly reactions?: readonly EncounterAftermathReaction[];
}

/**
 * Layer an outcome band's overrides onto an already-chosen aftermath variant (THR-969).
 *
 * A band the variant does not author leaves every field as the un-banded variant
 * had it — fail-soft by construction (NFP #4), so an encounter ending in an
 * outcome nobody wrote prose for still renders its base ending rather than
 * throwing or blanking.
 *
 * Keyed on `UnifiedActionOutcome` — the value `UnifiedAction.outcome` actually
 * carries at the aftermath assembly site. Deliberately NOT the five-band
 * `EncounterOutcomeBand` (a trace type), NOT the six-value `StepOutcome`, and NOT
 * `OutcomeBand` from `outcomeConsequences.ts`; each would type-check while being
 * the wrong domain — the same trap {@link StepNudge}'s `bandProse` documents.
 */
export function applyAftermathOutcomeBand(
  variant: AftermathVariant,
  outcome?: UnifiedActionOutcome,
): AftermathVariant {
  if (!outcome) return variant;
  const band = variant.byOutcome?.[outcome];
  if (!band) return variant;
  return {
    ...variant,
    overview: band.overview ?? variant.overview,
    changes: band.changes ?? variant.changes,
    reactionPrompt: band.reactionPrompt ?? variant.reactionPrompt,
    reactions: band.reactions ?? variant.reactions,
  };
}

/**
 * Resolve the authored aftermath variant for a finished encounter (THR-969).
 *
 * Resolution order is **choice → outcome band → base variant → fallback**: the
 * choice keying (THR-191) picks the variant, then {@link applyAftermathOutcomeBand}
 * layers the band on top of it. Pure lookup, no PRNG — the band is read from the
 * already-resolved outcome, so this adds no rng to the tick (NFP #3).
 *
 * Single implementation on purpose. The engine's aftermath assembly and the stage
 * adapter each had their own copy of the choice lookup; two resolvers over one
 * authored config is the shape that silently drifts, and a UI copy that missed the
 * band would render the un-banded ending the engine had already resolved past.
 *
 * Fail-soft on a config with no reachable base (THR-1038, NFP #4). `fallback` is
 * declared required, so a config that arrives without one is already outside the
 * type — but the red baseline (THR-489) means such a literal compiles, and 15
 * shipped mercenary templates did exactly that. The old body then read `byOutcome`
 * off `undefined` and threw on *every* resolved action, swallowed by the tick
 * loop's fail-soft envelope: no crash, no red test, and the authored aftermath
 * silently reaching nobody. Returning the empty variant keeps the tick loop's
 * contract without pretending the content is fine — the loud gate is the corpus
 * test in `unifiedTemplateAftermathReachability.test.ts`, which fails on a config
 * missing its fallback rather than waiting for a player to walk into it.
 */
export function resolveAftermathVariant(
  config: BranchAwareAftermathConfig,
  choiceHistory?: readonly EncounterChoiceMemory[],
  outcome?: UnifiedActionOutcome,
): AftermathVariant {
  const branchChoice = choiceHistory?.find(c => c.stepIndex === config.branchOnStep);
  const base = branchChoice
    ? config.variants[branchChoice.choiceId] ?? config.fallback
    : config.fallback;
  return applyAftermathOutcomeBand(base ?? EMPTY_AFTERMATH_VARIANT, outcome);
}

/**
 * The variant substituted when a config carries no reachable base (THR-1038).
 *
 * Deliberately empty rather than apologetic: an aftermath surface renders nothing
 * for it, which is what "this template has no authored ending" should look like.
 * A placeholder sentence here would ship prose no author wrote.
 */
export const EMPTY_AFTERMATH_VARIANT: AftermathVariant = Object.freeze({
  overview: '',
  changes: Object.freeze([]) as readonly EncounterAftermathChange[],
});

/**
 * One slot's authored prose variants along one identity axis (THR-573).
 *
 * `variants` maps an axis value (a `sublocationTypeId` for the `place` axis, an
 * `npcRole` for `counterpartRole`) to the authored fragment for that value, and MUST
 * carry the `'*'` default key. That declared-default invariant — transplanted from the
 * `{cast:*}` system — is what lets authored prose reference its own slots unguarded:
 * a declared slot always resolves, so an unmapped context degrades to the default
 * rather than leaking a raw token. Resolution is a pure lookup, no PRNG.
 */
export interface ContextFragmentSet {
  /** Slot name referenced from prose as `{frag:<slot>}`, e.g. 'opening'. */
  readonly slot: string;
  /** Identity axis this slot varies on — see `SURFACE_FRAGMENT_AXES`. */
  readonly axis: 'place' | 'counterpartRole' | 'setting';
  /** axisValue -> authored prose. MUST contain the `'*'` default key. */
  readonly variants: Readonly<Record<string, string>>;
}

export interface UnifiedActionTemplate {
  // Identity
  readonly id: string;
  /** Narrative significance tier. Drives visual treatment and TB-100 unlock system. */
  readonly rarityTier: RarityTier;
  /** Attention tier classification — controls how this action surfaces to the player. */
  readonly intrinsicTier: AttentionTier;
  readonly name: string;
  readonly reach: ReachDomain;
  readonly crudType: 'create' | 'read' | 'update' | 'delete';

  // Scale & Priority
  readonly scale: ActionScale;

  // Steps (1 = simple, 2+ = encounter-like)
  readonly steps: readonly ActionStepOrBranch[];

  // Costs
  readonly apCost: number; // typically 1
  readonly essenceCost?: number; // divine actions only
  /**
   * Opt-in for a target-derived price (THR-1073). Absent → `essenceCost` is the
   * price, as it is for every other card in the catalog.
   *
   * `'target_tier_scaled'` reads the authored ramp in `attachment-tier-content.ts`
   * indexed by the target artifact's current tier, so advancing Mythic→Legendary
   * costs more than Mundane→Storied. Declarative rather than a function for the
   * reason given on {@link ActionStep.difficultyContext}: the template is
   * serialized into the generated action catalog, where a function would vanish.
   *
   * Pair it with `difficultyContext: 'target_tier_scaled'` on the step — the
   * markers sit at two levels because the two numbers do (price is per-template,
   * difficulty is per-step). Resolved through `tierScaledEssenceCost`, which is
   * the only reader; see `src/engine/targetTierScaling.ts`.
   */
  readonly essenceCostContext?: 'target_tier_scaled';

  // Filtering
  readonly actorAffinities: readonly ActorType[];
  /**
   * Minimum living company members required for this template to be eligible
   * (THR-74). Only meaningful on templates whose `actorAffinities` include
   * `'group'`; party-exclusive content sets it to 2+, so a lone agent — or a
   * company whittled down below the floor — never draws it. Omit → no floor,
   * which is the correct default for a template a solo agent may also take.
   */
  readonly minGroupMembers?: number;
  /**
   * Only eligible when an opposing band shares the drawer's hex (THR-731).
   *
   * Set by the confrontation family, whose whole subject is a specific enemy: a
   * Den Assault with no den to assault, or a Guild Falls with no guild standing
   * in the way, is an encounter about nobody. The gate is a template flag rather
   * than an id list in the engine so the predicate stays authorable — a later
   * confrontation opts in by declaring it, not by being added to a set that rots.
   */
  readonly requiresOpposingBand?: boolean;
  /**
   * A decisive loss in a group contest on this template never kills (THR-731).
   *
   * The casualty roll is otherwise unconditional on a decisive loss, which would
   * make every rung of band conflict the same rung. The Standoff exists precisely
   * so conflict at company scale is not only ever slaughter: losing it costs
   * cohesion, standing, and the ground — not a life. Omit for the ordinary lethal
   * default.
   */
  readonly contestNonLethal?: boolean;
  /**
   * Drawable by a **broken** mortal (THR-773). Broken agents are excluded from
   * all candidacy except templates that opt in here — the WS5 rebuild encounters
   * that form the road back out. Omit for the ordinary default: a broken mortal
   * is out of the story until they mend.
   *
   * Inert until `BROKEN_GATE_ENABLED` flips (a WS5 Done-when, gated on those
   * rebuild encounters actually existing).
   */
  readonly drawableWhileBroken?: boolean;
  /**
   * Trait gate (THR-801) — every predicate must be satisfied for this template
   * to be drawable. Evaluated in `filterByPrerequisites` (stage 3 of the encounter
   * filter pipeline) through the shared THR-786 resolver, so each `traitId` is a
   * **ref**: node id, short id, display name, or tag, matched on ANY-of.
   *
   * The engine side shipped with THR-773/THR-786 while this declaration did not,
   * which made the field a phantom API — read every tick, declarable by nobody,
   * and the source of all eight of `encounterFilterPipeline.ts`'s baseline type
   * errors. Declaring it here is what makes the gate authorable at all.
   *
   * Asymmetry with `blockedByTraits` is deliberate: a requirement can demand a
   * level, an exclusion cannot (see below).
   */
  readonly requiredTraits?: readonly TraitPredicate[];
  /**
   * Trait gate (THR-801) — holding **any** of these refs excludes this template.
   *
   * Bare ref strings, not predicates: there is no `minLevel`, because holding a
   * blocking trait at any level blocks. Each is lifted to a level-free
   * `TraitPredicate` at the match site. Item-granted keys (THR-737) block
   * symmetrically, so an item conferring a trait cannot open that trait's gated
   * content while leaving its blocked content reachable.
   */
  readonly blockedByTraits?: readonly string[];
  /**
   * Trait-conditional variants (THR-773). Applied when the acting agent holds
   * the named trait: contributes a forecast modifier, a difficulty delta, a
   * player-facing factor line, and/or extra nudge cards into the hand.
   */
  readonly traitVariants?: readonly TraitVariant[];
  readonly locationSubtypes?: readonly string[];
  readonly sphereAffinity?: SphereName;

  /**
   * Reach domain this template requires (THR-503). When set, the reach gate in
   * getTargetActionSlots() hides the card unless the ascendant holds this reach
   * (affinity ≥ REACH_GATE_MIN_AFFINITY). Because an ascendant's reaches are
   * fixed at creation, this is a permanent filter — never surfaced as aspiration.
   * Omit → no reach restriction (backward compatible).
   */
  readonly requiresReach?: ReachDomain;

  // ── Target filtering ──────────────────────────────────────────────

  /**
   * Which node categories this template can target.
   * Omit or empty → defaults to ['actor'] for backward compatibility.
   */
  readonly targetCategories?: readonly TargetCategory[];

  /**
   * Subtypes of the target node this template applies to.
   * Checked against TargetContext.subtype.
   * Omit or empty → no subtype restriction.
   */
  readonly targetSubtypes?: readonly string[];

  /**
   * Node property key/value pairs that must all be present on the target.
   * Checked against TargetContext.properties (AND logic — all must match).
   * Omit or empty → no property restriction.
   *
   * Example: { locationSubtype: 'settlement' } to target only settlements.
   */
  readonly requiredNodeProperties?: Readonly<Record<string, unknown>>;

  /**
   * Trait IDs that must be present on the target node.
   * All listed traits must be present (AND logic).
   * Omit or empty → no trait restriction.
   */
  readonly requiredTargetTraits?: readonly string[];

  // ── Layer revelation gating ─────────────────────────────────────

  /**
   * Which narrative layer this template belongs to.
   * Used for Gate 7 (revelation gating) in getTargetActionSlots().
   * Templates without this field are not revelation-gated (backward compatible).
   */
  readonly narrativeLayer?: NarrativeLayer;

  /**
   * If true, this template bypasses layer revelation gating. Default: false.
   * Typically true for Create actions — you're bringing something new into existence.
   */
  readonly bypassRevelationGate?: boolean;

  // ── Duration mode ──────────────────────────────────────────────

  /** 'instant' (default) = fire-and-forget. 'sustained' = spawns ControlEffect on success. */
  readonly durationMode?: 'instant' | 'sustained';

  /** Only for durationMode: 'sustained'. Defines the persistent effect. */
  readonly controlSpec?: ControlSpec;

  // ── Revelation action marker ────────────────────────────────────

  /**
   * If present, this action triggers resolveRevelationAction on completion.
   * Values: 'observe' | 'scry' | 'whisper_insight' | 'dream_sending'
   * (extensible — any string routes to revelationEmitter.resolveRevelationAction)
   */
  readonly revelationAction?: string;

  // Contestation
  readonly contestsWith?: readonly string[];

  // Selection
  readonly motivations: readonly ValuePair[];

  // Narrative
  readonly narrativeTemplates: {
    readonly initiation: string;
    readonly success: string;
    readonly failure: string;
    readonly contested?: string;
  };
  /** Optional authored foreshadowing variants for encounter-pool previews (THR-389). */
  readonly foreshadowing?: EncounterForeshadowingDefinition;

  /** Evocative spell-like display name (Ars Magica style, max 3 words).
   * Replaces `name` in focused card spell-name zone.
   * Current `name` is kept for engine/debug identification. */
  readonly spellName?: string;

  /** Qualitative game-mechanical description — 2-3 sentences, no numbers.
   * Shown in the focused card description text box.
   * If absent, ActionCard falls back to slot.description (narrativeTemplates.initiation). */
  readonly description?: string;

  /**
   * Technical game-mechanical statement of what this action does (THR-604).
   * 1–3 sentences, wiki-facing register — names the state that changes (node
   * property, edge, condition, resource, visibility), the direction/nature of the
   * change, and duration/persistence when relevant. Sourced from the resolving
   * code, NOT paraphrased from `description`. Magnitudes stay symbolic (name the
   * constant or say "scales with X") — never literal numbers (constants are
   * tunable, NFP #1). Distinct from `description`, which is atmospheric prose for
   * the in-game card. Consumed by the wiki catalog / Manual Designer-Notes layer
   * AND surfaced in-game (THR-610) as the ActionDrawer focused-card + Codex "Effect"
   * block — mechanical text, not atmospheric player prose. Omit → catalog renders
   * "—" + `unauthored`; the in-game Effect block is hidden entirely.
   */
  readonly technicalEffect?: string;

  /** Optional custom consequence message for toast/feed output.
   * If absent, falls back to narrativeTemplates.success/failure.
   * Hybrid field: allows selective customization without rewriting all templates. */
  readonly consequenceMessage?: {
    readonly success: string;
    readonly failure: string;
  };

  /**
   * Context-multiplication fragments (THR-573) — authored prose variants that bind to
   * the same identity axes the surface key is computed from, so the same template reads
   * as a different scene at a tavern versus a shrine. Referenced from prose fields with
   * the `{frag:<slot>}` token. Omit → the template renders exactly as it does today;
   * the whole layer is opt-in per template. See `src/engine/fragmentResolution.ts`.
   */
  readonly contextFragments?: readonly ContextFragmentSet[];

  /**
   * Setting envelope (THR-884) — the `SettingClass` list this template was authored
   * for. Advisory metadata on the converted template: the *enforcing* field is
   * `locationSubtypes`, which the converter expands this into and which
   * `encounterCache` filters on unchanged. Kept here so the coverage matrix and the
   * envelope-completeness test can read an envelope back off a live template
   * without re-deriving it from 20 subtypes.
   */
  readonly settings?: readonly string[];

  /**
   * Per-setting-class opening paragraphs (THR-884). Checklist questions 1–4 (where
   * are we, how does it feel, who is here, what must we know) live in the opening;
   * the complication, stakes, and hand are setting-neutral. So one template is one
   * shared spine plus one authored opening per declared class.
   *
   * The converter compiles this into a `ContextFragmentSet` on the reserved
   * `opening` slot and points the first step's prose at `{frag:opening}`, so
   * resolution is the existing THR-573 path with no second mechanism. A template
   * that declares `openings` must cover every class in its `settings` — enforced
   * build-time, fail loud (`settingClasses.test.ts`).
   */
  readonly openings?: Readonly<Record<string, string>>;

  /** Encounter-network support that should be resolved at action start. */
  readonly supportBundle?: EncounterSupportBundle;
  /** Optional scrutiny/proof shell configs migrated from encounter packets. */
  readonly clearanceGates?: readonly ClearanceGateConfig[];
  /** Branch-aware aftermath config. If present, overrides default aftermath assembly. */
  readonly aftermathConfig?: BranchAwareAftermathConfig;

  /**
   * Concept art image URL for the encounter opening scene.
   * Shown above the scene prose at step 0. Relative to public/ root.
   * Example: '/concept-art/encounters/flawed-steel.jpg'
   */
  readonly illustrationUrl?: string;

  /**
   * Alt text for the concept art image (accessibility).
   */
  readonly illustrationAlt?: string;

  /**
   * Authored choice cards per step. When present, these replace the generic
   * "Tip the scales" / "Let it play out" choices with scene-specific
   * approach cards that have prose bodies, cost justification, and risk text.
   *
   * Keys are step indices. Each step maps to an array of authored choices.
   * The choice `id` must match the `ActionStepBranch` variant key so the
   * branch resolution picks up the player's choice correctly.
   */
  readonly authoredChoices?: Readonly<Record<number, readonly AuthoredChoiceCard[]>>;

  /**
   * When present, triggers secret discovery aftermath on success.
   * Drives secretGeneration.ts — creates `knows_secret_of` edges.
   */
  readonly secretDiscovery?: {
    readonly onSuccess: boolean;
    readonly sourceName: import('./encounter').SecretDiscoverySource;
  };

  /**
   * When present, creates an `owes_favor` edge on success — the encounter's
   * subject becomes indebted to the actor. Read at the newly-resolved transition
   * by `secretsFromResolution.ts` (THR-724). `context` is the prose reason the
   * debt exists, surfaced in the chronicle when the favor is broken.
   */
  readonly favorGeneration?: {
    readonly onSuccess: boolean;
    readonly magnitudeRange: readonly [number, number];
    readonly context: string;
  };

  /**
   * Explicit reputation polarity override. When set, overrides the heuristic
   * in phaseReputationTraits.ts for templates where the default crudType mapping
   * would produce the wrong sign (e.g. 'threaten' templates that are read/explore).
   */
  readonly reputationPolarity?: 'positive' | 'negative';

  /**
   * Explicit ascendant action tray tier. When present, classifyTrayTier returns
   * this value directly (after the rare override for rarityTier >= 3 / story_beat).
   * Omit on most templates — the fallback inference uses target structure.
   */
  readonly trayTier?: 'core' | 'self' | 'rare';

  /**
   * Starter-floor marker (THR-419).
   * Starter actions are always visible, even without explicit unlocks.
   */
  readonly starter?: boolean;
}

/**
 * An authored choice card with scene-specific prose, cost, target, and risk.
 * Replaces the generic intervention choices when present on a template.
 */
export interface AuthoredChoiceCard {
  /** Must match the ActionStepBranch variant key for branch resolution. */
  readonly id: string;
  /** Scene-specific label: "Forge the Truth" not "Help them". */
  readonly label: string;
  /** Full prose paragraph describing what the intervention feels like. */
  readonly intent: string;
  /** Which entity this choice targets: "Maren Ironhewn". */
  readonly targetLabel?: string;
  /** Essence cost for this choice. */
  readonly essenceCost: number;
  /** Narrative risk: "The guild may never trust her the same way again." */
  readonly likelyBurden?: string;
  /** Maps to interventionType for backend compatibility. */
  readonly interventionType: 'supportive' | 'coercive' | 'withdrawn';

  /**
   * Authored moral-axis tilt (THR-528). Declares which canonical axis this choice
   * pushes the actor along, toward which pole, and how hard — replacing the
   * inferred `toEncounterArchetypePole` heuristic (interventionType → pole). When
   * omitted, the contract/drift resolvers fall back to that heuristic so
   * un-migrated cards keep working.
   *
   * - `moralAxis` — the Reach whose virtue/vice axis the choice tilts. Defaults to
   *   the step/template reach when omitted.
   * - `pole` — `'virtue'` tilts toward the reach's virtue pole, `'vice'` toward the
   *   vice pole. (Canonical THR-524 vocabulary; mapped to the legacy `virtue|flaw`
   *   drift sign at the commit boundary.)
   * - `magnitude` — unsigned drift strength on the canonical 0.05–0.20 scale.
   */
  readonly moralAxis?: ReachDomain;
  readonly pole?: 'virtue' | 'vice';
  readonly magnitude?: number;
}

// Scale priority for tick resolution ordering (lower = resolves first)
export const SCALE_PRIORITY: Record<ActionScale, number> = {
  cosmic: 0,
  regional: 1,
  local: 2,
  personal: 3,
};

// Runtime action instance
export type UnifiedActionOutcome =
  | 'success'
  | 'failure'
  | 'contested_won'
  | 'contested_lost'
  | 'critical_success'
  | 'critical_failure'
  | 'success_at_cost';

/** Phase 3: Check if a step outcome is any form of success (including at cost). */
export function isStepSuccess(outcome: StepOutcome): boolean {
  return outcome === 'critical_success' || outcome === 'success' || outcome === 'success_at_cost' || outcome === 'near_miss';
}

/** Phase 3: Check if a step outcome is any form of failure. */
export function isStepFailure(outcome: StepOutcome): boolean {
  return outcome === 'failure' || outcome === 'critical_failure';
}

/**
 * THR-1041: pick the afterimage a step authored for a *resolved outcome band*,
 * falling back to the coarse success/failure line when the band has no bespoke
 * prose. Returns `undefined` only when the step authored neither — the caller
 * owns the bare "Succeeded"/"Failed" last resort, because the two callers word
 * it differently (the veil shows it to a player, the chapter ledger archives it).
 *
 * This lives here, next to `isStepSuccess`, because it has **two** consumers and
 * they used to disagree: `chapterArchive` resolved the band while the encounter
 * stage model resolved only success-vs-failure, so the same resolved step read
 * back one way in the ledger and another in Scene So Far. A band-specific
 * afterimage an author wrote for `critical_failure` reached the archive and
 * never reached the surface that narrates the scene (audit finding 6,
 * `Docs/audits/2026-08-08-encounter-composition-audit.md`).
 *
 * `near_miss` deliberately maps to `successAfterimage`: `isStepSuccess` counts
 * it as a success, so the step *advanced*, and prose describing a failure would
 * contradict the ladder the player just watched.
 */
export function afterimageForOutcome(step: ActionStep, outcome: StepOutcome): string | undefined {
  switch (outcome) {
    case 'critical_success':
      return step.criticalSuccessAfterimage ?? step.successAfterimage;
    case 'success':
    case 'near_miss':
      return step.successAfterimage;
    case 'success_at_cost':
      return step.successAtCostAfterimage ?? step.successAfterimage;
    case 'critical_failure':
      return step.criticalFailureAfterimage ?? step.failureAfterimage;
    case 'failure':
      return step.failureAfterimage;
    default:
      return undefined;
  }
}

/**
 * Step-level outcome from the shared resolution service.
 * Phase 3: expanded from binary success/failure to the full outcome ladder.
 * `success_at_cost` means the step completed but with a penalty attached.
 * `near_miss` (Phase 6): dice success in the near-miss zone — step advances but with
 *   partial growth credit and no Q delta. Distinct from shaper-shifted `success_at_cost`.
 */
export type StepOutcome = 'critical_success' | 'success' | 'success_at_cost' | 'near_miss' | 'failure' | 'critical_failure';

export interface UnifiedAction {
  readonly actionId: string;
  readonly actorId: string;
  readonly templateId: string;
  readonly targetId: string;

  // Priority
  readonly scale: ActionScale;
  readonly source: ActionSource;
  readonly startTick: number;

  // Step progression
  readonly currentStep: number; // 0-indexed
  readonly stepProgress: number; // ticks completed on current step
  readonly stepDuration: number; // total ticks for current step

  // Resources (already deducted on creation)
  readonly essencePaid?: number;

  // Contestation
  readonly contestedWith?: string; // actionId of opposing action
  /**
   * THR-731 — the opposing *group* this action is set against (a band, or the
   * company a band's counter answers). The contestation detector's group pass
   * pairs on this plus {@link counterToActionId}; `contestsWith` template lists
   * are untouched and still drive every non-group contest.
   *
   * Additive/optional: an action without it takes the ordinary uncontested path.
   */
  readonly opposingGroupId?: string;
  /**
   * THR-731 — set only on a *synthesized* band counter-action, naming the action
   * it answers. Its presence is what marks a side as the defender of a group
   * contest (bands answer; they never initiate the pair), so the detector needs
   * no scale/FIFO tiebreak and the pairing is deterministic by construction.
   */
  readonly counterToActionId?: string;

  // Resolution
  readonly resolved: boolean;
  readonly outcome?: UnifiedActionOutcome;
  readonly completedAtTick?: number; // tick when resolved became true (set by orchestrator cleanup)
  readonly stepOutcomes: readonly StepOutcome[]; // per-step results
  /**
   * THR-571: the polarity of any mid-action critical step, preserved through final-outcome
   * aggregation so prose/aftermath can reference a fluke of brilliance (or a disaster survived)
   * even when the final outcome collapses to success_at_cost. 'failure' wins over 'success' when
   * both are present; null when no step classified as a critical. Additive/optional — old saves
   * and externally-completed actions (contestation) simply omit it.
   */
  readonly hadCriticalStep?: 'success' | 'failure' | null;
  /** Remembered player-facing encounter interventions keyed by step. */
  readonly choiceHistory?: readonly EncounterChoiceMemory[];
  /** Player has chosen to stop interfering; remaining beats resolve on mortal terms. */
  readonly disregardRemaining?: boolean;
  /** Effective attention tier — computed at action creation, may be promoted mid-encounter. */
  readonly effectiveTier?: AttentionTier | 'invisible';
  /**
   * THR-773: ids of the `StepNudge` cards the player committed to the current
   * step. Essence is already spent by the time these are present — a commit that
   * loses the race for an empty pool never lands here. Absent/empty ⇒ the
   * pre-nudge resolution path, byte for byte.
   */
  readonly activeNudges?: readonly string[];
  /** Rarity tier after Focus buff was applied at action creation (THR-416). Prefer this over template.rarityTier at read sites. */
  readonly effectiveRarityTier?: RarityTier;
  /** Reuse-first binding of encounter support cast/places resolved at action start. */
  readonly supportBindings?: readonly EncounterSupportBinding[];
  /** Persistent clearance/scrutiny shell instances bound at action start. */
  readonly clearanceGateIds?: readonly string[];
  /** Accumulated world-facing deltas across resolved steps, used to build the final aftermath summary. */
  readonly aftermathChanges?: readonly EncounterAftermathChange[];
  /** World-facing summary of what changed because this encounter resolved. */
  readonly aftermathSummary?: EncounterAftermathSummary;
  /**
   * THR-530: set once the autonomous in-encounter chooser has applied this
   * action's aftermath for a non-player, non-threaded actor. Idempotency guard
   * so `phaseAutonomousAftermath` does not re-apply the same reaction every tick
   * (non-hero agents receive no `encounterNotification` to mark resolved). The
   * player/threaded path is unaffected — it resolves via notifications.
   */
  readonly autonomousAftermathApplied?: boolean;
  /**
   * THR-1112: the tick at which `autonomousAftermathApplied` was set. Lets a later
   * manual path (CLI `aftermath pick`, the debug bridge) refuse a second application
   * and say *when* the tick loop already ran it, instead of silently re-applying every
   * effect. Additive/optional — a flag set before this field existed, or by any path
   * that omits it, degrades to a notice without a tick rather than to a re-apply.
   */
  readonly autonomousAftermathAppliedTick?: number;
  /**
   * THR-727: set once `processPlayerReceipts` has emitted the Divine Receipt for this
   * resolved, player-sourced action. Idempotency guard mirroring
   * `autonomousAftermathApplied` — the scan skips flagged actions on later ticks so a
   * receipt is enqueued exactly once. Additive/optional; old saves and non-player
   * actions simply omit it.
   */
  readonly playerReceiptEmitted?: boolean;
  /**
   * Per-step complication results (parallel to stepOutcomes).
   * Null entries indicate the step had no complication or was a success tier.
   * Used by the UI to display complication prose alongside step narratives. (THR-20)
   * Typed as readonly unknown[] here to avoid a circular type dependency with complication.ts.
   * Cast to ComplicationResult at consumer sites.
   */
  readonly stepComplications?: readonly (StepComplicationSlot | null)[];
  /**
   * THR-636: per-resolved-step replay records — the enriched prose the player
   * saw at each step's resolution, frozen so the encounter step-navigator can
   * replay a past step without re-enriching against a moved-on world. Additive/
   * optional; capped at STEP_PROSE_HISTORY_MAX (drop-oldest). Typed as
   * readonly unknown[] here to avoid widening unifiedAction.ts's import graph;
   * cast to StepProseRecord[] at consumer sites (src/types/stepProseRecord.ts).
   */
  readonly stepProseHistory?: readonly unknown[];
  /** Graph event node ID created when this action's first step resolved (THR-143). */
  readonly eventNodeId?: string;
  /** Source event node ID to emit a caused_by edge on first step resolution (THR-143). Cleared after use. */
  readonly pendingCausationSourceEventId?: string;
  /** Seed ID that spawned this action, for causation edge properties (THR-143). */
  readonly spawnedFromSeedId?: string;
  /** Seed label that spawned this action, for causation edge properties (THR-143). */
  readonly spawnedFromSeedLabel?: string;
}

/**
 * Opaque slot for a complication result stored on a UnifiedAction step.
 * Defined here to avoid circular imports between unifiedAction.ts and complication.ts.
 * The actual runtime value is a ComplicationResult from src/types/complication.ts.
 */
export interface StepComplicationSlot {
  readonly templateId: string;
  readonly category: string;
  readonly severity: 'minor' | 'standard' | 'severe';
  readonly prose: string;
  readonly name: string;
  readonly narrativeTag: string;
  readonly significanceBoost: number;
}
