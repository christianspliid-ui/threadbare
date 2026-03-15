import type { SphereName, TerrainType } from '../types';

export interface HistoricalCultureTemplate {
  id: string;
  name: string;
  foundationBias?: string;
  sphereAffinities?: SphereName[];
  biomePreference?: TerrainType;
  ruinDescriptors: string[];
  legacyFlavor: string;
}

// ─── Tunable Constants (NFP #1) ──────────────────────────────────

export const HISTORICAL_CULTURE_COUNT = { min: 2, max: 4 };
export const HISTORICAL_TERRITORY_COVERAGE = 0.85;

// ─── Templates ───────────────────────────────────────────────────

export const HISTORICAL_CULTURE_TEMPLATES: HistoricalCultureTemplate[] = [
  {
    id: 'pale_builders',
    name: 'The Pale Builders',
    foundationBias: 'order',
    sphereAffinities: ['matter', 'time'],
    ruinDescriptors: ['white stone walls', 'geometric foundations', 'precise arches', 'dust-filled cisterns'],
    legacyFlavor: 'They built to last forever. Their empire did not.',
  },
  {
    id: 'root_speakers',
    name: 'The Root-Speakers',
    foundationBias: 'light',
    sphereAffinities: ['life', 'spirit'],
    biomePreference: 'dense_forest',
    ruinDescriptors: ['tree-grown walls', 'living stone altars', 'vine-choked doorways', 'root-carved glyphs'],
    legacyFlavor: 'They spoke to the deep roots, and the roots answered — until they didn\'t.',
  },
  {
    id: 'ash_crowned',
    name: 'The Ash-Crowned',
    foundationBias: 'darkness',
    sphereAffinities: ['entropy', 'force'],
    ruinDescriptors: ['scorched battlements', 'obsidian pillars', 'ash-filled halls', 'iron-bound gates'],
    legacyFlavor: 'They crowned themselves in ash and called it glory.',
  },
  {
    id: 'tide_callers',
    name: 'The Tide-Callers',
    foundationBias: 'chaos',
    sphereAffinities: ['energy', 'mind'],
    biomePreference: 'coast',
    ruinDescriptors: ['salt-eaten towers', 'tidal channels', 'coral-crusted docks', 'wave-carved cellars'],
    legacyFlavor: 'They read the tides like scripture. The sea took them anyway.',
  },
  {
    id: 'iron_reclaimers',
    name: 'The Iron Reclaimers',
    foundationBias: 'order',
    sphereAffinities: ['force', 'matter'],
    biomePreference: 'mountains',
    ruinDescriptors: ['deep mine shafts', 'iron-riveted gates', 'forge-scarred stone', 'collapsed tunnels'],
    legacyFlavor: 'They dug too deep for metal that was never meant to be found.',
  },
  {
    id: 'dream_weavers',
    name: 'The Dream-Weavers',
    foundationBias: 'light',
    sphereAffinities: ['mind', 'spirit'],
    ruinDescriptors: ['crystal spires', 'shimmering murals', 'echo chambers', 'meditation alcoves'],
    legacyFlavor: 'They built a civilization in dreams and forgot to wake.',
  },
  {
    id: 'bone_keepers',
    name: 'The Bone-Keepers',
    foundationBias: 'darkness',
    sphereAffinities: ['entropy', 'life'],
    biomePreference: 'swamp',
    ruinDescriptors: ['ossuary walls', 'bone-inlaid paths', 'preserved burial mounds', 'peat-stained crypts'],
    legacyFlavor: 'They honored every death. In the end there were too many to honor.',
  },
  {
    id: 'star_readers',
    name: 'The Star-Readers',
    foundationBias: 'chaos',
    sphereAffinities: ['time', 'energy'],
    biomePreference: 'plateau',
    ruinDescriptors: ['observatory domes', 'astral charts etched in stone', 'collapsed orreries', 'sky-aligned corridors'],
    legacyFlavor: 'They mapped the heavens perfectly. They did not see what was coming from below.',
  },
];
