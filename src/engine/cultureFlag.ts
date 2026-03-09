/**
 * Culture Flag Generator — procedural SVG flags for cultures.
 *
 * Generates deterministic heraldic flags based on culture identity:
 * - Foundation bias → shape vocabulary (chaos=jagged, order=geometric, light=radial, darkness=layered)
 * - Venerated spheres → primary color (first sphere's color from getSphereColor)
 * - Primary biome → motif glyph (mountain peak, wave, tree, sun, etc.)
 *
 * Output is a self-contained SVG string suitable for storing on culture graph nodes
 * or rendering as images in the UI.
 */

import type { CultureIdentity } from '../types/culture';
import { getSphereColor } from '../data/sphereIcons';

// ─── Seeded PRNG ──────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Biome Motifs ─────────────────────────────────────────────

const BIOME_MOTIFS: Record<string, string> = {
  // Mountain: sharp peak silhouette
  mountain: 'M50,20 L65,45 L35,45 Z',

  // Desert: rolling dunes
  desert: 'M30,40 Q40,30 50,40 Q60,50 70,40 L70,60 Q60,65 50,65 Q40,65 30,60 Z',

  // Forest: stylized trees
  forest: 'M30,50 L30,65 L25,60 L20,65 L25,50 L20,50 L25,40 L30,50 M70,50 L70,65 L65,60 L60,65 L65,50 L60,50 L65,40 L70,50',

  // Plains: horizontal waves
  plains: 'M20,45 Q30,40 40,45 Q50,50 60,45 Q70,40 80,45 L80,60 L20,60 Z',

  // Jungle: organic canopy
  jungle: 'M35,35 C30,30 40,25 45,30 C50,25 60,30 65,35 C65,35 55,45 50,45 C45,45 35,35 35,35 M30,50 L70,50 L70,65 L30,65 Z',

  // Coast: wave motif
  coast: 'M25,40 Q35,30 45,40 Q55,50 65,40 Q75,30 80,35 L80,60 L20,60 Z',

  // Swamp: twisted trees in water
  swamp: 'M25,45 L25,65 M50,35 L50,65 M75,45 L75,65 M25,50 Q37,48 50,50 Q63,48 75,50',

  // Tundra: icy formations
  tundra: 'M50,25 L58,40 L42,40 Z M45,45 L68,60 L22,60 Z M55,50 L60,58 L50,58 Z',

  // Urban: geometric buildings
  urban: 'M30,35 L45,35 L45,60 L30,60 Z M55,40 L70,40 L70,60 L55,60 Z M35,55 L40,55 M60,55 L65,55',

  // River/Water: flowing lines
  river: 'M30,35 Q40,40 50,35 Q60,30 70,35 L70,55 Q60,50 50,55 Q40,50 30,55 Z',

  // Volcano: cone with peak
  volcano: 'M50,20 L65,50 L35,50 Z M48,50 L52,50 L50,60 Z',

  // Fallback: simple diamond
  default: 'M50,20 L70,50 L50,80 L30,50 Z',
};

// ─── Foundation Shape Generators ────────────────────────────

/**
 * Chaos foundation: asymmetric, jagged, turbulent shapes.
 * Uses irregular polygons with random offsets.
 */
function generateChaosShapes(rng: () => number, color: string): string {
  const shapes: string[] = [];

  // Multiple irregular polygons scattered
  for (let i = 0; i < 3; i++) {
    const cx = 20 + rng() * 60;
    const cy = 20 + rng() * 60;
    const sides = 3 + Math.floor(rng() * 3); // 3-5 sided
    const radius = 8 + rng() * 12;

    const points: string[] = [];
    for (let j = 0; j < sides; j++) {
      const angle = (j / sides) * Math.PI * 2 + (rng() - 0.5) * 0.5;
      const r = radius * (0.5 + rng() * 0.5); // Variable radius for jagged effect
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    shapes.push(
      `<polygon points="${points.join(' ')}" fill="${color}" opacity="${0.5 + rng() * 0.4}"/>`
    );
  }

  return shapes.join('');
}

/**
 * Order foundation: geometric, symmetric, tessellated shapes.
 * Uses regular polygons, rectangles, and circles in grid patterns.
 */
function generateOrderShapes(rng: () => number, color: string): string {
  const shapes: string[] = [];

  // Regular polygons in orderly arrangement
  for (let x = 25; x <= 75; x += 25) {
    for (let y = 25; y <= 75; y += 25) {
      const shapeType = Math.floor((x + y) / 25) % 3;

      if (shapeType === 0) {
        // Circle
        shapes.push(
          `<circle cx="${x}" cy="${y}" r="8" fill="${color}" opacity="0.6"/>`
        );
      } else if (shapeType === 1) {
        // Rectangle
        shapes.push(
          `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" fill="${color}" opacity="0.6"/>`
        );
      } else {
        // Regular polygon (hexagon)
        const points: string[] = [];
        for (let j = 0; j < 6; j++) {
          const angle = (j / 6) * Math.PI * 2;
          const px = x + Math.cos(angle) * 8;
          const py = y + Math.sin(angle) * 8;
          points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }
        shapes.push(
          `<polygon points="${points.join(' ')}" fill="${color}" opacity="0.6"/>`
        );
      }
    }
  }

  return shapes.join('');
}

/**
 * Light foundation: radial, expanding, open shapes.
 * Uses circles and star-burst patterns emanating from center.
 */
function generateLightShapes(rng: () => number, color: string): string {
  const shapes: string[] = [];

  // Concentric circles from center
  for (let r = 5; r <= 30; r += 8) {
    shapes.push(
      `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="1.5" opacity="${0.8 - (r / 30) * 0.5}"/>`
    );
  }

  // Radiating spikes
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x1 = 50 + Math.cos(angle) * 20;
    const y1 = 50 + Math.sin(angle) * 20;
    const x2 = 50 + Math.cos(angle) * 35;
    const y2 = 50 + Math.sin(angle) * 35;
    shapes.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="1.5" opacity="0.7"/>`
    );
  }

  return shapes.join('');
}

/**
 * Darkness foundation: layered, enclosed, void-like shapes.
 * Uses concentric shapes and overlapping elements creating depth.
 */
function generateDarknessShapes(rng: () => number, color: string): string {
  const shapes: string[] = [];

  // Concentric circles with alternating fill
  for (let r = 30; r >= 5; r -= 8) {
    const fillColor = r % 16 === 0 ? color : 'rgba(0,0,0,0.3)';
    shapes.push(
      `<circle cx="50" cy="50" r="${r}" fill="${fillColor}" opacity="${0.7 + (Math.abs(r - 15) / 30) * 0.3}"/>`
    );
  }

  // Overlapping dark shapes creating void
  for (let i = 0; i < 3; i++) {
    const cx = 35 + rng() * 30;
    const cy = 35 + rng() * 30;
    const size = 8 + rng() * 12;
    shapes.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${size.toFixed(1)}" fill="rgba(0,0,0,0.5)" opacity="0.8"/>`
    );
  }

  return shapes.join('');
}

// ─── Main Flag Generator ───────────────────────────────────────

/**
 * Generate a deterministic SVG culture flag.
 *
 * @param identity Culture identity data
 * @param seed Seed for PRNG
 * @returns SVG string
 */
export function generateCultureFlag(identity: CultureIdentity, seed: number): string {
  const rng = mulberry32(seed);

  // Get primary color from first venerated sphere
  const primaryColor = identity.veneratedSpheres.length > 0
    ? getSphereColor(identity.veneratedSpheres[0])
    : '#d4a574'; // Fallback to amber

  // Get foundation shapes
  let foundationShapes = '';
  switch (identity.foundationBias) {
    case 'chaos':
      foundationShapes = generateChaosShapes(rng, primaryColor);
      break;
    case 'order':
      foundationShapes = generateOrderShapes(rng, primaryColor);
      break;
    case 'light':
      foundationShapes = generateLightShapes(rng, primaryColor);
      break;
    case 'darkness':
      foundationShapes = generateDarknessShapes(rng, primaryColor);
      break;
    default:
      foundationShapes = generateChaosShapes(rng, primaryColor);
  }

  // Get biome motif
  const motifPath = BIOME_MOTIFS[identity.primaryBiome] || BIOME_MOTIFS.default;

  // Background
  const backgroundFill = identity.foundationBias === 'darkness' ? '#1a1a1a' : '#2d2d2d';

  // Compose SVG
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="100" height="100" fill="${backgroundFill}"/>

  <!-- Foundation shapes -->
  ${foundationShapes}

  <!-- Biome motif -->
  <g class="motif" fill="${primaryColor}" opacity="0.9" filter="url(#glow)">
    <path d="${motifPath}"/>
  </g>
</svg>`;

  return svg;
}
