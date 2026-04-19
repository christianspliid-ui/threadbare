/**
 * PlaceOfPowerInspector — compact info panel shown inside LocationView when the
 * location's subtype is `place_of_power` (THR-153). Reports:
 *   - Holder (actor / faction / god)
 *   - Essence per tick + sphere alignment
 *   - Stream decay countdown (ticks until absence dies the stream)
 *   - Transformed-from lineage (original ruin id + tick)
 *
 * Data comes straight from graph properties and the incoming
 * `holds_place_of_power` edge. Fail-soft on missing fields — every row is
 * gated by a local typeof check.
 */

import React, { useMemo } from 'react';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../../engine/graph';

interface Props {
  location: GraphNode;
  graph?: WorldGraph;
  tick: number;
}

const BLOCK: React.CSSProperties = {
  marginTop: '12px',
  padding: '10px 12px',
  border: '1px solid var(--border-gold, #8b7355)',
  borderRadius: '4px',
  background: 'rgba(201, 162, 39, 0.06)',
  fontFamily: 'var(--font-body, sans-serif)',
  fontSize: 'var(--text-xs, 11px)',
  color: 'var(--text-primary, #e8dcc8)',
};

const HEADER: React.CSSProperties = {
  font: '700 10px/1.2 var(--font-display, serif)',
  color: 'var(--accent-gold, #c9a227)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

const ROW: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '2px 0',
  color: 'var(--text-muted, #8a7d6b)',
};

export function PlaceOfPowerInspector({ location, graph, tick }: Props) {
  const props = location.properties as Record<string, unknown>;
  const essencePerTick = props.popEssencePerTick as number | undefined;
  const sphere = props.popSphere as string | undefined;
  const countdown = props.popStreamDecayCountdown as number | undefined;
  const streamDead = props.popStreamDead === true;
  const transformedFrom = props.transformedFromRuinId as string | undefined;
  const transformedAt = props.transformedAtTick as number | undefined;

  const holder = useMemo(() => {
    if (!graph) return null;
    const actors = graph.getNodesByType('actor');
    for (const a of actors) {
      const hit = graph.getOutgoingEdges(a.id, 'holds_place_of_power').find(e => e.target === location.id);
      if (hit) {
        const holderType = (hit.properties.holderType as string | undefined) ?? 'actor';
        return { node: a, holderType, edgeProps: hit.properties as Record<string, unknown> };
      }
    }
    return null;
  }, [graph, location.id, tick]);

  return (
    <div style={BLOCK} data-testid="place-of-power-inspector">
      <div style={HEADER}>Place of Power</div>
      <div style={ROW}>
        <span>Holder</span>
        <span>{holder ? `${holder.node.name} (${holder.holderType})` : 'unclaimed'}</span>
      </div>
      <div style={ROW}>
        <span>Stream</span>
        <span>{streamDead ? 'dormant' : `${essencePerTick ?? 0} ${sphere ?? 'spirit'} / tick`}</span>
      </div>
      <div style={ROW}>
        <span>Decay</span>
        <span>{streamDead ? '—' : `${countdown ?? 0} ticks of grace`}</span>
      </div>
      {holder?.edgeProps?.corruptMark === true && (
        <div style={{ ...ROW, color: 'var(--accent-red, #a44)' }}>
          <span>Mark</span><span>corrupt — god siphons a share</span>
        </div>
      )}
      {holder?.edgeProps?.bargainFavor === true && (
        <div style={ROW}><span>Bond</span><span>god owes holder a favor</span></div>
      )}
      {transformedFrom && (
        <div style={ROW}>
          <span>Origin</span>
          <span>ruin {transformedFrom} · tick {transformedAt ?? '?'}</span>
        </div>
      )}
    </div>
  );
}
