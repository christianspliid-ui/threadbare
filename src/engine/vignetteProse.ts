/**
 * Vignette Prose Generation — sphere-flavored narrative for encounter vignettes.
 *
 * Generates four-part vignette content: scene, lens, stakes, and forecast.
 * Uses content tables with sphere-specific variants, selected via seeded PRNG.
 *
 * --- Constants ---
 * | Name                             | Default | Purpose                                |
 * |----------------------------------|---------|----------------------------------------|
 * | VIGNETTE_SCENE_MAX_SENTENCES     | 3       | Max sentences in scene section          |
 * | VIGNETTE_STAKES_MAX_SENTENCES    | 2       | Max sentences in stakes section         |
 * | VIGNETTE_LENS_VARIANTS_PER_SPHERE| 3       | Min variants per sphere for lens        |
 * | VIGNETTE_FORECAST_VARIANTS       | 3       | Min forecast variants per tier*sphere   |
 *
 * --- Fail-soft ---
 * | Failure                          | Fallback                              |
 * |----------------------------------|---------------------------------------|
 * | Sphere not in content table      | Use 'default' sphere-neutral content  |
 * | Agent node missing               | Use placeholder agent name            |
 * | Encounter node missing           | Use generic scene description         |
 * | No step narrative                | Use generic scene description         |
 *
 * --- PRNG ---
 * Seeded PRNG (mulberry32) for deterministic variant selection.
 * Seed = worldSeed + hash(agentId) + hash(encounterId) + stepIndex.
 */

import type { WorldGraph } from './graph';
import type { SphereName } from '../types/index';
import { mulberry32 } from '../lib/prng';

// --- Constants ---

export const VIGNETTE_SCENE_MAX_SENTENCES = 3;
export const VIGNETTE_STAKES_MAX_SENTENCES = 2;
export const VIGNETTE_LENS_VARIANTS_PER_SPHERE = 3;
export const VIGNETTE_FORECAST_VARIANTS = 3;

// --- Types ---

export interface VignetteContent {
  scene: string;
  lens: string;
  stakes: string;
  forecast: string;
}

export type ForecastTier = 'doomed' | 'perilous' | 'uncertain' | 'favorable' | 'fated';

// --- Forecast Classification ---

/**
 * Classify a probability into a narrative forecast tier.
 */
export function classifyForecast(probability: number): ForecastTier {
  if (probability < 0.15) return 'doomed';
  if (probability < 0.35) return 'perilous';
  if (probability < 0.65) return 'uncertain';
  if (probability < 0.85) return 'favorable';
  return 'fated';
}

// --- Content Tables ---

/** Sphere-flavored lens sentences. {agent} is replaced with agent name. */
const LENS_CONTENT: Record<string, string[]> = {
  force: [
    'You feel the collision building — two wills about to meet.',
    'Raw power gathers at the edges of the moment, pressing inward.',
    'The weight of impact hangs in the air, waiting to fall.',
  ],
  life: [
    'You sense the thread of {agent}\'s pulse — strong, but the trial is hungry.',
    'The fragile warmth of life flickers against the cold of what comes.',
    'Every breath {agent} draws feels borrowed from what follows.',
  ],
  mind: [
    '{agent}\'s thoughts sharpen to a single bright point of purpose.',
    'You read the calculations racing behind {agent}\'s eyes — fear and resolve in equal measure.',
    'The patterns of thought crystallize into a single question: fight or yield.',
  ],
  entropy: [
    'The threads fray. The pattern demands a sacrifice.',
    'You see the endings gathering at the edges — some final, some merely painful.',
    'Decay whispers through the moment, promising transformation through loss.',
  ],
  default: [
    'The moment hangs suspended, awaiting resolution.',
    'Something shifts in the fabric of events — you feel the change approaching.',
    'The world holds its breath around {agent}.',
  ],
};

/** Forecast descriptors by tier and sphere. */
const FORECAST_CONTENT: Record<string, Record<ForecastTier, string[]>> = {
  force: {
    doomed: ['The force arrayed is overwhelming.', 'No strength can withstand this.', 'The blow is already falling.'],
    perilous: ['The blow will be hard to withstand.', 'Momentum favors the opposition.', 'Brute force alone may not suffice.'],
    uncertain: ['The forces are evenly matched.', 'Neither side holds the advantage.', 'The balance of power trembles.'],
    favorable: ['Momentum is on {agent}\'s side.', 'Strength surges where it is needed.', 'The tide of force shifts favorably.'],
    fated: ['Nothing can stop this force.', 'The outcome was written in iron.', 'Unstoppable momentum carries the day.'],
  },
  life: {
    doomed: ['The flame gutters.', 'Life ebbs where it should flow.', 'The vital thread stretches thin.'],
    perilous: ['The roots strain against the storm.', 'Vitality drains faster than it can be restored.', 'The body falters under the burden.'],
    uncertain: ['Growth and decay are balanced.', 'Life and its opposite are evenly poised.', 'The living pulse neither strengthens nor fades.'],
    favorable: ['Vitality surges through {agent}.', 'The roots hold firm against the wind.', 'Life reasserts itself with quiet force.'],
    fated: ['Life insists.', 'Nothing so vital can be extinguished here.', 'The living force is irresistible.'],
  },
  mind: {
    doomed: ['Clarity fractures under pressure.', 'The mind cannot find purchase.', 'Thought dissolves into chaos.'],
    perilous: ['Focus wavers at the crucial moment.', 'The mind races but finds no solution.', 'Doubt creeps in at the edges of thought.'],
    uncertain: ['Intellect and instinct war for dominance.', 'The answer hovers just out of reach.', 'The mind turns the problem endlessly.'],
    favorable: ['Clarity cuts through the noise.', 'The solution presents itself with elegant precision.', '{agent}\'s mind seizes the crucial insight.'],
    fated: ['The answer was always there, waiting.', 'Perfect clarity. Perfect timing.', 'The mind was made for this exact moment.'],
  },
  entropy: {
    doomed: ['The threads have already frayed.', 'Entropy has decided.', 'The pattern unravels beyond repair.'],
    perilous: ['Endings gather at the edges.', 'The pattern strains toward dissolution.', 'Decay accelerates as the moment approaches.'],
    uncertain: ['The pattern could break either way.', 'Entropy and order are perfectly balanced.', 'The moment of collapse or crystallization approaches.'],
    favorable: ['The pattern holds, for now.', 'Entropy recedes before a stronger order.', 'The threads weave tighter, not looser.'],
    fated: ['The pattern demands this outcome.', 'What must be, will be.', 'Entropy itself serves the greater design.'],
  },
  default: {
    doomed: ['The outcome is nearly written.', 'Hope thins to a thread.', 'The odds stand firmly opposed.'],
    perilous: ['The currents run against {agent}.', 'The path ahead is treacherous.', 'Danger outweighs opportunity.'],
    uncertain: ['The outcome trembles on a knife\'s edge.', 'Neither fate nor will holds dominance.', 'The moment could tip either way.'],
    favorable: ['The threads favor {agent}.', 'Fortune leans toward success.', 'The way ahead opens.'],
    fated: ['This was always going to happen.', 'Fate has already decided.', 'The outcome was never in doubt.'],
  },
};

/** Scene templates when specific encounter data is unavailable */
const GENERIC_SCENES: string[] = [
  '{agent} faces the trial ahead, resolve hardening against uncertainty.',
  'The moment of truth arrives for {agent} — what was theoretical becomes immediate.',
  '{agent} stands at the threshold between preparation and consequence.',
];

/** Stakes templates */
const STAKES_TEMPLATES: string[] = [
  'Success means progress along the path. Failure means setback and scars.',
  'What {agent} gains or loses here will echo forward through the story.',
  'The stakes are simple: overcome, or be overcome.',
];

// --- Helper ---

/**
 * Simple string hash for seed combination.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash);
}

/**
 * Pick a random element from an array using PRNG.
 */
function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Replace {agent} placeholder with actual agent name.
 */
function fillAgent(text: string, agentName: string): string {
  return text.replace(/\{agent\}/g, agentName);
}

// --- Core Functions ---

/**
 * Generate a full vignette for an encounter moment.
 *
 * Produces four narrative parts: scene, lens, stakes, and forecast.
 * Uses seeded PRNG for deterministic variant selection.
 */
export function generateVignette(
  graph: WorldGraph,
  agentId: string,
  encounterId: string,
  stepId: string,
  ascendantSphere: SphereName,
  probability: number,
): VignetteContent {
  // Build deterministic seed
  const seed = hashString(agentId) + hashString(encounterId) + hashString(stepId);
  const rng = mulberry32(seed);

  // Resolve agent name
  const agentNode = graph.getNode(agentId);
  const agentName = agentNode?.name ?? 'the agent';

  // Resolve encounter step narrative
  // Note: we don't import encounter content here to avoid circular deps;
  // the scene falls back to generic templates
  const scene = fillAgent(pick(GENERIC_SCENES, rng), agentName);

  // Lens: sphere-flavored perception
  const lensPool = LENS_CONTENT[ascendantSphere] ?? LENS_CONTENT['default'];
  const lens = fillAgent(pick(lensPool, rng), agentName);

  // Stakes
  const stakes = fillAgent(pick(STAKES_TEMPLATES, rng), agentName);

  // Forecast
  const forecastTier = classifyForecast(probability);
  const forecastPool = (FORECAST_CONTENT[ascendantSphere] ?? FORECAST_CONTENT['default'])[forecastTier];
  const forecast = fillAgent(pick(forecastPool, rng), agentName);

  return { scene, lens, stakes, forecast };
}
