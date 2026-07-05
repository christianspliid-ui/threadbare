/**
 * Economy Debug Tab (THR-615) — inspects the mortal economy: per-location
 * resource stock tiers, aggregate resource balance, and monopoly state.
 *
 * Read-only view over live graph state. Numbers are shown here (debug surface),
 * unlike the player-facing Livelihood line which is prose-only.
 */

import { useMemo } from 'react';
import type { WorldGraph } from '../../../engine/graph';
import type { ResourceInstance, StockTier } from '../../../types/resource';
import { getResourceClass } from '../../../data/resource-classes';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

interface EconomyDebugTabProps {
  graph?: WorldGraph;
  currentTick: number;
}

const TIER_COLOR: Record<StockTier, string> = {
  scarce: '#e06c5a',
  adequate: '#8a8a94',
  surplus: '#5aa9e0',
};

interface LocRow {
  id: string;
  name: string;
  balance: number;
  resources: { id: string; tier: StockTier; quantity: number; category: string }[];
  monopolyResource?: string;
  monopolyBy?: string;
}

export function EconomyDebugTab({ graph, currentTick }: EconomyDebugTabProps) {
  const { rows, dist } = useMemo(() => {
    const dist: Record<StockTier, number> = { scarce: 0, adequate: 0, surplus: 0 };
    const rows: LocRow[] = [];
    if (!graph) return { rows, dist };

    for (const loc of graph.getNodesByType('location')) {
      const props = loc.properties as Record<string, unknown>;
      const resources = (props.resources ?? {}) as Record<string, ResourceInstance>;
      const ids = Object.keys(resources);
      if (ids.length === 0) continue;

      const resourceRows = ids
        .map((id) => {
          const r = resources[id];
          const tier = (r.stockTier ?? 'adequate') as StockTier;
          dist[tier]++;
          return { id, tier, quantity: r.quantity ?? 0, category: getResourceClass(id).category };
        })
        .sort((a, b) => a.id.localeCompare(b.id));

      rows.push({
        id: loc.id,
        name: loc.name,
        balance: typeof props.resourceBalance === 'number' ? props.resourceBalance : 0,
        resources: resourceRows,
        monopolyResource: typeof props.monopolyResource === 'string' ? props.monopolyResource : undefined,
        monopolyBy: typeof props.monopolyControlledBy === 'string' ? props.monopolyControlledBy : undefined,
      });
    }

    // Most-scarce first (lowest balance), then by name.
    rows.sort((a, b) => (a.balance - b.balance) || a.name.localeCompare(b.name));
    return { rows, dist };
  }, [graph, currentTick]);

  if (rows.length === 0) {
    return <div style={EMPTY_STATE_STYLE}>No locations with resources yet.</div>;
  }

  return (
    <div style={{ padding: '8px', fontSize: '12px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '10px', color: 'var(--text-tertiary)' }}>
        Stock tiers across {rows.length} locations —{' '}
        <span style={{ color: TIER_COLOR.scarce }}>{dist.scarce} scarce</span>,{' '}
        <span style={{ color: TIER_COLOR.adequate }}>{dist.adequate} adequate</span>,{' '}
        <span style={{ color: TIER_COLOR.surplus }}>{dist.surplus} surplus</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map((row) => (
          <div
            key={row.id}
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '6px 8px',
              backgroundColor: 'var(--bg-raised)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.name}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>
                balance {row.balance.toFixed(2)}
                {row.monopolyResource ? ` · monopoly: ${row.monopolyResource}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {row.resources.map((r) => (
                <span
                  key={r.id}
                  title={`${r.category} · quantity ${r.quantity}`}
                  style={{
                    color: TIER_COLOR[r.tier],
                    border: `1px solid ${TIER_COLOR[r.tier]}66`,
                    borderRadius: '4px',
                    padding: '1px 6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.id} · {r.tier}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
