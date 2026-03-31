import React from 'react';
import type { WorldGraph } from '../../../engine/graph';
import { FIELD_BATTLE_COLOR, SIEGE_COLOR } from '../../HexMapV2/scene/BattleIndicatorLayer';

const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  color: 'var(--text-primary)',
  opacity: 0.4,
  fontSize: '13px',
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

export interface ArmiesTabContentProps {
  graph?: WorldGraph;
  currentTick: number;
  onZoomToLocation?: (locationId: string) => void;
}

export function ArmiesTabContent({ graph, currentTick, onZoomToLocation }: ArmiesTabContentProps) {
  if (!graph) {
    return <div style={EMPTY_STATE_STYLE}>No graph available.</div>;
  }

  const armies = graph.getNodesByType('actor')
    .filter(n => n.properties.armyState != null)
    .filter(n => {
      const memEdges = graph.getOutgoingEdges(n.id, 'member_of');
      if (memEdges.length === 0) return true;
      const faction = graph.getNode(memEdges[0].target);
      return !faction?.properties.isMonsterFaction;
    });

  const battles = graph.getNodesByType('actor')
    .filter(n => n.properties.battleState != null);

  if (armies.length === 0 && battles.length === 0) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No armies or battles yet. Factions need military ambitions and sufficient Iron+Gold capability.
      </div>
    );
  }

  return (
    <div className="p-3 text-xs font-mono">
      {armies.length > 0 && (
        <>
          <div className="text-sm font-medium mb-2" style={{ color: '#D4A574' }}>
            Active Armies ({armies.length})
          </div>
          {armies.map((army) => {
            const as = army.properties.armyState as Record<string, unknown>;
            const cmdEdges = graph.getOutgoingEdges(army.id, 'commanded_by');
            const commander = cmdEdges[0] ? graph.getNode(cmdEdges[0].target) : null;
            const memEdges = graph.getOutgoingEdges(army.id, 'member_of');
            const faction = memEdges[0] ? graph.getNode(memEdges[0].target) : null;
            const locEdges = graph.getOutgoingEdges(army.id, 'located_at');
            const location = locEdges[0] ? graph.getNode(locEdges[0].target) : null;
            const qPct = ((as.quintessence as number) / Math.max(1, as.quintessenceMax as number) * 100);
            const ticksActive = currentTick - (as.raisedTick as number);

            return (
              <div key={army.id} className="p-2 bg-[var(--bg-raised)] rounded mb-1.5 text-[11px]">
                <div className="font-semibold mb-1">{army.name}</div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Faction:</span>
                  <span style={DETAIL_VALUE_STYLE}>{faction?.name ?? '—'}</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Commander:</span>
                  <span style={DETAIL_VALUE_STYLE}>{commander?.name ?? '—'}</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Size:</span>
                  <span style={DETAIL_VALUE_STYLE}>{String(as.size)} ({as.headcount})</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Quintessence:</span>
                  <span style={{ ...DETAIL_VALUE_STYLE, color: qPct < 30 ? FIELD_BATTLE_COLOR : qPct < 70 ? '#fbbf24' : '#4ade80' }}>
                    {(as.quintessence as number).toFixed(1)} / {as.quintessenceMax as number} ({qPct.toFixed(0)}%)
                  </span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Location:</span>
                  <span style={{ ...DETAIL_VALUE_STYLE, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {location?.name ?? '—'}
                    {onZoomToLocation && location && (
                      <button
                        onClick={() => onZoomToLocation(location.id)}
                        title={`Zoom to ${location.name}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1 }}
                      >&#x1F441;</button>
                    )}
                  </span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Active:</span>
                  <span style={DETAIL_VALUE_STYLE}>{ticksActive} ticks</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Maintenance:</span>
                  <span style={DETAIL_VALUE_STYLE}>{as.maintenanceCost}/tick</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {battles.length > 0 && (
        <>
          <div className="text-sm font-medium mb-2 mt-3" style={{ color: FIELD_BATTLE_COLOR }}>
            Active Battles ({battles.length})
          </div>
          {battles.map((battle) => {
            const bs = battle.properties.battleState as Record<string, unknown>;
            const ticksElapsed = currentTick - (bs.startedTick as number);
            const isSiege = bs.battleType === 'siege';
            const momentum = bs.momentum as number;
            const threshold = isSiege ? 12 : 8;

            return (
              <div key={battle.id} className="p-2 bg-[var(--bg-raised)] rounded mb-1.5 text-[11px]">
                <div className="font-semibold mb-1">{battle.name}</div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Type:</span>
                  <span style={DETAIL_VALUE_STYLE}>{isSiege ? 'Siege' : 'Field Battle'}</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Momentum:</span>
                  <span style={{ ...DETAIL_VALUE_STYLE, color: momentum > 0 ? FIELD_BATTLE_COLOR : momentum < 0 ? '#60a5fa' : '#888' }}>
                    {momentum.toFixed(1)} / {'\u00B1'}{threshold} ({momentum > 0 ? 'Attacker' : momentum < 0 ? 'Defender' : 'Even'})
                  </span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Elapsed:</span>
                  <span style={DETAIL_VALUE_STYLE}>{ticksElapsed} ticks</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Spotlights:</span>
                  <span style={DETAIL_VALUE_STYLE}>{(bs.spotlightHistory as string[]).length}</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      <div className="text-sm font-medium mb-2 mt-3" style={{ color: SIEGE_COLOR }}>
        Destruction Log
      </div>
      {(() => {
        const destroyed = graph.getNodesByType('location')
          .filter(n => n.properties.locationSubtype === 'ruins');
        if (destroyed.length === 0) {
          return <div className="text-[11px] opacity-60 italic">No destruction events yet.</div>;
        }
        return destroyed.map(loc => (
          <div key={loc.id} className="p-2 bg-[var(--bg-raised)] rounded mb-1.5 text-[11px]">
            <div className="font-semibold mb-1">{loc.name}</div>
            <div style={DETAIL_ROW_STYLE}>
              <span style={DETAIL_LABEL_STYLE}>Status:</span>
              <span style={DETAIL_VALUE_STYLE}>Ruins</span>
            </div>
            {loc.properties.prosperity != null && (
              <div style={DETAIL_ROW_STYLE}>
                <span style={DETAIL_LABEL_STYLE}>Prosperity:</span>
                <span style={DETAIL_VALUE_STYLE}>{(loc.properties.prosperity as number).toFixed(2)}</span>
              </div>
            )}
          </div>
        ));
      })()}
    </div>
  );
}
