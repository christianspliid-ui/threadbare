/**
 * consumption-ledger-sources — THR-1212 slice 4.
 *
 * The curated half of `generate-consumption-ledger`. Membership is derived from
 * source (the `EncounterAftermathReactionEffect` union and `GraphOpType`); what
 * each member's write is *for*, and who acts on it, is not machine-derivable and
 * lives here — one row per member, with the guards that keep the two halves
 * honest.
 *
 * ## Why a row cannot simply say "yes, something reads it"
 *
 * Distinction 2 of the program epic (THR-1156) is **acted-on vs merely recorded**,
 * and the whole point is that "a reader exists" does not answer it. Two failures
 * this ledger exists to catch both have readers:
 *
 * - `clearance_gate_tag` writes `followOnTags`, and `unifiedActionResolution.ts`
 *   reads it — to render a chip saying *"A follow-on thread was seeded"*. The tag
 *   is read, described to the player, and then nothing in the game ever consults
 *   it again. A grep for readers reports this seam healthy.
 * - The Grateful Kin lesson (THR-1175): `favor_creation` had a consumer, and the
 *   consumer could not act on the operand it was actually being handed.
 *
 * So a row does not record *whether* it is read. It records **who reads it and
 * what that reader does** — and the class is *derived* from that, by
 * {@link classifyRow}, rather than asserted by whoever wrote the row. That
 * inversion is the design: an author who honestly fills in "the only reader
 * renders a sentence" gets `write-without-consumer` whether they expected it or
 * not.
 *
 * ## The taxonomy is settled, not invented here
 *
 * Ruled by Christian at the attended sitting of 2026-08-17 (THR-1161):
 *
 * - **acted-on** — a game entity was created, modified or deleted, and the player
 *   is told via an entity component. Awareness-scoped: fog and secrecy are exempt,
 *   the telling fires when the change enters awareness.
 * - **bookkeeping** — an invisible accumulator whose *result* surfaces at a
 *   tally-point. At the tally-point the surfaced result is itself acted-on.
 * - **dormant-hook** — explicitly *not* passive: it **spawns a real entity** (a
 *   seeded encounter, a timed attachment) carrying metadata that governs firing.
 *   Firing upgrades it to acted-on.
 *
 * That third definition is load-bearing here. A write that merely promises a
 * future consequence, with no entity spawned and no firing metadata, is **not** a
 * dormant hook — it is a `write-without-consumer`, which per the sitting is *"a
 * defect, not a class"*.
 *
 * ## Fabrication is a build failure, not a review problem
 *
 * {@link assertConsumerSitesResolve} reads every cited file and fails unless the
 * cited symbol is actually in it. A row is evidence only if the evidence exists,
 * and the cheapest way for this ledger to rot is a plausible citation nobody
 * checked — the interface map's discipline, for the same reason.
 */

// ─── The taxonomy ─────────────────────────────────────────────────────────────

/**
 * What a consumer *does* with the write. The distinction the whole ledger turns
 * on is `acts` vs `reports`: both are readers, and only one of them is a consumer
 * in the sense distinction 2 means.
 */
export type ConsumerKind =
  /** Reads it and changes simulation behaviour, or a game entity, as a result. */
  | 'acts'
  /** Mints a real entity carrying firing metadata — the dormant-hook substrate. */
  | 'spawns'
  /** Surfaces an accumulated result at a threshold or tally moment. */
  | 'tally-point'
  /** Renders a description of the write. Changes nothing. Not a consumer. */
  | 'reports';

/** The classes a row can derive. */
export type ConsumptionClass =
  | 'acted-on'
  | 'bookkeeping'
  | 'dormant-hook'
  | 'write-without-consumer';

export interface ConsumerSite {
  /** Repo-relative path. Read at generate time; a missing file fails the build. */
  readonly file: string;
  /** An identifier that must appear in {@link file}. The anti-fabrication check. */
  readonly symbol: string;
  readonly kind: ConsumerKind;
  /**
   * The operand constraint this consumer imposes, where one exists. The Grateful
   * Kin column (THR-1175): enforcement lives in per-seam guards, the ledger only
   * names them.
   */
  readonly operand?: string;
}

export interface LedgerRow {
  /** What the member actually writes, in state/graph terms. */
  readonly writes: string;
  readonly consumers: readonly ConsumerSite[];
  /**
   * Required when the row derives `write-without-consumer`. The interface map's
   * LEAKED→Deferral rule, reused verbatim: a known-dead write is legal only with
   * a cited ticket, and illegal silently.
   */
  readonly deferralTicket?: string;
  readonly note?: string;
}

export const acts = (file: string, symbol: string, operand?: string): ConsumerSite =>
  ({ file, symbol, kind: 'acts', operand });
export const spawns = (file: string, symbol: string, operand?: string): ConsumerSite =>
  ({ file, symbol, kind: 'spawns', operand });
export const tally = (file: string, symbol: string, operand?: string): ConsumerSite =>
  ({ file, symbol, kind: 'tally-point', operand });
export const reports = (file: string, symbol: string, operand?: string): ConsumerSite =>
  ({ file, symbol, kind: 'reports', operand });

/**
 * The class is **derived from the row's consumers**, never authored.
 *
 * Order matters and encodes the taxonomy: anything that already changes the game
 * is acted-on; a spawn with firing metadata is a hook awaiting its upgrade; an
 * accumulator that surfaces at a tally-point is bookkeeping; and a write whose
 * only readers describe it — or which has no reader at all — is the defect class.
 */
export function classifyRow(row: LedgerRow): ConsumptionClass {
  const kinds = new Set(row.consumers.map((c) => c.kind));
  if (kinds.has('acts')) return 'acted-on';
  if (kinds.has('spawns')) return 'dormant-hook';
  if (kinds.has('tally-point')) return 'bookkeeping';
  return 'write-without-consumer';
}

// ─── Source locations (derived membership) ────────────────────────────────────

export const AFTERMATH_TYPES_REL = 'src/types/unifiedAction.ts';
export const GRAPH_OP_TYPES_REL = 'src/types/graphOp.ts';

export const EFFECT_UNION_NAME = 'EncounterAftermathReactionEffect';
export const GRAPH_OP_UNION_NAME = 'GraphOpType';

/** The deferral carrying every `write-without-consumer` row this ledger finds. */
export const WRITE_WITHOUT_CONSUMER_TICKET = 'THR-1212';

// ─── Curated rows: aftermath effect kinds ─────────────────────────────────────

export const EFFECT_ROWS: Readonly<Record<string, LedgerRow>> = {
  reputation_score: {
    writes: "`reputationScore` on the target actor node",
    consumers: [acts('src/engine/effects/effectPredicates.ts', 'reputationScore')],
  },
  reputation_tally: {
    writes: "a keyed counter in `reputationTallies` on the target actor",
    consumers: [tally('src/engine/phaseReputationTraits.ts', 'reputationTallies')],
    note:
      'The 2026-08-16 ruling (THR-1136 §5) put reach tallies deliberately out of ' +
      'sight; the threshold trait mint is the tally-point where the accumulated ' +
      'result becomes a visible entity change.',
  },
  clearance_gate_tag: {
    writes: "a string appended to `followOnTags` on the runtime clearance-gate state",
    consumers: [reports('src/engine/unifiedActionResolution.ts', 'gateFollowOnSentence')],
    deferralTicket: 'THR-1212',
    note:
      'The single reader turns each new tag into a `future_hook` aftermath change ' +
      'titled "A follow-on thread was seeded", and that is the end of it: no ' +
      'encounter is seeded, no attachment is timed, no metadata governs firing, ' +
      'and nothing ever reads a tag back. Three tag conventions (`#watch_trusted`, ' +
      '`#papers_flagged`, `proven_master`) rot in one field. It fails the ' +
      'dormant-hook bar precisely because hooks are not passive — see the header.',
  },
  recent_event: {
    writes: "an event appended to the actor's `recentEvents` (and the tick event stream)",
    consumers: [acts('src/engine/ambitionTick.ts', 'recentEvents')],
  },
  encounter_seed: {
    writes: "a seed record in `pendingEncounterSeeds`",
    consumers: [spawns('src/engine/encounterSeeding.ts', 'evaluateEncounterSeeds')],
    note: 'The canonical dormant-hook substrate: `delayTicks` + `priority` are the firing metadata.',
  },
  quintessence_shift: {
    writes: "`quintessence` on the target actor",
    consumers: [acts('src/engine/brokenState.ts', 'isBrokenMortal')],
  },
  hidden_mark: {
    writes: "a mark appended to `state.hiddenMarks`",
    consumers: [
      acts('src/engine/encounterScoring.ts', 'hiddenMarks'),
      acts('src/engine/effects/effectPredicates.ts', 'hiddenMarks'),
    ],
    note: 'Awareness-scoped by design — hidden until its reveal route fires.',
  },
  intelligence: {
    writes: "a record appended to `state.intelligenceRecords`",
    consumers: [acts('src/engine/encounterScoring.ts', 'intelligenceRecords')],
  },
  intel_referenced_prose: {
    writes: "a narrative event into `recentEvents` naming a held intelligence record",
    consumers: [acts('src/engine/ambitionTick.ts', 'recentEvents')],
    note:
      'The prose *selection* is report-only; what makes the row acted-on is the ' +
      'event it appends, which is the same consumed buffer `recent_event` writes.',
  },
  reputation_set: {
    writes: "`reputationScore` on the target actor, set absolutely",
    consumers: [acts('src/engine/effects/effectPredicates.ts', 'reputationScore')],
  },
  apply_condition: {
    writes: "a `has_trait` edge from the carrier to the condition trait, carrying `durationTicks`",
    consumers: [acts('src/engine/conditionDecay.ts', 'decayConditions')],
  },
  grant_companion: {
    writes: "a companion actor node plus its retinue edge to the bearer",
    consumers: [acts('src/engine/companions.ts', 'getCompanions')],
  },
  remove_companion: {
    writes: "removal of a companion's retinue edge",
    consumers: [acts('src/engine/companions.ts', 'getCompanions')],
  },
  remove_condition: {
    writes: "removal of the condition's `has_trait` edge",
    consumers: [acts('src/engine/conditionDecay.ts', 'decayConditions')],
  },
  assign_ambition: {
    writes: "an ambition assignment on the actor",
    consumers: [acts('src/engine/ambitionLifecycle.ts', 'evaluateAmbitionProgress')],
  },
  condition_attachment: {
    writes: "a `has_trait` edge whose `durationTicks` is set from the attachment",
    consumers: [acts('src/engine/conditionDecay.ts', 'decayConditions')],
  },
  attachment_grant: {
    writes: "an attachment node owned by the bearer, carrying `effects[]`",
    consumers: [acts('src/engine/effectAura.ts', 'effects')],
  },
  spawn_artifact: {
    writes: "an artifact node plus an `owns` edge to the bearer",
    consumers: [acts('src/engine/effectAura.ts', 'effects')],
  },
  emit_omen: {
    writes: "an omen appended to `state.emittedOmens`",
    consumers: [acts('src/engine/phaseAgentDecision.ts', 'emittedOmens')],
  },
  plant_compulsion: {
    writes: "a compulsion in `state.plantedCompulsions`",
    consumers: [acts('src/engine/plantedCompulsion.ts', 'derivePlantedCompulsionEncounterBias')],
  },
  faction_splinter: {
    writes: "a new faction node and re-pointed `member_of` edges",
    consumers: [acts('src/engine/factionMembership.ts', 'member_of')],
  },
  faction_absorb: {
    writes: "re-pointed `member_of` edges and a merged reputation",
    consumers: [acts('src/engine/factionMembership.ts', 'member_of')],
  },
  faction_dissolve: {
    writes: "removal of a faction's `member_of` edges",
    consumers: [acts('src/engine/factionMembership.ts', 'member_of')],
  },
  faction_declare_war: {
    writes: "a `relates_to` edge between the factions with `basis: 'war'`",
    consumers: [acts('src/engine/ambitionTick.ts', 'relates_to')],
  },
  faction_force_peace: {
    writes: "a `relates_to` edge between the factions with a raised sentiment",
    consumers: [acts('src/engine/ambitionTick.ts', 'relates_to')],
  },
  signature_warhost: {
    writes: "a mobilised army force under the selected commander",
    consumers: [acts('src/engine/armyAttrition.ts', 'phaseArmyAttrition')],
  },
  sphere_influence_amplify: {
    writes: "a raised sphere-influence value on the target node",
    consumers: [acts('src/engine/agentLifecycle.ts', 'sphereInfluence')],
  },
  spawn_unique_location: {
    writes: "a location node placed on a resolved hex",
    consumers: [acts('src/engine/holdings.ts', 'grantHolding')],
  },
  thread_strengthen: {
    writes: "a raised `strength` on the ascendant's thread edge",
    consumers: [acts('src/engine/graphQueries.ts', 'getThreadTo')],
  },
  thread_weaken: {
    writes: "a lowered `strength` on the ascendant's thread edge",
    consumers: [acts('src/engine/graphQueries.ts', 'getThreadTo')],
  },
  thread_break: {
    writes: "removal of the ascendant's thread edge",
    consumers: [acts('src/engine/graphQueries.ts', 'getThreadTo')],
  },
  thread_branch: {
    writes: "a second thread edge to a newly threaded actor",
    consumers: [acts('src/engine/graphQueries.ts', 'getThreadTo')],
  },
  archetype_drift_register: {
    writes: "a drift delta in `state.archetypeDrift`",
    consumers: [acts('src/engine/encounters/branchDecision.ts', 'archetypeDrift')],
  },
  spawn_clue: {
    writes: "a clue node attached to a ruin",
    consumers: [acts('src/engine/ruins/clueLifecycle.ts', 'clue')],
  },
  secret_discovery: {
    writes: "a `knows_secret_of` edge marked discovered",
    consumers: [acts('src/engine/phaseSecretsFavors.ts', 'knows_secret_of')],
  },
  favor_creation: {
    writes: "an `owes_favor` edge from debtor to creditor",
    consumers: [
      acts(
        'src/engine/phaseSecretsFavors.ts',
        'owes_favor',
        'person-shaped debtor — a non-person endpoint is refused by the THR-1175 guards',
      ),
    ],
    note:
      'The Grateful Kin row. Its consumer existed all along; what it could not do ' +
      'was act on a town-shaped debtor. The operand column is that lesson.',
  },
  faction_reputation_gain: {
    writes: "a raised standing on the actor's `member_of` edge",
    consumers: [acts('src/engine/factionMembership.ts', 'member_of')],
  },
  reputation_with: {
    writes: "a counterparty-scoped reputation delta on the `relates_to` edge",
    consumers: [acts('src/engine/ambitionTick.ts', 'relates_to')],
  },
  membership_change: {
    writes: "a joined, left or re-ranked `member_of` edge",
    consumers: [acts('src/engine/factionMembership.ts', 'member_of')],
  },
  reward_draw: {
    writes: "a drawn reward instantiated onto the actor",
    consumers: [acts('src/engine/rewardPool.ts', 'drawSeededReward')],
  },
  grant_aspect: {
    writes: "an aspect granted to the ascendant, plus a chronicle entry",
    consumers: [acts('src/engine/aspects.ts', 'grantAspect')],
  },
  unlock_action: {
    writes: "an action id appended to `state.unlockedActionIds`",
    consumers: [acts('src/engine/actionUnlock.ts', 'isActionRevealed')],
    note:
      "The id is consumed, but the effect's `revealStyle` argument ('card_flight' " +
      "| 'silent') is not: it reaches the trace payload and the trace summary and " +
      'no further, so an author choosing `silent` gets a card flight anyway. ' +
      'Argument-level deadness inside an otherwise-live row — the shape the ' +
      'operand column exists to make visible.',
  },
  axiological_mark_apply: {
    writes: "a value-axis mark on the actor, feeding archetype drift",
    consumers: [acts('src/engine/encounters/branchDecision.ts', 'archetypeDrift')],
  },
  bond_change: {
    writes: "`sentiment` (and optionally `trust`) on a `relates_to` edge between two actors",
    consumers: [acts('src/engine/ambitionTick.ts', 'relates_to')],
  },
  agent_relocation: {
    writes: "a rebound `located_at` edge and a relocation intent",
    consumers: [acts('src/engine/relocationIntent.ts', 'relocationIntent')],
  },
};

// ─── Curated rows: GraphOp ops ────────────────────────────────────────────────

export const GRAPH_OP_ROWS: Readonly<Record<string, LedgerRow>> = {
  add_node: {
    writes: 'a node into the world graph',
    consumers: [acts('src/engine/graph.ts', 'getNodesByType')],
  },
  remove_node: {
    writes: 'removal of a node and its incident edges',
    consumers: [acts('src/engine/graph.ts', 'getNodesByType')],
  },
  update_node: {
    writes: "properties on an existing node",
    consumers: [acts('src/engine/graph.ts', 'updateNode')],
  },
  add_edge: {
    writes: 'an edge into the world graph',
    consumers: [acts('src/engine/graph.ts', 'getOutgoingEdges')],
  },
  remove_edge: {
    writes: 'removal of an edge',
    consumers: [acts('src/engine/graph.ts', 'getOutgoingEdges')],
  },
  update_edge: {
    writes: 'properties on an existing edge',
    consumers: [acts('src/engine/graph.ts', 'updateEdge')],
  },
  apply_influence: {
    writes: "a decaying divine-influence entry on the target actor",
    consumers: [acts('src/engine/effectTick.ts', 'divineInfluence')],
  },
  set_thread_courtposition: {
    writes: "`courtPosition` on the ascendant's thread edge",
    consumers: [acts('src/engine/attentionTier.ts', 'courtPosition')],
  },
  reveal_secret: {
    writes: "the `revealed` flag on a `knows_secret_of` edge",
    consumers: [acts('src/engine/phaseSecretsFavors.ts', 'knows_secret_of')],
  },
  call_in_favor: {
    writes: "the `redeemed` flag on an `owes_favor` edge",
    consumers: [
      acts(
        'src/engine/phaseSecretsFavors.ts',
        'owes_favor',
        'person-shaped debtor (THR-1175)',
      ),
    ],
  },
  plant_secret: {
    writes: "a fabricated `knows_secret_of` edge",
    consumers: [acts('src/engine/phaseSecretsFavors.ts', 'knows_secret_of')],
  },
  faction_verb: {
    writes: 'a dispatched faction governance verb and its graph consequences',
    consumers: [acts('src/engine/factionGovernanceVerbs.ts', 'member_of')],
  },
  plant_schism: {
    writes: 'a pending-schism flag on the target faction',
    consumers: [acts('src/engine/phaseFactionSuccession.ts', 'will_succeed')],
  },
  anoint_successor: {
    writes: "a `will_succeed` edge to the anointed heir",
    consumers: [acts('src/engine/phaseFactionSuccession.ts', 'will_succeed')],
  },
  imbue_item: {
    writes: "a sphere-flavoured power appended to an artifact's `effects[]`",
    consumers: [acts('src/engine/effectAura.ts', 'effects')],
  },
  bestow_power: {
    writes: 'a divine-gift artifact granted to a threaded agent',
    consumers: [acts('src/engine/effectAura.ts', 'effects')],
  },
  grant_companion: {
    writes: 'a companion minted and attached to the target',
    consumers: [acts('src/engine/companions.ts', 'getCompanions')],
  },
  anoint_faction: {
    writes: "the chosen-faction flag and its domain-keyed power",
    consumers: [acts('src/engine/chosenFactionPowers.ts', 'phaseChosenFactionPowers')],
  },
  consecrate_source: {
    writes: 'a typed essence source on the host, plus a `controls` edge',
    consumers: [acts('src/engine/essenceSources.ts', 'sanctity')],
  },
  sanctify_source: {
    writes: "a raised `sanctity` on a typed source",
    consumers: [acts('src/engine/essenceSources.ts', 'sanctity')],
  },
  defend_source: {
    writes: "cleared contestation and restored `sanctity`",
    consumers: [acts('src/engine/essenceSources.ts', 'sanctity')],
  },
  find_source: {
    writes: 'the discovered flag on latent essence sources in range',
    consumers: [acts('src/engine/essenceSources.ts', 'sanctity')],
  },
  claim_source: {
    writes: 'a `controls` edge to a discovered, uncontrolled source',
    consumers: [acts('src/engine/essenceEconomyBridge.ts', 'sanctity')],
  },
  fortify_location: {
    writes: "a raised `fortificationMultiplier` on the location",
    consumers: [acts('src/engine/siegeResolution.ts', 'fortificationMultiplier')],
  },
  establish_trade_route: {
    writes: "a `trades_with` edge to the best-matched partner in range",
    consumers: [acts('src/engine/armySupply.ts', 'trades_with')],
  },
  conduct_trade: {
    writes: "raised volume and refreshed `lastTraded` on the stalest route",
    consumers: [acts('src/engine/armySupply.ts', 'trades_with')],
  },
  disrupt_trade_route: {
    writes: 'severance of the busiest route at the anchor',
    consumers: [acts('src/engine/armySupply.ts', 'trades_with')],
  },
  tax_trade_route: {
    writes: "`controlledBy`/`taxRate` on the busiest untolled route",
    consumers: [acts('src/engine/armySupply.ts', 'trades_with')],
  },
  attune_artifact: {
    writes: "a sphere-aligned effect appended to `effects[]`, plus an `attunedSphere` stamp",
    consumers: [acts('src/engine/effectAura.ts', 'effects')],
    note:
      'The appended effect is consumed by the effect walker. The `attunedSphere` ' +
      'stamp is not: outside the two writers in `graphOpExecutor.ts` it appears ' +
      'nowhere in `src/`, so the artifact records which sphere attuned it and ' +
      'nothing ever asks. Argument-level deadness inside a live row.',
  },
  curse_artifact: {
    writes: "a concealed per-tick drain appended to `effects[]` plus the cursed flags",
    consumers: [acts('src/engine/effectAura.ts', 'effects')],
  },
  nullify_artifact: {
    writes: "an emptied `effects[]` and reset attune/curse flags",
    consumers: [acts('src/engine/effectAura.ts', 'effects')],
  },
  advance_artifact_tier: {
    writes: "an advanced attachment tier with scaled `stat_contribution` effects",
    consumers: [acts('src/engine/attachmentTierAdvancement.ts', 'advanceAttachmentTier')],
  },
  scry_sublocation: {
    writes: 'revealed `knows_secret_of` secrets on agents at the target hex',
    consumers: [acts('src/engine/phaseSecretsFavors.ts', 'knows_secret_of')],
  },
  plant_trap: {
    writes: 'a seeded trap encounter staged against a co-located victim',
    consumers: [spawns('src/engine/encounterSeeding.ts', 'evaluateEncounterSeeds')],
  },
  bless_harvest: {
    writes: 'raised staple resource quantities at the target location',
    consumers: [acts('src/engine/essenceEconomyBridge.ts', 'quantity')],
  },
  blight_harvest: {
    writes: 'lowered staple resource quantities at the target location',
    consumers: [acts('src/engine/essenceEconomyBridge.ts', 'quantity')],
  },
  reveal_vein: {
    writes: 'a surfaced or boosted non-staple deposit at the target location',
    consumers: [acts('src/engine/essenceEconomyBridge.ts', 'quantity')],
  },
  guide_caravan: {
    writes: 'boosted and protected trade routes touching the settlement',
    consumers: [acts('src/engine/armySupply.ts', 'trades_with')],
  },
  sour_mine: {
    writes: 'drained non-staple deposits at the target location',
    consumers: [acts('src/engine/essenceEconomyBridge.ts', 'quantity')],
  },
  bless_company: {
    writes: "raised cohesion and a dispute-suppression window on the company",
    consumers: [acts('src/engine/groups/groupCohesion.ts', 'isGroupBlessed')],
  },
  draw_together: {
    writes: 'a convergence pull stamped on the anchor and nearby scattered mortals',
    consumers: [acts('src/engine/encounterScoring.ts', 'computeConvergenceBonus')],
  },
  reunite_company: {
    writes: "a reunion window on a disbanded company plus a convergence pull",
    consumers: [acts('src/engine/groups/groupFormation.ts', 'computeConvergenceBonus')],
  },
  sunder_company: {
    writes: "cracked cohesion and an amplification window on an active company",
    consumers: [acts('src/engine/groups/groupCohesion.ts', 'isGroupSundered')],
  },
  quintessence_restore: {
    writes: "raised `quintessence` on a worn mortal and a cleared broken stamp",
    consumers: [acts('src/engine/brokenState.ts', 'isBrokenMortal')],
  },
};

// ─── Guards ───────────────────────────────────────────────────────────────────

/**
 * A derived member with no curated row fails **by name**.
 *
 * Without this, a newly added effect kind is simply absent from the ledger, and
 * absence reads exactly like "nothing to see here" — the silent default the whole
 * artifact exists to remove. The stale direction fails too: a row naming a member
 * that no longer exists is a curated claim about deleted code.
 */
export function assertEveryMemberHasRow(
  members: readonly string[],
  rows: Readonly<Record<string, LedgerRow>>,
  unionName: string,
): void {
  const missing = members.filter((m) => rows[m] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `consumption-ledger: ${missing.length} \`${unionName}\` member(s) have no curated row: ` +
        `${missing.map((m) => `'${m}'`).join(', ')}.\n` +
        `Add each one to scripts/consumption-ledger-sources.ts: what does it write, and who ` +
        `reads it — and does that reader *act*, or only describe? An unclassified member ` +
        `would read as consumed when nobody has checked.`,
    );
  }

  const stale = Object.keys(rows).filter((k) => !members.includes(k));
  if (stale.length > 0) {
    throw new Error(
      `consumption-ledger: ${stale.length} curated row(s) name a \`${unionName}\` member that ` +
        `no longer exists: ${stale.map((m) => `'${m}'`).join(', ')}. Remove them.`,
    );
  }
}

/**
 * Every cited consumer must actually be there.
 *
 * This is the check that makes a row *evidence* rather than an assertion. A
 * citation is cheap to write and expensive to verify by hand, so the failure mode
 * without it is a ledger full of plausible file:symbol pairs that quietly stopped
 * being true — which is precisely how the interface map's read sites rotted before
 * it started resolving them.
 */
export function assertConsumerSitesResolve(
  rows: Readonly<Record<string, LedgerRow>>,
  unionName: string,
  readSource: (rel: string) => string,
): void {
  const failures: string[] = [];
  for (const [member, row] of Object.entries(rows)) {
    for (const site of row.consumers) {
      let source: string;
      try {
        source = readSource(site.file);
      } catch {
        failures.push(`${member}: cited file '${site.file}' does not exist`);
        continue;
      }
      if (!source.includes(site.symbol)) {
        failures.push(
          `${member}: '${site.symbol}' is not present in '${site.file}'`,
        );
      }
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `consumption-ledger: ${failures.length} \`${unionName}\` consumer citation(s) do not ` +
        `resolve:\n  ${failures.join('\n  ')}\n` +
        `A row is evidence only if its evidence exists. Fix the citation, or — if the ` +
        `consumer really is gone — reclassify the row, because that is the ledger working.`,
    );
  }
}

/**
 * `write-without-consumer` is legal only with a cited ticket.
 *
 * Straight reuse of the interface map's LEAKED discipline: a known-dead write may
 * ship while it is being retired, and may not ship silently. The generator fails
 * otherwise, so the only way to keep one is to be on record about it.
 */
export function assertWriteWithoutConsumerIsDeferred(
  rows: Readonly<Record<string, LedgerRow>>,
  unionName: string,
): void {
  const undeferred = Object.entries(rows)
    .filter(([, row]) => classifyRow(row) === 'write-without-consumer')
    .filter(([, row]) => !row.deferralTicket);
  if (undeferred.length > 0) {
    throw new Error(
      `consumption-ledger: ${undeferred.length} \`${unionName}\` row(s) classify ` +
        `write-without-consumer with no \`deferralTicket\`: ` +
        `${undeferred.map(([m]) => `'${m}'`).join(', ')}.\n` +
        `Either it has a consumer that acts and the row is wrong, or it is dead and owes a ` +
        `retirement ticket. Both are fine; shipping it unremarked is not.`,
    );
  }
}

/**
 * Pull the `kind` discriminants out of a discriminated union, brace-aware.
 *
 * The naive `[^;]*` union parser cannot be used here: the arms carry semicolons
 * *inside* their braces, so it stops partway through the first arm and returns a
 * confidently wrong one-member answer (the `NavigationTarget` finding, slice 2).
 */
export function parseDiscriminatedUnionKinds(
  source: string,
  typeName: string,
  sourceRel: string,
): string[] {
  const stripped = stripLineComments(source);
  const start = new RegExp(`export type ${typeName}\\s*=`).exec(stripped);
  if (!start) {
    throw new Error(
      `consumption-ledger: could not find \`export type ${typeName}\` in ${sourceRel}. ` +
        `The union moved or changed shape — fix the parser rather than shipping a partial ledger.`,
    );
  }
  const bodyStart = start.index + start[0].length;
  let depth = 0;
  let end = -1;
  for (let i = bodyStart; i < stripped.length; i += 1) {
    const ch = stripped[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (ch === ';' && depth === 0) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    throw new Error(
      `consumption-ledger: \`export type ${typeName}\` in ${sourceRel} has no terminating \`;\` ` +
        `at brace depth zero. Refusing to guess where the union ends.`,
    );
  }
  const kinds = [...stripped.slice(bodyStart, end).matchAll(/kind:\s*'([^']+)'/g)].map((m) => m[1]);
  if (kinds.length === 0) {
    throw new Error(
      `consumption-ledger: \`${typeName}\` in ${sourceRel} parsed to zero \`kind\` discriminants. ` +
        `Refusing to emit an empty ledger.`,
    );
  }
  return kinds;
}

/** Pull the quoted members out of `export type X = 'a' | 'b';`. */
export function parseStringUnionMembers(
  source: string,
  typeName: string,
  sourceRel: string,
): string[] {
  const declaration = new RegExp(`export type ${typeName}\\s*=([^;]*);`);
  const match = declaration.exec(stripLineComments(source));
  if (!match) {
    throw new Error(
      `consumption-ledger: could not find \`export type ${typeName}\` in ${sourceRel}.`,
    );
  }
  const members = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (members.length === 0) {
    throw new Error(
      `consumption-ledger: \`${typeName}\` in ${sourceRel} parsed to zero members. ` +
        `Refusing to emit an empty ledger.`,
    );
  }
  return members;
}

export function stripLineComments(source: string): string {
  return source.replace(/\/\/[^\n]*/g, '');
}
