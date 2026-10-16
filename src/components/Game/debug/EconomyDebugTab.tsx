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
import { readPurseDay, readMeansBand } from '../../../engine/factionPurse';
import { totalIncome } from '../../../engine/factionPurse/income';

interface PurseRow {
  id: string;
  name: string;
  wealth: number;
  means: string;
  income: Record<string, number>;
  total: number;
  upkeepOwed: number;
  upkeepPaid: number;
  unpaid: number;
  brokeSince: number | null;
}

/** THR-1931 — every faction the purse has reached, richest first. Numbers are fine here (debug). */
function PursesTable({ graph, currentTick }: { graph?: WorldGraph; currentTick: number }) {
  const rows = useMemo<PurseRow[]>(() => {
    if (!graph) return [];
    const out: PurseRow[] = [];
    for (const n of graph.getNodesByType('actor')) {
      if (n.properties.actorType !== 'faction') continue;
      const means = readMeansBand(n);
      if (!means) continue;
      const day = readPurseDay(n);
      out.push({
        id: n.id,
        name: n.name ?? n.id,
        wealth: typeof n.properties.wealth === 'number' ? n.properties.wealth : 0,
        means,
        income: day ? { ...day.income } : {},
        total: day ? totalIncome(day.income) : 0,
        upkeepOwed: day?.upkeepOwed ?? 0,
        upkeepPaid: day?.upkeepPaid ?? 0,
        unpaid: day?.armiesUnpaid.length ?? 0,
        brokeSince: day?.brokeSinceTick ?? null,
      });
    }
    return out.sort((a, b) => b.wealth - a.wealth || a.id.localeCompare(b.id));
  }, [graph, currentTick]);
  if (rows.length === 0) return null;
  const cell = { padding: '2px 6px', whiteSpace: 'nowrap' as const, textAlign: 'right' as const };
  return (
    <div data-testid="economy-purses" style={{ marginBottom: '12px' }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Purses — {rows.length} factions</div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ color: 'var(--text-tertiary)' }}>
            <th style={{ ...cell, textAlign: 'left' }}>faction</th><th style={cell}>wealth</th><th style={{ ...cell, textAlign: 'left' }}>means</th>
            <th style={cell}>tax</th><th style={cell}>yield</th><th style={cell}>rent</th><th style={cell}>tolls</th><th style={cell}>guild</th><th style={cell}>cut in/out</th>
            <th style={cell}>upkeep paid/owed</th><th style={cell}>unpaid</th><th style={cell}>broke since</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ color: r.unpaid > 0 ? '#e06c5a' : 'var(--text-secondary)' }}>
              <td style={{ ...cell, textAlign: 'left' }} title={r.id}>{r.name}</td>
              <td style={cell}>{r.wealth.toFixed(1)}</td>
              <td style={{ ...cell, textAlign: 'left' }}>{r.means}</td>
              <td style={cell}>{(r.income.townTax ?? 0).toFixed(2)}</td>
              <td style={cell}>{(r.income.placeYield ?? 0).toFixed(2)}</td>
              <td style={cell}>{(r.income.landRent ?? 0).toFixed(2)}</td>
              <td style={cell}>{(r.income.tolls ?? 0).toFixed(2)}</td>
              <td style={cell}>{(r.income.guildWork ?? 0).toFixed(2)}</td>
              <td style={cell}>{(r.income.guildTaxIn ?? 0).toFixed(2)}/{(r.income.guildTaxOut ?? 0).toFixed(2)}</td>
              <td style={cell}>{r.upkeepPaid.toFixed(1)}/{r.upkeepOwed.toFixed(1)}</td>
              <td style={cell}>{r.unpaid}</td>
              <td style={cell}>{r.brokeSince ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
    return (
      <div style={{ padding: '8px', fontSize: '12px', overflowY: 'auto', height: '100%' }}>
        <PursesTable graph={graph} currentTick={currentTick} />
        <div style={EMPTY_STATE_STYLE}>No locations with resources yet.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px', fontSize: '12px', overflowY: 'auto', height: '100%' }}>
      <PursesTable graph={graph} currentTick={currentTick} />
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
