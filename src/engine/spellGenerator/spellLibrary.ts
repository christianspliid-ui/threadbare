/**
 * The spell libraries — one per tradition in use, generated at worldgen and shared by that
 * tradition's casters (THR-1572, Lane decisions 2 and 3).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Systems design
 * (`spellLibrary.ts`), § Resolution logic (the library slate, rerolls, the population
 * envelope) and § Fail-soft table.
 *
 * - `buildSpellLibrary` derives each caster's tradition, collects the set in use, fills
 *   `SPELL_LIBRARY_SHAPE` slots per tradition through `generateSpell`, rerolls on validator
 *   problems, and mints one shared definition node per spell — the template on the node
 *   (`spellDefinitionNode(template, provenance)`), never in a module-level registry.
 * - `getTraditionLibrary` reads a tradition's spells back off the graph, by tier then id.
 * - `placeSpellNotice` is the one writer of a transgression's notice mark (Lane decision 5).
 *
 * Fail-soft (NFP #4): a throw while building one tradition leaves that tradition with no
 * library (traced `threw`) and its casters on today's seeding path; worldgen continues.
 */

import type { WorldGraph } from '../graph';
import type { SpellArena, SpellAgency, SpellTemplate } from '../../types/effects';
import { drawFromTable, rollTableUnit } from '../../lib/drawTable';
import { emitTrace } from '../traceBuffer';
import { isCaster } from '../casterIdentity';
import { spellDefinitionNode } from '../../data/spell-templates';
import {
  SPELL_GEN_ARENA_MIX, SPELL_GEN_CARRIED_TRANSGRESSION_MAX_SHARE, SPELL_GEN_DELIBERATE_SHARE_BY_TIER, SPELL_GEN_MAX_REROLLS,
  SPELL_GEN_STEP_ARENAS, SPELL_LIBRARY_SHAPE, THEME_ARENAS, TRADITION_ENV,
} from '../../data/spell-generator-tables';
import { QUINTESSENCE_PASSIVE_REGEN } from '../../types/quintessence';
import { casterTraditionOf } from './casterTradition';
import { eligibleCores, generateSpell, spellSeedKey } from './generateSpell';
import { validateGeneratedSpell } from './validateGeneratedSpell';
import type { GeneratedSpell, GeneratedSpellProvenance, SpellGenTier } from './types';

export { placeSpellNotice, spellNoticeMarkId, spellProvenance } from './notice';

// ═══════════════════════════════════════════════════════════════════
// The slate
// ═══════════════════════════════════════════════════════════════════

export interface LibrarySlot {
  readonly tier: SpellGenTier;
  /** The slot's index within the whole library (0-based), which the spell id carries. */
  readonly slot: number;
  readonly agency: SpellAgency;
  readonly arena: SpellArena;
}

const TIERS: readonly SpellGenTier[] = [1, 2, 3, 4];

/**
 * Plan a tradition's library: agency by tier (ruling 1), an arena the tradition's themes
 * reach and some core can fill, and the first slot on a step arena so a seeded caster is
 * never handed only map magic.
 */
export function planLibrarySlots(traditionId: string, worldSeed: number): LibrarySlot[] {
  const row = TRADITION_ENV[traditionId];
  if (!row) return [];
  const reachable = new Set(row.themes.flatMap(t => THEME_ARENAS[t]));
  const slots: LibrarySlot[] = [];
  let index = 0;
  for (const tier of TIERS) {
    for (let k = 0; k < SPELL_LIBRARY_SHAPE[tier]; k++, index++) {
      const key = `plan:${worldSeed}:${traditionId}:${index}`;
      const share = SPELL_GEN_DELIBERATE_SHARE_BY_TIER[tier];
      const preferred: SpellAgency = share >= 1 ? 'deliberate' : share <= 0 ? 'fate_woven'
        : rollTableUnit('spellgen.plan.agency', key) < share ? 'deliberate' : 'fate_woven';
      const firstSlot = index === 0;
      let chosen: LibrarySlot | null = null;
      for (const agency of [preferred, preferred === 'deliberate' ? 'fate_woven' : 'deliberate'] as SpellAgency[]) {
        const weights: Partial<Record<SpellArena, number>> = {};
        for (const [arena, w] of Object.entries(SPELL_GEN_ARENA_MIX) as [SpellArena, number][]) {
          if (!reachable.has(arena)) continue;
          if (firstSlot && !SPELL_GEN_STEP_ARENAS.includes(arena)) continue;
          if (eligibleCores(traditionId, tier, arena, agency).length === 0) continue;
          weights[arena] = w;
        }
        const arena = drawFromTable<SpellArena>(`spellgen.plan.arena.${agency}`, weights, key, 1)[0];
        if (arena) { chosen = { tier, slot: index, agency, arena }; break; }
      }
      if (chosen) slots.push(chosen);
    }
  }
  return slots;
}

// ═══════════════════════════════════════════════════════════════════
// The build
// ═══════════════════════════════════════════════════════════════════

/** What seeding reads: each tradition's spell ids (tier then id), and each caster's tradition. */
export interface SpellLibraryIndex {
  readonly byTradition: ReadonlyMap<string, readonly string[]>;
  readonly traditionOf: ReadonlyMap<string, string>;
}

export interface SpellLibraryReport {
  readonly traditions: number;
  readonly spells: number;
  readonly byTradition: Record<string, number>;
  readonly emptySlots: number;
}

export interface SpellLibraryBuild {
  readonly index: SpellLibraryIndex;
  readonly spells: readonly GeneratedSpell[];
  readonly report: SpellLibraryReport;
}

/** Generate one tradition's library, rerolling each slot on validator problems. Pure (no graph). */
export function generateTraditionLibrary(
  traditionId: string,
  worldSeed: number,
  coreUse: Map<string, number>,
  usedNames: Set<string>,
  onFallback?: (slot: LibrarySlot, reason: 'no_eligible_core' | 'validator_exhausted' | 'threw', problems: string[]) => void,
): GeneratedSpell[] {
  const out: GeneratedSpell[] = [];
  const slots = planLibrarySlots(traditionId, worldSeed);
  const wovenCount = slots.filter(s => s.agency === 'fate_woven').length;
  const maxCarriedTransgressions = Math.floor(wovenCount * SPELL_GEN_CARRIED_TRANSGRESSION_MAX_SHARE);
  let carriedTransgressions = 0;

  for (const slot of slots) {
    let accepted: GeneratedSpell | null = null;
    let lastProblems: string[] = [];
    let reason: 'no_eligible_core' | 'validator_exhausted' | 'threw' = 'validator_exhausted';
    for (let reroll = 0; reroll <= SPELL_GEN_MAX_REROLLS && !accepted; reroll++) {
      try {
        const base = { worldSeed, traditionId, tier: slot.tier, slot: slot.slot, agency: slot.agency, arena: slot.arena, reroll, coreUse, usedNames };
        let spell = generateSpell(base);
        if (!spell) { reason = 'no_eligible_core'; break; }
        // The population envelope: a library's carried transgressions stay a minority.
        if (spell.template.agency === 'fate_woven' && spell.provenance.priceLayer === 'transgression' && carriedTransgressions >= maxCarriedTransgressions) {
          spell = generateSpell({ ...base, priceLayer: 'strain' }) ?? spell;
        }
        const problems = validateGeneratedSpell(spell.template, spell.provenance, { usedNames });
        if (problems.length === 0) accepted = spell;
        else lastProblems = problems;
      } catch (err) {
        reason = 'threw';
        lastProblems = [err instanceof Error ? err.message : String(err)];
        break;
      }
    }
    if (!accepted) {
      onFallback?.(slot, reason, lastProblems);
      continue;
    }
    usedNames.add(accepted.template.name);
    coreUse.set(accepted.provenance.coreId, (coreUse.get(accepted.provenance.coreId) ?? 0) + 1);
    if (accepted.template.agency === 'fate_woven' && accepted.provenance.priceLayer === 'transgression') carriedTransgressions++;
    out.push(accepted);
  }
  return out;
}

/**
 * Build every library a world needs and mint its spells. Deterministic over
 * `(worldSeed, the casters in the graph)`; consumes no worldgen stream.
 *
 * @param casterIds when omitted, every `isCaster` actor in the graph, sorted.
 */
export function buildSpellLibrary(graph: WorldGraph, worldSeed: number, casterIds?: readonly string[]): SpellLibraryBuild {
  const casters = casterIds ? [...casterIds].sort() : graph.getNodesByType('actor').filter(n => isCaster(graph, n.id)).map(n => n.id).sort();
  const traditionOf = new Map<string, string>();
  const casterCount: Record<string, number> = {};
  for (const id of casters) {
    const t = casterTraditionOf(graph, id, worldSeed);
    traditionOf.set(id, t);
    casterCount[t] = (casterCount[t] ?? 0) + 1;
  }
  const inUse = Object.keys(casterCount).sort();

  const coreUse = new Map<string, number>();
  const usedNames = new Set<string>();
  const byTradition = new Map<string, string[]>();
  const spells: GeneratedSpell[] = [];
  let emptySlots = 0;

  for (const traditionId of inUse) {
    try {
      const library = generateTraditionLibrary(traditionId, worldSeed, coreUse, usedNames, (slot, reason, problems) => {
        emptySlots++;
        traceSafe({
          category: 'spell.generate_fallback', tick: 0, traditionId, tier: slot.tier, slot: slot.slot,
          seedKey: spellSeedKey({ worldSeed, traditionId, tier: slot.tier, slot: slot.slot }), reason, lastProblems: problems,
          summary: `Spell slot left empty: ${traditionId} tier ${slot.tier} slot ${slot.slot} (${reason})`,
        });
      });
      for (const spell of library) {
        const node = spellDefinitionNode(spell.template, spell.provenance as unknown as Record<string, unknown>);
        if (!graph.getNode(node.id)) graph.addNode(node);
        spells.push(spell);
        traceSafe({
          category: 'spell.generated', tick: 0, spellId: spell.template.id, name: spell.template.name, traditionId,
          coreId: spell.provenance.coreId, tier: spell.template.tier, agency: spell.template.agency ?? 'fate_woven',
          arena: spell.template.arena ?? 'encounter', priceLayer: spell.provenance.priceLayer, sphere: spell.sphere,
          seedKey: spell.provenance.seedKey, rerolls: spell.provenance.rerolls,
          summary: `Generated ${spell.template.name} for ${traditionId} (tier ${spell.template.tier}, ${spell.provenance.priceLayer})`,
        });
      }
      byTradition.set(traditionId, sortLibrary(library.map(s => s.template)).map(t => t.id));
    } catch (err) {
      traceSafe({
        category: 'spell.generate_fallback', tick: 0, traditionId, tier: 1, slot: -1, seedKey: `gen_spell:${worldSeed}:${traditionId}`,
        reason: 'threw', lastProblems: [err instanceof Error ? err.message : String(err)],
        summary: `Spell library for ${traditionId} threw; its casters fall back to the authored shelf`,
      });
    }
  }

  const report: SpellLibraryReport = { traditions: byTradition.size, spells: spells.length, byTradition: casterCount, emptySlots };
  return { index: { byTradition, traditionOf }, spells, report };
}

/** Sort a library the way seeding and learning read it: tier, then id (NFP #3). */
export function sortLibrary<T extends Pick<SpellTemplate, 'tier' | 'id'>>(spells: readonly T[]): T[] {
  return [...spells].sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id));
}

/** A tradition's generated spells, read back off the graph, by tier then id. */
export function getTraditionLibrary(graph: WorldGraph, traditionId: string): SpellTemplate[] {
  const out: SpellTemplate[] = [];
  for (const n of graph.getNodesByType('trait')) {
    if (n.properties.subcategory !== 'spell' || n.properties.origin !== 'generated') continue;
    const prov = n.properties.generated as Partial<GeneratedSpellProvenance> | undefined;
    const template = n.properties.template as SpellTemplate | undefined;
    if (prov?.traditionId === traditionId && template) out.push(template);
  }
  return sortLibrary(out);
}

// ═══════════════════════════════════════════════════════════════════
// The population envelope — the soul drain carried at tick 0
// ═══════════════════════════════════════════════════════════════════

/**
 * The seeded carriers' summed per-tick quintessence drain, as a share of their summed
 * passive regeneration (`SPELL_GEN_WORLD_SOUL_DRAIN_BUDGET` is the bar). Seeding draws a
 * library's lowest tier, and tier 1's price window holds no transgression, so on a normal
 * world this is 0 by construction; the measure exists so a retune that changes either
 * fact is caught by the census rather than by a drained world.
 */
export function measureSoulDrainShare(graph: WorldGraph): number {
  let drain = 0;
  let carriers = 0;
  for (const actor of graph.getNodesByType('actor')) {
    let carries = false;
    for (const e of graph.getOutgoingEdges(actor.id, 'has_trait')) {
      const node = graph.getNode(e.target);
      if (node?.properties.subcategory !== 'spell' || node.properties.origin !== 'generated') continue;
      carries = true;
      for (const fx of (node.properties.effects ?? []) as { type: string; resource?: string; amount?: number; mode?: string }[]) {
        if (fx.type === 'resource_manipulate' && fx.resource === 'quintessence' && fx.mode === 'per_tick' && (fx.amount ?? 0) < 0) drain += -(fx.amount ?? 0);
      }
    }
    if (carries) carriers++;
  }
  return carriers === 0 ? 0 : drain / (carriers * QUINTESSENCE_PASSIVE_REGEN);
}

function traceSafe(entry: Record<string, unknown>): void {
  try {
    emitTrace(entry as Parameters<typeof emitTrace>[0]);
  } catch {
    /* NFP #4 */
  }
}
