/**
 * PlaceOfPowerInspector — compact info panel shown inside LocationView when the
 * location's subtype is `place_of_power` (THR-153). Reports:
 *   - Holder (actor / faction / god)
 *   - Stream strength + sphere alignment, as words
 *   - How long the stream has left before absence kills it, as words
 *   - Transformed-from lineage (the original ruin, by name)
 *
 * Data comes straight from graph properties and the incoming
 * `holds_place_of_power` edge. Fail-soft on missing fields — every row is
 * gated by a local typeof check.
 */

import React, { useMemo } from 'react';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../../engine/graph';
import { getStreamYieldWord } from '../../data/ruin-words';
import { getDurationWord } from '../../data/domain-words';

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
      {/* Law 13 — both rows carried raw magnitudes on a surface that is not
          persistent chrome, so the ratified pool-balance exception does not
          reach them: a per-tick rate (`2 spirit / tick`) and a tick countdown
          (`7 ticks of grace`). The rate bands through the three-value engine
          range; the countdown adopts THR-1070's duration scale. */}
      <div style={ROW}>
        <span>Stream</span>
        <span>
          {streamDead
            ? 'dormant'
            : `${getStreamYieldWord(essencePerTick ?? 0)} of ${sphere ?? 'spirit'}`}
        </span>
      </div>
      <div style={ROW}>
        <span>Decay</span>
        <span>{streamDead ? '—' : `fades ${getDurationWord(countdown ?? 0)}`}</span>
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
          {/* Law 14 — this printed the raw ruin node id and the raw tick it
              transformed on. The id resolves to the ruin's name and fails open
              to plain English; the tick is designer data and belongs on the
              trace, not on a player surface, so it is dropped rather than
              banded — "which tick" is not a question the player is asking. */}
          <span>{graph?.getNode(transformedFrom)?.name ?? 'a fallen ruin'}</span>
        </div>
      )}
    </div>
  );
}
