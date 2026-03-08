/**
 * Profile Generator — generates quotes, backstory, and portrait prompts
 * for agents using template-based generation with seeded PRNG.
 *
 * This is the hybrid layer (template → enhanced) from the content strategy.
 * No LLM calls — all generation uses content pools + PRNG selection.
 *
 * Source: Docs/plans/2026-03-08-progressive-disclosure-design.md (Task 4)
 */

import { getArchetype } from '../data/archetype-content';

// ─── Types ───────────────────────────────────────────────────────

export interface AgentGeneratedContent {
  quotes: string[];
  backstory: string;
  portraitPrompt: string;
}

export interface QuoteParams {
  archetypeId: string;
  dominantValues: string[];
  primarySphere: string;
  name: string;
}

export interface BackstoryParams {
  archetypeId: string;
  cultureName: string;
  traitNames: string[];
  bondNames: string[];
  name: string;
  primarySphere: string;
}

export interface PortraitParams {
  archetypeId: string;
  cultureName: string;
  primarySphere: string;
  name: string;
}

// ─── Quote Templates ─────────────────────────────────────────────

const QUOTE_TEMPLATES = [
  '{name} once said: "Power is not taken — it is woven, thread by thread, from the silence between words."',
  '"The {sphere} teaches patience," {name} was known to say. "Even the longest night ends."',
  '"I did not choose this path," {name} once confessed. "The path chose me, and I was too {value} to refuse."',
  '"Let them call me {value}. Better that than forgotten."',
  '"In the {sphere}, I found what others seek in temples — a truth that does not flinch."',
  '"They will remember what I built, not what I destroyed."',
  '"Do not mistake my silence for weakness. I am simply deciding."',
  '"The threads of fate are thinner than you think. Pull too hard and they snap."',
  '"I have seen what lies beyond the veil. It is not darkness — it is patience."',
  '"Every bond I forge is a thread in the great weave. Every betrayal, a thread cut."',
  '"What is a kingdom but a story that enough people believe?"',
  '"The {sphere} does not care for your ambitions. But it rewards those who listen."',
];

const SPHERE_FLAVOR: Record<string, string> = {
  force: 'clash of arms',
  matter: 'weight of stone',
  energy: 'crackling light',
  life: 'pulse of growing things',
  mind: 'whisper of thought',
  spirit: 'echo of the divine',
  time: 'slow turn of ages',
  entropy: 'quiet unraveling',
  chaos: 'wild surge',
  order: 'perfect symmetry',
  light: 'radiance',
  darkness: 'deep shadow',
};

// ─── Backstory Templates ─────────────────────────────────────────

const ORIGIN_TEMPLATES = [
  '{name} was born among the {culture}, in a time when the world still remembered what it had lost.',
  'The {culture} tell stories of {name} — how even as a child, the threads of {sphere} clung to them.',
  'No one remembers when {name} first appeared among the {culture}. Some say they were always there, waiting.',
  'Before {name} earned their name, they were simply another soul of the {culture}, shaped by the land and its demands.',
];

const MIDDLE_TEMPLATES = [
  'Those who knew {name} spoke of their {trait} nature — a quality that set them apart from their peers. Their bond with {bond} defined much of what came next.',
  'It was {name}\'s {trait} character that first drew attention, and their connection to {bond} that sealed their fate.',
  'The {sphere} marked {name} early. Their {trait} ways made them both feared and admired, and {bond} became the axis around which their story turned.',
];

const CLOSING_TEMPLATES = [
  'Now {name} stands at a crossroads, their choices rippling through the weave of the world.',
  'What {name} will become is not yet written. But the threads are gathering, and the pattern grows clearer with each passing day.',
  'The world watches {name}, though it does not yet know why. The threads know. They always do.',
];

// ─── Helpers ─────────────────────────────────────────────────────

function pick<T>(arr: T[], prng: () => number): T {
  return arr[Math.floor(prng() * arr.length)];
}

// ─── Quote Generation ────────────────────────────────────────────

export function generateQuotes(params: QuoteParams, prng: () => number): string[] {
  const count = prng() < 0.5 ? 2 : 3;
  const sphereWord = SPHERE_FLAVOR[params.primarySphere] ?? params.primarySphere;
  const valueWord = params.dominantValues[0] ?? 'determined';

  // Shuffle templates via Fisher-Yates using PRNG
  const shuffled = [...QUOTE_TEMPLATES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count).map(template =>
    template
      .replace(/\{name\}/g, params.name)
      .replace(/\{sphere\}/g, sphereWord)
      .replace(/\{value\}/g, valueWord.toLowerCase())
  );
}

// ─── Backstory Generation ────────────────────────────────────────

export function generateBackstory(params: BackstoryParams, prng: () => number): string {
  const sphereWord = SPHERE_FLAVOR[params.primarySphere] ?? params.primarySphere;
  const trait = params.traitNames[0] ?? 'resolute';
  const bond = params.bondNames[0] ?? 'those they trusted';

  const origin = pick(ORIGIN_TEMPLATES, prng);
  const middle = pick(MIDDLE_TEMPLATES, prng);
  const closing = pick(CLOSING_TEMPLATES, prng);

  const replacer = (text: string) =>
    text
      .replace(/\{name\}/g, params.name)
      .replace(/\{culture\}/g, params.cultureName)
      .replace(/\{sphere\}/g, sphereWord)
      .replace(/\{trait\}/g, trait.toLowerCase())
      .replace(/\{bond\}/g, bond);

  return [replacer(origin), replacer(middle), replacer(closing)].join('\n\n');
}

// ─── Portrait Prompt Generation ──────────────────────────────────

export function generatePortraitPrompt(params: PortraitParams): string {
  const archetype = getArchetype(params.archetypeId);
  const archetypeName = archetype?.name ?? 'mysterious figure';
  const sphereWord = SPHERE_FLAVOR[params.primarySphere] ?? params.primarySphere;

  return `Dark fantasy portrait, Threadbare style. A ${archetypeName.toLowerCase()} of the ${params.cultureName}. Sphere-colored thread accents in ${sphereWord} tones. Dark background, dramatic lighting from below. Painterly, muted palette with concentrated magical highlights.`;
}
