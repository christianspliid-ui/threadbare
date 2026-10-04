/**
 * The cast vocabulary — every effect a generated *deliberate* spell may land, and the
 * writer that makes it true (THR-1572).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Data tables and
 * § Interface impact (`generated-spell-honest-vocabulary`). Measured against
 * `executeEffect` (`effectExecutors.ts`) at build, 2026-10-03.
 *
 * The rule (Lane decision 6): **a cast must write.** `executeEffect` returns
 * `modifierOnlyResult` for `duration`, `aura`, `conditional`, `passive`, `suppress`,
 * `test_shaper` and `social_modifier`, so those would land and change nothing. They stay
 * `refused` here until THR-1683's per-cast channel gives them somewhere to land; when it
 * ships, their rows flip to `live` behind a read-back case and the generator needs no
 * other change.
 *
 * Carried (fate-woven) effects are judged by `ITEM_HONEST_VOCABULARY` intersected with
 * `isCarriedEffectStateless` — this table is only the cast half.
 */

import type { AttachmentEffect, SpellArena, SpellCost } from '../types/effects';

export type CastShapeStatus = 'live' | 'refused';

export interface CastShapeRow {
  readonly status: CastShapeStatus;
  /** The writer in `executeEffect` that makes the cast true, or why it is refused. */
  readonly writer: string;
  /** Arenas the row is live in (absent = every arena). */
  readonly arenas?: readonly SpellArena[];
}

export const SPELL_CAST_HONEST_VOCABULARY: Readonly<Partial<Record<AttachmentEffect['type'], CastShapeRow>>> = {
  inflict_condition:   { status: 'live', writer: 'executeInflictCondition → conditionApplier (the eight real conditions only)' },
  resource_manipulate: { status: 'live', writer: 'executeFightClock — fight_clock only', arenas: ['fight'] },
  teleport:            { status: 'live', writer: 'executeTeleport → rebindLocatedAt (THR-1571)', arenas: ['map_travel'] },
  forced_move:         { status: 'live', writer: 'executeForcedMove → rebindLocatedAt (THR-1571)', arenas: ['map_travel'] },
  modify_rules:        { status: 'live', writer: 'executeModifyRules — a persisted override read at its owning site' },
  alter_terrain:       { status: 'live', writer: 'executeAlterTerrain — warded (movementCost) and shrouded (encounterAwareness) only', arenas: ['map_mark'] },
  dispel:              { status: 'live', writer: 'executeDispel — edge-only for conditions since THR-1571' },
  duration:            { status: 'refused', writer: 'modifierOnlyResult — writes nothing when cast (THR-1683)' },
  aura:                { status: 'refused', writer: 'modifierOnlyResult — writes nothing when cast (THR-1683)' },
  conditional:         { status: 'refused', writer: 'modifierOnlyResult — writes nothing when cast (THR-1683)' },
  passive:             { status: 'refused', writer: 'modifierOnlyResult — writes nothing when cast (THR-1683)' },
  suppress:            { status: 'refused', writer: 'modifierOnlyResult — writes nothing when cast (THR-1683)' },
  test_shaper:         { status: 'refused', writer: 'modifierOnlyResult — writes nothing when cast (THR-1683)' },
  social_modifier:     { status: 'refused', writer: 'modifierOnlyResult — writes nothing when cast (THR-1683)' },
  transfer:            { status: 'refused', writer: 'out of the map\'s scope' },
  compel:              { status: 'refused', writer: 'out of the map\'s scope' },
  spawn:               { status: 'refused', writer: 'out of the map\'s scope' },
  faction_manipulate:  { status: 'refused', writer: 'out of the map\'s scope' },
  cascade:             { status: 'refused', writer: 'out of the map\'s scope' },
  choice_set:          { status: 'refused', writer: 'out of the map\'s scope' },
};

/** Rule keys a cast `modify_rules` may write: the carried live set plus the step's Reach swap. */
export const SPELL_CAST_RULE_KEYS_EXTRA: readonly string[] = ['encounter_reach_override'];

/** Terrain overlays a cast may raise — the two of eleven that something reads. */
export const SPELL_CAST_TERRAIN_OVERLAYS: readonly string[] = ['warded', 'shrouded'];

/**
 * Costs a generated spell may charge — each paid by `payCosts` (`spellActivation.ts`).
 * `attachment_consume` is executed by `payCosts` but refused **by policy** (no core needs
 * it); `relationship_damage` and `health_sacrifice` would each need a read-back case first.
 */
export const SPELL_LIVE_COST_TYPES: readonly SpellCost['type'][] = [
  'reach_drain', 'condition_inflict', 'doom_increase', 'tick_exhaust', 'multi',
];
