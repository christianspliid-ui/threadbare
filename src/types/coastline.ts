/** A 2D point in pixel/SVG coordinate space. */
export interface Point2D {
  x: number;
  y: number;
}

/** A closed contour loop — array of pixel-space points. */
export type ContourLoop = Point2D[];

/** Output of the coastline computation pipeline. */
export interface CoastlineData {
  /** Land boundary contour loops (at main threshold). */
  loops: ContourLoop[];
  /** Coastal shallows contour loops (at lower threshold — wider than land). */
  shallowLoops: ContourLoop[];
}

/** Tunable coastline rendering parameters. */
export interface CoastlineConfig {
  /** Quartic falloff radius as a multiplier of hexSize. Default: 1.8 */
  blobRadius: number;
  /** Iso-contour threshold for land boundary. Default: 0.35 */
  threshold: number;
  /** Chaikin corner-cutting passes for smoothing. Default: 2 */
  smoothPasses: number;
  /** Noise displacement amplitude (organic irregularity). Default: 0.02 */
  displacement: number;
  /** Noise frequency scale. Default: 0.02 */
  noiseScale: number;
  /** Threshold offset for the shallows band (shallowThreshold = threshold - shallowWidth). Default: 0.19 */
  shallowWidth: number;
  /** Scalar field grid resolution in pixels. Lower = finer but slower. Default: 4 */
  fieldResolution: number;
  /** Minimum points in a contour loop (filters noise artifacts). Default: 20 */
  minLoopPoints: number;
  /** Color palette. */
  colors: {
    deepWater: string;
    shallows: string;
    coastEdge: string;
  };
}

/** Production-tuned defaults matching prototype at preferred settings. */
export const COASTLINE_DEFAULTS: CoastlineConfig = {
  blobRadius: 1.8,
  threshold: 0.35,
  smoothPasses: 2,
  displacement: 0.02,
  noiseScale: 0.02,
  shallowWidth: 0.19,
  fieldResolution: 4,
  minLoopPoints: 20,
  colors: {
    deepWater: '#12243a',
    shallows: '#1e4858',
    coastEdge: '#5a4a28', // VS-002: darkened from #e3d08a (~55%L) to ~25%L — within STYLE.md 40% world surface ceiling
  },
};
