/**
 * Essence Sources Debug Tab (THR-611 — Divine Economy, Slice 5).
 *
 * Inspectability surface over the divine-economy source substrate: every host
 * node carrying an `essenceSource` bag — latent (undiscovered, fog-hidden),
 * discovered, and controlled — with its kind, derived tier, sphere typing,
 * private sanctity, contested/desecrated state, and the ascendant's typed
 * per-sphere source income.
 *
 * Read-only view over live graph state. Numbers (sanctity, income) are shown
 * here because this is a debug surface — unlike the player-facing prose which
 * only ever shows the coarse tier (Dormant / Flowering / Contested / Desecrated,
 * THR-609). Mirrors the `__DEBUG.getEssenceSources()` bridge but also surfaces
 * *uncontrolled* sources (latent + discovered) so the whole economy is legible.
 */

import { useMemo } from 'react';
import type { WorldGraph } from '../../../engine/graph';
import type { NodeType } from '../../../types/graph';
import type { SourceKind, SourceTier } from '../../../types/essenceSource';
import { readEssenceSource, computeSourceIncome } from '../../../engine/essenceSources';
import { computeSanctitySustenance } from '../../../engine/essenceEconomyBridge';
import type { SanctitySustenance } from '../../../engine/essenceEconomyBridge';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

interface EssenceSourcesDebugTabProps {
  graph?: WorldGraph;
  currentTick: number;
}

/** Host node types that can carry an `essenceSource` bag (per the plan taxonomy;
 * sublocations are `location` nodes). Scanned read-only for the debug view. */
const SOURCE_HOST_TYPES: readonly NodeType[] = ['location', 'artifact', 'artifact_legendary'];

const TIER_COLOR: Record<SourceTier, string> = {
  dormant: '#8a8a94',
  flowering: '#7bc96f',
  contested: '#e0a95a',
  desecrated: '#e06c5a',
};

type SourceStatus = 'controlled' | 'discovered' | 'latent';

const STATUS_COLOR: Record<SourceStatus, string> = {
  controlled: '#d4af6a',
  discovered: '#5aa9e0',
  latent: '#6a6a72',
};

const STATUS_LABEL: Record<SourceStatus, string> = {
  controlled: 'Controlled',
  discovered: 'Discovered',
  latent: 'Latent',
};

// Controlled first, then discovered, then latent (most-actionable first).
const STATUS_RANK: Record<SourceStatus, number> = { controlled: 0, discovered: 1, latent: 2 };

interface SourceRow {
  id: string;
  name: string;
  kind: SourceKind;
  tier: SourceTier;
  sphere: string | null;
  sanctity: number;
  status: SourceStatus;
  contestedBy: string | null;
  desecrated: boolean;
  /** Essence-bridge read (THR-618): what the land under the source is doing to it. */
  sustenance: SanctitySustenance;
}

/** Colour by which way the land is pushing sanctity. */
const POLARITY_COLOR: Record<SanctitySustenance['polarity'], string> = {
  nurturing: '#7bc96f',
  withering: '#e06c5a',
  steady: '#8a8a94',
};

/**
 * One-line sustenance readout. A blocked bridge names *why* it is inert rather than
 * rendering a misleading neutral — the whole point of the debug surface is that a
 * source drawing nothing is distinguishable from a source drawing zero.
 */
function sustenanceLabel(s: SanctitySustenance): string {
  if (s.reason === 'untyped') return 'land: — (untyped source)';
  if (s.reason === 'no-host') return 'land: — (no economic host)';
  if (s.reason === 'no-matching-goods') return 'land: — (no goods of its sphere)';
  const goods = s.matchedResourceIds.join(', ');
  const drift = s.reason === 'ceiling' ? 'at nurture ceiling' : `${s.drift >= 0 ? '+' : ''}${s.drift.toFixed(3)}/tick`;
  return `land: ${s.polarity} (${goods}) ${drift}`;
}

export function EssenceSourcesDebugTab({ graph, currentTick }: EssenceSourcesDebugTabProps) {
  const { rows, income, counts, hasAscendant } = useMemo(() => {
    const rows: SourceRow[] = [];
    const counts = { controlled: 0, discovered: 0, latent: 0 };
    if (!graph) return { rows, income: {} as Partial<Record<string, number>>, counts, hasAscendant: false };

    const ascendant = graph
      .getNodesByType('actor')
      .find((n) => n.properties.actorType === 'ascendant');
    const controlledIds = new Set<string>(
      ascendant ? graph.getOutgoingEdges(ascendant.id, 'controls').map((e) => e.target) : [],
    );

    for (const type of SOURCE_HOST_TYPES) {
      for (const host of graph.getNodesByType(type)) {
        const src = readEssenceSource(host.properties);
        if (!src) continue;

        const status: SourceStatus = controlledIds.has(host.id)
          ? 'controlled'
          : src.discoveredBy
            ? 'discovered'
            : 'latent';
        counts[status]++;

        rows.push({
          id: host.id,
          name: host.name ?? host.id,
          kind: src.kind,
          tier: src.tier,
          sphere: src.sphereAffinity ?? null,
          sanctity: src.sanctity,
          status,
          contestedBy: src.contestedBy ?? null,
          desecrated: !!src.desecrated,
          sustenance: computeSanctitySustenance(graph, host.id, src),
        });
      }
    }

    rows.sort(
      (a, b) => (STATUS_RANK[a.status] - STATUS_RANK[b.status]) || a.name.localeCompare(b.name),
    );

    const income = ascendant ? computeSourceIncome(graph, ascendant.id) : {};
    return { rows, income, counts, hasAscendant: !!ascendant };
  }, [graph, currentTick]);

  if (!graph || !hasAscendant) {
    return <div style={EMPTY_STATE_STYLE}>No live game state.</div>;
  }

  if (rows.length === 0) {
    return <div style={EMPTY_STATE_STYLE}>No essence sources in the world yet.</div>;
  }

  const incomeEntries = Object.entries(income).filter(([, v]) => (v ?? 0) > 0);

  return (
    <div style={{ padding: '8px', fontSize: '12px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '8px', color: 'var(--text-tertiary)' }}>
        {rows.length} source{rows.length === 1 ? '' : 's'} —{' '}
        <span style={{ color: STATUS_COLOR.controlled }}>{counts.controlled} controlled</span>,{' '}
        <span style={{ color: STATUS_COLOR.discovered }}>{counts.discovered} discovered</span>,{' '}
        <span style={{ color: STATUS_COLOR.latent }}>{counts.latent} latent</span>
      </div>

      <div style={{ marginBottom: '10px', color: 'var(--text-tertiary)' }}>
        Typed source income:{' '}
        {incomeEntries.length === 0 ? (
          <span style={{ color: 'var(--text-quaternary, #6a6a72)' }}>none (no built, controlled sources)</span>
        ) : (
          incomeEntries
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
            .map(([sphere, v]) => `${sphere} +${(v ?? 0).toFixed(2)}/tick`)
            .join(' · ')
        )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.name}</span>
              <span
                style={{
                  color: STATUS_COLOR[row.status],
                  border: `1px solid ${STATUS_COLOR[row.status]}66`,
                  borderRadius: '4px',
                  padding: '1px 6px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                }}
              >
                {STATUS_LABEL[row.status]}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{row.kind}</span>
              <span
                style={{
                  color: TIER_COLOR[row.tier],
                  border: `1px solid ${TIER_COLOR[row.tier]}66`,
                  borderRadius: '4px',
                  padding: '1px 6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.tier}
              </span>
              <span style={{ color: 'var(--text-tertiary)' }}>
                {row.sphere ? `sphere: ${row.sphere}` : 'untyped'}
              </span>
              <span style={{ color: 'var(--text-tertiary)' }}>sanctity {row.sanctity.toFixed(2)}</span>
              {row.contestedBy && (
                <span style={{ color: TIER_COLOR.contested }}>contested by {row.contestedBy}</span>
              )}
              {row.desecrated && <span style={{ color: TIER_COLOR.desecrated }}>desecrated</span>}
            </div>
            <div
              style={{
                marginTop: '3px',
                color: row.sustenance.reason ? 'var(--text-quaternary, #6a6a72)' : POLARITY_COLOR[row.sustenance.polarity],
              }}
            >
              {sustenanceLabel(row.sustenance)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
