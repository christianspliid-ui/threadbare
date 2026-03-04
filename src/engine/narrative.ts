/**
 * Narrative Prose Engine — hybrid layered prose generation.
 *
 * Tier 1 (Routine): Template-stitched from pre-authored fragments.
 * Tier 2 (Notable): Enhanced templates with conditional clauses.
 * Tier 3 (Chronicle): Structured prompts for LLM generation.
 */
import type { SphereName } from '../types/index';
import type {
  NarrativeEventType,
  NarrativeTier,
  ProseFragment,
  ProseContext,
  VoiceMode,
  SphereVocabulary,
  ChronicleEntry,
} from '../types/narrative';
import { SPHERE_VOCABULARY } from '../types/narrative';
import type { ValuePair } from '../types/agent';

// ─── Seeded PRNG ─────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Sphere Word Picker ──────────────────────────────────────────

export function pickSphereWord(
  sphere: SphereName,
  category: keyof SphereVocabulary,
  seed: number,
): string {
  const words = SPHERE_VOCABULARY[sphere]?.[category] ?? ['unknown'];
  const rng = mulberry32(seed);
  return words[Math.floor(rng() * words.length)];
}

// ─── Voice Selection ─────────────────────────────────────────────

function getVoice(eventType: NarrativeEventType): VoiceMode {
  if (eventType === 'divine_intervention') return 'second_person';
  if (eventType === 'doom_escalation' || eventType === 'mandate_stage') return 'dramatic_present';
  return 'third_person_omniscient';
}

// ─── Tier 1: Routine Template Stitching ──────────────────────────

const ROUTINE_TEMPLATES: Record<string, string[]> = {
  action_resolved: [
    '{actor} {verb} toward {target}, a {adj} display of {noun}.',
    'With {adj} resolve, {actor} moved against {target}. The air hummed with {noun}.',
    '{actor} acted with {adj} purpose, their {noun} reshaping the fate of {target}.',
  ],
  action_failed: [
    '{actor} reached for {target}, but the effort dissolved into {noun}.',
    'The {adj} attempt by {actor} faltered, leaving only {noun} in its wake.',
  ],
  action_critical: [
    '{actor} {verb} with {adj} force, and {target} was forever changed by the {noun}.',
    'A {adj} moment — {actor} {verb} beyond all expectation, and {noun} reshaped the world.',
  ],
  trait_acquired: [
    'Something shifted within {actor}. A new {noun} took root — {adj} and undeniable.',
    '{actor} emerged changed, bearing the mark of {adj} {noun}.',
  ],
  tier_transition: [
    'The bond between {actor} and the divine deepened, {adj} {noun} flowing through them.',
  ],
  divine_intervention: [
    'You reached into the dream of {actor}, a {adj} whisper carrying {noun}.',
    'You stirred the {noun} within {actor}, a {adj} touch upon their sleeping mind.',
  ],
  contested_action: [
    'Two forces clashed over {target} — {adj} {noun} against {adj} resolve.',
  ],
  actor_death: [
    '{actor} fell, their last breath a {adj} exhalation of {noun}.',
  ],
  doom_escalation: [
    'The world {verb}. {adj} {noun} spreads across the land.',
  ],
  mandate_stage: [
    'A threshold is crossed. The {adj} {noun} of destiny draws nearer.',
  ],
  trait_lost: [
    'Something faded within {actor}. The {adj} {noun} dimmed and was gone.',
  ],
};

export function generateRoutineProse(
  eventType: NarrativeEventType,
  context: ProseContext,
  seed: number,
): ProseFragment {
  const rng = mulberry32(seed);
  const sphere = context.sphere ?? 'force';
  const templates = ROUTINE_TEMPLATES[eventType] ?? ROUTINE_TEMPLATES.action_resolved;
  const template = templates[Math.floor(rng() * templates.length)];

  const adj = pickSphereWord(sphere, 'adjectives', seed + 1);
  const verb = pickSphereWord(sphere, 'verbs', seed + 2);
  const noun = pickSphereWord(sphere, 'nouns', seed + 3);

  const text = template
    .replace(/\{actor\}/g, context.actorName ?? 'the actor')
    .replace(/\{target\}/g, context.targetName ?? context.locationName ?? 'the target')
    .replace(/\{adj\}/g, adj)
    .replace(/\{verb\}/g, verb)
    .replace(/\{noun\}/g, noun);

  return {
    text,
    voice: getVoice(eventType),
    tier: 'routine',
    eventId: `evt_${seed}`,
    sphereColoring: sphere,
  };
}

// ─── Personality Flavoring ───────────────────────────────────────

const VALUE_FLAVORS: Partial<Record<ValuePair, string[]>> = {
  ambition_contentment: ['driven by ambition', 'fueled by relentless desire'],
  courage_prudence: ['with fearless resolve', 'bold beyond measure'],
  cruelty_compassion: ['tempered by compassion', 'with a gentle hand'],
  cunning_honesty: ['with cunning precision', 'through shrewd calculation'],
  devotion_independence: ['bound by devotion', 'answering a higher call'],
  loyalty_treachery: ['loyal to the last', 'with unwavering fidelity'],
  tradition_innovation: ['embracing new paths', 'breaking with the old ways'],
  dominance_humility: ['commanding all before them', 'asserting dominion'],
  wrath_patience: ['with patient deliberation', 'measured and calm'],
  greed_generosity: ['with open-handed generosity', 'sharing freely'],
};

function getPersonalityClause(values?: ValuePair[], seed?: number): string {
  if (!values || values.length === 0) return '';
  const rng = mulberry32(seed ?? 0);
  const value = values[Math.floor(rng() * values.length)];
  const flavors = VALUE_FLAVORS[value];
  if (!flavors || flavors.length === 0) return '';
  return ', ' + flavors[Math.floor(rng() * flavors.length)];
}

// ─── Tier 2: Notable Enhanced Templates ──────────────────────────

const NOTABLE_TEMPLATES: Record<string, string[]> = {
  action_critical: [
    'In a moment that would echo through memory, {actor} {verb} against {target}{personality}. The very air trembled with {adj} {noun}, and those who witnessed it knew the world had shifted.',
    '{actor}{personality} stood at the threshold of legend. With {adj} determination, they {verb} — and {target} was forever transformed by the {noun} unleashed.',
  ],
  trait_acquired: [
    'Something profound awakened within {actor}{personality}. Like {adj} {noun} breaking through winter soil, a new aspect of their being emerged — one that would define the chapters yet to come.',
    '{actor} was changed{personality}. The {adj} mark of {noun} settled upon them, indelible as starlight, shaping all that would follow.',
  ],
  doom_escalation: [
    'The world shudders. Across {target}, {adj} {noun} seeps through the cracks of reality{personality}. Those with eyes to see recognize the signs — the {noun} draws closer.',
    'A tremor passes through the fabric of existence. In {target}, {adj} portents multiply — {noun} gathering like stormclouds on the horizon.',
  ],
  tier_transition: [
    'The divine bond between {actor} and the unseen deepens{personality}. {adj} {noun} courses through their veins now, marking them as something more than mortal.',
  ],
  divine_intervention: [
    'You reach deeper than before into the consciousness of {actor}{personality}. This time the {adj} {noun} of your will leaves a lasting impression — their dreams will never be quite the same.',
  ],
};

export function generateNotableProse(
  eventType: NarrativeEventType,
  context: ProseContext,
  seed: number,
): ProseFragment {
  const rng = mulberry32(seed);
  const sphere = context.sphere ?? 'force';
  const templates = NOTABLE_TEMPLATES[eventType] ?? NOTABLE_TEMPLATES.action_critical;
  const template = templates[Math.floor(rng() * templates.length)];

  const adj = pickSphereWord(sphere, 'adjectives', seed + 10);
  const verb = pickSphereWord(sphere, 'verbs', seed + 20);
  const noun = pickSphereWord(sphere, 'nouns', seed + 30);
  const personality = getPersonalityClause(context.dominantValues, seed + 40);

  const text = template
    .replace(/\{actor\}/g, context.actorName ?? 'the figure')
    .replace(/\{target\}/g, context.targetName ?? context.locationName ?? 'the world')
    .replace(/\{adj\}/g, adj)
    .replace(/\{verb\}/g, verb)
    .replace(/\{noun\}/g, noun)
    .replace(/\{personality\}/g, personality);

  return {
    text,
    voice: getVoice(eventType),
    tier: 'notable',
    eventId: `evt_${seed}`,
    sphereColoring: sphere,
  };
}

// ─── Tier 3: Chronicle Prompt Builder ────────────────────────────

export function buildChronicleEntry(params: {
  id: string;
  title: string;
  actors: string[];
  location: string;
  sphere: SphereName;
  mood: string;
  tick: number;
  previousEvents?: string[];
}): ChronicleEntry {
  return {
    id: params.id,
    tier: 'chronicle',
    title: params.title,
    prose: '',
    promptContext: {
      actors: params.actors,
      location: params.location,
      sphere: params.sphere,
      mood: params.mood,
      previousEvents: params.previousEvents,
    },
    tick: params.tick,
  };
}
