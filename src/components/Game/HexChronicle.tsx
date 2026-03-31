import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';
import type { TerrainType, SphereName } from '../../types';
import type { LineOfSight, SphereInfluence, HexCultureSummary, HexFactionSummary } from '../../engine/hexZoom';
import type { HexRegionData } from '../../engine/hexRegion';
import type { WorldGraph } from '../../engine/graph';
import type { GraphNode } from '../../types/graph';
import { getSphereColor } from '../../data/sphereIcons';
import { LocationCard, SoulCard, AgentEntry, SubLocationEntry, EventBlock, ExplorationHook } from './chronicle';
import { historicalCultureResolver, regionEtymologyResolver, geographicRegionResolver } from '../../engine/proseResolvers';
import { generateEntityProse } from '../../engine/proseGenerator';
import { mulberry32 } from '../../lib/prng';
import { useNarration } from '../../services/narration/useNarration';
import {
  BIOME_PROSE,
  SPHERE_LOCATION_PROSE,
  CULTURE_LOCATION_PROSE,
  FACTION_CONTROL_PROSE,
} from '../../data/prose-layer-content';
import type { ResourceInstance } from '../../types/resource';
import { getAbundanceLabel, RESOURCE_ICONS } from '../../types/resource';
import { RESOURCE_PROSE } from '../../data/resource-content';
import { pickConceptArt } from '../../data/concept-art-assets';
import type { ControlEffect } from '../../types/controlEffect';
import { SOUL_PROSE, SOUL_SECONDARY_PROSE, type HexSoulLevel } from '../../data/hexSoulProse';
import { renderProseWithIPK } from '../ProseKeyword';

// ── Helpers ─────────────────────────────────────────────────────────

/** Seeded pick from an array — deterministic, same seed = same result. */
function pickFromArray<T>(arr: T[], seed: number): T | undefined {
  if (arr.length === 0) return undefined;
  const rng = mulberry32(seed);
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick two distinct items from an array using seeded PRNG. */
function pickTwoFromArray(arr: string[], seed: number): [string, string | undefined] {
  if (arr.length === 0) return ['', undefined];
  if (arr.length === 1) return [arr[0], undefined];
  const rng = mulberry32(seed);
  const idx1 = Math.floor(rng() * arr.length);
  let idx2 = Math.floor(rng() * (arr.length - 1));
  if (idx2 >= idx1) idx2++;
  return [arr[idx1], arr[idx2]];
}

/** Hash a string into a numeric seed offset — deterministic per entity. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Strip leading "The " from a name to avoid "The The X" constructions. */
function stripLeadingThe(name: string): string {
  return name.replace(/^The\s+/i, '');
}

/** Get sphere strength label from influence value. */
function getSphereLabel(value: number): string {
  if (value >= 0.6) return 'strong';
  if (value >= 0.3) return 'faint';
  return 'trace';
}

/**
 * Map a sphereInfluence value (0-1 normalized) to SOUL_PROSE intensity level.
 * Thresholds: weak < 0.2, moderate < 0.4, strong < 0.7, dominant >= 0.7
 */
function getSoulLevel(value: number): HexSoulLevel {
  if (value >= 0.7) return 'dominant';
  if (value >= 0.4) return 'strong';
  if (value >= 0.2) return 'moderate';
  return 'weak';
}

// ── Fallbacks ────────────────────────────────────────────────────────

const FALLBACK_TERRAIN_PROSE = 'An unremarkable stretch of land, waiting for someone to give it meaning.';

// ── Component ────────────────────────────────────────────────────────

interface HexChronicleProps {
  terrain: TerrainType;
  hexCol: number;
  hexRow: number;
  lineOfSight: LineOfSight;
  sphereInfluence: SphereInfluence | null;
  cultures: HexCultureSummary[];
  factions: HexFactionSummary[];
  locations: GraphNode[];
  agentsByLocation: Record<string, GraphNode[]>;
  regionData: HexRegionData | null;
  onLocationClick: (locationId: string) => void;
  onAgentClick: (agentId: string) => void;
  graph: WorldGraph;
  seed: number;
  /** Current game tick — enables tick-based prose cache (PERF-01) */
  tick?: number;
  /** Active control effects on this hex (TB-049). */
  controlEffects?: readonly ControlEffect[];
  /** Callback to voluntarily release a control effect (TB-049). */
  onReleaseEffect?: (effectId: string) => void;
  /** Hex revelation state (which narrative layers have been discovered). */
  hexRevelation?: import('../../types/unifiedAction').HexRevelation;
}

export const HexChronicle = memo(function HexChronicle({
  terrain,
  hexCol,
  hexRow,
  lineOfSight,
  sphereInfluence,
  cultures,
  factions,
  locations,
  agentsByLocation,
  regionData,
  onLocationClick,
  onAgentClick,
  graph,
  seed,
  tick,
  controlEffects,
  onReleaseEffect,
  hexRevelation,
}: HexChronicleProps) {
  // ── Narration ─────────────────────────────────────────────────────

  const chronicleRef = useRef<HTMLDivElement>(null);
  const landRef = useRef<HTMLDivElement>(null);
  const soulRef = useRef<HTMLDivElement>(null);
  const peopleRef = useRef<HTMLDivElement>(null);
  const placesRef = useRef<HTMLDivElement>(null);
  const ruinsRef = useRef<HTMLDivElement>(null);
  const { enabled: narrationEnabled, isLoading, isSpeaking, narrateChronicle, stop: stopNarration } = useNarration();

  // Stop narration when hex changes
  const prevHexKey = useRef(`${hexCol},${hexRow}`);
  useEffect(() => {
    const key = `${hexCol},${hexRow}`;
    if (prevHexKey.current !== key) {
      prevHexKey.current = key;
      if (isSpeaking || isLoading) {
        stopNarration();
      }
    }
  }, [hexCol, hexRow, isSpeaking, isLoading, stopNarration]);

  const handleNarrateChapter = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    if (isSpeaking || isLoading) {
      stopNarration();
    } else {
      narrateChronicle(ref.current);
    }
  }, [isSpeaking, isLoading, stopNarration, narrateChronicle]);

  // ── Derived data ─────────────────────────────────────────────────

  const terrainLabel = useMemo(() => {
    return terrain
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [terrain]);

  // Hex-specific seed for deterministic prose selection
  const hexSeed = useMemo(() => seed + hexCol * 1000 + hexRow, [seed, hexCol, hexRow]);

  // Pick concept art based on terrain, locations, and sphere influence
  const conceptArtUrl = useMemo(
    () => pickConceptArt(terrain, locations, sphereInfluence),
    [terrain, locations, sphereInfluence],
  );

  // ── LAND: Two paragraphs from BIOME_PROSE ──────────────────────

  const [landProse1, landProse2] = useMemo(() => {
    const templates = BIOME_PROSE[terrain];
    if (!templates || templates.length === 0) return [FALLBACK_TERRAIN_PROSE, undefined];
    return pickTwoFromArray(templates, hexSeed);
  }, [terrain, hexSeed]);

  // ── LAND: Aggregate resources from all locations in hex ────────

  const hexResources = useMemo(() => {
    const aggregated: Record<string, { quantity: number; renewable: boolean }> = {};
    for (const loc of locations) {
      const resources = loc.properties?.resources as Record<string, ResourceInstance> | undefined;
      if (!resources) continue;
      for (const [type, inst] of Object.entries(resources)) {
        if (inst.quantity <= 0) continue;
        if (!aggregated[type]) {
          aggregated[type] = { quantity: inst.quantity, renewable: inst.renewable };
        } else {
          // Take max quantity across locations for this resource type
          aggregated[type].quantity = Math.max(aggregated[type].quantity, inst.quantity);
        }
      }
    }
    return Object.entries(aggregated)
      .sort((a, b) => b[1].quantity - a[1].quantity);
  }, [locations]);

  const resourceProse = useMemo(() => {
    if (hexResources.length === 0) return null;
    const [topType, topInst] = hexResources[0];
    const proseSet = RESOURCE_PROSE[topType];
    if (!proseSet) return null;
    const abundance = getAbundanceLabel(topInst.quantity);
    const templates = abundance === 'abundant' || abundance === 'moderate'
      ? proseSet.abundant
      : proseSet.scarce;
    return pickFromArray([...templates], hexSeed + 300);
  }, [hexResources, hexSeed]);

  // ── LAND: Geographic region prose ─────────────────────────────

  const geoRegionLayers = useMemo(() => {
    if (!regionData?.regionId) return [];
    return geographicRegionResolver(regionData.regionId, graph, hexSeed);
  }, [regionData, graph, hexSeed]);

  // ── SOUL: Rich sphere prose + strength labels ──────────────────

  const sortedSpheres = useMemo(() => {
    if (!sphereInfluence) return [];
    const entries = Object.entries(sphereInfluence) as [SphereName, number][];
    return entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  }, [sphereInfluence]);

  const dominantSphere = useMemo(() => sortedSpheres.length > 0 ? sortedSpheres[0] : null, [sortedSpheres]);
  const secondarySphere = useMemo(() => sortedSpheres.length > 1 ? sortedSpheres[1] : null, [sortedSpheres]);
  const topSpheres = useMemo(() => sortedSpheres.slice(0, 3), [sortedSpheres]);

  // Rich sphere prose from content tables
  const dominantSphereProse = useMemo(() => {
    if (!dominantSphere) return null;
    const templates = SPHERE_LOCATION_PROSE[dominantSphere[0]];
    if (!templates) return null;
    return pickFromArray(templates, hexSeed + 100);
  }, [dominantSphere, hexSeed]);

  const secondarySphereProse = useMemo(() => {
    if (!secondarySphere || secondarySphere[1] < 0.2) return null;
    const templates = SPHERE_LOCATION_PROSE[secondarySphere[0]];
    if (!templates) return null;
    return pickFromArray(templates, hexSeed + 200);
  }, [secondarySphere, hexSeed]);

  // IPK Soul paragraph — uses SOUL_PROSE with renderProseWithIPK
  const soulAffinityProse = useMemo(() => {
    if (!dominantSphere || dominantSphere[1] < 0.1) return null;
    const level = getSoulLevel(dominantSphere[1]);
    return SOUL_PROSE[dominantSphere[0]]?.[level] ?? null;
  }, [dominantSphere]);

  const soulSecondaryProse = useMemo(() => {
    if (!secondarySphere || secondarySphere[1] < 0.2) return null;
    return SOUL_SECONDARY_PROSE[secondarySphere[0]] ?? null;
  }, [secondarySphere]);

  // ── PEOPLE: Culture + faction prose from content tables ────────

  const dominantCulture = useMemo(() => cultures.length > 0 ? cultures[0] : null, [cultures]);
  const dominantFaction = useMemo(() => factions.length > 0 ? factions[0] : null, [factions]);

  const cultureProse = useMemo(() => {
    if (!dominantCulture?.foundationBias) return null;
    // foundationBias is like "order" or "chaos" — map to foundationPair key
    // CULTURE_LOCATION_PROSE is keyed by foundationPair: "order_light", "order_darkness", etc.
    const bias = dominantCulture.foundationBias;
    const spheres = dominantCulture.dominantSpheres || [];
    const hasLight = spheres.includes('light' as SphereName);
    const hasDarkness = spheres.includes('darkness' as SphereName);
    let pairKey = bias;
    if (hasLight) pairKey = `${bias}_light`;
    else if (hasDarkness) pairKey = `${bias}_darkness`;
    else pairKey = `${bias}_light`; // default

    const templates = CULTURE_LOCATION_PROSE[pairKey];
    if (!templates) return null;
    return pickFromArray(templates, hexSeed + hashString(dominantCulture.cultureId));
  }, [dominantCulture, hexSeed]);

  const factionProse = useMemo(() => {
    if (!dominantFaction) return null;
    const template = pickFromArray(FACTION_CONTROL_PROSE, hexSeed + hashString(dominantFaction.factionId));
    if (!template) return null;
    return template.replace(/\{faction\}/g, dominantFaction.factionName);
  }, [dominantFaction, hexSeed]);

  // ── Location + agent prose via generateEntityProse ─────────────

  const locationProse = useMemo(() => {
    const result: Record<string, string> = {};
    for (const loc of locations) {
      const prose = generateEntityProse(loc.id, graph, seed, 'summary', tick);
      if (prose) result[loc.id] = prose;
    }
    return result;
  }, [locations, graph, seed, tick]);

  // ── Separate parent locations from sublocations ─────────────
  const { parentLocations, sublocationsByParent, orphanSublocations } = useMemo(() => {
    const parents: GraphNode[] = [];
    const subsByParent: Record<string, GraphNode[]> = {};
    const orphans: GraphNode[] = [];
    const locationIds = new Set(locations.map(l => l.id));

    for (const loc of locations) {
      const parentId = (loc.properties as Record<string, unknown>)?.parentLocationId as string | undefined;
      if (parentId && locationIds.has(parentId)) {
        if (!subsByParent[parentId]) subsByParent[parentId] = [];
        subsByParent[parentId].push(loc);
      } else if (parentId && !locationIds.has(parentId)) {
        // Parent not in this hex — show as orphan sublocation at top level
        orphans.push(loc);
      } else {
        parents.push(loc);
      }
    }
    return { parentLocations: parents, sublocationsByParent: subsByParent, orphanSublocations: orphans };
  }, [locations]);

  const allAgents = useMemo(() => {
    return Object.entries(agentsByLocation).flatMap(([locId, agents]) =>
      agents.map(a => ({ ...a, locationId: locId }))
    );
  }, [agentsByLocation]);

  /** Map locationId → location name for SoulCard display. */
  const locationNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const loc of locations) {
      map[loc.id] = loc.name;
    }
    return map;
  }, [locations]);

  const agentProse = useMemo(() => {
    const result: Record<string, string> = {};
    for (const agent of allAgents) {
      const prose = generateEntityProse(agent.id, graph, seed, 'summary', tick);
      if (prose) result[agent.id] = prose;
    }
    return result;
  }, [allAgents, graph, seed, tick]);

  // ── RUINS: Historical culture resolvers ────────────────────────

  const historyLayers = useMemo(() => {
    if (!regionData?.regionId) return [];
    return historicalCultureResolver(regionData.regionId, graph, seed);
  }, [regionData, graph, seed]);

  const etymologyLayers = useMemo(() => {
    if (!regionData?.regionId) return [];
    return regionEtymologyResolver(regionData.regionId, graph, seed);
  }, [regionData, graph, seed]);

  const explorationHooks = useMemo(() => {
    if (!regionData?.historicalCulture?.ruinDescriptors) return [];
    return regionData.historicalCulture.ruinDescriptors.slice(0, 3).map(desc =>
      `The ${desc} have not been fully explored. What remains within may reward — or punish — the curious.`
    );
  }, [regionData]);

  // ── HERO subtitle composition ──────────────────────────────────

  const heroSubtitle = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${terrainLabel} at ${hexCol}, ${hexRow}`);
    if (dominantCulture) parts.push(dominantCulture.cultureName);
    if (dominantFaction) parts.push(dominantFaction.factionName);
    return parts.join(' · ');
  }, [terrainLabel, hexCol, hexRow, dominantCulture, dominantFaction]);

  // ── Fog of war ─────────────────────────────────────────────────

  if (lineOfSight === 'none') {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-abyss)' }}>
        <div style={{ textAlign: 'center', maxWidth: '300px' }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-lg)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Unknown Territory
          </h3>
          <p style={{
            fontFamily: 'var(--font-prose)',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.7,
            marginTop: '12px',
          }}>
            This land lies beyond your sight. Send your avatar closer, or scry to pierce the veil.
          </p>
        </div>
      </div>
    );
  }

  // ── Prose style constants ──────────────────────────────────────

  const proseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-prose)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    lineHeight: 1.8,
    fontStyle: 'italic',
    margin: '0 0 16px 0',
  };

  const markerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    margin: '0 0 20px 0',
  };

  const ruleStyle: React.CSSProperties = {
    flex: 1,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, var(--border-gold-strong), transparent)',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xs)',
    color: 'var(--accent-gold)',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    whiteSpace: 'nowrap',
  };

  const playBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    background: 'none',
    border: '1px solid var(--border-subtle)',
    borderRadius: '50%',
    cursor: isLoading ? 'wait' : 'pointer',
    color: isSpeaking ? 'var(--accent-gold)' : 'var(--text-tertiary)',
    padding: 0,
    flexShrink: 0,
    transition: 'color 0.2s, border-color 0.2s',
  };

  const renderPlayBtn = (ref: React.RefObject<HTMLDivElement | null>, chapterName: string) =>
    narrationEnabled ? (
      <button
        onClick={() => handleNarrateChapter(ref)}
        title={isSpeaking ? 'Stop narration' : isLoading ? 'Loading...' : `Narrate ${chapterName}`}
        aria-label={isSpeaking ? 'Stop narration' : `Narrate ${chapterName}`}
        style={playBtnStyle}
      >
        {isLoading ? (
          <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
        ) : isSpeaking ? (
          <Square size={8} />
        ) : (
          <Play size={10} style={{ marginLeft: '1px' }} />
        )}
      </button>
    ) : null;

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
        padding: '24px 24px 160px 24px',
      }}
    >
    <div ref={chronicleRef} style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <div className="chronicle-hero" style={{ marginBottom: '32px', textAlign: 'center' }}>
        {/* Concept Art Banner (16:9) */}
        <div style={{
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--border-gold)',
          marginBottom: '16px',
          position: 'relative',
        }}>
          <img
            src={conceptArtUrl}
            alt={terrainLabel}
            data-testid="chronicle-concept-art"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: lineOfSight === 'partial' ? 0.5 : 0.95,
              transition: 'opacity 0.3s ease',
            }}
          />
          {/* Gradient overlay for text legibility */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            pointerEvents: 'none',
          }} />
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--text-primary)',
          margin: '0 0 8px 0',
          letterSpacing: '0.06em',
        }}>
          {regionData?.regionName ?? terrainLabel}
        </h2>
        <div className="chronicle-subtitle" style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--accent-gold)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}>
          {heroSubtitle}
        </div>
        <div style={{
          margin: '16px auto 0',
          maxWidth: '200px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--border-gold-strong), transparent)',
        }} />

      </div>

      {/* ─── THE LAND ─────────────────────────────────────────────────────── */}
      <div ref={landRef} className="chronicle-layer" style={{
        marginBottom: '40px',
        animation: 'fadeIn 0.6s ease-out 0.1s both',
      }}>
        <div className="chronicle-marker" style={markerStyle}>
          <div style={ruleStyle} />
          <span style={labelStyle}>The Land</span>
          {renderPlayBtn(landRef, 'The Land')}
          <div style={ruleStyle} />
        </div>
        <p className="chronicle-prose drop-cap" style={proseStyle}>
          {landProse1}
        </p>
        {landProse2 && (
          <p className="chronicle-prose" style={proseStyle}>
            {landProse2}
          </p>
        )}

        {/* Geographic region prose */}
        {geoRegionLayers.length > 0 && (
          <p className="chronicle-prose" style={proseStyle}>
            {geoRegionLayers[0].text}
          </p>
        )}

        {/* Resource prose */}
        {resourceProse && (
          <p className="chronicle-prose" style={proseStyle}>
            {resourceProse}
          </p>
        )}

        {/* Resource tags */}
        {hexResources.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            margin: '8px 0 0 0',
          }}>
            {hexResources.map(([type, inst]) => {
              const icon = RESOURCE_ICONS[type] ?? '◆';
              const label = getAbundanceLabel(inst.quantity);
              return (
                <div
                  key={type}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '3px 8px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                    textTransform: 'capitalize',
                    opacity: label === 'scarce' ? 0.6 : 1,
                  }}
                >
                  <span>{icon}</span>
                  <span>{type}</span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>· {label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── THE SOUL ─────────────────────────────────────────────────────── */}
      <div ref={soulRef} className="chronicle-layer" style={{
        marginBottom: '40px',
        animation: 'fadeIn 0.6s ease-out 0.2s both',
      }}>
        <div className="chronicle-marker" style={markerStyle}>
          <div style={ruleStyle} />
          <span style={labelStyle}>The Soul</span>
          {renderPlayBtn(soulRef, 'The Soul')}
          <div style={ruleStyle} />
        </div>

        {dominantSphereProse && (
          <p className="chronicle-prose drop-cap" style={proseStyle}>
            {dominantSphereProse}
          </p>
        )}

        {secondarySphereProse && (
          <p className="chronicle-prose" style={proseStyle}>
            {secondarySphereProse}
          </p>
        )}

        {/* IPK Soul paragraph — sphere names rendered as interactive keywords */}
        {soulAffinityProse && (
          <p className="chronicle-prose" data-testid="soul-affinity-prose" style={{ ...proseStyle, marginTop: '4px' }}>
            {renderProseWithIPK(soulAffinityProse)}
            {soulSecondaryProse && (
              <>{' '}{renderProseWithIPK(soulSecondaryProse)}</>
            )}
          </p>
        )}

        {topSpheres.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            margin: 0,
          }}>
            {topSpheres.map(([sphereName, sphereValue]) => {
              const color = getSphereColor(sphereName);
              const label = getSphereLabel(sphereValue);
              return (
                <div
                  key={sphereName}
                  className="sphere-pill"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-surface)',
                    border: `1px solid ${color}`,
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                    textTransform: 'capitalize',
                    opacity: label === 'trace' ? 0.55 : 1,
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: color,
                    }}
                  />
                  {sphereName} · {label}
                </div>
              );
            })}
          </div>
        )}

        {/* Individual souls present at this hex */}
        {allAgents.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}>
              Souls Present
            </div>
            {allAgents.map(agent => {
              const primarySphere = (agent.properties as any)?.primarySphere as SphereName | undefined;
              const sphereColor = primarySphere ? getSphereColor(primarySphere) : '#7a6e60';
              const archetypeName = (agent.properties as any)?.narrativeArchetype ?? undefined;
              const locName = locationNameById[agent.locationId] ?? 'wandering';
              const flavor = agentProse[agent.id] ?? '';
              return (
                <SoulCard
                  key={agent.id}
                  name={agent.name}
                  locationName={locName}
                  sphereColor={sphereColor}
                  archetypeName={archetypeName}
                  flavorText={flavor}
                  onClick={() => onAgentClick(agent.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ─── THE PEOPLE ───────────────────────────────────────────────────── */}
      <div ref={peopleRef} className="chronicle-layer" style={{
        marginBottom: '40px',
        animation: 'fadeIn 0.6s ease-out 0.3s both',
      }}>
        <div className="chronicle-marker" style={markerStyle}>
          <div style={ruleStyle} />
          <span style={labelStyle}>The People</span>
          {renderPlayBtn(peopleRef, 'The People')}
          <div style={ruleStyle} />
        </div>

        {dominantCulture && cultureProse && (
          <p className="chronicle-prose drop-cap" style={proseStyle}>
            {cultureProse}
          </p>
        )}
        {dominantCulture && !cultureProse && (
          <p className="chronicle-prose drop-cap" style={proseStyle}>
            The {stripLeadingThe(dominantCulture.cultureName)} claim this land, their traditions shaping the settlement and its people.
          </p>
        )}

        {dominantFaction && factionProse && (
          <p className="chronicle-prose" style={proseStyle}>
            {factionProse}
          </p>
        )}
        {dominantFaction && !factionProse && (
          <p className="chronicle-prose" style={proseStyle}>
            Control rests with {dominantFaction.factionName}.
          </p>
        )}
      </div>

      {/* ─── THE PLACES ──────────────────────────────────────────────────── */}
      {(parentLocations.length > 0 || orphanSublocations.length > 0) && (
      <div ref={placesRef} className="chronicle-layer" style={{
        marginBottom: '40px',
        animation: 'fadeIn 0.6s ease-out 0.35s both',
      }}>
        <div className="chronicle-marker" style={markerStyle}>
          <div style={ruleStyle} />
          <span style={labelStyle}>The Places</span>
          {renderPlayBtn(placesRef, 'The Places')}
          <div style={ruleStyle} />
        </div>

        <div style={{ marginBottom: '16px' }}>
            {parentLocations.map(loc => {
              const agentsHere = agentsByLocation[loc.id] || [];
              const subtype = (loc.properties as any)?.locationSubtype ?? 'landmark';
              const flavorText = locationProse[loc.id] ?? '';
              const subs = sublocationsByParent[loc.id] || [];
              // Total agent count includes sublocation agents
              const subAgentCount = subs.reduce(
                (sum, sub) => sum + (agentsByLocation[sub.id]?.length ?? 0), 0
              );
              const totalAgents = agentsHere.length + subAgentCount;

              return (
                <LocationCard
                  key={loc.id}
                  name={loc.name}
                  subtype={subtype}
                  agentCount={totalAgents}
                  flavorText={flavorText}
                  onClick={() => onLocationClick(loc.id)}
                >
                  {/* Agents directly at this location */}
                  {agentsHere.length > 0 && (
                    <div style={{ paddingLeft: '26px', marginTop: '6px' }}>
                      {agentsHere.map(agent => {
                        const primarySphere = (agent.properties as any)?.primarySphere as SphereName | undefined;
                        const sphereColor = primarySphere ? getSphereColor(primarySphere) : '#7a6e60';
                        const archetypeName = (agent.properties as any)?.narrativeArchetype ?? undefined;
                        return (
                          <AgentEntry
                            key={agent.id}
                            name={agent.name}
                            sphereColor={sphereColor}
                            archetypeName={archetypeName}
                            onClick={() => onAgentClick(agent.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                  {/* Nested sublocations */}
                  {subs.length > 0 && (
                    <div style={{ paddingLeft: '26px', marginTop: '8px' }}>
                      {subs.map(sub => {
                        const subAgents = agentsByLocation[sub.id] || [];
                        const subFlavor = locationProse[sub.id] ?? '';
                        return (
                          <SubLocationEntry
                            key={sub.id}
                            name={sub.name}
                            flavorText={subFlavor}
                            onClick={() => onLocationClick(sub.id)}
                          >
                            {subAgents.length > 0 && (
                              <div style={{ marginTop: '4px' }}>
                                {subAgents.map(agent => {
                                  const primarySphere = (agent.properties as any)?.primarySphere as SphereName | undefined;
                                  const sphereColor = primarySphere ? getSphereColor(primarySphere) : '#7a6e60';
                                  const archetypeName = (agent.properties as any)?.narrativeArchetype ?? undefined;
                                  return (
                                    <AgentEntry
                                      key={agent.id}
                                      name={agent.name}
                                      sphereColor={sphereColor}
                                      archetypeName={archetypeName}
                                      onClick={() => onAgentClick(agent.id)}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </SubLocationEntry>
                        );
                      })}
                    </div>
                  )}
                </LocationCard>
              );
            })}
            {/* Orphan sublocations (parent not in this hex) shown at top level */}
            {orphanSublocations.map(loc => {
              const agentsHere = agentsByLocation[loc.id] || [];
              const subtype = (loc.properties as any)?.locationSubtype ?? 'landmark';
              const flavorText = locationProse[loc.id] ?? '';
              return (
                <LocationCard
                  key={loc.id}
                  name={loc.name}
                  subtype={subtype}
                  agentCount={agentsHere.length}
                  flavorText={flavorText}
                  onClick={() => onLocationClick(loc.id)}
                >
                  {agentsHere.length > 0 && (
                    <div style={{ paddingLeft: '26px', marginTop: '6px' }}>
                      {agentsHere.map(agent => {
                        const primarySphere = (agent.properties as any)?.primarySphere as SphereName | undefined;
                        const sphereColor = primarySphere ? getSphereColor(primarySphere) : '#7a6e60';
                        const archetypeName = (agent.properties as any)?.narrativeArchetype ?? undefined;
                        return (
                          <AgentEntry
                            key={agent.id}
                            name={agent.name}
                            sphereColor={sphereColor}
                            archetypeName={archetypeName}
                            onClick={() => onAgentClick(agent.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </LocationCard>
              );
            })}
          </div>
      </div>
      )}

      {/* ─── THE RUINS (conditional) ──────────────────────────────────────── */}
      {regionData?.historicalCulture && (
        <div ref={ruinsRef} className="chronicle-layer" style={{
          marginBottom: '40px',
          animation: 'fadeIn 0.6s ease-out 0.4s both',
        }}>
          <div className="chronicle-marker" style={markerStyle}>
            <div style={ruleStyle} />
            <span style={labelStyle}>The Ruins</span>
            {renderPlayBtn(ruinsRef, 'The Ruins')}
            <div style={ruleStyle} />
          </div>

          {historyLayers.length > 0 && (
            <p className="chronicle-prose drop-cap" style={proseStyle}>
              {historyLayers[0]?.text}
            </p>
          )}

          {etymologyLayers.length > 0 && (
            <p className="chronicle-prose" style={proseStyle}>
              {etymologyLayers[0]?.text}
            </p>
          )}

          {regionData.historicalCulture.legacyFlavor && (
            <div className="quote-block">
              &ldquo;{regionData.historicalCulture.legacyFlavor}&rdquo;
              <span className="quote-attr">~ {stripLeadingThe(regionData.historicalCulture.name)}</span>
            </div>
          )}

          {explorationHooks.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              {explorationHooks.map((hook, idx) => (
                <ExplorationHook key={idx} text={hook} />
              ))}
            </div>
          )}

          {/* Discovered sublocations (revealed ruins layer) */}
          {hexRevelation?.ruins && (() => {
            const discoveredSubs = locations.flatMap(loc => {
              const edges = graph.getOutgoingEdges(loc.id, 'contains');
              return edges
                .map(e => graph.getNode(e.target))
                .filter((n): n is GraphNode => n != null && n.type === 'location' && n.properties.hidden !== true);
            });
            if (discoveredSubs.length === 0) return null;
            return (
              <div style={{ marginTop: '16px' }}>
                <p className="chronicle-prose" style={{ ...proseStyle, fontStyle: 'italic', opacity: 0.8 }}>
                  Discovered sites:
                </p>
                {discoveredSubs.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => onLocationClick(sub.id)}
                    style={{
                      padding: '4px 8px',
                      marginTop: '4px',
                      cursor: 'pointer',
                      opacity: 0.9,
                      fontSize: '13px',
                      color: '#D4A574',
                    }}
                  >
                    🏛 {sub.name}
                    {sub.properties.subtype && (
                      <span style={{ opacity: 0.6, marginLeft: '8px' }}>
                        ({String(sub.properties.subtype).replace(/_/g, ' ')})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── DIVINE PRESENCE (control effects, TB-049) ──────────────────── */}
      {controlEffects && controlEffects.length > 0 && (
        <div className="chronicle-layer" style={{
          marginBottom: '40px',
          animation: 'fadeIn 0.6s ease-out 0.5s both',
        }}>
          <div className="chronicle-marker" style={markerStyle}>
            <div style={ruleStyle} />
            <span style={labelStyle}>Divine Presence</span>
            <div style={ruleStyle} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {controlEffects.map(effect => (
              <div
                key={effect.effectId}
                style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      {effect.templateId.replace('hex.', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {effect.narrativeTemplates.active}
                    </div>
                  </div>
                  {onReleaseEffect && (
                    <button
                      onClick={() => onReleaseEffect(effect.effectId)}
                      style={{
                        background: 'var(--bg-deep)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title="Voluntarily release this effect"
                    >
                      Release
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  <span>
                    Cost: {Object.entries(effect.perTickCost).map(([sphere, cost]) => `${cost}/${sphere}`).join(', ') || 'free'}/tick
                  </span>
                  {effect.perTickIncome && Object.keys(effect.perTickIncome).length > 0 && (
                    <span style={{ color: 'var(--accent-gold)' }}>
                      Income: {Object.entries(effect.perTickIncome).map(([sphere, inc]) => `+${inc}/${sphere}`).join(', ')}/tick
                    </span>
                  )}
                  <span>{effect.ticksActive} ticks active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
});
