// src/engine/seedAttachments.ts

/**
 * Seed Attachments — wire starter attachment nodes to seed agents.
 *
 * Adds STARTER_POSSESSIONS and STARTER_CONDITIONS as graph nodes, then
 * creates possesses / bonded_to / has_trait edges to specific seed agents.
 * Distribution is fixed (not randomised) so tests can rely on it.
 */

import type { WorldGraph } from './graph';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../data/starter-attachments';
import {
  REWARD_POSSESSIONS,
  REWARD_CONDITIONS,
  REWARD_BESTOWED_POWERS,
} from '../data/reward-attachment-catalog';
import { allSpellDefinitionNodes, SPELL_TEMPLATES, spellDefinitionNodeId } from '../data/spell-templates';
import { INNATE_POWER_DEFINITIONS } from '../data/innate-powers';
import { allStrainConditionNodes } from '../data/strain-conditions';
import {
  SEEDED_SPELLS_PER_CASTER,
  SEEDED_FALLBACK_TO_CANTRIP,
  SEEDED_CASTER_ROLES,
  SEEDED_SPELL_COVERAGE,
} from '../data/spell-casting-constants';
import { grantSpell } from './spellGrant';
import { isCaster, isCasterByCraft, casterRoleOf, alignedSpheres } from './casterIdentity';
import { emitTrace } from './traceBuffer';
import { drawFromTable } from '../lib/drawTable';
import { SPELL_GEN_ENABLED, SPELL_GEN_STEP_ARENAS } from '../data/spell-generator-tables';
import type { SpellLibraryIndex } from './spellGenerator/spellLibrary';
import { casterSeedIdentity } from './spellGenerator/casterTradition';
import type { SpellTemplate } from '../types/effects';
import {
  ANOMALY_SIGNATURE_ARTIFACTS,
  ANOMALY_BESTOWED_POWERS,
  ANOMALY_CONDITIONS,
} from '../data/anomaly-reward-catalog';
import type { TraitDefinitionProperties } from '../types/traits';

export function seedAttachments(graph: WorldGraph): void {
  // ── Add all starter attachment nodes ────────────────────────────
  for (const node of STARTER_POSSESSIONS) {
    graph.addNode(node);
  }
  for (const node of STARTER_CONDITIONS) {
    graph.addNode(node);
  }

  // ── Add reward catalog templates (unowned, used by reward pool) ──
  for (const node of REWARD_POSSESSIONS) {
    graph.addNode(node);
  }
  for (const node of REWARD_CONDITIONS) {
    graph.addNode(node);
  }
  for (const node of REWARD_BESTOWED_POWERS) {
    graph.addNode(node);
  }

  // ── Spell definitions: the Power kind's `spell` class (THR-1429) ──
  //
  // Beside the trait definitions above because that is what they are — shared
  // definition nodes nobody holds until somebody learns them. One per template,
  // never one per bearer (THR-1395). `learn_spell` writes the edges; this writes
  // the vocabulary they point at, so a world seeded before the cell existed is the
  // only world where a learn can refuse `no_definition`.
  for (const node of allSpellDefinitionNodes()) {
    graph.addNode(node);
  }
  // The price a strain spell charges (THR-1571): eight shared condition definitions,
  // one per Reach, beside the spells that land them.
  for (const node of allStrainConditionNodes()) {
    if (!graph.getNode(node.id)) graph.addNode(node);
  }
  // The Power kind's innate class (THR-1671): eight shared definitions, one per
  // monster family. Nobody bears one until a lair mints its elite (`createNamedElite`).
  for (const node of INNATE_POWER_DEFINITIONS) {
    if (!graph.getNode(node.id)) graph.addNode({ ...node, properties: { ...node.properties } });
  }

  // ── Add anomaly reward catalog (unowned, used by anomaly discovery rewards) ──
  for (const node of ANOMALY_SIGNATURE_ARTIFACTS) {
    graph.addNode(node);
  }
  for (const node of ANOMALY_BESTOWED_POWERS) {
    graph.addNode(node);
  }
  for (const node of ANOMALY_CONDITIONS) {
    graph.addNode(node);
  }

  // ── Helper: get domainContributions from a condition node ────────
  function conditionModifiers(id: string): Record<string, number> {
    const node = graph.getNode(id);
    if (!node) return {};
    const props = node.properties as TraitDefinitionProperties;
    return props.domainContributions ?? {};
  }

  // ── ind_0 — well-equipped warrior ────────────────────────────────
  if (graph.getNode('ind_0')) {
    graph.addEdge({
      id: 'seed.ind_0.possesses.starter_iron_blade',
      source: 'ind_0',
      target: 'starter_iron_blade',
      type: 'possesses',
      properties: {
        modifiers: { iron: 0.10 },
        tags: ['#iron', '#weapon', '#melee'],
      },
    });
    graph.addEdge({
      id: 'seed.ind_0.possesses.starter_traveler_cloak',
      source: 'ind_0',
      target: 'starter_traveler_cloak',
      type: 'possesses',
      properties: {
        modifiers: { star: 0.05 },
        tags: ['#cloth', '#travel', '#weather'],
      },
    });
    graph.addEdge({
      id: 'seed.ind_0.has_trait.starter_bruised_ribs',
      source: 'ind_0',
      target: 'starter_bruised_ribs',
      type: 'has_trait',
      properties: {
        level: 1,
        acquiredTick: 0,
        ticksRemaining: 12,
        totalTicks: 20,
        source: 'World seed',
        modifiers: conditionModifiers('starter_bruised_ribs'),
      },
    });
  }

  // ── ind_1 — mounted scout ─────────────────────────────────────────
  if (graph.getNode('ind_1')) {
    graph.addEdge({
      id: 'seed.ind_1.possesses.starter_ashenmane_horse',
      source: 'ind_1',
      target: 'starter_ashenmane_horse',
      type: 'possesses',
      properties: {
        modifiers: { iron: 0.10 },
        tags: ['#beast', '#mount', '#cavalry'],
      },
    });
    graph.addEdge({
      id: 'seed.ind_1.has_trait.starter_sun_touched',
      source: 'ind_1',
      target: 'starter_sun_touched',
      type: 'has_trait',
      properties: {
        level: 1,
        acquiredTick: 0,
        ticksRemaining: 8,
        totalTicks: 15,
        source: 'World seed',
        modifiers: conditionModifiers('starter_sun_touched'),
      },
    });
  }

  // ── ind_2 — scholar/mystic ───────────────────────────────────────
  if (graph.getNode('ind_2')) {
    graph.addEdge({
      id: 'seed.ind_2.possesses.starter_burned_codex',
      source: 'ind_2',
      target: 'starter_burned_codex',
      type: 'possesses',
      properties: {
        modifiers: { eye: 0.10, veil: 0.05 },
        tags: ['#star', '#tome', '#knowledge'],
      },
    });
    graph.addEdge({
      id: 'seed.ind_2.possesses.starter_whispering_eye',
      source: 'ind_2',
      target: 'starter_whispering_eye',
      type: 'possesses',
      properties: {
        modifiers: { veil: 0.15, eye: 0.10 },
        tags: ['#eye', '#cursed', '#supernatural'],
      },
    });
    graph.addEdge({
      id: 'seed.ind_2.has_trait.starter_revelation',
      source: 'ind_2',
      target: 'starter_revelation',
      type: 'has_trait',
      properties: {
        level: 1,
        acquiredTick: 0,
        ticksRemaining: 15,
        totalTicks: 20,
        source: 'World seed',
        modifiers: conditionModifiers('starter_revelation'),
      },
    });
  }

  // ── ind_3 — plague-touched traveler ──────────────────────────────
  if (graph.getNode('ind_3')) {
    graph.addEdge({
      id: 'seed.ind_3.possesses.starter_road_worn_mule',
      source: 'ind_3',
      target: 'starter_road_worn_mule',
      type: 'possesses',
      properties: {
        modifiers: { iron: 0.03 },
        tags: ['#beast', '#mount', '#travel'],
      },
    });
    graph.addEdge({
      id: 'seed.ind_3.possesses.starter_copper_market_rations',
      source: 'ind_3',
      target: 'starter_copper_market_rations',
      type: 'possesses',
      properties: {
        // THR-1359: carried `modifiers: { flesh: 0.05 }` — the retired 9th Reach.
        // Dropped rather than remapped: `flesh` is not a `ReachDomain`, so the
        // modifier already contributed nothing to `computeRawScore`, and removing
        // it preserves today's behaviour exactly. Picking a live Reach would have
        // *granted* this item 0.05 it never effectively had.
        tags: ['#food', '#consumable', '#travel'],
      },
    });
    graph.addEdge({
      id: 'seed.ind_3.has_trait.starter_plague_touched',
      source: 'ind_3',
      target: 'starter_plague_touched',
      type: 'has_trait',
      properties: {
        level: 1,
        acquiredTick: 0,
        ticksRemaining: 25,
        totalTicks: 40,
        source: 'World seed',
        modifiers: conditionModifiers('starter_plague_touched'),
      },
    });
  }

  // ── ind_4 — elite with a named weapon ────────────────────────────
  if (graph.getNode('ind_4')) {
    graph.addEdge({
      id: 'seed.ind_4.bonded_to.starter_ashenmane_fang',
      source: 'ind_4',
      target: 'starter_ashenmane_fang',
      type: 'bonded_to',
      properties: {
        modifiers: { iron: 0.15 },
        tags: ['#iron', '#weapon', '#legendary_beast'],
      },
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// Seeded knowing — acquisition channel 2 (THR-1571, lane decision 5)
// ═══════════════════════════════════════════════════════════════════

/** What `seedSpellKnowing` did — the `spell.seeded` aggregate. */
export interface SpellSeedingReport {
  readonly casters: number;
  readonly seeded: number;
  readonly bySpell: Record<string, number>;
  readonly fallbackCantrip: number;
  /** THR-1572 — casters per tradition among those seeded from a library. */
  readonly byTradition: Record<string, number>;
  /** THR-1572 — casters seeded from their tradition's generated library. */
  readonly fromLibrary: number;
}

/** THR-1572 — the generated library seeding reads, and the world seed its hashed pick keys on. */
export interface SpellSeedingLibrary {
  readonly index: SpellLibraryIndex;
  readonly worldSeed: number;
}

/**
 * The lowest-tier spells of a caster's tradition library, or [] when the tradition has no
 * library or its library holds no spell a step can use (§ Fail-soft table: those casters
 * keep today's path).
 */
function libraryShelf(graph: WorldGraph, lib: SpellSeedingLibrary, traditionId: string | undefined): SpellTemplate[] {
  if (!traditionId) return [];
  const templates = (lib.index.byTradition.get(traditionId) ?? [])
    .map(id => graph.getNode(spellDefinitionNodeId(id))?.properties.template as SpellTemplate | undefined)
    .filter((t): t is SpellTemplate => !!t);
  // Only spells a step can use are seeded, so no caster starts the world holding nothing
  // but map magic — even when a tier-1 slot drew a map arena or its step slot was left empty.
  const stepUsable = templates.filter(t => t.arena && SPELL_GEN_STEP_ARENAS.includes(t.arena));
  if (stepUsable.length === 0) return [];
  const lowest = Math.min(...stepUsable.map(t => t.tier));
  return stepUsable.filter(t => t.tier === lowest);
}

/**
 * Give every caster the world's first spell of their tradition.
 *
 * Before THR-1571 the only writer of `knows_spell` was `create × Power`, which needs a
 * caster in the deciding tier — one of 104 on seed 42 — so no mortal in the world held
 * a spell. This writes both edges (`knows_spell`, and `has_trait` while a slot is free)
 * with `source: 'seeded'` for every `isCaster` actor, subject to two levers:
 *
 * - `SEEDED_CASTER_ROLES` — a caster *by role* is seeded only if the role is listed.
 *   Casters by mastery trait or by Veil are always eligible.
 * - `SEEDED_SPELL_COVERAGE` — the fraction of eligible casters seeded, by a sorted
 *   pick on actor id.
 *
 * The pick: the tradition shelf (templates whose sphere is one of the caster's aligned
 * spheres), lowest tier then id; else, when `SEEDED_FALLBACK_TO_CANTRIP`, the lowest-
 * tier template by id. No draws anywhere — sorted picks only (NFP #3), so seeding
 * shifts no other stream.
 *
 * Runs at the tail of worldgen, after every mortal is placed (NPCs are seeded after
 * `seedAttachments`, so the definitions and the knowing cannot share one pass).
 *
 * THR-1572 — with a `library` (and `SPELL_GEN_ENABLED`), a caster whose tradition has a
 * generated library is seeded from it instead: among the library's lowest-tier spells, a
 * hashed pick keyed `seed_spell:${worldSeed}:${actorId}`, so two priests of one order do not
 * all carry the same spell. The `knows_spell` edge records the `tradition`. Without a
 * library, or with the switch off, this is THR-1571's path exactly.
 */
export function seedSpellKnowing(graph: WorldGraph, library?: SpellSeedingLibrary): SpellSeedingReport {
  const templates = [...SPELL_TEMPLATES]
    .filter(t => graph.getNode(spellDefinitionNodeId(t.id)))
    .sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id));
  const cantrip = templates[0];

  const casters = graph.getNodesByType('actor')
    .filter(n => isCaster(graph, n.id))
    .map(n => n.id)
    .sort();
  const eligible = casters.filter(id => {
    const role = casterRoleOf(graph, id);
    // A caster by trait or Veil has no role on the list to check; one by role must be listed.
    return role === null || SEEDED_CASTER_ROLES.includes(role) || isCasterByCraft(graph, id);
  });
  const chosen = eligible.slice(0, Math.ceil(eligible.length * Math.max(0, Math.min(1, SEEDED_SPELL_COVERAGE))));

  const bySpell: Record<string, number> = {};
  const byTradition: Record<string, number> = {};
  let seeded = 0;
  let fallbackCantrip = 0;
  let fromLibrary = 0;
  const useLibrary = SPELL_GEN_ENABLED && !!library;
  for (const actorId of chosen) {
    const traditionId = useLibrary ? library!.index.traditionOf.get(actorId) : undefined;
    const libShelf = useLibrary ? libraryShelf(graph, library!, traditionId) : [];
    let picks: SpellTemplate[];
    let viaLibrary = false;
    if (libShelf.length > 0) {
      const weights = Object.fromEntries(libShelf.map(t => [t.id, 1]));
      const ids = drawFromTable('spellgen.seed_spell', weights, `seed_spell:${library!.worldSeed}:${casterSeedIdentity(graph, actorId)}`, SEEDED_SPELLS_PER_CASTER);
      picks = ids.map(id => libShelf.find(t => t.id === id)!).filter(Boolean);
      viaLibrary = picks.length > 0;
    } else {
      const aligned = alignedSpheres(graph, actorId);
      const shelf = templates.filter(t => aligned.includes(t.sphereAffinity));
      picks = shelf.slice(0, SEEDED_SPELLS_PER_CASTER);
      if (picks.length === 0 && SEEDED_FALLBACK_TO_CANTRIP && cantrip) {
        picks = [cantrip];
        fallbackCantrip += 1;
      }
    }
    if (picks.length === 0) continue;

    let wroteAny = false;
    for (const spell of picks) {
      // THR-1672: through the one grant seam. Edges unchanged (pinned by spellGrant.pin.test.ts).
      const granted = grantSpell(graph, actorId, spell.id, {
        source: 'seeded',
        tick: 0,
        sphereAffinity: spell.sphereAffinity,
        ...(viaLibrary && traditionId ? { tradition: traditionId } : {}),
      });
      if (!granted.granted) continue;
      bySpell[spell.id] = (bySpell[spell.id] ?? 0) + 1;
      wroteAny = true;
    }
    if (wroteAny) {
      seeded += 1;
      if (viaLibrary && traditionId) {
        fromLibrary += 1;
        byTradition[traditionId] = (byTradition[traditionId] ?? 0) + 1;
      }
    }
  }

  const report: SpellSeedingReport = { casters: casters.length, seeded, bySpell, fallbackCantrip, byTradition, fromLibrary };
  try {
    emitTrace({
      category: 'spell.seeded',
      tick: 0,
      ...report,
      summary: `Seeded knowing: ${seeded} of ${casters.length} casters start with a spell (${fromLibrary} from a tradition library, ${fallbackCantrip} from the fallback cantrip)`,
    });
  } catch {
    /* NFP #4 */
  }
  return report;
}

