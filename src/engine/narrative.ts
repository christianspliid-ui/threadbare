/**
 * Narrative Prose Engine — hybrid layered prose generation.
 *
 * Tier 1 (Routine): Template-stitched from pre-authored fragments.
 * Tier 2 (Notable): Enhanced templates with conditional clauses.
 * Tier 3 (Chronicle): Structured prompts for LLM generation.
 *
 * Cultural prose integration: When an actor belongs to a culture, the prose
 * can be subtly flavored (30% chance) with cultural vocabulary.
 */
import type { SphereName } from '../types/index';
import type {
  NarrativeEvent,
  NarrativeEventType,
  NarrativeTier,
  ProseFragment,
  ProseContext,
  VoiceMode,
  SphereVocabulary,
  ChronicleEntry,
} from '../types/narrative';
import { SPHERE_VOCABULARY, ROUTINE_TEMPLATES, NOTABLE_TEMPLATES, VALUE_FLAVORS } from '../data/narrative-content';
import type { ValuePair } from '../types/agent';
import type { WorldGraph } from './graph';
import { emitTrace } from './traceBuffer';
import { getCulturalFlavorWords, pickCulturalWord } from './culturalProse';

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

// ─── Cultural Flavor Application ────────────────────────────────────

/**
 * Apply cultural flavor words to prose.
 * 30% chance: substitute a sphere word with a cultural variant (if available).
 */
function applyCulturalFlavor(
  words: { adj: string; verb: string; noun: string },
  culturalFlavor: ReturnType<typeof getCulturalFlavorWords> | null,
  seed: number,
): { adj: string; verb: string; noun: string } {
  if (!culturalFlavor) return words;

  const rng = mulberry32(seed);
  const CULTURAL_FLAVOR_CHANCE = 0.3;

  return {
    adj: rng() < CULTURAL_FLAVOR_CHANCE && culturalFlavor.adjectives.length > 0
      ? pickCulturalWord(culturalFlavor.adjectives, seed)
      : words.adj,
    verb: rng() < CULTURAL_FLAVOR_CHANCE && culturalFlavor.verbs.length > 0
      ? pickCulturalWord(culturalFlavor.verbs, seed + 1)
      : words.verb,
    noun: rng() < CULTURAL_FLAVOR_CHANCE && culturalFlavor.phrases && culturalFlavor.phrases.length > 0
      ? pickCulturalWord(culturalFlavor.phrases, seed + 2)
      : words.noun,
  };
}

// ─── Tier 1: Routine Template Stitching ──────────────────────────

export function generateRoutineProse(
  eventType: NarrativeEventType,
  context: ProseContext,
  seed: number,
  graph?: WorldGraph,
): ProseFragment {
  const rng = mulberry32(seed);
  const sphere = context.sphere ?? 'force';
  const templates = ROUTINE_TEMPLATES[eventType] ?? ROUTINE_TEMPLATES.action_resolved;
  const template = templates[Math.floor(rng() * templates.length)];

  let adj = pickSphereWord(sphere, 'adjectives', seed + 1);
  let verb = pickSphereWord(sphere, 'verbs', seed + 2);
  let noun = pickSphereWord(sphere, 'nouns', seed + 3);

  // Apply cultural flavor if actor and graph provided
  let culturalFlavorApplied = false;
  if (graph && context.actorId) {
    const culturalFlavor = getCulturalFlavorWords(graph, context.actorId);
    if (culturalFlavor) {
      const flavored = applyCulturalFlavor({ adj, verb, noun }, culturalFlavor, seed + 100);
      adj = flavored.adj;
      verb = flavored.verb;
      noun = flavored.noun;
      culturalFlavorApplied = true;
    }
  }

  const text = template
    .replace(/\{actor\}/g, context.actorName ?? 'the actor')
    .replace(/\{target\}/g, context.targetName ?? context.locationName ?? 'the target')
    .replace(/\{adj\}/g, adj)
    .replace(/\{verb\}/g, verb)
    .replace(/\{noun\}/g, noun);

  emitTrace({
    tick: 0,
    category: 'narrative_generation',
    agentId: context.actorId,
    summary: `Routine prose: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`,
    tier: 'routine',
    sphereWords: [adj, verb, noun].filter(Boolean),
    culturalFlavorApplied,
    finalProse: text,
  });

  return {
    text,
    voice: getVoice(eventType),
    tier: 'routine',
    eventId: `evt_${seed}`,
    sphereColoring: sphere,
  };
}

// ─── Personality Flavoring ───────────────────────────────────────

function getPersonalityClause(values?: ValuePair[], seed?: number): string {
  if (!values || values.length === 0) return '';
  const rng = mulberry32(seed ?? 0);
  const value = values[Math.floor(rng() * values.length)];
  const flavors = VALUE_FLAVORS[value];
  if (!flavors || flavors.length === 0) return '';
  return ', ' + flavors[Math.floor(rng() * flavors.length)];
}

// ─── Tier 2: Notable Enhanced Templates ──────────────────────────

export function generateNotableProse(
  eventType: NarrativeEventType,
  context: ProseContext,
  seed: number,
  graph?: WorldGraph,
): ProseFragment {
  const rng = mulberry32(seed);
  const sphere = context.sphere ?? 'force';
  const templates = NOTABLE_TEMPLATES[eventType] ?? NOTABLE_TEMPLATES.action_critical;
  const template = templates[Math.floor(rng() * templates.length)];

  let adj = pickSphereWord(sphere, 'adjectives', seed + 10);
  let verb = pickSphereWord(sphere, 'verbs', seed + 20);
  let noun = pickSphereWord(sphere, 'nouns', seed + 30);
  const personality = getPersonalityClause(context.dominantValues, seed + 40);

  // Apply cultural flavor if actor and graph provided
  let culturalFlavorApplied = false;
  if (graph && context.actorId) {
    const culturalFlavor = getCulturalFlavorWords(graph, context.actorId);
    if (culturalFlavor) {
      const flavored = applyCulturalFlavor({ adj, verb, noun }, culturalFlavor, seed + 100);
      adj = flavored.adj;
      verb = flavored.verb;
      noun = flavored.noun;
      culturalFlavorApplied = true;
    }
  }

  const text = template
    .replace(/\{actor\}/g, context.actorName ?? 'the figure')
    .replace(/\{target\}/g, context.targetName ?? context.locationName ?? 'the world')
    .replace(/\{adj\}/g, adj)
    .replace(/\{verb\}/g, verb)
    .replace(/\{noun\}/g, noun)
    .replace(/\{personality\}/g, personality);

  emitTrace({
    tick: 0,
    category: 'narrative_generation',
    agentId: context.actorId,
    summary: `Notable prose: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`,
    tier: 'notable',
    sphereWords: [adj, verb, noun].filter(Boolean),
    personalityClause: personality || undefined,
    culturalFlavorApplied,
    finalProse: text,
  });

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

// ─── Content Pipeline ────────────────────────────────────────────

/** Event type → default tier classification */
const EVENT_TIER_MAP: Record<NarrativeEventType, NarrativeTier> = {
  action_resolved: 'routine',
  action_failed: 'routine',
  action_critical: 'notable',
  trait_acquired: 'notable',
  trait_lost: 'routine',
  tier_transition: 'notable',
  doom_escalation: 'chronicle',
  mandate_stage: 'chronicle',
  divine_intervention: 'routine',
  actor_death: 'notable',
  contested_action: 'notable',
};

/**
 * Classify an event's narrative tier based on its type and tags.
 */
export function classifyEvent(
  eventType: NarrativeEventType,
  tags: string[],
): NarrativeTier {
  if (tags.includes('legendary') || tags.includes('world_shaking')) return 'chronicle';
  return EVENT_TIER_MAP[eventType] ?? 'routine';
}

/**
 * Route a narrative event through the appropriate prose generator.
 */
export function routeEvent(
  event: NarrativeEvent,
  context: ProseContext,
  seed: number,
  graph?: WorldGraph,
): ProseFragment {
  const tier = event.tier;

  switch (tier) {
    case 'routine':
      return generateRoutineProse(event.eventType, context, seed, graph);
    case 'notable':
      return generateNotableProse(event.eventType, context, seed, graph);
    case 'chronicle':
      return {
        text: `[Chronicle: ${event.description}]`,
        voice: 'dramatic_present',
        tier: 'chronicle',
        eventId: event.id,
        sphereColoring: event.sphere,
      };
    default:
      return generateRoutineProse(event.eventType, context, seed, graph);
  }
}
