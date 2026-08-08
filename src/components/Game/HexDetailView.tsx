import React from 'react';
import type { HexCoord, HexTile } from '../../types';
import type { WorldGraph } from '../../engine/graph';
import { terrainDisplayName } from '../HexMapV2/palette/terrainPalette';
import { getTerrainSphereScores } from '../../types/sphereAffinity';
import { getSphereColor } from '../../data/sphereIcons';
import { SphereIcon } from '../shared/SphereIcon';
import { EntityVisual } from '../shared/EntityVisual';
import { ListRow } from '../shared/ListRow';
import { Tooltip } from '../shared/Tooltip';

/**
 * How many locations / agents list before the row collapses into a count.
 * (NFP #1 — the caps were bare literals until THR-1009.)
 */
const HEX_DETAIL_MAX_LOCATIONS = 5;
const HEX_DETAIL_MAX_AGENTS = 4;

/**
 * Sphere glyph size in the resonance row. UI Law 11 puts the floor for a
 * meaning-bearing glyph at 14px; this row shipped at 13.
 */
const SPHERE_GLYPH_PX = 14;

/**
 * Reading of a resonance pip row in words, for the `aria-label` Law 11 requires
 * ("every glyph row carries an aria-label stating its reading in words").
 */
const SPHERE_RESONANCE_WORDS: Record<number, string> = {
  1: 'Faint',
  2: 'Steady',
  3: 'Strong',
};

/** Entity the hex lists — enough to render a chip, a name, and a kind-routed link. */
interface HexEntityRef {
  id: string;
  name: string;
}

interface HexDetailViewProps {
  coord: HexCoord;
  tile: HexTile | null;
  onClose: () => void;
  onGoToChronicle: (coord: HexCoord) => void;
  graph?: WorldGraph;
  /**
   * Kind-routed navigation (UI Law 21). Absent ⇒ the entity renders as plain
   * styled text rather than a link that goes nowhere — fail-open, per the law's
   * "no page yet" clause.
   */
  onAgentClick?: (agentId: string) => void;
  onLocationClick?: (locationId: string) => void;
}

export const HexDetailView = React.memo(function HexDetailView({
  coord,
  tile,
  onClose,
  onGoToChronicle,
  graph,
  onAgentClick,
  onLocationClick,
}: HexDetailViewProps) {
  const terrainKey = tile?.terrain ?? 'unknown';
  const terrainName = terrainDisplayName(terrainKey);

  // Locations on this hex
  let locations: HexEntityRef[] = [];
  let locationOverflow = 0;
  if (graph) {
    const allLocations = graph.getNodesByType('location');
    const onHex = allLocations.filter(
      n => n.properties.hexCol === coord.col && n.properties.hexRow === coord.row
    );
    locations = onHex.slice(0, HEX_DETAIL_MAX_LOCATIONS).map(n => ({ id: n.id, name: n.name }));
    locationOverflow = Math.max(0, onHex.length - HEX_DETAIL_MAX_LOCATIONS);
  }

  // Agents on this hex
  let agents: HexEntityRef[] = [];
  let agentOverflow = 0;
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
    agents = onHex.slice(0, HEX_DETAIL_MAX_AGENTS).map(n => ({ id: n.id, name: n.name }));
    agentOverflow = Math.max(0, onHex.length - HEX_DETAIL_MAX_AGENTS);
  }

  // `tile.regionId` is an internal key ("region_0"); the region node carries the
  // authored name ("The Expanse"). Law 14 — resolve it, and omit the field
  // entirely rather than print the key when the node is missing (fail-soft).
  const regionName =
    tile?.regionId && graph ? graph.getNode(tile.regionId)?.name ?? null : null;

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
        {regionName && (
          <HexField label="Region" value={regionName} />
        )}
        {tile?.hasRiver && (
          <HexField label="Feature" value="River" />
        )}
        {tile?.dangerLevel != null && tile.dangerLevel > 0 && (
          <HexField label="Danger" value={dangerLabel(tile.dangerLevel)} />
        )}
        {tile?.geoParams && (
          <>
            <HexField label="Elevation" value={geoWord(tile.geoParams.elevation, ELEVATION_WORDS)} />
            <HexField label="Temperature" value={geoWord(tile.geoParams.temperature, TEMPERATURE_WORDS)} />
            <HexField label="Moisture" value={geoWord(tile.geoParams.moisture, MOISTURE_WORDS)} />
          </>
        )}

        <EntityRowGroup
          heading="Locations"
          entities={locations}
          overflow={locationOverflow}
          kind="location"
          graph={graph}
          onEntityClick={onLocationClick}
        />
        <EntityRowGroup
          heading="Agents present"
          entities={agents}
          overflow={agentOverflow}
          kind="agent"
          graph={graph}
          onEntityClick={onAgentClick}
        />
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

/**
 * A group of entities on the hex, rendered through the shared primitives:
 * `ListRow` for the row, `EntityVisual chip` for the image, `Tooltip` for the
 * hover tier, and a kind-routed click for the link (UI Laws 1, 20, 21).
 *
 * Before THR-1009 these were `names.join(', ')` — bare, unclickable strings.
 *
 * Fail-open: with no `onEntityClick` the row renders as plain styled text with
 * no interactive affordance, rather than a link that opens nothing (Law 21).
 */
function EntityRowGroup({
  heading,
  entities,
  overflow,
  kind,
  graph,
  onEntityClick,
}: {
  heading: string;
  entities: HexEntityRef[];
  overflow: number;
  kind: 'location' | 'agent';
  graph?: WorldGraph;
  onEntityClick?: (id: string) => void;
}) {
  if (entities.length === 0) return null;

  return (
    <div style={{ marginTop: 'var(--space-1)' }} data-testid={`hex-detail-${kind}s`}>
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-1)',
        }}
      >
        {heading}
      </div>
      {entities.map(entity => (
        <ListRow
          key={entity.id}
          onClick={onEntityClick ? () => onEntityClick(entity.id) : undefined}
        >
          <ListRow.Leading>
            <EntityVisual
              size="chip"
              entity={{ id: entity.id, kind, name: entity.name }}
              graph={graph ?? null}
            />
          </ListRow.Leading>
          <ListRow.Title>{entity.name}</ListRow.Title>
        </ListRow>
      ))}
      {overflow > 0 && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            padding: '0.25rem 0.75rem',
          }}
        >
          {overflowPhrase(overflow, kind)}
        </div>
      )}
    </div>
  );
}

/**
 * Overflow reads as a sentence, not a `+N more` token (Law 16 — no key:value
 * debris). A count of things present is a countable, not a magnitude, so the
 * numeral is legitimate here in the way a pool balance is (Law 13's exception).
 */
function overflowPhrase(count: number, kind: 'location' | 'agent'): string {
  const noun = kind === 'location'
    ? (count === 1 ? 'further place' : 'further places')
    : (count === 1 ? 'other soul' : 'other souls');
  return `and ${count} ${noun} besides`;
}

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
          <Tooltip key={sphere} id={`sphere.${sphere}`}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'help',
              }}
            >
              <SphereIcon sphereName={sphere} size={SPHERE_GLYPH_PX} />
              <span style={{ fontSize: 'var(--text-xs)', color: getSphereColor(sphere), fontWeight: 500, textTransform: 'capitalize' }}>
                {sphere}
              </span>
              <span
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', letterSpacing: '-0.02em' }}
                aria-label={`${SPHERE_RESONANCE_WORDS[score] ?? 'present'} resonance`}
              >
                {'●'.repeat(score)}{'○'.repeat(Math.max(0, 3 - score))}
              </span>
            </span>
          </Tooltip>
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

/**
 * Geographic word bands (UI Law 13 — no percentages on any mortal-facing
 * surface). Elevation, temperature and moisture arrived here as
 * `${Math.round(v * 100)}%`; the number stays in `tile.geoParams` and the
 * designer view, and the player reads the land instead.
 *
 * NFP #1: five bands, one table each, edited without touching logic.
 */
type GeoBand = readonly [threshold: number, word: string];

const ELEVATION_WORDS: readonly GeoBand[] = [
  [0.2, 'Lowland'], [0.4, 'Rolling'], [0.6, 'Upland'], [0.8, 'Highland'], [1.01, 'Alpine'],
];
const TEMPERATURE_WORDS: readonly GeoBand[] = [
  [0.2, 'Frozen'], [0.4, 'Cold'], [0.6, 'Temperate'], [0.8, 'Warm'], [1.01, 'Scorching'],
];
const MOISTURE_WORDS: readonly GeoBand[] = [
  [0.2, 'Arid'], [0.4, 'Dry'], [0.6, 'Moderate'], [0.8, 'Damp'], [1.01, 'Drenched'],
];

/** Band a 0–1 geo parameter to its word. Out-of-range input clamps to the ends. */
function geoWord(value: number, bands: readonly GeoBand[]): string {
  for (const [threshold, word] of bands) {
    if (value < threshold) return word;
  }
  return bands[bands.length - 1][1];
}
