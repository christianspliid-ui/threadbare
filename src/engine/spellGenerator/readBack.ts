/**
 * The spell read-back — mint a generated spell into the item generator's three-mortal
 * world and ask the REAL engine whether each promise it makes is kept (THR-1572).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Review path (gate 1).
 *
 * - **Carried** (fate-woven): the spell's shared definition node is borne through
 *   `has_trait`, and every carried effect is read back through the item read-back's
 *   per-effect readers (`readBackEffects`, reused, not forked).
 * - **Cast** (deliberate): `resolveCast` runs on a `success` band and on a `failure` band
 *   from identical fresh worlds. Each cast effect's write must be on the world after the
 *   landed cast and absent after the fizzle; strain pays its Strained condition; a
 *   transgression places exactly one notice mark, and a second cast places none.
 *
 * Pure over the spell (it builds its own worlds); never throws — a throw is a failure.
 */

import type { GameState } from '../../types/gameState';
import type { AttachmentEffect, SpellTemplate } from '../../types/effects';
import { readBackBaseWorld, readBackEffects, type ReadBackResult } from '../itemGenerator/readBack';
import type { WorldGraph } from '../graph';
import { spellDefinitionNode, spellDefinitionNodeId, carriedEffectsOf } from '../../data/spell-templates';
import { allStrainConditionNodes } from '../../data/strain-conditions';
import { CONDITION_TRAIT_DEFINITIONS } from '../../data/condition-trait-content';
import { getActiveRuleOverride } from '../effects/effectQueries';
import { resolveCast, resolveCastTarget } from '../spellCasting';
import { flatCosts } from './validateGeneratedSpell';
import { spellNoticeMarkId } from './notice';
import type { GeneratedSpell } from './types';

/** The caster in the read-back world (the item read-back's bearer). */
const CASTER = 'bearer';
/** The opponent a fight-arena cast is aimed at. */
const OPPONENT = 'rival';

/** The three-mortal world with the spell's definition node minted and borne by the caster. */
export function spellReadBackWorld(spell: GeneratedSpell): WorldGraph {
  const g = readBackBaseWorld();
  // A working caster: enough of every Reach that a strain price is affordable (raw 0–100).
  const caster = g.getNode(CASTER);
  if (caster) caster.properties.domainCapabilities = { iron: 60, gold: 60, shadow: 60, veil: 60, heart: 60, eye: 60, stone: 60, star: 60 };
  // A strip of settlements east of the village, so a teleport has somewhere to land.
  for (let i = 1; i <= 4; i++) {
    g.addNode({ id: `loc_east_${i}`, type: 'location', name: `loc_east_${i}`, properties: { hexCol: 5 + i, hexRow: 5, locationType: 'village', locationSubtype: 'village' } });
  }
  for (const node of allStrainConditionNodes()) if (!g.getNode(node.id)) g.addNode(node);
  for (const node of CONDITION_TRAIT_DEFINITIONS) if (!g.getNode(node.id)) g.addNode(node);
  g.addNode(spellDefinitionNode(spell.template, spell.provenance as unknown as Record<string, unknown>));
  const defId = spellDefinitionNodeId(spell.template.id);
  g.addEdge({ id: `knows_spell_${CASTER}_${defId}`, source: CASTER, target: defId, type: 'knows_spell', properties: { learnedTick: 0 } });
  g.addEdge({ id: `has_trait_${CASTER}_${defId}`, source: CASTER, target: defId, type: 'has_trait', properties: { level: 1, acquiredTick: 0 } });
  return g;
}

function stateFor(graph: WorldGraph): GameState {
  return {
    graph, tick: 10, seed: 42, effectStates: new Map(), castCooldowns: new Map(), hiddenMarks: [],
  } as unknown as GameState;
}

/** Give the caster something a dispel can lift. */
function woundCaster(g: WorldGraph): void {
  g.addEdge({ id: 'readback_wound', source: CASTER, target: 'trait.condition.wounded', type: 'has_trait', properties: { acquiredTick: 0 } });
}

/** Did this cast effect's write land on the world? */
function effectWritten(state: GameState, e: AttachmentEffect, before: { located?: string }): boolean {
  const g = state.graph;
  switch (e.type) {
    case 'inflict_condition': {
      const who = e.target === 'self' ? CASTER : OPPONENT;
      return g.getOutgoingEdges(who, 'has_trait').some(x => x.target === e.conditionTraitId && x.id !== 'readback_wound');
    }
    case 'resource_manipulate':
      return Number(Object.entries(g.getNode(OPPONENT)?.properties ?? {}).find(([k]) => /clock/i.test(k))?.[1] ?? 0) !== 0
        || !!(g.getNode(OPPONENT)?.properties.monsterState);
    case 'teleport':
    case 'forced_move':
      return g.getOutgoingEdges(CASTER, 'located_at')[0]?.target !== before.located;
    case 'modify_rules': {
      const v = getActiveRuleOverride(g, CASTER, e.rule, state.effectStates, state);
      if (typeof e.value === 'object' && e.value !== null) return (state.activeRuleOverrides?.[CASTER] ?? []).some(o => o.rule === e.rule);
      if (typeof e.value === 'boolean') return v === 1;
      return Math.abs(v - (e.value as number)) < 1e-9 || (state.activeRuleOverrides?.[CASTER] ?? []).some(o => o.rule === e.rule && o.value === e.value);
    }
    case 'alter_terrain':
      return Object.values(state.activeTerrainOverlays ?? {}).some(list => list.some(o => o.terrainEffect === e.terrainEffect));
    case 'dispel':
      return !g.getEdge('readback_wound');
    default:
      return false;
  }
}

/** Cast once on a band from a fresh world, returning the state after and the result. */
function castOn(spell: GeneratedSpell, band: 'success' | 'failure'): { state: GameState; before: { located?: string }; result: ReturnType<typeof resolveCast> } {
  const g = spellReadBackWorld(spell);
  woundCaster(g);
  const state = stateFor(g);
  const before = { located: g.getOutgoingEdges(CASTER, 'located_at')[0]?.target };
  const named = spell.template.targeting.type === 'agent' ? OPPONENT : undefined;
  const target = resolveCastTarget(g, CASTER, spell.template, named);
  const result = resolveCast(state, {
    casterId: CASTER, spell: spell.template, band, tick: 10, site: 'undertaking', siteRef: `readback:${band}`, ...target,
  });
  return { state, before, result };
}

/** Read every promise a generated spell makes back through the real engine. */
export function readBackSpell(spell: GeneratedSpell): ReadBackResult {
  const failures: string[] = [];
  let checks = 0;
  const ok = (cond: boolean, msg: string) => { checks++; if (!cond) failures.push(msg); };
  try {
    const t: SpellTemplate = spell.template;
    if (t.agency !== 'deliberate') {
      ok(carriedEffectsOf(t) !== null, 'the definition node carries no effects (a stateful primitive was refused)');
      const inner = readBackEffects(() => spellReadBackWorld(spell), spellDefinitionNodeId(t.id));
      return { ok: failures.length === 0 && inner.ok, checks: checks + inner.checks, failures: [...failures, ...inner.failures] };
    }

    const landed = castOn(spell, 'success');
    ok(!landed.result.refused, `the landed cast was refused: ${landed.result.refused}`);
    ok(landed.result.landed, 'a success did not land');
    for (const e of t.effects) ok(effectWritten(landed.state, e, landed.before), `landed ${e.type} wrote nothing`);

    const fizzled = castOn(spell, 'failure');
    ok(!fizzled.result.refused, `the fizzled cast was refused: ${fizzled.result.refused}`);
    ok(!fizzled.result.landed, 'a failure landed');
    for (const e of t.effects) {
      // A backlash may write the same *kind* of thing on the caster; the boon's own write must be absent.
      const backlashSame = t.backlash && t.backlash.effect.type === e.type
        && JSON.stringify((t.backlash.effect as { rule?: unknown }).rule) === JSON.stringify((e as { rule?: unknown }).rule);
      if (!backlashSame) ok(!effectWritten(fizzled.state, e, fizzled.before), `fizzled ${e.type} still wrote`);
    }

    // Strain pays the Strained condition.
    if (flatCosts(t.cost).some(c => c.type === 'reach_drain')) {
      ok(landed.result.writes.some(w => w.kind === 'strain'), 'reach_drain paid no Strained condition');
    }
    // Transgression: one notice mark, and a second cast places none.
    if (spell.provenance.notice) {
      const marks = (landed.state.hiddenMarks ?? []).filter(m => m.markId === spellNoticeMarkId(CASTER, t.id));
      ok(marks.length === 1, `notice placed ${marks.length} marks`);
      ok(landed.result.notice?.placed === true, 'the cast did not report its notice');
      landed.state.castCooldowns = new Map();
      const again = resolveCast(landed.state, { casterId: CASTER, spell: t, band: 'success', tick: 500, site: 'undertaking', siteRef: 'readback:again', ...resolveCastTarget(landed.state.graph, CASTER, t, t.targeting.type === 'agent' ? OPPONENT : undefined) });
      ok(again.notice?.placed === false, 'a second cast placed another notice');
      ok((landed.state.hiddenMarks ?? []).filter(m => m.markId === spellNoticeMarkId(CASTER, t.id)).length === 1, 'a second cast added a mark');
    } else {
      ok((landed.state.hiddenMarks ?? []).length === 0, 'a spell with no notice placed a mark');
    }
  } catch (err) {
    failures.push(`read-back threw: ${err instanceof Error ? err.message : String(err)}`);
  }
  return { ok: failures.length === 0, checks, failures };
}
