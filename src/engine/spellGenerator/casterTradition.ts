/**
 * `casterTraditionOf` — which tradition taught this caster (THR-1572, Lane decision 1).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Systems design.
 * A caster's tradition comes from **what they do and whom they serve**, not from their
 * sphere: at worldgen no caster carries a sphere (seed 42: 109 of 109 with all-zero
 * scores), so a sphere-keyed choice would inherit the same empty shelf the cantrip fell
 * through. Each of the 34 traditions is weighted by
 *
 *   role fit   — `SPELL_GEN_ROLE_FIT_WEIGHT` when the role's themes meet the tradition's,
 *                `SPELL_GEN_OFF_ROLE_WEIGHT` otherwise (a thin tail of hedge-necromancers);
 *   × faction  — 1 + `SPELL_GEN_FACTION_LEAN` × (the faction definition's `reachWeights`
 *                · the tradition's theme reaches, normalised);
 *
 * then one hashed pick keyed `tradition:${worldSeed}:${casterSeedIdentity}`. A caster by trait or Veil
 * has no role and draws on faction lean alone; with neither, the draw is uniform — still
 * hashed, never thrown. Deterministic; no graph write (NFP #3, #4).
 */

import type { WorldGraph } from '../graph';
import type { ReachDomain } from '../../types/traits';
import { drawFromTable } from '../../lib/drawTable';
import { casterRoleOf } from '../casterIdentity';
import { ALL_FACTION_DEFINITIONS } from '../../data/faction-definition-lookup';
import {
  ROLE_THEMES, SPELL_GEN_FACTION_LEAN, SPELL_GEN_OFF_ROLE_WEIGHT, SPELL_GEN_ROLE_FIT_WEIGHT, THEME_REACH, TRADITION_ENV,
} from '../../data/spell-generator-tables';
import { traditionCatalog } from './traditionCatalog';

/**
 * The faction-definition reach lean of the caster's faction, or null when they serve none.
 *
 * Reads the **authored** definitions only. The run-founded overlay
 * (`getFactionDefinition`'s dynamic half) is module state published by the *previous*
 * world's init, so reading it at worldgen made two worlds on one seed choose different
 * traditions (caught by `culture-pass2-integration`'s determinism test). A Realm's member,
 * whose definition is run-founded, therefore draws on role alone — deterministically.
 */
export function casterFactionLean(graph: WorldGraph, actorId: string): Partial<Record<ReachDomain, number>> | null {
  const memberships = graph.getOutgoingEdges(actorId, 'member_of')
    .map(e => ({ node: graph.getNode(e.target), rank: Number((e.properties as { rank?: number } | undefined)?.rank ?? 0) }))
    .filter(m => m.node && m.node.properties.actorType === 'faction')
    .sort((a, b) => b.rank - a.rank || a.node!.id.localeCompare(b.node!.id));
  for (const m of memberships) {
    const defId = m.node!.properties.factionDefId as string | undefined;
    const def = defId ? ALL_FACTION_DEFINITIONS.get(defId) : undefined;
    if (def?.reachWeights && Object.keys(def.reachWeights).length > 0) return def.reachWeights;
  }
  return null;
}

/** Each tradition's weight for this caster — exported for the census and the debug bridge. */
export function traditionWeightsFor(graph: WorldGraph, actorId: string): Record<string, number> {
  const role = casterRoleOf(graph, actorId);
  const roleThemes = role ? ROLE_THEMES[role] ?? [] : [];
  const lean = casterFactionLean(graph, actorId);
  const leanTotal = lean ? Object.values(lean).reduce((s, v) => s + Math.max(0, v ?? 0), 0) : 0;

  const weights: Record<string, number> = {};
  for (const t of traditionCatalog()) {
    const row = TRADITION_ENV[t.id];
    const roleFit = roleThemes.length === 0
      ? 1
      : row.themes.some(th => roleThemes.includes(th)) ? SPELL_GEN_ROLE_FIT_WEIGHT : SPELL_GEN_OFF_ROLE_WEIGHT;
    let factionFit = 1;
    if (lean && leanTotal > 0) {
      const reaches = new Set(row.themes.map(th => THEME_REACH[th]));
      const dot = [...reaches].reduce((s, r) => s + Math.max(0, lean[r] ?? 0), 0) / leanTotal;
      factionFit = 1 + SPELL_GEN_FACTION_LEAN * dot;
    }
    weights[t.id] = roleFit * factionFit;
  }
  return weights;
}

/**
 * The stable identity a caster's hashed draws key on: their name, else their id.
 *
 * Not the id alone: NPC ids come from a process-wide counter (`npc_6` in one world,
 * `npc_26` in the next world built in the same process, seed unchanged), so a draw keyed
 * on the id gave one seed two different spell worlds — caught by
 * `culture-pass2-integration`'s same-seed test. Names are drawn from the world's seed.
 */
export function casterSeedIdentity(graph: WorldGraph, actorId: string): string {
  const name = graph.getNode(actorId)?.name;
  return typeof name === 'string' && name.length > 0 ? name : actorId;
}

/** The tradition that taught this caster. Never throws; uniform when nothing weighs in. */
export function casterTraditionOf(graph: WorldGraph, actorId: string, worldSeed: number): string {
  const who = casterSeedIdentity(graph, actorId);
  try {
    const picked = drawFromTable('spellgen.tradition', traditionWeightsFor(graph, actorId), `tradition:${worldSeed}:${who}`, 1)[0];
    if (picked) return picked;
  } catch {
    /* NFP #4 — fall through to the uniform pick */
  }
  const all = traditionCatalog().map(t => t.id);
  return drawFromTable('spellgen.tradition.uniform', Object.fromEntries(all.map(id => [id, 1])), `tradition:${worldSeed}:${who}`, 1)[0] ?? all[0];
}
