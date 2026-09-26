// extract-world.mjs — THROWAWAY prototype helper for THR-1236.
//
// Pulls the shipped vocabularies the item generator's tables stand on straight
// out of the Threadbearer repo (read-only), so the generator's words, tags,
// conditions and caps are the game's own rather than copies that drift.
//
// How: writes a tiny TypeScript entry into ./.build that imports the real
// modules, bundles it with the repo's own esbuild (output lands in ./.build,
// never in the repo), runs it, and writes ./world-vocab.json.
//
// Usage:  node extract-world.mjs [repoRoot]

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.argv[2] ?? 'C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator').replace(/\\/g, '/');
const BUILD = join(HERE, '.build');
mkdirSync(BUILD, { recursive: true });

const src = (p) => `${REPO}/src/${p}`;

const entry = `
import { SPHERE_VOCABULARY } from '${src('data/narrative-content')}';
import { ARTIFACT_LORE_PATTERNS, CULTURE_NAME_FRAGMENTS } from '${src('data/culture-content')}';
import { WORK_ROOTS_BY_REACH, WORK_ROOTS_BY_FOUNDATION } from '${src('data/work-name-content')}';
import { DOMAIN_WORD_SCALES } from '${src('data/domain-words')}';
import { FACTION_VOICE_BIBLE } from '${src('data/faction-voice-bible')}';
import { FACTION_DEFINITIONS } from '${src('data/faction-definitions')}';
import { MONSTER_FACTION_DEFINITIONS } from '${src('data/monster-faction-definitions')}';
import { CONDITION_TRAIT_DEFINITIONS } from '${src('data/condition-trait-content')}';
import { REWARD_POSSESSIONS, REWARD_CONDITIONS } from '${src('data/reward-attachment-catalog')}';
import { CONTENT_TAGS, REACH_TAG_DESCRIPTIONS, SPHERE_TAG_DESCRIPTIONS } from '${src('data/content-tags')}';
import { SPHERE_OPPOSITES, SPHERE_ALLIES } from '${src('engine/cosmology')}';
import { CANONICAL_AXES } from '${src('types/axisRegistry')}';
import { CORE_TRAIT_DEFINITIONS } from '${src('data/core-trait-content')}';
import { RARITY_TIER_NAMES } from '${src('types/rarity')}';
import { POSSESSION_SUBCATEGORY_NAMES } from '${src('types/attachments')}';
import * as FX from '${src('data/effect-constants')}';
import * as BANDS from '${src('data/item-stat-bands')}';
import { ARTIFACT_TRAIT_LEVEL_WORDS, ARTIFACT_STORIED_TRAIT_ID, ARTIFACT_CURSED_TRAIT_ID, ARTIFACT_STORIED_MAX_LEVEL } from '${src('data/artifact-trait-content')}';
import { SLOT_CAPS } from '${src('data/attachment-slot-constants')}';
import { REGION_NAME_FRAGMENTS } from '${src('data/region-name-content')}';
import { QUINTESSENCE_PASSIVE_REGEN } from '${src('types/quintessence')}';

const pickCondition = (n) => ({
  id: n.id, name: n.name,
  tags: (n.properties && n.properties.tags) || [],
  description: (n.properties && n.properties.description) || '',
  domainContributions: (n.properties && n.properties.domainContributions) || {},
});

export default {
  extractedFrom: '${REPO}',
  SPHERE_VOCABULARY,
  ARTIFACT_LORE_PATTERNS,
  CULTURE_NAME_FRAGMENTS,
  WORK_ROOTS_BY_REACH,
  WORK_ROOTS_BY_FOUNDATION,
  DOMAIN_WORD_SCALES,
  FACTION_VOICE_BIBLE: FACTION_VOICE_BIBLE.map(v => ({ factionDefId: v.factionDefId, tagline: v.tagline, lexicon: v.lexicon, neverUse: v.neverUse })),
  FACTIONS: [...FACTION_DEFINITIONS.values()].map(f => ({ id: f.id, name: f.nameTemplate, motto: f.motto, reachWeights: f.reachWeights, factionType: f.factionType })),
  MONSTER_FACTIONS: MONSTER_FACTION_DEFINITIONS.map(f => ({ id: f.id, name: f.nameTemplate, reachWeights: f.reachWeights, factionType: f.factionType })),
  AGENT_CONDITIONS: CONDITION_TRAIT_DEFINITIONS.filter(n => !String(n.id).includes('.location.')).map(pickCondition),
  REWARD_CONDITIONS: REWARD_CONDITIONS.map(pickCondition),
  CATALOG_ITEM_NAMES: REWARD_POSSESSIONS.map(n => ({ id: n.id, name: n.name, tier: n.properties && n.properties.tier, subcategory: n.properties && n.properties.subcategory })),
  CONTENT_TAGS: CONTENT_TAGS.map(t => ({ tag: t.tag, axis: t.axis, kinds: t.kinds || null })),
  REACH_TAG_DESCRIPTIONS,
  SPHERE_TAG_DESCRIPTIONS,
  SPHERE_OPPOSITES,
  SPHERE_ALLIES,
  AXES: CANONICAL_AXES.map(a => ({ reach: a.reachDomain, valuePair: a.valuePair, virtue: a.virtue, vice: a.vice })),
  CORE_TRAITS: CORE_TRAIT_DEFINITIONS.map(n => ({ id: n.id, name: n.name })),
  RARITY_TIER_NAMES,
  POSSESSION_SUBCATEGORY_NAMES,
  EFFECT_CAPS: {
    EFFECT_PER_ITEM_CAP: FX.EFFECT_PER_ITEM_CAP,
    EFFECT_MODIFIER_CAP: FX.EFFECT_MODIFIER_CAP,
    MAX_EFFECTS_PER_ATTACHMENT: FX.MAX_EFFECTS_PER_ATTACHMENT,
    ACTION_TRIGGER_MAX_PER_ATTACHMENT: FX.ACTION_TRIGGER_MAX_PER_ATTACHMENT,
    AURA_MAX_RADIUS: FX.AURA_MAX_RADIUS,
    RULE_OVERRIDE_VALUE_CAP: FX.RULE_OVERRIDE_VALUE_CAP,
  },
  ITEM_STAT_BANDS: { MINOR: BANDS.ITEM_STAT_BAND_MINOR, NOTABLE: BANDS.ITEM_STAT_BAND_NOTABLE, LEGENDARY: BANDS.ITEM_STAT_BAND_LEGENDARY },
  ARTIFACT_TRAITS: { STORIED: ARTIFACT_STORIED_TRAIT_ID, CURSED: ARTIFACT_CURSED_TRAIT_ID, STORIED_MAX_LEVEL: ARTIFACT_STORIED_MAX_LEVEL, LEVEL_WORDS: ARTIFACT_TRAIT_LEVEL_WORDS },
  SLOT_CAPS,
  REGION_NAME_FRAGMENTS,
  QUINTESSENCE_PASSIVE_REGEN,
};
`;

const entryPath = join(BUILD, 'entry.ts');
writeFileSync(entryPath, entry);

const require = createRequire(`${REPO}/package.json`);
const esbuild = require('esbuild');

const outfile = join(BUILD, 'extract.bundle.mjs');
await esbuild.build({
  entryPoints: [entryPath],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  logLevel: 'warning',
  define: {
    'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production' }),
  },
});

const mod = await import(pathToFileURL(outfile).href);
const vocab = mod.default;
const outJson = join(HERE, 'world-vocab.json');
writeFileSync(outJson, JSON.stringify(vocab, null, 2));

const counts = Object.fromEntries(Object.entries(vocab).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v === 'object' && v ? Object.keys(v).length : v]));
console.log('wrote', outJson);
console.log(counts);
