/**
 * interface-contracts — the cross-system contract registry (THR-717).
 *
 * The systems inventory answers "does subsystem X exist?"; codesight answers
 * "who imports file Y?". Neither answers **"which cross-system contracts does X
 * participate in, and do they still function?"** — which is precisely where
 * features leak: a producer keeps writing data whose consumer was rewritten
 * away, the tests still assert the write, and the game silently loses richness.
 * The 2026-07-23 attachment audit found five such contracts in one subsystem,
 * all invisible to tests, typecheck, and playtests.
 *
 * This file is the source of truth for contract rows. `generate-interface-map.ts`
 * reads it, classifies liveness, and emits `Docs/canon/interface-map.generated.md`.
 *
 * ## The invariant: classification is DOWNGRADE-ONLY
 *
 * Static analysis can prove a contract dead. It can never prove one alive. Both
 * headline leaks below would have been re-badged LIVE by a naive
 * "write site exists AND read site exists → LIVE" rule:
 *
 *   - `domainContributions` greps green everywhere, but every catalog writes `{}`
 *     — the deadness is *value-level*, invisible to symbol matching.
 *   - `modifiers` has a genuine production reader (`visibility.ts`) that only
 *     ever asks for `los_range` — the deadness is *argument-level*.
 *
 * So 🟢 LIVE is never auto-assigned. A row shows LIVE only from `verifiedLive`
 * (a dated human verification carrying its evidence); the best a mechanically
 * passing row can show is UNVERIFIED-OK. `badgeOverride` pins a row LEAKED when
 * a production read site exists but does not count — display-only readers
 * (tooltips) and documented-dead components (`AgentDetailPanel.tsx`).
 *
 * ## The ratchet
 *
 * Any contract classified LEAKED must carry a `deferralTicket` (or a
 * `badgeOverride` naming one). The generator exits non-zero otherwise, which is
 * what turns CI red — the freshness diff alone would happily pass an executor
 * who kills a read site and commits the regenerated, now-LEAKED map.
 *
 * Seeded from the hand-audited rows in `Docs/canon/interface-map.md`. Every row
 * here was grep-verified on 2026-07-23; none is a transcribed intention.
 */

import { SUBSYSTEM_NAMES } from './subsystems-registry.ts';

/** How a contract is carried across the subsystem boundary. */
export type MechanismKind = 'node-prop' | 'edge-prop' | 'function' | 'event' | 'trace';

/**
 * Badges a row can carry. LIVE is never assigned mechanically — see the header.
 *
 * `HOLLOW` is the content-claims class and is **pin-only**: it arrives solely
 * through `badgeOverride`, never from a mechanical check. That is not a gap, it is
 * the class's shape — a hollow claim is interface text naming a simulation object
 * with no referent, and symbol matching cannot see the absence of a referent it was
 * never told to look for. Its population is measured where the referents live, by
 * `check:chip-anchors` (clause 2 plus the `--baseline` ratchet over the chips that
 * declare none), at template rather than contract granularity.
 *
 * **Defined by pointer, not here.** The definition is the UL entry
 * `claim-without-anchor` (`Docs/ubiquitous-language/Process.md`, alias
 * *Law 56-hollow*, already in-tree at `src/types/unifiedAction.ts`); UI Law 56 is the
 * rule it violates. Single authority + pointers — this registry must never carry a
 * second definition of it (THR-1212 absorbed ruling 3, THR-1316).
 */
export type ContractBadge = 'LIVE' | 'PARTIAL' | 'LEAKED' | 'UNWIRED' | 'UNVERIFIED-OK' | 'HOLLOW';

/**
 * Badges that must carry a remediation ticket or fail the build.
 *
 * LEAKED is the historical member; HOLLOW joins it because a claim the player can
 * read and nothing backs is a released defect of the same severity, not a lesser
 * one. Structurally `badgeOverride` already requires a ticket, so a pinned HOLLOW
 * cannot arrive without one — this constant states the rule anyway, so a future
 * mechanical assignment path inherits the ratchet instead of quietly escaping it.
 */
export const TICKETED_BADGES: readonly ContractBadge[] = ['LEAKED', 'HOLLOW'];

export interface Contract {
  /** Stable kebab-case id; also the anchor in the generated doc. */
  id: string;
  /** Subsystem that writes. Must appear in SUBSYSTEM_NAMES. */
  producerSystem: string;
  /** Subsystem that reads. Must appear in SUBSYSTEM_NAMES. */
  consumerSystem: string;
  /** Design intent, in UL terms where possible — what the player would lose. */
  intent: string;
  /**
   * UL entries this contract relates. Optional in v1 (no UL-lookup tax on
   * seeding); required from the first UL-dashboard integration onward.
   */
  ulTerms?: string[];
  mechanism: {
    kind: MechanismKind;
    /**
     * Symbols to grep. Matched **word-boundary-anchored** — bare `grants`
     * collides with `grantsActionIds` / `grantsTraitWhileHeld` and would
     * manufacture phantom read sites (the THR-614 seam-2 error class).
     */
    symbols: string[];
    /**
     * Module implementing the contract, repo-relative. When set, Tier 1 checks
     * it has at least one production importer; zero importers → LEAKED.
     */
    module?: string;
  };
  /** Expected write locations (informational — the generator verifies). */
  writeSites: string[];
  /** Expected read locations (informational — the generator verifies). */
  readSites: string[];
  /** The only route to 🟢 LIVE. Dated human verification with its evidence. */
  verifiedLive?: { date: string; evidence: string };
  /**
   * Pin a row LEAKED despite a passing mechanical check — for display-only
   * readers and documented-dead components. Carries its own ticket.
   */
  badgeOverride?: { badge: 'LEAKED' | 'PARTIAL' | 'HOLLOW'; reason: string; deferralTicket: string };
  /** Remediation ticket for a known-LEAKED row. Required, or the build fails. */
  deferralTicket?: string;
}

const AUDIT_EVIDENCE =
  'Docs/plans/2026-07-23-system-interface-map.md § Audit findings (manual audit + independent cold-context review, both grep-verified)';

/** Subsystem name constants, so a typo is a compile error rather than a silent unmatched row. */
const ATTACHMENTS = 'Attachments, Items & Possessions';
const AMBITIONS = 'Ambitions & Undertakings';
const ENCOUNTERS = 'Encounters & Dilemmas';
const COMPANIES = 'Companies & Group Travel';
const FACTIONS = 'Factions & Succession';
const NARRATIVE = 'Attention, Chronicle & Narrative';
const QUINTESSENCE = 'Spheres & Quintessence';
const TRAITS = 'Personality & Emergent Traits';
const PROGRESSION = 'Ascendant Beats & Progression';

export const CONTRACTS: readonly Contract[] = [
  // ── Personality & Emergent Traits → outbound (THR-786 first slice) ─────────
  // Audit-on-touch: this subsystem was ⚪ UNAUDITED until THR-786 unified the six
  // trait-predicate read sites. These two rows cover the predicate boundary only;
  // minting, decay, and display remain unwritten (waves 2–3, THR-790/THR-791).
  {
    id: 'reputation-with-unified-read',
    producerSystem: FACTIONS,
    consumerSystem: ENCOUNTERS,
    intent:
      'Reputation means one thing wherever the game asks it — the social score between a and b — so a standing earned in a town, a guild or a friendship reads in one vocabulary and moves the same things.',
    ulTerms: ['Reputation'],
    mechanism: {
      kind: 'function',
      symbols: ['getReputationWith', 'applyReputationWithDelta', 'meetsReputationWithRequirement', 'reputationLeverageTerm', 'getNotableStandings'],
      module: 'src/engine/reputation.ts',
    },
    writeSites: [
      'src/engine/reputation.ts',
      'src/engine/encounterAftermath.ts',
      'src/engine/phaseReputationDecay.ts',
    ],
    readSites: [
      'src/engine/targetActions.ts',
      'src/engine/encounterFilterPipeline.ts',
      'src/engine/socialLeverage.ts',
      // THR-1211: the `past_crime` secret branch, which used to read a
      // `relates_to.properties.reputation` that nothing writes.
      'src/engine/secretGeneration.ts',
      'src/components/Game/LocationProfileModal.tsx',
      'src/components/Game/tabs/OverviewTab.tsx',
    ],
    verifiedLive: {
      date: '2026-08-23',
      evidence:
        "THR-1206, director ruling. Six mechanisms wore the word `reputation` and disagreed; a seventh (`trait.condition.location.standing_welcome`) did reputation's job under a bespoke noun the director vetoed on player surfaces. This is a READ unification plus one new store, deliberately NOT a store migration (strangler ruling in the plan): `getReputationWith` dispatches membership (`member_of.reputation`) → edge (`reputation_with`) → bond (`relates_to.trust`, remapped [-1,1]→[0,1]) → default, and every leg's band word comes from the single `getReputationWord` vocabulary, which is what makes the stores one concept on every surface. The new `reputation_with` edge family (actor → actor|location, required `score`+`lastChangedTick`) fills the two pairs no store covered: agent↔location, and agent↔faction WITHOUT membership — `applyFactionReputationGain` no-ops with `not_a_member`, so a non-member could never earn standing with a community at all. Sparse by construction: minted on first write, decayed toward neutral in phase 6.6 and DELETED once inside `REPUTATION_WITH_PRUNE_EPSILON`, so the sweep is O(edges that exist) and there is no N×M scan. Every consumer ships in the same change, so this is not a write nobody reads (the THR-1154 flaw): the `requiredReputationWith` eligibility gate at both filter sites, the signed opening-leverage term in `computeInitialLeverage` (signed, unlike its bonus-only siblings — standing that has soured is as real as standing earned), and two profile surfaces. Non-vacuous by `src/engine/__tests__/reputation.test.ts` (22 tests: all four dispatch legs in BOTH polarities, priority order between legs, directionality, the cap/clamp/mint/sublocation-resolve write behaviour, decay from both sides, and the prune) — falsified 2-of-22 red with the sublocation resolve reverted — plus `src/components/Game/__tests__/reputationSurfaces.test.tsx` (8 render assertions on the real components, falsified 2-of-8 red with the FactionSheet banding reverted). The first migrated content is the Grateful Kin gratitude beat, whose three bands replaced `apply_condition → standing_welcome` with `reputation_with` deltas and whose four chips now state 'reputation with {target}' — pinned by the corpus and veil suites, which were red on the old noun until updated.",
    },
  },
  {
    id: 'trait-predicate-resolution',
    producerSystem: TRAITS,
    consumerSystem: ENCOUNTERS,
    intent:
      'A trait gate anywhere in the engine means the same thing: the world reacts to who someone is, by the same rules whichever system is asking.',
    ulTerms: ['Trait'],
    mechanism: {
      kind: 'function',
      symbols: ['resolveTraitPredicate', 'collectBearerTraitRefs', 'bearerMatchesPredicate'],
      module: 'src/engine/traitRefIndex.ts',
    },
    writeSites: ['src/engine/traits.ts', 'src/engine/traitRefIndex.ts'],
    readSites: [
      'src/engine/encounterFilterPipeline.ts',
      'src/engine/effects/effectPredicates.ts',
      'src/engine/graphConditions.ts',
      'src/engine/ambitionTick.ts',
      'src/engine/spellActivation.ts',
    ],
    verifiedLive: {
      date: '2026-07-26',
      evidence:
        'THR-786. All six pre-existing trait vocabularies now route through `collectBearerTraitRefs` + `bearerMatchesPredicate`: encounter filter pipeline (`requiredTraits`/`blockedByTraits`), effect-predicate context builder (`has_trait:`/`lacks_trait:` sugar), graphConditions (`agent_has_trait`/`agent_lacks_trait`), ambition snapshot eligibility (`buildAmbitionAgentSnapshot`), spell prerequisites (`checkPrerequisites`), and item-granted keys. Non-vacuous by the unchanged-behavior contract suite `src/engine/__tests__/contracts/traitPredicate.contract.test.ts`, which pins each site\'s pre-migration vocabulary (31 PRESERVED assertions, all green pre- and post-migration) and separately asserts the 4 deliberate widenings + 2 dead-read repairs, each of which was verified failing before the migration. Reach note (THR-811, 2026-07-27): the encounter read site resolved its template via `getAnyEncounterById`, so `requiredTraits`/`blockedByTraits` were unreadable on 43 of the 213 cache-registrable template ids — the predicate was shared but the encounter site could not see the authoring on that id set. It now resolves via getUnifiedTemplateById; no production encounter template declares either field yet, so this widened reach rather than changing any current verdict. Seventh consumer added (THR-802, 2026-07-27): `src/engine/kpi/branchingDistance.ts` was a production reader the THR-786 migration could not see — both its `requiredTraits` reads sat inside the THR-489 red typecheck baseline as `Property \'requiredTraits\' does not exist`, so the grep for typed readers missed them and it kept comparing `e.target` to `req.traitId`. It now routes through the shared pair like every other site. Diagnostic-only (the `kpi:branching-audit` CLI path, never the tick loop), so this changes what the readout reports rather than any gate outcome; covered by `src/engine/kpi/__tests__/branchingDistanceTraitGate.thr802.test.ts`, falsified 5-of-6-red against the pre-fix build.',
    },
  },
  {
    id: 'trait-ref-authoring-vocabulary',
    producerSystem: TRAITS,
    consumerSystem: AMBITIONS,
    intent:
      'An authored trait hook names a trait the world can actually mint, so a gate the content promises is a gate the player can meet.',
    ulTerms: ['Trait'],
    mechanism: {
      kind: 'function',
      symbols: ['validateTraitRefs', 'buildTraitRefIndex', 'resolveTraitRefs'],
      module: 'src/engine/traitRefValidation.ts',
    },
    writeSites: [
      'src/data/ambition-templates.ts',
      'src/data/choice-set-catalog.ts',
      'src/data/artifact-templates.ts',
      'src/data/reward-attachment-catalog.ts',
    ],
    readSites: ['src/engine/traitRefValidation.ts', 'src/debug-bridge.ts'],
    // LEAKED, and measured rather than assumed: `validateTraitRefs()` reports 62 dead
    // gates against the 64 shipped trait definitions (43 ambition boosting/blocking/
    // required, 15 ambition graphConditions, 4 `has_trait:` choice-set predicates),
    // plus 21 phantom grant keys. Authored refs are bare snake_case (`master_smith`,
    // `pacifist`); definitions use `trait.<category>.<kebab>` ids, Title Case names and
    // `#tag` tags — the two vocabularies have never intersected. THR-786 built the
    // detector; reconciling the content is its own pass.
    badgeOverride: {
      badge: 'LEAKED',
      reason:
        'Detector shipped and measured (THR-786): 62 of the authored trait refs resolve to no trait definition, so those gates can never pass. Reconciling the authoring vocabulary against the minted definitions is content work outside the predicate floor.',
      deferralTicket: 'THR-800',
    },
    deferralTicket: 'THR-800',
  },

  // ── Attachments → outbound ────────────────────────────────────────────────
  {
    id: 'attachment-effects-shape-resolution',
    producerSystem: ATTACHMENTS,
    consumerSystem: ENCOUNTERS,
    intent: 'Items shape action resolution rolls — a blade makes its bearer likelier to succeed.',
    ulTerms: ['Attachment', 'Test Shaper'],
    mechanism: { kind: 'node-prop', symbols: ['collectAttachmentEffects', 'collectTestShapers'] },
    writeSites: ['src/engine/effectResolver.ts', 'src/engine/effects/**'],
    readSites: ['src/engine/unifiedActionResolution.ts'],
    verifiedLive: {
      date: '2026-07-23',
      evidence: `effects[] → effectWalker → collectTestShapers is the live mechanical path (2026-03-31 generic effect system). ${AUDIT_EVIDENCE}`,
    },
  },
  {
    id: 'attachment-grants-trait-while-held',
    producerSystem: ATTACHMENTS,
    consumerSystem: ENCOUNTERS,
    intent: 'Items grant traits while held, gating encounter eligibility (treasure-map, ruin_seeker).',
    ulTerms: ['Attachment', 'Trait'],
    mechanism: { kind: 'node-prop', symbols: ['grantsTraitWhileHeld'] },
    writeSites: ['src/data/reward-attachment-catalog.ts', 'src/types/attachments.ts'],
    readSites: ['src/engine/encounterScoring.ts'],
    verifiedLive: {
      date: '2026-07-23',
      evidence: `3 production files reference grantsTraitWhileHeld incl. the encounterScoring gate. ${AUDIT_EVIDENCE}`,
    },
  },
  {
    id: 'attachment-effects-tick',
    producerSystem: ATTACHMENTS,
    consumerSystem: 'Effects & Conditions',
    intent: 'Effects tick, decay, stack and expire on their host agent.',
    mechanism: { kind: 'function', symbols: ['effectTick', 'effectShellRuntime'] },
    writeSites: ['src/engine/effects/**', 'src/engine/effectShellRuntime.ts'],
    readSites: ['src/engine/unifiedActionResolution.ts'],
    verifiedLive: { date: '2026-07-23', evidence: `Orchestrator phase 2a.4 runs effectTick. ${AUDIT_EVIDENCE}` },
  },
  {
    id: 'attachment-effect-event-raises',
    producerSystem: ATTACHMENTS,
    consumerSystem: 'Effects & Conditions',
    intent: 'Game events reach event-triggered effect primitives (reactive, until_event, stacking, transform, one-shot resource_manipulate) on the agents they happen to.',
    mechanism: { kind: 'function', symbols: ['raiseEffectEvent', 'processEffectEvent'] },
    writeSites: [
      'src/engine/phaseMovement.ts',
      'src/engine/battleResolution.ts',
      'src/engine/orchestrator.ts',
      'src/engine/phaseDoom.ts',
      'src/engine/effects/conditionProxyEvents.ts',
      'src/engine/encounterAftermath.ts',
      'src/engine/effects/actionTriggerPayloads.ts',
    ],
    readSites: ['src/engine/effects/effectEventDispatch.ts', 'src/engine/effects/effectEvents.ts'],
    verifiedLive: {
      date: '2026-08-26',
      evidence: 'THR-1244 (stage 6) added the condition producer, closing the last three trigger families that had no source event: the damaged/healed reactive triggers, the on_damaged/on_heal stack triggers, and the take_damage expiry event. They were unreachable BY CONSTRUCTION rather than by omission — the game has no per-agent damage model, so there was no hit-point subtraction to raise from, and the branch sat inert behind an absent number. The proxy reads the shape the game does have: a wound IS a condition with a countdown, so inflicting a harmful condition raises damaged and lifting one EARLY raises healed, from all three aftermath condition writers (apply_condition, condition_attachment, remove_condition) through conditionProxyEvents. condition_attachment is included deliberately and is not redundant: every shipped trait.condition.wounded in the tavern package authors that kind, so wiring only apply_condition would have left the busiest infliction path silent while the stage read as done. Natural expiry raises NOTHING, enforced by where the raise lives rather than by a check — conditionDecay.ts is the one tick-driven expiry path (THR-761) and does not call the module — because a proxy keyed on "a condition went away" would fire every ward in the world on every decay sweep. Harm is the #negative tag, so polarity gates both directions (gaining blessed is not damage, losing it is not a heal); carriers are persons only, since a place under a plague scare and an army carrying a headcount have no body to hurt. Non-vacuous by falsification: each of the four guards was individually disabled and each failed exactly its own test and no others — harm gate 2 failed, person gate 1, the condition_attachment raise 1, the removedCount gate 1 — and adding a raise INTO conditionDecay fails exactly the natural-expiry silence test, which is the assertion the "early" half rests on. Unit coverage: src/engine/effects/__tests__/conditionProxyEvents.test.ts (16 tests, asserting the downstream trigger actually moved — a stack incremented, an attachment destroyed — rather than only that a trace appeared). THR-1257 closed the known gap: actionTriggerPayloads.ts condition_grant/condition_remove was a fourth live writer of the same has_trait edge that raised nothing, and its conditions lived in catalogs tagged topically (#cursed, #curse, #wound, #blessing) with no polarity, so wiring the site alone would have made the raise live and silently misclassifying. Both shipped together: applyActionTriggerPayloads now takes GameState rather than WorldGraph and raises through the same proxy, and 47 conditions across anomaly-reward-catalog.ts, starter-attachments.ts, reward-attachment-catalog.ts and economic-trait-content.ts were normalised onto #negative/#positive, so ONE predicate now classifies every catalog. The reachable set is wider than the grants suggest — condition_remove matches on TAGS, so the single authored tags:[#wound] removal reaches every #wound condition in the repo, reward-attachment-catalog.ts included; normalising only the catalogs the grants name would have left the healing half blind. The orchestrator call site threads its runningEffectStates map and reads the merged map back, because it sits inside the loop whose end-of-tick assignment would otherwise discard the raise: falsified by reverting that call site to the pre-THR-1257 shape, which leaves the damaged trace firing while the downstream stacking write reads 0 instead of 1 — i.e. a raise that looks healthy from the trace stream and has lost its effect. Re-entrancy was checked and is not a risk: checkAndFireActionTriggers has exactly three phase-level callers and neither effectExecutors nor effectEvents calls it, so a raise cannot re-enter the trigger path and no depth guard exists. Coverage: conditionProxyActionTrigger.test.ts (14 tests incl. a control arm for the caller shape and both absences — a boon raises nothing, an army raises nothing) and conditionProxyOrchestrator.test.ts (drives real runTick). The polarity closure is enforced, not remembered: conditionProxyEvents.test.ts pins all 60 condition nodes across all five catalogs and fails on any that ships without a polarity tag. Prior evidence — THR-1239. The consumer half was always live and the producer half was almost entirely missing: outside the single encounter_outcome raise in the orchestrator, no site in the engine ever constructed an EffectEvent, so the whole executor family (teleport, spawn, compel, cascade, ...) was unreachable in normal play while looking wired. Movement arrival now raises entered_hex and battle create/resolve raise combat_started/combat_ended, all four sites through the shared raiseEffectEvent; the orchestrator site was migrated onto it rather than kept as a second copy. Every raise emits effect.event_raised carrying its site and reactive count, so a live-but-unheard producer is distinguishable from an unwired one. Live evidence: seeded medium CLI run, `printf "tick 30\ntraces 5000\nexit\n" | npm run cli -- --seed 42 --map medium` yields 10 entered_hex raises at movement_arrival. Unit coverage: src/engine/effects/__tests__/effectEventDispatch.test.ts (12 tests, asserting the executor trace rather than the return count, so a dispatcher that never reached executeEffect would fail).',
    },
  },
  {
    id: 'effect-executor-overlay-persistence',
    producerSystem: 'Effects & Conditions',
    consumerSystem: 'Effects & Conditions',
    intent: 'Terrain overlays and rule overrides an executor produces are persisted on GameState, expire on schedule, and are readable by the systems they govern.',
    mechanism: { kind: 'function', symbols: ['applyExecutionOverlays', 'expireOverlays', 'getPersistedRuleOverride'] },
    writeSites: [
      'src/engine/effects/effectEventDispatch.ts',
      'src/engine/phaseDoom.ts',
    ],
    readSites: [
      'src/engine/effects/effectOverlayStore.ts',
      'src/engine/effects/effectQueries.ts',
      'src/engine/orchestrator.ts',
    ],
    verifiedLive: {
      date: '2026-08-25',
      evidence: 'THR-1240. Both halves of this contract existed and were never joined: executeAlterTerrain and executeModifyRules have always returned populated terrainOverlays/ruleOverrides on ExecutionResult, and every consumer looped result.mutations — which both executors leave EMPTY — applied nothing, and dropped the other two fields. The primitives therefore returned success: true and changed nothing, which is the value-level deadness this registry exists to catch: symbol-matching greps both sides green. GameState.activeTerrainOverlays (hex-keyed) and activeRuleOverrides (agent-keyed) are the destination; the drain moved into applyExecutionResult so there is ONE apply path (phaseDoom\'s duplicated inline mutation loop was migrated onto it rather than left as a second copy that could keep dropping fields). Expiry runs world-level once per tick in the orchestrator effect-tick phase, since an overlay outlives the agent that cast it. Non-vacuous by falsification: disabling the single drain line fails exactly the two end-to-end tests and no others (2 failed / 19 passed), so the tests assert the wiring rather than the store. Unit coverage: src/engine/effects/__tests__/effectOverlayStore.test.ts (21 tests), driving the REAL executors rather than hand-built overlay literals — a fixture that builds its own ActiveTerrainOverlay would pass identically against the broken build, because the break was never in the store. Reach note: the catalog\'s own alter_terrain uses (artifact-templates.ts) sit behind artifact activation, which is still dormant; the live producer today is a reactive nested effect, which THR-1239 made reachable. Stage 4 migrates create_barrier onto alter_terrain and is what puts catalog content on this path.',
    },
  },
  {
    id: 'rule-overrides-reach-owning-sites',
    producerSystem: 'Effects & Conditions',
    consumerSystem: 'Effects & Conditions',
    intent: 'Every RuleOverrideKey is read by the one system that owns the rule it bends, through a single shared reader.',
    mechanism: {
      kind: 'function',
      symbols: ['readMultiplierOverride', 'readBonusOverride', 'readFlagOverride', 'readReachOverride'],
      module: 'src/engine/effects/ruleOverrideConsumers.ts',
    },
    writeSites: ['src/engine/effects/ruleOverrideConsumers.ts'],
    readSites: [
      'src/engine/movementCost.ts',
      'src/engine/encounterAwareness.ts',
      'src/engine/agentLifecycle.ts',
      'src/engine/conditionDecay.ts',
      'src/engine/capabilityGrowth.ts',
      'src/engine/factionReputation.ts',
      'src/engine/effectTick.ts',
      'src/engine/spellActivation.ts',
      'src/engine/rewardPool.ts',
      'src/engine/resolutionModifiers.ts',
      'src/engine/phaseDoom.ts',
    ],
    verifiedLive: {
      date: '2026-08-26',
      evidence: 'THR-1241. This is the read half of the contract THR-1240 opened, and the exact deadness class this registry exists to catch: the store kept overrides correctly and eleven of thirteen keys had NO consumer at all, so `getActiveRuleOverride` greps green on both sides while `death_prevented` did nothing. Five keys had shipped content promising a player something that never happened (death_prevented, awareness_range_bonus, healing_multiplier, spawn_rate_multiplier, tier_advancement_cost_multiplier). Each key now has exactly one owning site, listed above; doom_rate_multiplier — the only key that HAD a consumer — was migrated off its hand-rolled inline scan in phaseDoom onto the same reader, because that scan saw only attachment-declared overrides, folded unclamped, and ignored duration/cooldown/suppression. A non-neutral read emits effect.rule_override_consumed carrying its site, so a wired-but-never-triggered key is distinguishable from an unwired one. Unit coverage: src/engine/effects/__tests__/ruleOverrideConsumers.test.ts (19 tests) drives the OWNING SITES, never the reader — asserting readMultiplierOverride returns 0.5 would pass against a build where no site calls it, which is stage 2 wearing the stage 3 name. Each key is asserted in both arms (with override, bare control) against an observable outcome: a traversal cost, a wound countdown, a reputation delta, a tier curve. Known partial reach, stated rather than papered over: backlash_severity_multiplier is wired into evaluateBacklash, whose caller activateSpell has no production caller yet — the key is live in code and goes live in play when spell activation does. Two derived readings are judgement calls argued at their sites: tier_advancement_cost_multiplier inverts into growth (no priced transaction exists for a tier, so the cost IS the growth owed), and backlash_severity_multiplier shifts an enum one band rather than scaling a number that does not exist.',
    },
  },
  {
    id: 'aura-reaches-resolution-modifiers',
    producerSystem: 'Effects & Conditions',
    consumerSystem: ENCOUNTERS,
    intent: "A nearby agent's aura tilts the step someone else is resolving — the one modifier the acting agent does not carry, named on the panel like every other.",
    mechanism: {
      kind: 'function',
      symbols: ['collectAuraEffectsNear', 'selectAuraEmitters', 'resolveAuraModifiers', 'collectAuraContributions'],
      module: 'src/engine/effectAura.ts',
    },
    writeSites: ['src/engine/effectAura.ts'],
    readSites: [
      'src/engine/resolutionModifiers.ts',
      'src/engine/orchestrator/phaseAscendantHandFilter.ts',
    ],
    verifiedLive: {
      date: '2026-08-25',
      evidence: 'THR-1243. effectAura.ts shipped complete and tested with ZERO production importers — both halves written, never joined, which is the deadness this registry exists to catch (a symbol grep found resolveAuraModifiers only in its own module and its own test). The reason it was never wired is structural: an aura is the only resolution modifier sourced from an agent other than the one being resolved, so there was no per-agent walk to hang it on, and hanging it on the tick loop meant an O(agents²) proximity scan for a number almost nobody reads. It is resolved lazily instead, for one agent, at the moment a step resolves. collectAuraEffectsNear moves the distance test BEFORE the attachment walk, so the expensive half runs only for agents within AURA_MAX_RADIUS. Two bounds do different jobs: AURA_STACKING_CAP (3) bounds how many emitters may speak, EFFECT_MODIFIER_CAP clamps how loud the answer may be — without the first a crowded settlement hex decides a step by attendance. Non-vacuous by falsification: forcing the distance test true fails exactly one test (the out-of-range drop) and removing the `aura` prose pair fails exactly one other (the factor line), 2 failed / 51 passed, so the tests assert the wiring and the naming rather than the aggregator. Content pillar: DERIVED_FACTOR_SENTENCES gained an `aura` pair naming the EMITTING AGENT, not its item — deriveContributionLines silently drops any kind with no authored sentence, so without it the modifier would have moved the roll as an unnamed number, which is the exact failure the factor panel exists to prevent. Reach note: no shipped catalog entry authors an `aura` effect yet, so the live producer today is content this unlocks rather than content already waiting; the mechanism is proven end-to-end through computeResolutionModifiers against real graph fixtures (auraModifier, totalModifier, and a named contribution), not through a hand-built AuraEntry literal.',
    },
  },
  {
    id: 'effect-vocabulary-consolidated-spellings',
    producerSystem: 'Effects & Conditions',
    consumerSystem: 'Effects & Conditions',
    intent: 'Every effect capability content can author reaches a live mechanism — duplicate spellings are retired and their content migrated onto the mechanism that already executes.',
    mechanism: {
      kind: 'function',
      symbols: ['applySuppressions', 'getRevealRanges', 'isImmuneToAnyTag', 'normalizeTag'],
      module: 'src/engine/effects/effectSuppression.ts',
    },
    writeSites: [
      'src/engine/effects/effectSuppression.ts',
      'src/engine/orchestrator.ts',
    ],
    readSites: [
      'src/engine/phaseMovement.ts',
      'src/engine/encounterAwareness.ts',
      'src/engine/movementCost.ts',
      'src/engine/encounterAftermath.ts',
      'src/engine/effects/effectQueries.ts',
    ],
    verifiedLive: {
      date: '2026-08-26',
      evidence: 'THR-1242. Nine spellings retired and their content migrated: graph_mutation/outcome_shift/auto_succeed had zero refs; reroll (3) -> test_shaper, swap_reach (1) -> the encounter_reach_override rule key, haste/slow/freeze_duration (13) -> cooldown/movement/duration multiplier keys, create_barrier (5) -> alter_terrain with the shrouded/warded overlays. Retiring a spelling is NOT the same claim as keeping the capability, so the tests come in two shapes: retirement sweeps run against the REAL catalogs (a fixture would verify fiction, since the claim is about what ships) and match only a `type: \'x\'` position, because a bare substring sweep for "slow" hits an adjective table in archetype-content and would report a false positive forever. Three primitives were wired rather than migrated, and each was a different shape of dead. `suppress` was the inverse of the usual case — a CONSUMER with no producer: EffectRuntimeState.suppressed has been read by effectResolver, effectQueries, consumableCharges and effectEvents since the primitive architecture landed and set by nothing, so four artifacts promised to silence magic and silenced nothing; applySuppressions is now its one writer, run once per tick before the effect tick so an attachment silenced this tick does not also act this tick. `reveal` had 17 content refs and no consumer of any kind; it now floors the awareness horizon (encounters target) and lifts fog on arrival (hexes target). `tag_immunity` had a complete query with ZERO callers AND a namespace mismatch that would have made it read as wired and block nothing — condition trait nodes carry #-prefixed tags while most immunity content wrote them bare, so `fear` would never have matched `#fear`; content is migrated to the # spelling and comparison normalizes both sides. Non-vacuous by falsification: reverting the walker to its private MAX_EFFECTS_PER_NODE=12 fails exactly the three content-guard tests, and removing the self-cancel guard from applySuppressions fails exactly the one that names it (4 failed / 79 passed), so the tests assert the wiring rather than the helpers. The create_barrier migration additionally required giving the stage-2 overlay store its first PRODUCTION reader (movementCost for warded, encounterAwareness for shrouded) — without it the migration would have moved five artifacts from a dead spelling onto a dead mechanism: persisted, traced, and still changing nothing a player could feel.',
    },
  },
  {
    id: 'attachment-slot-caps-suppress',
    producerSystem: ATTACHMENTS,
    consumerSystem: 'Effects & Conditions',
    intent: 'Slot caps suppress overflow attachments via a single suppression seam.',
    mechanism: { kind: 'edge-prop', symbols: ['attachmentSlotResolver'] },
    writeSites: ['src/engine/attachmentSlotResolver.ts', 'src/engine/agentAttachments.ts'],
    readSites: ['src/engine/phaseSlotCaps.ts', 'src/engine/conditionOverflow.ts'],
    verifiedLive: { date: '2026-07-23', evidence: `effectWalker is the single suppression seam. ${AUDIT_EVIDENCE}` },
  },
  {
    id: 'attachment-character-sheet-display',
    producerSystem: ATTACHMENTS,
    consumerSystem: 'Attention, Chronicle & Narrative',
    intent: 'The character sheet shows what an agent carries.',
    mechanism: { kind: 'function', symbols: ['getAgentAttachments'], module: 'src/engine/agentAttachments.ts' },
    writeSites: ['src/engine/agentAttachments.ts', 'src/engine/agentDetail.ts'],
    readSites: ['src/debug-bridge.ts', 'src/components/**'],
    verifiedLive: { date: '2026-07-23', evidence: `AttachmentsTab renders inside AgentProfileModal. ${AUDIT_EVIDENCE}` },
  },
  {
    id: 'attachment-domain-contributions',
    producerSystem: ATTACHMENTS,
    consumerSystem: 'Personality & Emergent Traits',
    intent:
      'Items raise Domain Capability tiers — a legendary blade makes its bearer mightier on the Prowess tab and in encounter eligibility.',
    ulTerms: ['Domain Capability', 'Attachment'],
    mechanism: {
      kind: 'node-prop',
      symbols: ['stat_contribution', 'collectStatContributions', 'domainContributions'],
    },
    writeSites: [
      'src/data/reward-attachment-catalog.ts',
      'src/data/starter-attachments.ts',
      'src/data/artifact-templates.ts',
      'src/data/anomaly-reward-catalog.ts',
    ],
    readSites: ['src/engine/domainCapability.ts', 'src/engine/effects/effectQueries.ts'],
    verifiedLive: {
      date: '2026-07-24',
      evidence:
        'THR-718 finished the effects[] migration: a `stat_contribution` primitive (effects.ts) is summed by `collectStatContributions` (effectQueries.ts) and added inside `computeRawScore`\'s possesses/bonded_to artifact walk (domainCapability.ts). 9 catalog entries across all bands carry real contributions (artifact-templates ×3 legendary, starter ×4, anomaly ×2) — both-side symbol hits: `stat_contribution` on write (catalogs) + read (effectQueries), `collectStatContributions` on read (domainCapability + effectQueries). Legacy `domainContributions` node-prop read preserved for traits/resources. Unit + hook + content-band tests green.',
    },
  },
  {
    id: 'companion-capability-contribution',
    producerSystem: ATTACHMENTS,
    consumerSystem: 'Encounters & Dilemmas',
    intent:
      'A companion travelling with a mortal raises that mortal\'s per-Reach raw score, and earns a factor line under their own name.',
    mechanism: {
      kind: 'edge-prop',
      symbols: ['accompanies', 'domainContributions', 'getCompanions'],
      module: 'src/engine/companions.ts',
    },
    writeSites: ['src/engine/companions.ts', 'src/data/companion-templates.ts'],
    readSites: ['src/engine/domainCapability.ts', 'src/engine/agentDetail.ts', 'scripts/cli.ts'],
    verifiedLive: {
      date: '2026-08-14',
      evidence:
        'THR-1096: `computeRawScore` and `getTopContributors` both walk `accompanies` alongside `possesses`/`bonded_to`. Proven against the real pipeline (initializeGameState → runTick ×3, seed 42) in companionsIntegration.test.ts: minting `companion.wayfarer` raises the bearer\'s stone raw score by exactly the template\'s +2 and adds a contributor row under the minted personal name; `companion.sellsword-band` raises iron — the bonus `hire-mercenaries` never granted before this ticket, when it minted an off-schema `attachment` node carrying an unread `ironCapability: 30`. Removal returns the score. Both-side symbol hits: `accompanies` on write (companions.ts) + read (domainCapability.ts); `getCompanions` on read (agentDetail.ts, cli.ts).',
    },
  },
  {
    id: 'attachment-edge-modifiers',
    producerSystem: ATTACHMENTS,
    consumerSystem: 'Personality & Emergent Traits',
    intent: 'Items modify agent attributes ("+0.15 star" on the Starweave Cloak).',
    mechanism: { kind: 'edge-prop', symbols: ['collectModifiers', 'getModifiedValue'], module: 'src/engine/modifiers.ts' },
    writeSites: ['src/engine/modifiers.ts'],
    readSites: ['src/engine/visibility.ts'],
    badgeOverride: {
      badge: 'LEAKED',
      reason:
        'The module has exactly one production importer (visibility.ts, `getModifiedValue`) and it only ever asks for `los_range`. Capability attributes are written but never queried — argument-level deadness a symbol check cannot see. THR-723 (2026-08-06) removed one writer: `attachmentTierAdvancement` no longer scales Reach-domain keys, only non-Reach ones like `los_range`. The seed writers remain — `gameInit.ts` (4 First-agent possessions) and `seedAttachments.ts` still stamp reach-keyed bags nothing reads — so the row stays LEAKED, now deferred to THR-997.',
      deferralTicket: 'THR-997',
    },
    deferralTicket: 'THR-997',
  },
  {
    // THR-722 retired the `possesses`-edge `grants[]` property that used to carry this
    // intent (zero readers, field deleted from PossessionEdgeProperties). The authored
    // payload — cavalry_charge, rapid_retreat, intimidate, dark_ferocity — moved onto the
    // `effects[]` substrate as `trait_grant`, joining the ~20 catalog entries already there.
    // THR-737 closed the consumer gap: `collectGrantedTraits` is the aggregate wrapping
    // `hasGrantedTrait`, and the three production trait gates now union it with their
    // has_trait-edge keys, so a granted trait gates content exactly like an owned one.
    id: 'attachment-trait-grant-effects',
    producerSystem: ATTACHMENTS,
    consumerSystem: ENCOUNTERS,
    intent: 'Items grant abilities to their bearer (e.g. cavalry_charge).',
    ulTerms: ['Attachment', 'Trait'],
    // THR-786 repointed the read symbol. Until then the declared symbols were
    // `['trait_grant', 'hasGrantedTrait']`, and the only thing matching either of them
    // at a read site was a *comment* in `encounterFilterPipeline.ts` mentioning
    // `trait_grant` — rewriting that comment during the predicate migration turned the
    // row LEAKED and exposed that its evidence had never been code. `collectGrantedTraits`
    // is the aggregate every consumer actually calls (import + call at all four read
    // sites), so it is the honest symbol. `trait_grant` stays for the write side, where
    // the authored payload really does carry `type: 'trait_grant'`.
    mechanism: { kind: 'node-prop', symbols: ['trait_grant', 'collectGrantedTraits'] },
    writeSites: [
      'src/data/starter-attachments.ts',
      'src/data/reward-attachment-catalog.ts',
      'src/data/anomaly-reward-catalog.ts',
      'src/engine/gameInit.ts',
    ],
    readSites: [
      'src/engine/encounterFilterPipeline.ts',
      'src/engine/spellActivation.ts',
      'src/engine/ambitionTick.ts',
      'src/engine/worldSeed.ts',
    ],
    verifiedLive: {
      date: '2026-07-26',
      evidence:
        'THR-737. `collectGrantedTraits` (effectQueries.ts) wraps `hasGrantedTrait` and is consumed by all three production trait gates: encounter eligibility (encounterFilterPipeline `requiredTraits` + `blockedByTraits`), spell prerequisites (spellActivation `traitKeys`), and ambition eligibility (ambitionTick `buildAmbitionAgentSnapshot` + worldSeed initial assignment). Non-vacuous by live payload intersection: `artifact-templates.ts` grants `master_smith` via `trait_grant`, and `ambition-templates.ts` gates an ambition on `requiredTraits: [\'master_smith\']`. Headless sweep on seed 42 confirms a granted trait flipping eligibility — see `trait_grant` consumer tests in effectQueries.test.ts and ambitionTick.test.ts. Re-verified 2026-07-26 under THR-786: all four consumers now reach the granted set through `collectBearerTraitRefs({ grantedTraits })`, covered by the site-1/4/5/6 granted-trait cases in `__tests__/contracts/traitPredicate.contract.test.ts`.',
    },
  },
  {
    id: 'attachment-on-use-triggers',
    producerSystem: ATTACHMENTS,
    consumerSystem: ENCOUNTERS,
    intent: 'Items break, deplete, or curse their bearer on use — authored consequence for carrying power.',
    // THR-719 re-pointed this contract off the retired `onUseTriggers`/
    // `attachmentTriggers.ts` pair (deleted) onto the production-wired
    // `action_trigger` primitive. The dead symbols are gone from the row by
    // design — leaving them would keep the evidence key pointing at a corpse.
    mechanism: {
      kind: 'node-prop',
      symbols: ['action_trigger', 'checkAndFireActionTriggers', 'applyActionTriggerPayloads'],
      module: 'src/engine/effects/actionTriggerPayloads.ts',
    },
    writeSites: ['src/data/starter-attachments.ts', 'src/data/anomaly-reward-catalog.ts'],
    readSites: [
      'src/engine/unifiedActionResolution.ts',
      'src/engine/orchestrator.ts',
      'src/engine/phaseMovement.ts',
      'src/engine/effects/actionTrigger.ts',
    ],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        'Both sides carry live symbol hits. Producer: 9 authored `action_trigger` entries across starter-attachments.ts + anomaly-reward-catalog.ts (port-completeness test asserts the count and that every condition_grant names an existing node). Consumer: `checkAndFireActionTriggers` is called from unifiedActionResolution.ts (ladder-mapped outcome bands), orchestrator.ts, and phaseMovement.ts; the graph-affecting payloads are executed by `applyActionTriggerPayloads` at all three sites. Value-level check: the granted has_trait edge carries `ticksRemaining`, the field `decayConditions` actually counts down (asserted in actionTriggerOnUse.test.ts + the ported lifecycle integration test), not the inert `durationTicks` that `apply_condition` writes.',
    },
  },
  {
    id: 'attachment-activated-effects',
    producerSystem: ATTACHMENTS,
    consumerSystem: ENCOUNTERS,
    intent: 'Player-activated item powers (ActivatedAbility).',
    mechanism: { kind: 'node-prop', symbols: ['activatedEffects'] },
    writeSites: ['src/data/artifact-templates.ts', 'src/types/attachments.ts'],
    readSites: [],
    deferralTicket: 'THR-720',
  },
  {
    id: 'attachment-tier-advancement',
    producerSystem: ATTACHMENTS,
    consumerSystem: ATTACHMENTS,
    intent: 'Tier advancement strengthens an item over time.',
    mechanism: {
      kind: 'function',
      symbols: ['advanceAttachmentTier', 'canAdvanceTier'],
      module: 'src/engine/attachmentTierAdvancement.ts',
    },
    writeSites: ['src/engine/attachmentTierAdvancement.ts'],
    // Was `['src/engine/orchestrator.ts']` until THR-723 — a transcribed intention,
    // not a verified read. The orchestrator has never imported this module.
    // THR-996 supplied the real one: the `advance_artifact_tier` GraphOp, which
    // `artifact.enchant` / `artifact.empower` fire on a successful step.
    readSites: ['src/engine/graphOpExecutor.ts'],
    // Correction to the hand audit (THR-717 implementation, 2026-07-23): the canon
    // page badged this 🟠 PARTIAL on the assumption that advancement runs and merely
    // feeds the dead `modifiers` stat path. Tier 1 shows worse — the module's only
    // importer is its own test, so advancement never runs at all. Left to the
    // mechanical verdict rather than pinned, because the mechanical read is the
    // accurate one.
    //
    // THR-723 (2026-08-06) closed half of that: the resolver now scales the artifact's
    // `stat_contribution` effects — the live substrate `computeRawScore` reads — instead
    // of the dead edge `modifiers`, clamped to ITEM_STAT_BAND_LEGENDARY. So its *output*
    // is no longer wasted.
    //
    // THR-996 (2026-08-10) closed the other half on Christian's verdict ("Turn the
    // enchantment system on", 2026-08-06): `advance_artifact_tier` is the production
    // caller, fired by `artifact.enchant` (Veil) and `artifact.empower` (Iron) on a
    // successful step. Both ends of the contract are now live, so the row carries no
    // deferral. The authored per-tier cost/difficulty ramp remains unexpressible in a
    // static step — that is THR-1073, a tuning gap, not a broken contract.
  },

  // ── Attachments → inbound ─────────────────────────────────────────────────
  {
    id: 'attachment-encounter-rewards',
    producerSystem: ENCOUNTERS,
    consumerSystem: ATTACHMENTS,
    intent: 'Encounters grant rewards, which become possessions — by random draw from the pool, or as an authored consequence naming one template.',
    // Two entry points, one write path. `assembleRewardPool` is the draw; THR-1110's
    // `attachment_grant` aftermath effect calls the instantiators directly, so an
    // author can name the thing instead of weighting a category.
    mechanism: {
      kind: 'function',
      symbols: ['assembleRewardPool', 'instantiateReward', 'instantiateAgreementReward'],
      module: 'src/engine/rewardPool.ts',
    },
    writeSites: ['src/engine/rewardPool.ts', 'src/types/attachments.ts'],
    readSites: [
      'src/engine/orchestrator.ts',
      'src/engine/unifiedActionResolution.ts',
      'src/engine/encounterAftermath.ts',
    ],
    verifiedLive: { date: '2026-08-14', evidence: `possesses edges grow 7→82 over 120 ticks (seed 42, medium). Authored arm (THR-1110): the crossroads accept path writes one agreement edge binding the actor to the materialized stranger, 132-tick term (seed 42, medium, CLI). ${AUDIT_EVIDENCE}` },
  },
  {
    id: 'attachment-worldgen-starters',
    producerSystem: 'Agent Lifecycle',
    consumerSystem: ATTACHMENTS,
    intent: 'Worldgen seeds starting possessions so agents begin already carrying history.',
    mechanism: { kind: 'function', symbols: ['seedAttachments'], module: 'src/engine/seedAttachments.ts' },
    writeSites: ['src/engine/seedAttachments.ts'],
    readSites: ['src/engine/worldSeed.ts'],
    verifiedLive: { date: '2026-07-23', evidence: `7 possesses edges present at tick 0. ${AUDIT_EVIDENCE}` },
  },

  // ── Ambitions ─────────────────────────────────────────────────────────────
  {
    id: 'ambition-acquisition',
    producerSystem: 'Agent Lifecycle',
    consumerSystem: AMBITIONS,
    intent: 'Agents acquire ambitions at worldgen, birth, and re-evaluation.',
    ulTerms: ['Ambition'],
    mechanism: { kind: 'function', symbols: ['assignInitialAmbitions'] },
    writeSites: ['src/engine/ambitionAssignment.ts'],
    readSites: ['src/engine/worldSeed.ts', 'src/engine/agentLifecycle.ts', 'src/engine/ambitionTick.ts', 'src/engine/gameInit.ts'],
    verifiedLive: { date: '2026-07-23', evidence: `pursues edges grow 32→225 over 120 ticks, 182 active. ${AUDIT_EVIDENCE}` },
  },
  {
    id: 'ambition-progress-milestones',
    producerSystem: AMBITIONS,
    consumerSystem: 'Attention, Chronicle & Narrative',
    intent: 'Ambitions progress and complete, firing milestone events the player sees.',
    mechanism: { kind: 'function', symbols: ['phaseAmbitionProgress'] },
    writeSites: ['src/engine/phases/ambitionProgress.ts'],
    readSites: ['src/engine/ambitionTick.ts', 'src/engine/phases/index.ts'],
    verifiedLive: { date: '2026-07-23', evidence: `15-tick cadence; milestone events observed firing. ${AUDIT_EVIDENCE}` },
  },
  {
    id: 'mandate-milestone-prose-narrates-transitions',
    producerSystem: 'Mandate',
    consumerSystem: NARRATIVE,
    intent:
      'The campaign spine narrates its own turns — a mandate stage advance, completion or failure reads in the authored voice of that mandate, not a generated stub.',
    ulTerms: ['Victory Mandate'],
    mechanism: {
      kind: 'function',
      symbols: ['resolveMilestoneProse', 'MANDATE_MILESTONE_PROSE'],
      module: 'src/engine/mandateMilestoneProse.ts',
    },
    writeSites: ['src/data/mandates/**', 'src/data/mandate-loader.ts', 'src/data/mandate-content.ts'],
    readSites: ['src/engine/mandateMilestoneProse.ts', 'src/engine/phaseMandate.ts'],
    badgeOverride: {
      badge: 'PARTIAL',
      reason:
        'THR-1197 wired both phaseMandate evaluators through resolveMilestoneProse, so the consumer half is real and traced. The producer half does not reach it: the 48 authored strings are keyed to the 12 template mandate ids, and no live game instantiates one — both gameInit writers call generateRememberedMandate, and generateMandate has no production caller. Every live resolution therefore takes the fallback branch. Mechanically LIVE, in effect PARTIAL until the fork is ruled.',
      deferralTicket: 'THR-1198',
    },
  },
  {
    id: 'ambition-biases-encounter-choice',
    producerSystem: AMBITIONS,
    consumerSystem: ENCOUNTERS,
    intent: 'An agent\'s ambitions bias which encounters they choose — motive drives action.',
    mechanism: { kind: 'function', symbols: ['applyAmbitionBoost'] },
    writeSites: ['src/engine/ambitionBoost.ts'],
    readSites: ['src/engine/agentSelection.ts'],
    verifiedLive: { date: '2026-07-23', evidence: `applyAmbitionBoost feeds encounterScoring in the decision pipeline. ${AUDIT_EVIDENCE}` },
  },
  {
    id: 'ambition-motive-receipts',
    producerSystem: AMBITIONS,
    consumerSystem: 'Omens & Atmospheric Pressure',
    intent: 'Ambitions explain motives — receipts carry ambition provenance into foreshadowing.',
    mechanism: { kind: 'trace', symbols: ['ambitionBoost'] },
    writeSites: ['src/engine/encounterScoring.ts', 'src/engine/agentSelection.ts'],
    readSites: ['src/engine/foreshadowing/**'],
    verifiedLive: { date: '2026-07-23', evidence: `ambitionBoost term appears in motiveReceipt provenance. ${AUDIT_EVIDENCE}` },
  },
  {
    id: 'faction-ambitions-drive-action',
    producerSystem: AMBITIONS,
    consumerSystem: 'Factions & Succession',
    intent: 'Faction ambitions drive faction action and render on the faction sheet.',
    mechanism: { kind: 'function', symbols: ['factionAmbitions'], module: 'src/engine/factionAmbitions.ts' },
    writeSites: ['src/engine/phases/factionAmbitions.ts'],
    readSites: ['src/engine/phases/index.ts', 'src/engine/factionGovernanceVerbs.ts', 'src/engine/phaseControlEffects.ts'],
    verifiedLive: { date: '2026-07-23', evidence: `FactionSheet.activeAmbition renders; faction phases consume. ${AUDIT_EVIDENCE}` },
  },
  {
    id: 'ambition-player-visibility',
    producerSystem: AMBITIONS,
    consumerSystem: 'Intelligence, Knowledge & Familiarity',
    intent: 'The player can see what a mortal is striving for.',
    ulTerms: ['Ambition', 'Interaction Depth'],
    mechanism: { kind: 'function', symbols: ['getAmbitionsStrand'] },
    writeSites: ['src/engine/strands.ts'],
    readSites: ['src/components/**'],
    verifiedLive: {
      date: '2026-07-24',
      evidence:
        'THR-721: JourneyTab gate retuned — AMBITION_PRIMARY_INTERACTIONS 2→1 and hardcoded `known` promoted to AMBITION_PRIMARY_KNOWLEDGE = `recognised`, so a single meaningful exposure surfaces the primary ambition. getAmbitionsStrand read by useAgentInteraction.ts feeds the AgentProfileModal tabs; browser-verified at 1920×1080.',
    },
  },
  {
    id: 'ambition-completed-history',
    producerSystem: AMBITIONS,
    consumerSystem: 'Attention, Chronicle & Narrative',
    intent: 'Completed ambitions accumulate into a readable history of who an agent became.',
    mechanism: { kind: 'function', symbols: ['completedAmbitions', 'getCompletedAmbitions'] },
    writeSites: ['src/engine/agentDetail.ts'],
    readSites: ['src/components/Game/tabs/ChronicleTab.tsx'],
    verifiedLive: {
      date: '2026-07-24',
      evidence:
        'THR-721: getCompletedAmbitions (agentDetail.ts) walks completed `pursues` edges and populates AgentInfoCardData.completedAmbitions; ChronicleTab §Completed Ambitions renders it (replacing the "will appear here" placeholder). The missing consumer this row named now exists; browser-verified at 1920×1080.',
    },
  },

  // ── Coupling assessment 2026-07-23 — pre-seeded by the Fable design session ──
  // (Docs/audits/2026-07-23-simulation-coupling-assessment.md). Each row is a
  // documented break; the executor's ticket is literally "turn these rows green".

  {
    id: 'secrets-generation',
    producerSystem: 'Encounters & Dilemmas',
    consumerSystem: 'Secrets & Favors',
    intent: 'Secrets are born from scenes — mortals learn things about each other worth holding.',
    ulTerms: ['Encounter', 'Aftermath'],
    mechanism: { kind: 'function', symbols: ['generateSecret', 'createSecretEdge'] },
    writeSites: ['src/engine/orchestrator.ts', 'src/engine/encounterAftermath.ts'],
    readSites: ['src/engine/secretsFromResolution.ts', 'src/engine/secretGeneration.ts'],
    verifiedLive: {
      date: '2026-07-23',
      evidence:
        'THR-724: `secretsFromResolution.ts` reads `secretDiscovery`/`favorGeneration` template metadata at the newly-resolved transition in orchestrator.ts — the live seam (the legacy read site walks `encounterProgress`, empty all run). 120-tick CLI run, seed 42 / medium: 18 `knows_secret_of` + 2 `owes_favor` edges born, across 4 distinct sources (confession, observation, spy_debrief, tavern_gossip); baseline on the same seed was 0/0.',
    },
  },
  {
    id: 'secrets-consequences',
    producerSystem: 'Secrets & Favors',
    consumerSystem: 'Encounters & Dilemmas',
    intent: 'A revealed secret or broken favor has consequences — feuds ignite, sentiment shifts, leverage bites.',
    mechanism: {
      kind: 'function',
      symbols: ['applySecretRevelationConsequences', 'applyFavorBreakingConsequences', 'revealBestSecret'],
      module: 'src/engine/secretsFavorsConsequences.ts',
    },
    writeSites: ['src/engine/secretsFavorsConsequences.ts'],
    readSites: ['src/engine/phaseSecretsFavors.ts', 'src/engine/unifiedActionResolution.ts'],
    verifiedLive: {
      date: '2026-07-23',
      evidence:
        'THR-724: the duplicate fork is resolved — `secretsConsequences.ts` deleted, its additive confession penalty and subject-to-audience sentiment migrated into the survivor. Two production callers now exist: the autonomous revelation pass in `phaseSecretsFavors.ts`, and `revealBestSecret` from the `reveal_secret` resolution intercept. 120-tick CLI run, seed 42 / medium: 4 of 18 secrets revealed with trust/sentiment deltas and a chronicle line naming the subject.',
    },
  },
  {
    id: 'secrets-player-verbs-reachable',
    producerSystem: 'Ascendant Beats & Progression',
    consumerSystem: 'Secrets & Favors',
    intent:
      'The god can plant and reveal secrets — the Eye identity’s signature verbs enter the hand via a beat grant (player-loop links 2–4).',
    mechanism: { kind: 'function', symbols: ['action.secrets.plant_secret', 'action.secrets.reveal_secret'] },
    writeSites: ['src/data/ascendant-beat-content.ts', 'src/data/ascendant-pool-beat-templates.ts'],
    readSites: ['src/data/unified-action-templates.ts', 'src/engine/unifiedActionResolution.ts'],
    verifiedLive: {
      date: '2026-07-23',
      evidence:
        'THR-724: `beat.pool.invest.the_unveiled_eye` grants both ids; `__DEBUG.listUnreachableActions()` no longer lists them. Link 3 verified rather than assumed — `plant_secret` writes a `knows_secret_of` edge via the existing graph-executor case, and `reveal_secret` now routes through the resolution intercept so it applies real consequences instead of only flipping the `revealed` flag.',
    },
  },
  {
    id: 'economy-context-scene-scoring',
    producerSystem: 'Mortal Economy & Prosperity',
    consumerSystem: 'Encounters & Dilemmas',
    intent: 'Boom and bust color which scenes fire — a blighted province tells desperate stories, a boom throws festivals.',
    ulTerms: ['Encounter'],
    // Site correction on implementation (THR-725, audit-on-touch): the design session
    // predicted `phaseProsperity.ts` as the producer of this symbol. It is not — the term is
    // implemented in `economicContext.ts` and consumed by the scorer; `phaseProsperity.ts`
    // carries the *seeding* half of the feature, which is the row below plus the
    // `econ_shock_seeded` trace. Recording where the code actually lives, not where it was
    // expected to.
    // Both symbols on purpose: the producer exports `computeEconomicContextBonus`, the
    // consumer binds the result as `economicContextBonus` and carries it onto the scoring
    // trace and the debug breakdown. Greping only the latter finds the consumer and misses
    // the producer, which is what pinned this row LEAKED on the first regeneration.
    mechanism: {
      kind: 'function',
      symbols: ['computeEconomicContextBonus', 'economicContextBonus'],
      module: 'src/engine/economicContext.ts',
    },
    writeSites: ['src/engine/economicContext.ts'],
    readSites: ['src/engine/encounterScoring.ts'],
    verifiedLive: {
      date: '2026-07-23',
      evidence:
        'THR-725: 120-tick standard run (seed 42, medium, unforced) produced 184 nonzero `economicContextBonus` contributions on `encounter_scoring` traces — e.g. `encounter.bandit_ambush econ=+0.0700 final=0.950` at a bust settlement and `encounter.grand_tournament econ=-0.0006` penalised for the same reason. Values, not just symbols: the term moves finalScore.',
    },
    deferralTicket: 'THR-725',
  },
  {
    id: 'economy-verbs-answered',
    producerSystem: 'Mortal Economy & Prosperity',
    consumerSystem: 'Encounters & Dilemmas',
    intent:
      'The four granted economic verbs (bless_harvest, blight, open_markets, reveal_vein) get a visible story response — player-loop link 4.',
    // Mechanism correction on implementation (THR-725): the row was seeded greping the verb
    // *ids*, on the assumption the scorer would name them. It deliberately does not — shock
    // detection and scene scoring are cause-agnostic, so battle aftermath and any future
    // cause get the same story response the player's cards do. What actually crosses the
    // boundary is the `prosperity` property: the verbs write it, `economicContext.ts` reads
    // it. Greping the verb ids here would have manufactured a permanent phantom leak.
    mechanism: { kind: 'node-prop', symbols: ['prosperity'] },
    writeSites: ['src/data/unified-action-templates.ts'],
    readSites: ['src/engine/economicContext.ts'],
    verifiedLive: {
      date: '2026-07-23',
      evidence:
        'THR-725: end-to-end in the CLI (seed 42, medium) — applied `loc.blight`\'s -10 prosperity write to Thornhaven at tick 20; tick 21 emitted `econ_shock_seeded` (bust, -10.0) planting `encounter.debt_collection` and `encounter.aid_refugees`; by tick 27 both had matured into live scenes on the seeded agents. The verb now produces story, not just a number.',
    },
    deferralTicket: 'THR-725',
  },
  {
    id: 'economy-provisions-armies',
    producerSystem: 'Mortal Economy & Prosperity',
    consumerSystem: 'War, Armies & Battles',
    intent:
      'An army eats from the towns its faction holds, along the roads and trade routes that reach them. Sever the line — or let bandits settle on it, or let the far end fall into famine — and the host in the field starves without anyone fighting it. This is what makes cutting a supply route an economic act with a military consequence, and gives a Gold/Shadow god a way into a war that a god of Iron would not think to use.',
    ulTerms: ['Stock Tier'],
    // Two values cross this boundary, and both are read on the CONSUMER's side by
    // `resolveSupplyLine` walking the producer's own state — there is no bridge
    // function to name, which is deliberate: a supply line is a *derived path over
    // relationships that already exist*, not a durable edge someone writes.
    //   1. `resourceBalance` — the aggregate a location carries after
    //      `phaseResourceStockTiers`, gating whether a town can host an army at all.
    //   2. `threatened` — the flag set when a `trades_with` edge stops carrying: by
    //      `routeEvents.ts` when banditry materializes on it, and since THR-1308 by
    //      `strategicGraphOps.blockadeRoute` when a motivated warlord shuts a road
    //      deliberately. Either way it multiplies throughput rather than zeroing it,
    //      so a line is STRANGLED instead of cut — and `routeEvents` clears both
    //      after the same horizon, which is what keeps a blockade a counter rather
    //      than an erasure. The second writer is why this bullet names the property's
    //      meaning rather than one phase: a war-system reader must not care which
    //      cause stopped the wagons.
    //      THR-1320 is worth knowing here even though it changes no symbol on this
    //      row: until it landed, the `trades_with` half of this contract was live in
    //      code and dead in every world. A strategically founded route was removed six
    //      ticks after it opened, so `resolveSupplyLine`'s walk found zero route
    //      conduits at tick 150 on seeds 42 and 99 and every supply line ran over
    //      `road` edges alone — and `threatened` on a route could never be read here,
    //      because no route survived to carry it. The row was not wrong; it was
    //      unreachable on one of its two conduits, which no test on either side could
    //      show. Founded routes now stand out a grace window and both conduits are
    //      genuinely exercised.
    // Declaring the consumer's own function names here would pin the row LEAKED
    // forever, for the reason `economy-sustains-essence-sources` records above: the
    // producing phases have no reason to name a war-system reader.
    mechanism: { kind: 'node-prop', symbols: ['resourceBalance', 'threatened'] },
    writeSites: [
      'src/engine/phases/resourceStockTiers.ts',
      'src/engine/phases/routeEvents.ts',
      // THR-1308: the warlord's blockade verb is the second writer of `threatened`.
      'src/engine/strategicGraphOps.ts',
    ],
    readSites: ['src/engine/armySupply.ts'],
    verifiedLive: {
      date: '2026-08-05',
      evidence:
        'THR-626: driven end-to-end in a real world, not a fixture. `--seed 42 --map medium`, tick 120: the one live army ("The Civic Guard — Host") resolves `supplyHostId: null` with larder 46/100 and tier `strained`; by tick 132 it is `starving` at 0/100 and the scan trace reads `army-supply scan: 1 armies, 1 cut off, 0 strained, 1 starving, 1 seeded`, planting `army.supply.siege_lifted` because that army is the attacker in an active siege. Browser-confirmed on the served bundle at 1920×1080: `__DEBUG.getArmies()` returns `supplyTier: "starving"`, `supply: 10`, `supplyHost: null`, with cohesion visibly dragged 90% → 47% by the coupled `unsupplied` attrition term. Values and the consequence, not just symbols.',
    },
  },
  {
    id: 'economy-sustains-essence-sources',
    producerSystem: 'Mortal Economy & Prosperity',
    consumerSystem: 'Essence & Divine Economy',
    intent:
      "A god's power is rooted in the land their people work: the goods of a source's own Sphere nurture or wither its sanctity, so an economy the player neglects quietly costs them essence.",
    ulTerms: ['Stock Tier'],
    // The boundary is the derived `stockTier` on a location's resources bag — NOT the
    // aggregate `resourceBalance`, and NOT prosperity. The bridge deliberately reads the
    // same coarse per-resource tier the Livelihood line reads, so the number the player
    // is shown and the number the divine economy acts on cannot drift apart. Greping
    // `prosperity` here would find the wrong coupling (that is `economy-verbs-answered`).
    // Mechanism is the node-prop, not the bridge's own function names: the boundary is
    // crossed by the value, and the reader (`essenceEconomyBridge.ts`) is on the far side
    // of it. Declaring `computeSanctitySustenance` here pins the row LEAKED forever,
    // because the producing phase has no reason to name the consumer's function — the
    // same trap `economy-verbs-answered` records one row above.
    mechanism: { kind: 'node-prop', symbols: ['stockTier'] },
    writeSites: ['src/engine/phases/resourceStockTiers.ts'],
    readSites: ['src/engine/essenceEconomyBridge.ts'],
    verifiedLive: {
      date: '2026-07-28',
      evidence:
        'THR-618: driven through the served browser bundle — two controlled Spirit shrines, one on surplus pearls and one on scarce, 60 ticks of `recomputeControlledSourceTiers`. The rich valley climbed 0.30 → 0.50 and STOPPED at `ECON_SANCTITY_NURTURE_CEILING`, tier still `dormant` (the land readies a source; only a Sanctify cast flowers it); the poor valley fell 0.30 → 0.00. First tick reported `econNurtured: 1, econWithered: 1` on the aggregate phase counters. Values and the bound, not just symbols.',
    },
  },
  {
    id: 'world-events-mint-ambitions',
    producerSystem: 'Encounters & Dilemmas',
    consumerSystem: AMBITIONS,
    intent: 'World events write themselves into mortal desire — a sacked town mints avengers and refugees.',
    ulTerms: ['AxiologicalProfile'],
    mechanism: { kind: 'function', symbols: ['AMBITION_MINTING_RULES', 'mintAmbitionsFromEvents'] },
    // Read-site correction on implementation (THR-726): the row was seeded pointing at
    // `ambitionSelection.ts` on the assumption the funnel would name the minting symbols.
    // It does not — the pass calls the generic `selectAmbitions`; the symbols that cross
    // the boundary are the rules TABLE (`AMBITION_MINTING_RULES`, defined in the data
    // module and read by the tick) and the minting function (`mintAmbitionsFromEvents`,
    // defined + run in `ambitionTick.ts`). Greping ambitionSelection.ts would have
    // manufactured a permanent phantom leak.
    writeSites: ['src/engine/ambitionTick.ts'],
    readSites: ['src/data/ambition-minting-rules.ts'],
    verifiedLive: {
      date: '2026-07-24',
      evidence:
        'THR-726: CLI (seed 42, medium) — advanced to tick 75; `ambition_minted` aggregate trace fired (mintedCount>0, byEventClass populated), and inspected minted `pursues` edges carry `mintedByEventId` + a themed template drawn through `selectAmbitions`. Events write desire, capped at MINT_MAX_PER_EVENT per event.',
    },
  },
  {
    id: 'minted-ambition-provenance',
    producerSystem: AMBITIONS,
    consumerSystem: 'Omens & Atmospheric Pressure',
    intent: 'Motive receipts name the origin of a minted want — "she seeks vengeance for the blighted fields."',
    mechanism: { kind: 'edge-prop', symbols: ['mintedByEventId'] },
    writeSites: ['src/engine/ambitionTick.ts'],
    readSites: ['src/engine/foreshadowing/motiveReceipt.ts'],
    verifiedLive: {
      date: '2026-07-24',
      evidence:
        'THR-726: `ambitionTick.ts` writes `mintedByEventId`/`mintedByLabel` on the minted `pursues` edge; `motiveReceipt.ts` `resolveMintedAmbitionProvenance` reads them and overrides the ambition contribution\'s provenance detail so the receipt names the origin event.',
    },
  },

  // ── The reactive loop reaches the player (THR-1298 slice 7) ────────────────
  {
    id: 'grievance-reaches-the-mortal-sheet',
    producerSystem: AMBITIONS,
    consumerSystem: NARRATIVE,
    intent:
      'A vendetta says on the character sheet whose it is and how hot it burns — "burning · against Oswen, after the razing of Thornhall" — so a drive the world minted from a harm is legible as such rather than as an ordinary want.',
    ulTerms: ['Ambition'],
    // Extends `minted-ambition-provenance` rather than adding a channel: the same
    // `pursues` edge, the same provenance keys, a second consumer. The grievance block
    // lives on the *edge* because the ambition node is shared per templateId — two
    // agents avenging two different harms pursue one node, and only the edge knows
    // whose harm it was.
    mechanism: {
      kind: 'edge-prop',
      symbols: ['grievance', 'culpritAgentId', 'heat', 'heatWord'],
      module: 'src/engine/agentDetail.ts',
    },
    writeSites: ['src/engine/ambitionTick.ts', 'src/engine/grievance/grievanceLifecycle.ts'],
    readSites: [
      'src/engine/agentDetail.ts',
      'src/components/Game/IntentSection.tsx',
      'src/debug-bridge.ts',
      'scripts/cli.ts',
    ],
    verifiedLive: {
      date: '2026-09-02',
      evidence:
        'Constructed proof against the real pipeline (seed 42, medium): `createUndertakingOutcomeNode` wrote evt_und_proof_60 (property_destroyed, culprit ind_0 "Oswen", victim agent_mc_cmdr_1), the tick-75 mint pass wrote the `pursues` edge {grievance:true, culpritAgentId:"ind_0", harmMagnitude:0.8, heat:0.8, mintedByLabel:"the razing of Wilderness (13, 6) — Oswen\'s work"}, and `getAgentInfoCard` rendered it as `Seek Revenge -> burning · against Oswen, after the razing of Wilderness (13, 6) — Oswen\'s work`. Locked by src/engine/__tests__/agentDetail-grievance.test.ts and src/components/Game/__tests__/grievance-surfaces.test.tsx, each guard falsified by a reverted mutation.',
    },
  },
  {
    id: 'agent-grudge-reaches-the-mortal-sheet',
    producerSystem: AMBITIONS,
    consumerSystem: NARRATIVE,
    intent:
      'Blood between two people is standing relationship colour on the character sheet — "There is blood between them and Oswen — an old wrong that never quite closed."',
    ulTerms: ['Agent'],
    // The agent-scale sibling of `group-grudge-reaches-the-mortal-sheet`, which reads the
    // same edge type at *company* scale. Two contracts rather than one because they have
    // different consumers (BondsTab vs OverviewTab) and different membership: this one
    // deliberately excludes collective actors, which is the whole of that one's subject.
    mechanism: {
      kind: 'edge-prop',
      symbols: ['hostile_to', 'grudges', 'causeClause'],
      module: 'src/engine/agentDetail.ts',
    },
    writeSites: [
      'src/engine/grievance/grudgeEdge.ts',
      'src/engine/groups/bandOpposition.ts',
      'src/engine/mentorshipOutcomes.ts',
    ],
    readSites: [
      'src/engine/agentDetail.ts',
      'src/components/Game/tabs/BondsTab.tsx',
      'src/debug-bridge.ts',
      'scripts/cli.ts',
    ],
    verifiedLive: {
      date: '2026-09-02',
      evidence:
        'Constructed proof (seed 42, medium): `writeGrudge(second, ind_0, cause "grievance_cooled")` — the cooling path\'s own writer — surfaced through `getAgentGrudges` as "There is blood between them and Oswen — an old wrong that never quite closed." The reader crosses the documented three-key provenance divergence (`cause`/`reason`/`basis`) and excludes collective actors, both pinned by src/engine/__tests__/agentDetail-grievance.test.ts; the rendered Blood section and its absence arm are pinned by src/components/Game/__tests__/grievance-surfaces.test.tsx.',
    },
  },

  // ── Divine Receipt — player action resolution feedback (THR-727) ───────────
  {
    id: 'player-action-aftermath-read',
    producerSystem: ENCOUNTERS,
    consumerSystem: 'Attention, Chronicle & Narrative',
    intent:
      'The aftermath a player action already produces finally reaches the player — the receipt phase reads the summary that was built and discarded for player casts.',
    ulTerms: ['Aftermath'],
    mechanism: { kind: 'function', symbols: ['processPlayerReceipts', 'aftermathSummary'], module: 'src/engine/playerReceipts.ts' },
    writeSites: ['src/engine/unifiedActionResolution.ts'],
    readSites: ['src/engine/playerReceipts.ts'],
  },
  {
    id: 'player-action-receipts-queue',
    producerSystem: ENCOUNTERS,
    consumerSystem: 'Attention, Chronicle & Narrative',
    intent: 'A resolved player cast queues a Divine Receipt the UI surfaces as a toast or a receipt dialogue.',
    mechanism: { kind: 'node-prop', symbols: ['playerActionReceipts'] },
    writeSites: ['src/engine/playerReceipts.ts'],
    readSites: ['src/components/Game/GameView.tsx', 'src/debug-bridge.ts'],
  },
  {
    id: 'receipt-event-band-toast',
    producerSystem: ENCOUNTERS,
    consumerSystem: 'Attention, Chronicle & Narrative',
    intent: 'A receipt toast carries its outcome band so the toast accent matches how the cast landed.',
    mechanism: { kind: 'event', symbols: ['band'] },
    writeSites: ['src/engine/playerReceipts.ts'],
    readSites: ['src/engine/notificationRouter.ts'],
  },

  // ── Player-cast outcome variance (THR-728) ────────────────────────────────
  {
    id: 'authored-step-difficulty-player-resolution',
    producerSystem: ENCOUNTERS,
    consumerSystem: ENCOUNTERS,
    intent:
      'Authored step difficulty finally prices a player cast. 82 of 136 ascendant-castable templates carried difficulties 0.1–0.6 that the player branch discarded before this contract existed; the same value now feeds the shared capability-vs-difficulty roll, floored at success-at-cost.',
    ulTerms: ['Domain Capability', 'UnifiedActionTemplate'],
    mechanism: { kind: 'function', symbols: ['resolveUncontestedStep', 'difficulty'], module: 'src/engine/unifiedActionResolution.ts' },
    writeSites: ['src/data/unified-action-templates.ts'],
    readSites: ['src/engine/unifiedActionResolution.ts', 'src/engine/targetActions.ts'],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        'THR-728: `unified-action-templates.ts` authors `steps[].difficulty`; `resolveUncontestedStep` reads it for `source === \'player\'` (the auto-success early-return is now gated behind `PLAYER_CAST_VARIANCE_ENABLED`), and `targetActions.ts` reads the same field via `maxStepDifficulty` to render the focused card\'s risk line. Measured over 400 seeds: the outcome set for a positive-difficulty cast is >1 band. THR-1073 rerouted both read sites through `tierScaledDifficulty`: a step declaring `difficultyContext: \'target_tier_scaled\'` treats its authored `difficulty` as a tier-1 baseline and resolves the real value from the target\'s tier. Both sites resolve through the same helper, so the card\'s risk line cannot drift from the roll; a step without the marker is returned unchanged.',
    },
  },

  // ── Target-derived action price (THR-1073) ────────────────────────────────
  {
    id: 'authored-tier-ramp-target-scaled-price',
    producerSystem: ENCOUNTERS,
    consumerSystem: ENCOUNTERS,
    intent:
      'The authored per-tier advancement ramp reaches the player. `TIER_ADVANCEMENT_ESSENCE_COST` / `TIER_ADVANCEMENT_DIFFICULTY` / `TIER_ADVANCEMENT_DURATION` author a 3-row ladder, but only row 1 had a consumer — a static template step cannot read its target\'s tier — so advancing a Mundane artifact and a Mythic one both cost 4 essence at difficulty 0.20, and both took 2–3 ticks.',
    ulTerms: ['UnifiedActionTemplate', 'Attachment Tier'],
    mechanism: { kind: 'function', symbols: ['tierScaledEssenceCost', 'tierScaledDifficulty', 'tierScaledDuration', 'essenceCostContext'], module: 'src/engine/targetTierScaling.ts' },
    writeSites: ['src/data/attachment-tier-content.ts', 'src/data/unified-action-templates.ts'],
    readSites: [
      'src/engine/targetActions.ts',
      'src/engine/playerCastDispatch.ts',
      'src/engine/unifiedActionResolution.ts',
      'src/engine/unifiedActionLifecycle.ts',
    ],
    verifiedLive: {
      date: '2026-08-13',
      evidence:
        'THR-1073: `attachment-tier-content.ts` authors the ramp and `unified-action-templates.ts` opts `artifact.enchant`/`artifact.empower` in via `essenceCostContext` + `difficultyContext: \'target_tier_scaled\'`. Three read sites resolve it — `targetActions.ts` (card price, affordability gate, displayed risk), `playerCastDispatch.ts` (essence actually charged, with the buff discount applied to the resolved price), `unifiedActionResolution.ts` (the difficulty rolled against). Falsified by removing the marker from `artifact.enchant`: exactly three assertions go red including `expected 4 to be greater than 4`, while `artifact.empower` stays green. `targetTierScaling.test.ts`, 15 assertions. THR-1100 completed the third row of the ramp — `tierScaledDuration` under the *same* per-step marker, read by `unifiedActionLifecycle.ts` at both duration draws (`createUnifiedAction` and `advanceStep`), which now take the target\'s properties from the five production call sites that hold the graph. Falsified by neutering the helper to return the authored range: 7 of 10 assertions go red including `expected 2 to be greater than 2`. `targetTierScalingDuration.test.ts`, 10 assertions.',
    },
  },
  {
    id: 'ascendant-affinity-cast-capability',
    producerSystem: ENCOUNTERS,
    consumerSystem: ENCOUNTERS,
    intent:
      "The ascendant's persisted reach affinities become its capability for a cast — the god's innate aptitude is not on the raw scale `computeRawScore` walks, so a literal read left every cast at capability 0.02 and one reachable outcome band.",
    ulTerms: ['Domain Capability', 'Reach'],
    mechanism: { kind: 'node-prop', symbols: ['domainAffinities', 'computeCapabilityWithRawBonus'] },
    writeSites: ['src/engine/ascendant.ts'],
    readSites: ['src/engine/unifiedActionResolution.ts'],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        "THR-728: `createAscendant` writes `domainAffinities` (2–5 per reach); `resolveUncontestedStep` reads it via `getAscendantDomainAffinities` and maps it onto the raw scale with `ascendantCastRawBonus` before `computeCapabilityWithRawBonus`. Deliberately NOT wired into `computeRawScore`, so THR-613's Deepening tier-crossings keep reading the score they were tuned against (pinned by a test).",
    },
  },

  // ── Companies & Group Travel (THR-74) ─────────────────────────────────────
  // Movement & Colocation and Encounters were both ⚪ UNAUDITED; these rows are
  // their first contract entries for the surfaces this ticket touches
  // (audit-on-touch, verified by grep at implementation time, not transcribed
  // from the plan's intentions).
  {
    id: 'company-membership-excludes-faction-reads',
    producerSystem: COMPANIES,
    consumerSystem: FACTIONS,
    intent:
      'A member of a group — a company, and since THR-1297 a network — is not a member of a faction by that name; faction rank, allegiance display and heraldry must keep reading the faction.',
    ulTerms: ['Company', 'Faction'],
    mechanism: { kind: 'edge-prop', symbols: ['getFactionMembershipEdges', 'isGroupMembershipTarget'] },
    // The guard itself is the producer: groupFormation mints the colliding
    // `member_of` edge, but what every faction reader consumes is this filter.
    // THR-1297 moved the *rule* behind it into `engine/groupShape.ts` so the
    // discriminator has one home instead of two hand-mirrored copies.
    writeSites: ['src/engine/graphQueries.ts', 'src/engine/groupShape.ts'],
    readSites: [
      'src/engine/graphQueries.ts',
      'src/engine/anointSuccessor.ts',
      'src/engine/contextBuilder.ts',
      'src/engine/notableAgendas.ts',
      'src/engine/detailPageResolvers.ts',
      // THR-1297 slice 1 brought the remaining agent-sourced raw readers in; the
      // full list is the sweep recorded in the evidence below.
      'src/engine/factionReputation.ts',
      'src/engine/strategicActionCandidates.ts',
      'src/engine/retinue.ts',
      'src/engine/siegeResolution.ts',
      'src/engine/unifiedActionResolution.ts',
    ],
    verifiedLive: {
      date: '2026-08-27',
      evidence:
        'THR-1297 slice 1 completed the sweep THR-74 started: 48 further agent-sourced `member_of` reads that treated any target as "their faction" now route through getFactionMembershipEdges, taking the routed total to 62 of the 69 raw call sites. The 7 that remain raw are deliberate and annotated in place — army-sourced reads (an army really is member_of its faction), the three group-scoped resolvers that exist to find the company, and reputation.ts\'s target-addressed a→b finder, whose membership leg must keep resolving standing with one\'s own company. The rule itself moved to engine/groupShape.ts (getGroupKind → groupKind tag first, pre-THR-1297 property-presence as back-compat fallback), retiring the hand-mirrored copy in graphQueries.ts. This is what makes the network kind safe: isFactionMembershipEdge rested on "companies are the only non-faction member_of target", which a network (THR-1288, member_of contact edges) makes false. One live defect fixed in passing — strategicActionCandidates.ts\'s `faction` target rule returned a company as a faction target. Non-vacuous by src/engine/__tests__/factionMembershipGolden.test.ts (11 tests): a differential over real seeded worlds (42, 99) re-deriving the pre-THR-1297 rule inline and asserting the wrapper agrees agent-by-agent, with a company constructed into each world because a tick-0 world has none — falsified 5-of-11 red with isGroupMembershipTarget stubbed to false (the per-seed differentials stayed green before the constructed company was added, which is the vacuity the pin closes). Full suite 18532 green; 30-tick seed-42 CLI smoke reached tick 30 with 377 agents.',
    },
  },
  {
    id: 'company-drives-member-movement',
    producerSystem: COMPANIES,
    consumerSystem: 'Movement & Colocation',
    intent: 'A company travels as one — members share a destination instead of wandering off separately.',
    ulTerms: ['Company'],
    // `movementState` is the carrier: groupMovement writes it, phaseMovement
    // executes it on the very next phase. Greping the carrier (not the internal
    // helper names) is what proves the two ends are actually connected.
    mechanism: { kind: 'node-prop', symbols: ['movementState'] },
    writeSites: ['src/engine/groups/groupMovement.ts'],
    readSites: ['src/engine/phaseMovement.ts', 'src/engine/movementExecution.ts'],
    verifiedLive: {
      date: '2026-07-24',
      evidence:
        'phaseGroups writes members\' MovementState and phaseMovement (next phase in runTick) executes it. 72-tick CLI smoke, seed 42 medium: "The Watch of the Nameless Road" members Nareth and Hestia both at Wolfton; "The Steadfast Sparrows" both at Shadow-shade.',
    },
  },
  {
    id: 'company-position-derives-from-leader',
    producerSystem: COMPANIES,
    consumerSystem: 'Movement & Colocation',
    intent:
      'A company has no position of its own — asking where it is means asking where its leader is, so there is never a second spatial truth to drift.',
    ulTerms: ['Company'],
    mechanism: { kind: 'function', symbols: ['getGroupPosition'] },
    writeSites: ['src/engine/groups/groupQueries.ts'],
    readSites: ['src/debug-bridge.ts', 'scripts/cli.ts'],
    verifiedLive: {
      date: '2026-07-24',
      evidence:
        'Company nodes carry no located_at edge; locked by src/engine/groups/__tests__/groupLifecycle.test.ts § "never attaches a located_at edge to the company node".',
    },
  },
  {
    id: 'reunite-rides-draw-together-convergence',
    producerSystem: COMPANIES,
    consumerSystem: ENCOUNTERS,
    intent:
      'A god calling a dead company back does not invent a new kind of pull — the scattered feel exactly the tug Draw Together uses, so their own encounter choices bend homeward.',
    ulTerms: ['Company', 'Draw Together'],
    // The contract is the *property triple*, not a function: reunite_company writes
    // the same convergePullHexCol/_HexRow/_UntilTick keys that computeConvergenceBonus
    // reads. Writing them under any other name would leave Reunite inert while every
    // test that only checked "a window opened" still passed — which is why the
    // property names, not the op, are the mechanism named here.
    mechanism: {
      kind: 'property',
      symbols: ['convergePullHexCol', 'convergePullHexRow', 'convergePullUntilTick'],
    },
    writeSites: ['src/engine/graphOpExecutor.ts'],
    readSites: ['src/engine/encounterScoring.ts', 'src/engine/groups/groupFormation.ts'],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        'src/engine/groups/__tests__/reuniteSunder.test.ts § "opens the window and stamps Draw Together\'s convergence pull on former members" asserts all three property names on every gatherable former member after the op. Falsified during authoring: renaming the written key to convergePullUntilTickBROKEN fails that test, so the guard is not vacuous.',
    },
  },
  {
    id: 'draw-together-carries-caster-sphere-to-the-name',
    producerSystem: COMPANIES,
    consumerSystem: COMPANIES,
    intent:
      'A company gathered by a god carries that god in its name — the sphere the verb was cast under reaches the naming of the company it produces, one tick later.',
    ulTerms: ['Company', 'Draw Together', 'Sphere'],
    // The carrier is a property on the *pulled mortals*, because the company does not
    // exist when the op fires — the formation scan mints it later and reads the flavor
    // back off whichever member it gathered. Named here for the reason THR-770 exists:
    // this whole path failed silently for the life of the feature. `generateGroupName`
    // ends in `?? []`, so a write/read key mismatch produces a perfectly ordinary name
    // with no warning, no throw, and no failing test — indistinguishable from a god
    // who simply had no alignment.
    mechanism: {
      kind: 'property',
      symbols: ['convergePullSphere'],
    },
    writeSites: ['src/engine/graphOpExecutor.ts'],
    readSites: ['src/engine/groups/groupFormation.ts'],
    verifiedLive: {
      date: '2026-08-06',
      evidence:
        'src/engine/__tests__/graphOpExecutor.drawTogether.test.ts § "stamps the caster\'s primary sphere on every mortal it pulls" asserts the written key; src/engine/groups/__tests__/groupFormationCause.test.ts § convergencePullSphere asserts the read, including that an expired pull is ignored. The read end is falsified independently by src/data/__tests__/group-name-content.test.ts, which requires the sphere pool to change generated output — a dead key leaves it byte-identical, which is exactly the state THR-770 found.',
    },
  },
  {
    id: 'reunion-reads-the-edges-not-the-roster',
    producerSystem: COMPANIES,
    consumerSystem: COMPANIES,
    intent:
      'Who once rode with a company survives its ending — the record is the membership edges dissolution stamped, never the roster it emptied.',
    ulTerms: ['Company'],
    // The carrier is the *edge property*, not the accessor function. `dissolveGroup`
    // stamps `leftAtTick` on every `member_of` edge instead of removing it (while
    // clearing the node's `roster` to `[]`), and `getFormerGroupMembers` walks those
    // stamped edges. Naming the accessor as the mechanism was the first draft and it
    // classified LEAKED — the functions live in groupQueries.ts, so the declared
    // producer had none of the symbols. Impediment #206's rule applies: declare the
    // symbol that really crosses the boundary, not the one you had in mind.
    mechanism: { kind: 'property', symbols: ['leftAtTick'] },
    writeSites: ['src/engine/groups/groupDissolution.ts'],
    readSites: [
      'src/engine/groups/groupQueries.ts',
      'src/engine/groups/groupFormation.ts',
    ],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        'src/engine/groups/__tests__/reuniteSunder.test.ts § "the cleared-roster trap" asserts roster === [] after dissolveGroup *and* that getFormerGroupMembers still returns all three riders — so a roster-based implementation fails the same test that documents why.',
    },
  },
  {
    id: 'sunder-window-amplifies-company-decay',
    producerSystem: COMPANIES,
    consumerSystem: COMPANIES,
    intent:
      'A sundered company comes apart faster and more visibly — quarrels bite harder, people leave sooner, and the drama pool starts telling the story before the numbers justify it.',
    ulTerms: ['Company', 'Group Cohesion'],
    mechanism: { kind: 'function', symbols: ['isGroupSundered'], module: 'src/engine/groups/groupQueries.ts' },
    writeSites: ['src/engine/graphOpExecutor.ts'],
    readSites: [
      'src/engine/groups/groupCohesion.ts',
      'src/engine/groups/groupDissolution.ts',
      'src/engine/groups/phaseGroups.ts',
    ],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        'src/engine/groups/__tests__/reuniteSunder.test.ts § "Sunder read sites" measures the doubled dissent delta against the plain constant, confirms non-dissent events are untouched, and confirms an open Bless window still suppresses first (the two windows are read independently and neither cancels the other).',
    },
  },
  {
    id: 'a-concealed-sale-ends-the-company-that-was-sold',
    producerSystem: ENCOUNTERS,
    consumerSystem: COMPANIES,
    intent:
      'A member who took coin for what the company knew is why it ends — the sale is recorded as the dissolution reason, not laundered into the collapse it caused.',
    ulTerms: ['Company', 'Hidden Mark', 'Group Cohesion'],
    // The carrier is `state.hiddenMarks`, not the effect kind that fills it.
    // `encounterAftermath` executes a `hidden_mark` effect into that array;
    // `findCompanyBetrayer` reads it back and matches on `category === 'betrayal'`.
    // Declaring `hidden_mark` here would name the authoring vocabulary rather than
    // the thing that crosses the boundary — impediment #206's rule, and the same
    // trap the sibling `reunion-reads-the-edges-not-the-roster` row records.
    mechanism: { kind: 'property', symbols: ['hiddenMarks'] },
    writeSites: ['src/engine/encounterAftermath.ts'],
    readSites: ['src/engine/groups/groupDissolution.ts'],
    verifiedLive: {
      date: '2026-08-18',
      evidence:
        'src/engine/groups/__tests__/groupLifecycle.test.ts § "betrayal dissolution (THR-1174)" drives the reason through runGroupUpkeep and reads it off the result — never by passing the literal to selectPartingVariant, which is how this contract sat consumer-only for months. Disabling the trigger fails 3 of its rows; the negative rows (floor, category, former member, holding company) stay green by design.',
    },
  },
  {
    id: 'company-assist-shapes-resolution',
    producerSystem: COMPANIES,
    consumerSystem: ENCOUNTERS,
    intent:
      'Companions make each other better at what they attempt — the best-suited member acts and the others assist, capped so a crowd is not an auto-win.',
    ulTerms: ['Company', 'Group Cohesion'],
    mechanism: { kind: 'function', symbols: ['resolveGroupStep'], module: 'src/engine/groups/groupResolution.ts' },
    writeSites: ['src/engine/groups/groupResolution.ts'],
    // PR 2a un-pinned this row: the call site now exists inside
    // resolveUncontestedStep, and the eligibility sweep opens 63 shipped
    // templates to companies so the path is actually reachable in play.
    // `resolutionModifiers.ts` was dropped from the read sites — the plan named
    // it as a candidate, but the hook went in at the capability/modifier
    // computation instead, and the symbol does not appear there (impediment #206:
    // declare the symbol that really crosses the boundary, not the intended one).
    readSites: ['src/engine/unifiedActionResolution.ts'],
    verifiedLive: {
      date: '2026-07-24',
      evidence:
        'src/engine/groups/__tests__/groupResolutionWiring.test.ts drives resolveUncontestedStep end-to-end and asserts the payload, not just the call: a weak leader in a company resolves above his own solo capability (best-member substitution), a solo agent and a company holding a non-group-affinity template both resolve at exactly the solo capability, and the resolution.input trace carries groupId/actingMemberId/groupAssistCount/groupBonus. An emptied company falls back to the individual path without throwing.',
    },
  },
  {
    id: 'company-gates-exclusive-content-reachability',
    producerSystem: COMPANIES,
    consumerSystem: ENCOUNTERS,
    intent:
      'Some expeditions can only be attempted by a company — a grouped agent may draw a party-exclusive template, but only when their company can field enough living members for it.',
    ulTerms: ['Company'],
    mechanism: { kind: 'function', symbols: ['livingGroupMemberCount'] },
    writeSites: ['src/engine/groups/groupQueries.ts'],
    readSites: ['src/engine/unifiedCandidates.ts'],
    // Un-pinned by PR 2b: three `['group']`-only delve templates now ship in the
    // registry (encounter.sunken_vault / broken_span / hollow_watch), so the gate
    // has a live consumer. The row is exercised end-to-end against real content,
    // not just synthetic fixtures.
    verifiedLive: {
      date: '2026-07-24',
      evidence:
        'src/data/__tests__/partyExclusiveDelves.test.ts drives generateUnifiedCandidates against the actual authored delves: a company of 2 at a dungeon draws encounter.sunken_vault, while a solo agent at the same place draws nothing. Content-integrity tests assert all three delves carry actorAffinities exactly ["group"] (never swept to include "individual") and minGroupMembers: 2, in both ENCOUNTER_TEMPLATES and the assembled UNIFIED_ACTION_TEMPLATES. The synthetic-fixture unit tests (src/engine/__tests__/unifiedCandidates.test.ts § "Group-exclusive reachability") still lock the gate mechanics.',
    },
  },

  // ── Band opposition (THR-731 PR 2) ────────────────────────────────────────
  // Contested-pair resolution was ⚪ UNAUDITED; this is its first contract row,
  // written audit-on-touch and grep-verified at implementation time.
  {
    id: 'band-opposition-pairs-contested-resolution',
    producerSystem: COMPANIES,
    consumerSystem: ENCOUNTERS,
    intent:
      'A company that walks into a band fights it — the two resolve as one contested encounter rather than each rolling alone against the scenery.',
    ulTerms: ['Company', 'Group Cohesion'],
    // `opposingGroupId` is the carrier the two ends agree on. THR-74's plan named
    // this field but never shipped it (zero hits across src/ at plan time); PR 2
    // adds it, so this row lands LIVE with symbols on both sides rather than as a
    // deferred intention.
    mechanism: {
      kind: 'node-prop',
      symbols: ['opposingGroupId', 'collectBandOppositions'],
      module: 'src/engine/groups/bandOpposition.ts',
    },
    writeSites: ['src/engine/groups/bandOpposition.ts', 'src/types/unifiedAction.ts'],
    readSites: ['src/engine/contestation.ts', 'src/engine/unifiedActionResolution.ts'],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        'Organic 150-tick CLI run, seed 42 medium (no forcing, no debug spawns): the Temple of the Spheres fielded a defender band, "The Temple of the Spheres\' Sparrows", which was met by Company of the Inn at t81 and by Flintlock\'s Band at t84. Trace at t81: [group_contested] "Company of the Inn came off best against The Temple of the Spheres\' Sparrows. Bagaabraa did not walk away." Both companies carry hostile_to edges with cause group_engagement; the band fell 0.70 → 0.19 cohesion and disbanded through the shipped phaseGroups cascade. Unit-locked by src/engine/groups/__tests__/bandOpposition.test.ts (22 tests) incl. the fail-soft degradation rows.',
    },
  },
  {
    id: 'contested-outcome-band-reaches-the-player',
    producerSystem: COMPANIES,
    consumerSystem: ENCOUNTERS,
    intent:
      'Losing a fight reads differently from merely failing — a contested loss says so in the chronicle and the receipt.',
    ulTerms: ['Company'],
    mechanism: { kind: 'function', symbols: ['contestedOutcomeFor', 'contested_won'] },
    writeSites: ['src/engine/groups/bandOpposition.ts', 'src/engine/unifiedActionResolution.ts'],
    readSites: ['src/components/Game/ChapterView.tsx', 'src/engine/playerReceipts.ts'],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        'contested_won/contested_lost shipped with TB-044 and had display strings in ChapterView, a playerReceipts severity mapping, and an isActionSuccess branch — with ZERO producers until this PR (grep at implementation time: the only non-declaration hits were the consumer-side switch arms). phaseUnifiedActionProgress now stamps the band on both sides of a resolved group contest, so the vocabulary the UI was already built to speak finally gets spoken. Locked by bandOpposition.test.ts § "gives the contested outcome band its first production producer".',
    },
  },

  // ── Confrontation family (THR-731 PR 3) ───────────────────────────────────
  {
    id: 'confrontation-content-gated-on-a-live-opponent',
    producerSystem: COMPANIES,
    consumerSystem: ENCOUNTERS,
    intent:
      'An encounter about fighting a particular band is only offered while that band is standing there — a confrontation never surfaces against nobody.',
    ulTerms: ['Company', 'Encounter'],
    mechanism: {
      kind: 'function',
      symbols: ['requiresOpposingBand', 'hasOpposingBand'],
      module: 'src/engine/groups/bandOpposition.ts',
    },
    writeSites: ['src/data/encounter-content.ts', 'src/types/unifiedAction.ts'],
    // Both draw paths, deliberately: company content travels two roads and a gate
    // on one of them is not a gate.
    readSites: ['src/engine/unifiedCandidates.ts', 'src/engine/encounterFilterPipeline.ts'],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        'The gate is enforced on BOTH paths a template reaches an agent by. generateUnifiedCandidates already gated group-exclusive content on minGroupMembers (THR-74); the location-cache path (getEncountersByLocationType → encounterCache → encounterFilterPipeline) had NO actor-affinity stage at all, measured at implementation time: getEncountersByLocationType("ruins") returned 7 group-exclusive templates — including THR-74\'s shipped sunken_vault/broken_span/hollow_watch — with nothing downstream reading actorAffinities, so party-exclusive delves were reachable by solo agents in contradiction of their authoring contract. filterByPrerequisites (stage 3, the pipeline\'s documented prerequisites stage) now enforces both minGroupMembers and requiresOpposingBand. Locked by src/engine/groups/__tests__/confrontationContent.test.ts (27 tests), which asserts both gates on both paths and pins the solo-agent case that was previously open. Re-verified 2026-07-27 under THR-811: the stage-3 gate only ever saw the templates its lookup could resolve, and `getAnyEncounterById` missed 43 of the 213 cache-registrable ids, so on that id set both gates passed unchecked regardless of authoring. The loop now resolves via getUnifiedTemplateById (0 unresolvable), and the swept `withGroupAffinity` copy is what the gate reads — pinned, along with the polarity check that no template becomes NEWLY group-exclusive, by src/engine/__tests__/prerequisiteTemplateResolution.test.ts.',
    },
  },
  {
    id: 'guild-rank-gates-senior-content',
    producerSystem: FACTIONS,
    consumerSystem: ENCOUNTERS,
    intent:
      "A guild's senior and elite work reaches only members who have earned standing in that guild — a passer-by cannot take a captain's commission because they happened to be standing in the hall.",
    ulTerms: ['Faction', 'Encounter'],
    mechanism: {
      kind: 'function',
      symbols: ['minRank', 'meetsFactionRankRequirement', 'RANK_GATED_QUEST_TYPES'],
      module: 'src/engine/factionReputation.ts',
    },
    // The requirement is authored per template on the meta map, not on the template
    // itself — which is why it survived so long unread.
    writeSites: ['src/data/faction-encounter-content.ts', 'src/data/faction-definitions.ts'],
    readSites: ['src/engine/encounterFilterPipeline.ts'],
    verifiedLive: {
      date: '2026-07-26',
      evidence:
        "THR-805. `FACTION_ENCOUNTER_META.minRank` was authored on ~150 template metas and typed at types/faction.ts:72, with NO production reader — its only non-data references were three tests asserting the data round-trips — so every tier-restricted guild template was drawable by any agent at the right location. filterByPrerequisites now consults it for entries whose questType is senior/elite/leadership (RANK_GATED_QUEST_TYPES); the 123 `standard` quest/social metas stay ungated, since minRank is a REQUIRED field and gating on its presence would have closed the entry tier behind mere membership. Rank is derived from member_of.reputation via computeRankFromReputation on every check, never read from the edge's cached rank/role (those refresh only on a tier change, so a decay in progress reads stale). Non-membership closes the gate; unresolvable data (unknown factionDefId, or a minRank naming no tier) fails OPEN, because a typo that silently orphans content is the worse failure. Two adjacent substrates were rejected and are recorded so they are not revived: the `faction_rank:` predicate in effectPredicates.ts reads agentNode.properties.factionRank, which NOTHING writes (grep the assignment side — every other hit is a local display string), so it is permanently 0 and false for any threshold; and FactionRankTier.encounterAccess prefix allowlists are equally unread AND already drifted (merchant_consortium declares mc_trade.* while its templates are mct.*). Non-vacuous by live payload intersection and measured blast radius: 60 rank-gated metas exist, exactly 12 are present in a live tick-150 seed-42 cache (the guild tail THR-779/THR-803 registered), and a live sweep shows the gate closed for a real low-rank member and open for that same member once promoted past the floor. Locked by src/engine/__tests__/factionRankGate.test.ts (14 tests), falsified at 2-of-14 red with the gate disabled. The gate deliberately does NOT depend on resolving the template — it needs only the id and its meta. That independence was load-bearing when it shipped, because the pipeline's `getAnyEncounterById` returned undefined for every cache-registered regional template, leaving the sibling trait/broken/group gates in the same loop inert for those ids. THR-811 closed that gap on 2026-07-27: the loop now resolves via getUnifiedTemplateById, which covers all 213 cache-registrable ids (43 of them were unresolvable before), so the sibling gates are live for this id set too.",
    },
  },
  {
    id: 'seeded-opponent-survives-to-spawn',
    producerSystem: ENCOUNTERS,
    consumerSystem: COMPANIES,
    intent:
      'A grudge planted against a named band is collected against that same band — or, if it died in the meantime, quietly becomes an ordinary encounter instead of pointing at a corpse.',
    ulTerms: ['Company', 'Encounter'],
    mechanism: {
      kind: 'node-prop',
      symbols: ['opposingGroupId', 'resolveSeedOpposition'],
      module: 'src/engine/encounterSeeding.ts',
    },
    writeSites: ['src/engine/encounterSeeding.ts'],
    readSites: ['src/engine/groups/bandOpposition.ts'],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        'PR 2 declared PendingEncounterSeed.opposingGroupId and wired findOpposingBand to honour UnifiedAction.opposingGroupId, but nothing carried the value across the seed → action boundary — grep at implementation time found the seed field with zero readers, so a seed naming its enemy dropped it in silence. evaluateEncounterSeeds now re-validates (node exists ∧ isBandNode ∧ groupStatus active ∧ ≥1 living member) and stamps the action. Locked by confrontationContent.test.ts § "evaluateEncounterSeeds — opposingGroupId carry": the live case carries, and dissolved / emptied-out / not-a-band all spawn uncontested rather than blocking the encounter.',
    },
  },

  // ── Rivals line (THR-731 PR 4) ─────────────────────────────────────────────
  {
    id: 'group-grudge-reaches-the-mortal-sheet',
    producerSystem: COMPANIES,
    consumerSystem: NARRATIVE,
    intent:
      'A company that has fought someone carries it visibly — the mortal sheet names the rival in prose, so blood between companies is legible without a trace viewer.',
    ulTerms: ['Company'],
    // The `hostile_to` edge existed and had faction-scale readers; this is its first
    // *group*-scale player-facing consumer. Extend, not add.
    mechanism: {
      kind: 'edge-prop',
      symbols: ['hostile_to', 'rivals'],
      module: 'src/engine/agentDetail.ts',
    },
    // The writer moved in THR-1298 slice 5: `writeGrudge` left `bandOpposition.ts` for
    // the shared `grievance/grudgeEdge.ts` when the grievance lifecycle needed the same
    // edge. `bandOpposition.ts` stays a write site — it is still the caller that decides
    // a company engagement earns a grudge — but the `hostile_to` literal now lives in
    // the helper, which is why the declared site had to follow it.
    writeSites: [
      'src/engine/grievance/grudgeEdge.ts',
      'src/engine/groups/bandOpposition.ts',
    ],
    readSites: ['src/engine/agentDetail.ts', 'src/components/Game/tabs/OverviewTab.tsx'],
    verifiedLive: {
      date: '2026-07-25',
      evidence:
        'Live CLI run, seed 42 medium: a company relocated into a Great Silverhold guild hall resolved encounter.confront_guild_falls against a colocated Arcane Circle defender band at t61 — company cohesion 0.54 → 0.70, band 0.70 → 0.46 — and the contest wrote mutual grudges, read straight off the graph: "The Watch of the Nameless Road -> The Errant Keys of The Arcane Circle since t61 (group_engagement)" and the reverse. agentDetail reads both edge directions off the group node and dedupes the mutual pair; OverviewTab renders it as one sentence with no numbers and no `since` tick. Locked by src/engine/groups/__tests__/bandDebugSurfaces.test.ts § "Company panel — Rivals" (7 tests: absent when no grudge, outgoing, incoming-only, mutual-dedupe, dangling-target drop, deterministic multi-rival order).',
    },
  },

  // ── Nudge Model WS0 (THR-773) ─────────────────────────────────────────────
  // First contract slice for two ⚪ UNAUDITED subsystems (Encounters & Dilemmas,
  // Spheres & Quintessence) — audit-on-touch. The full-subsystem audits stay open.
  {
    id: 'authored-nudge-hand-reaches-resolution',
    producerSystem: ENCOUNTERS,
    consumerSystem: ENCOUNTERS,
    intent:
      'A god may bend the odds of an attended encounter step with authored, essence-priced cards — the mechanical form of "the intervention shifted the odds, not the outcome". Without this read, an attended encounter offers the player nothing to do but watch.',
    ulTerms: ['Nudge', 'Encounter', 'UnifiedActionTemplate'],
    mechanism: {
      kind: 'function',
      symbols: ['collectNudgeModifiers', 'selectActiveRider', 'applyRider', 'buildNudgeHand'],
      module: 'src/engine/encounters/nudges.ts',
    },
    writeSites: ['src/types/unifiedAction.ts', 'src/data/nudge-constants.ts'],
    readSites: ['src/engine/unifiedActionResolution.ts', 'src/debug-bridge.ts'],
    // No `verifiedLive` yet: the read sites exist and are exercised by tests, but no
    // shipped template authors a `nudges[]` hand — WS1 owns authoring. Verifying LIVE
    // here would badge a path nothing travels (the THR-614 error class).
    deferralTicket: 'THR-774',
  },
  {
    id: 'quintessence-threshold-gates-candidacy-and-movement',
    producerSystem: QUINTESSENCE,
    consumerSystem: ENCOUNTERS,
    intent:
      'A mortal worn to nothing goes out of the story rather than grinding on unchanged — the previously missing consumer of the weakened/critical threshold states. Without it, quintessence loss has no behavioural consequence at all.',
    ulTerms: ['Quintessence', 'Broken (mortal state)'],
    mechanism: {
      kind: 'node-prop',
      symbols: ['isBrokenMortal', 'brokenGateActive', 'computeBrokenDriftBonus', 'brokenSince'],
      module: 'src/engine/brokenState.ts',
    },
    writeSites: ['src/engine/phaseQuintessence.ts', 'src/engine/rekindleThread.ts'],
    readSites: [
      'src/engine/encounterFilterPipeline.ts',
      'src/engine/encounterScoring.ts',
      'src/engine/phaseAscendantProgression.ts',
    ],
    // Deliberately not LIVE: `BROKEN_GATE_ENABLED` ships false, so the candidacy
    // exclusion and drift pull are wired but inert until WS5's rebuild encounters
    // exist. The state derivation and erosion scaling ARE live. Badging this LIVE
    // today would claim behaviour the shipped flag suppresses.
    badgeOverride: {
      badge: 'PARTIAL',
      reason:
        'Read sites are wired and tested, but gated behind BROKEN_GATE_ENABLED = false until WS5 authors the rebuild encounters. Erosion scaling + brokenSince bookkeeping are live; candidacy exclusion + broken_drift are not.',
      deferralTicket: 'THR-778',
    },
    deferralTicket: 'THR-778',
  },
  // ── Dealt hands — the Repertoire fills the hand (THR-1247) ─────────────────
  {
    id: 'repertoire-deals-into-encounter-hand',
    producerSystem: ENCOUNTERS,
    consumerSystem: ENCOUNTERS,
    intent:
      "A hand reads as *this god's* hand in any scene: the encounter authors only the cards it alone could offer, and the god's own Repertoire supplies the rest. Without this read, an encounter can only ever show the cards its author happened to write, and the repertoire progression the player earned stays invisible in play.",
    ulTerms: ['Nudge', 'Encounter', 'UnifiedActionTemplate'],
    mechanism: {
      kind: 'function',
      symbols: ['dealHand', 'mintDealtNudge', 'composeDealtStep', 'composeDealtStepFromState'],
      module: 'src/engine/encounters/dealHand.ts',
    },
    writeSites: [
      'src/data/nudge-card-library.ts',
      'src/data/nudge-constants.ts',
      'src/types/unifiedAction.ts',
    ],
    // Both read sites are load-bearing and neither is redundant. The adapter
    // composes what the player *sees*; resolution re-derives the same fill
    // because it never receives that hand — it rebuilds its step from the
    // template, and every mechanics reader then resolves committed ids against
    // that list. Adapter-only composition would ship a card that renders,
    // prices and charges and then contributes nothing, which is why the
    // resolution site is named here as a contract rather than left implicit.
    readSites: [
      'src/engine/unifiedActionResolution.ts',
      'src/components/Game/encounter-stage/adapters/buildNudgePhaseModel.ts',
      'src/debug-bridge.ts',
    ],
    // LIVE since THR-1254. The `badgeOverride` is deleted rather than reworded,
    // because the single condition it named is now false — see `verifiedLive`.
    verifiedLive: {
      date: '2026-08-26',
      evidence:
        "THR-1254. The override this replaces named exactly one outstanding condition — \"no shipped encounter declares `ActionStep.deal` yet, so the deal never runs in a real playthrough\" — and `The Unfinished Rite` (`encounter.delve.the_unfinished_rite`) is that encounter: a registered, contract-clean template whose step 0 authors two specials and declares `deal: { count: 4, tags: ['insight','lore'] }`. Not a fixture and not the golden exemplar (which is registered in no pool and so can never prove Stage 4): it sits in both catalog arrays, and `npm run check:encounter-live -- encounter.delve.the_unfinished_rite` returns `proved`, having spawned it on the ascendant in a seeded world, committed a hand and ticked to resolution. Non-vacuous by `src/data/encounters/__tests__/the-unfinished-rite.test.ts` § *the composed hand*, which composes the SHIPPED template's step against a repertoire built by `buildRepertoire` from a real sphere identity — deliberately not a fixture holding the whole library, which would have asserted the fixture rather than the dealer — and pins that the dealer contributed on top of the specials (`report.dealt.length > 0`, composed > authored, both specials surviving, size inside DEAL_HAND_MIN..MAX) and that two composes of the same input agree, which is the zero-PRNG guarantee the resolution read site depends on. Measured across three sphere identities the same step composes three different six-card hands — darkness/order draws Follow The Book, Hide The Deed, Open The Ledger; light/life draws Show The Obvious, Ease The Suffering, Buy The Floor; force/matter draws Throw Full Weight, Find What Remains — with the two specials constant and at least one ungated common in each, which is the contract's intent line demonstrated rather than asserted. Both specials are things the dealer structurally cannot mint: `rite.loosen_their_nerve` binds `opposes: 'rival'` to a cast key only this scene declares, and `rite.kindle_heresy` grants `axiological_mark_apply` with `reach: 'veil'`, the reach-scoped case the authoring spec § 3b names. The compiler gap found on the way is part of this verification: `encounterPackageViolations` restated the whole-hand rules and was blind to `deal`, so the only sanctioned authoring path rejected every composed encounter while the shipped gate passed it; it now delegates to `checkComposedHand`.",
    },
  },
  // ── Nudge card dispatch → host systems (THR-885) ───────────────────────────
  // The god's hand is the activation surface several idle systems were missing.
  // Each row is a card→system write; all three are wired and tested but not yet
  // LIVE, because no shipped card authors a grant — content lands under THR-883.
  {
    id: 'nudge-card-grants-dispatch-to-host-systems',
    producerSystem: ENCOUNTERS,
    consumerSystem: AMBITIONS,
    intent:
      'A card that says it changed the world actually changes it, through the system that owns that change — so the fiction the player is shown and the state the world holds cannot disagree.',
    ulTerms: ['Nudge', 'Ambition'],
    mechanism: {
      kind: 'function',
      symbols: ['dispatchNudgeCommitments', 'collectNudgeGrants', 'assignAmbitionToActor'],
      module: 'src/engine/encounters/nudgeDispatch.ts',
    },
    writeSites: ['src/engine/phases/phaseAutonomousAftermath.ts'],
    readSites: ['src/engine/encounterAftermath.ts', 'src/engine/ambitionAssignment.ts'],
    // Card grants ride the existing `EncounterAftermathReactionEffect` vocabulary and
    // are applied by the existing applier, so `emit_omen` / `remove_condition` /
    // `spawn_artifact` / `hidden_mark` / `favor_creation` needed no new path at all.
    // `assign_ambition` is the one genuinely new kind: reactive ambition templates had
    // no assignment path outside `ambitionTick` (THR-812 / THR-726), which is why the
    // shared `assignAmbitionToActor` helper was extracted from the three in-phase copies.
    //
    // Corrected THR-1179: this comment read "no shipped card authors `grants`, so
    // nothing travels this path yet" until 2026-08-19, by which point
    // `slice.pass.deep_rest` in `vertical-slice.ts` did author them — the claim had
    // been false for some time and nothing could catch it, since a stale *comment*
    // is exactly the kind of drift the freshness gates do not read. Content coverage
    // is still thin (one authored grant across the shipped set), so the row stays
    // un-LIVE rather than jumping to a badge one template cannot carry.
    //
    // The grant-liveness gate (`validateNudgeGrantRefs`) is what stops an authored
    // card from naming content nobody built.
    deferralTicket: 'THR-883',
  },
  {
    id: 'compulsion-card-plants-agent-decision-bias',
    producerSystem: ENCOUNTERS,
    consumerSystem: ENCOUNTERS,
    intent:
      'A god can steer one mortal without seizing them: the card plants an urge, and that mortal\'s own next decision leans toward it — you steered them, they still chose.',
    ulTerms: ['Nudge', 'Encounter'],
    mechanism: {
      kind: 'function',
      symbols: ['derivePlantedCompulsionEncounterBias', 'phasePlantedCompulsionDecay'],
      module: 'src/engine/plantedCompulsion.ts',
    },
    writeSites: ['src/engine/encounterAftermath.ts'],
    readSites: ['src/engine/phaseAgentDecision.ts'],
    // The sixth of THR-885's dispatch hooks, and the only one that needed a design
    // call before it could be wired (THR-886). Its apparent host, `buildCompulsionEvent`,
    // takes the decision pipeline's `ScoredCandidate[]` — a list that exists only
    // mid-`phaseAgentDecision`, which aftermath cannot obtain. Christian ruled
    // 2026-08-09 that the card plants a *weight*, not a candidate menu, and a weight
    // IS available at the aftermath seam: `plant_compulsion` writes a per-agent
    // `PlantedCompulsion`, and `phaseAgentDecision` folds it into the same
    // `combinedBias` the omen path already feeds. `premonitionCompulsion` is untouched.
    //
    // Per-agent where the omen bias is per-hex — the two carriers stay separate
    // because that difference is the card ("steer them, not the world").
    //
    // Not LIVE: no shipped card authors `grants` yet, so nothing travels this path
    // until content lands under THR-883 — the same reason the three THR-885 rows
    // above carry the deferral. Badging it LIVE would be the THR-614 error class.
    deferralTicket: 'THR-883',
  },
  {
    id: 'relocation-intent-steers-agent-movement',
    producerSystem: ENCOUNTERS,
    consumerSystem: ENCOUNTERS,
    intent:
      'An ending that says someone left actually sends them — and the leaving is a journey the player can watch, not a body appearing elsewhere.',
    ulTerms: ['Encounter', 'Agent'],
    mechanism: {
      kind: 'function',
      symbols: [
        'computeRelocationIntentBonus',
        'resolveRelocationIntentForAgent',
        'setRelocationIntent',
      ],
      module: 'src/engine/relocationIntent.ts',
    },
    writeSites: ['src/engine/encounterAftermath.ts'],
    readSites: ['src/engine/encounterScoring.ts', 'src/engine/phaseAgentDecision.ts'],
    // THR-1142, the first primitive of the consequence-palette expansion. Before it,
    // no aftermath effect could move anyone, so every ending that narrated a departure
    // backed its chip with nothing — the defect class the THR-1141 Law 56 census
    // measured ("Maret Departs", "East Is Theirs", "He Left First").
    //
    // The contract's load-bearing clause is that the write is an *intent*, not a
    // position: `agent_relocation` (travel mode) stores a `relocationIntent` property
    // and moves no one. `encounterScoring` reads it as one additive term on the
    // candidate score — the same channel and the same `W / (1 + hexDistance)` shape as
    // `computeConvergenceBonus` — and `phaseAgentDecision` retires the intent on
    // arrival or expiry. That is what makes "no second movement path" a fact about
    // the code rather than an intention: nothing here calls into movement at all.
    //
    // LIVE, unlike the THR-885 grant rows above: the healer encounter's
    // `healer_departs` ending authors the effect in this same PR, so the path carries
    // real traffic on a shipped template rather than waiting on content.
    //
    // Known limitation, measured rather than predicted (THR-1148): because the pull
    // attaches to encounter *candidates*, it steers reliably toward a destination that
    // has one (0.0101 → 0.6985; agent closed 26 → 20 hexes in 60 ticks, seed 42) and
    // only weakly toward an empty one. Documented at both the module header and the
    // wiring-guide row; the design question is the ticket's, not this row's.
  },
  {
    id: 'location-condition-taxes-movement-and-gates-templates',
    producerSystem: ENCOUNTERS,
    consumerSystem: ENCOUNTERS,
    intent:
      'A place can be in a state — a pass shut for the season, a town under a plague scare — and that state is something other systems act on, not scenery.',
    ulTerms: ['Encounter', 'Condition', 'Location'],
    mechanism: {
      kind: 'function',
      symbols: [
        // Write side — the aftermath branch that puts the edge on a place.
        'isLocationCarrier',
        // Read side — the movement tax and the gating context.
        'LOCATION_CONDITION_MOVEMENT_TAX',
        'buildLocationTargetContext',
        // THR-1175 — the third reader, and the only one a *player* meets.
        'LocationProfileModal',
      ],
      module: 'src/data/condition-trait-content.ts',
    },
    writeSites: ['src/engine/encounterAftermath.ts'],
    readSites: [
      'src/engine/movementCost.ts',
      'src/engine/targetContextBuilders.ts',
      // THR-1175 — named late, and named because a ticket leaned on it. This row
      // has always had three readers; it listed the two engine ones because those
      // were the two THR-1143 *built*. The profile modal reads a place's condition
      // edges generically (any `has_trait` whose definition carries
      // `subcategory: 'condition'`), so it picked up every location condition for
      // free and went unrecorded for exactly that reason.
      //
      // It stops being incidental with `standing_welcome`, the first location
      // condition that is *earned* rather than inflicted: it carries no movement
      // tax by design, and until THR-1182 authors the return encounter it gates
      // nothing either — so the modal is the only thing standing between it and
      // the hollowness this row exists to prevent. A row that omitted it would
      // read as "this condition has no consumer" to the next auditor, which is the
      // opposite of true and would invite deleting a live payoff.
      'src/components/Game/LocationProfileModal.tsx',
    ],
    // THR-1143, the second primitive of the consequence-palette expansion. The row
    // exists because the *write* was the easy half and the readers are the contract:
    // a condition on a place that nothing consumes is UI Law 56's hollowness one
    // level down, at world scope.
    //
    // Two readers, deliberately of different kinds. `computeEdgeCost` multiplies the
    // cost of entering the place by the condition's entry in the tax map — new work.
    // `buildLocationTargetContext` already read a location's `has_trait` edges into
    // `traitIds`, so `requiredTargetTraits` gating against places was live and simply
    // had no content to match — this ticket verified and pinned it rather than
    // building it, which is why the test falsifies in *both* directions (eligible
    // with the condition, ineligible once it expires); a gate that only ever passes
    // is not a gate.
    //
    // The load-bearing clause is that both readers key on the `has_trait` edge itself
    // rather than caching a derived flag. That is what makes expiry free: when
    // `decayConditions` removes the edge the tax lifts and the gate closes in the same
    // tick, with no second lifecycle to keep in step — the THR-761 lesson applied to a
    // new carrier rather than re-learned.
    //
    // Deliberately NOT a reader: encounter-type bias. That stays the omen system's
    // job; an ending wanting ambient bias emits an omen alongside. Two bias channels
    // would drift, and the omen path already carries that meaning.
    //
    // Scope note: hex-*coordinate* targeting (`buildHexTargetContext`) takes no graph
    // and hardcodes `traitIds: []`, so it does not gate on conditions. Location,
    // settlement and waypoint *nodes* do. Named here so the boundary is a recorded
    // decision rather than a gap someone later reads as a bug.
  },
  {
    id: 'membership-change-writes-rank-and-faction-rank-gate-reads-it',
    producerSystem: ENCOUNTERS,
    consumerSystem: ENCOUNTERS,
    intent:
      'An ending can make someone a member of a faction, or move them up inside it — and a later scene can require the rank it gave them.',
    ulTerms: ['Encounter', 'Faction', 'Prerequisite'],
    mechanism: {
      kind: 'function',
      symbols: [
        // Write side — the three membership ops and the id resolution they share.
        'joinFaction',
        'leaveFaction',
        'adjustMemberRank',
        'resolveFactionNodeId',
        // Read side — the predicate that gates on what was written.
        'buildPredicateContext',
        'FACTION_RANK_MAX',
      ],
      module: 'src/engine/factionMembership.ts',
    },
    writeSites: ['src/engine/encounterAftermath.ts'],
    readSites: ['src/engine/effects/effectPredicates.ts'],
    // THR-1144, the third primitive of the consequence-palette expansion. The row
    // exists for the same reason THR-1143's does: the write was the easy half.
    //
    // The reader here was not merely missing, it was *present and dead*.
    // `buildPredicateContext` read `agentNode.properties.factionRank`, a node
    // property no engine path writes, so `ctx.factionRank` was permanently 0 and
    // every `faction_rank:` predicate permanently false. THR-805 found that and
    // declined to build guild-tier gating on it. Shipping `rank_delta` without
    // reviving the reader would have written a number nothing could ever ask about
    // — UI Law 56's hollowness at world scope, which is why the reader is in this
    // ticket's scope rather than a follow-up.
    //
    // Two halves to the revival, and both are load-bearing. The context builder now
    // reads the highest `rank` across the agent's `member_of` edges — where rank has
    // always actually lived, and what `tierPromotion` and the join/promotion outcomes
    // write. And the predicate parses a *float*: `MemberOfEdgeProperties.rank`
    // declares its scale as 0 (recruit) → 1 (leader), so `parseInt` left authors
    // exactly two usable thresholds on a continuous axis. `parseFloat('2')` is still
    // 2 and no predicate had ever been authored against a dead gate, so nothing
    // changed meaning.
    //
    // The test falsifies in *both* directions on purpose: reverting the context
    // builder leaves the "below-rank agent is blocked" arm green and turns the
    // "at-rank agent is admitted" arm red. A gate that never fires passes every
    // negative-only test, which is precisely how this one stayed dead.
    //
    // `resolveFactionNodeId` is in the mechanism because the contract is unusable
    // without it: content names the faction *definition* (`'mercenary_company'`)
    // while `factionSeeding` keys nodes `faction_def_<definitionId><chapterSuffix>`.
    //
    // Deliberately NOT rerouted here: `faction_reputation_gain`, which carries the
    // same `factionId` field and the same mismatch, and is therefore dead across the
    // whole authored corpus. Filed as THR-1150 rather than changed inside an
    // unrelated PR — a recorded boundary, not an oversight.
    //
    // THR-1150 closed that boundary on 2026-08-17: the resolution moved out of these
    // three ops' bodies into a bind pass that covers every faction-carrying effect
    // kind. See `authored-faction-ids-resolve-to-seeded-faction-nodes` below. These
    // ops still resolve internally — the two are idempotent, exact-node-id-first.
  },
  {
    id: 'authored-faction-ids-resolve-to-seeded-faction-nodes',
    producerSystem: ENCOUNTERS,
    consumerSystem: FACTIONS,
    intent:
      'When an ending says it changed your standing with a guild, your standing with that guild actually changes.',
    ulTerms: ['Encounter', 'Faction'],
    mechanism: {
      kind: 'function',
      symbols: [
        // The bind pass that rewrites an authored definition id to a node id, and
        // the table of which fields on which kinds carry one.
        'bindFactionDefinitionIds',
        'resolveFactionNodeId',
        // The consumer whose match was the dead one.
        'applyFactionReputationGain',
      ],
      module: 'src/engine/encounterAftermath.ts',
    },
    writeSites: ['src/engine/encounterAftermath.ts'],
    readSites: ['src/engine/factionReputation.ts'],
    verifiedLive: {
      date: '2026-08-17',
      evidence:
        "THR-1150. `applyFactionReputationGain` matched memberships with `e.target === factionId`, a faction NODE id, while every authored `faction_reputation_gain` passes a DEFINITION id ('mercenary_company', 'temple_of_spheres', 'underking_court', 'rangers_brotherhood', 'lorekeepers_covenant'). `factionSeeding` keys the node `faction_def_<definitionId><chapterSuffix>`, so the authored id matched no node and no edge target: every faction-standing consequence in the shipped game was a no-op. Both halves are now proven against a real `initializeGameState(seed 42, medium)` world rather than a fixture — `src/engine/__tests__/factionReputationSeededWorld.test.ts` asserts the seeded node id contains the definition id AND that the definition id resolves to no node, then fires the effect with the authored value and reads the reputation move off the seeded edge. Falsified at 1-of-3 red with the fix reverted; the two arms that stay green are the deliberate controls (the premise assertion, and the already-tracing faction_not_found path). Resolution is widening-only by `resolveFactionNodeId`'s exact-node-id-first order, so the three pre-existing node-id callers (`processFactionEncounterReputation`, `factionOutcome`, `chosenFactionPowers`) resolve to themselves — pinned by the 'explicit faction node id still works' arm in `aftermathFactionDefinitionId.test.ts`, 4-of-6 red without the fix. The second half is the trace: the `newRank === 'none'` sentinel used to `break` SILENTLY, which is why a corpus-wide dead effect survived to be found by an unrelated ticket. It now emits `encounter_aftermath_effect` with `failReason: 'not_a_member' | 'faction_not_found'`, and `faction_reputation_gain` was added to `EncounterAftermathEffectTrace.effectKind` so all four traces in the arm emit unlaundered — the cast ratchet (THR-1065) fell 110 → 107. Corpus pinned by `src/testing/__tests__/factionEffectIds.lint.test.ts`, which deep-walks UNIFIED_ACTION_TEMPLATES for all eight faction-carrying effect kinds and fails on any id naming no FACTION_DEFINITIONS entry — with a population guard, since a `<=` over an empty walk is the vacuous pass this lint exists to avoid.",
    },
    // The bind pass covers all seven kinds carrying a faction id, not only the one
    // that was measurably dead: `faction_reputation_gain`, `faction_dissolve`,
    // `signature_warhost`, `faction_absorb`, `faction_declare_war`,
    // `faction_force_peace`, `faction_splinter`. The other six have no authored
    // definition ids today, so this is prevention rather than repair for them — but
    // the trap is identical and the cost is one table row each. `membership_change`
    // is deliberately absent from the table: its three ops resolve internally
    // (THR-1144), so binding it here would do the same work twice.
  },
  {
    id: 'reward-draw-shares-one-seeded-draw-with-the-step-route',
    producerSystem: ENCOUNTERS,
    consumerSystem: ENCOUNTERS,
    intent:
      'A specific ending can hand out a random matching prize — and it draws it exactly the way the step route does, so the two can never pay out differently.',
    ulTerms: ['Encounter', 'Attachment', 'Outcome Band'],
    mechanism: {
      kind: 'function',
      symbols: [
        // The one draw path both routes call.
        'drawSeededReward',
        'mapActionOutcomeToRewardOutcome',
        // The category/tag predicate the authoring-time gate reuses verbatim.
        'rewardCategoryNodeQuery',
        'rewardCandidateMatchesTags',
      ],
      module: 'src/engine/rewardPool.ts',
    },
    writeSites: [
      'src/engine/encounterAftermath.ts',
      'src/engine/unifiedActionResolution.ts',
    ],
    readSites: ['src/engine/nudgeGrantLiveness.ts'],
    // THR-1146, the fourth primitive of the consequence-palette expansion.
    //
    // The contract worth recording is not "an effect grants an item" — it is that
    // there is exactly **one** seeded draw in the codebase and two callers of it.
    // The obvious build was to copy the twenty lines out of `resolveUnifiedReward`
    // into a new dispatcher case; that produces two draws which agree on the day
    // they are written and diverge the first time either tier curve is tuned, with
    // nothing to notice. So the step route was moved onto `drawSeededReward` in the
    // same commit, and identity is a property of the code rather than a claim a
    // test has to keep re-checking.
    //
    // The test still asserts it, because the property is what the structure is for:
    // the dispatcher's drawn template is compared against a direct call with the
    // same seed key, and a *different* key is shown to draw differently — otherwise
    // "identical" would be satisfied by a draw that ignored its seed. Falsified by
    // perturbing the dispatcher's seed key: the identity arm goes red, alone.
    //
    // `readSites` is the authoring-time gate, and it is a real cross-boundary read
    // rather than bookkeeping. `validateRewardDrawPools` answers "would this recipe
    // draw anything?" by calling the engine's own category mapping and tag
    // predicate over the seed catalogs. A gate that reimplemented that mapping
    // would drift from the runtime it guards, which is the exact failure it exists
    // to prevent (THR-844: 66 dead references nobody saw for months, because a dead
    // reference costs nothing at runtime).
    //
    // Known and deliberate limit: the gate is band-agnostic. `assembleRewardPool`
    // additionally weights by the outcome's tier curve, so a recipe matching only
    // tier-4 items really is empty at `critical_failure` — but the band is not
    // knowable at authoring time, and the question worth gating is the one that is.
    // The runtime `aftermath_reward_draw_empty` trace covers the rest.
    //
    // Also deliberate: `resolveUnifiedReward` now passes a `recipientId`, where it
    // previously passed none. That feeds only the companion cap/unique filters
    // (THR-1096), which the orchestrator route has always passed and this one never
    // did — so companion category weights were silently unreachable from step
    // metadata. Verified inert on the shipped corpus before the change: no content
    // sets a `companion` weight in a step `rewardPool`.
  },
  {
    id: 'nudge-card-cost-channels-detection-and-doom',
    producerSystem: ENCOUNTERS,
    consumerSystem: QUINTESSENCE,
    intent:
      'A card can be cheap in essence and expensive somewhere else — visibility to rivals, or the doom clock — so the price of divine help is not always the same currency.',
    ulTerms: ['Nudge', 'Detection Pressure', 'Doom Clock'],
    mechanism: {
      kind: 'function',
      symbols: ['collectNudgeCostChannels', 'applyRawDetectionDelta', 'accelerateDoomClock'],
      module: 'src/engine/encounters/nudgeDispatch.ts',
    },
    writeSites: ['src/engine/phases/phaseAutonomousAftermath.ts'],
    readSites: [
      'src/engine/encounters/detectionPressure.ts',
      'src/engine/doomClock.ts',
    ],
    // `applyRawDetectionDelta` is a signed entry point added to the detection module
    // itself, not a parallel writer: every prior writer priced by `EncounterChoiceCost`
    // band, which can only *raise* pressure, so The Veil (help given unwitnessed) had
    // no channel to write through. Both entry points share the module's clamp.
    deferralTicket: 'THR-883',
  },
  {
    id: 'authored-quintessence-shift',
    producerSystem: ENCOUNTERS,
    consumerSystem: QUINTESSENCE,
    intent:
      'An encounter can finally author an existential price — what the trial cost a mortal in spirit rather than in coin or reputation.',
    ulTerms: ['Quintessence', 'Aftermath'],
    mechanism: {
      kind: 'function',
      symbols: ['quintessence_shift', 'pendingQuintessenceEvents'],
      module: 'src/engine/encounterAftermath.ts',
    },
    writeSites: ['src/engine/encounterAftermath.ts'],
    readSites: ['src/engine/phaseQuintessence.ts'],
    // THR-1082. The engine has moved quintessence since TB-075 but only ever
    // *itself* — overchannel, encounter failure, doom — so a scene that should
    // have shaken someone had to spend a reputation delta as a stand-in. The
    // applier deliberately does no arithmetic: it queues the same
    // `QuintessenceEvent` shape every other producer queues, so clamping,
    // dissolution and loss-prevention stay in `phaseQuintessence` and an
    // encounter cannot invent a second set of rules for one quantity. Because
    // `StepNudge.grants` reuses this effect union (THR-885), cards inherit it.
  },
  {
    id: 'nudge-hand-runtime-filters-and-sphere-discount',
    producerSystem: QUINTESSENCE,
    consumerSystem: ENCOUNTERS,
    intent:
      'The hand the player is dealt reflects the world as it actually is — group cards only in groups, favor calls only when a favor is owed — and a sphere the god is aligned to makes its own work cheaper.',
    ulTerms: ['Nudge', 'Sphere', 'Essence'],
    mechanism: {
      kind: 'function',
      symbols: ['buildNudgeHand', 'effectiveNudgeCost', 'totalNudgeCost'],
      module: 'src/engine/encounters/nudges.ts',
    },
    writeSites: ['src/types/unifiedAction.ts', 'src/data/nudge-constants.ts'],
    readSites: [
      'src/components/Game/encounter-stage/adapters/buildNudgePhaseModel.ts',
      'src/engine/meetingEncounter.ts',
    ],
    // `effectiveNudgeCost` is shared by the affordability check and the deduction on
    // purpose: quoting a discounted card and charging the authored price (or the
    // reverse) is the one bug a discount feature reliably ships with.
    deferralTicket: 'THR-883',
  },

  // ── Meet The First trait seeds (THR-872) ──────────────────────────────────
  {
    id: 'meeting-trait-seeds-land-as-narrative-descriptors',
    producerSystem: ENCOUNTERS,
    consumerSystem: NARRATIVE,
    intent:
      'The choices you made while meeting your First stay visible in who they are — the descriptors the meeting authored read back on their character sheet and in their backstory, instead of every First being described in the same default words.',
    ulTerms: ['Meet The First', 'Bond Reception'],
    mechanism: {
      kind: 'node-prop',
      symbols: ['narrativeDescriptors'],
      module: 'src/engine/meetingEncounter.ts',
    },
    writeSites: ['src/engine/meetingEncounter.ts'],
    readSites: ['src/engine/agentDetail.ts', 'src/engine/profileGenerator.ts'],
    // This row exists because the contract shipped LEAKED for its whole life and
    // nothing noticed: four producers (legacy dilemmas, enriched dilemmas, spark
    // visions, bond reception) wrote `MeetingEncounterResult.traitSeeds` and
    // `createAgentFromMeeting` never read it, so every descriptor was discarded
    // at the graph boundary. The seeds are free-text description, NOT trait refs
    // — they must never reach `resolveTraitPredicate` or `validateTraitRefs`,
    // which is why `agentDetail` keeps them in a list separate from
    // `getAgentTraitNames`.
    verifiedLive: {
      date: '2026-07-31',
      evidence:
        'src/engine/__tests__/meetingTraitSeedLanding.test.ts enumerates the authored population from all four catalogs (each asserted non-empty individually, so the sweep cannot pass vacuously), lands it through createAgentFromMeeting, and asserts zero unconsumed values. Reader pinned on both sides: getAgentInfoCard(…, "intimate").allTraits contains the humanized descriptor, and generateBackstory fills the {trait} slot from it instead of the hardcoded "resolute" fallback that previously covered every freshly-created First.',
    },
  },

  // ── Hunger resonance shapes the meeting deal (THR-1213) ───────────────────
  {
    id: 'hunger-resonance-weighs-the-meeting-deal',
    producerSystem: PROGRESSION,
    consumerSystem: ENCOUNTERS,
    intent:
      'The Hunger you chose in remembrance decides which formative tests your First is put through — the god you said you were shows up in what the world asks of them, instead of only in how the prose is framed.',
    ulTerms: ['Hunger', 'Meet The First', 'Ascendant Lens'],
    mechanism: {
      kind: 'function',
      symbols: ['buildLensFromIdentity', 'scoreDilemmaResonance', 'selectDilemmasScored'],
      module: 'src/engine/meetingEncounter.ts',
    },
    writeSites: ['src/engine/ascendantLens.ts', 'src/engine/meetingEncounter.ts'],
    readSites: [
      'src/components/MeetTheFirst/MeetTheFirstFlow.tsx',
      'src/components/Game/MeetingEncounterModal.tsx',
    ],
    // This row replaces a contract that was LEAKED for the whole life of the
    // feature and never audited, because it was never written down: the dilemma
    // library's `resonance.hungerResonance` held bare hunger *ids*, the reader
    // compared them against theme *tags*, and the weight fired zero times across
    // all 167 shipped dilemmas for every god (THR-1158). The field, its reader
    // module (`engine/dilemmaSelection.ts`) and the fixtures asserting the dead
    // vocabulary are all deleted with it — a green test on a dead contract is
    // the pathology this map exists to kill. The replacement compares one tag
    // space to itself: `emotionalRegister ∩ hunger.dilemmaResonanceTags`.
    verifiedLive: {
      date: '2026-08-28',
      evidence:
        'src/engine/__tests__/hungerResonanceGate.test.ts runs the shipped 167-dilemma library through the live `selectDilemmas` for all 12 hungers, guarding population-non-empty first so the sweep cannot pass vacuously, and asserts at least one hunger deals differently from the no-lens deal at the same seed — AND fewer than all 12 do, which is what distinguishes resonance from PRNG stream drift (the draw count is lens-independent by construction). Its coverage assertion is **blocking** as of the slice-4 content pass: every hunger must resonate with at least HUNGER_RESONANCE_MIN_COVERAGE=6 dilemmas. Measured after the pass — all 167 dilemmas carry a register, coverage gather=59, witness=58, reclaim=26, reshape=40, preserve=65, kindle=20, sever=8, bind=26, wander=32, consume=18, haunt=37, illuminate=50; 4 of 12 hungers (gather, reclaim, bind, illuminate) deal differently from the no-lens baseline at seed 42. Falsified both ways rather than asserted: drifting one hunger\'s dilemmaResonanceTags out of the dilemma vocabulary turns the gate red naming that hunger (haunt=0), and reverting the library to its pre-pass state turns it red at 11/12 below the floor. Reader pinned at the surface too: src/components/MeetTheFirst/__tests__/hungerShapesTheDeal.test.tsx renders the real TestingBeat on the real deal and asserts two identities differing only in `hungerId` put different authored prose in the DOM.',
    },
  },

  // ── The Repertoire (THR-887) ──────────────────────────────────────────────
  {
    id: 'milestone-grants-unlock-repertoire-cards',
    producerSystem: PROGRESSION,
    consumerSystem: ENCOUNTERS,
    intent:
      'Earning something as a god changes what you can play as a god — a milestone hands you a new way to use a power you already had, not a bigger number on the one you have.',
    ulTerms: ['Nudge', 'Ascendant Beat'],
    mechanism: {
      kind: 'function',
      symbols: ['buildRepertoire', 'isMemberUnlocked', 'memberAccess'],
      module: 'src/engine/nudgeCardRepertoire.ts',
    },
    writeSites: ['src/components/Game/encounter-stage/adapters/buildNudgePhaseModel.ts'],
    readSites: ['src/engine/encounters/nudges.ts'],
    // Milestone card unlocks read `GameState.unlockedActionIds` — the set
    // `unlock_action` already writes and `StepNudge.requiredUnlock` already
    // reads. One grant ledger, deliberately: a second one would be a parallel
    // path to a place that already has an owner.
    //
    // The `god_trait` unlock kind is live and currently resolves to nothing,
    // because god-earned traits do not exist until THR-791 lands. That is the
    // stub, and it is exercised by test rather than left commented out.
  },
  {
    id: 'essence-earned-unlocks-attunement-cards',
    producerSystem: QUINTESSENCE,
    consumerSystem: ENCOUNTERS,
    intent:
      'Working a sphere teaches you its deeper tricks: essence drawn through a sphere over a lifetime widens what that sphere deals you, so a god who actually uses their power ends the run holding more of it than a god who hoarded.',
    ulTerms: ['Nudge', 'Sphere', 'Essence'],
    mechanism: {
      kind: 'state-field',
      symbols: ['essenceEarnedBySphere'],
      module: 'src/engine/essenceEarned.ts',
    },
    // The write is the phase-merge seam, not a grant site: `applyEssenceEarned`
    // is the only place the field is assigned, and `runInlinePhase`
    // (`orchestrator.ts`) plus `runRegisteredPhases` (`phaseRegistry.ts`) are the
    // two funnels that call it. Every essence grant in the economy passes through
    // one of those on its way into state, which is what makes the counter total
    // over a producer set that keeps growing — six sites at time of writing, and
    // the plan named three. The funnels are call sites, not write sites; naming
    // them here would report the field as absent from both, since neither
    // mentions it.
    writeSites: ['src/engine/essenceEarned.ts'],
    readSites: [
      'src/engine/nudgeCardRepertoire.ts',
      'src/components/Game/encounter-stage/adapters/buildNudgePhaseModel.ts',
    ],
    // The production read is `isMemberUnlocked`'s `sphere_attunement` case, which
    // `buildNudgePhaseModel` reaches by threading the counter into
    // `RepertoireContext`. Both halves are named because the adapter is the only
    // live caller — a counter wired to the engine but not to the adapter would be
    // LEAKED in exactly the invisible way this map exists to catch.
    verifiedLive: {
      date: '2026-08-19',
      evidence:
        'Headless CLI, seed 42 medium: with the pool drained to 1/sphere the counter reached chaos 19.250000000000007 by tick 55 and 21.000000000000014 by tick 60 — identical across repeat runs, so same seed ⇒ same unlock tick. src/engine/__tests__/essenceEarned.test.ts drives the reader end-to-end: buildRepertoire with the counter one short of the mark omits every seeded attunement member and with the counter at the mark contains all of them, and the off-sphere arm asserts a god attuned to everything gains no member on a sphere they do not hold. Each arm falsified by breaking its guard (access gate, threshold comparison, monotonicity) and confirming the red.',
    },
  },
  {
    id: 'twilight-harvest-preserves-defining-card',
    producerSystem: NARRATIVE,
    consumerSystem: ENCOUNTERS,
    intent:
      'A god who dies is not wholly gone: the trick they were known for survives the age and turns up in the next god\'s hand, whole after a triumph and scarred after a defeat.',
    ulTerms: ['Nudge', 'Echo', 'World-Soul'],
    mechanism: {
      kind: 'function',
      symbols: ['selectEchoCard', 'buildCardEcho', 'echoCardsFromDefinitions'],
      module: 'src/engine/nudgeCardRepertoire.ts',
    },
    writeSites: ['src/engine/cycleEnd.ts'],
    readSites: ['src/components/Game/encounter-stage/adapters/buildNudgePhaseModel.ts'],
    // The tally the selection reads (`GameState.cardPlayTally`) is written at
    // nudge commit and reset at `transitionToNewCycle` — both sides land
    // together, so this is not an optional field with no writer.
    //
    // The card echo rides `EchoDefinition` rather than a parallel carry
    // structure, so it degrades, fades, and threads the chronicle on the same
    // paths as Legacy, Monument, and Relic.
  },

  // ── Agent-decided branches (THR-894) ──────────────────────────────────────
  {
    id: 'branch-decision-writes-archetype-drift',
    producerSystem: ENCOUNTERS,
    consumerSystem: TRAITS,
    intent:
      'A fork the mortal took becomes part of who they are: taking the cunning branch drifts them cunning, so a mortal the player keeps leaning one way visibly becomes that person instead of resetting each encounter.',
    ulTerms: ['Archetype Drift', 'Nudge'],
    mechanism: {
      kind: 'function',
      symbols: [
        'applyAgentDecidedBranches',
        'decideBranchPole',
        'decideBranchRoute',
        'driftAxisIdForValuePair',
      ],
      module: 'src/engine/encounters/branchDecision.ts',
    },
    writeSites: ['src/engine/unifiedActionResolution.ts'],
    readSites: [
      'src/engine/encounters/driftAccumulator.ts',
      'src/engine/orchestrator/phaseDriftDecay.ts',
      'src/engine/encounterAftermath.ts',
    ],
    // The decision writes through `applyDriftMagnitude` — the same accumulator
    // `phaseChoiceResolution` writes — so decay, threshold crossings, and the
    // `archetype_drift_register` reveal all read it without a second path. The
    // meta pair `courage_prudence` has no canonical `${reach}_axis` id, so it
    // keys the drift store on its own pair name; canonical readers simply do
    // not find it, which is the fail-soft the decision needs to stay decidable.
    //
    // No `verifiedLive`: the engine side is wired and falsified (9-of-23 red
    // with the call removed), but no shipped template authors a `decidedBy`
    // branch yet — THR-883 owns that content. Badging LIVE here would badge a
    // path nothing travels (the THR-614 error class).
    deferralTicket: 'THR-883',
  },

  // ── The Undertow's value drift (THR-1179) ─────────────────────────────────
  {
    id: 'undertow-card-drifts-mortal-values',
    producerSystem: ENCOUNTERS,
    consumerSystem: TRAITS,
    intent:
      'The card that says it changes who the mortal is actually changes it, on the same axis their own choices move — so a god who keeps reaching for the ugly method is visibly making someone, not renting a bonus.',
    ulTerms: ['Archetype Drift', 'Nudge'],
    mechanism: {
      kind: 'function',
      symbols: ['dispatchNudgeCommitments', 'collectNudgeValueDrifts', 'driftTowardPole'],
      module: 'src/engine/encounters/nudgeDispatch.ts',
    },
    writeSites: ['src/engine/encounters/branchDecision.ts'],
    readSites: [
      'src/engine/encounters/driftAccumulator.ts',
      'src/engine/orchestrator/phaseDriftDecay.ts',
    ],
    // `driftTowardPole` was made exported rather than copied, which is the whole
    // point of the row: a card-driven shift and a choice-driven one accumulate into
    // one axis entry and decay toward one baseline. Two writers would have produced
    // a split that no test could see, because each path's own suite would pass while
    // the mortal's position depended on which system moved them.
    //
    // The magnitude is deliberately below `BRANCH_DECISION_DRIFT_MAGNITUDE`: a
    // decision the mortal made should say more about them than a nudge slipped
    // under it.
    //
    // No `verifiedLive`: the engine path is wired and falsified (the dispatch arm
    // reds its liveness tests when the drift loop is stubbed out), but no shipped
    // template authors a `valueDrift` card yet — THR-1130 owns that content.
    // Badging LIVE would badge a path nothing travels (the THR-614 error class).
    deferralTicket: 'THR-1130',
  },

  // ── Strategic Projects & Control → audit-on-touch (THR-1292 slices 2–3) ────
  // This subsystem was ⚪ UNAUDITED. These two rows cover exactly the seams this
  // plan creates; the board-telemetry row the plan also names belongs to slice 5,
  // where its consumer starts existing.
  {
    id: 'shared-step-resolution-two-callers',
    producerSystem: 'Strategic Projects & Control',
    consumerSystem: ENCOUNTERS,
    intent:
      'One band ladder decides every outcome in the game. An encounter step and an undertaking checkpoint that disagreed about what a critical failure is would be two games wearing one vocabulary — the same roll reading as disaster in a scene and a shrug in a project.',
    ulTerms: ['Outcome Band'],
    mechanism: {
      kind: 'function',
      symbols: ['resolveStepCore', 'mapResolverOutcomeToStep'],
      module: 'src/engine/stepResolutionCore.ts',
    },
    writeSites: ['src/engine/stepResolutionCore.ts'],
    readSites: [
      'src/engine/unifiedActionResolution.ts',
      'src/engine/undertakingCheckpoints.ts',
    ],
    // The row deliberately did not exist in slice 2. It was written with one
    // caller, and a row asserting *two* would have been the fiction this map
    // exists to prevent. Slice 3 landed the second caller, so it is true now.
    verifiedLive: {
      date: '2026-08-27',
      evidence:
        'stepResolutionCore.contract.test.ts pins the permitted direct-caller set and asserts the encounter entry point and a direct core call agree on band/roll/probability; the second caller is exercised in the live simulation by undertakingCheckpointLiveness.test.ts (630 rolled checkpoints across all six bands on a 150-tick seed-42 run).',
    },
  },
  {
    id: 'undertaking-checkpoint-events',
    producerSystem: 'Strategic Projects & Control',
    consumerSystem: NARRATIVE,
    intent:
      'What happens to an agent’s undertaking reaches the player — the setback, the doubling-down, the abandonment — instead of progress silently accruing until a thing appears in the world with no story attached to it.',
    mechanism: {
      kind: 'event',
      symbols: ['undertaking_checkpoint', 'undertaking_fork', 'resolveMomentPresentation', 'followedAgentIds'],
      module: 'src/engine/undertakingCheckpoints.ts',
    },
    writeSites: [
      'src/engine/undertakingCheckpoints.ts',
      'src/engine/strategicActionLifecycle.ts',
    ],
    readSites: [
      // Until plan doc 5 builds the arc panel and moment cards, the read side is
      // the TickEvent stream and the trace buffer — stated rather than implied,
      // because a row claiming a surface that does not exist is the leak this
      // registry is for. Doc 5 adds the second consumer.
      'src/engine/traceBuffer.ts',
    ],
    // No `verifiedLive`: the producer is wired and measured, but the *player-facing*
    // consumer is doc 5's. Badging LIVE would badge a path nothing travels.
    // `presentation` currently resolves to 'badge' or 'none' in every CLI run,
    // because a CLI world carries no `thread` edges and so follows nobody — the
    // interrupt arm is covered by unit tests, not by the simulation.
    //
    // THR-1299 slice 1 moved the follow predicate to `src/engine/followedAgents.ts`
    // and made it court-position-aware, so `dormant` and `watched` threads no
    // longer resolve `interrupt`. That narrows *which* moments would reach a
    // player; it does not add a player-facing reader, so the row stays LEAKED and
    // keeps its deferral. The consumer lands with the moment card (slice 3).
    deferralTicket: 'THR-1293',
  },
  {
    id: 'decision-board-shadow-telemetry',
    // Producer is the decision pipeline (phase 2b, ENCOUNTERS); the consumer named
    // here is the subsystem whose go-live this telemetry gates, not the module that
    // physically reads it — the balance rollup and the CLI block are the read sites
    // below, and "Balance telemetry" is not a game subsystem the registry knows.
    producerSystem: ENCOUNTERS,
    consumerSystem: 'Strategic Projects & Control',
    intent:
      'Before one ranking replaces the three winner-take contests an agent’s decision passes through today, what that ranking *would* have chosen is on the record — so the swap is judged against a measured decision mix rather than against confidence.',
    mechanism: {
      kind: 'event',
      symbols: [
        'decision_board_comparison',
        'decision_board_error',
        'shadowWinnerFamily',
        'shadowWinnerId',
        'shadowAgreement',
        'ambitionBoost',
      ],
      module: 'src/engine/decisionBoard.ts',
    },
    writeSites: [
      'src/engine/phaseAgentDecision.ts',
    ],
    readSites: [
      'src/engine/balanceTelemetry.ts',
      'src/engine/balanceSummary.ts',
      'scripts/cli.ts',
    ],
    // Live from day one, unlike its sibling above: the consumer is the balance
    // rollup and the CLI block, both of which exist and both of which were read
    // to produce the gate verdict below. Nothing here waits on a later doc.
    verifiedLive: {
      date: '2026-08-29',
      evidence:
        'THR-1302 re-ran `npm run census:undertakings` (seeds 42 + 99 × 150 ticks, medium) with the ambition-centrality term in place: the cutover gate now PASSES on BOTH seeds — 42 at undertaking 17.4% / encounter 63.8% / idle 18.8%, 99 at 13.7% / 75.2% / 11.1%, both inside [0.10, 0.35]. The mode nonetheless stays `shadow`; flipping it is THR-1301\'s call, not this row\'s. Supersedes the 2026-08-27 evidence (42 at 11.9% PASS, 99 at 4.1% FAIL), which had already gone stale under work that landed between the two runs — the census was green on both seeds BEFORE THR-1302 touched anything, so nothing here should be read as this term having closed that gap. The payload gained `ambitionBoost`: `desireMultiplier` varied throughout the shadow period while one of its two factors was a frozen constant, and no channel carried the factor, so the telemetry could not have shown it. decisionBoardLiveness.test.ts now pins that input directly (65/959 seed-42 and 110/1713 seed-99 undertaking rows score 0, p25 != p50 on both) rather than only the product it disappears into.',
    },
  },
  {
    id: 'mentorship-rides-undertaking-checkpoints',
    producerSystem: 'Strategic Projects & Control',
    consumerSystem: AMBITIONS,
    intent:
      'A mentorship is a relationship that a piece of work drives. Folding it onto the undertaking checkpoint means the bond moves when the teaching actually goes well or badly, instead of a second phase inferring how it went from the leftovers of a first one.',
    // Keyed on the edge, not on the functions: the durable thing crossing the
    // boundary is the `mentors` edge and its `undertakingId` back-reference. A
    // function-keyed row would have named symbols that live in exactly one module,
    // which is a call, not an interface.
    mechanism: {
      kind: 'edge-prop',
      symbols: ['mentors', 'undertakingId'],
      module: 'src/engine/mentorshipUndertaking.ts',
    },
    writeSites: [
      'src/engine/strategicActionLifecycle.ts',
      'src/engine/mentorshipUndertaking.ts',
    ],
    readSites: [
      'src/engine/graphQueries.ts',
    ],
    // The retired producer was phase 2.33 reading phase 2.32's `activeInitiative`
    // record; both are deleted (THR-1292 §3) and the `mentors` edge now carries
    // `undertakingId` rather than `initiativeId`.
    verifiedLive:
      'mentorshipUndertaking.test.ts (30 tests) covers eligibility, bootstrap, band-driven bond drift, milestone seeds, separation, divine sever and both terminal verdicts; a 150-tick seed-42 CLI run produced live `mentors` edges and one completed `strategic_train_apprentice`.',
  },
  {
    id: 'binder-mint-valve',
    producerSystem: 'Ambitions & Undertakings',
    consumerSystem: 'Agent Lifecycle',
    intent:
      'When an undertaking needs a person the world does not have, that person is born the way every other mortal is born — through the lifecycle’s one-per-tick gate — instead of appearing on the spot. An unmetered spawn path is how a large map reached ~1010 agents by tick 72 (THR-814/THR-162), and the budget is what stops the binder becoming a second one.',
    // Keyed on the queue, not on `mintInhabitant`: the durable thing crossing the
    // boundary is `strategicState.mintQueue` and the budget that drains it. The
    // birth function is one module's business; the valve is the interface.
    mechanism: {
      kind: 'state-field',
      symbols: ['mintQueue', 'drainMintQueue', 'BINDER_MINT_BUDGET_PER_TICK', 'binder_mint'],
      module: 'src/engine/binding/mintInhabitant.ts',
    },
    writeSites: [
      'src/engine/binding/mintInhabitant.ts',
    ],
    readSites: [
      'src/engine/agentLifecycle.ts',
    ],
    // Promoted at THR-1321, on a measurement rather than on the bind pass having
    // shipped. The old note here said "nothing *enqueues* yet — the bind pass is
    // slice 4". Slice 4 landed, and the path still travelled nowhere: requests were
    // enqueued onto `strategicState.mintQueue` and the whole object was then
    // discarded by `advanceStrategicProjects`, which rebuilt `strategicState` as a
    // literal naming only `projects`/`controls`/`history`. The valve drained an
    // always-empty queue every tick and reported no births, so the row would have
    // read LIVE off symbol presence while no mortal had ever been born through it —
    // exactly the false-promotion the downgrade-only rule exists to refuse.
    verifiedLive:
      'Controlled arm, CLI seed 42 / medium / 150 ticks, counting `generatedBy === "undertaking_binder"` actors: `origin/main` → 0, post-fix → 42, each carrying `mintedForProjectId` and placed at a named location (e.g. `mint_proj_strategic_recruit_warband_ind_7_28_recruit`, role `mercenary`, at Ardenmor Keep). Two distinct templates feed it (`strategic_recruit_warband`, `strategic_chart_the_wilds`), so the row is not one template deep. The 0 arm is the load-bearing half: it shows the valve had never fired in a live simulation before this, which no symbol grep could have detected.',
  },
  {
    id: 'undertaking-creation-effects',
    producerSystem: 'Ambitions & Undertakings',
    consumerSystem: 'Encounters & Dilemmas',
    intent:
      'A long work now puts things into the world as it runs rather than only at completion: an advancing checkpoint builds what the step earned, an at-cost one builds the cost besides, and a critical failure builds the disaster. A person the work must keep is born through the mint valve; a face that exists for one scene is written by the encounter support bundle’s own walk-on writer, which this contract shares rather than copies. Routing every spawn through the valve would spend the one-per-tick birth budget on faces; copying the node shape instead is how the two writers drift.',
    // Keyed on the shared writer, not on the band table: the durable thing crossing
    // the boundary is that an undertaking and an encounter make a walk-on the same
    // way. The banding is one module's business.
    mechanism: {
      kind: 'function',
      symbols: ['materializeWalkOnActor', 'applyCreationEffects', 'selectCreationBand'],
      module: 'src/engine/encounterSupportBundle.ts',
    },
    writeSites: [
      'src/engine/binding/creationEffects.ts',
      'src/engine/strategicActionLifecycle.ts',
    ],
    readSites: [
      'src/engine/encounterSupportBundle.ts',
      'src/engine/strategicGraphOps.ts',
      'src/engine/binding/mintInhabitant.ts',
    ],
    // UNVERIFIED-OK rather than LIVE: both halves are real and tested — the walk-on
    // writer has two callers today and the encounter half is exercised on every
    // seeded run — but no shipped template declares `creationEffects`, so the
    // undertaking half travels no path the simulation takes. Doc 2 authors the first
    // band table; the emptiness pin in `creationEffects.test.ts` fails when it lands.
    deferralTicket: 'THR-1297',
  },
  {
    id: 'undertaking-remote-anchor',
    producerSystem: 'War, Armies & Battles',
    consumerSystem: 'Ambitions & Undertakings',
    intent:
      'A work done *through* others — a garrison established, supply lines raided — must reach the site through something its owner actually commands, and is not offered at all when nothing is there. Refusing at proposal is the `no_eligible_apprentice` doctrine: an undertaking nobody can foot is not a decision, and starting one only to stall it teaches the player their armies are decorative. The winning anchor joins the cast as `$anchor` must-persist, so severing an army is a named complication for everything it was footing.',
    // Keyed on the command edge, which is the thing actually crossing the boundary:
    // `commanded_by` runs army → commander, a direction three separate files carry
    // warnings about, so the helper is the single reader and every future anchor
    // source (networks, holdings) registers through it rather than beside it.
    mechanism: {
      kind: 'function',
      symbols: ['findRemoteAnchors', 'evaluateRemoteAnchorGate', 'commanded_by', 'no_remote_anchor'],
      module: 'src/engine/binding/remoteAnchor.ts',
    },
    writeSites: [
      'src/engine/armySpawning.ts',
    ],
    readSites: [
      'src/engine/binding/remoteAnchor.ts',
      'src/engine/strategicActionCandidates.ts',
      'src/engine/binding/undertakingBindPass.ts',
    ],
    // UNVERIFIED-OK: the gate is wired into candidate generation and the `$anchor`
    // binding is exercised by test, but no shipped template declares `remote`, so it
    // refuses nothing today. That scoping is deliberate and measured — gating on
    // distance alone (THR-1296 §6 as written) took `trades_with` formation to zero in
    // the 120-tick smoke and seven doom-identity tests with it (impediment #842).
    deferralTicket: 'THR-1297',
  },
  {
    id: 'binder-decision-traced',
    producerSystem: 'Ambitions & Undertakings',
    consumerSystem: 'Attention, Chronicle & Narrative',
    intent:
      'Every casting decision an undertaking makes reaches the narrative surface: the trace answers "why is this moment generic?" after the fact (it fires on a slot that bound nobody as loudly as on one that bound somebody), and a lost must-persist cast member is carried into the checkpoint moment by name — "loses Old Maerin" rather than the anonymous "hits serious trouble" the complication class produced before.',
    mechanism: {
      kind: 'trace',
      symbols: ['binding_decision', 'resolveBinding', 'runBindPass'],
      module: 'src/engine/binding/binder.ts',
    },
    writeSites: [
      'src/engine/binding/binder.ts',
      'src/engine/binding/undertakingBindPass.ts',
    ],
    readSites: [
      'src/types/trace.ts',
      'src/engine/undertakingCheckpoints.ts',
    ],
    // The bind pass (slice 4) is the first caller, so the category is emitted from a
    // path the simulation actually travels. It stays UNVERIFIED-OK rather than LIVE
    // until a template declares cast: the pass early-returns on an empty bundle, and
    // no shipped template carries one — doc 2 (THR-1297) authors the first.
    deferralTicket: 'THR-1297',
  },
  {
    id: 'binding-registry-reaper-hook',
    producerSystem: 'War, Armies & Battles',
    consumerSystem: 'Ambitions & Undertakings',
    intent:
      'A siege that razes an undertaking’s bound stage, or a battle that kills its bound commander, breaks the binding loudly instead of silently — the recon (THR-1289) measured battle destruction as the one confirmed live must-persist violation, since the destruction pool never reads persistence in either flavour and the commander kill bypasses the lifecycle and emits nothing at all. Detection sits on the sole node-removal funnel all ~25 deleting call sites pass through, so the same seam covers every other reaper and any reaper not yet written; housekeeping (sublocation dissolution) instead defers on a bound stage, because a chore waits and a story does not.',
    mechanism: {
      kind: 'function',
      symbols: [
        'onNodeRemoved',
        'installBindingRemovalHook',
        'makeDissolutionHold',
        'binding_severed',
      ],
      module: 'src/engine/binding/bindingRegistry.ts',
    },
    writeSites: [
      'src/engine/graph.ts',
      'src/engine/orchestrator.ts',
      'src/engine/phaseSublocations.ts',
    ],
    readSites: [
      'src/engine/binding/bindingRegistry.ts',
      'src/engine/binding/undertakingBindPass.ts',
    ],
    // Registered per tick by the orchestrator (slice 4) and consulted by both
    // dissolution call sites. Same reason as the row above for not badging LIVE:
    // the ledger is empty until a template declares cast.
    deferralTicket: 'THR-1297',
  },
  {
    id: 'encounter-scored-binder-optin',
    producerSystem: 'Encounters & Dilemmas',
    consumerSystem: 'Ambitions & Undertakings',
    intent:
      'An encounter template can opt its cast onto the same scored board undertakings use, one template at a time. Two things follow for a migrated template: casting stops being "the first body at this place whose job title matches" and starts weighing story ties, identity fit, distance and role scarcity; and its authored `must-persist` declarations finally reach the binding ledger, so housekeeping defers on that person and a reaper’s kill is traced as a severance instead of vanishing. The recon (THR-1289) measured `persistence` as written 60+ times across the corpus and read by zero consumers — this is the seam that starts retiring that, without a big-bang migration the un-migrated corpus would have to survive.',
    mechanism: {
      kind: 'function',
      symbols: [
        'useScoredBinder',
        'EncounterBinderContext',
        'prepareEncounterSupportBundle',
        'resolveBinding',
      ],
      module: 'src/engine/encounterSupportBundle.ts',
    },
    writeSites: [
      'src/engine/encounterSupportBundle.ts',
      'src/engine/phaseAgentDecision.ts',
      'src/engine/binding/encounterBinderContext.ts',
      'src/engine/debugEncounterTools.ts',
      'src/components/Game/GameView.tsx',
      'scripts/cli.ts',
      'src/data/encounters/one-body-short.ts',
    ],
    readSites: [
      'src/engine/binding/binder.ts',
      'src/engine/binding/bindingRegistry.ts',
      'src/engine/binding/applyBinding.ts',
    ],
    verifiedLive: {
      date: '2026-08-27',
      evidence:
        "THR-1305. Slice 6 left this row UNVERIFIED-OK on measurement rather than caution — 120 ticks at seed 42/medium produced 91 encounter actions across 52 templates and zero firings of the exemplar, so no live run had travelled the route. It is now travelled, and the thing that made the proof cheap is the fix itself: the review levers were wired to the same board. `?spawn=`, `?forceencounters` and the CLI `spawn encounter` supplied no `EncounterBinderContext`, so a migrated template was cast by the legacy first-role-match resolver and wrote no ledger row — content review of a migrated encounter reviewed a different casting than players get. Live proof, CLI seed 42/medium: `tick 30` then `spawn encounter @hero encounter.border.one_body_short` leaves `state.strategicState.bindings` holding `{projectId:'enc_encounter.border.one_body_short_asc.archetype.chaos_0', castKey:'survivor', persistence:'must-persist', boundRole:'mercenary', boundAtTick:30, status:'live'}`. Control arm in the same harness: the un-migrated `cg.quest.gate_duty` writes zero `enc_*` rows, so the opt-in gate still holds live and the row is not evidence that every template now ledgers. The assembly rule (a context is built only when BOTH a runtime and `strategicState` exist, else the legacy path) moved into `binding/encounterBinderContext.ts` so the four call sites share one copy; `getBindings` tolerates an absent strategic state by returning `[]`, so an assembler skipping that check would write rows to an unowned array and report a successful bind. Non-vacuous by `src/engine/binding/__tests__/debugToolsBinderWiring.test.ts` (7 tests, both entry points, both fallback arms) — falsified in two controlled arms: with the binder not threaded, 2-of-7 red; with the caller's agent *query* stamped as `actorId` instead of the resolved node id, 1-of-7 red because `binder.ts`'s self-exclusion (`node.id === request.actorId`) stops matching and the agent is cast as their own fellow survivor. The 8 golden opt-in tests are unchanged and green, so the un-migrated corpus is untouched.",
    },
  },
  {
    id: 'destroy-candidates-gated-on-motive',
    producerSystem: FACTIONS,
    consumerSystem: AMBITIONS,
    intent:
      'A mortal may only destroy what they have a reason to destroy — candidate generation reads the world\'s standing quarrels before offering a destroy verb.',
    ulTerms: ['Undertaking', 'Faction'],
    // The carrier is `motiveGate` on the template plus `evaluateMotiveGate`, which is
    // the single reader. `resolveTargetOwners` is named deliberately: it is the seam
    // THR-1297 slice 3's `owns` edge extends, and a caller that walks ownership edges
    // itself instead of asking through here is exactly the drift this row exists to
    // catch — two answers to "who holds this" is how the `controls` inventory got the
    // way it is.
    mechanism: {
      kind: 'function',
      symbols: ['motiveGate', 'evaluateMotiveGate', 'resolveTargetOwners', 'MOTIVE_GATE_KINDS'],
      module: 'src/engine/undertakingMotive.ts',
    },
    writeSites: [
      'src/data/strategic-packs/warlordStrategicPack.ts',
    ],
    readSites: [
      'src/engine/undertakingMotive.ts',
      'src/engine/strategicActionCandidates.ts',
      'src/data/undertaking-kinds.ts',
    ],
    verifiedLive: {
      date: '2026-08-27',
      evidence:
        'THR-1297 slice 2. The corpus held exactly one `verb: \'destroy\'` template in 43 — `strategic_raid_supply_lines` — and it was offerable against any town/city/camp/fort in range with no quarrel behind it, while its own completion prose said "the enemy will feel the lack" about people who were not the actor\'s enemy. It now declares `motiveGate: [\'rivalry\',\'grudge\',\'faction_war\']` and generation refuses it unless the actor holds one of those toward a holder of the target. Every motive reads a relation the world already wrote, so nothing new is recorded: `hostile_to` (bare ⇒ rivalry, injury-stamped ⇒ grudge, read across all three provenance keys the three writers each chose independently — `cause`/`reason`/`basis`), a shared `active` `pursues` ambition node, and `relates_to.isRival` via the existing `areFactionsHostile`. Two refusal reasons kept distinct because they want different fixes: `no_motive` (held, no quarrel) and `no_motive_unowned` (nobody holds it). Both reach a trace through the candidate-board trace\'s new capped `refusals` field — before this the board reported a bare rejection *count*, so every generation gate including `no_eligible_apprentice` was invisible from a run dump. Non-vacuous by `src/engine/__tests__/undertakingMotiveGate.test.ts` (21 tests): each refusal is paired with the same fixture offering the same candidate once the motive exists, so a gate that simply always refused would fail; falsified 8-of-21 red with `evaluateMotiveGate` stubbed to allow. Live measurement, seed 42/medium at tick 60: all 21 raidable settlements carry a controlling faction (so the `unowned` arm is not the common case), against 30 `hostile_to` edges and 12 declared faction rivalries across 49 factions — the verb stays reachable and grows more so as grudges accumulate. Full suite 18569 green; 30-tick seed-42 smoke reached tick 30, 377 agents, 49 events.',
    },
  },
  {
    id: 'holdings-single-writer-owns-edge',
    producerSystem: AMBITIONS,
    consumerSystem: ATTACHMENTS,
    intent:
      'What a mortal owns is written in exactly one place. The `owns` edge is the authority; the bearer-side attachment is its face, and both are minted, moved and retired by `holdings.ts` alone.',
    ulTerms: ['Attachment', 'Undertaking'],
    // The contract this row guards is a NEGATIVE as much as a positive: no module
    // other than holdings.ts may write an `owns` edge or a `holding`-category
    // attachment node. A second writer is how `controls` reached 132 occurrences
    // across 72 files in five property shapes with exactly one site able to tell
    // them apart — the inventory that made this edge necessary.
    mechanism: {
      kind: 'edge-prop',
      symbols: ['owns'],
      module: 'src/engine/holdings.ts',
    },
    writeSites: [
      'src/engine/holdings.ts',
      'src/engine/graphOpExecutor.ts',
      'src/engine/encounterAftermath.ts',
    ],
    readSites: [
      'src/engine/graphQueries.ts',
      'src/engine/graphConditions.ts',
      'src/engine/resolutionModifiers.ts',
      'src/engine/effects/effectPredicates.ts',
      'src/engine/strategicGraphOps.ts',
      'src/engine/notableAgendas.ts',
      'src/engine/orchestrator.ts',
    ],
    verifiedLive: {
      date: '2026-08-27',
      evidence:
        'THR-1297 slice 3. `owns` ships as a NEW edge beside `controls` rather than a reuse, on the inventory\'s measured ground: exactly one of ~30 production `controls` read sites discriminates by any property (`releaseControl`\'s `controlType === \'strategic\'` filter), `influence` is write-only, and reuse would have broken seven faction-territory consumers outright plus five `[0]?.source` sites that would have become nondeterministic (NFP #3) — including `battleAftermath`\'s power vacuum, which would have deleted an agent\'s holdings on a razing. Both un-flagged agent writers migrated: `encounterAftermath`\'s `spawn_unique_location` (`via: \'creation\'`) and the two authored `add_edge` templates `action.iron.conquer` / `action.shadow.establish-network`, the latter routed through `grantHolding` from inside `executeAddEdge` so content-authored ownership obeys the single writer too — a raw `addEdge` there would have produced an `owns` edge violating its own `requiredProperties` and carrying no bearer-side face at all. Seize is one atomic call built on a new `WorldGraph.retargetEdgeSource`, because `updateEdge` rewrites the edge record without touching the `outgoing`/`incoming` adjacency maps and would have silently orphaned the edge (~30 existing `updateEdge` callers all pass `properties` only, so nothing depended on that). Non-vacuous by `src/engine/__tests__/holdings.test.ts` (18 tests) and `holdingsIntegration.test.ts` (9): the atomicity test wraps every graph mutator and asserts the place is never ownerless and never faceless at ANY observed instant, not just at the endpoints — falsified 2-of-18 red by replacing the atomic body with a release-then-grant, which is exactly the implementation the plan\'s kill criterion forbids and which the first draft of this module actually had. Home-ground scoring on your own holding ships as the handoff specified (Christian\'s veto invited, not exercised), paired with its negative: a non-owner in the same place gets no bonus, and an owner\'s title now overrides a hostile faction verdict on the same hex — the gap where an owner read as an enemy on their own land. Full suite 18601 green; 30-tick seed-42 smoke reached tick 30.',
    },
  },
  {
    id: 'one-namer-shared-primitives',
    producerSystem: AMBITIONS,
    consumerSystem: NARRATIVE,
    intent:
      'There is one rule for how an id becomes a seed and one rule for English possessives. `naming/workNames.ts` owns both; every other namer imports them rather than minting its own.',
    ulTerms: ['Undertaking'],
    // The contract is a NEGATIVE first: no module may define a second `hashSeed`,
    // `pick` or `possessive`. The positive half — that a completed undertaking is
    // christened through `generateWorkName` and that the name then outlives its
    // owner — is what the shared primitives exist to serve.
    mechanism: {
      kind: 'module-export',
      symbols: ['possessive', 'hashSeed', 'pickFrom', 'generateWorkName'],
      module: 'src/engine/naming/workNames.ts',
    },
    writeSites: [
      'src/engine/naming/workNames.ts',
      'src/engine/strategicActionLifecycle.ts',
      'src/engine/binding/creationEffects.ts',
      'src/engine/holdings.ts',
    ],
    readSites: [
      'src/engine/groups/groupNames.ts',
      'src/engine/strategicActionLifecycle.ts',
      'src/engine/binding/creationEffects.ts',
    ],
    verifiedLive: {
      date: '2026-08-27',
      evidence:
        'THR-1297 slice 4. `groupNames.ts` becomes the first caller: its local `hashSeed` / `pick` / `possessive` are deleted and imported from the shared module. The group *grammar* is deliberately NOT folded in — folding companies onto the work patterns would have re-rolled every company name in every existing world, a player-facing rename with no ticket behind it, so this row guards shared primitives and two grammars rather than one namer with two callers. Pinned by `groups/__tests__/groupNameStability.test.ts`, a DIFFERENTIAL against a byte-copy of origin/main\'s implementation (a captured-literal golden would agree with itself the moment anyone regenerated it) across 17 contexts chosen to hit every pattern fork; falsified twice — stubbing `possessive` to always add `\'s` went 2-of-20 red, and offsetting `pickFrom` by one went 12-of-20 red. The possessive rule reaches the strategic packs for the first time: `renderNameTemplate` matches `{actor}\'s` as a unit so all seven shipped possessive templates render "Silas\' Workshop" instead of "Silas\'s Workshop", and the two legacy hand-rolled name strings in `executeInstantMutation` now share it (falsified 9-of-22 red by restoring raw substitution). Christening is live: 93 firings in a 150-tick seed-42 run, producing "The Deepset Granary of Thornhaven", "Miriel\'s Surveyed Research Circle", "Elior\'s Auspice Shrine". Two defects the live run caught and unit tests could not: a concatenating `{root}{noun}` pattern produced "The StandingHouse" (removed; a legibility guard over a 200-name sample now falsifies at 55 offenders), and christening initially replaced a specific noun with a generic family one ("Rill\'s Research Circle at Ardenmor Keep" became "The Ardenmor Keep House") because `createSublocation` stamps `sublocationTypeId`, not `locationSubtype`. Names outlive owners: `transferHolding` never renames, `razeHolding` retires the name into the site\'s `nameEchoes`, and `refreshHoldingFaceNames` closes the stale-face gap slice 3\'s checkpoint predicted. The christened name rides the existing completion trace rather than an emission of its own — a separate trace measurably evicted `decision_board_comparison` entries from the per-tick ring buffer and reddened `decisionBoardLiveness`\'s frozen-desire pin on a diff that authored no `motivations`. Full suite 18683 green ×2; ratchet 2973 unchanged; 30-tick seed-42 smoke reached tick 30, 377 agents.',
    },
  },
  {
    id: 't1-undertaking-objects-feed-existing-economies',
    producerSystem: AMBITIONS,
    consumerSystem: ATTACHMENTS,
    intent:
      "A tier-1 undertaking's product is written into an economy that already has consumers — never into a private score only the producing system reads.",
    ulTerms: ['Undertaking'],
    // The contract is about *destination*, not about the ops existing. Each of the six
    // T1 mutation ops writes a shape some other system already consumes: clues the ruins
    // layer converges to familiarity, treasure maps `treasureMapConsumption` spends,
    // `knows_secret_of` holds that Secrets & Favors presses into `owes_favor` debts, and
    // artifacts the attachment layer carries. A find only the finder can read is a
    // counter, not a kind — which is the whole distinction this row guards.
    // The symbols are the graph shapes, not the op functions — deliberately, and the
    // generator caught the first draft for naming the functions. Consumers never import
    // these ops; they read the edges and possessions the ops write. Declaring the
    // functions made the row classify LEAKED with "declared read sites empty", which was
    // an accurate description of a contract stated in the wrong currency: the interface
    // here *is* the shape, so the shape is what must appear at both ends.
    mechanism: {
      kind: 'edge-prop',
      symbols: [
        'knows_clue_of',
        'knows_secret_of',
        'owes_favor',
        'consumeOnEvent',
        'possesses',
      ],
      module: 'src/engine/strategicGraphOps.ts',
    },
    writeSites: [
      'src/engine/strategicGraphOps.ts',
      'src/engine/strategicActionLifecycle.ts',
    ],
    readSites: [
      'src/engine/treasureMapConsumption.ts',
      'src/engine/socialLeverage.ts',
      'src/engine/ruins/clueLifecycle.ts',
      'src/engine/agentAttachments.ts',
    ],
    verifiedLive: {
      date: '2026-08-27',
      evidence:
        "THR-1297 slice 5. Six ops carry the five T1 kinds' objects, and each writes a shape an existing system consumes rather than a property only the producer reads. `mintLeverageMark` is a dedicated op rather than a `create_relation_edge` call precisely because that primitive stamps only `establishedTick` while `knows_secret_of` declares five required properties — a mark routed through the generic maker would warn on the schema every time and arrive without the fields the economy presses. Proven live on seed 99 at 150 ticks, the whole arc organically: cultivate 8 completed → 5 marks minted → press 7 completed → 6 `owes_favor` debts → burn 7; plus 4 treasure maps and 2 clues from the chart arc and 18 cache exposures. Non-vacuous by `src/engine/__tests__/undertakingT1Kinds.test.ts` (21 tests), which asserts every property each edge's schema row declares required rather than merely that an edge appeared — falsified 2-of-19 red by dropping `revealed` from the mark and by stubbing `pressTheMark`'s no-mark guard, and 1-of-21 by restoring a non-canonical `subcategory`. **Two findings recorded on the row because they are the reason it is worded around destinations.** Both artifact writers first shipped `subcategory: 'tool'` with a string `tier`; neither value exists (`PossessionSubcategory` has seven members, `AttachmentTier` is numeric 1–4), nothing threw, and `getAttachmentArtUrl` simply returned `null` forever — the items would have rendered as blank plates on every possession surface, and the seeded-world coverage test caught it only because that world happened to mint a chart and no masterwork. And `press_the_mark` completed 3 times against 3 strangers minting 0 debts, because its target rule selected on role while its resolution required a held mark: selection and resolution disagreeing silently, fixed by a `withEdgeFromActor` filter on the target rule. Full suite 18713 green; ratchet 2973 unchanged; build 10.44s; 30-tick seed-42 smoke reached tick 30, 377 agents.",
    },
  },
];

/** A malformed row — surfaced in the generated output rather than thrown (NFP #4). */
export interface RegistryError {
  contractId: string;
  problem: string;
}

/**
 * Structural validation. Contract *liveness* is the generator's job; this only
 * catches rows that could never classify meaningfully — unknown subsystem names,
 * duplicate ids, empty symbol lists, malformed ticket references.
 */
export function validateRegistry(contracts: readonly Contract[] = CONTRACTS): RegistryError[] {
  const errors: RegistryError[] = [];
  const seen = new Set<string>();
  const TICKET_RE = /^THR-\d+$/;

  for (const c of contracts) {
    if (seen.has(c.id)) errors.push({ contractId: c.id, problem: 'duplicate contract id' });
    seen.add(c.id);

    for (const [field, value] of [
      ['producerSystem', c.producerSystem],
      ['consumerSystem', c.consumerSystem],
    ] as const) {
      if (!SUBSYSTEM_NAMES.has(value)) {
        errors.push({
          contractId: c.id,
          problem: `${field} "${value}" is not in the shared subsystem registry (scripts/subsystems-registry.ts)`,
        });
      }
    }

    if (c.mechanism.symbols.length === 0) {
      errors.push({ contractId: c.id, problem: 'mechanism.symbols is empty — nothing to grep' });
    }
    if (c.deferralTicket && !TICKET_RE.test(c.deferralTicket)) {
      errors.push({ contractId: c.id, problem: `deferralTicket "${c.deferralTicket}" is not a THR-<n> reference` });
    }
    if (c.badgeOverride && !TICKET_RE.test(c.badgeOverride.deferralTicket)) {
      errors.push({
        contractId: c.id,
        problem: `badgeOverride.deferralTicket "${c.badgeOverride.deferralTicket}" is not a THR-<n> reference`,
      });
    }
  }
  return errors;
}
