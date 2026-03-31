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
        grants: [],
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
        grants: [],
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
        grants: ['cavalry_charge', 'rapid_retreat'],
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
        grants: [],
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
        grants: [],
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
        grants: [],
        tags: ['#beast', '#mount', '#travel'],
      },
    });
    graph.addEdge({
      id: 'seed.ind_3.possesses.starter_copper_market_rations',
      source: 'ind_3',
      target: 'starter_copper_market_rations',
      type: 'possesses',
      properties: {
        modifiers: { flesh: 0.05 },
        grants: [],
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
        grants: ['intimidate'],
        tags: ['#iron', '#weapon', '#legendary_beast'],
      },
    });
  }
}
