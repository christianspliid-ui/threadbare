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
  ProseShape,
  ShapedTemplate,
  VoiceMode,
  SphereVocabulary,
  ChronicleEntry,
} from '../types/narrative';
import { SPHERE_VOCABULARY, ROUTINE_TEMPLATES, NOTABLE_TEMPLATES, VALUE_FLAVORS } from '../data/narrative-content';
import { MAX_RARITY_TIER, PROSE_TIER_FLOOR_BY_RARITY } from '../data/rarity-constants';
import type { ValuePair } from '../types/agent';
import type { WorldGraph } from './graph';
import { emitTrace } from './traceBuffer';
import { getCulturalFlavorWords, pickCulturalWord } from './culturalProse';
import { gatherNarrativeContext, enrichProse } from './proseEnrichment';
import { DEFAULT_SHAPE_WEIGHTS, SHAPE_REROLL_LIMIT } from './narrative-constants';

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

// ─── Prose Event Counter ────────────────────────────────────────
// Monotonically increasing to avoid ID collisions across calls with the same seed.
let narrativeEventCounter = 0;

// ─── Shape Rotation State ────────────────────────────────────────
// Per event type: last shape chosen, used to avoid back-to-back identical shapes.
// Module-scope per-session — reset alongside narrativeEventCounter on game start.
const shapeRotation: Map<string, ProseShape> = new Map();

export function resetNarrativeEventCounter(): void {
  narrativeEventCounter = 0;
  shapeRotation.clear();
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

// ─── Same-Root Collision Guard ──────────────────────────────────

/**
 * Extract a stem-like root from a word by stripping common suffixes.
 * Not a full stemmer — just enough to catch obvious collisions
 * like "decaying"/"decay", "consuming"/"consumption", "crushing"/"crush".
 */
function wordRoot(word: string): string {
  return word.toLowerCase()
    .replace(/(?:ing|tion|sion|ment|ness|ous|ive|able|ible|ful|less|ly|ed|er|est|al|ial|ent|ant|ence|ance)$/, '');
}

/**
 * Check whether two words share a linguistic root.
 * Returns true for collisions like "decaying"/"decay", "consuming"/"consumption".
 */
function sharesRoot(a: string, b: string): boolean {
  const rootA = wordRoot(a);
  const rootB = wordRoot(b);
  if (rootA.length < 3 || rootB.length < 3) return false;
  return rootA === rootB || rootA.startsWith(rootB) || rootB.startsWith(rootA);
}

/** Max re-rolls when adj/noun collide on the same root. */
const COLLISION_REROLL_LIMIT = 3;

/**
 * Pick sphere words for adj, verb, noun — re-rolling noun if it
 * shares a linguistic root with adj (e.g. "decaying" + "decay").
 */
export function pickSphereWords(
  sphere: SphereName,
  seed: number,
): { adj: string; verb: string; noun: string } {
  const adj = pickSphereWord(sphere, 'adjectives', seed + 1);
  const verb = pickSphereWord(sphere, 'verbs', seed + 2);
  let noun = pickSphereWord(sphere, 'nouns', seed + 3);

  // Re-roll noun if it collides with adj
  let rerolls = 0;
  while (sharesRoot(adj, noun) && rerolls < COLLISION_REROLL_LIMIT) {
    rerolls++;
    noun = pickSphereWord(sphere, 'nouns', seed + 3 + rerolls * 7);
  }

  return { adj, verb, noun };
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

// ─── Shape Picker ────────────────────────────────────────────────

/**
 * Pick a template from the pool by shape weight, with adjacent-repeat avoidance.
 * Same seed + same rotation state = same output (deterministic).
 */
function weightedPick(
  pool: ShapedTemplate[],
  rng: () => number,
): ShapedTemplate {
  const byShape = new Map<ProseShape, ShapedTemplate[]>();
  for (const t of pool) {
    const bucket = byShape.get(t.shape);
    if (bucket) bucket.push(t);
    else byShape.set(t.shape, [t]);
  }
  const shapes = [...byShape.keys()];
  const rawWeights = shapes.map(s => DEFAULT_SHAPE_WEIGHTS[s] ?? 0);
  const total = rawWeights.reduce((a, b) => a + b, 0) || 1;

  let r = rng() * total;
  let chosenShape = shapes[shapes.length - 1];
  for (let i = 0; i < shapes.length; i++) {
    r -= rawWeights[i];
    if (r <= 0) { chosenShape = shapes[i]; break; }
  }

  const candidates = byShape.get(chosenShape)!;
  return candidates[Math.floor(rng() * candidates.length)];
}

function pickShape(pool: ShapedTemplate[], eventType: string, seed: number): ShapedTemplate {
  const rng = mulberry32(seed);
  const shapesPresent = new Set(pool.map(t => t.shape));
  const lastShape = shapeRotation.get(eventType);

  if (lastShape && shapesPresent.size > 1) {
    for (let i = 0; i < SHAPE_REROLL_LIMIT; i++) {
      const picked = weightedPick(pool, rng);
      if (picked.shape !== lastShape) {
        shapeRotation.set(eventType, picked.shape);
        return picked;
      }
    }
  }
  const picked = weightedPick(pool, rng);
  shapeRotation.set(eventType, picked.shape);
  return picked;
}

// ─── Fallback Placeholder Resolution ─────────────────────────────

function applyFallbacks(text: string, context: ProseContext): string {
  return text
    .replace(/\{name\}/g, context.actorName ?? 'the actor')
    .replace(/\{actor\}/g, context.actorName ?? 'the actor')
    .replace(/\{target\}/g, context.targetName ?? context.locationName ?? 'the target')
    .replace(/\{location\}/g, context.locationName ?? 'the wilderness')
    .replace(/\{they\}/g, 'they').replace(/\{them\}/g, 'them').replace(/\{their\}/g, 'their')
    .replace(/\{They\}/g, 'They').replace(/\{Them\}/g, 'Them').replace(/\{Their\}/g, 'Their')
    .replace(/\{\?has_\w+\}[\s\S]*?\{\/has_\w+\}/g, '')
    .replace(/\{\?no_\w+\}([\s\S]*?)\{\/no_\w+\}/g, '$1');
}

// ─── Tier 1: Routine Template Stitching ──────────────────────────

export function generateRoutineProse(
  eventType: NarrativeEventType,
  context: ProseContext,
  seed: number,
  graph?: WorldGraph,
): ProseFragment {
  const sphere = context.sphere ?? 'force';
  const templates = ROUTINE_TEMPLATES[eventType] ?? ROUTINE_TEMPLATES.action_resolved;
  const shaped = pickShape(templates, eventType, seed);

  let { adj, verb, noun } = pickSphereWords(sphere, seed);

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

  // Sphere-word substitution always applied first
  let text = shaped.template
    .replace(/\{adj\}/g, adj)
    .replace(/\{verb\}/g, verb)
    .replace(/\{noun\}/g, noun);

  // Enrichment path vs safe fallback
  const placeholdersResolved: string[] = [];
  let fallbackReason: 'no_graph' | 'no_actor_id' | undefined;

  if (graph && context.actorId) {
    try {
      const ctx = gatherNarrativeContext(graph, context.actorId);
      text = text.replace(/\{target\}/g, context.targetName ?? context.locationName ?? 'the world');
      text = enrichProse(text, ctx);
      if (/{name}/.test(shaped.template)) placeholdersResolved.push('name');
      if (/{location}/.test(shaped.template)) placeholdersResolved.push('location');
      if (/\{\?has_faction\}/.test(shaped.template)) placeholdersResolved.push('has_faction');
      if (/\{\?has_ally\}/.test(shaped.template)) placeholdersResolved.push('has_ally');
    } catch {
      fallbackReason = 'no_actor_id';
      text = applyFallbacks(text, context);
    }
  } else {
    fallbackReason = graph ? 'no_actor_id' : 'no_graph';
    text = applyFallbacks(text, context);
  }

  // Residual strip — never leak raw {foo} tokens to players
  text = text.replace(/\{[^}]+\}/g, '');

  emitTrace({
    tick: 0,
    category: 'narrative_generation',
    agentId: context.actorId,
    summary: `Routine prose: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`,
    tier: 'routine',
    sphereWords: [adj, verb, noun].filter(Boolean),
    culturalFlavorApplied,
    finalProse: text,
    shape: shaped.shape,
    placeholdersResolved,
    fallbackReason,
  });

  return {
    text,
    voice: getVoice(eventType),
    tier: 'routine',
    eventId: `evt_prose_${seed}_${narrativeEventCounter++}`,
    sphereColoring: sphere,
    shape: shaped.shape,
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

  let { adj, verb, noun } = pickSphereWords(sphere, seed + 10);
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
    eventId: `evt_prose_${seed}_${narrativeEventCounter++}`,
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

const TIER_WEIGHT: Record<NarrativeTier, number> = {
  routine: 1,
  notable: 2,
  chronicle: 3,
};

function resolveRarityFloor(eventType: NarrativeEventType, rarityTier?: number): NarrativeTier | null {
  if (rarityTier === undefined) return null;
  if (!Number.isFinite(rarityTier) || rarityTier < 0 || rarityTier > MAX_RARITY_TIER) {
    console.warn(
      `[narrative] classifyEvent received invalid rarityTier=${String(rarityTier)} for eventType=${eventType}; falling back to base tier.`,
    );
    return null;
  }
  return PROSE_TIER_FLOOR_BY_RARITY[rarityTier as 0 | 1 | 2 | 3 | 4] ?? null;
}

/** Classify an event's narrative tier based on type/tags plus optional rarity floor. */
export function classifyEvent(
  eventType: NarrativeEventType,
  tags: string[],
  rarityTier?: number,
  subjectId?: string,
): NarrativeTier {
  if (tags.includes('legendary') || tags.includes('world_shaking')) return 'chronicle';

  const baseTier = EVENT_TIER_MAP[eventType] ?? 'routine';
  const rarityFloor = resolveRarityFloor(eventType, rarityTier);
  if (!rarityFloor) return baseTier;

  const biasedTier = TIER_WEIGHT[rarityFloor] > TIER_WEIGHT[baseTier] ? rarityFloor : baseTier;
  if (biasedTier !== baseTier) {
    emitTrace({
      tick: 0,
      category: 'prose_rarity_bias',
      agentId: subjectId,
      summary: `Rarity floor elevated prose tier ${baseTier}→${biasedTier} (${eventType})`,
      eventType,
      subjectId,
      rarityTier: rarityTier as number,
      baseTier,
      biasedTier,
      tags,
    });
  }

  return biasedTier;
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
