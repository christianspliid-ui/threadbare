import { useMemo, useState } from 'react';
import type { GraphNode } from '../../types/graph';
import { selectGuildPostings, ADVENTURING_GUILD_LABEL, type PostingTier } from '../../engine/ruins/guildPostings';
import type { WorldGraph } from '../../engine/graph';
import { SectionHeading } from '../shared/SectionHeading';
import { Tooltip } from '../shared/Tooltip';
import { RUIN_QUEST_POSTING_FACTION_DEF_ID } from '../../engine/ruins/constants';
import { RARITY_TIER_COLORS } from '../../types/rarity';

export interface GuildQuestPanelProps {
  location: GraphNode;
  graph: WorldGraph;
  tick: number;
  onNavigateToRuin: (locationId: string) => void;
}

type TierLabel = PostingTier;

// THR-1910: the postings are read in the engine (`selectGuildPostings`), so the place
// page's `guild_postings` row and this panel read one source until S4 deletes the panel.

function getTierColor(tier: TierLabel): string {
  if (tier === 'Minor') return RARITY_TIER_COLORS[1];
  if (tier === 'Major') return RARITY_TIER_COLORS[3];
  return RARITY_TIER_COLORS[4];
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

  const postings = useMemo(
    () => selectGuildPostings(graph, location.id, tick),
    [graph, location.id, tick],
  );
  const { hasGuildHall, postsRuinContracts } = postings;
  const rows = postings.rows.map(r => ({ ...r, tierColor: getTierColor(r.tier) }));

  if (settlementCol == null || settlementRow == null) return null;
  if (!hasGuildHall) return null;

  return (
    <div className="mt-4" style={{ maxWidth: '820px' }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between gap-2 text-left focus:outline-none"
        aria-expanded={!collapsed}
      >
        <SectionHeading>Guild postings</SectionHeading>
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
              {postsRuinContracts ? (
                <>The notice board is quiet. No contracts have been posted since the guild&apos;s last sweep.</>
              ) : (
                <>
                  This board posts no ruin contracts — delves are{' '}
                  <Tooltip
                    id={`faction.${RUIN_QUEST_POSTING_FACTION_DEF_ID}`}
                    label={ADVENTURING_GUILD_LABEL}
                  >
                    {ADVENTURING_GUILD_LABEL}
                  </Tooltip>
                  &apos;s trade.
                </>
              )}
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
