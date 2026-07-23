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

export const CONTRACTS: readonly Contract[] = [
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
    mechanism: { kind: 'node-prop', symbols: ['domainContributions'] },
    writeSites: ['src/data/reward-attachment-catalog.ts', 'src/data/starter-attachments.ts'],
    readSites: ['src/engine/domainCapability.ts'],
    badgeOverride: {
      badge: 'LEAKED',
      reason:
        'Symbol greps green (26 production files) but every possession-item catalog writes `domainContributions: {}` — the deadness is value-level, invisible to symbol matching. Trait-type bestowals (Patron\'s Backing, Ruin Seeker) DO carry contributions via the has_trait walk; possession items specifically are the gap. `anomaly-reward-catalog.ts` was deliberately migrated onto effects[] on 2026-04-06, so the empties read as a half-finished migration, not accidental loss.',
      deferralTicket: 'THR-718',
    },
    deferralTicket: 'THR-718',
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
        'The module has exactly one production importer (visibility.ts, `getModifiedValue`) and it only ever asks for `los_range`. Capability attributes are written but never queried — argument-level deadness a symbol check cannot see.',
      deferralTicket: 'THR-723',
    },
    deferralTicket: 'THR-723',
  },
  {
    id: 'attachment-edge-grants',
    producerSystem: ATTACHMENTS,
    consumerSystem: ENCOUNTERS,
    intent: 'Items grant abilities to their bearer (e.g. cavalry_charge).',
    mechanism: { kind: 'edge-prop', symbols: ['grants'] },
    writeSites: ['src/engine/seedAttachments.ts', 'src/engine/gameInit.ts', 'src/engine/rewardPool.ts'],
    readSites: [],
    deferralTicket: 'THR-722',
  },
  {
    id: 'attachment-on-use-triggers',
    producerSystem: ATTACHMENTS,
    consumerSystem: ENCOUNTERS,
    intent: 'Items break, deplete, or curse their bearer on use — authored consequence for carrying power.',
    mechanism: { kind: 'node-prop', symbols: ['onUseTriggers', 'resolveOnUseTriggers'], module: 'src/engine/attachmentTriggers.ts' },
    writeSites: ['src/data/starter-attachments.ts', 'src/data/anomaly-reward-catalog.ts', 'src/types/attachments.ts'],
    readSites: [],
    deferralTicket: 'THR-719',
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
    readSites: ['src/engine/orchestrator.ts'],
    // Correction to the hand audit (THR-717 implementation, 2026-07-23): the canon
    // page badged this 🟠 PARTIAL on the assumption that advancement runs and merely
    // feeds the dead `modifiers` stat path. Tier 1 shows worse — the module's only
    // importer is its own test, so advancement never runs at all. Left to the
    // mechanical verdict rather than pinned, because the mechanical read is the
    // accurate one.
    deferralTicket: 'THR-723',
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
    badgeOverride: {
      badge: 'PARTIAL',
      reason:
        'Both gate paths exist (JourneyTab.tsx gates on interactionDepth ≥ 2 OR knowledge ≥ `known`), but the thresholds and accrual rates keep ambitions hidden for nearly every agent in normal play — the player experiences this as "ambitions disappeared from the UI".',
      deferralTicket: 'THR-721',
    },
    deferralTicket: 'THR-721',
  },
  {
    id: 'ambition-completed-history',
    producerSystem: AMBITIONS,
    consumerSystem: 'Attention, Chronicle & Narrative',
    intent: 'Completed ambitions accumulate into a readable history of who an agent became.',
    mechanism: { kind: 'function', symbols: ['completedAmbitions'] },
    writeSites: ['src/engine/journeyEngine.ts'],
    readSites: ['src/components/Game/tabs/ChronicleTab.tsx'],
    deferralTicket: 'THR-721',
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
    mechanism: { kind: 'function', symbols: ['economicContextBonus'] },
    writeSites: ['src/engine/phaseProsperity.ts'],
    readSites: ['src/engine/encounterScoring.ts'],
    deferralTicket: 'THR-725',
  },
  {
    id: 'economy-verbs-answered',
    producerSystem: 'Mortal Economy & Prosperity',
    consumerSystem: 'Encounters & Dilemmas',
    intent:
      'The four granted economic verbs (bless_harvest, blight, open_markets, reveal_vein) get a visible story response — player-loop link 4.',
    mechanism: { kind: 'function', symbols: ['loc.blight', 'loc.bless_harvest'] },
    writeSites: ['src/data/unified-action-templates.ts', 'src/engine/graphOpExecutor.ts'],
    readSites: ['src/engine/encounterScoring.ts'],
    badgeOverride: {
      badge: 'LEAKED',
      reason:
        'The verbs are granted, playable, and verifiably move prosperity/stocks — but encounterScoring.ts contains zero prosperity/economic terms, so the world never answers in scenes. The player’s cards work and the story stays silent.',
      deferralTicket: 'THR-725',
    },
    deferralTicket: 'THR-725',
  },
  {
    id: 'world-events-mint-ambitions',
    producerSystem: 'Encounters & Dilemmas',
    consumerSystem: AMBITIONS,
    intent: 'World events write themselves into mortal desire — a sacked town mints avengers and refugees.',
    ulTerms: ['AxiologicalProfile'],
    mechanism: { kind: 'function', symbols: ['AMBITION_MINTING_RULES', 'mintAmbitionsFromEvents'] },
    writeSites: ['src/engine/ambitionTick.ts'],
    readSites: ['src/engine/ambitionSelection.ts'],
    deferralTicket: 'THR-726',
  },
  {
    id: 'minted-ambition-provenance',
    producerSystem: AMBITIONS,
    consumerSystem: 'Omens & Atmospheric Pressure',
    intent: 'Motive receipts name the origin of a minted want — "she seeks vengeance for the blighted fields."',
    mechanism: { kind: 'edge-prop', symbols: ['mintedByEventId'] },
    writeSites: ['src/engine/ambitionTick.ts'],
    readSites: ['src/engine/foreshadowing/motiveReceipt.ts'],
    deferralTicket: 'THR-726',
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
