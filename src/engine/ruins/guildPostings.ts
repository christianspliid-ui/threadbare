/**
 * Guild postings at a settlement (THR-818 / THR-1026) — the ruin contracts its guild
 * hall's notice board carries.
 *
 * Moved from `GuildQuestPanel` (THR-1910, Inspector S2b) so the place page's
 * `guild_postings` row and the retiring panel read one source until S4 deletes the
 * panel (Law 27). Pure read of the graph; fail-soft (a settlement with no hex or no
 * hall reads `hasGuildHall: false`).
 */
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import { hexDistance } from '../../lib/hexMath';
import { hexDirection, locationPostsRuinQuestHooks } from './questHooks';
import {
  GUILD_QUEST_RADIUS,
  QUEST_HOOK_COOLDOWN_TICKS,
  RUIN_MAGNITUDE_MINOR_MAX,
  RUIN_MAGNITUDE_MAJOR_MAX,
  RUIN_QUEST_POSTING_FACTION_DEF_ID,
} from './constants';
import { FACTION_ENCOUNTER_TEMPLATES } from '../../data/faction-encounter-content';
import { getFactionDefinition } from '../../data/faction-definition-lookup';
import { GUILD_POSTING_LINES } from '../../data/subject-sheet-words';

export type PostingTier = 'Minor' | 'Major' | 'Saga';

export interface GuildPostingRow {
  ruinId: string;
  questName: string;
  ruinName: string;
  direction: string;
  distance: number;
  tier: PostingTier;
}

export interface GuildPostings {
  /** The settlement holds a faction hall whose faction resolves (the board exists). */
  hasGuildHall: boolean;
  /** The engine will ever stamp a ruin on this settlement's behalf (THR-1026). */
  postsRuinContracts: boolean;
  rows: GuildPostingRow[];
}

const TIER_ORDER: Record<PostingTier, number> = { Saga: 0, Major: 1, Minor: 2 };

/**
 * Sublocation markers that identify a faction's hall. `factionSeeding` writes
 * `sublocationTypeId`; older fixtures carry `locationSubtype`.
 */
const FACTION_HALL_SUBLOCATION_TYPE_ID = 'sublocation-type.faction-hall';
const FACTION_HALL_LOCATION_SUBTYPE = 'guild-hall';

/**
 * A guild hall is any faction hall whose owning faction resolves through
 * `getFactionDefinition` — not the adventuring guild alone (THR-818). A board here does
 * not mean a posting here (THR-1026): the empty state says which of the two silences it is.
 */
function isFactionHall(node: GraphNode | undefined): boolean {
  const props = node?.properties as Record<string, unknown> | undefined;
  if (!props) return false;
  const isHall =
    props.sublocationTypeId === FACTION_HALL_SUBLOCATION_TYPE_ID ||
    props.locationSubtype === FACTION_HALL_LOCATION_SUBTYPE;
  if (!isHall) return false;
  // The id lookup, not the static map (THR-1155 tripwire): a run-founded faction's hall counts too.
  return typeof props.factionDefId === 'string' && getFactionDefinition(props.factionDefId) != null;
}

/** The posting guild's display name, from its definition (one source for a name). */
export const ADVENTURING_GUILD_LABEL =
  getFactionDefinition(RUIN_QUEST_POSTING_FACTION_DEF_ID)?.nameTemplate ?? GUILD_POSTING_LINES.fallbackGuild;

export function postingTier(magnitude: number): PostingTier {
  if (magnitude <= RUIN_MAGNITUDE_MINOR_MAX) return 'Minor';
  if (magnitude <= RUIN_MAGNITUDE_MAJOR_MAX) return 'Major';
  return 'Saga';
}

function questName(templateId: string | undefined): string {
  if (!templateId) return GUILD_POSTING_LINES.contract;
  return FACTION_ENCOUNTER_TEMPLATES.find(t => t.id === templateId)?.name ?? GUILD_POSTING_LINES.contract;
}

export function selectGuildPostings(graph: WorldGraph, locationId: string, tick: number): GuildPostings {
  const location = graph.getNode(locationId);
  const props = (location?.properties ?? {}) as Record<string, unknown>;
  const col = props.hexCol as number | undefined;
  const row = props.hexRow as number | undefined;
  const hasGuildHall = graph.getOutgoingEdges(locationId, 'contains').map(e => graph.getNode(e.target)).some(isFactionHall);
  const postsRuinContracts = location ? locationPostsRuinQuestHooks(graph, locationId) : false;
  if (col == null || row == null || !hasGuildHall) return { hasGuildHall: hasGuildHall && col != null && row != null, postsRuinContracts, rows: [] };

  const settlementHex = { col, row };
  const rows: GuildPostingRow[] = [];
  for (const ruin of graph.getNodesByType('location')) {
    const rp = ruin.properties as Record<string, unknown>;
    if (typeof rp.ruinMagnitude !== 'number') continue;
    const rc = rp.hexCol as number | undefined;
    const rr = rp.hexRow as number | undefined;
    if (rc == null || rr == null) continue;
    const ruinHex = { col: rc, row: rr };
    const dist = hexDistance(settlementHex, ruinHex);
    if (dist > GUILD_QUEST_RADIUS) continue;
    const postedTick = rp.questHookPostedTick as number | undefined;
    if (postedTick == null || tick - postedTick >= QUEST_HOOK_COOLDOWN_TICKS) continue;
    rows.push({
      ruinId: ruin.id,
      questName: questName(rp.questHookTemplateId as string | undefined),
      ruinName: ruin.name ?? 'the ruin',
      direction: hexDirection(settlementHex, ruinHex),
      distance: dist,
      tier: postingTier(rp.ruinMagnitude),
    });
  }
  rows.sort((a, b) => (TIER_ORDER[a.tier] - TIER_ORDER[b.tier]) || a.distance - b.distance);
  return { hasGuildHall: true, postsRuinContracts, rows };
}
