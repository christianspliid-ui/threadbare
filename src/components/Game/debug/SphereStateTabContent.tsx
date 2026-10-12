import React from 'react';
import type { SphereAggregate } from '../../../types/worldSoul';
import { SPHERE_ICONS } from '../../../data/sphereIcons';
import { SPHERE_TOOLTIPS } from '../../../data/sphereTooltips';
import { MAX_SPHERE_SCORE } from '../../../types/sphereAffinity';
import type { WorldGraph } from '../../../engine/graph';
import type { ControlEffect } from '../../../types/controlEffect';
import { buildTendingIndex, dominionOf, dominionPower, isTended, placeOf } from '../../../engine/dominion';
import { getLocationNodes } from '../../../engine/sublocationShape';
import { DOMINION_BANDS, DOMINION_BAND_WORDS, type DominionBand } from '../../../data/dominion-content';

const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  color: 'var(--text-primary)',
  opacity: 0.4,
  fontSize: 'var(--text-xs)',
};

const DETAIL_AREA_STYLE: React.CSSProperties = {
  padding: '12px',
  fontSize: 'var(--text-xs)',
  fontFamily: 'monospace',
  color: 'var(--text-primary)',
  lineHeight: 1.5,
};

const DETAIL_ROW_STYLE: React.CSSProperties = {
  marginBottom: '6px',
  display: 'flex',
  gap: '8px',
};

const DETAIL_LABEL_STYLE: React.CSSProperties = {
  color: 'var(--text-muted)',
  minWidth: '120px',
  fontWeight: 500,
};

const DETAIL_VALUE_STYLE: React.CSSProperties = {
  color: 'var(--text-primary)',
  flex: 1,
};

export interface SphereStateTabContentProps {
  aggregate?: SphereAggregate;
  /** THR-1748 — the live graph, for the Dominion row. */
  graph?: WorldGraph;
  /** THR-1748 — the node the panel is inspecting (the followed agent). */
  inspectedId?: string;
  /** THR-1748 — active controls, for who tends the inspected place. */
  controlEffects?: readonly ControlEffect[];
}

/** The god's id — the one ascendant actor (debug read; the panel has no state handle). */
function findAscendantId(graph: WorldGraph): string | undefined {
  return graph.getNodesByType('actor').find(n => n.properties.actorType === 'ascendant')?.id;
}

/**
 * THR-1748 — the Dominion row: the census over top-level places, and the inspected
 * node's band, match, power and who tends its place. Debug surface: numbers allowed.
 */
export function DominionDebugRow({ graph, inspectedId, controlEffects }: Pick<SphereStateTabContentProps, 'graph' | 'inspectedId' | 'controlEffects'>) {
  if (!graph) return null;
  const ascendantId = findAscendantId(graph);
  if (!ascendantId) return null;
  const census = Object.fromEntries(DOMINION_BANDS.map(b => [b, 0])) as Record<DominionBand, number>;
  for (const place of getLocationNodes(graph)) census[dominionOf(graph, ascendantId, place.id).band]++;
  const read = inspectedId ? dominionOf(graph, ascendantId, inspectedId) : null;
  const place = inspectedId ? placeOf(graph, inspectedId) : undefined;
  const placeRead = place ? dominionOf(graph, ascendantId, place.id) : null;
  const tendedBy = place
    ? isTended(buildTendingIndex(graph, ascendantId, controlEffects, id => dominionOf(graph, ascendantId, id).band), place.id)
    : null;
  return (
    <div data-testid="dominion-debug-row" style={{ marginBottom: '16px', padding: '10px', background: 'var(--bg-raised)', borderRadius: '4px' }}>
      <div style={{ ...DETAIL_ROW_STYLE, marginBottom: '4px' }}>
        <span style={DETAIL_LABEL_STYLE}>Dominion:</span>
        <span style={DETAIL_VALUE_STYLE} data-testid="dominion-census">
          {[...DOMINION_BANDS].reverse().map(b => `${DOMINION_BAND_WORDS[b]} ${census[b]}`).join(' · ')}
          {' '}| power {dominionPower(graph, ascendantId).toFixed(2)}
        </span>
      </div>
      {read && inspectedId && (
        <div style={{ ...DETAIL_ROW_STYLE, marginBottom: '4px' }}>
          <span style={DETAIL_LABEL_STYLE}>Inspected:</span>
          <span style={DETAIL_VALUE_STYLE} data-testid="dominion-inspected" data-band={read.band}>
            {graph.getNode(inspectedId)?.name ?? inspectedId} — {DOMINION_BAND_WORDS[read.band]}
            {' '}(match {read.reason.match.toFixed(2)}, {read.reason.kind} via {read.reason.readThrough})
          </span>
        </div>
      )}
      {place && placeRead && (
        <div style={{ ...DETAIL_ROW_STYLE, marginBottom: '4px' }}>
          <span style={DETAIL_LABEL_STYLE}>Its place:</span>
          <span style={DETAIL_VALUE_STYLE} data-testid="dominion-place" data-band={placeRead.band}>
            {place.name ?? place.id} — {DOMINION_BAND_WORDS[placeRead.band]}
            {' '}| tended by {tendedBy ? tendedBy.join(', ') : 'no one'}
          </span>
        </div>
      )}
    </div>
  );
}

export function SphereStateTabContent({ aggregate, graph, inspectedId, controlEffects }: SphereStateTabContentProps) {
  if (!aggregate) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No sphere aggregate yet. Run a tick to compute.
      </div>
    );
  }

  const spheres = Object.keys(SPHERE_ICONS) as Array<keyof typeof SPHERE_ICONS>;
  const sortedSpheres = [...spheres].sort(
    (a, b) => (aggregate.totalBySphere[b] ?? 0) - (aggregate.totalBySphere[a] ?? 0),
  );

  return (
    <div style={{ ...DETAIL_AREA_STYLE, padding: '16px' }}>
      <DominionDebugRow graph={graph} inspectedId={inspectedId} controlEffects={controlEffects} />
      <div style={{ marginBottom: '16px', padding: '10px', background: 'var(--bg-raised)', borderRadius: '4px' }}>
        <div style={{ ...DETAIL_ROW_STYLE, marginBottom: '4px' }}>
          <span style={DETAIL_LABEL_STYLE}>Dominant:</span>
          <span style={{
            ...DETAIL_VALUE_STYLE,
            color: aggregate.dominantSphere
              ? SPHERE_ICONS[aggregate.dominantSphere]?.color ?? DETAIL_VALUE_STYLE.color
              : DETAIL_VALUE_STYLE.color,
            fontWeight: 600,
          }}>
            {aggregate.dominantSphere ?? '—'}
          </span>
        </div>
        <div style={{ ...DETAIL_ROW_STYLE, marginBottom: '4px' }}>
          <span style={DETAIL_LABEL_STYLE}>Entity count:</span>
          <span style={DETAIL_VALUE_STYLE}>{aggregate.entityCount}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedSpheres.map(sphere => {
          const total = aggregate.totalBySphere[sphere] ?? 0;
          const avgScore = aggregate.entityCount > 0 ? total / aggregate.entityCount : 0;
          const color = SPHERE_ICONS[sphere]?.color ?? '#888';
          const tooltip = SPHERE_TOOLTIPS[sphere];
          const barPct = Math.min(100, (avgScore / MAX_SPHERE_SCORE) * 100);
          const isDominant = aggregate.dominantSphere === sphere;

          return (
            <div key={sphere} title={tooltip}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--text-xs)',
                  color,
                  fontWeight: isDominant ? 700 : 400,
                  textTransform: 'capitalize',
                }}>
                  {isDominant ? '★ ' : ''}{sphere}
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}>
                  total: {total} | avg: {avgScore.toFixed(2)}
                </span>
              </div>
              <div style={{
                height: '6px',
                background: 'var(--bg-raised)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${barPct}%`,
                  background: color,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                  opacity: isDominant ? 1 : 0.65,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
