/**
 * Magic Glow Tiles — experimental radiant-core sphere color visualization.
 * Access via ?view=glow in the URL.
 *
 * Each sphere uses 4 color layers (core, mid, accent, deep) with layered
 * box-shadows, offset radial gradients, and screen-blended overlays for
 * multi-hue depth — no flat white centers.
 *
 * Technique references:
 * - Layered box-shadow bloom: https://codersblock.com/blog/creating-glow-effects-with-css/
 * - Multi-gradient orbs: https://codepen.io/HomesteadMovies/pen/emOdgYa
 * - Multi-hue blending: mix-blend-mode screen + offset radial-gradients
 */

interface SphereColors {
  name: string;
  form: string;
  /** Brightest saturated core */
  core: string;
  /** Secondary tone — shifted hue or lighter variant */
  mid: string;
  /** Tertiary accent — different hue for multi-color depth */
  accent: string;
  /** Deep shadow tone — very dark version of the hue */
  deep: string;
}

const FOUNDATION_SPHERES: SphereColors[] = [
  { name: 'Chaos', form: 'Fractals & turbulent swirls', core: '#8a2be2', mid: '#c44dff', accent: '#ff2299', deep: '#2a0845' },
  { name: 'Order', form: 'Geometric grids & tessellations', core: '#d4af37', mid: '#ffe066', accent: '#cc7722', deep: '#3d2e00' },
  { name: 'Light', form: 'Expanding aureoles & radiant beams', core: '#ffeb99', mid: '#fff5cc', accent: '#aaddff', deep: '#4a3d10' },
  { name: 'Darkness', form: 'Absorbing voids with rim-glow', core: '#4a3a8a', mid: '#7a5fbf', accent: '#225566', deep: '#0d0a1a' },
];

const CREATION_SPHERES: SphereColors[] = [
  { name: 'Force', form: 'Sharp directional streaks', core: '#ff4444', mid: '#ff7a5c', accent: '#ff6600', deep: '#4a0000' },
  { name: 'Matter', form: 'Crystalline lattices, hex facets', core: '#c4956a', mid: '#dab088', accent: '#7788aa', deep: '#3a2510' },
  { name: 'Energy', form: 'Radiating spikes, star-bursts', core: '#ffd700', mid: '#ffe44d', accent: '#ff8800', deep: '#4a3800' },
  { name: 'Life', form: 'Organic branching, mycelium', core: '#00cc55', mid: '#33ff77', accent: '#00aacc', deep: '#003a15' },
  { name: 'Mind', form: 'Neural dendrites, concentric rings', core: '#2288ff', mid: '#44aaff', accent: '#00ddff', deep: '#001a4a' },
  { name: 'Spirit', form: 'Ascending wisps, ethereal ribbons', core: '#aa44dd', mid: '#cc66ff', accent: '#ff44aa', deep: '#2a0045' },
  { name: 'Time', form: 'Concentric ripples, echoes', core: '#ff9933', mid: '#ffb355', accent: '#cc4422', deep: '#4a2800' },
  { name: 'Entropy', form: 'Fracturing, scattering particles', core: '#5a7a8a', mid: '#7a9aaa', accent: '#6655aa', deep: '#1a2a35' },
];

function GlowTile({ name, core, mid, accent, deep, form }: SphereColors) {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-xl"
      style={{ background: '#050505', border: '1px solid #111' }}
    >
      {/* Outer glow halo — sits behind the orb */}
      <div className="relative" style={{ width: 96, height: 96 }}>
        {/* Atmospheric bloom — primary hue */}
        <div
          className="absolute rounded-full"
          style={{
            inset: -20,
            background: `radial-gradient(circle, ${core}30 0%, transparent 70%)`,
            filter: `blur(12px)`,
          }}
        />
        {/* Atmospheric bloom — accent hue, offset */}
        <div
          className="absolute rounded-full"
          style={{
            inset: -16,
            background: `radial-gradient(circle at 70% 65%, ${accent}25 0%, transparent 60%)`,
            filter: `blur(14px)`,
          }}
        />
        {/* Main orb */}
        <div
          className="absolute inset-0 rounded-full transition-transform hover:scale-110 duration-300"
          style={{
            background: [
              // Primary highlight — off-center upper-left
              `radial-gradient(circle at 35% 35%, ${mid} 0%, transparent 45%)`,
              // Accent hue — off-center lower-right for multi-hue depth
              `radial-gradient(circle at 68% 65%, ${accent}aa 0%, transparent 45%)`,
              // Core color — slightly off-center
              `radial-gradient(circle at 55% 55%, ${core} 0%, transparent 55%)`,
              // Base sphere gradient — core to deep to black edge
              `radial-gradient(circle at 50% 50%, ${core}cc 0%, ${deep} 75%, #000 100%)`,
            ].join(', '),
            boxShadow: [
              // Tight inner glow — core
              `inset 0 0 15px ${core}80`,
              // Specular highlight — mid tone, off-center
              `inset 8px 8px 20px ${mid}60`,
              // Accent inner glow — opposite side for color contrast
              `inset -6px -4px 18px ${accent}40`,
              // Tight outer glow — core
              `0 0 8px 2px ${core}90`,
              // Medium bloom — core
              `0 0 25px 5px ${core}50`,
              // Accent outer bloom — offset for hue separation
              `4px 3px 20px 4px ${accent}30`,
              // Wide atmospheric bloom — core
              `0 0 60px 15px ${core}25`,
            ].join(', '),
            border: `1px solid ${core}40`,
          }}
        >
          {/* Hot-spot highlight — small, off-center, tinted (not white) */}
          <div
            className="absolute rounded-full"
            style={{
              width: 20,
              height: 20,
              top: '22%',
              left: '28%',
              background: `radial-gradient(circle, ${mid}cc 0%, transparent 70%)`,
              filter: 'blur(4px)',
            }}
          />
          {/* Accent color overlay — screen-blended for additive light mixing */}
          <div
            className="absolute rounded-full"
            style={{
              width: 32,
              height: 32,
              bottom: '15%',
              right: '12%',
              background: `radial-gradient(circle, ${accent}88 0%, transparent 70%)`,
              filter: 'blur(6px)',
              mixBlendMode: 'screen',
            }}
          />
        </div>
      </div>
      <span
        className="mt-4 font-bold tracking-wider uppercase text-xs"
        style={{ color: core }}
      >
        {name}
      </span>
      <span className="text-gray-500 font-mono text-[10px] mt-1">{core}</span>
      <span className="text-gray-600 text-[9px] mt-1 text-center max-w-[100px] leading-tight">
        {form}
      </span>
    </div>
  );
}

export function MagicGlowTiles() {
  return (
    <div className="min-h-screen bg-black p-10">
      <h1
        className="text-center text-2xl font-bold tracking-widest uppercase mb-2"
        style={{ fontFamily: 'Cinzel, serif', color: '#d4af37' }}
      >
        Threadbaerer
      </h1>
      <p className="text-center text-gray-500 text-sm mb-10">
        Magic Glow Tiles — Radiant Core Effect
      </p>

      {/* Foundation Spheres */}
      <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-4 text-center">
        Foundation Spheres
      </h2>
      <div className="flex flex-wrap gap-8 justify-center items-center mb-12">
        {FOUNDATION_SPHERES.map((s) => (
          <GlowTile key={s.name} {...s} />
        ))}
      </div>

      {/* Creation Spheres */}
      <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-4 text-center">
        Creation Spheres
      </h2>
      <div className="flex flex-wrap gap-8 justify-center items-center">
        {CREATION_SPHERES.map((s) => (
          <GlowTile key={s.name} {...s} />
        ))}
      </div>
    </div>
  );
}
