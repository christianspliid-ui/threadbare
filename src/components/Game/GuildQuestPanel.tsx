import { useMemo, useState } from 'react';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../../engine/graph';
import { hexDistance } from '../../lib/hexMath';
import { hexDirection } from '../../engine/ruins/questHooks';
import { SectionHeading } from '../shared/SectionHeading';
import { RARITY_TIER_COLORS } from '../../types/rarity';
import { FACTION_ENCOUNTER_TEMPLATES } from '../../data/faction-encounter-content';
import {
  GUILD_QUEST_RADIUS,
  QUEST_HOOK_COOLDOWN_TICKS,
  RUIN_MAGNITUDE_MINOR_MAX,
  RUIN_MAGNITUDE_MAJOR_MAX,
} from '../../engine/ruins/constants';

export interface GuildQuestPanelProps {
  location: GraphNode;
  graph: WorldGraph;
  tick: number;
  onNavigateToRuin: (locationId: string) => void;
}

type TierLabel = 'Minor' | 'Major' | 'Saga';

interface QuestRow {
  ruinId: string;
  questName: string;
  ruinName: string;
  direction: string;
  distance: number;
  tier: TierLabel;
  tierColor: string;
}

const TIER_ORDER: Record<TierLabel, number> = { Saga: 0, Major: 1, Minor: 2 };

function getTierLabel(magnitude: number): TierLabel {
  if (magnitude <= RUIN_MAGNITUDE_MINOR_MAX) return 'Minor';
  if (magnitude <= RUIN_MAGNITUDE_MAJOR_MAX) return 'Major';
  return 'Saga';
}

function getTierColor(tier: TierLabel): string {
  if (tier === 'Minor') return RARITY_TIER_COLORS[1];
  if (tier === 'Major') return RARITY_TIER_COLORS[3];
  return RARITY_TIER_COLORS[4];
}

function getQuestName(templateId: string | undefined): string {
  if (!templateId) return 'Expedition contract';
  return FACTION_ENCOUNTER_TEMPLATES.find(t => t.id === templateId)?.name ?? 'Expedition contract';
}

function safeNavigate(
  fn: (id: string) => void,
  id: string,
): void {
  try {
    fn(id);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[GuildQuestPanel] onNavigateToRuin threw:', err);
    }
  }
}

export function GuildQuestPanel({
  location,
  graph,
  tick,
  onNavigateToRuin,
}: GuildQuestPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const locProps = location.properties as Record<string, unknown>;
  const settlementCol = locProps.hexCol as number | undefined;
  const settlementRow = locProps.hexRow as number | undefined;

  const hasGuildHall = useMemo(() => {
    return graph.getOutgoingEdges(location.id, 'contains')
      .map(e => graph.getNode(e.target))
      .some(n => n?.properties?.factionDefId === 'adventuring_guild');
  }, [graph, location.id]);

  const rows = useMemo((): QuestRow[] => {
    if (settlementCol == null || settlementRow == null || !hasGuildHall) return [];

    const settlementHex = { col: settlementCol, row: settlementRow };
    const results: QuestRow[] = [];

    for (const ruin of graph.getNodesByType('location')) {
      const props = ruin.properties as Record<string, unknown>;
      if (typeof props.ruinMagnitude !== 'number') continue;

      const ruinCol = props.hexCol as number | undefined;
      const ruinRow = props.hexRow as number | undefined;
      if (ruinCol == null || ruinRow == null) continue;

      const ruinHex = { col: ruinCol, row: ruinRow };
      const dist = hexDistance(settlementHex, ruinHex);
      if (dist > GUILD_QUEST_RADIUS) continue;

      const postedTick = props.questHookPostedTick as number | undefined;
      if (postedTick == null || tick - postedTick >= QUEST_HOOK_COOLDOWN_TICKS) continue;

      const tier = getTierLabel(props.ruinMagnitude);
      results.push({
        ruinId: ruin.id,
        questName: getQuestName(props.questHookTemplateId as string | undefined),
        ruinName: ruin.name ?? 'the ruin',
        direction: hexDirection(settlementHex, ruinHex),
        distance: dist,
        tier,
        tierColor: getTierColor(tier),
      });
    }

    results.sort((a, b) => {
      const td = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
      return td !== 0 ? td : a.distance - b.distance;
    });

    return results;
  }, [graph, location.id, tick, settlementCol, settlementRow, hasGuildHall]);

  if (settlementCol == null || settlementRow == null) return null;
  if (!hasGuildHall) return null;

  return (
    <div className="mt-4" style={{ maxWidth: '820px' }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between gap-2 text-left focus:outline-none"
        aria-expanded={!collapsed}
      >
        <SectionHeading>Guild Postings</SectionHeading>
        <span
          aria-hidden="true"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            display: 'inline-block',
            transform: collapsed ? 'rotate(-90deg)' : 'none',
            transition: 'transform 150ms',
          }}
        >
          ▼
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-1 mt-2">
          {rows.length === 0 ? (
            <p
              className="italic"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}
            >
              The notice board is quiet. No contracts have been posted since the guild&apos;s last sweep.
            </p>
          ) : (
            rows.map(row => (
              <button
                key={row.ruinId}
                onClick={() => safeNavigate(onNavigateToRuin, row.ruinId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    safeNavigate(onNavigateToRuin, row.ruinId);
                  }
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-1"
                style={{ '--tw-ring-color': 'var(--accent-gold)', border: '1px solid var(--border-gold)' } as React.CSSProperties}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {row.questName}
                  </div>
                  <div className="truncate" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {row.ruinName} — {row.direction}, {row.distance} {row.distance === 1 ? 'hex' : 'hexes'} out
                  </div>
                </div>
                <span
                  className="flex-shrink-0 px-2 py-0.5 rounded text-white font-medium"
                  style={{ fontSize: 'var(--text-xs)', backgroundColor: row.tierColor, opacity: 0.85 }}
                >
                  {row.tier}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
