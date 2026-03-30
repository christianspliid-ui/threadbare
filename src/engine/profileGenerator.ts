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
import { QUOTE_TEMPLATES, SPHERE_FLAVOR, ORIGIN_TEMPLATES, MIDDLE_TEMPLATES, CLOSING_TEMPLATES } from '../data/profile-content';

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
