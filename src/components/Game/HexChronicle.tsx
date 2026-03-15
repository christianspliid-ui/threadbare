import { memo, useMemo } from 'react';
import type { TerrainType, SphereName } from '../../types';
import type { LineOfSight, SphereInfluence, HexCultureSummary, HexFactionSummary } from '../../engine/hexZoom';
import type { HexRegionData } from '../../engine/hexRegion';
import type { WorldGraph } from '../../engine/graph';
import type { GraphNode } from '../../types/graph';
import { getSphereColor } from '../../data/sphereIcons';
import { LocationCard, SoulCard, EventBlock, ExplorationHook } from './chronicle';
import { historicalCultureResolver, regionEtymologyResolver } from '../../engine/proseResolvers';

// ── Terrain flavor text ──────────────────────────────────────────────
const TERRAIN_FLAVOR: Record<string, string> = {
  ocean: 'Vast waters stretch to every horizon, deep and uncharted. Only the most daring — or desperate — venture far from shore.',
  coastal_shallows: 'Warm shallows lap at the edges of the land, teeming with life where salt and fresh water mingle.',
  lake: 'Still waters mirror the sky, hiding depths that have swallowed secrets since before the first age.',
  river: 'A ribbon of swift water carves through the land, carrying trade, stories, and the occasional body.',
  grassland: 'Endless grasses roll under wind and sky. Herds move like slow rivers across the open plain.',
  farmland: 'Terraced fields and low stone walls mark the patient work of generations who bent the land to their will.',
  savanna: 'Sun-baked earth and scattered thorn trees define a land of dry seasons and sudden, violent rains.',
  steppe: 'Harsh wind-scoured flatlands where only the tough survive. Nomadic trails crisscross the sparse grass.',
  temperate_forest: 'Broad-leafed canopy shifts from emerald to gold with the turning seasons. Ancient paths thread between gnarled trunks.',
  dense_forest: 'The canopy swallows all light. In the perpetual twilight below, strange things grow and stranger things watch.',
  boreal_forest: 'Evergreens stand sentinel in frozen silence. The air tastes of pine and coming snow.',
  jungle: 'Green chaos. Vines strangle trees that strangle other trees. Life here is loud, wet, and ruthlessly competitive.',
  swamp: 'Murky water hides what lies beneath. The air is thick with insects and the smell of slow decay.',
  marsh: 'Spongy ground gives way without warning. Mist clings to the hollows, and the dead are preserved perfectly in the peat.',
  hills: 'Rolling highlands offer long views and defensible ground. Shepherds and bandits share these slopes uneasily.',
  mountains: 'Stone peaks claw at the sky, wreathed in cloud and legend. Passes are few, and each one is worth dying for.',
  plateau: 'A high flat expanse above the world, wind-scoured and remote. Those who live here answer to no lowland lord.',
  badlands: 'Eroded spires and razor ridges of rust-colored stone. Nothing grows here but lichen, resentment, and echoes.',
  desert: 'Sand and silence. The sun bleaches bone and memory alike. Oases are the only currency that matters.',
  tundra: 'Frozen earth stretches to the edge of sight. In summer the permafrost weeps; in winter it locks tight as a tomb.',
  glacier: 'Ancient ice creeps forward with geological patience, grinding mountains to dust beneath its weight.',
  volcano: 'The earth here is restless. Fumaroles hiss, hot springs bubble, and the ground shakes with subterranean fury.',
  forested_hills: 'Wooded hills rise in green waves, their slopes hiding deep ravines and old stone ruins. Every hollow shelters something.',
  great_home_trees: 'Trees of impossible scale rise like living towers. Entire communities dwell among the branches.',
  broken_lands: 'Shattered terrain — fissures, rubble, and the scars of some ancient cataclysm. The land itself seems wounded.',
};

const FALLBACK_TERRAIN_FLAVOR = 'An unremarkable stretch of land, waiting for someone to give it meaning.';

// ── Sphere flavor ────────────────────────────────────────────────────
const SPHERE_FLAVOR: Record<string, string> = {
  force: 'Force stirs — a pressure in the air, a taste of iron.',
  matter: 'The stone itself hums with latent potential.',
  energy: 'Crackling currents thread the ground like veins.',
  life: 'Growth is relentless here; even cut stone sprouts moss overnight.',
  mind: 'Thoughts echo strangely, as if the land itself is listening.',
  spirit: 'The veil between worlds thins. Whispers carry from somewhere close and nowhere at all.',
  time: 'Moments stretch and compress — the air feels thick with history.',
  entropy: 'Decay creeps at the edges. Things left here don\'t last.',
  chaos: 'Nothing stays settled. Even the rules of nature feel like suggestions.',
  order: 'Everything here tends toward pattern — paths straighten, stones align.',
  light: 'A warm radiance lingers, even when no sun is visible.',
  darkness: 'Shadows pool in corners and the light seems reluctant to stay.',
};

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
  onLocationDoubleClick: (locationId: string) => void;
  onAgentClick: (agentId: string) => void;
  graph: WorldGraph;
  seed: number;
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
  onLocationDoubleClick,
  onAgentClick,
  graph,
  seed,
}: HexChronicleProps) {
  // Terrain label for display
  const terrainLabel = useMemo(() => {
    return terrain
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [terrain]);

  // Terrain flavor text
  const terrainFlavorText = useMemo(() => {
    return TERRAIN_FLAVOR[terrain] ?? FALLBACK_TERRAIN_FLAVOR;
  }, [terrain]);

  // Dominant sphere from influence
  const dominantSphere = useMemo(() => {
    if (!sphereInfluence) return null;
    const entries = Object.entries(sphereInfluence) as [SphereName, number][];
    const sorted = entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0] : null;
  }, [sphereInfluence]);

  // Top 2-3 spheres for pills
  const topSpheres = useMemo(() => {
    if (!sphereInfluence) return [];
    const entries = Object.entries(sphereInfluence) as [SphereName, number][];
    return entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [sphereInfluence]);

  // Dominant culture and faction
  const dominantCulture = useMemo(() => cultures.length > 0 ? cultures[0] : null, [cultures]);
  const dominantFaction = useMemo(() => factions.length > 0 ? factions[0] : null, [factions]);

  // Flatten all agents with their location info
  const allAgents = useMemo(() => {
    return Object.entries(agentsByLocation).flatMap(([locId, agents]) =>
      agents.map(a => ({ ...a, locationId: locId }))
    );
  }, [agentsByLocation]);

  // Historical culture prose layers
  const historyLayers = useMemo(() => {
    if (!regionData?.regionId) return [];
    return historicalCultureResolver(regionData.regionId, graph, seed);
  }, [regionData, graph, seed]);

  // Region etymology prose layers
  const etymologyLayers = useMemo(() => {
    if (!regionData?.regionId) return [];
    return regionEtymologyResolver(regionData.regionId, graph, seed);
  }, [regionData, graph, seed]);

  // Exploration hooks from ruin descriptors
  const explorationHooks = useMemo(() => {
    if (!regionData?.historicalCulture?.ruinDescriptors) return [];
    return regionData.historicalCulture.ruinDescriptors.slice(0, 2).map(desc =>
      `The ${desc} have not been fully explored. What remains within may reward — or punish — the curious.`
    );
  }, [regionData]);

  // Fog of war case
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

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
        padding: '24px 24px 24px 24px',
      }}
    >
      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <div className="chronicle-hero" style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--text-primary)',
          margin: '0 0 8px 0',
          letterSpacing: '0.04em',
        }}>
          {regionData?.regionName ?? terrainLabel}
        </h2>
        <div className="chronicle-subtitle" style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {terrainLabel} · ({hexCol}, {hexRow})
        </div>
      </div>

      {/* ─── THE LAND LAYER ──────────────────────────────────────────────── */}
      <div className="chronicle-layer" style={{
        marginBottom: '40px',
        animation: 'fadeIn 0.6s ease-out 0.1s both',
      }}>
        <div className="chronicle-marker" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          margin: '0 0 20px 0',
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'var(--border-subtle)',
          }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}>
            The Land
          </span>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'var(--border-subtle)',
          }} />
        </div>
        <p className="chronicle-prose" style={{
          fontFamily: 'var(--font-prose)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
          fontStyle: 'italic',
          margin: 0,
        }}>
          {terrainFlavorText}
        </p>
      </div>

      {/* ─── THE SOUL LAYER ──────────────────────────────────────────────── */}
      <div className="chronicle-layer" style={{
        marginBottom: '40px',
        animation: 'fadeIn 0.6s ease-out 0.2s both',
      }}>
        <div className="chronicle-marker" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          margin: '0 0 20px 0',
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'var(--border-subtle)',
          }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}>
            The Soul
          </span>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'var(--border-subtle)',
          }} />
        </div>

        {dominantSphere && (
          <>
            <p className="chronicle-prose" style={{
              fontFamily: 'var(--font-prose)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              fontStyle: 'italic',
              margin: '0 0 16px 0',
            }}>
              {SPHERE_FLAVOR[dominantSphere[0]] ?? ''}
            </p>
          </>
        )}

        {topSpheres.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            margin: 0,
          }}>
            {topSpheres.map(([sphereName]) => (
              <div
                key={sphereName}
                className="sphere-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-surface)',
                  border: `1px solid ${getSphereColor(sphereName)}`,
                  borderRadius: '12px',
                  padding: '4px 10px',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  textTransform: 'capitalize',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getSphereColor(sphereName),
                  }}
                />
                {sphereName}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── THE PEOPLE LAYER ─────────────────────────────────────────────── */}
      <div className="chronicle-layer" style={{
        marginBottom: '40px',
        animation: 'fadeIn 0.6s ease-out 0.3s both',
      }}>
        <div className="chronicle-marker" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          margin: '0 0 20px 0',
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'var(--border-subtle)',
          }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}>
            The People
          </span>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'var(--border-subtle)',
          }} />
        </div>

        {dominantCulture && (
          <p className="chronicle-prose" style={{
            fontFamily: 'var(--font-prose)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            margin: '0 0 16px 0',
          }}>
            The {dominantCulture.cultureName} hold sway here, their traditions shaping the land and its people.
          </p>
        )}

        {dominantFaction && (
          <p className="chronicle-prose" style={{
            fontFamily: 'var(--font-prose)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            margin: '0 0 16px 0',
          }}>
            Control rests with the {dominantFaction.factionName}.
          </p>
        )}

        {/* Location cards */}
        {locations.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {locations.map(loc => {
              const agentsHere = agentsByLocation[loc.id] || [];
              const subtype = (loc.properties as any)?.locationSubtype ?? 'landmark';
              const flavorText = '';

              return (
                <LocationCard
                  key={loc.id}
                  name={loc.name}
                  subtype={subtype}
                  agentCount={agentsHere.length}
                  flavorText={flavorText}
                  onClick={() => onLocationClick(loc.id)}
                  onDoubleClick={() => onLocationDoubleClick(loc.id)}
                />
              );
            })}
          </div>
        )}

        {/* Soul cards */}
        {allAgents.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {allAgents.map(agent => {
              const archetypeName = (agent.properties as any)?.narrativeArchetype ?? undefined;
              const primarySphere = (agent.properties as any)?.primarySphere as SphereName | undefined;
              const sphereColor = primarySphere ? getSphereColor(primarySphere) : '#7a6e60';

              // Find location name
              const locationNode = locations.find(l => l.id === agent.locationId);
              const locationName = locationNode?.name ?? 'Unknown';

              const flavorText = '';

              return (
                <SoulCard
                  key={agent.id}
                  name={agent.name}
                  locationName={locationName}
                  sphereColor={sphereColor}
                  archetypeName={archetypeName}
                  flavorText={flavorText}
                  onClick={() => onAgentClick(agent.id)}
                />
              );
            })}
          </div>
        )}

        {/* Event blocks (empty for now) */}
      </div>

      {/* ─── THE RUINS LAYER (conditional) ───────────────────────────────── */}
      {regionData?.historicalCulture && (
        <div className="chronicle-layer" style={{
          marginBottom: '40px',
          animation: 'fadeIn 0.6s ease-out 0.4s both',
        }}>
          <div className="chronicle-marker" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            margin: '0 0 20px 0',
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'var(--border-subtle)',
            }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
            }}>
              The Ruins
            </span>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'var(--border-subtle)',
            }} />
          </div>

          <p className="chronicle-prose" style={{
            fontFamily: 'var(--font-prose)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            margin: '0 0 16px 0',
          }}>
            These lands once throned the {regionData.historicalCulture.name}. Their reign has passed,
            but their echoes linger in stone and shadow.
          </p>

          {historyLayers.length > 0 && (
            <p className="chronicle-prose" style={{
              fontFamily: 'var(--font-prose)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              margin: '0 0 16px 0',
            }}>
              {historyLayers[0]?.text}
            </p>
          )}

          {etymologyLayers.length > 0 && (
            <p className="chronicle-prose" style={{
              fontFamily: 'var(--font-prose)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              margin: '0 0 16px 0',
            }}>
              {etymologyLayers[0]?.text}
            </p>
          )}

          {regionData.historicalCulture.legacyFlavor && (
            <div className="epitaph-text" style={{
              fontFamily: 'var(--font-prose)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              lineHeight: 1.8,
              textAlign: 'center',
              margin: '16px 0',
              paddingLeft: '20px',
              paddingRight: '20px',
            }}>
              "{regionData.historicalCulture.legacyFlavor}"
            </div>
          )}

          {explorationHooks.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              {explorationHooks.map((hook, idx) => (
                <ExplorationHook key={idx} text={hook} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
