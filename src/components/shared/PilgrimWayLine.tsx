/**
 * PilgrimWayLine — where a faith's pilgrims go (THR-1660 § UI).
 *
 * One component for both sheets that carry the fact, so the Location sheet and the
 * congregation's Faction sheet cannot learn about a way at different times:
 *
 *   Location sheet: *Pilgrims come here — a way of* [the Temple of the Ashen Folk].
 *   Faction sheet:  *Pilgrim ways to* [Ashford], [Brindle].
 *
 * Every name carries its image, its tooltip-backed concept and its link (the UI Law,
 * THR-1004; Law 33): the congregation routes to its Faction sheet, a town to its
 * Location sheet, through the one ref router. The concept word *pilgrim way* is the
 * `ui.pilgrim_way` registry entry, never the edge's machine name (Laws 13/14). No count
 * is ever shown. Reads `selectPilgrimWays` rows the caller passes (Law 56: the line is
 * the edges, not a cached string); renders nothing when there are none.
 */

import React from 'react';
import { EntityVisual } from './EntityVisual';
import { EntityLink } from './EntityLink';
import { Tooltip } from './Tooltip';
import type { WorldGraph } from '../../engine/graph';
import type { PilgrimWayRow } from '../../engine/pilgrimWays';

interface PilgrimWayLineProps {
  graph: WorldGraph | null;
  /** The ways to name — already filtered to this sheet's congregation or site. */
  ways: readonly PilgrimWayRow[];
  /** `site`: a Location sheet names the congregations; `congregation`: a Faction sheet names the towns. */
  side: 'site' | 'congregation';
  'data-testid'?: string;
}

export const PILGRIM_WAY_SITE_LEAD = 'Pilgrims come here — a way of';
export const PILGRIM_WAY_CONGREGATION_LEAD = 'Pilgrim ways to';

export function PilgrimWayLine({ graph, ways, side, 'data-testid': testId = 'pilgrim-way-line' }: PilgrimWayLineProps) {
  // One entry per distinct far end, in id order (NFP #3); a dangling end is skipped.
  const named = React.useMemo(() => {
    const ids = [...new Set(ways.map(w => (side === 'site' ? w.congregationId : w.siteId)))].sort();
    return ids
      .map(id => ({ id, node: graph?.getNode(id) }))
      .filter((e): e is { id: string; node: NonNullable<typeof e.node> } => e.node !== undefined)
      .map(({ id, node }) => ({ id, name: node.name }));
  }, [graph, ways, side]);

  if (named.length === 0) return null;
  const refKind = side === 'site' ? 'faction' : 'location';

  return (
    <p
      data-testid={testId}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        margin: 0,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--space-1)',
      }}
    >
      <Tooltip id="ui.pilgrim_way">
        <span style={{ fontStyle: 'italic' }}>{side === 'site' ? PILGRIM_WAY_SITE_LEAD : PILGRIM_WAY_CONGREGATION_LEAD}</span>
      </Tooltip>
      {named.map((e, i) => (
        <span key={e.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <EntityVisual size="chip" entity={{ id: e.id, name: e.name }} graph={graph} data-testid="pilgrim-way-visual" />
          <EntityLink id={e.id} name={e.name} entityRef={{ kind: refKind, id: e.id }} />
          {i < named.length - 1 ? ',' : '.'}
        </span>
      ))}
    </p>
  );
}
