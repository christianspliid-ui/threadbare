/**
 * HexSidebar — Collapsible left sidebar showing hex statistics, sphere influence, and region info.
 *
 * Features:
 * - Toggle between expanded (220px) and collapsed (60px) states
 * - Sphere bars sorted by influence value, capped at top 4
 * - Region name, culture, faction summaries
 * - Location and agent counts
 * - Threadbare dark aesthetic with gold accents
 */

import React, { useState } from 'react';
import type { TerrainType, SphereName } from '../../types';
import type { LineOfSight, SphereInfluence, HexCultureSummary, HexFactionSummary } from '../../engine/hexZoom';
import type { HexRegionData } from '../../engine/hexRegion';
import { getSphereColor } from '../../data/sphereIcons';
import { getHexTileUrl } from '../../data/hex-tile-assets';
import { hexPolygonPoints } from '../../lib/hexMath';
import { IconButton } from '../shared/IconButton';

export interface HexSidebarProps {
  terrain: TerrainType;
  hexCol: number;
  hexRow: number;
  sphereInfluence: SphereInfluence | null;
  regionData: HexRegionData | null;
  locations: Array<{ id: string; name: string; properties?: Record<string, unknown> }>;
  agentsByLocation: Record<string, Array<{ id: string; name: string }>>;
  lineOfSight: LineOfSight;
  cultures: HexCultureSummary[];
  factions: HexFactionSummary[];
}

/**
 * Get intensity label for a sphere influence value.
 */
function getIntensityLabel(value: number): string {
  if (value >= 0.6) return 'strong';
  if (value >= 0.3) return 'faint';
  return 'trace';
}

/**
 * Capitalize terrain type for display.
 */
function terrainLabel(terrain: TerrainType): string {
  return terrain.replace(/_/g, ' ');
}

// ── Hex image preview constants ────────────────────────────────────
const HEX_PREVIEW_RADIUS = 80;
const HEX_PREVIEW_SIZE = HEX_PREVIEW_RADIUS * 2 + 8; // viewBox padding
const HEX_PREVIEW_CENTER = HEX_PREVIEW_SIZE / 2;
const HEX_PREVIEW_IMG_SCALE = 2.4;
const HEX_PREVIEW_POINTS = hexPolygonPoints(HEX_PREVIEW_CENTER, HEX_PREVIEW_CENTER, HEX_PREVIEW_RADIUS);

export const HexSidebar = React.memo((props: HexSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Count total agents across all locations
  const totalAgents = Object.values(props.agentsByLocation).reduce((sum, agents) => sum + agents.length, 0);

  // Get sphere bars: filter > 0, sort descending, cap at 4
  const sphereBars = props.sphereInfluence
    ? (Object.entries(props.sphereInfluence) as Array<[SphereName, number]>)
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
    : [];

  // Determine dominant culture and faction
  const dominantCulture = props.cultures.length > 0 ? props.cultures[0] : null;
  const dominantFaction = props.factions.length > 0 ? props.factions[0] : null;

  return (
    <aside
      className={`hex-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      data-testid="sidebar-content"
      style={{
        width: isExpanded ? '220px' : '60px',
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
        borderRight: '1px solid var(--border-gold)',
        padding: isExpanded ? '16px 12px' : '12px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'width 0.3s ease, padding 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Toggle Button */}
      <IconButton
        icon={<span>{isExpanded ? '◀' : '▶'}</span>}
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Toggle sidebar"
        aria-expanded={isExpanded}
        style={{ alignSelf: 'flex-start' }}
      />

      {isExpanded ? (
        <>
          {/* Hex Terrain Image Preview */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg
              viewBox={`0 0 ${HEX_PREVIEW_SIZE} ${HEX_PREVIEW_SIZE}`}
              width="100%"
              style={{ maxWidth: `${HEX_PREVIEW_SIZE}px` }}
            >
              <defs>
                <clipPath id="hex-sidebar-clip">
                  <polygon points={HEX_PREVIEW_POINTS} />
                </clipPath>
              </defs>
              <polygon
                points={HEX_PREVIEW_POINTS}
                fill="var(--bg-abyss)"
                stroke="var(--accent-gold)"
                strokeWidth="1.5"
                strokeOpacity={0.3}
              />
              <g clipPath="url(#hex-sidebar-clip)">
                <image
                  href={getHexTileUrl(props.terrain)}
                  x={HEX_PREVIEW_CENTER - (HEX_PREVIEW_RADIUS * HEX_PREVIEW_IMG_SCALE) / 2}
                  y={HEX_PREVIEW_CENTER - (HEX_PREVIEW_RADIUS * HEX_PREVIEW_IMG_SCALE) / 2}
                  width={HEX_PREVIEW_RADIUS * HEX_PREVIEW_IMG_SCALE}
                  height={HEX_PREVIEW_RADIUS * HEX_PREVIEW_IMG_SCALE}
                  preserveAspectRatio="xMidYMid slice"
                  opacity={props.lineOfSight === 'none' ? 0.08 : props.lineOfSight === 'partial' ? 0.4 : 0.85}
                />
              </g>
              <polygon
                points={HEX_PREVIEW_POINTS}
                fill="none"
                stroke="var(--accent-gold)"
                strokeWidth="1.5"
                strokeOpacity={0.3}
              />
            </svg>
          </div>

          {/* Region Section */}
          {props.regionData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--accent-gold)',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {props.regionData.regionName}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  lineHeight: '1.3',
                }}
              >
                {props.regionData.hexCount ? <div>{props.regionData.hexCount} hexes</div> : null}
                {props.regionData.featureType ? <div>{props.regionData.featureType}</div> : null}
              </div>
            </div>
          ) : (
            <div
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-tertiary)',
                fontSize: '12px',
              }}
            >
              {terrainLabel(props.terrain)}
            </div>
          )}

          {/* Sphere Bars */}
          {sphereBars.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sphereBars.map(([sphere, value]) => {
                const sphereColor = getSphereColor(sphere);
                const intensity = getIntensityLabel(value);
                const percentage = Math.round(value * 100);

                return (
                  <div key={sphere} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div
                      style={{
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {sphere}
                    </div>
                    <div
                      style={{
                        background: 'var(--bg-raised)',
                        borderRadius: '2px',
                        height: '16px',
                        position: 'relative',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div
                        style={{
                          background: sphereColor,
                          borderRadius: '1px',
                          height: '100%',
                          width: `${percentage}%`,
                          transition: 'width 0.2s ease',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: '9px',
                        color: 'var(--text-tertiary)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {intensity}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Culture/Faction Summary */}
          {dominantCulture || dominantFaction ? (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '8px',
              }}
            >
              {dominantCulture && (
                <div>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>Culture: </span>
                  {dominantCulture.cultureName}
                </div>
              )}
              {dominantFaction && (
                <div>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>Controls: </span>
                  {dominantFaction.factionName}
                </div>
              )}
            </div>
          ) : null}

          {/* Quick Stats */}
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '8px',
            }}
          >
            <div>
              {props.locations.length}
              <span style={{ color: 'var(--text-tertiary)' }}>
                {' '}
                location{props.locations.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div>
              {totalAgents}
              <span style={{ color: 'var(--text-tertiary)' }}>
                {' '}
                soul{totalAgents !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Quick Nav: Location Links */}
          {props.locations.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '8px',
              }}
            >
              {props.locations.map((loc) => (
                <button
                  key={loc.id}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-gold)',
                    cursor: 'pointer',
                    fontSize: '10px',
                    textAlign: 'left',
                    padding: '2px 4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent-gold-dim)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--accent-gold)';
                  }}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Collapsed View: Terrain Icon + Sphere Pips + Count */}
          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              wordBreak: 'break-word',
            }}
          >
            {props.regionData?.regionName ? props.regionData.regionName.substring(0, 8) : terrainLabel(props.terrain).substring(0, 5)}
          </div>

          {/* Sphere color pips (vertical stack) */}
          {sphereBars.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'center',
              }}
            >
              {sphereBars.map(([sphere]) => (
                <div
                  key={sphere}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getSphereColor(sphere),
                    boxShadow: '0 0 4px rgba(0, 0, 0, 0.5)',
                  }}
                  title={sphere}
                />
              ))}
            </div>
          )}

          {/* Count badge */}
          <div
            style={{
              fontSize: '9px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginTop: 'auto',
            }}
          >
            {props.locations.length}L
            <br />
            {totalAgents}S
          </div>
        </>
      )}
    </aside>
  );
});

HexSidebar.displayName = 'HexSidebar';
