import type { StirringImage } from '../types/remembrance';

/**
 * THR-1989: whether the opening "What echoes?" screen asks for a pick. Off, the
 * flow opens on Origin and the stirring image is drawn from the run seed and
 * shown as Origin's backdrop. Set true to restore the four-picture choice.
 */
export const REMEMBRANCE_STIRRING_PICK_ENABLED = false;

/** THR-1989: the opening line, shown on whichever screen opens the flow. */
export const STIRRING_PROMPT = 'Something stirs in the void. What echoes?';

/** Placeholder gradients used when image assets haven't been generated yet */
export const STIRRING_PLACEHOLDERS: Record<string, { gradient: string; label: string }> = {
  'stirring.tangled-light':       { gradient: 'linear-gradient(135deg, #2a1f0a, #1a3a1a, #3a2a0a)', label: 'Tangled Light' },
  'stirring.fracturing-geometry': { gradient: 'linear-gradient(135deg, #1a1a3a, #2a1a2a, #0a1a2a)', label: 'Fracturing Geometry' },
  'stirring.dark-water':          { gradient: 'linear-gradient(135deg, #0a0a1a, #1a1a2a, #0a1a1a)', label: 'Dark Water' },
  'stirring.rising-embers':       { gradient: 'linear-gradient(135deg, #2a0a0a, #3a1a0a, #1a0a0a)', label: 'Rising Embers' },
};

export const STIRRING_IMAGES: StirringImage[] = [
  {
    id: 'stirring.tangled-light',
    imageAssetPath: '/assets/remembrance/stirring/tangled-light.jpg',
    fragmentClusters: ['growth', 'shelter', 'connection', 'life'],
  },
  {
    id: 'stirring.fracturing-geometry',
    imageAssetPath: '/assets/remembrance/stirring/fracturing-geometry.jpg',
    fragmentClusters: ['order', 'ambition', 'power', 'mind'],
  },
  {
    id: 'stirring.dark-water',
    imageAssetPath: '/assets/remembrance/stirring/dark-water.jpg',
    fragmentClusters: ['memory', 'loss', 'depth', 'ancient'],
  },
  {
    id: 'stirring.rising-embers',
    imageAssetPath: '/assets/remembrance/stirring/rising-embers.jpg',
    fragmentClusters: ['transformation', 'sacrifice', 'will', 'force'],
  },
];
