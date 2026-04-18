/**
 * Ruins Layer — Quest Hook Phase (PR 8 — THR-156).
 *
 * Channel 6 of Narrative Gravity: when a ruin accumulates sufficient clue
 * evidence AND an Adventurer's Guild hall exists within GUILD_QUEST_RADIUS hexes,
 * the Guild issues a quest hook — a formal NPC-driven invitation to delve.
 *
 * Quest hooks persist on the ruin node as questHookPostedTick +
 * questHookTemplateId. The faction quest generation system reads these to boost
 * the matching template's priority for eligible Guild members.
 *
 * Fail-soft: all per-ruin work is wrapped in try/catch — a bad node never
 * crashes the tick loop.
 */

import type { GameState, TickEvent } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { KnowsClueOfEdgeProperties } from '../../types/knowledge';
import { emitTrace } from '../traceBuffer';
import { hexDistance } from '../../lib/hexMath';
import {
  RUIN_QUEST_GENERATION_INTERVAL_TICKS,
  RUIN_MAGNITUDE_MINOR_MAX,
  RUIN_MAGNITUDE_MAJOR_MAX,
  CLUE_QUEST_THRESHOLD,
  GUILD_QUEST_RADIUS,
  QUEST_HOOK_COOLDOWN_TICKS,
} from './constants';

// ─── Evidence Strength ────────────────────────────────────────────────────────

/**
 * Sum of magnitudes of all non-consumed knows_clue_of edges pointing at ruinId.
 * Exported so tests and the faction quest system can call it directly.
 */
export function getEvidenceStrength(ruinId: string, graph: WorldGraph): number {
  return graph.getAllEdges()
    .filter(e => e.type === 'knows_clue_of' && e.target === ruinId)
    .reduce((sum, e) => {
      const props = e.properties as KnowsClueOfEdgeProperties;
      return props.consumed ? sum : sum + (props.magnitude ?? 0);
    }, 0);
}

// ─── Quest template selection ─────────────────────────────────────────────────

/**
 * Map ruin magnitude to the appropriate Adventurer's Guild quest template.
 * Saga (> RUIN_MAGNITUDE_MAJOR_MAX) → ag.elite.lost_city
 * Major (> RUIN_MAGNITUDE_MINOR_MAX) → ag.senior.deep_expedition
 * Minor → ag.quest.ruin_delve
 */
export function selectQuestTemplateForRuin(ruinMagnitude: number): string {
  if (ruinMagnitude > RUIN_MAGNITUDE_MAJOR_MAX) return 'ag.elite.lost_city';
  if (ruinMagnitude > RUIN_MAGNITUDE_MINOR_MAX) return 'ag.senior.deep_expedition';
  return 'ag.quest.ruin_delve';
}

// ─── Toast prose — 5 vignettes keyed by sphere archetype ─────────────────────

const MARTIAL_SPHERES = new Set(['iron', 'stone', 'flesh']);
const PROSPERITY_SPHERES = new Set(['gold', 'heart']);
const DIVINE_SPHERES = new Set(['spirit', 'fire']);
const ARCANE_SPHERES = new Set(['mind', 'eye', 'star']);

/**
 * Build the toast notification message for a quest hook issuance.
 * Five vignettes based on sphere alignment (martial / prosperity / divine / arcane / ancient).
 */
export function buildQuestHookMessage(
  ruinName: string,
  direction: string,
  guildName: string,
  sphereAlignment: string,
): string {
  if (MARTIAL_SPHERES.has(sphereAlignment)) {
    return `${guildName} posts a contract: an old fortress to the ${direction} — ${ruinName} — holds something worth the risk.`;
  }
  if (PROSPERITY_SPHERES.has(sphereAlignment)) {
    return `A notice at the ${guildName} board: a ruined vault to the ${direction} — ${ruinName} — and its wealth still unclaimed.`;
  }
  if (DIVINE_SPHERES.has(sphereAlignment)) {
    return `${guildName} seeks bold souls willing to enter ${ruinName}, a sanctified ruin to the ${direction} where something stirs.`;
  }
  if (ARCANE_SPHERES.has(sphereAlignment)) {
    return `${guildName} has posted a scholarly commission: ${ruinName} to the ${direction} holds texts and relics the guild will pay to recover.`;
  }
  // time, unknown, or other spheres — ancient/forgotten archetype
  return `${guildName} has posted a contract: ${ruinName} to the ${direction} — long forgotten, now remembered.`;
}

// ─── Hex direction ────────────────────────────────────────────────────────────

function hexDirection(
  from: { col: number; row: number },
  to: { col: number; row: number },
): string {
  const dx = to.col - from.col;
  const dy = to.row - from.row;
  if (dx === 0 && dy === 0) return 'nearby';
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const dirs = ['east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north', 'northeast'];
  const idx = Math.round(((angle + 360) % 360) / 45) % 8;
  return dirs[idx];
}

// ─── Guild location helpers ───────────────────────────────────────────────────

interface GuildLocationEntry {
  id: string;
  name: string | undefined;
  hex: { col: number; row: number };
}

/** Collect all location nodes that contain an Adventurer's Guild hall sublocation. */
function findGuildLocations(graph: WorldGraph): GuildLocationEntry[] {
  const results: GuildLocationEntry[] = [];
  for (const locNode of graph.getNodesByType('location')) {
    const col = locNode.properties.hexCol as number | undefined;
    const row = locNode.properties.hexRow as number | undefined;
    if (col == null || row == null) continue;

    const hasGuildHall = graph.getOutgoingEdges(locNode.id, 'contains')
      .map(e => graph.getNode(e.target))
      .some(n => n &&
        n.properties?.factionDefId === 'adventuring_guild'
      );

    if (hasGuildHall) {
      results.push({ id: locNode.id, name: locNode.name, hex: { col, row } });
    }
  }
  return results;
}

/** Return nearest Guild location within radius hexes of ruinHex, or null. */
function findNearestGuild(
  ruinHex: { col: number; row: number },
  guildLocations: GuildLocationEntry[],
  radius: number,
): (GuildLocationEntry & { distance: number }) | null {
  let nearest: (GuildLocationEntry & { distance: number }) | null = null;
  for (const entry of guildLocations) {
    const dist = hexDistance(entry.hex, ruinHex);
    if (dist <= radius && (nearest === null || dist < nearest.distance)) {
      nearest = { ...entry, distance: dist };
    }
  }
  return nearest;
}

// ─── Event counter ────────────────────────────────────────────────────────────

let questHookEventCounter = 0;
function nextEventId(tick: number): string {
  return `evt_quest_hook_${tick}_${++questHookEventCounter}`;
}
export function resetQuestHookEventCounter(): void {
  questHookEventCounter = 0;
}

// ─── Phase ────────────────────────────────────────────────────────────────────

/**
 * Phase 6.655: Ruin Quest Hooks — Channel 6 of Narrative Gravity (THR-156).
 *
 * Runs every RUIN_QUEST_GENERATION_INTERVAL_TICKS ticks. For each ruin with
 * evidenceStrength ≥ CLUE_QUEST_THRESHOLD and a Guild hall within
 * GUILD_QUEST_RADIUS hexes, issues a quest hook toast and stamps the ruin
 * node with questHookPostedTick + questHookTemplateId. The faction quest
 * generation system reads these stamps to boost the matching template.
 */
export function phaseRuinQuestHooks(state: GameState): Partial<GameState> {
  const { graph, tick } = state;

  if (tick % RUIN_QUEST_GENERATION_INTERVAL_TICKS !== 0) return {};

  const events: TickEvent[] = [];

  try {
    const ruinNodes = graph.getNodesByType('location').filter(
      n => typeof n.properties.ruinMagnitude === 'number'
    );

    // Pre-collect Guild locations once — avoids repeated full-graph scans
    const guildLocations = findGuildLocations(graph);

    for (const ruinNode of ruinNodes) {
      try {
        const ruinProps = ruinNode.properties as Record<string, unknown>;
        const ruinMagnitude = ruinProps.ruinMagnitude as number;
        const sphereAlignment = (ruinProps.sphereAlignment as string | undefined) ?? '';

        // Duplicate prevention: skip if within cooldown window
        const lastHookTick = ruinProps.questHookPostedTick as number | undefined;
        if (lastHookTick != null && tick - lastHookTick < QUEST_HOOK_COOLDOWN_TICKS) continue;

        // Evidence check
        const evidenceStrength = getEvidenceStrength(ruinNode.id, graph);
        if (evidenceStrength < CLUE_QUEST_THRESHOLD) continue;

        // Hex location of the ruin
        const ruinCol = ruinProps.hexCol as number | undefined;
        const ruinRow = ruinProps.hexRow as number | undefined;
        if (ruinCol == null || ruinRow == null) continue;
        const ruinHex = { col: ruinCol, row: ruinRow };

        // Guild proximity check
        const nearestGuild = findNearestGuild(ruinHex, guildLocations, GUILD_QUEST_RADIUS);
        if (!nearestGuild) {
          emitTrace({
            category: 'ruins.quest_hook_suppressed',
            tick,
            ruinId: ruinNode.id,
            evidenceStrength,
            reason: 'no_guild_within_radius',
            radius: GUILD_QUEST_RADIUS,
            summary: `Quest hook suppressed for ${ruinNode.id} — no Guild within ${GUILD_QUEST_RADIUS} hexes`,
          });
          continue;
        }

        // Issue quest hook
        const templateId = selectQuestTemplateForRuin(ruinMagnitude);
        graph.updateNode(ruinNode.id, {
          properties: {
            ...ruinNode.properties,
            questHookPostedTick: tick,
            questHookTemplateId: templateId,
          },
        });

        const direction = hexDirection(nearestGuild.hex, ruinHex);
        const guildName = nearestGuild.name ?? 'The Adventurers Guild';
        const ruinName = ruinNode.name ?? 'the ruin';
        const message = buildQuestHookMessage(ruinName, direction, guildName, sphereAlignment);

        events.push({
          id: nextEventId(tick),
          tick,
          type: 'quest_hook_issued',
          message,
          significance: 0.7,
          notification: { channel: 'toast' as const },
          hexCoords: { col: ruinCol, row: ruinRow },
        });

        emitTrace({
          category: 'ruins.quest_hook_issued',
          tick,
          ruinId: ruinNode.id,
          ruinMagnitude,
          evidenceStrength,
          templateId,
          nearestGuildLocationId: nearestGuild.id,
          distanceHexes: nearestGuild.distance,
          summary: `Quest hook: ${ruinNode.name ?? ruinNode.id} → ${templateId} (evidence ${evidenceStrength.toFixed(2)}, guild ${nearestGuild.distance}h away)`,
        });

      } catch {
        // fail-soft: bad ruin node never crashes the phase
      }
    }
  } catch {
    // fail-soft: phase failure is non-fatal to the tick loop
  }

  return { tickEvents: [...state.tickEvents, ...events] };
}
