import React from 'react';
import type { HexCoord, HexTile } from '../../types';
import type { WorldGraph } from '../../engine/graph';
import { terrainDisplayName } from '../HexMapV2/palette/terrainPalette';
import { getTerrainSphereScores } from '../../types/sphereAffinity';
import { getSphereColor } from '../../data/sphereIcons';
import { SphereIcon } from '../shared/SphereIcon';

interface HexDetailViewProps {
  coord: HexCoord;
  tile: HexTile | null;
  onClose: () => void;
  onGoToChronicle: (coord: HexCoord) => void;
  graph?: WorldGraph;
}

export const HexDetailView = React.memo(function HexDetailView({
  coord,
  tile,
  onClose,
  onGoToChronicle,
  graph,
}: HexDetailViewProps) {
  const terrainKey = tile?.terrain ?? 'unknown';
  const terrainName = terrainDisplayName(terrainKey);

  // Locations on this hex
  let locationNames: string[] = [];
  if (graph) {
    const allLocations = graph.getNodesByType('location');
    const onHex = allLocations.filter(
      n => n.properties.hexCol === coord.col && n.properties.hexRow === coord.row
    );
    locationNames = onHex.slice(0, 5).map(n => n.name);
    if (onHex.length > 5) locationNames.push(`+${onHex.length - 5} more`);
  }

  // Agents on this hex
  let agentNames: string[] = [];
  if (graph) {
    const allActors = graph.getNodesByType('actor').filter(
      n => n.properties?.actorType !== 'ascendant'
    );
    const onHex = allActors.filter(
      n => {
        if (n.properties.hexCol === coord.col && n.properties.hexRow === coord.row) return true;
        // Also resolve via located_at edge
        const locEdges = graph.getOutgoingEdges(n.id, 'located_at');
        if (locEdges.length === 0) return false;
        const loc = graph.getNode(locEdges[0].target);
        return loc?.properties.hexCol === coord.col && loc?.properties.hexRow === coord.row;
      }
    );
    agentNames = onHex.slice(0, 4).map(n => n.name);
    if (onHex.length > 4) agentNames.push(`+${onHex.length - 4} more`);
  }

  const regionId = tile?.regionId;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          padding: 'var(--space-4)',
          paddingBottom: 'var(--space-2)',
          backgroundColor: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-gold)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              fontVariant: 'small-caps',
              letterSpacing: '0.05em',
            }}
          >
            Hex
          </span>
          <button
            onClick={onClose}
            aria-label="Close hex detail"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent-gold)',
              fontSize: 'var(--text-base)',
              lineHeight: 1,
              padding: '0 var(--space-1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            ✕
          </button>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--text-base)',
            margin: 0,
          }}
        >
          {terrainName}
        </h2>

        <span
          style={{
            display: 'inline-block',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {coord.col}, {coord.row}
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {regionId && (
          <HexField label="Region" value={regionId} />
        )}
        {tile?.hasRiver && (
          <HexField label="Feature" value="River" />
        )}
        {tile?.dangerLevel != null && tile.dangerLevel > 0 && (
          <HexField label="Danger" value={dangerLabel(tile.dangerLevel)} />
        )}
        {locationNames.length > 0 && (
          <HexField label="Locations" value={locationNames.join(', ')} />
        )}
        {agentNames.length > 0 && (
          <HexField label="Agents present" value={agentNames.join(', ')} />
        )}
        {tile?.geoParams && (
          <>
            <HexField label="Elevation" value={`${Math.round(tile.geoParams.elevation * 100)}%`} />
            <HexField label="Temperature" value={`${Math.round(tile.geoParams.temperature * 100)}%`} />
            <HexField label="Moisture" value={`${Math.round(tile.geoParams.moisture * 100)}%`} />
          </>
        )}
        {tile && <SphereResonanceRow terrain={tile.terrain} />}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: 'var(--space-4)',
          paddingTop: 'var(--space-2)',
          backgroundColor: 'var(--bg-deep)',
          borderTop: '1px solid var(--border-gold)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onGoToChronicle(coord)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--accent-gold)',
            fontSize: 'var(--text-base)',
            fontFamily: 'var(--font-body)',
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Go to Hex Chronicle →
        </button>
      </div>
    </div>
  );
});

HexDetailView.displayName = 'HexDetailView';

function HexField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 'var(--text-base)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        fontWeight: 400,
        lineHeight: 1.5,
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{label}: </span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function SphereResonanceRow({ terrain }: { terrain: string }) {
  const scores = getTerrainSphereScores(terrain);
  const active = Object.entries(scores).filter(([, v]) => v > 0) as [string, number][];
  if (active.length === 0) return null;

  // Sort descending by score so dominant sphere shows first
  active.sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ marginTop: 'var(--space-1)' }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
        Sphere resonance
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {active.map(([sphere, score]) => (
          <div
            key={sphere}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <SphereIcon sphereName={sphere} size={13} />
            <span style={{ fontSize: 'var(--text-xs)', color: getSphereColor(sphere), fontWeight: 500 }}>
              {sphere}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', letterSpacing: '-0.02em' }}>
              {'●'.repeat(score)}{'○'.repeat(Math.max(0, 3 - score))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function dangerLabel(level: number): string {
  if (level < 0.25) return 'Low';
  if (level < 0.5) return 'Moderate';
  if (level < 0.75) return 'High';
  return 'Extreme';
}
