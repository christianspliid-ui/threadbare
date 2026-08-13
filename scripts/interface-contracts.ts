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

/** Badges a row can carry. LIVE is never assigned mechanically — see the header. */
export type ContractBadge = 'LIVE' | 'PARTIAL' | 'LEAKED' | 'UNWIRED' | 'UNVERIFIED-OK';

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
  badgeOverride?: { badge: 'LEAKED' | 'PARTIAL'; reason: string; deferralTicket: string };
  /** Remediation ticket for a known-LEAKED row. Required, or the build fails. */
  deferralTicket?: string;
}

const AUDIT_EVIDENCE =
  'Docs/plans/2026-07-23-system-interface-map.md § Audit findings (manual audit + independent cold-context review, both grep-verified)';

/** Subsystem name constants, so a typo is a compile error rather than a silent unmatched row. */
const ATTACHMENTS = 'Attachments, Items & Possessions';
const AMBITIONS = 'Ambitions & Initiatives';
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
    intent: 'Encounters grant rewards, which become possessions.',
    mechanism: { kind: 'function', symbols: ['assembleRewardPool'], module: 'src/engine/rewardPool.ts' },
    writeSites: ['src/engine/rewardPool.ts', 'src/types/attachments.ts'],
    readSites: ['src/engine/orchestrator.ts', 'src/engine/unifiedActionResolution.ts'],
    verifiedLive: { date: '2026-07-23', evidence: `possesses edges grow 7→82 over 120 ticks (seed 42, medium). ${AUDIT_EVIDENCE}` },
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
    //   2. `threatened` — the flag `routeEvents.ts` sets when banditry materializes
    //      on a `trades_with` edge; it multiplies throughput rather than zeroing it,
    //      so bandits STRANGLE a line instead of cutting it.
    // Declaring the consumer's own function names here would pin the row LEAKED
    // forever, for the reason `economy-sustains-essence-sources` records above: the
    // producing phases have no reason to name a war-system reader.
    mechanism: { kind: 'node-prop', symbols: ['resourceBalance', 'threatened'] },
    writeSites: ['src/engine/phases/resourceStockTiers.ts', 'src/engine/phases/routeEvents.ts'],
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
      'The authored per-tier advancement ramp reaches the player. `TIER_ADVANCEMENT_ESSENCE_COST` / `TIER_ADVANCEMENT_DIFFICULTY` author a 3-row ladder, but only row 1 had a consumer — a static template step cannot read its target\'s tier — so advancing a Mundane artifact and a Mythic one both cost 4 essence at difficulty 0.20.',
    ulTerms: ['UnifiedActionTemplate', 'Attachment Tier'],
    mechanism: { kind: 'function', symbols: ['tierScaledEssenceCost', 'tierScaledDifficulty', 'essenceCostContext'], module: 'src/engine/targetTierScaling.ts' },
    writeSites: ['src/data/attachment-tier-content.ts', 'src/data/unified-action-templates.ts'],
    readSites: [
      'src/engine/targetActions.ts',
      'src/engine/playerCastDispatch.ts',
      'src/engine/unifiedActionResolution.ts',
    ],
    verifiedLive: {
      date: '2026-08-13',
      evidence:
        'THR-1073: `attachment-tier-content.ts` authors the ramp and `unified-action-templates.ts` opts `artifact.enchant`/`artifact.empower` in via `essenceCostContext` + `difficultyContext: \'target_tier_scaled\'`. Three read sites resolve it — `targetActions.ts` (card price, affordability gate, displayed risk), `playerCastDispatch.ts` (essence actually charged, with the buff discount applied to the resolved price), `unifiedActionResolution.ts` (the difficulty rolled against). Falsified by removing the marker from `artifact.enchant`: exactly three assertions go red including `expected 4 to be greater than 4`, while `artifact.empower` stays green. `targetTierScaling.test.ts`, 15 assertions.',
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
      'A companion of a company is not a member of a faction by that name — faction rank, allegiance display and heraldry must keep reading the faction.',
    ulTerms: ['Company', 'Faction'],
    mechanism: { kind: 'edge-prop', symbols: ['getFactionMembershipEdges'] },
    // The guard itself is the producer: groupFormation mints the colliding
    // `member_of` edge, but what every faction reader consumes is this filter.
    writeSites: ['src/engine/graphQueries.ts'],
    readSites: [
      'src/engine/graphQueries.ts',
      'src/engine/anointSuccessor.ts',
      'src/engine/contextBuilder.ts',
      'src/engine/notableAgendas.ts',
      'src/engine/detailPageResolvers.ts',
    ],
    verifiedLive: {
      date: '2026-07-24',
      evidence:
        'member_of consumer sweep (THR-74): 14 sites reading an agent\'s outgoing member_of as "their faction" now route through getFactionMembershipEdges; the remainder gate on factionDefId/reachPreferences/guildType and fail soft on a company target. Locked by src/engine/groups/__tests__/groupQueries.test.ts § "faction lookups are not confused by company membership".',
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
    writeSites: ['src/engine/groups/bandOpposition.ts'],
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
    // Not LIVE: no shipped card authors `grants`, so nothing travels this path yet
    // (badging it LIVE would be the THR-614 error class). The grant-liveness gate
    // (`validateNudgeGrantRefs`) is what stops the first authored card from naming
    // content nobody built.
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
