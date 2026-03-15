/**
 * @deprecated Replaced by HexChronicle + HexSidebar in the chronicle redesign (2026-03-15).
 * Kept for reference; safe to delete once chronicle is stable.
 */
import { memo, useMemo } from 'react';
import type { TerrainType, SphereName } from '../../types';
import type { LineOfSight, HexCultureSummary, HexFactionSummary, SphereInfluence } from '../../engine/hexZoom';
import { getSphereColor } from '../../data/sphereIcons';

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

const FALLBACK_FLAVOR = 'An unremarkable stretch of land, waiting for someone to give it meaning.';

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

interface HexFlavorPanelProps {
  terrain: TerrainType;
  lineOfSight: LineOfSight;
  sphereInfluence: SphereInfluence;
  cultures: HexCultureSummary[];
  factions: HexFactionSummary[];
  locationCount: number;
  agentCount: number;
}

export const HexFlavorPanel = memo(function HexFlavorPanel({
  terrain,
  lineOfSight,
  sphereInfluence,
  cultures,
  factions,
  locationCount,
  agentCount,
}: HexFlavorPanelProps) {
  const isHidden = lineOfSight === 'none';

  const terrainLabel = terrain
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const flavorText = TERRAIN_FLAVOR[terrain] ?? FALLBACK_FLAVOR;

  // Pick dominant sphere flavor (highest influence > 0)
  const dominantSphere = useMemo(() => {
    const entries = Object.entries(sphereInfluence) as [SphereName, number][];
    const sorted = entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0] : null;
  }, [sphereInfluence]);

  const dominantCulture = cultures.length > 0 ? cultures[0] : null;
  const dominantFaction = factions.length > 0 ? factions[0] : null;

  if (isHidden) {
    return (
      <div
        className="flex flex-col gap-3 p-4 h-full overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Unknown Territory
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          This land lies beyond your sight. Send your avatar closer, or scry to pierce the veil.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 p-4 h-full overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Terrain title */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-sm)',
          color: 'var(--accent-gold)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {terrainLabel}
      </h3>

      {/* Terrain flavor */}
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
        }}
      >
        {flavorText}
      </p>

      {/* Dominant sphere influence */}
      {dominantSphere && (
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getSphereColor(dominantSphere[0] as SphereName) }}
            />
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {dominantSphere[0]} Influence
            </span>
          </div>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              lineHeight: 1.6,
              paddingLeft: '0.875rem',
            }}
          >
            {SPHERE_FLAVOR[dominantSphere[0]] ?? ''}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="w-full h-px my-1" style={{ background: 'var(--border-subtle)' }} />

      {/* Culture */}
      {dominantCulture && (
        <div className="flex flex-col gap-1">
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Culture
          </span>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {dominantCulture.cultureName}
          </span>
          {dominantCulture.dominantSpheres.length > 0 && (
            <div className="flex gap-1 mt-0.5">
              {dominantCulture.dominantSpheres.map(s => (
                <div
                  key={s}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: getSphereColor(s) }}
                  title={s}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Faction */}
      {dominantFaction && (
        <div className="flex flex-col gap-1">
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Controlled by
          </span>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {dominantFaction.factionName}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="w-full h-px my-1" style={{ background: 'var(--border-subtle)' }} />

      {/* Summary stats */}
      <div className="flex flex-col gap-1">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {locationCount} location{locationCount !== 1 ? 's' : ''} · {agentCount} soul{agentCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
});
