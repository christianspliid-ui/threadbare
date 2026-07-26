/**
 * God-Tier Artifact Templates — legendary items composed from effect primitives.
 *
 * These 3 artifacts are the worked examples from the design doc.
 * Each demonstrates world-reshaping effects with cascading consequences.
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */
/**
 * THR-800 — phantom grant keys (1 in this file).
 *
 * The `trait_grant` effects below name bare snake_case keys with no trait definition
 * behind them. This is deliberate and it *works*: `collectGrantedTraits` returns the
 * bare key, every consumer unions it into the bearer's ref set, and a gate naming the
 * same key passes (the THR-737 loop). What a phantom lacks is a definition — so it has
 * no display name, no visibility, and no `domainContributions`, and it cannot appear on
 * the bearer's sheet. That collides with the trait canon's "always visible once known"
 * rule, which is why `validateTraitRefs` reports them separately from dead refs rather
 * than treating them as satisfied.
 *
 * Kept as-is here: each backs a live gate today, and giving them definitions is only
 * half the job — see THR-808 for why minting without a producer is worse than the
 * current state. The count is pinned by `traitRefReconciliation.test.ts`, so a new
 * bare-key grant is a deliberate act rather than a drift.
 */

import type { AttachmentEffect, ActivatedAbility } from '../types/effects';
import type { AttachmentTier, LossCondition } from '../types/attachments';
import type { ContentCensusTag } from '../types/contentCensus';

export interface ArtifactTemplate {
  readonly id: string;
  readonly name: string;
  readonly tier: AttachmentTier;
  readonly tags: string[];
  readonly lossCondition: LossCondition;
  /** Passive effects (always active while held) */
  readonly effects: AttachmentEffect[];
  /** Activatable abilities with costs and cooldowns */
  readonly activatedEffects: ActivatedAbility[];
  /** Content Census coverage classification (THR-474 schema / THR-477 values). Metadata only. */
  censusTag?: ContentCensusTag;
}

export const ARTIFACT_TEMPLATES: ArtifactTemplate[] = [
  // ─── The Worldforge Anvil ───────────────────────────────────────
  {
    id: 'worldforge_anvil',
    name: 'The Worldforge Anvil',
    tier: 4,
    censusTag: { scale: 'cosmic' },
    tags: ['legendary', 'creation', 'cursed'],
    lossCondition: 'cursed',
    effects: [
      { type: 'trait_grant', grantedTrait: 'master_smith' },
      { type: 'permanent', reach: 'shadow', value: -0.04 },
      // THR-718: the anvil makes its bearer a legendary smith — forging (Iron) and
      // earthcraft (Stone) capability. Legendary band; near-max Iron because
      // master-smithing is its whole identity, Stone a step lower.
      { type: 'stat_contribution', contributions: { iron: 1.5, stone: 1.0 } },
    ],
    activatedEffects: [
      {
        name: 'Found Legendary Forge',
        cooldownTicks: 100,
        cost: { type: 'multi', costs: [
          { type: 'attachment_consume', tag: 'legendary_material' },
          { type: 'doom_increase', amount: 10 },
          { type: 'tick_exhaust', ticks: 20 },
        ]},
        effects: [
          {
            type: 'cascade',
            triggerEffect: {
              type: 'create_structure', what: 'sublocation', subtype: 'legendary_forge',
              onHex: 'self', permanent: true,
            },
            then: [
              { type: 'modify_rules', scope: { scope: 'hex', target: 'self' },
                rule: 'tier_advancement_cost_multiplier', value: 0.5, ticks: 'permanent' },
              { type: 'alter_terrain', target: 'self_hex',
                terrainEffect: 'volcanic', ticks: 'permanent' },
            ],
          },
        ],
        backlash: {
          trigger: 'critical_failure', probability: 1.0, severity: 'catastrophic',
          effect: { type: 'destroy_structure', what: 'all_sublocations',
                    target: 'on_hex', permanent: true, leavesBehind: 'crater' },
          narrativeTemplate: 'The forge detonates — the earth swallows everything built here.',
        },
      },
    ],
  },

  // ─── Heartseed of the First Garden ──────────────────────────────
  {
    id: 'heartseed_first_garden',
    name: 'Heartseed of the First Garden',
    tier: 4,
    censusTag: { scale: 'cosmic' },
    tags: ['legendary', 'creation', 'blessed', 'nature'],
    lossCondition: 'permanent',
    effects: [
      { type: 'aura', radius: 1, target: 'all', reach: 'heart', value: 0.03 },
      { type: 'aura', radius: 1, target: 'all', reach: 'stone', value: 0.03 },
      // THR-718: the Heartseed makes its bearer a wellspring of life (Heart) and
      // rooted growth (Stone). Legendary band; blessed relic, so it sits high with
      // no offsetting curse.
      { type: 'stat_contribution', contributions: { heart: 1.5, stone: 1.0 } },
    ],
    activatedEffects: [
      {
        name: 'Consecrate Grove',
        cooldownTicks: 100,
        cost: { type: 'multi', costs: [
          { type: 'tick_exhaust', ticks: 15 },
          { type: 'reach_drain', reach: 'iron', amount: 0.10 },
        ]},
        effects: [
          { type: 'alter_terrain', target: 'self_hex', terrainEffect: 'sacred_ground', ticks: 'permanent' },
          { type: 'modify_rules', scope: { scope: 'hex', target: 'self' },
            rule: 'healing_multiplier', value: 3.0, ticks: 'permanent' },
          { type: 'modify_rules', scope: { scope: 'hex', target: 'self' },
            rule: 'spawn_rate_multiplier', value: 0.3, ticks: 'permanent' },
        ],
      },
      {
        name: 'Plant the World-Tree',
        cooldownTicks: 9999,
        cost: { type: 'multi', costs: [
          { type: 'doom_increase', amount: 30 },
          { type: 'attachment_consume', tag: 'self' },
        ]},
        effects: [
          {
            type: 'cascade',
            triggerEffect: {
              type: 'create_structure', what: 'landmark', subtype: 'world_tree',
              onHex: 'self', permanent: true,
              properties: { sphereAffinity: 'star', awarenessBonus: 5, encounterSpawnBonus: 2.0 },
            },
            then: [
              { type: 'modify_rules',
                scope: { scope: 'region', regionId: 'self_region' },
                rule: 'doom_rate_multiplier', value: 0.5, ticks: 'permanent' },
              { type: 'modify_rules',
                scope: { scope: 'region', regionId: 'self_region' },
                rule: 'healing_multiplier', value: 2.0, ticks: 'permanent' },
            ],
          },
        ],
      },
    ],
  },

  // ─── The Voidgate Shard ─────────────────────────────────────────
  {
    id: 'voidgate_shard',
    name: 'The Voidgate Shard',
    tier: 4,
    censusTag: { scale: 'cosmic' },
    tags: ['legendary', 'destruction', 'cursed', 'void'],
    lossCondition: 'cursed',
    effects: [
      { type: 'decay', reach: 'heart', startValue: 0, changePerTick: -0.005,
        limitValue: -0.20, destroyAtLimit: false },
      // THR-718: the Shard grants mastery of unmaking (Shadow) and the void between
      // (Veil). Legendary band; the existing heart-decay is its curse, so Shadow
      // sits high while Veil trails.
      { type: 'stat_contribution', contributions: { shadow: 1.5, veil: 1.0 } },
    ],
    activatedEffects: [
      {
        name: 'Void Step',
        cooldownTicks: 50,
        cost: { type: 'attachment_consume', tag: 'crystal' },
        effects: [
          { type: 'teleport', target: 'self', range: 'unlimited' },
        ],
        backlash: {
          trigger: 'failure', probability: 0.4, severity: 'minor',
          effect: { type: 'compel', target: 'self', override: 'movement_target',
                    value: 'random', ticks: 5 },
          narrativeTemplate: 'The void pulls {actor} somewhere they did not choose.',
        },
      },
      {
        name: 'Unmake',
        cooldownTicks: 150,
        cost: { type: 'multi', costs: [
          { type: 'doom_increase', amount: 25 },
          { type: 'reach_drain', reach: 'star', amount: 0.15 },
        ]},
        effects: [
          {
            type: 'cascade',
            triggerEffect: {
              type: 'destroy_structure', what: 'location', target: 'target_location',
              permanent: true, leavesBehind: 'void_scar',
            },
            then: [
              { type: 'spawn', what: 'encounter', template: 'void_horror', onHex: 'target' },
              { type: 'modify_rules', scope: { scope: 'hex', target: 'target' },
                rule: 'doom_rate_multiplier', value: 3.0, ticks: 50 },
              { type: 'faction_manipulate', action: 'shift_relationship',
                between: ['target_faction', 'self_faction'], amount: -100 },
            ],
          },
        ],
        backlash: {
          trigger: 'critical_failure', probability: 1.0, severity: 'catastrophic',
          effect: {
            type: 'cascade',
            triggerEffect: { type: 'destroy_structure', what: 'all_sublocations',
                             target: 'on_hex', permanent: true },
            then: [
              { type: 'duration', ticks: 30, reach: 'star', value: -0.20, destroyOnExpiry: true },
              { type: 'compel', target: 'self', override: 'flee', value: 'away', ticks: 10 },
            ],
          },
          narrativeTemplate: 'The void hungers — it takes more than was offered.',
        },
      },
    ],
  },
];

/** Lookup artifact template by ID */
export function getArtifactTemplate(id: string): ArtifactTemplate | undefined {
  return ARTIFACT_TEMPLATES.find(a => a.id === id);
}
