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
import { PURSE_CYCLE_TICKS } from '../../../data/faction-purse-constants';
import { describeAllUnrest } from '../../../engine/unrestPressure/describe';
import { listPrayers, PRAYER_SLIGHTED_UNTIL_PROP } from '../../../engine/prayers';
import { TICKS_PER_DAY } from '../../../data/attention-constants';
import { describeDeciderMeans } from '../../../engine/mortalMeans';
import { resolveAxiologicalProfile } from '../../../engine/encounterScoring';
import { allOathEdges, readOath, isCrown, vassalsOf, crownRulerOf, isRealmFaction } from '../../../engine/crown/crownView';
import { allRegionalMonopolies, allActiveEmbargoes } from '../../../engine/regionalMonopoly';
import { readLaneHolders } from '../../../engine/undertakingEconomy';

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
  /** THR-1932 — fealty paid in from vassals / out to a liege on the last pay day. */
  fealtyIn: number;
  fealtyOut: number;
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
        fealtyIn: day?.fealtyIn ?? 0,
        fealtyOut: day?.fealtyOut ?? 0,
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
            <th style={cell}>upkeep paid/owed</th><th style={cell}>unpaid</th><th style={cell}>broke since</th><th style={cell}>fealty in/out</th>
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
              <td style={cell}>{r.fealtyIn.toFixed(2)}/{r.fealtyOut.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** THR-1952 — every decider's Means, band, last reason and want, poorest first. Numbers are fine here (debug). */
function MeansTable({ graph, currentTick }: { graph?: WorldGraph; currentTick: number }) {
  // The board's resolved profile (divine overlay included) so the want shown is the want applied.
  // The World-Soul fundament is not in this tab's props, so its drift is not folded in here.
  const rows = useMemo(() => (graph
    ? describeDeciderMeans(graph, id => resolveAxiologicalProfile(graph, id, currentTick) as Partial<Record<string, number>>)
    : []), [graph, currentTick]);
  if (rows.length === 0) return null;
  const cell = { padding: '2px 6px', whiteSpace: 'nowrap' as const, textAlign: 'right' as const };
  const pulled = rows.filter(r => (r.want ?? 0) > 0).length;
  return (
    <div data-testid="economy-means" style={{ marginBottom: '12px' }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>
        Means — {rows.length} deciders, {rows.filter(r => r.band === 'Destitute').length} destitute, {pulled} pulled toward paying work
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ color: 'var(--text-tertiary)' }}>
            <th style={{ ...cell, textAlign: 'left' }}>decider</th><th style={cell}>wealth</th><th style={{ ...cell, textAlign: 'left' }}>band</th>
            <th style={{ ...cell, textAlign: 'left' }}>last reason</th><th style={cell}>want</th><th style={cell}>multiplier</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.agentId} style={{ color: 'var(--text-secondary)' }}>
              <td style={{ ...cell, textAlign: 'left' }} title={r.agentId}>{r.name}</td>
              <td style={cell}>{r.wealth.toFixed(1)}</td>
              <td style={{ ...cell, textAlign: 'left' }}>{r.band}</td>
              <td style={{ ...cell, textAlign: 'left' }}>{r.lastReason ?? '—'}</td>
              <td style={cell}>{r.want === null ? '—' : r.want.toFixed(2)}</td>
              <td style={cell}>{r.multiplier === null ? '—' : r.multiplier.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** THR-1934 — every settlement's unrest pressure: number, target, inputs, hunger, band, leave. */
function UnrestTable({ graph, currentTick }: { graph?: WorldGraph; currentTick: number }) {
  const rows = useMemo(() => (graph ? describeAllUnrest(graph) : []), [graph, currentTick]);
  if (rows.length === 0) return null;
  const cell = { padding: '2px 6px', whiteSpace: 'nowrap' as const, textAlign: 'right' as const };
  const f = (n: number) => n.toFixed(1);
  return (
    <div data-testid="economy-unrest" style={{ marginBottom: '12px' }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>
        Unrest — {rows.length} settlements, {rows.filter(r => r.chips.restless).length} restless, {rows.filter(r => r.chips.lawless).length} lawless, {rows.filter(r => r.chips.onTheEdge).length} on the edge
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ color: 'var(--text-tertiary)' }}>
            <th style={{ ...cell, textAlign: 'left' }}>settlement</th><th style={cell}>unrest</th><th style={cell}>target</th>
            <th style={cell}>hunger</th><th style={cell}>poverty</th><th style={cell}>siege</th><th style={cell}>sick</th><th style={cell}>dead</th><th style={cell}>content</th>
            <th style={cell}>hungry d</th><th style={{ ...cell, textAlign: 'left' }}>band</th><th style={cell}>restless d</th><th style={{ ...cell, textAlign: 'left' }}>last leave to</th><th style={cell}>turned t</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.locationId} title={r.fortunes ?? ''} style={{ color: r.chips.onTheEdge ? '#c0392b' : r.chips.lawless ? '#e06c5a' : r.chips.restless ? '#d4a24a' : 'var(--text-secondary)' }}>
              <td style={{ ...cell, textAlign: 'left' }} title={r.locationId}>{r.locationName}</td>
              <td style={cell}>{f(r.unrest)}</td>
              <td style={cell}>{r.target === null ? '—' : f(r.target)}</td>
              <td style={cell}>{f(r.inputs?.hunger ?? 0)}</td>
              <td style={cell}>{f(r.inputs?.poverty ?? 0)}</td>
              <td style={cell}>{f(r.inputs?.siege ?? 0)}</td>
              <td style={cell}>{f(r.inputs?.sickness ?? 0)}</td>
              <td style={cell}>{f(r.inputs?.deathSite ?? 0)}</td>
              <td style={cell}>{f(r.inputs?.contentment ?? 0)}</td>
              <td style={cell}>{r.hungerDays}</td>
              <td style={{ ...cell, textAlign: 'left' }}>{r.band}</td>
              <td style={cell}>{r.restlessDays}</td>
              <td style={{ ...cell, textAlign: 'left' }}>{r.leaveTo ?? '—'}</td>
              <td style={cell}>{r.lastTurnTick ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** THR-1935 — every prayer this run: town, status, days left, slighted until. Numbers are fine here (debug). */
function PrayersTable({ graph, currentTick }: { graph?: WorldGraph; currentTick: number }) {
  const rows = useMemo(() => (graph ? listPrayers(graph) : []), [graph, currentTick]);
  if (!graph || rows.length === 0) return null;
  const cell = { padding: '2px 6px', whiteSpace: 'nowrap' as const, textAlign: 'right' as const };
  return (
    <div data-testid="economy-prayers" style={{ marginBottom: '12px' }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>
        Prayers — {rows.length} opened, {rows.filter(r => r.status === 'open').length} open, {rows.filter(r => r.status === 'recovered').length} recovered
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ color: 'var(--text-tertiary)' }}>
            <th style={{ ...cell, textAlign: 'left' }}>town</th><th style={{ ...cell, textAlign: 'left' }}>status</th>
            <th style={cell}>opened</th><th style={cell}>days left</th><th style={cell}>answered</th><th style={cell}>slighted until</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const town = graph.getNode(r.townId);
            const slighted = town?.properties?.[PRAYER_SLIGHTED_UNTIL_PROP];
            return (
              <tr key={r.eventId} style={{ color: r.status === 'open' ? '#d4a24a' : 'var(--text-secondary)' }}>
                <td style={{ ...cell, textAlign: 'left' }} title={r.townId}>{town?.name ?? r.townId}</td>
                <td style={{ ...cell, textAlign: 'left' }}>{r.status}</td>
                <td style={cell}>{r.openedTick}</td>
                <td style={cell}>{r.status === 'open' ? ((r.closesTick - currentTick) / TICKS_PER_DAY).toFixed(1) : '—'}</td>
                <td style={cell}>{r.answeredTick ?? '—'}</td>
                <td style={cell}>{typeof slighted === 'number' && slighted > currentTick ? slighted : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** THR-1932 — every live oath and every realm's crown row. Numbers are fine here (debug). */
function OathsTable({ graph, currentTick }: { graph?: WorldGraph; currentTick: number }) {
  const { oaths, crowns } = useMemo(() => {
    if (!graph) return { oaths: [], crowns: [] };
    const name = (id: string) => graph.getNode(id)?.name ?? id;
    const oaths = allOathEdges(graph).map(e => {
      const p = readOath(e);
      return {
        id: e.id,
        vassal: name(e.source),
        liege: name(e.target),
        kind: p.kind + (p.forcedBy ? ` (${p.forcedBy})` : ''),
        swornDay: Math.floor((p.swornTick ?? 0) / PURSE_CYCLE_TICKS),
        loyalty: p.loyalty ?? 0,
        deltas: (p.lastLoyaltyDay?.deltas ?? []).map(d => `${d.reason} ${d.amount > 0 ? '+' : ''}${d.amount.toFixed(3)}`).join(', ') || '—',
        tax: p.taxPaidToday ?? 0,
        // THR-1974 — wages the liege paid today, and the vassal's armies it covered / left unpaid.
        wages: p.wagesPaidToday ?? 0,
        armies: (() => {
          const d = readPurseDay(graph.getNode(e.source));
          if (!d) return '—';
          const covered = d.armiesPaidByLiege?.length ?? 0;
          return `${covered} / ${Math.max(0, (d.armiesUnpaid?.length ?? 0) - covered)}`;
        })(),
      };
    });
    const crowns = graph.getNodesByType('actor')
      .filter(n => isRealmFaction(n))
      .map(n => ({
        id: n.id,
        name: n.name ?? n.id,
        oaths: vassalsOf(graph, n.id).length,
        crown: isCrown(graph, n.id),
        ruler: (() => { const r = crownRulerOf(graph, n.id); return r ? name(r) : '—'; })(),
      }))
      .sort((a, b) => b.oaths - a.oaths || a.id.localeCompare(b.id));
    return { oaths, crowns };
  }, [graph, currentTick]);
  if (crowns.length === 0) return null;
  const cell = { padding: '2px 6px', whiteSpace: 'nowrap' as const, textAlign: 'right' as const };
  return (
    <div data-testid="economy-oaths" style={{ marginBottom: '12px' }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Crowns — {crowns.filter(c => c.crown).length} of {crowns.length} realms</div>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '6px' }}>
        <thead>
          <tr style={{ color: 'var(--text-tertiary)' }}>
            <th style={{ ...cell, textAlign: 'left' }}>realm</th><th style={cell}>oaths held</th><th style={cell}>crown</th><th style={{ ...cell, textAlign: 'left' }}>ruler</th>
          </tr>
        </thead>
        <tbody>
          {crowns.map(c => (
            <tr key={c.id} style={{ color: c.crown ? 'var(--accent-gold, #d4af37)' : 'var(--text-secondary)' }}>
              <td style={{ ...cell, textAlign: 'left' }} title={c.id}>{c.name}</td>
              <td style={cell}>{c.oaths}</td>
              <td style={cell}>{c.crown ? 'yes' : '—'}</td>
              <td style={{ ...cell, textAlign: 'left' }}>{c.ruler}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Oaths — {oaths.length}</div>
      {oaths.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ color: 'var(--text-tertiary)' }}>
              <th style={{ ...cell, textAlign: 'left' }}>vassal</th><th style={{ ...cell, textAlign: 'left' }}>liege</th><th style={{ ...cell, textAlign: 'left' }}>kind</th>
              <th style={cell}>sworn day</th><th style={cell}>loyalty</th><th style={{ ...cell, textAlign: 'left' }}>today</th><th style={cell}>tax today</th>
              <th style={cell}>wages today</th><th style={cell}>armies covered / uncovered</th>
            </tr>
          </thead>
          <tbody>
            {oaths.map(o => (
              <tr key={o.id} style={{ color: o.loyalty < 0.4 ? '#e06c5a' : 'var(--text-secondary)' }}>
                <td style={{ ...cell, textAlign: 'left' }}>{o.vassal}</td>
                <td style={{ ...cell, textAlign: 'left' }}>{o.liege}</td>
                <td style={{ ...cell, textAlign: 'left' }}>{o.kind}</td>
                <td style={cell}>{o.swornDay}</td>
                <td style={cell}>{o.loyalty.toFixed(2)}</td>
                <td style={{ ...cell, textAlign: 'left' }}>{o.deltas}</td>
                <td style={cell}>{o.tax.toFixed(2)}</td>
                <td style={cell}>{o.wages.toFixed(2)}</td>
                <td style={cell}>{o.armies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/**
 * THR-1955 — regional monopolies (holder, good, anchor, share, places) and standing embargoes.
 * The embargoed towns and roads are left to `__DEBUG.getRegionalMonopolies()`: deriving them
 * needs the realm border map, which this tab does not hold.
 */
/** THR-1937 — lanes with a toll holder or a founder: who tolls it, who founded it. */
function LanesTable({ graph, currentTick }: { graph?: WorldGraph; currentTick: number }) {
  const rows = useMemo(() => {
    if (!graph) return [];
    const name = (id: string | null) => (id ? graph.getNode(id)?.name ?? id : '—');
    const out: { id: string; from: string; to: string; volume: number; tolledBy: string; foundedBy: string }[] = [];
    for (const e of graph.getEdgesByType('trades_with')) {
      const holders = readLaneHolders(graph, e.id);
      if (!holders || (!holders.controlledBy && !holders.founderId)) continue;
      out.push({
        id: e.id,
        from: name(e.source),
        to: name(e.target),
        volume: typeof e.properties?.volume === 'number' ? e.properties.volume : 0,
        tolledBy: name(holders.controlledBy),
        foundedBy: name(holders.founderId),
      });
    }
    return out.sort((a, b) => a.id.localeCompare(b.id));
  }, [graph, currentTick]);
  if (rows.length === 0) return null;
  const cell = { padding: '2px 6px', whiteSpace: 'nowrap' as const, textAlign: 'right' as const };
  const left = { ...cell, textAlign: 'left' as const };
  return (
    <div data-testid="economy-lanes" style={{ marginBottom: '12px' }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Held lanes — {rows.length}</div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ color: 'var(--text-tertiary)' }}>
            <th style={left}>from</th><th style={left}>to</th><th style={cell}>volume</th><th style={left}>tolled by</th><th style={left}>founded by</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ color: 'var(--text-secondary)' }}>
              <td style={left}>{r.from}</td><td style={left}>{r.to}</td><td style={cell}>{r.volume}</td>
              <td style={left}>{r.tolledBy}</td><td style={left}>{r.foundedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonopoliesTable({ graph, currentTick }: { graph?: WorldGraph; currentTick: number }) {
  const { monopolies, embargoes } = useMemo(() => {
    if (!graph) return { monopolies: [], embargoes: [] };
    const name = (id: string) => graph.getNode(id)?.name ?? id;
    return {
      monopolies: allRegionalMonopolies(graph).map(({ factionId, monopoly: m }) => ({
        key: [factionId, m.resourceId, m.anchorLocationId].join("|"),
        holder: name(factionId),
        good: m.resourceId,
        anchor: name(m.anchorLocationId),
        share: m.share,
        places: m.placeIds.length,
        sinceDay: Math.floor((m.sinceTick ?? 0) / TICKS_PER_DAY),
      })),
      embargoes: allActiveEmbargoes(graph).map(({ holderId, record }) => ({
        key: [holderId, record.untilTick].join("|"),
        holder: name(holderId),
        target: name(record.targetFactionId),
        good: record.resourceId,
        anchor: name(record.anchorLocationId),
        untilDay: Math.floor(record.untilTick / TICKS_PER_DAY),
      })),
    };
  }, [graph, currentTick]);
  if (monopolies.length === 0 && embargoes.length === 0) return null;
  const cell = { padding: '2px 6px', whiteSpace: 'nowrap' as const, textAlign: 'right' as const };
  const left = { ...cell, textAlign: 'left' as const };
  return (
    <div data-testid="economy-monopolies" style={{ marginBottom: '12px' }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Regional monopolies — {monopolies.length}</div>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '6px' }}>
        <thead>
          <tr style={{ color: 'var(--text-tertiary)' }}>
            <th style={left}>holder</th><th style={left}>good</th><th style={left}>anchor</th><th style={cell}>share</th><th style={cell}>places</th><th style={cell}>since day</th>
          </tr>
        </thead>
        <tbody>
          {monopolies.map(m => (
            <tr key={m.key} style={{ color: 'var(--text-secondary)' }}>
              <td style={left}>{m.holder}</td><td style={left}>{m.good}</td><td style={left}>{m.anchor}</td>
              <td style={cell}>{m.share.toFixed(2)}</td><td style={cell}>{m.places}</td><td style={cell}>{m.sinceDay}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {embargoes.length > 0 && (
        <>
          <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Embargoes — {embargoes.length}</div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ color: 'var(--text-tertiary)' }}>
                <th style={left}>holder</th><th style={left}>target</th><th style={left}>good</th><th style={left}>anchor</th><th style={cell}>until day</th>
              </tr>
            </thead>
            <tbody>
              {embargoes.map(e => (
                <tr key={e.key} style={{ color: '#e06c5a' }}>
                  <td style={left}>{e.holder}</td><td style={left}>{e.target}</td><td style={left}>{e.good}</td><td style={left}>{e.anchor}</td>
                  <td style={cell}>{e.untilDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
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
        <MeansTable graph={graph} currentTick={currentTick} />
        <OathsTable graph={graph} currentTick={currentTick} />
        <MonopoliesTable graph={graph} currentTick={currentTick} />
        <LanesTable graph={graph} currentTick={currentTick} />
        <UnrestTable graph={graph} currentTick={currentTick} />
        <PrayersTable graph={graph} currentTick={currentTick} />
        <div style={EMPTY_STATE_STYLE}>No locations with resources yet.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px', fontSize: '12px', overflowY: 'auto', height: '100%' }}>
      <PursesTable graph={graph} currentTick={currentTick} />
      <MeansTable graph={graph} currentTick={currentTick} />
      <OathsTable graph={graph} currentTick={currentTick} />
      <MonopoliesTable graph={graph} currentTick={currentTick} />
      <LanesTable graph={graph} currentTick={currentTick} />
      <UnrestTable graph={graph} currentTick={currentTick} />
        <PrayersTable graph={graph} currentTick={currentTick} />
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
